import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { chipValue, isRankless } from './cards';
import { detectHand } from './handEval';
import { handBase, type HandLevels } from './hands';
import { invokeJoker, isFaceCard, jokerRules, resolveJokers, type JokerContext, type JokerInstance, type JokerPhase } from './jokers';
import type { BlindKind, Card, DetectRules, Effect, HandType } from './types';

/** Boss Modifikatoren, die den Handwert verändern (Briefing 3.1 Schritt 0). */
export interface BossScoreMods {
  /** Level der gespielten Hand um 1 senken (min. 1) */
  levelDown?: boolean;
  /** Base Chips und Base Mult halbieren, aufrunden */
  halveBase?: boolean;
  /** die Hand scort nichts (Offener Punkt O6) */
  nullify?: boolean;
}

export type ScoreEventSource =
  | { kind: 'base' }
  | { kind: 'card'; cardId: number }
  | { kind: 'held'; cardId: number }
  | { kind: 'joker'; jokerUid: number }
  | { kind: 'rule' };

export type ScorePhase = 'base' | 'card' | 'held' | 'joker' | 'retrigger' | 'balance' | 'debuff';

/** Ein sichtbarer Schritt der Score Animation (Briefing 8.2). */
export interface ScoreEvent {
  phase: ScorePhase;
  source: ScoreEventSource;
  chips?: number;
  mult?: number;
  xMult?: number;
  money?: number;
  message?: string;
  /** laufende Werte NACH diesem Schritt */
  chipsTotal: number;
  multTotal: number;
}

export interface ScoreResult {
  handType: HandType;
  scoring: Card[];
  contained: Set<HandType>;
  chips: number;
  mult: number;
  total: number;
  money: number;
  events: ScoreEvent[];
  /** Karten, die nach dem Scoring zerstört werden */
  destroyed: Card[];
  /** von Jokers dauerhaft veränderte Karten */
  modified: { cardId: number; enhancement: string }[];
  /** Jokers, die sich selbst zerstört haben (uid) */
  destroyedJokers: number[];
}

export interface ScoreInput {
  played: Card[];
  held: Card[];
  handLevels: HandLevels;
  jokers: JokerInstance[];
  money: number;
  /** verbleibende Hands NACH dieser Hand */
  handsLeft: number;
  discardsLeft: number;
  /** zusätzliche Erkennungsregeln (die Regeln der Jokers kommen automatisch dazu) */
  rules?: DetectRules;
  boss?: BossScoreMods;
  /** Chips und Mult am Ende mitteln (Deck Regel, Briefing 3.1 Schritt 7) */
  balance?: boolean;
  /** Zufallsentscheidungen, Standard: nie */
  chance?: (num: number, den: number, key: string) => boolean;
  /** Run Werte für Joker Bedingungen */
  jokerCount?: number;
  emptySlots?: number;
  deckLeft?: number;
  ante?: number;
  blind?: BlindKind;
}

export const RETRIGGER_MESSAGE = 'Nochmal!';
export const DEBUFF_MESSAGE = 'Geschwächt';
export const BALANCE_MESSAGE = 'Ausgleich';

export function previewHand(played: Card[], handLevels: HandLevels, rules: DetectRules = {}) {
  const { type, scoring } = detectHand(played, rules);
  return { type, scoring, ...handBase(type, handLevels[type]) };
}

/**
 * Wertet eine gespielte Hand aus. Reihenfolge nach Briefing 3.1 bis 3.4:
 * Before, Basis (mit Boss Modifikatoren), Scoring Cards links nach rechts (Rang Chips,
 * Enhancement, Seal, Edition, Jokers, mit Retriggern), Karten in der Hand
 * (Enhancement, Jokers, mit Retriggern), Jokers links nach rechts (Edition additiv,
 * Effekt, Edition multiplikativ), Balance, Abrunden, After.
 */
