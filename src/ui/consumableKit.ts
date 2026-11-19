import { INK, NONE, Pix, bayer, ramp, rng, type Color, type Ramp } from './jokerPix';
import { PAL, arcPts, glow, hills, starPts, wall } from './jokerKit';

// Gemeinsame Bauteile für die Consumable Motive: Kulissen (Nachthimmel mit Nebel, Leuchten) und kleine
// Werkzeuge (Sterne, Sternbild Linien, Blasen). Jedes Motiv ist in den Dateien consumableSprites*.ts einzeln
// gezeichnet, hier liegen nur Farben und Kulissen. Zeichenfläche eines Motivs ist 40 mal 40, Mitte x = 20.

export { INK, PAL, arcPts, glow, hills, starPts, wall, ramp, rng, bayer };
export type { Color, Ramp };
export type Sprite = (p: Pix) => void;

/** Glatter Zufallswert 0..1 an einer Gitterstelle (für Nebelwolken). */
function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Nebelwolke: gestreute Fläche in Ellipsenform, die Ränder lösen sich per Dithering auf. */
export function cloud(p: Pix, cx: number, cy: number, rx: number, ry: number, c: Color, density = 1, seed = 1, scale = 0.13) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d >= 1) continue;
      const n = vnoise(x * scale * 5, y * scale * 5, seed);
      const k = (1 - d) * 1.4 * n * density;
      if (k > bayer(x, y)) p.set(x, y, c);
    }
}

/** Nachthimmel: Verlauf, Nebelwolken und Sterne. Füllt die ganze Fläche. */
export function cosmos(p: Pix, cols: Color[], seed = 1, o: { stars?: number; clouds?: [number, number, number, number, Color, number?][] } = {}) {
  p.vgrad(0, 0, p.w, p.h, cols);
  (o.clouds ?? []).forEach(([cx, cy, rx, ry, c, dn], i) => cloud(p, cx, cy, rx, ry, c, dn ?? 1, seed + i * 7));
  p.stars(o.stars ?? 14, 0, 0, p.w, p.h, rng(seed));
}

/** Vierzackiger Stern mit hellem Kern. */
export function star4(p: Pix, cx: number, cy: number, r: number, c: Color, core: Color = 0xffffff, fat = 0.3) {
  const k = r * fat;
  p.poly([cx, cy - r, cx + k, cy - k, cx + r, cy, cx + k, cy + k, cx, cy + r, cx - k, cy + k, cx - r, cy, cx - k, cy - k], c);
  p.set(cx, cy, core);
  if (r > 4) { p.set(cx - 1, cy, core); p.set(cx + 1, cy, core); p.set(cx, cy - 1, core); p.set(cx, cy + 1, core); }
}

/** Fünfzackiger Stern mit Licht links oben (Gold oder eine andere Leiter). */
export function gemStar(p: Pix, cx: number, cy: number, r: number, rp = PAL.gold) {
  p.fig((q) => {
    q.poly(starPts(cx, cy, r, r * 0.45, 5), rp[2]);
    q.poly([cx, cy - r, cx + r * 0.2, cy - r * 0.3, cx, cy, cx - r * 0.2, cy - r * 0.3], rp[4]);
    q.poly([cx - r * 0.95, cy - r * 0.3, cx - r * 0.3, cy - r * 0.2, cx, cy, cx - r * 0.1, cy + r * 0.15], rp[3]);
    q.poly([cx + r * 0.6, cy + r * 0.9, cx, cy + r * 0.35, cx + r * 0.2, cy, cx + r * 0.95, cy - r * 0.3], rp[1]);
  }, INK);
}

/** Sternbild: Linien zwischen Sternen, dann die Sterne (Größe 0 Punkt, 1 Kreuz, 2 Stern, 3 großer Stern mit Leuchten). */
export function constel(p: Pix, pts: number[][], links: number[][], line: Color = 0x7aa0f0, star: Color = 0xfff0b8) {
  for (const [a, b] of links) p.line(pts[a][0], pts[a][1], pts[b][0], pts[b][1], line);
  for (const [x, y, s] of pts) {
    if (s === 0) { p.set(x, y, star); }
    else if (s === 1) p.sparkle(x, y, star);
    else if (s === 2) star4(p, x, y, 4, star);
    else { glow(p, x, y, 8, 0xffd860, 0.9); star4(p, x, y, 6, 0xffd860); }
  }
}

/** Blasen: kleine helle Ringe mit Glanzpunkt. */
export function bubbles(p: Pix, pts: number[][], c: Color = 0xd8fff0) {
  for (const [x, y, r] of pts) {
    if (r <= 1) p.set(x, y, c);
    else { p.ring(x, y, r, c); p.set(x - Math.floor(r / 2), y - Math.floor(r / 2), 0xffffff); }
  }
}

