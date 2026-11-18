import { Container, Graphics, Text, type FederatedPointerEvent } from 'pixi.js';
import { BLIND_INFO, BLIND_KINDS, FINAL_ANTE, blindTarget, type BlindKind } from '../core/blinds';
import { sortByRank, sortBySuit } from '../core/cards';
import { HAND_INFO } from '../core/hands';
import { JOKERS, JOKER_BY_ID } from '../core/jokers';
import { randomSeed } from '../core/rng';
import {
  MAX_SELECT, addJoker, computeEarnings, discardCards, drawToHandSize, finishRound, isRoundLost, isRoundWon,
  jokerOffer, newRun, playCards, sellValue, startRound, type RunState,
} from '../core/run';
import { previewHand, type ScoreEvent } from '../core/scoring';
import { loadRun, saveRun } from '../save';
import { CARD_H, CardView, cardBack } from './CardView';
import { JokerView } from './JokerView';
import { C, FONT, RARITY_COLORS, RARITY_NAMES, VIEW_H, VIEW_W, fmt, fmtMult } from './theme';
import { easeInOutCubic, easeOutBack, juice, tween, wait } from './tween';
import { Button, label, overlay, panel, popup } from './widgets';

const MX = 850; // centre of the play area
const HAND_Y = 775;
const PLAY_Y = 450;
const DECK_X = 1370;
const DECK_Y = 785;
const JOKER_Y = 118;
const JOKER_TRAY_X = 380;
const JOKER_TRAY_W = 760;
const JOKER_SPACING = 122;

const BLIND_COLORS: Record<BlindKind, number> = { small: 0x2a7f8f, big: 0xc9822b, boss: 0xa8324a };

type SortMode = 'rank' | 'suit';

export class Game {
  readonly root = new Container();

  private run: RunState | null = null;
  private busy = false;
  private sortMode: SortMode = 'rank';

  private table = new Container();
  private jokerLayer = new Container();
  private playLayer = new Container();
  private handLayer = new Container();
  private fxLayer = new Container();
  private overlayLayer = new Container();

  private cardViews = new Map<number, CardView>();
  private jokerViews = new Map<number, JokerView>();
  private tooltip: Container | null = null;

  // Sidebar
  private blindBg = new Graphics();
  private blindName!: Text;
  private targetText!: Text;
  private rewardText!: Text;
  private scoreText!: Text;
  private handName!: Text;
  private handLevel!: Text;
  private chipsBox = new Container();
  private multBox = new Container();
  private chipsText!: Text;
  private multText!: Text;
  private handsText!: Text;
  private discardsText!: Text;
  private moneyText!: Text;
  private anteText!: Text;
  private roundText!: Text;
  private seedText!: Text;
  private jokerCount!: Text;
  private deckCount!: Text;
  private totalText!: Text;

  private playBtn!: Button;
  private discardBtn!: Button;
  private sortRankBtn!: Button;
  private sortSuitBtn!: Button;

  constructor() {
    this.handLayer.sortableChildren = true;
    this.jokerLayer.sortableChildren = true;
    this.root.addChild(this.table, this.jokerLayer, this.playLayer, this.handLayer, this.fxLayer, this.overlayLayer);
    this.buildTable();
    this.showMainMenu();
  }

  // ────────────────────────────────────────────────────────────── static layout

