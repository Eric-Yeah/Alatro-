import { describe, expect, it } from 'vitest';
import { ACE_SHAPES, CARD_PX_H, CARD_PX_W, INDEX_FONT, PIP_LAYOUT, SUIT_PIP, SUIT_SMALL } from './data/cardArt/cardGlyphs';
import { CARD_BASE, CARD_PALETTES, CARD_PALETTE_IDS } from './data/cardArt/cardPalettes';
import { COURT_HALF_ROWS, COURT_HELD } from './data/cardArt/courtSprites';
import { RANKS, SUITS } from './data/cards';
import { DEFAULT_SETTINGS } from './data/juice';
import { parseSettings } from './settings';
import { courtColors, renderCard, renderCardBack } from './ui/cardArt/cardRender';
import { mirrorRows, PixelBuffer } from './ui/cardArt/pixelBuffer';

const same = (a: PixelBuffer, b: PixelBuffer) => a.data.every((v, i) => v === b.data[i]);

describe('Pixel Art Karten', () => {
  it('rendert alle 52 Karten in beiden Paletten in der festen Größe', () => {
    for (const id of CARD_PALETTE_IDS) {
      for (const suit of SUITS) {
        for (const rank of RANKS) {
          const b = renderCard(suit, rank, id);
          expect(b.w).toBe(CARD_PX_W);
          expect(b.h).toBe(CARD_PX_H);
          // abgerundete Ecken sind durchsichtig, die Mitte ist fest, alle Pixel sind ganz oder gar nicht deckend
          expect(b.solid(0, 0)).toBe(false);
          expect(b.solid(CARD_PX_W - 1, CARD_PX_H - 1)).toBe(false);
          expect(b.solid(CARD_PX_W >> 1, CARD_PX_H >> 1)).toBe(true);
          for (let i = 3; i < b.data.length; i += 4) expect([0, 255]).toContain(b.data[i]);
        }
      }
    }
  });

  it('alle 52 Vorderseiten pro Palette sind verschieden, die Paletten unterscheiden sich', () => {
    const seen = new Set<string>();
    for (const id of CARD_PALETTE_IDS) {
      for (const suit of SUITS) for (const rank of RANKS) seen.add(renderCard(suit, rank, id).data.join(','));
    }
    expect(seen.size).toBe(104);
  });

  it('Pips liegen frei: Zahl der Pip Pixel passt zur Anzahl der Pips', () => {
    for (const id of CARD_PALETTE_IDS) {
      for (const suit of SUITS) {
        const main = CARD_PALETTES[id].suits[suit].main;
        const pixels = SUIT_PIP[suit].join('').split('#').length - 1;
        for (const rank of RANKS.filter((r) => r >= 2 && r <= 10)) {
          const b = renderCard(suit, rank, id);
          let n = 0;
          for (let y = 0; y < CARD_PX_H; y++) for (let x = 9; x < CARD_PX_W - 9; x++) if (b.get(x, y) === main) n++;
          expect(n, `${suit}${rank} ${id}`).toBe((PIP_LAYOUT[rank]?.length ?? 0) * pixels);
        }
      }
    }
  });

  it('Index unten rechts ist der um 180 Grad gedrehte Index oben links', () => {
    const b = renderCard('H', 7, 'standard');
    const main = CARD_PALETTES.standard.suits.H.main;
    for (let y = 2; y < 16; y++) {
      for (let x = 2; x < 9; x++) {
        expect(b.get(x, y) === main).toBe(b.get(CARD_PX_W - 1 - x, CARD_PX_H - 1 - y) === main);
      }
    }
  });

  it('Bildkarten: untere Hälfte ist die gedrehte obere, Zeilen und Zeichen sind gültig', () => {
    for (const court of ['J', 'Q', 'K'] as const) {
      const rows = COURT_HALF_ROWS[court];
      expect(rows.length).toBe(20);
      rows.forEach((r) => expect(r.length).toBe(8));
      expect(mirrorRows(rows)[0].length).toBe(15);
    }
    for (const id of CARD_PALETTE_IDS) {
      const map = courtColors(CARD_PALETTES[id].suits.S);
      const chars = new Set<string>();
      for (const court of ['J', 'Q', 'K'] as const) {
        COURT_HALF_ROWS[court].forEach((r) => [...r].forEach((c) => chars.add(c)));
        for (const suit of SUITS) {
          const held = COURT_HELD[suit][court];
          const w = held.rows[0].length;
          held.rows.forEach((r) => expect(r.length).toBe(w));
          held.rows.forEach((r) => [...r].forEach((c) => chars.add(c)));
        }
      }
      for (const c of chars) if (c !== '.') expect(map[c], `Zeichen ${c}`).toBeDefined();
    }
    const b = renderCard('S', 13, 'standard');
    const top = new PixelBuffer(17, 21);
    const bottom = new PixelBuffer(17, 21);
    for (let y = 0; y < 21; y++) for (let x = 0; x < 17; x++) {
      const t = b.get(10 + x, 4 + y), u = b.get(10 + x, 26 + y);
      if (t !== null) top.set(x, y, t);
      if (u !== null) bottom.set(x, y, u);
    }
    // Muster und Figur sind symmetrisch gedreht (Figurenhälfte liegt um 180 Grad)
    expect(same(top.rotated180(), bottom)).toBe(true);
  });

  it('Raster der Symbole und Schrift sind rechteckig', () => {
    for (const suit of SUITS) {
      const small = SUIT_SMALL[suit];
      small.forEach((r) => expect(r.length).toBe(5));
      SUIT_PIP[suit].forEach((r) => expect(r.length).toBe(7));
      expect(SUIT_PIP[suit].length).toBe(7);
      ACE_SHAPES[suit].forEach((r) => expect(r.length).toBe(8));
    }
    for (const g of Object.values(INDEX_FONT)) {
      expect(g.length).toBe(5);
      g.forEach((r) => expect(r.length).toBe(g[0].length));
    }
  });

  it('Kartenrücken: fest, mit Rand, abhängig von der Deckfarbe', () => {
    const a = renderCardBack(0x5b3fa8);
    const b = renderCardBack(0xa83f3f);
    expect(a.solid(CARD_PX_W >> 1, CARD_PX_H >> 1)).toBe(true);
    expect(a.solid(0, 0)).toBe(false);
    expect(same(a, b)).toBe(false);
    expect(a.get(1, CARD_PX_H >> 1)).toBe(CARD_BASE.face);
  });

  it('Kartenpalette in den Einstellungen: Standard bei fehlendem oder falschem Wert', () => {
    expect(parseSettings(null).cardPalette).toBe(DEFAULT_SETTINGS.cardPalette);
    expect(parseSettings({ cardPalette: 'bunt' }).cardPalette).toBe('standard');
    expect(parseSettings({ cardPalette: 'kontrast' }).cardPalette).toBe('kontrast');
  });
});
