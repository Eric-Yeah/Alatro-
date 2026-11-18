import type { Rarity } from '../core/types';

/** Gewichte bei jeder Joker Generierung (Briefing 6.3). Legendary nie zufällig. */
export const RARITY_WEIGHTS: Record<Rarity, number> = { common: 70, uncommon: 25, rare: 5, legendary: 0 };

export const SHOP = {
  cardSlots: 2,
  packSlots: 2,
  voucherSlots: 1,
  /** Gratis Jokers aus Tags erscheinen zusätzlich zu den normalen Slots */
};

/** Kartentypen in den Karten Slots (Briefing 6.2): Joker, Consumables und Spielkarten */
export type ShopType = 'joker' | 'sternbild' | 'elixier' | 'karte' | 'omen';

/**
 * Start Gewichte der Kartentypen in den Karten Slots (Briefing 6.2). Spielkarten kommen erst
 * mit einem Voucher in den Shop, Omen nur aus Packs. Vouchers verändern die Gewichte pro Run.
 */
export const SHOP_TYPE_WEIGHTS: Record<ShopType, number> = {
  joker: 20,
  sternbild: 4,
  elixier: 4,
  karte: 0,
  omen: 0,
};

/**
 * Joker Editions beim Generieren (Briefing 6.4, Offener Punkt O13): ein Wurf, Schwellen
 * von oben nach unten. rate skaliert alle außer Schatten.
 */
export const JOKER_EDITION_ROLL = {
  schatten: 0.003,
  prisma: 0.006,
  aura: 0.02,
  schimmer: 0.04,
};

/** Basispreise ohne eigenen Katalogpreis (Briefing 6.5) */
export const BASE_PRICES = {
  playingCard: 1,
};
