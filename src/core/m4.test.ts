import './index';
import { describe, expect, it } from 'vitest';
import { CONSUMABLES, CONSUMABLE_BY_ID, PACK_HAND_SIZE } from '../data/consumables';
import { ENHANCEMENTS, SEALS } from '../data/modifiers';
import { PACKS } from '../data/packs';
import { HAND_DATA, HAND_ORDER } from '../data/hands';
import { TAGS } from '../data/tags';
import { VOUCHERS } from '../data/vouchers';
import { migrateRun } from '../save';
import {
  addConsumable, applyConsumable, canUseConsumable, consumableSellValue, createStarSealConsumables, freeConsumableSlots,
  sellConsumable, sternbildFor, useConsumable,
} from './consumables';
import {
  afterHand, buyAndUse, buyCard, buyPack, buyVoucher, canBuyAndUse, canBuyCard, canPick, cashOut, createRun, leaveShop, openPack,
  openShop, pickFromPack, playHand, selectBlind, skipBlind, useConsumable as useConsumableAction, VOUCHER_BY_ID,
} from './game';
import { rollConsumable } from './generate';
import { rngOf, type RunState } from './run';
import type { Card } from './types';

/** Run in einer laufenden Runde mit Ziel, das nicht erreicht wird */
function inRound(seed: string, deckId?: string): RunState {
  const run = createRun({ seed, deckId });
  selectBlind(run);
  run.round!.target = 1e12;
  return run;
}

function wonRound(run: RunState) {
  selectBlind(run);
  run.round!.score = run.round!.target;
  afterHand(run);
  return cashOut(run);
}

const ids = (cards: Card[], n: number) => cards.slice(0, n).map((c) => c.id);
const find = (run: RunState, id: number) => run.deck.find((c) => c.id === id)!;

describe('Consumable Daten', () => {
  it('eindeutige IDs, drei Typen, ein Sternbild pro Handtyp', () => {
    expect(new Set(CONSUMABLES.map((c) => c.id)).size).toBe(CONSUMABLES.length);
    expect(new Set(CONSUMABLES.map((c) => c.type))).toEqual(new Set(['sternbild', 'elixier', 'omen']));
    const sternbilder = CONSUMABLES.filter((c) => c.type === 'sternbild');
    expect(sternbilder).toHaveLength(HAND_ORDER.length);
    for (const h of HAND_ORDER) expect(sternbilder.some((c) => c.effect.kind === 'levelHand' && c.effect.hand === h)).toBe(true);
  });

  it('Enhancements und Seals der Elixiere existieren, Kosten sind positiv', () => {
    for (const c of CONSUMABLES) {
      expect(c.cost).toBeGreaterThan(0);
      if (c.effect.kind === 'enhance') expect(ENHANCEMENTS[c.effect.enhancement]).toBeDefined();
      if (c.effect.kind === 'seal') expect(SEALS[c.effect.seal]).toBeDefined();
      if (c.targets) expect(c.targets.min).toBeLessThanOrEqual(c.targets.max);
    }
  });

  it('keine Gedankenstriche in Namen und Beschreibungen', () => {
    const texts = [...CONSUMABLES, ...VOUCHERS, ...TAGS].flatMap((x) => [x.name, x.description]);
    for (const t of texts) expect(t).not.toMatch(/[–—]| - /);
  });

  it('Packs: Consumable Packs in Normal, Jumbo, Mega', () => {
    for (const kind of ['sternbild', 'elixier', 'omen']) {
      const sizes = PACKS.filter((p) => p.kind === kind).map((p) => p.size);
      expect(sizes).toEqual(['normal', 'jumbo', 'mega']);
    }
  });
});

