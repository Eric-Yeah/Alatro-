import { CALLOUTS, DENSITY, HEAT, MOTES, ORB, PARTICLES, TOTAL_FX, type Callout, type TotalFx } from '../data/spektakel';

// Reine Rechnung für die Grafikstufe Supernova, ohne Pixi und ohne DOM (damit testbar).

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Zustand eines Partikels. Zeiten in ms, Geschwindigkeiten in Einheiten pro Sekunde. */
export interface PState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Schwerkraft (nach unten positiv) und Luftwiderstand (je Sekunde) */
  gravity: number;
  drag: number;
  age: number;
  life: number;
  rot: number;
  vr: number;
  size0: number;
  size1: number;
  alpha: number;
  /** Anteil der Lebensdauer, in dem das Partikel einblendet */
  fadeIn: number;
}

export function newParticle(p: Partial<PState> = {}): PState {
  return { x: 0, y: 0, vx: 0, vy: 0, gravity: 0, drag: 0, age: 0, life: 600, rot: 0, vr: 0, size0: 1, size1: 0, alpha: 1, fadeIn: 0.08, ...p };
}

/** Ein Schritt der Bewegung. Gibt false zurück, sobald das Partikel abgelaufen ist. */
export function stepParticle(p: PState, dtMs: number): boolean {
  p.age += dtMs;
  if (p.age >= p.life) return false;
  const dt = dtMs / 1000;
  const damp = Math.exp(-p.drag * dt);
  p.vx *= damp;
  p.vy = (p.vy + p.gravity * dt) * damp;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.rot += p.vr * dt;
  return true;
}

/** Größe und Deckkraft eines Partikels zum aktuellen Alter */
export function particleLook(p: PState): { scale: number; alpha: number } {
  const k = clamp(p.age / p.life, 0, 1);
  const fade = p.fadeIn > 0 ? Math.min(1, k / p.fadeIn) : 1;
  return { scale: lerp(p.size0, p.size1, 1 - (1 - k) * (1 - k)), alpha: p.alpha * fade * (1 - k * k) };
}

/** Anzahl neuer Partikel: skaliert mit der Dichte (mindestens 1) und gedeckelt durch die Restmenge im Vorrat */
export function scaledCount(n: number, density: number, active: number, max: number = PARTICLES.max): number {
  if (n <= 0) return 0;
  const want = Math.max(1, Math.round(n * clamp(density, 0, 1)));
  return Math.max(0, Math.min(want, max - active));
}

/** Neue Dichte nach einem Messfenster mit mittlerer Bildzeit avgMs */
export function nextDensity(density: number, avgMs: number): number {
  if (avgMs > DENSITY.slowMs) return Math.max(DENSITY.min, density * DENSITY.down);
  if (avgMs < DENSITY.fastMs) return Math.min(DENSITY.max, density * DENSITY.up);
  return density;
}

/** Punkt auf der quadratischen Bezier Kurve von a über c nach b */
export function bezier(ax: number, ay: number, cx: number, cy: number, bx: number, by: number, t: number): { x: number; y: number } {
  const u = 1 - t;
  return { x: u * u * ax + 2 * u * t * cx + t * t * bx, y: u * u * ay + 2 * u * t * cy + t * t * by };
}

/** Kontrollpunkt: Mitte der Strecke, seitlich versetzt um bow mal Streckenlänge (sign wechselt die Seite) */
export function bowControl(ax: number, ay: number, bx: number, by: number, bow: number, sign: 1 | -1): { x: number; y: number } {
  const dx = bx - ax;
  const dy = by - ay;
  return { x: (ax + bx) / 2 - dy * bow * sign, y: (ay + by) / 2 + dx * bow * sign };
}

/** Fortschritt des Orbs entlang der Bahn: langsamer Start, saugender Schluss */
export function orbEase(t: number): number {
  const k = clamp(t, 0, 1);
  return k * k * (1.6 - 0.6 * k);
}

/** Anzahl Orbs für einen Wert: eine plus je Zehnerpotenz, gedeckelt */
export function orbCount(value: number): number {
  if (!(value > 0)) return 0;
  return Math.min(ORB.maxOrbs, 1 + Math.max(0, Math.floor(Math.log10(value))));
}

/** Hitze nach dt Sekunden Abkühlen */
export function coolHeat(heat: number, dtS: number): number {
  return Math.max(0, heat - HEAT.decayPerS * dtS);
}

export function addHeat(heat: number, amount: number): number {
  return Math.min(1, heat + amount);
}

/** Zusatzfaktor für Funkenzahlen bei Hitze (1 bis HEAT.sparkBoost) */
export function heatBoost(heat: number): number {
  return 1 + (HEAT.sparkBoost - 1) * clamp(heat, 0, 1);
}

/** Callout für das Verhältnis Gesamtpunkte durch Ziel, null unter der ersten Schwelle */
export function calloutFor(ratio: number): Callout | null {
  let hit: Callout | null = null;
  for (const c of CALLOUTS) if (ratio >= c.minRatio) hit = c;
  return hit;
}

/** Wirkung der Gesamtpunkte für eine Stufe (Index in SCORE_TIERS), außerhalb des Bereichs wird die nächste Stufe genommen */
export function totalFx(tierIndex: number): TotalFx {
  return TOTAL_FX[clamp(Math.round(tierIndex), 0, TOTAL_FX.length - 1)];
}

/** Schub einer Mote weg vom Zeiger: Richtung und Stärke fallen zum Rand der Reichweite auf 0 */
export function motePush(dx: number, dy: number): { x: number; y: number } {
  const d = Math.hypot(dx, dy);
  if (d >= MOTES.pointerRadius || d < 0.001) return { x: 0, y: 0 };
  const k = 1 - d / MOTES.pointerRadius;
  const f = MOTES.pointerPush * k * k;
  return { x: (dx / d) * f, y: (dy / d) * f };
}
