/** Block D (Wirtschaft) und E (Blind Ziele) aus Briefing 10.3. */
import { describe, expect, it } from 'vitest';
import { baseTarget, buyPrice, interest, payout, rerollCosts, sell, target } from './helpers';

describe('Block D: Wirtschaft', () => {
  it('D1: Zinsen 1 pro 5 Dollar, Deckel 5', () => {
    expect(interest(27)).toBe(5);
    expect(interest(12)).toBe(2);
    expect(interest(4)).toBe(0);
  });

  it('D2: erhöhter Zinsdeckel 10 und 20', () => {
    expect(interest(60, 10)).toBe(10);
    expect(interest(120, 20)).toBe(20);
  });

  it('D3: Small Blind, 2 Hands übrig, 12 Dollar vorher: 3 + 2 + 2 = 7', () => {
    expect(payout({ blind: 'small', handsLeft: 2, moneyBefore: 12 })).toBe(7);
  });

  it('D4: wie D3, Small Blind ohne Belohnung (höherer Stake): 4', () => {
    expect(payout({ blind: 'small', handsLeft: 2, moneyBefore: 12, smallBlindReward: 0 })).toBe(4);
  });

  it('D5: Preis (5 + 5) mal 0.75 = 7.5, halbe Beträge abrunden: 7', () => {
    expect(buyPrice({ base: 5, editionSurcharge: 5, discount: 0.75 })).toBe(7);
  });

  it('D6: Sell Value: Kosten 6 ergibt 3, Kosten 1 ergibt 1', () => {
    expect(sell(6)).toBe(3);
    expect(sell(1)).toBe(1);
  });

  it('D7: Reroll Kosten 5, 6, 7 und mit Start 3: 3, 4, 5', () => {
    expect(rerollCosts(5, 3)).toEqual([5, 6, 7]);
    expect(rerollCosts(3, 3)).toEqual([3, 4, 5]);
  });
});

describe('Block E: Blind Ziele', () => {
  it('E1: Ante 1: 300, 450, 600', () => {
    expect([target({ ante: 1, kind: 'small' }), target({ ante: 1, kind: 'big' }), target({ ante: 1, kind: 'boss' })]).toEqual([300, 450, 600]);
  });

  it('E2: Ante 3 Big, Skalierung 2: 3900', () => {
    expect(target({ ante: 3, kind: 'big', scaling: 2 })).toBe(3900);
  });

  it('E3: Ante 5 Boss mit Faktor 4, Skalierung 3: 100000', () => {
    expect(target({ ante: 5, kind: 'boss', scaling: 3, bossFactor: 4 })).toBe(100_000);
  });

  it('E4: Ante 8 Boss mit Faktor 6, Skalierung 1: 300000', () => {
    expect(target({ ante: 8, kind: 'boss', bossFactor: 6 })).toBe(300_000);
  });

  it('E5: Ante 9 Basis: 110000', () => {
    expect(baseTarget(9)).toBe(110_000);
  });

  it('E6: Ante 10 Boss: 1120000', () => {
    expect(target({ ante: 10, kind: 'boss' })).toBe(1_120_000);
  });

  it('E7: Deck Faktor 2, Ante 1 Small: 600', () => {
    expect(target({ ante: 1, kind: 'small', deckFactor: 2 })).toBe(600);
  });

  it('E8: Ante 2 Small, Skalierung 2: 900', () => {
    expect(target({ ante: 2, kind: 'small', scaling: 2 })).toBe(900);
  });

  it('E9: Ante 13 Basis etwa 4.7e10', () => {
    expect(baseTarget(13)).toBe(4.7e10);
  });

  it('Ante 0 oder kleiner: 100', () => {
    expect(baseTarget(0)).toBe(100);
  });

  it('Skalierung 2 und 3 für Ante 9', () => {
    expect(baseTarget(9, 2)).toBe(230_000);
    expect(baseTarget(9, 3)).toBe(460_000);
  });
});
