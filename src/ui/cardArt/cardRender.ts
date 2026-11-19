import type { Rank, Suit } from '../../core/types';
import { CARD_BASE, CARD_PALETTES, type CardPaletteId, type SuitColors } from '../../data/cardArt/cardPalettes';
import { ACE_GLINT, ACE_ORNAMENT, ACE_SHAPES, CARD_PX_H, CARD_PX_W, COURT_HALF, COURT_PANEL, INDEX_FONT, PIP_COL, PIP_LAYOUT, PIP_ROW, PIP_SIZE, SUIT_PIP, SUIT_SMALL } from '../../data/cardArt/cardGlyphs';
import { COURT_PATTERN, FIGURE, FIGURES, SKIN_TONES, type Court, type CourtId } from '../../data/cardArt/courtSprites';
import { PixelBuffer, gridBuffer, mirrorRows, mixColor, type ColorMap } from './pixelBuffer';

// Zeichnet Kartenvorderseiten und Rückseiten als Pixel Puffer (ohne DOM, testbar).

export interface CardRenderOpts {
  /** Grundfarbe der Fläche (Enhancement), der weiße Rand bleibt */
  face?: number;
  /** Karte ohne Rang: statt Index und Pips ein Kristall */
  rankless?: boolean;
}

const COURT_BY_RANK: Partial<Record<Rank, Court>> = { 11: 'J', 12: 'Q', 13: 'K' };

/** Karten Grundform mit abgerundeten Ecken, Kontur und weißem Rand */
function drawBase(buf: PixelBuffer, face: number) {
  const W = CARD_PX_W, H = CARD_PX_H;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = Math.min(x, W - 1 - x);
      const dy = Math.min(y, H - 1 - y);
      if (dx + dy <= 1) continue;
      const edge = dx === 0 || dy === 0 || (dx === 1 && dy === 1);
      if (edge) buf.set(x, y, CARD_BASE.outline);
      else if (dx === 1 || dy === 1) buf.set(x, y, CARD_BASE.face);
      else buf.set(x, y, face);
    }
  }
}

const glyphMap = (color: number): ColorMap => ({ '#': color });

function indexLabel(rank: Rank): string {
  return rank === 14 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank);
}

/** Index oben links (Rang und kleines Farbsymbol) in einen eigenen Puffer */
function drawIndex(rank: Rank, suit: Suit, color: number): PixelBuffer {
  const b = new PixelBuffer(CARD_PX_W, CARD_PX_H);
  const m = glyphMap(color);
  const label = indexLabel(rank);
  if (label === '10') {
    b.blit(INDEX_FONT['1t'], 3, 3, m);
    b.blit(INDEX_FONT['0'], 6, 3, m);
  } else {
    b.blit(INDEX_FONT[label], 4, 3, m);
  }
  b.blit(SUIT_SMALL[suit], 3, 9, m);
  return b;
}

function pipBuffers(suit: Suit, color: number): { up: PixelBuffer; down: PixelBuffer } {
  const up = gridBuffer(SUIT_PIP[suit], glyphMap(color));
  return { up, down: up.rotated180() };
}

function drawPips(buf: PixelBuffer, rank: Rank, suit: Suit, color: number) {
  const { up, down } = pipBuffers(suit, color);
  for (const [col, row] of PIP_LAYOUT[rank] ?? []) {
    const cx = PIP_COL[col];
    const r = (PIP_SIZE - 1) / 2;
    buf.blitBuffer(row > PIP_ROW.mid ? down : up, cx - r, row - r);
  }
}

/** Form des Asses aus halben Zeilen als Maske (true = Pixel gehört zur Form) */
function aceMask(suit: Suit): boolean[][] {
  return mirrorRows(ACE_SHAPES[suit]).map((r) => [...r].map((c) => c === '#'));
}

