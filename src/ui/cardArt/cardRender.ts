import type { Rank, Suit } from '../../core/types';
import { CARD_BASE, CARD_PALETTES, type CardPaletteId, type SuitColors } from '../../data/cardArt/cardPalettes';
import { ACE, BACK, CARD_PX_H, CARD_PX_W, CARD_SHAPE, COURT_FIGURE_OFFSET, COURT_HALF, COURT_PANEL, INDEX_FONT, INDEX_POS, PIP_COL, PIP_LAYOUT, PIP_ROW, SUIT_PIP, SUIT_SMALL } from '../../data/cardArt/cardGlyphs';
import { COURT_PATTERN, FIGURE, FIGURES, SKIN_TONES, type Court, type CourtId } from '../../data/cardArt/courtSprites';
import { faceHalfRows } from '../../data/cardArt/faceSprites';
import { BAYER4, mirrorEven, scale2x } from './gridOps';
import { PixelBuffer, gridBuffer, mirrorRows, mixColor, type ColorMap } from './pixelBuffer';

// Zeichnet Kartenvorderseiten und Rückseiten als Pixel Puffer (ohne DOM, testbar).
// Feine Auflösung: 82 mal 114 Pixel. Formen entstehen aus Maßen und Gleichungen, Figuren aus Entwurfsrastern,
// die verdoppelt, geglättet, mit Stoffmustern, Kontur und Schattierung versehen werden.

export interface CardRenderOpts {
  /** Grundfarbe der Fläche (Enhancement), der weiße Rand bleibt */
  face?: number;
  /** Karte ohne Rang: statt Index und Pips ein Kristall */
  rankless?: boolean;
}

const COURT_BY_RANK: Partial<Record<Rank, Court>> = { 11: 'J', 12: 'Q', 13: 'K' };
const WHITE = 0xffffff;
const BLACK = 0x000000;

// ───────────────────────────────────────────── Karte und Index

/** Abstand eines Pixelmittelpunkts zum Rand der Karte (negativ innen), abgerundetes Rechteck */
function cardDistance(x: number, y: number): number {
  const W = CARD_PX_W, H = CARD_PX_H, R = CARD_SHAPE.radius;
  const px = x + 0.5 - W / 2, py = y + 0.5 - H / 2;
  const qx = Math.abs(px) - (W / 2 - R), qy = Math.abs(py) - (H / 2 - R);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - R;
}

/** Karten Grundform mit weich gerundeten Ecken, dunkler Kontur und weißem Rand */
function drawBase(buf: PixelBuffer, face: number) {
  for (let y = 0; y < CARD_PX_H; y++) {
    for (let x = 0; x < CARD_PX_W; x++) {
      const d = cardDistance(x, y);
      if (d > 0) continue;
      if (d > -1) buf.set(x, y, CARD_BASE.outline);
      else if (d > -1 - CARD_SHAPE.border) buf.set(x, y, CARD_BASE.face);
      else buf.set(x, y, face);
    }
  }
}

const glyphMap = (color: number): ColorMap => ({ '#': color });

function indexLabel(rank: Rank): string {
  return rank === 14 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
}

// ───────────────────────────────────────────── Farbsymbole

