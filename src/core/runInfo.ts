/** Daten für die Run Info (Briefing 9.1): Hände mit Level, Blinds der Ante, Deck Übersicht. */
import { HAND_DATA, HAND_ORDER, MIN_HAND_LEVEL } from '../data/hands';
import { RANKS, SUITS } from '../data/cards';
import { CONSUMABLE_BY_ID } from '../data/consumables';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { BLIND_KINDS, BLIND_NAMES, blindReward, type BlindKind } from './blinds';
import { isRankless, sortByRank, sortBySuit } from './cards';
import { handBase, levelUp, levelUpAll, mostPlayedHand } from './hands';
import { BOSS_BY_ID, currentTarget, type RunState } from './run';
import type { Card, HandType, Rank, Suit } from './types';

export interface HandRow {
  type: HandType;
  /** "???" bei einer geheimen Hand, die noch nie gespielt wurde */
  name: string;
  hidden: boolean;
  level: number;
  chips: number;
  mult: number;
  played: number;
}

/** Alle Hände, beste zuerst. Geheime Hände bleiben bis zum ersten Spielen versteckt (H6). */
export function handRows(run: RunState): HandRow[] {
  return HAND_ORDER.map((type) => {
    const played = run.handsPlayed[type] ?? 0;
    const hidden = HAND_DATA[type].secret && played === 0;
    const level = run.handLevels[type];
    const base = handBase(type, level);
    return { type, name: hidden ? '???' : HAND_DATA[type].name, hidden, level, chips: hidden ? 0 : base.chips, mult: hidden ? 0 : base.mult, played };
  });
}

export interface BlindRow {
  kind: BlindKind;
  name: string;
  target: number;
  reward: number;
  state: 'done' | 'current' | 'future';
  bossId?: string;
  tagId?: string;
}

/** Die drei Blinds der aktuellen Ante mit Ziel, Belohnung, Boss und Skip Tag */
export function blindRows(run: RunState): BlindRow[] {
  return BLIND_KINDS.map((kind, i) => ({
    kind,
    name: kind === 'boss' && run.anteBoss ? BOSS_BY_ID[run.anteBoss].name : BLIND_NAMES[kind],
    target: currentTarget(run, kind),
    reward: blindReward(run.ante, kind, run.rules.smallBlindReward),
    state: i < run.blindIndex ? 'done' : i === run.blindIndex ? 'current' : 'future',
    ...(kind === 'boss' && run.anteBoss ? { bossId: run.anteBoss } : {}),
    ...(kind !== 'boss' && run.anteTags ? { tagId: run.anteTags[kind] } : {}),
  }));
}

export interface DeckStats {
  total: number;
  /** Karten im Nachziehstapel, solange eine Runde läuft */
  remaining: number | null;
  /** Karten mit Rang und Suit nach Rang. Ranglose Karten (Obsidian) zählen hier nicht mit, sie stehen in `rankless`. */
  byRank: Record<Rank, number>;
  bySuit: Record<Suit, number>;
  /** wie byRank und bySuit, aber nur der Nachziehstapel (null außerhalb einer Runde) */
  remainingByRank: Record<Rank, number> | null;
  remainingBySuit: Record<Suit, number> | null;
  /** Karten ohne Rang und Suit (Obsidian), gesamt und im Nachziehstapel */
  rankless: number;
  remainingRankless: number | null;
  /** Karten mit Enhancement, Seal oder Edition */
  modified: number;
}

const zeroRanks = () => Object.fromEntries(RANKS.map((r) => [r, 0])) as Record<Rank, number>;
const zeroSuits = () => Object.fromEntries(SUITS.map((s) => [s, 0])) as Record<Suit, number>;

export function deckStats(run: RunState): DeckStats {
  const byRank = zeroRanks();
  const bySuit = zeroSuits();
  const pile = run.round ? new Set(run.round.drawPile.map((c) => c.id)) : null;
  const remainingByRank = pile ? zeroRanks() : null;
  const remainingBySuit = pile ? zeroSuits() : null;
  let rankless = 0;
  let remainingRankless = pile ? 0 : null;
  let modified = 0;
  for (const c of run.deck) {
    if (c.enhancement || c.seal || c.edition) modified++;
    const inPile = !!pile && pile.has(c.id);
    if (isRankless(c)) {
      rankless++;
      if (inPile) remainingRankless!++;
      continue;
    }
    byRank[c.rank]++;
    bySuit[c.suit]++;
    if (inPile) {
      remainingByRank![c.rank]++;
      remainingBySuit![c.suit]++;
    }
  }
  return {
    total: run.deck.length,
    remaining: run.round ? run.round.drawPile.length : null,
    byRank, bySuit, remainingByRank, remainingBySuit, rankless, remainingRankless, modified,
  };
}

