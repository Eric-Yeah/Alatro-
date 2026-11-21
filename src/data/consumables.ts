import type { HandType, Rank, Rarity, Suit } from '../core/types';
import { HAND_DATA, HAND_ORDER } from './hands';
import { EDITIONS, ENHANCEMENTS, SEALS } from './modifiers';
import { SUIT_NAMES } from './cards';
import { TAGS } from './tags';

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
  | { kind: 'tradeDiscardForHand' }
  // Elixier: weitere Ziel Karten Effekte
  /** setzt den Rang der Ziel Karten fest */
  | { kind: 'setRank'; rank: Rank }
  /** alle Ziel Karten übernehmen den höchsten Rang unter ihnen */
  | { kind: 'matchRank' }
  /** alle Ziel Karten übernehmen die häufigste Suit unter ihnen (Gleichstand: Reihenfolge von SUITS) */
  | { kind: 'matchSuit' }
  /** die Ziel Karte (braucht ein Enhancement) überträgt es auf zufällige andere Karten der Hand */
  | { kind: 'spreadEnhancement'; copies: number }
  /** die Ziel Karte erhält eine feste Edition, optional werden zufällige andere Karten zerstört */
  | { kind: 'edition'; edition: string; destroyOthers: number }
  | { kind: 'destroyForMoney'; money: number }
  // Elixier: ohne Ziel
  /** Geld je Karte im Deck mit Enhancement, Seal oder Edition */
  | { kind: 'moneyPerModified'; per: number; cap: number }
  /** Level für die meistgespielte Hand, alle anderen Hände ändern sich um othersDelta (Level mindestens 1) */
  | { kind: 'levelMostPlayed'; amount: number; othersDelta: number }
  /** legt einen wartenden Tag ab, optional sinkt das Geld auf die Hälfte (abgerundet) */
  | { kind: 'addTag'; tagId: string; halveMoney: boolean }
  /** zieht Karten aus dem Nachziehstapel auf die Hand (nur in einer Runde) */
  | { kind: 'drawCards'; count: number }
  /** zusätzliche Discards nur für diese Runde */
  | { kind: 'extraDiscards'; amount: number }
  // Omen
  /** ein zufälliger Joker ohne Edition erhält eine zufällige Edition aus der Liste, dauerhaft Hand Size Änderung */
  | { kind: 'jokerEdition'; editions: string[]; handSizeDelta: number }
  /** kopiert einen zufälligen Joker (freier Slot) mit Chance num in den, sonst wird er zerstört */
  | { kind: 'jokerDuplicate'; num: number; den: number }
  /** dauerhaft mehr Hand Size, dafür werden zufällige Handkarten zerstört */
  | { kind: 'handSizeUp'; delta: number; destroy: number }
  /** dauerhaft mehr Consumable Slots, dafür Änderung der Hand Size */
  | { kind: 'slotUp'; slots: number; handSizeDelta: number }
  /** dauerhaft weniger Hands und mehr Discards pro Runde */
  | { kind: 'tradeHandForDiscard'; hands: number; discards: number }
  /** ein zufälliger Joker der Rarity common oder uncommon wird durch einen der nächsten Rarity ersetzt, alle Hände verlieren Level */
  | { kind: 'jokerUpgrade'; levelLoss: number }
  /** zerstört zufällige Handkarten, alle übrigen Handkarten werden zu einer zufälligen Suit */
  | { kind: 'monoSuit'; destroy: number };

export interface ConsumableDef {
  id: string;
  type: ConsumableType;
  name: string;
  description: string;
  cost: number;
  /** Anzahl Ziel Karten aus der Hand (min bis max), ohne Angabe wirkt der Effekt ohne Ziel */
  targets?: { min: number; max: number };
  effect: ConsumableEffect;
  /** relatives Gewicht beim Ziehen im Shop und in Packs (Standard 1), starke Karten sind seltener */
  weight?: number;
}

