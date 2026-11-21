import './index';
import { describe, expect, it } from 'vitest';
import { addJoker, jokerCapacity, jokerSellValue } from './run';
import { canPick, canSwapJoker, createRun, openPack, swapJokerFromPack } from './game';
import { allJokers } from './jokers';

/** Run in der Pack Phase mit vollen Joker Slots */
function fullSlotsRun(seed: string) {
  const run = createRun({ seed });
  const pool = allJokers().filter((j) => j.rarity !== 'legendary');
  let i = 0;
  while (run.jokers.length < jokerCapacity(run)) addJoker(run, pool[i++].id, { buyPrice: 4 });
  openPack(run, 'joker_normal', 'shop');
  return run;
}

describe('Joker aus dem Pack gegen eigenen Joker tauschen', () => {
  it('bei vollen Slots ist Wählen gesperrt, Tauschen aber möglich', () => {
    const run = fullSlotsRun('SWAP0001');
    expect(run.pack!.options[0]).toBeTruthy();
    expect(canPick(run, 0)).toBe(false);
    expect(canSwapJoker(run, 0, run.jokers[0].uid)).toBe(true);
  });

  it('verkauft den alten Joker, nimmt den neuen und zählt eine Wahl', () => {
    const run = fullSlotsRun('SWAP0002');
    const old = run.jokers[1];
    const money = run.money;
    const gain = jokerSellValue(old);
    const picks = run.pack!.picksLeft;
    const wanted = run.pack!.options[0] as { kind: 'joker'; defId: string };
    expect(swapJokerFromPack(run, 0, old.uid)).toBe(true);
    expect(run.jokers.some((j) => j.uid === old.uid)).toBe(false);
    expect(run.jokers.some((j) => j.defId === wanted.defId)).toBe(true);
    expect(run.jokers).toHaveLength(jokerCapacity(run));
    expect(run.money).toBe(money + gain);
    expect(run.pack === null || run.pack.picksLeft === picks - 1).toBe(true);
  });

  it('unbekannte Joker ID, Consumable Option oder leerer Pack: kein Tausch', () => {
    const run = fullSlotsRun('SWAP0003');
    const before = run.jokers.map((j) => j.uid);
    expect(swapJokerFromPack(run, 0, 99999)).toBe(false);
    expect(run.jokers.map((j) => j.uid)).toEqual(before);
    const run2 = createRun({ seed: 'SWAP0004' });
    openPack(run2, 'sternbild_normal', 'shop');
    expect(canSwapJoker(run2, 0, 1)).toBe(false);
  });
});
