/**
 * Adapter zwischen der Spezifikations Testsuite und der Engine.
 *
 * Die Tests beschreiben Mechaniken (Reihenfolge, Retrigger, Skalierung, Zufall) mit
 * neutralen Test Jokers und Test Modifikatoren, nicht mit Originalkarten.
 * Funktionen, die die Engine noch nicht kann, werfen "Noch nicht implementiert".
 * Wenn die Engine wächst, wird nur dieser Adapter angepasst, die Tests bleiben stabil.
 */
import type { Card, Rank, Suit } from '../../src/core/cards';
import { containsHand, evaluateHand } from '../../src/core/handEval';
import { initialHandLevels, type HandLevels, type HandType } from '../../src/core/hands';
import { JOKER_BY_ID, type Effect, type JokerDef, type ScoreContext } from '../../src/core/jokers';
import { scoreHand } from '../../src/core/scoring';
import { anteBase, blindTarget, type BlindKind } from '../../src/core/blinds';
import { computeEarnings, newRun, sellValue } from '../../src/core/run';

export function notYet(feature: string): never {
  throw new Error(`Noch nicht implementiert: ${feature}`);
}

// ─────────────────────────────────────────────── Karten

/** Modifikator einer Spielkarte als reine Effektbeschreibung (eigene Typen folgen in M4). */
export interface TestModifier {
  /** wirkt, wenn die Karte gewertet wird */
  scored?: Effect;
  /** wirkt, solange die Karte beim Scoring in der Hand liegt */
  held?: Effect;
  /** zusätzliche Auswertungen der Karte */
  retrigger?: number;
  /** Karte hat keinen Rang und keine Suit und zählt immer als Scoring Card */
  rankless?: boolean;
}

export type TestCard = Card & { mods?: TestModifier[] };

let nextId = 10_000;
const RANKS: Record<string, number> = { J: 11, Q: 12, K: 13, A: 14 };

/** "AS", "10H", "KD", "9C" */
export function c(spec: string, mods?: TestModifier[]): TestCard {
  const suit = spec.slice(-1) as Suit;
  const r = spec.slice(0, -1);
  const rank = (RANKS[r] ?? Number(r)) as Rank;
  return { id: nextId++, suit, rank, ...(mods ? { mods } : {}) };
}

export const cs = (s: string): TestCard[] => s.trim().split(/\s+/).map((x) => c(x));

// ─────────────────────────────────────────────── Test Jokers

export type TestPhase = 'main' | 'scored' | 'held' | 'retrigger';

export interface TestJoker {
  phase: TestPhase;
  calc: (ctx: TestCtx) => Effect | number | void;
}

export interface TestCtx {
  card?: Card;
  scoring: Card[];
  played: Card[];
  held: Card[];
  handsLeft: number;
  /** Index der Karte unter den Scoring Cards (nur scored/retrigger) */
  index?: number;
}

export const J = {
  plusMult: (n: number): TestJoker => ({ phase: 'main', calc: () => ({ mult: n }) }),
  xMult: (n: number): TestJoker => ({ phase: 'main', calc: () => ({ xMult: n }) }),
};

// ─────────────────────────────────────────────── Scoring

export interface ScoreSetup {
  played: TestCard[];
  held?: TestCard[];
  levels?: Partial<HandLevels>;
  jokers?: TestJoker[];
  handsLeft?: number;
  money?: number;
  rules?: { fourFingers?: boolean; shortcut?: boolean; splash?: boolean };
  boss?: { levelDown?: boolean; halveBase?: boolean };
  /** Chips und Mult am Ende auf den Durchschnitt setzen (Deck Regel) */
  balance?: boolean;
}

export interface ScoreOut {
  type: HandType;
  scoringCount: number;
  chips: number;
  mult: number;
  total: number;
  money: number;
}

let jokerSeq = 0;

