import { hasSuit } from '../core/cards';
import type { JokerDef } from '../core/jokers';
import { heldCard, isEven, isOdd, main, retriggerCard, scoredCard } from './jokerHelpers';
import { JOKER_DEFS_MORE } from './jokersMore';

/**
 * Eigene Jokers (Thema: Sternwarte der Alchemisten), gruppiert nach Mechanik.
 * Alle Zahlen stehen in config, die Logik in calculate. IDs nie ändern (Spielstände).
 *
 * Gruppen: 1 Einfache MAIN, 2 SCORED und HELD, 3 Retrigger, 4 Skalierend, 5 Geld,
 * 6 Blind und Shop, 7 Passiv, 8 Spezial (Kopie, Rettung, Karten verändern, Legendary).
 */

/** Enhancement, das der Kupferschmied vergibt */
const SMITH_ENHANCEMENT = 'kupfer';

const JOKER_DEFS_BASE: JokerDef[] = [
  // ═══════════════════════════════════════════ Gruppe 1: Einfache MAIN Jokers
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
  {
    id: 'kiesel', name: 'Kiesel', rarity: 'common', cost: 2, copyCompat: true,
    config: { chips: 30 }, description: '+{chips} Chips',
    calculate: (ctx, _s, cfg) => (main(ctx) ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'blasebalg', name: 'Blasebalg', rarity: 'common', cost: 3, copyCompat: true,
    config: { mult: 3, chips: 20 }, description: '+{mult} Mult und +{chips} Chips',
    calculate: (ctx, _s, cfg) => (main(ctx) ? { mult: cfg.mult, chips: cfg.chips } : undefined),
  },
  {
    id: 'kerzenlicht', name: 'Kerzenlicht', rarity: 'common', cost: 3, copyCompat: true,
    config: { mult: 7 }, description: '+{mult} Mult, wenn die Hand ein Pair enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('pair') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'doppelflamme', name: 'Doppelflamme', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 10 }, description: '+{mult} Mult, wenn die Hand Two Pair enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('twoPair') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'milchglas', name: 'Milchglas', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 70 }, description: '+{chips} Chips, wenn die Hand einen Flush enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('flush') ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'fuenfklang', name: 'Fünfklang', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 12, cards: 5 }, description: '+{mult} Mult, wenn genau {cards} Karten gespielt werden',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.played.length === cfg.cards ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'leisetreter', name: 'Leisetreter', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 100, maxCards: 2 }, description: '+{chips} Chips, wenn höchstens {maxCards} Karten gespielt werden',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.played.length <= cfg.maxCards ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'hochstapler', name: 'Hochstapler', rarity: 'common', cost: 3, copyCompat: true,
    config: { xMult: 1.4 }, description: 'X{xMult} Mult, wenn die Hand nur eine High Card ist',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.handType === 'highCard' ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'dreifuss', name: 'Dreifuß', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 2 }, description: 'X{xMult} Mult, wenn die Hand Three of a Kind enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('threeKind') ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'gaestehaus', name: 'Gästehaus', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 2 }, description: 'X{xMult} Mult, wenn die Hand ein Full House enthält',
    calculate: (ctx, _s, cfg) => (main(ctx) && ctx.contained.has('fullHouse') ? { xMult: cfg.xMult } : undefined),
  },
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

  // ═══════════════════════════════════════════ Gruppe 2: SCORED und HELD Jokers
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
  {
    id: 'herzblut', name: 'Herzblut', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 3 }, description: 'Jede gewertete Karte in Hearts gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'H') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'diamantstaub', name: 'Diamantstaub', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 25 }, description: 'Jede gewertete Karte in Diamonds gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'D') ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'nachtschatten', name: 'Nachtschatten', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 3 }, description: 'Jede gewertete Karte in Spades gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'S') ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'efeu', name: 'Efeu', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 25 }, description: 'Jede gewertete Karte in Clubs gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.card && hasSuit(ctx.card, 'C') ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'hofstaat', name: 'Hofstaat', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 4 }, description: 'Jede gewertete Face Card gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scoredCard(ctx);
      return c && ctx.isFace(c) ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'gleichmut', name: 'Gleichmut', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 3 }, description: 'Jede gewertete Karte mit geradem Rang (2, 4, 6, 8, 10) gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scoredCard(ctx);
      return c && isEven(c.rank) ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'kauz', name: 'Kauz', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 31 }, description: 'Jede gewertete Karte mit ungeradem Rang (3, 5, 7, 9, Ace) gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => {
      const c = scoredCard(ctx);
      return c && isOdd(c.rank) ? { chips: cfg.chips } : undefined;
    },
  },
  {
    id: 'adlerauge', name: 'Adlerauge', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 40 }, description: 'Jedes gewertete Ace gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => (scoredCard(ctx)?.rank === 14 ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'fruehaufsteher', name: 'Frühaufsteher', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 8 }, description: 'Die erste gewertete Karte gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.index === 0 ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'schlussakkord', name: 'Schlussakkord', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 35 }, description: 'Die letzte gewertete Karte gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.index === ctx.scoring.length - 1 ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'wachposten', name: 'Wachposten', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 3 }, description: 'Jede Face Card in der Hand gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = heldCard(ctx);
      return c && ctx.isFace(c) ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'ruhekissen', name: 'Ruhekissen', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 15, maxRank: 4 }, description: 'Jede Karte in der Hand mit Rang 2 bis {maxRank} gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => {
      const c = heldCard(ctx);
      return c && c.rank <= cfg.maxRank ? { chips: cfg.chips } : undefined;
    },
  },
  {
    id: 'vorrat', name: 'Vorrat', rarity: 'common', cost: 5, copyCompat: true,
    config: { chips: 10 }, description: 'Jede Karte in der Hand gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'held' ? { chips: cfg.chips } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe 3: Retrigger Jokers
  {
    id: 'kleines_echo', name: 'Kleines Echo', rarity: 'common', cost: 5, copyCompat: true,
    config: { retrigger: 1, maxRank: 5 }, description: 'Gewertete Karten mit Rang 2 bis {maxRank} werden {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => {
      const c = retriggerCard(ctx, 'played');
      return c && c.rank <= cfg.maxRank ? { retrigger: cfg.retrigger } : undefined;
    },
  },
  {
    id: 'hofecho', name: 'Hofecho', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { retrigger: 1 }, description: 'Gewertete Face Cards werden {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => {
      const c = retriggerCard(ctx, 'played');
      return c && ctx.isFace(c) ? { retrigger: cfg.retrigger } : undefined;
    },
  },
  {
    id: 'adlerecho', name: 'Adlerecho', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { retrigger: 1 }, description: 'Gewertete Aces werden {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => (retriggerCard(ctx, 'played')?.rank === 14 ? { retrigger: cfg.retrigger } : undefined),
  },
  {
    id: 'erstschlag', name: 'Erstschlag', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { retrigger: 2 }, description: 'Die erste gewertete Karte wird {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'retrigger' && ctx.area === 'played' && ctx.index === 0 ? { retrigger: cfg.retrigger } : undefined),
  },
  {
    id: 'schlussecho', name: 'Schlussecho', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { retrigger: 1 }, description: 'Bei der letzten Hand der Runde werden alle gewerteten Karten {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'retrigger' && ctx.area === 'played' && ctx.handsLeft === 0 ? { retrigger: cfg.retrigger } : undefined),
  },
  {
    id: 'haltegriff', name: 'Haltegriff', rarity: 'rare', cost: 8, copyCompat: true,
    config: { retrigger: 1 }, description: 'Effekte von Karten in der Hand werden {retrigger} Mal erneut ausgewertet',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'retrigger' && ctx.area === 'held' ? { retrigger: cfg.retrigger } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe 4: Skalierende Jokers
  {
    id: 'schneeball', name: 'Schneeball', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { gain: 1 }, description: 'Erhält +{gain} Mult pro gespielter Hand (aktuell +{mult} Mult)',
    init: () => ({ mult: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'before') self.vars.mult = (self.vars.mult ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.mult) return { mult: self.vars.mult };
    },
  },
  {
    id: 'lawine', name: 'Lawine', rarity: 'common', cost: 5, copyCompat: true,
    config: { gain: 4 }, description: 'Erhält +{gain} Chips pro Discard (aktuell +{chips} Chips)',
    init: () => ({ chips: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'discard') self.vars.chips = (self.vars.chips ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.chips) return { chips: self.vars.chips };
    },
  },
  {
    id: 'glimmer', name: 'Glimmer', rarity: 'common', cost: 5, copyCompat: true,
    config: { gain: 3 }, description: 'Erhält +{gain} Mult, wenn die Hand einen Flush enthält (aktuell +{mult} Mult)',
    init: () => ({ mult: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'after' && ctx.contained.has('flush')) self.vars.mult = (self.vars.mult ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.mult) return { mult: self.vars.mult };
    },
  },
  {
    id: 'pfadfinder', name: 'Pfadfinder', rarity: 'common', cost: 6, copyCompat: true,
    config: { gain: 6 }, description: 'Erhält +{gain} Chips, wenn die Hand eine Straight enthält (aktuell +{chips} Chips)',
    init: () => ({ chips: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'after' && ctx.contained.has('straight')) self.vars.chips = (self.vars.chips ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.chips) return { chips: self.vars.chips };
    },
  },
  {
    id: 'gezeiten', name: 'Gezeiten', rarity: 'common', cost: 5, copyCompat: true,
    config: { gain: 2 }, description: 'Erhält +{gain} Mult pro geschafftem Blind (aktuell +{mult} Mult)',
    init: () => ({ mult: 0 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'roundEnd') self.vars.mult = (self.vars.mult ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.mult) return { mult: self.vars.mult };
    },
  },
  {
    id: 'wachskerze', name: 'Wachskerze', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { start: 3, loss: 0.5 }, description: 'X{x} Mult, verliert X{loss} pro gespielter Hand und brennt bei X1 ab',
    init: (cfg) => ({ x: cfg.start }),
    calculate: (ctx, self, cfg) => {
      const x = self.vars.x ?? cfg.start;
      if (ctx.phase === 'main') return { xMult: x };
      if (ctx.phase === 'after') {
        self.vars.x = x - cfg.loss;
        if (self.vars.x <= 1) return { destroySelf: true };
      }
    },
  },
  {
    id: 'zwillingsring', name: 'Zwillingsring', rarity: 'rare', cost: 8, copyCompat: true,
    config: { gain: 0.15 }, description: 'Erhält X{gain} Mult, wenn die Hand ein Pair enthält (aktuell X{x} Mult)',
    init: () => ({ x: 1 }),
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'after' && ctx.contained.has('pair')) self.vars.x = (self.vars.x ?? 1) + cfg.gain;
      if (ctx.phase === 'main' && (self.vars.x ?? 1) > 1) return { xMult: self.vars.x };
    },
  },

  // ═══════════════════════════════════════════ Gruppe 5: Geld Jokers
  {
    id: 'sparschwein', name: 'Sparschwein', rarity: 'rare', cost: 8, copyCompat: true,
    config: { step: 5, xPerStep: 0.1 }, description: 'X{xPerStep} Mult extra pro ${step} im Besitz',
    calculate: (ctx, _s, cfg) => {
      if (ctx.phase !== 'main') return;
      const steps = Math.floor(Math.max(ctx.money, 0) / cfg.step);
      return steps > 0 ? { xMult: 1 + steps * cfg.xPerStep } : undefined;
    },
  },
  {
    id: 'muenzquelle', name: 'Münzquelle', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 3 }, description: '+${money} am Ende jeder Runde',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'roundEnd' ? { money: cfg.money } : undefined),
  },
  {
    id: 'handarbeit', name: 'Handarbeit', rarity: 'common', cost: 5, copyCompat: true,
    config: { money: 1 }, description: '+${money} pro übriger Hand am Ende der Runde',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'roundEnd' && ctx.handsLeft > 0 ? { money: cfg.money * ctx.handsLeft } : undefined),
  },
  {
    id: 'zinsmeister', name: 'Zinsmeister', rarity: 'uncommon', cost: 6, copyCompat: false,
    config: { cap: 5 }, description: 'Der Zinsdeckel steigt um ${cap}',
    passive: (cfg) => ({ interestCapDelta: cfg.cap }),
  },
  {
    id: 'goldwaescher', name: 'Goldwäscher', rarity: 'common', cost: 5, copyCompat: true,
    config: { money: 1, num: 1, den: 4 }, description: 'Jede gewertete Karte: {num} in {den} Chance auf +${money}',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'scored' && ctx.chance(cfg.num, cfg.den, 'goldwaescher') ? { money: cfg.money } : undefined),
  },
  {
    id: 'glueckstaler', name: 'Glückstaler', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 2, num: 1, den: 3, rank: 7 }, description: 'Jede gewertete {rank}: {num} in {den} Chance auf +${money}',
    calculate: (ctx, _s, cfg) => {
      const c = scoredCard(ctx);
      return c && c.rank === cfg.rank && ctx.chance(cfg.num, cfg.den, 'glueckstaler') ? { money: cfg.money } : undefined;
    },
  },
  {
    id: 'kartenhaendler', name: 'Kartenhändler', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 1 }, description: '+${money} pro abgeworfener Face Card',
    calculate: (ctx, _s, cfg) => {
      if (ctx.phase !== 'discard') return;
      const n = (ctx.discarded ?? []).filter((c) => ctx.isFace(c)).length;
      return n > 0 ? { money: cfg.money * n } : undefined;
    },
  },
  {
    id: 'beutezug', name: 'Beutezug', rarity: 'uncommon', cost: 5, copyCompat: true,
    config: { money: 4 }, description: '+${money}, wenn ein Boss Blind geschafft wird',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'roundEnd' && ctx.blind === 'boss' ? { money: cfg.money } : undefined),
  },
  {
    id: 'rentner', name: 'Rentner', rarity: 'common', cost: 5, copyCompat: true,
    config: { every: 2 }, description: '+$1 pro {every} Antes am Ende jeder Runde (mindestens $1)',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'roundEnd' ? { money: Math.max(1, Math.floor((ctx.ante ?? 1) / cfg.every)) } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe 6: Blind und Shop Jokers
  {
    id: 'wuerfelhand', name: 'Würfelhand', rarity: 'common', cost: 5, copyCompat: false,
    config: { count: 1 }, description: '{count} gratis Reroll pro Shop',
    passive: (cfg) => ({ freeRerolls: cfg.count }),
  },
  {
    id: 'marktschreier', name: 'Marktschreier', rarity: 'uncommon', cost: 6, copyCompat: false,
    config: { slots: 1 }, description: '+{slots} Karten Slot im Shop',
    passive: (cfg) => ({ shopSlots: cfg.slots }),
  },
  {
    id: 'kundenkarte', name: 'Kundenkarte', rarity: 'uncommon', cost: 5, copyCompat: false,
    config: { discount: 0.85 }, description: 'Karten und Packs im Shop kosten 15% weniger',
    passive: (cfg) => ({ discount: cfg.discount }),
  },
  {
    id: 'hehler', name: 'Hehler', rarity: 'common', cost: 7, copyCompat: false,
    config: { money: 8 }, description: 'Beim Verkauf dieses Jokers: +${money}',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'sell' ? { money: cfg.money } : undefined),
  },
  {
    id: 'lagerfeuer', name: 'Lagerfeuer', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 2 }, description: 'Bei der Wahl des Small Blinds: +${money}',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'blindSelected' && ctx.blind === 'small' ? { money: cfg.money } : undefined),
  },
  {
    id: 'sternwart', name: 'Sternwart', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: {}, description: 'Bei jeder Blind Wahl entsteht ein Sternbild (wenn ein Slot frei ist)',
    calculate: (ctx) => (ctx.phase === 'blindSelected' ? { consumables: ['sternbild'] } : undefined),
  },
  {
    id: 'lehrling', name: 'Lehrling', rarity: 'common', cost: 5, copyCompat: true,
    config: {}, description: 'Bei der Wahl eines Boss Blinds entsteht ein Elixier (wenn ein Slot frei ist)',
    calculate: (ctx) => (ctx.phase === 'blindSelected' && ctx.blind === 'boss' ? { consumables: ['elixier'] } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe 7: Passive Jokers
  {
    id: 'schnellgriff', name: 'Schnellgriff', rarity: 'uncommon', cost: 7, copyCompat: false,
    config: {}, description: 'Flush und Straight brauchen nur 4 Karten', rules: { fourFingers: true },
  },
  {
    id: 'sprungbrett', name: 'Sprungbrett', rarity: 'uncommon', cost: 7, copyCompat: false,
    config: {}, description: 'Straights dürfen Lücken von einem Rang haben', rules: { shortcut: true },
  },
  {
    id: 'farbwechsel', name: 'Farbwechsel', rarity: 'uncommon', cost: 7, copyCompat: false,
    config: {}, description: 'Hearts und Diamonds gelten als dieselbe Suit, ebenso Spades und Clubs', rules: { smeared: true },
  },
  {
    id: 'streuguss', name: 'Streuguss', rarity: 'uncommon', cost: 6, copyCompat: false,
    config: {}, description: 'Alle gespielten Karten werden gewertet', rules: { splash: true },
  },
  {
    id: 'maskenball', name: 'Maskenball', rarity: 'common', cost: 5, copyCompat: false,
    config: {}, description: 'Jede Karte gilt als Face Card', rules: { allFace: true },
  },
  {
    id: 'uhrwerk', name: 'Uhrwerk', rarity: 'rare', cost: 8, copyCompat: false,
    config: { amount: 1 }, description: '+{amount} Hand pro Runde',
    passive: (cfg) => ({ hands: cfg.amount }),
  },
  {
    id: 'pendel', name: 'Pendel', rarity: 'common', cost: 5, copyCompat: false,
    config: { amount: 1 }, description: '+{amount} Discard pro Runde',
    passive: (cfg) => ({ discards: cfg.amount }),
  },
  {
    id: 'falttasche', name: 'Falttasche', rarity: 'common', cost: 5, copyCompat: false,
    config: { amount: 1 }, description: '+{amount} Hand Size',
    passive: (cfg) => ({ handSize: cfg.amount }),
  },
  {
    id: 'gluecksklee', name: 'Glücksklee', rarity: 'uncommon', cost: 6, copyCompat: false,
    config: {}, description: 'Alle "num in den" Chancen werden verdoppelt',
    passive: () => ({ doubleProb: true }),
  },
  {
    id: 'guerteltasche', name: 'Gürteltasche', rarity: 'common', cost: 5, copyCompat: false,
    config: { amount: 1 }, description: '+{amount} Consumable Slot',
    passive: (cfg) => ({ consumableSlots: cfg.amount }),
  },
  {
    id: 'lastkarren', name: 'Lastkarren', rarity: 'rare', cost: 8, copyCompat: false,
    config: { amount: 1 }, description: '+{amount} Joker Slot',
    passive: (cfg) => ({ jokerSlots: cfg.amount }),
  },

  // ═══════════════════════════════════════════ Gruppe 8: Spezialfälle
  {
    id: 'spiegelbild', name: 'Spiegelbild', rarity: 'rare', cost: 9, copyCompat: false,
    config: {}, description: 'Kopiert den Joker rechts neben sich', copies: 'right',
  },
  {
    id: 'urbild', name: 'Urbild', rarity: 'rare', cost: 9, copyCompat: false,
    config: {}, description: 'Kopiert den Joker ganz links', copies: 'leftmost',
  },
  {
    id: 'schutzengel', name: 'Schutzengel', rarity: 'rare', cost: 8, copyCompat: false,
    config: { fraction: 0.25 }, rescue: true, minAnte: 2,
    description: 'Rettet einmal vor dem Verlust einer Runde, wenn mindestens ein Viertel des Ziels erreicht ist, und verbraucht sich',
  },
  {
    id: 'kupferschmied', name: 'Kupferschmied', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: {}, description: 'Die erste gewertete Karte ohne Enhancement wird dauerhaft zu Kupfer',
    calculate: (ctx) => (ctx.phase === 'after' ? { enhanceFirst: SMITH_ENHANCEMENT } : undefined),
  },
  {
    id: 'schleifstein', name: 'Schleifstein', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { gain: 3 }, description: 'Jede gewertete Karte erhält dauerhaft +{gain} Chips',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'after' ? { cardChips: cfg.gain } : undefined),
  },
  {
    id: 'gefolgschaft', name: 'Gefolgschaft', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { mult: 3 }, description: 'Jeder andere Common Joker, der in der Joker Phase wirkt, gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'other' && ctx.otherJoker?.rarity === 'common' ? { mult: cfg.mult } : undefined),
  },

  // Legendary: nie im Shop, nur über das Omen Ahnenruf
  {
    id: 'sternenkoenig', name: 'Sternenkönig', rarity: 'legendary', cost: 20, copyCompat: true,
    config: { xMult: 3 }, description: 'X{xMult} Mult',
    calculate: (ctx, _s, cfg) => (main(ctx) ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'ewiges_licht', name: 'Ewiges Licht', rarity: 'legendary', cost: 20, copyCompat: false,
    config: { amount: 1 }, description: '+{amount} Hand, +{amount} Discard und +{amount} Hand Size',
    passive: (cfg) => ({ hands: cfg.amount, discards: cfg.amount, handSize: cfg.amount }),
  },
  {
    id: 'meister_der_tinkturen', name: 'Meister der Tinkturen', rarity: 'legendary', cost: 20, copyCompat: true,
    config: {}, description: 'Bei jeder Blind Wahl entstehen ein Elixier und ein Sternbild (wenn Slots frei sind)',
    calculate: (ctx) => (ctx.phase === 'blindSelected' ? { consumables: ['elixier', 'sternbild'] } : undefined),
  },
];

/** Alle Jokers: Grundkatalog (79) und Erweiterung (71, siehe docs/joker-design-150.md) */
export const JOKER_DEFS: JokerDef[] = [...JOKER_DEFS_BASE, ...JOKER_DEFS_MORE];
