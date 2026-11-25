import { BufferImageSource, Container, FillGradient, Graphics, NineSliceSprite, Rectangle, Texture } from 'pixi.js';
import { BEVEL, SHADOW } from '../data/depth';
import { lighten, pickRadius, shadowAlphaGrid } from './depthMath';
import { C, STYLE, shade } from './theme';

// Werkzeugkasten für den Tiefen Look: weiche Schatten, Verläufe, Kanten, Glanz und vertiefte Felder.
// Alle Bildschirme bauen Platten, Knöpfe und Kacheln über diese Bausteine, damit Licht und Schatten überall gleich fallen
// (Licht kommt von oben, Schatten fällt nach unten). Zahlen in `data/depth.ts`.

// ───────────────────────────────────────────────────────────── Schatten

interface ShadowTex {
  texture: Texture;
  pad: number;
  slice: number;
}
const shadowTextures = new Map<string, ShadowTex>();

/** Ein Schatten ist eine kleine weiche Textur, die als neun Teile Sprite auf jede Größe gedehnt wird (eine Textur je Radius und Unschärfe). */
function shadowTexture(radius: number, blur: number): ShadowTex {
  const key = `${radius}:${blur}`;
  let s = shadowTextures.get(key);
  if (s) return s;
  const { size, slice, alpha } = shadowAlphaGrid(radius, blur, SHADOW.core);
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 255;
    data[i * 4 + 1] = 255;
    data[i * 4 + 2] = 255;
    data[i * 4 + 3] = alpha[i];
  }
  const source = new BufferImageSource({ resource: data, width: size, height: size, format: 'rgba8unorm', scaleMode: 'linear', autoGenerateMipmaps: false });
  const pad = Math.ceil(blur * 1.8);
  s = { texture: new Texture({ source }), pad, slice };
  shadowTextures.set(key, s);
  return s;
}

export interface ShadowOpts {
  /** Eckenradius der Form, die den Schatten wirft */
  radius?: number;
  blur?: number;
  dx?: number;
  dy?: number;
  alpha?: number;
  color?: number;
}

type ShadowPreset = { blur: number; dy: number; dx: number; alpha: number };

/**
 * Weicher Schatten für ein Rechteck von (0, 0) bis (w, h): der Sprite liegt so, dass die Form selbst bei (dx, dy) sitzt.
 * Bei Objekten mit Mitte als Ursprung (Karten) den Sprite um (-w/2, -h/2) verschieben.
 */
export function dropShadow(w: number, h: number, preset: ShadowPreset = SHADOW.panel, o: ShadowOpts = {}): NineSliceSprite {
  const radius = pickRadius(o.radius ?? STYLE.radius, w, h, SHADOW.radii);
  const blur = o.blur ?? preset.blur;
  const { texture, pad, slice } = shadowTexture(radius, blur);
  const sp = new NineSliceSprite({
    texture,
    leftWidth: slice,
    rightWidth: slice,
    topHeight: slice,
    bottomHeight: slice,
    width: w + 2 * pad,
    height: h + 2 * pad,
  });
  sp.position.set((o.dx ?? preset.dx) - pad, (o.dy ?? preset.dy) - pad);
  sp.tint = o.color ?? SHADOW.color;
  sp.alpha = o.alpha ?? preset.alpha;
  sp.eventMode = 'none';
  return sp;
}

const rest = new WeakMap<NineSliceSprite, { x: number; y: number; w: number; h: number; alpha: number }>();

/** Ein Schatten, der mit dem Abheben mitwächst: t = 0 liegt, t = 1 schwebt (Schatten tiefer, etwas größer, blasser) */
export function setShadowLift(shadow: NineSliceSprite, t: number) {
  let r = rest.get(shadow);
  if (!r) {
    r = { x: shadow.x, y: shadow.y, w: shadow.width, h: shadow.height, alpha: shadow.alpha };
    rest.set(shadow, r);
  }
  const L = SHADOW.lift;
  const k = 1 + L.scaleUp * t;
  shadow.alpha = Math.max(0, r.alpha - L.alphaDrop * t);
  shadow.width = r.w * k;
  shadow.height = r.h * k;
  shadow.position.set(r.x - (r.w * (k - 1)) / 2, r.y + L.extraDy * t - (r.h * (k - 1)) / 2);
}

