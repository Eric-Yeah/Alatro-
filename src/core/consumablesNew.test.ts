import './index';
import { describe, expect, it } from 'vitest';
import {
  CONSUMABLES, CONSUMABLE_BY_ID, JOKER_UPGRADE_CHAIN, MAX_CONSUMABLE_SLOTS, MAX_HAND_SIZE, MIN_HAND_SIZE,
} from '../data/consumables';
import { EDITIONS, ENHANCEMENTS } from '../data/modifiers';
import { HAND_ORDER } from '../data/hands';
import { SUITS } from '../data/cards';
import { TAGS } from '../data/tags';
import { applyConsumable, canUseConsumable, commonestSuit, isRoundOnlyConsumable, isWaitingTag } from './consumables';
import { createRun, openShop, playHand, selectBlind } from './game';
import { rollConsumable } from './generate';
import { mostPlayedHand } from './hands';
import { allJokers, getJoker } from './jokers';
import { addJoker, jokerCapacity, rngOf, type RunState } from './run';
import { levelUpPreview } from './runInfo';
import type { Card, Rank } from './types';

/** Neue Consumables dieser Erweiterung (alles, was nicht zu den ersten 42 gehört) */
const NEW_IDS = [
  'elixier_gipfelglanz', 'elixier_gleichklang', 'elixier_spektralglas', 'elixier_abguss', 'elixier_glanzfirnis', 'elixier_flammenfirnis',
  'elixier_pfandsiegel', 'elixier_goldwaage', 'elixier_leitstern', 'elixier_nachtlicht', 'elixier_bannwasser', 'elixier_aufwind', 'elixier_stundenglas',
  'omen_gestirnsopfer', 'omen_lichtschleifer', 'omen_zwillingsflamme', 'omen_kometenschweif', 'omen_nachtauge', 'omen_alchemistenbeutel',
  'omen_abendruhe', 'omen_prismenopfer', 'omen_wandlung', 'omen_farbsturm',
];

/** Run in einer laufenden Runde mit unerreichbarem Ziel */
function inRound(seed: string): RunState {
  const run = createRun({ seed });
  selectBlind(run);
  run.round!.target = 1e12;
  return run;
}

const hand = (run: RunState) => run.round!.hand;
const ids = (cards: Card[], n: number, from = 0) => cards.slice(from, from + n).map((c) => c.id);
const find = (run: RunState, id: number) => run.deck.find((c) => c.id === id)!;
const addJ = (run: RunState, defId: string, extra: Partial<{ edition: string }> = {}) => {
  run.jokers.push({ uid: run.nextUid++, defId, vars: {}, ...extra });
};
/** Zustandsabbild für Determinismus Tests */
const snap = (run: RunState) => JSON.stringify({
  deck: run.deck, jokers: run.jokers, money: run.money, levels: run.handLevels, hs: run.handSize, hands: run.hands, disc: run.discards, tags: run.pendingTags,
  round: run.round && { hand: run.round.hand.map((c) => c.id), hl: run.round.handsLeft, dl: run.round.discardsLeft },
});