  private buildTable() {
    const t = this.table;

    // Invisible catcher: tapping empty space closes tooltips
    const catcher = new Graphics().rect(0, 0, VIEW_W, VIEW_H).fill({ color: 0, alpha: 0.001 });
    catcher.eventMode = 'static';
    catcher.on('pointertap', () => this.closeTooltip());
    t.addChild(catcher);

    // Sidebar background
    const side = new Graphics().roundRect(10, 10, 350, VIEW_H - 20, 18).fill({ color: 0x0e0b1a, alpha: 0.55 });
    t.addChild(side);

    // Blind panel
    const bp = new Container();
    bp.position.set(20, 20);
    this.blindBg = new Graphics();
    this.blindName = label('', 28);
    this.blindName.position.set(165, 30);
    const zielLbl = label('Ziel', 18, C.textDim);
    zielLbl.position.set(165, 72);
    this.targetText = label('', 40, C.mult);
    this.targetText.position.set(165, 105);
    this.rewardText = label('', 20, C.money);
    this.rewardText.position.set(165, 140);
    bp.addChild(this.blindBg, this.blindName, zielLbl, this.targetText, this.rewardText);
    t.addChild(bp);

    // Round score
    const sp = panel(330, 76, C.panelDark);
    sp.position.set(20, 192);
    const sLbl = label('Runde', 20, C.textDim);
    sLbl.anchor.set(0, 0.5);
    sLbl.position.set(20, 38);
    this.scoreText = label('0', 40);
    this.scoreText.anchor.set(1, 0.5);
    this.scoreText.position.set(310, 38);
    sp.addChild(sLbl, this.scoreText);
    t.addChild(sp);

    // Hand panel: name, level, chips × mult
    const hp = panel(330, 170, C.panelDark);
    hp.position.set(20, 284);
    this.handName = label('', 28);
    this.handName.position.set(165, 34);
    this.handLevel = label('', 18, C.textDim);
    this.handLevel.position.set(165, 66);
    const box = (c: Container, color: number, x: number) => {
      c.addChild(new Graphics().roundRect(-66, -36, 132, 72, 10).fill(color));
      c.position.set(x, 122);
      const tx = label('0', 38, C.text);
      c.addChild(tx);
      return tx;
    };
    this.chipsText = box(this.chipsBox, C.chips, 88);
    this.multText = box(this.multBox, C.mult, 242);
    const x = label('×', 34, C.mult);
    x.position.set(165, 122);
    hp.addChild(this.handName, this.handLevel, this.chipsBox, this.multBox, x);
    t.addChild(hp);

    // Hands / discards
    const counter = (title: string, color: number, px: number) => {
      const p = panel(160, 84, C.panelDark);
      p.position.set(px, 470);
      const l = label(title, 18, C.textDim);
      l.position.set(80, 22);
      const v = label('0', 38, color);
      v.position.set(80, 56);
      p.addChild(l, v);
      t.addChild(p);
      return v;
    };
    this.handsText = counter('Hände', C.chips, 20);
    this.discardsText = counter('Abwürfe', C.mult, 190);

    // Money
    const mp = panel(330, 84, C.panelDark);
    mp.position.set(20, 570);
    this.moneyText = label('$0', 48, C.money);
    this.moneyText.position.set(165, 42);
    mp.addChild(this.moneyText);
    t.addChild(mp);

    // Ante / round
    const info = (title: string, px: number) => {
      const p = panel(160, 84, C.panelDark);
      p.position.set(px, 670);
      const l = label(title, 18, C.textDim);
      l.position.set(80, 22);
      const v = label('', 32, C.money);
      v.position.set(80, 56);
      p.addChild(l, v);
      t.addChild(p);
      return v;
    };
    this.anteText = info('Ante', 20);
    this.roundText = info('Runde', 190);

    const menuBtn = new Button('Menü', 330, 60, 0x4a3f6b, () => { if (!this.busy) this.showMainMenu(); }, 24);
    menuBtn.position.set(185, 800);
    t.addChild(menuBtn);

    this.seedText = label('', 16, C.textDim, { fontWeight: '600' });
    this.seedText.position.set(185, 960);
    t.addChild(this.seedText);

    // Joker tray + consumable tray
    const jt = panel(JOKER_TRAY_W, 180, C.panelDark);
    jt.alpha = 0.85;
    jt.position.set(JOKER_TRAY_X, 24);
    this.jokerCount = label('', 16, C.textDim);
    this.jokerCount.anchor.set(0, 0.5);
    this.jokerCount.position.set(JOKER_TRAY_X + 12, 220);
    const ct = panel(260, 180, C.panelDark);
    ct.alpha = 0.85;
    ct.position.set(1160, 24);
    const ctLbl = label('Verbrauch 0/2', 16, C.textDim);
    ctLbl.anchor.set(1, 0.5);
    ctLbl.position.set(1408, 220);
    t.addChild(jt, ct, this.jokerCount, ctLbl);

    // Deck pile
    const deck = cardBack();
    deck.position.set(DECK_X, DECK_Y);
    const deck2 = cardBack();
    deck2.position.set(DECK_X - 4, DECK_Y - 4);
    this.deckCount = label('', 20, C.text);
    this.deckCount.position.set(DECK_X, DECK_Y + CARD_H / 2 + 22);
    t.addChild(deck, deck2, this.deckCount);

    // Buttons
    this.playBtn = new Button('Hand spielen', 230, 72, C.chips, () => this.play(), 28);
    this.playBtn.position.set(MX - 260, 935);
    this.discardBtn = new Button('Abwerfen', 230, 72, C.mult, () => this.discard(), 28);
    this.discardBtn.position.set(MX + 260, 935);
    this.sortRankBtn = new Button('Wert', 116, 56, 0x6b5a9e, () => this.setSort('rank'), 22);
    this.sortRankBtn.position.set(MX - 64, 935);
    this.sortSuitBtn = new Button('Farbe', 116, 56, 0x6b5a9e, () => this.setSort('suit'), 22);
    this.sortSuitBtn.position.set(MX + 64, 935);
    const sortLbl = label('Sortieren', 16, C.textDim);
    sortLbl.position.set(MX, 892);
    t.addChild(this.playBtn, this.discardBtn, this.sortRankBtn, this.sortSuitBtn, sortLbl);

    this.totalText = label('', 64, C.text, { stroke: { color: 0x0b0814, width: 8 } });
    this.totalText.position.set(MX, 600);
    this.totalText.alpha = 0;
    this.fxLayer.addChild(this.totalText);
  }

