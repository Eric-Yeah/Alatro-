import { Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { IDLE_FX, POP_FX } from '../data/artFx';
import { QUALITY_PROFILE } from '../data/juice';
import { getSettings } from '../settings';
import { Pix, rng } from './jokerPix';
import { easeOutBack, tween } from './tween';

// Gemeinsamer Juice für Consumables und Packs: Pixel Textur Hilfe, Funkeln mit Glanzstreifen (läuft über einen
// einzigen Ticker für alle Objekte), Aufprall beim Berühren. Alle Zahlen stehen in data/artFx.ts.
// Respektiert die Optionen: Grafikstufe "sparsam" schaltet das Funkeln ab, ohne Shake gibt es keinen Aufprall.

/** Pixel Raster als Textur ohne Glättung (Canvas, nearest). */
export function pixTexture(pix: Pix): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = pix.w;
  canvas.height = pix.h;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(pix.w, pix.h);
  img.data.set(pix.toRGBA());
  ctx.putImageData(img, 0, 0);
  const tex = Texture.from(canvas);
  tex.source.scaleMode = 'nearest';
  return tex;
}

export function fxMode() {
  const s = getSettings();
  return { idle: QUALITY_PROFILE[s.quality].editionFx, pop: s.shake, calm: s.quality === 'sparsam' };
}

let sparkTex: Texture | null = null;
let dotTex: Texture | null = null;

/** Kleines Funkelkreuz (7 mal 7 Bildpunkte), weiß, wird beim Zeichnen eingefärbt. */
export function sparkTexture(): Texture {
  if (!sparkTex) {
    const p = new Pix(7, 7);
    p.sparkle(3, 3, 0xcccccc, true, 0xffffff);
    p.set(2, 2, 0x888888); p.set(4, 4, 0x888888); p.set(2, 4, 0x888888); p.set(4, 2, 0x888888);
    sparkTex = pixTexture(p);
  }
  return sparkTex;
}

/** Ein einzelner heller Bildpunkt (Partikel). */
export function dotTexture(): Texture {
  if (!dotTex) dotTex = pixTexture(new Pix(2, 2).fill(0xffffff));
  return dotTex;
}

interface Spark { sprite: Sprite; t: number; dur: number }

/** Funkeln und Glanzstreifen über einer Fläche der Größe w mal h, Mitte bei 0, 0. */
export class Shimmer extends Container {
  private sparks: Spark[] = [];
  private readonly rand: () => number;
  private band: Graphics | null = null;
  private sweepT = 0;
  private sweepWait = 0;

  constructor(private w: number, private h: number, count: number, seed: number, sweep: boolean, private color = 0xffffff, radius = 10) {
    super();
    this.eventMode = 'none';
    this.rand = rng(seed);
    for (let i = 0; i < count; i++) {
      const sprite = new Sprite(sparkTexture());
      sprite.anchor.set(0.5);
      sprite.tint = this.color;
      sprite.alpha = 0;
      this.addChild(sprite);
      this.sparks.push({ sprite, t: 0, dur: 0 });
      // zeitlich versetzt starten
      this.restart(this.sparks[i], this.rand() * IDLE_FX.sparkMs[1]);
    }
    if (sweep) {
      const holder = new Container();
      const mask = new Graphics().roundRect(-w / 2, -h / 2, w, h, radius).fill(0xffffff);
      const sw = IDLE_FX.sweepWidth;
      this.band = new Graphics()
        .poly([-sw / 2 + 8, -h / 2 - 2, sw / 2 + 8, -h / 2 - 2, sw / 2 - 8, h / 2 + 2, -sw / 2 - 8, h / 2 + 2])
        .fill({ color: 0xffffff, alpha: IDLE_FX.sweepAlpha });
      holder.addChild(this.band);
      holder.mask = mask;
      this.addChild(mask, holder);
      this.sweepWait = this.rand() * IDLE_FX.sweepPauseMs[1];
      this.band.x = -w;
    }
    register(this);
  }

