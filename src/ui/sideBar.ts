import { Container, Graphics, type Text } from 'pixi.js';
import { C, STYLE, shade } from './theme';
import { label, panel } from './widgets';
import { t } from '../i18n';

// Bausteine der linken Seitenleiste im Spiel. Maße in Bildpunkten des Spielfelds (1440 mal 1000).
// Von oben nach unten: Blind, Round Score mit Balken, Hand, Hands und Discards, Geld, Ante, Knöpfe, Tempo.

export const SIDE = {
  x: 20,
  w: 330,
  blind: { y: 20, h: 176 },
  score: { y: 208, h: 96, barY: 60, barH: 20, barPad: 20 },
  hand: { y: 316, h: 168 },
  /** Vorschau im Shop: sitzt auf der Höhe von Round Score und Hand */
  next: { y: 208 },
  counters: { y: 496, h: 88, w: 160, gap: 10 },
  money: { y: 596, h: 60 },
  ante: { y: 668, h: 92, pipW: 28, pipH: 12, pipGap: 10, pipY: 72 },
  buttons: { y: 776, h: 54, w: 104, gap: 9 },
  tempo: { y: 842, w: 330, h: 46 },
  tagsBottom: 940,
  seedY: 966,
} as const;

/** Farben des Balkens und der Marker */
const BAR = { chips: C.chips, goal: C.money, track: 0x0b1018 };

/** Fortschritt zum Ziel als Balken. ratio ab 1 färbt ihn gold (Ziel erreicht). */
export function drawScoreBar(g: Graphics, ratio: number) {
  const { barY, barH, barPad } = SIDE.score;
  const w = SIDE.w - barPad * 2;
  const inner = w - 6;
  const fill = Math.max(0, Math.min(1, ratio));
  const color = ratio >= 1 ? BAR.goal : BAR.chips;
  g.clear()
    .roundRect(barPad, barY, w, barH, 6).fill(BAR.track).stroke({ width: 2, color: C.panelLine });
  if (fill > 0) {
    const fw = Math.max(8, inner * fill);
    g.roundRect(barPad + 3, barY + 3, fw, barH - 6, 4).fill(color)
      .roundRect(barPad + 5, barY + 4, Math.max(2, fw - 4), 3, 1.5).fill({ color: 0xffffff, alpha: 0.35 });
  }
}

/**
 * Ante Feld: Ante und Round als Zahlen, darunter ein Marker je Ante.
 * Abgeschlossene Antes sind gold, die aktuelle füllt sich mit den gespielten Blinds, spätere sind dunkel.
 */
export function buildAnteStrip(): { box: Container; anteText: Text; roundText: Text; pips: Graphics } {
  const { y, h } = SIDE.ante;
  const box = panel(SIDE.w, h, C.panelDark);
  box.position.set(SIDE.x, y);
  const divider = new Graphics().rect(SIDE.w / 2 - 1, 14, 2, 44).fill({ color: C.holo, alpha: 0.25 });
  const col = (x: number, title: string) => {
    const l = label(title, 18, C.textDim);
    l.position.set(x, 22);
    const v = label('', 30, C.money);
    v.position.set(x, 46);
    box.addChild(l, v);
    return v;
  };
  const anteText = col(SIDE.w / 4, 'Ante');
  const roundText = col((SIDE.w * 3) / 4, 'Round');
  const pips = new Graphics();
  box.addChild(divider, pips);
  return { box, anteText, roundText, pips };
}

/** Zeichnet die Marker der Ante Leiste. blindIndex 0 bis 2 ist der Blind, der in dieser Ante gerade ansteht. */
export function drawAntePips(g: Graphics, ante: number, finalAnte: number, blindIndex: number) {
  const { pipW, pipH, pipGap, pipY } = SIDE.ante;
  const total = finalAnte * pipW + (finalAnte - 1) * pipGap;
  const x0 = (SIDE.w - total) / 2;
  g.clear();
  for (let i = 1; i <= finalAnte; i++) {
    const x = x0 + (i - 1) * (pipW + pipGap);
    const done = i < ante;
    const current = i === ante;
    g.roundRect(x - 2, pipY - 2, pipW + 4, pipH + 4, 4).fill(C.panelLine);
    g.roundRect(x, pipY, pipW, pipH, 3).fill(done ? C.money : 0x2a3a4e);
    if (current) {
      const f = Math.max(0, Math.min(1, blindIndex / 3));
      if (f > 0) g.roundRect(x, pipY, Math.max(4, pipW * f), pipH, 3).fill(C.accent);
      g.roundRect(x - 2, pipY - 2, pipW + 4, pipH + 4, 4).stroke({ width: 2, color: C.accent });
    } else if (done) {
      g.roundRect(x + 2, pipY + 1, pipW - 4, 3, 1.5).fill({ color: 0xffffff, alpha: 0.35 });
    }
  }
}

/** Kachel mit Farbstreifen am oberen Rand: Beschriftung oben, Wert darunter (Hands, Discards) */
export function statTile(title: string, color: number, x: number, y: number): { box: Container; value: Text } {
  const { w, h } = SIDE.counters;
  const box = panel(w, h, C.panelDark);
  box.position.set(x, y);
  const stripe = new Graphics().roundRect(12, 9, w - 24, 5, 2.5).fill(color).roundRect(12, 9, w - 24, 2, 1).fill({ color: 0xffffff, alpha: 0.3 });
  const l = label(title, 18, C.textDim);
  l.position.set(w / 2, 31);
  const value = label('0', 38, color);
  value.position.set(w / 2, 62);
  box.addChild(stripe, l, value);
  return { box, value };
}

/** Geldfeld: goldener Streifen links, Beschriftung links, Betrag rechts */
export function buildMoneyTile(): { box: Container; value: Text } {
  const { h } = SIDE.money;
  const box = panel(SIDE.w, h, C.panelDark);
  box.position.set(SIDE.x, SIDE.money.y);
  const stripe = new Graphics().roundRect(10, 12, 5, h - 24, 2.5).fill(C.money).roundRect(10, 12, 2, h - 24, 1).fill({ color: 0xffffff, alpha: 0.3 });
  const l = label('Money', 20, C.textDim);
  l.anchor.set(0, 0.5);
  l.position.set(26, h / 2);
  const value = label('$0', 40, C.money);
  value.anchor.set(1, 0.5);
  value.position.set(SIDE.w - 20, h / 2 + 1);
  box.addChild(stripe, l, value);
  return { box, value };
}

/** Hintergrund des Blind Fensters: Farbe der Blind Art, dunklerer Einsatz für Ziel und Belohnung */
export function drawBlindBanner(g: Graphics, color: number) {
  const { h } = SIDE.blind;
  const w = SIDE.w;
  g.clear()
    .roundRect(0, STYLE.shadowY, w, h, 8).fill(STYLE.shadowColor)
    .roundRect(0, 0, w, h, 8).fill(color).stroke({ width: 3, color: C.panelLine })
    .roundRect(10, 58, w - 20, h - 68, 6).fill(shade(color, 0.4))
    .roundRect(14, 6, w - 28, 3, 1.5).fill({ color: 0xffffff, alpha: 0.28 });
}

/** Texte in der Hand Anzeige, wenn noch keine Karte gewählt ist */
export function handHintText(): Text {
  const hint = label(t('Wähle bis zu 5 Karten'), 20, C.textDim);
  hint.position.set(SIDE.w / 2, 42);
  return hint;
}
