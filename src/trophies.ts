/**
 * Pokalsystem: Verdienst, Pfad, Besitz, Ausrüstung und Zusammenführen. Rein, ohne DOM und ohne Zufall.
 * Alle Zahlen stehen in `src/data/trophies.ts` und `src/data/trophyRoad.ts`, Entwurf in `docs/pokale-plan.md`.
 *
 * `observeTrophies` ist wie `observeRun` rein bezüglich des Browsers und idempotent: Es darf nach jedem
 * Speichern des Runs aufgerufen werden und verbucht nur, was noch nicht verbucht ist. Wichtig für die
 * Oberfläche: Eine gewonnene Runde wird im Zustand `roundWon` verbucht (vor `cashOut`, danach wechseln
 * Phase, Ante und Blind). Eine verlorene Runde im Zustand `gameOver`.
 */
import { BLIND_KINDS } from './core/blinds';
import { DECKS } from './data/decks';
import { TROPHY } from './data/trophies';
import { DECK_STAGES, LEAGUES, ROAD, ROAD_TITLES, categoryOfCosmetic } from './data/trophyRoad';
import {
  HISTORY_MAX,
  type CosmeticCategory,
  type DeckStage,
  type LeagueDef,
  type RoadEntry,
  type TrophyHistoryEntry,
  type TrophyLine,
  type TrophyLineKind,
  type TrophyRunSync,
  type TrophyState,
} from './data/trophyTypes';
import type { RunState } from './core/run';
import type { Profile } from './profile';
import { parseTrophyState } from './trophyState';

type Blind = 'small' | 'big' | 'boss';

// ─────────────────────────────────────────────── Verdienst

/** Ante Faktor: Tabelle für Ante 1 bis 8, im Endless je weitere Ante ein fester Zuwachs */
export function anteFactor(ante: number): number {
  const f = TROPHY.anteFactors;
  if (ante <= 1) return f[0];
  if (ante <= f.length) return f[ante - 1];
  return f[f.length - 1] + TROPHY.endlessAnteStep * (ante - f.length);
}

/** Stake Faktor eines Runs: skalierende Stufe (`1 + Schritt mal Stufe`) oder Faktor der festen Stufe */
export function stakeFactorOf(stakeId: string, difficulty: number | null): number {
  if (difficulty !== null) return 1 + TROPHY.scaleStep * difficulty;
  return Math.max(1, TROPHY.stakeFactors[stakeId] ?? TROPHY.defaultStakeFactor);
}

/** Faktor der Siegesserie für eine Serie (1 = keine), beim Start eines Runs festgehalten */
export function streakFactorFor(streak: number): number {
  const bonus = Math.min(TROPHY.streakCap, TROPHY.streakStep * Math.max(0, streak));
  return Math.round((1 + bonus) * 10000) / 10000;
}

const pct = (factor: number) => Math.round((factor - 1) * 100);

/** Hängt eine Zeile an, deren Menge die Differenz der gerundeten Stände ist (Summe der Zeilen gleich gerundeter Endstand) */
function step(lines: TrophyLine[], kind: TrophyLineKind, before: number, after: number, extra: Partial<TrophyLine> = {}) {
  const amount = Math.round(after) - Math.round(before);
  if (amount !== 0) lines.push({ kind, amount, ...extra });
}

interface FactorCtx {
  stakeId: string;
  difficulty: number | null;
  daily: boolean;
  streakFactor: number;
}

/** Wendet Stake, Serie und Tageslauf nacheinander als Faktor an und gibt den neuen Stand zurück */
function applyFactors(lines: TrophyLine[], acc: number, ctx: FactorCtx, withStake: boolean, extra: Partial<TrophyLine>): number {
  const steps: [TrophyLineKind, number][] = [
    ['stakeBonus', withStake ? stakeFactorOf(ctx.stakeId, ctx.difficulty) : 1],
    ['streakBonus', Math.max(1, ctx.streakFactor)],
    ['dailyBonus', ctx.daily ? 1 + TROPHY.dailyShare : 1],
  ];
  for (const [kind, factor] of steps) {
    if (factor <= 1) continue;
    const next = acc * factor;
    step(lines, kind, acc, next, { ...extra, percent: pct(factor) });
    acc = next;
  }
  return acc;
}

