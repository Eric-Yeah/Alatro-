import {
  ANTE_ZERO_BASE, BASE_BY_SCALING, BLIND_FACTOR, BLIND_NAMES, BLIND_REWARD, ENDLESS, FINAL_ANTE, SHOWDOWN_EVERY,
  type Scaling,
} from '../data/blinds';
import type { BlindKind } from './types';

export type { BlindKind } from './types';
export type { Scaling } from '../data/blinds';
export { FINAL_ANTE, BLIND_NAMES };
export const BLIND_KINDS: readonly BlindKind[] = ['small', 'big', 'boss'];

/** Auf n signifikante Stellen abrunden (Briefing 5.2). */
export function floorSignificant(x: number, digits: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(x)) - (digits - 1));
  return Math.floor(x / mag + 1e-9) * mag;
}

/** Basiswert einer Ante (Briefing 5.1, 5.2). */
export function baseTarget(ante: number, scaling: Scaling = 1): number {
  if (ante <= 0) return ANTE_ZERO_BASE;
  const table = BASE_BY_SCALING[scaling];
  if (ante <= table.length) return table[ante - 1];
  const n = ante - table.length;
  const a8 = table[table.length - 1];
  const raw = a8 * Math.pow(ENDLESS.growth + Math.pow(ENDLESS.nScale * n, 1 + ENDLESS.expScale * n), n);
  return floorSignificant(raw, ENDLESS.significantDigits);
}

/** Kompatibilität */
export const anteBase = (ante: number) => baseTarget(ante);

export interface TargetOptions {
  scaling?: Scaling;
  /** eigener Faktor eines Bosses statt des Standard Boss Faktors */
  bossFactor?: number;
  /** Faktor des Decks auf alle Blinds */
  deckFactor?: number;
}

export function blindTarget(ante: number, kind: BlindKind, opts: TargetOptions = {}): number {
  const factor = kind === 'boss' && opts.bossFactor !== undefined ? opts.bossFactor : BLIND_FACTOR[kind];
  return Math.floor(baseTarget(ante, opts.scaling ?? 1) * factor * (opts.deckFactor ?? 1));
}

export function isShowdown(ante: number): boolean {
  return ante > 0 && ante % SHOWDOWN_EVERY === 0;
}

/** Belohnung eines Blinds (Briefing 5.3). smallOverride: Stake Regel für den Small Blind. */
export function blindReward(ante: number, kind: BlindKind, smallOverride: number | null = null): number {
  if (kind === 'small' && smallOverride !== null) return smallOverride;
  if (kind === 'boss' && isShowdown(ante)) return BLIND_REWARD.showdown;
  return BLIND_REWARD[kind];
}

/** Kompatibilität für die UI */
export const BLIND_INFO: Record<BlindKind, { name: string; reward: number }> = {
  small: { get name() { return BLIND_NAMES.small; }, reward: BLIND_REWARD.small },
  big: { get name() { return BLIND_NAMES.big; }, reward: BLIND_REWARD.big },
  boss: { get name() { return BLIND_NAMES.boss; }, reward: BLIND_REWARD.boss },
};

export { FINAL_ANTE as LAST_ANTE };