describe('Neue Consumables: Daten', () => {
  it('23 neue Einträge, 13 Elixiere und 10 Omen, eindeutige IDs, Kosten je Typ', () => {
    expect(CONSUMABLES.filter((c) => NEW_IDS.includes(c.id))).toHaveLength(NEW_IDS.length);
    expect(NEW_IDS.filter((i) => i.startsWith('elixier_'))).toHaveLength(13);
    expect(NEW_IDS.filter((i) => i.startsWith('omen_'))).toHaveLength(10);
    expect(new Set(CONSUMABLES.map((c) => c.id)).size).toBe(CONSUMABLES.length);
    expect(new Set(CONSUMABLES.map((c) => c.name)).size).toBe(CONSUMABLES.length);
    for (const id of NEW_IDS) {
      const c = CONSUMABLE_BY_ID[id];
      expect(c.cost, id).toBe(c.type === 'omen' ? 4 : 3);
      expect(c.weight ?? 1, id).toBeGreaterThan(0);
      expect(c.weight ?? 1, id).toBeLessThanOrEqual(1);
    }
  });

  it('Verweise stimmen: Editions, Tags, Rarity Kette', () => {
    for (const c of CONSUMABLES) {
      const e = c.effect;
      if (e.kind === 'edition') expect(EDITIONS[e.edition], c.id).toBeDefined();
      if (e.kind === 'jokerEdition') for (const ed of e.editions) expect(EDITIONS[ed], c.id).toBeDefined();
      if (e.kind === 'addTag') {
        expect(TAGS.some((t) => t.id === e.tagId), c.id).toBe(true);
        expect(isWaitingTag(e.tagId), c.id).toBe(true);
      }
      if (e.kind === 'spreadEnhancement') expect(c.targets).toEqual({ min: 1, max: 1 });
    }
    expect(JOKER_UPGRADE_CHAIN).toEqual(['common', 'uncommon', 'rare']);
    expect(isWaitingTag('goldstaub')).toBe(false);
  });

  it('Rauchtest: jedes neue Consumable lässt sich in einer Runde mit passenden Zielen anwenden, danach ist eine Hand spielbar', () => {
    for (const id of NEW_IDS) for (const seed of ['SMOKE001', 'SMOKE002', 'SMOKE003']) {
      const run = inRound(seed);
      const def = CONSUMABLE_BY_ID[id];
      // Vorbereitung: Jokers mit Rarity, ein gespieltes Hand, Enhancement auf dem ersten Ziel
      addJ(run, 'funke'); addJ(run, 'glut');
      run.handsPlayed.pair = 2;
      const h = hand(run);
      let targets: number[] = [];
      if (def.targets) {
        targets = ids(h, def.targets.max);
        if (def.effect.kind === 'spreadEnhancement') find(run, targets[0]).enhancement = 'kupfer';
      }
      const ok = canUseConsumable(run, id, targets, 'direct');
      expect(ok, id).toBe(true);
      const res = applyConsumable(run, id, targets);
      expect(res.message.length, id).toBeGreaterThan(0);
      // Invariante der Runde: Hand, Nachziehstapel und Ablage ergeben das Deck
      const r = run.round!;
      expect(r.hand.length + r.drawPile.length + r.discardPile.length, id).toBe(run.deck.length);
      expect(Number.isFinite(run.money), id).toBe(true);
      const res2 = playHand(run, ids(r.hand, 1));
      expect(res2.total, id).toBeGreaterThan(0);
    }
  });
});

describe('Rang und Suit: Gipfelglanz, Gleichklang, Spektralglas', () => {
  it('Gipfelglanz setzt bis zu 2 Karten auf Ace, 3 Ziele sind nicht erlaubt', () => {
    const run = inRound('RANK0001');
    const t = ids(hand(run), 2);
    expect(canUseConsumable(run, 'elixier_gipfelglanz', ids(hand(run), 3), 'slot')).toBe(false);
    expect(canUseConsumable(run, 'elixier_gipfelglanz', [], 'slot')).toBe(false);
    applyConsumable(run, 'elixier_gipfelglanz', t);
    for (const id of t) expect(find(run, id).rank).toBe(14);
  });

  it('Gleichklang: alle Ziele erhalten den höchsten Rang, mindestens 2 Ziele nötig', () => {
    const run = inRound('RANK0002');
    const t = ids(hand(run), 3);
    t.forEach((id, i) => { find(run, id).rank = [5, 9, 7][i] as Rank; });
    expect(canUseConsumable(run, 'elixier_gleichklang', t.slice(0, 1), 'slot')).toBe(false);
    expect(canUseConsumable(run, 'elixier_gleichklang', t, 'slot')).toBe(true);
    applyConsumable(run, 'elixier_gleichklang', t);
    for (const id of t) expect(find(run, id).rank).toBe(9);
  });

  it('Gleichklang mit gleichen Rängen verändert nichts', () => {
    const run = inRound('RANK0003');
    const t = ids(hand(run), 2);
    for (const id of t) find(run, id).rank = 12;
    applyConsumable(run, 'elixier_gleichklang', t);
    for (const id of t) expect(find(run, id).rank).toBe(12);
  });

  it('Spektralglas: häufigste Suit gewinnt, bei Gleichstand die frühere in SUITS', () => {
    const run = inRound('SUIT0001');
    const t = ids(hand(run), 4);
    t.forEach((id, i) => { find(run, id).suit = (['H', 'H', 'D', 'C'] as const)[i]; });
    applyConsumable(run, 'elixier_spektralglas', t);
    for (const id of t) expect(find(run, id).suit).toBe('H');
    // Gleichstand 2 gegen 2: Spades steht vor Clubs in SUITS
    const run2 = inRound('SUIT0002');
    const t2 = ids(hand(run2), 4);
    t2.forEach((id, i) => { find(run2, id).suit = (['C', 'S', 'C', 'S'] as const)[i]; });
    applyConsumable(run2, 'elixier_spektralglas', t2);
    for (const id of t2) expect(find(run2, id).suit).toBe('S');
    expect(SUITS[0]).toBe('S');
  });

  it('commonestSuit: leere Liste ergibt die erste Suit', () => {
    expect(commonestSuit([])).toBe(SUITS[0]);
  });
});