export interface RoundTrophyInput {
  ante: number;
  blind: Blind;
  won: boolean;
  handsLeft: number;
  score: number;
  target: number;
  stakeId: string;
  difficulty: number | null;
  daily: boolean;
  streakFactor: number;
}

/**
 * Verdienst einer Runde. Gewonnen: Basis mal Ante Faktor, dazu Reserve und Überschuss, dann Stake, Serie
 * und Tageslauf als Faktoren. Verloren: Trost (Anteil der Basis, mindestens 1), ohne Zuschläge.
 * Die Summe der Zeilen ist `total`.
 */
export function roundTrophies(input: RoundTrophyInput): { lines: TrophyLine[]; total: number } {
  const lines: TrophyLine[] = [];
  const ref = { ante: input.ante, blind: input.blind };
  const base = TROPHY.baseByBlind[input.blind] * anteFactor(input.ante);
  if (!input.won) {
    lines.push({ kind: 'lostRound', amount: Math.max(TROPHY.lostMin, Math.round(base * TROPHY.lostShare)), ...ref });
    return { lines, total: lines[0].amount };
  }
  let acc = base;
  lines.push({ kind: 'round', amount: Math.round(base), ...ref });
  const reserveRate = Math.min(TROPHY.reserveMax, TROPHY.reservePerHand * Math.max(0, input.handsLeft));
  let add = reserveRate;
  step(lines, 'reserve', acc, base * (1 + reserveRate), { ...ref, percent: Math.round(reserveRate * 100) });
  acc = base * (1 + reserveRate);
  if (input.target > 0 && input.score >= input.target * TROPHY.overkillRatio) {
    add += TROPHY.overkillBonus;
    step(lines, 'overkill', acc, base * (1 + add), { ...ref, percent: Math.round(TROPHY.overkillBonus * 100) });
    acc = base * (1 + add);
  }
  applyFactors(lines, acc, input, true, ref);
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
}

/** Siegbonus für den Run Sieg: Basis mit Stake Zuschlag, darauf Serie und Tageslauf */
export function winTrophies(input: Pick<RoundTrophyInput, 'stakeId' | 'difficulty' | 'daily' | 'streakFactor'>): { lines: TrophyLine[]; total: number } {
  const lines: TrophyLine[] = [];
  const stake = stakeFactorOf(input.stakeId, input.difficulty);
  const acc = TROPHY.winBonus * stake;
  lines.push({ kind: 'winBonus', amount: Math.round(acc), ...(stake > 1 ? { percent: pct(stake) } : {}) });
  applyFactors(lines, acc, input, false, {});
  return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
}

// ─────────────────────────────────────────────── Liga und Pfad

export function leagueIndexOf(total: number): number {
  let idx = 0;
  LEAGUES.forEach((l, i) => { if (total >= l.from) idx = i; });
  return idx;
}

/** Fortschritt in der Liga. In der letzten Liga (`next` null) ist `span` gleich `into`, der Balken also voll. */
export function leagueProgress(total: number): { index: number; def: LeagueDef; next: LeagueDef | null; into: number; span: number } {
  const index = leagueIndexOf(total);
  const def = LEAGUES[index];
  const next = LEAGUES[index + 1] ?? null;
  const into = Math.max(0, total - def.from);
  return { index, def, next, into, span: Math.max(1, next ? next.from - def.from : into) };
}

export type RoadState = 'locked' | 'ready' | 'claimed';

function stateOf(ts: TrophyState, id: string, have: number, threshold: number): RoadState {
  if (id in ts.claimed) return 'claimed';
  return have >= threshold ? 'ready' : 'locked';
}

export function roadStatus(p: Profile): { entry: RoadEntry; state: RoadState }[] {
  const ts = p.trophies;
  return ROAD.map((entry) => ({ entry, state: stateOf(ts, entry.id, ts.total, entry.threshold) }));
}

export function deckStatus(p: Profile, deckId: string): { stage: DeckStage; state: RoadState }[] {
  const ts = p.trophies;
  const have = ts.byDeck[deckId] ?? 0;
  return DECK_STAGES.filter((s) => s.deckId === deckId).map((stage) => ({ stage, state: stateOf(ts, stage.id, have, stage.threshold) }));
}

