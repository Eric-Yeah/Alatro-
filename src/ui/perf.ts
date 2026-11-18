// Bildraten Messung für die FPS Anzeige. Reine Rechnung ohne Pixi, damit sie testbar bleibt.

export class FpsMeter {
  private frames = 0;
  private elapsed = 0;
  private worst = 0;
  /** Zuletzt berechnete Bildrate, 0 vor dem ersten Messfenster */
  fps = 0;
  /** Längste Frame Zeit im letzten Fenster in ms */
  worstMs = 0;

  constructor(private windowMs: number) {}

  /** Meldet einen Frame. Gibt true zurück, wenn ein Messfenster abgeschlossen wurde. */
  tick(deltaMS: number): boolean {
    this.frames++;
    this.elapsed += deltaMS;
    this.worst = Math.max(this.worst, deltaMS);
    if (this.elapsed < this.windowMs) return false;
    this.fps = Math.round((this.frames * 1000) / this.elapsed);
    this.worstMs = Math.round(this.worst);
    this.frames = 0;
    this.elapsed = 0;
    this.worst = 0;
    return true;
  }

  text(): string {
    return `${this.fps} FPS (max. ${this.worstMs} ms)`;
  }
}
