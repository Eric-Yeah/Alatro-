import type { Rank, Suit } from '../../core/types';
import { CARD_BASE, CARD_PALETTES, type CardPaletteId, type SuitColors } from '../../data/cardArt/cardPalettes';
import { ACE_SHAPES, CARD_PX_H, CARD_PX_W, COURT_HALF, COURT_PANEL, INDEX_FONT, PIP_COL, PIP_LAYOUT, PIP_ROW, SUIT_PIP, SUIT_SMALL } from '../../data/cardArt/cardGlyphs';
import { COURT_HALF_ROWS, COURT_HELD, COURT_PATTERN, type Court } from '../../data/cardArt/courtSprites';
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
    buf.blitBuffer(row > PIP_ROW.mid ? down : up, cx - 3, row - 3);
  }
}

/** Großes Farbsymbol (Ass, Kristall), zentriert auf der Karte */
function drawBig(buf: PixelBuffer, suit: Suit, main: number, light: number, dark: number) {
  const shape = gridBuffer(mirrorRows(ACE_SHAPES[suit]), { '#': main, L: light, D: dark });
  buf.blitBuffer(shape, Math.floor((CARD_PX_W - shape.w) / 2), Math.floor((CARD_PX_H - shape.h) / 2));
}

/** Muster hinter den Figuren (obere Hälfte, wird für die untere gedreht) */
function drawPattern(half: PixelBuffer, kind: 'stars' | 'bubbles' | 'diamonds' | 'leaves', color: number) {
  const spots: [number, number][] = [[2, 3], [13, 2], [5, 9], [15, 8], [1, 15], [11, 17], [14, 14], [8, 5]];
  if (kind === 'stars') {
    for (const [x, y] of spots) half.set(x, y, color);
    for (const [x, y] of [[3, 12], [14, 4]]) {
      half.set(x, y, color); half.set(x - 1, y, color); half.set(x + 1, y, color); half.set(x, y - 1, color); half.set(x, y + 1, color);
    }
  } else if (kind === 'bubbles') {
    for (const [x, y] of [[2, 2], [13, 5], [3, 11], [14, 15], [10, 1]]) {
      half.set(x, y, color); half.set(x + 1, y, color); half.set(x, y + 1, color); half.set(x + 1, y + 1, color);
    }
  } else if (kind === 'diamonds') {
    for (let y = 0; y < half.h; y++) for (let x = 0; x < half.w; x++) if ((x + y) % 6 === 0 && (x - y + 60) % 6 === 0) half.set(x, y, color);
  } else {
    for (const [x, y] of spots) { half.set(x, y, color); half.set(x + 1, y - 1, color); half.set(x - 1, y - 1, color); }
  }
}

export function courtColors(s: SuitColors): ColorMap {
  return {
    a: s.main, A: s.light, b: s.dark,
    t: s.trim, T: s.trimLight, u: s.trimDark,
    g: s.gem,
    s: CARD_BASE.skin, S: CARD_BASE.skinShade,
    w: CARD_BASE.white, W: CARD_BASE.whiteShade,
    h: s.hair, H: s.hairDark,
    k: CARD_BASE.ink, m: CARD_BASE.mouth,
    G: CARD_BASE.steel, c: CARD_BASE.glass, r: 0xe0384a, y: CARD_BASE.glow, o: CARD_BASE.flame,
    d: 0xf2c14a, D: 0xb07a1e, n: CARD_BASE.wood, N: CARD_BASE.woodDark, l: CARD_BASE.leaf, L: CARD_BASE.leafDark,
  };
}

/** Eine Figurenhälfte (17 mal 21) mit Hintergrundmuster, Figur und gehaltenem Gegenstand */
function courtHalf(court: Court, suit: Suit, s: SuitColors): PixelBuffer {
  const half = new PixelBuffer(COURT_HALF.w, COURT_HALF.h);
  half.fillRect(0, 0, COURT_HALF.w, COURT_HALF.h, s.tint);
  drawPattern(half, COURT_PATTERN[suit], mixColor(s.tint, s.main, 0.2));
  const map = courtColors(s);
  const figure = gridBuffer(mirrorRows(COURT_HALF_ROWS[court]), map, CARD_BASE.ink, true);
  half.blitBuffer(figure, 0, 0);
  const held = COURT_HELD[suit][court];
  half.blitBuffer(gridBuffer(held.rows, map, CARD_BASE.ink), held.x, held.y);
  return half;
}

function drawCourt(buf: PixelBuffer, court: Court, suit: Suit, s: SuitColors) {
  const P = COURT_PANEL;
  buf.fillRect(P.x, P.y, P.w, P.h, s.tint);
  const half = courtHalf(court, suit, s);
  buf.blitBuffer(half, COURT_HALF.x, COURT_HALF.y);
  // untere Hälfte: um 180 Grad gedreht, die Mittellinie liegt dazwischen
  buf.blitBuffer(half.rotated180(), COURT_HALF.x, P.y + P.h - 1 - COURT_HALF.h);
  buf.fillRect(P.x + 1, P.y + Math.floor(P.h / 2), P.w - 2, 1, s.dark);
  buf.strokeRect(P.x, P.y, P.w, P.h, s.dark);
}

/** Rendert die Vorderseite einer Karte. */
export function renderCard(suit: Suit, rank: Rank, paletteId: CardPaletteId, opts: CardRenderOpts = {}): PixelBuffer {
  const s = CARD_PALETTES[paletteId].suits[suit];
  const buf = new PixelBuffer(CARD_PX_W, CARD_PX_H);
  drawBase(buf, opts.face ?? CARD_BASE.face);
  if (opts.rankless) {
    const r = CARD_BASE.rankless;
    drawBig(buf, 'D', r, mixColor(r, 0xffffff, 0.5), mixColor(r, 0x000000, 0.3));
    return buf;
  }
  const court = COURT_BY_RANK[rank];
  if (court) drawCourt(buf, court, suit, s);
  else if (rank === 14) drawBig(buf, suit, s.main, s.light, s.dark);
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