/** Maske eines Farbsymbols in der Größe w mal h (true = Pixel gehört zur Form) */
export function suitMask(suit: Suit, w: number, h: number): boolean[][] {
  const heart = (x: number, y: number) => (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0;
  const rows: boolean[][] = [];
  const bodyH = Math.round(h * 0.74);
  for (let j = 0; j < h; j++) {
    const row: boolean[] = [];
    for (let i = 0; i < w; i++) {
      const ux = ((i + 0.5) / w - 0.5) * 2; // -1 bis 1
      const vy = ((j + 0.5) / h - 0.5) * 2;
      let on = false;
      if (suit === 'D') {
        on = Math.abs(ux) + Math.abs(vy) <= 1;
      } else if (suit === 'H') {
        on = heart(ux * 1.17, 1.22 - ((j + 0.5) / h) * 2.3);
      } else if (suit === 'S') {
        if (j < bodyH) on = heart(ux * 1.3, -1.0 + ((j + 0.5) / bodyH) * 2.22);
        const t0 = bodyH * 0.68;
        if (!on && j >= t0) {
          const t = (j - t0) / (h - t0);
          on = Math.abs(ux) <= 0.09 + 0.6 * t ** 2.2;
        }
      } else {
        const r = 0.4;
        const disc = (cx: number, cy: number) => Math.hypot(ux - cx, vy - cy) <= r;
        on = disc(0, -0.44) || disc(-0.5, 0.14) || disc(0.5, 0.14) || (Math.abs(ux) <= 0.22 && vy > -0.2 && vy < 0.45);
        if (!on && vy > 0.3) {
          const t = (vy - 0.3) / 0.7;
          on = Math.abs(ux) <= 0.11 + 0.52 * t ** 2.4;
        }
      }
      row.push(on);
    }
    rows.push(row);
  }
  return rows;
}

/** Maske aus einem Zeichenraster (# gehört zur Form) */
function gridMask(rows: readonly string[]): boolean[][] {
  return rows.map((r) => [...r].map((c) => c === '#'));
}

/** Maske auf eine andere Größe abtasten (nächster Nachbar) */
function resampleMask(mask: boolean[][], w: number, h: number): boolean[][] {
  const sh = mask.length, sw = mask[0].length;
  return Array.from({ length: h }, (_, j) => Array.from({ length: w }, (_, i) => mask[Math.floor(((j + 0.5) * sh) / h)][Math.floor(((i + 0.5) * sw) / w)]));
}

/** Form mit Licht (oben links) und Schatten (unten rechts) an den Rändern, optional Kontur und Glanz */
function shadedShape(mask: boolean[][], main: number, light: number, dark: number, opts: { outline?: number; glint?: readonly [number, number]; thick?: boolean } = {}): PixelBuffer {
  const h = mask.length, w = mask[0].length;
  const at = (x: number, y: number) => !!mask[y]?.[x];
  const pad = opts.outline !== undefined ? 1 : 0;
  const buf = new PixelBuffer(w + pad * 2, h + pad * 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      let c = main;
      if (!at(x + 1, y) || !at(x, y + 1) || (opts.thick && (!at(x + 2, y + 1) || !at(x + 1, y + 2)))) c = dark;
      else if (!at(x - 1, y) || !at(x, y - 1) || (opts.thick && (!at(x - 2, y - 1) || !at(x - 1, y - 2)))) c = light;
      buf.set(x + pad, y + pad, c);
    }
  }
  if (opts.glint) {
    const gx = Math.round(w * opts.glint[0]), gy = Math.round(h * opts.glint[1]);
    const n = Math.max(1, Math.round(w / 12));
    for (let k = 0; k < n * 2; k++) if (at(gx + k, gy - (k >> 1))) buf.set(gx + k + pad, gy - (k >> 1) + pad, WHITE);
    for (let k = 0; k < n; k++) if (at(gx - 1, gy + 2 + k)) buf.set(gx - 1 + pad, gy + 2 + k + pad, mixColor(light, WHITE, 0.6));
  }
  if (opts.outline !== undefined) {
    const base = new PixelBuffer(buf.w, buf.h);
    base.blitBuffer(buf, 0, 0);
    for (let y = 0; y < buf.h; y++) {
      for (let x = 0; x < buf.w; x++) {
        if (base.solid(x, y)) continue;
        if (base.solid(x - 1, y) || base.solid(x + 1, y) || base.solid(x, y - 1) || base.solid(x, y + 1)) buf.set(x, y, opts.outline);
      }
    }
  }
  return buf;
}

