import { INK, Pix, rng, ramp, type Color, type Ramp } from './jokerPix';
import { PAL as P, arcPts, flame, glow, hills, moon, sky, starPts, wall, type Sprite } from './jokerKit';

// Motive Gruppe G: Hand Bedingungen, Karten Suits und Rang Jokers der zweiten Welle (Zeichenfläche 46 mal 52).

export type SuitKind = 'heart' | 'spade' | 'diamond' | 'club';

/** Form eines Kartenzeichens (Herz, Pik, Karo, Kreuz) mit Licht von links oben, Mitte (cx, cy), Größe s. */
export function suit(p: Pix, kind: SuitKind, cx: number, cy: number, s: number, rp: Ramp, outline: Color | null = INK) {
  const layer = new Pix(p.w, p.h);
  if (kind === 'heart') {
    layer.disc(cx - s * 0.5, cy - s * 0.35, s * 0.58, 1);
    layer.disc(cx + s * 0.5, cy - s * 0.35, s * 0.58, 1);
    layer.poly([cx - s * 1.05, cy - s * 0.15, cx, cy + s * 1.05, cx + s * 1.05, cy - s * 0.15], 1);
  } else if (kind === 'spade') {
    layer.disc(cx - s * 0.53, cy + s * 0.12, s * 0.5, 1);
    layer.disc(cx + s * 0.53, cy + s * 0.12, s * 0.5, 1);
    layer.poly([cx - s * 1.03, cy + s * 0.12, cx, cy - s * 1.15, cx + s * 1.03, cy + s * 0.12], 1);
    layer.poly([cx - s * 0.18, cy + s * 0.3, cx + s * 0.18, cy + s * 0.3, cx + s * 0.62, cy + s * 1.15, cx - s * 0.62, cy + s * 1.15], 1);
  } else if (kind === 'diamond') {
    layer.poly([cx, cy - s * 1.1, cx + s * 0.8, cy, cx, cy + s * 1.1, cx - s * 0.8, cy], 1);
  } else {
    layer.disc(cx, cy - s * 0.55, s * 0.5, 1);
    layer.disc(cx - s * 0.55, cy + s * 0.2, s * 0.5, 1);
    layer.disc(cx + s * 0.55, cy + s * 0.2, s * 0.5, 1);
    layer.poly([cx - s * 0.2, cy, cx + s * 0.2, cy, cx + s * 0.55, cy + s * 1.05, cx - s * 0.55, cy + s * 1.05], 1);
  }
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (layer.get(x, y) === -1) continue;
      const t = ((cx - x) * 0.55 + (cy - y) * 0.65) / (s * 1.1);
      layer.set(x, y, t > 0.78 ? rp[4] : t > 0.3 ? rp[3] : t < -0.55 ? rp[1] : rp[2]);
    }
  if (outline !== null) layer.outline(outline);
  p.blit(layer);
}

/** Goldmünze von vorn mit Rand. */
export function coinG(p: Pix, x: number, y: number, r: number) {
  if (r <= 3) {
    p.fig((q) => { q.disc(x, y, r, P.gold[3]); }, 0x4a2a08);
    p.set(x - 1, y - 1, P.gold[4]);
    p.set(x + 1, y + 1, P.gold[1]);
    return;
  }
  p.fig((q) => { q.ball(x, y, r, P.gold, 0.08); }, 0x4a2a08);
  p.ring(x, y, r - 1, P.gold[4], 1).set(x, y, P.gold[3]);
}

/** Glocke mit Licht von links, Krone oben bei (cx, top), Höhe h, halbe Breite w. */
function bell(p: Pix, cx: number, top: number, h: number, w: number, rp: Ramp) {
  p.fig((q) => {
    for (let j = 0; j < h; j++) {
      const t = j / (h - 1);
      const half = Math.max(1, Math.round(w * (0.28 + 0.72 * Math.pow(t, 1.7)) + (j >= h - 2 ? 1 : 0)));
      for (let i = -half; i <= half; i++) {
        const u = i / half;
        q.set(cx + i, top + j, j >= h - 2 ? rp[1] : u < -0.55 ? rp[4] : u < -0.1 ? rp[3] : u < 0.5 ? rp[2] : u < 0.8 ? rp[1] : rp[0]);
      }
    }
    q.rect(cx - 1, top - 2, 3, 2, rp[3]);
    q.rect(cx - 1, top + h, 3, 2, P.iron[2]);
  });
}

/** Schraubenbohrer von oben nach unten, Mitte x, Breite w, Schaft ab y0 mit Länge len. */
function drillBit(p: Pix, x: number, y0: number, len: number, w: number) {
  p.fig((q) => {
    q.rect(x - 1, y0 - 6, 3, 6, P.iron[2]);
    q.rect(x - 3, y0 - 8, 7, 3, P.iron[3]);
    for (let j = 0; j < len; j++) {
      const tw = Math.max(0.5, w / 2 - Math.max(0, j - (len - 7)) * (w / 2 / 7));
      for (let i = -Math.ceil(tw); i <= Math.ceil(tw); i++) {
        if (Math.abs(i) > tw) continue;
        const band = (j + i * 2 + 40) % 6;
        q.set(x + i, y0 + j, band < 2 ? P.steel[4] : band < 4 ? P.steel[2] : P.steel[0]);
      }
    }
  });
}

