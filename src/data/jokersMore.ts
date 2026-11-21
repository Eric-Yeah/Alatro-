import { hasSuit, isAnySuit, isRankless } from '../core/cards';
import type { JokerDef } from '../core/jokers';
import type { Card, Suit } from '../core/types';
import { heldCard, main, retriggerCard, scoredCard } from './jokerHelpers';

/**
 * Erweiterung des Joker Katalogs um 71 Jokers (Ziel 150), Entwurf und Balance Gedanken in
 * docs/joker-design-150.md. Alle Zahlen stehen in config. IDs nie ändern (Spielstände).
 *
 * Gruppen: A Hand Bedingungen, B Suits, Ränge und Hand, C Geld und Zähler, D Blind Hooks,
 * E Echo, F Wachsend, G X Mult, H Passiv, I Legendary.
 */

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

/** Alle vier Suits sind gewertet (Wild Karten füllen eine fehlende Suit) */
const showsAllSuits = (cards: Card[]) => {
  const real = cards.filter((c) => !isRankless(c));
  const wild = real.filter((c) => isAnySuit(c)).length;
  const natural = new Set(real.filter((c) => !isAnySuit(c)).map((c) => c.suit));
  return SUITS.length - natural.size <= wild;
};

/** Wachsender Wert in vars, bei jedem Aufruf der Phase um gain erhöht (Rundung gegen Gleitkomma Reste) */
const grow = (vars: Record<string, number>, key: string, gain: number, start: number) => {
  vars[key] = Math.round(((vars[key] ?? start) + gain) * 1000) / 1000;
};

