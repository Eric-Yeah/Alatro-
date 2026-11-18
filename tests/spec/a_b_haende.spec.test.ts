/**
 * Block A und B aus Briefing 10.3: Pokerhände, Basiswerte, Level.
 * Alle Werte Level 1, ohne Jokers und Modifikatoren, sofern nicht anders genannt.
 */
import { describe, expect, it } from 'vitest';
import { initialHandLevels } from '../../src/core/hands';
import { c, cs, displayName, levelUpAll, score } from './helpers';

describe('Block A: Pokerhände', () => {
  const cases: [string, string, string, number][] = [
    ['A1', 'AS', 'highCard', 16],
    ['A2', 'KS 9H 7D 4C 2S', 'highCard', 15],
    ['A3', '9S 9H 3D 6C JS', 'pair', 56],
    ['A4', '3S 3H 7D 7C KS', 'twoPair', 80],
    ['A5', '5S 5H 5D 2C 9S', 'threeKind', 135],
    ['A6', '5S 6H 7D 8C 9S', 'straight', 260],
    ['A7', 'AS 2H 3D 4C 5S', 'straight', 220],
    ['A8', '2H 4H 7H 9H KH', 'flush', 268],
    ['A9', 'KS KH KD 4C 4S', 'fullHouse', 312],
    ['A10', '9S 9H 9D 9C 2S', 'fourKind', 672],
    ['A11', '5S 6S 7S 8S 9S', 'straightFlush', 1080],
    ['A12', '10S JS QS KS AS', 'straightFlush', 1208],
    ['A13', 'AS AS AH AD AC', 'fiveKind', 2100],
    ['A14', '7H 7H 7H 3H 3H', 'flushHouse', 2338],
    ['A15', 'KH KH KH KH KH', 'flushFive', 3360],
    ['A16', 'KS KH KD KC KS', 'fiveKind', 2040],
    ['A17', '9D 9D 9D 9D 2D', 'fourKind', 672],
  ];
  for (const [nr, hand, type, total] of cases) {
    it(`${nr}: ${hand} ergibt ${type} mit ${total}`, () => {
      const r = score({ played: cs(hand) });
      expect(r.type).toBe(type);
      expect(r.total).toBe(total);
    });
  }

  it('A10: der Kicker scort beim Four of a Kind nicht', () => {
    expect(score({ played: cs('9S 9H 9D 9C 2S') }).scoringCount).toBe(4);
  });

  it('A12: Straight Flush 10 bis Ace wird als Royal Flush angezeigt', () => {
    expect(displayName(cs('10S JS QS KS AS'))).toBe('Royal Flush');
  });

  it('Reihenfolge der Auswahl ändert den Handtyp nicht', () => {
    expect(score({ played: cs('9S 2H 5D 9C 5S') }).type).toBe('twoPair');
  });

  it('kein Wraparound: Q K A 2 3 ist keine Straight', () => {
    expect(score({ played: cs('QS KH AD 2C 3S') }).type).toBe('highCard');
  });
});

describe('Block B: Level', () => {
  it('B1: Pair Level 3, gespielt 9 9: chips 40, mult 4, Score 232', () => {
    const r = score({ played: cs('9S 9H'), levels: { pair: 3 } });
    expect(r.total).toBe(232);
    expect(r.mult).toBe(4);
  });

  it('B2: Flush Level 5 hat Basis chips 95, mult 12', () => {
    // Flush aus 2 3 4 5 7 (Kartenchips 21) isoliert die Basiswerte
    const r = score({ played: cs('2H 3H 4H 5H 7H'), levels: { flush: 5 } });
    expect(r.chips - 21).toBe(95);
    expect(r.mult).toBe(12);
  });

  it('B3: Boss senkt das Level der gespielten Hand um 1 (Flush 5 wird 4: 80 und 10)', () => {
    const r = score({ played: cs('2H 3H 4H 5H 7H'), levels: { flush: 5 }, boss: { levelDown: true } });
    expect(r.chips - 21).toBe(80);
    expect(r.mult).toBe(10);
  });

  it('B4: Straight Flush Level 6: Basis 300 und 28', () => {
    const r = score({ played: cs('5S 6S 7S 8S 9S'), levels: { straightFlush: 6 } });
    expect(r.chips - 35).toBe(300);
    expect(r.mult).toBe(28);
  });

  it('B5: Level Up für alle Hände setzt alle 12 Hände auf Level 2', () => {
    const lv = levelUpAll(initialHandLevels());
    expect(Object.values(lv)).toHaveLength(12);
    expect(Object.values(lv).every((l) => l === 2)).toBe(true);
  });

  it('B6: Boss halbiert die Basis mit Aufrunden, Mult 7 wird 4', () => {
    const r = score({ played: cs('9S 9H 9D 9C 2S'), boss: { halveBase: true } });
    expect(r.mult).toBe(4);
    expect(r.chips).toBe(30 + 36);
  });

  it('Level kann nicht unter 1 fallen', () => {
    const r = score({ played: [c('AS')], boss: { levelDown: true } });
    expect(r.total).toBe(16);
  });
});
