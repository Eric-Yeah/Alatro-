import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { CONSUMABLE_BY_ID } from '../data/consumables';
import { CBAND_H, CBAND_Y, CT_BAND_TEXT, CT_H, CT_SCALE, CT_W, RARE_CONSUMABLE_IDS, RARE_CONSUMABLE_TYPES } from '../data/consumableArt';
import { IDLE_FX } from '../data/artFx';
import { hashString } from '../core/rng';
import { addShimmer, attachPop } from './artFx';
import { consumableTexture } from './consumableArt';
import { C, FONT_BODY } from './theme';

export const CONSUMABLE_W = CT_W * CT_SCALE;
export const CONSUMABLE_H = CT_H * CT_SCALE;

/** Ein Consumable als Karte (Slot, Shop, Pack): Pixel Art Kachel mit Zierrahmen je Art, Name im Titelband. */
export class ConsumableView extends Container {
  selected = false;
  private readonly body = new Container();

  constructor(public readonly defId: string) {
    super();
    const def = CONSUMABLE_BY_ID[defId];
    const w = CONSUMABLE_W, h = CONSUMABLE_H;
    // Schatten in der Form der Kachel
    const shadow = new Sprite(consumableTexture(defId));
    shadow.anchor.set(0.5);
    shadow.scale.set(CT_SCALE);
    shadow.tint = 0x000000;
    shadow.alpha = 0.35;
    shadow.position.set(3, 6);
    const tile = new Sprite(consumableTexture(defId));
    tile.anchor.set(0.5);
    tile.scale.set(CT_SCALE);
    const name = new Text({
      text: def.name,
      style: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '800', fill: CT_BAND_TEXT, align: 'center' },
    });
    name.anchor.set(0.5);
    name.y = -h / 2 + (CBAND_Y + CBAND_H / 2) * CT_SCALE;
    // lange Namen (z. B. Alchemistentisch) verkleinern statt über das Titelband zu laufen
    const maxW = w - 22;
    if (name.width > maxW) name.scale.set(maxW / name.width);
    this.body.addChild(shadow, tile, name);
    // seltene Karten funkeln leicht und bekommen Glanzstreifen
    if (RARE_CONSUMABLE_TYPES.has(def.type) || RARE_CONSUMABLE_IDS.has(defId)) {
      addShimmer(this.body, w - 8, h - 8, IDLE_FX.sparksCard, hashString(defId), true, 0xffffff, 8);
    }
    this.addChild(this.body);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    attachPop(this, this.body);
  }

  /** Auswahl Rahmen */
  setSelected(v: boolean) {
    this.selected = v;
    this.body.getChildByLabel('sel')?.destroy();
    if (!v) return;
    const f = new Graphics().roundRect(-CONSUMABLE_W / 2 - 4, -CONSUMABLE_H / 2 - 4, CONSUMABLE_W + 8, CONSUMABLE_H + 8, 12).stroke({ width: 5, color: C.money });
    f.label = 'sel';
    this.body.addChild(f);
  }
}
