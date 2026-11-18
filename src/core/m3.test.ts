import './index';
import { describe, expect, it } from 'vitest';
import { ENHANCEMENTS } from '../data/modifiers';
import { applyConsumable, canUseConsumable, addConsumable } from './consumables';
import {
  afterHand, buyCard, cashOut, createRun, discardHand, leaveShop, playHand, rerollCost, reroll, selectBlind, sellJoker,
} from './game';
import { rollJoker } from './generate';
import { initialHandLevels } from './hands';
import { allJokers, getJoker, jokerDescription, type JokerInstance } from './jokers';
import {
  addJoker, computeEarnings, effectiveProbMult, jokerCapacity, jokerPassive, rngOf, type RunState,
} from './run';
import { consumableCapacity } from './consumables';
import { scoreHand, type ScoreInput, type ScoreResult } from './scoring';
import type { Card, Rank, Suit } from './types';

// ─────────────────────────────────────────────── Hilfen

let cardId = 5000;
const k = (rank: Rank, suit: Suit, extra: Partial<Card> = {}): Card => ({ id: cardId++, rank, suit, ...extra });

const mk = (defId: string, uid: number): JokerInstance => {
  const def = getJoker(defId)!;
  return { uid, defId, vars: { ...(def.init?.(def.config) ?? {}) } };
};

/** Wertet eine Hand mit Jokers aus. Die Jokers haben die uids 1, 2, 3 in der Reihenfolge. */
function sc(ids: string[], played: Card[], o: Partial<ScoreInput> = {}): { jokers: JokerInstance[]; res: ScoreResult } {
  const jokers = ids.map((id, i) => mk(id, i + 1));
  const res = scoreHand({ played, held: [], handLevels: initialHandLevels(), jokers, money: 0, handsLeft: 1, discardsLeft: 1, ...o });
  return { jokers, res };
}

/** Summe der Beiträge eines Jokers (uid) aus dem Event Protokoll */
function contrib(res: ScoreResult, uid: number) {
  const out = { chips: 0, mult: 0, xMult: 1, money: 0, events: 0 };
  for (const e of res.events) {
    if (e.source.kind !== 'joker' || e.source.jokerUid !== uid) continue;
    out.chips += e.chips ?? 0;
    out.mult += e.mult ?? 0;
    out.xMult *= e.xMult ?? 1;
    out.money += e.money ?? 0;
    out.events++;
  }
  return out;
}

const retriggers = (res: ScoreResult) => res.events.filter((e) => e.phase === 'retrigger').length;

/** Run in einer laufenden Runde, Ziel unerreichbar */
function inRound(seed: string): RunState {
  const run = createRun({ seed });
  run.jokerSlots = 10;
  selectBlind(run);
  run.round!.target = 1e12;
  return run;
}

/** Run, in dem die Jokers vor Rundenbeginn im Besitz sind */
function runWith(seed: string, ...ids: string[]): RunState {
  const run = createRun({ seed });
  run.jokerSlots = 10;
  for (const id of ids) addJoker(run, id);
  return run;
}

function wonRound(run: RunState) {
  selectBlind(run);
  run.round!.score = run.round!.target;
  afterHand(run);
  return cashOut(run);
}

// ─────────────────────────────────────────────── Katalog

describe('Katalog', () => {
  const all = allJokers();

  it('mindestens 60 Jokers mit eindeutigen IDs', () => {
    expect(all.length).toBeGreaterThanOrEqual(60);
    expect(new Set(all.map((j) => j.id)).size).toBe(all.length);
  });

  it('die 9 ursprünglichen IDs bleiben erhalten (Spielstände)', () => {
    for (const id of ['funke', 'treppe', 'glut', 'frost', 'kleinvieh', 'einzelgaenger', 'letzte_chance', 'schneeball', 'sparschwein']) {
      expect(getJoker(id)).toBeDefined();
    }
  });

  it('Verteilung grob 60 Prozent Common, 30 Prozent Uncommon, 10 Prozent Rare, dazu Legendary', () => {
    const normal = all.filter((j) => j.rarity !== 'legendary');
    const share = (r: string) => normal.filter((j) => j.rarity === r).length / normal.length;
    expect(share('common')).toBeGreaterThan(0.5);
    expect(share('common')).toBeLessThan(0.7);
    expect(share('uncommon')).toBeGreaterThan(0.2);
    expect(share('uncommon')).toBeLessThan(0.4);
    expect(share('rare')).toBeGreaterThan(0.05);
    expect(share('rare')).toBeLessThan(0.15);
    expect(all.filter((j) => j.rarity === 'legendary').length).toBeGreaterThanOrEqual(3);
  });

  it('jeder Joker hat Kosten, eine Wirkung und eine vollständig aufgelöste Beschreibung', () => {
    for (const j of all) {
      expect(j.cost, j.id).toBeGreaterThan(0);
      expect(!!(j.calculate || j.passive || j.rules || j.copies || j.rescue), `${j.id} hat keine Wirkung`).toBe(true);
      expect(jokerDescription(j), j.id).not.toMatch(/[{}]/);
    }
  });

  it('keine Gedankenstriche in Namen und Beschreibungen', () => {
    for (const j of all) for (const t of [j.name, j.description]) expect(t, j.id).not.toMatch(/[–—]| - /);
  });

  it('Rauchtest: jeder Joker übersteht Hand, Discard, Auszahlung und Shop', () => {
    for (const def of all) {
      const run = createRun({ seed: 'SMOKE001' });
      run.jokerSlots = 10;
      addJoker(run, def.id);
      selectBlind(run);
      const hand = run.round!.hand;
      expect(() => playHand(run, [hand[0].id, hand[1].id, hand[2].id]), def.id).not.toThrow();
      afterHand(run);
      if (run.phase === 'round') {
        expect(() => discardHand(run, [run.round!.hand[0].id]), def.id).not.toThrow();
        afterHand(run);
      }
      if (run.phase === 'round') {
        run.round!.score = run.round!.target;
        afterHand(run);
      }
      expect(() => cashOut(run), def.id).not.toThrow();
      expect(run.phase).toBe('shop');
      leaveShop(run);
    }
  });
});

