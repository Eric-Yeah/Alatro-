import type { BlindKind, Card, DetectRules, Effect, HandType, Rarity } from './types';

export type { Effect, Rarity } from './types';

/**
 * Phasen, in denen die Engine Jokers aufruft (Briefing 3.1, 8.2).
 * before: vor dem Scoring, nur Zustand. scored: pro gewerteter Karte. held: pro Karte in der Hand.
 * retrigger: zusätzliche Auswertungen für ctx.card. main: Joker Phase. after: nach dem Scoring.
 * other: ein anderer Joker hat in der Joker Phase gewirkt (ctx.otherJoker). Außerhalb des Scorings:
 * discard (nach dem Abwerfen), blindSelected (nach der Blind Wahl), roundEnd (beim Einkassieren,
 * ohne Zufall), sell (beim Verkauf des Jokers selbst).
 */
export type JokerPhase =
  | 'before' | 'scored' | 'held' | 'retrigger' | 'main' | 'after'
  | 'other' | 'discard' | 'blindSelected' | 'roundEnd' | 'sell';

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
  /** Face Card Prüfung, berücksichtigt die Regel "jede Karte ist Face Card" */
  isFace(card: Card): boolean;
  /** der andere Joker in der Phase other */
  otherJoker?: JokerDef;
  /** abgeworfene Karten in der Phase discard */
  discarded?: Card[];
  /** Blind der Runde (Hooks außerhalb des Scorings) */
  blind?: BlindKind;
  ante?: number;
}

export type JokerConfig = Record<string, number>;

/** Dauerhafte Wirkungen von Jokers. Summen, nur discount und doubleProb sind Faktoren. */
export interface JokerPassive {
  hands?: number;
  discards?: number;
  handSize?: number;
  jokerSlots?: number;
  consumableSlots?: number;
  interestCapDelta?: number;
  freeRerolls?: number;
  shopSlots?: number;
  /** Faktor auf Kartenpreise im Shop */
  discount?: number;
  /** verdoppelt alle "num in den" Chancen */
  doubleProb?: boolean;
}

export interface JokerInstance {
  uid: number;
  defId: string;
  /** veränderliche Werte skalierender Jokers. Serialisierbar. */
  vars: Record<string, number>;
  edition?: string;
  /** Kaufpreis, Grundlage für den Verkaufswert */
  buyPrice?: number;
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
  /** Startwerte der veränderlichen Werte (vars), z. B. { x: start } */
  init?(cfg: JokerConfig): Record<string, number>;
  /** dauerhafte Wirkung, solange der Joker im Besitz ist */
  passive?(cfg: JokerConfig): JokerPassive;
  /** kopiert den Joker rechts neben sich oder den ganz linken Joker */
  copies?: 'right' | 'leftmost';
  /** rettet einmal vor dem Verlust der Runde, wenn der Score mindestens cfg.fraction des Ziels erreicht, und verbraucht sich */
  rescue?: boolean;
  /** erscheint zufällig erst ab dieser Ante (Spawn Bedingung) */
  minAnte?: number;
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
  const values: Record<string, number> = { ...def.config, ...(def.init?.(def.config) ?? {}), ...(inst?.vars ?? {}) };
  return def.description.replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
}

/** Vereinigte Erkennungsregeln aller Jokers. */
export function jokerRules(jokers: JokerInstance[]): DetectRules {
  const rules: DetectRules = {};
  for (const j of jokers) Object.assign(rules, getJoker(j.defId)?.rules ?? {});
  return rules;
}

/** Ziel eines kopierenden Jokers: Nachbar rechts oder ganz links. Kopien werden nicht verkettet. */
export function copyTarget<T extends { def: JokerDef }>(list: T[], index: number): T | null {
  const me = list[index];
  if (!me?.def.copies) return null;
  const target = me.def.copies === 'right' ? list[index + 1] : list[0];
  if (!target || target === me || target.def.copies || !target.def.copyCompat) return null;
  return target;
}

/** Summe aller dauerhaften Wirkungen der Jokers */
export function sumPassives(jokers: JokerInstance[]): Required<Omit<JokerPassive, 'doubleProb'>> & { doubleProb: number } {
  const out = { hands: 0, discards: 0, handSize: 0, jokerSlots: 0, consumableSlots: 0, interestCapDelta: 0, freeRerolls: 0, shopSlots: 0, discount: 1, doubleProb: 0 };
  for (const j of jokers) {
    const def = getJoker(j.defId);
    const p = def?.passive?.(def.config);
    if (!p) continue;
    out.hands += p.hands ?? 0;
    out.discards += p.discards ?? 0;
    out.handSize += p.handSize ?? 0;
    out.jokerSlots += p.jokerSlots ?? 0;
    out.consumableSlots += p.consumableSlots ?? 0;
    out.interestCapDelta += p.interestCapDelta ?? 0;
    out.freeRerolls += p.freeRerolls ?? 0;
    out.shopSlots += p.shopSlots ?? 0;
    out.discount *= p.discount ?? 1;
    out.doubleProb += p.doubleProb ? 1 : 0;
  }
  return out;
}
