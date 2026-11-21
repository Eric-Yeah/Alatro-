import { TAP_BOOST, TAP_BOOST_MS } from './data/report';
import { CARD_PALETTE_IDS, type CardPaletteId } from './data/cardArt/cardPalettes';
import { MUSIC_MIX, MUSIC_OFF, TRACK_IDS } from './data/music';
import { isLang, setLang, type Lang } from './i18n';
import { DEFAULT_SETTINGS, SPEED_STEPS, VOLUME_STEP, type Quality, type SpeedStep } from './data/juice';

export interface Settings {
  crt: boolean;
  shake: boolean;
  volume: number;
  music: string;
  musicVolume: number;
  speed: string;
  quality: Quality;
  fps: boolean;
  haptics: boolean;
  cardPalette: CardPaletteId;
  /** Sprache der Oberfläche und der Inhalte (Wechsel lädt die App neu) */
  lang: Lang;
}

const KEY = 'alatro.settings.v2';
/** Alter Speicherort (v1): wird einmal übernommen. */
const OLD_KEY = 'alatro.settings.v1';

/** Liest rohe Daten, ergänzt fehlende oder ungültige Felder durch Standardwerte. */
export function parseSettings(raw: unknown): Settings {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const vol = typeof o.volume === 'number' && Number.isFinite(o.volume) ? o.volume : DEFAULT_SETTINGS.volume;
  const mvol = typeof o.musicVolume === 'number' && Number.isFinite(o.musicVolume) ? o.musicVolume : DEFAULT_SETTINGS.musicVolume;
  return {
    crt: typeof o.crt === 'boolean' ? o.crt : DEFAULT_SETTINGS.crt,
    shake: typeof o.shake === 'boolean' ? o.shake : DEFAULT_SETTINGS.shake,
    volume: clampVolume(vol),
    music: typeof o.music === 'string' && (o.music === MUSIC_OFF || o.music === MUSIC_MIX || TRACK_IDS.includes(o.music)) ? o.music : DEFAULT_SETTINGS.music,
    musicVolume: clampVolume(mvol),
    speed: typeof o.speed === 'string' && SPEED_STEPS.some((x) => x.id === o.speed) ? o.speed : DEFAULT_SETTINGS.speed,
    quality: o.quality === 'voll' || o.quality === 'sparsam' ? o.quality : DEFAULT_SETTINGS.quality,
    fps: typeof o.fps === 'boolean' ? o.fps : DEFAULT_SETTINGS.fps,
    haptics: typeof o.haptics === 'boolean' ? o.haptics : DEFAULT_SETTINGS.haptics,
    cardPalette: CARD_PALETTE_IDS.find((x) => x === o.cardPalette) ?? DEFAULT_SETTINGS.cardPalette,
    lang: isLang(o.lang) ? o.lang : DEFAULT_SETTINGS.lang,
  };
}

/** Kurzzeitiger Schub durch Tippen während einer Animation (Zeitpunkt, bis zu dem er gilt) */
let boostUntil = 0;

/** Tippen beschleunigt die laufende Animation für kurze Zeit (Faktor und Dauer in data/report.ts) */
export function tapBoost(now: number = performance.now()) {
  boostUntil = now + TAP_BOOST_MS;
}

export function boostActive(now: number = performance.now()): boolean {
  return now < boostUntil;
}

/** Tempofaktor der aktuellen Einstellung (1 = normal), mit Schub durch Tippen */
export function speedFactor(s: Settings = getSettings()): number {
  const base = SPEED_STEPS.find((x) => x.id === s.speed)?.factor ?? 1;
  return boostActive() ? base * TAP_BOOST : base;
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
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      const old = localStorage.getItem(OLD_KEY);
      if (old !== null) return parseSettings(JSON.parse(old));
    }
    return parseSettings(JSON.parse(raw ?? 'null'));
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
  setLang(current.lang);
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

const HINT_KEY = 'alatro.hints.v1';

/** Wurde der Hinweis mit dieser ID schon einmal gezeigt und erledigt? (Einführung für neue Spieler) */
export function hintSeen(id: string): boolean {
  try {
    const o = JSON.parse(localStorage.getItem(HINT_KEY) ?? '{}');
    return !!o && o[id] === true;
  } catch {
    return false;
  }
}

export function markHintSeen(id: string) {
  try {
    const o = JSON.parse(localStorage.getItem(HINT_KEY) ?? '{}') ?? {};
    o[id] = true;
    localStorage.setItem(HINT_KEY, JSON.stringify(o));
  } catch {
    /* Speicher nicht verfügbar */
  }
}
