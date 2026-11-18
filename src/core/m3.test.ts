import './index';
import { describe, expect, it } from 'vitest';
import { JOKER_DEFS } from '../data/jokers';
import { afterHand, cashOut, createRun, discardHand, openShop, playHand, reroll, rerollCost, selectBlind, sellJoker } from './game';
import { handBase, initialHandLevels } from './hands';
import { allJokers, getJoker, jokerDescription, stickerCompat, type JokerInstance } from './jokers';
import {
  addJoker, computeEarnings, isCardDebuffed, jokerSellValue, probMultOf, rngOf, rollJoker, type RunState,
} from './run';
import { scoreHand, type ScoreInput } from './scoring';
import type { Card, Rank, Suit } from './types';

// ─────────────────────────────────────────────── Hilfen

let nextId = 70_000;
const RANK_OF: Record<string, number> = { J: 11, Q: 12, K: 13, A: 14 };
/** "KS" = King of Spades, "10H" = Zehn Hearts */
const c = (s: string, extra: Partial<Card> = {}): Card => {
  const suit = s.slice(-1) as Suit;
  const r = s.slice(0, -1);
  return { id: nextId++, rank: (RANK_OF[r] ?? Number(r)) as Rank, suit, ...extra };
};
const cs = (s: string) => s.trim().split(/\s+/).map((x) => c(x));

let uid = 1000;
const j = (defId: string, vars: Record<string, number> = {}): JokerInstance => {
  expect(getJoker(defId), defId).toBeDefined();
  return { uid: uid++, defId, vars: { ...(getJoker(defId)!.startVars ?? {}), ...vars } };
};

function sc(played: string | Card[], jokers: JokerInstance[] = [], opts: Partial<ScoreInput> = {}) {
  return scoreHand({
    played: typeof played === 'string' ? cs(played) : played,
    held: [], handLevels: initialHandLevels(), jokers, money: 0, handsLeft: 2, discardsLeft: 2, ...opts,
  });
}
const pair = handBase('pair', 1);
const high = handBase('highCard', 1);

function runWith(seed: string, ...defIds: string[]): RunState {
  const run = createRun({ seed });
  for (const id of defIds) addJoker(run, id);
  return run;
}

function winRound(run: RunState) {
  run.round!.score = run.round!.target;
  afterHand(run);
  return cashOut(run);
}

// ─────────────────────────────────────────────── Katalog

describe('Katalog', () => {
  it('etwa 60 eigene Jokers mit eindeutigen IDs und Namen, alte IDs bleiben', () => {
    expect(JOKER_DEFS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(JOKER_DEFS.map((d) => d.id)).size).toBe(JOKER_DEFS.length);
    expect(new Set(JOKER_DEFS.map((d) => d.name)).size).toBe(JOKER_DEFS.length);
    for (const id of ['funke', 'treppe', 'glut', 'frost', 'kleinvieh', 'einzelgaenger', 'letzte_chance', 'schneeball', 'sparschwein']) {
      expect(getJoker(id), id).toBeDefined();
    }
  });

  it('Rarity Verteilung grob 60, 30, 10 Prozent, dazu wenige Legendary', () => {
    const n = (r: string) => JOKER_DEFS.filter((d) => d.rarity === r).length;
    const normal = JOKER_DEFS.length - n('legendary');
    expect(n('common') / normal).toBeGreaterThan(0.5);
    expect(n('uncommon') / normal).toBeGreaterThan(0.25);
    expect(n('rare') / normal).toBeGreaterThan(0.05);
    expect(n('legendary')).toBeGreaterThanOrEqual(1);
    expect(n('legendary')).toBeLessThanOrEqual(5);
  });

  it('jeder Joker hat eine Wirkung, Zahlen nur in config, Beschreibung ohne offene Platzhalter und ohne Gedankenstriche', () => {
    for (const d of JOKER_DEFS) {
      expect(!!(d.calculate || d.rules || d.passive || d.copies), d.id).toBe(true);
      for (const v of Object.values(d.config)) expect(typeof v, d.id).toBe('number');
      const text = jokerDescription(d, j(d.id));
      expect(text, d.id).not.toMatch(/\{\w+\}/);
      expect(d.name + text, d.id).not.toMatch(/ - |–|—/);
    }
  });

  it('Legendary erscheinen nie zufällig, Spawn Bedingung minAnte wird beachtet', () => {
    const run = createRun({ seed: 'KATALOG1' });
    const rng = rngOf(run);
    const seen = new Set<string>();
    for (let def = rollJoker(run, rng, 'k', seen); def; def = rollJoker(run, rng, 'k', seen)) seen.add(def.id);
    expect([...seen].some((id) => getJoker(id)!.rarity === 'legendary')).toBe(false);
    expect(seen.has('zinsrechner')).toBe(false);
    run.ante = 2;
    expect(rollJoker(run, rng, 'k', new Set(allJokers().map((d) => d.id).filter((id) => id !== 'zinsrechner')))?.id).toBe('zinsrechner');
  });

  it('Sticker Kompatibilität: selbstzerstörende Jokers nicht eternal, skalierende nicht perishable', () => {
    expect(stickerCompat(getJoker('kerze')!).eternal).toBe(false);
    expect(stickerCompat(getJoker('schneeball')!).perishable).toBe(false);
    expect(stickerCompat(getJoker('funke')!)).toEqual({ eternal: true, perishable: true });
  });
});

