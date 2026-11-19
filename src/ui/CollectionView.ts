import { richText } from './richText';
import { Container, Graphics } from 'pixi.js';
import { COLLECTION_TABS, collectionEntries, loadDiscovered, type CollectionEntry, type CollectionTab } from '../collection';
import { C, CONSUMABLE_COLORS, RARITY_COLORS } from './theme';
import { Button, label, tabBar } from './widgets';

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

/** Sammlung: alle Inhalte nach Reitern, nicht gesehene Einträge bleiben verdeckt. */
export function buildCollection(box: Container, close: () => void) {
  const W = COLLECTION_W;
  const found = new Set(loadDiscovered());
  let tab: CollectionTab = 'jokers';
  let page = 0;

  const head = label('Sammlung', 38);
  head.position.set(W / 2, 40);
  box.addChild(head);
  const dyn = new Container();
  box.addChild(dyn);

  const render = () => {
    for (const c of [...dyn.children]) c.destroy({ children: true });
    const bar = tabBar(COLLECTION_TABS, W - 80, tab, (id) => { tab = id; page = 0; render(); }, 16);
    bar.position.set(40, 82);
    dyn.addChild(bar);

    const entries = collectionEntries(tab);
    const seen = entries.filter((e) => found.has(e.key)).length;
    const count = label(`${seen} von ${entries.length} entdeckt`, 20, C.textDim);
    count.position.set(W / 2, 156);
    dyn.addChild(count);

    const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
    page = Math.min(page, pages - 1);
    entries.slice(page * PER_PAGE, (page + 1) * PER_PAGE).forEach((e, i) => {
      const x = 40 + (i % COLS) * (CELL_W + GAP);
      const y = 190 + Math.floor(i / COLS) * (CELL_H + GAP);
      const known = found.has(e.key);
      const color = entryColor(e);
      dyn.addChild(new Graphics()
        .roundRect(x, y + 4, CELL_W, CELL_H, 14).fill({ color: 0, alpha: 0.35 })
        .roundRect(x, y, CELL_W, CELL_H, 14).fill(known ? C.panel : 0x141d29).stroke({ width: 3, color: known ? color : C.panelLine }));
      if (known) dyn.addChild(new Graphics().roundRect(x + 10, y + 10, CELL_W - 20, 8, 4).fill(color));
      const name = label(known ? e.name : '???', 24, known ? C.text : C.textDim);
      name.position.set(x + CELL_W / 2, y + 42);
      if (name.width > CELL_W - 24) name.scale.set((CELL_W - 24) / name.width);
      const sub = label(known ? groupName(e.group) : 'Noch nicht gesehen', 15, known ? color === 0x2e2838 ? C.textDim : C.accent : C.textDim);
      sub.position.set(x + CELL_W / 2, y + 70);
      dyn.addChild(name, sub);
      if (known) {
        const d = richText(e.description, CELL_W - 28, { size: 15, theme: 'dark' });
        d.position.set(x + CELL_W / 2, y + 92);
        dyn.addChild(d);
      }
    });

    if (pages > 1) {
      const prev = new Button('‹', 70, 56, 0x3b5068, () => { page = (page + pages - 1) % pages; render(); }, 30);
      prev.position.set(W / 2 - 150, H_NAV);
      const next = new Button('›', 70, 56, 0x3b5068, () => { page = (page + 1) % pages; render(); }, 30);
      next.position.set(W / 2 + 150, H_NAV);
      const pl = label(`Seite ${page + 1} von ${pages}`, 20, C.text);
      pl.position.set(W / 2, H_NAV);
      dyn.addChild(prev, next, pl);
    }
  };
  render();

  const closeBtn = new Button('Schließen', 260, 60, 0xf2711c, close, 24);
  closeBtn.position.set(W - 190, COLLECTION_H - 50);
  box.addChild(closeBtn);
}

const H_NAV = COLLECTION_H - 50;

const GROUP_NAMES: Record<string, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare', legendary: 'Legendary',
  sternbild: 'Sternbild', elixier: 'Elixier', omen: 'Omen',
  tag: 'Skip Tag', deck: 'Deck',
};

function groupName(group: string): string {
  return GROUP_NAMES[group] ?? group;
}
