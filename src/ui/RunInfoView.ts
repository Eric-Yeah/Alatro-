import { richText } from './richText';
import { Container, Graphics } from 'pixi.js';
import { BLIND_NAMES, blindReward, blindTarget } from '../core/blinds';
import { SUIT_SYMBOLS, rankLabel } from '../core/cards';
import { TAG_BY_ID, VOUCHER_BY_ID } from '../core/game';
import { BOSS_BY_ID, type RunState } from '../core/run';
import { blindRows, deckStats, handRows } from '../core/runInfo';
import { FINAL_ANTE } from '../data/blinds';
import { RANKS, SUITS } from '../data/cards';
import { C, SUIT_COLORS, fmt, fmtMult } from './theme';
import { t } from '../i18n';
import { Button, label, tabBar, wrapText } from './widgets';

export type RunInfoTab = 'hands' | 'blinds' | 'vouchers' | 'deck';
const TABS: { id: RunInfoTab; name: string }[] = [
  { id: 'hands', name: 'Hände' },
  { id: 'blinds', name: 'Blinds' },
  { id: 'vouchers', name: 'Vouchers und Tags' },
  { id: 'deck', name: 'Deck' },
];

export const RUN_INFO_W = 1100;
export const RUN_INFO_H = 820;

/** Run Info (Briefing 9.1): Hände mit Level, Blinds und Ziele, Vouchers, Deck. Baut in das gegebene Modal. */
export function buildRunInfo(box: Container, run: RunState, close: () => void, startTab: RunInfoTab = 'hands', openDeck?: () => void) {
  const W = RUN_INFO_W;
  const head = label('Run Info', 38);
  head.position.set(W / 2, 40);
  box.addChild(head);
  const content = new Container();
  content.position.set(40, 160);
  box.addChild(content);
  let bar: Container | null = null;

  const show = (tab: RunInfoTab) => {
    bar?.destroy({ children: true });
    bar = tabBar(TABS, W - 80, tab, show);
    bar.position.set(40, 82);
    box.addChild(bar);
    for (const c of [...content.children]) c.destroy({ children: true });
    if (tab === 'hands') hands(content, run);
    else if (tab === 'blinds') blinds(content, run);
    else if (tab === 'vouchers') vouchers(content, run);
    else deck(content, run, openDeck);
  };
  show(startTab);

  const closeBtn = new Button('Schließen', 260, 60, 0xf2711c, close, 24);
  closeBtn.position.set(W / 2, RUN_INFO_H - 50);
  box.addChild(closeBtn);
}

