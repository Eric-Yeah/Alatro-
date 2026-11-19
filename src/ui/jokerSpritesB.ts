import { INK, Pix, rng, ramp, type Ramp } from './jokerPix';
import { PAL as P, flame, glow, moon, sky, starPts, wall, type Sprite } from './jokerKit';

// Motive Gruppe B: Farb und Rang Jokers (Karten Suit und Rang Bedingungen).

/** Blatt als kleine Raute mit Seitenzipfeln, Mitte (x, y), Größe s. */
function leaf(p: Pix, x: number, y: number, s: number, rp: Ramp, vein = true) {
  p.poly([x, y - s, x + s * 0.9, y - s * 0.2, x + s * 0.5, y + s * 0.3, x, y + s, x - s * 0.5, y + s * 0.3, x - s * 0.9, y - s * 0.2], rp[2]);
  p.poly([x, y - s, x - s * 0.9, y - s * 0.2, x - s * 0.5, y + s * 0.3, x, y + s * 0.2], rp[3]);
  if (vein && s >= 3) p.line(x, y - s + 1, x, y + s - 1, rp[1]);
}

export const SPRITES_B: Record<string, Sprite> = {
  // Glut: Haufen glühender Kohlen
  glut(p) {
    p.vgrad(0, 0, 46, 52, [0x120606, 0x3a0e0e, 0x8a2410, 0xe05a1a]);
    glow(p, 23, 36, 20, 0xff8a2a, 0.8);
    const coals: [number, number, number, number, boolean][] = [
      [8, 46, 8, 5, false], [22, 47, 9, 5, false], [37, 46, 8, 5, false],
      [14, 40, 7, 5, true], [29, 40, 8, 5, true], [22, 34, 7, 5, true], [38, 39, 5, 4, false], [6, 38, 4, 3, false],
    ];
    for (const [x, y, rx, ry, hot] of coals) {
      p.fig((q) => { q.shadedEll(x, y, rx, ry, hot ? ramp(0xd8501c) : ramp(0x4a2224), 0.1); }, 0x1a0808);
    }
    // glühende Risse
    const r = rng(14);
    for (let i = 0; i < 26; i++) {
      const [x, y, rx, ry] = coals[Math.floor(r() * coals.length)];
      const px = Math.round(x + (r() - 0.5) * rx * 1.4), py = Math.round(y + (r() - 0.5) * ry * 1.2);
      p.set(px, py, 0xffc43a); p.set(px + 1, py, 0xff8a2a);
    }
    flame(p, 22, 14, 14, true);
    flame(p, 14, 28, 7, false, -1);
    flame(p, 31, 27, 8, false, 1);
    p.sparkle(8, 20, 0xffc43a); p.sparkle(38, 18, 0xffc43a); p.set(30, 9, 0xff8a2a); p.set(12, 10, 0xff8a2a); p.set(35, 5, 0xffc43a);
  },

  // Frost: Eiskristall zwischen Eiszapfen
  frost(p) {
    p.vgrad(0, 0, 46, 52, [0x08143a, 0x14308a, 0x3a78c8]);
    p.stars(14, 0, 0, 46, 30, rng(4), [0xffffff, 0xcff4ff]);
    glow(p, 23, 26, 20, 0x6ab4f4, 0.9);
    const cx = 23, cy = 26;
    const arm = (ang: number) => {
      const a = (ang * Math.PI) / 180;
      const dx = Math.cos(a), dy = Math.sin(a);
      p.line(cx, cy, cx + dx * 17, cy + dy * 17, 0xe8fbff, 1);
      for (const [d, l] of [[7, 5], [12, 4]]) {
        const bx = cx + dx * d, by = cy + dy * d;
        for (const s of [-1, 1]) {
          const b = a + (s * Math.PI) / 3;
          p.line(bx, by, bx + Math.cos(b) * l, by + Math.sin(b) * l, 0xbfeeff);
        }
      }
      p.set(cx + dx * 18, cy + dy * 18, 0xffffff);
    };
    for (let k = 0; k < 6; k++) arm(-90 + k * 60);
    p.poly([cx - 3, cy - 5, cx + 3, cy - 5, cx + 6, cy, cx + 3, cy + 5, cx - 3, cy + 5, cx - 6, cy], 0xcff4ff);
    p.poly([cx - 2, cy - 3, cx + 2, cy - 3, cx + 4, cy, cx + 2, cy + 3, cx - 2, cy + 3, cx - 4, cy], 0xffffff);
    // Eiszapfen oben und Reif unten
    for (const [x, w, h] of [[2, 4, 12], [8, 3, 7], [14, 3, 9], [31, 3, 8], [37, 4, 13], [43, 3, 6]]) {
      p.poly([x - w / 2, 0, x + w / 2 + 1, 0, x + 0.5, h], 0xaee8ff);
      p.poly([x - w / 2, 0, x + 0.5, 0, x + 0.5, h], 0xe8fbff);
    }
    p.rect(0, 47, 46, 5, 0xdff4ff);
    p.speckle(0, 47, 46, 5, 0xffffff, 0.4, rng(8));
    p.rect(0, 47, 46, 1, 0xffffff);
    p.sparkle(8, 24, 0xcff4ff); p.sparkle(39, 30, 0xcff4ff);
  },

  // Kleinvieh: ein Schaf mit Lamm auf der Weide
  kleinvieh(p) {
    p.vgrad(0, 0, 46, 36, [0x68b8f0, 0xa8e0f8, 0xe8f6e0]);
    p.fig((q) => { q.disc(34, 8, 4, P.white[4]); }, null);
    p.disc(36, 7, 5, 0xfff6c0);
    p.rect(8, 6, 8, 2, 0xffffff); p.rect(10, 5, 5, 1, 0xffffff);
    for (let x = 0; x < 46; x++) {
      const t = Math.round(30 + Math.sin(x / 7) * 3);
      p.rect(x, t, 1, 52 - t, P.lime[2]);
      p.set(x, t, P.lime[4]);
    }
    p.rect(0, 40, 46, 12, P.green[2]);
    p.speckle(0, 40, 46, 12, P.green[1], 0.2, rng(3));
    p.speckle(0, 31, 46, 9, P.lime[3], 0.12, rng(4));
    // Schaf
    p.fig((q) => {
      q.rect(12, 33, 3, 9, 0x3a2a30); q.rect(21, 34, 3, 8, 0x3a2a30); q.rect(26, 34, 3, 8, 0x3a2a30);
      for (const [x, y, r] of [[14, 26, 6], [21, 24, 7], [28, 26, 6], [18, 31, 6], [25, 31, 6], [11, 31, 4], [31, 31, 4]]) q.ball(x, y, r, P.white, 0.05);
      q.ell(34, 26, 4, 5, 0x4a3a40);
      q.rect(30, 24, 2, 3, 0x2a1e24);
    });
    p.set(35, 25, 0xffffff); p.set(36, 25, 0xffffff); p.set(36, 28, 0xe08aa0);
    p.set(33, 22, 0x4a3a40); p.rect(31, 21, 2, 1, 0x4a3a40);
    // Lamm
    p.fig((q) => {
      q.rect(36, 44, 2, 5, 0x3a2a30); q.rect(41, 44, 2, 5, 0x3a2a30);
      q.ball(39, 42, 4, P.white, 0.05);
      q.disc(43, 41, 2, 0x4a3a40);
    });
    for (const [x, y, c] of [[4, 46, 0xf8e060], [8, 49, 0xff8aa8], [3, 50, 0xffffff], [19, 48, 0xf8e060], [27, 49, 0xff8aa8]] as [number, number, number][]) { p.set(x, y, c); p.set(x, y + 1, P.green[0]); }
  },

  // Herzblut: herzförmiger Kolben mit rotem Trank
  herzblut(p) {
    p.vgrad(0, 0, 46, 52, [0x2a0a1e, 0x5a1634, 0x8a2a40]);
    glow(p, 23, 28, 20, 0xc03a50, 0.6);
    p.fig((q) => {
      q.rect(19, 5, 8, 4, P.wood[2]);
      q.rect(19, 5, 8, 1, P.wood[4]);
      q.rect(20, 9, 6, 8, 0xd8eef4);
      q.rect(20, 9, 1, 8, 0xffffff);
      q.disc(16, 24, 9, P.red[2]);
      q.disc(30, 24, 9, P.red[2]);
      q.poly([8, 28, 38, 28, 23, 46], P.red[2]);
      q.poly([9, 29, 37, 29, 23, 45], P.red[2]);
    });
    // Schattierung: unten rechts dunkler, oben links hell
    for (let y = 14; y < 47; y++) for (let x = 6; x < 40; x++) {
      if (p.get(x, y) !== P.red[2]) continue;
      const d = (x - 23) * 0.6 + (y - 30) * 0.9;
      if (d > 7) p.set(x, y, P.red[1]);
      if (d > 13) p.set(x, y, P.red[0]);
      if (d < -9) p.set(x, y, P.red[3]);
    }
    p.rect(12, 18, 3, 1, P.red[4]); p.set(11, 19, P.red[4]); p.set(11, 20, P.red[4]); p.rect(13, 19, 1, 2, 0xffffff); p.rect(12, 17, 2, 1, 0xffffff);
    p.path([14, 22, 15, 25], 0xffffff);
    // Blasen im Trank
    p.ring(24, 30, 2, P.red[4]); p.set(30, 25, P.red[4]); p.set(18, 33, P.red[4]);
    // Tropfen
    for (const [x, y] of [[23, 48], [12, 40], [34, 40]] as [number, number][]) {
      p.set(x, y, P.red[3]); p.rect(x - 1, y + 1, 3, 1, P.red[2]); p.rect(x, y + 2, 1, 1, P.red[1]);
    }
    p.sparkle(7, 10, 0xff8aa0); p.sparkle(39, 12, 0xff8aa0);
  },

  // Diamantstaub: ein Diamant über glitzerndem Staub
  diamantstaub(p) {
    p.vgrad(0, 0, 46, 52, [0x0a1030, 0x1a2a6a, 0x3a3a98]);
    p.stars(26, 0, 0, 46, 36, rng(17), [0xffffff, 0xaaf0ff, 0xd0c0ff]);
    glow(p, 23, 22, 16, 0x5aa8ff, 0.8);
    // Staubhaufen
    for (let x = 0; x < 46; x++) {
      const top = Math.round(40 + Math.abs(x - 23) * 0.25 + Math.sin(x * 1.3) * 0.7);
      for (let y = top; y < 52; y++) p.set(x, y, (x + y) % 3 === 0 ? 0xe8fbff : (x * 3 + y) % 5 === 0 ? 0xaaf0ff : 0x6ab8e8);
    }
    p.rect(0, 49, 46, 3, 0x3a78c8);
    // Edelstein
    p.fig((q) => {
      q.poly([14, 10, 32, 10, 38, 19, 23, 42, 8, 19], 0x7ae0f0);
      // Facetten
      q.poly([14, 10, 32, 10, 28, 19, 18, 19], 0xe8fbff);
      q.poly([8, 19, 14, 10, 18, 19], 0xaaf0ff);
      q.poly([38, 19, 32, 10, 28, 19], 0x5ac0e0);
      q.poly([8, 19, 18, 19, 23, 42], 0x5ac8e8);
      q.poly([18, 19, 28, 19, 23, 42], 0x9af0ff);
      q.poly([28, 19, 38, 19, 23, 42], 0x3a98c8);
    }, 0x0a2058);
    p.line(14, 10, 18, 19, 0xffffff); p.line(32, 10, 28, 19, 0x9af0ff); p.line(8, 19, 38, 19, 0x2a78a8);
    p.rect(19, 12, 4, 1, 0xffffff); p.rect(20, 14, 2, 1, 0xffffff);
    p.sparkle(34, 9, 0xffffff, true); p.sparkle(8, 30, 0xaaf0ff); p.sparkle(40, 32, 0xd0c0ff, true); p.sparkle(14, 40, 0xffffff);
  },

  // Nachtschatten: Zweig mit schwarzen Beeren und violetten Blüten
  nachtschatten(p) {
    p.vgrad(0, 0, 46, 52, [0x0a0a24, 0x241a50, 0x4a2a78]);
    p.stars(12, 0, 0, 46, 24, rng(23));
    moon(p, 37, 9, 4);
    p.path([22, 52, 22, 44, 20, 36, 22, 26, 24, 18], 0x2a5a3a, 2);
    p.path([21, 38, 12, 32], 0x2a5a3a, 1);
    p.path([23, 28, 33, 22], 0x2a5a3a, 1);
    // Blätter
    for (const [x, y, s] of [[10, 29, 5], [34, 20, 5], [12, 42, 5], [32, 40, 5], [15, 20, 4]] as [number, number, number][]) leaf(p, x, y, s, P.forest);
    leaf(p, 23, 47, 4, P.green);
    // Blüten
    p.fig((q) => {
      q.poly(starPts(26, 12, 5, 2.4, 5), P.purple[3]);
      q.disc(26, 12, 1, P.yellow[3]);
    });
    p.fig((q) => { q.poly(starPts(14, 11, 4, 2, 5), P.purple[2]); q.set(14, 11, 0xf7dc4a); });
    // Beeren
    for (const [x, y] of [[18, 33], [26, 33], [22, 38], [30, 29]] as [number, number][]) {
      p.fig((q) => { q.ball(x, y, 3, ramp(0x3a2a68), 0.05); });
      p.set(x - 1, y - 1, 0xd8c8ff);
    }
    p.rect(0, 50, 46, 2, 0x1a1a3a);
  },

  // Efeu: Ranke klettert über eine alte Steinmauer
  efeu(p) {
    wall(p, 0, 52, ramp(0x5a6a7a), 12, 6);
    // Moos und Lichtschein
    glow(p, 36, 8, 18, 0x8aa8b8, 0.4);
    // Ranke
    const pts: [number, number][] = [];
    for (let i = 0; i <= 48; i += 2) pts.push([23 + Math.sin(i / 6.5) * 9, 51 - i]);
    for (let i = 0; i + 1 < pts.length; i++) p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], P.darkwood[1], 2);
    pts.forEach(([x, y], i) => {
      if (i % 2 === 1) return;
      const side = i % 4 === 0 ? -1 : 1;
      const s = 4 + (i % 3 === 0 ? 1 : 0);
      p.fig((q) => { leaf(q, x + side * 6, y + 1, s, i % 3 === 0 ? P.green : P.forest); }, 0x0e2a1a);
    });
    p.fig((q) => { leaf(q, 23, 2, 5, P.lime); }, 0x0e2a1a);
    p.fig((q) => { leaf(q, 7, 42, 4, P.green); leaf(q, 38, 36, 4, P.forest); leaf(q, 6, 16, 4, P.forest); leaf(q, 40, 12, 4, P.green); }, 0x0e2a1a);
    // Kleeblatt Andeutung unten
    p.fig((q) => { q.disc(10, 48, 2, P.lime[3]); q.disc(13, 48, 2, P.lime[3]); q.disc(11, 46, 2, P.lime[3]); }, 0x0e2a1a);
  },

  // Hofstaat: Krone auf rotem Samtkissen zwischen Vorhängen
  hofstaat(p) {
    p.vgrad(0, 0, 46, 52, [0x2a1020, 0x5a1a30, 0x8a2a3a]);
    // Vorhänge mit Falten
    for (let x = 0; x < 11; x++) for (let y = 0; y < 52; y++) {
      const c = x % 4 === 0 ? P.red[1] : x % 4 === 1 ? P.red[2] : x % 4 === 2 ? P.red[3] : P.red[2];
      if (y < 4 + Math.abs(5 - x)) p.set(x, y, P.gold[2]); else p.set(x, y, c);
      p.set(45 - x, y, y < 4 + Math.abs(5 - x) ? P.gold[2] : c);
    }
    p.rect(0, 40, 11, 2, P.gold[3]); p.rect(35, 40, 11, 2, P.gold[3]);
    for (let i = 0; i < 4; i++) { p.rect(1 + i * 3, 42, 1, 4, P.gold[2]); p.rect(35 + i * 3 + 1, 42, 1, 4, P.gold[2]); }
    glow(p, 23, 22, 14, 0xf0a040, 0.7);
    // Kissen
    p.fig((q) => {
      q.ell(23, 42, 14, 5, P.purple[2]);
      q.ell(23, 40, 12, 3, P.purple[3]);
      q.rect(9, 42, 28, 1, P.gold[2]);
    });
    p.rect(9, 46, 28, 2, P.purple[1]);
    // Krone
    p.fig((q) => {
      q.poly([11, 38, 13, 18, 18, 26, 23, 12, 28, 26, 33, 18, 35, 38], P.gold[2]);
      q.poly([11, 38, 13, 18, 16, 23, 15, 38], P.gold[4]);
      q.poly([35, 38, 33, 18, 30, 23, 31, 38], P.gold[1]);
      q.rect(11, 33, 24, 5, P.gold[3]);
      q.rect(11, 33, 24, 1, P.gold[4]);
      q.rect(11, 37, 24, 1, P.gold[1]);
    });
    for (const [x, y, c] of [[13, 17, P.red[3]], [23, 11, P.cyan[3]], [33, 17, P.red[3]]] as [number, number, number][]) { p.disc(x, y, 2, c); p.set(x - 1, y - 1, 0xffffff); }
    p.disc(23, 35, 1, P.red[2]); p.disc(17, 35, 1, P.cyan[2]); p.disc(29, 35, 1, P.lime[2]);
    p.sparkle(21, 4, 0xffe27a); p.sparkle(8, 24, 0xffe27a);
  },

  // Gleichmut: eine Waage im Gleichgewicht
  gleichmut(p) {
    p.vgrad(0, 0, 46, 52, [0x2a3a78, 0x5a6ab0, 0xb0a8d8]);
    p.stars(8, 0, 0, 46, 14, rng(31));
    p.fig((q) => {
      // Fuß und Säule
      q.poly([12, 50, 15, 44, 31, 44, 34, 50], P.gold[1]);
      q.rect(21, 14, 4, 30, P.gold[2]);
      q.rect(21, 14, 1, 30, P.gold[4]);
      q.rect(24, 14, 1, 30, P.gold[0]);
      q.rect(14, 44, 18, 2, P.gold[3]);
      // Balken
      q.rect(5, 12, 36, 3, P.gold[3]);
      q.rect(5, 12, 36, 1, P.gold[4]);
      q.rect(5, 14, 36, 1, P.gold[1]);
      q.disc(23, 12, 3, P.gold[2]);
    });
    p.set(22, 11, 0xffffff);
    for (const x of [8, 38]) {
      p.line(x, 15, x - 5, 30, 0xf0d890); p.line(x, 15, x + 5, 30, 0xf0d890); p.line(x, 15, x, 30, 0xc8a850);
      p.fig((q) => {
        q.poly([x - 7, 30, x + 7, 30, x + 5, 34, x - 5, 34], P.gold[2]);
        q.rect(x - 7, 30, 14, 1, P.gold[4]);
      });
    }
    // Gewichte: Stern und Mond
    p.poly(starPts(8, 26, 4, 1.6, 5), 0xffe27a);
    p.ball(38, 26, 3, ramp(0xe8e4c8), 0.1);
    p.rect(14, 4, 18, 1, P.gold[3]); p.sparkle(23, 5, 0xffffff);
  },

  // Kauz: Eule auf dem Ast vor dem Mond
  kauz(p) {
    sky(p, [0x0c1038, 0x2a2a78, 0x6a62a8], 18, 51);
    p.disc(23, 22, 17, 0x5a5ab0);
    moon(p, 23, 22, 15);
    p.fig((q) => {
      q.ell(23, 32, 11, 13, P.tan[1]);
      q.poly([13, 14, 14, 8, 19, 13], P.tan[1]);
      q.poly([33, 14, 32, 8, 27, 13], P.tan[1]);
      q.ell(23, 21, 10, 8, P.tan[2]);
    }, INK);
    p.shadedEll(23, 32, 11, 13, ramp(0x8a6a4a), 0.08);
    p.ell(23, 21, 10, 8, P.tan[2]);
    p.ell(23, 36, 7, 9, P.cream[3]);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { p.set(18 + i * 4 + (j % 2) * 2, 31 + j * 4, P.tan[1]); p.set(19 + i * 4 + (j % 2) * 2, 32 + j * 4, P.tan[1]); }
    // Gesichtsmaske, Augen, Schnabel
    p.ell(18, 21, 5, 5, P.cream[3]); p.ell(28, 21, 5, 5, P.cream[3]);
    p.disc(18, 21, 4, P.yellow[3]); p.disc(28, 21, 4, P.yellow[3]);
    p.disc(18, 21, 2, INK); p.disc(28, 21, 2, INK);
    p.set(17, 20, 0xffffff); p.set(27, 20, 0xffffff);
    p.poly([21, 23, 25, 23, 23, 28], P.orange[3]);
    p.set(23, 23, P.orange[4]);
    // Ast
    p.fig((q) => {
      q.rect(0, 45, 46, 3, P.darkwood[2]);
      q.rect(0, 45, 46, 1, P.darkwood[3]);
      q.rect(18, 44, 3, 3, P.orange[2]); q.rect(25, 44, 3, 3, P.orange[2]);
    });
    leaf(p, 5, 43, 4, P.forest); leaf(p, 40, 42, 4, P.forest);
    p.rect(0, 49, 46, 3, 0x0e1230);
  },

  // Adlerauge: das scharfe Auge eines Adlers
  adlerauge(p) {
    p.vgrad(0, 0, 46, 52, [0xf8c860, 0xf8e8a0, 0xa8d8f0]);
    p.fig((q) => {
      q.ell(22, 26, 19, 19, P.cream[3]);
    }, 0x5a3a1a);
    // Federn Struktur
    for (let j = 0; j < 8; j++) for (let i = 0; i < 6; i++) {
      const x = 6 + i * 6 + (j % 2) * 3, y = 12 + j * 4;
      if (p.get(x, y) !== P.cream[3]) continue;
      p.set(x, y, P.cream[2]); p.set(x + 1, y + 1, P.cream[2]);
    }
    // braune Stirn und Augenstreif
    p.poly([6, 18, 14, 10, 30, 10, 38, 18, 34, 22, 8, 24], P.tan[1]);
    p.poly([6, 18, 14, 10, 30, 10, 38, 18, 34, 17, 10, 18], P.tan[2]);
    p.poly([4, 26, 16, 25, 30, 26, 38, 28, 16, 30], 0x4a2a14);
    // Auge
    p.ell(18, 26, 7, 6, 0xf8e060);
    p.ell(18, 26, 7, 6, 0xf8e060);
    p.ellRing(18, 26, 7, 6, 0x4a2a14, 1);
    p.disc(18, 26, 3, INK);
    p.set(16, 24, 0xffffff); p.set(17, 24, 0xffffff);
    p.set(21, 28, 0xf8e060);
    p.rect(12, 22, 12, 1, 0x4a2a14);
    // Schnabel
    p.fig((q) => {
      q.poly([30, 26, 41, 28, 43, 36, 40, 43, 36, 38, 34, 33], P.yellow[2]);
      q.poly([30, 26, 41, 28, 40, 30, 32, 29], P.yellow[4]);
      q.poly([36, 38, 40, 43, 43, 36, 41, 34], P.orange[1]);
    }, 0x4a2a14);
    p.rect(33, 31, 2, 1, 0x4a2a14);
    // Fadenkreuz Andeutung
    p.line(18, 2, 18, 8, 0xb88a2a); p.line(0, 26, 4, 26, 0xb88a2a);
  },

  // Frühaufsteher: Hahn kräht in der Morgenröte
  fruehaufsteher(p) {
    p.vgrad(0, 0, 46, 38, [0x6a4aa8, 0xe0709c, 0xf8a050, 0xfcd870]);
    p.disc(36, 32, 7, 0xfff0a0);
    p.rect(0, 38, 46, 14, 0x3a2a48);
    p.rect(0, 38, 46, 1, 0x6a4a68);
    // Zaun
    p.fig((q) => {
      q.rect(6, 36, 34, 3, P.darkwood[2]);
      q.rect(6, 36, 34, 1, P.darkwood[3]);
      q.rect(8, 36, 3, 16, P.darkwood[1]); q.rect(35, 36, 3, 16, P.darkwood[1]);
    });
    // Hahn
    p.fig((q) => {
      // Schwanz
      q.path([14, 30, 9, 26, 6, 19, 8, 11], P.teal[2], 3);
      q.path([15, 31, 11, 28, 10, 21, 13, 13], P.blue[2], 2);
      q.path([14, 32, 8, 31, 5, 27], P.green[2], 2);
      // Körper
      q.ell(23, 30, 9, 8, P.copper[2]);
      q.ell(27, 26, 5, 7, P.copper[2]);
      q.disc(30, 18, 5, P.copper[3]);
      q.rect(21, 36, 2, 3, P.yellow[2]); q.rect(26, 36, 2, 3, P.yellow[2]);
    });
    p.poly([17, 33, 28, 35, 24, 38, 18, 36], P.copper[1]);
    p.ell(22, 29, 5, 4, P.copper[3]); p.line(18, 29, 24, 31, P.copper[1]);
    // Kamm, Auge, Schnabel offen, Kehllappen
    p.disc(28, 12, 2, P.red[3]); p.disc(31, 11, 2, P.red[3]); p.disc(33, 13, 1, P.red[3]);
    p.set(30, 18, INK);
    p.poly([34, 17, 40, 15, 35, 19], P.yellow[3]); p.poly([34, 20, 40, 22, 35, 21], P.yellow[2]);
    p.poly([33, 21, 36, 22, 34, 26], P.red[2]);
    p.line(36, 8, 40, 5, 0xfff0a0); p.line(38, 11, 43, 10, 0xfff0a0);
  },

  // Schlussakkord: Orgelpfeifen und eine goldene Note
  schlussakkord(p) {
    p.vgrad(0, 0, 46, 52, [0x1a0a24, 0x3a1a3a, 0x7a2a3a]);
    p.rays(23, 18, 7, 0x4a1a3a, 0x3a1432, 0);
    p.vgrad(0, 38, 46, 14, [0x3a1a3a, 0x1a0a24]);
    glow(p, 23, 16, 14, 0xf0b040, 0.9);
    const hs = [26, 22, 18, 14, 18, 22, 26];
    hs.forEach((h, i) => {
      const x = 5 + i * 5, y = 46 - h;
      p.fig((q) => {
        q.rect(x, y, 5, h, i % 2 ? P.steel[2] : P.gold[2]);
        const rp = i % 2 ? P.steel : P.gold;
        q.rect(x, y, 1, h, rp[4]); q.rect(x + 1, y, 1, h, rp[3]);
        q.rect(x + 4, y, 1, h, rp[0]);
        q.rect(x + 1, y + 4, 3, 2, 0x1a0a24);
        q.rect(x, y, 5, 1, rp[4]);
      });
    });
    p.rect(2, 46, 42, 3, P.darkwood[2]); p.rect(2, 46, 42, 1, P.darkwood[4]);
    p.rect(0, 49, 46, 3, P.darkwood[0]);
    // Note
    p.fig((q) => {
      q.rect(26, 5, 2, 15, 0xffe27a);
      q.ell(24, 20, 4, 3, 0xffc43a);
      q.poly([28, 5, 33, 9, 32, 14, 28, 11], 0xffe27a);
    }, 0x3a1a00);
    p.set(23, 19, 0xffffff);
    p.sparkle(14, 10, 0xffe27a); p.sparkle(37, 22, 0xffe27a); p.sparkle(8, 24, 0xf0b040);
  },

  // Wachposten: Wächter auf der Zinne bei Nacht
  wachposten(p) {
    sky(p, [0x0a1030, 0x1a3a6a, 0x4a6a98], 16, 61);
    // Zinnen
    p.fig((q) => {
      q.rect(0, 42, 46, 10, P.stone[1]);
      for (let x = 0; x < 46; x += 12) q.rect(x, 37, 7, 6, P.stone[1]);
      for (let x = 0; x < 46; x += 12) { q.rect(x, 37, 7, 1, P.stone[3]); q.rect(x, 37, 1, 6, P.stone[2]); }
      q.rect(0, 42, 46, 1, P.stone[3]);
    });
    for (let y = 46; y < 52; y += 4) p.rect(0, y, 46, 1, P.stone[0]);
    for (let x = 4; x < 46; x += 9) p.rect(x, 47, 1, 3, P.stone[0]);
    // Speer mit Wimpel
    p.line(36, 4, 36, 42, P.darkwood[3]);
    p.poly([35, 2, 38, 8, 34, 8], P.steel[4]);
    p.poly([37, 9, 44, 11, 37, 14], P.red[2]);
    // Wächter
    p.fig((q) => {
      q.poly([14, 42, 14, 30, 18, 25, 28, 25, 32, 30, 32, 42], P.red[2]);
      q.poly([17, 42, 17, 33, 29, 33, 29, 42], P.red[1]);
      q.disc(23, 19, 5, P.skin[2]);
      q.poly([17, 20, 17, 12, 23, 8, 29, 12, 29, 20, 27, 18, 19, 18], P.steel[2]);
      q.rect(22, 13, 2, 8, P.steel[3]);
    });
    p.rect(17, 12, 12, 1, P.steel[4]); p.rect(18, 11, 2, 1, P.steel[4]);
    p.set(21, 21, INK); p.set(26, 21, INK);
    p.rect(21, 24, 5, 1, P.skin[0]);
    // Schild
    p.fig((q) => {
      q.poly([3, 26, 14, 26, 14, 34, 8, 41, 3, 34], P.blue[2]);
      q.poly([3, 26, 8, 26, 8, 41, 3, 34], P.blue[3]);
    });
    p.poly(starPts(8, 32, 3, 1.2, 5), 0xffe27a);
    p.rect(14, 33, 18, 2, P.steel[1]);
  },

  // Ruhekissen: ein Kissen mit Schlafmütze und träumenden z
  ruhekissen(p) {
    p.vgrad(0, 0, 46, 52, [0x241a58, 0x3a2a78, 0x5a3a88]);
    p.stars(10, 0, 0, 46, 22, rng(62));
    // Fenster mit Mond
    p.fig((q) => { q.rect(30, 4, 12, 16, 0x0e1438); }, 0x6a4a28);
    p.rect(31, 5, 10, 14, 0x1a2a68); p.rect(36, 5, 1, 14, 0x6a4a28); p.rect(31, 11, 10, 1, 0x6a4a28);
    p.disc(34, 8, 2, 0xfff0b0); p.disc(35, 7, 2, 0x1a2a68);
    // Kissen
    p.fig((q) => {
      q.ell(23, 38, 20, 11, P.cream[3]);
      q.ell(23, 36, 18, 8, P.cream[4]);
    }, 0x3a2a58);
    p.ell(23, 40, 13, 3, P.cream[2]);
    for (let i = 0; i < 16; i++) p.set(5 + i * 2, 46 - Math.round(Math.sin(i / 2.2) * 0.5), P.blue[2]);
    p.ellRing(23, 38, 20, 11, P.blue[2], 1);
    p.poly(starPts(23, 36, 5, 2, 5), P.blue[2]);
    p.disc(23, 36, 1, P.blue[4]);
    // Schlafmütze
    p.fig((q) => {
      q.poly([30, 33, 40, 30, 43, 20, 38, 12, 33, 22], P.red[2]);
      q.rect(29, 31, 14, 3, P.white[3]);
      q.disc(39, 11, 3, P.white[4]);
    });
    // z z z
    p.text('z', 8, 22, 0xffffff);
    p.text('z', 13, 15, 0xcfe0ff);
    p.text('z', 19, 10, 0x9fb4ff);
    p.sparkle(24, 24, 0x9fb4ff);
  },

  // Vorrat: Vorratsregal mit Gläsern, Fass und Sack
  vorrat(p) {
    wall(p, 0, 52, ramp(0x5a4030), 12, 6);
    // Regalbretter
    for (const y of [18, 34]) {
      p.rect(0, y, 46, 3, P.wood[2]); p.rect(0, y, 46, 1, P.wood[4]); p.rect(0, y + 2, 46, 1, P.wood[0]);
    }
    p.rect(0, 49, 46, 3, P.wood[1]);
    // Gläser oben
    const jar = (x: number, y: number, c: number[], lid: number) => {
      p.fig((q) => {
        q.rect(x, y + 2, 8, 12, 0xd8eef4);
        q.rect(x + 1, y + 5, 6, 8, c[2]);
        q.rect(x + 1, y + 5, 2, 8, c[3]);
        q.rect(x, y, 8, 3, lid);
      });
      p.rect(x + 2, y + 8, 4, 3, P.cream[3]);
      p.set(x + 1, y + 3, 0xffffff);
    };
    jar(4, 4, P.red, P.gold[2]); jar(14, 4, P.green, P.red[2]); jar(24, 4, P.yellow, P.blue[2]); jar(34, 4, P.purple, P.gold[2]);
    // mittleres Regal: Körbe, Äpfel
    p.fig((q) => {
      q.rect(5, 26, 14, 8, P.wood[3]);
      q.rect(5, 26, 14, 2, P.wood[4]);
    });
    for (const x of [8, 12, 16]) p.ball(x, 26, 3, P.red, 0.05);
    p.fig((q) => {
      q.poly([26, 34, 28, 24, 36, 22, 40, 26, 41, 34], P.cream[2]);
      q.poly([26, 34, 28, 24, 31, 23, 30, 34], P.cream[3]);
      q.rect(30, 22, 8, 2, P.red[2]);
    });
    // unten Fass und Sack
    p.fig((q) => {
      q.ell(12, 44, 9, 7, P.wood[2]);
      q.rect(3, 38, 18, 11, P.wood[2]);
      q.ell(12, 38, 9, 3, P.wood[3]);
      q.rect(3, 41, 18, 1, P.iron[2]); q.rect(3, 46, 18, 1, P.iron[2]);
      q.rect(3, 38, 2, 11, P.wood[3]);
    });
    p.fig((q) => {
      q.ell(33, 44, 8, 6, P.tan[3]);
      q.poly([29, 38, 31, 34, 36, 34, 38, 38], P.tan[3]);
      q.rect(30, 37, 7, 1, P.red[2]);
    });
    p.set(11, 43, P.wood[4]);
  },
};
