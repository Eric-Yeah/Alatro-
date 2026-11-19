/**
 * Zustandsautomat des Runs (Briefing 8.2). Die UI ruft nur diese Aktionen auf und
 * zeigt den Zustand an. Erlaubte Übergänge:
 *
 * blindSelect -> (selectBlind) round | (skipBlind) blindSelect oder pack
 * round -> (playHand + afterHand) round | roundWon | gameOver
 * round -> (discardHand + afterHand) round | gameOver
 * roundWon -> (cashOut) shop
 * shop -> (buyPack) pack -> shop
 * shop -> (leaveShop) blindSelect
 *
 * Consumables im Slot (useConsumable, sellConsumable) sind in jeder Phase erlaubt, solange
 * der Effekt keine Karten Ziele braucht oder eine Runde läuft.
 */
import { BOSSES } from '../data/bosses';
import { CONSUMABLE_COST, CONSUMABLES, PACK_HAND_SIZE, type ConsumableType } from '../data/consumables';
import { DECKS, type DeckDef } from '../data/decks';
import { EDITIONS } from '../data/modifiers';
import type { RunMods } from '../data/modsSpec';
import { FIRST_SHOP_PACK, PACKS, type PackDef } from '../data/packs';
import { BASE_PRICES } from '../data/shop';
import { DEFAULT_STAKE_ID, STAKES, stakeChain, type StakeDef } from '../data/stakes';
import { clampScale, scaleMods } from '../data/difficulty';
import { TWIST_BY_ID } from '../data/daily';
import { TAGS, type TagDef } from '../data/tags';
import { VOUCHERS, type VoucherDef } from '../data/vouchers';
import { REROLL } from '../data/economy';
import { BLIND_KINDS, isShowdown } from './blinds';
import { createStandardDeck } from './cards';
import {
  addConsumable, canUseConsumable, consumableDef, createStarSealConsumables, freeConsumableSlots, useConsumable as useFromSlot, useDirect,
  type UseResult,
} from './consumables';
import { rollConsumable, rollJoker, rollJokerEdition, rollPlayingCard } from './generate';
import { getJoker } from './jokers';
import type { RngStreams } from './rng';
import {
  addJoker, canAddJoker, discardCards, drawToHandSize, finishRound, isRoundLost, isRoundWon, jokerPassive, jokerSellValue, newRun,
  playCards, rngOf, runJokerHook, startRound, type PackOption, type RoundEarnings, type RunState, type ShopItem,
} from './run';
import { buyPrice } from './shop';
import type { ScoreResult } from './scoring';
import type { Card } from './types';

export const TAG_BY_ID: Record<string, TagDef> = Object.fromEntries(TAGS.map((t) => [t.id, t]));
export const VOUCHER_BY_ID: Record<string, VoucherDef> = Object.fromEntries(VOUCHERS.map((v) => [v.id, v]));
export const PACK_BY_ID: Record<string, PackDef> = Object.fromEntries(PACKS.map((p) => [p.id, p]));
export const DECK_BY_ID: Record<string, DeckDef> = Object.fromEntries(DECKS.map((d) => [d.id, d]));
export const STAKE_BY_ID: Record<string, StakeDef> = Object.fromEntries(STAKES.map((s) => [s.id, s]));

// ─────────────────────────────────────────────── Regeländerungen

