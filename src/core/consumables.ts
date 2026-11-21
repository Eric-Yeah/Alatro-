/**
 * Consumables im Spiel: Slots, Verkauf, Benutzen. Die Effekte sind in data/consumables.ts
 * deklariert, hier werden sie angewendet. Karten Ziele stammen aus der Hand der Runde oder
 * aus der Hand eines Elixier oder Omen Packs.
 */
import {
  CONSUMABLE_BY_ID, CONSUMABLES, JOKER_UPGRADE_CHAIN, MAX_CONSUMABLE_SLOTS, MAX_HAND_SIZE, MIN_HANDS, MIN_HAND_SIZE, OMEN_EDITIONS,
  type ConsumableDef, type ConsumableType,
} from '../data/consumables';
import { SUITS } from '../data/cards';
import { HAND_DATA, HAND_ORDER } from '../data/hands';
import { SEALS } from '../data/modifiers';
import { TAGS } from '../data/tags';
import { rollConsumable, rollEnhancedCard, rollJoker } from './generate';
import { levelUp, levelUpAll, mostPlayedHand } from './hands';
import { getJoker } from './jokers';
import {
  addJoker, isCardDebuffed, jokerCapacity, jokerPassive, modifyCardById as modifyCard, rngOf, runChance, type ConsumableInstance, type RunState,
} from './run';
import type { JokerInstance } from './jokers';
import { sellValue } from './shop';
import type { Card, HandType, Rank, Suit } from './types';

export { CONSUMABLE_BY_ID } from '../data/consumables';

export function consumableDef(id: string): ConsumableDef | undefined {
  return CONSUMABLE_BY_ID[id];
}

export function consumableCapacity(run: RunState): number {
  return run.consumableSlots + jokerPassive(run).consumableSlots;
}

export function freeConsumableSlots(run: RunState): number {
  return Math.max(0, consumableCapacity(run) - run.consumables.length);
}

export function addConsumable(run: RunState, defId: string, buyPrice?: number): ConsumableInstance | null {
  if (freeConsumableSlots(run) <= 0 || !CONSUMABLE_BY_ID[defId]) return null;
  const inst: ConsumableInstance = { uid: run.nextUid++, defId, ...(buyPrice !== undefined ? { buyPrice } : {}) };
  run.consumables.push(inst);
  return inst;
}

export function consumableSellValue(inst: ConsumableInstance): number {
  return sellValue(inst.buyPrice ?? CONSUMABLE_BY_ID[inst.defId]?.cost ?? 0);
}

export function sellConsumable(run: RunState, uid: number): boolean {
  const idx = run.consumables.findIndex((c) => c.uid === uid);
  if (idx < 0) return false;
  run.money += consumableSellValue(run.consumables[idx]);
  run.consumables.splice(idx, 1);
  return true;
}

/** Das Sternbild einer Hand */
export function sternbildFor(hand: HandType): ConsumableDef | undefined {
  return CONSUMABLES.find((c) => c.effect.kind === 'levelHand' && c.effect.hand === hand);
}

// ─────────────────────────────────────────────── Karten Ziele

/** Karten, die als Ziel oder Zufallsquelle dienen: Hand der Runde oder Hand des Packs */
export function poolCards(run: RunState): Card[] {
  if (run.phase === 'round' && run.round) return run.round.hand;
  if (run.phase === 'pack' && run.pack?.handIds) {
    return run.pack.handIds.map((id) => run.deck.find((c) => c.id === id)).filter((c): c is Card => !!c);
  }
  return [];
}

function removeCards(run: RunState, ids: number[]) {
  const gone = new Set(ids);
  const keep = (c: Card) => !gone.has(c.id);
  run.deck = run.deck.filter(keep);
  if (run.round) {
    run.round.hand = run.round.hand.filter(keep);
    run.round.drawPile = run.round.drawPile.filter(keep);
    run.round.discardPile = run.round.discardPile.filter(keep);
  }
  if (run.pack?.handIds) run.pack.handIds = run.pack.handIds.filter((id) => !gone.has(id));
}

/** Neue Karte ins Deck, in einer Runde auch in die Hand */
function addCard(run: RunState, card: Card) {
  run.deck.push(card);
  if (run.phase === 'round' && run.round) run.round.hand.push(card);
}

// ─────────────────────────────────────────────── Benutzen

