import { LOSS_SHAKE, SHAKE_TIERS, XMULT_SHAKE, type ShakeTier } from '../data/juice';

/** Bildschirm Shake. Die Szene (main.ts) addiert `offset` jeden Frame auf die Position der Wurzel. */
class ScreenFx {
  /** aktuelle Auslenkung in Pixeln der logischen Auflösung */
  offsetX = 0;
  offsetY = 0;
  private amp = 0;
  private total = 0;
  private left = 0;

  /** Startet einen Shake. Ein stärkerer laufender Shake wird nicht abgeschwächt. */
  shake(amplitude: number, durationMs: number) {
    if (amplitude <= 0 || durationMs <= 0) return;
    const currentAmp = this.total > 0 ? this.amp * (this.left / this.total) : 0;
    if (amplitude < currentAmp) return;
    this.amp = amplitude;
    this.total = durationMs;
    this.left = durationMs;
  }

  update(deltaMS: number) {
    if (this.left <= 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }
    this.left = Math.max(0, this.left - deltaMS);
    const k = (this.left / this.total) ** 2;
    this.offsetX = (Math.random() * 2 - 1) * this.amp * k;
    this.offsetY = (Math.random() * 2 - 1) * this.amp * k;
  }
}

export const screenFx = new ScreenFx();

/** Wählt die Stufe nach Hand Score im Verhältnis zum Blind Ziel */
export function shakeTier(handScore: number, target: number): ShakeTier {
  const ratio = target > 0 ? handScore / target : 0;
  let tier = SHAKE_TIERS[0];
  for (const t of SHAKE_TIERS) if (ratio >= t.minRatio) tier = t;
  return tier;
}

export const xMultShake = () => screenFx.shake(XMULT_SHAKE.amplitude, XMULT_SHAKE.durationMs);
export const lossShake = () => screenFx.shake(LOSS_SHAKE.amplitude, LOSS_SHAKE.durationMs);
