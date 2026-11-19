/**
 * Hintergrundmusik: alle Zahlen und Stücke. Reine Synthese (WebAudio), keine Audiodateien.
 * Jedes Stück ist ein Kreislauf aus Akkorden. Darüber liegen weiche Flächen (Pad), vereinzelte Glockentöne
 * zu zufälligen Zeitpunkten (kein Takt, kein Beat) und ein leiser Hauch. Es gibt keinen Bass,
 * der tiefste Ton liegt über `MUSIC.minFreq`.
 */

export const MUSIC = {
  /** Wie weit im Voraus der nächste Abschnitt geplant wird (Sekunden) */
  lookaheadSec: 3,
  /** Takt des Planers (Millisekunden) */
  tickMs: 500,
  fadeInSec: 4,
  fadeOutSec: 1.5,
  /** Umrechnung der Musiklautstärke (0 bis 1) in den Pegel */
  gainScale: 0.8,
  /** Tiefster erlaubter Ton in Hz, damit keine Bässe entstehen */
  minFreq: 140,
  /** Längste Kurzbeschreibung in Zeichen */
  infoMax: 38,
  /** Länge der Abschnitte beim Rendern einer Hörprobe (Sekunden) */
  previewSec: 76,
} as const;

export type BellKind = 'glas' | 'spieluhr' | 'schale';

/**
 * Klangfarbe der Glocken. Teiltöne als [Frequenzverhältnis, Pegel, Abklingfaktor].
 * `beat` ist ein Hz Abstand für einen zweiten Grundton, der leise schwebt (Klangschale).
 */
export const BELLS: Record<BellKind, { attack: number; beat: number; partials: readonly (readonly [number, number, number])[] }> = {
  glas: { attack: 0.02, beat: 0, partials: [[1, 1, 1], [2, 0.3, 0.6], [2.76, 0.2, 0.4], [5.4, 0.07, 0.2]] },
  spieluhr: { attack: 0.004, beat: 0, partials: [[1, 1, 1], [3, 0.28, 0.5], [6.1, 0.1, 0.25]] },
  schale: { attack: 0.18, beat: 1.4, partials: [[1, 1, 1], [2.71, 0.35, 0.7], [5.1, 0.12, 0.4]] },
};

export interface TrackDef {
  id: string;
  name: string;
  /** Kurzbeschreibung für die Optionen (höchstens `MUSIC.infoMax` Zeichen, sonst läuft sie unter den Knopf) */
  info: string;
  /** Grundton in Hz, alle Halbtonangaben beziehen sich darauf */
  root: number;
  /** Akkorde als Halbtonabstände zum Grundton, der Kreislauf läuft der Reihe nach durch */
  chords: readonly (readonly number[])[];
  /** Dauer eines Akkords in Sekunden */
  chordSec: number;
  pad: {
    wave: OscillatorType;
    /** Stimmen pro Ton, leicht gegeneinander verstimmt */
    voices: number;
    /** Verstimmung in Cent zwischen den Stimmen */
    detune: number;
    lowpass: number;
    /** langsame Bewegung des Filters (Hz und Tiefe in Hz Filterfrequenz) */
    lfoHz: number;
    lfoDepth: number;
    attack: number;
    release: number;
    gain: number;
  };
  melody: {
    kind: BellKind;
    /** Tonleiter in Halbtönen, Akkordtöne kommen immer dazu */
    scale: readonly number[];
    /** Tonraum in Halbtönen über dem Grundton */
    low: number;
    high: number;
    /** Anzahl Glocken pro Akkord (von, bis) */
    notes: readonly [number, number];
    gain: number;
    /** Klingzeit des Grundtons in Sekunden */
    decay: number;
    /** Wahrscheinlichkeit, einen Akkordton zu wählen (0 bis 1) */
    chordBias: number;
    /** Bevorzugte Sprungweite in Halbtönen */
    leap: number;
    /** Wahrscheinlichkeit für einen zweiten Ton kurz nach der Glocke */
    pairs: number;
    /** Breite im Stereobild (0 bis 1) */
    pan: number;
  };
  /** Leiser Hauch (gefiltertes Rauschen), null für keinen */
  air: { gain: number; freq: number; q: number } | null;
  reverb: { seconds: number; decay: number; wet: number };
  echo: { time: number; feedback: number; wet: number };
  /** Pegelangleich zwischen den Stücken */
  level: number;
}

