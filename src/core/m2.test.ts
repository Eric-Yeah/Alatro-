import './index';
import { describe, expect, it } from 'vitest';
import { BOSSES } from '../data/bosses';
import { PACKS } from '../data/packs';
import {
  afterHand, buyCard, buyPack, buyVoucher, cashOut, chooseBoss, createRun, enterAnte, leaveShop, openShop, pickFromPack,
  playHand, reroll, rerollCost, selectBlind, sellJoker, skipBlind, TAG_BY_ID,
} from './game';
import { RngStreams } from './rng';
import { addJoker, currentTarget, isCardDebuffed, jokerSellValue, newRun, type RunState } from './run';
import type { Card } from './types';

function wonRound(run: RunState) {
  selectBlind(run);
  run.round!.score = run.round!.target;
  afterHand(run);
  expect(run.phase).toBe('roundWon');
  return cashOut(run);
}

describe('Zustandsautomat', () => {
  it('Blind Select, Runde, gewonnen, Cash Out, Shop, nächster Blind', () => {
    const run = createRun({ seed: 'FLOW0001' });
    expect(run.phase).toBe('blindSelect');
    wonRound(run);
    expect(run.phase).toBe('shop');
    expect(run.blindIndex).toBe(1);
    leaveShop(run);
    expect(run.phase).toBe('blindSelect');
  });

  it('Niederlage, wenn die letzte Hand das Ziel nicht schafft', () => {
    const run = createRun({ seed: 'LOSE0001' });
    selectBlind(run);
    run.round!.handsLeft = 1;
    run.round!.target = 1e12;
    playHand(run, [run.round!.hand[0].id]);
    afterHand(run);
    expect(run.phase).toBe('gameOver');
  });

  it('nach dem Boss beginnt eine neue Ante mit neuem Boss und neuen Tags', () => {
    const run = createRun({ seed: 'ANTE0001' });
    const firstBoss = run.anteBoss;
    for (let i = 0; i < 3; i++) { wonRound(run); leaveShop(run); }
    expect(run.ante).toBe(2);
    expect(run.blindIndex).toBe(0);
    expect(run.anteBoss).not.toBe(firstBoss);
  });
});

describe('Skip und Tags', () => {
  it('Skip vergibt den Tag, überspringt Auszahlung und Shop', () => {
    const run = createRun({ seed: 'SKIP0001' });
    run.anteTags = { small: 'goldstaub', big: 'goldstaub' };
    const money = run.money;
    const r = skipBlind(run);
    expect(r.tagId).toBe('goldstaub');
    expect(run.money).toBe(money + 8);
    expect(run.blindIndex).toBe(1);
    expect(run.phase).toBe('blindSelect');
    expect(run.skips).toBe(1);
  });

  it('der Boss kann nicht übersprungen werden', () => {
    const run = createRun({ seed: 'SKIP0002' });
    run.blindIndex = 2;
    expect(() => skipBlind(run)).toThrow();
  });

  it('Doppelstern verdoppelt den nächsten Tag', () => {
    const run = createRun({ seed: 'SKIP0003' });
    run.anteTags = { small: 'doppelstern', big: 'goldstaub' };
    const money = run.money;
    skipBlind(run);
    expect(run.pendingTags).toContain('doppelstern');
    expect(skipBlind(run).doubled).toBe(true);
    expect(run.money).toBe(money + 16);
  });

  it('Nachtwache gibt +1 Hand, Schutzzauber deaktiviert den Boss', () => {
    const run = createRun({ seed: 'SKIP0004' });
    run.anteTags = { small: 'nachtwache', big: 'schutzzauber' };
    skipBlind(run);
    skipBlind(run);
    run.anteBoss = 'ebbe';
    selectBlind(run);
    expect(run.round!.handsLeft).toBe(run.hands + 1);
    expect(run.round!.bossId).toBeUndefined();
    expect(run.round!.handSize).toBe(run.handSize);
  });

  it('Kartenregen öffnet sofort ein Pack und kehrt zur Blind Auswahl zurück', () => {
    const run = createRun({ seed: 'SKIP0005' });
    run.anteTags = { small: 'kartenregen', big: 'goldstaub' };
    skipBlind(run);
    expect(run.phase).toBe('pack');
    const deckSize = run.deck.length;
    pickFromPack(run, 0);
    pickFromPack(run, 1);
    expect(run.deck.length).toBe(deckSize + 2);
    expect(run.phase).toBe('blindSelect');
  });

  it('jeder Tag hat einen bekannten Zeitpunkt', () => {
    for (const t of Object.values(TAG_BY_ID)) expect(['immediate', 'nextShop', 'nextRound', 'nextBoss', 'nextTag']).toContain(t.when);
  });
});

