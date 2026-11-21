import { SCALE_BANDS, SCALE_FEATURES } from '../../data/difficulty';

/**
 * Englische Namen der Schwierigkeitsstufen (Bänder) und Texte der Zusatzregeln.
 * Schlüssel ist jeweils der deutsche Text. Die Zeilen aus scaleSummary und scaleName laufen über t()
 * (Wörterbuch in src/i18n/en/contentA.ts), weil sie in der Funktion zusammengesetzt werden.
 */
export const BANDS_EN: Record<string, string> = {
  Leicht: 'Easy',
  Normal: 'Normal',
  Fordernd: 'Challenging',
  Schwer: 'Hard',
  Extrem: 'Extreme',
  Grenzenlos: 'Boundless',
};

export const FEATURES_EN: Record<string, string> = {
  '+$3 Startgeld': '+$3 starting money',
  '+1 Discard pro Runde': '+1 Discard per round',
  'Small Blind gibt keine Belohnung': 'Small Blind gives no reward',
  'Blind Ziele wachsen schneller': 'Blind targets grow faster',
  '-1 Discard pro Runde': '-1 Discard per round',
  'Blind Ziele wachsen noch schneller': 'Blind targets grow even faster',
  '-1 Hand Size': '-1 Hand Size',
  'Zinsen sind auf $3 gedeckelt': 'Interest is capped at $3',
  '-1 Hand pro Runde': '-1 Hand per round',
};

export default function patch() {
  // Die Objekte sind veränderlich (nur die Liste ist readonly), die Texte werden an Ort und Stelle ersetzt
  for (const b of SCALE_BANDS) b.name = BANDS_EN[b.name] ?? b.name;
  for (const f of SCALE_FEATURES) f.text = FEATURES_EN[f.text] ?? f.text;
}