/** Form mit Licht (oben links), Schatten (unten rechts), Glanzpixeln und dunkler Kontur */
function shadedShape(mask: boolean[][], main: number, light: number, dark: number, outline: number, glint?: readonly [number, number]): PixelBuffer {
  const h = mask.length, w = mask[0].length;
  const at = (x: number, y: number) => !!mask[y]?.[x];
  const buf = new PixelBuffer(w + 2, h + 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      let c = main;
      if (!at(x + 1, y) || !at(x, y + 1) || !at(x + 1, y + 1)) c = dark;
      else if (!at(x - 1, y) || !at(x, y - 1) || !at(x - 1, y - 1)) c = light;
      else if (!at(x - 2, y - 1) && !at(x - 2, y)) c = light;
      buf.set(x + 1, y + 1, c);
    }
  }
  if (glint) {
    const [gx, gy] = glint;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) if (at(gx + dx, gy + dy)) buf.set(gx + dx + 1, gy + dy + 1, 0xffffff);
    if (at(gx + 3, gy + 1)) buf.set(gx + 4, gy + 2, light);
  }
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

/** Ass: großes verziertes Symbol in der Mitte, getönte Scheibe, Punktringe, vier Funken, Eckverzierung und feines Muster */
function drawAce(buf: PixelBuffer, suit: Suit, s: SuitColors) {
  const cx = CARD_PX_W >> 1, cy = CARD_PX_H >> 1;
  const soft = mixColor(CARD_BASE.face, s.main, 0.3);
  const softer = mixColor(CARD_BASE.face, s.main, 0.13);
  // feines Rautenmuster
  for (let y = 6; y < CARD_PX_H - 6; y++) for (let x = 11; x < CARD_PX_W - 11; x++) if ((x + y) % 8 === 0 && (x - y + 80) % 8 === 0) buf.set(x, y, softer);
  // getönte Scheibe mit hellem Rand
  const R = ACE_ORNAMENT.ringRadius;
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      const d = Math.hypot(x, y);
      if (d <= R - 2) buf.set(cx + x, cy + y, softer);
      else if (d <= R - 1) buf.set(cx + x, cy + y, soft);
    }
  }
  // äußerer Punktring
  for (let a = 0; a < 64; a++) {
    const ang = (a / 64) * Math.PI * 2;
    buf.set(cx + Math.round(Math.cos(ang) * (R + 2)), cy + Math.round(Math.sin(ang) * (R + 2)), a % 2 === 0 ? soft : s.light);
  }
  // Funken oben, unten, links und rechts, kleine Rauten in den Ecken des Feldes
  const D = ACE_ORNAMENT.sparkleDist;
  for (const [sx, sy] of [[cx, cy - D], [cx, cy + D], [cx - D + 4, cy], [cx + D - 4, cy]]) {
    buf.set(sx, sy, s.main);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) buf.set(sx + dx, sy + dy, s.light);
  }
  for (const [sx, sy] of [[cx + 12, cy - 19], [cx - 12, cy + 19]]) {
    buf.set(sx, sy, s.main);
    buf.set(sx - 1, sy, soft); buf.set(sx + 1, sy, soft); buf.set(sx, sy - 1, soft); buf.set(sx, sy + 1, soft);
  }
  const shape = shadedShape(aceMask(suit), s.main, s.light, s.dark, s.dark, ACE_GLINT[suit]);
  buf.blitBuffer(shape, cx - (shape.w >> 1), cy - (shape.h >> 1) + (suit === 'H' ? 1 : 0));
}

/** Kristall für Karten ohne Rang */
function drawGem(buf: PixelBuffer, color: number) {
  const mask = aceMask('D');
  const shape = shadedShape(mask, color, mixColor(color, 0xffffff, 0.5), mixColor(color, 0x000000, 0.3), mixColor(color, 0x000000, 0.55), [6, 5]);
  buf.blitBuffer(shape, (CARD_PX_W - shape.w) >> 1, (CARD_PX_H - shape.h) >> 1);
}

