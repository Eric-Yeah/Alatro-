import { Container, Graphics, Text } from 'pixi.js';
import { SUIT_SYMBOLS, isFace, rankLabel, type Card } from '../core/cards';
import { C, FONT, SUIT_COLORS } from './theme';

export const CARD_W = 112;
export const CARD_H = 156;

export class CardView extends Container {
  selected = false;
  homeX = 0;
  homeY = 0;
  homeRot = 0;
  readonly face = new Container();

  constructor(public readonly card: Card) {
    super();
    const color = SUIT_COLORS[card.suit];
    const sym = SUIT_SYMBOLS[card.suit];
    const rl = rankLabel(card.rank);
    const w = CARD_W, h = CARD_H;

    const shadow = new Graphics().roundRect(-w / 2 + 3, -h / 2 + 6, w, h, 10).fill({ color: 0x000000, alpha: 0.35 });
    const body = new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 10).fill(C.cardFace).stroke({ width: 3, color: C.cardEdge })
      .roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 6).stroke({ width: 1.5, color, alpha: 0.35 });

    const style = { fontFamily: FONT, fontWeight: '900' as const, fill: color };
    const corner = (rot: number) => {
      const c = new Container();
      const r = new Text({ text: rl, style: { ...style, fontSize: 26 } });
      r.anchor.set(0.5, 0);
      const s = new Text({ text: sym, style: { ...style, fontSize: 20 } });
      s.anchor.set(0.5, 0);
      s.y = 26;
      c.addChild(r, s);
      c.position.set(rot ? w / 2 - 18 : -w / 2 + 18, rot ? h / 2 - 8 : -h / 2 + 8);
      c.rotation = rot;
      return c;
    };

    const center = new Container();
    if (isFace(card.rank) || card.rank === 14) {
      const frame = new Graphics().roundRect(-30, -42, 60, 84, 8).fill({ color, alpha: 0.12 }).stroke({ width: 2, color, alpha: 0.6 });
      const big = new Text({ text: rl, style: { ...style, fontSize: 50 } });
      big.anchor.set(0.5);
      big.y = -10;
      const small = new Text({ text: sym, style: { ...style, fontSize: 26 } });
      small.anchor.set(0.5);
      small.y = 24;
      center.addChild(frame, big, small);
    } else {
      const big = new Text({ text: sym, style: { ...style, fontSize: 64 } });
      big.anchor.set(0.5);
      center.addChild(big);
    }

    this.face.addChild(shadow, body, corner(0), corner(Math.PI), center);
    this.addChild(this.face);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }
}

export function cardBack(): Container {
  const c = new Container();
  const w = CARD_W, h = CARD_H;
  const g = new Graphics()
    .roundRect(-w / 2 + 3, -h / 2 + 6, w, h, 10).fill({ color: 0x000000, alpha: 0.35 })
    .roundRect(-w / 2, -h / 2, w, h, 10).fill(C.cardBack).stroke({ width: 3, color: C.cardEdge })
    .roundRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 6).stroke({ width: 2, color: 0xffffff, alpha: 0.35 });
  for (let i = -3; i <= 3; i++) {
    g.moveTo(-w / 2 + 14, i * 18).lineTo(0, i * 18 - 30).lineTo(w / 2 - 14, i * 18).stroke({ width: 2, color: 0xffffff, alpha: 0.12 });
  }
  c.addChild(g);
  return c;
}
