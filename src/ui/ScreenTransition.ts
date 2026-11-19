import { Container, Graphics } from 'pixi.js';
import { TRANSITION as T } from '../data/transition';
import { VIEW_H, VIEW_W } from './theme';
import { easeInOutCubic, tween, wait } from './tween';

/** Wie weit eine Hälfte vom Schluss bis zur offenen Stellung wandert (logische Pixel) */
const TRAVEL = VIEW_W / 2 + T.margin;
/** Breite einer Hälfte, reicht bis über den Rand des sichtbaren Bereichs */
const HALF_W = VIEW_W / 2 + T.margin;

/** Einfacher, wiederholbarer Zufall, damit die Sterne bei jedem Start gleich stehen */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Baut eine Kuppelhälfte. Die Naht liegt bei x = 0, die Fläche reicht nach links (die rechte Hälfte wird gespiegelt). */
function buildHalf(): Graphics {
  const g = new Graphics();
  const top = -T.margin;
  const h = VIEW_H + T.margin * 2;
  g.rect(-HALF_W, top, HALF_W, h).fill(T.body);
  // Rippen wie die Segmente einer Kuppel
  for (let x = -T.ribGap; x > -HALF_W; x -= T.ribGap) g.rect(x - 1, top, 2, h).fill({ color: T.rib });
  // Sterne
  const rnd = lcg(7);
  for (let i = 0; i < T.stars; i++) {
    const x = -rnd() * (VIEW_W / 2 + 200) - 14;
    const y = rnd() * VIEW_H;
    const r = 1 + rnd() * 2;
    g.circle(x, y, r).fill({ color: 0xffffff, alpha: 0.25 + rnd() * 0.5 });
  }
  // Leuchten an der Naht
  g.rect(-T.glowW, top, T.glowW, h).fill({ color: T.glow, alpha: T.glowAlpha });
  g.rect(-T.seamW, top, T.seamW, h).fill(T.seam);
  // Ring mit Strichen, beide Hälften ergeben zusammen einen vollen Kreis
  const cy = VIEW_H / 2;
  g.arc(0, cy, T.ringR, Math.PI / 2, Math.PI * 1.5).stroke({ color: T.seam, width: 4 });
  g.arc(0, cy, T.ringInnerR, Math.PI / 2, Math.PI * 1.5).stroke({ color: T.glow, width: 2, alpha: 0.7 });
  for (let i = 0; i <= T.ringTicks / 2; i++) {
    const a = Math.PI / 2 + (i / (T.ringTicks / 2)) * Math.PI;
    const c = Math.cos(a), s = Math.sin(a);
    g.moveTo(c * T.ringInnerR, cy + s * T.ringInnerR).lineTo(c * T.ringR, cy + s * T.ringR).stroke({ color: T.seam, width: 3 });
  }
  return g;
}

/**
 * Kuppelblende zwischen den großen Screens: zwei Hälften der Sternwarten Kuppel schließen sich,
 * der Screen dahinter wird getauscht, dann öffnet sich die Kuppel wieder. Fängt während der
 * Animation alle Berührungen ab.
 */
export class ScreenTransition {
  readonly root = new Container();
  private left = buildHalf();
  private right = buildHalf();
  private blocker = new Graphics();
  private running = false;

  constructor() {
    this.blocker.rect(-T.margin, -T.margin, VIEW_W + T.margin * 2, VIEW_H + T.margin * 2).fill({ color: 0x000000, alpha: 0.001 });
    this.blocker.eventMode = 'static';
    this.right.scale.x = -1;
    this.root.addChild(this.blocker, this.left, this.right);
    this.place(1);
    this.root.visible = false;
  }

  /** läuft gerade eine Blende (dann sind Berührungen gesperrt) */
  get active(): boolean {
    return this.running;
  }

  /** 0 = geschlossen, 1 = offen */
  private place(open: number) {
    const c = VIEW_W / 2;
    this.left.x = c - TRAVEL * open;
    this.right.x = c + TRAVEL * open;
  }

  private async slide(from: number, to: number, ms: number) {
    this.place(from);
    const c = VIEW_W / 2;
    await Promise.all([
      tween(this.left, { x: c - TRAVEL * to }, ms, easeInOutCubic),
      tween(this.right, { x: c + TRAVEL * to }, ms, easeInOutCubic),
    ]);
  }

  /**
   * Schließt die Kuppel, ruft `swap` auf (der Screen dahinter wird getauscht) und öffnet sie wieder.
   * Gibt false zurück und tut nichts, wenn schon eine Blende läuft.
   */
  async run(swap: () => void): Promise<boolean> {
    if (this.running) return false;
    this.running = true;
    this.root.visible = true;
    await this.slide(1, 0, T.closeMs);
    try {
      swap();
    } finally {
      await wait(T.holdMs);
      await this.slide(0, 1, T.openMs);
      this.root.visible = false;
      this.running = false;
    }
    return true;
  }

  /** Beim Start der App: die Kuppel ist zu und öffnet sich langsam. */
  async intro(): Promise<void> {
    this.running = true;
    this.root.visible = true;
    this.place(0);
    await wait(T.introHoldMs);
    await this.slide(0, 1, T.introOpenMs);
    this.root.visible = false;
    this.running = false;
  }

  /** Bei geschlossener Kuppel starten (vor dem ersten Frame), damit der Home Bildschirm nicht aufblitzt */
  cover() {
    this.root.visible = true;
    this.place(0);
  }
}
