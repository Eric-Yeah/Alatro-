import { Filter, Graphics } from 'pixi.js';
import { BOSS_TINT_MIX, MOODS, MOOD_FADE_S, type BgMood, type MoodDef } from '../data/juice';
import { FILTER_VERTEX } from './glsl';

// Own design: slow domain-warped "ink in water" bands, quantised to a coarse pixel grid,
// in the game's indigo / plum / teal palette, with a soft vignette.
const fragment = /* glsl */ `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uAccent;
uniform float uContrast;
uniform float uVignette;
uniform float uPulse;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main(void) {
  vec2 px = vTextureCoord * uRes;
  float cell = 4.0;
  px = floor(px / cell) * cell;
  vec2 uv = px / uRes.y;

  float t = uTime * 0.04;
  vec2 q = vec2(fbm(uv * 1.6 + t), fbm(uv * 1.6 - t + 4.2));
  vec2 r = vec2(fbm(uv * 2.0 + 3.0 * q + vec2(1.7, 9.2) + t * 1.5), fbm(uv * 2.0 + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(uv * 1.4 + 2.5 * r);

  float bands = floor(f * 7.0) / 7.0;
  vec3 col = mix(uDeep, uMid, smoothstep(0.25, 0.75, bands));
  col = mix(col, uAccent, smoothstep(0.55, 0.95, r.x * bands));
  // Kontrast um die mittlere Helligkeit, Atmen bei dramatischen Stimmungen
  col = (col - 0.15) * uContrast + 0.15;
  col *= 1.0 + uPulse * sin(uTime * 1.6);

  vec2 c = vTextureCoord - 0.5;
  col *= 1.0 - dot(c, c) * uVignette;
  finalColor = vec4(col, 1.0);
}
`;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function cloneMood(m: MoodDef): MoodDef {
  return { ...m, deep: [...m.deep], mid: [...m.mid], accent: [...m.accent] };
}

/** Mischt eine Hex Farbe (0xRRGGBB) anteilig in einen RGB Wert 0 bis 1. */
function tintTo(base: [number, number, number], hex: number, mix: number, dark: number): [number, number, number] {
  const rgb = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => (v / 255) * dark);
  return [lerp(base[0], rgb[0], mix), lerp(base[1], rgb[1], mix), lerp(base[2], rgb[2], mix)];
}

export class Background extends Graphics {
  private filter: Filter;
  /** Phase der Animation, läuft mit dem Tempo der aktuellen Stimmung */
  private phase = 0;
  private cur: MoodDef = cloneMood(MOODS.menu);
  private target: MoodDef = cloneMood(MOODS.menu);

  constructor() {
    super();
    this.filter = Filter.from({
      gl: { vertex: FILTER_VERTEX, fragment, name: 'alatro-bg' },
      resources: {
        bgUniforms: {
          uTime: { value: 0, type: 'f32' },
          uRes: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
          uDeep: { value: new Float32Array(this.cur.deep), type: 'vec3<f32>' },
          uMid: { value: new Float32Array(this.cur.mid), type: 'vec3<f32>' },
          uAccent: { value: new Float32Array(this.cur.accent), type: 'vec3<f32>' },
          uContrast: { value: this.cur.contrast, type: 'f32' },
          uVignette: { value: this.cur.vignette, type: 'f32' },
          uPulse: { value: this.cur.pulse, type: 'f32' },
        },
      },
    });
    this.filters = [this.filter];
  }

  /** Wechselt weich zur Stimmung. Bei Bossen färbt die Bossfarbe die Stimmung leicht. */
  setMood(mood: BgMood, bossColor?: number) {
    const t = cloneMood(MOODS[mood]);
    if (mood === 'boss' && bossColor !== undefined) {
      t.mid = tintTo(t.mid, bossColor, BOSS_TINT_MIX, 0.45);
      t.accent = tintTo(t.accent, bossColor, BOSS_TINT_MIX * 0.5, 0.3);
    }
    this.target = t;
  }

  resize(w: number, h: number) {
    this.clear().rect(0, 0, w, h).fill(0x1b1530);
    this.filterArea = undefined as any;
    const u = this.filter.resources.bgUniforms.uniforms;
    u.uRes[0] = w;
    u.uRes[1] = h;
  }

  update(deltaMS: number) {
    const dt = deltaMS / 1000;
    const k = Math.min(1, dt / MOOD_FADE_S);
    const c = this.cur;
    const t = this.target;
    for (let i = 0; i < 3; i++) {
      c.deep[i] = lerp(c.deep[i], t.deep[i], k);
      c.mid[i] = lerp(c.mid[i], t.mid[i], k);
      c.accent[i] = lerp(c.accent[i], t.accent[i], k);
    }
    c.speed = lerp(c.speed, t.speed, k);
    c.contrast = lerp(c.contrast, t.contrast, k);
    c.vignette = lerp(c.vignette, t.vignette, k);
    c.pulse = lerp(c.pulse, t.pulse, k);
    this.phase += dt * c.speed;
    const u = this.filter.resources.bgUniforms.uniforms;
    u.uTime = this.phase;
    u.uDeep.set(c.deep);
    u.uMid.set(c.mid);
    u.uAccent.set(c.accent);
    u.uContrast = c.contrast;
    u.uVignette = c.vignette;
    u.uPulse = c.pulse;
  }
}
