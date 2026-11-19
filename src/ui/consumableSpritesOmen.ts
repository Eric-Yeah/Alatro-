import type { Pix } from './jokerPix';
import {
  INK, PAL as P, arcPts, bubbles, burst, cloud, cosmos, dust, glow, hills, ramp, rng, star4, starPts, wall, type Sprite,
} from './consumableKit';

// Omen: neun dunkle Karten in Violett und Silber, jede mit eigener Szene. Fläche 40 mal 40, Mitte x = 20.

/** Fledermaus als kleine Silhouette. */
function bat(p: Pix, x: number, y: number, c = 0x120a22) {
  p.set(x, y, c); p.set(x - 1, y - 1, c); p.set(x + 1, y - 1, c);
  p.set(x - 2, y, c); p.set(x + 2, y, c); p.set(x - 3, y - 1, c); p.set(x + 3, y - 1, c);
  p.set(x - 1, y + 1, c); p.set(x + 1, y + 1, c);
}

export const SPRITES_OMEN: Record<string, Sprite> = {
  // Blutmond: ein blutroter Mond, aus dem es tropft, über toten Bäumen
  omen_blutmond(p) {
    p.vgrad(0, 0, 40, 40, [0x1a0614, 0x3a0c24, 0x5a1426]);
    p.stars(10, 0, 0, 40, 20, rng(111));
    glow(p, 20, 15, 17, 0xc02838, 0.9);
    p.ball(20, 15, 12, ramp(0xd8382f), 0.08);
    for (const [x, y] of [[15, 11], [24, 17], [19, 21], [25, 9]]) p.rect(x, y, 2, 1, 0x9c2a3d);
    p.set(13, 9, 0xffa0a0); p.set(14, 8, 0xffa0a0);
    // Tropfen
    for (const [x, y, l] of [[16, 27, 4], [21, 28, 7], [26, 26, 3]] as [number, number, number][]) {
      p.rect(x, y, 1, l, 0xd8382f); p.set(x, y + l, 0xff6060); p.set(x - 1, y + l + 1, 0xa02030); p.set(x + 1, y + l + 1, 0xa02030);
    }
    hills(p, 33, 1.5, 14, 0.4, 0x14081a, 0x2a1030);
    // tote Bäume
    const tree = (x: number, h: number) => {
      p.line(x, 38, x, 38 - h, 0x0c0612);
      p.line(x, 38 - h * 0.6, x - 4, 38 - h * 0.9, 0x0c0612); p.line(x, 38 - h * 0.45, x + 4, 38 - h * 0.8, 0x0c0612);
      p.line(x - 4, 38 - h * 0.9, x - 6, 38 - h, 0x0c0612); p.line(x + 4, 38 - h * 0.8, x + 5, 38 - h * 0.95, 0x0c0612);
    };
    tree(6, 16); tree(34, 20);
    p.rect(0, 37, 40, 3, 0x0c0612);
    bat(p, 8, 8); bat(p, 32, 6); bat(p, 28, 22, 0x1a0a24);
  },

  // Aschenregen: Asche und Glut fallen aus rauchigen Wolken auf einen verbrannten Turm
  omen_aschenregen(p) {
    p.vgrad(0, 0, 40, 40, [0x2a2630, 0x4a3a40, 0x8a4a38]);
    cloud(p, 12, 6, 18, 9, 0x6a606a, 1, 121); cloud(p, 30, 4, 16, 8, 0x5a5260, 1, 122); cloud(p, 20, 12, 22, 8, 0x7a6a74, 0.8, 123);
    glow(p, 20, 38, 18, 0xff7a2a, 0.9);
    // Turmruine
    p.fig((q) => {
      q.rect(14, 20, 12, 18, P.stone[1]);
      q.rect(13, 17, 3, 4, P.stone[1]); q.rect(18, 18, 3, 3, P.stone[1]); q.rect(24, 16, 3, 5, P.stone[1]);
    });
    p.rect(15, 21, 3, 17, P.stone[2]); p.rect(15, 21, 1, 17, P.stone[3]);
    p.rect(19, 25, 3, 5, 0x1a1218); p.rect(20, 26, 1, 3, 0xff8a2a);
    hills(p, 36, 1, 10, 0, 0x1a1218);
    // Aschenflocken als kurze Striche, Glut als orange Punkte
    const r = rng(7);
    for (let i = 0; i < 34; i++) {
      const x = Math.floor(r() * 40), y = Math.floor(10 + r() * 26);
      if (r() < 0.65) { p.set(x, y, 0xd8d0d8); p.set(x - 1, y - 1, 0x9a929a); }
      else { p.set(x, y, 0xffa030); p.set(x, y + 1, 0xd8502a); }
    }
    p.rect(0, 37, 40, 3, 0x1a1218);
    for (const x of [4, 8, 31, 36]) p.line(x, 37, x + 1, 31 - (x % 4), 0x0c0810);
  },

  // Teufelsmarkt: ein Stand mit gestreifter Markise, glühender Maske und Münzen
  omen_teufelsmarkt(p) {
    cosmos(p, [0x14081e, 0x2a1038, 0x4a1a3a], 131, { stars: 10, clouds: [[20, 8, 22, 8, 0x8a2a6a, 0.6]] });
    // Markise
    for (let x = 0; x < 40; x += 5) {
      const c = (x / 5) % 2 ? 0x14081a : 0xd8382f;
      p.rect(x, 3, 5, 10, c);
      p.poly([x, 13, x + 5, 13, x + 2.5, 17], c);
      p.rect(x, 3, 1, 10, c === 0xd8382f ? 0xff7a6a : 0x3a1a48);
    }
    p.rect(0, 2, 40, 2, 0xf2b92c); p.rect(0, 2, 40, 1, 0xffe27a);
    // Stand
    p.rect(0, 17, 40, 23, 0x1c0e28);
    p.rect(0, 30, 40, 10, P.darkwood[1]); p.rect(0, 30, 40, 2, P.darkwood[3]); p.rect(0, 32, 40, 1, P.darkwood[0]);
    // Hörnermaske mit glühenden Augen
    p.fig((q) => {
      q.ell(20, 24, 7, 7, P.crimson[2]);
      q.poly([14, 20, 9, 11, 17, 17], P.crimson[2]); q.poly([26, 20, 31, 11, 23, 17], P.crimson[2]);
    });
    p.poly([17, 21, 19.5, 23, 17, 24.5], 0xffe040); p.poly([23, 21, 20.5, 23, 23, 24.5], 0xffe040);
    p.set(17, 22, 0xffffff); p.set(23, 22, 0xffffff);
    for (let i = 0; i < 5; i++) { p.set(17 + i * 1.5, 28, 0xf4efe0); p.set(17 + i * 1.5, 29, 0xd0c8b0); }
    p.rect(15, 20, 1, 3, 0xff8a98);
    // Waren: Münzen und Fläschchen
    for (const x of [3, 7]) { p.fig((q) => q.ell(x, 29, 3, 1.5, P.gold[2])); p.set(x - 1, 28, 0xfff6c8); }
    p.rect(30, 24, 4, 6, 0x6a2ab8); p.rect(31, 22, 2, 2, P.tan[3]); p.set(30, 25, 0xd0a0ff);
    p.rect(35, 26, 3, 4, 0x2ab0a0); p.set(35, 26, 0xc0fff0);
    // Laterne
    p.line(2, 17, 2, 21, 0x9a8a50); p.fig((q) => q.rect(0, 21, 5, 5, 0xffb43a)); p.rect(1, 22, 3, 3, 0xffe27a);
    p.sparkle(35, 18, 0xffe27a);
  },

  // Hexenkessel: schwarzer Kessel auf grünem Feuer, die Brühe schäumt in Regenbogenfarben über
  omen_hexenkessel(p) {
    p.vgrad(0, 0, 40, 40, [0x14082a, 0x2a1250, 0x44207a]);
    cloud(p, 20, 12, 22, 12, 0x7a3ad0, 0.7, 141);
    p.stars(10, 0, 0, 40, 14, rng(141));
    // Dampf mit Prisma Funken
    for (const [x, y, c] of [[14, 6, 0xff7ab8], [19, 3, 0x7affc8], [25, 7, 0x8ab8ff], [21, 10, 0xffe27a], [11, 11, 0xd09aff], [29, 12, 0x7affc8]] as [number, number, number][]) { p.sparkle(x, y, c); }
    // Kessel
    p.fig((q) => {
      q.ball(20, 26, 12, P.iron, 0.12);
      q.poly([12, 33, 16, 33, 14, 38, 11, 38], P.iron[1]);
      q.poly([24, 33, 28, 33, 29, 38, 26, 38], P.iron[1]);
      q.ell(20, 17, 12, 3.5, P.iron[3]);
    });
    p.ell(20, 17, 10, 2.5, 0x2a9a40);
    p.ell(20, 17, 8, 1.6, 0x7aff7a);
    p.ell(20, 17, 4, 1, 0xd0ffd0);
    // Schaum schwappt über
    p.disc(10, 19, 1.5, 0x7aff7a); p.rect(10, 20, 1, 5, 0x3ad050);
    p.disc(30, 19, 1.5, 0x7aff7a); p.rect(30, 20, 1, 4, 0x3ad050);
    bubbles(p, [[16, 15, 2], [24, 14, 2], [20, 12, 1]], 0xe0ffe0);
    // Henkelringe
    p.ring(7, 22, 3, P.iron[3]); p.ring(33, 22, 3, P.iron[3]);
    p.rect(16, 21, 1, 7, P.iron[4]);
    // grünes Feuer
    p.rect(0, 38, 40, 2, 0x0a1a10);
    for (const [x, h] of [[8, 7], [14, 10], [20, 8], [26, 10], [32, 6]] as [number, number][]) {
      p.poly([x, 40 - h, x + 3, 40, x - 3, 40], 0x2ad060);
      p.poly([x, 40 - h + 3, x + 1.5, 40, x - 1.5, 40], 0xc8ffa0);
    }
  },

  // Kometenstaub: ein zerbrechender Komet, sein Staub rieselt als buntes Glitzern auf einen Haufen
  omen_kometenstaub(p) {
    cosmos(p, [0x0a0a30, 0x1a1050, 0x3a1a78], 151, { stars: 14 });
    // Schweif nach rechts oben
    for (let i = 0; i < 40; i++) {
      const t = i / 40, x = 10 + t * 26, y = 9 - t * 6;
      for (let k = -2; k <= 2; k++) if ((i + k) % 2 === 0) p.set(x, y + k * (0.6 + t), t < 0.5 ? 0xe8e0ff : 0x8a7ae0);
    }
    // Kometenkopf in Brocken
    glow(p, 11, 10, 9, 0xfff0b0, 0.9);
    p.ball(11, 10, 5, P.yellow, 0.05);
    p.disc(9, 8, 1.5, 0xffffff);
    for (const [x, y, r] of [[17, 14, 2], [14, 17, 1.5], [6, 15, 1.5], [19, 9, 1]] as [number, number, number][]) { p.ball(x, y, r, P.orange, 0.05); }
    // Staubregen
    const r = rng(3);
    const cols = [0xff7ab8, 0x7affc8, 0x8ab8ff, 0xffe27a, 0xd09aff, 0xffffff];
    for (let i = 0; i < 40; i++) {
      const y = 16 + r() * 18, x = 8 + (y - 16) * 0.5 + r() * 14;
      p.set(x, y, cols[Math.floor(r() * cols.length)]);
    }
    // Haufen
    p.fig((q) => q.poly([4, 39, 12, 33, 20, 30, 28, 33, 36, 39], P.purple[2]), INK);
    for (let i = 0; i < 70; i++) {
      const x = 5 + r() * 30, top = 30 + Math.abs(x - 20) * 0.45;
      const y = top + r() * (39 - top);
      p.set(x, y, cols[Math.floor(r() * cols.length)]);
    }
    p.sparkle(20, 30, 0xffffff, true); p.sparkle(30, 34, 0xffffff);
  },

  // Siegelsturm: rote Wachssiegel kreisen in einem Wirbel um einen Blitz
  omen_siegelsturm(p) {
    p.vgrad(0, 0, 40, 40, [0x1a1030, 0x32244e, 0x4a3a6a]);
    // Wirbelwolken
    for (let k = 0; k < 6; k++) {
      const r0 = 5 + k * 3;
      const pts = arcPts(20, 20, r0, r0 * 0.8, k * 55, k * 55 + 230, r0 * 3);
      for (let i = 0; i < pts.length; i += 2) {
        p.set(pts[i], pts[i + 1], k % 2 ? 0x8a7ab0 : 0xb8aad8);
        if (i % 4 === 0) p.set(pts[i] + 1, pts[i + 1], 0x6a5a90);
      }
    }
    // Blitz
    p.fig((q) => q.poly([22, 2, 14, 21, 20, 21, 16, 38, 28, 16, 21, 16, 26, 2], P.yellow[2]), INK);
    p.poly([22, 3, 16, 19, 20, 19], P.yellow[4]);
    // Siegel im Kreis
    for (const [x, y, r] of [[8, 10, 4], [32, 11, 3], [30, 29, 4], [10, 30, 3], [34, 21, 2]] as [number, number, number][]) {
      p.fig((q) => q.ball(x, y, r, P.red, 0.1));
      p.ring(x, y, Math.max(1, r - 2), P.red[4]);
      p.set(x - 1, y - 1, 0xffffff);
    }
    p.sparkle(20, 38, 0xffe27a); p.sparkle(3, 20, 0xffffff);
  },

  // Nachtpakt: ein Vertrag mit Runenkreis, Mond und Sonne teilen sich das Blatt
  omen_nachtpakt(p) {
    p.vgrad(0, 0, 40, 40, [0x0e0a20, 0x201444, 0x3a1a5a]);
    cloud(p, 20, 20, 22, 20, 0x6a2ab0, 0.7, 171);
    p.stars(12, 0, 0, 40, 40, rng(171));
    // Runenkreis
    const pts = arcPts(20, 20, 17, 17, 0, 360, 24);
    for (let i = 0; i < pts.length; i += 2) { p.set(pts[i], pts[i + 1], i % 4 === 0 ? 0xffffff : 0xc080ff); }
    p.ring(20, 20, 15, 0x7a40c0);
    // Pergament
    p.fig((q) => q.rect(10, 8, 20, 25, 0xe8d8a8));
    p.rect(10, 8, 20, 1, 0xfff0c8); p.rect(11, 32, 19, 1, 0xb89860); p.rect(29, 9, 1, 24, 0xc8b078);
    for (let y = 12; y < 24; y += 3) p.rect(13, y, 14 - (y % 2) * 4, 1, 0x5a4a30);
    // Mond und Sonne oben im Vertrag
    p.disc(15, 10, 0, 0);
    p.disc(14, 11, 2, 0x5a4a8a); p.disc(15, 10, 2, 0xe8d8a8);
    p.disc(26, 11, 2, 0xd8802a); p.set(26, 8, 0xd8802a); p.set(26, 14, 0xd8802a); p.set(23, 11, 0xd8802a); p.set(29, 11, 0xd8802a);
    // Unterschrift und Siegel
    p.line(13, 27, 17, 25, 0x2a1a5a); p.line(17, 25, 20, 28, 0x2a1a5a);
    p.fig((q) => q.ball(25, 28, 4, P.red, 0.1));
    p.set(24, 27, 0xffa0a0); p.ring(25, 28, 2, P.red[1]);
    // Feder
    p.fig((q) => q.poly([29, 22, 38, 6, 37, 15, 33, 24], 0xf4efe0));
    p.line(30, 22, 37, 7, 0xc8c0a8);
    p.sparkle(5, 8, 0xe0c0ff, true); p.sparkle(35, 34, 0xffffff);
  },

  // Ahnenruf: ein gekrönter Ahne steigt aus dem Kerzenkreis, Gold im Violett
  omen_ahnenruf(p) {
    p.vgrad(0, 0, 40, 40, [0x0a0a28, 0x1a1a4a, 0x2a2a6a]);
    cloud(p, 20, 18, 20, 20, 0x5a6ad8, 0.6, 181);
    p.stars(10, 0, 0, 40, 20, rng(181));
    glow(p, 20, 19, 16, 0x8ab8ff, 0.8);
    // Geisterfigur: heller Körper, durchscheinend (Dither)
    const ghost = (x: number, y: number) => {
      const edge = x < 10 || x > 30;
      void edge;
      return (x + y) % 2 === 0;
    };
    // Umhang
    p.poly([20, 14, 29, 20, 31, 36, 9, 36, 11, 20], (x, y) => ghost(x, y) ? 0xcfe0ff : 0x7a98e0);
    p.poly([20, 15, 26, 21, 27, 36, 13, 36, 14, 21], (x, y) => (y > 30 && (x + y) % 3 === 0) ? 0x7a98e0 : 0xb8ccf8);
    // Kopf mit Krone
    p.fig((q) => q.disc(20, 11, 5, 0xe0ecff), 0x5a70c8);
    p.rect(18, 11, 1, 2, 0x1a2a6a); p.rect(22, 11, 1, 2, 0x1a2a6a); p.rect(19, 15, 3, 1, 0x1a2a6a);
    p.fig((q) => { q.poly([14, 7, 15, 2, 18, 5, 20, 1, 22, 5, 25, 2, 26, 7], P.gold[2]); }, INK);
    p.rect(15, 6, 11, 1, P.gold[4]); p.set(20, 2, 0xffffff);
    // Arme, die ein Szepter halten
    p.line(14, 24, 10, 22, 0xe0ecff); p.line(10, 22, 10, 33, 0xa8741c); p.disc(10, 21, 1.5, 0xffe27a);
    // Kerzenkreis
    for (const x of [4, 12, 20, 28, 36]) {
      const y = 36 + (Math.abs(x - 20) > 10 ? -1 : 0);
      p.rect(x - 1, y - 2, 3, 5, 0xf0e6c8); p.rect(x - 1, y - 2, 1, 5, 0xffffff);
      p.set(x, y - 4, 0xffb43a); p.set(x, y - 3, 0xffe27a);
    }
    p.rect(0, 38, 40, 2, 0x0a0a22);
    p.sparkle(7, 12, 0xcfe0ff, true); p.sparkle(33, 10, 0xffe27a);
  },

  // Spiegelsaal: ein silberner Spiegel, in dem sich ein Gang aus Bögen ins Unendliche spiegelt
  omen_spiegelsaal(p) {
    p.vgrad(0, 0, 40, 40, [0x1c1034, 0x3a2468, 0x5a3a8a]);
    // Spiegelrahmen
    p.fig((q) => q.ell(20, 20, 16, 19, P.steel[2]), INK);
    p.ellRing(20, 20, 16, 19, P.steel[4], 1);
    p.ellRing(20, 20, 14, 17, P.steel[1], 1);
    // Innenfläche: Gang mit Bögen, nach hinten kleiner
    p.ell(20, 20, 13, 16, 0x2a2060);
    for (let k = 0; k < 5; k++) {
      const s = 1 - k * 0.19;
      const w = 11 * s, h = 14 * s, cy = 21 + k * 0.4;
      const c = k % 2 ? 0x8a78d0 : 0xb8a8f0;
      p.line(20 - w, cy + h * 0.5, 20 - w, cy - h * 0.25, c);
      p.line(20 + w, cy + h * 0.5, 20 + w, cy - h * 0.25, c);
      const arc = arcPts(20, cy - h * 0.25, w, h * 0.5, 180, 360, 12);
      for (let i = 0; i + 3 < arc.length; i += 2) p.line(arc[i], arc[i + 1], arc[i + 2], arc[i + 3], c);
      p.line(20 - w, cy + h * 0.5, 20 + w, cy + h * 0.5, 0x4a3a90);
    }
    glow(p, 20, 20, 6, 0xe8e0ff, 0.8);
    p.disc(20, 20, 1.5, 0xffffff);
    // Glanzstreifen
    p.line(10, 12, 15, 6, 0xffffff); p.line(8, 17, 14, 8, 0xe8e0ff);
    // Sockel
    p.fig((q) => q.rect(14, 36, 12, 3, P.steel[1]));
    p.sparkle(4, 5, 0xe8e0ff, true); p.sparkle(36, 34, 0xffffff);
  },
};
void bubbles; void burst; void cosmos; void dust; void star4; void starPts; void wall;
