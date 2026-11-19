import { ART_H, ART_W, ART_X, ART_Y, BAND_H, BAND_Y, FRAME_INK, RARITY_FRAME, TILE_CORNER, TILE_H, TILE_W } from '../data/jokerArt';
import type { Sprite } from './jokerKit';
import { Pix, ramp } from './jokerPix';
import { SPRITES } from './jokerSprites';

// Setzt aus Motiv, Rahmen und Namensband die ganze Joker Kachel (52 mal 70 Bildpunkte) zusammen.
// Rein und ohne DOM, die Textur daraus baut jokerArt.ts, Vorschaubilder baut tools/jokersheet.ts.

/** Platzhalter für Jokers ohne eigenes Motiv: Sternkarte mit Fragezeichen. */
const FALLBACK: Sprite = (p) => {
  p.vgrad(0, 0, p.w, p.h, [0x1c2352, 0x3a2a78, 0x1c2352]);
  p.ball(23, 24, 10, ramp(0x8a52d0));
  p.text('?', 21, 21, 0xfff3d1);
};

export function hasJokerSprite(defId: string): boolean {
  return defId in SPRITES;
}

/** Motiv eines Jokers allein (46 mal 52). */
export function jokerArtPix(defId: string): Pix {
  const p = new Pix(ART_W, ART_H).fill(0x14122a);
  (SPRITES[defId] ?? FALLBACK)(p);
  return p;
}

function roundInside(i: number, j: number, w: number, h: number, r: number): boolean {
  const cx = i < r ? r - 0.5 - i : i >= w - r ? i - (w - r) + 0.5 : 0;
  const cy = j < r ? r - 0.5 - j : j >= h - r ? j - (h - r) + 0.5 : 0;
  return cx * cx + cy * cy <= r * r;
}

function roundRect(p: Pix, x: number, y: number, w: number, h: number, r: number, c: number) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (roundInside(i, j, w, h, r)) p.set(x + i, y + j, c);
}

/** Ganze Kachel: Rahmen in Farbe der Seltenheit, Motiv, dunkles Namensband (ohne Text). */
export function jokerTilePix(defId: string, rarity: string): Pix {
  const fr = RARITY_FRAME[rarity] ?? RARITY_FRAME.common;
  const t = new Pix(TILE_W, TILE_H);
  roundRect(t, 0, 0, TILE_W, TILE_H, TILE_CORNER, FRAME_INK);
  roundRect(t, 1, 1, TILE_W - 2, TILE_H - 2, TILE_CORNER - 1, fr.base);
  // Licht oben links, Schatten unten rechts, damit der Rahmen wie ein Wulst wirkt
  for (let i = 5; i < TILE_W - 5; i++) { t.set(i, 1, fr.light); t.set(i, TILE_H - 2, fr.dark); }
  for (let j = 5; j < TILE_H - 5; j++) { t.set(1, j, fr.light); t.set(TILE_W - 2, j, fr.dark); }
  // Namensband
  t.rect(ART_X - 1, BAND_Y, ART_W + 2, BAND_H, FRAME_INK);
  t.rect(ART_X, BAND_Y + 1, ART_W, BAND_H - 2, fr.band);
  t.rect(ART_X, BAND_Y + 1, ART_W, 1, fr.dark);
  t.blit(jokerArtPix(defId), ART_X, ART_Y);
  if (rarity === 'legendary') {
    for (const [x, y] of [[TILE_W / 2, 1], [TILE_W / 2, TILE_H - 2], [1, 30], [TILE_W - 2, 30]]) t.set(x, y, 0xffffff);
  }
  return t;
}
