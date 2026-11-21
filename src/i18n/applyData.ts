import { getLang } from './index';

/**
 * Ersetzt bei Englisch die deutschen Namen und Beschreibungen der Inhalte aus `src/data/` an Ort und Stelle.
 * Jede Datei in `./patch/*.ts` exportiert als default eine Funktion, die ihre Inhalte umschreibt.
 * Aufruf einmal beim Start (main.ts), nachdem `core/index` geladen ist. Tests rufen `applyDataLanguage('en')` auf.
 * Läuft pro Sprache höchstens einmal, ein Wechsel zurück geschieht über das Neuladen der App.
 */
const patches = import.meta.glob('./patch/*.ts', { eager: true }) as Record<string, { default: () => void }>;

let applied = false;

export function applyDataLanguage(force = false) {
  if (getLang() !== 'en' || (applied && !force)) return;
  applied = true;
  for (const path of Object.keys(patches).sort()) patches[path].default();
}
