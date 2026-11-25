import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CARD_BASE, CARD_PALETTES, CARD_PALETTE_IDS, DEFAULT_CARD_PALETTE, FREE_CARD_PALETTES, type SuitColors } from './data/cardArt/cardPalettes';
import { CARD_PX_H, CARD_PX_W } from './data/cardArt/cardGlyphs';
import {
  COSMETICS, COSMETIC_DEFAULTS, DECK_TITLE_MAX_LEN, SKY_MIX, TITLE_MAX_LEN, cosmeticsOf, getCosmetic, paletteCosmeticId,
  type BackCosmetic, type SkyCosmetic, type SparkCosmetic,
} from './data/cosmetics';
import { DECKS } from './data/decks';
import { MOODS, type BgMood } from './data/juice';
import { DECK_STAGES, ROAD, ROAD_TITLES } from './data/trophyRoad';
import { COSMETIC_CATEGORIES, RARITY_ORDER } from './data/trophyTypes';
import { POINTER } from './data/spektakel';
import { newProfile, setProfileForTest } from './profile';
import { parseSettings, updateSettings } from './settings';
import { BACK_IDS, moonLit, renderBackById, renderBackFromParams, ZODIAC_GLYPHS } from './ui/cardArt/cardBackArt';
import { renderCard } from './ui/cardArt/cardRender';
import type { PixelBuffer } from './ui/cardArt/pixelBuffer';
import {
  activeBack, activeSky, activeSkyDrifts, applySkyToMood, effectiveCardPalette, ownedPalettes, paletteOwned, paletteOfCosmetic,
  rotateHueList, skyMoodFor, skyMoodSwatches, skySwatches, sparkColors, sparkColorsFor, sparkPreviewColors,
} from './ui/cosmeticFx';

const same = (a: PixelBuffer, b: PixelBuffer) => a.data.every((v, i) => v === b.data[i]);
const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const lum = (c: number) => { const [r, g, b] = rgb(c); return 0.3 * r + 0.59 * g + 0.11 * b; };
const dist = (a: number, b: number) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));

/** Profil mit besessener und ausgerüsteter Kosmetik */
function equipOwned(cat: 'back' | 'sky' | 'spark', id: string) {
  const p = newProfile();
  p.trophies.owned[id] = 1;
  p.trophies.equipped[cat] = id;
  setProfileForTest(p);
}

beforeEach(() => setProfileForTest(newProfile()));
afterEach(() => setProfileForTest(null));