/** Form mit Farbverlauf (hell oben links, dunkel unten rechts) in Rasterstufen, Kontur und Glanz */
function gradientShape(mask: boolean[][], main: number, light: number, dark: number, outline: number, glint: readonly [number, number]): PixelBuffer {
  const h = mask.length, w = mask[0].length;
  const buf = new PixelBuffer(w + 2, h + 2);
  const deep = mixColor(dark, BLACK, 0.2);
  const tones = [mixColor(light, WHITE, 0.25), light, main, dark, deep];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y][x]) continue;
      const t = (x / w) * 0.55 + (y / h) * 0.45; // 0 bis 1 entlang der Diagonale
      const v = t * 3.2 - 0.1 + (BAYER4[y & 3][x & 3] / 16 - 0.5) * 0.9;
      buf.set(x + 1, y + 1, tones[Math.max(0, Math.min(4, Math.floor(v + 0.5)))]);
    }
  }
  // Glanz: kurzer heller Bogen oben links und ein Punkt
  const gx = Math.round(w * glint[0]), gy = Math.round(h * glint[1]);
  for (let k = 0; k < 7; k++) if (mask[gy + (k >> 1)]?.[gx - (k >> 1) + 3]) buf.set(gx - (k >> 1) + 3 + 1, gy + (k >> 1) + 1, WHITE);
  for (let k = 0; k < 4; k++) if (mask[gy + 3 + k]?.[gx - 2]) buf.set(gx - 2 + 1, gy + 3 + k + 1, WHITE);
  const base = new PixelBuffer(buf.w, buf.h);
  base.blitBuffer(buf, 0, 0);
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      if (base.solid(x, y)) continue;
      if (base.solid(x - 1, y) || base.solid(x + 1, y) || base.solid(x, y - 1) || base.solid(x, y + 1)) buf.set(x, y, outline);
    }
  }
  return buf;
}

function suitTones(s: SuitColors) {
  return { main: s.main, light: s.light, dark: s.dark };
}

/** Index oben links (Rang und kleines Farbsymbol) in einen eigenen Puffer */
function drawIndex(rank: Rank, suit: Suit, s: SuitColors): PixelBuffer {
  const b = new PixelBuffer(CARD_PX_W, CARD_PX_H);
  const m = glyphMap(s.main);
  const label = indexLabel(rank);
  if (label === '10') {
    b.blit(INDEX_FONT['1t'], INDEX_POS.rankX10, INDEX_POS.rankY, m);
    b.blit(INDEX_FONT['0'], INDEX_POS.rankX10 + 5, INDEX_POS.rankY, m);
  } else {
    b.blit(INDEX_FONT[label], INDEX_POS.rankX, INDEX_POS.rankY, m);
  }
  const t = suitTones(s);
  b.blitBuffer(shadedShape(gridMask(mirrorRows(SUIT_SMALL[suit])), t.main, t.light, t.dark, { thick: true }), INDEX_POS.suitX, INDEX_POS.suitY);
  return b;
}

function drawPips(buf: PixelBuffer, rank: Rank, suit: Suit, s: SuitColors) {
  const t = suitTones(s);
  const mask = gridMask(mirrorEven(SUIT_PIP[suit]));
  const up = shadedShape(mask, t.main, t.light, t.dark, { glint: [0.3, 0.3], outline: t.dark });
  const down = up.rotated180();
  for (const [col, row] of PIP_LAYOUT[rank] ?? []) {
    buf.blitBuffer(row > PIP_ROW.mid ? down : up, PIP_COL[col] - 1, row - 1);
  }
}

// ───────────────────────────────────────────── Ass und Kristall

