/**
 * Steuert den Cloud Abgleich im laufenden Spiel: Kopplung, Hintergrund Abgleich (nach lokalen Änderungen
 * verzögert, beim Verlassen der App sofort, beim Zurückkehren) und der Status für die Anzeige.
 * Ein Abgleich ersetzt den lokalen Run nur, wenn der Home Bildschirm offen ist (`canReplaceRun`).
 */
import { SYNC } from '../data/sync';
import { clearSyncState, CloudError, loadSyncState, saveSyncState, syncOnce, type SyncResult } from '../syncCloud';
import { generateCode, normalizeCode } from '../syncCrypto';
import { onLocalChange } from '../syncHooks';

export interface SyncHost {
  /** Nur am Home Bildschirm darf ein Cloud Run den lokalen ersetzen */
  canReplaceRun(): boolean;
  /** Der lokale Run wurde durch den Cloud Stand ersetzt: Anzeige neu aufbauen */
  onRunReplaced(): void;
}

export type SyncPhase = 'aus' | 'ok' | 'laeuft' | 'netz' | 'fehler' | 'konflikt' | 'wartet';

export class SyncManager {
  phase: SyncPhase = 'aus';
  message = '';
  private host: SyncHost | null = null;
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private dirty = false;

  init(host: SyncHost) {
    this.host = host;
    onLocalChange(() => this.schedule());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
      else void this.syncNow();
    });
    if (this.isCoupled()) {
      this.phase = 'ok';
      void this.syncNow();
    }
  }

  isCoupled(): boolean {
    return loadSyncState() !== null;
  }

  code(): string | null {
    return loadSyncState()?.code ?? null;
  }

  lastSync(): number {
    return loadSyncState()?.lastSync ?? 0;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private set(phase: SyncPhase, message = '') {
    this.phase = phase;
    this.message = message;
    for (const fn of [...this.listeners]) fn();
  }

  private schedule() {
    if (!this.isCoupled()) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.syncNow(), SYNC.pushDebounceMs);
  }

  private flush() {
    if (!this.isCoupled()) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    void this.syncNow();
  }

  /** Neuer Code für dieses Gerät, danach der erste Abgleich (lädt den lokalen Stand hoch) */
  async createCode(): Promise<string> {
    const code = generateCode();
    saveSyncState({ code, revs: { profile: 0, run: 0 }, lastSync: 0 });
    await this.syncNow();
    return code;
  }

  /** Vorhandenen Code eingeben: koppeln und zusammenführen. Bei zwei verschiedenen Runs kommt `conflict`. */
  async joinCode(input: string, onConflict?: 'local' | 'remote'): Promise<SyncResult | null> {
    saveSyncState({ code: normalizeCode(input), revs: { profile: 0, run: 0 }, lastSync: 0 });
    const r = await this.syncNow(onConflict);
    // Falscher Code (Daten nicht entschlüsselbar): Kopplung wieder lösen
    if (this.phase === 'fehler' && this.message.startsWith('Der Code passt nicht')) this.uncouple();
    return r;
  }

  uncouple() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    clearSyncState();
    this.set('aus');
  }

  /** Ein Abgleich. Gibt null zurück, wenn nicht gekoppelt, schon einer läuft oder ein Fehler auftrat. */
  async syncNow(onConflict?: 'local' | 'remote'): Promise<SyncResult | null> {
    if (!this.isCoupled()) return null;
    if (this.running) {
      this.dirty = true;
      return null;
    }
    this.running = true;
    this.set('laeuft');
    let result: SyncResult | null = null;
    try {
      result = await syncOnce({ onConflict, allowRunReplace: this.host?.canReplaceRun() ?? true });
      if (result.status === 'conflict') this.set('konflikt', 'Auf diesem Gerät und in der Cloud läuft ein anderer Run.');
      else if (result.runBlocked) this.set('wartet', 'In der Cloud liegt ein neuerer Run. Er wird am Home Bildschirm geladen.');
      else this.set('ok');
      if (result?.status === 'ok' && result.runReplaced) this.host?.onRunReplaced();
    } catch (e) {
      if (e instanceof CloudError) this.set(e.reason === 'netz' ? 'netz' : 'fehler', e.reason === 'code' ? 'Der Code passt nicht zu den Daten.' : e.message);
      else this.set('fehler', 'Unbekannter Fehler beim Abgleich.');
    } finally {
      this.running = false;
    }
    if (this.dirty) {
      this.dirty = false;
      void this.syncNow();
    }
    return result;
  }
}

export const syncManager = new SyncManager();
