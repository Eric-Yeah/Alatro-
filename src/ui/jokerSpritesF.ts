import { INK, rng, type Ramp } from './jokerPix';
import { PAL as P, arcPts, flame, glow, sky, starPts, type Sprite } from './jokerKit';

// Motive Gruppe F: Handwerk, Gefolge und die drei legendären Jokers.

export const SPRITES_F: Record<string, Sprite> = {
  // Kupferschmied: Hammer schlägt auf glühendes Kupfer am Amboss
  kupferschmied(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1410, 0x5a2414, 0x9a3a1a, 0xd8702a]);
    glow(p, 23, 34, 20, 0xffa040, 0.9);
    p.rect(0, 47, 46, 5, P.iron[0]); p.rect(0, 47, 46, 1, P.iron[2]);
    // Amboss
    p.fig((q) => {
      q.poly([4, 30, 36, 30, 44, 35, 36, 38, 30, 38, 28, 47, 18, 47, 16, 38, 10, 38, 8, 33, 2, 33], P.steel[2]);
      q.poly([4, 30, 36, 30, 44, 35, 8, 35, 2, 33], P.steel[4]);
      q.poly([16, 38, 30, 38, 28, 47, 18, 47], P.steel[1]);
    });
    p.rect(4, 30, 32, 1, 0xffffff);
    p.rect(16, 39, 1, 7, P.steel[3]);
    // glühendes Kupferblech
    p.fig((q) => { q.poly([10, 26, 30, 26, 34, 30, 8, 30], P.copper[3]); }, null);
    p.rect(12, 26, 18, 1, 0xffc070); p.rect(10, 28, 22, 1, P.orange[3]);
    // Kupferkessel links
    p.fig((q) => {
      q.shadedEll(8, 44, 6, 4, P.copper, 0.1);
    });
    // Hammer
    p.fig((q) => {
      q.line(40, 4, 24, 20, P.wood[3], 3);
      q.poly([14, 12, 26, 12, 28, 22, 16, 24], P.steel[2]);
      q.poly([14, 12, 26, 12, 25, 15, 15, 15], P.steel[4]);
      q.rect(14, 22, 14, 2, P.steel[1]);
    });
    // Funken
    for (const [x, y] of [[8, 20], [30, 19], [4, 28], [36, 24], [20, 10], [42, 30]] as [number, number][]) p.sparkle(x, y, x % 2 ? 0xffc43a : 0xff8a2a);
    p.line(33, 25, 40, 20, 0xffe27a); p.line(10, 25, 4, 21, 0xffe27a);
  },

  // Schleifstein: Klinge am drehenden Stein, Funken sprühen
  schleifstein(p) {
    p.vgrad(0, 0, 46, 52, [0x2a2a38, 0x4a4252, 0x6a5a58]);
    p.rect(0, 44, 46, 8, P.wood[0]); p.rect(0, 44, 46, 1, P.wood[2]);
    // Gestell
    p.fig((q) => {
      q.rect(8, 20, 4, 28, P.wood[2]); q.rect(34, 20, 4, 28, P.wood[2]);
      q.rect(8, 20, 1, 28, P.wood[4]); q.rect(34, 20, 1, 28, P.wood[4]);
      q.rect(6, 46, 8, 2, P.wood[1]); q.rect(32, 46, 8, 2, P.wood[1]);
    });
    // Stein
    p.fig((q) => { q.ball(23, 29, 13, P.stone, 0.1); }, INK);
    p.ring(23, 29, 11, P.stone[1], 1);
    p.ring(23, 29, 6, P.stone[3], 1);
    p.disc(23, 29, 3, P.iron[3]); p.set(22, 28, P.steel[4]);
    for (const [x, y] of [[17, 20], [29, 22], [14, 33], [30, 36], [24, 39]] as [number, number][]) p.set(x, y, P.stone[0]);
    // Kurbel
    p.fig((q) => { q.line(23, 29, 40, 40, P.iron[2], 2); q.rect(39, 38, 4, 8, P.wood[3]); });
    // Klinge
    p.fig((q) => {
      q.poly([0, 24, 4, 20, 14, 22, 18, 25, 4, 25], P.steel[3]);
      q.poly([0, 24, 4, 20, 14, 22, 4, 22], P.steel[4]);
      q.rect(0, 25, 2, 4, P.wood[2]);
    });
    p.line(5, 24, 17, 25, 0xffffff);
    // Funken
    const r = rng(19);
    for (let i = 0; i < 12; i++) {
      const a = -2.9 + r() * 1.6, d = 4 + r() * 10;
      const x = 18 + Math.cos(a) * d * 0.9, y = 24 + Math.sin(a) * d;
      p.set(x, y, i % 3 ? 0xffd060 : 0xfff0b0);
      p.set(x + 1, y + 1, 0xff8a2a);
    }
    p.sparkle(9, 10, 0xffe27a); p.sparkle(26, 6, 0xffc43a);
    p.line(14, 22, 6, 12, 0xffd060);
  },

  // Gefolgschaft: vier Gestalten mit Laternen folgen dem Anführer durch die Nacht
  gefolgschaft(p) {
    sky(p, [0x080a26, 0x1a2468, 0x3a4a88], 22, 313, 38);
    p.vgrad(0, 38, 46, 14, [0x1a2a3a, 0x2a3a4a, 0x0e1a28]);
    p.fig((q) => {
      const fig = (x: number, g: number, s: number, rp: Ramp, staff: boolean) => {
        const w = 4.5 * s, h = 17 * s, y = g - h;
        glow(p, x + w + 2, y + h * 0.6, 7 * s, 0xf0b040, 0.9);
        q.poly([x - w, g, x - w * 0.55, y + h * 0.45, x, y + h * 0.12, x + w * 0.55, y + h * 0.45, x + w, g], rp[2]);
        q.poly([x - w, g, x - w * 0.55, y + h * 0.45, x, y + h * 0.12, x - 1, g], rp[3]);
        q.rect(x + w * 0.45, y + h * 0.55, 1, h * 0.45, rp[1]);
        q.disc(x, y + h * 0.18, 2.6 * s, rp[1]);
        if (staff) q.line(x + w + 3, y + 2, x + w + 3, g, P.darkwood[3]);
        q.line(x + w * 0.5, y + h * 0.5, x + w + 2, y + h * 0.6, rp[3]);
      };
      fig(7, 39, 0.9, P.teal, false);
      fig(15, 41, 1.1, P.red, false);
      fig(25, 43, 1.4, P.green, false);
      fig(31, 47, 1.95, P.purple, true);
    });
    const lamp = (x: number, y: number) => { p.rect(x, y, 3, 4, 0xffe27a); p.set(x + 1, y - 1, P.iron[3]); p.set(x + 1, y + 1, 0xffffff); };
    lamp(11, 28); lamp(21, 28); lamp(40, 12);
    for (const [x, y] of [[7, 28], [15, 30], [25, 31], [31, 30]] as [number, number][]) p.set(x, y, P.skin[3]);
    p.poly(starPts(41, 6, 3, 1.2, 5), 0xffe27a);
    p.sparkle(8, 8, 0xcfe0ff); p.sparkle(42, 28, 0xcfe0ff);
  },

  // Sternenkönig: König im Sternenmantel mit Krone und Zepter
  sternenkoenig(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0a48, 0x4a2a98, 0x7a52c8]);
    p.rays(23, 22, 8, 0x5a3aa8, 0x6a48b8, 0);
    p.vgrad(0, 38, 46, 14, [0x4a2a98, 0x1a0a48]);
    glow(p, 23, 20, 18, 0xffe27a, 0.9);
    p.stars(14, 0, 0, 46, 20, rng(401), [0xffffff, 0xffe27a]);
    // Mantel
    p.fig((q) => {
      q.poly([2, 52, 4, 34, 12, 26, 34, 26, 42, 34, 44, 52], P.navy[2]);
      q.poly([2, 52, 4, 34, 12, 26, 18, 26, 14, 52], P.navy[3]);
      q.ell(23, 28, 15, 4, P.white[4]);
    });
    for (const [x, y] of [[8, 40], [38, 42], [12, 48], [32, 46], [6, 32], [40, 34]] as [number, number][]) p.sparkle(x, y, 0xffe27a);
    for (let x = 10; x < 38; x += 3) p.set(x, 28 + (x % 2), INK);
    p.rect(9, 27, 28, 1, 0xffffff);
    // Kopf und Bart
    p.fig((q) => {
      q.ell(23, 19, 7, 8, P.skin[3]);
      q.poly([16, 20, 17, 28, 23, 38, 29, 28, 30, 20, 27, 24, 19, 24], P.white[4]);
    });
    p.poly([16, 20, 17, 28, 20, 33, 21, 25, 19, 24], P.white[3]);
    p.rect(19, 18, 3, 2, 0xffffff); p.rect(25, 18, 3, 2, 0xffffff);
    p.set(20, 19, INK); p.set(26, 19, INK);
    p.rect(18, 16, 4, 1, P.white[3]); p.rect(25, 16, 4, 1, P.white[3]);
    p.disc(23, 22, 1, P.skin[2]);
    p.rect(21, 26, 5, 1, P.skin[1]);
    // Krone
    p.fig((q) => {
      q.poly([15, 12, 16, 4, 19, 8, 23, 1, 27, 8, 30, 4, 31, 12], P.gold[2]);
      q.rect(15, 10, 16, 3, P.gold[3]);
    });
    p.rect(15, 10, 16, 1, P.gold[4]); p.rect(15, 12, 16, 1, P.gold[1]);
    p.disc(23, 3, 1, P.cyan[3]); p.disc(16, 5, 1, P.red[3]); p.disc(30, 5, 1, P.red[3]);
    p.poly(starPts(23, 11, 1.5, 0.7, 5), P.red[3]);
    // Zepter
    p.fig((q) => { q.rect(38, 14, 2, 30, P.gold[2]); q.poly(starPts(39, 11, 5, 2, 5), P.gold[3]); }, 0x3a2208);
    p.set(38, 9, 0xffffff);
    p.sparkle(6, 14, 0xffe27a, true); p.sparkle(42, 4, 0xffffff);
  },

  // Ewiges Licht: ein reich verzierter Öllampe Kelch, dessen Flamme nie erlischt
  ewiges_licht(p) {
    p.rays(23, 22, 12, 0xffe9a0, 0xffd870, 0.1);
    p.vgrad(0, 38, 46, 14, [0xffd870, 0xe8a030]);
    glow(p, 23, 22, 22, 0xffffff, 1);
    glow(p, 23, 22, 14, 0xffffff, 1);
    // Kette
    p.rect(23, 0, 1, 14, P.gold[0]);
    for (let y = 1; y < 14; y += 3) { p.rect(22, y, 3, 1, P.gold[2]); }
    // Lampe
    p.fig((q) => {
      q.shadedEll(23, 38, 15, 8, P.gold, 0.08);
      q.rect(11, 30, 24, 4, P.gold[2]);
      q.poly([35, 34, 44, 28, 45, 31, 36, 38], P.gold[2]);
      q.poly([11, 34, 6, 28, 3, 30, 5, 34, 10, 38], P.gold[2]);
      q.rect(15, 44, 16, 3, P.gold[1]);
      q.rect(18, 47, 10, 3, P.gold[2]);
    });
    p.rect(11, 30, 24, 1, P.gold[4]);
    p.ellRing(23, 38, 15, 8, P.gold[1], 1);
    p.rect(14, 38, 18, 1, P.gold[1]);
    p.disc(23, 39, 2, P.red[3]); p.set(22, 38, 0xffffff);
    p.rect(17, 41, 1, 1, P.gold[4]); p.rect(29, 41, 1, 1, P.gold[4]);
    // große Flamme
    flame(p, 23, 8, 22, true);
    p.poly([21, 24, 25, 24, 23, 30], 0xfff6c8);
    p.sparkle(8, 12, 0xffffff, true); p.sparkle(39, 8, 0xffffff, true); p.sparkle(6, 34, 0xffffff); p.sparkle(41, 42, 0xffffff);
    // Strahlenkranz
    p.path(arcPts(23, 20, 18, 18, -150, -30, 14), 0xffffff, 1);
  },

  // Meister der Tinkturen: alter Alchemist mit leuchtendem Trank vor dem Regal
  meister_der_tinkturen(p) {
    p.vgrad(0, 0, 46, 52, [0x0a2a38, 0x143a4a, 0x1a4a58]);
    // Regale mit Flaschen
    for (const y of [16, 32]) { p.rect(0, y, 46, 2, P.darkwood[2]); p.rect(0, y, 46, 1, P.darkwood[4]); }
    const bottles: Ramp[] = [P.red, P.green, P.yellow, P.purple, P.cyan];
    [[1, 0], [6, 1], [38, 2], [42, 3], [1, 4], [5, 2], [39, 0], [43, 1]].forEach(([x, i], k) => {
      const y = k < 4 ? 8 : 24;
      const c = bottles[i];
      p.fig((q) => { q.rect(x, y, 3, 7, c[2]); q.rect(x + 1, y - 2, 1, 2, P.cream[3]); }, null);
      p.set(x, y + 1, c[4]);
    });
    p.rect(0, 48, 46, 4, P.darkwood[1]);
    // Gestalt: Robe
    p.fig((q) => {
      q.poly([7, 52, 9, 34, 15, 26, 31, 26, 37, 34, 39, 52], P.indigo[2]);
      q.poly([7, 52, 9, 34, 15, 26, 20, 26, 14, 52], P.indigo[3]);
      q.ell(23, 22, 6, 7, P.skin[3]);
      // Hut
      q.poly([13, 17, 15, 14, 22, 12, 24, 4, 27, 0, 28, 6, 32, 12, 34, 14, 36, 17], P.indigo[1]);
      q.poly([13, 17, 15, 14, 22, 12, 24, 4, 27, 0, 22, 12, 17, 16], P.indigo[2]);
      // Bart
      q.poly([17, 22, 18, 30, 23, 44, 28, 30, 29, 22, 26, 26, 20, 26], P.white[4]);
    });
    p.rect(13, 16, 23, 2, P.indigo[0]);
    p.poly(starPts(24, 8, 2.2, 1, 5), 0xffe27a); p.set(19, 13, 0xffe27a); p.set(30, 12, 0xffe27a);
    p.poly([17, 22, 18, 30, 21, 36, 21, 26, 19, 25], P.white[3]);
    p.rect(19, 21, 3, 2, 0xffffff); p.rect(25, 21, 3, 2, 0xffffff); p.set(20, 22, INK); p.set(26, 22, INK);
    p.rect(18, 19, 4, 1, P.white[3]); p.rect(25, 19, 4, 1, P.white[3]);
    p.disc(23, 25, 1, P.skin[2]);
    // erhobener Kolben mit Leuchten
    glow(p, 37, 22, 10, 0xd870f0, 1);
    p.fig((q) => {
      q.rect(36, 12, 3, 5, 0xe8f4f8);
      q.disc(37, 21, 5, 0xe8f4f8);
      q.line(31, 32, 35, 24, P.indigo[2], 3);
    });
    p.disc(37, 22, 4, P.magenta[3]); p.ell(37, 19, 3, 1, P.magenta[4]);
    p.set(35, 21, 0xffffff); p.ring(39, 24, 1, 0xffd0ff);
    p.rect(36, 10, 3, 2, P.wood[2]);
    p.sparkle(40, 12, 0xffffff); p.sparkle(31, 10, 0xe8a0ff); p.sparkle(43, 28, 0xe8a0ff);
    // Handgriff
    p.disc(34, 33, 2, P.skin[3]);
  },
};
