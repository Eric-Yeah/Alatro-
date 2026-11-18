/**
 * Adapter zwischen der Spezifikations Testsuite und der Engine.
 *
 * Die Tests beschreiben Mechaniken (Reihenfolge, Retrigger, Skalierung, Zufall) mit
 * neutralen Test Jokers und Test Modifikatoren, nicht mit Originalkarten.
 * Funktionen, die die Engine noch nicht kann, werfen "Noch nicht implementiert".
 * Wenn die Engine wächst, wird nur dieser Adapter angepasst, die Tests bleiben stabil.
 */
import '../../src/core/index';
import type { Card, Rank, Suit } from '../../src/core/cards';
import { containsHand, detectHand } from '../../src/core/handEval';
import { handDisplayName, initialHandLevels, levelUpAll as engineLevelUpAll, type HandLevels, type HandType } from '../../src/core/hands';
import { registerJokers, unregisterJoker, type JokerContext, type JokerDef } from '../../src/core/jokers';
import { scoreHand } from '../../src/core/scoring';
import { baseTarget as engineBaseTarget, blindTarget, type BlindKind } from '../../src/core/blinds';
import { computeEarnings, defaultRules, interestFor, newRun } from '../../src/core/run';
import { RngStreams } from '../../src/core/rng';
import { buyPrice as engineBuyPrice, rerollCosts as engineRerollCosts, rollRarity as engineRollRarity, sellValue } from '../../src/core/shop';
import { ENHANCEMENTS, SEALS } from '../../src/data/modifiers';
import type { Effect } from '../../src/core/types';

export function notYet(feature: string): never {
  throw new Error(`Noch nicht implementiert: ${feature}`);
}

// ─────────────────────────────────────────────── Karten

/** Modifikator einer Spielkarte als reine Effektbeschreibung. */
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

export type TestCard = Card;

let nextId = 10_000;
let modSeq = 0;
const RANKS: Record<string, number> = { J: 11, Q: 12, K: 13, A: 14 };

/**
 * "AS", "10H", "KD", "9C". Test Modifikatoren werden als temporäre Enhancement
 * bzw. Seal Definitionen registriert.
 */
export function c(spec: string, mods?: TestModifier[]): TestCard {
  const suit = spec.slice(-1) as Suit;
  const r = spec.slice(0, -1);
  const rank = (RANKS[r] ?? Number(r)) as Rank;
  const card: Card = { id: nextId++, suit, rank };
  for (const m of mods ?? []) {
    if (m.scored || m.held || m.rankless) {
      const id = `__test_enh_${modSeq++}`;
      ENHANCEMENTS[id] = { id, name: id, description: '', scored: m.scored, held: m.held, rankless: m.rankless };
      card.enhancement = id;
    }
    if (m.retrigger) {
      const id = `__test_seal_${modSeq++}`;
      SEALS[id] = { id, name: id, description: '', retrigger: m.retrigger };
      card.seal = id;
    }
  }
  return card;
}

export const cs = (s: string): TestCard[] => s.trim().split(/\s+/).map((x) => c(x));

// ─────────────────────────────────────────────── Test Jokers

export type TestPhase = 'main' | 'scored' | 'held' | 'retrigger';

export interface TestJoker {
  phase: TestPhase;
  /** Rückgabe: Effekt, oder bei retrigger die Anzahl zusätzlicher Auswertungen */
  calc: (ctx: TestCtx) => Effect | number | void;
}

