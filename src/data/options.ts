/** Optionen: wählbare Animationstempi (Faktor 1 ist das normale Tempo). */
export const SPEED_OPTIONS: readonly number[] = [1, 1.5, 2, 3, 5, 10];

export const DEFAULT_SPEED = 1;

/** Beschriftung eines Tempos, zum Beispiel "2x" oder "1,5x" */
export const speedLabel = (s: number): string => `${String(s).replace('.', ',')}x`;
