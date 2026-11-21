import { describe, expect, it } from 'vitest';
import { CARD_FLOAT, COLLECT, DEAL, FLOAT_QUALITY } from '../data/cardMotion';
import {
  arcPoint, easeOutOvershoot, flipState, floatOffset, floatRamp, hash01, playsSound, snapPulse, staggerDelays, staggerTotal,
} from './cardMotionMath';

describe('hash01', () => {
  it('ist deterministisch und liegt in [0, 1)', () => {
    for (let i = -50; i < 200; i++) {
      const a = hash01(i, 3);
      expect(a).toBe(hash01(i, 3));
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(1);
    }
  });
  it('streut: benachbarte IDs ergeben verschiedene Werte', () => {
    const set = new Set<number>();
    for (let i = 0; i < 52; i++) set.add(hash01(i, 2));
    expect(set.size).toBe(52);
  });
});

describe('floatOffset', () => {
  it('bleibt in den Grenzen der Amplitude für alle Kartenarten', () => {
    for (const spec of Object.values(CARD_FLOAT)) {
      for (let seed = 0; seed < 40; seed++) {
        for (let t = 0; t < 20000; t += 137) {
          const o = floatOffset(t, seed, spec);
          expect(Math.abs(o.y)).toBeLessThanOrEqual(spec.ampY + 1e-9);
          expect(Math.abs(o.rot)).toBeLessThanOrEqual(spec.ampRot + 1e-9);
        }
      }
    }
  });
  it('hält die Richtwerte ein: höchstens 4 Pixel, 0,01 Radiant, Perioden 2,5 bis 4 Sekunden', () => {
    for (const spec of Object.values(CARD_FLOAT)) {
      expect(spec.ampY).toBeGreaterThanOrEqual(2);
      expect(spec.ampY).toBeLessThanOrEqual(4);
      expect(spec.ampRot).toBeLessThanOrEqual(0.01);
      expect(spec.periodMin).toBeGreaterThanOrEqual(2.5);
      expect(spec.periodMax).toBeLessThanOrEqual(4);
    }
  });
  it('gleiche Karte, gleiche Zeit, gleicher Wert; andere Karte, andere Phase', () => {
    const spec = CARD_FLOAT.hand;
    expect(floatOffset(1234, 7, spec)).toEqual(floatOffset(1234, 7, spec));
    const a = floatOffset(1000, 1, spec).y;
    const b = floatOffset(1000, 2, spec).y;
    expect(a).not.toBeCloseTo(b, 3);
  });
  it('ist periodisch mit der Periode der Karte', () => {
    const spec = CARD_FLOAT.joker;
    const period = (spec.periodMin + (spec.periodMax - spec.periodMin) * hash01(5, 1)) * 1000;
    expect(floatOffset(300 + period, 5, spec).y).toBeCloseTo(floatOffset(300, 5, spec).y, 6);
  });
  it('Stärke 0 ergibt keinen Versatz, Stärke skaliert linear', () => {
    const spec = CARD_FLOAT.hand;
    const none = floatOffset(777, 3, spec, 0);
    expect(Math.abs(none.y)).toBe(0);
    expect(Math.abs(none.rot)).toBe(0);
    const full = floatOffset(777, 3, spec, 1);
    const half = floatOffset(777, 3, spec, 0.5);
    expect(half.y).toBeCloseTo(full.y / 2, 9);
    expect(half.rot).toBeCloseTo(full.rot / 2, 9);
  });
  it('Grafikstufe Sparsam schaltet das Schweben ab', () => {
    expect(FLOAT_QUALITY.sparsam).toBe(0);
    expect(FLOAT_QUALITY.voll).toBe(1);
  });
  it('die Bewegung ist stetig (kein Sprung zwischen Frames)', () => {
    const spec = CARD_FLOAT.hand;
    let prev = floatOffset(0, 9, spec).y;
    for (let t = 16; t < 8000; t += 16) {
      const y = floatOffset(t, 9, spec).y;
      expect(Math.abs(y - prev)).toBeLessThan(0.15);
      prev = y;
    }
  });
});

describe('floatRamp', () => {
  it('geht weich von 0 auf 1', () => {
    expect(floatRamp(0, 600)).toBe(0);
    expect(floatRamp(600, 600)).toBe(1);
    expect(floatRamp(9999, 600)).toBe(1);
    expect(floatRamp(300, 600)).toBeCloseTo(0.5, 9);
    expect(floatRamp(100, 0)).toBe(1);
  });
});

describe('easeOutOvershoot', () => {
  it('startet bei 0, endet bei 1', () => {
    expect(easeOutOvershoot(0, DEAL.overshoot)).toBeCloseTo(0, 9);
    expect(easeOutOvershoot(1, DEAL.overshoot)).toBeCloseTo(1, 9);
  });
  it('schwingt nur wenig über (unter 6 Prozent) und kehrt zurück', () => {
    let max = 0;
    for (let t = 0; t <= 1; t += 0.005) max = Math.max(max, easeOutOvershoot(t, DEAL.overshoot));
    expect(max).toBeGreaterThan(1);
    expect(max).toBeLessThan(1.06);
  });
  it('ohne Überschwingen ist es easeOutCubic', () => {
    expect(easeOutOvershoot(0.5, 0)).toBeCloseTo(1 - Math.pow(0.5, 3), 9);
  });
});

