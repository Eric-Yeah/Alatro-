import { allJokers, type JokerDef } from '../core/jokers';

/**
 * Merkt sich die deutschen Joker Beschreibungen, bevor `applyDataLanguage()` sie bei Englisch umschreibt.
 * Die Wirkungs Marken und Auslöser Texte der Oberfläche (`jokerInfo.ts`) leiten sich aus dem Wortlaut der
 * Beschreibung ab. Mit dem deutschen Original bleiben sie in beiden Sprachen gleich, unabhängig davon,
 * wie die englische Beschreibung formuliert ist.
 */
const jokerDe = new Map<string, string>();

/** Muss vor `applyDataLanguage()` laufen (siehe boot.ts). Mehrfaches Aufrufen schadet nicht. */
export function snapshotGerman() {
  for (const d of allJokers()) if (!jokerDe.has(d.id)) jokerDe.set(d.id, d.description);
}

/** Deutsche Beschreibung eines Jokers (Platzhalter unersetzt), ohne Merkzettel die aktuelle */
export function germanJokerText(def: JokerDef): string {
  return jokerDe.get(def.id) ?? def.description;
}
