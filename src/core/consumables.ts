/**
 * Consumables im Spiel: Slots, Verkauf, Benutzen. Die Effekte sind in data/consumables.ts
 * deklariert, hier werden sie angewendet. Karten Ziele stammen aus der Hand der Runde oder
 * aus der Hand eines Elixier oder Omen Packs.
 */
import { CONSUMABLE_BY_ID, CONSUMABLES, MIN_HAND_SIZE, OMEN_EDITIONS, type ConsumableDef, type ConsumableType } from '../data/consumables';
import { SEALS } from '../data/modifiers';
import { rollConsumable, rollEnhancedCard, rollJoker } from './generate';
import { levelUp, levelUpAll } from './hands';
import { addJoker, isCardDebuffed, jokerCapacity, jokerPassive, modifyCardById as modifyCard, rngOf, type ConsumableInstance, type RunState } from './run';
import { sellValue } from './shop';
import type { Card, HandType, Rank } from './types';

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
  return !!def.targets || k === 'sacrificeForCards' || k === 'destroyAndLevelAll';
}

/** Zufällige Karten aus dem Pool ohne die Ziele */
function randomCards(run: RunState, def: ConsumableDef, exclude: number[], n: number): Card[] {
  const pool = poolCards(run).filter((c) => !exclude.includes(c.id));
  return rngOf(run).shuffle(`cons_${def.id}_a${run.ante}_pick`, [...pool]).slice(0, n);
}

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
      }
      run.money = Math.min(run.money, 0);
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
