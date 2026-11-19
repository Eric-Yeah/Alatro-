import { Container, Graphics, Text } from 'pixi.js';
import type { Suit } from '../core/cards';
import { SUIT_SYMBOLS } from '../data/cards';
import { HOME_TITLE as T } from '../data/homeTitle';
import { sfx } from './audio';
import { CARD_H, CARD_W } from './CardView';
import { C, FONT_BODY, FONT_TITLE, STYLE, SUIT_COLORS } from './theme';
import { easeInOutCubic, easeOutBack, easeOutCubic, loop, tween, wait } from './tween';
import { label } from './widgets';

/** Vorderseite: Buchstabe in der Farbe der Suit, Suit Zeichen in zwei Ecken */
function cardFront(ch: string, suit: Suit): Container {
  const w = CARD_W, h = CARD_H;
  const color = SUIT_COLORS[suit];
  const c = new Container();
  c.addChild(new Graphics()
    .roundRect(-w / 2 + 4, -h / 2 + 6, w, h, 10).fill(STYLE.shadowColor)
    .roundRect(-w / 2, -h / 2, w, h, 10).fill(C.cardFace).stroke({ width: 3, color: C.cardEdge })
    .roundRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 6).stroke({ width: 1.5, color, alpha: 0.35 }));
  const letter = label(ch, T.letterSize, color, { dropShadow: false, fontFamily: FONT_TITLE });
  letter.y = 4;
  c.addChild(letter);
  for (const rot of [0, Math.PI]) {
    const pip = new Text({ text: SUIT_SYMBOLS[suit], style: { fontFamily: FONT_BODY, fontWeight: '900', fontSize: T.pipSize, fill: color } });
    pip.anchor.set(0.5);
    pip.position.set(rot ? w / 2 - 17 : -w / 2 + 17, rot ? h / 2 - 17 : -h / 2 + 17);
    pip.rotation = rot;
    c.addChild(pip);
  }
  return c;
}

/** Rückseite: Kartenrücken mit goldenem Vierzackstern */
function cardBackStar(): Container {
  const w = CARD_W, h = CARD_H;
  const c = new Container();
  const star: number[] = [];
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? T.backStarOuter : T.backStarInner;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    star.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.addChild(new Graphics()
    .roundRect(-w / 2 + 4, -h / 2 + 6, w, h, 10).fill(STYLE.shadowColor)
    .roundRect(-w / 2, -h / 2, w, h, 10).fill(C.cardBack).stroke({ width: 3, color: C.cardEdge })
    .roundRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 6).stroke({ width: 2, color: 0xffffff, alpha: 0.6 })
    .poly(star).fill(C.money).stroke({ width: 2, color: STYLE.shadowColor }));
  return c;
}

interface TitleCard {
  front: Container;
  back: Container;
}

/**
 * Titel ALATRO: sechs Karten, die beim Öffnen des Home Bildschirms nacheinander hingeworfen werden.
 * Berühren hebt eine Karte an, Antippen dreht alle um (Rücken mit Stern) und wieder zurück.
 * Der Ursprung liegt in der Mitte der Kartenreihe.
 */
export function buildTitleCards(): Container {
  const root = new Container();
  const n = T.letters.length;
  const cards: TitleCard[] = [];
  let flipped = false;
  let busy = false;

  const flipAll = async () => {
    if (busy) return;
    busy = true;
    flipped = !flipped;
    await Promise.all(cards.map(async (card, i) => {
      await wait(i * T.flipStaggerMs);
      sfx.draw();
      await tween(flipped ? card.front : card.back, { 'scale.x': 0 }, T.flipMs, easeInOutCubic);
      await tween(flipped ? card.back : card.front, { 'scale.x': 1 }, T.flipMs, easeOutCubic);
    }));
    busy = false;
  };

  T.letters.forEach((l, i) => {
    const slot = new Container();
    const lift = new Container();
    const front = cardFront(l.ch, l.suit);
    const back = cardBackStar();
    back.scale.x = 0;
    lift.addChild(front, back);
    slot.addChild(lift);
    cards.push({ front, back });

    const x = (i - (n - 1) / 2) * T.spacing;
    slot.position.set(x, l.dy + T.dealFromY);
    slot.rotation = l.rot + T.dealFromRot;
    slot.alpha = 0;

    slot.eventMode = 'static';
    slot.cursor = 'pointer';
    slot.on('pointerover', () => tween(lift, { y: -T.hoverLift }, T.hoverMs, easeOutBack));
    slot.on('pointerout', () => tween(lift, { y: 0 }, T.hoverMs, easeOutCubic));
    slot.on('pointertap', flipAll);
    root.addChild(slot);

    // Hinwerfen, danach ruhig wiegen
    wait(i * T.dealStaggerMs).then(() => {
      if (slot.destroyed) return;
      sfx.draw();
      tween(slot, { y: l.dy, rotation: l.rot, alpha: 1 }, T.dealMs, easeOutBack).then(() => {
        if (slot.destroyed) return;
        wait(i * T.swayStaggerMs).then(() => loop(slot, 'rotation', l.rot - T.swayAngle, l.rot + T.swayAngle, T.swayMs));
      });
    });
  });

  return root;
}