// ───────────────────────────────────────────────────────────── Verläufe

const gradients = new Map<string, FillGradient>();

/** Senkrechter Verlauf von oben nach unten über die Form (Farben als Zahl oder 'rgba(...)') */
export function vGradient(top: number | string, bottom: number | string): FillGradient {
  const key = `${top}|${bottom}`;
  let g = gradients.get(key);
  if (!g) {
    g = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [{ offset: 0, color: top }, { offset: 1, color: bottom }],
      textureSpace: 'local',
    });
    gradients.set(key, g);
  }
  return g;
}

/** Verlauf mit drei Stufen (oben, Mitte bei `mid` von 0 bis 1, unten) */
export function vGradient3(top: number | string, mid: number | string, bottom: number | string, at = 0.5): FillGradient {
  const key = `${top}|${mid}|${bottom}|${at}`;
  let g = gradients.get(key);
  if (!g) {
    g = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [{ offset: 0, color: top }, { offset: at, color: mid }, { offset: 1, color: bottom }],
      textureSpace: 'local',
    });
    gradients.set(key, g);
  }
  return g;
}

/** Runder Verlauf von der Mitte (inner) zum Rand (outer), wird über die Form gedehnt (Ellipse) */
export function radialGradient(inner: number | string, outer: number | string, innerAt = 0): FillGradient {
  const key = `r:${inner}|${outer}|${innerAt}`;
  let g = gradients.get(key);
  if (!g) {
    g = new FillGradient({
      type: 'radial',
      center: { x: 0.5, y: 0.5 },
      innerRadius: 0,
      outerCenter: { x: 0.5, y: 0.5 },
      outerRadius: 0.5,
      colorStops: [{ offset: innerAt, color: inner }, { offset: 1, color: outer }],
      textureSpace: 'local',
    });
    gradients.set(key, g);
  }
  return g;
}

const WHITE = (a: number) => `rgba(255,255,255,${a})`;
const BLACK = (a: number) => `rgba(0,0,0,${a})`;

// ───────────────────────────────────────────────────────────── Platten und Knöpfe

export interface PlateOpts {
  radius?: number;
  /** Farbe der Kontur */
  line?: number;
  outline?: number;
  /** Dicke des Unterrands, 0 = keiner */
  edge?: number;
  /** Deckkraft der Fläche */
  alpha?: number;
  /** Glanzband oben (Anteil der Höhe), 0 = keins */
  sheen?: number;
  /** feine Hologramm Linie innen */
  holo?: boolean;
  /** Fläche heller oder dunkler als der Standard (Faktor auf BEVEL.faceTop und faceBottom) */
  contrast?: number;
}

/** Zeichnet eine erhabene Platte mit Verlauf, Unterrand, Licht und Schattenkante in ein Graphics (Fläche (x, y, w, h), Unterrand liegt darunter). */
export function drawPlate(g: Graphics, x: number, y: number, w: number, h: number, color: number, o: PlateOpts = {}): Graphics {
  const r = o.radius ?? STYLE.radius;
  const ol = o.outline ?? STYLE.outline;
  const edge = o.edge ?? BEVEL.panelEdge;
  const line = o.line ?? C.panelLine;
  const k = o.contrast ?? 1;
  const alpha = o.alpha ?? 1;
  const sheen = o.sheen ?? BEVEL.sheenH;
  g.roundRect(x - ol, y - ol, w + 2 * ol, h + edge + 2 * ol, r + ol).fill(line);
  if (edge > 0) g.roundRect(x, y, w, h + edge, r).fill(shade(color, BEVEL.edgeShade));
  g.roundRect(x, y, w, h, r).fill({ fill: vGradient(lighten(color, BEVEL.faceTop * k), shade(color, 1 - (1 - BEVEL.faceBottom) * k)), alpha });
  // Licht oben, Schatten unten als Kantenlinie
  g.roundRect(x + 1, y + 1, w - 2, h - 2, Math.max(1, r - 1)).stroke({ width: 1.5, fill: vGradient3(WHITE(BEVEL.rimLight), WHITE(0), BLACK(BEVEL.rimDark), 0.5) });
  if (sheen > 0) {
    const sh = Math.min(h - 6, h * sheen);
    if (sh > 4) g.roundRect(x + 3, y + 3, w - 6, sh, Math.max(2, r - 3)).fill(vGradient(WHITE(BEVEL.sheenAlpha * 0.55), WHITE(0.01)));
  }
  if (o.holo) g.roundRect(x + 5, y + 5, w - 10, h - 10, Math.max(2, r - 4)).stroke({ width: 1, color: C.holo, alpha: 0.22 });
  return g;
}

