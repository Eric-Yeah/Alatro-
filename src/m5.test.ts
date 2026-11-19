import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, MOODS, QUALITY_PROFILE, SCALE_MAX_STEPS, SCORE_TIERS, SPEED_STEPS, XMULT_SHAKE_MAX } from './data/juice';
import { clampVolume, getSettings, parseSettings, speedFactor, updateSettings } from './settings';
import { FpsMeter } from './ui/perf';
import { impactMs, scaleFreq, scoreTier, totalPattern, xMultShake } from './ui/juiceMath';
import { haptics } from './ui/haptics';
import { HAPTICS } from './data/juice';

describe('M5 Einstellungen', () => {
  it('liefert Standardwerte bei leeren oder kaputten Daten', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ crt: 'ja', shake: 3, volume: 'laut' })).toEqual(DEFAULT_SETTINGS);
  });

  it('übernimmt gültige Werte und begrenzt die Lautstärke', () => {
    expect(parseSettings({ crt: false, shake: false, volume: 0.3 })).toEqual({ ...DEFAULT_SETTINGS, crt: false, shake: false, volume: 0.3 });
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

describe('M6 Optionen', () => {
  it('Tempo: unbekannte IDs fallen auf Normal zurück, Faktoren steigen', () => {
    expect(parseSettings({ speed: 'blitz' }).speed).toBe('blitz');
    expect(parseSettings({ speed: 'warp' }).speed).toBe(DEFAULT_SETTINGS.speed);
    expect(parseSettings({ speed: 3 }).speed).toBe(DEFAULT_SETTINGS.speed);
    const f = SPEED_STEPS.map((x) => x.factor);
    expect(f[0]).toBe(1);
    expect(f).toEqual([...f].sort((a, b) => a - b));
    expect(speedFactor(parseSettings({ speed: 'sehr' }))).toBe(SPEED_STEPS.find((x) => x.id === 'sehr')!.factor);
    expect(speedFactor(parseSettings(null))).toBe(1);
  });

  it('Grafikstufe: nur voll oder sparsam, sparsam spart Bildrate, Auflösung und Effekte', () => {
    expect(parseSettings({ quality: 'ultra' }).quality).toBe('voll');
    expect(parseSettings({ quality: 'sparsam' }).quality).toBe('sparsam');
    const lo = QUALITY_PROFILE.sparsam;
    const hi = QUALITY_PROFILE.voll;
    expect(lo.maxFps).toBeGreaterThan(0);
    expect(hi.maxFps).toBe(0);
    expect(lo.maxResolution).toBeLessThan(hi.maxResolution);
    expect(lo.crt).toBe(false);
    expect(lo.editionFx).toBe(false);
  });

  it('FPS Anzeige: Bildrate und längster Frame pro Messfenster', () => {
    const m = new FpsMeter(500);
    let done = 0;
    for (let i = 0; i < 30; i++) if (m.tick(i === 5 ? 40 : 16)) done++;
    expect(done).toBe(1);
    expect(m.fps).toBeGreaterThan(55);
    expect(m.fps).toBeLessThan(65);
    expect(m.worstMs).toBe(40);
    expect(m.text()).toContain('FPS');
  });
});

describe('Vibration', () => {
  it('Einstellung ist standardmäßig an und wird gelesen', () => {
    expect(DEFAULT_SETTINGS.haptics).toBe(true);
    expect(parseSettings({ haptics: false }).haptics).toBe(false);
    expect(parseSettings({ haptics: 'ja' }).haptics).toBe(true);
  });

  it('Aufprall wächst mit der Shake Stärke und ist begrenzt', () => {
    const ms = [0, 3, 6, 10, 16, 40].map(impactMs);
    expect(ms).toEqual([...ms].sort((a, b) => a - b));
    expect(ms[0]).toBe(HAPTICS.impact.minMs);
    expect(ms[ms.length - 1]).toBe(HAPTICS.impact.maxMs);
  });

  it('Aufschlag der Gesamtpunkte: Nachschlag nur bei hohen Stufen', () => {
    expect(totalPattern(0.25)).toHaveLength(1);
    expect(totalPattern(1)).toHaveLength(3);
    expect(totalPattern(1)[0]).toBeGreaterThan(totalPattern(0.25)[0]);
    expect(totalPattern(9)[0]).toBe(HAPTICS.total.maxMs);
  });

  it('ohne Gerätefunktion bleibt alles still und wirft nicht', () => {
    expect(() => { haptics.total(1); haptics.tap(); haptics.stop(); }).not.toThrow();
  });

  it('ruft navigator.vibrate nur bei eingeschalteter Option auf', () => {
    const calls: unknown[] = [];
    const nav = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', { value: { vibrate: (p: unknown) => { calls.push(p); return true; }, userAgent: 'x' }, configurable: true });
    try {
      expect(haptics.supported).toBe(true);
      updateSettings({ haptics: true });
      haptics.select(true);
      expect(calls).toEqual([HAPTICS.select]);
      updateSettings({ haptics: false });
      haptics.select(true);
      expect(calls).toHaveLength(1);
    } finally {
      updateSettings({ haptics: true });
      Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true });
    }
  });
});
