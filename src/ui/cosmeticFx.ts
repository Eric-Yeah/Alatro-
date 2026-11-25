import type { Texture } from 'pixi.js';
import { CARD_PALETTES, DEFAULT_CARD_PALETTE, FREE_CARD_PALETTES, type CardPaletteId } from '../data/cardArt/cardPalettes';
import {
  PALETTE_PREVIEW_CARDS, SKY_MIX, SPARK_SPECTRUM_PERIOD_S, getCosmetic, paletteCosmeticId,
  type BackCosmetic, type Rgb, type SkyCosmetic, type SparkCosmetic,
} from '../data/cosmetics';
import { MOODS, type BgMood, type MoodDef } from '../data/juice';
import { POINTER } from '../data/spektakel';
import type { CosmeticCategory } from '../data/trophyTypes';
import { getProfile } from '../profile';
import { getSettings } from '../settings';
import { cardTexture, cosmeticBackTexture } from './cardArt/cardTextures';

// Anwendung der Kosmetik im Spiel (Fassade): Rücken, Palette, Himmel und Funken lesen den Zustand aus
// `getProfile().trophies.equipped` (Paletten aus `settings.cardPalette`). Fehlerhafte, unbekannte oder
// nicht besessene Ids fallen still auf den Standard zurück. Dazu die Vorschau Funktionen für die Wunderkammer.

// ───────────────────────────────────────────── Zustand lesen

/** Ausgerüstete Id der Kategorie, wenn sie im Katalog steht, zur Kategorie passt und besessen wird, sonst '' */
function validEquipped(cat: CosmeticCategory): string {
  try {
    const t = getProfile().trophies;
    const id = t.equipped[cat];
    if (typeof id !== 'string' || id === '') return '';
    const c = getCosmetic(id);
    return c && c.category === cat && id in t.owned ? id : '';
  } catch {
    return '';
  }
}

/** Ausgerüsteter Kartenrücken oder `null` (dann gilt die Deckfarbe) */
export function activeBack(): { id: string; cosmetic: BackCosmetic } | null {
  const id = validEquipped('back');
  const c = id ? getCosmetic(id) : undefined;
  return c && c.category === 'back' ? { id, cosmetic: c } : null;
}

/** Ausgerüsteter Himmel oder `null` */
export function activeSky(): SkyCosmetic | null {
  const id = validEquipped('sky');
  const c = id ? getCosmetic(id) : undefined;
  return c && c.category === 'sky' ? c : null;
}

/** Ausgerüstete Funken oder `null` */
export function activeSpark(): SparkCosmetic | null {
  const id = validEquipped('spark');
  const c = id ? getCosmetic(id) : undefined;
  return c && c.category === 'spark' ? c : null;
}

// ───────────────────────────────────────────── Paletten

/** Besitzt der Spieler diese Palette? Standard und Hoher Kontrast gehören immer dazu. */
export function paletteOwned(pal: CardPaletteId): boolean {
  if (FREE_CARD_PALETTES.includes(pal)) return true;
  const cid = paletteCosmeticId(pal);
  if (!cid) return false;
  try {
    return cid in getProfile().trophies.owned;
  } catch {
    return false;
  }
}

/** Alle Paletten, die zur Auswahl stehen (besessene), in Katalog Reihenfolge der Palette */
export function ownedPalettes(): CardPaletteId[] {
  return (Object.keys(CARD_PALETTES) as CardPaletteId[]).filter(paletteOwned);
}

/** Palette, mit der Karten gezeichnet werden: die gewählte, sonst Standard, wenn sie nicht (mehr) besessen wird */
export function effectiveCardPalette(): CardPaletteId {
  const sel = getSettings().cardPalette;
  return sel in CARD_PALETTES && paletteOwned(sel) ? sel : DEFAULT_CARD_PALETTE;
}

/** Palette zu einer Kosmetik Id (`null`, wenn die Id keine Palette ist) */
export function paletteOfCosmetic(id: string): CardPaletteId | null {
  const c = getCosmetic(id);
  return c && c.category === 'palette' ? c.params.palette : null;
}