export function score(setup: ScoreSetup): ScoreOut {
  const allCards = [...setup.played, ...(setup.held ?? [])];
  if (allCards.some((x) => x.mods?.length)) notYet('Karten Modifikatoren');
  if (setup.rules && Object.values(setup.rules).some(Boolean)) notYet('Erkennungsregeln (Four Fingers, Shortcut, Splash)');
  if (setup.boss && Object.values(setup.boss).some(Boolean)) notYet('Boss Modifikatoren im Scoring');
  if (setup.balance) notYet('Balance Regel (Chips und Mult mitteln)');

  const levels = { ...initialHandLevels(), ...setup.levels };
  const handsLeft = setup.handsLeft ?? 3;
  const ids: string[] = [];
  for (const tj of setup.jokers ?? []) {
    if (tj.phase === 'retrigger') notYet('Retrigger durch Jokers');
    const id = `__test_${jokerSeq++}`;
    const wrap = (v: Effect | number | void): Effect | undefined => (typeof v === 'number' ? undefined : v ?? undefined);
    const toCtx = (ctx: ScoreContext, card?: Card): TestCtx => ({
      card,
      scoring: ctx.scoring,
      played: ctx.played,
      held: ctx.held,
      handsLeft: ctx.handsLeft,
      index: card ? ctx.scoring.indexOf(card) : undefined,
    });
    const def: JokerDef = { id, name: id, description: '', rarity: 'common', cost: 1 };
    if (tj.phase === 'main') def.onIndependent = (ctx) => wrap(tj.calc(toCtx(ctx)));
    if (tj.phase === 'scored') def.onCardScored = (card, ctx) => wrap(tj.calc(toCtx(ctx, card)));
    if (tj.phase === 'held') def.onHeldInHand = (card, ctx) => wrap(tj.calc(toCtx(ctx, card)));
    JOKER_BY_ID[id] = def;
    ids.push(id);
  }
  try {
    const r = scoreHand({
      played: setup.played,
      held: setup.held ?? [],
      handLevels: levels,
      jokers: ids.map((defId, i) => ({ uid: i + 1, defId, vars: {} })),
      money: setup.money ?? 0,
      handsLeft,
      discardsLeft: 3,
    });
    return { type: r.handType, scoringCount: r.scoring.length, chips: r.chips, mult: r.mult, total: r.total, money: r.money };
  } finally {
    for (const id of ids) delete JOKER_BY_ID[id];
  }
}

export function detect(cards: Card[]) {
  return evaluateHand(cards);
}

export function contains(cards: Card[], type: HandType): boolean {
  return containsHand(cards, type);
}

/** Anzeigename, z. B. "Royal Flush" für einen Straight Flush 10 bis Ace. */
export function displayName(_cards: Card[]): string {
  return notYet('Anzeigename Royal Flush');
}

/** Alle Hände um ein Level erhöhen (Effekt eines Consumables). */
export function levelUpAll(_levels: HandLevels): HandLevels {
  return notYet('Level Up für alle Hände');
}

// ─────────────────────────────────────────────── Wirtschaft

export function interest(money: number, cap = 5): number {
  if (cap !== 5) notYet('Konfigurierbarer Zinsdeckel');
  const run = newRun('INTEREST');
  run.money = money;
  run.round = { blind: 'small', target: 1, score: 1, handsLeft: 0, discardsLeft: 0, drawPile: [], hand: [], discardPile: [] };
  return computeEarnings(run).interest;
}

export function payout(o: { blind: BlindKind; handsLeft: number; moneyBefore: number; smallBlindReward?: number }): number {
  if (o.smallBlindReward !== undefined) notYet('Stake Regel: Small Blind ohne Belohnung');
  const run = newRun('PAYOUT');
  run.money = o.moneyBefore;
  run.round = { blind: o.blind, target: 1, score: 1, handsLeft: o.handsLeft, discardsLeft: 0, drawPile: [], hand: [], discardPile: [] };
  return computeEarnings(run).total;
}

export function buyPrice(_o: { base: number; editionSurcharge: number; discount: number }): number {
  return notYet('Preisformel mit Aufschlag und Rabatt');
}

export function sell(cost: number): number {
  return sellValue(cost);
}

export function rerollCosts(_start: number, _count: number): number[] {
  return notYet('Reroll Kosten');
}

// ─────────────────────────────────────────────── Blinds

export function baseTarget(ante: number, scaling: 1 | 2 | 3 = 1): number {
  if (scaling !== 1) notYet('Skalierung 2 und 3');
  return anteBase(ante);
}

export function target(o: { ante: number; kind: BlindKind; scaling?: 1 | 2 | 3; bossFactor?: number; deckFactor?: number }): number {
  if ((o.scaling ?? 1) !== 1) notYet('Skalierung 2 und 3');
  if (o.bossFactor !== undefined) notYet('Boss spezifischer Faktor');
  if (o.deckFactor !== undefined) notYet('Deck Faktor auf Blind Ziele');
  return blindTarget(o.ante, o.kind);
}

// ─────────────────────────────────────────────── Zufall

export interface StreamRng {
  next(key: string): number;
  chance(num: number, den: number, key: string): boolean;
}

export function streamRng(_seed: string, _probMult = 1): StreamRng {
  return notYet('Zufallsströme pro Key mit chance()');
}

export type Rarity = 'common' | 'uncommon' | 'rare';
export function rollRarity(_rng: StreamRng, _key: string): Rarity {
  return notYet('Rarity Wurf');
}
