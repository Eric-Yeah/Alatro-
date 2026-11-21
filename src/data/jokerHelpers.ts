import { isRankless } from '../core/cards';
import type { JokerContext } from '../core/jokers';
import type { Card } from '../core/types';

/** Gemeinsame Hilfen der Joker Definitionen (jokers.ts und jokersMore.ts). */


/** Gewertete Karte mit Rang (ranglose Karten lösen keine Rang Bedingungen aus) */
export const scoredCard = (ctx: JokerContext): Card | undefined => (ctx.phase === 'scored' && ctx.card && !isRankless(ctx.card) ? ctx.card : undefined);
/** Karte in der Hand mit Rang */
export const heldCard = (ctx: JokerContext): Card | undefined => (ctx.phase === 'held' && ctx.card && !isRankless(ctx.card) ? ctx.card : undefined);
/** Karte, auf die sich ein Retrigger bezieht */
export const retriggerCard = (ctx: JokerContext, area: 'played' | 'held'): Card | undefined =>
  ctx.phase === 'retrigger' && ctx.area === area && ctx.card && !isRankless(ctx.card) ? ctx.card : undefined;

/** Gerade Ränge sind 2, 4, 6, 8, 10 */
export const isEven = (rank: number) => rank <= 10 && rank % 2 === 0;
/** Ungerade Ränge sind 3, 5, 7, 9 und Ace (Offener Punkt O43) */
export const isOdd = (rank: number) => rank === 14 || (rank <= 9 && rank % 2 === 1);

export const main = (ctx: JokerContext) => ctx.phase === 'main';
