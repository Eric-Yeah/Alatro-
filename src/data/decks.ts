import type { Rank } from '../core/types';
import type { RunMods } from './modsSpec';

export interface DeckDef {
  id: string;
  name: string;
  description: string;
  color: number;
  mods: RunMods;
  /** Ränge, die aus dem Startdeck entfernt werden */
  removeRanks?: Rank[];
  /** Karten dieser Ränge starten mit einem Enhancement */
  startEnhancement?: { ranks: Rank[]; enhancement: string };
}

export const DECKS: DeckDef[] = [
  { id: 'nachthimmel', name: 'Nachthimmel', description: 'Das Standarddeck', color: 0x5b3fa8, mods: {} },
  { id: 'glut', name: 'Glutdeck', description: '+1 Discard pro Runde', color: 0xc9482b, mods: { discardsDelta: 1 } },
  { id: 'tiefsee', name: 'Tiefseedeck', description: '+1 Hand pro Runde, -1 Discard', color: 0x1f5f8f, mods: { handsDelta: 1, discardsDelta: -1 } },
  { id: 'waage', name: 'Goldene Waage', description: 'Chips und Mult werden vor dem Multiplizieren gemittelt, Blind Ziele X2', color: 0xc9a22b, mods: { balance: true, blindTargetFactor: 2 } },
  { id: 'alchemist', name: 'Alchemistendeck', description: 'Alle 10er und Face Cards starten aus Kupfer', color: 0xb2652f, mods: {}, startEnhancement: { ranks: [10, 11, 12, 13], enhancement: 'kupfer' } },
  { id: 'sternenkind', name: 'Sternenkind', description: '+1 Joker Slot, -1 Hand Size', color: 0x3fbf9f, mods: { jokerSlotsDelta: 1, handSizeDelta: -1 } },
  { id: 'halbmond', name: 'Halbmond', description: 'Keine Face Cards im Deck (40 Karten)', color: 0x9fa8c8, mods: {}, removeRanks: [11, 12, 13] },
];