export const CONSUMABLE_COST: Record<ConsumableType, number> = { sternbild: 3, elixier: 3, omen: 4 };

export const CONSUMABLE_TYPE_NAMES: Record<ConsumableType, string> = { sternbild: 'Sternbild', elixier: 'Elixier', omen: 'Omen' };

/** Karten in der Hand, die in Elixier und Omen Packs zum Auswählen der Ziele angezeigt werden */
export const PACK_HAND_SIZE = 8;

/** Mögliche Editions eines Omens, das eine Edition vergibt */
export const OMEN_EDITIONS = ['schimmer', 'aura', 'prisma'];

/** Kleinste erlaubte Hand Size nach Omen Effekten */
export const MIN_HAND_SIZE = 1;

/** Obergrenzen für dauerhafte Verbesserungen durch Omen (Hand Size und Consumable Slots) */
export const MAX_HAND_SIZE = 12;
export const MAX_CONSUMABLE_SLOTS = 4;

/** Mindestanzahl Hände pro Runde nach Omen, die Hands eintauschen */
export const MIN_HANDS = 1;

/** Rarity Stufen für Omen, die einen Joker aufwerten (der letzte Eintrag hat keine höhere Stufe) */
export const JOKER_UPGRADE_CHAIN: Rarity[] = ['common', 'uncommon', 'rare'];

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

const elixier = (id: string, name: string, description: string, effect: ConsumableEffect, targets?: { min: number; max: number }, weight?: number): ConsumableDef =>
  ({ id: `elixier_${id}`, type: 'elixier', name, description, cost: CONSUMABLE_COST.elixier, effect, ...(targets ? { targets } : {}), ...(weight !== undefined ? { weight } : {}) });

const tagText = (tagId: string) => {
  const tag = TAGS.find((t) => t.id === tagId)!;
  return `Tag ${tag.name}: ${tag.description}`;
};

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

  // Zweite Reihe: andere Ziele (Rang, Suit, Edition, Geld, Level, Tags, Ziehen)
  elixier('gipfelglanz', 'Gipfelglanz', `Bis zu 2 Karten werden zu ${'Ace'}`, { kind: 'setRank', rank: 14 }, { min: 1, max: 2 }),
  elixier('gleichklang', 'Gleichklang', '2 bis 3 Karten übernehmen den höchsten Rang unter ihnen', { kind: 'matchRank' }, { min: 2, max: 3 }),
  elixier('spektralglas', 'Spektralglas', '2 bis 4 Karten übernehmen die häufigste Suit unter ihnen', { kind: 'matchSuit' }, { min: 2, max: 4 }),
  elixier('abguss', 'Abguss', 'Eine Karte mit Enhancement überträgt es auf 2 zufällige andere Karten der Hand', { kind: 'spreadEnhancement', copies: 2 }, { min: 1, max: 1 }),
  elixier('glanzfirnis', 'Glanzfirnis', `Eine Karte erhält die Edition ${EDITIONS.schimmer.name}`, { kind: 'edition', edition: 'schimmer', destroyOthers: 0 }, { min: 1, max: 1 }),
  elixier('flammenfirnis', 'Flammenfirnis', `Eine Karte erhält die Edition ${EDITIONS.aura.name}`, { kind: 'edition', edition: 'aura', destroyOthers: 0 }, { min: 1, max: 1 }, 0.6),
  elixier('pfandsiegel', 'Pfandsiegel', 'Eine Karte wird zerstört, du erhältst $3', { kind: 'destroyForMoney', money: 3 }, { min: 1, max: 1 }),
  elixier('goldwaage', 'Goldwaage', '+$1 für jede Karte im Deck mit Enhancement, Seal oder Edition (höchstens $10)', { kind: 'moneyPerModified', per: 1, cap: 10 }),
  elixier('leitstern', 'Leitstern', 'Die meistgespielte Hand erhält +1 Level', { kind: 'levelMostPlayed', amount: 1, othersDelta: 0 }, undefined, 0.8),
  elixier('nachtlicht', 'Nachtlicht', tagText('nachtwache'), { kind: 'addTag', tagId: 'nachtwache', halveMoney: false }),
  elixier('bannwasser', 'Bannwasser', tagText('schutzzauber'), { kind: 'addTag', tagId: 'schutzzauber', halveMoney: false }, undefined, 0.7),
  elixier('aufwind', 'Aufwind', 'Du ziehst 2 Karten auf die Hand (nur in einer Runde)', { kind: 'drawCards', count: 2 }),
  elixier('stundenglas', 'Stundenglas', '+2 Discards in dieser Runde (nur in einer Runde)', { kind: 'extraDiscards', amount: 2 }),
];