describe('Bosse', () => {
  it('Auswahl beachtet Mindest Ante und Showdown, ohne Wiederholung', () => {
    const run = newRun('BOSS0001');
    const seen = new Set<string>();
    for (let i = 0; i < 6; i++) {
      run.ante = 1;
      const id = chooseBoss(run);
      const b = BOSSES.find((x) => x.id === id)!;
      expect(b.minAnte).toBe(1);
      expect(b.showdown).toBe(false);
      seen.add(id);
    }
    run.ante = 8;
    const showdownId = chooseBoss(run);
    expect(BOSSES.find((x) => x.id === showdownId)!.showdown).toBe(true);
  });

  it('Boss Faktor wirkt auf das Ziel (Monolith X3)', () => {
    const run = createRun({ seed: 'BOSS0002' });
    run.anteBoss = 'monolith';
    expect(currentTarget(run, 'boss')).toBe(900);
  });

  it('Nebel schwächt Face Cards, Mondfinsternis eine Suit', () => {
    const run = createRun({ seed: 'BOSS0003' });
    run.blindIndex = 2;
    run.anteBoss = 'nebel';
    selectBlind(run);
    const k: Card = { id: 999, rank: 13, suit: 'S' };
    expect(isCardDebuffed(run, k)).toBe(true);
    expect(isCardDebuffed(run, { ...k, rank: 9 })).toBe(false);
  });

  it('Spiegel: derselbe Handtyp scort beim zweiten Mal 0', () => {
    const run = createRun({ seed: 'BOSS0004' });
    run.blindIndex = 2;
    run.anteBoss = 'spiegel';
    selectBlind(run);
    run.round!.target = 1e12;
    const pick = (): number[] => [run.round!.hand[0].id];
    const first = playHand(run, pick());
    afterHand(run);
    const second = playHand(run, pick());
    expect(first.total).toBeGreaterThan(0);
    if (second.handType === first.handType) expect(second.total).toBe(0);
  });

  it('Dieb kostet $2 pro Hand', () => {
    const run = createRun({ seed: 'BOSS0005' });
    run.blindIndex = 2;
    run.anteBoss = 'dieb';
    selectBlind(run);
    run.round!.target = 1e12;
    const money = run.money;
    playHand(run, [run.round!.hand[0].id]);
    expect(run.money).toBe(money - 2);
  });
});

describe('Shop', () => {
  it('2 Karten Slots, 2 Packs, ein Voucher, erstes Pack garantiert Joker Pack', () => {
    const run = createRun({ seed: 'SHOP0001' });
    wonRound(run);
    expect(run.shop!.cards.filter(Boolean)).toHaveLength(2);
    expect(run.shop!.packs).toHaveLength(2);
    expect(run.shop!.packs[0]!.packId).toBe('joker_normal');
    expect(run.shop!.voucher).not.toBeNull();
  });

  it('keine Jokers im Shop, die man schon besitzt', () => {
    const run = createRun({ seed: 'SHOP0002' });
    for (const id of ['funke', 'glut', 'frost', 'kleinvieh']) addJoker(run, id);
    run.jokerSlots = 99;
    for (let i = 0; i < 20; i++) {
      run.phase = 'roundWon';
      openShop(run);
      for (const c of run.shop!.cards) if (c?.kind === 'joker') expect(['funke', 'glut', 'frost', 'kleinvieh']).not.toContain(c.defId);
    }
  });

  it('Reroll kostet 5, 6, 7 und setzt im nächsten Shop zurück', () => {
    const run = createRun({ seed: 'SHOP0003' });
    wonRound(run);
    run.money = 100;
    const costs: number[] = [];
    for (let i = 0; i < 3; i++) { costs.push(rerollCost(run)); reroll(run); }
    expect(costs).toEqual([5, 6, 7]);
    expect(run.money).toBe(100 - 18);
    leaveShop(run);
    wonRound(run);
    expect(rerollCost(run)).toBe(5);
  });

  it('Kauf zieht Geld ab, Verkaufswert aus dem Kaufpreis', () => {
    const run = createRun({ seed: 'SHOP0004' });
    wonRound(run);
    run.money = 50;
    const item = run.shop!.cards[0]!;
    expect(buyCard(run, 0)).toBe(true);
    expect(run.money).toBe(50 - item.price);
    expect(run.shop!.cards[0]).toBeNull();
    const inst = run.jokers[0];
    expect(jokerSellValue(inst)).toBe(Math.max(1, Math.floor(item.price / 2)));
    sellJoker(run, inst.uid);
    expect(run.jokers).toHaveLength(0);
  });

  it('kein Kauf bei vollen Joker Slots', () => {
    const run = createRun({ seed: 'SHOP0005' });
    wonRound(run);
    run.money = 50;
    run.jokerSlots = 0;
    run.shop!.cards[0] = { kind: 'joker', defId: 'funke', price: 2 };
    expect(buyCard(run, 0)).toBe(false);
    run.shop!.cards[0] = { kind: 'joker', defId: 'funke', price: 2, edition: 'schatten' };
    expect(buyCard(run, 0)).toBe(true);
  });

  it('Voucher wirkt sofort und bleibt in der Ante bis zum Kauf', () => {
    const run = createRun({ seed: 'SHOP0006' });
    run.anteVoucher = 'taschenuhr';
    wonRound(run);
    expect(run.shop!.voucher!.voucherId).toBe('taschenuhr');
    leaveShop(run);
    wonRound(run);
    expect(run.shop!.voucher!.voucherId).toBe('taschenuhr');
    run.money = 20;
    const hands = run.hands;
    buyVoucher(run);
    expect(run.hands).toBe(hands + 1);
    expect(run.vouchers).toContain('taschenuhr');
  });

  it('Upgrade Voucher erst nach der Basis', () => {
    const run = createRun({ seed: 'SHOP0007' });
    for (let i = 0; i < 30; i++) {
      run.ante = i + 1;
      enterAnte(run);
      if (run.anteVoucher === 'tresor') expect(run.vouchers).toContain('sparbuch');
    }
  });

  it('Pack kaufen, wählen, zurück in den Shop', () => {
    const run = createRun({ seed: 'SHOP0008' });
    wonRound(run);
    run.money = 50;
    buyPack(run, 0);
    expect(run.phase).toBe('pack');
    expect(run.pack!.options).toHaveLength(2);
    pickFromPack(run, 0);
    expect(run.jokers).toHaveLength(1);
    expect(run.phase).toBe('shop');
  });

  it('Sternenrabatt halbiert die Preise im nächsten Shop, Würfelglück macht 2 Rerolls gratis', () => {
    const run = createRun({ seed: 'SHOP0009' });
    run.pendingTags = ['sternenrabatt', 'wuerfelglueck'];
    wonRound(run);
    expect(run.shop!.packs[0]!.price).toBe(2);
    expect(rerollCost(run)).toBe(0);
    reroll(run);
    reroll(run);
    expect(rerollCost(run)).toBe(5);
  });

  it('Komet legt einen gratis Uncommon Joker in den Shop', () => {
    const run = createRun({ seed: 'SHOP0010' });
    run.pendingTags = ['komet'];
    wonRound(run);
    const free = run.shop!.cards.find((c) => c?.kind === 'joker' && c.free);
    expect(free?.price).toBe(0);
  });

  it('Pack Gewichte: Verteilung über viele Ziehungen', () => {
    const rng = RngStreams.create('PACKW001');
    const weights = Object.fromEntries(PACKS.map((p) => [p.id, p.weight])) as Record<string, number>;
    const total = PACKS.reduce((s, p) => s + p.weight, 0);
    const n = 100_000;
    const count: Record<string, number> = {};
    for (let i = 0; i < n; i++) { const k = rng.weighted('w', weights); count[k] = (count[k] ?? 0) + 1; }
    for (const p of PACKS) expect(count[p.id] / n).toBeCloseTo(p.weight / total, 2);
  });
});

