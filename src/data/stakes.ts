import type { RunMods } from './modsSpec';

/**
 * Eigene Schwierigkeitsstufen. Die Leiter (Dämmerung bis Ewige Nacht) wirkt kumulativ:
 * jede Stufe enthält alle vorherigen. Stufen mit `cumulative: false` (Einsteigerstufen)
 * wirken nur für sich und stehen außerhalb der Leiter.
 */
export interface StakeDef {
  id: string;
  name: string;
  description: string;
  color: number;
  mods: RunMods;
  /** false: wirkt nur für sich, nicht als Teil der Leiter (Standard true) */
  cumulative?: boolean;
}

export const STAKES: StakeDef[] = [
  {
    id: 'morgenrot', name: 'Morgenrot', description: 'Einsteiger: Blind Ziele 25% niedriger, +1 Discard pro Runde', color: 0xffb36b,
    mods: { blindTargetFactor: 0.75, discardsDelta: 1 }, cumulative: false,
  },
  { id: 'daemmerung', name: 'Dämmerung', description: 'Grundschwierigkeit', color: 0xe8e0d0, mods: {} },
  { id: 'abend', name: 'Abend', description: 'Small Blind gibt keine Belohnung', color: 0xd9644f, mods: { smallBlindReward: 0 } },
  { id: 'mitternacht', name: 'Mitternacht', description: 'Blind Ziele wachsen schneller', color: 0x4fae6f, mods: { scaling: 2 } },
  { id: 'tiefe_nacht', name: 'Tiefe Nacht', description: '-1 Discard pro Runde', color: 0x3f6fd9, mods: { discardsDelta: -1 } },
  { id: 'finsternis', name: 'Finsternis', description: 'Blind Ziele wachsen noch schneller', color: 0x8f4fd9, mods: { scaling: 3 } },
  { id: 'ewige_nacht', name: 'Ewige Nacht', description: '-1 Hand Size', color: 0xe0b23f, mods: { handSizeDelta: -1 } },
];

/** Standardstufe der Engine (Grundschwierigkeit) */
export const DEFAULT_STAKE_ID = 'daemmerung';
/** Vorbelegung im Run Setup für neue Spieler */
export const BEGINNER_STAKE_ID = 'morgenrot';

/** Stufen, deren Regeln für die gewählte Stufe gelten (in Anwendungsreihenfolge) */
export function stakeChain(stakeId: string): StakeDef[] {
  const chosen = STAKES.find((s) => s.id === stakeId) ?? STAKES.find((s) => s.id === DEFAULT_STAKE_ID)!;
  if (chosen.cumulative === false) return [chosen];
  return STAKES.slice(0, STAKES.indexOf(chosen) + 1).filter((s) => s.cumulative !== false);
}
