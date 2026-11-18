import { SCALE_BASE_HZ, SCALE_MAX_STEPS, SCALE_STEPS, SCORE_TIERS, XMULT_SHAKE_BASE, XMULT_SHAKE_MAX, type ScoreTier } from '../data/juice';

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
