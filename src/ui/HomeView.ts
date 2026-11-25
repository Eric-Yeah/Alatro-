import { Container, Graphics, Rectangle } from 'pixi.js';
import { DECKS } from '../data/decks';
import { STAKES } from '../data/stakes';
import { scaleName } from '../data/difficulty';
import type { RunState } from '../core/run';
import { BEVEL, SHADOW } from '../data/depth';
import { cardBack, CARD_H } from './CardView';
import { drawInset } from './depth';
import { t } from '../i18n';
import { C, VIEW_BLEED, VIEW_H, VIEW_W, fmt } from './theme';
import { easeOutCubic, loop, tween } from './tween';
import { buildTitleCards } from './TitleCards';
import { Button, label } from './widgets';

/** Zahlen und Layout des Home Bildschirms */
const HOME = {
  titleY: 168,
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
  /** Plaketten (vertiefte Felder) für Rang und Zeilen unter den Knöpfen: Höhe, Rand links und rechts, Mindestbreite, Abstand unter dem Knopf */
  plaqueH: 26,
  plaquePad: 16,
  plaqueMinW: 0,
  plaqueGap: 6,
  /** Rang Plakette: Höhe, Schriftgröße, Mindestbreite */
  rankH: 46,
  rankMinW: 440,
  /** Standfläche unter den Kartenfächern: Breite, Höhe, Abstand zur Kartenunterkante, Deckkraft */
  fanFloorW: 330,
  fanFloorH: 26,
  fanFloorDy: 22,
  fanFloorAlpha: 0.35,
  plaqueColor: 0x1a2540,
  /** zusätzlicher Abstand nach einer Zeile unter einem Knopf */
  sublineExtra: 24,
} as const;

/** Schrumpft eine Plakette, wenn sie breiter als `max` ist (lange Texte in englischer Sprache) */
function fitWidth(c: Container, max: number) {
  const w = c.getLocalBounds().width;
  if (w > max) c.scale.set(max / w);
}

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

/** Vertiefte Plakette um einen Text (Rang, Zähler, Zeilen unter den Knöpfen), Mitte als Ursprung */
function plaque(text: string, size: number, color: number, h: number = HOME.plaqueH, minW: number = HOME.plaqueMinW, weight: '700' | '800' = '700'): Container {
  const c = new Container();
  const txt = label(text, size, color, { fontWeight: weight });
  const w = Math.max(minW, Math.ceil(txt.width) + HOME.plaquePad * 2);
  c.addChild(drawInset(new Graphics(), -w / 2, -h / 2, w, h, HOME.plaqueColor, { radius: h / 2, outline: 2, alpha: 0.92 }), txt);
  c.boundsArea = new Rectangle(-w / 2, -h / 2, w, h);
  return c;
}

/** Flacher Fleck auf dem Boden unter einer Gruppe (Mitte als Ursprung) */
function floorShadow(w: number, h: number, alpha: number): Graphics {
  const g = new Graphics();
  g.ellipse(0, 0, w / 2, h / 2).fill({ color: SHADOW.color, alpha });
  g.eventMode = 'none';
  return g;
}

