import type { Suit } from '../../core/types';

// Farbpaletten der Spielkarten (Pixel Art). Alle Farben als 0xRRGGBB.
// Zwei Varianten: "Standard" (gedämpfte, dunkle Töne) und "Hoher Kontrast" (kräftige Farben).

export type CardPaletteId = 'standard' | 'kontrast';

export interface SuitColors {
  /** Pips, Rang und Hauptton der Kleidung */
  main: number;
  dark: number;
  light: number;
  /** Heller Grundton hinter den Bildkarten */
  tint: number;
  /** Besatz (Gold oder Silber) */
  trim: number;
  trimLight: number;
  trimDark: number;
  /** Edelstein an Krone und Brust */
  gem: number;
  /** Haar und zweite Stofffarbe */
  hair: number;
  hairDark: number;
  /** Zweite Stofffarbe (Futter, Revers, Federn), setzt sich von der Kartenfarbe ab */
  sec: number;
  secLight: number;
  secDark: number;
}

export interface CardPalette {
  id: CardPaletteId;
  name: string;
  description: string;
  suits: Record<Suit, SuitColors>;
}

/** Farben, die in beiden Paletten gleich sind */
export const CARD_BASE = {
  /** Kontur um die ganze Karte */
  outline: 0x34304a,
  /** weißer Kartenrand und Grundfläche */
  face: 0xf8f5ee,
  /** Haut, Bart und Tinte der Bildkarten */
  skin: 0xf2c6a0,
  skinShade: 0xd08f70,
  white: 0xf4efe4,
  whiteShade: 0xb9b3c6,
  ink: 0x1c1730,
  mouth: 0xc4445a,
  steel: 0xaab6c8,
  steelDark: 0x5c6880,
  wood: 0x9a6234,
  woodDark: 0x5f3a20,
  glow: 0xffe27a,
  flame: 0xff8a2a,
  glass: 0xbfeaf2,
  leaf: 0x58b85c,
  leafDark: 0x2c7a44,
  /** Pip Farbe für Karten ohne Rang (Enhancement) */
  rankless: 0x6a5a9a,
};

export const CARD_PALETTES: Record<CardPaletteId, CardPalette> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Gedämpfte, dunkle Töne',
    suits: {
      S: { main: 0x2f3b66, dark: 0x1a2142, light: 0x6577ad, tint: 0xdde0ee, trim: 0xa9b8d8, trimLight: 0xe4ecfa, trimDark: 0x67779a, gem: 0x72e6f2, hair: 0x4b4f78, hairDark: 0x2a2d4e, sec: 0x7a4fc0, secLight: 0xa88af0, secDark: 0x4a2f86 },
      H: { main: 0xe0456f, dark: 0x9c2a52, light: 0xff8fae, tint: 0xfbe0e8, trim: 0xf0b840, trimLight: 0xffe28a, trimDark: 0xa8741c, gem: 0xfff0a0, hair: 0x8a3a3a, hairDark: 0x5a2024, sec: 0x3a52b0, secLight: 0x7088e8, secDark: 0x222f70 },
      C: { main: 0x1f5a4a, dark: 0x113a2f, light: 0x4fa584, tint: 0xd8ece2, trim: 0xe2c25c, trimLight: 0xfff0a8, trimDark: 0x9a7a2a, gem: 0xff7a5a, hair: 0x4a3a2a, hairDark: 0x2c2018, sec: 0xc85a2a, secLight: 0xf08a50, secDark: 0x7a3018 },
      D: { main: 0xee7a3e, dark: 0xb2491f, light: 0xffb878, tint: 0xfbe6d2, trim: 0xfff0c8, trimLight: 0xffffff, trimDark: 0xc08a58, gem: 0x72e6f2, hair: 0xc28a3a, hairDark: 0x7e5420, sec: 0x2f62b4, secLight: 0x6f9ee8, secDark: 0x1a3a7c },
    },
  },
  kontrast: {
    id: 'kontrast',
    name: 'Hoher Kontrast',
    description: 'Kräftige Farben, gut zu unterscheiden',
    suits: {
      S: { main: 0x2a2c3c, dark: 0x13141e, light: 0x5e6286, tint: 0xdcdde8, trim: 0xb5a0e8, trimLight: 0xe4daff, trimDark: 0x6c58a8, gem: 0xffd23f, hair: 0x4a3a78, hairDark: 0x2a2048, sec: 0xa070f0, secLight: 0xd0b0ff, secDark: 0x5c38b0 },
      H: { main: 0xe42424, dark: 0x8e1414, light: 0xff7a6a, tint: 0xfbdcd6, trim: 0xffc830, trimLight: 0xfff0a0, trimDark: 0xb07808, gem: 0xffffff, hair: 0x6a2a14, hairDark: 0x3e1608, sec: 0x2a44c8, secLight: 0x6a8cff, secDark: 0x182a80 },
      C: { main: 0x1e86e2, dark: 0x0e4a96, light: 0x72bdff, tint: 0xd8eafc, trim: 0xffd23f, trimLight: 0xfff4b0, trimDark: 0xb08410, gem: 0xff5a4a, hair: 0x2a3a5a, hairDark: 0x141e34, sec: 0xf08418, secLight: 0xffb860, secDark: 0xa04e08 },
      D: { main: 0xeaa012, dark: 0xa46606, light: 0xffd860, tint: 0xfdf0cc, trim: 0x7a4a26, trimLight: 0xb88454, trimDark: 0x4a2a10, gem: 0xe42424, hair: 0x5a3a1a, hairDark: 0x32200c, sec: 0x1a9a98, secLight: 0x60d8d0, secDark: 0x0c5e60 },
    },
  },
};

export const CARD_PALETTE_IDS: readonly CardPaletteId[] = ['standard', 'kontrast'];
export const DEFAULT_CARD_PALETTE: CardPaletteId = 'standard';
