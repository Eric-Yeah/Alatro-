import { INK, Pix, rng, ramp, type Color, type Ramp } from './jokerPix';
import { PAL as P, arcPts, flame, glow, hills, sky, starPts, type Sprite } from './jokerKit';

// Motive Gruppe D: Geld, Shop und Händler.

/** Goldmünze von vorn mit Rand. */
function coin(p: Pix, x: number, y: number, r: number) {
  if (r <= 3) {
    p.fig((q) => { q.disc(x, y, r, P.gold[3]); }, 0x4a2a08);
    p.set(x - 1, y - 1, P.gold[4]);
    p.set(x + 1, y + 1, P.gold[1]);
    if (r >= 3) p.set(x, y, P.gold[2]);
    return;
  }
  p.fig((q) => { q.ball(x, y, r, P.gold, 0.08); }, 0x4a2a08);
  p.ring(x, y, r - 1, P.gold[4], 1).set(x, y, P.gold[3]);
}

/** Würfel von vorn mit Augen (Anordnung nach Zahl 1 bis 6), Kantenlänge s. */
function die(p: Pix, x: number, y: number, s: number, n: number, face: Ramp, pip: Color) {
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

export const SPRITES_D: Record<string, Sprite> = {
  // Sparschwein: ein rosa Sparschwein schluckt eine Münze
  sparschwein(p) {
    p.vgrad(0, 0, 46, 52, [0x1a5a7a, 0x2a8aa0, 0x6ad0d0]);
    p.rect(0, 44, 46, 8, 0x1a4a58); p.rect(0, 44, 46, 1, 0x4a9aa8);
    coin(p, 24, 6, 5);
    p.fig((q) => {
      q.rect(11, 36, 5, 9, P.pink[1]); q.rect(30, 36, 5, 9, P.pink[1]);
      q.shadedEll(23, 29, 17, 12, P.pink, 0.1);
      q.disc(37, 26, 6, P.pink[3]);
      q.poly([8, 22, 4, 17, 11, 20], P.pink[2]);
      q.poly([30, 17, 31, 11, 36, 17], P.pink[2]);
      q.path([6, 26, 2, 24, 3, 20, 6, 20], P.pink[2], 1);
    });
    p.ell(41, 28, 4, 4, P.pink[2]); p.rect(40, 27, 1, 2, P.pink[0]); p.rect(42, 27, 1, 2, P.pink[0]);
    p.set(36, 23, INK); p.set(36, 24, INK);
    p.rect(17, 14, 9, 2, P.pink[0]);
    p.line(14, 34, 21, 36, P.pink[1]);
    p.rect(11, 43, 5, 2, P.pink[0]); p.rect(30, 43, 5, 2, P.pink[0]);
    p.rect(34, 30, 4, 1, P.pink[0]);
    for (const [x, y] of [[6, 42], [38, 44], [41, 40]] as [number, number][]) coin(p, x, y, 2);
    p.sparkle(8, 8, 0xffe27a); p.sparkle(40, 10, 0xffe27a);
  },

  // Münzquelle: Brunnen speit Münzen in hohem Bogen
  muenzquelle(p) {
    sky(p, [0x1a2a68, 0x3a5a98, 0x88b0c8], 8, 5, 38);
    hills(p, 34, 2, 18, 1, 0x2a6a4a);
    p.rect(0, 40, 46, 12, 0x2a6a4a);
    // Becken
    p.fig((q) => {
      q.ell(23, 44, 21, 6, P.stone[2]);
      q.ell(23, 42, 19, 4, P.stone[3]);
      q.rect(4, 43, 38, 5, P.stone[2]);
      q.rect(4, 43, 3, 5, P.stone[3]);
    });
    p.ell(23, 42, 17, 3, 0x4a98d8);
    p.ell(23, 41, 12, 1, 0x9ae0f8);
    for (const x of [10, 15, 30, 36]) coin(p, x, 42, 2);
    // Säule und Schale
    p.fig((q) => {
      q.rect(20, 22, 6, 20, P.stone[2]);
      q.rect(20, 22, 2, 20, P.stone[4]); q.rect(25, 22, 1, 20, P.stone[0]);
      q.ell(23, 22, 9, 3, P.stone[3]);
      q.rect(14, 22, 18, 3, P.stone[2]);
    });
    p.ell(23, 22, 7, 1, 0x4a98d8);
    // Münzen springen in Bögen
    const arcs: [number, number][] = [[-1, 1], [1, 1]];
    for (const [d] of arcs) {
      for (let i = 0; i < 4; i++) {
        const t = i / 3;
        const x = 23 + d * (3 + t * 17), y = 20 - Math.sin(t * Math.PI) * 14 + t * t * 6;
        coin(p, x, y, i === 1 ? 3 : 2);
      }
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        p.set(23 + d * (2 + t * 19), 21 - Math.sin(t * Math.PI) * 15 + t * t * 8, 0xc8f0ff);
      }
    }
    coin(p, 23, 8, 4);
    p.rect(23, 12, 1, 9, 0xc8f0ff);
    p.sparkle(8, 12, 0xffe27a); p.sparkle(38, 8, 0xffe27a); p.sparkle(23, 3, 0xffffff);
  },

  // Handarbeit: Wollknäuel mit Stricknadeln und einem Stück Gestricktem
  handarbeit(p) {
    p.vgrad(0, 0, 46, 52, [0xf0d8c8, 0xe8c0b8, 0xd8a0a0]);
    for (let y = 4; y < 44; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 46; x += 8) { p.set(x + 2, y, 0xf8e8e0); p.set(x + 2, y + 1, 0xf8e8e0); p.set(x + 1, y + 1, 0xf8e8e0); p.set(x + 3, y + 1, 0xf8e8e0); }
    p.rect(0, 44, 46, 8, P.wood[2]); p.rect(0, 44, 46, 1, P.wood[4]); p.rect(0, 47, 46, 1, P.wood[1]);
    // Gestricktes
    p.fig((q) => { q.rrect(24, 12, 17, 24, P.teal[2], 2); });
    for (let j = 0; j < 12; j++) for (let i = 0; i < 8; i++) {
      p.set(25 + i * 2, 14 + j * 2, P.teal[3]); p.set(26 + i * 2, 15 + j * 2, P.teal[1]);
    }
    p.rect(24, 12, 17, 2, P.teal[4]);
    // Nadeln
    p.fig((q) => { q.line(10, 8, 34, 34, P.wood[3], 2); q.line(38, 6, 14, 36, P.steel[3], 2); });
    p.disc(10, 8, 2, P.red[2]); p.disc(38, 6, 2, P.red[2]);
    // Knäuel
    p.fig((q) => { q.ball(14, 36, 10, P.red, 0.08); }, 0x4a1010);
    for (let i = 0; i < 5; i++) p.path(arcPts(14, 36, 9 - i * 1.2, 4 + i, 190 + i * 14, 300 + i * 6, 10), P.red[i % 2 ? 1 : 3], 1);
    p.path([24, 38, 30, 42, 36, 40], P.red[2], 1);
    p.sparkle(42, 6, 0xffffff);
  },

  // Zinsmeister: Rechenbrett mit bunten Perlen und Münzstapel
  zinsmeister(p) {
    p.vgrad(0, 0, 46, 52, [0x14382a, 0x1a4a38, 0x2a6a4a]);
    p.rect(0, 46, 46, 6, P.darkwood[1]); p.rect(0, 46, 46, 1, P.darkwood[3]);
    // Rahmen
    p.fig((q) => {
      q.rect(4, 6, 38, 36, P.wood[2]);
      q.rect(4, 6, 38, 2, P.wood[4]); q.rect(4, 40, 38, 2, P.wood[1]);
      q.rect(4, 6, 2, 36, P.wood[3]); q.rect(40, 6, 2, 36, P.wood[1]);
    });
    p.rect(7, 9, 32, 30, 0x2a1a10);
    const cols = [P.red, P.blue, P.yellow, P.green, P.purple];
    for (let r = 0; r < 5; r++) {
      const y = 12 + r * 6;
      p.rect(7, y + 1, 32, 1, P.iron[3]);
      const n = [4, 3, 6, 2, 5][r];
      for (let k = 0; k < 6; k++) {
        const x = k < n ? 9 + k * 4 : 39 - (6 - k) * 4 - 2;
        p.fig((q) => { q.ball(x + 1, y + 1, 2, cols[r], 0.05); }, null);
      }
    }
    p.rect(21, 9, 1, 30, 0x4a3a28);
    // Münzstapel vorn
    for (let i = 0; i < 5; i++) {
      p.fig((q) => { q.ell(38, 49 - i * 3, 5, 2, P.gold[i % 2 ? 2 : 3]); q.rect(33, 49 - i * 3, 11, 3, P.gold[2]); }, null);
      p.rect(33, 49 - i * 3, 11, 1, P.gold[4]); p.rect(33, 51 - i * 3, 11, 1, P.gold[1]);
    }
    p.ell(38, 35, 5, 2, P.gold[4]);
    p.text('%', 8, 44, 0xffe27a);
    p.sparkle(41, 31, 0xffe27a);
  },

  // Goldwäscher: Waschpfanne mit Goldkörnern im Bachwasser
  goldwaescher(p) {
    p.vgrad(0, 0, 46, 52, [0x2a6a5a, 0x3a9a88, 0x68c8b0]);
    const r = rng(90);
    for (let i = 0; i < 16; i++) p.rect(Math.floor(r() * 40), 3 + Math.floor(r() * 44), 4 + Math.floor(r() * 4), 1, 0xc8f8e8);
    // Ufer
    p.fig((q) => { q.poly([0, 52, 0, 38, 7, 42, 10, 52], P.stone[1]); q.poly([46, 52, 46, 40, 38, 44, 35, 52], P.stone[1]); }, null);
    p.ball(5, 47, 4, P.stone, 0.08); p.ball(41, 48, 4, P.slate, 0.08);
    // Pfanne
    p.fig((q) => {
      q.ell(23, 30, 19, 9, P.iron[2]);
      q.ell(23, 28, 19, 8, P.steel[3]);
    });
    p.ell(23, 28, 16, 6, P.iron[1]);
    p.ell(23, 29, 14, 5, 0x3a7a90);
    p.ell(23, 28, 11, 3, 0x5ab0c0);
    // Gold
    for (const [x, y, s] of [[18, 30, 2], [23, 31, 3], [28, 30, 2], [25, 28, 1], [20, 28, 1], [30, 28, 1]] as [number, number, number][]) {
      p.fig((q) => { q.ball(x, y, s, P.gold, 0.05); }, null);
    }
    p.set(22, 30, 0xffffff); p.set(18, 29, 0xffffff);
    p.sparkle(23, 22, 0xffe27a, true); p.sparkle(12, 22, 0xffe27a); p.sparkle(35, 21, 0xffe27a);
    // Wasserspritzer
    for (const [x, y] of [[4, 28], [42, 26], [8, 18], [38, 14]] as [number, number][]) { p.set(x, y, 0xffffff); p.set(x + 1, y + 1, 0xc8f8e8); }
    for (let i = 0; i < 5; i++) p.set(8 + i * 8, 42 + (i % 2) * 3, 0xe8fff8);
  },

  // Glückstaler: Goldmünze mit der Glückszahl vor Strahlen
  glueckstaler(p) {
    p.rays(23, 25, 9, 0xf8d848, 0xf0a828, 0.2);
    glow(p, 23, 25, 20, 0xfff6c0, 0.9);
    p.fig((q) => { q.ball(23, 25, 17, P.gold, 0.08); }, 0x5a2a08);
    p.ring(23, 25, 15, P.gold[4], 1);
    p.ring(23, 25, 11, P.gold[1], 1);
    for (let a = 0; a < 24; a++) {
      const t = (a / 24) * Math.PI * 2;
      p.set(23 + Math.cos(t) * 13, 25 + Math.sin(t) * 13, P.gold[a % 2 ? 4 : 2]);
    }
    p.textBig('7', 19, 18, P.gold[0], 3);
    p.textBig('7', 18, 17, P.gold[4], 3);
    p.sparkle(8, 8, 0xffffff, true); p.sparkle(39, 10, 0xffffff); p.sparkle(7, 38, 0xffffff); p.sparkle(40, 40, 0xffffff, true);
    p.rect(0, 46, 46, 6, 0x4a8a38); p.speckle(0, 46, 46, 6, 0x6aba48, 0.3, rng(2)); p.rect(0, 46, 46, 1, 0x8ada58);
    for (const [x, y] of [[8, 49], [36, 48]] as [number, number][]) {
      p.disc(x, y - 1, 1, P.lime[3]); p.disc(x + 2, y, 1, P.lime[3]); p.disc(x - 2, y, 1, P.lime[3]); p.disc(x, y + 1, 1, P.lime[3]);
    }
  },

  // Kartenhändler: Gestalt mit Kapuze fächert Karten über dem Filztisch
  kartenhaendler(p) {
    p.vgrad(0, 0, 46, 52, [0x0e2a22, 0x1a4a38, 0x24604a]);
    glow(p, 36, 8, 12, 0xf0c060, 0.6);
    p.fig((q) => { q.poly([30, 0, 34, 0, 33, 6, 31, 6], P.iron[2]); q.poly([28, 6, 36, 6, 38, 11, 26, 11], P.gold[2]); }, null);
    p.rect(0, 40, 46, 12, P.green[1]); p.speckle(0, 40, 46, 12, P.green[2], 0.15, rng(7)); p.rect(0, 40, 46, 1, P.darkwood[2]); p.rect(0, 41, 46, 1, P.darkwood[1]);
    // Gestalt
    p.fig((q) => {
      q.poly([8, 40, 10, 28, 16, 17, 23, 12, 30, 17, 36, 28, 38, 40], P.indigo[1]);
      q.poly([15, 22, 23, 10, 31, 22, 29, 30, 17, 30], P.indigo[2]);
    });
    p.ell(23, 23, 6, 7, P.skin[2]);
    p.poly([16, 18, 23, 9, 30, 18, 28, 21, 18, 21], P.indigo[2]);
    p.rect(17, 19, 12, 1, P.indigo[0]);
    p.rect(20, 22, 2, 2, 0xffffff); p.rect(25, 22, 2, 2, 0xffffff); p.set(21, 23, INK); p.set(26, 23, INK);
    p.rect(21, 28, 5, 1, 0x7a3a3a);
    // Kartenfächer
    const cardAt = (x: number, y: number, ang: number, pip: Color) => {
      const c = Math.cos(ang), s = Math.sin(ang);
      const pts = [[-4, -7], [4, -7], [4, 7], [-4, 7]].map(([a, b]) => [x + a * c - b * s, y + a * s + b * c]).flat();
      p.fig((q) => { q.poly(pts, 0xf8f4e8); }, INK);
      p.set(x + (-1) * c + 2 * s, y + (-1) * s - 2 * c, pip); p.set(x, y, pip); p.set(x + 1, y, pip);
    };
    cardAt(12, 38, -0.5, P.red[2]); cardAt(18, 36, -0.25, INK); cardAt(24, 35, 0, P.red[2]); cardAt(30, 36, 0.25, INK); cardAt(36, 38, 0.5, P.red[2]);
    for (const [x, y] of [[5, 46], [41, 47]] as [number, number][]) coin(p, x, y, 2);
    p.sparkle(8, 12, 0xffe27a);
  },

  // Beutezug: offene Schatztruhe mit Gold und Edelsteinen
  beutezug(p) {
    p.vgrad(0, 0, 46, 52, [0x0a1a2a, 0x143a4a, 0x1a5a5a]);
    glow(p, 23, 26, 22, 0xf0b040, 1);
    p.rect(0, 46, 46, 6, 0x1a2a2a); p.rect(0, 46, 46, 1, 0x3a5a5a);
    // Deckel hinten
    p.fig((q) => {
      q.poly([8, 28, 10, 8, 36, 8, 38, 28], P.wood[1]);
      q.rect(8, 8, 2, 20, P.wood[2]); q.rect(36, 8, 2, 20, P.wood[0]);
      q.rect(10, 8, 26, 2, P.wood[2]);
      q.rect(21, 8, 4, 20, P.iron[2]);
    });
    // Schatzhaufen
    p.poly([8, 34, 12, 26, 18, 20, 23, 14, 28, 20, 34, 26, 38, 34], P.gold[2]);
    for (const [x, y] of [[14, 28], [20, 22], [27, 22], [32, 28], [23, 18], [17, 32], [29, 32], [23, 28], [10, 33], [36, 33]] as [number, number][]) coin(p, x, y, 3);
    p.fig((q) => { q.poly([22, 12, 27, 12, 29, 16, 24, 21, 19, 16], ramp(0xe04a6a)[2]); }, 0x3a0a1a);
    p.poly([22, 12, 27, 12, 25, 16, 24, 14], 0xffb0c0);
    p.fig((q) => { q.poly([12, 24, 15, 24, 16, 27, 13, 31, 10, 27], ramp(0x40c0e8)[2]); }, 0x0a2a4a);
    p.set(12, 25, 0xffffff);
    p.fig((q) => { q.poly([32, 22, 35, 22, 36, 25, 33, 29, 30, 25], ramp(0x60d868)[2]); }, 0x0a3a1a);
    p.set(32, 23, 0xffffff);
    // Truhe vorn
    p.fig((q) => {
      q.rect(6, 32, 34, 15, P.wood[2]);
      q.rect(6, 32, 34, 2, P.wood[4]); q.rect(6, 45, 34, 2, P.wood[0]);
      q.rect(6, 32, 3, 15, P.iron[2]); q.rect(37, 32, 3, 15, P.iron[2]); q.rect(20, 32, 6, 15, P.iron[2]);
      for (let x = 11; x < 36; x += 4) if (x < 19 || x > 26) q.rect(x, 34, 1, 11, P.wood[1]);
    });
    p.rect(21, 37, 4, 4, P.gold[3]); p.rect(22, 38, 2, 2, INK);
    p.sparkle(5, 12, 0xffe27a); p.sparkle(40, 14, 0xffe27a); p.sparkle(23, 4, 0xffffff);
  },

  // Rentner: gemütlicher Alter mit Brille, Teetasse und Wanduhr
  rentner(p) {
    p.vgrad(0, 0, 46, 52, [0xd8b890, 0xc8a078, 0xa87850]);
    for (let x = 0; x < 46; x += 6) p.rect(x, 0, 1, 52, 0xb88a60);
    // Uhr an der Wand
    p.fig((q) => { q.disc(37, 11, 6, P.cream[4]); }, P.darkwood[1]);
    p.ring(37, 11, 6, P.gold[2], 1);
    p.line(37, 11, 37, 7, INK); p.line(37, 11, 40, 12, INK);
    // Gestalt
    p.fig((q) => {
      q.poly([4, 52, 6, 40, 14, 35, 32, 35, 40, 40, 42, 52], P.forest[2]);
      q.ell(23, 22, 9, 11, P.skin[3]);
      q.disc(13, 23, 2, P.skin[2]); q.disc(33, 23, 2, P.skin[2]);
    });
    p.ell(23, 22, 9, 11, P.skin[3]);
    p.rect(30, 17, 2, 9, P.skin[2]); p.rect(15, 28, 16, 1, P.skin[2]);
    p.ell(19, 27, 2, 1, P.pink[3]); p.ell(29, 27, 2, 1, P.pink[3]);
    // Haarkranz und Brauen
    p.rect(13, 16, 3, 9, P.white[4]); p.rect(30, 16, 3, 9, P.white[4]);
    p.rect(17, 12, 12, 1, P.white[3]);
    p.rect(17, 19, 4, 1, P.white[4]); p.rect(26, 19, 4, 1, P.white[4]);
    // Brille
    p.ring(19, 22, 3, P.gold[2], 1); p.ring(28, 22, 3, P.gold[2], 1); p.line(22, 22, 25, 22, P.gold[2]);
    p.set(19, 22, INK); p.set(28, 22, INK);
    // Schnurrbart, Mund
    p.poly([17, 28, 23, 26, 29, 28, 27, 31, 23, 29, 19, 31], P.white[4]);
    p.rect(21, 32, 5, 1, 0x7a3a3a);
    p.disc(23, 25, 2, P.skin[2]);
    // Strickjacke, Knöpfe
    p.rect(22, 36, 3, 16, P.forest[3]);
    for (const y of [40, 44, 48]) p.set(23, y, P.gold[3]);
    // Tasse
    p.fig((q) => { q.rect(30, 42, 8, 6, P.white[4]); q.rect(37, 43, 3, 3, P.white[4]); q.rect(30, 42, 8, 1, P.red[2]); }, INK);
    p.rect(31, 43, 6, 1, 0x7a4a2a);
    p.set(32, 38, 0xffffff); p.set(34, 37, 0xffffff); p.set(33, 40, 0xffffff);
  },

  // Würfelhand: zwei Würfel im Wurf über dem Filz
  wuerfelhand(p) {
    p.vgrad(0, 0, 46, 52, [0x1a4a38, 0x24704a, 0x3a9a5a]);
    p.speckle(0, 0, 46, 52, 0x2a8a52, 0.1, rng(40));
    p.ell(23, 46, 20, 5, 0x1a4a38);
    // Bewegungsstriche
    p.line(2, 14, 8, 20, 0xc8f8d8); p.line(3, 22, 7, 25, 0xc8f8d8); p.line(30, 6, 36, 10, 0xc8f8d8); p.line(40, 24, 43, 26, 0xc8f8d8);
    die(p, 7, 12, 15, 5, P.red, 0xffffff);
    die(p, 26, 21, 15, 3, P.white, INK);
    // Schatten
    p.ell(14, 38, 7, 1, 0x143a2a); p.ell(33, 43, 8, 2, 0x143a2a);
    p.sparkle(34, 8, 0xffffff); p.sparkle(42, 38, 0xffe27a); p.sparkle(6, 36, 0xffe27a);
  },

  // Marktschreier: Marktstand mit gestreifter Markise und lautem Horn
  marktschreier(p) {
    sky(p, [0x2a3a78, 0xb86a8a, 0xf0b070], 0, 1);
    // Wimpelkette
    p.path([0, 8, 12, 12, 23, 10, 34, 12, 46, 8], P.darkwood[3], 1);
    [[4, 0xff4c40], [12, 0xf5b32b], [20, 0x3fbf7f], [28, 0x0a8cff], [36, 0xff4c40], [43, 0xf5b32b]].forEach(([x, c], i) => {
      const y = 8 + Math.round(Math.sin(i * 1.4) * 2 + 2);
      p.poly([x - 2, y, x + 2, y, x, y + 5], c);
    });
    // Markise
    p.fig((q) => {
      q.rect(2, 16, 42, 8, P.red[2]);
      for (let x = 2; x < 44; x += 6) q.rect(x, 16, 3, 8, P.white[3]);
      for (let x = 2; x < 44; x += 6) { q.disc(x + 1, 25, 2, P.white[3]); q.disc(x + 4, 25, 2, P.red[2]); }
    });
    p.rect(2, 16, 42, 1, 0xffffff);
    // Stände
    p.rect(4, 22, 2, 28, P.darkwood[2]); p.rect(40, 22, 2, 28, P.darkwood[2]);
    // Theke
    p.fig((q) => { q.rect(4, 38, 38, 12, P.wood[2]); q.rect(4, 38, 38, 2, P.wood[4]); q.rect(4, 48, 38, 2, P.wood[0]); }, null);
    for (let x = 8; x < 42; x += 7) p.rect(x, 41, 1, 7, P.wood[1]);
    // Waren
    for (const [x, c] of [[9, P.red], [14, P.red], [11, P.red]] as [number, Ramp][]) p.ball(x, 36, 2, c, 0.05);
    p.fig((q) => { q.rect(24, 31, 4, 7, P.blue[2]); q.rect(25, 29, 2, 3, P.blue[3]); q.rect(30, 32, 4, 6, P.green[2]); q.rect(31, 30, 2, 3, P.green[3]); }, INK);
    p.set(24, 33, 0xffffff); p.set(30, 34, 0xffffff);
    // Ausrufer mit Horn
    p.fig((q) => {
      q.ell(15, 28, 4, 5, P.skin[2]);
      q.rect(11, 33, 9, 5, P.blue[1]);
      q.poly([19, 27, 31, 20, 31, 32, 19, 29], P.gold[2]);
      q.poly([19, 27, 31, 20, 31, 23, 19, 28], P.gold[4]);
      q.poly([11, 24, 15, 22, 19, 24, 18, 26, 12, 26], P.red[2]);
    });
    p.set(14, 27, INK);
    p.path(arcPts(31, 26, 5, 8, -55, 55, 8), 0xffffff, 1);
    p.path(arcPts(31, 26, 9, 12, -50, 50, 10), 0xffe8b0, 1);
  },

  // Kundenkarte: Treuekarte mit Stempeln und Prozentzeichen
  kundenkarte(p) {
    p.checks(0, 0, 46, 52, 5, 5, 0x1a6a78, 0x2a8a98);
    p.rect(0, 46, 46, 6, 0x0e3a48);
    p.fig((q) => { q.rrect(5, 6, 36, 38, P.cream[3], 2); }, INK);
    p.rect(6, 7, 34, 1, 0xffffff);
    p.rect(5, 7, 36, 8, P.orange[2]);
    p.rect(6, 7, 34, 1, P.orange[4]);
    p.text('%', 8, 8, 0xffffff); p.text('%', 13, 8, 0xffe8b0);
    p.poly(starPts(34, 11, 3, 1.3, 5), 0xffe27a);
    // Stempelraster 4 mal 3
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
      const x = 10 + i * 8, y = 22 + j * 7;
      const filled = j * 4 + i < 8;
      if (filled) {
        p.disc(x, y, 3, [P.red[2], P.blue[2], P.green[2]][(i + j) % 3]);
        p.set(x, y, 0xffffff); p.set(x - 1, y, 0xe8e8e8);
      } else {
        p.ring(x, y, 3, P.iron[3], 1);
      }
    }
    p.line(9, 18, 37, 18, P.cream[1]);
    p.rect(7, 40, 14, 2, P.cream[1]);
    // Münze und Schleife daneben
    p.fig((q) => { q.rect(36, 40, 8, 6, P.red[2]); }, null);
    coin(p, 40, 46, 3);
    p.sparkle(42, 6, 0xffffff); p.sparkle(4, 48, 0xffe27a);
  },

  // Hehler: Gestalt im Mantel mit Beute unter dem Stoff, Laterne in der Gasse
  hehler(p) {
    p.vgrad(0, 0, 46, 52, [0x0a1218, 0x14262e, 0x1e3a42]);
    for (let y = 0; y < 52; y += 5) { p.rect(0, y, 46, 1, 0x0e1c24); for (let x = (y / 5) % 2 ? 3 : 8; x < 46; x += 10) p.rect(x, y + 1, 1, 4, 0x0e1c24); }
    glow(p, 6, 14, 14, 0xd89a40, 0.9);
    p.fig((q) => { q.rect(5, 6, 2, 30, P.iron[1]); q.rect(2, 3, 8, 8, P.iron[2]); q.rect(3, 4, 6, 6, 0xffc060); q.poly([1, 3, 6, 0, 11, 3], P.iron[2]); }, null);
    p.rect(4, 5, 4, 4, 0xfff0b0);
    p.rect(0, 46, 46, 6, 0x0a1218);
    // Gestalt
    p.fig((q) => {
      q.poly([12, 52, 14, 28, 20, 20, 26, 20, 32, 28, 38, 28, 40, 52], P.teal[0]);
      q.poly([14, 52, 15, 29, 21, 22, 25, 22, 31, 29, 33, 52], P.teal[1]);
      q.ell(26, 15, 6, 6, P.skin[1]);
      // Hut
      q.rect(17, 11, 20, 2, 0x14101c); q.poly([20, 11, 21, 4, 32, 4, 33, 11], 0x1e1830);
      q.rect(20, 8, 13, 2, 0x4a3a28);
    });
    p.rect(21, 14, 11, 2, 0x0e0a14);
    p.set(23, 15, 0xffe060); p.set(29, 15, 0xffe060);
    p.rect(24, 20, 5, 1, 0x3a2a30);
    // offener Mantel mit Uhren und Ketten
    p.rect(21, 28, 10, 20, 0x2a1e2a);
    for (const [x, y] of [[23, 31], [28, 31], [23, 37], [28, 37], [25, 43]] as [number, number][]) { p.disc(x, y, 2, P.gold[2]); p.set(x, y - 1, P.gold[4]); p.set(x, y, INK); }
    p.line(22, 28, 24, 30, P.gold[3]); p.line(30, 28, 28, 30, P.gold[3]);
    p.path([22, 40, 24, 44, 28, 44, 30, 40], P.gold[3], 1);
    p.sparkle(34, 36, 0xffe27a); p.sparkle(19, 33, 0xfff0b0);
  },

  // Lagerfeuer: Zelt und Feuer unter dem Sternenhimmel
  lagerfeuer(p) {
    sky(p, [0x0a1030, 0x1a2a68, 0x3a4a88], 26, 123);
    hills(p, 32, 3, 28, 2, 0x1a2a50, 0x3a4a78);
    p.rect(0, 40, 46, 12, 0x1a3a2a); p.rect(0, 40, 46, 1, 0x3a6a4a); p.speckle(0, 41, 46, 11, 0x2a5a3a, 0.2, rng(3));
    glow(p, 26, 42, 18, 0xe0702a, 1);
    // Zelt
    p.fig((q) => {
      q.poly([2, 44, 14, 20, 26, 44], P.orange[2]);
      q.poly([14, 20, 26, 44, 16, 44], P.orange[1]);
      q.poly([2, 44, 14, 20, 12, 44], P.orange[3]);
      q.poly([12, 44, 14, 26, 18, 44], 0x2a1a20);
    });
    p.line(14, 20, 14, 17, P.darkwood[3]); p.poly([14, 16, 19, 17, 14, 19], P.red[2]);
    // Feuer
    p.fig((q) => {
      q.line(22, 48, 38, 43, P.darkwood[2], 3);
      q.line(22, 43, 38, 48, P.darkwood[1], 3);
    });
    flame(p, 30, 26, 18, true);
    flame(p, 24, 34, 10, false, -1);
    flame(p, 36, 35, 9, false, 1);
    p.sparkle(26, 22, 0xff9a2a); p.set(34, 18, 0xffc43a); p.set(37, 12, 0xffc43a); p.set(22, 15, 0xff9a2a);
    p.fig((q) => { q.disc(8, 49, 2, P.stone[1]); q.disc(12, 50, 2, P.stone[2]); q.disc(40, 50, 2, P.stone[1]); }, null);
  },
};
