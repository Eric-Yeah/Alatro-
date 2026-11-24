import { describe, expect, it } from 'vitest';
import { SCORE_TIERS, QUALITY_IDS, QUALITY_NAMES, QUALITY_PROFILE } from '../data/juice';
import { CALLOUTS, DENSITY, HEAT, MOTES, ORB, PARTICLES, POINTER, TOTAL_FX } from '../data/spektakel';
import { FLOAT_QUALITY } from '../data/cardMotion';
import { parseSettings } from '../settings';
import {
  addHeat, bezier, bowControl, calloutFor, coolHeat, ease, heatBoost, motePush, nearEffect, newParticle,
  nextDensity, orbCount, orbEase, particleLook, scaledCount, stepParticle, totalFx,
} from './spektakelMath';

describe('Supernova: Grafikstufe', () => {
  it('Einstellung kennt drei Stufen, Unbekanntes fällt auf Voll', () => {
    expect(parseSettings({ quality: 'supernova' }).quality).toBe('supernova');
    expect(parseSettings({ quality: 'sparsam' }).quality).toBe('sparsam');
    expect(parseSettings({ quality: 'ultra' }).quality).toBe('voll');
    expect(QUALITY_IDS).toEqual(['sparsam', 'voll', 'supernova']);
    expect(Object.keys(QUALITY_NAMES).sort()).toEqual([...QUALITY_IDS].sort());
  });

  it('Supernova ist Voll plus Spektakel, die anderen Stufen haben keins', () => {
    const { voll, sparsam, supernova } = QUALITY_PROFILE;
    expect(supernova.spektakel).toBe(true);
    expect(voll.spektakel).toBe(false);
    expect(sparsam.spektakel).toBe(false);
    expect({ ...supernova, spektakel: false }).toEqual(voll);
    expect(FLOAT_QUALITY.supernova).toBeGreaterThanOrEqual(FLOAT_QUALITY.voll);
  });

  it('Wirkung der Gesamtpunkte wächst mit der Stufe und hat für jede Stufe einen Eintrag', () => {
    expect(TOTAL_FX).toHaveLength(SCORE_TIERS.length);
    for (let i = 1; i < TOTAL_FX.length; i++) {
      for (const key of ['rings', 'bursts', 'punch', 'aberration', 'confetti'] as const) {
        expect(TOTAL_FX[i][key], `${key} bei Stufe ${i}`).toBeGreaterThanOrEqual(TOTAL_FX[i - 1][key]);
      }
    }
    expect(totalFx(-3)).toBe(TOTAL_FX[0]);
    expect(totalFx(99)).toBe(TOTAL_FX[TOTAL_FX.length - 1]);
  });
});

describe('Supernova: Partikel', () => {
  it('bewegt sich mit Geschwindigkeit, Schwerkraft und Luftwiderstand und endet nach der Lebensdauer', () => {
    const p = newParticle({ vx: 100, vy: -200, gravity: 400, life: 1000 });
    expect(stepParticle(p, 100)).toBe(true);
    expect(p.x).toBeCloseTo(10, 5);
    expect(p.vy).toBeGreaterThan(-200);
    const q = newParticle({ vx: 100, drag: 3, life: 1000 });
    stepParticle(q, 100);
    expect(q.vx).toBeLessThan(100);
    expect(q.vx).toBeGreaterThan(0);
    expect(stepParticle(newParticle({ life: 300 }), 300)).toBe(false);
  });

  it('Aussehen: blendet ein, schrumpft und verblasst zum Ende', () => {
    const p = newParticle({ life: 1000, size0: 2, size1: 0, fadeIn: 0.2 });
    p.age = 10;
    const start = particleLook(p);
    p.age = 300;
    const mid = particleLook(p);
    p.age = 990;
    const end = particleLook(p);
    expect(start.alpha).toBeLessThan(mid.alpha);
    expect(end.alpha).toBeLessThan(0.05);
    expect(start.scale).toBeGreaterThan(mid.scale);
    expect(mid.scale).toBeGreaterThan(end.scale);
  });

  it('Anzahl: skaliert mit der Dichte, mindestens eins, nie über den Deckel', () => {
    expect(scaledCount(20, 1, 0)).toBe(20);
    expect(scaledCount(20, 0.5, 0)).toBe(10);
    expect(scaledCount(2, 0.1, 0)).toBe(1);
    expect(scaledCount(0, 1, 0)).toBe(0);
    expect(scaledCount(50, 1, PARTICLES.max - 7)).toBe(7);
    expect(scaledCount(50, 1, PARTICLES.max)).toBe(0);
    expect(scaledCount(10, 5, 0)).toBe(10);
  });
});

describe('Supernova: Dichte Regelung', () => {
  it('sinkt bei langen Bildzeiten bis zum Minimum und erholt sich bei kurzen bis zum Maximum', () => {
    let d = 1;
    for (let i = 0; i < 40; i++) d = nextDensity(d, DENSITY.slowMs + 10);
    expect(d).toBe(DENSITY.min);
    for (let i = 0; i < 200; i++) d = nextDensity(d, DENSITY.fastMs - 5);
    expect(d).toBe(DENSITY.max);
  });

  it('bleibt im Zwischenbereich unverändert', () => {
    expect(nextDensity(0.7, (DENSITY.slowMs + DENSITY.fastMs) / 2)).toBe(0.7);
  });
});

