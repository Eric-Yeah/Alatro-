import type { HandType, Rarity, Suit } from '../core/types';
import { HAND_DATA, HAND_ORDER } from './hands';
import { ENHANCEMENTS, SEALS } from './modifiers';
import { SUIT_NAMES } from './cards';

/**
 * Eigene Consumables (Thema: Sternwarte der Alchemisten), drei Typen:
 * Sternbild hebt das Level einer Hand, Elixier verändert Karten, Omen ist riskant.
 * Alle Zahlen stehen hier, die Engine (core/consumables.ts) wendet nur die Effekte an.
 */
export type ConsumableType = 'sternbild' | 'elixier' | 'omen';

export type ConsumableEffect =
  // Sternbild
  | { kind: 'levelHand'; hand: HandType; amount: number }
  // Elixier: Ziel Karten
  | { kind: 'enhance'; enhancement: string }
  | { kind: 'seal'; seal: string }
  | { kind: 'suit'; suit: Suit }
  | { kind: 'rankUp'; amount: number }
  /** kopiert die Ziel Karte, zerstört optional zufällige andere Karten */
  | { kind: 'clone'; copies: number; destroyOthers: number }
  | { kind: 'destroy' }
  // Elixier: ohne Ziel
  | { kind: 'doubleMoney'; cap: number }
  | { kind: 'createConsumables'; type: ConsumableType; count: number }
  // Omen
  /** zerstört zufällige Karten und fügt neue Karten mit Enhancement hinzu */
  | { kind: 'sacrificeForCards'; destroy: number; add: number }
  | { kind: 'destroyAndLevelAll'; destroy: number; levels: number }
  | { kind: 'jokerForMoney'; rarity: Rarity }
  /** ein zufälliger Joker erhält die Edition, alle anderen werden zerstört */
  | { kind: 'cauldron'; edition: string }
  | { kind: 'randomEdition'; handSizeDelta: number }
  | { kind: 'randomSeal'; destroyOthers: number }
  | { kind: 'tradeDiscardForHand' };

export interface ConsumableDef {
  id: string;
  type: ConsumableType;
  name: string;
  description: string;
  cost: number;
  /** Anzahl Ziel Karten aus der Hand (min bis max), ohne Angabe wirkt der Effekt ohne Ziel */
  targets?: { min: number; max: number };
  effect: ConsumableEffect;
}

export const CONSUMABLE_COST: Record<ConsumableType, number> = { sternbild: 3, elixier: 3, omen: 4 };

export const CONSUMABLE_TYPE_NAMES: Record<ConsumableType, string> = { sternbild: 'Sternbild', elixier: 'Elixier', omen: 'Omen' };

/** Karten in der Hand, die in Elixier und Omen Packs zum Auswählen der Ziele angezeigt werden */
export const PACK_HAND_SIZE = 8;

/** Mögliche Editions eines Omens, das eine Edition vergibt */
export const OMEN_EDITIONS = ['schimmer', 'aura', 'prisma'];

/** Kleinste erlaubte Hand Size nach Omen Effekten */
export const MIN_HAND_SIZE = 1;

const STERNBILD_NAMES: Record<HandType, string> = {
  highCard: 'Polarstern',
  pair: 'Zwillingsstern',
  twoPair: 'Doppelsonne',
  threeKind: 'Dreigestirn',
  straight: 'Himmelsleiter',
  flush: 'Milchstraße',
  fullHouse: 'Sternenhaus',
  fourKind: 'Südkreuz',
  straightFlush: 'Kometenpfad',
  fiveKind: 'Fünfgestirn',
  flushHouse: 'Nebelhaus',
  flushFive: 'Urnebel',
};

const STERNBILDER: ConsumableDef[] = HAND_ORDER.map((hand) => ({
  id: `sternbild_${hand}`,
  type: 'sternbild' as const,
  name: STERNBILD_NAMES[hand],
  description: `${HAND_DATA[hand].name} erhält +1 Level`,
  cost: CONSUMABLE_COST.sternbild,
  effect: { kind: 'levelHand' as const, hand, amount: 1 },
}));

const ENHANCE_ELIXIERS: [string, string][] = [
  ['kupfer', 'Kupferessenz'],
  ['rubin', 'Rubintinktur'],
  ['mondstein', 'Mondtropfen'],
  ['kristall', 'Kristallsud'],
  ['eisen', 'Eisenpulver'],
  ['obsidian', 'Obsidiansalbe'],
  ['quecksilber', 'Quecksilbertrank'],
  ['gold', 'Goldwasser'],
];

const SEAL_ELIXIERS: [string, string][] = [
  ['echo', 'Echowachs'],
  ['muenze', 'Münzwachs'],
  ['stern', 'Sternwachs'],
];

const SUIT_ELIXIERS: [Suit, string][] = [
  ['S', 'Nachtschwarz'],
  ['H', 'Purpurrot'],
  ['D', 'Bernstein'],
  ['C', 'Smaragdgrün'],
];

