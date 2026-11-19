import { Container, Graphics } from 'pixi.js';
import { DECKS } from '../data/decks';
import { STAKES } from '../data/stakes';
import { scaleName } from '../data/difficulty';
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
  firstButtonY: 468,
  halfW: 232,
  halfGap: 248,
  smallW: 180,
  smallH: 62,
  smallGap: 196,
  rankY: 382,
  stars: 46,
  fanX: 190,
  fanY: 520,
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
  /** geführte Einführungsrunde */
  guide: () => void;
  daily: () => void;
  achievements: () => void;
}

export interface HomeRank {
  name: string;
  color: number;
  unlocked: number;
  total: number;
}

export interface HomeInput {
  /** Gespeicherter Run, der sich fortsetzen lässt, sonst null */
  saved: RunState | null;
  rank: HomeRank;
  /** Tageslauf von heute schon gespielt? */
  dailyDone: boolean;
  /** Einführungsrunde noch nicht abgeschlossen (Knopf wird hervorgehoben) */
  guidePending: boolean;
  /** Fortschritt des Sternenatlas (Sammlung) und Zahl der noch nicht angesehenen Funde */
  atlas: { found: number; total: number; fresh: number };
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

  // Rang und Erfolge
  const rank = label(`${input.rank.name}  ·  ${input.rank.unlocked} von ${input.rank.total} Erfolgen`, 22, input.rank.color);
  rank.position.set(VIEW_W / 2, HOME.rankY);
  root.addChild(rank);

  // Hauptknöpfe: Fortsetzen (falls vorhanden), Neuer Run
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
    const stake = saved.difficulty !== null ? scaleName(saved.difficulty) : STAKES.find((s) => s.id === saved.stakeId)?.name ?? '';
    main('Fortsetzen', C.chips, actions.resume, `Ante ${saved.ante}, ${fmt(saved.money)} Geld, ${deck}, ${stake}${saved.daily ? ', Tageslauf' : ''}`);
  }
  main('Neuer Run', C.mult, actions.newRun);

  // Zwei Hälften: Tageslauf und Erfolge
  const half = (text: string, i: number, color: number, fn: () => void, sub?: string) => {
    const b = new Button(text, HOME.halfW, HOME.buttonH, color, fn, 28);
    b.position.set(VIEW_W / 2 + (i - 0.5) * HOME.halfGap, y);
    root.addChild(b);
    if (sub) {
      const s = label(sub, 16, C.textDim, { fontWeight: '700' });
      s.position.set(b.x, y + HOME.buttonH / 2 + 14);
      root.addChild(s);
    }
  };
  half('Tageslauf', 0, 0x2f9f7a, actions.daily, input.dailyDone ? 'heute gespielt' : 'neu heute');
  half('Erfolge', 1, 0xc9962b, actions.achievements, `${input.rank.unlocked} von ${input.rank.total}`);
  y += HOME.buttonGap + 12;

  // Nebenmenüs in einer Reihe
  const smalls: [string, () => void, number?][] = [
    [input.atlas.fresh ? 'Atlas!' : 'Atlas', actions.collection, input.atlas.fresh ? C.accent : 0x6b5a9e],
    [input.guidePending ? 'Einführung!' : 'Einführung', actions.guide, input.guidePending ? C.accent : 0x4a3f6b],
    ['Anleitung', actions.tutorial],
    ['Optionen', actions.options],
    ['Neuigkeiten', actions.patchNotes],
  ];
  smalls.forEach(([text, fn, color], i) => {
    const b = new Button(text, HOME.smallW, HOME.smallH, color ?? 0x4a3f6b, fn, 22);
    b.position.set(VIEW_W / 2 + (i - (smalls.length - 1) / 2) * HOME.smallGap, y + 10);
    root.addChild(b);
    if (i === 0) {
      const s = label(`${input.atlas.found} von ${input.atlas.total}`, 16, C.textDim, { fontWeight: '700' });
      s.position.set(b.x, y + 10 + HOME.smallH / 2 + 14);
      root.addChild(s);
    }
  });

  const ver = label(`Version ${version}`, 18, C.textDim, { fontWeight: '600' });
  ver.position.set(VIEW_W / 2, VIEW_H - 36);
  root.addChild(ver);

  // Sanftes Einblenden
  root.alpha = 0;
  tween(root, { alpha: 1 }, 300, easeOutCubic);
  return root;
}
