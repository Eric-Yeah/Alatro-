import { BELLS, MUSIC, type TrackDef } from '../data/music';
import { composeSegment, mulberry32, MusicPlanner, type PlanItem } from './musicScore';

// Synthese der Hintergrundmusik. Alles läuft über einen eigenen Bus pro Stück
// (Hochpass, Hall, Echo, Ein und Ausblenden), damit ein Wechsel des Stücks sauber überblendet.
// Die Funktionen nehmen einen BaseAudioContext, darum laufen sie live und im OfflineAudioContext.

type Ctx = BaseAudioContext;

export interface MusicBus {
  /** Alle Stimmen hängen hier */
  input: GainNode;
  /** Ein und Ausblenden, danach der Ausgang */
  fade: GainNode;
  noise: AudioBuffer;
  sources: Set<AudioScheduledSourceNode>;
  nodes: AudioNode[];
  disposed: boolean;
}

/** Halbkosinus von `from` nach `to`, für weiche Ein und Ausblendungen ohne Knackser */
function curve(from: number, to: number, points = 48): Float32Array {
  const c = new Float32Array(points);
  for (let i = 0; i < points; i++) c[i] = from + (to - from) * (0.5 - 0.5 * Math.cos((Math.PI * i) / (points - 1)));
  return c;
}

// Hall und Rauschen sind pro Kontext und Größe gleich, werden darum nur einmal berechnet
const buffers = new WeakMap<Ctx, Map<string, AudioBuffer>>();
function cached(ctx: Ctx, key: string, make: () => AudioBuffer): AudioBuffer {
  let m = buffers.get(ctx);
  if (!m) buffers.set(ctx, (m = new Map()));
  let b = m.get(key);
  if (!b) m.set(key, (b = make()));
  return b;
}

/** Eigener Nachhall: abklingendes, leicht abgedunkeltes Rauschen, fester Seed */
function impulse(ctx: Ctx, seconds: number, decay: number): AudioBuffer {
  return cached(ctx, `ir${seconds}:${decay}`, () => {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const rng = mulberry32(ch + 11);
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        lp += (rng() * 2 - 1 - lp) * 0.4;
        d[i] = lp * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  });
}

function noiseBuffer(ctx: Ctx): AudioBuffer {
  return cached(ctx, 'noise', () => {
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const rng = mulberry32(7);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = rng() * 2 - 1;
    return noise;
  });
}

export function createBus(ctx: Ctx, track: TrackDef, out: AudioNode, lite = false): MusicBus {
  const input = ctx.createGain();
  const level = ctx.createGain();
  level.gain.value = track.level;
  const fade = ctx.createGain();
  fade.gain.value = 0;

  // Kein Dröhnen: unter dem tiefsten Ton wird alles abgeschnitten, auch im Hall und Echo
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = MUSIC.highpass;
  hp.Q.value = 0.5;

  const dry = ctx.createGain();
  input.connect(dry);
  dry.connect(level);

  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx, track.reverb.seconds * (lite ? MUSIC.lite.reverbFactor : 1), track.reverb.decay);
  const wet = ctx.createGain();
  wet.gain.value = track.reverb.wet;
  input.connect(conv);
  conv.connect(wet);
  wet.connect(level);

  const delay = ctx.createDelay(2);
  delay.delayTime.value = track.echo.time;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 2500;
  const feedback = ctx.createGain();
  feedback.gain.value = track.echo.feedback;
  const echoWet = ctx.createGain();
  echoWet.gain.value = track.echo.wet;
  input.connect(delay);
  delay.connect(tone);
  tone.connect(feedback);
  feedback.connect(delay);
  tone.connect(echoWet);
  echoWet.connect(level);

  level.connect(hp);
  hp.connect(fade);
  fade.connect(out);

  return { input, fade, noise: noiseBuffer(ctx), sources: new Set(), nodes: [input, dry, conv, wet, delay, tone, feedback, echoWet, level, hp, fade], disposed: false };
}

function reg(bus: MusicBus, s: AudioScheduledSourceNode) {
  bus.sources.add(s);
  s.onended = () => bus.sources.delete(s);
}

