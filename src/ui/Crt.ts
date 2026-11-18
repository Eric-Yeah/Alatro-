import { Filter } from 'pixi.js';
import { CRT } from '../data/juice';

const vertex = /* glsl */ `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}

void main(void) {
  gl_Position = filterVertexPosition();
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}
`;

// Eigener CRT Effekt: Scanlines, RGB Maske, Farbsaum zu den Rändern, dunkle Ecken, leichtes Flackern.
// Keine Krümmung, damit Touch Koordinaten exakt bleiben.
const fragment = /* glsl */ `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform float uTime;
uniform float uPitch;
uniform float uScan;
uniform float uChroma;
uniform float uVig;
uniform float uFlicker;
uniform float uMask;

void main(void) {
  vec2 uv = vTextureCoord;
  vec2 c = uv - 0.5;
  vec2 texel = uInputSize.zw;
  float edge = dot(c, c) * 4.0;
  vec2 shift = c * edge * uChroma * texel * 2.0;
  float r = texture(uTexture, uv + shift).r;
  vec4 mid = texture(uTexture, uv);
  float b = texture(uTexture, uv - shift).b;
  vec3 col = vec3(r, mid.g, b);

  float py = uv.y * uInputSize.y;
  float scan = 0.5 + 0.5 * sin(py * 6.2831853 / uPitch);
  col *= 1.0 - uScan * scan;

  float px = uv.x * uInputSize.x;
  float m = mod(floor(px / (uPitch * 0.34)), 3.0);
  vec3 mask = vec3(1.0 - uMask);
  if (m < 1.0) mask.r += uMask; else if (m < 2.0) mask.g += uMask; else mask.b += uMask;
  col *= mask;

  col *= 1.0 - uVig * edge * edge;
  col *= 1.0 + uFlicker * sin(uTime * 53.0) * sin(uTime * 7.3 + 1.0);
  finalColor = vec4(col, mid.a);
}
`;

/** Erzeugt den CRT Filter. `resolution` ist die Pixeldichte des Renderers (Scanlines bleiben gleich dick). */
export function createCrt(resolution: number): Filter {
  return Filter.from({
    gl: { vertex, fragment, name: 'alatro-crt' },
    resources: {
      crtUniforms: {
        uTime: { value: 0, type: 'f32' },
        uPitch: { value: CRT.scanlinePitch * resolution, type: 'f32' },
        uScan: { value: CRT.scanlineStrength, type: 'f32' },
        uChroma: { value: CRT.chromaShift * resolution, type: 'f32' },
        uVig: { value: CRT.vignette, type: 'f32' },
        uFlicker: { value: CRT.flicker, type: 'f32' },
        uMask: { value: CRT.mask, type: 'f32' },
      },
    },
  });
}

export function updateCrt(f: Filter, time: number) {
  (f.resources as any).crtUniforms.uniforms.uTime = time;
}
