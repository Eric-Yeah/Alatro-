import { Container, Graphics, Ticker } from 'pixi.js';
import { SHAKE_MS } from '../data/juice';
import { getSettings } from '../settings';
import { VIEW_H, VIEW_W } from './theme';
import { tween } from './tween';

/** Screen Shake (über den Pivot der Wurzel) und Vollbild Flash. */
export class StageFx {
  private shakeAmp = 0;
  private shakeLeft = 0;
  private readonly flashGfx = new Graphics();

  constructor(private root: Container, flashLayer: Container) {
    this.flashGfx.rect(-600, -600, VIEW_W + 1200, VIEW_H + 1200).fill(0xffffff);
    this.flashGfx.alpha = 0;
    this.flashGfx.eventMode = 'none';
    flashLayer.addChild(this.flashGfx);
    Ticker.shared.add((t) => this.update(t.deltaMS));
  }

  /** amp in logischen Pixeln, größere Werte überschreiben kleinere laufende Shakes */
  shake(amp: number) {
    if (!getSettings().shake || amp <= 0) return;
    if (amp >= this.shakeAmp * (this.shakeLeft / SHAKE_MS)) {
      this.shakeAmp = amp;
      this.shakeLeft = SHAKE_MS;
    }
  }

  flash(alpha: number, color = 0xffffff) {
    if (!getSettings().shake || alpha <= 0) return;
    this.flashGfx.tint = color;
    this.flashGfx.alpha = Math.max(this.flashGfx.alpha, alpha);
    void tween(this.flashGfx, { alpha: 0 }, 380);
  }

  private update(deltaMS: number) {
    if (this.shakeLeft <= 0) {
      if (this.root.pivot.x !== 0 || this.root.pivot.y !== 0) this.root.pivot.set(0, 0);
      return;
    }
    this.shakeLeft = Math.max(0, this.shakeLeft - deltaMS);
    const k = this.shakeLeft / SHAKE_MS;
    const a = this.shakeAmp * k * k;
    this.root.pivot.set((Math.random() * 2 - 1) * a, (Math.random() * 2 - 1) * a);
  }
}
