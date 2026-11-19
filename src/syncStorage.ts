/**
 * Verbindung zwischen Paket (`syncBundle.ts`) und Browser Speicher: Paket aus dem aktuellen Stand
 * bauen und ein fremdes Paket einarbeiten. Kein DOM, kein Netz.
 */
import { SAVE_VERSION } from './core/run';
import { loadDiscovered, saveDiscovered } from './collection';
import { getProfile, replaceProfile } from './profile';
import { loadRun, loadRunAt, migrateRun, saveRun, setRunAt } from './save';
import { makeBundle, mergeCollections, mergeProfiles, pickRun, type RunPick, type SyncBundle } from './syncBundle';

export function currentBundle(now = Date.now()): SyncBundle {
  return makeBundle({ profile: getProfile(), collection: loadDiscovered(), run: loadRun(), runAt: loadRunAt() }, now);
}

export interface ApplyResult {
  pick: RunPick['kind'];
  /** der gewählte Run wurde übernommen */
  runReplaced: boolean;
}

/** Läuft ein Konflikt, kann der Aufrufer vorab mit `previewRun` fragen und die Wahl hier übergeben */
export function previewRun(remote: SyncBundle): RunPick {
  const local = loadRun();
  return pickRun({ run: local, at: loadRunAt(), version: local ? SAVE_VERSION : 0 }, { run: remote.run, at: remote.runAt, version: remote.runVersion });
}

/**
 * Arbeitet ein fremdes Paket ein: Profil und Sammlung werden zusammengeführt, der Run nach `pickRun`.
 * Bei einem Konflikt entscheidet `onConflict` (Standard: lokalen Run behalten, nichts geht verloren).
 */
export function applyBundle(remote: SyncBundle, onConflict: 'local' | 'remote' = 'local'): ApplyResult {
  if (remote.profile) replaceProfile(mergeProfiles(getProfile(), remote.profile));
  saveDiscovered(mergeCollections(loadDiscovered(), remote.collection));
  const decision = previewRun(remote);
  const use = decision.kind === 'conflict' ? onConflict : decision.kind;
  if (use === 'remote') {
    const migrated = migrateRun(remote.run);
    if (migrated) {
      saveRun(migrated);
      setRunAt(remote.runAt);
      return { pick: decision.kind, runReplaced: true };
    }
  }
  return { pick: decision.kind, runReplaced: false };
}