describe('Consumable Slots', () => {
  it('2 Slots, kein dritter, Verkauf aus dem Kaufpreis', () => {
    const run = createRun({ seed: 'SLOT0001' });
    expect(run.consumableSlots).toBe(2);
    expect(addConsumable(run, 'sternbild_pair', 3)).not.toBeNull();
    expect(addConsumable(run, 'sternbild_flush', 3)).not.toBeNull();
    expect(freeConsumableSlots(run)).toBe(0);
    expect(addConsumable(run, 'sternbild_straight', 3)).toBeNull();
    const money = run.money;
    expect(consumableSellValue(run.consumables[0])).toBe(1);
    expect(sellConsumable(run, run.consumables[0].uid)).toBe(true);
    expect(run.money).toBe(money + 1);
    expect(freeConsumableSlots(run)).toBe(1);
  });

  it('Beutel und Rucksack erhöhen die Slots, Rucksack erst nach dem Beutel', () => {
    const run = createRun({ seed: 'SLOT0002' });
    run.anteVoucher = 'beutel';
    wonRound(run);
    run.money = 50;
    expect(buyVoucher(run)).toBe(true);
    expect(run.consumableSlots).toBe(3);
    run.anteVoucher = 'rucksack';
    run.shop!.voucher = { voucherId: 'rucksack', price: 10 };
    expect(buyVoucher(run)).toBe(true);
    expect(run.consumableSlots).toBe(4);
    expect(VOUCHER_BY_ID.rucksack.requires).toBe('beutel');
  });
});

describe('Sternbilder', () => {
  it('heben das Level ihrer Hand, auch im Shop benutzbar', () => {
    const run = createRun({ seed: 'STERN001' });
    addConsumable(run, 'sternbild_flush', 3);
    expect(useConsumable(run, run.consumables[0].uid)).not.toBeNull();
    expect(run.handLevels.flush).toBe(2);
    expect(run.consumables).toHaveLength(0);
  });

  it('geheime Hände erscheinen erst nach dem ersten Spielen', () => {
    const run = createRun({ seed: 'STERN002' });
    const rng = rngOf(run);
    for (let i = 0; i < 300; i++) {
      const def = rollConsumable(run, rng, 'sternbild', 'test_stern')!;
      if (def.effect.kind === 'levelHand') expect(HAND_DATA[def.effect.hand].secret).toBe(false);
    }
    run.handsPlayed.flushFive = 1;
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) seen.add(rollConsumable(run, rng, 'sternbild', 'test_stern2')!.id);
    expect(seen.has('sternbild_flushFive')).toBe(true);
    expect(seen.has('sternbild_fiveKind')).toBe(false);
  });

  it('Fernrohr und Großfernrohr setzen den Faktor über den Voucher', () => {
    const run = createRun({ seed: 'STERN005' });
    wonRound(run);
    run.money = 100;
    run.shop!.voucher = { voucherId: 'fernrohr', price: 10 };
    buyVoucher(run);
    expect(run.rules.sternbildXMult).toBe(1.5);
    run.shop!.voucher = { voucherId: 'grossfernrohr', price: 10 };
    buyVoucher(run);
    expect(run.rules.sternbildXMult).toBe(2);
  });

  it('Fernrohr: Sternbild im Slot gibt X1,5 Mult auf die gespielte Hand', () => {
    const base = inRound('STERN003');
    const withVoucher = inRound('STERN003');
    withVoucher.rules.sternbildXMult = 1.5;
    for (const r of [base, withVoucher]) {
      r.round!.hand = [{ id: 901, rank: 9, suit: 'S' }];
      addConsumable(r, 'sternbild_highCard', 3);
    }
    const a = playHand(base, [901]);
    const b = playHand(withVoucher, [901]);
    expect(b.events.some((e) => e.phase === 'consumable' && e.xMult === 1.5)).toBe(true);
    expect(b.total).toBe(Math.floor(a.chips * a.mult * 1.5));
  });

  it('Fernrohr wirkt nur für die Hand des Sternbilds', () => {
    const run = inRound('STERN004');
    run.rules.sternbildXMult = 2;
    run.round!.hand = [{ id: 902, rank: 9, suit: 'S' }];
    addConsumable(run, 'sternbild_pair', 3);
    const r = playHand(run, [902]);
    expect(r.events.some((e) => e.phase === 'consumable')).toBe(false);
  });
});