describe('Abguss und Editions Firnisse', () => {
  it('Abguss überträgt das Enhancement auf 2 andere Karten und bevorzugt Karten ohne dieses Enhancement', () => {
    const run = inRound('CAST0001');
    const src = hand(run)[0];
    expect(canUseConsumable(run, 'elixier_abguss', [src.id], 'slot')).toBe(false);
    find(run, src.id).enhancement = 'rubin';
    // alle anderen außer zweien haben es schon
    for (const c of hand(run).slice(1, 6)) find(run, c.id).enhancement = 'rubin';
    expect(canUseConsumable(run, 'elixier_abguss', [src.id], 'slot')).toBe(true);
    const res = applyConsumable(run, 'elixier_abguss', [src.id]);
    expect(res.changed).toHaveLength(2);
    // die beiden Karten ohne Enhancement (Positionen 6 und 7) erhalten es
    for (const c of hand(run).slice(6, 8)) expect(find(run, c.id).enhancement).toBe('rubin');
    expect(Object.keys(ENHANCEMENTS)).toContain('rubin');
  });

  it('Abguss ist deterministisch und Ziel bleibt unverändert', () => {
    const go = () => {
      const run = inRound('CAST0002');
      const src = hand(run)[0];
      find(run, src.id).enhancement = 'gold';
      applyConsumable(run, 'elixier_abguss', [src.id]);
      return snap(run);
    };
    expect(go()).toBe(go());
  });

  it('Glanzfirnis und Flammenfirnis vergeben feste Editions auf genau eine Karte', () => {
    const run = inRound('VARN0001');
    const [a, b] = ids(hand(run), 2);
    applyConsumable(run, 'elixier_glanzfirnis', [a]);
    applyConsumable(run, 'elixier_flammenfirnis', [b]);
    expect(find(run, a).edition).toBe('schimmer');
    expect(find(run, b).edition).toBe('aura');
    expect(canUseConsumable(run, 'elixier_glanzfirnis', [a, b], 'slot')).toBe(false);
  });

  it('Prismenopfer: Prisma auf das Ziel, 2 andere Karten zerstört, braucht 3 Karten im Pool', () => {
    const run = inRound('PRISM001');
    const t = hand(run)[0].id;
    const res = applyConsumable(run, 'omen_prismenopfer', [t]);
    expect(find(run, t).edition).toBe('prisma');
    expect(res.destroyed).toHaveLength(2);
    expect(res.destroyed).not.toContain(t);
    expect(run.deck).toHaveLength(50);
    // Randfall: nur noch 2 Handkarten
    run.round!.hand = run.round!.hand.slice(0, 2);
    expect(canUseConsumable(run, 'omen_prismenopfer', [run.round!.hand[0].id], 'slot')).toBe(false);
  });

  it('Prismenopfer ist deterministisch pro Seed', () => {
    const go = () => {
      const run = inRound('PRISM002');
      applyConsumable(run, 'omen_prismenopfer', [hand(run)[3].id]);
      return snap(run);
    };
    expect(go()).toBe(go());
  });
});

describe('Geld: Pfandsiegel und Goldwaage', () => {
  it('Pfandsiegel zerstört die Karte und zahlt $3', () => {
    const run = inRound('PAWN0001');
    const t = hand(run)[0].id;
    const money = run.money;
    const res = applyConsumable(run, 'elixier_pfandsiegel', [t]);
    expect(res.destroyed).toEqual([t]);
    expect(run.money).toBe(money + 3);
    expect(run.deck).toHaveLength(51);
    expect(hand(run).some((c) => c.id === t)).toBe(false);
  });

  it('Goldwaage zählt Karten mit Enhancement, Seal oder Edition und hat einen Deckel', () => {
    const run = createRun({ seed: 'SCALE001' });
    const money = run.money;
    applyConsumable(run, 'elixier_goldwaage');
    expect(run.money).toBe(money); // nichts im Deck verändert
    run.deck.slice(0, 3).forEach((c, i) => { if (i === 0) c.enhancement = 'gold'; if (i === 1) c.seal = 'echo'; if (i === 2) c.edition = 'aura'; });
    applyConsumable(run, 'elixier_goldwaage');
    expect(run.money).toBe(money + 3);
    for (const c of run.deck.slice(0, 20)) c.enhancement = 'gold';
    const before = run.money;
    applyConsumable(run, 'elixier_goldwaage');
    expect(run.money).toBe(before + 10);
  });
});

