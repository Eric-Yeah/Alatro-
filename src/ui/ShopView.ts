import { Container, Graphics, Text } from 'pixi.js';
import { canBuyCard, PACK_BY_ID, rerollCost, VOUCHER_BY_ID } from '../core/game';
import { getJoker, jokerDescription } from '../core/jokers';
import type { RunState } from '../core/run';
import { EDITIONS } from '../data/modifiers';
import { JokerView } from './JokerView';
import { C, FONT, RARITY_COLORS, RARITY_NAMES } from './theme';
import { easeOutBack, tween } from './tween';
import { Button, label, panel } from './widgets';

export interface ShopCallbacks {
  buyCard(index: number): void;
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
  c.addChild(new Graphics().roundRect(-w / 2, -16, w, 32, 10).fill(0x15111f).stroke({ width: 2, color: affordable ? C.money : 0x4a3f6b }), t);
  return c;
}

function smallText(text: string, width: number, size = 16, color = C.text): Text {
  const t = new Text({ text, style: { fontFamily: FONT, fontSize: size, fontWeight: '700', fill: color, wordWrap: true, wordWrapWidth: width, align: 'center' } });
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
    const def = getJoker(item.defId)!;
    const jv = new JokerView({ uid: -1, defId: item.defId, vars: {}, edition: item.edition });
    jv.position.set(x, 130);
    jv.eventMode = 'none';
    const tag = priceTag(item.price, run.money >= item.price);
    tag.position.set(x, 40);
    const rar = new Graphics().roundRect(x - 52, 210, 104, 22, 11).fill(RARITY_COLORS[def.rarity]);
    const rarT = label(RARITY_NAMES[def.rarity], 13, 0xffffff);
    rarT.position.set(x, 221);
    const desc = smallText(jokerDescription(def) + (item.edition ? `\n${EDITIONS[item.edition].name}: ${EDITIONS[item.edition].description}` : ''), spacing - 12, 15);
    desc.position.set(x, 240);
    const buy = new Button('Kaufen', 120, 46, C.green, () => cb.buyCard(i), 20);
    buy.position.set(x, 345);
    buy.enabled = canBuyCard(run, i);
    root.addChild(jv, tag, rar, rarT, desc, buy);
  });

  // Voucher
  const vx = 920;
  const vTitle = label('Voucher', 18, C.textDim);
  vTitle.position.set(vx, 40);
  root.addChild(vTitle);
  if (shop.voucher) {
    const v = VOUCHER_BY_ID[shop.voucher.voucherId];
    const card = new Container();
    card.position.set(vx, 140);
    card.addChild(
      new Graphics()
        .roundRect(-56, -70, 112, 140, 12).fill(0x3a2a5e).stroke({ width: 3, color: C.money })
        .star(0, -18, 6, 26, 12).fill({ color: C.money, alpha: 0.85 }),
    );
    const vn = smallText(v.name, 100, 15, 0xffffff);
    vn.position.set(0, 26);
    card.addChild(vn);
    const desc = smallText(v.description, 180, 15);
    desc.position.set(vx, 222);
    const tag = priceTag(shop.voucher.price, run.money >= shop.voucher.price);
    tag.position.set(vx, 290);
    const buy = new Button('Einlösen', 140, 46, C.green, () => cb.buyVoucher(), 20);
    buy.position.set(vx, 345);
    buy.enabled = run.money >= shop.voucher.price;
    root.addChild(card, desc, tag, buy);
  } else {
    const none = label('ausverkauft', 18, C.textDim);
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
      .roundRect(x - 100, 440, 200, 92, 12).fill(color).stroke({ width: 3, color: 0xffffff, alpha: 0.4 })
      .roundRect(x - 92, 448, 184, 30, 8).fill({ color: 0xffffff, alpha: 0.12 });
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