export interface UseResult {
  /** Karten, deren Eigenschaften sich geändert haben */
  changed: number[];
  destroyed: number[];
  created: Card[];
  /** erzeugte Consumables (Definitions IDs) */
  consumables: string[];
  /** erzeugter Joker (Definitions ID) */
  joker?: string;
  destroyedJokers: number;
  message: string;
}

/** slot: das Consumable liegt im Slot und gibt ihn beim Benutzen frei. direct: Pack oder Kauf und Benutzen. */
export type UseWhere = 'slot' | 'direct';

function needsPool(def: ConsumableDef): boolean {
  const k = def.effect.kind;
  return !!def.targets || k === 'sacrificeForCards' || k === 'destroyAndLevelAll' || k === 'handSizeUp' || k === 'monoSuit';
}

/** Hand Size ändern: dauerhaft im Run und in der laufenden Runde (die Hand wird erst beim Nachziehen kleiner oder größer) */
function changeHandSize(run: RunState, delta: number) {
  run.handSize = Math.min(MAX_HAND_SIZE, Math.max(MIN_HAND_SIZE, run.handSize + delta));
  if (run.round) run.round.handSize = Math.min(MAX_HAND_SIZE, Math.max(MIN_HAND_SIZE, run.round.handSize + delta));
}

/** Jokers, die ein Omen kopieren oder aufwerten darf */
function copyableJokers(run: RunState): JokerInstance[] {
  return run.jokers.filter((j) => getJoker(j.defId)?.copyCompat !== false);
}

/** Jokers, die eine nächste Rarity haben */
function upgradableJokers(run: RunState): JokerInstance[] {
  return run.jokers.filter((j) => {
    const r = getJoker(j.defId)?.rarity;
    return !!r && JOKER_UPGRADE_CHAIN.indexOf(r) >= 0 && JOKER_UPGRADE_CHAIN.indexOf(r) < JOKER_UPGRADE_CHAIN.length - 1;
  });
}

/** Wirkt nur mitten in einer Runde (Nachziehstapel oder Discards der Runde nötig) */
export function isRoundOnlyConsumable(def: ConsumableDef): boolean {
  return def.effect.kind === 'drawCards' || def.effect.kind === 'extraDiscards';
}

/** Ein Tag, das ein Consumable ablegen darf: es wartet auf ein Ereignis, wirkt nicht sofort */
export function isWaitingTag(tagId: string): boolean {
  const tag = TAGS.find((t) => t.id === tagId);
  return !!tag && tag.when !== 'immediate';
}

/** Häufigste Suit unter Karten, bei Gleichstand die frühere in SUITS */
export function commonestSuit(cards: Card[]): Suit {
  const count = new Map<Suit, number>();
  for (const c of cards) count.set(c.suit, (count.get(c.suit) ?? 0) + 1);
  let best: Suit = SUITS[0];
  let n = -1;
  for (const s of SUITS) {
    const k = count.get(s) ?? 0;
    if (k > n) { best = s; n = k; }
  }
  return best;
}

/** Zufällige Karten aus dem Pool ohne die Ziele */
function randomCards(run: RunState, def: ConsumableDef, exclude: number[], n: number): Card[] {
  const pool = poolCards(run).filter((c) => !exclude.includes(c.id));
  return rngOf(run).shuffle(`cons_${def.id}_a${run.ante}_pick`, [...pool]).slice(0, n);
}

/** Karte mit Enhancement, Seal oder Edition */
const isModified = (c: Card) => !!(c.enhancement || c.seal || c.edition);