describe('Level: Leitstern und Gestirnsopfer', () => {
  it('ohne gespielte Hand nicht benutzbar', () => {
    const run = createRun({ seed: 'LEVEL001' });
    expect(canUseConsumable(run, 'elixier_leitstern', [], 'slot')).toBe(false);
    expect(canUseConsumable(run, 'omen_gestirnsopfer', [], 'slot')).toBe(false);
    expect(levelUpPreview(run, 'elixier_leitstern')).toBeNull();
  });

  it('mostPlayedHand: Gleichstand geht an die bessere Hand', () => {
    expect(mostPlayedHand({})).toBeNull();
    expect(mostPlayedHand({ pair: 3, flush: 3, highCard: 1 })).toBe('flush');
    expect(mostPlayedHand({ pair: 4, flush: 3 })).toBe('pair');
  });

  it('Leitstern hebt nur die meistgespielte Hand um 1 Level', () => {
    const run = createRun({ seed: 'LEVEL002' });
    run.handsPlayed.pair = 5; run.handsPlayed.highCard = 2;
    const before = { ...run.handLevels };
    const preview = levelUpPreview(run, 'elixier_leitstern');
    expect(preview?.kind === 'hand' && preview.row?.type).toBe('pair');
    const res = applyConsumable(run, 'elixier_leitstern');
    expect(run.handLevels.pair).toBe(before.pair + 1);
    for (const h of HAND_ORDER) if (h !== 'pair') expect(run.handLevels[h]).toBe(before[h]);
    expect(res.message).toContain(':');
  });

  it('Gestirnsopfer: +3 für die Lieblingshand, -1 für alle anderen, nie unter Level 1', () => {
    const run = createRun({ seed: 'LEVEL003' });
    run.handsPlayed.flush = 4;
    run.handLevels.pair = 4;
    applyConsumable(run, 'omen_gestirnsopfer');
    expect(run.handLevels.flush).toBe(4);
    expect(run.handLevels.pair).toBe(3);
    expect(run.handLevels.highCard).toBe(1);
    for (const h of HAND_ORDER) expect(run.handLevels[h]).toBeGreaterThanOrEqual(1);
  });
});

describe('Tags: Nachtlicht, Bannwasser, Kometenschweif', () => {
  it('legen ihren Tag ab, Nachtlicht gibt in der nächsten Runde eine Hand mehr', () => {
    const base = createRun({ seed: 'TAG00001' });
    selectBlind(base);
    const baseHands = base.round!.handsLeft;
    const run = createRun({ seed: 'TAG00001' });
    applyConsumable(run, 'elixier_nachtlicht');
    expect(run.pendingTags).toEqual(['nachtwache']);
    selectBlind(run);
    expect(run.round!.handsLeft).toBe(baseHands + 1);
    expect(run.pendingTags).toEqual([]);
  });

  it('Bannwasser legt den Schutzzauber ab, benutzbar in jeder Phase', () => {
    const run = createRun({ seed: 'TAG00002' });
    expect(canUseConsumable(run, 'elixier_bannwasser', [], 'slot')).toBe(true);
    applyConsumable(run, 'elixier_bannwasser');
    expect(run.pendingTags).toEqual(['schutzzauber']);
  });

  it('Kometenschweif: gratis Rare Joker im nächsten Shop, Geld halbiert (abgerundet verloren)', () => {
    const run = createRun({ seed: 'TAG00003' });
    run.money = 9;
    applyConsumable(run, 'omen_kometenschweif');
    expect(run.money).toBe(5);
    expect(run.pendingTags).toEqual(['supernova']);
    openShop(run);
    const free = run.shop!.cards.filter((c) => c && c.kind === 'joker' && c.price === 0);
    expect(free).toHaveLength(1);
    expect(run.pendingTags).toEqual([]);
    run.money = 0;
    applyConsumable(run, 'omen_kometenschweif');
    expect(run.money).toBe(0);
    run.money = -3;
    applyConsumable(run, 'omen_kometenschweif');
    expect(run.money).toBe(-3);
  });
});

