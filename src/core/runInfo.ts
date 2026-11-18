/** Daten für die Run Info (Briefing 9.1): Hände mit Level, Blinds der Ante, Deck Übersicht. */
import { HAND_DATA, HAND_ORDER } from '../data/hands';
import { RANKS, SUITS } from '../data/cards';
import { BLIND_KINDS, BLIND_NAMES, blindReward, type BlindKind } from './blinds';
import { handBase } from './hands';
import { BOSS_BY_ID, currentTarget, type RunState } from './run';
import type { HandType, Rank, Suit } from './types';

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
  byRank: Record<Rank, number>;
  bySuit: Record<Suit, number>;
  /** Karten mit Enhancement, Seal oder Edition */
  modified: number;
}

export function deckStats(run: RunState): DeckStats {
  const byRank = Object.fromEntries(RANKS.map((r) => [r, 0])) as Record<Rank, number>;
  const bySuit = Object.fromEntries(SUITS.map((s) => [s, 0])) as Record<Suit, number>;
  let modified = 0;
  for (const c of run.deck) {
    byRank[c.rank]++;
    bySuit[c.suit]++;
    if (c.enhancement || c.seal || c.edition) modified++;
  }
  return { total: run.deck.length, remaining: run.round ? run.round.drawPile.length : null, byRank, bySuit, modified };
}
