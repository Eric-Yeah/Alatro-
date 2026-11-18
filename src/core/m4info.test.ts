import './index';
import { describe, expect, it } from 'vitest';
import { COLLECTION_TABS, collectionEntries, discoveredKeys, mergeDiscovered } from '../collection';
import { HAND_ORDER } from '../data/hands';
import { normalizeSeed, randomSeed, SEED_LENGTH } from './rng';
import { afterHand, cashOut, createRun, openPack, selectBlind } from './game';
import { addConsumable } from './consumables';
import { blindRows, deckStats, handRows } from './runInfo';

describe('Run Info', () => {
  it('Hände: geheime Hände sind bis zum ersten Spielen versteckt', () => {
    const run = createRun({ seed: 'INFO0001' });
    const rows = handRows(run);
    expect(rows.map((r) => r.type)).toEqual([...HAND_ORDER]);
    const secret = rows.find((r) => r.type === 'fiveKind')!;
    expect(secret.hidden).toBe(true);
    expect(secret.name).toBe('???');
    expect(secret.chips).toBe(0);
    expect(rows.find((r) => r.type === 'pair')!.name).toBe('Pair');
    run.handsPlayed.fiveKind = 1;
    expect(handRows(run).find((r) => r.type === 'fiveKind')!.name).toBe('Five of a Kind');
  });

  it('Hände zeigen Level, Chips und Mult nach der Level Formel', () => {
    const run = createRun({ seed: 'INFO0002' });
    run.handLevels.flush = 3;
    const flush = handRows(run).find((r) => r.type === 'flush')!;
    expect(flush.level).toBe(3);
    expect(flush.chips).toBe(35 + 2 * 15);
    expect(flush.mult).toBe(4 + 2 * 2);
  });

  it('Blinds der Ante mit Ziel, Belohnung, Boss und Tag', () => {
    const run = createRun({ seed: 'INFO0004' });
    const rows = blindRows(run);
    expect(rows.map((r) => r.kind)).toEqual(['small', 'big', 'boss']);
    expect(rows[0].target).toBe(300);
    expect(rows[1].target).toBe(450);
    expect(rows[0].reward).toBe(3);
    expect(rows[0].state).toBe('current');
    expect(rows[2].bossId).toBe(run.anteBoss);
    expect(rows[0].tagId).toBe(run.anteTags!.small);
    expect(rows[2].tagId).toBeUndefined();
  });

  it('Deck Übersicht zählt Ränge, Suits und veränderte Karten', () => {
    const run = createRun({ seed: 'INFO0005', deckId: 'alchemist' });
    const s = deckStats(run);
    expect(s.total).toBe(52);
    expect(s.byRank[14]).toBe(4);
    expect(s.bySuit.S).toBe(13);
    expect(s.modified).toBe(16);
    expect(s.remaining).toBeNull();
    selectBlind(run);
    expect(deckStats(run).remaining).toBe(52 - run.round!.handSize);
    const half = createRun({ seed: 'INFO0006', deckId: 'halbmond' });
    expect(deckStats(half).byRank[12]).toBe(0);
  });
});

describe('Seed Eingabe', () => {
  it('0 bis 8 Zeichen, nur A bis Z und Ziffern, O gilt als 0', () => {
    expect(normalizeSeed('')).toBe('');
    expect(normalizeSeed('ab-c 12')).toBe('ABC12');
    expect(normalizeSeed('HELLO')).toBe('HELL0');
    expect(normalizeSeed('ABCDEFGHIJKL')).toHaveLength(SEED_LENGTH);
  });

  it('gleicher Seed aus Eingabe in beiden Schreibweisen ergibt denselben Run', () => {
    const a = createRun({ seed: normalizeSeed('Ocean01') });
    const b = createRun({ seed: normalizeSeed('0CEAN01') });
    expect(a.seed).toBe(b.seed);
    expect(a.anteBoss).toBe(b.anteBoss);
    expect(a.anteTags).toEqual(b.anteTags);
  });

  it('Zufalls Seeds sind gültig und stabil unter Normalisierung', () => {
    for (let i = 0; i < 50; i++) {
      const s = randomSeed();
      expect(s).toHaveLength(SEED_LENGTH);
      expect(normalizeSeed(s)).toBe(s);
    }
  });
});

describe('Collection', () => {
  it('jeder Reiter hat Einträge mit eindeutigen Schlüsseln', () => {
    const all = COLLECTION_TABS.flatMap((t) => collectionEntries(t.id));
    expect(new Set(all.map((e) => e.key)).size).toBe(all.length);
    for (const t of COLLECTION_TABS) expect(collectionEntries(t.id).length).toBeGreaterThan(0);
  });

  it('entdeckt Deck, Bosse, Tags, Jokers, Consumables und Modifikatoren aus dem Run', () => {
    const run = createRun({ seed: 'COLL0001', deckId: 'alchemist' });
    let keys = discoveredKeys(run);
    expect(keys).toContain('deck:alchemist');
    expect(keys).toContain('enhancement:kupfer');
    expect(keys).toContain(`boss:${run.anteBoss}`);
    expect(keys).toContain(`tag:${run.anteTags!.small}`);
    addConsumable(run, 'omen_blutmond', 4);
    run.jokers.push({ uid: 99, defId: 'funke', vars: {}, edition: 'aura' });
    keys = discoveredKeys(run);
    expect(keys).toContain('consumable:omen_blutmond');
    expect(keys).toContain('joker:funke');
    expect(keys).toContain('edition:aura');
  });

  it('Shop und Pack Inhalte zählen als gesehen', () => {
    const run = createRun({ seed: 'COLL0002' });
    selectBlind(run);
    run.round!.score = run.round!.target;
    afterHand(run);
    cashOut(run);
    const keys = discoveredKeys(run);
    for (const c of run.shop!.cards) {
      if (c?.kind === 'joker') expect(keys).toContain(`joker:${c.defId}`);
      if (c?.kind === 'consumable') expect(keys).toContain(`consumable:${c.defId}`);
    }
    if (run.shop!.voucher) expect(keys).toContain(`voucher:${run.shop!.voucher.voucherId}`);
    run.pack = null;
    openPack(run, 'omen_jumbo', 'shop');
    const withPack = discoveredKeys(run);
    for (const o of run.pack!.options) if (o?.kind === 'consumable') expect(withPack).toContain(`consumable:${o.defId}`);
  });

  it('mergeDiscovered ergänzt ohne Duplikate und gibt bei Gleichstand dieselbe Liste zurück', () => {
    const a = ['joker:funke'];
    expect(mergeDiscovered(a, ['joker:funke'])).toBe(a);
    expect(mergeDiscovered(a, ['joker:glut', 'joker:funke'])).toEqual(['joker:funke', 'joker:glut']);
  });
});
