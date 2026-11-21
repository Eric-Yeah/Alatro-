import type { Sprite } from './consumableKit';
import { SPRITES_STERN } from './consumableSpritesStern';
import { SPRITES_ELIXIER_A } from './consumableSpritesElixierA';
import { SPRITES_ELIXIER_B } from './consumableSpritesElixierB';
import { SPRITES_ELIXIER_C } from './consumableSpritesElixierC';
import { SPRITES_OMEN } from './consumableSpritesOmen';
import { SPRITES_OMEN_B } from './consumableSpritesOmenB';

// Register aller Consumable Motive nach ID (Sternbilder, Elixiere, Omen).
export const CONSUMABLE_SPRITES: Record<string, Sprite> = {
  ...SPRITES_STERN,
  ...SPRITES_ELIXIER_A,
  ...SPRITES_ELIXIER_B,
  ...SPRITES_ELIXIER_C,
  ...SPRITES_OMEN,
  ...SPRITES_OMEN_B,
};