// ─────────────────────────────────────────────── Gruppe 1: Einfache MAIN Jokers

describe('Gruppe 1: Einfache MAIN Jokers', () => {
  const pair = () => [k(9, 'S'), k(9, 'H')];
  const twoPair = () => [k(9, 'S'), k(9, 'H'), k(5, 'C'), k(5, 'D')];
  const trips = () => [k(9, 'S'), k(9, 'H'), k(9, 'C')];
  const flush = () => [k(2, 'H'), k(5, 'H'), k(7, 'H'), k(9, 'H'), k(13, 'H')];
  const house = () => [k(9, 'S'), k(9, 'H'), k(9, 'C'), k(5, 'D'), k(5, 'S')];
  const high = () => [k(9, 'S')];

  const cases: [string, () => Card[], Partial<{ chips: number; mult: number; xMult: number }>][] = [
    ['kiesel', pair, { chips: 30 }],
    ['blasebalg', pair, { chips: 20, mult: 3 }],
    ['kerzenlicht', pair, { mult: 7 }],
    ['kerzenlicht', twoPair, { mult: 7 }],
    ['doppelflamme', twoPair, { mult: 10 }],
    ['milchglas', flush, { chips: 70 }],
    ['fuenfklang', flush, { mult: 12 }],
    ['leisetreter', high, { chips: 100 }],
    ['leisetreter', pair, { chips: 100 }],
    ['hochstapler', high, { xMult: 1.4 }],
    ['dreifuss', trips, { xMult: 2 }],
    ['dreifuss', house, { xMult: 2 }],
    ['gaestehaus', house, { xMult: 2 }],
  ];
  it.each(cases)('%s wirkt bei passender Hand', (id, hand, want) => {
    const { res } = sc([id], hand());
    const c = contrib(res, 1);
    expect(c.chips).toBe(want.chips ?? 0);
    expect(c.mult).toBe(want.mult ?? 0);
    expect(c.xMult).toBe(want.xMult ?? 1);
  });

  const misses: [string, () => Card[]][] = [
    ['kerzenlicht', high],
    ['doppelflamme', pair],
    ['milchglas', pair],
    ['fuenfklang', pair],
    ['leisetreter', trips],
    ['hochstapler', pair],
    ['dreifuss', pair],
    ['gaestehaus', trips],
  ];
  it.each(misses)('%s wirkt nicht bei unpassender Hand', (id, hand) => {
    expect(contrib(sc([id], hand()).res, 1).events).toBe(0);
  });

  it('Contains Regeln: Two Pair enthält ein Pair, Full House enthält Three of a Kind', () => {
    expect(contrib(sc(['kerzenlicht'], twoPair()).res, 1).mult).toBe(7);
    expect(contrib(sc(['dreifuss'], house()).res, 1).xMult).toBe(2);
  });
});

// ─────────────────────────────────────────────── Gruppe 2: SCORED und HELD Jokers