export function canUseConsumable(run: RunState, defId: string, targetIds: number[] = [], where: UseWhere = 'slot'): boolean {
  const def = CONSUMABLE_BY_ID[defId];
  if (!def) return false;
  const e = def.effect;
  const pool = poolCards(run);
  if (def.targets) {
    const ids = new Set(targetIds);
    if (ids.size !== targetIds.length) return false;
    if (targetIds.length < def.targets.min || targetIds.length > def.targets.max) return false;
    if (!targetIds.every((id) => pool.some((c) => c.id === id))) return false;
  } else if (needsPool(def) && pool.length === 0) {
    return false;
  }
  const freeSlots = freeConsumableSlots(run) + (where === 'slot' ? 1 : 0);
  switch (e.kind) {
    case 'createConsumables': return freeSlots > 0;
    case 'sacrificeForCards': return pool.length >= e.destroy;
    case 'destroyAndLevelAll': return pool.length >= e.destroy;
    case 'clone': return pool.length >= 1 + e.destroyOthers;
    case 'randomSeal': return pool.length >= 1 + e.destroyOthers;
    case 'jokerForMoney': return run.jokers.length < jokerCapacity(run);
    case 'cauldron': return run.jokers.length > 0;
    case 'tradeDiscardForHand': return run.discards >= 1;
    case 'randomEdition': return run.handSize + e.handSizeDelta >= MIN_HAND_SIZE;
    case 'spreadEnhancement': {
      const src = pool.find((c) => c.id === targetIds[0]);
      return !!src?.enhancement && pool.length >= 2;
    }
    case 'edition': return pool.length >= 1 + e.destroyOthers;
    case 'destroyForMoney': return true;
    case 'levelMostPlayed': return mostPlayedHand(run.handsPlayed) !== null;
    case 'addTag': return isWaitingTag(e.tagId);
    case 'drawCards': return run.phase === 'round' && !!run.round && run.round.drawPile.length >= 1;
    case 'extraDiscards': return run.phase === 'round' && !!run.round;
    case 'jokerEdition': return run.jokers.some((j) => !j.edition) && run.handSize + e.handSizeDelta >= MIN_HAND_SIZE;
    case 'jokerDuplicate': return run.jokers.length < jokerCapacity(run) && copyableJokers(run).length > 0;
    case 'handSizeUp': return pool.length >= e.destroy && run.handSize + e.delta <= MAX_HAND_SIZE;
    case 'slotUp': return run.consumableSlots + e.slots <= MAX_CONSUMABLE_SLOTS && run.handSize + e.handSizeDelta >= MIN_HAND_SIZE;
    case 'tradeHandForDiscard': return run.hands + e.hands >= MIN_HANDS && (!run.round || run.round.handsLeft + e.hands >= MIN_HANDS);
    case 'jokerUpgrade': return upgradableJokers(run).length > 0;
    case 'monoSuit': return pool.length >= e.destroy + 1;
    default: return true;
  }
}

