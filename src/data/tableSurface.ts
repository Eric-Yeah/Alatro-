// Zahlen für den Spieltisch im Tiefen Look (Version 0.13.0, Teil A): Seitenleiste, Wert Felder, Filzfläche, Plätze, Fenster.
// Farben als 0xRRGGBB oder 'rgba(...)', Strecken in Spielfeld Einheiten (1440 mal 1000), Alpha 0 bis 1.

/** Seitenleiste links: große erhabene Platte unter allen Feldern */
export const SIDEBAR = {
  x: 10,
  y: 10,
  w: 350,
  h: 980,
  radius: 14,
  color: 0x24354a,
  alpha: 0.94,
  /** Glanzband als Anteil der Höhe (klein, die Platte ist hoch) */
  sheen: 0.1,
};

/** Vertiefte Wert Felder (Round Score, Hands, Geld ...) und Hand Feld */
export const FIELD = {
  color: 0x21324a,
  radius: 10,
  outline: 2,
  /** Seed Plakette unten in der Seitenleiste */
  seed: { y: 944, h: 34 },
  /** Rinne hinter Menü und Run Info */
  menuStrip: { y: 806, h: 90, buttonY: 852, buttonW: 148 },
};

/** Chips und Mult Kacheln im Hand Feld: erhabene farbige Kacheln */
export const HAND_TILE = {
  w: 132,
  h: 68,
  radius: 8,
  edge: 5,
  outline: 2.5,
  sheen: 0.38,
  /** weicher Schatten der Kachel im Feld */
  shadow: { blur: 7, dy: 4, alpha: 0.5 },
};

/** Blind Platte oben links (Farbe kommt vom Blind) */
export const BLIND_PLATE = {
  w: 330,
  h: 160,
  radius: 10,
  edge: 5,
  outline: 3,
  sheen: 0.34,
  /** Farbfaktor des vertieften Zielfeldes (gegen die Blindfarbe) */
  well: { x: 10, y: 56, w: 310, h: 96, shade: 0.58, outline: 2, radius: 8 },
};

/** Joker und Consumable Fach: vertieft, mit Platzumrissen */
export const TRAY = {
  color: 0x182438,
  radius: 14,
  h: 180,
  y: 24,
};

/** Umriss eines Platzes (Joker Fach, Kartenplätze): feine gestrichelte Linie in einer leicht dunklen Mulde */
export const SLOT = {
  fill: 0x000000,
  fillAlpha: 0.2,
  line: 0xaac4e6,
  lineAlpha: 0.2,
  width: 2,
  dash: 9,
  gap: 8,
  radius: 10,
  /** Platz im Fach: Kachel plus Rand */
  pad: 4,
};

/** Filzfläche im Spielbereich rechts der Seitenleiste: nächtliches Observatorium, durchscheinend, damit der Sternhimmel sichtbar bleibt */
export const FELT = {
  x: 372,
  y: 10,
  w: 1058,
  h: 980,
  radius: 26,
  top: 'rgba(26,46,92,0.60)',
  mid: 'rgba(16,30,66,0.52)',
  bottom: 'rgba(8,16,40,0.66)',
  midAt: 0.45,
  /** Vignette: Deckkraft am Rand und Anteil der klaren Mitte */
  vignetteAlpha: 0.42,
  vignetteInner: 0.5,
  /** Randabfall außen: Breite und Deckkraft der Ringe von außen nach innen */
  falloff: [
    { w: 22, alpha: 0.05 },
    { w: 14, alpha: 0.08 },
    { w: 8, alpha: 0.12 },
    { w: 3, alpha: 0.22 },
  ],
  /** Kontur, Lichtkante oben und Schattenkante unten innen */
  line: 0x070b11,
  lineAlpha: 0.85,
  lightAlpha: 0.3,
  darkAlpha: 0.35,
  /** feine Sternbild Linie innen am Rand */
  inlineColor: 0x5fe3ff,
  inlineAlpha: 0.1,
  inlineGap: 9,
};

/** Spielzone in der Mitte: so viele Kartenplätze, wie höchstens gespielt werden, mit dem Abstand der gespielten Karten */
export const PLAY_ZONE = {
  slots: 5,
  spacing: 130,
  /** Platz etwas größer als die Karte */
  pad: 6,
};

/** Rinne am unteren Rand des Filzes hinter Play Hand, Sortieren und Discard */
export const CONTROL_BAND = {
  y: 884,
  fillTop: 'rgba(0,0,0,0.12)',
  fillBottom: 'rgba(0,0,0,0.34)',
  lightAlpha: 0.12,
  darkAlpha: 0.4,
};

/** Kartenstapel: mehrere versetzte Rückseiten mit Dicke */
export const DECK_STACK = {
  layers: 5,
  dx: -1.2,
  dy: -1.6,
  /** Schatten unter dem ganzen Stapel */
  shadow: { blur: 14, dy: 10, dx: 3, alpha: 0.55 },
};

/** Fenster (Platten über dem abgedunkelten Spiel) */
export const WINDOW = {
  radius: 20,
  alpha: 0.97,
  /** höchste Höhe des Glanzbands in Punkten, damit hohe Fenster nicht oben aufgehellt wirken */
  sheenMax: 130,
};

/** Hinweisfeld und Zeiger der Einführung */
export const GUIDE_LOOK = {
  glowWidth: 14,
  glowAlpha: 0.16,
};

/** Tooltip (helle Karte für Jokers und Consumables) */
export const TIP = {
  radius: 14,
  edge: 4,
  /** Verlauf der hellen Fläche (0 flach bis 1 normal) */
  contrast: 0.5,
  sheen: 0.2,
};

/** Auszahlungs Bild: Gesamtbetrag als dunkle Plakette mit Goldrand */
export const PAYOUT = {
  rowH: 58,
  totalH: 60,
  totalGap: 14,
  color: 0x4d3410,
};

/** Abhebung der Karten (0 liegt flach, 1 schwebt wie eine gewählte Karte) */
export const CARD_LIFT = {
  /** gespielte Karten liegen in der Spielzone */
  played: 0.15,
};

/** Blind Kacheln in der Blind Auswahl */
export const BLIND_TILE = {
  radius: 12,
  sheen: 0.2,
  /** die aktive Kachel steht so viele Punkte höher */
  lift: 8,
};
