import { createStandardDeck, isFace, isAnySuit, isRankless } from './cards';
import { BOSSES, type BossDef } from '../data/bosses';
import { detectHand } from './handEval';
import { BLIND_KINDS, blindReward, blindTarget, type BlindKind, type Scaling } from './blinds';
import { FINAL_ANTE } from '../data/blinds';
import { INTEREST, PAYOUT, REROLL, START } from '../data/economy';
import { SHOP, SHOP_TYPE_WEIGHTS, type ShopType } from '../data/shop';
import { CONSUMABLE_BY_ID } from '../data/consumables';
import { initialHandLevels, type HandLevels } from './hands';
import { allJokers, copyTarget, getJoker, jokerRules, sumPassives, type JokerContext, type JokerDef, type JokerInstance, type JokerPhase } from './jokers';
import { RngStreams, type RngStreamsState } from './rng';
import { scoreHand, type ScoreResult } from './scoring';
import { rollRarity, sellValue as sellFromPrice } from './shop';
import { EDITIONS } from '../data/modifiers';
import type { Card, HandType, Suit } from './types';

export const SAVE_VERSION = 5;

/** Zähler eines einzelnen Runs (für Erfolge und die Rückschau). Wird mit dem Spielstand gespeichert. */
export interface RunStats {
  /** höchste Punktzahl einer einzelnen Hand */
  bestHand: number;
  /** Hand Typ der besten Hand */
  bestHandType: HandType | null;
  /** abgeworfene Discards (Aktionen) */
  discardsUsed: number;
  rerolls: number;
  jokersBought: number;
  /** höchster Geldstand nach einer Auszahlung */
  moneyPeak: number;
  /** Blinds, die mit nur einer Hand gewonnen wurden */
  oneHandWins: number;
}

export function newRunStats(): RunStats {
  return { bestHand: 0, bestHandType: null, discardsUsed: 0, rerolls: 0, jokersBought: 0, moneyPeak: 0, oneHandWins: 0 };
}

/** Regeln eines Runs. Decks, Stakes und Vouchers verändern diese Werte (M2). */
export interface RunRules {
  scaling: Scaling;
  interestPer: number;
  interestCap: number;
  noInterest: boolean;
  perHandLeft: number;
  perDiscardLeft: number;
  /** null = Standardbelohnung des Small Blinds */
  smallBlindReward: number | null;
  /** Faktor auf alle Blind Ziele (Deck Regel) */
  blindTargetFactor: number;
  /** Chips und Mult mitteln (Deck Regel) */
  balance: boolean;
  /** Faktor auf alle "num in den" Chancen */
  probMult: number;
  /** Karten Slots im Shop */
  shopSlots: number;
  /** Startpreis eines Rerolls */
  rerollBase: number;
  /** Rabatt Faktor auf Karten und Packs */
  discount: number;
  /** Faktor auf Editions Chancen */
  editionRate: number;
  /** Gewichte der Kartentypen in den Karten Slots */
  typeWeights: Record<ShopType, number>;
  /** Faktor auf Sternbilder in den Consumable Slots (1 = kein Effekt) */
  sternbildXMult: number;
  /** Spielkarten im Shop kommen mit Modifikatoren */
  shopCardMods: boolean;
}

export function defaultRules(): RunRules {
  return {
    scaling: 1,
    interestPer: INTEREST.per,
    interestCap: INTEREST.cap,
    noInterest: false,
    perHandLeft: PAYOUT.perHandLeft,
    perDiscardLeft: PAYOUT.perDiscardLeft,
    smallBlindReward: null,
    blindTargetFactor: 1,
    balance: false,
    probMult: 1,
    shopSlots: SHOP.cardSlots,
    rerollBase: REROLL.base,
    discount: 1,
    editionRate: 1,
    typeWeights: { ...SHOP_TYPE_WEIGHTS },
    sternbildXMult: 1,
    shopCardMods: false,
  };
}

