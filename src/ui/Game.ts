import { Container, Graphics, Text, Ticker, type FederatedPointerEvent } from 'pixi.js';
import { BLIND_KINDS, BLIND_NAMES, FINAL_ANTE, blindReward, blindTarget, type BlindKind } from '../core/blinds';
import { SUIT_NAMES, sortByRank, sortBySuit, type Card } from '../core/cards';
import {
  TAG_BY_ID, PACK_BY_ID, afterHand, buyAndUse, buyCard, buyPack, buyVoucher, canPick, canUseConsumable, cashOut, closePack, createRun,
  discardHand, leaveShop, pickFromPack, playHand, reroll, selectBlind, sellConsumable, sellJoker as sellJokerAction, skipBlind,
  useConsumable,
} from '../core/game';
import { consumableCapacity, consumableSellValue, type UseResult } from '../core/consumables';
import { handDisplayName } from '../core/hands';
import { HAND_DATA } from '../data/hands';
import type { HandType } from '../core/types';
import { getJoker, jokerDescription, jokerRules } from '../core/jokers';
import { effectTags, triggerLabel } from './jokerInfo';
import { richText } from './richText';
import { hashString, normalizeSeed, randomSeed, SEED_LENGTH } from '../core/rng';
import { TIPS } from '../data/tips';
import {
  BOSS_BY_ID, MAX_SELECT, activeBoss, computeEarnings, currentTarget, isCardDebuffed, jokerCapacity, jokerPassive, jokerSellValue, type RunState,
} from '../core/run';
import { previewHand, type ScoreEvent } from '../core/scoring';
import { CONSUMABLE_BY_ID, CONSUMABLE_TYPE_NAMES, type ConsumableType } from '../data/consumables';
import { DECKS } from '../data/decks';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { APP_VERSION } from '../data/patchnotes';
import { BEGINNER_STAKE_ID, STAKES } from '../data/stakes';
import { MUSIC_MIX, MUSIC_MIX_INFO, MUSIC_MIX_NAME, MUSIC_OFF, TRACK_IDS, getTrack } from '../data/music';
import { clampVolume, cycleSpeed, getSettings, tapBoost, hintSeen, loadPatchSeen, markHintSeen, savePatchSeen, updateSettings } from '../settings';
import { CARD_PALETTES, CARD_PALETTE_IDS } from '../data/cardArt/cardPalettes';
import { QUALITY_NAMES, SPEED_STEPS, VOLUME_STEP, type BgMood } from '../data/juice';
import { loadRun, saveRun } from '../save';
import { collectionProgress, entryName, loadDiscovered, unseenKeys } from '../collection';
import { nearMiss, newKeys, overkill } from '../report';
import { OVERKILL_BIG, REPORT_NEW_MAX } from '../data/report';
import { evaluateAchievements, rankOf, unlockedCount } from '../achievements';
import { ACHIEVEMENTS, type AchievementDef } from '../data/achievements';
import { dailySetup, dateKey, TWIST_BY_ID } from '../data/daily';
import { SCALE, clampScale, scaleBand, scaleName, scaleSummary } from '../data/difficulty';
import type { GuideTarget } from '../data/guide';
import { TutorialFlow } from '../core/tutorialFlow';
import { cardKey, createTutorialRun, rigTutorialShop, startTutorialRound } from '../core/tutorialRun';
import { deckSeal, getProfile, nextSealGoal, observeRun, saveProfile } from '../profile';
import { ACH_H, ACH_W, buildAchievements } from './AchievementsView';
import { Guide } from './Guide';
import { sfx } from './audio';
import { haptics } from './haptics';
import { CARD_H, CardView, cardBack } from './CardView';
import { ConsumableView, CONSUMABLE_H } from './ConsumableView';
import { playPackOpen, type FanTarget } from './packFx';
import { trayLayout } from './consumableTray';
import { OPEN_FX } from '../data/artFx';
import { BACKUP_H, BACKUP_W, buildBackup } from './BackupView';
import { buildSync, SYNC_H, SYNC_W } from './SyncView';
import { syncManager } from './syncManager';
import { buildCollection, COLLECTION_H, COLLECTION_W } from './CollectionView';
import { buildPatchNotes, buildTutorial, PATCH_H, PATCH_W, TUTORIAL_H, TUTORIAL_W } from './InfoViews';
import { buildHome } from './HomeView';
import { ScreenTransition } from './ScreenTransition';
import { JokerView } from './JokerView';
import { buildRunInfo, RUN_INFO_H, RUN_INFO_W, type RunInfoTab } from './RunInfoView';
import { buildShop, buildShopSign } from './ShopView';
import { C, CONSUMABLE_COLORS, FONT_BODY, RARITY_COLORS, RARITY_NAMES, STYLE, VIEW_H, VIEW_W, fmt, fmtMult, shade } from './theme';
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
/** größte Breite des Round Score Werts im Seitenfeld (daneben steht die Beschriftung) */
const SCORE_MAX_W = 185;

