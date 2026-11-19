import './core/index';
import { beforeEach, describe, expect, it } from 'vitest';
import { SYNC } from './data/sync';
import { createRun } from './core/game';
import { SAVE_VERSION } from './core/run';
import { newProfile, getProfile, setProfileForTest } from './profile';
import { loadRun, saveRun } from './save';
import { loadDiscovered, saveDiscovered } from './collection';
import { decodeBundle, encodeBundle, makeBundle, mergeCollections, mergeProfiles, parseBundle, pickRun } from './syncBundle';
import { decryptText, encryptText, formatCode, generateCode, isValidCode, normalizeCode, syncId } from './syncCrypto';
import { applyBundle, currentBundle, previewRun } from './syncStorage';

function fakeStorage() {
  const m = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe('Kopplungscode', () => {
  it('hat die richtige Länge und nur erlaubte Zeichen', () => {
    for (let i = 0; i < 50; i++) {
      const c = generateCode();
      expect(c).toHaveLength(SYNC.codeLength);
      expect(isValidCode(c)).toBe(true);
    }
    expect(SYNC.codeAlphabet).toHaveLength(32);
    expect(new Set(SYNC.codeAlphabet).size).toBe(32);
    expect(256 % SYNC.codeAlphabet.length).toBe(0);
  });

  it('zwei Codes sind verschieden', () => {
    expect(generateCode()).not.toBe(generateCode());
  });

  it('Anzeige und Eingabe sind austauschbar', () => {
    const c = generateCode();
    const shown = formatCode(c);
    expect(shown.split('-')).toHaveLength(SYNC.codeLength / SYNC.codeGroup);
    expect(normalizeCode(shown.toLowerCase().replace(/-/g, ' '))).toBe(c);
    expect(isValidCode(shown)).toBe(true);
  });

  it('lehnt falsche Codes ab', () => {
    expect(isValidCode('')).toBe(false);
    expect(isValidCode('ABC')).toBe(false);
    expect(isValidCode('0'.repeat(SYNC.codeLength))).toBe(false);
  });

  it('Server Kennung ist stabil, schreibweisenunabhängig und verrät den Code nicht', async () => {
    const c = generateCode();
    const id = await syncId(c);
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(await syncId(formatCode(c).toLowerCase())).toBe(id);
    expect(id).not.toContain(c);
    expect(await syncId(generateCode())).not.toBe(id);
  });
});

describe('Verschlüsselung', () => {
  it('ver und entschlüsselt, mit frischer Nonce', async () => {
    const c = generateCode();
    const a = await encryptText(c, 'Sternwarte');
    const b = await encryptText(c, 'Sternwarte');
    expect(a).not.toBe(b);
    expect(await decryptText(c, a)).toBe('Sternwarte');
    expect(await decryptText(formatCode(c), b)).toBe('Sternwarte');
  });

  it('falscher Code und veränderte Daten ergeben null', async () => {
    const c = generateCode();
    const a = await encryptText(c, 'geheim');
    expect(await decryptText(generateCode(), a)).toBeNull();
    const flipped = a.slice(0, -2) + (a.endsWith('AA') ? 'BB' : 'AA');
    expect(await decryptText(c, flipped)).toBeNull();
    expect(await decryptText(c, '%%%')).toBeNull();
  });

  it('Umlaute und lange Texte überstehen die Runde', async () => {
    const c = generateCode();
    const t = 'Äpfel öl ü ß '.repeat(5000);
    expect(await decryptText(c, await encryptText(c, t))).toBe(t);
  });
});

describe('Paket', () => {
  it('Text Kodierung ist umkehrbar und akzeptiert reines JSON', () => {
    const p = newProfile();
    p.stats.wins = 3;
    const b = makeBundle({ profile: p, collection: ['a', 'b'], run: null, runAt: 5 }, 123);
    expect(b.runAt).toBe(0);
    const text = encodeBundle(b);
    expect(text.startsWith(SYNC.exportPrefix)).toBe(true);
    expect(decodeBundle(text)).toEqual(b);
    expect(decodeBundle(JSON.stringify(b))).toEqual(b);
    expect(decodeBundle(`  ${text}\n`)).toEqual(b);
  });

  it('Müll ergibt null statt Fehler', () => {
    for (const t of ['', 'hallo', 'ALATRO1.@@@', '{kaputt', '[]', 'null', JSON.stringify({ format: 99 }), SYNC.exportPrefix]) {
      expect(decodeBundle(t)).toBeNull();
    }
    expect(parseBundle(null)).toBeNull();
    expect(parseBundle({ format: SYNC.bundleFormat + 1 })).toBeNull();
  });

  it('kaputte Felder werden bereinigt', () => {
    const b = parseBundle({ format: SYNC.bundleFormat, collection: ['x', 5, null], profile: { stats: { wins: 'viel' } }, run: 7 });
    expect(b?.collection).toEqual(['x']);
    expect(b?.profile?.stats.wins).toBe(0);
    expect(b?.run).toBeNull();
  });
});

describe('Profile zusammenführen', () => {
  it('nimmt Maxima, Vereinigungen und frühere Zeitstempel', () => {
    const a = newProfile();
    const b = newProfile();
    a.stats.wins = 3;
    b.stats.wins = 5;
    a.stats.bestAnte = 8;
    b.stats.bestAnte = 4;
    a.unlocked = { x: 100, y: 50 };
    b.unlocked = { x: 70, z: 9 };
    a.winsByDeckStake = { 'a|b': 2 };
    b.winsByDeckStake = { 'a|b': 1, 'c|d': 1 };
    a.tutorialDone = true;
    a.created = 200;
    b.created = 100;
    a.daily = { '2026-01-01': { ante: 3, won: false, seed: 's', deckId: 'd' } };
    b.daily = { '2026-01-01': { ante: 5, won: true, seed: 's', deckId: 'd' }, '2026-01-02': { ante: 1, won: false, seed: 't', deckId: 'd' } };
    const m = mergeProfiles(a, b);
    expect(m.stats.wins).toBe(5);
    expect(m.stats.bestAnte).toBe(8);
    expect(m.unlocked).toEqual({ x: 70, y: 50, z: 9 });
    expect(m.winsByDeckStake).toEqual({ 'a|b': 2, 'c|d': 1 });
    expect(m.tutorialDone).toBe(true);
    expect(m.created).toBe(100);
    expect(m.daily['2026-01-01']).toMatchObject({ ante: 5, won: true });
    expect(Object.keys(m.daily)).toHaveLength(2);
  });

  it('ist idempotent und verändert die Eingaben nicht', () => {
    const a = newProfile();
    const b = newProfile();
    a.stats.hands = 10;
    b.stats.hands = 20;
    a.unlocked = { x: 1 };
    const copyA = JSON.stringify(a);
    const m = mergeProfiles(a, b);
    expect(JSON.stringify(a)).toBe(copyA);
    expect(mergeProfiles(m, b)).toEqual(m);
    expect(mergeProfiles(m, a)).toEqual(m);
  });

  it('Sammlungen: Vereinigung ohne Duplikate', () => {
    expect(mergeCollections(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('Run wählen', () => {
  const run = (id: string) => ({ runId: id });
  const side = (r: unknown, at = 0, version = SAVE_VERSION) => ({ run: r, at, version });

  it('einseitig oder leer', () => {
    expect(pickRun(side(null), side(null)).kind).toBe('none');
    expect(pickRun(side(run('a')), side(null)).kind).toBe('local');
    expect(pickRun(side(null), side(run('a'))).kind).toBe('remote');
  });

  it('derselbe Run: der neuere gewinnt', () => {
    expect(pickRun(side(run('a'), 10), side(run('a'), 20)).kind).toBe('remote');
    expect(pickRun(side(run('a'), 20), side(run('a'), 10)).kind).toBe('local');
    expect(pickRun(side(run('a'), 10), side(run('a'), 10)).kind).toBe('local');
  });

  it('verschiedene Runs sind ein Konflikt', () => {
    expect(pickRun(side(run('a'), 10), side(run('b'), 20)).kind).toBe('conflict');
  });

  it('ein Run aus neuerer Spielversion wird nie überschrieben', () => {
    expect(pickRun(side(run('a'), 10), side(run('a'), 99, SAVE_VERSION + 1)).kind).toBe('local');
    expect(pickRun(side(run('a'), 10, SAVE_VERSION + 1), side(run('a'), 99, SAVE_VERSION)).kind).toBe('local');
  });
});

describe('Einarbeiten in den Speicher', () => {
  beforeEach(() => {
    fakeStorage();
    setProfileForTest(null);
  });

  it('Paket aus dem Speicher und zurück (zweites Gerät)', () => {
    const run = createRun({ seed: 'SYNCTEST' });
    saveRun(run);
    saveDiscovered([...loadDiscovered(), 'joker:test']);
    getProfile().stats.wins = 4;
    const bundle = decodeBundle(encodeBundle(currentBundle(1)))!;
    expect(bundle.run).toBeTruthy();

    fakeStorage();
    setProfileForTest(null);
    expect(loadRun()).toBeNull();
    const r = applyBundle(bundle);
    expect(r).toEqual({ pick: 'remote', runReplaced: true });
    expect(loadRun()?.seed).toBe('SYNCTEST');
    expect(loadDiscovered()).toContain('joker:test');
    expect(getProfile().stats.wins).toBe(4);
  });

  it('Konflikt: lokal bleibt Standard, remote auf Wunsch', () => {
    saveRun(createRun({ seed: 'REMOTE01' }));
    const remote = decodeBundle(encodeBundle(currentBundle(1)))!;
    fakeStorage();
    saveRun(createRun({ seed: 'LOKAL001' }));
    expect(previewRun(remote).kind).toBe('conflict');
    expect(applyBundle(remote).runReplaced).toBe(false);
    expect(loadRun()?.seed).toBe('LOKAL001');
    expect(applyBundle(remote, 'remote').runReplaced).toBe(true);
    expect(loadRun()?.seed).toBe('REMOTE01');
  });

  it('Import ohne Run lässt den lokalen Run unberührt', () => {
    saveRun(createRun({ seed: 'LOKAL002' }));
    const remote = makeBundle({ profile: newProfile(), collection: [], run: null, runAt: 0 }, 1);
    expect(applyBundle(remote)).toEqual({ pick: 'local', runReplaced: false });
    expect(loadRun()?.seed).toBe('LOKAL002');
  });
});
