import { INK, Pix, rng, ramp, type Color, type Ramp } from './jokerPix';
import { PAL as P, arcPts, flame, glow, hills, moon, starPts, wall, type Sprite } from './jokerKit';
import { coinG, suit } from './jokerSpritesG';

// Motive Gruppe J: Windhose, Regenbogen, alle Rare und Legendary Jokers der zweiten Welle. Zeichenfläche 46 mal 52.

/** Komet: Kopf bei (hx, hy), Schweif streckt sich zum Punkt (tx, ty), Breite w, Farbstufen von außen nach innen. */
function comet(p: Pix, hx: number, hy: number, tx: number, ty: number, w: number, cols: Color[], headR = 2.5) {
  const len = Math.hypot(tx - hx, ty - hy), dx = (tx - hx) / len, dy = (ty - hy) / len, nx = -dy, ny = dx;
  cols.forEach((c, i) => {
    const k = 1 - i / cols.length;
    const ww = w * k;
    p.poly([hx + nx * ww, hy + ny * ww, hx + dx * len * (0.55 + 0.45 * k) + nx * ww * 0.2, hy + dy * len * (0.55 + 0.45 * k) + ny * ww * 0.2, hx + dx * len * (0.55 + 0.45 * k) - nx * ww * 0.2, hy + dy * len * (0.55 + 0.45 * k) - ny * ww * 0.2, hx - nx * ww, hy - ny * ww], c);
  });
  p.disc(hx, hy, headR + 1, cols[0]);
  p.disc(hx, hy, headR, 0xfff0b0);
  p.disc(hx, hy, headR - 1, 0xffffff);
}

