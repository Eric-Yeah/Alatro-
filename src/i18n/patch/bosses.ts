import { BOSSES } from '../../data/bosses';

/** Englische Namen und Beschreibungen der Boss Blinds (Schlüssel ist die Boss Id). "geschwächt" heißt "debuffed". */
export const EN: Record<string, { name: string; description: string }> = {
  mondfinsternis: { name: 'The Lunar Eclipse', description: 'All cards of a random suit are debuffed' },
  nebel: { name: 'The Fog', description: 'All Face Cards are debuffed' },
  ebbe: { name: 'The Low Tide', description: '-1 Hand Size' },
  schwerkraft: { name: 'The Gravity', description: 'Played hands score one level lower' },
  schleier: { name: 'The Veil', description: 'Base Chips and Base Mult are halved' },
  spiegel: { name: 'The Mirror', description: 'Each hand type scores only the first time' },
  monolith: { name: 'The Monolith', description: 'Huge target' },
  dieb: { name: 'The Thief', description: '-$2 per hand played' },
  frostbiss: { name: 'The Frostbite', description: 'All cards with an even rank are debuffed' },
  stille: { name: 'The Silence', description: 'The rightmost Joker is debuffed' },
  gier: { name: 'The Greed', description: 'Hands with fewer than 3 cards do not score' },
  sturm: { name: 'The Storm', description: 'Only 1 Discard this round' },
  ereignishorizont: { name: 'The Event Horizon', description: 'Enormous target' },
  polarnacht: { name: 'The Polar Night', description: '-2 Hand Size, only 1 Discard' },
};

export default function patch() {
  for (const b of BOSSES) {
    const e = EN[b.id];
    if (!e) continue;
    b.name = e.name;
    b.description = e.description;
  }
}
