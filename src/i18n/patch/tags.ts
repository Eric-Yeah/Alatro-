import { TAGS } from '../../data/tags';

/** Englische Namen und Beschreibungen der Tags (Schlüssel ist die Tag Id). */
export const EN: Record<string, { name: string; description: string }> = {
  goldstaub: { name: 'Gold Dust', description: '+$8 immediately' },
  wanderer: { name: 'Wanderer', description: '+$3 per Blind skipped so far' },
  wuerfelglueck: { name: 'Dice Luck', description: 'The first 2 Rerolls in the next Shop are free' },
  sternenrabatt: { name: 'Star Discount', description: 'Everything costs half in the next Shop' },
  komet: { name: 'Comet', description: 'The next Shop contains a free Uncommon Joker' },
  supernova: { name: 'Nova', description: 'The next Shop contains a free Rare Joker' },
  gauklerkiste: { name: "Jester's Chest", description: 'Immediately opens a free Mega Joker Pack' },
  kartenregen: { name: 'Card Rain', description: 'Immediately opens a free Mega Card Pack' },
  sternschnuppe: { name: 'Shooting Star', description: 'Immediately opens a free Mega Constellation Pack' },
  alchemistenkiste: { name: "Alchemist's Chest", description: 'Immediately opens a free Mega Elixir Pack' },
  nachtwache: { name: 'Night Watch', description: '+1 Hand in the next round' },
  schutzzauber: { name: 'Ward', description: 'Disables the effect of the next Boss Blind' },
  doppelstern: { name: 'Double Star', description: 'The next Tag counts twice' },
};

export default function patch() {
  for (const tag of TAGS) {
    const e = EN[tag.id];
    if (!e) continue;
    tag.name = e.name;
    tag.description = e.description;
  }
}