/** Ids aller abholbereiten, noch nicht abgeholten Einträge (Hauptpfad zuerst, dann die Deck Pfade) */
function readyIds(ts: TrophyState): string[] {
  const out: string[] = [];
  for (const e of ROAD) if (stateOf(ts, e.id, ts.total, e.threshold) === 'ready') out.push(e.id);
  for (const s of DECK_STAGES) if (stateOf(ts, s.id, ts.byDeck[s.deckId] ?? 0, s.threshold) === 'ready') out.push(s.id);
  return out;
}

/** Anzahl abholbereiter Einträge, Hauptpfad plus Deck Pfade */
export function claimableCount(p: Profile): number {
  return readyIds(p.trophies).length;
}

/** Holt einen erreichten Eintrag ab. Gibt die Kosmetik Id zurück, sonst null (unbekannt, nicht erreicht oder schon abgeholt). */
export function claimEntry(p: Profile, entryId: string, now: number = Date.now()): string | null {
  const ts = p.trophies;
  if (!readyIds(ts).includes(entryId)) return null;
  const reward = ROAD.find((e) => e.id === entryId)?.reward ?? DECK_STAGES.find((s) => s.id === entryId)?.reward;
  if (!reward) return null;
  ts.claimed[entryId] = now;
  if (!(reward in ts.owned)) ts.owned[reward] = now;
  return reward;
}

/** Holt alle bereiten Einträge ab, gibt die Kosmetik Ids in Pfad Reihenfolge zurück */
export function claimAll(p: Profile, now: number = Date.now()): string[] {
  const out: string[] = [];
  for (const id of readyIds(p.trophies)) {
    const reward = claimEntry(p, id, now);
    if (reward) out.push(reward);
  }
  return out;
}

// ─────────────────────────────────────────────── Besitz und Ausrüstung

export function isOwned(p: Profile, cosmeticId: string): boolean {
  return cosmeticId in p.trophies.owned;
}

export function equippedId(p: Profile, cat: CosmeticCategory): string {
  return p.trophies.equipped[cat] ?? '';
}

/**
 * Rüstet ein Stück aus ('' setzt den Standard). Gibt false zurück, wenn es nicht besessen wird oder nicht zur
 * Kategorie passt. Bei Paletten merkt sich das Profil die Wahl ebenfalls, die Wunderkammer schreibt zusätzlich
 * `settings.cardPalette` (eine Wahrheit für die Optionen).
 */
export function equip(p: Profile, cat: CosmeticCategory, id: string, now: number = Date.now()): boolean {
  if (id !== '' && (categoryOfCosmetic(id) !== cat || !isOwned(p, id))) return false;
  if (p.trophies.equipped[cat] !== id) {
    p.trophies.equipped[cat] = id;
    p.trophies.equippedAt = now;
  }
  return true;
}

const TITLE_BY_ID = new Map(ROAD_TITLES.map((t) => [t.id, t]));

/** Name des ausgerüsteten Titels, null ohne Titel (dann zeigt die Oberfläche den Rang aus den Erfolgen) */
export function activeTitle(p: Profile): string | null {
  const id = equippedId(p, 'title');
  if (!id || !isOwned(p, id)) return null;
  return TITLE_BY_ID.get(id)?.name ?? null;
}

/**
 * Woher ein Stück kommt: Hauptpfad (Label ist der Liga Name) oder Deck Pfad (Label ist der Deck Name),
 * dazu die Schwelle in Pokalen. Null für Stücke außerhalb der Pfade.
 */
export function unlockHint(cosmeticId: string): { source: 'road' | 'deck'; label: string; threshold: number } | null {
  const e = ROAD.find((x) => x.reward === cosmeticId);
  if (e) return { source: 'road', label: LEAGUES[e.league].name, threshold: e.threshold };
  const s = DECK_STAGES.find((x) => x.reward === cosmeticId);
  if (s) return { source: 'deck', label: DECKS.find((d) => d.id === s.deckId)?.name ?? s.deckId, threshold: s.threshold };
  return null;
}

// ─────────────────────────────────────────────── Verbuchen

