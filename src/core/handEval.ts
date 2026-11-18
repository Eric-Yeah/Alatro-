import type { Card } from './cards';
import type { HandType } from './hands';

export interface EvaluatedHand {
  type: HandType;
  /** Cards that count for scoring, in played (left-to-right) order. */
  scoring: Card[];
}

function isStraight(cards: Card[]): boolean {
  if (cards.length !== 5) return false;
  const ranks = [...new Set(cards.map((c) => c.rank))].sort((a, b) => a - b);
  if (ranks.length !== 5) return false;
  if (ranks[4] - ranks[0] === 4) return true;
  // Ace-low: A 2 3 4 5
  return ranks.join(',') === '2,3,4,5,14';
}

function isFlush(cards: Card[]): boolean {
  return cards.length === 5 && cards.every((c) => c.suit === cards[0].suit);
}

export function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length === 0) return { type: 'highCard', scoring: [] };

  const byRank = new Map<number, Card[]>();
  for (const c of cards) byRank.set(c.rank, [...(byRank.get(c.rank) ?? []), c]);
  const groups = [...byRank.values()].sort((a, b) => b.length - a.length || b[0].rank - a[0].rank);
  const counts = groups.map((g) => g.length);

  const flush = isFlush(cards);
  const straight = isStraight(cards);
  const keep = (subset: Card[]) => cards.filter((c) => subset.includes(c));
  const all = () => [...cards];

  if (flush && counts[0] === 5) return { type: 'flushFive', scoring: all() };
  if (flush && counts[0] === 3 && counts[1] === 2) return { type: 'flushHouse', scoring: all() };
  if (counts[0] === 5) return { type: 'fiveKind', scoring: all() };
  if (straight && flush) return { type: 'straightFlush', scoring: all() };
  if (counts[0] === 4) return { type: 'fourKind', scoring: keep(groups[0]) };
  if (counts[0] === 3 && counts[1] === 2) return { type: 'fullHouse', scoring: all() };
  if (flush) return { type: 'flush', scoring: all() };
  if (straight) return { type: 'straight', scoring: all() };
  if (counts[0] === 3) return { type: 'threeKind', scoring: keep(groups[0]) };
  if (counts[0] === 2 && counts[1] === 2) return { type: 'twoPair', scoring: keep([...groups[0], ...groups[1]]) };
  if (counts[0] === 2) return { type: 'pair', scoring: keep(groups[0]) };

  const highest = cards.reduce((best, c) => (c.rank > best.rank ? c : best));
  return { type: 'highCard', scoring: [highest] };
}

/** Does the played hand contain (at least) the given hand type? e.g. a Full House contains a Pair. */
export function containsHand(cards: Card[], type: HandType): boolean {
  const counts = [...cardsByRank(cards).values()].map((g) => g.length).sort((a, b) => b - a);
  switch (type) {
    case 'pair': return counts[0] >= 2;
    case 'twoPair': return (counts[0] >= 2 && counts[1] >= 2) || counts[0] >= 4;
    case 'threeKind': return counts[0] >= 3;
    case 'fourKind': return counts[0] >= 4;
    case 'straight': return isStraight(cards);
    case 'flush': return isFlush(cards);
    default: return evaluateHand(cards).type === type;
  }
}

function cardsByRank(cards: Card[]): Map<number, Card[]> {
  const m = new Map<number, Card[]>();
  for (const c of cards) m.set(c.rank, [...(m.get(c.rank) ?? []), c]);
  return m;
}