// ─────────────────────────────────────────────── Gruppe 1

describe('Gruppe 1: einfache MAIN Jokers', () => {
  it('Zwillingsstern und Zirkel bei Pair, auch wenn die Hand mehr enthält', () => {
    const r = sc('KS KH', [j('zwillingsstern'), j('zirkel')]);
    expect(r.mult).toBe(pair.mult + 8);
    expect(r.chips).toBe(pair.chips + 20 + 50);
    const t = sc('KS KH KD', [j('zwillingsstern')]);
    expect(t.mult).toBe(handBase('threeKind', 1).mult + 8);
  });

  it('Dreigestirn nur mit Three of a Kind, Regenbogen nur mit Flush', () => {
    expect(sc('KS KH', [j('dreigestirn')]).mult).toBe(pair.mult);
    expect(sc('2H 5H 7H 9H JH', [j('regenbogen')]).mult).toBe(handBase('flush', 1).mult + 10);
  });

  it('Astrolabium X2 bei Three of a Kind, Himmelsglobus X3 bei Flush', () => {
    expect(sc('4S 4H 4D', [j('astrolabium')]).mult).toBe(handBase('threeKind', 1).mult * 2);
    expect(sc('2H 5H 7H 9H JH', [j('himmelsglobus')]).mult).toBe(handBase('flush', 1).mult * 3);
  });

  it('Leere Phiole bis 3 Karten, Leerer Kelch ohne Discards', () => {
    expect(sc('2S 5H 9D', [j('leere_phiole')]).mult).toBe(high.mult + 20);
    expect(sc('2S 5H 9D JC', [j('leere_phiole')]).mult).toBe(high.mult);
    expect(sc('2S', [j('leerer_kelch')], { discardsLeft: 0 }).mult).toBe(high.mult + 15);
    expect(sc('2S', [j('leerer_kelch')], { discardsLeft: 1 }).mult).toBe(high.mult);
  });

  it('Sternbund pro Joker, Bibliothek pro Karte im Nachziehstapel', () => {
    expect(sc('2S', [j('sternbund')], { jokerCount: 3 }).mult).toBe(high.mult + 9);
    expect(sc('2S', [j('bibliothek')], { deckLeft: 20 }).chips).toBe(high.chips + 2 + 40);
  });
});

// ─────────────────────────────────────────────── Gruppe 2