describe('Katalog der Kosmetik', () => {
  it('69 Einträge: 17 Rücken, 4 Paletten, 8 Himmel, 6 Funken, 34 Titel', () => {
    expect(COSMETICS.length).toBe(69);
    expect(cosmeticsOf('back').length).toBe(17);
    expect(cosmeticsOf('palette').length).toBe(4);
    expect(cosmeticsOf('sky').length).toBe(8);
    expect(cosmeticsOf('spark').length).toBe(6);
    expect(cosmeticsOf('title').length).toBe(34);
  });

  it('Ids eindeutig, Präfix passt zur Kategorie, Rarität gültig, Texte vorhanden', () => {
    const prefix = { back: 'back_', palette: 'pal_', sky: 'sky_', spark: 'spark_', title: 'title_' } as const;
    expect(new Set(COSMETICS.map((c) => c.id)).size).toBe(COSMETICS.length);
    for (const c of COSMETICS) {
      expect(c.id.startsWith(prefix[c.category]), c.id).toBe(true);
      expect(RARITY_ORDER, c.id).toContain(c.rarity);
      expect(c.name.length, c.id).toBeGreaterThan(0);
      expect(c.description.length, c.id).toBeGreaterThan(5);
      expect(getCosmetic(c.id)).toBe(c);
      expect(`${c.name} ${c.description}`, `${c.id} Gedankenstrich`).not.toMatch(/[–—]| - /);
    }
    expect(getCosmetic('')).toBeUndefined();
    expect(getCosmetic('gibt_es_nicht')).toBeUndefined();
    for (const cat of COSMETIC_CATEGORIES) expect(COSMETIC_DEFAULTS[cat]).toBe('');
  });

  it('Ids, Namen und Raritäten der Rücken, Paletten, Himmel und Funken laut Plan', () => {
    const table = (cat: 'back' | 'palette' | 'sky' | 'spark') => cosmeticsOf(cat).map((c) => `${c.id}|${c.name}|${c.rarity}`);
    expect(table('back')).toEqual([
      'back_sternenstaub|Sternenstaub|common', 'back_kupferraute|Kupferraute|common', 'back_mondphasen|Mondphasen|rare',
      'back_retorte|Retortenglas|rare', 'back_astrolabium|Astrolabium|rare', 'back_tierkreis|Tierkreis|epic',
      'back_nebelwirbel|Nebelwirbel|epic', 'back_goldadern|Goldadern|epic', 'back_sonnenfinsternis|Sonnenfinsternis|legendary',
      'back_kometenbahn|Kometenbahn|legendary', 'back_deck_nachthimmel|Siegel des Nachthimmels|rare', 'back_deck_glut|Siegel der Glut|rare',
      'back_deck_tiefsee|Siegel der Tiefsee|rare', 'back_deck_waage|Siegel der Waage|rare', 'back_deck_alchemist|Siegel des Alchemisten|rare',
      'back_deck_sternenkind|Siegel des Sternenkinds|rare', 'back_deck_halbmond|Siegel des Halbmonds|rare',
    ]);
    expect(table('palette')).toEqual(['pal_bernstein|Bernstein|rare', 'pal_tintenmeer|Tintenmeer|rare', 'pal_mondsilber|Mondsilber|epic', 'pal_glutkern|Glutkern|epic']);
    expect(table('sky')).toEqual([
      'sky_smaragd|Smaragdnebel|common', 'sky_kupfer|Kupferdämmerung|common', 'sky_eisfeld|Eisfeld|rare', 'sky_blutmond|Blutmond|rare',
      'sky_polarlicht|Polarlichtnacht|epic', 'sky_goldstunde|Goldene Stunde|epic', 'sky_leere|Violette Leere|epic', 'sky_sonnenwende|Sonnenwende|legendary',
    ]);
    expect(table('spark')).toEqual([
      'spark_gold|Goldfunken|common', 'spark_eis|Eiskristalle|common', 'spark_glut|Glutregen|rare', 'spark_smaragd|Smaragdglanz|rare',
      'spark_aether|Ätherschweif|epic', 'spark_prisma|Prisma|legendary',
    ]);
  });

  it('Titel: Namen kurz, 8 Liga, 12 freie, 14 Deck, Deck Ids aus decks.ts', () => {
    const titles = cosmeticsOf('title');
    const league = titles.filter((t) => t.id.startsWith('title_liga_'));
    const deck = titles.filter((t) => t.id.startsWith('title_deck_'));
    expect(league.map((t) => t.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((i) => `title_liga_${i}`));
    expect(deck.length).toBe(14);
    expect(titles.length - league.length - deck.length).toBe(12);
    for (const d of DECKS) {
      expect(getCosmetic(`title_deck_${d.id}_1`)?.name).toMatch(/^Lehrling /);
      expect(getCosmetic(`title_deck_${d.id}_3`)?.name).toMatch(/^Meister /);
      expect(getCosmetic(`title_deck_${d.id}_3`)?.rarity).toBe('epic');
    }
    for (const t of titles) expect(t.name.length, t.name).toBeLessThanOrEqual(t.id.startsWith('title_deck_') ? DECK_TITLE_MAX_LEN : TITLE_MAX_LEN);
    expect(new Set(titles.map((t) => t.name)).size).toBe(34);
  });

  it('Titel stimmen mit ROAD_TITLES überein (Ids, Namen, Raritäten, Texte)', () => {
    const mine = cosmeticsOf('title');
    expect(mine.map((t) => t.id)).toEqual(ROAD_TITLES.map((t) => t.id));
    for (const r of ROAD_TITLES) {
      const c = getCosmetic(r.id);
      expect(c?.name, r.id).toBe(r.name);
      expect(c?.rarity, r.id).toBe(r.rarity);
      expect(c?.description, r.id).toBe(r.description);
    }
  });

  it('Jede Kosmetik kommt über genau einen Pfad Eintrag vor (Hauptpfad oder Deck Pfad)', () => {
    const rewards = [...ROAD.map((e) => e.reward), ...DECK_STAGES.map((s) => s.reward)];
    expect(new Set(rewards).size).toBe(rewards.length);
    expect([...rewards].sort()).toEqual(COSMETICS.map((c) => c.id).sort());
  });
});

describe('Kartenrücken', () => {
  const backs = cosmeticsOf('back') as readonly BackCosmetic[];

  it('Parameter: 2 bis 4 gültige Farben, Deck Siegel gehören zu Decks und tragen die Deckfarbe', () => {
    for (const b of backs) {
      expect(b.params.colors.length, b.id).toBeGreaterThanOrEqual(2);
      expect(b.params.colors.length, b.id).toBeLessThanOrEqual(4);
      for (const c of b.params.colors) expect(c >= 0 && c <= 0xffffff && Number.isInteger(c), b.id).toBe(true);
      if (b.id.startsWith('back_deck_')) {
        const deck = DECKS.find((d) => `back_deck_${d.id}` === b.id);
        expect(deck, b.id).toBeDefined();
        expect(b.params.pattern).toBe('wappen');
        expect(b.params.usesDeckColor).toBe(true);
        expect(b.params.deckId).toBe(deck!.id);
        expect(b.params.colors[0]).toBe(deck!.color);
      } else {
        expect(b.params.pattern).not.toBe('wappen');
        expect(b.params.usesDeckColor).toBe(false);
      }
    }
    expect(DECKS.every((d) => getCosmetic(`back_deck_${d.id}`))).toBe(true);
  });

  it('Größe, runde Ecken, weißer Rand wie der Standard Rücken, nur ganze Pixel, Mitte fest', () => {
    for (const id of BACK_IDS) {
      const b = renderBackById(id)!;
      expect(b.w).toBe(CARD_PX_W);
      expect(b.h).toBe(CARD_PX_H);
      expect(b.solid(0, 0), id).toBe(false);
      expect(b.solid(CARD_PX_W - 1, CARD_PX_H - 1), id).toBe(false);
      expect(b.solid(CARD_PX_W >> 1, CARD_PX_H >> 1), id).toBe(true);
      expect(b.get(2, CARD_PX_H >> 1), id).toBe(CARD_BASE.face);
      expect(b.get(CARD_PX_W - 3, CARD_PX_H >> 1), id).toBe(CARD_BASE.face);
      let bad = 0;
      for (let i = 3; i < b.data.length; i += 4) if (b.data[i] !== 0 && b.data[i] !== 255) bad++;
      expect(bad, id).toBe(0);
    }
  });

  it('Muster innerhalb des Rasters: außerhalb des Feldes liegen nur Rand und Konturfarbe', () => {
    for (const id of BACK_IDS) {
      const b = renderBackById(id)!;
      for (let y = 0; y < CARD_PX_H; y++) for (let x = 0; x < CARD_PX_W; x++) {
        const c = b.get(x, y);
        const inField = x >= 7 && x < CARD_PX_W - 7 && y >= 7 && y < CARD_PX_H - 7;
        if (!inField && c !== null) expect([CARD_BASE.face, CARD_BASE.outline], `${id} ${x},${y}`).toContain(c);
      }
    }
  });

  it('deterministisch: gleicher Aufruf, gleiche Pixel', () => {
    for (const id of BACK_IDS) expect(same(renderBackById(id)!, renderBackById(id)!), id).toBe(true);
    const b = backs[0];
    expect(same(renderBackFromParams(b.params), renderBackFromParams({ ...b.params }))).toBe(true);
  });

  it('alle 17 Rücken sind paarweise verschieden und mehrfarbig', () => {
    const seen = new Set<string>();
    for (const id of BACK_IDS) {
      const b = renderBackById(id)!;
      seen.add(b.data.join(','));
      const cols = new Set<number>();
      for (let y = 0; y < CARD_PX_H; y++) for (let x = 0; x < CARD_PX_W; x++) { const c = b.get(x, y); if (c !== null) cols.add(c); }
      expect(cols.size, id).toBeGreaterThanOrEqual(6);
    }
    expect(BACK_IDS.length).toBe(17);
    expect(seen.size).toBe(17);
  });

  it('Deck Wappen: jedes Deck hat ein eigenes Motiv (Mitte unterscheidet sich)', () => {
    const centers = new Set<string>();
    for (const d of DECKS) {
      const b = renderBackById(`back_deck_${d.id}`)!;
      let s = '';
      for (let y = 30; y < 84; y++) for (let x = 20; x < 62; x++) s += (b.get(x, y) ?? -1) + ',';
      centers.add(s);
    }
    expect(centers.size).toBe(DECKS.length);
  });

  it('Mondphasen: Neumond dunkel, Vollmond hell, Halbmond halb; zwölf verschiedene Zeichen im Tierkreis', () => {
    let lit = (p: number) => { let n = 0; for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) if (Math.hypot(x, y) < 9.5 && moonLit(p, x / 10, y / 10)) n++; return n; };
    expect(lit(0)).toBe(0);
    expect(lit(4)).toBeGreaterThan(250);
    expect(lit(2)).toBeGreaterThan(lit(1));
    expect(lit(3)).toBeGreaterThan(lit(2));
    expect(lit(6)).toBeLessThan(lit(5));
    lit = (p: number) => (moonLit(p, 0, 0) ? 1 : 0);
    expect(new Set(ZODIAC_GLYPHS.map((g) => g.join('|'))).size).toBe(12);
    for (const g of ZODIAC_GLYPHS) { expect(g.length).toBe(5); g.forEach((r) => expect(r.length).toBe(5)); }
  });
});

