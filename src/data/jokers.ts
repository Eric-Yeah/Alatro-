import { hasSuit } from '../core/cards';
import type { JokerDef } from '../core/jokers';

/**
 * Eigene Jokers (Thema: Sternwarte der Alchemisten), gruppiert nach Mechanik.
 * Alle Zahlen stehen in config, die Logik in calculate.
 */
export const JOKER_DEFS: JokerDef[] = [
  // Einfache MAIN Jokers
  {
    id: 'funke', name: 'Funke', rarity: 'common', cost: 2, copyCompat: true,
    config: { mult: 4 }, description: '+{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'main' ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'treppe', name: 'Treppe', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 60 }, description: '+{chips} Chips, wenn die Hand eine Straight enthält',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'main' && ctx.contained.has('straight') ? { chips: cfg.chips } : undefined),
  },

  // SCORED Jokers
  {
    id: 'glut', name: 'Glut', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 2 }, description: 'Jede gewertete Karte in Hearts oder Diamonds gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) =>
      ctx.phase === 'scored' && ctx.card && (hasSuit(ctx.card, 'H') || hasSuit(ctx.card, 'D')) ? { mult: cfg.mult } : undefined,
  },
  {
    id: 'frost', name: 'Frost', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 15 }, description: 'Jede gewertete Karte in Spades oder Clubs gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) =>
      ctx.phase === 'scored' && ctx.card && (hasSuit(ctx.card, 'S') || hasSuit(ctx.card, 'C')) ? { chips: cfg.chips } : undefined,
  },
  {
    id: 'kleinvieh', name: 'Kleinvieh', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 3, maxRank: 5 }, description: 'Jede gewertete Karte mit Rang 2 bis {maxRank} gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && ctx.card.rank <= cfg.maxRank ? { mult: cfg.mult } : undefined),
  },

  // Bedingungen
  {
    id: 'einzelgaenger', name: 'Einzelgänger', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 3, cards: 1 }, description: 'X{xMult} Mult, wenn genau {cards} Karte gespielt wird',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'main' && ctx.played.length === cfg.cards ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'letzte_chance', name: 'Letzte Chance', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 2.5 }, description: 'X{xMult} Mult bei der letzten Hand der Runde',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'main' && ctx.handsLeft === 0 ? { xMult: cfg.xMult } : undefined),
  },

  // Skalierend
  {
    id: 'schneeball', name: 'Schneeball', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { gain: 1 }, description: 'Erhält +{gain} Mult pro gespielter Hand (aktuell +{mult} Mult)',
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'before') self.vars.mult = (self.vars.mult ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.mult) return { mult: self.vars.mult };
    },
  },

  // Wirtschaft
  {
    id: 'sparschwein', name: 'Sparschwein', rarity: 'rare', cost: 8, copyCompat: true,
    config: { step: 5, xPerStep: 0.1 }, description: 'X{xPerStep} Mult extra pro ${step} im Besitz',
    calculate: (ctx, _s, cfg) => {
      if (ctx.phase !== 'main') return;
      const steps = Math.floor(Math.max(ctx.money, 0) / cfg.step);
      return steps > 0 ? { xMult: 1 + steps * cfg.xPerStep } : undefined;
    },
  },
];
