import { BELLS, MUSIC, type TrackDef } from '../data/music';
import { composeSegment, mulberry32 } from './musicScore';

// Synthese der Hintergrundmusik. Alles läuft über einen eigenen Bus pro Stück
// (Hall, Echo, Ein und Ausblenden), damit ein Wechsel des Stücks sauber überblendet.
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
}

/** Halbkosinus von 0 nach 1, für weiche Ein und Ausblendungen ohne Knackser */
function curve(from: number, to: number, points = 48): Float32Array {
  const c = new Float32Array(points);
  for (let i = 0; i < points; i++) c[i] = from + (to - from) * (0.5 - 0.5 * Math.cos((Math.PI * i) / (points - 1)));
  return c;
}

/** Eigener Nachhall: abklingendes, leicht abgedunkeltes Rauschen, fester Seed */
function impulse(ctx: Ctx, seconds: number, decay: number): AudioBuffer {
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
}

export function createBus(ctx: Ctx, track: TrackDef, out: AudioNode): MusicBus {
  const input = ctx.createGain();
  const level = ctx.createGain();
  level.gain.value = track.level;
  const fade = ctx.createGain();
  fade.gain.value = 0;

  const dry = ctx.createGain();
  input.connect(dry);
  dry.connect(level);

  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx, track.reverb.seconds, track.reverb.decay);
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

  level.connect(fade);
  fade.connect(out);

  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const rng = mulberry32(7);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = rng() * 2 - 1;

  return { input, fade, noise, sources: new Set(), nodes: [input, dry, conv, wet, delay, tone, feedback, echoWet, level, fade] };
}

function reg(bus: MusicBus, s: AudioScheduledSourceNode) {
  bus.sources.add(s);
  s.onended = () => bus.sources.delete(s);
}

/** Weiche Fläche: Akkordtöne mit mehreren leicht verstimmten Stimmen durch einen langsam wandernden Tiefpass */
function pad(ctx: Ctx, bus: MusicBus, track: TrackDef, freqs: number[], t0: number) {
  const p = track.pad;
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

  const per = 1 / (freqs.length * p.voices);
  for (const f of freqs) {
    for (let v = 0; v < p.voices; v++) {
      const osc = ctx.createOscillator();
      osc.type = p.wave;
      osc.frequency.value = f;
      osc.detune.value = (v - (p.voices - 1) / 2) * p.detune;
      const g = ctx.createGain();
      g.gain.value = per;
      osc.connect(g);
      g.connect(filter);
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
export function scheduleSegment(ctx: Ctx, bus: MusicBus, track: TrackDef, index: number, t0: number, seed: number) {
  const seg = composeSegment(track, index, seed);
  pad(ctx, bus, track, seg.chord, t0);
  air(ctx, bus, track, t0);
  for (const b of seg.bells) bell(ctx, bus, track, b.freq, b.gain, b.pan, t0 + b.t);
}

/** Plant ein ganzes Stück im Voraus, für Hörproben im OfflineAudioContext */
export function scheduleTrack(ctx: Ctx, track: TrackDef, out: AudioNode, seconds: number, seed: number): MusicBus {
  const bus = createBus(ctx, track, out);
  bus.fade.gain.setValueAtTime(0, 0);
  bus.fade.gain.linearRampToValueAtTime(1, MUSIC.fadeInSec);
  for (let i = 0; i * track.chordSec < seconds; i++) scheduleSegment(ctx, bus, track, i, 0.1 + i * track.chordSec, seed);
  return bus;
}

/** Spielt die Musik live: plant die Abschnitte kurz vor ihrem Beginn, überblendet beim Wechsel. */
export class MusicPlayer {
  private run: { track: TrackDef; bus: MusicBus; next: number; index: number; timer: ReturnType<typeof setInterval>; seed: number } | null = null;

  constructor(private ctx: AudioContext, private out: AudioNode) {}

  /** ID des laufenden Stücks */
  get playing(): string | null {
    return this.run?.track.id ?? null;
  }

  play(track: TrackDef, seed = Math.floor(Math.random() * 0x7fffffff)) {
    if (this.run?.track.id === track.id) return;
    this.stop();
    const now = this.ctx.currentTime;
    const bus = createBus(this.ctx, track, this.out);
    bus.fade.gain.setValueAtTime(0, now);
    bus.fade.gain.linearRampToValueAtTime(1, now + MUSIC.fadeInSec);
    const run = { track, bus, next: now + 0.1, index: 0, seed, timer: setInterval(() => this.tick(), MUSIC.tickMs) };
    this.run = run;
    this.tick();
  }

  stop() {
    const run = this.run;
    if (!run) return;
    this.run = null;
    clearInterval(run.timer);
    const now = this.ctx.currentTime;
    const { bus } = run;
    bus.fade.gain.cancelScheduledValues(now);
    bus.fade.gain.setValueAtTime(bus.fade.gain.value, now);
    bus.fade.gain.linearRampToValueAtTime(0, now + MUSIC.fadeOutSec);
    // Nach dem Ausblenden alle noch geplanten Stimmen beenden und den Bus abbauen
    setTimeout(() => {
      for (const s of bus.sources) {
        try {
          s.stop();
        } catch {
          /* schon beendet */
        }
      }
      for (const n of bus.nodes) n.disconnect();
    }, (MUSIC.fadeOutSec + 0.3) * 1000);
  }

  private tick() {
    const run = this.run;
    if (!run) return;
    while (run.next < this.ctx.currentTime + MUSIC.lookaheadSec) {
      scheduleSegment(this.ctx, run.bus, run.track, run.index, run.next, run.seed);
      run.next += run.track.chordSec;
      run.index++;
    }
  }
}
