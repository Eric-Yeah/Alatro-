import { INK, Pix, rng, ramp, type Ramp } from './jokerPix';
import { PAL as P, arcPts, glow, hills, sky, starPts, type Sprite } from './jokerKit';

// Motive Gruppe E: Sternwart, Lehrling, Regeln und Passive.

/** Zahnrad mit Zähnen, Nabe und Speichen. */
function gear(p: Pix, cx: number, cy: number, r: number, teeth: number, rp: Ramp, rot = 0, spokes = 5) {
  p.fig((q) => {
    for (let i = 0; i < teeth; i++) {
      const a = rot + (i / teeth) * Math.PI * 2;
      const hw = (Math.PI / teeth) * 0.55;
      const r0 = r - 1.5, r1 = r + 1.5;
      q.poly([
        cx + Math.cos(a - hw) * r0, cy + Math.sin(a - hw) * r0, cx + Math.cos(a - hw * 0.7) * r1, cy + Math.sin(a - hw * 0.7) * r1,
        cx + Math.cos(a + hw * 0.7) * r1, cy + Math.sin(a + hw * 0.7) * r1, cx + Math.cos(a + hw) * r0, cy + Math.sin(a + hw) * r0,
      ], rp[2]);
    }
    q.disc(cx, cy, r - 1, rp[2]);
  });
  p.disc(cx, cy, r - 1, rp[2]);
  p.ring(cx, cy, r - 1, rp[3], 1);
  p.disc(cx, cy, Math.max(2, r - 4), 0x2a1a10);
  for (let i = 0; i < spokes; i++) {
    const a = rot + (i / spokes) * Math.PI * 2;
    p.line(cx, cy, cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3), rp[2], 2);
  }
  p.disc(cx, cy, Math.max(1, Math.round(r / 4)), rp[3]);
  p.set(cx - 1, cy - 1, rp[4]);
}

