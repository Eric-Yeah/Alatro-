import { Container, Graphics, Rectangle, Ticker } from 'pixi.js';
import { BEVEL, SHADOW } from '../data/depth';
import { SHOP_DEPTH, SIGN_DEPTH } from '../data/tileDepth';
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
import { drawInset, drawPlate, dropShadow, raised, sunken } from './depth';
import { lighten } from './depthMath';
import { bottomRounded, drawPill, liftTo } from './tileDepth';
import { C, CONSUMABLE_COLORS, RARITY_COLORS, RARITY_NAMES, shade } from './theme';
import { easeOutBack, tween, wait } from './tween';
import { Button, label, wrapText } from './widgets';

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

const SHOP_FRAME = SHOP_DEPTH.frame;
const BLACK = (a: number) => `rgba(0,0,0,${a})`;

/** Preis Plakette: erhabene dunkle Platte mit Verlauf, Kante und Goldrand, sitzt mit der Unterkante auf dem Artikel. */
function priceTag(price: number, affordable: boolean): Container {
  const c = new Container();
  const txt = label(price === 0 ? t('Gratis') : `$${price}`, 24, affordable ? C.money : SHOP_DEPTH.tagTextOff);
  const h = SHOP_DEPTH.tagH;
  const w = Math.max(60, txt.width + 26);
  const x = -w / 2;
  const y = -h + 4;
  const line = affordable ? SHOP_DEPTH.tagLineOn : SHOP_DEPTH.tagLineOff;
  const shadow = dropShadow(w, h + 3, SHOP_DEPTH.tagShadow, { radius: 10 });
  shadow.x += x;
  shadow.y += y;
  const plate = drawPlate(new Graphics(), x, y, w, h, SHOP_DEPTH.tagColor, { radius: 10, edge: 3, sheen: 0.35, outline: 3 });
  // feiner Goldrand innen, bei zu wenig Geld matt
  plate.roundRect(x + 3, y + 3, w - 6, h - 6, 8).stroke({ width: 1.5, color: line, alpha: affordable ? 0.95 : 0.8 });
  c.addChild(shadow, plate, txt);
  txt.y = y + h / 2 + 1;
  return c;
}

/** Fach (vertieft, mit Innenschatten) mit Regalboden unten: die Kacheln stehen darauf und werfen ihren Schatten. Ursprung links oben. */
function shelf(x: number, y: number, w: number, h: number, floorH: number): Container {
  const D = SHOP_DEPTH;
  const c = new Container();
  c.addChild(drawInset(new Graphics(), 0, 0, w, h, D.shelf, { radius: D.radius, line: D.shelfLine }));
  const g = new Graphics();
  const fy = h - 3 - floorH;
  bottomRounded(g, 3, fy, w - 6, floorH, D.radius - 3, D.floorTop);
  // Vorderkante: dunkle Fuge zur Wand, helle Lippe
  g.rect(3, fy, w - 6, 2).fill(BLACK(0.45));
  g.rect(3, fy + 2, w - 6, D.floorLipH).fill(D.floorLip);
  c.addChild(g);
  c.position.set(x, y);
  c.boundsArea = new Rectangle(0, 0, w, h);
  return c;
}

/** Leerer Platz: kleine Mulde in der Größe des Artikels (Mitte x, y) */
function emptySlot(x: number, y: number, w: number, h: number): Container {
  const c = sunken(w, h, SHOP_DEPTH.hollow, { radius: 10, outline: 2, alpha: SHOP_DEPTH.hollowAlpha });
  c.position.set(x - w / 2, y - h / 2);
  return c;
}

/** Zahlen des Leuchtschilds in der Seitenleiste */
const SIGN = SIGN_DEPTH;

/**
 * Leuchtschild "SHOP" für die Seitenleiste: Rahmen mit Glühbirnen, die abwechselnd blinken.
 * Das Blinken läuft nur, solange das Schild sichtbar ist.
 */
