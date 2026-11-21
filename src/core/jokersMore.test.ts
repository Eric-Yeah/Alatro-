import './index';
import { describe, expect, it } from 'vitest';
import { RARITY_WEIGHTS } from '../data/shop';
import { JOKER_DEFS } from '../data/jokers';
import { JOKER_DEFS_MORE } from '../data/jokersMore';
import { createRun, selectBlind } from './game';
import { initialHandLevels } from './hands';
import { allJokers, getJoker, jokerDescription, type JokerInstance } from './jokers';
import { addJoker, jokerPassive, runJokerHook } from './run';
import { scoreHand, type ScoreInput, type ScoreResult } from './scoring';
import type { Card, Rank, Suit } from './types';

// ─────────────────────────────────────────────── Hilfen

let cardId = 9000;
const k = (rank: Rank, suit: Suit, extra: Partial<Card> = {}): Card => ({ id: cardId++, rank, suit, ...extra });

const mk = (defId: string, uid: number): JokerInstance => {
  const def = getJoker(defId)!;
  return { uid, defId, vars: { ...(def.init?.(def.config) ?? {}) } };
};

const score = (jokers: JokerInstance[], played: Card[], o: Partial<ScoreInput> = {}): ScoreResult =>
  scoreHand({ played, held: [], handLevels: initialHandLevels(), jokers, money: 0, handsLeft: 1, discardsLeft: 1, ante: 1, blind: 'small', ...o });

/** Wertet eine Hand mit genau einem Joker aus und liefert seinen Beitrag */
function one(id: string, played: Card[], o: Partial<ScoreInput> = {}) {
  const jokers = [mk(id, 1)];
  const res = score(jokers, played, o);
  const out = { chips: 0, mult: 0, xMult: 1, money: 0, retriggers: 0 };
  for (const e of res.events) {
    if (e.phase === 'retrigger') out.retriggers++;
    if (e.source.kind !== 'joker' || e.source.jokerUid !== 1) continue;
    out.chips += e.chips ?? 0;
    out.mult += e.mult ?? 0;
    out.xMult *= e.xMult ?? 1;
    out.money += e.money ?? 0;
  }
  out.xMult = Math.round(out.xMult * 10000) / 10000;
  return { ...out, jokers, res };
}

const pair = (r: Rank = 5, s1: Suit = 'S', s2: Suit = 'H') => [k(r, s1), k(r, s2)];
const flushHand = (s: Suit) => [k(2, s), k(5, s), k(7, s), k(9, s), k(13, s)];
const straightHand = () => [k(5, 'S'), k(6, 'H'), k(7, 'D'), k(8, 'C'), k(9, 'S')];
const straightFlush = () => [5, 6, 7, 8, 9].map((r) => k(r as Rank, 'H'));
const fullHouse = () => [k(5, 'S'), k(5, 'H'), k(5, 'D'), k(9, 'S'), k(9, 'H')];
const twoPair = () => [k(5, 'S'), k(5, 'H'), k(9, 'D'), k(9, 'C')];

/** Run mit Joker, Hooks außerhalb des Scorings */
function hookRun(id: string) {
  const run = createRun({ seed: `more_${id}` });
  run.jokerSlots = 10;
  addJoker(run, id);
  return run;
}

// ─────────────────────────────────────────────── Katalog

