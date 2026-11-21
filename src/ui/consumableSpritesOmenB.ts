import type { Pix } from './jokerPix';
import {
  INK, PAL as P, arcPts, bayer, cloud, cosmos, dust, glow, heartShape, hills, lit, ramp, rng, star4, type Sprite,
} from './consumableKit';
import { flame } from './jokerKit';

// Omen B: zehn weitere dunkle Karten in Violett und Silber, jede mit eigener Szene. Fläche 40 mal 40, Mitte x = 20.

/** Gedrehte Karte (Winkel in Grad) mit Rand, Mitte cx, cy. */
function tiltCard(p: Pix, cx: number, cy: number, deg: number, w: number, h: number, face = 0xf4efe0) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const pt = (dx: number, dy: number): [number, number] => [cx + dx * c - dy * s, cy + dx * s + dy * c];
  const corners = [pt(-w / 2, -h / 2), pt(w / 2, -h / 2), pt(w / 2, h / 2), pt(-w / 2, h / 2)].flat();
  p.fig((q) => q.poly(corners, (x, y) => {
    const l = ((x - cx) * 0.6 + (y - cy) * 0.75) / Math.max(w, h);
    return l > 0.28 ? 0xc8c0a8 : l < -0.28 ? 0xffffff : face;
  }));
}

/** Narrenkappe mit drei Zipfeln und Glöckchen, Mitte cx, Unterkante des Bundes y, Maßstab s (1 = 26 Bildpunkte breit). */
function jester(p: Pix, cx: number, y: number, s = 1, ghost = false) {
  const X = (d: number) => cx + d * s;
  const Y = (d: number) => y - d * s;
  const horn = (pts: number[], c: number, hi: number, hx: number, hy: number) => {
    p.fig((q) => q.poly(pts, c));
    p.line(hx, hy, pts[0] + (pts[2] - pts[0]) * 0.1, pts[1], hi);
  };
  // seitliche Zipfel zuerst, der mittlere liegt davor
  horn([X(-10), y, X(-1), y, X(-12.5), Y(12)], 0xe0457a, 0xff9ab8, X(-11), Y(10));
  horn([X(10), y, X(1), y, X(12.5), Y(12)], 0x3aa6c8, 0x9ae8ff, X(11), Y(10));
  horn([X(-5), y, X(5), y, X(0), Y(16)], 0x8a52d0, 0xc8a0f8, X(-1), Y(12));
  // Bund
  p.rect(X(-10) - 1, y - 2, Math.round(20 * s) + 3, 5, INK);
  p.rect(X(-10), y - 1, Math.round(20 * s) + 1, 3, 0xf2b92c);
  p.rect(X(-10), y - 1, Math.round(20 * s) + 1, 1, 0xffe27a);
  p.rect(X(-10), y + 1, Math.round(20 * s) + 1, 1, 0xa8741c);
  // Glöckchen
  for (const [bx, by] of [[X(-13), Y(13)], [X(0), Y(17)], [X(13), Y(13)]] as [number, number][]) {
    p.fig((q) => q.disc(bx, by, 1.8, 0xf2b92c));
    p.set(bx - 1, by - 1, 0xfff0a8);
  }
  if (ghost) {
    // Geisterkopie: jeder zweite Bildpunkt wird dunkel
    for (let j = 0; j < 40; j++) for (let i = 0; i < 40; i++) {
      if (i < cx - 16 * s || i > cx + 16 * s || j < y - 20 * s || j > y + 4) continue;
      if ((i + j) % 3 === 0 && p.get(i, j) !== -1 && p.get(i, j) !== 0x2a1048 && p.get(i, j) !== 0x14081e) p.set(i, j, 0x2a1a48);
    }
  }
}