const BLIND_COLORS: Record<BlindKind, number> = { small: 0x1f8fc4, big: 0xe08a1e, boss: 0xd23a4a };

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
  private homeLayer = new Container();
  private overlayLayer = new Container();
  private guideLayer = new Container();
  private flashLayer = new Container();
  private achLayer = new Container();
  private screenLayer = new Container();
  /** Kuppelblende zwischen den großen Screens, liegt über allem */
  private trans = new ScreenTransition();
  private handControls = new Container();
  private deckPile = new Container();
  private shopView: Container | null = null;

  /** Einführungsrunde: Ablauf (null außerhalb der Einführung), Hinweisfeld und Zeiger Ziele */
  private tut: TutorialFlow | null = null;
  private guide: Guide;
  private refs: Record<string, Container | undefined> = {};
  private jokerTray: Container | null = null;
  /** Erfolge: Warteschlange der Banner und Freischaltungen des laufenden Runs */
  private achQueue: AchievementDef[] = [];
  private achShowing = false;
  private runUnlocked: string[] = [];
  /** Sammlung beim Start des Runs (für Neu im Atlas) und beim letzten Speichern (für die Toasts) */
  private runStartKeys: string[] = [];
  private knownKeys: string[] = [];

  private cardViews = new Map<number, CardView>();
  private jokerViews = new Map<number, JokerView>();
  private consumableViews = new Map<number, ConsumableView>();
  /** Pack, für den die Öffnungsanimation schon lief (nach jeder Wahl wird die Ansicht neu gebaut) */
  private packAnimated: object | null = null;
  /** Seed für den nächsten Run, leer = zufällig */
  private setupSeed = '';
  private tooltip: Container | null = null;

  // Sidebar
  private blindBg = new Graphics();
  private blindPanel = new Container();
  /** Im Shop ersetzen diese Vorschau Felder die Anzeige von Round Score und Hand */
  private scorePanel = new Container();
  private handPanel = new Container();
  private nextPanel = new Container();
  private nextTexts!: { blind: Text; target: Text; reward: Text; bossName: Text; bossDesc: Text; line: Graphics; bossHead: Text };
  private shopSign = new Container();
  private blindName!: Text;
  private targetText!: Text;
  private rewardText!: Text;
  private zielLabel!: Text;
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
  /** Einführungshinweis in der Tischmitte, nur bis zur ersten gespielten Hand */
  private hintText!: Text;

  private playBtn!: Button;
  private discardBtn!: Button;
  private sortRankBtn!: Button;
  private sortSuitBtn!: Button;
  private speedBtn!: Button;

  constructor(private hooks: GameHooks = { setMood: () => {} }) {
    // Tippen während einer laufenden Animation beschleunigt sie kurz
    if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => { if (this.busy) tapBoost(); }, { passive: true });
    this.handLayer.sortableChildren = true;
    this.jokerLayer.sortableChildren = true;
    this.root.addChild(this.table, this.jokerLayer, this.playLayer, this.handLayer, this.screenLayer, this.fxLayer, this.homeLayer, this.overlayLayer, this.guideLayer, this.flashLayer, this.achLayer, this.trans.root);
    this.guide = new Guide(() => this.exitGuide(false));
    this.guideLayer.addChild(this.guide.root);
    Ticker.shared.add((t) => this.guide.update(t.deltaMS));
    this.fx = new StageFx(this.root, this.flashLayer);
    this.buildTable();
    // Beim Öffnen ist die Kuppel zu und öffnet sich über dem Home Bildschirm, danach erst Angebote und Patch Notes
    this.trans.cover();
    this.openHome();
    void this.trans.intro().then(() => this.firstLaunch());
    syncManager.init({
      canReplaceRun: () => this.homeVisible(),
      onRunReplaced: () => {
        // Home neu aufbauen, damit "Fortsetzen" den Cloud Run zeigt
        this.run = null;
        if (this.homeVisible()) {
          this.homeLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
          this.openHome();
        }
      },
    });
  }

  /**
   * Erster Start: neue Spieler bekommen das Angebot der Einführungsrunde (ohne Patch Notes davor).
   * Wer schon Spielstand, Sammlung oder gesehene Patch Notes hat, kennt das Spiel: dann nur die Neuigkeiten.
   */
  private firstLaunch() {
    const p = getProfile();
    if (!p.tutorialOffered) {
      const known = loadPatchSeen() !== null || loadRun() !== null || loadDiscovered().length > 0;
      if (known) {
        p.tutorialOffered = true;
        saveProfile();
      } else {
        savePatchSeen(APP_VERSION);
        this.showGuideOffer();
        return;
      }
    }
    if (loadPatchSeen() !== APP_VERSION) this.showPatchNotes();
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
    const side = new Graphics().roundRect(10, 10, 350, VIEW_H - 20, 12).fill({ color: 0x24354a, alpha: 0.9 }).stroke({ width: 3, color: C.panelLine })
      .roundRect(15, 15, 340, VIEW_H - 30, 9).stroke({ width: 1.5, color: C.holo, alpha: 0.3 });
    t.addChild(side);

    // Blind panel
    const bp = this.blindPanel;
    bp.position.set(20, 20);
    this.blindBg = new Graphics();
    this.blindName = label('', 28);
    this.blindName.position.set(165, 30);
    const zielLbl = label('Ziel', 18, C.textDim);
    zielLbl.position.set(165, 72);
    this.zielLabel = zielLbl;
    this.targetText = label('', 40, C.mult);
    this.targetText.position.set(165, 105);
    this.rewardText = label('', 20, C.money);
    this.rewardText.position.set(165, 140);
    this.bossDesc = new Text({ text: '', style: { fontFamily: FONT_BODY, fontSize: 15, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 300, align: 'center' } });
    this.bossDesc.anchor.set(0.5, 0);
    this.bossDesc.position.set(165, 110);
    bp.addChild(this.blindBg, this.blindName, zielLbl, this.targetText, this.rewardText, this.bossDesc);
    t.addChild(bp);
    // Im Shop ersetzt ein Leuchtschild die Blind Anzeige
    this.shopSign = buildShopSign();
    this.shopSign.position.set(20, 20);
    this.shopSign.visible = false;
    t.addChild(this.shopSign);

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
    this.scorePanel = sp;
    t.addChild(sp);

    // Hand panel: name, level, chips × mult
    const hp = panel(330, 170, C.panelDark);
    hp.position.set(20, 284);
    this.handName = label('', 28);
    this.handName.position.set(165, 34);
    this.handLevel = label('', 18, C.textDim);
    this.handLevel.position.set(165, 66);
    const box = (c: Container, color: number, x: number) => {
      c.addChild(new Graphics().roundRect(-66, -36, 132, 72, 8).fill(color).stroke({ width: 3, color: C.panelLine }));
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
    this.handPanel = hp;
    t.addChild(hp);
    this.buildNextPanel();

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

    const menuBtn = new Button('Menü', 160, 60, 0x3b5068, () => { if (this.guardGuide()) return; if (!this.busy) this.showMainMenu(); }, 24);
    menuBtn.position.set(100, 800);
    const infoBtn = new Button('Run Info', 160, 60, 0xf2711c, () => { if (this.guardGuide()) return; if (!this.busy && this.run) this.showRunInfo(); }, 24);
    infoBtn.position.set(270, 800);
    t.addChild(menuBtn, infoBtn);
    this.speedBtn = new Button('', 330, 54, 0x2f6fd0, () => { cycleSpeed(); this.refreshSpeedBtn(); }, 24);
    this.refreshSpeedBtn();
    this.speedBtn.position.set(185, 872);
    t.addChild(this.speedBtn);

    this.seedText = label('', 18, C.textDim, { fontWeight: '600' });
    this.seedText.position.set(185, 960);
    this.tagsText = new Text({ text: '', style: { fontFamily: FONT_BODY, fontSize: 15, fontWeight: '700', fill: C.accent, wordWrap: true, wordWrapWidth: 320, align: 'center' } });
    this.tagsText.anchor.set(0.5, 1);
    this.tagsText.position.set(185, 935);
    t.addChild(this.seedText, this.tagsText);

    // Joker tray + consumable tray
    const jt = panel(JOKER_TRAY_W, 180, C.panelDark);
    jt.alpha = 0.85;
    jt.position.set(JOKER_TRAY_X, 24);
    this.jokerCount = label('', 18, C.textDim);
    this.jokerCount.anchor.set(0, 0.5);
    this.jokerCount.position.set(JOKER_TRAY_X + 12, 220);
    const ct = panel(CONS_TRAY_W, 180, C.panelDark);
    ct.alpha = 0.85;
    ct.position.set(CONS_TRAY_X, 24);
    this.consLabel = label('Consumables 0/2', 18, C.textDim);
    this.consLabel.anchor.set(1, 0.5);
    this.consLabel.position.set(1408, 220);
    this.jokerTray = jt;
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
    this.sortRankBtn = new Button('Rank', 116, 56, 0xf2711c, () => this.setSort('rank'), 22);
    this.sortRankBtn.position.set(MX - 64, 935);
    this.sortSuitBtn = new Button('Suit', 116, 56, 0xf2711c, () => this.setSort('suit'), 22);
    this.sortSuitBtn.position.set(MX + 64, 935);
    const sortLbl = label('Sortieren', 18, C.textDim);
    sortLbl.position.set(MX, 892);
    this.handControls.addChild(this.playBtn, this.discardBtn, this.sortRankBtn, this.sortSuitBtn, sortLbl);
    t.addChild(this.handControls);

    this.totalText = label('', 64, C.text, { stroke: { color: 0x070b11, width: 8 } });
    this.totalText.position.set(MX, 600);
    this.totalText.alpha = 0;
    this.fxLayer.addChild(this.totalText);

    this.hintText = wrapText('Tippe bis zu 5 Karten an, um sie auszuwählen.\nDer Kasten links zeigt die Pokerhand dazu. Dann Play Hand.', 800, 24, C.textDim);
    this.hintText.position.set(MX, 380);
    this.hintText.eventMode = 'none';
    this.hintText.visible = false;
    this.table.addChild(this.hintText);
  }

  /** Vorschau im Shop: nächster Blind und Boss der Ante, damit sich Käufe darauf abstimmen lassen */
  private buildNextPanel() {
    const np = panel(330, 262, C.panelDark);
    np.position.set(20, 192);
    np.visible = false;
    const head = label('Als Nächstes', 20, C.textDim);
    head.position.set(165, 28);
    const blind = label('', 28);
    blind.position.set(165, 66);
    const target = label('', 36, C.mult);
    target.position.set(165, 110);
    const reward = label('', 19, C.money);
    reward.position.set(165, 148);
    const line = new Graphics().rect(24, 168, 282, 2).fill({ color: C.holo, alpha: 0.3 });
    const bossHead = label('Boss dieser Ante', 18, C.textDim);
    bossHead.position.set(165, 186);
    const bossName = label('', 22, C.accent);
    bossName.position.set(165, 211);
    const bossDesc = wrapText('', 296, 15, C.text);
    bossDesc.position.set(165, 228);
    np.addChild(head, blind, target, reward, line, bossHead, bossName, bossDesc);
    this.nextPanel = np;
    this.nextTexts = { blind, target, reward, bossName, bossDesc, line, bossHead };
    this.table.addChild(np);
  }

  private updateNextPanel(inShop: boolean) {
    const run = this.run!;
    this.nextPanel.visible = inShop;
    this.scorePanel.visible = !inShop;
    this.handPanel.visible = !inShop;
    if (!inShop) return;
    const kind = BLIND_KINDS[Math.min(run.blindIndex, 2)];
    const boss = run.anteBoss ? BOSS_BY_ID[run.anteBoss] : undefined;
    const n = this.nextTexts;
    n.blind.text = kind === 'boss' && boss ? boss.name : BLIND_NAMES[kind];
    n.blind.scale.set(1);
    if (n.blind.width > 300) n.blind.scale.set(300 / n.blind.width);
    n.target.text = fmt(currentTarget(run, kind));
    const rw = blindReward(run.ante, kind, run.rules.smallBlindReward);
    n.reward.text = rw > 0 ? 'Belohnung ' + '$'.repeat(rw) : 'Keine Belohnung';
    // Ist der nächste Blind selbst der Boss, steht seine Regel direkt darunter, sonst in einem eigenen Abschnitt
    const nextIsBoss = kind === 'boss' && !!boss;
    n.line.visible = n.bossHead.visible = n.bossName.visible = !nextIsBoss;
    n.bossName.text = boss && !nextIsBoss ? boss.name : '';
    n.bossDesc.text = boss ? boss.description : '';
    n.bossDesc.y = nextIsBoss ? 182 : 228;
  }

  /** Hinweis für neue Spieler: sichtbar in der ersten Runde, solange noch keine Karte gewählt ist */
  private updateHint() {
    const r = this.run?.round;
    this.hintText.visible = !!r && !this.tut && this.run!.phase === 'round' && !this.busy && this.selected().length === 0 && !hintSeen('play');
  }

  // ────────────────────────────────────────────────────────────── info refresh

  private refreshInfo() {
    const run = this.run;
    if (!run) return;
    const blind = BLIND_KINDS[Math.min(run.blindIndex, 2)];
    const r = run.round;
    const boss = blind === 'boss' ? (r ? activeBoss(run) : run.anteBoss ? BOSS_BY_ID[run.anteBoss] : undefined) : undefined;
    this.blindBg.clear()
      .roundRect(0, 4, 330, 160, 8).fill(STYLE.shadowColor)
      .roundRect(0, 0, 330, 160, 8).fill(boss ? boss.color : BLIND_COLORS[blind]).stroke({ width: 3, color: C.panelLine })
      .roundRect(10, 56, 310, 96, 6).fill(shade(boss ? boss.color : BLIND_COLORS[blind], 0.4));
    this.blindName.text = boss ? boss.name : BLIND_NAMES[blind];
    this.blindName.scale.set(1);
    if (this.blindName.width > 310) this.blindName.scale.set(310 / this.blindName.width);
    this.targetText.text = fmt(r ? r.target : currentTarget(run, blind));
    this.rewardText.visible = !boss;
    this.bossDesc.visible = !!boss;
    // Bei Bossen rückt das Ziel nach oben, damit die Sonderregel (bis zu zwei Zeilen) ins Fach passt
    this.zielLabel.visible = !boss;
    this.targetText.y = boss ? 86 : 105;
    if (boss) this.bossDesc.text = boss.description + (r?.debuffSuit ? ` (${SUIT_NAMES[r.debuffSuit]})` : '');
    const reward = blindReward(run.ante, blind, run.rules.smallBlindReward);
    this.rewardText.text = reward > 0 ? 'Belohnung ' + '$'.repeat(reward) : 'Keine Belohnung';
    this.setScore(r?.score ?? 0);
    this.handsText.text = String(r?.handsLeft ?? run.hands);
    this.discardsText.text = String(r?.discardsLeft ?? run.discards);
    this.moneyText.text = '$' + run.money;
    this.anteText.text = `${run.ante}/${FINAL_ANTE}`;
    this.roundText.text = String((run.ante - 1) * 3 + run.blindIndex + 1);
    this.seedText.text = 'Seed ' + run.seed;
    this.jokerCount.text = `Joker ${run.jokers.length}/${jokerCapacity(run)}`;
    this.consLabel.text = `Consumables ${run.consumables.length}/${consumableCapacity(run)}`;
    this.tagsText.text = run.pendingTags.length ? 'Tags: ' + run.pendingTags.map((id) => TAG_BY_ID[id]?.name ?? id).join(', ') : '';
    this.deckCount.text = r ? `${r.drawPile.length}/${run.deck.length}` : `${run.deck.length}/${run.deck.length}`;
    const inShop = run.phase === 'shop' || run.phase === 'pack';
    this.blindPanel.visible = !inShop;
    this.shopSign.visible = inShop;
    this.updateNextPanel(inShop);
    this.handControls.visible = run.phase === 'round' || run.phase === 'roundWon';
    this.deckPile.visible = run.phase !== 'shop' && run.phase !== 'pack';
    for (const v of this.cardViews.values()) v.setDebuffed(isCardDebuffed(run, v.card));
    this.updateButtons();
    if (!this.busy) this.updatePreview();
    this.updateHint();
    this.updateMood(blind, boss?.color);
    this.updateGuide();
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
    if (this.tut && !this.tut.allowCard(cardKey(v.card), v.selected)) {
      juice(v, 0.5);
      sfx.deny();
      haptics.deny();
      return;
    }
    this.closeTooltip();
    if (!v.selected && this.selected().length >= MAX_SELECT) {
      juice(v, 0.5);
      sfx.deny();
      haptics.deny();
      return;
    }
    v.selected = !v.selected;
    sfx.select(v.selected);
    haptics.select(v.selected);
    tween(v, { y: v.homeY - (v.selected ? 40 : 0) }, 160, easeOutBack);
    this.updatePreview();
    this.updateButtons();
    this.updateHint();
    this.notifyGuide('selection', this.selected().map((x) => cardKey(x.card)));
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
    this.persist();
  }

  private layoutHand(ms = 260) {
    const hand = this.run?.round?.hand ?? [];
    const n = hand.length;
    const spacing = Math.min(108, 780 / Math.max(n - 1, 1));
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
        this.persist();
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
    const desc = richText(jokerDescription(def, v.joker), w - 30, { size: 19, theme: 'light' });
    const tags = effectTags(def);
    const tagRow = new Container();
    const trig = wrapText(triggerLabel(def), w - 30, 15, 0x5a4f78);
    // Wirkungs Marken mit Namen, mittig in einer Reihe
    const tagW = tags.map((t) => Math.max(54, t.name.length * 9 + 18));
    const rowW = tagW.reduce((x, y) => x + y, 0) + (tags.length - 1) * 6;
    let tx = -rowW / 2;
    tags.forEach((t, i) => {
      const pill = new Graphics().roundRect(tx, 0, tagW[i], 24, 12).fill(t.color).stroke({ width: 2, color: C.cardEdge });
      const pt = label(t.name, 13, 0xffffff);
      pt.position.set(tx + tagW[i] / 2, 12);
      tagRow.addChild(pill, pt);
      tx += tagW[i] + 6;
    });
    const h = 114 + trig.height + 10 + desc.height + 82;
    const bg = new Graphics()
      .roundRect(-w / 2, 4, w, h, 14).fill({ color: 0, alpha: 0.4 })
      .roundRect(-w / 2, 0, w, h, 14).fill(C.text).stroke({ width: 3, color: C.cardEdge })
      // farbiger Kopf in der Seltenheitsfarbe
      .roundRect(-w / 2 + 3, 3, w - 6, 72, 11).fill({ color: RARITY_COLORS[def.rarity], alpha: 0.28 });
    bg.eventMode = 'static';
    const name = label(def.name, 24, C.cardEdge);
    name.position.set(0, 24);
    const rar = new Graphics().roundRect(-60, 44, 120, 24, 12).fill(RARITY_COLORS[def.rarity]).stroke({ width: 2, color: C.cardEdge });
    const rarT = label(RARITY_NAMES[def.rarity], 14, 0xffffff);
    rarT.position.set(0, 56);
    tagRow.position.set(0, 82);
    trig.position.set(0, 114);
    desc.position.set(0, 114 + trig.height + 10);
    const sell = new Button(`Verkaufen $${jokerSellValue(v.joker)}`, 220, 56, C.green, () => this.sellJoker(v.joker.uid), 20);
    sell.position.set(0, h - 42);
    tip.addChild(bg, name, rar, rarT, tagRow, trig, desc, sell);
    tip.position.set(Math.max(JOKER_TRAY_X + w / 2, Math.min(VIEW_W - w / 2 - 10, v.x)), JOKER_Y + 82);
    tip.scale.set(0.8);
    tween(tip, { 'scale.x': 1, 'scale.y': 1 }, 160, easeOutBack);
    this.fxLayer.addChild(tip);
    this.tooltip = tip;
  }

  private sellJoker(uid: number) {
    const run = this.run!;
    if (this.guardGuide()) return;
    if (this.busy || !sellJokerAction(run, uid)) return;
    sfx.sell();
    haptics.sell();
    this.closeTooltip();
    this.syncJokers();
    juice(this.moneyText);
    this.persist();
    if (run.phase === 'shop') this.renderShop();
  }

  // ────────────────────────────────────────────────────────────── consumables

  private consumableSlots(n: number) {
    return trayLayout(n, CONS_TRAY_X + CONS_TRAY_W / 2, CONS_TRAY_W, JOKER_Y);
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
    const slots = this.consumableSlots(list.length);
    list.forEach((c, i) => {
      let v = this.consumableViews.get(c.uid);
      if (!v) {
        v = new ConsumableView(c.defId);
        v.position.set(slots[i].x, slots[i].y);
        v.scale.set(slots[i].scale);
        v.on('pointertap', () => { if (!this.busy) this.showConsumableTooltip(c.uid); });
        this.consumableViews.set(c.uid, v);
        this.jokerLayer.addChild(v);
      }
      v.zIndex = i;
      v.setCompact(slots[i].scale);
      tween(v, { x: slots[i].x, y: slots[i].y }, 220, easeOutBack);
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
    const desc = richText(def.description, w - 30, { size: 19, theme: 'light' });
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
    const h = 84 + desc.height + (hintText ? hintText.height + 16 : 8) + 144;
    const bg = new Graphics()
      .roundRect(-w / 2, 4, w, h, 14).fill({ color: 0, alpha: 0.4 })
      .roundRect(-w / 2, 0, w, h, 14).fill(C.text).stroke({ width: 3, color: C.cardEdge });
    bg.eventMode = 'static';
    const name = label(def.name, 24, C.cardEdge);
    name.position.set(0, 24);
    const badge = new Graphics().roundRect(-60, 44, 120, 24, 12).fill(CONSUMABLE_COLORS[def.type]);
    const badgeT = label(CONSUMABLE_TYPE_NAMES[def.type], 14, 0xffffff);
    badgeT.position.set(0, 56);
    const use = new Button('Benutzen', 230, 56, C.chips, () => this.useConsumableUI(uid), 20);
    use.position.set(0, h - 104);
    use.enabled = usable;
    const sell = new Button(`Verkaufen $${consumableSellValue(inst)}`, 230, 56, C.green, () => this.sellConsumableUI(uid), 20);
    sell.position.set(0, h - 40);
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
    haptics.sell();
    this.closeTooltip();
    this.syncConsumables();
    juice(this.moneyText);
    this.persist();
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
    this.persist();
    if (run.phase === 'gameOver') this.showGameOver();
    else if (run.phase === 'shop') this.renderShop();
  }

  /** Klang und Effekt je nach Typ des benutzten Consumables, Omen erschüttern leicht den Bildschirm. */
  private playConsumableFx(type?: ConsumableType) {
    haptics.consumable(type === 'sternbild' || type === 'omen' ? type : 'elixir');
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
    if (this.tut && !this.tut.allowPlay(sel.map((v) => cardKey(v.card)))) {
      sfx.deny();
      haptics.deny();
      return;
    }
    this.busy = true;
    this.closeTooltip();
    this.updateButtons();
    if (!this.tut) markHintSeen('play');
    this.updateHint();
    this.notifyGuide('played');

    const prevBest = getProfile().stats.bestHand;
    const result = playHand(run, sel.map((v) => v.card.id));
    const r = run.round;
    this.handsText.text = String(r.handsLeft);
    juice(this.handsText);

    // Move played cards to the play area
    sfx.whoosh();
    haptics.tap();
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
    haptics.total(tier.boom);
    this.fx.shake(tier.shake);
    this.fx.flash(tier.flash);
    await tween(this.totalText, { 'scale.x': 1, 'scale.y': 1 }, 260, easeOutBack);
    const before = r.score - result.total;
    let goalHit = before >= r.target;
    await this.countUp((v) => {
      this.setScore(v);
      if (!goalHit && v >= r.target) {
        goalHit = true;
        sfx.goal();
        haptics.goal();
        this.fx.flash(0.14, C.money);
        juice(this.scoreText);
      }
    }, before, r.score, 500);
    juice(this.scoreText);
    if (!this.tut && prevBest > 0 && result.total > prevBest) this.toast('Neuer Bestwert!', C.money);
    if (this.moneyText.text !== '$' + run.money) {
      this.moneyText.text = '$' + run.money;
      juice(this.moneyText);
    }
    await wait(250);
    tween(this.totalText, { alpha: 0 }, 250);

    await this.flyAway(sel);
    this.setHandDisplay('', null, 0, 0);
    this.persist();

    const drawn = afterHand(run);
    this.persist();
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
    this.persist();
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
      if (ev.message) popup(this.fxLayer, p.x, y, ev.message, ev.phase === 'debuff' ? 0xf2711c : C.accent, 26);
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
    if (ev.phase === 'retrigger') { sfx.retrigger(step); haptics.step(); }
    else if (ev.xMult) {
      const shake = xMultShake(ev.xMult);
      sfx.xmult(step);
      haptics.impact(shake);
      this.fx.shake(shake);
    } else {
      if (ev.chips) sfx.chips(step);
      if (ev.mult) sfx.mult(step);
      if (ev.chips || ev.mult) haptics.step();
      if (!ev.chips && !ev.mult && !ev.money && ev.message) sfx.message(step);
    }
    if (ev.money) { sfx.money(); haptics.money(); }
  }

  private async countUp(set: (v: number) => void, from: number, to: number, ms: number) {
    const proxy = { v: from };
    const ticker = setInterval(() => set(proxy.v), 16);
    await tween(proxy, { v: to }, ms);
    clearInterval(ticker);
    set(to);
  }

  /** Round Score setzen. Lange Zahlen verkleinern die Schrift, damit sie nicht über die Beschriftung laufen. */
  private setScore(v: number) {
    const t = this.scoreText;
    t.style.fontSize = 40;
    t.text = fmt(v);
    if (t.width > SCORE_MAX_W) t.style.fontSize = Math.max(18, Math.floor(40 * SCORE_MAX_W / t.width));
  }

  private async discard() {
    const run = this.run;
    if (this.busy || !run?.round) return;
    const sel = this.selected();
    if (sel.length === 0 || run.round.discardsLeft <= 0) return;
    if (this.tut && !this.tut.allowDiscard(sel.map((v) => cardKey(v.card)))) {
      sfx.deny();
      haptics.deny();
      return;
    }
    this.busy = true;
    this.closeTooltip();
    this.notifyGuide('discarded');
    discardHand(run, sel.map((v) => v.card.id));
    sfx.discard();
    haptics.tap();
    this.discardsText.text = String(run.round.discardsLeft);
    juice(this.discardsText);
    this.updateButtons();
    this.layoutHand();
    await this.flyAway(sel);
    const drawn = afterHand(run);
    this.persist();
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
    this.persist();
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

  /**
   * Wechselt zwischen großen Screens (Home und Spiel) mit der Kuppelblende. `swap` baut den neuen Screen
   * bei geschlossener Kuppel. Läuft schon eine Blende, wird sofort getauscht.
   */
  private transit(swap: () => void) {
    if (this.trans.active) swap();
    else void this.trans.run(swap);
  }

  private homeVisible(): boolean {
    return this.homeLayer.children.length > 0;
  }

  private modal(w: number, h: number, color = C.panel): { o: Container; box: Container } {
    this.clearOverlay();
    this.closeTooltip();
    const o = overlay(VIEW_W, VIEW_H);
    const box = new Container();
    box.addChild(panel(w, h, color, 20));
    box.pivot.set(w / 2, h / 2);
    box.position.set(VIEW_W / 2, VIEW_H / 2);
    // Hohe Fenster (lange Rückschau) werden so verkleinert, dass sie auf den Bildschirm passen
    const fit = Math.min(1, (VIEW_H - 30) / h);
    box.scale.set(0.85 * fit);
    tween(box, { 'scale.x': fit, 'scale.y': fit }, 260, easeOutBack);
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

  private beginNewRun(deckId: string, opts: { stakeId?: string; level?: number; seed?: string; daily?: { date: string; twistId: string } }) {
    // Vom Home Bildschirm aus mit Blende, "Nochmal" nach einem Run bleibt sofort
    if (this.homeVisible()) this.transit(() => this.startRun(deckId, opts));
    else this.startRun(deckId, opts);
  }

  private startRun(deckId: string, opts: { stakeId?: string; level?: number; seed?: string; daily?: { date: string; twistId: string } }) {
    this.hideHome();
    this.clearCardViews();
    this.clearScreen();
    this.runUnlocked = [];
    this.runStartKeys = this.knownKeys = loadDiscovered();
    this.run = createRun({ seed: opts.seed ?? (this.setupSeed || randomSeed()), deckId, ...opts });
    this.setupSeed = '';
    this.syncJokers();
    this.syncConsumables();
    this.persist();
    this.refreshInfo();
    this.showPhase();
  }

  private resume(run: RunState) {
    if (this.homeVisible()) this.transit(() => this.resumeNow(run));
    else this.resumeNow(run);
  }

  private resumeNow(run: RunState) {
    this.hideHome();
    this.clearCardViews();
    this.clearScreen();
    this.runUnlocked = [];
    this.runStartKeys = this.knownKeys = loadDiscovered();
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

  // ────────────────────────────────────────────────────────────── Fortschritt und Erfolge

  /** Speichert den Run und übernimmt seinen Stand ins Profil (Statistik, Erfolge). In der Einführung wird nichts gespeichert. */
  private persist() {
    if (this.tut) return;
    saveRun(this.run);
    this.trackProgress();
    this.announceDiscoveries();
  }

  /** Meldet Einträge, die seit dem letzten Speichern neu in den Sternenatlas gekommen sind */
  private announceDiscoveries() {
    const now = loadDiscovered();
    const added = newKeys(this.knownKeys, now);
    this.knownKeys = now;
    if (!added.length) return;
    const names = added.map((k) => entryName(k)).filter((n): n is string => !!n);
    if (!names.length) return;
    const text = names.length <= 2 ? `Neu im Atlas: ${names.join(', ')}` : `Neu im Atlas: ${names[0]} und ${names.length - 1} weitere`;
    this.toast(text, C.money);
  }

  private trackProgress() {
    const run = this.run;
    if (!run || this.tut) return;
    const p = getProfile();
    const changed = observeRun(p, run);
    const fresh = evaluateAchievements(p, run, { collection: collectionProgress().fraction });
    if (changed || fresh.length) saveProfile();
    for (const a of fresh) {
      this.runUnlocked.push(a.id);
      this.queueAchievement(a);
    }
  }

  private queueAchievement(a: AchievementDef) {
    this.achQueue.push(a);
    if (!this.achShowing) void this.drainAchievements();
  }

  private async drainAchievements() {
    this.achShowing = true;
    while (this.achQueue.length) await this.showAchievementBanner(this.achQueue.shift()!);
    this.achShowing = false;
  }

  /** Banner oben am Bildschirm, bleibt unabhängig vom Animationstempo gut lesbar */
  private async showAchievementBanner(a: AchievementDef) {
    sfx.achievement();
    haptics.achievement();
    const w = 640;
    const h = 104;
    const box = new Container();
    box.addChild(panel(w, h, C.panelDark, 16, C.money));
    const badge = new Graphics()
      .circle(0, 0, 34).fill(0x2a1f4a).stroke({ width: 4, color: C.money })
      .star(0, 0, 5, 22, 9).fill(C.money);
    badge.position.set(58, h / 2);
    const head = label('Erfolg freigeschaltet', 17, C.money);
    head.anchor.set(0, 0.5);
    head.position.set(112, 26);
    const name = label(a.name, 30, C.text);
    name.anchor.set(0, 0.5);
    name.position.set(112, 58);
    if (name.width > w - 250) name.scale.set((w - 250) / name.width);
    const desc = label(a.secret ? 'Ein geheimer Erfolg' : a.description, 15, C.textDim, { fontWeight: '600' });
    desc.anchor.set(0, 0.5);
    desc.position.set(112, 86);
    if (desc.width > w - 140) desc.scale.set((w - 140) / desc.width);
    box.addChild(badge, head, name, desc);
    for (let i = 0; i < 3; i++) {
      box.addChild(new Graphics().star(w - 40 - i * 30, 28, 5, 11, 5).fill(i < a.stars ? C.money : 0x2a3548).stroke({ width: 1.5, color: 0x151c28 }));
    }
    box.pivot.set(w / 2, 0);
    box.position.set(VIEW_W / 2, -h - 12);
    this.achLayer.addChild(box);
    await tween(box, { y: 14 }, 320, easeOutBack, true);
    await new Promise((r) => setTimeout(r, 2800));
    await tween(box, { y: -h - 12 }, 260, easeInOutCubic, true);
    box.destroy({ children: true });
  }

  private showAchievements() {
    const { box } = this.modal(ACH_W, ACH_H, C.panelDark);
    buildAchievements(box, () => this.showMainMenu());
  }

  // ────────────────────────────────────────────────────────────── Einführungsrunde

  /** Sperrt Eingaben, die in der Einführung nicht vorgesehen sind. Gibt true zurück, wenn gesperrt wurde. */
  private guardGuide(): boolean {
    if (!this.tut) return false;
    sfx.deny();
    haptics.deny();
    this.toast('Das probierst du im echten Run aus.', 0x4a3f6b);
    return true;
  }

  private notifyGuide(event: Parameters<TutorialFlow['notify']>[0], keys: readonly string[] = []) {
    if (this.tut?.notify(event, keys)) this.updateGuide();
  }

  private guideTap() {
    if (!this.tut) return;
    sfx.select(true);
    haptics.tap();
    this.tut.tap();
    if (this.tut.finished) this.showGuideDone();
    else this.updateGuide();
  }

  private findDeep(root: Container | null, pred: (c: Container) => boolean): Container | null {
    if (!root || root.destroyed) return null;
    for (const c of root.children as Container[]) {
      if (pred(c)) return c;
      const hit = this.findDeep(c, pred);
      if (hit) return hit;
    }
    return null;
  }

  private findButton(root: Container | null, caption: string): Container | null {
    return this.findDeep(root, (c) => c instanceof Button && c.caption.startsWith(caption));
  }

  /** Objekte, auf die der Zeiger im Schritt zeigt */
  private guideTargets(target: GuideTarget | undefined, select?: readonly string[]): Container[] {
    const one = (c?: Container | null) => (c ? [c] : []);
    switch (target) {
      case 'blindPlay': return one(this.refs.blindPlay);
      case 'blindSkip': return [...one(this.refs.blindSkip), ...one(this.refs.blindBoss)];
      case 'blindBoss': return one(this.refs.blindBoss);
      case 'blindTarget': return one(this.refs.blindColumn);
      case 'pickCards': return [...this.cardViews.values()].filter((v) => !select || select.includes(cardKey(v.card)));
      case 'handPanel': return [this.handPanel];
      case 'scorePanel': return [this.scorePanel];
      case 'playBtn': return [this.playBtn];
      case 'discardBtn': return [this.discardBtn];
      case 'counters': return [this.handsText.parent, this.discardsText.parent].filter((c): c is Container => !!c);
      case 'cashoutBtn': return one(this.refs.cashoutBtn);
      case 'shopJoker':
      case 'shopBuy': {
        const buy = this.findButton(this.shopView, 'Kaufen');
        return one(buy ?? this.findDeep(this.shopView, (c) => c instanceof JokerView));
      }
      case 'nextRound': return one(this.findButton(this.shopView, 'Next'));
      case 'jokerTray': return one(this.jokerTray);
      case 'targetPanel': return [this.blindPanel];
      case 'moneyPanel': return one(this.moneyText.parent);
      default: return [];
    }
  }

  /** Zeigt Hinweisfeld und Zeiger passend zum aktuellen Schritt, versteckt sie während Animationen */
  private updateGuide() {
    const flow = this.tut;
    if (!flow || flow.finished || this.busy) {
      this.guide.hide();
      return;
    }
    const step = flow.step;
    // In Auswahlschritten bleiben nur die vorgesehenen Karten hell
    for (const v of this.cardViews.values()) v.alpha = step.select && !step.select.includes(cardKey(v.card)) ? 0.4 : 1;
    const prog = flow.progress;
    this.guide.show(step, {
      targets: () => this.guideTargets(step.target, step.select),
      progress: `Schritt ${prog.current} von ${prog.total}`,
      onNext: step.wait === 'tap' ? () => this.guideTap() : null,
      union: step.target === 'pickCards' && !step.select,
    });
  }

  /** Startet die geführte Einführungsrunde mit einem festen Szenario. Es wird nichts gespeichert. */
  private startGuide() {
    if (this.homeVisible()) this.transit(() => this.startGuideNow());
    else this.startGuideNow();
  }

  private startGuideNow() {
    this.hideHome();
    this.clearOverlay();
    this.clearCardViews();
    this.clearScreen();
    this.busy = false;
    this.tut = new TutorialFlow();
    this.run = createTutorialRun();
    this.syncJokers();
    this.syncConsumables();
    this.refreshInfo();
    this.showPhase();
  }

  /** Beendet die Einführung. complete = geschafft, `then` = wohin es danach geht. */
  private exitGuide(complete: boolean, then: 'menu' | 'setup' = 'menu') {
    if (!this.tut) return;
    this.tut = null;
    this.guide.hide();
    this.busy = false;
    const p = getProfile();
    p.tutorialOffered = true;
    if (complete) p.tutorialDone = true;
    const fresh = evaluateAchievements(p, null, { collection: collectionProgress().fraction });
    saveProfile();
    for (const a of fresh) this.queueAchievement(a);
    // Zurück zum Home Bildschirm mit Blende, der Spieltisch wird erst bei geschlossener Kuppel abgebaut
    this.transit(() => {
      this.clearOverlay();
      this.clearScreen();
      this.clearCardViews();
      this.run = null;
      this.syncJokers();
      this.syncConsumables();
      this.openHome();
      if (then === 'setup') this.showRunSetup();
    });
  }

  /** Angebot der Einführungsrunde beim allerersten Start */
  private showGuideOffer() {
    const { box } = this.modal(720, 520, C.panelDark);
    const head = label('Willkommen in der Sternwarte', 38, C.money);
    head.position.set(360, 70);
    const text = wrapText('Alatro ist ein Roguelike mit Pokerhänden. Spiel Karten aus, sammle Punkte, kaufe Jokers und besiege Blinds.\n\nIn einer kurzen geführten Runde zeigt dir Astra alles Wichtige, Schritt für Schritt. Du spielst dabei echte Hände. Das dauert nur ein paar Minuten.', 600, 22, C.text);
    text.position.set(360, 130);
    const go = new Button('Einführung starten', 400, 76, C.chips, () => this.startGuide(), 30);
    go.position.set(360, 370);
    const later = new Button('Später, ich kenne mich aus', 400, 56, 0x3b5068, () => {
      const p = getProfile();
      p.tutorialOffered = true;
      saveProfile();
      this.showMainMenu();
    }, 22);
    later.position.set(360, 452);
    box.addChild(head, text, go, later);
  }

  /** Abschluss der Einführung */
  private showGuideDone() {
    this.guide.hide();
    this.busy = false;
    sfx.victory();
    haptics.victory();
    this.fx.flash(0.25, 0xffd23f);
    const { box } = this.modal(700, 560, C.panelDark);
    const head = label('Einführung geschafft!', 44, C.money, { stroke: { color: C.mult, width: 6 } });
    head.position.set(350, 70);
    const text = wrapText('Du kennst jetzt die Grundlagen: Hände spielen, Discards, Jokers kaufen und Blinds. Der Rest ergibt sich beim Spielen.\n\nFür deinen ersten richtigen Run empfehle ich die Stufe Morgenrot. Sie ist etwas leichter als das Grundspiel. Unter Erfolge sammelst du ab jetzt Sterne.', 600, 22, C.text);
    text.position.set(350, 130);
    const go = new Button('Echten Run starten', 400, 76, C.chips, () => this.exitGuide(true, 'setup'), 30);
    go.position.set(350, 400);
    const menu = new Button('Hauptmenü', 260, 56, 0x3b5068, () => this.exitGuide(true), 24);
    menu.position.set(350, 490);
    box.addChild(head, text, go, menu);
  }

  // ────────────────────────────────────────────────────────────── Run Setup, Tageslauf

  /** Neuer Run: Deck wählen, dazu feste Stufe (Stakes) oder skalierende Schwierigkeit */
  private showRunSetup() {
    const pref = loadSetupPref();
    const profile = getProfile();
    const recommended = clampScale(profile.bestScale > 0 ? profile.bestScale + 1 : SCALE.start);
    let mode: 'stakes' | 'scale' = pref.mode === 'scale' ? 'scale' : 'stakes';
    let deckIdx = Math.max(0, DECKS.findIndex((d) => d.id === pref.deckId));
    const prefStake = STAKES.findIndex((s) => s.id === (pref.stakeId ?? BEGINNER_STAKE_ID));
    let stakeIdx = prefStake >= 0 ? prefStake : 0;
    let level = clampScale(pref.level ?? recommended);
    const W = 800;
    const { box } = this.modal(W, 880, C.panelDark);
    const head = label('Neuer Run', 44, C.text);
    head.position.set(W / 2, 48);
    const backBtn = new Button('Zurück', 150, 56, 0x4a3f6b, () => this.showMainMenu(), 24);
    backBtn.position.set(100, 48);
    box.addChild(head, backBtn);
    const content = new Container();
    box.addChild(content);
    const body = (text: string, y: number, size = 18, color = C.textDim, width = 560) => {
      const t = new Text({ text, style: { fontFamily: FONT_BODY, fontSize: size, fontWeight: '700', fill: color, wordWrap: true, wordWrapWidth: width, align: 'center' } });
      t.anchor.set(0.5, 0);
      t.position.set(W / 2, y);
      content.addChild(t);
      return t;
    };
    const arrow = (txt: string, x: number, y: number, fn: () => void) => {
      const b = new Button(txt, 70, 70, 0x3b5068, fn, 34);
      b.position.set(x, y);
      content.addChild(b);
    };

    /** Startwerte und Ziele des Small Blinds für die gewählte Schwierigkeit, aus einem Probe Run berechnet */
    const preview = (deckId: string, opts: { stakeId?: string; level?: number }, y: number) => {
      const pr = createRun({ seed: 'VORSCHAU', deckId, ...opts });
      const tgt = (ante: number) => fmt(blindTarget(ante, 'small', { scaling: pr.rules.scaling, deckFactor: pr.rules.blindTargetFactor }));
      body(`Start: ${pr.hands} Hands, ${pr.discards} Discards, ${pr.handSize} Karten, $${pr.money}\nSmall Blind Ziel: Ante 1 ${tgt(1)}, Ante 4 ${tgt(4)}, Ante 8 ${tgt(8)}`, y, 17, C.chips, 640);
    };

    const render = () => {
      for (const c of [...content.children]) c.destroy({ children: true });
      // Modus
      const tab = (text: string, x: number, active: boolean, fn: () => void) => {
        const b = new Button(text, 330, 52, active ? C.accent : 0x3b5068, fn, 22);
        b.position.set(x, 112);
        content.addChild(b);
      };
      tab('Feste Stufen', W / 2 - 170, mode === 'stakes', () => { mode = 'stakes'; render(); });
      tab('Skalierend', W / 2 + 170, mode === 'scale', () => { mode = 'scale'; render(); });

      // Deck
      const deck = DECKS[deckIdx];
      const dl = label('Deck', 20, C.textDim);
      dl.position.set(W / 2, 170);
      const back = cardBack(deck.color);
      back.position.set(W / 2, 252);
      back.scale.set(0.7);
      const dn = label(deck.name, 30, C.text);
      dn.position.set(W / 2, 330);
      content.addChild(dl, back, dn);
      body(deck.description, 354, 18, C.textDim, 480);
      arrow('‹', 110, 250, () => { deckIdx = (deckIdx + DECKS.length - 1) % DECKS.length; render(); });
      arrow('›', 690, 250, () => { deckIdx = (deckIdx + 1) % DECKS.length; render(); });

      // Schwierigkeit
      let stakeId: string | undefined;
      let levelOut: number | undefined;
      if (mode === 'stakes') {
        const stake = STAKES[stakeIdx];
        stakeId = stake.id;
        const sl = label('Schwierigkeit', 20, C.textDim);
        sl.position.set(W / 2, 438);
        const sn = label(stake.name, 32, stake.color);
        sn.position.set(W / 2, 478);
        content.addChild(sl, sn);
        const ladderIdx = STAKES.filter((s) => s.cumulative !== false).findIndex((s) => s.id === stake.id);
        body(ladderIdx > 0 ? `${stake.description}, plus alle vorherigen` : stake.description, 506, 18, C.textDim, 480);
        body(stake.cumulative === false ? 'Einsteigerstufe, außerhalb der Leiter' : `Stufe ${ladderIdx + 1} der Leiter von ${STAKES.filter((s) => s.cumulative !== false).length}`, 560, 16, C.textDim, 480);
        preview(deck.id, { stakeId }, 612);
        arrow('‹', 110, 470, () => { stakeIdx = (stakeIdx + STAKES.length - 1) % STAKES.length; render(); });
        arrow('›', 690, 470, () => { stakeIdx = (stakeIdx + 1) % STAKES.length; render(); });
      } else {
        levelOut = level;
        const band = scaleBand(level);
        const sl = label('Stufe wählen', 20, C.textDim);
        sl.position.set(W / 2, 438);
        const sn = label(scaleName(level), 32, band.color);
        sn.position.set(W / 2, 478);
        content.addChild(sl, sn);
        // Leiste mit allen Stufen zum Antippen
        const segW = 26;
        const gap = 3;
        const total = SCALE.max - SCALE.min + 1;
        const x0 = (W - (total * segW + (total - 1) * gap)) / 2;
        for (let l = SCALE.min; l <= SCALE.max; l++) {
          const seg = new Container();
          const color = scaleBand(l).color;
          const g = new Graphics()
            .roundRect(0, 0, segW, 44, 6).fill(l <= level ? color : 0x1d2a3a)
            .stroke({ width: l === level ? 4 : 2, color: l === level ? C.text : C.panelLine });
          seg.addChild(g);
          seg.position.set(x0 + (l - SCALE.min) * (segW + gap), 506);
          seg.eventMode = 'static';
          seg.cursor = 'pointer';
          seg.hitArea = { contains: (x: number, y: number) => x >= -2 && x <= segW + 2 && y >= -6 && y <= 56 } as never;
          seg.on('pointertap', () => { sfx.select(true); level = l; render(); });
          content.addChild(seg);
        }
        const sum = body(scaleSummary(level).join('   ·   '), 562, 17, C.text, 640);
        const py = sum.y + sum.height + 14;
        preview(deck.id, { level }, py);
        const note = profile.bestScale > 0
          ? `Stufe ${SCALE.normal} ist das Grundspiel. Dein Bestwert: Stufe ${profile.bestScale} gewonnen, empfohlen: Stufe ${recommended}`
          : `Stufe ${SCALE.normal} ist das Grundspiel. Für den Anfang empfohlen: Stufe 2 bis ${SCALE.normal}`;
        body(note, py + 56, 15, C.textDim, 640);
        arrow('‹', 52, 528, () => { level = clampScale(level - 1); render(); });
        arrow('›', 748, 528, () => { level = clampScale(level + 1); render(); });
      }

      if (mode === 'stakes') {
        const seal = deckSeal(profile, deck.id);
        const goalId = nextSealGoal(profile, deck.id);
        const sealName = seal ? STAKES.find((s) => s.id === seal.stakeId)?.name ?? '' : '';
        const wonHere = stakeId !== undefined && (profile.winsByDeckStake[`${deck.id}|${stakeId}`] ?? 0) > 0;
        const goalName = goalId ? STAKES.find((s) => s.id === goalId)?.name : null;
        const parts = [
          seal ? `Siegel am Deck: ${sealName}` : 'Noch kein Siegel an diesem Deck',
          ...(wonHere ? ['Auf dieser Stufe gewonnen'] : []),
          ...(goalName ? [`Nächstes Ziel: ${goalName}`] : ['Alle Stufen der Leiter gemeistert']),
        ];
        body(parts.join('   ·   '), 690, 17, wonHere || seal ? C.money : C.textDim, 700);
      }
      const seedLbl = label('Seed', 20, C.textDim);
      seedLbl.position.set(W / 2, 748);
      const seedBtn = new Button(this.setupSeed || 'Zufällig', 300, 52, 0x3b5068, () => {
        saveSetupPref({ deckId: deck.id, stakeId: STAKES[stakeIdx].id, mode, level });
        this.showSeedEntry();
      }, 24);
      seedBtn.position.set(W / 2, 790);
      const start = new Button('Start', 300, 66, C.chips, () => {
        saveSetupPref({ deckId: deck.id, stakeId: STAKES[stakeIdx].id, mode, level });
        this.beginNewRun(deck.id, stakeId !== undefined ? { stakeId } : { level: levelOut });
      }, 30);
      start.position.set(W / 2, 850);
      content.addChild(seedLbl, seedBtn, start);
    };
    render();
  }

  /** Tageslauf: jeden Tag ein fester Seed mit Deck, Stufe und Tageswandlung */
  private showDaily() {
    const d = dailySetup(dateKey());
    const entry = getProfile().daily[d.date];
    const deck = DECKS.find((x) => x.id === d.deckId)!;
    const twist = TWIST_BY_ID[d.twistId];
    const W = 740;
    const { box } = this.modal(W, 810, C.panelDark);
    const head = label('Tageslauf', 44, C.text);
    head.position.set(W / 2, 52);
    const date = label(new Date(`${d.date}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }), 22, C.textDim);
    date.position.set(W / 2, 100);
    const back = cardBack(deck.color);
    back.position.set(W / 2, 210);
    back.scale.set(0.7);
    const dn = label(deck.name, 30, C.text);
    dn.position.set(W / 2, 290);
    const dd = wrapText(deck.description, 520, 17, C.textDim);
    dd.position.set(W / 2, 314);
    const band = scaleBand(d.level);
    const ln = label(scaleName(d.level), 28, band.color);
    ln.position.set(W / 2, 394);
    const ls = wrapText(scaleSummary(d.level).join(' · '), 600, 16, C.textDim);
    ls.position.set(W / 2, 422);
    const tw = label(`Wandlung: ${twist.name}`, 28, C.accent);
    tw.position.set(W / 2, 500);
    const td = wrapText(twist.description, 560, 18, C.text);
    td.position.set(W / 2, 530);
    const seed = label(`Seed ${d.seed}`, 18, C.textDim, { fontWeight: '600' });
    seed.position.set(W / 2, 586);
    const best = label(entry ? `Bisher heute: Ante ${entry.ante}${entry.won ? ', gewonnen' : ''}` : 'Heute noch nicht gespielt', 20, entry?.won ? C.green : C.textDim);
    best.position.set(W / 2, 630);
    const go = new Button(entry ? 'Nochmal spielen' : 'Starten', 360, 72, C.chips, () => {
      this.beginNewRun(d.deckId, { level: d.level, seed: d.seed, daily: { date: d.date, twistId: d.twistId } });
    }, 30);
    go.position.set(W / 2, 690);
    const bk = new Button('Zurück', 200, 50, 0x4a3f6b, () => this.showMainMenu(), 22);
    bk.position.set(W / 2, 764);
    box.addChild(head, date, back, dn, dd, ln, ls, tw, td, seed, best, go, bk);
  }

  /** Home Bildschirm (Vollbild). Nebenmenüs öffnen als Fenster darüber und führen per Zurück hierher. */
  private showMainMenu() {
    // Kommt man aus einem Nebenmenü zurück, ist der Home Bildschirm schon da. Aus dem Spiel geht es mit Blende.
    if (this.homeVisible()) this.openHome();
    else this.transit(() => this.openHome());
  }

  private openHome() {
    const saved = this.run ?? loadRun();
    const canResume = !!saved && saved.phase !== 'gameOver';
    this.hooks.setMood('menu');
    this.refreshSpeedBtn();
    this.clearOverlay();
    this.closeTooltip();
    // Ist der Home Bildschirm schon sichtbar (Rückkehr aus einem Nebenmenü), bleibt er stehen
    if (this.homeLayer.children.length > 0) return;
    this.setTableVisible(false);
    const profile = getProfile();
    const rank = rankOf(profile);
    this.homeLayer.addChild(buildHome({
      saved: canResume ? saved : null,
      version: APP_VERSION,
      rank: { name: rank.name, color: rank.color, unlocked: unlockedCount(profile), total: ACHIEVEMENTS.length },
      dailyDone: !!profile.daily[dateKey()],
      guidePending: !profile.tutorialDone && !profile.tutorialOffered,
      atlas: { ...collectionProgress(), fresh: unseenKeys().length },
      actions: {
        guide: () => this.startGuide(),
        daily: () => this.showDaily(),
        achievements: () => this.showAchievements(),
        resume: () => this.resume(saved!),
        newRun: () => this.startNewRun(),
        collection: () => this.showCollection(),
        tutorial: () => this.showTutorial(),
        options: () => this.showOptions(),
        patchNotes: () => this.showPatchNotes(),
      },
    }));
  }

  /** Spieltisch samt Karten, Jokers und Shop ausblenden, solange der Home Bildschirm offen ist */
  private setTableVisible(visible: boolean) {
    for (const l of [this.table, this.jokerLayer, this.playLayer, this.handLayer, this.screenLayer, this.fxLayer]) l.visible = visible;
  }

  private hideHome() {
    this.setTableVisible(true);
    for (const c of [...this.homeLayer.children]) c.destroy({ children: true });
  }

  private refreshSpeedBtn() {
    const st = SPEED_STEPS.find((x) => x.id === getSettings().speed) ?? SPEED_STEPS[0];
    this.speedBtn.setText(`Tempo ${st.name}`);
  }

  private showTutorial() {
    const { box } = this.modal(TUTORIAL_W, TUTORIAL_H, C.panelDark);
    buildTutorial(box, () => this.showMainMenu());
  }

  /** Patch Notes, beim ersten Anzeigen einer neuen Version wird sie als gesehen gemerkt */
  private showPatchNotes() {
    savePatchSeen(APP_VERSION);
    const { box } = this.modal(PATCH_W, PATCH_H, C.panelDark);
    buildPatchNotes(box, () => this.showMainMenu());
  }

  /** Optionen: werden sofort gespeichert und angewendet */
  private showOptions() {
    const W = 660;
    const { box } = this.modal(W, 1030, C.panelDark);
    const head = label('Optionen', 44, C.text);
    head.position.set(W / 2, 56);
    box.addChild(head);
    const dyn = new Container();
    box.addChild(dyn);
    const render = () => {
      for (const c of [...dyn.children]) c.destroy({ children: true });
      const st = getSettings();
      const gap = 64;
      const row = (i: number, name: string, desc: string) => {
        const y = 140 + i * gap;
        const n = label(name, 28, C.text);
        n.anchor.set(0, 0.5);
        n.position.set(50, y - 12);
        const d = label(desc, 16, C.textDim, { fontWeight: '600' });
        d.anchor.set(0, 0.5);
        d.position.set(50, y + 20);
        dyn.addChild(n, d);
        return y;
      };
      const onOff = (i: number, name: string, desc: string, on: boolean, toggle: () => void) => {
        const y = row(i, name, desc);
        const b = new Button(on ? 'An' : 'Aus', 130, 56, on ? C.green : 0x3b5068, () => { toggle(); render(); }, 24);
        b.position.set(W - 115, y);
        dyn.addChild(b);
      };
      onOff(0, 'CRT Effekt', 'Feine Scanlines und wandernder Hologramm Glanz', st.crt, () => updateSettings({ crt: !st.crt }));
      onOff(1, 'Screen Shake', 'Wackeln und Aufblitzen bei hohen Punkten', st.shake, () => {
        updateSettings({ shake: !st.shake });
        this.fx.shake(6);
      });
      const vy = row(2, 'Lautstärke', `${Math.round(st.volume * 100)} Prozent`);
      const minus = new Button('−', 60, 56, 0x3b5068, () => { updateSettings({ volume: clampVolume(st.volume - VOLUME_STEP) }); sfx.chips(2); render(); }, 30);
      minus.position.set(W - 175, vy);
      const plus = new Button('+', 60, 56, 0x3b5068, () => { updateSettings({ volume: clampVolume(st.volume + VOLUME_STEP) }); sfx.chips(2); render(); }, 30);
      plus.position.set(W - 95, vy);
      const musicIds = [MUSIC_MIX, ...TRACK_IDS, MUSIC_OFF];
      const mi = Math.max(0, musicIds.indexOf(st.music));
      const mt = getTrack(st.music);
      const musicName = st.music === MUSIC_MIX ? MUSIC_MIX_NAME : mt ? mt.name : 'Aus';
      const my = row(3, 'Musik', st.music === MUSIC_MIX ? MUSIC_MIX_INFO : mt ? mt.info : 'Ruhige Hintergrundmusik, aus');
      const music = new Button(musicName, 230, 56, st.music === MUSIC_OFF ? 0x3b5068 : C.chips, () => {
        updateSettings({ music: musicIds[(mi + 1) % musicIds.length] });
        render();
      }, 22);
      music.position.set(W - 170, my);
      const muy = row(4, 'Musiklautstärke', `${Math.round(st.musicVolume * 100)} Prozent`);
      const mMinus = new Button('−', 60, 56, 0x3b5068, () => { updateSettings({ musicVolume: clampVolume(st.musicVolume - VOLUME_STEP) }); render(); }, 30);
      mMinus.position.set(W - 175, muy);
      const mPlus = new Button('+', 60, 56, 0x3b5068, () => { updateSettings({ musicVolume: clampVolume(st.musicVolume + VOLUME_STEP) }); render(); }, 30);
      mPlus.position.set(W - 95, muy);
      const sy = row(5, 'Animationstempo', 'Zählen, Karten und Übergänge');
      const si = Math.max(0, SPEED_STEPS.findIndex((x) => x.id === st.speed));
      const speed = new Button(SPEED_STEPS[si].name, 190, 56, si ? C.chips : 0x3b5068, () => {
        updateSettings({ speed: SPEED_STEPS[(si + 1) % SPEED_STEPS.length].id });
        render();
      }, 22);
      speed.position.set(W - 150, sy);
      const qy = row(6, 'Grafik', st.quality === 'sparsam' ? '30 FPS, ohne CRT und Edition Glanz' : 'Volle Effekte');
      const quality = new Button(QUALITY_NAMES[st.quality], 190, 56, st.quality === 'sparsam' ? C.money : 0x3b5068, () => {
        updateSettings({ quality: st.quality === 'voll' ? 'sparsam' : 'voll' });
        render();
      }, 22);
      quality.position.set(W - 150, qy);
      onOff(7, 'FPS Anzeige', 'Bildrate oben rechts, zum Prüfen der Leistung', st.fps, () => updateSettings({ fps: !st.fps }));
      onOff(8, 'Vibration', haptics.supported ? 'Rückmeldung bei Berührung und Punkten' : 'Auf diesem Gerät nicht verfügbar (z. B. iPad)', st.haptics, () => {
        updateSettings({ haptics: !st.haptics });
        if (st.haptics) haptics.stop();
        else haptics.victory();
      });
      const cpy = row(9, 'Kartenfarben', CARD_PALETTES[st.cardPalette].description);
      const cardPal = new Button(CARD_PALETTES[st.cardPalette].name, 230, 56, st.cardPalette === 'kontrast' ? C.money : 0x3b5068, () => {
        const at = Math.max(0, CARD_PALETTE_IDS.indexOf(st.cardPalette));
        updateSettings({ cardPalette: CARD_PALETTE_IDS[(at + 1) % CARD_PALETTE_IDS.length] });
        render();
      }, 22);
      cardPal.position.set(W - 170, cpy);
      const bky = row(10, 'Spielstand', 'Sichern, auf ein anderes Gerät übertragen und zurückladen');
      const backup = new Button('Sichern', 230, 56, C.chips, () => this.showBackup(), 22);
      backup.position.set(W - 170, bky);
      const cly = row(11, 'Geräte koppeln', syncManager.isCoupled() ? 'Gekoppelt, der Stand wird abgeglichen' : 'Einen Spielstand auf mehreren Geräten nutzen');
      const cloud = new Button(syncManager.isCoupled() ? 'Gekoppelt' : 'Koppeln', 230, 56, syncManager.isCoupled() ? C.green : C.chips, () => this.showSync(), 22);
      cloud.position.set(W - 170, cly);
      const back = new Button('Zurück', 300, 70, C.chips, () => this.showMainMenu(), 28);
      back.position.set(W / 2, 940);
      dyn.addChild(minus, plus, music, mMinus, mPlus, speed, quality, cardPal, backup, cloud, back);
    };
    render();
  }

  /** Spielstand sichern und laden, Zurück führt in die Optionen */
  private showBackup() {
    const { box } = this.modal(BACKUP_W, BACKUP_H, C.panelDark);
    buildBackup(box, () => this.showOptions());
  }

  /** Geräte koppeln und Cloud Abgleich, Zurück führt in die Optionen */
  private showSync() {
    const { box } = this.modal(SYNC_W, SYNC_H, C.panelDark);
    buildSync(box, () => this.showOptions());
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
        dyn.addChild(new Graphics().roundRect(x - 32, 130, 64, 76, 10).fill(0x141d29).stroke({ width: 3, color: i === seed.length ? C.accent : C.panelLine }));
        if (seed[i]) {
          const ch = label(seed[i], 40, C.text);
          ch.position.set(x, 168);
          dyn.addChild(ch);
        }
      }
      // Kein O auf der Tastatur: es gilt ohnehin als 0 und sähe in der Systemschrift gleich aus (O40)
      const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
      [...chars].forEach((ch, i) => {
        const b = new Button(ch, 66, 66, 0x3b5068, () => { seed = normalizeSeed(seed + ch); render(); }, 30);
        b.position.set(W / 2 + ((i % 9) - 4) * 76, 270 + Math.floor(i / 9) * 76);
        b.enabled = seed.length < SEED_LENGTH;
        dyn.addChild(b);
      });
      const del = new Button('Löschen', 200, 62, C.mult, () => { seed = seed.slice(0, -1); render(); }, 24);
      del.position.set(W / 2 - 230, 620);
      del.enabled = seed.length > 0;
      const rnd = new Button('Zufällig', 200, 62, 0xf2711c, () => { seed = ''; render(); }, 24);
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
      if (i === run.blindIndex) this.refs.blindColumn = col;
      if (kind === 'boss') this.refs.blindBoss = col;
      const state = i < run.blindIndex ? 'done' : i === run.blindIndex ? 'current' : 'future';
      const boss = kind === 'boss' && run.anteBoss ? BOSS_BY_ID[run.anteBoss] : undefined;
      const color = boss ? boss.color : BLIND_COLORS[kind];
      const g = new Graphics()
        .roundRect(0, 6, 300, 490, 10).fill(STYLE.shadowColor)
        .roundRect(0, 0, 300, 490, 10).fill(state === 'current' ? color : C.panel)
        .stroke({ width: 4, color: C.panelLine });
      col.addChild(g);
      const name = label(boss ? boss.name : BLIND_NAMES[kind], 26);
      name.position.set(150, 36);
      if (name.width > 280) name.scale.set(280 / name.width);
      const chip = new Graphics().circle(150, 108, 40).fill(shade(color, 0.45)).stroke({ width: 4, color: C.panelLine });
      const chipT = label(kind === 'boss' ? '☠' : kind === 'big' ? '◆' : '●', 38, 0xffffff);
      chipT.position.set(150, 108);
      col.addChild(name, chip, chipT);
      if (boss) {
        const d = new Text({ text: boss.description, style: { fontFamily: FONT_BODY, fontSize: 17, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 260, align: 'center' } });
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
        const tb = new Graphics().roundRect(16, 322, 268, 86, 6).fill(shade(state === 'current' ? color : C.panel, 0.45));
        const tn = label(`Skip Tag: ${tag.name}`, 17, C.accent);
        tn.position.set(150, 342);
        const td = new Text({ text: tag.description, style: { fontFamily: FONT_BODY, fontSize: 15, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 250, align: 'center' } });
        td.anchor.set(0.5, 0);
        td.position.set(150, 360);
        col.addChild(tb, tn, td);
      }
      if (state === 'current') {
        const play = new Button('Spielen', kind === 'boss' ? 220 : 140, 58, C.money, () => this.beginRound(), 24);
        play.position.set(kind === 'boss' ? 150 : 85, 448);
        col.addChild(play);
        this.refs.blindPlay = play;
        if (kind !== 'boss') {
          const skip = new Button('Skip', 110, 58, 0xf2711c, () => this.doSkip(), 24);
          skip.position.set(222, 448);
          col.addChild(skip);
          this.refs.blindSkip = skip;
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
    if (this.guardGuide()) return;
    const run = this.run!;
    const r = skipBlind(run);
    this.persist();
    this.refreshInfo();
    juice(this.moneyText);
    this.toast(`Tag: ${TAG_BY_ID[r.tagId].name}${r.doubled ? ' (doppelt)' : ''}`);
    if (run.phase === 'pack') this.showPack();
    else this.showBlindSelect();
  }

  private async beginRound() {
    const run = this.run!;
    if (this.tut && !this.tut.allowsEvent('blindStarted')) {
      sfx.deny();
      haptics.deny();
      return;
    }
    this.clearOverlay();
    this.clearScreen();
    this.clearCardViews();
    let picked: { money: number; consumables: string[] };
    if (this.tut) {
      startTutorialRound(run, run.blindIndex);
      picked = { money: 0, consumables: [] };
    } else {
      picked = selectBlind(run);
    }
    this.busy = true;
    this.syncConsumables();
    sfx.blindStart(BLIND_KINDS[Math.min(run.blindIndex, 2)]);
    haptics.blindStart(BLIND_KINDS[Math.min(run.blindIndex, 2)]);
    this.refreshInfo();
    if (picked.money || picked.consumables.length) {
      const n = picked.consumables.length;
      const parts = [picked.money ? `+$${picked.money}` : '', n ? `${n} Consumable${n > 1 ? 's' : ''}` : ''].filter(Boolean);
      this.toast(`Jokers: ${parts.join(', ')}`, C.money);
      juice(this.moneyText);
    }
    await this.drawCards([...run.round!.hand]);
    this.busy = false;
    this.persist();
    this.notifyGuide('blindStarted');
    this.refreshInfo();
  }

  private showRoundWon() {
    const run = this.run!;
    if (this.tut?.finished) {
      this.showGuideDone();
      return;
    }
    const e = computeEarnings(run);
    const over = overkill(run.round!.score, run.round!.target);
    sfx.win(run.round!.blind, !!over && over.ratio >= OVERKILL_BIG);
    haptics.win();
    this.fx.flash(over ? 0.26 : 0.18, 0xffd23f);
    const lines: [string, number][] = [
      ['Blind Belohnung', e.blindReward],
      [`Übrige Hands (${run.round!.handsLeft})`, e.handsBonus],
      ...(e.discardsBonus ? [[`Übrige Discards (${run.round!.discardsLeft})`, e.discardsBonus] as [string, number]] : []),
      [`Zinsen ($1 je $${run.rules.interestPer}, max. $${run.rules.interestCap + jokerPassive(run).interestCapDelta})`, e.interest],
      ...(e.jokers ? [['Jokers', e.jokers] as [string, number]] : []),
    ];
    const overH = over ? 36 : 0;
    const boxH = 288 + 58 * lines.length + overH;
    const { box } = this.modal(580, boxH, C.panelDark);
    const head = label('Blind geschafft!', 44, C.money);
    head.position.set(290, 60);
    box.addChild(head);
    if (over) {
      const ol = label(`Überschuss: ${fmt(over.extra)} Punkte (${Math.round(over.ratio * 100)} Prozent des Ziels)`, 19, C.chips);
      ol.position.set(290, 112);
      box.addChild(ol);
    }
    lines.forEach(([t, v], i) => {
      const l = label(t, 22, C.text);
      l.anchor.set(0, 0.5);
      l.position.set(40, 150 + overH + i * 58);
      const r = label('$' + v, 30, C.money);
      r.anchor.set(1, 0.5);
      r.position.set(540, 150 + overH + i * 58);
      l.alpha = r.alpha = 0;
      wait(200 + i * 220).then(() => { tween(l, { alpha: 1 }, 200); tween(r, { alpha: 1 }, 200); juice(r); });
      box.addChild(l, r);
    });
    const btn = new Button(`Einkassieren $${e.total}`, 360, 76, C.money, async () => {
      btn.enabled = false;
      const remaining = run.round!.hand.map((c) => this.cardViews.get(c.id)!).filter(Boolean);
      const paid = cashOut(run);
      if (this.tut) rigTutorialShop(run);
      this.persist();
      this.notifyGuide('cashedOut');
      this.syncConsumables();
      juice(this.moneyText);
      this.clearOverlay();
      if (paid.starSealCreated.length) this.toast(`Stern Seal: ${paid.starSealCreated.length} Sternbild erzeugt`, C.chips);
      await this.flyAway(remaining);
      this.clearCardViews();
      if (run.won && !run.winShown) {
        run.winShown = true;
        this.persist();
        this.showRunWon();
      } else {
        this.showShop();
      }
    }, 28);
    btn.position.set(290, boxH - 75);
    box.addChild(btn);
    this.refs.cashoutBtn = btn;
    this.updateGuide();
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
      this.persist();
      this.renderShop();
    };
    this.shopView = buildShop(run, {
      buyCard: (i) => {
        if (this.tut && (i !== 0 || !this.tut.allowsEvent('bought'))) {
          this.guardGuide();
          return;
        }
        if (buyCard(run, i)) {
          sfx.buy();
          haptics.buy();
          this.notifyGuide('bought');
          this.syncJokers();
          this.syncConsumables();
          juice(this.moneyText);
          after();
        }
      },
      buyAndUse: (i) => {
        if (this.guardGuide()) return;
        const item = run.shop?.cards[i];
        const type = item?.kind === 'consumable' ? CONSUMABLE_BY_ID[item.defId]?.type : undefined;
        const res = buyAndUse(run, i);
        if (res) {
          sfx.buy();
          haptics.buy();
          this.afterConsumableUse(res, type);
        }
      },
      buyPack: (i) => {
        if (this.guardGuide()) return;
        if (buyPack(run, i)) {
          sfx.packOpen();
          haptics.packOpen();
          this.persist();
          this.renderShop();
          this.showPack();
        }
      },
      buyVoucher: () => {
        if (this.guardGuide()) return;
        if (buyVoucher(run)) {
          sfx.buy();
          haptics.buy();
          this.fx.flash(0.06, 0xffd23f);
          juice(this.moneyText);
          after();
        }
      },
      reroll: () => {
        if (this.guardGuide()) return;
        if (reroll(run)) {
          sfx.reroll();
          haptics.reroll();
          after();
        }
      },
      nextRound: () => {
        if (this.tut && !this.tut.allowsEvent('leftShop')) {
          this.guardGuide();
          return;
        }
        leaveShop(run);
        this.persist();
        this.notifyGuide('leftShop');
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
    const H = withHand ? 800 : 630;
    const { box } = this.modal(W, H, C.panelDark);
    const typeColor = def.kind === 'joker' ? C.mult : def.kind === 'karten' ? C.chips : CONSUMABLE_COLORS[def.kind];
    const head = label(def.name, 40, typeColor);
    head.position.set(W / 2, 50);
    box.addChild(head);
    const dyn = new Container();
    box.addChild(dyn);
    /** gewählte Ziel Karten der Pack Hand (Reihenfolge der Wahl) */
    const targets: number[] = [];

    const render = (animate = false) => {
      for (const c of [...dyn.children]) c.destroy({ children: true });
      const fanTargets: FanTarget[] = [];
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
        const t = richText(text, spacing - 14, { size: withHand ? 15 : 17, theme: 'dark' });
        t.position.set(x, 295);
        const pick = new Button('Wählen', 140, 56, C.green, () => this.pickPackOption(i, targets), 20);
        pick.position.set(x, withHand ? 460 : 470);
        pick.enabled = canPick(run, i, targets);
        dyn.addChild(view, t, pick);
        fanTargets.push({ view, x, y: 200, extras: [t, pick] });
      });

      if (p.handIds) {
        const hl = label('Deine Karten, wähle die Ziele', 18, C.textDim);
        hl.position.set(W / 2, 520);
        dyn.addChild(hl);
        const cards = p.handIds.map((id) => run.deck.find((c) => c.id === id)).filter((c): c is Card => !!c);
        const cs = Math.min(112, 880 / Math.max(cards.length, 1));
        cards.forEach((card, i) => {
          const cv = new CardView(card);
          cv.scale.set(2 / 3);
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

      const skip = new Button('Überspringen', 240, 56, 0xf2711c, () => {
        closePack(run);
        this.persist();
        this.clearOverlay();
        this.showPhase();
      }, 22);
      skip.position.set(W / 2, H - 52);
      dyn.addChild(skip);

      // Öffnung: der Beutel platzt, die Karten fächern sich auf (Bedienung erst danach)
      if (animate && fanTargets.length) {
        dyn.interactiveChildren = false;
        void playPackOpen(dyn, def, W / 2, OPEN_FX.originY, fanTargets, {
          flash: (a, c) => this.fx.flash(a, c),
          shake: (a) => this.fx.shake(a),
        }).then(() => { if (!dyn.destroyed) dyn.interactiveChildren = true; });
      }
    };
    const first = this.packAnimated !== p;
    this.packAnimated = p;
    render(first);
  }

  private pickPackOption(i: number, targets: number[] = []) {
    const run = this.run!;
    const opt = run.pack?.options[i];
    const type = opt?.kind === 'consumable' ? CONSUMABLE_BY_ID[opt.defId]?.type : undefined;
    const res = pickFromPack(run, i, targets);
    if (!res) return;
    if (type) this.playConsumableFx(type);
    else { sfx.pick(); haptics.pick(); }
    this.syncJokers();
    this.syncConsumables();
    if (typeof res !== 'boolean') this.toast(res.message, C.accent);
    this.persist();
    this.refreshInfo();
    if (run.phase === 'pack') this.showPack();
    else {
      this.clearOverlay();
      this.showPhase();
    }
  }

  /** Rückschau eines Runs: Textzeilen und Rekorde (verglichen mit dem Stand vor Beginn des Runs) */
  private runSummary(run: RunState): { lines: string[]; records: string[] } {
    const sync = getProfile().sync;
    const same = !!sync && sync.runId === run.runId && sync.startBestHand > 0;
    const records: string[] = [];
    if (same && run.stats.bestHand > sync!.startBestHand) records.push(`Neuer Rekord: Beste Hand ${fmt(run.stats.bestHand)}`);
    if (same && run.ante > sync!.startBestAnte) records.push(`Neuer Rekord: Ante ${run.ante}`);
    const bestType = run.stats.bestHandType ? ` (${HAND_DATA[run.stats.bestHandType].name})` : '';
    const lines = [`Beste Hand: ${fmt(run.stats.bestHand)}${bestType}`];
    const played = Object.values(run.handsPlayed).reduce((a, b) => a + b, 0);
    lines.push(`Hands gespielt ${played}, Discards genutzt ${run.stats.discardsUsed}, Jokers gekauft ${run.stats.jokersBought}`);
    const top = (Object.entries(run.handsPlayed) as [HandType, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    if (top) lines.push(`Meistgespielt: ${HAND_DATA[top[0]].name} (${top[1]}x, Level ${run.handLevels[top[0]]})`);
    const names = run.jokers.map((j) => getJoker(j.defId)?.name).filter(Boolean);
    lines.push(names.length ? `Jokers: ${names.join(', ')}` : 'Jokers: keine');
    const fresh = newKeys(this.runStartKeys, loadDiscovered()).map((k) => entryName(k)).filter((n): n is string => !!n);
    if (fresh.length) {
      const shown = fresh.slice(0, REPORT_NEW_MAX).join(', ');
      lines.push(`Neu im Atlas (${fresh.length}): ${shown}${fresh.length > REPORT_NEW_MAX ? ` und ${fresh.length - REPORT_NEW_MAX} weitere` : ''}`);
    }
    if (this.runUnlocked.length) {
      const list = this.runUnlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name).filter(Boolean);
      lines.push(`Neue Erfolge (${list.length}): ${list.join(', ')}`);
    }
    return { lines, records };
  }

  private difficultyLabel(run: RunState): string {
    return run.difficulty !== null ? scaleName(run.difficulty) : STAKES.find((s) => s.id === run.stakeId)?.name ?? '';
  }

  /** Einstellung des Runs für "nochmal" und "etwas härter" */
  private rerun(run: RunState, harder: boolean, sameSeed: boolean) {
    let opts: { stakeId?: string; level?: number } = run.difficulty !== null ? { level: run.difficulty } : { stakeId: run.stakeId };
    if (harder) {
      if (run.difficulty !== null) opts = { level: clampScale(run.difficulty + 1) };
      else {
        const ladder = STAKES.filter((s) => s.cumulative !== false);
        const at = ladder.findIndex((s) => s.id === run.stakeId);
        opts = { stakeId: ladder[Math.min(ladder.length - 1, at + 1)].id };
      }
    }
    this.beginNewRun(run.deckId, { ...opts, ...(sameSeed ? { seed: run.seed } : {}) });
  }

  /** Gibt es eine härtere Stufe als die des Runs? */
  private canGoHarder(run: RunState): string | null {
    if (run.daily) return null;
    if (run.difficulty !== null) return run.difficulty < SCALE.max ? scaleName(run.difficulty + 1) : null;
    const ladder = STAKES.filter((s) => s.cumulative !== false);
    const at = ladder.findIndex((s) => s.id === run.stakeId);
    return at < ladder.length - 1 ? ladder[at + 1].name : null;
  }

  private showGameOver() {
    const run = this.run!;
    if (!this.tut) saveRun(null);
    sfx.lose();
    haptics.lose();
    this.fx.shake(12);
    const W = 760;
    const sum = this.runSummary(run);
    const info = wrapText(sum.lines.join('\n'), W - 120, 18, C.text);
    const recs = sum.records.length ? wrapText(sum.records.join('\n'), W - 120, 22, C.money) : null;
    const recH = recs ? recs.height + 14 : 0;
    const tip = wrapText(`Tipp: ${TIPS[hashString(`${run.seed}${run.ante}`) % TIPS.length]}`, W - 140, 17, C.accent);
    const infoH = info.height;
    const near = nearMiss(run.round?.score ?? 0, run.round?.target ?? 0);
    const nearH = near ? 34 : 0;
    const H = 400 + recH + infoH + tip.height + 190 + nearH + 76;
    const { box } = this.modal(W, H, C.panelDark);
    const head = label('Verloren', 64, C.mult);
    head.position.set(W / 2, 80);
    const l1 = label(`Erreicht: Ante ${run.ante}, Round ${(run.ante - 1) * 3 + run.blindIndex + 1}`, 26);
    l1.position.set(W / 2, 160);
    const l1b = label(this.difficultyLabel(run) + (run.daily ? ', Tageslauf' : ''), 20, C.textDim);
    l1b.position.set(W / 2, 196);
    const l2 = label(`Punkte: ${fmt(run.round?.score ?? 0)} / ${fmt(run.round?.target ?? 0)}`, 22, C.textDim);
    l2.position.set(W / 2, 228);
    const nl = near ? label(`Dir fehlten ${fmt(near.missing)} Punkte (${Math.round(near.fraction * 100)} Prozent des Ziels)`, 20, C.chips) : null;
    if (nl) nl.position.set(W / 2, 262);
    if (recs) recs.position.set(W / 2, 262 + nearH);
    info.position.set(W / 2, 262 + nearH + recH);
    tip.position.set(W / 2, info.y + infoH + 22);
    const seed = label(`Seed ${run.seed}`, 18, C.textDim);
    seed.position.set(W / 2, tip.y + tip.height + 26);
    // Erste Reihe: sofort weiter. Im Tageslauf gibt es nur den gleichen Seed (der Seed ist der Tag).
    const quick = run.daily ? null : new Button('Sofort nochmal', 660, 70, C.mult, () => this.rerun(run, false, false), 32);
    if (quick) quick.position.set(W / 2, H - 202);
    const again = new Button('Gleicher Seed', 320, 70, C.accent, () => this.rerun(run, false, true), 28);
    again.position.set(W / 2 + 170, H - 126);
    const b = new Button('Neuer Run', 320, 70, C.chips, () => this.startNewRun(), 30);
    b.position.set(W / 2 - 170, H - 126);
    const m = new Button('Hauptmenü', 220, 54, 0x3b5068, () => this.showMainMenu(), 22);
    m.position.set(W / 2, H - 52);
    box.addChild(head, l1, l1b, l2, info, tip, seed, b, again, m);
    if (quick) box.addChild(quick);
    if (nl) box.addChild(nl);
    if (recs) box.addChild(recs);
  }

  private showRunWon() {
    const run = this.run!;
    sfx.victory();
    haptics.victory();
    this.fx.flash(0.3, 0xffd23f);
    this.fx.shake(10);
    const W = 760;
    const sum = this.runSummary(run);
    const info = wrapText(sum.lines.join('\n'), W - 120, 18, C.text);
    const recs = sum.records.length ? wrapText(sum.records.join('\n'), W - 120, 22, C.money) : null;
    const recH = recs ? recs.height + 14 : 0;
    const harder = this.canGoHarder(run);
    const H = 470 + recH + info.height + (harder ? 86 : 0) + 20;
    const { box } = this.modal(W, H, C.panelDark);
    const head = label('Gewonnen!', 72, C.money, { stroke: { color: C.mult, width: 8 } });
    head.position.set(W / 2, 90);
    const l = label(`Ante ${FINAL_ANTE} besiegt auf ${this.difficultyLabel(run)}${run.daily ? ' im Tageslauf' : ''}.`, 24);
    l.position.set(W / 2, 175);
    const sd = label(`Seed ${run.seed}`, 18, C.textDim);
    sd.position.set(W / 2, 212);
    if (recs) recs.position.set(W / 2, 250);
    info.position.set(W / 2, 250 + recH);
    box.addChild(head, l, sd, info);
    if (recs) box.addChild(recs);
    let y = 250 + recH + info.height + 60;
    const a = new Button('Endless weiterspielen', 400, 70, C.chips, () => this.showShop(), 26);
    a.position.set(W / 2, y);
    box.addChild(a);
    y += 86;
    if (harder) {
      const hb = new Button(`Härter: ${harder}`, 400, 70, C.accent, () => this.rerun(run, true, false), 26);
      hb.position.set(W / 2, y);
      box.addChild(hb);
      y += 86;
    }
    const b = new Button('Neuer Run', 400, 70, C.mult, () => this.startNewRun(), 26);
    b.position.set(W / 2, y);
    box.addChild(b);
  }
}

const SETUP_KEY = 'alatro.setup';

function loadSetupPref(): { deckId?: string; stakeId?: string; mode?: string; level?: number } {
  try {
    return JSON.parse(localStorage.getItem(SETUP_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveSetupPref(p: { deckId: string; stakeId: string; mode: string; level: number }) {
  try {
    localStorage.setItem(SETUP_KEY, JSON.stringify(p));
  } catch {
    /* Speicher nicht verfügbar */
  }
}
