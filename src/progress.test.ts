import './core/index';
import { describe, expect, it } from 'vitest';
import { evaluateAchievements, rankOf, unlockedCount } from './achievements';
import { ACHIEVEMENTS, RANKS, TOTAL_STARS } from './data/achievements';
import { dailySetup, dateKey, TWISTS } from './data/daily';
import { SCALE, scaleMods, scaleSummary, scaleTargetFactor, clampScale } from './data/difficulty';
import { STAKES, stakeChain } from './data/stakes';
import { afterHand, cashOut, createRun, discardHand, playHand, selectBlind } from './core/game';
import { currentTarget, newRunStats } from './core/run';
import { migrateRun } from './save';
import { newProfile, observeRun, parseProfile } from './profile';

describe('Stakes', () => {
  it('Einsteigerstufe wirkt nur für sich, die Leiter kumulativ', () => {
    expect(stakeChain('morgenrot').map((s) => s.id)).toEqual(['morgenrot']);
    expect(stakeChain('daemmerung').map((s) => s.id)).toEqual(['daemmerung']);
    expect(stakeChain('mitternacht').map((s) => s.id)).toEqual(['daemmerung', 'abend', 'mitternacht']);
    expect(stakeChain('unbekannt').map((s) => s.id)).toEqual(['daemmerung']);
  });

  it('Morgenrot senkt Ziele um 25 Prozent und gibt einen Discard mehr', () => {
    const easy = createRun({ seed: 'EASY0001', stakeId: 'morgenrot' });
    const normal = createRun({ seed: 'EASY0001', stakeId: 'daemmerung' });
    expect(currentTarget(easy)).toBe(225);
    expect(currentTarget(normal)).toBe(300);
    expect(easy.discards).toBe(normal.discards + 1);
    expect(easy.rules.scaling).toBe(1);
  });

  it('ohne Angabe gilt weiter die Grundschwierigkeit', () => {
    const run = createRun({ seed: 'EASY0002' });
    expect(run.stakeId).toBe('daemmerung');
    expect(run.difficulty).toBeNull();
    expect(currentTarget(run)).toBe(300);
  });

  it('Ziel Faktoren verschiedener Quellen multiplizieren sich (Goldene Waage mal Stufe)', () => {
    const run = createRun({ seed: 'EASY0003', deckId: 'waage', stakeId: 'morgenrot' });
    expect(run.rules.blindTargetFactor).toBeCloseTo(0.75 * 2);
    expect(currentTarget(run)).toBe(450);
  });
});

describe('Skalierende Schwierigkeit', () => {
  it('Ziel Faktor steigt mit der Stufe, Normalstufe gleich 1', () => {
    expect(scaleTargetFactor(SCALE.normal)).toBe(1);
    expect(scaleTargetFactor(1)).toBeCloseTo(0.7);
    let last = 0;
    for (let l = SCALE.min; l <= SCALE.max; l++) {
      const f = scaleTargetFactor(l);
      expect(f).toBeGreaterThan(last);
      last = f;
    }
    expect(scaleTargetFactor(SCALE.max)).toBeGreaterThan(2);
  });

  it('Stufen werden begrenzt', () => {
    expect(clampScale(-5)).toBe(SCALE.min);
    expect(clampScale(99)).toBe(SCALE.max);
    expect(clampScale(Number.NaN)).toBe(SCALE.start);
  });

  it('Leichte Stufen helfen, schwere nehmen Hände und Discards', () => {
    const l1 = createRun({ seed: 'SCAL0001', level: 1 });
    const l4 = createRun({ seed: 'SCAL0001', level: 4 });
    const l20 = createRun({ seed: 'SCAL0001', level: 20 });
    expect(l1.stakeId).toBe('skala');
    expect(l1.difficulty).toBe(1);
    expect(l1.money).toBe(l4.money + 3);
    expect(l1.discards).toBe(l4.discards + 1);
    expect(l4.hands).toBe(4);
    expect(l20.hands).toBe(3);
    expect(l20.discards).toBe(l4.discards - 1);
    expect(l20.handSize).toBe(l4.handSize - 1);
    expect(l20.rules.scaling).toBe(3);
    expect(currentTarget(l20)).toBeGreaterThan(currentTarget(l4) * 2);
  });

  it('Zusammenfassung nennt Ziel und aktive Regeln', () => {
    expect(scaleSummary(4)).toEqual(['Blind Ziele wie im Grundspiel']);
    const s = scaleSummary(12);
    expect(s[0]).toContain('plus');
    expect(s.join(' ')).toContain('-1 Discard');
    expect(scaleMods(4)).toEqual([]);
  });

  it('Skalierende Läufe lassen sich speichern und laden', () => {
    const run = createRun({ seed: 'SCAL0002', level: 9 });
    const back = migrateRun(JSON.parse(JSON.stringify(run)))!;
    expect(back.difficulty).toBe(9);
    expect(back.stakeId).toBe('skala');
  });
});

