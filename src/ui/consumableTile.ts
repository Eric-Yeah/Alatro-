import { CONSUMABLE_BY_ID, type ConsumableType } from '../data/consumables';
import {
  CART_H, CART_W, CART_X, CART_Y, CBAND_H, CBAND_Y, CFOOT_H, CFOOT_Y, CONSUMABLE_FRAMES, CT_CORNER, CT_H, CT_INK, CT_W, type ConsumableFrame,
} from '../data/consumableArt';
import { Pix, type Color } from './jokerPix';
import { CONSUMABLE_SPRITES } from './consumableSprites';

// Setzt aus Motiv und Zierrahmen die ganze Consumable Karte (52 mal 70 Bildpunkte) zusammen.
// Rein und ohne DOM. Der Rahmen ist je Art anders gestaltet (Farbwelt und Eckzeichen), das Motiv ist je Karte
// eine eigene Zeichnung. Der Name steht als Text im Titelband (ConsumableView).

export function hasConsumableSprite(defId: string): boolean {
  return defId in CONSUMABLE_SPRITES;
}

/** Motiv einer Karte allein (40 mal 40). */
export function consumableArtPix(defId: string): Pix {
  const p = new Pix(CART_W, CART_H).fill(0x14122a);
  const fn = CONSUMABLE_SPRITES[defId];
  if (fn) fn(p);
  else {
    p.vgrad(0, 0, p.w, p.h, [0x1c2352, 0x3a2a78, 0x1c2352]);
    p.text('?', 19, 17, 0xfff3d1);
  }
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

/** Kleine Eckzeichen (3 mal 3) je Art: Stern, Zahnrad, Mondsichel. */
function cornerMark(p: Pix, type: ConsumableType, cx: number, cy: number, c: Color, hi: Color) {
  if (type === 'sternbild') {
    p.set(cx, cy - 1, c); p.set(cx - 1, cy, c); p.set(cx + 1, cy, c); p.set(cx, cy + 1, c); p.set(cx, cy, hi);
  } else if (type === 'elixier') {
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) p.set(cx + dx, cy + dy, c);
    p.set(cx, cy, hi);
  } else {
    p.set(cx, cy - 1, c); p.set(cx - 1, cy, c); p.set(cx, cy + 1, c); p.set(cx + 1, cy - 1, hi); p.set(cx + 1, cy + 1, hi);
  }
}

/** Zeichen der Art in der Fußleiste (7 mal 7): Stern, Kolben, Mond. */
function footGlyph(p: Pix, type: ConsumableType, cx: number, cy: number, f: ConsumableFrame) {
  const c = f.glyph;
  if (type === 'sternbild') {
    p.poly([cx, cy - 4, cx + 1.2, cy - 1.2, cx + 4, cy, cx + 1.2, cy + 1.2, cx, cy + 4, cx - 1.2, cy + 1.2, cx - 4, cy, cx - 1.2, cy - 1.2], c);
    p.set(cx, cy, 0xffffff);
  } else if (type === 'elixier') {
    p.rect(cx - 1, cy - 4, 3, 3, c);
    p.poly([cx - 1, cy - 2, cx + 2, cy - 2, cx + 4, cy + 3, cx - 3, cy + 3], c);
    p.rect(cx - 2, cy + 1, 5, 2, 0x35e0a0);
  } else {
    p.disc(cx, cy, 3.6, c);
    p.disc(cx + 2, cy - 1, 3.2, f.band);
    p.set(cx - 3, cy - 3, 0xffffff);
  }
}

