import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { t } from '../i18n';
import { chipValue, isFace, isRankless } from './cards';
import { detectHand } from './handEval';
import { handBase, type HandLevels } from './hands';
import { copyTarget, getJoker, jokerRules, type JokerContext, type JokerDef, type JokerInstance, type JokerPhase } from './jokers';
import type { Card, DetectRules, Effect, HandType } from './types';

/** Boss Modifikatoren, die den Handwert verändern (Briefing 3.1 Schritt 0). */
export interface BossScoreMods {
  /** Level der gespielten Hand um 1 senken (min. 1) */
  levelDown?: boolean;
  /** Base Chips und Base Mult halbieren, aufrunden */
  halveBase?: boolean;
  /** die Hand scort nichts (Offener Punkt O6) */
  nullify?: boolean;
}

export type ScoreEventSource =
  | { kind: 'base' }
  | { kind: 'card'; cardId: number }
  | { kind: 'held'; cardId: number }
  | { kind: 'joker'; jokerUid: number }
  | { kind: 'consumable'; uid: number }
  | { kind: 'rule' };

export type ScorePhase = 'base' | 'card' | 'held' | 'joker' | 'consumable' | 'retrigger' | 'balance' | 'debuff';

/** Ein sichtbarer Schritt der Score Animation (Briefing 8.2). */
export interface ScoreEvent {
  phase: ScorePhase;
  source: ScoreEventSource;
  chips?: number;
  mult?: number;
  xMult?: number;
  money?: number;
  message?: string;
  /** laufende Werte NACH diesem Schritt */
  chipsTotal: number;
  multTotal: number;
}

export interface ScoreResult {
  handType: HandType;
  scoring: Card[];
  contained: Set<HandType>;
  chips: number;
  mult: number;
  total: number;
  money: number;
  events: ScoreEvent[];
  /** Karten, die nach dem Scoring zerstört werden */
  destroyed: Card[];
  /** dauerhafte Änderungen an gewerteten Karten durch Jokers (After Phase) */
  cardEdits: { cardId: number; extraChips?: number; enhancement?: string }[];
  /** Jokers, die sich nach dem Scoring selbst zerstören (uid) */
  destroyJokers: number[];
}

export interface ScoreInput {
  played: Card[];
  held: Card[];
  handLevels: HandLevels;
  jokers: JokerInstance[];
  money: number;
  /** verbleibende Hands NACH dieser Hand */
  handsLeft: number;
  discardsLeft: number;
  /** zusätzliche Erkennungsregeln (die Regeln der Jokers kommen automatisch dazu) */
  rules?: DetectRules;
  boss?: BossScoreMods;
  /** Chips und Mult am Ende mitteln (Deck Regel, Briefing 3.1 Schritt 7) */
  balance?: boolean;
  /** Sternbilder in den Consumable Slots (Briefing 3.1 Schritt 6) mit ihrer Hand */
  heldSternbilder?: { uid: number; hand: HandType }[];
  /** Faktor der Sternbilder, wenn ihre Hand gespielt wird (nur über 1 wirksam) */
  sternbildXMult?: number;
  /** Zufallsentscheidungen, Standard: nie */
  chance?: (num: number, den: number, key: string) => boolean;
}

/** Meldungen der Wertung, zur Laufzeit übersetzt (Sprache steht erst nach dem Laden der Module fest) */
export const RETRIGGER_MESSAGE = () => t('Nochmal!');
export const DEBUFF_MESSAGE = () => t('Geschwächt');
export const BALANCE_MESSAGE = () => t('Ausgleich');

export function previewHand(played: Card[], handLevels: HandLevels, rules: DetectRules = {}) {
  const { type, scoring } = detectHand(played, rules);
  return { type, scoring, ...handBase(type, handLevels[type]) };
}

/**
 * Wertet eine gespielte Hand aus. Reihenfolge nach Briefing 3.1 bis 3.4:
 * Before, Basis (mit Boss Modifikatoren), Scoring Cards links nach rechts (Rang Chips,
 * Enhancement, Seal, Edition, Jokers, mit Retriggern), Karten in der Hand
 * (Enhancement, Jokers, mit Retriggern), Jokers links nach rechts (Edition additiv,
 * Effekt, Edition multiplikativ), Balance, Abrunden, After.
 */
