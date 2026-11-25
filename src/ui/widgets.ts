import { Container, Graphics, Rectangle, Text, type TextStyleOptions } from 'pixi.js';
import { BEVEL, SHADOW } from '../data/depth';
import { sfx } from './audio';
import { haptics } from './haptics';
import { drawPlate, dropShadow, raised } from './depth';
import { lighten } from './depthMath';
import { C, FONT, FONT_BODY, STYLE, VIEW_BLEED, shade } from './theme';
import { easeOutBack, tween } from './tween';

/** Helle Textfarben bekommen einen harten dunklen Schatten (ein Schriftpixel), wie bei Pixel Spielen. Dunkler Text bleibt ohne. */
function hardShadow(color: number, size: number): TextStyleOptions['dropShadow'] {
  const lum = (((color >> 16) & 255) * 0.299 + ((color >> 8) & 255) * 0.587 + (color & 255) * 0.114) / 255;
  if (lum < 0.4) return false;
  return { color: 0x070b11, alpha: 1, blur: 0, angle: Math.PI / 2, distance: Math.max(1, size / 9) };
}

export function label(text: string, size: number, color = C.text, extra: Partial<TextStyleOptions> = {}): Text {
  const t = new Text({
    text,
    style: { fontFamily: FONT, fontSize: size, fill: color, fontWeight: '800', dropShadow: hardShadow(color, size), ...extra },
  });
  t.anchor.set(0.5);
  return t;
}

/** Platte mit weichem Schatten, Verlauf, Lichtkante und Unterrand (siehe `depth.ts`). Ursprung links oben. */
export function panel(w: number, h: number, color = C.panel, radius = STYLE.radius, line = C.panelLine): Container {
  return raised(w, h, color, { radius, line, alpha: 0.96, holo: true, shadow: SHADOW.panel });
}

export class Button extends Container {
  private bg = new Graphics();
  private faceG = new Graphics();
  /** Fläche samt Beschriftung, wird beim Drücken nach unten in den Unterrand gedrückt */
  private face = new Container();
  private shadow;
  private txt: Text;
  private _enabled = true;
  private hover = false;

  constructor(text: string, private w: number, private h: number, private color: number, onTap: () => void, size = 28) {
    super();
    this.txt = label(text, size, C.text, { align: 'center' });
    this.txt.position.set(w / 2, h / 2);
    this.fit();
    this.shadow = dropShadow(w, h + BEVEL.buttonEdge, SHADOW.button, { radius: STYLE.radius });
    this.face.addChild(this.faceG, this.txt);
    this.addChild(this.shadow, this.bg, this.face);
    this.pivot.set(w / 2, h / 2);
    this.boundsArea = new Rectangle(-STYLE.outline, -STYLE.outline, w + 2 * STYLE.outline, h + BEVEL.buttonEdge + 2 * STYLE.outline);
    this.draw();
    this.eventMode = 'static';
    this.cursor = 'pointer';
    const down = (on: boolean) => {
      const dy = on && this._enabled ? BEVEL.press : 0;
      tween(this.face, { y: dy }, on ? 50 : 160, on ? undefined : easeOutBack);
      tween(this.shadow, { alpha: on && this._enabled ? SHADOW.button.alpha * 0.55 : SHADOW.button.alpha }, 80);
    };
    this.on('pointerdown', () => down(true));
    this.on('pointerup', () => down(false));
    this.on('pointerupoutside', () => down(false));
    this.on('pointerover', () => { this.hover = true; this.draw(); });
    this.on('pointerout', () => { this.hover = false; this.draw(); });
    this.on('pointertap', () => {
      if (this._enabled) { sfx.click(); haptics.tap(); onTap(); } else { sfx.deny(); haptics.deny(); }
    });
  }

  setText(text: string) { this.txt.text = text; this.fit(); }

  /** Schrumpft die Beschriftung, wenn sie breiter als der Knopf ist (englische Texte sind oft länger) */
  private fit() {
    this.txt.scale.set(1);
    const maxW = this.w - 2 * STYLE.outline - 14;
    if (this.txt.width > maxW) this.txt.scale.set(Math.max(0.55, maxW / this.txt.width));
  }

  /** Aktuelle Beschriftung (für die Einführung, die Knöpfe in fremden Ansichten findet) */
  get caption(): string { return this.txt.text; }

