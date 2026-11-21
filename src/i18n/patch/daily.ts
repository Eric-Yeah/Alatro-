import { TWISTS } from '../../data/daily';

/** Englische Namen und Beschreibungen der Tageswandlungen (Schlüssel ist die Twist Id). */
export const EN: Record<string, { name: string; description: string }> = {
  goldregen: { name: 'Gold Rain', description: 'Interest cap $10, but only $2 starting money' },
  vollmond: { name: 'Full Moon', description: '+2 Hand Size, Blind targets +25%' },
  sparflamme: { name: 'Low Flame', description: '+2 Hands, -2 Discards per round' },
  luftig: { name: 'Airy Pockets', description: '+2 Consumable Slots, -1 Joker Slot' },
  raritaeten: { name: 'Rarity Market', description: 'Editions appear three times as often' },
  schnaeppchen: { name: 'Bargain Hunt', description: 'Everything costs half, but one Shop slot less' },
  wunderladen: { name: 'Wonder Shop', description: 'Playing cards in the Shop come with modifiers, Reroll starts at $3' },
};

export default function patch() {
  for (const tw of TWISTS) {
    const e = EN[tw.id];
    if (!e) continue;
    tw.name = e.name;
    tw.description = e.description;
  }
}
