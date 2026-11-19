/**
 * Ablaufsteuerung der Einführungsrunde (rein, ohne DOM). Die Oberfläche meldet Ereignisse und
 * fragt, welche Eingaben im aktuellen Schritt erlaubt sind.
 */
import { GUIDE_STEPS, type GuideEvent, type GuideStep } from '../data/guide';

export class TutorialFlow {
  index = 0;

  get step(): GuideStep {
    return GUIDE_STEPS[Math.min(this.index, GUIDE_STEPS.length - 1)];
  }

  get finished(): boolean {
    return this.index >= GUIDE_STEPS.length - 1 && this.step.id === 'ende';
  }

  get progress(): { current: number; total: number } {
    return { current: this.index + 1, total: GUIDE_STEPS.length };
  }

  private advance() {
    if (this.index < GUIDE_STEPS.length - 1) this.index++;
  }

  /** Der Spieler tippt auf Weiter. Gibt true zurück, wenn der Schritt dadurch endet. */
  tap(): boolean {
    if (this.step.wait !== 'tap' || this.finished) return false;
    this.advance();
    return true;
  }

  /**
   * Meldung der Oberfläche. Bei `selection` ist keys die aktuelle Auswahl (Kartenschlüssel).
   * Gibt true zurück, wenn der Schritt dadurch endet.
   */
  notify(event: GuideEvent, keys: readonly string[] = []): boolean {
    const s = this.step;
    if (s.wait !== event || event === 'tap') return false;
    if (event === 'selection' && !this.sameSet(keys, s.select ?? [])) return false;
    this.advance();
    return true;
  }

  private sameSet(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && b.every((k) => a.includes(k));
  }

  /** Darf diese Karte (an oder ab) getippt werden? Nur in Auswahlschritten, und nur die vorgesehenen Karten (Abwählen immer). */
  allowCard(key: string, selected: boolean): boolean {
    const s = this.step;
    if (s.wait !== 'selection') return false;
    return selected || (s.select ?? []).includes(key);
  }

  /** Spielen ist im Schritt erlaubt, wenn er auf `played` wartet und genau die richtigen Karten gewählt sind */
  allowPlay(keys: readonly string[]): boolean {
    return this.step.wait === 'played' && this.matchesPrevious(keys);
  }

  allowDiscard(keys: readonly string[]): boolean {
    return this.step.wait === 'discarded' && this.matchesPrevious(keys);
  }

  /** Die Auswahl muss die des vorherigen Auswahlschritts sein */
  private matchesPrevious(keys: readonly string[]): boolean {
    for (let i = this.index - 1; i >= 0; i--) {
      const s = GUIDE_STEPS[i];
      if (s.wait === 'selection') return this.sameSet(keys, s.select ?? []);
    }
    return false;
  }

  /** Erlaubt der Schritt, einen bestimmten Knopf zu nutzen? */
  allowsEvent(event: GuideEvent): boolean {
    return this.step.wait === event;
  }
}
