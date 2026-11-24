import { Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { OPTIONS_LAYOUT } from '../data/optionsLayout';
import { t } from '../i18n';
import { sfx } from './audio';
import { haptics } from './haptics';
import { C, STYLE, shade } from './theme';
import { easeOutCubic, tween } from './tween';
import { Button, label } from './widgets';

const CTRL = OPTIONS_LAYOUT.control;
const OFF_COLOR = 0x3b5068;

/** Schalter An/Aus mit gleitendem Griff. Zeichnet sich selbst neu, die Zeile muss nicht neu gebaut werden. */
export function switchToggle(on: boolean, onChange: (on: boolean) => void): Container {
  const w = CTRL.switchW;
  const h = CTRL.h;
  const c = new Container();
  const track = new Graphics();
  const knob = new Graphics();
  const text = label('', 22, C.text);
  const pad = 6;
  const knobW = 50;
  const knobX = (v: boolean) => (v ? w - pad - knobW : pad);
  let state = on;
  const draw = () => {
    const o = STYLE.outline;
    track.clear()
      .roundRect(-o, -o, w + o * 2, h + o * 2 + 4, STYLE.radius + o).fill(C.panelLine)
      .roundRect(0, 0, w, h + 4, STYLE.radius).fill(shade(state ? C.green : OFF_COLOR, 0.55))
      .roundRect(0, 0, w, h, STYLE.radius).fill(state ? C.green : OFF_COLOR);
    knob.clear()
      .roundRect(0, 0, knobW, h - pad * 2, 5).fill(C.panelLine)
      .roundRect(2, 2, knobW - 4, h - pad * 2 - 4, 4).fill(0xf2f6fb)
      .roundRect(6, 5, knobW - 12, 4, 2).fill({ color: 0xffffff, alpha: 0.7 });
    text.text = state ? t('An') : t('Aus');
    text.position.set(state ? (w - knobW - pad) / 2 : (w + knobW + pad) / 2, h / 2);
  };
  knob.y = pad;
  knob.x = knobX(state);
  draw();
  c.addChild(track, text, knob);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.hitArea = { contains: (x: number, y: number) => x >= -8 && x <= w + 8 && y >= -8 && y <= h + 12 } as never;
  c.on('pointertap', () => {
    state = !state;
    sfx.select(state);
    haptics.tap();
    draw();
    void tween(knob, { x: knobX(state) }, 140, easeOutCubic);
    onChange(state);
  });
  return c;
}

/** Schieberegler 0 bis 1 in festen Stufen mit Wertanzeige. Ziehen oder Tippen auf die Leiste. */
export function slider(value: number, step: number, onChange: (v: number) => void, onRelease: () => void): Container {
  const trackW = OPTIONS_LAYOUT.control.sliderW;
  const knobS = CTRL.knob;
  const steps = Math.round(1 / step);
  const c = new Container();
  const track = new Graphics();
  const fill = new Graphics();
  const knob = new Graphics();
  const valueText = label('', 26, C.text);
  valueText.anchor.set(1, 0.5);
  valueText.position.set(trackW + 30 + CTRL.sliderValueW, 0);
  let v = value;
  const draw = () => {
    const x = v * trackW;
    track.clear().roundRect(-4, -11, trackW + 8, 22, 8).fill(C.panelLine).roundRect(0, -7, trackW, 14, 5).fill(0x141d29);
    for (let i = 0; i <= steps; i++) track.rect(i * (trackW / steps) - 1, 12, 2, i % 5 === 0 ? 10 : 6).fill({ color: C.textDim, alpha: 0.5 });
    fill.clear();
    if (x > 0) fill.roundRect(0, -7, x, 14, 5).fill(C.chips).roundRect(0, -7, x, 4, 2).fill({ color: 0xffffff, alpha: 0.3 });
    knob.clear()
      .roundRect(-knobS / 2 - 3, -knobS / 2 - 3, knobS + 6, knobS + 6, 8).fill(C.panelLine)
      .roundRect(-knobS / 2, -knobS / 2, knobS, knobS, 6).fill(C.accent)
      .roundRect(-knobS / 2 + 4, -knobS / 2 + 4, knobS - 8, 5, 2).fill({ color: 0xffffff, alpha: 0.4 });
    knob.x = x;
    valueText.text = `${Math.round(v * 100)} %`;
  };
  draw();
  c.addChild(track, fill, knob, valueText);
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.hitArea = { contains: (x: number, y: number) => x >= -30 && x <= trackW + 30 && y >= -34 && y <= 34 } as never;
  let dragging = false;
  const setFrom = (e: FederatedPointerEvent) => {
    const x = e.getLocalPosition(c).x;
    const next = Math.round(Math.max(0, Math.min(1, x / trackW)) * steps) / steps;
    if (next === v) return;
    v = next;
    draw();
    onChange(v);
  };
  const end = () => {
    if (!dragging) return;
    dragging = false;
    onRelease();
  };
  c.on('pointerdown', (e) => { dragging = true; setFrom(e); });
  c.on('globalpointermove', (e) => { if (dragging) setFrom(e); });
  c.on('pointerup', end);
  c.on('pointerupoutside', end);
  return c;
}

export interface SegmentItem {
  id: string;
  name: string;
}

/** Auswahlleiste: gleich breite Knöpfe nebeneinander, der gewählte ist orange. */
export function segmented(items: readonly SegmentItem[], current: string, totalW: number, onSelect: (id: string) => void, size = 22): Container {
  const c = new Container();
  const gap = CTRL.segGap;
  const w = (totalW - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const b = new Button(it.name, w, CTRL.h, it.id === current ? C.accent : OFF_COLOR, () => { if (it.id !== current) onSelect(it.id); }, size);
    b.position.set(w / 2 + i * (w + gap), CTRL.h / 2);
    c.addChild(b);
  });
  return c;
}
