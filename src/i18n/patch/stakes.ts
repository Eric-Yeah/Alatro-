import { STAKES } from '../../data/stakes';

/** Englische Namen und Beschreibungen der Stakes (Schlüssel ist die Stake Id). */
export const EN: Record<string, { name: string; description: string }> = {
  morgenrot: { name: 'Red Dawn', description: 'Beginner: Blind targets 25% lower, +1 Discard per round' },
  daemmerung: { name: 'Twilight', description: 'Base difficulty' },
  abend: { name: 'Evening', description: 'Small Blind gives no reward' },
  mitternacht: { name: 'Midnight', description: 'Blind targets grow faster' },
  tiefe_nacht: { name: 'Deep Night', description: '-1 Discard per round' },
  finsternis: { name: 'Pitch Black', description: 'Blind targets grow even faster' },
  ewige_nacht: { name: 'Eternal Night', description: '-1 Hand Size' },
};

export default function patch() {
  for (const s of STAKES) {
    const e = EN[s.id];
    if (!e) continue;
    s.name = e.name;
    s.description = e.description;
  }
}
