import { recordRun } from './collection';
import { SAVE_VERSION, defaultRules, isRoundWon, newRunStats, type RunState } from './core/run';
import { enterAnte } from './core/game';
import { RngStreams } from './core/rng';
import { notifyChange } from './syncHooks';

const KEY = 'alatro.run.v1';
/** Zeitpunkt der letzten Speicherung des Runs (ms), für den Abgleich zwischen Geräten */
const AT_KEY = 'alatro.run.at.v1';

export function saveRun(run: RunState | null) {
  try {
    if (run) {
      localStorage.setItem(KEY, JSON.stringify(run));
      localStorage.setItem(AT_KEY, String(Date.now()));
      recordRun(run);
      notifyChange('run');
    } else {
      localStorage.removeItem(KEY);
      // Zeitpunkt des Beendens bleibt, damit der Sync einen beendeten Run nicht wieder herstellt
      localStorage.setItem(AT_KEY, String(Date.now()));
      notifyChange('run');
    }
  } catch {
    /* Speicher nicht verfügbar */
  }
}

/**
 * Migration älterer Spielstände.
 * Version 1: ein globaler Zufallszustand (rngState), keine Regeln, keine Hand Statistik.
 * Version 3: Spielstand vor den Consumables (M4).
 * Version 4: Spielstand vor Schwierigkeitsstufen, Tageslauf und Run Zählern (Version 5).
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
  if (raw.version === 2) {
    // Version 2: kein Zustandsautomat, kein Shop, keine Bosse, Decks oder Stakes
    raw.rules = { ...defaultRules(), ...raw.rules };
    raw.winShown = raw.won ?? false;
    raw.deckId = 'nachthimmel';
    raw.stakeId = 'daemmerung';
    raw.vouchers = [];
    raw.pendingTags = [];
    raw.skips = 0;
    raw.bossesSeen = [];
    raw.anteBoss = null;
    raw.anteTags = null;
    raw.anteVoucher = null;
    raw.shop = null;
    raw.pack = null;
    raw.shopsVisited = 1;
    raw.nextCardId = Math.max(52, ...(raw.deck ?? []).map((c: { id: number }) => c.id)) + 1;
    if (raw.round) {
      raw.round.handSize = raw.round.handSize ?? raw.handSize;
      raw.round.playedTypes = raw.round.playedTypes ?? [];
    }
    raw.version = 3;
    raw.phase = 'blindSelect';
    if (raw.round) raw.phase = isRoundWon(raw) ? 'roundWon' : 'round';
    enterAnte(raw);
  }
  if (raw.version === 3) {
    // Version 3: keine Consumables, keine Shop Typ Gewichte, keine Sternbild Regel
    raw.consumables = [];
    raw.rules = { ...defaultRules(), ...raw.rules };
    raw.version = 4;
  }
  if (raw.version === 4) {
    // Version 4: keine skalierende Schwierigkeit, kein Tageslauf, keine Run Zähler
    raw.runId = `${raw.seed}-alt`;
    raw.difficulty = null;
    raw.daily = null;
    raw.twistId = null;
    raw.stats = newRunStats();
    raw.version = 5;
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

/** Zeitpunkt der letzten Run Speicherung, 0 wenn unbekannt */
export function loadRunAt(): number {
  try {
    const n = Number(localStorage.getItem(AT_KEY));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Setzt den Zeitpunkt (nach einem Import oder Sync, damit der Abgleich den fremden Stand kennt) */
export function setRunAt(at: number) {
  try {
    localStorage.setItem(AT_KEY, String(at));
  } catch {
    /* Speicher nicht verfügbar */
  }
}