export const JOKER_DEFS_MORE: JokerDef[] = [
  // ═══════════════════════════════════════════ Gruppe A: Hand Bedingungen (Common)
  {
    id: 'wetterhahn', name: 'Wetterhahn', rarity: 'common', cost: 3, copyCompat: true,
    config: { chips: 45 }, description: '+{chips} Chips, wenn die Hand ein Pair enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('pair') ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'drillbohrer', name: 'Drillbohrer', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 80 }, description: '+{chips} Chips, wenn die Hand Three of a Kind enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('threeKind') ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'viererbund', name: 'Viererbund', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 20 }, description: '+{mult} Mult, wenn die Hand Four of a Kind enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('fourKind') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'kleiner_kessel', name: 'Kleiner Kessel', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 9 }, description: '+{mult} Mult, wenn die Hand einen Flush enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('flush') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'meilenstein', name: 'Meilenstein', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 9 }, description: '+{mult} Mult, wenn die Hand eine Straight enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('straight') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'dreiklang', name: 'Dreiklang', rarity: 'common', cost: 3, copyCompat: true,
    config: { mult: 8, cards: 3 }, description: '+{mult} Mult, wenn genau {cards} Karten gespielt werden',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.played.length === cfg.cards ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'viertakt', name: 'Viertakt', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 10, cards: 4 }, description: '+{mult} Mult, wenn genau {cards} Karten gespielt werden',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.played.length === cfg.cards ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'zwillingsmond', name: 'Zwillingsmond', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 60 }, description: '+{chips} Chips, wenn die Hand Two Pair enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('twoPair') ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'hausmusik', name: 'Hausmusik', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 15 }, description: '+{mult} Mult, wenn die Hand ein Full House enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('fullHouse') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'einsiedler', name: 'Einsiedler', rarity: 'common', cost: 3, copyCompat: true,
    config: { chips: 50 }, description: '+{chips} Chips, wenn die Hand nur eine High Card ist',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.handType === 'highCard' ? { chips: cfg.chips } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe B: Suits, Ränge, Karten in der Hand (Common)
  {
    id: 'rotwein', name: 'Rotwein', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 20 }, description: 'Jede gewertete Karte in Hearts gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'H') ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'bernstein', name: 'Bernstein', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 3 }, description: 'Jede gewertete Karte in Diamonds gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'D') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'schiefer', name: 'Schiefer', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 25 }, description: 'Jede gewertete Karte in Spades gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'S') ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'moos', name: 'Moos', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 3 }, description: 'Jede gewertete Karte in Clubs gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'C') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'zehnkampf', name: 'Zehnkampf', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 4, rank: 10 }, description: 'Jede gewertete {rank} gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (scoredCard(ctx)?.rank === cfg.rank ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'zweitschlag', name: 'Zweitschlag', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 40 }, description: 'Die zweite gewertete Karte gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.index === 1 ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'warme_stube', name: 'Warme Stube', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 2 }, description: 'Jede Karte in Hearts in der Hand gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = heldCard(ctx);
      return c && hasSuit(c, 'H') ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'kalter_keller', name: 'Kalter Keller', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 15 }, description: 'Jede Karte in Spades in der Hand gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => {
      const c = heldCard(ctx);
      return c && hasSuit(c, 'S') ? { chips: cfg.chips } : undefined;
    },
  },
  {
    id: 'federkiel', name: 'Federkiel', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 2 }, description: '+{mult} Mult pro Karte in der Hand',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.held.length > 0 ? { mult: cfg.mult * ctx.held.length } : undefined),
  },
  {
    id: 'perlenschnur', name: 'Perlenschnur', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 2 }, description: '+{mult} Mult pro gewerteter Karte',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.scoring.length > 0 ? { mult: cfg.mult * ctx.scoring.length } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe C: Geld und Zähler (Common)
  {
    id: 'sparfuchs', name: 'Sparfuchs', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 2 }, description: '+{mult} Mult pro übrigem Discard',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.discardsLeft > 0 ? { mult: cfg.mult * ctx.discardsLeft } : undefined),
  },
  {
    id: 'vorsprung', name: 'Vorsprung', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 2 }, description: '+{mult} Mult pro übriger Hand',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.handsLeft > 0 ? { mult: cfg.mult * ctx.handsLeft } : undefined),
  },
  {
    id: 'sparstrumpf', name: 'Sparstrumpf', rarity: 'common', cost: 4, copyCompat: true,
    config: { step: 4, mult: 1 }, description: '+{mult} Mult pro ${step} im Besitz',
    calculate: (ctx, _s, cfg) => {
      if (!main(ctx)) return;
      const steps = Math.floor(Math.max(ctx.money, 0) / cfg.step);
      return steps > 0 ? { mult: steps * cfg.mult } : undefined;
    },
  },
  {
    id: 'spardose', name: 'Spardose', rarity: 'common', cost: 5, copyCompat: true,
    config: { step: 10, money: 1 }, description: '+${money} am Ende jeder Runde pro ${step} im Besitz',
    calculate: (ctx, _s, cfg) => {
      if (ctx.phase !== 'roundEnd') return;
      const n = Math.floor(Math.max(ctx.money, 0) / cfg.step);
      return n > 0 ? { money: n * cfg.money } : undefined;
    },
  },
  {
    id: 'kleiner_zoll', name: 'Kleiner Zoll', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 3 }, description: '+${money}, wenn ein Small Blind geschafft wird',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'roundEnd' && ctx.blind === 'small' ? { money: cfg.money } : undefined),
  },
  {
    id: 'mautbruecke', name: 'Mautbrücke', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 3 }, description: '+${money}, wenn ein Big Blind geschafft wird',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'roundEnd' && ctx.blind === 'big' ? { money: cfg.money } : undefined),
  },
  {
    id: 'flohmarkt', name: 'Flohmarkt', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 1, cards: 5 }, description: '+${money}, wenn ein Discard genau {cards} Karten abwirft',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'discard' && (ctx.discarded ?? []).length === cfg.cards ? { money: cfg.money } : undefined),
  },
  {
    id: 'mutprobe', name: 'Mutprobe', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 12 }, description: '+{mult} Mult in einem Boss Blind',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.blind === 'boss' ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'notnagel', name: 'Notnagel', rarity: 'common', cost: 3, copyCompat: true,
    config: { mult: 10 }, description: '+{mult} Mult, wenn keine Discards übrig sind',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.discardsLeft === 0 ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'sedimente', name: 'Sedimente', rarity: 'common', cost: 4, copyCompat: true,
    config: { gain: 5 }, description: 'Erhält +{gain} Chips pro gespielter Hand (aktuell +{chips} Chips)',
    init: () => ({ chips: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'before') self.vars.chips = (self.vars.chips ?? 0) + cfg.gain;
      if (main(ctx) && self.vars.chips) return { chips: self.vars.chips };
    },
  },
  {
    id: 'staubwolke', name: 'Staubwolke', rarity: 'common', cost: 4, copyCompat: true,
    config: { gain: 2 }, description: 'Erhält +{gain} Chips pro gewerteter Karte (aktuell +{chips} Chips)',
    init: () => ({ chips: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'after') self.vars.chips = (self.vars.chips ?? 0) + cfg.gain * ctx.scoring.length;
      if (main(ctx) && self.vars.chips) return { chips: self.vars.chips };
    },
  },

  // ═══════════════════════════════════════════ Gruppe D: Blind Hooks (Common)
  {
    id: 'gasthaus', name: 'Gasthaus', rarity: 'common', cost: 5, copyCompat: true,
    config: { money: 3 }, description: 'Bei der Wahl des Big Blinds: +${money}',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'blindSelected' && ctx.blind === 'big' ? { money: cfg.money } : undefined),
  },
  {
    id: 'sternschnuppe', name: 'Sternschnuppe', rarity: 'common', cost: 5, copyCompat: true,
    config: {}, description: 'Bei der Wahl des Small Blinds entsteht ein Sternbild (wenn ein Slot frei ist)',
    calculate: (ctx) => (ctx.phase === 'blindSelected' && ctx.blind === 'small' ? { consumables: ['sternbild'] } : undefined),
  },
  {
    id: 'kraeuterbeet', name: 'Kräuterbeet', rarity: 'common', cost: 5, copyCompat: true,
    config: {}, description: 'Bei der Wahl des Big Blinds entsteht ein Elixier (wenn ein Slot frei ist)',
    calculate: (ctx) => (ctx.phase === 'blindSelected' && ctx.blind === 'big' ? { consumables: ['elixier'] } : undefined),
  },

  // ═══════════════════════════════════════════ Uncommon: X Mult mit Bedingung
  {
    id: 'regenbogen', name: 'Regenbogen', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 1.5 }, description: 'X{xMult} Mult, wenn die Hand einen Flush enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('flush') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'sternenpfad', name: 'Sternenpfad', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 1.5 }, description: 'X{xMult} Mult, wenn die Hand eine Straight enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('straight') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'zwillingspaar', name: 'Zwillingspaar', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 1.5 }, description: 'X{xMult} Mult, wenn die Hand Two Pair enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('twoPair') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'viererkette', name: 'Viererkette', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { xMult: 3 }, description: 'X{xMult} Mult, wenn die Hand Four of a Kind enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('fourKind') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'duo', name: 'Duo', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 1.8, cards: 2 }, description: 'X{xMult} Mult, wenn genau {cards} Karten gespielt werden',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.played.length === cfg.cards ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'bettelmann', name: 'Bettelmann', rarity: 'uncommon', cost: 5, copyCompat: true,
    config: { xMult: 2, maxMoney: 4 }, description: 'X{xMult} Mult, wenn du höchstens ${maxMoney} hast',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.money <= cfg.maxMoney ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'himmelsscheibe', name: 'Himmelsscheibe', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { xMult: 1.25 }, description: 'X{xMult} Mult',
    calculate: (ctx, _s, cfg) => (main(ctx) ? { xMult: cfg.xMult } : undefined),
  },

  // ═══════════════════════════════════════════ Uncommon: Echo, Karten Zusätze, Hand
  {
    id: 'herzecho', name: 'Herzecho', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { retrigger: 1 }, description: 'Gewertete Karten in Hearts werden {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => {
      const c = retriggerCard(ctx, 'played');
      return c && hasSuit(c, 'H') ? { retrigger: cfg.retrigger } : undefined;
    },
  },
  {
    id: 'nachtecho', name: 'Nachtecho', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { retrigger: 1 }, description: 'Gewertete Karten in Spades werden {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => {
      const c = retriggerCard(ctx, 'played');
      return c && hasSuit(c, 'S') ? { retrigger: cfg.retrigger } : undefined;
    },
  },
  {
    id: 'glueckszahl', name: 'Glückszahl', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { retrigger: 2, rank: 7 }, description: 'Gewertete {rank} werden {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => (retriggerCard(ctx, 'played')?.rank === cfg.rank ? { retrigger: cfg.retrigger } : undefined),
  },
  {
    id: 'verzauberer', name: 'Verzauberer', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { mult: 4 }, description: 'Jede gewertete Karte mit Enhancement gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card?.enhancement ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'siegelwart', name: 'Siegelwart', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { mult: 6 }, description: 'Jede gewertete Karte mit Seal gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card?.seal ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'zehntner', name: 'Zehntner', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { money: 2, num: 1, den: 4 }, description: 'Jede gewertete Face Card: {num} in {den} Chance auf +${money}',
    calculate: (ctx, _s, cfg) => {
      const c = scoredCard(ctx);
      return c && ctx.isFace(c) && ctx.chance(cfg.num, cfg.den, 'zehntner') ? { money: cfg.money } : undefined;
    },
  },
  {
    id: 'vierlicht', name: 'Vierlicht', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { mult: 16 }, description: '+{mult} Mult, wenn die gewerteten Karten alle vier Suits zeigen (Wild Karten füllen eine Lücke)',
    calculate: (ctx, _s, cfg) => (main(ctx) && showsAllSuits(ctx.scoring) ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'gezeitenkalender', name: 'Gezeitenkalender', rarity: 'uncommon', cost: 5, copyCompat: true,
    config: { mult: 12, chips: 70 }, description: 'In ungeraden Antes +{mult} Mult, in geraden Antes +{chips} Chips',
    calculate: (ctx, _s, cfg) => {
      if (!main(ctx)) return;
      return (ctx.ante ?? 1) % 2 === 1 ? { mult: cfg.mult } : { chips: cfg.chips };
    },
  },

  // ═══════════════════════════════════════════ Uncommon: wachsend, Blind Hooks, Passiv
  {
    id: 'windhose', name: 'Windhose', rarity: 'uncommon', cost: 5, copyCompat: true,
    config: { gain: 1 }, description: 'Erhält +{gain} Mult pro Discard (aktuell +{mult} Mult)',
    init: () => ({ mult: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'discard') self.vars.mult = (self.vars.mult ?? 0) + cfg.gain;
      if (main(ctx) && self.vars.mult) return { mult: self.vars.mult };
    },
  },
  {
    id: 'kreidestriche', name: 'Kreidestriche', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { gain: 3 }, description: 'Erhält +{gain} Mult pro geschafftem Boss Blind (aktuell +{mult} Mult)',
    init: () => ({ mult: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'roundEnd' && ctx.blind === 'boss') self.vars.mult = (self.vars.mult ?? 0) + cfg.gain;
      if (main(ctx) && self.vars.mult) return { mult: self.vars.mult };
    },
  },
  {
    id: 'elixierbrauer', name: 'Elixierbrauer', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: {}, description: 'Bei der Wahl des Big und des Boss Blinds entsteht je ein Elixier (wenn ein Slot frei ist)',
    calculate: (ctx) => (ctx.phase === 'blindSelected' && (ctx.blind === 'big' || ctx.blind === 'boss') ? { consumables: ['elixier'] } : undefined),
  },
  {
    id: 'orakel', name: 'Orakel', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: {}, description: 'Bei der Wahl des Boss Blinds entsteht ein Omen (wenn ein Slot frei ist)',
    calculate: (ctx) => (ctx.phase === 'blindSelected' && ctx.blind === 'boss' ? { consumables: ['omen'] } : undefined),
  },
  {
    id: 'gluecksspieler', name: 'Glücksspieler', rarity: 'uncommon', cost: 6, copyCompat: false,
    config: { count: 3 }, description: '{count} gratis Rerolls pro Shop',
    passive: (cfg) => ({ freeRerolls: cfg.count }),
  },
  {
    id: 'weiter_mantel', name: 'Weiter Mantel', rarity: 'uncommon', cost: 7, copyCompat: false,
    config: { amount: 2 }, description: '+{amount} Hand Size',
    passive: (cfg) => ({ handSize: cfg.amount }),
  },

  // ═══════════════════════════════════════════ Rare
  {
    id: 'trophaeensammler', name: 'Trophäensammler', rarity: 'rare', cost: 8, copyCompat: true,
    config: { gain: 0.2 }, description: 'Erhält X{gain} Mult pro geschafftem Boss Blind (aktuell X{x} Mult)',
    init: () => ({ x: 1 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'roundEnd' && ctx.blind === 'boss') grow(self.vars, 'x', cfg.gain, 1);
      if (main(ctx) && (self.vars.x ?? 1) > 1) return { xMult: self.vars.x };
    },
  },
  {
    id: 'sternuhr', name: 'Sternuhr', rarity: 'rare', cost: 9, copyCompat: true,
    config: { gain: 0.05 }, description: 'Erhält X{gain} Mult pro gespielter Hand (aktuell X{x} Mult)',
    init: () => ({ x: 1 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'before') grow(self.vars, 'x', cfg.gain, 1);
      if (main(ctx) && (self.vars.x ?? 1) > 1) return { xMult: self.vars.x };
    },
  },
  {
    id: 'sonnenkorona', name: 'Sonnenkorona', rarity: 'rare', cost: 9, copyCompat: true,
    config: { xMult: 4 }, description: 'X{xMult} Mult, wenn die Hand einen Straight Flush enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('straightFlush') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'meisterwerk', name: 'Meisterwerk', rarity: 'rare', cost: 9, copyCompat: true,
    config: { xMult: 1.1 }, description: 'Jede gewertete Karte mit Enhancement gibt X{xMult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card?.enhancement ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'nachtwandler', name: 'Nachtwandler', rarity: 'rare', cost: 8, copyCompat: true,
    config: { xMult: 1.12 }, description: 'Jede gewertete Karte in Spades gibt X{xMult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'S') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'purpurgarde', name: 'Purpurgarde', rarity: 'rare', cost: 8, copyCompat: true,
    config: { xMult: 1.12 }, description: 'Jede gewertete Karte in Hearts gibt X{xMult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'H') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'kapitalist', name: 'Kapitalist', rarity: 'rare', cost: 8, copyCompat: true,
    config: { step: 4, money: 1, cap: 6 }, description: '+${money} am Ende jeder Runde pro ${step} im Besitz (höchstens +${cap})',
    calculate: (ctx, _s, cfg) => {
      if (ctx.phase !== 'roundEnd') return;
      const n = Math.min(cfg.cap, Math.floor(Math.max(ctx.money, 0) / cfg.step) * cfg.money);
      return n > 0 ? { money: n } : undefined;
    },
  },
  {
    id: 'echokammer', name: 'Echokammer', rarity: 'rare', cost: 8, copyCompat: true,
    config: { retrigger: 2, cards: 2 }, description: 'Bei genau {cards} gespielten Karten werden alle gewerteten Karten {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) =>
      ctx.phase === 'retrigger' && ctx.area === 'played' && ctx.played.length === cfg.cards ? { retrigger: cfg.retrigger } : undefined,
  },
  {
    id: 'alles_oder_nichts', name: 'Alles oder Nichts', rarity: 'rare', cost: 9, copyCompat: true,
    config: { xMult: 2.5 }, description: 'X{xMult} Mult, wenn keine Discards übrig sind',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.discardsLeft === 0 ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'zufallskugel', name: 'Zufallskugel', rarity: 'rare', cost: 8, copyCompat: true,
    config: { xMult: 5, num: 1, den: 5 }, description: '{num} in {den} Chance auf X{xMult} Mult',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.chance(cfg.num, cfg.den, 'zufallskugel') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'konstellation', name: 'Konstellation', rarity: 'rare', cost: 9, copyCompat: true,
    config: { per: 0.25 }, description: 'X{per} Mult pro in der Hand enthaltener Handart (High Card zählt nicht)',
    calculate: (ctx, _s, cfg) => {
      if (!main(ctx)) return;
      const n = ctx.contained.size - (ctx.contained.has('highCard') ? 1 : 0);
      return n > 0 ? { xMult: Math.round((1 + cfg.per * n) * 1000) / 1000 } : undefined;
    },
  },
  {
    id: 'weltenwanderer', name: 'Weltenwanderer', rarity: 'rare', cost: 9, copyCompat: true,
    config: { per: 0.25 }, description: 'X1 plus X{per} pro Ante nach der ersten',
    calculate: (ctx, _s, cfg) => {
      if (!main(ctx)) return;
      const steps = Math.max(0, (ctx.ante ?? 1) - 1);
      return steps > 0 ? { xMult: Math.round((1 + cfg.per * steps) * 1000) / 1000 } : undefined;
    },
  },

  // ═══════════════════════════════════════════ Legendary: nie im Shop, nur über das Omen Ahnenruf
  {
    id: 'weltenesche', name: 'Weltenesche', rarity: 'legendary', cost: 20, copyCompat: false,
    config: { jokerSlots: 1, consumableSlots: 1, shopSlots: 1 }, description: '+{jokerSlots} Joker Slot, +{consumableSlots} Consumable Slot und +{shopSlots} Karten Slot im Shop',
    passive: (cfg) => ({ jokerSlots: cfg.jokerSlots, consumableSlots: cfg.consumableSlots, shopSlots: cfg.shopSlots }),
  },
  {
    id: 'goldquelle', name: 'Goldquelle', rarity: 'legendary', cost: 20, copyCompat: false,
    config: { money: 5, cap: 5 }, description: '+${money} am Ende jeder Runde, der Zinsdeckel steigt um ${cap}',
    passive: (cfg) => ({ interestCapDelta: cfg.cap }),
    calculate: (ctx, _s, cfg) => (ctx.phase === 'roundEnd' ? { money: cfg.money } : undefined),
  },
  {
    id: 'urecho', name: 'Urecho', rarity: 'legendary', cost: 20, copyCompat: false,
    config: { retrigger: 1 }, description: 'Alle gewerteten Karten werden {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'retrigger' && ctx.area === 'played' ? { retrigger: cfg.retrigger } : undefined),
  },
  {
    id: 'kometenschauer', name: 'Kometenschauer', rarity: 'legendary', cost: 20, copyCompat: true,
    config: { xMult: 1.15 }, description: 'Jede gewertete Karte gibt X{xMult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' ? { xMult: cfg.xMult } : undefined),
  },
];