/** Wendet deklarative Regeländerungen eines Vouchers, Decks oder Stakes an. */
export function applyMods(run: RunState, m: RunMods) {
  run.hands += m.handsDelta ?? 0;
  run.discards = Math.max(0, run.discards + (m.discardsDelta ?? 0));
  run.handSize += m.handSizeDelta ?? 0;
  run.jokerSlots += m.jokerSlotsDelta ?? 0;
  run.consumableSlots += m.consumableSlotsDelta ?? 0;
  run.money += m.moneyDelta ?? 0;
  const r = run.rules;
  r.shopSlots += m.shopSlotsDelta ?? 0;
  r.rerollBase = Math.max(0, r.rerollBase + (m.rerollDelta ?? 0));
  if (m.discount !== undefined) r.discount = m.discount;
  if (m.interestCap !== undefined) r.interestCap = m.interestCap;
  if (m.editionRate !== undefined) r.editionRate = m.editionRate;
  if (m.scaling !== undefined) r.scaling = m.scaling;
  if (m.smallBlindReward !== undefined) r.smallBlindReward = m.smallBlindReward;
  // Faktoren verschiedener Quellen (Stufe, Deck, Wandlung) multiplizieren sich
  if (m.blindTargetFactor !== undefined) r.blindTargetFactor *= m.blindTargetFactor;
  if (m.balance !== undefined) r.balance = m.balance;
  if (m.noInterest !== undefined) r.noInterest = m.noInterest;
  if (m.perHandLeft !== undefined) r.perHandLeft = m.perHandLeft;
  if (m.perDiscardLeft !== undefined) r.perDiscardLeft = m.perDiscardLeft;
  if (m.typeWeights) r.typeWeights = { ...r.typeWeights, ...m.typeWeights };
  if (m.sternbildXMult !== undefined) r.sternbildXMult = m.sternbildXMult;
  if (m.shopCardMods !== undefined) r.shopCardMods = m.shopCardMods;
}

function buildDeck(deck: DeckDef): Card[] {
  let cards = createStandardDeck();
  if (deck.removeRanks) cards = cards.filter((c) => !deck.removeRanks!.includes(c.rank));
  if (deck.startEnhancement) {
    const se = deck.startEnhancement;
    cards = cards.map((c) => (se.ranks.includes(c.rank) ? { ...c, enhancement: se.enhancement } : c));
  }
  return cards;
}

export interface RunSetup {
  seed: string;
  deckId?: string;
  /** feste Stake Stufe (Leiter oder Einsteigerstufe) */
  stakeId?: string;
  /** Stufe der skalierenden Schwierigkeit, hat Vorrang vor stakeId */
  level?: number;
  /** Tageslauf: Datum und Tageswandlung */
  daily?: { date: string; twistId: string };
}

/** Pseudo Stake Id für Runs mit skalierender Schwierigkeit */
export const SCALE_STAKE_ID = 'skala';

/** Neuer Run mit Deck und Schwierigkeit. Stakes der Leiter wirken kumulativ (alle bis zur gewählten Stufe). */
export function createRun(setup: RunSetup): RunState {
  const run = newRun(setup.seed);
  const deck = DECK_BY_ID[setup.deckId ?? DECKS[0].id] ?? DECKS[0];
  if (setup.level !== undefined) {
    run.stakeId = SCALE_STAKE_ID;
    run.difficulty = clampScale(setup.level);
    for (const m of scaleMods(run.difficulty)) applyMods(run, m);
  } else {
    const stake = STAKE_BY_ID[setup.stakeId ?? ''] ?? STAKE_BY_ID[DEFAULT_STAKE_ID];
    run.stakeId = stake.id;
    for (const s of stakeChain(stake.id)) applyMods(run, s.mods);
  }
  run.deckId = deck.id;
  applyMods(run, deck.mods);
  const twist = setup.daily ? TWIST_BY_ID[setup.daily.twistId] : undefined;
  if (setup.daily && twist) {
    run.daily = setup.daily.date;
    run.twistId = twist.id;
    applyMods(run, twist.mods);
  }
  run.deck = buildDeck(deck);
  run.nextCardId = Math.max(0, ...run.deck.map((c) => c.id)) + 1;
  enterAnte(run);
  run.phase = 'blindSelect';
  return run;
}

// ─────────────────────────────────────────────── Ante: Boss, Tags, Voucher

/** Wählt den Boss einer Ante: passende Mindest Ante, Showdown Regel, ohne Wiederholung. */
export function chooseBoss(run: RunState): string {
  const showdown = isShowdown(run.ante);
  const fits = BOSSES.filter((b) => (showdown ? b.showdown : !b.showdown && b.minAnte <= run.ante));
  let pool = fits.filter((b) => !run.bossesSeen.includes(b.id));
  if (pool.length === 0) {
    // alle schon gesehen: diese Kategorie wieder freigeben
    run.bossesSeen = run.bossesSeen.filter((id) => !fits.some((b) => b.id === id));
    pool = fits;
  }
  const boss = rngOf(run).pick(`boss_a${run.ante}`, pool);
  run.bossesSeen.push(boss.id);
  return boss.id;
}

