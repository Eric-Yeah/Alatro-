import { describe, expect, it } from 'vitest';
import { COSMETICS, cosmeticsOf } from '../data/cosmetics';
import { COSMETIC_CATEGORIES } from '../data/trophyTypes';
import { ROAD } from '../data/trophyRoad';
import { RARITY_FRAME, WARDROBE_LAYOUT, WARDROBE_TABS } from '../data/wardrobeLayout';
import { unlockHint } from '../trophies';
import { fmt } from './theme';
import {
  categoryCounts, cellPos, isEquipped, itemState, lockInfo, makeRand, pageCount, pageOfIndex, pageSlice, perPage, sortItems,
  sparkAlpha, totalCounts, wandPos, wardrobeItems,
} from './wardrobeMath';

describe('Wunderkammer: Stücke und Sortierung', () => {
  it('Reiter decken alle Kategorien ab, jede Rarität hat einen Rahmen', () => {
    expect([...WARDROBE_TABS].sort()).toEqual([...COSMETIC_CATEGORIES].sort());
    expect(Object.keys(RARITY_FRAME).sort()).toEqual(['common', 'epic', 'legendary', 'rare']);
  });

  it('Standardstücke stehen zuerst, danach der ganze Katalog der Kategorie', () => {
    for (const cat of WARDROBE_TABS) {
      const items = wardrobeItems(cat);
      const defaults = items.filter((i) => i.isDefault);
      expect(defaults.length).toBeGreaterThan(0);
      expect(items.slice(0, defaults.length).every((i) => i.isDefault)).toBe(true);
      expect(items.length).toBe(defaults.length + cosmeticsOf(cat).length);
      expect(new Set(items.map((i) => i.key)).size).toBe(items.length);
    }
    expect(wardrobeItems('palette').filter((i) => i.isDefault).map((i) => i.palette)).toEqual(['standard', 'kontrast']);
  });

  it('Sortierung: Standard, dann besessene in Katalog Reihenfolge, dann gesperrte nach Schwelle', () => {
    const items = wardrobeItems('back');
    const ownedIds = new Set(['back_kometenbahn', 'back_sternenstaub', 'back_deck_glut']);
    const sorted = sortItems(items, (i) => i.isDefault || ownedIds.has(i.cosmeticId));
    expect(sorted[0].isDefault).toBe(true);
    const ownedPart = sorted.slice(1, 4).map((i) => i.cosmeticId);
    expect(ownedPart).toEqual(['back_sternenstaub', 'back_kometenbahn', 'back_deck_glut']);
    const locked = sorted.slice(4);
    const road = locked.filter((i) => unlockHint(i.cosmeticId)?.source === 'road').map((i) => unlockHint(i.cosmeticId)!.threshold);
    expect(road).toEqual([...road].sort((a, b) => a - b));
    // Deck Pfade stehen hinter dem Hauptpfad
    const firstDeck = locked.findIndex((i) => unlockHint(i.cosmeticId)?.source === 'deck');
    expect(locked.slice(firstDeck).every((i) => unlockHint(i.cosmeticId)?.source === 'deck')).toBe(true);
    expect(sorted.length).toBe(items.length);
  });

  it('Sortierung ist stabil und verliert nichts', () => {
    const items = wardrobeItems('title');
    const a = sortItems(items, () => false).map((i) => i.key);
    const b = sortItems(items, () => false).map((i) => i.key);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(items.length);
  });
});

describe('Wunderkammer: Zustände', () => {
  it('Zustand aus Besitz und Ausrüstung', () => {
    expect(itemState(true, true)).toBe('equipped');
    expect(itemState(true, false)).toBe('owned');
    expect(itemState(false, false)).toBe('locked');
  });

  it('ausgerüstet: Kartenfarben über die Palette, sonst über die Id', () => {
    const pals = wardrobeItems('palette');
    const std = pals.find((i) => i.palette === 'standard')!;
    const kon = pals.find((i) => i.palette === 'kontrast')!;
    const bern = pals.find((i) => i.palette === 'bernstein')!;
    expect(isEquipped(std, '', 'standard')).toBe(true);
    expect(isEquipped(kon, '', 'standard')).toBe(false);
    expect(isEquipped(kon, '', 'kontrast')).toBe(true);
    expect(isEquipped(bern, '', 'bernstein')).toBe(true);
    const backs = wardrobeItems('back');
    expect(isEquipped(backs[0], '', 'standard')).toBe(true);
    const mond = backs.find((i) => i.cosmeticId === 'back_mondphasen')!;
    expect(isEquipped(mond, 'back_mondphasen', 'standard')).toBe(true);
    expect(isEquipped(backs[0], 'back_mondphasen', 'standard')).toBe(false);
  });

  it('Zähler zählen nur Katalogstücke (69), keine Standardstücke', () => {
    expect(totalCounts(() => false)).toEqual({ have: 0, total: COSMETICS.length });
    expect(totalCounts(() => true)).toEqual({ have: COSMETICS.length, total: COSMETICS.length });
    expect(categoryCounts('back', (id) => id === 'back_sternenstaub')).toEqual({ have: 1, total: 17 });
    expect(categoryCounts('title', () => true).total).toBe(34);
  });
});

