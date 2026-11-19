import { describe, expect, it } from 'vitest';
import { CONS_TRAY, CT_H, CT_SCALE, CT_W } from './data/consumableArt';
import { trayLayout } from './ui/consumableTray';

// Prüft die Anordnung der Consumable Karten in der Leiste (1 bis 6 Karten, Fach 260 breit und 180 hoch).

const CX = 1290, W = 260, CY = 118, TOP = 24, H = 180;

describe('Consumable Leiste', () => {
  it('eine oder zwei Karten stehen in voller Größe nebeneinander', () => {
    for (const n of [1, 2]) {
      const s = trayLayout(n, CX, W, CY);
      expect(s).toHaveLength(n);
      for (const k of s) expect(k.scale).toBe(1);
      if (n === 2) expect(s[1].x - s[0].x).toBeGreaterThanOrEqual(CT_W * CT_SCALE);
    }
  });

  it('ab drei Karten sind sie verkleinert, überlappen sich nicht waagerecht und liegen im Fach', () => {
    for (const n of [3, 4, 5, 6]) {
      const s = trayLayout(n, CX, W, CY);
      expect(s).toHaveLength(n);
      const w = CT_W * CT_SCALE * CONS_TRAY.compactScale, h = CT_H * CT_SCALE * CONS_TRAY.compactScale;
      for (const k of s) {
        expect(k.scale).toBe(CONS_TRAY.compactScale);
        expect(k.x - w / 2, `links, n=${n}`).toBeGreaterThanOrEqual(CX - W / 2);
        expect(k.x + w / 2, `rechts, n=${n}`).toBeLessThanOrEqual(CX + W / 2);
        expect(k.y - h / 2, `oben, n=${n}`).toBeGreaterThanOrEqual(TOP);
        expect(k.y + h / 2, `unten, n=${n}`).toBeLessThanOrEqual(TOP + H);
      }
      // in einer Reihe nie überlappend
      for (const a of s) for (const b of s) if (a !== b && a.y === b.y) expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(w);
    }
  });

  it('vier bis sechs Karten legen sich in zwei Reihen, die obere zuerst', () => {
    const s = trayLayout(5, CX, W, CY);
    expect(new Set(s.map((k) => k.y)).size).toBe(2);
    expect(s.slice(0, 3).every((k) => k.y === s[0].y)).toBe(true);
    expect(s[3].y).toBeGreaterThan(s[0].y);
  });
});
