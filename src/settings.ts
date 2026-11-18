import { DEFAULT_SETTINGS, VOLUME_STEP } from './data/juice';

export interface Settings {
  crt: boolean;
  shake: boolean;
  volume: number;
}

const KEY = 'alatro.settings.v1';

/** Liest rohe Daten, ergänzt fehlende oder ungültige Felder durch Standardwerte. */
export function parseSettings(raw: unknown): Settings {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const vol = typeof o.volume === 'number' && Number.isFinite(o.volume) ? o.volume : DEFAULT_SETTINGS.volume;
  return {
    crt: typeof o.crt === 'boolean' ? o.crt : DEFAULT_SETTINGS.crt,
    shake: typeof o.shake === 'boolean' ? o.shake : DEFAULT_SETTINGS.shake,
    volume: clampVolume(vol),
  };
}

export function clampVolume(v: number): number {
  const stepped = Math.round(Math.max(0, Math.min(1, v)) / VOLUME_STEP) * VOLUME_STEP;
  return Math.round(stepped * 100) / 100;
}

type Listener = (s: Settings) => void;

let current: Settings | null = null;
const listeners = new Set<Listener>();

function load(): Settings {
  try {
    return parseSettings(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
  } catch {
    return parseSettings(null);
  }
}

export function getSettings(): Settings {
  if (!current) current = load();
  return current;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  current = parseSettings({ ...getSettings(), ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* Speicher nicht verfügbar */
  }
  for (const l of listeners) l(current);
  return current;
}

export function onSettings(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
