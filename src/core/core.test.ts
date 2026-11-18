import './index';
import { describe, expect, it } from 'vitest';
import type { Card, Rank, Suit } from './cards';
import { evaluateHand } from './handEval';
import { initialHandLevels } from './hands';
import { scoreHand } from './scoring';
import { Rng } from './rng';
import { addJoker, discardCards, finishRound, isRoundWon, newRun, playCards, startRound } from './run';

let nextId = 1000;
function c(spec: string): Card {
  // e.g. "AS", "10H", "KD"
  const suit = spec.slice(-1) as Suit;
  const r = spec.slice(0, -1);
  const rank = ({ J: 11, Q: 12, K: 13, A: 14 } as Record<string, number>)[r] ?? Number(r);
  return { id: nextId++, suit, rank: rank as Rank };
}
const cs = (s: string) => s.split(' ').map(c);

describe('evaluateHand', () => {
  const cases: [string, string, number][] = [
    ['AS', 'highCard', 1],
    ['2S 9H', 'highCard', 1],
    ['KS KH', 'pair', 2],
    ['KS KH 3D', 'pair', 2],
    ['KS KH 3D 3C', 'twoPair', 4],
    ['7S 7H 7D 2C', 'threeKind', 3],
    ['2S 3H 4D 5C 6S', 'straight', 5],
    ['AS 2H 3D 4C 5S', 'straight', 5],
    ['10S JH QD KC AS', 'straight', 5],
    ['JS QH KD AC 2S', 'highCard', 1],
    ['2H 7H 9H JH KH', 'flush', 5],
    ['2H 2S 2D 9C 9H', 'fullHouse', 5],
    ['9S 9H 9D 9C 2H', 'fourKind', 4],
    ['5D 6D 7D 8D 9D', 'straightFlush', 5],
    ['9S 9H 9D 9C 9S', 'fiveKind', 5],
    ['9S 9S 9S 4S 4S', 'flushHouse', 5],
    ['9S 9S 9S 9S 9S', 'flushFive', 5],
    ['2H 7H 9H JH', 'highCard', 1],
  ];
  for (const [hand, type, n] of cases) {
    it(`${hand} → ${type}`, () => {
      const r = evaluateHand(cs(hand));
      expect(r.type).toBe(type);
      expect(r.scoring).toHaveLength(n);
    });
  }

  it('keeps scoring cards in played order', () => {
    const played = cs('3D KS 9C KH');
    expect(evaluateHand(played).scoring.map((x) => x.rank)).toEqual([13, 13]);
  });
});

describe('scoreHand', () => {
  const base = { held: [], handLevels: initialHandLevels(), jokers: [], money: 0, handsLeft: 3, discardsLeft: 3 };

  it('pair of kings: (10 + 10 + 10) × 2 = 60', () => {
    const r = scoreHand({ ...base, played: cs('KS KH 3D') });
    expect(r.chips).toBe(30);
    expect(r.mult).toBe(2);
    expect(r.total).toBe(60);
  });

  it('aces count 11 chips', () => {
    const r = scoreHand({ ...base, played: cs('AS') });
    expect(r.total).toBe((5 + 11) * 1);
  });

  it('levelled hands are stronger', () => {
    const levels = initialHandLevels();
    levels.pair = 3;
    const r = scoreHand({ ...base, handLevels: levels, played: cs('2S 2H') });
    // base 10+15*2 = 40 chips, 2+1*2 = 4 mult, +4 chips from cards
    expect(r.total).toBe(44 * 4);
  });

  it('joker order matters: +mult before ×mult', () => {
    const played = cs('AS');
    const plusThenTimes = scoreHand({
      ...base, played,
      jokers: [{ uid: 1, defId: 'funke', vars: {} }, { uid: 2, defId: 'einzelgaenger', vars: {} }],
    });
    const timesThenPlus = scoreHand({
      ...base, played,
      jokers: [{ uid: 2, defId: 'einzelgaenger', vars: {} }, { uid: 1, defId: 'funke', vars: {} }],
    });
    expect(plusThenTimes.total).toBe(16 * (1 + 4) * 3);
    expect(timesThenPlus.total).toBe(16 * (1 * 3 + 4));
  });

  it('per-card jokers trigger for each scoring card and emit events', () => {
    const r = scoreHand({ ...base, played: cs('5H 5D'), jokers: [{ uid: 1, defId: 'glut', vars: {} }] });
    expect(r.mult).toBe(2 + 2 + 2);
    expect(r.events.filter((e) => e.source.kind === 'joker')).toHaveLength(2);
    expect(r.events.at(-1)!.chipsTotal).toBe(r.chips);
  });
});

describe('run', () => {
  it('rng is deterministic', () => {
    const a = Rng.fromSeed('ABC');
    const b = Rng.fromSeed('ABC');
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
  });

  it('plays a round end-to-end', () => {
    const run = newRun('TEST');
    startRound(run);
    const r = run.round!;
    expect(r.hand).toHaveLength(8);
    expect(r.target).toBe(300);

    discardCards(run, r.hand.slice(0, 3).map((x) => x.id));
    expect(r.hand).toHaveLength(5);

    addJoker(run, 'funke');
    const res = playCards(run, r.hand.slice(0, 5).map((x) => x.id));
    expect(res.total).toBeGreaterThan(0);
    expect(r.handsLeft).toBe(3);

    r.score = r.target; // force win
    expect(isRoundWon(run)).toBe(true);
    const moneyBefore = run.money;
    const e = finishRound(run);
    expect(e.blindReward).toBe(3);
    expect(run.money).toBe(moneyBefore + e.total);
    expect(run.blindIndex).toBe(1);
  });
});
