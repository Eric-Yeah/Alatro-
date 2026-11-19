import { Container, Graphics, Text } from 'pixi.js';
import { CONSUMABLE_BY_ID, type ConsumableType } from '../data/consumables';
import { C, CONSUMABLE_COLORS, FONT_BODY } from './theme';

export const CONSUMABLE_W = 104;
export const CONSUMABLE_H = 140;

/** Zeichnet das Symbol des Typs: Stern, Kolben oder Mond */
function symbol(type: ConsumableType, cy: number): Graphics {
  const g = new Graphics();
  if (type === 'sternbild') {
    g.star(0, cy, 5, 24, 11).fill({ color: 0xffffff, alpha: 0.9 });
    g.circle(-30, cy + 14, 3).fill({ color: 0xffffff, alpha: 0.6 });
    g.circle(30, cy - 16, 2.5).fill({ color: 0xffffff, alpha: 0.6 });
  } else if (type === 'elixier') {
    g.roundRect(-7, cy - 28, 14, 18, 3).fill({ color: 0xffffff, alpha: 0.9 });
    g.circle(0, cy + 6, 21).fill({ color: 0xffffff, alpha: 0.9 });
    g.circle(0, cy + 8, 13).fill({ color: CONSUMABLE_COLORS.elixier, alpha: 0.9 });
  } else {
    g.circle(0, cy, 24).fill({ color: 0xffffff, alpha: 0.9 });
    g.circle(11, cy - 5, 21).fill(CONSUMABLE_COLORS.omen);
    g.circle(-30, cy - 20, 2.5).fill({ color: 0xffffff, alpha: 0.6 });
  }
  return g;
}

/** Ein Consumable als Karte (Slot, Shop, Pack). */
export class ConsumableView extends Container {
  selected = false;

  constructor(public readonly defId: string) {
    super();
    const def = CONSUMABLE_BY_ID[defId];
    const color = CONSUMABLE_COLORS[def.type];
    const w = CONSUMABLE_W, h = CONSUMABLE_H;
    const artH = h - 50;
    const g = new Graphics()
      .roundRect(-w / 2 + 3, -h / 2 + 6, w, h, 10).fill({ color: 0x000000, alpha: 0.35 })
      .roundRect(-w / 2, -h / 2, w, h, 10).fill(C.cardFace).stroke({ width: 3, color: C.cardEdge })
      .roundRect(-w / 2 + 7, -h / 2 + 7, w - 14, artH, 6).fill(color);
    const art = symbol(def.type, -h / 2 + 7 + artH / 2);
    const name = new Text({
      text: def.name,
      style: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '800', fill: C.cardEdge, align: 'center', wordWrap: true, wordWrapWidth: w - 8 },
    });
    name.anchor.set(0.5);
    name.y = h / 2 - 22;
    // lange Namen (z. B. Alchemistentisch) verkleinern statt am Kartenrand abzuschneiden
    if (name.width > w - 8) name.scale.set((w - 8) / name.width);
    this.addChild(g, art, name);
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  /** Auswahl Rahmen */
  setSelected(v: boolean) {
    this.selected = v;
    this.getChildByLabel('sel')?.destroy();
    if (!v) return;
    const f = new Graphics().roundRect(-CONSUMABLE_W / 2 - 4, -CONSUMABLE_H / 2 - 4, CONSUMABLE_W + 8, CONSUMABLE_H + 8, 12).stroke({ width: 5, color: C.money });
    f.label = 'sel';
    this.addChild(f);
  }
}