describe('Supernova: Orbs und Flugbahn', () => {
  it('Bezier trifft Start und Ziel, die Ausbuchtung wechselt mit dem Vorzeichen die Seite', () => {
    const c = bowControl(0, 0, 100, 0, 0.3, 1);
    const a = bezier(0, 0, c.x, c.y, 100, 0, 0);
    const b = bezier(0, 0, c.x, c.y, 100, 0, 1);
    expect(a).toEqual({ x: 0, y: 0 });
    expect(b.x).toBeCloseTo(100, 8);
    expect(b.y).toBeCloseTo(0, 8);
    const mid = bezier(0, 0, c.x, c.y, 100, 0, 0.5);
    const other = bowControl(0, 0, 100, 0, 0.3, -1);
    expect(Math.sign(c.y)).toBe(-Math.sign(other.y));
    expect(Math.abs(mid.y)).toBeGreaterThan(5);
  });

  it('Ease ist monoton, startet bei 0 und endet bei 1', () => {
    expect(orbEase(0)).toBe(0);
    expect(orbEase(1)).toBeCloseTo(1, 10);
    let prev = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const v = orbEase(t);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(orbEase(0.5)).toBeLessThan(0.5);
  });

  it('Orb Anzahl wächst mit dem Wert und ist gedeckelt', () => {
    expect(orbCount(0)).toBe(0);
    expect(orbCount(-4)).toBe(0);
    expect(orbCount(5)).toBe(1);
    expect(orbCount(40)).toBe(2);
    expect(orbCount(400)).toBe(3);
    expect(orbCount(1e9)).toBe(ORB.maxOrbs);
  });
});

describe('Supernova: Hitze', () => {
  it('steigt bis 1, kühlt bis 0 und verstärkt die Funkenzahl', () => {
    expect(addHeat(0.95, HEAT.perStep)).toBe(1);
    expect(coolHeat(0.2, 10)).toBe(0);
    expect(coolHeat(1, 1)).toBeCloseTo(1 - HEAT.decayPerS, 8);
    expect(heatBoost(0)).toBe(1);
    expect(heatBoost(1)).toBe(HEAT.sparkBoost);
    expect(heatBoost(7)).toBe(HEAT.sparkBoost);
  });
});

describe('Supernova: Callouts', () => {
  it('Schwellen steigen, Wort passt zum Verhältnis', () => {
    for (let i = 1; i < CALLOUTS.length; i++) expect(CALLOUTS[i].minRatio).toBeGreaterThan(CALLOUTS[i - 1].minRatio);
    expect(calloutFor(0.05)).toBeNull();
    expect(calloutFor(0.3)!.word).toBe('Funke');
    expect(calloutFor(1)!.word).toBe('Flamme');
    expect(calloutFor(2)!.word).toBe('Komet');
    expect(calloutFor(50)!.word).toBe('Supernova');
  });

  it('Wörter sind eindeutig und ohne Gedankenstrich', () => {
    expect(new Set(CALLOUTS.map((c) => c.word)).size).toBe(CALLOUTS.length);
    for (const c of CALLOUTS) expect(c.word).not.toMatch(/[–—-]/);
  });
});

describe('Supernova: Zeiger und Karten', () => {
  it('Karte in Reichweite hebt sich und neigt sich zum Zeiger, außerhalb passiert nichts', () => {
    const far = nearEffect(POINTER.near.radius + 1, 0);
    expect(far).toEqual({ k: 0, lift: 0, rot: 0, scale: 0 });
    const on = nearEffect(0, 0);
    expect(on.k).toBe(1);
    expect(on.lift).toBeLessThan(0);
    expect(on.scale).toBeGreaterThan(0);
    expect(on.rot).toBeCloseTo(0, 10);
    const rightOfPointer = nearEffect(80, 0);
    const leftOfPointer = nearEffect(-80, 0);
    expect(rightOfPointer.rot).toBeLessThan(0);
    expect(leftOfPointer.rot).toBeGreaterThan(0);
    expect(nearEffect(40, 0).k).toBeGreaterThan(nearEffect(150, 0).k);
  });

  it('Glättung nähert sich dem Ziel und rastet ein', () => {
    let v = 0;
    for (let i = 0; i < 80; i++) v = ease(v, 1);
    expect(v).toBe(1);
    expect(ease(0, 1, 0.5)).toBe(0.5);
  });

  it('Motten weichen dem Zeiger aus und bleiben außerhalb der Reichweite ruhig', () => {
    const near = motePush(30, 0);
    expect(near.x).toBeGreaterThan(0);
    expect(near.y).toBe(0);
    expect(motePush(0, -40).y).toBeLessThan(0);
    expect(motePush(MOTES.pointerRadius + 5, 0)).toEqual({ x: 0, y: 0 });
    expect(motePush(0, 0)).toEqual({ x: 0, y: 0 });
    expect(Math.hypot(near.x, near.y)).toBeLessThanOrEqual(MOTES.pointerPush);
  });
});
