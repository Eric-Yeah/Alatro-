import { FACE_RANKS, RANKS, RANK_CHIPS, RANK_LABELS, SUITS, SUIT_NAMES, SUIT_SYMBOLS } from '../data/cards';
import { ENHANCEMENTS } from '../data/modifiers';
import type { Card, Rank, Suit } from './types';

export type { Card, Rank, Suit } from './types';
export { RANKS, SUITS, SUIT_NAMES, SUIT_SYMBOLS };

export function chipValue(rank: Rank): number {
  return RANK_CHIPS[rank];
}

export function rankLabel(rank: Rank): string {
  return RANK_LABELS[rank];
}

export function isFace(rank: Rank): boolean {
  return FACE_RANKS.includes(rank);
}

export function isRankless(card: Card): boolean {
  return !!card.enhancement && !!ENHANCEMENTS[card.enhancement]?.rankless;
}

export function isAnySuit(card: Card): boolean {
  return !!card.enhancement && !!ENHANCEMENTS[card.enhancement]?.anySuit;
}

/** Hat die Karte (für Joker Bedingungen) diese Suit? Ranglose Karten haben keine. */
export function hasSuit(card: Card, suit: Suit): boolean {
  if (isRankless(card)) return false;
  return isAnySuit(card) || card.suit === suit;
}

export function createStandardDeck(): Card[] {
  const cards: Card[] = [];
  let id = 1;
  for (const suit of SUITS) for (const rank of RANKS) cards.push({ id: id++, suit, rank });
  return cards;
}

export function sortByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.rank - a.rank || SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit));
}

export function sortBySuit(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit) || b.rank - a.rank);
}