export function scoreHand(input: ScoreInput): ScoreResult {
  const rules = { ...jokerRules(input.jokers), ...input.rules };
  const { type, scoring, contained } = detectHand(input.played, rules);
  const chance = input.chance ?? (() => false);
  const events: ScoreEvent[] = [];
  let chips = 0;
  let mult = 0;
  let money = 0;

  const jokers = resolveJokers(input.jokers);
  const modified: ScoreResult['modified'] = [];
  const destroyedJokers: number[] = [];

  const baseCtx: Omit<JokerContext, 'phase'> = {
    handType: type,
    contained,
    played: input.played,
    scoring,
    held: input.held,
    money: input.money,
    handsLeft: input.handsLeft,
    discardsLeft: input.discardsLeft,
    chance,
    isFace: (card) => isFaceCard(card, rules),
    jokerCount: input.jokerCount ?? input.jokers.length,
    emptySlots: input.emptySlots ?? 0,
    deckLeft: input.deckLeft ?? 0,
    ante: input.ante ?? 1,
    blind: input.blind,
  };
  const callJoker = (i: number, phase: JokerPhase, extra: Partial<JokerContext> = {}) => {
    const e = invokeJoker(jokers, i, { ...baseCtx, ...extra, phase });
    if (e) sideEffects(jokers[i].inst, e);
    return e;
  };

  /** Folgen eines Joker Effekts außerhalb von Chips und Mult */
  const sideEffects = (inst: JokerInstance, e: Effect) => {
    for (const m of e.setEnhancement ?? []) {
      const card = input.played.find((c) => c.id === m.cardId) ?? input.held.find((c) => c.id === m.cardId);
      if (card) card.enhancement = m.enhancement;
      modified.push(m);
    }
    if (e.destroySelf && !destroyedJokers.includes(inst.uid)) destroyedJokers.push(inst.uid);
  };

  const apply = (phase: ScorePhase, source: ScoreEventSource, e: Effect | void) => {
    if (!e) return;
    const has = e.chips || e.mult || (e.xMult && e.xMult !== 1) || e.money || e.message;
    if (!has) return;
    if (e.chips) chips += e.chips;
    if (e.mult) mult += e.mult;
    if (e.xMult) mult *= e.xMult;
    if (e.money) money += e.money;
    events.push({ phase, source, ...e, chipsTotal: chips, multTotal: mult });
  };

  // 1) Before: Zustand und Karten Veränderungen
  jokers.forEach((j, i) => {
    const e = callJoker(i, 'before');
    if (e?.message) apply('joker', { kind: 'joker', jokerUid: j.inst.uid }, { message: e.message });
  });

  // 2) Basis mit Boss Modifikatoren
  const level = input.handLevels[type] - (input.boss?.levelDown ? 1 : 0);
  const base = handBase(type, level);
  chips = base.chips;
  mult = base.mult;
  if (input.boss?.halveBase) {
    chips = Math.ceil(chips / 2);
    mult = Math.ceil(mult / 2);
  }
  events.push({ phase: 'base', source: { kind: 'base' }, chips, mult, chipsTotal: chips, multTotal: mult });

  if (input.boss?.nullify) {
    events.push({ phase: 'debuff', source: { kind: 'rule' }, message: DEBUFF_MESSAGE, chipsTotal: 0, multTotal: 0 });
    return { handType: type, scoring, contained, chips: 0, mult: 0, total: 0, money: 0, events, destroyed: [], modified, destroyedJokers };
  }

  const repetitions = (card: Card, area: 'played' | 'held', index?: number) => {
    let n = (card.seal && SEALS[card.seal]?.retrigger) || 0;
    jokers.forEach((_, i) => { n += callJoker(i, 'retrigger', { card, area, index })?.retrigger ?? 0; });
    return n;
  };

  // 3) Scoring Cards links nach rechts
  scoring.forEach((card, index) => {
    if (card.debuffed) {
      apply('debuff', { kind: 'card', cardId: card.id }, { message: DEBUFF_MESSAGE });
      return;
    }
    const reps = 1 + repetitions(card, 'played', index);
    for (let r = 0; r < reps; r++) {
      const src = { kind: 'card', cardId: card.id } as const;
      if (r > 0) apply('retrigger', src, { message: RETRIGGER_MESSAGE });
      const rankChips = isRankless(card) ? 0 : chipValue(card.rank);
      apply('card', src, { chips: rankChips + (card.extraChips ?? 0) });
      apply('card', src, card.enhancement ? ENHANCEMENTS[card.enhancement]?.scored : undefined);
      apply('card', src, card.seal ? SEALS[card.seal]?.scored : undefined);
      apply('card', src, card.edition ? EDITIONS[card.edition]?.effect : undefined);
      jokers.forEach((j, i) => apply('joker', { kind: 'joker', jokerUid: j.inst.uid }, callJoker(i, 'scored', { card, area: 'played', index })));
    }
  });

  // 4) Karten in der Hand links nach rechts
  for (const card of input.held) {
    if (card.debuffed) continue;
    const reps = 1 + repetitions(card, 'held');
    const src = { kind: 'held', cardId: card.id } as const;
    for (let r = 0; r < reps; r++) {
      const steps: [ScorePhase, ScoreEventSource, Effect | void][] = [
        ['held', src, card.enhancement ? ENHANCEMENTS[card.enhancement]?.held : undefined],
        ...jokers.map((j, i): [ScorePhase, ScoreEventSource, Effect | void] =>
          ['joker', { kind: 'joker', jokerUid: j.inst.uid }, callJoker(i, 'held', { card, area: 'held' })]),
      ];
      if (r > 0 && steps.some(([, , e]) => e)) apply('retrigger', src, { message: RETRIGGER_MESSAGE });
      for (const [phase, s, e] of steps) apply(phase, s, e);
    }
  }

  // 5) Jokers links nach rechts: Edition additiv, Effekt, Reaktionen anderer Jokers, Edition multiplikativ
  jokers.forEach((j, i) => {
    const src = { kind: 'joker', jokerUid: j.inst.uid } as const;
    const ed = j.inst.edition ? EDITIONS[j.inst.edition]?.effect : undefined;
    if (ed && (ed.chips || ed.mult)) apply('joker', src, { chips: ed.chips, mult: ed.mult });
    apply('joker', src, callJoker(i, 'main'));
    jokers.forEach((k, ki) => {
      if (ki !== i) apply('joker', { kind: 'joker', jokerUid: k.inst.uid }, callJoker(ki, 'other', { other: j }));
    });
    if (ed?.xMult) apply('joker', src, { xMult: ed.xMult });
  });

  // 6) Consumable Phase: folgt mit den Consumables (M4)

  // 7) Balance (Offener Punkt O3: abrunden)
  if (input.balance) {
    const avg = Math.floor((chips + mult) / 2);
    chips = avg;
    mult = avg;
    events.push({ phase: 'balance', source: { kind: 'rule' }, message: BALANCE_MESSAGE, chipsTotal: chips, multTotal: mult });
  }

  // 8) Ergebnis abrunden (Offener Punkt O2)
  const total = Math.floor(chips * mult);

  // 9) After: Jokers (nur Zustand und Geld), zerbrechliche Karten
  jokers.forEach((_, i) => { money += callJoker(i, 'after')?.money ?? 0; });
  const destroyed = scoring.filter((card) => {
    const bc = card.enhancement ? ENHANCEMENTS[card.enhancement]?.breakChance : undefined;
    return !!bc && !card.debuffed && chance(bc.num, bc.den, 'card_break');
  });

  return { handType: type, scoring, contained, chips, mult, total, money, events, destroyed, modified, destroyedJokers };
}