export interface TrophyGain {
  /** Neu verbuchte Zeilen dieses Aufrufs */
  lines: TrophyLine[];
  /** Summe dieser Zeilen (kann 0 sein, wenn sich nur der Zustand änderte, zum Beispiel Run Start) */
  amount: number;
  /** Gesamtpokale nach dem Aufruf */
  total: number;
  leagueFrom: number;
  leagueTo: number;
  /** Ids der Pfad Einträge (Haupt und Deck), die durch diesen Aufruf neu abholbar wurden */
  newlyReady: string[];
  /** Dieser Aufruf hat den Run beendet (Sieg oder Niederlage, nicht Abbruch) */
  runEnded: boolean;
}

const sumLines = (lines: TrophyLine[]) => lines.reduce((s, l) => s + l.amount, 0);
const sumDecks = (byDeck: Record<string, number>) => Object.values(byDeck).reduce((s, n) => s + n, 0);

/** Hält `total` gleich der Summe von `byDeck`. Fehlende Pokale landen unter `TROPHY.unknownDeck`, Pokale sinken nie. */
function healTotals(ts: TrophyState) {
  const sum = sumDecks(ts.byDeck);
  if (ts.total < sum) ts.total = sum;
  else if (ts.total > sum) ts.byDeck[TROPHY.unknownDeck] = (ts.byDeck[TROPHY.unknownDeck] ?? 0) + ts.total - sum;
}

function pruneDailyPaid(ts: TrophyState) {
  const keys = Object.keys(ts.dailyPaid).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - TROPHY.dailyPaidKeep))) delete ts.dailyPaid[k];
}

/** Höchste Ante der verbuchten Runden eines Runs (0 ohne Runde) */
function maxAnteOf(cur: TrophyRunSync): number {
  return cur.credited.reduce((m, k) => Math.max(m, Number.parseInt(k, 10) || 0), 0);
}

function addLines(ts: TrophyState, cur: TrophyRunSync, lines: TrophyLine[], out: TrophyLine[]) {
  if (!lines.length) return;
  const amount = sumLines(lines);
  cur.lines.push(...lines);
  cur.gained += amount;
  ts.total += amount;
  ts.byDeck[cur.deckId] = (ts.byDeck[cur.deckId] ?? 0) + amount;
  out.push(...lines);
}

function upsertHistory(ts: TrophyState, cur: TrophyRunSync, won: boolean, end: 'finished' | 'abandoned', now: number) {
  const ante = maxAnteOf(cur);
  const i = ts.history.findIndex((h) => h.runId === cur.runId);
  if (i >= 0) {
    ts.history[i].gained = cur.gained;
    ts.history[i].ante = Math.max(ts.history[i].ante, ante);
    return;
  }
  const entry: TrophyHistoryEntry = { runId: cur.runId, at: now, deckId: cur.deckId, ante, won, gained: cur.gained, end };
  ts.history.push(entry);
  if (ts.history.length > HISTORY_MAX) ts.history.splice(0, ts.history.length - HISTORY_MAX);
}

/** Run Ende: Serie nachführen und in den Verlauf schreiben. Sieg zählt immer als Serie, sonst entscheidet die erreichte Ante. */
function endRun(ts: TrophyState, cur: TrophyRunSync, won: boolean, end: 'finished' | 'abandoned', now: number) {
  cur.ended = true;
  if (won || maxAnteOf(cur) >= TROPHY.streakMinAnte) {
    ts.streak++;
    ts.bestStreak = Math.max(ts.bestStreak, ts.streak);
  } else {
    ts.streak = 0;
  }
  upsertHistory(ts, cur, won, end, now);
}

/** Beste Ante des Spielers vor diesem Run: Stand aus der Statistik (vor dem Run) und dem Verlauf */
function bestAnteBefore(p: Profile, run: RunState): number {
  const stats = p.sync && p.sync.runId === run.runId ? p.sync.startBestAnte : p.stats.bestAnte;
  return Math.max(0, stats, ...p.trophies.history.map((h) => h.ante));
}

/** Zeilen für "Neuer Rekord" und die Tages Prämie, die an der ersten verbuchten Runde der Ante bzw. des Tages hängen */
function creditExtras(ts: TrophyState, cur: TrophyRunSync, run: RunState, ante: number, now: number): TrophyLine[] {
  const lines: TrophyLine[] = [];
  if (ante > cur.bestAntePaid) {
    lines.push({ kind: 'newBestAnte', amount: (ante - cur.bestAntePaid) * TROPHY.bestAnteBonus, ante });
    cur.bestAntePaid = ante;
  }
  if (run.daily && !(run.daily in ts.dailyPaid)) {
    ts.dailyPaid[run.daily] = now;
    pruneDailyPaid(ts);
    lines.push({ kind: 'dailyFirst', amount: TROPHY.dailyFirst });
  }
  return lines;
}

