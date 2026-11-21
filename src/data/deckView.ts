// Zahlen der Deck Ansicht und der Level up Anzeige der Sternbilder (nur Maße und Abstände, keine Spielregeln).

/** Deck Ansicht: Fenster, Kartenraster, Zähler, Detailfeld. Maße in logischen Punkten im Fenster. */
export const DECK_VIEW = {
  w: 1280,
  h: 940,
  /** Vergrößerung der Karten Textur (82 mal 114 Pixel): 1 ist pixelgenau und bleibt scharf, nearest Skalierung */
  pxScale: 1,
  /** Abstand der Kartenmitten waagerecht und senkrecht (Karte 82 mal 114 plus Lücke) */
  colPitch: 92,
  rowPitch: 126,
  /** Raster: linker Rand und Ansichtsfenster (scrollt senkrecht, wenn das Deck höher ist) */
  gridX: 40,
  gridY: 278,
  gridH: 510,
  /** Zeile der Rang Zähler über dem Raster (Beschriftung und Zahl) */
  rankLabelY: 234,
  rankCountY: 256,
  /** Deckkraft bereits gezogener, gespielter oder abgeworfener Karten */
  usedAlpha: 0.3,
  /** Umschalter oben: Höhe (Tippfläche mindestens 44) */
  toggleY: 134,
  toggleH: 52,
  toggleW: 150,
  /** Zähler je Farbe */
  suitY: 172,
  suitW: 150,
  suitH: 40,
  /** Detailfeld unten links */
  detailY: 800,
  detailH: 124,
  detailW: 940,
  /** Scrollen: Mausrad Faktor, Wegstrecke ab der ein Wischen kein Antippen mehr ist, Breite des Balkens */
  wheelStep: 0.6,
  dragSlop: 8,
  barW: 6,
  /** Marken auf den Karten (Schriftgrößen, Siegelradius) */
  markFont: 11,
  sealRadius: 10,
  editionRim: 3,
};

/** Zeile mit dem Zuwachs direkt auf der Sternbild Karte (Fußleiste) und im Atlas */
export const LEVEL_UP_CARD = {
  /** Schriftgröße in der Fußleiste der Karte (voller Maßstab) */
  font: 10,
  /** Abstand der Zahlen von der Mitte der Fußleiste */
  gap: 11,
  /** dunkler Grund unter den Zahlen: Breite, Höhe, Abstand von der Mitte */
  backW: 22,
  backH: 12,
  backGap: 8,
  /** ab diesem Maßstab der Karte (Slot Leiste verkleinert) wird die Zeile gezeigt */
  minScale: 0.9,
};

/** Level up Block in Tooltip, Shop und Pack: Schriftgrößen und Zeilenhöhe als Faktor */
export const LEVEL_UP_VIEW = {
  lineFactor: 1.3,
  /** Abstand zur Beschreibung darüber */
  gap: 8,
  /** schmale Blöcke (Pack Spalte) lassen die Beispielzeile des Omens weg */
  narrow: 230,
};
