// Zahlen für den Optionen Bildschirm (reine Darstellung, Spielfeld 1440 mal 1000).

export const OPTIONS_LAYOUT = {
  /** Seitenleiste links: Titel, Bereiche, Zurück */
  side: { x: 40, y: 40, w: 360, h: 920 },
  /** Inhaltsfläche rechts */
  main: { x: 430, y: 40, w: 970, h: 920 },
  /** Bereichsknöpfe in der Seitenleiste */
  tab: { y0: 230, w: 320, h: 92, gap: 14 },
  /** Zeilen der Inhaltsfläche: Abstand zum Rand, Startlinie, Höhen und Abstand */
  row: { pad: 40, y0: 215, h: 112, hWide: 178, gap: 16, inner: 26 },
  /** Bedienelemente */
  control: { h: 56, switchW: 128, sliderW: 330, sliderValueW: 76, knob: 40, segGap: 6 },
  /** Sternwarten Zierde unten in der Seitenleiste (Astrolabium) */
  astrolabe: { cx: 220, cy: 738, r: 62, spinMs: 120000 },
} as const;

export type OptionsTab = 'anzeige' | 'ton' | 'spiel' | 'daten';
export const OPTIONS_TABS: readonly OptionsTab[] = ['anzeige', 'ton', 'spiel', 'daten'];
