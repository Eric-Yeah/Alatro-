/**
 * Zufällige Inhalte: Joker, Editions, Spielkarten, Consumables. Alle Würfe laufen über
 * RngStreams (ein Strom pro Key), damit sich Quellen nicht gegenseitig beeinflussen.
 */
import { RANKS, SUITS } from '../data/cards';
import { CONSUMABLES, type ConsumableDef, type ConsumableType } from '../data/consumables';
import { HAND_DATA } from '../data/hands';
import { ENHANCEMENTS, SEALS } from '../data/modifiers';
import { PLAYING_CARD_ROLLS } from '../data/packs';
import { JOKER_EDITION_ROLL } from '../data/shop';
import { allJokers, type JokerDef } from './jokers';
import type { RngStreams } from './rng';
import type { RunState } from './run';
import { rollRarity } from './shop';
import type { Card, HandType } from './types';

export function rollJokerEdition(run: RunState, rng: RngStreams, key: string): string | undefined {
  const r = rng.next(key);
  const rate = run.rules.editionRate;
  if (r > 1 - JOKER_EDITION_ROLL.schatten) return 'schatten';
  if (r > 1 - JOKER_EDITION_ROLL.prisma * rate) return 'prisma';
  if (r > 1 - JOKER_EDITION_ROLL.aura * rate) return 'aura';
  if (r > 1 - JOKER_EDITION_ROLL.schimmer * rate) return 'schimmer';
  return undefined;
}

/** Zieht einen Joker: Rarity Wurf, keine Duplikate, Resample auf alle freien Jokers. */
export function rollJoker(run: RunState, rng: RngStreams, keyBase: string, exclude: Set<string>, rarity?: JokerDef['rarity']): JokerDef | null {
  const owned = new Set(run.jokers.map((j) => j.defId));
  // Legendary erscheint nie zufällig, nur wenn ausdrücklich verlangt (Omen). minAnte ist die Spawn Bedingung
  const free = allJokers().filter((j) => !owned.has(j.id) && !exclude.has(j.id) && (j.rarity !== 'legendary' || rarity === 'legendary') && (j.minAnte ?? 1) <= run.ante);
  if (!free.length) return null;
  const want = rarity ?? rollRarity(rng, `${keyBase}_rarity`);
  const pool = free.filter((j) => j.rarity === want);
  return rng.pick(`${keyBase}_pick`, pool.length ? pool : free);
}

/** Zieht eine Spielkarte. plain = ohne Enhancement, Seal und Edition. */
export function rollPlayingCard(run: RunState, rng: RngStreams, key: string, plain = false): Card {
  const card: Card = { id: run.nextCardId++, rank: rng.pick(`${key}_rank`, RANKS), suit: rng.pick(`${key}_suit`, SUITS) };
  if (plain) return card;
  if (rng.next(`${key}_enh`) < PLAYING_CARD_ROLLS.enhancementChance) card.enhancement = rng.pick(`${key}_enh_pick`, Object.keys(ENHANCEMENTS));
  if (rng.next(`${key}_seal`) < PLAYING_CARD_ROLLS.sealChance) card.seal = rng.pick(`${key}_seal_pick`, Object.keys(SEALS));
  const r = rng.next(`${key}_ed`);
  let acc = 0;
  for (const e of PLAYING_CARD_ROLLS.editions) {
    acc += e.chance * run.rules.editionRate;
    if (r < acc) { card.edition = e.id; break; }
  }
  return card;
}

/** Eine Spielkarte mit garantiertem Enhancement (für Omen Effekte) */
export function rollEnhancedCard(run: RunState, rng: RngStreams, key: string): Card {
  const card = rollPlayingCard(run, rng, key, true);
  card.enhancement = rng.pick(`${key}_enh_pick`, Object.keys(ENHANCEMENTS));
  return card;
}

/**
 * Zieht ein Consumable eines Typs. Sternbilder geheimer Hände erscheinen erst, nachdem die
 * Hand gespielt wurde (Briefing 2.2). Leerer Pool ergibt null.
 */
export function rollConsumable(run: RunState, rng: RngStreams, type: ConsumableType, key: string, exclude: Set<string> = new Set()): ConsumableDef | null {
  const pool = CONSUMABLES.filter((c) => {
    if (c.type !== type || exclude.has(c.id)) return false;
    if (c.effect.kind === 'levelHand') return !isSecretUnplayed(run, c.effect.hand);
    return true;
  });
  return pool.length ? rng.pick(key, pool) : null;
}

/** Geheime Hand, die noch nie gespielt wurde */
export function isSecretUnplayed(run: RunState, hand: HandType): boolean {
  return HAND_DATA[hand].secret && (run.handsPlayed[hand] ?? 0) === 0;
}
