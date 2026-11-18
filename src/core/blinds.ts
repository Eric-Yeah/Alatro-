export type BlindKind = 'small' | 'big' | 'boss';
export const BLIND_KINDS: readonly BlindKind[] = ['small', 'big', 'boss'];

export const BLIND_INFO: Record<BlindKind, { name: string; factor: number; reward: number }> = {
  small: { name: 'Kleiner Blind', factor: 1, reward: 3 },
  big: { name: 'Großer Blind', factor: 1.5, reward: 4 },
  boss: { name: 'Boss', factor: 2, reward: 5 },
};

const ANTE_BASE = [300, 800, 2000, 5000, 11000, 20000, 35000, 50000];
export const FINAL_ANTE = 8;

export function anteBase(ante: number): number {
  if (ante <= 0) return 100;
  if (ante <= ANTE_BASE.length) return ANTE_BASE[ante - 1];
  // Endless: grows fast
  const extra = ante - ANTE_BASE.length;
  const raw = ANTE_BASE[ANTE_BASE.length - 1] * Math.pow(1.6, extra) * (1 + 0.2 * extra * extra);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
  return Math.floor(raw / mag) * mag;
}

export function blindTarget(ante: number, kind: BlindKind): number {
  return Math.floor(anteBase(ante) * BLIND_INFO[kind].factor);
}
