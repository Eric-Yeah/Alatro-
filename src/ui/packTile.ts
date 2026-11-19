import { PACK_DIMS, PACK_PALETTES, type PackDims, type PackPalette } from '../data/packArt';
import type { PackKind, PackSize } from '../data/packs';
import { INK, Pix, ramp, rng, type Color } from './jokerPix';
import { PACK_MOTIFS, stampGlyph } from './packArtSprites';

// Setzt aus Motiv, Hülle, Siegel und Namensband das ganze Pack zusammen (Siegelhülle mit gezackten Quetschkanten).
// Rein und ohne DOM. Normal, Jumbo und Mega unterscheiden sich in Maßen, Zierrat und Siegel.

/** Dreieckswelle für die Zacken der Quetschkanten: 0 bis depth. */
function tooth(x: number, period: number, depth: number): number {
  const m = ((x % period) + period) % period;
  const k = m < period / 2 ? m : period - m;
  return Math.round((k * depth) / (period / 2));
}

/** Liegt der Bildpunkt innerhalb der Hülle? Quetschkanten sind schmaler, der Bauch ist gewölbt. */
function inside(x: number, y: number, d: PackDims): boolean {
  const top = 1 + tooth(x + 1, d.toothPeriod, d.toothDepth);
  const bot = d.h - 2 - tooth(x + 1 + d.toothPeriod / 2, d.toothPeriod, d.toothDepth);
  if (y < top || y > bot) return false;
  let inset = 1;
  if (y < d.crimpTop || y >= d.h - d.crimpBot) inset = 3;
  else if (y < d.crimpTop + 2 || y >= d.h - d.crimpBot - 2) inset = 2;
  return x >= inset && x <= d.w - 1 - inset;
}