/** Ass: großes Symbol mit Verlauf, Scheibe, Punktringe, vier Funken, Ecken und feines Muster */
function drawAce(buf: PixelBuffer, suit: Suit, s: SuitColors) {
  const cx = CARD_PX_W >> 1, cy = CARD_PX_H >> 1;
  const soft = mixColor(CARD_BASE.face, s.main, 0.3);
  const softer = mixColor(CARD_BASE.face, s.main, 0.13);
  const x0 = BACK.inset, y0 = BACK.inset + 4;
  for (let y = y0; y < CARD_PX_H - y0; y++) for (let x = x0 + 8; x < CARD_PX_W - x0 - 8; x++) if ((x + y) % 10 === 0 && (x - y + 200) % 10 === 0) buf.set(x, y, softer);
  const R = ACE.discRadius;
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d <= R - 3) buf.set(cx + x, cy + y, softer);
      else if (d <= R - 1) buf.set(cx + x, cy + y, soft);
    }
  }
  // Rauten am Rand der Scheibe und äußerer Punktring
  for (let a = 0; a < 96; a++) {
    const ang = (a / 96) * Math.PI * 2;
    const px = cx + Math.round(Math.cos(ang) * ACE.ringRadius), py = cy + Math.round(Math.sin(ang) * ACE.ringRadius);
    buf.set(px, py, a % 3 === 0 ? s.main : soft);
  }
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 + Math.PI / 8;
    const px = cx + Math.round(Math.cos(ang) * (ACE.discRadius + 1)), py = cy + Math.round(Math.sin(ang) * (ACE.discRadius + 1));
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) buf.set(px + dx, py + dy, a % 2 === 0 ? s.light : soft);
  }
  const D = ACE.sparkleDist;
  const sparkle = (sx: number, sy: number, r: number) => {
    for (let k = -r; k <= r; k++) {
      buf.set(sx + k, sy, k === 0 ? s.main : s.light);
      buf.set(sx, sy + k, k === 0 ? s.main : s.light);
    }
    buf.set(sx, sy, WHITE);
  };
  sparkle(cx, cy - D, 3);
  sparkle(cx, cy + D, 3);
  sparkle(cx - D + 8, cy, 3);
  sparkle(cx + D - 8, cy, 3);
  sparkle(cx + 24, cy - 38, 2);
  sparkle(cx - 24, cy + 38, 2);
  const shape = gradientShape(suitMask(suit, ACE.w, ACE.h), s.main, s.light, s.dark, mixColor(s.dark, BLACK, 0.35), ACE.glint[suit]);
  buf.blitBuffer(shape, cx - (shape.w >> 1), cy - (shape.h >> 1));
}

/** Kristall für Karten ohne Rang */
function drawGem(buf: PixelBuffer, color: number) {
  const mask = suitMask('D', ACE.w - 4, ACE.h + 6);
  const shape = gradientShape(mask, color, mixColor(color, WHITE, 0.45), mixColor(color, BLACK, 0.25), mixColor(color, BLACK, 0.6), [0.34, 0.28]);
  const x = (CARD_PX_W - shape.w) >> 1, y = (CARD_PX_H - shape.h) >> 1;
  buf.blitBuffer(shape, x, y);
  const mid = x + (shape.w >> 1);
  for (let j = 6; j < shape.h - 6; j++) buf.set(mid, y + j, mixColor(color, WHITE, 0.5));
  for (let i = 8; i < shape.w - 8; i++) buf.set(x + i, y + (shape.h >> 1), mixColor(color, BLACK, 0.3));
}

// ───────────────────────────────────────────── Bildkarten

export function courtColors(s: SuitColors): ColorMap {
  return {
    a: s.main, A: s.light, b: s.dark,
    c: s.sec, C: s.secLight, e: s.secDark,
    t: s.trim, T: s.trimLight, u: s.trimDark,
    g: s.gem,
    s: CARD_BASE.skin, S: CARD_BASE.skinShade, p: mixColor(CARD_BASE.skin, WHITE, 0.4),
    w: CARD_BASE.white, W: CARD_BASE.whiteShade,
    h: s.hair, H: s.hairDark,
    k: CARD_BASE.ink, m: CARD_BASE.mouth, M: mixColor(CARD_BASE.mouth, BLACK, 0.35),
    G: CARD_BASE.steel, F: CARD_BASE.steelDark, v: CARD_BASE.glass, r: 0xe0384a, y: CARD_BASE.glow, o: CARD_BASE.flame,
    d: 0xf2c14a, D: 0xb07a1e, n: CARD_BASE.wood, N: CARD_BASE.woodDark, l: CARD_BASE.leaf, L: CARD_BASE.leafDark,
  };
}

