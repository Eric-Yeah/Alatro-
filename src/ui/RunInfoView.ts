import { richText } from './richText';
import { t } from '../i18n';
import { Container, Graphics } from 'pixi.js';
import { BLIND_NAMES, blindReward, blindTarget } from '../core/blinds';
import { SUIT_SYMBOLS, rankLabel } from '../core/cards';
import { TAG_BY_ID, VOUCHER_BY_ID } from '../core/game';
import { BOSS_BY_ID, type RunState } from '../core/run';
import { blindRows, deckStats, handRows } from '../core/runInfo';
import { FINAL_ANTE } from '../data/blinds';
import { RANKS, SUITS } from '../data/cards';
import { SHADOW } from '../data/depth';
import { drawInset, drawPlate, raised } from './depth';
import { lighten } from './depthMath';
import { drawRow, tabTrough } from './tileDepth';
import { C, SUIT_COLORS, fmt, fmtMult, shade } from './theme';
import { Button, label, tabBar, wrapText } from './widgets';

export type RunInfoTab = 'hands' | 'blinds' | 'vouchers' | 'deck';
/** Reiter, zur Laufzeit übersetzt */
const tabs = (): { id: RunInfoTab; name: string }[] => [
  { id: 'hands', name: t('Hände') },
  { id: 'blinds', name: t('Blinds') },
  { id: 'vouchers', name: t('Vouchers und Tags') },
  { id: 'deck', name: t('Deck') },
];

export const RUN_INFO_W = 1100;
export const RUN_INFO_H = 820;

/** Run Info (Briefing 9.1): Hände mit Level, Blinds und Ziele, Vouchers, Deck. Baut in das gegebene Modal. */
export function buildRunInfo(box: Container, run: RunState, close: () => void, startTab: RunInfoTab = 'hands', openDeck?: () => void) {
  const W = RUN_INFO_W;
  const head = label(t('Run Info'), 38);
  head.position.set(W / 2, 40);
  box.addChild(head);
  const content = new Container();
  content.position.set(40, 160);
  box.addChild(content);
  let bar: Container | null = null;

  const show = (tab: RunInfoTab) => {
    bar?.destroy({ children: true });
    // Rinne hinter den Reitern: der aktive Reiter (farbig) liegt wie ein Schalter darin
    bar = new Container();
    bar.position.set(40, 82);
    bar.addChild(tabTrough(W - 80), tabBar(tabs(), W - 80, tab, show));
    box.addChild(bar);
    for (const c of [...content.children]) c.destroy({ children: true });
    if (tab === 'hands') hands(content, run);
    else if (tab === 'blinds') blinds(content, run);
    else if (tab === 'vouchers') vouchers(content, run);
    else deck(content, run, openDeck);
  };
  show(startTab);

  const closeBtn = new Button(t('Schließen'), 260, 60, 0xf2711c, close, 24);
  closeBtn.position.set(W / 2, RUN_INFO_H - 50);
  box.addChild(closeBtn);
}

function hands(c: Container, run: RunState) {
  const colX = { level: 30, name: 130, score: 560, played: 990 };
  const heads: [string, number, number][] = [[t('Level'), colX.level, 0], [t('Hand'), colX.name, 0], [t('Chips × Mult'), colX.score, 0.5], [t('Gespielt'), colX.played, 1]];
  for (const [text, x, anchor] of heads) {
    const l = label(text, 17, C.textDim);
    l.anchor.set(anchor, 0.5);
    l.position.set(x, 8);
    c.addChild(l);
  }
  handRows(run).forEach((r, i) => {
    const y = 26 + i * 43;
    // Listenzeile vertieft; Hände mit Level über 1 bekommen einen goldenen Schimmer am Rand
    const bg = drawRow(new Graphics(), 0, y, 1020, 38, r.hidden ? 0x141d29 : C.panel, { radius: 10, alpha: 0.95, line: !r.hidden && r.level > 1 ? shade(C.money, 0.45) : C.panelLine });
    const lv = label(r.hidden ? '?' : t('Lv {n}', { n: r.level }), 22, r.level > 1 ? C.money : C.text);
    lv.anchor.set(0, 0.5);
    lv.position.set(colX.level, y + 19);
    const nm = label(r.name, 24, r.hidden ? C.textDim : C.text);
    nm.anchor.set(0, 0.5);
    nm.position.set(colX.name, y + 19);
    c.addChild(bg, lv, nm);
    if (!r.hidden) {
      const ch = label(fmt(r.chips), 24, C.chips);
      ch.anchor.set(1, 0.5);
      ch.position.set(colX.score - 20, y + 19);
      const x = label('×', 22, C.textDim);
      x.position.set(colX.score, y + 19);
      const mu = label(fmtMult(r.mult), 24, C.mult);
      mu.anchor.set(0, 0.5);
      mu.position.set(colX.score + 20, y + 19);
      c.addChild(ch, x, mu);
    }
    const pl = label(String(r.played), 22, C.text);
    pl.anchor.set(1, 0.5);
    pl.position.set(colX.played, y + 19);
    c.addChild(pl);
  });
}

