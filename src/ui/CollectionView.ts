import { richText } from './richText';
import { t } from '../i18n';
import { Container, Graphics } from 'pixi.js';
import { COLLECTION_TABS, collectionEntries, collectionHint, collectionProgress, loadDiscovered, markAllSeen, unseenKeys, type CollectionEntry, type CollectionTab } from '../collection';
import { C, CONSUMABLE_COLORS, RARITY_COLORS, fmt, fmtMult, shade } from './theme';
import { Button, label, tabBar } from './widgets';
import { drawInset, drawPlate } from './depth';
import { tabTrough } from './tileDepth';
import { ConsumableView } from './ConsumableView';
import { JokerView } from './JokerView';
import { VoucherView } from './VoucherView';
import { CONSUMABLE_BY_ID } from '../data/consumables';
import { COLLECTION_TILE } from '../data/consumableArt';
import { levelUpGain } from '../core/runInfo';

export const COLLECTION_W = 1280;
export const COLLECTION_H = 860;

const COLS = 4;
const ROWS = 3;
const PER_PAGE = COLS * ROWS;
const CELL_W = 290;
const CELL_H = 170;
const GAP = 18;

/** Farbe des Eintrags: Rarity, Consumable Typ oder eigene Farbe der Daten */
function entryColor(e: CollectionEntry): number {
  if (e.color !== undefined) return e.color;
  if (e.group in RARITY_COLORS) return RARITY_COLORS[e.group as keyof typeof RARITY_COLORS];
  if (e.group in CONSUMABLE_COLORS) return CONSUMABLE_COLORS[e.group as keyof typeof CONSUMABLE_COLORS];
  return 0xf2711c;
}

/** Pixel Art Kachel eines entdeckten Eintrags (Joker, Consumable, Voucher), sonst null. Ohne Bedienung, nur Anzeige. */
function tileFor(e: CollectionEntry): { view: Container; w: number; h: number } | null {
  const [kind, id] = e.key.split(':');
  let view: Container | null = null;
  let w = 104, h = 140;
  if (kind === 'joker') view = new JokerView({ uid: -1, defId: id, vars: {} }, false);
  else if (kind === 'consumable' && CONSUMABLE_BY_ID[id]) view = new ConsumableView(id, false);
  else if (kind === 'voucher') { view = new VoucherView(e.name); w = 132; h = 180; }
  if (!view) return null;
  const k = Math.min(COLLECTION_TILE.maxW / w, COLLECTION_TILE.maxH / h, 1);
  view.scale.set(k);
  view.eventMode = 'none';
  view.interactiveChildren = false;
  return { view, w: w * k, h: h * k };
}

/** Zusatzzeile bei Sternbildern: was ein Level up an Chips und Mult bringt (Zahlen aus den Handdaten) */
function gainLine(e: CollectionEntry): string {
  const [kind, id] = e.key.split(':');
  const g = kind === 'consumable' ? levelUpGain(id) : null;
  return g ? '\n' + t('+{chips} Chips, +{mult} Mult', { chips: fmt(g.chips), mult: fmtMult(g.mult) }) : '';
}