/** Vertieftes Feld: dunkler Verlauf, Schatten am oberen Rand innen, helle Lippe unten (Wert Felder, Fächer, Plätze) */
export function drawInset(g: Graphics, x: number, y: number, w: number, h: number, color: number, o: { radius?: number; line?: number; outline?: number; alpha?: number } = {}): Graphics {
  const r = o.radius ?? STYLE.radius;
  const ol = o.outline ?? STYLE.outline;
  const line = o.line ?? C.panelLine;
  const I = BEVEL.inset;
  // helle Lippe: die untere Kante fängt Licht
  g.roundRect(x - ol, y - ol + 2, w + 2 * ol, h + 2 * ol, r + ol).fill(WHITE(I.lipAlpha));
  g.roundRect(x - ol, y - ol, w + 2 * ol, h + 2 * ol, r + ol).fill(line);
  g.roundRect(x, y, w, h, r).fill({ fill: vGradient(shade(color, I.top), shade(color, I.bottom)), alpha: o.alpha ?? 1 });
  const sh = Math.min(h, I.shadowH + r);
  g.roundRect(x, y, w, sh, r).fill(vGradient(BLACK(I.shadowAlpha), BLACK(0)));
  return g;
}

/** Erhabene Platte als Container: weicher Schatten plus Platte. Ursprung links oben, `bounds` gleich Plattengröße (ohne Schatten). */
export function raised(w: number, h: number, color: number, o: PlateOpts & { shadow?: ShadowPreset | false } = {}): Container {
  const c = new Container();
  const edge = o.edge ?? BEVEL.panelEdge;
  if (o.shadow !== false) c.addChild(dropShadow(w, h + edge, o.shadow ?? SHADOW.panel, { radius: o.radius }));
  c.addChild(drawPlate(new Graphics(), 0, 0, w, h, color, o));
  c.boundsArea = new Rectangle(0, 0, w, h + edge);
  return c;
}

/** Vertieftes Feld als Container (ohne eigenen Schatten) */
export function sunken(w: number, h: number, color: number, o: { radius?: number; line?: number; outline?: number; alpha?: number } = {}): Container {
  const c = new Container();
  c.addChild(drawInset(new Graphics(), 0, 0, w, h, color, o));
  c.boundsArea = new Rectangle(0, 0, w, h);
  return c;
}

/**
 * Glanz für Kacheln und Karten (Jokers, Packs, Vouchers): helle Kante oben, dunkle unten, Lichtband oben.
 * Ursprung links oben, strength 0 bis 1.
 */
export function gloss(w: number, h: number, radius = STYLE.radius, strength = 1): Graphics {
  const g = new Graphics();
  g.roundRect(1, 1, w - 2, h - 2, Math.max(1, radius - 1)).stroke({ width: 2, fill: vGradient3(WHITE(0.5 * strength), WHITE(0), BLACK(0.3 * strength), 0.5) });
  g.roundRect(3, 3, w - 6, h * 0.34, Math.max(2, radius - 3)).fill(vGradient(WHITE(0.22 * strength), WHITE(0)));
  g.eventMode = 'none';
  return g;
}

/** Dunkle Ränder wie ein Raumlicht: Rechteck (0, 0, w, h), in der Mitte klar, zum Rand dunkler */
export function vignette(w: number, h: number, alpha = 0.45, innerAt = 0.55): Graphics {
  const g = new Graphics();
  g.rect(0, 0, w, h).fill(radialGradient(BLACK(0), BLACK(alpha), innerAt));
  g.eventMode = 'none';
  return g;
}