/** Muster hinter den Figuren (obere Hälfte, wird für die untere gedreht) */
function drawPattern(half: PixelBuffer, kind: 'stars' | 'bubbles' | 'diamonds' | 'leaves', color: number) {
  const w = half.w, h = half.h;
  if (kind === 'stars') {
    for (const [x, y] of [[2, 3], [18, 2], [5, 12], [17, 10], [1, 18], [14, 20], [19, 16], [10, 4], [3, 8], [12, 15]]) half.set(x, y, color);
    for (const [x, y] of [[4, 6], [16, 5], [3, 20]]) {
      half.set(x, y, color); half.set(x - 1, y, color); half.set(x + 1, y, color); half.set(x, y - 1, color); half.set(x, y + 1, color);
    }
  } else if (kind === 'bubbles') {
    for (const [x, y] of [[2, 2], [16, 4], [3, 11], [17, 15], [12, 1], [8, 20], [1, 17]]) {
      half.set(x, y, color); half.set(x + 1, y, color); half.set(x, y + 1, color); half.set(x + 1, y + 1, color);
    }
  } else if (kind === 'diamonds') {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if ((x + y) % 6 === 0 && (x - y + 60) % 6 === 0) half.set(x, y, color);
  } else {
    for (const [x, y] of [[2, 3], [16, 2], [4, 13], [17, 11], [2, 19], [13, 20], [9, 5]]) { half.set(x, y, color); half.set(x + 1, y - 1, color); half.set(x - 1, y - 1, color); }
  }
}

export function courtColors(s: SuitColors): ColorMap {
  return {
    a: s.main, A: s.light, b: s.dark,
    c: s.sec, C: s.secLight, e: s.secDark,
    t: s.trim, T: s.trimLight, u: s.trimDark,
    g: s.gem,
    s: CARD_BASE.skin, S: CARD_BASE.skinShade,
    w: CARD_BASE.white, W: CARD_BASE.whiteShade,
    h: s.hair, H: s.hairDark,
    k: CARD_BASE.ink, m: CARD_BASE.mouth,
    G: CARD_BASE.steel, F: CARD_BASE.steelDark, v: CARD_BASE.glass, r: 0xe0384a, y: CARD_BASE.glow, o: CARD_BASE.flame,
    d: 0xf2c14a, D: 0xb07a1e, n: CARD_BASE.wood, N: CARD_BASE.woodDark, l: CARD_BASE.leaf, L: CARD_BASE.leafDark,
  };
}

/** Raster einer Figur (19 mal 23): erst der Körper, dann der Kopf darüber */
export function figureGrid(id: CourtId): string[] {
  const f = FIGURES[id];
  const rows: string[][] = Array.from({ length: FIGURE.h }, () => Array(FIGURE.w).fill('.'));
  const body = mirrorRows(f.body);
  body.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') rows[FIGURE.bodyY + j][i] = c; }));
  const head = mirrorRows(f.head);
  const pad = FIGURE.headH - head.length;
  const x0 = (FIGURE.w - FIGURE.headW) >> 1;
  head.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') rows[pad + j][x0 + i] = c; }));
  return rows.map((r) => r.join(''));
}

