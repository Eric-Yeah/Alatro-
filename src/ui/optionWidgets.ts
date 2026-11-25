import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { OPTIONS_LAYOUT } from '../data/optionsLayout';
import { t } from '../i18n';
import { sfx } from './audio';
import { drawInset, drawMeter, drawPlate, dropShadow } from './depth';
import { haptics } from './haptics';
import { C, STYLE } from './theme';
import { easeOutCubic, tween } from './tween';
import { label } from './widgets';

const CTRL = OPTIONS_LAYOUT.control;
const KNOB = OPTIONS_LAYOUT.knob;
const OFF_COLOR = 0x3b5068;

/** Weicher Schatten für Griffe und aktive Segmente (kleine Erhebung auf einer vertieften Schiene) */
function gripShadow(w: number, h: number) {
  return dropShadow(w, h + KNOB.edge, { blur: KNOB.shadowBlur, dy: KNOB.shadowDy, dx: 0, alpha: KNOB.shadowAlpha }, { radius: KNOB.radius });
}

/** Erhabener Griff (Schalter, Segment): Schatten plus Platte mit Glanz. Ursprung links oben, bounds gleich Plattengröße. */
function gripPlate(w: number, h: number, color: number): Container {
  const c = new Container();
  c.addChild(gripShadow(w, h));
  c.addChild(drawPlate(new Graphics(), 0, 0, w, h, color, { edge: KNOB.edge, outline: 1, radius: KNOB.radius, sheen: 0.5, line: C.panelLine }));
  c.boundsArea = new Rectangle(0, 0, w, h + KNOB.edge);
  return c;
}

/** Schalter An/Aus: vertiefte Schiene mit erhabenem, gleitendem Griff. Zeichnet sich selbst neu, die Zeile muss nicht neu gebaut werden. */
export function switchToggle(on: boolean, onChange: (on: boolean) => void): Container {
  const w = CTRL.switchW;
  const h = CTRL.h;
  const c = new Container();
  const track = new Graphics();
  const text = label('', 22, C.text);
  const pad = KNOB.switchPad;
  const knobW = KNOB.switchKnobW;
  const knobH = h - pad * 2 - KNOB.edge;
  const knob = gripPlate(knobW, knobH, KNOB.knobColor);
  const knobX = (v: boolean) => (v ? w - pad - knobW : pad);
  let state = on;
  const draw = () => {
    track.clear();
    drawInset(track, 0, 0, w, h, state ? KNOB.onColor : OFF_COLOR, { radius: KNOB.trackRadius });
    text.text = state ? t('An') : t('Aus');
    text.position.set(state ? (w - knobW - pad) / 2 : (w + knobW + pad) / 2, h / 2 - 1);
  };
  knob.y = pad;
  knob.x = knobX(state);
  draw();
  c.addChild(track, text, knob);
  c.boundsArea = new Rectangle(-STYLE.outline, -STYLE.outline, w + 2 * STYLE.outline, h + 2 * STYLE.outline + 2);
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
  const trackW = CTRL.sliderW;
  const knobS = CTRL.knob;
  const steps = Math.round(1 / step);
  const c = new Container();
  const track = new Graphics();
  const ticks = new Graphics();
  const knob = new Container();
  const valueText = label('', 26, C.text);
  valueText.anchor.set(1, 0.5);
  const vx = trackW + 30 + CTRL.sliderValueW;
  valueText.position.set(vx, 0);
  const valueBox = new Graphics();
  drawInset(valueBox, vx - CTRL.sliderValueW - KNOB.valuePadL, -KNOB.valueH / 2, CTRL.sliderValueW + KNOB.valuePadL + KNOB.valuePadR, KNOB.valueH, 0x1b2a3f, { radius: STYLE.radius });
  // Griff: Schatten, Platte in Akzentfarbe, drei Rillen zum Greifen
  const ks = gripShadow(knobS, knobS);
  ks.position.set(ks.x - knobS / 2, ks.y - knobS / 2);
  knob.addChild(ks);
  const kg = drawPlate(new Graphics(), -knobS / 2, -knobS / 2, knobS, knobS, C.accent, { edge: KNOB.edge, outline: 1, radius: KNOB.radius + 1, sheen: 0.5, line: C.panelLine });
  for (const dx of [-5, 0, 5]) kg.rect(dx - 1, -knobS / 2 + 10, 2, knobS - 20).fill({ color: 0x000000, alpha: 0.22 });
  knob.addChild(kg);
  for (let i = 0; i <= steps; i++) ticks.rect(i * (trackW / steps) - 1, KNOB.tickY, 2, i % 5 === 0 ? 10 : 6).fill({ color: C.textDim, alpha: 0.5 });
  let v = value;
  const draw = () => {
    track.clear();
    // Rinne mit gefülltem Verlauf; die Füllung endet unter der Mitte des Griffs
    drawMeter(track, 0, -KNOB.railH / 2, trackW, KNOB.railH, v, C.chips, { minFill: 0 });
    knob.x = v * trackW;
    valueText.text = `${Math.round(v * 100)} %`;
  };
  draw();
  c.addChild(valueBox, track, ticks, knob, valueText);
  c.boundsArea = new Rectangle(-30, -34, trackW + 60 + CTRL.sliderValueW + 40, 68);
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

/**
 * Auswahlleiste: eine zusammenhängende vertiefte Leiste. Das gewählte Segment ist erhaben und orange,
 * die anderen liegen vertieft in der Leiste (nur Schrift).
 */
export function segmented(items: readonly SegmentItem[], current: string, totalW: number, onSelect: (id: string) => void, size = 22): Container {
  const c = new Container();
  const h = CTRL.h;
  const pad = CTRL.segPad;
  const gap = CTRL.segGap;
  const sw = (totalW - pad * 2 - gap * (items.length - 1)) / items.length;
  const sh = h - pad * 2 - KNOB.edge;
  c.addChild(drawInset(new Graphics(), 0, 0, totalW, h, OFF_COLOR, { radius: KNOB.trackRadius }));
  items.forEach((it, i) => {
    const active = it.id === current;
    const seg = new Container();
    seg.position.set(pad + i * (sw + gap), pad);
    const txt = label(it.name, size, active ? C.text : C.textDim, { align: 'center' });
    txt.position.set(sw / 2, sh / 2);
    const maxW = sw - 14;
    if (txt.width > maxW) txt.scale.set(Math.max(0.5, maxW / txt.width));
    if (active) {
      seg.addChild(gripPlate(sw, sh, C.accent), txt);
    } else {
      // vertieftes Segment: nur ein heller Hauch beim Berühren, damit es antippbar wirkt
      const hover = new Graphics().roundRect(0, 0, sw, sh + KNOB.edge, KNOB.radius).fill({ color: 0xffffff, alpha: 0.1 });
      hover.visible = false;
      seg.addChild(hover, txt);
      seg.on('pointerover', () => { hover.visible = true; });
      seg.on('pointerout', () => { hover.visible = false; txt.y = sh / 2; });
      seg.on('pointerdown', () => { txt.y = sh / 2 + 2; });
      seg.on('pointerup', () => { txt.y = sh / 2; });
      seg.on('pointerupoutside', () => { txt.y = sh / 2; });
    }
    seg.hitArea = new Rectangle(-gap / 2, -pad, sw + gap, h);
    seg.eventMode = 'static';
    seg.cursor = active ? 'default' : 'pointer';
    seg.on('pointertap', () => {
      if (active) return;
      sfx.click();
      haptics.tap();
      onSelect(it.id);
    });
    c.addChild(seg);
  });
  c.boundsArea = new Rectangle(0, 0, totalW, h);
  return c;
}
