import { DECKS } from '../../data/decks';

/** Englische Namen und Beschreibungen der Decks (Schlüssel ist die Deck Id). */
export const EN: Record<string, { name: string; description: string }> = {
  nachthimmel: { name: 'Night Sky', description: 'The standard deck' },
  glut: { name: 'Ember Deck', description: '+1 Discard per round' },
  tiefsee: { name: 'Deep Sea Deck', description: '+1 Hand per round, -1 Discard' },
  waage: { name: 'Golden Scales', description: 'Chips and Mult are averaged before multiplying, Blind targets X2' },
  alchemist: { name: 'Alchemist Deck', description: 'All 10s and Face Cards start as Copper' },
  sternenkind: { name: 'Starchild', description: '+1 Joker Slot, -1 Hand Size' },
  halbmond: { name: 'Half Moon', description: 'No Face Cards in the deck (40 cards)' },
};

export default function patch() {
  for (const d of DECKS) {
    const e = EN[d.id];
    if (!e) continue;
    d.name = e.name;
    d.description = e.description;
  }
}