const elixier = (id: string, name: string, description: string, effect: ConsumableEffect, targets?: { min: number; max: number }): ConsumableDef =>
  ({ id: `elixier_${id}`, type: 'elixier', name, description, cost: CONSUMABLE_COST.elixier, effect, ...(targets ? { targets } : {}) });

const ELIXIERE: ConsumableDef[] = [
  ...ENHANCE_ELIXIERS.map(([e, name]) =>
    elixier(e, name, `Bis zu 2 Karten erhalten das Enhancement ${ENHANCEMENTS[e].name}`, { kind: 'enhance', enhancement: e }, { min: 1, max: 2 })),
  ...SEAL_ELIXIERS.map(([s, name]) =>
    elixier(s, name, `Eine Karte erhält das ${SEALS[s].name}`, { kind: 'seal', seal: s }, { min: 1, max: 1 })),
  ...SUIT_ELIXIERS.map(([s, name]) =>
    elixier(`suit_${s}`, name, `Bis zu 3 Karten werden zu ${SUIT_NAMES[s]}`, { kind: 'suit', suit: s }, { min: 1, max: 3 })),
  elixier('aufstieg', 'Aufstieg', 'Bis zu 2 Karten steigen um 1 Rang auf (Ace wird zu 2)', { kind: 'rankUp', amount: 1 }, { min: 1, max: 2 }),
  elixier('doppelgaenger', 'Doppelgänger', 'Eine Karte wird kopiert, die Kopie kommt ins Deck und in die Hand', { kind: 'clone', copies: 1, destroyOthers: 0 }, { min: 1, max: 1 }),
  elixier('aufloesung', 'Auflösung', 'Bis zu 2 Karten werden zerstört', { kind: 'destroy' }, { min: 1, max: 2 }),
  elixier('erntemond', 'Erntemond', 'Verdoppelt dein Geld (höchstens +$20)', { kind: 'doubleMoney', cap: 20 }),
  elixier('sternkarte', 'Sternkarte', 'Erzeugt bis zu 2 Sternbilder', { kind: 'createConsumables', type: 'sternbild', count: 2 }),
  elixier('alchemistentisch', 'Alchemistentisch', 'Erzeugt bis zu 2 Elixiere', { kind: 'createConsumables', type: 'elixier', count: 2 }),
];

const omen = (id: string, name: string, description: string, effect: ConsumableEffect, targets?: { min: number; max: number }): ConsumableDef =>
  ({ id: `omen_${id}`, type: 'omen', name, description, cost: CONSUMABLE_COST.omen, effect, ...(targets ? { targets } : {}) });

const OMEN: ConsumableDef[] = [
  omen('blutmond', 'Blutmond', 'Zerstört 1 zufällige Karte, fügt 3 zufällige Karten mit Enhancement hinzu', { kind: 'sacrificeForCards', destroy: 1, add: 3 }),
  omen('aschenregen', 'Aschenregen', 'Zerstört 2 zufällige Karten, alle Hände erhalten +1 Level', { kind: 'destroyAndLevelAll', destroy: 2, levels: 1 }),
  omen('teufelsmarkt', 'Teufelsmarkt', 'Erzeugt einen zufälligen Rare Joker, dein Geld sinkt auf $0', { kind: 'jokerForMoney', rarity: 'rare' }),
  omen('hexenkessel', 'Hexenkessel', 'Ein zufälliger Joker erhält die Edition Prisma, alle anderen Jokers werden zerstört', { kind: 'cauldron', edition: 'prisma' }),
  omen('kometenstaub', 'Kometenstaub', 'Eine Karte erhält eine zufällige Edition, dauerhaft -1 Hand Size', { kind: 'randomEdition', handSizeDelta: -1 }, { min: 1, max: 1 }),
  omen('siegelsturm', 'Siegelsturm', 'Eine Karte erhält ein zufälliges Seal, 2 zufällige andere Karten werden zerstört', { kind: 'randomSeal', destroyOthers: 2 }, { min: 1, max: 1 }),
  omen('nachtpakt', 'Nachtpakt', 'Dauerhaft +1 Hand und -1 Discard pro Runde', { kind: 'tradeDiscardForHand' }),
  omen('ahnenruf', 'Ahnenruf', 'Erzeugt einen zufälligen Legendary Joker, dein Geld sinkt auf $0', { kind: 'jokerForMoney', rarity: 'legendary' }),
  omen('spiegelsaal', 'Spiegelsaal', 'Eine Karte wird 2 Mal kopiert, 2 zufällige andere Karten werden zerstört', { kind: 'clone', copies: 2, destroyOthers: 2 }, { min: 1, max: 1 }),
];

export const CONSUMABLES: ConsumableDef[] = [...STERNBILDER, ...ELIXIERE, ...OMEN];

export const CONSUMABLE_BY_ID: Record<string, ConsumableDef> = Object.fromEntries(CONSUMABLES.map((c) => [c.id, c]));
