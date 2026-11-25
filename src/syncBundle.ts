/**
 * Spielstand Paket für Export, Import und Cloud Sync. Alles hier ist rein (kein DOM, kein Netz, kein
 * Speicher): Paket bauen, prüfen, als Text kodieren und Stände zusammenführen.
 *
 * Zusammenführen: Das Profil wächst nur (Zähler, Entdeckungen, Siege), deshalb gilt je Wert das
 * Maximum bzw. die Vereinigung. Haben zwei Geräte unabhängig voneinander gezählt, geht dabei ein Teil
 * der Zählung verloren, es wird aber nie doppelt gezählt (AUDIT O95). Der laufende Run lässt sich nicht
 * zusammenführen, hier entscheidet der Zeitstempel oder, bei verschiedenen Runs, die Nachfrage.
 */
import { SYNC } from './data/sync';
import { parseProfile, type DailyEntry, type Profile } from './profile';
import { SAVE_VERSION, type RunState } from './core/run';
import { mergeTrophyState } from './trophies';

export interface SyncBundle {
  format: number;
  exportedAt: number;
  profile: Profile | null;
  /** Schlüssel der entdeckten Atlas Einträge */
  collection: string[];
  /** laufender Run (roh, wird beim Laden migriert) */
  run: unknown | null;
  /** Zeitpunkt der letzten Run Speicherung (ms), 0 ohne Run */
  runAt: number;
  /** SAVE_VERSION des Runs, damit ältere Geräte einen neueren Run nicht anfassen */
  runVersion: number;
}

export function makeBundle(src: { profile: Profile | null; collection: string[]; run: RunState | null; runAt: number }, now: number): SyncBundle {
  return {
    format: SYNC.bundleFormat,
    exportedAt: now,
    profile: src.profile,
    collection: [...src.collection],
    run: src.run,
    runAt: src.run ? src.runAt : 0,
    runVersion: src.run ? SAVE_VERSION : 0,
  };
}

/** Prüft ein gelesenes Paket. Gibt null zurück, wenn es keins ist oder aus einer neueren Version stammt. */
export function parseBundle(raw: unknown): SyncBundle | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<SyncBundle>;
  if (o.format !== SYNC.bundleFormat) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const run = o.run && typeof o.run === 'object' ? o.run : null;
  return {
    format: SYNC.bundleFormat,
    exportedAt: num(o.exportedAt),
    profile: o.profile && typeof o.profile === 'object' ? parseProfile(o.profile) : null,
    collection: Array.isArray(o.collection) ? o.collection.filter((k): k is string => typeof k === 'string') : [],
    run,
    runAt: run ? num(o.runAt) : 0,
    runVersion: run ? num(o.runVersion) : 0,
  };
}

// ─────────────────────────────────────────────── Text Kodierung

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b = text.replace(/-/g, '+').replace(/_/g, '/');
  const s = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

export { toBase64Url, fromBase64Url };

/** Paket als einfügbarer Text (Kennung plus Base64) */
export function encodeBundle(b: SyncBundle): string {
  return SYNC.exportPrefix + toBase64Url(new TextEncoder().encode(JSON.stringify(b)));
}

