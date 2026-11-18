import type { RunMods } from './modsSpec';

/** Eigene Voucher Paare: Basis und Upgrade (Upgrade nur nach Kauf der Basis). */
export interface VoucherDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  /** Voraussetzung für Upgrades */
  requires?: string;
  mods: RunMods;
}

export const VOUCHER_COST = 10;

export const VOUCHERS: VoucherDef[] = [
  { id: 'lagerhaus', name: 'Lagerhaus', description: '+1 Karten Slot im Shop', cost: VOUCHER_COST, mods: { shopSlotsDelta: 1 } },
  { id: 'grosslager', name: 'Großlager', description: '+1 weiterer Karten Slot im Shop', cost: VOUCHER_COST, requires: 'lagerhaus', mods: { shopSlotsDelta: 1 } },
  { id: 'rabattmarke', name: 'Rabattmarke', description: 'Karten und Packs kosten 25% weniger', cost: VOUCHER_COST, mods: { discount: 0.75 } },
  { id: 'grosshaendler', name: 'Großhändler', description: 'Karten und Packs kosten 50% weniger', cost: VOUCHER_COST, requires: 'rabattmarke', mods: { discount: 0.5 } },
  { id: 'wuerfelbecher', name: 'Würfelbecher', description: 'Rerolls kosten $2 weniger', cost: VOUCHER_COST, mods: { rerollDelta: -2 } },
  { id: 'gezinkte_wuerfel', name: 'Gezinkte Würfel', description: 'Rerolls kosten weitere $2 weniger', cost: VOUCHER_COST, requires: 'wuerfelbecher', mods: { rerollDelta: -2 } },
  { id: 'sparbuch', name: 'Sparbuch', description: 'Zinsdeckel steigt auf $10', cost: VOUCHER_COST, mods: { interestCap: 10 } },
  { id: 'tresor', name: 'Tresor', description: 'Zinsdeckel steigt auf $20', cost: VOUCHER_COST, requires: 'sparbuch', mods: { interestCap: 20 } },
  { id: 'taschenuhr', name: 'Taschenuhr', description: '+1 Hand pro Runde', cost: VOUCHER_COST, mods: { handsDelta: 1 } },
  { id: 'sonnenuhr', name: 'Sonnenuhr', description: '+1 weitere Hand pro Runde', cost: VOUCHER_COST, requires: 'taschenuhr', mods: { handsDelta: 1 } },
  { id: 'besen', name: 'Besen', description: '+1 Discard pro Runde', cost: VOUCHER_COST, mods: { discardsDelta: 1 } },
  { id: 'sturmbesen', name: 'Sturmbesen', description: '+1 weiterer Discard pro Runde', cost: VOUCHER_COST, requires: 'besen', mods: { discardsDelta: 1 } },
  { id: 'schmuckkasten', name: 'Schmuckkasten', description: 'Editions erscheinen doppelt so oft', cost: VOUCHER_COST, mods: { editionRate: 2 } },
  { id: 'juwelier', name: 'Juwelier', description: 'Editions erscheinen viermal so oft', cost: VOUCHER_COST, requires: 'schmuckkasten', mods: { editionRate: 4 } },
  { id: 'werkbank', name: 'Werkbank', description: '+1 Hand Size', cost: VOUCHER_COST, mods: { handSizeDelta: 1 } },
  { id: 'beutel', name: 'Beutel', description: '+1 Consumable Slot', cost: VOUCHER_COST, mods: { consumableSlotsDelta: 1 } },
  { id: 'rucksack', name: 'Rucksack', description: '+1 weiterer Consumable Slot', cost: VOUCHER_COST, requires: 'beutel', mods: { consumableSlotsDelta: 1 } },
  { id: 'sternenhaendler', name: 'Sternenhändler', description: 'Sternbilder erscheinen 2,4 Mal so oft im Shop', cost: VOUCHER_COST, mods: { typeWeights: { sternbild: 9.6 } } },
  { id: 'sternenmagnat', name: 'Sternenmagnat', description: 'Sternbilder erscheinen 8 Mal so oft im Shop', cost: VOUCHER_COST, requires: 'sternenhaendler', mods: { typeWeights: { sternbild: 32 } } },
  { id: 'kraeuterhaendler', name: 'Kräuterhändler', description: 'Elixiere erscheinen 2,4 Mal so oft im Shop', cost: VOUCHER_COST, mods: { typeWeights: { elixier: 9.6 } } },
  { id: 'apotheker', name: 'Apotheker', description: 'Elixiere erscheinen 8 Mal so oft im Shop', cost: VOUCHER_COST, requires: 'kraeuterhaendler', mods: { typeWeights: { elixier: 32 } } },
  { id: 'fernrohr', name: 'Fernrohr', description: 'Ein Sternbild im Consumable Slot gibt X1,5 Mult, wenn seine Hand gespielt wird', cost: VOUCHER_COST, mods: { sternbildXMult: 1.5 } },
  { id: 'grossfernrohr', name: 'Großfernrohr', description: 'Ein Sternbild im Consumable Slot gibt X2 Mult, wenn seine Hand gespielt wird', cost: VOUCHER_COST, requires: 'fernrohr', mods: { sternbildXMult: 2 } },
  { id: 'kartentisch', name: 'Kartentisch', description: 'Spielkarten erscheinen im Shop', cost: VOUCHER_COST, mods: { typeWeights: { karte: 4 } } },
  { id: 'veredlertisch', name: 'Veredlertisch', description: 'Spielkarten im Shop kommen mit Enhancement, Seal oder Edition', cost: VOUCHER_COST, requires: 'kartentisch', mods: { shopCardMods: true } },
  { id: 'meisterwerkstatt', name: 'Meisterwerkstatt', description: '+1 Joker Slot', cost: VOUCHER_COST, requires: 'werkbank', mods: { jokerSlotsDelta: 1 } },
];