describe('Gruppe 2: SCORED und HELD Jokers', () => {
  it('Suit Jokers geben pro gewerteter Karte der Suit', () => {
    const hand = () => [k(9, 'H'), k(9, 'S')];
    expect(contrib(sc(['herzblut'], hand()).res, 1).mult).toBe(3);
    expect(contrib(sc(['nachtschatten'], hand()).res, 1).mult).toBe(3);
    expect(contrib(sc(['diamantstaub'], [k(9, 'D'), k(9, 'D')]).res, 1).chips).toBe(50);
    expect(contrib(sc(['efeu'], [k(4, 'C'), k(4, 'C')]).res, 1).chips).toBe(50);
    expect(contrib(sc(['herzblut'], [k(9, 'S'), k(9, 'C')]).res, 1).events).toBe(0);
  });

  it('Suit Jokers zählen Karten mit jeder Suit (Quecksilber) und keine ranglosen Karten', () => {
    const merc = k(9, 'S', { enhancement: 'quecksilber' });
    expect(contrib(sc(['herzblut'], [merc, k(9, 'C')]).res, 1).mult).toBe(3);
    const obsidian = k(9, 'H', { enhancement: 'obsidian' });
    expect(contrib(sc(['herzblut'], [obsidian]).res, 1).events).toBe(0);
  });

  it('Hofstaat: Face Cards, mit Maskenball zählt jede Karte als Face Card', () => {
    expect(contrib(sc(['hofstaat'], [k(13, 'S'), k(13, 'H')]).res, 1).mult).toBe(8);
    expect(contrib(sc(['hofstaat'], [k(9, 'S'), k(9, 'H')]).res, 1).events).toBe(0);
    expect(contrib(sc(['hofstaat', 'maskenball'], [k(9, 'S'), k(9, 'H')]).res, 1).mult).toBe(8);
  });

  it('Gerade und ungerade Ränge, Ace ist ungerade', () => {
    expect(contrib(sc(['gleichmut'], [k(8, 'S'), k(8, 'H')]).res, 1).mult).toBe(6);
    expect(contrib(sc(['gleichmut'], [k(9, 'S'), k(9, 'H')]).res, 1).events).toBe(0);
    expect(contrib(sc(['gleichmut'], [k(11, 'S'), k(11, 'H')]).res, 1).events).toBe(0);
    expect(contrib(sc(['kauz'], [k(9, 'S'), k(9, 'H')]).res, 1).chips).toBe(62);
    expect(contrib(sc(['kauz'], [k(14, 'S'), k(14, 'H')]).res, 1).chips).toBe(62);
    expect(contrib(sc(['kauz'], [k(8, 'S'), k(8, 'H')]).res, 1).events).toBe(0);
  });

  it('Adlerauge: nur Aces', () => {
    expect(contrib(sc(['adlerauge'], [k(14, 'S'), k(14, 'H')]).res, 1).chips).toBe(80);
    expect(contrib(sc(['adlerauge'], [k(13, 'S'), k(13, 'H')]).res, 1).events).toBe(0);
  });

  it('Frühaufsteher und Schlussakkord wirken nur auf die erste bzw. letzte gewertete Karte', () => {
    const hand = () => [k(9, 'S'), k(9, 'H'), k(2, 'C')];
    expect(contrib(sc(['fruehaufsteher'], hand()).res, 1).mult).toBe(8);
    expect(contrib(sc(['schlussakkord'], hand()).res, 1).chips).toBe(35);
    // eine Karte ist erste und letzte zugleich
    const one = [k(9, 'S')];
    expect(contrib(sc(['fruehaufsteher'], one).res, 1).mult).toBe(8);
    expect(contrib(sc(['schlussakkord'], one).res, 1).chips).toBe(35);
  });

  it('HELD Jokers: Karten in der Hand, nicht die gespielten', () => {
    const played = [k(9, 'S')];
    const held = [k(13, 'S'), k(12, 'H'), k(3, 'C'), k(9, 'D')];
    expect(contrib(sc(['wachposten'], played, { held }).res, 1).mult).toBe(6);
    expect(contrib(sc(['ruhekissen'], played, { held }).res, 1).chips).toBe(15);
    expect(contrib(sc(['vorrat'], played, { held }).res, 1).chips).toBe(40);
    expect(contrib(sc(['wachposten'], [k(13, 'S')], { held: [] }).res, 1).events).toBe(0);
  });

  it('Wachposten mit Maskenball: jede Karte in der Hand zählt als Face Card', () => {
    expect(contrib(sc(['wachposten', 'maskenball'], [k(9, 'S')], { held: [k(3, 'C'), k(4, 'C')] }).res, 1).mult).toBe(6);
  });
});

// ─────────────────────────────────────────────── Gruppe 3: Retrigger Jokers

describe('Gruppe 3: Retrigger Jokers', () => {
  it('Hofecho: Face Cards zählen doppelt (100 statt 60 für zwei Könige)', () => {
    expect(sc([], [k(13, 'S'), k(13, 'H')]).res.total).toBe(60);
    const { res } = sc(['hofecho'], [k(13, 'S'), k(13, 'H')]);
    expect(res.total).toBe(100);
    expect(retriggers(res)).toBe(2);
    expect(retriggers(sc(['hofecho'], [k(9, 'S'), k(9, 'H')]).res)).toBe(0);
  });

  it('Kleines Echo wiederholt niedrige Ränge', () => {
    expect(retriggers(sc(['kleines_echo'], [k(3, 'S'), k(3, 'H')]).res)).toBe(2);
    expect(retriggers(sc(['kleines_echo'], [k(9, 'S'), k(9, 'H')]).res)).toBe(0);
  });

  it('Adlerecho wiederholt Aces', () => {
    expect(retriggers(sc(['adlerecho'], [k(14, 'S'), k(14, 'H')]).res)).toBe(2);
    expect(retriggers(sc(['adlerecho'], [k(13, 'S'), k(13, 'H')]).res)).toBe(0);
  });

  it('Erstschlag: die erste Karte wird zweimal erneut ausgewertet', () => {
    const { res } = sc(['erstschlag'], [k(9, 'S'), k(9, 'H')]);
    expect(retriggers(res)).toBe(2);
    // erste Karte dreimal: 10 + 3*9 + 9 = 46 Chips, Mult 2
    expect(res.total).toBe(92);
  });

  it('Schlussecho wirkt nur bei der letzten Hand', () => {
    expect(retriggers(sc(['schlussecho'], [k(9, 'S'), k(9, 'H')], { handsLeft: 0 }).res)).toBe(2);
    expect(retriggers(sc(['schlussecho'], [k(9, 'S'), k(9, 'H')], { handsLeft: 1 }).res)).toBe(0);
  });

  it('Haltegriff wiederholt Held Effekte (Eisen zweimal: X1,96 statt X1,4)', () => {
    const held = () => [k(9, 'C', { enhancement: 'eisen' })];
    const without = sc([], [k(14, 'S')], { held: held() }).res;
    const withJoker = sc(['haltegriff'], [k(14, 'S')], { held: held() }).res;
    expect(ENHANCEMENTS.eisen.held?.xMult).toBe(1.4);
    expect(without.total).toBe(Math.floor(16 * 1.4));
    expect(withJoker.total).toBe(Math.floor(16 * 1.96));
    // gespielte Karten werden von Haltegriff nicht wiederholt
    expect(retriggers(sc(['haltegriff'], [k(9, 'S'), k(9, 'H')]).res)).toBe(0);
  });

  it('Retrigger mehrerer Jokers addieren sich', () => {
    const { res } = sc(['hofecho', 'erstschlag'], [k(13, 'S'), k(13, 'H')]);
    // erste Karte: 1 + 1 + 2 = 4 Auswertungen, zweite: 2
    expect(retriggers(res)).toBe(4);
  });
});