export const SPRITES_J: Record<string, Sprite> = {
  // Windhose: Wirbelsturm Trichter mit Blättern und Funken
  windhose(p) {
    p.vgrad(0, 0, 46, 52, [0x1a2a3a, 0x3a5a68, 0x6a8a88, 0x8aa890]);
    p.ell(10, 6, 14, 5, 0x2a3a4a); p.ell(36, 4, 16, 5, 0x2a3a4a); p.ell(24, 3, 18, 4, 0x1a2a3a);
    p.ell(8, 5, 8, 2, 0x4a6a78); p.ell(34, 3, 10, 2, 0x4a6a78);
    p.rect(0, 44, 46, 8, 0x5a6a48); p.speckle(0, 44, 46, 8, 0x4a5a3a, 0.3, rng(4)); p.rect(0, 44, 46, 1, 0x8aa070);
    // Trichter aus versetzten Ellipsen
    for (let y = 8; y <= 46; y += 2) {
      const t = (y - 8) / 38;
      const w = 3 + (1 - t) * (1 - t) * 14 + (1 - t) * 4;
      const cx = 23 + Math.sin(t * 5.5) * (2 + (1 - t) * 4);
      p.ell(cx, y, w, 2.4, ((y >> 1) % 2) ? 0x5a6a7a : 0x7a8a94);
      p.ell(cx - w * 0.3, y - 0.5, w * 0.5, 1.2, ((y >> 1) % 2) ? 0x8a9aa8 : 0xa8b8c0);
      p.rect(cx + w * 0.6, y, 1, 1, 0x3a4a5a);
    }
    // Blätter im Wirbel
    const leaves: [number, number, Color][] = [[8, 22, 0xe0902a], [36, 16, 0x6aba48], [12, 36, 0xd8502a], [40, 30, 0xf0c040], [18, 12, 0x6aba48], [30, 40, 0xe0902a], [5, 12, 0xd8502a]];
    for (const [x, y, c] of leaves) { p.fig((q) => { q.poly([x, y - 2, x + 3, y, x, y + 2, x - 3, y], c); }, 0x2a3a1a); p.set(x, y, 0xfff0b0); }
    // Funken
    for (const [x, y] of [[13, 18], [33, 24], [9, 30], [38, 10], [27, 34]] as [number, number][]) p.sparkle(x, y, 0xffe27a);
    // Staub am Boden
    p.ell(23, 46, 14, 2, 0x8a8a70); p.ell(23, 45, 9, 1, 0xb8b898);
  },

  // Regenbogen: Regenbogen über der Sternwarte Kuppel
  regenbogen(p) {
    p.vgrad(0, 0, 46, 52, [0x3a2a88, 0x6a5ac0, 0xa8a0e0, 0xf0d8e8]);
    p.stars(8, 0, 0, 46, 10, rng(30), [0xffffff, 0xfff2b0]);
    // Wolken
    for (const [x, y, rx] of [[6, 38, 10], [40, 36, 9], [23, 6, 12], [38, 12, 7]] as [number, number, number][]) { p.ell(x, y, rx, 3, 0xe8e0f4); p.ell(x - 1, y - 2, rx - 3, 2, 0xffffff); }
    // Bogen aus sieben Bändern
    const bands = [0xe0382f, 0xf28a24, 0xf7dc4a, 0x3fae55, 0x3b9ae0, 0x4a3aa8, 0x9a52d0];
    bands.forEach((c, i) => { p.ring(23, 40, 22 - i * 2, c, 2); });
    for (const [x, y] of [[8, 22], [36, 18]] as [number, number][]) p.set(x, y, 0xffffff);
    glow(p, 23, 40, 24, 0xfff0d8, 0.3);
    // Hügel und Sternwarte
    hills(p, 44, 2, 22, 1, 0x2a6a58, 0x5aba78);
    p.fig((q) => {
      q.rect(14, 33, 18, 14, P.cream[2]); q.rect(14, 33, 4, 14, P.cream[3]); q.rect(29, 33, 3, 14, P.cream[1]);
      q.shadedEll(23, 33, 9, 8, P.cream, 0.08);
      q.rect(14, 33, 18, 1, P.cream[1]);
    });
    p.fig((q) => { q.rect(22, 24, 3, 8, P.slate[0]); });
    p.poly([23, 24, 25, 24, 26, 33, 22, 33], P.slate[0]);
    p.rect(22, 25, 1, 8, P.slate[2]);
    p.rect(19, 38, 8, 9, P.wood[1]); p.ell(23, 38, 4, 2, P.wood[1]); p.rect(20, 40, 6, 7, P.wood[2]);
    p.rect(15, 38, 3, 3, 0xffd060); p.rect(28, 38, 3, 3, 0xffd060);
    p.sparkle(5, 30, 0xffffff); p.sparkle(41, 28, 0xffffff);
  },

  // Trophäensammler: Trophäenwand mit Bosskronen und Hörnern
  trophaeensammler(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1a14, 0x3a2418, 0x4a2c1c]);
    for (let x = 0; x < 46; x += 9) { p.rect(x, 0, 1, 52, 0x2a160e); }
    // Schild mit Hörnern
    p.fig((q) => { q.poly([14, 4, 32, 4, 34, 16, 23, 24, 12, 16], P.darkwood[2]); q.poly([14, 4, 32, 4, 33, 7, 13, 7], P.darkwood[4]); }, INK);
    p.fig((q) => {
      q.poly([13, 14, 4, 12, 2, 4, 7, 8, 9, 5, 12, 10, 16, 12], P.cream[3]);
      q.poly([33, 14, 42, 12, 44, 4, 39, 8, 37, 5, 34, 10, 30, 12], P.cream[2]);
      q.shadedEll(23, 15, 7, 7, P.cream, 0.08);
      q.poly([17, 20, 29, 20, 27, 27, 19, 27], P.cream[2]);
    });
    p.rect(19, 13, 3, 3, INK); p.rect(25, 13, 3, 3, INK); p.set(20, 14, 0xff5a3a); p.set(26, 14, 0xff5a3a);
    p.rect(21, 18, 4, 2, P.cream[0]);
    for (let x = 19; x < 28; x += 2) p.set(x, 23, P.cream[0]);
    // zwei Kronen auf Konsolen
    const crownT = (x: number, y: number, rp: Ramp, gem: Color) => {
      p.fig((q) => {
        q.poly([x - 8, y + 8, x - 8, y, x - 4, y + 4, x, y - 2, x + 4, y + 4, x + 8, y, x + 8, y + 8], rp[2]);
        q.poly([x - 8, y + 8, x - 8, y, x - 4, y + 4, x - 4, y + 8], rp[3]);
        q.rect(x - 8, y + 7, 17, 2, rp[1]);
      });
      p.rect(x - 7, y + 6, 15, 1, rp[4]);
      p.disc(x, y + 5, 1, gem); p.set(x - 8, y - 1, rp[4]); p.set(x + 8, y - 1, rp[4]); p.set(x, y - 3, 0xffffff);
    };
    crownT(9, 31, P.gold, P.red[3]);
    crownT(37, 31, ramp(0xaeb9cc), P.blue[3]);
    p.fig((q) => { q.rect(0, 41, 19, 3, P.darkwood[3]); q.rect(27, 41, 19, 3, P.darkwood[3]); });
    // Trophäe in der Mitte unten
    p.fig((q) => { q.poly([18, 30, 28, 30, 27, 36, 24, 38, 22, 38, 19, 36], P.gold[2]); q.rect(22, 38, 2, 3, P.gold[1]); q.rect(19, 40, 8, 2, P.gold[2]); });
    p.rect(19, 31, 3, 4, P.gold[4]);
    p.path([18, 31, 15, 33, 18, 36], P.gold[2], 1); p.path([28, 31, 31, 33, 28, 36], P.gold[2], 1);
    // Reihe kleiner Plaketten
    for (let i = 0; i < 6; i++) { p.rect(3 + i * 7, 46, 5, 4, i % 2 ? P.gold[3] : P.steel[3]); p.rect(3 + i * 7, 46, 5, 1, 0xffffff); }
    p.sparkle(23, 36, 0xffe27a); p.sparkle(5, 20, 0xffd890); p.sparkle(41, 22, 0xffd890);
  },

  // Sternuhr: astronomische Uhr mit Zifferblatt und Sternzeichen Ring
  sternuhr(p) {
    wall(p, 0, 52, ramp(0x3a3050), 11, 6);
    glow(p, 23, 25, 22, 0x4a6ad0, 0.5);
    // Gehäuse: Kupferring
    p.fig((q) => { q.ball(23, 25, 21, P.copper, 0.1); }, INK);
    // Tierkreisring mit zwölf Feldern
    p.disc(23, 25, 18, 0x14183e);
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2;
      const cols = [0x2a3a88, 0x3a2a78];
      for (let r = 13; r <= 17; r++) for (let a = a0; a < a1; a += 0.04) p.set(23 + Math.cos(a) * r, 25 + Math.sin(a) * r, cols[i % 2]);
      const am = (a0 + a1) / 2;
      p.set(23 + Math.cos(am) * 15, 25 + Math.sin(am) * 15, 0xffe27a);
      p.set(23 + Math.cos(am) * 15 + 1, 25 + Math.sin(am) * 15, 0xffe27a);
      p.line(23 + Math.cos(a0) * 13, 25 + Math.sin(a0) * 13, 23 + Math.cos(a0) * 17, 25 + Math.sin(a0) * 17, P.copper[3]);
    }
    p.ring(23, 25, 18, P.copper[4], 1); p.ring(23, 25, 13, P.copper[3], 1);
    // Zifferblatt innen
    p.disc(23, 25, 12, 0x1a2468);
    p.vgrad(11, 13, 24, 24, [0x1a2468, 0x2a3a98]);
    for (let y = 13; y < 38; y++) for (let x = 11; x < 36; x++) if (Math.hypot(x - 23, y - 25) > 12.4) { /* außerhalb bleibt */ }
    p.disc(23, 25, 12, 0x1e2a78);
    p.ring(23, 25, 12, 0x6a7ac8, 1);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; p.set(23 + Math.cos(a) * 10, 25 + Math.sin(a) * 10, i % 3 === 0 ? 0xffffff : 0xb8c8ff); }
    p.set(23, 12, 0xffe27a); p.set(23, 38, 0xffe27a); p.set(11, 25, 0xffe27a); p.set(35, 25, 0xffe27a);
    // Sonne und Mond auf dem Zifferblatt
    p.disc(23, 25, 4, 0xf2b92c); p.disc(22, 24, 2, 0xfff0b0);
    p.disc(30, 19, 2, 0xe8e4c8); p.disc(31, 18, 2, 0x1e2a78);
    // Zeiger
    p.line(23, 25, 28, 17, 0xffe27a, 1); p.line(23, 25, 16, 29, 0xffffff, 1);
    p.disc(23, 25, 1, 0x3a1a08);
    // Stern oben am Gehäuse
    p.poly(starPts(23, 3, 4, 1.6, 5), 0xffe27a);
    p.sparkle(5, 8, 0xcfe3ff); p.sparkle(41, 44, 0xcfe3ff);
    p.rect(0, 48, 46, 4, 0x1a1530);
  },

  // Sonnenkorona: Sonnenfinsternis mit strahlender Korona
  sonnenkorona(p) {
    p.vgrad(0, 0, 46, 52, [0x02030c, 0x0a0e30, 0x161e58]);
    p.stars(22, 0, 0, 46, 40, rng(3), [0xffffff, 0xcfe3ff]);
    glow(p, 23, 22, 22, 0xb06a28, 0.6);
    glow(p, 23, 22, 16, 0xf0a030, 0.8);
    // Strahlen der Korona
    const r = rng(12);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + r() * 0.1, l = 11 + r() * 11 * (i % 2 ? 0.7 : 1);
      p.poly([23 + Math.cos(a - 0.1) * 10, 22 + Math.sin(a - 0.1) * 10, 23 + Math.cos(a) * (10 + l), 22 + Math.sin(a) * (10 + l), 23 + Math.cos(a + 0.1) * 10, 22 + Math.sin(a + 0.1) * 10], i % 3 === 0 ? 0xfff6d0 : i % 3 === 1 ? 0xffd060 : 0xf09a30);
    }
    p.disc(23, 22, 12, 0xfff6d8);
    p.ring(23, 22, 12, 0xffffff, 1);
    p.disc(23, 22, 10, 0xffd060);
    // Mond davor
    p.fig((q) => { q.disc(23, 22, 9, 0x04040e); }, null);
    p.ring(23, 22, 9, 0x2a1a38, 1);
    // Diamantring rechts oben
    p.sparkle(31, 15, 0xffffff, true); p.set(30, 16, 0xffffff);
    // Protuberanzen
    p.path(arcPts(23, 22, 11, 11, 190, 240, 8), 0xff4a2a, 1);
    p.path(arcPts(23, 22, 11, 11, 330, 20, 6), 0xff6a3a, 1);
    // Horizont
    hills(p, 46, 2, 18, 0.4, 0x0a0a1e, 0x1a1a3a);
    p.fig((q) => { q.rect(8, 41, 6, 10, 0x06060e); q.ell(11, 41, 3, 2, 0x06060e); q.rect(33, 43, 8, 9, 0x06060e); q.ell(37, 43, 4, 2, 0x06060e); }, null);
    p.sparkle(5, 8, 0xffffff); p.sparkle(41, 6, 0xffffff);
  },

  // Meisterwerk: Amboss mit glühendem Werkstück, Funkenregen
  meisterwerk(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0a0e, 0x4a1214, 0x9a2a14, 0xe0601c]);
    glow(p, 23, 36, 22, 0xff9a30, 0.9);
    // Funkenregen von oben
    const r = rng(77);
    for (let i = 0; i < 34; i++) {
      const x = Math.floor(r() * 46), y = Math.floor(r() * 36), l = 1 + Math.floor(r() * 3);
      for (let k = 0; k < l; k++) p.set(x + k * 0.5, y - k, k === 0 ? 0xfff0b0 : 0xff9a2a);
    }
    p.sparkle(23, 12, 0xffe27a, true);
    // Holzblock
    p.fig((q) => { q.rect(8, 44, 30, 8, P.wood[2]); q.rect(8, 44, 30, 1, P.wood[4]); q.rect(8, 44, 3, 8, P.wood[3]); q.rect(35, 44, 3, 8, P.wood[0]); });
    for (let x = 14; x < 34; x += 6) p.rect(x, 46, 1, 6, P.wood[1]);
    // Amboss
    p.fig((q) => {
      q.poly([2, 28, 38, 28, 45, 34, 36, 37, 30, 37, 29, 44, 15, 44, 14, 37, 9, 37, 8, 32, 1, 31], P.steel[2]);
      q.poly([2, 28, 38, 28, 45, 34, 6, 33, 1, 31], P.steel[4]);
      q.poly([14, 37, 30, 37, 29, 44, 15, 44], P.steel[1]);
      q.rect(30, 33, 2, 4, P.steel[1]);
    });
    p.rect(3, 28, 33, 1, 0xffffff);
    p.rect(17, 38, 1, 5, P.steel[3]);
    // glühende Klinge quer über dem Amboss
    p.fig((q) => { q.poly([4, 22, 36, 24, 42, 26, 36, 28, 4, 28], P.orange[3]); }, null);
    for (let x = 4; x < 42; x++) {
      const t = (x - 4) / 38;
      const c = t < 0.35 ? 0xfff6d0 : t < 0.6 ? 0xffd060 : t < 0.85 ? 0xf08a24 : 0xc83a1c;
      p.rect(x, 23, 1, 4, c);
    }
    p.rect(4, 23, 38, 1, 0xffffff);
    // Griffangel
    p.fig((q) => { q.rect(0, 23, 6, 4, P.iron[2]); });
    p.rect(0, 23, 5, 1, P.steel[3]);
    // Zange und Hammer
    p.fig((q) => { q.line(41, 8, 31, 20, P.wood[3], 3); q.poly([32, 4, 46, 3, 46, 11, 34, 12], P.steel[2]); q.poly([32, 4, 46, 3, 46, 5, 33, 6], P.steel[4]); });
    p.poly(starPts(8, 12, 3, 1.2, 4), 0xffe27a); p.sparkle(38, 36, 0xffc43a); p.sparkle(5, 40, 0xff9a2a);
  },

  // Nachtwandler: Schlafwandler mit Laterne auf einem Dach, Vollmond
  nachtwandler(p) {
    p.vgrad(0, 0, 46, 52, [0x0a1038, 0x1a2468, 0x3a4a98]);
    p.stars(18, 0, 0, 46, 24, rng(50), [0xffffff, 0xcfe3ff]);
    glow(p, 23, 17, 18, 0x8a9ae0, 0.7);
    moon(p, 23, 17, 13);
    // Dach
    p.poly([0, 34, 46, 28, 46, 52, 0, 52], 0x1a1a3a);
    p.poly([0, 34, 46, 28, 46, 30, 0, 36], 0x4a4a88);
    for (let j = 0; j < 4; j++) for (let x = (j % 2) * 3; x < 46; x += 6) { p.rect(x, 38 + j * 4, 5, 1, 0x2a2a58); p.rect(x + 5, 37 + j * 4, 1, 4, 0x2a2a58); }
    p.fig((q) => { q.rect(36, 18, 6, 12, 0x14143a); q.rect(35, 17, 8, 2, 0x2a2a58); }, null);
    // Schlafwandler: Nachthemd, Zipfelmütze, ausgestreckte Arme
    p.fig((q) => {
      q.poly([15, 36, 17, 22, 21, 19, 27, 19, 30, 22, 31, 36], P.white[3]);
      q.poly([15, 36, 17, 22, 21, 19, 22, 36], P.white[4]);
      q.poly([26, 19, 30, 22, 31, 36, 28, 36], P.white[1]);
      q.disc(24, 15, 4, P.skin[3]);
      q.poly([19, 13, 22, 7, 28, 6, 33, 10, 28, 12, 20, 14], P.indigo[3]);
      q.disc(33, 11, 1.5, P.white[4]);
      q.line(29, 24, 37, 24, P.white[3], 3);
      q.line(18, 24, 12, 25, P.white[2], 3);
      q.rect(18, 36, 4, 3, P.skin[2]); q.rect(25, 36, 4, 3, P.skin[2]);
    });
    p.rect(23, 15, 2, 1, INK); p.rect(27, 15, 2, 1, INK);
    // Laterne in der Hand
    glow(p, 39, 29, 8, 0xf0b040, 0.9);
    p.fig((q) => { q.rect(37, 26, 5, 7, P.iron[2]); q.rect(38, 24, 3, 2, P.iron[3]); });
    p.rect(38, 27, 3, 5, 0xffe27a); p.set(39, 28, 0xffffff);
    p.sparkle(7, 8, 0xffffff); p.sparkle(41, 7, 0xffffff);
  },

  // Purpurgarde: purpurrote Wache mit Herzschild und Speer
  purpurgarde(p) {
    wall(p, 0, 52, ramp(0x3a2a4a), 11, 6);
    glow(p, 6, 12, 12, 0xd07a30, 0.6); glow(p, 40, 12, 12, 0xd07a30, 0.6);
    p.rect(5, 12, 2, 8, P.darkwood[2]); flame(p, 6, 4, 8, false);
    // Speer rechts
    p.fig((q) => { q.rect(38, 8, 2, 44, P.wood[3]); q.poly([39, 0, 42, 8, 39, 10, 36, 8], P.steel[3]); q.poly([39, 0, 36, 8, 39, 10], P.steel[4]); });
    p.poly([37, 9, 39, 12, 41, 9], P.crimson[2]);
    // Wache
    const pur = ramp(0x8a2a9a);
    p.fig((q) => {
      // Beine
      q.rect(14, 42, 6, 10, pur[1]); q.rect(23, 42, 6, 10, pur[1]);
      // Rumpf
      q.poly([10, 44, 11, 28, 17, 24, 27, 24, 33, 28, 34, 44], pur[2]);
      q.poly([10, 44, 11, 28, 17, 24, 20, 24, 18, 44], pur[3]);
      q.rect(10, 41, 24, 3, P.gold[2]);
      // Schulter
      q.ell(10, 28, 4, 3, pur[3]); q.ell(34, 28, 4, 3, pur[1]);
      // Helm
      q.shadedEll(22, 17, 7, 8, ramp(0xaeb9cc), 0.08);
      q.poly([22, 4, 25, 0, 28, 6, 24, 9], P.crimson[3]);
      q.poly([22, 4, 19, 0, 17, 7, 21, 9], P.crimson[2]);
    });
    p.rect(17, 17, 11, 2, INK); p.rect(21, 17, 3, 8, INK);
    p.rect(17, 14, 1, 8, P.steel[4]);
    p.rect(20, 28, 5, 2, P.gold[3]);
    // Herzschild vorn links
    p.fig((q) => { q.poly([1, 28, 17, 28, 17, 40, 9, 51, 1, 40], P.crimson[2]); q.poly([1, 28, 9, 28, 9, 51, 1, 40], P.crimson[3]); });
    p.rect(1, 28, 16, 1, P.gold[3]);
    suit(p, 'heart', 9, 36, 4.2, [P.red[0], P.red[1], P.red[2], P.red[3], P.red[4]], 0x3a0a1e);
    p.rect(9, 38, 0, 0, 0);
    p.sparkle(30, 6, 0xffe27a); p.sparkle(5, 24, 0xffd890);
  },

  // Kapitalist: Goldwaage, links ein Münzstapel, rechts ein Zylinder
  kapitalist(p) {
    p.vgrad(0, 0, 46, 52, [0x0e2a1e, 0x1a4a30, 0x2a6a40]);
    for (let x = 2; x < 46; x += 11) { p.rect(x, 0, 1, 52, 0x0e2a1e); p.rect(x + 1, 0, 1, 52, 0x3a7a50); }
    glow(p, 23, 14, 18, 0xffe27a, 0.4);
    p.rect(0, 46, 46, 6, P.darkwood[1]); p.rect(0, 46, 46, 1, P.wood[3]);
    // Waagbalken auf Säule
    p.fig((q) => {
      q.rect(21, 12, 4, 33, P.gold[2]); q.rect(21, 12, 1, 33, P.gold[4]); q.rect(24, 12, 1, 33, P.gold[0]);
      q.poly([14, 44, 32, 44, 30, 40, 16, 40], P.gold[2]);
      q.rect(14, 44, 18, 2, P.gold[1]);
      q.poly([4, 14, 42, 12, 42, 15, 4, 17], P.gold[3]);
      q.disc(23, 10, 3, P.gold[3]);
    });
    p.line(4, 14, 42, 12, P.gold[4]);
    // linke Schale mit Münzstapel (tiefer)
    p.line(6, 16, 3, 32, P.gold[1]); p.line(6, 16, 12, 32, P.gold[1]);
    p.fig((q) => { q.ell(8, 33, 7, 2, P.gold[3]); });
    for (let i = 0; i < 7; i++) { p.rect(4, 31 - i * 2, 9, 2, i % 2 ? P.gold[2] : P.gold[3]); p.rect(4, 31 - i * 2, 9, 1, P.gold[4]); p.set(12, 32 - i * 2, P.gold[0]); }
    p.fig((q) => { q.ell(8, 16, 4, 1.5, P.gold[4]); }, null);
    // rechte Schale mit Zylinder (höher)
    p.line(40, 14, 37, 28, P.gold[1]); p.line(40, 14, 44, 28, P.gold[1]);
    p.fig((q) => { q.ell(40, 29, 6, 2, P.gold[3]); });
    p.fig((q) => {
      q.rect(36, 19, 9, 9, 0x2a2438); q.rect(36, 19, 3, 9, 0x4a4468);
      q.ell(40, 28, 7, 2, 0x2a2438); q.rect(36, 25, 9, 2, P.red[2]);
    });
    p.rect(36, 18, 9, 1, 0x6a6488); p.set(37, 20, 0x8a84a8);
    p.rect(39, 25, 3, 2, P.gold[4]);
    // Münzen darauf
    coinG(p, 36, 40, 2); coinG(p, 40, 43, 3); coinG(p, 10, 44, 2);
    p.sparkle(5, 8, 0xffe27a); p.sparkle(42, 6, 0xffe27a, true); p.sparkle(13, 22, 0xffe27a);
  },

  // Echokammer: Gewölbe mit Schallwellen Ringen, zwei Karten im Zentrum
  echokammer(p) {
    p.fill(0x0a0e2a);
    // geschachtelte Rundbögen: von außen (hell, nah) nach innen (dunkel, fern)
    const arch = (x: number, y: number, w: number, h: number, rp: Ramp) => {
      const r = w / 2;
      p.rect(x, y + r, w, h - r, rp[2]);
      p.ell(x + r, y + r, r, r, rp[2]);
      p.rect(x, y + r, 2, h - r, rp[3]);
      p.rect(x + w - 2, y + r, 2, h - r, rp[0]);
      for (let a = 180; a <= 360; a += 4) {
        const t = (a * Math.PI) / 180;
        p.set(x + r + Math.cos(t) * (r - 0.5), y + r + Math.sin(t) * (r - 0.5), a < 270 ? rp[4] : rp[3]);
      }
    };
    arch(0, 0, 46, 60, P.stone);
    arch(4, 5, 38, 52, P.slate);
    arch(8, 10, 30, 44, ramp(0x4a5278));
    arch(12, 15, 22, 36, ramp(0x3a4268));
    arch(15, 19, 16, 30, ramp(0x2a3258));
    p.vgrad(17, 24, 12, 24, [0x1a2a68, 0x0a1230]);
    p.disc(23, 28, 7, 0x1a2a68);
    // Schallringe
    for (const [rx, ry, c] of [[8, 11, 0x3a8ae0], [13, 16, 0x5ab4f0], [18, 21, 0x7ad0ff]] as [number, number, Color][]) {
      for (let a = 0; a < 80; a++) { if (a % 2) continue; const t = (a / 80) * Math.PI * 2; const y = 27 + Math.sin(t) * ry; if (y > 46) continue; p.set(23 + Math.cos(t) * rx, y, c); }
    }
    glow(p, 23, 27, 9, 0x5ab4ff, 0.9);
    // zwei Karten im Zentrum
    p.fig((q) => { q.rrect(14, 19, 11, 15, P.white[3], 2); }, INK);
    p.rect(15, 20, 9, 13, P.white[3]); suit(p, 'heart', 19.5, 26.5, 2.6, [0xd8382f, 0xd8382f, 0xd8382f, 0xd8382f, 0xd8382f], null);
    p.fig((q) => { q.rrect(21, 22, 11, 15, P.white[4], 2); }, INK);
    p.rect(22, 23, 9, 13, P.white[4]); suit(p, 'spade', 26.5, 29.5, 2.6, [0x2a3a78, 0x2a3a78, 0x2a3a78, 0x2a3a78, 0x2a3a78], null);
    p.sparkle(8, 40, 0x7ad0ff); p.sparkle(38, 44, 0x7ad0ff); p.sparkle(23, 12, 0xffffff);
    p.rect(0, 48, 46, 4, P.stone[0]); p.rect(0, 48, 46, 1, P.stone[3]);
  },

  // Alles oder Nichts: Münze auf der Kante, Sterne drumherum
  alles_oder_nichts(p) {
    p.rays(23, 26, 12, 0x14082a, 0x1c0e3a, 0.1);
    p.vgrad(0, 36, 46, 16, [0x1c0e3a, 0x0a0418]);
    glow(p, 23, 26, 20, 0xc89a30, 0.5);
    // Tischfläche
    p.rect(0, 42, 46, 10, 0x1a0a30); p.rect(0, 42, 46, 1, 0x4a2a78);
    // Spiegelung
    p.fig((q) => { q.ell(23, 48, 3, 4, 0x6a4a18); }, null);
    p.ell(23, 47, 7, 1, 0x8a6a28);
    // Münze auf der Kante, leicht gedreht: Rand rechts, Vorderseite links
    p.fig((q) => { q.ell(26, 25, 5, 16, P.gold[1]); q.ell(23, 25, 5, 16, P.gold[3]); }, 0x4a2a08);
    p.ell(26, 25, 5, 16, P.gold[1]);
    p.ell(23, 25, 5, 16, P.gold[3]);
    p.ellRing(23, 25, 4, 15, P.gold[4], 1);
    p.ellRing(23, 25, 2, 12, P.gold[2], 1);
    p.poly([23, 18, 24.5, 24, 23, 32, 21.5, 24], P.gold[4]);
    p.poly([23, 20, 24, 24, 23, 29, 22, 24], 0xfff6d0);
    for (let y = 11; y < 40; y += 2) p.set(29, y, P.gold[0]);
    p.rect(19, 12, 1, 6, 0xffffff);
    p.rect(21, 10, 4, 1, P.gold[4]);
    // Sterne ringsum
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - 0.3;
      const x = 23 + Math.cos(a) * 19, y = 25 + Math.sin(a) * 18;
      if (y > 41) continue;
      p.poly(starPts(x, y, 3 + (k % 3), 1.3 + (k % 3) * 0.4, 5), k % 2 ? 0xfff0a0 : 0xffd060);
    }
    p.sparkle(8, 44, 0xffe27a); p.sparkle(38, 46, 0xffe27a);
    p.disc(23, 6, 2, 0xffffff); p.sparkle(23, 6, 0xffe27a);
  },

  // Zufallskugel: Glaskugel mit Würfelaugen und Nebel
  zufallskugel(p) {
    p.vgrad(0, 0, 46, 52, [0x14082a, 0x2a1050, 0x4a2078]);
    p.stars(14, 0, 0, 46, 10, rng(14), [0xe0c8ff, 0xffffff]);
    glow(p, 23, 22, 22, 0x7a3ad0, 0.6);
    // Sockel
    p.fig((q) => {
      q.poly([10, 51, 13, 42, 33, 42, 36, 51], P.gold[2]);
      q.poly([10, 51, 13, 42, 20, 42, 17, 51], P.gold[3]);
      q.rect(12, 41, 22, 3, P.gold[3]);
      q.poly([13, 43, 8, 48, 11, 48, 16, 44], P.gold[2]); q.poly([33, 43, 38, 48, 35, 48, 30, 44], P.gold[1]);
    });
    p.rect(12, 41, 22, 1, P.gold[4]); p.rect(14, 47, 18, 1, P.gold[1]);
    // Kugel
    p.fig((q) => { q.ball(23, 24, 16, ramp(0x7aa8e8), 0.05); }, 0x1a1050);
    p.ball(23, 24, 14, ramp(0x4a2ab8), 0.16);
    // Nebel
    const rg = rng(31);
    for (let i = 0; i < 120; i++) { const a = rg() * 6.28, d = Math.sqrt(rg()) * 13; const x = 23 + Math.cos(a) * d, y = 24 + Math.sin(a) * d * 0.9; p.set(x, y, i % 3 ? 0x8a6ae0 : 0xc8b0ff); }
    p.ell(18, 30, 8, 3, 0xa888ec); p.ell(27, 20, 7, 2, 0xb898f4);
    // Würfel mit leuchtenden Augen im Nebel
    p.fig((q) => { q.rrect(17, 18, 12, 12, P.white[4], 2); }, 0x1a1050);
    p.rect(18, 19, 10, 10, P.white[3]);
    for (const [x, y] of [[20, 21], [26, 21], [23, 24], [20, 27], [26, 27]] as [number, number][]) { p.rect(x - 1, y - 1, 2, 2, P.red[2]); p.set(x - 1, y - 1, 0xffb0a0); }
    p.rect(18, 19, 10, 1, 0xffffff);
    p.disc(11, 28, 1, 0xc8b0ff); p.disc(35, 26, 1, 0xc8b0ff);
    // Glanz
    p.path(arcPts(23, 24, 12, 12, 200, 250, 6), 0xffffff, 1);
    p.set(14, 14, 0xffffff); p.set(15, 13, 0xffffff);
    p.sparkle(6, 14, 0xe0c8ff); p.sparkle(41, 12, 0xe0c8ff);
  },

  // Konstellation: Sternbild Karte mit verbundenen Sternen und Linien
  konstellation(p) {
    p.vgrad(0, 0, 46, 52, [0x0a1238, 0x14205a, 0x1c2a6a]);
    // Kartenrand in Gold
    p.frame(1, 1, 44, 50, P.gold[1]); p.frame(3, 3, 40, 46, P.gold[2]);
    for (const [x, y] of [[1, 1], [44, 1], [1, 50], [44, 50]] as [number, number][]) p.sparkle(x, y, P.gold[4]);
    // Koordinatennetz
    for (const r of [8, 15, 22]) p.ring(23, 26, r, 0x2a3a8a, 1);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI; p.line(23 - Math.cos(a) * 22, 26 - Math.sin(a) * 22, 23 + Math.cos(a) * 22, 26 + Math.sin(a) * 22, 0x1e2a70); }
    // Sternbilder mit Linien
    const groups: [number, number][][] = [
      [[9, 12], [15, 8], [22, 13], [20, 20], [12, 21]],
      [[28, 10], [34, 16], [31, 24], [38, 28], [36, 36]],
      [[10, 34], [17, 31], [24, 37], [20, 44], [12, 42]],
    ];
    groups.forEach((g, gi) => {
      for (let i = 0; i + 1 < g.length; i++) p.line(g[i][0], g[i][1], g[i + 1][0], g[i + 1][1], gi === 1 ? 0x7ae0ff : gi === 2 ? 0xffb0e0 : 0xffe27a);
      g.forEach(([x, y], i) => {
        const r = i % 2 ? 2 : 3;
        p.poly(starPts(x, y, r + 1.4, (r + 1.4) * 0.4, 5), 0xffffff);
        p.disc(x, y, 1, gi === 1 ? 0x7ae0ff : gi === 2 ? 0xffb0e0 : 0xffe27a);
      });
    });
    p.line(20, 20, 12, 21, 0xffe27a);
    p.line(36, 36, 24, 37, 0x4a6ad0);
    p.stars(14, 5, 5, 41, 47, rng(5), [0xcfe3ff]);
    // Kompassrose rechts unten
    p.poly([38, 41, 40, 44, 38, 47, 36, 44], P.gold[3]); p.poly([38, 41, 36, 44, 38, 44], P.gold[4]);
    p.set(38, 40, 0xffffff);
  },

  // Weltenwanderer: Wanderer mit Stab und Sternkarte vor einer Weltkugel
  weltenwanderer(p) {
    p.vgrad(0, 0, 46, 52, [0x080a2a, 0x1a2464, 0x3a4a88]);
    p.stars(24, 0, 0, 46, 30, rng(90), [0xffffff, 0xcfe3ff, 0xfff2b0]);
    // Weltkugel mit Kontinenten
    glow(p, 31, 17, 18, 0x4a8ae8, 0.6);
    p.fig((q) => { q.ball(31, 17, 14, P.blue, 0.1); }, 0x0a1a58);
    const land = [P.green[2], P.lime[2]];
    p.poly([22, 12, 28, 8, 33, 11, 31, 17, 26, 20, 21, 17], land[0]);
    p.poly([33, 21, 39, 19, 42, 25, 38, 30, 34, 27], land[1]);
    p.poly([24, 22, 28, 22, 27, 28, 24, 26], land[1]);
    p.ellRing(31, 17, 14, 4, 0xcfe3ff, 1);
    p.path([31, 3, 31, 31], 0x7ab0f0, 1);
    p.set(24, 10, 0xffffff); p.set(25, 9, 0xffffff);
    // Hügel
    hills(p, 40, 3, 24, 0.6, 0x1a2a4a, 0x3a4a78);
    p.rect(0, 46, 46, 6, 0x0e1a30);
    // Wanderer
    p.fig((q) => {
      q.poly([5, 50, 7, 34, 11, 28, 18, 28, 21, 34, 22, 50], P.teal[2]);
      q.poly([5, 50, 7, 34, 11, 28, 13, 28, 12, 50], P.teal[3]);
      q.shadedEll(12, 24, 5, 5, P.teal, 0.08);
      q.poly([7, 30, 3, 36, 5, 44, 9, 38], P.tan[2]);
      q.line(24, 22, 24, 50, P.wood[3], 2);
    });
    p.disc(14, 24, 3, P.skin[3]); p.rect(13, 23, 1, 1, INK);
    p.rect(9, 20, 9, 2, P.teal[1]);
    // Stab mit Stern
    p.poly(starPts(24, 20, 3.2, 1.3, 5), 0xffe27a);
    // Sternkarte in der Hand
    p.fig((q) => { q.rect(15, 33, 9, 7, P.cream[3]); q.rect(15, 33, 9, 1, P.cream[4]); });
    p.set(17, 36, P.gold[2]); p.set(20, 35, P.gold[2]); p.set(22, 38, P.gold[2]); p.line(17, 36, 20, 35, P.gold[1]);
    p.sparkle(42, 42, 0xffe27a); p.sparkle(6, 10, 0xffffff);
  },

  // Weltenesche: riesiger Baum mit Sternen in der Krone, die Wurzeln leuchten
  weltenesche(p) {
    p.vgrad(0, 0, 46, 52, [0x060a2a, 0x121e58, 0x1e3a6a]);
    p.stars(14, 0, 0, 46, 20, rng(40), [0xffffff, 0xcfe3ff]);
    // Krone
    const crown: [number, number, number][] = [[23, 14, 12], [11, 18, 9], [35, 18, 9], [16, 8, 8], [30, 8, 8], [5, 24, 6], [41, 24, 6], [23, 24, 9]];
    for (const [x, y, r] of crown) p.fig((q) => { q.ball(x, y, r, P.forest, 0.18); }, 0x0a2a1c);
    const rg = rng(18);
    for (let i = 0; i < 70; i++) { const [x, y, r] = crown[Math.floor(rg() * crown.length)]; p.set(x + (rg() - 0.5) * r * 1.6, y + (rg() - 0.5) * r * 1.4, i % 2 ? P.lime[2] : P.green[3]); }
    // Stamm
    p.fig((q) => {
      q.poly([17, 52, 19, 34, 20, 26, 26, 26, 27, 34, 29, 52], P.darkwood[2]);
      q.poly([17, 52, 19, 34, 20, 26, 22, 26, 21, 52], P.darkwood[3]);
      q.poly([26, 26, 27, 34, 29, 52, 26, 52], P.darkwood[1]);
    });
    for (let y = 28; y < 50; y += 3) { p.set(22, y, P.darkwood[1]); p.set(25, y + 1, P.darkwood[0]); }
    // Wurzeln, leuchtend
    const root = (pts: number[]) => { p.path(pts, P.darkwood[1], 3); p.path(pts, 0x7aeaff, 1); };
    root([19, 46, 13, 46, 8, 50, 2, 51]); root([27, 46, 33, 46, 38, 50, 44, 51]);
    root([18, 40, 12, 41, 7, 45]); root([28, 40, 34, 41, 39, 45]);
    glow(p, 23, 48, 14, 0x4ab8ff, 0.7);
    // Sterne in der Krone
    for (const [x, y, r] of [[23, 8, 3], [13, 14, 2], [34, 13, 2.5], [8, 22, 2], [40, 21, 2], [20, 20, 2], [28, 22, 2], [23, 15, 2]] as [number, number, number][]) { p.poly(starPts(x, y, r + 1, (r + 1) * 0.42, 5), 0xffe27a); p.set(x, y, 0xffffff); }
    p.sparkle(3, 40, 0x7aeaff); p.sparkle(43, 38, 0x7aeaff);
  },

  // Goldquelle: Quelle, aus der Goldmünzen sprudeln, Mondlicht
  goldquelle(p) {
    p.vgrad(0, 0, 46, 52, [0x060a2a, 0x0e1a48, 0x1e3a58]);
    p.stars(12, 0, 0, 46, 14, rng(2), [0xffffff, 0xcfe3ff]);
    // Mondstrahlen
    moon(p, 8, 7, 5);
    glow(p, 8, 7, 12, 0x8aa0e0, 0.6);
    // Felswand mit Spalt
    p.fig((q) => {
      q.poly([14, 0, 46, 0, 46, 36, 34, 40, 20, 38, 12, 30, 16, 16], P.slate[1]);
      q.poly([14, 0, 24, 0, 22, 14, 18, 28, 12, 30, 16, 16], P.slate[2]);
      q.poly([34, 0, 46, 0, 46, 36, 38, 38, 36, 20], P.slate[0]);
    }, null);
    p.speckle(14, 0, 32, 38, P.slate[2], 0.1, rng(3));
    p.path([26, 8, 28, 16, 25, 24, 27, 30], INK, 2);
    // Moos
    for (const [x, y] of [[16, 20], [18, 30], [38, 30], [36, 34]] as [number, number][]) p.ell(x, y, 3, 1.5, P.forest[2]);
    // Münzen strömen aus der Spalte und fließen herunter
    for (let i = 0; i < 9; i++) { const y = 14 + i * 3; coinG(p, 26 + Math.sin(i) * 2, y, i % 3 === 0 ? 3 : 2); }
    p.path([27, 14, 26, 24, 28, 36], P.gold[3], 3);
    p.path([27, 14, 26, 24, 28, 36], P.gold[4], 1);
    // Becken
    p.rect(0, 40, 46, 12, 0x1a3a48);
    p.fig((q) => { q.ell(24, 44, 22, 6, P.stone[2]); q.ell(24, 43, 20, 5, P.stone[3]); }, null);
    p.ell(24, 43, 18, 4, 0x2a5a78); p.ell(24, 42, 12, 2, 0x4a8ab0);
    for (const [x, y, r] of [[12, 44, 2], [18, 46, 2], [30, 45, 3], [36, 43, 2], [24, 44, 3], [22, 41, 2]] as [number, number, number][]) coinG(p, x, y, r);
    glow(p, 26, 40, 12, 0xffd060, 0.6);
    p.sparkle(26, 36, 0xffffff, true); p.sparkle(38, 48, 0xffe27a); p.sparkle(8, 40, 0xffe27a); p.sparkle(14, 24, 0xcfe3ff);
  },

  // Urecho: konzentrische Wellen über der Sternwarte Kuppel, Ursprung ein Stern
  urecho(p) {
    p.vgrad(0, 0, 46, 52, [0x040618, 0x0c1240, 0x1c1a68, 0x3a2a88]);
    p.stars(26, 0, 0, 46, 38, rng(9), [0xffffff, 0xcfe3ff]);
    // Ringe um den Stern, nach außen blasser
    const rings: [number, Color][] = [[5, 0xfff0b0], [9, 0xffd060], [13, 0xf08a40], [17, 0xd05a88], [21, 0x8a4ab8], [25, 0x4a3aa0], [29, 0x2a2a78]];
    for (const [r, c] of rings) {
      for (let a = 0; a < 140; a++) { const t = (a / 140) * Math.PI * 2; const x = 23 + Math.cos(t) * r, y = 17 + Math.sin(t) * r; p.set(x, y, c); if (r < 14) p.set(x + 0.5, y, c); }
    }
    glow(p, 23, 17, 9, 0xffe27a, 0.9);
    p.poly(starPts(23, 17, 8, 2.8, 8), 0xffc43a);
    p.poly(starPts(23, 17, 5.5, 2, 8, -67), 0xffe27a);
    p.disc(23, 17, 2.5, 0xffffff);
    // Sternwarte unten
    hills(p, 46, 2, 20, 0.5, 0x0a0e2a, 0x2a2a68);
    p.fig((q) => {
      q.rect(12, 38, 22, 14, 0x14183e); q.shadedEll(23, 38, 11, 9, ramp(0x4a5a98), 0.08);
      q.rect(12, 38, 22, 1, 0x4a5a98);
    });
    p.poly([21, 29, 24, 29, 24, 38, 21, 38], 0x08081c);
    p.line(23, 34, 28, 26, P.steel[3], 3);
    p.rect(26, 24, 4, 3, P.steel[4]);
    p.rect(20, 42, 6, 9, 0x2a1a10); p.rect(15, 42, 3, 3, 0xffd060); p.rect(29, 42, 3, 3, 0xffd060);
    p.sparkle(6, 8, 0xffffff); p.sparkle(40, 10, 0xffe27a, true);
  },

  // Kometenschauer: Schwarm von Kometen mit langen Schweifen
  kometenschauer(p) {
    p.vgrad(0, 0, 46, 52, [0x06082a, 0x161e5a, 0x2a2a80, 0x4a2a88]);
    p.stars(30, 0, 0, 46, 36, rng(6), [0xffffff, 0xcfe3ff, 0xfff2b0]);
    const T = [0x3a3a98, 0x5a6ae0, 0x9ad0ff, 0xe0f4ff];
    comet(p, 36, 26, 4, 2, 5, T, 3);
    comet(p, 42, 12, 22, 0, 3, [0x4a2a88, 0x9a4ac8, 0xf09ae0, 0xffe0f8], 2);
    comet(p, 22, 34, 2, 20, 3, [0x7a3a38, 0xe0702a, 0xffc43a, 0xfff6d0], 2);
    comet(p, 14, 20, 2, 8, 2, T, 1.5);
    comet(p, 30, 14, 20, 2, 2, [0x4a2a88, 0xd05a98, 0xff9ac0, 0xffe0f0], 1.5);
    glow(p, 36, 26, 8, 0xcfe8ff, 0.8);
    // Hügel mit Sternwarte
    hills(p, 44, 2, 22, 0.6, 0x0a0e2a, 0x2a2a68);
    p.fig((q) => { q.rect(30, 38, 8, 14, 0x06081c); q.ell(34, 38, 4, 3, 0x06081c); q.rect(8, 41, 5, 11, 0x06081c); }, null);
    p.set(33, 44, 0xffc43a); p.set(10, 45, 0xffc43a);
    for (const [x, y] of [[40, 40], [44, 20], [10, 34], [26, 22]] as [number, number][]) p.sparkle(x, y, 0xe0f4ff);
  },

  // @@END
};
