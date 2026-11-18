import { Container, Graphics, Text, type FederatedPointerEvent } from 'pixi.js';
import { BLIND_KINDS, BLIND_NAMES, FINAL_ANTE, blindReward, type BlindKind } from '../core/blinds';
import { SUIT_NAMES, sortByRank, sortBySuit, type Card } from '../core/cards';
import {
  TAG_BY_ID, PACK_BY_ID, afterHand, buyAndUse, buyCard, buyPack, buyVoucher, canPick, canUseConsumable, cashOut, closePack, createRun,
  discardHand, leaveShop, pickFromPack, playHand, reroll, selectBlind, sellConsumable, sellJoker as sellJokerAction, skipBlind,
  useConsumable,
} from '../core/game';
import { consumableSellValue, type UseResult } from '../core/consumables';
import { handDisplayName } from '../core/hands';
import { getJoker, jokerDescription, jokerRules } from '../core/jokers';
import { normalizeSeed, randomSeed, SEED_LENGTH } from '../core/rng';
import {
  BOSS_BY_ID, MAX_SELECT, activeBoss, computeEarnings, currentTarget, isCardDebuffed, jokerCapacity, jokerPassive, jokerSellValue, type RunState,
} from '../core/run';
import { previewHand, type ScoreEvent } from '../core/scoring';
import { CONSUMABLE_BY_ID, CONSUMABLE_TYPE_NAMES, type ConsumableType } from '../data/consumables';
import { DECKS } from '../data/decks';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { STAKES } from '../data/stakes';
import { clampVolume, getSettings, updateSettings } from '../settings';
import { VOLUME_STEP, type BgMood } from '../data/juice';
import { loadRun, saveRun } from '../save';
import { sfx } from './audio';
import { CARD_H, CardView, cardBack } from './CardView';
import { ConsumableView, CONSUMABLE_H } from './ConsumableView';
import { buildCollection, COLLECTION_H, COLLECTION_W } from './CollectionView';
import { JokerView } from './JokerView';
import { buildRunInfo, RUN_INFO_H, RUN_INFO_W, type RunInfoTab } from './RunInfoView';
import { buildShop } from './ShopView';
import { C, CONSUMABLE_COLORS, FONT, RARITY_COLORS, RARITY_NAMES, VIEW_H, VIEW_W, fmt, fmtMult } from './theme';
import { scoreTier, xMultShake } from './juiceMath';
import { StageFx } from './stageFx';
import { easeInOutCubic, easeOutBack, juice, tween, wait } from './tween';
import { Button, label, overlay, panel, popup, wrapText } from './widgets';

const MX = 850; // centre of the play area
const HAND_Y = 775;
const PLAY_Y = 450;
const DECK_X = 1370;
const DECK_Y = 785;
const JOKER_Y = 118;
const JOKER_TRAY_X = 380;
const JOKER_TRAY_W = 760;
const JOKER_SPACING = 122;
/** Abstand der Jokers: bei mehr als 5 Jokers rücken sie zusammen, damit sie ins Fach passen */
const jokerSpacing = (n: number) => (n <= 5 ? JOKER_SPACING : Math.min(JOKER_SPACING, (JOKER_TRAY_W - 130) / (n - 1)));
const CONS_TRAY_X = 1160;
const CONS_TRAY_W = 260;

const BLIND_COLORS: Record<BlindKind, number> = { small: 0x2a7f8f, big: 0xc9822b, boss: 0xa8324a };

type SortMode = 'rank' | 'suit';

export interface GameHooks {
  /** Wechselt die Farbstimmung des Hintergrunds, bossColor färbt die Boss Stimmung */
  setMood: (mood: BgMood, bossColor?: number) => void;
}

export class Game {
  readonly root = new Container();
  private fx: StageFx;

  private run: RunState | null = null;
  private busy = false;
  private sortMode: SortMode = 'rank';

  private table = new Container();
  private jokerLayer = new Container();
  private playLayer = new Container();
  private handLayer = new Container();
  private fxLayer = new Container();
  private overlayLayer = new Container();
  private flashLayer = new Container();
  private screenLayer = new Container();
  private handControls = new Container();
  private deckPile = new Container();
  private shopView: Container | null = null;

  private cardViews = new Map<number, CardView>();
  private jokerViews = new Map<number, JokerView>();
  private consumableViews = new Map<number, ConsumableView>();
  /** Seed für den nächsten Run, leer = zufällig */
  private setupSeed = '';
  private tooltip: Container | null = null;

  // Sidebar
  private blindBg = new Graphics();
  private blindName!: Text;
  private targetText!: Text;
  private rewardText!: Text;
  private bossDesc!: Text;
  private tagsText!: Text;
  private consLabel!: Text;
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