export interface RoundState {
  blind: BlindKind;
  target: number;
  score: number;
  handsLeft: number;
  discardsLeft: number;
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
  /** Hand Size dieser Runde (Boss Effekte) */
  handSize: number;
  /** aktiver Boss dieser Runde, undefined wenn kein Boss oder deaktiviert */
  bossId?: string;
  /** vom Boss gewählte Suit für Debuffs */
  debuffSuit?: Suit;
  /** in dieser Runde gespielte Handtypen */
  playedTypes: HandType[];
  /** ein Joker hat diese Runde vor der Niederlage gerettet (Joker Name für die Anzeige) */
  rescuedBy?: string;
}

export type Phase = 'blindSelect' | 'round' | 'roundWon' | 'shop' | 'pack' | 'gameOver';

export type ShopItem =
  | {
    kind: 'joker';
    defId: string;
    edition?: string;
    price: number;
    /** gratis durch einen Tag */
    free?: boolean;
  }
  | { kind: 'consumable'; defId: string; price: number }
  | { kind: 'card'; card: Card; price: number };

/** Ein Consumable im Slot */
export interface ConsumableInstance {
  uid: number;
  defId: string;
  /** Kaufpreis, Grundlage für den Verkaufswert */
  buyPrice?: number;
}

export interface ShopState {
  /** null = gekauft */
  cards: (ShopItem | null)[];
  packs: ({ packId: string; price: number } | null)[];
  voucher: { voucherId: string; price: number } | null;
  rerollsUsed: number;
  freeRerolls: number;
  /** zusätzlicher Rabatt aus Tags für diesen Shop */
  tagDiscount: number;
}

export type PackOption =
  | { kind: 'joker'; defId: string; edition?: string }
  | { kind: 'card'; card: Card }
  | { kind: 'consumable'; defId: string };

export interface PackState {
  packId: string;
  options: (PackOption | null)[];
  picksLeft: number;
  /** Karten aus dem Deck, die in Elixier und Omen Packs als Ziele angeboten werden */
  handIds?: number[];
  /** wohin es nach dem Pack weitergeht */
  returnPhase: Phase;
}

export interface RunState {
  version: number;
  seed: string;
  /** eindeutige Kennung dieses Runs (Seed plus Startzeit), für die Statistik über mehrere Runs */
  runId: string;
  rng: RngStreamsState;
  ante: number;
  blindIndex: number; // 0 small, 1 big, 2 boss
  money: number;
  handSize: number;
  hands: number;
  discards: number;
  jokerSlots: number;
  consumableSlots: number;
  consumables: ConsumableInstance[];
  handLevels: HandLevels;
  /** wie oft jede Hand gespielt wurde (Secret Hands, Statistik) */
  handsPlayed: Record<HandType, number>;
  jokers: JokerInstance[];
  deck: Card[];
  nextUid: number;
  round: RoundState | null;
  won: boolean;
  /** Sieg Bildschirm wurde gezeigt */
  winShown: boolean;
  rules: RunRules;
  phase: Phase;
  deckId: string;
  stakeId: string;
  /** Stufe der skalierenden Schwierigkeit, null bei einer festen Stake Stufe */
  difficulty: number | null;
  /** Datum des Tageslaufs (JJJJ-MM-TT), null bei normalen Runs */
  daily: string | null;
  /** Tageswandlung des Tageslaufs */
  twistId: string | null;
  /** Zähler dieses Runs */
  stats: RunStats;
  vouchers: string[];
  /** Tags, die auf ihr Ereignis warten */
  pendingTags: string[];
  skips: number;
  bossesSeen: string[];
  /** Boss, Skip Tags und Voucher der aktuellen Ante */
  anteBoss: string | null;
  anteTags: { small: string; big: string } | null;
  anteVoucher: string | null;
  shop: ShopState | null;
  pack: PackState | null;
  shopsVisited: number;
  nextCardId: number;
}

export interface RoundEarnings {
  blindReward: number;
  handsBonus: number;
  discardsBonus: number;
  interest: number;
  /** Geld durch Jokers am Rundenende */
  jokers: number;
  total: number;
}

export const MAX_SELECT = START.maxPlay;

function zeroCounts(levels: HandLevels): Record<HandType, number> {
  return Object.fromEntries(Object.keys(levels).map((k) => [k, 0])) as Record<HandType, number>;
}