/**
 * Verbucht den Stand des Runs im Profil: gewonnene Runde (Phase `roundWon`), verlorene Runde (`gameOver`),
 * Run Sieg und Run Ende. Gibt null zurück, wenn sich nichts geändert hat. Ändert `p.trophies`, danach `saveProfile()`.
 * Ein neuer Run schließt den vorherigen, falls dieser nicht beendet war, ohne Ende Bonus ab (`abandoned`).
 */
export function observeTrophies(p: Profile, run: RunState, now: number = Date.now()): TrophyGain | null {
  const ts = p.trophies;
  const before = JSON.stringify(ts);
  const leagueFrom = leagueIndexOf(ts.total);
  const readyBefore = new Set(readyIds(ts));
  const gained: TrophyLine[] = [];
  let runEnded = false;

  // Anderer Run als zuletzt: den alten abschließen (nur wenn er schon Runden verbucht hat)
  if (ts.run && ts.run.runId !== run.runId) {
    const old = ts.run;
    if (!old.ended && old.credited.length > 0) endRun(ts, old, false, 'abandoned', now);
    ts.run = null;
  }

  // Ein schon abgeschlossener Run (zum Beispiel nach dem Zusammenführen zurückgekehrt) wird nicht noch einmal gezählt
  if (!ts.run && !ts.history.some((h) => h.runId === run.runId)) {
    ts.run = {
      runId: run.runId, deckId: run.deckId, credited: [], gained: 0, lines: [], streakFactor: streakFactorFor(ts.streak),
      winPaid: false, ended: false, bestAntePaid: bestAnteBefore(p, run),
    };
  }

  const cur = ts.run;
  if (cur && cur.runId === run.runId) {
    const ctx = { stakeId: run.stakeId, difficulty: run.difficulty, daily: !!run.daily, streakFactor: cur.streakFactor };
    const key = `${run.ante}:${run.blindIndex}`;

    // gewonnene Runde (inklusive durch einen Joker gerettete)
    if (run.phase === 'roundWon' && run.round && !cur.credited.includes(key)) {
      const r = run.round;
      cur.credited.push(key);
      const res = roundTrophies({ ...ctx, ante: run.ante, blind: r.blind, won: true, handsLeft: r.handsLeft, score: r.score, target: r.target });
      addLines(ts, cur, [...res.lines, ...creditExtras(ts, cur, run, run.ante, now)], gained);
    }

    // verlorene Runde (auch im Endless nach einem Sieg)
    if (run.phase === 'gameOver' && !cur.credited.includes(key)) {
      cur.credited.push(key);
      const blind = run.round?.blind ?? BLIND_KINDS[run.blindIndex] ?? 'small';
      const res = roundTrophies({ ...ctx, ante: run.ante, blind, won: false, handsLeft: 0, score: 0, target: 0 });
      addLines(ts, cur, [...res.lines, ...creditExtras(ts, cur, run, run.ante, now)], gained);
    }

    // Run Sieg: Bonus, Premiere, Serie
    if (run.won && !cur.winPaid) {
      cur.winPaid = true;
      const lines = winTrophies(ctx).lines;
      if (!(run.deckId in ts.deckFirstWin)) {
        ts.deckFirstWin[run.deckId] = now;
        lines.push({ kind: 'deckFirstWin', amount: TROPHY.deckFirstWin });
      }
      addLines(ts, cur, lines, gained);
      if (!cur.ended) {
        endRun(ts, cur, true, 'finished', now);
        runEnded = true;
      }
    }

    // Run Niederlage
    if (run.phase === 'gameOver' && !run.won && !cur.ended) {
      endRun(ts, cur, false, 'finished', now);
      runEnded = true;
    }

    // Endless nach dem Ende: der Verlauf Eintrag nimmt spätere Pokale mit
    if (cur.ended) upsertHistory(ts, cur, run.won, 'finished', now);
  }

  pruneDailyPaid(ts);
  healTotals(ts);
  if (JSON.stringify(ts) === before) return null;
  const readyAfter = readyIds(ts);
  return {
    lines: gained,
    amount: sumLines(gained),
    total: ts.total,
    leagueFrom,
    leagueTo: leagueIndexOf(ts.total),
    newlyReady: readyAfter.filter((id) => !readyBefore.has(id)),
    runEnded,
  };
}

