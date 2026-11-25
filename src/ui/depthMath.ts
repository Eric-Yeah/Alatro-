// Reine Rechnung für den Tiefen Look (ohne Pixi, getestet): Farben mischen und die Alpha Werte eines weichen Schattens.

export function mixColor(a: number, b: number, t: number): number {
  const k = Math.max(0, Math.min(1, t));
  const ch = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * k);
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Hellt eine Farbe auf: 0 = unverändert, 1 = Weiß */
export function lighten(hex: number, k: number): number {
  return mixColor(hex, 0xffffff, k);
}

/** Abstand eines Punktes zum Rand eines Rechtecks mit runden Ecken (negativ innen). Mitte bei 0, 0, halbe Breite und Höhe hw, hh. */
export function sdRoundRect(px: number, py: number, hw: number, hh: number, r: number): number {
  const qx = Math.abs(px) - (hw - r);
  const qy = Math.abs(py) - (hh - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

/** Alpha eines weichen Randes: 1 weit innen, 0 weit außen, glatter Übergang über etwa die doppelte Unschärfe. */
export function softEdge(dist: number, blur: number): number {
  const t = Math.max(0, Math.min(1, 0.5 - dist / (2 * blur)));
  return t * t * (3 - 2 * t);
}

/** Texturgröße (Seitenlänge) und Rand für einen Schatten mit Radius r, Unschärfe blur und Mitte core */
export function shadowDims(radius: number, blur: number, core: number): { pad: number; size: number; slice: number } {
  const pad = Math.ceil(blur * 1.8);
  const size = core + 2 * radius + 2 * pad;
  return { pad, size, slice: pad + radius };
}

/** Alpha Gitter (size mal size, Werte 0 bis 255) eines weichen Schattens eines quadratischen Rechtecks mit runden Ecken */
export function shadowAlphaGrid(radius: number, blur: number, core: number): { size: number; slice: number; alpha: Uint8ClampedArray } {
  const { pad, size, slice } = shadowDims(radius, blur, core);
  const half = (size - 2 * pad) / 2;
  const c = size / 2;
  const alpha = new Uint8ClampedArray(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = sdRoundRect(x + 0.5 - c, y + 0.5 - c, half, half, radius);
      alpha[y * size + x] = Math.round(softEdge(d, blur) * 255);
    }
  }
  return { size, slice, alpha };
}

/** Nächster erlaubter Radius, höchstens die halbe kleinere Seite */
export function pickRadius(radius: number, w: number, h: number, allowed: readonly number[]): number {
  const cap = Math.max(allowed[0], Math.min(w, h) / 2);
  let best = allowed[0];
  for (const r of allowed) {
    if (r > cap) break;
    if (Math.abs(r - radius) <= Math.abs(best - radius)) best = r;
  }
  return best;
}
