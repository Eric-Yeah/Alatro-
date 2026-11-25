import { Container, Graphics } from 'pixi.js';
import { CARD_BODY } from '../data/depth';
import { CONTROL_BAND, DECK_STACK, FELT, PLAY_ZONE, SLOT } from '../data/tableSurface';
import { CARD_H, CARD_W, cardBack } from './CardView';
import { dropShadow } from './depth';

// Tischfläche und Bausteine des Spieltisches (Comic Stil, flache Flächen): Filz, Kartenplätze, Rinne für die Knöpfe, Kartenstapel.
// Alles ist statisch gezeichnet (Graphics), keine Filter, nichts pro Bild.

/** Lage der Dinge auf dem Tisch (die Zahlen gehören zu `Game.ts`) */
export interface SurfaceLayout {
  /** Mitte des Spielbereichs (waagerecht) */
  mx: number;
  /** Mitte der Spielzone (senkrecht) */
  playY: number;
  /** Mitte des Kartenstapels */
  deckX: number;
  deckY: number;
}

/**
 * Gestrichelter Umriss eines Platzes (Rechteck mit runden Ecken) in ein Graphics: gerade Stücke in Strichen, Ecken als kurze Bögen.
 * Die Mulde dahinter ist leicht abgedunkelt.
 */
export function slotOutline(g: Graphics, x: number, y: number, w: number, h: number, radius = SLOT.radius): Graphics {
  g.roundRect(x, y, w, h, radius).fill({ color: SLOT.fill, alpha: SLOT.fillAlpha });
  const r = radius;
  const { dash, gap } = SLOT;
  const dashes = (x0: number, y0: number, dx: number, dy: number, len: number) => {
    const n = Math.max(1, Math.round(len / (dash + gap)));
    const step = len / n;
    const d = Math.min(dash, step * 0.6);
    for (let i = 0; i < n; i++) {
      const a = i * step + (step - d) / 2;
      g.moveTo(x0 + dx * a, y0 + dy * a).lineTo(x0 + dx * (a + d), y0 + dy * (a + d));
    }
  };
  dashes(x + r, y, 1, 0, w - 2 * r);
  dashes(x + r, y + h, 1, 0, w - 2 * r);
  dashes(x, y + r, 0, 1, h - 2 * r);
  dashes(x + w, y + r, 0, 1, h - 2 * r);
  // Ecken als Viertelbögen, damit der Umriss rund bleibt
  g.moveTo(x, y + r).arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  g.moveTo(x + w - r, y).arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2);
  g.moveTo(x + w, y + h - r).arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5);
  g.moveTo(x + r, y + h).arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI);
  g.stroke({ width: SLOT.width, color: SLOT.line, alpha: SLOT.lineAlpha, cap: 'round' });
  return g;
}