/** Violette Flamme mit hellem Kern, Spitze bei (x, y). */
function violetFlame(p: Pix, x: number, y: number, h: number) {
  const maxw = h / 2.6;
  for (let j = 0; j < h; j++) {
    const t = (j + 0.5) / h;
    const half = maxw * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.6)), 0.7);
    for (let i = Math.round(x - half); i <= Math.round(x + half); i++) {
      const d = Math.abs(i - x) / Math.max(0.5, half);
      let c = 0x6a2fa8;
      if (d < 0.8 && t > 0.2) c = 0xa84ad8;
      if (d < 0.55 && t > 0.38) c = 0xe08af0;
      if (d < 0.3 && t > 0.55) c = 0xffffff;
      p.set(i, y + j, c);
    }
  }
}

export const SPRITES_OMEN_B: Record<string, Sprite> = {
  // Gestirnsopfer: auf einem Altar lodert ein Stern, die kleinen Sterne ringsum verlöschen
  omen_gestirnsopfer(p) {
    cosmos(p, [0x0c0822, 0x241448, 0x3a1c5c], 311, { stars: 8, clouds: [[20, 14, 22, 12, 0x6a3a9a, 0.5]] });
    glow(p, 20, 16, 17, 0xffd860, 0.9);
    // verlöschende Sterne: matt, grau, einige schon nur noch ein Punkt
    for (const [x, y] of [[5, 6], [10, 12], [4, 17], [34, 7], [30, 13], [36, 19], [8, 24], [32, 25]]) {
      p.set(x, y, 0x9a90b8); p.set(x - 1, y, 0x6a5a88); p.set(x + 1, y, 0x6a5a88); p.set(x, y - 1, 0x6a5a88); p.set(x, y + 1, 0x6a5a88);
    }
    for (const [x, y] of [[12, 4], [28, 3], [6, 30], [35, 31], [24, 8], [14, 20]]) p.set(x, y, 0x4a3c68);
    p.fig((q) => star4(q, 20, 16, 11, 0xffd860, 0xffffff, 0.3), 0x8a5a18);
    star4(p, 20, 16, 10, 0xffd860, 0xfff8d8, 0.3);
    p.poly([20, 6, 21.5, 14.5, 20, 16, 18.5, 14.5], 0xfff0b8);
    p.sparkle(20, 16, 0xfff8d8, true);
    // Altar
    p.fig((q) => { q.rect(9, 32, 22, 8, 1); q.rect(12, 29, 16, 3, 1); });
    p.rect(9, 33, 22, 7, P.stone[1]); p.rect(9, 33, 22, 1, P.stone[3]);
    p.rect(12, 30, 16, 2, P.stone[2]); p.rect(12, 29, 16, 1, P.stone[4]);
    for (let x = 13; x < 31; x += 6) p.rect(x, 35, 1, 5, P.stone[0]);
    // Schale mit Glut
    p.ell(20, 29, 7, 2, P.stone[0]);
    p.ell(20, 28, 6, 1.4, 0xff8a2a);
    p.rect(17, 27, 6, 1, 0xffd860);
    p.sparkle(14, 22, 0xffe27a); p.sparkle(27, 22, 0xffe27a);
  },

  // Lichtschleifer: eine Narrenkappe wird am Schleifstein geschliffen, Funken sprühen in Regenbogenfarben
  omen_lichtschleifer(p) {
    cosmos(p, [0x14081e, 0x2a1a48, 0x4a2a6a], 321, { stars: 8, clouds: [[14, 12, 20, 12, 0x8a52d0, 0.5]] });
    glow(p, 18, 20, 14, 0xe0a8ff, 0.5);
    jester(p, 14, 29);
    // Schleifstein rechts unten
    lit(p, (q) => q.disc(29, 29, 9, 1), 29, 29, 10, P.stone, INK, 2.2);
    p.ring(29, 29, 7, P.stone[1]);
    p.disc(29, 29, 2.5, P.iron[3]); p.disc(29, 29, 1, P.iron[0]);
    p.line(29, 29, 29, 22, P.stone[1]); p.line(29, 29, 22, 33, P.stone[1]);
    // Gestell
    p.rect(26, 37, 7, 2, P.darkwood[2]);
    p.rect(28, 29, 3, 8, P.darkwood[2]);
    // Funken in Regenbogenfarben
    const cols = [0xff6a6a, 0xffd860, 0x6aff9a, 0x6ac8ff, 0xd88aff];
    [[22, 24], [20, 22], [24, 20], [19, 26], [23, 17], [17, 19]].forEach(([x, y], i) => { p.set(x, y, cols[i % cols.length]); p.set(x + 1, y - 1, 0xffffff); });
    p.line(21, 27, 23, 25, 0xffe8a0);
    p.sparkle(33, 14, 0xffffff, true); p.sparkle(6, 9, 0xe8c8ff); p.sparkle(8, 34, 0xffffff);
    p.rect(0, 38, 40, 2, 0x14081a);
  },

  // Zwillingsflamme: zwei Narrenkappen, eine nur als Schatten, dazwischen eine Flamme, unten ein Riss
  omen_zwillingsflamme(p) {
    cosmos(p, [0x14081e, 0x2a1048, 0x4a1a6a], 331, { stars: 8, clouds: [[20, 20, 24, 12, 0x8a2aa8, 0.5]] });
    glow(p, 20, 20, 12, 0xd868f0, 0.7);
    jester(p, 9, 29, 0.72);
    jester(p, 31, 29, 0.72, true);
    violetFlame(p, 20, 9, 20);
    // Funkenbrücke
    p.path(arcPts(20, 26, 8, 4, 200, 340, 10), 0xe8a8ff);
    // Riss im Boden
    p.rect(0, 33, 40, 7, 0x1a0e2a);
    p.rect(0, 33, 40, 1, 0x4a3a68);
    p.path([20, 33, 18, 35, 21, 36, 19, 38, 21, 40], 0xe8d8ff);
    p.path([20, 33, 22, 35, 21, 36], 0x8a52d0);
    dust(p, [[4, 8], [35, 6], [14, 5], [27, 4]], [0xe8a8ff, 0xffffff]);
  },

  // Kometenschweif: ein Komet zieht über den Himmel, unten liegt eine halbe Münze
  omen_kometenschweif(p) {
    p.vgrad(0, 0, 40, 40, [0x080616, 0x180c38, 0x301a58]);
    p.stars(14, 0, 0, 40, 36, rng(341));
    // Schweif: gestreuter Fächer vom Kopf nach links unten
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const dx = 30 - x, dy = y - 10;
      if (dx <= 0 || dy < -2) continue;
      const along = (dx * 0.8 + dy * 0.55) / 40;
      const dist = Math.abs(dx * 0.55 - dy * 0.8);
      const width = 1 + along * 11;
      if (dist > width) continue;
      const k = (1 - dist / width) * (1 - along * 1.1);
      if (k > bayer(x, y)) p.set(x, y, k > 0.65 ? 0xffffff : k > 0.4 ? 0xb8d8ff : 0x6a8ad8);
    }
    glow(p, 30, 10, 11, 0xd8e8ff, 0.9);
    p.ball(30, 10, 5, ramp(0xe8f0ff), 0.08);
    p.sparkle(30, 10, 0xffffff, true);
    // halbe Münze
    p.fig((q) => { for (let y = 24; y <= 38; y++) for (let x = 22; x <= 30; x++) if ((x - 30) ** 2 + (y - 31) ** 2 <= 49) q.set(x, y, 1); });
    for (let y = 24; y <= 38; y++) for (let x = 22; x <= 30; x++) {
      const d2 = (x - 30) ** 2 + (y - 31) ** 2;
      if (d2 > 49) continue;
      p.set(x, y, d2 < 14 ? 0xf2b92c : d2 < 40 ? 0xe0a020 : 0xa8741c);
    }
    p.rect(22, 25, 3, 1, 0xffe27a); p.rect(23, 26, 2, 1, 0xffe27a);
    p.line(30, 24, 30, 38, 0xffe27a);
    p.set(26, 31, 0xa8741c); p.rect(26, 29, 1, 5, 0xa8741c);
    // fehlende Hälfte als gestrichelter Umriss
    for (let a = -90; a <= 90; a += 12) {
      const r = (a * Math.PI) / 180;
      p.set(30 + Math.cos(r) * 7.2, 31 + Math.sin(r) * 7.2, 0x6a5a88);
    }
    p.sparkle(8, 30, 0xb8d0ff); p.sparkle(35, 20, 0xffffff);
    p.rect(0, 39, 40, 1, 0x14081a);
  },

  // Nachtauge: ein riesiges Auge mit Sternenpupille, darunter Aschereste dreier Karten
  omen_nachtauge(p) {
    cosmos(p, [0x0c0822, 0x241448, 0x3a1c5c], 351, { stars: 10, clouds: [[20, 20, 24, 14, 0x6a3a9a, 0.5]] });
    // Augenform: oberer und unterer Bogen
    const upper = arcPts(20, 20, 18, 12, 180, 360, 24);
    const lower = arcPts(20, 20, 18, 11, 0, 180, 24);
    p.poly([...upper, ...lower], 0xe8e0f8);
    // Lidschatten oben, Licht unten
    for (let x = 3; x < 38; x++) for (let y = 6; y < 36; y++) {
      if (p.get(x, y) !== 0xe8e0f8) continue;
      const top = y < 11 + Math.abs(x - 20) * 0.15;
      if (top) p.set(x, y, (x + y) % 2 === 0 ? 0xb8a8e0 : 0xd0c4ec);
      else if (y > 29) p.set(x, y, 0xcfc4e8);
    }
    p.path(upper, INK, 2);
    p.path(lower, INK);
    // Wimpern
    for (const x of [8, 12, 16, 20, 24, 28, 32]) {
      const y = 20 - Math.sqrt(Math.max(0, 1 - ((x - 20) / 18) ** 2)) * 12;
      p.line(x, y, x + (x < 20 ? -1 : 1), y - 3, INK);
    }
    // Iris und Pupille
    p.ball(20, 20, 9, ramp(0x7a3ad0), 0.1);
    p.ring(20, 20, 9, 0xf2b92c);
    p.ring(20, 20, 5.5, 0xb88af0);
    p.disc(20, 20, 4, 0x0c0822);
    star4(p, 20, 20, 3.2, 0xffe8a0, 0xffffff, 0.3);
    p.set(15, 15, 0xffffff); p.set(16, 14, 0xffffff); p.set(14, 16, 0xe8d8ff);
    // Ascheflocken und Reste dreier Karten
    for (const [x, y, r] of [[5, 34, 0], [35, 33, 1], [20, 37, 2]] as [number, number, number][]) {
      p.rect(x - 1, y, 3, 3, r === 1 ? 0xc8c0a8 : 0x8a8498);
      p.set(x - 1, y, 0x3a2c58); p.set(x + 1, y + 2, 0x3a2c58);
    }
    dust(p, [[12, 36], [28, 35], [8, 31], [32, 37]], [0x8a8498, 0x6a5a88]);
    p.sparkle(34, 8, 0xffffff); p.sparkle(5, 8, 0xe8c8ff);
  },

  // Alchemistenbeutel: ein praller Lederbeutel, aus dem Kolben, Rolle und Stern ragen
  omen_alchemistenbeutel(p) {
    cosmos(p, [0x14081e, 0x2a1a48, 0x4a2a6a], 361, { stars: 10, clouds: [[20, 14, 22, 12, 0x8a52d0, 0.5]] });
    glow(p, 20, 12, 12, 0xffe27a, 0.5);
    // ragende Dinge: Kolben links, Pergamentrolle rechts, Stern oben
    p.fig((q) => { q.ball(11, 14, 4, ramp(0x3fae55), 0.1); q.rect(10, 6, 3, 6, P.glass[2]); });
    p.rect(10, 7, 1, 4, 0xffffff); p.rect(10, 4, 3, 3, P.tan[2]); p.rect(10, 4, 1, 2, P.tan[4]);
    p.fig((q) => q.poly([26, 20, 33, 8, 37, 10, 30, 22], 0xe8dcc0));
    p.poly([27, 19, 33, 9, 34, 9.5, 28, 20], 0xfff4d8);
    p.ell(35, 9, 2, 1.6, 0xc8b898);
    p.set(35, 9, 0x8a6a48);
    star4(p, 20, 7, 6, 0xffd860, 0xffffff, 0.28);
    p.line(20, 12, 20, 18, P.wood[3]);
    // Beutel
    lit(p, (q) => { q.ell(20, 29, 13, 10, 1); q.rect(14, 18, 12, 6, 1); }, 17, 24, 16, P.tan, INK, 2.2);
    // Schnur und Knoten
    p.rect(13, 19, 14, 3, INK);
    p.rect(14, 20, 12, 1, P.gold[3]); p.rect(14, 19, 12, 1, P.gold[4]);
    p.disc(20, 22, 2, P.gold[2]); p.set(19, 21, P.gold[4]);
    p.line(18, 23, 16, 27, P.gold[2]); p.line(22, 23, 24, 27, P.gold[2]);
    p.set(16, 28, P.gold[3]); p.set(24, 28, P.gold[3]);
    // Stoffnähte und Stern Flicken
    for (const [x, y] of [[10, 30], [10, 33], [30, 30], [30, 33], [14, 37], [26, 37]]) p.set(x, y, P.tan[0]);
    star4(p, 20, 31, 4, 0xf2b92c, 0xfff0a8, 0.4);
    p.sparkle(5, 24, 0xffffff); p.sparkle(35, 30, 0xe8c8ff); p.sparkle(31, 4, 0xffffff);
    p.rect(0, 38, 40, 2, 0x14081a);
  },

  // Abendruhe: zwei Karten gleiten in einen Korb, dahinter geht die Sonne unter
  omen_abendruhe(p) {
    p.vgrad(0, 0, 40, 40, [0x2a1450, 0x7a2a6a, 0xe0705a, 0xf8b070]);
    p.stars(10, 0, 0, 40, 14, rng(371));
    // Mondsichel
    p.disc(8, 8, 4, 0xf0e8c8); p.disc(10, 7, 3.6, 0x4a2060);
    glow(p, 11, 27, 13, 0xffc080, 0.8);
    p.ball(11, 28, 7, ramp(0xffc860), 0.06);
    hills(p, 29, 2, 18, 0.3, 0x3a1a4a, 0x6a3a6a);
    hills(p, 33, 1.5, 12, 1.2, 0x1a0c2a, 0x2a1a3a);
    // zwei gleitende Karten
    tiltCard(p, 21, 18, -18, 7, 9);
    tiltCard(p, 30, 10, 16, 7, 9);
    p.set(21, 18, 0xf2b92c); p.set(30, 10, 0xf2b92c);
    p.line(26, 14, 28, 17, 0xffc8a0); p.line(17, 25, 18, 27, 0xffc8a0);
    p.line(33, 16, 34, 19, 0xffb890); p.line(24, 24, 25, 26, 0xffc8a0);
    // Korb
    p.fig((q) => q.poly([17, 29, 37, 29, 35, 38, 19, 38], 1));
    p.poly([17, 29, 37, 29, 35, 38, 19, 38], P.tan[2]);
    for (let y = 30; y < 38; y += 2) p.rect(17, y, 20, 1, P.tan[1]);
    for (let x = 19, r = 0; x < 36; x += 4, r++) for (let y = 30 + (r % 2); y < 38; y += 2) p.set(x, y, P.tan[4]);
    p.rect(16, 28, 22, 2, P.tan[3]); p.rect(16, 28, 22, 1, P.tan[4]);
    p.rect(16, 29, 22, 1, P.tan[0]);
    // zwei Kartenkanten im Korb
    p.rect(20, 26, 5, 3, 0xf4efe0); p.rect(27, 25, 5, 4, 0xe8e0cc);
    p.sparkle(34, 8, 0xfff0d0); p.sparkle(5, 24, 0xffd8b0);
  },

  // Prismenopfer: eine Karte strahlt im Regenbogen, zwei andere verbrennen am Altar
  omen_prismenopfer(p) {
    cosmos(p, [0x0c0822, 0x241448, 0x3a1c5c], 381, { stars: 8, clouds: [[20, 16, 22, 12, 0x6a3a9a, 0.5]] });
    // bunte Strahlen
    const cols = [0xff6a6a, 0xffb84a, 0xfff06a, 0x6aff9a, 0x6ac8ff, 0xb88aff];
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI * (0.1 + (i / 11) * 0.8);
      p.line(20 + Math.cos(a) * 12, 19 + Math.sin(a) * 12, 20 + Math.cos(a) * 21, 19 + Math.sin(a) * 21, cols[i % cols.length]);
    }
    glow(p, 20, 19, 14, 0xf0d8ff, 0.7);
    // Mittelkarte mit Regenbogenbändern
    p.rect(13, 6, 15, 24, INK);
    for (let y = 7; y < 29; y++) for (let x = 14; x < 27; x++) {
      const band = Math.floor((x + y * 0.7) / 3.4) % cols.length;
      p.set(x, y, cols[band]);
    }
    p.rect(14, 7, 13, 1, 0xffffff);
    star4(p, 20, 18, 6, 0xffffff, 0xffffff, 0.3);
    p.rect(26, 8, 1, 21, 0x2a1a48);
    // zwei verbrennende Karten
    tiltCard(p, 6, 28, -16, 7, 10, 0xd8c8b0); tiltCard(p, 34, 28, 16, 7, 10, 0xd8c8b0);
    for (const cx of [6, 34]) {
      for (let y = 23; y < 33; y++) for (let x = cx - 4; x <= cx + 4; x++) {
        if (p.get(x, y) === 0xd8c8b0 && y < 26 + ((x * 3) % 3)) p.set(x, y, 0x3a2a30);
      }
    }
    flame(p, 6, 20, 10, false, -0.2); flame(p, 34, 20, 10, false, 0.2);
    // Altarplatte
    p.rect(0, 33, 40, 7, 0x1a1030);
    p.rect(0, 33, 40, 1, P.stone[2]); p.rect(0, 34, 40, 1, P.stone[1]);
    for (let x = 3; x < 40; x += 8) p.rect(x, 36, 1, 4, 0x2a1a48);
    dust(p, [[10, 14], [30, 12], [3, 18], [37, 17], [12, 5]], [0xffd860, 0xffffff, 0xff8a2a]);
  },

  // Wandlung: ein Schmetterling schlüpft aus einer geplatzten Puppe
  omen_wandlung(p) {
    cosmos(p, [0x14081e, 0x2a1a58, 0x5a2a8a], 391, { stars: 10, clouds: [[20, 18, 24, 14, 0x9a5ad8, 0.5]] });
    glow(p, 20, 20, 15, 0xe8b0ff, 0.6);
    const wing = (sx: number) => {
      const X = (dx: number) => 20 + sx * dx;
      const colour = (x: number, y: number) => {
        const d = Math.hypot(x - 20, y - 20) / 17;
        return d < 0.3 ? 0x6a2fa8 : d < 0.5 ? 0xa84ad8 : d < 0.7 ? 0xf2b92c : 0xffe27a;
      };
      // Vorderflügel und Hinterflügel
      p.fig((q) => q.poly([X(1.5), 18, X(16), 4, X(18), 14, X(11), 22, X(1.5), 22], colour));
      p.fig((q) => q.poly([X(1.5), 22, X(12), 24, X(15), 33, X(5), 31, X(1.5), 26], colour));
      // Augenflecken und Adern
      p.disc(X(11), 13, 2.2, 0x120a22); p.disc(X(11), 13, 1.2, 0xffffff); p.set(X(11), 13, 0xe0457a);
      p.disc(X(9), 28, 1.8, 0x120a22); p.set(X(9), 28, 0x6ac8ff); p.set(X(9) - sx, 27, 0xffffff);
      p.line(X(2), 19, X(14), 7, 0x6a2fa8); p.line(X(2), 22, X(11), 26, 0x6a2fa8);
    };
    wing(-1); wing(1);
    // Körper
    p.fig((q) => { q.ell(20, 22, 1.8, 7, 1); });
    p.ell(20, 22, 1, 6, 0x2a1448);
    p.set(19, 17, 0x8a52d0); p.set(19, 20, 0x8a52d0);
    p.disc(20, 14, 1.6, 0x2a1448);
    p.line(19, 13, 15, 6, INK); p.line(21, 13, 25, 6, INK);
    p.set(15, 5, 0xffe27a); p.set(25, 5, 0xffe27a);
    // geplatzte Puppe unten
    p.fig((q) => { q.ell(20, 36, 5, 2.5, 1); });
    p.ell(20, 36, 4, 2, P.tan[1]); p.rect(16, 35, 3, 1, P.tan[3]);
    p.path([20, 34, 19, 36, 21, 37], 0x14081a);
    p.sparkle(5, 8, 0xffffff, true); p.sparkle(35, 10, 0xe8c8ff); p.sparkle(35, 32, 0xffffff); p.sparkle(6, 30, 0xe8c8ff);
  },

  // Farbsturm: ein Wirbelsturm reißt Karten empor, übrig bleiben nur Herzen
  omen_farbsturm(p) {
    p.vgrad(0, 0, 40, 40, [0x14101c, 0x2a2440, 0x4a3a5c]);
    cloud(p, 20, 4, 24, 8, 0x5a4a72, 1, 401); cloud(p, 10, 8, 14, 6, 0x3a3052, 1, 402); cloud(p, 32, 8, 14, 6, 0x3a3052, 1, 403);
    // Trichter aus übereinander liegenden Ellipsen
    for (let i = 0; i < 14; i++) {
      const y = 8 + i * 2.2;
      const w = 15 - i * 0.95;
      p.ell(20, y, w, 2.2, i % 2 ? 0x4a3c68 : 0x6a5a88);
      p.ellRing(20, y, w, 2.2, i % 2 ? 0x2a2040 : 0x8a7aa8, 1);
    }
    p.rect(14, 12, 3, 1, 0xb8a8d0); p.rect(12, 15, 3, 1, 0xb8a8d0); p.rect(16, 18, 2, 1, 0xb8a8d0);
    // kreisende Herzen
    for (const [x, y, s] of [[8, 14, 2.4], [32, 17, 2.6], [12, 26, 2.2], [27, 29, 2.4], [20, 20, 2.6], [30, 8, 2]] as [number, number, number][]) {
      lit(p, (q) => heartShape(q, x, y, s, 1), x, y, s * 2, ramp(0xe0385a), INK, 2.2);
    }
    // zerrissene Kartenstücke
    for (const [x, y, c] of [[5, 22, 0xf4efe0], [35, 24, 0xc8c0a8], [24, 12, 0xe8e0cc], [16, 33, 0xf4efe0]] as [number, number, number][]) {
      p.rect(x, y, 3, 2, c); p.set(x, y, 0x3a2c58);
    }
    // Blitz
    p.path([6, 2, 3, 8, 7, 8, 4, 15], 0xfff0a8, 2);
    p.path([6, 2, 3, 8, 7, 8, 4, 15], 0xffffff);
    // Boden mit Staub
    hills(p, 37, 1.5, 12, 0.4, 0x0c0814, 0x2a2038);
    p.rect(0, 38, 40, 2, 0x0c0814);
    dust(p, [[10, 36], [28, 35], [17, 37], [34, 36]], [0x8a7aa8, 0x6a5a88]);
  },
};

