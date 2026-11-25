import { Container, Graphics, Rectangle } from 'pixi.js';
import { condProgress, earnedStars, rankOf, unlockedCount } from '../achievements';
import { collectionProgress } from '../collection';
import { ACHIEVEMENTS, CATEGORY_NAMES, CATEGORY_ORDER, TOTAL_STARS, type AchievementCategory, type AchievementDef } from '../data/achievements';
import { DECKS } from '../data/decks';
import { getProfile } from '../profile';
import { t } from '../i18n';
import { SHADOW } from '../data/depth';
import { drawInset, drawMeter, drawPlate, dropShadow } from './depth';
import { C, fmt, numLocale } from './theme';
import { Button, label, tabBar, wrapText } from './widgets';

export const ACH_W = 1280;
export const ACH_H = 860;

const COLS = 2;
const ROWS = 4;
const PER_PAGE = COLS * ROWS;
const CELL_W = 596;
const CELL_H = 124;
const GAP_X = 16;
const GAP_Y = 10;
const GRID_Y = 224;

type Tab = AchievementCategory | 'statistik';

/** Kleiner fünfzackiger Stern aus Grafikprimitiven (die Schrift hat keinen) */
function starShape(x: number, y: number, r: number, on: boolean): Graphics {
  return new Graphics().star(x, y, 5, r, r * 0.45).fill(on ? C.money : 0x2a3548).stroke({ width: 1.5, color: on ? 0x8a5a00 : 0x151c28 });
}

/** Fortschrittsbalken: vertiefte Rinne mit gefüllter Farbe */
function bar(x: number, y: number, w: number, frac: number, color: number): Graphics {
  return drawMeter(new Graphics(), x, y, w, 16, frac, color);
}

