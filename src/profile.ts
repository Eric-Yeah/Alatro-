/**
 * Profil: Statistik über alle Runs, freigeschaltete Erfolge, Tageslauf Verlauf und Einführungs Status.
 * Die Auswertung (`observeRun`) ist rein und idempotent: Sie darf nach jedem Schritt aufgerufen werden
 * und rechnet nur die Differenz zum letzten Stand desselben Runs dazu. Nur load und save berühren
 * den Browser Speicher.
 */
import { DAILY_HISTORY } from './data/daily';
import type { ProfileNumStat } from './data/achievements';
import { STAKES } from './data/stakes';
import type { RunState } from './core/run';

const KEY = 'alatro.profile.v1';

/** Stand der letzten Auswertung eines Runs, damit nur Differenzen gezählt werden */
export interface ProfileSync {
  runId: string;
  hands: number;
  handsPlayed: Record<string, number>;
  discards: number;
  rerolls: number;
  jokersBought: number;
  skips: number;
  blindsWon: number;
  bossesBeaten: number;
  vouchers: number;
  /** Sieg und Niederlage dieses Runs sind schon gezählt */
  winCounted: boolean;
  lossCounted: boolean;
  /** Rekorde vor Beginn dieses Runs (für "Neuer Rekord" in der Rückschau) */
  startBestHand: number;
  startBestAnte: number;
}

export interface DailyEntry {
  ante: number;
  won: boolean;
  seed: string;
  deckId: string;
}

export interface Profile {
  version: 1;
  created: number;
  stats: Record<ProfileNumStat, number>;
  handCounts: Record<string, number>;
  unlocked: Record<string, number>;
  winsByDeck: Record<string, number>;
  winsByStake: Record<string, number>;
  /** Siege je Deck und fester Stufe, Schlüssel `deckId|stakeId` (Siegel am Deck) */
  winsByDeckStake: Record<string, number>;
  /** höchste Stufe der skalierenden Schwierigkeit, auf der ein Run gewonnen wurde (0 = keine) */
  bestScale: number;
  /** Einführungsrunde abgeschlossen */
  tutorialDone: boolean;
  /** Angebot der Einführungsrunde wurde gezeigt (angenommen oder übersprungen) */
  tutorialOffered: boolean;
  daily: Record<string, DailyEntry>;
  sync: ProfileSync | null;
}

const NUM_STATS: ProfileNumStat[] = [
  'runs', 'wins', 'losses', 'hands', 'discards', 'blindsWon', 'bossesBeaten', 'skips', 'bestHand', 'bestAnte',
  'jokersBought', 'rerolls', 'vouchersBought', 'moneyPeak',
];

export function newProfile(): Profile {
  return {
    version: 1,
    created: Date.now(),
    stats: Object.fromEntries(NUM_STATS.map((k) => [k, 0])) as Record<ProfileNumStat, number>,
    handCounts: {},
    unlocked: {},
    winsByDeck: {},
    winsByStake: {},
    winsByDeckStake: {},
    bestScale: 0,
    tutorialDone: false,
    tutorialOffered: false,
    daily: {},
    sync: null,
  };
}

/** Ergänzt fehlende Felder gelesener Daten durch Standardwerte (Schutz gegen kaputte oder alte Speicherstände) */
export function parseProfile(raw: unknown): Profile {
  const base = newProfile();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<Profile>;
  const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const rec = (v: unknown): Record<string, number> => {
    const out: Record<string, number> = {};
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (typeof x === 'number' && Number.isFinite(x)) out[k] = x;
    return out;
  };
  for (const k of NUM_STATS) base.stats[k] = num(o.stats?.[k]);
  base.created = num(o.created, base.created);
  base.handCounts = rec(o.handCounts);
  base.unlocked = rec(o.unlocked);
  base.winsByDeck = rec(o.winsByDeck);
  base.winsByStake = rec(o.winsByStake);
  base.winsByDeckStake = rec(o.winsByDeckStake);
  base.bestScale = num(o.bestScale);
  base.tutorialDone = o.tutorialDone === true;
  base.tutorialOffered = o.tutorialOffered === true;
  if (o.daily && typeof o.daily === 'object') {
    for (const [k, v] of Object.entries(o.daily)) {
      if (v && typeof v === 'object') base.daily[k] = { ante: num(v.ante), won: v.won === true, seed: String(v.seed ?? ''), deckId: String(v.deckId ?? '') };
    }
  }
  if (o.sync && typeof o.sync === 'object' && typeof o.sync.runId === 'string') {
    const s = o.sync;
    base.sync = {
      runId: s.runId, hands: num(s.hands), handsPlayed: rec(s.handsPlayed), discards: num(s.discards), rerolls: num(s.rerolls),
      jokersBought: num(s.jokersBought), skips: num(s.skips), blindsWon: num(s.blindsWon), bossesBeaten: num(s.bossesBeaten),
      vouchers: num(s.vouchers), winCounted: s.winCounted === true, lossCounted: s.lossCounted === true,
      startBestHand: num(s.startBestHand), startBestAnte: num(s.startBestAnte),
    };
  }
  return base;
}