/** Stofftexturen auf dem feinen Raster: Falten, Brokat, Goldglanz, Hermelin */
function texturize(grid: string[][], opts: { ermine: boolean }) {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (c === 'a') {
        const f = (x + (y >> 3)) % 9;
        if (f === 0) grid[y][x] = 'b';
        else if (f === 1) grid[y][x] = 'A';
        else if ((x * 5 + y * 3) % 13 === 0) grid[y][x] = 'A';
      } else if (c === 'c') {
        if ((x + y) % 6 === 0 && (x - y + 600) % 6 === 0) grid[y][x] = 'C';
        else if ((x + y + 3) % 6 === 0 && (x - y + 603) % 6 === 0) grid[y][x] = 'e';
      } else if (c === 't') {
        if ((x * 2 + y * 3) % 7 === 0) grid[y][x] = 'T';
        else if ((x * 3 + y) % 11 === 0) grid[y][x] = 'u';
      } else if (c === 'l') {
        if ((x + y) % 5 === 0) grid[y][x] = 'L';
      } else if (c === 'w' && opts.ermine) {
        if ((x % 8 === 3 && y % 8 === 2) || (x % 8 === 3 && y % 8 === 3) || (x % 8 === 7 && y % 8 === 6)) grid[y][x] = 'k';
        else if ((x + y) % 7 === 0) grid[y][x] = 'W';
      }
    }
  }
}

const toCells = (rows: readonly string[]) => rows.map((r) => [...r]);

/** Feines Raster einer Figur (38 mal 46): Körper, Brustzeichen, Kopf mit Hut und Gesicht */
export function figureCells(id: CourtId, s: SuitColors): string[][] {
  const f = FIGURES[id];
  const W = FIGURE.w * 2, H = FIGURE.h * 2;
  const canvas: string[][] = Array.from({ length: H }, () => Array(W).fill('.'));
  // Körper
  const body = toCells(scale2x(mirrorRows(f.body)));
  texturize(body, { ermine: true });
  const by = FIGURE.bodyY * 2;
  body.forEach((r, j) => r.forEach((c, i) => { if (c !== '.' && canvas[by + j]) canvas[by + j][i] = c; }));
  // Brustzeichen der Farbe, mittig auf dem Körper
  const emb = resampleMask(gridMask(mirrorEven(SUIT_PIP[id[0] as Suit])), 12, 12);
  const ex = (W >> 1) - 6, ey = by + 6;
  const outlineAt = (x: number, y: number) => !!emb[y - ey]?.[x - ex];
  for (let y = ey - 1; y <= ey + 12; y++) for (let x = ex - 1; x <= ex + 12; x++) {
    if (!outlineAt(x, y) && (outlineAt(x - 1, y) || outlineAt(x + 1, y) || outlineAt(x, y - 1) || outlineAt(x, y + 1))) canvas[y][x] = 'k';
  }
  emb.forEach((row, j) => row.forEach((on, i) => { if (on) canvas[ey + j][ex + i] = f.emblem; }));
  // Kopf: Hut vergrößert, Gesicht in feiner Auflösung
  const head: string[][] = Array.from({ length: FIGURE.headH * 2 }, () => Array(FIGURE.headW * 2).fill('.'));
  const face = mirrorEven(faceHalfRows(f.face));
  const faceY = head.length - face.length;
  const hat = toCells(scale2x(mirrorRows(f.hat)));
  texturize(hat, { ermine: false });
  hat.forEach((r, j) => r.forEach((c, i) => { const y = faceY - hat.length + j; if (c !== '.' && y >= 0) head[y][i] = c; }));
  face.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') head[faceY + j][i] = c; }));
  for (let y = 0; y < head.length; y++) for (let x = 0; x < head[y].length; x++) {
    if (head[y][x] === 'h' && (x * 3 + y) % 8 === 0) head[y][x] = 'H';
    else if (head[y][x] === 'w' && y < faceY + 8 ? false : head[y][x] === 'w' && (x * 3 + y) % 9 === 0) head[y][x] = 'W';
  }
  // Schatten der Haut unter dem Hut
  for (let y = 1; y < head.length; y++) for (let x = 0; x < head[y].length; x++) {
    const up = head[y - 1][x];
    if (head[y][x] === 's' && up !== 's' && up !== '.' && up !== 'p' && up !== 'S') head[y][x] = 'S';
  }
  const hx = (W - head[0].length) >> 1;
  head.forEach((r, j) => r.forEach((c, i) => { if (c !== '.') canvas[j][hx + i] = c; }));
  void s;
  return canvas;
}

