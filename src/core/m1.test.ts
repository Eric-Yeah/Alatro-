import './index';
import { describe, expect, it } from 'vitest';
import { migrateRun } from '../save';
import { blindReward, isShowdown } from './blinds';
import { detectHand } from './handEval';
import { getJoker, jokerDescription, registerJokers, unregisterJoker } from './jokers';
import { RngStreams, normalizeSeed } from './rng';
import { newRun, playCards, startRound } from './run';
import { scoreHand } from './scoring';
import { initialHandLevels } from './hands';
import type { Card, Rank, Suit } from './types';

let id = 50_000;
const card = (rank: number, suit: Suit, extra: Partial<Card> = {}): Card => ({ id: id++, rank: rank as Rank, suit, ...extra });
const base = { held: [], handLevels: initialHandLevels(), jokers: [], money: 0, handsLeft: 2, discardsLeft: 2 };

describe('Modifikatoren aus data/modifiers.ts', () => {
  it('Kupfer, Rubin und Prisma wirken in der Reihenfolge Rang, Enhancement, Seal, Edition', () => {
    const r = scoreHand({ ...base, played: [card(9, 'S', { enhancement: 'kupfer' }), card(9, 'H', { enhancement: 'rubin', edition: 'prisma' })] });
    // Pair: 10 Chips, 2 Mult. Karte 1: +9 +25. Karte 2: +9, +5 Mult, X1.5
    expect(r.chips).toBe(10 + 9 + 25 + 9);
    expect(r.mult).toBe((2 + 5) * 1.5);
  });

  it('Kristall zerspringt, wenn die Chance trifft, und verschwindet aus dem Deck', () => {
    const r = scoreHand({ ...base, played: [card(5, 'S', { enhancement: 'kristall' })], chance: () => true });
    expect(r.destroyed).toHaveLength(1);
    expect(r.mult).toBeCloseTo(1.75);
  });

  it('Eisen wirkt nur in der Hand', () => {
    const played = [card(9, 'S'), card(9, 'H')];
    expect(scoreHand({ ...base, played, held: [card(2, 'D', { enhancement: 'eisen' })] }).mult).toBeCloseTo(2 * 1.4);
    expect(scoreHand({ ...base, played: [...played, card(2, 'D', { enhancement: 'eisen' })] }).mult).toBe(2);
  });

  it('Quecksilber zählt für den Flush als jede Suit', () => {
    const cards = [card(2, 'H'), card(5, 'H'), card(8, 'H'), card(11, 'H'), card(13, 'S', { enhancement: 'quecksilber' })];
    expect(detectHand(cards).type).toBe('flush');
  });

  it('Echo Seal wertet die Karte zweimal, Münz Seal zahlt bei jeder Auswertung', () => {
    const r = scoreHand({ ...base, played: [card(7, 'S', { seal: 'echo', enhancement: 'gold' })] });
    expect(r.chips).toBe(5 + 7 + 7);
    expect(r.money).toBe(4);
  });

  it('debuffte Karten zählen für die Erkennung, liefern aber nichts', () => {
    const r = scoreHand({ ...base, played: [card(9, 'S', { debuffed: true }), card(9, 'H')] });
    expect(r.handType).toBe('pair');
    expect(r.chips).toBe(10 + 9);
  });

  it('Joker Edition: additive Teile vor, X Mult nach dem Joker Effekt', () => {
    const x2 = { id: '__x2', name: 'x2', rarity: 'common' as const, cost: 1, config: {}, description: '', copyCompat: true, calculate: (ctx: { phase: string }) => (ctx.phase === 'main' ? { xMult: 2 } : undefined) };
    registerJokers([x2]);
    const aura = scoreHand({ ...base, played: [card(14, 'S')], jokers: [{ uid: 1, defId: '__x2', vars: {}, edition: 'aura' }] });
    unregisterJoker('__x2');
    // Mult 1, Aura +8 = 9, dann Joker X2 = 18
    expect(aura.mult).toBe(18);
  });
});

describe('Boss Modifikatoren und Regeln', () => {
  it('nullify: die Hand scort 0', () => {
    expect(scoreHand({ ...base, played: [card(14, 'S')], boss: { nullify: true } }).total).toBe(0);
  });

  it('Showdown Belohnung 8 bei Ante 8 und 16', () => {
    expect(isShowdown(8)).toBe(true);
    expect(blindReward(8, 'boss')).toBe(8);
    expect(blindReward(16, 'boss')).toBe(8);
    expect(blindReward(7, 'boss')).toBe(5);
  });
});

describe('Jokers als Daten', () => {
  it('Beschreibung setzt config und vars ein', () => {
    const def = getJoker('schneeball')!;
    expect(jokerDescription(def, { uid: 1, defId: 'schneeball', vars: { mult: 3 } })).toContain('+1 Mult');
    expect(jokerDescription(def, { uid: 1, defId: 'schneeball', vars: { mult: 3 } })).toContain('+3 Mult');
  });

  it('Schneeball wächst in der Before Phase', () => {
    const inst = { uid: 1, defId: 'schneeball', vars: {} as Record<string, number> };
    scoreHand({ ...base, played: [card(2, 'S')], jokers: [inst] });
    const r = scoreHand({ ...base, played: [card(2, 'S')], jokers: [inst] });
    expect(inst.vars.mult).toBe(2);
    expect(r.mult).toBe(1 + 2);
  });
});

describe('Zufall und Seeds', () => {
  it('Ströme sind serialisierbar und setzen an derselben Stelle fort', () => {
    const a = RngStreams.create('ABC');
    a.next('x');
    const copy = new RngStreams(JSON.parse(JSON.stringify(a.data)));
    expect(copy.next('x')).toBe(a.next('x'));
  });

  it('Seed Eingabe wird normalisiert, O gilt als 0', () => {
    expect(normalizeSeed('abc-o12 xyz9')).toBe('ABC012XY');
  });

  it('gleicher Seed, gleicher Spielzug, gleiches Ergebnis', () => {
    const play = () => {
      const run = newRun('DETERMIN');
      startRound(run);
      return playCards(run, run.round!.hand.slice(0, 5).map((c) => c.id)).total;
    };
    expect(play()).toBe(play());
  });
});

describe('Spielstand Migration', () => {
  it('Version 1 wird über Version 2 und 3 zu Version 4 migriert', () => {
    const v1 = { seed: 'OLDSAVE1', rngState: 123, ante: 2, blindIndex: 1, money: 7, handLevels: initialHandLevels(), jokers: [], deck: [], round: null };
    const run = migrateRun(v1)!;
    expect(run.version).toBe(4);
    expect(run.consumables).toEqual([]);
    expect(run.rules.typeWeights.joker).toBeGreaterThan(0);
    expect(run.phase).toBe('blindSelect');
    expect(run.anteBoss).toBeTruthy();
    expect(run.rules.interestCap).toBe(5);
    expect(run.rng.seed).toBe('OLDSAVE1');
    expect(run.handsPlayed.pair).toBe(0);
  });
});
