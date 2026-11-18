import type { Rarity } from '../core/types';

/** Gewichte bei jeder Joker Generierung (Briefing 6.3). Legendary nie zufällig. */
export const RARITY_WEIGHTS: Record<Rarity, number> = { common: 70, uncommon: 25, rare: 5, legendary: 0 };
