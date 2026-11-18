import { SOUND } from '../data/juice';
import { getSettings } from '../settings';

/**
 * Selbst erzeugte Klänge per WebAudio Synthese (keine Audio Dateien, keine fremden Samples).
 * Safari startet Audio erst nach einer Berührung, `unlockAudio` hängt sich deshalb an die erste Eingabe.
 */

export type SfxName =
  | 'select' | 'deselect' | 'click' | 'play' | 'discard' | 'deal' | 'chip' | 'mult' | 'xmult' | 'money'
  | 'total' | 'buy' | 'sell' | 'reroll' | 'use' | 'edition' | 'win' | 'lose' | 'roundWon' | 'rescue';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

const semi = (base: number, n: number) => base * Math.pow(2, n / 12);

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  master = ctx!.createGain();
  master!.connect(ctx!.destination);
  const len = Math.floor(ctx!.sampleRate * 0.5);
  noiseBuf = ctx!.createBuffer(1, len, ctx!.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Wird bei der ersten Berührung aufgerufen und entsperrt den Ton */
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') void c.resume();
}

if (typeof window !== 'undefined') {
  const once = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', once, true);
    window.removeEventListener('keydown', once, true);
  };
  window.addEventListener('pointerdown', once, true);
  window.addEventListener('keydown', once, true);
}

interface ToneOpts {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  /** Zielfrequenz am Ende (Gleiten) */
  slideTo?: number;
  /** Verzögerung in Sekunden */
  delay?: number;
  attack?: number;
}

function tone(c: AudioContext, o: ToneOpts) {
  const t0 = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slideTo), t0 + o.dur);
  const peak = o.gain ?? 0.3;
  const a = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(g).connect(master!);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

function noise(c: AudioContext, dur: number, from: number, to: number, gain: number, delay = 0) {
  const t0 = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + dur * 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master!);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

/**
 * Spielt einen Klang. `step` ist der Zählschritt beim Scoring, die Tonhöhe steigt mit jedem Schritt.
 */
export function sfx(name: SfxName, step = 0) {
  const s = getSettings();
  if (!s.sound || s.volume <= 0) return;
  const c = ensure();
  if (!c || c.state !== 'running') return;
  master!.gain.value = SOUND.master * s.volume;
  const n = Math.min(step, SOUND.maxSteps) * SOUND.semitonesPerStep;
  switch (name) {
    case 'select': tone(c, { freq: 520, slideTo: 700, dur: 0.07, type: 'triangle', gain: 0.22 }); break;
    case 'deselect': tone(c, { freq: 520, slideTo: 380, dur: 0.07, type: 'triangle', gain: 0.18 }); break;
    case 'click': tone(c, { freq: 440, dur: 0.05, type: 'square', gain: 0.08 }); break;
    case 'play': noise(c, 0.18, 1800, 500, 0.3); tone(c, { freq: 180, slideTo: 90, dur: 0.12, type: 'sine', gain: 0.3 }); break;
    case 'discard': noise(c, 0.22, 2400, 400, 0.28); break;
    case 'deal': noise(c, 0.06, 3000, 1500, 0.18); tone(c, { freq: 700, dur: 0.03, type: 'square', gain: 0.04 }); break;
    case 'chip': tone(c, { freq: semi(SOUND.chipBase, n), dur: 0.16, type: 'triangle', gain: 0.3 }); break;
    case 'mult': tone(c, { freq: semi(SOUND.multBase, n), dur: 0.2, type: 'square', gain: 0.14 }); tone(c, { freq: semi(SOUND.multBase, n) * 2, dur: 0.14, type: 'triangle', gain: 0.12 }); break;
    case 'xmult': {
      const f = semi(SOUND.multBase, n);
      tone(c, { freq: f, slideTo: f * 2, dur: 0.32, type: 'sawtooth', gain: 0.16 });
      tone(c, { freq: f * 1.5, slideTo: f * 3, dur: 0.32, type: 'triangle', gain: 0.16 });
      noise(c, 0.3, 600, 3000, 0.12);
      break;
    }
    case 'money': tone(c, { freq: SOUND.moneyBase, dur: 0.09, type: 'square', gain: 0.1 }); tone(c, { freq: SOUND.moneyBase * 1.5, dur: 0.18, type: 'square', gain: 0.1, delay: 0.07 }); break;
    case 'total': tone(c, { freq: 140, slideTo: 55, dur: 0.4, type: 'sine', gain: 0.5 }); noise(c, 0.3, 500, 80, 0.2); break;
    case 'buy': tone(c, { freq: 660, dur: 0.08, type: 'triangle', gain: 0.25 }); tone(c, { freq: 990, dur: 0.2, type: 'triangle', gain: 0.25, delay: 0.07 }); break;
    case 'sell': tone(c, { freq: 990, dur: 0.08, type: 'triangle', gain: 0.22 }); tone(c, { freq: 660, dur: 0.2, type: 'triangle', gain: 0.22, delay: 0.07 }); break;
    case 'reroll': for (let i = 0; i < 4; i++) tone(c, { freq: 300 + i * 90, dur: 0.05, type: 'square', gain: 0.07, delay: i * 0.045 }); break;
    case 'use':
      tone(c, { freq: 330, slideTo: 1320, dur: 0.5, type: 'sine', gain: 0.22 });
      tone(c, { freq: 495, slideTo: 1980, dur: 0.5, type: 'triangle', gain: 0.1, delay: 0.05 });
      break;
    case 'edition': for (let i = 0; i < 3; i++) tone(c, { freq: 1568 * (1 + i * 0.25), dur: 0.25, type: 'sine', gain: 0.1, delay: i * 0.06 }); break;
    case 'roundWon': [0, 4, 7, 12].forEach((k, i) => tone(c, { freq: semi(392, k), dur: 0.25, type: 'triangle', gain: 0.25, delay: i * 0.1 })); break;
    case 'win': [0, 4, 7, 12, 16, 19, 24].forEach((k, i) => tone(c, { freq: semi(392, k), dur: 0.4, type: 'triangle', gain: 0.25, delay: i * 0.12 })); break;
    case 'lose': [0, -3, -7, -12].forEach((k, i) => tone(c, { freq: semi(330, k), dur: 0.5, type: 'sawtooth', gain: 0.14, delay: i * 0.22 })); break;
    case 'rescue': [0, 7, 12].forEach((k, i) => tone(c, { freq: semi(523, k), dur: 0.3, type: 'sine', gain: 0.25, delay: i * 0.09 })); break;
  }
}
