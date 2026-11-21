import { CONSUMABLES, CONSUMABLE_TYPE_NAMES } from '../../data/consumables';
import type { ConsumableType } from '../../data/consumables';
import { HAND_DATA } from '../../data/hands';
import type { HandType } from '../../core/types';

/**
 * Englische Namen und Beschreibungen der Consumables (Schlüssel ist die Consumable Id).
 * Die deutschen Beschreibungen werden beim Laden aus Hand, Enhancement und Seal Namen zusammengesetzt,
 * deshalb stehen die englischen hier vollständig. Sternbild heißt "Constellation", Elixier "Elixir".
 */
export const TYPE_NAMES_EN: Record<ConsumableType, string> = { sternbild: 'Constellation', elixier: 'Elixir', omen: 'Omen' };

/** Namen der Sternbilder je Hand, die Beschreibung ergibt sich aus dem (englischen) Hand Namen */
export const CONSTELLATION_NAMES_EN: Record<HandType, string> = {
  highCard: 'Polaris',
  pair: 'Twin Stars',
  twoPair: 'Binary Suns',
  threeKind: "Orion's Belt",
  straight: 'Sky Ladder',
  flush: 'Milky Way',
  fullHouse: 'House of Stars',
  fourKind: 'Southern Cross',
  straightFlush: 'Comet Trail',
  fiveKind: 'Pentastar',
  flushHouse: 'Nebula House',
  flushFive: 'Primal Nebula',
};

const HANDS = Object.keys(CONSTELLATION_NAMES_EN) as HandType[];

export const EN: Record<string, { name: string; description: string }> = {
  ...Object.fromEntries(HANDS.map((h) => [
    `sternbild_${h}`,
    { name: CONSTELLATION_NAMES_EN[h], description: `${HAND_DATA[h].name} gains +1 Level` },
  ])),

  // Elixier: Enhancements
  elixier_kupfer: { name: 'Copper Essence', description: 'Up to 2 cards gain the Copper Enhancement' },
  elixier_rubin: { name: 'Ruby Tincture', description: 'Up to 2 cards gain the Ruby Enhancement' },
  elixier_mondstein: { name: 'Moon Drops', description: 'Up to 2 cards gain the Moonstone Enhancement' },
  elixier_kristall: { name: 'Crystal Brew', description: 'Up to 2 cards gain the Crystal Enhancement' },
  elixier_eisen: { name: 'Iron Powder', description: 'Up to 2 cards gain the Iron Enhancement' },
  elixier_obsidian: { name: 'Obsidian Salve', description: 'Up to 2 cards gain the Obsidian Enhancement' },
  elixier_quecksilber: { name: 'Quicksilver Draught', description: 'Up to 2 cards gain the Quicksilver Enhancement' },
  elixier_gold: { name: 'Aurum Water', description: 'Up to 2 cards gain the Aurum Enhancement' },
  // Elixier: Seals
  elixier_echo: { name: 'Echo Wax', description: 'One card gains the Echo Seal' },
  elixier_muenze: { name: 'Coin Wax', description: 'One card gains the Coin Seal' },
  elixier_stern: { name: 'Star Wax', description: 'One card gains the Star Seal' },
  // Elixier: Suits
  elixier_suit_S: { name: 'Jet Black', description: 'Up to 3 cards become Spades' },
  elixier_suit_H: { name: 'Crimson', description: 'Up to 3 cards become Hearts' },
  elixier_suit_D: { name: 'Amber', description: 'Up to 3 cards become Diamonds' },
  elixier_suit_C: { name: 'Emerald', description: 'Up to 3 cards become Clubs' },
  // Elixier: Rest
  elixier_aufstieg: { name: 'Ascension', description: 'Up to 2 cards rank up by 1 (Ace becomes 2)' },
  elixier_doppelgaenger: { name: 'Doppelganger', description: 'One card is copied, the copy goes into the deck and your hand' },
  elixier_aufloesung: { name: 'Dissolution', description: 'Up to 2 cards are destroyed' },
  elixier_erntemond: { name: 'Harvest Moon', description: 'Doubles your money (at most +$20)' },
  elixier_sternkarte: { name: 'Star Chart', description: 'Creates up to 2 Constellations' },
  elixier_alchemistentisch: { name: "Alchemist's Table", description: 'Creates up to 2 Elixirs' },

  // Omen
  omen_blutmond: { name: 'Blood Moon', description: 'Destroys 1 random card, adds 3 random cards with an Enhancement' },
  omen_aschenregen: { name: 'Ashfall', description: 'Destroys 2 random cards, all hands gain +1 Level' },
  omen_teufelsmarkt: { name: "Devil's Bazaar", description: 'Creates a random Rare Joker, your money drops to $0' },
  omen_hexenkessel: { name: "Witch's Cauldron", description: 'A random Joker gains the Prism Edition, all other Jokers are destroyed' },
  omen_kometenstaub: { name: 'Comet Dust', description: 'One card gains a random Edition, permanently -1 Hand Size' },
  omen_siegelsturm: { name: 'Seal Storm', description: 'One card gains a random Seal, 2 random other cards are destroyed' },
  omen_nachtpakt: { name: 'Night Pact', description: 'Permanently +1 Hand and -1 Discard per round' },
  omen_ahnenruf: { name: 'Ancestral Call', description: 'Creates a random Legendary Joker, your money drops to $0' },
  omen_spiegelsaal: { name: 'Hall of Mirrors', description: 'One card is copied 2 times, 2 random other cards are destroyed' },
};

/** Schreibt die Consumable Definitionen (dieselben Objekte wie in CONSUMABLE_BY_ID) und die Typnamen um */
export default function patch() {
  for (const c of CONSUMABLES) {
    const e = EN[c.id];
    if (!e) continue;
    c.name = e.name;
    c.description = e.description;
  }
  Object.assign(CONSUMABLE_TYPE_NAMES, TYPE_NAMES_EN);
}
