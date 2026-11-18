import { REROLL, SELL } from '../data/economy';
import { RARITY_WEIGHTS } from '../data/shop';
import type { RngStreams } from './rng';
import type { Rarity } from './types';

/** Verkaufspreis = abgerundet (Kaufpreis / 2), mindestens 1 (Briefing 1.4). */
export function sellValue(buyPrice: number): number {
  return Math.max(SELL.min, Math.floor(buyPrice / SELL.divisor));
}

/**
 * Kaufpreis (Briefing 6.5): (Basis + Edition Aufschlag + Inflation) mal Rabatt,
 * halbe Beträge abrunden, mindestens 1.
 */
export function buyPrice(o: { base: number; editionSurcharge?: number; inflation?: number; discount?: number }): number {
  const raw = (o.base + (o.editionSurcharge ?? 0) + (o.inflation ?? 0)) * (o.discount ?? 1);
  return Math.max(1, Math.floor(raw));
}

/** Kosten der nächsten count Rerolls ab einem Startpreis (Briefing 1.4). */
export function rerollCosts(start: number = REROLL.base, count = 1, step: number = REROLL.step): number[] {
  return Array.from({ length: count }, (_, i) => start + i * step);
}

/** Rarity Wurf nach den Gewichten aus data/shop.ts (Briefing 6.3). */
export function rollRarity(rng: RngStreams, key: string, weights: Record<Rarity, number> = RARITY_WEIGHTS): Rarity {
  return rng.weighted(key, weights);
}
