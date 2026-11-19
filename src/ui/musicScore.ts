import type { TrackDef } from '../data/music';

// Reine Komposition der Hintergrundmusik, ohne WebAudio und ohne DOM.
// Ein Abschnitt entspricht einem Akkord. Er hängt nur vom Stück, vom Index und vom Seed ab,
// darum klingt dieselbe Eingabe immer gleich (wichtig für Tests und Hörproben).

/** Kleiner, schneller Zufallsgenerator mit Seed (nur für Musik, nicht für das Spiel) */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function noteFreq(root: number, semis: number): number {
  return root * Math.pow(2, semis / 12);
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

export interface BellNote {
  /** Sekunden nach Beginn des Abschnitts */
  t: number;
  freq: number;
  gain: number;
  /** -1 links bis 1 rechts */
  pan: number;
}

export interface Segment {
  /** Frequenzen der Fläche */
  chord: number[];
  bells: BellNote[];
}

export function composeSegment(track: TrackDef, index: number, seed: number): Segment {
  const rng = mulberry32((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const n = track.chords.length;
  const semis = track.chords[((index % n) + n) % n];
  const m = track.melody;

  const chordClasses = new Set(semis.map(mod12));
  const scaleClasses = new Set(m.scale.map(mod12));
  const pool: { n: number; tone: boolean }[] = [];
  for (let s = m.low; s <= m.high; s++) {
    const tone = chordClasses.has(mod12(s));
    if (tone || scaleClasses.has(mod12(s))) pool.push({ n: s, tone });
  }

  let count = m.notes[0] + Math.floor(rng() * (m.notes[1] - m.notes[0] + 1));
  // Ruhiger Akkord: nur halb so viele Glocken, die Musik atmet
  if (rng() < m.rest) count = Math.max(1, Math.floor(count / 2));
  const bells: BellNote[] = [];
  // Start in der Mitte des Tonraums, damit die Melodie nicht von Akkord zu Akkord springt
  const target = (m.low + m.high) / 2 + (rng() * 8 - 4);
  let prev = pool.reduce((best, p) => (Math.abs(p.n - target) < Math.abs(best.n - target) ? p : best)).n;
  for (let i = 0; i < count; i++) {
    // Zeit: ein Platz pro Glocke, darin zufällig verschoben, so entsteht kein Raster
    const t = ((i + 0.15 + 0.7 * rng()) * track.chordSec) / count;
    // Tonhöhe: bevorzugt Akkordtöne und kleine Sprünge
    let total = 0;
    const weights = pool.map((p) => {
      if (p.n === prev) return 0;
      const w = (p.tone ? m.chordBias : 1 - m.chordBias + 0.05) * Math.exp(-Math.abs(p.n - prev) / m.leap);
      total += w;
      return w;
    });
    let pick = rng() * total;
    let at = 0;
    for (let k = 0; k < pool.length; k++) {
      pick -= weights[k];
      if (pick <= 0) {
        at = k;
        break;
      }
    }
    prev = pool[at].n;
    const gain = m.gain * (0.55 + 0.45 * rng());
    const pan = (rng() * 2 - 1) * m.pan;
    bells.push({ t, freq: noteFreq(track.root, prev), gain, pan });
    if (rng() < m.pairs) {
      const step = (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * 2));
      const nb = pool[Math.max(0, Math.min(pool.length - 1, at + step))];
      bells.push({ t: t + 0.22 + 0.25 * rng(), freq: noteFreq(track.root, nb.n), gain: gain * 0.65, pan });
    }
  }
  bells.sort((a, b) => a.t - b.t);
  return { chord: semis.map((s) => noteFreq(track.root, s)), bells };
}

export interface PlanItem {
  track: TrackDef;
  /** Akkord Index innerhalb des Aufenthalts */
  index: number;
  /** Beginn des Abschnitts im Takt der Audiouhr (Sekunden) */
  time: number;
  /** Ein neues Stück beginnt hier (beim Mix: Überblendung) */
  first: boolean;
  /** Wievielter Aufenthalt, für einen eigenen Seed pro Stück und Runde */
  stay: number;
}

/**
 * Plant der Reihe nach alle Abschnitte. Mit einem Stück läuft es endlos im Kreis, mit mehreren
 * (Mix) bleibt jedes `chords` Akkorde lang und das nächste übernimmt. Reihenfolge fest, Start wählbar.
 */
export class MusicPlanner {
  private idx: number;
  private seg = 0;
  private stay = 0;
  private started = false;
  /** Beginn des nächsten Abschnitts */
  time: number;

  constructor(private tracks: readonly TrackDef[], startTime: number, private chords: number, startIdx = 0) {
    this.time = startTime;
    this.idx = ((startIdx % tracks.length) + tracks.length) % tracks.length;
  }

  step(): PlanItem {
    let first = false;
    if (!this.started) {
      this.started = true;
      first = true;
    } else if (this.tracks.length > 1 && this.seg >= this.chords) {
      this.idx = (this.idx + 1) % this.tracks.length;
      this.seg = 0;
      this.stay++;
      first = true;
    }
    const track = this.tracks[this.idx];
    const item: PlanItem = { track, index: this.seg, time: this.time, first, stay: this.stay };
    this.time += track.chordSec;
    this.seg++;
    return item;
  }
}
