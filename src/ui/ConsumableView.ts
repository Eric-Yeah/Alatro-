import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { CONSUMABLE_BY_ID } from '../data/consumables';
import { CBAND_H, CBAND_Y, CFOOT_H, CFOOT_Y, CONS_TRAY, CT_BAND_TEXT, CT_H, CT_SCALE, CT_W, RARE_CONSUMABLE_IDS, RARE_CONSUMABLE_TYPES, CONSUMABLE_FRAMES } from '../data/consumableArt';
import { IDLE_FX } from '../data/artFx';
import { hashString } from '../core/rng';
import { addShimmer, attachPop } from './artFx';
import { attachFloat } from './cardMotion';
import { consumableTexture } from './consumableArt';
import { C, FONT_BODY, fmt, fmtMult } from './theme';
import { COLORS } from './richText';
import { levelUpGain } from '../core/runInfo';
import { LEVEL_UP_CARD } from '../data/deckView';
import { tween, easeOutBack } from './tween';

export const CONSUMABLE_W = CT_W * CT_SCALE;
export const CONSUMABLE_H = CT_H * CT_SCALE;

let nextSeed = 0;

/** Ein Consumable als Karte (Slot, Shop, Pack): Pixel Art Kachel mit Zierrahmen je Art, Name im Titelband. */
export class ConsumableView extends Container {
  selected = false;
  /** Innerer Container (für den Aufprall, auch wenn ein Elternobjekt die Berührung auffängt) */
  readonly body = new Container();
  /** Schwebe Hülle um body (body selbst gehört dem Aufprall beim Berühren) */
  private readonly floater = new Container();
  private readonly nameText: Text;
  private readonly fullName: string;
  /** Maßstab in der Leiste (1 = volle Größe), darunter wird der Name gekürzt */
  private compact = 1;
  private hovering = false;
  private restZ = 0;
  /** Zuwachs eines Sternbilds in der Fußleiste (Chips blau, Mult rot), nur bei ausreichendem Maßstab sichtbar */
  private foot: Container | null = null;

  /** float: leichtes Schweben, 'shop': etwas ruhiger (Shop und Pack Auswahl) */
  constructor(public readonly defId: string, float: boolean | 'shop' = true) {
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
    this.foot = this.buildFoot(defId);
    if (this.foot) this.body.addChild(this.foot);
    // seltene Karten funkeln leicht und bekommen Glanzstreifen
    if (RARE_CONSUMABLE_TYPES.has(def.type) || RARE_CONSUMABLE_IDS.has(defId)) {
      addShimmer(this.body, w - 8, h - 8, IDLE_FX.sparksCard, hashString(defId), true, 0xffffff, 8);
    }
    this.floater.addChild(this.body);
    this.addChild(this.floater);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    // Phase aus der Vorlage plus laufender Nummer, damit zwei gleiche Consumables nicht im Gleichschritt schweben
    if (float) attachFloat(this.floater, hashString(defId) + nextSeed++, float === 'shop' ? 'shop' : 'consumable');
    attachPop(this, this.body, {
      hoverScale: () => (this.compact < 1 ? CONS_TRAY.hoverScale / this.compact : undefined),
      always: () => this.compact < 1,
      onHover: (on) => {
        if (this.compact >= 1) return;
        this.hovering = on;
        this.showFoot();
        if (on) { this.restZ = this.zIndex; this.zIndex = 100; } else this.zIndex = this.restZ;
        this.fitName();
      },
    });
  }

  /** Zeile "+15 | +1" in der Fußleiste eines Sternbilds, links Chips, rechts Mult, das Zeichen der Art bleibt in der Mitte. */
  private buildFoot(defId: string): Container | null {
    const gain = levelUpGain(defId);
    if (!gain) return null;
    const c = new Container();
    const y = -CONSUMABLE_H / 2 + (CFOOT_Y + CFOOT_H / 2) * CT_SCALE;
    const mk = (text: string, color: number, side: -1 | 1) => {
      const t = new Text({ text, style: { fontFamily: FONT_BODY, fontSize: LEVEL_UP_CARD.font, fontWeight: '900', fill: color } });
      t.anchor.set(side < 0 ? 1 : 0, 0.5);
      t.position.set(side * LEVEL_UP_CARD.gap, y);
      return t;
    };
    // Dunkler Grund unter den Zahlen, damit die Zierlinien der Fußleiste sie nicht stören
    const back = new Graphics();
    const band = CONSUMABLE_FRAMES[CONSUMABLE_BY_ID[defId].type].band;
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? -LEVEL_UP_CARD.backW - LEVEL_UP_CARD.backGap : LEVEL_UP_CARD.backGap;
      back.rect(x0, y - LEVEL_UP_CARD.backH / 2, LEVEL_UP_CARD.backW, LEVEL_UP_CARD.backH).fill(band);
    }
    c.addChild(back, mk(`+${fmt(gain.chips)}`, COLORS.dark.chips, -1), mk(`+${fmtMult(gain.mult)}`, COLORS.dark.mult, 1));
    return c;
  }

  /** Fußzeile nur zeigen, wenn die Karte groß genug ist (in der verkleinerten Leiste nur beim Berühren) */
  private showFoot() {
    if (this.foot) this.foot.visible = this.compact >= LEVEL_UP_CARD.minScale || this.hovering;
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
    this.showFoot();
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
