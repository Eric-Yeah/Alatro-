import { describe, expect, it } from 'vitest';
import { computeView, isPhone } from './viewport';
import { VIEW_H, VIEW_W } from './theme';

/** Bildschirmposition eines Punkts im Spielfeld. */
function toScreen(t: ReturnType<typeof computeView>, px: number, py: number) {
  const c = Math.cos(t.rotation);
  const s = Math.sin(t.rotation);
  const sx = px * t.scale;
  const sy = py * t.scale;
  return { x: t.x + sx * c - sy * s, y: t.y + sx * s + sy * c };
}

describe('viewport', () => {
  it('erkennt Handy und iPad', () => {
    expect(isPhone(390, 844)).toBe(true);
    expect(isPhone(844, 390)).toBe(true);
    expect(isPhone(820, 1180)).toBe(false);
    expect(isPhone(1180, 820)).toBe(false);
  });

  it('Handy im Querformat: keine Drehung, eingepasst', () => {
    const t = computeView(844, 390, true);
    expect(t.rotation).toBe(0);
    expect(t.scale).toBeCloseTo(390 / VIEW_H);
  });

  it('Handy im Hochformat: um 90 Grad gedreht, Spielfeld liegt komplett im Fenster', () => {
    const t = computeView(390, 844, true);
    expect(t.rotation).toBeCloseTo(Math.PI / 2);
    const corners = [[0, 0], [VIEW_W, 0], [0, VIEW_H], [VIEW_W, VIEW_H]].map(([x, y]) => toScreen(t, x, y));
    for (const p of corners) {
      expect(p.x).toBeGreaterThanOrEqual(-0.001);
      expect(p.x).toBeLessThanOrEqual(390.001);
      expect(p.y).toBeGreaterThanOrEqual(-0.001);
      expect(p.y).toBeLessThanOrEqual(844.001);
    }
    // Oben im Spiel liegt rechts auf dem Bildschirm, links im Spiel liegt oben.
    expect(toScreen(t, 0, 0).x).toBeGreaterThan(toScreen(t, 0, VIEW_H).x);
    expect(toScreen(t, 0, 0).y).toBeLessThan(toScreen(t, VIEW_W, 0).y);
  });

  it('iPad im Hochformat bleibt ungedreht', () => {
    const t = computeView(820, 1180, false);
    expect(t.rotation).toBe(0);
    expect(t.scale).toBeCloseTo(820 / VIEW_W);
  });

  it('sichere Ränder: das Spielfeld liegt innerhalb der Ränder und bleibt mittig', () => {
    const insets = { top: 24, right: 0, bottom: 20, left: 0 };
    const t = computeView(1194, 834, false, insets);
    expect(t.y).toBeGreaterThanOrEqual(insets.top);
    expect(t.y + VIEW_H * t.scale).toBeLessThanOrEqual(834 - insets.bottom + 1e-6);
    expect(t.scale).toBeLessThan(computeView(1194, 834, false).scale);
    expect(t.x + (VIEW_W * t.scale) / 2).toBeCloseTo(1194 / 2);
  });
});
