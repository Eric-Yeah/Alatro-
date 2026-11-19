import type { Texture } from 'pixi.js';
import { pixTexture } from './artFx';
import { consumableTilePix } from './consumableTile';

// Consumable Karten als Pixel Art Texturen. Pro Karte wird einmal ein Bild gebaut und zwischengespeichert.
// Es gibt keine Bilddateien, die Grafik entsteht aus dem Zeichencode (PWA Precache unverändert).

const cache = new Map<string, Texture>();

export function consumableTexture(defId: string): Texture {
  let tex = cache.get(defId);
  if (!tex) {
    tex = pixTexture(consumableTilePix(defId));
    cache.set(defId, tex);
  }
  return tex;
}