// ───────────────────────────────────────────── Himmel

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mixRgb = (a: Rgb, b: Rgb, k: number): [number, number, number] => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/** Dreht den Farbton eines RGB Werts (0 bis 1) um `deg` Grad (Drehung um die Grauachse) */
export function rotateHueRgb(c: Rgb, deg: number): [number, number, number] {
  const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
  const s3 = Math.sqrt(1 / 3);
  const m = [
    cos + (1 - cos) / 3, (1 - cos) / 3 - s3 * sin, (1 - cos) / 3 + s3 * sin,
    (1 - cos) / 3 + s3 * sin, cos + (1 - cos) / 3, (1 - cos) / 3 - s3 * sin,
    (1 - cos) / 3 - s3 * sin, (1 - cos) / 3 + s3 * sin, cos + (1 - cos) / 3,
  ];
  const cl = (v: number) => Math.max(0, Math.min(1, v));
  return [cl(m[0] * c[0] + m[1] * c[1] + m[2] * c[2]), cl(m[3] * c[0] + m[4] * c[1] + m[5] * c[2]), cl(m[6] * c[0] + m[7] * c[1] + m[8] * c[2])];
}

/** Farben des Himmels zum Zeitpunkt `phaseS` (Sekunden), mit wanderndem Farbton falls vorgesehen */
function skyColors(sky: SkyCosmetic, phaseS: number): { deep: Rgb; mid: Rgb; accent: Rgb } {
  const d = sky.params.hueDrift;
  if (!d) return sky.params;
  const deg = d.deg * Math.sin((phaseS / d.periodS) * Math.PI * 2);
  return { deep: rotateHueRgb(sky.params.deep, deg), mid: rotateHueRgb(sky.params.mid, deg), accent: rotateHueRgb(sky.params.accent, deg) };
}

/** Stimmung unter einem bestimmten Himmel (Id muss ein Himmel sein, sonst bleibt die Stimmung unverändert) */
export function skyMoodFor(skyId: string, mood: MoodDef, kind: BgMood, phaseS = 0): MoodDef {
  const c = skyId ? getCosmetic(skyId) : undefined;
  if (!c || c.category !== 'sky') return mood;
  const col = skyColors(c, phaseS);
  const k = SKY_MIX[kind];
  return {
    ...mood,
    deep: mixRgb(mood.deep, col.deep, k.deep),
    mid: mixRgb(mood.mid, col.mid, k.mid),
    accent: mixRgb(mood.accent, col.accent, k.accent),
  };
}

/**
 * Mischt den ausgerüsteten Himmel in eine Stimmung. Ohne Himmel kommt dieselbe Stimmung unverändert zurück
 * (gleiches Objekt, also bitgleich). Tempo, Kontrast, Randabdunklung und Pulsieren bleiben, die Boss Stimmung
 * nimmt weniger vom Himmel an (`SKY_MIX`). Die Bossfarbe tönt der Hintergrund danach selbst (Boss Tönung).
 * `phaseS` ist die Zeit in Sekunden für den wandernden Farbton.
 */
export function applySkyToMood(mood: MoodDef, kind: BgMood, phaseS = 0): MoodDef {
  const sky = activeSky();
  return sky ? skyMoodFor(sky.id, mood, kind, phaseS) : mood;
}

/** Wandert der ausgerüstete Himmel (dann muss der Hintergrund die Stimmung laufend neu auflösen)? */
export function activeSkyDrifts(): boolean {
  return !!activeSky()?.params.hueDrift;
}

/** Kennung des ausgerüsteten Himmels, damit der Hintergrund einen Wechsel bemerkt ('' = Standard) */
export function activeSkyId(): string {
  return activeSky()?.id ?? '';
}

// ───────────────────────────────────────────── Funken

const toHex = (c: Rgb) => (Math.round(c[0] * 255) << 16) | (Math.round(c[1] * 255) << 8) | Math.round(c[2] * 255);
const fromHex = (h: number): [number, number, number] => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];

/** Farbliste um `deg` Grad im Farbkreis gedreht (0xRRGGBB) */
export function rotateHueList(colors: readonly number[], deg: number): number[] {
  return colors.map((h) => toHex(rotateHueRgb(fromHex(h), deg)));
}

