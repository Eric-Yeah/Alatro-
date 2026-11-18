import { DEFAULT_SETTINGS, SPEED_STEPS, VOLUME_STEP, type Quality, type SpeedStep } from './data/juice';

export interface Settings {
  crt: boolean;
  shake: boolean;
  volume: number;
  speed: string;
  quality: Quality;
  fps: boolean;
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
    speed: typeof o.speed === 'string' && SPEED_STEPS.some((x) => x.id === o.speed) ? o.speed : DEFAULT_SETTINGS.speed,
    quality: o.quality === 'voll' || o.quality === 'sparsam' ? o.quality : DEFAULT_SETTINGS.quality,
    fps: typeof o.fps === 'boolean' ? o.fps : DEFAULT_SETTINGS.fps,
  };
}

/** Tempofaktor der aktuellen Einstellung (1 = normal) */
export function speedFactor(s: Settings = getSettings()): number {
  return SPEED_STEPS.find((x) => x.id === s.speed)?.factor ?? 1;
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

/** Schaltet das Animationstempo eine Stufe weiter (nach der letzten wieder auf die erste) und gibt die neue Stufe zurück. */
export function cycleSpeed(): SpeedStep {
  const i = Math.max(0, SPEED_STEPS.findIndex((x) => x.id === getSettings().speed));
  const next = SPEED_STEPS[(i + 1) % SPEED_STEPS.length];
  updateSettings({ speed: next.id });
  return next;
}

const SEEN_KEY = 'alatro.patchSeen.v1';

/** Version, für die die Patch Notes zuletzt angezeigt wurden */
export function loadPatchSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

export function savePatchSeen(version: string) {
  try {
    localStorage.setItem(SEEN_KEY, version);
  } catch {
    /* Speicher nicht verfügbar */
  }
}