describe('Runden Effekte: Aufwind und Stundenglas', () => {
  it('Aufwind zieht 2 Karten, nur in einer Runde und nur mit Nachziehstapel', () => {
    const run = inRound('DRAW0001');
    const h = hand(run).length;
    const d = run.round!.drawPile.length;
    const res = applyConsumable(run, 'elixier_aufwind');
    expect(hand(run)).toHaveLength(h + 2);
    expect(run.round!.drawPile).toHaveLength(d - 2);
    expect(res.changed).toHaveLength(2);
    run.round!.drawPile = run.round!.drawPile.slice(0, 1);
    applyConsumable(run, 'elixier_aufwind');
    expect(run.round!.drawPile).toHaveLength(0);
    expect(canUseConsumable(run, 'elixier_aufwind', [], 'slot')).toBe(false);
    expect(isRoundOnlyConsumable(CONSUMABLE_BY_ID['elixier_aufwind'])).toBe(true);
    const out = createRun({ seed: 'DRAW0002' });
    expect(canUseConsumable(out, 'elixier_aufwind', [], 'slot')).toBe(false);
  });

  it('Stundenglas gibt 2 Discards nur für diese Runde', () => {
    const run = inRound('DISC0001');
    const d = run.round!.discardsLeft;
    const base = run.discards;
    applyConsumable(run, 'elixier_stundenglas');
    expect(run.round!.discardsLeft).toBe(d + 2);
    expect(run.discards).toBe(base);
    const out = createRun({ seed: 'DISC0002' });
    expect(canUseConsumable(out, 'elixier_stundenglas', [], 'slot')).toBe(false);
  });
});