/** Kontur und Kantenlicht: die Hälfte der Pixel am Rand wird heller oder dunkler */
function edgeShade(buf: PixelBuffer, ink: number) {
  const src = new PixelBuffer(buf.w, buf.h);
  src.blitBuffer(buf, 0, 0);
  const empty = (x: number, y: number) => !src.solid(x, y) || src.get(x, y) === ink;
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      const c = src.get(x, y);
      if (c === null || c === ink) continue;
      if (empty(x - 1, y) || empty(x, y - 1)) buf.set(x, y, mixColor(c, WHITE, 0.2));
      else if (empty(x + 1, y) || empty(x, y + 1)) buf.set(x, y, mixColor(c, BLACK, 0.22));
    }
  }
}

function figureBuffer(id: CourtId, s: SuitColors): PixelBuffer {
  const tone = SKIN_TONES[FIGURES[id].skin];
  const map: ColorMap = { ...courtColors(s), s: tone.skin, S: tone.shade, p: mixColor(tone.skin, WHITE, 0.4) };
  const cells = figureCells(id, s).map((r) => r.join(''));
  const buf = gridBuffer(cells, map, CARD_BASE.ink, true);
  edgeShade(buf, CARD_BASE.ink);
  return buf;
}

/** Zufallszahlen für die Hintergrundmuster, fest pro Farbe */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Muster hinter den Figuren (obere Hälfte, wird für die untere gedreht) */
function drawPattern(half: PixelBuffer, kind: 'stars' | 'bubbles' | 'diamonds' | 'leaves', color: number, light: number) {
  const w = half.w, h = half.h;
  const rnd = lcg(kind.length * 7919 + 13);
  if (kind === 'stars') {
    for (let k = 0; k < 26; k++) half.set(Math.floor(rnd() * w), Math.floor(rnd() * h), color);
    for (let k = 0; k < 7; k++) {
      const x = 3 + Math.floor(rnd() * (w - 6)), y = 3 + Math.floor(rnd() * (h - 6));
      half.set(x, y, light);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) half.set(x + dx, y + dy, color);
    }
  } else if (kind === 'bubbles') {
    for (let k = 0; k < 11; k++) {
      const x = 2 + Math.floor(rnd() * (w - 6)), y = 2 + Math.floor(rnd() * (h - 6));
      for (const [dx, dy] of [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [1, 3], [2, 3]]) half.set(x + dx, y + dy, color);
      half.set(x + 1, y + 1, light);
    }
  } else if (kind === 'diamonds') {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if ((x + y) % 10 === 0 && (x - y + 100) % 10 === 0) { half.set(x, y, color); half.set(x + 1, y, light); half.set(x, y + 1, light); }
    }
  } else {
    for (let k = 0; k < 15; k++) {
      const x = 3 + Math.floor(rnd() * (w - 8)), y = 3 + Math.floor(rnd() * (h - 8));
      for (let d = 0; d < 3; d++) { half.set(x + d, y - d, color); half.set(x - d, y - d, color); }
      half.set(x, y, light);
    }
  }
}

