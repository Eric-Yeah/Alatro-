import { describe, expect, it } from 'vitest';
import { HOME_TITLE } from './data/homeTitle';
import { SUITS } from './data/cards';

describe('Home Titel', () => {
  it('buchstabiert ALATRO mit gültigen Suits', () => {
    expect(HOME_TITLE.letters.map((l) => l.ch).join('')).toBe('ALATRO');
    for (const l of HOME_TITLE.letters) expect(SUITS).toContain(l.suit);
  });

  it('hat sinnvolle Animationszahlen', () => {
    expect(HOME_TITLE.spacing).toBeGreaterThan(0);
    expect(HOME_TITLE.dealMs).toBeGreaterThan(0);
    expect(HOME_TITLE.flipMs).toBeGreaterThan(0);
    expect(HOME_TITLE.hoverLift).toBeGreaterThan(0);
    expect(HOME_TITLE.backStarOuter).toBeGreaterThan(HOME_TITLE.backStarInner);
  });
});