describe('Gruppe 2: SCORED und HELD Jokers', () => {
  it('Herzfeuer nur für Hearts', () => {
    expect(sc('KS KH', [j('herzfeuer')]).mult).toBe(pair.mult + 3);
  });

  it('Hofstaat für Face Cards, mit Maskenball gilt jede Karte als Face Card', () => {
    expect(sc('KS KH', [j('hofstaat')]).chips).toBe(pair.chips + 20 + 60);
    expect(sc('2S 2H', [j('hofstaat')]).chips).toBe(pair.chips + 4);
    expect(sc('2S 2H', [j('hofstaat'), j('maskenball')]).chips).toBe(pair.chips + 4 + 60);
  });

  it('Gleichmaß für gerade, Schiefer Turm für ungerade Ränge, Sonnenscheibe für Aces', () => {
    expect(sc('4S 4H', [j('gleichmass'), j('schiefer_turm')]).mult).toBe(pair.mult + 8);
    const a = sc('AS AH', [j('gleichmass'), j('schiefer_turm'), j('sonnenscheibe')]);
    expect(a.chips).toBe(pair.chips + 22 + 60 + 40);
    expect(a.mult).toBe(pair.mult + 8);
  });

  it('Obsidian (ranglos) zählt weder als gerade noch als ungerade noch als Face Card', () => {
    const r = sc([c('2S', { enhancement: 'obsidian' })], [j('gleichmass'), j('schiefer_turm'), j('hofstaat'), j('kleinvieh')]);
    expect(r.mult).toBe(high.mult);
  });

  it('Kronjuwel nur für die erste Face Card', () => {
    expect(sc('KS KH', [j('kronjuwel')]).mult).toBe(pair.mult * 2);
  });

  it('Mondwacht und Bleigewicht wirken auf Karten in der Hand', () => {
    const r = sc('9S', [j('mondwacht'), j('bleigewicht')], { held: cs('KS QH 2D 3C 9H') });
    expect(r.mult).toBeCloseTo((high.mult + 8) * 1.2 * 1.2);
  });

  it('geschwächte Karten lösen keine Karten Jokers aus', () => {
    const r = sc([c('KH', { debuffed: true }), c('KS')], [j('herzfeuer'), j('hofstaat')]);
    expect(r.chips).toBe(pair.chips + 10 + 30);
    expect(r.mult).toBe(pair.mult);
  });
});

// ─────────────────────────────────────────────── Gruppe 3

describe('Gruppe 3: Retrigger Jokers', () => {
  it('Widerhall wiederholt Face Cards samt Karten Jokers', () => {
    const r = sc('KS KH', [j('widerhall'), j('hofstaat')]);
    expect(r.chips).toBe(pair.chips + 2 * 2 * (10 + 30));
    expect(r.events.filter((e) => e.phase === 'retrigger')).toHaveLength(2);
  });

  it('Erstes Licht wertet die erste Karte dreimal', () => {
    expect(sc('7S 7H', [j('erstes_licht')]).chips).toBe(pair.chips + 3 * 7 + 7);
  });

  it('Nachhall wiederholt Effekte in der Hand', () => {
    expect(sc('9S', [j('nachhall'), j('mondwacht')], { held: cs('KS') }).mult).toBe(high.mult + 8);
  });

  it('Schlussakkord nur bei der letzten Hand', () => {
    expect(sc('7S 7H', [j('schlussakkord')], { handsLeft: 0 }).chips).toBe(pair.chips + 28);
    expect(sc('7S 7H', [j('schlussakkord')], { handsLeft: 1 }).chips).toBe(pair.chips + 14);
  });

  it('Zeitkristall (Legendary) wiederholt alle gewerteten Karten', () => {
    expect(sc('7S 7H', [j('zeitkristall')]).chips).toBe(pair.chips + 28);
  });
});

// ─────────────────────────────────────────────── Gruppe 4

