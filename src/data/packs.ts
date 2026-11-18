/** Booster Packs (Briefing 6.6) mit eigenen Typen */
export type PackKind = 'joker' | 'karten' | 'sternbild' | 'elixier' | 'omen';
export type PackSize = 'normal' | 'jumbo' | 'mega';

export interface PackDef {
  id: string;
  kind: PackKind;
  size: PackSize;
  name: string;
  cost: number;
  /** Anzahl angebotener Karten */
  choices: number;
  /** Anzahl wählbarer Karten */
  picks: number;
  /** Gewicht für den Shop */
  weight: number;
}

export const PACKS: PackDef[] = [
  { id: 'karten_normal', kind: 'karten', size: 'normal', name: 'Karten Pack', cost: 4, choices: 3, picks: 1, weight: 4 },
  { id: 'karten_jumbo', kind: 'karten', size: 'jumbo', name: 'Jumbo Karten Pack', cost: 6, choices: 5, picks: 1, weight: 2 },
  { id: 'karten_mega', kind: 'karten', size: 'mega', name: 'Mega Karten Pack', cost: 8, choices: 5, picks: 2, weight: 0.5 },
  { id: 'joker_normal', kind: 'joker', size: 'normal', name: 'Joker Pack', cost: 4, choices: 2, picks: 1, weight: 2 },
  { id: 'joker_jumbo', kind: 'joker', size: 'jumbo', name: 'Jumbo Joker Pack', cost: 6, choices: 4, picks: 1, weight: 1 },
  { id: 'joker_mega', kind: 'joker', size: 'mega', name: 'Mega Joker Pack', cost: 8, choices: 4, picks: 2, weight: 0.25 },
  { id: 'sternbild_normal', kind: 'sternbild', size: 'normal', name: 'Sternbild Pack', cost: 4, choices: 3, picks: 1, weight: 4 },
  { id: 'sternbild_jumbo', kind: 'sternbild', size: 'jumbo', name: 'Jumbo Sternbild Pack', cost: 6, choices: 5, picks: 1, weight: 2 },
  { id: 'sternbild_mega', kind: 'sternbild', size: 'mega', name: 'Mega Sternbild Pack', cost: 8, choices: 5, picks: 2, weight: 0.5 },
  { id: 'elixier_normal', kind: 'elixier', size: 'normal', name: 'Elixier Pack', cost: 4, choices: 3, picks: 1, weight: 4 },
  { id: 'elixier_jumbo', kind: 'elixier', size: 'jumbo', name: 'Jumbo Elixier Pack', cost: 6, choices: 5, picks: 1, weight: 2 },
  { id: 'elixier_mega', kind: 'elixier', size: 'mega', name: 'Mega Elixier Pack', cost: 8, choices: 5, picks: 2, weight: 0.5 },
  { id: 'omen_normal', kind: 'omen', size: 'normal', name: 'Omen Pack', cost: 4, choices: 2, picks: 1, weight: 0.6 },
  { id: 'omen_jumbo', kind: 'omen', size: 'jumbo', name: 'Jumbo Omen Pack', cost: 6, choices: 4, picks: 1, weight: 0.3 },
  { id: 'omen_mega', kind: 'omen', size: 'mega', name: 'Mega Omen Pack', cost: 8, choices: 4, picks: 2, weight: 0.07 },
];

/** Im ersten Shop eines Runs ist dieses Pack garantiert (Briefing 6.1) */
export const FIRST_SHOP_PACK = 'joker_normal';

/** Karten in Karten Packs (Briefing 6.4, eigene Werte) */
export const PLAYING_CARD_ROLLS = {
  enhancementChance: 0.4,
  sealChance: 0.2,
  /** Edition Schwellen pro Wurf, von selten nach häufig */
  editions: [
    { id: 'prisma', chance: 0.012 },
    { id: 'aura', chance: 0.028 },
    { id: 'schimmer', chance: 0.04 },
  ],
};
