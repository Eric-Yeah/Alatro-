import { Container, Sprite, Texture } from 'pixi.js';
import { MOTES, ORB, PARTICLES } from '../data/spektakel';
import { VIEW_H, VIEW_W } from './theme';
import { dotTexture, sparkTexture } from './artFx';
import { bezier, bowControl, motePush, newParticle, orbEase, particleLook, scaledCount, stepParticle, type PState } from './spektakelMath';

// Partikelsystem der Grafikstufe Supernova: ein Pool von Sprites, additiv gezeichnet (Funken, Leuchtpunkte, Ringe),
// dazu Orbs (leuchtende Kugeln mit Schweif auf einer Bahn) und die Staubwolke. Der Takt kommt von außen (update),
// so liegt alles in EINEM Ticker Eintrag der Fassade (ui/spektakel.ts).

export type TexKind = 'spark' | 'glow' | 'ring' | 'dot';

let glowTex: Texture | null = null;
let ringTex: Texture | null = null;

/** Weicher Leuchtpunkt (64 mal 64, weiß, wird beim Zeichnen eingefärbt) */
export function glowTexture(): Texture {
  if (!glowTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.22, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    glowTex = Texture.from(c);
  }
  return glowTex;
}

/** Schockwellen Ring (128 mal 128, dünn mit weichem Rand) */
export function ringTexture(): Texture {
  if (!ringTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 44, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    ringTex = Texture.from(c);
  }
  return ringTex;
}

function textureOf(kind: TexKind): Texture {
  switch (kind) {
    case 'spark': return sparkTexture();
    case 'glow': return glowTexture();
    case 'ring': return ringTexture();
    default: return dotTexture();
  }
}

/** Nominelle Größe der Texturen in Einheiten, damit "size" bei allen Arten ungefähr gleich groß wirkt */
const TEX_SIZE: Record<TexKind, number> = { spark: 7, glow: 64, ring: 128, dot: 2 };

interface Live {
  s: PState;
  sprite: Sprite;
  kind: TexKind;
  /** Flattern (Konfetti): Phase, NaN = aus */
  flutter: number;
}

export interface SpawnOpts {
  /** Gewünschte Größe in Spielfeld Einheiten am Anfang und Ende (Durchmesser) */
  from?: number;
  to?: number;
  flutter?: boolean;
  /** Normales statt additives Mischen (Konfetti) */
  normal?: boolean;
}

/** Ein Vorrat an Partikeln in einer Ebene. Die Ebene gehört dem Aufrufer (addChild). */
export class Particles {
  readonly layer = new Container();
  private readonly addLayer = new Container();
  private readonly normalLayer = new Container();
  private readonly pool: Sprite[] = [];
  private live: Live[] = [];
  /** Dichte 0 bis 1, von der Fassade gesetzt */
  density = 1;

  constructor() {
    this.layer.eventMode = 'none';
    this.layer.addChild(this.addLayer, this.normalLayer);
  }

  get active(): number {
    return this.live.length;
  }

  /** Anzahl, die bei aktueller Dichte und Restmenge wirklich erzeugt werden soll */
  count(n: number): number {
    return scaledCount(n, this.density, this.live.length, PARTICLES.max);
  }

  private take(kind: TexKind, normal: boolean): Sprite {
    const sprite = this.pool.pop() ?? new Sprite();
    sprite.texture = textureOf(kind);
    sprite.anchor.set(0.5);
    sprite.blendMode = normal ? 'normal' : 'add';
    sprite.visible = true;
    (normal ? this.normalLayer : this.addLayer).addChild(sprite);
    return sprite;
  }

  /** Erzeugt ein Partikel, false wenn der Vorrat voll ist. size0 und size1 in `st` sind Skalierungen, wenn opts.from fehlt. */
  spawn(kind: TexKind, st: Partial<PState>, color: number, opts: SpawnOpts = {}): boolean {
    if (this.live.length >= PARTICLES.max) return false;
    const base = TEX_SIZE[kind];
    const p = newParticle(st);
    if (opts.from !== undefined) p.size0 = opts.from / base;
    if (opts.to !== undefined) p.size1 = opts.to / base;
    const sprite = this.take(kind, !!opts.normal);
    sprite.tint = color;
    sprite.position.set(p.x, p.y);
    this.live.push({ s: p, sprite, kind, flutter: opts.flutter ? Math.random() * 6.28 : NaN });
    return true;
  }

  update(dtMs: number) {
    const keep: Live[] = [];
    for (const l of this.live) {
      const alive = stepParticle(l.s, dtMs);
      if (!alive) {
        l.sprite.visible = false;
        l.sprite.parent?.removeChild(l.sprite);
        this.pool.push(l.sprite);
        continue;
      }
      const look = particleLook(l.s);
      l.sprite.position.set(l.s.x, l.s.y);
      l.sprite.rotation = l.s.rot;
      l.sprite.alpha = look.alpha;
      if (Number.isNaN(l.flutter)) l.sprite.scale.set(look.scale);
      else l.sprite.scale.set(look.scale, look.scale * Math.cos(l.s.age * 0.012 + l.flutter));
      keep.push(l);
    }
    this.live = keep;
  }

  clear() {
    for (const l of this.live) {
      l.sprite.visible = false;
      l.sprite.parent?.removeChild(l.sprite);
      this.pool.push(l.sprite);
    }
    this.live = [];
  }
}

// ────────────────────────────────────────────────────────────── Orbs

export interface OrbSpec {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: number;
  core: number;
  /** Wartezeit vor dem Start (ms, Echtzeit) */
  delay: number;
  /** Größenfaktor auf ORB.size */
  scale: number;
  onArrive: () => void;
}

