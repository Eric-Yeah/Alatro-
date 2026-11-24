import type { Quality } from './juice';

// Zahlen für die Kartenbewegung: leichtes Schweben auf dem Tisch, Austeilen vom Stapel und Einziehen zurück zum Stapel.
// Alle Zeiten in Millisekunden bei Tempo 1x (die Tempo Stufen aus den Optionen und der Tipp Schub wirken über tween und wait),
// alle Strecken in Bildschirm Einheiten (das Spielfeld ist 1440 mal 1000), Winkel in Radiant.

/** Schweben einer Kartenart: Auf und Ab in Pixeln, Drehung in Radiant, Periode in Sekunden (pro Karte zufällig dazwischen) */
export interface FloatSpec {
  ampY: number;
  ampRot: number;
  periodMin: number;
  periodMax: number;
}

export const CARD_FLOAT: Record<'hand' | 'joker' | 'consumable' | 'shop', FloatSpec> = {
  hand: { ampY: 3, ampRot: 0.008, periodMin: 2.6, periodMax: 3.8 },
  joker: { ampY: 3.5, ampRot: 0.009, periodMin: 2.8, periodMax: 4 },
  consumable: { ampY: 3, ampRot: 0.008, periodMin: 2.6, periodMax: 3.6 },
  shop: { ampY: 2.5, ampRot: 0.007, periodMin: 3, periodMax: 4 },
};

/** Stärke des Schwebens je Grafikstufe (0 = aus, 1 = voll). Sparsam rechnet gar nichts. */
export const FLOAT_QUALITY: Record<Quality, number> = { voll: 1, sparsam: 0, supernova: 1.4 };

/** Neue Karten lassen das Schweben langsam einsetzen, damit nichts springt (ms) */
export const FLOAT_RAMP_MS = 600;

/** Die Drehung schwingt etwas langsamer als das Auf und Ab, damit die beiden nicht im Gleichschritt laufen (Faktor auf die Periode) */
export const FLOAT_ROT_PERIOD_FACTOR = 1.37;

/** Austeilen vom Stapel in die Hand (Rundenbeginn und Nachziehen) */
export const DEAL = {
  /** Flugzeit einer Karte */
  flightMs: 500,
  /** Abstand zwischen der ersten und zweiten Karte, danach wird jede Lücke um den Faktor kleiner (Beschleunigung) */
  firstGapMs: 85,
  gapFactor: 0.92,
  minGapMs: 34,
  /** Höhe des Bogens (gerade Linie wäre 0), wächst mit der Strecke bis zu diesem Wert */
  arcLift: 95,
  /** Strecke, ab der der Bogen die volle Höhe hat */
  arcFullDist: 700,
  /** Überschwingen beim Ankommen (Faktor der Rückfederung, 0 = keins) */
  overshoot: 0.7,
  /** Startgröße auf dem Stapel (1 = volle Größe) */
  startScale: 0.82,
  /** Anfangsdrehung auf dem Stapel, wechselt das Vorzeichen von Karte zu Karte */
  startRot: 0.2,
  /** Zeitfenster des Umdrehens im Flug (Anteil der Flugzeit, 0 bis 1) */
  flipStart: 0.2,
  flipEnd: 0.64,
  /** Einrasten am Ende: ab diesem Anteil der Flugzeit ein kurzes Pulsieren der Größe um diesen Faktor */
  snapFrom: 0.8,
  snapAmp: 0.045,
  /** Kurze Pause nach der letzten Landung, bevor das Spiel weitergeht */
  settleMs: 70,
  /** Bis zu dieser Kartenzahl bekommt jede Karte den Ziehklang, bei mehr nur jede zweite */
  sfxEveryAbove: 8,
  /** Zucken des Stapels bei jeder abgehobenen Karte (Stauchung, Versatz nach links, Dauer) */
  deckKick: { scaleX: 0.97, scaleY: 1.02, offsetX: -3, ms: 110 },
};

/** Einziehen zum Stapel (gespielte und verworfene Karten, Rundenende) */
export const COLLECT = {
  /** Flugzeit einer Karte */
  flightMs: 380,
  firstGapMs: 48,
  gapFactor: 0.94,
  minGapMs: 24,
  arcLift: 70,
  arcFullDist: 700,
  /** Größe am Stapel */
  endScale: 0.55,
  /** Enddrehung (Vorzeichen wechselt von Karte zu Karte) */
  endRot: 0.35,
  /** Zeitfenster des Umdrehens zur Rückseite */
  flipStart: 0.12,
  flipEnd: 0.5,
  /** Die Karte blendet kurz vor dem Ziel aus (Anteil der Flugzeit, ab dem die Deckkraft sinkt) */
  fadeFrom: 0.8,
  /** Kurze Pause nach der letzten Landung */
  settleMs: 40,
  /** Bis zu dieser Kartenzahl bekommt jede Karte einen Klang, bei mehr nur jede zweite */
  sfxEveryAbove: 2,
  /** Stauchen des Stapels bei jeder Ankunft */
  deckSquash: { scaleX: 1.07, scaleY: 0.93, offsetX: 0, ms: 150 },
  /** Der Zähler des Stapels zählt beim Rundenende in dieser Zeit auf die volle Zahl */
  countMs: 420,
};

/** Wie lange der Zähler am Stapel bei jeder Änderung aufpulst (Faktor und ms) */
export const DECK_COUNT_PULSE = { scale: 1.18, ms: 110 };