  // ────────────────────────────────────────────────────────────── info refresh

  private refreshInfo() {
    const run = this.run;
    if (!run) return;
    const blind = BLIND_KINDS[Math.min(run.blindIndex, 2)];
    const r = run.round;
    this.blindBg.clear()
      .roundRect(0, 4, 330, 160, 14).fill({ color: 0, alpha: 0.35 })
      .roundRect(0, 0, 330, 160, 14).fill(BLIND_COLORS[blind]).stroke({ width: 2, color: 0xffffff, alpha: 0.2 })
      .roundRect(10, 56, 310, 96, 10).fill({ color: 0x0b0814, alpha: 0.45 });
    this.blindName.text = BLIND_INFO[blind].name;
    this.targetText.text = fmt(r ? r.target : blindTarget(run.ante, blind));
    this.rewardText.text = 'Belohnung ' + '$'.repeat(BLIND_INFO[blind].reward);
    this.scoreText.text = fmt(r?.score ?? 0);
    this.handsText.text = String(r?.handsLeft ?? run.hands);
    this.discardsText.text = String(r?.discardsLeft ?? run.discards);
    this.moneyText.text = '$' + run.money;
    this.anteText.text = `${run.ante}/${FINAL_ANTE}`;
    this.roundText.text = String((run.ante - 1) * 3 + run.blindIndex + 1);
    this.seedText.text = 'Seed ' + run.seed;
    this.jokerCount.text = `Joker ${run.jokers.length}/${run.jokerSlots}`;
    this.deckCount.text = r ? `${r.drawPile.length}/${run.deck.length}` : `${run.deck.length}/${run.deck.length}`;
    this.updateButtons();
    if (!this.busy) this.updatePreview();
  }

  private updateButtons() {
    const r = this.run?.round;
    const n = this.selected().length;
    const can = !!r && !this.busy;
    this.playBtn.enabled = can && n > 0 && r!.handsLeft > 0;
    this.discardBtn.enabled = can && n > 0 && r!.discardsLeft > 0;
    this.sortRankBtn.enabled = can;
    this.sortSuitBtn.enabled = can;
  }

  private setHandDisplay(name: string, level: number | null, chips: number, mult: number) {
    this.handName.text = name;
    this.handLevel.text = level ? `Level ${level}` : '';
    this.chipsText.text = fmt(chips);
    this.multText.text = fmtMult(mult);
    this.fitBoxText();
  }

  private fitBoxText() {
    for (const t of [this.chipsText, this.multText]) {
      t.scale.set(1);
      if (t.width > 120) t.scale.set(120 / t.width);
    }
  }

  private updatePreview() {
    const run = this.run;
    const sel = this.selected();
    if (!run || sel.length === 0) {
      this.setHandDisplay('', null, 0, 0);
      return;
    }
    const p = previewHand(sel.map((v) => v.card), run.handLevels);
    this.setHandDisplay(HAND_INFO[p.type].name, run.handLevels[p.type], p.chips, p.mult);
  }

  // ────────────────────────────────────────────────────────────── hand & cards

  private selected(): CardView[] {
    const r = this.run?.round;
    if (!r) return [];
    return r.hand.map((c) => this.cardViews.get(c.id)!).filter((v) => v?.selected);
  }

  private makeCardView(cardId: number): CardView {
    const card = this.run!.round!.hand.find((c) => c.id === cardId)!;
    const v = new CardView(card);
    v.on('pointertap', () => this.toggleCard(v));
    this.cardViews.set(card.id, v);
    this.handLayer.addChild(v);
    return v;
  }

  private toggleCard(v: CardView) {
    if (this.busy || !this.run?.round) return;
    this.closeTooltip();
    if (!v.selected && this.selected().length >= MAX_SELECT) {
      juice(v, 0.5);
      return;
    }
    v.selected = !v.selected;
    tween(v, { y: v.homeY - (v.selected ? 40 : 0) }, 160, easeOutBack);
    this.updatePreview();
    this.updateButtons();
  }

  private applySort() {
    const r = this.run?.round;
    if (!r) return;
    r.hand = this.sortMode === 'rank' ? sortByRank(r.hand) : sortBySuit(r.hand);
  }

  private setSort(mode: SortMode) {
    if (this.busy) return;
    this.sortMode = mode;
    this.applySort();
    this.layoutHand();
    saveRun(this.run);
  }

