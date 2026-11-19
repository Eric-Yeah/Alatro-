import { describe, expect, it } from 'vitest';
import { TRANSITION as T } from './data/transition';

describe('Kuppelblende', () => {
  it('hat positive Zeiten, die Öffnung dauert mindestens so lang wie das Schließen', () => {
    for (const ms of [T.closeMs, T.holdMs, T.openMs, T.introHoldMs, T.introOpenMs]) expect(ms).toBeGreaterThan(0);
    expect(T.openMs).toBeGreaterThanOrEqual(T.closeMs);
  });

  it('die Gesamtdauer eines Wechsels bleibt unter einer Sekunde', () => {
    expect(T.closeMs + T.holdMs + T.openMs).toBeLessThan(1000);
  });
});