  private restart(s: Spark, delay = 0) {
    const [a, b] = IDLE_FX.sparkMs;
    s.dur = a + this.rand() * (b - a);
    s.t = -delay;
    s.sprite.position.set((this.rand() - 0.5) * (this.w - 16), (this.rand() - 0.5) * (this.h - 16));
  }

  update(dt: number) {
    for (const s of this.sparks) {
      s.t += dt;
      if (s.t < 0) { s.sprite.alpha = 0; continue; }
      if (s.t >= s.dur) { this.restart(s); s.sprite.alpha = 0; continue; }
      const k = Math.sin((s.t / s.dur) * Math.PI);
      s.sprite.alpha = k;
      s.sprite.scale.set(IDLE_FX.sparkScale * (0.5 + 0.5 * k));
    }
    if (this.band) {
      if (this.sweepWait > 0) { this.sweepWait -= dt; this.band.visible = false; return; }
      this.band.visible = true;
      this.sweepT += dt;
      const k = Math.min(1, this.sweepT / IDLE_FX.sweepMs);
      this.band.x = -this.w * 0.7 + k * this.w * 1.4;
      if (k >= 1) {
        this.sweepT = 0;
        const [a, b] = IDLE_FX.sweepPauseMs;
        this.sweepWait = a + this.rand() * (b - a);
      }
    }
  }
}

/** Ist das Objekt samt allen Eltern sichtbar? */
function shown(c: Container | null): boolean {
  for (let n: Container | null = c; n; n = n.parent) if (!n.visible) return false;
  return true;
}

const active = new Set<Shimmer>();
let hooked = false;

function register(s: Shimmer) {
  active.add(s);
  if (hooked) return;
  hooked = true;
  Ticker.shared.add((t) => {
    for (const x of active) {
      if (x.destroyed) { active.delete(x); continue; }
      // unsichtbare Objekte (anderer Bildschirm) werden nicht berechnet
      if (!shown(x)) continue;
      x.update(t.deltaMS);
    }
  });
}

/** Funkeln hinzufügen, falls die Grafikstufe es erlaubt. Gibt das Objekt zurück, sonst null. */
export function addShimmer(parent: Container, w: number, h: number, count: number, seed: number, sweep: boolean, color = 0xffffff, radius = 10): Shimmer | null {
  if (!fxMode().idle) return null;
  const s = new Shimmer(w, h, count, seed, sweep, color, radius);
  parent.addChild(s);
  return s;
}

/**
 * Aufprall beim Berühren: bei Maus über der Fläche hebt und vergrößert sich body, beim Antippen sinkt es ein und federt zurück.
 * Der Auslöser (host) bleibt unverändert, so stört es Layout und Verschiebungen von außen nicht.
 */
export function attachPop(host: Container, body: Container) {
  let hover = false;
  const rest = () => (hover ? POP_FX.hoverScale : 1);
  host.on('pointerover', () => {
    if (!fxMode().pop || body.destroyed) return;
    hover = true;
    void tween(body, { 'scale.x': POP_FX.hoverScale, 'scale.y': POP_FX.hoverScale, y: -POP_FX.hoverLift }, POP_FX.hoverMs, easeOutBack);
  });
  host.on('pointerout', () => {
    hover = false;
    if (body.destroyed) return;
    void tween(body, { 'scale.x': 1, 'scale.y': 1, y: 0 }, POP_FX.hoverMs);
  });
  host.on('pointerdown', () => {
    if (!fxMode().pop || body.destroyed) return;
    void tween(body, { 'scale.x': POP_FX.pressScale, 'scale.y': POP_FX.pressScale }, POP_FX.pressMs);
  });
  const release = () => {
    if (!fxMode().pop || body.destroyed) return;
    void tween(body, { 'scale.x': rest(), 'scale.y': rest(), y: hover ? -POP_FX.hoverLift : 0 }, POP_FX.releaseMs, easeOutBack);
  };
  host.on('pointerup', release);
  host.on('pointerupoutside', release);
}
