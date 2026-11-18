import type { Card, DetectRules, Effect, HandType, Rarity } from './types';

export type { Effect, Rarity } from './types';

/**
 * Phasen, in denen die Engine Jokers aufruft (Briefing 3.1, 8.2).
 * before: vor dem Scoring, nur Zustand. scored: pro gewerteter Karte. held: pro Karte in der Hand.
 * retrigger: zusätzliche Auswertungen für ctx.card. main: Joker Phase. after: nach dem Scoring.
 */
export type JokerPhase = 'before' | 'scored' | 'held' | 'retrigger' | 'main' | 'after';

export interface JokerContext {
  phase: JokerPhase;
  /** aktuelle Karte in scored, held und retrigger */
  card?: Card;
  /** Bereich der aktuellen Karte */
  area?: 'played' | 'held';
  /** Index der Karte unter den Scoring Cards (nur area played) */
  index?: number;
  handType: HandType;
  contained: Set<HandType>;
  played: Card[];
  scoring: Card[];
  held: Card[];
  money: number;
  /** verbleibende Hands nach dieser Hand */
  handsLeft: number;
  discardsLeft: number;
  chance(num: number, den: number, key: string): boolean;
}

export type JokerConfig = Record<string, number>;

export interface JokerInstance {
  uid: number;
  defId: string;
  /** veränderliche Werte skalierender Jokers. Serialisierbar. */
  vars: Record<string, number>;
  edition?: string;
}

export interface JokerDef {
  id: string;
  name: string;
  rarity: Rarity;
  cost: number;
  /** alle Zahlen des Jokers als Daten */
  config: JokerConfig;
  /** Beschreibung mit Platzhaltern {name} für config und vars */
  description: string;
  /** darf von kopierenden Jokers kopiert werden */
  copyCompat: boolean;
  /** Regeln der Hand Erkennung, solange der Joker im Besitz ist */
  rules?: DetectRules;
  calculate?(ctx: JokerContext, self: JokerInstance, cfg: JokerConfig): Effect | void;
}

const registry: Record<string, JokerDef> = {};

export function registerJokers(defs: JokerDef[]) {
  for (const d of defs) registry[d.id] = d;
}

export function getJoker(id: string): JokerDef | undefined {
  return registry[id];
}

export function unregisterJoker(id: string) {
  delete registry[id];
}

export function allJokers(): JokerDef[] {
  return Object.values(registry);
}

/** Beschreibung mit eingesetzten Werten, z. B. "+{mult} Mult" wird "+4 Mult". */
export function jokerDescription(def: JokerDef, inst?: JokerInstance): string {
  const values: Record<string, number> = { ...def.config, ...(inst?.vars ?? {}) };
  return def.description.replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
}

/** Vereinigte Erkennungsregeln aller Jokers. */
export function jokerRules(jokers: JokerInstance[]): DetectRules {
  const rules: DetectRules = {};
  for (const j of jokers) Object.assign(rules, getJoker(j.defId)?.rules ?? {});
  return rules;
}