  constructor(private hooks: GameHooks = { setMood: () => {} }) {
    this.handLayer.sortableChildren = true;
    this.jokerLayer.sortableChildren = true;
    this.root.addChild(this.table, this.jokerLayer, this.playLayer, this.handLayer, this.screenLayer, this.fxLayer, this.overlayLayer, this.flashLayer);
    this.fx = new StageFx(this.root, this.flashLayer);
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
    this.bossDesc = new Text({ text: '', style: { fontFamily: FONT, fontSize: 15, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 300, align: 'center' } });
    this.bossDesc.anchor.set(0.5);
    this.bossDesc.position.set(165, 140);
    bp.addChild(this.blindBg, this.blindName, zielLbl, this.targetText, this.rewardText, this.bossDesc);
    t.addChild(bp);

    // Round score
    const sp = panel(330, 76, C.panelDark);
    sp.position.set(20, 192);
    const sLbl = label('Round Score', 20, C.textDim);
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
    this.handsText = counter('Hands', C.chips, 20);
    this.discardsText = counter('Discards', C.mult, 190);

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
    this.roundText = info('Round', 190);

    const menuBtn = new Button('Menü', 160, 60, 0x4a3f6b, () => { if (!this.busy) this.showMainMenu(); }, 24);
    menuBtn.position.set(100, 800);
    const infoBtn = new Button('Run Info', 160, 60, 0x6b5a9e, () => { if (!this.busy && this.run) this.showRunInfo(); }, 24);
    infoBtn.position.set(270, 800);
    t.addChild(menuBtn, infoBtn);

    this.seedText = label('', 16, C.textDim, { fontWeight: '600' });
    this.seedText.position.set(185, 960);
    this.tagsText = new Text({ text: '', style: { fontFamily: FONT, fontSize: 15, fontWeight: '700', fill: C.accent, wordWrap: true, wordWrapWidth: 320, align: 'center' } });
    this.tagsText.anchor.set(0.5, 1);
    this.tagsText.position.set(185, 935);
    t.addChild(this.seedText, this.tagsText);

    // Joker tray + consumable tray
    const jt = panel(JOKER_TRAY_W, 180, C.panelDark);
    jt.alpha = 0.85;
    jt.position.set(JOKER_TRAY_X, 24);
    this.jokerCount = label('', 16, C.textDim);
    this.jokerCount.anchor.set(0, 0.5);
    this.jokerCount.position.set(JOKER_TRAY_X + 12, 220);
    const ct = panel(CONS_TRAY_W, 180, C.panelDark);
    ct.alpha = 0.85;
    ct.position.set(CONS_TRAY_X, 24);
    this.consLabel = label('Consumables 0/2', 16, C.textDim);
    this.consLabel.anchor.set(1, 0.5);
    this.consLabel.position.set(1408, 220);
    t.addChild(jt, ct, this.jokerCount, this.consLabel);

    // Deck pile
    const deck = cardBack();
    deck.position.set(DECK_X, DECK_Y);
    const deck2 = cardBack();
    deck2.position.set(DECK_X - 4, DECK_Y - 4);
    this.deckCount = label('', 20, C.text);
    this.deckCount.position.set(DECK_X, DECK_Y + CARD_H / 2 + 22);
    this.deckPile.addChild(deck, deck2, this.deckCount);
    t.addChild(this.deckPile);

    // Buttons
    this.playBtn = new Button('Play Hand', 230, 72, C.chips, () => this.play(), 28);
    this.playBtn.position.set(MX - 260, 935);
    this.discardBtn = new Button('Discard', 230, 72, C.mult, () => this.discard(), 28);
    this.discardBtn.position.set(MX + 260, 935);
    this.sortRankBtn = new Button('Rank', 116, 56, 0x6b5a9e, () => this.setSort('rank'), 22);
    this.sortRankBtn.position.set(MX - 64, 935);
    this.sortSuitBtn = new Button('Suit', 116, 56, 0x6b5a9e, () => this.setSort('suit'), 22);
    this.sortSuitBtn.position.set(MX + 64, 935);
    const sortLbl = label('Sortieren', 16, C.textDim);
    sortLbl.position.set(MX, 892);
    this.handControls.addChild(this.playBtn, this.discardBtn, this.sortRankBtn, this.sortSuitBtn, sortLbl);
    t.addChild(this.handControls);

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
    const boss = blind === 'boss' ? (r ? activeBoss(run) : run.anteBoss ? BOSS_BY_ID[run.anteBoss] : undefined) : undefined;
    this.blindBg.clear()
      .roundRect(0, 4, 330, 160, 14).fill({ color: 0, alpha: 0.35 })
      .roundRect(0, 0, 330, 160, 14).fill(boss ? boss.color : BLIND_COLORS[blind]).stroke({ width: 2, color: 0xffffff, alpha: 0.2 })
      .roundRect(10, 56, 310, 96, 10).fill({ color: 0x0b0814, alpha: 0.45 });
    this.blindName.text = boss ? boss.name : BLIND_NAMES[blind];
    this.blindName.scale.set(1);
    if (this.blindName.width > 310) this.blindName.scale.set(310 / this.blindName.width);
    this.targetText.text = fmt(r ? r.target : currentTarget(run, blind));
    this.rewardText.visible = !boss;
    this.bossDesc.visible = !!boss;
    if (boss) this.bossDesc.text = boss.description + (r?.debuffSuit ? ` (${SUIT_NAMES[r.debuffSuit]})` : '');
    const reward = blindReward(run.ante, blind, run.rules.smallBlindReward);
    this.rewardText.text = reward > 0 ? 'Belohnung ' + '$'.repeat(reward) : 'Keine Belohnung';
    this.scoreText.text = fmt(r?.score ?? 0);
    this.handsText.text = String(r?.handsLeft ?? run.hands);
    this.discardsText.text = String(r?.discardsLeft ?? run.discards);
    this.moneyText.text = '$' + run.money;
    this.anteText.text = `${run.ante}/${FINAL_ANTE}`;
    this.roundText.text = String((run.ante - 1) * 3 + run.blindIndex + 1);
    this.seedText.text = 'Seed ' + run.seed;
    this.jokerCount.text = `Joker ${run.jokers.length}/${jokerCapacity(run)}`;
    this.consLabel.text = `Consumables ${run.consumables.length}/${run.consumableSlots}`;
    this.tagsText.text = run.pendingTags.length ? 'Tags: ' + run.pendingTags.map((id) => TAG_BY_ID[id]?.name ?? id).join(', ') : '';
    this.deckCount.text = r ? `${r.drawPile.length}/${run.deck.length}` : `${run.deck.length}/${run.deck.length}`;
    this.handControls.visible = run.phase === 'round' || run.phase === 'roundWon';
    this.deckPile.visible = run.phase !== 'shop' && run.phase !== 'pack';
    for (const v of this.cardViews.values()) v.setDebuffed(isCardDebuffed(run, v.card));
    this.updateButtons();
    if (!this.busy) this.updatePreview();
    this.updateMood(blind, boss?.color);
  }

  /** Farbstimmung: Small ruhig, Big kräftig, Boss dramatisch, Shop und Packs gedämpft. */
  private updateMood(blind: BlindKind, bossColor?: number) {
    const run = this.run;
    if (!run) return;
    const mood: BgMood = run.phase === 'shop' || run.phase === 'pack' ? 'shop' : blind;
    this.hooks.setMood(mood, bossColor);
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
    const p = previewHand(sel.map((v) => v.card), run.handLevels, jokerRules(run.jokers));
    this.setHandDisplay(handDisplayName(p.type, p.scoring), run.handLevels[p.type], p.chips, p.mult);
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
      sfx.deny();
      return;
    }
    v.selected = !v.selected;
    sfx.select(v.selected);
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

