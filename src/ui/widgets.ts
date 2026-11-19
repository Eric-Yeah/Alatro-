import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { sfx } from './audio';
import { haptics } from './haptics';
import { C, FONT, FONT_BODY, STYLE, shade } from './theme';
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

export function panel(w: number, h: number, color = C.panel, radius = STYLE.radius, line = C.panelLine): Container {
  const c = new Container();
  c.addChild(new Graphics()
    .roundRect(0, STYLE.shadowY, w, h, radius).fill(STYLE.shadowColor)
    .roundRect(0, 0, w, h, radius).fill({ color, alpha: 0.9 }).stroke({ width: STYLE.outline, color: line })
    // dünne Leuchtlinie innen: Hologramm Anmutung
    .roundRect(4, 4, w - 8, h - 8, Math.max(2, radius - 3)).stroke({ width: 1.5, color: C.holo, alpha: 0.3 }));
  return c;
}

export class Button extends Container {
  private bg = new Graphics();
  private txt: Text;
  private _enabled = true;

  constructor(text: string, private w: number, private h: number, private color: number, onTap: () => void, size = 28) {
    super();
    this.txt = label(text, size, C.text, { align: 'center' });
    this.txt.position.set(w / 2, h / 2);
    this.addChild(this.bg, this.txt);
    this.pivot.set(w / 2, h / 2);
    this.draw();
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', () => { if (this._enabled) tween(this, { 'scale.x': 0.94, 'scale.y': 0.94 }, 60); });
    const release = () => tween(this, { 'scale.x': 1, 'scale.y': 1 }, 200, easeOutBack);
    this.on('pointerup', release);
    this.on('pointerupoutside', release);
    this.on('pointertap', () => {
      if (this._enabled) { sfx.click(); haptics.tap(); onTap(); } else { sfx.deny(); haptics.deny(); }
    });
  }

  setText(t: string) { this.txt.text = t; }

  /** Aktuelle Beschriftung (für die Einführung, die Knöpfe in fremden Ansichten findet) */
  get caption(): string { return this.txt.text; }

  /** Verschiebt die Beschriftung senkrecht, z. B. um darunter einen Preis zu zeigen. */
  nudgeText(dy: number) { this.txt.y += dy; }

  set enabled(v: boolean) {
    this._enabled = v;
    this.alpha = v ? 1 : 0.4;
    this.cursor = v ? 'pointer' : 'default';
  }
  get enabled() { return this._enabled; }

  private draw() {
    const { w, h, color } = this;
    const r = STYLE.radius;
    const o = STYLE.outline;
    // Kontur, unterer Rand in dunklerer Farbe, Fläche: alles flach und hart
    this.bg.clear()
      .roundRect(-o, -o, w + o * 2, h + o * 2 + 5, r + o).fill(C.panelLine)
      .roundRect(0, 0, w, h + 5, r).fill(shade(color, 0.55))
      .roundRect(0, 0, w, h, r).fill(color)
      .roundRect(5, 4, w - 10, 3, 1.5).fill({ color: 0xffffff, alpha: 0.28 });
  }
}

/** Floating "+12" style text that rises and fades. */
export function popup(parent: Container, x: number, y: number, text: string, color: number, size = 34) {
  const box = new Container();
  const t = label(text, size, C.text);
  const pad = 10;
  const bg = new Graphics()
    .roundRect(-t.width / 2 - pad, -t.height / 2 - 4, t.width + pad * 2, t.height + 8, 10)
    .fill(color);
  box.addChild(bg, t);
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
  const dim = new Graphics().rect(0, 0, w, h).fill({ color: 0x070b11, alpha: 0.72 });
  dim.eventMode = 'static';
  c.addChild(dim);
  c.alpha = 0;
  tween(c, { alpha: 1 }, 200);
  return c;
}
