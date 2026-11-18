import { Container, Graphics, Text } from 'pixi.js';
import { SUIT_SYMBOLS, isFace, isRankless, rankLabel, type Card } from '../core/cards';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { editionOverlay } from './editionFx';
import { C, EDITION_COLORS, ENHANCEMENT_COLORS, FONT, SEAL_COLORS, SUIT_COLORS } from './theme';

export const CARD_W = 112;
export const CARD_H = 156;

export class CardView extends Container {
  selected = false;
  homeX = 0;
  homeY = 0;
  homeRot = 0;
  readonly face = new Container();
  private debuffOverlay: Container | null = null;

  constructor(public readonly card: Card) {
    super();
    const w = CARD_W, h = CARD_H;
    const rankless = isRankless(card);
    const color = rankless ? 0xd8d0e8 : SUIT_COLORS[card.suit];
    const sym = SUIT_SYMBOLS[card.suit];
    const rl = rankLabel(card.rank);
    const faceColor = card.enhancement ? ENHANCEMENT_COLORS[card.enhancement] ?? C.cardFace : C.cardFace;

    const shadow = new Graphics().roundRect(-w / 2 + 3, -h / 2 + 6, w, h, 10).fill({ color: 0x000000, alpha: 0.35 });
    const body = new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 10).fill(faceColor).stroke({ width: 3, color: C.cardEdge })
      .roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 6).stroke({ width: 1.5, color, alpha: 0.35 });
    this.face.addChild(shadow, body);

    const style = { fontFamily: FONT, fontWeight: '900' as const, fill: color };
    if (rankless) {
      const t = new Text({ text: '◆', style: { ...style, fontSize: 58 } });
      t.anchor.set(0.5);
      t.y = -8;
      this.face.addChild(t);
    } else {
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
      this.face.addChild(corner(0), corner(Math.PI), center);
    }

    // Enhancement Name unten
    if (card.enhancement && ENHANCEMENTS[card.enhancement]) {
      const tag = new Text({
        text: ENHANCEMENTS[card.enhancement].name,
        style: { fontFamily: FONT, fontSize: 13, fontWeight: '800', fill: rankless ? 0xe8e0f8 : C.cardEdge },
      });
      tag.anchor.set(0.5);
      tag.y = h / 2 - 34;
      this.face.addChild(tag);
    }
    // Seal als Siegelkreis rechts
    if (card.seal && SEALS[card.seal]) {
      const sc = SEAL_COLORS[card.seal] ?? C.accent;
      const seal = new Graphics().circle(w / 2 - 16, 4, 11).fill(sc).stroke({ width: 2, color: 0xffffff, alpha: 0.7 });
      this.face.addChild(seal);
    }
    // Edition als leuchtender Rahmen
    if (card.edition && EDITIONS[card.edition]) {
      const ec = EDITION_COLORS[card.edition] ?? C.accent;
      const glow = new Graphics()
        .roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 12).stroke({ width: 5, color: ec, alpha: 0.9 })
        .roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 8).stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
      this.face.addChild(glow);
      const fx = editionOverlay(card.edition, w, h, 10);
      if (fx) this.face.addChild(fx);
    }

    this.addChild(this.face);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  /** Geschwächte Karten (Boss) werden abgedunkelt und durchgestrichen. */
  setDebuffed(v: boolean) {
    if (v === !!this.debuffOverlay) return;
    if (!v) {
      this.debuffOverlay?.destroy({ children: true });
      this.debuffOverlay = null;
      return;
    }
    const o = new Container();
    o.addChild(new Graphics().roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10).fill({ color: 0x1b1530, alpha: 0.55 }));
    const x = new Text({ text: '✕', style: { fontFamily: FONT, fontSize: 64, fontWeight: '900', fill: 0xff4d5e } });
    x.anchor.set(0.5);
    x.alpha = 0.85;
    o.addChild(x);
    this.face.addChild(o);
    this.debuffOverlay = o;
  }
}

export function cardBack(color: number = C.cardBack): Container {
  const c = new Container();
  const w = CARD_W, h = CARD_H;
  const g = new Graphics()
    .roundRect(-w / 2 + 3, -h / 2 + 6, w, h, 10).fill({ color: 0x000000, alpha: 0.35 })
    .roundRect(-w / 2, -h / 2, w, h, 10).fill(color).stroke({ width: 3, color: C.cardEdge })
    .roundRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 6).stroke({ width: 2, color: 0xffffff, alpha: 0.35 });
  for (let i = -3; i <= 3; i++) {
    g.moveTo(-w / 2 + 14, i * 18).lineTo(0, i * 18 - 30).lineTo(w / 2 - 14, i * 18).stroke({ width: 2, color: 0xffffff, alpha: 0.12 });
  }
  c.addChild(g);
  return c;
}