  private layoutHand(ms = 260) {
    const hand = this.run?.round?.hand ?? [];
    const n = hand.length;
    const spacing = Math.min(114, 820 / Math.max(n - 1, 1));
    hand.forEach((c, i) => {
      const v = this.cardViews.get(c.id);
      if (!v) return;
      const off = i - (n - 1) / 2;
      v.homeX = MX + off * spacing;
      v.homeY = HAND_Y + off * off * 2.2;
      v.homeRot = off * 0.03;
      v.zIndex = i;
      tween(v, { x: v.homeX, y: v.homeY - (v.selected ? 40 : 0), rotation: v.homeRot }, ms, easeInOutCubic);
    });
  }

  private async drawCards() {
    const run = this.run!;
    const drawn = drawToHandSize(run);
    this.applySort();
    const views = drawn.map((c) => {
      const v = this.makeCardView(c.id);
      v.position.set(DECK_X, DECK_Y);
      v.scale.set(0.8);
      return v;
    });
    this.layoutHand(0);
    // layoutHand(0) set the final positions instantly — restore drawn cards to the deck and fly them in
    views.forEach((v) => v.position.set(DECK_X, DECK_Y));
    for (const v of views) {
      tween(v, { x: v.homeX, y: v.homeY, rotation: v.homeRot }, 320, easeInOutCubic);
      tween(v, { 'scale.x': 1, 'scale.y': 1 }, 320);
      await wait(60);
    }
    this.refreshInfo();
    await wait(260);
  }

  private clearCardViews() {
    for (const v of this.cardViews.values()) v.destroy({ children: true });
    this.cardViews.clear();
  }

  private async flyAway(views: CardView[]) {
    views.forEach((v, i) => {
      wait(i * 40).then(() => tween(v, { x: VIEW_W + 120, y: v.y - 40, rotation: 0.6 }, 360, easeInOutCubic))
        .then(() => {
          this.cardViews.delete(v.card.id);
          v.destroy({ children: true });
        });
    });
    await wait(360 + views.length * 40);
  }

  // ────────────────────────────────────────────────────────────── jokers

  private syncJokers() {
    const run = this.run;
    const ids = new Set(run?.jokers.map((j) => j.uid) ?? []);
    for (const [uid, v] of this.jokerViews) {
      if (!ids.has(uid)) {
        v.destroy({ children: true });
        this.jokerViews.delete(uid);
      }
    }
    for (const j of run?.jokers ?? []) {
      if (this.jokerViews.has(j.uid)) continue;
      const v = new JokerView(j);
      v.position.set(JOKER_TRAY_X + JOKER_TRAY_W / 2, JOKER_Y);
      this.attachJokerDrag(v);
      this.jokerViews.set(j.uid, v);
      this.jokerLayer.addChild(v);
    }
    this.layoutJokers();
    this.refreshInfo();
  }

  private jokerX(i: number, n: number) {
    return JOKER_TRAY_X + JOKER_TRAY_W / 2 + (i - (n - 1) / 2) * JOKER_SPACING;
  }

  private layoutJokers(ms = 220) {
    const js = this.run?.jokers ?? [];
    js.forEach((j, i) => {
      const v = this.jokerViews.get(j.uid);
      if (!v) return;
      v.zIndex = i;
      tween(v, { x: this.jokerX(i, js.length), y: JOKER_Y, rotation: 0 }, ms, easeOutBack);
    });
  }

  /** Tap = details, drag = reorder (joker order matters for scoring). */
  private attachJokerDrag(v: JokerView) {
    let startX = 0;
    let grabOffset = 0;
    let moved = false;
    let dragging = false;
    const onMove = (e: FederatedPointerEvent) => {
      const p = this.jokerLayer.toLocal(e.global);
      if (!moved && Math.abs(p.x - startX) > 10) {
        moved = true;
        this.closeTooltip();
      }
      if (moved) {
        v.x = p.x - grabOffset;
        v.y = JOKER_Y - 12;
      }
    };
    const end = () => {
      if (!dragging) return;
      dragging = false;
      v.off('globalpointermove', onMove);
      const run = this.run!;
      if (moved) {
        const n = run.jokers.length;
        const from = run.jokers.findIndex((j) => j.uid === v.joker.uid);
        const first = this.jokerX(0, n);
        const to = Math.max(0, Math.min(n - 1, Math.round((v.x - first) / JOKER_SPACING)));
        const [j] = run.jokers.splice(from, 1);
        run.jokers.splice(to, 0, j);
        this.layoutJokers();
        saveRun(run);
      } else {
        this.showJokerTooltip(v);
      }
    };
    v.on('pointerdown', (e) => {
      if (this.busy) return;
      const p = this.jokerLayer.toLocal(e.global);
      startX = p.x;
      grabOffset = p.x - v.x;
      moved = false;
      dragging = true;
      v.zIndex = 100;
      v.on('globalpointermove', onMove);
    });
    v.on('pointerup', end);
    v.on('pointerupoutside', end);
  }

