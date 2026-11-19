import { describe, expect, it } from 'vitest';
import { PACKS, type PackKind, type PackSize } from './data/packs';
import { IDLE_FX, OPEN_FX, POP_FX } from './data/artFx';
import { PACK_DIMS, PACK_PALETTES } from './data/packArt';
import { PACK_MOTIFS } from './ui/packArtSprites';
import { packTilePix } from './ui/packTile';
import { NONE, Pix } from './ui/jokerPix';

// Prüft die Pixel Art der Booster Packs: jede Art hat ein eigenes Motiv, die Größen sind deutlich verschieden.

const KINDS: PackKind[] = ['joker', 'karten', 'sternbild', 'elixier', 'omen'];
const SIZES: PackSize[] = ['normal', 'jumbo', 'mega'];

describe('Pack Pixel Art', () => {
  it('es gibt 15 Packs aus 5 Arten in 3 Größen, jede Art hat Motiv und Farbwelt', () => {
    expect(PACKS.length).toBe(15);
    for (const k of KINDS) {
      expect(PACK_MOTIFS[k], `Motiv fehlt: ${k}`).toBeTypeOf('function');
      expect(PACK_PALETTES[k]).toBeTruthy();
      for (const s of SIZES) expect(PACKS.some((p) => p.kind === k && p.size === s), `${k} ${s}`).toBe(true);
    }
  });

  it('Motive füllen das ganze Fenster und sind farbenreich', () => {
    for (const k of KINDS) {
      for (const s of SIZES) {
        const d = PACK_DIMS[s];
        const raw = new Pix(d.iw, d.ih);
        PACK_MOTIFS[k](raw);
        expect(raw.count(), `Lücken im Fenster ${k} ${s}`).toBe(d.iw * d.ih);
        expect(new Set(raw.data).size, `zu wenige Farben ${k} ${s}`).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('Packs haben die Maße ihrer Größe, durchsichtige Ecken und werden von Normal über Jumbo zu Mega größer', () => {
    for (const k of KINDS) {
      let lastArea = 0;
      for (const s of SIZES) {
        const t = packTilePix(k, s);
        expect(t.w).toBe(PACK_DIMS[s].w);
        expect(t.h).toBe(PACK_DIMS[s].h);
        expect(t.get(0, 0)).toBe(NONE);
        expect(t.get(t.w - 1, t.h - 1)).toBe(NONE);
        expect(t.get(t.w / 2, t.h / 2)).not.toBe(NONE);
        expect(t.w * t.h).toBeGreaterThan(lastArea * 1.15);
        lastArea = t.w * t.h;
      }
    }
  });

  it('kein Pack gleicht einem anderen gleicher Größe', () => {
    for (const s of SIZES) {
      const tiles = KINDS.map((k) => ({ k, p: packTilePix(k, s) }));
      for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
          let same = 0;
          for (let n = 0; n < tiles[i].p.data.length; n++) if (tiles[i].p.data[n] === tiles[j].p.data[n]) same++;
          expect(same / tiles[i].p.data.length, `${tiles[i].k} und ${tiles[j].k} (${s}) sind zu ähnlich`).toBeLessThan(0.5);
        }
      }
    }
  });

  it('Zahlen für Juice sind vernünftig (wenige Partikel, kurze Zeiten)', () => {
    expect(OPEN_FX.particles).toBeLessThanOrEqual(40);
    expect(OPEN_FX.particlesCalmShare).toBeLessThan(1);
    expect(OPEN_FX.wobbleBeats * OPEN_FX.wobbleMs + OPEN_FX.glowMs + OPEN_FX.swellMs + OPEN_FX.fanMs).toBeLessThan(1500);
    expect(IDLE_FX.sparksPack).toBeLessThanOrEqual(8);
    expect(POP_FX.hoverScale).toBeGreaterThan(1);
    expect(POP_FX.pressScale).toBeLessThan(1);
  });
});