/** Fächer aus Kartenrücken, die leicht schweben */
function buildFan(cx: number, mirror: boolean): Container {
  const fan = new Container();
  fan.position.set(cx, HOME.fanY);
  const base = floorShadow(HOME.fanFloorW, HOME.fanFloorH, HOME.fanFloorAlpha);
  base.y = (CARD_H * 1.15) / 2 + HOME.fanFloorDy;
  fan.addChild(base);
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
  const blocker = new Graphics().rect(-VIEW_BLEED, -VIEW_BLEED, VIEW_W + 2 * VIEW_BLEED, VIEW_H + 2 * VIEW_BLEED).fill({ color: 0x0b0814, alpha: 0.4 });
  blocker.eventMode = 'static';
  root.addChild(blocker, buildStars(), buildFan(HOME.fanX, false), buildFan(VIEW_W - HOME.fanX, true));

  const title = buildTitleCards();
  title.position.set(VIEW_W / 2, HOME.titleY);
  const sub = label(t('Sternwarte der Alchemisten'), 34, C.money);
  sub.position.set(VIEW_W / 2, HOME.subtitleY);
  const tag = label(t('Roguelike Poker Deckbuilder'), 22, C.textDim);
  tag.position.set(VIEW_W / 2, HOME.taglineY);
  root.addChild(title, sub, tag);

  // Rang und Erfolge in einer vertieften Plakette
  const rank = plaque(t('{name}  ·  {unlocked} von {total} Erfolgen', { name: input.rank.name, unlocked: input.rank.unlocked, total: input.rank.total }), 22, input.rank.color, HOME.rankH, HOME.rankMinW, '800');
  rank.position.set(VIEW_W / 2, HOME.rankY);
  root.addChild(rank);

  // Hauptknöpfe: Fortsetzen (falls vorhanden), Neuer Run
  let y = HOME.firstButtonY;
  const main = (text: string, color: number, fn: () => void, subline?: string) => {
    const b = new Button(text, HOME.buttonW, HOME.buttonH, color, fn, 32);
    b.position.set(HOME.buttonX, y);
    root.addChild(b);
    if (subline) {
      const s = plaque(subline, 18, C.textDim);
      fitWidth(s, HOME.buttonW);
      s.position.set(HOME.buttonX, y + HOME.buttonH / 2 + BEVEL.buttonEdge + HOME.plaqueGap + HOME.plaqueH / 2);
      root.addChild(s);
    }
    y += HOME.buttonGap + (subline ? HOME.sublineExtra : 0);
  };
  if (saved) {
    const deck = DECKS.find((d) => d.id === saved.deckId)?.name ?? '';
    const stake = saved.difficulty !== null ? scaleName(saved.difficulty) : STAKES.find((s) => s.id === saved.stakeId)?.name ?? '';
    main(t('Fortsetzen'), C.chips, actions.resume, t('Ante {ante}, {money} Geld, {deck}, {stake}{daily}', { ante: saved.ante, money: fmt(saved.money), deck, stake, daily: saved.daily ? t(', Tageslauf') : '' }));
  }
  main(t('Neuer Run'), C.mult, actions.newRun);

  // Zwei Hälften: Tageslauf und Erfolge
  const half = (text: string, i: number, color: number, fn: () => void, sub?: string) => {
    const b = new Button(text, HOME.halfW, HOME.buttonH, color, fn, 28);
    b.position.set(VIEW_W / 2 + (i - 0.5) * HOME.halfGap, y);
    root.addChild(b);
    if (sub) {
      const s = plaque(sub, 16, C.textDim);
      fitWidth(s, HOME.halfW);
      s.position.set(b.x, y + HOME.buttonH / 2 + BEVEL.buttonEdge + HOME.plaqueGap + HOME.plaqueH / 2);
      root.addChild(s);
    }
  };
  half(t('Tageslauf'), 0, 0x2f9f7a, actions.daily, input.dailyDone ? t('heute gespielt') : t('neu heute'));
  half(t('Erfolge'), 1, 0xc9962b, actions.achievements, t('{a} von {b}', { a: input.rank.unlocked, b: input.rank.total }));
  y += HOME.buttonGap + HOME.sublineExtra;

  // Nebenmenüs in einer Reihe
  const smalls: [string, () => void, number?][] = [
    [input.atlas.fresh ? t('Atlas!') : t('Atlas'), actions.collection, input.atlas.fresh ? C.accent : 0x6b5a9e],
    [input.guidePending ? t('Einführung!') : t('Einführung'), actions.guide, input.guidePending ? C.accent : 0x4a3f6b],
    [t('Anleitung'), actions.tutorial],
    [t('Optionen'), actions.options],
    [t('Neuigkeiten'), actions.patchNotes],
  ];
  smalls.forEach(([text, fn, color], i) => {
    const b = new Button(text, HOME.smallW, HOME.smallH, color ?? 0x4a3f6b, fn, 22);
    b.position.set(VIEW_W / 2 + (i - (smalls.length - 1) / 2) * HOME.smallGap, y + 10);
    root.addChild(b);
    if (i === 0) {
      const s = plaque(t('{a} von {b}', { a: input.atlas.found, b: input.atlas.total }), 16, C.textDim);
      fitWidth(s, HOME.smallW);
      s.position.set(b.x, y + 10 + HOME.smallH / 2 + BEVEL.buttonEdge + HOME.plaqueGap + HOME.plaqueH / 2);
      root.addChild(s);
    }
  });

  const ver = label(t('Version {version}', { version }), 18, C.textDim, { fontWeight: '600' });
  ver.position.set(VIEW_W / 2, VIEW_H - 36);
  root.addChild(ver);

  // Sanftes Einblenden
  root.alpha = 0;
  tween(root, { alpha: 1 }, 300, easeOutCubic);
  return root;
}
