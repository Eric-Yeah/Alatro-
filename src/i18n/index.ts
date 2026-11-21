/**
 * Mehrsprachigkeit (Deutsch und Englisch). Ohne DOM, damit auch die Engine sie nutzen darf.
 *
 * Grundidee: Der deutsche Text ist zugleich der Schlüssel. `t('Weiter')` liefert auf Deutsch den Text
 * selbst, auf Englisch den Eintrag aus den Wörterbüchern in `src/i18n/en/*.ts`. Fehlt ein Eintrag,
 * erscheint der deutsche Text (und der Test `i18n.test.ts` schlägt an).
 *
 * Platzhalter: `t('Ante {n}', { n: 3 })`. Mehrzahl: `t('{n} Karte|{n} Karten', { n })`, die Form vor dem
 * senkrechten Strich gilt für n gleich 1, die zweite sonst (im Wörterbuch gilt dasselbe Muster).
 *
 * Inhalte aus `src/data/` (Namen und Beschreibungen von Jokers usw.) bleiben auf Deutsch im Code.
 * Bei Englisch werden sie beim Start durch die Dateien in `src/i18n/patch/` an Ort und Stelle
 * ersetzt (`applyDataLanguage()` in `applyData.ts`). Ein Sprachwechsel lädt die App neu.
 */
export type Lang = 'de' | 'en';
export const LANGS: readonly Lang[] = ['de', 'en'];
export const DEFAULT_LANG: Lang = 'de';
/** Anzeigename jeder Sprache, in der Sprache selbst (für die Auswahl in den Optionen) */
export const LANG_NAMES: Record<Lang, string> = { de: 'Deutsch', en: 'English' };

/** Gleicher Speicherort wie die Einstellungen (settings.ts), damit die Sprache vor allem anderen bekannt ist */
const SETTINGS_KEY = 'alatro.settings.v2';

export function isLang(v: unknown): v is Lang {
  return v === 'de' || v === 'en';
}

function readStoredLang(): Lang {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(SETTINGS_KEY);
    const o = raw ? JSON.parse(raw) : null;
    if (o && isLang(o.lang)) return o.lang;
  } catch { /* kein Speicher oder kaputte Daten */ }
  return DEFAULT_LANG;
}

let lang: Lang = readStoredLang();

export function getLang(): Lang {
  return lang;
}

/** Setzt die Sprache nur im Speicher (Tests, settings.ts). Gespeichert wird über `updateSettings({ lang })`. */
export function setLang(l: Lang) {
  lang = l;
}

// Wörterbücher: jede Datei in ./en exportiert als default ein Objekt { deutscher Text: englischer Text }.
const modules = import.meta.glob('./en/*.ts', { eager: true }) as Record<string, { default: Record<string, string> }>;

/** Alle englischen Einträge (Schlüssel ist der deutsche Text) */
export const EN: Record<string, string> = {};
for (const path of Object.keys(modules).sort()) Object.assign(EN, modules[path].default);

function format(text: string, params?: Record<string, string | number>): string {
  let s = text;
  if (s.includes('|')) {
    const [one, many] = s.split('|');
    const n = params && typeof params.n === 'number' ? params.n : NaN;
    s = n === 1 ? one : many ?? one;
  }
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** Übersetzt einen deutschen Text (siehe Kopfkommentar). */
export function t(de: string, params?: Record<string, string | number>): string {
  const text = lang === 'en' ? EN[de] ?? de : de;
  return format(text, params);
}

/** Wie `t`, aber ohne Platzhalter einzusetzen, für Texte, die später noch gefüllt werden */
export function tRaw(de: string): string {
  return lang === 'en' ? EN[de] ?? de : de;
}
