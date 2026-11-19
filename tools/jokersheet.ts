// Erzeugt Vorschaubilder der Joker Kacheln als PNG (ohne Abhängigkeiten, nur zlib).
// Aufruf: npx vite-node tools/jokersheet.ts [--out preview] [--scale 3] [--ids funke,treppe] [--cols 10] [--per 40]
// Schreibt preview/jokers-1.png usw. (Seiten) und preview/jokers.json (Namen für das beschriftete Blatt).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { JOKER_DEFS } from '../src/data/jokers';
import { TILE_H, TILE_W } from '../src/data/jokerArt';
import { jokerTilePix } from '../src/ui/jokerTile';
import { Pix } from '../src/ui/jokerPix';

function crc32(buf: Uint8Array): number {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function encodePng(w: number, h: number, rgba: Uint8ClampedArray): Buffer {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function arg(name: string, def: string): string {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const out = arg('out', 'preview');
const scale = Number(arg('scale', '3'));
const cols = Number(arg('cols', '10'));
const per = Number(arg('per', '40'));
const only = arg('ids', '');
mkdirSync(out, { recursive: true });

const defs = Object.values(JOKER_DEFS).filter((d) => !only || only.split(',').includes(d.id));
const gap = 3;
const bg = [0x14, 0x12, 0x1f];
const pages: typeof defs[] = [];
for (let i = 0; i < defs.length; i += per) pages.push(defs.slice(i, i + per));
const names: { page: number; id: string; name: string; rarity: string; x: number; y: number }[] = [];

pages.forEach((page, pi) => {
  const rows = Math.ceil(page.length / cols);
  const W = cols * (TILE_W + gap) + gap, H = rows * (TILE_H + gap) + gap;
  const sheet = new Pix(W, H).fill((bg[0] << 16) | (bg[1] << 8) | bg[2]);
  page.forEach((d, i) => {
    const x = gap + (i % cols) * (TILE_W + gap), y = gap + Math.floor(i / cols) * (TILE_H + gap);
    sheet.blit(jokerTilePix(d.id, d.rarity), x, y);
    names.push({ page: pi + 1, id: d.id, name: d.name, rarity: d.rarity, x, y });
  });
  const rgba = sheet.toRGBA();
  const big = new Uint8ClampedArray(W * scale * H * scale * 4);
  for (let y = 0; y < H * scale; y++)
    for (let x = 0; x < W * scale; x++) {
      const s = (Math.floor(y / scale) * W + Math.floor(x / scale)) * 4, o = (y * W * scale + x) * 4;
      big[o] = rgba[s]; big[o + 1] = rgba[s + 1]; big[o + 2] = rgba[s + 2]; big[o + 3] = rgba[s + 3] || 255;
      if (!rgba[s + 3]) { big[o] = bg[0]; big[o + 1] = bg[1]; big[o + 2] = bg[2]; }
    }
  const file = pages.length === 1 && only ? `${out}/jokers-test.png` : `${out}/jokers-${pi + 1}.png`;
  writeFileSync(file, encodePng(W * scale, H * scale, big));
  console.log(file, W * scale, H * scale);
});
writeFileSync(`${out}/jokers.json`, JSON.stringify({ scale, tileW: TILE_W, tileH: TILE_H, gap, cols, names }, null, 1));
