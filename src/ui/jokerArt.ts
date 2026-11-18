import { Graphics } from 'pixi.js';

// Eigene Embleme für Jokers im Thema Sternwarte der Alchemisten.
// Das Symbol wird aus der Joker ID abgeleitet, so bekommt jeder Joker (auch neue aus M3) ein Bild.

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

type Symbol = (g: Graphics, r: number, ink: number, line: number) => void;

const star: Symbol = (g, r, ink, line) => {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.42;
    pts.push(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  g.poly(pts).fill(ink).stroke({ width: line, color: 0x1b1530, join: 'round' });
};

const crescent: Symbol = (g, r, ink, line) => {
  // Sichel aus dem äußeren Kreis ohne den versetzten inneren Kreis, als Polygon berechnet
  const d = r * 0.45;
  const ri = r * 0.82;
  const N = 56;
  const pts: number[] = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (Math.hypot(x - d, y) > ri) pts.push(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const b = (i / N) * Math.PI * 2;
    const x = d + Math.cos(b) * ri, y = Math.sin(b) * ri;
    if (Math.hypot(x, y) < r) pts.push(x, y);
  }
  g.poly(pts).fill(ink).stroke({ width: line, color: 0x1b1530, join: 'round' });
  g.circle(-r * 0.05, -r * 0.7, r * 0.1).fill(ink);
};

const flask: Symbol = (g, r, ink, line) => {
  g.poly([-r * 0.18, -r, r * 0.18, -r, r * 0.18, -r * 0.35, r * 0.85, r * 0.8, -r * 0.85, r * 0.8, -r * 0.18, -r * 0.35])
    .fill(ink).stroke({ width: line, color: 0x1b1530, join: 'round' });
  g.poly([-r * 0.55, r * 0.3, r * 0.55, r * 0.3, r * 0.7, r * 0.65, -r * 0.7, r * 0.65]).fill({ color: 0x1b1530, alpha: 0.35 });
  g.circle(-r * 0.1, r * 0.05, r * 0.08).fill(0x1b1530);
  g.circle(r * 0.18, r * 0.35, r * 0.06).fill(0x1b1530);
};

const eye: Symbol = (g, r, ink, line) => {
  g.moveTo(-r, 0).quadraticCurveTo(0, -r * 0.95, r, 0).quadraticCurveTo(0, r * 0.95, -r, 0)
    .fill(ink).stroke({ width: line, color: 0x1b1530, join: 'round' });
  g.circle(0, 0, r * 0.42).fill(0x1b1530);
  g.circle(-r * 0.12, -r * 0.12, r * 0.12).fill(ink);
};

const sun: Symbol = (g, r, ink, line) => {
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62).lineTo(Math.cos(a) * r, Math.sin(a) * r).stroke({ width: line + 2, color: ink, cap: 'round' });
  }
  g.circle(0, 0, r * 0.5).fill(ink).stroke({ width: line, color: 0x1b1530 });
  g.circle(0, 0, r * 0.14).fill(0x1b1530);
};

const hourglass: Symbol = (g, r, ink, line) => {
  g.poly([-r * 0.7, -r, r * 0.7, -r, r * 0.08, 0, r * 0.7, r, -r * 0.7, r, -r * 0.08, 0])
    .fill(ink).stroke({ width: line, color: 0x1b1530, join: 'round' });
  g.poly([-r * 0.38, -r * 0.7, r * 0.38, -r * 0.7, 0, -r * 0.1]).fill({ color: 0x1b1530, alpha: 0.4 });
  g.poly([-r * 0.45, r * 0.85, r * 0.45, r * 0.85, 0, r * 0.35]).fill({ color: 0x1b1530, alpha: 0.4 });
};

const orbit: Symbol = (g, r, ink, line) => {
  g.ellipse(0, 0, r, r * 0.38).stroke({ width: line + 1, color: ink });
  g.ellipse(0, 0, r * 0.38, r).stroke({ width: line + 1, color: ink, alpha: 0.6 });
  g.circle(0, 0, r * 0.3).fill(ink).stroke({ width: line, color: 0x1b1530 });
  g.circle(r * 0.88, -r * 0.1, r * 0.12).fill(ink).stroke({ width: 2, color: 0x1b1530 });
};

const rune: Symbol = (g, r, ink, line) => {
  g.poly([0, -r, r * 0.9, r * 0.45, -r * 0.9, r * 0.45]).fill(ink).stroke({ width: line, color: 0x1b1530, join: 'round' });
  g.moveTo(0, r * 0.45).lineTo(0, r).stroke({ width: line + 1, color: ink, cap: 'round' });
  g.moveTo(-r * 0.35, r * 0.75).lineTo(r * 0.35, r * 0.75).stroke({ width: line + 1, color: ink, cap: 'round' });
  g.circle(0, -r * 0.05, r * 0.12).fill(0x1b1530);
};

const SYMBOLS: Symbol[] = [star, crescent, flask, eye, sun, hourglass, orbit, rune];

/** Zeichnet Sternenhimmel und Emblem eines Jokers in das Feld mit Radius r um (0, 0). */
export function drawJokerArt(g: Graphics, defId: string, fieldW: number, fieldH: number, r: number) {
  const h = hash(defId);
  // Sterne im Feld, fest aus der ID abgeleitet
  let s = h;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 9; i++) {
    const x = (rnd() - 0.5) * (fieldW - 18);
    const y = (rnd() - 0.5) * (fieldH - 18);
    g.circle(x, y, 0.8 + rnd() * 1.4).fill({ color: 0xffffff, alpha: 0.35 + rnd() * 0.4 });
  }
  g.circle(0, 0, r + 8).fill({ color: 0xffffff, alpha: 0.16 });
  g.circle(0, 0, r + 8).stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
  SYMBOLS[(h >>> 4) % SYMBOLS.length](g, r, 0xfff3d1, 3);
}
