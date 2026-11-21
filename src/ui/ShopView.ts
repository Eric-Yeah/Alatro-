import { Container, Graphics, Rectangle, Ticker } from 'pixi.js';
import { SUIT_NAMES, isRankless, rankLabel } from '../core/cards';
import { canBuyAndUse, canBuyCard, PACK_BY_ID, rerollCost, VOUCHER_BY_ID } from '../core/game';
import { getJoker, jokerDescription } from '../core/jokers';
import { richText } from './richText';
import { t } from '../i18n';
import type { RunState } from '../core/run';
import { CONSUMABLE_BY_ID, CONSUMABLE_TYPE_NAMES } from '../data/consumables';
import { consumableDescription, levelUpPreview } from '../core/runInfo';
import { LEVEL_UP_VIEW } from '../data/deckView';
import { levelUpBlock } from './levelUpView';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { sfx } from './audio';
import { haptics } from './haptics';
import { CARD_H, CardView } from './CardView';
import { ConsumableView } from './ConsumableView';
import { PackView, packPixelSize } from './PackView';
import { attachPop } from './artFx';
import { VOUCHER_H, VOUCHER_W, VoucherView } from './VoucherView';
import { JokerView } from './JokerView';
import { C, CONSUMABLE_COLORS, RARITY_COLORS, RARITY_NAMES, ps, tipExtra } from './theme';
import { easeOutBack, tween, wait } from './tween';
import { Button, label, panel, wrapText } from './widgets';

export interface ShopCallbacks {
  buyCard(index: number): void;
  buyAndUse(index: number): void;
  buyPack(index: number): void;
  buyVoucher(): void;
  reroll(): void;
  nextRound(): void;
}

export const SHOP_X = 380;
export const SHOP_Y = 240;
export const SHOP_W = 1040;
export const SHOP_H = 700;

/** Layout (Koordinaten im Shop Panel) */
const L = {
  pad: 24,
  /** linke Spalte mit Next Round und Reroll */
  btnW: 190,
  btnH: 110,
  /** obere Ablage für Karten Slots */
  cardsX: 240,
  cardsY: 24,
  cardsW: 776,
  cardsH: 300,
  /** untere Reihe: Voucher und Packs */
  rowY: 344,
  rowH: 332,
  voucherW: 340,
  /** Höhe der Preis Fahne über einem Artikel */
  tagH: 32,
  /** so weit hebt sich ein angetippter Artikel */
  lift: 14,
  /** Karten Maße vor dem Skalieren (Joker, Consumable) */
  itemW: 104,
  itemH: 140,
  /** Leeres Fach für Packs (Normal Pack plus Rand), Jumbo und Mega ragen darüber hinaus */
  packSlotW: 144,
  packSlotH: 192,
  calloutW: 290,
};

const INSET = 0x141b27;
const INSET_LINE = 0x0b1018;
const SHOP_FRAME = 0xc8412f;

/** Preis Fahne: dunkles Schild mit Goldrand, sitzt mit der Unterkante auf dem Artikel. */
function priceTag(price: number, affordable: boolean): Container {
  const c = new Container();
  const txt = label(price === 0 ? t('Gratis') : `$${price}`, 24, affordable ? C.money : 0x8a7f99);
  const w = Math.max(60, txt.width + 26);
  const line = affordable ? C.money : 0x3b5068;
  c.addChild(
    new Graphics()
      .roundRect(-w / 2, -L.tagH + 4, w, L.tagH, 10).fill(0x1b2230).stroke({ width: 3, color: C.panelLine })
      .roundRect(-w / 2 + 3, -L.tagH + 7, w - 6, L.tagH - 6, 8).stroke({ width: 1.5, color: line, alpha: 0.9 }),
    txt,
  );
  txt.y = -L.tagH / 2 + 5;
  return c;
}

