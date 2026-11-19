import type { Texture } from 'pixi.js';
import type { PackKind, PackSize } from '../data/packs';
import { pixTexture } from './artFx';
import { packTilePix } from './packTile';

// Pack Hüllen als Pixel Art Texturen, je Art und Größe einmal gebaut und zwischengespeichert.

const cache = new Map<string, Texture>();

export function packTexture(kind: PackKind, size: PackSize): Texture {
  const key = `${kind}|${size}`;
  let tex = cache.get(key);
  if (!tex) {
    tex = pixTexture(packTilePix(kind, size));
    cache.set(key, tex);
  }
  return tex;
}
