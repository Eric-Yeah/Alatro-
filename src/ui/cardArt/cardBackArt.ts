import { CARD_BASE } from '../../data/cardArt/cardPalettes';
import { BACK, CARD_PX_H, CARD_PX_W } from '../../data/cardArt/cardGlyphs';
import { BACK_ART, BACK_SEEDS } from '../../data/cardArt/cardBackArt';
import { COSMETICS, getCosmetic, type BackParams, type BackPattern } from '../../data/cosmetics';
import { drawBase } from './cardRender';
import { BAYER4 } from './gridOps';
import { PixelBuffer, mixColor } from './pixelBuffer';

// Kartenrücken der Kosmetik: Muster aus Code, Pixel Raster wie die Karten (82 mal 114), gleiche Kontur und
// gleicher Randstil wie der Standard Rücken (Kontur, weißer Rand, dreifache Linie um das Feld).
// Alles ist deterministisch: feste Saatkörner, kein Math.random. Ohne DOM, damit testbar.

const WHITE = 0xffffff;
const BLACK = 0x000000;

/** Kleiner deterministischer Zufallsgenerator (mulberry32) */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mischt Richtung Schwarz (t negativ) oder Weiß (t positiv) */
const shade = (c: number, t: number) => (t < 0 ? mixColor(c, BLACK, -t) : mixColor(c, WHITE, t));
const lum = (c: number) => 0.3 * ((c >> 16) & 255) + 0.59 * ((c >> 8) & 255) + 0.11 * (c & 255);
const bayer = (x: number, y: number) => (BAYER4[y & 3][x & 3] + 0.5) / 16;

/** Zeichenfläche im Rückenfeld (Ursprung oben links im Feld, Ränder werden abgeschnitten) */
class Field {
  readonly cx: number;
  readonly cy: number;
  constructor(readonly buf: PixelBuffer, readonly ox: number, readonly oy: number, readonly w: number, readonly h: number) {
    this.cx = w / 2;
    this.cy = h / 2;
  }
  set(x: number, y: number, c: number) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.buf.set(this.ox + x, this.oy + y, c);
  }
  get(x: number, y: number): number | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.buf.get(this.ox + x, this.oy + y);
  }
  fill(c: number) { this.buf.fillRect(this.ox, this.oy, this.w, this.h, c); }
  /** Pixel Scheibe, Mittelpunkt (cx, cy) in Pixelmitten */
  disc(cx: number, cy: number, r: number, c: number) {
    const R = Math.ceil(r) + 1;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const px = Math.floor(cx) + x, py = Math.floor(cy) + y;
      if (Math.hypot(px + 0.5 - cx, py + 0.5 - cy) <= r) this.set(px, py, c);
    }
  }
  ring(cx: number, cy: number, r0: number, r1: number, c: number) {
    const R = Math.ceil(r1) + 1;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const px = Math.floor(cx) + x, py = Math.floor(cy) + y;
      const d = Math.hypot(px + 0.5 - cx, py + 0.5 - cy);
      if (d >= r0 && d <= r1) this.set(px, py, c);
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number) {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.5));
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }
  plus(cx: number, cy: number, arm: number, core: number, edge: number) {
    for (let i = 1; i <= arm; i++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) this.set(cx + dx * i, cy + dy * i, i === 1 ? mixColor(core, edge, 0.4) : edge);
    this.set(cx, cy, core);
  }
  /** Raster zeichnen: '#' = Farbe, Mittelpunkt des Rasters bei (cx, cy) */
  glyph(rows: readonly string[], cx: number, cy: number, c: number) {
    const x0 = Math.round(cx - rows[0].length / 2), y0 = Math.round(cy - rows.length / 2);
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') this.set(x0 + i, y0 + j, c); }));
  }
}

type Painter = (f: Field, col: readonly number[], p: BackParams) => void;

// ───────────────────────────────────────────── Muster

const sternenstaub: Painter = (f, [bg, dim, pale, gold]) => {
  const A = BACK_ART.stars;
  const r = rng(BACK_SEEDS.sternenstaub);
  f.fill(bg);
  // Staubband quer über die Karte: dichter entlang der Diagonale
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const d = (x * 0.62 + y * 0.78 - 62) / 11;
    if (r() < A.dust * Math.exp(-d * d)) f.set(x, y, r() < 0.3 ? shade(dim, 0.25) : shade(bg, 0.45) === bg ? dim : mixColor(bg, dim, 0.7));
  }
  for (let cy = 0; cy * A.cell < f.h; cy++) for (let cx = 0; cx * A.cell < f.w; cx++) {
    const x = cx * A.cell + 3 + Math.floor(r() * (A.cell - 6));
    const y = cy * A.cell + 3 + Math.floor(r() * (A.cell - 6));
    const k = r();
    if (k < A.big) { f.plus(x, y, 2, pale, mixColor(dim, pale, 0.5)); if (r() < A.gold * 2) f.set(x, y, gold); }
    else if (k < 0.7) f.set(x, y, r() < A.gold ? gold : k < A.bright ? pale : dim);
  }
};