/** Wendet den Effekt an. Voraussetzung: canUseConsumable wurde geprüft. Slot Handling macht der Aufrufer. */
export function applyConsumable(run: RunState, defId: string, targetIds: number[] = []): UseResult {
  const def = CONSUMABLE_BY_ID[defId];
  const e = def.effect;
  const rng = rngOf(run);
  const key = `cons_${def.id}_a${run.ante}`;
  const res: UseResult = { changed: [], destroyed: [], created: [], consumables: [], destroyedJokers: 0, message: def.name };
  const mark = (fn: (c: Card) => void) => {
    for (const id of targetIds) {
      modifyCard(run, id, fn);
      res.changed.push(id);
    }
  };
  const destroy = (cards: Card[]) => {
    removeCards(run, cards.map((c) => c.id));
    res.destroyed.push(...cards.map((c) => c.id));
  };

  switch (e.kind) {
    case 'levelHand':
      run.handLevels = levelUp(run.handLevels, e.hand, e.amount);
      break;
    case 'enhance':
      mark((c) => { c.enhancement = e.enhancement; });
      break;
    case 'seal':
      mark((c) => { c.seal = e.seal; });
      break;
    case 'suit':
      mark((c) => { c.suit = e.suit; });
      break;
    case 'rankUp':
      mark((c) => { c.rank = (((c.rank - 2 + e.amount) % 13) + 2) as Rank; });
      break;
    case 'destroy':
      destroy(poolCards(run).filter((c) => targetIds.includes(c.id)));
      break;
    case 'clone': {
      const src = poolCards(run).filter((c) => targetIds.includes(c.id));
      destroy(randomCards(run, def, targetIds, e.destroyOthers));
      for (const card of src) {
        for (let i = 0; i < e.copies; i++) {
          const copy: Card = { ...card, id: run.nextCardId++ };
          delete copy.debuffed;
          addCard(run, copy);
          res.created.push(copy);
        }
      }
      break;
    }
    case 'doubleMoney':
      run.money += Math.min(e.cap, Math.max(run.money, 0));
      break;
    case 'createConsumables': {
      for (let i = 0; i < e.count && freeConsumableSlots(run) > 0; i++) {
        const c = rollConsumable(run, rng, e.type as ConsumableType, `${key}_create`);
        if (!c) break;
        addConsumable(run, c.id, c.cost);
        res.consumables.push(c.id);
      }
      break;
    }
    case 'sacrificeForCards': {
      destroy(randomCards(run, def, [], e.destroy));
      for (let i = 0; i < e.add; i++) {
        const card = rollEnhancedCard(run, rng, `${key}_card`);
        addCard(run, card);
        res.created.push(card);
      }
      break;
    }
    case 'destroyAndLevelAll':
      destroy(randomCards(run, def, [], e.destroy));
      run.handLevels = levelUpAll(run.handLevels, e.levels);
      break;
    case 'jokerForMoney': {
      const j = rollJoker(run, rng, `${key}_joker`, new Set(), e.rarity);
      if (j) {
        addJoker(run, j.id, { buyPrice: j.cost });
        res.joker = j.id;
        run.money = Math.min(run.money, 0);
      }
      break;
    }
    case 'cauldron': {
      const keep = rng.pick(`${key}_keep`, run.jokers);
      res.destroyedJokers = run.jokers.length - 1;
      keep.edition = e.edition;
      run.jokers = [keep];
      res.joker = keep.defId;
      break;
    }
    case 'randomEdition': {
      const edition = rng.pick(`${key}_edition`, OMEN_EDITIONS);
      mark((c) => { c.edition = edition; });
      run.handSize = Math.max(MIN_HAND_SIZE, run.handSize + e.handSizeDelta);
      break;
    }
    case 'randomSeal': {
      const seal = rng.pick(`${key}_seal`, Object.keys(SEALS));
      destroy(randomCards(run, def, targetIds, e.destroyOthers));
      mark((c) => { c.seal = seal; });
      break;
    }
    case 'tradeDiscardForHand':
      run.hands += 1;
      run.discards = Math.max(0, run.discards - 1);
      if (run.round) {
        run.round.handsLeft += 1;
        run.round.discardsLeft = Math.max(0, run.round.discardsLeft - 1);
      }
      break;
    case 'setRank':
      mark((c) => { c.rank = e.rank; });
      break;
    case 'matchRank': {
      const top = Math.max(...poolCards(run).filter((c) => targetIds.includes(c.id)).map((c) => c.rank)) as Rank;
      mark((c) => { c.rank = top; });
      break;
    }
    case 'matchSuit': {
      const suit = commonestSuit(poolCards(run).filter((c) => targetIds.includes(c.id)));
      mark((c) => { c.suit = suit; });
      break;
    }
    case 'spreadEnhancement': {
      const src = poolCards(run).find((c) => c.id === targetIds[0])!;
      // Karten, die das Enhancement noch nicht haben, werden bevorzugt
      const others = poolCards(run).filter((c) => c.id !== src.id);
      const shuffled = rng.shuffle(`${key}_spread`, [...others]);
      const order = [...shuffled.filter((c) => c.enhancement !== src.enhancement), ...shuffled.filter((c) => c.enhancement === src.enhancement)];
      for (const c of order.slice(0, e.copies)) {
        modifyCard(run, c.id, (x) => { x.enhancement = src.enhancement; });
        res.changed.push(c.id);
      }
      break;
    }
    case 'edition':
      destroy(randomCards(run, def, targetIds, e.destroyOthers));
      mark((c) => { c.edition = e.edition; });
      break;
    case 'destroyForMoney':
      destroy(poolCards(run).filter((c) => targetIds.includes(c.id)));
      run.money += e.money;
      break;
    case 'moneyPerModified':
      run.money += Math.min(e.cap, e.per * run.deck.filter(isModified).length);
      break;
    case 'levelMostPlayed': {
      const top = mostPlayedHand(run.handsPlayed)!;
      for (const h of HAND_ORDER) run.handLevels = levelUp(run.handLevels, h, h === top ? e.amount : e.othersDelta);
      res.message = `${def.name}: ${HAND_DATA[top].name}`;
      break;
    }
    case 'addTag':
      run.pendingTags.push(e.tagId);
      if (e.halveMoney) run.money -= Math.floor(Math.max(run.money, 0) / 2);
      break;
    case 'drawCards': {
      const r = run.round!;
      for (let i = 0; i < e.count && r.drawPile.length > 0; i++) {
        const c = r.drawPile.pop()!;
        r.hand.push(c);
        res.changed.push(c.id);
      }
      break;
    }
    case 'extraDiscards':
      run.round!.discardsLeft += e.amount;
      break;
    case 'jokerEdition': {
      const j = rng.pick(`${key}_joker`, run.jokers.filter((x) => !x.edition));
      j.edition = rng.pick(`${key}_edition`, e.editions);
      res.joker = j.defId;
      changeHandSize(run, e.handSizeDelta);
      break;
    }
    case 'jokerDuplicate': {
      const j = rng.pick(`${key}_joker`, copyableJokers(run));
      res.joker = j.defId;
      if (runChance(run, e.num, e.den, `${key}_chance`)) {
        const copy = addJoker(run, j.defId, { buyPrice: j.buyPrice });
        if (copy) copy.vars = { ...j.vars };
      } else {
        run.jokers = run.jokers.filter((x) => x.uid !== j.uid);
        res.destroyedJokers = 1;
      }
      break;
    }
    case 'handSizeUp':
      destroy(randomCards(run, def, [], e.destroy));
      changeHandSize(run, e.delta);
      break;
    case 'slotUp':
      run.consumableSlots += e.slots;
      changeHandSize(run, e.handSizeDelta);
      break;
    case 'tradeHandForDiscard':
      run.hands += e.hands;
      run.discards = Math.max(0, run.discards + e.discards);
      if (run.round) {
        run.round.handsLeft += e.hands;
        run.round.discardsLeft = Math.max(0, run.round.discardsLeft + e.discards);
      }
      break;
    case 'jokerUpgrade': {
      const old = rng.pick(`${key}_joker`, upgradableJokers(run));
      const rarity = JOKER_UPGRADE_CHAIN[JOKER_UPGRADE_CHAIN.indexOf(getJoker(old.defId)!.rarity) + 1];
      const next = rollJoker(run, rng, `${key}_joker_new`, new Set(), rarity);
      if (next) {
        // an derselben Stelle, mit der Edition des alten Jokers (ohne Slot Prüfung, die Zahl ändert sich nicht)
        const at = run.jokers.indexOf(old);
        run.jokers[at] = { uid: run.nextUid++, defId: next.id, vars: { ...(next.init?.(next.config) ?? {}) }, ...(old.edition ? { edition: old.edition } : {}), buyPrice: next.cost };
        res.joker = next.id;
        run.handLevels = levelUpAll(run.handLevels, -e.levelLoss);
      }
      break;
    }
    case 'monoSuit': {
      const suit = rng.pick(`${key}_suit`, SUITS);
      destroy(randomCards(run, def, [], e.destroy));
      for (const c of poolCards(run)) {
        modifyCard(run, c.id, (x) => { x.suit = suit; });
        res.changed.push(c.id);
      }
      break;
    }
  }
  return res;
}

