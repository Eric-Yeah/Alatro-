export type Suit = 'S' | 'H' | 'D' | 'C';
export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];
export const SUIT_NAMES: Record<Suit, string> = { S: 'Pik', H: 'Herz', D: 'Karo', C: 'Kreuz' };
export const SUIT_SYMBOLS: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

/** 2..10, 11 = Bube, 12 = Dame, 13 = König, 14 = Ass */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export interface Card {
  id: number;
  suit: Suit;
  rank: Rank;
  // Later: enhancement, edition, seal
}

export function chipValue(rank: Rank): number {
  if (rank === 14) return 11;
  if (rank >= 11) return 10;
  return rank;
}

export function rankLabel(rank: Rank): string {
  switch (rank) {
    case 11: return 'B';
    case 12: return 'D';
    case 13: return 'K';
    case 14: return 'A';
    default: return String(rank);
  }
}

export function isFace(rank: Rank): boolean {
  return rank >= 11 && rank <= 13;
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
