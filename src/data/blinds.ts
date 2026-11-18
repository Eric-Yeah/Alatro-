import type { BlindKind } from '../core/types';

/** Skalierung des Basiswerts je nach Stake (Briefing 5.1). */
export type Scaling = 1 | 2 | 3;

export const BASE_BY_SCALING: Record<Scaling, readonly number[]> = {
  1: [300, 800, 2000, 5000, 11000, 20000, 35000, 50000],
  2: [300, 900, 2600, 8000, 20000, 36000, 60000, 100000],
  3: [300, 1000, 3200, 9000, 25000, 60000, 110000, 200000],
};

/** Basiswert für Ante 0 oder kleiner */
export const ANTE_ZERO_BASE = 100;

/** Endless Formel (Briefing 5.2): A8 * (growth + (nScale * n) ^ (1 + expScale * n)) ^ n */
export const ENDLESS = {
  growth: 1.6,
  nScale: 0.75,
  expScale: 0.2,
  /** auf so viele signifikante Stellen abrunden */
  significantDigits: 2,
};

export const FINAL_ANTE = 8;
/** Showdown Boss alle ... Antes */
export const SHOWDOWN_EVERY = 8;

export const BLIND_FACTOR: Record<BlindKind, number> = { small: 1, big: 1.5, boss: 2 };

export const BLIND_REWARD: Record<BlindKind | 'showdown', number> = { small: 3, big: 4, boss: 5, showdown: 8 };

export const BLIND_NAMES: Record<BlindKind, string> = { small: 'Small Blind', big: 'Big Blind', boss: 'Boss Blind' };
