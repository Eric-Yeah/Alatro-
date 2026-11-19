import { describe, expect, it } from 'vitest';
import { CONSUMABLES } from './data/consumables';
import { CART_H, CART_W, CONSUMABLE_FRAMES, CT_H, CT_W, RARE_CONSUMABLE_IDS } from './data/consumableArt';
import { consumableArtPix, consumableTilePix, hasConsumableSprite } from './ui/consumableTile';
import { CONSUMABLE_SPRITES } from './ui/consumableSprites';
import { NONE, Pix } from './ui/jokerPix';

// Prüft die Pixel Art der Consumables: jede Karte hat ein eigenes, vollständig gezeichnetes Motiv.

describe('Consumable Pixel Art', () => {
  it('es gibt 42 Consumables, jedes hat ein eigenes Motiv und es gibt keine verwaisten Motive', () => {
    expect(CONSUMABLES.length).toBe(42);
    const ids = new Set(CONSUMABLES.map((d) => d.id));
    for (const d of CONSUMABLES) expect(hasConsumableSprite(d.id), `Motiv fehlt: ${d.id}`).toBe(true);
    for (const id of Object.keys(CONSUMABLE_SPRITES)) expect(ids.has(id), `Motiv ohne Consumable: ${id}`).toBe(true);
    for (const id of RARE_CONSUMABLE_IDS) expect(ids.has(id), `Seltene ID unbekannt: ${id}`).toBe(true);
  });

  it('Motive füllen die ganze Fläche und sind farbenreich', () => {
    for (const d of CONSUMABLES) {
      const p = consumableArtPix(d.id);
      expect(p.w).toBe(CART_W);
      expect(p.h).toBe(CART_H);
      const raw = new Pix(CART_W, CART_H);
      CONSUMABLE_SPRITES[d.id](raw);
      expect(raw.count(), `Lücken im Motiv ${d.id}`).toBe(CART_W * CART_H);
      expect(new Set(p.data).size, `zu wenige Farben: ${d.id}`).toBeGreaterThanOrEqual(10);
    }
  });

  it('kein Motiv gleicht einem anderen (eigene Zeichnung, kein gemeinsames Einfärben)', () => {
    const arts = CONSUMABLES.map((d) => ({ id: d.id, p: consumableArtPix(d.id) }));
    for (let i = 0; i < arts.length; i++) {
      for (let j = i + 1; j < arts.length; j++) {
        let same = 0;
        for (let k = 0; k < arts[i].p.data.length; k++) if (arts[i].p.data[k] === arts[j].p.data[k]) same++;
        expect(same / arts[i].p.data.length, `${arts[i].id} und ${arts[j].id} sind zu ähnlich`).toBeLessThan(0.5);
      }
    }
  });

  it('Kachel hat Rahmen, abgerundete Ecken und je Art eine eigene Farbwelt', () => {
    const frames = new Set<number>();
    for (const [id, type] of [['sternbild_pair', 'sternbild'], ['elixier_gold', 'elixier'], ['omen_blutmond', 'omen']] as const) {
      const t = consumableTilePix(id);
      expect(t.w).toBe(CT_W);
      expect(t.h).toBe(CT_H);
      expect(t.get(0, 0), 'Ecke ist durchsichtig').toBe(NONE);
      expect(t.get(CT_W - 1, CT_H - 1)).toBe(NONE);
      expect(t.get(CT_W / 2, 0)).not.toBe(NONE);
      frames.add(t.get(2, 20));
      expect(t.get(1, 20)).toBe(CONSUMABLE_FRAMES[type].light);
    }
    expect(frames.size).toBe(3);
  });

  it('Karten verschiedener Arten unterscheiden sich im Rahmen deutlich', () => {
    const a = consumableTilePix('sternbild_pair'), b = consumableTilePix('elixier_gold'), c = consumableTilePix('omen_blutmond');
    // Rahmen (ohne Fenster): äußerer Streifen links, 3 Bildpunkte breit
    const edge = (t: Pix) => [1, 2, 3].map((x) => t.get(x, 30));
    expect(edge(a)).not.toEqual(edge(b));
    expect(edge(b)).not.toEqual(edge(c));
    expect(edge(a)).not.toEqual(edge(c));
  });
});
