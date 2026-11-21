import { getSettings, onSettings } from '../settings';
import { COIN_SOUND } from '../data/coinSound';
import { BLIND_FANFARE } from '../data/report';
import { MUSIC, tracksFor } from '../data/music';
import { scaleFreq } from './juiceMath';
import { MusicPlayer } from './music';
import coinUrl from '../assets/coin.mp3';

// Eigene Klänge per WebAudio Synthese. Einzige Audiodatei ist die Münzaufnahme (src/assets/coin.mp3).
// Der AudioContext startet erst nach der ersten Berührung (iPad Regel).

type Wave = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private coinBuf: AudioBuffer | null = null;
  private music: MusicPlayer | null = null;
  private musicOut: GainNode | null = null;
  private duckGain: GainNode | null = null;

  constructor() {
    onSettings((s) => {
      if (this.master) this.master.gain.value = s.volume;
      this.syncMusic();
    });
    // Im Hintergrund pausiert die Musik (spart Akku), beim Zurückkehren geht es weiter
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx || !this.music?.playing) return;
        if (document.hidden) void this.ctx.suspend().catch(() => {});
        else void this.ctx.resume().catch(() => {});
      });
    }
  }

  /** Startet, wechselt oder beendet die Hintergrundmusik passend zu den Optionen */
  private syncMusic() {
    if (!this.ctx || !this.music || !this.musicOut) return;
    const s = getSettings();
    const tracks = s.volume <= 0 || s.musicVolume <= 0 ? [] : tracksFor(s.music);
    this.musicOut.gain.setTargetAtTime(s.musicVolume * MUSIC.gainScale, this.ctx.currentTime, 0.05);
    if (tracks.length) this.music.play(s.music, tracks, s.quality === 'sparsam');
    else this.music.stop();
  }

  /** Zieht die Musik kurz leiser, damit große Effekte (Aufschlag, Fanfare) frei stehen */
  private duck() {
    if (!this.ctx || !this.duckGain || !this.music?.playing) return;
    const d = MUSIC.duck;
    const g = this.duckGain.gain;
    const now = this.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(1 - d.amount, now, d.attackSec);
    g.setTargetAtTime(1, now + d.holdSec, d.releaseSec / 3);
  }

  /** Muss aus einer Benutzergeste aufgerufen werden, ist danach unschädlich. */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext ?? (window as any).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = getSettings().volume;
        const comp = this.ctx.createDynamicsCompressor();
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
        this.musicOut = this.ctx.createGain();
        this.musicOut.gain.value = getSettings().musicVolume * MUSIC.gainScale;
        this.musicOut.connect(this.master);
        this.duckGain = this.ctx.createGain();
        this.duckGain.connect(this.musicOut);
        this.music = new MusicPlayer(this.ctx, this.duckGain);
        this.syncMusic();
        void this.loadCoin();
      }
      // iOS meldet nach einer Unterbrechung (Appwechsel, Anruf) den Zustand "interrupted", nicht nur "suspended"
      if (this.ctx.state !== 'running') void this.ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
    }
  }

  /** Lädt und dekodiert die Münzaufnahme einmal, bis dahin klingt die Synthese */
  private async loadCoin() {
    try {
      const ctx = this.ctx;
      if (!ctx) return;
      const res = await fetch(coinUrl);
      this.coinBuf = await ctx.decodeAudioData(await res.arrayBuffer());
    } catch {
      this.coinBuf = null;
    }
  }

  private get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running' && !!this.master && getSettings().volume > 0;
  }

  /** Einzelner Ton mit Hüllkurve, optional mit Tonhöhengleiten und Tiefpass. */
  private tone(freq: number, dur: number, type: Wave = 'sine', gain = 0.3, opts: { slideTo?: number; delay?: number; lowpass?: number; attack?: number } = {}) {
    if (!this.ready) return;
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), t0 + dur);
    const attack = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node: AudioNode = osc;
    if (opts.lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.lowpass;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.master!);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** Rauschstoß mit Bandpass, für Wischen, Schläge und Blubbern. */
  private noise(dur: number, gain = 0.2, opts: { freq?: number; q?: number; delay?: number; sweepTo?: number } = {}) {
    if (!this.ready) return;
    const ctx = this.ctx!;
    if (!this.noiseBuf) {
      this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(opts.freq ?? 1800, t0);
    if (opts.sweepTo) f.frequency.exponentialRampToValueAtTime(opts.sweepTo, t0 + dur);
    f.Q.value = opts.q ?? 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master!);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // ───────────────────────────────────────────── Oberfläche

  click() { this.tone(520, 0.06, 'square', 0.08, { slideTo: 360 }); }
  select(on: boolean) { this.tone(on ? 700 : 460, 0.07, 'triangle', 0.14); }
  deny() { this.tone(180, 0.12, 'square', 0.1, { slideTo: 120 }); }
  draw() { this.noise(0.07, 0.07, { freq: 2600, q: 1.2 }); }
  whoosh() { this.noise(0.22, 0.12, { freq: 500, sweepTo: 3200, q: 0.6 }); }
  discard() { this.noise(0.2, 0.1, { freq: 2800, sweepTo: 600, q: 0.7 }); }
  modal() { this.tone(330, 0.1, 'triangle', 0.08, { slideTo: 440 }); }

  // ───────────────────────────────────────────── Punkte zählen

  /** Chips: heller Ton, steigt mit der Zählstufe */
  chips(step: number) { this.tone(scaleFreq(step) * 2, 0.16, 'triangle', 0.22); }
  /** Mult: rauerer, tieferer Ton */
  mult(step: number) { this.tone(scaleFreq(step), 0.2, 'sawtooth', 0.12, { lowpass: 1800 }); }
  /** X Mult: Akkord mit Schlag */
  xmult(step: number) {
    this.duck();
    const f = scaleFreq(step);
    this.tone(f, 0.34, 'sawtooth', 0.14, { lowpass: 2200 });
    this.tone(f * 1.5, 0.34, 'square', 0.07, { lowpass: 2200 });
    this.tone(f * 2, 0.4, 'triangle', 0.14);
    this.noise(0.12, 0.08, { freq: 900, q: 0.5 });
  }
  money() {
    this.tone(1318, 0.09, 'square', 0.1);
    this.tone(1760, 0.2, 'square', 0.1, { delay: 0.08 });
  }
  /** Ein Münzklirren (Geld einkassieren). `pitch` verstimmt leicht (1 ist Grundton), `gain` skaliert die Lautstärke. */
  coin(pitch = 1, gain = 1, delay = 0) {
    const c = COIN_SOUND;
    if (this.coinBuf && this.ready) {
      const ctx = this.ctx!;
      const src = ctx.createBufferSource();
      src.buffer = this.coinBuf;
      src.playbackRate.value = pitch;
      const g = ctx.createGain();
      g.gain.value = c.sampleGain * gain;
      src.connect(g);
      g.connect(this.master!);
      src.start(ctx.currentTime + delay);
      return;
    }
    const base = c.baseHz * pitch;
    this.noise(c.click.dur, c.click.gain * gain, { freq: c.click.freq, q: 1.5, delay });
    const ring = (hz: number, vol: number, d: number) => {
      c.partials.forEach((p, i) => this.tone(hz * p, c.partialDecay[i], 'sine', c.partialGain[i] * vol * gain, { delay: d, attack: 0.002 }));
    };
    ring(base, 1, delay);
    ring(base * c.ching.ratio, c.ching.gain, delay + c.ching.delay);
  }
  /** Münzkaskade für einen Geldbetrag: je mehr Dollar, desto mehr Klirren (begrenzt), leiser werdend */
  coins(dollars: number) {
    const c = COIN_SOUND.burst;
    const n = Math.max(1, Math.min(c.maxCoins, Math.round(Math.max(0, dollars) * COIN_SOUND.coinsPerDollar)));
    for (let i = 0; i < n; i++) {
      const pitch = 1 + (Math.random() * 2 - 1) * c.pitchJitter;
      this.coin(pitch, 1 - (i / n) * (1 - c.fade), i * c.spacing);
    }
  }
  retrigger(step: number) { this.tone(scaleFreq(step) * 4, 0.07, 'square', 0.08, { slideTo: scaleFreq(step) * 6 }); }
  message(step: number) { this.tone(scaleFreq(step) * 2, 0.1, 'sine', 0.14); }

  /** Aufschlag der Gesamtpunkte, tiefer und lauter je höher die Stufe (0 bis 1) */
  total(boom: number) {
    this.duck();
    this.tone(150, 0.45, 'sine', 0.35 * (0.5 + boom * 0.5), { slideTo: 42 });
    this.noise(0.25 + boom * 0.3, 0.12 + boom * 0.14, { freq: 300, q: 0.5 });
    if (boom > 0.6) {
      [523, 659, 784].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.12 * boom, { delay: 0.05 + i * 0.05 }));
    }
  }
  /** Kurzes Zählen der Rundenpunkte */
  tick() { this.tone(900, 0.03, 'square', 0.04); }

  // ───────────────────────────────────────────── Spielfluss

  win(kind: 'small' | 'big' | 'boss' = 'small', big = false) {
    this.duck();
    const steps = BLIND_FANFARE[kind];
    steps.forEach((semi, i) => this.tone(523 * Math.pow(2, semi / 12), 0.28, 'triangle', 0.2, { delay: i * 0.11 }));
    const top = 523 * Math.pow(2, steps[steps.length - 1] / 12);
    this.tone(top, 0.7, 'sine', 0.14, { delay: steps.length * 0.11 });
    // Großer Überschuss: zusätzlicher heller Schimmer obenauf
    if (big) [2, 2.5, 3].forEach((m, i) => this.tone(523 * m, 0.5, 'sine', 0.1, { delay: 0.1 + i * 0.07 }));
  }
  /** Ziel des Blinds beim Hochzählen erreicht: kurzer, heller Zweiklang */
  goal() {
    this.duck();
    this.tone(880, 0.12, 'triangle', 0.16);
    this.tone(1318, 0.3, 'triangle', 0.16, { delay: 0.09 });
  }
  lose() {
    this.duck();
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.12, { delay: i * 0.18, lowpass: 900 }));
  }
  victory() {
    this.duck();
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.2, { delay: i * 0.1 }));
    this.tone(1568, 1, 'sine', 0.16, { delay: 0.6 });
  }
  /** Erfolg freigeschaltet: kurzer, heller Dreiklang mit Nachklang */
  achievement() {
    this.duck();
    [784, 988, 1319].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.16, { delay: i * 0.09 }));
    this.tone(1976, 0.7, 'sine', 0.1, { delay: 0.3 });
  }
  blindStart(kind: 'small' | 'big' | 'boss') {
    if (kind === 'boss') {
      this.tone(98, 0.7, 'sawtooth', 0.16, { slideTo: 82, lowpass: 600 });
      this.tone(104, 0.7, 'sawtooth', 0.12, { slideTo: 86, lowpass: 600 });
    } else {
      this.tone(kind === 'big' ? 262 : 330, 0.3, 'triangle', 0.16, { slideTo: kind === 'big' ? 392 : 440 });
    }
  }

  // ───────────────────────────────────────────── Shop

  buy() {
    this.tone(784, 0.08, 'square', 0.1);
    this.tone(1175, 0.16, 'square', 0.1, { delay: 0.07 });
    this.tone(1568, 0.22, 'triangle', 0.1, { delay: 0.14 });
  }
  sell() {
    this.tone(1175, 0.08, 'square', 0.1);
    this.tone(784, 0.18, 'square', 0.1, { delay: 0.07 });
  }
  reroll() {
    for (let i = 0; i < 4; i++) this.tone(300 + Math.random() * 500, 0.04, 'square', 0.06, { delay: i * 0.05 });
  }
  packOpen() {
    this.duck();
    this.noise(0.5, 0.14, { freq: 400, sweepTo: 5000, q: 0.7 });
    [659, 880, 1175].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.12, { delay: 0.25 + i * 0.07 }));
  }
  pick() {
    this.tone(880, 0.09, 'triangle', 0.16);
    this.tone(1320, 0.18, 'triangle', 0.14, { delay: 0.07 });
  }

  // ───────────────────────────────────────────── Consumables

  /** Sternbild: heller Glockenklang */
  starUse() {
    [1047, 1568, 2093, 1319].forEach((f, i) => this.tone(f, 0.6, 'sine', 0.1, { delay: i * 0.07 }));
  }
  /** Elixier: Blubbern und steigender Ton */
  elixirUse() {
    for (let i = 0; i < 6; i++) this.tone(300 + Math.random() * 300, 0.1, 'sine', 0.12, { slideTo: 700 + Math.random() * 500, delay: i * 0.06 });
    this.tone(523, 0.5, 'triangle', 0.1, { slideTo: 1047, delay: 0.2 });
  }
  /** Omen: tiefer, unheimlicher Klang */
  omenUse() {
    this.tone(110, 0.9, 'sawtooth', 0.14, { slideTo: 70, lowpass: 500 });
    this.tone(116.5, 0.9, 'sawtooth', 0.1, { slideTo: 73, lowpass: 500 });
    this.noise(0.6, 0.06, { freq: 200, q: 0.4 });
  }
}

export const sfx = new Sfx();