describe('Omen mit Jokers', () => {
  it('Lichtschleifer: Edition für einen Joker ohne Edition, -1 Hand Size, Randfälle', () => {
    const run = inRound('JED00001');
    expect(canUseConsumable(run, 'omen_lichtschleifer', [], 'slot')).toBe(false);
    addJ(run, 'funke', { edition: 'prisma' });
    expect(canUseConsumable(run, 'omen_lichtschleifer', [], 'slot')).toBe(false);
    addJ(run, 'glut');
    const size = run.handSize;
    const roundSize = run.round!.handSize;
    const res = applyConsumable(run, 'omen_lichtschleifer');
    expect(res.joker).toBe('glut');
    expect(['schimmer', 'aura', 'prisma']).toContain(run.jokers[1].edition);
    expect(run.jokers[0].edition).toBe('prisma');
    expect(run.handSize).toBe(size - 1);
    expect(run.round!.handSize).toBe(roundSize - 1);
    // Hand Size kann nicht unter das Minimum fallen
    run.handSize = MIN_HAND_SIZE;
    addJ(run, 'frost');
    expect(canUseConsumable(run, 'omen_lichtschleifer', [], 'slot')).toBe(false);
  });

  it('Lichtschleifer ist deterministisch pro Seed', () => {
    const go = () => {
      const run = createRun({ seed: 'JED00002' });
      for (const j of ['funke', 'glut', 'frost']) addJ(run, j);
      applyConsumable(run, 'omen_lichtschleifer');
      return snap(run);
    };
    expect(go()).toBe(go());
  });

  it('Zwillingsflamme: Kopie bei Erfolg, Zerstörung bei Misserfolg, freier Slot nötig', () => {
    const win = createRun({ seed: 'TWIN0001' });
    win.rules.probMult = 100;
    addJ(win, 'funke');
    win.jokers[0].vars = { x: 3 };
    expect(canUseConsumable(win, 'omen_zwillingsflamme', [], 'slot')).toBe(true);
    const res = applyConsumable(win, 'omen_zwillingsflamme');
    expect(win.jokers).toHaveLength(2);
    expect(win.jokers[1].defId).toBe('funke');
    expect(win.jokers[1].uid).not.toBe(win.jokers[0].uid);
    expect(win.jokers[1].vars).toEqual({ x: 3 });
    expect(win.jokers[1].vars).not.toBe(win.jokers[0].vars);
    expect(win.jokers[1].edition).toBeUndefined();
    expect(res.destroyedJokers).toBe(0);

    const lose = createRun({ seed: 'TWIN0002' });
    lose.rules.probMult = 0;
    addJ(lose, 'funke'); addJ(lose, 'glut');
    const res2 = applyConsumable(lose, 'omen_zwillingsflamme');
    expect(lose.jokers).toHaveLength(1);
    expect(res2.destroyedJokers).toBe(1);

    const full = createRun({ seed: 'TWIN0003' });
    const cap = jokerCapacity(full);
    const pool = allJokers().filter((j) => j.copyCompat).slice(0, cap);
    for (const j of pool) addJoker(full, j.id);
    expect(full.jokers).toHaveLength(cap);
    expect(canUseConsumable(full, 'omen_zwillingsflamme', [], 'slot')).toBe(false);
  });

  it('Zwillingsflamme kopiert keine Jokers, die nicht kopierbar sind', () => {
    const run = createRun({ seed: 'TWIN0004' });
    const bad = allJokers().find((j) => j.copyCompat === false);
    if (!bad) return; // aktuell gibt es keinen solchen Joker, dann ist nichts zu prüfen
    addJ(run, bad.id);
    expect(canUseConsumable(run, 'omen_zwillingsflamme', [], 'slot')).toBe(false);
  });

  it('Zwillingsflamme ist deterministisch pro Seed', () => {
    const go = () => {
      const run = createRun({ seed: 'TWIN0005' });
      for (const j of ['funke', 'glut', 'frost']) addJ(run, j);
      applyConsumable(run, 'omen_zwillingsflamme');
      return snap(run);
    };
    expect(go()).toBe(go());
  });

  it('Wandlung ersetzt einen Joker durch einen der nächsten Rarity, behält Stelle und Edition, alle Hände -1 Level', () => {
    const run = createRun({ seed: 'WAND0001' });
    const rare = allJokers().find((j) => j.rarity === 'rare')!;
    addJ(run, rare.id);
    expect(canUseConsumable(run, 'omen_wandlung', [], 'slot')).toBe(false);
    const low = allJokers().filter((j) => j.rarity === 'common' || j.rarity === 'uncommon').slice(0, 2);
    addJ(run, low[0].id, { edition: 'aura' });
    run.handLevels.pair = 3;
    const before = run.jokers[1];
    expect(canUseConsumable(run, 'omen_wandlung', [], 'slot')).toBe(true);
    const res = applyConsumable(run, 'omen_wandlung');
    expect(run.jokers).toHaveLength(2);
    expect(run.jokers[0].defId).toBe(rare.id);
    expect(run.jokers[1].defId).toBe(res.joker);
    expect(run.jokers[1].uid).not.toBe(before.uid);
    expect(run.jokers[1].edition).toBe('aura');
    const oldRarity = getJoker(before.defId)!.rarity;
    const newRarity = getJoker(res.joker!)!.rarity;
    expect(JOKER_UPGRADE_CHAIN.indexOf(newRarity)).toBe(JOKER_UPGRADE_CHAIN.indexOf(oldRarity) + 1);
    expect(run.handLevels.pair).toBe(2);
    expect(run.handLevels.highCard).toBe(1);
  });

  it('Wandlung ist deterministisch pro Seed', () => {
    const go = () => {
      const run = createRun({ seed: 'WAND0002' });
      const low = allJokers().find((j) => j.rarity === 'common')!;
      addJ(run, low.id);
      applyConsumable(run, 'omen_wandlung');
      return snap(run);
    };
    expect(go()).toBe(go());
  });
});

