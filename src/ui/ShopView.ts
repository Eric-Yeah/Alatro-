import { Container, Graphics, Text } from 'pixi.js';
import { canBuyAndUse, canBuyCard, PACK_BY_ID, rerollCost, VOUCHER_BY_ID } from '../core/game';
import { getJoker, jokerDescription } from '../core/jokers';
import type { RunState } from '../core/run';
import { CONSUMABLE_BY_ID, CONSUMABLE_TYPE_NAMES } from '../data/consumables';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { CardView } from './CardView';
import { ConsumableView } from './ConsumableView';
import { JokerView } from './JokerView';
import { C, CONSUMABLE_COLORS, FONT_BODY, RARITY_COLORS, RARITY_NAMES } from './theme';
import { easeOutBack, tween } from './tween';
import { Button, label, panel } from './widgets';

export interface ShopCallbacks {
  buyCard(index: number): void;
  buyAndUse(index: number): void;
  buyPack(index: number): void;
  buyVoucher(): void;
  reroll(): void;
  nextRound(): void;
}

export const SHOP_X = 380;
export const SHOP_Y = 250;
export const SHOP_W = 1040;
export const SHOP_H = 610;

function priceTag(price: number, affordable: boolean): Container {
  const c = new Container();
  const t = label(price === 0 ? 'Gratis' : `$${price}`, 22, affordable ? C.money : 0x8a7f99);
  const w = Math.max(56, t.width + 20);
  c.addChild(new Graphics().roundRect(-w / 2, -16, w, 32, 10).fill(0x141d29).stroke({ width: 2, color: affordable ? C.money : 0x3b5068 }), t);
  return c;
}

function smallText(text: string, width: number, size = 16, color = C.text): Text {
  const t = new Text({ text, style: { fontFamily: FONT_BODY, fontSize: size, fontWeight: '700', fill: color, wordWrap: true, wordWrapWidth: width, align: 'center' } });
  t.anchor.set(0.5, 0);
  return t;
}