describe('Paletten', () => {
  const suits = ['S', 'H', 'C', 'D'] as const;
  const keys: (keyof SuitColors)[] = ['main', 'dark', 'light', 'tint', 'trim', 'trimLight', 'trimDark', 'gem', 'hair', 'hairDark', 'sec', 'secLight', 'secDark'];

  it('vollständig: sechs Paletten, alle Farben gültig, Ids laufen zusammen mit der Liste', () => {
    expect(CARD_PALETTE_IDS.length).toBe(6);
    expect([...CARD_PALETTE_IDS].sort()).toEqual(Object.keys(CARD_PALETTES).sort());
    for (const id of CARD_PALETTE_IDS) {
      const p = CARD_PALETTES[id];
      expect(p.id).toBe(id);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      for (const s of suits) for (const k of keys) {
        const v = p.suits[s][k];
        expect(Number.isInteger(v) && v >= 0 && v <= 0xffffff, `${id} ${s} ${k}`).toBe(true);
      }
    }
    expect(FREE_CARD_PALETTES).toEqual(['standard', 'kontrast']);
  });

  it('jede Palette Kosmetik zeigt auf eine Palette und kennt ihre Id zurück', () => {
    for (const c of cosmeticsOf('palette')) {
      expect(CARD_PALETTES[c.params.palette], c.id).toBeDefined();
      expect(paletteCosmeticId(c.params.palette)).toBe(c.id);
      expect(paletteOfCosmetic(c.id)).toBe(c.params.palette);
      expect(c.id).toBe(`pal_${c.params.palette}`);
    }
    expect(paletteCosmeticId('standard')).toBeNull();
    expect(paletteCosmeticId('kontrast')).toBeNull();
    expect(paletteOfCosmetic('back_goldadern')).toBeNull();
  });

  it('Lesbarkeit der neuen Paletten: Herz und Karo klar rot, Pik und Kreuz klar dunkel, Farben unterscheidbar', () => {
    for (const c of cosmeticsOf('palette')) {
      const p = CARD_PALETTES[c.params.palette].suits;
      for (const s of ['H', 'D'] as const) {
        const [r, g, b] = rgb(p[s].main);
        expect(r, `${c.id} ${s} rot`).toBeGreaterThan(g * 1.6);
        expect(r, `${c.id} ${s} rot`).toBeGreaterThan(b * 1.6);
        expect(r).toBeGreaterThan(180);
      }
      for (const s of ['S', 'C'] as const) expect(lum(p[s].main), `${c.id} ${s} dunkel`).toBeLessThan(75);
      // Rot gegen Dunkel deutlich getrennt
      for (const red of ['H', 'D'] as const) for (const dark of ['S', 'C'] as const) {
        expect(dist(p[red].main, p[dark].main), `${c.id} ${red} gegen ${dark}`).toBeGreaterThan(120);
        expect(lum(p[red].main) - lum(p[dark].main), `${c.id} ${red} gegen ${dark} Helligkeit`).toBeGreaterThan(30);
      }
      // alle vier Hauptfarben paarweise verschieden
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) expect(dist(p[suits[i]].main, p[suits[j]].main), `${c.id} ${suits[i]}${suits[j]}`).toBeGreaterThan(25);
      // Abstufungen: dark < main < light, tint sehr hell
      for (const s of suits) {
        expect(lum(p[s].dark)).toBeLessThan(lum(p[s].main));
        expect(lum(p[s].light)).toBeGreaterThan(lum(p[s].main));
        expect(lum(p[s].tint)).toBeGreaterThan(200);
      }
    }
  });

  it('Karten in den neuen Paletten rendern in fester Größe und unterscheiden sich von Standard', () => {
    for (const c of cosmeticsOf('palette')) {
      for (const s of suits) {
        const a = renderCard(s, 14, c.params.palette);
        expect(a.w).toBe(CARD_PX_W);
        expect(a.h).toBe(CARD_PX_H);
        expect(same(a, renderCard(s, 14, 'standard'))).toBe(false);
      }
    }
  });

  it('Einstellung: neue Paletten werden gelesen, Unbekanntes fällt auf Standard', () => {
    for (const id of CARD_PALETTE_IDS) expect(parseSettings({ cardPalette: id }).cardPalette).toBe(id);
    expect(parseSettings({ cardPalette: 'regenbogen' }).cardPalette).toBe(DEFAULT_CARD_PALETTE);
  });

  it('nicht besessene Palette fällt in der Anzeige auf Standard zurück, besessene gilt', () => {
    try {
      updateSettings({ cardPalette: 'bernstein' });
      expect(paletteOwned('bernstein')).toBe(false);
      expect(effectiveCardPalette()).toBe('standard');
      expect(ownedPalettes()).toEqual(['standard', 'kontrast']);
      const p = newProfile();
      p.trophies.owned.pal_bernstein = 1;
      setProfileForTest(p);
      expect(effectiveCardPalette()).toBe('bernstein');
      expect(ownedPalettes()).toEqual(['standard', 'kontrast', 'bernstein']);
      updateSettings({ cardPalette: 'kontrast' });
      expect(effectiveCardPalette()).toBe('kontrast');
    } finally {
      updateSettings({ cardPalette: DEFAULT_CARD_PALETTE });
    }
  });
});

