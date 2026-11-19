import type { Pix } from './jokerPix';
import { PAL as P, arcPts, bubbles, burst, cloud, cosmos, dust, glow, ground, lit, ramp, rng, shine, star4, starPts, wall, type Sprite } from './consumableKit';

// Elixiere A: acht Enhancement Essenzen (je ein eigenes Gefäß) und drei Wachs Siegel. Fläche 40 mal 40.

const GLASS = 0xcfeef0;
const GLASS_D = 0x6aa8b8;

/** Schlichter Glaskörper mit Flüssigkeit (Rechteck mit Rundung unten), Füllstand ab y_fill. */
function vial(p: Pix, x: number, y: number, w: number, h: number, liquid: ReturnType<typeof ramp>, yFill: number) {
  p.fig((q) => {
    q.rrect(x, y, w, h, GLASS_D, 2);
    q.rrect(x + 1, y + 1, w - 2, h - 2, 0x1c2c3c, 1);
    q.rrect(x + 1, yFill, w - 2, y + h - 1 - yFill, liquid[2], 1);
  });
  p.rect(x + 1, yFill, w - 2, 1, liquid[4]);
  p.rect(x + w - 3, yFill + 1, 1, y + h - 3 - yFill, liquid[1]);
  p.rect(x + 2, y + 2, 1, h - 5, GLASS);
}