  private closeTooltip() {
    this.tooltip?.destroy({ children: true });
    this.tooltip = null;
  }

  private showJokerTooltip(v: JokerView) {
    const wasSame = this.tooltip && (this.tooltip as any).jokerUid === v.joker.uid;
    this.closeTooltip();
    if (wasSame) return;
    const def = JOKER_BY_ID[v.joker.defId];
    const tip = new Container() as Container & { jokerUid?: number };
    tip.jokerUid = v.joker.uid;
    const w = 280;
    const desc = new Text({
      text: def.description + (v.joker.vars.mult ? `\n(aktuell +${v.joker.vars.mult} Mult)` : ''),
      style: { fontFamily: FONT, fontSize: 19, fontWeight: '700', fill: C.cardEdge, wordWrap: true, wordWrapWidth: w - 30, align: 'center' },
    });
    desc.anchor.set(0.5, 0);
    const h = 152 + desc.height;
    const bg = new Graphics()
      .roundRect(-w / 2, 4, w, h, 14).fill({ color: 0, alpha: 0.4 })
      .roundRect(-w / 2, 0, w, h, 14).fill(C.text).stroke({ width: 3, color: C.cardEdge });
    bg.eventMode = 'static';
    const name = label(def.name, 24, C.cardEdge);
    name.position.set(0, 24);
    const rar = new Graphics().roundRect(-60, 44, 120, 24, 12).fill(RARITY_COLORS[def.rarity]);
    const rarT = label(RARITY_NAMES[def.rarity], 14, 0xffffff);
    rarT.position.set(0, 56);
    desc.position.set(0, 78);
    const sell = new Button(`Verkaufen $${sellValue(def.cost)}`, 200, 44, C.green, () => this.sellJoker(v.joker.uid), 20);
    sell.position.set(0, h - 34);
    tip.addChild(bg, name, rar, rarT, desc, sell);
    tip.position.set(Math.max(JOKER_TRAY_X + w / 2, Math.min(VIEW_W - w / 2 - 10, v.x)), JOKER_Y + 82);
    tip.scale.set(0.8);
    tween(tip, { 'scale.x': 1, 'scale.y': 1 }, 160, easeOutBack);
    this.fxLayer.addChild(tip);
    this.tooltip = tip;
  }

  private sellJoker(uid: number) {
    const run = this.run!;
    if (this.busy) return;
    const idx = run.jokers.findIndex((j) => j.uid === uid);
    if (idx < 0) return;
    const def = JOKER_BY_ID[run.jokers[idx].defId];
    run.money += sellValue(def.cost);
    run.jokers.splice(idx, 1);
    this.closeTooltip();
    this.syncJokers();
    juice(this.moneyText);
    saveRun(run);
  }

  // ────────────────────────────────────────────────────────────── actions

  private async play() {
    const run = this.run;
    if (this.busy || !run?.round) return;
    const sel = this.selected();
    if (sel.length === 0) return;
    this.busy = true;
    this.closeTooltip();
    this.updateButtons();

    const result = playCards(run, sel.map((v) => v.card.id));
    const r = run.round;
    this.handsText.text = String(r.handsLeft);
    juice(this.handsText);

    // Move played cards to the play area
    sel.forEach((v, i) => {
      v.selected = false;
      this.playLayer.addChild(v);
      const x = MX + (i - (sel.length - 1) / 2) * 130;
      wait(i * 50).then(() => tween(v, { x, y: PLAY_Y, rotation: 0 }, 300, easeInOutCubic));
    });
    this.layoutHand();
    await wait(380 + sel.length * 50);

    const scoringIds = new Set(result.scoring.map((c) => c.id));
    for (const v of sel) if (scoringIds.has(v.card.id)) tween(v, { y: PLAY_Y - 30 }, 160, easeOutBack);
    const base = result.events[0];
    this.setHandDisplay(HAND_INFO[result.handType].name, run.handLevels[result.handType], base.chipsTotal, base.multTotal);
    juice(this.handName);
    await wait(380);

    let step = 0;
    for (const ev of result.events.slice(1)) {
      await this.animateEvent(ev);
      await wait(Math.max(90, 280 - step * 14));
      step++;
    }

    // Total
    await wait(150);
    this.totalText.text = fmt(result.total);
    this.totalText.alpha = 1;
    this.totalText.scale.set(0.3);
    await tween(this.totalText, { 'scale.x': 1, 'scale.y': 1 }, 260, easeOutBack);
    const before = r.score - result.total;
    await this.countUp(this.scoreText, before, r.score, 500);
    juice(this.scoreText);
    if (result.money) {
      this.moneyText.text = '$' + run.money;
      juice(this.moneyText);
    }
    await wait(250);
    tween(this.totalText, { alpha: 0 }, 250);

    await this.flyAway(sel);
    this.setHandDisplay('', null, 0, 0);
    saveRun(run);

    if (isRoundWon(run)) {
      await wait(250);
      this.busy = false;
      this.showRoundWon();
      return;
    }
    await this.drawCards();
    this.busy = false;
    if (isRoundLost(run)) {
      this.showGameOver();
      return;
    }
    saveRun(run);
    this.refreshInfo();
  }

