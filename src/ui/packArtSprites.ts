import { PACK_PALETTES } from '../data/packArt';
import type { PackKind } from '../data/packs';
import { INK, NONE, Pix, ramp, rng, type Color } from './jokerPix';
import { PAL as P, glow, starPts } from './jokerKit';
import { bubbles, clubShape, cloud, diamondShape, heartShape, lit, spadeShape, star4 } from './consumableKit';

// Motive der Packs: je Art eine eigene Zeichnung im Fenster der Hülle. Die Fläche p ist je nach Größe des Packs
// 28 mal 24 bis 40 mal 32 Bildpunkte groß, das Motiv sitzt in der Mitte und hat feste Größe, der Hintergrund füllt alles.

type Motif = (p: Pix) => void;

function drawJoker(p: Pix) {
  const pal = PACK_PALETTES.joker;
  const cx = p.w / 2, cy = p.h / 2;
  p.vgrad(0, 0, p.w, p.h, pal.sky);
  p.rays(cx, cy + 2, 8, 0x5a1030, 0x6a1a3a, 0.2);
  glow(p, cx, cy, 13, 0xffb43a, 0.7);
  // Narrenkappe mit drei Zipfeln und Schellen
  p.fig((q) => {
    q.poly([cx - 9, cy + 3, cx - 12, cy - 2, cx - 11, cy - 7, cx - 7, cy - 3, cx - 3, cy - 1, cx - 2, cy + 3], P.purple[2]);
    q.poly([cx + 9, cy + 3, cx + 12, cy - 2, cx + 11, cy - 7, cx + 7, cy - 3, cx + 3, cy - 1, cx + 2, cy + 3], P.teal[2]);
    q.poly([cx - 4, cy + 3, cx - 3, cy - 4, cx - 1, cy - 9, cx + 1, cy - 9, cx + 3, cy - 4, cx + 4, cy + 3], P.red[2]);
    q.rect(cx - 9, cy + 3, 19, 3, P.gold[2]);
  });
  p.rect(cx - 3, cy - 4, 2, 6, P.red[3]); p.rect(cx - 8, cy - 2, 1, 4, P.purple[3]); p.rect(cx + 6, cy - 2, 1, 4, P.teal[3]);
  p.rect(cx - 9, cy + 3, 19, 1, P.gold[4]);
  for (let x = cx - 8; x < cx + 9; x += 4) p.set(x, cy + 5, P.gold[0]);
  for (const [x, y] of [[cx - 11, cy - 8], [cx, cy - 10], [cx + 11, cy - 8]]) { p.fig((q) => q.disc(x, y, 1.6, P.gold[3])); p.set(x - 1, y - 1, 0xffffff); }
  // Maske unter der Kappe
  p.fig((q) => q.ell(cx, cy + 9, 5, 4, 0xf4efe0));
  p.set(cx - 2, cy + 8, INK); p.set(cx + 2, cy + 8, INK); p.set(cx - 1, cy + 10, INK); p.set(cx, cy + 11, INK); p.set(cx + 1, cy + 10, INK);
  p.set(cx - 2, cy + 7, 0xff8a98);
}

