import { Container, Graphics, GraphicsContext, NineSliceSprite, Rectangle, Sprite, type Texture } from 'pixi.js';
import { SHADOW } from '../data/depth';
import { ROW_DEPTH, TILE_DEPTH, type GlowSpec } from '../data/tileDepth';
import { dropShadow, setShadowLift, sunken, vGradient, vGradient3 } from './depth';
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

/** Glanz für Kacheln mit gerundetem Rahmen: Lichtkante oben, Schattenkante unten, schwaches Lichtband. Mitte im Ursprung. */
export function tileGloss(w: number, h: number, radius: number, strength = 1, inset = 2): Graphics {
  const k = strength;
  return shared(`g:${w}:${h}:${radius}:${k}:${inset}`, (c) => {
    c.roundRect(-w / 2 + inset, -h / 2 + inset, w - 2 * inset, h - 2 * inset, Math.max(1, radius - inset))
      .stroke({ width: 2, fill: vGradient3(WHITE(TILE_DEPTH.glossRim * k), WHITE(0), BLACK(0.3 * k), 0.5) });
    c.roundRect(-w / 2 + inset + 2, -h / 2 + inset + 2, w - 2 * (inset + 2), h * TILE_DEPTH.glossBandH, Math.max(2, radius - 4))
      .fill(vGradient(WHITE(TILE_DEPTH.glossBand * k), WHITE(0)));
  });
}

/** Nur das Lichtband (Packs und Vouchers, deren Rand gezackt oder gekerbt ist): Fläche (x, y, w, h) mit Mitte des Ursprungs als Bezug */
export function tileSheen(x: number, y: number, w: number, h: number, radius: number, strength = 1): Graphics {
  return shared(`s:${x}:${y}:${w}:${h}:${radius}:${strength}`, (c) => {
    c.roundRect(x, y, w, h, radius).fill(vGradient(WHITE(TILE_DEPTH.glossBand * 1.4 * strength), WHITE(0)));
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

/** Vertiefte Listenzeile: dunkler Verlauf, schmaler Innenschatten oben, helle Lippe unten (kleiner als `drawInset`) */
export function drawRow(g: Graphics, x: number, y: number, w: number, h: number, color: number, o: { radius?: number; alpha?: number; line?: number; outline?: number } = {}): Graphics {
  const r = o.radius ?? 8;
  const ol = o.outline ?? 2;
  const line = o.line ?? C.panelLine;
  g.roundRect(x - ol, y - ol + 1, w + 2 * ol, h + 2 * ol, r + ol).fill(WHITE(ROW_DEPTH.lipAlpha));
  g.roundRect(x - ol, y - ol, w + 2 * ol, h + 2 * ol, r + ol).fill(line);
  g.roundRect(x, y, w, h, r).fill({ fill: vGradient(shade(color, 0.62), shade(color, 0.82)), alpha: o.alpha ?? 1 });
  const sh = Math.min(h, ROW_DEPTH.shadowH + r);
  g.roundRect(x, y, w, sh, r).fill(vGradient(BLACK(ROW_DEPTH.shadowAlpha), BLACK(0)));
  return g;
}

/** Rinne hinter einer Reiterleiste (Segment Schalter): Ursprung links oben, `width` ist die Breite der Reiter, Höhe der Knöpfe `h` */
export function tabTrough(width: number, h = 46): Container {
  const p = ROW_DEPTH.troughPad;
  const c = sunken(width + 2 * p, h + 2 * p, ROW_DEPTH.troughColor, { radius: 12 });
  c.position.set(-p, -p);
  return c;
}

/** Fläche mit Rundung nur unten (Regalboden im Fach): Rechteck (x, y, w, h), unten Radius r, Verlauf von top nach bottom */
export function bottomRounded(g: Graphics, x: number, y: number, w: number, h: number, r: number, top: number, bottom: number): Graphics {
  g.moveTo(x, y)
    .lineTo(x + w, y)
    .lineTo(x + w, y + h - r)
    .arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
    .lineTo(x + r, y + h)
    .arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
    .closePath()
    .fill(vGradient(top, bottom));
  return g;
}

/** Erhabene kleine Marke (Pille) mit Verlauf und Lichtkante, Mitte im Ursprung */
export function drawPill(g: Graphics, x: number, y: number, w: number, h: number, color: number, radius = 4): Graphics {
  g.roundRect(x, y, w, h, radius).fill(vGradient(lighten(color, 0.28), shade(color, 0.78)));
  g.roundRect(x + 1, y + 1, w - 2, Math.max(1, h * 0.4), Math.max(1, radius - 1)).fill(vGradient(WHITE(0.28), WHITE(0)));
  return g;
}
