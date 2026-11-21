import { HAND_DATA, HAND_ORDER, MIN_HAND_LEVEL, ROYAL_FLUSH_NAME } from '../data/hands';
import type { Card, HandType } from './types';

export type { HandType } from './types';
export { HAND_ORDER };
/** Kompatibilität mit älterem Code */
export const HAND_INFO = HAND_DATA;

export type HandLevels = Record<HandType, number>;

export function initialHandLevels(): HandLevels {
  return Object.fromEntries(HAND_ORDER.map((h) => [h, MIN_HAND_LEVEL])) as HandLevels;
}

/** chips(level) = base + (level - 1) * zuwachs (Briefing 2.1) */
export function handBase(type: HandType, level: number): { chips: number; mult: number } {
  const d = HAND_DATA[type];
  const l = Math.max(MIN_HAND_LEVEL, level);
  return { chips: d.chips + d.levelChips * (l - 1), mult: d.mult + d.levelMult * (l - 1) };
}

export function levelUp(levels: HandLevels, type: HandType, amount = 1): HandLevels {
  return { ...levels, [type]: Math.max(MIN_HAND_LEVEL, levels[type] + amount) };
}

/** Die am häufigsten gespielte Hand (bei Gleichstand die bessere), null wenn noch keine gespielt wurde */
export function mostPlayedHand(played: Partial<Record<HandType, number>>): HandType | null {
  let best: HandType | null = null;
  for (const h of HAND_ORDER) {
    const n = played[h] ?? 0;
    if (n > 0 && (best === null || n > (played[best] ?? 0))) best = h;
  }
  return best;
}

export function levelUpAll(levels: HandLevels, amount = 1): HandLevels {
  const out = { ...levels };
  for (const h of HAND_ORDER) out[h] = Math.max(MIN_HAND_LEVEL, out[h] + amount);
  return out;
}

/** Anzeigename. Ein Straight Flush 10 bis Ace heißt Royal Flush, teilt aber Werte und Level. */
export function handDisplayName(type: HandType, scoring: Card[]): string {
  if (type === 'straightFlush') {
    const ranks = new Set(scoring.map((c) => c.rank));
    if ([10, 11, 12, 13, 14].every((r) => ranks.has(r as Card['rank']))) return ROYAL_FLUSH_NAME;
  }
  return HAND_DATA[type].name;
}
