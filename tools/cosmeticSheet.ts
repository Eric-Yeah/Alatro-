// Erzeugt Blätter der Kosmetik als PNG (ohne Beschriftung) für die Vorschau: Kartenrücken und Paletten Proben.
// Aufruf: npx vite-node tools/cosmeticSheet.ts <ausgabeordner> [skalierung]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_PX_H, CARD_PX_W } from '../src/data/cardArt/cardGlyphs';
import { CARD_PALETTE_IDS } from '../src/data/cardArt/cardPalettes';
import { BACK_IDS, renderBackById } from '../src/ui/cardArt/cardBackArt';
import { renderCard } from '../src/ui/cardArt/cardRender';
import type { PixelBuffer } from '../src/ui/cardArt/pixelBuffer';
import { encodePng } from './pngWrite';

const out = process.argv[2] ?? 'preview';
const scale = Number(process.argv[3] ?? 3);
mkdirSync(out, { recursive: true });
const GAP = 4;
const BG = [0x1d, 0x2a, 0x3a];

function sheet(cards: PixelBuffer[], cols: number, name: string) {
  const rows = Math.ceil(cards.length / cols);
  const W = (cols * (CARD_PX_W + GAP) + GAP) * scale;
  const H = (rows * (CARD_PX_H + GAP) + GAP) * scale;
  const rgba = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { rgba[i * 4] = BG[0]; rgba[i * 4 + 1] = BG[1]; rgba[i * 4 + 2] = BG[2]; rgba[i * 4 + 3] = 255; }
  cards.forEach((buf, k) => {
    const gx = GAP + (k % cols) * (CARD_PX_W + GAP), gy = GAP + Math.floor(k / cols) * (CARD_PX_H + GAP);
    for (let y = 0; y < buf.h; y++) for (let x = 0; x < buf.w; x++) {
      const si = (y * buf.w + x) * 4;
      if (!buf.data[si + 3]) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const di = (((gy + y) * scale + dy) * W + (gx + x) * scale + dx) * 4;
        rgba[di] = buf.data[si]; rgba[di + 1] = buf.data[si + 1]; rgba[di + 2] = buf.data[si + 2]; rgba[di + 3] = 255;
      }
    }
  });
  writeFileSync(join(out, `${name}.png`), encodePng(W, H, rgba));
}

// Einzelbilder je Rücken (für die beschriftete Vorschau)
for (const id of BACK_IDS) sheet([renderBackById(id)!], 1, `back-${id}`);
// Rücken: 17 in einer Reihe aus 6 Spalten (10 Muster, dann 7 Wappen)
sheet(BACK_IDS.map((id) => renderBackById(id)!), 6, 'backs');
// Paletten: je Palette Pik, Herz, Kreuz, Karo mit Ass, Dame und 7 (Spalten Karten, Zeilen Farben)
for (const pid of CARD_PALETTE_IDS) {
  const cards: PixelBuffer[] = [];
  for (const suit of ['S', 'H', 'C', 'D'] as const) for (const rank of [14, 12, 7] as const) cards.push(renderCard(suit, rank, pid));
  sheet(cards, 3, `pal-${pid}`);
}
