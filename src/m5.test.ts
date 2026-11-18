import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, MOODS, SCALE_MAX_STEPS, SCORE_TIERS, XMULT_SHAKE_MAX } from './data/juice';
import { clampVolume, getSettings, parseSettings, updateSettings } from './settings';
import { scaleFreq, scoreTier, xMultShake } from './ui/juiceMath';

describe('M5 Einstellungen', () => {
  it('liefert Standardwerte bei leeren oder kaputten Daten', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ crt: 'ja', shake: 3, volume: 'laut' })).toEqual(DEFAULT_SETTINGS);
  });

  it('übernimmt gültige Werte und begrenzt die Lautstärke', () => {
    expect(parseSettings({ crt: false, shake: false, volume: 0.3 })).toEqual({ crt: false, shake: false, volume: 0.3 });
    expect(parseSettings({ volume: 7 }).volume).toBe(1);
    expect(parseSettings({ volume: -2 }).volume).toBe(0);
    expect(parseSettings({ volume: NaN }).volume).toBe(DEFAULT_SETTINGS.volume);
  });

  it('rundet die Lautstärke auf Schritte', () => {
    expect(clampVolume(0.34)).toBeCloseTo(0.3);
    expect(clampVolume(0.36)).toBeCloseTo(0.4);
  });

  it('updateSettings meldet Änderungen an Listener, auch ohne localStorage', () => {
    const before = getSettings();
    const next = updateSettings({ crt: !before.crt });
    expect(next.crt).toBe(!before.crt);
    expect(getSettings().crt).toBe(!before.crt);
    updateSettings({ crt: before.crt });
  });
});

describe('M5 Juice Mathematik', () => {
  it('Stufen steigen mit dem Verhältnis Punkte zu Ziel', () => {
    const shakes = [0, 0.05, 0.2, 0.5, 1, 3].map((r) => scoreTier(r * 1000, 1000).shake);
    expect(shakes).toEqual([...shakes].sort((a, b) => a - b));
    expect(scoreTier(0, 1000)).toBe(SCORE_TIERS[0]);
    expect(scoreTier(5000, 1000)).toBe(SCORE_TIERS[SCORE_TIERS.length - 1]);
  });

  it('Stufen Grenzen: genau an der Schwelle gilt die höhere Stufe', () => {
    expect(scoreTier(100, 1000)).toBe(SCORE_TIERS[1]);
    expect(scoreTier(99, 1000)).toBe(SCORE_TIERS[0]);
  });

  it('ohne Ziel gilt die niedrigste Stufe', () => {
    expect(scoreTier(1e9, 0)).toBe(SCORE_TIERS[0]);
  });

  it('Stufen sind aufsteigend sortiert', () => {
    for (let i = 1; i < SCORE_TIERS.length; i++) expect(SCORE_TIERS[i].minRatio).toBeGreaterThan(SCORE_TIERS[i - 1].minRatio);
  });

  it('Tonhöhe steigt Schritt für Schritt und wird begrenzt', () => {
    for (let i = 1; i <= SCALE_MAX_STEPS; i++) expect(scaleFreq(i)).toBeGreaterThan(scaleFreq(i - 1));
    expect(scaleFreq(SCALE_MAX_STEPS + 50)).toBe(scaleFreq(SCALE_MAX_STEPS));
    expect(scaleFreq(-3)).toBe(scaleFreq(0));
  });

  it('X Mult Shake wächst mit dem Faktor und ist gedeckelt', () => {
    expect(xMultShake(2)).toBeGreaterThan(xMultShake(1.5));
    expect(xMultShake(1000)).toBe(XMULT_SHAKE_MAX);
    expect(xMultShake(0.5)).toBe(xMultShake(1));
  });
});

describe('M5 Stimmungen', () => {
  it('jede Stimmung hat gültige Farben und Werte', () => {
    for (const m of Object.values(MOODS)) {
      for (const c of [...m.deep, ...m.mid, ...m.accent]) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
      expect(m.speed).toBeGreaterThan(0);
    }
  });

  it('Small ruhig, Big kräftiger, Boss dramatisch', () => {
    expect(MOODS.small.speed).toBeLessThan(MOODS.big.speed);
    expect(MOODS.big.speed).toBeLessThan(MOODS.boss.speed);
    expect(MOODS.small.contrast).toBeLessThan(MOODS.big.contrast);
    expect(MOODS.big.contrast).toBeLessThan(MOODS.boss.contrast);
    expect(MOODS.boss.pulse).toBeGreaterThan(MOODS.small.pulse);
  });
});
