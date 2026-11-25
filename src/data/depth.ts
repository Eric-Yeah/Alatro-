// Zahlen für den Tiefen Look (Version 0.14.0): Comic Stil mit kräftigen flachen Farben, dunkler Kontur, hartem Unterrand und scharfen Schatten.
// Farben als 0xRRGGBB, Strecken in Spielfeld Einheiten (1440 mal 1000), Alpha 0 bis 1.

/** Weicher Schatten: Voreinstellungen je Art des Objekts */
export const SHADOW = {
  color: 0x02050b,
  /** große Platten (Seitenleiste, Fenster) */
  plate: { blur: 4, dy: 10, dx: 0, alpha: 0.55 },
  /** Felder, Anzeigen, Fächer */
  panel: { blur: 3, dy: 7, dx: 0, alpha: 0.5 },
  /** Knöpfe */
  button: { blur: 3, dy: 7, dx: 0, alpha: 0.5 },
  /** Karten auf dem Tisch */
  card: { blur: 4, dy: 7, dx: 3, alpha: 0.42 },
  /** Karten, Jokers, Packs in einem Fach oder im Shop */
  tile: { blur: 4, dy: 7, dx: 2, alpha: 0.45 },
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
  faceTop: 0.07,
  faceBottom: 0.95,
  /** Dicke des Unterrands (Wulst, der den Körper zeigt) */
  panelEdge: 5,
  buttonEdge: 7,
  /** Farbfaktor des Unterrands (kräftig abgesetzt wie im Comic) */
  edgeShade: 0.62,
  /** Schalter für den Lichtstreifen (Wert über 0 = an), nur noch aus Kompatibilität */
  sheenH: 0.42,
  /** Lichtstreifen oben auf Flächen: Höhe, seitlicher Abstand und Deckkraft (Comic Glanz statt Glasband) */
  topLight: { h: 4, inset: 8, alpha: 0.32 },
  /** helle Randlinie um Fenster und Platten (mit dünner dunkler Kontur außen) */
  rim: { color: 0xdbe6ee, alpha: 0.95, width: 2.5 },
  /** Feld, das nach innen vertieft ist (Wert Felder, Fächer) */
  inset: {
    top: 0.62,
    bottom: 0.66,
    /** Höhe und Deckkraft des harten Innenschattens oben */
    shadowH: 6,
    shadowAlpha: 0.4,
    /** helle Lippe unten */
    lipAlpha: 0.1,
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

/** Messleiste (Fortschritt, Ladebalken, Schieberegler): vertiefte Rinne mit gefülltem Verlauf */
export const METER = {
  /** Abstand der Füllung zum Rinnenrand */
  pad: 2,
  /** Füllung: Aufhellung oben, Abdunklung unten, Deckkraft des Glanzbands oben */
  fillTop: 0.1,
  fillBottom: 0.92,
  sheenAlpha: 0.3,
};