export function buildShopSign(): Container {
  const { w, h } = SIGN;
  const edge = BEVEL.panelEdge;
  const sign = new Container();
  // scharfer Schatten, erhabener roter Rahmen mit hartem Unterrand, vertieftes dunkles Feld
  sign.addChild(dropShadow(w, h + edge, SHADOW.panel, { radius: 12 }));
  const body = new Graphics();
  drawPlate(body, 0, 0, w, h, SIGN.frameColor, { radius: 12, edge, sheen: 0.3 });
  drawInset(body, 15, 15, w - 30, h - 30, SIGN.displayColor, { radius: 8 });
  sign.addChild(body);
  sign.boundsArea = new Rectangle(0, 0, w, h + edge);
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
      const look = on ? SIGN.on : SIGN.off;
      // leuchtende Birnen haben einen Halo, jede Birne eine kleine Kugel aus Mitte und Rand
      if (on) g.circle(x, y, SIGN.haloR).fill({ color: 0xffd36b, alpha: SIGN.haloAlpha });
      g.circle(x, y, SIGN.bulbR).fill(look.edge).stroke({ width: 1.5, color: look.line });
      g.circle(x - 1, y - 1.2, SIGN.bulbR * 0.45).fill(look.core);
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
  const blink = (tk: Ticker) => {
    if (sign.destroyed) { Ticker.shared.remove(blink); return; }
    if (!sign.visible) return;
    acc += tk.deltaMS;
    if (acc < SIGN.blinkMs) return;
    acc = 0;
    on = 1 - on;
    frames[0].visible = on === 0;
    frames[1].visible = on === 1;
  };
  Ticker.shared.add(blink);
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
  view: Container;
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
  const w = L.calloutW;
  const box = new Container();
  const desc = richText(d.desc, w - 36, { size: 18, theme: 'light' });
  const extra = d.extra ? d.extra() : null;
  const hint = d.hint ? wrapText(d.hint, w - 36, 15, 0xa8324a) : null;
  desc.position.set(0, 82);
  const below = 82 + desc.height + (extra ? LEVEL_UP_VIEW.gap + extra.height : 0);
  if (extra) extra.position.set(0, 82 + desc.height + LEVEL_UP_VIEW.gap);
  if (hint) hint.position.set(0, below + 8);
  const h = below + (hint ? hint.height + 16 : 8) + 78;
  // erhabene Platte (Pergament) mit weichem Schatten, die Spitze wächst unter der Platte hervor
  const D = SHOP_DEPTH;
  const edge = BEVEL.panelEdge;
  const k = D.calloutContrast;
  const tailY = up ? h + edge : 0;
  const tailColor = up ? shade(D.calloutColor, 1 - (1 - BEVEL.faceBottom) * k) : lighten(D.calloutColor, BEVEL.faceTop * k);
  const tail = new Graphics()
    .poly(up ? [tailX - 14, tailY, tailX, tailY + 14, tailX + 14, tailY] : [tailX - 14, tailY, tailX, tailY - 14, tailX + 14, tailY]).fill(tailColor).stroke({ width: 3, color: C.cardEdge });
  const shadow = dropShadow(w, h + edge, SHADOW.panel, { radius: D.calloutRadius });
  shadow.x -= w / 2;
  const bg = drawPlate(new Graphics(), -w / 2, 0, w, h, D.calloutColor, { radius: D.calloutRadius, line: C.cardEdge, edge, sheen: 0.28, contrast: k });
  bg.eventMode = 'static';
  const name = label(d.name, 24, C.cardEdge);
  name.position.set(0, 26);
  if (name.width > w - 30) name.scale.set((w - 30) / name.width);
  const badge = label(d.badge, 14, d.badgeText ?? 0xffffff);
  const bw = Math.max(110, badge.width + 28);
  const pill = drawPill(new Graphics(), -bw / 2, 46, bw, 24, d.badgeColor, 12, { light: 0.12, sheen: 0.16 });
  badge.position.set(0, 58);
  box.addChild(shadow, tail, bg, name, pill, badge, desc);
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
  const frame = raised(SHOP_W, SHOP_H, C.panelDark, { radius: 20, line: SHOP_FRAME, alpha: 0.96, holo: true, shadow: SHADOW.plate });
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
  const floorLow = SHOP_DEPTH.floorHLow;
  const cardsInset = shelf(L.cardsX, L.cardsY, L.cardsW, L.cardsH, SHOP_DEPTH.floorH);
  const voucherInset = shelf(L.pad, L.rowY, L.voucherW, L.rowH, floorLow);
  const packsX = L.pad + L.voucherW + 20;
  const packsW = SHOP_W - L.pad - packsX;
  const packsInset = shelf(packsX, L.rowY, packsW, L.rowH, floorLow);
  root.addChild(cardsInset, voucherInset, packsInset);

  // Senkrechte Aufschrift im Voucher Fach (über dem Regalboden), Beschriftung der Packs auf dem Regalboden
  const vLabel = label(`Ante ${run.ante} Voucher`, 22, 0x6f84a0, { letterSpacing: 3 });
  const vMax = L.rowH - floorLow - 30;
  if (vLabel.width > vMax) vLabel.scale.set(vMax / vLabel.width);
  vLabel.rotation = -Math.PI / 2;
  vLabel.position.set(L.pad + 28, L.rowY + (L.rowH - floorLow) / 2);
  root.addChild(vLabel);
  const pLabel = label('Booster Packs', 18, 0x8da2c0, { letterSpacing: 2 });
  pLabel.position.set(packsX + packsW / 2, L.rowY + L.rowH - floorLow / 2 + 4);
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
    // Aufprall beim Berühren: das Fach fängt die Berührung auf, die Ansicht stellt nur ihren inneren Container (body) bereit.
    // Ansichten mit `lift` heben dabei ihren Schatten mit (gewählte Artikel bleiben gehoben).
    const popBody = (view as { body?: Container }).body;
    const liftable = 'lift' in view;
    const rest = () => (selected === slot ? 1 : 0);
    const hover = (on: boolean) => { if (liftable) liftTo(view as unknown as { lift: number; destroyed: boolean }, on ? 1 : rest()); };
    if (popBody) attachPop(item, popBody, { onHover: hover });
    else if (liftable) { item.on('pointerover', () => hover(true)); item.on('pointerout', () => hover(false)); }
    itemLayer.addChild(item);
    const slot: Slot = { item, view, homeY: y, x, top: y - h / 2 - L.tagH, bottom: y + h / 2, dir, detail };
    slots.push(slot);
    item.on('pointertap', () => select(selected === slot ? null : slot));
    return slot;
  };

  let selected: Slot | null = null;
  let callout: Container | null = null;
  const select = (slot: Slot | null) => {
    if (selected) {
      tween(selected.item, { y: selected.homeY }, 140);
      if ('lift' in selected.view) liftTo(selected.view as unknown as { lift: number; destroyed: boolean }, 0);
    }
    callout?.destroy({ children: true });
    callout = null;
    selected = slot;
    if (!slot) return;
    sfx.click();
    haptics.tap();
    tween(slot.item, { y: slot.homeY - L.lift }, 140, easeOutBack);
    if ('lift' in slot.view) liftTo(slot.view as unknown as { lift: number; destroyed: boolean }, 1);
    const w = L.calloutW;
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
        extra: lvl ? () => levelUpBlock(lvl, L.calloutW - 36, { size: 17, theme: 'light' }) : undefined,
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

