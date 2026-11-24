import '../core/index';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import { ACHIEVEMENTS, CATEGORY_NAMES, CATEGORY_ORDER, RANKS } from '../data/achievements';
import { GUIDE_STEPS } from '../data/guide';
import { MUSIC, TRACKS } from '../data/music';
import { PATCH_NOTES, APP_VERSION } from '../data/patchnotes';
import { QUALITY_NAMES, SPEED_STEPS } from '../data/juice';
import { TIPS } from '../data/tips';
import { TUTORIAL } from '../data/tutorial';
import { COLLECTION_TABS, collectionHint } from '../collection';
import { applyDataLanguage } from './applyData';
import { englishDate } from './patch/patchnotes';
import { nameOf } from './lazy';
import { EN, setLang, t } from './index';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { STAKES } from '../data/stakes';

/** Zustand vor dem Umschreiben (Deutsch), tief kopiert */
const de = {
  achievements: ACHIEVEMENTS.map((a) => ({ id: a.id, name: a.name, description: a.description, secret: a.secret, stars: a.stars, category: a.category })),
  categories: { ...CATEGORY_NAMES },
  ranks: RANKS.map((r) => r.name),
  tips: [...TIPS],
  guide: GUIDE_STEPS.map((s) => ({ id: s.id, title: s.title, text: s.text, wait: s.wait, target: s.target, dock: s.dock, select: s.select })),
  tutorial: TUTORIAL.map((p) => ({ id: p.id, tab: p.tab, title: p.title, lines: [...p.lines] })),
  notes: PATCH_NOTES.map((n) => ({ version: n.version, date: n.date, title: n.title, items: [...n.items] })),
  tracks: TRACKS.map((t) => ({ id: t.id, name: t.name, info: t.info })),
  speeds: SPEED_STEPS.map((s) => ({ id: s.id, name: s.name })),
  quality: { ...QUALITY_NAMES },
  tabs: COLLECTION_TABS.map((x) => x.name),
};

const NO_DASH = /[–—]| - /;
const GERMAN_CHARS = /[äöüÄÖÜß]/;
/** Zahlen eines Textes ohne Tausendertrennzeichen, in Reihenfolge (1.000 und 1,000 gelten gleich) */
const numbers = (s: string) => (s.match(/\d[\d.,]*/g) ?? []).map((n) => n.replace(/[.,]/g, '')).join('|');
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
/** Eigennamen, die in beiden Sprachen gleich lauten */
const SAME_OK = new Set(['Supernova', 'Alchemist', 'Tags', 'Decks', 'Vouchers', 'Jokers', 'Mix', 'Vibration']);

beforeAll(() => {
  setLang('en');
  applyDataLanguage(true);
});
afterAll(() => setLang('de'));

/** Namen anderer Inhalte setzen die Texte beim Lesen ein. Ihre Sprache prüfen die Tests der Inhalte Teil A, hier zählen sie nicht. */
function withoutContentNames(s: string): string {
  const names = [
    ...Object.values(EDITIONS), ...Object.values(ENHANCEMENTS), ...Object.values(SEALS), ...STAKES,
  ].map((x) => x.name);
  names.push(nameOf.joker('funke'), nameOf.joker('hehler'));
  return names.reduce((acc, n) => acc.split(n).join(''), s);
}

function checkText(en: string, label: string, deText?: string) {
  expect(en, label).toBeTruthy();
  expect(en, `${label}: Gedankenstrich`).not.toMatch(NO_DASH);
  expect(withoutContentNames(en), `${label}: Umlaut`).not.toMatch(GERMAN_CHARS);
  // kurze Texte (Eigennamen, "Full House", "* Schimmer: plus Chips.") dürfen in beiden Sprachen gleich sein
  if (deText !== undefined && !SAME_OK.has(en) && deText.split(' ').length >= 5) expect(en, `${label}: unverändert deutsch`).not.toBe(deText);
}

