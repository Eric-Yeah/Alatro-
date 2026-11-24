import { Filter, Graphics } from 'pixi.js';
import { BOSS_TINT_MIX, MOODS, MOOD_FADE_S, type BgMood, type MoodDef } from '../data/juice';
import { FILTER_VERTEX } from './glsl';

// Eigener Entwurf: langsam ziehende Schlieren in wenigen harten Farbstufen (kein Verlauf),
// auf einem groben Pixelraster, dazu kleine scharfe Sterne. Die Konturen der Stufen sind
// ohne Weichzeichnung, damit das Bild klar und flach wirkt.
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
// Grafikstufe Supernova (uFx 0 = aus, dann bleibt das Bild wie in Voll)
uniform float uFx;
uniform vec2 uPointer;
uniform float uPtrAmt;
uniform vec3 uImpact;
uniform float uImpactAmp;
uniform float uHeat;
uniform float uLite;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

void main(void) {
  vec2 px = vTextureCoord * uRes;
  float cell = 6.0;
  vec2 cellId = floor(px / cell);
  px = cellId * cell;
  vec2 su = px / uRes;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  // Schockwelle: Ring mit Linsen Verzerrung, im Zellraster (Pixel Look)
  float ring = 0.0;
  if (uFx > 0.001 && uImpactAmp > 0.001) {
    vec2 d = (su - uImpact.xy) * asp;
    float dist = length(d);
    float rr = uImpact.z * 0.85;
    float life = max(0.0, 1.0 - uImpact.z / 1.25);
    ring = exp(-pow((dist - rr) * 22.0, 2.0)) * uImpactAmp * life;
    px += normalize(d + 0.0001) * ring * 26.0;
  }
  vec2 uv = px / uRes.y;

  float t = uTime * 0.035;
  vec2 q = vec2(fbm(uv * 1.3 + t), fbm(uv * 1.3 - t + 4.2));
  float f = fbm(uv * 1.1 + 2.2 * q + vec2(t, -t));

  // fünf harte Stufen von tief nach hell, ohne Übergänge
  float step5 = floor(clamp(f * 1.35 - 0.12, 0.0, 0.999) * 5.0);
  vec3 c0 = uDeep * 0.8;
  vec3 c1 = uDeep;
  vec3 c2 = mix(uDeep, uMid, 0.6);
  vec3 c3 = uMid;
  vec3 c4 = mix(uMid, uAccent, 0.55);
  vec3 col = step5 < 0.5 ? c0 : step5 < 1.5 ? c1 : step5 < 2.5 ? c2 : step5 < 3.5 ? c3 : c4;
  // weiches Leuchten über den harten Stufen (Mischung aus klar und weich)
  col += uAccent * 0.14 * smoothstep(0.5, 0.95, f);
  col = (col - 0.15) * uContrast + 0.15;
  col *= 1.0 + uPulse * sin(uTime * 1.6);
  vec2 vc = vTextureCoord - 0.5;
  col *= 1.0 - dot(vc, vc) * uVignette;

  if (uFx > 0.001) {
    float fx = uFx;
    vec3 glow = mix(uMid, uAccent, 0.65);
    vec2 par = (uPointer - 0.5) * vec2(0.10, 0.07) * uPtrAmt;
    if (uLite < 0.5) {
      // Nebelschleier mit Parallax: drei harte Stufen
      float v = fbm((uv + par) * 2.1 - vec2(uTime * 0.05, -uTime * 0.02) + 7.0);
      float veil = floor(smoothstep(0.52, 0.92, v) * 3.0) / 3.0;
      col += glow * veil * (0.2 + 0.28 * uHeat) * fx;
      // Polarlicht Band, wandert langsam, in drei Stufen
      float wob = fbm(vec2(su.x * 3.0 + uTime * 0.07, uTime * 0.05)) * 0.22;
      float band = exp(-pow((su.y - (0.2 + 0.07 * sin(su.x * 4.2 + uTime * 0.28) + wob)) * 8.0, 2.0));
      band = floor(band * 3.0) / 3.0;
      vec3 aur = mix(vec3(0.25, 1.0, 0.75), vec3(0.65, 0.4, 1.0), su.x);
      col += aur * band * (0.12 + 0.2 * uHeat) * fx;
    }
    // Sternschnuppe: alle paar Sekunden ein Streifen im Zellraster
    float sl = uTime * 0.3;
    float slot = floor(sl);
    float fr = fract(sl);
    float on = step(0.45, hash(vec2(slot, 3.7)));
    vec2 st0 = vec2(hash(vec2(slot, 1.3)) * 0.8 * asp.x, 0.05 + hash(vec2(slot, 9.1)) * 0.35);
    vec2 sdir = normalize(vec2(1.0, 0.55));
    vec2 head = st0 + sdir * fr * 1.5;
    vec2 q = su * asp - head;
    float along = -dot(q, sdir);
    float perp = abs(dot(q, vec2(-sdir.y, sdir.x)));
    float trail = step(0.0, along) * step(along, 0.22) * step(perp, 0.0045);
    col += vec3(1.0, 0.96, 0.85) * trail * (1.0 - along / 0.22) * on * smoothstep(0.0, 0.1, fr) * smoothstep(1.0, 0.8, fr) * fx;
    // Zeigerleuchten in drei Stufen
    vec2 pd = (su - uPointer) * asp;
    float pg = floor(1.0 / (1.0 + dot(pd, pd) * 55.0) * 4.0) / 4.0;
    col += glow * pg * 0.3 * uPtrAmt * fx;
    // Treffer: Ring heller, ganzes Bild kurz heller, Hitze pulsiert
    col += glow * 0.8 * step(0.35, ring) * fx + uAccent * ring * 0.4 * fx;
    col *= 1.0 + uImpactAmp * 0.1 * max(0.0, 1.0 - uImpact.z * 2.5) * fx + uHeat * 0.1 * sin(uTime * 5.0) * fx;
  }

  // scharfe Sterne: ein Zellpixel, langsames Funkeln in zwei Stufen
  float h = hash(cellId);
  float tw = step(0.5, fract(h * 17.0 + uTime * 0.15));
  float star = step(0.9955 - uHeat * 0.0035 * uFx, h) * (0.55 + 0.45 * tw + 0.3 * uHeat * uFx);
  // ein Teil der Sterne leuchtet warm wie Kerzenlicht, die übrigen kühl
  vec3 starCol = fract(h * 91.0) > 0.78 ? vec3(1.0, 0.86, 0.55) : vec3(0.88, 0.94, 1.0);
  col = mix(col, starCol, star);
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
  /** Grafikstufe Supernova: Zusatz Schicht im Shader, weich ein und ausgeblendet */
  private fxOn = false;
  private fxLevel = 0;
  private heat = 0;
  private ptr = { u: 0.5, v: 0.5, amt: 0, tu: 0.5, tv: 0.5, tamt: 0 };
  private hit = { u: 0.5, v: 0.5, age: 9, amp: 0 };
  private w = 1;
  private h = 1;

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
          uFx: { value: 0, type: 'f32' },
          uPointer: { value: new Float32Array([0.5, 0.5]), type: 'vec2<f32>' },
          uPtrAmt: { value: 0, type: 'f32' },
          uImpact: { value: new Float32Array([0.5, 0.5, 9]), type: 'vec3<f32>' },
          uImpactAmp: { value: 0, type: 'f32' },
          uHeat: { value: 0, type: 'f32' },
          uLite: { value: 0, type: 'f32' },
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

  /** Supernova Zusatz an oder aus */
  setFx(on: boolean) {
    this.fxOn = on;
  }

  /** Hitze 0 bis 1 */
  setHeat(h: number) {
    this.heat = h;
  }

  /** Zeigerposition als Anteil des Bildschirms, amt 0 = kein Zeiger */
  setPointer(u: number, v: number, amt: number) {
    this.ptr.tu = u;
    this.ptr.tv = v;
    this.ptr.tamt = amt;
  }

  /** Schockwelle an einer Bildschirmposition (CSS Pixel) mit Stärke 0 bis 1 */
  impact(gx: number, gy: number, amp: number) {
    this.hit = { u: gx / Math.max(1, this.w), v: gy / Math.max(1, this.h), age: 0, amp: Math.max(amp, this.hit.age < 0.4 ? this.hit.amp * 0.6 : 0) };
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.clear().rect(0, 0, w, h).fill(0x14275a);
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
    // Supernova: Zusatz weich ein und aus, Zeiger geglättet, Schockwelle läuft ab
    this.fxLevel = lerp(this.fxLevel, this.fxOn ? 1 : 0, Math.min(1, dt * 3));
    this.ptr.u = lerp(this.ptr.u, this.ptr.tu, Math.min(1, dt * 9));
    this.ptr.v = lerp(this.ptr.v, this.ptr.tv, Math.min(1, dt * 9));
    this.ptr.amt = lerp(this.ptr.amt, this.ptr.tamt, Math.min(1, dt * 5));
    this.hit.age += dt;
    const u = this.filter.resources.bgUniforms.uniforms;
    u.uFx = this.fxLevel;
    u.uPointer[0] = this.ptr.u;
    u.uPointer[1] = this.ptr.v;
    u.uPtrAmt = this.ptr.amt;
    u.uImpact[0] = this.hit.u;
    u.uImpact[1] = this.hit.v;
    u.uImpact[2] = this.hit.age;
    u.uImpactAmp = this.hit.age < 1.3 ? this.hit.amp : 0;
    u.uHeat = this.heat;
    u.uTime = this.phase;
    u.uDeep.set(c.deep);
    u.uMid.set(c.mid);
    u.uAccent.set(c.accent);
    u.uContrast = c.contrast;
    u.uVignette = c.vignette;
    u.uPulse = c.pulse;
  }
}
