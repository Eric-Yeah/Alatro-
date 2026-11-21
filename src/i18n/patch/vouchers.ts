import { VOUCHERS } from '../../data/vouchers';

/** Englische Namen und Beschreibungen der Vouchers (Schlüssel ist die Voucher Id). */
export const EN: Record<string, { name: string; description: string }> = {
  lagerhaus: { name: 'Warehouse', description: '+1 card slot in the Shop' },
  grosslager: { name: 'Grand Warehouse', description: '+1 more card slot in the Shop' },
  rabattmarke: { name: 'Coupon Stamp', description: 'Cards and Packs cost 25% less' },
  grosshaendler: { name: 'Wholesaler', description: 'Cards and Packs cost 50% less' },
  wuerfelbecher: { name: 'Dice Cup', description: 'Rerolls cost $2 less' },
  gezinkte_wuerfel: { name: 'Loaded Dice', description: 'Rerolls cost another $2 less' },
  sparbuch: { name: 'Passbook', description: 'Interest cap rises to $10' },
  tresor: { name: 'Vault', description: 'Interest cap rises to $20' },
  taschenuhr: { name: 'Pocket Watch', description: '+1 Hand per round' },
  sonnenuhr: { name: 'Sundial', description: '+1 more Hand per round' },
  besen: { name: 'Broom', description: '+1 Discard per round' },
  sturmbesen: { name: 'Storm Broom', description: '+1 more Discard per round' },
  schmuckkasten: { name: 'Jewelry Box', description: 'Editions appear twice as often' },
  juwelier: { name: 'Jeweler', description: 'Editions appear four times as often' },
  werkbank: { name: 'Workbench', description: '+1 Hand Size' },
  beutel: { name: 'Pouch', description: '+1 Consumable Slot' },
  rucksack: { name: 'Backpack', description: '+1 more Consumable Slot' },
  sternenhaendler: { name: 'Star Broker', description: 'Constellations appear 2.4 times as often in the Shop' },
  sternenmagnat: { name: 'Star Magnate', description: 'Constellations appear 8 times as often in the Shop' },
  kraeuterhaendler: { name: 'Herbalist', description: 'Elixirs appear 2.4 times as often in the Shop' },
  apotheker: { name: 'Apothecary', description: 'Elixirs appear 8 times as often in the Shop' },
  fernrohr: { name: 'Refractor', description: 'A Constellation in a Consumable Slot gives X1.5 Mult when its hand is played' },
  grossfernrohr: { name: 'Great Refractor', description: 'A Constellation in a Consumable Slot gives X2 Mult when its hand is played' },
  kartentisch: { name: 'Card Table', description: 'Playing cards appear in the Shop' },
  veredlertisch: { name: 'Refining Table', description: 'Playing cards in the Shop come with an Enhancement, Seal or Edition' },
  meisterwerkstatt: { name: 'Master Workshop', description: '+1 Joker Slot' },
};

export default function patch() {
  for (const v of VOUCHERS) {
    const e = EN[v.id];
    if (!e) continue;
    v.name = e.name;
    v.description = e.description;
  }
}