describe('Gruppe 4: skalierende Jokers', () => {
  it('Schneeball wächst pro Hand, eine Kopie lässt ihn nicht doppelt wachsen', () => {
    const snow = j('schneeball');
    const r = sc('2S', [j('zauberspiegel'), snow]);
    expect(snow.vars.mult).toBe(1);
    expect(r.mult).toBe(high.mult + 2);
    sc('2S', [snow]);
    expect(snow.vars.mult).toBe(2);
  });

  it('Brennofen wächst pro gewerteter Karte und gibt den Wert in derselben Hand', () => {
    const b = j('brennofen');
    const r = sc('5S 5H', [b]);
    expect(b.vars.chips).toBe(4);
    expect(r.chips).toBe(pair.chips + 10 + 4);
  });

  it('Sternkatalog wächst bei Two Pair', () => {
    const k = j('sternkatalog');
    sc('5S 5H 6S 6H', [k]);
    expect(k.vars.xMult).toBe(1.25);
    expect(sc('5S 5H 6S 6H', [k]).mult).toBe(handBase('twoPair', 1).mult * 1.5);
  });

  it('Kerze verliert pro Hand und erlischt bei 0, im Run wird sie entfernt', () => {
    const k = j('kerze', { mult: 2 });
    const r = sc('2S', [k]);
    expect(r.mult).toBe(high.mult + 2);
    expect(r.destroyedJokers).toEqual([k.uid]);

    const run = runWith('KERZE001', 'kerze');
    run.jokers[0].vars.mult = 2;
    selectBlind(run);
    playHand(run, [run.round!.hand[0].id]);
    expect(run.jokers).toHaveLength(0);
  });

  it('Aschehaufen wächst pro abgeworfener Karte', () => {
    const run = runWith('ASCHE001', 'aschehaufen');
    selectBlind(run);
    discardHand(run, run.round!.hand.slice(0, 3).map((x) => x.id));
    expect(run.jokers[0].vars.mult).toBe(3);
  });

  it('Mondphasen wächst am Rundenende', () => {
    const run = runWith('MOND0001', 'mondphasen');
    selectBlind(run);
    winRound(run);
    expect(run.jokers[0].vars.mult).toBe(3);
  });

  it('Uhrwerk wächst pro Reroll', () => {
    const run = runWith('UHR00001', 'uhrwerk');
    selectBlind(run);
    winRound(run);
    run.money = 100;
    reroll(run);
    reroll(run);
    expect(run.jokers[0].vars.xMult).toBe(1.4);
  });
});

// ─────────────────────────────────────────────── Gruppe 5

describe('Gruppe 5: Geld Jokers', () => {
  it('Münzstock zahlt als eigene Zeile am Rundenende', () => {
    const run = runWith('MUENZ001', 'muenzstock');
    selectBlind(run);
    run.round!.score = run.round!.target;
    afterHand(run);
    const e = computeEarnings(run);
    expect(e.jokers).toEqual([{ uid: run.jokers[0].uid, name: 'Münzstock', amount: 3 }]);
    expect(e.total).toBe(e.blindReward + e.handsBonus + e.discardsBonus + e.interest + 3);
    const money = run.money;
    cashOut(run);
    expect(run.money).toBe(money + e.total);
  });

  it('Diamantschleifer zahlt mit Chance pro Diamonds Karte', () => {
    expect(sc('KD KH', [j('diamantschleifer')], { chance: () => true }).money).toBe(1);
    expect(sc('KD KH', [j('diamantschleifer')], { chance: () => false }).money).toBe(0);
  });

  it('Lumpensammler zahlt pro abgeworfener Face Card', () => {
    const run = runWith('LUMPEN01', 'lumpensammler');
    selectBlind(run);
    run.round!.hand.splice(0, 3, ...cs('KS QH 2D'));
    const money = run.money;
    discardHand(run, run.round!.hand.slice(0, 3).map((x) => x.id));
    expect(run.money).toBe(money + 2);
  });

  it('Wechselstube erhöht den Verkaufswert am Rundenende', () => {
    const run = runWith('WECHSEL1', 'wechselstube');
    const before = jokerSellValue(run.jokers[0]);
    selectBlind(run);
    winRound(run);
    expect(jokerSellValue(run.jokers[0])).toBe(before + 2);
  });

  it('Kollekte zahlt bei genau 5 Karten', () => {
    expect(sc('2S 4H 6D 8C 10S', [j('kollekte')]).money).toBe(1);
    expect(sc('2S 4H', [j('kollekte')]).money).toBe(0);
  });

  it('Zinsrechner hebt den Zinsdeckel', () => {
    const run = runWith('ZINS0001', 'zinsrechner');
    selectBlind(run);
    run.round!.score = run.round!.target;
    afterHand(run);
    run.money = 100;
    expect(computeEarnings(run).interest).toBe(10);
  });
});

