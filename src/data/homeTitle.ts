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
  /** Tiefe der Karten: Eckenradius, Verlauf der Fläche (Aufhellen oben, Abdunkeln unten), Stärke des Glanzes */
  radius: 10,
  faceLight: 0.5,
  faceDark: 0.88,
  glossStrength: 0.55,
  /** Bodenschatten unter der Kartenreihe: Breite, Höhe, Abstand zur Unterkante, Deckkraft, Einblenden (ms) */
  shadowAlpha: 0.8,
  shadowBlur: 20,
  shadowDy: 16,
  /** Lichtfleck hinter dem Titel (Breite, Höhe, Farbe, Deckkraft), macht die Schatten sichtbar */
  poolW: 1200,
  poolH: 420,
  poolColor: 0x8a7cff,
  poolAlpha: 0.4,
  floorW: 960,
  floorH: 78,
  floorDy: 34,
  floorAlpha: 0.8,
  floorFadeMs: 500,
  /** Größe des Sterns auf dem Kartenrücken */
  backStarOuter: 34,
  backStarInner: 11,
} as const;
