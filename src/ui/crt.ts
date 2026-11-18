import { Filter } from 'pixi.js';
import { CRT } from '../data/juice';
import { FILTER_VERTEX } from './glsl';

// Eigener CRT Post Processing Shader: leichte Wölbung, Scanlines, Farbversatz am Rand,
// Randabdunklung und feines Rauschen. Wird über die Einstellungen an und ausgeschaltet.
const fragment = /* glsl */ `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uRes;
uniform float uCurve;
uniform float uScan;
uniform float uPitch;
uniform float uAberr;
uniform float uVig;
uniform float uNoise;
uniform float uSweep;
uniform float uPeriod;
uniform float uTint;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(void) {
  vec2 uv = vTextureCoord;
  vec2 c = uv * 2.0 - 1.0;
  // Wölbung
  c *= 1.0 + dot(c, c) * uCurve;
  vec2 st = c * 0.5 + 0.5;
  if (st.x < 0.0 || st.x > 1.0 || st.y < 0.0 || st.y > 1.0) {
    finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  // Farbversatz wächst zum Rand
  vec2 off = c * uAberr * (0.3 + dot(c, c));
  float r = texture(uTexture, st + off).r;
  vec4 mid = texture(uTexture, st);
  float b = texture(uTexture, st - off).b;
  vec3 col = vec3(r, mid.g, b);

  // Scanlines in Bildschirmpixeln
  float line = floor(st.y * uRes.y / uPitch);
  float scan = mod(line, 2.0);
  col *= 1.0 - uScan * scan;
  // schwaches Flackern und Rauschen
  col *= 1.0 + 0.006 * sin(uTime * 38.0 + st.y * 6.0);
  col += (hash(floor(st * uRes) + fract(uTime)) - 0.5) * uNoise;
  // Hologramm: kühler Farbton und ein helles Band, das von oben nach unten wandert
  col *= mix(vec3(1.0), vec3(0.93, 1.0, 1.08), uTint);
  float pos = 1.0 - fract(uTime / uPeriod) * 1.3 + 0.15;
  float band = smoothstep(0.07, 0.0, abs(st.y - pos));
  col += vec3(0.25, 0.8, 1.0) * band * uSweep;
  // Randabdunklung
  col *= 1.0 - dot(c, c) * uVig * 0.5;
  finalColor = vec4(col, 1.0);
}
`;

export class CrtFilter {
  readonly filter: Filter;
  private time = 0;

  constructor() {
    this.filter = Filter.from({
      gl: { vertex: FILTER_VERTEX, fragment, name: 'alatro-crt' },
      resolution: 'inherit',
      resources: {
        crtUniforms: {
          uTime: { value: 0, type: 'f32' },
          uRes: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
          uCurve: { value: CRT.curvature, type: 'f32' },
          uScan: { value: CRT.scanline, type: 'f32' },
          uPitch: { value: CRT.scanPitch, type: 'f32' },
          uAberr: { value: CRT.aberration, type: 'f32' },
          uVig: { value: CRT.vignette, type: 'f32' },
          uNoise: { value: CRT.noise, type: 'f32' },
          uSweep: { value: CRT.sweep, type: 'f32' },
          uPeriod: { value: CRT.sweepPeriod, type: 'f32' },
          uTint: { value: CRT.tint, type: 'f32' },
        },
      },
    });
  }

  /** Größe des Renderers in Bildschirmpixeln (mit Auflösungsfaktor) */
  resize(pxW: number, pxH: number, resolution: number) {
    const u = this.filter.resources.crtUniforms.uniforms;
    u.uRes[0] = pxW;
    u.uRes[1] = pxH;
    u.uPitch = CRT.scanPitch * resolution;
  }

  update(deltaMS: number) {
    this.time += deltaMS / 1000;
    this.filter.resources.crtUniforms.uniforms.uTime = this.time;
  }
}