// ─────────────────────────────────────────────── Gruppe 6

describe('Gruppe 6: Blind und Shop Jokers', () => {
  it('Nachtwächter gibt beim Boss eine Hand mehr', () => {
    const run = runWith('NACHT001', 'nachtwaechter');
    selectBlind(run);
    expect(run.round!.handsLeft).toBe(run.hands);
    const boss = runWith('NACHT002', 'nachtwaechter');
    boss.blindIndex = 2;
    boss.anteBoss = 'monolith';
    selectBlind(boss);
    expect(boss.round!.handsLeft).toBe(boss.hands + 1);
  });

  it('Morgenröte zahlt pro freiem Joker Slot', () => {
    const run = runWith('MORGEN01', 'morgenroete', 'funke');
    const money = run.money;
    selectBlind(run);
    expect(run.money).toBe(money + run.jokerSlots - 2);
  });

  it('Himmelstor erzeugt beim Small Blind einen Common Joker', () => {
    const run = runWith('TOR00001', 'himmelstor');
    selectBlind(run);
    expect(run.jokers).toHaveLength(2);
    expect(getJoker(run.jokers[1].defId)!.rarity).toBe('common');
  });

  it('Glückswürfel macht den ersten Reroll gratis', () => {
    const run = runWith('WUERFEL1', 'glueckswuerfel');
    selectBlind(run);
    winRound(run);
    expect(rerollCost(run)).toBe(0);
    run.money = 50;
    reroll(run);
    expect(rerollCost(run)).toBe(run.rules.rerollBase);
  });

  it('Händlerfreund senkt die Preise neuer Shop Karten', () => {
    const run = runWith('HAENDLR1', 'haendlerfreund');
    run.phase = 'roundWon';
    openShop(run);
    for (const item of run.shop!.cards) {
      if (!item) continue;
      const surcharge = item.edition ? { schimmer: 2, aura: 3, prisma: 5, schatten: 5 }[item.edition]! : 0;
      expect(item.price).toBe(Math.max(1, Math.floor((getJoker(item.defId)!.cost + surcharge) * 0.8)));
    }
  });

  it('Erbstück erzeugt beim Verkauf einen Uncommon Joker', () => {
    const run = runWith('ERBE0001', 'erbstueck');
    sellJoker(run, run.jokers[0].uid);
    expect(run.jokers).toHaveLength(1);
    expect(getJoker(run.jokers[0].defId)!.rarity).toBe('uncommon');
    expect(run.jokers[0].defId).not.toBe('erbstueck');
  });
});

// ─────────────────────────────────────────────── Gruppe 7

describe('Gruppe 7: passive Jokers', () => {
  it('Vier Winde: Flush mit 4 Karten', () => {
    expect(sc('2H 5H 7H 9H', [j('vier_winde')]).handType).toBe('flush');
    expect(sc('2H 5H 7H 9H').handType).toBe('highCard');
  });

  it('Himmelsleiter: Straight mit Lücken, Zwielicht: gleichfarbige Suits, Springflut: alle Karten scoren', () => {
    expect(sc('3S 5H 7D 9C JS', [j('himmelsleiter')]).handType).toBe('straight');
    expect(sc('2H 5D 7H 9D JH', [j('zwielicht')]).handType).toBe('flush');
    expect(sc('KS KH 2D', [j('springflut')]).scoring).toHaveLength(3);
  });

  it('Maskenball macht beim Nebel jede Karte zur geschwächten Face Card', () => {
    const run = runWith('MASKE001', 'maskenball');
    run.blindIndex = 2;
    run.anteBoss = 'nebel';
    selectBlind(run);
    expect(isCardDebuffed(run, c('2S'))).toBe(true);
    expect(isCardDebuffed(run, c('2S', { enhancement: 'obsidian' }))).toBe(false);
  });

  it('Satteltasche, Windmühle und Sanduhr verändern die Rundenwerte', () => {
    const run = runWith('PASSIV01', 'satteltasche', 'windmuehle', 'sanduhr');
    selectBlind(run);
    expect(run.round!.handSize).toBe(run.handSize + 1);
    expect(run.round!.discardsLeft).toBe(run.discards + 1);
    expect(run.round!.handsLeft).toBe(run.hands + 1);
    expect(run.round!.hand).toHaveLength(run.handSize + 1);
  });

  it('Orakel verdoppelt alle Wahrscheinlichkeiten', () => {
    const run = runWith('ORAKEL01', 'orakel');
    expect(probMultOf(run)).toBe(2);
  });
});

