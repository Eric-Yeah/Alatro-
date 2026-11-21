import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import '../core/index';
import { allJokers, getJoker, jokerDescription } from '../core/jokers';
import { BOSS_BY_ID } from '../core/run';
import { DECK_BY_ID, PACK_BY_ID, STAKE_BY_ID, TAG_BY_ID, VOUCHER_BY_ID } from '../core/game';
import { CONSUMABLES, CONSUMABLE_BY_ID, CONSUMABLE_TYPE_NAMES } from '../data/consumables';
import { VOUCHERS } from '../data/vouchers';
import { BOSSES } from '../data/bosses';
import { TAGS } from '../data/tags';
import { DECKS } from '../data/decks';
import { STAKES } from '../data/stakes';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { PACKS } from '../data/packs';
import { TWISTS, TWIST_BY_ID } from '../data/daily';
import { SCALE, SCALE_BANDS, SCALE_FEATURES, scaleName, scaleSummary } from '../data/difficulty';
import { setLang } from './index';
import { applyDataLanguage } from './applyData';
import { EN as JOKERS_EN } from './patch/jokers';
import { EN as CONSUMABLES_EN, TYPE_NAMES_EN } from './patch/consumables';
import { EN as VOUCHERS_EN } from './patch/vouchers';
import { EN as BOSSES_EN } from './patch/bosses';
import { EN as TAGS_EN } from './patch/tags';
import { EN as DECKS_EN } from './patch/decks';
import { EN as STAKES_EN } from './patch/stakes';
import { ENHANCEMENTS_EN, SEALS_EN, EDITIONS_EN } from './patch/modifiers';
import { EN as PACKS_EN } from './patch/packs';
import { EN as TWISTS_EN } from './patch/daily';
import { BANDS_EN, FEATURES_EN } from './patch/difficulty';

/** Inhalte mit Name und Beschreibung (Pack hat nur einen Namen) */
interface Named { id: string; name: string; description?: string }

/** Die deutschen Originale, vor dem Patchen festgehalten (Test läuft zuerst auf Deutsch) */
const snap = (list: Named[]) => list.map((d) => ({ id: d.id, name: d.name, description: d.description ?? '' }));
const DE = {
  jokers: snap(allJokers()),
  consumables: snap(CONSUMABLES),
  vouchers: snap(VOUCHERS),
  bosses: snap(BOSSES),
  tags: snap(TAGS),
  decks: snap(DECKS),
  stakes: snap(STAKES),
  enhancements: snap(Object.values(ENHANCEMENTS)),
  seals: snap(Object.values(SEALS)),
  editions: snap(Object.values(EDITIONS)),
  packs: snap(PACKS),
  twists: snap([...TWISTS]),
};
const DE_TYPE_NAMES = { ...CONSUMABLE_TYPE_NAMES };
const DE_BANDS = SCALE_BANDS.map((b) => b.name);
const DE_FEATURES = SCALE_FEATURES.map((f) => f.text);

const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const ids = (list: { id: string }[]) => list.map((d) => d.id).sort();

beforeAll(() => {
  setLang('en');
  applyDataLanguage(true);
});
afterAll(() => setLang('de'));

type Group = { label: string; de: { id: string; name: string; description: string }[]; en: Record<string, { name: string; description?: string }>; live: Named[] };

const GROUPS: Group[] = [
  { label: 'Jokers', de: DE.jokers, en: JOKERS_EN, live: allJokers() },
  { label: 'Consumables', de: DE.consumables, en: CONSUMABLES_EN, live: CONSUMABLES },
  { label: 'Vouchers', de: DE.vouchers, en: VOUCHERS_EN, live: VOUCHERS },
  { label: 'Bosse', de: DE.bosses, en: BOSSES_EN, live: BOSSES },
  { label: 'Tags', de: DE.tags, en: TAGS_EN, live: TAGS },
  { label: 'Decks', de: DE.decks, en: DECKS_EN, live: DECKS },
  { label: 'Stakes', de: DE.stakes, en: STAKES_EN, live: STAKES },
  { label: 'Enhancements', de: DE.enhancements, en: ENHANCEMENTS_EN, live: Object.values(ENHANCEMENTS) },
  { label: 'Seals', de: DE.seals, en: SEALS_EN, live: Object.values(SEALS) },
  { label: 'Editions', de: DE.editions, en: EDITIONS_EN, live: Object.values(EDITIONS) },
  { label: 'Packs', de: DE.packs, en: PACKS_EN, live: PACKS },
  { label: 'Tageswandlungen', de: DE.twists, en: TWISTS_EN, live: [...TWISTS] },
];