describe('Tageslauf', () => {
  it('ist für ein Datum eindeutig und stabil', () => {
    const a = dailySetup('2026-11-19');
    const b = dailySetup('2026-11-19');
    expect(a).toEqual(b);
    expect(a.seed).toMatch(/^[A-NP-Z1-9]{8}$/);
    expect(TWISTS.some((t) => t.id === a.twistId)).toBe(true);
    expect(dailySetup('2026-11-20').seed).not.toBe(a.seed);
  });

  it('Datumsschlüssel hat das Format JJJJ-MM-TT', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('Run mit Tageswandlung wendet die Wandlung an', () => {
    const d = dailySetup('2026-11-19');
    const run = createRun({ seed: d.seed, deckId: d.deckId, level: d.level, daily: { date: d.date, twistId: 'sparflamme' } });
    expect(run.daily).toBe('2026-11-19');
    expect(run.twistId).toBe('sparflamme');
    const plain = createRun({ seed: d.seed, deckId: d.deckId, level: d.level });
    expect(run.hands).toBe(plain.hands + 2);
    expect(run.discards).toBe(Math.max(0, plain.discards - 2));
  });
});

describe('Spielstand Version 5', () => {
  it('Version 4 bekommt Standardwerte für Schwierigkeit, Tageslauf und Zähler', () => {
    const run = createRun({ seed: 'MIGR0005' }) as any;
    run.version = 4;
    delete run.difficulty; delete run.daily; delete run.twistId; delete run.stats; delete run.runId;
    const m = migrateRun(run)!;
    expect(m.version).toBe(5);
    expect(m.difficulty).toBeNull();
    expect(m.daily).toBeNull();
    expect(m.stats).toEqual(newRunStats());
    expect(m.runId).toContain('MIGR0005');
  });

  it('Run Zähler wachsen mit Hands, Discards und Käufen', () => {
    const run = createRun({ seed: 'STAT0001', stakeId: 'morgenrot' });
    selectBlind(run);
    const hand = run.round!.hand;
    discardHand(run, [hand[0].id]);
    afterHand(run);
    expect(run.stats.discardsUsed).toBe(1);
    const r = playHand(run, run.round!.hand.slice(0, 5).map((c) => c.id));
    expect(run.stats.bestHand).toBe(r.total);
    expect(run.stats.bestHandType).toBe(r.handType);
  });
});

describe('Profil', () => {
  it('rechnet nur Differenzen des Runs dazu (idempotent)', () => {
    const p = newProfile();
    const run = createRun({ seed: 'PROF0001', stakeId: 'morgenrot' });
    expect(observeRun(p, run)).toBe(true);
    expect(p.stats.runs).toBe(1);
    expect(observeRun(p, run)).toBe(false);
    selectBlind(run);
    playHand(run, run.round!.hand.slice(0, 2).map((c) => c.id));
    observeRun(p, run);
    observeRun(p, run);
    expect(p.stats.hands).toBe(1);
    expect(p.stats.runs).toBe(1);
    expect(p.stats.bestHand).toBe(run.stats.bestHand);
    expect(Object.values(p.handCounts).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('ein neuer Run zählt als neuer Lauf, auch mit gleichem Seed', () => {
    const p = newProfile();
    const a = createRun({ seed: 'PROF0002' });
    observeRun(p, a);
    const b = createRun({ seed: 'PROF0002' });
    b.runId = a.runId + 'x';
    observeRun(p, b);
    expect(p.stats.runs).toBe(2);
  });

  it('Sieg und Niederlage werden je Run nur einmal gezählt', () => {
    const p = newProfile();
    const run = createRun({ seed: 'PROF0003', level: 10, deckId: 'glut' });
    run.won = true;
    observeRun(p, run);
    observeRun(p, run);
    expect(p.stats.wins).toBe(1);
    expect(p.winsByDeck.glut).toBe(1);
    expect(p.bestScale).toBe(10);
    const lost = createRun({ seed: 'PROF0004' });
    lost.phase = 'gameOver';
    observeRun(p, lost);
    observeRun(p, lost);
    expect(p.stats.losses).toBe(1);
  });

  it('Tageslauf Verlauf merkt sich das beste Ante', () => {
    const p = newProfile();
    const run = createRun({ seed: 'PROF0005', level: 5, daily: { date: '2026-11-19', twistId: 'goldregen' } });
    run.ante = 4;
    observeRun(p, run);
    expect(p.daily['2026-11-19'].ante).toBe(4);
    expect(p.daily['2026-11-19'].won).toBe(false);
  });

  it('kaputte Daten werden durch Standardwerte ersetzt', () => {
    expect(parseProfile(null).stats.runs).toBe(0);
    expect(parseProfile({ stats: { runs: 'x', hands: 7 }, unlocked: { a: 1, b: 'c' }, daily: { x: 5 } })).toMatchObject({ stats: { runs: 0, hands: 7 }, unlocked: { a: 1 }, daily: {} });
  });
});

describe('Erfolge', () => {
  const ctx = { collection: 0 };

  it('Katalog hat eindeutige Ids, Texte ohne Gedankenstriche und Sterne', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(`${a.name} ${a.description}`).not.toMatch(/[—–]| - /);
      expect([1, 2, 3]).toContain(a.stars);
    }
    expect(TOTAL_STARS).toBeGreaterThan(50);
    expect(RANKS[0].from).toBe(0);
  });

  it('schaltet Erfolge anhand von Statistik frei, jeden nur einmal', () => {
    const p = newProfile();
    p.stats.hands = 100;
    p.stats.bestHand = 12_000;
    const fresh = evaluateAchievements(p, null, ctx, 123);
    const ids = fresh.map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['erster_lichtblick', 'kartenhai', 'hell_leuchtend', 'sternschnuppe']));
    expect(ids).not.toContain('komet');
    expect(p.unlocked.kartenhai).toBe(123);
    expect(evaluateAchievements(p, null, ctx)).toEqual([]);
  });

  it('prüft den laufenden Run (Jokers, Geld, Hand Level)', () => {
    const p = newProfile();
    const run = createRun({ seed: 'ACHV0001' });
    run.money = 30;
    run.handLevels.pair = 5;
    run.jokers = ['funke', 'kiesel', 'glut', 'frost', 'herzblut'].map((defId, i) => ({ uid: i + 1, defId, vars: {} }));
    const ids = evaluateAchievements(p, run, ctx).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['volle_hand', 'aufgewertet']));
    expect(ids).not.toContain('seltene_beute');
  });

  it('Letzter Drücker braucht die Phase Runde gewonnen mit null Hands übrig', () => {
    const p = newProfile();
    const run = createRun({ seed: 'ACHV0002' });
    selectBlind(run);
    run.round!.handsLeft = 0;
    expect(evaluateAchievements(p, run, ctx).map((a) => a.id)).not.toContain('letzter_druecker');
    run.phase = 'roundWon';
    expect(evaluateAchievements(p, run, ctx).map((a) => a.id)).toContain('letzter_druecker');
  });

  it('geheime Hände zählen gemeinsam', () => {
    const p = newProfile();
    p.handCounts.flushFive = 1;
    expect(evaluateAchievements(p, null, ctx).map((a) => a.id)).toContain('geheimnis');
  });

  it('Stake Siege zählen für niedrigere Stufen mit', () => {
    const p = newProfile();
    p.winsByStake.finsternis = 1;
    const ids = evaluateAchievements(p, null, ctx).map((a) => a.id);
    expect(ids).toContain('sieg_mitternacht');
    expect(ids).toContain('sieg_finsternis');
    expect(ids).not.toContain('sieg_ewig');
    // Einsteigerstufe und skalierende Läufe zählen nicht für die Leiter
    const q = newProfile();
    q.winsByStake.morgenrot = 3;
    q.winsByStake.skala = 3;
    expect(evaluateAchievements(q, null, ctx).map((a) => a.id)).not.toContain('sieg_mitternacht');
  });

  it('Sammlung und Rang', () => {
    const p = newProfile();
    expect(rankOf(p).index).toBe(0);
    expect(rankOf(p).starsToNext).toBeGreaterThan(0);
    evaluateAchievements(p, null, { collection: 0.6 });
    expect(unlockedCount(p)).toBeGreaterThanOrEqual(2);
    for (const a of ACHIEVEMENTS) p.unlocked[a.id] = 1;
    expect(rankOf(p).index).toBe(RANKS.length - 1);
    expect(rankOf(p).starsToNext).toBeNull();
  });

  it('Stake Katalog enthält die Einsteigerstufe vor der Leiter', () => {
    expect(STAKES[0].id).toBe('morgenrot');
    expect(STAKES[0].cumulative).toBe(false);
  });

  it('ein voller Bot Durchlauf einer Runde schaltet Basis Erfolge frei', () => {
    const p = newProfile();
    const run = createRun({ seed: 'ACHV0003', stakeId: 'morgenrot' });
    run.rules.blindTargetFactor = 0.01;
    selectBlind(run);
    playHand(run, run.round!.hand.slice(0, 5).map((c) => c.id));
    afterHand(run);
    expect(run.phase).toBe('roundWon');
    cashOut(run);
    observeRun(p, run);
    const ids = evaluateAchievements(p, run, ctx).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['erster_lichtblick', 'erste_huerde', 'ein_schlag']));
  });
});