/** Vertiefte Ablage (dunkle Fläche mit Innenschatten), wie ein Fach im Shop. */
function inset(x: number, y: number, w: number, h: number): Graphics {
  return new Graphics()
    .roundRect(x, y, w, h, 14).fill(INSET).stroke({ width: 3, color: INSET_LINE })
    .roundRect(x + 3, y + 3, w - 6, 8, 5).fill({ color: 0x000000, alpha: 0.35 });
}

function emptySlot(x: number, y: number, w: number, h: number): Graphics {
  return new Graphics().roundRect(x - w / 2, y - h / 2, w, h, 10).stroke({ width: 2, color: 0x3b5068, alpha: 0.7 });
}

/** Zahlen des Leuchtschilds in der Seitenleiste */
const SIGN = { w: 330, h: 160, bulbStep: 22, blinkMs: 520 };

/**
 * Leuchtschild "SHOP" für die Seitenleiste: Rahmen mit Glühbirnen, die abwechselnd blinken.
 * Das Blinken läuft nur, solange das Schild sichtbar ist.
 */
export function buildShopSign(): Container {
  const { w, h } = SIGN;
  const sign = new Container();
  sign.addChild(
    new Graphics()
      .roundRect(0, 4, w, h, 12).fill(0x070b11)
      .roundRect(0, 0, w, h, 12).fill(0x8f2a28).stroke({ width: 3, color: C.panelLine })
      .roundRect(15, 15, w - 30, h - 30, 8).fill(0x151b27).stroke({ width: 3, color: C.panelLine })
      .roundRect(19, 19, w - 38, 6, 3).fill({ color: 0x000000, alpha: 0.35 }),
  );
  // Glühbirnen entlang des Rahmens, gerade und ungerade im Wechsel
  const pts: [number, number][] = [];
  for (let x = 14; x <= w - 14; x += SIGN.bulbStep) { pts.push([x, 7.5]); }
  for (let y = 7.5 + SIGN.bulbStep; y < h - 7.5; y += SIGN.bulbStep) { pts.push([w - 7.5, y]); }
  for (let x = w - 14; x >= 14; x -= SIGN.bulbStep) { pts.push([x, h - 7.5]); }
  for (let y = h - 7.5 - SIGN.bulbStep; y > 7.5; y -= SIGN.bulbStep) { pts.push([7.5, y]); }
  const frames = [new Graphics(), new Graphics()];
  frames.forEach((g, f) => {
    pts.forEach(([x, y], i) => {
      const on = i % 2 === f;
      g.circle(x, y, 5).fill(on ? 0xfff0c2 : 0x6b2220).stroke({ width: 1.5, color: on ? 0xffc85a : 0x4a1614 });
      if (on) g.circle(x, y, 8).fill({ color: 0xffd36b, alpha: 0.25 });
    });
  });
  frames[1].visible = false;
  sign.addChild(frames[0], frames[1]);

  const title = label('SHOP', 66, C.money, { letterSpacing: 6 });
  title.position.set(w / 2, 70);
  if (title.width > w - 70) title.scale.set((w - 70) / title.width);
  const sub = label(t('Rüste deinen Run auf!'), 20, C.cardFace);
  sub.position.set(w / 2, 122);
  if (sub.width > w - 60) sub.scale.set((w - 60) / sub.width);
  sign.addChild(title, sub);

  let acc = 0;
  let on = 0;
  Ticker.shared.add((tk) => {
    if (!sign.visible || sign.destroyed) return;
    acc += tk.deltaMS;
    if (acc < SIGN.blinkMs) return;
    acc = 0;
    on = 1 - on;
    frames[0].visible = on === 0;
    frames[1].visible = on === 1;
  });
  return sign;
}

/** Eine Aktion in der Detail Karte */
interface Action {
  text: string;
  color: number;
  enabled: boolean;
  run: () => void;
}