const kupferraute: Painter = (f, [bg, copper, light]) => {
  const L = BACK_ART.lattice;
  f.fill(bg);
  const half = (L - 1) / 2;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const u = (x + y + L * 200) % L, v = (x - y + L * 200) % L;
    const m = Math.max(Math.abs(u - half), Math.abs(v - half));
    let c: number | null = null;
    if (m >= half) c = copper;
    else if (m === half - 1) c = shade(copper, -0.5);
    else if (m === half - 3) c = mixColor(bg, copper, 0.55);
    else if (m <= 1) c = light;
    else if (m === 2) c = mixColor(copper, light, 0.35);
    if (c !== null) f.set(x, y, c);
  }
  // Glanzpunkte auf den Kreuzungen der Linien
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const u = (x + y + L * 200) % L, v = (x - y + L * 200) % L;
    if (u === 0 && v === 0) f.set(x, y, light);
  }
};

/** Mondphase 0 bis 7 (0 Neumond, 4 Vollmond): ist der Punkt (u, v) in der Scheibe beleuchtet? */
export function moonLit(phase: number, u: number, v: number): boolean {
  const w = Math.sqrt(Math.max(0, 1 - v * v));
  const k = Math.cos((phase / BACK_ART.moons.phases) * Math.PI * 2);
  return phase <= BACK_ART.moons.phases / 2 ? u > k * w : u < -k * w;
}

const mondphasen: Painter = (f, [bg, dark, lit, star]) => {
  const M = BACK_ART.moons;
  const r = rng(BACK_SEEDS.mondphasen);
  f.fill(bg);
  for (let i = 0; i < 46; i++) f.set(Math.floor(r() * f.w), Math.floor(r() * f.h), mixColor(bg, star, 0.35));
  M.ys.forEach((my, row) => M.xs.forEach((mx, col) => {
    const phase = (row * M.xs.length + col) % M.phases;
    const R = M.radius;
    // Leerer Raum um den Mond, damit verstreute Punkte nicht stören
    f.disc(mx, my, R + 1.5, bg);
    for (let y = -R - 1; y <= R; y++) for (let x = -R - 1; x <= R; x++) {
      const px = mx + x, py = my + y;
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d > R) continue;
      const on = moonLit(phase, (x + 0.5) / R, (y + 0.5) / R);
      f.set(px, py, d > R - 1 ? (on ? shade(lit, -0.12) : mixColor(dark, star, 0.45)) : on ? lit : dark);
    }
  }));
  // Sternchen in den Lücken
  for (let row = 0; row < M.ys.length - 1; row++) for (let col = 0; col < M.xs.length - 1; col++) {
    f.plus((M.xs[col] + M.xs[col + 1]) / 2, (M.ys[row] + M.ys[row + 1]) / 2, 1, star, mixColor(bg, star, 0.5));
  }
};

