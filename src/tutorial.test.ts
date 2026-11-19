import './core/index';
import { describe, expect, it } from 'vitest';
import { afterHand, buyCard, cashOut, discardHand, leaveShop, playHand } from './core/game';
import { TutorialFlow } from './core/tutorialFlow';
import { cardKey, createTutorialRun, rigTutorialShop, startTutorialRound } from './core/tutorialRun';
import { GUIDE_STEPS } from './data/guide';
import { TUTORIAL_JOKER, TUTORIAL_PICKS } from './data/tutorialRun';
import type { RunState } from './core/run';

const ids = (run: RunState, keys: readonly string[]) => keys.map((k) => run.round!.hand.find((c) => cardKey(c) === k)!.id);

describe('Einführungsrunde: Szenario', () => {
  it('führt mit den vorbereiteten Karten sicher durch beide Blinds', () => {
    const run = createTutorialRun();
    startTutorialRound(run, 0);
    const r = run.round!;
    expect(r.target).toBe(210);
    expect(r.hand.map(cardKey).sort()).toEqual(['KH', 'KS', '4H', '8H', 'JH', '2C', '6D', '9S'].sort());

    // Pair aus zwei Königen
    const pair = playHand(run, ids(run, TUTORIAL_PICKS.pair));
    expect(pair.handType).toBe('pair');
    expect(pair.total).toBe(60);
    afterHand(run);
    expect(run.round!.hand).toHaveLength(8);
    expect(run.round!.hand.map(cardKey)).toEqual(expect.arrayContaining(['10H', '5C']));

    // Discard der drei fremden Karten, danach liegen fünf Herzen auf der Hand
    discardHand(run, ids(run, TUTORIAL_PICKS.discard));
    afterHand(run);
    expect(run.round!.hand.map(cardKey)).toEqual(expect.arrayContaining(['QH', '3C', '7S']));
    const flush = playHand(run, ids(run, TUTORIAL_PICKS.flush));
    expect(flush.handType).toBe('flush');
    expect(flush.total).toBe(308);
    afterHand(run);
    expect(run.phase).toBe('roundWon');

    // Auszahlung, Shop mit vorbereitetem Joker
    cashOut(run);
    rigTutorialShop(run);
    expect(run.phase).toBe('shop');
    expect(run.shop!.cards[0]).toMatchObject({ kind: 'joker', defId: TUTORIAL_JOKER, price: 2 });
    expect(buyCard(run, 0)).toBe(true);
    expect(run.jokers.map((j) => j.defId)).toEqual([TUTORIAL_JOKER]);
    leaveShop(run);
    expect(run.phase).toBe('blindSelect');
    expect(run.blindIndex).toBe(1);
  });

  it('Big Blind mit Full House und Funke gewinnt sofort', () => {
    const run = createTutorialRun();
    startTutorialRound(run, 0);
    playHand(run, ids(run, TUTORIAL_PICKS.pair));
    afterHand(run);
    discardHand(run, ids(run, TUTORIAL_PICKS.discard));
    afterHand(run);
    playHand(run, ids(run, TUTORIAL_PICKS.flush));
    afterHand(run);
    cashOut(run);
    rigTutorialShop(run);
    buyCard(run, 0);
    leaveShop(run);
    startTutorialRound(run, 1);
    expect(run.round!.target).toBe(315);
    const full = playHand(run, ids(run, TUTORIAL_PICKS.full));
    expect(full.handType).toBe('fullHouse');
    expect(full.total).toBe(720);
    afterHand(run);
    expect(run.phase).toBe('roundWon');
  });
});

describe('Einführungsrunde: Ablauf', () => {
  it('Schritte haben eindeutige Ids und Texte ohne Gedankenstriche', () => {
    expect(new Set(GUIDE_STEPS.map((s) => s.id)).size).toBe(GUIDE_STEPS.length);
    for (const s of GUIDE_STEPS) expect(`${s.title} ${s.text}`).not.toMatch(/[—–]| - /);
    for (const s of GUIDE_STEPS) if (s.wait === 'selection') expect(s.select?.length).toBeGreaterThan(0);
  });

  it('läuft Schritt für Schritt durch alle Ereignisse', () => {
    const f = new TutorialFlow();
    let guard = 0;
    while (!f.finished && guard++ < 200) {
      const s = f.step;
      if (s.wait === 'tap') expect(f.tap()).toBe(true);
      else if (s.wait === 'selection') {
        expect(f.notify('selection', [])).toBe(false);
        expect(f.notify('selection', s.select!.slice(1))).toBe(false);
        expect(f.notify('selection', [...s.select!].reverse())).toBe(true);
      } else {
        expect(f.notify('tap')).toBe(false);
        expect(f.notify(s.wait)).toBe(true);
      }
    }
    expect(f.finished).toBe(true);
    expect(f.tap()).toBe(false);
  });

  it('erlaubt Karten, Spielen und Abwerfen nur im passenden Schritt', () => {
    const f = new TutorialFlow();
    expect(f.allowCard('KH', false)).toBe(false);
    while (f.step.id !== 'pickPair') (f.step.wait === 'tap' ? f.tap() : f.notify(f.step.wait, f.step.select ?? []));
    expect(f.allowCard('KH', false)).toBe(true);
    expect(f.allowCard('2C', false)).toBe(false);
    expect(f.allowCard('2C', true)).toBe(true);
    expect(f.allowPlay(['KH', 'KS'])).toBe(false);
    f.notify('selection', ['KH', 'KS']);
    f.tap();
    expect(f.step.id).toBe('playPair');
    expect(f.allowPlay(['KH', 'KS'])).toBe(true);
    expect(f.allowPlay(['KH'])).toBe(false);
    expect(f.allowDiscard(['KH', 'KS'])).toBe(false);
  });
});
