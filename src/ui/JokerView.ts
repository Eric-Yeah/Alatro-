import { Container, Graphics, Text } from 'pixi.js';
import { getJoker, type JokerInstance } from '../core/jokers';
import { EDITIONS } from '../data/modifiers';
import { editionOverlay } from './editionFx';
import { drawJokerArt } from './jokerArt';
import { C, EDITION_COLORS, FONT, RARITY_COLORS } from './theme';

export const JOKER_W = 104;
export const JOKER_H = 140;

export class JokerView extends Container {
  constructor(public readonly joker: JokerInstance) {
    super();
    const def = getJoker(joker.defId)!;
    const color = RARITY_COLORS[def.rarity];
    const w = JOKER_W, h = JOKER_H;
    const g = new Graphics()
      .roundRect(-w / 2, -h / 2 + 5, w, h, 8).fill({ color: 0x000000, alpha: 0.4 })
      .roundRect(-w / 2, -h / 2, w, h, 8).fill(C.cardFace).stroke({ width: 3, color: C.cardEdge })
      .roundRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 50, 4).fill(color).stroke({ width: 2, color: C.cardEdge });
    const art = new Graphics();
    art.y = -h / 2 + 7 + (h - 50) / 2;
    drawJokerArt(art, joker.defId, w - 14, h - 50, 26);
    const name = new Text({
      text: def.name,
      style: { fontFamily: FONT, fontSize: 15, fontWeight: '800', fill: C.cardEdge, align: 'center', wordWrap: true, wordWrapWidth: w - 10 },
    });
    name.anchor.set(0.5);
    name.y = h / 2 - 22;
    this.addChild(g, art, name);
    if (joker.edition && EDITIONS[joker.edition]) {
      const ec = EDITION_COLORS[joker.edition] ?? C.accent;
      const glow = new Graphics()
        .roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 12).stroke({ width: 5, color: ec, alpha: 0.95 });
      const ed = new Text({ text: EDITIONS[joker.edition].name, style: { fontFamily: FONT, fontSize: 12, fontWeight: '900', fill: 0xffffff, stroke: { color: 0x0b1018, width: 4 } } });
      ed.anchor.set(0.5);
      ed.y = -h / 2 + 14;
      this.addChild(glow);
      const fx = editionOverlay(joker.edition, w, h, 10);
      if (fx) this.addChild(fx);
      this.addChild(ed);
    }
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }
}
