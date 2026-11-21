import { PACKS } from '../../data/packs';

/** Englische Namen der Booster Packs (Schlüssel ist die Pack Id). Karten heißt "Card", Sternbild "Constellation". */
export const EN: Record<string, { name: string }> = {
  karten_normal: { name: 'Card Pack' },
  karten_jumbo: { name: 'Jumbo Card Pack' },
  karten_mega: { name: 'Mega Card Pack' },
  joker_normal: { name: 'Joker Pack' },
  joker_jumbo: { name: 'Jumbo Joker Pack' },
  joker_mega: { name: 'Mega Joker Pack' },
  sternbild_normal: { name: 'Constellation Pack' },
  sternbild_jumbo: { name: 'Jumbo Constellation Pack' },
  sternbild_mega: { name: 'Mega Constellation Pack' },
  elixier_normal: { name: 'Elixir Pack' },
  elixier_jumbo: { name: 'Jumbo Elixir Pack' },
  elixier_mega: { name: 'Mega Elixir Pack' },
  omen_normal: { name: 'Omen Pack' },
  omen_jumbo: { name: 'Jumbo Omen Pack' },
  omen_mega: { name: 'Mega Omen Pack' },
};

export default function patch() {
  for (const p of PACKS) {
    const e = EN[p.id];
    if (e) p.name = e.name;
  }
}
