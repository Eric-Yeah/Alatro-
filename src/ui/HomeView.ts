import { Container, Graphics } from 'pixi.js';
import { DECKS } from '../data/decks';
import { STAKES } from '../data/stakes';
import type { RunState } from '../core/run';
import { cardBack } from './CardView';
import { C, VIEW_H, VIEW_W, fmt } from './theme';
import { easeInOutCubic, easeOutCubic, tween } from './tween';
import { Button, label } from './widgets';

/** Zahlen und Layout des Home Bildschirms */
const HOME = {
  titleY: 190,
  subtitleY: 290,
  taglineY: 335,
  buttonX: VIEW_W / 2,
  buttonW: 480,
  buttonH: 84,
  buttonGap: 104,
  firstButtonY: 450,
  smallW: 200,
  smallH: 66,
  smallGap: 220,
  stars: 46,
  fanX: 235,
  fanY: 590,
  fanAngles: [-0.34, -0.12, 0.1],
  fanSpread: 78,
  deckColors: [0x5b3fa8, 0x2a5fa8, 0xa8324a],
} as const;

export interface HomeActions {
  resume: () => void;
  newRun: () => void;
  collection: () => void;
  tutorial: () => void;
  options: () => void;
  patchNotes: () => void;
}

export interface HomeInput {
  /** Gespeicherter Run, der sich fortsetzen lässt, sonst null */
  saved: RunState | null;
  version: string;
  actions: HomeActions;
}

/** Zufallsfreie, aber unregelmäßig wirkende Zahl zwischen 0 und 1 für die Sterne */
function hash01(i: number, k: number): number {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Dauerhafte, ruhige Hin und Her Bewegung. Endet von selbst, sobald das Ziel zerstört ist. */
function loop(target: Container, prop: string, a: number, b: number, ms: number) {
  const step = (to: number) => {
    if (target.destroyed) return;
    tween(target, { [prop]: to }, ms, easeInOutCubic, true).then(() => step(to === a ? b : a));
  };
  step(b);
}

function buildStars(): Container {
  const c = new Container();
  for (let i = 0; i < HOME.stars; i++) {
    const r = 1.5 + hash01(i, 3) * 2.5;
    const s = new Graphics().circle(0, 0, r).fill({ color: i % 5 === 0 ? C.money : C.text });
    s.position.set(hash01(i, 1) * VIEW_W, hash01(i, 2) * VIEW_H);
    s.alpha = 0.2 + hash01(i, 4) * 0.5;
    c.addChild(s);
    loop(s, 'alpha', 0.12, 0.85, 1400 + hash01(i, 5) * 2600);
  }
  return c;
}

/** Fächer aus Kartenrücken, die leicht schweben */
function buildFan(cx: number, mirror: boolean): Container {
  const fan = new Container();
  fan.position.set(cx, HOME.fanY);
  HOME.fanAngles.forEach((angle, i) => {
    const card = cardBack(HOME.deckColors[i]);
    const dir = mirror ? -1 : 1;
    card.rotation = angle * dir;
    card.position.set((i - 1) * HOME.fanSpread * dir, Math.abs(i - 1) * 14);
    card.scale.set(1.15);
    fan.addChild(card);
    loop(card, 'y', card.y - 10, card.y + 10, 2400 + i * 450);
  });
  return fan;
}

/** Vollbild Home Bildschirm: Titel, Hauptaktionen und Nebenmenüs. Der Hintergrund Shader scheint durch. */
export function buildHome(input: HomeInput): Container {
  const { saved, version, actions } = input;
  const root = new Container();

  // Fängt Berührungen ab, damit nichts vom Spieltisch dahinter reagiert
  const blocker = new Graphics().rect(0, 0, VIEW_W, VIEW_H).fill({ color: 0x0b0814, alpha: 0.4 });
  blocker.eventMode = 'static';
  root.addChild(blocker, buildStars(), buildFan(HOME.fanX, false), buildFan(VIEW_W - HOME.fanX, true));

  const title = label('ALATRO', 160, C.text, { stroke: { color: C.mult, width: 14 }, letterSpacing: 10 });
  title.position.set(VIEW_W / 2, HOME.titleY);
  title.rotation = -0.02;
  loop(title, 'rotation', -0.02, 0.02, 1800);
  const sub = label('Sternwarte der Alchemisten', 34, C.money);
  sub.position.set(VIEW_W / 2, HOME.subtitleY);
  const tag = label('Roguelike Poker Deckbuilder', 22, C.textDim);
  tag.position.set(VIEW_W / 2, HOME.taglineY);
  root.addChild(title, sub, tag);

  // Hauptknöpfe: Fortsetzen (falls vorhanden), Neuer Run, Sammlung
  let y = HOME.firstButtonY;
  const main = (text: string, color: number, fn: () => void, subline?: string) => {
    const b = new Button(text, HOME.buttonW, HOME.buttonH, color, fn, 32);
    b.position.set(HOME.buttonX, y);
    root.addChild(b);
    if (subline) {
      const s = label(subline, 18, C.textDim, { fontWeight: '700' });
      s.position.set(HOME.buttonX, y + HOME.buttonH / 2 + 14);
      root.addChild(s);
    }
    y += HOME.buttonGap + (subline ? 12 : 0);
  };
  if (saved) {
    const deck = DECKS.find((d) => d.id === saved.deckId)?.name ?? '';
    const stake = STAKES.find((s) => s.id === saved.stakeId)?.name ?? '';
    main('Fortsetzen', C.chips, actions.resume, `Ante ${saved.ante}, ${fmt(saved.money)} Geld, ${deck}, ${stake}`);
  }
  main('Neuer Run', C.mult, actions.newRun);
  main('Sammlung', 0x6b5a9e, actions.collection);

  // Nebenmenüs in einer Reihe
  const small = (text: string, i: number, fn: () => void) => {
    const b = new Button(text, HOME.smallW, HOME.smallH, 0x4a3f6b, fn, 24);
    b.position.set(VIEW_W / 2 + (i - 1) * HOME.smallGap, y + 10);
    root.addChild(b);
  };
  small('Anleitung', 0, actions.tutorial);
  small('Optionen', 1, actions.options);
  small('Neuigkeiten', 2, actions.patchNotes);

  const ver = label(`Version ${version}`, 18, C.textDim, { fontWeight: '600' });
  ver.position.set(VIEW_W / 2, VIEW_H - 36);
  root.addChild(ver);

  // Sanftes Einblenden
  root.alpha = 0;
  tween(root, { alpha: 1 }, 300, easeOutCubic);
  return root;
}