/** Ganze Karte: Rahmen mit Wulst, Titelband, Fenster mit Zierleiste, Fußleiste (ohne Text). */
export function consumableTilePix(defId: string): Pix {
  const def = CONSUMABLE_BY_ID[defId];
  const type: ConsumableType = def?.type ?? 'sternbild';
  const f = CONSUMABLE_FRAMES[type];
  const t = new Pix(CT_W, CT_H);
  roundRect(t, 0, 0, CT_W, CT_H, CT_CORNER, CT_INK);
  roundRect(t, 1, 1, CT_W - 2, CT_H - 2, CT_CORNER - 1, f.base);
  // Wulst: Licht oben links, Schatten unten rechts
  for (let i = 5; i < CT_W - 5; i++) { t.set(i, 1, f.light); t.set(i, CT_H - 2, f.dark); }
  for (let j = 5; j < CT_H - 5; j++) { t.set(1, j, f.light); t.set(CT_W - 2, j, f.dark); }
  // Zierleiste: goldene Mittellinie im seitlichen Rahmen, in der Mitte gepunktet
  for (let j = 6; j < CT_H - 6; j++) {
    const c = j % 4 === 0 ? f.trimLight : f.trim;
    t.set(2, j, c); t.set(CT_W - 3, j, c);
  }
  for (let i = 6; i < CT_W - 6; i++) { t.set(i, CT_H - 3, i % 4 === 0 ? f.trimLight : f.trim); }

  // Titelband
  const bx = 4, bw = CT_W - 8;
  t.rect(bx, CBAND_Y, bw, CBAND_H, CT_INK);
  t.rect(bx + 1, CBAND_Y + 1, bw - 2, CBAND_H - 2, f.trim);
  t.rect(bx + 1, CBAND_Y + CBAND_H - 2, bw - 2, 1, f.trimDark);
  t.rect(bx + 2, CBAND_Y + 2, bw - 4, CBAND_H - 4, f.band);
  t.rect(bx + 2, CBAND_Y + 2, bw - 4, 1, f.dark);

  // Fenster mit Zierrand
  const wx = CART_X - 2, wy = CART_Y - 2, ww = CART_W + 4, wh = CART_H + 4;
  t.rect(wx - 1, wy - 1, ww + 2, wh + 2, CT_INK);
  t.rect(wx, wy, ww, wh, f.trim);
  t.rect(wx, wy + wh - 1, ww, 1, f.trimDark);
  t.rect(wx + ww - 1, wy, 1, wh, f.trimDark);
  t.rect(wx + 1, wy + 1, ww - 2, wh - 2, CT_INK);
  t.blit(consumableArtPix(defId), CART_X, CART_Y);

  // Fußleiste mit Zeichen der Art
  const fx = 8, fw = CT_W - 16;
  t.rect(fx, CFOOT_Y, fw, CFOOT_H, CT_INK);
  t.rect(fx + 1, CFOOT_Y + 1, fw - 2, CFOOT_H - 2, f.trim);
  t.rect(fx + 1, CFOOT_Y + CFOOT_H - 2, fw - 2, 1, f.trimDark);
  t.rect(fx + 2, CFOOT_Y + 2, fw - 4, CFOOT_H - 4, f.band);
  // Zierlinien links und rechts vom Zeichen
  const mid = CT_W / 2, my = CFOOT_Y + CFOOT_H / 2;
  for (let k = 0; k < 6; k++) {
    const c = k % 2 ? f.trimDark : f.trimLight;
    t.set(fx + 4 + k, my - 0, c); t.set(CT_W - fx - 5 - k, my - 0, c);
  }
  t.set(fx + 3, my - 1, f.trimLight); t.set(CT_W - fx - 4, my - 1, f.trimLight);
  footGlyph(t, type, mid, my - 0.5, f);

  // Eckzeichen an den Fensterecken und an den Rahmenmitten
  const ys = [wy - 1, wy + wh];
  for (const y of ys) for (const x of [wx - 1, wx + ww]) cornerMark(t, type, x, y, f.glyph, 0xffffff);
  cornerMark(t, type, 2, Math.round(CT_H / 2), f.glyph, 0xffffff);
  cornerMark(t, type, CT_W - 3, Math.round(CT_H / 2), f.glyph, 0xffffff);
  return t;
}
