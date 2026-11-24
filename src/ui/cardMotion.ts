import { Ticker, type Container } from 'pixi.js';
import { CARD_FLOAT, FLOAT_QUALITY, FLOAT_RAMP_MS, type FloatSpec } from '../data/cardMotion';
import { getSettings, onSettings } from '../settings';
import { floatOffset, floatRamp } from './cardMotionMath';
import { nearFor } from './pointerFx';
import { ease } from './spektakelMath';
import { QUALITY_PROFILE } from '../data/juice';

// Leichtes Schweben der Karten auf dem Tisch. Alle Karten laufen über EINEN Ticker Eintrag.
// Das Schweben wirkt nur auf einen inneren Container (face, body), nie auf die Karte selbst. So bleiben alle Tweens auf
// x, y, rotation und scale der Karte (Layout, Anheben, Spielen, Juice) unberührt. Grafikstufe Sparsam schaltet es ab.

export type FloatKind = keyof typeof CARD_FLOAT;

interface Entry {
  inner: Container;
  seed: number;
  spec: FloatSpec;
  /** Zeit seit dem Anmelden (ms), für das sanfte Einsetzen */
  age: number;
  /** Nähe des Zeigers (Grafikstufe Supernova), geglättet: Anheben und Drehung */
  nearLift: number;
  nearRot: number;
}

const entries = new Set<Entry>();
let hooked = false;
let time = 0;
/** Stärke laut Grafikstufe, wird bei Änderung der Optionen neu gelesen */
let quality = 1;
/** Sind die Versätze gerade auf null gesetzt (Grafikstufe aus)? Dann bleibt der Ticker leer. */
let zeroed = false;

function readQuality() {
  quality = FLOAT_QUALITY[getSettings().quality] ?? 1;
}

/** Ist das Objekt samt allen Eltern sichtbar? Verborgene Karten (anderer Bildschirm) werden nicht berechnet. */
function shown(c: Container | null): boolean {
  for (let n: Container | null = c; n; n = n.parent) if (!n.visible) return false;
  return true;
}

function reset(e: Entry) {
  e.inner.y = 0;
  e.inner.rotation = 0;
  e.nearLift = 0;
  e.nearRot = 0;
}

/** Zeigernähe nur in der Grafikstufe Supernova */
let nearOn = false;
function readNear() {
  nearOn = QUALITY_PROFILE[getSettings().quality].spektakel;
}

function tick(t: Ticker) {
  time += t.deltaMS;
  if (quality <= 0) {
    if (!zeroed) {
      for (const e of entries) reset(e);
      zeroed = true;
    }
    return;
  }
  zeroed = false;
  for (const e of entries) {
    if (e.inner.destroyed) { entries.delete(e); continue; }
    if (!shown(e.inner)) continue;
    e.age += t.deltaMS;
    const o = floatOffset(time, e.seed, e.spec, quality * floatRamp(e.age, FLOAT_RAMP_MS));
    if (nearOn || e.nearLift !== 0 || e.nearRot !== 0) {
      // Karten in der Nähe von Finger oder Maus heben sich und neigen sich zum Zeiger
      const n = nearOn ? nearFor(e.inner) : { lift: 0, rot: 0 };
      e.nearLift = ease(e.nearLift, n.lift);
      e.nearRot = ease(e.nearRot, n.rot);
    }
    e.inner.y = o.y + e.nearLift;
    e.inner.rotation = o.rot + e.nearRot;
  }
}

/**
 * Lässt inner schweben. seed kommt aus der Karten ID (oder einem stabilen Wert), damit jede Karte ihre eigene Phase hat.
 * Gibt eine Funktion zurück, die das Schweben beendet (der Versatz geht dabei auf null).
 */
export function attachFloat(inner: Container, seed: number, kind: FloatKind): () => void {
  if (!hooked) {
    hooked = true;
    readQuality();
    readNear();
    onSettings(() => { readQuality(); readNear(); });
    Ticker.shared.add(tick);
  }
  const e: Entry = { inner, seed, spec: CARD_FLOAT[kind], age: 0, nearLift: 0, nearRot: 0 };
  entries.add(e);
  return () => {
    entries.delete(e);
    if (!inner.destroyed) reset(e);
  };
}

/** Anzahl der schwebenden Karten (für Prüfungen) */
export function floatingCount(): number {
  return entries.size;
}
