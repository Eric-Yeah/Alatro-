import './core/index';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRun } from './core/game';
import { getProfile, saveProfile, setProfileForTest } from './profile';
import { loadRun, saveRun } from './save';
import { loadDiscovered, saveDiscovered } from './collection';
import { generateCode } from './syncCrypto';
import { CloudError, loadSyncState, saveSyncState, syncOnce, type Fetcher, type SyncState } from './syncCloud';

/** Nachbau von docs/sync.sql: gleiche Regeln für sync_pull und sync_push */
function fakeServer() {
  const rows = new Map<string, { payload: string; version: number; rev: number }>();
  let beforePush: (() => void) | null = null;
  const fetcher: Fetcher = async (url, init) => {
    const body = JSON.parse(String(init?.body ?? '{}'));
    const respond = (v: unknown) => new Response(JSON.stringify(v), { status: 200 });
    if (url.endsWith('/rpc/sync_pull')) {
      const out = [...rows.entries()]
        .filter(([k]) => k.startsWith(`${body.p_id}|`))
        .map(([k, r]) => ({ key: k.split('|')[1], payload: r.payload, save_version: r.version, rev: r.rev }));
      return respond(out);
    }
    if (url.endsWith('/rpc/sync_push')) {
      if (beforePush) {
        const fn = beforePush;
        beforePush = null;
        fn();
      }
      if (!/^[0-9a-f]{64}$/.test(body.p_id) || !['profile', 'run'].includes(body.p_key)) return respond({ ok: false, error: 'invalid' });
      const k = `${body.p_id}|${body.p_key}`;
      const cur = rows.get(k);
      if (!cur) {
        if (body.p_base_rev !== 0) return respond({ ok: false, error: 'conflict', rev: 0 });
        rows.set(k, { payload: body.p_payload, version: body.p_version, rev: 1 });
        return respond({ ok: true, rev: 1 });
      }
      if (cur.rev !== body.p_base_rev) return respond({ ok: false, error: 'conflict', rev: cur.rev });
      rows.set(k, { payload: body.p_payload, version: body.p_version, rev: cur.rev + 1 });
      return respond({ ok: true, rev: cur.rev + 1 });
    }
    return new Response('nicht gefunden', { status: 404 });
  };
  return { fetcher, rows, onNextPush: (fn: () => void) => (beforePush = fn) };
}

/** Ein simuliertes Gerät: eigener Browser Speicher */
function device() {
  const m = new Map<string, string>();
  const storage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0,
  } as Storage;
  return {
    use() {
      (globalThis as unknown as { localStorage: Storage }).localStorage = storage;
      setProfileForTest(null);
    },
  };
}

let now = 1_000_000;
const tick = () => vi.setSystemTime((now += 10_000));

