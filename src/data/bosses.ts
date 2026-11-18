import type { Suit } from '../core/types';

/**
 * Eigene Boss Blinds. Alle Effekte sind deklarativ, die Engine wertet die Felder aus.
 */
export interface BossEffect {
  /** zu Rundenbeginn wird zufällig eine Suit gewählt, deren Karten geschwächt sind */
  debuffRandomSuit?: boolean;
  /** feste Suits geschwächt */
  debuffSuits?: Suit[];
  debuffFace?: boolean;
  debuffEvenRanks?: boolean;
  handSizeDelta?: number;
  handsDelta?: number;
  /** Discards dieser Runde auf diesen Wert setzen */
  setDiscards?: number;
  /** Level der gespielten Hand beim Scoring um 1 senken */
  levelDown?: boolean;
  /** Base Chips und Base Mult halbieren */
  halveBase?: boolean;
  /** jeder Handtyp darf nur einmal gespielt werden, Wiederholungen scoren 0 */
  uniqueHandTypes?: boolean;
  /** Hände mit weniger Karten scoren 0 */
  minCards?: number;
  /** Geld pro gespielter Hand verlieren */
  moneyPerHand?: number;
  /** der Joker ganz rechts ist geschwächt */
  debuffRightmostJoker?: boolean;
}

export interface BossDef {
  id: string;
  name: string;
  description: string;
  minAnte: number;
  showdown: boolean;
  /** Ziel Faktor statt des Standard Boss Faktors */
  factor?: number;
  color: number;
  effect: BossEffect;
}

export const BOSSES: BossDef[] = [
  { id: 'mondfinsternis', name: 'Die Mondfinsternis', description: 'Alle Karten einer zufälligen Suit sind geschwächt', minAnte: 1, showdown: false, color: 0x5a4a9e, effect: { debuffRandomSuit: true } },
  { id: 'nebel', name: 'Der Nebel', description: 'Alle Face Cards sind geschwächt', minAnte: 1, showdown: false, color: 0x6f7f99, effect: { debuffFace: true } },
  { id: 'ebbe', name: 'Die Ebbe', description: '-1 Hand Size', minAnte: 1, showdown: false, color: 0x2f6f9e, effect: { handSizeDelta: -1 } },
  { id: 'schwerkraft', name: 'Die Schwerkraft', description: 'Gespielte Hände werden eine Stufe niedriger gewertet', minAnte: 2, showdown: false, color: 0x7a3f2f, effect: { levelDown: true } },
  { id: 'schleier', name: 'Der Schleier', description: 'Base Chips und Base Mult sind halbiert', minAnte: 2, showdown: false, color: 0x8f6fb2, effect: { halveBase: true } },
  { id: 'spiegel', name: 'Der Spiegel', description: 'Jeder Handtyp scort nur beim ersten Mal', minAnte: 2, showdown: false, color: 0x9fb2c8, effect: { uniqueHandTypes: true } },
  { id: 'monolith', name: 'Der Monolith', description: 'Riesiges Ziel', minAnte: 2, showdown: false, factor: 3, color: 0x3f3f4f, effect: {} },
  { id: 'dieb', name: 'Der Dieb', description: '-$2 pro gespielter Hand', minAnte: 1, showdown: false, color: 0x9e8f2f, effect: { moneyPerHand: 2 } },
  { id: 'frostbiss', name: 'Der Frostbiss', description: 'Alle Karten mit geradem Rang sind geschwächt', minAnte: 3, showdown: false, color: 0x5fb2d9, effect: { debuffEvenRanks: true } },
  { id: 'stille', name: 'Die Stille', description: 'Der Joker ganz rechts ist geschwächt', minAnte: 3, showdown: false, color: 0x4f5f6f, effect: { debuffRightmostJoker: true } },
  { id: 'gier', name: 'Die Gier', description: 'Hände mit weniger als 3 Karten scoren nicht', minAnte: 2, showdown: false, color: 0xb2652f, effect: { minCards: 3 } },
  { id: 'sturm', name: 'Der Sturm', description: 'Nur 1 Discard in dieser Runde', minAnte: 3, showdown: false, color: 0x3f6f8f, effect: { setDiscards: 1 } },
  // Showdown Bosse (Ante 8, 16, ...)
  { id: 'ereignishorizont', name: 'Der Ereignishorizont', description: 'Gewaltiges Ziel', minAnte: 8, showdown: true, factor: 5, color: 0x1f0f2f, effect: {} },
  { id: 'polarnacht', name: 'Die Polarnacht', description: '-2 Hand Size, nur 1 Discard', minAnte: 8, showdown: true, color: 0x2f4f8f, effect: { handSizeDelta: -2, setDiscards: 1 } },
];
