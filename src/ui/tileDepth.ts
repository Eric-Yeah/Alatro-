import { Container, Graphics, GraphicsContext, NineSliceSprite, Rectangle, Sprite, type Texture } from 'pixi.js';
import { BEVEL, SHADOW } from '../data/depth';
import { ROW_DEPTH, TILE_DEPTH, type GlowSpec } from '../data/tileDepth';
import { dropShadow, setShadowLift, sunken } from './depth';
import { lighten } from './depthMath';
import { C, shade } from './theme';
import { tween } from './tween';

// Bausteine für den Tiefen Look der Kacheln (Jokers, Consumables, Packs, Vouchers) und der Raster Ansichten.
// Alles besteht aus Sprites und zwischengespeicherten Verläufen (keine Filter, keine Weichzeichner). Kacheln haben
// ihre Mitte im Ursprung, wie die Karten. Zahlen in `data/tileDepth.ts`.

const WHITE = (a: number) => `rgba(255,255,255,${a})`;
const BLACK = (a: number) => `rgba(0,0,0,${a})`;

/** Eine Zeichnung (Glanz, Band) wird je Maß einmal gebaut und von allen Kacheln gleicher Größe geteilt */
const contexts = new Map<string, GraphicsContext>();
function shared(key: string, draw: (c: GraphicsContext) => void): Graphics {
  let c = contexts.get(key);
  if (!c) {
    c = new GraphicsContext();
    draw(c);
    contexts.set(key, c);
  }
  const g = new Graphics(c);
  g.eventMode = 'none';
  return g;
}

export interface TileShapeOpts {
  radius?: number;
  /** Schatten schrumpft je Seite um diese Strecke (gezackte oder gekerbte Ränder) */
  inset?: number;
  preset?: { blur: number; dy: number; dx: number; alpha: number };
}

/** Weicher Schatten einer Kachel (Mitte im Ursprung). Wächst mit `setShadowLift`. */
export function tileShadow(w: number, h: number, o: TileShapeOpts = {}): NineSliceSprite {
  const inset = o.inset ?? 0;
  const sw = w - 2 * inset;
  const sh = h - 2 * inset;
  const s = dropShadow(sw, sh, o.preset ?? SHADOW.tile, { radius: o.radius });
  s.x -= sw / 2;
  s.y -= sh / 2;
  return s;
}

/** Weiche Leuchtkante in Farbe der Seltenheit hinter der Kachel (Mitte im Ursprung) */
export function tileGlow(w: number, h: number, spec: GlowSpec, radius: number): NineSliceSprite {
  const gw = w + 2 * spec.grow;
  const gh = h + 2 * spec.grow;
  const s = dropShadow(gw, gh, { blur: spec.blur, dy: 0, dx: 0, alpha: spec.alpha }, { radius: radius + spec.grow, color: spec.color });
  s.x -= gw / 2;
  s.y -= gh / 2;
  return s;
}

/** Körper der Kachel: dunkle Kopie der Pixel Art, um `bodyDy` nach unten versetzt. Unter die eigentliche Kachel legen. */
export function tileBody(tex: Texture, scale: number): Sprite {
  const s = new Sprite(tex);
  s.anchor.set(0.5);
  s.scale.set(scale);
  s.tint = TILE_DEPTH.bodyTint;
  s.y = TILE_DEPTH.bodyDy;
  return s;
}

/** Glanz für Kacheln im Comic Stil: nur ein kleiner heller Lichtstreifen oben links, keine Verläufe. Mitte im Ursprung. */
export function tileGloss(w: number, h: number, radius: number, strength = 1, inset = 3): Graphics {
  const k = strength;
  return shared(`g:${w}:${h}:${radius}:${k}:${inset}`, (c) => {
    c.roundRect(-w / 2 + radius, -h / 2 + inset, Math.max(8, (w - 2 * radius) * 0.5), TILE_DEPTH.glossH, TILE_DEPTH.glossH / 2)
      .fill({ color: 0xffffff, alpha: Math.min(1, TILE_DEPTH.glossAlpha * k) });
  });
}

