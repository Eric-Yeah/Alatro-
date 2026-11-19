import { Container, Sprite, Text, type Texture } from 'pixi.js';
import { IDLE_FX } from '../data/artFx';
import { VOUCHER_ART as V, VOUCHER_SCALE } from '../data/voucherArt';
import { addShimmer, attachPop, pixTexture } from './artFx';
import { FONT_BODY } from './theme';
import { voucherTilePix } from './voucherTile';

export const VOUCHER_W = V.w * VOUCHER_SCALE;
export const VOUCHER_H = V.h * VOUCHER_SCALE;

let tex: Texture | null = null;

/** Voucher als Pixel Art Ticket mit Kristallkugel, Namen im Band, Funkeln und Aufprall beim Berühren. */
export class VoucherView extends Container {
  readonly body = new Container();

  constructor(name: string) {
    super();
    if (!tex) tex = pixTexture(voucherTilePix());
    const shadow = new Sprite(tex);
    shadow.anchor.set(0.5);
    shadow.scale.set(VOUCHER_SCALE);
    shadow.tint = 0x000000;
    shadow.alpha = 0.4;
    shadow.position.set(4, 8);
    const card = new Sprite(tex);
    card.anchor.set(0.5);
    card.scale.set(VOUCHER_SCALE);
    const head = new Text({ text: 'Voucher', style: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: '900', fill: 0x2b2540 } });
    head.anchor.set(0.5);
    head.y = -VOUCHER_H / 2 + (V.headY + V.headH / 2) * VOUCHER_SCALE;
    const t = new Text({
      text: name,
      style: { fontFamily: FONT_BODY, fontSize: 15, fontWeight: '800', fill: 0xfff3d1, align: 'center', wordWrap: true, wordWrapWidth: VOUCHER_W - 36, lineHeight: 16 },
    });
    t.anchor.set(0.5);
    t.y = -VOUCHER_H / 2 + (V.nameY + V.nameH / 2) * VOUCHER_SCALE;
    const maxH = (V.nameH - 3) * VOUCHER_SCALE;
    if (t.height > maxH) t.scale.set(maxH / t.height);
    if (t.width > VOUCHER_W - 30) t.scale.set(Math.min(t.scale.x, (VOUCHER_W - 30) / t.width));
    this.body.addChild(shadow, card, head, t);
    addShimmer(this.body, VOUCHER_W - 16, VOUCHER_H - 16, IDLE_FX.sparksCard + 1, 77, true, 0xffffff, 8);
    this.addChild(this.body);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    attachPop(this, this.body);
  }
}