describe('Elixiere', () => {
  it('Enhancement auf bis zu 2 Karten, bleibt nach Speichern und Laden erhalten', () => {
    const run = inRound('ELIX0001');
    const targets = ids(run.round!.hand, 2);
    addConsumable(run, 'elixier_kupfer', 3);
    const res = useConsumable(run, run.consumables[0].uid, targets)!;
    expect(res.changed).toEqual(targets);
    const reloaded = JSON.parse(JSON.stringify(run)) as RunState;
    for (const id of targets) {
      expect(find(run, id).enhancement).toBe('kupfer');
      expect(reloaded.round!.hand.find((c) => c.id === id)!.enhancement).toBe('kupfer');
    }
  });

  it('Änderungen wirken auch nach dem Laden auf Hand, Stapel und Deck zugleich', () => {
    const run = JSON.parse(JSON.stringify(inRound('ELIX0002'))) as RunState;
    const id = run.round!.hand[0].id;
    expect(run.round!.hand[0]).not.toBe(run.deck.find((c) => c.id === id));
    addConsumable(run, 'elixier_gold', 3);
    useConsumable(run, run.consumables[0].uid, [id]);
    expect(run.round!.hand[0].enhancement).toBe('gold');
    expect(find(run, id).enhancement).toBe('gold');
  });

  it('Zielzahl wird geprüft: keine, zu viele oder fremde Karten sind nicht erlaubt', () => {
    const run = inRound('ELIX0003');
    const hand = run.round!.hand;
    expect(canUseConsumable(run, 'elixier_kupfer', [], 'slot')).toBe(false);
    expect(canUseConsumable(run, 'elixier_kupfer', ids(hand, 3), 'slot')).toBe(false);
    expect(canUseConsumable(run, 'elixier_kupfer', [9999], 'slot')).toBe(false);
    expect(canUseConsumable(run, 'elixier_kupfer', [hand[0].id, hand[0].id], 'slot')).toBe(false);
    expect(canUseConsumable(run, 'elixier_kupfer', ids(hand, 2), 'slot')).toBe(true);
    expect(canUseConsumable(run, 'elixier_echo', ids(hand, 2), 'slot')).toBe(false);
  });

  it('Elixiere mit Zielen sind außerhalb einer Runde nicht benutzbar', () => {
    const run = createRun({ seed: 'ELIX0004' });
    expect(canUseConsumable(run, 'elixier_kupfer', [run.deck[0].id], 'slot')).toBe(false);
  });

  it('Seal, Suit und Rang', () => {
    const run = inRound('ELIX0005');
    const [a, b, c] = run.round!.hand;
    applyConsumable(run, 'elixier_echo', [a.id]);
    expect(find(run, a.id).seal).toBe('echo');
    applyConsumable(run, 'elixier_suit_H', [b.id, c.id]);
    expect(find(run, b.id).suit).toBe('H');
    expect(find(run, c.id).suit).toBe('H');
    const rank = find(run, a.id).rank;
    applyConsumable(run, 'elixier_aufstieg', [a.id]);
    expect(find(run, a.id).rank).toBe(rank === 14 ? 2 : rank + 1);
  });

  it('Aufstieg macht aus Ace eine 2', () => {
    const run = inRound('ELIX0006');
    const card = run.round!.hand[0];
    card.rank = 14;
    applyConsumable(run, 'elixier_aufstieg', [card.id]);
    expect(find(run, card.id).rank).toBe(2);
  });

  it('Auflösung zerstört Karten in Deck, Hand und Stapeln', () => {
    const run = inRound('ELIX0007');
    const total = run.deck.length;
    const t = ids(run.round!.hand, 2);
    const res = applyConsumable(run, 'elixier_aufloesung', t);
    expect(res.destroyed).toEqual(t);
    expect(run.deck).toHaveLength(total - 2);
    expect(run.round!.hand.some((c) => t.includes(c.id))).toBe(false);
  });

  it('Zerstört ein Elixier die letzte Karte, ist die Runde verloren statt festgefahren', () => {
    const run = inRound('ELIX0012');
    const last = run.round!.hand[0];
    run.round!.hand = [last];
    run.round!.drawPile = [];
    addConsumable(run, 'elixier_aufloesung', 3);
    expect(useConsumableAction(run, run.consumables[0].uid, [last.id])).not.toBeNull();
    expect(run.round!.hand).toHaveLength(0);
    expect(run.phase).toBe('gameOver');
  });

  it('Doppelgänger kopiert die Karte mit neuer ID in Deck und Hand', () => {
    const run = inRound('ELIX0008');
    const src = run.round!.hand[0];
    src.enhancement = 'rubin';
    const total = run.deck.length;
    const handSize = run.round!.hand.length;
    const res = applyConsumable(run, 'elixier_doppelgaenger', [src.id]);
    expect(res.created).toHaveLength(1);
    expect(res.created[0].id).not.toBe(src.id);
    expect(res.created[0].enhancement).toBe('rubin');
    expect(run.deck).toHaveLength(total + 1);
    expect(run.round!.hand).toHaveLength(handSize + 1);
  });

  it('Erntemond verdoppelt das Geld mit Deckel', () => {
    const run = createRun({ seed: 'ELIX0009' });
    run.money = 6;
    applyConsumable(run, 'elixier_erntemond');
    expect(run.money).toBe(12);
    run.money = 50;
    applyConsumable(run, 'elixier_erntemond');
    expect(run.money).toBe(70);
  });

  it('Sternkarte erzeugt Sternbilder, nur in freie Slots', () => {
    const run = createRun({ seed: 'ELIX0010' });
    addConsumable(run, 'elixier_sternkarte', 3);
    const res = useConsumable(run, run.consumables[0].uid)!;
    expect(res.consumables).toHaveLength(2);
    expect(run.consumables).toHaveLength(2);
    expect(run.consumables.every((c) => CONSUMABLE_BY_ID[c.defId].type === 'sternbild')).toBe(true);
    // volle Slots: Sternkarte darf nur benutzt werden, wenn sie selbst einen Slot frei macht
    run.consumables = [];
    addConsumable(run, 'elixier_sternkarte', 3);
    addConsumable(run, 'elixier_sternkarte', 3);
    const first = run.consumables[0].uid;
    expect(useConsumable(run, first)!.consumables).toHaveLength(1);
    expect(run.consumables).toHaveLength(2);
  });

  it('Alchemistentisch erzeugt Elixiere', () => {
    const run = createRun({ seed: 'ELIX0011' });
    addConsumable(run, 'elixier_alchemistentisch', 3);
    const res = useConsumable(run, run.consumables[0].uid)!;
    expect(res.consumables).toHaveLength(2);
    expect(run.consumables.every((c) => CONSUMABLE_BY_ID[c.defId].type === 'elixier')).toBe(true);
  });
});

