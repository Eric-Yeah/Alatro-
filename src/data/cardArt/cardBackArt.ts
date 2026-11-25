// Zahlen der Kartenrücken Muster (Kosmetik). Die Muster entstehen in `src/ui/cardArt/cardBackArt.ts` aus Code.
// Alle Maße in Kartenpixeln des Rückenfelds (68 mal 100 innerhalb des Rands), Mittelpunkt (34, 50).

/** Festes Saatkorn je Muster: gleiche Karte bei jedem Start, kein freier Zufall */
export const BACK_SEEDS = {
  sternenstaub: 0x5a17, kupferraute: 0x71c3, mondphasen: 0x3d29, retorte: 0x2b8f, astrolabium: 0x6e41,
  tierkreis: 0x4c07, nebelwirbel: 0x19ab, goldadern: 0x7e5d, sonnenfinsternis: 0x2f63, kometenbahn: 0x48d1, wappen: 0x6a09,
} as const;

export const BACK_ART = {
  /** Sternenstaub: Zellgröße der verstreuten Sterne, Anteil großer Sterne und heller Punkte */
  stars: { cell: 9, big: 0.13, bright: 0.5, gold: 0.2, dust: 0.1 },
  /** Kupferraute: Abstand der Rauten (Pixel) */
  lattice: 17,
  /** Mondphasen: Spalten, Zeilen, Mondradius */
  moons: { xs: [10, 26, 42, 58], ys: [10, 30, 50, 70, 90], radius: 6, phases: 8 },
  /** Retorte: Kolbenradius, Mittelpunkt des Bauchs, Halsbreite, Flüssigkeitsstand, Blasen im Hintergrund */
  flask: { cx: 34, cy: 66, r: 17, neckHalf: 4, neckTop: 28, liquidY: 62, bubbles: 14 },
  /** Astrolabium: Ringradien und Zeigerwinkel (Grad) */
  astro: { cy: 50, rings: [31, 23, 15] as readonly number[], tickEvery: 6, longEvery: 30, hands: [-50, 130] as readonly number[] },
  /** Tierkreis: Außen und Innenradius des Rings, Radius der Zeichen, Anzahl der Zeichen */
  zodiac: { outer: 31, inner: 20, glyphR: 26.5, signs: 12, starLong: 15, starShort: 10 },
  /** Nebelwirbel: Zahl der Arme und Windungen */
  nebula: { arms: 3, turns: 22, radius: 48, stars: 26 },
  /** Goldadern: Zahl der Hauptadern, Länge, Gabelwahrscheinlichkeit */
  veins: { main: 6, length: 48, fork: 0.06, depth: 3, wobble: 0.2 },
  /** Sonnenfinsternis: Radius der Scheibe und Reichweite der Korona */
  eclipse: { disc: 13, reach: 15, stars: 18 },
  /** Kometen: Kopf (x, y), Länge, Breite des Schweifs. Zweite Hälfte wird um 180 Grad gedreht. */
  comets: [
    { x: 56, y: 14, len: 58, w: 5 },
    { x: 46, y: 40, len: 30, w: 3 },
  ],
  /** Wappen: Medaillonradius und Mittelpunkt des Motivs */
  seal: { radius: 27, motif: 20, beads: 24 },
} as const;
