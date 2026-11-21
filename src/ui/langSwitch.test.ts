import { afterEach, describe, expect, it } from 'vitest';
import { getLang, setLang } from '../i18n';
import { getSettings } from '../settings';
import { fmt, fmtMult } from './theme';
import { languageRowTexts, nextLang, switchLanguage } from './langSwitch';

afterEach(() => setLang('de'));

describe('Sprachwechsel', () => {
  it('nextLang wechselt zyklisch', () => {
    expect(nextLang('de')).toBe('en');
    expect(nextLang('en')).toBe('de');
  });

  it('switchLanguage speichert die Sprache und lädt neu, bei gleicher Sprache nicht', () => {
    let reloads = 0;
    switchLanguage('de', () => { reloads++; });
    expect(reloads).toBe(0);
    switchLanguage('en', () => { reloads++; });
    expect(reloads).toBe(1);
    expect(getLang()).toBe('en');
    expect(getSettings().lang).toBe('en');
  });

  it('Options Zeile hat Texte ohne Gedankenstriche', () => {
    const r = languageRowTexts();
    expect(r.name).toBeTruthy();
    expect(r.desc).not.toMatch(/[—–]| - /);
  });
});

describe('Zahlenformat nach Sprache', () => {
  it('Deutsch: Tausenderpunkt und Dezimalkomma', () => {
    expect(fmt(1234567)).toBe('1.234.567');
    expect(fmtMult(2.5)).toBe('2,5');
  });

  it('Englisch: Tausenderkomma und Dezimalpunkt', () => {
    setLang('en');
    expect(fmt(1234567)).toBe('1,234,567');
    expect(fmtMult(2.5)).toBe('2.5');
    expect(fmtMult(4)).toBe('4');
    expect(fmt(2e11)).toBe('2.00e11');
  });
});
