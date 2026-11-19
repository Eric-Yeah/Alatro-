// Zahlen für die Pixel Art der Joker (Kachelmaße, Rahmen, Farben je Seltenheit).
// Die Kachel ist ein Hochformat Kartenbild in niedriger Auflösung, es wird ohne Glättung vergrößert.

/** Größe der ganzen Kachel in Bildpunkten (Pixel Art Raster) */
export const TILE_W = 52;
export const TILE_H = 70;
/** Vergrößerung auf die Spielgröße: 52 mal 70 wird zu 104 mal 140 */
export const TILE_SCALE = 2;
/** Zeichenfläche des Motivs innerhalb der Kachel */
export const ART_X = 3;
export const ART_Y = 3;
export const ART_W = 46;
export const ART_H = 52;
/** Namensband unter dem Motiv: erste Zeile und Höhe */
export const BAND_Y = 55;
export const BAND_H = 12;
/** Radius der abgerundeten Kachelecken in Bildpunkten */
export const TILE_CORNER = 5;

/** Rahmenfarben je Seltenheit: Licht, Grundton, Schatten, Namensband */
export const RARITY_FRAME: Record<string, { light: number; base: number; dark: number; band: number }> = {
  common: { light: 0x9cc4f5, base: 0x4f8fd9, dark: 0x2c5ea6, band: 0x1a2748 },
  uncommon: { light: 0x8fe6b4, base: 0x3fbf7f, dark: 0x1f8a55, band: 0x12352e },
  rare: { light: 0xff9aa8, base: 0xe0475b, dark: 0x9c2a3d, band: 0x3a1324 },
  legendary: { light: 0xe3c4ff, base: 0xb26bff, dark: 0x6b36b8, band: 0x2a1650 },
};
export const FRAME_INK = 0x120c22;
export const BAND_TEXT = 0xfff3d1;
