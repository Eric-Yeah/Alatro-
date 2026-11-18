import { hasSuit, isRankless } from '../core/cards';
import type { JokerContext, JokerDef } from '../core/jokers';
import type { Card, HandType } from '../core/types';
import { ENHANCEMENTS } from './modifiers';

/**
 * Eigene Jokers (Thema: Sternwarte der Alchemisten), gruppiert nach Mechanik.
 * Alle Zahlen stehen in config, passive oder startVars, die Logik in calculate.
 * IDs nie ändern (Spielstände).
 */

// ─────────────────────────────────────────────── kleine Bausteine

/** gewertete Karte, die nicht geschwächt ist */
const scored = (ctx: JokerContext): Card | undefined => (ctx.phase === 'scored' && ctx.card && !ctx.card.debuffed ? ctx.card : undefined);
const held = (ctx: JokerContext): Card | undefined => (ctx.phase === 'held' && ctx.card && !ctx.card.debuffed ? ctx.card : undefined);
const mainIf = (ctx: JokerContext, cond: boolean) => ctx.phase === 'main' && cond;
const contains = (ctx: JokerContext, h: HandType) => ctx.contained.has(h);
const rankOf = (c: Card) => (isRankless(c) ? 0 : c.rank);
const isEven = (c: Card) => rankOf(c) >= 2 && rankOf(c) <= 10 && rankOf(c) % 2 === 0;
const isOdd = (c: Card) => rankOf(c) === 14 || (rankOf(c) >= 3 && rankOf(c) <= 9 && rankOf(c) % 2 === 1);

/** Enhancement, das der Transmutator vergibt */
export const TRANSMUTE_TO = 'kupfer';

