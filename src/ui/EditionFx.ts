import { Filter, Graphics, Ticker } from 'pixi.js';

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

// Eigene Glanz Shader der Editions. Die Form kommt aus dem Alpha der Eingabe (ein weißes Rechteck mit
// runden Ecken), die Farbe und Bewegung aus dem Shader.
//   0 Schimmer: silberblauer Lichtstreif, der diagonal über die Karte läuft
//   1 Aura: weich wandernde Regenbogen Streifen in Rosa und Violett
//   2 Prisma: goldene Streifen mit funkelnden Punkten
//   3 Schatten: dunkle Wellen mit hellem Rand
const fragment = /* glsl */ `
precision highp float;
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uKind;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(void) {
  vec2 uv = vTextureCoord;
  float mask = texture(uTexture, uv).a;
  vec3 col = vec3(0.0);
  float a = 0.0;
  float t = uTime;

  if (uKind < 0.5) {
    float d = uv.x + uv.y * 0.6 - fract(t * 0.35) * 2.6 + 0.4;
    float band = smoothstep(0.22, 0.0, abs(d));
    col = mix(vec3(0.62, 0.85, 1.0), vec3(1.0), band);
    a = 0.1 + band * 0.45;
  } else if (uKind < 1.5) {
    vec3 rb = 0.5 + 0.5 * cos(6.2831 * (uv.x * 1.2 + uv.y * 0.8 + t * 0.12 + vec3(0.0, 0.33, 0.67)));
    col = mix(vec3(1.0, 0.5, 0.82), rb, 0.55);
    float pulse = 0.5 + 0.5 * sin(t * 1.6 + uv.y * 5.0);
    a = 0.14 + 0.16 * pulse;
  } else if (uKind < 2.5) {
    float s = sin((uv.x - uv.y) * 14.0 + t * 1.2) * 0.5 + 0.5;
    col = mix(vec3(1.0, 0.78, 0.2), vec3(1.0, 0.95, 0.7), s);
    vec2 cell = floor(uv * vec2(14.0, 20.0));
    float tw = step(0.93, hash(cell)) * (0.5 + 0.5 * sin(t * 4.0 + hash(cell + 3.0) * 6.28));
    a = 0.12 + 0.12 * s + tw * 0.55;
    col = mix(col, vec3(1.0), tw);
  } else {
    float w = sin(uv.x * 9.0 + t * 0.9) * sin(uv.y * 7.0 - t * 0.7) * 0.5 + 0.5;
    col = mix(vec3(0.05, 0.02, 0.1), vec3(0.3, 0.12, 0.5), w);
    vec2 e = abs(uv - 0.5) * 2.0;
    float rim = smoothstep(0.82, 1.0, max(e.x, e.y));
    col = mix(col, vec3(0.6, 0.3, 0.95), rim * 0.6);
    a = 0.34 + 0.12 * w;
  }
  a *= mask;
  finalColor = vec4(col * a, a);
}
`;

const KINDS: Record<string, number> = { schimmer: 0, aura: 1, prisma: 2, schatten: 3 };
const filters = new Map<number, Filter>();
let started = false;
let clock = 0;

function filterFor(kind: number): Filter {
  let f = filters.get(kind);
  if (!f) {
    f = Filter.from({
      gl: { vertex, fragment, name: `alatro-edition-${kind}` },
      resources: {
        edUniforms: {
          uTime: { value: 0, type: 'f32' },
          uKind: { value: kind, type: 'f32' },
        },
      },
    });
    filters.set(kind, f);
  }
  if (!started) {
    started = true;
    Ticker.shared.add((t) => {
      clock += t.deltaMS / 1000;
      for (const flt of filters.values()) (flt.resources as any).edUniforms.uniforms.uTime = clock;
    });
  }
  return f;
}

/**
 * Glanz Overlay einer Edition: ein gefülltes, abgerundetes Rechteck der Größe w mal h um den Ursprung,
 * das der Shader färbt. Wird über die Karte gelegt, Eingaben gehen durch.
 */
export function editionSheen(editionId: string, w: number, h: number, radius: number): Graphics | null {
  const kind = KINDS[editionId];
  if (kind === undefined) return null;
  const g = new Graphics().roundRect(-w / 2, -h / 2, w, h, radius).fill(0xffffff);
  g.filters = [filterFor(kind)];
  g.eventMode = 'none';
  return g;
}
