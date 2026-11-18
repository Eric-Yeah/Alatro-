import { DEFAULT_SETTINGS } from './data/juice';

/** Einstellungen des Spielers (unabhängig vom Spielstand), gespeichert in localStorage. */
export interface Settings {
  crt: boolean;
  volume: number;
  sound: boolean;
}

const KEY = 'alatro.settings.v1';

type Listener = (s: Settings) => void;

let current: Settings = { ...DEFAULT_SETTINGS };
const listeners = new Set<Listener>();

try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const p = JSON.parse(raw) as Partial<Settings>;
    current = {
      crt: typeof p.crt === 'boolean' ? p.crt : current.crt,
      volume: typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : current.volume,
      sound: typeof p.sound === 'boolean' ? p.sound : current.sound,
    };
  }
} catch {
  /* kein Speicher verfügbar, Standardwerte */
}

export const getSettings = (): Settings => current;

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignorieren */
  }
  for (const l of listeners) l(current);
}

/** Meldet Änderungen, gibt die Abmeldefunktion zurück */
export function onSettings(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
