import { INK, Pix, rng, ramp, type Color, type Ramp } from './jokerPix';
import { PAL as P, arcPts, flame, glow, hills, moon, type Sprite } from './jokerKit';

// Motive Gruppe C: Echo, Retrigger und wachsende Jokers.

/** Krone mit drei Zacken, Unterkante bei y, Mitte x, Breite w. */
function crown(p: Pix, x: number, y: number, w: number, h: number, rp: Ramp, gem: Color | null) {
  const l = x - w / 2, r = x + w / 2;
  p.fig((q) => {
    q.poly([l, y, l + 1, y - h, l + w * 0.27, y - h * 0.55, x, y - h * 1.15, r - w * 0.27, y - h * 0.55, r - 1, y - h, r, y], rp[2]);
    q.rect(l, y - 3, w, 3, rp[3]);
    q.rect(l, y - 3, w, 1, rp[4]);
    q.rect(l, y - 1, w, 1, rp[1]);
  }, null);
  if (gem !== null) { p.disc(x, y - 6, 1, gem); p.disc(l + 1, y - h, 1, gem); p.disc(r - 1, y - h, 1, gem); }
}

export const SPRITES_C: Record<string, Sprite> = {
  // Kleines Echo: ein Posthorn und drei verklingende Schallbögen
  kleines_echo(p) {
    p.vgrad(0, 0, 46, 52, [0x1a3a5a, 0x2a7a8a, 0xf0b878]);
    hills(p, 38, 3, 22, 0, 0x1a4a5a, 0x4a8a98);
    hills(p, 45, 2, 15, 2, 0x0e2a3a);
    p.fig((q) => {
      q.ring(13, 31, 8, P.gold[2], 3);
      q.ring(13, 31, 8, P.gold[2], 3);
      q.poly([19, 24, 36, 14, 36, 36, 21, 30], P.gold[2]);
      q.poly([19, 24, 36, 14, 36, 18, 21, 27], P.gold[4]);
      q.poly([21, 30, 36, 36, 36, 32, 22, 28], P.gold[1]);
      q.rect(2, 28, 4, 3, P.gold[3]);
    });
    p.ring(13, 31, 6, P.gold[3], 1);
    p.ell(36, 25, 3, 11, P.gold[3]);
    p.ell(36, 25, 2, 9, 0x4a2a10);
    p.ell(36, 25, 1, 7, 0x2a1408);
    // Schallbögen
    for (const [r, c] of [[6, 0xf8f0c8], [11, 0xbfe8e8], [16, 0x7ac8d0]] as [number, number][]) {
      const a = arcPts(36, 25, r * 0.8, r * 1.5, -62, 62, 20);
      p.path(a, c, 1);
    }
    p.sparkle(8, 16, 0xffe8b0); p.sparkle(41, 8, 0xffe8b0);
  },

  // Hofecho: eine Krone, deren Abbilder nachhallen
  hofecho(p) {
    p.vgrad(0, 0, 46, 36, [0x1a1048, 0x3a2a88, 0x6a5ab8]);
    p.checks(0, 36, 46, 16, 4, 4, 0x4a3a88, 0x2a1a58);
    // Bögen im Saal
    p.fig((q) => {
      q.rect(0, 10, 5, 30, P.stone[3]); q.rect(41, 10, 5, 30, P.stone[3]);
      q.rect(0, 10, 2, 30, P.stone[4]); q.rect(41, 10, 2, 30, P.stone[4]);
    }, null);
    crown(p, 39, 20, 8, 5, ramp(0x5a4aa8), null);
    crown(p, 32, 25, 12, 7, ramp(0x7a62c8), null);
    p.fig((q) => {
      q.poly([6, 38, 7, 16, 14, 26, 21, 11, 28, 26, 35, 16, 36, 38], P.gold[2]);
      q.rect(6, 31, 30, 7, P.gold[3]);
      q.rect(6, 31, 30, 1, P.gold[4]);
      q.rect(6, 37, 30, 1, P.gold[1]);
      q.poly([6, 38, 7, 16, 10, 22, 9, 38], P.gold[4]);
    });
    for (const [x, y, c] of [[7, 15, P.red[3]], [21, 10, P.cyan[3]], [35, 15, P.red[3]]] as [number, number, number][]) { p.disc(x, y, 2, c); p.set(x - 1, y - 1, 0xffffff); }
    for (const [x, c] of [[12, P.red[2]], [21, P.lime[2]], [30, P.cyan[2]]] as [number, number][]) p.disc(x, 34, 1, c);
    p.rect(2, 44, 42, 2, 0x1a1048);
    p.sparkle(43, 10, 0xd8d0ff); p.sparkle(14, 6, 0xd8d0ff);
  },

  // Adlerecho: Adler im Flug mit blassen Schatten Abbildern
  adlerecho(p) {
    p.vgrad(0, 0, 46, 52, [0x2a6ac8, 0x5aa8e8, 0xb8e0f8]);
    for (const [x, y, w] of [[6, 38, 14], [28, 42, 12], [12, 10, 9]] as [number, number, number][]) {
      p.rect(x, y, w, 2, 0xffffff); p.rect(x + 2, y - 1, w - 4, 1, 0xffffff); p.rect(x - 1, y + 1, w + 2, 1, 0xdcecff);
    }
    const eagle = (x: number, y: number, s: number, body: Color, wing: Color, light: Color, head: Color, ink: Color | null) => {
      p.fig((q) => {
        const f = (pts: number[]) => pts.map((v, i) => (i % 2 ? y + v * s : x + v * s));
        q.poly(f([0, -4, -6, -10, -14, -13, -22, -10, -20, -6, -22, -2, -16, -1, -13, 3, -8, 2, -4, 6, 0, 8]), wing);
        q.poly(f([0, -4, 6, -10, 14, -13, 22, -10, 20, -6, 22, -2, 16, -1, 13, 3, 8, 2, 4, 6, 0, 8]), wing);
        q.poly(f([-4, 1, 4, 1, 3, 13, 0, 16, -3, 13]), body);
        q.disc(x, y - 4 * s, Math.max(2, 3 * s), head);
        q.poly(f([2, -5, 7, -3, 2, -2]), light);
        q.poly(f([-22, -10, -20, -6, -22, -2, -17, -4]), body);
        q.poly(f([22, -10, 20, -6, 22, -2, 17, -4]), body);
      }, ink);
    };
    eagle(9, 13, 0.45, 0xe8f4ff, 0xe8f4ff, 0xffffff, 0xffffff, 0x4a88d0);
    eagle(15, 21, 0.65, 0xc8e4ff, 0xc8e4ff, 0xffffff, 0xf0f8ff, 0x3a78c8);
    eagle(25, 30, 1, P.darkwood[1], P.darkwood[2], P.yellow[3], P.white[4], 0x2a1608);
    p.line(11, 29, 16, 36, P.darkwood[3]); p.line(38, 29, 33, 36, P.darkwood[0]);
    p.set(26, 29, INK);
    p.rect(21, 37, 2, 1, P.yellow[2]); p.rect(27, 37, 2, 1, P.yellow[2]);
    p.sparkle(40, 10, 0xffffff);
  },

  // Erstschlag: der erste Hammerschlag auf den Gong
  erstschlag(p) {
    p.vgrad(0, 0, 46, 52, [0x3a0e14, 0x7a1e1e, 0xc0502a]);
    p.rays(23, 24, 10, 0x8a2420, 0x7a1e1e, 0.3);
    p.rect(0, 46, 46, 6, 0x2a0a0e); p.rect(0, 46, 46, 1, 0x5a1a1a);
    // Rahmen
    p.fig((q) => {
      q.rect(4, 6, 38, 3, P.darkwood[2]);
      q.rect(4, 6, 38, 1, P.darkwood[4]);
      q.rect(4, 6, 3, 41, P.darkwood[1]); q.rect(39, 6, 3, 41, P.darkwood[1]);
      q.rect(4, 6, 1, 41, P.darkwood[3]);
    });
    p.line(23, 9, 23, 12, 0xc8b070); p.line(14, 9, 18, 18, 0xc8b070); p.line(32, 9, 28, 18, 0xc8b070);
    // Gong
    p.fig((q) => { q.ball(23, 27, 14, P.copper, 0.1); });
    p.ring(23, 27, 14, P.gold[3], 2);
    p.ball(23, 27, 5, P.gold, 0.1);
    p.ring(23, 27, 9, P.copper[1], 1);
    // Schlag: Funken und Schallringe
    for (const r of [17, 20]) p.path(arcPts(23, 27, r, r, -50, 50, 12), 0xffe8b0, 1);
    p.fig((q) => {
      q.rect(0, 25, 12, 3, P.darkwood[3]);
      q.ell(15, 26, 4, 4, P.red[2]);
    });
    p.set(14, 24, P.red[4]); p.set(13, 25, P.red[4]);
    for (const [x, y] of [[8, 18], [6, 34], [38, 12], [42, 30]] as [number, number][]) p.sparkle(x, y, 0xffc43a);
    p.line(2, 21, 8, 22, 0xffd8a0); p.line(1, 31, 8, 30, 0xffd8a0);
  },

  // Schlussecho: der letzte Nachhall zwischen den Bergen bei Dämmerung
  schlussecho(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1858, 0x7a3a88, 0xe07a8a, 0xf8c070]);
    p.stars(12, 0, 0, 46, 14, rng(77));
    p.disc(30, 28, 6, 0xffe8a8);
    hills(p, 30, 5, 30, 1, 0x6a3a78, 0x9a5a98);
    hills(p, 37, 4, 26, 3, 0x3a2058, 0x5a3a78);
    hills(p, 44, 3, 20, 5, 0x1a1038);
    // Rufer auf dem Felsen
    p.fig((q) => {
      q.poly([2, 52, 3, 40, 8, 36, 14, 38, 15, 52], 0x1a1038);
      q.rect(7, 28, 3, 8, 0x1a1038); q.disc(8, 26, 2, 0x1a1038);
      q.line(9, 27, 12, 24, 0x1a1038, 2);
    }, 0xa078b8);
    // Bögen, nach rechts schwächer
    for (const [r, c] of [[6, 0xfff0c0], [11, 0xffd8b0], [16, 0xf8b8b0], [21, 0xd898b8], [26, 0xa078b8]] as [number, number][]) {
      const a = arcPts(12, 24, r * 0.7, r * 1.2, -50, 50, 20);
      for (let i = 0; i + 3 < a.length; i += 2) if ((i / 2) % (r > 20 ? 2 : 1) === 0) p.line(a[i], a[i + 1], a[i + 2], a[i + 3], c);
    }
    p.sparkle(40, 16, 0xffe8c0);
  },

  // Haltegriff: eine Eisenfaust umklammert einen Stab mit leuchtender Kugel
  haltegriff(p) {
    p.vgrad(0, 0, 46, 52, [0x0a2a3a, 0x144a5a, 0x2a7a7a]);
    glow(p, 23, 8, 14, 0x5ae0f0, 0.9);
    // Stab
    p.rect(21, 12, 4, 40, P.darkwood[2]); p.rect(21, 12, 1, 40, P.darkwood[4]); p.rect(24, 12, 1, 40, P.darkwood[0]);
    p.fig((q) => { q.ball(23, 9, 6, ramp(0x40d0f0), 0.08); }, 0x0a2a4a);
    p.set(20, 6, 0xffffff); p.set(21, 6, 0xffffff);
    // Faust: vier Finger
    p.fig((q) => {
      q.poly([13, 25, 33, 25, 35, 38, 11, 38], P.steel[2]);
      for (let i = 0; i < 4; i++) {
        const y = 25 + i * 3.3;
        q.rect(11, y, 24, 3, P.steel[i % 2 ? 2 : 3]);
        q.rect(11, y, 24, 1, P.steel[4]);
        q.rect(33, y, 2, 3, P.steel[1]);
      }
      q.rect(9, 27, 3, 11, P.steel[1]);
      // Daumen
      q.poly([13, 38, 22, 36, 24, 41, 15, 44], P.steel[3]);
      // Armschiene
      q.poly([14, 44, 32, 44, 34, 52, 12, 52], P.iron[2]);
      q.rect(14, 44, 18, 2, P.steel[3]);
      q.rect(12, 49, 22, 1, P.iron[0]);
    });
    for (const x of [13, 18, 28, 32]) p.set(x, 31, P.gold[3]);
    p.sparkle(8, 12, 0x9af0ff); p.sparkle(38, 18, 0x9af0ff);
  },

  // Schneeball: ein rollender Schneeball wird immer größer
  schneeball(p) {
    p.vgrad(0, 0, 46, 52, [0x2a3a88, 0x7a6ab8, 0xf0a8b8]);
    p.stars(10, 0, 0, 46, 16, rng(88));
    moon(p, 9, 8, 4);
    // Hang
    p.poly([0, 24, 46, 40, 46, 52, 0, 52], 0xe8f0ff);
    p.poly([0, 24, 46, 40, 46, 43, 0, 27], 0xffffff);
    p.poly([0, 36, 46, 48, 46, 52, 0, 52], 0xb0c4e8);
    p.speckle(0, 30, 46, 22, 0xc8d8f4, 0.12, rng(90));
    // Tannen
    for (const [x, y] of [[6, 28], [13, 31]] as [number, number][]) {
      p.fig((q) => {
        q.rect(x, y + 6, 2, 4, P.darkwood[1]);
        q.poly([x - 4, y + 7, x + 1, y - 4, x + 6, y + 7], P.forest[1]);
        q.poly([x - 3, y + 3, x + 1, y - 7, x + 5, y + 3], P.forest[2]);
        q.poly([x - 2, y - 1, x + 1, y - 7, x + 3, y - 1], P.white[4]);
      }, null);
    }
    // Spur
    for (let i = 0; i < 6; i++) p.rect(14 + i * 3, 36 + i * 1, 2, 1, 0xa0b4d8);
    // Schneeball
    p.fig((q) => { q.ball(32, 31, 11, P.snow, 0.1); }, 0x2a3a78);
    p.set(28, 26, 0xffffff); p.set(29, 25, 0xffffff); p.set(27, 27, 0xffffff);
    p.set(35, 34, 0x8a9cc8); p.set(31, 37, 0x8a9cc8); p.set(38, 29, 0x8a9cc8);
    p.rect(26, 30, 3, 1, 0xa0b4d8); p.rect(32, 33, 4, 1, 0xa0b4d8);
    for (const [x, y] of [[20, 24], [22, 28], [18, 31], [43, 22]] as [number, number][]) p.set(x, y, 0xffffff);
    p.sparkle(40, 8, 0xffffff);
  },

  // Lawine: Schneemassen stürzen den Berg hinab
  lawine(p) {
    p.vgrad(0, 0, 46, 52, [0x3a3a6a, 0x6a6a9a, 0xb0b0d0]);
    p.fig((q) => {
      q.poly([-2, 40, 14, 14, 23, 3, 33, 13, 48, 40], P.slate[2]);
      q.poly([-2, 40, 14, 14, 23, 3, 24, 22, 14, 34], P.slate[3]);
      q.poly([33, 13, 48, 40, 34, 40, 28, 22], P.slate[1]);
    }, null);
    p.poly([17, 12, 23, 3, 28, 12, 25, 10, 23, 14, 20, 10], 0xffffff);
    // Schneemassen
    p.poly([21, 14, 26, 14, 34, 32, 40, 44, 6, 44, 12, 32], 0xeef4ff);
    p.poly([21, 14, 23, 14, 18, 30, 14, 44, 6, 44, 12, 32], 0xffffff);
    p.poly([26, 14, 34, 32, 40, 44, 30, 44, 28, 30], 0xc0d0ec);
    for (const [x, y, r] of [[10, 44, 6], [18, 46, 7], [28, 46, 7], [37, 44, 6], [23, 41, 6], [14, 38, 4], [33, 38, 5]] as [number, number, number][]) {
      p.ball(x, y, r, P.snow, 0.1);
    }
    // Felsbrocken im Schnee
    p.fig((q) => { q.ball(26, 33, 3, P.stone, 0.1); q.ball(17, 36, 2, P.stone, 0.1); q.ball(31, 41, 2, P.slate, 0.1); }, INK);
    p.rect(0, 48, 46, 4, 0xe8f0ff);
    p.speckle(0, 48, 46, 4, 0xc0d0ec, 0.3, rng(6));
    for (const [x, y] of [[4, 36], [9, 40], [41, 34], [43, 41]] as [number, number][]) p.sparkle(x, y, 0xffffff);
  },

  // Glimmer: Kristallgruppe, die im Dunkeln glimmt
  glimmer(p) {
    p.vgrad(0, 0, 46, 52, [0x0a0620, 0x2a1060, 0x5a1a78]);
    glow(p, 23, 30, 18, 0xd04ab8, 0.8);
    p.stars(14, 0, 0, 46, 24, rng(55), [0xffffff, 0xf0b0ff, 0xaaf0ff]);
    // Felsen
    p.fig((q) => { q.poly([0, 52, 4, 44, 14, 42, 26, 45, 36, 41, 44, 45, 46, 52], P.slate[1]); q.poly([4, 44, 14, 42, 22, 44, 10, 46], P.slate[3]); }, null);
    const crystal = (x: number, y: number, w: number, h: number, rp: Ramp) => {
      p.fig((q) => {
        q.poly([x - w, y + h, x - w - 1, y + 7, x - 1, y, x + w, y + 6, x + w + 1, y + h], rp[2]);
        q.poly([x - w, y + h, x - w - 1, y + 7, x - 1, y, x - 1, y + h], rp[3]);
        q.poly([x - 1, y, x + w, y + 6, x + w + 1, y + h, x + 1, y + h], rp[1]);
        q.rect(x - w, y + 8, 1, h - 10, rp[4]);
      }, 0x1a0838);
      p.set(x - 1, y + 2, 0xffffff);
    };
    crystal(23, 8, 5, 34, ramp(0xd04ab8));
    crystal(13, 20, 4, 24, ramp(0x7a5ae0));
    crystal(34, 22, 4, 22, ramp(0x40c0e8));
    crystal(7, 31, 3, 14, ramp(0xf070c8));
    crystal(40, 32, 3, 13, ramp(0xb06af0));
    p.sparkle(28, 14, 0xffffff, true); p.sparkle(10, 14, 0xf0b0ff); p.sparkle(41, 18, 0xaaf0ff, true); p.sparkle(19, 4, 0xaaf0ff);
  },

  // Pfadfinder: Karte mit Kompass und gestricheltem Weg
  pfadfinder(p) {
    p.vgrad(0, 0, 46, 52, [0xe8d098, 0xd8b878, 0xc09858]);
    p.speckle(0, 0, 46, 52, 0xb88a48, 0.07, rng(12));
    p.rect(0, 0, 46, 2, 0x8a5a2a); p.rect(0, 50, 46, 2, 0x8a5a2a); p.rect(0, 0, 2, 52, 0x8a5a2a); p.rect(44, 0, 2, 52, 0x8a5a2a);
    p.frame(3, 3, 40, 46, 0xa87838);
    // Berge und Wald
    for (const [x, y] of [[8, 14], [14, 12], [11, 18], [33, 10], [38, 14]] as [number, number][]) {
      p.poly([x - 4, y + 3, x, y - 3, x + 4, y + 3], 0x8a6a48); p.poly([x, y - 3, x + 4, y + 3, x + 1, y + 3], 0x6a4a30);
    }
    for (const [x, y] of [[28, 22], [32, 25], [26, 27], [8, 38]] as [number, number][]) { p.disc(x, y, 2, 0x5a8a48); p.set(x, y + 3, 0x6a4a30); }
    // Fluss
    p.path([5, 24, 10, 28, 14, 27, 19, 32, 24, 31, 30, 36], 0x5a98c8, 2);
    // Weg gestrichelt
    const path: [number, number][] = [[8, 46], [13, 42], [18, 43], [23, 39], [27, 41], [31, 37], [34, 32], [32, 27], [35, 22], [37, 18]];
    for (let i = 0; i + 1 < path.length; i++) {
      const [x0, y0] = path[i], [x1, y1] = path[i + 1];
      p.set((x0 * 2 + x1) / 3, (y0 * 2 + y1) / 3, 0xc03a2a); p.set((x0 + x1 * 2) / 3, (y0 + y1 * 2) / 3, 0xc03a2a); p.set(x0, y0, 0xc03a2a);
    }
    p.line(35, 14, 39, 18, 0xc03a2a, 2); p.line(39, 14, 35, 18, 0xc03a2a, 2);
    // Kompass
    p.fig((q) => {
      q.disc(14, 36, 8, P.gold[2]);
      q.disc(14, 36, 6, P.cream[4]);
    });
    p.ring(14, 36, 8, P.gold[3], 1);
    p.poly([14, 29, 16, 36, 14, 36], P.red[2]); p.poly([14, 29, 12, 36, 14, 36], P.red[3]);
    p.poly([14, 43, 16, 36, 14, 36], P.iron[2]); p.poly([14, 43, 12, 36, 14, 36], P.iron[3]);
    p.disc(14, 36, 1, P.gold[3]);
  },

  // Gezeiten: das Meer steigt und fällt unter dem Mond
  gezeiten(p) {
    p.vgrad(0, 0, 46, 28, [0x0a1030, 0x1a2a68, 0x3a5aa0]);
    p.stars(14, 0, 0, 46, 18, rng(66));
    p.disc(23, 10, 11, 0x3a5aa8);
    moon(p, 23, 10, 8);
    // Meer in Bändern
    const bands: [number, number, number][] = [[24, 0x2a5aa8, 0x6a9ae0], [30, 0x1f4a98, 0x4a7ad0], [37, 0x1a3a88, 0x3a68c0], [44, 0x122a70, 0x2a52a8]];
    bands.forEach(([y, c, crest], i) => {
      for (let x = 0; x < 46; x++) {
        const t = Math.round(y + Math.sin(x / 4.2 + i * 1.7) * 1.5);
        for (let yy = t; yy < 52; yy++) p.set(x, yy, c);
        p.set(x, t, crest);
        if ((x + i) % 5 === 0) p.set(x, t - 1, 0xffffff);
      }
    });
    // Mondspur
    for (let j = 0; j < 9; j++) p.rect(20 + (j % 2) * 2, 25 + j * 2, 6 - (j % 3), 1, 0xe8f0ff);
    // Segelboot
    p.fig((q) => {
      q.poly([6, 33, 18, 33, 15, 37, 9, 37], P.darkwood[2]);
      q.line(12, 33, 12, 22, P.darkwood[3]);
      q.poly([13, 23, 13, 32, 19, 32], P.cream[3]);
      q.poly([11, 25, 11, 32, 7, 32], P.cream[2]);
    });
    p.rect(8, 38, 10, 1, 0xe8f0ff);
    // Gischt
    p.sparkle(38, 36, 0xffffff); p.sparkle(34, 44, 0xbfd8ff);
  },

  // Wachskerze: dicke Wachskerze, die tropfend herunterschmilzt
  wachskerze(p) {
    p.vgrad(0, 0, 46, 52, [0x0a1030, 0x1a2a58, 0x3a3a70]);
    glow(p, 23, 14, 18, 0xe0a030, 0.9);
    // Untersetzer
    p.fig((q) => {
      q.ell(23, 47, 18, 4, P.iron[2]);
      q.ell(23, 46, 16, 3, P.iron[3]);
    });
    p.ell(23, 45, 14, 2, P.yellow[2]);
    // Kerze
    p.fig((q) => {
      q.rect(13, 20, 20, 25, P.yellow[3]);
      q.rect(13, 20, 3, 25, P.yellow[4]);
      q.rect(30, 20, 3, 25, P.yellow[1]);
      q.rect(32, 20, 1, 25, P.orange[1]);
      // Mulde und Tropfen
      q.ell(23, 20, 10, 3, P.yellow[4]);
      q.rect(13, 22, 4, 12, P.yellow[4]);
      q.ell(15, 34, 2, 2, P.yellow[4]);
      q.rect(21, 22, 3, 7, P.yellow[4]); q.ell(22, 29, 2, 2, P.yellow[4]);
      q.rect(28, 22, 3, 17, P.yellow[4]); q.ell(29, 39, 2, 2, P.yellow[4]);
      q.rect(24, 8, 1, 12, 0x2a1a10);
    });
    p.ell(23, 21, 6, 1, 0xffe8a0);
    p.ell(23, 20, 4, 1, 0xfff6c8);
    p.rect(23, 14, 1, 7, 0x2a1a10);
    flame(p, 23, 3, 13, true);
    // Pfütze am Fuß
    p.ell(23, 45, 13, 2, P.yellow[3]);
    p.ell(23, 44, 9, 1, P.yellow[4]);
    p.sparkle(8, 22, 0xffd060); p.sparkle(38, 10, 0xffd060);
  },

  // Zwillingsring: zwei ineinander greifende Goldringe mit Rubin und Saphir
  zwillingsring(p) {
    p.vgrad(0, 0, 46, 52, [0x2a0a3a, 0x4a1a58, 0x2a0a3a]);
    for (let x = 0; x < 46; x += 6) p.rect(x, 0, 1, 52, 0x3a1448);
    glow(p, 23, 28, 20, 0x8a52d0, 0.6);
    p.ring(16, 29, 12, P.gold[2], 4);
    p.ring(16, 29, 12, P.gold[2], 4);
    p.ring(16, 29, 12, P.gold[4], 1);
    p.ring(30, 29, 12, P.gold[2], 4);
    p.ring(30, 29, 12, P.gold[4], 1);
    // Verschränkung: Stück des linken Rings über den rechten, unten
    for (let y = 36; y < 44; y++) for (let x = 20; x < 27; x++) {
      const dx = x - 16, dy = y - 29, d = dx * dx + dy * dy;
      if (d <= 12 * 12 + 6 && d > 8 * 8) p.set(x, y, P.gold[3]);
    }
    p.fig((q) => { q.disc(16, 17, 3, P.red[2]); }, P.gold[0]);
    p.fig((q) => { q.disc(30, 17, 3, P.blue[2]); }, P.gold[0]);
    p.set(15, 16, 0xffd0d0); p.set(29, 16, 0xd0e8ff);
    p.rect(14, 38, 1, 1, P.gold[0]);
    p.sparkle(8, 10, 0xffe27a); p.sparkle(39, 12, 0xffe27a); p.sparkle(23, 46, 0xffe27a);
    p.rect(0, 47, 46, 5, 0x1a0628);
  },
};
