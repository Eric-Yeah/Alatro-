import './core/index';
import { afterAll, describe, expect, it } from 'vitest';
import { DECKS } from './data/decks';
import { STAKES } from './data/stakes';
import { TROPHY, DECK_THRESHOLDS } from './data/trophies';
import { DECK_STAGES, DECK_TITLES, FREE_TITLES, LEAGUES, LEAGUE_THRESHOLDS, LEAGUE_TITLES, ROAD, ROAD_TITLES } from './data/trophyRoad';
import { HISTORY_MAX, RARITY_ORDER, type CosmeticRarity, type TrophyState } from './data/trophyTypes';
import { afterHand, buyCard, canBuyCard, cashOut, closePack, createRun, discardHand, leaveShop, playHand, selectBlind, skipBlind, type RunSetup } from './core/game';
import { BLIND_KINDS } from './core/blinds';
import type { RunState } from './core/run';
import { RngStreams } from './core/rng';
import { newProfile, observeRun, parseProfile, type Profile } from './profile';
import { mergeProfiles } from './syncBundle';
import { newTrophyState, parseTrophyState } from './trophyState';
import { applyDataLanguage } from './i18n/applyData';
import { setLang } from './i18n';
import {
  activeTitle, anteFactor, claimAll, claimEntry, claimableCount, deckStatus, equip, equippedId, isOwned, leagueIndexOf, leagueProgress,
  mergeTrophyState, observeTrophies, roadStatus, roundTrophies, stakeFactorOf, streakFactorFor, unlockHint, winTrophies,
  type RoundTrophyInput, type TrophyGain,
} from './trophies';

const NOW = 1_700_000_000_000;

const base = (over: Partial<RoundTrophyInput> = {}): RoundTrophyInput => ({
  ante: 1, blind: 'small', won: true, handsLeft: 0, score: 100, target: 100, stakeId: 'daemmerung', difficulty: null, daily: false, streakFactor: 1, ...over,
});

const cloneProfile = (p: Profile): Profile => parseProfile(JSON.parse(JSON.stringify(p)));
const cloneRun = (r: RunState): RunState => JSON.parse(JSON.stringify(r));
const sumOf = (ts: TrophyState) => Object.values(ts.byDeck).reduce((s, n) => s + n, 0);

// ─────────────────────────────────────────────── Verdienst