function mix(a: Color, b: Color, t: number): Color {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Wachssiegel mit Abdruck und kleinen Tropfen. */
function waxSeal(p: Pix, kind: PackKind, cx: number, cy: number, r: number, base: Color, double: boolean) {
  const rp = ramp(base);
  p.fig((q) => {
    q.ball(cx, cy, r, rp, 0.1);
    // unregelmäßiger Rand durch kleine Tropfen
    q.disc(cx - r + 1, cy + r - 2, 2, rp[2]);
    q.disc(cx + r - 1, cy - r + 2, 2, rp[2]);
    q.disc(cx + 1, cy + r, 1.6, rp[2]);
    q.disc(cx - 1, cy - r, 1.4, rp[2]);
  });
  p.ring(cx, cy, Math.max(2, r - 2), rp[1]);
  if (double) p.ring(cx, cy, r - 1, rp[3]);
  p.disc(cx, cy, Math.max(1, r - 3), rp[2]);
  stampGlyph(p, kind, cx, cy, rp[4]);
  stampGlyph(p, kind, cx, cy + 1, rp[0]);
  stampGlyph(p, kind, cx, cy, rp[4]);
  p.set(cx - r + 2, cy - r + 2, 0xffffff);
  p.set(cx - r + 3, cy - r + 1, rp[4]);
}

/** Ganzes Pack. */
export function packTilePix(kind: PackKind, size: PackSize): Pix {
  const d = PACK_DIMS[size];
  const pal: PackPalette = PACK_PALETTES[kind];
  const t = new Pix(d.w, d.h);
  const layer = new Pix(d.w, d.h);

  // Hülle: Quetschkanten mit Rillen, Bauch mit Lichtkante links und Schatten rechts, Glanzstreifen
  for (let y = 0; y < d.h; y++) {
    for (let x = 0; x < d.w; x++) {
      if (!inside(x, y, d)) continue;
      const crimp = y < d.crimpTop || y >= d.h - d.crimpBot;
      let c: Color;
      if (crimp) {
        c = x % 2 === 0 ? pal.base : pal.dark;
        if (x % 4 === 0) c = pal.light;
        if (y === d.crimpTop - 1 || y === d.h - d.crimpBot) c = pal.deep;
      } else {
        c = pal.base;
        const dx = x - (y < d.crimpTop + 2 || y >= d.h - d.crimpBot - 2 ? 2 : 1);
        if (dx <= 1) c = pal.light;
        else if (x >= d.w - 3) c = pal.deep;
        else if (x >= d.w - 5) c = pal.dark;
        // diagonale Glanzstreifen, breiter Streifen und ein dünner daneben
        const s = ((x * 1 + y * 0.7) % 16 + 16) % 16;
        if (c === pal.base && s < 2.2) c = pal.light;
        else if (c === pal.base && s >= 3 && s < 3.8) c = mix(pal.base, pal.light, 0.5);
      }
      layer.set(x, y, c);
    }
  }
  // Kante der Zacken oben und unten hell (Folienkante)
  for (let x = 0; x < d.w; x++) {
    for (let y = 0; y < d.h; y++) {
      if (layer.get(x, y) !== -1 && layer.get(x, y - 1) === -1 && y < d.crimpTop) layer.set(x, y, pal.trimLight);
    }
  }
  layer.outline(INK);
  t.blit(layer);

  // Zierschienen an den Seiten (bei Jumbo und Mega durchgehend, mit Nieten)
  const railTop = d.crimpTop + 3, railBot = d.h - d.crimpBot - 4;
  for (const x of [3, d.w - 4]) {
    for (let y = railTop; y <= railBot; y++) {
      if (size === 'normal' && y % 2) continue;
      t.set(x, y, y % 5 === 0 ? pal.trimLight : pal.trim);
    }
  }
  if (size !== 'normal') {
    for (let y = railTop + 3; y < railBot - 2; y += 9) for (const x of [3, d.w - 4]) { t.set(x, y, 0xffffff); t.set(x + (x < 10 ? 1 : -1), y, pal.trimDark); }
  }

  // Fenster mit Zierrand
  const ww = d.iw + 4, wh = d.ih + 4, wx = Math.floor((d.w - ww) / 2), wy = d.winY;
  t.rect(wx - 1, wy - 1, ww + 2, wh + 2, INK);
  t.rect(wx, wy, ww, wh, pal.trim);
  t.rect(wx, wy + wh - 1, ww, 1, pal.trimDark);
  t.rect(wx + ww - 1, wy, 1, wh, pal.trimDark);
  t.rect(wx, wy, ww, 1, pal.trimLight);
  t.rect(wx + 1, wy + 1, ww - 2, wh - 2, INK);
  const win = new Pix(d.iw, d.ih).fill(INK);
  PACK_MOTIFS[kind](win);
  // Zusätze je Größe: Jumbo streut Sterne und Funken ins Fenster, Mega strahlt zusätzlich vom Siegel aus
  const r = rng(kind.length * 31 + size.length);
  if (size !== 'normal') {
    for (let i = 0; i < (size === 'mega' ? 7 : 4); i++) {
      const x = Math.floor(r() * (win.w - 2)) + 1, y = Math.floor(r() * (win.h - 2)) + 1;
      if (x > win.w / 2 - 12 && x < win.w / 2 + 12 && y > win.h / 2 - 10 && y < win.h / 2 + 10) continue;
      win.sparkle(x, y, pal.trimLight);
    }
  }
  if (size === 'mega') {
    for (let i = 0; i < win.w; i += 5) { win.set(i, 0, pal.trimLight); win.set(i + 2, win.h - 1, pal.trimLight); }
  }
  t.blit(win, wx + 2, wy + 2);
  // Glasglanz im Fenster: zwei schräge Streifen oben links
  for (let k = 0; k < 6; k++) {
    t.set(wx + 3 + k, wy + 8 - k, 0xffffff);
    if (k > 0 && k < 5) t.set(wx + 5 + k, wy + 8 - k, 0xcfe8ff);
  }
  t.set(wx + 2, wy + 9, 0xffffff);

  // Gezackte Krone bei Mega, Sternreihe bei Jumbo auf der oberen Quetschkante
  if (size === 'mega') {
    const cx = d.w / 2;
    t.poly([cx - 8, 6, cx - 8, 1, cx - 4, 4, cx, 0, cx + 4, 4, cx + 8, 1, cx + 8, 6], pal.trim);
    t.rect(cx - 8, 5, 16, 2, pal.trimDark);
    t.rect(cx - 8, 6, 16, 1, INK);
    t.set(cx, 1, 0xffffff); t.set(cx - 8, 2, pal.trimLight); t.set(cx + 8, 2, pal.trimLight);
    t.set(cx - 4, 5, pal.seal); t.set(cx + 4, 5, pal.seal); t.set(cx, 5, 0xffffff);
  } else if (size === 'jumbo') {
    const cx = d.w / 2;
    for (const x of [cx - 8, cx, cx + 8]) { t.set(x, 4, pal.trimLight); t.set(x - 1, 4, pal.trim); t.set(x + 1, 4, pal.trim); t.set(x, 3, pal.trim); t.set(x, 5, pal.trim); }
  }

  // Siegel
  waxSeal(t, kind, d.w / 2, d.sealY, d.sealR, pal.seal, size === 'mega');
  if (size === 'mega') { t.sparkle(d.w / 2 - d.sealR - 3, d.sealY - 2, 0xffffff); t.sparkle(d.w / 2 + d.sealR + 3, d.sealY + 1, 0xffffff); }

  // Namensband (der Text steht darüber)
  const bx = 5, bw = d.w - 10;
  t.rect(bx, d.bandY, bw, d.bandH, INK);
  t.rect(bx + 1, d.bandY + 1, bw - 2, d.bandH - 2, pal.trim);
  t.rect(bx + 1, d.bandY + d.bandH - 2, bw - 2, 1, pal.trimDark);
  t.rect(bx + 2, d.bandY + 2, bw - 4, d.bandH - 4, pal.deep);
  t.rect(bx + 2, d.bandY + 2, bw - 4, 1, pal.dark);
  return t;
}