/** Gegenstück zu `encodeBundle`. Nimmt auch reines JSON (die Export Datei). Gibt bei Fehlern null zurück. */
export function decodeBundle(text: string): SyncBundle | null {
  const t = text.trim();
  if (!t || t.length > SYNC.importMaxChars) return null;
  try {
    if (t.startsWith('{')) return parseBundle(JSON.parse(t));
    if (!t.startsWith(SYNC.exportPrefix)) return null;
    return parseBundle(JSON.parse(new TextDecoder().decode(fromBase64Url(t.slice(SYNC.exportPrefix.length)))));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────── Zusammenführen

function maxRec(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

/** Zeitstempel: der frühere Fund gilt */
function minRec(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? Math.min(out[k], v) : v;
  return out;
}

/** Führt zwei Profile zusammen (kommutativ bis auf `sync`, das vom Stand mit mehr Hands kommt) */
export function mergeProfiles(a: Profile, b: Profile): Profile {
  const out = parseProfile(JSON.parse(JSON.stringify(a)));
  for (const k of Object.keys(out.stats) as (keyof Profile['stats'])[]) out.stats[k] = Math.max(a.stats[k], b.stats[k]);
  out.created = Math.min(a.created, b.created);
  out.handCounts = maxRec(a.handCounts, b.handCounts);
  out.unlocked = minRec(a.unlocked, b.unlocked);
  out.winsByDeck = maxRec(a.winsByDeck, b.winsByDeck);
  out.winsByStake = maxRec(a.winsByStake, b.winsByStake);
  out.winsByDeckStake = maxRec(a.winsByDeckStake, b.winsByDeckStake);
  out.bestScale = Math.max(a.bestScale, b.bestScale);
  out.tutorialDone = a.tutorialDone || b.tutorialDone;
  out.tutorialOffered = a.tutorialOffered || b.tutorialOffered;
  const daily: Record<string, DailyEntry> = { ...a.daily };
  for (const [k, e] of Object.entries(b.daily)) {
    const x = daily[k];
    daily[k] = x ? { ante: Math.max(x.ante, e.ante), won: x.won || e.won, seed: x.seed, deckId: x.deckId } : e;
  }
  out.daily = daily;
  out.sync = b.stats.hands > a.stats.hands ? b.sync : a.sync;
  // Pokale: Maximum und Vereinigung, der Run Stand folgt wie `sync` dem Profil mit mehr Hands
  out.trophies = mergeTrophyState(a.trophies, b.trophies);
  out.trophies.run = JSON.parse(JSON.stringify((b.stats.hands > a.stats.hands ? b : a).trophies.run));
  return out;
}

/** Vereinigung ohne Duplikate */
export function mergeCollections(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

export type RunPick =
  | { kind: 'none' }
  | { kind: 'local' }
  | { kind: 'remote' }
  /** verschiedene Runs auf beiden Seiten, der Spieler muss wählen */
  | { kind: 'conflict' };

export interface RunSide {
  run: unknown | null;
  at: number;
  version: number;
}

function runId(run: unknown): string | null {
  return run && typeof run === 'object' && typeof (run as { runId?: unknown }).runId === 'string' ? (run as { runId: string }).runId : null;
}

/**
 * Welcher Run gilt? Nur eine Seite hat einen: dieser, außer die andere hat ihn später beendet. Derselbe Run auf beiden: der neuere. Verschiedene
 * Runs: Konflikt. Ein Run aus einer neueren Spielversion wird nie von einem älteren überschrieben.
 */
export function pickRun(local: RunSide, remote: RunSide): RunPick {
  if (!local.run && !remote.run) return { kind: 'none' };
  // Fehlt ein Run, gilt das als "Run beendet" ab `at`: wer später beendet hat, gewinnt
  if (!remote.run) return { kind: remote.at > local.at ? 'remote' : 'local' };
  if (!local.run) return { kind: local.at > remote.at ? 'local' : 'remote' };
  if (remote.version > SAVE_VERSION) return { kind: 'local' };
  if (local.version > remote.version) return { kind: 'local' };
  if (runId(local.run) !== null && runId(local.run) === runId(remote.run)) return { kind: remote.at > local.at ? 'remote' : 'local' };
  return { kind: 'conflict' };
}

/** Kurzbeschreibung eines Runs für den Konfliktdialog */
export function describeRun(run: unknown): { deckId: string; ante: number; blindIndex: number; money: number } | null {
  if (!run || typeof run !== 'object') return null;
  const r = run as Partial<RunState>;
  return { deckId: String(r.deckId ?? ''), ante: Number(r.ante ?? 0), blindIndex: Number(r.blindIndex ?? 0), money: Number(r.money ?? 0) };
}