function drawKarten(p: Pix) {
  const pal = PACK_PALETTES.karten;
  const cx = p.w / 2, cy = p.h / 2;
  p.vgrad(0, 0, p.w, p.h, pal.sky);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if ((Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0 && (x + y) % 2 === 0) p.set(x, y, pal.sky[1] + 0x0a0a0a);
  glow(p, cx, cy + 4, 12, 0xcfe0ff, 0.6);
  // Kartenfächer: vier Karten um einen Drehpunkt unten
  const px = cx, py = cy + 13;
  const marks: ((q: Pix, x: number, y: number) => void)[] = [
    (q, x, y) => lit(q, (t) => spadeShape(t, x, y, 2.4, 1), x, y, 3, ramp(0x2a3a78), null),
    (q, x, y) => lit(q, (t) => heartShape(t, x, y, 2.4, 1), x, y, 3, P.red, null),
    (q, x, y) => lit(q, (t) => clubShape(t, x, y, 2.4, 1), x, y, 3, P.forest, null),
    (q, x, y) => lit(q, (t) => diamondShape(t, x, y, 2.2, 1), x, y, 3, P.orange, null),
  ];
  [-40, -14, 14, 40].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const rot = (x: number, y: number): [number, number] => [px + x * Math.cos(a) - y * Math.sin(a), py + x * Math.sin(a) + y * Math.cos(a)];
    const corners = [rot(-5, -22), rot(5, -22), rot(5, 1), rot(-5, 1)].flat();
    const outer = [rot(-6, -23), rot(6, -23), rot(6, 2), rot(-6, 2)].flat();
    p.poly(outer, INK);
    p.poly(corners, i % 2 ? 0xf4efe0 : 0xfff8e8);
    const [mx, my] = rot(-0.5, -16.5);
    marks[i](p, Math.round(mx), Math.round(my));
    const [hx, hy] = rot(-4, -21);
    p.set(hx, hy, 0xffffff);
  });
  p.sparkle(cx - 12, cy - 8, 0xffffff); p.sparkle(cx + 12, cy - 6, 0xcfe0ff, true);
}

function drawSternbild(p: Pix) {
  const pal = PACK_PALETTES.sternbild;
  const cx = p.w / 2, cy = p.h / 2;
  p.vgrad(0, 0, p.w, p.h, pal.sky);
  cloud(p, cx, cy, p.w / 2, p.h / 2, 0x4660c8, 0.7, 5);
  p.stars(Math.round(p.w * p.h / 45), 0, 0, p.w, p.h, rng(33));
  // Sternbild Linien zu kleinen Sternen
  const pts: [number, number][] = [[cx - 11, cy + 6], [cx - 7, cy - 6], [cx + 9, cy - 8], [cx + 12, cy + 5]];
  for (let i = 0; i < 3; i++) p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 0x7aa0f0);
  p.line(cx, cy, pts[1][0], pts[1][1], 0x7aa0f0); p.line(cx, cy, pts[3][0], pts[3][1], 0x7aa0f0);
  for (const [x, y] of pts) p.sparkle(x, y, 0xfff0b8);
  // großer goldener Stern und Mondsichel
  glow(p, cx, cy, 10, 0xffd860, 0.9);
  p.fig((q) => q.poly(starPts(cx, cy, 9, 4, 5), P.gold[2]));
  p.poly([cx, cy - 8, cx + 1.6, cy - 2, cx, cy, cx - 1.6, cy - 2], P.gold[4]);
  p.poly([cx - 8, cy - 2, cx - 2, cy - 1.5, cx, cy, cx - 1, cy + 1.5], P.gold[3]);
  p.poly([cx + 5, cy + 8, cx, cy + 3.5, cx + 1.5, cy, cx + 8, cy - 2], P.gold[1]);
  p.set(cx, cy, 0xffffff);
  p.disc(cx - 11, cy - 7, 3.5, 0xe8e4c8); p.disc(cx - 9.5, cy - 8, 3, pal.sky[1]);
}

