// Englische Namen und Beschreibungen der Kartenpaletten (src/data/cardArt/cardPalettes.ts).
import { CARD_PALETTES } from '../../data/cardArt/cardPalettes';

const EN: Record<string, { name: string; description: string }> = {
  standard: { name: 'Standard', description: 'Muted, dark tones' },
  kontrast: { name: 'High Contrast', description: 'Strong colors, easy to tell apart' },
  bernstein: { name: 'Amber', description: 'Warm resin, parchment and honey gold' },
  tintenmeer: { name: 'Ink Sea', description: 'Deep blue, sea green and coral red' },
  mondsilber: { name: 'Moon Silver', description: 'Cool silver, dusk blue and rose red' },
  glutkern: { name: 'Ember Core', description: 'Charred black with glowing red' },
};

export default function patch() {
  for (const p of Object.values(CARD_PALETTES)) {
    const en = EN[p.id];
    if (!en) continue;
    p.name = en.name;
    p.description = en.description;
  }
}