  /** Animiert Karten, die die Engine bereits gezogen hat, vom Stapel in die Hand. */
  private async drawCards(drawn: Card[]) {
    this.applySort();
    const views = drawn.map((c) => {
      const v = this.makeCardView(c.id);
      v.position.set(DECK_X, DECK_Y);
      v.scale.set(0.8);
      return v;
    });
    this.refreshInfo();
    this.layoutHand(0);
    // layoutHand(0) setzt die Zielpositionen, die neuen Karten fliegen vom Stapel dorthin
    views.forEach((v) => v.position.set(DECK_X, DECK_Y));
    for (const v of views) {
      sfx.draw();
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
    return JOKER_TRAY_X + JOKER_TRAY_W / 2 + (i - (n - 1) / 2) * jokerSpacing(n);
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
        const to = Math.max(0, Math.min(n - 1, Math.round((v.x - first) / jokerSpacing(n))));
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
    const def = getJoker(v.joker.defId)!;
    const tip = new Container() as Container & { jokerUid?: number };
    tip.jokerUid = v.joker.uid;
    const w = 280;
    const desc = new Text({
      text: jokerDescription(def, v.joker),
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
    const sell = new Button(`Verkaufen $${jokerSellValue(v.joker)}`, 200, 44, C.green, () => this.sellJoker(v.joker.uid), 20);
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
    if (this.busy || !sellJokerAction(run, uid)) return;
    sfx.sell();
    this.closeTooltip();
    this.syncJokers();
    juice(this.moneyText);
    saveRun(run);
    if (run.phase === 'shop') this.renderShop();
  }

  // ────────────────────────────────────────────────────────────── consumables

  private consumableX(i: number, n: number) {
    const spacing = Math.min(124, (CONS_TRAY_W - 40) / Math.max(n, 1));
    return CONS_TRAY_X + CONS_TRAY_W / 2 + (i - (n - 1) / 2) * spacing;
  }

  private syncConsumables() {
    const run = this.run;
    const list = run?.consumables ?? [];
    const ids = new Set(list.map((c) => c.uid));
    for (const [uid, v] of [...this.consumableViews]) {
      if (ids.has(uid)) continue;
      v.destroy({ children: true });
      this.consumableViews.delete(uid);
    }
    list.forEach((c, i) => {
      let v = this.consumableViews.get(c.uid);
      if (!v) {
        v = new ConsumableView(c.defId);
        v.position.set(this.consumableX(i, list.length), JOKER_Y);
        v.on('pointertap', () => { if (!this.busy) this.showConsumableTooltip(c.uid); });
        this.consumableViews.set(c.uid, v);
        this.jokerLayer.addChild(v);
      }
      v.zIndex = i;
      tween(v, { x: this.consumableX(i, list.length), y: JOKER_Y }, 220, easeOutBack);
    });
    this.refreshInfo();
  }

  private showConsumableTooltip(uid: number) {
    const run = this.run!;
    const v = this.consumableViews.get(uid);
    const inst = run.consumables.find((c) => c.uid === uid);
    if (!v || !inst) return;
    const wasSame = this.tooltip && (this.tooltip as any).consumableUid === uid;
    this.closeTooltip();
    if (wasSame) return;
    const def = CONSUMABLE_BY_ID[inst.defId];
    const tip = new Container() as Container & { consumableUid?: number };
    tip.consumableUid = uid;
    const w = 300;
    const desc = wrapText(def.description, w - 30, 19, C.cardEdge);
    const targets = this.selected().map((c) => c.card.id);
    const usable = canUseConsumable(run, inst.defId, targets, 'slot');
    let hint = '';
    if (!usable) {
      if (def.targets && run.phase !== 'round') hint = 'Braucht Karten in der Hand, nur in einer Runde';
      else if (def.targets) hint = def.targets.min === def.targets.max ? `Wähle ${def.targets.min} Karte in der Hand` : `Wähle ${def.targets.min} bis ${def.targets.max} Karten in der Hand`;
      else hint = 'Gerade nicht benutzbar';
    }
    const hintText = hint ? wrapText(hint, w - 30, 15, 0xa8324a) : null;
    desc.position.set(0, 84);
    if (hintText) hintText.position.set(0, 84 + desc.height + 8);
    const h = 84 + desc.height + (hintText ? hintText.height + 16 : 8) + 124;
    const bg = new Graphics()
      .roundRect(-w / 2, 4, w, h, 14).fill({ color: 0, alpha: 0.4 })
      .roundRect(-w / 2, 0, w, h, 14).fill(C.text).stroke({ width: 3, color: C.cardEdge });
    bg.eventMode = 'static';
    const name = label(def.name, 24, C.cardEdge);
    name.position.set(0, 24);
    const badge = new Graphics().roundRect(-60, 44, 120, 24, 12).fill(CONSUMABLE_COLORS[def.type]);
    const badgeT = label(CONSUMABLE_TYPE_NAMES[def.type], 14, 0xffffff);
    badgeT.position.set(0, 56);
    const use = new Button('Benutzen', 220, 46, C.chips, () => this.useConsumableUI(uid), 20);
    use.position.set(0, h - 86);
    use.enabled = usable;
    const sell = new Button(`Verkaufen $${consumableSellValue(inst)}`, 220, 46, C.green, () => this.sellConsumableUI(uid), 20);
    sell.position.set(0, h - 34);
    tip.addChild(bg, name, badge, badgeT, desc, use, sell);
    if (hintText) tip.addChild(hintText);
    tip.position.set(Math.min(v.x, VIEW_W - w / 2 - 10), JOKER_Y + CONSUMABLE_H / 2 + 20);
    tip.scale.set(0.8);
    tween(tip, { 'scale.x': 1, 'scale.y': 1 }, 160, easeOutBack);
    this.fxLayer.addChild(tip);
    this.tooltip = tip;
  }

  private sellConsumableUI(uid: number) {
    const run = this.run!;
    if (this.busy || !sellConsumable(run, uid)) return;
    sfx.sell();
    this.closeTooltip();
    this.syncConsumables();
    juice(this.moneyText);
    saveRun(run);
    if (run.phase === 'shop') this.renderShop();
  }

  private useConsumableUI(uid: number) {
    const run = this.run!;
    if (this.busy) return;
    const targets = this.selected().map((c) => c.card.id);
    const type = CONSUMABLE_BY_ID[run.consumables.find((c) => c.uid === uid)?.defId ?? '']?.type;
    const res = useConsumable(run, uid, targets);
    if (!res) return;
    this.closeTooltip();
    this.afterConsumableUse(res, type);
  }

  /** Gemeinsame Nachbereitung nach dem Benutzen: Anzeige, Meldung, Speichern. */
  private afterConsumableUse(res: UseResult, type?: ConsumableType) {
    const run = this.run!;
    this.playConsumableFx(type);
    this.syncConsumables();
    this.syncJokers();
    if (run.round && (res.changed.length || res.destroyed.length || res.created.length)) this.rebuildHand();
    juice(this.moneyText);
    const extra: string[] = [];
    if (res.destroyed.length) extra.push(`${res.destroyed.length} zerstört`);
    if (res.created.length) extra.push(`${res.created.length} neu`);
    if (res.destroyedJokers) extra.push(`${res.destroyedJokers} Jokers zerstört`);
    if (res.consumables.length) extra.push(`${res.consumables.length} erzeugt`);
    this.toast(res.message + (extra.length ? ` (${extra.join(', ')})` : ''), C.accent);
    saveRun(run);
    if (run.phase === 'gameOver') this.showGameOver();
    else if (run.phase === 'shop') this.renderShop();
  }

  /** Klang und Effekt je nach Typ des benutzten Consumables, Omen erschüttern leicht den Bildschirm. */
  private playConsumableFx(type?: ConsumableType) {
    if (type === 'sternbild') { sfx.starUse(); this.fx.flash(0.08, 0x9fd8ff); }
    else if (type === 'omen') { sfx.omenUse(); this.fx.shake(7); this.fx.flash(0.12, 0xa82fff); }
    else sfx.elixirUse();
  }

  /** Baut alle Karten Ansichten der Hand neu auf, z. B. nachdem ein Elixier Karten verändert hat. */
  private rebuildHand() {
    const r = this.run?.round;
    if (!r) return;
    this.clearCardViews();
    this.applySort();
    for (const c of r.hand) this.makeCardView(c.id);
    this.layoutHand(0);
    this.refreshInfo();
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

    const result = playHand(run, sel.map((v) => v.card.id));
    const r = run.round;
    this.handsText.text = String(r.handsLeft);
    juice(this.handsText);

    // Move played cards to the play area
    sfx.whoosh();
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
    sfx.select(true);
    const base = result.events[0];
    this.setHandDisplay(handDisplayName(result.handType, result.scoring), run.handLevels[result.handType], base.chipsTotal, base.multTotal);
    juice(this.handName);
    await wait(380);

    let step = 0;
    for (const ev of result.events.slice(1)) {
      await this.animateEvent(ev, step);
      await wait(Math.max(90, 280 - step * 14));
      step++;
    }

    // Total
    await wait(150);
    const tier = scoreTier(result.total, r.target);
    this.totalText.text = fmt(result.total);
    this.totalText.alpha = 1;
    this.totalText.scale.set(0.3);
    sfx.total(tier.boom);
    this.fx.shake(tier.shake);
    this.fx.flash(tier.flash);
    await tween(this.totalText, { 'scale.x': 1, 'scale.y': 1 }, 260, easeOutBack);
    const before = r.score - result.total;
    await this.countUp(this.scoreText, before, r.score, 500);
    juice(this.scoreText);
    if (this.moneyText.text !== '$' + run.money) {
      this.moneyText.text = '$' + run.money;
      juice(this.moneyText);
    }
    await wait(250);
    tween(this.totalText, { alpha: 0 }, 250);

    await this.flyAway(sel);
    this.setHandDisplay('', null, 0, 0);
    saveRun(run);

    const drawn = afterHand(run);
    saveRun(run);
    this.notifyRescue();
    if (run.phase === 'roundWon') {
      await wait(250);
      this.busy = false;
      this.showRoundWon();
      return;
    }
    await this.drawCards(drawn);
    this.busy = false;
    if (run.phase === 'gameOver') {
      this.showGameOver();
      return;
    }
    saveRun(run);
    this.refreshInfo();
  }

  private async animateEvent(ev: ScoreEvent, step = 0) {
    this.playEventSound(ev, step);
    let target: Container | undefined;
    if (ev.source.kind === 'card' || ev.source.kind === 'held') target = this.cardViews.get(ev.source.cardId);
    else if (ev.source.kind === 'joker') target = this.jokerViews.get(ev.source.jokerUid);
    else if (ev.source.kind === 'consumable') target = this.consumableViews.get(ev.source.uid);
    if (target) {
      juice(target);
      const g = target.getGlobalPosition();
      const p = this.fxLayer.toLocal(g);
      const below = ev.source.kind === 'joker' || ev.source.kind === 'consumable';
      const above = below ? 100 : CARD_H / 2 + 40;
      const y = below ? p.y + above : p.y - above;
      if (ev.chips) popup(this.fxLayer, p.x, y, `+${fmt(ev.chips)}`, C.chips);
      if (ev.mult) popup(this.fxLayer, p.x, y, `+${fmtMult(ev.mult)} Mult`, C.mult, 28);
      if (ev.xMult) popup(this.fxLayer, p.x, y, `×${fmtMult(ev.xMult)} Mult`, C.mult, 30);
      if (ev.money) popup(this.fxLayer, p.x, y, `+$${ev.money}`, C.money);
      if (ev.message) popup(this.fxLayer, p.x, y, ev.message, ev.phase === 'debuff' ? 0x6b5a9e : C.accent, 26);
    } else if (ev.message) {
      // Regel Events (Balance, Boss) erscheinen über der Chips mal Mult Anzeige
      const p = this.fxLayer.toLocal(this.multBox.getGlobalPosition());
      popup(this.fxLayer, p.x - 77, p.y - 60, ev.message, C.accent, 26);
    }
    this.chipsText.text = fmt(ev.chipsTotal);
    this.multText.text = fmtMult(ev.multTotal);
    this.fitBoxText();
    if (ev.chips) juice(this.chipsBox, 0.6);
    if (ev.mult || ev.xMult) juice(this.multBox, ev.xMult ? 1.2 : 0.6);
  }

  /** Klang pro Score Schritt, die Tonhöhe steigt mit der Schrittzahl. X Mult erschüttert den Bildschirm. */
  private playEventSound(ev: ScoreEvent, step: number) {
    if (ev.phase === 'retrigger') sfx.retrigger(step);
    else if (ev.xMult) {
      sfx.xmult(step);
      this.fx.shake(xMultShake(ev.xMult));
    } else {
      if (ev.chips) sfx.chips(step);
      if (ev.mult) sfx.mult(step);
      if (!ev.chips && !ev.mult && !ev.money && ev.message) sfx.message(step);
    }
    if (ev.money) sfx.money();
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
    discardHand(run, sel.map((v) => v.card.id));
    sfx.discard();
    this.discardsText.text = String(run.round.discardsLeft);
    juice(this.discardsText);
    this.updateButtons();
    this.layoutHand();
    await this.flyAway(sel);
    const drawn = afterHand(run);
    saveRun(run);
    this.notifyRescue();
    if (run.phase === 'roundWon') {
      this.busy = false;
      this.refreshInfo();
      this.showRoundWon();
      return;
    }
    await this.drawCards(drawn);
    this.busy = false;
    if (run.phase === 'gameOver') {
      this.showGameOver();
      return;
    }
    saveRun(run);
    this.refreshInfo();
  }

  /** Meldung, wenn ein Joker die Runde vor der Niederlage gerettet hat */
  private notifyRescue() {
    const by = this.run?.round?.rescuedBy;
    if (by && this.run?.phase === 'roundWon') {
      this.syncJokers();
      this.toast(`${by} hat die Runde gerettet`, C.green);
    }
  }

  // ────────────────────────────────────────────────────────────── screens

  private clearOverlay() {
    for (const c of [...this.overlayLayer.children]) c.destroy({ children: true });
  }

  private clearScreen() {
    this.shopView?.destroy({ children: true });
    this.shopView = null;
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

  private toast(text: string, color = C.accent) {
    popup(this.fxLayer, VIEW_W / 2, 330, text, color, 30);
  }

  /** Zeigt den Bildschirm, der zur Phase des Runs passt. */
  private showPhase() {
    const run = this.run!;
    switch (run.phase) {
      case 'blindSelect': this.showBlindSelect(); break;
      case 'roundWon': this.showRoundWon(); break;
      case 'shop': this.showShop(); break;
      case 'pack': this.showPack(); break;
      case 'gameOver': this.showGameOver(); break;
      default: this.clearOverlay();
    }
  }

  private startNewRun() {
    this.showRunSetup();
  }

  private beginNewRun(deckId: string, stakeId: string) {
    this.clearCardViews();
    this.clearScreen();
    this.run = createRun({ seed: this.setupSeed || randomSeed(), deckId, stakeId });
    this.setupSeed = '';
    this.syncJokers();
    this.syncConsumables();
    saveRun(this.run);
    this.refreshInfo();
    this.showPhase();
  }

  private resume(run: RunState) {
    this.clearCardViews();
    this.clearScreen();
    this.run = run;
    this.syncJokers();
    this.syncConsumables();
    this.clearOverlay();
    if (run.round && (run.phase === 'round' || run.phase === 'roundWon')) {
      for (const c of run.round.hand) this.makeCardView(c.id).position.set(DECK_X, DECK_Y);
      this.layoutHand(400);
    }
    this.refreshInfo();
    this.showPhase();
  }

  private showRunSetup() {
    const pref = loadSetupPref();
    let deckIdx = Math.max(0, DECKS.findIndex((d) => d.id === pref.deckId));
    let stakeIdx = Math.max(0, STAKES.findIndex((s) => s.id === pref.stakeId));
    const { box } = this.modal(760, 700, C.panelDark);
    const head = label('Neuer Run', 44, C.text);
    head.position.set(380, 50);
    box.addChild(head);
    const content = new Container();
    box.addChild(content);

    const render = () => {
      for (const c of [...content.children]) c.destroy({ children: true });
      const deck = DECKS[deckIdx];
      const stake = STAKES[stakeIdx];
      const dl = label('Deck', 20, C.textDim);
      dl.position.set(380, 105);
      const back = cardBack(deck.color);
      back.position.set(380, 200);
      back.scale.set(0.8);
      const dn = label(deck.name, 30, C.text);
      dn.position.set(380, 290);
      const dd = new Text({ text: deck.description, style: { fontFamily: FONT, fontSize: 18, fontWeight: '700', fill: C.textDim, wordWrap: true, wordWrapWidth: 420, align: 'center' } });
      dd.anchor.set(0.5, 0);
      dd.position.set(380, 312);
      const sl = label('Stake', 20, C.textDim);
      sl.position.set(380, 392);
      const sn = label(stake.name, 30, stake.color);
      sn.position.set(380, 428);
      const sd = new Text({ text: stakeIdx === 0 ? stake.description : `${stake.description}, plus alle vorherigen`, style: { fontFamily: FONT, fontSize: 18, fontWeight: '700', fill: C.textDim, wordWrap: true, wordWrapWidth: 420, align: 'center' } });
      sd.anchor.set(0.5, 0);
      sd.position.set(380, 452);
      const arrow = (txt: string, x: number, y: number, fn: () => void) => {
        const b = new Button(txt, 70, 70, 0x4a3f6b, fn, 34);
        b.position.set(x, y);
        content.addChild(b);
      };
      content.addChild(dl, back, dn, dd, sl, sn, sd);
      arrow('‹', 110, 220, () => { deckIdx = (deckIdx + DECKS.length - 1) % DECKS.length; render(); });
      arrow('›', 650, 220, () => { deckIdx = (deckIdx + 1) % DECKS.length; render(); });
      arrow('‹', 110, 440, () => { stakeIdx = (stakeIdx + STAKES.length - 1) % STAKES.length; render(); });
      arrow('›', 650, 440, () => { stakeIdx = (stakeIdx + 1) % STAKES.length; render(); });
      const seedLbl = label('Seed', 20, C.textDim);
      seedLbl.position.set(380, 520);
      const seedBtn = new Button(this.setupSeed || 'Zufällig', 300, 56, 0x4a3f6b, () => {
        saveSetupPref({ deckId: deck.id, stakeId: stake.id });
        this.showSeedEntry();
      }, 26);
      seedBtn.position.set(380, 566);
      const start = new Button('Start', 300, 70, C.chips, () => {
        saveSetupPref({ deckId: deck.id, stakeId: stake.id });
        this.beginNewRun(deck.id, stake.id);
      }, 30);
      start.position.set(380, 645);
      content.addChild(seedLbl, seedBtn, start);
    };
    render();
  }

  private showMainMenu() {
    const saved = this.run ?? loadRun();
    const canResume = !!saved && saved.phase !== 'gameOver';
    this.hooks.setMood('menu');
    const { box } = this.modal(620, canResume ? 720 : 620, C.panelDark);
    const title = label('ALATRO', 110, C.text, { stroke: { color: C.mult, width: 10 }, letterSpacing: 6 });
    title.position.set(310, 130);
    const wobble = (): void => {
      if (title.destroyed) return;
      tween(title, { rotation: title.rotation > 0 ? -0.03 : 0.03 }, 1600, easeInOutCubic).then(wobble);
    };
    wobble();
    const sub = label('Roguelike Poker Deckbuilder', 24, C.textDim);
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
    const coll = new Button('Sammlung', 400, 76, 0x6b5a9e, () => this.showCollection(), 30);
    coll.position.set(310, y + 100);
    const opt = new Button('Optionen', 400, 76, 0x4a3f6b, () => this.showOptions(), 30);
    opt.position.set(310, y + 200);
    box.addChild(nr, coll, opt);
  }

  /** Optionen: CRT, Screen Shake und Lautstärke, werden sofort gespeichert und angewendet */
  private showOptions() {
    const W = 620;
    const { box } = this.modal(W, 560, C.panelDark);
    const head = label('Optionen', 44, C.text);
    head.position.set(W / 2, 56);
    box.addChild(head);
    const dyn = new Container();
    box.addChild(dyn);
    const render = () => {
      for (const c of [...dyn.children]) c.destroy({ children: true });
      const st = getSettings();
      const row = (y: number, name: string, desc: string) => {
        const n = label(name, 28, C.text);
        n.anchor.set(0, 0.5);
        n.position.set(50, y - 12);
        const d = label(desc, 16, C.textDim, { fontWeight: '600' });
        d.anchor.set(0, 0.5);
        d.position.set(50, y + 20);
        dyn.addChild(n, d);
      };
      row(150, 'CRT Effekt', 'Scanlines und leichte Wölbung');
      const crt = new Button(st.crt ? 'An' : 'Aus', 130, 56, st.crt ? C.green : 0x4a3f6b, () => { updateSettings({ crt: !st.crt }); render(); }, 24);
      crt.position.set(W - 115, 150);
      row(250, 'Screen Shake', 'Wackeln und Aufblitzen bei hohen Punkten');
      const shake = new Button(st.shake ? 'An' : 'Aus', 130, 56, st.shake ? C.green : 0x4a3f6b, () => {
        updateSettings({ shake: !st.shake });
        render();
        this.fx.shake(6);
      }, 24);
      shake.position.set(W - 115, 250);
      row(350, 'Lautstärke', `${Math.round(st.volume * 100)} Prozent`);
      const minus = new Button('−', 60, 56, 0x4a3f6b, () => { updateSettings({ volume: clampVolume(st.volume - VOLUME_STEP) }); sfx.chips(2); render(); }, 30);
      minus.position.set(W - 175, 350);
      const plus = new Button('+', 60, 56, 0x4a3f6b, () => { updateSettings({ volume: clampVolume(st.volume + VOLUME_STEP) }); sfx.chips(2); render(); }, 30);
      plus.position.set(W - 95, 350);
      const back = new Button('Zurück', 300, 70, C.chips, () => this.showMainMenu(), 28);
      back.position.set(W / 2, 480);
      dyn.addChild(crt, shake, minus, plus, back);
    };
    render();
  }

  /** Sammlung aller gesehenen Inhalte, Zurück führt ins Hauptmenü */
  private showCollection() {
    const { box } = this.modal(COLLECTION_W, COLLECTION_H, C.panelDark);
    buildCollection(box, () => this.showMainMenu());
  }

  /** Run Info (Hände, Blinds, Vouchers, Deck) über dem laufenden Run */
  private showRunInfo(tab: RunInfoTab = 'hands') {
    const run = this.run;
    if (!run) return;
    const { box } = this.modal(RUN_INFO_W, RUN_INFO_H, C.panelDark);
    buildRunInfo(box, run, () => this.clearOverlay(), tab);
  }

  /** Seed Eingabe mit eigener Tastatur: 0 bis 8 Zeichen, O gilt als 0, leer = zufällig */
  private showSeedEntry() {
    let seed = this.setupSeed;
    const W = 760;
    const { box } = this.modal(W, 720, C.panelDark);
    const head = label('Seed', 44, C.text);
    head.position.set(W / 2, 50);
    const hint = label(`0 bis ${SEED_LENGTH} Zeichen, leer lassen für einen Zufalls Seed`, 18, C.textDim);
    hint.position.set(W / 2, 100);
    box.addChild(head, hint);
    const dyn = new Container();
    box.addChild(dyn);

    const render = () => {
      for (const c of [...dyn.children]) c.destroy({ children: true });
      for (let i = 0; i < SEED_LENGTH; i++) {
        const x = W / 2 + (i - (SEED_LENGTH - 1) / 2) * 76;
        dyn.addChild(new Graphics().roundRect(x - 32, 130, 64, 76, 10).fill(0x15111f).stroke({ width: 3, color: i === seed.length ? C.accent : C.panelLine }));
        if (seed[i]) {
          const ch = label(seed[i], 40, C.text);
          ch.position.set(x, 168);
          dyn.addChild(ch);
        }
      }
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      [...chars].forEach((ch, i) => {
        const b = new Button(ch, 66, 66, 0x4a3f6b, () => { seed = normalizeSeed(seed + ch); render(); }, 30);
        b.position.set(W / 2 + ((i % 9) - 4) * 76, 270 + Math.floor(i / 9) * 76);
        b.enabled = seed.length < SEED_LENGTH;
        dyn.addChild(b);
      });
      const del = new Button('Löschen', 200, 62, C.mult, () => { seed = seed.slice(0, -1); render(); }, 24);
      del.position.set(W / 2 - 230, 620);
      del.enabled = seed.length > 0;
      const rnd = new Button('Zufällig', 200, 62, 0x6b5a9e, () => { seed = ''; render(); }, 24);
      rnd.position.set(W / 2, 620);
      const ok = new Button('Fertig', 200, 62, C.green, () => {
        this.setupSeed = seed;
        this.showRunSetup();
      }, 24);
      ok.position.set(W / 2 + 230, 620);
      dyn.addChild(del, rnd, ok);
    };
    render();
  }

  private showBlindSelect() {
    const run = this.run!;
    this.clearScreen();
    this.refreshInfo();
    const { box } = this.modal(1000, 610, C.panelDark);
    const head = label(`Ante ${run.ante}${run.ante > FINAL_ANTE ? ' · Endless' : ''}`, 40, C.text);
    head.position.set(500, 46);
    box.addChild(head);

    BLIND_KINDS.forEach((kind, i) => {
      const col = new Container();
      col.position.set(35 + i * 315, 90);
      const state = i < run.blindIndex ? 'done' : i === run.blindIndex ? 'current' : 'future';
      const boss = kind === 'boss' && run.anteBoss ? BOSS_BY_ID[run.anteBoss] : undefined;
      const color = boss ? boss.color : BLIND_COLORS[kind];
      const g = new Graphics()
        .roundRect(0, 0, 300, 490, 16).fill(state === 'current' ? color : C.panel)
        .stroke({ width: 3, color: state === 'current' ? 0xffffff : C.panelLine, alpha: state === 'current' ? 0.6 : 1 });
      col.addChild(g);
      const name = label(boss ? boss.name : BLIND_NAMES[kind], 26);
      name.position.set(150, 36);
      if (name.width > 280) name.scale.set(280 / name.width);
      const chip = new Graphics().circle(150, 108, 40).fill({ color: 0x0b0814, alpha: 0.4 }).stroke({ width: 4, color: 0xffffff, alpha: 0.5 });
      const chipT = label(kind === 'boss' ? '☠' : kind === 'big' ? '◆' : '●', 38, 0xffffff);
      chipT.position.set(150, 108);
      col.addChild(name, chip, chipT);
      if (boss) {
        const d = new Text({ text: boss.description, style: { fontFamily: FONT, fontSize: 17, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 260, align: 'center' } });
        d.anchor.set(0.5, 0);
        d.position.set(150, 160);
        col.addChild(d);
      }
      const zl = label('Mindestens', 17, C.textDim);
      zl.position.set(150, 228);
      const target = label(fmt(currentTarget(run, kind)), 34, C.mult);
      target.position.set(150, 262);
      const rw = blindReward(run.ante, kind, run.rules.smallBlindReward);
      const rew = label(rw > 0 ? 'Belohnung ' + '$'.repeat(rw) : 'Keine Belohnung', 19, C.money);
      rew.position.set(150, 298);
      col.addChild(zl, target, rew);
      if (kind !== 'boss' && run.anteTags) {
        const tag = TAG_BY_ID[run.anteTags[kind]];
        const tb = new Graphics().roundRect(16, 322, 268, 86, 12).fill({ color: 0x0b0814, alpha: 0.35 });
        const tn = label(`Skip Tag: ${tag.name}`, 17, C.accent);
        tn.position.set(150, 342);
        const td = new Text({ text: tag.description, style: { fontFamily: FONT, fontSize: 15, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 250, align: 'center' } });
        td.anchor.set(0.5, 0);
        td.position.set(150, 360);
        col.addChild(tb, tn, td);
      }
      if (state === 'current') {
        const play = new Button('Spielen', kind === 'boss' ? 220 : 140, 58, C.money, () => this.beginRound(), 24);
        play.position.set(kind === 'boss' ? 150 : 85, 448);
        col.addChild(play);
        if (kind !== 'boss') {
          const skip = new Button('Skip', 110, 58, 0x6b5a9e, () => this.doSkip(), 24);
          skip.position.set(222, 448);
          col.addChild(skip);
        }
      } else {
        const s = label(state === 'done' ? 'Erledigt' : 'Kommt noch', 21, C.textDim);
        s.position.set(150, 448);
        col.addChild(s);
        col.alpha = state === 'done' ? 0.5 : 0.75;
      }
      box.addChild(col);
    });
  }

  private doSkip() {
    const run = this.run!;
    const r = skipBlind(run);
    saveRun(run);
    this.refreshInfo();
    juice(this.moneyText);
    this.toast(`Tag: ${TAG_BY_ID[r.tagId].name}${r.doubled ? ' (doppelt)' : ''}`);
    if (run.phase === 'pack') this.showPack();
    else this.showBlindSelect();
  }

  private async beginRound() {
    const run = this.run!;
    this.clearOverlay();
    this.clearScreen();
    this.clearCardViews();
    const picked = selectBlind(run);
    this.busy = true;
    this.syncConsumables();
    sfx.blindStart(BLIND_KINDS[Math.min(run.blindIndex, 2)]);
    this.refreshInfo();
    if (picked.money || picked.consumables.length) {
      const n = picked.consumables.length;
      const parts = [picked.money ? `+$${picked.money}` : '', n ? `${n} Consumable${n > 1 ? 's' : ''}` : ''].filter(Boolean);
      this.toast(`Jokers: ${parts.join(', ')}`, C.money);
      juice(this.moneyText);
    }
    await this.drawCards([...run.round!.hand]);
    this.busy = false;
    saveRun(run);
    this.refreshInfo();
  }

  private showRoundWon() {
    const run = this.run!;
    const e = computeEarnings(run);
    sfx.win();
    this.fx.flash(0.18, 0xffd23f);
    const lines: [string, number][] = [
      ['Blind Belohnung', e.blindReward],
      [`Übrige Hands (${run.round!.handsLeft})`, e.handsBonus],
      ...(e.discardsBonus ? [[`Übrige Discards (${run.round!.discardsLeft})`, e.discardsBonus] as [string, number]] : []),
      [`Zinsen ($1 je $${run.rules.interestPer}, max. $${run.rules.interestCap + jokerPassive(run).interestCapDelta})`, e.interest],
      ...(e.jokers ? [['Jokers', e.jokers] as [string, number]] : []),
    ];
    const boxH = 288 + 58 * lines.length;
    const { box } = this.modal(580, boxH, C.panelDark);
    const head = label('Blind geschafft!', 44, C.money);
    head.position.set(290, 60);
    box.addChild(head);
    lines.forEach(([t, v], i) => {
      const l = label(t, 22, C.text);
      l.anchor.set(0, 0.5);
      l.position.set(40, 150 + i * 58);
      const r = label('$' + v, 30, C.money);
      r.anchor.set(1, 0.5);
      r.position.set(540, 150 + i * 58);
      l.alpha = r.alpha = 0;
      wait(200 + i * 220).then(() => { tween(l, { alpha: 1 }, 200); tween(r, { alpha: 1 }, 200); juice(r); });
      box.addChild(l, r);
    });
    const btn = new Button(`Einkassieren $${e.total}`, 360, 76, C.money, async () => {
      btn.enabled = false;
      const remaining = run.round!.hand.map((c) => this.cardViews.get(c.id)!).filter(Boolean);
      const paid = cashOut(run);
      saveRun(run);
      this.syncConsumables();
      juice(this.moneyText);
      this.clearOverlay();
      if (paid.starSealCreated.length) this.toast(`Stern Seal: ${paid.starSealCreated.length} Sternbild erzeugt`, C.chips);
      await this.flyAway(remaining);
      this.clearCardViews();
      if (run.won && !run.winShown) {
        run.winShown = true;
        saveRun(run);
        this.showRunWon();
      } else {
        this.showShop();
      }
    }, 28);
    btn.position.set(290, boxH - 75);
    box.addChild(btn);
  }

  private showShop() {
    this.clearOverlay();
    this.renderShop(true);
  }

  private renderShop(animate = false) {
    const run = this.run!;
    this.clearScreen();
    this.refreshInfo();
    if (run.phase !== 'shop' || !run.shop) return;
    const after = () => {
      saveRun(run);
      this.renderShop();
    };
    this.shopView = buildShop(run, {
      buyCard: (i) => {
        if (buyCard(run, i)) {
          sfx.buy();
          this.syncJokers();
          this.syncConsumables();
          juice(this.moneyText);
          after();
        }
      },
      buyAndUse: (i) => {
        const item = run.shop?.cards[i];
        const type = item?.kind === 'consumable' ? CONSUMABLE_BY_ID[item.defId]?.type : undefined;
        const res = buyAndUse(run, i);
        if (res) {
          sfx.buy();
          this.afterConsumableUse(res, type);
        }
      },
      buyPack: (i) => {
        if (buyPack(run, i)) {
          sfx.packOpen();
          saveRun(run);
          this.renderShop();
          this.showPack();
        }
      },
      buyVoucher: () => {
        if (buyVoucher(run)) {
          sfx.buy();
          this.fx.flash(0.06, 0xffd23f);
          juice(this.moneyText);
          after();
        }
      },
      reroll: () => {
        if (reroll(run)) {
          sfx.reroll();
          after();
        }
      },
      nextRound: () => {
        leaveShop(run);
        saveRun(run);
        this.showBlindSelect();
      },
    }, animate);
    this.screenLayer.addChild(this.shopView);
  }

  private showPack() {
    const run = this.run!;
    const p = run.pack;
    if (!p) return this.showPhase();
    const def = PACK_BY_ID[p.packId];
    // Elixier und Omen Packs zeigen zusätzlich eine Hand, aus der die Ziel Karten gewählt werden
    const withHand = !!p.handIds;
    const W = 1040;
    const H = withHand ? 800 : 600;
    const { box } = this.modal(W, H, C.panelDark);
    const typeColor = def.kind === 'joker' ? C.mult : def.kind === 'karten' ? C.chips : CONSUMABLE_COLORS[def.kind];
    const head = label(def.name, 40, typeColor);
    head.position.set(W / 2, 50);
    box.addChild(head);
    const dyn = new Container();
    box.addChild(dyn);
    /** gewählte Ziel Karten der Pack Hand (Reihenfolge der Wahl) */
    const targets: number[] = [];

    const render = () => {
      for (const c of [...dyn.children]) c.destroy({ children: true });
      const sub = label(`Wähle noch ${p.picksLeft}`, 20, C.textDim);
      sub.position.set(W / 2, 92);
      dyn.addChild(sub);
      const n = p.options.length;
      const spacing = Math.min(200, 960 / Math.max(n, 1));
      p.options.forEach((o, i) => {
        const x = W / 2 + (i - (n - 1) / 2) * spacing;
        if (!o) return;
        let view: Container;
        let text: string;
        if (o.kind === 'joker') {
          view = new JokerView({ uid: -1, defId: o.defId, vars: {}, edition: o.edition });
          const jd = getJoker(o.defId)!;
          text = `${jd.name}\n${jokerDescription(jd)}` + (o.edition ? `\n${EDITIONS[o.edition].name}: ${EDITIONS[o.edition].description}` : '');
        } else if (o.kind === 'consumable') {
          view = new ConsumableView(o.defId);
          const cd = CONSUMABLE_BY_ID[o.defId];
          text = `${cd.name}\n${cd.description}`;
          if (cd.targets) text += `\nZiele: ${targets.length} von ${cd.targets.min === cd.targets.max ? cd.targets.min : `${cd.targets.min} bis ${cd.targets.max}`}`;
        } else {
          view = new CardView(o.card);
          const parts: string[] = [];
          if (o.card.enhancement) parts.push(`${ENHANCEMENTS[o.card.enhancement].name}: ${ENHANCEMENTS[o.card.enhancement].description}`);
          if (o.card.seal) parts.push(`${SEALS[o.card.seal].name}: ${SEALS[o.card.seal].description}`);
          if (o.card.edition) parts.push(`${EDITIONS[o.card.edition].name}: ${EDITIONS[o.card.edition].description}`);
          text = parts.join('\n') || 'Normale Karte';
        }
        view.eventMode = 'none';
        view.position.set(x, 200);
        const t = new Text({ text, style: { fontFamily: FONT, fontSize: 15, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: spacing - 14, align: 'center' } });
        t.anchor.set(0.5, 0);
        t.position.set(x, 295);
        const pick = new Button('Wählen', 130, 50, C.green, () => this.pickPackOption(i, targets), 20);
        pick.position.set(x, withHand ? 460 : 470);
        pick.enabled = canPick(run, i, targets);
        dyn.addChild(view, t, pick);
      });

      if (p.handIds) {
        const hl = label('Deine Karten, wähle die Ziele', 18, C.textDim);
        hl.position.set(W / 2, 520);
        dyn.addChild(hl);
        const cards = p.handIds.map((id) => run.deck.find((c) => c.id === id)).filter((c): c is Card => !!c);
        const cs = Math.min(112, 880 / Math.max(cards.length, 1));
        cards.forEach((card, i) => {
          const cv = new CardView(card);
          cv.scale.set(0.7);
          const on = targets.includes(card.id);
          cv.position.set(W / 2 + (i - (cards.length - 1) / 2) * cs, 620 - (on ? 16 : 0));
          cv.on('pointertap', () => {
            const at = targets.indexOf(card.id);
            if (at >= 0) targets.splice(at, 1);
            else targets.push(card.id);
            render();
          });
          dyn.addChild(cv);
          if (on) dyn.addChild(new Graphics().roundRect(cv.x - 42, cv.y - 60, 84, 120, 8).stroke({ width: 4, color: C.money }));
        });
      }

      const skip = new Button('Überspringen', 240, 56, 0x6b5a9e, () => {
        closePack(run);
        saveRun(run);
        this.clearOverlay();
        this.showPhase();
      }, 22);
      skip.position.set(W / 2, H - 52);
      dyn.addChild(skip);
    };
    render();
  }

  private pickPackOption(i: number, targets: number[] = []) {
    const run = this.run!;
    const opt = run.pack?.options[i];
    const type = opt?.kind === 'consumable' ? CONSUMABLE_BY_ID[opt.defId]?.type : undefined;
    const res = pickFromPack(run, i, targets);
    if (!res) return;
    if (type) this.playConsumableFx(type);
    else sfx.pick();
    this.syncJokers();
    this.syncConsumables();
    if (typeof res !== 'boolean') this.toast(res.message, C.accent);
    saveRun(run);
    this.refreshInfo();
    if (run.phase === 'pack') this.showPack();
    else {
      this.clearOverlay();
      this.showPhase();
    }
  }

  private showGameOver() {
    const run = this.run!;
    saveRun(null);
    sfx.lose();
    this.fx.shake(12);
    const { box } = this.modal(560, 440, C.panelDark);
    const head = label('Verloren', 64, C.mult);
    head.position.set(280, 80);
    const l1 = label(`Erreicht: Ante ${run.ante}, Round ${(run.ante - 1) * 3 + run.blindIndex + 1}`, 24);
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
    sfx.victory();
    this.fx.flash(0.3, 0xffd23f);
    this.fx.shake(10);
    const { box } = this.modal(620, 440, C.panelDark);
    const head = label('Gewonnen!', 72, C.money, { stroke: { color: C.mult, width: 8 } });
    head.position.set(310, 90);
    const l = label(`Ante ${FINAL_ANTE} besiegt.`, 26);
    l.position.set(310, 180);
    const a = new Button('Endless weiterspielen', 380, 70, C.chips, () => this.showShop(), 26);
    a.position.set(310, 270);
    const b = new Button('Neuer Run', 380, 70, C.mult, () => this.startNewRun(), 26);
    b.position.set(310, 360);
    box.addChild(head, l, a, b);
  }
}

const SETUP_KEY = 'alatro.setup';

function loadSetupPref(): { deckId?: string; stakeId?: string } {
  try {
    return JSON.parse(localStorage.getItem(SETUP_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveSetupPref(p: { deckId: string; stakeId: string }) {
  try {
    localStorage.setItem(SETUP_KEY, JSON.stringify(p));
  } catch {
    /* Speicher nicht verfügbar */
  }
}
