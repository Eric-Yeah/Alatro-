import { HAPTICS } from '../data/juice';
import { getSettings } from '../settings';
import { impactMs, totalPattern } from './juiceMath';

// Vibration als Rückmeldung zu Berührungen und Punkten.
// Android (Chrome, Firefox): navigator.vibrate. iPhone: Safari kennt vibrate nicht, ein
// Schalter (input switch, ab iOS 17.4) löst beim Umschalten ein Tippen aus. Das klappt nur
// im Rahmen einer Berührung, daher ist es dort ein Näherungsverfahren und liefert nur
// Tippen, keine Muster. Das iPad hat keinen Taptic Motor, dort passiert nichts.

type Pattern = number | readonly number[];

class Haptics {
  private switchLabel: HTMLLabelElement | null = null;

  /** Kann das Gerät vibrieren (oder bietet es das iOS Tippen an)? */
  get supported(): boolean {
    if (typeof navigator === 'undefined') return false;
    return typeof navigator.vibrate === 'function' || this.iosTapAvailable();
  }

  private iosTapAvailable(): boolean {
    // Der Schalter wirkt nur auf iPhones, nicht auf dem iPad (kein Taptic Motor)
    return typeof navigator !== 'undefined' && typeof document !== 'undefined' && /iPhone/.test(navigator.userAgent) && typeof (navigator as any).vibrate !== 'function';
  }

  private get on(): boolean {
    return getSettings().haptics;
  }

  /** Spielt ein Muster. Fehler (gesperrt, kein Nutzerkontakt) werden verschluckt. */
  play(pattern: Pattern) {
    if (!this.on) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]);
      } else if (this.iosTapAvailable()) {
        this.iosTap();
      }
    } catch {
      /* nicht verfügbar */
    }
  }

  private iosTap() {
    if (!this.switchLabel) {
      const label = document.createElement('label');
      label.setAttribute('aria-hidden', 'true');
      label.style.cssText = 'position:fixed;left:-100px;top:-100px;opacity:0;pointer-events:none';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      label.appendChild(input);
      document.body.appendChild(label);
      this.switchLabel = label;
    }
    this.switchLabel.click();
  }

  /** Vibration abbrechen, z. B. beim Ausschalten der Option. */
  stop() {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(0);
    } catch {
      /* nicht verfügbar */
    }
  }

  // ───────────────────────────────────────────── Oberfläche
  tap() { this.play(HAPTICS.tap); }
  select(on: boolean) { this.play(on ? HAPTICS.select : HAPTICS.deselect); }
  deny() { this.play(HAPTICS.deny); }

  // ───────────────────────────────────────────── Punkte zählen
  step() { this.play(HAPTICS.step); }
  money() { this.play(HAPTICS.money); }
  /** Aufprall passend zur Shake Stärke (X Mult, Omen, Niederlage) */
  impact(shake: number) { this.play(impactMs(shake)); }
  /** Aufschlag der Gesamtpunkte */
  total(boom: number) { this.play(totalPattern(boom)); }

  // ───────────────────────────────────────────── Spielfluss
  /** Ziel des Blinds beim Hochzählen erreicht */
  goal() { this.play(HAPTICS.goal); }
  win() { this.play(HAPTICS.win); }
  lose() { this.play(HAPTICS.lose); }
  victory() { this.play(HAPTICS.victory); }
  achievement() { this.play(HAPTICS.achievement); }
  blindStart(kind: 'small' | 'big' | 'boss') { this.play(HAPTICS.blind[kind]); }

  // ───────────────────────────────────────────── Shop und Consumables
  buy() { this.play(HAPTICS.buy); }
  sell() { this.play(HAPTICS.sell); }
  reroll() { this.play(HAPTICS.reroll); }
  packOpen() { this.play(HAPTICS.packOpen); }
  pick() { this.play(HAPTICS.pick); }
  consumable(type: 'sternbild' | 'elixir' | 'omen') { this.play(HAPTICS.consumable[type]); }
}

export const haptics = new Haptics();
