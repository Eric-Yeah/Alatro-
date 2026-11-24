import type { Suit } from '../core/cards';
import type { Rarity } from '../core/jokers';
import type { ConsumableType } from '../data/consumables';
import { getLang } from '../i18n';

export const VIEW_W = 1440;
export const VIEW_H = 1000;
/** Wie weit Abdunklungen über das Spielfeld hinausreichen, damit bei anderem Seitenverhältnis (Fenster, iPad quer) keine harte Kante entsteht */
export const VIEW_BLEED = 4000;

export const C = {
  bg: 0x14275a,
  panel: 0x2e3f55,
  panelDark: 0x1d2a3a,
  /** dunkle Kontur um Panels, Knöpfe und Karten */
  panelLine: 0x0b1018,
  text: 0xffffff,
  textDim: 0x9fb4cc,
  chips: 0x0a8cff,
  mult: 0xff4c40,
  money: 0xf5b32b,
  accent: 0xff9a1f,
  green: 0x3fbf7f,
  /** Hologramm Farbe: Leuchtlinien in Panels */
  holo: 0x5fe3ff,
  /** Kartenfarben im alten Design */
  cardFace: 0xf6f0e1,
  cardEdge: 0x2b2540,
  cardBack: 0x5b3fa8,
};

/** Flacher Stil: harte Kanten, feste Konturen, versetzter voller Schatten, keine Verläufe. */
export const STYLE = {
  outline: 3,
  radius: 8,
  /** Versatz des harten Schattens nach unten */
  shadowY: 4,
  shadowColor: 0x070b11,
};

/** Dunkelt eine Farbe (0xRRGGBB) um den Faktor ab, 1 = unverändert. */
export function shade(hex: number, k: number): number {
  const r = Math.round(((hex >> 16) & 255) * k);
  const g = Math.round(((hex >> 8) & 255) * k);
  const b = Math.round((hex & 255) * k);
  return (r << 16) | (g << 8) | b;
}

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

/** Eigene Pixel Schrift, Systemschrift nur als Rückfall für Zeichen, die sie nicht kennt */
export const FONT_BODY = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
/** Titelschrift nur für die Buchstaben der Titelkarten, Rückfall auf die Pixel Schrift */
export const FONT_TITLE = '"Alatro Karte", "Alatro Pixel", system-ui, sans-serif';
export const FONT = '"Alatro Pixel", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Zahlen und Datumsformat der gewählten Sprache: Deutsch mit Tausenderpunkt und Dezimalkomma, Englisch umgekehrt */
export function numLocale(): string {
  return getLang() === 'en' ? 'en-US' : 'de-DE';
}

export function fmt(n: number): string {
  if (n >= 1e11) return n.toExponential(2).replace('+', '');
  return Math.floor(n).toLocaleString(numLocale());
}

export function fmtMult(n: number): string {
  if (Number.isInteger(n)) return fmt(n);
  if (n >= 1000) return fmt(n);
  return n.toLocaleString(numLocale(), { maximumFractionDigits: 1 });
}

/** Eigene Farben der Modifikatoren */
export const ENHANCEMENT_COLORS: Record<string, number> = {
  kupfer: 0xe9b48a,
  rubin: 0xf3b0b8,
  mondstein: 0xdde4f5,
  kristall: 0xd2f3f7,
  eisen: 0xbfc3cf,
  obsidian: 0x2e2838,
  quecksilber: 0xd5dde6,
  gold: 0xf4d978,
};

export const SEAL_COLORS: Record<string, number> = {
  echo: 0xe0475b,
  muenze: 0xf0b429,
  stern: 0x4f8fd9,
};

export const EDITION_COLORS: Record<string, number> = {
  schimmer: 0x9fd8ff,
  aura: 0xff7fd0,
  prisma: 0xffd23f,
  schatten: 0x1a1426,
};

/** Farben der Consumable Typen */
export const CONSUMABLE_COLORS: Record<ConsumableType, number> = {
  sternbild: 0x2a5fa8,
  elixier: 0x2f9f7a,
  omen: 0x7a2fa8,
};

/** Handy: kürzere Bildschirmseite (CSS Pixel) bis zu dieser Grenze zählt als Handy. */
export const PHONE_MAX_SHORT_SIDE = 600;
