import { INK, Pix, rng, ramp, type Color } from './jokerPix';
import { PAL as P, arcPts, flame, glow, hills, moon, sky, starPts, wall, type Sprite } from './jokerKit';
import { coinG } from './jokerSpritesG';

// Motive Gruppe H: Geld, Wege, Handwerk und Alltag der zweiten Welle (Zeichenfläche 46 mal 52).

export const SPRITES_H: Record<string, Sprite> = {
  // Sparfuchs: Fuchs mit Münzbeutel im Mondlicht
  sparfuchs(p) {
    sky(p, [0x0a1038, 0x1a2a6a, 0x3a5a98], 20, 71, 36);
    moon(p, 37, 8, 5);
    glow(p, 37, 8, 12, 0x6a8ad0, 0.6);
    hills(p, 33, 3, 24, 0.4, 0x16304a, 0x2a4a68);
    p.rect(0, 40, 46, 12, 0x1a3a3a);
    p.speckle(0, 40, 46, 12, 0x2a5a48, 0.25, rng(3));
    p.rect(0, 40, 46, 1, 0x3a7a58);
    for (const x of [4, 12, 41, 34]) { p.line(x, 44, x - 1, 40, 0x3a8a58); p.line(x, 44, x + 1, 41, 0x3a8a58); }
    // Schwanz
    p.fig((q) => {
      q.poly([13, 49, 6, 48, 2, 41, 3, 33, 8, 34, 8, 41, 14, 43], P.orange[2]);
      q.poly([13, 49, 6, 48, 2, 41, 6, 41, 9, 45], P.orange[1]);
      q.poly([3, 33, 8, 34, 8, 37, 3, 38], P.white[4]);
    });
    // Körper und Kopf
    p.fig((q) => {
      q.shadedEll(18, 41, 8, 9, P.orange, 0.1);
      q.poly([13, 50, 14, 45, 20, 46, 20, 50], P.orange[1]);
      q.shadedEll(25, 33, 5, 8, P.orange, 0.08);
      q.shadedEll(26, 25, 6, 5, P.orange, 0.08);
      q.poly([29, 23, 37, 28, 29, 30], P.orange[3]);
      q.poly([21, 22, 22, 14, 26, 21], P.orange[2]);
      q.poly([26, 21, 29, 14, 31, 22], P.orange[2]);
    });
    p.poly([22, 21, 22, 17, 24, 21], 0x3a1a20); p.poly([27, 21, 29, 17, 30, 21], 0x3a1a20);
    p.ell(26, 36, 3, 6, P.white[4]);
    p.poly([29, 27, 36, 28, 29, 30], P.white[4]);
    p.rect(36, 27, 2, 2, INK);
    p.rect(27, 24, 2, 2, INK); p.set(27, 24, 0xffffff);
    p.rect(21, 49, 8, 2, 0x2a1008);
    // Münzbeutel
    p.fig((q) => {
      q.shadedEll(36, 44, 7, 6, ramp(0xb08850), 0.1);
      q.poly([33, 39, 39, 39, 38, 36, 34, 36], P.tan[2]);
    });
    p.rect(33, 38, 6, 1, P.red[2]);
    p.rect(35, 36, 1, 3, P.red[1]);
    p.fig((q) => { q.disc(36, 45, 3, P.gold[3]); }, 0x4a2a08);
    p.set(35, 44, P.gold[4]); p.rect(37, 46, 1, 1, P.gold[1]);
    coinG(p, 42, 41, 2); coinG(p, 30, 50, 2); coinG(p, 44, 49, 2);
    p.sparkle(41, 33, 0xffe27a); p.sparkle(8, 26, 0xcfe3ff);
  },

  // Vorsprung: Läufer mit Fackel an einer Startlinie
  vorsprung(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1a58, 0x8a3a6a, 0xe0703a, 0xf8b050]);
    glow(p, 10, 34, 12, 0xffd890, 0.7);
    hills(p, 33, 2, 20, 1, 0x3a2058, 0x6a3a78);
    p.rect(0, 36, 46, 16, 0x5a3a3a);
    p.speckle(0, 36, 46, 16, 0x7a4a3a, 0.2, rng(7));
    p.speckle(0, 36, 46, 16, 0x3a2a30, 0.15, rng(8));
    p.rect(0, 36, 46, 1, 0xb87a4a);
    // Startlinie in Perspektive
    p.poly([6, 52, 8, 44, 40, 44, 44, 52], 0xe8e0c8);
    p.poly([8, 48, 9, 46, 38, 46, 40, 48], 0xf8f4e0);
    // Pfosten mit Wimpeln
    p.fig((q) => { q.rect(3, 22, 2, 24, P.wood[2]); q.rect(41, 22, 2, 24, P.wood[2]); });
    p.fig((q) => { q.poly([5, 22, 12, 24, 5, 27], P.red[2]); q.poly([41, 22, 34, 24, 41, 27], P.red[2]); });
    // Geschwindigkeitsstreifen
    for (const [x, y, l] of [[0, 20, 9], [3, 25, 12], [0, 30, 7], [2, 35, 10]] as [number, number, number][]) { p.rect(x, y, l, 1, 0xffc8a0); p.rect(x + 2, y + 1, l - 3, 1, 0xe08a7a); }
    // Läufer
    p.fig((q) => {
      q.line(20, 36, 16, 43, P.skin[2], 3);   // hinteres Bein
      q.line(16, 43, 11, 41, P.skin[1], 3);
      q.line(22, 34, 29, 38, P.skin[3], 3);   // vorderes Bein
      q.line(29, 38, 30, 44, P.skin[3], 3);
      q.poly([19, 32, 25, 24, 30, 26, 27, 35, 21, 36], P.teal[2]);
      q.poly([19, 32, 25, 24, 27, 25, 22, 34], P.teal[3]);
      q.disc(30, 20, 4, P.skin[3]);
      q.poly([26, 18, 30, 15, 35, 19, 31, 19], P.crimson[2]);
      q.line(25, 27, 18, 26, P.skin[2], 2);
      q.line(29, 27, 35, 17, P.skin[3], 2);
    });
    p.set(32, 21, INK); p.rect(11, 41, 3, 2, P.wood[1]); p.rect(29, 44, 4, 2, P.wood[1]);
    // Fackel in der erhobenen Hand
    p.fig((q) => { q.rect(35, 11, 2, 7, P.wood[2]); });
    flame(p, 36, 1, 11, true, 0.4);
    glow(p, 36, 8, 8, 0xffa040, 0.7);
    p.sparkle(26, 6, 0xffe27a); p.sparkle(43, 12, 0xffc43a);
  },

  // Sparstrumpf: prall gefüllter Strumpf, Münzen blitzen heraus
  sparstrumpf(p) {
    p.vgrad(0, 0, 46, 52, [0x1a2a48, 0x2a3a5a, 0x3a3a5a]);
    for (let y = 2; y < 52; y += 8) for (let x = (y / 8) % 2 ? 2 : 6; x < 46; x += 8) { p.set(x, y, 0x4a5a7a); p.set(x + 1, y + 1, 0x4a5a7a); p.set(x - 1, y + 1, 0x4a5a7a); }
    glow(p, 23, 20, 18, 0x5a7ab0, 0.5);
    // Nagel mit Schnur
    p.rect(18, 1, 2, 3, P.iron[3]); p.line(19, 3, 22, 9, 0xc8b070); p.line(19, 3, 15, 9, 0xc8b070);
    // Strumpf
    const stripe = (x: number, y: number) => {
      const k = Math.floor((y + x * 0.35) / 4) % 2;
      const t = ((13 - x) * 0.5 + (10 - y) * 0.4) / 14;
      const rp = k ? P.red : P.cream;
      return t > 0.5 ? rp[4] : t > 0.05 ? rp[3] : t < -0.5 ? rp[1] : rp[2];
    };
    p.fig((q) => {
      q.poly([14, 11, 30, 11, 31, 30, 36, 33, 43, 38, 45, 45, 41, 51, 28, 51, 21, 45, 14, 36], stripe);
    });
    // Bund
    p.fig((q) => { q.rrect(12, 6, 21, 7, P.white[3], 2); });
    p.rect(13, 7, 19, 1, P.white[4]); p.rect(13, 11, 19, 1, P.white[1]);
    for (let x = 14; x < 32; x += 3) { p.set(x, 9, P.white[1]); p.set(x + 1, 8, P.white[4]); }
    // Beulen: Münzen unter dem Stoff
    for (const [x, y, r] of [[22, 22, 4], [20, 34, 3], [33, 40, 4], [27, 45, 3], [39, 44, 3]] as [number, number, number][]) {
      p.path(arcPts(x, y, r, r, 170, 280, 6), 0xffffff, 1);
      p.path(arcPts(x + 1, y + 1, r, r, -10, 100, 6), P.crimson[0], 1);
    }
    // Münzen am Rand oben
    coinG(p, 18, 5, 3); coinG(p, 26, 3, 4); coinG(p, 32, 6, 3);
    p.sparkle(26, 3, 0xffffff, true); p.sparkle(8, 20, 0xffe27a); p.sparkle(41, 18, 0xffe27a, true); p.sparkle(8, 40, 0xffe27a);
  },

  // Spardose: Tonkrug mit Münzschlitz, eine Goldmünze im Fall
  spardose(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1a48, 0x5a2a58, 0x8a4a58]);
    p.stars(10, 0, 0, 46, 14, rng(5), [0xffe0f0, 0xffffff]);
    p.rect(0, 46, 46, 6, P.darkwood[1]); p.rect(0, 46, 46, 1, P.wood[3]);
    // Krug
    p.fig((q) => {
      q.shadedEll(23, 35, 14, 13, ramp(0xc4623a), 0.1);
      q.ell(23, 22, 8, 3, ramp(0xc4623a)[3]);
      q.rect(15, 21, 16, 3, ramp(0xc4623a)[2]);
    });
    p.ell(23, 21, 7, 2, ramp(0xc4623a)[4]);
    p.rect(19, 21, 9, 1, 0x2a0e08);
    // Verzierungsband
    const cl = ramp(0xc4623a);
    for (let x = 11; x < 36; x += 3) { p.set(x, 33, cl[4]); p.set(x + 1, 34, cl[0]); }
    p.rect(10, 31, 27, 1, cl[0]); p.rect(10, 36, 27, 1, cl[0]);
    for (const [x, y] of [[17, 40], [23, 41], [29, 40]] as [number, number][]) p.poly(starPts(x, y, 2.5, 1, 5), 0xf2b92c);
    p.rect(16, 28, 1, 3, cl[4]); p.set(15, 29, 0xffd8b0);
    // fallende Münze mit Spur
    for (let y = 4; y < 19; y += 3) p.rect(23, y + 6, 1, 1, 0xffe27a);
    p.rect(23, 15, 1, 1, 0xfff0b0);
    coinG(p, 23, 7, 5);
    p.sparkle(14, 8, 0xffe27a); p.sparkle(34, 12, 0xffe27a); p.sparkle(23, 18, 0xffffff);
    // Münzen auf dem Boden
    coinG(p, 7, 48, 2); coinG(p, 39, 49, 2); coinG(p, 42, 47, 2);
  },

  // Kleiner Zoll: Schlagbaum mit kleinem Zollhaus in der Morgendämmerung
  kleiner_zoll(p) {
    p.vgrad(0, 0, 46, 52, [0x3a5a98, 0x8a8ac0, 0xf0a8a0, 0xffd8a0]);
    glow(p, 24, 28, 14, 0xfff0c0, 0.9);
    p.disc(24, 29, 6, 0xfff4c8);
    p.stars(5, 0, 0, 46, 8, rng(9));
    hills(p, 28, 2, 18, 0.2, 0x5a6a9a, 0x8a8ab8);
    hills(p, 31, 2, 24, 2, 0x3a5a5a);
    p.rect(0, 34, 46, 18, 0x3a5a48); p.rect(0, 34, 46, 1, 0x6a9a68);
    p.speckle(0, 35, 46, 17, 0x4a7a50, 0.2, rng(4));
    // Weg
    p.poly([21, 34, 25, 34, 40, 52, 8, 52], P.sand[2]);
    p.poly([22, 34, 24, 34, 23, 52, 20, 52], P.sand[3]);
    // Zollhaus rechts
    p.fig((q) => {
      q.rect(31, 18, 13, 14, P.cream[2]);
      q.rect(31, 18, 3, 14, P.cream[3]); q.rect(41, 18, 3, 14, P.cream[0]);
      q.poly([29, 19, 37, 11, 46, 19], P.red[2]);
      q.poly([29, 19, 37, 11, 33, 11, 29, 19], P.red[3]);
      q.rect(40, 12, 3, 5, P.stone[1]);
    });
    p.rect(35, 22, 5, 5, 0xffd060); p.rect(37, 22, 1, 5, P.darkwood[2]); p.rect(35, 24, 5, 1, P.darkwood[2]);
    p.rect(31, 28, 13, 4, P.stone[2]);
    p.fig((q) => { q.rect(2, 20, 1, 20, P.wood[2]); q.poly([3, 20, 10, 22, 3, 25], P.blue[2]); });
    // Schlagbaum
    p.fig((q) => { q.rect(26, 31, 5, 13, P.stone[2]); q.rect(26, 31, 2, 13, P.stone[3]); });
    p.fig((q) => {
      for (let i = 0; i < 11; i++) q.rect(4 + i * 2.5, 36 - (i % 11) * 0.0, 3, 3, i % 2 ? P.white[3] : P.red[2]);
    });
    p.rect(4, 36, 27, 1, P.white[4]);
    p.rect(4, 38, 27, 1, P.red[0]);
    p.rect(3, 34, 3, 7, P.iron[2]); p.set(4, 35, P.steel[4]);
    p.rect(26, 37, 5, 2, P.iron[1]);
    p.sparkle(8, 12, 0xffe9d0); p.sparkle(18, 6, 0xffffff);
  },

  // Mautbrücke: Steinbrücke mit Mauthaus und Laterne in der Abenddämmerung
  mautbruecke(p) {
    p.vgrad(0, 0, 46, 52, [0x1a1a58, 0x5a2a78, 0xc04a68, 0xf08a50]);
    p.stars(10, 0, 0, 46, 12, rng(14));
    hills(p, 24, 2, 26, 0.4, 0x2a1a48, 0x5a3a68);
    // Wasser
    p.vgrad(0, 38, 46, 14, [0xc86a68, 0x6a3a78, 0x2a2058]);
    for (let y = 40; y < 52; y += 2) p.rect(((y * 5) % 11) + 2, y, 8, 1, 0xf0a070);
    // Brücke: Fahrbahn und Brüstung
    p.fig((q) => {
      q.rect(0, 27, 46, 4, P.stone[2]);
      q.rect(0, 27, 46, 1, P.stone[4]);
      q.rect(0, 31, 46, 9, P.stone[1]);
      q.rect(0, 31, 46, 1, P.stone[0]);
    });
    for (let x = 0; x < 46; x += 6) p.rect(x, 24, 4, 3, P.stone[2]);
    for (let x = 0; x < 46; x += 6) p.rect(x, 24, 4, 1, P.stone[4]);
    for (let x = 3; x < 46; x += 8) { p.set(x, 34, P.stone[3]); p.set(x + 3, 37, P.stone[0]); }
    // Bögen
    for (const cx of [9, 31]) {
      p.fig((q) => { q.disc(cx, 40, 8, 0x2a2058); }, null);
      p.ell(cx, 40, 8, 8, 0x4a2a68);
      p.ell(cx, 43, 6, 5, 0x8a4a70);
      for (let a = 180; a <= 360; a += 5) { const r = (a * Math.PI) / 180; p.set(cx + Math.cos(r) * 9, 40 + Math.sin(r) * 9, P.stone[3]); }
    }
    p.rect(0, 40, 46, 12, 0x2a2058);
    p.vgrad(0, 41, 46, 11, [0xc86a68, 0x6a3a78, 0x2a2058]);
    for (let y = 43; y < 52; y += 2) p.rect(((y * 5) % 11) + 2, y, 6, 1, 0xf0a070);
    for (const cx of [9, 31]) p.rect(cx - 3, 40, 7, 1, 0x4a2a68);
    p.rect(14, 31, 8, 9, P.stone[1]); p.rect(14, 31, 1, 9, P.stone[3]);
    // Mauthaus
    p.fig((q) => {
      q.rect(30, 12, 12, 13, P.wood[2]);
      q.rect(30, 12, 2, 13, P.wood[4]); q.rect(40, 12, 2, 13, P.wood[0]);
      q.poly([28, 13, 36, 5, 44, 13], P.red[1]);
      q.poly([28, 13, 36, 5, 31, 5, 28, 13], P.red[2]);
    });
    p.rect(34, 16, 5, 5, 0xffd060); p.rect(36, 16, 1, 5, P.darkwood[2]);
    p.rect(30, 22, 12, 1, P.wood[0]);
    // Laterne
    p.fig((q) => { q.rect(8, 10, 2, 15, P.iron[2]); q.rect(5, 6, 8, 5, P.iron[3]); q.rect(7, 4, 4, 2, P.iron[2]); });
    glow(p, 9, 8, 10, 0xffc050, 0.9);
    p.rect(6, 7, 6, 3, 0xffe27a); p.set(8, 8, 0xffffff);
    p.sparkle(20, 10, 0xffd890); p.sparkle(44, 3, 0xffffff);
  },

  // Flohmarkt: Marktstand mit Decke, Krimskrams und einer kleinen Lampe
  flohmarkt(p) {
    p.vgrad(0, 0, 46, 52, [0x0e1238, 0x1e2a58, 0x2a3a68]);
    p.stars(8, 0, 12, 46, 20, rng(24));
    // Markise
    for (let i = 0; i < 6; i++) {
      p.poly([i * 8, 0, i * 8 + 8, 0, i * 8 + 8, 9, i * 8 + 4, 12, i * 8, 9], i % 2 ? P.cream[3] : P.red[2]);
      p.rect(i * 8, 8, 8, 1, i % 2 ? P.cream[1] : P.red[1]);
    }
    p.rect(0, 0, 46, 2, P.darkwood[2]);
    // Hängelampe
    glow(p, 36, 18, 13, 0xf0b040, 0.9);
    p.line(36, 12, 36, 15, P.iron[2]);
    p.fig((q) => { q.rect(33, 15, 6, 6, P.iron[2]); q.rect(32, 14, 8, 2, P.iron[3]); });
    p.rect(34, 17, 4, 3, 0xffe27a); p.set(35, 18, 0xffffff);
    // Tisch mit Decke
    p.rect(0, 36, 46, 16, P.teal[1]);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 12; i++) if ((i + j) % 2 === 0) p.rect(i * 4, 38 + j * 4, 4, 4, P.teal[2]);
    p.rect(0, 36, 46, 2, P.teal[4]); p.rect(0, 38, 46, 1, P.teal[3]);
    p.rect(0, 51, 46, 1, P.teal[0]);
    // Krimskrams: Teekanne
    p.fig((q) => {
      q.shadedEll(10, 31, 6, 5, P.indigo, 0.08);
      q.rect(7, 25, 6, 2, P.indigo[3]); q.disc(10, 25, 1, P.gold[3]);
      q.poly([15, 29, 20, 26, 20, 28, 16, 32], P.indigo[2]);
      q.path([4, 28, 2, 30, 4, 33], P.indigo[2], 1);
    });
    p.rect(8, 28, 2, 1, P.indigo[4]);
    // Bücherstapel
    p.fig((q) => {
      q.rect(21, 31, 11, 5, P.crimson[2]); q.rect(22, 27, 9, 4, P.forest[2]); q.rect(21, 24, 10, 3, P.blue[2]);
    });
    p.rect(21, 31, 11, 1, P.crimson[4]); p.rect(22, 27, 9, 1, P.forest[4]); p.rect(21, 24, 10, 1, P.blue[4]);
    p.rect(30, 32, 2, 3, P.cream[3]); p.rect(29, 28, 2, 2, P.cream[3]);
    // alte Uhr
    p.fig((q) => { q.ball(41, 30, 5, P.gold, 0.08); });
    p.disc(41, 30, 3, P.cream[4]); p.set(41, 29, INK); p.set(41, 30, INK); p.set(42, 30, INK);
    p.fig((q) => { q.rect(36, 35, 11, 1, P.gold[2]); });
    p.sparkle(5, 20, 0xffd890); p.sparkle(16, 20, 0xffd890);
  },

  // Sedimente: Sanduhr, deren unteres Glas sich mit Schichten füllt
  sedimente(p) {
    p.vgrad(0, 0, 46, 52, [0x1a1030, 0x2a1a48, 0x4a2a58]);
    p.rect(0, 47, 46, 5, P.darkwood[1]); p.rect(0, 47, 46, 1, P.wood[3]);
    glow(p, 23, 24, 20, 0x6a4a98, 0.5);
    // Glas: zwei Kegel mit Hals in der Mitte
    const hwTop = (y: number) => 1 + (24.5 - y) * 0.5;
    const hwBot = (y: number) => 1 + (y - 24.5) * 0.46;
    for (let y = 9; y <= 41; y++) {
      const hw = y < 25 ? hwTop(y) : hwBot(y);
      for (let x = 23 - Math.ceil(hw) - 1; x <= 23 + Math.ceil(hw) + 1; x++) {
        const d = Math.abs(x - 23);
        if (d > hw + 1) continue;
        p.set(x, y, d > hw ? 0x8ac0d8 : 0x1c3058);
      }
    }
    // oberer Sand und fallender Strahl
    for (let y = 18; y < 25; y++) for (let x = 14; x <= 32; x++) if (Math.abs(x - 23) <= hwTop(y) - 0.5) p.set(x, y, y < 20 ? P.sand[4] : P.sand[3]);
    p.rect(23, 25, 1, 9, P.sand[4]);
    // Schichten unten, Haufen mit Spitze
    const layers = [P.copper[1], P.sand[2], P.crimson[2], P.sand[3], P.forest[2], P.sand[2], P.orange[2], P.sand[4]];
    for (let y = 41; y >= 32; y--) {
      const k = Math.floor((41 - y) / 1.3) % layers.length;
      const pile = (y - 32) * 1.15 + 0.6;
      const hw = Math.min(hwBot(y) - 0.5, pile);
      for (let x = 14; x <= 32; x++) if (Math.abs(x - 23) <= hw) p.set(x, y, layers[k]);
    }
    p.set(23, 32, P.sand[4]);
    // Glanzkanten
    p.path([14, 9, 22, 24, 15, 41], 0xe8fbff, 1);
    p.path([16, 11, 20, 19], 0xffffff, 1);
    p.rect(14, 8, 18, 1, 0xcff4ff);
    // Rahmen
    p.fig((q) => {
      q.rect(10, 4, 26, 5, P.wood[2]); q.rect(10, 4, 26, 1, P.wood[4]);
      q.rect(10, 42, 26, 5, P.wood[2]); q.rect(10, 42, 26, 1, P.wood[3]); q.rect(10, 46, 26, 1, P.wood[0]);
      q.rect(10, 8, 3, 35, P.wood[3]); q.rect(33, 8, 3, 35, P.wood[1]);
      q.rect(10, 8, 1, 35, P.wood[4]);
    });
    p.sparkle(40, 14, 0xc8a8ff); p.sparkle(6, 32, 0xc8a8ff);
  },

  // Zweitschlag: zwei Hammerschläge nacheinander, der zweite Funke ist größer
  zweitschlag(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1018, 0x5a1a1c, 0xa03a1c, 0xe0702a]);
    glow(p, 32, 34, 18, 0xffa040, 0.9);
    // Steinplatte und glühender Barren
    p.rect(0, 42, 46, 10, P.iron[0]); p.rect(0, 42, 46, 1, P.iron[2]);
    p.fig((q) => {
      q.poly([2, 41, 6, 33, 42, 33, 45, 41], P.steel[2]);
      q.poly([2, 41, 6, 33, 42, 33, 40, 35, 5, 38], P.steel[4]);
    });
    p.fig((q) => { q.poly([6, 33, 40, 33, 42, 38, 4, 38], P.orange[3]); }, null);
    p.rect(7, 33, 32, 1, 0xfff0b0); p.rect(6, 36, 34, 1, P.orange[4]);
    // erster Schlag: halbtransparenter Hammer links, kleiner Funke
    const ghost = new Pix(p.w, p.h);
    ghost.line(6, 4, 16, 14, P.wood[3], 3);
    ghost.poly([11, 14, 23, 8, 27, 16, 15, 22], P.steel[3]);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if ((x + y) % 2 === 0 && ghost.get(x, y) !== -1) p.set(x, y, ghost.get(x, y));
    p.sparkle(13, 30, 0xffc43a); p.set(10, 28, 0xffe27a); p.set(17, 28, 0xffe27a); p.set(13, 26, 0xff8a2a);
    p.text('1', 3, 22, 0xffd8a0);
    // zweiter Schlag: Hammer rechts kräftig, großer Funkenstern
    p.fig((q) => {
      q.line(44, 2, 33, 14, P.wood[3], 3);
      q.poly([26, 10, 40, 9, 40, 19, 28, 20], P.steel[2]);
      q.poly([26, 10, 40, 9, 39, 12, 27, 13], P.steel[4]);
      q.rect(28, 19, 12, 2, P.steel[1]);
    });
    p.poly(starPts(32, 30, 11, 3, 8), 0xffc43a);
    p.poly(starPts(32, 30, 7, 2.2, 8, -67), 0xffe27a);
    p.disc(32, 30, 3, 0xffffff);
    for (const [x, y] of [[18, 20], [46, 24], [20, 40], [44, 42], [36, 16]] as [number, number][]) p.sparkle(x, y, x % 2 ? 0xffc43a : 0xff8a2a);
    p.text('2', 38, 22, 0xffffff);
  },

  // Mutprobe: Schwertspitze vor einem dunklen Tor mit glühenden Augen
  mutprobe(p) {
    wall(p, 0, 52, ramp(0x3a3050), 11, 6);
    // Torbogen
    p.fig((q) => {
      q.poly([5, 52, 5, 22, 9, 12, 16, 6, 23, 4, 30, 6, 37, 12, 41, 22, 41, 52], P.stone[1]);
    }, null);
    for (let a = 180; a <= 360; a += 3) { const r = (a * Math.PI) / 180; p.rect(23 + Math.cos(r) * 19, 22 + Math.sin(r) * 17, 3, 3, P.stone[3]); }
    p.rect(4, 22, 3, 30, P.stone[3]); p.rect(40, 22, 3, 30, P.stone[0]);
    p.poly([8, 52, 8, 23, 11, 15, 17, 10, 23, 8, 29, 10, 35, 15, 38, 23, 38, 52], 0x08040e);
    // Hörner im Dunkel
    p.poly([12, 28, 9, 16, 17, 24], 0x1a0e2a); p.poly([34, 28, 37, 16, 29, 24], 0x1a0e2a);
    p.poly([17, 40, 17, 22, 29, 22, 29, 40], 0x120a1e);
    // Augen
    glow(p, 18, 29, 6, 0xc02a2a, 0.9); glow(p, 28, 29, 6, 0xc02a2a, 0.9);
    p.poly([14, 29, 22, 27, 21, 31, 15, 32], 0xff4a2a); p.poly([32, 29, 24, 27, 25, 31, 31, 32], 0xff4a2a);
    p.rect(17, 28, 3, 2, 0xffe27a); p.rect(26, 28, 3, 2, 0xffe27a);
    p.set(18, 29, 0xffffff); p.set(27, 29, 0xffffff);
    // Zähne
    for (let x = 17; x < 30; x += 3) p.poly([x, 38, x + 2, 38, x + 1, 42], 0xd8d0e8);
    // Schwertspitze von unten
    p.fig((q) => {
      q.poly([23, 8, 28, 20, 28, 52, 18, 52, 18, 20], P.steel[3]);
      q.poly([23, 8, 18, 20, 18, 52, 22, 52, 22, 14], P.steel[4]);
      q.poly([23, 8, 28, 20, 28, 52, 26, 52, 26, 22], P.steel[1]);
      q.rect(23, 12, 1, 40, P.steel[1]);
    });
    p.sparkle(23, 9, 0xffffff, true);
    // Fackeln links und rechts
    for (const x of [2, 43]) { p.rect(x, 14, 2, 8, P.darkwood[2]); flame(p, x + 1, 6, 8, false); }
    glow(p, 3, 14, 8, 0xe07a30, 0.7); glow(p, 43, 14, 8, 0xe07a30, 0.7);
    p.rect(0, 48, 46, 4, 0x1a1020); p.rect(0, 48, 46, 1, P.stone[1]);
  },

  // Federkiel: Schreibfeder im Tintenfass, Pergament
  federkiel(p) {
    p.vgrad(0, 0, 46, 52, [0xf4e8c4, 0xe8d6a0, 0xd0b878]);
    p.rect(0, 0, 46, 2, 0xb89858); p.rect(0, 0, 2, 52, 0xb89858); p.rect(44, 0, 2, 52, 0xa88848); p.rect(0, 50, 46, 2, 0x98784a);
    p.speckle(2, 2, 42, 48, 0xc8a868, 0.06, rng(3));
    // Schrift
    const ink = 0x2a3a7a;
    for (let i = 0; i < 5; i++) {
      const y = 8 + i * 5;
      for (let x = 5; x < 36 - (i % 2) * 8; x += 2) { p.set(x, y + (x % 4 === 0 ? -1 : 0), ink); if (x % 6 < 2) p.set(x, y - 2, ink); }
    }
    p.path([6, 34, 10, 31, 14, 36, 18, 31, 22, 36], ink, 1);
    // Tintenfass
    p.fig((q) => {
      q.shadedEll(13, 42, 10, 8, ramp(0x2a3a8a), 0.08);
      q.rect(9, 32, 8, 5, ramp(0x2a3a8a)[3]);
      q.ell(13, 34, 5, 2, ramp(0x2a3a8a)[4]);
    });
    p.ell(13, 34, 3, 1, 0x0e1238);
    p.set(9, 40, 0xffffff); p.set(8, 42, 0xcfe3ff); p.rect(9, 38, 1, 3, 0xffffff);
    // Klecks
    p.disc(34, 44, 2, 0x1a2468); p.set(33, 43, 0x4a5aa8); p.disc(38, 41, 1, 0x1a2468);
    // Feder
    p.fig((q) => {
      q.poly([14, 36, 30, 22, 38, 6, 43, 3, 44, 9, 40, 20, 30, 30, 18, 38], P.white[3]);
      q.poly([14, 36, 30, 22, 38, 6, 43, 3, 40, 16, 28, 26], P.white[4]);
      q.poly([14, 36, 30, 26, 40, 20, 44, 9, 40, 20, 30, 30, 18, 38], P.blue[3]);
    });
    for (let i = 0; i < 9; i++) { const t = i / 8; const x = 19 + t * 21, y = 33 - t * 27; p.line(x, y, x - 4, y + 4 + t * 1, P.blue[1]); p.line(x + 1, y - 1, x + 5, y - 2, P.white[4]); }
    p.line(14, 36, 42, 5, P.cream[2], 1);
    p.line(15, 36, 43, 6, P.sand[2], 1);
    p.line(14, 36, 11, 40, P.sand[1], 2);
    p.set(11, 40, ink);
    p.sparkle(26, 14, 0xffffff);
  },

  // Perlenschnur: Perlenkette im Bogen, Perlen glänzen
  perlenschnur(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1040, 0x4a1a58, 0x6a2a68]);
    glow(p, 23, 22, 22, 0x9a4a98, 0.6);
    // Samtkissen
    p.fig((q) => { q.shadedEll(23, 49, 26, 8, ramp(0x7a1a3a), 0.1); }, null);
    p.rect(0, 51, 46, 1, 0x3a0a1c);
    // Schnur
    const arc = arcPts(23, 6, 21, 26, 4, 176, 40);
    for (let i = 0; i + 1 < arc.length; i += 2) p.set(arc[i], arc[i + 1], 0xe8d8a8);
    const n = 13;
    for (let k = 0; k < n; k++) {
      const a = (4 + (k / (n - 1)) * 172) * Math.PI / 180;
      const x = 23 + Math.cos(a) * 21, y = 6 + Math.sin(a) * 26;
      const r = 2.8 + Math.sin((k / (n - 1)) * Math.PI) * 1.3;
      p.fig((q) => { q.ball(x, y, r, ramp(0xeee0ec), 0.05); }, 0x5a3a6a);
      p.set(x - r * 0.4, y - r * 0.4, 0xffffff);
    }
    // Anhänger
    p.fig((q) => { q.poly([23, 36, 28, 41, 23, 47, 18, 41], P.gold[2]); q.ball(23, 40, 3, P.pink, 0.05); });
    p.poly([23, 37, 26, 41, 23, 44, 20, 41], P.magenta[3]); p.poly([23, 37, 20, 41, 23, 41], P.pink[4]);
    p.set(22, 39, 0xffffff);
    p.sparkle(6, 30, 0xffe8f8); p.sparkle(40, 28, 0xffe8f8, true); p.sparkle(30, 10, 0xffffff);
  },

  // Gasthaus: Gasthaus mit Schild und warm erleuchtetem Fenster in der Nacht
  gasthaus(p) {
    sky(p, [0x080a2a, 0x1a2464, 0x3a4a88], 18, 91, 40);
    moon(p, 38, 7, 4);
    // Dach und Schornstein
    p.rect(0, 40, 46, 12, 0x3a3038); p.speckle(0, 41, 46, 11, 0x4a4048, 0.3, rng(6)); p.rect(0, 40, 46, 1, 0x6a6068);
    p.fig((q) => {
      q.rect(30, 6, 5, 9, P.stone[1]); q.rect(30, 6, 2, 9, P.stone[2]); q.rect(29, 5, 7, 2, P.stone[3]);
      q.poly([2, 18, 23, 6, 44, 18, 44, 22, 2, 22], P.darkwood[2]);
      q.poly([2, 18, 23, 6, 14, 6, 2, 18], P.darkwood[3]);
    });
    for (let y = 9; y < 21; y += 3) for (let x = 6 + (y % 2) * 2; x < 42; x += 4) if (Math.abs(x - 23) < (y - 6) * 1.5) p.set(x, y, P.darkwood[1]);
    // Rauch
    for (const [x, y] of [[32, 2], [33, 0]] as [number, number][]) { p.ell(x, y, 3, 2, 0x4a5a88); }
    // Fachwerk Haus
    p.fig((q) => { q.rect(4, 22, 38, 25, P.tan[3]); q.rect(4, 22, 3, 25, P.tan[4]); q.rect(39, 22, 3, 25, P.tan[1]); });
    for (const x of [4, 14, 31, 40]) p.rect(x, 22, 2, 25, P.darkwood[2]);
    p.rect(4, 22, 38, 2, P.darkwood[2]); p.rect(4, 33, 38, 2, P.darkwood[2]); p.rect(4, 46, 38, 2, P.darkwood[1]);
    p.line(16, 24, 30, 33, P.darkwood[2]); p.line(30, 24, 16, 33, P.darkwood[2]);
    // Fenster mit Licht
    glow(p, 9, 40, 9, 0xf0b040, 0.7);
    p.rect(7, 36, 6, 8, 0xffd060); p.rect(9, 36, 1, 8, P.darkwood[2]); p.rect(7, 39, 6, 1, P.darkwood[2]);
    p.rect(7, 36, 6, 1, 0xfff0b0);
    p.rect(34, 36, 5, 8, 0xffd060); p.rect(36, 36, 1, 8, P.darkwood[2]);
    // Tür
    p.fig((q) => { q.rect(19, 36, 10, 12, P.wood[1]); q.ell(24, 36, 5, 2, P.wood[1]); });
    p.rect(21, 37, 6, 10, 0xffc043); p.rect(23, 37, 2, 10, P.wood[0]); p.set(26, 42, P.gold[4]);
    glow(p, 24, 44, 8, 0xffc043, 0.6);
    // Schild am Ausleger
    p.fig((q) => { q.rect(40, 24, 6, 1, P.iron[2]); q.rect(41, 25, 1, 3, P.iron[1]); q.rect(35, 27, 10, 9, P.wood[2]); q.rect(35, 27, 10, 1, P.wood[4]); });
    p.rect(37, 29, 4, 5, P.gold[3]); p.rect(41, 30, 2, 3, P.gold[2]); p.rect(37, 28, 4, 1, P.white[4]);
    p.sparkle(12, 6, 0xcfe3ff); p.sparkle(26, 14, 0xffe27a);
  },

  // Sternschnuppe: Sternschnuppe mit Schweif über dunklen Hügeln
  sternschnuppe(p) {
    p.vgrad(0, 0, 46, 52, [0x060a2a, 0x141e5a, 0x2a2a78, 0x6a3a88]);
    p.stars(34, 0, 0, 46, 30, rng(101), [0xffffff, 0xcfe3ff, 0xfff2b0]);
    // Schweif: Bänder von breit nach schmal
    const trail = (w: number, c: Color) => p.poly([2, 2, 31, 21 - w, 36, 23, 32, 25 + w], c);
    trail(8, 0x4a2a88); trail(6, 0x8a3a98); trail(4, 0xd05a98); trail(2.5, 0xf0902a);
    p.poly([6, 4, 31, 22, 33, 24, 30, 24], 0xffd060);
    p.poly([14, 9, 31, 22, 32, 23, 28, 23], 0xfff4c0);
    for (let i = 0; i < 18; i++) { const t = (i / 17) * 0.9; p.set(2 + t * 30 + (i % 3) - 1, 2 + t * 21 + ((i * 5) % 7) - 3, i % 2 ? 0xffe27a : 0xf0a0d0); }
    // Kopf
    glow(p, 35, 24, 9, 0xffd890, 0.9);
    p.poly(starPts(35, 24, 9, 3, 5, -60), 0xffc43a);
    p.poly(starPts(35, 24, 6, 2.2, 5, -60), 0xffe27a);
    p.disc(35, 24, 3, 0xffffff);
    // Hügel und Hütte
    hills(p, 40, 2, 22, 0.2, 0x1a2a4a, 0x3a4a78);
    hills(p, 44, 2, 28, 2, 0x0e1a30);
    p.fig((q) => { q.rect(9, 38, 8, 6, 0x0a1224); q.poly([8, 38, 13, 33, 18, 38], 0x0a1224); }, null);
    p.rect(12, 40, 2, 2, 0xffc043);
    p.sparkle(42, 8, 0xffffff, true); p.sparkle(6, 20, 0xcfe3ff); p.sparkle(24, 10, 0xffe27a);
  },

  // Kräuterbeet: Beet mit Heilkräutern, Mörser und Stößel
  kraeuterbeet(p) {
    p.vgrad(0, 0, 46, 52, [0x3a8a88, 0x8ac8a0, 0xd8e0a0]);
    hills(p, 16, 2, 22, 1, 0x3a7a58, 0x5a9a68);
    p.rect(0, 22, 46, 4, 0x2a6a48);
    for (let x = 0; x < 46; x += 4) p.ell(x + 2, 22, 3, 2, 0x3a8a58);
    // Beet
    p.rect(0, 26, 46, 26, P.darkwood[1]);
    p.speckle(0, 26, 46, 26, P.darkwood[2], 0.25, rng(2));
    p.speckle(0, 26, 46, 26, P.darkwood[0], 0.15, rng(3));
    p.fig((q) => { q.rect(0, 26, 46, 3, P.wood[2]); }, null);
    p.rect(0, 26, 46, 1, P.wood[4]); p.rect(0, 28, 46, 1, P.wood[0]);
    // Lavendel
    for (const x of [5, 9, 13]) {
      p.line(x, 38, x, 27, P.green[2]);
      for (let j = 0; j < 5; j++) { p.set(x - 1, 22 + j * 1, P.purple[3]); p.set(x, 21 + j, P.purple[2]); p.set(x + 1, 23 + j, P.purple[4]); }
    }
    // Minzbusch
    for (const [x, y, r] of [[22, 34, 5], [18, 38, 4], [26, 38, 4]] as [number, number, number][]) p.fig((q) => { q.ball(x, y, r, P.green, 0.1); }, 0x0a3a24);
    for (const [x, y] of [[21, 32], [24, 35], [17, 37], [27, 37]] as [number, number][]) { p.set(x, y, P.lime[4]); p.set(x + 1, y + 1, P.forest[0]); }
    // Salbei und Blüten
    for (const [x, y] of [[9, 44], [13, 46], [5, 47]] as [number, number][]) p.fig((q) => { q.poly([x, y - 5, x + 3, y, x, y + 3, x - 3, y], P.teal[2]); }, 0x0a3a34);
    for (const [x, y] of [[10, 33], [31, 30]] as [number, number][]) { p.disc(x, y, 1, P.yellow[3]); p.set(x - 2, y, P.white[4]); p.set(x + 2, y, P.white[4]); p.set(x, y - 2, P.white[4]); p.set(x, y + 2, P.white[4]); }
    for (const [x, y] of [[4, 32], [15, 30]] as [number, number][]) { p.disc(x, y, 1, P.red[3]); }
    // Mörser vorn rechts
    p.fig((q) => {
      q.shadedEll(35, 42, 10, 6, P.stone, 0.1);
      q.rect(27, 38, 16, 5, P.stone[2]);
      q.poly([29, 44, 41, 44, 38, 50, 32, 50], P.stone[1]);
    });
    p.ell(35, 38, 9, 3, P.stone[1]);
    p.ell(35, 39, 7, 2, 0x3a8a48);
    p.ell(33, 38, 4, 1, P.lime[3]);
    p.set(31, 38, P.lime[4]); p.set(38, 39, P.green[1]);
    p.rect(28, 38, 1, 5, P.stone[4]);
    // Stößel
    p.fig((q) => { q.line(35, 38, 41, 20, P.wood[3], 3); q.disc(42, 18, 3, P.wood[3]); q.disc(35, 38, 2, P.stone[3]); });
    p.set(41, 17, P.wood[4]); p.set(41, 18, P.wood[4]);
    p.sparkle(44, 30, 0xf4ffd0); p.sparkle(20, 8, 0xffffff);
  },

  // Staubwolke: wirbelnde Sternenstaub Wolke mit Glitzerpunkten
  staubwolke(p) {
    p.vgrad(0, 0, 46, 52, [0x0c0a30, 0x1c1858, 0x32207a, 0x4a2a8a]);
    p.stars(26, 0, 0, 46, 38, rng(55), [0xffffff, 0xcfe3ff, 0xffd0f0]);
    glow(p, 23, 24, 20, 0x6a3ab8, 0.8);
    // Wolkenkörper aus Kugeln
    const puffs: [number, number, number][] = [[23, 24, 9], [15, 28, 7], [31, 29, 7], [20, 19, 6], [29, 19, 6], [24, 32, 6], [11, 22, 4], [36, 23, 4]];
    for (const [x, y, r] of puffs) p.ball(x, y, r, ramp(0xa874e0), 0.2);
    // Spirale aus Staub
    const rg = rng(7);
    for (let i = 0; i < 260; i++) {
      const a = i * 0.16 + rg() * 0.35, d = 5 + i * 0.075 + rg() * 3;
      const x = 23 + Math.cos(a) * d * 1.05, y = 24 + Math.sin(a) * d * 0.82;
      const c = d < 12 ? 0xffe0f8 : d < 18 ? 0xd8a8ff : d < 24 ? 0x9a7aea : 0x6a5ac8;
      p.set(x, y, c);
      if (rg() < 0.1) p.set(x + 1, y, 0xffffff);
    }
    // Kern
    p.disc(23, 24, 4, 0xe8d0ff); p.disc(23, 24, 2, 0xffffff);
    p.sparkle(8, 10, 0xffffff, true); p.sparkle(38, 12, 0xffd0f0); p.sparkle(40, 38, 0xcfe3ff, true); p.sparkle(7, 40, 0xffd0f0); p.sparkle(23, 46, 0xffffff);
    p.set(14, 44, 0xffffff); p.set(33, 46, 0xffffff); p.set(42, 24, 0xffffff);
  },

  // @@END
};