describe('Inhalte Englisch, Teil A', () => {
  it('Joker Zahl und Typnamen wie erwartet', () => {
    expect(DE.jokers.length).toBe(150);
    // die Schnappschüsse sind wirklich die deutschen Originale
    expect(DE.jokers.find((d) => d.id === 'funke')?.name).toBe('Funke');
    expect(DE.consumables.find((d) => d.id === 'sternbild_pair')?.description).toBe('Pair erhält +1 Level');
    expect(TYPE_NAMES_EN).toEqual({ sternbild: 'Constellation', elixier: 'Elixir', omen: 'Omen' });
  });

  for (const g of GROUPS) {
    describe(g.label, () => {
      it('jede Id hat einen englischen Eintrag, kein überzähliger', () => {
        expect(Object.keys(g.en).sort()).toEqual(ids(g.de));
      });

      it('Platzhalter stimmen mit dem Deutschen überein', () => {
        const bad = g.de.filter((d) => {
          const e = g.en[d.id];
          const edesc = e && 'description' in e ? e.description ?? '' : '';
          return ph(d.name) !== ph(e.name) || ph(d.description) !== ph(edesc);
        });
        expect(bad.map((d) => d.id)).toEqual([]);
      });

      it('Namen sind eindeutig und nicht leer', () => {
        const names = Object.values(g.en).map((e) => e.name);
        expect(names.every((n) => n.trim().length > 0)).toBe(true);
        expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(names.length);
      });

      it('keine Gedankenstriche, keine deutschen Umlaute', () => {
        const texts = Object.values(g.en).flatMap((e) => [e.name, 'description' in e ? e.description ?? '' : '']);
        expect(texts.filter((s) => /[–—]/.test(s) || / - /.test(s))).toEqual([]);
        expect(texts.filter((s) => /[äöüÄÖÜß]/.test(s))).toEqual([]);
      });

      it('die tatsächlich verwendeten Objekte wurden umgeschrieben', () => {
        for (const d of g.live) {
          const e = g.en[d.id];
          expect(d.name).toBe(e.name);
          if ('description' in e) expect(d.description).toBe(e.description);
        }
      });
    });
  }

  it('Jokers: Namen höchstens 22 Zeichen, jokerDescription ohne übrige Platzhalter', () => {
    for (const def of allJokers()) {
      expect(def.name.length, def.id).toBeLessThanOrEqual(22);
      const text = jokerDescription(def);
      expect(text, def.id).not.toMatch(/[{}]/);
      expect(text.length, def.id).toBeGreaterThan(0);
    }
    expect(getJoker('funke')?.name).toBe('Spark');
    expect(jokerDescription(getJoker('funke')!)).toBe('+4 Mult');
    expect(jokerDescription(getJoker('muenzquelle')!)).toBe('+$3 at the end of each round');
  });

  it('Jokers: Platzhalter sind in config oder init vorhanden', () => {
    for (const def of allJokers()) {
      const keys = new Set([...Object.keys(def.config), ...Object.keys(def.init?.(def.config) ?? {})]);
      for (const k of ph(def.description).split(',').filter(Boolean)) expect(keys.has(k), `${def.id} ${k}`).toBe(true);
    }
  });

  it('Consumables: nur Elixier, Sternbild und Omen Typnamen, Sternbild Beschreibung nutzt den Hand Namen', () => {
    expect(CONSUMABLE_TYPE_NAMES).toEqual(TYPE_NAMES_EN);
    expect(DE_TYPE_NAMES).toEqual({ sternbild: 'Sternbild', elixier: 'Elixier', omen: 'Omen' });
    expect(CONSUMABLE_BY_ID['sternbild_pair'].description).toBe('Pair gains +1 Level');
    expect(CONSUMABLE_BY_ID['sternbild_flush'].name).toBe('Milky Way');
  });

  it('Registries (BY_ID) zeigen auf dieselben, umgeschriebenen Objekte', () => {
    expect(BOSS_BY_ID['nebel'].name).toBe('The Fog');
    expect(TAG_BY_ID['goldstaub'].name).toBe('Gold Dust');
    expect(VOUCHER_BY_ID['fernrohr'].name).toBe('Refractor');
    expect(DECK_BY_ID['nachthimmel'].name).toBe('Night Sky');
    expect(STAKE_BY_ID['daemmerung'].name).toBe('Twilight');
    expect(PACK_BY_ID['sternbild_mega'].name).toBe('Mega Constellation Pack');
    expect(TWIST_BY_ID['vollmond'].name).toBe('Full Moon');
  });

  it('Schwierigkeit: Bänder, Zusatzregeln und zusammengesetzte Zeilen auf Englisch', () => {
    expect(Object.keys(BANDS_EN).sort()).toEqual([...DE_BANDS].sort());
    expect(Object.keys(FEATURES_EN).sort()).toEqual([...DE_FEATURES].sort());
    expect(SCALE_BANDS.map((b) => b.name)).toEqual(DE_BANDS.map((n) => BANDS_EN[n]));
    expect(SCALE_FEATURES.map((f) => f.text)).toEqual(DE_FEATURES.map((n) => FEATURES_EN[n]));
    expect(new Set(SCALE_BANDS.map((b) => b.name)).size).toBe(SCALE_BANDS.length);
    expect(scaleName(7)).toBe('Level 7 Challenging');
    expect(scaleSummary(SCALE.normal)).toEqual(['Blind targets as in the base game']);
    expect(scaleSummary(1)[0]).toBe('Blind targets minus 30%');
    expect(scaleSummary(12)[0]).toMatch(/^Blind targets plus \d+%$/);
    for (let l = SCALE.min; l <= SCALE.max; l++) {
      for (const line of scaleSummary(l)) {
        expect(line).not.toMatch(/[äöüÄÖÜß{}–—]/);
        expect(line).not.toMatch(/ - /);
      }
    }
  });
});
