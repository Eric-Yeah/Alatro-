import { Container, Graphics, Ticker } from 'pixi.js';
import { SHAKE_MS } from '../data/juice';
import { PUNCH } from '../data/spektakel';
import { getSettings } from '../settings';
import { VIEW_H, VIEW_W } from './theme';
import { tween } from './tween';

/** Screen Shake (über den Pivot der Wurzel) und Vollbild Flash. */
export class StageFx {
  private shakeAmp = 0;
  private shakeLeft = 0;
  private readonly flashGfx = new Graphics();

  private punchAmp = 0;
  private punchLeft = 0;

  /** `world` ist der Behälter des Spielfelds, der für den Zoom Stoß um die Mitte skaliert wird (Grafikstufe Supernova) */
  constructor(private root: Container, flashLayer: Container, private world: Container | null = null) {
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

  /** Kurzer Zoom Stoß (Anteil der Größe), klingt ab. Wie Shake nur mit eingeschaltetem Screen Shake. */
  punch(amount: number) {
    if (!this.world || !getSettings().shake || amount <= 0) return;
    if (amount >= this.punchAmp * (this.punchLeft / PUNCH.ms)) {
      this.punchAmp = amount;
      this.punchLeft = PUNCH.ms;
    }
  }

  flash(alpha: number, color = 0xffffff) {
    if (!getSettings().shake || alpha <= 0) return;
    this.flashGfx.tint = color;
    this.flashGfx.alpha = Math.max(this.flashGfx.alpha, alpha);
    void tween(this.flashGfx, { alpha: 0 }, 380);
  }

  private update(deltaMS: number) {
    if (this.world && (this.punchLeft > 0 || this.world.scale.x !== 1)) {
      this.punchLeft = Math.max(0, this.punchLeft - deltaMS);
      const k = this.punchLeft / PUNCH.ms;
      // schneller Anstieg, weiches Abklingen
      this.world.scale.set(1 + this.punchAmp * k * k * (3 - 2 * k) * (k > 0.85 ? (1 - k) / 0.15 : 1));
    }
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
