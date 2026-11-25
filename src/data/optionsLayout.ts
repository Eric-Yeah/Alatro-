// Zahlen für den Optionen Bildschirm (reine Darstellung, Spielfeld 1440 mal 1000).

export const OPTIONS_LAYOUT = {
  /** Seitenleiste links: Titel, Bereiche, Zurück */
  side: { x: 40, y: 40, w: 360, h: 920, groovePad: 40, grooveH: 5, grooveY: 154 },
  /** Inhaltsfläche rechts */
  main: { x: 430, y: 40, w: 970, h: 920 },
  /** Bereichsknöpfe in der Seitenleiste */
  tab: { y0: 230, w: 320, h: 92, gap: 14, color: 0x2b3d55, activeColor: 0x3a6190 },
  /** Zeilen der Inhaltsfläche: Abstand zum Rand, Startlinie, Höhen und Abstand */
  row: {
    pad: 40, y0: 215, h: 112, hWide: 178, gap: 16, inner: 26,
    /** Zeilenkarte: Farbe, Glanz, Unterrand, Schatten (enger als bei großen Platten), Rille unter der Überschrift */
    color: 0x2d405a,
    sheen: 0.22,
    edge: 4,
    shadow: { blur: 3, dy: 6, dx: 0, alpha: 0.5 },
    markX: 12,
    grooveH: 5,
    grooveY: 158,
  },
  /** Bedienelemente */
  control: { h: 56, switchW: 128, sliderW: 330, sliderValueW: 76, knob: 40, segGap: 4, segPad: 5 },
  /** Griffe und Schienen (Schalter, Schieberegler, Auswahlleiste): Unterrand, Eckenradius, Schatten, Maße */
  knob: {
    edge: 3,
    radius: 6,
    shadowBlur: 3,
    shadowDy: 4,
    shadowAlpha: 0.6,
    switchPad: 6,
    switchKnobW: 54,
    knobColor: 0xdfe8f2,
    /** Farbwert für die Schiene im An Zustand (die vertiefte Fläche dunkelt ihn ab, daher heller gewählt) */
    onColor: 0x55f090,
    trackRadius: 10,
    railH: 18,
    tickY: 18,
    valueH: 44,
    valuePadL: 0,
    valuePadR: 12,
  },
  /** Sternwarten Zierde unten in der Seitenleiste (Astrolabium) */
  astrolabe: {
    cx: 220, cy: 722, r: 62, spinMs: 120000,
    /** Schale um die Ringe: Abstand, Farben von Mitte zu Rand; Schein des Kerns */
    wellPad: 9,
    wellColor: 0x121c2a,
    glowR: 30,
    glowAlpha: 0.18,
    /** Rille unter Überschriften: Füllfarbe und Konturfarbe (heller als die Plattenkontur, damit sie nicht schwarz wirkt) */
    grooveColor: 0x34506f,
    grooveLine: 0x111a26,
  },
} as const;

export type OptionsTab = 'anzeige' | 'ton' | 'spiel' | 'daten';
export const OPTIONS_TABS: readonly OptionsTab[] = ['anzeige', 'ton', 'spiel', 'daten'];