/** Sammlung: alle Inhalte nach Reitern, nicht gesehene Einträge bleiben verdeckt. */
export function buildCollection(box: Container, close: () => void) {
  const W = COLLECTION_W;
  const discovered = loadDiscovered();
  const found = new Set(discovered);
  // Neu Marker: gelten, bis die Sammlung geschlossen wird
  const fresh = new Set(unseenKeys(discovered));
  const total = collectionProgress(discovered);
  let tab: CollectionTab = 'jokers';
  let page = 0;

  const head = label(t('Sternenatlas'), 38);
  head.position.set(W / 2, 30);
  const overall = label(t('{found} von {total} entdeckt ({pct} Prozent)', { found: total.found, total: total.total, pct: Math.round(total.fraction * 100) }), 18, C.accent);
  overall.position.set(W / 2, 62);
  box.addChild(head, overall);
  const dyn = new Container();
  box.addChild(dyn);

  const render = () => {
    for (const c of [...dyn.children]) c.destroy({ children: true });
    // Rinne hinter den Reitern (aktiver Reiter farbig)
    const barHolder = new Container();
    barHolder.position.set(40, 88);
    barHolder.addChild(tabTrough(W - 80));
    const bar = tabBar(COLLECTION_TABS.map((tb) => ({ id: tb.id, name: collectionEntries(tb.id).some((e) => fresh.has(e.key)) ? `${tb.name} *` : tb.name })), W - 80, tab, (id) => { tab = id; page = 0; render(); }, 16);
    barHolder.addChild(bar);
    dyn.addChild(barHolder);

    const entries = collectionEntries(tab);
    const seen = entries.filter((e) => found.has(e.key)).length;
    const newHere = entries.filter((e) => fresh.has(e.key)).length;
    const count = label(t('{seen} von {total} entdeckt', { seen, total: entries.length }) + (newHere ? t(', {n} neu', { n: newHere }) : ''), 20, newHere ? C.money : C.textDim);
    count.position.set(W / 2, 156);
    dyn.addChild(count);

    const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
    page = Math.min(page, pages - 1);
    entries.slice(page * PER_PAGE, (page + 1) * PER_PAGE).forEach((e, i) => {
      const x = 40 + (i % COLS) * (CELL_W + GAP);
      const y = 190 + Math.floor(i / COLS) * (CELL_H + GAP);
      const known = found.has(e.key);
      const color = entryColor(e);
      // Vitrine: vertieftes Fach, bei entdeckten Einträgen mit Rand und Lichtband in der Farbe des Eintrags
      dyn.addChild(drawInset(new Graphics(), x, y, CELL_W, CELL_H, known ? C.panel : 0x141d29, { radius: 14, outline: 3, line: known ? shade(color, 0.8) : C.panelLine }));
      if (known) dyn.addChild(new Graphics().roundRect(x + 10, y + 10, CELL_W - 20, 8, 4).fill(color));
      const tile = known ? tileFor(e) : null;
      // Textbereich: mit Kachel rechts von ihr, sonst über die ganze Zelle
      const tx = tile ? x + COLLECTION_TILE.pad * 2 + tile.w : x;
      const tw = tile ? CELL_W - COLLECTION_TILE.pad * 3 - tile.w : CELL_W;
      const cx = tx + tw / 2;
      if (tile) {
        tile.view.position.set(x + COLLECTION_TILE.pad + tile.w / 2, y + CELL_H / 2 + 6);
        dyn.addChild(tile.view);
      }
      const name = label(known ? e.name : '???', tile ? 20 : 24, known ? C.text : C.textDim);
      name.position.set(cx, y + (tile ? 36 : 42));
      if (name.width > tw - 16) name.scale.set((tw - 16) / name.width);
      const sub = label(known ? groupName(e.group) : t('Noch nicht gesehen'), 15, known ? color === 0x2e2838 ? C.textDim : C.accent : C.textDim);
      sub.position.set(cx, y + (tile ? 60 : 70));
      dyn.addChild(name, sub);
      if (known && fresh.has(e.key)) {
        const badge = label(t('NEU'), 14, 0x1a1a1a);
        const bw = badge.width + 16;
        const bg = drawPlate(new Graphics(), x + CELL_W - bw - 10, y + 22, bw, 22, C.money, { radius: 6, edge: 2, sheen: 0.4, outline: 2 });
        badge.position.set(x + CELL_W - bw / 2 - 10, y + 33);
        dyn.addChild(bg, badge);
      }
      if (!known) {
        const hint = richText(collectionHint(e), CELL_W - 28, { size: 15, theme: 'dark' });
        hint.position.set(x + CELL_W / 2, y + 96);
        dyn.addChild(hint);
      }
      if (known) {
        const d = richText(e.description + gainLine(e), tw - 12, { size: tile ? 14 : 15, theme: 'dark' });
        d.position.set(cx, y + (tile ? 76 : 92));
        const maxH = CELL_H - (tile ? 76 : 92) - 10;
        if (d.height > maxH) d.scale.set(maxH / d.height);
        dyn.addChild(d);
      }
    });

    if (pages > 1) {
      const prev = new Button('‹', 70, 56, 0x3b5068, () => { page = (page + pages - 1) % pages; render(); }, 30);
      prev.position.set(W / 2 - 150, H_NAV);
      const next = new Button('›', 70, 56, 0x3b5068, () => { page = (page + 1) % pages; render(); }, 30);
      next.position.set(W / 2 + 150, H_NAV);
      const pl = label(t('Seite {a} von {b}', { a: page + 1, b: pages }), 20, C.text);
      pl.position.set(W / 2, H_NAV);
      dyn.addChild(prev, next, pl);
    }
  };
  render();

  const closeBtn = new Button(t('Schließen'), 260, 60, 0xf2711c, () => { markAllSeen(); close(); }, 24);
  closeBtn.position.set(W - 190, COLLECTION_H - 50);
  box.addChild(closeBtn);
}

const H_NAV = COLLECTION_H - 50;

/** Anzeigename der Gruppe eines Eintrags (zur Laufzeit übersetzt) */
function groupName(group: string): string {
  const names: Record<string, string> = {
    common: t('Common'), uncommon: t('Uncommon'), rare: t('Rare'), legendary: t('Legendary'),
    sternbild: t('Sternbild'), elixier: t('Elixier'), omen: t('Omen'),
    tag: t('Skip Tag'), deck: t('Deck'),
  };
  return names[group] ?? group;
}