function drawElixier(p: Pix) {
  const pal = PACK_PALETTES.elixier;
  const cx = p.w / 2, cy = p.h / 2;
  p.vgrad(0, 0, p.w, p.h, pal.sky);
  cloud(p, cx, cy + 4, p.w / 2, p.h / 2, 0x50d890, 0.6, 9);
  bubbles(p, [[cx - 12, cy - 5, 2], [cx + 12, cy - 7, 2], [cx - 10, cy + 5, 1], [cx + 11, cy + 4, 1], [cx + 8, cy - 11, 1]], 0xd8fff0);
  // Rundkolben mit grünem Trank
  p.fig((q) => { q.ball(cx, cy + 3, 8, ramp(0xcfeef0), 0.05); q.rect(cx - 2, cy - 11, 5, 8, 0xcfeef0); });
  p.disc(cx, cy + 3, 6.5, 0x14382c); p.rect(cx - 1, cy - 10, 3, 7, 0x14382c);
  for (let y = cy + 1; y <= cy + 9; y++) for (let x = cx - 7; x <= cx + 7; x++) if (Math.hypot(x - cx, y - (cy + 3)) <= 6.5) p.set(x, y, y === cy + 1 ? 0xd8ffe0 : y > cy + 6 ? 0x2a9a50 : 0x50e07a);
  p.rect(cx - 5, cy + 2, 1, 5, 0xffffff);
  p.fig((q) => q.rect(cx - 2, cy - 14, 5, 4, P.tan[2]));
  p.set(cx - 1, cy - 13, P.tan[4]);
  bubbles(p, [[cx, cy + 4, 1], [cx + 2, cy + 6, 1], [cx - 2, cy + 7, 1]], 0xe8fff0);
  p.sparkle(cx - 13, cy + 8, 0xffffff); p.sparkle(cx + 13, cy + 8, 0xfff0a8);
}

function drawOmen(p: Pix) {
  const pal = PACK_PALETTES.omen;
  const cx = p.w / 2, cy = p.h / 2;
  p.vgrad(0, 0, p.w, p.h, pal.sky);
  cloud(p, cx, cy, p.w / 2, p.h / 2, 0x8a3ad0, 0.7, 13);
  p.stars(Math.round(p.w * p.h / 70), 0, 0, p.w, p.h, rng(55));
  glow(p, cx, cy, 13, 0xd04a7a, 0.7);
  // Mondsichel im Silber
  p.fig((q) => { q.disc(cx - 5, cy - 3, 11, 0xd8dcf0); });
  p.disc(cx - 1, cy - 5, 10, pal.sky[1]);
  p.set(cx - 14, cy - 5, 0xffffff); p.set(cx - 13, cy - 7, 0xffffff);
  // Auge in der Mitte
  p.fig((q) => q.poly([cx - 10, cy + 3, cx - 5, cy - 2, cx, cy - 3, cx + 5, cy - 2, cx + 10, cy + 3, cx + 5, cy + 8, cx, cy + 9, cx - 5, cy + 8], 0xf4efe0));
  p.disc(cx, cy + 3, 4, 0xd8382f); p.disc(cx, cy + 3, 2.5, 0x2a0a38); p.set(cx - 1, cy + 2, 0xffffff);
  for (let i = -2; i <= 2; i++) p.line(cx + i * 4, cy - 4 - Math.abs(i), cx + i * 5, cy - 8 - Math.abs(i) * 0.5, 0xe0c8ff);
  p.sparkle(cx + 12, cy - 9, 0xffffff); p.sparkle(cx - 12, cy + 9, 0xe0c8ff);
}

export const PACK_MOTIFS: Record<PackKind, Motif> = {
  joker: drawJoker,
  karten: drawKarten,
  sternbild: drawSternbild,
  elixier: drawElixier,
  omen: drawOmen,
};

/** Fünf mal fünf Zeichen im Wachssiegel, eins je Art. */
export const SEAL_GLYPHS: Record<PackKind, string[]> = {
  joker: ['00100', '00100', '11111', '01110', '10001'],
  karten: ['00100', '01110', '11111', '01110', '00100'],
  sternbild: ['00100', '00100', '11011', '00100', '00100'],
  elixier: ['01110', '00100', '01110', '11111', '01110'],
  omen: ['01110', '11000', '11000', '11000', '01110'],
};

export function stampGlyph(p: Pix, kind: PackKind, cx: number, cy: number, c: Color) {
  const g = SEAL_GLYPHS[kind];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (g[j][i] === '1') p.set(cx - 2 + i, cy - 2 + j, c);
}
void NONE; void star4;
