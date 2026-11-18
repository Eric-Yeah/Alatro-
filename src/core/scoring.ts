import { chipValue, type Card } from './cards';
import { evaluateHand } from './handEval';
import { handBase, type HandLevels, type HandType } from './hands';
import { JOKER_BY_ID, type Effect, type JokerInstance, type ScoreContext } from './jokers';

export type ScoreEventSource =
  | { kind: 'base' }
  | { kind: 'card'; cardId: number }
  | { kind: 'held'; cardId: number }
  | { kind: 'joker'; jokerUid: number };

/** One visible step of the scoring animation. */
export interface ScoreEvent {
  source: ScoreEventSource;
  chips?: number;
  mult?: number;
  xMult?: number;
  money?: number;
  /** Running totals AFTER this event. */
  chipsTotal: number;
  multTotal: number;
}

export interface ScoreResult {
  handType: HandType;
  scoring: Card[];
  chips: number;
  mult: number;
  total: number;
  money: number;
  events: ScoreEvent[];
}

export interface ScoreInput {
  played: Card[];
  held: Card[];
  handLevels: HandLevels;
  jokers: JokerInstance[];
  money: number;
  /** Hands left AFTER this one is played. */
  handsLeft: number;
  discardsLeft: number;
}

export function previewHand(played: Card[], handLevels: HandLevels) {
  const { type } = evaluateHand(played);
  return { type, ...handBase(type, handLevels[type]) };
}

export function scoreHand(input: ScoreInput): ScoreResult {
  const { type, scoring } = evaluateHand(input.played);
  const base = handBase(type, input.handLevels[type]);
  let chips = base.chips;
  let mult = base.mult;
  let money = 0;
  const events: ScoreEvent[] = [{ source: { kind: 'base' }, chips, mult, chipsTotal: chips, multTotal: mult }];

  const ctx: ScoreContext = {
    handType: type,
    played: input.played,
    scoring,
    held: input.held,
    money: input.money,
    handsLeft: input.handsLeft,
    discardsLeft: input.discardsLeft,
  };

  const apply = (source: ScoreEventSource, e: Effect | void) => {
    if (!e) return;
    if (e.chips) chips += e.chips;
    if (e.mult) mult += e.mult;
    if (e.xMult) mult *= e.xMult;
    if (e.money) money += e.money;
    events.push({ source, ...e, chipsTotal: chips, multTotal: mult });
  };

  const jokers = input.jokers.map((j) => ({ inst: j, def: JOKER_BY_ID[j.defId] })).filter((j) => j.def);

  for (const { inst, def } of jokers) def.onHandPlayed?.(ctx, inst);

  // 1) Scoring cards, left to right
  for (const card of scoring) {
    apply({ kind: 'card', cardId: card.id }, { chips: chipValue(card.rank) });
    for (const { inst, def } of jokers) {
      apply({ kind: 'joker', jokerUid: inst.uid }, def.onCardScored?.(card, ctx, inst));
    }
  }

  // 2) Cards held in hand
  for (const card of input.held) {
    for (const { inst, def } of jokers) {
      apply({ kind: 'joker', jokerUid: inst.uid }, def.onHeldInHand?.(card, ctx, inst));
    }
  }

  // 3) Jokers, left to right
  for (const { inst, def } of jokers) {
    apply({ kind: 'joker', jokerUid: inst.uid }, def.onIndependent?.(ctx, inst));
  }

  return { handType: type, scoring, chips, mult, total: Math.floor(chips * mult), money, events };
}