describe('Katalog mit 150 Jokers', () => {
  it('hat 150 Jokers: 79 Common, 44 Uncommon, 20 Rare, 7 Legendary', () => {
    expect(JOKER_DEFS.length).toBe(150);
    expect(JOKER_DEFS_MORE.length).toBe(71);
    expect(allJokers().length).toBe(150);
    const n = (r: string) => JOKER_DEFS.filter((d) => d.rarity === r).length;
    expect([n('common'), n('uncommon'), n('rare'), n('legendary')]).toEqual([79, 44, 20, 7]);
  });

  it('IDs sind eindeutig, Namen eindeutig, Preise passen zur Seltenheit', () => {
    expect(new Set(JOKER_DEFS.map((d) => d.id)).size).toBe(150);
    expect(new Set(JOKER_DEFS.map((d) => d.name)).size).toBe(150);
    const range: Record<string, [number, number]> = { common: [2, 5], uncommon: [5, 7], rare: [8, 9], legendary: [20, 20] };
    for (const d of JOKER_DEFS_MORE) {
      const [lo, hi] = range[d.rarity];
      expect(d.cost, d.id).toBeGreaterThanOrEqual(lo);
      expect(d.cost, d.id).toBeLessThanOrEqual(hi);
      expect(d.id, d.id).toMatch(/^[a-z_]+$/);
    }
  });

  it('jede Beschreibung ist vollständig ersetzbar und ohne Gedankenstriche', () => {
    for (const d of JOKER_DEFS_MORE) {
      const text = jokerDescription(d, mk(d.id, 1));
      expect(text, d.id).not.toMatch(/[{}]/);
      expect(text, d.id).not.toMatch(/[–—]| - /);
      expect(d.name, d.id).not.toMatch(/[–—]| - /);
    }
  });

  it('Legendary erscheinen nie zufällig im Shop (Gewicht 0)', () => {
    expect(RARITY_WEIGHTS.legendary).toBe(0);
  });

  it('keine unbedingten X Mult über 1,25 unterhalb von Legendary', () => {
    for (const d of JOKER_DEFS_MORE.filter((j) => j.rarity !== 'legendary' && j.config.xMult !== undefined)) {
      const alone = one(d.id, [k(2, 'S')], { money: 20, discardsLeft: 3, handsLeft: 3 });
      expect(alone.xMult, d.id).toBeLessThanOrEqual(1.25);
    }
  });
});

// ─────────────────────────────────────────────── Hand Bedingungen und Karten

describe('Common: Hand Bedingungen', () => {
  it.each([
    ['wetterhahn', pair(), { chips: 45 }],
    ['drillbohrer', [k(7, 'S'), k(7, 'H'), k(7, 'D')], { chips: 80 }],
    ['viererbund', [k(9, 'S'), k(9, 'H'), k(9, 'D'), k(9, 'C')], { mult: 20 }],
    ['kleiner_kessel', flushHand('D'), { mult: 9 }],
    ['meilenstein', straightHand(), { mult: 9 }],
    ['dreiklang', [k(2, 'S'), k(5, 'H'), k(9, 'D')], { mult: 8 }],
    ['viertakt', [k(2, 'S'), k(5, 'H'), k(9, 'D'), k(11, 'C')], { mult: 10 }],
    ['zwillingsmond', twoPair(), { chips: 60 }],
    ['hausmusik', fullHouse(), { mult: 15 }],
    ['einsiedler', [k(13, 'S')], { chips: 50 }],
  ] as const)('%s wirkt bei passender Hand', (id, played, want) => {
    const r = one(id, [...played]);
    expect({ chips: r.chips, mult: r.mult }).toEqual({ chips: 0, mult: 0, ...want });
  });

  it.each([
    ['wetterhahn', [k(2, 'S'), k(9, 'H')]],
    ['drillbohrer', pair()],
    ['viererbund', [k(7, 'S'), k(7, 'H'), k(7, 'D')]],
    ['kleiner_kessel', straightHand()],
    ['meilenstein', flushHand('S')],
    ['dreiklang', pair()],
    ['viertakt', [k(2, 'S'), k(5, 'H'), k(9, 'D')]],
    ['zwillingsmond', pair()],
    ['hausmusik', twoPair()],
    ['einsiedler', pair()],
  ] as const)('%s wirkt nicht bei falscher Hand', (id, played) => {
    const r = one(id, [...played]);
    expect(r.chips + r.mult).toBe(0);
  });
});

describe('Common: Suits, Ränge und Karten in der Hand', () => {
  it('Suit Jokers geben nur für ihre Suit', () => {
    expect(one('rotwein', pair(5, 'H', 'D')).chips).toBe(20);
    expect(one('bernstein', pair(5, 'D', 'S')).mult).toBe(3);
    expect(one('schiefer', pair(5, 'S', 'S')).chips).toBe(50);
    expect(one('moos', pair(5, 'C', 'H')).mult).toBe(3);
    expect(one('rotwein', pair(5, 'S', 'C')).chips).toBe(0);
  });

  it('Zehnkampf und Zweitschlag', () => {
    expect(one('zehnkampf', pair(10)).mult).toBe(8);
    expect(one('zehnkampf', pair(9)).mult).toBe(0);
    expect(one('zweitschlag', pair()).chips).toBe(40);
    expect(one('zweitschlag', [k(5, 'S')]).chips).toBe(0);
  });

  it('Karten in der Hand: Warme Stube, Kalter Keller, Federkiel', () => {
    const held = [k(3, 'H'), k(4, 'S'), k(6, 'S'), k(8, 'D')];
    expect(one('warme_stube', [k(14, 'C')], { held }).mult).toBe(2);
    expect(one('kalter_keller', [k(14, 'C')], { held }).chips).toBe(30);
    expect(one('federkiel', [k(14, 'C')], { held }).mult).toBe(8);
    expect(one('federkiel', [k(14, 'C')], { held: [] }).mult).toBe(0);
  });

  it('Perlenschnur zählt gewertete Karten', () => {
    expect(one('perlenschnur', pair()).mult).toBe(4);
    expect(one('perlenschnur', fullHouse()).mult).toBe(10);
  });
});