const retorte: Painter = (f, [bg, liquid, glass, bubble]) => {
  const F = BACK_ART.flask;
  const r = rng(BACK_SEEDS.retorte);
  f.fill(bg);
  // Hintergrund Blasen (kleine Ringe)
  for (let i = 0; i < F.bubbles; i++) {
    const x = 4 + r() * (f.w - 8), y = 4 + r() * (f.h - 8);
    if (Math.abs(x - F.cx) < 14 && y > 22 && y < 86) continue;
    f.ring(x, y, 0.9, 1.9 + r() * 1.2, mixColor(bg, bubble, 0.7));
  }
  const inner = mixColor(bg, bubble, 0.18);
  // Bauch
  f.disc(F.cx, F.cy, F.r, glass);
  f.disc(F.cx, F.cy, F.r - 2, inner);
  // Hals (Wand und Innenraum)
  const neckBottom = F.cy - Math.round(Math.sqrt(F.r * F.r - F.neckHalf * F.neckHalf));
  for (let y = F.neckTop; y <= neckBottom + 2; y++) {
    f.set(F.cx - F.neckHalf - 1, y, glass); f.set(F.cx + F.neckHalf, y, glass);
    for (let x = F.cx - F.neckHalf; x < F.cx + F.neckHalf; x++) f.set(x, y, inner);
  }
  f.rect(F.cx - F.neckHalf - 3, F.neckTop - 2, F.neckHalf * 2 + 6, 2, glass);
  f.rect(F.cx - F.neckHalf - 2, F.neckTop - 2, 1, 1, shade(glass, -0.3));
  // Flüssigkeit mit heller Oberfläche
  for (let y = F.liquidY; y < F.cy + F.r; y++) for (let x = F.cx - F.r; x <= F.cx + F.r; x++) {
    if (Math.hypot(x + 0.5 - F.cx, y + 0.5 - F.cy) <= F.r - 2) f.set(x, y, y === F.liquidY ? glass : y < F.liquidY + 3 ? shade(liquid, 0.25) : liquid);
  }
  // Blasen in der Flüssigkeit und aufsteigend durch den Hals bis nach oben
  for (const [bx, by, br] of [[28, 72, 1.6], [38, 76, 2.2], [32, 82, 1.3], [40, 68, 1.2], [26, 78, 1]] as const) f.ring(bx, by, br - 0.8, br + 0.3, shade(liquid, 0.55));
  for (const [bx, by, br] of [[34, 56, 1.4], [35, 44, 1.2], [33, 34, 1], [36, 20, 2.2], [31, 12, 1.5], [37, 7, 1.2], [29, 24, 1], [41, 14, 1]] as const) f.ring(bx, by, br - 0.8, br + 0.3, shade(liquid, 0.5));
  // Glanzbogen links am Bauch
  for (let a = 150; a <= 215; a += 4) f.set(F.cx + Math.cos((a * Math.PI) / 180) * (F.r - 4), F.cy - Math.sin((a * Math.PI) / 180) * (F.r - 4), shade(glass, 0.5));
  // Tisch
  f.rect(6, 90, f.w - 12, 2, bubble);
  f.rect(6, 92, f.w - 12, 1, shade(bubble, -0.5));
};

const astrolabium: Painter = (f, [bg, brass, light, dark]) => {
  const A = BACK_ART.astro;
  const cx = f.cx, cy = A.cy;
  f.fill(bg);
  f.fill(bg);
  const [R1, R2, R3] = A.rings;
  // Scheiben in zwei Tönen
  f.disc(cx, cy, R1, mixColor(bg, dark, 0.35));
  f.disc(cx, cy, R2 - 1, shade(bg, 0.05));
  f.ring(cx, cy, R1 - 0.5, R1 + 0.5, brass);
  f.ring(cx, cy, R1 - 4.5, R1 - 3.8, dark);
  f.ring(cx, cy, R2 - 0.5, R2 + 0.5, brass);
  for (let a = 0; a < 360; a += 12) f.set(cx + Math.cos((a * Math.PI) / 180) * R3, cy + Math.sin((a * Math.PI) / 180) * R3, brass);
  // Gradstriche
  for (let a = 0; a < 360; a += A.tickEvery) {
    const long = a % A.longEvery === 0;
    const rad = (a * Math.PI) / 180;
    for (let rr = R1 - (long ? 5 : 3); rr <= R1 - 1; rr += 0.5) f.set(cx + Math.cos(rad) * rr, cy + Math.sin(rad) * rr, long ? light : brass);
  }
  // Achsen
  f.line(cx, cy - R1, cx, cy + R1, dark);
  f.line(cx - R1, cy, cx + R1, cy, dark);
  // Himmelsrichtungen als Spitzen
  for (let k = 0; k < 4; k++) {
    const rad = (k * Math.PI) / 2;
    for (let rr = R2 + 1; rr <= R1 - 5; rr += 0.5) f.set(cx + Math.cos(rad) * rr, cy + Math.sin(rad) * rr, light);
  }
  // Zeiger: langer Lineal Zeiger mit Spitze, kurzer mit Kreis
  const [h1, h2] = A.hands.map((a) => (a * Math.PI) / 180);
  for (let d = 0; d <= R2 - 1; d += 0.5) { f.set(cx + Math.cos(h1) * d, cy + Math.sin(h1) * d, light); f.set(cx + Math.cos(h1) * d + 1, cy + Math.sin(h1) * d, brass); }
  f.disc(cx + Math.cos(h1) * (R2 - 2), cy + Math.sin(h1) * (R2 - 2), 2, light);
  for (let d = 0; d <= R3; d += 0.5) f.set(cx + Math.cos(h2) * d, cy + Math.sin(h2) * d, brass);
  f.ring(cx + Math.cos(h2) * (R3 + 1), cy + Math.sin(h2) * (R3 + 1), 1.2, 2.6, light);
  f.disc(cx, cy, 3.4, brass);
  f.disc(cx, cy, 1.6, light);
  // Aufhängung oben und unten (um 180 Grad symmetrisch)
  for (const s of [1, -1]) {
    const y0 = s > 0 ? cy - R1 - 1 : cy + R1 + 1;
    f.ring(cx, y0 - s * 8, 3.2, 5.2, brass);
    f.ring(cx, y0 - s * 8, 5.2, 5.8, dark);
    f.set(cx, y0 - s * 8, light);
    for (let i = 0; i < 4; i++) f.set(cx, y0 - s * i, brass);
    f.rect(cx - 1, y0 - s * 4, 3, 1, light);
  }
  // Ecken: kleine Gradbögen
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const ox = sx ? f.w - 1 : 0, oy = sy ? f.h - 1 : 0;
    for (let rr of [5, 8]) for (let a = 0; a <= 90; a += 6) {
      const rad = (a * Math.PI) / 180;
      f.set(ox + (sx ? -1 : 1) * Math.cos(rad) * rr, oy + (sy ? -1 : 1) * Math.sin(rad) * rr, rr === 5 ? light : dark);
    }
  }
};