// ─────────────────────────────────────────────── Gruppe 4: Skalierende Jokers

describe('Gruppe 4: Skalierende Jokers', () => {
  it('Schneeball zeigt seinen Startwert in der Beschreibung', () => {
    expect(jokerDescription(getJoker('schneeball')!)).toContain('+0 Mult');
  });

  it('Lawine wächst pro Discard', () => {
    const run = inRound('SCALE001');
    addJoker(run, 'lawine');
    discardHand(run, [run.round!.hand[0].id]);
    afterHand(run);
    discardHand(run, [run.round!.hand[0].id]);
    expect(run.jokers[0].vars.chips).toBe(8);
    const res = playHand(run, [run.round!.hand[0].id]);
    expect(contrib(res, run.jokers[0].uid).chips).toBe(8);
  });

  it('Glimmer wächst nur nach einem Flush und wirkt erst danach', () => {
    const { jokers } = sc(['glimmer'], [k(2, 'H'), k(5, 'H'), k(7, 'H'), k(9, 'H'), k(13, 'H')]);
    expect(jokers[0].vars.mult).toBe(3);
    const second = scoreHand({ played: [k(2, 'H'), k(5, 'H'), k(7, 'H'), k(9, 'H'), k(13, 'H')], held: [], handLevels: initialHandLevels(), jokers, money: 0, handsLeft: 1, discardsLeft: 1 });
    expect(contrib(second, 1).mult).toBe(3);
    expect(jokers[0].vars.mult).toBe(6);
    const none = sc(['glimmer'], [k(9, 'S'), k(9, 'H')]);
    expect(none.jokers[0].vars.mult).toBe(0);
  });

  it('Pfadfinder wächst bei einer Straight', () => {
    const straight = [k(5, 'S'), k(6, 'H'), k(7, 'C'), k(8, 'D'), k(9, 'S')];
    const { jokers } = sc(['pfadfinder'], straight);
    expect(jokers[0].vars.chips).toBe(6);
  });

  it('Gezeiten wächst pro Blind, die Auszahlungsvorschau verändert nichts', () => {
    const run = runWith('SCALE002', 'gezeiten');
    selectBlind(run);
    run.round!.score = run.round!.target;
    afterHand(run);
    computeEarnings(run);
    computeEarnings(run);
    expect(run.jokers[0].vars.mult).toBe(0);
    cashOut(run);
    expect(run.jokers[0].vars.mult).toBe(2);
    leaveShop(run);
    wonRound(run);
    expect(run.jokers[0].vars.mult).toBe(4);
  });

  it('Wachskerze startet bei X3, verliert X0,5 pro Hand und verbrennt bei X1', () => {
    const run = inRound('SCALE003');
    addJoker(run, 'wachskerze');
    const uid = run.jokers[0].uid;
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = playHand(run, [run.round!.hand[0].id]);
      seen.push(contrib(res, uid).xMult);
      afterHand(run);
    }
    expect(seen).toEqual([3, 2.5, 2, 1.5]);
    expect(run.jokers).toHaveLength(0);
  });

  it('Zwillingsring wächst bei jedem Pair um X0,15', () => {
    const { jokers } = sc(['zwillingsring'], [k(9, 'S'), k(9, 'H')]);
    expect(jokers[0].vars.x).toBeCloseTo(1.15);
    const again = scoreHand({ played: [k(9, 'S'), k(9, 'H')], held: [], handLevels: initialHandLevels(), jokers, money: 0, handsLeft: 1, discardsLeft: 1 });
    expect(contrib(again, 1).xMult).toBeCloseTo(1.15);
    expect(jokers[0].vars.x).toBeCloseTo(1.3);
    expect(contrib(sc(['zwillingsring'], [k(9, 'S')]).res, 1).events).toBe(0);
  });

  it('Zustand skalierender Jokers übersteht Speichern und Laden', () => {
    const run = inRound('SCALE004');
    addJoker(run, 'lawine');
    discardHand(run, [run.round!.hand[0].id]);
    const back = JSON.parse(JSON.stringify(run)) as RunState;
    expect(back.jokers[0].vars.chips).toBe(4);
  });
});

