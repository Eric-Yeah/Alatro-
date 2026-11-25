import { Container, Graphics, Rectangle, Sprite, Text, type NineSliceSprite } from 'pixi.js';
import { SUIT_NAMES, SUIT_SYMBOLS, chipValue, isRankless, rankLabel } from '../core/cards';
import type { Card } from '../core/types';
import { cardMods, deckLayout, deckStats, type CardMod, type DeckSort } from '../core/runInfo';
import type { RunState } from '../core/run';
import { RANKS, SUITS } from '../data/cards';
import { CARD_PX_H, CARD_PX_W } from '../data/cardArt/cardGlyphs';
import { CARD_BODY } from '../data/depth';
import { DECK_VIEW } from '../data/deckView';
import { TILE_DEPTH } from '../data/tileDepth';
import { SEALS } from '../data/modifiers';
import { t } from '../i18n';
import { cardTexture } from './cardArt/cardTextures';
import { effectiveCardPalette } from './cosmeticFx';
import { drawInset, dropShadow, setShadowLift, sunken } from './depth';
import { richText } from './richText';
import { tabTrough } from './tileDepth';
import { easeOutBack, tween } from './tween';
import { C, EDITION_COLORS, ENHANCEMENT_COLORS, FONT_BODY, SEAL_COLORS, SUIT_COLORS } from './theme';
import { Button, label } from './widgets';

export const DECK_VIEW_W = DECK_VIEW.w;
export const DECK_VIEW_H = DECK_VIEW.h;

/** Auswahl bleibt beim erneuten Öffnen erhalten (nur für diese Sitzung) */
let lastSort: DeckSort = 'rank';
let lastOnlyPile = false;

const TILE_W = CARD_PX_W * DECK_VIEW.pxScale;
const TILE_H = CARD_PX_H * DECK_VIEW.pxScale;
/** Rand über der ersten Zeile, damit Auswahlrahmen und Edition Rand nicht abgeschnitten werden */
const GRID_PAD = 8;
/** Eckenradius der Kartentextur (Schatten und Körper) */
const TILE_R = 8;
/** so weit steigt die gewählte Karte (Pixel) */
const SELECT_RISE = 6;
const KIND_COLORS: Record<CardMod['kind'], number> = { enhancement: C.accent, seal: 0xff7a8c, edition: 0x9fd8ff };
const KIND_NAMES: Record<CardMod['kind'], string> = { enhancement: 'Enhancement', seal: 'Seal', edition: 'Edition' };

/** Suit Farbe auf dunklem Untergrund (Spades sind dort hell, wie in der Run Info) */
const suitColor = (suit: Card['suit']) => (suit === 'S' ? 0x8f9bff : SUIT_COLORS[suit]);

/** Kleine Marke mit dunklem Hintergrund und Text, schrumpft auf die Breite */
function pill(text: string, color: number, maxW: number, size = DECK_VIEW.markFont): Container {
  const c = new Container();
  const tx = new Text({ text, style: { fontFamily: FONT_BODY, fontSize: size, fontWeight: '900', fill: color } });
  tx.anchor.set(0.5);
  if (tx.width > maxW - 8) tx.scale.set((maxW - 8) / tx.width);
  const w = tx.width + 8;
  const h = tx.height + 2;
  c.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 4).fill({ color: 0x0b1018, alpha: 0.82 }), tx);
  return c;
}

/**
 * Karte des Decks als Pixel Textur in Originalgröße (nearest, scharf) mit Marken für Enhancement (Name unten),
 * Seal (Siegel mit Anfangsbuchstabe) und Edition (Rand und Name oben). Mittelpunkt ist der Ursprung.
 */