describe('Omen mit Slots, Hand Size und Hands', () => {
  it('Nachtauge: +1 Hand Size, 3 Karten zerstört, Obergrenze', () => {
    const run = inRound('EYE00001');
    const size = run.handSize;
    const res = applyConsumable(run, 'omen_nachtauge');
    expect(res.destroyed).toHaveLength(3);
    expect(run.handSize).toBe(size + 1);
    expect(run.round!.handSize).toBe(size + 1);
    expect(run.deck).toHaveLength(49);
    run.handSize = MAX_HAND_SIZE;
    expect(canUseConsumable(run, 'omen_nachtauge', [], 'slot')).toBe(false);
    const shop = createRun({ seed: 'EYE00002' });
    expect(canUseConsumable(shop, 'omen_nachtauge', [], 'slot')).toBe(false); // ohne Karten in der Hand nichts zu zerstören
  });

  it('Nachtauge ist deterministisch pro Seed', () => {
    const go = () => { const run = inRound('EYE00003'); applyConsumable(run, 'omen_nachtauge'); return snap(run); };
    expect(go()).toBe(go());
  });

  it('Alchemistenbeutel: +1 Consumable Slot, -1 Hand Size, Grenzen', () => {
    const run = createRun({ seed: 'BAG00001' });
    const slots = run.consumableSlots;
    const size = run.handSize;
    applyConsumable(run, 'omen_alchemistenbeutel');
    expect(run.consumableSlots).toBe(slots + 1);
    expect(run.handSize).toBe(size - 1);
    run.consumableSlots = MAX_CONSUMABLE_SLOTS;
    expect(canUseConsumable(run, 'omen_alchemistenbeutel', [], 'slot')).toBe(false);
    run.consumableSlots = 2;
    run.handSize = MIN_HAND_SIZE;
    expect(canUseConsumable(run, 'omen_alchemistenbeutel', [], 'slot')).toBe(false);
  });

  it('Abendruhe: -1 Hand, +2 Discards, nie unter 1 Hand', () => {
    const run = inRound('REST0001');
    const h = run.round!.handsLeft;
    const d = run.round!.discardsLeft;
    const hands = run.hands;
    const discards = run.discards;
    applyConsumable(run, 'omen_abendruhe');
    expect(run.hands).toBe(hands - 1);
    expect(run.discards).toBe(discards + 2);
    expect(run.round!.handsLeft).toBe(h - 1);
    expect(run.round!.discardsLeft).toBe(d + 2);
    run.round!.handsLeft = 1;
    expect(canUseConsumable(run, 'omen_abendruhe', [], 'slot')).toBe(false);
    run.round!.handsLeft = 3;
    run.hands = 1;
    expect(canUseConsumable(run, 'omen_abendruhe', [], 'slot')).toBe(false);
  });

  it('Farbsturm: 2 Karten zerstört, alle übrigen Handkarten werden eine Suit', () => {
    const run = inRound('STORM001');
    const res = applyConsumable(run, 'omen_farbsturm');
    expect(res.destroyed).toHaveLength(2);
    const left = hand(run);
    expect(left).toHaveLength(6);
    expect(new Set(left.map((c) => c.suit)).size).toBe(1);
    expect(SUITS).toContain(left[0].suit);
    // dieselbe Suit im Deck
    for (const c of left) expect(find(run, c.id).suit).toBe(left[0].suit);
    run.round!.hand = run.round!.hand.slice(0, 2);
    expect(canUseConsumable(run, 'omen_farbsturm', [], 'slot')).toBe(false);
  });

  it('Farbsturm ist deterministisch pro Seed', () => {
    const go = () => { const run = inRound('STORM002'); applyConsumable(run, 'omen_farbsturm'); return snap(run); };
    expect(go()).toBe(go());
  });
});

describe('Ziehen mit Gewichten', () => {
  it('seltenere Karten (weight kleiner 1) werden seltener gezogen, alle neuen können erscheinen', () => {
    const run = createRun({ seed: 'WGT00001' });
    const rng = rngOf(run);
    const count: Record<string, number> = {};
    for (let i = 0; i < 6000; i++) {
      const c = rollConsumable(run, rng, 'elixier', `wgt_${i}`)!;
      count[c.id] = (count[c.id] ?? 0) + 1;
    }
    expect(count['elixier_flammenfirnis']).toBeLessThan(count['elixier_glanzfirnis'] * 0.85);
    for (const id of NEW_IDS.filter((i) => i.startsWith('elixier_'))) expect(count[id], id).toBeGreaterThan(0);
    const omen: Record<string, number> = {};
    for (let i = 0; i < 4000; i++) {
      const c = rollConsumable(run, rng, 'omen', `wgo_${i}`)!;
      omen[c.id] = (omen[c.id] ?? 0) + 1;
    }
    for (const id of NEW_IDS.filter((i) => i.startsWith('omen_'))) expect(omen[id], id).toBeGreaterThan(0);
  });

  it('Ziehen ist deterministisch pro Seed', () => {
    const draw = () => {
      const run = createRun({ seed: 'WGT00002' });
      const rng = rngOf(run);
      return Array.from({ length: 30 }, (_, i) => rollConsumable(run, rng, i % 2 ? 'omen' : 'elixier', `d_${i}`)!.id).join(',');
    };
    expect(draw()).toBe(draw());
  });
});
