// Rendert einzelne Karten vergrößert als PNG (zum Prüfen der Figuren).
// Aufruf: npx vite-node tools/cardZoom.ts <ausgabe.png> <standard|kontrast> <skalierung> S11 H12 D13 C14 ...
import { writeFileSync } from 'node:fs';
import { CARD_PX_H, CARD_PX_W } from '../src/data/cardArt/cardGlyphs';
import { renderCard } from '../src/ui/cardArt/cardRender';
import { encodePng } from './pngWrite';

const [out, pal, scaleS, ...specs] = process.argv.slice(2);
const scale = Number(scaleS);
const cards = specs.map((s) => ({ suit: s[0] as 'S' | 'H' | 'D' | 'C', rank: Number(s.slice(1)) }));
const cellW = CARD_PX_W + 3, cellH = CARD_PX_H + 3;
const W = (cards.length * cellW + 3) * scale, H = cellH * scale;
const rgba = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) { rgba[i * 4] = 0x1d; rgba[i * 4 + 1] = 0x2a; rgba[i * 4 + 2] = 0x3a; rgba[i * 4 + 3] = 255; }
cards.forEach((c, k) => {
  const b = renderCard(c.suit, c.rank as never, pal as never);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const si = (y * b.w + x) * 4;
    if (!b.data[si + 3]) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const di = (((1 + y) * scale + dy) * W + (3 + k * cellW + x) * scale + dx) * 4;
      rgba[di] = b.data[si]; rgba[di + 1] = b.data[si + 1]; rgba[di + 2] = b.data[si + 2]; rgba[di + 3] = 255;
    }
  }
});
writeFileSync(out, encodePng(W, H, rgba));
