import type { Pix } from './jokerPix';
import {
  INK, PAL as P, arcPts, bubbles, burst, clubShape, cloud, cosmos, diamondShape, dust, glow, ground, heartShape, hills, lit, ramp, rng, spadeShape,
  star4, starPts, wall, type Sprite,
} from './consumableKit';

// Elixiere B: vier Farbwandler (Kartenzeichen), Aufstieg, Doppelgänger, Auflösung, Erntemond, Sternkarte, Alchemistentisch.
// Fläche 40 mal 40, Mitte x = 20.

/** Eine kleine Spielkarte (Höhe 13, Breite 9) mit Zeichen, Mitte cx, Oberkante y. */
function miniCard(p: Pix, cx: number, y: number, mark: (q: Pix, x: number, y: number) => void, face = 0xf4efe0, edge = INK) {
  p.rect(cx - 5, y - 1, 11, 15, edge);
  p.rect(cx - 4, y, 9, 13, face);
  p.rect(cx - 4, y, 9, 1, 0xffffff);
  p.rect(cx + 4, y + 1, 1, 12, 0xc8c0a8);
  mark(p, cx, y + 6);
}

export const SPRITES_ELIXIER_B: Record<string, Sprite> = {
  // Nachtschwarz: Tintenfass mit Feder, aus der Tinte steigt ein schwarzes Pik
  elixier_suit_S(p) {
    cosmos(p, [0x4a4a82, 0x6a6aa8, 0x9a9ad0], 51, { stars: 10, clouds: [[20, 16, 20, 14, 0xc8c8f0, 0.6]] });
    // Pik aus Tinte, schwebt über dem Fass
    lit(p, (q) => spadeShape(q, 20, 13, 9, 1), 20, 13, 10, ramp(0x2a2a50), INK);
    p.set(16, 8, 0xc0c0ff); p.set(15, 9, 0x9a9ae0); p.rect(14, 12, 2, 2, 0x7a7ac8);
    // Tintentropfen
    p.disc(27, 25, 1.5, 0x1a1a38); p.disc(12, 24, 1, 0x1a1a38);
    // Tintenfass
    p.fig((q) => {
      q.ball(20, 32, 8, ramp(0x3a3a68), 0.1);
      q.rect(16, 22, 8, 4, 0x2a2a50);
    });
    p.ellRing(20, 25, 5, 2, 0xc0c0f0, 1);
    p.ell(20, 25, 4, 1, 0x0a0a1c);
    p.rect(12, 28, 2, 5, 0x9a9ad8);
    p.rect(13, 27, 1, 2, 0xe0e0ff);
    // Feder
    p.fig((q) => {
      q.poly([25, 30, 38, 14, 37, 22, 30, 32], 0xf4efe0);
      q.line(25, 31, 37, 15, 0xc8c0a8);
    });
    p.poly([30, 24, 36, 17, 36, 21, 32, 27], 0xe0d8c0);
    p.set(37, 14, 0xffffff);
    p.rect(0, 37, 40, 3, 0x2a2a50); p.rect(0, 37, 40, 1, 0x7a7ac0);
  },

  // Purpurrot: ein herzförmiges Fläschchen, in dem Purpur brodelt
  elixier_suit_H(p) {
    p.vgrad(0, 0, 40, 40, [0x3a0a40, 0x6a1a5a, 0xa03a7a]);
    cloud(p, 20, 20, 22, 18, 0xe060b0, 0.6, 52);
    p.stars(12, 0, 0, 40, 30, rng(52));
    ground(p, 35, P.darkwood);
    // Herz Flasche
    lit(p, (q) => heartShape(q, 20, 24, 12, 1), 20, 24, 14, ramp(0xe0457a), INK, 2);
    // Glasrand und Flüssigkeit
    p.disc(14, 17, 3, 0xff9ac0); p.rect(12, 14, 4, 1, 0xffffff); p.set(11, 16, 0xffffff); p.set(11, 17, 0xffd0e0);
    p.line(8, 22, 14, 31, 0xff9ac0);
    // Hals mit Korken
    p.fig((q) => { q.rect(17, 9, 6, 6, P.crimson[3]); q.rect(18, 4, 4, 6, P.tan[2]); });
    p.rect(18, 5, 1, 4, P.tan[4]);
    p.rect(17, 12, 6, 1, P.gold[3]);
    bubbles(p, [[19, 22, 1], [24, 26, 2], [16, 29, 1], [21, 31, 1]], 0xffe0f0);
    p.sparkle(6, 10, 0xffffff, true); p.sparkle(34, 12, 0xffd0e8); p.sparkle(33, 30, 0xffffff);
  },

  // Bernstein: ein Block Bernstein in Rautenform, darin ein Insekt aus alter Zeit
  elixier_suit_D(p) {
    p.rays(20, 22, 10, 0x6a3a10, 0x8a5018, 0.1);
    glow(p, 20, 21, 18, 0xffb43a, 0.8);
    cloud(p, 20, 21, 20, 20, 0xffc860, 0.6, 61);
    lit(p, (q) => diamondShape(q, 20, 21, 13, 1), 20, 21, 15, ramp(0xf2a020), INK, 2.4);
    // Facetten
    p.line(20, 5, 20, 37, P.orange[1]);
    p.line(7, 21, 33, 21, P.orange[1]);
    p.poly([20, 6, 28, 21, 20, 21], P.yellow[4]);
    // Insekt im Bernstein
    p.rect(17, 18, 5, 3, 0x3a2412); p.rect(14, 17, 3, 2, 0x5a3a20); p.rect(22, 17, 3, 2, 0x5a3a20);
    p.set(16, 15, 0xfff0c0); p.set(23, 15, 0xfff0c0); p.line(14, 20, 12, 23, 0x5a3a20); p.line(25, 20, 27, 23, 0x5a3a20);
    p.set(18, 18, 0xffffff);
    p.rect(11, 12, 2, 6, 0xfff0b0); p.set(12, 11, 0xffffff);
    // Honigtropfen am Sockel
    p.fig((q) => { q.ell(20, 37, 10, 2, P.darkwood[2]); });
    p.sparkle(6, 7, 0xfff0b0, true); p.sparkle(34, 6, 0xffe27a); p.sparkle(33, 33, 0xfff0b0);
  },

  // Smaragdgrün: ein Kleeblatt aus geschliffenem Smaragd im moosigen Gewölbe
  elixier_suit_C(p) {
    p.vgrad(0, 0, 40, 40, [0x0a2a1c, 0x14503a, 0x2a7a50]);
    cloud(p, 20, 18, 22, 16, 0x50d890, 0.5, 71);
    // Ranken am Rand
    p.line(0, 6, 8, 12, 0x2a8a50); p.line(8, 12, 7, 24, 0x2a8a50); p.line(40, 8, 32, 14, 0x2a8a50); p.line(32, 14, 34, 28, 0x2a8a50);
    for (const [x, y] of [[8, 12], [7, 20], [32, 14], [34, 24]]) p.disc(x, y, 1.5, 0x4ac870);
    hills(p, 35, 1.5, 12, 0, 0x0a2a1c, 0x2a7a3a);
    lit(p, (q) => clubShape(q, 20, 17, 9, 1), 20, 17, 12, ramp(0x20b070), INK, 2.4);
    // Facettenlinien
    p.line(20, 8, 20, 22, 0x0a6a40); p.line(13, 20, 20, 17, 0x0a6a40); p.line(27, 20, 20, 17, 0x0a6a40);
    p.set(17, 9, 0xe0fff0); p.set(16, 10, 0xb8f8d8); p.set(10, 18, 0xe0fff0); p.set(11, 18, 0xb8f8d8);
    // Stiel
    p.rect(19, 27, 3, 8, 0x1a7a40); p.rect(19, 27, 1, 8, 0x4ac880);
    p.sparkle(7, 32, 0xb8ffd8, true); p.sparkle(34, 8, 0xe0fff0); p.sparkle(32, 31, 0xb8ffd8);
  },

  // Aufstieg: Karten bilden eine Treppe, ein goldener Pfeil weist nach oben
  elixier_aufstieg(p) {
    p.rays(20, 36, 12, 0x2a1a5a, 0x3a2670, 0.2);
    glow(p, 27, 8, 14, 0xffe27a, 0.6);
    // Treppe aus Karten, jede höher als die vorige
    const marks = [
      (q: Pix, x: number, y: number) => q.disc(x, y, 1.5, 0xd8382f),
      (q: Pix, x: number, y: number) => q.rect(x - 1, y - 1, 3, 3, 0x2a3a78),
      (q: Pix, x: number, y: number) => q.poly(starPts(x, y, 2.5, 1, 5), 0xf2b92c),
      (q: Pix, x: number, y: number) => q.poly(starPts(x, y, 3.5, 1.4, 5), 0xd04ab8),
    ];
    for (let i = 0; i < 4; i++) {
      const cx = 7 + i * 8, y = 26 - i * 5;
      p.rect(cx - 5, y + 13, 11, 40 - y - 13, 0x22184a);
      miniCard(p, cx, y, marks[i]);
    }
    // Goldener Pfeil
    p.fig((q) => {
      q.poly([28, 1, 36, 10, 31, 10, 31, 20, 25, 20, 25, 10, 20, 10], P.gold[2]);
      q.poly([28, 1, 20, 10, 25, 10, 25, 20, 28, 20], P.gold[4]);
      q.poly([28, 1, 36, 10, 31, 10, 31, 20, 28, 20], P.gold[3]);
    });
    p.rect(30, 10, 1, 10, P.gold[1]);
    p.sparkle(8, 8, 0xffffff, true); p.sparkle(36, 26, 0xffe27a); p.sparkle(16, 16, 0xcfd8ff);
  },

  // Doppelgänger: eine Karte und ihr geisterhaftes Ebenbild, getrennt von einer Spiegellinie
  elixier_doppelgaenger(p) {
    p.vgrad(0, 0, 40, 40, [0x1a2a50, 0x2a4a78, 0x3a6a98]);
    p.rect(0, 0, 20, 40, 0x24305c);
    cloud(p, 30, 20, 14, 18, 0x6ad8e8, 0.7, 81);
    p.stars(8, 0, 0, 40, 40, rng(81));
    // echte Karte links
    const star = (q: Pix, x: number, y: number) => { q.poly(starPts(x, y, 5, 2, 5), 0xf2b92c); q.set(x - 1, y - 1, 0xffffff); };
    p.rect(4, 8, 15, 22, INK); p.rect(5, 9, 13, 20, 0xf4efe0); p.rect(5, 9, 13, 1, 0xffffff); p.rect(17, 10, 1, 19, 0xc8c0a8);
    p.rect(6, 10, 1, 1, 0xd8382f); p.rect(15, 26, 2, 2, 0xd8382f);
    star(p, 11, 19);
    // Spiegelkante
    p.rect(19, 0, 2, 40, 0xcfeaff); p.rect(20, 0, 1, 40, 0xffffff);
    for (let y = 2; y < 40; y += 6) p.sparkle(20, y, 0xffffff);
    // Geisterkarte rechts, gestreut und cyan
    for (let y = 8; y < 30; y++) for (let x = 22; x < 37; x++) {
      const edge = y === 8 || y === 29 || x === 22 || x === 36;
      if (edge) p.set(x, y, 0x8ae8ff);
      else if ((x + y) % 2 === 0) p.set(x, y, 0x5ac8f0);
    }
    p.poly(starPts(29, 19, 5, 2, 5), 0xe0faff);
    p.rect(34, 26, 2, 2, 0xe0faff); p.rect(24, 10, 1, 1, 0xe0faff);
    // Funken zwischen den Karten
    p.sparkle(20, 34, 0xffffff, true); p.sparkle(8, 36, 0xcfeaff); p.sparkle(33, 4, 0xffffff);
  },

  // Auflösung: eine Karte zerfällt in schwebende Bildpunkte
  elixier_aufloesung(p) {
    p.vgrad(0, 0, 40, 40, [0x14202a, 0x2a3a42, 0x4a4a4a]);
    cloud(p, 20, 30, 22, 12, 0x8a8a90, 0.6, 91);
    p.stars(8, 0, 0, 40, 20, rng(91));
    // linke Hälfte der Karte noch ganz
    p.rect(8, 12, 12, 24, INK);
    p.rect(9, 13, 10, 22, 0xf0ecdc);
    p.rect(9, 13, 10, 1, 0xffffff);
    p.disc(13, 19, 2, 0x7a4ad0); p.disc(13, 19, 1, 0xd0b0ff);
    p.rect(10, 31, 3, 3, 0x7a4ad0);
    // rechte Hälfte: wird zu Quadraten, die nach oben fliegen
    const r = rng(33);
    for (let y = 12; y < 36; y += 2)
      for (let x = 20; x < 32; x += 2) {
        const t = (x - 20) / 12;
        if (r() > 1 - t * 0.9 - 0.05 && r() < 0.95) continue;
        const dy = Math.round(-t * t * 16 * (0.6 + r() * 0.8)), dx = Math.round(t * 3 * r());
        const c = r() < 0.4 ? 0xd0c8b0 : r() < 0.5 ? 0xa8a090 : 0xf0ecdc;
        p.rect(x + dx, y + dy, r() < 0.5 ? 2 : 1, r() < 0.5 ? 2 : 1, c);
      }
    // violette Glut an der Bruchkante
    for (let y = 14; y < 35; y++) if (r() < 0.6) p.set(20 + Math.round(r() * 2), y, r() < 0.5 ? 0xb070ff : 0xffe0ff);
    p.rect(19, 12, 1, 24, 0xe0c0ff);
    for (const [x, y] of [[33, 6], [36, 12], [30, 4], [37, 20], [27, 9]]) p.set(x, y, 0xe0d8ff);
    p.sparkle(30, 10, 0xe0c0ff);
    p.rect(0, 37, 40, 3, 0x1c262e);
  },

  // Erntemond: ein riesiger Mond über Garben und Münzsack
  elixier_erntemond(p) {
    p.vgrad(0, 0, 40, 40, [0x2a1648, 0x7a2a58, 0xe0703a]);
    p.stars(10, 0, 0, 40, 14, rng(101));
    glow(p, 20, 16, 17, 0xffd070, 0.9);
    p.ball(20, 16, 12, ramp(0xf2a030), 0.08);
    for (const [x, y] of [[16, 12], [24, 15], [19, 21], [26, 10]]) p.rect(x, y, 2, 1, 0xd88028);
    p.set(14, 9, 0xfff0b8); p.set(15, 8, 0xfff0b8);
    hills(p, 29, 2, 22, 0.8, 0x4a2a1a, 0x7a4a22);
    p.rect(0, 33, 40, 7, 0x4a2a14);
    // Getreidehalme
    for (const x of [3, 7, 11, 28, 32, 36]) {
      p.line(x, 38, x + (x % 2 ? 1 : -1), 24, 0xd8a838);
      for (let k = 0; k < 4; k++) { p.set(x + (x % 2 ? 1 : -1) - 1, 24 + k * 2, 0xf8d860); p.set(x + (x % 2 ? 1 : -1) + 1, 25 + k * 2, 0xf8d860); }
      p.set(x + (x % 2 ? 1 : -1), 22, 0xfff0a0);
    }
    // Sack mit Münze
    p.fig((q) => { q.ell(20, 33, 6, 6, P.tan[2]); q.rect(18, 25, 4, 3, P.tan[2]); });
    p.rect(17, 27, 6, 1, P.crimson[2]);
    p.rect(15, 31, 1, 4, P.tan[4]);
    p.fig((q) => q.ell(24, 38, 3, 1.5, P.gold[2]));
    p.set(23, 37, 0xfff6c8);
    p.sparkle(34, 8, 0xffe8b0); p.sparkle(5, 14, 0xffe8b0);
  },

  // Sternkarte: eine aufgerollte Himmelskarte mit Sternbildern und Kompassrose
  elixier_sternkarte(p) {
    p.vgrad(0, 0, 40, 40, [0x2a1c12, 0x3a2818, 0x4a3420]);
    for (let y = 3; y < 40; y += 5) p.rect(0, y, 40, 1, 0x2a1c12);
    // Pergament
    p.fig((q) => {
      q.rect(4, 6, 32, 28, 0xe8d8a8);
      q.ell(4, 20, 2, 14, 0xd8c690);
      q.ell(36, 20, 2, 14, 0xd8c690);
    });
    p.rect(4, 6, 32, 1, 0xfff0c8); p.rect(4, 33, 32, 1, 0xb89860); p.rect(6, 7, 28, 26, 0xe8d8a8);
    p.rect(35, 7, 1, 26, 0xc8b078);
    // Tintenblau Himmelskreis
    p.ellRing(20, 20, 11, 10, 0x2a3a78, 1);
    for (const a of [0, 90, 180, 270]) { const r = a * Math.PI / 180; p.line(20, 20, 20 + Math.cos(r) * 11, 20 + Math.sin(r) * 10, 0x6a7ab0); }
    // Sternbild
    const pts = [[12, 14], [17, 11], [23, 14], [27, 20], [22, 26], [15, 24]];
    for (let i = 0; i < pts.length - 1; i++) p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 0x2a3a78);
    for (const [x, y] of pts) { p.disc(x, y, 1.2, 0xc02a2a); p.set(x, y, 0xff8a60); }
    p.poly(starPts(20, 20, 3.5, 1.5, 4), 0xa8741c);
    // Kompass Zeiger
    p.poly([31, 9, 32.5, 12, 31, 14, 29.5, 12], 0xc02a2a);
    p.rect(31, 7, 1, 2, 0x2a3a78);
    // Siegel und Band
    p.fig((q) => q.disc(30, 31, 3, 0xc02a2a));
    p.set(29, 30, 0xff9090);
    p.rect(8, 28, 8, 1, 0x8a6a3a); p.rect(8, 30, 5, 1, 0x8a6a3a);
    p.sparkle(3, 38, 0xffe27a); p.sparkle(37, 3, 0xffe27a);
  },

  // Alchemistentisch: Werkbank mit drei Gefäßen, Brenner und aufgeschlagenem Buch vor dem Mondfenster
  elixier_alchemistentisch(p) {
    p.vgrad(0, 0, 40, 40, [0x14202a, 0x1e3440, 0x2a4a50]);
    wall(p, 0, 28, ramp(0x2a4448), 10, 5);
    // Fenster mit Mond
    p.rect(14, 2, 12, 14, INK); p.rect(15, 3, 10, 12, 0x14307a);
    p.disc(21, 8, 3, 0xe8e4c8); p.disc(22, 7, 3, 0x14307a); p.set(17, 5, 0xffffff); p.set(23, 12, 0xffffff);
    p.rect(19, 3, 1, 12, INK); p.rect(15, 9, 10, 1, INK);
    // Regal links: Gläser
    p.rect(1, 14, 10, 1, P.darkwood[2]);
    p.rect(3, 9, 3, 5, 0x5ad8e8); p.rect(7, 10, 3, 4, 0xd04ab8);
    p.set(3, 9, 0xffffff); p.set(7, 10, 0xffffff);
    // Tisch
    p.rect(0, 28, 40, 12, P.wood[2]); p.rect(0, 28, 40, 1, P.wood[4]); p.rect(0, 29, 40, 1, P.wood[3]);
    for (let y = 33; y < 40; y += 4) p.rect(0, y, 40, 1, P.wood[1]);
    // drei Gefäße
    const flask = (cx: number, top: number, w: number, c: ReturnType<typeof ramp>) => {
      p.fig((q) => { q.rect(cx - 1, top, 3, 5, 0x9fe0e8); q.ball(cx, top + 5 + w, w, ramp(0x9fe0e8), 0.05); });
      p.ball(cx, top + 6 + w, w - 1, c, 0.1);
      p.set(cx - 2, top + 5 + w, 0xffffff);
    };
    flask(7, 17, 5, P.red);
    // Brenner mit Kolben in der Mitte
    p.fig((q) => { q.rect(17, 31, 8, 3, P.iron[2]); q.rect(18, 27, 6, 4, P.iron[1]); });
    p.poly([21, 24, 23, 28, 19, 28], 0xff8a2a); p.poly([21, 26, 22, 28, 20, 28], 0xffe070);
    p.fig((q) => { q.rect(19, 12, 4, 6, 0x9fe0e8); q.ball(21, 21, 5, ramp(0x9fe0e8), 0.05); });
    p.ball(21, 22, 4, P.green, 0.1);
    bubbles(p, [[20, 19, 1], [22, 16, 1], [21, 11, 1]], 0xe0fff0);
    flask(33, 20, 4, P.blue);
    // Aufgeschlagenes Buch
    p.fig((q) => { q.poly([2, 36, 11, 34, 18, 36, 18, 39, 11, 37, 2, 39], 0xf0e6c8); });
    p.line(11, 34, 11, 37, 0xa88858); p.rect(4, 36, 5, 1, 0x8a6a3a); p.rect(13, 36, 4, 1, 0x8a6a3a);
    p.sparkle(35, 8, 0xffffff); p.sparkle(4, 4, 0xcfe8ff);
  },
};
void arcPts; void burst; void cloud; void cosmos; void dust; void star4; void ground; void hills;
