import { Container, Graphics, Rectangle, Text, Ticker, type FederatedPointerEvent } from 'pixi.js';
import { BLIND_KINDS, BLIND_NAMES, FINAL_ANTE, blindReward, blindTarget, type BlindKind } from '../core/blinds';
import { SUIT_NAMES, sortByRank, sortBySuit, type Card } from '../core/cards';
import {
  TAG_BY_ID, PACK_BY_ID, afterHand, buyAndUse, buyCard, buyPack, buyVoucher, canPick, canSwapJoker, canUseConsumable, cashOut, closePack, createRun,
  discardHand, leaveShop, pickFromPack, playHand, reroll, selectBlind, sellConsumable, sellJoker as sellJokerAction, skipBlind, swapJokerFromPack,
  useConsumable,
} from '../core/game';
import { consumableCapacity, consumableSellValue, isRoundOnlyConsumable, type UseResult } from '../core/consumables';
import { handDisplayName } from '../core/hands';
import { HAND_DATA } from '../data/hands';
import type { HandType } from '../core/types';
import { getJoker, jokerDescription, jokerRules } from '../core/jokers';
import { effectTags, triggerLabel } from './jokerInfo';
import { richText } from './richText';
import { t } from '../i18n';
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
import { tapBoost, hintSeen, loadPatchSeen, markHintSeen, savePatchSeen } from '../settings';
import { SCORE_TIERS, type BgMood } from '../data/juice';
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
import { CARD_H, CARD_W, CardView, cardBack } from './CardView';
import { ConsumableView, CONSUMABLE_H, CONSUMABLE_W } from './ConsumableView';
import { playPackOpen, type FanTarget } from './packFx';
import { trayLayout } from './consumableTray';
import { OPEN_FX } from '../data/artFx';
import { BACKUP_H, BACKUP_W, buildBackup } from './BackupView';
import { buildSync, SYNC_H, SYNC_W } from './SyncView';
import { syncManager } from './syncManager';
import { buildCollection, COLLECTION_H, COLLECTION_W } from './CollectionView';
import { buildPatchNotes, buildTutorial, PATCH_H, PATCH_W, TUTORIAL_H, TUTORIAL_W } from './InfoViews';
import { buildHome } from './HomeView';
import { buildOptions } from './OptionsView';
import { ScreenTransition } from './ScreenTransition';
import { JokerView, JOKER_H, JOKER_W } from './JokerView';
import { buildRunInfo, RUN_INFO_H, RUN_INFO_W, type RunInfoTab } from './RunInfoView';
import { buildDeckView, deckButton, deckCaption, DECK_VIEW_H, DECK_VIEW_W } from './DeckView';
import { levelUpBlock } from './levelUpView';
import { LEVEL_UP_VIEW } from '../data/deckView';
import { consumableDescription, levelUpPreview } from '../core/runInfo';
import { buildShop, buildShopSign } from './ShopView';
import { C, CONSUMABLE_COLORS, FONT_BODY, RARITY_COLORS, RARITY_NAMES, VIEW_BLEED, VIEW_H, VIEW_W, fmt, fmtMult, numLocale, shade } from './theme';
import { scoreTier, xMultShake } from './juiceMath';
import { spektakel } from './spektakel';
import { collectCards, dealCards, DeckFx } from './dealAnim';
import { StageFx } from './stageFx';
import { easeInOutCubic, easeOutBack, juice, tween, wait } from './tween';
import { Button, label, overlay, panel, popup, wrapText } from './widgets';
import { BEVEL, SHADOW } from '../data/depth';
import { BLIND_PLATE, BLIND_TILE, CARD_LIFT, CONTROL_BAND, FIELD, HAND_TILE, PAYOUT, SIDEBAR, SLOT, TIP, TRAY, WINDOW } from '../data/tableSurface';
import { drawInset, drawPlate, dropShadow, raised, sunken, vGradient } from './depth';
import { lighten } from './depthMath';
import { buildDeckStack, buildTableSurface, slotOutline, type DeckStack } from './tableSurface';

/** Seitenleiste links: obere Kante der Felder, gleicher Abstand von 20 Punkten dazwischen. `buttons` ist die Mitte von Menü und Run Info. */
const SIDE = { score: 200, hand: 296, counters: 486, money: 590, info: 694, buttons: 850 };
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
const SORT_LABEL: Record<SortMode, string> = { rank: 'Rank', suit: 'Suit' };

export interface GameHooks {
  /** Wechselt die Farbstimmung des Hintergrunds, bossColor färbt die Boss Stimmung */
  setMood: (mood: BgMood, bossColor?: number) => void;
}

export class Game {
  readonly root = new Container();
  /** Behälter des ganzen Spielfelds (ohne Blitz, Banner und Blende), wird für den Zoom Stoß um die Mitte skaliert */
  private world = new Container();
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
  /** Zucken und Stauchen des Stapels beim Austeilen und Einziehen */
  private deckFx!: DeckFx;
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
  /** Kartenstapel mit mehreren Rückseiten, sein Füllstand folgt dem Zähler */
  private deckStack!: DeckStack;
  /** Platzumrisse in Joker und Consumable Fach */
  private traySlots = new Graphics();
  private traySlotsKey = '';
  /** Farbe, mit der die Blind Platte zuletzt gezeichnet wurde (gleiche Farbe, kein Neuzeichnen) */
  private blindBgColor = -1;
  private totalText!: Text;
  /** Einführungshinweis in der Tischmitte, nur bis zur ersten gespielten Hand */
  private hintText!: Text;

  private playBtn!: Button;
  private discardBtn!: Button;
  private sortBtn!: Button;

  constructor(private hooks: GameHooks = { setMood: () => {} }) {
    // Tippen während einer laufenden Animation beschleunigt sie kurz
    if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => { if (this.busy) tapBoost(); }, { passive: true });
    this.handLayer.sortableChildren = true;
    this.jokerLayer.sortableChildren = true;
    this.world.pivot.set(VIEW_W / 2, VIEW_H / 2);
    this.world.position.set(VIEW_W / 2, VIEW_H / 2);
    this.world.addChild(spektakel.moteLayer, this.table, this.jokerLayer, this.playLayer, this.handLayer, this.screenLayer, spektakel.layer, this.fxLayer, this.homeLayer, this.overlayLayer, this.guideLayer);
    this.root.addChild(this.world, this.flashLayer, this.achLayer, spektakel.topLayer, this.trans.root);
    // Grafikstufe Supernova: Zeiger Koordinaten im Spielfeld und Mitte des Callouts
    spektakel.attachSpace((x, y) => spektakel.layer.toLocal({ x, y }));
    spektakel.calloutX = MX;
    this.guide = new Guide(() => this.exitGuide(false));
    this.guideLayer.addChild(this.guide.root);
    Ticker.shared.add((t) => this.guide.update(t.deltaMS));
    this.fx = new StageFx(this.root, this.flashLayer, this.world);
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
    const tb = this.table;

    // Invisible catcher: tapping empty space closes tooltips
    const catcher = new Graphics().rect(-VIEW_BLEED, -VIEW_BLEED, VIEW_W + 2 * VIEW_BLEED, VIEW_H + 2 * VIEW_BLEED).fill({ color: 0, alpha: 0.001 });
    catcher.eventMode = 'static';
    catcher.on('pointertap', () => this.closeTooltip());
    tb.addChild(catcher);

    // Tischfläche (Filz) unter Seitenleiste und Karten, über den Hintergrund Partikeln
    tb.addChild(buildTableSurface({ mx: MX, playY: PLAY_Y, deckX: DECK_X, deckY: DECK_Y }));

    // Seitenleiste: große erhabene Platte, darauf vertiefte Felder
    const side = raised(SIDEBAR.w, SIDEBAR.h, SIDEBAR.color, { radius: SIDEBAR.radius, shadow: SHADOW.plate, alpha: SIDEBAR.alpha, holo: true, sheen: SIDEBAR.sheen });
    side.position.set(SIDEBAR.x, SIDEBAR.y);
    tb.addChild(side);
    /** Vertieftes Feld der Seitenleiste, `bounds` gleich Feldgröße (Ziel der Einführung) */
    const field = (w: number, h: number, x: number, y: number) => {
      const f = sunken(w, h, FIELD.color, { radius: FIELD.radius, outline: FIELD.outline });
      f.position.set(x, y);
      return f;
    };

