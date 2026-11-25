import type { Suit } from '../../core/types';

// Farbpaletten der Spielkarten (Pixel Art). Alle Farben als 0xRRGGBB.
// Zwei Varianten gehören immer dazu: "Standard" (gedämpfte, dunkle Töne) und "Hoher Kontrast" (kräftige Farben).
// Vier weitere Farbwelten sind Kosmetik des Pokalpfads (Bernstein, Tintenmeer, Mondsilber, Glutkern) und werden
// über die Wunderkammer freigeschaltet. In ihnen sind Herz und Karo immer klar rot, Pik und Kreuz klar dunkel.

export type CardPaletteId = 'standard' | 'kontrast' | 'bernstein' | 'tintenmeer' | 'mondsilber' | 'glutkern';

/** Paletten, die immer zur Verfügung stehen (alle anderen müssen als Kosmetik besessen werden) */
export const FREE_CARD_PALETTES: readonly CardPaletteId[] = ['standard', 'kontrast'];

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

// ───────────────────────────────────────────── Ableitung der Kosmetik Paletten

const mix = (a: number, b: number, t: number): number => {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/** Anteile der Ableitung: wie stark Hauptfarbe und Besatz aufgehellt oder abgedunkelt werden */
const DERIVE = { dark: 0.42, light: 0.38, tint: 0.88, trimLight: 0.55, trimDark: 0.4, hairDark: 0.42, secLight: 0.38, secDark: 0.42 };

/** Hauptfarbe, Besatz (Metall), Edelstein, Haar und zweite Stofffarbe genügen, der Rest wird abgeleitet */
interface SuitSeed { main: number; trim: number; gem: number; hair: number; sec: number }

function suitFrom(s: SuitSeed): SuitColors {
  return {
    main: s.main, dark: mix(s.main, 0x000000, DERIVE.dark), light: mix(s.main, 0xffffff, DERIVE.light), tint: mix(s.main, 0xffffff, DERIVE.tint),
    trim: s.trim, trimLight: mix(s.trim, 0xffffff, DERIVE.trimLight), trimDark: mix(s.trim, 0x000000, DERIVE.trimDark), gem: s.gem,
    hair: s.hair, hairDark: mix(s.hair, 0x000000, DERIVE.hairDark),
    sec: s.sec, secLight: mix(s.sec, 0xffffff, DERIVE.secLight), secDark: mix(s.sec, 0x000000, DERIVE.secDark),
  };
}

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
  bernstein: {
    id: 'bernstein',
    name: 'Bernstein',
    description: 'Warmes Harz, Pergament und Honiggold',
    suits: {
      S: suitFrom({ main: 0x3b2a1a, trim: 0xe3a436, gem: 0xffd466, hair: 0x6a4a28, sec: 0xb8741e }),
      H: suitFrom({ main: 0xc8281c, trim: 0xe3a436, gem: 0xffe08a, hair: 0x7a3418, sec: 0x6a4a1e }),
      C: suitFrom({ main: 0x1c4026, trim: 0xe3a436, gem: 0xff9a4a, hair: 0x4a3a1c, sec: 0xa8641c }),
      D: suitFrom({ main: 0xe5482a, trim: 0xf2c868, gem: 0x6a3a14, hair: 0xa8641c, sec: 0x3b2a1a }),
    },
  },
  tintenmeer: {
    id: 'tintenmeer',
    name: 'Tintenmeer',
    description: 'Tiefes Blau, Meeresgrün und Korallenrot',
    suits: {
      S: suitFrom({ main: 0x16264a, trim: 0x8fd8e4, gem: 0x72f0e0, hair: 0x2a4a78, sec: 0x2a8a9a }),
      H: suitFrom({ main: 0xd0304a, trim: 0x8fd8e4, gem: 0xffffff, hair: 0x1e3a5a, sec: 0x2a6a8a }),
      C: suitFrom({ main: 0x0f4234, trim: 0x8fd8e4, gem: 0xff8a70, hair: 0x244a50, sec: 0x1e8a7a }),
      D: suitFrom({ main: 0xe85a44, trim: 0xbfeef2, gem: 0x1a4a6a, hair: 0x2a6a8a, sec: 0x16264a }),
    },
  },
  mondsilber: {
    id: 'mondsilber',
    name: 'Mondsilber',
    description: 'Kühles Silber, Dämmerblau und Rosenrot',
    suits: {
      S: suitFrom({ main: 0x2a2c48, trim: 0xd6deee, gem: 0xa8e8ff, hair: 0x4a4e78, sec: 0x7a82b8 }),
      H: suitFrom({ main: 0xd23a5a, trim: 0xe4eaf6, gem: 0xffffff, hair: 0x5a3a5a, sec: 0x6a76b0 }),
      C: suitFrom({ main: 0x173d36, trim: 0xd6deee, gem: 0xffb8c8, hair: 0x344e60, sec: 0x6a8cb0 }),
      D: suitFrom({ main: 0xe4505a, trim: 0xf6f8ff, gem: 0x2a2c48, hair: 0x8a8eb8, sec: 0x2a2c48 }),
    },
  },
  glutkern: {
    id: 'glutkern',
    name: 'Glutkern',
    description: 'Verkohltes Schwarz mit glühendem Rot',
    suits: {
      S: suitFrom({ main: 0x2a1a22, trim: 0xff9a22, gem: 0xffd85a, hair: 0x5a2a2a, sec: 0xc8501a }),
      H: suitFrom({ main: 0xe02a1a, trim: 0xffb030, gem: 0xfff0a0, hair: 0x5a1a14, sec: 0x3a2a30 }),
      C: suitFrom({ main: 0x123a26, trim: 0xff9a22, gem: 0xff5a2a, hair: 0x3a2a20, sec: 0xa83a1a }),
      D: suitFrom({ main: 0xf04422, trim: 0xffd060, gem: 0x3a1a14, hair: 0x7a2a14, sec: 0x2a1a22 }),
    },
  },
};

export const CARD_PALETTE_IDS: readonly CardPaletteId[] = ['standard', 'kontrast', 'bernstein', 'tintenmeer', 'mondsilber', 'glutkern'];
export const DEFAULT_CARD_PALETTE: CardPaletteId = 'standard';