  private async animateEvent(ev: ScoreEvent) {
    let target: Container | undefined;
    if (ev.source.kind === 'card' || ev.source.kind === 'held') target = this.cardViews.get(ev.source.cardId);
    else if (ev.source.kind === 'joker') target = this.jokerViews.get(ev.source.jokerUid);
    if (target) {
      juice(target);
      const g = target.getGlobalPosition();
      const p = this.fxLayer.toLocal(g);
      const above = ev.source.kind === 'joker' ? 100 : CARD_H / 2 + 40;
      const below = ev.source.kind === 'joker';
      const y = below ? p.y + above : p.y - above;
      if (ev.chips) popup(this.fxLayer, p.x, y, `+${fmt(ev.chips)}`, C.chips);
      if (ev.mult) popup(this.fxLayer, p.x, y, `+${fmtMult(ev.mult)} Mult`, C.mult, 28);
      if (ev.xMult) popup(this.fxLayer, p.x, y, `×${fmtMult(ev.xMult)} Mult`, C.mult, 30);
      if (ev.money) popup(this.fxLayer, p.x, y, `+$${ev.money}`, C.money);
    }
    this.chipsText.text = fmt(ev.chipsTotal);
    this.multText.text = fmtMult(ev.multTotal);
    this.fitBoxText();
    if (ev.chips) juice(this.chipsBox, 0.6);
    if (ev.mult || ev.xMult) juice(this.multBox, ev.xMult ? 1.2 : 0.6);
  }

  private async countUp(t: Text, from: number, to: number, ms: number) {
    const proxy = { v: from };
    const ticker = setInterval(() => { t.text = fmt(proxy.v); }, 16);
    await tween(proxy, { v: to }, ms);
    clearInterval(ticker);
    t.text = fmt(to);
  }

  private async discard() {
    const run = this.run;
    if (this.busy || !run?.round) return;
    const sel = this.selected();
    if (sel.length === 0 || run.round.discardsLeft <= 0) return;
    this.busy = true;
    this.closeTooltip();
    discardCards(run, sel.map((v) => v.card.id));
    this.discardsText.text = String(run.round.discardsLeft);
    juice(this.discardsText);
    this.updateButtons();
    this.layoutHand();
    await this.flyAway(sel);
    await this.drawCards();
    this.busy = false;
    if (isRoundLost(run)) {
      this.showGameOver();
      return;
    }
    saveRun(run);
    this.refreshInfo();
  }

  // ────────────────────────────────────────────────────────────── screens

  private clearOverlay() {
    for (const c of [...this.overlayLayer.children]) c.destroy({ children: true });
  }

  private modal(w: number, h: number, color = C.panel): { o: Container; box: Container } {
    this.clearOverlay();
    this.closeTooltip();
    const o = overlay(VIEW_W, VIEW_H);
    const box = new Container();
    box.addChild(panel(w, h, color, 20));
    box.pivot.set(w / 2, h / 2);
    box.position.set(VIEW_W / 2, VIEW_H / 2);
    box.scale.set(0.85);
    tween(box, { 'scale.x': 1, 'scale.y': 1 }, 260, easeOutBack);
    o.addChild(box);
    this.overlayLayer.addChild(o);
    return { o, box };
  }

  private startNewRun() {
    this.clearCardViews();
    this.run = newRun(randomSeed());
    this.syncJokers();
    saveRun(this.run);
    this.refreshInfo();
    this.showBlindSelect();
  }

  private resume(run: RunState) {
    this.clearCardViews();
    this.run = run;
    this.syncJokers();
    this.clearOverlay();
    if (run.round) {
      for (const c of run.round.hand) this.makeCardView(c.id).position.set(DECK_X, DECK_Y);
      this.layoutHand(400);
      this.refreshInfo();
      if (isRoundWon(run)) this.showRoundWon();
      else if (isRoundLost(run)) this.showGameOver();
    } else {
      this.refreshInfo();
      this.showBlindSelect();
    }
  }

