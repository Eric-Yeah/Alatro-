/**
 * Zahlen für Stimmung, Shake, Flash, CRT und Sound (M5). Reine Darstellung, keine Spielregeln.
 * Farben als RGB Tripel im Bereich 0 bis 1 (für den Shader).
 */

export type MoodKey = 'menu' | 'small' | 'big' | 'boss' | 'shop';

export interface Mood {
  /** dunkelste Farbe des Hintergrunds */
  deep: [number, number, number];
  /** mittlere Farbe */
  mid: [number, number, number];
  /** Akzentfarbe der hellen Bänder */
  accent: [number, number, number];
  /** Tempo der Bewegung (1 = Standard) */
  speed: number;
  /** Anzahl der Farbbänder */
  bands: number;
  /** Stärke der Vignette */
  vignette: number;
}

/** Small ruhig, Big kräftiger, Boss dramatisch (Briefing 9.1, 9.4) */
export const MOODS: Record<MoodKey, Mood> = {
  menu: { deep: [0.075, 0.055, 0.14], mid: [0.24, 0.1, 0.3], accent: [0.06, 0.26, 0.3], speed: 1, bands: 7, vignette: 1.3 },
  small: { deep: [0.04, 0.08, 0.14], mid: [0.08, 0.2, 0.3], accent: [0.1, 0.34, 0.36], speed: 0.7, bands: 6, vignette: 1.2 },
  big: { deep: [0.12, 0.06, 0.1], mid: [0.34, 0.14, 0.12], accent: [0.5, 0.3, 0.1], speed: 1.2, bands: 8, vignette: 1.3 },
  boss: { deep: [0.1, 0.02, 0.06], mid: [0.36, 0.05, 0.14], accent: [0.62, 0.12, 0.2], speed: 1.9, bands: 10, vignette: 1.7 },
  shop: { deep: [0.06, 0.09, 0.1], mid: [0.12, 0.26, 0.2], accent: [0.46, 0.38, 0.12], speed: 0.8, bands: 6, vignette: 1.2 },
};

/** Dauer des Überblendens zwischen zwei Stimmungen in Millisekunden */
export const MOOD_FADE_MS = 900;

export interface ShakeTier {
  /** ab diesem Anteil des Blind Ziels (Hand Score geteilt durch Ziel) */
  minRatio: number;
  /** Auslenkung in Pixeln der logischen Auflösung */
  amplitude: number;
  durationMs: number;
  /** Deckkraft des Blitzes, 0 = kein Blitz */
  flash: number;
}

/** Stufen nach Hand Score im Verhältnis zum Ziel, von klein nach groß */
export const SHAKE_TIERS: ShakeTier[] = [
  { minRatio: 0, amplitude: 0, durationMs: 0, flash: 0 },
  { minRatio: 0.1, amplitude: 3, durationMs: 220, flash: 0 },
  { minRatio: 0.3, amplitude: 6, durationMs: 320, flash: 0.1 },
  { minRatio: 0.6, amplitude: 10, durationMs: 420, flash: 0.2 },
  { minRatio: 1, amplitude: 16, durationMs: 600, flash: 0.35 },
];

/** Kleiner Ruck bei einem X Mult Effekt */
export const XMULT_SHAKE = { amplitude: 4, durationMs: 160 };
/** Ruck beim Verlieren einer Runde */
export const LOSS_SHAKE = { amplitude: 14, durationMs: 700 };
/** Dauer des Blitzes in Millisekunden */
export const FLASH_MS = 380;

export const CRT = {
  /** Abstand der Scanlines in Pixeln des Bildschirms */
  scanlinePitch: 3,
  /** Stärke der Scanlines (0 bis 1) */
  scanlineStrength: 0.16,
  /** Farbversatz an den Rändern in Pixeln */
  chromaShift: 1.4,
  /** Stärke der dunklen Ränder */
  vignette: 0.32,
  /** leichtes Flackern (Anteil der Helligkeit) */
  flicker: 0.012,
  /** Stärke der RGB Maske (Subpixel Streifen) */
  mask: 0.06,
};

/** Sound: Grundtöne in Hz und Lautstärken. Alles wird per WebAudio synthetisiert. */
export const SOUND = {
  /** Gesamtlautstärke (0 bis 1) vor der Einstellung des Spielers */
  master: 0.5,
  /** Ton der ersten Chips Zahl beim Zählen */
  chipBase: 392,
  /** Halbtöne pro Zählschritt */
  semitonesPerStep: 1,
  /** höchster Zählschritt, danach bleibt die Tonhöhe stehen */
  maxSteps: 14,
  multBase: 262,
  moneyBase: 988,
};

/** Standardwerte der Einstellungen */
export const DEFAULT_SETTINGS = {
  crt: true,
  /** 0 bis 1 */
  volume: 0.7,
  sound: true,
};
