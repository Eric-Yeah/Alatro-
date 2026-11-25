// Reine Rechnung der Wunderkammer (ohne Pixi und ohne DOM, getestet in wardrobeMath.test.ts):
// Stücke je Kategorie, Sortierung, Raster Seiten, Zustände, Hinweistexte, Bahn und Helligkeit der Funken Vorschau.

import { CARD_PALETTES, type CardPaletteId } from '../data/cardArt/cardPalettes';
import { COSMETICS, cosmeticsOf, type Cosmetic } from '../data/cosmetics';
import { DECK_STAGES } from '../data/trophyRoad';
import type { CosmeticCategory, CosmeticRarity } from '../data/trophyTypes';
import { WARDROBE_LAYOUT } from '../data/wardrobeLayout';
import { t } from '../i18n';
import { unlockHint } from '../trophies';
import { fmt } from './theme';

/** Ein Stück der Wunderkammer: ein Katalogeintrag oder ein Standardstück (immer vorhanden, `cosmeticId` ist dann '') */
export interface WardrobeItem {
  /** Eindeutig innerhalb der Kategorie (Kosmetik Id, bei Standardstücken `default:...`) */
  key: string;
  cat: CosmeticCategory;
  /** Kosmetik Id, '' für Standardstücke */
  cosmeticId: string;
  isDefault: boolean;
  name: string;
  description: string;
  /** null bei Standardstücken (kein Pfad Stück) */
  rarity: CosmeticRarity | null;
  /** Nur Kategorie Kartenfarben: die Palette, die dieses Stück einstellt */
  palette?: CardPaletteId;
}

export type ItemState = 'equipped' | 'owned' | 'locked';

/** Name der Kategorie (Reiter) */
export function categoryName(cat: CosmeticCategory): string {
  switch (cat) {
    case 'back': return t('Kartenrücken');
    case 'palette': return t('Kartenfarben');
    case 'sky': return t('Himmel');
    case 'spark': return t('Funken');
    default: return t('Titel');
  }
}

function defaultItems(cat: CosmeticCategory): WardrobeItem[] {
  const base = { cat, cosmeticId: '', isDefault: true, rarity: null } as const;
  switch (cat) {
    case 'back':
      return [{ ...base, key: 'default:back', name: t('Deckfarbe'), description: t('Der Rücken zeigt die Farbe des gewählten Decks.') }];
    case 'palette':
      return (['standard', 'kontrast'] as const).map((p) => ({
        ...base, key: `default:palette:${p}`, name: CARD_PALETTES[p].name, description: CARD_PALETTES[p].description, palette: p,
      }));
    case 'sky':
      return [{ ...base, key: 'default:sky', name: t('Standard'), description: t('Die Stimmungen der Sternwarte in ihren ursprünglichen Farben.') }];
    case 'spark':
      return [{ ...base, key: 'default:spark', name: t('Standard'), description: t('Die ursprünglichen Farben von Zeigerspur, Tipp Funken und Konfetti.') }];
    default:
      return [{ ...base, key: 'default:title', name: t('Kein Titel'), description: t('Ohne Titel steht auf dem Home Bildschirm nur dein Rang.') }];
  }
}

function catalogItem(c: Cosmetic): WardrobeItem {
  return {
    key: c.id, cat: c.category, cosmeticId: c.id, isDefault: false, name: c.name, description: c.description, rarity: c.rarity,
    palette: c.category === 'palette' ? c.params.palette : undefined,
  };
}

/** Alle Stücke einer Kategorie: Standardstücke zuerst, dann der Katalog in seiner Reihenfolge */
export function wardrobeItems(cat: CosmeticCategory): WardrobeItem[] {
  return [...defaultItems(cat), ...cosmeticsOf(cat).map(catalogItem)];
}

/** Schlüssel für das Sortieren der gesperrten Stücke: Hauptpfad nach Pokalen, danach Deck Pfade nach Pokalen */
function lockedRank(item: WardrobeItem): [number, number] {
  const h = unlockHint(item.cosmeticId);
  if (!h) return [2, 0];
  return [h.source === 'deck' ? 1 : 0, h.threshold];
}

/**
 * Anzeige Reihenfolge: Standardstücke zuerst, dann besessene (Katalog Reihenfolge), dann gesperrte,
 * und zwar das nächste erreichbare zuerst. Stabil: gleiche Eingabe gibt gleiche Reihenfolge.
 */
export function sortItems(items: readonly WardrobeItem[], owned: (item: WardrobeItem) => boolean): WardrobeItem[] {
  const idx = new Map(items.map((it, i) => [it, i]));
  const group = (it: WardrobeItem) => (it.isDefault ? 0 : owned(it) ? 1 : 2);
  return [...items].sort((a, b) => {
    const ga = group(a), gb = group(b);
    if (ga !== gb) return ga - gb;
    if (ga === 2) {
      const [sa, ta] = lockedRank(a), [sb, tb] = lockedRank(b);
      if (sa !== sb) return sa - sb;
      if (ta !== tb) return ta - tb;
    }
    return (idx.get(a) ?? 0) - (idx.get(b) ?? 0);
  });
}