/** Zwölf Zeichen als 5 mal 5 Raster, frei gezeichnet (Widder bis Fische, stark vereinfacht) */
export const ZODIAC_GLYPHS: readonly (readonly string[])[] = [
  ['#...#', '#...#', '.#.#.', '..#..', '..#..'],
  ['#...#', '.###.', '#...#', '#...#', '.###.'],
  ['#####', '.#.#.', '.#.#.', '.#.#.', '#####'],
  ['.###.', '#....', '.###.', '....#', '.###.'],
  ['.##..', '#..#.', '#..#.', '#..#.', '.#..#'],
  ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '..#.#'],
  ['.###.', '#...#', '.....', '#####', '.....'],
  ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '....#'],
  ['..###', '...##', '..#.#', '.#...', '#....'],
  ['#...#', '#...#', '#.#.#', '.#.##', '..#.#'],
  ['.....', '.#.#.', '#.#.#', '.#.#.', '.....'],
  ['#...#', '.#.#.', '.###.', '.#.#.', '#...#'],
];

const tierkreis: Painter = (f, [bg, gold, light, violet]) => {
  const Z = BACK_ART.zodiac;
  const cx = f.cx, cy = f.cy;
  f.fill(bg);
  // Felder des Rings abwechselnd getönt
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d > Z.inner && d < Z.outer) {
      const sector = Math.floor(((Math.atan2(y + 0.5 - cy, x + 0.5 - cx) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 6));
      f.set(x, y, sector % 2 === 0 ? mixColor(bg, violet, 0.55) : mixColor(bg, violet, 0.2));
    } else if (d <= Z.inner) f.set(x, y, mixColor(bg, violet, 0.12));
  }
  f.ring(cx, cy, Z.outer - 0.5, Z.outer + 0.6, gold);
  f.ring(cx, cy, Z.inner - 0.6, Z.inner + 0.5, gold);
  f.ring(cx, cy, Z.outer + 1.8, Z.outer + 2.4, shade(gold, -0.45));
  for (let k = 0; k < Z.signs; k++) {
    const a = (k * Math.PI * 2) / Z.signs;
    for (let rr = Z.inner; rr <= Z.outer; rr += 0.5) f.set(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, gold);
    const m = a + Math.PI / Z.signs;
    f.glyph(ZODIAC_GLYPHS[k], cx + Math.cos(m) * Z.glyphR, cy + Math.sin(m) * Z.glyphR, light);
  }
  // Stern in der Mitte
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4, len = k % 2 === 0 ? Z.starLong : Z.starShort;
    for (let rr = 0; rr <= len; rr += 0.5) f.set(cx + Math.cos(a) * rr - 0.5, cy + Math.sin(a) * rr - 0.5, k % 2 === 0 ? light : gold);
  }
  f.ring(cx, cy, 5.5, 6.4, gold);
  f.disc(cx, cy, 2.4, light);
  // Sterne an den Rändern
  for (const [x, y] of [[8, 8], [f.w - 9, 8], [8, f.h - 9], [f.w - 9, f.h - 9], [cx, 7], [cx, f.h - 8]]) f.plus(x, y, 2, light, shade(gold, -0.1));
};

