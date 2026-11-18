/** Block F (Zufall) und G (Hand Erkennung, Property Tests) aus Briefing 10.3. */
import { describe, expect, it } from 'vitest';
import type { Card, Rank, Suit } from '../../src/core/cards';
import { HAND_ORDER, type HandType } from '../../src/core/hands';
import { Rng } from '../../src/core/rng';
import { newRun, startRound } from '../../src/core/run';
import { c, contains, cs, detect, rollRarity, score, streamRng } from './helpers';

describe('Block F: Zufall', () => {
  it('F1: Wahrscheinlichkeitsfaktor 2: 1 in 6 wird 2 in 6', () => {
    const rng = streamRng('SEED1234', 2);
    let hits = 0;
    const n = 60_000;
    for (let i = 0; i < n; i++) if (rng.chance(1, 6, 'f1')) hits++;
    expect(hits / n).toBeCloseTo(2 / 6, 2);
  });

  it('F2: Wahrscheinlichkeitsfaktor 2: 1 in 2 ist sicher', () => {
    const rng = streamRng('SEED1234', 2);
    for (let i = 0; i < 1000; i++) expect(rng.chance(1, 2, 'f2')).toBe(true);
  });

  it('F3: gleicher Seed und gleiche Aktionen ergeben gleiche Karten', () => {
    const a = newRun('SAMESEED');
    const b = newRun('SAMESEED');
    startRound(a);
    startRound(b);
    expect(a.round!.hand).toEqual(b.round!.hand);
    expect(a.round!.drawPile).toEqual(b.round!.drawPile);
  });

  it('F4: Ziehungen eines Keys hängen nicht von anderen Keys ab', () => {
    const a = streamRng('SEEDABCD');
    const b = streamRng('SEEDABCD');
    a.next('shop_ante1');
    a.next('shop_ante1');
    const fromA = a.next('pack_ante1');
    const fromB = b.next('pack_ante1');
    expect(fromA).toBe(fromB);
  });

  it('F5: Rarity Verteilung 70, 25, 5 Prozent', () => {
    const rng = streamRng('RARITY01');
    const n = 100_000;
    const count = { common: 0, uncommon: 0, rare: 0 };
    for (let i = 0; i < n; i++) count[rollRarity(rng, 'rarity')]++;
    expect(count.common / n).toBeCloseTo(0.7, 1);
    expect(count.uncommon / n).toBeCloseTo(0.25, 1);
    expect(count.rare / n).toBeCloseTo(0.05, 1);
  });
});

// ─────────────────────────────────────────────── Referenz Erkennung für Property Tests

/** Unabhängige, bewusst simple Referenz: welche Strukturen enthält eine Kartenmenge? */
function referenceContained(cards: Card[]): Set<HandType> {
  const s = new Set<HandType>(['highCard']);
  const counts = new Map<number, number>();
  for (const x of cards) counts.set(x.rank, (counts.get(x.rank) ?? 0) + 1);
  const cnt = [...counts.values()].sort((a, b) => b - a);
  const flush = cards.length === 5 && new Set(cards.map((x) => x.suit)).size === 1;
  const ranks = [...new Set(cards.map((x) => x.rank))].sort((a, b) => a - b);
  const straight = cards.length === 5 && ranks.length === 5 && (ranks[4] - ranks[0] === 4 || ranks.join() === '2,3,4,5,14');
  if (cnt[0] >= 2) s.add('pair');
  if (cnt[0] >= 2 && cnt[1] >= 2) s.add('twoPair');
  if (cnt[0] >= 3) s.add('threeKind');
  if (cnt[0] >= 4) s.add('fourKind');
  if (cnt[0] === 5) s.add('fiveKind');
  if (cnt[0] === 3 && cnt[1] === 2) s.add('fullHouse');
  if (straight) s.add('straight');
  if (flush) s.add('flush');
  if (straight && flush) s.add('straightFlush');
  if (flush && cnt[0] === 3 && cnt[1] === 2) s.add('flushHouse');
  if (flush && cnt[0] === 5) s.add('flushFive');
  return s;
}

