import type { RunMods } from './modsSpec';

/** Eigene Schwierigkeitsstufen. Jede Stufe enthält alle vorherigen (kumulativ). */
export interface StakeDef {
  id: string;
  name: string;
  description: string;
  color: number;
  mods: RunMods;
}

export const STAKES: StakeDef[] = [
  { id: 'daemmerung', name: 'Dämmerung', description: 'Grundschwierigkeit', color: 0xe8e0d0, mods: {} },
  { id: 'abend', name: 'Abend', description: 'Small Blind gibt keine Belohnung', color: 0xd9644f, mods: { smallBlindReward: 0 } },
  { id: 'mitternacht', name: 'Mitternacht', description: 'Blind Ziele wachsen schneller', color: 0x4fae6f, mods: { scaling: 2 } },
  { id: 'tiefe_nacht', name: 'Tiefe Nacht', description: '-1 Discard pro Runde', color: 0x3f6fd9, mods: { discardsDelta: -1 } },
  { id: 'finsternis', name: 'Finsternis', description: 'Blind Ziele wachsen noch schneller', color: 0x8f4fd9, mods: { scaling: 3 } },
  { id: 'ewige_nacht', name: 'Ewige Nacht', description: '-1 Hand Size', color: 0xe0b23f, mods: { handSizeDelta: -1 } },
];