describe('Himmel', () => {
  const skies = cosmeticsOf('sky') as readonly SkyCosmetic[];
  const kinds = Object.keys(MOODS) as BgMood[];
  const inUnit = (v: readonly number[]) => v.length === 3 && v.every((x) => Number.isFinite(x) && x >= 0 && x <= 1);

  it('Farben liegen zwischen 0 und 1, nur Sonnenwende wandert', () => {
    for (const s of skies) {
      expect(inUnit(s.params.deep), s.id).toBe(true);
      expect(inUnit(s.params.mid), s.id).toBe(true);
      expect(inUnit(s.params.accent), s.id).toBe(true);
      expect(!!s.params.hueDrift, s.id).toBe(s.id === 'sky_sonnenwende');
    }
    for (const k of kinds) for (const v of Object.values(SKY_MIX[k])) expect(v >= 0 && v <= 1).toBe(true);
  });

  it('ohne Himmel bleibt die Stimmung bitgleich (dasselbe Objekt, unverändert)', () => {
    const before = JSON.stringify(MOODS);
    for (const k of kinds) expect(applySkyToMood(MOODS[k], k, 12.5)).toBe(MOODS[k]);
    expect(JSON.stringify(MOODS)).toBe(before);
    expect(activeSky()).toBeNull();
    expect(activeSkyDrifts()).toBe(false);
  });

  it('Fallback auf Standard bei unbekannter, falscher oder nicht besessener Id', () => {
    const p = newProfile();
    p.trophies.equipped.sky = 'sky_smaragd';
    setProfileForTest(p);
    expect(applySkyToMood(MOODS.menu, 'menu')).toBe(MOODS.menu);
    for (const bad of ['sky_gibtsnicht', 'back_goldadern', 'pal_bernstein', 'sky_', 'xyz']) {
      const q = newProfile();
      q.trophies.owned[bad] = 1;
      q.trophies.equipped.sky = bad;
      setProfileForTest(q);
      expect(applySkyToMood(MOODS.menu, 'menu'), bad).toBe(MOODS.menu);
    }
    setProfileForTest({ ...newProfile(), trophies: null } as never);
    expect(applySkyToMood(MOODS.menu, 'menu')).toBe(MOODS.menu);
  });

  it('ausgerüsteter Himmel färbt jede Stimmung um, Werte bleiben gültig, Tempo und Kontrast bleiben', () => {
    for (const s of skies) {
      equipOwned('sky', s.id);
      for (const k of kinds) {
        const m = applySkyToMood(MOODS[k], k, 30);
        expect(m).not.toBe(MOODS[k]);
        expect(inUnit(m.deep) && inUnit(m.mid) && inUnit(m.accent), `${s.id} ${k}`).toBe(true);
        expect([m.speed, m.contrast, m.vignette, m.pulse]).toEqual([MOODS[k].speed, MOODS[k].contrast, MOODS[k].vignette, MOODS[k].pulse]);
        expect(m.mid, `${s.id} ${k}`).not.toEqual(MOODS[k].mid);
      }
    }
  });

  it('Boss Stimmung bleibt unter jedem Himmel erkennbar: Farbe weicht von den anderen ab, Tempo und Pulsieren bleiben', () => {
    for (const s of skies) {
      const boss = skyMoodFor(s.id, MOODS.boss, 'boss');
      expect(boss.speed).toBeGreaterThan(MOODS.small.speed);
      expect(boss.pulse).toBeGreaterThan(0);
      expect(boss.vignette).toBeGreaterThan(MOODS.small.vignette);
      for (const k of ['menu', 'small', 'big', 'shop'] as const) {
        const o = skyMoodFor(s.id, MOODS[k], k);
        const d = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        expect(d(boss.mid, o.mid) + d(boss.deep, o.deep) + d(boss.accent, o.accent), `${s.id} Boss gegen ${k}`).toBeGreaterThan(0.2);
      }
    }
  });

  it('Sonnenwende: Farbton wandert über die Zeit, kehrt nach einer Periode zurück, die anderen bleiben stehen', () => {
    const w = getCosmetic('sky_sonnenwende') as SkyCosmetic;
    const a = skyMoodFor(w.id, MOODS.menu, 'menu', 0);
    const b = skyMoodFor(w.id, MOODS.menu, 'menu', w.params.hueDrift!.periodS / 4);
    const c = skyMoodFor(w.id, MOODS.menu, 'menu', w.params.hueDrift!.periodS);
    expect(a.mid).not.toEqual(b.mid);
    a.mid.forEach((v, i) => expect(v).toBeCloseTo(c.mid[i], 6));
    for (const v of b.mid) expect(v >= 0 && v <= 1).toBe(true);
    equipOwned('sky', w.id);
    expect(activeSkyDrifts()).toBe(true);
    expect(skyMoodFor('sky_eisfeld', MOODS.menu, 'menu', 0)).toEqual(skyMoodFor('sky_eisfeld', MOODS.menu, 'menu', 55));
  });

  it('Vorschau Farben: drei Werte je Himmel, Standard bei unbekannter Id', () => {
    for (const s of skies) {
      const sw = skySwatches(s.id);
      expect(sw.length).toBe(3);
      for (const c of sw) expect(c >= 0 && c <= 0xffffff).toBe(true);
      expect(Object.keys(skyMoodSwatches(s.id)).sort()).toEqual([...kinds].sort());
    }
    expect(skySwatches('')).toEqual(skySwatches('sky_gibtsnicht'));
    expect(skyMoodSwatches('')).toEqual(skyMoodSwatches('xyz'));
  });
});

