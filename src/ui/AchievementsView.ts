import { Container, Graphics } from 'pixi.js';
import { condProgress, earnedStars, rankOf, unlockedCount } from '../achievements';
import { collectionProgress } from '../collection';
import { ACHIEVEMENTS, CATEGORY_NAMES, CATEGORY_ORDER, TOTAL_STARS, type AchievementCategory, type AchievementDef } from '../data/achievements';
import { DECKS } from '../data/decks';
import { getProfile } from '../profile';
import { C, fmt } from './theme';
import { Button, label, tabBar, wrapText } from './widgets';

export const ACH_W = 1280;
export const ACH_H = 860;

const COLS = 2;
const ROWS = 4;
const PER_PAGE = COLS * ROWS;
const CELL_W = 596;
const CELL_H = 128;
const GAP_X = 16;
const GAP_Y = 12;
const GRID_Y = 214;

type Tab = AchievementCategory | 'statistik';

/** Kleiner fünfzackiger Stern aus Grafikprimitiven (die Schrift hat keinen) */
function starShape(x: number, y: number, r: number, on: boolean): Graphics {
  return new Graphics().star(x, y, 5, r, r * 0.45).fill(on ? C.money : 0x2a3548).stroke({ width: 1.5, color: on ? 0x8a5a00 : 0x151c28 });
}

function bar(x: number, y: number, w: number, frac: number, color: number): Graphics {
  const g = new Graphics().roundRect(x, y, w, 14, 7).fill(0x0f1622).stroke({ width: 2, color: C.panelLine });
  if (frac > 0) g.roundRect(x + 2, y + 2, Math.max(10, (w - 4) * Math.min(1, frac)), 10, 5).fill(color);
  return g;
}

