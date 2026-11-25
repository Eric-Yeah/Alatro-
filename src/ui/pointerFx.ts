import { POINTER } from '../data/spektakel';
import { sparkColors } from './cosmeticFx';
import type { Particles } from './particles';

// Zeiger Effekte der Grafikstufe Supernova: Sternenstaub Spur hinter Finger und Maus, Funken beim Tippen (keine Ringe).
// Dazu der gemeinsame Zeigerzustand, den Hintergrund und Staubwolke lesen.

export const pointer = {
  /** Position in Spielfeld Koordinaten (Ebene der Partikel) */
  x: 720,
  y: 500,
  /** Position auf dem Bildschirm als Anteil 0 bis 1 (für den Hintergrund Shader) */
  u: 0.5,
  v: 0.5,
  /** Zeiger gilt als anwesend: Maus im Fenster oder Finger auf dem Glas (plus kurze Nachlaufzeit) */
  active: false,
  down: false,
};

/** Wandelt eine globale Bildschirm Position in Spielfeld Koordinaten (wird vom Spiel gesetzt) */
let toLocalFn: ((x: number, y: number) => { x: number; y: number }) | null = null;

export function setPointerSpace(fn: (x: number, y: number) => { x: number; y: number }) {
  toLocalFn = fn;
}

export class PointerFx {
  private lastX = 0;
  private lastY = 0;
  private hasLast = false;
  private carry = 0;
  private frameBudget = POINTER.trailPerFrame;
  private color = 0;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private particles: Particles,
    private enabled: () => boolean,
  ) {}

  attach() {
    if (typeof window === 'undefined') return;
    window.addEventListener('pointermove', (e) => this.move(e), { passive: true });
    window.addEventListener('pointerdown', (e) => this.press(e), { passive: true, capture: true });
    const up = (e: PointerEvent) => this.release(e);
    window.addEventListener('pointerup', up, { passive: true, capture: true });
    window.addEventListener('pointercancel', up, { passive: true, capture: true });
    document.addEventListener('mouseleave', () => { if (!pointer.down) this.leave(); });
  }

  /** Einmal je Bild: Budget der Spurpunkte zurücksetzen */
  frame() {
    this.frameBudget = POINTER.trailPerFrame;
  }

  private place(e: PointerEvent) {
    const p = toLocalFn ? toLocalFn(e.clientX, e.clientY) : { x: e.clientX, y: e.clientY };
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.u = e.clientX / Math.max(1, window.innerWidth);
    pointer.v = e.clientY / Math.max(1, window.innerHeight);
    return p;
  }

  private leave() {
    pointer.active = false;
    this.hasLast = false;
  }

  private move(e: PointerEvent) {
    if (!this.enabled()) { pointer.active = false; return; }
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null; }
    pointer.active = true;
    const p = this.place(e);
    if (!this.hasLast) {
      this.lastX = p.x;
      this.lastY = p.y;
      this.hasLast = true;
      return;
    }
    // Spur: Punkte im festen Abstand entlang der Bewegung
    const dx = p.x - this.lastX;
    const dy = p.y - this.lastY;
    const dist = Math.hypot(dx, dy);
    this.lastX = p.x;
    this.lastY = p.y;
    if (dist < 0.5) return;
    this.carry += dist;
    const step = POINTER.trailEveryPx;
    let used = 0;
    while (this.carry >= step && this.frameBudget > 0) {
      this.carry -= step;
      this.frameBudget--;
      used++;
      // Punkt liegt um den Rest (carry) vor dem Ende der Bewegung
      this.dust(p.x - (dx / dist) * this.carry, p.y - (dy / dist) * this.carry, dx / dist, dy / dist);
    }
    if (used === 0 && this.frameBudget <= 0) this.carry = Math.min(this.carry, step);
  }

  private dust(x: number, y: number, dirX: number, dirY: number) {
    if (this.particles.count(1) <= 0) return;
    const colors = sparkColors(POINTER.trailColors);
    this.color = (this.color + 1) % colors.length;
    const color = colors[this.color];
    const [l0, l1] = POINTER.trailLife;
    const [s0, s1] = POINTER.trailSize;
    const size = s0 + Math.random() * (s1 - s0);
    const spark = Math.random() < 0.28;
    this.particles.spawn(spark ? 'spark' : 'glow', {
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      // etwas gegen die Bewegungsrichtung und nach oben, wie Staub in der Luft
      vx: -dirX * 22 + (Math.random() - 0.5) * 36,
      vy: -dirY * 22 - 14 + (Math.random() - 0.5) * 30,
      drag: 1.6,
      gravity: -8,
      life: l0 + Math.random() * (l1 - l0),
      rot: Math.random() * 6.28,
      vr: (Math.random() - 0.5) * 3,
    }, color, { from: (spark ? 14 : 34) * size, to: spark ? 4 : 6 });
  }

  private press(e: PointerEvent) {
    if (!this.enabled()) return;
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null; }
    pointer.down = true;
    pointer.active = true;
    const p = this.place(e);
    this.lastX = p.x;
    this.lastY = p.y;
    this.hasLast = true;
    this.carry = 0;
    const n = this.particles.count(POINTER.tapSparks);
    const tapColors = sparkColors(POINTER.trailColors);
    const [v0, v1] = POINTER.tapSpeed;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const v = v0 + Math.random() * (v1 - v0);
      this.particles.spawn('spark', {
        x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 4, life: 360 + Math.random() * 240,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 6,
      }, tapColors[i % tapColors.length], { from: 18, to: 5 });
    }
  }

  private release(e: PointerEvent) {
    pointer.down = false;
    if (e.pointerType === 'mouse') return;
    // Finger: nach kurzer Nachlaufzeit gilt der Zeiger als weg (Karten setzen sich, Staub kehrt zurück)
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.hasLast = false;
    this.holdTimer = setTimeout(() => { if (!pointer.down) pointer.active = false; }, POINTER.holdMs);
  }
}