function cardTile(card: Card): { view: Container; shadow: NineSliceSprite } {
  const c = new Container();
  const rankless = isRankless(card);
  // schlanker weicher Schatten und Kartendicke (wie auf dem Tisch, nur kleiner)
  const shadow = dropShadow(TILE_W, TILE_H, TILE_DEPTH.gridShadow, { radius: TILE_R });
  shadow.x -= TILE_W / 2;
  shadow.y -= TILE_H / 2;
  const body = new Graphics().roundRect(-TILE_W / 2, -TILE_H / 2 + CARD_BODY.dy, TILE_W, TILE_H, TILE_R).fill(CARD_BODY.color);
  c.addChild(shadow, body);
  const face = card.enhancement ? ENHANCEMENT_COLORS[card.enhancement] : undefined;
  const art = new Sprite(cardTexture(card.suit, card.rank, effectiveCardPalette(), { face, rankless }));
  art.anchor.set(0.5);
  art.scale.set(DECK_VIEW.pxScale);
  c.addChild(art);
  const enh = cardMods(card).find((m) => m.kind === 'enhancement');
  if (enh) {
    const p = pill(enh.name, 0xffffff, TILE_W - 22);
    p.position.set(-6, TILE_H / 2 - 24);
    c.addChild(p);
  }
  if (card.seal && SEALS[card.seal]) {
    const r = DECK_VIEW.sealRadius;
    const seal = new Graphics().circle(TILE_W / 2 - r - 3, 2, r).fill(SEAL_COLORS[card.seal] ?? C.accent).stroke({ width: 2, color: 0xffffff, alpha: 0.85 });
    const sl = new Text({ text: SEALS[card.seal].name.charAt(0), style: { fontFamily: FONT_BODY, fontSize: DECK_VIEW.markFont + 2, fontWeight: '900', fill: 0xffffff, stroke: { color: 0x1b1530, width: 3 } } });
    sl.anchor.set(0.5);
    sl.position.set(TILE_W / 2 - r - 3, 2);
    c.addChild(seal, sl);
  }
  if (card.edition) {
    const rim = DECK_VIEW.editionRim;
    c.addChild(new Graphics()
      .roundRect(-TILE_W / 2 - rim / 2, -TILE_H / 2 - rim / 2, TILE_W + rim, TILE_H + rim, 8)
      .stroke({ width: rim, color: EDITION_COLORS[card.edition] ?? C.accent }));
    const e = cardMods(card).find((m) => m.kind === 'edition');
    if (e) {
      const p = pill(e.name, EDITION_COLORS[card.edition] === 0x1a1426 ? 0xd9c8ff : 0xffffff, TILE_W - 30);
      p.position.set(10, -TILE_H / 2 + 11);
      c.addChild(p);
    }
  }
  c.hitArea = new Rectangle(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  return { view: c, shadow };
}

/** Segmentierter Umschalter aus zwei oder mehr Knöpfen, der aktive ist farbig. Mitte jedes Knopfs auf y. */
function segmented<T extends string>(items: { id: T; text: string; w: number }[], current: T, pick: (id: T) => void, x: number, y: number, align: 'left' | 'right'): Container {
  const c = new Container();
  const gap = 10;
  const total = items.reduce((a, i) => a + i.w, 0) + gap * (items.length - 1);
  let at = align === 'left' ? x : x - total;
  // Rinne hinter den Schaltern, der aktive (farbig) liegt darin
  const trough = tabTrough(total, DECK_VIEW.toggleH);
  trough.x += at;
  trough.y += y - DECK_VIEW.toggleH / 2;
  c.addChild(trough);
  for (const i of items) {
    const b = new Button(i.text, i.w, DECK_VIEW.toggleH, i.id === current ? 0xf2711c : 0x3b5068, () => pick(i.id), 22);
    b.position.set(at + i.w / 2, y);
    c.addChild(b);
    at += i.w + gap;
  }
  return c;
}

/**
 * Deck Ansicht: alle Karten des Decks als Raster (Spalte je Rang), sortierbar nach Rang oder Farbe. In einer Runde
 * sind gezogene, gespielte und abgeworfene Karten abgedunkelt und ein Umschalter zeigt nur den Nachziehstapel.
 * Antippen einer Karte zeigt Rang, Farbe, Enhancement, Seal und Edition. Das Raster scrollt bei hohen Decks.
 */
export function buildDeckView(box: Container, run: RunState, close: () => void) {
  const W = DECK_VIEW.w;
  const inRound = !!run.round;
  const stats = deckStats(run);
  let sort = lastSort;
  let onlyPile = inRound && lastOnlyPile;
  let selected: number | null = null;
  let scroll = 0;

  const head = label(t('Dein Deck'), 38);
  head.position.set(W / 2, 40);
  const countText = [
    t('{n} Karte im Deck|{n} Karten im Deck', { n: stats.total }),
    ...(inRound ? [t('{n} im Nachziehstapel', { n: stats.remaining ?? 0 })] : []),
    ...(stats.modified ? [t('{n} mit Modifikator', { n: stats.modified })] : []),
  ].join(', ');
  const counts = label(countText, 21, C.accent);
  counts.position.set(W / 2, 84);
  box.addChild(head, counts);

  // Raster (scrollt senkrecht), später Kopfzeile und Detailfeld darüber, damit sie Berührungen vorrangig bekommen
  const gw = RANKS.length * DECK_VIEW.colPitch;
  const viewport = new Container();
  viewport.position.set(DECK_VIEW.gridX, DECK_VIEW.gridY);
  viewport.hitArea = new Rectangle(0, 0, gw, DECK_VIEW.gridH);
  viewport.eventMode = 'static';
  const content = new Container();
  const mask = new Graphics().rect(0, 0, gw, DECK_VIEW.gridH).fill(0xffffff);
  viewport.addChild(content, mask);
  content.mask = mask;
  const bar = new Graphics();
  bar.position.set(DECK_VIEW.gridX + gw + 4, DECK_VIEW.gridY);
  // das Raster liegt in einer vertieften Mulde, die Karten werfen ihren Schatten darauf
  const well = drawInset(new Graphics(), DECK_VIEW.gridX - 10, DECK_VIEW.gridY - 8, gw + 26, DECK_VIEW.gridH + 16, 0x1d2a3a, { radius: 14 });
  box.addChild(well, viewport, bar);

  const header = new Container();
  const detail = new Container();
  detail.position.set(DECK_VIEW.gridX, DECK_VIEW.detailY);
  box.addChild(header, detail);

  let tiles: { id: number; view: Container; shadow: NineSliceSprite; x: number; y: number; up: boolean }[] = [];
  let contentH = 0;
  const ring = new Graphics();

  const maxScroll = () => Math.max(0, contentH - DECK_VIEW.gridH);
  const applyScroll = (v: number) => {
    scroll = Math.max(0, Math.min(maxScroll(), v));
    content.y = -scroll;
    // Karten außerhalb des Fensters ausblenden und nicht antippbar machen
    for (const tl of tiles) {
      const vis = tl.y + TILE_H / 2 + GRID_PAD > scroll && tl.y - TILE_H / 2 - GRID_PAD < scroll + DECK_VIEW.gridH;
      tl.view.visible = vis;
      tl.view.eventMode = vis ? 'static' : 'none';
    }
    bar.clear();
    if (maxScroll() > 0) {
      const th = Math.max(40, (DECK_VIEW.gridH * DECK_VIEW.gridH) / contentH);
      const ty = (scroll / maxScroll()) * (DECK_VIEW.gridH - th);
      bar.roundRect(0, 0, DECK_VIEW.barW, DECK_VIEW.gridH, 3).fill({ color: 0x000000, alpha: 0.35 });
      bar.roundRect(0, ty, DECK_VIEW.barW, th, 3).fill({ color: C.textDim, alpha: 0.9 });
    }
  };

  // Wischen und Mausrad. Ein Wischen über eine Karte soll sie nicht antippen.
  let dragging = false;
  let dragged = false;
  let startY = 0;
  let startScroll = 0;
  viewport.on('pointerdown', (e) => {
    dragging = true;
    dragged = false;
    startY = viewport.toLocal(e.global).y;
    startScroll = scroll;
  });
  viewport.on('globalpointermove', (e) => {
    if (!dragging) return;
    const dy = viewport.toLocal(e.global).y - startY;
    if (Math.abs(dy) > DECK_VIEW.dragSlop) dragged = true;
    if (dragged) applyScroll(startScroll - dy);
  });
  const stop = () => { dragging = false; };
  viewport.on('pointerup', stop);
  viewport.on('pointerupoutside', stop);
  viewport.on('wheel', (e) => applyScroll(scroll + e.deltaY * DECK_VIEW.wheelStep));

  const select = (id: number | null) => {
    selected = id;
    ring.clear();
    // gewählte Karte steigt, ihr Schatten bleibt liegen und wird weicher
    for (const x of tiles) {
      const up = x.id === id;
      if (up === x.up) continue;
      x.up = up;
      setShadowLift(x.shadow, up ? 1 : 0);
      void tween(x.view, { y: up ? x.y - SELECT_RISE : x.y }, 120, easeOutBack);
    }
    const tl = tiles.find((x) => x.id === id);
    if (tl) {
      ring.roundRect(tl.x - TILE_W / 2 - 4, tl.y - SELECT_RISE - TILE_H / 2 - 4, TILE_W + 8, TILE_H + 8, 9).stroke({ width: 4, color: C.money });
    }
    renderDetail();
  };

  const buildGrid = () => {
    for (const c of [...content.children]) if (c !== ring) c.destroy({ children: true });
    tiles = [];
    const layout = deckLayout(run, sort, onlyPile);
    for (const cell of layout.cells) {
      const { view, shadow } = cardTile(cell.card);
      const x = cell.col * DECK_VIEW.colPitch + DECK_VIEW.colPitch / 2;
      const y = GRID_PAD + cell.row * DECK_VIEW.rowPitch + TILE_H / 2;
      view.position.set(x, y);
      if (!cell.inPile) view.alpha = DECK_VIEW.usedAlpha;
      view.on('pointertap', () => { if (!dragged) select(selected === cell.card.id ? null : cell.card.id); });
      content.addChild(view);
      tiles.push({ id: cell.card.id, view, shadow, x, y, up: false });
    }
    content.addChild(ring);
    if (!layout.cells.length) {
      const empty = label(t('Der Nachziehstapel ist leer.'), 24, C.textDim);
      empty.position.set(gw / 2, DECK_VIEW.gridH / 2);
      content.addChild(empty);
    }
    contentH = GRID_PAD * 2 + layout.rows * DECK_VIEW.rowPitch - (DECK_VIEW.rowPitch - TILE_H);
    if (selected !== null && !tiles.some((x) => x.id === selected)) selected = null;
    applyScroll(scroll);
    select(selected);
  };

  const renderHeader = () => {
    for (const c of [...header.children]) c.destroy({ children: true });
    const lbl = label(t('Sortieren'), 18, C.textDim);
    lbl.anchor.set(0, 0.5);
    lbl.position.set(DECK_VIEW.gridX, DECK_VIEW.toggleY - 45);
    header.addChild(lbl);
    header.addChild(segmented<DeckSort>(
      [{ id: 'rank', text: t('Rang'), w: DECK_VIEW.toggleW }, { id: 'suit', text: t('Farbe'), w: DECK_VIEW.toggleW }],
      sort, (id) => { sort = lastSort = id; scroll = 0; renderHeader(); buildGrid(); }, DECK_VIEW.gridX, DECK_VIEW.toggleY, 'left'));
    if (inRound) {
      header.addChild(segmented<'all' | 'pile'>(
        [{ id: 'all', text: t('Alle Karten'), w: 190 }, { id: 'pile', text: t('Nur Nachziehstapel'), w: 270 }],
        onlyPile ? 'pile' : 'all', (id) => { onlyPile = lastOnlyPile = id === 'pile'; scroll = 0; renderHeader(); buildGrid(); }, W - DECK_VIEW.gridX, DECK_VIEW.toggleY, 'right'));
    }

    // Zähler je Farbe (im Nachziehstapel / gesamt, außerhalb einer Runde nur gesamt)
    const num = (left: number | null | undefined, total: number) => (inRound && left !== null && left !== undefined ? `${left}/${total}` : String(total));
    let sx = DECK_VIEW.gridX;
    const sy = DECK_VIEW.suitY + DECK_VIEW.suitH / 2;
    const box1 = (w: number) => {
      const g = drawInset(new Graphics(), sx, DECK_VIEW.suitY, w, DECK_VIEW.suitH, C.panel, { radius: 10, outline: 2 });
      header.addChild(g);
    };
    for (const suit of SUITS) {
      box1(DECK_VIEW.suitW);
      const sym = label(SUIT_SYMBOLS[suit], 28, suitColor(suit));
      sym.position.set(sx + 28, sy);
      const n = label(num(stats.remainingBySuit?.[suit], stats.bySuit[suit]), 22, C.text);
      n.anchor.set(1, 0.5);
      n.position.set(sx + DECK_VIEW.suitW - 14, sy);
      header.addChild(sym, n);
      sx += DECK_VIEW.suitW + 12;
    }
    if (stats.rankless) {
      box1(DECK_VIEW.suitW + 30);
      const l = label(t('Ohne Rang'), 17, C.textDim);
      l.anchor.set(0, 0.5);
      l.position.set(sx + 12, sy);
      const n = label(num(stats.remainingRankless, stats.rankless), 22, C.text);
      n.anchor.set(1, 0.5);
      n.position.set(sx + DECK_VIEW.suitW + 30 - 14, sy);
      header.addChild(l, n);
    }
    if (inRound) {
      const legend = label(t('Zahlen: im Nachziehstapel / gesamt'), 16, C.textDim);
      legend.anchor.set(1, 0.5);
      legend.position.set(W - DECK_VIEW.gridX, sy);
      header.addChild(legend);
    }

    // Zähler je Rang über den Spalten
    RANKS.forEach((r, i) => {
      const col = RANKS.length - 1 - i;
      const x = DECK_VIEW.gridX + col * DECK_VIEW.colPitch + DECK_VIEW.colPitch / 2;
      const rl = label(rankLabel(r), 22, C.money);
      rl.position.set(x, DECK_VIEW.rankLabelY);
      const left = stats.remainingByRank?.[r];
      const empty = inRound && left === 0 && stats.byRank[r] > 0;
      const rc = label(num(left, stats.byRank[r]), 19, empty ? 0xff7a6e : C.text);
      rc.position.set(x, DECK_VIEW.rankCountY);
      header.addChild(rl, rc);
    });
  };

  const renderDetail = () => {
    for (const c of [...detail.children]) c.destroy({ children: true });
    const w = DECK_VIEW.detailW;
    detail.addChild(sunken(w, DECK_VIEW.detailH, C.panel, { radius: 14 }));
    const card = run.deck.find((c) => c.id === selected);
    if (!card) {
      const hint = label(t('Tippe eine Karte an, um Details zu sehen.'), 21, C.textDim);
      hint.position.set(w / 2, DECK_VIEW.detailH / 2);
      detail.addChild(hint);
      return;
    }
    const rankless = isRankless(card);
    const title = label(rankless ? t('Karte ohne Rang') : `${rankLabel(card.rank)} ${SUIT_NAMES[card.suit]}`, 28, rankless ? C.text : suitColor(card.suit));
    title.anchor.set(0, 0.5);
    title.position.set(22, 30);
    detail.addChild(title);
    if (!rankless) {
      const base = richText(`+${chipValue(card.rank)} Chips`, 160, { size: 19, align: 'left', theme: 'dark' });
      base.position.set(22 + title.width + 18, 19);
      detail.addChild(base);
    }
    if (inRound) {
      const inPile = !!run.round!.drawPile.some((c) => c.id === card.id);
      const st = label(inPile ? t('Im Nachziehstapel') : t('Schon gezogen oder gespielt'), 19, inPile ? C.green : C.textDim);
      st.anchor.set(1, 0.5);
      st.position.set(w - 22, 30);
      detail.addChild(st);
    }
    const mods = cardMods(card);
    if (!mods.length) {
      const none = label(t('Keine Modifikatoren'), 19, C.textDim);
      none.anchor.set(0, 0.5);
      none.position.set(22, 80);
      detail.addChild(none);
      return;
    }
    const colW = (w - 44 - 16 * (mods.length - 1)) / mods.length;
    mods.forEach((m, i) => {
      const x = 22 + i * (colW + 16);
      const kind = label(KIND_NAMES[m.kind], 15, C.textDim);
      kind.anchor.set(0, 0.5);
      kind.position.set(x, 62);
      const name = label(m.name, 21, KIND_COLORS[m.kind]);
      name.anchor.set(0, 0.5);
      name.position.set(x + kind.width + 10, 62);
      if (kind.width + 10 + name.width > colW) name.scale.set((colW - kind.width - 10) / name.width);
      const d = richText(m.description, colW, { size: 16, align: 'left', theme: 'dark' });
      d.position.set(x, 80);
      const maxH = DECK_VIEW.detailH - 80 - 6;
      if (d.height > maxH) d.scale.set(maxH / d.height);
      detail.addChild(kind, name, d);
    });
  };

  renderHeader();
  buildGrid();

  const closeBtn = new Button(t('Schließen'), 240, 60, 0xf2711c, close, 24);
  closeBtn.position.set(W - DECK_VIEW.gridX - 120, DECK_VIEW.detailY + DECK_VIEW.detailH / 2);
  box.addChild(closeBtn);
}

/** Knopf "Deck" zum Öffnen der Deck Ansicht (Blind Auswahl, Shop). Tippfläche mindestens 44 Punkte hoch. */
export function deckButton(w: number, h: number, size: number, onTap: () => void): Button {
  return new Button(t('Deck'), w, h, C.chips, onTap, size);
}

/** Kleine Beschriftung unter dem Stapel am Tisch: weist darauf hin, dass der Stapel antippbar ist */
export function deckCaption(x: number, y: number): Text {
  const l = label(t('Deck ansehen'), 14, C.textDim);
  l.position.set(x, y);
  return l;
}
