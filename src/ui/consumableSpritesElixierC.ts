import type { Pix } from './jokerPix';
import {
  INK, PAL as P, arcPts, bayer, bubbles, burst, cloud, cosmos, dust, glow, hills, lit, ramp, rng, spadeShape, star4, wall, type Sprite,
} from './consumableKit';
import { flame } from './jokerKit';

// Elixiere C: dreizehn weitere Essenzen (Rang, Suit, Edition, Geld, Level, Tags, Ziehen). Fläche 40 mal 40, Mitte x = 20.
// Kühle Schatten, warmes Licht von links oben, wie in den anderen Elixier Dateien.

/** Eine kleine Spielkarte mit Rand, Höhe h, Breite w, Mitte cx, Oberkante y. mark zeichnet das Zeichen in die Mitte. */
function card(p: Pix, cx: number, y: number, w: number, h: number, mark?: (q: Pix, x: number, y: number) => void, face = 0xf4efe0) {
  const x0 = cx - Math.floor(w / 2);
  p.rect(x0 - 1, y - 1, w + 2, h + 2, INK);
  p.rect(x0, y, w, h, face);
  p.rect(x0, y, w, 1, 0xffffff);
  p.rect(x0 + w - 1, y + 1, 1, h - 1, 0xc8c0a8);
  mark?.(p, cx, y + Math.floor(h / 2));
}

/** Gedrehte Karte (Winkel in Grad) mit Rand, Mitte cx, cy. */
function tiltCard(p: Pix, cx: number, cy: number, deg: number, w: number, h: number, face = 0xf4efe0, mark?: (q: Pix, x: number, y: number) => void) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const pt = (dx: number, dy: number): [number, number] => [cx + dx * c - dy * s, cy + dx * s + dy * c];
  const corners = [pt(-w / 2, -h / 2), pt(w / 2, -h / 2), pt(w / 2, h / 2), pt(-w / 2, h / 2)].flat();
  p.fig((q) => q.poly(corners, (x, y) => {
    // einfache Schattierung: unten rechts etwas dunkler
    const l = ((x - cx) * 0.6 + (y - cy) * 0.75) / Math.max(w, h);
    return l > 0.28 ? 0xc8c0a8 : l < -0.28 ? 0xffffff : face;
  }));
  mark?.(p, Math.round(cx), Math.round(cy));
}

const goldStar = (q: Pix, x: number, y: number) => star4(q, x, y, 3, 0xf2b92c, 0xfff0a8, 0.4);