// ─────────────────────────────────────────────── Zusammenführen (Sync)

function maxRec(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

/** Vereinigung, bei doppelten Schlüsseln gilt der frühere Zeitpunkt */
function minRec(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? Math.min(out[k], v) : v;
  return out;
}

/** Welcher Run Stand gilt: der mit mehr verbuchten Runden, dann mit mehr Pokalen, dann beendet, zuletzt nach Text (für Kommutativität) */
function betterRun(a: TrophyRunSync | null, b: TrophyRunSync | null): TrophyRunSync | null {
  if (!a || !b) return a ?? b;
  const score = (r: TrophyRunSync) => [r.credited.length, r.gained, r.ended ? 1 : 0];
  const sa = score(a);
  const sb = score(b);
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sa[i] > sb[i] ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

/**
 * Führt zwei Stände zusammen. Kommutativ bis auf `run` (nimmt den Stand mit mehr verbuchten Runden, im Profil
 * Merge folgt er dem Stand mit mehr Hands wie `sync`). Es geht nichts verloren: Pokale sinken nie, Abgeholtes bleibt abgeholt.
 * Bekannte Grenze: Haben zwei Geräte verschiedene Runs gespielt, gilt das Maximum je Deck, nicht die Summe.
 */
export function mergeTrophyState(a: TrophyState, b: TrophyState): TrophyState {
  const x = parseTrophyState(a);
  const y = parseTrophyState(b);
  const out = parseTrophyState(x);
  out.byDeck = maxRec(x.byDeck, y.byDeck);
  out.total = Math.max(x.total, y.total, sumDecks(out.byDeck));
  healTotals(out);
  out.claimed = minRec(x.claimed, y.claimed);
  out.owned = minRec(x.owned, y.owned);
  // Abgeholtes ist immer auch besessen
  for (const [id, at] of Object.entries(out.claimed)) {
    const reward = ROAD.find((e) => e.id === id)?.reward ?? DECK_STAGES.find((s) => s.id === id)?.reward;
    if (reward && !(reward in out.owned)) out.owned[reward] = at;
  }
  // Ausrüstung vom Gerät mit der späteren Änderung (bei Gleichstand nach Text, damit die Reihenfolge egal ist)
  const later = x.equippedAt !== y.equippedAt ? (x.equippedAt > y.equippedAt ? x : y) : JSON.stringify(x.equipped) >= JSON.stringify(y.equipped) ? x : y;
  out.equipped = { ...later.equipped };
  out.equippedAt = Math.max(x.equippedAt, y.equippedAt);
  // Serie aus dem Stand mit mehr Gesamtpokalen
  const lead = x.total !== y.total ? (x.total > y.total ? x : y) : x.streak >= y.streak ? x : y;
  out.streak = lead.streak;
  out.bestStreak = Math.max(x.bestStreak, y.bestStreak, out.streak);
  out.deckFirstWin = minRec(x.deckFirstWin, y.deckFirstWin);
  out.dailyPaid = minRec(x.dailyPaid, y.dailyPaid);
  pruneDailyPaid(out);
  out.leagueSeen = Math.max(x.leagueSeen, y.leagueSeen);
  // Verlauf nach Run Id vereinigt, bei doppelten Einträgen gilt der mit mehr Pokalen
  const byRun = new Map<string, TrophyHistoryEntry>();
  for (const h of [...x.history, ...y.history]) {
    const o = byRun.get(h.runId);
    if (!o || h.gained > o.gained || (h.gained === o.gained && h.at > o.at)) byRun.set(h.runId, { ...h });
  }
  out.history = [...byRun.values()].sort((m, n) => m.at - n.at || (m.runId < n.runId ? -1 : 1)).slice(-HISTORY_MAX);
  out.run = betterRun(x.run, y.run);
  return out;
}
