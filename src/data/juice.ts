// Zahlen für Juice (Shake, Flash, Tonleiter, Stimmungen). Reine Darstellung, keine Spielregeln.

/** Stufen für Shake und Flash nach dem Verhältnis Handpunkte zu Blind Ziel. Die letzte passende Stufe gilt. */
export interface ScoreTier {
  /** ab diesem Verhältnis Hand Punkte / Ziel */
  minRatio: number;
  /** Shake Stärke in logischen Pixeln (0 = keiner) */
  shake: number;
  /** Flash Deckkraft (0 = keiner) */
  flash: number;
  /** Lautstärke und Tiefe des Aufschlags 0 bis 1 */
  boom: number;
}

export const SCORE_TIERS: ScoreTier[] = [
  { minRatio: 0, shake: 0, flash: 0, boom: 0.25 },
  { minRatio: 0.1, shake: 3, flash: 0, boom: 0.45 },
  { minRatio: 0.3, shake: 6, flash: 0.1, boom: 0.65 },
  { minRatio: 0.7, shake: 10, flash: 0.2, boom: 0.85 },
  { minRatio: 1.5, shake: 16, flash: 0.32, boom: 1 },
];

/** Shake Dauer in ms und Abklingen */
export const SHAKE_MS = 420;

/** Shake Stärke eines X Mult Effekts (Faktor mal Basis, gedeckelt) */
export const XMULT_SHAKE_BASE = 2.5;
export const XMULT_SHAKE_MAX = 9;

/** Pentatonische Tonleiter (Halbtöne ab Grundton) für die steigende Tonhöhe beim Zählen */
export const SCALE_STEPS = [0, 3, 5, 7, 10];
export const SCALE_BASE_HZ = 220;
export const SCALE_MAX_STEPS = 14;

/** Farbstimmung des Hintergrunds pro Anlass. Farben als RGB 0 bis 1, Tempo und Kontrast als Faktor. */
export type BgMood = 'menu' | 'small' | 'big' | 'boss' | 'shop';

export interface MoodDef {
  deep: [number, number, number];
  mid: [number, number, number];
  accent: [number, number, number];
  speed: number;
  contrast: number;
  /** Stärke der Randabdunklung */
  vignette: number;
  /** Atmen der Helligkeit (0 = ruhig) */
  pulse: number;
}

export const MOODS: Record<BgMood, MoodDef> = {
  menu: { deep: [0.04, 0.04, 0.17], mid: [0.13, 0.11, 0.42], accent: [0.62, 0.36, 0.22], speed: 1, contrast: 1, vignette: 0.7, pulse: 0 },
  small: { deep: [0.03, 0.07, 0.22], mid: [0.07, 0.17, 0.44], accent: [0.09, 0.44, 0.58], speed: 0.8, contrast: 1, vignette: 0.7, pulse: 0 },
  big: { deep: [0.2, 0.09, 0.1], mid: [0.5, 0.24, 0.1], accent: [0.78, 0.4, 0.2], speed: 1.2, contrast: 1.05, vignette: 0.7, pulse: 0 },
  boss: { deep: [0.17, 0.04, 0.12], mid: [0.44, 0.08, 0.2], accent: [0.62, 0.14, 0.4], speed: 1.6, contrast: 1.1, vignette: 0.8, pulse: 0.03 },
  shop: { deep: [0.07, 0.06, 0.16], mid: [0.15, 0.14, 0.34], accent: [0.62, 0.42, 0.18], speed: 0.8, contrast: 1, vignette: 0.7, pulse: 0 },
};

/** Wie stark die Bossfarbe die Boss Stimmung färbt (0 bis 1) */
export const BOSS_TINT_MIX = 0.35;
/** Dauer des Stimmungswechsels in Sekunden */
export const MOOD_FADE_S = 1.2;

/** CRT Filter: Zahlen für den Post Processing Shader */
export const CRT = {
  /** keine Wölbung: sie würde das Bild neu abtasten und weich machen */
  curvature: 0,
  /** Stärke der Scanlines */
  scanline: 0.035,
  /** Abstand der Scanlines in Bildschirmpixeln (vor Auflösungsfaktor) */
  scanPitch: 3,
  /** feiner Farbversatz an den Rändern (Hologramm Kante) */
  aberration: 0.0009,
  vignette: 0.25,
  noise: 0,
  /** Hologramm: helles Band, das langsam über das Bild wandert (Stärke, Sekunden pro Durchlauf) */
  sweep: 0.07,
  sweepPeriod: 7,
  /** leichter Kühlton (0 = aus) */
  tint: 0.35,
};