function runCounters(run: RunState) {
  const hands = Object.values(run.handsPlayed).reduce((a, b) => a + b, 0);
  // blindIndex zählt auch übersprungene Blinds, deshalb wird die Zahl der Skips abgezogen
  const blindsWon = Math.max(0, (run.ante - 1) * 3 + run.blindIndex - run.skips);
  return {
    hands,
    discards: run.stats.discardsUsed,
    rerolls: run.stats.rerolls,
    jokersBought: run.stats.jokersBought,
    skips: run.skips,
    blindsWon,
    bossesBeaten: Math.max(0, run.ante - 1),
    vouchers: run.vouchers.length,
  };
}

export function deckStakeKey(deckId: string, stakeId: string): string {
  return `${deckId}|${stakeId}`;
}

/** Höchste Stufe der Leiter, auf der mit dem Deck gewonnen wurde: Rang (0 beginnt) und Id, oder null */
export function deckSeal(p: Profile, deckId: string): { rank: number; stakeId: string } | null {
  let best: { rank: number; stakeId: string } | null = null;
  for (const s of STAKES) {
    const rank = stakeRank(s.id);
    if (rank < 0 || !p.winsByDeckStake[deckStakeKey(deckId, s.id)]) continue;
    if (!best || rank > best.rank) best = { rank, stakeId: s.id };
  }
  return best;
}

/** Die nächste Stufe der Leiter nach dem Siegel des Decks (die erste, wenn es noch keins hat), oder null am Ende */
export function nextSealGoal(p: Profile, deckId: string): string | null {
  const ladder = STAKES.filter((s) => s.cumulative !== false);
  const seal = deckSeal(p, deckId);
  const next = ladder[(seal?.rank ?? -1) + 1];
  return next ? next.id : null;
}

/** Rang eines Stake auf der Leiter (Einsteigerstufen und skalierende Läufe haben keinen) */
export function stakeRank(stakeId: string): number {
  const ladder = STAKES.filter((s) => s.cumulative !== false);
  return ladder.findIndex((s) => s.id === stakeId);
}

/**
 * Übernimmt den Stand eines Runs ins Profil. Rein bezüglich des Browsers, verändert nur `p`.
 * Gibt true zurück, wenn sich etwas geändert hat (dann sollte gespeichert werden).
 */
export function observeRun(p: Profile, run: RunState): boolean {
  const before = JSON.stringify(p);
  const cur = runCounters(run);
  let sync = p.sync;
  if (!sync || sync.runId !== run.runId) {
    p.stats.runs++;
    sync = {
      runId: run.runId, hands: 0, handsPlayed: {}, discards: 0, rerolls: 0, jokersBought: 0, skips: 0, blindsWon: 0, bossesBeaten: 0,
      vouchers: 0, winCounted: false, lossCounted: false, startBestHand: p.stats.bestHand, startBestAnte: p.stats.bestAnte,
    };
    p.sync = sync;
  }
  const add = (stat: ProfileNumStat, key: keyof typeof cur) => {
    const d = cur[key] - (sync![key] as number);
    if (d > 0) p.stats[stat] += d;
    sync![key] = cur[key] as never;
  };
  add('hands', 'hands');
  add('discards', 'discards');
  add('rerolls', 'rerolls');
  add('jokersBought', 'jokersBought');
  add('skips', 'skips');
  add('blindsWon', 'blindsWon');
  add('bossesBeaten', 'bossesBeaten');
  add('vouchersBought', 'vouchers');
  for (const [type, n] of Object.entries(run.handsPlayed)) {
    const d = n - (sync.handsPlayed[type] ?? 0);
    if (d > 0) p.handCounts[type] = (p.handCounts[type] ?? 0) + d;
    sync.handsPlayed[type] = n;
  }
  p.stats.bestHand = Math.max(p.stats.bestHand, run.stats.bestHand);
  p.stats.bestAnte = Math.max(p.stats.bestAnte, run.ante);
  p.stats.moneyPeak = Math.max(p.stats.moneyPeak, run.stats.moneyPeak, run.money);

  if (run.won && !sync.winCounted) {
    sync.winCounted = true;
    p.stats.wins++;
    p.winsByDeck[run.deckId] = (p.winsByDeck[run.deckId] ?? 0) + 1;
    p.winsByStake[run.stakeId] = (p.winsByStake[run.stakeId] ?? 0) + 1;
    if (run.difficulty !== null) p.bestScale = Math.max(p.bestScale, run.difficulty);
    else {
      const k = deckStakeKey(run.deckId, run.stakeId);
      p.winsByDeckStake[k] = (p.winsByDeckStake[k] ?? 0) + 1;
    }
  }
  if (run.phase === 'gameOver' && !run.won && !sync.lossCounted) {
    sync.lossCounted = true;
    p.stats.losses++;
  }
  if (run.daily) {
    const e = p.daily[run.daily] ?? { ante: 0, won: false, seed: run.seed, deckId: run.deckId };
    e.ante = Math.max(e.ante, run.ante);
    e.won = e.won || run.won;
    p.daily[run.daily] = e;
    const keys = Object.keys(p.daily).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - DAILY_HISTORY))) delete p.daily[k];
  }
  return JSON.stringify(p) !== before;
}

// ─────────────────────────────────────────────── Speicher

let current: Profile | null = null;

export function getProfile(): Profile {
  if (!current) {
    try {
      current = parseProfile(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
    } catch {
      current = newProfile();
    }
  }
  return current;
}

export function saveProfile() {
  try {
    if (current) localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* Speicher nicht verfügbar */
  }
}

/** Nur für Tests: Profil im Speicher ersetzen */
export function setProfileForTest(p: Profile | null) {
  current = p;
}
