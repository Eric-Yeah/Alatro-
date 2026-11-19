import type { Sprite } from './jokerKit';
import { SPRITES_A } from './jokerSpritesA';
import { SPRITES_B } from './jokerSpritesB';
import { SPRITES_C } from './jokerSpritesC';
import { SPRITES_D } from './jokerSpritesD';
import { SPRITES_E } from './jokerSpritesE';
import { SPRITES_F } from './jokerSpritesF';

/** Alle Joker Motive nach Joker ID. Jedes ist einzeln gezeichnet, es gibt keine gemeinsame Vorlage. */
export const SPRITES: Record<string, Sprite> = {
  ...SPRITES_A,
  ...SPRITES_B,
  ...SPRITES_C,
  ...SPRITES_D,
  ...SPRITES_E,
  ...SPRITES_F,
};
