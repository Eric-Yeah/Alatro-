import { Ticker, type Container, type Text } from 'pixi.js';
import { COLLECT, DEAL, DECK_COUNT_PULSE } from '../data/cardMotion';
import { speedFactor } from '../settings';
import { sfx } from './audio';
import type { CardView } from './CardView';
import {
  arcPoint, easeInOutCubic, easeOutCubic, easeOutOvershoot, flipState, playsSound, snapPulse, staggerDelays, type Point,
} from './cardMotionMath';
import { wait } from './tween';

// Austeilen vom Stapel in die Hand und Einziehen zurück zum Stapel. Die Spiellogik bleibt in Game.ts unberührt,
// hier läuft nur die Optik. Alle Karten einer Gruppe laufen über EINEN Ticker Eintrag, das Tempo aus den Optionen
// (und der Tipp Schub) wirkt in jedem Frame. Zahlen in data/cardMotion.ts, Rechnung in cardMotionMath.ts.

/** Kurzer Impuls: Wert springt auf 1 und klingt über ms linear auf 0 ab */
class Impulse {
  value = 0;
  private ms = 1;
  kick(ms: number) { this.value = 1; this.ms = ms; }
  step(dtMs: number) { this.value = Math.max(0, this.value - dtMs / this.ms); }
  /** Weicher Verlauf (quadratisch), damit der Impuls erst schnell und dann ruhig abklingt */
  get shaped() { return this.value * this.value; }
}

interface KickSpec { scaleX: number; scaleY: number; offsetX: number; ms: number }

/** Reaktionen des Kartenstapels: Zucken beim Austeilen, Stauchen beim Einziehen, Aufpulsen des Zählers */
export class DeckFx {
  private readonly pile = new Impulse();
  private readonly count = new Impulse();
  private spec: KickSpec = { scaleX: 1, scaleY: 1, offsetX: 0, ms: 1 };
  private running = false;

  /** pile enthält Stapel und Zähler und wird um (x, y) skaliert, countText ist der Zähler */
  constructor(private readonly node: Container, private readonly countText: Text, private readonly x: number, private readonly y: number) {
    // Pivot in die Stapelmitte, damit das Stauchen um den Stapel geschieht (die Kinder behalten ihre Koordinaten)
    node.pivot.set(x, y);
    node.position.set(x, y);
  }

  kick(spec: KickSpec) {
    this.spec = spec;
    this.pile.kick(spec.ms);
    this.start();
  }

  pulseCount() {
    this.count.kick(DECK_COUNT_PULSE.ms);
    this.start();
  }

  private start() {
    if (this.running) return;
    this.running = true;
    Ticker.shared.add(this.tick, this);
  }

  private tick(t: Ticker) {
    // der Impuls läuft in Echtzeit, die Karten dagegen im eingestellten Tempo
    this.pile.step(t.deltaMS);
    this.count.step(t.deltaMS);
    this.apply();
    if (this.pile.value <= 0 && this.count.value <= 0) {
      this.running = false;
      Ticker.shared.remove(this.tick, this);
    }
  }

  private apply() {
    if (this.node.destroyed) return;
    const k = this.pile.shaped;
    this.node.scale.set(1 + (this.spec.scaleX - 1) * k, 1 + (this.spec.scaleY - 1) * k);
    this.node.position.x = this.x + this.spec.offsetX * k;
    this.node.position.y = this.y;
    if (!this.countText.destroyed) this.countText.scale.set(1 + (DECK_COUNT_PULSE.scale - 1) * this.count.shaped);
  }
}

/** Ein Flug einer Karte innerhalb einer Gruppe */
interface Flight {
  delay: number;
  dur: number;
  started: boolean;
  finished: boolean;
  start(): void;
  frame(t: number): void;
  finish(): void;
  /** Ist die Ansicht schon zerstört (z. B. durch einen Neuaufbau der Hand)? Dann zählt der Flug als beendet. */
  gone(): boolean;
}

/** Spielt alle Flüge über einen Ticker ab. Die Zeit läuft mit dem Tempo der Optionen. Das Ergebnis wird fertig, wenn alle gelandet sind. */
function runFlights(flights: Flight[]): Promise<void> {
  if (flights.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    let elapsed = 0;
    const tick = (t: Ticker) => {
      elapsed += t.deltaMS * speedFactor();
      let open = 0;
      for (const f of flights) {
        if (f.finished) continue;
        if (f.gone()) { f.finished = true; continue; }
        if (elapsed < f.delay) { open++; continue; }
        if (!f.started) { f.started = true; f.start(); }
        const p = Math.min(1, (elapsed - f.delay) / f.dur);
        f.frame(p);
        if (p >= 1) { f.finished = true; f.finish(); } else open++;
      }
      if (open === 0) { Ticker.shared.remove(tick); resolve(); }
    };
    Ticker.shared.add(tick);
  });
}

function lerp(a: number, b: number, k: number) { return a + (b - a) * k; }

export interface DealOptions {
  /** Stapelgröße vor dem Austeilen, der Zähler zählt pro Karte um eins herunter */
  countFrom: number;
  setCount: (n: number) => void;
}

/**
 * Teilt die Karten vom Stapel aus: Rückseite auf dem Stapel, Flug im Bogen mit kleinem Überschwingen in den Fächer Platz,
 * Umdrehen im Flug, gestaffelt, am Ende ein kurzes Einrasten. Die Zielwerte (homeX, homeY, homeRot) müssen schon stehen.
 * Der synchrone Teil bereitet alle Karten sofort vor, so blitzt keine Karte an der falschen Stelle auf.
 */