/** Eine Figurenhälfte (44 mal 49) mit Muster, Heiligenschein, Zierrahmen, Figur und Gegenständen */
function courtHalf(court: Court, suit: Suit, s: SuitColors): PixelBuffer {
  const half = new PixelBuffer(COURT_HALF.w, COURT_HALF.h);
  half.fillRect(0, 0, COURT_HALF.w, COURT_HALF.h, s.tint);
  drawPattern(half, COURT_PATTERN[suit], mixColor(s.tint, s.main, 0.22), mixColor(s.tint, WHITE, 0.6));
  const id = `${suit}${court}` as CourtId;
  // Heiligenschein: getönte Scheibe mit zwei Ringen hinter dem Kopf
  const hx = COURT_HALF.w >> 1, hy = 19;
  const disc = mixColor(s.tint, s.secLight, 0.5), ring = mixColor(s.tint, s.sec, 0.55), ring2 = mixColor(s.tint, s.trim, 0.55);
  for (let y = -21; y <= 21; y++) {
    for (let x = -21; x <= 21; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d <= 16.5) half.set(hx + x, hy + y, (x + y) % 6 === 0 && d > 11 ? ring2 : disc);
      else if (d <= 18) half.set(hx + x, hy + y, ring);
      else if (d <= 19.2 && (x + y) % 3 === 0) half.set(hx + x, hy + y, ring2);
    }
  }
  // Zierrahmen in Gold mit Edelstein in den Ecken
  half.strokeRect(0, 0, COURT_HALF.w, COURT_HALF.h + 1, s.trim);
  half.strokeRect(1, 1, COURT_HALF.w - 2, COURT_HALF.h, mixColor(s.tint, s.trim, 0.45));
  for (const [x, y] of [[1, 1], [COURT_HALF.w - 2, 1]]) { half.set(x, y, s.gem); half.set(x + (x > 5 ? -1 : 1), y, s.trimLight); }
  const fig = figureBuffer(id, s);
  half.blitBuffer(fig, COURT_FIGURE_OFFSET.x, COURT_FIGURE_OFFSET.y);
  const map = courtColors(s);
  for (const held of FIGURES[id].held) {
    const item = gridBuffer(scale2x(held.rows), map, CARD_BASE.ink);
    edgeShade(item, CARD_BASE.ink);
    half.blitBuffer(item, held.x * 2 - 1 + COURT_FIGURE_OFFSET.x, held.y * 2 - 1 + COURT_FIGURE_OFFSET.y);
  }
  return half;
}

function drawCourt(buf: PixelBuffer, court: Court, suit: Suit, s: SuitColors) {
  const P = COURT_PANEL;
  buf.fillRect(P.x, P.y, P.w, P.h, s.tint);
  const half = courtHalf(court, suit, s);
  buf.blitBuffer(half, COURT_HALF.x, COURT_HALF.y);
  // untere Hälfte: um 180 Grad gedreht, zwei Zeilen Mittellinie dazwischen
  buf.blitBuffer(half.rotated180(), COURT_HALF.x, COURT_HALF.y + COURT_HALF.h + 2);
  const my = COURT_HALF.y + COURT_HALF.h;
  buf.fillRect(P.x + 1, my, P.w - 2, 2, s.dark);
  const mid = P.x + (P.w >> 1);
  buf.fillRect(mid - 4, my, 8, 2, s.trim);
  buf.set(mid - 1, my, s.gem); buf.set(mid, my, s.gem); buf.set(mid - 1, my + 1, s.gem); buf.set(mid, my + 1, s.gem);
  buf.strokeRect(P.x, P.y, P.w, P.h, s.dark);
}

// ───────────────────────────────────────────── Vorder und Rückseite