export function newRun(seed: string): RunState {
  const handLevels = initialHandLevels();
  return {
    version: SAVE_VERSION,
    seed,
    runId: `${seed}-${Date.now().toString(36)}`,
    rng: RngStreams.create(seed).data,
    ante: 1,
    blindIndex: 0,
    money: START.money,
    handSize: START.handSize,
    hands: START.hands,
    discards: START.discards,
    jokerSlots: START.jokerSlots,
    consumableSlots: START.consumableSlots,
    consumables: [],
    handLevels,
    handsPlayed: zeroCounts(handLevels),
    jokers: [],
    deck: createStandardDeck(),
    nextUid: 1,
    round: null,
    won: false,
    winShown: false,
    rules: defaultRules(),
    phase: 'blindSelect',
    deckId: 'nachthimmel',
    stakeId: 'daemmerung',
    difficulty: null,
    daily: null,
    twistId: null,
    stats: newRunStats(),
    vouchers: [],
    pendingTags: [],
    skips: 0,
    bossesSeen: [],
    anteBoss: null,
    anteTags: null,
    anteVoucher: null,
    shop: null,
    pack: null,
    shopsVisited: 0,
    nextCardId: 53,
  };
}

export function rngOf(run: RunState): RngStreams {
  return new RngStreams(run.rng);
}

/** Dauerhafte Wirkungen aller Jokers im Besitz */
export function jokerPassive(run: RunState) {
  return sumPassives(run.jokers);
}

/** Wahrscheinlichkeitsfaktor: Regel Faktor, verdoppelt pro Joker mit doubleProb (Offener Punkt O11) */
export function effectiveProbMult(run: RunState): number {
  return run.rules.probMult * 2 ** jokerPassive(run).doubleProb;
}

export interface HookResult {
  money: number;
  consumables: ('sternbild' | 'elixier' | 'omen')[];
}

/**
 * Ruft eine Joker Phase außerhalb des Scorings auf (discard, blindSelected, roundEnd, sell).
 * commit = false rechnet auf Kopien und verändert nichts (Anzeige der Auszahlung).
 * Geld und Consumables werden nur zurückgegeben, die Aufrufer wenden sie an.
 */
export function runJokerHook(run: RunState, phase: JokerPhase, extra: Partial<JokerContext> = {}, commit = true, only?: JokerInstance[]): HookResult {
  const source = only ?? run.jokers;
  const list = source
    .map((inst) => ({ inst: commit ? inst : { ...inst, vars: { ...inst.vars }, }, def: getJoker(inst.defId) }))
    .filter((j): j is { inst: JokerInstance; def: JokerDef } => !!j.def);
  const r = run.round;
  const rngs = rngOf(run);
  const rules = jokerRules(source);
  const ctx: Omit<JokerContext, 'phase'> = {
    handType: 'highCard',
    contained: new Set(),
    played: [],
    scoring: [],
    held: r?.hand ?? [],
    money: run.money,
    handsLeft: r?.handsLeft ?? 0,
    discardsLeft: r?.discardsLeft ?? 0,
    chance: (num, den, key) => rngs.chance(num, den, `${key}_a${run.ante}`, effectiveProbMult(run)),
    isFace: (card) => !!rules.allFace || isFace(card.rank),
    ante: run.ante,
    blind: r?.blind,
    ...extra,
  };
  const out: HookResult = { money: 0, consumables: [] };
  const destroy: number[] = [];
  list.forEach((j, i) => {
    const t = j.def.copies ? (phase === 'sell' ? null : copyTarget(list, i)) : j;
    const e = t?.def.calculate?.({ ...ctx, phase }, t.inst, t.def.config);
    if (!e) return;
    out.money += e.money ?? 0;
    out.consumables.push(...(e.consumables ?? []));
    if (e.destroySelf) destroy.push(j.inst.uid);
  });
  if (commit && destroy.length && !only) run.jokers = run.jokers.filter((j) => !destroy.includes(j.uid));
  return out;
}

export function runChance(run: RunState, num: number, den: number, key: string): boolean {
  return rngOf(run).chance(num, den, key, effectiveProbMult(run));
}

export function currentBlind(run: RunState): BlindKind {
  return BLIND_KINDS[run.blindIndex];
}

export function currentTarget(run: RunState, kind: BlindKind = currentBlind(run)): number {
  const boss = kind === 'boss' && run.anteBoss ? BOSS_BY_ID[run.anteBoss] : undefined;
  return blindTarget(run.ante, kind, { scaling: run.rules.scaling, deckFactor: run.rules.blindTargetFactor, bossFactor: boss?.factor });
}

