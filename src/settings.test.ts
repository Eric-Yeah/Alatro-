import { describe, expect, it } from 'vitest';
import pkg from '../package.json';
import { DEFAULT_SPEED, SPEED_OPTIONS } from './data/options';
import { APP_VERSION, PATCH_NOTES } from './data/patchnotes';
import { TUTORIAL } from './data/tutorial';
import { cycleSpeed, getSpeed, sanitizeSettings, setSettings } from './settings';

describe('Optionen', () => {
  it('ungültige Werte fallen auf das Standardtempo zurück', () => {
    expect(sanitizeSettings(null).speed).toBe(DEFAULT_SPEED);
    expect(sanitizeSettings({ speed: 7 }).speed).toBe(DEFAULT_SPEED);
    expect(sanitizeSettings({ speed: 'schnell' }).speed).toBe(DEFAULT_SPEED);
    expect(sanitizeSettings({ speed: 2 }).speed).toBe(2);
  });

  it('Tempo Optionen sind aufsteigend und enthalten das Standardtempo', () => {
    expect(SPEED_OPTIONS).toContain(DEFAULT_SPEED);
    expect([...SPEED_OPTIONS].sort((a, b) => a - b)).toEqual([...SPEED_OPTIONS]);
    expect(SPEED_OPTIONS.some((s) => s >= 2)).toBe(true);
  });

  it('cycleSpeed geht durch alle Tempi und beginnt danach von vorn', () => {
    setSettings({ speed: SPEED_OPTIONS[0] });
    const seen = [getSpeed()];
    for (let i = 0; i < SPEED_OPTIONS.length; i++) seen.push(cycleSpeed());
    expect(seen.slice(0, SPEED_OPTIONS.length)).toEqual([...SPEED_OPTIONS]);
    expect(seen[SPEED_OPTIONS.length]).toBe(SPEED_OPTIONS[0]);
  });
});

describe('Patch Notes und Anleitung', () => {
  it('neueste Patch Notes passen zur Version in package.json', () => {
    expect(APP_VERSION).toBe(pkg.version);
  });

  it('Versionen sind eindeutig und jede hat Einträge', () => {
    expect(new Set(PATCH_NOTES.map((n) => n.version)).size).toBe(PATCH_NOTES.length);
    for (const n of PATCH_NOTES) expect(n.items.length).toBeGreaterThan(0);
  });

  it('Anleitung hat eindeutige Seiten und Texte ohne Gedankenstriche', () => {
    expect(new Set(TUTORIAL.map((p) => p.id)).size).toBe(TUTORIAL.length);
    const texts = [
      ...TUTORIAL.flatMap((p) => [p.title, p.tab, ...p.lines]),
      ...PATCH_NOTES.flatMap((n) => [n.title, ...n.items]),
    ];
    for (const t of texts) expect(t).not.toMatch(/[—–]| - /);
  });
});
