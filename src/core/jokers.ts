import { isFace as isFaceRank, isRankless } from './cards';
import type { BlindKind, Card, DetectRules, Effect, HandType, Rarity } from './types';

export type { Effect, Rarity } from './types';

/**
 * Phasen, in denen die Engine Jokers aufruft (Briefing 3.1, 8.2).
 *
 * Scoring: before (vor dem Scoring, nur Zustand), scored (pro gewerteter Karte), held (pro Karte
 * in der Hand), retrigger (zusätzliche Auswertungen für ctx.card), main (Joker Phase),
 * other (ein anderer Joker hat gerade seinen main Effekt ausgelöst, ctx.other), after (nach dem Scoring).
 *
 * Außerhalb des Scorings: discard (ctx.cards = abgeworfene Karten), blindSelected, payout
 * (Geld am Rundenende, muss rein sein, wird auch für die Vorschau aufgerufen), roundEnd
 * (Zustand am Rundenende, einmal), shopOpen, shopReroll, sell (nur der verkaufte Joker selbst),
 * rescue (Runde wäre verloren, ctx.score und ctx.target).
 */
export type ScoringPhase = 'before' | 'scored' | 'held' | 'retrigger' | 'main' | 'other' | 'after';
export type EventPhase = 'discard' | 'blindSelected' | 'payout' | 'roundEnd' | 'shopOpen' | 'shopReroll' | 'sell' | 'rescue';
export type JokerPhase = ScoringPhase | EventPhase;

export interface JokerContext {
  phase: JokerPhase;
  /** aktuelle Karte in scored, held und retrigger */
  card?: Card;
  /** Bereich der aktuellen Karte */
  area?: 'played' | 'held';
  /** Index der Karte unter den Scoring Cards (nur area played) */
  index?: number;
  /** außerhalb des Scorings: highCard und leeres Set */
  handType: HandType;
  contained: Set<HandType>;
  played: Card[];
  scoring: Card[];
  /** Karten in der Hand (außerhalb des Scorings: aktuelle Hand, falls eine Runde läuft) */
  held: Card[];
  money: number;
  /** verbleibende Hands (im Scoring: nach dieser Hand) */
  handsLeft: number;
  discardsLeft: number;
  chance(num: number, den: number, key: string): boolean;
  /** Face Card Prüfung mit Erkennungsregeln (allFace) */
  isFace(card: Card): boolean;
  /** Anzahl Jokers im Besitz */
  jokerCount: number;
  /** freie Joker Slots */
  emptySlots: number;
  /** Karten im Nachziehstapel */
  deckLeft: number;
  ante: number;
  blind?: BlindKind;
  /** der Aufruf kommt von einem kopierenden Joker: keinen eigenen Zustand verändern */
  copied?: boolean;
  /** Phase other: der Joker, der gerade ausgelöst hat */
  other?: { def: JokerDef; inst: JokerInstance };
  /** Phase discard: abgeworfene Karten */
  cards?: Card[];
  /** Phase rescue: erreichter Score und Ziel */
  score?: number;
  target?: number;
}

export type JokerConfig = Record<string, number>;

export interface JokerInstance {
  uid: number;
  defId: string;
  /** veränderliche Werte skalierender Jokers. Serialisierbar. sellBonus erhöht den Verkaufswert. */
  vars: Record<string, number>;
  edition?: string;
  /** Kaufpreis, Grundlage für den Verkaufswert */
  buyPrice?: number;
}

/** Dauerhafte Werte, solange der Joker im Besitz ist. Werden nicht kopiert. */
export interface JokerPassive {
  handSize?: number;
  hands?: number;
  discards?: number;
  /** Faktor auf alle Wahrscheinlichkeiten */
  probFactor?: number;
  /** zusätzlicher Zinsdeckel */
  interestCap?: number;
  /** Faktor auf Shop Preise bei der Generierung */
  discount?: number;
}

/** Bedingungen, unter denen der Joker zufällig erscheinen darf (Briefing 4.2). */
export interface JokerSpawn {
  minAnte?: number;
}

/** Sticker Kompatibilität (Briefing 4.2). Sticker selbst folgen später, Standard ist kompatibel. */
export interface JokerStickers {
  eternal?: boolean;
  perishable?: boolean;
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
  passive?: JokerPassive;
  /** kopiert den Effekt eines anderen Jokers */
  copies?: 'right';
  spawn?: JokerSpawn;
  stickers?: JokerStickers;
  /** Startwerte für self.vars beim Erzeugen */
  startVars?: Record<string, number>;
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
  const values: Record<string, number> = { ...def.config, ...(def.startVars ?? {}), ...(inst?.vars ?? {}) };
  return def.description.replace(/\{(\w+)\}/g, (_, k) => (k in values ? fmtValue(values[k]) : `{${k}}`));
}

function fmtValue(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

/** Vereinigte Erkennungsregeln aller Jokers. */
export function jokerRules(jokers: JokerInstance[]): DetectRules {
  const rules: DetectRules = {};
  for (const j of jokers) Object.assign(rules, getJoker(j.defId)?.rules ?? {});
  return rules;
}

/** Summierte passive Werte aller Jokers (Faktoren multipliziert). */
export function jokerPassives(jokers: JokerInstance[]): Required<JokerPassive> {
  const p: Required<JokerPassive> = { handSize: 0, hands: 0, discards: 0, probFactor: 1, interestCap: 0, discount: 1 };
  for (const j of jokers) {
    const q = getJoker(j.defId)?.passive;
    if (!q) continue;
    p.handSize += q.handSize ?? 0;
    p.hands += q.hands ?? 0;
    p.discards += q.discards ?? 0;
    p.probFactor *= q.probFactor ?? 1;
    p.interestCap += q.interestCap ?? 0;
    p.discount *= q.discount ?? 1;
  }
  return p;
}

export function stickerCompat(def: JokerDef): Required<JokerStickers> {
  return { eternal: def.stickers?.eternal ?? true, perishable: def.stickers?.perishable ?? true };
}

/** Face Card mit Regeln: ranglose Karten nie, mit allFace jede andere Karte. */
export function isFaceCard(card: Card, rules: DetectRules = {}): boolean {
  if (isRankless(card)) return false;
  return !!rules.allFace || isFaceRank(card.rank);
}

export interface ResolvedJoker {
  inst: JokerInstance;
  def: JokerDef;
}

export function resolveJokers(jokers: JokerInstance[]): ResolvedJoker[] {
  return jokers
    .map((inst) => ({ inst, def: getJoker(inst.defId) }))
    .filter((j): j is ResolvedJoker => !!j.def);
}

/**
 * Ruft den Joker an Position i auf. Kopierende Jokers folgen der Kette nach rechts und rufen
 * calculate des Ziels mit dessen self und config auf, nur wenn das Ziel copyCompat ist.
 * Bei Kopien ist ctx.copied gesetzt und destroySelf wird ignoriert.
 */
export function invokeJoker(list: ResolvedJoker[], i: number, ctx: JokerContext): Effect | void {
  let k = i;
  let copied = !!ctx.copied;
  for (let depth = 0; list[k]?.def.copies; depth++) {
    if (depth >= list.length) return;
    k = k + 1;
    const t = list[k];
    if (!t || !t.def.copyCompat) return;
    copied = true;
  }
  const target = list[k];
  if (!target) return;
  const e = target.def.calculate?.({ ...ctx, copied }, target.inst, target.def.config);
  if (e && copied && e.destroySelf) {
    const { destroySelf: _ignored, ...rest } = e;
    return rest;
  }
  return e;
}
