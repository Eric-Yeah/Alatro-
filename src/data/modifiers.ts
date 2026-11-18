import type { Effect } from '../core/types';

/**
 * Eigene Karten Modifikatoren im Thema "Sternwarte der Alchemisten".
 * Enhancement: Material der Karte. Seal: Zeichen auf der Karte. Edition: Schimmer der Karte.
 */

export interface EnhancementDef {
  id: string;
  name: string;
  description: string;
  /** wirkt, wenn die Karte gewertet wird (nach den Rang Chips) */
  scored?: Effect;
  /** wirkt, solange die Karte beim Scoring in der Hand liegt */
  held?: Effect;
  /** kein Rang, keine Suit, scort immer, liefert keine Rang Chips */
  rankless?: boolean;
  /** zählt als jede Suit */
  anySuit?: boolean;
  /** nach dem Scoring: Chance num in den, zerstört zu werden */
  breakChance?: { num: number; den: number };
}

export interface SealDef {
  id: string;
  name: string;
  description: string;
  /** zusätzliche Auswertungen der Karte */
  retrigger?: number;
  scored?: Effect;
}

export interface EditionDef {
  id: string;
  name: string;
  description: string;
  /** additive Teile wirken bei Jokers vor dem Effekt, xMult danach */
  effect?: Effect;
  /** +Slots (nur Jokers und Consumables) */
  extraSlot?: number;
  /** Preisaufschlag im Shop */
  surcharge: number;
}

export const ENHANCEMENTS: Record<string, EnhancementDef> = {
  kupfer: { id: 'kupfer', name: 'Kupfer', description: '+25 Chips', scored: { chips: 25 } },
  rubin: { id: 'rubin', name: 'Rubin', description: '+5 Mult', scored: { mult: 5 } },
  mondstein: { id: 'mondstein', name: 'Mondstein', description: '+10 Chips und +2 Mult', scored: { chips: 10, mult: 2 } },
  kristall: {
    id: 'kristall', name: 'Kristall', description: 'X1.75 Mult, 1 in 5 Chance zu zerspringen',
    scored: { xMult: 1.75 }, breakChance: { num: 1, den: 5 },
  },
  eisen: { id: 'eisen', name: 'Eisen', description: 'X1.4 Mult, solange in der Hand', held: { xMult: 1.4 } },
  obsidian: { id: 'obsidian', name: 'Obsidian', description: '+40 Chips, kein Rang, keine Suit, scort immer', scored: { chips: 40 }, rankless: true },
  quecksilber: { id: 'quecksilber', name: 'Quecksilber', description: 'Zählt als jede Suit', anySuit: true },
  gold: { id: 'gold', name: 'Gold', description: '+$2, wenn gewertet', scored: { money: 2 } },
};

export const SEALS: Record<string, SealDef> = {
  echo: { id: 'echo', name: 'Echo Seal', description: 'Die Karte wird einmal zusätzlich ausgewertet', retrigger: 1 },
  muenze: { id: 'muenze', name: 'Münz Seal', description: '+$2, wenn gewertet', scored: { money: 2 } },
  stern: { id: 'stern', name: 'Stern Seal', description: 'Am Rundenende in der Hand: erzeugt das Sternbild der zuletzt gespielten Hand' },
};

export const EDITIONS: Record<string, EditionDef> = {
  schimmer: { id: 'schimmer', name: 'Schimmer', description: '+40 Chips', effect: { chips: 40 }, surcharge: 2 },
  aura: { id: 'aura', name: 'Aura', description: '+8 Mult', effect: { mult: 8 }, surcharge: 3 },
  prisma: { id: 'prisma', name: 'Prisma', description: 'X1.5 Mult', effect: { xMult: 1.5 }, surcharge: 5 },
  schatten: { id: 'schatten', name: 'Schatten', description: '+1 Slot', extraSlot: 1, surcharge: 5 },
};
