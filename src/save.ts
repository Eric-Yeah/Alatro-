import { SAVE_VERSION, defaultRules, type RunState } from './core/run';
import { RngStreams } from './core/rng';

const KEY = 'alatro.run.v1';

export function saveRun(run: RunState | null) {
  try {
    if (run) localStorage.setItem(KEY, JSON.stringify(run));
    else localStorage.removeItem(KEY);
  } catch {
    /* Speicher nicht verfügbar */
  }
}

/**
 * Migration älterer Spielstände.
 * Version 1: ein globaler Zufallszustand (rngState), keine Regeln, keine Hand Statistik.
 */
export function migrateRun(raw: any): RunState | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw.version ?? 1;
  if (v < 2) {
    raw.rng = RngStreams.create(raw.seed ?? 'MIGRATED').data;
    delete raw.rngState;
    raw.rules = defaultRules();
    raw.consumableSlots = raw.consumableSlots ?? 2;
    raw.handsPlayed = Object.fromEntries(Object.keys(raw.handLevels ?? {}).map((k) => [k, 0]));
    raw.version = 2;
  }
  if (raw.version !== SAVE_VERSION) return null;
  return raw as RunState;
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrateRun(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