export const BOSS_BY_ID: Record<string, BossDef> = Object.fromEntries(BOSSES.map((b) => [b.id, b]));

/** Startet eine Runde. Boss Effekte und Runden Tags verändern Hands, Discards und Hand Size. */
export function startRound(run: RunState, opts: { extraHands?: number; bossDisabled?: boolean } = {}): RoundState {
  const blind = currentBlind(run);
  const rng = rngOf(run);
  const drawPile = rng.shuffle(`shuffle_a${run.ante}_${blind}`, [...run.deck]);
  const boss = blind === 'boss' && run.anteBoss && !opts.bossDisabled ? BOSS_BY_ID[run.anteBoss] : undefined;
  const e = boss?.effect ?? {};
  const p = jokerPassive(run);
  const round: RoundState = {
    blind,
    target: currentTarget(run, blind),
    score: 0,
    handsLeft: Math.max(1, run.hands + p.hands + (e.handsDelta ?? 0) + (opts.extraHands ?? 0)),
    discardsLeft: Math.max(0, e.setDiscards ?? run.discards + p.discards),
    drawPile,
    hand: [],
    discardPile: [],
    handSize: Math.max(1, run.handSize + p.handSize + (e.handSizeDelta ?? 0)),
    bossId: boss?.id,
    playedTypes: [],
  };
  if (e.debuffRandomSuit) round.debuffSuit = rng.pick(`boss_suit_a${run.ante}`, ['S', 'H', 'D', 'C'] as Suit[]);
  run.round = round;
  drawToHandSize(run);
  return round;
}

export function activeBoss(run: RunState): BossDef | undefined {
  const id = run.round?.bossId;
  return id ? BOSS_BY_ID[id] : undefined;
}

/** Ist die Karte durch den aktiven Boss geschwächt? */
export function isCardDebuffed(run: RunState, card: Card): boolean {
  const boss = activeBoss(run);
  if (!boss || isRankless(card)) return false;
  const e = boss.effect;
  const suits = [...(e.debuffSuits ?? []), ...(run.round?.debuffSuit ? [run.round.debuffSuit] : [])];
  if (suits.length && (isAnySuit(card) || suits.includes(card.suit))) return true;
  if (e.debuffFace && isFace(card.rank)) return true;
  if (e.debuffEvenRanks && card.rank <= 10 && card.rank % 2 === 0) return true;
  return false;
}

/** Jokers, die der aktive Boss nicht schwächt */
export function activeJokers(run: RunState): JokerInstance[] {
  const boss = activeBoss(run);
  if (boss?.effect.debuffRightmostJoker && run.jokers.length) return run.jokers.slice(0, -1);
  return run.jokers;
}

export function drawToHandSize(run: RunState): Card[] {
  const r = run.round!;
  const drawn: Card[] = [];
  while (r.hand.length < r.handSize && r.drawPile.length > 0) {
    const c = r.drawPile.pop()!;
    r.hand.push(c);
    drawn.push(c);
  }
  return drawn;
}

function takeFromHand(r: RoundState, ids: number[]): Card[] {
  // Reihenfolge der Hand (links nach rechts) bleibt erhalten
  const taken = r.hand.filter((c) => ids.includes(c.id));
  r.hand = r.hand.filter((c) => !ids.includes(c.id));
  return taken;
}

/** Sternbilder in den Consumable Slots mit der Hand, die sie verbessern */
function heldSternbilder(run: RunState): { uid: number; hand: HandType }[] {
  const out: { uid: number; hand: HandType }[] = [];
  for (const c of run.consumables) {
    const e = CONSUMABLE_BY_ID[c.defId]?.effect;
    if (e?.kind === 'levelHand') out.push({ uid: c.uid, hand: e.hand });
  }
  return out;
}