// ─────────────────────────────────────────────── Deck Ansicht

export type DeckSort = 'rank' | 'suit';

/** Eine Karte des Decks an ihrem Platz im Raster der Deck Ansicht */
export interface DeckCell {
  card: Card;
  /** liegt im Nachziehstapel (außerhalb einer Runde zählen alle Karten dazu) */
  inPile: boolean;
  col: number;
  row: number;
}

export interface DeckLayout {
  cells: DeckCell[];
  cols: number;
  rows: number;
}

/**
 * Raster der Deck Ansicht. Eine Spalte je Rang (Ace links). `rank`: Karten eines Rangs stapeln sich nach Suit.
 * `suit`: eine Zeilengruppe je Suit, gleiche Ränge einer Suit stapeln sich in der Gruppe. Ranglose Karten stehen
 * am Ende in eigenen Zeilen. `onlyPile` zeigt nur den Nachziehstapel (die Lücken schließen sich).
 */
export function deckLayout(run: RunState, sort: DeckSort, onlyPile = false): DeckLayout {
  const pile = run.round ? new Set(run.round.drawPile.map((c) => c.id)) : null;
  const inPile = (c: Card) => !pile || pile.has(c.id);
  const cols = RANKS.length;
  const colOf = (rank: Rank) => cols - 1 - RANKS.indexOf(rank);
  const cards = run.deck.filter((c) => !onlyPile || inPile(c));
  const plain = cards.filter((c) => !isRankless(c));
  const placed: DeckCell[] = [];
  let rows = 0;
  if (sort === 'rank') {
    const next = new Array<number>(cols).fill(0);
    for (const card of sortByRank(plain)) {
      const col = colOf(card.rank);
      placed.push({ card, inPile: inPile(card), col, row: next[col]++ });
    }
    rows = Math.max(0, ...next);
  } else {
    // Höhe der Gruppe einer Suit: höchste Zahl gleicher Ränge
    const count = new Map<string, number>();
    const height = new Map<Suit, number>();
    for (const c of plain) {
      const k = `${c.suit}${c.rank}`;
      const n = (count.get(k) ?? 0) + 1;
      count.set(k, n);
      height.set(c.suit, Math.max(height.get(c.suit) ?? 0, n));
    }
    const base = new Map<Suit, number>();
    for (const suit of SUITS) {
      if (!height.has(suit)) continue;
      base.set(suit, rows);
      rows += height.get(suit)!;
    }
    const seen = new Map<string, number>();
    for (const card of sortBySuit(plain)) {
      const k = `${card.suit}${card.rank}`;
      const n = seen.get(k) ?? 0;
      seen.set(k, n + 1);
      placed.push({ card, inPile: inPile(card), col: colOf(card.rank), row: base.get(card.suit)! + n });
    }
  }
  const loose = cards.filter(isRankless).sort((a, b) => a.id - b.id);
  const looseCells = loose.map((card, i) => ({ card, inPile: inPile(card), col: i % cols, row: rows + Math.floor(i / cols) }));
  if (loose.length) rows += Math.ceil(loose.length / cols);
  return { cells: [...placed, ...looseCells], cols, rows };
}

/** Enhancement, Seal und Edition einer Karte mit Namen und Beschreibung (für die Detailansicht) */
export interface CardMod {
  kind: 'enhancement' | 'seal' | 'edition';
  id: string;
  name: string;
  description: string;
}

export function cardMods(card: Card): CardMod[] {
  const out: CardMod[] = [];
  const e = card.enhancement ? ENHANCEMENTS[card.enhancement] : undefined;
  if (e) out.push({ kind: 'enhancement', id: e.id, name: e.name, description: e.description });
  const s = card.seal ? SEALS[card.seal] : undefined;
  if (s) out.push({ kind: 'seal', id: s.id, name: s.name, description: s.description });
  const d = card.edition ? EDITIONS[card.edition] : undefined;
  if (d) out.push({ kind: 'edition', id: d.id, name: d.name, description: d.description });
  return out;
}

// ─────────────────────────────────────────────── Level up Vorschau der Sternbilder

/** Wert vorher und nachher mit Unterschied */
export interface LevelDelta {
  from: number;
  to: number;
  diff: number;
}

const delta = (from: number, to: number): LevelDelta => ({ from, to, diff: to - from });

/** Eine Hand mit Level, Chips und Mult vor und nach dem Level up */
export interface HandLevelRow {
  type: HandType;
  name: string;
  level: LevelDelta;
  chips: LevelDelta;
  mult: LevelDelta;
}

function handLevelRow(run: RunState, type: HandType, amount: number): HandLevelRow {
  const from = run.handLevels[type];
  const to = levelUp(run.handLevels, type, amount)[type];
  const a = handBase(type, from);
  const b = handBase(type, to);
  return { type, name: HAND_DATA[type].name, level: delta(from, to), chips: delta(a.chips, b.chips), mult: delta(a.mult, b.mult) };
}

