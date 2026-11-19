import type { Sprite } from './consumableKit';
import { SPRITES_STERN } from './consumableSpritesStern';
import { SPRITES_ELIXIER_A } from './consumableSpritesElixierA';
import { SPRITES_ELIXIER_B } from './consumableSpritesElixierB';
import { SPRITES_OMEN } from './consumableSpritesOmen';

// Register aller Consumable Motive nach ID (Sternbilder, Elixiere, Omen).
export const CONSUMABLE_SPRITES: Record<string, Sprite> = {
  ...SPRITES_STERN,
  ...SPRITES_ELIXIER_A,
  ...SPRITES_ELIXIER_B,
  ...SPRITES_OMEN,
};
