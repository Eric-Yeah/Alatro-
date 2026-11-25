import { describe, expect, it } from 'vitest';
import { SHADOW } from '../data/depth';
import { lighten, mixColor, pickRadius, sdRoundRect, shadowAlphaGrid, shadowDims, softEdge } from './depthMath';

describe('depthMath', () => {
  it('mischt und hellt Farben auf', () => {
    expect(mixColor(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    expect(mixColor(0xff0000, 0x0000ff, 0)).toBe(0xff0000);
    expect(lighten(0x102030, 0)).toBe(0x102030);
    expect(lighten(0x102030, 1)).toBe(0xffffff);
  });

  it('Abstand zum Rechteck: innen negativ, außen positiv, Ecken rund', () => {
    expect(sdRoundRect(0, 0, 50, 30, 8)).toBeLessThan(0);
    expect(sdRoundRect(60, 0, 50, 30, 8)).toBeCloseTo(10, 5);
    // an der Ecke liegt der Punkt weiter außen als bei einer scharfen Ecke
    expect(sdRoundRect(50, 30, 50, 30, 8)).toBeGreaterThan(0);
  });

  it('weicher Rand fällt gleichmäßig von 1 auf 0', () => {
    expect(softEdge(-100, 10)).toBe(1);
    expect(softEdge(100, 10)).toBe(0);
    expect(softEdge(0, 10)).toBeCloseTo(0.5, 5);
    let last = 1;
    for (let d = -20; d <= 20; d += 2) {
      const a = softEdge(d, 10);
      expect(a).toBeLessThanOrEqual(last);
      last = a;
    }
  });

  it('Schatten Gitter: Mitte deckend, Rand leer, symmetrisch', () => {
    for (const r of SHADOW.radii) {
      const { size, slice, alpha } = shadowAlphaGrid(r, 12, SHADOW.core);
      const dims = shadowDims(r, 12, SHADOW.core);
      expect(size).toBe(dims.size);
      expect(slice).toBe(dims.slice);
      const mid = Math.floor(size / 2);
      expect(alpha[mid * size + mid]).toBeGreaterThan(240);
      expect(alpha[0]).toBe(0);
      expect(alpha[mid * size + 1]).toBeLessThan(8);
      // gespiegelt links und rechts
      expect(alpha[mid * size + 5]).toBe(alpha[mid * size + (size - 1 - 5)]);
      // Neun Teile Rand liegt vor der Mitte
      expect(slice * 2).toBeLessThan(size);
    }
  });

  it('wählt den passenden Radius und deckelt ihn an der Größe', () => {
    const allowed = SHADOW.radii;
    expect(pickRadius(8, 200, 100, allowed)).toBe(8);
    expect(pickRadius(10, 200, 100, allowed)).toBeGreaterThanOrEqual(8);
    expect(pickRadius(30, 20, 20, allowed)).toBeLessThanOrEqual(10);
    expect(pickRadius(30, 400, 400, allowed)).toBe(30);
  });
});
