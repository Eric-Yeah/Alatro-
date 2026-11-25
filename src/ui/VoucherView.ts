import { Container, Sprite, Text, type NineSliceSprite, type Texture } from 'pixi.js';
import { IDLE_FX } from '../data/artFx';
import { VOUCHER_ART as V, VOUCHER_SCALE } from '../data/voucherArt';
import { SHADOW_INSET, TILE_DEPTH, VOUCHER_GLOW } from '../data/tileDepth';
import { addShimmer, attachPop, pixTexture } from './artFx';
import { setShadowLift } from './depth';
import { FONT_BODY } from './theme';
import { liftTo, tileBody, tileBounds, tileGlow, tileSheen, tileShadow } from './tileDepth';
import { voucherTilePix } from './voucherTile';

export const VOUCHER_W = V.w * VOUCHER_SCALE;
export const VOUCHER_H = V.h * VOUCHER_SCALE;

let tex: Texture | null = null;
/** Eckenradius des Tickets in Spielfeld Einheiten (4 Bildpunkte) */
const VOUCHER_R = 4 * VOUCHER_SCALE;

/** Voucher als Pixel Art Ticket mit Kristallkugel, Namen im Band, Funkeln und Aufprall beim Berühren. */
export class VoucherView extends Container {
  readonly body = new Container();
  private readonly shadow: NineSliceSprite;
  private _lift = 0;

  /** Abhebung 0 bis 1: der Schatten wächst, wenn das Ticket steigt (Maus darüber) */
  get lift() { return this._lift; }
  set lift(v: number) {
    this._lift = v;
    if (!this.destroyed) setShadowLift(this.shadow, v);
  }

  constructor(name: string) {
    super();
    if (!tex) tex = pixTexture(voucherTilePix());
    // Weicher Schatten und goldene Leuchtkante unter dem Ticket, außerhalb des Bodys
    this.shadow = tileShadow(VOUCHER_W, VOUCHER_H, { radius: VOUCHER_R, inset: SHADOW_INSET.voucher });
    this.addChild(tileGlow(VOUCHER_W, VOUCHER_H, VOUCHER_GLOW, VOUCHER_R), this.shadow);
    // Körper: dunkler Streifen unter dem Ticket
    const bodyStrip = tileBody(tex, VOUCHER_SCALE);
    bodyStrip.tint = V.dark;
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
    this.body.addChild(bodyStrip, card, tileSheen(-VOUCHER_W / 2 + 12, -VOUCHER_H / 2 + 12, VOUCHER_W - 24, VOUCHER_H * 0.2, 8, 1), head, t);
    addShimmer(this.body, VOUCHER_W - 16, VOUCHER_H - 16, IDLE_FX.sparksCard + 1, 77, true, 0xffffff, 8);
    this.addChild(this.body);
    this.boundsArea = tileBounds(VOUCHER_W, VOUCHER_H, TILE_DEPTH.bodyDy);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    attachPop(this, this.body, { onHover: (on) => liftTo(this, on ? 1 : 0) });
  }
}
