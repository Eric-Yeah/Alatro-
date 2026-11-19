/**
 * Szenario der Einführungsrunde (rein, ohne DOM): erzeugt den Run und bereitet Runden und Shop so vor,
 * dass die geführten Schritte sicher gelingen. Alle Spielregeln der Engine bleiben unverändert,
 * nur die Reihenfolge der Karten und der Shop Inhalt sind festgelegt.
 */
import {
  TUTORIAL_DECK, TUTORIAL_ROUNDS, TUTORIAL_SEED, TUTORIAL_SHOP, TUTORIAL_TARGET_FACTOR,
} from '../data/tutorialRun';
import { createRun, selectBlind } from './game';
import { rankLabel } from './cards';
import type { RunState } from './run';
import type { Card } from './types';

/** Schlüssel einer Karte, z. B. KH, 10C, AS */
export function cardKey(c: Card): string {
  return `${rankLabel(c.rank)}${c.suit}`;
}

export function createTutorialRun(): RunState {
  const run = createRun({ seed: TUTORIAL_SEED, deckId: TUTORIAL_DECK, stakeId: 'daemmerung' });
  run.rules.blindTargetFactor *= TUTORIAL_TARGET_FACTOR;
  return run;
}

function pickKeys(all: Card[], keys: string[]): Card[] {
  return keys.map((k) => {
    const c = all.find((x) => cardKey(x) === k);
    if (!c) throw new Error(`Tutorial Karte fehlt: ${k}`);
    return c;
  });
}

/** Startet den Blind und legt Hand und Nachziehstapel der Einführung fest (round: Index in TUTORIAL_ROUNDS) */
export function startTutorialRound(run: RunState, round: number): void {
  selectBlind(run);
  const r = run.round!;
  const script = TUTORIAL_ROUNDS[round];
  const all = [...r.hand, ...r.drawPile];
  const hand = pickKeys(all, script.hand);
  const draws = pickKeys(all, script.draws);
  const used = new Set([...hand, ...draws].map((c) => c.id));
  const rest = all.filter((c) => !used.has(c.id));
  r.hand = hand;
  // gezogen wird vom Ende des Stapels: die nächste Karte steht ganz hinten
  r.drawPile = [...rest, ...[...draws].reverse()];
}

/** Ersetzt die Karten Slots des Shops durch die vorbereiteten Jokers */
export function rigTutorialShop(run: RunState): void {
  const shop = run.shop;
  if (!shop) return;
  shop.cards = TUTORIAL_SHOP.map((s) => ({ kind: 'joker' as const, defId: s.defId, price: s.price }));
}
