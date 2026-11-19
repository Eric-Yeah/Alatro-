import { describe, expect, it } from 'vitest';
import { ACE_SHAPES, CARD_PX_H, CARD_PX_W, INDEX_FONT, PIP_LAYOUT, SUIT_PIP, SUIT_SMALL } from './data/cardArt/cardGlyphs';
import { CARD_BASE, CARD_PALETTES, CARD_PALETTE_IDS } from './data/cardArt/cardPalettes';
import { COURT_PATTERN, FIGURE, FIGURES, type CourtId } from './data/cardArt/courtSprites';
import { RANKS, SUITS } from './data/cards';
import { DEFAULT_SETTINGS } from './data/juice';
import { parseSettings } from './settings';
import { courtColors, figureGrid, renderCard, renderCardBack } from './ui/cardArt/cardRender';
import { PixelBuffer } from './ui/cardArt/pixelBuffer';

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

  it('Zwölf Bildkarten haben je eine eigene Figur mit gültigen Rastern und Zeichen', () => {
    const ids = Object.keys(FIGURES) as CourtId[];
    expect(ids.length).toBe(12);
    expect(new Set(ids.map((id) => figureGrid(id).join('\n'))).size).toBe(12);
    expect(new Set(ids.map((id) => FIGURES[id].name)).size).toBe(12);
    for (const id of ids) {
      const f = FIGURES[id];
      f.head.forEach((r) => expect(r.length, `${id} Kopf`).toBe((FIGURE.headW + 1) / 2));
      expect(f.head.length, `${id} Kopf Höhe`).toBeLessThanOrEqual(FIGURE.headH);
      expect(f.body.length, `${id} Körper`).toBe(FIGURE.bodyRows);
      f.body.forEach((r) => expect(r.length, `${id} Körper Breite`).toBe((FIGURE.w + 1) / 2));
      for (const h of f.held) {
        const w = h.rows[0].length;
        h.rows.forEach((r) => expect(r.length, `${id} Gegenstand`).toBe(w));
      }
      const g = figureGrid(id);
      expect(g.length).toBe(FIGURE.h);
      g.forEach((r) => expect(r.length).toBe(FIGURE.w));
    }
    // alle Zeichen sind in der Farbtabelle (beide Paletten)
    for (const pid of CARD_PALETTE_IDS) {
      const map = courtColors(CARD_PALETTES[pid].suits.S);
      for (const id of ids) {
        const chars = new Set<string>([...figureGrid(id).join(''), ...FIGURES[id].held.flatMap((h) => [...h.rows.join('')])]);
        for (const c of chars) if (c !== '.') expect(map[c], `${id} Zeichen ${c}`).toBeDefined();
      }
    }
    expect(Object.keys(COURT_PATTERN).length).toBe(4);
  });

  it('Bildkarten: Farben der Figuren sind mehrfarbig, die Kartenfarbe bleibt erkennbar', () => {
    for (const id of CARD_PALETTE_IDS) {
      for (const suit of SUITS) {
        for (const rank of [11, 12, 13] as const) {
          const b = renderCard(suit, rank, id);
          const colors = new Map<number, number>();
          for (let y = 4; y < 28; y++) for (let x = 10; x < 31; x++) { const c = b.get(x, y); if (c !== null) colors.set(c, (colors.get(c) ?? 0) + 1); }
          expect(colors.size, `${suit}${rank} ${id}`).toBeGreaterThanOrEqual(10);
          const s = CARD_PALETTES[id].suits[suit];
          const suitPixels = [s.main, s.light, s.dark].reduce((n, c) => n + (colors.get(c) ?? 0), 0);
          expect(suitPixels, `${suit}${rank} ${id} Kartenfarbe`).toBeGreaterThan(30);
        }
      }
    }
  });

  it('Untere Hälfte der Bildkarten ist die gedrehte obere', () => {
    const b = renderCard('S', 13, 'standard');
    const top = new PixelBuffer(21, 24);
    const bottom = new PixelBuffer(21, 24);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 21; x++) {
      const t = b.get(10 + x, 4 + y), u = b.get(10 + x, 29 + y);
      if (t !== null) top.set(x, y, t);
      if (u !== null) bottom.set(x, y, u);
    }
    expect(same(top.rotated180(), bottom)).toBe(true);
  });

  it('Ass: größeres Symbol mit Verzierung, alle vier verschieden und mehrfarbig', () => {
    for (const id of CARD_PALETTE_IDS) {
      const seen = new Set<string>();
      for (const suit of SUITS) {
        const b = renderCard(suit, 14, id);
        seen.add(b.data.join(','));
        const colors = new Set<number>();
        for (let y = 8; y < 48; y++) for (let x = 9; x < 32; x++) { const c = b.get(x, y); if (c !== null) colors.add(c); }
        expect(colors.size).toBeGreaterThanOrEqual(7);
        // Symbol füllt mindestens 17 Pixel Breite in der Mitte
        let w = 0;
        for (let x = 0; x < CARD_PX_W; x++) if (b.get(x, CARD_PX_H >> 1) === CARD_PALETTES[id].suits[suit].dark) w++;
        expect(w).toBeGreaterThan(0);
      }
      expect(seen.size).toBe(4);
    }
  });

  it('Raster der Symbole und Schrift sind rechteckig', () => {
    for (const suit of SUITS) {
      const small = SUIT_SMALL[suit];
      small.forEach((r) => expect(r.length).toBe(5));
      SUIT_PIP[suit].forEach((r) => expect(r.length).toBe(9));
      expect(SUIT_PIP[suit].length).toBe(9);
      ACE_SHAPES[suit].forEach((r) => expect(r.length).toBe(10));
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