    // Blind panel: erhabene Platte in der Blindfarbe, darin ein vertieftes Zielfeld
    const bp = this.blindPanel;
    bp.position.set(20, 20);
    this.blindBg = new Graphics();
    const bpShadow = dropShadow(BLIND_PLATE.w, BLIND_PLATE.h + BLIND_PLATE.edge, SHADOW.panel, { radius: BLIND_PLATE.radius });
    bp.boundsArea = new Rectangle(0, 0, BLIND_PLATE.w, BLIND_PLATE.h + BLIND_PLATE.edge);
    this.blindName = label('', 28);
    this.blindName.position.set(165, 30);
    const zielLbl = label(t('Ziel'), 18, C.textDim);
    zielLbl.position.set(165, 72);
    this.zielLabel = zielLbl;
    this.targetText = label('', 40, C.mult);
    this.targetText.position.set(165, 105);
    this.rewardText = label('', 20, C.money);
    this.rewardText.position.set(165, 140);
    this.bossDesc = new Text({ text: '', style: { fontFamily: FONT_BODY, fontSize: 15, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 300, align: 'center' } });
    this.bossDesc.anchor.set(0.5, 0);
    this.bossDesc.position.set(165, 110);
    bp.addChild(bpShadow, this.blindBg, this.blindName, zielLbl, this.targetText, this.rewardText, this.bossDesc);
    tb.addChild(bp);
    // Im Shop ersetzt ein Leuchtschild die Blind Anzeige
    this.shopSign = buildShopSign();
    this.shopSign.position.set(20, 20);
    this.shopSign.visible = false;
    tb.addChild(this.shopSign);

    // Round score
    const sp = field(330, 76, 20, SIDE.score);
    const sLbl = label('Round Score', 20, C.textDim);
    sLbl.anchor.set(0, 0.5);
    sLbl.position.set(20, 38);
    this.scoreText = label('0', 40);
    this.scoreText.anchor.set(1, 0.5);
    this.scoreText.position.set(310, 38);
    sp.addChild(sLbl, this.scoreText);
    this.scorePanel = sp;
    tb.addChild(sp);

    // Hand panel: name, level, chips × mult als erhabene Kacheln im vertieften Feld
    const hp = field(330, 170, 20, SIDE.hand);
    this.handName = label('', 28);
    this.handName.position.set(165, 34);
    this.handLevel = label('', 18, C.textDim);
    this.handLevel.position.set(165, 66);
    const box = (c: Container, color: number, x: number) => {
      const T = HAND_TILE;
      const sh = dropShadow(T.w, T.h + T.edge, SHADOW.button, { radius: T.radius, ...T.shadow });
      sh.x -= T.w / 2;
      sh.y -= T.h / 2;
      const g = drawPlate(new Graphics(), -T.w / 2, -T.h / 2, T.w, T.h, color, { radius: T.radius, edge: T.edge, outline: T.outline, sheen: T.sheen });
      c.addChild(sh, g);
      c.position.set(x, 122 - T.edge / 2);
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
    tb.addChild(hp);
    this.buildNextPanel();

    // Hands / discards
    const counter = (title: string, color: number, px: number) => {
      const p = field(160, 84, px, SIDE.counters);
      const l = label(title, 18, C.textDim);
      l.position.set(80, 22);
      const v = label('0', 38, color);
      v.position.set(80, 56);
      p.addChild(l, v);
      tb.addChild(p);
      return v;
    };
    this.handsText = counter('Hands', C.chips, 20);
    this.discardsText = counter('Discards', C.mult, 190);

    // Money
    const mp = field(330, 84, 20, SIDE.money);
    this.moneyText = label('$0', 48, C.money);
    this.moneyText.position.set(165, 42);
    mp.addChild(this.moneyText);
    tb.addChild(mp);

    // Ante / round
    const info = (title: string, px: number) => {
      const p = field(160, 84, px, SIDE.info);
      const l = label(title, 18, C.textDim);
      l.position.set(80, 22);
      const v = label('', 32, C.money);
      v.position.set(80, 56);
      p.addChild(l, v);
      tb.addChild(p);
      return v;
    };
    this.anteText = info('Ante', 20);
    this.roundText = info('Round', 190);

    // Menü und Run Info liegen in einer Rinne
    tb.addChild(field(330, FIELD.menuStrip.h, 20, FIELD.menuStrip.y));
    const menuBtn = new Button(t('Menü'), FIELD.menuStrip.buttonW, 60, 0x3b5068, () => { if (this.guardGuide()) return; if (!this.busy) this.showMainMenu(); }, 24);
    menuBtn.position.set(20 + 5 + FIELD.menuStrip.buttonW / 2, FIELD.menuStrip.buttonY);
    const infoBtn = new Button('Run Info', FIELD.menuStrip.buttonW, 60, 0xf2711c, () => { if (this.guardGuide()) return; if (!this.busy && this.run) this.showRunInfo(); }, 24);
    infoBtn.position.set(350 - 5 - FIELD.menuStrip.buttonW / 2, FIELD.menuStrip.buttonY);
    tb.addChild(menuBtn, infoBtn);

    // Seed in einer kleinen vertieften Plakette
    tb.addChild(field(330, FIELD.seed.h, 20, FIELD.seed.y));
    this.seedText = label('', 18, C.textDim, { fontWeight: '600' });
    this.seedText.position.set(185, FIELD.seed.y + FIELD.seed.h / 2);
    this.tagsText = new Text({ text: '', style: { fontFamily: FONT_BODY, fontSize: 15, fontWeight: '700', fill: C.accent, wordWrap: true, wordWrapWidth: 320, align: 'center' } });
    this.tagsText.anchor.set(0.5, 1);
    this.tagsText.position.set(185, FIELD.seed.y - 8);
    tb.addChild(this.seedText, this.tagsText);

    // Joker Fach und Consumable Fach: vertiefte Fächer mit feinen Platzumrissen
    const tray = (x: number, w: number) => {
      const f = sunken(w, TRAY.h, TRAY.color, { radius: TRAY.radius, outline: FIELD.outline });
      f.position.set(x, TRAY.y);
      return f;
    };
    const jt = tray(JOKER_TRAY_X, JOKER_TRAY_W);
    const ct = tray(CONS_TRAY_X, CONS_TRAY_W);
    this.jokerCount = label('', 18, C.textDim);
    this.jokerCount.anchor.set(0, 0.5);
    this.jokerCount.position.set(JOKER_TRAY_X + 12, 222);
    this.consLabel = label('Consumables 0/2', 18, C.textDim);
    this.consLabel.anchor.set(1, 0.5);
    this.consLabel.position.set(1408, 222);
    this.jokerTray = jt;
    this.traySlots.eventMode = 'none';
    tb.addChild(jt, ct, this.traySlots, this.jokerCount, this.consLabel);

    // Deck pile: Stapel mit Dicke und weichem Schatten
    this.deckStack = buildDeckStack();
    this.deckStack.root.position.set(DECK_X, DECK_Y);
    this.deckCount = label('', 20, C.text);
    this.deckCount.position.set(DECK_X, DECK_Y + CARD_H / 2 + 24);
    this.deckPile.addChild(this.deckStack.root, this.deckCount, deckCaption(DECK_X, DECK_Y + CARD_H / 2 + 46));
    // Antippen des Stapels öffnet die Deck Ansicht
    this.deckPile.hitArea = new Rectangle(DECK_X - CARD_W / 2 - 10, DECK_Y - CARD_H / 2 - 10, CARD_W + 20, CARD_H + 70);
    this.deckPile.eventMode = 'static';
    this.deckPile.cursor = 'pointer';
    this.deckPile.on('pointertap', () => this.openDeck(() => this.clearOverlay()));
    tb.addChild(this.deckPile);
    this.deckFx = new DeckFx(this.deckPile, this.deckCount, DECK_X, DECK_Y);

    // Buttons
    this.playBtn = new Button('Play Hand', 230, 72, C.chips, () => this.play(), 28);
    this.playBtn.position.set(MX - 260, 935);
    this.discardBtn = new Button('Discard', 230, 72, C.mult, () => this.discard(), 28);
    this.discardBtn.position.set(MX + 260, 935);
    // Ein Knopf wechselt zwischen Rank und Suit, die Beschriftung zeigt die aktive Sortierung
    this.sortBtn = new Button(SORT_LABEL[this.sortMode], 170, 56, 0xf2711c, () => this.cycleSort(), 24);
    this.sortBtn.position.set(MX, 935);
    const sortLbl = label(t('Sortieren'), 18, C.textDim);
    sortLbl.position.set(MX, CONTROL_BAND.y + 14);
    this.handControls.addChild(this.playBtn, this.discardBtn, this.sortBtn, sortLbl);
    tb.addChild(this.handControls);

    this.totalText = label('', 64, C.text, { stroke: { color: 0x070b11, width: 8 } });
    this.totalText.position.set(MX, 600);
    this.totalText.alpha = 0;
    this.fxLayer.addChild(this.totalText);

    this.hintText = wrapText(t('Tippe bis zu 5 Karten an, um sie auszuwählen.\nDer Kasten links zeigt die Pokerhand dazu. Dann Play Hand.'), 800, 24, C.textDim);
    this.hintText.position.set(MX, 318);
    this.hintText.eventMode = 'none';
    this.hintText.visible = false;
    this.table.addChild(this.hintText);
  }

