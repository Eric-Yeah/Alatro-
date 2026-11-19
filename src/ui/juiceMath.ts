import { HAPTICS, SCALE_BASE_HZ, SCALE_MAX_STEPS, SCALE_STEPS, SCORE_TIERS, XMULT_SHAKE_BASE, XMULT_SHAKE_MAX, type ScoreTier } from '../data/juice';

/** Stufe für eine Hand nach dem Verhältnis Punkte zu Ziel (ohne Ziel gilt die niedrigste Stufe). */
export function scoreTier(total: number, target: number): ScoreTier {
  const ratio = target > 0 ? total / target : 0;
  let tier = SCORE_TIERS[0];
  for (const t of SCORE_TIERS) if (ratio >= t.minRatio) tier = t;
  return tier;
}

/** Frequenz des n-ten Tons der pentatonischen Leiter, steigt über Oktaven und wird nach oben begrenzt. */
export function scaleFreq(step: number): number {
  const s = Math.max(0, Math.min(SCALE_MAX_STEPS, Math.floor(step)));
  const octave = Math.floor(s / SCALE_STEPS.length);
  const semis = SCALE_STEPS[s % SCALE_STEPS.length] + octave * 12;
  return SCALE_BASE_HZ * Math.pow(2, semis / 12);
}

/** Shake Stärke für einen X Mult Effekt, wächst mit dem Faktor, ist gedeckelt. */
export function xMultShake(x: number): number {
  return Math.min(XMULT_SHAKE_MAX, XMULT_SHAKE_BASE * Math.max(1, x));
}

/** Vibrationsdauer in ms für einen Aufprall nach Shake Stärke (wächst linear, ist begrenzt). */
export function impactMs(shake: number): number {
  const { minMs, maxMs, fullShake } = HAPTICS.impact;
  const r = Math.max(0, Math.min(1, shake / fullShake));
  return Math.round(minMs + (maxMs - minMs) * r);
}

/** Vibrationsmuster für den Aufschlag der Gesamtpunkte (boom 0 bis 1). Hohe Stufen bekommen einen Nachschlag. */
export function totalPattern(boom: number): number[] {
  const { minMs, maxMs, echoFrom, echoGap, echoMs } = HAPTICS.total;
  const b = Math.max(0, Math.min(1, boom));
  const main = Math.round(minMs + (maxMs - minMs) * b);
  return b >= echoFrom ? [main, echoGap, echoMs] : [main];
}
