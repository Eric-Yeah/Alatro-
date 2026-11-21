import { describe, expect, it } from 'vitest';
import { EN, getLang, setLang, t } from './index';

/** Alle Quelltexte der App (ohne Tests und ohne i18n selbst) als Rohtext */
const SOURCES = import.meta.glob(['/src/**/*.ts', '!/src/**/*.test.ts', '!/src/i18n/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('i18n', () => {
  it('Standard ist Deutsch, t gibt den Text zurück', () => {
    expect(getLang()).toBe('de');
    expect(t('Ante {n}', { n: 2 })).toBe('Ante 2');
  });

  it('Englisch: Wörterbuch, Platzhalter, Mehrzahl', () => {
    setLang('en');
    try {
      EN['__t1'] = 'Round {n}';
      EN['__t2'] = '{n} card|{n} cards';
      expect(t('__t1', { n: 4 })).toBe('Round 4');
      expect(t('__t2', { n: 1 })).toBe('1 card');
      expect(t('__t2', { n: 3 })).toBe('3 cards');
      expect(t('Nicht im Wörterbuch')).toBe('Nicht im Wörterbuch');
    } finally {
      delete EN['__t1'];
      delete EN['__t2'];
      setLang('de');
    }
  });

  it('Mehrzahl auf Deutsch', () => {
    expect(t('{n} Karte|{n} Karten', { n: 1 })).toBe('1 Karte');
    expect(t('{n} Karte|{n} Karten', { n: 5 })).toBe('5 Karten');
  });

  it('Jeder Aufruf t("...") im Quelltext hat einen englischen Eintrag', () => {
    const re = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
    const missing: string[] = [];
    for (const [file, src] of Object.entries(SOURCES)) {
      for (const m of src.matchAll(re)) {
        if (m[1] === '`' && m[2].includes('${')) continue;
        const key = m[2].replace(/\\(['"`\\])/g, '$1').replace(/\\n/g, '\n');
        if (!(key in EN)) missing.push(`${file}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('Platzhalter und Mehrzahl Muster stimmen in beiden Sprachen überein', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const bad = Object.entries(EN).filter(([de, en]) => !de.startsWith('__') && (ph(de) !== ph(en) || de.includes('|') !== en.includes('|')));
    expect(bad.map(([de]) => de)).toEqual([]);
  });

  it('Keine Gedankenstriche in englischen Texten (Projektregel)', () => {
    const bad = Object.entries(EN).filter(([, en]) => /[–—]/.test(en) || / - /.test(en));
    expect(bad.map(([de]) => de)).toEqual([]);
  });
});
