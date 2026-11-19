import './index';
import { describe, expect, it } from 'vitest';
import { DECKS } from '../data/decks';
import { STAKES } from '../data/stakes';
import { CONSUMABLE_BY_ID } from '../data/consumables';
import {
  afterHand, buyAndUse, buyCard, buyPack, buyVoucher, canBuyAndUse, canBuyCard, canPick, cashOut, closePack, createRun, discardHand, leaveShop,
  pickFromPack, playHand, reroll, selectBlind, sellJoker, skipBlind, useConsumable, canUseConsumable, type RunSetup,
} from './game';
import { TWISTS } from '../data/daily';
import { jokerCapacity, type RunState } from './run';
import { migrateRun } from '../save';
import { consumableCapacity, poolCards } from './consumables';
import { BLIND_KINDS } from './blinds';
import { RngStreams } from './rng';


/** Test Bot: spielt jede Hand per Engine Vorschau, kauft und benutzt zufällig. Prüft Invarianten. */
function check(run: RunState, where: string) {
  const ids = new Set<number>();
  for (const c of run.deck) {
    if (ids.has(c.id)) throw new Error(`${where}: duplicate card id ${c.id}`);
    ids.add(c.id);
  }
  if (!Number.isFinite(run.money)) throw new Error(`${where}: money NaN`);
  const r = run.round;
  if (r) {
    const n = r.hand.length + r.drawPile.length + r.discardPile.length;
    if (n !== run.deck.length) throw new Error(`${where}: round cards ${n} != deck ${run.deck.length} (hand ${r.hand.length} draw ${r.drawPile.length} disc ${r.discardPile.length})`);
    if (!Number.isFinite(r.score)) throw new Error(`${where}: score NaN`);
  }
  const edSlots = run.jokers.filter((j) => j.edition === 'schatten').length;
  if (run.jokers.length > jokerCapacity(run) + edSlots) throw new Error(`${where}: too many jokers ${run.jokers.length}`);
  if (run.consumables.length > consumableCapacity(run)) throw new Error(`${where}: too many consumables`);
}

function bestPlay(run: RunState) {
  const hand = run.round!.hand;
  const n = hand.length;
  let best: number[] = [];
  let bestScore = -1;
  const subsets: number[][] = [];
  const rec = (s: number, cur: number[]) => {
    if (cur.length > 0) subsets.push(cur);
    if (cur.length === 5) return;
    for (let i = s; i < n; i++) rec(i + 1, [...cur, i]);
  };
  rec(0, []);
  for (const sub of subsets) {
    const copy = structuredClone(run);
    const ids = sub.map((i) => hand[i].id);
    const res = playHand(copy, ids);
    if (res.total > bestScore) { bestScore = res.total; best = ids; }
  }
  return { ids: best, score: bestScore };
}

function playRun(seed: string, deckId: string, stakeId: string, log: string[], roundtrip = false, extra: Partial<RunSetup> = {}) {
  let run = createRun({ seed, deckId, stakeId, ...extra });
  const rng = RngStreams.create('bot' + seed);
  let steps = 0;
  while (run.phase !== 'gameOver' && steps++ < 3000) {
    check(run, run.phase);
    if (roundtrip) run = migrateRun(JSON.parse(JSON.stringify(run)))!;
    if (run.ante > 10) break;
    switch (run.phase) {
      case 'blindSelect': {
        if (BLIND_KINDS[run.blindIndex] !== 'boss' && rng.next('skip') < 0.2) skipBlind(run);
        else selectBlind(run);
        break;
      }
      case 'round': {
        const r = run.round!;
        // use consumables randomly
        for (const c of [...run.consumables]) {
          const def = CONSUMABLE_BY_ID[c.defId];
          const pool = poolCards(run);
          let targets: number[] = [];
          if (def.targets) targets = pool.slice(0, def.targets.min).map((x) => x.id);
          if (rng.next('use') < 0.5 && canUseConsumable(run, c.defId, targets, 'slot')) {
            useConsumable(run, c.uid, targets);
            check(run, 'use');
          }
        }
        if (run.phase !== 'round') break;
        if (r.handsLeft > 0 && r.hand.length > 0) {
          const { ids, score } = bestPlay(run);
          const need = (r.target - r.score) / r.handsLeft;
          if (r.discardsLeft > 0 && score < need && r.drawPile.length > 0) {
            const keep = new Set(ids);
            const rest = r.hand.filter((c) => !keep.has(c.id)).slice(0, 5);
            if (rest.length) discardHand(run, rest.map((c) => c.id));
            else playHand(run, ids);
          } else {
            playHand(run, ids);
          }
          afterHand(run);
        } else { afterHand(run); if (run.phase === 'round') throw new Error('stuck round'); }
        break;
      }
      case 'roundWon': cashOut(run); break;
      case 'shop': {
        const s = run.shop!;
        for (let i = 0; i < s.cards.length; i++) {
          if (canBuyCard(run, i) && rng.next('buy') < 0.7) buyCard(run, i);
          else if (canBuyAndUse(run, i) && rng.next('bu') < 0.5) buyAndUse(run, i);
        }
        if (rng.next('v') < 0.6) buyVoucher(run);
        if (rng.next('r') < 0.3) reroll(run);
        if (run.jokers.length > 3 && rng.next('sell') < 0.1) sellJoker(run, run.jokers[0].uid);
        for (let i = 0; i < s.packs.length; i++) {
          if ((run.phase as string) === 'shop' && rng.next('p') < 0.6 && buyPack(run, i)) {
            while ((run.phase as string) === 'pack') {
              check(run, 'pack');
              const p = run.pack!;
              let picked = false;
              for (let k = 0; k < p.options.length; k++) {
                const o = p.options[k];
                if (!o) continue;
                let targets: number[] = [];
                if (o.kind === 'consumable') {
                  const def = CONSUMABLE_BY_ID[o.defId];
                  if (def.targets) targets = poolCards(run).slice(0, def.targets.min).map((x) => x.id);
                }
                if (canPick(run, k, targets)) { pickFromPack(run, k, targets); picked = true; break; }
              }
              if (!picked) closePack(run);
            }
          }
        }
        if (run.phase === 'shop') leaveShop(run);
        break;
      }
      case 'pack': closePack(run); break;
    }
  }
  log.push(`${seed} ${deckId} ${stakeId}: ante ${run.ante} blind ${run.blindIndex} phase ${run.phase} won=${run.won} jokers=${run.jokers.length} money=${run.money} steps=${steps}`);
  return run;
}