/** Rendert die Vorderseite einer Karte. */
export function renderCard(suit: Suit, rank: Rank, paletteId: CardPaletteId, opts: CardRenderOpts = {}): PixelBuffer {
  const s = CARD_PALETTES[paletteId].suits[suit];
  const buf = new PixelBuffer(CARD_PX_W, CARD_PX_H);
  drawBase(buf, opts.face ?? CARD_BASE.face);
  if (opts.rankless) {
    drawGem(buf, CARD_BASE.rankless);
    return buf;
  }
  const court = COURT_BY_RANK[rank];
  if (court) drawCourt(buf, court, suit, s);
  else if (rank === 14) drawAce(buf, suit, s);
  else drawPips(buf, rank, suit, s);
  const idx = drawIndex(rank, suit, s);
  buf.blitBuffer(idx, 0, 0);
  buf.blitBuffer(idx.rotated180(), 0, 0);
  return buf;
}

/** Kartenrücken: Deckfarbe, feines Rautengitter, doppelter Rand, Medaillon mit Stern und Ecksternen */
export function renderCardBack(color: number): PixelBuffer {
  const W = CARD_PX_W, H = CARD_PX_H;
  const buf = new PixelBuffer(W, H);
  drawBase(buf, CARD_BASE.face);
  const dark = mixColor(color, BLACK, 0.38);
  const mid = mixColor(color, BLACK, 0.18);
  const light = mixColor(color, WHITE, 0.38);
  const lighter = mixColor(color, WHITE, 0.62);
  const i0 = BACK.inset, w = W - i0 * 2, h = H - i0 * 2;
  buf.fillRect(i0, i0, w, h, color);
  const L = BACK.lattice;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d1 = (x + y) % L, d2 = (x - y + L * 100) % L;
      if (d1 === 0 || d2 === 0) buf.set(i0 + x, i0 + y, mid);
      else if (d1 === L / 2 && d2 === L / 2) buf.set(i0 + x, i0 + y, light);
      else if ((d1 === L / 2 - 1 || d1 === L / 2 + 1) && d2 === L / 2) buf.set(i0 + x, i0 + y, mixColor(color, WHITE, 0.15));
    }
  }
  buf.strokeRect(i0, i0, w, h, light);
  buf.strokeRect(i0 + 1, i0 + 1, w - 2, h - 2, dark);
  buf.strokeRect(i0 + 3, i0 + 3, w - 6, h - 6, mid);
  // Ecksterne
  for (const [sx, sy] of [[i0 + 7, i0 + 7], [W - i0 - 8, i0 + 7], [i0 + 7, H - i0 - 8], [W - i0 - 8, H - i0 - 8]]) {
    buf.set(sx, sy, lighter);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]]) buf.set(sx + dx, sy + dy, light);
  }
  // Medaillon
  const cx = W >> 1, cy = H >> 1, R = BACK.medallion;
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      const r = Math.hypot(x + 0.5, y + 0.5);
      if (r <= R - 1) buf.set(cx + x, cy + y, color);
      if (r <= R - 1 && r > R - 3) buf.set(cx + x, cy + y, light);
      if (r <= R - 5 && r > R - 6.5) buf.set(cx + x, cy + y, dark);
      if (r <= R - 8 && r > R - 9.2 && (x + y) % 2 === 0) buf.set(cx + x, cy + y, lighter);
      if (r <= R - 10 && (Math.floor(x / 3) + Math.floor(y / 3)) % 2 === 0) buf.set(cx + x, cy + y, mid);
    }
  }
  // Stern mit sechzehn Zacken
  for (let a = 0; a < 16; a++) {
    const ang = (a * Math.PI) / 8;
    const len = a % 4 === 0 ? 14 : a % 2 === 0 ? 10 : 6.5;
    for (let t = 0; t <= len; t += 0.5) buf.set(cx + Math.round(Math.cos(ang) * t - 0.5), cy + Math.round(Math.sin(ang) * t - 0.5), a % 4 === 0 ? WHITE : lighter);
  }
  for (const [dx, dy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) buf.set(cx + dx, cy + dy, mixColor(color, WHITE, 0.8));
  return buf;
}
