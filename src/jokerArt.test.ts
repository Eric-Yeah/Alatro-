import { describe, expect, it } from 'vitest';
import { JOKER_DEFS } from './data/jokers';
import { ART_H, ART_W, TILE_H, TILE_W } from './data/jokerArt';
import { hasJokerSprite, jokerArtPix, jokerTilePix } from './ui/jokerTile';
import { SPRITES } from './ui/jokerSprites';
import { NONE, Pix } from './ui/jokerPix';

// Prüft die Pixel Art der Joker: jeder Joker hat ein eigenes, vollständig gezeichnetes Motiv.

describe('Joker Pixel Art', () => {
  it('jeder Joker hat ein eigenes Motiv und es gibt keine verwaisten Motive', () => {
    const ids = new Set(JOKER_DEFS.map((d) => d.id));
    for (const d of JOKER_DEFS) expect(hasJokerSprite(d.id), `Motiv fehlt: ${d.id}`).toBe(true);
    for (const id of Object.keys(SPRITES)) expect(ids.has(id), `Motiv ohne Joker: ${id}`).toBe(true);
  });

  it('Motive füllen die ganze Fläche und sind farbenreich', () => {
    for (const d of JOKER_DEFS) {
      const p = jokerArtPix(d.id);
      expect(p.w).toBe(ART_W);
      expect(p.h).toBe(ART_H);
      // Das Motiv allein (ohne Grundfüllung) darf keine Lücken lassen
      const raw = new Pix(ART_W, ART_H);
      SPRITES[d.id](raw);
      expect(raw.count(), `Lücken im Motiv ${d.id}`).toBe(ART_W * ART_H);
      expect(new Set(p.data).size, `zu wenige Farben: ${d.id}`).toBeGreaterThanOrEqual(10);
    }
  });

  it('kein Motiv gleicht einem anderen (eigene Zeichnung, kein gemeinsames Einfärben)', () => {
    const arts = JOKER_DEFS.map((d) => ({ id: d.id, p: jokerArtPix(d.id) }));
    for (let i = 0; i < arts.length; i++) {
      for (let j = i + 1; j < arts.length; j++) {
        let same = 0;
        for (let k = 0; k < arts[i].p.data.length; k++) if (arts[i].p.data[k] === arts[j].p.data[k]) same++;
        const ratio = same / arts[i].p.data.length;
        expect(ratio, `${arts[i].id} und ${arts[j].id} sind zu ähnlich`).toBeLessThan(0.5);
      }
    }
  });

  it('Kachel hat Rahmen, abgerundete Ecken und je Seltenheit eine eigene Rahmenfarbe', () => {
    const frames = new Set<number>();
    for (const r of ['common', 'uncommon', 'rare', 'legendary']) {
      const t = jokerTilePix('funke', r);
      expect(t.w).toBe(TILE_W);
      expect(t.h).toBe(TILE_H);
      expect(t.get(0, 0), 'Ecke ist durchsichtig').toBe(NONE);
      expect(t.get(TILE_W - 1, TILE_H - 1)).toBe(NONE);
      expect(t.get(TILE_W / 2, 0)).not.toBe(NONE);
      frames.add(t.get(10, 2));
    }
    expect(frames.size).toBe(4);
  });
});
