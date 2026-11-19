/**
 * Kopplungscode und Verschlüsselung (WebCrypto, ohne DOM). Der Code ist nie Spielzufall, deshalb
 * `crypto.getRandomValues` statt `RngStreams`. Der Server bekommt nur `syncId(code)` und Chiffretext.
 */
import { SYNC } from './data/sync';
import { fromBase64Url, toBase64Url } from './syncBundle';

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

/** Neuer Kopplungscode (nur Zeichen des Alphabets, gleichverteilt: 256 ist durch 32 teilbar) */
export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SYNC.codeLength));
  return [...bytes].map((b) => SYNC.codeAlphabet[b % SYNC.codeAlphabet.length]).join('');
}

/** Eingabe vereinheitlichen: Großbuchstaben, Leerzeichen und Trennzeichen entfernen */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidCode(input: string): boolean {
  const c = normalizeCode(input);
  return c.length === SYNC.codeLength && [...c].every((ch) => SYNC.codeAlphabet.includes(ch));
}

/** Anzeige in Gruppen, zum Beispiel ABCD-EFGH-... */
export function formatCode(code: string): string {
  const c = normalizeCode(code);
  const out: string[] = [];
  for (let i = 0; i < c.length; i += SYNC.codeGroup) out.push(c.slice(i, i + SYNC.codeGroup));
  return out.join('-');
}

/** Kennung auf dem Server: SHA-256 über Domäne und Code. Verrät den Datenschlüssel nicht. */
export async function syncId(code: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(`${SYNC.idDomain}:${normalizeCode(code)}`)));
}

async function dataKey(code: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(normalizeCode(code)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(SYNC.keyDomain), iterations: SYNC.kdfIterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Verschlüsselt Text, Ergebnis ist Base64 aus Nonce und Chiffretext */
export async function encryptText(code: string, text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await dataKey(code), enc.encode(text)));
  const all = new Uint8Array(iv.length + ct.length);
  all.set(iv);
  all.set(ct, iv.length);
  return toBase64Url(all);
}

/** Gegenstück zu `encryptText`. Falscher Code oder veränderte Daten ergeben null. */
export async function decryptText(code: string, payload: string): Promise<string | null> {
  try {
    const all = fromBase64Url(payload);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, await dataKey(code), all.slice(12));
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}
