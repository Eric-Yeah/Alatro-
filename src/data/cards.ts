import type { Rank, Suit } from '../core/types';

export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const SUIT_NAMES: Record<Suit, string> = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const SUIT_SYMBOLS: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
/** Suit Gruppen für die "smeared" Regel */
export const SUIT_COLOR_GROUP: Record<Suit, 'red' | 'black'> = { S: 'black', C: 'black', H: 'red', D: 'red' };

export const RANK_LABELS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

/** Chips pro Rang (Briefing 3.8): Zahl, Face Cards 10, Ace 11 */
export const RANK_CHIPS: Record<Rank, number> = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 10, 12: 10, 13: 10, 14: 11,
};

export const FACE_RANKS: readonly Rank[] = [11, 12, 13];
export const ACE: Rank = 14;
/** Ace als niedrige Karte in A 2 3 4 5 */
export const ACE_LOW_VALUE = 1;