const nebelwirbel: Painter = (f, [bg, violet, pink, light]) => {
  const N = BACK_ART.nebula;
  const r = rng(BACK_SEEDS.nebelwirbel);
  f.fill(bg);
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const dx = x + 0.5 - f.cx, dy = y + 0.5 - f.cy;
    const d = Math.hypot(dx, dy);
    const th = Math.atan2(dy, dx) / (Math.PI * 2);
    const t = (((th * N.arms + d / N.turns) % 1) + 1) % 1;
    const arm = 1 - Math.abs(t - 0.5) * 2;
    const fall = Math.max(0, 1 - d / N.radius);
    const i = Math.pow(arm, 0.9) * (0.35 + 0.65 * fall) + (d < 7 ? (7 - d) / 7 : 0);
    const lvl = i + (bayer(x, y) - 0.5) * 0.4;
    f.set(x, y, lvl > 0.86 ? light : lvl > 0.58 ? pink : lvl > 0.3 ? violet : lvl > 0.12 ? mixColor(bg, violet, 0.4) : bg);
  }
  for (let i = 0; i < N.stars; i++) {
    const x = Math.floor(r() * f.w), y = Math.floor(r() * f.h);
    if (f.get(x, y) === bg) f.set(x, y, r() < 0.3 ? light : mixColor(bg, light, 0.6));
  }
  f.disc(f.cx, f.cy, 2, light);
};

const goldadern: Painter = (f, [bg, gold, bright]) => {
  const V = BACK_ART.veins;
  const r = rng(BACK_SEEDS.goldadern);
  f.fill(bg);
  const glow = mixColor(bg, gold, 0.22);
  const pts: [number, number, boolean, number][] = [];
  const grow = (x: number, y: number, ang: number, len: number, depth: number) => {
    for (let i = 0; i < len; i++) {
      ang += (r() - 0.5) * 2 * V.wobble;
      x += Math.cos(ang); y += Math.sin(ang);
      pts.push([x, y, i % 8 === 3, depth]);
      if (depth < V.depth && i > 5 && r() < V.fork) grow(x, y, ang + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.6), Math.round((len - i) * 0.75), depth + 1);
    }
  };
  // Hauptadern strahlen von einem Nugget in der Mitte nach außen
  for (let k = 0; k < V.main; k++) grow(f.cx, f.cy, (k / V.main) * Math.PI * 2 + 0.4 + r() * 0.3, V.length, 0);
  const plot = (x: number, y: number, c: number, over = true) => {
    for (const [px, py] of [[x, y], [f.w - 1 - x, f.h - 1 - y]]) if (over || f.get(Math.round(px), Math.round(py)) === bg) f.set(px, py, c);
  };
  for (const [x, y] of pts) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) plot(x + dx, y + dy, glow, false);
  for (const [x, y, hi, depth] of pts) {
    plot(x, y, hi ? bright : gold);
    if (depth === 0) plot(x + 1, y, shade(gold, -0.2));
  }
  // Nugget in der Mitte
  f.disc(f.cx, f.cy, 4.5, gold);
  f.disc(f.cx - 1, f.cy - 1, 2.6, bright);
  f.ring(f.cx, f.cy, 4.5, 5.4, shade(gold, -0.35));
};

const sonnenfinsternis: Painter = (f, [bg, white, gold, orange]) => {
  const E = BACK_ART.eclipse;
  const r = rng(BACK_SEEDS.sonnenfinsternis);
  f.fill(bg);
  for (let i = 0; i < BACK_ART.eclipse.stars; i++) f.set(Math.floor(r() * f.w), Math.floor(r() * f.h), mixColor(bg, white, 0.35 + r() * 0.3));
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const dx = x + 0.5 - f.cx, dy = y + 0.5 - f.cy;
    const d = Math.hypot(dx, dy);
    if (d <= E.disc) continue;
    const a = Math.atan2(dy, dx);
    const reach = E.reach + 5 * Math.sin(7 * a + 1) + 4 * Math.sin(13 * a + 2) + 3.5 * Math.sin(3 * a) + 2 * Math.sin(23 * a);
    const i = 1 - (d - E.disc) / Math.max(4, reach);
    if (i <= 0) continue;
    const lvl = i * 1.05 + (bayer(x, y) - 0.5) * 0.35;
    if (lvl > 0.8) f.set(x, y, white);
    else if (lvl > 0.5) f.set(x, y, gold);
    else if (lvl > 0.2) f.set(x, y, orange);
  }
  // Scheibe mit hellem Rand und einem Lichtpunkt (Diamantring)
  f.ring(f.cx, f.cy, E.disc - 1, E.disc + 0.2, mixColor(bg, white, 0.35));
  f.ring(f.cx, f.cy, E.disc + 0.2, E.disc + 1.3, white);
  f.plus(f.cx + E.disc * 0.72, f.cy - E.disc * 0.72, 2, white, gold);
};