function chooseTag(run: RunState, kind: 'small' | 'big'): string {
  const pool = TAGS.filter((t) => t.minAnte <= run.ante);
  return rngOf(run).pick(`tag_a${run.ante}_${kind}`, pool).id;
}

function chooseVoucher(run: RunState): string | null {
  const pool = VOUCHERS.filter((v) => !run.vouchers.includes(v.id) && (!v.requires || run.vouchers.includes(v.requires)));
  return pool.length ? rngOf(run).pick(`voucher_a${run.ante}`, pool).id : null;
}

export function enterAnte(run: RunState) {
  run.anteBoss = chooseBoss(run);
  run.anteTags = { small: chooseTag(run, 'small'), big: chooseTag(run, 'big') };
  run.anteVoucher = chooseVoucher(run);
}

// ─────────────────────────────────────────────── Blind Auswahl

function takePending(run: RunState, kind: string): TagDef[] {
  const taken = run.pendingTags.map((id) => TAG_BY_ID[id]).filter((t) => t?.effect.kind === kind);
  const ids = new Set(taken.map((t) => t.id));
  let removed = 0;
  run.pendingTags = run.pendingTags.filter((id) => {
    if (ids.has(id) && removed < taken.length) { removed++; return false; }
    return true;
  });
  return taken;
}

export interface BlindSelectResult {
  /** Geld durch Jokers bei der Blind Wahl */
  money: number;
  /** durch Jokers erzeugte Consumables (Definitions IDs) */
  consumables: string[];
}

export function selectBlind(run: RunState): BlindSelectResult {
  if (run.phase !== 'blindSelect') throw new Error('not in blind select');
  const extraHands = takePending(run, 'extraHands').reduce((s, t) => s + (t.effect.kind === 'extraHands' ? t.effect.amount : 0), 0);
  const isBoss = BLIND_KINDS[run.blindIndex] === 'boss';
  const bossDisabled = isBoss && takePending(run, 'disableBoss').length > 0;
  startRound(run, { extraHands, bossDisabled });
  run.phase = 'round';
  // Jokers mit Effekt bei der Blind Wahl: Geld und Consumables
  const hook = runJokerHook(run, 'blindSelected');
  run.money += hook.money;
  const rng = rngOf(run);
  const consumables: string[] = [];
  for (const type of hook.consumables) {
    const def = rollConsumable(run, rng, type, `joker_blind_${type}_a${run.ante}`);
    if (def && addConsumable(run, def.id, def.cost)) consumables.push(def.id);
  }
  return { money: hook.money, consumables };
}

export interface SkipResult {
  tagId: string;
  /** Tag wurde doppelt vergeben */
  doubled: boolean;
}

/** Überspringt Small oder Big Blind und vergibt dessen Tag (Briefing 1.1). */
export function skipBlind(run: RunState): SkipResult {
  if (run.phase !== 'blindSelect') throw new Error('not in blind select');
  const kind = BLIND_KINDS[run.blindIndex];
  if (kind === 'boss' || !run.anteTags) throw new Error('boss cannot be skipped');
  const tagId = run.anteTags[kind];
  run.skips++;
  run.blindIndex++;
  const doubled = takePending(run, 'duplicateNext').length > 0;
  grantTag(run, tagId);
  if (doubled) grantTag(run, tagId);
  return { tagId, doubled };
}

export function grantTag(run: RunState, tagId: string) {
  const tag = TAG_BY_ID[tagId];
  if (!tag) return;
  const e = tag.effect;
  if (tag.when !== 'immediate') {
    run.pendingTags.push(tagId);
    return;
  }
  if (e.kind === 'money') run.money += e.amount;
  if (e.kind === 'moneyPerSkip') run.money += e.amount * run.skips;
  if (e.kind === 'openPack') openPack(run, e.pack, 'blindSelect');
}

// ─────────────────────────────────────────────── Runde

/** Spielt die markierten Karten. Danach muss die UI afterHand aufrufen. */
export function playHand(run: RunState, ids: number[]): ScoreResult {
  if (run.phase !== 'round') throw new Error('not in round');
  return playCards(run, ids);
}

export function discardHand(run: RunState, ids: number[]) {
  if (run.phase !== 'round') throw new Error('not in round');
  discardCards(run, ids);
}

