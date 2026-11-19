// Erzeugt Vorschaublätter der Consumable Karten und Booster Packs als PNG (ohne Beschriftung) plus JSON mit Namen.
// Aufruf: npx vite-node tools/artsheet.ts --kind consumables|packs [--out preview] [--scale 4] [--cols 10] [--ids a,b]
// Schreibt preview/<kind>.png und preview/<kind>.json. Das beschriftete Blatt erzeugt tools/artsheet-named.cjs.
import { mkdirSync, writeFileSync } from 'node:fs';
import { CONSUMABLES } from '../src/data/consumables';
import { CT_H, CT_W } from '../src/data/consumableArt';
import { PACKS } from '../src/data/packs';
import { consumableTilePix } from '../src/ui/consumableTile';
import { packTilePix } from '../src/ui/packTile';
import { Pix } from '../src/ui/jokerPix';
import { encodePng } from './pngWrite';

function arg(name: string, def: string): string {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const kind = arg('kind', 'consumables');
const out = arg('out', 'preview');
const scale = Number(arg('scale', '4'));
const cols = Number(arg('cols', kind === 'packs' ? '5' : '10'));
const only = arg('ids', '');
mkdirSync(out, { recursive: true });

interface Item { id: string; name: string; group: string; pix: Pix }
let items: Item[];
if (kind === 'packs') {
  items = PACKS.map((d) => ({ id: d.id, name: d.name, group: d.kind, pix: packTilePix(d.kind, d.size) }));
} else {
  items = CONSUMABLES.map((d) => ({ id: d.id, name: d.name, group: d.type, pix: consumableTilePix(d.id) }));
}
if (only) items = items.filter((d) => only.split(',').includes(d.id));

const gap = 4;
const cw = Math.max(...items.map((i) => i.pix.w)), ch = Math.max(...items.map((i) => i.pix.h));
const rows = Math.ceil(items.length / cols);
const W = cols * (cw + gap) + gap, H = rows * (ch + gap) + gap;
const bg = 0x14121f;
const sheet = new Pix(W, H).fill(bg);
const names: { id: string; name: string; group: string; x: number; y: number; w: number; h: number }[] = [];
items.forEach((it, i) => {
  const x = gap + (i % cols) * (cw + gap), y = gap + Math.floor(i / cols) * (ch + gap);
  const ox = Math.floor((cw - it.pix.w) / 2), oy = ch - it.pix.h;
  sheet.blit(it.pix, x + ox, y + oy);
  names.push({ id: it.id, name: it.name, group: it.group, x: x + ox, y: y + oy, w: it.pix.w, h: it.pix.h });
});
const rgba = sheet.toRGBA();
const big = new Uint8Array(W * scale * H * scale * 4);
for (let y = 0; y < H * scale; y++)
  for (let x = 0; x < W * scale; x++) {
    const s = (Math.floor(y / scale) * W + Math.floor(x / scale)) * 4, o = (y * W * scale + x) * 4;
    big[o] = rgba[s]; big[o + 1] = rgba[s + 1]; big[o + 2] = rgba[s + 2]; big[o + 3] = 255;
    if (!rgba[s + 3]) { big[o] = (bg >> 16) & 255; big[o + 1] = (bg >> 8) & 255; big[o + 2] = bg & 255; }
  }
writeFileSync(`${out}/${kind}.png`, encodePng(W * scale, H * scale, big));
writeFileSync(`${out}/${kind}.json`, JSON.stringify({ scale, cw, ch, gap, cols, names }, null, 1));
console.log(`${out}/${kind}.png`, W * scale, H * scale, items.length, CT_W, CT_H);