describe('Inhalte Teil B auf Englisch: Erfolge', () => {
  it('alle 61 Erfolge haben englischen Namen und Text, Struktur bleibt', () => {
    expect(ACHIEVEMENTS).toHaveLength(de.achievements.length);
    expect(ACHIEVEMENTS).toHaveLength(61);
    ACHIEVEMENTS.forEach((a, i) => {
      const g = de.achievements[i];
      expect(a.id).toBe(g.id);
      checkText(a.name, `${a.id}.name`, g.name);
      checkText(a.description, `${a.id}.description`, g.description);
      expect(a.secret).toBe(g.secret);
      expect(a.stars).toBe(g.stars);
      expect(a.category).toBe(g.category);
      expect(numbers(a.description), `${a.id}: Zahlen`).toBe(numbers(g.description));
      // Banner und Raster haben begrenzte Breite: nicht deutlich länger als das Deutsche
      expect(a.name.length, `${a.id}: Name zu lang`).toBeLessThanOrEqual(Math.max(g.name.length + 4, 22));
    });
  });

  it('Namen sind eindeutig', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.name)).size).toBe(ACHIEVEMENTS.length);
  });

  it('Kategorien und Ränge sind übersetzt', () => {
    for (const c of CATEGORY_ORDER) checkText(CATEGORY_NAMES[c], `Kategorie ${c}`, de.categories[c]);
    expect(RANKS).toHaveLength(de.ranks.length);
    RANKS.forEach((r, i) => checkText(r.name, `Rang ${i}`, de.ranks[i]));
  });

  it('Stufen Namen werden beim Lesen eingesetzt', () => {
    const a = ACHIEVEMENTS.find((x) => x.id === 'sieg_mitternacht')!;
    expect(a.description).toBe(`Win on ${nameOf.stake('mitternacht')}.`);
  });
});

describe('Inhalte Teil B auf Englisch: Tipps', () => {
  it('jeder Tipp ist übersetzt, Anzahl gleich', () => {
    expect(TIPS).toHaveLength(de.tips.length);
    TIPS.forEach((tip, i) => {
      checkText(tip, `Tipp ${i}`, de.tips[i]);
      expect(numbers(tip), `Tipp ${i}: Zahlen`).toBe(numbers(de.tips[i]));
    });
  });
});

describe('Inhalte Teil B auf Englisch: Einführung', () => {
  it('jeder Schritt ist übersetzt, Ablauf bleibt', () => {
    expect(GUIDE_STEPS).toHaveLength(de.guide.length);
    GUIDE_STEPS.forEach((s, i) => {
      const g = de.guide[i];
      expect(s.id).toBe(g.id);
      checkText(s.title, `${s.id}.title`, g.title);
      checkText(s.text, `${s.id}.text`, g.text);
      expect(s.wait).toBe(g.wait);
      expect(s.target).toBe(g.target);
      expect(s.dock).toBe(g.dock);
      expect(s.select).toEqual(g.select);
      expect(numbers(s.text), `${s.id}: Zahlen`).toBe(numbers(g.text));
      expect(placeholders(s.text)).toBe(placeholders(g.text));
    });
  });

  it('Auswahlschritte tragen den englischen Hinweis, Kartenwerte stehen im Text', () => {
    for (const s of GUIDE_STEPS.filter((x) => x.select)) expect(s.text).toContain('Tap a card again to deselect it.');
    const cards = (id: string) => GUIDE_STEPS.find((s) => s.id === id)!.text;
    expect(cards('pickDiscard')).toContain('2♣, 6♦ and 9♠');
    expect(cards('pickFlush')).toContain('4, 8, 10, J and Q');
  });

  it('Joker Name in der Einführung kommt aus den Daten', () => {
    const name = nameOf.joker('funke');
    for (const id of ['buy', 'bought', 'playFull']) expect(GUIDE_STEPS.find((s) => s.id === id)!.text).toContain(name);
  });
});

describe('Inhalte Teil B auf Englisch: Anleitung', () => {
  it('jede Seite ist übersetzt, Aufbau und Aufzählungen bleiben', () => {
    expect(TUTORIAL).toHaveLength(de.tutorial.length);
    TUTORIAL.forEach((p, i) => {
      const g = de.tutorial[i];
      expect(p.id).toBe(g.id);
      checkText(p.tab, `${p.id}.tab`);
      checkText(p.title, `${p.id}.title`);
      expect(p.title).not.toBe(g.title);
      expect(p.lines, `${p.id}: Zeilenzahl`).toHaveLength(g.lines.length);
      p.lines.forEach((line, j) => {
        checkText(line, `${p.id}[${j}]`, g.lines[j]);
        expect(line.startsWith('* '), `${p.id}[${j}]: Aufzählungszeichen`).toBe(g.lines[j].startsWith('* '));
        expect(numbers(line), `${p.id}[${j}]: Zahlen`).toBe(numbers(g.lines[j]));
      });
    });
  });

  it('Namen anderer Inhalte werden beim Lesen eingesetzt', () => {
    const lines = (id: string) => TUTORIAL.find((p) => p.id === id)!.lines.join('\n');
    expect(lines('jokers')).toContain(nameOf.edition('prisma'));
    expect(lines('karten')).toContain(nameOf.seal('muenze'));
    expect(lines('schwierigkeit')).toContain(nameOf.stake('ewige_nacht'));
  });
});