const omen = (id: string, name: string, description: string, effect: ConsumableEffect, targets?: { min: number; max: number }, weight?: number): ConsumableDef =>
  ({ id: `omen_${id}`, type: 'omen', name, description, cost: CONSUMABLE_COST.omen, effect, ...(targets ? { targets } : {}), ...(weight !== undefined ? { weight } : {}) });

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

  // Zweite Reihe: Jokers, Level, Slots und Tags mit klarem Preis
  omen('gestirnsopfer', 'Gestirnsopfer', 'Die meistgespielte Hand erhält +3 Level, alle anderen Hände verlieren 1 Level', { kind: 'levelMostPlayed', amount: 3, othersDelta: -1 }),
  omen('lichtschleifer', 'Lichtschleifer', 'Ein zufälliger Joker ohne Edition erhält eine zufällige Edition, dauerhaft -1 Hand Size', { kind: 'jokerEdition', editions: OMEN_EDITIONS, handSizeDelta: -1 }),
  omen('zwillingsflamme', 'Zwillingsflamme', 'Ein zufälliger Joker wird kopiert (freier Slot nötig), mit 1 in 3 Chance wird er stattdessen zerstört', { kind: 'jokerDuplicate', num: 2, den: 3 }, undefined, 0.8),
  omen('kometenschweif', 'Kometenschweif', `${tagText('supernova')}, dein Geld sinkt auf die Hälfte`, { kind: 'addTag', tagId: 'supernova', halveMoney: true }, undefined, 0.7),
  omen('nachtauge', 'Nachtauge', 'Dauerhaft +1 Hand Size, 3 zufällige Karten werden zerstört', { kind: 'handSizeUp', delta: 1, destroy: 3 }, undefined, 0.8),
  omen('alchemistenbeutel', 'Alchemistenbeutel', 'Dauerhaft +1 Consumable Slot und -1 Hand Size', { kind: 'slotUp', slots: 1, handSizeDelta: -1 }, undefined, 0.8),
  omen('abendruhe', 'Abendruhe', 'Dauerhaft -1 Hand und +2 Discards pro Runde', { kind: 'tradeHandForDiscard', hands: -1, discards: 2 }),
  omen('prismenopfer', 'Prismenopfer', `Eine Karte erhält die Edition ${EDITIONS.prisma.name}, 2 zufällige andere Karten werden zerstört`, { kind: 'edition', edition: 'prisma', destroyOthers: 2 }, { min: 1, max: 1 }, 0.8),
  omen('wandlung', 'Wandlung', 'Ein zufälliger Common oder Uncommon Joker wird durch einen Joker der nächsten Rarity ersetzt, alle Hände verlieren 1 Level', { kind: 'jokerUpgrade', levelLoss: 1 }, undefined, 0.8),
  omen('farbsturm', 'Farbsturm', '2 zufällige Karten der Hand werden zerstört, alle übrigen werden zu einer zufälligen Suit', { kind: 'monoSuit', destroy: 2 }),
];

export const CONSUMABLES: ConsumableDef[] = [...STERNBILDER, ...ELIXIERE, ...OMEN];

export const CONSUMABLE_BY_ID: Record<string, ConsumableDef> = Object.fromEntries(CONSUMABLES.map((c) => [c.id, c]));