function subsets<T>(items: T[], maxSize: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, cur: T[]) => {
    if (cur.length > 0) out.push([...cur]);
    if (cur.length === maxSize) return;
    for (let i = start; i < items.length; i++) rec(i + 1, [...cur, items[i]]);
  };
  rec(0, []);
  return out;
}

describe('Block G: Hand Erkennung', () => {
  it('Property: für alle Teilmengen zufälliger 8 Karten Blätter ist der Typ der höchste erfüllte', () => {
    const rng = new Rng(12345);
    const suits: Suit[] = ['S', 'H', 'D', 'C'];
    for (let round = 0; round < 150; round++) {
      // kleiner Rangbereich und wenige Suits erzeugen viele Paare, Straights und Flushes
      const pool: Card[] = [];
      for (let i = 0; i < 8; i++) {
        pool.push({ id: i, rank: (2 + rng.int(6) + (rng.int(4) === 0 ? 8 : 0)) as Rank, suit: suits[rng.int(2)] });
      }
      for (const sub of subsets(pool, 5)) {
        const expected = HAND_ORDER.find((h) => referenceContained(sub).has(h))!;
        expect(detect(sub).type).toBe(expected);
      }
    }
  });

  it('Four Fingers Regel: 4 Hearts plus 1 Spade ist Flush mit 4 Scoring Cards', () => {
    const r = score({ played: cs('2H 5H 8H JH 3S'), rules: { fourFingers: true } });
    expect(r.type).toBe('flush');
    expect(r.scoringCount).toBe(4);
  });

  it('Shortcut Regel: 10 8 6 5 3 ist Straight', () => {
    expect(score({ played: cs('10S 8H 6D 5C 3S'), rules: { shortcut: true } }).type).toBe('straight');
  });

  it('Splash Regel: alle gespielten Karten scoren', () => {
    expect(score({ played: cs('9S 9H 3D 6C JS'), rules: { splash: true } }).scoringCount).toBe(5);
  });

  it('rangloser Modifikator: Karte scort immer mit +50 Chips', () => {
    const stoneLike = { rankless: true, scored: { chips: 50 } };
    const r = score({ played: [c('9S'), c('9H'), c('4D', [stoneLike])] });
    expect(r.scoringCount).toBe(3);
    expect(r.chips).toBe(10 + 18 + 50);
  });

  describe('contains Semantik (Abschnitt 2.3)', () => {
    const table: [string, HandType, boolean][] = [
      ['9S 9H', 'pair', true],
      ['9S 9H 4D 4C', 'pair', true],
      ['KS KH KD 4C 4S', 'pair', true],
      ['9S 9H 9D 9C 2S', 'pair', true],
      ['9S 9H 4D 4C', 'twoPair', true],
      ['KS KH KD 4C 4S', 'twoPair', true],
      ['9S 9H 9D 9C 2S', 'twoPair', false],
      ['KS KH KD 2C', 'threeKind', true],
      ['9S 9H 9D 9C 2S', 'threeKind', true],
      ['KS KH KD 4C 4S', 'threeKind', true],
      ['9S 9H 9D 9C 2S', 'fourKind', true],
      ['5S 6H 7D 8C 9S', 'straight', true],
      ['5S 6S 7S 8S 9S', 'straight', true],
      ['2H 4H 7H 9H KH', 'flush', true],
      ['5S 6S 7S 8S 9S', 'flush', true],
      ['7H 7H 7H 3H 3H', 'flush', true],
      ['2H 4H 7H 9H', 'flush', false],
    ];
    for (const [hand, type, expected] of table) {
      it(`${hand} enthält ${type}: ${expected}`, () => {
        expect(contains(cs(hand), type)).toBe(expected);
      });
    }
  });
});
