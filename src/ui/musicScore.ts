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

  const count = m.notes[0] + Math.floor(rng() * (m.notes[1] - m.notes[0] + 1));
  const bells: BellNote[] = [];
  let prev = pool[Math.floor(rng() * pool.length)].n;
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
