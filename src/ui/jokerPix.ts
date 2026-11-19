// Kleine Pixel Zeichenbibliothek für die Joker Grafiken. Rein, ohne DOM, damit sie getestet
// und von einem Werkzeug (tools/jokersheet.ts) für Vorschaubilder genutzt werden kann.
// Eine Fläche ist ein Raster aus 0xRRGGBB Werten, Transparenz ist -1. Es gibt keine Halbtransparenz,
// alle Kanten sind hart. Abstufungen entstehen über Farbleitern (ramp) und geordnetes Dithering.

export type Color = number;
export const NONE = -1;

/** Farbleiter von dunkel (0) bis hell (4), Schatten kühler, Licht wärmer, wie im Pixel Art üblich. */
export type Ramp = [Color, Color, Color, Color, Color];

function rgb2hsl(c: Color): [number, number, number] {
  const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s, l];
}

function hsl2rgb(h: number, s: number, l: number): Color {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const f = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
  }
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}

function hueToward(h: number, target: number, k: number): number {
  let d = ((target - h + 540) % 360) - 180;
  return h + d * k;
}

/** Leiter aus einer Grundfarbe: fünf Töne, Schatten Richtung Violett, Licht Richtung Gelb. */
export function ramp(base: Color): Ramp {
  const [h, s, l] = rgb2hsl(base);
  const mk = (dl: number, hueK: number, target: number, ds: number) =>
    hsl2rgb(hueToward(h, target, hueK), s + ds, l + dl);
  return [
    mk(-0.30, 0.22, 265, 0.04),
    mk(-0.15, 0.12, 265, 0.02),
    base,
    mk(0.13, 0.12, 55, 0.0),
    mk(0.27, 0.22, 55, -0.06),
  ];
}

export const INK: Color = 0x17102a;

/** Bayer Matrix 4x4 für geordnetes Dithering (Werte 0..1). */
const BAYER = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
].map((v) => (v + 0.5) / 16);
export const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];