/** Achievements Ansicht: Rang, Erfolge nach Kategorien, Statistik. */
export function buildAchievements(box: Container, close: () => void) {
  const W = ACH_W;
  const p = getProfile();
  const ctx = { collection: collectionProgress().fraction };
  let tab: Tab = 'einstieg';
  let page = 0;

  const head = label(t('Erfolge'), 38);
  head.position.set(W / 2, 40);
  box.addChild(head);
  const dyn = new Container();
  box.addChild(dyn);

  const renderRank = () => {
    dyn.addChild(drawInset(new Graphics(), 40, 78, W - 80, 74, 0x24344a, { radius: 12 }));
    const rank = rankOf(p);
    const stars = earnedStars(p);
    const name = label(rank.name, 30, rank.color);
    name.anchor.set(0, 0.5);
    name.position.set(60, 104);
    const sub = label(t('{a} von {b} Erfolgen · {c} von {d} Sternen', { a: unlockedCount(p), b: ACHIEVEMENTS.length, c: stars, d: TOTAL_STARS }), 18, C.textDim);
    sub.anchor.set(0, 0.5);
    sub.position.set(60, 134);
    dyn.addChild(name, sub);
    const next = rank.next
      ? t('Noch {n} Stern bis {rank}|Noch {n} Sterne bis {rank}', { n: rank.starsToNext ?? 0, rank: rank.next })
      : t('Höchster Rang erreicht');
    const nl = label(next, 18, C.textDim);
    nl.anchor.set(1, 0.5);
    nl.position.set(W - 56, 104);
    dyn.addChild(nl, bar(W - 56 - 420, 124, 420, stars / TOTAL_STARS, rank.color));
  };

  const cell = (a: AchievementDef, x: number, y: number) => {
    const got = p.unlocked[a.id] !== undefined;
    const hidden = a.secret && !got;
    // freigeschaltet: erhabene Platte mit goldener Kontur und Glanz, gesperrt: vertieftes dunkles Feld
    const card = new Container();
    card.position.set(x, y);
    if (got) {
      card.addChild(dropShadow(CELL_W, CELL_H + 4, SHADOW.panel, { radius: 12 }));
      card.addChild(drawPlate(new Graphics(), 0, 0, CELL_W, CELL_H, 0x3a5070, { radius: 12, edge: 4, line: 0x6b4a08, sheen: 0 }));
      card.addChild(new Graphics().roundRect(12, 10, CELL_W - 24, 6, 3).fill(C.money));
    } else {
      card.addChild(drawInset(new Graphics(), 0, 0, CELL_W, CELL_H, 0x1b2636, { radius: 12 }));
    }
    card.boundsArea = new Rectangle(0, 0, CELL_W, CELL_H + 4);
    dyn.addChild(card);
    const name = label(hidden ? t('Geheimer Erfolg') : a.name, 24, got ? C.text : C.textDim);
    name.anchor.set(0, 0.5);
    name.position.set(x + 20, y + 38);
    if (name.width > CELL_W - 190) name.scale.set((CELL_W - 190) / name.width);
    for (let i = 0; i < 3; i++) dyn.addChild(starShape(x + CELL_W - 30 - i * 30, y + 38, 12, i < a.stars && got));
    const desc = wrapText(hidden ? t('Wird nicht verraten. Spiel einfach weiter.') : a.description, CELL_W - 40, 17, got ? C.text : C.textDim, 'left');
    desc.position.set(x + 20, y + 60);
    dyn.addChild(name, desc);
    if (got) {
      const d = new Date(p.unlocked[a.id]);
      const ut = label(t('Freigeschaltet am {date}', { date: d.toLocaleDateString(numLocale()) }), 14, C.green, { fontWeight: '600' });
      ut.anchor.set(0, 0.5);
      ut.position.set(x + 20, y + CELL_H - 18);
      dyn.addChild(ut);
    } else if (!hidden) {
      const pr = condProgress(a.cond, p, null, ctx);
      if (pr) {
        dyn.addChild(bar(x + 20, y + CELL_H - 26, CELL_W - 190, pr.cur / pr.max, C.chips));
        const pt = label(`${fmt(pr.cur)} / ${fmt(pr.max)}`, 16, C.textDim);
        pt.anchor.set(1, 0.5);
        pt.position.set(x + CELL_W - 20, y + CELL_H - 19);
        dyn.addChild(pt);
      } else {
        const lk = label(t('Gesperrt'), 15, C.textDim, { fontWeight: '600' });
        lk.anchor.set(0, 0.5);
        lk.position.set(x + 20, y + CELL_H - 18);
        dyn.addChild(lk);
      }
    }
  };

  const renderStats = () => {
    const s = p.stats;
    const days = Object.keys(p.daily).length;
    const rows: [string, string][] = [
      [t('Runs gespielt'), fmt(s.runs)],
      [t('Runs gewonnen'), fmt(s.wins)],
      [t('Runs verloren'), fmt(s.losses)],
      [t('Höchstes Ante'), fmt(s.bestAnte)],
      [t('Beste Hand'), fmt(s.bestHand)],
      [t('Hands gespielt'), fmt(s.hands)],
      [t('Discards genutzt'), fmt(s.discards)],
      [t('Blinds gewonnen'), fmt(s.blindsWon)],
      [t('Bosse besiegt'), fmt(s.bossesBeaten)],
      [t('Blinds übersprungen'), fmt(s.skips)],
      [t('Jokers gekauft'), fmt(s.jokersBought)],
      [t('Rerolls'), fmt(s.rerolls)],
      [t('Höchster Geldstand'), '$' + fmt(s.moneyPeak)],
      [t('Beste Siegstufe (skalierend)'), p.bestScale ? t('Stufe {n}', { n: p.bestScale }) : t('noch keine')],
      [t('Tageslauf Tage'), fmt(days)],
      [t('Sammlung entdeckt'), `${Math.round(ctx.collection * 100)}%`],
    ];
    rows.forEach(([k, v], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 48 + col * (CELL_W + GAP_X);
      const y = GRID_Y + 6 + row * 50;
      dyn.addChild(drawInset(new Graphics(), x, y, CELL_W, 42, row % 2 === 0 ? 0x2a3b52 : 0x243449, { radius: 10, outline: 2 }));
      const kl = label(k, 20, C.textDim);
      kl.anchor.set(0, 0.5);
      kl.position.set(x + 16, y + 21);
      const vl = label(v, 22, C.text);
      vl.anchor.set(1, 0.5);
      vl.position.set(x + CELL_W - 16, y + 21);
      dyn.addChild(kl, vl);
    });
    const wins = DECKS.map((d) => `${d.name} ${p.winsByDeck[d.id] ?? 0}`).join('   ');
    const wl = wrapText(t('Siege je Deck:  {wins}', { wins }), W - 96, 17, C.textDim, 'left');
    wl.position.set(48, GRID_Y + 6 + 8 * 50 + 14);
    dyn.addChild(wl);
  };

  const render = () => {
    for (const c of [...dyn.children]) c.destroy({ children: true });
    renderRank();
    const tabs = [
      ...CATEGORY_ORDER.map((id) => ({ id: id as Tab, name: CATEGORY_NAMES[id] })),
      { id: 'statistik' as Tab, name: t('Statistik') },
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
    const info = label(t('{name}: {a} von {b}', { name: CATEGORY_NAMES[tab], a: got, b: list.length }), 20, C.textDim);
    info.anchor.set(0, 0.5);
    info.position.set(48, ACH_H - 52);
    dyn.addChild(info);
    if (pages > 1) {
      const prev = new Button('‹', 70, 56, 0x3b5068, () => { page = (page + pages - 1) % pages; render(); }, 30);
      prev.position.set(W / 2 - 140, ACH_H - 52);
      const next = new Button('›', 70, 56, 0x3b5068, () => { page = (page + 1) % pages; render(); }, 30);
      next.position.set(W / 2 + 140, ACH_H - 52);
      const pl = label(t('Seite {a} von {b}', { a: page + 1, b: pages }), 16, C.textDim);
      pl.position.set(W / 2, ACH_H - 52);
      dyn.addChild(prev, next, pl);
    }
  };
  render();

  const closeBtn = new Button(t('Schließen'), 220, 60, 0xf2711c, close, 24);
  closeBtn.position.set(W - 150, ACH_H - 50);
  box.addChild(closeBtn);
}