export const SPRITES_G: Record<string, Sprite> = {
  // Wetterhahn: Messing Wetterhahn auf der Turmspitze vor Gewitterwolken
  wetterhahn(p) {
    p.vgrad(0, 0, 46, 52, [0x0c1030, 0x1c2352, 0x3a3a78, 0x5a4a88]);
    // Wolken
    const cloud = (x: number, y: number, rx: number, ry: number) => {
      p.ell(x, y, rx, ry, 0x2a2a52);
      p.ell(x - 1, y - 1, rx - 2, ry - 1, 0x3a3a68);
      p.ell(x - 2, y - 2, rx - 5, Math.max(1, ry - 3), 0x4e4e82);
    };
    cloud(8, 8, 12, 5); cloud(36, 5, 14, 5); cloud(41, 22, 9, 5); cloud(4, 26, 8, 4);
    // Blitz mit Leuchten
    glow(p, 36, 14, 10, 0x8a8ae0, 0.9);
    p.path([37, 9, 33, 15, 37, 16, 31, 25], 0xfff0a0, 2);
    p.path([37, 9, 33, 15, 37, 16, 31, 25], 0xffffff, 1);
    // Turmdach und Turm
    p.fig((q) => {
      q.rect(12, 46, 22, 6, P.stone[1]);
      q.poly([23, 31, 13, 47, 33, 47], P.slate[2]);
      q.poly([23, 31, 13, 47, 21, 47], P.slate[3]);
      q.poly([23, 31, 13, 47, 15, 47], P.slate[4]);
      q.rect(12, 46, 22, 2, P.stone[3]);
    });
    for (let j = 36; j < 47; j += 3) p.line(23 - (j - 31) * 0.55 + 2, j, 23 + (j - 31) * 0.55 - 1, j, P.slate[1]);
    p.rect(20, 49, 4, 3, 0xffc43a); p.set(20, 49, 0xfff0b0);
    // Stab und Windrose
    p.rect(23, 20, 1, 12, P.gold[1]);
    p.fig((q) => { q.rect(14, 29, 19, 1, P.gold[2]); q.rect(23, 26, 1, 8, P.gold[2]); }, INK);
    p.set(13, 29, P.gold[4]); p.set(33, 29, P.gold[3]);
    p.poly([23, 24, 21, 27, 25, 27], P.gold[4]);
    // Hahn
    p.fig((q) => {
      // Schwanz
      q.poly([16, 18, 10, 14, 7, 6, 11, 8, 12, 4, 16, 8, 17, 12, 19, 16], P.gold[2]);
      q.poly([16, 18, 10, 14, 7, 6, 11, 8, 14, 13], P.gold[3]);
      q.shadedEll(22, 19, 7, 5, P.gold, 0.08);
      q.shadedEll(27, 15, 3, 4, P.gold, 0.06);
      q.disc(28, 12, 3, P.gold[3]);
      q.poly([31, 11, 36, 13, 31, 15], P.orange[3]);
      q.rect(27, 8, 2, 2, P.red[2]); q.rect(29, 9, 2, 2, P.red[2]); q.rect(25, 9, 2, 2, P.red[3]);
      q.rect(31, 15, 2, 2, P.red[2]);
      q.rect(20, 24, 1, 4, P.gold[1]); q.rect(25, 24, 1, 4, P.gold[1]);
    });
    p.set(29, 11, INK);
    p.line(24, 18, 17, 20, P.gold[1]); p.line(20, 20, 24, 22, P.gold[1]);
    p.rect(19, 16, 4, 1, P.gold[4]);
    p.sparkle(41, 40, 0xcfd8ff); p.set(5, 38, 0xcfd8ff);
  },

  // Drillbohrer: drei Bohrköpfe an einer gemeinsamen Kurbel, Späne fliegen
  drillbohrer(p) {
    wall(p, 0, 40, ramp(0x4a3a4a), 12, 6);
    glow(p, 23, 14, 18, 0xc07a30, 0.6);
    p.rect(0, 40, 46, 12, P.wood[1]); p.rect(0, 40, 46, 2, P.wood[3]);
    for (let x = 0; x < 46; x += 11) p.rect(x, 43, 1, 9, P.wood[0]);
    // Löcher im Brett
    for (const x of [9, 23, 37]) { p.ell(x, 44, 3, 1, INK); p.set(x - 2, 43, P.wood[4]); }
    // Querbalken und Kurbel
    p.fig((q) => {
      q.rect(2, 9, 42, 5, P.iron[2]);
      q.rect(2, 9, 42, 1, P.steel[4]);
      q.rect(2, 13, 42, 1, P.iron[0]);
      for (const x of [9, 23, 37]) { q.rect(x - 3, 8, 7, 7, P.iron[3]); q.rect(x - 3, 8, 7, 1, P.steel[4]); }
      q.rect(22, 3, 3, 6, P.iron[2]);
    });
    for (const x of [9, 23, 37]) drillBit(p, x, 16, 24, 6);
    // Kurbelrad mit Griff
    p.fig((q) => {
      q.ball(23, 5, 6, P.iron, 0.08);
      q.line(23, 5, 38, 2, P.iron[2], 2);
      q.rect(37, 0, 4, 7, P.wood[3]); q.rect(37, 0, 1, 7, P.wood[4]);
    });
    p.ring(23, 5, 4, P.steel[3], 1); p.disc(23, 5, 1, P.steel[4]);
    // Späne
    const r = rng(77);
    for (let i = 0; i < 9; i++) {
      const bx = [9, 23, 37][i % 3] + Math.round((r() - 0.5) * 12), by = 38 + Math.floor(r() * 4);
      p.path(arcPts(bx, by, 2, 2, 20, 250, 5), i % 2 ? P.tan[4] : P.wood[4], 1);
    }
    p.sparkle(5, 24, 0xffd890); p.sparkle(41, 26, 0xffd890);
  },

  // Viererbund: vier Siegelringe im Quadrat um eine Flamme
  viererbund(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0a2a, 0x3a1030, 0x6a1a3a, 0xa02a38]);
    p.rays(23, 24, 8, 0x4a1438, 0x541a40, 0.3);
    p.vgrad(0, 38, 46, 14, [0x3a1030, 0x14081c]);
    glow(p, 23, 24, 16, 0xff8a2a, 0.9);
    const ring = (cx: number, cy: number, gem: Ramp) => {
      p.fig((q) => {
        q.ellRing(cx, cy + 1, 7, 6, P.gold[2], 3);
        q.rect(cx - 4, cy - 6, 9, 4, P.gold[3]);
      });
      p.ellRing(cx, cy + 1, 7, 6, P.gold[3], 1);
      p.set(cx - 6, cy + 1, P.gold[4]); p.set(cx - 5, cy - 2, P.gold[4]); p.set(cx + 6, cy + 3, P.gold[0]);
      p.poly([cx, cy - 8, cx + 4, cy - 5, cx, cy - 1, cx - 4, cy - 5], gem[2]);
      p.poly([cx, cy - 8, cx - 4, cy - 5, cx, cy - 4], gem[4]);
      p.poly([cx, cy - 4, cx + 4, cy - 5, cx, cy - 1], gem[1]);
    };
    ring(10, 11, P.cyan); ring(36, 11, P.green); ring(10, 36, P.purple); ring(36, 36, P.red);
    // Funkenband zwischen Ringen und Mitte
    for (const [x, y] of [[16, 15], [20, 19], [30, 19], [26, 16], [16, 33], [20, 29], [30, 29], [26, 32]] as [number, number][]) p.set(x, y, 0xffc43a);
    flame(p, 23, 14, 18, true);
    p.sparkle(23, 6, 0xffe27a); p.sparkle(23, 44, 0xffe27a);
  },

  // Kleiner Kessel: Kupferkessel über Feuer, einfarbig grüner Sud, Dampf
  kleiner_kessel(p) {
    p.vgrad(0, 0, 46, 52, [0x0c1a1c, 0x1a2a30, 0x2a3a3a, 0x4a3030]);
    // Dampf
    for (let i = 0; i < 3; i++) {
      const pts = arcPts(14 + i * 10, 8, 3, 8, 90, 450, 14);
      const sx = 10 + i * 10;
      for (let k = 0; k + 1 < pts.length; k += 2) {
        if ((k / 2) % 2 === 0) p.set(sx + (pts[k] - (14 + i * 10)), pts[k + 1] + 2, i === 1 ? 0xb8f0c8 : 0x88d0a0);
      }
    }
    glow(p, 23, 10, 10, 0x6ad08a, 0.5);
    // Feuer
    p.rect(0, 46, 46, 6, 0x1a1218);
    p.fig((q) => {
      q.rect(6, 47, 34, 4, P.darkwood[2]);
      q.rect(6, 47, 34, 1, P.darkwood[4]);
      q.ell(8, 49, 3, 2, P.darkwood[3]); q.ell(38, 49, 3, 2, P.darkwood[3]);
    });
    glow(p, 23, 42, 14, 0xff8a2a, 0.9);
    flame(p, 12, 36, 13, false, -0.5);
    flame(p, 34, 36, 13, false, 0.5);
    flame(p, 23, 38, 11, true);
    // Dreibein
    p.line(9, 28, 6, 47, INK, 2); p.line(37, 28, 40, 47, INK, 2);
    // Kessel
    p.fig((q) => {
      q.shadedEll(23, 28, 15, 12, P.copper, 0.1);
      q.rect(9, 17, 28, 4, P.copper[3]);
      q.ellRing(23, 18, 15, 4, P.copper[4], 2);
    });
    p.ell(23, 18, 13, 3, 0x1a6a40);
    p.ell(23, 18, 11, 2, 0x3ac070);
    p.ell(21, 17, 6, 1, 0x8af0a8);
    // Blasen
    for (const [x, y, r] of [[18, 17, 2], [27, 16, 2], [23, 13, 3], [30, 12, 1], [16, 11, 1]] as [number, number, number][]) {
      p.fig((q) => { q.disc(x, y, r, 0x8af0a8); }, 0x1a6a40);
      p.set(x - 1, y - 1, 0xffffff);
    }
    // Henkel
    p.path(arcPts(23, 18, 17, 17, 200, 340, 10), INK, 1);
    p.set(9, 29, P.copper[4]); p.set(10, 25, P.copper[4]); p.set(11, 22, P.copper[4]);
    p.rect(16, 36, 2, 1, P.copper[4]);
    p.sparkle(6, 14, 0xb8f0c8); p.sparkle(40, 8, 0xb8f0c8);
  },

  // Meilenstein: Meilenstein am Weg mit Kerben, Pfad zum Horizont, Sterne
  meilenstein(p) {
    sky(p, [0x120e3a, 0x3a2a78, 0xb04a68, 0xf09a50], 18, 41, 28);
    p.stars(10, 0, 0, 46, 12, rng(3));
    glow(p, 30, 27, 10, 0xffd080, 0.8);
    hills(p, 25, 2, 22, 0.5, 0x3a2a58, 0x6a3a68);
    hills(p, 28, 2, 16, 2, 0x2a2048);
    p.rect(0, 29, 46, 23, 0x2a3a3a);
    p.speckle(0, 29, 46, 23, 0x3a5a44, 0.2, rng(9));
    // Weg in Perspektive
    p.poly([21, 28, 26, 28, 44, 52, 4, 52], P.sand[1]);
    p.poly([22, 28, 25, 28, 34, 52, 14, 52], P.sand[2]);
    p.poly([22, 28, 24, 28, 22, 52, 16, 52], P.sand[3]);
    for (const [x, y] of [[23, 31], [23, 35], [24, 40], [24, 47]] as [number, number][]) p.rect(x, y, 1, 2, P.sand[4]);
    for (const [x, y] of [[12, 44], [34, 42], [16, 36], [31, 35]] as [number, number][]) p.set(x, y, P.sand[0]);
    // kleiner Stein weiter hinten am Weg
    p.fig((q) => { q.poly([30, 36, 31, 31, 36, 29, 37, 36], P.stone[2]); q.poly([30, 36, 31, 31, 33, 30, 33, 36], P.stone[3]); });
    p.rect(33, 32, 3, 1, P.stone[0]);
    // Meilenstein vorn: breiter Block mit schräger Kopffläche
    p.fig((q) => {
      q.poly([2, 50, 3, 28, 6, 22, 18, 20, 22, 25, 23, 50], P.stone[2]);
      q.poly([2, 50, 3, 28, 6, 22, 11, 21, 11, 50], P.stone[3]);
      q.poly([6, 22, 18, 20, 22, 25, 8, 27], P.stone[4]);
      q.poly([19, 26, 22, 25, 23, 50, 19, 50], P.stone[1]);
      q.rect(22, 27, 1, 23, P.stone[0]);
    });
    // Sternzeichen in den Stein gemeißelt und Kerben am Rand
    p.poly(starPts(12, 34.5, 5.5, 2.4, 5), P.stone[0]);
    p.poly(starPts(12, 33.5, 5, 2.2, 5), 0xf2b92c);
    p.poly(starPts(12, 33.5, 2.6, 1.2, 5), 0xfff0a0);
    for (let i = 0; i < 5; i++) { p.rect(5, 41 + i * 2, i % 2 ? 7 : 11, 1, P.stone[0]); }
    for (let i = 0; i < 4; i++) { p.rect(17, 29 + i * 5, 3, 1, P.stone[0]); p.rect(17, 30 + i * 5, 3, 1, P.stone[4]); }
    // Moos und Stern
    for (const [x, y] of [[4, 46], [5, 47], [9, 49], [20, 48], [21, 49], [3, 44]] as [number, number][]) p.set(x, y, P.forest[2]);
    p.poly(starPts(38, 8, 4, 1.6, 5), 0xffe27a);
    p.sparkle(31, 18, 0xffe9b0); p.sparkle(41, 20, 0xffe9b0);
  },

  // Dreiklang: drei Glocken unterschiedlicher Größe im Bogenfenster
  dreiklang(p) {
    p.vgrad(0, 0, 46, 52, [0x1a2468, 0x3a4a98, 0x6a7ab8]);
    p.stars(14, 0, 0, 46, 16, rng(55), [0xffffff, 0xcfe3ff]);
    moon(p, 36, 8, 4);
    // Steinrahmen mit Rundbogen
    p.fig((q) => {
      q.rect(0, 0, 46, 52, P.stone[1]);
    }, null);
    p.rect(0, 0, 46, 52, P.stone[1]);
    p.vgrad(5, 7, 36, 45, [0x14183e, 0x2a3a78, 0x5a6ab0]);
    p.disc(23, 17, 18, 0x14183e);
    p.rect(5, 17, 36, 35, 0x14183e);
    p.vgrad(5, 7, 36, 45, [0x14183e, 0x2a3a78, 0x5a6ab0]);
    // Maske: alles außerhalb des Bogens wieder Stein
    for (let y = 0; y < 52; y++)
      for (let x = 0; x < 46; x++) {
        const inside = x >= 5 && x < 41 && (y >= 17 ? y < 52 : Math.hypot(x - 22.5, y - 17.5) <= 18);
        if (!inside) p.set(x, y, ((x + y * 3) % 11 === 0 || y % 7 === 6) ? P.stone[0] : (x < 7 ? P.stone[3] : P.stone[1]));
      }
    // Bogenkante
    for (let a = 180; a <= 360; a += 4) {
      const r = (a * Math.PI) / 180;
      p.set(22.5 + Math.cos(r) * 19, 17.5 + Math.sin(r) * 19, P.stone[4]);
    }
    p.rect(4, 17, 1, 35, P.stone[4]); p.rect(41, 17, 1, 35, P.stone[0]);
    p.stars(8, 8, 12, 38, 24, rng(8), [0xffffff, 0xcfe3ff]);
    // Balken
    p.fig((q) => {
      q.rect(4, 12, 38, 4, P.darkwood[2]);
      q.rect(4, 12, 38, 1, P.darkwood[4]);
      q.rect(4, 15, 38, 1, P.darkwood[0]);
    });
    bell(p, 11, 18, 12, 5, P.gold);
    bell(p, 23, 19, 18, 7, P.gold);
    bell(p, 36, 18, 14, 5, P.copper);
    p.rect(11, 16, 1, 2, 0xc8b070); p.rect(23, 16, 1, 3, 0xc8b070); p.rect(36, 16, 1, 2, 0xc8b070);
    for (const [x, y] of [[11, 31], [23, 39], [36, 34]] as [number, number][]) p.disc(x, y, 1, P.iron[3]);
    // Klangbögen
    for (const [x, y, r] of [[23, 42, 4], [23, 42, 8]] as [number, number, number][]) p.path(arcPts(x, y, r + 3, r, 20, 160, 8), 0xffe27a, 1);
    p.sparkle(8, 40, 0xffe27a); p.sparkle(38, 44, 0xffe27a);
    p.rect(0, 48, 46, 4, P.stone[0]); p.rect(0, 48, 46, 1, P.stone[3]);
  },

  // Viertakt: Metronom mit vier Schlagpunkten auf der Notenlinie
  viertakt(p) {
    p.vgrad(0, 0, 46, 52, [0x0e2a3a, 0x1a4a58, 0x2a6a68]);
    glow(p, 23, 30, 20, 0x3a9a88, 0.5);
    // Notenlinie
    for (let i = 0; i < 5; i++) p.rect(0, 4 + i * 3, 46, 1, 0x8ad8c8);
    for (let k = 0; k < 4; k++) {
      const x = 5 + k * 10, y = 13 - (k % 2) * 3;
      p.fig((q) => { q.ell(x, y, 3, 2, k === 0 ? P.yellow[3] : P.cream[3]); q.rect(x + 2, y - 8, 1, 8, k === 0 ? P.yellow[3] : P.cream[3]); });
      p.set(x - 1, y - 1, 0xffffff);
    }
    // Metronom: Holzkörper
    p.fig((q) => {
      q.poly([16, 17, 30, 17, 38, 50, 8, 50], P.wood[2]);
      q.poly([16, 17, 20, 17, 16, 50, 8, 50], P.wood[3]);
      q.poly([16, 17, 18, 17, 11, 50, 8, 50], P.wood[4]);
      q.poly([30, 17, 38, 50, 33, 50, 27, 17], P.wood[1]);
      q.rect(7, 47, 32, 4, P.darkwood[2]); q.rect(7, 47, 32, 1, P.darkwood[4]);
    });
    // Skala und Schlitz
    p.rect(21, 22, 5, 24, INK);
    for (let j = 0; j < 8; j++) { p.rect(19, 23 + j * 3, 2, 1, P.cream[3]); p.rect(26, 24 + j * 3, 2, 1, P.cream[3]); }
    // Pendel
    p.fig((q) => { q.line(23, 44, 30, 8, P.steel[3], 1); q.rect(27, 18, 6, 5, P.gold[2]); q.rect(27, 18, 6, 1, P.gold[4]); q.rect(32, 19, 1, 4, P.gold[0]); });
    p.disc(23, 44, 2, P.gold[3]); p.set(22, 43, P.gold[4]);
    p.set(30, 7, 0xfff0a0);
    // Aufziehschlüssel
    p.fig((q) => { q.rect(35, 38, 5, 2, P.gold[2]); q.rect(40, 35, 2, 8, P.gold[3]); });
    p.sparkle(42, 28, 0x9af0e0); p.sparkle(5, 36, 0x9af0e0);
  },

  // Rotwein: Karaffe und Kelch mit rotem Wein, ein Herz im Glas
  rotwein(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0a22, 0x3a1030, 0x5a2030, 0x7a3a28]);
    glow(p, 36, 8, 12, 0xe09040, 0.6);
    // Tisch
    p.rect(0, 43, 46, 9, P.darkwood[1]); p.rect(0, 43, 46, 2, P.wood[2]); p.rect(0, 43, 46, 1, P.wood[4]);
    p.rect(0, 48, 46, 1, P.darkwood[0]);
    // Karaffe
    p.fig((q) => {
      q.ell(13, 33, 10, 10, 0x9ad0e0);
      q.rect(10, 12, 7, 12, 0x9ad0e0);
      q.rect(8, 11, 11, 2, 0xc8ecf4);
      q.ell(13, 42, 11, 2, 0x7ab0c8);
    });
    p.ell(13, 34, 8, 8, 0x7a1a30);
    p.rect(11, 16, 5, 6, 0x7a1a30);
    p.vgrad(5, 29, 17, 13, [0xa02a3a, 0x5a0a20]);
    p.ell(13, 28, 7, 2, 0xd04a50);
    for (let y = 26; y < 44; y++) for (let x = 3; x < 24; x++) if (p.get(x, y) === 0x5a0a20 && Math.hypot(x - 13, y - 34) > 8.6) p.set(x, y, 0x7ab0c8);
    p.rect(10, 12, 1, 12, 0xffffff); p.rect(6, 28, 1, 7, 0xffffff); p.set(7, 27, 0xffffff);
    p.fig((q) => { q.rect(10, 6, 6, 5, P.red[2]); q.rect(10, 6, 2, 5, P.red[4]); q.disc(13, 5, 2, P.red[3]); });
    // Kelch
    p.fig((q) => {
      q.ell(33, 24, 9, 10, 0xb8e4f0);
      for (let y = 0; y < 17; y++) for (let x = 20; x < 46; x++) q.data[y * q.w + x] = -1;
      q.rect(32, 33, 3, 8, 0xb8e4f0);
      q.ell(33, 42, 7, 2, 0x9ad0e0);
    });
    p.ell(33, 25, 7, 8, 0xa02a3a);
    p.rect(26, 17, 14, 3, 0xd04a50);
    p.vgrad(26, 21, 15, 10, [0xb0303c, 0x6a1028]);
    p.ell(33, 17, 7, 1, 0xe06a60);
    p.rect(26, 17, 1, 1, 0xffffff);
    suit(p, 'heart', 33, 25, 3.2, P.pink, 0x6a1028);
    p.rect(25, 19, 1, 8, 0xffffff); p.set(26, 28, 0xffffff);
    p.sparkle(24, 12, 0xffd8d0); p.sparkle(43, 34, 0xffd8d0);
  },

  // Bernstein: Bernsteinbrocken mit eingeschlossenem Stern, warmes Leuchten
  bernstein(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0e0a, 0x3a1c10, 0x6a3014, 0x9a4a18]);
    glow(p, 23, 22, 22, 0xd07020, 0.8);
    glow(p, 23, 22, 14, 0xf0a030, 0.9);
    // Gestein
    p.fig((q) => {
      q.poly([0, 52, 0, 42, 8, 40, 16, 43, 30, 41, 38, 38, 46, 42, 46, 52], P.slate[1]);
      q.poly([0, 52, 0, 44, 8, 42, 14, 46, 6, 52], P.slate[2]);
      q.poly([30, 41, 38, 38, 46, 42, 46, 46, 34, 44], P.slate[0]);
    });
    p.speckle(0, 44, 46, 8, P.slate[3], 0.1, rng(23));
    // Brocken
    const pts = [23, 4, 33, 7, 40, 16, 40, 28, 34, 38, 24, 42, 13, 39, 6, 30, 7, 18, 13, 8];
    p.fig((q) => {
      q.poly(pts, (x, y) => {
        const t = ((23 - x) * 0.5 + (22 - y) * 0.6) / 16;
        const core = Math.hypot(x - 23, y - 23) < 9;
        const i = t > 0.7 ? 4 : t > 0.3 ? 3 : t < -0.55 ? 0 : t < -0.15 ? 1 : 2;
        return ramp(0xe89420)[Math.min(4, core && i < 4 ? i + 1 : i)];
      });
    }, 0x3a1808);
    // Einschluss: Stern
    p.poly(starPts(23, 23, 9, 3.6, 5), 0xa04a10);
    p.poly(starPts(23, 23, 8, 3, 5), 0xfff0a0);
    p.poly(starPts(23, 23, 4.5, 1.8, 5), 0xffffff);
    // kleine Luftbläschen und Risse
    for (const [x, y] of [[14, 15], [33, 14], [31, 33], [16, 33], [36, 24]] as [number, number][]) { p.set(x, y, 0xffd070); p.set(x + 1, y + 1, 0xc86a18); }
    // Lichtkanten
    p.path([11, 14, 14, 9, 20, 6], 0xfff6c8, 1);
    p.path([8, 20, 8, 25], 0xffe8a0, 1);
    p.path([34, 36, 28, 40], 0xa04a10, 1);
    p.sparkle(41, 8, 0xffd070); p.sparkle(5, 8, 0xffd070); p.sparkle(42, 34, 0xffc050);
  },

  // Schiefer: Schiefertafel mit Kreidesternen und Rissen
  schiefer(p) {
    p.vgrad(0, 0, 46, 52, [0x14182a, 0x242a40, 0x3a3a54]);
    // Rahmen
    p.fig((q) => {
      q.rect(2, 3, 42, 42, P.darkwood[2]);
      q.rect(2, 3, 42, 2, P.darkwood[4]); q.rect(2, 3, 2, 42, P.darkwood[3]);
      q.rect(2, 43, 42, 2, P.darkwood[0]); q.rect(42, 3, 2, 42, P.darkwood[0]);
    });
    p.vgrad(5, 6, 36, 36, [0x2a3248, 0x343c54, 0x2a3248]);
    p.speckle(5, 6, 36, 36, 0x424a62, 0.1, rng(31));
    // Kreide: Sternbild aus drei Sternen
    const chalk = 0xf4f0e0;
    p.path([10, 30, 17, 20, 26, 24, 35, 12], 0xb8b4c8, 1);
    for (const [x, y, r] of [[10, 30, 3], [17, 20, 4], [26, 24, 3], [35, 12, 5]] as [number, number, number][]) p.poly(starPts(x, y, r, r * 0.42, 5), chalk);
    p.poly(starPts(10, 12, 3, 1.3, 5), chalk);
    p.sparkle(35, 32, chalk); p.sparkle(24, 11, chalk);
    p.set(8, 38, chalk); p.set(9, 38, chalk); p.set(11, 38, chalk); p.set(12, 38, chalk);
    // Risse
    p.path([41, 6, 36, 14, 38, 20, 31, 28, 33, 33, 26, 41], 0x14182a, 1);
    p.path([36, 14, 32, 13, 29, 16], 0x14182a, 1);
    p.path([41, 7, 36, 15, 38, 21, 31, 29], 0x4e5674, 1);
    // Ablage mit Kreide
    p.rect(0, 45, 46, 7, P.darkwood[1]); p.rect(0, 45, 46, 1, P.darkwood[3]);
    p.fig((q) => { q.rect(9, 46, 10, 3, chalk); q.rect(9, 46, 10, 1, 0xffffff); });
    p.rect(17, 46, 2, 3, 0xd0c8b0);
    p.fig((q) => { q.rect(26, 47, 6, 2, 0xf8d8e8); });
    p.speckle(20, 48, 12, 3, 0xe8e4f0, 0.25, rng(2));
  },

  // Moos: bemooster Stein im Nachtwald, kleine Pilze und Klee
  moos(p) {
    p.vgrad(0, 0, 46, 52, [0x081a1c, 0x103a30, 0x1a5a3a]);
    // Stämme im Hintergrund
    for (const [x, w] of [[3, 4], [14, 3], [31, 4], [41, 3]] as [number, number][]) {
      p.rect(x, 0, w, 36, 0x0a2a24); p.rect(x, 0, 1, 36, 0x1a4a3a);
    }
    glow(p, 24, 6, 12, 0x3a9a78, 0.6);
    // Blätterdach
    for (let x = 0; x < 46; x += 5) p.ell(x + 2, 2 + (x % 3), 4, 3, 0x14503a);
    p.rect(0, 38, 46, 14, 0x14402c); p.speckle(0, 38, 46, 14, 0x2a6a3c, 0.2, rng(9));
    // Stein
    p.fig((q) => { q.shadedEll(23, 32, 17, 12, P.stone, 0.1); }, INK);
    // Moos darauf
    const rg = rng(66);
    const mossC = [P.lime[1], P.green[2], P.forest[2], P.lime[2]];
    for (let i = 0; i < 70; i++) {
      const a = rg() * Math.PI * 2, d = rg();
      const x = 23 + Math.cos(a) * 16 * d, y = 32 + Math.sin(a) * 11 * d;
      if (y < 33 || (x < 12 && y > 28)) p.set(x, y, mossC[Math.floor(rg() * 4)]);
    }
    p.ell(20, 22, 9, 3, P.green[2]); p.ell(19, 21, 6, 2, P.lime[3]); p.ell(30, 24, 5, 2, P.forest[2]); p.ell(10, 30, 3, 5, P.green[2]);
    p.speckle(12, 20, 20, 5, P.lime[4], 0.15, rg);
    // Pilze
    const shroom = (x: number, y: number, s: number) => {
      p.fig((q) => {
        q.rect(x - 1, y, 2 * s - 1 > 2 ? 3 : 2, s + 2, P.cream[3]);
        q.shadedEll(x, y, s + 1, s, P.red, 0.05);
      });
      p.set(x - 1, y - 1, 0xffffff); p.set(x + 1, y, 0xffffff);
    };
    shroom(36, 41, 3); shroom(41, 45, 2); shroom(31, 46, 2);
    // Klee
    for (const [x, y] of [[8, 44], [14, 47]] as [number, number][]) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.disc(x + dx * 2, y + dy * 2, 1.4, P.green[3]);
      p.set(x, y, P.lime[4]); p.rect(x, y + 3, 1, 3, P.forest[1]);
    }
    // Glühwürmchen
    for (const [x, y] of [[9, 12], [38, 14], [24, 17], [43, 28]] as [number, number][]) { glow(p, x, y, 3, 0xf0e070, 1); p.set(x, y, 0xffffc0); }
  },

  // Zehnkampf: Siegerkranz mit zehn kleinen Sternen im Kreis, römische X
  zehnkampf(p) {
    p.vgrad(0, 0, 46, 52, [0x14184a, 0x2a2a78, 0x4a3a98]);
    p.rays(23, 24, 10, 0x2a2a78, 0x32348a, 0.1);
    p.vgrad(0, 40, 46, 12, [0x2a2a78, 0x14184a]);
    const cx = 23, cy = 24;
    p.disc(cx, cy + 2, 13, 0x1c2060);
    p.ring(cx, cy + 2, 13, 0x4a3a98, 1);
    // Kranz aus zwei Zweigen, Blätter paarweise
    const leaf2 = (x: number, y: number, a: number, rp: Ramp) => {
      const dx = Math.cos(a), dy = Math.sin(a);
      p.fig((q) => {
        q.poly([x, y, x + dx * 3 - dy * 1.6, y + dy * 3 + dx * 1.6, x + dx * 6, y + dy * 6, x + dx * 3 + dy * 1.6, y + dy * 3 - dx * 1.6], rp[2]);
      }, 0x0a3a24);
      p.set(x + dx * 3, y + dy * 3, rp[4]);
    };
    for (let k = 0; k < 14; k++) {
      const t = k / 13;
      for (const side of [-1, 1]) {
        const ang = Math.PI / 2 + side * t * Math.PI * 1.02;
        const x = cx + Math.cos(ang) * 16, y = cy + 2 + Math.sin(ang) * 16;
        const tan = ang + (side > 0 ? Math.PI / 2 : -Math.PI / 2);
        leaf2(x, y, tan - side * 0.5, k % 2 ? P.green : P.lime);
        leaf2(x, y, tan + side * 0.9 + Math.PI * 0.0, P.forest);
      }
    }
    // Schleife
    p.fig((q) => {
      q.poly([cx, 41, cx - 7, 46, cx - 5, 50, cx - 1, 45], P.red[2]);
      q.poly([cx, 41, cx + 7, 46, cx + 5, 50, cx + 1, 45], P.red[1]);
      q.disc(cx, 42, 2, P.red[3]);
    });
    // zehn Sterne im Kreis
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k / 10) * Math.PI * 2;
      const x = cx + Math.cos(a) * 11, y = cy + 2 + Math.sin(a) * 11;
      p.poly(starPts(x, y, 2.4, 1, 5), k === 0 ? 0xffffff : 0xffe27a);
    }
    // Römische X
    p.fig((q) => {
      q.line(cx - 5, cy - 4, cx + 5, cy + 8, P.gold[2], 3);
      q.line(cx + 5, cy - 4, cx - 5, cy + 8, P.gold[3], 3);
    });
    p.line(cx - 6, cy - 5, cx + 4, cy + 7, P.gold[4]);
    p.line(cx + 6, cy - 5, cx - 4, cy + 7, P.gold[4]);
    p.sparkle(6, 6, 0xffffff); p.sparkle(40, 8, 0xffffff);
  },

  // Warme Stube: Kamin mit Sessel, ein Herz aus Glut
  warme_stube(p) {
    wall(p, 0, 52, ramp(0x5a2a30), 11, 6);
    glow(p, 23, 30, 22, 0xc04a20, 0.8);
    // Kaminrahmen
    p.fig((q) => {
      q.rect(7, 12, 32, 36, P.stone[2]);
      q.rect(7, 12, 32, 2, P.stone[4]); q.rect(7, 12, 2, 36, P.stone[3]); q.rect(37, 12, 2, 36, P.stone[1]);
      q.rect(4, 8, 38, 5, P.stone[3]); q.rect(4, 8, 38, 1, P.stone[4]); q.rect(4, 12, 38, 1, P.stone[1]);
    });
    p.rect(12, 18, 22, 30, 0x1a0a0e);
    p.vgrad(12, 30, 22, 18, [0x2a0a0e, 0x8a2a14]);
    p.rect(12, 18, 22, 1, P.stone[0]);
    // Herz aus Glut
    suit(p, 'heart', 23, 32, 7.5, ramp(0xf0701c), 0x6a1a10);
    for (const [x, y] of [[20, 29], [26, 31], [23, 36], [18, 32], [28, 28]] as [number, number][]) p.set(x, y, 0xfff0a0);
    flame(p, 15, 36, 10, false, -0.6); flame(p, 31, 36, 10, false, 0.6);
    // Holzscheite
    p.fig((q) => { q.rect(12, 43, 22, 4, P.darkwood[2]); q.rect(12, 43, 22, 1, P.wood[3]); q.ell(12, 45, 2, 2, P.wood[3]); q.ell(34, 45, 2, 2, P.wood[2]); });
    p.rect(14, 44, 18, 1, 0xff8a2a);
    // Kerze auf dem Sims
    p.fig((q) => { q.rect(10, 3, 3, 5, P.cream[3]); q.rect(30, 4, 3, 4, P.cream[3]); q.rect(8, 7, 7, 1, P.gold[3]); });
    flame(p, 11, -1, 4, false); flame(p, 31, 0, 4, false);
    // Sessel vorn links
    p.fig((q) => {
      q.poly([0, 52, 0, 30, 3, 26, 12, 26, 15, 30, 16, 52], P.crimson[2]);
      q.poly([0, 52, 0, 30, 3, 26, 6, 26, 6, 52], P.crimson[3]);
      q.rect(0, 40, 22, 12, P.crimson[2]);
      q.rect(0, 40, 22, 2, P.crimson[4]);
      q.rect(17, 36, 6, 16, P.crimson[1]);
      q.rect(17, 36, 6, 2, P.crimson[3]);
    });
    for (let y = 31; y < 40; y += 3) p.set(8, y, P.crimson[4]);
    p.rect(0, 51, 22, 1, P.crimson[0]);
    p.sparkle(39, 22, 0xffc060); p.sparkle(43, 34, 0xffc060);
  },

  // Kalter Keller: Gewölbekeller mit Fass, Raureif und Pik im Eis
  kalter_keller(p) {
    wall(p, 0, 52, ramp(0x36486a), 11, 6);
    p.vgrad(0, 0, 46, 10, [0x0e1430, 0x1e2c58]);
    glow(p, 30, 6, 14, 0x6ab4f4, 0.6);
    // Gewölbebogen
    for (let a = 180; a <= 360; a += 3) {
      const r = (a * Math.PI) / 180;
      p.rect(23 + Math.cos(r) * 24, 12 + Math.sin(r) * 11, 3, 3, P.stone[3]);
    }
    p.rect(0, 0, 46, 2, 0x0e1430);
    // Eiszapfen
    for (const [x, h] of [[3, 7], [8, 4], [14, 6], [20, 3], [27, 5], [33, 8], [39, 4], [43, 6]] as [number, number][]) {
      p.poly([x - 1.5, 0, x + 1.5, 0, x, h], 0xd8f4ff);
      p.line(x - 1, 0, x, h - 1, 0xffffff);
    }
    // Boden mit Raureif
    p.rect(0, 44, 46, 8, P.slate[1]); p.rect(0, 44, 46, 1, 0xdff4ff);
    p.speckle(0, 45, 46, 7, 0xcfe8f8, 0.3, rng(12));
    // Fass
    p.fig((q) => {
      for (let j = 0; j < 28; j++) {
        const t = j / 27, half = Math.round(8 + 3 * Math.sin(Math.PI * t));
        for (let i = -half; i <= half; i++) {
          const u = i / half;
          q.set(13 + i, 18 + j, u < -0.55 ? P.wood[4] : u < -0.1 ? P.wood[3] : u < 0.5 ? P.wood[2] : u < 0.8 ? P.wood[1] : P.wood[0]);
        }
      }
      q.ell(13, 18, 8, 2, P.wood[3]);
    });
    for (const y of [22, 31, 40]) { const half = Math.round(8 + 3 * Math.sin(Math.PI * ((y - 18) / 27))); p.rect(13 - half, y, 2 * half + 1, 2, P.iron[2]); p.rect(13 - half, y, 2 * half + 1, 1, P.steel[3]); }
    p.ell(13, 18, 6, 1, 0xeaf8ff); p.speckle(6, 17, 15, 4, 0xffffff, 0.5, rng(4));
    p.rect(11, 29, 4, 3, P.iron[0]); p.set(12, 30, P.steel[4]);
    p.speckle(4, 20, 4, 24, 0xdff4ff, 0.2, rng(8));
    // Eisblock mit Pik
    p.fig((q) => { q.poly([27, 44, 26, 22, 30, 15, 38, 13, 43, 20, 43, 44], 0x9adcf4); }, 0x2a4a8a);
    p.poly([27, 44, 26, 22, 30, 15, 33, 14, 31, 44], 0xcff4ff);
    p.poly([39, 14, 43, 20, 43, 44, 38, 44], 0x6ab4e0);
    p.vgrad(31, 22, 9, 22, [0x9adcf4, 0x6ab4e0]);
    suit(p, 'spade', 35, 30, 5.5, ramp(0x2a3a8a), 0x1a2060);
    p.path([29, 17, 29, 24], 0xffffff, 1); p.path([32, 14, 36, 14], 0xffffff, 1);
    p.path([33, 40, 36, 37], 0xe8faff, 1);
    p.sparkle(5, 12, 0xffffff); p.sparkle(44, 8, 0xcfe8ff);
  },

  // Zwillingsmond: zwei Monde nebeneinander in verschiedenen Phasen
  zwillingsmond(p) {
    p.vgrad(0, 0, 46, 52, [0x0a0e30, 0x161e58, 0x2a3a88, 0x4a5aa8]);
    p.stars(22, 0, 0, 46, 34, rng(61), [0xffffff, 0xcfe3ff, 0xfff2b0]);
    const phase = (cx: number, cy: number, r: number, cutDx: number, cutR: number) => {
      glow(p, cx, cy, r + 5, 0x6a7ac8, 0.7);
      p.fig((q) => { q.disc(cx, cy, r, 0x242c64); }, 0x0a0e30);
      const lit = ramp(0xece6c8);
      for (let y = Math.floor(cy - r) - 1; y <= cy + r + 1; y++)
        for (let x = Math.floor(cx - r) - 1; x <= cx + r + 1; x++) {
          const d = Math.hypot(x - cx, y - cy);
          if (d > r + 0.4) continue;
          if (Math.hypot(x - cx - cutDx, y - cy) <= cutR) continue;
          const nx = (x - cx) / r, ny = (y - cy) / r;
          const t = (-nx * 0.5 - ny * 0.4 + 0.9) / 1.8;
          p.set(x, y, lit[Math.max(0, Math.min(4, Math.round(t * 4 + 0.4)))]);
        }
      // Erdlicht auf der dunklen Seite
      p.set(cx + r - 2, cy + 1, 0x343c78); p.set(cx + r - 3, cy - 2, 0x343c78);
    };
    phase(14, 22, 11, 8, 10);
    phase(33, 31, 9, 7, 7.5);
    // Krater auf dem rechten Mond
    p.set(29, 29, 0xb0aa90); p.set(30, 29, 0xb0aa90); p.set(30, 35, 0xb0aa90); p.set(27, 32, 0xc8c3a8);
    p.set(9, 26, 0xb0aa90); p.set(10, 26, 0xb0aa90); p.set(8, 18, 0xc8c3a8);
    // Nachtwolke
    p.ell(30, 12, 8, 2, 0x2a3a78); p.ell(26, 11, 5, 1, 0x4a5aa8); p.ell(8, 40, 7, 2, 0x2a3a78); p.ell(6, 39, 4, 1, 0x4a5aa8);
    // Silhouette: Sternwarte
    hills(p, 44, 2, 20, 0.6, 0x0e1238, 0x2a3270);
    p.fig((q) => { q.rect(4, 44, 8, 8, 0x0a0e2a); q.ell(8, 44, 4, 3, 0x0a0e2a); q.line(8, 42, 13, 38, 0x0a0e2a, 2); }, null);
    p.set(7, 47, 0xffc43a); p.set(7, 48, 0xffc43a);
    p.sparkle(42, 10, 0xffffff); p.sparkle(4, 8, 0xffffff);
  },

  // Hausmusik: Spieluhr vor einem Fenster, Noten schweben
  hausmusik(p) {
    p.vgrad(0, 0, 46, 52, [0x3a1a3a, 0x5a2a48, 0x7a3a4a]);
    // Fenster
    p.fig((q) => { q.rect(6, 2, 34, 32, P.wood[3]); }, INK);
    p.vgrad(8, 4, 30, 28, [0x0e1850, 0x1e3a88, 0x4a70b8]);
    p.stars(12, 8, 4, 38, 24, rng(17), [0xffffff, 0xcfe3ff]);
    moon(p, 29, 12, 5);
    p.rect(22, 4, 2, 28, P.wood[3]); p.rect(8, 17, 30, 2, P.wood[3]);
    p.rect(22, 4, 1, 28, P.wood[4]); p.rect(8, 17, 30, 1, P.wood[4]);
    // Vorhänge
    p.fig((q) => {
      q.poly([0, 0, 10, 0, 8, 16, 11, 32, 3, 34, 0, 34], P.red[2]);
      q.poly([46, 0, 36, 0, 38, 16, 35, 32, 43, 34, 46, 34], P.red[2]);
    });
    for (const x of [3, 6]) p.line(x, 2, x - 1, 32, P.red[1]);
    for (const x of [43, 40]) p.line(x, 2, x + 1, 32, P.red[1]);
    p.line(1, 3, 1, 30, P.red[4]); p.line(45, 3, 45, 30, P.red[1]);
    p.rect(0, 0, 46, 2, P.gold[2]);
    // Fensterbrett
    p.rect(0, 34, 46, 18, P.wood[1]); p.rect(0, 34, 46, 2, P.wood[4]); p.rect(0, 36, 46, 1, P.wood[2]);
    // Spieluhr
    p.fig((q) => {
      q.rect(8, 42, 30, 9, P.wood[2]); q.rect(8, 42, 30, 2, P.wood[4]); q.rect(8, 49, 30, 2, P.wood[0]);
      q.poly([8, 42, 38, 42, 36, 36, 10, 36], P.wood[3]);
      q.rect(8, 45, 30, 1, P.gold[3]);
    });
    p.rect(11, 37, 24, 4, 0x2a1a10);
    for (let i = 0; i < 10; i++) p.set(12 + i * 2, 38 + (i % 3), P.gold[4]);
    p.rect(11, 40, 24, 1, P.steel[3]);
    // Tänzerin
    p.fig((q) => { q.rect(22, 31, 2, 6, P.pink[3]); q.poly([18, 36, 23, 31, 28, 36], P.pink[3]); q.disc(23, 29, 2, P.skin[3]); });
    p.rect(20, 34, 7, 1, P.white[4]);
    // Kurbel
    p.fig((q) => { q.rect(38, 45, 4, 2, P.gold[2]); q.rect(41, 41, 2, 7, P.gold[3]); q.disc(42, 41, 1.5, P.gold[4]); });
    // Noten
    const note = (x: number, y: number, c: Color) => {
      p.fig((q) => { q.disc(x, y, 1.5, c); q.rect(x + 1, y - 8, 1, 8, c); q.rect(x + 2, y - 8, 3, 1, c); q.rect(x + 3, y - 7, 2, 1, c); }, 0x2a1a30);
    };
    note(15, 29, 0xfff0b0); note(31, 26, 0xffd8f0); note(28, 14, 0xfff0b0);
    p.sparkle(14, 22, 0xffe27a);
  },

  // Einsiedler: Gestalt mit Laterne vor einer Höhle unter Sternen
  einsiedler(p) {
    p.vgrad(0, 0, 46, 52, [0x060a22, 0x121a4a, 0x2a3a78]);
    p.stars(26, 0, 0, 46, 28, rng(88), [0xffffff, 0xcfe3ff, 0xfff2b0]);
    // Fels mit Höhle
    p.fig((q) => {
      q.poly([0, 52, 0, 22, 6, 14, 16, 8, 28, 6, 38, 12, 46, 20, 46, 52], P.slate[1]);
      q.poly([0, 52, 0, 22, 6, 14, 12, 11, 10, 52], P.slate[2]);
      q.poly([38, 12, 46, 20, 46, 52, 40, 52], P.slate[0]);
    }, null);
    p.speckle(0, 8, 46, 44, P.slate[2], 0.08, rng(5));
    p.poly([8, 52, 9, 30, 14, 22, 23, 18, 32, 22, 37, 30, 38, 52], 0x08061a);
    p.poly([14, 22, 23, 18, 32, 22, 30, 24, 23, 21, 16, 25], P.slate[0]);
    p.rect(0, 46, 46, 6, P.slate[0]); p.rect(0, 46, 46, 1, P.slate[3]);
    // Laternenlicht
    glow(p, 31, 36, 14, 0xf0b040, 0.9);
    // Gestalt: Kutte mit Kapuze
    p.fig((q) => {
      q.poly([13, 50, 15, 36, 18, 28, 23, 26, 28, 28, 30, 38, 31, 50], P.tan[1]);
      q.poly([13, 50, 15, 36, 18, 28, 21, 27, 20, 50], P.tan[2]);
      q.poly([17, 29, 20, 20, 23, 18, 26, 20, 28, 29], P.tan[2]);
      q.poly([17, 29, 20, 20, 23, 18, 22, 29], P.tan[3]);
      q.line(34, 24, 35, 50, P.wood[2], 1);
    });
    p.rect(20, 23, 6, 5, 0x2a1a14);
    p.poly([21, 27, 23, 33, 25, 27], P.white[4]);
    p.set(21, 25, P.white[3]); p.set(25, 25, P.white[3]);
    p.rect(16, 38, 1, 10, P.tan[0]); p.rect(26, 38, 1, 10, P.tan[0]);
    // Arm mit Laterne
    p.fig((q) => { q.line(27, 33, 33, 36, P.tan[2], 2); q.rect(31, 36, 6, 7, P.iron[2]); q.rect(32, 31, 4, 2, P.iron[2]); q.rect(34, 29, 1, 3, P.iron[3]); });
    p.rect(32, 37, 4, 5, 0xffe27a); p.rect(33, 38, 2, 3, 0xffffff);
    p.sparkle(8, 6, 0xffffff); p.sparkle(40, 6, 0xffffff);
  },

  // Notnagel: großer rostiger Nagel im Holzbalken, ein Funke springt
  notnagel(p) {
    p.vgrad(0, 0, 46, 52, [0x4a2a1a, 0x6a3a20, 0x4a2a1a]);
    const r = rng(41);
    // Holzmaserung
    for (let y = 0; y < 52; y += 4) {
      p.rect(0, y, 46, 1, P.darkwood[1]);
      for (let x = 0; x < 46; x += 7) p.set(x + ((y * 3) % 7), y + 2, P.wood[1]);
    }
    for (let i = 0; i < 40; i++) p.set(Math.floor(r() * 46), Math.floor(r() * 52), P.wood[0]);
    // Astloch
    p.ell(8, 12, 5, 3, P.darkwood[0]); p.ell(8, 12, 3, 1, 0x1a0c08); p.ellRing(8, 12, 7, 5, P.wood[1], 1);
    // Risse und Splitter
    p.path([14, 38, 8, 33, 6, 26], 0x1a0c08, 1);
    p.path([14, 38, 20, 44, 18, 51], 0x1a0c08, 1);
    p.path([14, 38, 22, 37, 27, 40], 0x1a0c08, 1);
    p.fig((q) => { q.poly([6, 44, 9, 40, 11, 43, 8, 48], P.tan[3]); q.poly([20, 40, 24, 44, 21, 46], P.tan[3]); q.poly([4, 36, 8, 32, 8, 36], P.tan[2]); });
    // Nagel diagonal: flacher Kopf oben rechts, verjüngter Schaft, Spitze im Holz
    {
      const hx = 33, hy = 10, tx = 12, ty = 41;
      const len = Math.hypot(tx - hx, ty - hy), dx = (tx - hx) / len, dy = (ty - hy) / len, nx = -dy, ny = dx;
      p.fig((q) => {
        q.poly([hx - nx * 2.5, hy - ny * 2.5, hx + nx * 2.5, hy + ny * 2.5, tx, ty], P.copper[1]);
        q.poly([hx - nx * 2.5, hy - ny * 2.5, hx, hy, tx, ty], P.copper[3]);
        q.poly([hx - nx * 8 - dx * 2, hy - ny * 8 - dy * 2, hx + nx * 8 - dx * 2, hy + ny * 8 - dy * 2, hx + nx * 8 + dx * 2, hy + ny * 8 + dy * 2, hx - nx * 8 + dx * 2, hy - ny * 8 + dy * 2], P.copper[2]);
      });
      p.line(hx - nx * 8 - dx * 2, hy - ny * 8 - dy * 2, hx + nx * 8 - dx * 2, hy + ny * 8 - dy * 2, P.orange[4]);
      p.line(hx - nx * 7 + dx * 2, hy - ny * 7 + dy * 2, hx + nx * 7 + dx * 2, hy + ny * 7 + dy * 2, P.copper[0]);
      p.line(hx - nx * 2 + dx * 4, hy - ny * 2 + dy * 4, tx - nx, ty - ny, P.orange[4]);
    }
    // Rostflecken
    for (const [x, y] of [[28, 17], [24, 23], [21, 28], [18, 32]] as [number, number][]) { p.set(x, y, P.darkwood[2]); p.set(x + 1, y + 1, P.crimson[1]); }
    // Funke
    glow(p, 41, 4, 7, 0xff8a2a, 0.9);
    p.poly(starPts(42, 4, 5, 1.5, 4), 0xffe27a);
    p.disc(42, 4, 1, 0xffffff);
    p.line(40, 2, 36, -1, 0xffc43a); p.line(44, 7, 46, 11, 0xffc43a);
    p.sparkle(26, 6, 0xffc43a); p.sparkle(44, 24, 0xff9a2a);
  },

  // @@END
};