describe('Omen', () => {
  it('Blutmond: 1 Karte zerstört, 3 neue Karten mit Enhancement', () => {
    const run = inRound('OMEN0001');
    const total = run.deck.length;
    const res = applyConsumable(run, 'omen_blutmond');
    expect(res.destroyed).toHaveLength(1);
    expect(res.created).toHaveLength(3);
    expect(res.created.every((c) => !!c.enhancement)).toBe(true);
    expect(run.deck).toHaveLength(total + 2);
  });

  it('Aschenregen: 2 Karten zerstört, alle Hände +1 Level', () => {
    const run = inRound('OMEN0002');
    applyConsumable(run, 'omen_aschenregen');
    expect(run.deck).toHaveLength(50);
    for (const h of HAND_ORDER) expect(run.handLevels[h]).toBe(2);
  });

  it('Blutmond und Aschenregen brauchen eine Hand (Runde oder Pack)', () => {
    const run = createRun({ seed: 'OMEN0003' });
    expect(canUseConsumable(run, 'omen_blutmond', [], 'slot')).toBe(false);
    expect(canUseConsumable(run, 'omen_aschenregen', [], 'slot')).toBe(false);
  });

  it('Teufelsmarkt: Rare Joker, Geld auf 0, braucht einen freien Joker Slot', () => {
    const run = createRun({ seed: 'OMEN0004' });
    run.money = 25;
    const res = applyConsumable(run, 'omen_teufelsmarkt');
    expect(run.jokers).toHaveLength(1);
    expect(res.joker).toBe(run.jokers[0].defId);
    expect(run.money).toBe(0);
    run.jokerSlots = 1;
    expect(canUseConsumable(run, 'omen_teufelsmarkt', [], 'direct')).toBe(false);
  });

  it('Hexenkessel: ein Joker mit Prisma, alle anderen zerstört', () => {
    const run = createRun({ seed: 'OMEN0005' });
    expect(canUseConsumable(run, 'omen_hexenkessel', [], 'direct')).toBe(false);
    for (const id of ['funke', 'glut', 'frost']) {
      run.jokers.push({ uid: run.nextUid++, defId: id, vars: {} });
    }
    const res = applyConsumable(run, 'omen_hexenkessel');
    expect(res.destroyedJokers).toBe(2);
    expect(run.jokers).toHaveLength(1);
    expect(run.jokers[0].edition).toBe('prisma');
  });

  it('Kometenstaub: zufällige Edition, dauerhaft -1 Hand Size', () => {
    const run = inRound('OMEN0006');
    const id = run.round!.hand[0].id;
    const size = run.handSize;
    applyConsumable(run, 'omen_kometenstaub', [id]);
    expect(['schimmer', 'aura', 'prisma']).toContain(find(run, id).edition);
    expect(run.handSize).toBe(size - 1);
  });

  it('Siegelsturm: Seal auf das Ziel, 2 andere Karten zerstört, Ziel überlebt', () => {
    const run = inRound('OMEN0007');
    const id = run.round!.hand[0].id;
    const res = applyConsumable(run, 'omen_siegelsturm', [id]);
    expect(find(run, id).seal).toBeDefined();
    expect(res.destroyed).toHaveLength(2);
    expect(res.destroyed).not.toContain(id);
  });

  it('Nachtpakt: +1 Hand, -1 Discard, auch in der laufenden Runde', () => {
    const run = inRound('OMEN0008');
    const h = run.round!.handsLeft;
    const d = run.round!.discardsLeft;
    applyConsumable(run, 'omen_nachtpakt');
    expect(run.hands).toBe(5);
    expect(run.round!.handsLeft).toBe(h + 1);
    expect(run.round!.discardsLeft).toBe(d - 1);
    run.discards = 0;
    expect(canUseConsumable(run, 'omen_nachtpakt', [], 'direct')).toBe(false);
  });

  it('Spiegelsaal: 2 Kopien, 2 andere Karten zerstört', () => {
    const run = inRound('OMEN0009');
    const src = run.round!.hand[0];
    const res = applyConsumable(run, 'omen_spiegelsaal', [src.id]);
    expect(res.created).toHaveLength(2);
    expect(res.destroyed).toHaveLength(2);
    expect(res.destroyed).not.toContain(src.id);
    expect(run.deck).toHaveLength(52);
  });

  it('Zufall ist deterministisch pro Seed', () => {
    const a = inRound('OMEN0010');
    const b = inRound('OMEN0010');
    expect(applyConsumable(a, 'omen_blutmond')).toEqual(applyConsumable(b, 'omen_blutmond'));
  });
});

