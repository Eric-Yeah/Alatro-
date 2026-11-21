/**
 * Hilfen für die englischen Patch Dateien (src/i18n/patch). Texte, die Namen anderer Inhalte nennen
 * (ein Joker in der Einführung, eine Edition in der Anleitung), lesen diese Namen erst beim Zugriff.
 * So stimmen sie auch dann, wenn die Patch Datei der Inhalte später als die eigene läuft.
 */
import { STAKES } from '../data/stakes';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { getTrack } from '../data/music';
import { getJoker } from '../core/jokers';

/** Ersetzt eine Eigenschaft (oder einen Array Eintrag) durch einen Getter, der bei jedem Lesen neu berechnet */
export function lazyProp(obj: object, key: PropertyKey, get: () => unknown) {
  Object.defineProperty(obj, key, { get, enumerable: true, configurable: true });
}

/** Aktueller Anzeigename (bei Englisch nach den Inhalte Patches englisch), sonst die ID als Rückfall */
export const nameOf = {
  joker: (id: string) => getJoker(id)?.name ?? id,
  stake: (id: string) => STAKES.find((s) => s.id === id)?.name ?? id,
  edition: (id: string) => EDITIONS[id]?.name ?? id,
  enhancement: (id: string) => ENHANCEMENTS[id]?.name ?? id,
  seal: (id: string) => SEALS[id]?.name ?? id,
  track: (id: string) => getTrack(id)?.name ?? id,
};
