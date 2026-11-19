import { Texture } from 'pixi.js';
import { TILE_H, TILE_W } from '../data/jokerArt';
import { jokerTilePix } from './jokerTile';

// Joker Kacheln als Pixel Art Texturen. Die Motive stehen als Zeichencode in jokerSprites*.ts, hier wird
// pro Joker einmal ein Bild daraus gebaut (Canvas, ohne Glättung vergrößert) und zwischengespeichert.
// Es gibt keine Bilddateien, deshalb braucht die PWA dafür nichts im Precache.

const cache = new Map<string, Texture>();

/** Textur der ganzen Kachel (Rahmen, Motiv, Namensband) für einen Joker. */
export function jokerTexture(defId: string, rarity: string): Texture {
  const key = `${defId}|${rarity}`;
  let tex = cache.get(key);
  if (tex) return tex;
  const pix = jokerTilePix(defId, rarity);
  const canvas = document.createElement('canvas');
  canvas.width = TILE_W;
  canvas.height = TILE_H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(TILE_W, TILE_H);
  img.data.set(pix.toRGBA());
  ctx.putImageData(img, 0, 0);
  tex = Texture.from(canvas);
  // harte Pixelkanten, kein Weichzeichnen beim Vergrößern
  tex.source.scaleMode = 'nearest';
  cache.set(key, tex);
  return tex;
}
