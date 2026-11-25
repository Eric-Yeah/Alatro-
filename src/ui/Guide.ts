import { Container, Graphics } from 'pixi.js';
import { SHADOW } from '../data/depth';
import type { GuideStep } from '../data/guide';
import { GUIDE_LOOK, WINDOW } from '../data/tableSurface';
import { t } from '../i18n';
import { CARD_H, CARD_W, CardView } from './CardView';
import { drawInset, raised } from './depth';
import { C, VIEW_H } from './theme';
import { easeOutBack, tween } from './tween';
import { Button, label, wrapText } from './widgets';

/** Maße und Lage des Hinweisfelds der Einführung */
const GUIDE = {
  w: 760,
  highY: 18,
  topY: 222,
  bottomY: 752,
  centerX: 850,
  pad: 22,
  ringPad: 10,
  ringWidth: 5,
  textSize: 21,
  badge: 34,
};

interface Rect { x: number; y: number; w: number; h: number }

/**
 * Hinweisfeld der Einführungsrunde: Sprechfeld von Astra, Zeiger (leuchtender Rahmen) um das Ziel
 * und ein Knopf zum Beenden. Die Ziele werden jedes Bild neu gesucht, damit der Rahmen mitwandert.
 */
export class Guide {
  readonly root = new Container();
  private ring = new Graphics();
  private box: Container | null = null;
  private targets: () => Container[] = () => [];
  private union = false;
  private pulse = 0;
  private lastKey = '';

  constructor(private onSkip: () => void) {
    this.root.eventMode = 'passive';
    this.ring.eventMode = 'none';
    this.root.addChild(this.ring);
    this.root.visible = false;
  }

