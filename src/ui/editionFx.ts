import { Filter, Graphics, Ticker } from 'pixi.js';
import { FILTER_VERTEX } from './glsl';

// Eigene Glanz Shader für die vier Editions. Jede Edition ist ein Overlay über Karte oder Joker.
// Das Overlay ist ein weißes Rechteck mit abgerundeten Ecken, der Shader nutzt dessen Alpha als Maske.
// Schimmer, Aura und Prisma leuchten additiv (Alpha 0 bei premultiplied Ausgabe), Schatten dunkelt ab.

const COMMON = /* glsl */ `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uSeed;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
vec3 hsv(float h, float s, float v) {
  vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return v * mix(vec3(1.0), k, s);
}
`;

// Schimmer: kühles Folienlicht, ein diagonaler Streifen wandert über die Fläche, dazu Funkeln.
const SCHIMMER = /* glsl */ `
void main(void) {
  float a = texture(uTexture, vTextureCoord).a;
  vec2 uv = vTextureCoord;
  float d = uv.x * 0.8 + uv.y * 0.6;
  float sweep = fract(d - uTime * 0.28 + uSeed);
  float band = smoothstep(0.0, 0.07, sweep) * (1.0 - smoothstep(0.07, 0.22, sweep));
  float tw = step(0.965, hash(floor(uv * 26.0) + floor(uTime * 3.0 + uSeed * 9.0)));
  vec3 glow = vec3(0.55, 0.85, 1.0) * (0.55 * band + 0.55 * tw) + vec3(0.1, 0.18, 0.25) * 0.35;
  finalColor = vec4(glow * a * 0.8, 0.0);
}
`;

// Aura: rosa Wellen und ein pulsierender Kern, wie Wärme über der Karte.
const AURA = /* glsl */ `
void main(void) {
  float a = texture(uTexture, vTextureCoord).a;
  vec2 uv = vTextureCoord;
  float w = sin(uv.y * 14.0 + sin(uv.x * 6.0 + uTime * 1.3) * 1.6 - uTime * 2.2 + uSeed * 6.0);
  float rings = 0.5 + 0.5 * w;
  float pulse = 0.5 + 0.5 * sin(uTime * 1.4 + uSeed * 6.0);
  float core = smoothstep(0.75, 0.0, length(uv - 0.5)) * (0.25 + 0.35 * pulse);
  vec3 pink = mix(vec3(1.0, 0.35, 0.78), vec3(1.0, 0.7, 0.9), rings);
  finalColor = vec4(pink * (0.2 * rings + core) * a, 0.0);
}
`;

// Prisma: wandernder Regenbogen mit weichem Verlauf und Glanzlicht.
const PRISMA = /* glsl */ `
void main(void) {
  float a = texture(uTexture, vTextureCoord).a;
  vec2 uv = vTextureCoord;
  float h = fract(uv.x * 0.6 - uv.y * 0.9 + uTime * 0.18 + uSeed + noise(uv * 4.0 + uTime * 0.3) * 0.25);
  vec3 rainbow = hsv(h, 0.75, 1.0);
  float sweep = fract(uv.x * 0.7 + uv.y * 0.5 - uTime * 0.22 + uSeed);
  float hi = smoothstep(0.0, 0.05, sweep) * (1.0 - smoothstep(0.05, 0.16, sweep));
  finalColor = vec4((rainbow * 0.26 + vec3(1.0) * hi * 0.35) * a, 0.0);
}
`;

// Schatten: tiefes Violett, wabernde Dunkelheit und ein heller Rand wie Mondlicht.
const SCHATTEN = /* glsl */ `
void main(void) {
  float a = texture(uTexture, vTextureCoord).a;
  vec2 uv = vTextureCoord;
  float n = noise(uv * 5.0 + vec2(uTime * 0.25, -uTime * 0.18) + uSeed * 10.0);
  float edge = smoothstep(0.38, 0.5, max(abs(uv.x - 0.5), abs(uv.y - 0.5)));
  vec3 dark = vec3(0.07, 0.02, 0.16);
  vec3 rim = vec3(0.55, 0.4, 0.95);
  float k = 0.38 + 0.3 * n;
  vec3 col = dark * k + rim * edge * (0.35 + 0.25 * sin(uTime * 1.5));
  finalColor = vec4(col * a, a * (0.3 + 0.25 * n));
}
`;

const SOURCES: Record<string, string> = { schimmer: SCHIMMER, aura: AURA, prisma: PRISMA, schatten: SCHATTEN };

const filters = new Map<string, Filter>();
let time = 0;
let ticking = false;

function filterFor(edition: string): Filter | null {
  const body = SOURCES[edition];
  if (!body) return null;
  let f = filters.get(edition);
  if (!f) {
    f = Filter.from({
      gl: { vertex: FILTER_VERTEX, fragment: COMMON + body, name: `alatro-ed-${edition}` },
      resolution: 'inherit',
      resources: {
        edUniforms: {
          uTime: { value: 0, type: 'f32' },
          uSeed: { value: 0, type: 'f32' },
        },
      },
    });
    filters.set(edition, f);
  }
  if (!ticking) {
    ticking = true;
    Ticker.shared.add((t) => {
      time += t.deltaMS / 1000;
      for (const flt of filters.values()) flt.resources.edUniforms.uniforms.uTime = time;
    });
  }
  return f;
}

/** Overlay mit Edition Shader. Gibt null zurück, wenn die Edition keinen Shader hat. */
export function editionOverlay(edition: string, w: number, h: number, radius: number): Graphics | null {
  const f = filterFor(edition);
  if (!f) return null;
  const g = new Graphics().roundRect(-w / 2, -h / 2, w, h, radius).fill(0xffffff);
  g.filters = [f];
  g.eventMode = 'none';
  return g;
}