const kometenbahn: Painter = (f, [bg, white, light, blue]) => {
  const C = BACK_ART.comets;
  const r = rng(BACK_SEEDS.kometenbahn);
  f.fill(bg);
  for (let i = 0; i < 40; i++) f.set(Math.floor(r() * f.w), Math.floor(r() * f.h), mixColor(bg, light, 0.25 + r() * 0.35));
  const S = Math.SQRT1_2;
  const comet = (hx: number, hy: number, len: number, w: number, flip: boolean) => {
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const qx = (flip ? f.w - 1 - x : x) + 0.5 - hx, qy = (flip ? f.h - 1 - y : y) + 0.5 - hy;
      const along = (-qx + qy) * S, perp = (qx + qy) * S;
      if (along < 0 || along > len) continue;
      const wd = w * Math.pow(1 - along / len, 0.8) + 0.6;
      const rel = Math.abs(perp) / wd;
      if (rel > 1) continue;
      const fade = along / len;
      if (fade > 0.55 && bayer(x, y) < (fade - 0.55) * 1.8) continue;
      f.set(x, y, rel < 0.34 ? white : rel < 0.68 ? light : blue);
    }
    // Kopf: Scheibe mit Hof
    const px = flip ? f.w - 1 - hx : hx, py = flip ? f.h - 1 - hy : hy;
    f.disc(px, py, 4.4, mixColor(blue, light, 0.5));
    f.disc(px, py, 3.2, light);
    f.disc(px, py, 2, white);
  };
  for (const c of C) { comet(c.x, c.y, c.len, c.w, false); comet(c.x, c.y, c.len, c.w, true); }
  // Feine Begleitstreifen parallel zu den Schweifen
  for (const [x0, y0, len] of [[28, 8, 16], [64, 40, 22], [60, 70, 14]] as const) for (let i = 0; i < len; i++) { f.set(x0 - i, y0 + i, mixColor(blue, light, 0.3)); f.set(f.w - 1 - (x0 - i), f.h - 1 - (y0 + i), mixColor(blue, light, 0.3)); }
};

// ───────────────────────────────────────────── Deck Wappen

type Motif = (f: Field, deck: number, light: number, metal: number) => void;