  /** Aktualisiert den Rahmen um die Ziele, wird vom Ticker jeden Frame gerufen */
  update(deltaMS: number) {
    if (!this.root.visible) return;
    this.pulse += deltaMS / 1000;
    const list = this.targets().filter((t) => t && !t.destroyed && t.visible);
    this.ring.clear();
    const a = 0.65 + 0.35 * Math.sin(this.pulse * 5);
    let rects = list.map((t) => this.rectOf(t)).filter((r): r is Rect => !!r);
    if (this.union && rects.length > 1) {
      const x0 = Math.min(...rects.map((r) => r.x));
      const y0 = Math.min(...rects.map((r) => r.y));
      const x1 = Math.max(...rects.map((r) => r.x + r.w));
      const y1 = Math.max(...rects.map((r) => r.y + r.h));
      rects = [{ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
    }
    for (const r of rects) {
      const p = GUIDE.ringPad;
      // weicher Schein außen, dunkle Kante, leuchtender goldener Rahmen
      this.ring
        .roundRect(r.x - p, r.y - p, r.w + p * 2, r.h + p * 2, 14).stroke({ width: GUIDE_LOOK.glowWidth, color: C.money, alpha: GUIDE_LOOK.glowAlpha * a })
        .roundRect(r.x - p, r.y - p, r.w + p * 2, r.h + p * 2, 12).stroke({ width: GUIDE.ringWidth + 3, color: 0x070b11, alpha: 0.8 * a })
        .roundRect(r.x - p, r.y - p, r.w + p * 2, r.h + p * 2, 12).stroke({ width: GUIDE.ringWidth, color: C.money, alpha: a });
    }
  }

  /** Rechteck eines Objekts in den Koordinaten dieses Containers (auch bei gedrehtem Spielfeld) */
  private rectOf(t: Container): Rect | null {
    // Karten tragen einen weichen Schatten, der die Grenzen aufbläht: der Zeiger soll die Karte selbst umrahmen
    if (t instanceof CardView) {
      const pts = [[-CARD_W / 2, -CARD_H / 2], [CARD_W / 2, -CARD_H / 2], [CARD_W / 2, CARD_H / 2], [-CARD_W / 2, CARD_H / 2]]
        .map(([x, y]) => this.root.toLocal(t.toGlobal({ x, y })));
      const xs = pts.map((q) => q.x);
      const ys = pts.map((q) => q.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    const b = t.getBounds();
    if (!Number.isFinite(b.x) || b.width === 0) return null;
    const a = this.root.toLocal({ x: b.x, y: b.y });
    const c = this.root.toLocal({ x: b.x + b.width, y: b.y + b.height });
    return { x: Math.min(a.x, c.x), y: Math.min(a.y, c.y), w: Math.abs(c.x - a.x), h: Math.abs(c.y - a.y) };
  }

  hide() {
    this.root.visible = false;
    this.ring.clear();
    this.box?.destroy({ children: true });
    this.box = null;
    this.lastKey = '';
  }

  /** Zeigt einen Schritt. Gleicher Schritt und gleicher Zustand bauen das Feld nicht neu. */
  show(step: GuideStep, opts: { targets: () => Container[]; progress: string; onNext: (() => void) | null; union?: boolean }) {
    const key = `${step.id}|${opts.onNext ? 1 : 0}`;
    this.targets = opts.targets;
    this.union = !!opts.union;
    this.root.visible = true;
    if (key === this.lastKey && this.box) return;
    this.lastKey = key;
    this.box?.destroy({ children: true });

    const { w, pad } = GUIDE;
    const title = label(step.title, 26, C.money);
    title.anchor.set(0, 0.5);
    const body = wrapText(step.text, w - pad * 2 - GUIDE.badge - 14, GUIDE.textSize, C.text, 'left');
    const left = pad + GUIDE.badge * 2 + 14;
    const bodyW = w - left - pad;
    body.style.wordWrapWidth = bodyW;
    const headH = 34;
    const rowH = 58;
    const h = pad + headH + 10 + body.height + 18 + rowH + 16;
    const box = new Container();
    box.addChild(raised(w, h, C.panelDark, { radius: 18, alpha: WINDOW.alpha, rim: true, shadow: SHADOW.plate }));
    // Abzeichen: goldener Kreis mit Stern in einer Fassung, wie ein Stern am Observatorium
    const badge = new Graphics()
      .circle(0, 2, GUIDE.badge + 2).fill({ color: 0xffffff, alpha: 0.14 })
      .circle(0, 0, GUIDE.badge + 2).fill(C.panelLine)
      .circle(0, 0, GUIDE.badge).fill(0x33275a).stroke({ width: 4, color: C.money })
      .star(0, 0, 5, GUIDE.badge * 0.62, GUIDE.badge * 0.28).fill(C.money);
    badge.position.set(pad + GUIDE.badge, pad + GUIDE.badge);
    const name = label('Astra', 16, C.textDim);
    name.position.set(pad + GUIDE.badge, pad + GUIDE.badge * 2 + 14);
    title.position.set(left, pad + headH / 2);
    body.position.set(left, pad + headH + 10);
    const prog = label(opts.progress, 15, C.textDim, { fontWeight: '600' });
    prog.anchor.set(1, 0.5);
    prog.position.set(w - pad - 14, pad + headH / 2);
    // Fortschritt in einer kleinen vertieften Plakette
    const pillW = prog.width + 28;
    // lange Titel (englisch) schrumpfen, statt unter die Plakette zu laufen
    const titleMax = w - left - pad - pillW - 12;
    if (title.width > titleMax) title.scale.set(titleMax / title.width);
    const pill = drawInset(new Graphics(), w - pad - pillW, pad + headH / 2 - 15, pillW, 30, 0x1b2a3f, { radius: 15, outline: 2 });
    box.addChild(badge, name, title, pill, prog, body);
    if (opts.onNext) {
      const next = new Button(t('Weiter'), 220, rowH, C.chips, opts.onNext, 28);
      next.position.set(w - pad - 110, h - 16 - rowH / 2);
      box.addChild(next);
    }
    const skip = new Button(t('Einführung beenden'), 230, 44, 0x4a3f6b, this.onSkip, 17);
    skip.position.set(pad + 115, h - 16 - rowH / 2);
    box.addChild(skip);
    box.pivot.set(w / 2, 0);
    const y = step.dock === 'high' ? GUIDE.highY : step.dock === 'top' ? GUIDE.topY : GUIDE.bottomY;
    box.position.set(GUIDE.centerX, Math.min(y, VIEW_H - h - 12));
    box.alpha = 0;
    box.scale.set(0.94);
    tween(box, { alpha: 1, 'scale.x': 1, 'scale.y': 1 }, 220, easeOutBack);
    this.root.addChild(box);
    this.box = box;
  }

  get active(): boolean {
    return this.root.visible;
  }
}