describe('Zufallsläufe mit Bot', () => {
  it('Runs mit allen Decks laufen ohne Fehler, Zustand bleibt konsistent und ist per Spielstand wiederherstellbar', () => {
    const log: string[] = [];
    DECKS.forEach((deck, k) => {
      const stake = STAKES[(k * 2) % STAKES.length].id;
      const a = playRun('FZ' + k, deck.id, stake, log);
      const b = playRun('FZ' + k, deck.id, stake, log, true);
      // gleicher Seed und gleiche Entscheidungen ergeben denselben Ausgang, auch nach Speichern und Laden in jedem Schritt
      expect(JSON.stringify([b.ante, b.blindIndex, b.money, b.jokers.map((j) => j.defId), b.rng]))
        .toBe(JSON.stringify([a.ante, a.blindIndex, a.money, a.jokers.map((j) => j.defId), a.rng]));
    });
    expect(log.length).toBe(DECKS.length * 2);
  }, 120000);
});

describe('Zufallsläufe mit Schwierigkeit und Tageslauf', () => {
  it('skalierende Stufen und Tageswandlungen laufen ohne Fehler und bleiben speicherbar', () => {
    const log: string[] = [];
    for (const level of [1, 4, 10, 20]) {
      const run = createRun({ seed: `LV${level}`, deckId: DECKS[level % DECKS.length].id, level });
      expect(run.difficulty).toBe(level);
      const back = migrateRun(JSON.parse(JSON.stringify(run)))!;
      expect(back.rules).toEqual(run.rules);
      expect(back.stats).toEqual(run.stats);
    }
    for (const twist of TWISTS) {
      const run = createRun({ seed: `TW${twist.id}`.slice(0, 8).toUpperCase(), level: 5, daily: { date: '2026-11-19', twistId: twist.id } });
      expect(run.twistId).toBe(twist.id);
      expect(run.daily).toBe('2026-11-19');
      expect(run.hands).toBeGreaterThanOrEqual(1);
      expect(run.handSize).toBeGreaterThanOrEqual(1);
      log.push(twist.id);
    }
    expect(log.length).toBe(TWISTS.length);
  });

  it('Bot spielt komplette Runs mit Stufe und Tageswandlung, auch mit Speichern und Laden', () => {
    const log: string[] = [];
    const cases: [string, number, string][] = [['SK1', 3, 'wunderladen'], ['SK2', 12, 'raritaeten'], ['SK3', 1, 'luftig'], ['SK4', 8, 'sparflamme']];
    for (const [seed, level, twistId] of cases) {
      const extra = { level, daily: { date: '2026-11-19', twistId } };
      const a = playRun(seed, 'nachthimmel', 'daemmerung', log, false, extra);
      const b = playRun(seed, 'nachthimmel', 'daemmerung', log, true, extra);
      expect(JSON.stringify([b.ante, b.blindIndex, b.money, b.stats, b.rng])).toBe(JSON.stringify([a.ante, a.blindIndex, a.money, a.stats, a.rng]));
      expect(a.stats.bestHand).toBeGreaterThan(0);
    }
    expect(log.length).toBe(cases.length * 2);
  }, 120000);
});

describe('Eingabeprüfung', () => {
  it('Spielen und Abwerfen verlangen Karten aus der Hand ohne Duplikate', () => {
    const run = createRun({ seed: 'VALID001' });
    selectBlind(run);
    const hand = run.round!.hand;
    expect(() => playHand(run, [99999])).toThrow();
    expect(() => playHand(run, [hand[0].id, hand[0].id])).toThrow();
    expect(() => discardHand(run, [99999])).toThrow();
    expect(run.round!.handsLeft).toBe(4);
    expect(run.round!.hand.length).toBe(hand.length);
  });
});