export interface TestCtx {
  card?: Card;
  scoring: Card[];
  played: Card[];
  held: Card[];
  handsLeft: number;
  /** Index der Karte unter den Scoring Cards (nur gespielte Karten) */
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

function toEngineJoker(tj: TestJoker): JokerDef {
  const id = `__test_joker_${jokerSeq++}`;
  return {
    id, name: id, rarity: 'common', cost: 1, config: {}, description: '', copyCompat: true,
    calculate: (ctx: JokerContext) => {
      if (ctx.phase !== tj.phase) return;
      const v = tj.calc({ card: ctx.card, scoring: ctx.scoring, played: ctx.played, held: ctx.held, handsLeft: ctx.handsLeft, index: ctx.index });
      if (typeof v === 'number') return v ? { retrigger: v } : undefined;
      return v ?? undefined;
    },
  };
}

export function score(setup: ScoreSetup): ScoreOut {
  const defs = (setup.jokers ?? []).map(toEngineJoker);
  registerJokers(defs);
  try {
    const r = scoreHand({
      played: setup.played,
      held: setup.held ?? [],
      handLevels: { ...initialHandLevels(), ...setup.levels },
      jokers: defs.map((d, i) => ({ uid: i + 1, defId: d.id, vars: {} })),
      money: setup.money ?? 0,
      handsLeft: setup.handsLeft ?? 3,
      discardsLeft: 3,
      rules: setup.rules,
      boss: setup.boss,
      balance: setup.balance,
    });
    return { type: r.handType, scoringCount: r.scoring.length, chips: r.chips, mult: r.mult, total: r.total, money: r.money };
  } finally {
    for (const d of defs) unregisterJoker(d.id);
  }
}

export function detect(cards: Card[]) {
  return detectHand(cards);
}

export function contains(cards: Card[], type: HandType): boolean {
  return containsHand(cards, type);
}

/** Anzeigename, z. B. "Royal Flush" für einen Straight Flush 10 bis Ace. */
export function displayName(cards: Card[]): string {
  const d = detectHand(cards);
  return handDisplayName(d.type, d.scoring);
}

/** Alle Hände um ein Level erhöhen (Effekt eines Consumables). */
export function levelUpAll(levels: HandLevels): HandLevels {
  return engineLevelUpAll(levels);
}

// ─────────────────────────────────────────────── Wirtschaft

export function interest(money: number, cap = 5): number {
  return interestFor(money, { ...defaultRules(), interestCap: cap });
}

export function payout(o: { blind: BlindKind; handsLeft: number; moneyBefore: number; smallBlindReward?: number }): number {
  const run = newRun('PAYOUT');
  run.money = o.moneyBefore;
  if (o.smallBlindReward !== undefined) run.rules.smallBlindReward = o.smallBlindReward;
  run.round = { blind: o.blind, target: 1, score: 1, handsLeft: o.handsLeft, discardsLeft: 0, drawPile: [], hand: [], discardPile: [] };
  return computeEarnings(run).total;
}

export function buyPrice(o: { base: number; editionSurcharge: number; discount: number }): number {
  return engineBuyPrice(o);
}

export function sell(cost: number): number {
  return sellValue(cost);
}

export function rerollCosts(start: number, count: number): number[] {
  return engineRerollCosts(start, count);
}

// ─────────────────────────────────────────────── Blinds

export function baseTarget(ante: number, scaling: 1 | 2 | 3 = 1): number {
  return engineBaseTarget(ante, scaling);
}

export function target(o: { ante: number; kind: BlindKind; scaling?: 1 | 2 | 3; bossFactor?: number; deckFactor?: number }): number {
  return blindTarget(o.ante, o.kind, { scaling: o.scaling, bossFactor: o.bossFactor, deckFactor: o.deckFactor });
}

// ─────────────────────────────────────────────── Zufall

export interface StreamRng {
  next(key: string): number;
  chance(num: number, den: number, key: string): boolean;
  /** Engine Objekt für Funktionen wie rollRarity */
  engine: RngStreams;
}

export function streamRng(seed: string, probMult = 1): StreamRng {
  const engine = RngStreams.create(seed);
  return {
    engine,
    next: (key) => engine.next(key),
    chance: (num, den, key) => engine.chance(num, den, key, probMult),
  };
}

export type Rarity = 'common' | 'uncommon' | 'rare';
export function rollRarity(rng: StreamRng, key: string): Rarity {
  return engineRollRarity(rng.engine, key) as Rarity;
}