describe('arcPoint', () => {
  const a = { x: 1370, y: 785 };
  const b = { x: 400, y: 775 };
  it('trifft Start und Ziel genau', () => {
    const p0 = arcPoint(a, b, 0, 95, 700);
    const p1 = arcPoint(a, b, 1, 95, 700);
    expect(p0.x).toBeCloseTo(a.x, 9);
    expect(p0.y).toBeCloseTo(a.y, 9);
    expect(p1.x).toBeCloseTo(b.x, 9);
    expect(p1.y).toBeCloseTo(b.y, 9);
  });
  it('wölbt sich nach oben, nicht auf der geraden Linie', () => {
    const mid = arcPoint(a, b, 0.5, 95, 700);
    const lineY = (a.y + b.y) / 2;
    expect(mid.y).toBeLessThan(lineY - 80);
    expect(mid.y).toBeGreaterThan(lineY - 100);
  });
  it('wölbt sich auch nach oben, wenn die Richtung umgekehrt ist', () => {
    const mid = arcPoint(b, a, 0.5, 95, 700);
    expect(mid.y).toBeLessThan((a.y + b.y) / 2 - 80);
  });
  it('kurze Strecken bekommen einen flacheren Bogen', () => {
    const near = { x: a.x - 100, y: a.y };
    const mid = arcPoint(a, near, 0.5, 95, 700);
    expect(a.y - mid.y).toBeLessThan(20);
  });
  it('lift 0 ergibt eine gerade Linie', () => {
    const mid = arcPoint(a, b, 0.5, 0, 700);
    expect(mid.x).toBeCloseTo((a.x + b.x) / 2, 9);
    expect(mid.y).toBeCloseTo((a.y + b.y) / 2, 9);
  });
  it('gleiche Position bei Strecke 0 ohne Fehler', () => {
    const p = arcPoint(a, a, 0.5, 95, 700);
    expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
  });
});

describe('flipState', () => {
  it('vor dem Fenster volle Breite erste Seite, danach volle Breite zweite Seite', () => {
    expect(flipState(0, 0.2, 0.6)).toEqual({ scaleX: 1, second: false });
    expect(flipState(1, 0.2, 0.6)).toEqual({ scaleX: 1, second: true });
  });
  it('in der Mitte steht die Karte quer und wechselt die Seite', () => {
    const mid = flipState(0.4, 0.2, 0.6);
    expect(mid.scaleX).toBeCloseTo(0, 6);
    expect(flipState(0.39, 0.2, 0.6).second).toBe(false);
    expect(flipState(0.41, 0.2, 0.6).second).toBe(true);
  });
  it('die Breite liegt immer zwischen 0 und 1', () => {
    for (let t = 0; t <= 1; t += 0.01) {
      const f = flipState(t, DEAL.flipStart, DEAL.flipEnd);
      expect(f.scaleX).toBeGreaterThanOrEqual(0);
      expect(f.scaleX).toBeLessThanOrEqual(1);
    }
  });
});

describe('snapPulse', () => {
  it('ist 1 außerhalb des Fensters und erreicht amp in der Mitte', () => {
    expect(snapPulse(0.5, 0.8, 0.05)).toBe(1);
    expect(snapPulse(1, 0.8, 0.05)).toBe(1);
    expect(snapPulse(0.9, 0.8, 0.05)).toBeCloseTo(1.05, 9);
  });
});

describe('Staffelung', () => {
  it('erste Karte startet bei 0, jede Lücke ist kleiner oder gleich der vorigen', () => {
    const d = staggerDelays(8, DEAL.firstGapMs, DEAL.gapFactor, DEAL.minGapMs);
    expect(d[0]).toBe(0);
    for (let i = 2; i < d.length; i++) expect(d[i] - d[i - 1]).toBeLessThanOrEqual(d[i - 1] - d[i - 2] + 1e-9);
  });
  it('die Lücke fällt nie unter das Minimum', () => {
    const d = staggerDelays(40, 80, 0.5, 30);
    for (let i = 1; i < d.length; i++) expect(d[i] - d[i - 1]).toBeGreaterThanOrEqual(30 - 1e-9);
  });
  it('Austeilen von 8 Karten dauert etwa 0,8 bis 1,1 Sekunden samt Pause', () => {
    const total = staggerTotal(8, DEAL.flightMs, DEAL.firstGapMs, DEAL.gapFactor, DEAL.minGapMs) + DEAL.settleMs;
    expect(total).toBeGreaterThanOrEqual(800);
    expect(total).toBeLessThanOrEqual(1100);
  });
  it('Nachziehen und Einziehen bleiben flott', () => {
    expect(staggerTotal(5, DEAL.flightMs, DEAL.firstGapMs, DEAL.gapFactor, DEAL.minGapMs)).toBeLessThan(900);
    expect(staggerTotal(8, COLLECT.flightMs, COLLECT.firstGapMs, COLLECT.gapFactor, COLLECT.minGapMs)).toBeLessThan(800);
    expect(staggerTotal(0, 500, 80, 0.9, 30)).toBe(0);
  });
});

describe('playsSound', () => {
  it('kleine Gruppen: jede Karte, große Gruppen: jede zweite', () => {
    expect([0, 1, 2].map((i) => playsSound(i, 3, 8))).toEqual([true, true, true]);
    expect([0, 1, 2, 3].map((i) => playsSound(i, 9, 8))).toEqual([true, false, true, false]);
  });
});
