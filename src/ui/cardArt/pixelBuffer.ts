// Kleiner Pixel Puffer ohne DOM: RGBA Bytes, nur volle oder keine Deckkraft (harte Pixelkanten).
// Läuft deshalb auch in Tests. Die Umwandlung in eine Pixi Textur steht in cardTextures.ts.

export type Grid = readonly string[];
/** Zuordnung Zeichen im Raster zu Farbe 0xRRGGBB. Punkt und Leerzeichen sind durchsichtig. */
export type ColorMap = Readonly<Record<string, number>>;

export class PixelBuffer {
  readonly data: Uint8Array;

  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint8Array(w * h * 4);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x: number, y: number, color: number) {
    if (!this.inside(x, y)) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = (color >> 16) & 255;
    this.data[i + 1] = (color >> 8) & 255;
    this.data[i + 2] = color & 255;
    this.data[i + 3] = 255;
  }

  clear(x: number, y: number) {
    if (!this.inside(x, y)) return;
    this.data.fill(0, (y * this.w + x) * 4, (y * this.w + x) * 4 + 4);
  }

  solid(x: number, y: number): boolean {
    return this.inside(x, y) && this.data[(y * this.w + x) * 4 + 3] !== 0;
  }

  get(x: number, y: number): number | null {
    if (!this.solid(x, y)) return null;
    const i = (y * this.w + x) * 4;
    return (this.data[i] << 16) | (this.data[i + 1] << 8) | this.data[i + 2];
  }

  fillRect(x: number, y: number, w: number, h: number, color: number) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, color);
  }

  strokeRect(x: number, y: number, w: number, h: number, color: number) {
    for (let xx = x; xx < x + w; xx++) { this.set(xx, y, color); this.set(xx, y + h - 1, color); }
    for (let yy = y; yy < y + h; yy++) { this.set(x, yy, color); this.set(x + w - 1, yy, color); }
  }

  /** Zeichnet ein Zeichenraster. Durchsichtige Zeichen lassen den Untergrund stehen. */
  blit(grid: Grid, x: number, y: number, map: ColorMap) {
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      for (let c = 0; c < row.length; c++) {
        const col = map[row[c]];
        if (col !== undefined) this.set(x + c, y + r, col);
      }
    }
  }

  /** Legt einen anderen Puffer darüber (nur feste Pixel). */
  blitBuffer(src: PixelBuffer, x: number, y: number) {
    for (let yy = 0; yy < src.h; yy++) {
      for (let xx = 0; xx < src.w; xx++) {
        const c = src.get(xx, yy);
        if (c !== null) this.set(x + xx, y + yy, c);
      }
    }
  }

  /** Um 180 Grad gedrehte Kopie (so liegt die untere Hälfte der Bildkarten und der Index unten rechts). */
  rotated180(): PixelBuffer {
    const out = new PixelBuffer(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = this.get(x, y);
        if (c !== null) out.set(this.w - 1 - x, this.h - 1 - y, c);
      }
    }
    return out;
  }

  /** Alle Pixel einer Farbe ersetzen. */
  replace(from: number, to: number) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.get(x, y) === from) this.set(x, y, to);
  }
}

/** Spiegelt halbe Zeilen (Spalte 0 bis zur Mitte) zu vollen, symmetrischen Zeilen. */
export function mirrorRows(half: Grid): string[] {
  return half.map((r) => r + [...r.slice(0, -1)].reverse().join(''));
}

/** Raster in einen Puffer zeichnen. outline: Farbe für einen 1 Pixel Rand (4er Nachbarschaft), der Puffer wächst dann um 2. */
export function gridBuffer(grid: Grid, map: ColorMap, outline?: number, skipBottomOutline = false): PixelBuffer {
  const pad = outline !== undefined ? 1 : 0;
  const w = Math.max(...grid.map((r) => r.length));
  const buf = new PixelBuffer(w + pad * 2, grid.length + pad * 2);
  buf.blit(grid, pad, pad, map);
  if (outline !== undefined) {
    const base = new PixelBuffer(buf.w, buf.h);
    base.blitBuffer(buf, 0, 0);
    for (let y = 0; y < buf.h; y++) {
      for (let x = 0; x < buf.w; x++) {
        if (base.solid(x, y)) continue;
        if (skipBottomOutline && y >= buf.h - 1) continue;
        if (base.solid(x - 1, y) || base.solid(x + 1, y) || base.solid(x, y - 1) || base.solid(x, y + 1)) buf.set(x, y, outline);
      }
    }
  }
  return buf;
}

export function mixColor(a: number, b: number, t: number): number {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
