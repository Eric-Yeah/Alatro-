/**
 * Rückschau eines Runs: reine Rechenfunktionen ohne Browser. Alles hier zeigt nur, was im Spiel
 * wirklich passiert ist (keine künstlichen Beinahe Treffer).
 */
import { NEAR_MISS_MIN, OVERKILL_MIN } from './data/report';

export interface NearMiss {
  /** Fehlende Punkte bis zum Ziel */
  missing: number;
  /** Erreichter Anteil des Ziels, 0 bis 1 */
  fraction: number;
}

/** Beinahe Information einer verlorenen Runde, oder null wenn sie zu weit weg war oder nichts fehlt */
export function nearMiss(score: number, target: number): NearMiss | null {
  if (target <= 0 || score >= target) return null;
  const fraction = score / target;
  if (fraction < NEAR_MISS_MIN) return null;
  return { missing: target - score, fraction };
}

/** Überschuss einer gewonnenen Runde, oder null wenn er klein war */
export function overkill(score: number, target: number): { extra: number; ratio: number } | null {
  if (target <= 0 || score < target * OVERKILL_MIN) return null;
  return { extra: score - target, ratio: score / target };
}

/** Schlüssel, die in `after` stehen, aber nicht in `before` (Reihenfolge von `after`) */
export function newKeys(before: readonly string[], after: readonly string[]): string[] {
  const set = new Set(before);
  return after.filter((k) => !set.has(k));
}