/** Inhalt der Detail Karte, die beim Antippen eines Artikels erscheint */
interface Detail {
  name: string;
  badge: string;
  badgeColor: number;
  badgeText?: number;
  desc: string;
  /** Zusatzblock unter der Beschreibung (z. B. Level up der Sternbilder), als Fabrik, weil die Karte mehrfach gebaut wird */
  extra?: () => Container;
  /** Hinweis, warum nicht gekauft werden kann */
  hint?: string;
  actions: Action[];
}

interface Slot {
  item: Container;
  homeY: number;
  /** Mitte des Artikels und halbe Höhe (für die Platzierung der Detail Karte) */
  x: number;
  top: number;
  bottom: number;
  dir: 'below' | 'above';
  detail: Detail;
}

/** Detail Karte. up = Karte sitzt oberhalb des Artikels, die Spitze zeigt dann nach unten. */
function buildCallout(d: Detail, tailX: number, up: boolean): { box: Container; h: number } {
  const w = L.calloutW + tipExtra();
  const box = new Container();
  const desc = richText(d.desc, w - 36, { size: ps(18), theme: 'light' });
  const extra = d.extra ? d.extra() : null;
  const hint = d.hint ? wrapText(d.hint, w - 36, ps(15), 0xa8324a) : null;
  desc.position.set(0, 82);
  const below = 82 + desc.height + (extra ? LEVEL_UP_VIEW.gap + extra.height : 0);
  if (extra) extra.position.set(0, 82 + desc.height + LEVEL_UP_VIEW.gap);
  if (hint) hint.position.set(0, below + 8);
  const h = below + (hint ? hint.height + 16 : 8) + 78;
  const bg = new Graphics()
    .poly(up ? [tailX - 14, h, tailX, h + 14, tailX + 14, h] : [tailX - 14, 0, tailX, -14, tailX + 14, 0]).fill(C.text).stroke({ width: 3, color: C.cardEdge })
    .roundRect(-w / 2, 5, w, h, 14).fill({ color: 0x000000, alpha: 0.4 })
    .roundRect(-w / 2, 0, w, h, 14).fill(C.text).stroke({ width: 3, color: C.cardEdge });
  bg.eventMode = 'static';
  const name = label(d.name, 24, C.cardEdge);
  name.position.set(0, 26);
  if (name.width > w - 30) name.scale.set((w - 30) / name.width);
  const badge = label(d.badge, 14, d.badgeText ?? 0xffffff);
  const bw = Math.max(110, badge.width + 28);
  const pill = new Graphics().roundRect(-bw / 2, 46, bw, 24, 12).fill(d.badgeColor);
  badge.position.set(0, 58);
  box.addChild(bg, name, pill, badge, desc);
  if (extra) box.addChild(extra);
  if (hint) box.addChild(hint);
  const n = d.actions.length;
  const gap = 8;
  const bwid = (w - 30 - gap * (n - 1)) / n;
  d.actions.forEach((a, i) => {
    // Tippfläche etwa 44 pt auf dem iPad (Höhe 56 bei Skalierung 0,8)
    const b = new Button(a.text, bwid, 56, a.color, a.run, n > 1 ? 18 : 20);
    b.position.set(-w / 2 + 15 + bwid / 2 + i * (bwid + gap), h - 44);
    b.enabled = a.enabled;
    box.addChild(b);
  });
  return { box, h };
}

