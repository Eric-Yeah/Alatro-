// Erzeugt Kartenblätter als PNG (ohne Beschriftung) für die Vorschau.
// Aufruf: npx vite-node tools/cardSheet.ts <ausgabeordner> [skalierung]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_PX_H, CARD_PX_W } from '../src/data/cardArt/cardGlyphs';
import { CARD_PALETTE_IDS } from '../src/data/cardArt/cardPalettes';
import { SUITS, RANKS } from '../src/data/cards';
import { renderCard, renderCardBack } from '../src/ui/cardArt/cardRender';
import { encodePng } from './pngWrite';

const out = process.argv[2] ?? 'preview';
const scale = Number(process.argv[3] ?? 4);
mkdirSync(out, { recursive: true });

const GAP = 3;
const BG = [0x1d, 0x2a, 0x3a];
const order = ['S', 'H', 'C', 'D'] as const;
const ranks = [14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
const faceRanks = [14, 11, 12, 13] as const;
void SUITS; void RANKS;

function sheet(id: (typeof CARD_PALETTE_IDS)[number], list: readonly number[], withBack: boolean, name: string) {
  const cols = list.length + (withBack ? 1 : 0);
  const rows = order.length;
  const W = (cols * (CARD_PX_W + GAP) + GAP) * scale;
  const H = (rows * (CARD_PX_H + GAP) + GAP) * scale;
  const rgba = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { rgba[i * 4] = BG[0]; rgba[i * 4 + 1] = BG[1]; rgba[i * 4 + 2] = BG[2]; rgba[i * 4 + 3] = 255; }
  const put = (buf: { w: number; h: number; data: Uint8Array }, gx: number, gy: number) => {
    for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) {
      const si = (y * buf.w + x) * 4;
      if (!buf.data[si + 3]) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const di = (((gy + y) * scale + dy) * W + (gx + x) * scale + dx) * 4;
        rgba[di] = buf.data[si]; rgba[di + 1] = buf.data[si + 1]; rgba[di + 2] = buf.data[si + 2]; rgba[di + 3] = 255;
      }
    }
  };
  order.forEach((suit, r) => {
    list.forEach((rank, c) => put(renderCard(suit, rank as never, id), GAP + c * (CARD_PX_W + GAP), GAP + r * (CARD_PX_H + GAP)));
    if (withBack) put(renderCardBack(0x5b3fa8), GAP + list.length * (CARD_PX_W + GAP), GAP + r * (CARD_PX_H + GAP));
  });
  writeFileSync(join(out, `${name}-${id}.png`), encodePng(W, H, rgba));
}

for (const id of CARD_PALETTE_IDS) {
  sheet(id, ranks, true, 'cards');
  sheet(id, faceRanks, false, 'faces');
}
