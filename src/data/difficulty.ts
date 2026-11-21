import type { RunMods } from './modsSpec';
import { t } from '../i18n';

/**
 * Skalierende Schwierigkeit: eine einzige Zahl (Stufe) regelt feiner als die festen Stakes.
 * Das Ziel der Blinds wächst mit jeder Stufe, dazu kommen ab bestimmten Stufen zusätzliche Regeln.
 * Unter der Normalstufe helfen Zuschläge, über ihr wird es härter. Alle Zahlen stehen hier.
 */
export const SCALE = {
  min: 1,
  max: 20,
  /** entspricht ungefähr der Grundschwierigkeit (Dämmerung) */
  normal: 4,
  /** Vorbelegung im Run Setup */
  start: 4,
  /** Ziel Faktor unter der Normalstufe: Abzug pro Stufe */
  easyStep: 0.1,
  /** Ziel Faktor über der Normalstufe: Zuwachs pro Stufe */
  hardStep: 0.07,
};

/** Stufe, ab der eine zusätzliche Regel gilt (bis `to`, sonst bis zum Maximum) */
export interface ScaleFeature {
  from: number;
  to?: number;
  mods: RunMods;
  text: string;
}

export const SCALE_FEATURES: readonly ScaleFeature[] = [
  { from: 1, to: 1, mods: { moneyDelta: 3 }, text: '+$3 Startgeld' },
  { from: 1, to: 2, mods: { discardsDelta: 1 }, text: '+1 Discard pro Runde' },
  { from: 6, mods: { smallBlindReward: 0 }, text: 'Small Blind gibt keine Belohnung' },
  { from: 8, mods: { scaling: 2 }, text: 'Blind Ziele wachsen schneller' },
  { from: 11, mods: { discardsDelta: -1 }, text: '-1 Discard pro Runde' },
  { from: 13, mods: { scaling: 3 }, text: 'Blind Ziele wachsen noch schneller' },
  { from: 16, mods: { handSizeDelta: -1 }, text: '-1 Hand Size' },
  { from: 18, mods: { interestCap: 3 }, text: 'Zinsen sind auf $3 gedeckelt' },
  { from: 20, mods: { handsDelta: -1 }, text: '-1 Hand pro Runde' },
];

export function clampScale(level: number): number {
  return Math.max(SCALE.min, Math.min(SCALE.max, Math.round(Number.isFinite(level) ? level : SCALE.start)));
}

/** Faktor auf alle Blind Ziele. Stufe 1 gleich 0,7, Normalstufe gleich 1, Stufe 20 etwa 2,1 */
export function scaleTargetFactor(level: number): number {
  const l = clampScale(level);
  const f = l <= SCALE.normal ? 1 - SCALE.easyStep * (SCALE.normal - l) : 1 + SCALE.hardStep * (l - SCALE.normal);
  return Math.round(f * 1000) / 1000;
}

/** Alle Regeländerungen einer Stufe in Anwendungsreihenfolge (Ziel Faktor zuerst) */
export function scaleMods(level: number): RunMods[] {
  const l = clampScale(level);
  const mods: RunMods[] = [];
  const factor = scaleTargetFactor(l);
  if (factor !== 1) mods.push({ blindTargetFactor: factor });
  for (const f of SCALE_FEATURES) if (l >= f.from && l <= (f.to ?? SCALE.max)) mods.push(f.mods);
  return mods;
}

/** Zeilen für die Anzeige im Run Setup: was diese Stufe ausmacht */
export function scaleSummary(level: number): string[] {
  const l = clampScale(level);
  const pct = Math.round((scaleTargetFactor(l) - 1) * 100);
  const lines = [pct === 0 ? t('Blind Ziele wie im Grundspiel') : pct > 0 ? t('Blind Ziele plus {n}%', { n: pct }) : t('Blind Ziele minus {n}%', { n: -pct })];
  for (const f of SCALE_FEATURES) if (l >= f.from && l <= (f.to ?? SCALE.max)) lines.push(f.text);
  return lines;
}

export interface ScaleBand {
  from: number;
  name: string;
  color: number;
}

export const SCALE_BANDS: readonly ScaleBand[] = [
  { from: 1, name: 'Leicht', color: 0xffb36b },
  { from: 4, name: 'Normal', color: 0xe8e0d0 },
  { from: 6, name: 'Fordernd', color: 0xd9644f },
  { from: 9, name: 'Schwer', color: 0x4fae6f },
  { from: 13, name: 'Extrem', color: 0x8f4fd9 },
  { from: 17, name: 'Grenzenlos', color: 0xe0b23f },
];

export function scaleBand(level: number): ScaleBand {
  const l = clampScale(level);
  let band = SCALE_BANDS[0];
  for (const b of SCALE_BANDS) if (l >= b.from) band = b;
  return band;
}

/** Anzeigename, z. B. "Stufe 7 Fordernd" */
export function scaleName(level: number): string {
  return t('Stufe {n} {band}', { n: clampScale(level), band: scaleBand(level).name });
}
