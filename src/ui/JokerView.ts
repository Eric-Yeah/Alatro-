import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { getJoker, type JokerInstance } from '../core/jokers';
import { EDITIONS } from '../data/modifiers';
import { hashString } from '../core/rng';
import { attachFloat } from './cardMotion';
import { editionOverlay } from './editionFx';
import { ART_H, ART_Y, BAND_H, BAND_TEXT, BAND_Y, TILE_H, TILE_SCALE, TILE_W } from '../data/jokerArt';
import { jokerTexture } from './jokerArt';
import { effectTags } from './jokerInfo';
import { C, EDITION_COLORS, FONT_BODY } from './theme';
import { label } from './widgets';

export const JOKER_W = TILE_W * TILE_SCALE;
export const JOKER_H = TILE_H * TILE_SCALE;

export class JokerView extends Container {
  /** Innerer Container mit allem Sichtbaren (hier schwebt die Karte, die Karte selbst bleibt für Tweens frei) */
  readonly body = new Container();

  /** float: leichtes Schweben, 'shop': etwas ruhiger (Shop und Pack Auswahl) */
  constructor(public readonly joker: JokerInstance, float: boolean | 'shop' = true) {
    super();
    const def = getJoker(joker.defId)!;
    const w = JOKER_W, h = JOKER_H;
    const shadow = new Graphics().roundRect(-w / 2 + 3, -h / 2 + 6, w, h, 10).fill({ color: 0x000000, alpha: 0.35 });
    // ganze Kachel als Pixel Art: Rahmen in Farbe der Seltenheit, Motiv, dunkles Namensband
    const tile = new Sprite(jokerTexture(joker.defId, def.rarity));
    tile.anchor.set(0.5);
    tile.scale.set(TILE_SCALE);
    const name = new Text({
      text: def.name,
      style: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: '800', fill: BAND_TEXT, align: 'center' },
    });
    name.anchor.set(0.5);
    name.y = -h / 2 + (BAND_Y + BAND_H / 2) * TILE_SCALE;
    // lange einzelne Wörter (z. B. Kartenhändler) verkleinern statt über den Kartenrand laufen
    if (name.width > w - 14) name.scale.set((w - 14) / name.width);
    this.addChild(this.body);
    this.body.addChild(shadow, tile, name);
    // Wirkungs Marken am unteren Rand des Motivs: Farbe und Buchstabe zeigen auf einen Blick, was der Joker tut
    const tags = effectTags(def).slice(0, 5);
    const pw = 18, ph = 14, gap = 2;
    const rowW = tags.length * pw + (tags.length - 1) * gap;
    tags.forEach((tg, i) => {
      const px = -rowW / 2 + i * (pw + gap);
      const py = -h / 2 + (ART_Y + ART_H) * TILE_SCALE - ph - 5;
      const pill = new Graphics()
        .roundRect(px - 2, py - 2, pw + 4, ph + 4, 6).fill(C.cardEdge)
        .roundRect(px, py, pw, ph, 4).fill(tg.color);
      const t = label(tg.short, 11, 0xffffff);
      t.position.set(px + pw / 2, py + ph / 2);
      this.body.addChild(pill, t);
    });
    if (joker.edition && EDITIONS[joker.edition]) {
      const ec = EDITION_COLORS[joker.edition] ?? C.accent;
      const glow = new Graphics()
        .roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 12).stroke({ width: 5, color: ec, alpha: 0.95 });
      const ed = new Text({ text: EDITIONS[joker.edition].name, style: { fontFamily: FONT_BODY, fontSize: 12, fontWeight: '900', fill: 0xffffff, stroke: { color: 0x1b1530, width: 4 } } });
      ed.anchor.set(0.5);
      ed.y = -h / 2 + 14;
      this.body.addChild(glow);
      const fx = editionOverlay(joker.edition, w, h, 10);
      if (fx) this.body.addChild(fx);
      this.body.addChild(ed);
    }
    this.eventMode = 'static';
    this.cursor = 'pointer';
    // Phase aus der Joker UID, Vorschau Karten (UID -1) aus dem Namen der Vorlage
    if (float) attachFloat(this.body, joker.uid >= 0 ? joker.uid : hashString(joker.defId), float === 'shop' ? 'shop' : 'joker');
  }
}
