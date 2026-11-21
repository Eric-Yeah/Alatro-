import { INK, Pix, rng, ramp, type Color, type Ramp } from './jokerPix';
import { PAL as P, flame, glow, hills, moon, starPts, wall, type Sprite } from './jokerKit';
import { coinG, suit, type SuitKind } from './jokerSpritesG';

// Motive Gruppe I: Uncommon Jokers der zweiten Welle (Echo, Passive, Sammler, Magie). Zeichenfläche 46 mal 52.

/** Würfel von vorn mit Augen, Kantenlänge s (Zahl 1 bis 6). */
function dieI(p: Pix, x: number, y: number, s: number, n: number, face: Ramp, pip: Color) {
  p.fig((q) => {
    q.rrect(x, y, s, s, face[3], 2);
    q.rect(x + 1, y + 1, s - 2, 1, face[4]);
    q.rect(x + 1, y + s - 2, s - 2, 1, face[1]);
    q.rect(x + s - 2, y + 2, 1, s - 3, face[1]);
  }, INK);
  const a = Math.round(s * 0.28), b = Math.round(s * 0.5), c = Math.round(s * 0.72);
  const spots: Record<number, [number, number][]> = {
    1: [[b, b]], 2: [[a, a], [c, c]], 3: [[a, a], [b, b], [c, c]],
    4: [[a, a], [c, a], [a, c], [c, c]], 5: [[a, a], [c, a], [b, b], [a, c], [c, c]],
    6: [[a, a], [c, a], [a, b], [c, b], [a, c], [c, c]],
  };
  for (const [px, py] of spots[n]) p.rect(x + px - 1, y + py - 1, 2, 2, pip);
}

/** Eule von vorn, Mitte (x, y der Brust), Breite w. */
function owl(p: Pix, x: number, y: number, rp: Ramp, belly: Color, eye: Color) {
  p.fig((q) => {
    q.shadedEll(x, y - 6, 5, 8, rp, 0.1);
    q.poly([x - 5, y - 11, x - 4, y - 16, x - 1, y - 12], rp[2]);
    q.poly([x + 5, y - 11, x + 4, y - 16, x + 1, y - 12], rp[1]);
    q.ell(x, y - 5, 3, 5, belly);
    q.rect(x - 4, y + 1, 3, 2, P.orange[2]); q.rect(x + 1, y + 1, 3, 2, P.orange[2]);
  });
  for (const dx of [-2, 2]) { p.disc(x + dx, y - 10, 2, eye); p.set(x + dx, y - 10, INK); p.set(x + dx - 1, y - 11, 0xffffff); }
  p.poly([x - 1, y - 8, x + 1, y - 8, x, y - 6], P.orange[3]);
  for (let j = 0; j < 3; j++) { p.set(x - 1, y - 4 + j * 2, rp[1]); p.set(x + 1, y - 3 + j * 2, rp[1]); }
  p.line(x - 5, y - 8, x - 6, y - 2, rp[1]); p.line(x + 5, y - 8, x + 6, y - 2, rp[0]);
}

/** Laterne mit farbigem Glas, Oberkante bei (cx, top). */
function lantern(p: Pix, cx: number, top: number, glass: Ramp) {
  glow(p, cx, top + 9, 9, glass[3], 0.9);
  p.fig((q) => {
    q.poly([cx - 5, top + 5, cx - 2, top + 1, cx + 2, top + 1, cx + 5, top + 5], P.iron[2]);
    q.rect(cx - 5, top + 5, 11, 12, glass[2]);
    q.rect(cx - 5, top + 5, 2, 12, glass[3]); q.rect(cx + 4, top + 5, 2, 12, glass[1]);
    q.rect(cx - 6, top + 17, 13, 2, P.iron[2]);
    q.rect(cx - 1, top - 2, 3, 3, P.iron[3]);
  });
  p.rect(cx - 2, top + 8, 5, 7, glass[4]); p.rect(cx - 1, top + 9, 3, 4, 0xffffff);
  p.rect(cx - 5, top + 5, 1, 12, glass[4]);
  p.rect(cx, top + 5, 1, 12, P.iron[1]);
}