export const TRACKS: readonly TrackDef[] = [
  {
    id: 'sternenglas',
    name: 'Sternenglas',
    info: 'Helle Glasklänge, ruhig und weit',
    root: 293.66, // D4
    chords: [
      [-5, 0, 4, 7, 11, 14], // Dmaj9
      [-3, 4, 7, 11, 12], // Hm9
      [-7, 0, 4, 9, 11], // Gmaj7 mit #11
      [-5, 2, 7, 9, 12], // A sus mit 9
    ],
    chordSec: 14,
    pad: { wave: 'triangle', voices: 2, detune: 6, lowpass: 1400, lfoHz: 0.07, lfoDepth: 300, attack: 4.5, release: 4.5, gain: 0.16 },
    melody: { kind: 'glas', scale: [0, 2, 4, 6, 7, 9, 11], low: 12, high: 31, notes: [4, 7], gain: 0.12, decay: 4.5, chordBias: 0.65, leap: 5, pairs: 0.2, pan: 0.7 },
    air: { gain: 0.02, freq: 3000, q: 0.7 },
    reverb: { seconds: 5, decay: 2.2, wet: 0.9 },
    echo: { time: 0.63, feedback: 0.38, wet: 0.22 },
    level: 1.29,
  },
  {
    id: 'mondlabor',
    name: 'Mondlabor',
    info: 'Ferne Spieluhr, dunkel, geheimnisvoll',
    root: 220, // A3
    chords: [
      [0, 7, 12, 14, 15], // Am mit 9
      [-4, 3, 7, 12, 15], // Fmaj7
      [-5, 2, 5, 11, 14], // E7
      [-7, 0, 3, 8, 10], // Dm7 mit 11
    ],
    chordSec: 16,
    pad: { wave: 'sawtooth', voices: 2, detune: 9, lowpass: 650, lfoHz: 0.05, lfoDepth: 250, attack: 5, release: 5, gain: 0.1 },
    melody: { kind: 'spieluhr', scale: [0, 2, 3, 5, 7, 8, 11], low: 15, high: 36, notes: [5, 9], gain: 0.1, decay: 1.6, chordBias: 0.55, leap: 4, pairs: 0.4, pan: 0.8 },
    air: { gain: 0.03, freq: 1400, q: 1.2 },
    reverb: { seconds: 4, decay: 2.5, wet: 0.8 },
    echo: { time: 0.47, feedback: 0.45, wet: 0.3 },
    level: 2.85,
  },
  {
    id: 'sphaerenklang',
    name: 'Sphärenklang',
    info: 'Tiefe Quinten und Klangschalen',
    root: 174.61, // F3
    chords: [
      [0, 7, 14, 21], // gestapelte Quinten auf F
      [2, 9, 16, 21], // auf G
      [-2, 5, 12, 19], // auf Es
      [3, 10, 17, 24], // auf As
    ],
    chordSec: 18,
    pad: { wave: 'triangle', voices: 2, detune: 4, lowpass: 900, lfoHz: 0.04, lfoDepth: 200, attack: 6, release: 6, gain: 0.14 },
    melody: { kind: 'schale', scale: [0, 2, 5, 7, 10], low: 12, high: 31, notes: [2, 4], gain: 0.16, decay: 8, chordBias: 0.8, leap: 7, pairs: 0.1, pan: 0.5 },
    air: { gain: 0.04, freq: 700, q: 0.9 },
    reverb: { seconds: 6, decay: 2, wet: 1 },
    echo: { time: 0.8, feedback: 0.3, wet: 0.15 },
    level: 0.97,
  },
];

export const TRACK_IDS: readonly string[] = TRACKS.map((t) => t.id);

export function getTrack(id: string): TrackDef | undefined {
  return TRACKS.find((t) => t.id === id);
}

/** Wert der Option "Musik" wenn nichts spielen soll */
export const MUSIC_OFF = 'aus';