export const SPRITES_E: Record<string, Sprite> = {
  // Sternwart: Kuppel mit Fernrohr und Sternbild
  sternwart(p) {
    sky(p, [0x060a28, 0x14246a, 0x3a4a9a], 30, 211);
    // Sternbild mit Linien
    const c: [number, number][] = [[6, 10], [14, 6], [21, 12], [27, 6], [33, 14], [40, 9]];
    for (let i = 0; i + 1 < c.length; i++) p.line(c[i][0], c[i][1], c[i + 1][0], c[i + 1][1], 0x4a6ac0);
    for (const [x, y] of c) p.sparkle(x, y, 0xcfe0ff);
    p.line(41, 2, 36, 6, 0xffffff); p.set(35, 7, 0xcfe0ff);
    // Kuppel
    p.fig((q) => {
      q.rect(2, 40, 42, 12, P.stone[2]);
      q.ell(23, 42, 19, 20, P.stone[2]);
      q.rect(2, 42, 42, 10, P.stone[2]);
    });
    p.shadedEll(23, 42, 19, 20, P.stone, 0.08);
    p.rect(2, 42, 42, 10, P.stone[2]);
    p.rect(2, 42, 4, 10, P.stone[3]); p.rect(40, 42, 4, 10, P.stone[1]);
    p.rect(2, 41, 42, 1, P.stone[4]);
    // Spalt
    p.poly([20, 22, 27, 22, 29, 42, 18, 42], 0x0a1240);
    p.line(19, 22, 17, 42, P.stone[4]); p.line(28, 22, 30, 42, P.stone[0]);
    p.stars(5, 19, 24, 28, 40, rng(3));
    for (let y = 46; y < 52; y += 3) p.rect(2, y, 42, 1, P.stone[1]);
    // Fernrohr
    p.fig((q) => {
      q.poly([16, 40, 20, 42, 38, 12, 33, 10], P.gold[2]);
      q.poly([16, 40, 18, 38, 36, 9, 38, 12, 20, 42], P.gold[3]);
      q.poly([33, 10, 38, 12, 41, 7, 36, 5], P.gold[1]);
      q.rect(27, 24, 3, 3, P.iron[2]);
    });
    p.set(37, 6, 0xffffff);
    p.sparkle(40, 24, 0xffe27a);
  },

  // Lehrling: junger Gehilfe mit viel zu großem Hut und brodelndem Kolben
  lehrling(p) {
    p.vgrad(0, 0, 46, 52, [0x1a2a48, 0x2a3a5a, 0x3a4a68]);
    // Regal im Hintergrund
    p.rect(0, 18, 46, 2, P.darkwood[2]);
    for (const [x, c] of [[3, P.red], [10, P.green], [34, P.yellow], [40, P.purple]] as [number, Ramp][]) {
      p.fig((q) => { q.rect(x, 10, 5, 8, c[2]); q.rect(x + 1, 8, 3, 2, P.cream[3]); }, null);
      p.set(x + 1, 12, c[4]);
    }
    p.rect(0, 46, 46, 6, P.darkwood[1]); p.rect(0, 46, 46, 1, P.darkwood[3]);
    // Gestalt
    p.fig((q) => {
      q.poly([8, 52, 10, 36, 16, 28, 30, 28, 36, 36, 38, 52], P.blue[1]);
      q.poly([10, 52, 12, 38, 18, 30, 24, 30, 24, 52], P.blue[2]);
      q.ell(21, 24, 7, 7, P.skin[3]);
      // Hut
      q.poly([10, 20, 12, 15, 18, 13, 20, 4, 22, 0, 26, 8, 30, 14, 33, 20], P.purple[1]);
      q.poly([10, 20, 12, 15, 18, 13, 20, 4, 22, 0, 18, 14, 14, 18], P.purple[2]);
      q.rect(12, 18, 21, 3, P.purple[0]);
    });
    p.rect(14, 17, 17, 1, P.gold[3]);
    p.poly(starPts(22, 10, 2.4, 1, 5), 0xffe27a);
    p.rect(18, 22, 2, 3, 0xffffff); p.rect(24, 22, 2, 3, 0xffffff); p.set(19, 24, INK); p.set(25, 24, INK);
    p.rect(21, 28, 3, 1, 0x7a3a3a);
    // Kolben
    p.fig((q) => {
      q.rect(33, 29, 3, 6, 0xd8eef4);
      q.disc(34, 40, 6, 0xd8eef4);
      q.line(30, 36, 27, 34, P.blue[2], 3);
    });
    p.disc(34, 41, 5, P.green[2]); p.ell(34, 37, 4, 1, P.lime[3]);
    p.set(32, 40, 0xe8ffc0); p.ring(36, 43, 1, P.lime[4]);
    // Qualm und Blasen
    p.fig((q) => { q.disc(36, 22, 3, 0x9a8ac8); q.disc(40, 17, 3, 0xb8a8e0); q.disc(35, 14, 2, 0xcbbcf0); }, null);
    p.set(38, 9, 0xd8c8ff); p.set(41, 12, 0xd8c8ff);
    p.sparkle(5, 30, 0xc8ff90);
  },

  // Schnellgriff: behandschuhte Hand mit vier gestreckten Fingern
  schnellgriff(p) {
    p.vgrad(0, 0, 46, 52, [0x1a1048, 0x3a2a88, 0x6a4ab8]);
    for (let i = 0; i < 8; i++) p.rect(2 + (i * 7) % 12, 6 + i * 5, 6, 1, 0x8a72d8);
    for (let i = 0; i < 6; i++) p.rect(36 + (i * 5) % 8, 8 + i * 7, 6, 1, 0x8a72d8);
    // Hand
    p.fig((q) => {
      q.rrect(11, 24, 24, 20, P.indigo[2], 3);
      const fingers: [number, number, number][] = [[11, 8, 6], [17, 5, 6], [23, 4, 6], [29, 9, 6]];
      for (const [x, y, w] of fingers) { q.rrect(x, y, w, 20, P.indigo[2], 2); }
      q.poly([11, 36, 4, 32, 2, 27, 5, 24, 11, 30], P.indigo[2]);
      q.rect(10, 43, 26, 9, P.gold[2]);
    });
    for (const [x, y] of [[11, 8], [17, 5], [23, 4], [29, 9]] as [number, number][]) {
      p.rect(x, y + 1, 1, 22, P.indigo[3]); p.rect(x + 5, y + 2, 1, 22, P.indigo[1]);
      p.rect(x, y + 12, 6, 1, P.indigo[1]); p.rect(x + 1, y + 1, 4, 1, P.indigo[4]);
    }
    p.rect(11, 24, 24, 1, P.indigo[4]);
    for (let i = 0; i < 6; i++) p.set(14 + i * 4, 32, P.indigo[4]);
    p.rect(10, 43, 26, 1, P.gold[4]); p.rect(10, 51, 26, 1, P.gold[1]);
    p.rect(10, 46, 26, 1, P.gold[3]);
    p.textBig('4', 37, 22, 0xffe27a, 2);
    p.sparkle(6, 6, 0xcbbcff);
  },

  // Sprungbrett: ein Frosch springt über die Lücke zwischen zwei Seerosenblättern
  sprungbrett(p) {
    p.vgrad(0, 0, 46, 52, [0x1a6a8a, 0x2a9aa0, 0x68d0b0]);
    p.rect(0, 40, 46, 12, 0x1a5a70);
    for (let x = 0; x < 46; x += 5) p.rect(x, 43 + (x % 10 ? 2 : 0), 3, 1, 0x4a9ab0);
    // Seerosenblätter
    p.fig((q) => {
      q.ell(8, 41, 9, 3, P.green[2]); q.ell(37, 40, 9, 3, P.green[2]);
    });
    p.poly([8, 41, 12, 40, 12, 42], 0x1a5a70); p.poly([37, 40, 41, 39, 41, 41], 0x1a5a70);
    p.ell(8, 40, 7, 2, P.lime[3]); p.ell(37, 39, 7, 2, P.lime[3]);
    p.fig((q) => { q.disc(36, 36, 2, P.pink[3]); q.rect(36, 37, 1, 2, P.green[0]); }, null);
    p.set(36, 35, 0xffffff);
    // Sprungbahn
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      p.set(8 + t * 29, 36 - Math.sin(t * Math.PI) * 20, 0xc8f8ff);
    }
    // Frosch im Sprung
    p.fig((q) => {
      q.ell(23, 17, 6, 4, P.green[2]);
      q.disc(28, 14, 3, P.green[3]);
      q.disc(26, 11, 2, P.green[3]); q.disc(30, 11, 2, P.green[3]);
      q.poly([19, 18, 11, 22, 6, 24, 8, 26, 14, 24, 21, 22], P.green[2]);
      q.poly([27, 20, 34, 24, 40, 26, 40, 28, 33, 27, 25, 22], P.green[2]);
      q.poly([29, 17, 34, 20, 33, 22, 27, 19], P.green[2]);
    });
    p.ell(23, 18, 4, 2, P.lime[3]);
    p.set(26, 11, INK); p.set(30, 11, INK); p.set(26, 10, 0xffffff); p.set(30, 10, 0xffffff);
    p.rect(28, 16, 3, 1, P.red[2]);
    p.sparkle(8, 10, 0xffffff); p.sparkle(40, 6, 0xffffff);
  },

  // Farbwechsel: Chamäleon, dessen Haut über den ganzen Körper die Farbe wechselt
  farbwechsel(p) {
    p.vgrad(0, 0, 46, 52, [0x1a5a38, 0x2a8a48, 0x68b858]);
    for (const [x, y, s] of [[6, 10, 6], [38, 8, 5], [40, 26, 6], [5, 30, 5]] as [number, number, number][]) {
      p.fig((q) => { q.ell(x, y, s, s / 2, P.forest[2]); }, null);
      p.line(x - s + 1, y, x + s - 1, y, P.forest[1]);
    }
    // Ast
    p.fig((q) => { q.rect(0, 38, 46, 3, P.darkwood[2]); q.rect(0, 38, 46, 1, P.darkwood[4]); }, null);
    p.rect(0, 41, 46, 11, 0x1a4a30);
    const bandColors = [0x40c070, 0x30c0a8, 0x3a8ae0, 0x7a5ae0, 0xd04ab8, 0xf07a50];
    const body = new Pix(46, 52);
    body.ell(21, 28, 14, 8, 1);
    body.poly([6, 28, 2, 24, 3, 20, 8, 24], 1);
    body.poly([32, 24, 40, 20, 42, 24, 36, 30], 1);
    for (let y = 0; y < 52; y++) for (let x = 0; x < 46; x++) {
      if (body.get(x, y) !== 1) continue;
      const k = Math.min(5, Math.max(0, Math.floor(((x - 2) / 40) * 6 + (bayer4(x, y) - 0.5) * 0.9)));
      p.set(x, y, bandColors[k]);
    }
    p.fig((q) => {
      // Kopf mit Kamm
      q.poly([2, 22, 6, 14, 14, 14, 16, 22, 8, 26], 0x40c070);
      q.poly([6, 14, 10, 8, 14, 14], 0x40c070);
      // Beine
      q.rect(14, 34, 3, 5, 0x30c0a8); q.rect(28, 34, 3, 5, 0x3a8ae0);
      // Schwanzspirale
      q.ring(40, 35, 6, 0xd04ab8, 2);
    }, INK);
    p.ring(40, 35, 4, 0xf07a50, 1);
    // Rumpf wieder darüber schattieren
    for (let x = 8; x < 36; x += 4) { p.set(x, 24, 0xffffff); p.set(x + 1, 25, 0xf0f8ff); }
    p.ring(8, 19, 3, P.yellow[3], 1); p.disc(8, 19, 1, INK); p.set(7, 18, 0xffffff);
    p.rect(2, 24, 6, 1, INK);
    p.sparkle(24, 10, 0xffffff); p.sparkle(14, 46, 0xd04ab8); p.sparkle(34, 46, 0x3a8ae0); p.sparkle(4, 44, 0x40c070);
  },

  // Streuguss: bunte Flüssigkeit spritzt aus einem gekippten Kolben
  streuguss(p) {
    p.vgrad(0, 0, 46, 52, [0x14142e, 0x241c48, 0x3a2a68]);
    p.rect(0, 46, 46, 6, 0x0e0e20);
    // Kolben, gekippt
    p.fig((q) => {
      q.disc(12, 12, 8, 0xd8eef4);
      q.line(16, 8, 26, 2, 0xd8eef4, 5);
      q.rect(24, 0, 5, 3, P.wood[2]);
    });
    p.disc(12, 14, 6, P.magenta[3]); p.disc(11, 11, 2, P.magenta[4]);
    p.set(8, 7, 0xffffff); p.set(9, 6, 0xffffff);
    // Strahl in vielen Farben
    const cols = [0xff4c7a, 0xf5b32b, 0x3fbf7f, 0x0a8cff, 0xb26bff];
    for (let i = 0; i < 28; i++) {
      const t = i / 27;
      const x = 28 + t * 12, y = 4 + t * t * 38 + t * 2;
      p.rect(x, y, 3, 2, cols[Math.floor(i / 6) % 5]);
    }
    // Spritzer am Boden als Krone
    const r = rng(33);
    for (let i = 0; i < 22; i++) {
      const a = -Math.PI * (0.1 + 0.8 * r());
      const d = 4 + r() * 11;
      p.set(40 + Math.cos(a) * d * 1.3, 44 + Math.sin(a) * d * 1.1, cols[i % 5]);
      if (r() < 0.5) p.set(40 + Math.cos(a) * d * 1.3 + 1, 44 + Math.sin(a) * d * 1.1, cols[(i + 2) % 5]);
    }
    p.ell(40, 46, 9, 2, 0xb26bff); p.ell(38, 46, 5, 1, 0xff4c7a); p.ell(43, 46, 4, 1, 0x3fbf7f);
    for (const [x, y, c] of [[6, 30, 0xf5b32b], [10, 40, 0xff4c7a], [4, 22, 0x0a8cff], [18, 34, 0x3fbf7f]] as [number, number, number][]) { p.disc(x, y, 2, c); p.set(x - 1, y - 1, 0xffffff); }
    p.sparkle(20, 22, 0xffffff);
  },

  // Maskenball: Maske mit Federn und Goldzier
  maskenball(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0a38, 0x3a1a68, 0x5a2a88]);
    const r = rng(50);
    for (let i = 0; i < 22; i++) { const c = [0xf5b32b, 0xff4c7a, 0x5fe3ff, 0xb26bff][i % 4]; const x = Math.floor(r() * 44), y = Math.floor(r() * 50); p.rect(x, y, 2, 1, c); }
    // Federn
    p.fig((q) => {
      q.poly([34, 18, 36, 8, 44, 2, 42, 12, 38, 18], P.teal[2]);
      q.poly([36, 18, 42, 10, 46, 10, 44, 18, 40, 20], P.pink[2]);
      q.line(36, 17, 43, 4, P.teal[4]);
    });
    // Maske
    p.fig((q) => {
      q.poly([4, 26, 10, 17, 23, 21, 36, 17, 42, 26, 40, 34, 32, 36, 26, 31, 23, 33, 20, 31, 14, 36, 6, 34], P.purple[2]);
    });
    p.poly([4, 26, 10, 17, 23, 21, 23, 25, 8, 28], P.purple[3]);
    p.poly([42, 26, 36, 17, 23, 21, 23, 25, 38, 28], P.purple[2]);
    p.poly([6, 34, 14, 36, 20, 31, 23, 33, 26, 31, 32, 36, 40, 34, 40, 30, 32, 32, 23, 28, 14, 32, 6, 30], P.purple[1]);
    // Augenöffnungen
    p.poly([9, 25, 14, 23, 19, 27, 14, 30, 9, 28], 0x14082a);
    p.poly([37, 25, 32, 23, 27, 27, 32, 30, 37, 28], 0x14082a);
    p.set(14, 26, 0xf5d070); p.set(32, 26, 0xf5d070);
    // Goldzier
    p.path([8, 24, 14, 21, 23, 24, 32, 21, 38, 24], P.gold[3], 1);
    p.path([8, 33, 14, 34, 20, 30], P.gold[3], 1); p.path([38, 33, 32, 34, 26, 30], P.gold[3], 1);
    p.poly(starPts(23, 27, 3.5, 1.4, 5), P.gold[3]);
    p.disc(23, 27, 1, P.red[3]);
    for (const [x, y] of [[6, 27], [40, 27]] as [number, number][]) { p.disc(x, y, 1, P.gold[3]); }
    // Bänder
    p.fig((q) => { q.poly([4, 28, 0, 36, 2, 44, 6, 36], P.pink[2]); }, null);
    p.line(2, 44, 6, 46, P.pink[1]);
    p.sparkle(14, 8, 0xffe27a); p.sparkle(30, 44, 0xffe27a); p.sparkle(10, 46, 0xcbbcff);
  },

  // Uhrwerk: ineinander greifende Messing Zahnräder
  uhrwerk(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1a14, 0x3a2418, 0x4a2e1c]);
    for (let y = 3; y < 52; y += 6) for (let x = 3; x < 46; x += 6) p.set(x, y, 0x5a3a24);
    glow(p, 20, 28, 20, 0x8a5a24, 0.5);
    gear(p, 18, 30, 15, 12, P.gold, 0, 6);
    gear(p, 37, 16, 9, 8, P.copper, 0.2, 4);
    gear(p, 35, 42, 7, 7, P.steel, 0.4, 3);
    gear(p, 5, 9, 6, 6, P.copper, 0.1, 3);
    // Feder und Schrauben
    p.fig((q) => { q.ring(18, 30, 5, P.iron[3], 1); });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; p.set(18 + Math.cos(a) * 11, 30 + Math.sin(a) * 11, P.gold[0]); }
    p.sparkle(26, 6, 0xffe27a); p.sparkle(44, 30, 0xffe27a); p.sparkle(8, 46, 0xffe27a);
  },

  // Pendel: das Pendel schwingt, Schatten der Ausschläge bleiben
  pendel(p) {
    p.vgrad(0, 0, 46, 52, [0x0e2a38, 0x1a4a58, 0x2a6a70]);
    p.fig((q) => { q.rect(18, 0, 10, 4, P.darkwood[2]); q.rect(21, 3, 4, 3, P.gold[2]); }, null);
    const bob = (ang: number, solid: boolean) => {
      const x = 23 + Math.sin(ang) * 30, y = 5 + Math.cos(ang) * 30;
      if (solid) {
        p.line(23, 5, x, y, P.gold[3], 1);
        p.fig((q) => { q.ball(x, y, 7, P.gold, 0.08); }, 0x3a2208);
        p.ring(x, y, 4, P.gold[1], 1);
        p.set(x - 2, y - 3, 0xffffff);
      } else {
        for (let i = 0; i < 11; i++) { const t = i / 10; if (i % 2) p.set(23 + (x - 23) * t, 5 + (y - 5) * t, 0x6ab0b8); }
        p.ring(x, y, 6, 0x4a8a98, 1);
        p.disc(x, y, 3, 0x2a6a78);
      }
    };
    bob(-0.62, false);
    bob(0.35, false);
    bob(0.62, true);
    // Bahn
    for (let i = 0; i < 20; i++) { const a = -0.7 + (i / 19) * 1.4; p.set(23 + Math.sin(a) * 33, 5 + Math.cos(a) * 33 + 0, 0xa8e0e8); }
    // Skala
    for (let i = -3; i <= 3; i++) { const a = i * 0.2; p.set(23 + Math.sin(a) * 40, 5 + Math.cos(a) * 40, 0xffffff); }
    p.sparkle(8, 12, 0xcfeff0); p.sparkle(40, 14, 0xcfeff0);
  },

  // Falttasche: Ledertasche mit Schnalle, aus der Karten schauen
  falttasche(p) {
    p.vgrad(0, 0, 46, 52, [0x4a2a58, 0xa85a68, 0xf0a868]);
    hills(p, 40, 3, 26, 1, 0x4a2a48, 0x7a4a68);
    p.rect(0, 46, 46, 6, 0x3a2038);
    // Karten schauen heraus
    p.fig((q) => { q.poly([10, 22, 14, 6, 21, 8, 19, 24], P.white[4]); q.poly([18, 22, 24, 4, 31, 8, 25, 24], P.white[3]); }, INK);
    p.set(16, 12, P.red[2]); p.set(17, 13, P.red[2]); p.set(15, 13, P.red[2]); p.set(16, 14, P.red[2]);
    p.set(26, 10, INK); p.set(27, 11, INK); p.set(25, 11, INK); p.set(26, 12, INK);
    // Tasche
    p.fig((q) => {
      q.rrect(5, 22, 36, 24, P.wood[2], 3);
      q.poly([5, 24, 41, 24, 40, 36, 23, 40, 6, 36], P.wood[3]);
    });
    p.rect(5, 22, 36, 2, P.wood[4]);
    p.rect(5, 44, 36, 2, P.wood[0]);
    for (let x = 8; x < 40; x += 3) p.set(x, 25, P.wood[1]);
    p.poly([6, 36, 23, 40, 40, 36, 40, 38, 23, 42, 6, 38], P.wood[1]);
    // Riemen und Schnalle
    p.rect(20, 24, 6, 18, P.wood[1]);
    p.rect(19, 36, 8, 6, P.gold[2]); p.rect(21, 38, 4, 2, 0x2a1408); p.rect(19, 36, 8, 1, P.gold[4]);
    // Tragegriff
    p.path(arcPts(23, 22, 10, 6, 180, 360, 12), P.darkwood[2], 2);
    p.set(5, 28, P.wood[0]);
    p.sparkle(40, 10, 0xffe0b0);
  },

  // Glücksklee: vierblättriges Kleeblatt mit Tautropfen und Marienkäfer
  gluecksklee(p) {
    p.vgrad(0, 0, 46, 52, [0xc8f0a8, 0x88d878, 0x48a858]);
    glow(p, 23, 24, 20, 0xf8ffd0, 0.8);
    p.rect(0, 46, 46, 6, 0x2a7a3a);
    for (let x = 0; x < 46; x += 2) p.line(x, 52, x + (x % 4 ? 1 : -1), 46, 0x3a9a48);
    p.path([23, 26, 22, 34, 25, 40, 23, 48], P.forest[2], 2);
    const leafHeart = (dx: number, dy: number) => {
      const cx = 23 + dx * 8, cy = 22 + dy * 8;
      const px = -dy, py = dx;
      p.fig((q) => {
        q.disc(cx + px * 3, cy + py * 3, 5, P.green[2]);
        q.disc(cx - px * 3, cy - py * 3, 5, P.green[2]);
        q.poly([cx + px * 8, cy + py * 8, cx - px * 8, cy - py * 8, 23 + dx * 1, 22 + dy * 1], P.green[2]);
      }, 0x0e3a1a);
      p.line(23, 22, cx + dx * 3, cy + dy * 3, P.green[4]);
      p.set(cx + px * 3 - dx * 2, cy + py * 3 - dy * 2, P.lime[4]);
    };
    leafHeart(-1, -1); leafHeart(1, -1); leafHeart(-1, 1); leafHeart(1, 1);
    p.disc(23, 22, 1, P.lime[4]);
    // Tautropfen
    p.fig((q) => { q.ell(17, 14, 1, 2, 0xcff8ff); }, 0x0e3a5a);
    p.set(17, 13, 0xffffff);
    // Marienkäfer
    p.fig((q) => { q.ell(35, 40, 4, 3, P.red[2]); q.disc(31, 40, 2, INK); }, null);
    p.line(35, 37, 35, 43, INK); p.set(33, 39, INK); p.set(37, 39, INK); p.set(34, 42, INK); p.set(37, 41, INK);
    p.set(30, 38, INK); p.set(32, 38, INK);
    p.sparkle(8, 10, 0xffffff); p.sparkle(40, 12, 0xffffff);
  },

  // Gürteltasche: Gürtel mit Beuteln, Phiolen und Schlüssel
  guerteltasche(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1a14, 0x3a2a1c, 0x4a3a28]);
    for (let x = 0; x < 46; x += 9) { p.rect(x, 0, 1, 52, 0x2a1a10); p.rect(x + 1, 0, 1, 52, 0x4a3422); }
    // Gürtel
    p.fig((q) => {
      q.rect(0, 12, 46, 7, P.tan[1]);
      q.rect(0, 12, 46, 1, P.tan[3]); q.rect(0, 18, 46, 1, P.tan[0]);
    }, INK);
    for (let x = 2; x < 46; x += 4) p.rect(x, 15, 2, 1, P.tan[0]);
    p.fig((q) => { q.rect(18, 10, 10, 11, P.gold[2]); }, 0x3a2208);
    p.rect(20, 12, 6, 7, 0x4a3422); p.rect(18, 10, 10, 1, P.gold[4]); p.rect(22, 13, 2, 5, P.gold[3]);
    // Beutel
    const pouch = (x: number, y: number, w: number, h: number, rp: Ramp) => {
      p.line(x + w / 2, 19, x + w / 2, y, P.tan[0]);
      p.fig((q) => {
        q.rrect(x, y, w, h, rp[2], 3);
        q.rect(x, y, w, 3, rp[3]);
      });
      p.rect(x, y + 3, w, 1, rp[1]);
      p.rect(x + w / 2 - 1, y + 4, 2, 2, P.gold[3]);
      p.rect(x + 1, y + 2, 1, h - 4, rp[4]);
    };
    pouch(3, 24, 11, 14, P.red);
    pouch(33, 25, 10, 16, P.forest);
    pouch(15, 32, 9, 11, P.purple);
    // Phiolen
    for (const [x, c] of [[26, P.cyan], [30, P.lime]] as [number, Ramp][]) {
      p.line(x + 1, 19, x + 1, 26, P.tan[0]);
      p.fig((q) => { q.rect(x, 26, 3, 9, 0xd8eef4); q.rect(x, 22, 3, 5, 0xd8eef4); }, null);
      p.rect(x, 30, 3, 5, c[2]); p.rect(x, 22, 3, 2, P.wood[2]);
    }
    // Schlüssel
    p.fig((q) => { q.ring(8, 46, 3, P.gold[3], 1); q.rect(11, 46, 10, 1, P.gold[3]); q.rect(18, 47, 1, 3, P.gold[3]); q.rect(20, 47, 1, 2, P.gold[3]); }, null);
    p.sparkle(40, 6, 0xffe27a); p.sparkle(26, 46, 0xcff8ff);
  },

  // Lastkarren: voll beladener Handkarren auf der Landstraße
  lastkarren(p) {
    sky(p, [0x2a3a78, 0xb86a8a, 0xf8c078], 0, 1, 38);
    hills(p, 32, 3, 30, 1, 0x4a4a78, 0x7a6a98);
    p.rect(0, 40, 46, 12, 0x6a5038); p.rect(0, 40, 46, 1, 0x9a7a52); p.speckle(0, 41, 46, 11, 0x7a6048, 0.25, rng(9));
    // Ladung
    p.fig((q) => {
      q.rect(10, 20, 11, 10, P.wood[2]); q.rect(10, 20, 11, 1, P.wood[4]); q.rect(15, 20, 1, 10, P.wood[1]);
      q.rect(10, 24, 11, 1, P.wood[1]);
      q.ell(30, 25, 7, 6, P.tan[3]); q.rect(28, 17, 4, 3, P.tan[3]);
      q.rect(20, 12, 10, 8, P.wood[3]); q.rect(20, 12, 10, 1, P.wood[4]); q.rect(25, 12, 1, 8, P.wood[1]);
      q.rect(14, 12, 6, 8, P.blue[2]); q.rect(14, 12, 6, 1, P.blue[4]);
    });
    p.rect(27, 18, 6, 1, P.red[2]);
    // Karren
    p.fig((q) => {
      q.rect(6, 30, 34, 4, P.wood[2]);
      q.rect(6, 30, 34, 1, P.wood[4]); q.rect(6, 33, 34, 1, P.wood[0]);
      q.rect(6, 22, 2, 9, P.wood[2]); q.rect(38, 22, 2, 9, P.wood[2]);
      q.line(40, 33, 46, 22, P.darkwood[3], 2);
    });
    // Rad
    p.fig((q) => { q.disc(18, 40, 9, P.darkwood[2]); }, null);
    p.ring(18, 40, 9, P.wood[3], 2);
    p.disc(18, 40, 7, 0x6a5038);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.line(18, 40, 18 + Math.cos(a) * 7, 40 + Math.sin(a) * 7, P.wood[2]); }
    p.disc(18, 40, 2, P.iron[3]);
    p.fig((q) => { q.rect(30, 40, 3, 6, P.darkwood[2]); }, null);
    p.sparkle(40, 8, 0xffe8b0);
  },

  // Spiegelbild: ovaler Goldspiegel mit gespiegeltem Mond und Stern
  spiegelbild(p) {
    p.vgrad(0, 0, 46, 52, [0x3a1a58, 0x4a2a68, 0x3a1a58]);
    for (let x = 0; x < 46; x += 8) p.rect(x, 0, 3, 52, 0x4a2a68);
    p.fig((q) => { q.ell(23, 26, 18, 24, P.gold[2]); }, 0x3a2208);
    p.ellRing(23, 26, 18, 24, P.gold[3], 3);
    p.ellRing(23, 26, 15, 21, P.gold[1], 1);
    p.ell(23, 26, 14, 20, 0xbfe8f4);
    p.vgrad(10, 8, 26, 36, [0xd8f4fa, 0xa0d4e8, 0x78b0d0]);
    p.ell(23, 26, 14, 20, 0xbfe8f4);
    // Spiegelung: Stern oben, Abbild unten
    p.poly(starPts(17, 17, 5, 2, 5), 0xfff0b0);
    p.ball(28, 20, 4, ramp(0xe8e4c8), 0.1);
    p.rect(11, 29, 24, 1, 0x78b0d0);
    p.poly(starPts(29, 38, 4, 1.6, 5, 90), 0xc0e8f0);
    p.ball(18, 36, 3, ramp(0xcfe0e0), 0.1);
    // Glanz
    p.line(12, 36, 22, 14, 0xffffff, 2); p.line(24, 40, 31, 28, 0xffffff, 1);
    // Krone oben
    p.fig((q) => { q.poly([17, 4, 19, 0, 23, 3, 27, 0, 29, 4, 29, 6, 17, 6], P.gold[3]); }, null);
    p.disc(23, 3, 1, P.red[3]);
    p.fig((q) => { q.poly([19, 52, 23, 48, 27, 52], P.gold[2]); }, null);
    p.sparkle(5, 14, 0xe8d0ff); p.sparkle(41, 38, 0xe8d0ff);
  },

  // Urbild: Steintafel mit leuchtendem Ursymbol in einer Höhle
  urbild(p) {
    p.vgrad(0, 0, 46, 52, [0x14100e, 0x2a1e18, 0x3a2a20]);
    for (const [x, h] of [[4, 8], [10, 5], [30, 6], [40, 9], [35, 4]] as [number, number][]) p.poly([x - 2, 0, x + 2, 0, x, h], 0x4a3a30);
    glow(p, 23, 26, 20, 0xe0802a, 0.7);
    p.fig((q) => {
      q.rect(9, 8, 28, 42, P.stone[2]);
      q.ell(23, 9, 14, 6, P.stone[2]);
      q.rect(9, 9, 3, 41, P.stone[3]); q.rect(35, 9, 2, 41, P.stone[1]);
    });
    p.rect(11, 9, 24, 40, P.slate[2]);
    p.rect(11, 9, 24, 40, P.slate[2]);
    for (let y = 12; y < 48; y += 6) p.rect(12, y, 22, 1, P.slate[1]);
    // Zeichen
    const glowC = 0xffa83a;
    p.ring(23, 26, 10, glowC, 2);
    p.ring(23, 26, 5, glowC, 1);
    p.disc(23, 26, 2, 0xffe27a);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      p.line(23 + Math.cos(a) * 12, 26 + Math.sin(a) * 12, 23 + Math.cos(a) * 15, 26 + Math.sin(a) * 15, i % 2 ? 0xffd070 : glowC);
    }
    p.rect(22, 40, 3, 1, glowC); p.rect(20, 42, 7, 1, glowC); p.rect(22, 44, 3, 1, glowC);
    p.rect(21, 12, 5, 1, glowC);
    // Handabdrücke
    for (const [x, y] of [[4, 34], [42, 30]] as [number, number][]) {
      p.rect(x - 1, y, 3, 4, 0xc87a3a); p.rect(x - 2, y - 3, 1, 3, 0xc87a3a); p.rect(x, y - 4, 1, 4, 0xc87a3a); p.rect(x + 1, y - 3, 1, 3, 0xc87a3a);
    }
    p.rect(0, 50, 46, 2, 0x2a1e18);
    p.sparkle(6, 20, 0xffc060); p.sparkle(40, 16, 0xffc060);
  },

  // Schutzengel: kleiner Engel mit Heiligenschein vor dem Himmel
  schutzengel(p) {
    p.vgrad(0, 0, 46, 52, [0x6ab0f0, 0xa8d8f8, 0xf0f4e8]);
    p.rays(23, 22, 8, 0xb8e0fa, 0xa8d8f8, 0.4);
    p.vgrad(0, 0, 46, 52, [0x6ab0f0, 0xa8d8f8, 0xf0f4e8]);
    glow(p, 23, 22, 18, 0xffffff, 0.9);
    // Wolken
    for (const [x, y, r] of [[5, 46, 7], [14, 48, 8], [32, 47, 8], [41, 46, 7], [23, 50, 8]] as [number, number, number][]) p.ball(x, y, r, P.snow, 0.05);
    // Flügel
    const wing = (s: number) => {
      const X = (v: number) => 23 + s * v;
      p.fig((q) => {
        q.poly([X(4), 24, X(10), 12, X(17), 7, X(22), 9, X(21), 17, X(19), 25, X(14), 34, X(6), 36], P.white[4]);
      }, 0x6a8ab8);
      for (let i = 0; i < 4; i++) p.line(X(8 + i * 3), 16 + i * 4, X(18), 12 + i * 5, P.white[2]);
      p.line(X(6), 28, X(14), 30, P.white[2]);
    };
    wing(-1); wing(1);
    // Gewand
    p.fig((q) => {
      q.poly([17, 24, 29, 24, 33, 46, 13, 46], P.white[4]);
      q.rect(17, 24, 3, 22, P.white[3]);
      q.ell(23, 17, 5, 5, P.skin[3]);
    }, 0x6a8ab8);
    p.rect(29, 28, 2, 18, P.white[2]); p.rect(26, 34, 1, 12, P.white[2]);
    p.rect(17, 31, 13, 2, P.gold[3]);
    // Haar und Gesicht
    p.poly([18, 17, 19, 11, 27, 11, 28, 17, 26, 14, 20, 14], P.gold[3]);
    p.set(21, 18, INK); p.set(25, 18, INK); p.set(23, 20, P.pink[2]);
    p.rect(20, 19, 1, 1, P.pink[3]); p.rect(26, 19, 1, 1, P.pink[3]);
    // Hände gefaltet
    p.ell(23, 28, 2, 2, P.skin[3]);
    // Heiligenschein
    p.ellRing(23, 8, 7, 2, P.gold[4], 1);
    p.ellRing(23, 8, 7, 2, P.gold[3], 1);
    p.sparkle(7, 14, 0xffffff, true); p.sparkle(40, 20, 0xffffff);
  },
};

function bayer4(x: number, y: number): number {
  return [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y & 3) * 4 + (x & 3)] / 16;
}

