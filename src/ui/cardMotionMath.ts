import { FLOAT_ROT_PERIOD_FACTOR, type FloatSpec } from '../data/cardMotion';

// Reine Mathematik der Kartenbewegung (ohne DOM und Pixi, getestet in cardMotionMath.test.ts).

/** Stabiler Zufallswert in [0, 1) aus einer ganzen Zahl (Karten ID, Joker UID). Gleiche Eingabe, gleicher Wert. */
export function hash01(n: number, salt = 0): number {
  let h = (Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) + Math.imul((salt | 0) + 0x27d4eb2f, 0xc2b2ae35)) | 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export interface FloatOffset {
  /** Verschiebung nach unten in Pixeln (negativ = nach oben) */
  y: number;
  /** Drehung in Radiant */
  rot: number;
}

/**
 * Schwebe Versatz zu einem Zeitpunkt. timeMs ist die laufende Zeit, seed bestimmt Phase und Periode der Karte.
 * strength skaliert beides (0 = ruhig, 1 = voll), z. B. für das Einblenden oder die Grafikstufe.
 */
export function floatOffset(timeMs: number, seed: number, spec: FloatSpec, strength = 1): FloatOffset {
  const period = (spec.periodMin + (spec.periodMax - spec.periodMin) * hash01(seed, 1)) * 1000;
  const phase = hash01(seed, 2) * Math.PI * 2;
  const phaseRot = hash01(seed, 3) * Math.PI * 2;
  const w = (Math.PI * 2 * timeMs) / period;
  return {
    y: spec.ampY * strength * Math.sin(w + phase),
    rot: spec.ampRot * strength * Math.sin(w / FLOAT_ROT_PERIOD_FACTOR + phaseRot),
  };
}

/** Einblenden des Schwebens: 0 bis 1 über rampMs, weich */
export function floatRamp(ageMs: number, rampMs: number): number {
  if (rampMs <= 0) return 1;
  const k = Math.min(1, Math.max(0, ageMs / rampMs));
  return k * k * (3 - 2 * k);
}

/** Auslaufen mit kleinem Überschwingen am Ende. Mit s = 0 ist es genau easeOutCubic, ohne Überschwingen. */
export function easeOutOvershoot(t: number, s: number): number {
  const u = t - 1;
  return 1 + (s + 1) * u * u * u + s * u * u;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Punkt auf einem Bogen von a nach b (quadratische Kurve). Der Bogen wölbt sich nach oben (kleineres y),
 * die Höhe wächst mit der Strecke bis lift. t darf über 1 hinausgehen (Überschwingen), die Kurve setzt sich dann fort.
 */
export function arcPoint(a: Point, b: Point, t: number, lift: number, fullDist: number): Point {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const h = lift * Math.min(1, dist / Math.max(1, fullDist));
  // Normale zur Strecke, so gewählt, dass sie nach oben zeigt
  let nx = dy, ny = -dx;
  if (dist > 0) { nx /= dist; ny /= dist; }
  if (ny > 0) { nx = -nx; ny = -ny; }
  const cx = (a.x + b.x) / 2 + nx * h * 2;
  const cy = (a.y + b.y) / 2 + ny * h * 2;
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
    y: u * u * a.y + 2 * u * t * cy + t * t * b.y,
  };
}

export interface FlipState {
  /** Breitenfaktor 0 bis 1 (Karte steht in der Mitte des Umdrehens quer) */
  scaleX: number;
  /** Zeigt die Karte gerade ihre zweite Seite (nach der Hälfte des Umdrehens)? */
  second: boolean;
}

/** Umdrehen über das Zeitfenster [start, end] der Flugzeit: Breite fällt auf 0, wechselt die Seite und kehrt zurück. */
export function flipState(t: number, start: number, end: number): FlipState {
  if (t <= start) return { scaleX: 1, second: false };
  if (t >= end) return { scaleX: 1, second: true };
  const k = (t - start) / (end - start);
  return { scaleX: Math.abs(Math.cos(Math.PI * k)), second: k >= 0.5 };
}

/** Kurzes Pulsieren der Größe zum Einrasten: 1 vor from, danach ein Halbsinus bis 1 + amp und zurück auf 1 bei t = 1 */
export function snapPulse(t: number, from: number, amp: number): number {
  if (t <= from || t >= 1) return 1;
  return 1 + amp * Math.sin(Math.PI * ((t - from) / (1 - from)));
}

/** Startzeitpunkte (ms) der Karten: erste bei 0, jede Lücke ist gap * factor der vorigen, aber mindestens minGap */
export function staggerDelays(n: number, firstGap: number, factor: number, minGap: number): number[] {
  const out: number[] = [];
  let at = 0;
  let gap = firstGap;
  for (let i = 0; i < n; i++) {
    out.push(at);
    at += gap;
    gap = Math.max(minGap, gap * factor);
  }
  return out;
}

/** Gesamtdauer von Beginn bis zur Landung der letzten Karte */
export function staggerTotal(n: number, flightMs: number, firstGap: number, factor: number, minGap: number): number {
  if (n <= 0) return 0;
  return staggerDelays(n, firstGap, factor, minGap)[n - 1] + flightMs;
}

/** Wird die Karte mit diesem Index in der Gruppe der Größe n mit Ton begleitet? (Bei großen Gruppen nur jede zweite) */
export function playsSound(i: number, n: number, everyAbove: number): boolean {
  return n <= everyAbove || i % 2 === 0;
}