// ─────────────────────────────────────────────── Gruppe 5: Geld Jokers

describe('Gruppe 5: Geld Jokers', () => {
  it('Münzquelle zahlt am Rundenende und erscheint als eigene Zeile', () => {
    const run = runWith('MONEY001', 'muenzquelle');
    selectBlind(run);
    run.round!.score = run.round!.target;
    afterHand(run);
    const e = computeEarnings(run);
    expect(e.jokers).toBe(3);
    expect(e.total).toBe(e.blindReward + e.handsBonus + e.discardsBonus + e.interest + 3);
    const before = run.money;
    cashOut(run);
    expect(run.money).toBe(before + e.total);
  });

  it('Handarbeit zahlt pro übriger Hand', () => {
    const run = runWith('MONEY002', 'handarbeit');
    selectBlind(run);
    run.round!.handsLeft = 3;
    expect(computeEarnings(run).jokers).toBe(3);
    run.round!.handsLeft = 0;
    expect(computeEarnings(run).jokers).toBe(0);
  });

  it('Zinsmeister erhöht den Zinsdeckel um 5', () => {
    const plain = createRun({ seed: 'MONEY003' });
    const rich = runWith('MONEY003', 'zinsmeister');
    for (const r of [plain, rich]) {
      r.money = 100;
      selectBlind(r);
    }
    expect(computeEarnings(plain).interest).toBe(5);
    expect(computeEarnings(rich).interest).toBe(10);
  });

  it('Goldwäscher: Chance pro gewerteter Karte', () => {
    const hit = sc(['goldwaescher'], [k(9, 'S'), k(9, 'H')], { chance: () => true }).res;
    expect(contrib(hit, 1).money).toBe(2);
    expect(hit.money).toBe(2);
    const miss = sc(['goldwaescher'], [k(9, 'S'), k(9, 'H')], { chance: () => false }).res;
    expect(miss.money).toBe(0);
  });

  it('Goldwäscher nutzt "1 in 4" und wird vom Wahrscheinlichkeitsfaktor verdoppelt', () => {
    const asked: [number, number][] = [];
    sc(['goldwaescher'], [k(9, 'S')], { chance: (n, d) => { asked.push([n, d]); return false; } });
    expect(asked).toEqual([[1, 4]]);
  });

  it('Glückstaler: nur gewertete Karten vom Rang 7', () => {
    const yes = sc(['glueckstaler'], [k(7, 'S'), k(7, 'H')], { chance: () => true }).res;
    expect(contrib(yes, 1).money).toBe(4);
    const no = sc(['glueckstaler'], [k(8, 'S'), k(8, 'H')], { chance: () => true }).res;
    expect(contrib(no, 1).events).toBe(0);
  });

  it('Kartenhändler: $1 pro abgeworfener Face Card', () => {
    const run = inRound('MONEY004');
    addJoker(run, 'kartenhaendler');
    run.round!.hand = [k(13, 'S'), k(12, 'H'), k(3, 'C'), k(4, 'D')];
    const before = run.money;
    discardHand(run, run.round!.hand.map((c) => c.id));
    expect(run.money).toBe(before + 2);
  });

  it('Beutezug: nur beim Boss Blind', () => {
    const run = runWith('MONEY005', 'beutezug');
    selectBlind(run);
    expect(computeEarnings(run).jokers).toBe(0);
    run.round!.blind = 'boss';
    expect(computeEarnings(run).jokers).toBe(4);
  });

  it('Rentner: $1 pro 2 Antes, mindestens $1', () => {
    const run = runWith('MONEY006', 'rentner');
    selectBlind(run);
    const at = (ante: number) => { run.ante = ante; return computeEarnings(run).jokers; };
    expect([at(1), at(2), at(4), at(8)]).toEqual([1, 1, 2, 4]);
  });
});

// ─────────────────────────────────────────────── Gruppe 6: Blind und Shop Jokers