function hands(c: Container, run: RunState) {
  const colX = { level: 30, name: 130, score: 560, played: 990 };
  const heads: [string, number, number][] = [['Level', colX.level, 0], ['Hand', colX.name, 0], ['Chips × Mult', colX.score, 0.5], ['Gespielt', colX.played, 1]];
  for (const [text, x, anchor] of heads) {
    const l = label(text, 17, C.textDim);
    l.anchor.set(anchor, 0.5);
    l.position.set(x, 8);
    c.addChild(l);
  }
  handRows(run).forEach((r, i) => {
    const y = 26 + i * 43;
    const bg = new Graphics().roundRect(0, y, 1020, 38, 10).fill({ color: r.hidden ? 0x141d29 : C.panel, alpha: 0.9 });
    const lv = label(r.hidden ? '?' : `Lv ${r.level}`, 22, r.level > 1 ? C.money : C.text);
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
  const t = label(`Ante ${run.ante}${run.ante > FINAL_ANTE ? ' · Endless' : ''}`, 26, C.money);
  t.anchor.set(0, 0.5);
  t.position.set(0, 10);
  c.addChild(t);
  rows.forEach((r, i) => {
    const x = i * 345;
    const boss = r.bossId ? BOSS_BY_ID[r.bossId] : undefined;
    const bg = new Graphics()
      .roundRect(x, 36, 330, 190, 14).fill(r.state === 'current' ? (boss?.color ?? 0x2a7f8f) : C.panel)
      .stroke({ width: 2, color: r.state === 'current' ? 0xffffff : C.panelLine, alpha: 0.6 });
    const nm = label(r.name, 24);
    nm.position.set(x + 165, 66);
    if (nm.width > 300) nm.scale.set(300 / nm.width);
    const tg = label(fmt(r.target), 36, C.mult);
    tg.position.set(x + 165, 108);
    const rw = label(r.reward > 0 ? 'Belohnung ' + '$'.repeat(r.reward) : 'Keine Belohnung', 18, C.money);
    rw.position.set(x + 165, 140);
    const info = boss ? boss.description : r.tagId ? `Skip Tag: ${TAG_BY_ID[r.tagId].name}\n${TAG_BY_ID[r.tagId].description}` : '';
    const d = wrapText(info, 300, 15);
    d.position.set(x + 165, 160);
    c.addChild(bg, nm, tg, rw, d);
    if (r.state === 'done') bg.alpha = 0.5;
  });
  // Ziele aller Antes bis zum Final Ante
  const th = label('Ziele je Ante', 20, C.textDim);
  th.anchor.set(0, 0.5);
  th.position.set(0, 250);
  c.addChild(th);
  [' Ante', BLIND_NAMES.small, BLIND_NAMES.big, BLIND_NAMES.boss].forEach((n, i) => {
    const l = label(n.trim(), 17, C.textDim);
    l.position.set(80 + i * 250, 278);
    c.addChild(l);
  });
  for (let a = 1; a <= FINAL_ANTE; a++) {
    const y = 294 + (a - 1) * 32;
    if (a === run.ante) c.addChild(new Graphics().roundRect(0, y, 1020, 28, 8).fill({ color: C.accent, alpha: 0.35 }));
    const opts = { scaling: run.rules.scaling, deckFactor: run.rules.blindTargetFactor };
    const vals = [String(a), ...(['small', 'big', 'boss'] as const).map((k) => fmt(blindTarget(a, k, opts)))];
    vals.forEach((v, i) => {
      const l = label(v, 20, i === 0 ? C.money : C.text);
      l.position.set(80 + i * 250, y + 14);
      c.addChild(l);
    });
  }
  const note = label(`Boss Ziele ohne Boss Faktor. Belohnung: Small $${blindReward(run.ante, 'small', run.rules.smallBlindReward)}, Big $${blindReward(run.ante, 'big', null)}, Boss $${blindReward(run.ante, 'boss', null)}`, 14, C.textDim);
  note.anchor.set(0, 0.5);
  note.position.set(0, 294 + FINAL_ANTE * 32 + 10);
  c.addChild(note);
}

function vouchers(c: Container, run: RunState) {
  const h1 = label(`Vouchers (${run.vouchers.length})`, 24, C.money);
  h1.anchor.set(0, 0.5);
  h1.position.set(0, 10);
  c.addChild(h1);
  if (!run.vouchers.length) {
    const none = label('Noch keine Vouchers eingelöst', 20, C.textDim);
    none.anchor.set(0, 0.5);
    none.position.set(0, 60);
    c.addChild(none);
  }
  run.vouchers.forEach((id, i) => {
    const v = VOUCHER_BY_ID[id];
    const x = (i % 2) * 515;
    const y = 36 + Math.floor(i / 2) * 78;
    c.addChild(new Graphics().roundRect(x, y, 500, 68, 12).fill(C.panel).stroke({ width: 2, color: C.panelLine }));
    const n = label(v.name, 20, C.money);
    n.anchor.set(0, 0.5);
    n.position.set(x + 16, y + 20);
    const d = richText(v.description, 470, { size: 15, align: 'left', theme: 'dark' });
    d.position.set(x + 16, y + 38);
    c.addChild(n, d);
  });
  const ty = 36 + Math.ceil(Math.max(run.vouchers.length, 1) / 2) * 78 + 24;
  const h2 = label(`Offene Tags (${run.pendingTags.length})`, 24, C.accent);
  h2.anchor.set(0, 0.5);
  h2.position.set(0, ty);
  c.addChild(h2);
  if (!run.pendingTags.length) {
    const none = label('Keine offenen Tags', 20, C.textDim);
    none.anchor.set(0, 0.5);
    none.position.set(0, ty + 44);
    c.addChild(none);
  }
  run.pendingTags.forEach((id, i) => {
    const t = TAG_BY_ID[id];
    const l = label(`${t.name}: ${t.description}`, 18, C.text);
    l.anchor.set(0, 0.5);
    l.position.set(0, ty + 42 + i * 34);
    c.addChild(l);
  });
}

function deck(c: Container, run: RunState, openDeck?: () => void) {
  const s = deckStats(run);
  const title = label(`${s.total} Karten im Deck${s.remaining !== null ? `, ${s.remaining} im Nachziehstapel` : ''}, ${s.modified} mit Modifikator`, 22, C.text);
  title.anchor.set(0, 0.5);
  title.position.set(0, 10);
  c.addChild(title);
  const max = Math.max(1, ...Object.values(s.byRank));
  const barH = 220;
  RANKS.forEach((r, i) => {
    const x = 20 + i * 78;
    const n = s.byRank[r];
    const h = (n / max) * barH;
    c.addChild(new Graphics().roundRect(x, 60 + barH - h, 56, h, 6).fill(C.chips));
    const cnt = label(String(n), 20, C.text);
    cnt.position.set(x + 28, 60 + barH - h - 14);
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
    c.addChild(sym, n);
  });
  if (openDeck) {
    const btn = new Button(t('Deck ansehen'), 320, 60, C.chips, openDeck, 24);
    btn.position.set(510, 520);
    c.addChild(btn);
  }
}