/** Benutzt ein Consumable aus dem Slot. null, wenn nicht benutzbar. */
export function useConsumable(run: RunState, uid: number, targetIds: number[] = []): UseResult | null {
  const idx = run.consumables.findIndex((c) => c.uid === uid);
  if (idx < 0) return null;
  const defId = run.consumables[idx].defId;
  if (!canUseConsumable(run, defId, targetIds, 'slot')) return null;
  run.consumables.splice(idx, 1);
  return applyConsumable(run, defId, targetIds);
}

/** Wendet ein Consumable an, das keinen Slot belegt (Pack Wahl, Kauf und Benutzen). */
export function useDirect(run: RunState, defId: string, targetIds: number[] = []): UseResult | null {
  if (!canUseConsumable(run, defId, targetIds, 'direct')) return null;
  return applyConsumable(run, defId, targetIds);
}

/**
 * Stern Seal: Am Rundenende erzeugt jede gehaltene Karte mit dem Seal das Sternbild der
 * zuletzt gespielten Hand, solange ein Slot frei ist. Aufruf vor dem Abschluss der Runde.
 */
export function createStarSealConsumables(run: RunState): string[] {
  const r = run.round;
  const last = r?.playedTypes[r.playedTypes.length - 1];
  if (!r || !last) return [];
  const def = sternbildFor(last);
  if (!def) return [];
  const created: string[] = [];
  for (const card of r.hand) {
    if (card.seal !== 'stern' || isCardDebuffed(run, card)) continue;
    if (addConsumable(run, def.id, def.cost)) created.push(def.id);
  }
  return created;
}