describe('Shop mit Consumables', () => {
  it('Typ Wurf folgt den Gewichten: nur Sternbilder, wenn nur dieses Gewicht gilt', () => {
    const run = createRun({ seed: 'SHOPC001' });
    run.rules.typeWeights = { joker: 0, sternbild: 1, elixier: 0, karte: 0, omen: 0 };
    wonRound(run);
    for (const c of run.shop!.cards) {
      expect(c?.kind).toBe('consumable');
      if (c?.kind === 'consumable') expect(CONSUMABLE_BY_ID[c.defId].type).toBe('sternbild');
    }
  });

  it('Standardgewichte liefern Jokers, Sternbilder und Elixiere, keine Omen und Spielkarten', () => {
    const run = createRun({ seed: 'SHOPC002' });
    const kinds = new Set<string>();
    const types = new Set<string>();
    for (let i = 0; i < 60; i++) {
      run.phase = 'roundWon';
      openShop(run);
      for (const c of run.shop!.cards) {
        if (!c) continue;
        kinds.add(c.kind);
        if (c.kind === 'consumable') types.add(CONSUMABLE_BY_ID[c.defId].type);
      }
    }
    expect(kinds).toEqual(new Set(['joker', 'consumable']));
    expect(types).toEqual(new Set(['sternbild', 'elixier']));
  });

  it('Kauf in den Slot, voller Slot verhindert den Kauf, Preis wird abgezogen', () => {
    const run = createRun({ seed: 'SHOPC003' });
    run.rules.typeWeights = { joker: 0, sternbild: 0, elixier: 1, karte: 0, omen: 0 };
    wonRound(run);
    run.money = 50;
    const price = run.shop!.cards[0]!.price;
    expect(buyCard(run, 0)).toBe(true);
    expect(run.money).toBe(50 - price);
    expect(run.consumables).toHaveLength(1);
    expect(buyCard(run, 1)).toBe(true);
    expect(run.consumables).toHaveLength(2);
    run.shop!.cards[0] = { kind: 'consumable', defId: 'sternbild_pair', price: 3 };
    expect(canBuyCard(run, 0)).toBe(false);
  });

  it('Kaufen und Benutzen belegt keinen Slot, auch bei vollen Slots', () => {
    const run = createRun({ seed: 'SHOPC004' });
    wonRound(run);
    run.money = 50;
    addConsumable(run, 'elixier_kupfer', 3);
    addConsumable(run, 'elixier_kupfer', 3);
    run.shop!.cards[0] = { kind: 'consumable', defId: 'sternbild_flush', price: 3 };
    expect(canBuyAndUse(run, 0)).toBe(true);
    expect(buyAndUse(run, 0)).not.toBeNull();
    expect(run.handLevels.flush).toBe(2);
    expect(run.money).toBe(47);
    expect(run.consumables).toHaveLength(2);
    expect(run.shop!.cards[0]).toBeNull();
  });

  it('Kaufen und Benutzen geht nicht für Elixiere mit Karten Zielen', () => {
    const run = createRun({ seed: 'SHOPC005' });
    wonRound(run);
    run.money = 50;
    run.shop!.cards[0] = { kind: 'consumable', defId: 'elixier_kupfer', price: 3 };
    expect(canBuyAndUse(run, 0)).toBe(false);
  });

  it('Kartentisch bringt Spielkarten in den Shop, Kauf legt sie ins Deck', () => {
    const run = createRun({ seed: 'SHOPC006' });
    run.rules.typeWeights = { joker: 0, sternbild: 0, elixier: 0, karte: 1, omen: 0 };
    wonRound(run);
    run.money = 50;
    const item = run.shop!.cards[0]!;
    expect(item.kind).toBe('card');
    expect(item.price).toBe(1);
    const size = run.deck.length;
    expect(buyCard(run, 0)).toBe(true);
    expect(run.deck).toHaveLength(size + 1);
    expect(item.kind === 'card' && item.card.enhancement).toBeUndefined();
  });

  it('Veredlertisch: Spielkarten im Shop können Modifikatoren tragen', () => {
    const run = createRun({ seed: 'SHOPC007' });
    run.rules.typeWeights = { joker: 0, sternbild: 0, elixier: 0, karte: 1, omen: 0 };
    run.rules.shopCardMods = true;
    let mods = 0;
    for (let i = 0; i < 30; i++) {
      run.phase = 'roundWon';
      openShop(run);
      for (const c of run.shop!.cards) if (c?.kind === 'card' && (c.card.enhancement || c.card.seal || c.card.edition)) mods++;
    }
    expect(mods).toBeGreaterThan(0);
  });

  it('Sternenhändler und Kräuterhändler setzen die Gewichte, Kartentisch öffnet Spielkarten', () => {
    const run = createRun({ seed: 'SHOPC008' });
    expect(run.rules.typeWeights.sternbild).toBe(4);
    expect(run.rules.typeWeights.karte).toBe(0);
    wonRound(run);
    run.money = 100;
    for (const id of ['sternenhaendler', 'kraeuterhaendler', 'kartentisch']) {
      run.shop!.voucher = { voucherId: id, price: 10 };
      expect(buyVoucher(run)).toBe(true);
    }
    expect(run.rules.typeWeights.sternbild).toBe(9.6);
    expect(run.rules.typeWeights.elixier).toBe(9.6);
    expect(run.rules.typeWeights.karte).toBe(4);
    expect(VOUCHER_BY_ID.sternenmagnat.requires).toBe('sternenhaendler');
  });
});

