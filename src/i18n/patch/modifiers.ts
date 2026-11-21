import { EDITIONS, ENHANCEMENTS, SEALS } from '../../data/modifiers';

/**
 * Englische Namen und Beschreibungen der Karten Modifikatoren (Enhancements, Seals, Editions).
 * Schlüssel ist jeweils die Id. Kupfer heißt "Copper", Gold "Aurum" (Alchemie), "Schatten" wird "Umbra".
 */
type Entry = { name: string; description: string };

export const ENHANCEMENTS_EN: Record<string, Entry> = {
  kupfer: { name: 'Copper', description: '+25 Chips' },
  rubin: { name: 'Ruby', description: '+5 Mult' },
  mondstein: { name: 'Moonstone', description: '+10 Chips and +2 Mult' },
  kristall: { name: 'Crystal', description: 'X1.75 Mult, 1 in 5 chance to shatter' },
  eisen: { name: 'Iron', description: 'X1.4 Mult while held in hand' },
  obsidian: { name: 'Obsidian', description: '+40 Chips, no rank, no suit, always scores' },
  quecksilber: { name: 'Quicksilver', description: 'Counts as every suit' },
  gold: { name: 'Aurum', description: '+$2 when scored' },
};

export const SEALS_EN: Record<string, Entry> = {
  echo: { name: 'Echo Seal', description: 'The card is scored one extra time' },
  muenze: { name: 'Coin Seal', description: '+$2 when scored' },
  stern: { name: 'Star Seal', description: 'At the end of the round, if held in hand: creates the Constellation of the last hand played' },
};

export const EDITIONS_EN: Record<string, Entry> = {
  schimmer: { name: 'Shimmer', description: '+40 Chips' },
  aura: { name: 'Halo', description: '+8 Mult' },
  prisma: { name: 'Prism', description: 'X1.5 Mult' },
  schatten: { name: 'Umbra', description: '+1 Slot' },
};

function apply(target: Record<string, Entry>, dict: Record<string, Entry>) {
  for (const [id, def] of Object.entries(target)) {
    const e = dict[id];
    if (!e) continue;
    def.name = e.name;
    def.description = e.description;
  }
}

export default function patch() {
  apply(ENHANCEMENTS, ENHANCEMENTS_EN);
  apply(SEALS, SEALS_EN);
  apply(EDITIONS, EDITIONS_EN);
}