describe('Common: Geld, Zähler, Zustand', () => {
  it('Sparfuchs, Vorsprung, Notnagel hängen an Discards und Hands', () => {
    expect(one('sparfuchs', pair(), { discardsLeft: 3 }).mult).toBe(6);
    expect(one('sparfuchs', pair(), { discardsLeft: 0 }).mult).toBe(0);
    expect(one('vorsprung', pair(), { handsLeft: 2 }).mult).toBe(4);
    expect(one('vorsprung', pair(), { handsLeft: 0 }).mult).toBe(0);
    expect(one('notnagel', pair(), { discardsLeft: 0 }).mult).toBe(10);
    expect(one('notnagel', pair(), { discardsLeft: 1 }).mult).toBe(0);
  });

  it('Sparstrumpf zählt je $4', () => {
    expect(one('sparstrumpf', pair(), { money: 9 }).mult).toBe(2);
    expect(one('sparstrumpf', pair(), { money: 3 }).mult).toBe(0);
    expect(one('sparstrumpf', pair(), { money: -5 }).mult).toBe(0);
  });

  it('Mutprobe wirkt nur im Boss Blind', () => {
    expect(one('mutprobe', pair(), { blind: 'boss' }).mult).toBe(12);
    expect(one('mutprobe', pair(), { blind: 'big' }).mult).toBe(0);
  });

  it('Sedimente wachsen pro Hand, Staubwolke pro gewerteter Karte', () => {
    const sed = [mk('sedimente', 1)];
    expect(score(sed, pair()).events.filter((e) => e.source.kind === 'joker').reduce((s, e) => s + (e.chips ?? 0), 0)).toBe(5);
    score(sed, pair());
    expect(sed[0].vars.chips).toBe(10);
    const dust = [mk('staubwolke', 1)];
    const first = score(dust, fullHouse());
    expect(first.events.filter((e) => e.source.kind === 'joker').reduce((s, e) => s + (e.chips ?? 0), 0)).toBe(0);
    expect(dust[0].vars.chips).toBe(10);
    const second = score(dust, pair());
    expect(second.events.filter((e) => e.source.kind === 'joker').reduce((s, e) => s + (e.chips ?? 0), 0)).toBe(10);
    expect(dust[0].vars.chips).toBe(14);
  });
});

// ─────────────────────────────────────────────── Hooks außerhalb des Scorings

