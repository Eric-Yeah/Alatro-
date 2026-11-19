import { INK, Pix, bayer, ramp, rng, type Color, type Ramp } from './jokerPix';

// Gemeinsame Bauteile für die Joker Motive: Farbleitern und Hintergründe. Jedes Motiv selbst
// ist in den Dateien jokerSprites*.ts einzeln gezeichnet, hier liegen nur Farben und Kulissen.

export const PAL = {
  stone: ramp(0x8c92a8),
  slate: ramp(0x56607c),
  wood: ramp(0x9a6234),
  darkwood: ramp(0x5c3a22),
  gold: ramp(0xf2b92c),
  copper: ramp(0xd0702f),
  steel: ramp(0xaeb9cc),
  iron: ramp(0x6a7388),
  red: ramp(0xd8382f),
  crimson: ramp(0xa02446),
  orange: ramp(0xf28a24),
  yellow: ramp(0xf7dc4a),
  lime: ramp(0x9ccf3c),
  green: ramp(0x3fae55),
  forest: ramp(0x2a7a4a),
  teal: ramp(0x2aa6a0),
  cyan: ramp(0x5fd6f0),
  blue: ramp(0x3b7fe0),
  navy: ramp(0x2a3a78),
  indigo: ramp(0x4a3aa8),
  purple: ramp(0x8a52d0),
  magenta: ramp(0xd04ab8),
  pink: ramp(0xf07ab0),
  skin: ramp(0xf0b890),
  tan: ramp(0xc89a62),
  cream: ramp(0xf0e6c8),
  white: ramp(0xe8eef8),
  night: ramp(0x1c2352),
  snow: ramp(0xdce8f5),
  sand: ramp(0xe0c080),
  glass: ramp(0x9fe0e8),
};

export type Sprite = (p: Pix) => void;

/** Sternenhimmel: Verlauf von oben nach unten plus verstreute Sterne. */
export function sky(p: Pix, colors: Color[], stars = 14, seed = 1, y1 = p.h) {
  p.vgrad(0, 0, p.w, y1, colors);
  if (stars > 0) p.stars(stars, 0, 0, p.w, y1 * 0.7, rng(seed));
}

/** Weiche, gestreute Leuchtfläche: füllt nur Pixel, die dem Dither Wert nach an der Reihe sind. */
export function glow(p: Pix, cx: number, cy: number, r: number, c: Color, strength = 1) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy) / r;
      if (d >= 1) continue;
      const k = (1 - d) * strength;
      if (k > bayer(x, y) * 0.95 + 0.05 && (x + y) % 2 === 0) p.set(x, y, c);
      else if (k > 0.7 && k > bayer(x, y)) p.set(x, y, c);
    }
}

/** Hügelkette als Silhouette von y bis zum unteren Rand. */
export function hills(p: Pix, baseY: number, amp: number, period: number, phase: number, c: Color, c2?: Color) {
  for (let x = 0; x < p.w; x++) {
    const top = Math.round(baseY + Math.sin((x / period) * Math.PI * 2 + phase) * amp + Math.sin((x / period) * Math.PI * 4.3 + phase * 2) * amp * 0.35);
    for (let y = top; y < p.h; y++) p.set(x, y, c2 && y === top ? c2 : c);
  }
}

/** Mond mit Kratern. */
export function moon(p: Pix, cx: number, cy: number, r: number) {
  p.ball(cx, cy, r, ramp(0xe8e4c8), 0.1);
  p.set(cx + 1, cy - 1, 0xb8b296); p.set(cx + 2, cy, 0xb8b296); p.set(cx - 1, cy + 2, 0xb8b296);
  if (r > 4) { p.set(cx + 2, cy + 2, 0xb8b296); p.set(cx - 2, cy - 1, 0xc8c3a8); }
}

/** Bodenfläche mit Lichtkante: Rechteck ab y über die ganze Breite. */
export function floor(p: Pix, y: number, rp: Ramp, pattern: 'plain' | 'bricks' | 'planks' = 'plain') {
  p.rect(0, y, p.w, p.h - y, rp[2]);
  p.rect(0, y, p.w, 1, rp[3]);
  p.rect(0, y + 1, p.w, 1, rp[2]);
  if (pattern === 'bricks') {
    for (let j = y + 3; j < p.h; j += 4) {
      p.rect(0, j, p.w, 1, rp[1]);
      const off = ((j - y) / 4) % 2 ? 4 : 0;
      for (let x = off; x < p.w; x += 8) p.rect(x, j + 1, 1, 3, rp[1]);
    }
  } else if (pattern === 'planks') {
    for (let j = y + 4; j < p.h; j += 5) p.rect(0, j, p.w, 1, rp[1]);
  }
}

/** Mauer aus Steinen als Wandhintergrund (Backsteine, versetzt). */
export function wall(p: Pix, y0: number, y1: number, rp: Ramp, cw = 10, ch = 5) {
  for (let y = y0; y < y1; y++) for (let x = 0; x < p.w; x++) p.set(x, y, rp[2]);
  let row = 0;
  for (let y = y0; y < y1; y += ch, row++) {
    p.rect(0, y, p.w, 1, rp[1]);
    const off = row % 2 ? Math.floor(cw / 2) : 0;
    for (let x = off - cw; x < p.w; x += cw) if (x >= 0) p.rect(x, y + 1, 1, ch - 1, rp[1]);
    for (let x = 0; x < p.w; x += 3) p.set(x + ((row * 2) % 3), y + 2, rp[3]);
  }
}

/** Flamme: Tropfenform mit Kern, Spitze oben bei (x, y), Höhe h, sway biegt die Spitze zur Seite. */
export function flame(p: Pix, x: number, y: number, h: number, big = false, sway = 0) {
  const maxw = Math.max(1.5, h / (big ? 2.6 : 3.4));
  for (let j = 0; j < h; j++) {
    const t = (j + 0.5) / h; // 0 Spitze, 1 Basis
    const half = maxw * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.6)), 0.7);
    const off = sway * Math.pow(1 - t, 1.5) * (h / 6);
    const x0 = Math.round(x + off - half), x1 = Math.round(x + off + half);
    for (let i = x0; i <= x1; i++) {
      const d = Math.abs(i - (x + off)) / Math.max(0.5, half);
      let c = 0xe0501f;
      if (d < 0.8 && t > 0.2) c = 0xff8a2a;
      if (d < 0.55 && t > 0.38) c = 0xffc43a;
      if (d < 0.3 && t > 0.55) c = 0xfff0b0;
      p.set(i, y + j, c);
    }
  }
}

/** Dünnes Funkeln über einer Fläche. */
export function twinkles(p: Pix, pts: number[], c: Color = 0xffffff) {
  for (let i = 0; i + 1 < pts.length; i += 2) p.sparkle(pts[i], pts[i + 1], c);
}

export { INK };

/** Punkte eines Sterns (abwechselnd außen und innen) für Pix.poly. */
export function starPts(cx: number, cy: number, ro: number, ri: number, n = 5, rotDeg = -90): number[] {
  const pts: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rotDeg + (i * 180) / n) * Math.PI) / 180;
    const r = i % 2 === 0 ? ro : ri;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return pts;
}

/** Punkte eines Bogens von a0 bis a1 (Grad) als Streckenzug (x, y, ...). */
export function arcPts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 16): number[] {
  const pts: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    pts.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
  return pts;
}