describe('Wunderkammer: Raster und Seiten', () => {
  it('Stücke pro Seite: Titel als Liste, sonst Kachel Raster', () => {
    const L = WARDROBE_LAYOUT;
    expect(perPage('back')).toBe(L.tile.cols * L.tile.rows);
    expect(perPage('title')).toBe(L.list.cols * L.list.rows);
  });

  it('Seitenzahl und Ausschnitt', () => {
    expect(pageCount(0, 12)).toBe(1);
    expect(pageCount(12, 12)).toBe(1);
    expect(pageCount(13, 12)).toBe(2);
    const xs = Array.from({ length: 30 }, (_, i) => i);
    expect(pageSlice(xs, 0, 12)).toHaveLength(12);
    expect(pageSlice(xs, 2, 12)).toEqual([24, 25, 26, 27, 28, 29]);
    expect(pageSlice(xs, 9, 12)).toEqual([24, 25, 26, 27, 28, 29]);
    expect(pageSlice(xs, -3, 12)[0]).toBe(0);
    expect(pageOfIndex(11, 12)).toBe(0);
    expect(pageOfIndex(12, 12)).toBe(1);
    expect(pageOfIndex(-1, 12)).toBe(0);
  });

  it('jede Kategorie passt in wenige Seiten, Raster und Vorschau passen ins Fenster', () => {
    const L = WARDROBE_LAYOUT;
    for (const cat of WARDROBE_TABS) {
      const n = wardrobeItems(cat).length;
      expect(pageCount(n, perPage(cat))).toBeLessThanOrEqual(3);
    }
    const gridW = L.tile.cols * L.tile.w + (L.tile.cols - 1) * L.tile.gapX;
    const gridH = L.tile.rows * L.tile.h + (L.tile.rows - 1) * L.tile.gapY;
    const listW = L.list.cols * L.list.w + (L.list.cols - 1) * L.list.gapX;
    const listH = L.list.rows * L.list.h + (L.list.rows - 1) * L.list.gapY;
    for (const [w, h] of [[gridW, gridH], [listW, listH]]) {
      expect(L.pad + w).toBeLessThanOrEqual(L.preview.x - 16);
      expect(L.gridY + h).toBeLessThanOrEqual(L.preview.y + L.preview.h);
    }
    expect(L.preview.x + L.preview.w + L.pad).toBeLessThanOrEqual(L.w);
    expect(L.preview.y + L.preview.h).toBeLessThan(L.foot.y - 28);
    expect(L.strip.chipW * 5 + L.strip.gap * 4).toBeLessThanOrEqual(L.w - 2 * L.pad);
  });

  it('Zellen liegen zeilenweise', () => {
    expect(cellPos(0, 4, 100, 50, 10, 5)).toEqual({ x: 0, y: 0 });
    expect(cellPos(5, 4, 100, 50, 10, 5)).toEqual({ x: 110, y: 55 });
  });
});

describe('Wunderkammer: Hinweis auf die Quelle', () => {
  const none = { total: 0, byDeck: {} as Record<string, number> };

  it('Pfad Stück: Liga, Schwelle und Fortschritt mit den Gesamtpokalen', () => {
    const e = ROAD.find((x) => x.reward.startsWith('back_'))!;
    const half = Math.floor(e.threshold / 2);
    const li = lockInfo({ total: half, byDeck: {} }, e.reward);
    expect(li.source).toBe('road');
    expect(li.title).toContain(unlockHint(e.reward)!.label);
    expect(li.detail).toContain(fmt(e.threshold));
    expect(li.cur).toBe(half);
    expect(li.max).toBe(e.threshold);
    expect(li.frac).toBeCloseTo(half / e.threshold, 5);
    expect(li.reached).toBe(false);
  });

  it('Schwelle erreicht: Fortschritt gedeckelt, bereit zum Abholen', () => {
    const e = ROAD[0];
    const li = lockInfo({ total: e.threshold + 500, byDeck: {} }, e.reward);
    expect(li.reached).toBe(true);
    expect(li.frac).toBe(1);
    expect(li.cur).toBe(li.max);
  });

  it('Deck Stück: Deck Name und Pokale mit diesem Deck', () => {
    const li = lockInfo({ total: 9999, byDeck: { glut: 20 } }, 'back_deck_glut');
    expect(li.source).toBe('deck');
    expect(li.title).toContain('Glut');
    expect(li.cur).toBe(20);
    expect(li.reached).toBe(false);
    expect(lockInfo({ total: 9999, byDeck: { glut: 5000 } }, 'back_deck_glut').reached).toBe(true);
  });

  it('Stück ohne Pfad und Standard: kein Fortschritt, kein Fehler', () => {
    const li = lockInfo(none, '');
    expect(li.source).toBe('none');
    expect(li.max).toBe(0);
    expect(lockInfo(none, 'gibt_es_nicht').frac).toBe(0);
  });

  it('jedes Katalogstück hat eine Quelle', () => {
    for (const c of COSMETICS) expect(lockInfo(none, c.id).source).not.toBe('none');
  });
});

describe('Wunderkammer: Funken Vorschau', () => {
  it('Zufall ist deterministisch und liegt in [0, 1)', () => {
    const a = makeRand(7), b = makeRand(7);
    for (let i = 0; i < 50; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('Bahn bleibt in der Fläche', () => {
    const P = WARDROBE_LAYOUT.spark.path;
    for (let t = 0; t < 30; t += 0.37) {
      const p = wandPos(t, 400, 290, P);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(400);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(290);
    }
  });

  it('Deckkraft: 0 am Anfang und Ende, dazwischen sichtbar', () => {
    expect(sparkAlpha(0)).toBe(0);
    expect(sparkAlpha(1)).toBe(0);
    expect(sparkAlpha(0.12)).toBeCloseTo(1, 5);
    expect(sparkAlpha(0.5)).toBeGreaterThan(0.4);
    expect(sparkAlpha(-1)).toBe(0);
  });
});