/** Alle Wappen: Medaillon in Deckfarbe, Perlenring, Motiv in der Mitte */
const MOTIFS: Record<string, Motif> = {
  nachthimmel(f, deck, light, metal) {
    const cx = f.cx - 2, cy = f.cy;
    f.disc(cx, cy, 15, light);
    f.disc(cx + 6, cy - 3, 12.5, shade(deck, -0.15));
    f.ring(cx, cy, 14, 15, shade(light, -0.25));
    for (const [x, y, a] of [[47, 38, 2], [44, 62, 2], [40, 50, 1], [29, 68, 1]] as const) f.plus(x, y, a, light, metal);
  },
  glut(f, _deck, light, metal) {
    const top = 24, bottom = 77;
    for (let y = top; y <= bottom; y++) {
      const t = (y - top) / (bottom - top);
      const sway = 3.2 * Math.sin(t * 5.2) * (1 - t);
      const hw = 18 * Math.pow(t, 0.75) * Math.pow(1 - t, 0.3) * (t < 0.12 ? 0.6 : 1);
      for (let x = Math.floor(f.cx + sway - hw); x <= Math.ceil(f.cx + sway + hw); x++) {
        const k = Math.abs(x + 0.5 - f.cx - sway) / Math.max(hw, 0.5);
        f.set(x, y, k > 0.78 || t < 0.1 ? shade(metal, -0.3) : k > 0.5 ? metal : k > 0.28 || t < 0.4 ? light : shade(light, 0.7));
      }
    }
    for (const sx of [-1, 1]) for (let i = 0; i < 10; i++) f.set(f.cx + sx * (11 + i * 0.3), 66 - i * 1.4 - (sx > 0 ? 2 : 0), i < 5 ? metal : light);
  },
  tiefsee(f, deck, light, metal) {
    const cx = f.cx, cy = 45;
    for (let y = -12; y <= 0; y++) for (let x = -14; x <= 14; x++) {
      const d = Math.hypot(x / 14, y / 12);
      if (d > 1) continue;
      f.set(cx + x, cy + y, d > 0.88 ? shade(light, -0.25) : d > 0.62 ? light : mixColor(light, metal, 0.35));
    }
    for (let x = -14; x <= 14; x++) f.set(cx + x, cy + 1, x % 4 === 0 ? shade(light, -0.25) : shade(deck, 0.1));
    for (const [dx, dy] of [[-5, -7], [0, -9], [5, -6], [-9, -3], [8, -2]]) f.set(cx + dx, cy + dy, shade(light, 0.6));
    for (let k = -2; k <= 2; k++) for (let y = 0; y < 22 - Math.abs(k) * 2; y++) f.set(cx + k * 5.5 + 2.2 * Math.sin(y * 0.45 + k), cy + 3 + y, y % 5 === 0 ? light : metal);
    for (const [x, y] of [[20, 70], [48, 66], [46, 30], [23, 33]]) f.ring(x, y, 0.6, 1.5, metal);
    for (let x = 12; x <= 56; x++) f.set(x, 74 + Math.round(1.4 * Math.sin(x * 0.55)), metal);
  },
  waage(f, _deck, light, metal) {
    const cx = f.cx;
    f.rect(cx - 1, 34, 3, 34, light);
    f.rect(cx - 8, 66, 17, 3, light); f.rect(cx - 6, 64, 13, 2, metal);
    f.disc(cx, 32, 3, light);
    f.rect(cx - 17, 38, 35, 2, light);
    for (const sx of [-1, 1]) {
      const bx = cx + sx * 17;
      f.disc(bx, 39, 2.4, light);
      f.line(bx, 40, bx - 7, 54, metal); f.line(bx, 40, bx + 7, 54, metal);
      for (let x = -8; x <= 8; x++) for (let y = 0; y <= 4; y++) if (Math.hypot(x / 8.5, y / 4.5) <= 1 && y >= 0) f.set(bx + x, 54 + y, y === 0 ? light : y > 2 ? shade(light, -0.3) : light);
      f.rect(bx - 2, 51, 5, 3, shade(metal, 0.2));
    }
    f.set(cx, 34, metal);
  },
  alchemist(f, _deck, light, metal) {
    const cx = f.cx, cy = f.cy + 1, R = 18;
    f.ring(cx, cy, R - 0.6, R + 0.4, light);
    const tri = (rot: number, rad: number, c: number) => {
      const v = [0, 1, 2].map((k) => [cx + Math.cos(rot + (k * Math.PI * 2) / 3) * rad, cy + Math.sin(rot + (k * Math.PI * 2) / 3) * rad]);
      for (let k = 0; k < 3; k++) f.line(v[k][0], v[k][1], v[(k + 1) % 3][0], v[(k + 1) % 3][1], c);
      return v;
    };
    const up = tri(-Math.PI / 2, R, light);
    tri(Math.PI / 2, R * 0.5, metal);
    f.line(cx - R * 0.43, cy + R * 0.25, cx + R * 0.43, cy + R * 0.25, metal);
    for (const [x, y] of up) f.disc(x, y, 1.8, metal);
    f.disc(cx, cy, 2.2, light);
    f.disc(cx, cy, 1.1, metal);
    for (const k of [0, 1, 2, 3]) f.set(cx + Math.cos((k * Math.PI) / 2 + 0.78) * (R + 4), cy + Math.sin((k * Math.PI) / 2 + 0.78) * (R + 4), light);
  },
  sternenkind(f, _deck, light, metal) {
    const cx = f.cx, cy = f.cy;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4, len = k % 2 === 0 ? 19 : 12;
      for (let rr = 0; rr <= len; rr += 0.5) {
        const w = Math.max(0, (k % 2 === 0 ? 2.4 : 1.6) * (1 - rr / len));
        for (let o = -Math.ceil(w); o <= Math.ceil(w); o++) f.set(cx + Math.cos(a) * rr - 0.5 - Math.sin(a) * o, cy + Math.sin(a) * rr - 0.5 + Math.cos(a) * o, k % 2 === 0 ? light : metal);
      }
    }
    f.ring(cx, cy, 5, 6.2, metal);
    f.disc(cx, cy, 3.4, light);
    f.disc(cx, cy, 1.6, shade(light, 0.7));
    for (const [dx, dy] of [[-13, -13], [14, -12], [-12, 14], [13, 13]]) f.plus(cx + dx, cy + dy, 1, light, metal);
  },
  halbmond(f, deck, light, metal) {
    const cx = f.cx, cy = f.cy, R = 18;
    for (let y = -R; y < R; y++) for (let x = -R; x < R; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d > R) continue;
      if (x < 0) f.set(cx + x, cy + y, d > R - 1.2 ? shade(light, -0.25) : light);
      else if (d > R - 1.2) f.set(cx + x, cy + y, metal);
    }
    f.rect(cx - 1, cy - R, 2, R * 2, metal);
    for (const [x, y, r] of [[-9, -6, 3.2], [-5, 7, 2.6], [-12, 3, 1.6], [-3, -11, 1.6]] as const) { f.disc(cx + x, cy + y, r, shade(light, -0.22)); f.disc(cx + x - 0.6, cy + y - 0.6, r - 1, shade(light, 0.2)); }
    for (const [x, y] of [[9, -6], [12, 5], [6, 11], [8, -12]]) f.plus(cx + x, cy + y, 1, metal, mixColor(deck, metal, 0.4));
  },
};