/** Glasglanz: senkrechter heller Streifen links und Punkt oben. */
export function shine(p: Pix, x: number, y0: number, y1: number, c: Color = 0xffffff) {
  p.rect(x, y0, 1, y1 - y0, c);
  p.set(x, y0 - 1, c);
}

/** Bodenfläche aus Dielen oder Stein mit heller Kante (Tisch, Boden). */
export function ground(p: Pix, y: number, rp: ReturnType<typeof ramp>) {
  p.rect(0, y, p.w, p.h - y, rp[2]);
  p.rect(0, y, p.w, 1, rp[4]);
  p.rect(0, y + 1, p.w, 1, rp[3]);
  for (let j = y + 4; j < p.h; j += 4) p.rect(0, j, p.w, 1, rp[1]);
  for (let j = y + 2, r = 0; j < p.h; j += 4, r++) for (let x = (r % 2) * 6; x < p.w; x += 12) p.rect(x, j, 1, 3, rp[1]);
}

/** Strahlenkranz hinter einem Gegenstand, nur teilweise sichtbar (gestreut). */
export function burst(p: Pix, cx: number, cy: number, r0: number, r1: number, n: number, c: Color, rot = 0) {
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const len = i % 2 ? r1 * 0.7 : r1;
    p.line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * len, cy + Math.sin(a) * len, c);
  }
}

/** Zeichnet eine Form auf eine eigene Ebene und schattiert sie nach Licht von links oben (Farbleiter rp), mit Kontur. */
export function lit(p: Pix, draw: (q: Pix) => void, cx: number, cy: number, r: number, rp: Ramp, outline: Color | null = INK, strength = 2.2) {
  const q = new Pix(p.w, p.h);
  draw(q);
  for (let y = 0; y < q.h; y++)
    for (let x = 0; x < q.w; x++) {
      if (q.data[y * q.w + x] === NONE) continue;
      const l = -((x - cx) * 0.6 + (y - cy) * 0.75) / r;
      const t = 2 + l * strength + (bayer(x, y) - 0.5) * 0.9;
      q.data[y * q.w + x] = rp[Math.max(0, Math.min(4, Math.round(t)))];
    }
  if (outline !== null) q.outline(outline);
  p.blit(q);
}

/** Kartenzeichen als Form (Farbe c), Mitte cx, cy, Größe s (halbe Breite). */
export function heartShape(q: Pix, cx: number, cy: number, s: number, c: Color) {
  q.disc(cx - s * 0.5, cy - s * 0.35, s * 0.58, c);
  q.disc(cx + s * 0.5, cy - s * 0.35, s * 0.58, c);
  q.poly([cx - s * 1.05, cy - s * 0.15, cx + s * 1.05, cy - s * 0.15, cx, cy + s * 1.05], c);
}
export function spadeShape(q: Pix, cx: number, cy: number, s: number, c: Color) {
  q.disc(cx - s * 0.52, cy + s * 0.1, s * 0.58, c);
  q.disc(cx + s * 0.52, cy + s * 0.1, s * 0.58, c);
  q.poly([cx, cy - s * 1.1, cx + s * 1.08, cy + s * 0.2, cx - s * 1.08, cy + s * 0.2], c);
  q.poly([cx - s * 0.2, cy + s * 0.5, cx + s * 0.2, cy + s * 0.5, cx + s * 0.55, cy + s * 1.1, cx - s * 0.55, cy + s * 1.1], c);
}
export function clubShape(q: Pix, cx: number, cy: number, s: number, c: Color) {
  q.disc(cx, cy - s * 0.55, s * 0.55, c);
  q.disc(cx - s * 0.58, cy + s * 0.25, s * 0.55, c);
  q.disc(cx + s * 0.58, cy + s * 0.25, s * 0.55, c);
  q.poly([cx - s * 0.18, cy, cx + s * 0.18, cy, cx + s * 0.5, cy + s * 1.1, cx - s * 0.5, cy + s * 1.1], c);
}
export function diamondShape(q: Pix, cx: number, cy: number, s: number, c: Color) {
  q.poly([cx, cy - s * 1.2, cx + s * 0.85, cy, cx, cy + s * 1.2, cx - s * 0.85, cy], c);
}

/** Punkte entlang eines Bogens verstreuen (Staub, Funken, Asche). */
export function dust(p: Pix, pts: number[][], cols: Color[]) {
  pts.forEach(([x, y], i) => p.set(x, y, cols[i % cols.length]));
}