export const SPRITES_ELIXIER_A: Record<string, Sprite> = {
  // Kupferessenz: kupferne Brennblase mit Helm, das Destillat tropft in ein Fläschchen
  elixier_kupfer(p) {
    p.vgrad(0, 0, 40, 40, [0x14282e, 0x234448, 0x3a3a2a]);
    wall(p, 0, 34, ramp(0x2a4446), 9, 5);
    p.rect(0, 34, 40, 6, 0x1c1a16);
    p.rect(0, 34, 40, 1, 0x5a4a30);
    // Feuer unter der Blase
    for (const [x, h] of [[9, 7], [13, 9], [17, 6]] as [number, number][]) {
      const y0 = 34 - h;
      p.poly([x, y0, x + 3, 34, x - 3, 34], 0xff8a2a);
      p.poly([x, y0 + 3, x + 1.5, 34, x - 1.5, 34], 0xffd850);
    }
    p.fig((q) => {
      q.ball(13, 24, 9, P.copper, 0.1);
      q.rect(11, 12, 5, 6, P.copper[2]);
      q.ball(19, 9, 5, P.copper, 0.1);
      q.rect(22, 9, 12, 3, P.copper[2]);
      q.rect(22, 9, 12, 1, P.copper[4]);
      q.rect(33, 9, 3, 12, P.copper[2]);
    });
    // Grünspan und Nieten
    for (const [x, y] of [[9, 27], [17, 21], [14, 31], [20, 7]]) p.set(x, y, 0x4ac8a0);
    p.rect(11, 16, 5, 1, P.gold[3]);
    p.line(8, 21, 11, 18, 0xffe0b0);
    // Fläschchen mit Destillat
    vial(p, 28, 26, 10, 11, P.orange, 31);
    p.rect(27, 24, 12, 2, P.copper[3]);
    p.set(34, 22, 0xffc070); p.set(34, 24, 0xffd890);
    p.sparkle(26, 14, 0xffd890);
    bubbles(p, [[10, 25, 1], [15, 28, 1], [13, 21, 1]], 0xffe8c0);
  },

  // Rubintinktur: Tropfflasche mit tiefroter Tinktur, daneben ein geschliffener Rubin
  elixier_rubin(p) {
    p.vgrad(0, 0, 40, 40, [0x240a2a, 0x4a1238, 0x6a1a3a]);
    cloud(p, 20, 20, 22, 16, 0xa02a5a, 0.7, 3);
    p.stars(10, 0, 0, 40, 30, rng(4));
    ground(p, 33, P.darkwood);
    // Flasche
    p.fig((q) => {
      q.rrect(10, 16, 18, 18, GLASS_D, 4);
      q.poly([13, 16, 25, 16, 22, 11, 16, 11], GLASS_D);
      q.rect(16, 6, 6, 6, 0xc02838);
    });
    p.rrect(11, 17, 16, 16, 0x2a0e1c, 3);
    p.rrect(11, 21, 16, 12, P.red[2], 3);
    p.rect(11, 21, 16, 1, P.red[4]);
    p.rect(23, 23, 3, 9, P.red[0]);
    p.rect(13, 18, 1, 14, GLASS);
    p.rect(16, 11, 6, 2, P.gold[3]);
    p.rect(16, 12, 6, 1, P.gold[1]);
    // Etikett
    p.rect(14, 25, 10, 5, 0xf0e6c8);
    p.set(19, 27, 0xc02838); p.set(18, 27, 0xc02838); p.set(20, 27, 0xc02838); p.set(19, 26, 0xc02838); p.set(19, 28, 0xc02838);
    p.rect(17, 7, 1, 3, 0xff8a98);
    p.set(18, 9, 0xffd0d8);
    // Rubin
    p.fig((q) => {
      q.poly([32, 24, 37, 28, 34, 33, 30, 33, 27, 28], P.red[2]);
      q.poly([27, 28, 37, 28, 34, 33, 30, 33], P.red[1]);
      q.poly([32, 24, 29.5, 28, 34.5, 28], P.red[4]);
      q.poly([27, 28, 29.5, 28, 30, 33], P.red[3]);
    });
    p.sparkle(33, 22, 0xffffff); p.sparkle(6, 12, 0xff9aa8, true); p.sparkle(35, 12, 0xffd0d8);
  },

  // Mondtropfen: eine Pipette lässt ein leuchtendes Tröpfchen in eine Mondschale fallen
  elixier_mondstein(p) {
    cosmos(p, [0x0a1236, 0x1a2a6a, 0x3a5aa8], 41, { stars: 16, clouds: [[28, 8, 14, 8, 0x6a90e0, 0.7]] });
    // Mondsichel oben rechts
    p.disc(31, 9, 7, 0xe8e4c8);
    p.disc(34, 7, 6, 0x1a2a6a);
    p.disc(30, 10, 1, 0xc8c4a0);
    // Pipette
    p.fig((q) => {
      q.poly([9, 3, 12, 3, 20, 20, 18, 21], GLASS_D);
      q.disc(9.5, 3, 3, 0x3a3a5a);
    });
    p.line(10, 5, 18, 19, GLASS);
    p.line(11, 5, 18, 20, 0xb8e8ff);
    p.disc(9, 2, 1, 0x8a8ab0);
    // Tropfen
    glow(p, 20, 27, 5, 0xffffff, 1);
    p.poly([20, 22, 22, 26, 20, 28, 18, 26], 0xffffff);
    p.set(20, 25, 0xb8e8ff);
    // Schale
    p.fig((q) => {
      q.poly([6, 30, 34, 30, 30, 37, 10, 37], P.snow[1]);
      q.ell(20, 30, 14, 3, P.snow[3]);
    });
    p.ell(20, 30, 12, 2, 0x5a90e0);
    p.ell(20, 30, 8, 1, 0x9ad0ff);
    p.ring(20, 30, 4, 0xe8f6ff, 1);
    p.set(24, 30, 0xffffff); p.set(15, 30, 0xffffff);
    p.rect(11, 33, 18, 1, P.snow[4]);
    p.sparkle(9, 22, 0xffffff); p.sparkle(34, 24, 0xcfe8ff);
  },

  // Kristallsud: im Kessel über dem Feuer wachsen Kristalle aus der Brühe
  elixier_kristall(p) {
    p.vgrad(0, 0, 40, 40, [0x061a2a, 0x0e3a4a, 0x144a5a]);
    cloud(p, 20, 14, 20, 12, 0x2ab0c8, 0.5, 6);
    p.stars(8, 0, 0, 40, 18, rng(9));
    // Kristalle
    for (const [x, y0, w, c] of [[20, 4, 4, P.cyan], [12, 12, 3, P.teal], [28, 11, 3, P.blue], [6, 18, 2, P.cyan], [33, 18, 2, P.teal]] as [number, number, number, ReturnType<typeof ramp>][]) {
      p.fig((q) => {
        q.poly([x, y0, x + w, y0 + w * 2, x + w, 27, x - w, 27, x - w, y0 + w * 2], c[2]);
        q.poly([x, y0, x + w, y0 + w * 2, x, 27, x - 0, y0 + w * 2], c[3]);
        q.poly([x, y0, x - w, y0 + w * 2, x - w, 27, x - w * 0.4, 27], c[4]);
      });
      p.set(x - 1, y0 + w, 0xffffff);
    }
    // Kessel
    p.fig((q) => {
      q.ell(20, 28, 14, 4, P.iron[3]);
      q.ball(20, 31, 12, P.iron, 0.1);
    });
    p.ell(20, 28, 12, 3, 0x1a8aa0);
    p.ell(20, 28, 9, 2, 0x5ad8e8);
    p.rect(8, 28, 24, 1, P.iron[4]);
    bubbles(p, [[15, 28, 1], [22, 27, 1], [26, 29, 1]], 0xe0ffff);
    // Feuer
    p.rect(0, 36, 40, 4, 0x140c10);
    for (const [x, h] of [[10, 5], [16, 7], [24, 6], [30, 4]] as [number, number][]) {
      p.poly([x, 36 - h, x + 3, 40, x - 3, 40], 0xff7a2a);
      p.poly([x, 38 - h + 2, x + 1.5, 40, x - 1.5, 40], 0xffd850);
    }
    p.sparkle(20, 3, 0xffffff, true); p.sparkle(34, 7, 0xb8f0ff);
  },

  // Eisenpulver: Mörser mit Eisenstaub, ein Hufeisenmagnet zieht die Späne in Bögen an
  elixier_eisen(p) {
    p.vgrad(0, 0, 40, 40, [0x1a2030, 0x2c3448, 0x3c4458]);
    wall(p, 0, 33, ramp(0x343c50), 10, 5);
    ground(p, 33, P.darkwood);
    // Magnetfeld: Späne in Bögen
    for (let k = 0; k < 4; k++) {
      const pts = arcPts(27, 12, 5 + k * 3, 6 + k * 3.5, 20, 160, 10);
      for (let i = 0; i < pts.length; i += 2) if ((i / 2 + k) % 2 === 0) p.set(pts[i], pts[i + 1], k % 2 ? 0xa8b4c8 : 0x7a869c);
    }
    // Magnet
    p.fig((q) => {
      q.poly([21, 3, 26, 3, 26, 14, 21, 14], 0xd8382f);
      q.poly([28, 3, 33, 3, 33, 14, 28, 14], 0xd8382f);
      q.poly([21, 3, 33, 3, 33, 7, 21, 7], 0xd8382f);
      q.rect(21, 11, 5, 4, P.steel[3]); q.rect(28, 11, 5, 4, P.steel[3]);
    });
    p.rect(22, 4, 1, 6, 0xff9a90); p.rect(29, 4, 1, 6, 0xff9a90);
    p.rect(27, 7, 1, 1, 0x8a1a1a);
    // Mörser
    p.fig((q) => {
      q.poly([5, 22, 31, 22, 27, 33, 9, 33], P.stone[2]);
      q.rect(8, 33, 20, 2, P.stone[1]);
      q.rect(14, 31, 8, 4, P.stone[1]);
    });
    p.poly([7, 22, 29, 22, 28, 24, 8, 24], P.stone[4]);
    p.rect(9, 25, 2, 6, P.stone[3]);
    p.rect(26, 25, 2, 7, P.stone[0]);
    // Eisenpulver als Haufen über dem Rand
    p.poly([9, 22, 14, 17, 18, 15, 23, 17, 28, 22], P.iron[1]);
    p.poly([12, 22, 16, 18, 19, 16, 22, 19, 25, 22], P.iron[2]);
    for (const [x, y] of [[15, 18], [19, 17], [21, 19], [17, 20]]) p.set(x, y, P.steel[4]);
    // Stößel
    p.fig((q) => {
      q.poly([4, 6, 7, 5, 18, 22, 15, 24], P.stone[3]);
      q.disc(5, 5, 3, P.stone[4]);
    });
    p.line(6, 7, 14, 21, P.stone[4]);
    p.sparkle(30, 20, 0xffffff); p.sparkle(8, 14, 0xc8d4e8);
  },

  // Obsidiansalbe: ein schwarzes Glastiegelchen mit violettem Schimmer und gläsernen Splittern
  elixier_obsidian(p) {
    p.vgrad(0, 0, 40, 40, [0x2c1a52, 0x5a3a98, 0x8a62c8]);
    cloud(p, 20, 12, 20, 12, 0xb090f0, 0.6, 12);
    p.stars(8, 0, 0, 40, 24, rng(14));
    ground(p, 34, P.slate);
    // Splitter links und rechts
    for (const [x, h, w] of [[3, 17, 4], [9, 11, 3], [34, 14, 4], [29, 9, 3]] as [number, number, number][]) {
      p.fig((q) => {
        q.poly([x, 34 - h, x + w, 34, x - w + 1, 34], 0x1c1230);
        q.poly([x, 34 - h, x - w + 1, 34, x - 1, 34], 0x3a2a60);
      });
      p.set(x - 1, 34 - h + 3, 0xd0b0ff); p.line(x - 1, 34 - h + 4, x - 2, 34 - 3, 0x8a6ad8);
    }
    // Tiegel: schwarzes Glas mit Deckel und violettem Schimmer
    p.fig((q) => {
      q.rrect(9, 19, 22, 16, 0x241a3c, 4);
      q.rect(8, 14, 24, 6, 0x3a2a60);
      q.disc(20, 12, 2.5, 0x3a2a60);
    });
    for (let y = 21; y < 34; y++) for (let x = 11; x < 30; x++) if ((x * 2 + y) % 9 === 0) p.set(x, y, 0x3a2a60);
    p.rect(9, 14, 24, 1, 0x6a50a8); p.rect(8, 16, 24, 1, 0x241a3c); p.rect(8, 19, 24, 1, 0x120a24);
    p.rect(11, 22, 2, 10, 0x8a6ad8); p.rect(11, 22, 1, 6, 0xe0d0ff); p.set(13, 33, 0x6a50a8);
    p.rect(27, 22, 2, 11, 0x120a24);
    p.disc(19, 11, 1, 0xd0b0ff);
    // Salbenspatel mit dunkler Salbe
    p.fig((q) => { q.poly([33, 20, 35, 20, 36, 33, 34, 33], P.wood[2]); q.ell(35, 18, 3, 3, 0x1a0e30); });
    p.set(34, 17, 0xb090ff);
    // Rand und Tropfen
    p.rect(0, 35, 40, 5, P.slate[1]); p.rect(0, 35, 40, 1, P.slate[3]);
    p.fig((q) => q.ell(20, 37, 8, 1.5, 0x120a24));
    p.sparkle(34, 12, 0xe0c8ff); p.sparkle(6, 8, 0xc8a0ff, true);
  },

  // Quecksilbertrank: Rundkolben mit schwerem Silber, Tropfen hüpfen auf dem Tisch
  elixier_quecksilber(p) {
    p.vgrad(0, 0, 40, 40, [0x1a3040, 0x2a5260, 0x4a7a86]);
    cloud(p, 20, 20, 22, 18, 0x8ad0d8, 0.4, 18);
    ground(p, 34, P.slate);
    // Kolben
    p.fig((q) => {
      q.ball(20, 23, 12, ramp(0x9fe0e8), 0.08);
      q.rect(17, 5, 7, 8, 0x9fe0e8);
    });
    p.disc(20, 23, 10, 0x1e3a48);
    p.rect(18, 7, 5, 6, 0x1e3a48);
    // Quecksilber im Kolben mit schwappender Oberfläche
    for (let y = 25; y <= 33; y++) for (let x = 9; x <= 31; x++) {
      if (Math.hypot(x - 20, y - 23) > 10) continue;
      const wave = 25 + Math.round(Math.sin(x * 0.7) * 0.8);
      if (y >= wave) p.set(x, y, y < wave + 2 ? 0xf0f6ff : y > 30 ? 0x6a7a90 : 0xb4c4d8);
    }
    p.rect(13, 28, 3, 3, 0xffffff);
    p.rect(13, 20, 1, 7, 0xe0f8ff);
    // Korken
    p.fig((q) => q.rect(17, 2, 7, 4, P.tan[2]));
    p.rect(18, 3, 2, 1, P.tan[4]);
    // Tropfen auf dem Tisch
    for (const [x, y, r] of [[5, 32, 2], [34, 32, 2], [8, 28, 1], [32, 27, 1], [37, 30, 1]] as [number, number, number][]) {
      p.ball(x, y + 1, r + 1, P.steel, 0.05);
      p.set(x - 1, y, 0xffffff);
    }
    p.rect(0, 34, 40, 1, 0xb8c8e0);
    p.sparkle(32, 12, 0xffffff); p.sparkle(7, 14, 0xe0f4ff, true);
    bubbles(p, [[22, 12, 1], [24, 9, 1]], 0xe0f8ff);
  },

  // Goldwasser: hohe Flasche mit flüssigem Gold, Goldstaub wirbelt, eine Münze fällt hinein
  elixier_gold(p) {
    p.rays(20, 20, 8, 0x0e3a42, 0x144a52, 0.3);
    glow(p, 20, 20, 20, 0xf2b92c, 0.5);
    cloud(p, 20, 20, 20, 20, 0xf2b92c, 0.5, 22);
    // Flasche
    p.fig((q) => {
      q.rrect(11, 15, 18, 22, GLASS_D, 5);
      q.rect(17, 7, 6, 9, GLASS_D);
      q.rect(16, 5, 8, 3, 0xa8741c);
    });
    p.rrect(12, 16, 16, 20, 0x1c2c3c, 4);
    p.rect(18, 8, 4, 8, 0x1c2c3c);
    p.rrect(12, 19, 16, 17, P.gold[2], 4);
    p.rect(12, 19, 16, 1, P.gold[4]);
    p.rect(12, 20, 16, 1, P.gold[3]);
    p.rect(24, 22, 3, 13, P.gold[1]);
    p.rect(13, 20, 1, 14, 0xfff6c8);
    // Wirbel aus Goldstaub
    for (const [x, y] of [[16, 24], [21, 27], [18, 31], [24, 25], [22, 33], [15, 29]]) { p.set(x, y, 0xfff0a0); p.set(x + 1, y, 0xf2b92c); }
    p.sparkle(20, 24, 0xfff6c8);
    // Münze fällt hinein
    p.fig((q) => q.ell(20, 3, 4, 4, P.gold[3]));
    p.rect(19, 2, 2, 3, P.gold[1]); p.set(18, 2, 0xffffff);
    p.sparkle(5, 14, 0xffe27a, true); p.sparkle(35, 10, 0xffe27a); p.sparkle(34, 30, 0xfff6c8, true); p.sparkle(6, 32, 0xffe27a);
  },

  // Echowachs: blaues Siegel, von dem Wellen nach außen laufen
  elixier_echo(p) {
    p.vgrad(0, 0, 40, 40, [0x0a2438, 0x14486a, 0x1a6a8a]);
    // Wellenringe, nach außen blasser
    for (const [r, c] of [[17, 0x2a8ab0], [14, 0x3aa8d0], [11, 0x6ac8e8]] as [number, number][]) {
      const pts = arcPts(20, 21, r, r, 0, 360, r * 4);
      for (let i = 0; i < pts.length; i += 2) if ((i / 2) % 3 !== 2) p.set(pts[i], pts[i + 1], c);
    }
    // Siegel (unregelmäßiger Wachsklecks)
    p.fig((q) => {
      q.ball(20, 21, 9, ramp(0x2a78d8), 0.1);
      for (const [x, y, r] of [[12, 24, 3], [28, 18, 3], [22, 30, 3], [15, 13, 3], [27, 27, 2]] as [number, number, number][]) q.disc(x, y, r, ramp(0x2a78d8)[2]);
    });
    p.ring(20, 21, 6, 0x1a4a98); p.ring(20, 21, 3, 0x1a4a98);
    p.ring(20, 21, 6, 0x8ac8ff, 1);
    p.set(14, 17, 0xcfe8ff); p.set(15, 16, 0xcfe8ff);
    p.disc(20, 21, 1, 0xcfe8ff);
    // Wachstropfen
    p.fig((q) => { q.disc(12, 32, 2, ramp(0x2a78d8)[2]); q.rect(11, 30, 3, 2, ramp(0x2a78d8)[2]); });
    p.set(11, 32, 0x8ac8ff);
    // Kerze oben links
    p.fig((q) => { q.rect(3, 2, 6, 9, P.cream[3]); });
    p.rect(3, 2, 2, 9, P.cream[4]); p.rect(8, 2, 1, 9, P.cream[1]);
    p.rect(5, 11, 1, 3, 0x6ac8ff); p.set(5, 14, 0x6ac8ff);
    p.poly([6, -1, 8, 2, 4, 2], 0xffb43a); p.set(6, 1, 0xfff0b0);
    // Schallbögen links und rechts
    for (const d of [1, 2, 3]) { p.line(2 + d * 0, 28 + d, 2, 32 + d, 0x9ad8ff); p.line(37 - d * 0, 10 - d, 37, 6 - d, 0x9ad8ff); }
    p.sparkle(34, 33, 0xffffff);
  },

  // Münzwachs: goldgelbes Siegel mit Münzprägung neben einem Münzstapel
  elixier_muenze(p) {
    p.vgrad(0, 0, 40, 40, [0x6a4a2a, 0x8a6638, 0xa88048]);
    // Pergament mit Falten
    for (let y = 0; y < 40; y += 8) p.rect(0, y, 40, 1, 0x7a5a30);
    for (let x = 6; x < 40; x += 14) p.rect(x, 0, 1, 40, 0x94703e);
    cloud(p, 20, 20, 20, 18, 0xc8a060, 0.7, 25);
    // Band
    p.rect(0, 33, 40, 4, 0xa8324a); p.rect(0, 33, 40, 1, 0xd8587a); p.rect(0, 36, 40, 1, 0x6a1a30);
    // Siegel
    p.fig((q) => {
      q.ball(23, 20, 10, P.yellow, 0.1);
      for (const [x, y, r] of [[15, 24, 3], [31, 16, 3], [26, 30, 3], [18, 12, 3]] as [number, number, number][]) q.disc(x, y, r, P.yellow[2]);
    });
    p.ring(23, 20, 7, P.yellow[1]);
    p.disc(23, 20, 6, P.yellow[3]);
    p.textBig('$', 20, 16, P.copper[1], 2);
    p.set(17, 15, 0xffffff); p.set(18, 14, 0xfff6c8);
    // Münzstapel links
    for (let i = 0; i < 4; i++) {
      const y = 32 - i * 3;
      p.fig((q) => q.ell(8, y, 6, 2.5, P.gold[2]));
      p.rect(3, y, 11, 2, P.gold[1]); p.rect(4, y - 1, 5, 1, P.gold[4]);
    }
    p.sparkle(8, 17, 0xfff6c8, true); p.sparkle(35, 8, 0xfff6c8);
  },

  // Sternwachs: purpurrotes Siegel mit Stern, der Stempel schwebt noch darüber
  elixier_stern(p) {
    cosmos(p, [0x0a0a2c, 0x1a1450, 0x3a1a68], 33, { stars: 18, clouds: [[8, 30, 14, 10, 0x6a2ab0, 0.7]] });
    // Siegel
    const wr = ramp(0xc02a68);
    p.fig((q) => {
      q.ball(20, 29, 10, wr, 0.1);
      for (const [x, y, r] of [[11, 33, 3], [30, 31, 3], [21, 39, 2], [12, 23, 3]] as [number, number, number][]) q.disc(x, y, r, wr[2]);
    });
    p.ring(20, 29, 8, wr[1]);
    p.poly(starPts(20, 29, 7, 3, 5), wr[0]);
    p.poly(starPts(20, 28.5, 6, 2.5, 5), wr[4]);
    p.poly(starPts(20, 29, 4, 1.7, 5), wr[3]);
    p.set(13, 23, 0xffc0d8); p.set(14, 22, 0xffc0d8);
    // Stempel (Messing) darüber
    p.fig((q) => {
      q.rect(18, 3, 5, 9, P.wood[2]);
      q.ball(20, 3, 4, P.wood, 0.1);
      q.rect(14, 12, 13, 3, P.gold[2]);
      q.rect(16, 15, 9, 2, P.gold[1]);
    });
    p.rect(14, 12, 13, 1, P.gold[4]);
    p.poly(starPts(20, 17, 2, 0.9, 5), 0xffe27a);
    // Tropfende Funken
    p.sparkle(8, 10, 0xffffff, true); p.sparkle(33, 14, 0xffd0f0); p.sparkle(34, 33, 0xffe27a);
    dust(p, [[17, 21], [23, 21], [20, 22]], [0xffc0d8]);
  },
};
void burst; void shine; void star4; void lit; void glow;
