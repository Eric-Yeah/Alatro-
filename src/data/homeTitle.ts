import type { Suit } from '../core/cards';

/** Ein Buchstabe des Titels auf seiner Spielkarte */
export interface TitleLetter {
  ch: string;
  suit: Suit;
  /** Grundneigung der Karte (Bogenmaß) */
  rot: number;
  /** senkrechter Versatz zur Titellinie */
  dy: number;
}

/** Titel "ALATRO" des Home Bildschirms: jeder Buchstabe auf einer eigenen Karte. Alle Zahlen der Animation. */
export const HOME_TITLE = {
  letters: [
    { ch: 'A', suit: 'H', rot: -0.14, dy: 6 },
    { ch: 'L', suit: 'S', rot: 0.09, dy: -8 },
    { ch: 'A', suit: 'D', rot: -0.07, dy: 12 },
    { ch: 'T', suit: 'C', rot: 0.1, dy: -6 },
    { ch: 'R', suit: 'H', rot: -0.12, dy: 10 },
    { ch: 'O', suit: 'S', rot: 0.07, dy: -2 },
  ] as readonly TitleLetter[],
  /** Abstand der Kartenmitten */
  spacing: 134,
  letterSize: 118,
  pipSize: 20,
  /** Startlage beim Hinwerfen: Versatz nach oben und Drehung */
  dealFromY: -420,
  dealFromRot: -0.6,
  dealMs: 650,
  dealStaggerMs: 110,
  /** Anheben beim Berühren */
  hoverLift: 20,
  hoverMs: 180,
  /** Umdrehen: Dauer je Hälfte und Versatz zwischen den Karten */
  flipMs: 120,
  flipStaggerMs: 70,
  /** ruhiges Wiegen nach dem Hinwerfen (Bogenmaß, Dauer, Versatz zwischen den Karten) */
  swayAngle: 0.025,
  swayMs: 2400,
  swayStaggerMs: 320,
  /** Tiefe der Karten: Eckenradius, Stärke des Glanzstreifens */
  radius: 10,
  glossStrength: 1,
  /** Bodenschatten unter der Kartenreihe (flach): Breite, Höhe, Abstand zur Unterkante, Deckkraft, Einblenden (ms) */
  floorW: 900,
  floorH: 34,
  floorDy: 30,
  floorAlpha: 0.35,
  floorFadeMs: 500,
  /** Größe des Sterns auf dem Kartenrücken */
  backStarOuter: 34,
  backStarInner: 11,
} as const;