function blinds(c: Container, run: RunState) {
  const rows = blindRows(run);
  const at = label(t('Ante {n}', { n: run.ante }) + (run.ante > FINAL_ANTE ? ' · Endless' : ''), 26, C.money);
  at.anchor.set(0, 0.5);
  at.position.set(0, 10);
  c.addChild(at);
  rows.forEach((r, i) => {
    const x = i * 345;
    const boss = r.bossId ? BOSS_BY_ID[r.bossId] : undefined;
    // erhabene Karte mit weichem Schatten, die aktuelle Blind in Farbe des Bosses mit heller Kante
    const color = r.state === 'current' ? (boss?.color ?? 0x2a7f8f) : C.panel;
    const bg = raised(330, 190, color, { radius: 14, line: r.state === 'current' ? lighten(color, 0.6) : C.panelLine, shadow: SHADOW.panel, sheen: 0.3 });
    bg.position.set(x, 36);
    const nm = label(r.name, 24);
    nm.position.set(x + 165, 66);
    if (nm.width > 300) nm.scale.set(300 / nm.width);
    const tg = label(fmt(r.target), 36, C.mult);
    tg.position.set(x + 165, 108);
    const rw = label(r.reward > 0 ? t('Belohnung {money}', { money: '$'.repeat(r.reward) }) : t('Keine Belohnung'), 18, C.money);
    rw.position.set(x + 165, 140);
    const info = boss ? boss.description : r.tagId ? `${t('Skip Tag: {name}', { name: TAG_BY_ID[r.tagId].name })}\n${TAG_BY_ID[r.tagId].description}` : '';
    const d = wrapText(info, 300, 15);
    d.position.set(x + 165, 160);
    c.addChild(bg, nm, tg, rw, d);
    if (r.state === 'done') bg.alpha = 0.5;
  });
  // Ziele aller Antes bis zum Final Ante
  // vertiefte Tafel hinter der Tabelle
  c.addChild(drawInset(new Graphics(), -12, 230, 1044, 322, 0x1d2a3a, { radius: 14 }));
  const th = label(t('Ziele je Ante'), 20, C.textDim);
  th.anchor.set(0, 0.5);
  th.position.set(8, 250);
  c.addChild(th);
  [t('Ante'), BLIND_NAMES.small, BLIND_NAMES.big, BLIND_NAMES.boss].forEach((n, i) => {
    const l = label(n.trim(), 17, C.textDim);
    l.position.set(80 + i * 250, 278);
    c.addChild(l);
  });
  for (let a = 1; a <= FINAL_ANTE; a++) {
    const y = 294 + (a - 1) * 32;
    // aktuelle Ante: erhabene orange Leiste
    if (a === run.ante) c.addChild(drawPlate(new Graphics(), 0, y, 1020, 28, shade(C.accent, 0.62), { radius: 8, edge: 2, sheen: 0.4, outline: 2 }));
    const opts = { scaling: run.rules.scaling, deckFactor: run.rules.blindTargetFactor };
    const vals = [String(a), ...(['small', 'big', 'boss'] as const).map((k) => fmt(blindTarget(a, k, opts)))];
    vals.forEach((v, i) => {
      const l = label(v, 20, i === 0 ? C.money : C.text);
      l.position.set(80 + i * 250, y + 14);
      c.addChild(l);
    });
  }
  const note = label(t('Boss Ziele ohne Boss Faktor. Belohnung: Small {small}, Big {big}, Boss {boss}', { small: '$' + blindReward(run.ante, 'small', run.rules.smallBlindReward), big: '$' + blindReward(run.ante, 'big', null), boss: '$' + blindReward(run.ante, 'boss', null) }), 14, C.textDim);
  note.anchor.set(0, 0.5);
  note.position.set(0, 294 + FINAL_ANTE * 32 + 24);
  if (note.width > 1020) note.scale.set(1020 / note.width);
  c.addChild(note);
}

