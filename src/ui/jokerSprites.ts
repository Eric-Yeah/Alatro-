import type { Sprite } from './jokerKit';
import { SPRITES_A } from './jokerSpritesA';
import { SPRITES_B } from './jokerSpritesB';
import { SPRITES_C } from './jokerSpritesC';
import { SPRITES_D } from './jokerSpritesD';
import { SPRITES_E } from './jokerSpritesE';
import { SPRITES_F } from './jokerSpritesF';
import { SPRITES_G } from './jokerSpritesG';
import { SPRITES_H } from './jokerSpritesH';
import { SPRITES_I } from './jokerSpritesI';
import { SPRITES_J } from './jokerSpritesJ';

/** Alle Joker Motive nach Joker ID. Jedes ist einzeln gezeichnet, es gibt keine gemeinsame Vorlage. */
export const SPRITES: Record<string, Sprite> = {
  ...SPRITES_A,
  ...SPRITES_B,
  ...SPRITES_C,
  ...SPRITES_D,
  ...SPRITES_E,
  ...SPRITES_F,
  ...SPRITES_G,
  ...SPRITES_H,
  ...SPRITES_I,
  ...SPRITES_J,
};
