import type { Suit } from '../core/cards';
import type { Rarity } from '../core/jokers';

export const VIEW_W = 1440;
export const VIEW_H = 1000;

export const C = {
  bg: 0x1b1530,
  panel: 0x2a2342,
  panelDark: 0x1f1a33,
  panelLine: 0x4a3f6b,
  text: 0xf4efe6,
  textDim: 0xa99fc4,
  chips: 0x2f8fff,
  mult: 0xff4d5e,
  money: 0xffc94d,
  accent: 0x9b6bff,
  green: 0x3fbf7f,
  cardFace: 0xf6f0e1,
  cardEdge: 0x2b2540,
  cardBack: 0x5b3fa8,
};

export const SUIT_COLORS: Record<Suit, number> = {
  S: 0x2b2f6b,
  H: 0xd93a4a,
  D: 0xe8892b,
  C: 0x2e8a57,
};

export const RARITY_COLORS: Record<Rarity, number> = {
  common: 0x4f8fd9,
  uncommon: 0x3fbf7f,
  rare: 0xe0475b,
  legendary: 0xb26bff,
};

export const RARITY_NAMES: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export function fmt(n: number): string {
  if (n >= 1e11) return n.toExponential(2).replace('+', '');
  return Math.floor(n).toLocaleString('de-DE');
}

export function fmtMult(n: number): string {
  if (Number.isInteger(n)) return fmt(n);
  if (n >= 1000) return fmt(n);
  return n.toLocaleString('de-DE', { maximumFractionDigits: 1 });
}