describe('Funken', () => {
  const sparks = cosmeticsOf('spark') as readonly SparkCosmetic[];
  const fallback = [0x111111, 0x222222];

  it('Palette nie leer, Farben gültig, Modi laut Plan', () => {
    for (const s of sparks) {
      expect(s.params.colors.length, s.id).toBeGreaterThanOrEqual(3);
      for (const c of s.params.colors) expect(Number.isInteger(c) && c >= 0 && c <= 0xffffff, s.id).toBe(true);
      expect(s.params.mode, s.id).toBe(s.id === 'spark_aether' ? 'multi' : s.id === 'spark_prisma' ? 'spectrum' : 'fixed');
    }
    // Ätherschweif ist wirklich mehrfarbig: mehrere deutlich verschiedene Töne
    const aether = (getCosmetic('spark_aether') as SparkCosmetic).params.colors;
    expect(aether.some((c) => dist(c, aether[0]) > 100)).toBe(true);
  });

  it('ohne Funken bleibt der Standard (dieselbe Liste), auch bei falscher Id', () => {
    expect(sparkColors(fallback)).toBe(fallback);
    expect(sparkColors()).toBe(POINTER.trailColors);
    const p = newProfile();
    p.trophies.owned.spark_gold = 1;
    p.trophies.equipped.spark = 'back_goldadern';
    setProfileForTest(p);
    expect(sparkColors(fallback)).toBe(fallback);
    p.trophies.equipped.spark = 'spark_unbekannt';
    expect(sparkColors(fallback)).toBe(fallback);
    p.trophies.owned = {};
    p.trophies.equipped.spark = 'spark_gold';
    expect(sparkColors(fallback)).toBe(fallback);
  });

  it('ausgerüstete Funken liefern ihre Farben, nie eine leere Liste', () => {
    for (const s of sparks) {
      equipOwned('spark', s.id);
      const c = sparkColors(fallback, 1234);
      expect(c.length, s.id).toBeGreaterThan(0);
      expect(c, s.id).not.toBe(fallback);
      if (s.params.mode !== 'spectrum') expect(c).toBe(s.params.colors);
    }
  });

  it('Prisma: Farben wechseln im Spektrum, gleiche Länge, Helligkeit bleibt ähnlich, Ablauf periodisch', () => {
    const prisma = getCosmetic('spark_prisma') as SparkCosmetic;
    const a = sparkColorsFor(prisma.id, 0)!;
    const b = sparkColorsFor(prisma.id, 1500)!;
    expect(a.length).toBe(prisma.params.colors.length);
    expect(a).not.toEqual(b);
    expect(sparkColorsFor(prisma.id, 6000)).toEqual(a);
    expect(rotateHueList([0xff0000], 120)[0]).toBe(0x00ff00);
    expect(rotateHueList([0xff0000], 0)[0]).toBe(0xff0000);
    for (const c of b) expect(c >= 0 && c <= 0xffffff).toBe(true);
  });

  it('Vorschau: Farben zur Id, Standard bei unbekannter Id', () => {
    expect(sparkPreviewColors('spark_eis')).toBe((getCosmetic('spark_eis') as SparkCosmetic).params.colors);
    expect(sparkPreviewColors('')).toBe(POINTER.trailColors);
    expect(sparkPreviewColors('spark_gibtsnicht')).toBe(POINTER.trailColors);
  });
});

describe('Rücken ausrüsten', () => {
  it('ohne Auswahl null, mit besessenem Rücken der Eintrag, sonst Standard', () => {
    expect(activeBack()).toBeNull();
    equipOwned('back', 'back_goldadern');
    expect(activeBack()?.id).toBe('back_goldadern');
    expect(activeBack()?.cosmetic.params.pattern).toBe('goldadern');
    const p = newProfile();
    p.trophies.equipped.back = 'back_goldadern';
    setProfileForTest(p);
    expect(activeBack()).toBeNull();
    for (const bad of ['back_gibtsnicht', 'sky_smaragd', '']) {
      const q = newProfile();
      q.trophies.owned[bad] = 1;
      q.trophies.equipped.back = bad;
      setProfileForTest(q);
      expect(activeBack(), bad).toBeNull();
    }
  });
});
