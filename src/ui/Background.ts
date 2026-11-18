import { Filter, Graphics } from 'pixi.js';

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

// Own design: slow domain-warped "ink in water" bands, quantised to a coarse pixel grid,
// in the game's indigo / plum / teal palette, with a soft vignette.
const fragment = /* glsl */ `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform float uTime;
uniform vec2 uRes;

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
  vec3 deep = vec3(0.075, 0.055, 0.14);
  vec3 plum = vec3(0.24, 0.10, 0.30);
  vec3 teal = vec3(0.06, 0.26, 0.30);
  vec3 col = mix(deep, plum, smoothstep(0.25, 0.75, bands));
  col = mix(col, teal, smoothstep(0.55, 0.95, r.x * bands));

  vec2 c = vTextureCoord - 0.5;
  col *= 1.0 - dot(c, c) * 1.3;
  finalColor = vec4(col, 1.0);
}
`;

export class Background extends Graphics {
  private filter: Filter;
  private time = 0;

  constructor() {
    super();
    this.filter = Filter.from({
      gl: { vertex, fragment, name: 'alatro-bg' },
      resources: {
        bgUniforms: {
          uTime: { value: 0, type: 'f32' },
          uRes: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
        },
      },
    });
    this.filters = [this.filter];
  }

  resize(w: number, h: number) {
    this.clear().rect(0, 0, w, h).fill(0x1b1530);
    this.filterArea = undefined as any;
    const u = this.filter.resources.bgUniforms.uniforms;
    u.uRes[0] = w;
    u.uRes[1] = h;
  }

  update(deltaMS: number) {
    this.time += deltaMS / 1000;
    this.filter.resources.bgUniforms.uniforms.uTime = this.time;
  }
}
