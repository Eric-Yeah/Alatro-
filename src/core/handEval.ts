import { ACE, ACE_LOW_VALUE, SUITS, SUIT_COLOR_GROUP } from '../data/cards';
import { DETECTION, HAND_ORDER } from '../data/hands';
import { isAnySuit, isRankless } from './cards';
import type { Card, DetectRules, HandType, Suit } from './types';

export interface EvaluatedHand {
  type: HandType;
  /** Karten, die gewertet werden, in gespielter Reihenfolge (links nach rechts) */
  scoring: Card[];
  /** alle Strukturen, die die Karten enthalten (Briefing 2.3) */
  contained: Set<HandType>;
}


function combinations<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, cur: T[]) => {
    if (cur.length === k) { out.push(cur); return; }
    for (let i = start; i < items.length; i++) rec(i + 1, [...cur, items[i]]);
  };
  rec(0, []);
  return out;
}

function isStraightRanks(ranks: number[], shortcut: boolean): boolean {
  const maxGap = shortcut ? DETECTION.shortcutGap : DETECTION.straightGap;
  const check = (rs: number[]) => {
    const s = [...rs].sort((a, b) => a - b);
    if (new Set(s).size !== s.length) return false;
    for (let i = 1; i < s.length; i++) if (s[i] - s[i - 1] > maxGap) return false;
    return true;
  };
  // Ace hoch oder niedrig, aber nicht beides; kein Wraparound
  return check(ranks) || (ranks.includes(ACE) && check(ranks.map((r) => (r === ACE ? ACE_LOW_VALUE : r))));
}

/** Karten, die eine Straight bilden (größte passende Teilmenge), oder null. */
function findStraight(cards: Card[], size: number, shortcut: boolean): Card[] | null {
  for (let k = cards.length; k >= size; k--) {
    for (const combo of combinations(cards, k)) {
      if (isStraightRanks(combo.map((c) => c.rank), shortcut)) return combo;
    }
  }
  return null;
}

function suitKey(suit: Suit, smeared: boolean): string {
  return smeared ? SUIT_COLOR_GROUP[suit] : suit;
}

/** Karten, die einen Flush bilden, oder null. Karten mit "jede Suit" zählen überall. */
function findFlush(cards: Card[], size: number, smeared: boolean): Card[] | null {
  let best: Card[] | null = null;
  const keys = [...new Set(SUITS.map((s) => suitKey(s, smeared)))];
  for (const key of keys) {
    const matching = cards.filter((c) => isAnySuit(c) || suitKey(c.suit, smeared) === key);
    if (matching.length >= size && (!best || matching.length > best.length)) best = matching;
  }
  return best;
}

/**
 * Reine Erkennungsfunktion (Briefing 2.2, 2.3, 8.2). Ranglose Karten bilden keine
 * Strukturen, scoren aber immer.
 */
export function detectHand(cards: Card[], rules: DetectRules = {}): EvaluatedHand {
  const ranked = cards.filter((c) => !isRankless(c));
  const rankless = cards.filter((c) => isRankless(c));
  const size = rules.fourFingers ? DETECTION.fourFingersSize : DETECTION.flushSize;

  const byRank = new Map<number, Card[]>();
  for (const c of ranked) byRank.set(c.rank, [...(byRank.get(c.rank) ?? []), c]);
  const groups = [...byRank.values()].sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);
  const n0 = groups[0]?.length ?? 0;
  const n1 = groups[1]?.length ?? 0;

  const straightCards = ranked.length >= size ? findStraight(ranked, size, !!rules.shortcut) : null;
  const flushCards = ranked.length >= size ? findFlush(ranked, size, !!rules.smeared) : null;

  const contained = new Set<HandType>(['highCard']);
  if (n0 >= 2) contained.add('pair');
  if (n0 >= 2 && n1 >= 2) contained.add('twoPair');
  if (n0 >= 3) contained.add('threeKind');
  if (n0 >= 4) contained.add('fourKind');
  if (n0 >= 5) contained.add('fiveKind');
  if (n0 >= 3 && n1 >= 2) contained.add('fullHouse');
  if (straightCards) contained.add('straight');
  if (flushCards) contained.add('flush');
  if (straightCards && flushCards) contained.add('straightFlush');
  if (flushCards && contained.has('fullHouse')) contained.add('flushHouse');
  if (flushCards && contained.has('fiveKind')) contained.add('flushFive');

  const type = HAND_ORDER.find((h) => contained.has(h))!;

  let core: Card[];
  switch (type) {
    case 'flushFive':
    case 'fiveKind':
    case 'fourKind':
    case 'threeKind':
    case 'pair':
      core = groups[0];
      break;
    case 'flushHouse':
    case 'fullHouse':
    case 'twoPair':
      core = [...groups[0], ...groups[1]];
      break;
    case 'straightFlush':
      core = [...new Set([...straightCards!, ...flushCards!])];
      break;
    case 'flush':
      core = flushCards!;
      break;
    case 'straight':
      core = straightCards!;
      break;
    default:
      core = ranked.length ? [ranked.reduce((best, c) => (c.rank > best.rank ? c : best))] : [];
  }

  const inScoring = rules.splash ? new Set(cards) : new Set([...core, ...rankless]);
  return { type, scoring: cards.filter((c) => inScoring.has(c)), contained };
}

/** Kompatibilität: Erkennung ohne Sonderregeln. */
export function evaluateHand(cards: Card[]): EvaluatedHand {
  return detectHand(cards);
}

/** Enthalten die Karten die Struktur? (Briefing 2.3) */
export function containsHand(cards: Card[], type: HandType, rules: DetectRules = {}): boolean {
  return detectHand(cards, rules).contained.has(type);
}
