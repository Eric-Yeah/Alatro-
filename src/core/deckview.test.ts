import './index';
import { describe, expect, it } from 'vitest';
import { HAND_DATA, HAND_ORDER } from '../data/hands';
import { CONSUMABLES } from '../data/consumables';
import { addConsumable, useConsumable } from './consumables';
import { createRun, selectBlind } from './game';
import { handBase } from './hands';
import { cardMods, deckLayout, deckStats, levelUpGain, levelUpPreview } from './runInfo';

describe('Deck Ansicht: Zähler', () => {
  it('Nachziehstapel Zähler je Rang und Suit, außerhalb einer Runde null', () => {
    const run = createRun({ seed: 'DECKV001' });
    const out = deckStats(run);
    expect(out.remainingByRank).toBeNull();
    expect(out.remainingBySuit).toBeNull();
    expect(out.remainingRankless).toBeNull();
    selectBlind(run);
    const s = deckStats(run);
    const ranks = Object.values(s.remainingByRank!).reduce((a, b) => a + b, 0);
    const suits = Object.values(s.remainingBySuit!).reduce((a, b) => a + b, 0);
    expect(ranks).toBe(run.round!.drawPile.length);
    expect(suits).toBe(run.round!.drawPile.length);
    expect(s.remaining).toBe(run.round!.drawPile.length);
    // gezogene Karten fehlen im Stapel, nicht im Deck
    expect(s.total).toBe(52);
    for (const r of Object.keys(s.byRank)) expect(s.remainingByRank![Number(r) as 2]).toBeLessThanOrEqual(s.byRank[Number(r) as 2]);
  });

  it('ranglose Karten (Obsidian) zählen nicht bei Rang und Suit', () => {
    const run = createRun({ seed: 'DECKV002' });
    run.deck[0].enhancement = 'obsidian';
    const s = deckStats(run);
    expect(s.rankless).toBe(1);
    expect(Object.values(s.byRank).reduce((a, b) => a + b, 0)).toBe(51);
    expect(Object.values(s.bySuit).reduce((a, b) => a + b, 0)).toBe(51);
    expect(s.modified).toBe(1);
  });
});

describe('Deck Ansicht: Raster', () => {
  it('Standarddeck: 13 Spalten mal 4 Zeilen, Ace links, in beiden Sortierungen jede Zelle einmal', () => {
    const run = createRun({ seed: 'DECKV003' });
    for (const sort of ['rank', 'suit'] as const) {
      const l = deckLayout(run, sort);
      expect(l.cols).toBe(13);
      expect(l.rows).toBe(4);
      expect(l.cells).toHaveLength(52);
      expect(new Set(l.cells.map((c) => `${c.col},${c.row}`)).size).toBe(52);
      const ace = l.cells.find((c) => c.card.rank === 14)!;
      expect(ace.col).toBe(0);
      expect(l.cells.find((c) => c.card.rank === 2)!.col).toBe(12);
    }
  });

  it('Sortierung nach Suit: eine Zeile je Suit, nach Rang: Spalte stapelt nach Suit', () => {
    const run = createRun({ seed: 'DECKV004' });
    const bySuit = deckLayout(run, 'suit');
    for (const suit of ['S', 'H', 'D', 'C'] as const) {
      const rows = new Set(bySuit.cells.filter((c) => c.card.suit === suit).map((c) => c.row));
      expect(rows.size).toBe(1);
    }
    expect(bySuit.cells.find((c) => c.card.suit === 'S')!.row).toBe(0);
    expect(bySuit.cells.find((c) => c.card.suit === 'C')!.row).toBe(3);
    const byRank = deckLayout(run, 'rank');
    const col = byRank.cells.filter((c) => c.col === 0).sort((a, b) => a.row - b.row);
    expect(col.map((c) => c.card.suit)).toEqual(['S', 'H', 'D', 'C']);
  });

  it('doppelte Karten stapeln sich, ranglose Karten stehen am Ende', () => {
    const run = createRun({ seed: 'DECKV005' });
    const copy = { ...run.deck[0], id: 999 };
    run.deck.push(copy);
    run.deck[5].enhancement = 'obsidian';
    const bySuit = deckLayout(run, 'suit');
    expect(bySuit.cells).toHaveLength(53);
    expect(new Set(bySuit.cells.map((c) => `${c.col},${c.row}`)).size).toBe(53);
    const loose = bySuit.cells.find((c) => c.card.id === run.deck[5].id)!;
    const maxPlain = Math.max(...bySuit.cells.filter((c) => c !== loose).map((c) => c.row));
    expect(loose.row).toBeGreaterThan(maxPlain);
    expect(bySuit.rows).toBe(loose.row + 1);
    const byRank = deckLayout(run, 'rank');
    expect(new Set(byRank.cells.map((c) => `${c.col},${c.row}`)).size).toBe(53);
  });

  it('Nachziehstapel: inPile folgt dem Stapel der Runde, nur Stapel filtert', () => {
    const run = createRun({ seed: 'DECKV006' });
    expect(deckLayout(run, 'rank').cells.every((c) => c.inPile)).toBe(true);
    selectBlind(run);
    const pile = new Set(run.round!.drawPile.map((c) => c.id));
    const all = deckLayout(run, 'rank');
    expect(all.cells).toHaveLength(52);
    for (const c of all.cells) expect(c.inPile).toBe(pile.has(c.card.id));
    expect(all.cells.filter((c) => !c.inPile)).toHaveLength(52 - pile.size);
    const only = deckLayout(run, 'suit', true);
    expect(only.cells).toHaveLength(pile.size);
    expect(only.cells.every((c) => c.inPile)).toBe(true);
  });
});