export function playCards(run: RunState, ids: number[]): ScoreResult {
  const r = run.round!;
  if (ids.length === 0 || ids.length > START.maxPlay || new Set(ids).size !== ids.length) throw new Error('invalid selection');
  if (!ids.every((id) => r.hand.some((c) => c.id === id))) throw new Error('invalid selection');
  if (r.handsLeft <= 0) throw new Error('no hands left');
  const played = takeFromHand(r, ids);
  r.handsLeft--;
  const rng = rngOf(run);
  const jokers = activeJokers(run);
  const rules = jokerRules(jokers);
  const withDebuff = (c: Card): Card => (isCardDebuffed(run, c) ? { ...c, debuffed: true } : c);
  const boss = activeBoss(run)?.effect;
  const type = detectHand(played, rules).type;
  const nullify = !!boss && ((boss.uniqueHandTypes && r.playedTypes.includes(type)) || (boss.minCards !== undefined && played.length < boss.minCards));
  const result = scoreHand({
    played: played.map(withDebuff),
    held: r.hand.map(withDebuff),
    handLevels: run.handLevels,
    jokers,
    money: run.money,
    handsLeft: r.handsLeft,
    discardsLeft: r.discardsLeft,
    ante: run.ante,
    blind: r.blind,
    rules,
    boss: boss ? { levelDown: boss.levelDown, halveBase: boss.halveBase, nullify } : undefined,
    balance: run.rules.balance,
    heldSternbilder: run.rules.sternbildXMult > 1 ? heldSternbilder(run) : [],
    sternbildXMult: run.rules.sternbildXMult,
    chance: (num, den, key) => rng.chance(num, den, `${key}_a${run.ante}`, effectiveProbMult(run)),
  });
  r.playedTypes.push(type);
  r.score += result.total;
  if (result.total > run.stats.bestHand) {
    run.stats.bestHand = result.total;
    run.stats.bestHandType = result.handType;
  }
  run.money += result.money - (boss?.moneyPerHand ?? 0);
  run.handsPlayed[result.handType] = (run.handsPlayed[result.handType] ?? 0) + 1;
  const destroyedIds = new Set(result.destroyed.map((c) => c.id));
  run.deck = run.deck.filter((c) => !destroyedIds.has(c.id));
  r.discardPile.push(...played.filter((c) => !destroyedIds.has(c.id)));
  for (const ed of result.cardEdits) {
    modifyCardById(run, ed.cardId, (c) => {
      if (ed.extraChips) c.extraChips = (c.extraChips ?? 0) + ed.extraChips;
      if (ed.enhancement && !c.enhancement) c.enhancement = ed.enhancement;
    });
  }
  if (result.destroyJokers.length) run.jokers = run.jokers.filter((j) => !result.destroyJokers.includes(j.uid));
  return result;
}

export function discardCards(run: RunState, ids: number[]): void {
  const r = run.round!;
  if (ids.length === 0 || ids.length > START.maxDiscard || new Set(ids).size !== ids.length) throw new Error('invalid selection');
  if (!ids.every((id) => r.hand.some((c) => c.id === id))) throw new Error('invalid selection');
  if (r.discardsLeft <= 0) throw new Error('no discards left');
  const discarded = takeFromHand(r, ids);
  r.discardPile.push(...discarded);
  r.discardsLeft--;
  run.stats.discardsUsed++;
  run.money += runJokerHook(run, 'discard', { discarded }).money;
}

/** Alle Objekte einer Karte (Deck, Hand, Stapel). Nach dem Laden eines Spielstands sind es getrennte Kopien. */
function cardObjects(run: RunState, id: number): Card[] {
  const out = new Set<Card>();
  const scan = (list?: Card[]) => list?.forEach((c) => { if (c.id === id) out.add(c); });
  scan(run.deck);
  if (run.round) {
    scan(run.round.hand);
    scan(run.round.drawPile);
    scan(run.round.discardPile);
  }
  return [...out];
}

/** Ändert eine Karte überall, wo sie vorkommt */
export function modifyCardById(run: RunState, id: number, fn: (c: Card) => void) {
  for (const c of cardObjects(run, id)) fn(c);
}

export function isRoundWon(run: RunState): boolean {
  return !!run.round && run.round.score >= run.round.target;
}

export function isRoundLost(run: RunState): boolean {
  const r = run.round;
  return !!r && r.score < r.target && (r.handsLeft === 0 || (r.hand.length === 0 && r.drawPile.length === 0));
}