  /** Platzumrisse in Joker und Consumable Fach, passend zur Zahl der Plätze (wird nur bei Änderung neu gezeichnet) */
  private drawTraySlots(jokerCap: number, consCap: number) {
    const key = `${jokerCap}|${consCap}`;
    if (key === this.traySlotsKey) return;
    this.traySlotsKey = key;
    const g = this.traySlots.clear();
    const pad = SLOT.pad;
    for (let i = 0; i < jokerCap; i++) {
      const x = this.jokerX(i, jokerCap);
      slotOutline(g, x - JOKER_W / 2 - pad, JOKER_Y - JOKER_H / 2 - pad, JOKER_W + 2 * pad, JOKER_H + 2 * pad);
    }
    for (const s of this.consumableSlots(consCap)) {
      const w = CONSUMABLE_W * s.scale;
      const h = CONSUMABLE_H * s.scale;
      slotOutline(g, s.x - w / 2 - pad, s.y - h / 2 - pad, w + 2 * pad, h + 2 * pad);
    }
  }

  /** Vorschau im Shop: nächster Blind und Boss der Ante, damit sich Käufe darauf abstimmen lassen */
  private buildNextPanel() {
    const np = panel(330, 262, FIELD.color);
    np.position.set(20, SIDE.score);
    np.visible = false;
    // vertieftes Feld für Ziel und Belohnung
    const well = new Graphics();
    drawInset(well, 12, 88, 306, 76, FIELD.color, { radius: FIELD.radius, outline: FIELD.outline });
    const head = label(t('Als Nächstes'), 20, C.textDim);
    head.position.set(165, 28);
    const blind = label('', 28);
    blind.position.set(165, 66);
    const target = label('', 36, C.mult);
    target.position.set(165, 118);
    const reward = label('', 19, C.money);
    reward.position.set(165, 150);
    // eingravierte Linie zwischen den Abschnitten
    const line = new Graphics().rect(24, 172, 282, 2).fill({ color: 0x000000, alpha: 0.4 }).rect(24, 174, 282, 1).fill({ color: 0xffffff, alpha: 0.12 });
    const bossHead = label(t('Boss dieser Ante'), 18, C.textDim);
    bossHead.position.set(165, 190);
    const bossName = label('', 22, C.accent);
    bossName.position.set(165, 214);
    const bossDesc = wrapText('', 296, 15, C.text);
    bossDesc.position.set(165, 230);
    np.addChild(well, head, blind, target, reward, line, bossHead, bossName, bossDesc);
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
    n.reward.text = rw > 0 ? t('Belohnung {money}', { money: '$'.repeat(rw) }) : t('Keine Belohnung');
    // Ist der nächste Blind selbst der Boss, steht seine Regel direkt darunter, sonst in einem eigenen Abschnitt
    const nextIsBoss = kind === 'boss' && !!boss;
    n.line.visible = n.bossHead.visible = n.bossName.visible = !nextIsBoss;
    n.bossName.text = boss && !nextIsBoss ? boss.name : '';
    n.bossDesc.text = boss ? boss.description : '';
    n.bossDesc.y = nextIsBoss ? 184 : 230;
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
    this.drawBlindPlate(boss ? boss.color : BLIND_COLORS[blind]);
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
    this.rewardText.text = reward > 0 ? t('Belohnung {money}', { money: '$'.repeat(reward) }) : t('Keine Belohnung');
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
    this.setPile(r ? r.drawPile.length : run.deck.length, run.deck.length);
    this.drawTraySlots(jokerCapacity(run), consumableCapacity(run));
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

  /** Blind Platte: Verlauf, Kante und Glanz in der Blindfarbe, darin ein vertieftes Zielfeld. Nur bei neuer Farbe neu gezeichnet. */
  private drawBlindPlate(color: number) {
    if (color === this.blindBgColor) return;
    this.blindBgColor = color;
    const P = BLIND_PLATE;
    const g = this.blindBg.clear();
    drawPlate(g, 0, 0, P.w, P.h, color, { radius: P.radius, edge: P.edge, outline: P.outline, sheen: P.sheen });
    drawInset(g, P.well.x, P.well.y, P.well.w, P.well.h, shade(color, P.well.shade), { radius: P.well.radius, outline: P.well.outline });
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
    this.sortBtn.enabled = can;
  }

  private setHandDisplay(name: string, level: number | null, chips: number, mult: number) {
    this.handName.text = name;
    this.handLevel.text = level ? `Level ${level}` : '';
    this.chipsText.text = fmt(chips);
    this.multText.text = fmtMult(mult);
    this.fitBoxText();
  }

  private fitBoxText() {
    for (const tx of [this.chipsText, this.multText]) {
      tx.scale.set(1);
      if (tx.width > 120) tx.scale.set(120 / tx.width);
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
    tween(v, { lift: v.selected ? 1 : 0 }, 160);
    if (spektakel.enabled()) {
      spektakel.select(this.spk(v), v.selected);
      if (v.selected) spektakel.aura(v, () => v.selected && !v.destroyed);
    }
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

  /** Schaltet die Sortierung von Rank auf Suit und zurück */
  private cycleSort() {
    if (this.busy) return;
    this.sortMode = this.sortMode === 'rank' ? 'suit' : 'rank';
    this.sortBtn.setText(SORT_LABEL[this.sortMode]);
    this.applySort();
    this.layoutHand();
    this.persist();
  }

  /** skip: Karten, die gerade ausgeteilt werden (sie bekommen nur die Zielwerte, die Bewegung übernimmt dealCards) */
  private layoutHand(ms = 260, skip?: Set<CardView>) {
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
      if (skip?.has(v)) return;
      tween(v, { x: v.homeX, y: v.homeY - (v.selected ? 40 : 0), rotation: v.homeRot }, ms, easeInOutCubic);
    });
  }

  /** Animiert Karten, die die Engine bereits gezogen hat, vom Stapel in die Hand (Flug, Umdrehen, gestaffelt). */
  /** Zähler und Höhe des Stapels setzen */
  private setPile(n: number, total: number) {
    this.deckCount.text = `${n}/${total}`;
    this.deckStack.setFill(total > 0 ? n / total : 0);
  }

  private async drawCards(drawn: Card[]) {
    this.applySort();
    const views = drawn.map((c) => this.makeCardView(c.id));
    this.refreshInfo();
    // bestehende Karten rücken weich auf ihre neuen Plätze, die neuen fliegen selbst dorthin
    this.layoutHand(240, new Set(views));
    const run = this.run!;
    const pile = run.round?.drawPile.length ?? 0;
    await dealCards(this.deckFx, views, { x: DECK_X, y: DECK_Y }, {
      countFrom: pile + views.length,
      setCount: (n) => this.setPile(n, run.deck.length),
    });
    this.refreshInfo();
  }

  private clearCardViews() {
    for (const v of this.cardViews.values()) v.destroy({ children: true });
    this.cardViews.clear();
  }

  /** Zieht Karten zum Stapel zurück (gespielt, verworfen, Rundenende). count: Zähler am Stapel zählt dabei hoch. */
  private async flyAway(views: CardView[], count?: { from: number; to: number }) {
    const run = this.run;
    const set = (n: number) => this.setPile(n, run?.deck.length ?? 0);
    if (count && views.length) set(count.from);
    await collectCards(this.deckFx, views, { x: DECK_X, y: DECK_Y }, {
      done: (v) => {
        this.cardViews.delete(v.card.id);
        v.destroy({ children: true });
      },
      count: count ? { ...count, set } : undefined,
    });
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

  /** Helle Tooltip Karte als erhabene Platte (Ursprung oben Mitte), fängt Taps ab, damit der Tisch dahinter sie nicht schließt */
  private tipPlate(w: number, h: number): Container {
    const c = raised(w, h, C.text, { radius: TIP.radius, line: C.cardEdge, shadow: SHADOW.plate, edge: TIP.edge, contrast: TIP.contrast, sheen: TIP.sheen });
    c.position.set(-w / 2, 0);
    c.eventMode = 'static';
    c.hitArea = new Rectangle(0, 0, w, h + TIP.edge);
    return c;
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
    const tagW = tags.map((tg) => Math.max(54, tg.name.length * 9 + 18));
    const rowW = tagW.reduce((x, y) => x + y, 0) + (tags.length - 1) * 6;
    let tx = -rowW / 2;
    tags.forEach((tg, i) => {
      const pill = drawPlate(new Graphics(), tx, 0, tagW[i], 24, tg.color, { radius: 12, edge: 2, outline: 1.5, line: C.cardEdge, sheen: 0.45 });
      const pt = label(tg.name, 13, 0xffffff);
      pt.position.set(tx + tagW[i] / 2, 12);
      tagRow.addChild(pill, pt);
      tx += tagW[i] + 6;
    });
    const h = 114 + trig.height + 10 + desc.height + 82;
    const bg = this.tipPlate(w, h);
    // farbiger Kopf in der Seltenheitsfarbe
    const headBand = new Graphics().roundRect(-w / 2 + 3, 3, w - 6, 72, 11).fill({ color: RARITY_COLORS[def.rarity], alpha: 0.28 });
    const name = label(def.name, 24, C.cardEdge);
    name.position.set(0, 24);
    const rar = drawPlate(new Graphics(), -60, 44, 120, 24, RARITY_COLORS[def.rarity], { radius: 12, edge: 2, outline: 1.5, line: C.cardEdge, sheen: 0.45 });
    const rarT = label(RARITY_NAMES[def.rarity], 14, 0xffffff);
    rarT.position.set(0, 56);
    tagRow.position.set(0, 82);
    trig.position.set(0, 114);
    desc.position.set(0, 114 + trig.height + 10);
    const sell = new Button(t('Verkaufen {price}', { price: '$' + jokerSellValue(v.joker) }), 220, 56, C.green, () => this.sellJoker(v.joker.uid), 20);
    sell.position.set(0, h - 42);
    tip.addChild(bg, headBand, name, rar, rarT, tagRow, trig, desc, sell);
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
    sfx.coin(1, 0.9, 0.12);
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
    const desc = richText(consumableDescription(run, def.id), w - 30, { size: 19, theme: 'light' });
    const targets = this.selected().map((c) => c.card.id);
    const usable = canUseConsumable(run, inst.defId, targets, 'slot');
    let hint = '';
    if (!usable) {
      if (def.targets && run.phase !== 'round') hint = t('Braucht Karten in der Hand, nur in einer Runde');
      else if (isRoundOnlyConsumable(def) && run.phase !== 'round') hint = t('Nur in einer Runde benutzbar');
      else if (def.targets) hint = def.targets.min === def.targets.max ? t('Wähle {n} Karte in der Hand|Wähle {n} Karten in der Hand', { n: def.targets.min }) : t('Wähle {a} bis {b} Karten in der Hand', { a: def.targets.min, b: def.targets.max });
      else hint = t('Gerade nicht benutzbar');
    }
    const hintText = hint ? wrapText(hint, w - 30, 15, 0xa8324a) : null;
    // Sternbild und Omen: was das Level up an Chips und Mult bringt
    const lvl = levelUpPreview(run, inst.defId);
    const lvlBlock = lvl ? levelUpBlock(lvl, w - 30, { size: 17, theme: 'light', slot: true }) : null;
    desc.position.set(0, 84);
    const below = 84 + desc.height + (lvlBlock ? LEVEL_UP_VIEW.gap + lvlBlock.height : 0);
    if (lvlBlock) lvlBlock.position.set(0, 84 + desc.height + LEVEL_UP_VIEW.gap);
    if (hintText) hintText.position.set(0, below + 8);
    const h = below + (hintText ? hintText.height + 16 : 8) + 144;
    const bg = this.tipPlate(w, h);
    const name = label(def.name, 24, C.cardEdge);
    name.position.set(0, 24);
    const badge = drawPlate(new Graphics(), -60, 44, 120, 24, CONSUMABLE_COLORS[def.type], { radius: 12, edge: 2, outline: 1.5, line: C.cardEdge, sheen: 0.45 });
    const badgeT = label(CONSUMABLE_TYPE_NAMES[def.type], 14, 0xffffff);
    badgeT.position.set(0, 56);
    const use = new Button(t('Benutzen'), 230, 56, C.chips, () => this.useConsumableUI(uid), 20);
    use.position.set(0, h - 104);
    use.enabled = usable;
    const sell = new Button(t('Verkaufen {price}', { price: '$' + consumableSellValue(inst) }), 230, 56, C.green, () => this.sellConsumableUI(uid), 20);
    sell.position.set(0, h - 40);
    tip.addChild(bg, name, badge, badgeT, desc, use, sell);
    if (lvlBlock) tip.addChild(lvlBlock);
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
    sfx.coin(1, 0.9, 0.12);
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
    if (res.destroyed.length) extra.push(t('{n} zerstört', { n: res.destroyed.length }));
    if (res.created.length) extra.push(t('{n} neu', { n: res.created.length }));
    if (res.destroyedJokers) extra.push(t('{n} Jokers zerstört', { n: res.destroyedJokers }));
    if (res.consumables.length) extra.push(t('{n} erzeugt', { n: res.consumables.length }));
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
      wait(i * 50).then(() => {
        if (v.destroyed) return;
        tween(v, { x, y: PLAY_Y, rotation: 0 }, 300, easeInOutCubic);
        // gespielte Karten liegen auf dem Tisch: Schatten wieder flach
        tween(v, { lift: CARD_LIFT.played }, 300);
      });
    });
    this.layoutHand();
    await wait(380 + sel.length * 50);

    const scoringIds = new Set(result.scoring.map((c) => c.id));
    for (const v of sel) {
      if (!scoringIds.has(v.card.id)) continue;
      tween(v, { y: PLAY_Y - 30 }, 160, easeOutBack);
      tween(v, { lift: 1 }, 160);
    }
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
    if (spektakel.enabled()) {
      const spk = spektakel.total(SCORE_TIERS.indexOf(tier), r.target > 0 ? result.total / r.target : 0, this.spk(this.totalText));
      this.fx.punch(spk.punch);
    }
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
        if (spektakel.enabled()) {
          spektakel.goal(this.spk(this.scoreText));
          this.fx.punch(0.01);
        }
        juice(this.scoreText);
      }
    }, before, r.score, 500);
    juice(this.scoreText);
    if (!this.tut && prevBest > 0 && result.total > prevBest) this.toast(t('Neuer Bestwert!'), C.money);
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

  /** Mitte eines Objekts in Koordinaten der Effekt Ebene der Grafikstufe Supernova */
  private spk(c: Container) {
    return spektakel.layer.toLocal(c.getGlobalPosition());
  }

  private async animateEvent(ev: ScoreEvent, step = 0) {
    this.playEventSound(ev, step);
    let target: Container | undefined;
    if (ev.source.kind === 'card' || ev.source.kind === 'held') target = this.cardViews.get(ev.source.cardId);
    else if (ev.source.kind === 'joker') target = this.jokerViews.get(ev.source.jokerUid);
    else if (ev.source.kind === 'consumable') target = this.consumableViews.get(ev.source.uid);
    if (spektakel.enabled() && (ev.chips || ev.mult || ev.xMult || ev.money)) {
      // Orbs fliegen vom Auslöser zur Chips oder Mult Anzeige, der Einschlag lässt die Anzeige pulsieren
      spektakel.scoreEvent(ev, this.spk(target ?? this.chipsBox), { chips: this.spk(this.chipsBox), mult: this.spk(this.multBox) }, (kind) => {
        juice(kind === 'chips' ? this.chipsBox : this.multBox, kind === 'xmult' ? 1 : 0.5);
      });
    }
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
    if (ev.money) { sfx.coins(ev.money); haptics.money(); }
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
    const st = this.scoreText;
    st.style.fontSize = 40;
    st.text = fmt(v);
    if (st.width > SCORE_MAX_W) st.style.fontSize = Math.max(18, Math.floor(40 * SCORE_MAX_W / st.width));
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
    if (spektakel.enabled()) for (const v of sel.slice(0, 5)) spektakel.puff(this.spk(v), 0xb48cff);
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
      this.toast(t('{name} hat die Runde gerettet', { name: by }), C.green);
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
    box.addChild(raised(w, h, color, { radius: WINDOW.radius, alpha: WINDOW.alpha, holo: true, shadow: SHADOW.plate, sheen: Math.min(BEVEL.sheenH, WINDOW.sheenMax / h) }));
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

  /** Vertiefte Mulde hinter einem Textblock (Rückschau, Beschreibungen), wird unter den Text gelegt */
  private well(box: Container, x: number, y: number, w: number, h: number): Graphics {
    const g = new Graphics();
    drawInset(g, x, y, w, h, FIELD.color, { radius: FIELD.radius, outline: FIELD.outline });
    box.addChild(g);
    return g;
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
    const text = names.length <= 2 ? t('Neu im Atlas: {names}', { names: names.join(', ') }) : t('Neu im Atlas: {first} und {n} weitere', { first: names[0], n: names.length - 1 });
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
    const head = label(t('Erfolg freigeschaltet'), 17, C.money);
    head.anchor.set(0, 0.5);
    head.position.set(112, 26);
    const name = label(a.name, 30, C.text);
    name.anchor.set(0, 0.5);
    name.position.set(112, 58);
    if (name.width > w - 250) name.scale.set((w - 250) / name.width);
    const desc = label(a.secret ? t('Ein geheimer Erfolg') : a.description, 15, C.textDim, { fontWeight: '600' });
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
    this.toast(t('Das probierst du im echten Run aus.'), 0x4a3f6b);
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
        const buy = this.findButton(this.shopView, t('Kaufen'));
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
      progress: t('Schritt {a} von {b}', { a: prog.current, b: prog.total }),
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
    const head = label(t('Willkommen in der Sternwarte'), 38, C.money);
    head.position.set(360, 70);
    const text = wrapText(t('Alatro ist ein Roguelike mit Pokerhänden. Spiel Karten aus, sammle Punkte, kaufe Jokers und besiege Blinds.\n\nIn einer kurzen geführten Runde zeigt dir Astra alles Wichtige, Schritt für Schritt. Du spielst dabei echte Hände. Das dauert nur ein paar Minuten.'), 600, 22, C.text);
    text.position.set(360, 130);
    this.well(box, 40, 118, 640, text.height + 24);
    const go = new Button(t('Einführung starten'), 400, 76, C.chips, () => this.startGuide(), 30);
    go.position.set(360, 370);
    const later = new Button(t('Später, ich kenne mich aus'), 400, 56, 0x3b5068, () => {
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
    const head = label(t('Einführung geschafft!'), 44, C.money, { stroke: { color: C.mult, width: 6 } });
    head.position.set(350, 70);
    const text = wrapText(t('Du kennst jetzt die Grundlagen: Hände spielen, Discards, Jokers kaufen und Blinds. Der Rest ergibt sich beim Spielen.\n\nFür deinen ersten richtigen Run empfehle ich die Stufe {stake}. Sie ist etwas leichter als das Grundspiel. Unter Erfolge sammelst du ab jetzt Sterne.', { stake: STAKES.find((s) => s.id === BEGINNER_STAKE_ID)?.name ?? '' }), 600, 22, C.text);
    text.position.set(350, 130);
    this.well(box, 30, 118, 640, text.height + 24);
    const go = new Button(t('Echten Run starten'), 400, 76, C.chips, () => this.exitGuide(true, 'setup'), 30);
    go.position.set(350, 400);
    const menu = new Button(t('Hauptmenü'), 260, 56, 0x3b5068, () => this.exitGuide(true), 24);
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
    const { box } = this.modal(W, 950, C.panelDark);
    const head = label(t('Neuer Run'), 44, C.text);
    head.position.set(W / 2, 48);
    const backBtn = new Button(t('Zurück'), 150, 56, 0x4a3f6b, () => this.showMainMenu(), 24);
    backBtn.position.set(100, 48);
    box.addChild(head, backBtn);
    const content = new Container();
    box.addChild(content);
    const body = (text: string, y: number, size = 18, color = C.textDim, width = 560) => {
      const tx = new Text({ text, style: { fontFamily: FONT_BODY, fontSize: size, fontWeight: '700', fill: color, wordWrap: true, wordWrapWidth: width, align: 'center' } });
      tx.anchor.set(0.5, 0);
      tx.position.set(W / 2, y);
      content.addChild(tx);
      return tx;
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
      const wl = drawInset(new Graphics(), 70, y - 10, W - 140, 62, FIELD.color, { radius: FIELD.radius, outline: FIELD.outline });
      content.addChild(wl);
      body(t('Start: {hands} Hands, {discards} Discards, {size} Karten, ${money}\nSmall Blind Ziel: Ante 1 {t1}, Ante 4 {t4}, Ante 8 {t8}', { hands: pr.hands, discards: pr.discards, size: pr.handSize, money: pr.money, t1: tgt(1), t4: tgt(4), t8: tgt(8) }), y, 17, C.chips, 640);
    };

    const render = () => {
      for (const c of [...content.children]) c.destroy({ children: true });
      // Modus
      const tab = (text: string, x: number, active: boolean, fn: () => void) => {
        const b = new Button(text, 330, 52, active ? C.accent : 0x3b5068, fn, 22);
        b.position.set(x, 112);
        content.addChild(b);
      };
      tab(t('Feste Stufen'), W / 2 - 170, mode === 'stakes', () => { mode = 'stakes'; render(); });
      tab(t('Skalierend'), W / 2 + 170, mode === 'scale', () => { mode = 'scale'; render(); });

      // Deck
      const deck = DECKS[deckIdx];
      const dl = label(t('Deck'), 20, C.textDim);
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
        const sl = label(t('Schwierigkeit'), 20, C.textDim);
        sl.position.set(W / 2, 438);
        const sn = label(stake.name, 32, stake.color);
        sn.position.set(W / 2, 478);
        content.addChild(sl, sn);
        const ladderIdx = STAKES.filter((s) => s.cumulative !== false).findIndex((s) => s.id === stake.id);
        body(ladderIdx > 0 ? t('{desc}, plus alle vorherigen', { desc: stake.description }) : stake.description, 506, 18, C.textDim, 480);
        body(stake.cumulative === false ? t('Einsteigerstufe, außerhalb der Leiter') : t('Stufe {a} der Leiter von {b}', { a: ladderIdx + 1, b: STAKES.filter((s) => s.cumulative !== false).length }), 560, 16, C.textDim, 480);
        preview(deck.id, { stakeId }, 612);
        arrow('‹', 110, 470, () => { stakeIdx = (stakeIdx + STAKES.length - 1) % STAKES.length; render(); });
        arrow('›', 690, 470, () => { stakeIdx = (stakeIdx + 1) % STAKES.length; render(); });
      } else {
        levelOut = level;
        const band = scaleBand(level);
        const sl = label(t('Stufe wählen'), 20, C.textDim);
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
          // gefüllte Stufen sind erhabene farbige Plättchen, die übrigen vertiefte Mulden
          const g = new Graphics();
          if (l <= level) drawPlate(g, 0, 0, segW, 44, color, { radius: 6, edge: 3, outline: 2, sheen: 0.4 });
          else drawInset(g, 0, 0, segW, 44, 0x1d2a3a, { radius: 6, outline: 2 });
          if (l === level) g.roundRect(-3, -3, segW + 6, 44 + 3 + 6, 8).stroke({ width: 3, color: C.text });
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
          ? t('Stufe {normal} ist das Grundspiel. Dein Bestwert: Stufe {best} gewonnen, empfohlen: Stufe {rec}', { normal: SCALE.normal, best: profile.bestScale, rec: recommended })
          : t('Stufe {normal} ist das Grundspiel. Für den Anfang empfohlen: Stufe 2 bis {normal}', { normal: SCALE.normal });
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
          seal ? t('Siegel am Deck: {name}', { name: sealName }) : t('Noch kein Siegel an diesem Deck'),
          ...(wonHere ? [t('Auf dieser Stufe gewonnen')] : []),
          ...(goalName ? [t('Nächstes Ziel: {name}', { name: goalName })] : [t('Alle Stufen der Leiter gemeistert')]),
        ];
        body(parts.join('   ·   '), 690, 17, wonHere || seal ? C.money : C.textDim, 700);
      }
      const seedLbl = label('Seed', 20, C.textDim);
      seedLbl.position.set(W / 2, 756);
      const seedBtn = new Button(this.setupSeed || t('Zufällig'), 300, 52, 0x3b5068, () => {
        saveSetupPref({ deckId: deck.id, stakeId: STAKES[stakeIdx].id, mode, level });
        this.showSeedEntry();
      }, 24);
      seedBtn.position.set(W / 2, 800);
      const start = new Button(t('Start'), 300, 66, C.chips, () => {
        saveSetupPref({ deckId: deck.id, stakeId: STAKES[stakeIdx].id, mode, level });
        this.beginNewRun(deck.id, stakeId !== undefined ? { stakeId } : { level: levelOut });
      }, 30);
      start.position.set(W / 2, 880);
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
    const head = label(t('Tageslauf'), 44, C.text);
    head.position.set(W / 2, 52);
    const date = label(new Date(`${d.date}T12:00:00`).toLocaleDateString(numLocale(), { weekday: 'long', day: 'numeric', month: 'long' }), 22, C.textDim);
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
    const tw = label(t('Wandlung: {name}', { name: twist.name }), 28, C.accent);
    tw.position.set(W / 2, 500);
    const td = wrapText(twist.description, 560, 18, C.text);
    td.position.set(W / 2, 530);
    this.well(box, 90, 474, W - 180, 530 + td.height + 6 - 474);
    const seed = label(`Seed ${d.seed}`, 18, C.textDim, { fontWeight: '600' });
    seed.position.set(W / 2, 598);
    const best = label(entry ? t('Bisher heute: Ante {n}', { n: entry.ante }) + (entry.won ? t(', gewonnen') : '') : t('Heute noch nicht gespielt'), 20, entry?.won ? C.green : C.textDim);
    best.position.set(W / 2, 640);
    const go = new Button(entry ? t('Nochmal spielen') : t('Starten'), 360, 72, C.chips, () => {
      this.beginNewRun(d.deckId, { level: d.level, seed: d.seed, daily: { date: d.date, twistId: d.twistId } });
    }, 30);
    go.position.set(W / 2, 690);
    const bk = new Button(t('Zurück'), 200, 50, 0x4a3f6b, () => this.showMainMenu(), 22);
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

  /** Optionen: eigener Vollbild Bildschirm anstelle des Home Bildschirms, alles wird sofort gespeichert und angewendet */
  private showOptions() {
    this.clearOverlay();
    this.closeTooltip();
    for (const c of [...this.homeLayer.children]) c.destroy({ children: true });
    this.homeLayer.addChild(buildOptions({
      version: APP_VERSION,
      onBack: () => {
        for (const c of [...this.homeLayer.children]) c.destroy({ children: true });
        this.openHome();
      },
      onBackup: () => this.showBackup(),
      onSync: () => this.showSync(),
      shakePreview: () => this.fx.shake(6),
    }));
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
    buildRunInfo(box, run, () => this.clearOverlay(), tab, () => this.openDeck(() => this.showRunInfo('deck')));
  }

  /** Öffnet die Deck Ansicht, sofern gerade keine Animation läuft und keine Einführung. `back` stellt danach den vorigen Zustand wieder her. */
  private openDeck(back: () => void) {
    if (!this.run || this.guardGuide() || this.busy) return;
    const run = this.run;
    const { box } = this.modal(DECK_VIEW_W, DECK_VIEW_H, C.panelDark);
    buildDeckView(box, run, back);
  }

  /** Seed Eingabe mit eigener Tastatur: 0 bis 8 Zeichen, O gilt als 0, leer = zufällig */
  private showSeedEntry() {
    let seed = this.setupSeed;
    const W = 760;
    const { box } = this.modal(W, 720, C.panelDark);
    const head = label('Seed', 44, C.text);
    head.position.set(W / 2, 50);
    const hint = label(t('0 bis {n} Zeichen, leer lassen für einen Zufalls Seed', { n: SEED_LENGTH }), 18, C.textDim);
    hint.position.set(W / 2, 100);
    box.addChild(head, hint);
    const dyn = new Container();
    box.addChild(dyn);

    const render = () => {
      for (const c of [...dyn.children]) c.destroy({ children: true });
      for (let i = 0; i < SEED_LENGTH; i++) {
        const x = W / 2 + (i - (SEED_LENGTH - 1) / 2) * 76;
        dyn.addChild(drawInset(new Graphics(), x - 32, 130, 64, 76, 0x141d29, { radius: 10, outline: 3, line: i === seed.length ? C.accent : C.panelLine }));
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
      const del = new Button(t('Löschen'), 200, 62, C.mult, () => { seed = seed.slice(0, -1); render(); }, 24);
      del.position.set(W / 2 - 230, 620);
      del.enabled = seed.length > 0;
      const rnd = new Button(t('Zufällig'), 200, 62, 0xf2711c, () => { seed = ''; render(); }, 24);
      rnd.position.set(W / 2, 620);
      const ok = new Button(t('Fertig'), 200, 62, C.green, () => {
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
    const head = label(t('Ante {n}', { n: run.ante }) + (run.ante > FINAL_ANTE ? ' · Endless' : ''), 40, C.text);
    head.position.set(500, 46);
    box.addChild(head);
    if (!this.tut) {
      const deckBtn = deckButton(150, 52, 22, () => this.openDeck(() => this.showBlindSelect()));
      deckBtn.position.set(110, 44);
      box.addChild(deckBtn);
    }

    BLIND_KINDS.forEach((kind, i) => {
      const col = new Container();
      const state = i < run.blindIndex ? 'done' : i === run.blindIndex ? 'current' : 'future';
      const current = state === 'current';
      const TW = 300;
      const TH = 490;
      // die aktive Kachel hebt sich ab: höher, mit größerem, weicherem Schatten
      col.position.set(35 + i * 315, 90 - (current ? BLIND_TILE.lift : 0));
      col.boundsArea = new Rectangle(0, 0, TW, TH + BEVEL.panelEdge);
      if (current) this.refs.blindColumn = col;
      if (kind === 'boss') this.refs.blindBoss = col;
      const boss = kind === 'boss' && run.anteBoss ? BOSS_BY_ID[run.anteBoss] : undefined;
      const color = boss ? boss.color : BLIND_COLORS[kind];
      const base = current ? color : C.panel;
      col.addChild(
        dropShadow(TW, TH + BEVEL.panelEdge, current ? SHADOW.plate : SHADOW.panel, { radius: BLIND_TILE.radius }),
        raised(TW, TH, base, { radius: BLIND_TILE.radius, shadow: false, sheen: BLIND_TILE.sheen }),
      );
      const name = label(boss ? boss.name : BLIND_NAMES[kind], 26);
      name.position.set(150, 36);
      if (name.width > 280) name.scale.set(280 / name.width);
      // Marke in einer Fassung
      const socket = new Graphics()
        .circle(150, 110, 43).fill({ color: 0xffffff, alpha: 0.16 })
        .circle(150, 108, 43).fill(C.panelLine)
        .circle(150, 108, 39).fill(vGradient(shade(color, 0.3), shade(color, 0.6)))
        .circle(150, 108, 39).stroke({ width: 1.5, color: lighten(color, 0.35), alpha: 0.5 });
      const chipT = label(kind === 'boss' ? '☠' : kind === 'big' ? '◆' : '●', 38, 0xffffff);
      chipT.position.set(150, 108);
      col.addChild(name, socket, chipT);
      if (boss) {
        const d = new Text({ text: boss.description, style: { fontFamily: FONT_BODY, fontSize: 17, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 260, align: 'center' } });
        d.anchor.set(0.5, 0);
        d.position.set(150, 160);
        col.addChild(d);
      }
      // Ziel und Belohnung in einem vertieften Feld
      const well = new Graphics();
      drawInset(well, 16, 226, 268, 100, shade(base, 0.8), { radius: 8, outline: 2 });
      col.addChild(well);
      const zl = label(t('Mindestens'), 17, C.textDim);
      zl.position.set(150, 244);
      const target = label(fmt(currentTarget(run, kind)), 34, C.mult);
      target.position.set(150, 276);
      const rw = blindReward(run.ante, kind, run.rules.smallBlindReward);
      const rew = label(rw > 0 ? t('Belohnung {money}', { money: '$'.repeat(rw) }) : t('Keine Belohnung'), 19, C.money);
      rew.position.set(150, 308);
      col.addChild(zl, target, rew);
      if (kind !== 'boss' && run.anteTags) {
        const tag = TAG_BY_ID[run.anteTags[kind]];
        const tb = new Graphics();
        drawInset(tb, 16, 334, 268, 80, shade(base, 0.8), { radius: 8, outline: 2 });
        const tn = label(t('Skip Tag: {name}', { name: tag.name }), 17, C.accent);
        tn.position.set(150, 350);
        const td = new Text({ text: tag.description, style: { fontFamily: FONT_BODY, fontSize: 15, fontWeight: '700', fill: C.text, wordWrap: true, wordWrapWidth: 250, align: 'center' } });
        td.anchor.set(0.5, 0);
        td.position.set(150, 368);
        col.addChild(tb, tn, td);
      }
      if (current) {
        const play = new Button(t('Spielen'), kind === 'boss' ? 220 : 140, 58, C.money, () => this.beginRound(), 24);
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
        const s = label(state === 'done' ? t('Erledigt') : t('Kommt noch'), 21, C.textDim);
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
    this.toast(t('Tag: {name}', { name: TAG_BY_ID[r.tagId].name }) + (r.doubled ? t(' (doppelt)') : ''));
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
      this.toast(t('Jokers: {parts}', { parts: parts.join(', ') }), C.money);
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
    if (spektakel.enabled()) {
      spektakel.roundWon(!!over && over.ratio >= OVERKILL_BIG);
      this.fx.punch(0.02);
    }
    const lines: [string, number][] = [
      [t('Blind Belohnung'), e.blindReward],
      [t('Übrige Hands ({n})', { n: run.round!.handsLeft }), e.handsBonus],
      ...(e.discardsBonus ? [[t('Übrige Discards ({n})', { n: run.round!.discardsLeft }), e.discardsBonus] as [string, number]] : []),
      [t('Zinsen ($1 je ${per}, max. ${cap})', { per: run.rules.interestPer, cap: run.rules.interestCap + jokerPassive(run).interestCapDelta }), e.interest],
      ...(e.jokers ? [['Jokers', e.jokers] as [string, number]] : []),
    ];
    const overH = over ? 36 : 0;
    const rowH = PAYOUT.rowH;
    const boxH = 288 + rowH * lines.length + overH + PAYOUT.totalH + PAYOUT.totalGap;
    const { box } = this.modal(580, boxH, C.panelDark);
    const head = label(t('Blind geschafft!'), 44, C.money);
    head.position.set(290, 60);
    box.addChild(head);
    if (over) {
      const ol = label(t('Überschuss: {n} Punkte ({pct} Prozent des Ziels)', { n: fmt(over.extra), pct: Math.round(over.ratio * 100) }), 19, C.chips);
      ol.position.set(290, 112);
      box.addChild(ol);
    }
    // Zeilen in einer vertieften Leiste, feine Trennlinien
    const rowsTop = 150 + overH - rowH / 2;
    const bar = new Graphics();
    drawInset(bar, 24, rowsTop, 532, rowH * lines.length, FIELD.color, { radius: FIELD.radius, outline: FIELD.outline });
    for (let i = 1; i < lines.length; i++) {
      bar.rect(40, rowsTop + i * rowH - 1, 500, 1).fill({ color: 0x000000, alpha: 0.35 }).rect(40, rowsTop + i * rowH, 500, 1).fill({ color: 0xffffff, alpha: 0.07 });
    }
    box.addChild(bar);
    lines.forEach(([txt, v], i) => {
      const l = label(txt, 22, C.text);
      l.anchor.set(0, 0.5);
      l.position.set(40, 150 + overH + i * rowH);
      const r = label('$' + v, 30, C.money);
      r.anchor.set(1, 0.5);
      r.position.set(540, 150 + overH + i * rowH);
      l.alpha = r.alpha = 0;
      wait(200 + i * 220).then(() => { if (l.destroyed) return; tween(l, { alpha: 1 }, 200); tween(r, { alpha: 1 }, 200); juice(r); });
      box.addChild(l, r);
    });
    // Gesamtbetrag: dunkle Plakette mit Goldrand
    const totalY = rowsTop + rowH * lines.length + PAYOUT.totalGap;
    const total = new Container();
    total.addChild(raised(532, PAYOUT.totalH, PAYOUT.color, { radius: FIELD.radius + 2, line: C.money, shadow: SHADOW.button, sheen: 0.4 }));
    const tl = label('Total', 24, C.text);
    tl.anchor.set(0, 0.5);
    tl.position.set(16, PAYOUT.totalH / 2);
    const tv = label('$' + e.total, 40, C.money);
    tv.anchor.set(1, 0.5);
    tv.position.set(516, PAYOUT.totalH / 2);
    total.addChild(tl, tv);
    total.position.set(24, totalY);
    total.alpha = 0;
    wait(200 + lines.length * 220).then(() => { if (total.destroyed) return; tween(total, { alpha: 1 }, 200); juice(tv, 0.8); });
    box.addChild(total);
    const btn = new Button(t('Einkassieren {amount}', { amount: '$' + e.total }), 360, 76, C.money, async () => {
      btn.enabled = false;
      sfx.coins(e.total);
      const remaining = run.round!.hand.map((c) => this.cardViews.get(c.id)!).filter(Boolean);
      const pileBefore = run.round!.drawPile.length;
      const paid = cashOut(run);
      if (this.tut) rigTutorialShop(run);
      this.persist();
      this.notifyGuide('cashedOut');
      this.syncConsumables();
      juice(this.moneyText);
      this.clearOverlay();
      if (paid.starSealCreated.length) this.toast(t('Stern Seal: {n} Sternbild erzeugt|Stern Seal: {n} Sternbilder erzeugt', { n: paid.starSealCreated.length }), C.chips);
      // refreshInfo hat den Stapel schon ausgeblendet, für das Einziehen bleibt er sichtbar
      this.deckPile.visible = true;
      await this.flyAway(remaining, { from: pileBefore, to: run.deck.length });
      this.deckPile.visible = false;
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
    // Ablage hinter den Angeboten: vertieft, darauf liegen Jokers, Karten und Wählen Knöpfe
    this.well(box, 30, 112, W - 60, withHand ? 394 : 412);
    const dyn = new Container();
    box.addChild(dyn);
    /** gewählte Ziel Karten der Pack Hand (Reihenfolge der Wahl) */
    const targets: number[] = [];
    /** Tauschen: Index des Pack Jokers, der einen eigenen Joker ersetzen soll (null: normale Ansicht) */
    let swapFor: number | null = null;
    let swapUid: number | null = null;

    /** Auswahl, welcher eigene Joker bei vollen Slots ersetzt (also verkauft) wird */
    const renderSwap = (index: number): void => {
      const o = p.options[index];
      if (!o || o.kind !== 'joker') { swapFor = null; return render(); }
      const jd = getJoker(o.defId)!;
      const sub = label(t('Joker Slots voll: Welchen Joker ersetzen? Er wird verkauft.'), 20, C.textDim);
      sub.position.set(W / 2, 92);
      dyn.addChild(sub);
      const incoming = new JokerView({ uid: -1, defId: o.defId, vars: {}, edition: o.edition });
      incoming.eventMode = 'none';
      incoming.scale.set(0.8);
      incoming.position.set(W / 2 - 330, 215);
      const txt = richText(`${jd.name}\n${jokerDescription(jd)}` + (o.edition ? `\n${EDITIONS[o.edition].name}: ${EDITIONS[o.edition].description}` : ''), 560, { size: 17, theme: 'dark', align: 'left' });
      txt.position.set(W / 2 - 230, 150);
      const arrow = label('\u2193', 40, C.money);
      arrow.position.set(W / 2, 330);
      dyn.addChild(incoming, txt, arrow);
      const own = run.jokers;
      const n = own.length;
      const spacing = Math.min(160, 960 / Math.max(n, 1));
      own.forEach((j, i) => {
        const x = W / 2 + (i - (n - 1) / 2) * spacing;
        const on = swapUid === j.uid;
        const v = new JokerView(j);
        v.scale.set(0.8);
        v.position.set(x, 460 - (on ? 14 : 0));
        v.on('pointertap', () => { swapUid = on ? null : j.uid; sfx.select(!on); renderAgain(); });
        dyn.addChild(v);
        if (on) dyn.addChild(new Graphics().roundRect(x - 62, 460 - 14 - 84, 124, 168, 10).stroke({ width: 4, color: C.money }));
      });
      const back = new Button(t('Zurück'), 200, 56, 0xf2711c, () => { swapFor = null; swapUid = null; render(); }, 22);
      back.position.set(W / 2 - 150, H - 52);
      const chosen = own.find((j) => j.uid === swapUid);
      const ok = !!chosen && canSwapJoker(run, index, chosen.uid);
      const go = new Button(chosen ? t('Ersetzen, +${n}', { n: jokerSellValue(chosen) }) : t('Ersetzen'), 260, 56, C.green, () => {
        if (!chosen || !swapJokerFromPack(run, index, chosen.uid)) return;
        sfx.pick();
        haptics.pick();
        this.syncJokers();
        this.persist();
        this.refreshInfo();
        if (run.phase === 'pack') { swapFor = null; swapUid = null; this.showPack(); }
        else { this.clearOverlay(); this.showPhase(); }
      }, 22);
      go.position.set(W / 2 + 150, H - 52);
      go.enabled = ok;
      dyn.addChild(back, go);
    };
    const renderAgain = () => render();

    const render = (animate = false): void => {
      for (const c of [...dyn.children]) c.destroy({ children: true });
      if (swapFor !== null) return renderSwap(swapFor);
      const fanTargets: FanTarget[] = [];
      const sub = label(t('Wähle noch {n}', { n: p.picksLeft }), 20, C.textDim);
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
          text = `${cd.name}\n${consumableDescription(run, cd.id)}`;
          if (cd.targets) text += '\n' + t('Ziele: {a} von {b}', { a: targets.length, b: cd.targets.min === cd.targets.max ? cd.targets.min : t('{a} bis {b}', { a: cd.targets.min, b: cd.targets.max }) });
        } else {
          view = new CardView(o.card);
          const parts: string[] = [];
          if (o.card.enhancement) parts.push(`${ENHANCEMENTS[o.card.enhancement].name}: ${ENHANCEMENTS[o.card.enhancement].description}`);
          if (o.card.seal) parts.push(`${SEALS[o.card.seal].name}: ${SEALS[o.card.seal].description}`);
          if (o.card.edition) parts.push(`${EDITIONS[o.card.edition].name}: ${EDITIONS[o.card.edition].description}`);
          text = parts.join('\n') || t('Normale Karte');
        }
        view.eventMode = 'none';
        view.position.set(x, 200);
        const info = richText(text, spacing - 14, { size: withHand ? 15 : 17, theme: 'dark' });
        info.position.set(x, 295);
        // Sternbild und Omen: Level up mit Zahlen unter der Beschreibung
        const lvl = o.kind === 'consumable' ? levelUpPreview(run, o.defId) : null;
        const lvlBlock = lvl ? levelUpBlock(lvl, spacing - 14, { size: withHand ? 14 : 16, theme: 'dark' }) : null;
        if (lvlBlock) lvlBlock.position.set(x, 295 + info.height + LEVEL_UP_VIEW.gap);
        // Joker Pack bei vollen Slots: statt Wählen gibt es Tauschen gegen einen eigenen Joker
        const swap = o.kind === 'joker' && !canPick(run, i, targets) && p.picksLeft > 0 && run.jokers.some((j) => canSwapJoker(run, i, j.uid));
        const pick = swap
          ? new Button(t('Tauschen'), 140, 56, C.green, () => { swapFor = i; swapUid = null; render(); }, 20)
          : new Button(t('Wählen'), 140, 56, C.green, () => this.pickPackOption(i, targets), 20);
        pick.position.set(x, withHand ? 460 : 470);
        pick.enabled = swap || canPick(run, i, targets);
        dyn.addChild(view, info, pick);
        if (lvlBlock) dyn.addChild(lvlBlock);
        fanTargets.push({ view, x, y: 200, extras: lvlBlock ? [info, lvlBlock, pick] : [info, pick] });
      });

      if (p.handIds) {
        const hl = label(t('Deine Karten, wähle die Ziele'), 18, C.textDim);
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

      const skip = new Button(t('Überspringen'), 240, 56, 0xf2711c, () => {
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
    if (same && run.stats.bestHand > sync!.startBestHand) records.push(t('Neuer Rekord: Beste Hand {n}', { n: fmt(run.stats.bestHand) }));
    if (same && run.ante > sync!.startBestAnte) records.push(t('Neuer Rekord: Ante {n}', { n: run.ante }));
    const bestType = run.stats.bestHandType ? ` (${HAND_DATA[run.stats.bestHandType].name})` : '';
    const lines = [t('Beste Hand: {n}{type}', { n: fmt(run.stats.bestHand), type: bestType })];
    const played = Object.values(run.handsPlayed).reduce((a, b) => a + b, 0);
    lines.push(t('Hands gespielt {a}, Discards genutzt {b}, Jokers gekauft {c}', { a: played, b: run.stats.discardsUsed, c: run.stats.jokersBought }));
    const top = (Object.entries(run.handsPlayed) as [HandType, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    if (top) lines.push(t('Meistgespielt: {name} ({n}x, Level {lvl})', { name: HAND_DATA[top[0]].name, n: top[1], lvl: run.handLevels[top[0]] }));
    const names = run.jokers.map((j) => getJoker(j.defId)?.name).filter(Boolean);
    lines.push(names.length ? t('Jokers: {parts}', { parts: names.join(', ') }) : t('Jokers: keine'));
    const fresh = newKeys(this.runStartKeys, loadDiscovered()).map((k) => entryName(k)).filter((n): n is string => !!n);
    if (fresh.length) {
      const shown = fresh.slice(0, REPORT_NEW_MAX).join(', ');
      lines.push(t('Neu im Atlas ({n}): {shown}', { n: fresh.length, shown }) + (fresh.length > REPORT_NEW_MAX ? t(' und {n} weitere', { n: fresh.length - REPORT_NEW_MAX }) : ''));
    }
    if (this.runUnlocked.length) {
      const list = this.runUnlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name).filter(Boolean);
      lines.push(t('Neue Erfolge ({n}): {list}', { n: list.length, list: list.join(', ') }));
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
    const tip = wrapText(t('Tipp: {tip}', { tip: TIPS[hashString(`${run.seed}${run.ante}`) % TIPS.length] }), W - 140, 17, C.accent);
    const infoH = info.height;
    const near = nearMiss(run.round?.score ?? 0, run.round?.target ?? 0);
    const nearH = near ? 34 : 0;
    const H = 400 + recH + infoH + tip.height + 190 + nearH + 76;
    const { box } = this.modal(W, H, C.panelDark);
    const head = label(t('Verloren'), 64, C.mult);
    head.position.set(W / 2, 80);
    const l1 = label(t('Erreicht: Ante {a}, Round {b}', { a: run.ante, b: (run.ante - 1) * 3 + run.blindIndex + 1 }), 26);
    l1.position.set(W / 2, 160);
    const l1b = label(this.difficultyLabel(run) + (run.daily ? t(', Tageslauf') : ''), 20, C.textDim);
    l1b.position.set(W / 2, 196);
    const l2 = label(t('Punkte: {a} / {b}', { a: fmt(run.round?.score ?? 0), b: fmt(run.round?.target ?? 0) }), 22, C.textDim);
    l2.position.set(W / 2, 228);
    const nl = near ? label(t('Dir fehlten {n} Punkte ({pct} Prozent des Ziels)', { n: fmt(near.missing), pct: Math.round(near.fraction * 100) }), 20, C.chips) : null;
    if (nl) nl.position.set(W / 2, 262);
    if (recs) recs.position.set(W / 2, 262 + nearH);
    info.position.set(W / 2, 262 + nearH + recH);
    tip.position.set(W / 2, info.y + infoH + 22);
    const seed = label(`Seed ${run.seed}`, 18, C.textDim);
    seed.position.set(W / 2, tip.y + tip.height + 26);
    // Erste Reihe: sofort weiter. Im Tageslauf gibt es nur den gleichen Seed (der Seed ist der Tag).
    const quick = run.daily ? null : new Button(t('Sofort nochmal'), 660, 70, C.mult, () => this.rerun(run, false, false), 32);
    if (quick) quick.position.set(W / 2, H - 202);
    const again = new Button(t('Gleicher Seed'), 320, 70, C.accent, () => this.rerun(run, false, true), 28);
    again.position.set(W / 2 + 170, H - 126);
    const b = new Button(t('Neuer Run'), 320, 70, C.chips, () => this.startNewRun(), 30);
    b.position.set(W / 2 - 170, H - 126);
    const m = new Button(t('Hauptmenü'), 220, 54, 0x3b5068, () => this.showMainMenu(), 22);
    m.position.set(W / 2, H - 52);
    // Rückschau in einer Mulde (Rekorde und Zeilen)
    const wellTop = (recs ?? info).y - 12;
    this.well(box, 50, wellTop, W - 100, info.y + infoH + 12 - wellTop);
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
    const head = label(t('Gewonnen!'), 72, C.money, { stroke: { color: C.mult, width: 8 } });
    head.position.set(W / 2, 90);
    const l = label(t('Ante {n} besiegt auf {diff}{daily}.', { n: FINAL_ANTE, diff: this.difficultyLabel(run), daily: run.daily ? t(' im Tageslauf') : '' }), 24);
    l.position.set(W / 2, 175);
    const sd = label(`Seed ${run.seed}`, 18, C.textDim);
    sd.position.set(W / 2, 212);
    if (recs) recs.position.set(W / 2, 250);
    info.position.set(W / 2, 250 + recH);
    const wellTop = 250 - 12;
    this.well(box, 50, wellTop, W - 100, 250 + recH + info.height + 12 - wellTop);
    box.addChild(head, l, sd, info);
    if (recs) box.addChild(recs);
    let y = 250 + recH + info.height + 60;
    const a = new Button(t('Endless weiterspielen'), 400, 70, C.chips, () => this.showShop(), 26);
    a.position.set(W / 2, y);
    box.addChild(a);
    y += 86;
    if (harder) {
      const hb = new Button(t('Härter: {name}', { name: harder }), 400, 70, C.accent, () => this.rerun(run, true, false), 26);
      hb.position.set(W / 2, y);
      box.addChild(hb);
      y += 86;
    }
    const b = new Button(t('Neuer Run'), 400, 70, C.mult, () => this.startNewRun(), 26);
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
