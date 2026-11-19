import './core/index';
import { describe, expect, it, beforeEach } from 'vitest';
import { nearMiss, newKeys, overkill } from './report';
import { NEAR_MISS_MIN, OVERKILL_MIN, TAP_BOOST } from './data/report';
import { COLLECTION_TABS, collectionEntries, collectionHint, collectionProgress, loadSeen, markAllSeen, saveDiscovered, tabProgress, unseenKeys } from './collection';
import { deckSeal, deckStakeKey, newProfile, nextSealGoal, observeRun, parseProfile } from './profile';
import { boostActive, speedFactor, tapBoost } from './settings';
import { createRun } from './core/game';
import { STAKES } from './data/stakes';

/** Minimaler Speicher für Tests ohne Browser */
function fakeStorage() {
  const m = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe('Rückschau', () => {
  it('Beinahe Zeile nur zwischen Mindestanteil und Ziel', () => {
    expect(nearMiss(900, 1000)).toEqual({ missing: 100, fraction: 0.9 });
    expect(nearMiss(1000, 1000)).toBeNull();
    expect(nearMiss(1200, 1000)).toBeNull();
    expect(nearMiss(NEAR_MISS_MIN * 1000 - 1, 1000)).toBeNull();
    expect(nearMiss(NEAR_MISS_MIN * 1000, 1000)).not.toBeNull();
    expect(nearMiss(0, 0)).toBeNull();
  });

  it('Überschuss erst ab Mindestverhältnis', () => {
    expect(overkill(1000, 1000)).toBeNull();
    expect(overkill(OVERKILL_MIN * 1000 - 1, 1000)).toBeNull();
    expect(overkill(2000, 1000)).toEqual({ extra: 1000, ratio: 2 });
  });

  it('newKeys liefert nur Neues in der Reihenfolge von after', () => {
    expect(newKeys(['a', 'b'], ['b', 'c', 'a', 'd'])).toEqual(['c', 'd']);
    expect(newKeys([], [])).toEqual([]);
  });
});

describe('Tippen beschleunigt', () => {
  it('Schub gilt kurz und läuft aus', () => {
    const base = speedFactor();
    tapBoost(1000);
    expect(boostActive(1001)).toBe(true);
    expect(boostActive(1000 + 1e6)).toBe(false);
    expect(TAP_BOOST).toBeGreaterThan(1);
    expect(base).toBeGreaterThan(0);
  });
});

describe('Sammlung 2.0', () => {
  beforeEach(fakeStorage);

  it('jeder Eintrag hat einen nicht leeren Hinweis', () => {
    for (const t of COLLECTION_TABS) {
      for (const e of collectionEntries(t.id)) expect(collectionHint(e).length, e.key).toBeGreaterThan(5);
    }
  });

  it('Hinweise verraten den Namen nicht', () => {
    for (const t of COLLECTION_TABS) {
      for (const e of collectionEntries(t.id)) expect(collectionHint(e).toLowerCase().includes(e.name.toLowerCase()), e.key).toBe(false);
    }
  });

  it('Fortschritt pro Reiter summiert sich zum Gesamtfortschritt', () => {
    const keys = collectionEntries('jokers').slice(0, 3).map((e) => e.key);
    const total = collectionProgress(keys);
    expect(total.found).toBe(3);
    const sum = COLLECTION_TABS.reduce((a, t) => a + tabProgress(t.id, keys).found, 0);
    expect(sum).toBe(3);
  });

  it('erster Aufruf ohne Seen Speicher markiert Altbestand als gesehen', () => {
    const keys = collectionEntries('jokers').slice(0, 4).map((e) => e.key);
    saveDiscovered(keys);
    expect(unseenKeys(keys)).toEqual([]);
    expect(loadSeen()).toEqual(keys);
    const more = [...keys, collectionEntries('bosses')[0].key];
    expect(unseenKeys(more)).toEqual([more[4]]);
    saveDiscovered(more);
    markAllSeen();
    expect(unseenKeys(more)).toEqual([]);
  });
});

describe('Siegel am Deck', () => {
  const ladder = STAKES.filter((s) => s.cumulative !== false);

  it('ohne Sieg kein Siegel, Ziel ist die erste Stufe der Leiter', () => {
    const p = newProfile();
    expect(deckSeal(p, 'nachthimmel')).toBeNull();
    expect(nextSealGoal(p, 'nachthimmel')).toBe(ladder[0].id);
  });

  it('höchste gewonnene Stufe zählt, das Ziel ist die darauffolgende', () => {
    const p = newProfile();
    p.winsByDeckStake[deckStakeKey('nachthimmel', ladder[0].id)] = 1;
    p.winsByDeckStake[deckStakeKey('nachthimmel', ladder[2].id)] = 2;
    expect(deckSeal(p, 'nachthimmel')?.stakeId).toBe(ladder[2].id);
    expect(nextSealGoal(p, 'nachthimmel')).toBe(ladder[3]?.id ?? null);
    expect(deckSeal(p, 'anderes')).toBeNull();
  });

  it('nach der letzten Stufe gibt es kein Ziel mehr', () => {
    const p = newProfile();
    p.winsByDeckStake[deckStakeKey('nachthimmel', ladder[ladder.length - 1].id)] = 1;
    expect(nextSealGoal(p, 'nachthimmel')).toBeNull();
  });

  it('Sieg im Profil zählt je Deck und Stufe, einmal pro Run', () => {
    const p = newProfile();
    const run = createRun({ seed: 'SIEGEL01', deckId: 'nachthimmel', stakeId: ladder[1].id });
    run.won = true;
    observeRun(p, run);
    observeRun(p, run);
    expect(p.winsByDeckStake[deckStakeKey('nachthimmel', ladder[1].id)]).toBe(1);
  });

  it('skalierende Läufe zählen nicht für die Leiter', () => {
    const p = newProfile();
    const run = createRun({ seed: 'SIEGEL02', deckId: 'nachthimmel', level: 5 });
    run.won = true;
    observeRun(p, run);
    expect(Object.keys(p.winsByDeckStake)).toEqual([]);
  });

  it('alte Profile ohne das Feld werden ergänzt, kaputte Werte verworfen', () => {
    const old = JSON.parse(JSON.stringify(newProfile()));
    delete old.winsByDeckStake;
    expect(parseProfile(old).winsByDeckStake).toEqual({});
    old.winsByDeckStake = { 'a|b': 2, 'c|d': 'x' };
    expect(parseProfile(old).winsByDeckStake).toEqual({ 'a|b': 2 });
  });
});
