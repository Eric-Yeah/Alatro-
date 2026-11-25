// Zahlen für den Tiefen Look der Kacheln (Jokers, Consumables, Packs, Vouchers), des Shops und der Ansichten
// (Run Info, Deck, Atlas). Farben als 0xRRGGBB, Strecken in Spielfeld Einheiten (1440 mal 1000), Alpha 0 bis 1.
import type { Rarity } from '../core/jokers';
import type { PackSize } from './packs';

/** Weiche Scharfe farbige Randlinie hinter einer Kachel (Seltenheit): Farbe, Unschärfe, Deckkraft, wie weit sie über die Kachel hinausragt */
export interface GlowSpec {
  color: number;
  blur: number;
  alpha: number;
  grow: number;
}

export const TILE_DEPTH = {
  /** Körper: Kopie der Kachel, dunkel getönt, um dy nach unten versetzt (zeigt die Dicke, folgt der Form der Pixel Art) */
  bodyDy: 5,
  /** Abtönung des Körpers: Faktor auf die Farben der Kachel (je dunkler, desto tiefer wirkt der Unterrand) */
  bodyTint: 0x4a4a5c,
  /** Glanz (Comic): kleiner Lichtstreifen oben links, Höhe und Deckkraft */
  glossH: 4,
  glossAlpha: 0.4,
  /** Hover: so weit hebt sich eine Kachel im Fach (Schatten wächst, 0 bis 1) und Dauer in ms */
  hoverLift: 0.55,
  liftMs: 130,
  dropMs: 240,
  /** Schlanker Schatten für Raster mit vielen Kacheln (Deck, Atlas) */
  gridShadow: { blur: 3, dy: 4, dx: 1, alpha: 0.5 },
};

/** Leuchtkante je Seltenheit: Common ohne, Uncommon ganz leise, Rare und Legendary deutlich */
export const RARITY_GLOW: Record<Rarity, GlowSpec | null> = {
  common: null,
  uncommon: { color: 0x3fbf7f, blur: 3, alpha: 0.45, grow: 2 },
  rare: { color: 0xff5a70, blur: 3, alpha: 0.95, grow: 3 },
  legendary: { color: 0xd9a8ff, blur: 4, alpha: 1, grow: 5 },
};

/** Zusätzlicher Glanz bei Legendary (Faktor auf die Stärke des Glanzes) */
export const RARITY_GLOSS: Record<Rarity, number> = { common: 1, uncommon: 1, rare: 1.1, legendary: 1.35 };

/** Leuchtkante der Packs je Größe (Farbe kommt aus der Palette des Packs): Normal ohne */
export const PACK_GLOW: Record<PackSize, Omit<GlowSpec, 'color'> | null> = {
  normal: null,
  jumbo: { blur: 3, alpha: 0.6, grow: 2 },
  mega: { blur: 4, alpha: 0.95, grow: 4 },
};

/** Leuchtkante der seltenen Consumables (Farbe aus dem Rahmen der Art) und des Vouchers */
export const CONSUMABLE_GLOW = { blur: 3, alpha: 0.9, grow: 3 };
export const VOUCHER_GLOW: GlowSpec = { color: 0xf2b92c, blur: 3, alpha: 0.85, grow: 3 };

/** Schatten der Kacheln: Pack und Voucher haben gezackte oder gekerbte Ränder, der Schatten schrumpft darum etwas (Einheiten je Seite) */
export const SHADOW_INSET = { joker: 0, consumable: 0, voucher: 1, pack: 6 };

/** Shop: Regalboden, Plaketten, Detail Karte */
export const SHOP_DEPTH = {
  /** Fach (vertieft): Grundfarbe und Konturfarbe */
  shelf: 0x26354c,
  shelfLine: 0x0b1018,
  radius: 14,
  /** Regalboden unten im Fach: Höhe, Farben der Fläche (oben, unten) und der Vorderkante */
  floorH: 40,
  floorTop: 0x364a68,
  floorBottom: 0x253650,
  floorLip: 0x546c92,
  floorLipH: 5,
  /** leerer Platz (Mulde) */
  hollow: 0x1a2535,
  hollowAlpha: 0.75,
  /** Preisplakette: Höhe, Grundfarbe, Rand je nach Kaufbarkeit, Textfarbe wenn zu teuer */
  tagH: 32,
  tagColor: 0x222c3e,
  tagLineOn: 0xf5b32b,
  tagLineOff: 0x3b5068,
  tagTextOff: 0x8a7f99,
  /** weicher Schatten unter der Plakette */
  tagShadow: { blur: 3, dy: 4, dx: 0, alpha: 0.55 },
  /** Boden des unteren Fachs (Voucher und Packs) ist höher, die Beschriftung "Booster Packs" liegt darauf */
  floorHLow: 75,
  /** Detail Karte: Plattenfarbe (warmes Pergament), Kontrast der Fläche, Radius */
  calloutColor: 0xf3ecd8,
  calloutContrast: 0.4,
  calloutRadius: 14,
  /** Rahmenfarbe des Shops */
  frame: 0xc8412f,
};

/** Leuchtschild (Seitenleiste): Maße, Farben, Glühbirnen */
export const SIGN_DEPTH = {
  w: 330,
  h: 160,
  bulbStep: 22,
  blinkMs: 520,
  frameColor: 0x8f2a28,
  displayColor: 0x1b2330,
  /** Glühbirne: Radius, an (Mitte, Rand, Kontur), aus (Mitte, Rand, Kontur), Halo */
  bulbR: 5,
  on: { core: 0xfffbe8, edge: 0xffc85a, line: 0xd9902a },
  off: { core: 0x8a3a35, edge: 0x5a1a18, line: 0x3a0e0c },
  haloR: 8,
  haloAlpha: 0.25,
};

/** Listenzeilen (Run Info, Atlas): Innenschatten oben und Lippe, kleiner als bei großen Feldern */
export const ROW_DEPTH = {
  shadowH: 4,
  shadowAlpha: 0.38,
  lipAlpha: 0.1,
  /** Reiter Rinne hinter den Reitern: Rand rundum */
  troughPad: 6,
  troughColor: 0x1a2536,
};
