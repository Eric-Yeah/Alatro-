import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { CONSUMABLE_BY_ID } from '../data/consumables';
import { CBAND_H, CBAND_Y, CONS_TRAY, CT_BAND_TEXT, CT_H, CT_SCALE, CT_W, RARE_CONSUMABLE_IDS, RARE_CONSUMABLE_TYPES } from '../data/consumableArt';
import { IDLE_FX } from '../data/artFx';
import { hashString } from '../core/rng';
import { addShimmer, attachPop } from './artFx';
import { consumableTexture } from './consumableArt';
import { C, FONT_BODY } from './theme';
import { tween, easeOutBack } from './tween';

export const CONSUMABLE_W = CT_W * CT_SCALE;
export const CONSUMABLE_H = CT_H * CT_SCALE;

/** Ein Consumable als Karte (Slot, Shop, Pack): Pixel Art Kachel mit Zierrahmen je Art, Name im Titelband. */
export class ConsumableView extends Container {
  selected = false;
  /** Innerer Container (für den Aufprall, auch wenn ein Elternobjekt die Berührung auffängt) */
  readonly body = new Container();
  private readonly nameText: Text;
  private readonly fullName: string;
  /** Maßstab in der Leiste (1 = volle Größe), darunter wird der Name gekürzt */
  private compact = 1;
  private hovering = false;
  private restZ = 0;

  constructor(public readonly defId: string) {
    super();
    const def = CONSUMABLE_BY_ID[defId];
    const w = CONSUMABLE_W, h = CONSUMABLE_H;
    this.fullName = def.name;
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
    this.nameText = new Text({
      text: def.name,
      style: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '800', fill: CT_BAND_TEXT, align: 'center' },
    });
    this.nameText.anchor.set(0.5);
    this.nameText.y = -h / 2 + (CBAND_Y + CBAND_H / 2) * CT_SCALE;
    this.fitName();
    this.body.addChild(shadow, tile, this.nameText);
    // seltene Karten funkeln leicht und bekommen Glanzstreifen
    if (RARE_CONSUMABLE_TYPES.has(def.type) || RARE_CONSUMABLE_IDS.has(defId)) {
      addShimmer(this.body, w - 8, h - 8, IDLE_FX.sparksCard, hashString(defId), true, 0xffffff, 8);
    }
    this.addChild(this.body);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    attachPop(this, this.body, {
      hoverScale: () => (this.compact < 1 ? CONS_TRAY.hoverScale / this.compact : undefined),
      always: () => this.compact < 1,
      onHover: (on) => {
        if (this.compact >= 1) return;
        this.hovering = on;
        if (on) { this.restZ = this.zIndex; this.zIndex = 100; } else this.zIndex = this.restZ;
        this.fitName();
      },
    });
  }

  /** Name im Titelband: voll in voller Größe, in der Leiste gekürzt und mit fester scheinbarer Schriftgröße. */
  private fitName() {
    const t = this.nameText;
    const small = this.compact < 1 && !this.hovering;
    t.scale.set(1);
    if (!small) {
      t.text = this.fullName;
      t.style.fontSize = 13;
      const maxW = CONSUMABLE_W - 22;
      if (t.width > maxW) t.scale.set(maxW / t.width);
      return;
    }
    t.style.fontSize = CONS_TRAY.nameSize / this.compact;
    t.text = this.fullName;
    const maxW = CONSUMABLE_W - 18;
    // erst schrumpfen bis zur kleinsten Schrift, danach kürzen
    if (t.width > maxW) t.scale.set(Math.max(CONS_TRAY.nameSizeMin / CONS_TRAY.nameSize, maxW / t.width));
    let n = this.fullName.length;
    while (t.width > maxW && n > 3) {
      n--;
      t.text = `${this.fullName.slice(0, n)}\u2026`;
    }
  }

  /** Maßstab in der Leiste setzen (animiert), die Namen werden entsprechend gekürzt. */
  setCompact(scale: number, ms = 220) {
    this.compact = scale;
    this.fitName();
    void tween(this, { 'scale.x': scale, 'scale.y': scale }, ms, easeOutBack);
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
