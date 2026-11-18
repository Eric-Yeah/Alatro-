/** Deterministischer, serialisierbarer Zufall (mulberry32). Gleicher Seed ergibt gleichen Run. */
export class Rng {
  constructor(public state: number) {}

  static fromSeed(seed: string): Rng {
    return new Rng(hashString(seed));
  }

  /** Zahl in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }

  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
}

export function hashString(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Ein Zufallsstrom pro Key (Briefing 7.2). Der Zustand eines Keys entsteht beim ersten
 * Gebrauch aus hash(seed + key). Quellen beeinflussen sich dadurch nicht gegenseitig.
 */
export interface RngStreamsState {
  seed: string;
  states: Record<string, number>;
}

export class RngStreams {
  constructor(public readonly data: RngStreamsState) {}

  static create(seed: string): RngStreams {
    return new RngStreams({ seed, states: {} });
  }

  private stream(key: string): Rng {
    const s = this.data.states[key];
    return new Rng(s === undefined ? hashString(this.data.seed + '|' + key) : s);
  }

  private use<T>(key: string, fn: (r: Rng) => T): T {
    const r = this.stream(key);
    const out = fn(r);
    this.data.states[key] = r.state;
    return out;
  }

  next(key: string): number {
    return this.use(key, (r) => r.next());
  }

  int(key: string, maxExclusive: number): number {
    return this.use(key, (r) => r.int(maxExclusive));
  }

  pick<T>(key: string, items: readonly T[]): T {
    return this.use(key, (r) => r.pick(items));
  }

  shuffle<T>(key: string, items: T[]): T[] {
    return this.use(key, (r) => r.shuffle(items));
  }

  /** Gewichtete Auswahl. Gewichte 0 werden nie gezogen. */
  weighted<T extends string>(key: string, weights: Record<T, number>): T {
    const entries = (Object.entries(weights) as [T, number][]).filter(([, w]) => w > 0);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let roll = this.next(key) * total;
    for (const [k, w] of entries) {
      if (roll < w) return k;
      roll -= w;
    }
    return entries[entries.length - 1][0];
  }

  /**
   * "num in den" Chance (Briefing 7.2). probMult verdoppelt pro Quelle die Chance
   * (Offener Punkt O11). Ergebnis true, wenn Wurf < min(1, num * probMult / den).
   */
  chance(num: number, den: number, key: string, probMult = 1): boolean {
    return this.next(key) < Math.min(1, (num * probMult) / den);
  }
}

const SEED_CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
export const SEED_LENGTH = 8;

/** Zufälliger Seed ohne O und 0 (Briefing 7.1). */
export function randomSeed(): string {
  let s = '';
  for (let i = 0; i < SEED_LENGTH; i++) s += SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)];
  return s;
}

/** Eingabe normalisieren: Großbuchstaben, nur A bis Z und Ziffern, O gilt als 0, max. 8 Zeichen. */
export function normalizeSeed(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').slice(0, SEED_LENGTH);
}
