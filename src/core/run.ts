import { createStandardDeck } from './cards';
import { BLIND_KINDS, blindReward, blindTarget, type BlindKind, type Scaling } from './blinds';
import { FINAL_ANTE } from '../data/blinds';
import { INTEREST, PAYOUT, START } from '../data/economy';
import { initialHandLevels, type HandLevels } from './hands';
import { allJokers, getJoker, jokerRules, type JokerInstance } from './jokers';
import { RngStreams, type RngStreamsState } from './rng';
import { scoreHand, type BossScoreMods, type ScoreResult } from './scoring';
import { rollRarity, sellValue as sellFromPrice } from './shop';
import type { Card, HandType } from './types';

export const SAVE_VERSION = 2;

/** Regeln eines Runs. Decks, Stakes und Vouchers verändern diese Werte (M2). */
export interface RunRules {
  scaling: Scaling;
  interestPer: number;
  interestCap: number;
  noInterest: boolean;
  perHandLeft: number;
  perDiscardLeft: number;
  /** null = Standardbelohnung des Small Blinds */
  smallBlindReward: number | null;
  /** Faktor auf alle Blind Ziele (Deck Regel) */
  blindTargetFactor: number;
  /** Chips und Mult mitteln (Deck Regel) */
  balance: boolean;
  /** Faktor auf alle "num in den" Chancen */
  probMult: number;
}

export function defaultRules(): RunRules {
  return {
    scaling: 1,
    interestPer: INTEREST.per,
    interestCap: INTEREST.cap,
    noInterest: false,
    perHandLeft: PAYOUT.perHandLeft,
    perDiscardLeft: PAYOUT.perDiscardLeft,
    smallBlindReward: null,
    blindTargetFactor: 1,
    balance: false,
    probMult: 1,
  };
}

export interface RoundState {
  blind: BlindKind;
  target: number;
  score: number;
  handsLeft: number;
  discardsLeft: number;
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
  /** Boss Modifikatoren dieser Runde (Bosse folgen in M2) */
  boss?: BossScoreMods;
}

export interface RunState {
  version: number;
  seed: string;
  rng: RngStreamsState;
  ante: number;
  blindIndex: number; // 0 small, 1 big, 2 boss
  money: number;
  handSize: number;
  hands: number;
  discards: number;
  jokerSlots: number;
  consumableSlots: number;
  handLevels: HandLevels;
  /** wie oft jede Hand gespielt wurde (Secret Hands, Statistik) */
  handsPlayed: Record<HandType, number>;
  jokers: JokerInstance[];
  deck: Card[];
  nextUid: number;
  round: RoundState | null;
  won: boolean;
  rules: RunRules;
}

export interface RoundEarnings {
  blindReward: number;
  handsBonus: number;
  discardsBonus: number;
  interest: number;
  total: number;
}

export const MAX_SELECT = START.maxPlay;

function zeroCounts(levels: HandLevels): Record<HandType, number> {
  return Object.fromEntries(Object.keys(levels).map((k) => [k, 0])) as Record<HandType, number>;
}

export function newRun(seed: string): RunState {
  const handLevels = initialHandLevels();
  return {
    version: SAVE_VERSION,
    seed,
    rng: RngStreams.create(seed).data,
    ante: 1,
    blindIndex: 0,
    money: START.money,
    handSize: START.handSize,
    hands: START.hands,
    discards: START.discards,
    jokerSlots: START.jokerSlots,
    consumableSlots: START.consumableSlots,
    handLevels,
    handsPlayed: zeroCounts(handLevels),
    jokers: [],
    deck: createStandardDeck(),
    nextUid: 1,
    round: null,
    won: false,
    rules: defaultRules(),
  };
}

export function rngOf(run: RunState): RngStreams {
  return new RngStreams(run.rng);
}

export function runChance(run: RunState, num: number, den: number, key: string): boolean {
  return rngOf(run).chance(num, den, key, run.rules.probMult);
}

export function currentBlind(run: RunState): BlindKind {
  return BLIND_KINDS[run.blindIndex];
}

export function currentTarget(run: RunState, kind: BlindKind = currentBlind(run)): number {
  return blindTarget(run.ante, kind, { scaling: run.rules.scaling, deckFactor: run.rules.blindTargetFactor });
}

export function startRound(run: RunState): RoundState {
  const blind = currentBlind(run);
  const drawPile = rngOf(run).shuffle(`shuffle_a${run.ante}_${blind}`, [...run.deck]);
  const round: RoundState = {
    blind,
    target: currentTarget(run, blind),
    score: 0,
    handsLeft: run.hands,
    discardsLeft: run.discards,
    drawPile,
    hand: [],
    discardPile: [],
  };
  run.round = round;
  drawToHandSize(run);
  return round;
}

export function drawToHandSize(run: RunState): Card[] {
  const r = run.round!;
  const drawn: Card[] = [];
  while (r.hand.length < run.handSize && r.drawPile.length > 0) {
    const c = r.drawPile.pop()!;
    r.hand.push(c);
    drawn.push(c);
  }
  return drawn;
}

