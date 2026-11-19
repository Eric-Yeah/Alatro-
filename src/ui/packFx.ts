import { Container, Graphics, Sprite, Texture, Ticker } from 'pixi.js';
import { OPEN_FX } from '../data/artFx';
import { PACK_PALETTES } from '../data/packArt';
import type { PackDef } from '../data/packs';
import { speedFactor } from '../settings';
import { dotTexture, fxMode, sparkTexture } from './artFx';
import { PackView } from './PackView';
import { sfx } from './audio';
import { easeOutBack, easeOutCubic, tween, wait } from './tween';

// Öffnungsanimation eines Packs: der Beutel wackelt, glüht auf, bläht sich und platzt. Funken fliegen, die
// gewählten Karten fächern sich aus der Mitte auf. Alle Zahlen stehen in data/artFx.ts (OPEN_FX).
// Ohne Option Shake entfallen Wackeln, Glühen, Funken und Blitz, die Karten erscheinen dann nur mit Einblenden.
// Grafikstufe "sparsam" halbiert die Funken.

let glowTex: Texture | null = null;

/** Weiche runde Leuchtscheibe (Canvas Verlauf), wird in der Farbe des Packs eingefärbt. */
function glowTexture(): Texture {
  if (!glowTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    glowTex = Texture.from(c);
  }
  return glowTex;
}

interface Particle { s: Sprite; vx: number; vy: number; life: number; age: number; spin: number }

/** Funkenregen vom Punkt (x, y): Quadrate und Funkelkreuze in den Farben des Packs, fallen mit Schwerkraft. */
export function burstParticles(host: Container, x: number, y: number, colors: number[], count: number) {
  const parts: Particle[] = [];
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  for (let i = 0; i < count; i++) {
    const star = i % 3 === 0;
    const s = new Sprite(star ? sparkTexture() : dotTexture());
    s.anchor.set(0.5);
    s.tint = colors[i % colors.length];
    s.scale.set(star ? rnd(1.4, 2.4) : rnd(OPEN_FX.particleScale[0], OPEN_FX.particleScale[1]));
    s.position.set(x, y);
    s.eventMode = 'none';
    host.addChild(s);
    const a = Math.random() * Math.PI * 2;
    const v = rnd(OPEN_FX.particleSpeed[0], OPEN_FX.particleSpeed[1]);
    parts.push({ s, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: rnd(OPEN_FX.particleMs[0], OPEN_FX.particleMs[1]), age: 0, spin: rnd(-6, 6) });
  }
  const tick = (t: Ticker) => {
    const dt = (t.deltaMS * speedFactor()) / 1000;
    let alive = 0;
    for (const p of parts) {
      if (p.s.destroyed) continue;
      p.age += dt * 1000;
      if (p.age >= p.life) { p.s.destroy(); continue; }
      alive++;
      p.vy += OPEN_FX.particleGravity * dt;
      p.s.x += p.vx * dt;
      p.s.y += p.vy * dt;
      p.s.rotation += p.spin * dt;
      p.s.alpha = Math.min(1, (1 - p.age / p.life) * 1.6);
    }
    if (alive === 0) Ticker.shared.remove(tick);
  };
  Ticker.shared.add(tick);
}

/** Ein Ziel der Fächerung: Ansicht mit Endposition, dazu Text und Knopf, die danach einblenden. */
export interface FanTarget { view: Container; x: number; y: number; extras: Container[] }

export interface OpenHooks {
  flash(alpha: number, color: number): void;
  shake(amp: number): void;
}

/**
 * Spielt die Öffnung ab und fächert die Ziele auf. host ist der Container, in dem der Beutel bei (x, y) erscheint.
 * Gibt den Promise zurück, sobald alles an seinem Platz ist (danach dürfen Knöpfe bedient werden).
 */
export async function playPackOpen(host: Container, def: PackDef, x: number, y: number, targets: FanTarget[], hooks: OpenHooks): Promise<void> {
  const mode = fxMode();
  const pal = PACK_PALETTES[def.kind];
  // Ausgangszustand der Ziele: unsichtbar in der Mitte
  const n = targets.length;
  targets.forEach((t, i) => {
    t.view.alpha = 0;
    t.view.position.set(x, y);
    t.view.scale.set(OPEN_FX.fanStartScale);
    t.view.rotation = n > 1 ? ((i / (n - 1)) - 0.5) * 2 * OPEN_FX.fanAngle : 0;
    for (const e of t.extras) e.alpha = 0;
  });

  if (mode.pop) {
    const bag = new PackView(def, false);
    bag.position.set(x, y);
    bag.scale.set(0.5);
    bag.alpha = 0;
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = pal.trimLight;
    glow.position.set(x, y);
    glow.alpha = 0;
    glow.eventMode = 'none';
    host.addChild(glow, bag);
    sfx.whoosh();
    await tween(bag, { alpha: 1, 'scale.x': 1, 'scale.y': 1 }, 160, easeOutBack);
    // Wackeln, dabei steigt das Glühen
    void tween(glow, { alpha: 0.85, 'scale.x': OPEN_FX.glowScale, 'scale.y': OPEN_FX.glowScale }, OPEN_FX.glowMs + OPEN_FX.wobbleBeats * OPEN_FX.wobbleMs, easeOutCubic);
    for (let i = 0; i < OPEN_FX.wobbleBeats; i++) {
      if (bag.destroyed) return;
      await tween(bag, { rotation: (i % 2 ? -1 : 1) * OPEN_FX.wobbleAngle * (0.6 + i * 0.25) }, OPEN_FX.wobbleMs);
    }
    if (bag.destroyed) return;
    await tween(bag, { rotation: 0, 'scale.x': OPEN_FX.swellScale, 'scale.y': OPEN_FX.swellScale }, OPEN_FX.swellMs);
    // Platzen
    hooks.flash(OPEN_FX.flashAlpha, pal.trimLight);
    hooks.shake(OPEN_FX.shake);
    const count = Math.round(OPEN_FX.particles * (mode.calm ? OPEN_FX.particlesCalmShare : 1));
    burstParticles(host, x, y, [pal.trimLight, pal.trim, pal.light, 0xffffff], count);
    void tween(bag, { alpha: 0, 'scale.x': 1.6, 'scale.y': 1.6 }, 160).then(() => { if (!bag.destroyed) bag.destroy({ children: true }); });
    void tween(glow, { alpha: 0 }, 300).then(() => { if (!glow.destroyed) glow.destroy(); });
  }

  // Karten fächern sich aus der Mitte auf
  const fan = targets.map(async (t, i) => {
    await wait(i * (mode.pop ? OPEN_FX.fanStaggerMs : 30));
    if (t.view.destroyed) return;
    t.view.alpha = 1;
    if (mode.pop) {
      await tween(t.view, { x: t.x, y: t.y, 'scale.x': 1, 'scale.y': 1, rotation: 0 }, OPEN_FX.fanMs, easeOutBack);
    } else {
      t.view.position.set(t.x, t.y);
      t.view.scale.set(1);
      t.view.rotation = 0;
    }
  });
  await Promise.all(fan);
  await Promise.all(targets.flatMap((t) => t.extras.map((e) => (e.destroyed ? Promise.resolve() : tween(e, { alpha: 1 }, OPEN_FX.textFadeMs)))));
}

void Graphics;