/** Nach Play oder Discard: gewonnen, sonst nachziehen und Niederlage prüfen. */
export function afterHand(run: RunState): Card[] {
  if (isRoundWon(run)) {
    run.phase = 'roundWon';
    return [];
  }
  const drawn = drawToHandSize(run);
  if (isRoundLost(run) && !rescueRound(run)) run.phase = 'gameOver';
  return drawn;
}

/**
 * Ein Joker mit Rettung verhindert die Niederlage, wenn der Score mindestens seinen Anteil des
 * Ziels erreicht hat. Der Joker verbraucht sich, die Runde zählt als geschafft.
 */
function rescueRound(run: RunState): boolean {
  const r = run.round;
  if (!r) return false;
  for (const inst of run.jokers) {
    const def = getJoker(inst.defId);
    if (!def?.rescue || r.score < r.target * (def.config.fraction ?? 1)) continue;
    run.jokers = run.jokers.filter((j) => j.uid !== inst.uid);
    r.rescuedBy = def.name;
    run.phase = 'roundWon';
    return true;
  }
  return false;
}

/** Auszahlung, nächster Blind, Shop öffnen. Nach einem Boss beginnt eine neue Ante. */
export function cashOut(run: RunState): RoundEarnings & { starSealCreated: string[] } {
  if (run.phase !== 'roundWon') throw new Error('round not won');
  const wasBoss = run.round!.blind === 'boss';
  const starSealCreated = createStarSealConsumables(run);
  const earnings = finishRound(run);
  if (wasBoss) enterAnte(run);
  openShop(run);
  return { ...earnings, starSealCreated };
}

// ─────────────────────────────────────────────── Shop

/** Karten Slots im Shop: Regel plus Jokers */
function shopSlotCount(run: RunState): number {
  return run.rules.shopSlots + jokerPassive(run).shopSlots;
}

function priceWithDiscount(run: RunState, base: number, surcharge = 0): number {
  const tag = run.shop?.tagDiscount ?? 1;
  return buyPrice({ base, editionSurcharge: surcharge, discount: run.rules.discount * tag * jokerPassive(run).discount });
}

function rollShopCard(run: RunState, rng: RngStreams, exclude: Set<string>): ShopItem | null {
  const type = rng.weighted(`shop_type_a${run.ante}`, run.rules.typeWeights);
  if (type === 'karte') {
    const card = rollPlayingCard(run, rng, `shop_card_a${run.ante}`, !run.rules.shopCardMods);
    return { kind: 'card', card, price: priceWithDiscount(run, BASE_PRICES.playingCard) };
  }
  if (type !== 'joker') {
    const def = rollConsumable(run, rng, type as ConsumableType, `shop_${type}_a${run.ante}`, exclude);
    if (def) return { kind: 'consumable', defId: def.id, price: priceWithDiscount(run, def.cost) };
    // leerer Pool: es fällt auf einen Joker zurück (Briefing 7.1)
  }
  const def = rollJoker(run, rng, `shop_joker_a${run.ante}`, exclude);
  if (!def) return null;
  exclude.add(def.id);
  const edition = rollJokerEdition(run, rng, `shop_edition_a${run.ante}`);
  return { kind: 'joker', defId: def.id, edition, price: priceWithDiscount(run, def.cost, edition ? EDITIONS[edition].surcharge : 0) };
}

