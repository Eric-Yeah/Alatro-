export type HandType =
  | 'highCard' | 'pair' | 'twoPair' | 'threeKind' | 'straight' | 'flush'
  | 'fullHouse' | 'fourKind' | 'straightFlush' | 'fiveKind' | 'flushHouse' | 'flushFive';

export interface HandInfo {
  name: string;
  chips: number;
  mult: number;
  levelChips: number;
  levelMult: number;
}

/** Starting balance values — tune freely. */
export const HAND_INFO: Record<HandType, HandInfo> = {
  highCard:      { name: 'Höchste Karte',  chips: 5,   mult: 1,  levelChips: 10, levelMult: 1 },
  pair:          { name: 'Paar',           chips: 10,  mult: 2,  levelChips: 15, levelMult: 1 },
  twoPair:       { name: 'Zwei Paare',     chips: 20,  mult: 2,  levelChips: 20, levelMult: 1 },
  threeKind:     { name: 'Drilling',       chips: 30,  mult: 3,  levelChips: 20, levelMult: 2 },
  straight:      { name: 'Straße',         chips: 30,  mult: 4,  levelChips: 30, levelMult: 3 },
  flush:         { name: 'Flush',          chips: 35,  mult: 4,  levelChips: 15, levelMult: 2 },
  fullHouse:     { name: 'Full House',     chips: 40,  mult: 4,  levelChips: 25, levelMult: 2 },
  fourKind:      { name: 'Vierling',       chips: 60,  mult: 7,  levelChips: 30, levelMult: 3 },
  straightFlush: { name: 'Straight Flush', chips: 100, mult: 8,  levelChips: 40, levelMult: 4 },
  fiveKind:      { name: 'Fünfling',       chips: 120, mult: 12, levelChips: 35, levelMult: 3 },
  flushHouse:    { name: 'Flush House',    chips: 140, mult: 14, levelChips: 40, levelMult: 4 },
  flushFive:     { name: 'Flush Five',     chips: 160, mult: 16, levelChips: 50, levelMult: 3 },
};

export const HAND_ORDER: readonly HandType[] = [
  'flushFive', 'flushHouse', 'fiveKind', 'straightFlush', 'fourKind', 'fullHouse',
  'flush', 'straight', 'threeKind', 'twoPair', 'pair', 'highCard',
];

export type HandLevels = Record<HandType, number>;

export function initialHandLevels(): HandLevels {
  return Object.fromEntries(HAND_ORDER.map((h) => [h, 1])) as HandLevels;
}

export function handBase(type: HandType, level: number): { chips: number; mult: number } {
  const info = HAND_INFO[type];
  return {
    chips: info.chips + info.levelChips * (level - 1),
    mult: info.mult + info.levelMult * (level - 1),
  };
}