/** Weiche Fläche: Akkordtöne mit mehreren leicht verstimmten Stimmen (links und rechts verteilt) durch einen langsam wandernden Tiefpass */
function pad(ctx: Ctx, bus: MusicBus, track: TrackDef, freqs: number[], t0: number, lite: boolean) {
  const p = track.pad;
  const voices = lite ? MUSIC.lite.voices : p.voices;
  const end = t0 + track.chordSec + p.release;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = p.lowpass;
  filter.Q.value = 0.4;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = p.lfoHz;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = p.lfoDepth;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start(t0);
  lfo.stop(end + 0.1);
  reg(bus, lfo);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.setValueCurveAtTime(curve(0, p.gain), t0, p.attack);
  env.gain.setValueAtTime(p.gain, t0 + track.chordSec);
  env.gain.setValueCurveAtTime(curve(p.gain, 0), t0 + track.chordSec, p.release);
  filter.connect(env);
  env.connect(bus.input);

  const stereo = typeof ctx.createStereoPanner === 'function' && voices > 1;
  const per = 1 / (freqs.length * voices);
  for (const f of freqs) {
    for (let v = 0; v < voices; v++) {
      const osc = ctx.createOscillator();
      osc.type = p.wave;
      osc.frequency.value = f;
      osc.detune.value = (v - (voices - 1) / 2) * p.detune;
      const g = ctx.createGain();
      g.gain.value = per;
      osc.connect(g);
      if (stereo) {
        const sp = ctx.createStereoPanner();
        sp.pan.value = ((v / (voices - 1)) * 2 - 1) * p.width;
        g.connect(sp);
        sp.connect(filter);
      } else {
        g.connect(filter);
      }
      osc.start(t0);
      osc.stop(end + 0.1);
      reg(bus, osc);
    }
  }
}

/** Eine Glocke aus Teiltönen mit eigener Abklingzeit, im Stereobild verteilt */
function bell(ctx: Ctx, bus: MusicBus, track: TrackDef, freq: number, gain: number, pan: number, t0: number) {
  const m = track.melody;
  const kind = BELLS[m.kind];
  const sum = kind.partials.reduce((a, p) => a + p[1], 0);
  let dest: AudioNode = bus.input;
  if (typeof ctx.createStereoPanner === 'function') {
    const sp = ctx.createStereoPanner();
    sp.pan.value = pan;
    sp.connect(bus.input);
    dest = sp;
  }
  const add = (f: number, amp: number, decay: number) => {
    if (f > 9000) return;
    const osc = ctx.createOscillator();
    osc.frequency.value = f;
    const g = ctx.createGain();
    const peak = Math.max(0.0002, (gain * amp) / sum);
    const dur = Math.max(0.2, m.decay * decay);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + kind.attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + kind.attack + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + kind.attack + dur + 0.1);
    reg(bus, osc);
  };
  for (const [ratio, amp, decay] of kind.partials) add(freq * ratio, amp, decay);
  if (kind.beat > 0) add(freq + kind.beat, 0.6, 1);
}

/** Leiser Hauch über die Dauer des Akkords */
function air(ctx: Ctx, bus: MusicBus, track: TrackDef, t0: number) {
  const a = track.air;
  if (!a) return;
  const len = track.chordSec + track.pad.release;
  const src = ctx.createBufferSource();
  src.buffer = bus.noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(a.freq * 0.8, t0);
  f.frequency.linearRampToValueAtTime(a.freq * 1.25, t0 + len);
  f.Q.value = a.q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.setValueCurveAtTime(curve(0, a.gain), t0, len / 2);
  g.gain.setValueCurveAtTime(curve(a.gain, 0), t0 + len / 2, len / 2);
  src.connect(f);
  f.connect(g);
  g.connect(bus.input);
  src.start(t0);
  src.stop(t0 + len + 0.1);
  reg(bus, src);
}

/** Plant einen Abschnitt (einen Akkord mit Glocken und Hauch) ab dem Zeitpunkt t0 */
export function scheduleSegment(ctx: Ctx, bus: MusicBus, track: TrackDef, index: number, t0: number, seed: number, lite = false) {
  const seg = composeSegment(track, index, seed);
  pad(ctx, bus, track, seg.chord, t0, lite);
  air(ctx, bus, track, t0);
  for (const b of seg.bells) bell(ctx, bus, track, b.freq, b.gain, b.pan, t0 + b.t);
}

/** Blendet einen Bus ab dem Zeitpunkt `at` über `sec` Sekunden aus und baut ihn danach ab */
function fadeOutBus(ctx: Ctx, bus: MusicBus, at: number, sec: number, done: (b: MusicBus) => void) {
  const now = ctx.currentTime;
  const t = Math.max(at, now);
  const g = bus.fade.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(at > now ? 1 : g.value, t);
  g.linearRampToValueAtTime(0, t + sec);
  // Nach dem Ausblenden alle noch geplanten Stimmen beenden und den Bus abbauen
  setTimeout(() => {
    if (bus.disposed) return;
    bus.disposed = true;
    for (const s of bus.sources) {
      try {
        s.stop();
      } catch {
        /* schon beendet */
      }
    }
    for (const n of bus.nodes) {
      try {
        n.disconnect();
      } catch {
        /* schon getrennt */
      }
    }
    done(bus);
  }, (t - now + sec + 0.3) * 1000);
}

