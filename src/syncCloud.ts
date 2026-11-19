/**
 * Cloud Abgleich über Supabase (nur `fetch`, kein SDK). Der Server kennt nur `syncId` und Chiffretext.
 * Zwei Einträge: `profile` (Profil und Sammlung) und `run` (laufender Run oder sein Ende als Zeitstempel).
 * Ablauf von `syncOnce`: lesen, lokal zusammenführen, nur Geändertes hochladen. Hat zwischen Lesen und
 * Schreiben ein anderes Gerät geschrieben (Revision weicht ab), beginnt der Ablauf von vorn.
 */
import { loadDiscovered, saveDiscovered } from './collection';
import { SAVE_VERSION } from './core/run';
import { SYNC } from './data/sync';
import { getProfile, replaceProfile } from './profile';
import { loadRun, loadRunAt, migrateRun, saveRun, setRunAt } from './save';
import { mergeCollections, mergeProfiles, parseBundle, pickRun, describeRun } from './syncBundle';
import { decryptText, encryptText, isValidCode, normalizeCode, syncId } from './syncCrypto';

const STATE_KEY = 'alatro.sync.v1';

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

/** Fehler mit lesbarem Grund für die Anzeige */
export class CloudError extends Error {
  constructor(public reason: 'netz' | 'server' | 'code' | 'version', message: string) {
    super(message);
  }
}

// ─────────────────────────────────────────────── Kopplungs Zustand (pro Gerät)

export interface SyncState {
  code: string;
  revs: { profile: number; run: number };
  lastSync: number;
}

export function loadSyncState(): SyncState | null {
  try {
    const raw = JSON.parse(localStorage.getItem(STATE_KEY) ?? 'null');
    if (!raw || typeof raw.code !== 'string' || !isValidCode(raw.code)) return null;
    const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    return { code: normalizeCode(raw.code), revs: { profile: n(raw.revs?.profile), run: n(raw.revs?.run) }, lastSync: n(raw.lastSync) };
  } catch {
    return null;
  }
}

export function saveSyncState(s: SyncState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    /* Speicher nicht verfügbar */
  }
}

export function clearSyncState() {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    /* Speicher nicht verfügbar */
  }
}

// ─────────────────────────────────────────────── Anfragen

interface CloudRow {
  payload: string;
  version: number;
  rev: number;
}

