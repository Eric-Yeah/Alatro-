// Zahlen der Wunderkammer (Kosmetik Bildschirm): Fenstergröße, Raster, Vorschau, Rahmenfarben je Rarität.
// Reine Darstellung, Fenster 1280 mal 860 (wie die Erfolge). Texte stehen in `src/ui/WardrobeView.ts`.

import type { CosmeticCategory, CosmeticRarity } from './trophyTypes';

export const WARDROBE_LAYOUT = {
  w: 1280,
  h: 860,
  /** Seitenrand links und rechts */
  pad: 48,
  /** Kopfzeile: Titel mittig, Zähler links, Gesamtpokale rechts */
  head: { y: 40 },
  /** Leiste mit den fünf ausgerüsteten Stücken (tippen wechselt den Reiter) */
  strip: { y: 84, h: 58, chipW: 224, gap: 16, thumbW: 34, thumbH: 44, thumbX: 8 },
  /** Reiter je Kategorie */
  tabs: { y: 156, size: 16 },
  /** Rechte Vorschau Fläche */
  preview: { x: 784, y: 218, w: 448, h: 552 },
  /** Kacheln der Stücke (Raster mit Vorschau, Name und Zustand) */
  tile: { cols: 4, rows: 3, w: 164, h: 176, gapX: 18, gapY: 12, previewY: 10, previewH: 92, nameY: 106, nameSize: 15, captionSize: 14 },
  /** Titel als Liste: zwei Spalten, Zeilen mit Name links und Zustand rechts */
  list: { cols: 2, rows: 8, w: 346, h: 56, gapX: 20, gapY: 10 },
  /** Oberkante des Rasters */
  gridY: 218,
  /** Fußzeile: Zähler, Blättern, Schließen */
  foot: { y: 808, pagerX: [430, 530, 630] },
  /** Rahmen der Kacheln */
  frame: { radius: 14, locked: 0x0f1520, owned: 0x1d2a3a, selected: 0x5fe3ff, equipped: 0x3fbf7f },
  /** Schloss (aus Grafikprimitiven, die Schrift hat kein Zeichen dafür) und Haken */
  badge: { size: 30 },
  /** Große Vorschau: Bereich oben im Fenster, darunter Name, Rarität, Beschreibung, Aktion */
  detail: {
    padX: 24,
    areaY: 20,
    areaH: 252,
    nameY: 298,
    metaY: 334,
    descY: 362,
    descSize: 17,
    actionY: 442,
    btnW: 320,
    btnH: 58,
    barH: 16,
  },
  /** Kartenrücken: Neigung (Bogenmaß) und Pendel der großen Vorschau */
  back: { scale: 1.4, tilt: -0.07, swing: 0.05, swingMs: 2800 },
  /** Kartenfarben: große Vorschau (Maßstab der Textur, Überlappung als Anteil der Kartenbreite, Fächerwinkel) und Kachel (Überlappung mindestens) */
  palette: { bigScale: 1.3, bigStep: 0.82, fan: 0.045, tileStep: 0.5 },
  /** Himmel: Kacheln der fünf Stimmungen, Bänder (Anteile von oben: Tief, Mitte, Akzent), Sterne (relative Lage) */
  sky: {
    gap: 8,
    labelSize: 14,
    bands: [0.4, 0.35, 0.25],
    driftSpeed: 14,
    stars: [[0.2, 0.12], [0.7, 0.2], [0.45, 0.06], [0.85, 0.5], [0.12, 0.55], [0.55, 0.38]],
  },
  /** Funken: Partikel der Vorschau */
  spark: {
    max: 110,
    perSecond: 90,
    lifeMs: [700, 1500],
    speed: [20, 70],
    rise: 36,
    size: [2.6, 5.2],
    wandSize: 5,
    /** Faktor von Größe zu Kantenlänge in Pixeln */
    pixelGrow: 4,
    /** Bahn des Zeigers: Ausschlag (Anteil von Breite und Höhe) und Frequenzen (Umläufe je Sekunde) */
    path: { ax: 0.36, ay: 0.3, fx: 0.31, fy: 0.47, phase: 1.3 },
    seed: 7,
    areaFill: 0x0c1220,
  },
  /** Mini Vorschau in der Leiste der aktuellen Wahl und in den Kacheln */
  mini: { starR: [5, 9], starDx: [13, 26], starDy: [6, 14], starTaper: 0.22, stars: [3, 5], skyPad: 16, skyLabelH: 30 },
} as const;

/** Rahmenfarbe und Strichstärke je Rarität (Common bis Legendary) */
export const RARITY_FRAME: Readonly<Record<CosmeticRarity, { color: number; width: number }>> = {
  common: { color: 0x8fa3bd, width: 2 },
  rare: { color: 0x4f8fd9, width: 3 },
  epic: { color: 0xb26bff, width: 3 },
  legendary: { color: 0xf5b32b, width: 4 },
};

/** Rarität als Spielbegriff (bleibt in beiden Sprachen Englisch) */
export const RARITY_LABEL: Readonly<Record<CosmeticRarity, string>> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

/** Reihenfolge der Reiter */
export const WARDROBE_TABS: readonly CosmeticCategory[] = ['back', 'palette', 'sky', 'spark', 'title'];

/** Stimmungen der Himmel Vorschau in Anzeige Reihenfolge */
export const SKY_PREVIEW_MOODS = ['menu', 'small', 'big', 'boss', 'shop'] as const;