/** Baut die Shop Szene: Next Round und Reroll links, Karten Slots oben, Voucher und Packs unten. Ein Tipp auf einen Artikel zeigt die Details mit Kaufen. */
export function buildShop(run: RunState, cb: ShopCallbacks, animate = true): Container {
  const shop = run.shop!;
  const root = new Container();
  root.position.set(SHOP_X, SHOP_Y);

  // Rahmen: dunkle Fläche mit roter Kante und feiner Leuchtlinie
  const frame = panel(SHOP_W, SHOP_H, C.panelDark, 20, SHOP_FRAME);
  root.addChild(frame);
  // Tipp ins Leere schließt die Detail Karte
  const catcher = new Graphics().rect(0, 0, SHOP_W, SHOP_H).fill({ color: 0, alpha: 0.001 });
  catcher.eventMode = 'static';
  root.addChild(catcher);

  // Linke Spalte: Next Round und Reroll
  const next = new Button('Next\nRound', L.btnW, L.btnH, C.mult, () => cb.nextRound(), 32);
  next.position.set(L.pad + L.btnW / 2, L.pad + L.btnH / 2);
  const cost = rerollCost(run);
  const rr = new Button('Reroll', L.btnW, L.btnH, C.green, () => cb.reroll(), 32);
  rr.position.set(L.pad + L.btnW / 2, L.pad + L.btnH + 28 + L.btnH / 2);
  rr.enabled = run.money >= cost;
  rr.nudgeText(-18);
  const price = label(cost === 0 ? t('Gratis') : `$${cost}`, 34, C.money);
  price.position.set(L.btnW / 2, L.btnH / 2 + 24);
  rr.addChild(price);
  root.addChild(next, rr);
  if (shop.freeRerolls > 0) {
    const fr = label(t('{n} gratis', { n: shop.freeRerolls }), 18, C.green);
    fr.position.set(L.pad + L.btnW / 2, L.pad + L.btnH * 2 + 28 + 38);
    root.addChild(fr);
  }

  // Ablagen
  const cardsInset = inset(L.cardsX, L.cardsY, L.cardsW, L.cardsH);
  const voucherInset = inset(L.pad, L.rowY, L.voucherW, L.rowH);
  const packsX = L.pad + L.voucherW + 20;
  const packsW = SHOP_W - L.pad - packsX;
  const packsInset = inset(packsX, L.rowY, packsW, L.rowH);
  root.addChild(cardsInset, voucherInset, packsInset);

  // Senkrechte Aufschrift im Voucher Fach
  const vLabel = label(`Ante ${run.ante} Voucher`, 24, 0x5a6c82, { letterSpacing: 3 });
  vLabel.rotation = -Math.PI / 2;
  vLabel.position.set(L.pad + 28, L.rowY + L.rowH / 2);
  root.addChild(vLabel);
  const pLabel = label('Booster Packs', 18, 0x5a6c82, { letterSpacing: 2 });
  pLabel.position.set(packsX + packsW / 2, L.rowY + L.rowH - 24);
  root.addChild(pLabel);

  const slots: Slot[] = [];
  const slotLayer = new Container();
  const itemLayer = new Container();
  const calloutLayer = new Container();
  root.addChild(slotLayer, itemLayer, calloutLayer);

  const addSlot = (
    view: Container,
    x: number,
    y: number,
    w: number,
    h: number,
    priceInfo: { price: number } | null,
    dir: Slot['dir'],
    detail: Detail,
  ) => {
    const item = new Container();
    item.position.set(x, y);
    item.addChild(view);
    // Preisfahne über der Ansicht, damit sie beim Aufprall sichtbar bleibt
    if (priceInfo) {
      const tag = priceTag(priceInfo.price, run.money >= priceInfo.price);
      tag.y = -h / 2;
      item.addChild(tag);
    }
    view.eventMode = 'none';
    item.hitArea = new Rectangle(-w / 2, -h / 2 - L.tagH, w, h + L.tagH);
    item.eventMode = 'static';
    item.cursor = 'pointer';
    // Aufprall beim Berühren: das Fach fängt die Berührung auf, die Ansicht stellt nur ihren inneren Container (body) bereit
    const popBody = (view as { body?: Container }).body;
    if (popBody) attachPop(item, popBody);
    itemLayer.addChild(item);
    const slot: Slot = { item, homeY: y, x, top: y - h / 2 - L.tagH, bottom: y + h / 2, dir, detail };
    slots.push(slot);
    item.on('pointertap', () => select(selected === slot ? null : slot));
    return slot;
  };

  let selected: Slot | null = null;
  let callout: Container | null = null;
  const select = (slot: Slot | null) => {
    if (selected) tween(selected.item, { y: selected.homeY }, 140);
    callout?.destroy({ children: true });
    callout = null;
    selected = slot;
    if (!slot) return;
    sfx.click();
    haptics.tap();
    tween(slot.item, { y: slot.homeY - L.lift }, 140, easeOutBack);
    const w = L.calloutW + tipExtra();
    const cx = Math.max(w / 2 + 14, Math.min(SHOP_W - w / 2 - 14, slot.x));
    let up = slot.dir === 'above';
    let built = buildCallout(slot.detail, slot.x - cx, up);
    // unterhalb ist kein Platz mehr: Karte über den Artikel setzen
    if (!up && slot.bottom + 24 + built.h + 14 > SHOP_H) {
      built.box.destroy({ children: true });
      up = true;
      built = buildCallout(slot.detail, slot.x - cx, true);
    }
    const { box, h } = built;
    const y = up ? slot.top - L.lift - 22 - h : slot.bottom + 24;
    box.position.set(cx, y);
    box.alpha = 0;
    box.scale.set(0.92);
    tween(box, { alpha: 1, 'scale.x': 1, 'scale.y': 1 }, 140, easeOutBack);
    calloutLayer.addChild(box);
    callout = box;
  };
  catcher.on('pointertap', () => select(null));

  // Karten Slots (oben)
  const n = shop.cards.length;
  const innerW = L.cardsW - 40;
  const spacing = Math.min(210, innerW / Math.max(n, 1));
  const unit = Math.min(1.4, (spacing - 16) / L.itemW);
  const cardsCy = L.cardsY + L.cardsH / 2 + 16;
  shop.cards.forEach((item, i) => {
    const x = L.cardsX + L.cardsW / 2 + (i - (n - 1) / 2) * spacing;
    const w = L.itemW * unit, h = L.itemH * unit;
    if (!item) {
      slotLayer.addChild(emptySlot(x, cardsCy, w, h));
      return;
    }
    const affordable = run.money >= item.price;
    const can = canBuyCard(run, i);
    const why = !affordable ? t('Zu wenig Geld') : t('Kein freier Platz');
    const buy: Action = { text: t('Kaufen'), color: C.green, enabled: can, run: () => cb.buyCard(i) };
    slotLayer.addChild(emptySlot(x, cardsCy, w, h));
    if (item.kind === 'joker') {
      const def = getJoker(item.defId)!;
      const view = new JokerView({ uid: -1, defId: item.defId, vars: {}, edition: item.edition }, 'shop');
      view.scale.set(unit);
      addSlot(view, x, cardsCy, w, h, item, 'below', {
        name: def.name,
        badge: RARITY_NAMES[def.rarity],
        badgeColor: RARITY_COLORS[def.rarity],
        desc: jokerDescription(def) + (item.edition ? `\n${EDITIONS[item.edition].name}: ${EDITIONS[item.edition].description}` : ''),
        hint: can ? undefined : why,
        actions: [buy],
      });
    } else if (item.kind === 'consumable') {
      const def = CONSUMABLE_BY_ID[item.defId];
      const view = new ConsumableView(item.defId, 'shop');
      view.scale.set(unit);
      const lvl = levelUpPreview(run, item.defId);
      const actions: Action[] = [buy];
      if (!def.targets) actions.push({ text: t('Nutzen'), color: C.chips, enabled: canBuyAndUse(run, i), run: () => cb.buyAndUse(i) });
      addSlot(view, x, cardsCy, w, h, item, 'below', {
        name: def.name,
        badge: CONSUMABLE_TYPE_NAMES[def.type],
        badgeColor: CONSUMABLE_COLORS[def.type],
        desc: consumableDescription(run, def.id),
        extra: lvl ? () => levelUpBlock(lvl, L.calloutW + tipExtra() - 36, { size: 17, theme: 'light' }) : undefined,
        hint: can ? undefined : why,
        actions,
      });
    } else {
      const view = new CardView(item.card, 'shop');
      const k = (L.itemH / CARD_H) * unit;
      view.scale.set(k);
      const parts: string[] = [];
      if (item.card.enhancement) parts.push(`${ENHANCEMENTS[item.card.enhancement].name}: ${ENHANCEMENTS[item.card.enhancement].description}`);
      if (item.card.seal) parts.push(`${SEALS[item.card.seal].name}: ${SEALS[item.card.seal].description}`);
      if (item.card.edition) parts.push(`${EDITIONS[item.card.edition].name}: ${EDITIONS[item.card.edition].description}`);
      addSlot(view, x, cardsCy, w, h, item, 'below', {
        name: isRankless(item.card) ? t('Spielkarte') : `${rankLabel(item.card.rank)} ${SUIT_NAMES[item.card.suit]}`,
        badge: t('Spielkarte'),
        badgeColor: 0xf2711c,
        desc: parts.join('\n') || t('Kommt ins Deck'),
        hint: can ? undefined : why,
        actions: [buy],
      });
    }
  });

  // Voucher (unten links)
  const vcx = L.pad + 28 + (L.voucherW - 28) / 2 + 8;
  const rowCy = L.rowY + L.rowH / 2 + 8;
  if (shop.voucher) {
    const v = VOUCHER_BY_ID[shop.voucher.voucherId];
    const can = run.money >= shop.voucher.price;
    const view = new VoucherView(v.name);
    addSlot(view, vcx, rowCy, VOUCHER_W, VOUCHER_H, shop.voucher, 'above', {
      name: v.name,
      badge: 'Voucher',
      badgeColor: C.money,
      badgeText: 0x2b2540,
      desc: v.description,
      hint: can ? undefined : t('Zu wenig Geld'),
      actions: [{ text: t('Einlösen'), color: C.green, enabled: can, run: () => cb.buyVoucher() }],
    });
  } else {
    const none = label(t('Ausverkauft'), 22, 0x5a6c82);
    none.position.set(vcx, rowCy);
    root.addChild(none);
  }

  // Booster Packs (unten rechts)
  const pn = Math.max(shop.packs.length, 1);
  shop.packs.forEach((p, i) => {
    const x = packsX + (packsW * (i + 0.5)) / pn;
    if (!p) {
      slotLayer.addChild(emptySlot(x, rowCy, L.packSlotW, L.packSlotH));
      return;
    }
    const def = PACK_BY_ID[p.packId];
    const color = def.kind === 'joker' ? C.mult : def.kind === 'karten' ? C.chips : CONSUMABLE_COLORS[def.kind];
    const can = run.money >= p.price;
    const { w: pw0, h: ph0 } = packPixelSize(def);
    slotLayer.addChild(emptySlot(x, rowCy, L.packSlotW, L.packSlotH));
    const pv = new PackView(def);
    addSlot(pv, x, rowCy, pw0, ph0, p, 'above', {
      name: def.name,
      badge: def.size === 'normal' ? 'Normal' : def.size === 'jumbo' ? 'Jumbo' : 'Mega',
      badgeColor: color,
      desc: t('Wähle {a} aus {b}', { a: def.picks, b: def.choices }),
      hint: can ? undefined : t('Zu wenig Geld'),
      actions: [{ text: t('Öffnen'), color: C.green, enabled: can, run: () => cb.buyPack(i) }],
    });
  });

  if (animate) {
    root.alpha = 0;
    root.y += 40;
    tween(root, { alpha: 1, y: SHOP_Y }, 260, easeOutBack);
    // Artikel fallen nacheinander in ihre Fächer
    slots.forEach((s, i) => {
      s.item.alpha = 0;
      s.item.y = s.homeY - 50;
      wait(120 + i * 70).then(() => {
        if (s.item.destroyed) return;
        s.item.alpha = 1;
        tween(s.item, { y: s.homeY }, 260, easeOutBack);
      });
    });
  }
  return root;
}

