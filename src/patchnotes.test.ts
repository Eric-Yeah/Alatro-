import { describe, expect, it } from 'vitest';
import pkg from '../package.json';
import { APP_VERSION, PATCH_NOTES } from './data/patchnotes';
import { TUTORIAL } from './data/tutorial';

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