export const SPRITES_ELIXIER_C: Record<string, Sprite> = {
  // Gipfelglanz: ein Ace schwebt im Morgenlicht über einem Gipfel
  elixier_gipfelglanz(p) {
    p.vgrad(0, 0, 40, 40, [0x2a2a68, 0x6a4a8c, 0xe8946a, 0xffd890]);
    p.stars(10, 0, 0, 40, 16, rng(201));
    glow(p, 27, 25, 16, 0xffe8a0, 0.9);
    burst(p, 20, 11, 9, 16, 14, 0xffe8a0);
    p.ball(31, 25, 6, ramp(0xffd860), 0.06);
    hills(p, 30, 2.5, 20, 1, 0x4a3a78, 0x7a5a98);
    // Gipfel: Lichtseite links, Schattenseite rechts
    p.poly([20, 18, 2, 40, 22, 40, 21, 28], P.stone[3]);
    p.poly([20, 18, 21, 28, 22, 40, 38, 40], P.slate[1]);
    p.line(20, 18, 2, 40, 0xe8e0d0);
    // Schneekappe
    p.poly([20, 18, 15, 26, 17.5, 25, 19, 29, 21, 25, 24, 27, 25, 26], P.snow[3]);
    p.poly([20, 18, 21, 25, 24, 27, 25, 26], P.snow[1]);
    p.poly([20, 18, 15, 26, 17.5, 25, 19, 22], 0xffffff);
    for (const [x, y] of [[10, 33], [14, 36], [26, 34], [30, 37], [8, 38]]) p.rect(x, y, 3, 1, P.stone[2]);
    // Ace Karte
    card(p, 20, 2, 13, 15, (q, x, y) => {
      spadeShape(q, x + 1, y + 2, 3.2, 0x2a2a50);
      q.rect(x, y + 4, 2, 2, 0x2a2a50);
      // das A in der Ecke
      for (const [dx, dy] of [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [0, 3], [1, 3], [2, 3], [3, 3], [0, 4], [3, 4], [0, 5], [3, 5]]) q.set(x - 5 + dx, y - 6 + dy, 0xd8382f);
    }, 0xfff8e8);
    p.sparkle(8, 8, 0xfff0b8, true); p.sparkle(33, 6, 0xffffff); p.sparkle(31, 17, 0xffe8a0);
    p.rect(0, 38, 40, 2, 0x14122a);
  },

  // Gleichklang: eine Stimmgabel schickt Klangringe zu gleich großen Karten
  elixier_gleichklang(p) {
    cosmos(p, [0x0c2a3a, 0x14485a, 0x1f6a78], 211, { stars: 8, clouds: [[20, 18, 22, 16, 0x4ac8c0, 0.45]] });
    // Klangringe links und rechts der Zinken
    const ringCols = [0xd8fff8, 0x9ff0f0, 0x6ad8d8, 0x4ac8c0];
    for (let k = 0; k < 4; k++) {
      p.path(arcPts(15, 13, 4 + k * 4, 6 + k * 3, 130, 230, 14), ringCols[k]);
      p.path(arcPts(25, 13, 4 + k * 4, 6 + k * 3, -50, 50, 14), ringCols[k]);
    }
    // gleich hohe Karten im Klang
    card(p, 6, 27, 8, 11, (q, x, y) => goldStar(q, x, y));
    card(p, 34, 27, 8, 11, (q, x, y) => goldStar(q, x, y));
    p.rect(2, 26, 8, 1, 0x6ad8d8); p.rect(30, 26, 8, 1, 0x6ad8d8);
    // Stimmgabel
    lit(p, (q) => {
      q.rect(15, 4, 4, 19, 1); q.rect(22, 4, 4, 19, 1);
      q.rect(15, 21, 11, 5, 1); q.rect(18, 25, 5, 3, 1);
      q.rect(19, 27, 3, 9, 1); q.disc(20, 37, 2.2, 1);
    }, 20, 18, 17, P.steel, INK, 2.4);
    p.rect(16, 5, 1, 15, 0xffffff); p.rect(23, 5, 1, 15, 0xffffff);
    p.sparkle(31, 6, 0xffffff); p.sparkle(8, 8, 0xd8fff8);
  },

  // Spektralglas: ein Prisma zerlegt weißes Licht in vier Farben
  elixier_spektralglas(p) {
    p.vgrad(0, 0, 40, 40, [0x0a1830, 0x14284c, 0x24386a]);
    cloud(p, 28, 20, 20, 16, 0x3a58a0, 0.5, 221);
    p.stars(8, 0, 0, 40, 14, rng(221));
    // einfallender Strahl
    p.line(0, 27, 14, 22, 0xffffff, 2);
    p.line(0, 26, 14, 21, 0xfff8e0);
    // austretende Strahlen in vier Farben
    const beams: [number, number, number, number][] = [[39, 6, 0xf04848, 0xffb0a0], [39, 14, 0xf8d848, 0xfff4b0], [39, 22, 0x48d868, 0xb0ffc8], [39, 31, 0x5898f8, 0xb8d8ff]];
    for (const [x, y, c, hi] of beams) {
      p.line(25, 18, x, y, c, 2);
      p.line(25, 17, x, y - 1, hi);
    }
    // Prisma
    lit(p, (q) => q.poly([20, 5, 32, 31, 8, 31], 1), 17, 16, 14, P.glass, INK, 2.2);
    p.poly([20, 11, 26, 26, 14, 26], 0xd8f8ff);
    p.poly([20, 11, 17, 19, 22, 17], 0xffffff);
    p.line(20, 5, 8, 31, 0xffffff);
    p.set(20, 5, 0xffffff);
    p.rect(8, 31, 25, 1, 0x6a98c0);
    // Sockel
    p.rect(6, 33, 29, 4, P.darkwood[2]); p.rect(6, 33, 29, 1, P.darkwood[4]); p.rect(6, 36, 29, 1, P.darkwood[0]);
    p.sparkle(34, 4, 0xffffff, true); p.sparkle(4, 12, 0xb0d0ff); p.sparkle(35, 28, 0xffffff);
  },

  // Abguss: aus einer Kelle fließt flüssiges Metall in drei Kartenformen
  elixier_abguss(p) {
    p.vgrad(0, 0, 40, 40, [0x2a1a30, 0x4a2a38, 0x7a3a2a]);
    wall(p, 0, 26, P.slate, 10, 5);
    glow(p, 20, 30, 18, 0xff8a2a, 0.8);
    // Kelle: Schale und Stiel, Licht von links oben
    p.fig((q) => { q.line(3, 2, 9, 7, 1, 2); });
    p.line(3, 2, 9, 7, P.darkwood[3], 2);
    p.line(4, 2, 9, 6, P.darkwood[4]);
    lit(p, (q) => { q.poly([8, 7, 18, 9, 17, 14, 14, 17, 9, 15], 1); q.disc(13, 12, 5, 1); }, 12, 10, 8, P.iron, INK, 2.2);
    p.poly([10, 9, 17, 10, 16, 13, 12, 14], 0xffb83a);
    p.poly([11, 9, 15, 10, 14, 11], 0xfff0a8);
    // Strahl
    p.line(18, 12, 20, 25, 0xffc43a, 2);
    p.line(18, 13, 19, 24, 0xfff0b0);
    // Rinne
    p.rect(7, 25, 26, 3, P.iron[1]); p.rect(7, 25, 26, 1, P.iron[3]);
    p.rect(8, 26, 24, 1, 0xff9a2a);
    for (const x of [10, 20, 30]) { p.rect(x, 28, 1, 3, 0xffa830); p.set(x, 31, 0xfff0b0); }
    // drei Kartenformen mit flüssigem Gold
    for (const cx of [10, 20, 30]) {
      p.rect(cx - 5, 31, 10, 7, INK);
      p.rect(cx - 4, 32, 8, 5, 0xf2b92c);
      p.rect(cx - 4, 32, 8, 1, 0xfff0a8);
      p.rect(cx - 4, 36, 8, 1, 0xa8741c);
      p.set(cx - 2, 34, 0xfff0a8);
    }
    p.rect(0, 38, 40, 2, 0x14081a);
    dust(p, [[6, 22], [33, 20], [26, 14], [34, 10], [4, 30]], [0xffd860, 0xff9a2a]);
    p.sparkle(26, 22, 0xffe27a);
  },

  // Glanzfirnis: ein Pinsel trägt schimmernden Firnis auf eine Karte
  elixier_glanzfirnis(p) {
    cosmos(p, [0x0c3a48, 0x146070, 0x2a8a90], 231, { stars: 10, clouds: [[20, 16, 22, 14, 0x6ae0e0, 0.5]] });
    // Karte
    p.rect(11, 6, 18, 24, INK);
    p.rect(12, 7, 16, 22, 0xf4efe0);
    p.rect(12, 7, 16, 1, 0xffffff);
    p.rect(27, 8, 1, 21, 0xc8c0a8);
    p.rect(14, 10, 4, 1, 0x8a8a98); p.rect(14, 12, 6, 1, 0xa8a8b4);
    // Firnis: schräge blaue Bänder mit Funkeln
    for (let y = 7; y < 29; y++) {
      for (let x = 12; x < 28; x++) {
        const d = x + y * 0.8;
        if (d > 34 + (y % 3)) continue;
        const band = Math.floor((x + y) / 3) % 3;
        p.set(x, y, band === 0 ? 0x7ad0f8 : band === 1 ? 0xa8e4ff : 0x5ab4f0);
      }
    }
    p.line(12, 24, 22, 12, 0xffffff);
    p.sparkle(16, 16, 0xffffff, true); p.sparkle(21, 22, 0xd8f4ff); p.sparkle(14, 25, 0xffffff);
    // Pinsel
    p.line(37, 3, 31, 9, P.darkwood[3], 2);
    p.line(36, 3, 31, 8, P.darkwood[4]);
    p.poly([32, 9, 34, 11, 30, 15, 28, 13], P.steel[3]);
    p.line(32, 9, 28, 13, P.steel[4]);
    p.poly([29, 14, 31, 14, 27, 20, 24, 22, 25, 18], 0x5ab4f0);
    p.poly([28, 15, 30, 15, 26, 19, 25, 19], 0xc8f0ff);
    p.set(24, 22, 0xffffff);
    // Töpfchen
    p.fig((q) => { q.ball(32, 33, 5, ramp(0x6a98c8), 0.1); q.rect(29, 27, 6, 3, P.darkwood[2]); });
    p.ell(32, 29, 3, 1, 0x7ad0f8);
    p.set(30, 31, 0xffffff);
    p.rect(0, 38, 40, 2, 0x0a2a34);
  },

  // Flammenfirnis: eine Karte steht in einem lodernden Strahlenkranz
  elixier_flammenfirnis(p) {
    p.vgrad(0, 0, 40, 40, [0x2a0c24, 0x5a1a2a, 0x9a3a22]);
    cloud(p, 20, 22, 22, 18, 0xe0602a, 0.5, 241);
    burst(p, 20, 20, 12, 21, 16, 0xff9a3a);
    glow(p, 20, 20, 17, 0xffb040, 0.9);
    // Karte
    p.rect(12, 7, 16, 24, INK);
    p.rect(13, 8, 14, 22, 0xfff2d8);
    p.rect(13, 8, 14, 1, 0xffffff);
    p.rect(26, 9, 1, 21, 0xd8b890);
    // Aura Verlauf im unteren Teil der Karte
    for (let y = 18; y < 30; y++) for (let x = 13; x < 27; x++) {
      const k = (y - 18) / 11;
      if (k + (1 - Math.abs(x - 20) / 7) * 0.2 > Math.min(0.99, 0.18 + ((x * 3 + y) % 5) * 0.12)) p.set(x, y, k > 0.6 ? 0xff5a2a : 0xff9a3a);
    }
    flame(p, 20, 10, 11, true);
    // Flammen rechts und links der Karte
    flame(p, 8, 14, 18, true, -0.5); flame(p, 32, 15, 17, true, 0.5);
    flame(p, 4, 24, 11, false, -0.3); flame(p, 36, 25, 10, false, 0.3);
    p.rect(0, 37, 40, 3, 0x14081a);
    dust(p, [[14, 4], [26, 3], [20, 1], [34, 8], [6, 6]], [0xffd860, 0xff8a2a, 0xffffff]);
  },

  // Pfandsiegel: eine zerrissene Karte, aus der Münzen fallen
  elixier_pfandsiegel(p) {
    cosmos(p, [0x0c2a2a, 0x14504a, 0x1f7a68], 251, { stars: 8, clouds: [[20, 14, 22, 12, 0x4ac8a0, 0.4]] });
    const zig: number[][] = [[29, 9], [25, 12], [22, 10], [18, 15], [14, 16], [11, 20]];
    // obere Hälfte
    p.fig((q) => q.poly([11, 4, 29, 4, ...zig.flat()], 0xf4efe0));
    p.rect(12, 5, 16, 1, 0xffffff);
    p.rect(14, 7, 5, 1, 0x8a8a98);
    // untere Hälfte, etwas verschoben
    const low = zig.map(([x, y]) => [x - 1, y + 3]);
    p.fig((q) => q.poly([...low.flat(), 10, 33, 29, 33, 29, 12], 0xe8e0cc));
    p.line(12, 33, 28, 33, 0xc8c0a8);
    // Wachssiegel
    p.fig((q) => q.ball(16, 27, 4, ramp(0xd8382f), 0.1));
    p.set(15, 25, 0xff9a8a);
    p.set(16, 27, 0xffd0c0); p.set(15, 27, 0xffd0c0); p.set(17, 27, 0xffd0c0);
    // Münzen fallen aus dem Riss
    for (const [x, y, r] of [[33, 15, 3], [35, 22, 2.6], [31, 28, 3]] as [number, number, number][]) {
      p.fig((q) => q.ball(x, y, r, P.gold, 0.08));
      p.set(x, y, 0xa8741c);
    }
    p.line(31, 11, 32, 12, 0xffe27a);
    // Münzstapel
    for (let i = 0; i < 3; i++) { p.rect(24, 35 - i * 2, 8, 2, 0xf2b92c); p.rect(24, 35 - i * 2, 8, 1, 0xffe27a); p.rect(24, 36 - i * 2, 8, 1, 0xa8741c); }
    p.sparkle(35, 31, 0xffffff); p.sparkle(6, 10, 0xd8fff0);
    p.rect(0, 38, 40, 2, 0x082a22);
  },

  // Goldwaage: eine Waage mit Goldmünzen gegen eine Karte
  elixier_goldwaage(p) {
    p.vgrad(0, 0, 40, 40, [0x0c2a30, 0x14485a, 0x1f6a6a]);
    wall(p, 0, 36, P.teal, 10, 5);
    for (let y = 0; y < 36; y += 3) for (let x = (y % 6) ? 0 : 5; x < 40; x += 10) p.set(x, y, 0x0c2a30);
    glow(p, 20, 10, 12, 0xffe8a0, 0.5);
    // Ständer
    p.rect(17, 35, 7, 3, P.darkwood[2]); p.rect(17, 35, 7, 1, P.darkwood[4]);
    p.fig((q) => { q.rect(19, 9, 3, 26, 1); q.disc(20, 8, 3, 1); });
    p.rect(19, 10, 1, 24, P.gold[4]); p.rect(20, 10, 2, 24, P.gold[2]); p.rect(21, 10, 1, 24, P.gold[1]);
    p.ball(20, 8, 3, P.gold, 0.06);
    // Balken, links schwerer (tiefer)
    p.line(5, 15, 35, 11, INK, 3);
    p.line(5, 14, 35, 10, P.gold[3], 1);
    p.line(5, 15, 35, 11, P.gold[2]);
    p.set(5, 14, P.gold[4]); p.set(35, 10, P.gold[4]);
    // Schalen mit Ketten
    p.line(5, 15, 1, 27, 0xc8c0a8); p.line(5, 15, 10, 27, 0xc8c0a8);
    p.line(35, 11, 31, 21, 0xc8c0a8); p.line(35, 11, 39, 21, 0xc8c0a8);
    p.fig((q) => { q.ell(5.5, 28, 6, 2.5, 1); });
    p.ell(5.5, 28, 5, 2, P.gold[2]); p.rect(1, 27, 9, 1, P.gold[4]);
    p.fig((q) => { q.ell(35, 22, 6, 2.5, 1); });
    p.ell(35, 22, 5, 2, P.gold[2]); p.rect(31, 21, 8, 1, P.gold[4]);
    // Münzhaufen links
    for (const [x, y, r] of [[3, 24, 2.6], [8, 24, 2.6], [5.5, 21, 2.8], [2, 27, 2]] as [number, number, number][]) {
      p.fig((q) => q.ball(x, y, r, P.gold, 0.06));
      p.set(x, y, P.gold[0]);
    }
    p.sparkle(5, 17, 0xfff0a8);
    // Karte mit Zeichen rechts
    card(p, 35, 11, 7, 9, (q, x, y) => goldStar(q, x, y), 0xf4efe0);
    p.sparkle(26, 6, 0xffffff, true); p.sparkle(12, 33, 0xffe27a);
    p.rect(0, 38, 40, 2, 0x082a30);
  },

  // Leitstern: ein heller Stern weist über einem Kompass die Richtung
  elixier_leitstern(p) {
    cosmos(p, [0x0a1030, 0x1c2a68, 0x2a4a9a], 261, { stars: 16, clouds: [[28, 22, 18, 12, 0x4a6ad8, 0.4], [10, 28, 14, 8, 0x3a4aa8, 0.4]] });
    // Lichtsäule
    for (let y = 14; y < 29; y++) {
      const half = Math.max(0, 5 - (y - 14) * 0.33);
      for (let x = 20 - Math.ceil(half); x <= 20 + Math.ceil(half); x++) {
        const k = 1 - Math.abs(x - 20) / (half + 0.5);
        if (k > bayer(x, y)) p.set(x, y, k > 0.6 ? 0xfff0b8 : 0xa8c8ff);
      }
    }
    glow(p, 20, 9, 12, 0xffd860, 0.9);
    star4(p, 20, 9, 9, 0xffd860, 0xffffff, 0.22);
    p.sparkle(20, 9, 0xfff8d8, true);
    // Kompass
    lit(p, (q) => q.disc(20, 31, 8.5, 1), 20, 31, 9, P.gold, INK, 2.2);
    p.disc(20, 31, 6, 0x1a2250);
    p.ring(20, 31, 6, 0x6a88e0);
    for (const [x, y] of [[20, 26], [20, 36], [15, 31], [25, 31]]) p.set(x, y, 0xfff0b8);
    // Nadel: Spitze nach oben
    p.poly([20, 25, 22, 31, 18, 31], 0xe8402a);
    p.poly([20, 25, 20, 31, 18, 31], 0xff8a6a);
    p.poly([18, 31, 22, 31, 20, 37], 0xc8d0e8);
    p.set(20, 31, 0xffffff);
    p.sparkle(6, 6, 0xffffff); p.sparkle(35, 14, 0xfff0b8); p.sparkle(5, 20, 0xb8d0ff);
  },

  // Nachtlicht: eine Laterne leuchtet warm in kühler Nacht
  elixier_nachtlicht(p) {
    cosmos(p, [0x081a2a, 0x10324a, 0x1a4a68], 271, { stars: 14, clouds: [[8, 10, 14, 8, 0x3a78a8, 0.4]] });
    // Mondsichel
    p.disc(33, 8, 5, 0xf0e8c8); p.disc(35, 7, 4.5, 0x10324a);
    glow(p, 20, 21, 17, 0xffa83a, 0.7);
    // Kette und Haken
    p.ring(20, 3, 2.5, P.iron[3]);
    p.line(20, 5, 20, 8, P.iron[3]);
    // Dach
    p.fig((q) => q.poly([13, 12, 27, 12, 24, 8, 16, 8], P.copper[2]));
    p.poly([13, 12, 20, 12, 18, 8, 16, 8], P.copper[3]);
    p.rect(14, 12, 12, 1, P.copper[1]);
    p.disc(20, 8, 1.5, P.copper[4]);
    // Glaskörper mit Glut
    p.rect(14, 13, 12, 16, INK);
    p.vgrad(15, 13, 10, 15, [0xfff0b8, 0xffc43a, 0xf2832a]);
    // Flamme
    flame(p, 20, 17, 9, true);
    p.rect(15, 13, 1, 15, 0xffffff);
    // Gitter
    for (const x of [14, 19, 25]) p.rect(x, 13, 1, 16, 0x3a2a1a);
    p.rect(14, 20, 12, 1, 0x3a2a1a);
    // Boden
    p.fig((q) => { q.rect(13, 29, 14, 3, P.copper[2]); q.rect(16, 32, 8, 2, P.copper[1]); });
    p.rect(13, 29, 14, 1, P.copper[4]);
    p.sparkle(7, 24, 0xffe8a0); p.sparkle(32, 28, 0xffe8a0); p.sparkle(26, 3, 0xffffff);
    hills(p, 37, 1, 12, 0.5, 0x081420, 0x14283a);
  },

  // Bannwasser: ein Fläschchen mit klarem Weihwasser über einem gesprungenen Bannkreis
  elixier_bannwasser(p) {
    p.vgrad(0, 0, 40, 40, [0x1a1030, 0x2a1a50, 0x3a2a6a]);
    p.stars(10, 0, 0, 40, 18, rng(281));
    // Bannkreis am Boden
    p.ellRing(20, 33, 17, 5, 0xe0485a, 1);
    p.ellRing(20, 33, 13, 3.6, 0x8a2a4a, 1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      p.set(20 + Math.cos(a) * 15, 33 + Math.sin(a) * 4.3, 0xffa0a0);
    }
    p.line(6, 31, 12, 34, 0x14081a); p.line(30, 36, 34, 32, 0x14081a);
    p.rect(0, 37, 40, 3, 0x120a22);
    // Lichtkegel vom Fläschchen
    for (let y = 22; y < 34; y++) {
      const half = 2 + (y - 22) * 0.7;
      for (let x = Math.floor(20 - half); x <= Math.ceil(20 + half); x++) {
        const k = 1 - Math.abs(x - 20) / (half + 0.5);
        if (k > bayer(x, y) * 1.1) p.set(x, y, 0xb8f0ff);
      }
    }
    glow(p, 20, 17, 13, 0x8ae0ff, 0.7);
    // Fläschchen
    p.fig((q) => { q.ball(20, 19, 9, ramp(0x8ad0f0), 0.1); q.rect(18, 6, 5, 6, P.glass[2]); });
    // Wasser unten, klar oben
    for (let y = 20; y < 29; y++) for (let x = 11; x < 30; x++) {
      const dx = x - 20, dy = y - 19;
      if (dx * dx + dy * dy < 70 && (y > 21 || (x + y) % 2 === 0)) p.set(x, y, y > 25 ? 0x3aa8e8 : 0x78d0f8);
    }
    p.set(14, 14, 0xffffff); p.set(13, 15, 0xffffff); p.rect(14, 12, 2, 1, 0xd8f8ff);
    // Zeichen: goldene Sonne
    p.disc(20, 21, 2.4, 0xf2b92c);
    for (const [x, y] of [[20, 17], [20, 25], [16, 21], [24, 21]]) p.set(x, y, 0xffe27a);
    // Korken
    p.fig((q) => q.rect(18, 2, 5, 5, P.tan[2]));
    p.rect(18, 3, 1, 3, P.tan[4]);
    bubbles(p, [[23, 15, 1], [17, 25, 1]], 0xe8fcff);
    p.sparkle(7, 8, 0xffffff, true); p.sparkle(34, 12, 0xb8f0ff);
  },

  // Aufwind: zwei Karten steigen in einer Böe auf
  elixier_aufwind(p) {
    p.vgrad(0, 0, 40, 40, [0x1a4a6a, 0x3a8aa8, 0x8ad0d8, 0xc8f0e8]);
    cloud(p, 8, 8, 14, 6, 0xe8f8f8, 0.9, 291); cloud(p, 32, 30, 14, 7, 0xe8f8f8, 0.8, 292); cloud(p, 14, 34, 16, 6, 0xd8f0f0, 0.9, 293);
    // Windschwünge
    const wind = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, c: number) => p.path(arcPts(cx, cy, rx, ry, a0, a1, 16), c);
    wind(20, 28, 13, 7, 190, 350, 0xffffff);
    wind(21, 31, 15, 7, 200, 345, 0xc8f0f0);
    wind(18, 24, 9, 5, 200, 340, 0xe8ffff);
    p.set(7, 28, 0xffffff); p.set(33, 28, 0xffffff);
    // zwei Karten
    tiltCard(p, 14, 22, -24, 11, 15, 0xf4efe0, (q, x, y) => goldStar(q, x, y));
    tiltCard(p, 26, 11, 16, 11, 15, 0xfff8e8, (q, x, y) => spadeShape(q, x, y, 2.6, 0x2a2a50));
    // Feder
    p.fig((q) => q.poly([31, 24, 36, 20, 38, 22, 34, 27], 0xffffff));
    p.line(31, 25, 37, 21, 0xb8c8d8);
    p.sparkle(8, 14, 0xffffff, true); p.sparkle(34, 6, 0xffffff);
    p.rect(0, 38, 40, 2, 0x1a4a6a);
  },

  // Stundenglas: Karten rieseln wie Sand durch ein Stundenglas
  elixier_stundenglas(p) {
    cosmos(p, [0x0c2a32, 0x144858, 0x1f6a72], 301, { stars: 10, clouds: [[20, 20, 22, 18, 0x4ac8c0, 0.4]] });
    // Rahmen: Platten und Pfosten
    for (const y of [3, 34]) {
      p.fig((q) => q.rect(9, y, 22, 4, 1), INK);
      p.rect(9, y, 22, 4, P.wood[2]); p.rect(9, y, 22, 1, P.wood[4]); p.rect(9, y + 3, 22, 1, P.wood[0]);
    }
    for (const x of [10, 28]) { p.rect(x, 7, 2, 27, P.wood[2]); p.rect(x, 7, 1, 27, P.wood[3]); p.rect(x + 1, 7, 1, 27, P.wood[1]); }
    // Glas
    p.poly([14, 7, 26, 7, 26, 11, 21, 19, 19, 19, 14, 11], 0x9fe0e8);
    p.poly([19, 21, 21, 21, 26, 29, 26, 34, 14, 34, 14, 29], 0x9fe0e8);
    p.poly([15, 8, 25, 8, 25, 10, 20.5, 18, 19.5, 18, 15, 10], 0x1a3a48);
    p.poly([15, 30, 25, 30, 25, 33, 15, 33], 0x1a3a48);
    // Sand oben und unten
    p.poly([15, 12, 25, 12, 25, 10, 20.5, 18, 19.5, 18, 15, 10], 0xf2b92c);
    p.poly([17, 33, 23, 33, 21, 27, 19, 27], 0xf2b92c);
    p.rect(15, 33, 10, 1, 0xf2b92c);
    p.rect(18, 29, 5, 4, 0xf2b92c);
    p.set(19, 28, 0xffe27a); p.set(18, 31, 0xffe27a); p.rect(16, 12, 3, 1, 0xffe27a);
    // Karten als Körner im Strahl
    for (const [x, y] of [[20, 20], [20, 23], [20, 26]]) { p.rect(x - 1, y, 2, 3, 0xf4efe0); p.rect(x - 1, y, 2, 1, 0xffffff); }
    // Glanz
    p.line(15, 9, 19, 17, 0xffffff); p.line(15, 31, 15, 33, 0xffffff);
    p.sparkle(5, 9, 0xd8fff8, true); p.sparkle(35, 20, 0xffffff); p.sparkle(34, 6, 0xd8fff8);
  },
};
