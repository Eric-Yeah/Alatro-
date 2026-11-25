import { Container, Graphics } from 'pixi.js';
import { METER } from '../data/depth';
import { TRANSITION as T } from '../data/transition';
import { CARD_H, cardBack } from './CardView';
import { cardFront } from './TitleCards';
import { C, VIEW_H, VIEW_W } from './theme';
import { drawMeter, drawMeterFill } from './depth';
import { easeInOutCubic, easeOutBack, easeOutCubic, tween, wait } from './tween';

/** Einfacher, wiederholbarer Zufall, damit die Sterne bei jedem Start gleich stehen */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Nachtblauer Grund mit Sternen und einem weichen Schein hinter der Karte */
function buildDim(): Graphics {
  const g = new Graphics();
  g.rect(-T.margin, -T.margin, VIEW_W + T.margin * 2, VIEW_H + T.margin * 2).fill(T.body);
  const rnd = lcg(11);
  for (let i = 0; i < T.stars; i++) {
    const r = 1 + rnd() * 2;
    g.circle(rnd() * VIEW_W, rnd() * VIEW_H, r).fill({ color: 0xffffff, alpha: 0.2 + rnd() * 0.5 });
  }
  for (let i = 0; i < T.haloSteps; i++) {
    g.circle(VIEW_W / 2, T.cardY, T.haloR * (1 - i / T.haloSteps)).fill({ color: T.halo, alpha: T.haloStepAlpha });
  }
  return g;
}

/**
 * Übergang zwischen den großen Screens: der Bildschirm blendet ins Nachtblau, eine Karte fällt in die
 * Mitte und lädt, dahinter wird der Screen getauscht, dann dreht sich die Karte um und die Blende löst
 * sich auf. Fängt während der Animation alle Berührungen ab.
 */
export class ScreenTransition {
  readonly root = new Container();
  private dim = buildDim();
  private hold = new Container();
  private back = cardBack();
  private front = cardFront(T.faceChar, T.faceSuit);
  private bar = new Container();
  private fill = new Graphics();
  private blocker = new Graphics();
  private running = false;

  constructor() {
    this.blocker.rect(-T.margin, -T.margin, VIEW_W + T.margin * 2, VIEW_H + T.margin * 2).fill({ color: 0x000000, alpha: 0.001 });
    this.blocker.eventMode = 'static';
    // Ladebalken: vertiefte Rinne, goldene Füllung wächst von links
    const track = new Graphics();
    drawMeter(track, -T.barW / 2, 0, T.barW, T.barH, 0, C.money);
    drawMeterFill(this.fill, 0, 0, T.barW - 2 * METER.pad, T.barH - 2 * METER.pad, C.money);
    this.fill.position.set(-T.barW / 2 + METER.pad, METER.pad);
    this.bar.addChild(track, this.fill);
    this.bar.position.set(VIEW_W / 2, T.cardY + CARD_H / 2 + T.barGap);
    this.hold.position.set(VIEW_W / 2, T.cardY);
    this.hold.addChild(this.back, this.front);
    this.root.addChild(this.blocker, this.dim, this.bar, this.hold);
    this.reset();
    this.root.visible = false;
  }

  /** läuft gerade eine Blende (dann sind Berührungen gesperrt) */
  get active(): boolean {
    return this.running;
  }

  /** Grundstellung: Grund durchsichtig, Karte oben und klein, Rücken zu sehen, Balken leer */
  private reset() {
    this.root.alpha = 1;
    this.dim.alpha = 0;
    this.hold.alpha = 0;
    this.hold.y = T.cardY + T.cardDropY;
    this.hold.scale.set(T.cardStartScale);
    this.hold.rotation = -T.sway;
    this.back.scale.x = 1;
    this.front.scale.x = 0;
    this.bar.alpha = 0;
    this.fill.scale.x = 0;
  }

  /** Karte steht in der Mitte (für den Start der App) */
  private placeCard() {
    this.dim.alpha = 1;
    this.hold.alpha = 1;
    this.hold.y = T.cardY;
    this.hold.scale.set(1);
    this.bar.alpha = 1;
  }

  /** Ladebalken füllt sich, die Karte wiegt sich dabei einmal hin und her */
  private load(ms: number): Promise<void> {
    this.hold.rotation = -T.sway;
    void tween(this.hold, { rotation: T.sway }, ms, easeInOutCubic);
    return tween(this.fill, { 'scale.x': 1 }, ms, easeInOutCubic);
  }

  /** Karte dreht sich um, der Balken blendet aus */
  private async reveal() {
    void tween(this.bar, { alpha: 0 }, T.flipMs * 2);
    void tween(this.hold, { rotation: 0 }, T.flipMs * 2);
    await tween(this.back, { 'scale.x': 0 }, T.flipMs, easeInOutCubic);
    await tween(this.front, { 'scale.x': 1 }, T.flipMs, easeOutCubic);
    await wait(T.revealMs);
  }

  private async dissolve(ms: number) {
    await tween(this.root, { alpha: 0 }, ms, easeInOutCubic);
    this.root.visible = false;
    this.reset();
    this.running = false;
  }

  /**
   * Blendet ein, ruft `swap` auf (der Screen dahinter wird getauscht) und blendet wieder aus.
   * Tut nichts, wenn schon eine Blende läuft.
   */
  async run(swap: () => void): Promise<boolean> {
    if (this.running) return false;
    this.running = true;
    this.reset();
    this.root.visible = true;
    await tween(this.dim, { alpha: 1 }, T.fadeInMs, easeOutCubic);
    await Promise.all([
      tween(this.hold, { alpha: 1, y: T.cardY, 'scale.x': 1, 'scale.y': 1 }, T.cardInMs, easeOutBack),
      tween(this.bar, { alpha: 1 }, T.cardInMs),
    ]);
    try {
      swap();
    } finally {
      await this.load(T.loadMs);
      await this.reveal();
      await this.dissolve(T.fadeOutMs);
    }
    return true;
  }

  /** Bei geschlossener Blende starten (vor dem ersten Frame), damit der Home Bildschirm nicht aufblitzt */
  cover() {
    this.running = true;
    this.root.visible = true;
    this.placeCard();
  }

  /** Beim Start der App: die Karte steht schon, lädt und dreht sich um. */
  async intro(): Promise<void> {
    this.running = true;
    this.root.visible = true;
    this.placeCard();
    await wait(T.introHoldMs);
    await this.load(T.introLoadMs);
    await this.reveal();
    await this.dissolve(T.introFadeOutMs);
  }
}
