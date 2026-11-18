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
  menu: { deep: [0.075, 0.055, 0.14], mid: [0.24, 0.1, 0.3], accent: [0.06, 0.26, 0.3], speed: 1, contrast: 1, vignette: 1.3, pulse: 0 },
  small: { deep: [0.04, 0.09, 0.17], mid: [0.09, 0.24, 0.42], accent: [0.06, 0.34, 0.34], speed: 0.7, contrast: 0.85, vignette: 1.2, pulse: 0 },
  big: { deep: [0.14, 0.08, 0.05], mid: [0.44, 0.24, 0.07], accent: [0.42, 0.13, 0.26], speed: 1.35, contrast: 1.15, vignette: 1.3, pulse: 0.04 },
  boss: { deep: [0.07, 0.02, 0.05], mid: [0.3, 0.05, 0.12], accent: [0.14, 0.05, 0.3], speed: 1.9, contrast: 1.4, vignette: 1.7, pulse: 0.1 },
  shop: { deep: [0.06, 0.1, 0.12], mid: [0.13, 0.22, 0.24], accent: [0.3, 0.26, 0.08], speed: 0.8, contrast: 0.9, vignette: 1.2, pulse: 0 },
};

/** Wie stark die Bossfarbe die Boss Stimmung färbt (0 bis 1) */
export const BOSS_TINT_MIX = 0.35;
/** Dauer des Stimmungswechsels in Sekunden */
export const MOOD_FADE_S = 1.2;

/** CRT Filter: Zahlen für den Post Processing Shader */
export const CRT = {
  /** leichte Wölbung (0 = flach) */
  curvature: 0.012,
  /** Stärke der Scanlines */
  scanline: 0.07,
  /** Abstand der Scanlines in Bildschirmpixeln (vor Auflösungsfaktor) */
  scanPitch: 2,
  /** Farbversatz an den Rändern */
  aberration: 0.0007,
  vignette: 0.35,
  noise: 0.025,
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
  crt: true,
  shake: true,
  /** Lautstärke 0 bis 1 */
  volume: 0.6,
  /** ID aus SPEED_STEPS */
  speed: 'normal',
  quality: 'voll' as Quality,
  /** kleine FPS Anzeige oben rechts */
  fps: false,
};
export const VOLUME_STEP = 0.1;