function takeFromHand(r: RoundState, ids: number[]): Card[] {
  // Reihenfolge der Hand (links nach rechts) bleibt erhalten
  const taken = r.hand.filter((c) => ids.includes(c.id));
  r.hand = r.hand.filter((c) => !ids.includes(c.id));
  return taken;
}

export function playCards(run: RunState, ids: number[]): ScoreResult {
  const r = run.round!;
  if (ids.length === 0 || ids.length > START.maxPlay) throw new Error('invalid selection');
  if (r.handsLeft <= 0) throw new Error('no hands left');
  const played = takeFromHand(r, ids);
  r.handsLeft--;
  const rng = rngOf(run);
  const result = scoreHand({
    played,
    held: r.hand,
    handLevels: run.handLevels,
    jokers: run.jokers,
    money: run.money,
    handsLeft: r.handsLeft,
    discardsLeft: r.discardsLeft,
    rules: jokerRules(run.jokers),
    boss: r.boss,
    balance: run.rules.balance,
    chance: (num, den, key) => rng.chance(num, den, `${key}_a${run.ante}`, run.rules.probMult),
  });
  r.score += result.total;
  run.money += result.money;
  run.handsPlayed[result.handType] = (run.handsPlayed[result.handType] ?? 0) + 1;
  const destroyedIds = new Set(result.destroyed.map((c) => c.id));
  run.deck = run.deck.filter((c) => !destroyedIds.has(c.id));
  r.discardPile.push(...played.filter((c) => !destroyedIds.has(c.id)));
  return result;
}

export function discardCards(run: RunState, ids: number[]): void {
  const r = run.round!;
  if (ids.length === 0 || ids.length > START.maxDiscard) throw new Error('invalid selection');
  if (r.discardsLeft <= 0) throw new Error('no discards left');
  r.discardPile.push(...takeFromHand(r, ids));
  r.discardsLeft--;
}

export function isRoundWon(run: RunState): boolean {
  return !!run.round && run.round.score >= run.round.target;
}

export function isRoundLost(run: RunState): boolean {
  const r = run.round;
  return !!r && r.score < r.target && (r.handsLeft === 0 || (r.hand.length === 0 && r.drawPile.length === 0));
}

/** Zinsen auf den Bestand vor der Auszahlung (Offener Punkt O10). */
export function interestFor(money: number, rules: RunRules): number {
  if (rules.noInterest) return 0;
  return Math.min(rules.interestCap, Math.floor(Math.max(money, 0) / rules.interestPer) * INTEREST.amount);
}

export function computeEarnings(run: RunState): RoundEarnings {
  const r = run.round!;
  const reward = blindReward(run.ante, r.blind, run.rules.smallBlindReward);
  const handsBonus = r.handsLeft * run.rules.perHandLeft;
  const discardsBonus = r.discardsLeft * run.rules.perDiscardLeft;
  const interest = interestFor(run.money, run.rules);
  return { blindReward: reward, handsBonus, discardsBonus, interest, total: reward + handsBonus + discardsBonus + interest };
}

/** Zahlt die Runde aus und geht zum nächsten Blind. */
export function finishRound(run: RunState): RoundEarnings {
  const earnings = computeEarnings(run);
  run.money += earnings.total;
  const wasBoss = run.round!.blind === 'boss';
  run.round = null;
  if (wasBoss) {
    if (run.ante === FINAL_ANTE) run.won = true;
    run.ante++;
    run.blindIndex = 0;
  } else {
    run.blindIndex++;
  }
  return earnings;
}

export function addJoker(run: RunState, defId: string): JokerInstance | null {
  if (run.jokers.length >= run.jokerSlots) return null;
  const inst: JokerInstance = { uid: run.nextUid++, defId, vars: {} };
  run.jokers.push(inst);
  return inst;
}

/** Verkaufswert eines Jokers aus seinem Basispreis (Shop Preise folgen in M2). */
export function jokerSellValue(inst: JokerInstance): number {
  return sellFromPrice(getJoker(inst.defId)?.cost ?? 0);
}

/** Kompatibilität: Verkaufswert aus einem Preis. */
export const sellValue = sellFromPrice;

/** Platzhalter bis zum Shop: n verschiedene Jokers, die nicht im Besitz sind. */
export function jokerOffer(run: RunState, n: number): string[] {
  const rng = rngOf(run);
  const owned = new Set(run.jokers.map((j) => j.defId));
  const picks: string[] = [];
  const free = () => allJokers().filter((j) => !owned.has(j.id) && !picks.includes(j.id) && j.rarity !== 'legendary');
  while (picks.length < n && free().length > 0) {
    const rarity = rollRarity(rng, `offer_rarity_a${run.ante}`);
    let pool = free().filter((j) => j.rarity === rarity);
    // Resample: leere Rarity fällt auf alle freien Jokers zurück (Briefing 7.1)
    if (pool.length === 0) pool = free();
    picks.push(rng.pick(`offer_joker_a${run.ante}`, pool).id);
  }
  return picks;
}