  private showMainMenu() {
    const saved = this.run ?? loadRun();
    const canResume = !!saved && !saved.won;
    const { box } = this.modal(620, canResume ? 520 : 420, C.panelDark);
    const title = label('ALATRO', 110, C.text, { stroke: { color: C.mult, width: 10 }, letterSpacing: 6 });
    title.position.set(310, 130);
    const wobble = (): void => {
      if (title.destroyed) return;
      tween(title, { rotation: title.rotation > 0 ? -0.03 : 0.03 }, 1600, easeInOutCubic).then(wobble);
    };
    wobble();
    const sub = label('Roguelike Poker-Deckbuilder', 24, C.textDim);
    sub.position.set(310, 215);
    box.addChild(title, sub);

    let y = 310;
    if (canResume) {
      const cont = new Button(`Fortsetzen · Ante ${saved!.ante}`, 400, 76, C.chips, () => this.resume(saved!), 28);
      cont.position.set(310, y);
      box.addChild(cont);
      y += 100;
    }
    const nr = new Button('Neuer Run', 400, 76, C.mult, () => this.startNewRun(), 30);
    nr.position.set(310, y);
    box.addChild(nr);
  }

  private showBlindSelect() {
    const run = this.run!;
    this.refreshInfo();
    const { box } = this.modal(960, 520, C.panelDark);
    const head = label(`Ante ${run.ante}${run.ante > FINAL_ANTE ? ' · Endlos' : ''}`, 40, C.text);
    head.position.set(480, 50);
    box.addChild(head);

    BLIND_KINDS.forEach((kind, i) => {
      const col = new Container();
      col.position.set(40 + i * 300, 100);
      const state = i < run.blindIndex ? 'done' : i === run.blindIndex ? 'current' : 'future';
      const g = new Graphics()
        .roundRect(0, 0, 280, 380, 16).fill(state === 'current' ? BLIND_COLORS[kind] : C.panel)
        .stroke({ width: 3, color: state === 'current' ? 0xffffff : C.panelLine, alpha: state === 'current' ? 0.6 : 1 });
      const name = label(BLIND_INFO[kind].name, 28);
      name.position.set(140, 50);
      const chip = new Graphics().circle(140, 140, 50).fill({ color: 0x0b0814, alpha: 0.4 }).stroke({ width: 4, color: BLIND_COLORS[kind] });
      const chipT = label(kind === 'boss' ? '☠' : kind === 'big' ? '◆' : '●', 44, BLIND_COLORS[kind] === 0 ? C.text : 0xffffff);
      chipT.position.set(140, 140);
      const zl = label('Mindestens', 18, C.textDim);
      zl.position.set(140, 220);
      const target = label(fmt(blindTarget(run.ante, kind)), 36, C.mult);
      target.position.set(140, 255);
      const rew = label('Belohnung ' + '$'.repeat(BLIND_INFO[kind].reward), 20, C.money);
      rew.position.set(140, 292);
      col.addChild(g, name, chip, chipT, zl, target, rew);
      if (state === 'current') {
        const b = new Button('Spielen', 220, 60, C.money, () => this.beginRound(), 28);
        b.position.set(140, 340);
        col.addChild(b);
      } else {
        const s = label(state === 'done' ? 'Geschafft' : 'Kommt noch', 22, C.textDim);
        s.position.set(140, 340);
        col.addChild(s);
        col.alpha = state === 'done' ? 0.5 : 0.75;
      }
      box.addChild(col);
    });
  }

  private async beginRound() {
    const run = this.run!;
    this.clearOverlay();
    this.clearCardViews();
    startRound(run);
    // startRound already filled the hand; animate it in from the deck
    const hand = [...run.round!.hand];
    run.round!.hand = [];
    run.round!.drawPile.push(...hand.reverse());
    this.busy = true;
    this.refreshInfo();
    await this.drawCards();
    this.busy = false;
    saveRun(run);
    this.refreshInfo();
  }