/** Wird dieses Stück gerade getragen? Kartenfarben laufen über die Palette (Einstellungen), alles andere über die Kosmetik Id. */
export function isEquipped(item: WardrobeItem, equippedId: string, palette: CardPaletteId): boolean {
  if (item.cat === 'palette') return item.palette === palette;
  return item.cosmeticId === equippedId;
}

export function itemState(owned: boolean, equipped: boolean): ItemState {
  if (equipped) return 'equipped';
  return owned ? 'owned' : 'locked';
}

// ───────────────────────────────────────────── Raster und Seiten

/** Stücke pro Seite: Titel als Liste, sonst Kachel Raster */
export function perPage(cat: CosmeticCategory): number {
  const L = WARDROBE_LAYOUT;
  return cat === 'title' ? L.list.cols * L.list.rows : L.tile.cols * L.tile.rows;
}

export function pageCount(total: number, per: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, per)));
}

export function pageSlice<T>(items: readonly T[], page: number, per: number): T[] {
  const p = Math.max(0, Math.min(page, pageCount(items.length, per) - 1));
  return items.slice(p * per, (p + 1) * per);
}

/** Seite, auf der das Stück mit dem Index `index` steht (0 bei unbekanntem Index) */
export function pageOfIndex(index: number, per: number): number {
  return index < 0 ? 0 : Math.floor(index / Math.max(1, per));
}

/** Position der Kachel `i` auf der Seite (links oben der Zelle), Spalten und Abstände aus den Maßen */
export function cellPos(i: number, cols: number, w: number, h: number, gapX: number, gapY: number): { x: number; y: number } {
  return { x: (i % cols) * (w + gapX), y: Math.floor(i / cols) * (h + gapY) };
}

// ───────────────────────────────────────────── Zähler

/** Besessene und alle Stücke einer Kategorie, Standardstücke zählen nicht mit */
export function categoryCounts(cat: CosmeticCategory, owned: (id: string) => boolean): { have: number; total: number } {
  const list = cosmeticsOf(cat);
  return { have: list.filter((c) => owned(c.id)).length, total: list.length };
}

/** Besessene und alle Stücke des ganzen Katalogs (69), Standardstücke zählen nicht mit */
export function totalCounts(owned: (id: string) => boolean): { have: number; total: number } {
  return { have: COSMETICS.filter((c) => owned(c.id)).length, total: COSMETICS.length };
}

// ───────────────────────────────────────────── Hinweis auf die Quelle gesperrter Stücke

export interface LockInfo {
  source: 'road' | 'deck' | 'none';
  /** Erste Zeile: wo man es bekommt */
  title: string;
  /** Zweite Zeile: ab wie vielen Pokalen */
  detail: string;
  cur: number;
  max: number;
  /** 0 bis 1 */
  frac: number;
  /** Schwelle erreicht (das Stück wartet im Pokalpfad auf das Abholen) */
  reached: boolean;
}

/** Hinweistext und Fortschritt zu einem gesperrten Stück. `progress` sind die Gesamtpokale und die Pokale je Deck. */
export function lockInfo(progress: { total: number; byDeck: Readonly<Record<string, number>> }, cosmeticId: string): LockInfo {
  const hint = unlockHint(cosmeticId);
  if (!hint) {
    return { source: 'none', title: t('Nicht freischaltbar'), detail: '', cur: 0, max: 0, frac: 0, reached: false };
  }
  const stage = hint.source === 'deck' ? DECK_STAGES.find((s) => s.reward === cosmeticId) : undefined;
  const cur = hint.source === 'deck' ? progress.byDeck[stage?.deckId ?? ''] ?? 0 : progress.total;
  const max = hint.threshold;
  const frac = max > 0 ? Math.min(1, cur / max) : 1;
  return {
    source: hint.source,
    title: hint.source === 'road'
      ? t('Pokalpfad, Liga: {liga}', { liga: hint.label })
      : t('Deck Pfad: {deck}', { deck: hint.label }),
    detail: hint.source === 'road'
      ? t('Ab {n} Pokalen', { n: fmt(max) })
      : t('Ab {n} Pokalen mit diesem Deck', { n: fmt(max) }),
    cur: Math.min(cur, max),
    max,
    frac,
    reached: cur >= max,
  };
}

// ───────────────────────────────────────────── Funken Vorschau

/** Kleiner deterministischer Zufallsgenerator (mulberry32), nur für die Optik der Vorschau */
export function makeRand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return (((x ^ (x >>> 14)) >>> 0) / 4294967296);
  };
}

/** Lage des Zeigers der Funken Vorschau zur Zeit `tSec` (Mitte der Fläche plus Lissajous Bahn), Ursprung links oben */
export function wandPos(
  tSec: number, w: number, h: number,
  path: { ax: number; ay: number; fx: number; fy: number; phase: number },
): { x: number; y: number } {
  return {
    x: w / 2 + Math.sin(tSec * path.fx * Math.PI * 2) * w * path.ax,
    y: h / 2 + Math.sin(tSec * path.fy * Math.PI * 2 + path.phase) * h * path.ay,
  };
}

/** Deckkraft eines Funkens über sein Leben `k` (0 bis 1): schnell sichtbar, dann ausblenden */
export function sparkAlpha(k: number): number {
  const x = Math.max(0, Math.min(1, k));
  return x < 0.12 ? x / 0.12 : (1 - x) / 0.88;
}