// ─────────────────────────────────────────────── Gruppe 8

describe('Gruppe 8: Spezialfälle', () => {
  it('Zauberspiegel kopiert den rechten Nachbarn, auch über eine Kette', () => {
    expect(sc('2S', [j('zauberspiegel'), j('funke')]).mult).toBe(high.mult + 8);
    expect(sc('2S', [j('zauberspiegel'), j('zauberspiegel'), j('funke')]).mult).toBe(high.mult + 12);
    expect(sc('2S', [j('funke'), j('zauberspiegel')]).mult).toBe(high.mult + 4);
  });

  it('Zauberspiegel kopiert keine inkompatiblen Jokers und Kopien kopieren Retrigger', () => {
    expect(sc('2S', [j('zauberspiegel'), j('phoenixfeder')]).mult).toBe(high.mult);
    expect(sc('7S 7H', [j('zauberspiegel'), j('zeitkristall')]).chips).toBe(pair.chips + 42);
  });

  it('Sternenrat reagiert auf andere Common Jokers', () => {
    expect(sc('2S', [j('funke'), j('sternenrat')]).mult).toBe(high.mult + 4 + 3);
    expect(sc('2S', [j('sparschwein'), j('sternenrat')], { money: 0 }).mult).toBe(high.mult);
  });

  it('Transmutator macht die erste Karte vor dem Scoring zu Kupfer, auch im Deck', () => {
    const r = sc('7S 7H', [j('transmutator')]);
    expect(r.chips).toBe(pair.chips + 14 + 25);
    expect(r.modified).toHaveLength(1);

    const run = runWith('TRANS001', 'transmutator');
    selectBlind(run);
    const card = run.round!.hand.find((x) => !x.enhancement)!;
    playHand(run, [card.id]);
    expect(run.deck.find((x) => x.id === card.id)!.enhancement).toBe('kupfer');
  });

  it('Phönixfeder rettet einmal ab 25 Prozent des Ziels und verbrennt', () => {
    const run = runWith('PHOENIX1', 'phoenixfeder');
    selectBlind(run);
    run.round!.handsLeft = 0;
    run.round!.score = Math.ceil(run.round!.target / 4);
    afterHand(run);
    expect(run.phase).toBe('roundWon');
    expect(run.round!.rescued).toBe(true);
    expect(run.round!.handsLeft).toBe(0);
    expect(computeEarnings(run).handsBonus).toBe(0);
    expect(run.jokers).toHaveLength(0);
    cashOut(run);
    expect(run.phase).toBe('shop');
  });

  it('Phönixfeder rettet nicht unter 25 Prozent', () => {
    const run = runWith('PHOENIX2', 'phoenixfeder');
    selectBlind(run);
    run.round!.handsLeft = 0;
    run.round!.score = Math.floor(run.round!.target / 4) - 1;
    afterHand(run);
    expect(run.phase).toBe('gameOver');
    expect(run.jokers).toHaveLength(1);
  });

  it('Legendary: Stein der Weisen und Astralkrone', () => {
    expect(sc([c('7S', { enhancement: 'kupfer' }), c('7H')], [j('stein_der_weisen')]).mult).toBe(pair.mult * 1.5);
    expect(sc('KS KH', [j('astralkrone')]).mult).toBe(pair.mult * 4);
  });
});