  private showRoundWon() {
    const run = this.run!;
    const e = computeEarnings(run);
    const { box } = this.modal(560, 500, C.panelDark);
    const head = label('Blind geschafft!', 44, C.money);
    head.position.set(280, 60);
    box.addChild(head);
    const lines: [string, number][] = [
      ['Blind-Belohnung', e.blindReward],
      [`Übrige Hände (${run.round!.handsLeft})`, e.handsBonus],
      ['Zinsen ($1 je $5, max. $5)', e.interest],
    ];
    lines.forEach(([t, v], i) => {
      const l = label(t, 24, C.text);
      l.anchor.set(0, 0.5);
      l.position.set(50, 150 + i * 60);
      const r = label('$' + v, 30, C.money);
      r.anchor.set(1, 0.5);
      r.position.set(510, 150 + i * 60);
      l.alpha = r.alpha = 0;
      wait(200 + i * 220).then(() => { tween(l, { alpha: 1 }, 200); tween(r, { alpha: 1 }, 200); juice(r); });
      box.addChild(l, r);
    });
    const btn = new Button(`Einkassieren $${e.total}`, 360, 76, C.money, async () => {
      btn.enabled = false;
      const remaining = run.round!.hand.map((c) => this.cardViews.get(c.id)!).filter(Boolean);
      finishRound(run);
      saveRun(run);
      this.refreshInfo();
      juice(this.moneyText);
      this.clearOverlay();
      await this.flyAway(remaining);
      this.clearCardViews();
      if (run.won && run.ante === FINAL_ANTE + 1 && run.blindIndex === 0) this.showRunWon();
      else this.showJokerPick();
    }, 28);
    btn.position.set(280, 420);
    box.addChild(btn);
  }

  /** Temporary reward screen until the shop exists. */
  private showJokerPick() {
    const run = this.run!;
    const offer = jokerOffer(run, JOKERS, 3);
    const full = run.jokers.length >= run.jokerSlots;
    const { box } = this.modal(980, 560, C.panelDark);
    const head = label(full ? 'Joker-Plätze voll' : 'Wähle einen Joker', 40, C.text);
    head.position.set(490, 50);
    const sub = label('(Platzhalter bis zum Shop · Joker per Ziehen umsortieren)', 18, C.textDim);
    sub.position.set(490, 92);
    box.addChild(head, sub);

    offer.forEach((id, i) => {
      const def = JOKER_BY_ID[id];
      const col = new Container();
      col.position.set(40 + i * 310, 120);
      const g = new Graphics().roundRect(0, 0, 280, 330, 16).fill(C.panel).stroke({ width: 2, color: C.panelLine });
      const jv = new JokerView({ uid: -1, defId: id, vars: {} });
      jv.position.set(140, 90);
      jv.eventMode = 'none';
      const rar = new Graphics().roundRect(80, 172, 120, 24, 12).fill(RARITY_COLORS[def.rarity]);
      const rarT = label(RARITY_NAMES[def.rarity], 14, 0xffffff);
      rarT.position.set(140, 184);
      const desc = new Text({
        text: def.description,
        style: { fontFamily: FONT, fontSize: 19, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 250, align: 'center' },
      });
      desc.anchor.set(0.5, 0);
      desc.position.set(140, 210);
      col.addChild(g, jv, rar, rarT, desc);
      if (!full) {
        const b = new Button('Nehmen', 200, 56, C.green, () => {
          addJoker(run, id);
          this.syncJokers();
          saveRun(run);
          this.showBlindSelect();
        }, 24);
        b.position.set(140, 300);
        col.addChild(b);
      }
      box.addChild(col);
    });
    const skip = new Button(full ? 'Weiter' : 'Überspringen', 260, 60, 0x6b5a9e, () => this.showBlindSelect(), 24);
    skip.position.set(490, 505);
    box.addChild(skip);
    if (offer.length === 0) this.showBlindSelect();
  }

  private showGameOver() {
    const run = this.run!;
    saveRun(null);
    const { box } = this.modal(560, 440, C.panelDark);
    const head = label('Verloren', 64, C.mult);
    head.position.set(280, 80);
    const l1 = label(`Erreicht: Ante ${run.ante}, Runde ${(run.ante - 1) * 3 + run.blindIndex + 1}`, 24);
    l1.position.set(280, 170);
    const l2 = label(`Punkte: ${fmt(run.round?.score ?? 0)} / ${fmt(run.round?.target ?? 0)}`, 22, C.textDim);
    l2.position.set(280, 215);
    const l3 = label(`Seed ${run.seed}`, 18, C.textDim);
    l3.position.set(280, 255);
    const b = new Button('Neuer Run', 320, 76, C.chips, () => this.startNewRun(), 30);
    b.position.set(280, 350);
    box.addChild(head, l1, l2, l3, b);
  }

  private showRunWon() {
    const { box } = this.modal(620, 440, C.panelDark);
    const head = label('Gewonnen!', 72, C.money, { stroke: { color: C.mult, width: 8 } });
    head.position.set(310, 90);
    const l = label(`Ante ${FINAL_ANTE} besiegt.`, 26);
    l.position.set(310, 180);
    const a = new Button('Endlos weiterspielen', 380, 70, C.chips, () => this.showJokerPick(), 26);
    a.position.set(310, 270);
    const b = new Button('Neuer Run', 380, 70, C.mult, () => this.startNewRun(), 26);
    b.position.set(310, 360);
    box.addChild(head, l, a, b);
  }
}