const wappen: Painter = (f, [deck, light, metal], p) => {
  const S = BACK_ART.seal;
  const cx = f.cx, cy = f.cy;
  const bg = shade(deck, -0.5);
  f.fill(bg);
  // feines Gitter im Grund
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const u = (x + y) % 6, v = (x - y + 600) % 6;
    if (u === 0 || v === 0) f.set(x, y, mixColor(bg, deck, 0.38));
  }
  // Medaillon: Fläche, Rand aus Metall, Perlenring
  f.disc(cx, cy, S.radius, shade(deck, -0.12));
  f.ring(cx, cy, S.radius - 1.2, S.radius + 0.3, metal);
  f.ring(cx, cy, S.radius - 3.2, S.radius - 2.5, shade(metal, -0.3));
  f.ring(cx, cy, S.radius + 0.3, S.radius + 1.3, shade(metal, -0.5));
  for (let k = 0; k < S.beads; k++) {
    const a = (k * Math.PI * 2) / S.beads;
    f.disc(cx + Math.cos(a) * (S.radius + 4), cy + Math.sin(a) * (S.radius + 4), 1.1, k % 2 ? metal : light);
  }
  for (const [x, y] of [[8, 8], [f.w - 9, 8], [8, f.h - 9], [f.w - 9, f.h - 9]]) f.plus(x, y, 2, light, metal);
  for (const y of [14, f.h - 15]) for (let k = -2; k <= 2; k++) f.set(cx + k * 5, y, k === 0 ? light : metal);
  (MOTIFS[p.deckId ?? ''] ?? MOTIFS.nachthimmel)(f, deck, light, metal);
};

const PAINTERS: Record<BackPattern, Painter> = {
  sternenstaub, kupferraute, mondphasen, retorte, astrolabium, tierkreis, nebelwirbel, goldadern, sonnenfinsternis, kometenbahn, wappen,
};

// ───────────────────────────────────────────── Zusammenbau

/** Dreifache Linie um das Feld wie beim Standard Rücken, Farben aus den Rücken Farben abgeleitet */
function drawFrame(f: Field, cols: readonly number[]) {
  const sorted = [...cols].sort((a, b) => lum(a) - lum(b));
  const dark = sorted[0], light = sorted[sorted.length - 1];
  const w = f.w, h = f.h;
  const line = (i: number, c: number) => {
    for (let x = i; x < w - i; x++) { f.set(x, i, c); f.set(x, h - 1 - i, c); }
    for (let y = i; y < h - i; y++) { f.set(i, y, c); f.set(w - 1 - i, y, c); }
  };
  line(0, shade(light, -0.05));
  line(1, shade(dark, -0.55));
  line(2, mixColor(dark, light, 0.12));
  line(3, mixColor(dark, light, 0.4));
}

/** Rendert den Rücken zu den Parametern eines Katalog Eintrags (Größe und Rand wie der Standard Rücken) */
export function renderBackFromParams(p: BackParams): PixelBuffer {
  const W = CARD_PX_W, H = CARD_PX_H, i0 = BACK.inset;
  const buf = new PixelBuffer(W, H);
  drawBase(buf, CARD_BASE.face);
  const f = new Field(buf, i0, i0, W - i0 * 2, H - i0 * 2);
  PAINTERS[p.pattern](f, p.colors, p);
  drawFrame(f, p.colors);
  return buf;
}

/** Rücken zu einer Kosmetik Id, `null` wenn die Id kein Rücken ist (dann gilt die Deckfarbe) */
export function renderBackById(id: string): PixelBuffer | null {
  const c = getCosmetic(id);
  return c && c.category === 'back' ? renderBackFromParams(c.params) : null;
}

/** Ids aller Rücken im Katalog (für Tests und Vorschau) */
export const BACK_IDS: readonly string[] = COSMETICS.filter((c) => c.category === 'back').map((c) => c.id);
