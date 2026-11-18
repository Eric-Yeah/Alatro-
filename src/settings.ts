import { DEFAULT_SPEED, SPEED_OPTIONS } from './data/options';

const KEY = 'alatro.settings.v1';
const SEEN_KEY = 'alatro.patchSeen.v1';

export interface Settings {
  /** Faktor für Animationen, 2 heißt doppelt so schnell */
  speed: number;
}

/** Ungültige oder fehlende Werte fallen auf die Standardwerte zurück. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings>;
  const speed = SPEED_OPTIONS.includes(r.speed as number) ? (r.speed as number) : DEFAULT_SPEED;
  return { speed };
}

let current: Settings | null = null;

export function getSettings(): Settings {
  if (!current) {
    try {
      current = sanitizeSettings(JSON.parse(localStorage.getItem(KEY) ?? '{}'));
    } catch {
      current = sanitizeSettings({});
    }
  }
  return current;
}

export function setSettings(patch: Partial<Settings>) {
  current = sanitizeSettings({ ...getSettings(), ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* Speicher nicht verfügbar */
  }
}

/** Aktuelles Animationstempo, wird von tween und wait pro Frame gelesen. */
export const getSpeed = (): number => getSettings().speed;

/** Setzt das nächste Tempo der Liste (nach dem letzten wieder das erste). */
export function cycleSpeed(): number {
  const i = SPEED_OPTIONS.indexOf(getSpeed());
  const next = SPEED_OPTIONS[(i + 1) % SPEED_OPTIONS.length];
  setSettings({ speed: next });
  return next;
}

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