function vouchers(c: Container, run: RunState) {
  const h1 = label(t('Vouchers ({n})', { n: run.vouchers.length }), 24, C.money);
  h1.anchor.set(0, 0.5);
  h1.position.set(0, 10);
  c.addChild(h1);
  if (!run.vouchers.length) {
    const none = label(t('Noch keine Vouchers eingelöst'), 20, C.textDim);
    none.anchor.set(0, 0.5);
    none.position.set(0, 60);
    c.addChild(none);
  }
  run.vouchers.forEach((id, i) => {
    const v = VOUCHER_BY_ID[id];
    const x = (i % 2) * 515;
    const y = 36 + Math.floor(i / 2) * 78;
    c.addChild(drawRow(new Graphics(), x, y, 500, 68, C.panel, { radius: 12, line: shade(C.money, 0.4) }));
    const n = label(v.name, 20, C.money);
    n.anchor.set(0, 0.5);
    n.position.set(x + 16, y + 20);
    const d = richText(v.description, 470, { size: 15, align: 'left', theme: 'dark' });
    d.position.set(x + 16, y + 38);
    c.addChild(n, d);
  });
  const ty = 36 + Math.ceil(Math.max(run.vouchers.length, 1) / 2) * 78 + 24;
  const h2 = label(t('Offene Tags ({n})', { n: run.pendingTags.length }), 24, C.accent);
  h2.anchor.set(0, 0.5);
  h2.position.set(0, ty);
  c.addChild(h2);
  if (!run.pendingTags.length) {
    const none = label(t('Keine offenen Tags'), 20, C.textDim);
    none.anchor.set(0, 0.5);
    none.position.set(0, ty + 44);
    c.addChild(none);
  }
  run.pendingTags.forEach((id, i) => {
    const tag = TAG_BY_ID[id];
    const l = label(`${tag.name}: ${tag.description}`, 18, C.text);
    l.anchor.set(0, 0.5);
    l.position.set(14, ty + 42 + i * 34);
    if (l.width > 990) l.scale.set(990 / l.width);
    c.addChild(drawRow(new Graphics(), 0, ty + 42 + i * 34 - 15, 1020, 30, C.panel, { radius: 8 }), l);
  });
}

function deck(c: Container, run: RunState, openDeck?: () => void) {
  const s = deckStats(run);
  const head = label(
    t('{n} Karte im Deck|{n} Karten im Deck', { n: s.total })
    + (s.remaining !== null ? t(', {n} im Nachziehstapel', { n: s.remaining }) : '')
    + t(', {n} mit Modifikator', { n: s.modified }), 22, C.text);
  head.anchor.set(0, 0.5);
  head.position.set(0, 10);
  c.addChild(head);
  const max = Math.max(1, ...Object.values(s.byRank));
  const barH = 220;
  RANKS.forEach((r, i) => {
    const x = 20 + i * 78;
    const n = s.byRank[r];
    const h = (n / max) * barH;
    // Rinne und glänzender Balken
    const bar = new Graphics();
    drawInset(bar, x - 3, 60 - 4, 62, barH + 10, 0x1d2a3a, { radius: 8, outline: 2 });
    if (h > 0) {
      const bh = Math.max(8, h);
      // flache Farbe, harter dunkler Unterrand, kleiner Lichtstreifen oben
      bar.roundRect(x, 60 + barH - bh, 56, bh, 6).fill(shade(C.chips, 0.6));
      bar.roundRect(x, 60 + barH - bh, 56, Math.max(4, bh - 4), 6).fill(C.chips);
      if (bh > 12) bar.roundRect(x + 6, 60 + barH - bh + 3, 18, 3, 1.5).fill({ color: 0xffffff, alpha: 0.35 });
    }
    c.addChild(bar);
    const cnt = label(String(n), 20, C.text);
    cnt.position.set(x + 28, 40);
    const rl = label(rankLabel(r), 24, C.textDim);
    rl.position.set(x + 28, 60 + barH + 24);
    c.addChild(cnt, rl);
  });
  SUITS.forEach((suit, i) => {
    const x = 120 + i * 230;
    const color = suit === 'S' ? 0x8f9bff : SUIT_COLORS[suit];
    const sym = label(SUIT_SYMBOLS[suit], 56, color);
    sym.position.set(x, 400);
    const n = label(String(s.bySuit[suit]), 34, C.text);
    n.position.set(x + 70, 402);
    // vertieftes Wertfeld hinter Zeichen und Zahl
    c.addChild(drawInset(new Graphics(), x - 46, 368, 174, 66, 0x1d2a3a, { radius: 12 }), sym, n);
  });
  if (openDeck) {
    const btn = new Button(t('Deck ansehen'), 320, 60, C.chips, openDeck, 24);
    btn.position.set(510, 520);
    c.addChild(btn);
  }
}
