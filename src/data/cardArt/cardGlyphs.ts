import type { Rank, Suit } from '../../core/types';

// Pixel Raster der Karten: Maße, Index Schrift und Anordnung der Pips.
// Eine Karte ist 82 mal 114 Pixel groß und wird in der UI mit 1,5 vergrößert (123 mal 171 Punkte).
// Auf einem Retina Bildschirm (Faktor 2) sind das genau 3 Gerätepixel pro Kartenpixel.

export const CARD_PX_W = 82;
export const CARD_PX_H = 114;
/** Vergrößerung der Karten Textur auf dem Bildschirm (Karte bleibt 123 mal 171 Punkte groß) */
export const CARD_PX_SCALE = 1.5;

/** Rundung der Kartenecken und Breite des weißen Randes in Pixeln */
export const CARD_SHAPE = { radius: 6, border: 2 };

/** Index Schrift 7 mal 9 mit zwei Pixel dicken Strichen. Die 1 der Zehn ist nur 4 Pixel breit, damit "10" in den Rand passt. */
export const INDEX_FONT: Record<string, readonly string[]> = {
  '0': ['.#####.', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.'],
  '1': ['...##..', '..###..', '.####..', '...##..', '...##..', '...##..', '...##..', '...##..', '.######'],
  '1t': ['.##.', '###.', '.##.', '.##.', '.##.', '.##.', '.##.', '.##.', '####'],
  '2': ['.#####.', '##...##', '##...##', '.....##', '...###.', '..##...', '.##....', '##.....', '#######'],
  '3': ['.#####.', '##...##', '.....##', '..####.', '.....##', '.....##', '##...##', '##...##', '.#####.'],
  '4': ['....##.', '...###.', '..####.', '.##.##.', '##..##.', '#######', '....##.', '....##.', '....##.'],
  '5': ['#######', '##.....', '##.....', '######.', '.....##', '.....##', '.....##', '##...##', '.#####.'],
  '6': ['.#####.', '##...##', '##.....', '######.', '##...##', '##...##', '##...##', '##...##', '.#####.'],
  '7': ['#######', '.....##', '....##.', '....##.', '...##..', '...##..', '..##...', '..##...', '..##...'],
  '8': ['.#####.', '##...##', '##...##', '.#####.', '##...##', '##...##', '##...##', '##...##', '.#####.'],
  '9': ['.#####.', '##...##', '##...##', '##...##', '.######', '.....##', '.....##', '##...##', '.#####.'],
  A: ['..###..', '.#####.', '##...##', '##...##', '##...##', '#######', '##...##', '##...##', '##...##'],
  J: ['.######', '....##.', '....##.', '....##.', '....##.', '....##.', '##..##.', '##..##.', '.####..'],
  Q: ['.#####.', '##...##', '##...##', '##...##', '##...##', '##.#.##', '##.####', '.#####.', '....###'],
  K: ['##...##', '##..##.', '##.##..', '####...', '###....', '####...', '##.##..', '##..##.', '##...##'],
};

/** Farbsymbole für Index und Brustzeichen (9 mal 9), halbe Zeilen mit 5 Zeichen (Mitte rechts), werden ungerade gespiegelt */
export const SUIT_SMALL: Record<Suit, readonly string[]> = {
  S: ['....#', '...##', '..###', '.####', '#####', '#####', '.##.#', '....#', '...##'],
  H: ['.##..', '#####', '#####', '#####', '.####', '..###', '...##', '....#', '.....'],
  D: ['....#', '...##', '..###', '.####', '#####', '.####', '..###', '...##', '....#'],
  C: ['...##', '..###', '..###', '.####', '#####', '#####', '.##.#', '....#', '...##'],
};

/** Farbsymbole für die Pips (16 mal 16), halbe Zeilen mit 8 Zeichen, werden gerade gespiegelt */
export const SUIT_PIP: Record<Suit, readonly string[]> = {
  S: [
    '.......#', '......##', '.....###', '....####', '...#####', '..######', '.#######', '########',
    '########', '########', '########', '.#######', '..###.##', '......##', '.....###', '....####',
  ],
  H: [
    '........', '..#####.', '.######.', '########', '########', '########', '########', '.#######',
    '..######', '...#####', '....####', '.....###', '......##', '.......#', '........', '........',
  ],
  D: [
    '.......#', '......##', '.....###', '....####', '...#####', '..######', '.#######', '########',
    '########', '.#######', '..######', '...#####', '....####', '.....###', '......##', '.......#',
  ],
  C: [
    '.....###', '....####', '....####', '....####', '..######', '.#######', '########', '########',
    '########', '.#######', '..###.##', '......##', '......##', '.....###', '....####', '...#####',
  ],
};

/** Lage des Index oben links: Rang (mittig über dem Farbsymbol, Zehn linksbündig), Farbsymbol 9 mal 9 */
export const INDEX_POS = { rankX: 4, rankX10: 3, rankY: 4, suitX: 3, suitY: 14, suitSize: 9 };

/** Pips sind 16 mal 16 Pixel groß. Spalten und Zeilen sind linke und obere Kante in Kartenpixeln. */
export const PIP_SIZE = 16;
export const PIP_COL = { L: 15, C: 33, R: 51 };
export const PIP_ROW = { top: 12, a: 24, b: 30, mid: 49, c: 36, d: 62, e: 68, f: 74, bottom: 86 };

export type PipSpot = readonly [col: 'L' | 'C' | 'R', row: number];

const both = (row: number): PipSpot[] => [['L', row], ['R', row]];

/** Pip Anordnung pro Rang (2 bis 10), klassisch */
export const PIP_LAYOUT: Partial<Record<Rank, readonly PipSpot[]>> = {
  2: [['C', PIP_ROW.top], ['C', PIP_ROW.bottom]],
  3: [['C', PIP_ROW.top], ['C', PIP_ROW.mid], ['C', PIP_ROW.bottom]],
  4: [...both(PIP_ROW.top), ...both(PIP_ROW.bottom)],
  5: [...both(PIP_ROW.top), ['C', PIP_ROW.mid], ...both(PIP_ROW.bottom)],
  6: [...both(PIP_ROW.top), ...both(PIP_ROW.mid), ...both(PIP_ROW.bottom)],
  7: [...both(PIP_ROW.top), ['C', PIP_ROW.b], ...both(PIP_ROW.mid), ...both(PIP_ROW.bottom)],
  8: [...both(PIP_ROW.top), ['C', PIP_ROW.b], ...both(PIP_ROW.mid), ['C', PIP_ROW.e], ...both(PIP_ROW.bottom)],
  9: [...both(PIP_ROW.top), ...both(PIP_ROW.c), ['C', PIP_ROW.mid], ...both(PIP_ROW.d), ...both(PIP_ROW.bottom)],
  10: [...both(PIP_ROW.top), ['C', PIP_ROW.a], ...both(PIP_ROW.c), ...both(PIP_ROW.d), ['C', PIP_ROW.f], ...both(PIP_ROW.bottom)],
};

/** Ass: Größe des Symbols, Glanzpunkt (Bruchteil von Breite und Höhe) und Verzierung rund um das Symbol */
export const ACE = {
  w: 35,
  h: 37,
  glint: { S: [0.34, 0.3], H: [0.27, 0.22], D: [0.36, 0.3], C: [0.4, 0.2] } as Record<Suit, readonly [number, number]>,
  /** Radius der Scheibe, des Punktrings und Abstand der vier Funken vom Mittelpunkt */
  discRadius: 29,
  ringRadius: 33,
  sparkleDist: 47,
};

/** Layout der Bildkarten: Rahmen der Figuren in Kartenpixeln (Rand eingeschlossen) */
export const COURT_PANEL = { x: 18, y: 6, w: 46, h: 102 };
/** Obere Hälfte im Rahmen (ohne Rand), die untere ist ihre Drehung um 180 Grad und liegt bei y + h + 2 */
export const COURT_HALF = { x: 19, y: 7, w: 44, h: 49 };
/** Lage der Figur in der Hälfte (Figur 40 mal 47 mit Kontur) */
export const COURT_FIGURE_OFFSET = { x: 2, y: 2 };

/** Kartenrücken: Rand um das Muster, Abstand der Rauten des Gitters, Größe des Medaillons */
export const BACK = { inset: 7, lattice: 8, medallion: 20 };
