// Zahlen für die Pixel Art der Consumables (Tarot artige Karten): Kachelmaße, Rahmen und Farben je Art.
// Die Kachel ist ein Hochformat Kartenbild in niedriger Auflösung und wird ohne Glättung vergrößert.
import type { ConsumableType } from './consumables';

/** Größe der ganzen Kachel in Bildpunkten, gleich groß wie die Joker Kachel */
export const CT_W = 52;
export const CT_H = 70;
/** Vergrößerung: 52 mal 70 wird zu 104 mal 140 */
export const CT_SCALE = 2;
/** Zeichenfläche des Motivs (quadratisch) im Fenster der Karte */
export const CART_X = 6;
export const CART_Y = 17;
export const CART_W = 40;
export const CART_H = 40;
/** Titelband oben: erste Zeile und Höhe, Fenster darunter */
export const CBAND_Y = 3;
export const CBAND_H = 11;
/** Fußleiste mit dem Zeichen der Art: erste Zeile und Höhe */
export const CFOOT_Y = 60;
export const CFOOT_H = 8;
/** Radius der abgerundeten Kachelecken */
export const CT_CORNER = 5;

export const CT_INK = 0x120c22;
export const CT_BAND_TEXT = 0xfff3d1;

/** Farbwelt je Art: Rahmen (Licht, Grundton, Schatten), Titelband, Zierleiste (Licht, Grundton, Schatten), Zeichen */
export interface ConsumableFrame {
  light: number;
  base: number;
  dark: number;
  band: number;
  trim: number;
  trimLight: number;
  trimDark: number;
  /** Farbe der Eckzeichen und des Zeichens in der Fußleiste */
  glyph: number;
}

export const CONSUMABLE_FRAMES: Record<ConsumableType, ConsumableFrame> = {
  // Mitternachtsblau mit Gold
  sternbild: { light: 0x5a78d8, base: 0x28387e, dark: 0x141e4c, band: 0x0b1030, trim: 0xf2b92c, trimLight: 0xffe27a, trimDark: 0xa8741c, glyph: 0xffe27a },
  // Smaragd mit Gold
  elixier: { light: 0x6fe0a8, base: 0x1f9468, dark: 0x0f5a40, band: 0x082a22, trim: 0xe6c24a, trimLight: 0xfff0a8, trimDark: 0x9a7a2a, glyph: 0xfff0a8 },
  // Violett mit Silber
  omen: { light: 0xc09aff, base: 0x6a2fa8, dark: 0x3a1a6a, band: 0x1c0d38, trim: 0xc8cce8, trimLight: 0xf4f6ff, trimDark: 0x7a80a8, glyph: 0xf4f6ff },
};

/** Seltene Consumables bekommen ein leichtes Funkeln und Glanzstreifen: alle Omen und einige besondere Karten. */
export const RARE_CONSUMABLE_IDS = new Set<string>([
  'sternbild_fiveKind', 'sternbild_flushHouse', 'sternbild_flushFive',
  'elixier_alchemistentisch', 'elixier_erntemond',
]);
export const RARE_CONSUMABLE_TYPES = new Set<ConsumableType>(['omen']);