/** Zinsen auf den Bestand vor der Auszahlung (Offener Punkt O10). */
export function interestFor(money: number, rules: RunRules): number {
  if (rules.noInterest) return 0;
  return Math.min(rules.interestCap, Math.floor(Math.max(money, 0) / rules.interestPer) * INTEREST.amount);
}

export function computeEarnings(run: RunState): RoundEarnings {
  const r = run.round!;
  const reward = blindReward(run.ante, r.blind, run.rules.smallBlindReward);
  const handsBonus = r.handsLeft * run.rules.perHandLeft;
  const discardsBonus = r.discardsLeft * run.rules.perDiscardLeft;
  const interest = interestFor(run.money, { ...run.rules, interestCap: run.rules.interestCap + jokerPassive(run).interestCapDelta });
  const jokers = runJokerHook(run, 'roundEnd', {}, false).money;
  return { blindReward: reward, handsBonus, discardsBonus, interest, jokers, total: reward + handsBonus + discardsBonus + interest + jokers };
}

/** Zahlt die Runde aus und geht zum nächsten Blind. */
export function finishRound(run: RunState): RoundEarnings {
  const earnings = computeEarnings(run);
  run.money += earnings.total;
  run.stats.moneyPeak = Math.max(run.stats.moneyPeak, run.money);
  if (run.round && run.round.playedTypes.length === 1 && run.round.score >= run.round.target) run.stats.oneHandWins++;
  runJokerHook(run, 'roundEnd', {}, true);
  const wasBoss = run.round!.blind === 'boss';
  run.round = null;
  if (wasBoss) {
    if (run.ante === FINAL_ANTE) run.won = true;
    run.ante++;
    run.blindIndex = 0;
  } else {
    run.blindIndex++;
  }
  return earnings;
}

/** Kann ein Joker (mit dieser Edition) aufgenommen werden? */
export function canAddJoker(run: RunState, edition?: string): boolean {
  const extra = edition ? EDITIONS[edition]?.extraSlot ?? 0 : 0;
  return run.jokers.length < jokerCapacity(run) + extra;
}

export function addJoker(run: RunState, defId: string, opts: { edition?: string; buyPrice?: number } = {}): JokerInstance | null {
  if (!canAddJoker(run, opts.edition)) return null;
  const inst: JokerInstance = { uid: run.nextUid++, defId, vars: { ...(getJoker(defId)?.init?.(getJoker(defId)!.config) ?? {}) }, ...(opts.edition ? { edition: opts.edition } : {}), ...(opts.buyPrice !== undefined ? { buyPrice: opts.buyPrice } : {}) };
  run.jokers.push(inst);
  return inst;
}

/** Verkaufswert eines Jokers aus seinem Kaufpreis (Briefing 1.4) */
export function jokerSellValue(inst: JokerInstance): number {
  return sellFromPrice(inst.buyPrice ?? getJoker(inst.defId)?.cost ?? 0);
}

/** Joker Slots inklusive Schatten Edition (+1 Slot) */
export function jokerCapacity(run: RunState): number {
  return run.jokerSlots + jokerPassive(run).jokerSlots + run.jokers.filter((j) => j.edition && EDITIONS[j.edition]?.extraSlot).reduce((s, j) => s + (EDITIONS[j.edition!].extraSlot ?? 0), 0);
}

/** Kompatibilität: Verkaufswert aus einem Preis. */
export const sellValue = sellFromPrice;

/** Platzhalter bis zum Shop: n verschiedene Jokers, die nicht im Besitz sind. */
export function jokerOffer(run: RunState, n: number): string[] {
  const rng = rngOf(run);
  const owned = new Set(run.jokers.map((j) => j.defId));
  const picks: string[] = [];
  const free = () => allJokers().filter((j) => !owned.has(j.id) && !picks.includes(j.id) && j.rarity !== 'legendary');
  while (picks.length < n && free().length > 0) {
    const rarity = rollRarity(rng, `offer_rarity_a${run.ante}`);
    let pool = free().filter((j) => j.rarity === rarity);
    // Resample: leere Rarity fällt auf alle freien Jokers zurück (Briefing 7.1)
    if (pool.length === 0) pool = free();
    picks.push(rng.pick(`offer_joker_a${run.ante}`, pool).id);
  }
  return picks;
}