  /** Verschiebt die Beschriftung senkrecht, z. B. um darunter einen Preis zu zeigen. */
  nudgeText(dy: number) { this.txt.y += dy; }

  set enabled(v: boolean) {
    this._enabled = v;
    this.alpha = v ? 1 : 0.4;
    this.cursor = v ? 'pointer' : 'default';
    this.face.y = 0;
  }
  get enabled() { return this._enabled; }

  private draw() {
    const { w, h } = this;
    const o = STYLE.outline;
    const edge = BEVEL.buttonEdge;
    const color = this.hover && this._enabled ? lighten(this.color, BEVEL.hoverLift) : this.color;
    // Unterrand (Körper des Knopfes) bleibt stehen, nur die Fläche läuft beim Drücken hinein
    this.bg.clear()
      .roundRect(-o, -o, w + o * 2, h + edge + o * 2, STYLE.radius + o).fill(C.panelLine)
      .roundRect(0, 0, w, h + edge, STYLE.radius).fill(shade(this.color, BEVEL.edgeShade));
    this.faceG.clear();
    drawPlate(this.faceG, 0, 0, w, h, color, { edge: 0, outline: 0, line: C.panelLine, sheen: BEVEL.sheenH });
    // Kontur der Fläche, damit sie sich beim Drücken vom Unterrand abhebt
    this.faceG.roundRect(0, 0, w, h, STYLE.radius).stroke({ width: 2, color: shade(this.color, 0.4), alpha: 0.9 });
  }
}

/** Floating "+12" style text that rises and fades. */
export function popup(parent: Container, x: number, y: number, text: string, color: number, size = 34) {
  const box = new Container();
  const t = label(text, size, C.text);
  const pad = 10;
  const w = t.width + pad * 2;
  const h = t.height + 8;
  // kleine erhabene Plakette mit weichem Schatten
  const shadow = dropShadow(w, h + 3, SHADOW.button, { radius: 10 });
  shadow.position.x -= w / 2;
  shadow.position.y -= h / 2;
  const bg = drawPlate(new Graphics(), -w / 2, -h / 2, w, h, color, { radius: 10, edge: 3, outline: 2 });
  box.addChild(shadow, bg, t);
  box.position.set(x, y);
  box.scale.set(0.3);
  parent.addChild(box);
  tween(box, { 'scale.x': 1, 'scale.y': 1 }, 180, easeOutBack);
  tween(box, { y: y - 50 }, 700).then(() => tween(box, { alpha: 0 }, 200)).then(() => box.destroy({ children: true }));
}

/** Reiter Leiste mit gleich breiten Buttons, der aktive Reiter ist farbig. */
export function tabBar<T extends string>(
  tabs: { id: T; name: string }[],
  width: number,
  current: T,
  onSelect: (id: T) => void,
  size = 20,
): Container {
  const bar = new Container();
  const gap = 8;
  const w = (width - gap * (tabs.length - 1)) / tabs.length;
  tabs.forEach((t, i) => {
    const b = new Button(t.name, w, 46, t.id === current ? C.accent : 0x3b5068, () => onSelect(t.id), size);
    b.position.set(w / 2 + i * (w + gap), 23);
    bar.addChild(b);
  });
  return bar;
}

/** Mehrzeiliger Text mit Umbruch, Anker oben (mittig oder links) */
export function wrapText(text: string, width: number, size = 16, color = C.text, align: 'left' | 'center' = 'center'): Text {
  const t = new Text({ text, style: { fontFamily: FONT_BODY, fontSize: size, fontWeight: '700', fill: color, wordWrap: true, wordWrapWidth: width, align } });
  t.anchor.set(align === 'center' ? 0.5 : 0, 0);
  return t;
}

/** Full-screen dimmer that blocks input below it. */
export function overlay(w: number, h: number): Container {
  const c = new Container();
  const dim = new Graphics().rect(-VIEW_BLEED, -VIEW_BLEED, w + 2 * VIEW_BLEED, h + 2 * VIEW_BLEED).fill({ color: 0x070b11, alpha: 0.72 });
  dim.eventMode = 'static';
  c.addChild(dim);
  c.alpha = 0;
  tween(c, { alpha: 1 }, 200);
  return c;
}