describe('Gruppe 6: Blind und Shop Jokers', () => {
  it('Würfelhand: erster Reroll jedes Shops ist gratis', () => {
    const run = runWith('SHOPJ001', 'wuerfelhand');
    wonRound(run);
    expect(rerollCost(run)).toBe(0);
    run.money = 100;
    reroll(run);
    expect(run.money).toBe(100);
    expect(rerollCost(run)).toBe(5);
  });

  it('Marktschreier: ein zusätzlicher Karten Slot, auch beim Reroll', () => {
    const run = runWith('SHOPJ002', 'marktschreier');
    wonRound(run);
    expect(run.shop!.cards).toHaveLength(3);
    run.money = 100;
    reroll(run);
    expect(run.shop!.cards).toHaveLength(3);
  });

  it('Kundenkarte: 15 Prozent Rabatt (Joker Pack 4 wird 3)', () => {
    const run = runWith('SHOPJ003', 'kundenkarte');
    wonRound(run);
    expect(run.shop!.packs[0]!.packId).toBe('joker_normal');
    expect(run.shop!.packs[0]!.price).toBe(3);
  });

  it('Hehler: Verkauf gibt den Verkaufswert plus $10', () => {
    const run = runWith('SHOPJ004', 'hehler');
    const inst = run.jokers[0];
    inst.buyPrice = 3;
    const before = run.money;
    expect(sellJoker(run, inst.uid)).toBe(true);
    expect(run.money).toBe(before + 1 + 10);
    expect(run.jokers).toHaveLength(0);
  });

  it('Lagerfeuer: Geld nur bei der Wahl des Small Blinds', () => {
    const run = runWith('SHOPJ005', 'lagerfeuer');
    const before = run.money;
    expect(selectBlind(run).money).toBe(2);
    expect(run.money).toBe(before + 2);
    const big = runWith('SHOPJ005', 'lagerfeuer');
    big.blindIndex = 1;
    expect(selectBlind(big).money).toBe(0);
  });

  it('Sternwart erzeugt bei jeder Blind Wahl ein Sternbild, nur bei freiem Slot', () => {
    const run = runWith('SHOPJ006', 'sternwart');
    const res = selectBlind(run);
    expect(res.consumables).toHaveLength(1);
    expect(run.consumables[0].defId).toMatch(/^sternbild_/);
    const full = runWith('SHOPJ006', 'sternwart');
    addConsumable(full, 'sternbild_pair', 3);
    addConsumable(full, 'sternbild_pair', 3);
    expect(selectBlind(full).consumables).toHaveLength(0);
  });

  it('Lehrling erzeugt nur beim Boss Blind ein Elixier', () => {
    const run = runWith('SHOPJ007', 'lehrling');
    expect(selectBlind(run).consumables).toHaveLength(0);
    const boss = runWith('SHOPJ007', 'lehrling');
    boss.blindIndex = 2;
    expect(selectBlind(boss).consumables).toHaveLength(1);
    expect(boss.consumables[0].defId).toMatch(/^elixier_/);
  });

  it('gekaufte Jokers im Shop können Hooks haben, Kauf und Verkauf bleiben konsistent', () => {
    const run = createRun({ seed: 'SHOPJ008' });
    wonRound(run);
    run.money = 100;
    run.shop!.cards[0] = { kind: 'joker', defId: 'hehler', price: 3 };
    expect(buyCard(run, 0)).toBe(true);
    const money = run.money;
    sellJoker(run, run.jokers[0].uid);
    expect(run.money).toBe(money + 1 + 10);
  });
});

// ─────────────────────────────────────────────── Gruppe 7: Passive Jokers

describe('Gruppe 7: Passive Jokers', () => {
  it('Schnellgriff: Flush mit 4 Karten', () => {
    const hand = () => [k(2, 'H'), k(5, 'H'), k(7, 'H'), k(9, 'H'), k(13, 'S')];
    expect(sc([], hand()).res.handType).toBe('highCard');
    expect(sc(['schnellgriff'], hand()).res.handType).toBe('flush');
  });

  it('Sprungbrett: Straights mit Lücke', () => {
    const hand = () => [k(3, 'S'), k(5, 'H'), k(6, 'C'), k(8, 'D'), k(9, 'S')];
    expect(sc([], hand()).res.handType).toBe('highCard');
    expect(sc(['sprungbrett'], hand()).res.handType).toBe('straight');
  });

  it('Farbwechsel: Hearts und Diamonds gelten als eine Suit', () => {
    const hand = () => [k(2, 'H'), k(5, 'D'), k(7, 'H'), k(9, 'D'), k(13, 'D')];
    expect(sc([], hand()).res.handType).toBe('highCard');
    expect(sc(['farbwechsel'], hand()).res.handType).toBe('flush');
  });

  it('Streuguss: alle gespielten Karten werden gewertet', () => {
    const hand = () => [k(9, 'S'), k(9, 'H'), k(2, 'C'), k(5, 'D'), k(13, 'S')];
    expect(sc([], hand()).res.scoring).toHaveLength(2);
    expect(sc(['streuguss'], hand()).res.scoring).toHaveLength(5);
  });

  it('Uhrwerk, Pendel und Falttasche ändern Hands, Discards und Hand Size der Runde', () => {
    const base = inRound('PASS0001');
    const run = runWith('PASS0001', 'uhrwerk', 'pendel', 'falttasche');
    selectBlind(run);
    expect(run.round!.handsLeft).toBe(base.round!.handsLeft + 1);
    expect(run.round!.discardsLeft).toBe(base.round!.discardsLeft + 1);
    expect(run.round!.handSize).toBe(base.round!.handSize + 1);
    expect(run.round!.hand).toHaveLength(base.round!.hand.length + 1);
  });

  it('Glücksklee verdoppelt Wahrscheinlichkeiten, mehrere Quellen multiplizieren sich', () => {
    const run = createRun({ seed: 'PASS0002' });
    run.jokerSlots = 10;
    expect(effectiveProbMult(run)).toBe(1);
    addJoker(run, 'gluecksklee');
    expect(effectiveProbMult(run)).toBe(2);
    run.rules.probMult = 2;
    expect(effectiveProbMult(run)).toBe(4);
  });

  it('Glücksklee wirkt auf Würfe im Scoring (Goldwäscher trifft öfter)', () => {
    const count = (withClover: boolean) => {
      const run = createRun({ seed: 'PASS0003' });
      run.jokerSlots = 10;
      addJoker(run, 'goldwaescher');
      if (withClover) addJoker(run, 'gluecksklee');
      selectBlind(run);
      run.round!.target = 1e12;
      run.round!.handsLeft = 1000;
      let money = 0;
      for (let i = 0; i < 300; i++) {
        run.round!.hand = run.deck.slice(0, 8);
        const before = run.money;
        playHand(run, [run.round!.hand[0].id]);
        money += run.money - before;
      }
      return money;
    };
    const plain = count(false);
    const lucky = count(true);
    expect(lucky).toBeGreaterThan(plain * 1.4);
  });

  it('Gürteltasche und Lastkarren erhöhen die Slots', () => {
    const run = createRun({ seed: 'PASS0004' });
    run.jokerSlots = 5;
    expect(consumableCapacity(run)).toBe(2);
    expect(jokerCapacity(run)).toBe(5);
    addJoker(run, 'guerteltasche');
    addJoker(run, 'lastkarren');
    expect(consumableCapacity(run)).toBe(3);
    expect(jokerCapacity(run)).toBe(6);
  });

  it('Ewiges Licht (Legendary) gibt +1 Hand, Discard und Hand Size', () => {
    const run = createRun({ seed: 'PASS0005' });
    addJoker(run, 'ewiges_licht');
    expect(jokerPassive(run)).toMatchObject({ hands: 1, discards: 1, handSize: 1 });
  });

  it('Passive verschwinden mit dem Verkauf des Jokers', () => {
    const run = createRun({ seed: 'PASS0006' });
    addJoker(run, 'uhrwerk');
    expect(jokerPassive(run).hands).toBe(1);
    sellJoker(run, run.jokers[0].uid);
    expect(jokerPassive(run).hands).toBe(0);
  });
});

