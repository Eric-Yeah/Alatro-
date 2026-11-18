/**
 * Block C aus Briefing 10.3: Scoring Reihenfolge und Retrigger.
 * Statt Originalkarten werden neutrale Test Jokers und Test Modifikatoren mit
 * derselben Mechanik verwendet.
 */
import { describe, expect, it } from 'vitest';
import { J, c, cs, score, type TestJoker } from './helpers';

const isFace = (r: number) => r >= 11 && r <= 13;

describe('Block C: Reihenfolge', () => {
  it('C1: Joker +4 Mult, Pair 9 9: (10+18) mal (2+4) = 168', () => {
    expect(score({ played: cs('9S 9H'), jokers: [J.plusMult(4)] }).total).toBe(168);
  });

  it('C2: +4 Mult links von X2 ergibt mehr als umgekehrt', () => {
    expect(score({ played: cs('9S 9H'), jokers: [J.plusMult(4), J.xMult(2)] }).total).toBe(28 * 12);
    expect(score({ played: cs('9S 9H'), jokers: [J.xMult(2), J.plusMult(4)] }).total).toBe(28 * 8);
  });

  it('C3: Karte mit +4 Mult vor Karte mit X2 Mult: Mult 16, umgekehrt 12', () => {
    // Basis Mult 4: Flush aus fünf Herz Karten
    const plus = { scored: { mult: 4 } };
    const times = { scored: { xMult: 2 } };
    const a = score({ played: [c('2H', [plus]), c('4H', [times]), c('6H'), c('8H'), c('10H')] });
    const b = score({ played: [c('2H', [times]), c('4H', [plus]), c('6H'), c('8H'), c('10H')] });
    expect(a.mult).toBe(16);
    expect(b.mult).toBe(12);
  });

  it('C4: gehaltene Karte mit X1.5 Mult, Pair 9 9: 28 mal 3 = 84', () => {
    const r = score({ played: cs('9S 9H'), held: [c('4D', [{ held: { xMult: 1.5 } }])] });
    expect(r.total).toBe(84);
  });

  it('C5: Pair A A, links +4 Mult, rechts X1.5: 288, vertauscht 224', () => {
    const plus = { scored: { mult: 4 } };
    const times = { scored: { xMult: 1.5 } };
    expect(score({ played: [c('AS', [plus]), c('AH', [times])] }).total).toBe(288);
    expect(score({ played: [c('AS', [times]), c('AH', [plus])] }).total).toBe(224);
  });

  it('C6: Joker gibt der ersten gewerteten Face Card X2: Pair K K ergibt 120', () => {
    const firstFace: TestJoker = {
      phase: 'scored',
      calc: (ctx) => (ctx.card && ctx.scoring.find((x) => isFace(x.rank)) === ctx.card ? { xMult: 2 } : undefined),
    };
    expect(score({ played: cs('KS KH'), jokers: [firstFace] }).total).toBe(120);
  });

  const kingHeld: TestJoker = { phase: 'held', calc: (ctx) => (ctx.card?.rank === 13 ? { xMult: 1.5 } : undefined) };

  it('C7: Joker X1.5 pro gehaltenem King, zwei Kings gehalten, Pair 9 9: 126', () => {
    expect(score({ played: cs('9S 9H'), held: cs('KD KC'), jokers: [kingHeld] }).total).toBe(126);
  });

  it('C8: wie C7 plus Retrigger aller Held Effekte: Rohwert 283.5, abgerundet 283', () => {
    const heldRetrigger: TestJoker = { phase: 'retrigger', calc: (ctx) => (ctx.held.includes(ctx.card!) ? 1 : 0) };
    expect(score({ played: cs('9S 9H'), held: cs('KD KC'), jokers: [kingHeld, heldRetrigger] }).total).toBe(283);
  });
});

describe('Block C: Retrigger', () => {
  const lowRetrigger: TestJoker = { phase: 'retrigger', calc: (ctx) => (ctx.card && ctx.card.rank <= 5 && ctx.scoring.includes(ctx.card) ? 1 : 0) };

  it('C9: Retrigger für 2 bis 5, Pair 2 2: Chips 18, Score 36', () => {
    expect(score({ played: cs('2S 2H'), jokers: [lowRetrigger] }).total).toBe(36);
  });

  it('C10: wie C9, eine 2 hat zusätzlich einen Karten Retrigger: Retrigger addieren sich, Score 40', () => {
    const r = score({ played: [c('2S', [{ retrigger: 1 }]), c('2H')], jokers: [lowRetrigger] });
    expect(r.total).toBe(40);
  });

  it('C11: erste Scoring Card zwei weitere Male, Pair 9 9: Chips 46, Score 92', () => {
    const first: TestJoker = { phase: 'retrigger', calc: (ctx) => (ctx.index === 0 ? 2 : 0) };
    expect(score({ played: cs('9S 9H'), jokers: [first] }).total).toBe(92);
  });

  it('C12: alle Karten in der letzten Hand doppelt, Pair 9 9: Score 92', () => {
    const last: TestJoker = { phase: 'retrigger', calc: (ctx) => (ctx.handsLeft === 0 && ctx.scoring.includes(ctx.card!) ? 1 : 0) };
    expect(score({ played: cs('9S 9H'), jokers: [last], handsLeft: 0 }).total).toBe(92);
    expect(score({ played: cs('9S 9H'), jokers: [last], handsLeft: 1 }).total).toBe(56);
  });

  it('C13: Balance Regel, chips 100 und mult 10 werden 55 und 55, Score 3025', () => {
    // Straight Flush Level 1 (100 x 8) ohne Kartenchips gibt es nicht, daher: Basis über Joker herstellen
    const r = score({
      played: cs('2S'),
      jokers: [{ phase: 'main', calc: () => ({ chips: 100 - 7, mult: 9 }) }],
      balance: true,
    });
    expect(r.chips).toBe(55);
    expect(r.mult).toBe(55);
    expect(r.total).toBe(3025);
  });

  it('C16: Geld Modifikator wird bei jedem Retrigger erneut ausgelöst: 2 mal 3 Dollar', () => {
    const r = score({ played: [c('2S', [{ scored: { money: 3 } }])], jokers: [lowRetrigger] });
    expect(r.money).toBe(6);
  });
});
