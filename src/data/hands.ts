import type { HandType } from '../core/types';

export interface HandData {
  /** Anzeigename (Spielbegriff, Englisch) */
  name: string;
  chips: number;
  mult: number;
  /** Zuwachs pro Level */
  levelChips: number;
  levelMult: number;
  /** bis zum ersten Spielen in der Run Info versteckt */
  secret: boolean;
}

/** Basiswerte Level 1 und Zuwachs pro Level (Briefing 2.1). */
export const HAND_DATA: Record<HandType, HandData> = {
  highCard:      { name: 'High Card',       chips: 5,   mult: 1,  levelChips: 10, levelMult: 1, secret: false },
  pair:          { name: 'Pair',            chips: 10,  mult: 2,  levelChips: 15, levelMult: 1, secret: false },
  twoPair:       { name: 'Two Pair',        chips: 20,  mult: 2,  levelChips: 20, levelMult: 1, secret: false },
  threeKind:     { name: 'Three of a Kind', chips: 30,  mult: 3,  levelChips: 20, levelMult: 2, secret: false },
  straight:      { name: 'Straight',        chips: 30,  mult: 4,  levelChips: 30, levelMult: 3, secret: false },
  flush:         { name: 'Flush',           chips: 35,  mult: 4,  levelChips: 15, levelMult: 2, secret: false },
  fullHouse:     { name: 'Full House',      chips: 40,  mult: 4,  levelChips: 25, levelMult: 2, secret: false },
  fourKind:      { name: 'Four of a Kind',  chips: 60,  mult: 7,  levelChips: 30, levelMult: 3, secret: false },
  straightFlush: { name: 'Straight Flush',  chips: 100, mult: 8,  levelChips: 40, levelMult: 4, secret: false },
  fiveKind:      { name: 'Five of a Kind',  chips: 120, mult: 12, levelChips: 35, levelMult: 3, secret: true },
  flushHouse:    { name: 'Flush House',     chips: 140, mult: 14, levelChips: 40, levelMult: 4, secret: true },
  flushFive:     { name: 'Flush Five',      chips: 160, mult: 16, levelChips: 50, levelMult: 3, secret: true },
};

/** Rangfolge, höchste zuerst (Briefing 2.2). */
export const HAND_ORDER: readonly HandType[] = [
  'flushFive', 'flushHouse', 'fiveKind', 'straightFlush', 'fourKind', 'fullHouse',
  'flush', 'straight', 'threeKind', 'twoPair', 'pair', 'highCard',
];

export const ROYAL_FLUSH_NAME = 'Royal Flush';
export const MIN_HAND_LEVEL = 1;

/** Größen und Abstände der Hand Erkennung (Briefing 2.2) */
export const DETECTION = {
  flushSize: 5,
  fourFingersSize: 4,
  straightGap: 1,
  shortcutGap: 2,
};
