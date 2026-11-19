// Zahlen für die Pixel Art der Booster Packs: Maße je Größe, Farbwelt je Art.
// Ein Pack ist eine Siegelhülle (Beutel mit gezackten Quetschkanten, Fenster mit Motiv, Wachssiegel, Namensband).
// Die Größen Normal, Jumbo und Mega unterscheiden sich in Maßen, Zierrat und Siegel deutlich.
import type { PackKind, PackSize } from './packs';

/** Vergrößerung auf die Spielgröße: ein Bildpunkt sind 3 logische Punkte (44 mal 60 wird 132 mal 180) */
export const PACK_SCALE = 3;

export interface PackDims {
  /** Maße des Beutels in Bildpunkten */
  w: number;
  h: number;
  /** Innenfläche des Fensters (das Motiv), das Fenster mit Rand ist je 4 größer */
  iw: number;
  ih: number;
  /** Oberkante des Fensters und Mitte des Wachssiegels (sitzt auf der Unterkante des Fensters) */
  winY: number;
  sealY: number;
  sealR: number;
  /** Namensband: erste Zeile und Höhe */
  bandY: number;
  bandH: number;
  /** Höhe der Quetschkanten oben und unten, Zacken: Periode und Tiefe */
  crimpTop: number;
  crimpBot: number;
  toothPeriod: number;
  toothDepth: number;
}

export const PACK_DIMS: Record<PackSize, PackDims> = {
  normal: { w: 44, h: 60, iw: 28, ih: 24, winY: 8, sealY: 36, sealR: 5, bandY: 43, bandH: 10, crimpTop: 7, crimpBot: 6, toothPeriod: 6, toothDepth: 2 },
  jumbo: { w: 50, h: 68, iw: 34, ih: 28, winY: 8, sealY: 40, sealR: 6, bandY: 48, bandH: 12, crimpTop: 7, crimpBot: 6, toothPeriod: 8, toothDepth: 3 },
  mega: { w: 56, h: 76, iw: 40, ih: 32, winY: 9, sealY: 45, sealR: 7, bandY: 55, bandH: 13, crimpTop: 8, crimpBot: 7, toothPeriod: 8, toothDepth: 3 },
};

export interface PackPalette {
  /** Hüllenfarben: Licht, Grundton, Schatten, tiefster Ton */
  light: number;
  base: number;
  dark: number;
  deep: number;
  /** Zierleisten (Gold oder Silber): Licht, Grundton, Schatten */
  trimLight: number;
  trim: number;
  trimDark: number;
  /** Wachssiegel Grundfarbe */
  seal: number;
  /** Fensterhintergrund (oben, Mitte, unten) */
  sky: [number, number, number];
}

export const PACK_PALETTES: Record<PackKind, PackPalette> = {
  // Joker: Karminrot mit Gold, violettes Siegel
  joker: { light: 0xff8272, base: 0xd8382f, dark: 0x8a1a2a, deep: 0x4a0e1c, trimLight: 0xffe27a, trim: 0xf2b92c, trimDark: 0xa8741c, seal: 0x8a52d0, sky: [0x3a0a24, 0x7a1a3a, 0xb8402e] },
  // Karten: Königsblau mit Creme, rotes Siegel
  karten: { light: 0x8ab8ff, base: 0x2f6fd8, dark: 0x1a3e8a, deep: 0x0c1e4a, trimLight: 0xfff3d1, trim: 0xe8d8a8, trimDark: 0x9a8a5a, seal: 0xd8382f, sky: [0x0c2a6a, 0x1a4aa8, 0x3a78d8] },
  // Sternbild: Mitternachtsblau mit Gold, goldenes Siegel
  sternbild: { light: 0x6a88e0, base: 0x28387e, dark: 0x141e4c, deep: 0x080c2a, trimLight: 0xffe27a, trim: 0xf2b92c, trimDark: 0xa8741c, seal: 0xf2b92c, sky: [0x060a28, 0x14246a, 0x2c44a0] },
  // Elixier: Smaragd mit Gold, rotes Siegel
  elixier: { light: 0x7aeab0, base: 0x1f9468, dark: 0x0f5a40, deep: 0x062a20, trimLight: 0xfff0a8, trim: 0xe6c24a, trimDark: 0x9a7a2a, seal: 0xd8382f, sky: [0x062a22, 0x0e5a44, 0x1a8a62] },
  // Omen: Violett mit Silber, silbernes Siegel
  omen: { light: 0xc8a0ff, base: 0x6a2fa8, dark: 0x3a1a6a, deep: 0x1a0c34, trimLight: 0xf4f6ff, trim: 0xc8cce8, trimDark: 0x7a80a8, seal: 0xc8cce8, sky: [0x14082a, 0x2a1050, 0x4a2084] },
};

/** Seltene Packs (Mega, Omen) funkeln stärker */
export const PACK_SPARK_BONUS: Record<PackSize, number> = { normal: 0, jumbo: 1, mega: 3 };
