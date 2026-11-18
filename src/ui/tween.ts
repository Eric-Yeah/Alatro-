import { Ticker } from 'pixi.js';
import { getSpeed } from '../settings';

export type Ease = (t: number) => number;
export const linear: Ease = (t) => t;
export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack: Ease = (t) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function getPath(obj: any, path: string): number {
  return path.split('.').reduce((o, k) => o[k], obj);
}
function setPath(obj: any, path: string, v: number) {
  const keys = path.split('.');
  const last = keys.pop()!;
  keys.reduce((o, k) => o[k], obj)[last] = v;
}

const active = new Map<object, Map<string, () => void>>();

/** Animate numeric (dotted-path) properties. Resolves when done. A newer tween on the same prop cancels the old one.
 * `scaled = false` ignoriert das Animationstempo (Dauerschleifen wie das Wackeln des Titels). */
export function tween(target: any, to: Record<string, number>, ms: number, ease: Ease = easeOutCubic, scaled = true): Promise<void> {
  if (!target || target.destroyed) return Promise.resolve();
  return new Promise((resolve) => {
    const from: Record<string, number> = {};
    for (const k in to) from[k] = getPath(target, k);
    let props = active.get(target);
    if (!props) active.set(target, (props = new Map()));
    let elapsed = 0;
    let cancelled = false;
    const cancel = () => { cancelled = true; Ticker.shared.remove(tick); resolve(); };
    for (const k in to) { props.get(k)?.(); props.set(k, cancel); }
    const tick = (ticker: Ticker) => {
      if (cancelled) return;
      if (target.destroyed) { cancel(); return; }
      elapsed += ticker.deltaMS * (scaled ? getSpeed() : 1);
      const p = ms <= 0 ? 1 : Math.min(1, elapsed / ms);
      const e = ease(p);
      for (const k in to) setPath(target, k, from[k] + (to[k] - from[k]) * e);
      if (p >= 1) {
        Ticker.shared.remove(tick);
        for (const k in to) if (props!.get(k) === cancel) props!.delete(k);
        resolve();
      }
    };
    Ticker.shared.add(tick);
  });
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const tick = (ticker: Ticker) => {
      elapsed += ticker.deltaMS * getSpeed();
      if (elapsed >= ms) { Ticker.shared.remove(tick); resolve(); }
    };
    Ticker.shared.add(tick);
  });
}

/** Quick squash & wiggle used for "this thing just triggered". */
export async function juice(target: { scale: { x: number; y: number }; rotation: number; destroyed?: boolean }, strength = 1) {
  if (target.destroyed) return;
  const s = 1 + 0.18 * strength;
  tween(target, { rotation: (Math.random() - 0.5) * 0.25 * strength }, 80).then(() => tween(target, { rotation: 0 }, 220, easeOutBack));
  await tween(target, { 'scale.x': s, 'scale.y': s }, 80);
  await tween(target, { 'scale.x': 1, 'scale.y': 1 }, 200, easeOutBack);
}