/** Achievements Ansicht: Rang, Erfolge nach Kategorien, Statistik. */
export function buildAchievements(box: Container, close: () => void) {
  const W = ACH_W;
  const p = getProfile();
  const ctx = { collection: collectionProgress().fraction };
  let tab: Tab = 'einstieg';
  let page = 0;

  const head = label('Erfolge', 38);
  head.position.set(W / 2, 40);
  box.addChild(head);
  const dyn = new Container();
  box.addChild(dyn);

  const renderRank = () => {
    const rank = rankOf(p);
    const stars = earnedStars(p);
    const name = label(rank.name, 30, rank.color);
    name.anchor.set(0, 0.5);
    name.position.set(48, 108);
    const sub = label(`${unlockedCount(p)} von ${ACHIEVEMENTS.length} Erfolgen · ${stars} von ${TOTAL_STARS} Sternen`, 18, C.textDim);
    sub.anchor.set(0, 0.5);
    sub.position.set(48, 142);
    dyn.addChild(name, sub);
    const next = rank.next
      ? `Noch ${rank.starsToNext} ${rank.starsToNext === 1 ? 'Stern' : 'Sterne'} bis ${rank.next}`
      : 'Höchster Rang erreicht';
    const nl = label(next, 18, C.textDim);
    nl.anchor.set(1, 0.5);
    nl.position.set(W - 48, 108);
    dyn.addChild(nl, bar(W - 48 - 420, 128, 420, stars / TOTAL_STARS, rank.color));
  };

  const cell = (a: AchievementDef, x: number, y: number) => {
    const got = p.unlocked[a.id] !== undefined;
    const hidden = a.secret && !got;
    const g = new Graphics()
      .roundRect(x, y + 4, CELL_W, CELL_H, 14).fill({ color: 0, alpha: 0.35 })
      .roundRect(x, y, CELL_W, CELL_H, 14).fill(got ? C.panel : 0x141d29).stroke({ width: 3, color: got ? C.money : C.panelLine });
    dyn.addChild(g);
    if (got) dyn.addChild(new Graphics().roundRect(x + 10, y + 10, CELL_W - 20, 6, 3).fill(C.money));
    const name = label(hidden ? 'Geheimer Erfolg' : a.name, 24, got ? C.text : C.textDim);
    name.anchor.set(0, 0.5);
    name.position.set(x + 20, y + 38);
    if (name.width > CELL_W - 190) name.scale.set((CELL_W - 190) / name.width);
    for (let i = 0; i < 3; i++) dyn.addChild(starShape(x + CELL_W - 30 - i * 30, y + 38, 12, i < a.stars && got));
    const desc = wrapText(hidden ? 'Wird nicht verraten. Spiel einfach weiter.' : a.description, CELL_W - 40, 17, got ? C.text : C.textDim, 'left');
    desc.position.set(x + 20, y + 60);
    dyn.addChild(name, desc);
    if (got) {
      const d = new Date(p.unlocked[a.id]);
      const t = label(`Freigeschaltet am ${d.toLocaleDateString('de-DE')}`, 14, C.green, { fontWeight: '600' });
      t.anchor.set(0, 0.5);
      t.position.set(x + 20, y + CELL_H - 18);
      dyn.addChild(t);
    } else if (!hidden) {
      const pr = condProgress(a.cond, p, null, ctx);
      if (pr) {
        dyn.addChild(bar(x + 20, y + CELL_H - 26, CELL_W - 190, pr.cur / pr.max, C.chips));
        const t = label(`${fmt(pr.cur)} / ${fmt(pr.max)}`, 16, C.textDim);
        t.anchor.set(1, 0.5);
        t.position.set(x + CELL_W - 20, y + CELL_H - 19);
        dyn.addChild(t);
      } else {
        const t = label('Gesperrt', 15, C.textDim, { fontWeight: '600' });
        t.anchor.set(0, 0.5);
        t.position.set(x + 20, y + CELL_H - 18);
        dyn.addChild(t);
      }
    }
  };

  const renderStats = () => {
    const s = p.stats;
    const days = Object.keys(p.daily).length;
    const rows: [string, string][] = [
      ['Runs gespielt', fmt(s.runs)],
      ['Runs gewonnen', fmt(s.wins)],
      ['Runs verloren', fmt(s.losses)],
      ['Höchstes Ante', fmt(s.bestAnte)],
      ['Beste Hand', fmt(s.bestHand)],
      ['Hands gespielt', fmt(s.hands)],
      ['Discards genutzt', fmt(s.discards)],
      ['Blinds gewonnen', fmt(s.blindsWon)],
      ['Bosse besiegt', fmt(s.bossesBeaten)],
      ['Blinds übersprungen', fmt(s.skips)],
      ['Jokers gekauft', fmt(s.jokersBought)],
      ['Rerolls', fmt(s.rerolls)],
      ['Höchster Geldstand', '$' + fmt(s.moneyPeak)],
      ['Beste Siegstufe (skalierend)', p.bestScale ? `Stufe ${p.bestScale}` : 'noch keine'],
      ['Tageslauf Tage', fmt(days)],
      ['Sammlung entdeckt', `${Math.round(ctx.collection * 100)}%`],
    ];
    rows.forEach(([k, v], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 48 + col * (CELL_W + GAP_X);
      const y = GRID_Y + 6 + row * 50;
      dyn.addChild(new Graphics().roundRect(x, y, CELL_W, 42, 10).fill(row % 2 === 0 ? 0x1b2636 : 0x172130));
      const kl = label(k, 20, C.textDim);
      kl.anchor.set(0, 0.5);
      kl.position.set(x + 16, y + 21);
      const vl = label(v, 22, C.text);
      vl.anchor.set(1, 0.5);
      vl.position.set(x + CELL_W - 16, y + 21);
      dyn.addChild(kl, vl);
    });
    const wins = DECKS.map((d) => `${d.name} ${p.winsByDeck[d.id] ?? 0}`).join('   ');
    const wl = wrapText(`Siege je Deck:  ${wins}`, W - 96, 17, C.textDim, 'left');
    wl.position.set(48, GRID_Y + 6 + 8 * 50 + 14);
    dyn.addChild(wl);
  };

  const render = () => {
    for (const c of [...dyn.children]) c.destroy({ children: true });
    renderRank();
    const tabs = [
      ...CATEGORY_ORDER.map((id) => ({ id: id as Tab, name: CATEGORY_NAMES[id] })),
      { id: 'statistik' as Tab, name: 'Statistik' },
    ];
    const bar2 = tabBar(tabs, W - 96, tab, (id) => { tab = id; page = 0; render(); }, 16);
    bar2.position.set(48, 160);
    dyn.addChild(bar2);

    if (tab === 'statistik') {
      renderStats();
      return;
    }
    const list = ACHIEVEMENTS.filter((a) => a.category === tab);
    const got = list.filter((a) => p.unlocked[a.id] !== undefined).length;
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    page = Math.min(page, pages - 1);
    list.slice(page * PER_PAGE, (page + 1) * PER_PAGE).forEach((a, i) => {
      cell(a, 48 + (i % COLS) * (CELL_W + GAP_X), GRID_Y + Math.floor(i / COLS) * (CELL_H + GAP_Y));
    });
    const info = label(`${CATEGORY_NAMES[tab]}: ${got} von ${list.length}`, 20, C.textDim);
    info.anchor.set(0, 0.5);
    info.position.set(48, ACH_H - 52);
    dyn.addChild(info);
    if (pages > 1) {
      const prev = new Button('‹', 70, 56, 0x3b5068, () => { page = (page + pages - 1) % pages; render(); }, 30);
      prev.position.set(W / 2 - 140, ACH_H - 52);
      const next = new Button('›', 70, 56, 0x3b5068, () => { page = (page + 1) % pages; render(); }, 30);
      next.position.set(W / 2 + 140, ACH_H - 52);
      const pl = label(`Seite ${page + 1} von ${pages}`, 16, C.textDim);
      pl.position.set(W / 2, ACH_H - 52);
      dyn.addChild(prev, next, pl);
    }
  };
  render();

  const closeBtn = new Button('Schließen', 220, 60, 0xf2711c, close, 24);
  closeBtn.position.set(W - 150, ACH_H - 50);
  box.addChild(closeBtn);
}