/** Nur der Lichtstreifen (Packs und Vouchers): Fläche (x, y, w), Höhe aus den Zahlen */
export function tileSheen(x: number, y: number, w: number, _h: number, _radius: number, strength = 1): Graphics {
  return shared(`s:${x}:${y}:${w}:${strength}`, (c) => {
    c.roundRect(x, y, w, TILE_DEPTH.glossH, TILE_DEPTH.glossH / 2).fill({ color: 0xffffff, alpha: Math.min(1, TILE_DEPTH.glossAlpha * strength) });
  });
}

/** Lässt eine Ansicht mit `lift` (0 bis 1) zum Wert gleiten */
export function liftTo(view: { lift: number; destroyed: boolean }, v: number, ms = v > 0 ? TILE_DEPTH.liftMs : TILE_DEPTH.dropMs) {
  if (view.destroyed) return;
  void tween(view, { lift: v }, ms);
}

/** Setzt `lift` einer Kachel (nur der Schatten wächst, die Kachel selbst bewegt der Aufrufer) */
export function applyLift(shadow: NineSliceSprite, v: number) {
  setShadowLift(shadow, v);
}

/** Tippfläche und Grenzen einer Kachel ohne Schatten und Leuchtkante (für getBounds und Hit Tests) */
export function tileBounds(w: number, h: number, extraBottom = 0): Rectangle {
  return new Rectangle(-w / 2, -h / 2, w, h + extraBottom);
}

// ───────────────────────────────────────────────────────────── Listen und Reiter

/** Vertiefte Listenzeile im Comic Stil: flache dunkle Fläche, harter Schattenstreifen oben, helle Lippe unten */
export function drawRow(g: Graphics, x: number, y: number, w: number, h: number, color: number, o: { radius?: number; alpha?: number; line?: number; outline?: number } = {}): Graphics {
  const r = o.radius ?? 8;
  const ol = o.outline ?? 2;
  const line = o.line ?? C.panelLine;
  g.roundRect(x - ol, y - ol + 1, w + 2 * ol, h + 2 * ol, r + ol).fill(WHITE(ROW_DEPTH.lipAlpha));
  g.roundRect(x - ol, y - ol, w + 2 * ol, h + 2 * ol, r + ol).fill(line);
  g.roundRect(x, y, w, h, r).fill({ color: shade(color, 0.7), alpha: o.alpha ?? 1 });
  g.roundRect(x, y, w, Math.min(h, ROW_DEPTH.shadowH), r).fill(BLACK(ROW_DEPTH.shadowAlpha));
  return g;
}

/** Rinne hinter einer Reiterleiste (Segment Schalter): Ursprung links oben, `width` ist die Breite der Reiter, Höhe der Knöpfe `h` */
export function tabTrough(width: number, h = 46): Container {
  const p = ROW_DEPTH.troughPad;
  const c = sunken(width + 2 * p, h + 2 * p, ROW_DEPTH.troughColor, { radius: 12 });
  c.position.set(-p, -p);
  return c;
}

/** Fläche mit Rundung nur unten (Regalboden im Fach): Rechteck (x, y, w, h), unten Radius r, flach in `color` */
export function bottomRounded(g: Graphics, x: number, y: number, w: number, h: number, r: number, color: number): Graphics {
  g.moveTo(x, y)
    .lineTo(x + w, y)
    .lineTo(x + w, y + h - r)
    .arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
    .lineTo(x + r, y + h)
    .arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
    .closePath()
    .fill(color);
  return g;
}

/** Erhabene kleine Marke (Pille) im Comic Stil: flache Farbe, harter dunkler Unterrand, kleiner Lichtstreifen. Fläche (x, y, w, h). */
export function drawPill(g: Graphics, x: number, y: number, w: number, h: number, color: number, radius = 4, o: { light?: number; sheen?: number } = {}): Graphics {
  const edge = Math.max(1, Math.min(3, h * 0.14));
  g.roundRect(x, y, w, h, radius).fill(shade(color, BEVEL.edgeShade));
  g.roundRect(x, y, w, h - edge, radius).fill(o.light ? lighten(color, o.light) : color);
  if (w > 10 && h > 8) g.roundRect(x + Math.min(4, radius), y + 1.5, Math.max(4, w * 0.4), 1.5, 0.75).fill(WHITE(o.sheen ?? 0.35));
  return g;
}