/** Kleiner deterministischer Zufall (mulberry32) aus einer Zahl. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Winzige 3x5 Ziffern und Zeichen für Aufschriften (Münze, Würfel, Karte).
const GLYPHS: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  $: ['011', '110', '111', '011', '110'],
  '%': ['101', '001', '010', '100', '101'],
  x: ['000', '101', '010', '101', '000'],
  '+': ['000', '010', '111', '010', '000'],
  '!': ['010', '010', '010', '000', '010'],
  '?': ['111', '001', '011', '000', '010'],
  z: ['111', '001', '010', '100', '111'],
};

export class Pix {
  readonly data: Int32Array;

  constructor(public readonly w: number, public readonly h: number) {
    this.data = new Int32Array(w * h).fill(NONE);
  }

  inb(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x: number, y: number): Color { return this.inb(x, y) ? this.data[y * this.w + x] : NONE; }
  set(x: number, y: number, c: Color) {
    x = Math.round(x); y = Math.round(y);
    if (c !== NONE && this.inb(x, y)) this.data[y * this.w + x] = c;
  }
  /** nur auf leere Pixel setzen */
  under(x: number, y: number, c: Color) {
    if (this.inb(x, y) && this.data[y * this.w + x] === NONE) this.data[y * this.w + x] = c;
  }

  fill(c: Color) { this.data.fill(c); return this; }
  clear() { this.data.fill(NONE); return this; }

  rect(x: number, y: number, w: number, h: number, c: Color) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }
  /** Rahmen eines Rechtecks */
  frame(x: number, y: number, w: number, h: number, c: Color) {
    this.rect(x, y, w, 1, c).rect(x, y + h - 1, w, 1, c).rect(x, y, 1, h, c).rect(x + w - 1, y, 1, h, c);
    return this;
  }
  /** Rechteck mit abgeschnittenen Ecken */
  rrect(x: number, y: number, w: number, h: number, c: Color, r = 1) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const cx = Math.min(i, w - 1 - i), cy = Math.min(j, h - 1 - j);
        if (cx + cy < r) continue;
        this.set(x + i, y + j, c);
      }
    }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Color, th = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (th <= 1) this.set(x0, y0, c);
      else this.rect(x0 - Math.floor((th - 1) / 2), y0 - Math.floor((th - 1) / 2), th, th, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }

  /** Streckenzug durch Punkte (x, y, x, y, ...) */
  path(pts: number[], c: Color, th = 1) {
    for (let i = 0; i + 3 < pts.length; i += 2) this.line(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], c, th);
    return this;
  }

  disc(cx: number, cy: number, r: number, c: Color) {
    for (let y = Math.floor(cy - r) - 1; y <= Math.ceil(cy + r) + 1; y++)
      for (let x = Math.floor(cx - r) - 1; x <= Math.ceil(cx + r) + 1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= r * r + 0.5 * r) this.set(x, y, c);
      }
    return this;
  }

  ring(cx: number, cy: number, r: number, c: Color, th = 1) {
    const ri = r - th;
    for (let y = Math.floor(cy - r) - 1; y <= Math.ceil(cy + r) + 1; y++)
      for (let x = Math.floor(cx - r) - 1; x <= Math.ceil(cx + r) + 1; x++) {
        const dx = x - cx, dy = y - cy, d = dx * dx + dy * dy;
        if (d <= r * r + 0.5 * r && d > ri * ri + 0.5 * ri) this.set(x, y, c);
      }
    return this;
  }

  ell(cx: number, cy: number, rx: number, ry: number, c: Color) {
    const e = 0.45 / Math.min(rx, ry);
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++)
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1 + e) this.set(x, y, c);
      }
    return this;
  }

  ellRing(cx: number, cy: number, rx: number, ry: number, c: Color, th = 1) {
    const e = 0.45 / Math.min(rx, ry);
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++)
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        const dxi = (x - cx) / Math.max(0.5, rx - th), dyi = (y - cy) / Math.max(0.5, ry - th);
        if (dx * dx + dy * dy <= 1 + e && dxi * dxi + dyi * dyi > 1) this.set(x, y, c);
      }
    return this;
  }

  /** Gefülltes Vieleck, Punkte als x, y, x, y ... (gerade ungerade Regel, Pixelmitte). */
  poly(pts: number[], c: Color | ((x: number, y: number) => Color)) {
    const n = pts.length / 2;
    let miny = Infinity, maxy = -Infinity;
    for (let i = 0; i < n; i++) { miny = Math.min(miny, pts[i * 2 + 1]); maxy = Math.max(maxy, pts[i * 2 + 1]); }
    for (let y = Math.floor(miny); y <= Math.ceil(maxy); y++) {
      const yc = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[j * 2], y1 = pts[j * 2 + 1];
        if ((y0 <= yc && y1 > yc) || (y1 <= yc && y0 > yc)) xs.push(x0 + ((yc - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
      }
    }
    return this;
  }

  /** Kugel mit Licht von links oben. Ramp 0 dunkel bis 4 hell. dither mischt Bänder weich. */
  ball(cx: number, cy: number, r: number, rp: Ramp, dither = 0.12) {
    return this.shadedEll(cx, cy, r, r, rp, dither);
  }

  shadedEll(cx: number, cy: number, rx: number, ry: number, rp: Ramp, dither = 0.12, lx = -0.55, ly = -0.65) {
    const e = 0.45 / Math.min(rx, ry);
    const lz = Math.sqrt(Math.max(0.05, 1 - lx * lx - ly * ly));
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++)
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry;
        const d2 = nx * nx + ny * ny;
        if (d2 > 1 + e) continue;
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, d2)));
        const l = nx * lx + ny * ly + nz * lz; // -1..1
        let t = (l + 0.35) / 1.35 * 4; // 0..4
        t += (bayer(x, y) - 0.5) * dither * 4;
        const idx = Math.max(0, Math.min(4, Math.round(t)));
        this.set(x, y, rp[idx]);
      }
    return this;
  }

  /** Senkrechter Farbverlauf mit geordnetem Dithering an den Übergängen. */
  vgrad(x: number, y: number, w: number, h: number, colors: Color[]) {
    const n = colors.length;
    for (let j = 0; j < h; j++) {
      const t = (j + 0.5) / h * (n - 1);
      const i = Math.min(n - 2, Math.floor(t));
      const f = t - i;
      for (let k = 0; k < w; k++) {
        const fp = Math.max(0, Math.min(1, (f - 0.3) / 0.4));
        this.set(x + k, y + j, fp > bayer(x + k, y + j) ? colors[i + 1] : colors[i]);
      }
    }
    return this;
  }

  /** Strahlenkranz aus Bändern, abwechselnd zwei Farben (Hintergrundmuster). */
  rays(cx: number, cy: number, n: number, c1: Color, c2: Color, rot = 0) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const a = Math.atan2(y - cy, x - cx) + rot;
        const k = Math.floor(((a + Math.PI) / (Math.PI * 2)) * n * 2);
        this.set(x, y, k % 2 ? c2 : c1);
      }
    return this;
  }

  /** Muster aus zwei Farben, Zelle (cw, ch), Karo oder Streifen. */
  checks(x: number, y: number, w: number, h: number, cw: number, ch: number, c1: Color, c2: Color) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.set(x + i, y + j, (Math.floor(i / cw) + Math.floor(j / ch)) % 2 ? c2 : c1);
    return this;
  }

  /** Gestreut: jeder Pixel in einem Rechteck mit Wahrscheinlichkeit p (Zufall aus r). */
  speckle(x: number, y: number, w: number, h: number, c: Color, p: number, r: () => number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (r() < p) this.set(x + i, y + j, c);
    return this;
  }

  /** Sterne verteilen (Einzelpixel, selten ein Kreuz). */
  stars(n: number, x0: number, y0: number, x1: number, y1: number, r: () => number, cols: Color[] = [0xffffff, 0xcfe3ff, 0xfff2b0]) {
    for (let i = 0; i < n; i++) {
      const x = Math.floor(x0 + r() * (x1 - x0)), y = Math.floor(y0 + r() * (y1 - y0));
      const c = cols[Math.floor(r() * cols.length)];
      this.under(x, y, c);
      if (r() < 0.14) { this.under(x - 1, y, c); this.under(x + 1, y, c); this.under(x, y - 1, c); this.under(x, y + 1, c); }
    }
    return this;
  }

  /** Funkeln: kleines Kreuz mit hellem Kern. */
  sparkle(x: number, y: number, c: Color, big = false, core: Color = 0xffffff) {
    this.set(x, y, core);
    this.set(x - 1, y, c); this.set(x + 1, y, c); this.set(x, y - 1, c); this.set(x, y + 1, c);
    if (big) { this.set(x - 2, y, c); this.set(x + 2, y, c); this.set(x, y - 2, c); this.set(x, y + 2, c); }
    return this;
  }

  text(s: string, x: number, y: number, c: Color) {
    let cx = x;
    for (const ch of s) {
      const g = GLYPHS[ch];
      if (g) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j][i] === '1') this.set(cx + i, y + j, c);
      cx += 4;
    }
    return this;
  }

  /** Wie text, aber jedes Pixel der Glyphe als Block der Kantenlänge k. */
  textBig(s: string, x: number, y: number, c: Color, k = 2) {
    let cx = x;
    for (const ch of s) {
      const g = GLYPHS[ch];
      if (g) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j][i] === '1') this.rect(cx + i * k, y + j * k, k, k, c);
      cx += 4 * k;
    }
    return this;
  }

  /** Legt eine andere Fläche darüber (Transparenz bleibt durchsichtig). */
  blit(src: Pix, ox = 0, oy = 0) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + x];
        if (c !== NONE) this.set(x + ox, y + oy, c);
      }
    return this;
  }

  /** Waagerecht gespiegelte Kopie von src hinzufügen (Symmetrie für Figuren). */
  mirrorFrom(src: Pix, axisX: number) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + x];
        if (c !== NONE) this.set(2 * axisX - x, y, c);
      }
    return this;
  }

  /** Zeichnet fn auf eine eigene Ebene, setzt eine Kontur darum und legt sie auf diese Fläche. */
  fig(fn: (p: Pix) => void, outline: Color | null = INK, diag = false) {
    const layer = new Pix(this.w, this.h);
    fn(layer);
    if (outline !== null) layer.outline(outline, diag);
    this.blit(layer);
    return this;
  }

  /** Kontur: leere Nachbarn belegter Pixel erhalten die Farbe. */
  outline(c: Color, diag = false) {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.data[y * this.w + x] !== NONE) continue;
        const nb = (dx: number, dy: number) => this.get(x + dx, y + dy) !== NONE;
        if (nb(1, 0) || nb(-1, 0) || nb(0, 1) || nb(0, -1) || (diag && (nb(1, 1) || nb(-1, 1) || nb(1, -1) || nb(-1, -1)))) add.push(y * this.w + x);
      }
    for (const i of add) this.data[i] = c;
    return this;
  }

  /** Alle Pixel einer Farbe durch eine andere ersetzen. */
  swap(from: Color, to: Color) {
    for (let i = 0; i < this.data.length; i++) if (this.data[i] === from) this.data[i] = to;
    return this;
  }

  /** Anzahl belegter Pixel. */
  count() {
    let n = 0;
    for (const v of this.data) if (v !== NONE) n++;
    return n;
  }

  /** RGBA Bytes für ImageData oder PNG. */
  toRGBA(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(this.w * this.h * 4);
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      if (c === NONE) continue;
      out[i * 4] = (c >> 16) & 255;
      out[i * 4 + 1] = (c >> 8) & 255;
      out[i * 4 + 2] = c & 255;
      out[i * 4 + 3] = 255;
    }
    return out;
  }
}
