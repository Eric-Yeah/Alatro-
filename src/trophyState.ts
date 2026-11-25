/**
 * Zustand des Pokalsystems: Startwert und Einlesen (Schutz gegen kaputte oder alte Speicherstände).
 * Rein, ohne Browser. Die Logik (Verbuchen, Abholen, Ausrüsten) liegt in `src/trophies.ts`.
 */
import {
  COSMETIC_CATEGORIES,
  HISTORY_MAX,
  type CosmeticCategory,
  type TrophyHistoryEntry,
  type TrophyLine,
  type TrophyLineKind,
  type TrophyRunSync,
  type TrophyState,
} from './data/trophyTypes';

const LINE_KINDS: readonly TrophyLineKind[] = [
  'round', 'lostRound', 'reserve', 'overkill', 'stakeBonus', 'streakBonus', 'dailyBonus', 'winBonus', 'deckFirstWin', 'newBestAnte', 'dailyFirst',
];

export function newTrophyState(): TrophyState {
  return {
    total: 0,
    byDeck: {},
    claimed: {},
    owned: {},
    equipped: Object.fromEntries(COSMETIC_CATEGORIES.map((c) => [c, ''])) as Record<CosmeticCategory, string>,
    equippedAt: 0,
    streak: 0,
    bestStreak: 0,
    deckFirstWin: {},
    dailyPaid: {},
    leagueSeen: 0,
    history: [],
    run: null,
  };
}

const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const nat = (v: unknown, d = 0) => Math.max(0, Math.floor(num(v, d)));

function rec(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (typeof x === 'number' && Number.isFinite(x)) out[k] = x;
  return out;
}

function parseLine(v: unknown): TrophyLine | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!LINE_KINDS.includes(o.kind as TrophyLineKind)) return null;
  const line: TrophyLine = { kind: o.kind as TrophyLineKind, amount: Math.floor(num(o.amount)) };
  if (typeof o.ante === 'number' && Number.isFinite(o.ante)) line.ante = o.ante;
  if (o.blind === 'small' || o.blind === 'big' || o.blind === 'boss') line.blind = o.blind;
  if (typeof o.percent === 'number' && Number.isFinite(o.percent)) line.percent = o.percent;
  return line;
}

function parseHistory(v: unknown): TrophyHistoryEntry[] {
  if (!Array.isArray(v)) return [];
  const out: TrophyHistoryEntry[] = [];
  for (const e of v) {
    if (!e || typeof e !== 'object' || typeof (e as TrophyHistoryEntry).runId !== 'string') continue;
    const h = e as TrophyHistoryEntry;
    out.push({
      runId: h.runId, at: num(h.at), deckId: String(h.deckId ?? ''), ante: nat(h.ante), won: h.won === true,
      gained: nat(h.gained), end: h.end === 'abandoned' ? 'abandoned' : 'finished',
    });
  }
  return out.slice(-HISTORY_MAX);
}

function parseRun(v: unknown): TrophyRunSync | null {
  if (!v || typeof v !== 'object' || typeof (v as TrophyRunSync).runId !== 'string') return null;
  const o = v as TrophyRunSync;
  return {
    runId: o.runId,
    deckId: String(o.deckId ?? ''),
    credited: Array.isArray(o.credited) ? o.credited.filter((k) => typeof k === 'string') : [],
    gained: nat(o.gained),
    lines: Array.isArray(o.lines) ? o.lines.map(parseLine).filter((l): l is TrophyLine => !!l) : [],
    streakFactor: Math.max(1, num(o.streakFactor, 1)),
    winPaid: o.winPaid === true,
    ended: o.ended === true,
    bestAntePaid: nat(o.bestAntePaid),
  };
}

/** Liest rohe Daten ein und ergänzt fehlende oder ungültige Felder durch Standardwerte */
export function parseTrophyState(raw: unknown): TrophyState {
  const base = newTrophyState();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Partial<TrophyState>;
  base.total = nat(o.total);
  base.byDeck = rec(o.byDeck);
  base.claimed = rec(o.claimed);
  base.owned = rec(o.owned);
  if (o.equipped && typeof o.equipped === 'object') {
    for (const c of COSMETIC_CATEGORIES) {
      const id = (o.equipped as Record<string, unknown>)[c];
      base.equipped[c] = typeof id === 'string' ? id : '';
    }
  }
  base.equippedAt = num(o.equippedAt);
  base.streak = nat(o.streak);
  base.bestStreak = Math.max(base.streak, nat(o.bestStreak));
  base.deckFirstWin = rec(o.deckFirstWin);
  base.dailyPaid = rec(o.dailyPaid);
  base.leagueSeen = nat(o.leagueSeen);
  base.history = parseHistory(o.history);
  base.run = parseRun(o.run);
  return base;
}
