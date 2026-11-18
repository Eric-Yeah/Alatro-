import { createStandardDeck, type Card } from './cards';
import { BLIND_INFO, BLIND_KINDS, FINAL_ANTE, blindTarget, type BlindKind } from './blinds';
import { initialHandLevels, type HandLevels } from './hands';
import type { JokerInstance } from './jokers';
import { Rng } from './rng';
import { scoreHand, type ScoreResult } from './scoring';

export interface RoundState {
  blind: BlindKind;
  target: number;
  score: number;
  handsLeft: number;
  discardsLeft: number;
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
}

export interface RunState {
  seed: string;
  rngState: number;
  ante: number;
  blindIndex: number; // 0 small, 1 big, 2 boss
  money: number;
  handSize: number;
  hands: number;
  discards: number;
  jokerSlots: number;
  handLevels: HandLevels;
  jokers: JokerInstance[];
  deck: Card[];
  nextUid: number;
  round: RoundState | null;
  won: boolean;
}

export interface RoundEarnings {
  blindReward: number;
  handsBonus: number;
  interest: number;
  total: number;
}

export const MAX_SELECT = 5;

export function newRun(seed: string): RunState {
  const rng = Rng.fromSeed(seed);
  return {
    seed,
    rngState: rng.state,
    ante: 1,
    blindIndex: 0,
    money: 4,
    handSize: 8,
    hands: 4,
    discards: 3,
    jokerSlots: 5,
    handLevels: initialHandLevels(),
    jokers: [],
    deck: createStandardDeck(),
    nextUid: 1,
    round: null,
    won: false,
  };
}

function withRng<T>(run: RunState, fn: (rng: Rng) => T): T {
  const rng = new Rng(run.rngState);
  const result = fn(rng);
  run.rngState = rng.state;
  return result;
}

export function currentBlind(run: RunState): BlindKind {
  return BLIND_KINDS[run.blindIndex];
}

export function startRound(run: RunState): RoundState {
  const blind = currentBlind(run);
  const drawPile = withRng(run, (rng) => rng.shuffle([...run.deck]));
  const round: RoundState = {
    blind,
    target: blindTarget(run.ante, blind),
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
  // Keep the order in which cards sit in the hand (left to right)
  const taken = r.hand.filter((c) => ids.includes(c.id));
  r.hand = r.hand.filter((c) => !ids.includes(c.id));
  return taken;
}

export function playCards(run: RunState, ids: number[]): ScoreResult {
  const r = run.round!;
  if (ids.length === 0 || ids.length > MAX_SELECT) throw new Error('invalid selection');
  if (r.handsLeft <= 0) throw new Error('no hands left');
  const played = takeFromHand(r, ids);
  r.handsLeft--;
  const result = scoreHand({
    played,
    held: r.hand,
    handLevels: run.handLevels,
    jokers: run.jokers,
    money: run.money,
    handsLeft: r.handsLeft,
    discardsLeft: r.discardsLeft,
  });
  r.score += result.total;
  run.money += result.money;
  r.discardPile.push(...played);
  return result;
}

export function discardCards(run: RunState, ids: number[]): void {
  const r = run.round!;
  if (ids.length === 0 || ids.length > MAX_SELECT) throw new Error('invalid selection');
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

export function computeEarnings(run: RunState): RoundEarnings {
  const r = run.round!;
  const blindReward = BLIND_INFO[r.blind].reward;
  const handsBonus = r.handsLeft;
  const interest = Math.min(5, Math.floor(Math.max(run.money, 0) / 5));
  return { blindReward, handsBonus, interest, total: blindReward + handsBonus + interest };
}

/** Pays out the round and advances to the next blind. */
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

export function sellValue(defCost: number): number {
  return Math.max(1, Math.floor(defCost / 2));
}

/** Placeholder until the shop exists: offer n distinct jokers the player doesn't own. */
export function jokerOffer(run: RunState, pool: { id: string; rarity: string }[], n: number): string[] {
  const owned = new Set(run.jokers.map((j) => j.defId));
  const weights: Record<string, number> = { common: 70, uncommon: 25, rare: 5, legendary: 0 };
  const candidates = pool.filter((j) => !owned.has(j.id) && weights[j.rarity] > 0);
  return withRng(run, (rng) => {
    const picks: string[] = [];
    const left = [...candidates];
    while (picks.length < n && left.length > 0) {
      const total = left.reduce((s, j) => s + weights[j.rarity], 0);
      let roll = rng.next() * total;
      let idx = 0;
      while (roll >= weights[left[idx].rarity]) roll -= weights[left[idx++].rarity];
      picks.push(left.splice(idx, 1)[0].id);
    }
    return picks;
  });
}
