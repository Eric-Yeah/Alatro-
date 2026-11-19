// Werkzeuge für Zeichenraster (reine Funktionen, ohne DOM): Spiegeln, Verdoppeln mit Glättung, Verlaufsraster.

/** Halbe Zeilen (Spalte 0 bis zur Mitte, die Mitte zählt nicht doppelt) zu geraden, symmetrischen Zeilen. */
export function mirrorEven(half: readonly string[]): string[] {
  return half.map((r) => r + [...r].reverse().join(''));
}

/**
 * Verdoppelt ein Zeichenraster mit der Scale2x Regel: gerade Kanten bleiben, Treppen an Schrägen werden glatter.
 * Zwei Zeichen gelten nur bei Gleichheit als gleich, der Punkt ist das durchsichtige Zeichen.
 */
export function scale2x(grid: readonly string[]): string[] {
  const h = grid.length, w = Math.max(...grid.map((r) => r.length));
  const at = (x: number, y: number) => (y >= 0 && y < h && x >= 0 && x < grid[y].length ? grid[y][x] : '.');
  const out: string[][] = Array.from({ length: h * 2 }, () => Array(w * 2).fill('.'));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = at(x, y), a = at(x, y - 1), b = at(x + 1, y), c = at(x - 1, y), d = at(x, y + 1);
      let e0 = p, e1 = p, e2 = p, e3 = p;
      if (c === a && c !== d && a !== b) e0 = a;
      if (a === b && a !== c && b !== d) e1 = b;
      if (d === c && d !== b && c !== a) e2 = c;
      if (b === d && b !== a && d !== c) e3 = d;
      out[y * 2][x * 2] = e0;
      out[y * 2][x * 2 + 1] = e1;
      out[y * 2 + 1][x * 2] = e2;
      out[y * 2 + 1][x * 2 + 1] = e3;
    }
  }
  return out.map((r) => r.join(''));
}

/** 4 mal 4 Bayer Matrix (Werte 0 bis 15) für Verläufe mit Raster */
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const;