/** Animationstempo: Faktor, um den alle Tweens und Wartezeiten schneller laufen */
export interface SpeedStep {
  id: string;
  name: string;
  factor: number;
}
export const SPEED_STEPS: SpeedStep[] = [
  { id: 'normal', name: '1x', factor: 1 },
  { id: 'schnell', name: '1,5x', factor: 1.5 },
  { id: 'doppelt', name: '2x', factor: 2 },
  { id: 'sehr', name: '3x', factor: 3 },
  { id: 'blitz', name: '5x', factor: 5 },
  { id: 'turbo', name: '10x', factor: 10 },
];

/** Vibration (Millisekunden, Listen wechseln zwischen Vibrieren und Pause). Reine Darstellung. */
export const HAPTICS = {
  tap: 8,
  select: 12,
  deselect: 7,
  deny: [30, 40, 30],
  /** Zählschritte (Chips, Mult, Retrigger): ganz leicht */
  step: 9,
  money: [12, 30, 12],
  /** Aufprall nach Shake Stärke: Dauer wächst linear von minMs (Stärke 0) bis maxMs (Stärke fullShake), gedeckelt */
  impact: { minMs: 18, maxMs: 90, fullShake: 16 },
  /** Aufschlag der Gesamtpunkte: Dauer wächst mit der Stufe (boom 0 bis 1), ab echoFrom folgt ein Nachschlag */
  total: { minMs: 25, maxMs: 100, echoFrom: 0.6, echoGap: 45, echoMs: 35 },
  goal: [18, 40, 30],
  win: [40, 60, 40, 60, 90],
  lose: [90, 60, 180],
  victory: [40, 50, 40, 50, 40, 50, 140],
  achievement: [20, 50, 20, 50, 60],
  blind: { small: [20], big: [35], boss: [70, 50, 130] },
  buy: [15, 40, 25],
  sell: [25, 40, 12],
  reroll: [10, 30, 10, 30, 10],
  packOpen: [20, 40, 20, 40, 60],
  pick: [15, 35, 30],
  consumable: { sternbild: [12, 40, 12, 40, 25], elixir: [10, 25, 10, 25, 10, 25, 30], omen: [110, 70, 50] },
} as const;

/** Grafikstufe. "sparsam" für ältere Geräte: Bildrate und Auflösung gedeckelt, kein CRT, keine Edition Shader */
export type Quality = 'voll' | 'sparsam';
export const QUALITY_NAMES: Record<Quality, string> = { voll: 'Voll', sparsam: 'Sparsam' };
export const QUALITY_PROFILE: Record<Quality, { maxFps: number; maxResolution: number; crt: boolean; editionFx: boolean }> = {
  voll: { maxFps: 0, maxResolution: 2, crt: true, editionFx: true },
  sparsam: { maxFps: 30, maxResolution: 1, crt: false, editionFx: false },
};

/** FPS Anzeige: Messfenster in ms */
export const FPS_WINDOW_MS = 500;

/** Standard Einstellungen */
export const DEFAULT_SETTINGS = {
  /** Hologramm und CRT Effekt (ohne Wölbung und Rauschen, bleibt scharf) */
  crt: true,
  shake: true,
  /** Lautstärke 0 bis 1 */
  volume: 0.6,
  /** Hintergrundmusik: 'mix' (alle Stücke im Wechsel), ID eines Stücks aus data/music.ts oder 'aus' */
  music: 'mix',
  /** Lautstärke der Musik 0 bis 1, relativ zur Lautstärke */
  musicVolume: 0.5,
  /** ID aus SPEED_STEPS */
  speed: 'normal',
  quality: 'voll' as Quality,
  /** kleine FPS Anzeige oben rechts */
  fps: false,
  /** Vibration bei Berührungen und Punkten (nur auf Geräten, die es können) */
  haptics: true,
};
export const VOLUME_STEP = 0.1;
