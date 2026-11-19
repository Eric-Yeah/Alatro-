import type { Rank, Suit } from '../../core/types';

// Pixel Raster der Karten: Maße, Index Schrift, Farbsymbole und Anordnung der Pips.
// Eine Karte ist 41 mal 57 Pixel groß und wird in der UI dreifach vergrößert (123 mal 171).

export const CARD_PX_W = 41;
export const CARD_PX_H = 57;
/** Vergrößerung der Karten Textur auf dem Bildschirm (ganzzahlig, damit die Pixel gleich groß bleiben) */
export const CARD_PX_SCALE = 3;

/** Index Schrift 3 mal 5. Die 1 der Zehn ist nur 2 Pixel breit, damit "10" in den Rand passt. */
export const INDEX_FONT: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '1t': ['.#', '##', '.#', '.#', '.#'],
  '2': ['###', '..#', '###', '#..', '###'],
  '3': ['###', '..#', '###', '..#', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '###', '..#', '###'],
  '6': ['###', '#..', '###', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  Q: ['###', '#.#', '#.#', '###', '..#'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
};

/** Farbsymbole für den Index (5 mal 5) */
export const SUIT_SMALL: Record<Suit, readonly string[]> = {
  S: ['..#..', '.###.', '#####', '#####', '..#..', '.###.'],
  H: ['.#.#.', '#####', '#####', '.###.', '..#..'],
  D: ['..#..', '.###.', '#####', '.###.', '..#..'],
  C: ['.###.', '.###.', '#####', '##.##', '..#..', '.###.'],
};

/** Farbsymbole für die Pips (9 mal 9) */
export const SUIT_PIP: Record<Suit, readonly string[]> = {
  S: ['....#....', '...###...', '..#####..', '.#######.', '#########', '#########', '.##.#.##.', '....#....', '...###...'],
  H: ['.##...##.', '#########', '#########', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'],
  D: ['....#....', '...###...', '..#####..', '.#######.', '#########', '.#######.', '..#####..', '...###...', '....#....'],
  C: ['...###...', '..#####..', '..#####..', '.#######.', '#########', '#########', '.##.#.##.', '....#....', '...###...'],
};

/** Spaltenmitten und Zeilenmitten der Pips (Pixel der Karte), Pips sind 9 mal 9 */
export const PIP_SIZE = 9;
export const PIP_COL = { L: 13, C: 20, R: 27 };
export const PIP_ROW = { top: 10, a: 16, b: 19, mid: 28, c: 21, d: 35, e: 37, f: 40, bottom: 46 };

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

/**
 * Große Farbsymbole für das Ass als halbe Zeilen (10 Zeichen, werden gespiegelt, 19 Pixel breit).
 * Nur die Form: Licht und Schatten, Glanz und Kontur kommen im Renderer dazu.
 */
export const ACE_SHAPES: Record<Suit, readonly string[]> = {
  S: [
    '.........#', '........##', '.......###', '......####', '.....#####', '....######', '...#######', '..########',
    '.#########', '.#########', '##########', '##########', '##########', '##########', '.#########', '..#####.##',
    '........##', '........##', '.......###', '......####', '.....#####',
  ],
  H: [
    '..#####...', '.#######..', '.#########', '##########', '##########', '##########', '##########', '.#########',
    '..########', '...#######', '....######', '.....#####', '......####', '.......###', '........##', '.........#',
  ],
  D: [
    '.........#', '........##', '.......###', '......####', '.....#####', '....######', '...#######', '..########',
    '.#########', '##########', '.#########', '..########', '...#######', '....######', '.....#####', '......####',
    '.......###', '........##', '.........#',
  ],
  C: [
    '.......###', '......####', '.....#####', '.....#####', '.....#####', '..########', '.#########', '##########',
    '##########', '##########', '##########', '.#########', '..###.####', '........##', '........##', '.......###',
    '......####', '.....#####',
  ],
};

/** Glanzpunkt im Ass (Spalte, Zeile in der Form) pro Farbe */
export const ACE_GLINT: Record<Suit, readonly [number, number]> = { S: [7, 6], H: [4, 3], D: [6, 5], C: [7, 3] };

/** Verzierung rund um das Ass: Radius des Punktrings und Abstand der vier Funken vom Mittelpunkt */
export const ACE_ORNAMENT = { ringRadius: 14, sparkleDist: 22 };

/** Layout der Bildkarten: Rahmen der Figuren in Kartenpixeln (Rand eingeschlossen) */
export const COURT_PANEL = { x: 9, y: 3, w: 23, h: 51 };
/** Größe einer Figurenhälfte mit Rand, die obere Hälfte liegt bei (10, 4) */
export const COURT_HALF = { x: 10, y: 4, w: 21, h: 24 };
