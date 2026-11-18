import type { Card } from './cards';
import type { HandType } from './hands';
import { containsHand } from './handEval';

export interface Effect {
  chips?: number;
  mult?: number;
  xMult?: number;
  money?: number;
}

export interface ScoreContext {
  handType: HandType;
  played: Card[];
  scoring: Card[];
  held: Card[];
  money: number;
  handsLeft: number;
  discardsLeft: number;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface JokerDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  cost: number;
  /** Fires once for every scoring card, left to right. */
  onCardScored?(card: Card, ctx: ScoreContext, joker: JokerInstance): Effect | void;
  /** Fires once for every card that stays in hand. */
  onHeldInHand?(card: Card, ctx: ScoreContext, joker: JokerInstance): Effect | void;
  /** Fires after all cards, jokers left to right. */
  onIndependent?(ctx: ScoreContext, joker: JokerInstance): Effect | void;
  /** Bookkeeping after a hand was played (for scaling jokers). Runs BEFORE scoring. */
  onHandPlayed?(ctx: ScoreContext, joker: JokerInstance): void;
}

export interface JokerInstance {
  uid: number;
  defId: string;
  /** Free-form counters for scaling jokers. Serializable. */
  vars: Record<string, number>;
}

/**
 * Own joker designs. Grouped by mechanic so the pool can grow systematically:
 * flat bonuses, suit/rank synergies, hand-type synergies, scaling, economy, conditions.
 */
export const JOKERS: JokerDef[] = [
  {
    id: 'funke',
    name: 'Funke',
    description: '+4 Mult',
    rarity: 'common',
    cost: 2,
    onIndependent: () => ({ mult: 4 }),
  },
  {
    id: 'glut',
    name: 'Glut',
    description: 'Jede gewertete rote Karte (♥/♦) gibt +2 Mult',
    rarity: 'common',
    cost: 4,
    onCardScored: (card) => (card.suit === 'H' || card.suit === 'D' ? { mult: 2 } : undefined),
  },
  {
    id: 'frost',
    name: 'Frost',
    description: 'Jede gewertete schwarze Karte (♠/♣) gibt +15 Chips',
    rarity: 'common',
    cost: 4,
    onCardScored: (card) => (card.suit === 'S' || card.suit === 'C' ? { chips: 15 } : undefined),
  },
  {
    id: 'kleinvieh',
    name: 'Kleinvieh',
    description: 'Jede gewertete 2, 3, 4 oder 5 gibt +3 Mult',
    rarity: 'common',
    cost: 4,
    onCardScored: (card) => (card.rank <= 5 ? { mult: 3 } : undefined),
  },
  {
    id: 'einzelgaenger',
    name: 'Einzelgänger',
    description: '×3 Mult, wenn genau 1 Karte gespielt wird',
    rarity: 'uncommon',
    cost: 6,
    onIndependent: (ctx) => (ctx.played.length === 1 ? { xMult: 3 } : undefined),
  },
  {
    id: 'treppe',
    name: 'Treppe',
    description: '+60 Chips, wenn die Hand eine Straße enthält',
    rarity: 'common',
    cost: 4,
    onIndependent: (ctx) => (containsHand(ctx.played, 'straight') ? { chips: 60 } : undefined),
  },
  {
    id: 'schneeball',
    name: 'Schneeball',
    description: 'Erhält +1 Mult für jede gespielte Hand (wächst den ganzen Run)',
    rarity: 'uncommon',
    cost: 6,
    onHandPlayed: (_ctx, j) => { j.vars.mult = (j.vars.mult ?? 0) + 1; },
    onIndependent: (_ctx, j) => ({ mult: j.vars.mult ?? 0 }),
  },
  {
    id: 'sparschwein',
    name: 'Sparschwein',
    description: '×0,1 Mult extra pro $5 im Besitz',
    rarity: 'rare',
    cost: 8,
    onIndependent: (ctx) => {
      const steps = Math.floor(Math.max(ctx.money, 0) / 5);
      return steps > 0 ? { xMult: 1 + steps * 0.1 } : undefined;
    },
  },
  {
    id: 'letzte_chance',
    name: 'Letzte Chance',
    description: '×2,5 Mult bei der letzten Hand der Runde',
    rarity: 'uncommon',
    cost: 6,
    onIndependent: (ctx) => (ctx.handsLeft === 0 ? { xMult: 2.5 } : undefined),
  },
];

export const JOKER_BY_ID: Record<string, JokerDef> = Object.fromEntries(JOKERS.map((j) => [j.id, j]));