export function openShop(run: RunState) {
  const rng = rngOf(run);
  const freeRerolls = jokerPassive(run).freeRerolls + takePending(run, 'freeRerolls').reduce((s, t) => s + (t.effect.kind === 'freeRerolls' ? t.effect.count : 0), 0);
  const discounts = takePending(run, 'shopDiscount');
  const tagDiscount = discounts.reduce((f, t) => f * (t.effect.kind === 'shopDiscount' ? t.effect.factor : 1), 1);
  run.shop = { cards: [], packs: [], voucher: null, rerollsUsed: 0, freeRerolls, tagDiscount };

  const exclude = new Set<string>();
  for (let i = 0; i < shopSlotCount(run); i++) run.shop.cards.push(rollShopCard(run, rng, exclude));
  for (const t of takePending(run, 'freeJoker')) {
    if (t.effect.kind !== 'freeJoker') continue;
    const def = rollJoker(run, rng, `tag_joker_a${run.ante}`, exclude, t.effect.rarity);
    if (def) {
      exclude.add(def.id);
      run.shop.cards.push({ kind: 'joker', defId: def.id, price: 0, free: true });
    }
  }

  const packWeights = Object.fromEntries(PACKS.map((p) => [p.id, p.weight])) as Record<string, number>;
  for (let i = 0; i < 2; i++) {
    const packId = run.shopsVisited === 0 && i === 0 ? FIRST_SHOP_PACK : rng.weighted(`shop_pack_a${run.ante}`, packWeights);
    run.shop.packs.push({ packId, price: priceWithDiscount(run, PACK_BY_ID[packId].cost) });
  }
  if (run.anteVoucher) run.shop.voucher = { voucherId: run.anteVoucher, price: VOUCHER_BY_ID[run.anteVoucher].cost };
  run.shopsVisited++;
  run.phase = 'shop';
}

export function rerollCost(run: RunState): number {
  const s = run.shop!;
  if (s.freeRerolls > 0) return 0;
  return run.rules.rerollBase + s.rerollsUsed * REROLL.step;
}

export function reroll(run: RunState): boolean {
  const s = run.shop;
  if (!s || run.phase !== 'shop') return false;
  const cost = rerollCost(run);
  if (run.money < cost) return false;
  run.money -= cost;
  if (s.freeRerolls > 0) s.freeRerolls--;
  else s.rerollsUsed++;
  run.stats.rerolls++;
  // Reroll ersetzt nur die normalen Karten Slots, nicht Packs, Voucher oder gratis Tag Jokers
  const keepFree = s.cards.filter((c): c is ShopItem & { kind: 'joker' } => c?.kind === 'joker' && !!c.free);
  const exclude = new Set(keepFree.map((c) => c.defId));
  const rng = rngOf(run);
  s.cards = [];
  for (let i = 0; i < shopSlotCount(run); i++) s.cards.push(rollShopCard(run, rng, exclude));
  s.cards.push(...keepFree);
  return true;
}

export function canBuyCard(run: RunState, index: number): boolean {
  const item = run.shop?.cards[index];
  if (!item || run.money < item.price) return false;
  if (item.kind === 'joker') return canAddJoker(run, item.edition);
  if (item.kind === 'consumable') return freeConsumableSlots(run) > 0;
  return true;
}

export function buyCard(run: RunState, index: number): boolean {
  if (!canBuyCard(run, index)) return false;
  const item = run.shop!.cards[index]!;
  run.money -= item.price;
  if (item.kind === 'joker') {
    addJoker(run, item.defId, { edition: item.edition, buyPrice: item.free ? 0 : item.price });
    run.stats.jokersBought++;
  }
  else if (item.kind === 'consumable') addConsumable(run, item.defId, item.price);
  else run.deck.push(item.card);
  run.shop!.cards[index] = null;
  return true;
}

/** Consumable ohne Karten Ziel kaufen und sofort benutzen, ohne einen Slot zu belegen. */
export function canBuyAndUse(run: RunState, index: number): boolean {
  const item = run.shop?.cards[index];
  if (item?.kind !== 'consumable' || run.money < item.price) return false;
  const def = consumableDef(item.defId);
  return !!def && !def.targets && canUseConsumable(run, item.defId, [], 'direct');
}

export function buyAndUse(run: RunState, index: number): UseResult | null {
  if (!canBuyAndUse(run, index)) return null;
  const item = run.shop!.cards[index] as ShopItem & { kind: 'consumable' };
  const res = useDirect(run, item.defId);
  if (!res) return null;
  run.money -= item.price;
  run.shop!.cards[index] = null;
  return res;
}

export function buyVoucher(run: RunState): boolean {
  const v = run.shop?.voucher;
  if (!v || run.money < v.price) return false;
  run.money -= v.price;
  run.vouchers.push(v.voucherId);
  applyMods(run, VOUCHER_BY_ID[v.voucherId].mods);
  run.shop!.voucher = null;
  run.anteVoucher = null;
  return true;
}