describe('Verdienst einer Runde', () => {
  it('steigt mit der Ante, der Boss bringt mehr als Small, Summe der Zeilen ist total', () => {
    let last = 0;
    for (let ante = 1; ante <= 14; ante++) {
      const r = roundTrophies(base({ ante, blind: 'boss' }));
      expect(r.total).toBeGreaterThan(last);
      expect(r.lines.reduce((s, l) => s + l.amount, 0)).toBe(r.total);
      last = r.total;
    }
    for (let ante = 1; ante <= 10; ante++) {
      const s = roundTrophies(base({ ante, blind: 'small' })).total;
      const b = roundTrophies(base({ ante, blind: 'big' })).total;
      const x = roundTrophies(base({ ante, blind: 'boss' })).total;
      expect(b).toBeGreaterThanOrEqual(s);
      expect(x).toBeGreaterThan(b);
    }
  });

  it('Basis und Ante Faktor entsprechen dem Plan, Endless setzt fort', () => {
    expect(roundTrophies(base({ ante: 1, blind: 'small' })).total).toBe(3);
    expect(roundTrophies(base({ ante: 1, blind: 'big' })).total).toBe(4);
    expect(roundTrophies(base({ ante: 1, blind: 'boss' })).total).toBe(6);
    expect(roundTrophies(base({ ante: 8, blind: 'boss' })).total).toBe(48);
    expect(anteFactor(8)).toBe(8);
    expect(anteFactor(9)).toBe(9.5);
    expect(anteFactor(12)).toBe(14);
    expect(anteFactor(0)).toBe(1);
  });

  it('verlorene Runde bringt 25 Prozent der Basis, mindestens 1, ohne Zuschläge', () => {
    const small = roundTrophies(base({ won: false, ante: 1, blind: 'small', daily: true, streakFactor: 1.2 }));
    expect(small.total).toBe(1);
    expect(small.lines).toEqual([{ kind: 'lostRound', amount: 1, ante: 1, blind: 'small' }]);
    const boss5 = roundTrophies(base({ won: false, ante: 5, blind: 'boss' }));
    expect(boss5.total).toBe(Math.round(6 * 3.75 * 0.25));
    expect(boss5.total).toBeLessThan(roundTrophies(base({ ante: 5, blind: 'boss' })).total);
  });

  it('Reserve: 10 Prozent je übrige Hand, Deckel 30 Prozent', () => {
    const at = (handsLeft: number) => roundTrophies(base({ ante: 4, blind: 'boss', handsLeft })); // Basis 16,5
    expect(at(0).total).toBe(Math.round(16.5));
    expect(at(2).total).toBe(Math.round(16.5 * 1.2));
    expect(at(3).total).toBe(Math.round(16.5 * 1.3));
    expect(at(9).total).toBe(at(3).total);
    expect(at(2).lines.find((l) => l.kind === 'reserve')?.percent).toBe(20);
    expect(at(9).lines.find((l) => l.kind === 'reserve')?.percent).toBe(30);
  });

  it('Überschuss: ab dem Doppelten des Ziels, +20 Prozent', () => {
    const at = (score: number) => roundTrophies(base({ ante: 4, blind: 'boss', score, target: 100 }));
    expect(at(199).lines.some((l) => l.kind === 'overkill')).toBe(false);
    expect(at(200).lines.some((l) => l.kind === 'overkill')).toBe(true);
    expect(at(200).total).toBe(Math.round(16.5 * 1.2));
    // Reserve und Überschuss addieren sich auf die Basis, sie vervielfachen sich nicht
    expect(roundTrophies(base({ ante: 4, blind: 'boss', score: 200, target: 100, handsLeft: 3 })).total).toBe(Math.round(16.5 * 1.5));
  });

  it('Stake Faktor: Leiter nach Stufe, Einsteigerstufe ohne Zuschlag, skalierende Stufe 1 plus 0,06 mal Stufe', () => {
    const t = (over: Partial<RoundTrophyInput>) => roundTrophies(base({ ante: 5, blind: 'boss', ...over }));
    const plain = t({}).total;
    expect(t({ stakeId: 'morgenrot' }).total).toBe(plain);
    expect(t({ stakeId: 'unbekannt' }).total).toBe(plain);
    let prev = plain;
    for (const s of STAKES.filter((x) => x.cumulative !== false).slice(1)) {
      const v = t({ stakeId: s.id }).total;
      expect(v, s.id).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(t({ stakeId: 'ewige_nacht' }).total).toBe(Math.round(22.5 * 1.8));
    expect(t({ stakeId: 'ewige_nacht' }).lines.find((l) => l.kind === 'stakeBonus')?.percent).toBe(80);
    expect(stakeFactorOf('skala', 10)).toBeCloseTo(1.6, 10);
    expect(t({ stakeId: 'skala', difficulty: 10 }).total).toBe(Math.round(22.5 * 1.6));
    // jede Stake der Leiter hat einen Faktor in den Daten
    for (const s of STAKES) expect(TROPHY.stakeFactors[s.id], s.id).toBeGreaterThanOrEqual(1);
  });

  it('Serie: 4 Prozent je Serie, Deckel 20 Prozent, eigene Zeile', () => {
    expect(streakFactorFor(0)).toBe(1);
    expect(streakFactorFor(1)).toBe(1.04);
    expect(streakFactorFor(5)).toBe(1.2);
    expect(streakFactorFor(99)).toBe(1.2);
    const r = roundTrophies(base({ ante: 5, blind: 'boss', streakFactor: 1.2 }));
    expect(r.total).toBe(Math.round(22.5 * 1.2));
    expect(r.lines.find((l) => l.kind === 'streakBonus')?.percent).toBe(20);
  });

  it('Tageslauf: +25 Prozent auf die Runde, eigene Zeile', () => {
    const r = roundTrophies(base({ ante: 5, blind: 'boss', daily: true }));
    expect(r.total).toBe(Math.round(22.5 * 1.25));
    expect(r.lines.find((l) => l.kind === 'dailyBonus')?.percent).toBe(25);
    expect(roundTrophies(base({ ante: 5, blind: 'boss' })).lines.some((l) => l.kind === 'dailyBonus')).toBe(false);
  });

  it('alle Zeilen sind ganze, positive Mengen', () => {
    for (const ante of [1, 3, 6, 9]) for (const blind of BLIND_KINDS) {
      const r = roundTrophies(base({ ante, blind, handsLeft: 2, score: 300, target: 100, stakeId: 'mitternacht', daily: true, streakFactor: 1.12 }));
      for (const l of r.lines) {
        expect(Number.isInteger(l.amount)).toBe(true);
        expect(l.amount).toBeGreaterThan(0);
      }
    }
  });

  it('Siegbonus 120 mit Stake Zuschlag', () => {
    expect(winTrophies({ stakeId: 'daemmerung', difficulty: null, daily: false, streakFactor: 1 }).total).toBe(120);
    expect(winTrophies({ stakeId: 'ewige_nacht', difficulty: null, daily: false, streakFactor: 1 }).total).toBe(216);
    expect(winTrophies({ stakeId: 'daemmerung', difficulty: null, daily: true, streakFactor: 1 }).total).toBe(150);
  });
});

// ─────────────────────────────────────────────── Verbuchen mit echten Zuständen

/** Wie die Oberfläche: erst die Statistik, dann die Pokale */
function see(p: Profile, run: RunState, now = NOW): TrophyGain | null {
  observeRun(p, run);
  return observeTrophies(p, run, now);
}

function newRun(seed: string, over: Partial<RunSetup> = {}): RunState {
  const run = createRun({ seed, deckId: 'nachthimmel', stakeId: 'daemmerung', ...over });
  run.runId = seed; // die Engine hängt die Startzeit an, für gleiche Läufe in Tests fest vergeben
  return run;
}

/** Gewonnene Runde mit der echten Engine: Zustand `roundWon`, beobachten, `cashOut`, beobachten, Shop verlassen */
function winStep(p: Profile, run: RunState, o: { hands?: number; mult?: number; now?: number } = {}): (TrophyGain | null)[] {
  if (run.phase === 'blindSelect') selectBlind(run);
  const r = run.round!;
  r.score = Math.ceil(r.target * (o.mult ?? 1));
  r.handsLeft = o.hands ?? 1;
  run.phase = 'roundWon';
  const g1 = see(p, run, o.now);
  cashOut(run);
  const g2 = see(p, run, o.now);
  if ((run.phase as string) === 'shop') leaveShop(run);
  return [g1, g2];
}

function loseStep(p: Profile, run: RunState, now = NOW): TrophyGain | null {
  if (run.phase === 'blindSelect') selectBlind(run);
  run.round!.score = 0;
  run.round!.handsLeft = 0;
  run.phase = 'gameOver';
  return see(p, run, now);
}

/** Spielt `rounds` Runden durch (Small, Big, Boss, nächste Ante ...) */
function winRounds(p: Profile, run: RunState, rounds: number, o: { hands?: number; mult?: number; now?: number } = {}) {
  for (let i = 0; i < rounds; i++) winStep(p, run, o);
}

describe('Verbuchen von Runden', () => {
  it('Rundensieg wird im Zustand roundWon verbucht, genau einmal', () => {
    const p = newProfile();
    const run = newRun('OBS00001');
    see(p, run); // legt nur den Run Stand an
    selectBlind(run);
    run.round!.score = run.round!.target;
    run.round!.handsLeft = 2;
    run.phase = 'roundWon';
    const g = see(p, run)!;
    expect(g.lines.find((l) => l.kind === 'round')).toEqual({ kind: 'round', amount: 3, ante: 1, blind: 'small' });
    expect(g.lines.find((l) => l.kind === 'reserve')?.percent).toBe(20);
    expect(g.amount).toBe(g.lines.reduce((s, l) => s + l.amount, 0));
    expect(g.total).toBe(p.trophies.total);
    expect(p.trophies.run!.credited).toEqual(['1:0']);
    expect(see(p, run)).toBeNull();
    // nach cashOut ändern sich Phase, Ante und Blind: nichts wird doppelt gezählt
    cashOut(run);
    expect(see(p, run)).toBeNull();
    leaveShop(run);
    expect(see(p, run)).toBeNull();
    expect(p.trophies.total).toBe(g.total);
  });

  it('Verlust im Zustand gameOver: Trost, Run Ende, Serie, Verlauf, nur einmal', () => {
    const p = newProfile();
    const run = newRun('OBS00002');
    winRounds(p, run, 3);
    const before = p.trophies.total;
    const g = loseStep(p, run)!;
    expect(g.runEnded).toBe(true);
    expect(g.lines.filter((l) => l.kind === 'lostRound')).toHaveLength(1);
    expect(p.trophies.total).toBe(before + g.amount);
    expect(p.trophies.history).toHaveLength(1);
    expect(p.trophies.history[0]).toMatchObject({ runId: run.runId, ante: 2, won: false, end: 'finished', deckId: 'nachthimmel' });
    expect(p.trophies.history[0].gained).toBe(p.trophies.run!.gained);
    expect(p.trophies.run!.ended).toBe(true);
    expect(see(p, run)).toBeNull();
    expect(see(p, run, NOW + 5)).toBeNull();
    expect(p.trophies.history).toHaveLength(1);
  });

  it('total ist immer die Summe von byDeck, Zeilen ergeben den Run Gewinn', () => {
    const p = newProfile();
    const a = newRun('OBS00003', { deckId: 'glut' });
    winRounds(p, a, 7);
    loseStep(p, a);
    const b = newRun('OBS00004', { deckId: 'tiefsee' });
    winRounds(p, b, 4, { hands: 3, mult: 2.5 });
    expect(p.trophies.total).toBe(sumOf(p.trophies));
    expect(Object.keys(p.trophies.byDeck).sort()).toEqual(['glut', 'tiefsee']);
    const runSum = p.trophies.run!.lines.reduce((s, l) => s + l.amount, 0);
    expect(runSum).toBe(p.trophies.run!.gained);
    expect(p.trophies.byDeck.tiefsee).toBe(runSum);
  });

  it('Reihenfolge von observeRun und observeTrophies ist egal', () => {
    const play = (order: 'runFirst' | 'trophiesFirst') => {
      const p = newProfile();
      const run = newRun('OBS00005');
      const obs = () => {
        if (order === 'runFirst') { observeRun(p, run); observeTrophies(p, run, NOW); } else { observeTrophies(p, run, NOW); observeRun(p, run); }
      };
      obs();
      for (let i = 0; i < 9; i++) {
        if (run.phase === 'blindSelect') selectBlind(run);
        run.round!.score = run.round!.target;
        run.phase = 'roundWon';
        obs();
        cashOut(run);
        obs();
        leaveShop(run);
        obs();
      }
      return p.trophies;
    };
    expect(play('runFirst')).toEqual(play('trophiesFirst'));
  });

  it('Neuladen mitten im Run ändert nichts (JSON Kopie von Profil und Run)', () => {
    const direct = newProfile();
    const reloaded = newProfile();
    let a = newRun('OBS00006', { deckId: 'alchemist' });
    let b = newRun('OBS00006', { deckId: 'alchemist' });
    let pa = direct;
    let pb = reloaded;
    for (let i = 0; i < 7; i++) {
      winStep(pa, a, { hands: i % 3, mult: i % 2 ? 2.2 : 1 });
      winStep(pb, b, { hands: i % 3, mult: i % 2 ? 2.2 : 1 });
      pb = cloneProfile(pb);
      b = cloneRun(b);
      see(pb, b);
      see(pb, b);
    }
    loseStep(pa, a);
    loseStep(pb, b);
    pb = cloneProfile(pb);
    b = cloneRun(b);
    see(pb, b);
    expect(pb.trophies).toEqual(pa.trophies);
    expect(pb.stats).toEqual(pa.stats);
  });

  it('Abbruch: ein neuer Run schließt den alten ohne Ende Bonus ab', () => {
    const p = newProfile();
    const a = newRun('OBS00007');
    winRounds(p, a, 6); // Ante 3 erreicht (Boss von Ante 2 geschafft)
    const total = p.trophies.total;
    const gainedA = p.trophies.run!.gained;
    const b = newRun('OBS00008', { deckId: 'glut' });
    const g = see(p, b);
    expect(g).not.toBeNull();
    expect(g!.runEnded).toBe(false);
    expect(g!.amount).toBe(0);
    expect(p.trophies.total).toBe(total);
    expect(p.trophies.history).toHaveLength(1);
    expect(p.trophies.history[0]).toMatchObject({ runId: a.runId, end: 'abandoned', won: false, gained: gainedA, ante: 2 });
    expect(p.trophies.run!.runId).toBe(b.runId);
    expect(see(p, b)).toBeNull();
    // Serie: Abbruch unter Ante 4 setzt sie auf 0
    expect(p.trophies.streak).toBe(0);
  });

  it('Abbruch ohne verbuchte Runde hinterlässt keinen Verlauf Eintrag und ändert die Serie nicht', () => {
    const p = newProfile();
    p.trophies.streak = 3;
    p.trophies.bestStreak = 3;
    see(p, newRun('OBS00009'));
    see(p, newRun('OBS0000A'));
    expect(p.trophies.history).toHaveLength(0);
    expect(p.trophies.streak).toBe(3);
  });

  it('Wiederaufnahme nach Abbruch: ein alter, abgeschlossener Run wird nicht noch einmal gezählt', () => {
    const p = newProfile();
    const a = newRun('OBS0000B');
    winRounds(p, a, 4);
    const snapshotA = cloneRun(a);
    see(p, newRun('OBS0000C'));
    const total = p.trophies.total;
    // der alte Run taucht wieder auf (zum Beispiel über den Sync) und steht im Zustand roundWon
    const back = cloneRun(snapshotA);
    selectBlind(back);
    back.round!.score = back.round!.target;
    back.phase = 'roundWon';
    const g = see(p, back);
    expect(g?.amount ?? 0).toBe(0);
    expect(p.trophies.total).toBe(total);
    expect(p.trophies.history.filter((h) => h.runId === a.runId)).toHaveLength(1);
    expect(see(p, back)).toBeNull();
  });

  it('Einmal Bonus: Rekord Ante je Ante, nur über der bisher höchsten Ante des Spielers', () => {
    const p = newProfile();
    p.stats.bestAnte = 3;
    const run = newRun('OBS0000D');
    const lines: { kind: string; ante?: number; amount: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const [g1] = winStep(p, run);
      lines.push(...(g1?.lines ?? []));
    }
    const records = lines.filter((l) => l.kind === 'newBestAnte');
    expect(records.map((l) => l.ante)).toEqual([4]);
    expect(records.map((l) => l.amount)).toEqual([TROPHY.bestAnteBonus]);
    // nächster Run: Ante 4 ist jetzt keine neue Bestmarke mehr
    const run2 = newRun('OBS0000E');
    const second: { kind: string; ante?: number }[] = [];
    for (let i = 0; i < 18; i++) second.push(...(winStep(p, run2)[0]?.lines ?? []));
    // Ante 5 wurde im ersten Run schon erreicht (Blind Auswahl nach dem Boss von Ante 4), neu ist erst Ante 6
    expect(second.filter((l) => l.kind === 'newBestAnte').map((l) => l.ante)).toEqual([6]);
  });

  it('Rekord: auch ein Sprung über mehrere Ante zahlt jede einmal', () => {
    const p = newProfile();
    const run = newRun('OBS0000F');
    selectBlind(run);
    run.ante = 5;
    run.round!.score = run.round!.target;
    run.phase = 'roundWon';
    const g = see(p, run)!;
    expect(g.lines.find((l) => l.kind === 'newBestAnte')).toMatchObject({ ante: 5, amount: 5 * TROPHY.bestAnteBonus });
  });

  it('Run Sieg: Siegbonus und Premiere genau einmal, Serie zählt, zweiter Sieg mit dem Deck ohne Premiere', () => {
    const p = newProfile();
    const run = newRun('WIN00001', { deckId: 'halbmond' });
    let ended: TrophyGain | null = null;
    for (let i = 0; i < 24; i++) {
      const [g1, g2] = winStep(p, run);
      expect(g1?.runEnded ?? false).toBe(false);
      if (g2?.runEnded) ended = g2;
    }
    expect(run.won).toBe(true);
    expect(ended).not.toBeNull();
    expect(ended!.lines.filter((l) => l.kind === 'winBonus')).toEqual([{ kind: 'winBonus', amount: 120 }]);
    expect(ended!.lines.filter((l) => l.kind === 'deckFirstWin')).toEqual([{ kind: 'deckFirstWin', amount: 150 }]);
    expect(p.trophies.streak).toBe(1);
    expect(p.trophies.history[0]).toMatchObject({ won: true, ante: 8, end: 'finished' });
    expect(Object.keys(p.trophies.deckFirstWin)).toEqual(['halbmond']);
    expect(see(p, run)).toBeNull();
    expect(p.trophies.total).toBe(p.trophies.run!.gained);
    // Richtwert aus dem Plan: Sieg auf der Grundstufe etwa 550 bis 650 (ohne die einmaligen Prämien Premiere und Rekord)
    const regular = p.trophies.run!.lines.filter((l) => l.kind !== 'deckFirstWin' && l.kind !== 'newBestAnte').reduce((s, l) => s + l.amount, 0);
    expect(regular).toBeGreaterThan(520);
    expect(regular).toBeLessThan(650);

    const run2 = newRun('WIN00002', { deckId: 'halbmond' });
    const all: string[] = [];
    for (let i = 0; i < 24; i++) for (const g of winStep(p, run2)) all.push(...(g?.lines ?? []).map((l) => l.kind));
    expect(all.filter((k) => k === 'winBonus')).toHaveLength(1);
    expect(all.filter((k) => k === 'deckFirstWin')).toHaveLength(0);
    expect(all.filter((k) => k === 'newBestAnte')).toHaveLength(0);
    expect(p.trophies.streak).toBe(2);
    expect(p.trophies.bestStreak).toBe(2);
  });

  it('Endless nach dem Sieg: weitere Runden zählen, Niederlage danach ändert Serie und Verlauf Run nicht doppelt', () => {
    const p = newProfile();
    const run = newRun('WIN00003');
    for (let i = 0; i < 24; i++) winStep(p, run);
    const afterWin = p.trophies.total;
    expect(p.trophies.streak).toBe(1);
    winRounds(p, run, 2); // Ante 9
    expect(p.trophies.total).toBeGreaterThan(afterWin);
    const g = loseStep(p, run)!;
    expect(g.runEnded).toBe(false);
    expect(g.lines.some((l) => l.kind === 'lostRound')).toBe(true);
    expect(p.trophies.streak).toBe(1);
    expect(p.trophies.history).toHaveLength(1);
    expect(p.trophies.history[0].gained).toBe(p.trophies.run!.gained);
    expect(p.trophies.history[0].ante).toBe(9);
    expect(p.trophies.history[0].won).toBe(true);
    expect(p.trophies.total).toBe(sumOf(p.trophies));
  });

  it('Serie: Faktor wird beim Start des Runs festgehalten, Run ab Ante 4 zählt, darunter setzt auf 0', () => {
    const p = newProfile();
    // Run 1 endet bei Ante 4 (3 Antes geschafft)
    const r1 = newRun('STR00001');
    winRounds(p, r1, 9);
    loseStep(p, r1);
    expect(p.trophies.streak).toBe(1);
    // Run 2 beginnt mit Faktor 1,04, Ante 4 Small ist die erste Runde, in der 4 Prozent die Rundung ändern
    const r2 = newRun('STR00002');
    see(p, r2);
    expect(p.trophies.run!.streakFactor).toBe(1.04);
    winRounds(p, r2, 10, { hands: 0 });
    expect(p.trophies.run!.lines.filter((l) => l.kind === 'streakBonus').map((l) => l.percent)).toEqual([4]);
    loseStep(p, r2); // Ante 4, zählt
    expect(p.trophies.streak).toBe(2);
    // Run 3 beginnt mit 1,08 und endet vor Ante 4: Serie weg, bester Wert bleibt
    const r3 = newRun('STR00003');
    see(p, r3);
    expect(p.trophies.run!.streakFactor).toBe(1.08);
    winRounds(p, r3, 6);
    loseStep(p, r3);
    expect(p.trophies.streak).toBe(0);
    expect(p.trophies.bestStreak).toBe(2);
    const r4 = newRun('STR00004');
    see(p, r4);
    expect(p.trophies.run!.streakFactor).toBe(1);
  });

  it('Serie: Deckel 20 Prozent beim Start des Runs', () => {
    const p = newProfile();
    p.trophies.streak = 30;
    p.trophies.bestStreak = 30;
    see(p, newRun('STR00005'));
    expect(p.trophies.run!.streakFactor).toBe(1.2);
  });

  it('Tageslauf: Prämie einmal je Tag, +25 Prozent auf die Runden, Schlüssel ist das Datum', () => {
    const p = newProfile();
    const daily = { date: '2026-11-25', twistId: 'goldregen' };
    const a = newRun('DAY00001', { level: 4, daily });
    const [g1] = winStep(p, a);
    expect(g1!.lines.filter((l) => l.kind === 'dailyFirst')).toEqual([{ kind: 'dailyFirst', amount: TROPHY.dailyFirst }]);
    expect(g1!.lines.find((l) => l.kind === 'dailyBonus')).toMatchObject({ amount: 1, percent: 25 }); // 3 mal 1,25 gerundet 4
    const [g2] = winStep(p, a, { hands: 0 });
    expect(g2!.lines.find((l) => l.kind === 'dailyBonus')?.percent).toBe(25);
    expect(g2!.lines.some((l) => l.kind === 'dailyFirst')).toBe(false);
    expect(Object.keys(p.trophies.dailyPaid)).toEqual(['2026-11-25']);
    // zweiter Lauf am selben Tag: keine Prämie mehr
    const b = newRun('DAY00002', { level: 4, daily });
    const [h1] = winStep(p, b);
    expect(h1!.lines.some((l) => l.kind === 'dailyFirst')).toBe(false);
    // anderer Tag: wieder
    const c = newRun('DAY00003', { level: 4, daily: { date: '2026-11-26', twistId: 'vollmond' } });
    const [k1] = winStep(p, c);
    expect(k1!.lines.some((l) => l.kind === 'dailyFirst')).toBe(true);
    expect(Object.keys(p.trophies.dailyPaid)).toHaveLength(2);
  });

  it('Stake und Skalierung wirken im verbuchten Run', () => {
    const plain = newProfile();
    const hard = newProfile();
    const scaled = newProfile();
    const a = newRun('STK00001');
    const b = newRun('STK00001', { stakeId: 'ewige_nacht' });
    const c = newRun('STK00001', { level: 10 });
    for (const [p, r] of [[plain, a], [hard, b], [scaled, c]] as const) winRounds(p, r, 6, { hands: 0 });
    expect(hard.trophies.total).toBeGreaterThan(plain.trophies.total);
    expect(scaled.trophies.total).toBeGreaterThan(plain.trophies.total);
    expect(hard.trophies.run!.lines.some((l) => l.kind === 'stakeBonus')).toBe(true);
  });

  it('Liga Aufstieg und neu abholbare Einträge stehen im Gewinn', () => {
    const p = newProfile();
    const ts = p.trophies;
    ts.total = 545;
    ts.byDeck = { nachthimmel: 545 };
    const run = newRun('GAIN0001');
    const [g] = winStep(p, run, { hands: 0 });
    expect(g!.leagueFrom).toBe(0);
    expect(g!.leagueTo).toBe(1);
    expect(g!.newlyReady).toContain('road_2_1');
    expect(g!.newlyReady).not.toContain('road_2_2');
    // die Deck Stufe 1 liegt bei 60 und ist längst erreicht, aber nicht neu: schon vorher bereit
    expect(g!.newlyReady.some((id) => id.startsWith('deck_'))).toBe(false);
    expect(g!.total).toBe(ts.total);
  });

  it('Deck Stufen werden mit den Pokalen des Decks neu abholbar', () => {
    const p = newProfile();
    p.trophies.total = 1000;
    p.trophies.byDeck = { andere: 1000 };
    const run = newRun('GAIN0002', { deckId: 'glut' });
    p.trophies.byDeck.glut = 0;
    const gains: string[] = [];
    for (let i = 0; i < 9; i++) gains.push(...(winStep(p, run, { hands: 1 })[0]?.newlyReady ?? []));
    expect(gains).toContain('deck_glut_1');
    expect(gains).not.toContain('deck_glut_3');
    expect(gains.filter((x) => x === 'deck_glut_1')).toHaveLength(1);
  });

  it('Einführungsrunde und Run ohne Runde: erster Aufruf legt nur den Run Stand an', () => {
    const p = newProfile();
    const run = newRun('OBS0000G');
    const g = see(p, run);
    expect(g).not.toBeNull();
    expect(g!.amount).toBe(0);
    expect(p.trophies.total).toBe(0);
    expect(see(p, run)).toBeNull();
  });

  it('übersprungene Blinds zählen nichts', () => {
    const p = newProfile();
    const run = newRun('OBS0000H');
    see(p, run);
    skipBlind(run);
    if (run.phase === 'pack') closePack(run); // manche Tags öffnen sofort ein Pack
    expect(see(p, run)).toBeNull();
    expect(p.trophies.total).toBe(0);
    winStep(p, run); // Big von Ante 1
    expect(p.trophies.run!.credited).toEqual(['1:1']);
  });

  it('Verlauf bleibt auf HISTORY_MAX begrenzt', () => {
    const p = newProfile();
    for (let i = 0; i < HISTORY_MAX + 5; i++) {
      const r = newRun(`HIS${String(i).padStart(5, '0')}`);
      loseStep(p, r, NOW + i);
    }
    expect(p.trophies.history).toHaveLength(HISTORY_MAX);
    expect(p.trophies.history[HISTORY_MAX - 1].at).toBe(NOW + HISTORY_MAX + 4);
  });
});

// ─────────────────────────────────────────────── Echte Runs mit einem Bot

/** Kleiner Bot über die Aktionen der Engine: beste Hand per Vorschau, kauft zufällig Karten und Jokers */
function bestPlay(run: RunState) {
  const hand = run.round!.hand;
  const subsets: number[][] = [];
  const rec = (s: number, cur: number[]) => {
    if (cur.length > 0) subsets.push(cur);
    if (cur.length === 5) return;
    for (let i = s; i < hand.length; i++) rec(i + 1, [...cur, i]);
  };
  rec(0, []);
  let best: number[] = [];
  let bestScore = -1;
  for (const sub of subsets) {
    const copy = structuredClone(run);
    const ids = sub.map((i) => hand[i].id);
    const res = playHand(copy, ids);
    if (res.total > bestScore) { bestScore = res.total; best = ids; }
  }
  return { ids: best, score: bestScore };
}

/**
 * Ein Bot Run. `hook` wird nach jedem Schritt aufgerufen und darf Profil und Run ersetzen (Neuladen).
 * Gibt den Endzustand zurück.
 */
function botRun(setup: RunSetup, p0: Profile, hook: (p: Profile, run: RunState) => { p: Profile; run: RunState }) {
  let p = p0;
  let run = createRun(setup);
  run.runId = setup.seed;
  const rng = RngStreams.create('bot' + setup.seed);
  ({ p, run } = hook(p, run));
  let steps = 0;
  while (run.phase !== 'gameOver' && steps++ < 600 && run.ante <= 9) {
    switch (run.phase) {
      case 'blindSelect':
        if (BLIND_KINDS[run.blindIndex] !== 'boss' && rng.next('skip') < 0.15) skipBlind(run);
        else selectBlind(run);
        break;
      case 'round': {
        const r = run.round!;
        if (r.handsLeft > 0 && r.hand.length > 0) {
          const { ids, score } = bestPlay(run);
          const need = (r.target - r.score) / r.handsLeft;
          if (r.discardsLeft > 0 && score < need && r.drawPile.length > 0) {
            const keep = new Set(ids);
            const rest = r.hand.filter((c) => !keep.has(c.id)).slice(0, 5);
            if (rest.length) discardHand(run, rest.map((c) => c.id));
            else playHand(run, ids);
          } else playHand(run, ids);
        }
        afterHand(run);
        break;
      }
      case 'roundWon': cashOut(run); break;
      case 'shop': {
        for (let i = 0; i < run.shop!.cards.length; i++) if (canBuyCard(run, i) && rng.next('buy') < 0.7) buyCard(run, i);
        leaveShop(run);
        break;
      }
      default: throw new Error(`unerwartete Phase ${run.phase}`);
    }
    ({ p, run } = hook(p, run));
  }
  return { p, run };
}

describe('Echte Runs mit dem Bot', () => {
  const cases: [string, RunSetup][] = [
    ['BOT00001', { seed: 'BOT00001', deckId: 'nachthimmel', stakeId: 'daemmerung' }],
    ['BOT00002', { seed: 'BOT00002', deckId: 'tiefsee', stakeId: 'morgenrot' }],
    ['BOT00003', { seed: 'BOT00003', deckId: 'glut', level: 12 }],
    ['BOT00004', { seed: 'BOT00004', deckId: 'sternenkind', stakeId: 'mitternacht', daily: { date: '2026-11-25', twistId: 'sparflamme' } }],
  ];

  it('Zeilen ergeben total, kein Doppelzählen, Neuladen in jedem Schritt ändert nichts', () => {
    for (const [seed, setup] of cases) {
      const calls = { n: 0 };
      // A: ohne Neuladen, jeder Schritt wird zweimal beobachtet
      const a = botRun(setup, newProfile(), (p, run) => {
        calls.n++;
        see(p, run);
        see(p, run);
        const ts = p.trophies;
        expect(ts.total, `${seed} Schritt ${calls.n}`).toBe(sumOf(ts));
        expect(ts.run!.gained, seed).toBe(ts.run!.lines.reduce((s, l) => s + l.amount, 0));
        return { p, run };
      });
      // B: nach jedem Schritt Profil und Run als JSON kopieren
      const b = botRun(setup, newProfile(), (p, run) => {
        const p2 = cloneProfile(p);
        const run2 = cloneRun(run);
        see(p2, run2);
        return { p: p2, run: run2 };
      });
      expect(b.p.trophies, seed).toEqual(a.p.trophies);
      const ts = a.p.trophies;
      expect(ts.total, seed).toBeGreaterThan(0);
      // jede gewonnene oder verlorene Runde ist genau einmal verbucht
      const lost = a.run.phase === 'gameOver' && !a.run.won ? 1 : 0;
      expect(ts.run!.credited.length, seed).toBe(a.p.stats.blindsWon + lost);
      expect(new Set(ts.run!.credited).size, seed).toBe(ts.run!.credited.length);
      expect(ts.run!.lines.filter((l) => l.kind === 'round').length, seed).toBe(a.p.stats.blindsWon);
      expect(ts.run!.lines.filter((l) => l.kind === 'lostRound').length, seed).toBe(lost);
      if (lost) {
        expect(ts.run!.ended, seed).toBe(true);
        expect(ts.history).toHaveLength(1);
      }
    }
  }, 180000);
});

// ─────────────────────────────────────────────── Pfad

const PLAN_RARITY: Record<string, CosmeticRarity> = {
  back_sternenstaub: 'common', back_kupferraute: 'common', back_mondphasen: 'rare', back_retorte: 'rare', back_astrolabium: 'rare',
  back_tierkreis: 'epic', back_nebelwirbel: 'epic', back_goldadern: 'epic', back_sonnenfinsternis: 'legendary', back_kometenbahn: 'legendary',
  pal_bernstein: 'rare', pal_tintenmeer: 'rare', pal_mondsilber: 'epic', pal_glutkern: 'epic',
  sky_smaragd: 'common', sky_kupfer: 'common', sky_eisfeld: 'rare', sky_blutmond: 'rare', sky_polarlicht: 'epic', sky_goldstunde: 'epic',
  sky_leere: 'epic', sky_sonnenwende: 'legendary',
  spark_gold: 'common', spark_eis: 'common', spark_glut: 'rare', spark_smaragd: 'rare', spark_aether: 'epic', spark_prisma: 'legendary',
};
const DECK_IDS = ['nachthimmel', 'glut', 'tiefsee', 'waage', 'alchemist', 'sternenkind', 'halbmond'];

const rarityOf = (id: string): CosmeticRarity => PLAN_RARITY[id] ?? ROAD_TITLES.find((t) => t.id === id)!.rarity;
const rank = (r: CosmeticRarity) => RARITY_ORDER.indexOf(r);

describe('Pfad: Aufbau', () => {
  it('8 Ligen, 48 Einträge, 6 je Liga, Schwellen streng steigend, Liga beginnt beim ersten Eintrag', () => {
    expect(LEAGUES).toHaveLength(8);
    expect(ROAD).toHaveLength(48);
    expect(LEAGUES.map((l) => l.name)).toEqual([
      'Funkenlehrling', 'Retortengehilfe', 'Kupferadept', 'Silbermagister', 'Mondastronom', 'Sternendeuter', 'Himmelsmeister', 'Weltenkartograf',
    ]);
    expect(LEAGUES[0].from).toBe(0);
    ROAD.forEach((e, i) => {
      if (i > 0) expect(e.threshold, e.id).toBeGreaterThan(ROAD[i - 1].threshold);
      expect(e.league).toBe(Math.floor(i / 6));
    });
    LEAGUES.forEach((l, i) => {
      expect(l.from, l.id).toBe(ROAD[i * 6].threshold);
      expect(l.from, l.id).toBe(LEAGUE_THRESHOLDS[i][0]);
      if (i > 0) expect(l.from).toBeGreaterThan(LEAGUES[i - 1].from);
      expect(l.color).toBeGreaterThan(0);
      expect(l.flavor.length).toBeGreaterThan(10);
      // erster Eintrag der Liga ist ihr Titel
      expect(ROAD[i * 6].reward).toBe(`title_liga_${i + 1}`);
    });
    expect(new Set(ROAD.map((e) => e.id)).size).toBe(48);
  });

  it('Verteilung der Belohnungen: 10 Rücken, 4 Paletten, 8 Himmel, 6 Funken, 20 Titel, jede genau einmal', () => {
    const rewards = ROAD.map((e) => e.reward);
    expect(new Set(rewards).size).toBe(48);
    const count = (prefix: string) => rewards.filter((r) => r.startsWith(prefix)).length;
    expect([count('back_'), count('pal_'), count('sky_'), count('spark_'), count('title_')]).toEqual([10, 4, 8, 6, 20]);
    for (const id of rewards.filter((r) => !r.startsWith('title_'))) expect(PLAN_RARITY[id], id).toBeDefined();
    const planned = Object.keys(PLAN_RARITY).sort();
    expect(rewards.filter((r) => !r.startsWith('title_')).sort()).toEqual(planned);
  });

  it('Deck Pfade: 7 Decks mal 3 Stufen bei 60, 250 und 700, Rücken und Titel nach Plan', () => {
    expect(DECKS.map((d) => d.id)).toEqual(DECK_IDS);
    expect(DECK_STAGES).toHaveLength(21);
    expect(DECK_THRESHOLDS).toEqual([60, 250, 700]);
    for (const d of DECK_IDS) {
      const s = DECK_STAGES.filter((x) => x.deckId === d);
      expect(s.map((x) => x.stage)).toEqual([1, 2, 3]);
      expect(s.map((x) => x.threshold)).toEqual([60, 250, 700]);
      expect(s.map((x) => x.reward)).toEqual([`title_deck_${d}_1`, `back_deck_${d}`, `title_deck_${d}_3`]);
    }
    expect(new Set(DECK_STAGES.map((s) => s.id)).size).toBe(21);
    expect(new Set(DECK_STAGES.map((s) => s.reward)).size).toBe(21);
  });

  it('34 Titel: 8 Liga, 12 frei, 14 Deck, Namen kurz, Rarität nach Plan', () => {
    expect(LEAGUE_TITLES).toHaveLength(8);
    expect(FREE_TITLES).toHaveLength(12);
    expect(DECK_TITLES).toHaveLength(14);
    expect(ROAD_TITLES).toHaveLength(34);
    expect(new Set(ROAD_TITLES.map((t) => t.id)).size).toBe(34);
    expect(new Set(ROAD_TITLES.map((t) => t.name)).size).toBe(34);
    for (const t of FREE_TITLES) {
      expect(t.id.startsWith('title_')).toBe(true);
      expect(t.name.length, t.id).toBeLessThanOrEqual(24);
    }
    LEAGUE_TITLES.forEach((t, i) => expect(t.name).toBe(LEAGUES[i].name));
    for (const t of ROAD_TITLES) {
      expect(t.name.length).toBeGreaterThan(2);
      expect(t.description.length).toBeGreaterThan(5);
      expect(`${t.name} ${t.description}`, t.id).not.toMatch(/[–—]| - /);
    }
    for (const t of DECK_TITLES) expect(t.rarity).toBe(t.id.endsWith('_3') ? 'epic' : 'common');
    // alle Titel Belohnungen des Pfads sind in der Titelliste
    const ids = new Set(ROAD_TITLES.map((t) => t.id));
    for (const e of ROAD.filter((x) => x.reward.startsWith('title_'))) expect(ids.has(e.reward), e.reward).toBe(true);
    for (const s of DECK_STAGES.filter((x) => x.reward.startsWith('title_'))) expect(ids.has(s.reward), s.reward).toBe(true);
    // Titel am Hauptpfad: genau die 8 Liga Titel plus die 12 freien
    const roadTitles = ROAD.filter((e) => e.reward.startsWith('title_')).map((e) => e.reward).sort();
    expect(roadTitles).toEqual([...LEAGUE_TITLES, ...FREE_TITLES].map((t) => t.id).sort());
  });

  it('Raritätenkurve: nie fallend im Schnitt, Legendary ab Liga 6, die Krone ist legendary', () => {
    const perLeague = LEAGUES.map((_, i) => ROAD.slice(i * 6, i * 6 + 6).map((e) => rarityOf(e.reward)));
    const avg = perLeague.map((l) => l.reduce((s, r) => s + rank(r), 0) / l.length);
    for (let i = 1; i < avg.length; i++) expect(avg[i], `Liga ${i + 1}`).toBeGreaterThanOrEqual(avg[i - 1]);
    // Liga 1 und 2 vor allem common, 3 und 4 rare, 5 und 6 epic, 7 und 8 epic und legendary
    const n = (i: number, r: CosmeticRarity) => perLeague[i].filter((x) => x === r).length;
    expect(n(0, 'common')).toBeGreaterThanOrEqual(4);
    expect(n(1, 'common')).toBeGreaterThanOrEqual(3);
    expect(n(2, 'rare')).toBeGreaterThanOrEqual(4);
    expect(n(3, 'rare')).toBeGreaterThanOrEqual(4);
    expect(n(4, 'epic')).toBeGreaterThanOrEqual(4);
    expect(n(5, 'epic')).toBeGreaterThanOrEqual(4);
    for (const i of [6, 7]) expect(n(i, 'epic') + n(i, 'legendary'), `Liga ${i + 1}`).toBe(6);
    // Legendary erst ab Liga 6, bestes Stück jeder Liga ist ihr höchstes
    for (let i = 0; i < 5; i++) expect(n(i, 'legendary'), `Liga ${i + 1}`).toBe(0);
    expect(n(5, 'legendary')).toBeGreaterThanOrEqual(1);
    perLeague.forEach((l, i) => expect(rank(l[5]), `Liga ${i + 1}`).toBe(Math.max(...l.map(rank))));
    expect(ROAD[47].reward).toBe('back_sonnenfinsternis');
    expect(rarityOf(ROAD[47].reward)).toBe('legendary');
    // Rarität der freien Titel steigt mit der Liga
    const freeLeague = (id: string) => ROAD.find((e) => e.reward === id)!.league;
    const sorted = [...FREE_TITLES].sort((a, b) => freeLeague(a.id) - freeLeague(b.id));
    for (let i = 1; i < sorted.length; i++) expect(rank(sorted[i].rarity)).toBeGreaterThanOrEqual(rank(sorted[i - 1].rarity));
  });

  it('jede Belohnung existiert im Katalog (sobald er da ist) und stimmt in der Rarität', () => {
    const mods = import.meta.glob('./data/cosmetics.ts', { eager: true }) as Record<string, { COSMETICS?: readonly { id: string; rarity: string; category: string }[] }>;
    const catalog = Object.values(mods)[0]?.COSMETICS;
    if (!catalog) return; // Katalog (Agent B) noch nicht vorhanden
    const byId = new Map(catalog.map((c) => [c.id, c]));
    const rewards = [...ROAD.map((e) => e.reward), ...DECK_STAGES.map((s) => s.reward)];
    expect(rewards).toHaveLength(69);
    for (const id of rewards) {
      const c = byId.get(id);
      expect(c, id).toBeDefined();
      expect(c!.rarity, id).toBe(id.startsWith('back_deck_') ? 'rare' : rarityOf(id));
    }
  });
});

// ─────────────────────────────────────────────── Kalibrierung

/**
 * Durchschnittlicher Spieler: Verlust bei Ante 3 bis 6, selten ein Sieg. Der Verlust fällt zu 20 Prozent auf
 * den Small, zu 30 Prozent auf den Big und zu 50 Prozent auf den Boss Blind. Gewonnene Runden haben im
 * Schnitt eine übrige Hand, Überschuss ist selten (in der Rechnung weggelassen).
 */
const AVG_LOSS_ANTE: [number, number][] = [[3, 0.3], [4, 0.3], [5, 0.22], [6, 0.13]];
const AVG_WIN_SHARE = 0.05;
const AVG_BLIND_LOSS = [0.2, 0.3, 0.5];

function runTrophies(lossAnte: number, lossBlind: number, win: boolean): number {
  let sum = 0;
  const last = win ? 8 : lossAnte;
  for (let ante = 1; ante <= last; ante++) {
    for (let b = 0; b < 3; b++) {
      const lost = !win && ante === lossAnte && b === lossBlind;
      sum += roundTrophies(base({ ante, blind: BLIND_KINDS[b], won: !lost, handsLeft: 1 })).total;
      if (lost) return sum;
    }
  }
  return sum + winTrophies({ stakeId: 'daemmerung', difficulty: null, daily: false, streakFactor: 1 }).total;
}

function averageRun(): number {
  let avg = 0;
  for (const [ante, w] of AVG_LOSS_ANTE) AVG_BLIND_LOSS.forEach((bw, b) => { avg += w * (1 - AVG_WIN_SHARE) * bw * runTrophies(ante, b, false); });
  return avg + AVG_WIN_SHARE * runTrophies(8, 0, true);
}

describe('Kalibrierung des Pfads', () => {
  const avg = averageRun();
  const runsFor = (threshold: number) => threshold / avg;

  it('misst die Runs je Liga für den durchschnittlichen Spieler', () => {
    const table = LEAGUES.map((l) => `${l.name}: ab ${l.from} Pokale, ${runsFor(l.from).toFixed(1)} Runs`);
    // eslint-disable-next-line no-console
    console.log(`Kalibrierung: ${avg.toFixed(1)} Pokale je Run\n${table.join('\n')}\nGanzer Pfad: ${runsFor(ROAD[47].threshold).toFixed(0)} Runs`);
    expect(avg).toBeGreaterThan(80);
    expect(avg).toBeLessThan(150);
  });

  it('erste Liga nach etwa 4 bis 6 Runs, frühe Einträge nach 1 bis 2 Runs', () => {
    expect(runsFor(LEAGUES[1].from)).toBeGreaterThanOrEqual(4);
    expect(runsFor(LEAGUES[1].from)).toBeLessThanOrEqual(6);
    // der erste Eintrag mit Schwelle über 0 und der dritte kommen früh
    expect(runsFor(ROAD[1].threshold)).toBeLessThanOrEqual(1);
    expect(runsFor(ROAD[2].threshold)).toBeGreaterThanOrEqual(1);
    expect(runsFor(ROAD[2].threshold)).toBeLessThanOrEqual(2);
  });

  it('der ganze Pfad braucht etwa 120 bis 160 durchschnittliche Runs', () => {
    expect(runsFor(ROAD[47].threshold)).toBeGreaterThanOrEqual(120);
    expect(runsFor(ROAD[47].threshold)).toBeLessThanOrEqual(160);
  });

  it('die Abstände wachsen (früh dicht, später weiter auseinander) und jede Liga wird länger', () => {
    // mittlerer Abstand je Liga wächst (einzelne Lücken schwanken durch das Runden der Schwellen)
    const mean = (i: number) => (ROAD[i * 6 + 5].threshold - ROAD[i * 6].threshold) / 5;
    for (let i = 1; i < 8; i++) expect(mean(i), `Liga ${i + 1}`).toBeGreaterThan(mean(i - 1));
    const gaps = ROAD.slice(1).map((e, i) => e.threshold - ROAD[i].threshold);
    for (let i = 5; i < gaps.length; i++) expect(gaps[i], `Lücke ${i}`).toBeGreaterThanOrEqual(gaps[i - 5] * 0.9);
    const lens = LEAGUES.slice(1).map((l, i) => l.from - LEAGUES[i].from);
    for (let i = 1; i < lens.length; i++) expect(lens[i]).toBeGreaterThan(lens[i - 1]);
  });

  it('Simulation mit echter Verbuchung: Runs bis zu jeder Liga liegen nahe an der Rechnung', () => {
    const p = newProfile();
    const rng = RngStreams.create('kalibrierung');
    const reachedAt: number[] = [];
    let last = 0;
    let n = 0;
    while (p.trophies.total < ROAD[47].threshold && n < 260) {
      n++;
      const run = newRun(`CAL${String(n).padStart(5, '0')}`);
      let u = rng.next('ante');
      let lossAnte = 3;
      let win = false;
      if (u < AVG_WIN_SHARE) win = true;
      else {
        u = (u - AVG_WIN_SHARE) / (1 - AVG_WIN_SHARE);
        let acc = 0;
        for (const [ante, w] of AVG_LOSS_ANTE) { acc += w; if (u <= acc) { lossAnte = ante; break; } }
      }
      const lossBlind = rng.next('blind') < 0.2 ? 0 : rng.next('blind2') < 0.375 ? 1 : 2;
      winRounds(p, run, win ? 24 : (lossAnte - 1) * 3 + lossBlind, { hands: 1, now: NOW + n });
      if (!win) loseStep(p, run, NOW + n);
      const idx = leagueIndexOf(p.trophies.total);
      expect(idx).toBeGreaterThanOrEqual(last);
      for (let l = last + 1; l <= idx; l++) reachedAt[l] = n;
      last = idx;
    }
    // eslint-disable-next-line no-console
    console.log(`Simulation: ${LEAGUES.map((l, i) => `${l.name} ab Run ${i === 0 ? 0 : reachedAt[i] ?? '-'}`).join(', ')}; Pfad voll nach ${n} Runs, Verlauf ${p.trophies.history.length}`);
    expect(p.trophies.total).toBe(sumOf(p.trophies));
    expect(reachedAt[1]).toBeGreaterThanOrEqual(3);
    expect(reachedAt[1]).toBeLessThanOrEqual(8);
    expect(p.trophies.total).toBeGreaterThanOrEqual(ROAD[47].threshold);
    expect(n).toBeGreaterThanOrEqual(95);
    expect(n).toBeLessThanOrEqual(180);
    // Abweichung von der Rechnung mit dem Durchschnitt: höchstens ein Drittel
    for (let l = 3; l < 8; l++) expect(Math.abs(reachedAt[l] / runsFor(LEAGUES[l].from) - 1), LEAGUES[l].name).toBeLessThan(0.35);
  }, 120000);
});

// ─────────────────────────────────────────────── Liga, Abholen, Ausrüsten

function profileWith(total: number, deck = 'nachthimmel'): Profile {
  const p = newProfile();
  p.trophies.total = total;
  p.trophies.byDeck = { [deck]: total };
  return p;
}

describe('Liga', () => {
  it('leagueIndexOf und leagueProgress', () => {
    expect(leagueIndexOf(0)).toBe(0);
    expect(leagueIndexOf(LEAGUES[1].from - 1)).toBe(0);
    expect(leagueIndexOf(LEAGUES[1].from)).toBe(1);
    expect(leagueIndexOf(10_000_000)).toBe(7);
    const mid = leagueProgress(LEAGUES[2].from + 100);
    expect(mid.index).toBe(2);
    expect(mid.def).toBe(LEAGUES[2]);
    expect(mid.next).toBe(LEAGUES[3]);
    expect(mid.into).toBe(100);
    expect(mid.span).toBe(LEAGUES[3].from - LEAGUES[2].from);
    const top = leagueProgress(LEAGUES[7].from + 500);
    expect(top.next).toBeNull();
    expect(top.into).toBe(500);
    expect(top.into / top.span).toBe(1);
    expect(leagueProgress(0).span).toBeGreaterThan(0);
  });
});

describe('Abholen', () => {
  it('nur wenn erreicht und nur einmal, trägt claimed und owned ein', () => {
    const p = profileWith(0);
    // der Titel der ersten Liga liegt auf 0 und ist sofort bereit
    expect(claimableCount(p)).toBe(1);
    expect(claimEntry(p, 'road_1_2', NOW)).toBeNull();
    expect(claimEntry(p, 'gibt_es_nicht', NOW)).toBeNull();
    expect(claimEntry(p, 'road_1_1', NOW)).toBe('title_liga_1');
    expect(claimEntry(p, 'road_1_1', NOW)).toBeNull();
    expect(p.trophies.claimed.road_1_1).toBe(NOW);
    expect(p.trophies.owned.title_liga_1).toBe(NOW);
    expect(isOwned(p, 'title_liga_1')).toBe(true);
    expect(isOwned(p, 'spark_gold')).toBe(false);
    expect(claimableCount(p)).toBe(0);
  });

  it('roadStatus: gesperrt, bereit, abgeholt', () => {
    const p = profileWith(170);
    claimEntry(p, 'road_1_1', NOW);
    const st = roadStatus(p);
    expect(st).toHaveLength(48);
    expect(st[0].state).toBe('claimed');
    expect(st[1].state).toBe('ready');
    expect(st[2].state).toBe('ready');
    expect(st[3].state).toBe('locked');
    expect(claimableCount(p)).toBe(2 + 1); // zwei Hauptpfad Einträge plus Deck Stufe 1 (60 Pokale mit dem Deck)
  });

  it('Deck Pfad zählt mit den Pokalen des Decks, nicht mit total', () => {
    const p = profileWith(5000, 'glut');
    expect(deckStatus(p, 'glut').map((s) => s.state)).toEqual(['ready', 'ready', 'ready']);
    expect(deckStatus(p, 'tiefsee').map((s) => s.state)).toEqual(['locked', 'locked', 'locked']);
    expect(claimEntry(p, 'deck_tiefsee_1', NOW)).toBeNull();
    expect(claimEntry(p, 'deck_glut_2', NOW)).toBe('back_deck_glut');
    expect(claimEntry(p, 'deck_glut_2', NOW)).toBeNull();
    expect(deckStatus(p, 'glut').map((s) => s.state)).toEqual(['ready', 'claimed', 'ready']);
    expect(deckStatus(p, 'unbekannt')).toEqual([]);
    // Titel einer Deck Stufe zählen nur fürs Deck
    const q = profileWith(100, 'glut');
    q.trophies.byDeck = { glut: 70, waage: 30 };
    expect(deckStatus(q, 'glut')[0].state).toBe('ready');
    expect(deckStatus(q, 'waage')[0].state).toBe('locked');
  });

  it('claimAll holt alles Bereite in Pfad Reihenfolge ab', () => {
    const p = profileWith(900, 'halbmond');
    const got = claimAll(p, NOW);
    const expected = [...ROAD.filter((e) => e.threshold <= 900).map((e) => e.reward), 'title_deck_halbmond_1', 'back_deck_halbmond', 'title_deck_halbmond_3'];
    expect(got).toEqual(expected);
    expect(claimableCount(p)).toBe(0);
    expect(claimAll(p, NOW)).toEqual([]);
    expect(Object.keys(p.trophies.owned).length).toBe(Object.keys(p.trophies.claimed).length);
  });

  it('abgeholt bleibt abgeholt, auch wenn die Pokale (durch kaputte Daten) kleiner wirken', () => {
    const p = profileWith(300);
    claimAll(p, NOW);
    p.trophies.total = 0;
    expect(roadStatus(p)[3].state).toBe('claimed');
    expect(claimEntry(p, 'road_1_4', NOW)).toBeNull();
  });
});

describe('Ausrüsten', () => {
  it('nur wenn besessen und passend zur Kategorie, Standard geht immer', () => {
    const p = profileWith(400);
    expect(equip(p, 'spark', 'spark_gold', NOW)).toBe(false);
    claimAll(p, NOW);
    expect(isOwned(p, 'spark_gold')).toBe(true);
    expect(equip(p, 'spark', 'spark_gold', NOW + 1)).toBe(true);
    expect(equippedId(p, 'spark')).toBe('spark_gold');
    expect(p.trophies.equippedAt).toBe(NOW + 1);
    expect(equip(p, 'sky', 'spark_gold', NOW + 2)).toBe(false);
    expect(equippedId(p, 'sky')).toBe('');
    expect(equip(p, 'spark', '', NOW + 3)).toBe(true);
    expect(equippedId(p, 'spark')).toBe('');
    expect(equip(p, 'back', 'back_tierkreis', NOW)).toBe(false);
    expect(equip(p, 'back', 'unbekannt', NOW)).toBe(false);
  });

  it('activeTitle gibt den Namen des ausgerüsteten Titels', () => {
    const p = profileWith(900, 'glut');
    expect(activeTitle(p)).toBeNull();
    claimAll(p, NOW);
    expect(equip(p, 'title', 'title_liga_2', NOW)).toBe(true);
    expect(activeTitle(p)).toBe('Retortengehilfe');
    expect(equip(p, 'title', 'title_deck_glut_1', NOW)).toBe(true);
    expect(activeTitle(p)).toBe('Lehrling des Glutdecks');
    p.trophies.owned = {};
    expect(activeTitle(p)).toBeNull();
    p.trophies.owned.title_liga_2 = 1;
    p.trophies.equipped.title = 'title_gibt_es_nicht';
    expect(activeTitle(p)).toBeNull();
  });

  it('unlockHint nennt Quelle, Liga bzw. Deck und Schwelle', () => {
    expect(unlockHint('title_liga_3')).toEqual({ source: 'road', label: 'Kupferadept', threshold: LEAGUES[2].from });
    const e = ROAD.find((x) => x.reward === 'back_tierkreis')!;
    expect(unlockHint('back_tierkreis')).toEqual({ source: 'road', label: LEAGUES[e.league].name, threshold: e.threshold });
    expect(unlockHint('back_deck_waage')).toEqual({ source: 'deck', label: 'Goldene Waage', threshold: 250 });
    expect(unlockHint('title_deck_halbmond_3')).toEqual({ source: 'deck', label: 'Halbmond', threshold: 700 });
    expect(unlockHint('standard')).toBeNull();
    for (const r of ROAD) expect(unlockHint(r.reward), r.reward).not.toBeNull();
    for (const s of DECK_STAGES) expect(unlockHint(s.reward), s.reward).not.toBeNull();
  });
});

// ─────────────────────────────────────────────── Kaputte Daten und Zusammenführen

describe('Kaputte Daten', () => {
  it('parseTrophyState und Profil Einlesen schützen vor Müll', () => {
    for (const junk of [null, undefined, 5, 'x', [], { total: 'viel', byDeck: 3, claimed: [], owned: null, run: 7, history: {} }]) {
      const ts = parseTrophyState(junk);
      expect(ts.total).toBeGreaterThanOrEqual(0);
      expect(Object.keys(ts.equipped).sort()).toEqual(['back', 'palette', 'sky', 'spark', 'title']);
    }
    const p = parseProfile({ trophies: { total: -5, byDeck: { glut: 'x', waage: 3 }, run: { runId: 'a', credited: [1, '1:0'], lines: [{ kind: 'zzz' }, { kind: 'round', amount: 3 }] } } });
    expect(p.trophies.total).toBe(0);
    expect(p.trophies.byDeck).toEqual({ waage: 3 });
    expect(p.trophies.run!.credited).toEqual(['1:0']);
    expect(p.trophies.run!.lines).toEqual([{ kind: 'round', amount: 3 }]);
  });

  it('observeTrophies heilt total gegen byDeck und verliert dabei nichts', () => {
    const p = newProfile();
    p.trophies.total = 100;
    p.trophies.byDeck = { glut: 40 };
    const run = newRun('BAD00001');
    see(p, run);
    expect(p.trophies.total).toBe(100);
    expect(sumOf(p.trophies)).toBe(100);
    const q = newProfile();
    q.trophies.total = 10;
    q.trophies.byDeck = { glut: 40 };
    see(q, newRun('BAD00002'));
    expect(q.trophies.total).toBe(40);
    expect(sumOf(q.trophies)).toBe(40);
  });

  it('Abholen und Status mit unbekannten Ids in claimed stören nicht', () => {
    const p = profileWith(100);
    p.trophies.claimed = { road_9_9: 1, deck_x_1: 2 };
    expect(roadStatus(p)).toHaveLength(48);
    expect(claimableCount(p)).toBeGreaterThan(0);
    expect(() => claimAll(p, NOW)).not.toThrow();
  });
});

function mkState(over: Partial<TrophyState>): TrophyState {
  return { ...newTrophyState(), ...over };
}

/** Vergleich ohne den Run Stand (der ist nicht kommutativ) */
const noRun = (ts: TrophyState) => ({ ...ts, run: null });

describe('Zusammenführen', () => {
  const a = mkState({
    total: 300, byDeck: { glut: 200, waage: 100 }, claimed: { road_1_1: 50, road_1_2: 90 }, owned: { title_liga_1: 50, spark_gold: 90 },
    equipped: { back: '', palette: '', sky: '', spark: 'spark_gold', title: '' }, equippedAt: 100, streak: 2, bestStreak: 4,
    deckFirstWin: { glut: 10 }, dailyPaid: { '2026-11-20': 5 }, leagueSeen: 0,
    history: [{ runId: 'r1', at: 10, deckId: 'glut', ante: 4, won: false, gained: 80, end: 'finished' }],
    run: { runId: 'r2', deckId: 'glut', credited: ['1:0'], gained: 3, lines: [], streakFactor: 1, winPaid: false, ended: false, bestAntePaid: 1 },
  });
  const b = mkState({
    total: 250, byDeck: { glut: 150, tiefsee: 100 }, claimed: { road_1_1: 40, road_1_3: 120 }, owned: { title_liga_1: 40, back_sternenstaub: 120 },
    equipped: { back: '', palette: '', sky: 'sky_smaragd', spark: '', title: 'title_liga_1' }, equippedAt: 200, streak: 5, bestStreak: 5,
    deckFirstWin: { tiefsee: 20, glut: 5 }, dailyPaid: { '2026-11-21': 6 }, leagueSeen: 1,
    history: [
      { runId: 'r1', at: 10, deckId: 'glut', ante: 4, won: false, gained: 85, end: 'finished' },
      { runId: 'r0', at: 5, deckId: 'tiefsee', ante: 2, won: false, gained: 20, end: 'abandoned' },
    ],
    run: null,
  });

  it('Maximum und Vereinigung, nichts geht verloren, total bleibt die Summe von byDeck', () => {
    const m = mergeTrophyState(a, b);
    expect(m.byDeck).toEqual({ glut: 200, waage: 100, tiefsee: 100 });
    expect(m.total).toBe(400);
    expect(m.total).toBe(sumOf(m));
    expect(m.total).toBeGreaterThanOrEqual(Math.max(a.total, b.total));
    expect(m.claimed).toEqual({ road_1_1: 40, road_1_2: 90, road_1_3: 120 });
    expect(m.owned).toEqual({ title_liga_1: 40, spark_gold: 90, back_sternenstaub: 120 });
    expect(m.equipped.sky).toBe('sky_smaragd');
    expect(m.equipped.title).toBe('title_liga_1');
    expect(m.equipped.spark).toBe('');
    expect(m.equippedAt).toBe(200);
    expect(m.streak).toBe(2); // Serie aus dem Stand mit mehr Gesamtpokalen (a)
    expect(m.bestStreak).toBe(5);
    expect(m.deckFirstWin).toEqual({ glut: 5, tiefsee: 20 });
    expect(m.dailyPaid).toEqual({ '2026-11-20': 5, '2026-11-21': 6 });
    expect(m.leagueSeen).toBe(1);
    expect(m.history.map((h) => h.runId)).toEqual(['r0', 'r1']);
    expect(m.history.find((h) => h.runId === 'r1')!.gained).toBe(85);
  });

  it('kommutativ bis auf den Run Stand, idempotent, Eingaben bleiben unverändert', () => {
    const before = JSON.stringify([a, b]);
    expect(noRun(mergeTrophyState(a, b))).toEqual(noRun(mergeTrophyState(b, a)));
    expect(mergeTrophyState(a, a)).toEqual(a);
    expect(mergeTrophyState(mergeTrophyState(a, b), b)).toEqual(mergeTrophyState(a, b));
    expect(JSON.stringify([a, b])).toBe(before);
    // der Run Stand mit mehr verbuchten Runden gilt, in beiden Richtungen
    expect(mergeTrophyState(a, b).run?.runId).toBe('r2');
    expect(mergeTrophyState(b, a).run?.runId).toBe('r2');
  });

  it('Gleichstand bei der Ausrüstung ist reihenfolgeunabhängig', () => {
    const x = mkState({ equippedAt: 5, equipped: { back: 'back_a', palette: '', sky: '', spark: '', title: '' } });
    const y = mkState({ equippedAt: 5, equipped: { back: 'back_b', palette: '', sky: '', spark: '', title: '' } });
    expect(mergeTrophyState(x, y).equipped).toEqual(mergeTrophyState(y, x).equipped);
  });

  it('Abgeholtes ist nach dem Zusammenführen auch besessen, Verlauf bleibt begrenzt', () => {
    const x = mkState({ claimed: { road_1_2: 7 } });
    expect(mergeTrophyState(x, newTrophyState()).owned.spark_gold).toBe(7);
    const many = (off: number) => mkState({
      history: Array.from({ length: HISTORY_MAX }, (_, i) => ({ runId: `h${off}_${i}`, at: off + i, deckId: 'glut', ante: 1, won: false, gained: 1, end: 'finished' as const })),
    });
    expect(mergeTrophyState(many(0), many(1000)).history).toHaveLength(HISTORY_MAX);
  });

  it('mergeProfiles führt Pokale zusammen, der Run Stand folgt dem Profil mit mehr Hands', () => {
    const pa = newProfile();
    const pb = newProfile();
    pa.trophies = a;
    pb.trophies = b;
    pa.stats.hands = 10;
    pb.stats.hands = 50;
    const m = mergeProfiles(pa, pb);
    expect(m.trophies.total).toBe(400);
    expect(m.trophies.run).toBeNull(); // pb hat mehr Hands und keinen Run Stand
    expect(mergeProfiles(pb, pa).trophies.run).toBeNull();
    pa.stats.hands = 90;
    expect(mergeProfiles(pa, pb).trophies.run?.runId).toBe('r2');
    expect(mergeProfiles(pb, pa).trophies.run?.runId).toBe('r2');
    expect(noRun(mergeProfiles(pa, pb).trophies)).toEqual(noRun(mergeProfiles(pb, pa).trophies));
    // Eingaben bleiben unberührt
    expect(pa.trophies).toBe(a);
    expect(pa.trophies.total).toBe(300);
  });
});

// ─────────────────────────────────────────────── Englische Inhalte

describe('Englische Patch Datei', () => {
  afterAll(() => setLang('de'));

  it('Ligen und alle 34 Titel haben englische Namen und Texte', () => {
    const de = { leagues: LEAGUES.map((l) => ({ ...l })), titles: ROAD_TITLES.map((t) => ({ ...t })) };
    setLang('en');
    applyDataLanguage(true);
    LEAGUES.forEach((l, i) => {
      expect(l.id).toBe(de.leagues[i].id);
      expect(l.from).toBe(de.leagues[i].from);
      expect(l.color).toBe(de.leagues[i].color);
      for (const s of [l.name, l.flavor]) {
        expect(s).toBeTruthy();
        expect(s).not.toMatch(/[–—]| - /);
        expect(s).not.toMatch(/[äöüÄÖÜß]/);
      }
      expect(l.name).not.toBe(de.leagues[i].name);
      expect(l.flavor).not.toBe(de.leagues[i].flavor);
    });
    ROAD_TITLES.forEach((t, i) => {
      expect(t.id).toBe(de.titles[i].id);
      expect(t.rarity).toBe(de.titles[i].rarity);
      for (const s of [t.name, t.description]) {
        expect(s, t.id).toBeTruthy();
        expect(s, t.id).not.toMatch(/[–—]| - /);
        expect(s, t.id).not.toMatch(/[äöüÄÖÜß]/);
      }
      expect(t.name, t.id).not.toBe(de.titles[i].name);
      expect(t.name.length, t.id).toBeLessThanOrEqual(Math.max(de.titles[i].name.length + 4, 24));
    });
    expect(LEAGUE_TITLES.every((t, i) => t.name === LEAGUES[i].name)).toBe(true);
    // activeTitle liest den englischen Namen
    const p = profileWith(300);
    claimAll(p, NOW);
    equip(p, 'title', 'title_liga_1', NOW);
    expect(activeTitle(p)).toBe('Spark Apprentice');
  });
});