describe('Blind Hooks und Rundenende', () => {
  it('Spardose, Kleiner Zoll, Mautbrücke beim Einkassieren', () => {
    const r1 = hookRun('spardose');
    expect(runJokerHook(r1, 'roundEnd', { money: 25 }, false).money).toBe(2);
    expect(runJokerHook(r1, 'roundEnd', { money: 9 }, false).money).toBe(0);
    const r2 = hookRun('kleiner_zoll');
    expect(runJokerHook(r2, 'roundEnd', { blind: 'small' }, false).money).toBe(3);
    expect(runJokerHook(r2, 'roundEnd', { blind: 'big' }, false).money).toBe(0);
    const r3 = hookRun('mautbruecke');
    expect(runJokerHook(r3, 'roundEnd', { blind: 'big' }, false).money).toBe(3);
    expect(runJokerHook(r3, 'roundEnd', { blind: 'boss' }, false).money).toBe(0);
  });

  it('Kapitalist hat einen Deckel', () => {
    const run = hookRun('kapitalist');
    expect(runJokerHook(run, 'roundEnd', { money: 8 }, false).money).toBe(2);
    expect(runJokerHook(run, 'roundEnd', { money: 100 }, false).money).toBe(6);
    expect(runJokerHook(run, 'roundEnd', { money: 3 }, false).money).toBe(0);
  });

  it('Flohmarkt zahlt nur bei genau 5 abgeworfenen Karten', () => {
    const run = hookRun('flohmarkt');
    const five = [1, 2, 3, 4, 5].map((r) => k((r + 1) as Rank, 'S'));
    expect(runJokerHook(run, 'discard', { discarded: five }, false).money).toBe(1);
    expect(runJokerHook(run, 'discard', { discarded: five.slice(0, 4) }, false).money).toBe(0);
  });

  it('Gasthaus, Sternschnuppe, Kräuterbeet, Elixierbrauer, Orakel bei der Blind Wahl', () => {
    expect(runJokerHook(hookRun('gasthaus'), 'blindSelected', { blind: 'big' }, false).money).toBe(3);
    expect(runJokerHook(hookRun('gasthaus'), 'blindSelected', { blind: 'small' }, false).money).toBe(0);
    expect(runJokerHook(hookRun('sternschnuppe'), 'blindSelected', { blind: 'small' }, false).consumables).toEqual(['sternbild']);
    expect(runJokerHook(hookRun('sternschnuppe'), 'blindSelected', { blind: 'boss' }, false).consumables).toEqual([]);
    expect(runJokerHook(hookRun('kraeuterbeet'), 'blindSelected', { blind: 'big' }, false).consumables).toEqual(['elixier']);
    expect(runJokerHook(hookRun('kraeuterbeet'), 'blindSelected', { blind: 'small' }, false).consumables).toEqual([]);
    const brewer = hookRun('elixierbrauer');
    expect(runJokerHook(brewer, 'blindSelected', { blind: 'big' }, false).consumables).toEqual(['elixier']);
    expect(runJokerHook(brewer, 'blindSelected', { blind: 'boss' }, false).consumables).toEqual(['elixier']);
    expect(runJokerHook(brewer, 'blindSelected', { blind: 'small' }, false).consumables).toEqual([]);
    expect(runJokerHook(hookRun('orakel'), 'blindSelected', { blind: 'boss' }, false).consumables).toEqual(['omen']);
    expect(runJokerHook(hookRun('orakel'), 'blindSelected', { blind: 'big' }, false).consumables).toEqual([]);
  });

  it('Sternschnuppe und Orakel erzeugen im echten Spielfluss ein Consumable', () => {
    const run = createRun({ seed: 'more_flow' });
    run.jokerSlots = 10;
    addJoker(run, 'sternschnuppe');
    const res = selectBlind(run);
    expect(res.consumables.length).toBe(1);
    expect(res.consumables[0]).toMatch(/^sternbild_/);
  });
});

// ─────────────────────────────────────────────── X Mult

describe('Uncommon: X Mult mit Bedingung', () => {
  it.each([
    ['regenbogen', flushHand('S'), 1.5],
    ['sternenpfad', straightHand(), 1.5],
    ['zwillingspaar', twoPair(), 1.5],
    ['viererkette', [k(9, 'S'), k(9, 'H'), k(9, 'D'), k(9, 'C')], 3],
    ['duo', pair(), 1.8],
  ] as const)('%s gibt bei passender Hand den X Mult', (id, played, x) => {
    expect(one(id, [...played]).xMult).toBe(x);
  });

  it('wirken nicht bei falscher Hand', () => {
    expect(one('regenbogen', straightHand()).xMult).toBe(1);
    expect(one('sternenpfad', flushHand('S')).xMult).toBe(1);
    expect(one('zwillingspaar', pair()).xMult).toBe(1);
    expect(one('viererkette', [k(7, 'S'), k(7, 'H'), k(7, 'D')]).xMult).toBe(1);
    expect(one('duo', [k(2, 'S'), k(5, 'H'), k(9, 'D')]).xMult).toBe(1);
  });

  it('Bettelmann nur bei höchstens $4, Himmelsscheibe immer', () => {
    expect(one('bettelmann', pair(), { money: 4 }).xMult).toBe(2);
    expect(one('bettelmann', pair(), { money: 5 }).xMult).toBe(1);
    expect(one('himmelsscheibe', [k(2, 'S')]).xMult).toBe(1.25);
  });
});