interface Orb extends OrbSpec {
  cx: number;
  cy: number;
  t: number;
  trailAcc: number;
  glow: Sprite;
  dot: Sprite;
}

/** Leuchtende Kugeln auf einer Bezier Bahn mit Schweif aus Leuchtpunkten */
export class Orbs {
  readonly layer = new Container();
  private orbs: Orb[] = [];
  private flip: 1 | -1 = 1;

  constructor(private trail: Particles) {
    this.layer.eventMode = 'none';
  }

  get active(): number {
    return this.orbs.length;
  }

  launch(spec: OrbSpec) {
    const c = bowControl(spec.from.x, spec.from.y, spec.to.x, spec.to.y, ORB.bow, this.flip);
    this.flip = this.flip === 1 ? -1 : 1;
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = spec.color;
    glow.blendMode = 'add';
    glow.visible = false;
    const dot = new Sprite(glowTexture());
    dot.anchor.set(0.5);
    dot.tint = spec.core;
    dot.blendMode = 'add';
    dot.visible = false;
    this.layer.addChild(glow, dot);
    this.orbs.push({ ...spec, cx: c.x, cy: c.y, t: 0, trailAcc: 0, glow, dot });
  }

  /** dtMs in Echtzeit, flightScale = Tempofaktor der Optionen (schnelleres Tempo, kürzerer Flug) */
  update(dtMs: number, flightScale: number) {
    if (!this.orbs.length) return;
    const keep: Orb[] = [];
    for (const o of this.orbs) {
      if (o.delay > 0) {
        o.delay -= dtMs;
        keep.push(o);
        continue;
      }
      o.t += (dtMs * flightScale) / ORB.flightMs;
      const k = Math.min(1, o.t);
      const pos = bezier(o.from.x, o.from.y, o.cx, o.cy, o.to.x, o.to.y, orbEase(k));
      o.glow.visible = o.dot.visible = true;
      o.glow.position.set(pos.x, pos.y);
      o.dot.position.set(pos.x, pos.y);
      const grow = 0.7 + 0.5 * Math.sin(Math.min(1, k * 1.2) * Math.PI);
      o.glow.scale.set(ORB.size * o.scale * grow * 1.5);
      o.dot.scale.set(ORB.size * o.scale * grow * 0.6);
      o.trailAcc += dtMs;
      while (o.trailAcc >= ORB.trailEveryMs) {
        o.trailAcc -= ORB.trailEveryMs;
        const n = this.trail.count(1);
        if (n > 0) {
          const [a, b] = ORB.trailLife;
          this.trail.spawn('glow', {
            x: pos.x + (Math.random() - 0.5) * 6,
            y: pos.y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            drag: 2,
            life: a + Math.random() * (b - a),
          }, o.color, { from: 30 * o.scale, to: 4 });
        }
      }
      if (o.t >= 1) {
        o.glow.destroy();
        o.dot.destroy();
        o.onArrive();
        continue;
      }
      keep.push(o);
    }
    this.orbs = keep;
  }

  clear() {
    for (const o of this.orbs) {
      o.glow.destroy();
      o.dot.destroy();
    }
    this.orbs = [];
  }
}

// ────────────────────────────────────────────────────────────── Staubwolke

interface Mote {
  sprite: Sprite;
  x: number;
  y: number;
  vy: number;
  phase: number;
  freq: number;
  size: number;
  alpha: number;
  /** geglätteter Ausweich Versatz */
  ox: number;
  oy: number;
}

/** Glühwürmchen im Observatorium: steigen langsam auf, funkeln, weichen dem Zeiger aus, werden mit Hitze lebhafter */
export class Motes {
  readonly layer = new Container();
  private motes: Mote[] = [];
  private time = 0;

  constructor() {
    this.layer.eventMode = 'none';
    for (let i = 0; i < MOTES.count; i++) {
      const sprite = new Sprite(glowTexture());
      sprite.anchor.set(0.5);
      sprite.blendMode = 'add';
      sprite.tint = MOTES.colors[i % MOTES.colors.length];
      this.layer.addChild(sprite);
      const [s0, s1] = MOTES.size;
      const [a0, a1] = MOTES.alpha;
      const [r0, r1] = MOTES.rise;
      this.motes.push({
        sprite,
        x: Math.random() * VIEW_W,
        y: Math.random() * VIEW_H,
        vy: r0 + Math.random() * (r1 - r0),
        phase: Math.random() * 6.28,
        freq: 0.8 + Math.random() * 1.6,
        size: s0 + Math.random() * (s1 - s0),
        alpha: a0 + Math.random() * (a1 - a0),
        ox: 0,
        oy: 0,
      });
    }
  }

  update(dtMs: number, pointer: { x: number; y: number; active: boolean }, heat: number) {
    const dt = dtMs / 1000;
    this.time += dt;
    const speed = 1 + (MOTES.heatSpeed - 1) * heat;
    for (const m of this.motes) {
      m.y -= m.vy * speed * dt;
      m.x += Math.sin(this.time * 0.6 + m.phase) * MOTES.drift * dt;
      if (m.y < -20) { m.y = VIEW_H + 20; m.x = Math.random() * VIEW_W; }
      const push = pointer.active ? motePush(m.x + m.ox - pointer.x, m.y + m.oy - pointer.y) : { x: 0, y: 0 };
      m.ox += (push.x - m.ox) * 0.12;
      m.oy += (push.y - m.oy) * 0.12;
      const twinkle = 0.6 + 0.4 * Math.sin(this.time * m.freq + m.phase);
      m.sprite.position.set(m.x + m.ox, m.y + m.oy);
      m.sprite.alpha = Math.min(1, m.alpha * twinkle * (1 + MOTES.heatAlpha * heat));
      m.sprite.scale.set(m.size * (0.9 + 0.4 * heat));
    }
  }
}
