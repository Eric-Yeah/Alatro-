/**
 * Zahlen und Layout der Pokalpfad Ansicht (`src/ui/TrophyView.ts`) und der Rückschau Blöcke.
 * Koordinaten gelten im Fenster (Ursprung links oben), Ansicht 1280 mal 860 wie die Erfolge.
 */
import type { CosmeticRarity } from './trophyTypes';

export const TROPHY_LAYOUT = {
  w: 1280,
  h: 860,
  pad: 48,

  /** Kopf: Titel, Liga, Pokale, Serie, Fortschrittsbalken */
  titleY: 40,
  titleSize: 38,
  claimAll: { w: 280, h: 52, y: 40, size: 22 },
  leagueNameY: 98,
  leagueNameSize: 32,
  leagueSubY: 134,
  leagueSubSize: 18,
  totalY: 98,
  totalSize: 32,
  streakY: 134,
  streakSize: 18,
  barY: 160,
  barH: 18,
  barLabelY: 198,
  barLabelSize: 18,

  /** Reiter und Inhaltsfläche */
  tabsY: 224,
  tabSize: 20,
  contentY: 288,
  contentH: 482,
  footerY: 812,
  close: { w: 220, h: 60, size: 24 },
  footerSize: 18,

  /** Pfad: waagerecht scrollbar */
  road: {
    /** sichtbarer Ausschnitt (Rand zum Fensterrand) */
    viewX: 28,
    viewW: 1224,
    /** Abstand der Knoten und Innenabstand je Liga Abschnitt */
    pitch: 150,
    sectionPad: 24,
    tileW: 112,
    tileH: 128,
    /** Mitte der Kacheln, abwechselnd oben und unten (Inhalts Koordinaten) */
    rowYs: [186, 286] as readonly number[],
    leagueNameY: 24,
    leagueNameSize: 24,
    leagueRangeY: 54,
    leagueRangeSize: 16,
    nameDy: 80,
    nameSize: 16,
    nameMaxW: 142,
    thresholdDy: 104,
    thresholdSize: 16,
    lineWidth: 8,
    bandAlpha: 0.14,
    bandTopH: 6,
    /** Zeiger "Du bist hier" */
    markerR: 11,
    /** Ziehen: ab dieser Strecke (Punkte) gilt eine Berührung als Wischen, nicht als Tippen */
    dragSlop: 10,
    /** Trägheit: Reibung je Sekunde (Anteil, der bleibt) und Mindestgeschwindigkeit (Punkte je Sekunde) */
    friction: 0.04,
    minSpeed: 30,
    maxSpeed: 4000,
    wheelStep: 1,
    jumpMs: 420,
    /** Scrollleiste unten im Ausschnitt */
    barY: 470,
    barH: 6,
    /** Sprungleiste der Ligen in der Fußzeile */
    chipW: 58,
    chipH: 42,
    chipGap: 8,
  },

  /** Kachel (Knoten und Deck Stufe) */
  tile: {
    radius: 14,
    border: 4,
    lockedAlpha: 0.38,
    badgeR: 15,
    previewPad: 12,
    /** schmalere Kacheln zeigen bei Titeln keinen Text, nur Rahmen mit Stern */
    textMinW: 80,
  },

  /** Deck Pfade */
  decks: {
    rowH: 64,
    rowGap: 5,
    nameX: 24,
    nameW: 230,
    nameSize: 22,
    countSize: 15,
    barX: 290,
    segW: 196,
    segGap: 14,
    barH: 16,
    chip: 56,
    chipGap: 16,
    bgOdd: 0x1b2636,
    bgEven: 0x172130,
  },

  /** Verlauf */
  history: {
    listW: 720,
    rowH: 38,
    perPage: 11,
    headY: 6,
    rowsY: 40,
    rightX: 800,
    rightW: 432,
    rows: 11,
    ruleSize: 17,
    colDeck: 14,
    colAnte: 250,
    colResult: 340,
    colGained: 560,
    colDate: 706,
  },

  /** Detailkarte */
  detail: {
    w: 820,
    h: 470,
    radius: 22,
    previewW: 300,
    previewH: 300,
    previewX: 40,
    previewY: 130,
    textX: 380,
    textW: 410,
    nameY: 54,
    nameSize: 34,
    rarityY: 100,
    raritySize: 17,
    descY: 150,
    descSize: 19,
    stateY: 314,
    stateSize: 19,
    btnY: 416,
    btnW: 240,
    btnH: 62,
    btnSize: 26,
    closeW: 150,
    closeH: 50,
    glowMs: 700,
    popScale: 1.14,
  },

  /** Banner beim Liga Aufstieg (Maße wie der Erfolgs Banner) */
  banner: { w: 640, h: 104, badgeR: 34, flavorMaxW: 400, showMs: 3200 },

  /** Toast "+N Pokale": Höhe auf der obersten Ebene, über den Fenstern */
  toastY: 190,

  /** Block mit der Abrechnung in der Rückschau */
  block: {
    headH: 70,
    rowH: 30,
    maxRows: 6,
    lineH: 32,
    headSize: 26,
    subSize: 17,
    rowSize: 19,
    padX: 10,
    btn: { w: 200, h: 48, size: 22 },
    gap: 18,
  },

  /** Marker mit Zahl auf dem Home Knopf */
  homeBadge: { r: 18, size: 20 },
} as const;

/** Farben der Raritäten der Kosmetik */
export const COSMETIC_RARITY_COLOR: Record<CosmeticRarity, number> = {
  common: 0x8fa3b8,
  rare: 0x4f8fd9,
  epic: 0xa87be0,
  legendary: 0xf5b32b,
};

/** Spielbegriffe, bleiben in beiden Sprachen Englisch */
export const COSMETIC_RARITY_NAME: Record<CosmeticRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

/** Farben der Zustände eines Eintrags */
export const TROPHY_STATE_COLOR = {
  lockedFill: 0x141d29,
  lockedLine: 0x2a3548,
  readyGlow: 0xffd45e,
  claimed: 0x3fbf7f,
  equipped: 0x5fe3ff,
  win: 0x3fbf7f,
  loss: 0xe0475b,
  abandoned: 0x9fb4cc,
  lineOff: 0x2a3548,
} as const;