function isHidden(run: RunState, type: HandType): boolean {
  return HAND_DATA[type].secret && (run.handsPlayed[type] ?? 0) === 0;
}

export type LevelUpPreview =
  | {
      /** Sternbild: eine Hand */
      kind: 'hand';
      /** geheime Hand, die noch nie gespielt wurde: Name, Chips und Mult bleiben verborgen */
      hidden: boolean;
      amount: number;
      /** null bei einer versteckten Hand */
      row: HandLevelRow | null;
      /** Level vorher und nachher (auch bei einer versteckten Hand) */
      level: LevelDelta;
      /** Fernrohr: X Mult des Sternbilds im Slot, wenn seine Hand gespielt wird (null ohne Voucher) */
      heldXMult: number | null;
    }
  | {
      /** Omen: alle Hände steigen */
      kind: 'all';
      amount: number;
      /** sichtbare Hände (geheime ungespielte Hände zählen nicht, sonst verrieten die Werte ihre Namen) */
      count: number;
      hiddenCount: number;
      /** kleinster und größter Zuwachs unter den sichtbaren Händen */
      chipsGain: [number, number];
      multGain: [number, number];
      /** meistgespielte sichtbare Hand als Beispiel, null wenn noch nichts gespielt wurde */
      focus: HandLevelRow | null;
    };

/** Wirkung eines Sternbilds (Level up einer Hand), von `levelMostPlayed` (meistgespielte Hand) oder des Omens mit `destroyAndLevelAll`, sonst null. */
export function levelUpPreview(run: RunState, defId: string): LevelUpPreview | null {
  const e = CONSUMABLE_BY_ID[defId]?.effect;
  if (!e) return null;
  if (e.kind === 'levelHand') {
    const hidden = isHidden(run, e.hand);
    const row = handLevelRow(run, e.hand, e.amount);
    const x = run.rules.sternbildXMult;
    return { kind: 'hand', hidden, amount: e.amount, row: hidden ? null : row, level: row.level, heldXMult: x > 1 ? x : null };
  }
  if (e.kind === 'levelMostPlayed') {
    const top = mostPlayedHand(run.handsPlayed);
    if (!top) return null;
    const row = handLevelRow(run, top, e.amount);
    return { kind: 'hand', hidden: false, amount: e.amount, row, level: row.level, heldXMult: null };
  }
  if (e.kind === 'destroyAndLevelAll') {
    const visible = HAND_ORDER.filter((h) => !isHidden(run, h));
    const after = levelUpAll(run.handLevels, e.levels);
    const gains = visible.map((h) => {
      const a = handBase(h, run.handLevels[h]);
      const b = handBase(h, after[h]);
      return { chips: b.chips - a.chips, mult: b.mult - a.mult };
    });
    const range = (v: number[]): [number, number] => [Math.min(...v), Math.max(...v)];
    const top = visible.filter((h) => (run.handsPlayed[h] ?? 0) > 0).sort((a, b) => (run.handsPlayed[b] ?? 0) - (run.handsPlayed[a] ?? 0))[0];
    return {
      kind: 'all',
      amount: e.levels,
      count: visible.length,
      hiddenCount: HAND_ORDER.length - visible.length,
      chipsGain: range(gains.map((g) => g.chips)),
      multGain: range(gains.map((g) => g.mult)),
      focus: top ? handLevelRow(run, top, e.levels) : null,
    };
  }
  return null;
}

/**
 * Zuwachs eines Sternbilds ohne Bezug zu einem Run (Karte, Sammlung): Chips und Mult, die das Level up bringt.
 * Der Zuwachs hängt nicht vom aktuellen Level ab, nur von der Hand und der Zahl der Level.
 */
export function levelUpGain(defId: string): { amount: number; chips: number; mult: number } | null {
  const e = CONSUMABLE_BY_ID[defId]?.effect;
  if (e?.kind !== 'levelHand') return null;
  const a = handBase(e.hand, MIN_HAND_LEVEL);
  const b = handBase(e.hand, MIN_HAND_LEVEL + e.amount);
  return { amount: e.amount, chips: b.chips - a.chips, mult: b.mult - a.mult };
}

/** Beschreibung eines Consumables, bei einem Sternbild einer geheimen noch nie gespielten Hand ohne den Handnamen (wie `handRows`). */
export function consumableDescription(run: RunState, defId: string): string {
  const def = CONSUMABLE_BY_ID[defId];
  if (!def) return '';
  const e = def.effect;
  if (e.kind === 'levelHand' && isHidden(run, e.hand)) return def.description.replace(HAND_DATA[e.hand].name, '???');
  return def.description;
}
