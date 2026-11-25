// Zahlen für den Tiefen Look (Version 0.13.0): weiche Schatten, Verläufe, Kanten und Glanz.
// Farben als 0xRRGGBB, Strecken in Spielfeld Einheiten (1440 mal 1000), Alpha 0 bis 1.

/** Weicher Schatten: Voreinstellungen je Art des Objekts */
export const SHADOW = {
  color: 0x02050b,
  /** große Platten (Seitenleiste, Fenster) */
  plate: { blur: 22, dy: 12, dx: 0, alpha: 0.6 },
  /** Felder, Anzeigen, Fächer */
  panel: { blur: 14, dy: 8, dx: 0, alpha: 0.5 },
  /** Knöpfe */
  button: { blur: 10, dy: 8, dx: 0, alpha: 0.5 },
  /** Karten auf dem Tisch */
  card: { blur: 12, dy: 8, dx: 2, alpha: 0.45 },
  /** Karten, Jokers, Packs in einem Fach oder im Shop */
  tile: { blur: 12, dy: 8, dx: 1, alpha: 0.5 },
  /** Schatten wächst und wird blasser, wenn ein Objekt abhebt (gewählte Karte, gehaltene Kachel) */
  lift: { extraDy: 22, alphaDrop: 0.12, scaleUp: 0.05 },
  /** erlaubte Eckenradien der Schattentexturen (der nächste passende wird genommen) */
  radii: [4, 8, 12, 20, 30],
  /** Größe der Mitte, die beim Dehnen der neun Teile gestreckt wird */
  core: 12,
};

/** Verläufe und Kanten der Platten, Knöpfe und Felder */
export const BEVEL = {
  /** Aufhellung oben und Abdunkelung unten der Fläche (Faktor 0 bis 1 zu Weiß beziehungsweise Faktor auf die Farbe) */
  faceTop: 0.16,
  faceBottom: 0.8,
  /** Dicke des Unterrands (Wulst, der den Körper zeigt) */
  panelEdge: 4,
  buttonEdge: 6,
  /** Farbfaktor des Unterrands */
  edgeShade: 0.5,
  /** Glanzband oben: Höhenanteil und Deckkraft oben */
  sheenH: 0.42,
  sheenAlpha: 0.3,
  /** feine Lichtkante oben und dunkle Kante unten (Deckkraft) */
  rimLight: 0.4,
  rimDark: 0.28,
  /** Feld, das nach innen vertieft ist (Wert Felder, Fächer) */
  inset: {
    top: 0.5,
    bottom: 0.78,
    /** Höhe und Deckkraft des Innenschattens oben */
    shadowH: 14,
    shadowAlpha: 0.55,
    /** helle Lippe unten */
    lipAlpha: 0.14,
  },
  /** Knopf: Eindrücken beim Drücken (Pixel) und Aufhellen bei Mausberührung */
  press: 4,
  hoverLift: 0.12,
};

/** Karten Dicke: ein Streifen unter der Karte macht sie zum Körper */
export const CARD_BODY = {
  color: 0xb4ab94,
  dy: 3,
};