describe('Deck Ansicht: Karten Details', () => {
  it('Enhancement, Seal und Edition mit Namen und Beschreibung', () => {
    const run = createRun({ seed: 'DECKV007' });
    expect(cardMods(run.deck[0])).toEqual([]);
    const c = { ...run.deck[0], enhancement: 'kupfer', seal: 'echo', edition: 'prisma' };
    const mods = cardMods(c);
    expect(mods.map((m) => m.kind)).toEqual(['enhancement', 'seal', 'edition']);
    expect(mods[0].name).toBe('Kupfer');
    expect(mods[0].description).toBe('+25 Chips');
    expect(mods[2].name).toBe('Prisma');
  });
});

describe('Level up Vorschau', () => {
  const star = (hand: string) => `sternbild_${hand}`;

  it('Sternbild: Level, Chips und Mult vorher und nachher aus handBase', () => {
    const run = createRun({ seed: 'LVUP0001' });
    run.handLevels.pair = 2;
    const p = levelUpPreview(run, star('pair'))!;
    expect(p.kind).toBe('hand');
    if (p.kind !== 'hand') return;
    expect(p.hidden).toBe(false);
    expect(p.level).toEqual({ from: 2, to: 3, diff: 1 });
    expect(p.row!.name).toBe('Pair');
    expect(p.row!.chips).toEqual({ from: handBase('pair', 2).chips, to: handBase('pair', 3).chips, diff: HAND_DATA.pair.levelChips });
    expect(p.row!.mult).toEqual({ from: handBase('pair', 2).mult, to: handBase('pair', 3).mult, diff: HAND_DATA.pair.levelMult });
    expect(p.heldXMult).toBeNull();
  });

  it('Sternbild: Zahlen stimmen für alle zwölf Hände und mit dem echten Benutzen überein', () => {
    for (const hand of HAND_ORDER) {
      const run = createRun({ seed: 'LVUP0002' });
      run.handsPlayed[hand] = 1;
      run.handLevels[hand] = 4;
      const p = levelUpPreview(run, star(hand))!;
      if (p.kind !== 'hand') throw new Error('falsche Art');
      addConsumable(run, star(hand), 3);
      useConsumable(run, run.consumables[0].uid, []);
      const after = handBase(hand, run.handLevels[hand]);
      expect(p.level.to).toBe(run.handLevels[hand]);
      expect(p.row!.chips.to).toBe(after.chips);
      expect(p.row!.mult.to).toBe(after.mult);
      expect(levelUpGain(star(hand))).toEqual({ amount: 1, chips: HAND_DATA[hand].levelChips, mult: HAND_DATA[hand].levelMult });
    }
  });

  it('geheime Hand ohne Spielen bleibt verborgen: kein Name, keine Werte', () => {
    const run = createRun({ seed: 'LVUP0003' });
    const p = levelUpPreview(run, star('flushFive'))!;
    if (p.kind !== 'hand') throw new Error('falsche Art');
    expect(p.hidden).toBe(true);
    expect(p.row).toBeNull();
    expect(JSON.stringify(p)).not.toContain('Flush Five');
    expect(p.level).toEqual({ from: 1, to: 2, diff: 1 });
    run.handsPlayed.flushFive = 1;
    const q = levelUpPreview(run, star('flushFive'))!;
    if (q.kind !== 'hand') throw new Error('falsche Art');
    expect(q.hidden).toBe(false);
    expect(q.row!.name).toBe('Flush Five');
  });

  it('Fernrohr: Sternbild im Slot gibt X Mult, die Vorschau nennt es', () => {
    const run = createRun({ seed: 'LVUP0004' });
    run.rules.sternbildXMult = 1.5;
    const p = levelUpPreview(run, star('pair'))!;
    if (p.kind !== 'hand') throw new Error('falsche Art');
    expect(p.heldXMult).toBe(1.5);
  });

  it('mehrere Level je Karte (amount) zählen mit', () => {
    const def = CONSUMABLES.find((c) => c.id === star('flush'))!;
    const effect = def.effect as { kind: 'levelHand'; hand: string; amount: number };
    const old = effect.amount;
    effect.amount = 3;
    try {
      const run = createRun({ seed: 'LVUP0005' });
      const p = levelUpPreview(run, star('flush'))!;
      if (p.kind !== 'hand') throw new Error('falsche Art');
      expect(p.amount).toBe(3);
      expect(p.level).toEqual({ from: 1, to: 4, diff: 3 });
      expect(p.row!.chips.diff).toBe(HAND_DATA.flush.levelChips * 3);
      expect(p.row!.mult.diff).toBe(HAND_DATA.flush.levelMult * 3);
      expect(levelUpGain(star('flush'))).toEqual({ amount: 3, chips: HAND_DATA.flush.levelChips * 3, mult: HAND_DATA.flush.levelMult * 3 });
    } finally {
      effect.amount = old;
    }
  });

  it('Omen Aschenregen: Zusammenfassung über die sichtbaren Hände, ohne geheime Hände zu verraten', () => {
    const run = createRun({ seed: 'LVUP0006' });
    const p = levelUpPreview(run, 'omen_aschenregen')!;
    expect(p.kind).toBe('all');
    if (p.kind !== 'all') return;
    expect(p.amount).toBe(1);
    expect(p.count).toBe(9);
    expect(p.hiddenCount).toBe(3);
    const visible = HAND_ORDER.filter((h) => !HAND_DATA[h].secret);
    expect(p.chipsGain).toEqual([Math.min(...visible.map((h) => HAND_DATA[h].levelChips)), Math.max(...visible.map((h) => HAND_DATA[h].levelChips))]);
    expect(p.multGain).toEqual([Math.min(...visible.map((h) => HAND_DATA[h].levelMult)), Math.max(...visible.map((h) => HAND_DATA[h].levelMult))]);
    expect(p.focus).toBeNull();
    run.handsPlayed.pair = 3;
    run.handsPlayed.flush = 1;
    run.handsPlayed.flushFive = 2;
    const q = levelUpPreview(run, 'omen_aschenregen')!;
    if (q.kind !== 'all') return;
    expect(q.count).toBe(10);
    expect(q.focus!.type).toBe('pair');
    expect(q.focus!.level.to).toBe(2);
  });

  it('andere Consumables haben keine Level up Vorschau', () => {
    const run = createRun({ seed: 'LVUP0007' });
    expect(levelUpPreview(run, 'elixier_kupfer')).toBeNull();
    expect(levelUpPreview(run, 'gibt_es_nicht')).toBeNull();
    expect(levelUpGain('omen_aschenregen')).toBeNull();
  });
});
