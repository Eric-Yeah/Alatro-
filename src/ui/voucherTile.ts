import { VOUCHER_ART as V } from '../data/voucherArt';
import { INK, Pix, ramp } from './jokerPix';
import { PAL as P, glow, starPts } from './jokerKit';

// Voucher als Pixel Art Ticket: violette Karte mit Goldrand, seitlichen Kerben und Abrisslinie, darüber eine
// Kristallkugel mit goldenem Stern. Rein und ohne DOM. Der Text (Kopfzeile "Voucher" und Name) steht darüber.

function inside(x: number, y: number): boolean {
  const { w, h } = V;
  // abgerundete Ecken
  const r = 4;
  const cx = x < r ? r - 0.5 - x : x >= w - r ? x - (w - r) + 0.5 : 0;
  const cy = y < r ? r - 0.5 - y : y >= h - r ? y - (h - r) + 0.5 : 0;
  if (cx * cx + cy * cy > r * r) return false;
  // halbrunde Kerben an der Abrisslinie
  const dy = y - V.tearY;
  if (x < 3 + 0.5 && dy * dy + (x - 0) * (x - 0) <= 9) return false;
  if (x > w - 4 + 0.5 && dy * dy + (x - (w - 1)) * (x - (w - 1)) <= 9) return false;
  return true;
}

export function voucherTilePix(): Pix {
  const { w, h } = V;
  const t = new Pix(w, h);
  const body = new Pix(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      let c = V.base;
      if (x <= 1 || y <= 1) c = V.light;
      else if (x >= w - 3 || y >= h - 3) c = V.dark;
      // diagonale Glanzstreifen
      const s = ((x + y * 0.8) % 18 + 18) % 18;
      if (c === V.base && s < 2.2) c = V.light;
      body.set(x, y, c);
    }
  body.outline(INK);
  t.blit(body);
  // Goldrahmen innen
  t.frame(3, 3, w - 6, h - 6, V.trim);
  t.frame(4, 4, w - 8, h - 8, V.trimDark);
  for (let i = 5; i < w - 5; i += 4) { t.set(i, 4, V.trimLight); t.set(i, h - 5, V.trimLight); }
  // Kopfstreifen (Text darüber)
  t.rect(6, V.headY, w - 12, V.headH, INK);
  t.rect(7, V.headY + 1, w - 14, V.headH - 2, V.trim);
  t.rect(7, V.headY + V.headH - 2, w - 14, 1, V.trimDark);
  t.rect(7, V.headY + 1, w - 14, 1, V.trimLight);
  // Kristallkugel mit Stern
  const cx = w / 2, cy = V.ballY;
  glow(t, cx, cy, V.ballR + 6, 0x8a6ae8, 0.7);
  t.fig((q) => {
    q.ball(cx, cy, V.ballR, ramp(0x4a3aa8), 0.08);
    q.poly([cx - 7, cy + V.ballR + 1, cx + 7, cy + V.ballR + 1, cx + 5, cy + V.ballR + 4, cx - 5, cy + V.ballR + 4], P.gold[2]);
  });
  t.disc(cx, cy, V.ballR - 2, 0x1c1654);
  t.poly(starPts(cx, cy, V.ballR - 3, 3.2, 5), P.gold[2]);
  t.poly(starPts(cx, cy - 0.5, V.ballR - 5, 2.2, 5), P.gold[4]);
  t.set(cx, cy, 0xffffff);
  t.rect(cx - 6, cy + V.ballR + 1, 12, 1, P.gold[4]);
  // Glasglanz oben links
  t.line(cx - 7, cy - 4, cx - 4, cy - 7, 0xffffff);
  t.set(cx - 8, cy - 2, 0xcfd8ff); t.set(cx - 3, cy - 8, 0xcfd8ff);
  // Abrisslinie (gestrichelt) zwischen den Kerben
  for (let x = 6; x < w - 6; x += 4) { t.rect(x, V.tearY, 2, 1, V.trimLight); }
  // Namensband (Text darüber)
  t.rect(6, V.nameY, w - 12, V.nameH, INK);
  t.rect(7, V.nameY + 1, w - 14, V.nameH - 2, V.trim);
  t.rect(7, V.nameY + V.nameH - 2, w - 14, 1, V.trimDark);
  t.rect(8, V.nameY + 2, w - 16, V.nameH - 4, V.band);
  // Funkeln
  t.sparkle(9, V.ballY - 10, 0xffffff); t.sparkle(w - 10, V.ballY - 6, 0xffe27a);
  return t;
}
