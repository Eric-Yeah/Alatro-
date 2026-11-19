// Zahlen für Juice auf Consumables und Booster Packs: Funkeln, Glanzstreifen, Aufprall beim Berühren,
// Öffnungsanimation. Alle Zeiten in Millisekunden vor dem Tempofaktor aus den Optionen.
// Grafikstufe "sparsam" schaltet das Funkeln ab und halbiert die Partikel. Ohne die Option Shake gibt es
// kein Wackeln, keinen Aufprall und keinen Blitz.

/** Idle Funkeln (Kreuz Sterne, die an zufälligen Stellen aufblitzen) und Glanzstreifen */
export const IDLE_FX = {
  /** Funken pro Karte (Consumable) und pro Pack */
  sparksCard: 3,
  sparksPack: 5,
  /** Lebensdauer eines Funkens in ms, ein Funke schwillt in dieser Zeit auf und ab */
  sparkMs: [900, 1500] as [number, number],
  /** Vergrößerung der 7 mal 7 Bildpunkte des Funkens */
  sparkScale: 2,
  /** Glanzstreifen: Deckkraft, Breite (logische Punkte), Dauer des Durchlaufs und Pause dazwischen */
  sweepAlpha: 0.3,
  sweepWidth: 16,
  sweepMs: 650,
  sweepPauseMs: [2800, 5200] as [number, number],
};

/** Aufprall beim Berühren (Maus über der Karte) und Antippen */
export const POP_FX = {
  hoverScale: 1.12,
  hoverLift: 8,
  hoverMs: 150,
  /** Antippen: kurz einsinken, dann zurückfedern */
  pressScale: 0.94,
  pressMs: 70,
  releaseMs: 220,
};

/** Öffnen eines Packs: Wackeln, Aufglühen, Partikel, Karten fächern sich auf */
export const OPEN_FX = {
  /** Höhe (im Pack Fenster), auf der der Beutel erscheint und aus der sich die Karten auffächern */
  originY: 250,
  /** Wackeln des Beutels: Winkel (Bogenmaß), Anzahl Schläge, Dauer eines Schlags */
  wobbleAngle: 0.1,
  wobbleBeats: 4,
  wobbleMs: 80,
  /** Aufglühen (Scheibe in der Farbe des Packs) und Aufblähen des Beutels vor dem Platzen */
  glowScale: 3.2,
  glowMs: 380,
  swellScale: 1.28,
  swellMs: 150,
  /** Partikel beim Platzen: Anzahl (voll), Anteil bei Grafikstufe sparsam, Geschwindigkeit, Schwerkraft, Lebensdauer */
  particles: 28,
  particlesCalmShare: 0.45,
  particleSpeed: [260, 620] as [number, number],
  particleGravity: 900,
  particleMs: [520, 900] as [number, number],
  /** Vergrößerung der Partikel (Bildpunkte) */
  particleScale: [2, 4] as [number, number],
  /** Blitz über die ganze Bühne (Deckkraft) und Erschütterung */
  flashAlpha: 0.22,
  shake: 6,
  /** Fächern: Startgröße der Karten, Streuwinkel, Versatz pro Karte, Dauer */
  fanStartScale: 0.25,
  fanAngle: 0.5,
  fanStaggerMs: 80,
  fanMs: 380,
  /** Texte und Knöpfe blenden nach dem Fächern ein */
  textFadeMs: 200,
};