describe('Cloud Abgleich mit zwei Geräten', () => {
  let ipad: ReturnType<typeof device>;
  let mac: ReturnType<typeof device>;
  let srv: ReturnType<typeof fakeServer>;
  let code: string;
  const state = (): SyncState => ({ code, revs: { profile: 0, run: 0 }, lastSync: 0 });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    tick();
    ipad = device();
    mac = device();
    srv = fakeServer();
    code = generateCode();
  });
  afterEach(() => vi.useRealTimers());

  it('Gerät B bekommt Run, Profil und Sammlung von Gerät A', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'IPADRUN1' }));
    saveDiscovered([...loadDiscovered(), 'joker:test']);
    getProfile().stats.wins = 7;
    expect(await syncOnce({ fetcher: srv.fetcher, state: state() })).toMatchObject({ status: 'ok', pushed: true });

    mac.use();
    tick();
    const r = await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(r).toMatchObject({ status: 'ok', changedLocal: true });
    expect(loadRun()?.seed).toBe('IPADRUN1');
    expect(loadDiscovered()).toContain('joker:test');
    expect(getProfile().stats.wins).toBe(7);
  });

  it('der Server sieht keinen Klartext', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'GEHEIM01' }));
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(srv.rows.size).toBe(2);
    for (const r of srv.rows.values()) {
      expect(r.payload).not.toContain('GEHEIM01');
      expect(r.payload).not.toContain('stats');
    }
  });

  it('zweiter Abgleich ohne Änderung lädt nichts hoch', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'STILL001' }));
    const s = state();
    await syncOnce({ fetcher: srv.fetcher, state: s });
    const revs = [...srv.rows.values()].map((r) => r.rev);
    expect(await syncOnce({ fetcher: srv.fetcher, state: s })).toMatchObject({ status: 'ok', pushed: false, changedLocal: false });
    expect([...srv.rows.values()].map((r) => r.rev)).toEqual(revs);
  });

  it('derselbe Run: der neuere Stand gewinnt in beide Richtungen', async () => {
    ipad.use();
    const run = createRun({ seed: 'GLEICH01' });
    saveRun(run);
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    mac.use();
    tick();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    // Mac spielt weiter
    tick();
    const further = loadRun()!;
    further.money += 5;
    saveRun(further);
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    // iPad holt es
    ipad.use();
    tick();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(loadRun()?.money).toBe(run.money + 5);
  });

  it('verschiedene Runs: Rückfrage, dann Wahl', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'IPADRUN2' }));
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    mac.use();
    tick();
    saveRun(createRun({ seed: 'MACRUN02' }));
    const ask = await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(ask.status).toBe('conflict');
    expect(loadRun()?.seed).toBe('MACRUN02');
    const keep = await syncOnce({ fetcher: srv.fetcher, state: state(), onConflict: 'remote' });
    expect(keep.status).toBe('ok');
    expect(loadRun()?.seed).toBe('IPADRUN2');
  });

  it('Wahl "lokal" überschreibt den Run in der Cloud', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'IPADRUN3' }));
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    mac.use();
    tick();
    saveRun(createRun({ seed: 'MACRUN03' }));
    await syncOnce({ fetcher: srv.fetcher, state: state(), onConflict: 'local' });
    ipad.use();
    tick();
    expect((await syncOnce({ fetcher: srv.fetcher, state: state() })).status).toBe('conflict');
  });

  it('ein beendeter Run wird nicht wieder hergestellt', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'ENDE0001' }));
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    mac.use();
    tick();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(loadRun()).not.toBeNull();
    // Mac beendet den Run
    tick();
    saveRun(null);
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    // iPad hat den alten Run noch und bekommt das Ende mit
    ipad.use();
    tick();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(loadRun()).toBeNull();
    // und ein weiterer Abgleich holt ihn nicht zurück
    tick();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(loadRun()).toBeNull();
  });

  it('ein neuer Run nach dem Ende gewinnt gegen das Ende', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'ALT00001' }));
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    tick();
    saveRun(null);
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    tick();
    saveRun(createRun({ seed: 'NEU00001' }));
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    mac.use();
    tick();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(loadRun()?.seed).toBe('NEU00001');
  });

  it('Profile beider Geräte werden zusammengeführt', async () => {
    ipad.use();
    getProfile().stats.bestAnte = 8;
    getProfile().unlocked = { a: 5 };
    saveDiscovered(['x']);
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    mac.use();
    tick();
    getProfile().stats.bestAnte = 3;
    getProfile().stats.wins = 2;
    getProfile().unlocked = { b: 9 };
    saveDiscovered(['y']);
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(getProfile().stats.bestAnte).toBe(8);
    expect(getProfile().unlocked).toEqual({ a: 5, b: 9 });
    expect(loadDiscovered().sort()).toEqual(['x', 'y']);
    ipad.use();
    tick();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(getProfile().stats.wins).toBe(2);
    expect(loadDiscovered().sort()).toEqual(['x', 'y']);
  });

  it('schreibt ein anderes Gerät dazwischen, wird neu abgeglichen', async () => {
    ipad.use();
    getProfile().stats.wins = 1;
    saveProfile();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    mac.use();
    tick();
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    getProfile().stats.wins = 5;
    saveProfile();
    // Ein dritter Schreiber erhöht die Revision, nachdem der Mac gelesen hat und bevor er schreibt
    const rowKey = [...srv.rows.keys()].find((k) => k.endsWith('|profile'))!;
    srv.onNextPush(() => {
      const r = srv.rows.get(rowKey)!;
      srv.rows.set(rowKey, { ...r, rev: r.rev + 1 });
    });
    let pulls = 0;
    const counting: Fetcher = (url, init) => {
      if (url.endsWith('/rpc/sync_pull')) pulls++;
      return srv.fetcher(url, init);
    };
    const macState = state();
    expect(await syncOnce({ fetcher: counting, state: macState })).toMatchObject({ status: 'ok', pushed: true });
    expect(pulls).toBe(2);
    expect(macState.revs.profile).toBe(3);
    expect(srv.rows.get(rowKey)!.rev).toBe(3);
  });

  it('gibt nach zu vielen Konflikten auf, statt endlos zu laufen', async () => {
    ipad.use();
    getProfile().stats.wins = 1;
    saveProfile();
    const alwaysRace: Fetcher = async (url, init) => {
      if (url.endsWith('/rpc/sync_push')) return new Response(JSON.stringify({ ok: false, error: 'conflict', rev: 9 }), { status: 200 });
      return srv.fetcher(url, init);
    };
    await expect(syncOnce({ fetcher: alwaysRace, state: state() })).rejects.toBeInstanceOf(CloudError);
  });

  it('während einer Runde wird der lokale Run nie ersetzt', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'IPADRUN4' }));
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    mac.use();
    tick();
    const blocked = await syncOnce({ fetcher: srv.fetcher, state: state(), allowRunReplace: false });
    expect(blocked).toMatchObject({ status: 'ok', runBlocked: true, runReplaced: false });
    expect(loadRun()).toBeNull();
    const done = await syncOnce({ fetcher: srv.fetcher, state: state() });
    expect(done).toMatchObject({ runReplaced: true, runBlocked: false });
    expect(loadRun()?.seed).toBe('IPADRUN4');
  });

  it('falscher Code und Netzfehler ergeben lesbare Fehler', async () => {
    ipad.use();
    saveRun(createRun({ seed: 'CODE0001' }));
    await syncOnce({ fetcher: srv.fetcher, state: state() });
    const wrong = { ...state(), code: generateCode() };
    // andere Kennung: Server hat dort nichts, also kein Fehler, aber derselbe Server Eintrag mit falschem Schlüssel schon
    const id = [...srv.rows.keys()][0].split('|')[0];
    const stolen: Fetcher = async (url, init) => {
      const b = JSON.parse(String(init?.body ?? '{}'));
      return srv.fetcher(url, { ...init, body: JSON.stringify({ ...b, p_id: b.p_id ? id : b.p_id }) });
    };
    await expect(syncOnce({ fetcher: stolen, state: wrong })).rejects.toMatchObject({ reason: 'code' });
    const offline: Fetcher = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(syncOnce({ fetcher: offline, state: state() })).rejects.toMatchObject({ reason: 'netz' });
    const broken: Fetcher = async () => new Response('x', { status: 500 });
    await expect(syncOnce({ fetcher: broken, state: state() })).rejects.toBeInstanceOf(CloudError);
  });

  it('Kopplungszustand wird gespeichert und gelesen', async () => {
    ipad.use();
    expect(loadSyncState()).toBeNull();
    const s = state();
    saveSyncState(s);
    expect(loadSyncState()?.code).toBe(s.code);
    await syncOnce({ fetcher: srv.fetcher });
    expect(loadSyncState()?.lastSync).toBeGreaterThan(0);
  });
});