export function scoreHand(input: ScoreInput): ScoreResult {
  const rules = { ...jokerRules(input.jokers), ...input.rules };
  const { type, scoring, contained } = detectHand(input.played, rules);
  const chance = input.chance ?? (() => false);
  const events: ScoreEvent[] = [];
  let chips = 0;
  let mult = 0;
  let money = 0;

  const jokers = input.jokers
    .map((inst) => ({ inst, def: getJoker(inst.defId) }))
    .filter((j): j is { inst: JokerInstance; def: JokerDef } => !!j.def);

  const baseCtx: Omit<JokerContext, 'phase'> = {
    handType: type,
    contained,
    played: input.played,
    scoring,
    held: input.held,
    money: input.money,
    handsLeft: input.handsLeft,
    discardsLeft: input.discardsLeft,
    chance,
    isFace: (card) => !!rules.allFace || isFace(card.rank),
  };
  // Kopierende Jokers rufen die Phasen ihres Ziels auf, außer Before und After (kein doppeltes Wachsen)
  const callJoker = (j: { inst: JokerInstance; def: JokerDef }, phase: JokerPhase, extra: Partial<JokerContext> = {}) => {
    let target: { inst: JokerInstance; def: JokerDef } | null = j;
    if (j.def.copies) target = phase === 'before' || phase === 'after' || phase === 'other' ? null : copyTarget(jokers, jokers.indexOf(j));
    return target?.def.calculate?.({ ...baseCtx, ...extra, phase }, target.inst, target.def.config);
  };

  const apply = (phase: ScorePhase, source: ScoreEventSource, e: Effect | void) => {
    if (!e) return;
    const has = e.chips || e.mult || (e.xMult && e.xMult !== 1) || e.money || e.message;
    if (!has) return;
    if (e.chips) chips += e.chips;
    if (e.mult) mult += e.mult;
    if (e.xMult) mult *= e.xMult;
    if (e.money) money += e.money;
    events.push({ phase, source, ...e, chipsTotal: chips, multTotal: mult });
  };

  // 1) Before: nur Zustand
  for (const j of jokers) callJoker(j, 'before');

  // 2) Basis mit Boss Modifikatoren
  const level = input.handLevels[type] - (input.boss?.levelDown ? 1 : 0);
  const base = handBase(type, level);
  chips = base.chips;
  mult = base.mult;
  if (input.boss?.halveBase) {
    chips = Math.ceil(chips / 2);
    mult = Math.ceil(mult / 2);
  }
  events.push({ phase: 'base', source: { kind: 'base' }, chips, mult, chipsTotal: chips, multTotal: mult });

  if (input.boss?.nullify) {
    events.push({ phase: 'debuff', source: { kind: 'rule' }, message: DEBUFF_MESSAGE(), chipsTotal: 0, multTotal: 0 });
    return { handType: type, scoring, contained, chips: 0, mult: 0, total: 0, money: 0, events, destroyed: [], cardEdits: [], destroyJokers: [] };
  }

  const repetitions = (card: Card, area: 'played' | 'held', index?: number) => {
    let n = (card.seal && SEALS[card.seal]?.retrigger) || 0;
    for (const j of jokers) n += callJoker(j, 'retrigger', { card, area, index })?.retrigger ?? 0;
    return n;
  };

  // 3) Scoring Cards links nach rechts
  scoring.forEach((card, index) => {
    if (card.debuffed) {
      apply('debuff', { kind: 'card', cardId: card.id }, { message: DEBUFF_MESSAGE() });
      return;
    }
    const reps = 1 + repetitions(card, 'played', index);
    for (let r = 0; r < reps; r++) {
      const src = { kind: 'card', cardId: card.id } as const;
      if (r > 0) apply('retrigger', src, { message: RETRIGGER_MESSAGE() });
      const rankChips = isRankless(card) ? 0 : chipValue(card.rank);
      apply('card', src, { chips: rankChips + (card.extraChips ?? 0) });
      apply('card', src, card.enhancement ? ENHANCEMENTS[card.enhancement]?.scored : undefined);
      apply('card', src, card.seal ? SEALS[card.seal]?.scored : undefined);
      apply('card', src, card.edition ? EDITIONS[card.edition]?.effect : undefined);
      for (const j of jokers) apply('joker', { kind: 'joker', jokerUid: j.inst.uid }, callJoker(j, 'scored', { card, area: 'played', index }));
    }
  });

  // 4) Karten in der Hand links nach rechts
  for (const card of input.held) {
    if (card.debuffed) continue;
    const reps = 1 + repetitions(card, 'held');
    const src = { kind: 'held', cardId: card.id } as const;
    for (let r = 0; r < reps; r++) {
      const steps: [ScorePhase, ScoreEventSource, Effect | void][] = [
        ['held', src, card.enhancement ? ENHANCEMENTS[card.enhancement]?.held : undefined],
        ...jokers.map((j): [ScorePhase, ScoreEventSource, Effect | void] =>
          ['joker', { kind: 'joker', jokerUid: j.inst.uid }, callJoker(j, 'held', { card, area: 'held' })]),
      ];
      if (r > 0 && steps.some(([, , e]) => e)) apply('retrigger', src, { message: RETRIGGER_MESSAGE() });
      for (const [phase, s, e] of steps) apply(phase, s, e);
    }
  }

  // 5) Jokers links nach rechts, mit Edition Phasen
  for (const j of jokers) {
    const src = { kind: 'joker', jokerUid: j.inst.uid } as const;
    const ed = j.inst.edition ? EDITIONS[j.inst.edition]?.effect : undefined;
    if (ed && (ed.chips || ed.mult)) apply('joker', src, { chips: ed.chips, mult: ed.mult });
    apply('joker', src, callJoker(j, 'main'));
    if (ed?.xMult) apply('joker', src, { xMult: ed.xMult });
    // Jokers, die auf diesen Joker reagieren
    for (const k of jokers) {
      if (k !== j) apply('joker', { kind: 'joker', jokerUid: k.inst.uid }, callJoker(k, 'other', { otherJoker: j.def }));
    }
  }

  // 6) Consumable Phase: Sternbilder im Slot, deren Hand gespielt wird
  if ((input.sternbildXMult ?? 1) > 1) {
    for (const s of input.heldSternbilder ?? []) {
      if (s.hand === type) apply('consumable', { kind: 'consumable', uid: s.uid }, { xMult: input.sternbildXMult });
    }
  }

  // 7) Balance (Offener Punkt O3: abrunden)
  if (input.balance) {
    const avg = Math.floor((chips + mult) / 2);
    chips = avg;
    mult = avg;
    events.push({ phase: 'balance', source: { kind: 'rule' }, message: BALANCE_MESSAGE(), chipsTotal: chips, multTotal: mult });
  }

  // 8) Ergebnis abrunden (Offener Punkt O2)
  const total = Math.floor(chips * mult);

  // 9) After: Jokers, zerbrechliche Karten
  const cardEdits: ScoreResult['cardEdits'] = [];
  const destroyJokers: number[] = [];
  const editable = scoring.filter((c) => !c.debuffed);
  for (const j of jokers) {
    const e = callJoker(j, 'after');
    if (!e) continue;
    if (e.cardChips) for (const c of editable) cardEdits.push({ cardId: c.id, extraChips: e.cardChips });
    const first = editable.find((c) => !c.enhancement && !cardEdits.some((x) => x.cardId === c.id && x.enhancement));
    if (e.enhanceFirst && first) cardEdits.push({ cardId: first.id, enhancement: e.enhanceFirst });
    if (e.destroySelf) destroyJokers.push(j.inst.uid);
  }
  const destroyed = scoring.filter((card) => {
    const bc = card.enhancement ? ENHANCEMENTS[card.enhancement]?.breakChance : undefined;
    return !!bc && !card.debuffed && chance(bc.num, bc.den, 'card_break');
  });

  return { handType: type, scoring, contained, chips, mult, total, money, events, destroyed, cardEdits, destroyJokers };
}
