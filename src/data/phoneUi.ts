/**
 * Handy Ansicht: das Spielfeld ist 1440 mal 1000 groß und wird aufs Fenster verkleinert,
 * auf dem Handy etwa auf 40 Prozent. Kleine Schriften werden dort deshalb vergrößert,
 * große bleiben unverändert (gleiche Oberfläche, nur besser lesbar).
 */
export const PHONE_UI = {
  /** Ab dieser Schriftgröße (logische Pixel) wird nichts mehr vergrößert */
  boostFrom: 30,
  /** Über diese Spanne wächst die Vergrößerung von 1 bis auf boostMax */
  boostSpan: 16,
  /** Größter Faktor, für die kleinsten Schriften */
  boostMax: 1.55,
  /** Zusatzbreite der Tooltips und Detail Karten (logische Pixel) */
  tipExtra: 70,
  /** Absätze in Fenstern mit festem Platz dürfen höchstens so viel höher werden (Faktor) */
  growH: 1.2,
};