/**
 * Führt einen Plan aus: erzeugt pro Stück einen Bus, plant die Abschnitte und überblendet beim Wechsel.
 * Live ruft ein Zeitgeber `pump` regelmäßig auf, im OfflineAudioContext genügt ein Aufruf.
 */
export class Conductor {
  private planner: MusicPlanner;
  private current: MusicBus | null = null;
  private live = new Set<MusicBus>();

  constructor(
    private ctx: Ctx,
    private out: AudioNode,
    tracks: readonly TrackDef[],
    startTime: number,
    private seed: number,
    private lite = false,
    startIdx = 0,
  ) {
    this.planner = new MusicPlanner(tracks, startTime, MUSIC.mixChords, startIdx);
  }

  /** Plant alle Abschnitte, die vor `until` beginnen */
  pump(until: number) {
    while (this.planner.time < until) {
      const item = this.planner.step();
      if (item.first) this.begin(item);
      scheduleSegment(this.ctx, this.current!, item.track, item.index, item.time, (this.seed + item.stay * 7919) | 0, this.lite);
    }
  }

  private begin(item: PlanItem) {
    const prev = this.current;
    const bus = createBus(this.ctx, item.track, this.out, this.lite);
    this.live.add(bus);
    const fade = prev ? MUSIC.mixInSec : MUSIC.fadeInSec;
    bus.fade.gain.setValueAtTime(0, item.time);
    bus.fade.gain.linearRampToValueAtTime(1, item.time + fade);
    // Das alte Stück läuft aus (Pad Release, Glockenklang), erst am Ende wird der Bus geschlossen
    if (prev) fadeOutBus(this.ctx, prev, item.time + MUSIC.mixFadeSec - MUSIC.mixOutSec, MUSIC.mixOutSec, (b) => this.live.delete(b));
    this.current = bus;
  }

  /** Blendet alles jetzt aus (auch Stücke, die gerade überblendet werden) */
  fadeOutAll(sec: number) {
    for (const bus of this.live) fadeOutBus(this.ctx, bus, this.ctx.currentTime, sec, (b) => this.live.delete(b));
  }
}

/** Plant Musik im Voraus für `seconds` Sekunden, für Hörproben im OfflineAudioContext */
export function scheduleMusic(ctx: Ctx, tracks: readonly TrackDef[], out: AudioNode, seconds: number, seed: number, startIdx = 0, lite = false) {
  const c = new Conductor(ctx, out, tracks, 0.1, seed, lite, startIdx);
  c.pump(seconds);
  return c;
}

/** Spielt die Musik live: plant die Abschnitte kurz vor ihrem Beginn, überblendet beim Wechsel. */
export class MusicPlayer {
  private run: { choice: string; lite: boolean; conductor: Conductor; timer: ReturnType<typeof setInterval> } | null = null;

  constructor(private ctx: AudioContext, private out: AudioNode) {}

  /** Auswahl, die gerade läuft (ID eines Stücks oder Mix) */
  get playing(): string | null {
    return this.run?.choice ?? null;
  }

  /** Spielt die Stücke der Auswahl, bei mehreren im Wechsel. Gleiche Auswahl ändert nichts. */
  play(choice: string, tracks: readonly TrackDef[], lite = false) {
    if (this.run?.choice === choice && this.run.lite === lite) return;
    this.stop();
    if (!tracks.length) return;
    const seed = Math.floor(Math.random() * 0x7fffffff);
    const conductor = new Conductor(this.ctx, this.out, tracks, this.ctx.currentTime + 0.1, seed, lite, Math.floor(Math.random() * tracks.length));
    const run = { choice, lite, conductor, timer: setInterval(() => conductor.pump(this.ctx.currentTime + MUSIC.lookaheadSec), MUSIC.tickMs) };
    this.run = run;
    conductor.pump(this.ctx.currentTime + MUSIC.lookaheadSec);
  }

  stop() {
    const run = this.run;
    if (!run) return;
    this.run = null;
    clearInterval(run.timer);
    run.conductor.fadeOutAll(MUSIC.fadeOutSec);
  }
}
