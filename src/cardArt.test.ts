import { describe, expect, it } from 'vitest';
import { ACE, CARD_PX_H, CARD_PX_W, COURT_HALF, COURT_PANEL, INDEX_FONT, PIP_LAYOUT, PIP_SIZE, SUIT_PIP, SUIT_SMALL } from './data/cardArt/cardGlyphs';
import { CARD_BASE, CARD_PALETTES, CARD_PALETTE_IDS } from './data/cardArt/cardPalettes';
import { FACE_BASE, FACE_HALF_W, FACE_OVERLAY, FACE_ROWS, faceHalfRows, type FaceKind } from './data/cardArt/faceSprites';
import { COURT_PATTERN, FIGURE, FIGURES, type CourtId } from './data/cardArt/courtSprites';
import { RANKS, SUITS } from './data/cards';
import { DEFAULT_SETTINGS } from './data/juice';
import { parseSettings } from './settings';
import { courtColors, figureCells, renderCard, renderCardBack } from './ui/cardArt/cardRender';
import { scale2x } from './ui/cardArt/gridOps';
import { PixelBuffer } from './ui/cardArt/pixelBuffer';

const same = (a: PixelBuffer, b: PixelBuffer) => a.data.every((v, i) => v === b.data[i]);
const ids = Object.keys(FIGURES) as CourtId[];

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
          let bad = 0;
          for (let i = 3; i < b.data.length; i += 4) if (b.data[i] !== 0 && b.data[i] !== 255) bad++;
          expect(bad).toBe(0);
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

  it('Pips liegen frei: Zahl der Pip Pixel passt zur Anzahl der Pips und kein Pip berührt den Index', () => {
    for (const id of CARD_PALETTE_IDS) {
      for (const suit of SUITS) {
        const s = CARD_PALETTES[id].suits[suit];
        const colors = new Set([s.main, s.light, s.dark]);
        const pixels = SUIT_PIP[suit].join('').split('#').length - 1;
        for (const rank of RANKS.filter((r) => r >= 2 && r <= 10)) {
          const b = renderCard(suit, rank, id);
          let n = 0;
          // Pip Zone zwischen den Indexspalten, Glanzpunkte (weiß) gehören nicht zur Farbe und zählen nicht
          for (let y = 0; y < CARD_PX_H; y++) for (let x = 14; x < CARD_PX_W - 14; x++) { const c = b.get(x, y); if (c !== null && colors.has(c)) n++; }
          const spots = PIP_LAYOUT[rank]?.length ?? 0;
          // jeder Pip hat 2 mal 'pixels' Pixel (gespiegelte halbe Zeilen), ein paar Pixel pro Pip sind Glanz
          expect(n, `${suit}${rank} ${id}`).toBeGreaterThan(spots * pixels * 2 - spots * 8);
          expect(n, `${suit}${rank} ${id}`).toBeLessThanOrEqual(spots * pixels * 2);
        }
      }
    }
  });

  it('Pips überlappen nicht und passen in die Karte', () => {
    for (const suit of SUITS) {
      for (const rank of RANKS.filter((r) => r >= 2 && r <= 10)) {
        const spots = PIP_LAYOUT[rank] ?? [];
        const claimed = new Map<string, string>();
        spots.forEach(([col, row], k) => {
          const x0 = { L: 15, C: 33, R: 51 }[col];
          for (let dy = 0; dy < PIP_SIZE; dy++) {
            for (let dx = 0; dx < PIP_SIZE; dx++) {
              const half = SUIT_PIP[suit][row > 49 ? PIP_SIZE - 1 - dy : dy];
              const mirrored = half + [...half].reverse().join('');
              const px = row > 49 ? PIP_SIZE - 1 - dx : dx;
              if (mirrored[px] !== '#') continue;
              const key = `${x0 + dx},${row + dy}`;
              expect(claimed.has(key), `${suit}${rank} Pip ${k} überlappt ${claimed.get(key)}`).toBe(false);
              claimed.set(key, String(k));
            }
          }
        });
        for (const key of claimed.keys()) {
          const [x, y] = key.split(',').map(Number);
          expect(x).toBeGreaterThan(13);
          expect(x).toBeLessThan(CARD_PX_W - 14);
          expect(y).toBeGreaterThan(6);
          expect(y).toBeLessThan(CARD_PX_H - 7);
        }
      }
    }
  });

  it('Index unten rechts ist der um 180 Grad gedrehte Index oben links', () => {
    const b = renderCard('H', 7, 'standard');
    const main = CARD_PALETTES.standard.suits.H.main;
    const light = CARD_PALETTES.standard.suits.H.light;
    const dark = CARD_PALETTES.standard.suits.H.dark;
    const on = (x: number, y: number) => [main, light, dark].includes(b.get(x, y) ?? -1);
    for (let y = 4; y < 24; y++) for (let x = 3; x < 16; x++) expect(on(x, y)).toBe(on(CARD_PX_W - 1 - x, CARD_PX_H - 1 - y));
  });

  it('Zwölf Bildkarten haben je eine eigene Figur mit gültigen Rastern und Zeichen', () => {
    expect(ids.length).toBe(12);
    expect(new Set(ids.map((id) => figureCells(id, CARD_PALETTES.standard.suits[id[0] as 'S']).map((r) => r.join('')).join('\n'))).size).toBe(12);
    expect(new Set(ids.map((id) => FIGURES[id].name)).size).toBe(12);
    for (const id of ids) {
      const f = FIGURES[id];
      f.hat.forEach((r) => expect(r.length, `${id} Hut`).toBe((FIGURE.headW + 1) / 2));
      expect(f.hat.length, `${id} Hut Höhe`).toBeLessThanOrEqual(7);
      expect(f.body.length, `${id} Körper`).toBe(FIGURE.bodyRows);
      f.body.forEach((r) => expect(r.length, `${id} Körper Breite`).toBe((FIGURE.w + 1) / 2));
      expect(f.emblem.length).toBe(1);
      for (const h of f.held) {
        const w = h.rows[0].length;
        h.rows.forEach((r) => expect(r.length, `${id} Gegenstand`).toBe(w));
      }
      const g = figureCells(id, CARD_PALETTES.standard.suits.S);
      expect(g.length).toBe(FIGURE.h * 2);
      g.forEach((r) => expect(r.length).toBe(FIGURE.w * 2));
    }
    // alle Zeichen sind in der Farbtabelle (beide Paletten)
    for (const pid of CARD_PALETTE_IDS) {
      const map = courtColors(CARD_PALETTES[pid].suits.S);
      for (const id of ids) {
        const chars = new Set<string>([...figureCells(id, CARD_PALETTES[pid].suits.S).flat(), ...FIGURES[id].held.flatMap((h) => [...h.rows.join('')])]);
        for (const c of chars) if (c !== '.') expect(map[c], `${id} Zeichen ${c}`).toBeDefined();
      }
    }
    expect(Object.keys(COURT_PATTERN).length).toBe(4);
  });

  it('Gesichter: alle Arten haben gültige feine Raster', () => {
    expect(FACE_BASE.length).toBe(FACE_ROWS);
    FACE_BASE.forEach((r) => expect(r.length).toBe(FACE_HALF_W));
    for (const kind of Object.keys(FACE_OVERLAY) as FaceKind[]) {
      expect(FACE_OVERLAY[kind].length, kind).toBe(FACE_ROWS);
      FACE_OVERLAY[kind].forEach((r) => expect(r.length, kind).toBe(FACE_HALF_W));
      expect(faceHalfRows(kind).length).toBe(FACE_ROWS);
    }
    expect(new Set((Object.keys(FACE_OVERLAY) as FaceKind[]).map((k) => faceHalfRows(k).join('|'))).size).toBe(7);
  });

  it('Scale2x verdoppelt Raster und glättet Schrägen', () => {
    const g = scale2x(['.#.', '###', '.#.']);
    expect(g.length).toBe(6);
    g.forEach((r) => expect(r.length).toBe(6));
    // die Spitze oben bleibt, die Ecken werden durch Glättung abgeschrägt
    expect(g[0].includes('#')).toBe(true);
    const block = scale2x(['###', '###', '###']);
    expect(block[2]).toBe('######');
    expect(block[3]).toBe('######');
  });

  it('Bildkarten: mehrfarbig, die Kartenfarbe bleibt erkennbar, Figuren füllen den Rahmen', () => {
    for (const id of CARD_PALETTE_IDS) {
      for (const suit of SUITS) {
        for (const rank of [11, 12, 13] as const) {
          const b = renderCard(suit, rank, id);
          const colors = new Map<number, number>();
          let solid = 0;
          for (let y = COURT_HALF.y; y < COURT_HALF.y + COURT_HALF.h; y++) for (let x = COURT_HALF.x; x < COURT_HALF.x + COURT_HALF.w; x++) {
            const c = b.get(x, y);
            if (c !== null) colors.set(c, (colors.get(c) ?? 0) + 1);
            if (c !== null && c !== CARD_PALETTES[id].suits[suit].tint) solid++;
          }
          expect(colors.size, `${suit}${rank} ${id}`).toBeGreaterThanOrEqual(24);
          const s = CARD_PALETTES[id].suits[suit];
          const suitPixels = [s.main, s.light, s.dark].reduce((n, c) => n + (colors.get(c) ?? 0), 0);
          expect(suitPixels, `${suit}${rank} ${id} Kartenfarbe`).toBeGreaterThan(100);
          expect(solid, `${suit}${rank} Füllung`).toBeGreaterThan(COURT_HALF.w * COURT_HALF.h * 0.5);
        }
      }
    }
  });

  it('Untere Hälfte der Bildkarten ist die gedrehte obere', () => {
    const b = renderCard('S', 13, 'standard');
    const top = new PixelBuffer(COURT_HALF.w, COURT_HALF.h);
    const bottom = new PixelBuffer(COURT_HALF.w, COURT_HALF.h);
    const by = COURT_PANEL.y + COURT_PANEL.h - 1 - COURT_HALF.h;
    for (let y = 0; y < COURT_HALF.h; y++) for (let x = 0; x < COURT_HALF.w; x++) {
      const t = b.get(COURT_HALF.x + x, COURT_HALF.y + y), u = b.get(COURT_HALF.x + x, by + y);
      if (t !== null) top.set(x, y, t);
      if (u !== null) bottom.set(x, y, u);
    }
    expect(same(top.rotated180(), bottom)).toBe(true);
  });

  it('Ass: großes verziertes Symbol, alle vier verschieden und mehrfarbig', () => {
    for (const id of CARD_PALETTE_IDS) {
      const seen = new Set<string>();
      for (const suit of SUITS) {
        const b = renderCard(suit, 14, id);
        seen.add(b.data.join(','));
        const colors = new Set<number>();
        for (let y = 20; y < 94; y++) for (let x = 14; x < 68; x++) { const c = b.get(x, y); if (c !== null) colors.add(c); }
        expect(colors.size).toBeGreaterThanOrEqual(8);
        // Symbol mindestens ACE.w breit in der Mitte
        let w = 0;
        for (let x = 0; x < CARD_PX_W; x++) {
          const c = b.get(x, CARD_PX_H >> 1);
          const s = CARD_PALETTES[id].suits[suit];
          if (c !== null && [s.main, s.light, s.dark].includes(c)) w++;
        }
        expect(w).toBeGreaterThan(ACE.w * 0.4);
      }
      expect(seen.size).toBe(4);
    }
  });

  it('Raster der Symbole und Schrift sind rechteckig', () => {
    for (const suit of SUITS) {
      SUIT_SMALL[suit].forEach((r) => expect(r.length).toBe(5));
      expect(SUIT_SMALL[suit].length).toBe(9);
      SUIT_PIP[suit].forEach((r) => expect(r.length).toBe(PIP_SIZE / 2));
      expect(SUIT_PIP[suit].length).toBe(PIP_SIZE);
    }
    for (const g of Object.values(INDEX_FONT)) {
      expect(g.length).toBe(7);
      g.forEach((r) => expect(r.length).toBe(g[0].length));
    }
  });

  it('Kartenrücken: fest, mit Rand, abhängig von der Deckfarbe', () => {
    const a = renderCardBack(0x5b3fa8);
    const b = renderCardBack(0xa83f3f);
    expect(a.solid(CARD_PX_W >> 1, CARD_PX_H >> 1)).toBe(true);
    expect(a.solid(0, 0)).toBe(false);
    expect(same(a, b)).toBe(false);
    expect(a.get(2, CARD_PX_H >> 1)).toBe(CARD_BASE.face);
  });

  it('Kartenpalette in den Einstellungen: Standard bei fehlendem oder falschem Wert', () => {
    expect(parseSettings(null).cardPalette).toBe(DEFAULT_SETTINGS.cardPalette);
    expect(parseSettings({ cardPalette: 'bunt' }).cardPalette).toBe('standard');
    expect(parseSettings({ cardPalette: 'kontrast' }).cardPalette).toBe('kontrast');
  });
});
