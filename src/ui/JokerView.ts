import { Container, Graphics, Text } from 'pixi.js';
import { getJoker, type JokerInstance } from '../core/jokers';
import { C, FONT, RARITY_COLORS } from './theme';

export const JOKER_W = 104;
export const JOKER_H = 140;

export class JokerView extends Container {
  constructor(public readonly joker: JokerInstance) {
    super();
    const def = getJoker(joker.defId)!;
    const color = RARITY_COLORS[def.rarity];
    const w = JOKER_W, h = JOKER_H;
    const g = new Graphics()
      .roundRect(-w / 2 + 3, -h / 2 + 6, w, h, 10).fill({ color: 0x000000, alpha: 0.35 })
      .roundRect(-w / 2, -h / 2, w, h, 10).fill(C.cardFace).stroke({ width: 3, color: C.cardEdge })
      .roundRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 50, 6).fill(color)
      .circle(0, -h / 2 + 7 + (h - 50) / 2, 22).fill({ color: 0xffffff, alpha: 0.25 });
    const initial = new Text({ text: def.name[0], style: { fontFamily: FONT, fontSize: 40, fontWeight: '900', fill: 0xffffff } });
    initial.anchor.set(0.5);
    initial.y = -h / 2 + 7 + (h - 50) / 2;
    const name = new Text({
      text: def.name,
      style: { fontFamily: FONT, fontSize: 15, fontWeight: '800', fill: C.cardEdge, align: 'center', wordWrap: true, wordWrapWidth: w - 10 },
    });
    name.anchor.set(0.5);
    name.y = h / 2 - 22;
    this.addChild(g, initial, name);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }
}
