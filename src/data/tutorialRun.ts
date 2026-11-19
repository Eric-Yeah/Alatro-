/**
 * Einführungsrunde: ein festes Szenario mit vorbereiteten Karten, damit jeder Schritt gelingt.
 * Die Zahlen und Karten stehen hier, der Ablauf in `core/tutorialRun.ts` und `data/guide.ts`.
 * Kartenschlüssel: Rang plus Suit, z. B. KH (König Herz), 10C (Kreuz 10), JS (Bube Pik).
 */
export const TUTORIAL_SEED = 'LERNEN01';
export const TUTORIAL_DECK = 'nachthimmel';
/** Faktor auf alle Blind Ziele (Small Blind 210, Big Blind 315) */
export const TUTORIAL_TARGET_FACTOR = 0.7;
/** Joker, den die Einführung im Shop anbietet, und sein Preis */
export const TUTORIAL_SHOP = [
  { defId: 'funke', price: 2 },
  { defId: 'treppe', price: 4 },
];
/** Joker, den der Spieler kaufen soll */
export const TUTORIAL_JOKER = 'funke';

export interface RiggedRound {
  /** Startkarten der Hand */
  hand: string[];
  /** Karten, die als Nächstes nachgezogen werden, in dieser Reihenfolge */
  draws: string[];
}

export const TUTORIAL_ROUNDS: readonly RiggedRound[] = [
  // Small Blind: Pair, Discard, Flush
  { hand: ['KH', 'KS', '4H', '8H', 'JH', '2C', '6D', '9S'], draws: ['10H', '5C', 'QH', '3C', '7S'] },
  // Big Blind: Full House mit dem Funke
  { hand: ['QS', 'QH', 'QD', 'JC', 'JS', '3D', '7C', '9H'], draws: [] },
];

/** Karten, die der Spieler in den Schritten auswählen soll */
export const TUTORIAL_PICKS = {
  pair: ['KH', 'KS'],
  discard: ['2C', '6D', '9S'],
  flush: ['4H', '8H', '10H', 'JH', 'QH'],
  full: ['QS', 'QH', 'QD', 'JC', 'JS'],
};