describe('Inhalte Teil B auf Englisch: Patch Notes', () => {
  it('Version bleibt gleich package.json', () => {
    expect(APP_VERSION).toBe(pkg.version);
    expect(PATCH_NOTES[0].version).toBe(pkg.version);
  });

  it('gleiche Versionen und gleiche Anzahl Punkte je Version', () => {
    expect(PATCH_NOTES.map((n) => n.version)).toEqual(de.notes.map((n) => n.version));
    PATCH_NOTES.forEach((n, i) => {
      const g = de.notes[i];
      expect(n.items, `${n.version}: Punkte`).toHaveLength(g.items.length);
      checkText(n.title, `${n.version}.title`, g.title);
      n.items.forEach((it, j) => {
        checkText(it, `${n.version}[${j}]`, g.items[j]);
        expect(numbers(it), `${n.version}[${j}]: Zahlen`).toBe(numbers(g.items[j]));
        expect(placeholders(it)).toBe(placeholders(g.items[j]));
      });
    });
  });

  it('Datum steht englisch', () => {
    for (const n of PATCH_NOTES) expect(n.date, n.version).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    expect(PATCH_NOTES.find((n) => n.version === '0.3.0')!.date).toBe('Nov 18, 2026');
    expect(englishDate('19.11.2026')).toBe('Nov 19, 2026');
    expect(englishDate('Nov 19, 2026')).toBe('Nov 19, 2026');
    expect(englishDate('01.03.2027')).toBe('Mar 1, 2027');
  });
});

describe('Inhalte Teil B auf Englisch: Musik, Tempo, Sammlung', () => {
  it('Musikstücke sind übersetzt und passen unter den Knopf', () => {
    expect(TRACKS).toHaveLength(de.tracks.length);
    TRACKS.forEach((tr, i) => {
      expect(tr.id).toBe(de.tracks[i].id);
      checkText(tr.name, `${tr.id}.name`, de.tracks[i].name);
      checkText(tr.info, `${tr.id}.info`, de.tracks[i].info);
      expect(tr.info.length).toBeLessThanOrEqual(MUSIC.infoMax);
    });
  });

  it('Tempo und Grafikstufe', () => {
    SPEED_STEPS.forEach((s, i) => {
      expect(s.id).toBe(de.speeds[i].id);
      expect(s.name).not.toContain(',');
    });
    expect(SPEED_STEPS.find((s) => s.id === 'schnell')!.name).toBe('1.5x');
    expect(QUALITY_NAMES).toEqual({ voll: 'Full', sparsam: 'Lite', supernova: 'Supernova' });
  });

  it('Reiter und Hinweise der Sammlung haben englische Einträge', () => {
    for (const name of de.tabs) expect(EN[name], name).toBeTruthy();
    expect(EN['Alle drei Stücke im Wechsel']).toBeTruthy();
    expect(t('Bosse')).toBe('Bosses');
    expect(collectionHint({ key: 'deck:x', name: 'x', description: '', group: 'deck' })).toBe('Start a run with this Deck.');
    expect(collectionHint({ key: 'tag:nope', name: 'x', description: '', group: 'tag' })).toBe('A Skip reward. Skip a Blind to get it.');
    expect(collectionHint({ key: 'joker:nope', name: 'x', description: '', group: 'legendary' })).toBe('Very rare. Only enters the game through an Omen.');
  });

  it('Wörterbuch Einträge der Dateien root und sync: Platzhalter stimmen, keine Gedankenstriche', () => {
    const own = [
      'Server antwortet mit {status}', 'Keine Verbindung', 'Nicht gekoppelt', 'Häufig im Shop, erst ab Ante {min}.', 'Eine Skip Belohnung, erst ab Ante {min}.',
    ];
    for (const k of own) {
      expect(placeholders(EN[k]), k).toBe(placeholders(k));
      expect(EN[k]).not.toMatch(NO_DASH);
    }
    expect(t('Server antwortet mit {status}', { status: 503 })).toBe('Server responded with 503');
  });
});