export const JOKER_DEFS: JokerDef[] = [
  // ═══════════════════════════════════════════ Gruppe 1: einfache MAIN Jokers
  {
    id: 'funke', name: 'Funke', rarity: 'common', cost: 2, copyCompat: true,
    config: { mult: 4 }, description: '+{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'main' ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'treppe', name: 'Treppe', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 60 }, description: '+{chips} Chips, wenn die Hand eine Straight enthält',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, contains(ctx, 'straight')) ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'zwillingsstern', name: 'Zwillingsstern', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 8 }, description: '+{mult} Mult, wenn die Hand ein Pair enthält',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, contains(ctx, 'pair')) ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'dreigestirn', name: 'Dreigestirn', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 12 }, description: '+{mult} Mult, wenn die Hand Three of a Kind enthält',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, contains(ctx, 'threeKind')) ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'regenbogen', name: 'Regenbogen', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 10 }, description: '+{mult} Mult, wenn die Hand einen Flush enthält',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, contains(ctx, 'flush')) ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'zirkel', name: 'Zirkel', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 50 }, description: '+{chips} Chips, wenn die Hand ein Pair enthält',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, contains(ctx, 'pair')) ? { chips: cfg.chips } : undefined),
  },
  {
    id: 'leere_phiole', name: 'Leere Phiole', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 20, maxCards: 3 }, description: '+{mult} Mult, wenn höchstens {maxCards} Karten gespielt werden',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, ctx.played.length <= cfg.maxCards) ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'leerer_kelch', name: 'Leerer Kelch', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 15 }, description: '+{mult} Mult, wenn keine Discards mehr übrig sind',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, ctx.discardsLeft === 0) ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'sternbund', name: 'Sternbund', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 3 }, description: '+{mult} Mult pro Joker im Besitz',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, ctx.jokerCount > 0) ? { mult: cfg.mult * ctx.jokerCount } : undefined),
  },
  {
    id: 'bibliothek', name: 'Bibliothek', rarity: 'common', cost: 5, copyCompat: true,
    config: { chipsPer: 2 }, description: '+{chipsPer} Chips pro Karte im Nachziehstapel',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, ctx.deckLeft > 0) ? { chips: cfg.chipsPer * ctx.deckLeft } : undefined),
  },
  {
    id: 'einzelgaenger', name: 'Einzelgänger', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 3, cards: 1 }, description: 'X{xMult} Mult, wenn genau {cards} Karte gespielt wird',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, ctx.played.length === cfg.cards) ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'letzte_chance', name: 'Letzte Chance', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { xMult: 2.5 }, description: 'X{xMult} Mult bei der letzten Hand der Runde',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, ctx.handsLeft === 0) ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'astrolabium', name: 'Astrolabium', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { xMult: 2 }, description: 'X{xMult} Mult, wenn die Hand Three of a Kind enthält',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, contains(ctx, 'threeKind')) ? { xMult: cfg.xMult } : undefined),
  },
  {
    id: 'himmelsglobus', name: 'Himmelsglobus', rarity: 'rare', cost: 8, copyCompat: true,
    config: { xMult: 3 }, description: 'X{xMult} Mult, wenn die Hand einen Flush enthält',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, contains(ctx, 'flush')) ? { xMult: cfg.xMult } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe 2: SCORED und HELD Jokers
  {
    id: 'glut', name: 'Glut', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 2 }, description: 'Jede gewertete Karte in Hearts oder Diamonds gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && (hasSuit(c, 'H') || hasSuit(c, 'D')) ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'frost', name: 'Frost', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 15 }, description: 'Jede gewertete Karte in Spades oder Clubs gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && (hasSuit(c, 'S') || hasSuit(c, 'C')) ? { chips: cfg.chips } : undefined;
    },
  },
  {
    id: 'kleinvieh', name: 'Kleinvieh', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 3, maxRank: 5 }, description: 'Jede gewertete Karte mit Rang 2 bis {maxRank} gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && rankOf(c) >= 2 && rankOf(c) <= cfg.maxRank ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'herzfeuer', name: 'Herzfeuer', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 3 }, description: 'Jede gewertete Karte in Hearts gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && hasSuit(c, 'H') ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'hofstaat', name: 'Hofstaat', rarity: 'common', cost: 5, copyCompat: true,
    config: { chips: 30 }, description: 'Jede gewertete Face Card gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && ctx.isFace(c) ? { chips: cfg.chips } : undefined;
    },
  },
  {
    id: 'gleichmass', name: 'Gleichmaß', rarity: 'common', cost: 4, copyCompat: true,
    config: { mult: 4 }, description: 'Jede gewertete Karte mit geradem Rang (2, 4, 6, 8, 10) gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && isEven(c) ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'schiefer_turm', name: 'Schiefer Turm', rarity: 'common', cost: 4, copyCompat: true,
    config: { chips: 30 }, description: 'Jede gewertete Karte mit ungeradem Rang (A, 3, 5, 7, 9) gibt +{chips} Chips',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && isOdd(c) ? { chips: cfg.chips } : undefined;
    },
  },
  {
    id: 'sonnenscheibe', name: 'Sonnenscheibe', rarity: 'common', cost: 5, copyCompat: true,
    config: { chips: 20, mult: 4 }, description: 'Jedes gewertete Ace gibt +{chips} Chips und +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && rankOf(c) === 14 ? { chips: cfg.chips, mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'mondwacht', name: 'Mondwacht', rarity: 'common', cost: 5, copyCompat: true,
    config: { mult: 4 }, description: 'Jede Face Card in der Hand gibt +{mult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = held(ctx);
      return c && ctx.isFace(c) ? { mult: cfg.mult } : undefined;
    },
  },
  {
    id: 'kronjuwel', name: 'Kronjuwel', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { xMult: 2 }, description: 'Die erste gewertete Face Card gibt X{xMult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      if (!c) return;
      const first = ctx.scoring.find((x) => !x.debuffed && ctx.isFace(x));
      return first === c ? { xMult: cfg.xMult } : undefined;
    },
  },
  {
    id: 'bleigewicht', name: 'Bleigewicht', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { xMult: 1.2, maxRank: 5 }, description: 'Jede Karte mit Rang 2 bis {maxRank} in der Hand gibt X{xMult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = held(ctx);
      return c && rankOf(c) >= 2 && rankOf(c) <= cfg.maxRank ? { xMult: cfg.xMult } : undefined;
    },
  },

  // ═══════════════════════════════════════════ Gruppe 3: Retrigger Jokers
  {
    id: 'widerhall', name: 'Widerhall', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { times: 1 }, description: 'Gewertete Face Cards werden {times} mal zusätzlich ausgewertet',
    calculate: (ctx, _s, cfg) =>
      ctx.phase === 'retrigger' && ctx.area === 'played' && ctx.card && ctx.isFace(ctx.card) ? { retrigger: cfg.times } : undefined,
  },
  {
    id: 'erstes_licht', name: 'Erstes Licht', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { times: 2 }, description: 'Die erste gewertete Karte wird {times} mal zusätzlich ausgewertet',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'retrigger' && ctx.area === 'played' && ctx.index === 0 ? { retrigger: cfg.times } : undefined),
  },
  {
    id: 'nachhall', name: 'Nachhall', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: { times: 1 }, description: 'Effekte von Karten in der Hand werden {times} mal zusätzlich ausgelöst',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'retrigger' && ctx.area === 'held' ? { retrigger: cfg.times } : undefined),
  },
  {
    id: 'schlussakkord', name: 'Schlussakkord', rarity: 'rare', cost: 8, copyCompat: true,
    config: { times: 1 }, description: 'Bei der letzten Hand der Runde werden alle gewerteten Karten {times} mal zusätzlich ausgewertet',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'retrigger' && ctx.area === 'played' && ctx.handsLeft === 0 ? { retrigger: cfg.times } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe 4: skalierende Jokers (Zustand in self.vars)
  {
    id: 'schneeball', name: 'Schneeball', rarity: 'uncommon', cost: 6, copyCompat: true, stickers: { perishable: false },
    config: { gain: 1 }, startVars: { mult: 0 }, description: 'Erhält +{gain} Mult pro gespielter Hand (aktuell +{mult} Mult)',
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'before' && !ctx.copied) self.vars.mult = (self.vars.mult ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.mult) return { mult: self.vars.mult };
    },
  },
  {
    id: 'brennofen', name: 'Brennofen', rarity: 'common', cost: 5, copyCompat: true, stickers: { perishable: false },
    config: { gain: 2 }, startVars: { chips: 0 }, description: 'Erhält +{gain} Chips pro gewerteter Karte (aktuell +{chips} Chips)',
    calculate: (ctx, self, cfg) => {
      if (scored(ctx) && !ctx.copied) self.vars.chips = (self.vars.chips ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.chips) return { chips: self.vars.chips };
    },
  },
  {
    id: 'aschehaufen', name: 'Aschehaufen', rarity: 'common', cost: 5, copyCompat: true, stickers: { perishable: false },
    config: { gain: 1 }, startVars: { mult: 0 }, description: 'Erhält +{gain} Mult pro abgeworfener Karte (aktuell +{mult} Mult)',
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'discard' && !ctx.copied) self.vars.mult = (self.vars.mult ?? 0) + cfg.gain * (ctx.cards?.length ?? 0);
      if (ctx.phase === 'main' && self.vars.mult) return { mult: self.vars.mult };
    },
  },
  {
    id: 'mondphasen', name: 'Mondphasen', rarity: 'common', cost: 5, copyCompat: true, stickers: { perishable: false },
    config: { gain: 3 }, startVars: { mult: 0 }, description: 'Erhält +{gain} Mult am Ende jeder Runde (aktuell +{mult} Mult)',
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'roundEnd' && !ctx.copied) self.vars.mult = (self.vars.mult ?? 0) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.mult) return { mult: self.vars.mult };
    },
  },
  {
    id: 'kerze', name: 'Kerze', rarity: 'common', cost: 4, copyCompat: true, stickers: { eternal: false, perishable: false },
    config: { loss: 2 }, startVars: { mult: 20 }, description: '+{mult} Mult, verliert {loss} Mult pro gespielter Hand und erlischt bei 0',
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'main' && self.vars.mult > 0) return { mult: self.vars.mult };
      if (ctx.phase === 'after' && !ctx.copied) {
        self.vars.mult = (self.vars.mult ?? 0) - cfg.loss;
        if (self.vars.mult <= 0) return { destroySelf: true, message: 'Erloschen' };
      }
    },
  },
  {
    id: 'sternkatalog', name: 'Sternkatalog', rarity: 'uncommon', cost: 7, copyCompat: true, stickers: { perishable: false },
    config: { gain: 0.25 }, startVars: { xMult: 1 },
    description: 'Erhält X{gain} Mult, wenn eine Hand mit Two Pair gespielt wird (aktuell X{xMult} Mult)',
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'before' && !ctx.copied && contains(ctx, 'twoPair')) self.vars.xMult = (self.vars.xMult ?? 1) + cfg.gain;
      if (ctx.phase === 'main' && self.vars.xMult > 1) return { xMult: self.vars.xMult };
    },
  },
  {
    id: 'uhrwerk', name: 'Uhrwerk', rarity: 'uncommon', cost: 6, copyCompat: true, stickers: { perishable: false },
    config: { gain: 0.2 }, startVars: { xMult: 1 }, description: 'Erhält X{gain} Mult pro Reroll im Shop (aktuell X{xMult} Mult)',
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'shopReroll' && !ctx.copied) self.vars.xMult = Math.round(((self.vars.xMult ?? 1) + cfg.gain) * 100) / 100;
      if (ctx.phase === 'main' && self.vars.xMult > 1) return { xMult: self.vars.xMult };
    },
  },

  // ═══════════════════════════════════════════ Gruppe 5: Geld Jokers
  {
    id: 'muenzstock', name: 'Münzstock', rarity: 'common', cost: 5, copyCompat: true,
    config: { money: 3 }, description: '+${money} am Ende jeder Runde',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'payout' ? { money: cfg.money } : undefined),
  },
  {
    id: 'diamantschleifer', name: 'Diamantschleifer', rarity: 'common', cost: 5, copyCompat: true,
    config: { money: 1, num: 1, den: 2 }, description: 'Jede gewertete Karte in Diamonds gibt mit Chance {num} zu {den} +${money}',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && hasSuit(c, 'D') && ctx.chance(cfg.num, cfg.den, 'diamantschleifer') ? { money: cfg.money } : undefined;
    },
  },
  {
    id: 'lumpensammler', name: 'Lumpensammler', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 1 }, description: '+${money} pro abgeworfener Face Card',
    calculate: (ctx, _s, cfg) => {
      if (ctx.phase !== 'discard') return;
      const n = (ctx.cards ?? []).filter((c) => ctx.isFace(c)).length;
      return n > 0 ? { money: n * cfg.money } : undefined;
    },
  },
  {
    id: 'wechselstube', name: 'Wechselstube', rarity: 'common', cost: 4, copyCompat: true, stickers: { eternal: false },
    config: { gain: 2 }, startVars: { sellBonus: 0 },
    description: 'Verkaufswert steigt am Ende jeder Runde um ${gain} (aktuell +${sellBonus})',
    calculate: (ctx, self, cfg) => {
      if (ctx.phase === 'roundEnd' && !ctx.copied) self.vars.sellBonus = (self.vars.sellBonus ?? 0) + cfg.gain;
    },
  },
  {
    id: 'kollekte', name: 'Kollekte', rarity: 'common', cost: 4, copyCompat: true,
    config: { money: 1, cards: 5 }, description: '+${money} für jede gespielte Hand mit genau {cards} Karten',
    calculate: (ctx, _s, cfg) => (mainIf(ctx, ctx.played.length === cfg.cards) ? { money: cfg.money } : undefined),
  },
  {
    id: 'zinsrechner', name: 'Zinsrechner', rarity: 'uncommon', cost: 6, copyCompat: false, spawn: { minAnte: 2 },
    config: {}, passive: { interestCap: 5 }, description: 'Zinsdeckel +${interestCap}',
  },
  {
    id: 'sparschwein', name: 'Sparschwein', rarity: 'rare', cost: 8, copyCompat: true,
    config: { step: 5, xPerStep: 0.1 }, description: 'X{xPerStep} Mult extra pro ${step} im Besitz',
    calculate: (ctx, _s, cfg) => {
      if (ctx.phase !== 'main') return;
      const steps = Math.floor(Math.max(ctx.money, 0) / cfg.step);
      return steps > 0 ? { xMult: 1 + steps * cfg.xPerStep } : undefined;
    },
  },

  // ═══════════════════════════════════════════ Gruppe 6: Blind und Shop Jokers
  {
    id: 'nachtwaechter', name: 'Nachtwächter', rarity: 'common', cost: 5, copyCompat: true,
    config: { hands: 1 }, description: '+{hands} Hand, wenn ein Boss Blind gewählt wird',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'blindSelected' && ctx.blind === 'boss' ? { handsDelta: cfg.hands } : undefined),
  },
  {
    id: 'morgenroete', name: 'Morgenröte', rarity: 'common', cost: 5, copyCompat: true,
    config: { money: 1 }, description: 'Bei Auswahl eines Blinds +${money} pro freiem Joker Slot',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'blindSelected' && ctx.emptySlots > 0 ? { money: cfg.money * ctx.emptySlots } : undefined),
  },
  {
    id: 'glueckswuerfel', name: 'Glückswürfel', rarity: 'common', cost: 5, copyCompat: true,
    config: { rerolls: 1 }, description: 'Der erste Reroll in jedem Shop ist gratis',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'shopOpen' ? { freeRerolls: cfg.rerolls } : undefined),
  },
  {
    id: 'himmelstor', name: 'Himmelstor', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: {}, description: 'Bei Auswahl eines Small Blinds entsteht ein zufälliger Common Joker (Platz vorausgesetzt)',
    calculate: (ctx) => (ctx.phase === 'blindSelected' && ctx.blind === 'small' ? { createJoker: 'common' } : undefined),
  },
  {
    id: 'haendlerfreund', name: 'Händlerfreund', rarity: 'uncommon', cost: 6, copyCompat: false,
    config: {}, passive: { discount: 0.8 }, description: 'Neue Karten und Packs im Shop kosten 20% weniger',
  },
  {
    id: 'erbstueck', name: 'Erbstück', rarity: 'uncommon', cost: 6, copyCompat: false, stickers: { eternal: false },
    config: {}, description: 'Beim Verkauf entsteht ein zufälliger Uncommon Joker',
    calculate: (ctx) => (ctx.phase === 'sell' ? { createJoker: 'uncommon' } : undefined),
  },

  // ═══════════════════════════════════════════ Gruppe 7: passive Jokers
  {
    id: 'himmelsleiter', name: 'Himmelsleiter', rarity: 'common', cost: 5, copyCompat: false,
    config: {}, rules: { shortcut: true }, description: 'Straights dürfen Lücken von je einem Rang haben',
  },
  {
    id: 'springflut', name: 'Springflut', rarity: 'common', cost: 4, copyCompat: false,
    config: {}, rules: { splash: true }, description: 'Alle gespielten Karten werden gewertet',
  },
  {
    id: 'maskenball', name: 'Maskenball', rarity: 'common', cost: 5, copyCompat: false,
    config: {}, rules: { allFace: true }, description: 'Alle Karten gelten als Face Cards',
  },
  {
    id: 'windmuehle', name: 'Windmühle', rarity: 'common', cost: 5, copyCompat: false,
    config: {}, passive: { discards: 1 }, description: '+{discards} Discard pro Runde',
  },
  {
    id: 'vier_winde', name: 'Vier Winde', rarity: 'uncommon', cost: 7, copyCompat: false,
    config: {}, rules: { fourFingers: true }, description: 'Flush und Straight brauchen nur 4 Karten',
  },
  {
    id: 'zwielicht', name: 'Zwielicht', rarity: 'uncommon', cost: 6, copyCompat: false,
    config: {}, rules: { smeared: true }, description: 'Hearts und Diamonds gelten als dieselbe Suit, ebenso Spades und Clubs',
  },
  {
    id: 'satteltasche', name: 'Satteltasche', rarity: 'uncommon', cost: 7, copyCompat: false,
    config: {}, passive: { handSize: 1 }, description: '+{handSize} Hand Size',
  },
  {
    id: 'orakel', name: 'Orakel', rarity: 'uncommon', cost: 6, copyCompat: false,
    config: {}, passive: { probFactor: 2 }, description: 'Alle Wahrscheinlichkeiten werden verdoppelt',
  },
  {
    id: 'sanduhr', name: 'Sanduhr', rarity: 'rare', cost: 8, copyCompat: false,
    config: {}, passive: { hands: 1 }, description: '+{hands} Hand pro Runde',
  },

  // ═══════════════════════════════════════════ Gruppe 8: Spezialfälle
  {
    id: 'sternenrat', name: 'Sternenrat', rarity: 'uncommon', cost: 6, copyCompat: true,
    config: { mult: 3 }, description: 'Jeder andere Common Joker gibt nach seinem Effekt +{mult} Mult',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'other' && ctx.other?.def.rarity === 'common' ? { mult: cfg.mult } : undefined),
  },
  {
    id: 'transmutator', name: 'Transmutator', rarity: 'uncommon', cost: 7, copyCompat: true,
    config: {}, description: `Die erste gewertete Karte ohne Enhancement wird vor dem Scoring zu ${ENHANCEMENTS[TRANSMUTE_TO].name}`,
    calculate: (ctx) => {
      if (ctx.phase !== 'before') return;
      const c = ctx.scoring.find((x) => !x.enhancement && !x.debuffed);
      return c ? { setEnhancement: [{ cardId: c.id, enhancement: TRANSMUTE_TO }], message: ENHANCEMENTS[TRANSMUTE_TO].name } : undefined;
    },
  },
  {
    id: 'zauberspiegel', name: 'Zauberspiegel', rarity: 'rare', cost: 10, copyCompat: true, copies: 'right',
    config: {}, description: 'Kopiert den Effekt des Jokers rechts daneben',
  },
  {
    id: 'phoenixfeder', name: 'Phönixfeder', rarity: 'rare', cost: 8, copyCompat: false, stickers: { eternal: false },
    config: { percent: 25 }, description: 'Verhindert einmal die Niederlage, wenn mindestens {percent}% des Ziels erreicht sind, und verbrennt dann',
    calculate: (ctx, _s, cfg) =>
      ctx.phase === 'rescue' && (ctx.score ?? 0) >= ((ctx.target ?? 0) * cfg.percent) / 100
        ? { rescue: true, destroySelf: true, message: 'Wiedergeburt' }
        : undefined,
  },

  // Legendary: erscheinen nie im Shop oder in Packs (Quelle folgt mit den Consumables in M4)
  {
    id: 'stein_der_weisen', name: 'Stein der Weisen', rarity: 'legendary', cost: 20, copyCompat: true,
    config: { xMult: 1.5 }, description: 'Jede gewertete Karte mit Enhancement gibt X{xMult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c?.enhancement ? { xMult: cfg.xMult } : undefined;
    },
  },
  {
    id: 'astralkrone', name: 'Astralkrone', rarity: 'legendary', cost: 20, copyCompat: true,
    config: { xMult: 2 }, description: 'Jede gewertete Face Card gibt X{xMult} Mult',
    calculate: (ctx, _s, cfg) => {
      const c = scored(ctx);
      return c && ctx.isFace(c) ? { xMult: cfg.xMult } : undefined;
    },
  },
  {
    id: 'zeitkristall', name: 'Zeitkristall', rarity: 'legendary', cost: 20, copyCompat: true,
    config: { times: 1 }, description: 'Alle gewerteten Karten werden {times} mal zusätzlich ausgewertet',
    calculate: (ctx, _s, cfg) => (ctx.phase === 'retrigger' && ctx.area === 'played' ? { retrigger: cfg.times } : undefined),
  },
];