// ─────────────────────────────────────────────── Gruppe 8: Spezialfälle

describe('Gruppe 8: Spezialfälle', () => {
  it('Spiegelbild kopiert den Joker rechts', () => {
    const { res } = sc(['spiegelbild', 'funke'], [k(9, 'S')]);
    expect(contrib(res, 1).mult).toBe(4);
    expect(contrib(res, 2).mult).toBe(4);
  });

  it('Spiegelbild kopiert nichts ganz rechts, keine Kopierer und keine nicht kopierbaren Jokers', () => {
    expect(contrib(sc(['funke', 'spiegelbild'], [k(9, 'S')]).res, 2).events).toBe(0);
    expect(contrib(sc(['spiegelbild', 'urbild', 'funke'], [k(9, 'S')]).res, 1).events).toBe(0);
    expect(contrib(sc(['spiegelbild', 'uhrwerk'], [k(9, 'S')]).res, 1).events).toBe(0);
  });

  it('Urbild kopiert den ganz linken Joker', () => {
    const { res } = sc(['funke', 'kiesel', 'urbild'], [k(9, 'S')]);
    expect(contrib(res, 3).mult).toBe(4);
    expect(contrib(sc(['urbild', 'funke'], [k(9, 'S')]).res, 1).events).toBe(0);
  });

  it('Kopien rufen die Retrigger und Scored Phasen des Ziels auf', () => {
    const { res } = sc(['spiegelbild', 'hofecho'], [k(13, 'S'), k(13, 'H')]);
    // Hofecho und Kopie wirken beide: erste Karte 1 + 1 + 1 = 3 Auswertungen
    expect(retriggers(res)).toBe(4);
    const scored = sc(['spiegelbild', 'glut'], [k(9, 'H'), k(9, 'D')]).res;
    expect(contrib(scored, 1).mult).toBe(4);
  });

  it('Eine Kopie lässt skalierende Jokers nicht doppelt wachsen', () => {
    const { jokers } = sc(['spiegelbild', 'schneeball'], [k(9, 'S')]);
    expect(jokers[1].vars.mult).toBe(1);
  });

  it('Kopie wirkt auch bei Hooks außerhalb des Scorings (Münzquelle verdoppelt)', () => {
    const run = runWith('SPEC0001', 'spiegelbild', 'muenzquelle');
    selectBlind(run);
    expect(computeEarnings(run).jokers).toBe(6);
  });

  it('Schutzengel rettet einmal, wenn mindestens ein Viertel des Ziels erreicht ist', () => {
    const run = inRound('SPEC0002');
    addJoker(run, 'schutzengel');
    const r = run.round!;
    r.target = 1000;
    r.score = 300;
    r.handsLeft = 1;
    playHand(run, [r.hand[0].id]);
    afterHand(run);
    expect(run.phase).toBe('roundWon');
    expect(run.jokers).toHaveLength(0);
    expect(r.rescuedBy).toBe('Schutzengel');
    cashOut(run);
    expect(run.phase).toBe('shop');
  });

  it('Schutzengel rettet nicht, wenn zu wenig erreicht ist', () => {
    const run = inRound('SPEC0003');
    addJoker(run, 'schutzengel');
    const r = run.round!;
    r.target = 1000;
    r.score = 0;
    r.handsLeft = 1;
    playHand(run, [r.hand[0].id]);
    afterHand(run);
    expect(run.phase).toBe('gameOver');
    expect(run.jokers).toHaveLength(1);
  });

  it('Schutzengel ist nur einmal wirksam (Spawn erst ab Ante 2)', () => {
    const run = createRun({ seed: 'SPEC0004' });
    const rng = rngOf(run);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(rollJoker(run, rng, 'spawn_test', new Set(), 'rare')!.id);
    expect(seen.has('schutzengel')).toBe(false);
    run.ante = 2;
    for (let i = 0; i < 300; i++) seen.add(rollJoker(run, rng, 'spawn_test2', new Set(), 'rare')!.id);
    expect(seen.has('schutzengel')).toBe(true);
  });

  it('Kupferschmied macht die erste gewertete Karte dauerhaft zu Kupfer', () => {
    const run = inRound('SPEC0005');
    addJoker(run, 'kupferschmied');
    const id = run.round!.hand[0].id;
    playHand(run, [id]);
    expect(run.deck.find((c) => c.id === id)!.enhancement).toBe('kupfer');
    expect(run.round!.discardPile.find((c) => c.id === id)!.enhancement).toBe('kupfer');
  });

  it('Kupferschmied überschreibt kein vorhandenes Enhancement', () => {
    const { res } = sc(['kupferschmied'], [k(9, 'S', { enhancement: 'rubin' })]);
    expect(res.cardEdits).toEqual([]);
  });

  it('Schleifstein: gewertete Karten erhalten dauerhaft +3 Chips, die beim nächsten Scoring zählen', () => {
    const run = inRound('SPEC0006');
    addJoker(run, 'schleifstein');
    const card = run.round!.hand[0];
    const id = card.id;
    const first = playHand(run, [id]);
    expect(run.deck.find((c) => c.id === id)!.extraChips).toBe(3);
    const chipEvents = first.events.filter((e) => e.source.kind === 'card' && e.source.cardId === id).map((e) => e.chips);
    // beim ersten Spielen war noch nichts aufgeschlagen
    expect(chipEvents[0]).toBe(card.rank <= 10 ? card.rank : card.rank === 14 ? 11 : 10);
    const again = scoreHand({ played: [{ ...card, extraChips: 3 }], held: [], handLevels: initialHandLevels(), jokers: [], money: 0, handsLeft: 1, discardsLeft: 1 });
    expect(again.events.find((e) => e.phase === 'card')!.chips).toBe(chipEvents[0]! + 3);
  });

  it('Gefolgschaft: +3 Mult für jeden anderen Common Joker in der Joker Phase', () => {
    expect(contrib(sc(['funke', 'gefolgschaft'], [k(9, 'S')]).res, 2).mult).toBe(3);
    expect(contrib(sc(['funke', 'kiesel', 'gefolgschaft'], [k(9, 'S')]).res, 3).mult).toBe(6);
    expect(contrib(sc(['einzelgaenger', 'gefolgschaft'], [k(9, 'S')]).res, 2).events).toBe(0);
  });

  it('Legendary Jokers erscheinen nie zufällig im Shop oder in Packs', () => {
    const run = createRun({ seed: 'SPEC0007' });
    const rng = rngOf(run);
    for (let i = 0; i < 500; i++) {
      const j = rollJoker(run, rng, `leg_${i % 3}`, new Set());
      expect(j!.rarity).not.toBe('legendary');
    }
  });

  it('Omen Ahnenruf erzeugt einen Legendary Joker und braucht einen freien Slot', () => {
    const run = createRun({ seed: 'SPEC0008' });
    run.money = 12;
    expect(canUseConsumable(run, 'omen_ahnenruf', [], 'direct')).toBe(true);
    applyConsumable(run, 'omen_ahnenruf');
    expect(run.jokers).toHaveLength(1);
    expect(getJoker(run.jokers[0].defId)!.rarity).toBe('legendary');
    expect(run.money).toBe(0);
    run.jokerSlots = 1;
    expect(canUseConsumable(run, 'omen_ahnenruf', [], 'direct')).toBe(false);
  });

  it('Sternenkönig gibt X3 Mult', () => {
    expect(contrib(sc(['sternenkoenig'], [k(9, 'S')]).res, 1).xMult).toBe(3);
  });

  it('Meister der Tinkturen erzeugt ein Elixier und ein Sternbild bei der Blind Wahl', () => {
    const run = runWith('SPEC0009', 'meister_der_tinkturen');
    const res = selectBlind(run);
    expect(res.consumables).toHaveLength(2);
    expect(res.consumables[0]).toMatch(/^elixier_/);
    expect(res.consumables[1]).toMatch(/^sternbild_/);
  });
});

// ─────────────────────────────────────────────── Reihenfolge

describe('Joker Reihenfolge und Phasen', () => {
  it('Karten Jokers wirken links nach rechts nach der Karte, Main Jokers links nach rechts', () => {
    const { res } = sc(['kiesel', 'funke'], [k(9, 'S')]);
    const order = res.events.filter((e) => e.source.kind === 'joker').map((e) => (e.source as { jokerUid: number }).jokerUid);
    expect(order).toEqual([1, 2]);
  });

  it('Multiplikative Jokers hängen von der Reihenfolge ab (Funke vor Hochstapler)', () => {
    const a = sc(['funke', 'hochstapler'], [k(9, 'S')]).res.total;
    const b = sc(['hochstapler', 'funke'], [k(9, 'S')]).res.total;
    expect(a).toBeGreaterThan(b);
  });
});