/** Baut die Shop Szene (Briefing 9.1): Next Round, Reroll, Karten Slots, Voucher, Packs. */
export function buildShop(run: RunState, cb: ShopCallbacks, animate = true): Container {
  const shop = run.shop!;
  const root = new Container();
  root.position.set(SHOP_X, SHOP_Y);
  root.addChild(panel(SHOP_W, SHOP_H, C.panelDark, 20));

  const title = label('SHOP', 40, C.money, { letterSpacing: 6 });
  title.position.set(110, 46);
  root.addChild(title);

  const next = new Button('Next Round', 180, 84, C.mult, () => cb.nextRound(), 24);
  next.position.set(110, 150);
  const cost = rerollCost(run);
  const rr = new Button(`Reroll $${cost}`, 180, 84, C.green, () => cb.reroll(), 24);
  rr.position.set(110, 254);
  rr.enabled = run.money >= cost;
  root.addChild(next, rr);
  if (shop.freeRerolls > 0) {
    const fr = label(`${shop.freeRerolls} gratis`, 16, C.green);
    fr.position.set(110, 310);
    root.addChild(fr);
  }

  // Karten Slots
  const slotsX = 260;
  const slotsW = 560;
  const n = shop.cards.length;
  const spacing = Math.min(170, slotsW / Math.max(n, 1));
  shop.cards.forEach((item, i) => {
    const x = slotsX + spacing / 2 + i * spacing;
    if (!item) {
      const empty = new Graphics().roundRect(x - 52, 60, 104, 140, 10).stroke({ width: 2, color: C.panelLine, alpha: 0.6 });
      root.addChild(empty);
      return;
    }
    const tag = priceTag(item.price, run.money >= item.price);
    tag.position.set(x, 40);
    root.addChild(tag);
    const badge = (text: string, color: number) => {
      const g = new Graphics().roundRect(x - 52, 210, 104, 22, 11).fill(color);
      const t = label(text, 13, 0xffffff);
      t.position.set(x, 221);
      root.addChild(g, t);
    };
    const buyButton = () => {
      const buy = new Button('Kaufen', 120, 46, C.green, () => cb.buyCard(i), 20);
      buy.position.set(x, 345);
      buy.enabled = canBuyCard(run, i);
      root.addChild(buy);
    };

    if (item.kind === 'joker') {
      const def = getJoker(item.defId)!;
      const jv = new JokerView({ uid: -1, defId: item.defId, vars: {}, edition: item.edition });
      jv.position.set(x, 130);
      jv.eventMode = 'none';
      badge(RARITY_NAMES[def.rarity], RARITY_COLORS[def.rarity]);
      const desc = smallText(jokerDescription(def) + (item.edition ? `\n${EDITIONS[item.edition].name}: ${EDITIONS[item.edition].description}` : ''), spacing - 12, 15);
      desc.position.set(x, 240);
      root.addChild(jv, desc);
      buyButton();
    } else if (item.kind === 'consumable') {
      const def = CONSUMABLE_BY_ID[item.defId];
      const cv = new ConsumableView(item.defId);
      cv.position.set(x, 130);
      cv.eventMode = 'none';
      badge(CONSUMABLE_TYPE_NAMES[def.type], CONSUMABLE_COLORS[def.type]);
      const desc = smallText(def.description, spacing - 12, 15);
      desc.position.set(x, 240);
      root.addChild(cv, desc);
      if (!def.targets) {
        // Kaufen in den Slot oder Kaufen und sofort Nutzen, die Breite passt sich dem Abstand an
        const bw = Math.min(80, (spacing - 8) / 2);
        const fs = bw < 70 ? 13 : 16;
        const buy = new Button('Kaufen', bw, 46, C.green, () => cb.buyCard(i), fs);
        buy.position.set(x - bw / 2 - 2, 345);
        buy.enabled = canBuyCard(run, i);
        const use = new Button('Nutzen', bw, 46, C.chips, () => cb.buyAndUse(i), fs);
        use.position.set(x + bw / 2 + 2, 345);
        use.enabled = canBuyAndUse(run, i);
        root.addChild(buy, use);
      } else {
        buyButton();
      }
    } else {
      const cv = new CardView(item.card);
      cv.scale.set(0.9);
      cv.position.set(x, 130);
      cv.eventMode = 'none';
      badge('Spielkarte', 0xf2711c);
      const parts: string[] = [];
      if (item.card.enhancement) parts.push(`${ENHANCEMENTS[item.card.enhancement].name}: ${ENHANCEMENTS[item.card.enhancement].description}`);
      if (item.card.seal) parts.push(`${SEALS[item.card.seal].name}: ${SEALS[item.card.seal].description}`);
      if (item.card.edition) parts.push(`${EDITIONS[item.card.edition].name}: ${EDITIONS[item.card.edition].description}`);
      const desc = smallText(parts.join('\n') || 'Kommt ins Deck', spacing - 12, 15);
      desc.position.set(x, 240);
      root.addChild(cv, desc);
      buyButton();
    }
  });

  // Voucher
  const vx = 920;
  if (shop.voucher) {
    const v = VOUCHER_BY_ID[shop.voucher.voucherId];
    const card = new Container();
    card.position.set(vx, 140);
    card.addChild(
      new Graphics()
        .roundRect(-56, -70, 112, 140, 12).fill(0x24407a).stroke({ width: 3, color: C.money })
        .star(0, -18, 6, 26, 12).fill({ color: C.money, alpha: 0.85 }),
    );
    const vn = smallText(v.name, 100, 15, 0xffffff);
    vn.position.set(0, 26);
    card.addChild(vn);
    const badge = new Graphics().roundRect(vx - 52, 210, 104, 22, 11).fill(C.money);
    const badgeT = label('Voucher', 13, 0x2b2540);
    badgeT.position.set(vx, 221);
    const desc = smallText(v.description, 190, 15);
    desc.position.set(vx, 240);
    const tag = priceTag(shop.voucher.price, run.money >= shop.voucher.price);
    tag.position.set(vx, 40);
    const buy = new Button('Einlösen', 140, 46, C.green, () => cb.buyVoucher(), 20);
    buy.position.set(vx, 345);
    buy.enabled = run.money >= shop.voucher.price;
    root.addChild(card, badge, badgeT, desc, tag, buy);
  } else {
    const none = label('Voucher ausverkauft', 18, C.textDim);
    none.position.set(vx, 140);
    root.addChild(none);
  }

  // Booster Packs
  const packTitle = label('Booster Packs', 18, C.textDim);
  packTitle.position.set(520, 410);
  root.addChild(packTitle);
  shop.packs.forEach((p, i) => {
    const x = 400 + i * 240;
    if (!p) {
      root.addChild(new Graphics().roundRect(x - 100, 440, 200, 140, 12).stroke({ width: 2, color: C.panelLine, alpha: 0.6 }));
      return;
    }
    const def = PACK_BY_ID[p.packId];
    const color = def.kind === 'joker' ? C.mult : C.chips;
    const box = new Graphics()
      .roundRect(x - 100, 440, 200, 92, 8).fill(color).stroke({ width: 3, color: C.panelLine });
    const name = label(def.name, 18, 0xffffff);
    name.position.set(x, 466);
    const info = label(`Wähle ${def.picks} aus ${def.choices}`, 15, 0xffffff, { fontWeight: '700' });
    info.position.set(x, 505);
    const tag = priceTag(p.price, run.money >= p.price);
    tag.position.set(x - 50, 560);
    const buy = new Button('Öffnen', 110, 42, C.green, () => cb.buyPack(i), 18);
    buy.position.set(x + 45, 560);
    buy.enabled = run.money >= p.price;
    root.addChild(box, name, info, tag, buy);
  });

  if (animate) {
    root.alpha = 0;
    root.y += 40;
    tween(root, { alpha: 1, y: SHOP_Y }, 260, easeOutBack);
  }
  return root;
}