export const SPRITES_I: Record<string, Sprite> = {
  // Sternenpfad: Pfad aus Trittsteinen mit Stern Markierungen
  sternenpfad(p) {
    p.vgrad(0, 0, 46, 52, [0x0a0e34, 0x1c2a6a, 0x3a3a8a, 0x5a3a88]);
    p.stars(26, 0, 0, 46, 22, rng(33), [0xffffff, 0xcfe3ff, 0xfff2b0]);
    glow(p, 33, 10, 12, 0xffe27a, 0.7);
    p.poly(starPts(33, 10, 6, 2.4, 5), 0xffe27a); p.disc(33, 10, 2, 0xffffff);
    hills(p, 20, 2, 24, 0.5, 0x1e2a5a, 0x3a4a88);
    p.rect(0, 24, 46, 28, 0x16284a);
    p.speckle(0, 24, 46, 28, 0x24446a, 0.2, rng(4));
    p.rect(0, 24, 46, 1, 0x3a6a8a);
    // Trittsteine im Zickzack, nach hinten kleiner
    const stones: [number, number, number][] = [[15, 46, 11], [31, 40, 9], [15, 33, 7], [29, 28, 5.5], [19, 24.5, 4], [28, 22, 3]];
    stones.forEach(([x, y, rx], i) => {
      const ry = Math.max(2, rx * 0.5);
      p.fig((q) => { q.shadedEll(x, y, rx, ry, P.stone, 0.1); q.rect(x - rx, y, rx * 2 + 1, 2, P.stone[1]); });
      const sr = rx * 0.5;
      p.poly(starPts(x, y - 0.5, sr + 1, (sr + 1) * 0.42, 5), P.slate[0]);
      p.poly(starPts(x, y - 1, sr + 1, (sr + 1) * 0.42, 5), i % 2 ? 0x7ae0ff : 0xffe27a);
      if (rx > 4) p.set(x - rx * 0.5, y - ry * 0.5, P.stone[4]);
      glow(p, x, y - 1, rx + 2, i % 2 ? 0x4a9ad0 : 0xd0a040, 0.35);
    });
    p.sparkle(6, 20, 0xffffff); p.sparkle(41, 32, 0xcfe3ff); p.sparkle(8, 30, 0xfff2b0);
  },

  // Zwillingspaar: zwei Pärchen Eulen auf einem Ast
  zwillingspaar(p) {
    p.vgrad(0, 0, 46, 52, [0x0c1238, 0x1c2a68, 0x3a4a98]);
    p.stars(16, 0, 0, 46, 14, rng(81));
    moon(p, 23, 9, 7);
    glow(p, 23, 9, 14, 0x8a9ae0, 0.6);
    // Ast
    p.fig((q) => {
      q.poly([0, 33, 46, 31, 46, 37, 0, 39], P.darkwood[2]);
      q.poly([0, 33, 46, 31, 46, 33, 0, 35], P.darkwood[3]);
      q.poly([36, 36, 42, 44, 40, 45, 34, 38], P.darkwood[2]);
    });
    p.speckle(0, 33, 46, 5, P.darkwood[0], 0.2, rng(2));
    for (const [x, y] of [[3, 30], [43, 28], [1, 38], [44, 40]] as [number, number][]) p.fig((q) => { q.shadedEll(x, y, 4, 2, P.forest, 0.1); }, 0x0a2a1c);
    // vier Eulen, zwei Pärchen
    owl(p, 8, 34, P.tan, P.cream[3], P.yellow[3]);
    owl(p, 18, 34, ramp(0xa87850), P.cream[2], P.yellow[3]);
    owl(p, 29, 34, P.slate, P.snow[3], P.orange[3]);
    owl(p, 39, 34, ramp(0x7a6aa0), P.snow[2], P.orange[3]);
    // Herzchen zwischen den Pärchen
    p.set(13, 14, P.pink[3]); p.set(15, 14, P.pink[3]); p.rect(13, 15, 3, 1, P.pink[3]); p.set(14, 16, P.pink[3]);
    p.set(34, 14, P.cyan[3]); p.set(36, 14, P.cyan[3]); p.rect(34, 15, 3, 1, P.cyan[3]); p.set(35, 16, P.cyan[3]);
    p.sparkle(5, 8, 0xffffff); p.sparkle(41, 8, 0xffffff);
    p.rect(0, 46, 46, 6, 0x0a1230);
  },

  // Viererkette: vier goldene Kettenglieder, leuchtend
  viererkette(p) {
    p.rays(23, 24, 8, 0x2a1050, 0x3a1860, 0.2);
    p.vgrad(0, 40, 46, 12, [0x2a1050, 0x12082a]);
    glow(p, 23, 24, 22, 0xd08a30, 0.7);
    glow(p, 23, 24, 14, 0xffd060, 0.8);
    const face = (y: number) => {
      p.fig((q) => { q.ellRing(23, y, 9, 7, P.gold[2], 3); });
      p.ellRing(23, y, 8, 6, P.gold[3], 1);
      p.set(15, y - 3, P.gold[4]); p.set(16, y - 4, P.gold[4]); p.set(18, y - 6, P.gold[4]); p.set(14, y - 1, P.gold[4]);
      p.rect(29, y + 3, 2, 2, P.gold[0]); p.set(27, y + 5, P.gold[0]);
    };
    const side = (y: number) => {
      p.fig((q) => { q.ell(23, y, 3.5, 8, P.gold[2]); });
      p.rect(21, y - 7, 1, 14, P.gold[4]); p.rect(22, y - 6, 1, 12, P.gold[3]); p.rect(25, y - 6, 1, 12, P.gold[0]);
      p.rect(23, y - 3, 1, 7, P.gold[1]);
    };
    face(8); face(30);
    side(19); side(41);
    // Überlappung: Glieder greifen ineinander
    for (const [x, y] of [[8, 10], [38, 14], [6, 34], [40, 38], [10, 44], [36, 4]] as [number, number][]) p.sparkle(x, y, 0xffe27a);
    p.sparkle(23, 24, 0xffffff, true);
  },

  // Duo: zwei Gestalten mit Lauten, Rücken an Rücken
  duo(p) {
    p.vgrad(0, 0, 46, 52, [0x1a1a58, 0x4a2a78, 0x9a3a78, 0xe0705a]);
    p.stars(12, 0, 0, 46, 14, rng(19));
    hills(p, 42, 2, 20, 0.5, 0x2a1a48);
    p.rect(0, 46, 46, 6, 0x1a1030);
    const minstrel = (cx: number, dir: number, cloak: Ramp, hat: Ramp) => {
      p.fig((q) => {
        // Umhang
        q.poly([cx - 7, 50, cx - 5, 28, cx, 24, cx + 5, 28, cx + 7, 50], cloak[2]);
        q.poly([cx - 7, 50, cx - 5, 28, cx, 24, cx - 2, 50], cloak[3]);
        q.disc(cx + dir * 1, 19, 4, P.skin[3]);
        // Hut mit Feder
        q.poly([cx - 5, 18, cx - 3, 12, cx + 4, 12, cx + 6, 18], hat[2]);
        q.poly([cx - 7, 18, cx + 8, 18, cx + 6, 16, cx - 5, 16], hat[3]);
        q.line(cx + 4, 12, cx + dir * 8 + 4, 6, P.yellow[3], 1);
      });
      p.rect(cx + dir * 3, 19, 1, 1, INK);
      p.rect(cx + dir * 4, 21, 2, 1, P.skin[1]);
    };
    minstrel(17, -1, P.teal, P.red);
    minstrel(29, 1, P.crimson, P.forest);
    // Lauten
    const lute = (x: number, y: number, dir: number, rp: Ramp) => {
      p.fig((q) => {
        q.shadedEll(x, y, 6, 8, rp, 0.1);
        q.line(x + dir * 4, y - 5, x + dir * 15, y - 17, P.darkwood[3], 2);
        q.rect(x + dir * 15 - 1, y - 20, 3, 4, P.darkwood[2]);
      });
      p.disc(x, y, 2, INK);
      p.line(x, y + 3, x + dir * 12, y - 14, P.cream[3], 1);
    };
    lute(9, 38, -1, P.wood);
    lute(37, 38, 1, ramp(0xc87a3a));
    // Arme zur Laute
    p.fig((q) => { q.line(14, 32, 11, 36, P.skin[2], 2); q.line(32, 32, 35, 36, P.skin[2], 2); });
    // Noten
    for (const [x, y] of [[4, 18], [41, 14], [10, 8], [36, 6]] as [number, number][]) {
      p.fig((q) => { q.disc(x, y, 1.5, 0xfff0b0); q.rect(x + 1, y - 6, 1, 6, 0xfff0b0); q.rect(x + 2, y - 6, 2, 1, 0xfff0b0); }, 0x2a1a38);
    }
    p.rect(22, 30, 2, 20, P.iron[0]);
  },

  // Bettelmann: Bettler mit Schale unter dem Mond, eine einzelne Münze
  bettelmann(p) {
    p.vgrad(0, 0, 46, 52, [0x0a1038, 0x1a2a68, 0x3a4a88]);
    p.stars(22, 0, 0, 46, 24, rng(44));
    glow(p, 12, 12, 16, 0x8a9ae0, 0.6);
    moon(p, 12, 12, 8);
    // Mauer
    p.rect(0, 28, 46, 24, 0x2a2a48);
    for (let y = 28; y < 46; y += 6) { p.rect(0, y, 46, 1, 0x1a1a32); for (let x = (y / 6) % 2 ? 0 : 5; x < 46; x += 10) p.rect(x, y + 1, 1, 5, 0x1a1a32); }
    p.rect(0, 28, 46, 1, 0x4a4a78);
    p.rect(0, 46, 46, 6, 0x3a3a52); p.rect(0, 46, 46, 1, 0x6a6a8a);
    // Bettler im Lumpenmantel, sitzend, nach links gewandt
    p.fig((q) => {
      q.poly([22, 50, 24, 38, 30, 31, 38, 31, 42, 40, 44, 50], P.tan[0]);
      q.poly([22, 50, 24, 38, 30, 31, 34, 31, 30, 50], ramp(0x6a5a50)[2]);
      q.disc(33, 27, 6, ramp(0x6a5a50)[2]);
      q.disc(31, 28, 4, P.skin[2]);
      q.poly([27, 25, 33, 18, 40, 25, 39, 30, 36, 24], ramp(0x6a5a50)[1]);
      q.line(26, 40, 17, 43, P.skin[2], 3);
    });
    p.set(30, 27, INK); p.set(29, 31, P.white[3]); p.set(30, 32, P.white[3]);
    // Flicken
    p.rect(35, 40, 4, 3, P.red[1]); p.rect(28, 45, 4, 3, P.blue[1]); p.rect(37, 46, 3, 2, P.green[1]);
    // Schale mit einer Münze
    p.fig((q) => { q.poly([10, 40, 22, 40, 20, 46, 12, 46], P.copper[2]); q.ell(16, 40, 6, 2, P.copper[3]); });
    p.ell(16, 40, 4, 1, 0x3a1a0a);
    coinG(p, 16, 38, 2);
    glow(p, 16, 38, 6, 0xffd060, 0.8);
    p.sparkle(16, 33, 0xffe27a, true);
    p.rect(11, 41, 1, 4, P.copper[4]);
  },

  // Herzecho: Herz mit konzentrischen Echo Ringen
  herzecho(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0820, 0x3a0e30, 0x5a1438, 0x6a1a38]);
    // Echo Herzen von außen nach innen
    const echoes: [number, Color][] = [[19, 0x3a0e30], [16, 0x4a1238], [13.5, 0x5a1640], [11.5, 0x6a1a48]];
    echoes.forEach(([s, c], i) => {
      suit(p, 'heart', 23, 24, s, [c, c, c, c, c], null);
      suit(p, 'heart', 23, 24, s - 1.3, [0x240a28, 0x240a28, i % 2 ? 0x4a1238 : 0x3a0e30, 0x240a28, 0x240a28], null);
    });
    for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; p.set(23 + Math.cos(t) * 21, 24 + Math.sin(t) * 21, 0x8a2a4a); }
    glow(p, 23, 24, 12, 0xf04a68, 0.7);
    suit(p, 'heart', 23, 24, 8.5, P.red, 0x3a0a20);
    p.poly([15, 21, 18, 17, 22, 19, 20, 23], P.red[4]);
    p.rect(17, 19, 2, 2, 0xffffff);
    for (const [x, y] of [[5, 7], [41, 9], [4, 44], [42, 42], [23, 46]] as [number, number][]) p.sparkle(x, y, 0xffa0b8);
    // Schallpunkte
    for (const [x, y] of [[9, 24], [37, 24], [23, 5], [12, 12], [34, 12]] as [number, number][]) p.set(x, y, 0xff6a88);
  },

  // Nachtecho: Pik mit Echo Ringen im Nachthimmel
  nachtecho(p) {
    p.vgrad(0, 0, 46, 52, [0x040618, 0x0c1240, 0x1c2a6a, 0x2a3a88]);
    p.stars(30, 0, 0, 46, 52, rng(23), [0xffffff, 0xcfe3ff]);
    for (const [r, c] of [[22, 0x2a3a88], [18, 0x3a4aa0], [14, 0x4a5ab8]] as [number, Color][]) {
      p.ring(23, 25, r, c, 1);
      for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; p.set(23 + Math.cos(t) * (r + 2), 25 + Math.sin(t) * (r + 2), 0x6a7ad8); }
    }
    glow(p, 23, 25, 13, 0x4a6ae8, 0.7);
    p.disc(23, 25, 10, 0x0c1240);
    suit(p, 'spade', 23, 24, 8.5, P.indigo, 0xb8c8ff);
    p.poly([16, 20, 20, 14, 23, 16, 18, 22], P.indigo[4]);
    p.rect(18, 18, 2, 2, 0xffffff);
    p.sparkle(6, 8, 0xffffff, true); p.sparkle(40, 44, 0xffffff); p.sparkle(41, 10, 0xcfe3ff); p.sparkle(5, 42, 0xcfe3ff);
    // Mondsichel am Rand
    p.disc(40, 6, 4, 0xe8e4c8); p.disc(42, 5, 3.5, 0x0c1240);
  },

  // Glückszahl: große 7 zwischen Sternen und Würfeln
  glueckszahl(p) {
    p.vgrad(0, 0, 46, 52, [0x0a3a3a, 0x146a50, 0x1a8a58]);
    p.rays(23, 24, 10, 0x146a50, 0x1a7a58, 0.1);
    p.vgrad(0, 40, 46, 12, [0x146a50, 0x0a3a3a]);
    glow(p, 23, 22, 18, 0xffe27a, 0.6);
    // große Sieben aus gewinkelten Balken
    p.fig((q) => {
      q.poly([9, 7, 37, 7, 37, 14, 29, 14, 22, 40, 14, 40, 22, 14, 9, 14], P.gold[2]);
    });
    p.poly([9, 7, 37, 7, 37, 9, 9, 9], P.gold[4]);
    p.poly([9, 9, 12, 9, 12, 14, 9, 14], P.gold[3]);
    p.poly([22, 14, 25, 14, 17, 40, 14, 40], P.gold[3]);
    p.poly([27, 14, 29, 14, 22, 40, 20, 40], P.gold[1]);
    p.rect(35, 9, 2, 5, P.gold[1]);
    p.rect(14, 38, 8, 2, P.gold[0]);
    // Würfel
    dieI(p, 3, 34, 9, 6, P.white, 0x1a1a3a);
    dieI(p, 35, 30, 9, 3, P.red, 0xffffff);
    dieI(p, 31, 40, 6, 1, P.white, 0xd8382f);
    // Sterne
    for (const [x, y, r] of [[5, 8, 3], [41, 21, 3], [38, 3, 2], [8, 24, 2], [27, 46, 2]] as [number, number, number][]) p.poly(starPts(x, y, r + 1, (r + 1) * 0.42, 5), 0xfff0a0);
    p.sparkle(20, 44, 0xffffff); p.sparkle(14, 3, 0xffffff);
  },

  // Kreidestriche: Tafel mit Kreidestrichen in Fünferbündeln und einer Krone
  kreidestriche(p) {
    p.vgrad(0, 0, 46, 52, [0x3a2a1a, 0x4a3420, 0x3a2418]);
    for (let x = 0; x < 46; x += 9) p.rect(x, 0, 1, 52, 0x2a1a10);
    // Rahmen und grüne Tafel
    p.fig((q) => {
      q.rect(2, 2, 42, 42, P.wood[2]);
      q.rect(2, 2, 42, 2, P.wood[4]); q.rect(2, 2, 2, 42, P.wood[3]);
      q.rect(2, 42, 42, 2, P.wood[0]); q.rect(42, 2, 2, 42, P.wood[0]);
    });
    p.vgrad(4, 4, 38, 38, [0x1e5a44, 0x246a4c, 0x1a4a3a]);
    p.speckle(4, 4, 38, 38, 0x3a8a68, 0.07, rng(4));
    // Krone oben
    const ch = 0xf4f0e0;
    p.path([16, 14, 16, 8, 20, 11, 23, 6, 26, 11, 30, 8, 30, 14, 16, 14], ch, 1);
    p.set(16, 7, ch); p.set(23, 5, ch); p.set(30, 7, ch);
    // Strichbündel
    const bundle = (x: number, y: number, n: number) => {
      for (let i = 0; i < Math.min(n, 4); i++) { p.line(x + i * 3, y, x + i * 3, y + 9, ch); p.set(x + i * 3 + 1, y + 2, 0xb8c8b8); }
      if (n >= 5) p.line(x - 2, y + 8, x + 11, y + 1, ch);
    };
    bundle(8, 19, 5); bundle(24, 19, 5); bundle(8, 32, 5); bundle(24, 32, 3);
    // Staub und Kreide
    p.speckle(6, 38, 30, 3, 0xd8e4d8, 0.12, rng(7));
    p.rect(0, 44, 46, 8, P.darkwood[1]); p.rect(0, 44, 46, 1, P.wood[3]);
    p.fig((q) => { q.rect(30, 45, 8, 3, ch); });
    p.rect(30, 45, 8, 1, 0xffffff);
    p.sparkle(41, 12, 0xd8f8e8);
  },

  // Verzauberer: Zauberer mit Stab, eine funkelnde Karte schwebt
  verzauberer(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0e48, 0x3a2a88, 0x6a4aa8]);
    p.stars(18, 0, 0, 46, 30, rng(66), [0xffffff, 0xe8d0ff, 0xfff2b0]);
    p.rect(0, 46, 46, 6, 0x1a1040); p.rect(0, 46, 46, 1, 0x4a3a88);
    // schwebende Karte
    glow(p, 34, 15, 14, 0xc8a0ff, 0.8);
    p.fig((q) => { q.rrect(27, 4, 14, 20, P.cream[4], 2); });
    p.rect(28, 5, 12, 18, P.cream[3]);
    p.frame(28, 5, 12, 18, P.purple[2]);
    p.poly(starPts(34, 14, 5, 2, 5), P.gold[3]); p.disc(34, 14, 1, 0xffffff);
    p.set(29, 6, P.magenta[3]); p.set(39, 22, P.magenta[3]);
    // Zauberer
    p.fig((q) => {
      q.poly([6, 50, 9, 32, 14, 24, 22, 24, 27, 32, 30, 50], P.indigo[2]);
      q.poly([6, 50, 9, 32, 14, 24, 17, 24, 14, 50], P.indigo[3]);
      q.disc(18, 22, 4, P.skin[3]);
      q.poly([14, 22, 18, 41, 23, 22, 20, 26, 16, 26], P.white[4]);
      q.poly([11, 20, 17, 4, 26, 20], P.indigo[1]);
      q.poly([11, 20, 17, 4, 17, 20], P.indigo[2]);
      q.rect(9, 19, 18, 3, P.indigo[2]);
      q.line(26, 31, 33, 25, P.indigo[3], 2);
    });
    p.rect(11, 19, 14, 1, P.indigo[4]);
    p.set(16, 21, 0xffffff); p.set(20, 21, 0xffffff);
    p.set(15, 12, 0xffe27a); p.set(19, 9, 0xffe27a); p.set(20, 15, 0xffe27a);
    p.rect(16, 23, 4, 1, P.skin[1]);
    // Stab mit leuchtendem Stein
    p.fig((q) => { q.rect(36, 30, 2, 20, P.wood[3]); q.disc(37, 28, 3, P.cyan[3]); });
    p.set(36, 27, 0xffffff);
    glow(p, 37, 28, 7, 0x7ae0ff, 0.9);
    // Funkenspur zur Karte
    for (const [x, y] of [[31, 26], [32, 24], [30, 22], [33, 21], [29, 25]] as [number, number][]) p.set(x, y, 0xffe27a);
    p.sparkle(44, 36, 0xe8d0ff); p.sparkle(5, 14, 0xe8d0ff);
  },

  // Siegelwart: Siegelring und rotes Wachssiegel mit Stern
  siegelwart(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1a14, 0x3a2418, 0x4a2c1c]);
    glow(p, 6, 8, 12, 0xd08030, 0.6);
    flame(p, 6, 2, 7, false);
    p.fig((q) => { q.rect(4, 9, 5, 8, P.cream[3]); q.rect(3, 16, 7, 2, P.gold[3]); });
    // Pergament mit Rand
    p.poly([0, 28, 46, 24, 46, 52, 0, 52], P.cream[2]);
    p.poly([0, 28, 46, 24, 46, 26, 0, 30], P.cream[3]);
    for (let i = 0; i < 4; i++) p.rect(3 + (i % 2) * 2, 38 + i * 3, 22 - i * 2, 1, 0x6a4a28);
    // Wachssiegel
    p.fig((q) => {
      q.poly([14, 22, 20, 17, 28, 17, 34, 22, 36, 30, 33, 38, 25, 40, 17, 38, 12, 31], P.red[2]);
      q.poly([14, 22, 20, 17, 24, 17, 22, 30, 12, 31], P.red[3]);
      q.poly([34, 22, 36, 30, 33, 38, 28, 36, 30, 24], P.red[1]);
      q.poly([24, 38, 26, 44, 29, 44, 28, 38], P.red[2]);
    });
    p.ring(24, 28, 8, P.red[1], 1);
    p.ring(24, 29, 8, P.red[4], 1);
    p.poly(starPts(24, 28.5, 6, 2.4, 5), P.red[0]);
    p.poly(starPts(24, 28, 6, 2.4, 5), P.red[3]);
    p.set(18, 20, P.red[4]); p.set(19, 19, P.red[4]);
    // Siegelring darüber
    p.fig((q) => { q.ellRing(36, 14, 6, 7, P.gold[2], 3); q.rect(32, 6, 9, 4, P.gold[3]); });
    p.ellRing(36, 14, 5, 6, P.gold[3], 1);
    p.set(31, 12, P.gold[4]); p.set(32, 9, P.gold[4]);
    p.rect(33, 7, 7, 2, P.gold[4]);
    p.poly(starPts(36.5, 7.5, 2, 0.8, 5), P.red[2]);
    p.sparkle(41, 24, 0xffe27a); p.sparkle(10, 24, 0xffd8b0);
  },

  // Zehntner: Steuereintreiber mit Schriftrolle und Waage
  zehntner(p) {
    p.vgrad(0, 0, 46, 52, [0x2a3a5a, 0x4a5a78, 0x8a8aa0]);
    p.rect(0, 44, 46, 8, P.stone[0]); p.rect(0, 44, 46, 1, P.stone[2]);
    // Waage rechts an einer Stange
    p.fig((q) => { q.rect(33, 8, 2, 36, P.iron[2]); q.rect(22, 8, 22, 2, P.gold[2]); q.disc(34, 7, 2, P.gold[3]); });
    for (const [x, y] of [[24, 22], [42, 18]] as [number, number][]) {
      p.line(x, 10, x - 3, y, P.gold[1]); p.line(x, 10, x + 3, y, P.gold[1]);
      p.fig((q) => { q.ell(x, y + 1, 5, 2, P.gold[3]); });
    }
    coinG(p, 23, 20, 2); coinG(p, 26, 21, 2);
    // Steuereintreiber mit dickem Bauch
    p.fig((q) => {
      q.poly([4, 50, 6, 30, 11, 24, 20, 24, 25, 30, 27, 50], P.crimson[2]);
      q.poly([4, 50, 6, 30, 11, 24, 14, 24, 11, 50], P.crimson[3]);
      q.shadedEll(15, 38, 8, 9, P.crimson, 0.1);
      q.disc(15, 19, 5, P.skin[3]);
      q.rect(9, 12, 13, 3, P.darkwood[2]); q.rect(11, 6, 9, 7, P.darkwood[3]);
    });
    p.rect(11, 6, 9, 1, P.darkwood[4]); p.rect(9, 12, 13, 1, P.darkwood[4]);
    p.set(13, 19, INK); p.set(17, 19, INK); p.rect(13, 22, 4, 1, P.skin[1]);
    for (let y = 30; y < 44; y += 4) p.rect(14, y, 2, 2, P.gold[3]);
    // Schriftrolle in der Hand
    p.fig((q) => { q.rect(18, 29, 14, 5, P.cream[3]); q.rect(16, 28, 3, 7, P.cream[2]); q.rect(30, 28, 3, 7, P.cream[1]); });
    p.rect(19, 30, 10, 1, 0x6a4a28); p.rect(19, 32, 8, 1, 0x6a4a28);
    p.rect(18, 29, 14, 1, P.cream[4]);
    p.line(20, 34, 24, 30, P.skin[2], 1);
    p.sparkle(44, 34, 0xffe27a); p.sparkle(6, 6, 0xffffff);
  },

  // Glücksspieler: Würfelbecher mit fliegenden Würfeln und Karten
  gluecksspieler(p) {
    p.vgrad(0, 0, 46, 52, [0x3a0e2a, 0x6a1a3a, 0xa02a3a]);
    p.rays(23, 40, 10, 0x6a1a3a, 0x781e42, 0.2);
    p.vgrad(0, 0, 46, 12, [0x2a0a22, 0x5a1634]);
    p.rect(0, 46, 46, 6, 0x1a6a3a); p.speckle(0, 46, 46, 6, 0x2a8a4a, 0.3, rng(2)); p.rect(0, 46, 46, 1, 0x4aba6a);
    // zwei Karten, schräg gestaffelt
    const card = (x: number, y: number, kind: SuitKind, c: Color) => {
      p.fig((q) => { q.rrect(x, y, 13, 18, 0xf4f0e8, 2); }, INK);
      p.rect(x + 1, y + 1, 11, 16, 0xf4f0e8);
      p.rect(x + 1, y + 16, 11, 1, 0xc8c0b0); p.rect(x + 12, y + 3, 1, 14, 0xc8c0b0);
      suit(p, kind, x + 6.5, y + 9, 3.6, [c, c, c, c, c], null);
      p.set(x + 2, y + 2, c); p.set(x + 3, y + 2, c); p.set(x + 10, y + 15, c); p.set(x + 9, y + 15, c);
    };
    card(3, 3, 'heart', 0xd8382f);
    card(30, 5, 'spade', 0x2a3a78);
    // Würfel in der Luft
    dieI(p, 18, 4, 10, 5, P.white, 0x1a1a3a);
    dieI(p, 36, 27, 8, 6, P.yellow, 0x3a1a0a);
    dieI(p, 4, 27, 8, 3, P.white, 0xd8382f);
    // Becher, nach rechts gekippt
    const rot = (pts: number[], ang: number, cx: number, cy: number) => {
      const c = Math.cos(ang), s2 = Math.sin(ang), out: number[] = [];
      for (let i = 0; i < pts.length; i += 2) { const dx = pts[i] - cx, dy = pts[i + 1] - cy; out.push(cx + dx * c - dy * s2, cy + dx * s2 + dy * c); }
      return out;
    };
    const A = 0.45, cx0 = 22, cy0 = 40;
    p.fig((q) => {
      q.poly(rot([cx0 - 9, cy0 - 10, cx0 + 9, cy0 - 10, cx0 + 6, cy0 + 12, cx0 - 6, cy0 + 12], A, cx0, cy0), P.tan[2]);
      q.poly(rot([cx0 - 9, cy0 - 10, cx0 - 4, cy0 - 10, cx0 - 2, cy0 + 12, cx0 - 6, cy0 + 12], A, cx0, cy0), P.tan[3]);
      q.poly(rot([cx0 + 5, cy0 - 10, cx0 + 9, cy0 - 10, cx0 + 6, cy0 + 12, cx0 + 3, cy0 + 12], A, cx0, cy0), P.tan[1]);
    });
    const rim: number[] = [];
    for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; rim.push(cx0 + Math.cos(t) * 9, cy0 - 10 + Math.sin(t) * 3); }
    p.poly(rot(rim, A, cx0, cy0), 0x1a0c08);
    const rimLine = rot([cx0 - 9, cy0 - 10, cx0 + 9, cy0 - 10], A, cx0, cy0);
    p.line(rimLine[0], rimLine[1] - 1, rimLine[2], rimLine[3] - 1, P.tan[4]);
    for (const dy of [-5, 5]) { const l = rot([cx0 - 8, cy0 + dy, cx0 + 8, cy0 + dy], A, cx0, cy0); p.line(l[0], l[1], l[2], l[3], P.gold[3]); }
    p.sparkle(14, 22, 0xffe27a); p.sparkle(44, 18, 0xffe27a); p.sparkle(26, 24, 0xffffff);
    p.set(8, 22, 0xffe27a); p.set(40, 24, 0xffe27a);
  },

  // Vierlicht: vier Laternen in vier Farben
  vierlicht(p) {
    p.vgrad(0, 0, 46, 52, [0x060a22, 0x121a4a, 0x2a2a68]);
    p.stars(18, 0, 0, 46, 14, rng(77));
    // Balken
    p.fig((q) => { q.rect(0, 2, 46, 4, P.darkwood[2]); q.rect(0, 2, 46, 1, P.darkwood[4]); q.rect(0, 5, 46, 1, P.darkwood[0]); });
    const cols: [number, Ramp, SuitKind, number][] = [
      [6, ramp(0x5a6ad8), 'spade', 8], [17, P.red, 'heart', 14], [28, P.orange, 'diamond', 8], [39, P.green, 'club', 14],
    ];
    for (const [cx, rp, kind, top] of cols) {
      p.line(cx, 6, cx, top - 1, P.iron[3]);
      lantern(p, cx, top, rp);
      suit(p, kind, cx, top + 11, 1.7, [P.iron[0], P.iron[0], P.iron[0], P.iron[0], P.iron[0]], null);
    }
    // Lichtkegel nach unten
    for (const [cx, , , top] of cols) for (let j = 0; j < 14; j++) { const y = top + 22 + j * 2; if (y < 48) p.set(cx + (j % 2 ? -1 : 1) * (1 + (j >> 1)), y, 0x4a5a98); }
    p.rect(0, 47, 46, 5, 0x0a0e2a); p.rect(0, 47, 46, 1, 0x2a3a78);
    p.sparkle(11, 38, 0xcfe3ff); p.sparkle(34, 36, 0xcfe3ff); p.sparkle(22, 44, 0xffffff);
  },

  // Gezeitenkalender: Kalender mit Mondphasen und Wellenlinie
  gezeitenkalender(p) {
    p.vgrad(0, 0, 46, 52, [0x0e2a3a, 0x16405a, 0x1e5a6a]);
    // Blatt
    p.fig((q) => { q.rect(4, 4, 38, 42, P.cream[3]); q.rect(4, 4, 38, 2, P.cream[4]); q.rect(4, 44, 38, 2, P.cream[1]); q.rect(40, 4, 2, 42, P.cream[1]); });
    p.rect(5, 6, 36, 9, P.navy[2]); p.rect(5, 6, 36, 1, P.navy[3]); p.rect(5, 14, 36, 1, P.navy[0]);
    // Ringe zum Aufhängen
    for (const x of [11, 23, 35]) { p.fig((q) => { q.rect(x - 1, 1, 3, 7, P.iron[3]); }); p.rect(x, 2, 1, 5, P.steel[4]); }
    // Mondphasen in der Kopfzeile
    const phases = [0, 1, 2, 3, 4];
    phases.forEach((k, i) => {
      const x = 9 + i * 7, y = 10;
      p.disc(x, y, 3, 0x3a4a88);
      for (let yy = y - 3; yy <= y + 3; yy++) for (let xx = x - 3; xx <= x + 3; xx++) {
        if (Math.hypot(xx - x, yy - y) > 3.3) continue;
        const cut = [-9, -2, 0, 2, 9][k];
        const lit = k === 2 ? true : k < 2 ? xx - x > cut * 0.35 - 0.6 : xx - x < cut * 0.35 + 0.6;
        if (k === 0 ? false : lit) p.set(xx, yy, 0xf4eec8);
      }
    });
    // Tage
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) { p.rect(7 + i * 5, 17 + j * 5, 4, 4, P.cream[2]); p.set(8 + i * 5, 18 + j * 5, P.cream[1]); p.set(9 + i * 5, 19 + j * 5, P.cream[1]); }
    // Mondtage markieren
    p.rect(17, 22, 4, 4, P.red[3]); p.rect(27, 27, 4, 4, P.red[3]);
    // Wellenlinie unten
    p.rect(5, 33, 36, 11, 0x2a7ab8);
    for (let x = 5; x < 41; x++) {
      const y = 36 + Math.round(Math.sin(x * 0.5) * 2);
      p.set(x, y, 0xcff4ff); p.set(x, y + 1, 0x5ab4e8);
      for (let yy = 33; yy < y; yy++) p.set(x, yy, P.cream[3]);
      const y2 = 41 + Math.round(Math.sin(x * 0.5 + 2) * 1.5);
      p.set(x, y2, 0x8ad4f4);
    }
    p.rect(5, 33, 36, 1, P.cream[3]);
    p.sparkle(44, 10, 0xcff4ff); p.sparkle(2, 36, 0xcff4ff);
    p.rect(0, 47, 46, 5, 0x0a2230);
  },

  // Elixierbrauer: Braukessel mit Flaschenreihe und Brenner
  elixierbrauer(p) {
    wall(p, 0, 52, ramp(0x2a2040), 10, 6);
    // Regal mit Flaschenreihe
    p.fig((q) => { q.rect(0, 15, 46, 3, P.darkwood[2]); q.rect(0, 15, 46, 1, P.darkwood[4]); });
    const bottles: [number, Ramp][] = [[5, P.red], [13, P.green], [21, P.purple], [29, P.cyan], [37, P.yellow]];
    bottles.forEach(([x, rp], i) => {
      const h = 9 + (i % 2) * 2;
      p.fig((q) => {
        q.rect(x - 1, 15 - h, 3, 4, P.glass[3]);
        q.shadedEll(x, 12, 4, 4, ramp(0x9fe0e8), 0.05);
        q.rect(x - 1, 4 + (i % 2) * -1, 3, 2, P.wood[2]);
      });
      p.ell(x, 13, 3, 3, rp[2]); p.rect(x - 2, 12, 5, 1, rp[3]); p.set(x - 2, 12, rp[4]);
      p.set(x - 3, 10, 0xffffff);
    });
    glow(p, 23, 40, 16, 0x3a8ae8, 0.6);
    // Brenner
    p.fig((q) => { q.rect(18, 44, 10, 4, P.iron[2]); q.rect(20, 41, 6, 3, P.iron[3]); q.rect(16, 47, 14, 3, P.iron[1]); });
    p.rect(18, 44, 10, 1, P.steel[4]);
    for (let i = 0; i < 3; i++) { const x = 21 + i * 2; p.poly([x, 40, x + 1.5, 37, x + 3, 40], i === 1 ? 0xffffff : 0x7ac8ff); }
    flame(p, 23, 31, 10, false);
    // Dreibein und Kolben
    p.line(11, 46, 17, 34, INK, 2); p.line(35, 46, 29, 34, INK, 2);
    p.rect(15, 34, 17, 2, P.iron[2]); p.rect(15, 34, 17, 1, P.steel[3]);
    p.fig((q) => { q.shadedEll(23, 27, 8, 8, ramp(0x9fe0e8), 0.06); q.rect(21, 14, 5, 8, P.glass[3]); });
    p.ell(23, 29, 6, 5, P.magenta[2]); p.ell(22, 28, 3, 2, P.magenta[3]); p.set(20, 27, 0xffffff);
    p.rect(22, 15, 1, 7, 0xffffff);
    for (const [x, y, r] of [[21, 30, 1], [25, 27, 1], [23, 24, 1]] as [number, number, number][]) p.disc(x, y, r, P.pink[4]);
    // Rohr zu Flasche rechts
    p.fig((q) => { q.path([26, 16, 34, 20, 38, 32], P.copper[2], 1); });
    p.fig((q) => { q.shadedEll(38, 38, 5, 6, ramp(0x9fe0e8), 0.05); q.rect(37, 28, 3, 6, P.glass[3]); });
    p.ell(38, 40, 4, 4, P.magenta[2]);
    p.sparkle(8, 30, 0xe8a0f0); p.sparkle(44, 26, 0xe8a0f0);
    p.rect(0, 50, 46, 2, P.darkwood[1]);
  },

  // Orakel: Orakelschale mit Dampf, ein Auge im Rauch
  orakel(p) {
    p.vgrad(0, 0, 46, 52, [0x14082a, 0x2a1050, 0x4a2078]);
    p.stars(12, 0, 0, 46, 8, rng(5), [0xe0c8ff, 0xffffff]);
    // Säulen
    for (const x of [0, 40]) {
      p.fig((q) => { q.rect(x, 2, 6, 50, P.stone[2]); q.rect(x, 2, 2, 50, P.stone[4]); q.rect(x + 5, 2, 1, 50, P.stone[0]); q.rect(x - 1, 0, 8, 3, P.stone[3]); });
      for (let y = 8; y < 50; y += 6) p.rect(x + 2, y, 3, 1, P.stone[1]);
    }
    // Rauchsäule und Auge
    glow(p, 23, 16, 14, 0x7a3ad0, 0.7);
    for (let i = 0; i < 30; i++) {
      const t = i / 29, y = 38 - t * 22;
      const x = 23 + Math.sin(t * 9) * (3 + (1 - t) * 2);
      p.disc(x, y, 2.5 - t * 0.5 + (i % 3) * 0.3, i % 2 ? 0x9a6ae0 : 0xb890f0);
    }
    // Auge
    p.fig((q) => { q.poly([10, 13, 17, 8, 23, 7, 29, 8, 36, 13, 29, 18, 23, 19, 17, 18], P.white[4]); }, 0x3a1a68);
    p.disc(23, 13, 5, P.cyan[2]);
    p.disc(23, 13, 3, P.cyan[1]);
    p.rect(22, 11, 2, 5, INK);
    p.rect(20, 11, 2, 2, 0xffffff);
    p.path([10, 13, 17, 8, 23, 7, 29, 8, 36, 13], 0x3a1a68, 1);
    p.set(14, 12, 0xd8a8ff); p.set(32, 12, 0xd8a8ff);
    // Schale auf Dreifuß
    p.fig((q) => {
      q.poly([10, 38, 36, 38, 32, 46, 14, 46], P.copper[2]);
      q.poly([10, 38, 36, 38, 33, 41, 13, 41], P.copper[3]);
      q.poly([10, 38, 14, 46, 18, 46, 14, 38], P.copper[4]);
      q.rect(12, 40, 22, 1, P.copper[0]);
      q.rect(18, 46, 10, 2, P.copper[1]);
      q.poly([14, 46, 11, 51, 14, 51, 17, 46], P.copper[1]); q.poly([32, 46, 35, 51, 32, 51, 29, 46], P.copper[1]);
    });
    p.ell(23, 38, 13, 2, P.copper[4]);
    p.ell(23, 38, 11, 1, 0x7a3ad0);
    for (let x = 14; x < 34; x += 3) p.set(x, 43, P.gold[4]);
    p.sparkle(8, 26, 0xd8a8ff); p.sparkle(38, 22, 0xd8a8ff); p.sparkle(23, 3, 0xffffff);
  },

  // Himmelsscheibe: runde Bronzescheibe mit Sternbildern und Mittelloch
  himmelsscheibe(p) {
    p.vgrad(0, 0, 46, 52, [0x040618, 0x0c1240, 0x1c2a6a]);
    p.stars(30, 0, 0, 46, 52, rng(12), [0xffffff, 0xcfe3ff]);
    glow(p, 23, 25, 22, 0x2a5a9a, 0.5);
    const base = ramp(0x2a8a78);
    p.fig((q) => { q.ball(23, 25, 19, base, 0.1); }, 0x0a2a24);
    // Bronzerand
    p.ring(23, 25, 18, ramp(0xb08040)[3], 2);
    p.ring(23, 25, 17, ramp(0xb08040)[4], 1);
    p.ring(23, 25, 13, ramp(0xb08040)[2], 1);
    // Patina
    const rg = rng(8);
    for (let i = 0; i < 40; i++) { const a = rg() * 6.28, d = 5 + rg() * 12; p.set(23 + Math.cos(a) * d, 25 + Math.sin(a) * d, base[3]); }
    // Einlagen aus Gold: Siebengestirn, Sichel, Sonne
    const gold = 0xf8d848;
    const cluster: [number, number][] = [[14, 15], [18, 12], [22, 15], [20, 19], [26, 13], [17, 22], [24, 21]];
    for (const [x, y] of cluster) p.poly(starPts(x, y, 1.8, 0.8, 4), gold);
    p.disc(34, 15, 3.2, gold); p.disc(35.5, 14, 2.6, base[2]);
    p.disc(31, 33, 4, gold); p.disc(31, 33, 2, 0xfff0b0);
    for (let a = 0; a < 8; a++) { const t = (a / 8) * 6.28; p.set(31 + Math.cos(t) * 6, 33 + Math.sin(t) * 6, gold); }
    p.path([14, 32, 18, 30, 21, 34, 17, 37, 13, 36], gold, 1);
    p.poly(starPts(15, 28, 1.5, 0.6, 4), gold); p.poly(starPts(22, 31, 1.5, 0.6, 4), gold);
    p.path([14, 15, 18, 12, 22, 15, 20, 19, 14, 15], 0xc8a838, 1);
    // Mittelloch
    p.disc(23, 25, 3, 0x0a0e2a); p.ring(23, 25, 3, ramp(0xb08040)[4], 1);
    p.set(22, 24, 0xcfe3ff);
    p.sparkle(5, 6, 0xffffff, true); p.sparkle(41, 46, 0xffffff); p.sparkle(42, 8, 0xcfe3ff); p.sparkle(6, 44, 0xcfe3ff);
    // Haken: Hand Handgriff Randzacken
    for (let a = 0; a < 16; a++) { const t = (a / 16) * 6.28; p.set(23 + Math.cos(t) * 20, 25 + Math.sin(t) * 20, ramp(0xb08040)[a % 2 ? 2 : 4]); }
  },

  // Weiter Mantel: Mantel mit Sternenmuster, weit ausgebreitet
  weiter_mantel(p) {
    p.vgrad(0, 0, 46, 52, [0x3a1a58, 0x6a2a78, 0xa04a78, 0xe08a60]);
    p.stars(10, 0, 0, 46, 10, rng(25), [0xffffff, 0xffe27a]);
    hills(p, 44, 2, 22, 0.6, 0x2a1448);
    // Mantel
    p.fig((q) => {
      q.poly([23, 8, 31, 11, 42, 20, 46, 34, 45, 48, 38, 44, 31, 50, 23, 44, 15, 50, 8, 44, 1, 48, 0, 34, 4, 20, 15, 11], P.navy[2]);
      q.poly([23, 8, 15, 11, 4, 20, 0, 34, 1, 48, 8, 44, 12, 28, 18, 14], P.navy[3]);
      q.poly([23, 44, 31, 50, 38, 44, 45, 48, 46, 34, 40, 36, 34, 40, 28, 38], P.navy[1]);
    });
    // Falten
    p.line(23, 14, 14, 40, P.navy[1]); p.line(23, 14, 32, 40, P.navy[0]); p.line(23, 14, 6, 30, P.navy[1]); p.line(23, 14, 40, 30, P.navy[0]);
    p.line(23, 14, 23, 44, P.navy[0]);
    // Innenfutter purpur am Saum
    for (let x = 1; x < 45; x += 2) p.set(x, 45 + (x % 4 === 1 ? 1 : 0), P.magenta[2]);
    // Sternenmuster
    const stars: [number, number, number][] = [[10, 28, 2], [16, 38, 2.5], [8, 40, 1.5], [30, 30, 2], [37, 38, 2.5], [40, 26, 1.5], [24, 32, 2.5], [20, 22, 1.6], [28, 18, 1.5], [12, 20, 1.5], [34, 20, 1.5]];
    for (const [x, y, r] of stars) p.poly(starPts(x, y, r + 0.7, (r + 0.7) * 0.4, 5), 0xffe27a);
    p.sparkle(24, 40, 0xffe27a); p.sparkle(5, 34, 0xffffff);
    // Kapuze, Gesicht und Schließe
    p.fig((q) => { q.ell(23, 14, 10, 4, P.navy[3]); q.shadedEll(23, 9, 7, 8, P.navy, 0.08); });
    p.fig((q) => { q.disc(23, 10, 4, P.skin[3]); }, null);
    p.rect(21, 12, 5, 1, P.skin[1]);
    p.set(21, 10, INK); p.set(25, 10, INK);
    p.rect(21, 7, 5, 1, P.navy[1]);
    p.fig((q) => { q.disc(23, 19, 2, P.gold[3]); });
    p.set(22, 18, P.gold[4]);
    p.rect(16, 15, 14, 1, P.navy[4]);
    // Hände an den Mantelrändern
    p.fig((q) => { q.disc(2, 33, 2, P.skin[3]); q.disc(44, 33, 2, P.skin[2]); });
  },

  // @@END
};
