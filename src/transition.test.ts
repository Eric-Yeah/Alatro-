import { describe, expect, it } from 'vitest';
import { TRANSITION as T } from './data/transition';

describe('Ladekarte', () => {
  it('hat positive Zeiten', () => {
    for (const ms of [T.fadeInMs, T.cardInMs, T.loadMs, T.flipMs, T.revealMs, T.fadeOutMs, T.introLoadMs, T.introFadeOutMs]) {
      expect(ms).toBeGreaterThan(0);
    }
  });

  it('ein Wechsel ist ruhig, aber dauert nicht länger als drei Sekunden', () => {
    const total = T.fadeInMs + T.cardInMs + T.loadMs + T.flipMs * 2 + T.revealMs + T.fadeOutMs;
    expect(total).toBeGreaterThan(1500);
    expect(total).toBeLessThanOrEqual(3000);
  });
});