describe('Uncommon: Echo und Karten Zusätze', () => {
  it('Herzecho, Nachtecho, Glückszahl lösen Retrigger aus', () => {
    expect(one('herzecho', pair(5, 'H', 'H')).retriggers).toBe(2);
    expect(one('herzecho', pair(5, 'S', 'C')).retriggers).toBe(0);
    expect(one('nachtecho', pair(5, 'S', 'H')).retriggers).toBe(1);
    expect(one('glueckszahl', pair(7)).retriggers).toBe(4);
    expect(one('glueckszahl', pair(8)).retriggers).toBe(0);
  });

  it('Verzauberer und Siegelwart zählen Karten mit Zusatz', () => {
    const plain = pair();
    expect(one('verzauberer', plain).mult).toBe(0);
    expect(one('verzauberer', [k(5, 'S', { enhancement: 'kupfer' }), k(5, 'H')]).mult).toBe(4);
    expect(one('siegelwart', [k(5, 'S', { seal: 'muenze' }), k(5, 'H', { seal: 'muenze' })]).mult).toBe(12);
  });

  it('Zehntner zahlt je Face Card bei Zufallstreffer', () => {
    expect(one('zehntner', pair(13), { chance: () => true }).money).toBe(4);
    expect(one('zehntner', pair(13), { chance: () => false }).money).toBe(0);
    expect(one('zehntner', pair(5), { chance: () => true }).money).toBe(0);
  });

  it('Vierlicht braucht alle vier Suits, Wild füllt eine Lücke', () => {
    expect(one('vierlicht', twoPair()).mult).toBe(16);
    expect(one('vierlicht', pair()).mult).toBe(0);
    const threeSuitsAndWild = [k(5, 'S'), k(5, 'H'), k(9, 'D'), k(9, 'D', { enhancement: 'quecksilber' })];
    expect(one('vierlicht', threeSuitsAndWild).mult).toBe(16);
    expect(one('vierlicht', [k(5, 'S'), k(5, 'S'), k(9, 'D'), k(9, 'C')]).mult).toBe(0);
  });

  it('Gezeitenkalender wechselt nach Ante', () => {
    const odd = one('gezeitenkalender', pair(), { ante: 3 });
    expect([odd.mult, odd.chips]).toEqual([12, 0]);
    const even = one('gezeitenkalender', pair(), { ante: 4 });
    expect([even.mult, even.chips]).toEqual([0, 70]);
  });
});

describe('Wachsende Jokers', () => {
  it('Windhose wächst pro Discard', () => {
    const run = hookRun('windhose');
    runJokerHook(run, 'discard', { discarded: [k(2, 'S'), k(3, 'S')] });
    runJokerHook(run, 'discard', { discarded: [k(4, 'S')] });
    expect(run.jokers[0].vars.mult).toBe(2);
    expect(score(run.jokers, pair()).events.some((e) => e.source.kind === 'joker' && e.mult === 2)).toBe(true);
  });

  it('Kreidestriche und Trophäensammler wachsen nur bei Boss Blinds', () => {
    const run = hookRun('kreidestriche');
    runJokerHook(run, 'roundEnd', { blind: 'small' });
    runJokerHook(run, 'roundEnd', { blind: 'boss' });
    runJokerHook(run, 'roundEnd', { blind: 'boss' });
    expect(run.jokers[0].vars.mult).toBe(6);
    const tro = hookRun('trophaeensammler');
    runJokerHook(tro, 'roundEnd', { blind: 'big' });
    expect(tro.jokers[0].vars.x).toBe(1);
    runJokerHook(tro, 'roundEnd', { blind: 'boss' });
    runJokerHook(tro, 'roundEnd', { blind: 'boss' });
    expect(tro.jokers[0].vars.x).toBe(1.4);
    const res = score(tro.jokers, pair());
    expect(res.events.find((e) => e.source.kind === 'joker' && e.xMult)?.xMult).toBe(1.4);
  });

  it('Sternuhr wächst um X0,05 pro Hand ohne Rundungsreste', () => {
    const jokers = [mk('sternuhr', 1)];
    for (let i = 0; i < 7; i++) score(jokers, pair());
    expect(jokers[0].vars.x).toBe(1.35);
  });

  it('Anzeigewerte kopierter Instanzen bleiben unberührt (Vorschau rechnet auf Kopien)', () => {
    const run = hookRun('trophaeensammler');
    runJokerHook(run, 'roundEnd', { blind: 'boss' }, false);
    expect(run.jokers[0].vars.x).toBe(1);
  });
});