describe('Consumable Packs', () => {
  it('Sternbild Pack: Auswahl wird sofort benutzt, kein Slot nötig', () => {
    const run = createRun({ seed: 'PACKC001' });
    wonRound(run);
    addConsumable(run, 'elixier_kupfer', 3);
    addConsumable(run, 'elixier_kupfer', 3);
    openPack(run, 'sternbild_normal', 'shop');
    expect(run.pack!.options).toHaveLength(3);
    expect(run.pack!.handIds).toBeUndefined();
    const opt = run.pack!.options[0]!;
    expect(opt.kind).toBe('consumable');
    const def = CONSUMABLE_BY_ID[(opt as { defId: string }).defId];
    const hand = def.effect.kind === 'levelHand' ? def.effect.hand : 'pair';
    expect(pickFromPack(run, 0)).not.toBe(false);
    expect(run.handLevels[hand]).toBe(2);
    expect(run.consumables).toHaveLength(2);
    expect(run.phase).toBe('shop');
  });

  it('Elixier Pack zeigt eine Hand aus dem Deck, Ziele müssen daraus stammen', () => {
    const run = createRun({ seed: 'PACKC002' });
    wonRound(run);
    run.pack = null;
    openPack(run, 'elixier_jumbo', 'shop');
    const p = run.pack!;
    expect(p.handIds).toHaveLength(PACK_HAND_SIZE);
    p.options[0] = { kind: 'consumable', defId: 'elixier_rubin' };
    expect(canPick(run, 0, [])).toBe(false);
    expect(canPick(run, 0, [9999])).toBe(false);
    const target = p.handIds![0];
    expect(canPick(run, 0, [target])).toBe(true);
    pickFromPack(run, 0, [target]);
    expect(find(run, target).enhancement).toBe('rubin');
    expect(run.phase).toBe('shop');
  });

  it('Mega Pack erlaubt 2 Wahlen, Zerstörung entfernt die Karte auch aus der Pack Hand', () => {
    const run = createRun({ seed: 'PACKC003' });
    wonRound(run);
    run.pack = null;
    openPack(run, 'elixier_mega', 'shop');
    const p = run.pack!;
    expect(p.picksLeft).toBe(2);
    p.options[0] = { kind: 'consumable', defId: 'elixier_aufloesung' };
    const target = p.handIds![0];
    pickFromPack(run, 0, [target]);
    expect(run.pack!.handIds).not.toContain(target);
    expect(run.deck.some((c) => c.id === target)).toBe(false);
    expect(run.phase).toBe('pack');
    expect(run.pack!.picksLeft).toBe(1);
  });

  it('Omen Pack benutzt Zufallsziele aus der Pack Hand', () => {
    const run = createRun({ seed: 'PACKC004' });
    wonRound(run);
    run.pack = null;
    openPack(run, 'omen_normal', 'shop');
    run.pack!.options[0] = { kind: 'consumable', defId: 'omen_blutmond' };
    const hand = [...run.pack!.handIds!];
    const total = run.deck.length;
    expect(pickFromPack(run, 0)).not.toBe(false);
    expect(run.deck).toHaveLength(total + 2);
    expect(hand.filter((id) => run.deck.some((c) => c.id === id))).toHaveLength(PACK_HAND_SIZE - 1);
  });

  it('Sternschnuppe und Alchemistenkiste öffnen sofort ein Mega Pack', () => {
    const run = createRun({ seed: 'PACKC005' });
    run.anteTags = { small: 'sternschnuppe', big: 'alchemistenkiste' };
    skipBlind(run);
    expect(run.phase).toBe('pack');
    expect(run.pack!.packId).toBe('sternbild_mega');
    pickFromPack(run, 0);
    pickFromPack(run, 1);
    expect(run.phase).toBe('blindSelect');
    skipBlind(run);
    expect(run.pack!.packId).toBe('elixier_mega');
    expect(run.pack!.handIds).toHaveLength(PACK_HAND_SIZE);
  });

  it('Kauf eines Consumable Packs im Shop und Rückkehr in den Shop', () => {
    const run = createRun({ seed: 'PACKC006' });
    wonRound(run);
    run.money = 50;
    run.shop!.packs[1] = { packId: 'sternbild_normal', price: 4 };
    expect(buyPack(run, 1)).toBe(true);
    expect(run.phase).toBe('pack');
    pickFromPack(run, 0);
    expect(run.phase).toBe('shop');
    leaveShop(run);
  });
});