/** Filzfläche mit Rand, Plätzen der Spielzone, Platz des Stapels und Rinne unten. Liegt unter Karten und Seitenleiste. */
export function buildTableSurface(L: SurfaceLayout): Container {
  const root = new Container();
  root.eventMode = 'none';
  const { x, y, w, h, radius: r } = FELT;

  // Harter Rand außen: kräftige dunkle Kontur und ein schmaler Schattenstreifen (Ausrichtung nach außen, damit nichts durch die
  // durchscheinende Fläche schimmert)
  const fall = new Graphics();
  fall.roundRect(x, y, w, h, r).stroke({ width: FELT.shadowWidth, color: FELT.line, alpha: FELT.shadowAlpha, alignment: 0 });
  fall.roundRect(x, y, w, h, r).stroke({ width: FELT.lineWidth, color: FELT.line, alpha: FELT.lineAlpha, alignment: 0 });
  root.addChild(fall);

  // Fläche: flaches tiefes Nachtblau, durchscheinend (der Sternhimmel bleibt sichtbar)
  const felt = new Graphics();
  felt.roundRect(x, y, w, h, r).fill(FELT.color);
  root.addChild(felt);

  // Rinne unten hinter den Spielknöpfen: bis zum Rand des Filzes, mit den unteren Ecken des Filzes
  const band = new Graphics();
  const by = CONTROL_BAND.y;
  const bottom = y + h;
  band.moveTo(x + 1, by).lineTo(x + w - 1, by).lineTo(x + w - 1, bottom - r).arcTo(x + w - 1, bottom - 1, x + w - r, bottom - 1, r - 1)
    .lineTo(x + r, bottom - 1).arcTo(x + 1, bottom - 1, x + 1, bottom - r, r - 1).closePath()
    .fill(CONTROL_BAND.fill);
  // Kante oben: harte dunkle Linie, darunter helle Lippe (die Rinne liegt tiefer)
  band.moveTo(x + 8, by).lineTo(x + w - 8, by).stroke({ width: 2, color: 0x000000, alpha: CONTROL_BAND.darkAlpha });
  band.moveTo(x + 8, by + 2).lineTo(x + w - 8, by + 2).stroke({ width: 1.5, color: 0xffffff, alpha: CONTROL_BAND.lightAlpha });
  root.addChild(band);

  // Innenkante: kleiner Lichtstreifen oben, feine Linie als Sternbild Rahmen
  const edge = new Graphics();
  edge.roundRect(x + FELT.lightInset, y + 3, w - 2 * FELT.lightInset, 3, 1.5).fill({ color: 0xffffff, alpha: FELT.lightAlpha });
  const g = FELT.inlineGap;
  edge.roundRect(x + g, y + g, w - 2 * g, h - 2 * g, r - g / 2).stroke({ width: 1, color: FELT.inlineColor, alpha: FELT.inlineAlpha });
  root.addChild(edge);

  // Spielzone: eine breite Mulde mit feinem Umriss (gespielte Karten liegen mittig darin, auch bei weniger als fünf)
  const slots = new Graphics();
  const pad = PLAY_ZONE.pad;
  const zoneW = (PLAY_ZONE.slots - 1) * PLAY_ZONE.spacing + CARD_W + 2 * pad;
  slotOutline(slots, L.mx - zoneW / 2, L.playY - CARD_H / 2 - pad, zoneW, CARD_H + 2 * pad, PLAY_ZONE.radius);
  // Platz des Stapels
  slotOutline(slots, L.deckX - CARD_W / 2 - SLOT.pad, L.deckY - CARD_H / 2 - SLOT.pad, CARD_W + 2 * SLOT.pad, CARD_H + 2 * SLOT.pad);
  root.addChild(slots);
  return root;
}

/** Kartenstapel aus mehreren versetzten Rückseiten mit weichem Schatten. Mitte der untersten Karte ist der Ursprung. */
export interface DeckStack {
  root: Container;
  /** Füllstand 0 bis 1: weniger Karten, niedrigerer Stapel */
  setFill(frac: number): void;
}

export function buildDeckStack(): DeckStack {
  const root = new Container();
  const { layers, dx, dy } = DECK_STACK;
  // ein Schatten für den ganzen Stapel (die Rückseiten bringen ihren eigenen mit, der hier entfällt)
  const w = CARD_W;
  const h = CARD_H + CARD_BODY.dy;
  const shadow = dropShadow(w, h, DECK_STACK.shadow, { radius: 8 });
  shadow.x -= w / 2;
  shadow.y -= CARD_H / 2;
  root.addChild(shadow);
  const cards: Container[] = [];
  for (let i = 0; i < layers; i++) {
    const c = cardBack();
    // die Rückseite bringt ihren eigenen Schatten als erstes Kind mit: hier nur der gemeinsame Schatten
    c.removeChildAt(0).destroy();
    c.position.set(i * dx, i * dy);
    root.addChild(c);
    cards.push(c);
  }
  let shown = -1;
  return {
    root,
    setFill(frac: number) {
      const n = frac <= 0 ? 0 : Math.max(1, Math.min(layers, Math.ceil(frac * layers)));
      if (n === shown) return;
      shown = n;
      cards.forEach((c, i) => { c.visible = i < n; });
      shadow.visible = n > 0;
    },
  };
}
