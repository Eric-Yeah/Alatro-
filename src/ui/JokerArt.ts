import { Graphics } from 'pixi.js';
import type { JokerDef } from '../core/jokers';

/**
 * Eigene Joker Grafiken aus Vektor Primitiven (Thema: Sternwarte der Alchemisten).
 * Das Motiv richtet sich nach der Art der Wirkung, Farben und Beiwerk nach der ID des Jokers.
 * Alles ist deterministisch und selbst gezeichnet, es gibt keine Bilddateien.
 */

export type Motif = 'burst' | 'coin' | 'spiral' | 'flame' | 'crystal' | 'comet' | 'orbit' | 'crown' | 'star' | 'moon' | 'flask' | 'eye';

const FALLBACK: Motif[] = ['star', 'moon', 'flask', 'eye'];

/** Kleine deterministische Zufallsfolge aus einem Text (nur für das Aussehen) */
function seeded(text: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Motiv nach Wirkung: X Mult Sprengstern, Geld Münze, Retrigger Spirale, Mult Flamme, Chips Kristall usw. */
export function motifFor(def: JokerDef): Motif {
  const keys = Object.keys(def.config);
  const rnd = seeded(def.id);
  if (def.rarity === 'legendary') return 'crown';
  if (keys.some((k) => k.toLowerCase().includes('xmult'))) return 'burst';
  if (keys.includes('retrigger')) return 'spiral';
  if (keys.includes('money') || keys.includes('discount')) return 'coin';
  if (keys.includes('mult')) return 'flame';
  if (keys.includes('chips')) return 'crystal';
  if (keys.some((k) => ['gain', 'step', 'start', 'loss'].includes(k))) return 'comet';
  if (def.passive) return 'orbit';
  return FALLBACK[Math.floor(rnd() * FALLBACK.length)];
}

function mix(a: number, b: number, k: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
}

function starPoints(cx: number, cy: number, outer: number, inner: number, n: number, rot = -Math.PI / 2): number[] {
  const pts: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / n;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return pts;
}

/**
 * Zeichnet das Bild in ein Fenster der Größe size mal size um den Ursprung.
 * `bg` ist die Hintergrundfarbe des Fensters (Seltenheit), damit Aussparungen passen.
 */
export function drawJokerArt(g: Graphics, def: JokerDef, size: number, bg: number): void {
  const rnd = seeded(def.id + '#art');
  const r = size / 2;
  const light = mix(bg, 0xffffff, 0.8);
  const accents = [0xffd23f, 0xff9fd6, 0x9fe8ff, 0xb9ff9f, 0xffb36b];
  const accent = accents[Math.floor(rnd() * accents.length)];
  const dark = mix(bg, 0x0b0814, 0.55);

  // Sternenstaub im Hintergrund
  const dust = 4 + Math.floor(rnd() * 4);
  for (let i = 0; i < dust; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.55 + rnd() * 0.4);
    g.circle(Math.cos(a) * d, Math.sin(a) * d, 1 + rnd() * 1.6).fill({ color: light, alpha: 0.7 });
  }
  // Rahmenring, Stärke und Lücke nach ID
  const ringR = r * 0.88;
  const gap = rnd() * Math.PI * 2;
  g.arc(0, 0, ringR, gap, gap + Math.PI * (1.4 + rnd() * 0.5)).stroke({ width: 2, color: light, alpha: 0.5 });

  switch (motifFor(def)) {
    case 'burst': {
      g.poly(starPoints(0, 0, r * 0.78, r * 0.34, 8 + Math.floor(rnd() * 4))).fill(accent).stroke({ width: 2, color: dark });
      g.circle(0, 0, r * 0.26).fill(light).stroke({ width: 2, color: dark });
      break;
    }
    case 'coin': {
      g.circle(0, 0, r * 0.58).fill(0xf0b429).stroke({ width: 3, color: dark });
      g.circle(0, 0, r * 0.42).stroke({ width: 2, color: 0xfff1b0 });
      g.poly(starPoints(0, 0, r * 0.3, r * 0.13, 5)).fill(0xfff1b0);
      break;
    }
    case 'spiral': {
      const turns = 2.4;
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        const a = k * turns * Math.PI * 2;
        const d = r * 0.12 + k * r * 0.62;
        if (i === 0) g.moveTo(Math.cos(a) * d, Math.sin(a) * d);
        else g.lineTo(Math.cos(a) * d, Math.sin(a) * d);
      }
      g.stroke({ width: 5, color: accent, cap: 'round', join: 'round' });
      g.circle(0, 0, r * 0.1).fill(light);
      break;
    }
    case 'flame': {
      g.moveTo(0, -r * 0.8)
        .bezierCurveTo(r * 0.5, -r * 0.3, r * 0.65, r * 0.15, r * 0.3, r * 0.55)
        .bezierCurveTo(r * 0.15, r * 0.75, -r * 0.15, r * 0.75, -r * 0.3, r * 0.55)
        .bezierCurveTo(-r * 0.65, r * 0.15, -r * 0.4, -r * 0.2, 0, -r * 0.8)
        .fill(0xff6a3d).stroke({ width: 3, color: dark });
      g.moveTo(0, -r * 0.2)
        .bezierCurveTo(r * 0.28, r * 0.1, r * 0.25, r * 0.4, 0, r * 0.55)
        .bezierCurveTo(-r * 0.25, r * 0.4, -r * 0.28, r * 0.1, 0, -r * 0.2)
        .fill(0xffd86b);
      break;
    }
    case 'crystal': {
      const pts = [0, -r * 0.8, r * 0.5, -r * 0.2, r * 0.32, r * 0.7, -r * 0.32, r * 0.7, -r * 0.5, -r * 0.2];
      g.poly(pts).fill(mix(0x6fd0ff, bg, 0.15)).stroke({ width: 3, color: dark });
      g.poly([0, -r * 0.8, r * 0.5, -r * 0.2, 0, r * 0.05]).fill({ color: 0xffffff, alpha: 0.35 });
      g.moveTo(-r * 0.5, -r * 0.2).lineTo(0, r * 0.05).lineTo(r * 0.32, r * 0.7).stroke({ width: 2, color: light, alpha: 0.8 });
      g.moveTo(0, r * 0.05).lineTo(-r * 0.32, r * 0.7).stroke({ width: 2, color: light, alpha: 0.5 });
      break;
    }
    case 'comet': {
      const ang = -0.6 + rnd() * 0.3;
      const hx = Math.cos(ang) * r * 0.35, hy = Math.sin(ang) * r * 0.35;
      const tx = -Math.cos(ang) * r * 0.85, ty = -Math.sin(ang) * r * 0.85;
      const nx = -Math.sin(ang) * r * 0.3, ny = Math.cos(ang) * r * 0.3;
      g.poly([hx + nx, hy + ny, tx, ty, hx - nx, hy - ny]).fill({ color: accent, alpha: 0.75 });
      g.circle(hx, hy, r * 0.3).fill(light).stroke({ width: 3, color: dark });
      g.circle(hx - 3, hy - 3, r * 0.1).fill(0xffffff);
      break;
    }
    case 'orbit': {
      g.ellipse(0, 0, r * 0.82, r * 0.34).stroke({ width: 3, color: accent });
      g.circle(0, 0, r * 0.34).fill(mix(bg, 0xffffff, 0.45)).stroke({ width: 3, color: dark });
      const a = rnd() * Math.PI * 2;
      g.circle(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.34, r * 0.1).fill(light).stroke({ width: 2, color: dark });
      break;
    }
    case 'crown': {
      g.poly(starPoints(0, -r * 0.05, r * 0.75, r * 0.3, 5)).fill(0xffe27a).stroke({ width: 3, color: dark });
      g.circle(0, -r * 0.05, r * 0.88).stroke({ width: 3, color: 0xffe27a, alpha: 0.8 });
      g.circle(0, -r * 0.05, r * 0.14).fill(0xff5d73);
      break;
    }
    case 'star': {
      g.poly(starPoints(0, 0, r * 0.74, r * 0.3, 5)).fill(accent).stroke({ width: 3, color: dark });
      g.circle(0, 0, r * 0.12).fill(light);
      break;
    }
    case 'moon': {
      g.circle(0, 0, r * 0.62).fill(light).stroke({ width: 3, color: dark });
      g.circle(r * 0.28, -r * 0.1, r * 0.55).fill(bg);
      g.poly(starPoints(r * 0.45, -r * 0.35, r * 0.18, r * 0.07, 4)).fill(accent);
      break;
    }
    case 'flask': {
      g.poly([-r * 0.14, -r * 0.75, r * 0.14, -r * 0.75, r * 0.14, -r * 0.25, r * 0.6, r * 0.6, -r * 0.6, r * 0.6, -r * 0.14, -r * 0.25])
        .fill({ color: 0xffffff, alpha: 0.25 }).stroke({ width: 3, color: light });
      g.poly([-r * 0.38, r * 0.15, r * 0.38, r * 0.15, r * 0.6, r * 0.6, -r * 0.6, r * 0.6]).fill(accent);
      g.circle(-r * 0.12, r * 0.38, r * 0.07).fill({ color: 0xffffff, alpha: 0.8 });
      g.circle(r * 0.16, r * 0.3, r * 0.05).fill({ color: 0xffffff, alpha: 0.8 });
      break;
    }
    case 'eye': {
      g.moveTo(-r * 0.8, 0).quadraticCurveTo(0, -r * 0.75, r * 0.8, 0).quadraticCurveTo(0, r * 0.75, -r * 0.8, 0)
        .fill(light).stroke({ width: 3, color: dark });
      g.circle(0, 0, r * 0.3).fill(accent).stroke({ width: 3, color: dark });
      g.circle(0, 0, r * 0.12).fill(dark);
      g.circle(-r * 0.08, -r * 0.08, r * 0.05).fill(0xffffff);
      break;
    }
  }
}