export async function dealCards(deck: DeckFx, views: CardView[], origin: Point, opts: DealOptions): Promise<void> {
  const n = views.length;
  const delays = staggerDelays(n, DEAL.firstGapMs, DEAL.gapFactor, DEAL.minGapMs);
  const flights: Flight[] = views.map((v, i) => {
    const sign = i % 2 === 0 ? 1 : -1;
    const startRot = sign * DEAL.startRot;
    v.setBackShown(true);
    v.visible = false;
    v.position.set(origin.x, origin.y);
    v.rotation = startRot;
    v.scale.set(DEAL.startScale);
    const target = () => ({ x: v.homeX, y: v.homeY - (v.selected ? 40 : 0) });
    return {
      delay: delays[i],
      dur: DEAL.flightMs,
      started: false,
      finished: false,
      gone: () => v.destroyed,
      start: () => {
        v.visible = true;
        if (playsSound(i, n, DEAL.sfxEveryAbove)) sfx.draw();
        opts.setCount(Math.max(0, opts.countFrom - (i + 1)));
        deck.pulseCount();
        deck.kick(DEAL.deckKick);
      },
      frame: (t) => {
        const e = easeOutOvershoot(t, DEAL.overshoot);
        const p = arcPoint(origin, target(), e, DEAL.arcLift, DEAL.arcFullDist);
        v.position.set(p.x, p.y);
        v.rotation = lerp(startRot, v.homeRot, e);
        const sc = lerp(DEAL.startScale, 1, easeOutCubic(t)) * snapPulse(t, DEAL.snapFrom, DEAL.snapAmp);
        const f = flipState(t, DEAL.flipStart, DEAL.flipEnd);
        v.setBackShown(!f.second);
        v.scale.set(sc * f.scaleX, sc);
      },
      finish: () => {
        const g = target();
        v.setBackShown(false);
        v.position.set(g.x, g.y);
        v.rotation = v.homeRot;
        v.scale.set(1);
      },
    };
  });
  try {
    await runFlights(flights);
  } finally {
    // nichts bleibt im Zwischenzustand hängen, auch wenn der Ablauf abbricht
    for (const f of flights) {
      if (f.finished) continue;
      f.finished = true;
      if (!f.gone()) { f.started = true; f.finish(); }
    }
    if (n > 0) opts.setCount(Math.max(0, opts.countFrom - n));
  }
  await wait(DEAL.settleMs);
}

export interface CollectOptions {
  /** Wird für jede Karte gerufen, wenn sie am Stapel ankommt (hier zerstört Game die Ansicht) */
  done: (v: CardView) => void;
  /** Optional: der Zähler zählt mit den Ankünften von from auf to (Rundenende) */
  count?: { from: number; to: number; set: (n: number) => void };
}

/**
 * Zieht Karten zum Stapel zurück: gestaffelt, im Bogen, schrumpfend, mit Umdrehen zur Rückseite.
 * Die Karte, die dem Stapel am nächsten liegt, startet zuerst. Jede Ankunft staucht den Stapel kurz.
 */
export async function collectCards(deck: DeckFx, views: CardView[], target: Point, opts: CollectOptions): Promise<void> {
  const sorted = views.slice().sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y));
  const n = sorted.length;
  const delays = staggerDelays(n, COLLECT.firstGapMs, COLLECT.gapFactor, COLLECT.minGapMs);
  let arrived = 0;
  const arrive = (v: CardView) => {
    arrived++;
    opts.done(v);
    deck.kick(COLLECT.deckSquash);
    if (opts.count) opts.count.set(Math.round(lerp(opts.count.from, opts.count.to, arrived / n)));
  };
  const flights: Flight[] = sorted.map((v, i) => {
    const sign = i % 2 === 0 ? 1 : -1;
    let a: Point = { x: v.x, y: v.y };
    let r0 = v.rotation;
    let s0 = v.scale.x || 1;
    return {
      delay: delays[i],
      dur: COLLECT.flightMs,
      started: false,
      finished: false,
      gone: () => v.destroyed,
      start: () => {
        // Ausgangslage erst beim Start lesen, falls die Karte vorher noch unterwegs war
        a = { x: v.x, y: v.y };
        r0 = v.rotation;
        s0 = v.scale.x || 1;
        // über anderen Karten fliegen, und nicht mehr antippbar (Rundenende)
        v.zIndex = 1000 + i;
        v.eventMode = 'none';
        if (playsSound(i, n, COLLECT.sfxEveryAbove)) sfx.draw();
      },
      frame: (t) => {
        const e = easeInOutCubic(t);
        const p = arcPoint(a, target, e, COLLECT.arcLift, COLLECT.arcFullDist);
        v.position.set(p.x, p.y);
        v.rotation = lerp(r0, sign * COLLECT.endRot, e);
        const sc = lerp(s0, COLLECT.endScale, e);
        const f = flipState(t, COLLECT.flipStart, COLLECT.flipEnd);
        v.setBackShown(f.second);
        v.scale.set(sc * f.scaleX, sc);
        v.alpha = t > COLLECT.fadeFrom ? 1 - (t - COLLECT.fadeFrom) / (1 - COLLECT.fadeFrom) : 1;
      },
      finish: () => arrive(v),
    };
  });
  try {
    await runFlights(flights);
  } finally {
    // Karten, deren Ablauf abbrach, werden trotzdem abgegeben, damit keine Ansicht übrig bleibt
    for (const f of flights) {
      if (f.finished) continue;
      f.finished = true;
      if (!f.gone()) f.finish();
    }
    if (opts.count && n > 0) opts.count.set(opts.count.to);
  }
  await wait(COLLECT.settleMs);
}