async function rpc(name: string, body: unknown, f: Fetcher): Promise<unknown> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), SYNC.requestTimeoutMs);
  try {
    const res = await f(`${SYNC.cloudUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: SYNC.cloudKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    if (!res.ok) throw new CloudError('server', `Server antwortet mit ${res.status}`);
    return await res.json();
  } catch (e) {
    if (e instanceof CloudError) throw e;
    throw new CloudError('netz', 'Keine Verbindung');
  } finally {
    clearTimeout(timer);
  }
}

export async function cloudPull(id: string, f: Fetcher): Promise<Record<string, CloudRow>> {
  const rows = (await rpc('sync_pull', { p_id: id }, f)) as { key: string; payload: string; save_version: number; rev: number }[];
  const out: Record<string, CloudRow> = {};
  if (Array.isArray(rows)) for (const r of rows) out[r.key] = { payload: r.payload, version: r.save_version, rev: Number(r.rev) };
  return out;
}

export async function cloudPush(id: string, key: string, payload: string, version: number, baseRev: number, f: Fetcher): Promise<{ ok: boolean; rev: number }> {
  const r = (await rpc('sync_push', { p_id: id, p_key: key, p_payload: payload, p_version: version, p_base_rev: baseRev }, f)) as { ok?: boolean; rev?: number; error?: string };
  if (r?.ok) return { ok: true, rev: Number(r.rev) };
  if (r?.error === 'conflict') return { ok: false, rev: Number(r.rev) };
  throw new CloudError('server', 'Server hat den Stand abgelehnt');
}

// ─────────────────────────────────────────────── Abgleich

export interface RunSummary {
  ante: number;
  blindIndex: number;
  money: number;
}

export type SyncResult =
  | { status: 'ok'; changedLocal: boolean; pushed: boolean; runReplaced: boolean; runBlocked: boolean }
  /** Auf beiden Seiten läuft ein anderer Run: der Aufrufer fragt und ruft `syncOnce` mit der Wahl erneut auf */
  | { status: 'conflict'; local: RunSummary | null; remote: RunSummary | null };

interface ProfilePart {
  profile: ReturnType<typeof getProfile>;
  collection: string[];
}
interface RunPart {
  run: unknown | null;
  runAt: number;
  runVersion: number;
}

async function readPart<T>(code: string, row: CloudRow | undefined): Promise<T | null> {
  if (!row || row.payload === '') return null;
  const text = await decryptText(code, row.payload);
  if (text === null) throw new CloudError('code', 'Der Code passt nicht zu den Daten');
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new CloudError('server', 'Cloud Daten sind beschädigt');
  }
}

/**
 * Ein Abgleich. `onConflict`: bei zwei verschiedenen Runs 'ask' (Ergebnis conflict), sonst die Wahl.
 * `allowRunReplace: false` (während einer laufenden Runde) lässt den lokalen Run immer unberührt und meldet
 * `runBlocked`, wenn die Cloud einen neueren hätte.
 */
export async function syncOnce(opts: { fetcher?: Fetcher; onConflict?: 'ask' | 'local' | 'remote'; state?: SyncState; allowRunReplace?: boolean } = {}): Promise<SyncResult> {
  const f: Fetcher = opts.fetcher ?? ((i, o) => fetch(i, o));
  const state = opts.state ?? loadSyncState();
  if (!state) throw new CloudError('code', 'Nicht gekoppelt');
  const id = await syncId(state.code);
  let changedLocal = false;
  let pushed = false;
  let runReplaced = false;
  let runBlocked = false;
  const allowReplace = opts.allowRunReplace !== false;

  for (let attempt = 0; attempt < SYNC.conflictRetries; attempt++) {
    const rows = await cloudPull(id, f);

    // Profil und Sammlung: zusammenführen, nur bei Abweichung hochladen
    const remoteP = await readPart<ProfilePart>(state.code, rows.profile);
    const remoteProfile = remoteP ? parseBundle({ format: SYNC.bundleFormat, profile: remoteP.profile, collection: remoteP.collection }) : null;
    const localProfile = getProfile();
    const localColl = loadDiscovered();
    const mergedProfile = remoteProfile?.profile ? mergeProfiles(localProfile, remoteProfile.profile) : localProfile;
    const mergedColl = mergeCollections(localColl, remoteProfile?.collection ?? []);
    if (JSON.stringify(mergedProfile) !== JSON.stringify(localProfile)) {
      replaceProfile(mergedProfile);
      changedLocal = true;
    }
    if (mergedColl.length !== localColl.length) {
      saveDiscovered(mergedColl);
      changedLocal = true;
    }
    const profileDiffers =
      !remoteProfile?.profile || JSON.stringify(remoteProfile.profile) !== JSON.stringify(mergedProfile) || remoteProfile.collection.length !== mergedColl.length;

    // Run: nach Zeitstempel, bei zwei verschiedenen Runs Rückfrage
    const remoteR = await readPart<RunPart>(state.code, rows.run);
    const localRun = loadRun();
    const localAt = loadRunAt();
    const remoteSide = { run: remoteR?.run ?? null, at: remoteR?.runAt ?? 0, version: remoteR?.runVersion ?? 0 };
    const decision = pickRun({ run: localRun, at: localAt, version: localRun ? SAVE_VERSION : 0 }, remoteSide);
    let use: 'none' | 'local' | 'remote';
    if (decision.kind === 'conflict') {
      const choice = opts.onConflict ?? 'ask';
      if (choice === 'ask') return { status: 'conflict', local: summary(localRun), remote: summary(remoteSide.run) };
      use = choice;
    } else use = decision.kind;

    let pushRun = false;
    if (use === 'remote' && !allowReplace) {
      runBlocked = true;
      use = 'none';
    }
    if (use === 'remote') {
      if (remoteSide.run === null) {
        saveRun(null);
        setRunAt(remoteSide.at);
        changedLocal = true;
        runReplaced = true;
      } else {
        const migrated = migrateRun(remoteSide.run);
        if (migrated) {
          saveRun(migrated);
          setRunAt(remoteSide.at);
          changedLocal = true;
          runReplaced = true;
        }
      }
    } else if (use === 'local') {
      // Gewählter lokaler Run (oder sein Ende) fehlt in der Cloud oder ist dort älter
      pushRun = !remoteR || remoteSide.at !== loadRunAt() || (remoteSide.run === null) !== (localRun === null);
    }

    let raced = false;
    if (profileDiffers) {
      const part: ProfilePart = { profile: mergedProfile, collection: mergedColl };
      const r = await cloudPush(id, 'profile', await encryptText(state.code, JSON.stringify(part)), SAVE_VERSION, rows.profile?.rev ?? 0, f);
      if (r.ok) {
        state.revs.profile = r.rev;
        pushed = true;
      } else raced = true;
    } else state.revs.profile = rows.profile?.rev ?? 0;

    if (!raced && pushRun) {
      const at = loadRunAt();
      const part: RunPart = { run: localRun, runAt: at, runVersion: localRun ? SAVE_VERSION : 0 };
      const r = await cloudPush(id, 'run', await encryptText(state.code, JSON.stringify(part)), SAVE_VERSION, rows.run?.rev ?? 0, f);
      if (r.ok) {
        state.revs.run = r.rev;
        pushed = true;
      } else raced = true;
    } else if (!pushRun) state.revs.run = rows.run?.rev ?? 0;

    if (!raced) {
      state.lastSync = Date.now();
      saveSyncState(state);
      return { status: 'ok', changedLocal, pushed, runReplaced, runBlocked };
    }
  }
  throw new CloudError('server', 'Zu viele gleichzeitige Änderungen, bitte später erneut versuchen');
}

function summary(run: unknown): RunSummary | null {
  const d = describeRun(run);
  return d ? { ante: d.ante, blindIndex: d.blindIndex, money: d.money } : null;
}