export function buyPack(run: RunState, index: number): boolean {
  const p = run.shop?.packs[index];
  if (!p || run.money < p.price) return false;
  run.money -= p.price;
  run.shop!.packs[index] = null;
  openPack(run, p.packId, 'shop');
  return true;
}

export function sellJoker(run: RunState, uid: number): boolean {
  const idx = run.jokers.findIndex((j) => j.uid === uid);
  if (idx < 0) return false;
  const inst = run.jokers[idx];
  run.money += jokerSellValue(inst) + runJokerHook(run, 'sell', {}, true, [inst]).money;
  run.jokers.splice(idx, 1);
  return true;
}

export function leaveShop(run: RunState) {
  if (run.phase !== 'shop') throw new Error('not in shop');
  run.shop = null;
  run.phase = 'blindSelect';
}

// ─────────────────────────────────────────────── Packs

export function openPack(run: RunState, packId: string, returnPhase: RunState['phase']) {
  const pack = PACK_BY_ID[packId];
  const rng = rngOf(run);
  const options: PackOption[] = [];
  const exclude = new Set<string>();
  for (let i = 0; i < pack.choices; i++) {
    if (pack.kind === 'joker') {
      const def = rollJoker(run, rng, `pack_joker_a${run.ante}`, exclude);
      if (!def) break;
      exclude.add(def.id);
      options.push({ kind: 'joker', defId: def.id, edition: rollJokerEdition(run, rng, `pack_edition_a${run.ante}`) });
    } else if (pack.kind === 'karten') {
      options.push({ kind: 'card', card: rollPlayingCard(run, rng, `pack_card_a${run.ante}`) });
    } else {
      const def = rollConsumable(run, rng, pack.kind, `pack_${pack.kind}_a${run.ante}`, exclude);
      if (!def) break;
      exclude.add(def.id);
      options.push({ kind: 'consumable', defId: def.id });
    }
  }
  // Elixier und Omen brauchen Karten als Ziele: eine Hand aus dem Deck wird mit angezeigt
  const handIds = pack.kind === 'elixier' || pack.kind === 'omen'
    ? rng.shuffle(`pack_hand_a${run.ante}`, [...run.deck]).slice(0, PACK_HAND_SIZE).map((c) => c.id)
    : undefined;
  run.pack = { packId, options, picksLeft: pack.picks, returnPhase, ...(handIds ? { handIds } : {}) };
  run.phase = 'pack';
}

export function canPick(run: RunState, index: number, targetIds: number[] = []): boolean {
  const o = run.pack?.options[index];
  if (!o || !run.pack || run.pack.picksLeft <= 0) return false;
  if (o.kind === 'consumable') return canUseConsumable(run, o.defId, targetIds, 'direct');
  return o.kind === 'card' || canAddJoker(run, o.edition);
}

/** Wählt eine Karte. Consumables aus Packs werden sofort benutzt, targetIds sind die Ziel Karten. */
export function pickFromPack(run: RunState, index: number, targetIds: number[] = []): UseResult | boolean {
  if (!canPick(run, index, targetIds)) return false;
  const p = run.pack!;
  const o = p.options[index]!;
  let result: UseResult | null = null;
  if (o.kind === 'joker') addJoker(run, o.defId, { edition: o.edition, buyPrice: getJoker(o.defId)?.cost });
  else if (o.kind === 'card') run.deck.push(o.card);
  else result = useDirect(run, o.defId, targetIds);
  p.options[index] = null;
  p.picksLeft--;
  if (p.picksLeft <= 0 || p.options.every((x) => !x)) closePack(run);
  return result ?? true;
}

export function closePack(run: RunState) {
  const back = run.pack?.returnPhase ?? 'shop';
  run.pack = null;
  run.phase = back;
}


/**
 * Benutzt ein Consumable aus dem Slot. Zerstörte Karten können die Hand leeren: dann ist die
 * Runde verloren, wenn auch der Nachziehstapel leer ist.
 */
export function useConsumable(run: RunState, uid: number, targetIds: number[] = []): UseResult | null {
  const res = useFromSlot(run, uid, targetIds);
  if (res && run.phase === 'round' && isRoundLost(run)) run.phase = 'gameOver';
  return res;
}

export { sellConsumable, canUseConsumable } from './consumables';
export { CONSUMABLE_COST, CONSUMABLES };