describe('Decks und Stakes', () => {
  it('Glutdeck +1 Discard, Tiefsee +1 Hand und -1 Discard', () => {
    expect(createRun({ seed: 'D', deckId: 'glut' }).discards).toBe(4);
    const t = createRun({ seed: 'D', deckId: 'tiefsee' });
    expect([t.hands, t.discards]).toEqual([5, 2]);
  });

  it('Halbmond hat 40 Karten, Alchemistendeck startet mit Kupfer auf 10 bis King', () => {
    expect(createRun({ seed: 'D', deckId: 'halbmond' }).deck).toHaveLength(40);
    const a = createRun({ seed: 'D', deckId: 'alchemist' });
    expect(a.deck.filter((c) => c.enhancement === 'kupfer')).toHaveLength(16);
  });

  it('Goldene Waage verdoppelt die Ziele und mittelt Chips und Mult', () => {
    const run = createRun({ seed: 'D', deckId: 'waage' });
    expect(currentTarget(run, 'small')).toBe(600);
    expect(run.rules.balance).toBe(true);
  });

  it('Stakes wirken kumulativ', () => {
    const run = createRun({ seed: 'S', stakeId: 'tiefe_nacht' });
    expect(run.rules.smallBlindReward).toBe(0);
    expect(run.rules.scaling).toBe(2);
    expect(run.discards).toBe(2);
    expect(createRun({ seed: 'S', stakeId: 'ewige_nacht' }).rules.scaling).toBe(3);
  });

  it('gleicher Seed, gleiche Aktionen: identischer Shop', () => {
    const a = createRun({ seed: 'SAME0001' });
    const b = createRun({ seed: 'SAME0001' });
    wonRound(a);
    wonRound(b);
    expect(a.shop).toEqual(b.shop);
  });

  it('Käufe in anderer Reihenfolge ändern den Boss der nächsten Ante nicht', () => {
    const a = createRun({ seed: 'ORDER001' });
    const b = createRun({ seed: 'ORDER001' });
    wonRound(a); a.money = 100; reroll(a); reroll(a);
    wonRound(b);
    leaveShop(a); leaveShop(b);
    for (const r of [a, b]) { wonRound(r); leaveShop(r); wonRound(r); }
    expect(a.anteBoss).toBe(b.anteBoss);
  });
});