/** Zeitschritte (ms) des Farbumlaufs beim Spektrum: so oft wird die Farbliste neu berechnet */
const SPECTRUM_STEP_MS = 80;
let spectrumCache: { id: string; bucket: number; list: number[] } | null = null;

/** Farben der Funken zu einer Kosmetik Id. Zum Zeitpunkt `nowMs` (nur beim Spektrum von Belang). */
export function sparkColorsFor(sparkId: string, nowMs: number = Date.now()): readonly number[] | null {
  const c = sparkId ? getCosmetic(sparkId) : undefined;
  if (!c || c.category !== 'spark' || c.params.colors.length === 0) return null;
  if (c.params.mode !== 'spectrum') return c.params.colors;
  const bucket = Math.floor(nowMs / SPECTRUM_STEP_MS);
  if (!spectrumCache || spectrumCache.id !== c.id || spectrumCache.bucket !== bucket) {
    const deg = ((bucket * SPECTRUM_STEP_MS) / (SPARK_SPECTRUM_PERIOD_S * 1000)) * 360;
    spectrumCache = { id: c.id, bucket, list: rotateHueList(c.params.colors, deg) };
  }
  return spectrumCache.list;
}

/**
 * Farben der Zeigerspur, der Tipp Funken und des Konfettis (Grafikstufe Supernova). Ohne ausgerüstete Funken
 * kommt `fallback` unverändert zurück (Standard: die Spur Farben aus `POINTER`, für Konfetti die eigene Liste übergeben).
 */
export function sparkColors(fallback: readonly number[] = POINTER.trailColors, nowMs: number = Date.now()): readonly number[] {
  const s = activeSpark();
  return (s && sparkColorsFor(s.id, nowMs)) || fallback;
}

// ───────────────────────────────────────────── Vorschau für die Wunderkammer

/**
 * Textur eines Kartenrückens zu einer Kosmetik Id. Für '' oder eine unbekannte Id `null`: dann zeigt die Oberfläche
 * die Deckfarbe (zum Beispiel mit `cardBack(deckColor, { ignoreEquipped: true })`).
 */
export function backPreviewTexture(id: string): Texture | null {
  return cosmeticBackTexture(id);
}

/** Beispielkarten einer Palette (Ass Pik, Dame Herz, 7 Kreuz, Ass Karo) als Texturen, immer in dieser Palette */
export function palettePreviewTextures(pal: CardPaletteId): Texture[] {
  const id = pal in CARD_PALETTES ? pal : DEFAULT_CARD_PALETTE;
  return PALETTE_PREVIEW_CARDS.map((c) => cardTexture(c.suit, c.rank, id));
}

/** Die drei Himmelsfarben (deep, mid, accent) als 0xRRGGBB, für die Farbleiste. '' oder unbekannt: Standard Menü. */
export function skySwatches(id: string, phaseS = 0): [number, number, number] {
  const m = skyMoodFor(id, MOODS.menu, 'menu', phaseS);
  const src = id && getCosmetic(id)?.category === 'sky' ? skyColors(getCosmetic(id) as SkyCosmetic, phaseS) : m;
  return [toHex(src.deep), toHex(src.mid), toHex(src.accent)];
}

/** Farben jeder Stimmung unter einem Himmel (für eine Vorschau mit allen fünf Stimmungen) */
export function skyMoodSwatches(id: string, phaseS = 0): Record<BgMood, [number, number, number]> {
  const out = {} as Record<BgMood, [number, number, number]>;
  for (const k of Object.keys(MOODS) as BgMood[]) {
    const m = skyMoodFor(id, MOODS[k], k, phaseS);
    out[k] = [toHex(m.deep), toHex(m.mid), toHex(m.accent)];
  }
  return out;
}

/** Funkenfarben einer Kosmetik Id für die Vorschau (bei '' oder unbekannt: Standard Farben), mit Zeit für das Spektrum */
export function sparkPreviewColors(id: string, nowMs: number = Date.now()): readonly number[] {
  return sparkColorsFor(id, nowMs) ?? POINTER.trailColors;
}