describe('Stern Seal', () => {
  it('erzeugt am Rundenende das Sternbild der zuletzt gespielten Hand', () => {
    const run = inRound('SEAL0001');
    run.round!.hand = [
      { id: 801, rank: 9, suit: 'S' },
      { id: 802, rank: 5, suit: 'H', seal: 'stern' },
      { id: 803, rank: 6, suit: 'D', seal: 'stern' },
    ];
    playHand(run, [801]);
    run.round!.score = run.round!.target;
    afterHand(run);
    expect(run.phase).toBe('roundWon');
    const res = cashOut(run);
    expect(res.starSealCreated).toEqual(['sternbild_highCard', 'sternbild_highCard']);
    expect(run.consumables.map((c) => c.defId)).toEqual(['sternbild_highCard', 'sternbild_highCard']);
  });

  it('nur in freie Slots und nur, wenn eine Hand gespielt wurde', () => {
    const run = inRound('SEAL0002');
    run.round!.hand = [{ id: 811, rank: 5, suit: 'H', seal: 'stern' }];
    expect(createStarSealConsumables(run)).toEqual([]);
    run.round!.playedTypes = ['pair'];
    addConsumable(run, 'elixier_kupfer', 3);
    expect(createStarSealConsumables(run)).toEqual(['sternbild_pair']);
    expect(createStarSealConsumables(run)).toEqual([]);
    expect(sternbildFor('pair')!.id).toBe('sternbild_pair');
  });
});

describe('Spielstand Version 4', () => {
  it('Version 3 bekommt leere Consumables und die neuen Regeln', () => {
    const run = createRun({ seed: 'SAVE0004' });
    const v3: any = JSON.parse(JSON.stringify(run));
    v3.version = 3;
    delete v3.consumables;
    delete v3.rules.typeWeights;
    delete v3.rules.sternbildXMult;
    delete v3.rules.shopCardMods;
    const m = migrateRun(v3)!;
    expect(m.version).toBe(4);
    expect(m.consumables).toEqual([]);
    expect(m.rules.typeWeights.sternbild).toBe(4);
    expect(m.rules.sternbildXMult).toBe(1);
  });

  it('Consumables im Slot und in Packs überstehen Speichern und Laden', () => {
    const run = createRun({ seed: 'SAVE0005' });
    addConsumable(run, 'omen_blutmond', 4);
    wonRound(run);
    run.pack = null;
    openPack(run, 'elixier_normal', 'shop');
    const back = migrateRun(JSON.parse(JSON.stringify(run)))!;
    expect(back.consumables).toEqual(run.consumables);
    expect(back.pack).toEqual(run.pack);
    expect(back.shop).toEqual(run.shop);
  });
});
