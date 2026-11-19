import { INK, rng, ramp } from './jokerPix';
import { PAL as P, flame, glow, hills, moon, sky, starPts, wall, type Sprite } from './jokerKit';

// Motive Gruppe A: einfache Jokers und Hand Bedingungen. Zeichenfläche 46 mal 52, Mitte x = 23.

export const SPRITES_A: Record<string, Sprite> = {
  // Funke: ein heller Funke springt von Feuerstein und Stahl
  funke(p) {
    sky(p, [0x120a2a, 0x2a1450, 0x6a1f4a], 16, 11);
    glow(p, 23, 20, 15, 0xff8a2a, 0.9);
    // Funkenspuren
    const tr: [number, number, number, number][] = [[23, 20, 4, 6], [23, 20, 41, 9], [23, 20, 8, 33], [23, 20, 38, 31], [23, 20, 23, 2], [23, 20, 14, 12], [23, 20, 33, 13]];
    for (const [x0, y0, x1, y1] of tr) {
      const mx = x0 + (x1 - x0) * 0.62, my = y0 + (y1 - y0) * 0.62;
      p.line(mx, my, x1, y1, 0xff9a2a);
      p.set(x1, y1, 0xfff0a0);
    }
    p.poly(starPts(23, 20, 11, 3, 4), 0xffc43a);
    p.poly(starPts(23, 20, 7, 2.2, 4, -45), 0xffe27a);
    p.disc(23, 20, 3, 0xffffff);
    // Feuerstein und Stahl
    p.fig((q) => {
      q.poly([6, 52, 8, 41, 17, 37, 29, 38, 39, 42, 41, 52], P.stone[1]);
      q.poly([9, 52, 11, 43, 18, 40, 27, 41, 25, 52], P.stone[2]);
      q.poly([11, 44, 18, 40, 22, 41, 15, 46], P.stone[4]);
      q.rect(24, 42, 10, 2, P.stone[0]);
    });
    p.fig((q) => {
      q.poly([27, 30, 40, 24, 42, 27, 29, 33], P.steel[2]);
      q.poly([27, 30, 40, 24, 41, 25, 28, 31], P.steel[4]);
      q.poly([22, 33, 29, 32, 29, 36, 22, 36], P.wood[1]);
    });
    p.sparkle(31, 36, 0xffd060);
    p.sparkle(14, 26, 0xffd060);
  },

  // Treppe: steinerne Wendeltreppe im Turm führt zu einem Stern
  treppe(p) {
    sky(p, [0x0e1840, 0x1c2c6a, 0x3a4a8a], 22, 21);
    moon(p, 37, 9, 5);
    // Stufen von links unten nach rechts oben
    for (let i = 0; i < 8; i++) {
      const x = 1 + i * 5, y = 45 - i * 4;
      p.rect(x, y, 6, 5, P.stone[2]);
      p.rect(x, y, 6, 1, P.stone[4]);
      p.rect(x, y + 1, 6, 1, P.stone[3]);
      p.rect(x, y + 3, 6, 2, P.stone[1]);
      p.rect(x + 5, y + 1, 1, 4, P.stone[0]);
      p.rect(x, y + 5, 6, 47 - y - 5 > 0 ? 47 - y : 0, P.slate[1]);
      p.set(x + 2, y + 2, P.stone[0]);
    }
    p.rect(0, 48, 46, 4, P.slate[0]);
    // Geländer
    p.line(3, 42, 38, 12, P.darkwood[3]);
    for (let i = 0; i < 8; i++) p.rect(3 + i * 5, 42 - i * 4 + 0, 1, 4, P.darkwood[2]);
    // Stern über der obersten Stufe
    glow(p, 39, 5, 8, 0xfff2b0, 0.9);
    p.poly(starPts(39, 5, 5, 2, 5), 0xffe27a);
    p.disc(39, 5, 1, 0xffffff);
  },

  // Kiesel: glatte Steine am Grund eines klaren Baches
  kiesel(p) {
    p.vgrad(0, 0, 46, 52, [0x1f6a8a, 0x2aa6a8, 0x6ad0c8]);
    const r = rng(5);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(r() * 36), y = 3 + Math.floor(r() * 26);
      p.rect(x, y, 5 + Math.floor(r() * 4), 1, 0xa8f0e0);
    }
    p.rect(0, 33, 46, 19, P.sand[2]);
    p.speckle(0, 33, 46, 19, P.sand[3], 0.25, r);
    p.speckle(0, 33, 46, 19, P.sand[1], 0.18, r);
    p.rect(0, 33, 46, 1, P.sand[4]);
    // Steine
    p.fig((q) => {
      q.ball(21, 36, 11, P.stone, 0.08);
      q.shadedEll(21, 36, 12, 8, P.stone, 0.08);
    });
    p.fig((q) => { q.shadedEll(36, 41, 7, 5, ramp(0xc89070)); });
    p.fig((q) => { q.shadedEll(8, 42, 6, 4, ramp(0x7a8aa8)); });
    p.fig((q) => { q.shadedEll(31, 30, 4, 3, ramp(0x9a8ab0)); });
    p.set(17, 33, 0xffffff); p.set(18, 33, 0xffffff); p.set(16, 34, 0xe0f0ff);
  },

  // Blasebalg: Lederbalg facht die Esse an
  blasebalg(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1018, 0x5a1c1c, 0xb03a1c, 0xf0902a]);
    p.rect(0, 46, 46, 6, P.iron[0]);
    p.rect(0, 46, 46, 1, P.iron[2]);
    // Glut unten
    for (let i = 0; i < 46; i += 3) p.rect(i, 47 + (i % 2), 2, 1, 0xff9a2a);
    // Balg
    p.fig((q) => {
      q.poly([3, 14, 14, 10, 20, 34, 6, 38], P.darkwood[2]);
      q.poly([4, 15, 13, 12, 14, 18, 5, 20], P.darkwood[3]);
      q.poly([33, 20, 38, 19, 40, 31, 34, 33], P.darkwood[2]);
      // Falten
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const x0 = 14 + t * 19, ya = 10 + t * 10, yb = 34 - t * 1;
        q.poly([x0, ya, x0 + 4, ya + 1, x0 + 4, yb + 1, x0, yb], i % 2 ? P.tan[1] : P.tan[2]);
        q.line(x0, ya, x0, yb, P.tan[4]);
      }
      // Düse
      q.poly([38, 23, 44, 25, 44, 28, 38, 28], P.iron[2]);
      q.rect(38, 23, 6, 1, P.steel[4]);
      q.rect(1, 22, 3, 5, P.darkwood[1]);
    });
    flame(p, 44, 18, 8, true);
    p.sparkle(41, 15, 0xffd060);
    p.sparkle(36, 40, 0xff9a2a);
  },

  // Kerzenlicht: eine Kerze im Messinghalter, ein Falter umkreist die Flamme
  kerzenlicht(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0e14, 0x3a1a1c, 0x5a2a1c]);
    glow(p, 23, 14, 18, 0xa05a20, 1);
    glow(p, 23, 14, 11, 0xf0b040, 1);
    // Halter
    p.fig((q) => {
      q.rect(21, 25, 5, 20, P.gold[2]);
      q.rect(21, 25, 1, 20, P.gold[4]);
      q.rect(25, 25, 1, 20, P.gold[0]);
      q.poly([13, 48, 17, 43, 30, 43, 34, 48], P.gold[2]);
      q.rect(14, 46, 19, 2, P.gold[1]);
      q.poly([14, 44, 16, 41, 31, 41, 33, 44], P.gold[3]);
      q.rect(17, 43, 13, 1, P.gold[4]);
      q.ell(23, 33, 5, 2, P.gold[3]);
    });
    // Kerze
    p.fig((q) => {
      q.rect(19, 15, 9, 26, P.cream[3]);
      q.rect(19, 15, 2, 26, P.cream[4]);
      q.rect(26, 15, 2, 26, P.cream[1]);
      q.rect(27, 15, 1, 26, P.cream[0]);
      q.rect(24, 17, 1, 5, P.cream[1]);
      q.rect(22, 15, 4, 2, 0xfff0c0);
      q.rect(26, 17, 2, 7, P.cream[3]);
      q.rect(26, 24, 2, 1, P.cream[3]);
    });
    p.rect(23, 11, 1, 4, 0x3a2418);
    flame(p, 23, 3, 9, true);
    // Falter
    p.fig((q) => {
      q.poly([36, 14, 41, 11, 42, 16, 38, 17], P.purple[3]);
      q.poly([36, 15, 41, 19, 38, 21, 35, 17], P.purple[2]);
      q.rect(35, 14, 1, 4, INK);
    }, INK);
    p.set(40, 12, 0xffe27a); p.set(40, 17, 0xffe27a);
    p.sparkle(7, 20, 0xffc060); p.sparkle(39, 33, 0xffc060);
  },

  // Doppelflamme: zwei Fackeln an der Turmmauer
  doppelflamme(p) {
    wall(p, 0, 52, ramp(0x4a2a4a), 11, 6);
    glow(p, 12, 18, 14, 0xc03a2a, 1);
    glow(p, 34, 14, 14, 0xc03a2a, 1);
    const torch = (x: number, y: number, h: number) => {
      p.fig((q) => {
        q.rect(x - 1, y + 10, 3, 26, P.darkwood[2]);
        q.rect(x - 1, y + 10, 1, 26, P.darkwood[3]);
        q.poly([x - 4, y + 10, x + 5, y + 10, x + 3, y + 16, x - 2, y + 16], P.iron[2]);
        q.rect(x - 4, y + 10, 9, 1, P.steel[3]);
        q.rect(x - 3, y + 22, 7, 2, P.iron[1]);
        q.rect(x - 2, y + 34, 5, 2, P.iron[2]);
      });
      flame(p, x, y - h + 12, h, true);
    };
    torch(12, 14, 15);
    torch(34, 10, 18);
    p.sparkle(20, 8, 0xff9a2a); p.sparkle(27, 4, 0xff9a2a); p.sparkle(4, 10, 0xffc060);
    p.rect(0, 46, 46, 6, 0x2a1a2a);
    p.rect(0, 46, 46, 1, 0x5a3a4a);
  },

  // Milchglas: milchig weiße Flasche vor kühlem Licht
  milchglas(p) {
    p.vgrad(0, 0, 46, 52, [0xe8f6f8, 0xb4e2ee, 0x78b8d8]);
    p.rect(0, 44, 46, 8, 0x5a8ab0);
    p.rect(0, 44, 46, 1, 0xb4e2ee);
    // Fensterkreuz im Hintergrund
    p.rect(22, 0, 2, 44, 0xd0ecf4); p.rect(0, 20, 46, 2, 0xd0ecf4);
    p.fig((q) => {
      q.ball(23, 33, 13, ramp(0xc8e4ee), 0.06);
      q.rect(19, 10, 9, 14, 0xd8eef4);
      q.rect(19, 10, 2, 14, 0xffffff);
      q.rect(26, 10, 2, 14, 0x9cc4d8);
      q.rect(18, 8, 11, 3, 0xe8f6fa);
      q.rect(20, 3, 7, 6, P.wood[2]);
      q.rect(20, 3, 7, 1, P.wood[4]);
      q.rect(26, 3, 1, 6, P.wood[0]);
    }, 0x3a6a8a);
    // Milchspiegel und Schlieren
    p.ell(23, 33, 10, 3, 0xffffff);
    p.path([14, 38, 18, 41, 24, 40, 30, 43], 0xe0f2f8, 1);
    p.set(16, 28, 0xffffff); p.set(17, 28, 0xffffff); p.set(16, 29, 0xffffff); p.set(15, 30, 0xffffff);
    p.set(31, 26, 0xffffff);
    // Frostblume
    p.path([8, 8, 8, 14], 0xffffff); p.path([5, 11, 11, 11], 0xffffff); p.path([6, 9, 10, 13], 0xdff2ff); p.path([10, 9, 6, 13], 0xdff2ff);
  },

  // Fünfklang: fünf Glocken an einem Holzbalken
  fuenfklang(p) {
    sky(p, [0x0a3a4a, 0x1a6a6a, 0x4ab08a], 8, 8);
    p.rect(0, 5, 46, 4, P.darkwood[2]);
    p.rect(0, 5, 46, 1, P.darkwood[4]);
    p.rect(0, 8, 46, 1, P.darkwood[0]);
    const bells = [[5, 11, 3], [14, 16, 4], [23, 21, 5], [32, 16, 4], [41, 11, 3]];
    bells.forEach(([x, h, w], i) => {
      p.line(x, 9, x, 13, 0xc8b070);
      p.fig((q) => {
        const y = 13;
        q.poly([x - 1, y, x + 1, y, x + w - 1, y + 3, x + w + 1, y + h - 3, x + w + 2, y + h, x - w - 2, y + h, x - w - 1, y + h - 3, x - w + 1, y + 3], P.gold[2]);
        q.rect(x - w, y + 2, 1, h - 3, P.gold[4]);
        q.rect(x - w + 1, y + 3, 1, h - 5, P.gold[3]);
        q.rect(x + w - 1, y + 3, 1, h - 4, P.gold[0]);
        q.rect(x - w - 2, y + h - 1, 2 * w + 5, 1, P.gold[1]);
        q.rect(x, y + h + 1, 1, 2, P.iron[2]);
      });
      p.set(x, y0(h) + 1, 0xfff0a0);
      if (i % 2 === 0) p.sparkle(x, 38 + i, 0xbff6d0);
    });
    function y0(h: number) { return 13 + h; }
    for (let i = 0; i < 5; i++) p.set(5 + i * 9, 36 + (i % 2) * 3, 0xe8ffe0);
    p.rect(0, 46, 46, 6, 0x0a2a3a);
    p.ellRing(23, 47, 20, 3, 0x2a8a7a, 1);
  },

  // Leisetreter: schwarze Katze schleicht über den Dachfirst im Mondlicht
  leisetreter(p) {
    sky(p, [0x0c1038, 0x242a78, 0x5a5aa8], 24, 31);
    p.disc(31, 16, 11, 0x7a7ad0);
    moon(p, 31, 16, 9);
    // Dach
    p.poly([0, 40, 46, 30, 46, 52, 0, 52], 0x1a1634);
    p.line(0, 40, 46, 30, 0x4a4a8a);
    for (let i = 0; i < 10; i++) p.line(i * 5, 44 + i * -0.5, i * 5 + 3, 50, 0x2a2650);
    // Katze
    p.fig((q) => {
      const k = 0x0e0a1c;
      q.ell(18, 34, 9, 4, k);
      q.rect(10, 34, 3, 6, k); q.rect(16, 36, 3, 4, k);
      q.rect(22, 34, 3, 5, k); q.rect(26, 33, 3, 6, k);
      q.disc(28, 28, 4, k);
      q.poly([25, 26, 26, 21, 29, 25], k); q.poly([29, 25, 31, 21, 33, 26], k);
      q.path([9, 33, 5, 30, 4, 24, 7, 20], k, 2);
    }, 0x5a58b0);
    p.set(27, 28, 0xd8ff50); p.set(30, 28, 0xd8ff50);
    p.set(26, 24, 0x6a3a6a);
    p.sparkle(8, 8, 0xdfe6ff); p.sparkle(14, 15, 0xdfe6ff);
  },

  // Hochstapler: Herr mit schiefem Zylinder, Monokel und angeklebtem Schnurrbart
  hochstapler(p) {
    p.checks(0, 0, 46, 52, 6, 6, 0x4a2a6a, 0x5a3a7a);
    p.rect(0, 46, 46, 6, 0x2a1a3a);
    p.fig((q) => {
      // Mantel und Kragen
      q.poly([4, 52, 6, 42, 16, 38, 30, 38, 40, 42, 42, 52], 0x2a2a48);
      q.poly([16, 38, 23, 46, 30, 38, 28, 37, 18, 37], P.white[3]);
      q.poly([21, 44, 25, 44, 26, 48, 20, 48], P.red[2]);
      q.rect(22, 44, 2, 3, P.red[4]);
      // Kopf
      q.ell(23, 29, 9, 10, P.skin[2]);
      q.ell(23, 29, 9, 10, P.skin[2]);
      q.rect(14, 29, 2, 4, P.skin[1]);
      // Hut
      q.rect(11, 17, 25, 3, 0x14101e);
      q.rect(14, 5, 18, 13, 0x14101e);
      q.rect(14, 12, 18, 3, P.gold[2]);
      q.rect(15, 5, 2, 12, 0x3a3456);
    });
    p.shadedEll(23, 29, 9, 10, P.skin, 0.1);
    // Hut neu darüber, damit der Rand sauber bleibt
    p.rect(11, 18, 25, 2, 0x14101e); p.rect(12, 17, 23, 1, 0x3a3456);
    p.rect(14, 12, 18, 3, P.gold[2]); p.rect(14, 12, 18, 1, P.gold[4]);
    // Augen, Nase, Schnurrbart, Monokel
    p.rect(18, 24, 3, 2, 0xffffff); p.rect(26, 24, 3, 2, 0xffffff);
    p.set(19, 25, INK); p.set(27, 25, INK);
    p.rect(18, 22, 4, 1, 0x3a2418); p.rect(26, 22, 4, 1, 0x3a2418);
    p.disc(23, 29, 2, P.pink[2]); p.set(22, 28, P.pink[4]);
    p.poly([14, 33, 22, 31, 23, 33, 24, 31, 32, 33, 30, 36, 24, 34, 23, 35, 22, 34, 16, 36], 0x2a1a14);
    p.ring(28, 25, 4, P.gold[3]); p.line(30, 29, 33, 40, P.gold[2]);
    p.rect(20, 38, 7, 1, 0x7a3a3a);
    p.sparkle(8, 10, 0xffe27a); p.sparkle(39, 12, 0xffe27a);
  },

  // Dreifuß: Kessel auf eisernem Dreibein über dem Feuer
  dreifuss(p) {
    sky(p, [0x0a2a22, 0x14503a, 0x2a7a4a], 6, 3);
    glow(p, 23, 40, 16, 0xe0602a, 1);
    p.rect(0, 47, 46, 5, 0x1a1a22);
    // Dreibein
    p.fig((q) => {
      q.line(10, 47, 19, 24, P.iron[2], 2);
      q.line(36, 47, 27, 24, P.iron[2], 2);
      q.line(23, 47, 23, 24, P.iron[3], 2);
      q.rect(8, 46, 4, 2, P.iron[1]); q.rect(34, 46, 4, 2, P.iron[1]);
    });
    // Feuer
    flame(p, 17, 36, 11, false, -1); flame(p, 23, 31, 16, true); flame(p, 29, 36, 11, false, 1);
    p.rect(14, 46, 18, 2, 0x5a2a1a);
    // Kessel
    p.fig((q) => {
      q.shadedEll(23, 20, 15, 10, ramp(0x3a3a4a), 0.08);
      q.rect(7, 11, 33, 3, P.iron[1]);
      q.rect(7, 11, 33, 1, P.iron[4]);
    });
    p.ellRing(23, 12, 16, 3, P.iron[3], 1);
    p.ell(23, 12, 14, 2, 0x7ae05a);
    p.ell(23, 12, 9, 1, 0xc8ff8a);
    // Blasen und Dampf
    p.ring(18, 6, 2, 0xc8ff8a); p.ring(27, 4, 3, 0xc8ff8a); p.set(23, 8, 0xe8ffc0); p.ring(31, 9, 1, 0xc8ff8a);
    p.set(17, 1, 0x7ae05a); p.set(21, 2, 0x4aa04a); p.set(30, 0, 0x7ae05a);
    p.rect(16, 18, 2, 6, P.steel[3]);
  },

  // Gästehaus: warm erleuchtetes Wirtshaus in der Nacht
  gaestehaus(p) {
    sky(p, [0x0c1840, 0x1c3a70, 0x3a6a98], 18, 77, 41);
    glow(p, 23, 40, 20, 0x9a6a30, 0.8);
    p.rect(0, 40, 46, 12, 0x2a2438);
    for (let x = 0; x < 46; x += 6) p.rect(x, 42 + (x % 12 ? 2 : 0), 4, 1, 0x3a3450);
    p.fig((q) => {
      // Mauer
      q.rect(6, 20, 34, 24, P.tan[2]);
      q.rect(6, 20, 34, 2, P.tan[3]);
      q.rect(37, 22, 3, 22, P.tan[1]);
      for (let j = 0; j < 5; j++) { q.rect(6, 25 + j * 4, 34, 1, P.tan[1]); }
      // Fachwerk
      q.rect(6, 31, 34, 2, P.darkwood[2]);
      q.rect(22, 20, 2, 11, P.darkwood[2]);
      // Dach
      q.poly([2, 22, 23, 6, 44, 22, 41, 22, 23, 9, 5, 22], P.red[1]);
      q.poly([3, 22, 23, 7, 44, 22], P.red[2]);
      for (let i = 0; i < 6; i++) q.line(4 + i * 3, 21 - i, 23, 8 + i, P.red[1]);
      q.rect(33, 4, 4, 9, P.stone[1]);
      q.rect(33, 4, 4, 1, P.stone[3]);
    });
    // Fenster
    for (const [x, y] of [[9, 24], [28, 24], [10, 34]]) {
      p.rect(x, y, 6, 5, P.darkwood[1]);
      p.rect(x + 1, y + 1, 4, 3, 0xffd060);
      p.rect(x + 3, y + 1, 1, 3, P.darkwood[1]);
    }
    p.fig((q) => {
      q.rect(19, 33, 8, 11, P.darkwood[2]);
      q.rect(19, 33, 8, 1, P.darkwood[4]);
      q.rect(22, 33, 1, 11, P.darkwood[0]);
      q.set(25, 39, P.gold[3]);
    });
    // Schild
    p.line(41, 28, 41, 30, P.iron[3]); p.rect(40, 30, 5, 5, P.wood[2]); p.rect(41, 31, 3, 2, P.gold[3]);
    // Rauch
    p.set(34, 2, 0xa8b0c8); p.set(36, 1, 0x8a92a8); p.set(33, 0, 0x8a92a8);
    p.rect(2, 44, 6, 2, 0x4a4660); p.rect(40, 44, 4, 2, 0x4a4660);
  },

  // Einzelgänger: ein Wolf heult allein den Mond an
  einzelgaenger(p) {
    sky(p, [0x0a1230, 0x2a3a6a, 0x6a82a8], 20, 41);
    p.disc(29, 15, 14, 0x4a5a90);
    moon(p, 29, 15, 12);
    hills(p, 38, 3, 24, 0.5, 0x1a2444, 0x4a5a8a);
    p.rect(0, 46, 46, 6, 0x0e1428);
    p.fig((q) => {
      // Felsen
      q.poly([6, 52, 8, 44, 16, 40, 34, 40, 40, 46, 40, 52], 0x2a3050);
      q.poly([8, 44, 16, 40, 34, 40, 32, 42, 12, 44], 0x4a5880);
    });
    p.fig((q) => {
      const k = 0x151a34;
      // Wolf sitzend, Kopf nach oben, Maul offen
      q.poly([20, 25, 22, 17, 24, 13, 27, 11, 31, 8, 37, 3, 39, 4, 38, 7, 33, 9, 36, 11, 31, 13, 29, 16, 29, 21, 31, 28, 31, 36, 32, 42, 25, 42, 25, 37, 23, 40, 22, 42, 11, 42, 10, 38, 12, 31, 14, 27], k);
      q.poly([22, 15, 22, 7, 26, 12], k);
      q.path([11, 38, 6, 38, 4, 33, 6, 29], k, 2);
    }, INK);
    p.set(31, 10, 0xffe27a);
    p.line(22, 26, 14, 30, 0x2a3558); p.line(25, 20, 28, 30, 0x2a3558);
    p.path([40, 10, 43, 8], 0xcfe0ff); p.path([41, 14, 45, 13], 0xcfe0ff);
    for (const x of [3, 6, 41, 44]) p.line(x, 51, x + 1, 47, 0x2a3a5a);
  },

  // Letzte Chance: eine einzelne Laterne am Ende des Stegs, die Sonne geht unter
  letzte_chance(p) {
    p.vgrad(0, 0, 46, 32, [0x2a1450, 0x7a2a60, 0xd8484a, 0xf8a040]);
    p.disc(23, 30, 10, 0xffd060);
    p.rect(0, 30, 46, 22, 0x7a2a60);
    p.vgrad(0, 30, 46, 22, [0xd8484a, 0x7a2a60, 0x2a1450]);
    for (let i = 0; i < 6; i++) p.rect(15 + i, 32 + i * 2, 17 - i * 2, 1, i % 2 ? 0xffd060 : 0xf8a040);
    p.stars(8, 0, 0, 46, 14, rng(9));
    // Steg
    p.fig((q) => {
      q.rect(0, 42, 46, 4, P.darkwood[1]);
      q.rect(0, 42, 46, 1, P.darkwood[3]);
      for (let x = 2; x < 46; x += 8) q.rect(x, 46, 2, 6, P.darkwood[0]);
      // Pfosten und Laterne
      q.rect(34, 18, 3, 25, P.darkwood[1]);
      q.rect(34, 18, 1, 25, P.darkwood[3]);
      q.rect(31, 14, 9, 2, P.iron[2]);
      q.rect(32, 16, 7, 1, P.iron[1]);
      q.rect(32, 17, 7, 9, 0xf0a030);
      q.rect(32, 26, 7, 1, P.iron[2]);
      q.poly([31, 14, 35, 11, 39, 14], P.iron[2]);
      q.rect(35, 9, 1, 2, P.iron[3]);
    });
    p.rect(33, 18, 5, 7, 0xffd060);
    p.rect(35, 19, 1, 5, 0xfff6c8);
    glow(p, 35, 21, 9, 0xffd060, 0.8);
    p.rect(33, 17, 5, 1, P.iron[1]);
    p.line(5, 41, 12, 36, 0x7a2a60);
  },
};
