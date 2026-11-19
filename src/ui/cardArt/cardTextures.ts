import { BufferImageSource, Texture } from 'pixi.js';
import type { Rank, Suit } from '../../core/types';
import type { CardPaletteId } from '../../data/cardArt/cardPalettes';
import { renderCard, renderCardBack, type CardRenderOpts } from './cardRender';
import type { PixelBuffer } from './pixelBuffer';

// Pixi Texturen der Karten. Scharfe Pixel: scaleMode nearest, kein Mipmap, kein Glätten.
// Die Texturen werden beim ersten Bedarf gerendert und danach wiederverwendet.

const cache = new Map<string, Texture>();

function toTexture(buf: PixelBuffer): Texture {
  const source = new BufferImageSource({
    resource: buf.data,
    width: buf.w,
    height: buf.h,
    format: 'rgba8unorm',
    scaleMode: 'nearest',
    autoGenerateMipmaps: false,
  });
  return new Texture({ source });
}

function cached(key: string, make: () => PixelBuffer): Texture {
  let t = cache.get(key);
  if (!t) {
    t = toTexture(make());
    cache.set(key, t);
  }
  return t;
}

export function cardTexture(suit: Suit, rank: Rank, palette: CardPaletteId, opts: CardRenderOpts = {}): Texture {
  const key = `f:${palette}:${suit}:${opts.rankless ? 'x' : rank}:${opts.face ?? ''}`;
  return cached(key, () => renderCard(suit, rank, palette, opts));
}

export function cardBackTexture(color: number): Texture {
  return cached(`b:${color}`, () => renderCardBack(color));
}