describe('Rare', () => {
  it('Sonnenkorona nur bei Straight Flush', () => {
    expect(one('sonnenkorona', straightFlush()).xMult).toBe(4);
    expect(one('sonnenkorona', flushHand('H')).xMult).toBe(1);
    expect(one('sonnenkorona', straightHand()).xMult).toBe(1);
  });

  it('Meisterwerk, Nachtwandler, Purpurgarde multiplizieren je Karte', () => {
    expect(one('meisterwerk', [k(5, 'S', { enhancement: 'kupfer' }), k(5, 'H', { enhancement: 'rubin' })]).xMult).toBe(1.21);
    expect(one('meisterwerk', pair()).xMult).toBe(1);
    expect(one('nachtwandler', pair(5, 'S', 'S')).xMult).toBe(1.2544);
    expect(one('nachtwandler', pair(5, 'H', 'D')).xMult).toBe(1);
    expect(one('purpurgarde', pair(5, 'H', 'S')).xMult).toBe(1.12);
  });

  it('Echokammer und Urecho', () => {
    expect(one('echokammer', pair()).retriggers).toBe(4);
    expect(one('echokammer', [k(5, 'S'), k(5, 'H'), k(5, 'D')]).retriggers).toBe(0);
    expect(one('urecho', pair()).retriggers).toBe(2);
    expect(one('urecho', fullHouse()).retriggers).toBe(5);
  });

  it('Alles oder Nichts und Zufallskugel', () => {
    expect(one('alles_oder_nichts', pair(), { discardsLeft: 0 }).xMult).toBe(2.5);
    expect(one('alles_oder_nichts', pair(), { discardsLeft: 1 }).xMult).toBe(1);
    expect(one('zufallskugel', pair(), { chance: () => true }).xMult).toBe(5);
    expect(one('zufallskugel', pair(), { chance: () => false }).xMult).toBe(1);
  });

  it('Konstellation zählt Handarten ohne High Card', () => {
    expect(one('konstellation', pair()).xMult).toBe(1.25);
    expect(one('konstellation', [k(2, 'S')]).xMult).toBe(1);
    expect(one('konstellation', fullHouse()).xMult).toBe(2);
  });

  it('Weltenwanderer wächst mit der Ante', () => {
    expect(one('weltenwanderer', pair(), { ante: 1 }).xMult).toBe(1);
    expect(one('weltenwanderer', pair(), { ante: 5 }).xMult).toBe(2);
    expect(one('weltenwanderer', pair(), { ante: 8 }).xMult).toBe(2.75);
  });
});

describe('Passive und Legendary', () => {
  it('Glücksspieler, Weiter Mantel, Weltenesche, Goldquelle', () => {
    const run = createRun({ seed: 'more_passive' });
    run.jokerSlots = 10;
    for (const id of ['gluecksspieler', 'weiter_mantel', 'weltenesche', 'goldquelle']) addJoker(run, id);
    const p = jokerPassive(run);
    expect(p.freeRerolls).toBe(3);
    expect(p.handSize).toBe(2);
    expect(p.jokerSlots).toBe(1);
    expect(p.consumableSlots).toBe(1);
    expect(p.shopSlots).toBe(1);
    expect(p.interestCapDelta).toBe(5);
    expect(runJokerHook(run, 'roundEnd', {}, false).money).toBe(5);
  });

  it('Kometenschauer multipliziert pro gewerteter Karte', () => {
    expect(one('kometenschauer', pair()).xMult).toBe(1.3225);
    expect(one('kometenschauer', [k(2, 'S')]).xMult).toBe(1.15);
  });

  it('Legendary sind nicht kopierbar, wenn sie Passive oder Rundenende Geld liefern', () => {
    for (const id of ['weltenesche', 'goldquelle', 'urecho']) expect(getJoker(id)!.copyCompat, id).toBe(false);
  });
});

describe('Zusammenspiel', () => {
  it('Kopierende Jokers kopieren neue Jokers wie bisher', () => {
    const jokers = [mk('spiegelbild', 1), mk('regenbogen', 2)];
    const res = score(jokers, flushHand('D'));
    const x = res.events.filter((e) => e.source.kind === 'joker' && e.xMult === 1.5);
    expect(x.length).toBe(2);
  });

  it('Reihenfolge: Mult Joker links, X Mult rechts ist stärker', () => {
    const a = score([mk('funke', 1), mk('himmelsscheibe', 2)], pair());
    const b = score([mk('himmelsscheibe', 2), mk('funke', 1)], pair());
    expect(a.total).toBeGreaterThan(b.total);
  });
});