/** Eine Figurenhälfte (21 mal 24) mit Hintergrundmuster, Figur und gehaltenen Gegenständen */
function courtHalf(court: Court, suit: Suit, s: SuitColors): PixelBuffer {
  const half = new PixelBuffer(COURT_HALF.w, COURT_HALF.h);
  half.fillRect(0, 0, COURT_HALF.w, COURT_HALF.h, s.tint);
  drawPattern(half, COURT_PATTERN[suit], mixColor(s.tint, s.main, 0.22));
  // schmaler Zierrahmen in Gold, die Figur überdeckt ihn teilweise
  half.strokeRect(0, 0, COURT_HALF.w, COURT_HALF.h + 1, s.trim);
  const id = `${suit}${court}` as CourtId;
  const tone = SKIN_TONES[FIGURES[id].skin];
  const map: ColorMap = { ...courtColors(s), s: tone.skin, S: tone.shade };
  // Heiligenschein: getönte Scheibe mit Ring hinter dem Kopf
  const hx = half.w >> 1, hy = 8;
  const disc = mixColor(s.tint, s.secLight, 0.5), ring = mixColor(s.tint, s.sec, 0.55);
  for (let y = -10; y <= 10; y++) {
    for (let x = -10; x <= 10; x++) {
      const d = Math.hypot(x, y);
      if (d <= 8.5) half.set(hx + x, hy + y, disc);
      else if (d <= 9.7) half.set(hx + x, hy + y, ring);
    }
  }
  half.blitBuffer(gridBuffer(figureGrid(id), map, CARD_BASE.ink, true), 0, 0);
  for (const held of FIGURES[id].held) half.blitBuffer(gridBuffer(held.rows, map, CARD_BASE.ink), held.x, held.y);
  return half;
}

function drawCourt(buf: PixelBuffer, court: Court, suit: Suit, s: SuitColors) {
  const P = COURT_PANEL;
  buf.fillRect(P.x, P.y, P.w, P.h, s.tint);
  const half = courtHalf(court, suit, s);
  buf.blitBuffer(half, COURT_HALF.x, COURT_HALF.y);
  // untere Hälfte: um 180 Grad gedreht, die Mittellinie liegt dazwischen
  buf.blitBuffer(half.rotated180(), COURT_HALF.x, P.y + P.h - 1 - COURT_HALF.h);
  buf.fillRect(P.x + 1, P.y + (P.h >> 1), P.w - 2, 1, s.dark);
  buf.strokeRect(P.x, P.y, P.w, P.h, s.dark);
}

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
  else drawPips(buf, rank, suit, s.main);
  const idx = drawIndex(rank, suit, s.main);
  buf.blitBuffer(idx, 0, 0);
  buf.blitBuffer(idx.rotated180(), 0, 0);
  return buf;
}

/** Kartenrücken: Farbe des Decks, Gitter aus Rauten und ein Sternzeichen in der Mitte */
export function renderCardBack(color: number): PixelBuffer {
  const W = CARD_PX_W, H = CARD_PX_H;
  const buf = new PixelBuffer(W, H);
  drawBase(buf, CARD_BASE.face);
  const dark = mixColor(color, 0x000000, 0.35);
  const light = mixColor(color, 0xffffff, 0.35);
  const x0 = 4, y0 = 4, w = W - 8, h = H - 8;
  buf.fillRect(x0, y0, w, h, color);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d1 = (x + y) % 8, d2 = (x - y + 800) % 8;
      if (d1 === 0 || d2 === 0) buf.set(x0 + x, y0 + y, dark);
      else if (d1 === 4 && d2 === 4) buf.set(x0 + x, y0 + y, light);
    }
  }
  buf.strokeRect(x0, y0, w, h, light);
  buf.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2, dark);
  // Medaillon
  const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
  for (let y = -10; y <= 10; y++) {
    for (let x = -10; x <= 10; x++) {
      const r = Math.hypot(x, y);
      if (r <= 9.5) buf.set(cx + x, cy + y, color);
      if (r <= 9.5 && r > 8) buf.set(cx + x, cy + y, light);
      if (r <= 6.5 && r > 5.5) buf.set(cx + x, cy + y, dark);
    }
  }
  // Stern mit acht Zacken
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4;
    const len = a % 2 === 0 ? 5.5 : 3.6;
    for (let t = 0; t <= len; t += 0.5) buf.set(cx + Math.round(Math.cos(ang) * t), cy + Math.round(Math.sin(ang) * t), 0xffffff);
  }
  buf.set(cx, cy, light);
  return buf;
}
