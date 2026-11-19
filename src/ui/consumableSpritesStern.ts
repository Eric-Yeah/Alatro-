import { INK, PAL as P, arcPts, bubbles, burst, cloud, constel, cosmos, dust, gemStar, glow, hills, rng, star4, starPts, type Sprite } from './consumableKit';

// Sternbilder (Hände): zwölf eigene Sternkarten in Mitternachtsblau und Gold. Fläche 40 mal 40, Mitte x = 20.

/** Bogenstück aus Punkten (für Sternenspuren). */
function trail(p: import('./jokerPix').Pix, cx: number, cy: number, r: number, a0: number, a1: number, c: number, c2: number) {
  const pts = arcPts(cx, cy, r, r, a0, a1, Math.round(r * 3));
  for (let i = 0; i + 1 < pts.length; i += 2) if ((i / 2) % 2 === 0) p.set(pts[i], pts[i + 1], (i / 2) % 5 === 0 ? c2 : c);
}

export const SPRITES_STERN: Record<string, Sprite> = {
  // Polarstern: ein großer Stern, um den alle Sternenspuren kreisen
  sternbild_highCard(p) {
    cosmos(p, [0x070d2c, 0x142464, 0x2c40a0], 3, { stars: 16, clouds: [[20, 20, 22, 18, 0x4660c8, 0.7]] });
    for (const r of [7, 11, 15, 19, 24]) trail(p, 20, 13, r, 0, 360, 0x5f7fe0, 0xb4ccff);
    glow(p, 20, 13, 15, 0xffe27a, 0.9);
    p.line(20, 0, 20, 27, 0xfff0a8);
    p.line(6, 13, 34, 13, 0xfff0a8);
    star4(p, 20, 13, 12, 0xf2b92c, 0xffffff, 0.22);
    star4(p, 20, 13, 7, 0xffe27a, 0xffffff, 0.45);
    p.disc(20, 13, 2, 0xffffff);
    // Sternwarte auf dem Hügel
    hills(p, 33, 2, 24, 0.4, 0x0a1234, 0x24347c);
    p.fig((q) => {
      q.rect(24, 28, 9, 8, P.slate[1]);
      q.poly(arcPts(28.5, 28, 4.5, 4.5, 180, 360, 10).concat([33, 28]), P.steel[2]);
      q.rect(28, 24, 1, 4, INK);
    });
    p.rect(26, 31, 2, 3, 0xffd860);
    p.set(31, 31, 0xffd860);
  },

  // Zwillingsstern: zwei Sterne umkreisen einander
  sternbild_pair(p) {
    cosmos(p, [0x1a0f48, 0x32207a, 0x14307a], 8, { stars: 16, clouds: [[10, 12, 16, 12, 0x6a3ab8, 0.8], [32, 30, 16, 12, 0x2a64c0, 0.8]] });
    // Umlaufbahn
    for (let i = 0; i < 80; i++) {
      const a = (i / 80) * Math.PI * 2;
      const x = 20 + Math.cos(a) * 16, y = 20 + Math.sin(a) * 7;
      const xr = 20 + (x - 20) * Math.cos(0.5) - (y - 20) * Math.sin(0.5), yr = 20 + (x - 20) * Math.sin(0.5) + (y - 20) * Math.cos(0.5);
      if (i % 2 === 0) p.set(xr, yr, 0x9fb8ff);
    }
    glow(p, 11, 27, 11, 0xffb347, 0.9);
    glow(p, 29, 13, 11, 0x5fd6f0, 0.9);
    p.ball(11, 27, 6, P.orange, 0.1);
    p.disc(9, 25, 1.5, 0xfff3c0);
    p.ball(29, 13, 5, P.cyan, 0.1);
    p.disc(27, 11, 1.2, 0xffffff);
    // Strahlenkreuze
    p.line(11, 17, 11, 37, 0xffd890); p.line(1, 27, 21, 27, 0xffd890);
    p.line(29, 5, 29, 21, 0xb8f0ff); p.line(19, 13, 39, 13, 0xb8f0ff);
    p.ball(11, 27, 5, P.orange, 0.1);
    p.ball(29, 13, 4, P.cyan, 0.1);
    p.sparkle(20, 20, 0xffffff, true);
  },

  // Doppelsonne: zwei Paare, zwei Sonnen mit eigenen Strahlen
  sternbild_twoPair(p) {
    cosmos(p, [0x2a0a24, 0x5a1a3a, 0x8a3a2a], 12, { stars: 12, clouds: [[20, 20, 22, 20, 0xb84a30, 0.6]] });
    for (const [cx, cy, r, a, b] of [[12, 12, 7, P.yellow, 0xffb43a], [28, 28, 8, P.orange, 0xff6a2a]] as const) {
      glow(p, cx, cy, r + 8, b, 0.9);
      burst(p, cx, cy, r + 1, r + 7, 12, a[3], 0.2);
      p.ball(cx, cy, r, a, 0.1);
      p.ring(cx, cy, r + 2, b);
      p.disc(cx - r * 0.35, cy - r * 0.4, 1.4, 0xffffff);
    }
    // Zwei kleine Gefährten
    p.ball(31, 10, 2, P.cyan, 0.05); p.ball(8, 32, 2, P.pink, 0.05);
    p.sparkle(20, 20, 0xffe0a0);
  },

  // Dreigestirn: drei Sterne bilden ein Dreieck im Nebel
  sternbild_threeKind(p) {
    cosmos(p, [0x081a3a, 0x0e3a6a, 0x1a5a8a], 15, { stars: 14, clouds: [[20, 22, 20, 14, 0x2ab0c0, 0.7], [30, 12, 12, 8, 0x6a5ad8, 0.7]] });
    p.ring(20, 22, 15, 0x3a78c8);
    constel(p, [[20, 7, 3], [8, 31, 3], [32, 31, 3], [20, 22, 1]], [[0, 1], [1, 2], [2, 0], [3, 0], [3, 1], [3, 2]], 0x9fd0ff);
    p.sparkle(5, 8, 0xffffff); p.sparkle(35, 8, 0xffffff);
  },

  // Himmelsleiter: eine Leiter aus Gold führt in die Sterne
  sternbild_straight(p) {
    cosmos(p, [0x20104a, 0x40308c, 0x8a6ac0], 17, { stars: 14, clouds: [[20, 36, 24, 8, 0xe0a8e0, 0.9], [6, 20, 10, 6, 0x6a58c8, 0.6]] });
    // Holme der Leiter, perspektivisch schmaler nach oben
    p.line(10, 39, 17, 4, 0xf2b92c, 2);
    p.line(30, 39, 23, 4, 0xf2b92c, 2);
    p.line(9, 39, 16, 4, 0xffe27a);
    for (let i = 0; i < 6; i++) {
      const t = i / 5, y = 35 - i * 6;
      const xl = 10 + (17 - 10) * (1 - (y - 4) / 35) * 0 + (35 - y) / 31 * 7 - 0, xr = 30 - (35 - y) / 31 * 7;
      p.line(xl + 1, y, xr - 1, y, P.gold[3]);
      p.line(xl + 1, y + 1, xr - 1, y + 1, P.gold[1]);
      if (i < 5) star4(p, xr + 3, y - 2, 2 + (i % 2), 0xfff0b0);
      void t;
    }
    glow(p, 20, 3, 8, 0xfff2b0, 0.9);
    star4(p, 20, 3, 6, 0xffe27a);
    // Wolken am Fuß
    p.disc(7, 38, 5, 0xe8d0f0); p.disc(14, 37, 4, 0xf4e4f8); p.disc(30, 38, 5, 0xe8d0f0); p.disc(36, 37, 4, 0xf4e4f8);
    p.rect(0, 38, 40, 2, 0xe8d0f0);
  },

  // Milchstraße: ein breites Band aus Sternenstaub
  sternbild_flush(p) {
    cosmos(p, [0x050a22, 0x0e1a52, 0x1c2a78], 19, { stars: 26 });
    // schräges Band
    const r = rng(77);
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 40; x++) {
        const d = Math.abs((x - 20) * 0.62 + (y - 20) * 0.78 - 0.0) / 9; // Abstand zur Mittellinie
        if (d > 1.1) continue;
        const dens = Math.max(0, 1 - d) * 0.95;
        const v = r();
        if (v < dens * 0.55) p.set(x, y, d < 0.35 ? 0xf4ecff : d < 0.7 ? 0xb4a8f0 : 0x7a78d0);
        else if (v < dens * 0.7) p.set(x, y, 0xe8b0e8);
      }
    glow(p, 20, 20, 9, 0xffc8f0, 0.5);
    p.sparkle(8, 32, 0xffffff, true); p.sparkle(32, 8, 0xffffff, true);
    // Kiefern am Rand
    hills(p, 36, 1, 10, 1, 0x070b22);
    for (const x of [3, 9, 27, 34]) p.poly([x, 28, x - 3, 38, x + 3, 38], 0x08122a);
    for (const x of [4, 10, 28, 35]) p.poly([x, 31, x - 3, 38, x + 3, 38], 0x0c1c3a);
    p.rect(0, 37, 40, 3, 0x070b22);
  },

  // Sternenhaus: Sterne zeichnen ein Haus an den Himmel
  sternbild_fullHouse(p) {
    cosmos(p, [0x0a1032, 0x1c2060, 0x4a2e88], 21, { stars: 12, clouds: [[20, 30, 22, 10, 0x7a50c0, 0.7]] });
    // Berge
    hills(p, 33, 3, 22, 2, 0x10163e, 0x2c3a80);
    const pts = [[20, 6, 3], [7, 17, 2], [33, 17, 2], [9, 33, 2], [31, 33, 2], [20, 25, 1]];
    constel(p, pts, [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 2]], 0xa8c4ff);
    // Tür aus Sternen
    for (const [x, y] of [[17, 30], [17, 26], [23, 26], [23, 30]]) p.sparkle(x, y, 0xffd860);
    p.line(17, 26, 23, 26, 0x7aa0f0); p.line(17, 26, 17, 31, 0x7aa0f0); p.line(23, 26, 23, 31, 0x7aa0f0);
    p.rect(19, 28, 2, 3, 0xffe27a);
  },

  // Südkreuz: vier Sterne im Kreuz über dem Meer
  sternbild_fourKind(p) {
    cosmos(p, [0x04102c, 0x0c2a60, 0x1a4a90], 23, { stars: 18, clouds: [[20, 12, 18, 10, 0x2a7ad0, 0.6]] });
    // Meer
    p.vgrad(0, 30, 40, 10, [0x0c2a5c, 0x08183c]);
    for (let x = 0; x < 40; x += 3) p.set(x + (x % 2), 31 + (x % 3), 0x3a6ac0);
    constel(p, [[20, 4, 3], [20, 26, 3], [9, 13, 2], [31, 18, 2]], [[0, 1], [2, 3]], 0xb4d0ff);
    // Spiegelung im Wasser
    for (const [x, y] of [[20, 33], [20, 36], [17, 34], [24, 35]]) { p.set(x, y, 0xffe27a); p.set(x + 1, y + 1, 0x8ab0f0); }
    p.line(20, 31, 20, 39, 0xa08840);
    p.sparkle(34, 7, 0xffffff); p.sparkle(5, 24, 0xffffff);
  },

  // Kometenpfad: ein Komet zieht einen langen Schweif durch die Nacht
  sternbild_straightFlush(p) {
    cosmos(p, [0x14083a, 0x2a1468, 0x4a2a98], 25, { stars: 20, clouds: [[14, 28, 18, 10, 0x8a4ad0, 0.6]] });
    // Schweif: breites Band von links unten nach rechts oben
    for (let i = 0; i < 70; i++) {
      const t = i / 70, x = 4 + t * 26, y = 36 - t * 24;
      const w = 1 + t * 5;
      for (let k = -w; k <= w; k++) {
        const px = Math.round(x - k * 0.5), py = Math.round(y + k * 0.8);
        const a = Math.abs(k) / w;
        if (a < 0.4) p.set(px, py, t > 0.6 ? 0xfff4d0 : 0xa8f0ff);
        else if (a < 0.8 && (px + py) % 2 === 0) p.set(px, py, t > 0.5 ? 0x7ad8ff : 0x5a9af0);
        else if ((px + py) % 3 === 0 && a < 1) p.set(px, py, 0x6a7ae0);
      }
    }
    glow(p, 31, 10, 10, 0xfff0b0, 1);
    p.ball(31, 10, 5, P.yellow, 0.05);
    p.disc(29, 8, 1.5, 0xffffff);
    // Sterne am Pfad
    for (const [x, y] of [[8, 30], [14, 22], [22, 17]]) p.sparkle(x, y, 0xffe27a);
    p.sparkle(35, 30, 0xffffff, true);
  },

  // Fünfgestirn: fünf Sterne im Kreis, durch ein Pentagramm verbunden
  sternbild_fiveKind(p) {
    cosmos(p, [0x14063a, 0x2a1070, 0x5a2aa8], 27, { stars: 14, clouds: [[20, 20, 18, 18, 0xa04ae0, 0.6]] });
    p.ring(20, 20, 17, 0x8a5ae0);
    p.ring(20, 20, 18, 0x4a2a98);
    const pts: number[][] = [];
    for (let i = 0; i < 5; i++) {
      const a = (-90 + i * 72) * Math.PI / 180;
      pts.push([Math.round(20 + Math.cos(a) * 16), Math.round(20 + Math.sin(a) * 16), 3]);
    }
    constel(p, pts, [[0, 2], [2, 4], [4, 1], [1, 3], [3, 0]], 0xd8b8ff);
    glow(p, 20, 20, 7, 0xffe27a, 0.9);
    star4(p, 20, 20, 5, 0xffe27a);
  },

  // Nebelhaus: ein Haus am Hang im leuchtenden Nebel
  sternbild_flushHouse(p) {
    cosmos(p, [0x0a1a3a, 0x1a3a6a, 0x3a5aa0], 29, { stars: 10, clouds: [[12, 14, 18, 12, 0xe060c0, 0.9], [30, 10, 14, 10, 0x40d0c8, 0.9], [22, 24, 22, 10, 0xa070e8, 0.7]] });
    hills(p, 30, 2, 26, 1.2, 0x101a42, 0x2a3a80);
    // Haus
    p.fig((q) => {
      q.rect(13, 24, 14, 11, P.wood[1]);
      q.poly([11, 24, 20, 15, 29, 24], P.crimson[1]);
      q.poly([11, 24, 20, 15, 20, 24], P.crimson[2]);
      q.rect(17, 28, 4, 7, P.darkwood[1]);
      q.rect(14, 27, 3, 3, 0xffe27a);
      q.rect(23, 27, 3, 3, 0xffe27a);
      q.rect(24, 17, 2, 4, P.stone[1]);
    });
    p.rect(17, 28, 4, 7, 0x3a2216);
    p.set(20, 31, 0xffd860);
    // Rauch
    for (const [x, y, c] of [[25, 14, 0xe8e0f8], [26, 12, 0xd0c8f0], [24, 10, 0xb8b0e8]] as [number, number, number][]) p.disc(x, y, 1.5, c);
    p.rect(0, 36, 40, 4, 0x0c1438);
  },

  // Urnebel: ein Wirbel aus fünf Farben um einen hellen Kern
  sternbild_flushFive(p) {
    cosmos(p, [0x040618, 0x0a0c30, 0x180f48], 31, { stars: 22 });
    const cols = [0xff5a7a, 0xffb43a, 0x5fe08a, 0x4ab8ff, 0xb070ff];
    const r = rng(5);
    for (let arm = 0; arm < 5; arm++) {
      for (let i = 0; i < 90; i++) {
        const t = i / 90;
        const a = arm * (Math.PI * 2 / 5) + t * 4.4;
        const rad = 1.5 + t * 19;
        const w = 1 + t * 2.2;
        for (let k = 0; k < 2; k++) {
          const ox = (r() - 0.5) * w, oy = (r() - 0.5) * w;
          p.set(20 + Math.cos(a) * rad + ox, 20 + Math.sin(a) * rad * 0.9 + oy, t < 0.25 ? 0xffffff : cols[arm]);
        }
      }
    }
    glow(p, 20, 20, 8, 0xffffff, 1);
    p.disc(20, 20, 3, 0xfff6d8);
    p.disc(20, 20, 1.5, 0xffffff);
    dust(p, [[6, 6], [34, 34], [34, 6], [6, 34]], [0xffffff]);
  },
};
void bubbles; void cloud; void gemStar; void starPts;
