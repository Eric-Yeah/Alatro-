import { Container, Graphics, Rectangle, Sprite, Ticker, type Text } from 'pixi.js';
import { DEFAULT_CARD_PALETTE } from '../data/cardArt/cardPalettes';
import { getCosmetic, type Cosmetic } from '../data/cosmetics';
import { DECKS } from '../data/decks';
import { DECK_THRESHOLDS } from '../data/trophies';
import { COSMETIC_RARITY_COLOR, COSMETIC_RARITY_NAME, TROPHY_LAYOUT, TROPHY_STATE_COLOR } from '../data/trophyLayout';
import { LEAGUES, ROAD } from '../data/trophyRoad';
import type { CosmeticCategory, TrophyLine } from '../data/trophyTypes';
import { t } from '../i18n';
import { getProfile, saveProfile } from '../profile';
import { updateSettings } from '../settings';
import {
  activeTitle, claimAll, claimEntry, claimableCount, deckStatus, equip, equippedId, leagueIndexOf, leagueProgress,
  roadStatus, unlockHint, type RoadState,
} from '../trophies';
import { sfx } from './audio';
import { CARD_H, CARD_W, cardBack } from './CardView';
import { backPreviewTexture, paletteOfCosmetic, palettePreviewTextures, skySwatches, sparkPreviewColors } from './cosmeticFx';
import { haptics } from './haptics';
import { C, fmt, numLocale, shade } from './theme';
import { easeOutBack, easeOutCubic, loop, tween } from './tween';
import {
  clampScroll, focusIndex, focusScroll, inertiaStep, markerX, pageCount, pageSlice, recentFirst, roadContentWidth, roadNodes,
  sectionWidth, sectionX, stageFill, sumAmounts, summarizeLines,
} from './trophyViewMath';
import { Button, label, panel, popup, tabBar, wrapText } from './widgets';

const L = TROPHY_LAYOUT;
export const TROPHY_W = L.w;
export const TROPHY_H = L.h;

type Tab = 'road' | 'decks' | 'history';

/** Was eine Kachel oder die Detailkarte zeigt: ein Eintrag des Hauptpfads oder einer Deck Stufe */
interface EntryRef {
  id: string;
  source: 'road' | 'deck';
  reward: string;
  threshold: number;
  /** Pokale, gegen die die Schwelle zählt (Gesamt oder mit dem Deck) */
  have: number;
  state: RoadState;
  /** Deck Id bei Deck Stufen */
  deckId?: string;
}

const fitWidth = (txt: Text, maxW: number) => {
  txt.scale.set(1);
  if (txt.width > maxW) txt.scale.set(maxW / txt.width);
};

/** Cosmetic Name oder die Id, falls der Katalog sie nicht kennt */
const cosmeticName = (c: Cosmetic | undefined, id: string) => c?.name ?? id;

function categoryName(cat: CosmeticCategory): string {
  switch (cat) {
    case 'back': return t('Rücken');
    case 'palette': return t('Kartenpalette');
    case 'sky': return t('Himmel');
    case 'spark': return t('Funken');
    case 'title': return t('Ehrentitel');
  }
}

/** Gleichmäßig verteilte, zufallsfreie Zahl 0 bis 1 (Sterne der Himmel Vorschau) */
function hash01(i: number, k: number): number {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ───────────────────────────────────────────── Vorschau je Kategorie

/**
 * Vorschau eines Stücks, Mitte im Ursprung, passend in `w` mal `h`. Rücken als Kartenrücken, Palette als Beispielkarten,
 * Himmel als Farbstreifen, Funken als Farbpunkte, Titel als Text. Unbekannte Stücke zeigen ein Fragezeichen.
 */
export function buildPreview(id: string, w: number, h: number, big: boolean, textless = false, small = false): Container {
  const c = new Container();
  const cos = getCosmetic(id);
  if (!cos) {
    c.addChild(label('?', Math.round(h * 0.5), C.textDim));
    return c;
  }
  const rarity = COSMETIC_RARITY_COLOR[cos.rarity];
  switch (cos.category) {
    case 'back': {
      const tex = backPreviewTexture(id);
      const k = Math.min((w * 0.9) / CARD_W, (h * 0.94) / CARD_H);
      if (tex) {
        const shadow = new Graphics().roundRect(-CARD_W * k / 2 + 3, -CARD_H * k / 2 + 5, CARD_W * k, CARD_H * k, 8).fill({ color: 0, alpha: 0.35 });
        const s = new Sprite(tex);
        s.anchor.set(0.5);
        s.scale.set(k * (CARD_W / tex.width));
        c.addChild(shadow, s);
      } else {
        const b = cardBack(C.cardBack, { ignoreEquipped: true });
        b.scale.set(k);
        c.addChild(b);
      }
      break;
    }
    case 'palette': {
      const pal = paletteOfCosmetic(id) ?? DEFAULT_CARD_PALETTE;
      const tex = palettePreviewTextures(pal);
      const n = big ? tex.length : 2;
      const cw = CARD_W;
      const step = (w * 0.9 - cw * 0.5) / Math.max(1, n - 1);
      const k = Math.min(1, (h * 0.92) / CARD_H, (big ? 0.62 : 0.5));
      const stepK = Math.min(step, cw * k * 0.78);
      for (let i = 0; i < n; i++) {
        const s = new Sprite(tex[i]);
        s.anchor.set(0.5);
        s.scale.set(k * (CARD_W / tex[i].width));
        s.position.set((i - (n - 1) / 2) * stepK, Math.abs(i - (n - 1) / 2) * (big ? 6 : 4));
        s.rotation = (i - (n - 1) / 2) * (big ? 0.1 : 0.12);
        c.addChild(s);
      }
      break;
    }
    case 'sky': {
      const [deep, mid, accent] = skySwatches(id);
      const bw = w * 0.9;
      const bh = h * 0.8;
      const g = new Graphics()
        .roundRect(-bw / 2, -bh / 2, bw, bh, 10).fill(deep)
        .roundRect(-bw / 2, -bh / 2 + bh * 0.42, bw, bh * 0.58, 10).fill(mid)
        .rect(-bw / 2, -bh / 2 + bh * 0.42, bw, 12).fill(mid)
        .roundRect(-bw / 2, bh / 2 - bh * 0.22, bw, bh * 0.22, 10).fill(accent)
        .rect(-bw / 2, bh / 2 - bh * 0.22, bw, 12).fill(accent)
        .roundRect(-bw / 2, -bh / 2, bw, bh, 10).stroke({ width: 2, color: C.panelLine });
      c.addChild(g);
      const stars = big ? 22 : 9;
      for (let i = 0; i < stars; i++) {
        const sx = (hash01(i, 1) - 0.5) * (bw - 16);
        const sy = -bh / 2 + 8 + hash01(i, 2) * bh * 0.4;
        c.addChild(new Graphics().circle(sx, sy, 1 + hash01(i, 3) * (big ? 2 : 1.4)).fill({ color: 0xffffff, alpha: 0.4 + hash01(i, 4) * 0.5 }));
      }
      break;
    }
    case 'spark': {
      const cols = sparkPreviewColors(id);
      const n = big ? 14 : 8;
      const span = w * 0.8;
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1);
        const x = -span / 2 + f * span;
        const y = h * 0.18 * Math.sin(f * Math.PI * 1.4 + 0.4) * -1 + h * 0.08;
        const r = (big ? 4 : 2.4) + f * (big ? 12 : 6);
        c.addChild(new Graphics().circle(x, y, r).fill({ color: cols[i % cols.length], alpha: 0.35 + f * 0.65 }));
      }
      c.addChild(new Graphics().star(span / 2, h * 0.08 + h * 0.18 * Math.sin(Math.PI * 1.4 + 0.4) * -1, 4, big ? 20 : 10, big ? 6 : 3).fill(cols[0] ?? 0xffffff));
      break;
    }
    case 'title': {
      const bw = w * 0.92;
      const bh = big ? 120 : Math.min(h * 0.62, 78);
      c.addChild(new Graphics()
        .roundRect(-bw / 2, -bh / 2, bw, bh, 10).fill(0x101826).stroke({ width: 3, color: rarity })
        .roundRect(-bw / 2 + 6, -bh / 2 + 6, bw - 12, bh - 12, 6).stroke({ width: 1.5, color: rarity, alpha: 0.5 }));
      if (textless) {
        // kleine Kacheln und gesperrte Titel: nur der Rahmen, bei freien Titeln mit Stern
        if (small) c.addChild(new Graphics().star(0, 0, 5, bh * 0.28, bh * 0.12).fill(rarity));
        break;
      }
      const size = big ? 28 : 15;
      const txt = wrapText(cos.name, bw - 24, size, rarity, 'center');
      txt.anchor.set(0.5);
      txt.position.set(0, 0);
      c.addChild(txt);
      // zu lange Wörter und zu hohe Texte schrumpfen, damit nichts über den Rahmen ragt
      const k = Math.min(1, (bw - 16) / txt.width, (bh - 12) / txt.height);
      txt.scale.set(k);
      break;
    }
  }
  return c;
}

// ───────────────────────────────────────────── Kachel

function lockIcon(): Graphics {
  return new Graphics()
    .arc(0, -6, 9, Math.PI, 0).stroke({ width: 4, color: 0xdde4f5 })
    .roundRect(-13, -6, 26, 20, 4).fill(0xdde4f5).stroke({ width: 2, color: C.panelLine })
    .circle(0, 4, 3).fill(C.panelLine);
}

function checkIcon(r: number): Graphics {
  return new Graphics()
    .circle(0, 0, r).fill(TROPHY_STATE_COLOR.claimed).stroke({ width: 2.5, color: C.panelLine })
    .moveTo(-r * 0.45, 0).lineTo(-r * 0.1, r * 0.38).lineTo(r * 0.5, -r * 0.34).stroke({ width: 3.5, color: 0xffffff, cap: 'round', join: 'round' });
}

/** Kachel eines Eintrags: Vorschau im Rahmen der Rarität, Zustand als Symbol (Schloss, Ausrufezeichen, Haken) */
function buildTile(e: EntryRef, w: number, h: number, equipped: boolean, onTap: () => void): Container {
  const c = new Container();
  const cos = getCosmetic(e.reward);
  const rarity = cos ? COSMETIC_RARITY_COLOR[cos.rarity] : C.panelLine;
  const locked = e.state === 'locked';
  const ready = e.state === 'ready';
  const r = L.tile.radius;
  if (ready) {
    const glow = new Graphics().roundRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, r + 6).fill({ color: TROPHY_STATE_COLOR.readyGlow, alpha: 0.4 });
    c.addChild(glow);
    loop(glow, 'alpha', 0.2, 0.9, 900);
  }
  const bg = new Graphics()
    .roundRect(-w / 2, -h / 2 + 4, w, h, r).fill(C.panelLine)
    .roundRect(-w / 2, -h / 2, w, h, r).fill(locked ? TROPHY_STATE_COLOR.lockedFill : 0x1f2c3f)
    .roundRect(-w / 2, -h / 2, w, h, r).stroke({ width: L.tile.border, color: ready ? TROPHY_STATE_COLOR.readyGlow : rarity, alpha: locked ? 0.55 : 1 });
  c.addChild(bg);
  const pad = L.tile.previewPad;
  // gesperrte Titel zeigen nur den Rahmen, damit das Schloss nicht über dem Text liegt
  const pv = buildPreview(e.reward, w - pad, h - pad, false, locked || w < L.tile.textMinW, !locked);
  if (locked) pv.alpha = L.tile.lockedAlpha;
  c.addChild(pv);
  if (locked) c.addChild(lockIcon());
  if (e.state === 'claimed') {
    const chk = checkIcon(L.tile.badgeR);
    chk.position.set(w / 2 - 8, -h / 2 + 8);
    c.addChild(chk);
  } else if (ready) {
    const b = new Graphics().circle(0, 0, L.tile.badgeR).fill(TROPHY_STATE_COLOR.readyGlow).stroke({ width: 2.5, color: C.panelLine });
    const ex = label('!', 22, C.panelLine);
    ex.style.dropShadow = false;
    const badge = new Container();
    badge.addChild(b, ex);
    badge.position.set(w / 2 - 8, -h / 2 + 8);
    c.addChild(badge);
    loop(badge, 'scale.x', 0.9, 1.15, 700);
    loop(badge, 'scale.y', 0.9, 1.15, 700);
  }
  if (equipped) {
    const s = new Graphics().circle(0, 0, 13).fill(0x0b3b4a).stroke({ width: 2.5, color: TROPHY_STATE_COLOR.equipped })
      .star(0, 0, 5, 8, 3.5).fill(TROPHY_STATE_COLOR.equipped);
    s.position.set(-w / 2 + 10, -h / 2 + 10);
    c.addChild(s);
  }
  c.eventMode = 'static';
  c.cursor = 'pointer';
  c.on('pointertap', onTap);
  return c;
}

// ───────────────────────────────────────────── Hilfen

function bar(x: number, y: number, w: number, h: number, frac: number, color: number): Graphics {
  const g = new Graphics().roundRect(x, y, w, h, h / 2).fill(0x0f1622).stroke({ width: 2, color: C.panelLine });
  if (frac > 0) g.roundRect(x + 2, y + 2, Math.max(h - 4, (w - 4) * Math.min(1, frac)), h - 4, (h - 4) / 2).fill(color);
  return g;
}

const dateText = (ms: number, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' }) =>
  new Date(ms).toLocaleDateString(numLocale(), opts);

function deckName(id: string): string {
  return DECKS.find((d) => d.id === id)?.name ?? id;
}

// ───────────────────────────────────────────── Ansicht

/** Pokalpfad: Liga, Fortschritt, Pfad mit Belohnungen, Deck Pfade und Verlauf. Fenster über `Game.modal`. */
export function buildTrophyRoad(box: Container, close: () => void, opts: { tab?: Tab } = {}) {
  const W = L.w;
  const H = L.h;
  const p = getProfile();
  let tab: Tab = opts.tab ?? 'road';
  let histPage = 0;
  /** Scroll Stand des Pfads (null: beim ersten Zeichnen auf den nächsten Eintrag ausrichten) */
  let savedScroll: number | null = null;
  let selected: EntryRef | null = null;

  const title = label(t('Pokalpfad'), L.titleSize);
  title.position.set(W / 2, L.titleY);
  box.addChild(title);
  const dyn = new Container();
  const detailLayer = new Container();
  box.addChild(dyn, detailLayer);

  // ── Kopf
  const renderHeader = () => {
    const lp = leagueProgress(p.trophies.total);
    const name = label(lp.def.name, L.leagueNameSize, lp.def.color);
    name.anchor.set(0, 0.5);
    name.position.set(L.pad, L.leagueNameY);
    fitWidth(name, 560);
    const ttl = activeTitle(p);
    const subText = ttl ? t('Titel: {name}', { name: ttl }) : lp.def.flavor;
    const sub = label(subText, L.leagueSubSize, ttl ? C.text : C.textDim, { fontWeight: '700' });
    sub.anchor.set(0, 0.5);
    sub.position.set(L.pad, L.leagueSubY);
    fitWidth(sub, 640);
    const total = label(t('{n} Pokale', { n: fmt(p.trophies.total) }), L.totalSize, C.money);
    total.anchor.set(1, 0.5);
    total.position.set(W - L.pad, L.totalY);
    const streak = label(t('Siegesserie {n}, Bestwert {b}', { n: p.trophies.streak, b: p.trophies.bestStreak }), L.streakSize, C.textDim, { fontWeight: '700' });
    streak.anchor.set(1, 0.5);
    streak.position.set(W - L.pad, L.streakY);
    dyn.addChild(name, sub, total, streak);
    dyn.addChild(bar(L.pad, L.barY, W - 2 * L.pad, L.barH, lp.into / lp.span, lp.def.color));
    const bl = label(
      lp.next ? t('{a} von {b} Pokalen bis {league}', { a: fmt(lp.into), b: fmt(lp.span), league: lp.next.name }) : t('Höchste Liga erreicht'),
      L.barLabelSize, C.textDim, { fontWeight: '700' },
    );
    bl.position.set(W / 2, L.barLabelY);
    dyn.addChild(bl);
    const ready = claimableCount(p);
    if (ready > 0) {
      const b = new Button(t('Alle abholen ({n})', { n: ready }), L.claimAll.w, L.claimAll.h, C.money, () => {
        const got = claimAll(p);
        saveProfile();
        sfx.achievement();
        haptics.achievement();
        popup(box, W / 2, L.contentY + 40, t('{n} abgeholt', { n: got.length }), C.green, 30);
        render();
        if (selected) refreshSelected();
      }, L.claimAll.size);
      b.position.set(W - L.pad - L.claimAll.w / 2, L.claimAll.y);
      dyn.addChild(b);
    }
  };

  // ── Pfad
  const renderRoad = () => {
    const R = L.road;
    const status = roadStatus(p);
    const nodes = roadNodes(ROAD);
    const contentW = roadContentWidth(LEAGUES.length);
    const lp = leagueProgress(p.trophies.total);

    const view = new Container();
    view.position.set(R.viewX, L.contentY);
    view.hitArea = new Rectangle(0, 0, R.viewW, L.contentH);
    view.eventMode = 'static';
    const content = new Container();
    const mask = new Graphics().roundRect(0, 0, R.viewW, L.contentH, 14).fill(0xffffff);
    view.addChild(content, mask);
    content.mask = mask;
    dyn.addChild(view);

    // Abschnitte je Liga
    LEAGUES.forEach((lg, i) => {
      const x = sectionX(i);
      const sw = sectionWidth();
      const g = new Graphics()
        .rect(x, 0, sw, L.contentH).fill({ color: lg.color, alpha: i <= lp.index ? R.bandAlpha + 0.04 : R.bandAlpha })
        .rect(x, 0, sw, R.bandTopH).fill(lg.color);
      if (i > 0) g.rect(x, 0, 2, L.contentH).fill({ color: 0x000000, alpha: 0.35 });
      content.addChild(g);
      const nm = label(lg.name, R.leagueNameSize, lg.color);
      nm.anchor.set(0, 0.5);
      nm.position.set(x + R.sectionPad, R.leagueNameY);
      fitWidth(nm, sw - 2 * R.sectionPad - (i === lp.index ? 110 : 0));
      const range = label(t('ab {n} Pokalen', { n: fmt(lg.from) }), R.leagueRangeSize, C.textDim, { fontWeight: '700' });
      range.anchor.set(0, 0.5);
      range.position.set(x + R.sectionPad, R.leagueRangeY);
      content.addChild(nm, range);
      if (i === lp.index) {
        const tag = label(t('Aktuell'), 15, C.panelLine, { fontWeight: '800' });
        tag.style.dropShadow = false;
        const pw = tag.width + 20;
        const pill = new Graphics().roundRect(0, -13, pw, 26, 13).fill(lg.color);
        const holder = new Container();
        tag.position.set(pw / 2, 0);
        holder.addChild(pill, tag);
        holder.position.set(x + R.sectionPad + nm.width + 12, R.leagueNameY);
        content.addChild(holder);
      }
    });

    // Pfad Linie: erreichte Abschnitte golden, der Rest dunkel
    const line = new Graphics();
    nodes.forEach((n, i) => {
      if (i === 0) return;
      const prev = nodes[i - 1];
      const reached = status[i].state !== 'locked';
      line.moveTo(prev.x, prev.y).lineTo(n.x, n.y).stroke({ width: R.lineWidth, color: reached ? C.money : TROPHY_STATE_COLOR.lineOff, cap: 'round' });
    });
    content.addChild(line);

    // Zeiger "Du bist hier" auf der Linie
    const xs = nodes.map((n) => n.x);
    const mx = markerX(p.trophies.total, xs, ROAD.map((e) => e.threshold));
    let my = nodes[0].y;
    for (let i = 0; i < nodes.length - 1; i++) {
      if (mx >= nodes[i].x && mx <= nodes[i + 1].x) {
        my = nodes[i].y + ((mx - nodes[i].x) / (nodes[i + 1].x - nodes[i].x || 1)) * (nodes[i + 1].y - nodes[i].y);
        break;
      }
      if (i === nodes.length - 2) my = nodes[i + 1].y;
    }
    const marker = new Graphics()
      .circle(0, 0, R.markerR + 4).fill({ color: C.money, alpha: 0.35 })
      .circle(0, 0, R.markerR).fill(0xffffff).stroke({ width: 3, color: C.panelLine })
      .circle(0, 0, R.markerR - 5).fill(C.money);
    marker.position.set(mx, my);

    // Kacheln
    let dragged = false;
    ROAD.forEach((entry, i) => {
      const n = nodes[i];
      const st = status[i].state;
      const ref: EntryRef = { id: entry.id, source: 'road', reward: entry.reward, threshold: entry.threshold, have: p.trophies.total, state: st };
      const cat = getCosmetic(entry.reward)?.category;
      const isEq = !!cat && equippedId(p, cat) === entry.reward;
      const tile = buildTile(ref, R.tileW, R.tileH, isEq, () => { if (!dragged) openDetail(ref); });
      tile.position.set(n.x, n.y);
      content.addChild(tile);
      const nm = label(cosmeticName(getCosmetic(entry.reward), entry.reward), R.nameSize, st === 'locked' ? C.textDim : C.text, { fontWeight: '700' });
      nm.position.set(n.x, n.y + R.nameDy);
      fitWidth(nm, R.nameMaxW);
      const th = label(fmt(entry.threshold), R.thresholdSize, st === 'ready' ? TROPHY_STATE_COLOR.readyGlow : st === 'claimed' ? C.green : C.textDim, { fontWeight: '800' });
      th.position.set(n.x, n.y + R.thresholdDy);
      content.addChild(nm, th);
    });
    content.addChild(marker);

    const scrollBar = new Graphics();
    view.addChild(scrollBar);

    // Scrollen (Ziehen, Mausrad, Trägheit, Sprung)
    const scrollNow = () => -content.x;
    const setScroll = (v: number) => {
      const s = clampScroll(v, contentW, R.viewW);
      content.x = -s;
      savedScroll = s;
      const max = contentW - R.viewW;
      const tw = Math.max(40, (R.viewW * R.viewW) / contentW);
      scrollBar.clear();
      scrollBar.roundRect(0, R.barY, R.viewW, R.barH, 3).fill({ color: 0x000000, alpha: 0.3 });
      scrollBar.roundRect((s / max) * (R.viewW - tw), R.barY, tw, R.barH, 3).fill({ color: C.textDim, alpha: 0.85 });
    };
    let anim: ((tk: Ticker) => void) | null = null;
    const stopAnim = () => {
      if (anim) Ticker.shared.remove(anim);
      anim = null;
    };
    const startInertia = (v: number) => {
      stopAnim();
      let speed = Math.max(-R.maxSpeed, Math.min(R.maxSpeed, v));
      anim = (tk) => {
        if (view.destroyed) { stopAnim(); return; }
        const before = scrollNow();
        setScroll(before + (speed * tk.deltaMS) / 1000);
        speed = inertiaStep(speed, tk.deltaMS, R.friction, R.minSpeed);
        if (speed === 0 || scrollNow() === before) stopAnim();
      };
      Ticker.shared.add(anim);
    };
    const animateTo = (target: number) => {
      stopAnim();
      const from = scrollNow();
      const to = clampScroll(target, contentW, R.viewW);
      let el = 0;
      anim = (tk) => {
        if (view.destroyed) { stopAnim(); return; }
        el += tk.deltaMS;
        const k = Math.min(1, el / R.jumpMs);
        setScroll(from + (to - from) * easeOutCubic(k));
        if (k >= 1) stopAnim();
      };
      Ticker.shared.add(anim);
    };

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let vel = 0;
    view.on('pointerdown', (e) => {
      stopAnim();
      dragging = true;
      dragged = false;
      startX = view.toLocal(e.global).x;
      startScroll = scrollNow();
      lastX = startX;
      lastT = performance.now();
      vel = 0;
    });
    view.on('globalpointermove', (e) => {
      if (!dragging) return;
      const x = view.toLocal(e.global).x;
      if (Math.abs(x - startX) > R.dragSlop) dragged = true;
      if (!dragged) return;
      setScroll(startScroll - (x - startX));
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) vel = vel * 0.6 + (-(x - lastX) / dt) * 1000 * 0.4;
      lastX = x;
      lastT = now;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (dragged && Math.abs(vel) > R.minSpeed && performance.now() - lastT < 120) startInertia(vel);
    };
    view.on('pointerup', end);
    view.on('pointerupoutside', end);
    view.on('wheel', (e) => { stopAnim(); setScroll(scrollNow() + (e.deltaX || e.deltaY) * R.wheelStep); });

    // Startposition: nächster abholbarer, sonst nächster gesperrter Eintrag in der Mitte
    if (savedScroll === null) savedScroll = focusScroll(nodes[focusIndex(status.map((s) => s.state))].x, contentW, R.viewW);
    setScroll(savedScroll);

    // Sprungleiste der Ligen in der Fußzeile
    LEAGUES.forEach((lg, i) => {
      const chip = new Container();
      const cur = i === lp.index;
      chip.addChild(new Graphics()
        .roundRect(0, 0, R.chipW, R.chipH, 10).fill(i <= lp.index ? lg.color : shade(lg.color, 0.4))
        .roundRect(0, 0, R.chipW, R.chipH, 10).stroke({ width: cur ? 4 : 2, color: cur ? 0xffffff : C.panelLine }));
      const num = label(String(i + 1), 22, i <= lp.index ? C.panelLine : C.text);
      num.style.dropShadow = false;
      num.position.set(R.chipW / 2, R.chipH / 2);
      chip.addChild(num);
      chip.position.set(L.pad + i * (R.chipW + R.chipGap), L.footerY - R.chipH / 2);
      chip.eventMode = 'static';
      chip.cursor = 'pointer';
      chip.on('pointertap', () => {
        sfx.click();
        haptics.tap();
        animateTo(focusScroll(sectionX(i) + sectionWidth() / 2, contentW, R.viewW));
      });
      dyn.addChild(chip);
    });
  };

  // ── Deck Pfade
  const renderDecks = () => {
    const D = L.decks;
    DECKS.forEach((deck, i) => {
      const y = L.contentY + i * (D.rowH + D.rowGap);
      const x0 = L.pad;
      const rowW = W - 2 * L.pad;
      dyn.addChild(new Graphics().roundRect(x0, y, rowW, D.rowH, 10).fill(i % 2 === 0 ? D.bgOdd : D.bgEven));
      dyn.addChild(new Graphics().roundRect(x0, y, 8, D.rowH, 4).fill(deck.color));
      const have = p.trophies.byDeck[deck.id] ?? 0;
      const nm = label(deck.name, D.nameSize, C.text);
      nm.anchor.set(0, 0.5);
      nm.position.set(x0 + D.nameX, y + 22);
      fitWidth(nm, D.nameW);
      const cnt = label(t('{n} Pokale', { n: fmt(have) }), D.countSize, C.money, { fontWeight: '700' });
      cnt.anchor.set(0, 0.5);
      cnt.position.set(x0 + D.nameX, y + 46);
      dyn.addChild(nm, cnt);
      const stages = deckStatus(p, deck.id);
      stages.forEach(({ stage, state }, k) => {
        const sx = x0 + D.barX + k * (D.segW + D.segGap + D.chip + D.chipGap);
        const fill = stageFill(have, DECK_THRESHOLDS, k);
        const txt = label(`${fmt(Math.min(have, stage.threshold))} / ${fmt(stage.threshold)}`, D.countSize, state === 'locked' ? C.textDim : C.green, { fontWeight: '700' });
        txt.anchor.set(0, 0.5);
        txt.position.set(sx, y + 18);
        dyn.addChild(txt, bar(sx, y + 32, D.segW, D.barH, fill, state === 'locked' ? C.chips : C.green));
        const ref: EntryRef = { id: stage.id, source: 'deck', reward: stage.reward, threshold: stage.threshold, have, state, deckId: deck.id };
        const cat = getCosmetic(stage.reward)?.category;
        const tile = buildTile(ref, D.chip, D.chip, !!cat && equippedId(p, cat) === stage.reward, () => openDetail(ref));
        tile.position.set(sx + D.segW + 10 + D.chip / 2, y + D.rowH / 2);
        dyn.addChild(tile);
      });
    });
    const hint = label(t('Pokale zählen für den Pfad und für das Deck, mit dem du sie gewonnen hast.'), L.footerSize, C.textDim, { fontWeight: '700' });
    hint.anchor.set(0, 0.5);
    hint.position.set(L.pad, L.footerY);
    dyn.addChild(hint);
  };

  // ── Verlauf
  const renderHistory = () => {
    const Hh = L.history;
    const x0 = L.pad;
    const list = recentFirst(p.trophies.history);
    const pages = pageCount(list.length, Hh.perPage);
    histPage = Math.min(histPage, pages - 1);
    const colHead = (txt: string, x: number, align: 'l' | 'r') => {
      const l = label(txt, 15, C.textDim, { fontWeight: '800' });
      l.anchor.set(align === 'l' ? 0 : 1, 0.5);
      l.position.set(x0 + x, L.contentY + Hh.headY + 12);
      dyn.addChild(l);
    };
    colHead(t('Deck'), Hh.colDeck, 'l');
    colHead(t('Ante'), Hh.colAnte, 'l');
    colHead(t('Ergebnis'), Hh.colResult, 'l');
    colHead(t('Pokale'), Hh.colGained, 'r');
    colHead(t('Datum'), Hh.colDate, 'r');
    if (!list.length) {
      const e = wrapText(t('Noch kein Run beendet. Jede gespielte Runde bringt Pokale.'), Hh.listW - 40, 20, C.textDim, 'center');
      e.position.set(x0 + Hh.listW / 2, L.contentY + 120);
      dyn.addChild(e);
    }
    pageSlice(list, histPage, Hh.perPage).forEach((h, i) => {
      const y = L.contentY + Hh.rowsY + i * Hh.rowH;
      dyn.addChild(new Graphics().roundRect(x0, y, Hh.listW, Hh.rowH - 4, 8).fill(i % 2 === 0 ? 0x1b2636 : 0x172130));
      const cy = y + (Hh.rowH - 4) / 2;
      const put = (txt: string, x: number, color: number, align: 'l' | 'r', maxW: number, size = Hh.ruleSize + 2) => {
        const l = label(txt, size, color, { fontWeight: '700' });
        l.anchor.set(align === 'l' ? 0 : 1, 0.5);
        l.position.set(x0 + x, cy);
        fitWidth(l, maxW);
        dyn.addChild(l);
      };
      put(deckName(h.deckId), Hh.colDeck, C.text, 'l', 225);
      put(t('Ante {n}', { n: h.ante }), Hh.colAnte, C.text, 'l', 80);
      const res = h.end === 'abandoned' ? t('Abgebrochen') : h.won ? t('Sieg') : t('Niederlage');
      put(res, Hh.colResult, h.end === 'abandoned' ? TROPHY_STATE_COLOR.abandoned : h.won ? TROPHY_STATE_COLOR.win : TROPHY_STATE_COLOR.loss, 'l', 130);
      put(`+${fmt(h.gained)}`, Hh.colGained, C.money, 'r', 90);
      put(dateText(h.at), Hh.colDate, C.textDim, 'r', 120, Hh.ruleSize);
    });
    if (pages > 1) {
      const prev = new Button('‹', 70, 56, 0x3b5068, () => { histPage = (histPage + pages - 1) % pages; render(); }, 30);
      prev.position.set(W / 2 - 140, L.footerY);
      const next = new Button('›', 70, 56, 0x3b5068, () => { histPage = (histPage + 1) % pages; render(); }, 30);
      next.position.set(W / 2 + 140, L.footerY);
      const pl = label(t('Seite {a} von {b}', { a: histPage + 1, b: pages }), 16, C.textDim);
      pl.position.set(W / 2, L.footerY);
      dyn.addChild(prev, next, pl);
    }

    // Abrechnung des laufenden oder letzten Runs
    const rx = x0 + Hh.rightX - 48;
    const rw = Hh.rightW;
    dyn.addChild(new Graphics().roundRect(rx, L.contentY, rw, L.contentH, 12).fill(0x172130).stroke({ width: 2, color: C.panelLine }));
    const run = p.trophies.run;
    const hd = label(t('Abrechnung'), 24, C.text);
    hd.anchor.set(0, 0.5);
    hd.position.set(rx + 20, L.contentY + 28);
    dyn.addChild(hd);
    if (!run) {
      const e = wrapText(t('Noch keine Abrechnung. Starte einen Run.'), rw - 40, 18, C.textDim, 'center');
      e.position.set(rx + rw / 2, L.contentY + 120);
      dyn.addChild(e);
      return;
    }
    const which = run.ended ? t('Letzter Run') : t('Laufender Run');
    const sub = label(`${which}, ${deckName(run.deckId)}`, 16, C.textDim, { fontWeight: '700' });
    sub.anchor.set(0, 0.5);
    sub.position.set(rx + 20, L.contentY + 58);
    fitWidth(sub, rw - 40);
    dyn.addChild(sub);
    const rows = summarizeLines(run.lines, Hh.rows - 1);
    rows.forEach((r, i) => {
      const y = L.contentY + 92 + i * 33;
      const tx = label(r.text, 17, C.text, { fontWeight: '700' });
      tx.anchor.set(0, 0.5);
      tx.position.set(rx + 20, y);
      fitWidth(tx, rw - 40 - 80);
      const am = label(`${r.amount > 0 ? '+' : ''}${fmt(r.amount)}`, 19, C.money);
      am.anchor.set(1, 0.5);
      am.position.set(rx + rw - 20, y);
      dyn.addChild(tx, am);
    });
    const ty = L.contentY + L.contentH - 34;
    dyn.addChild(new Graphics().rect(rx + 20, ty - 22, rw - 40, 2).fill({ color: C.textDim, alpha: 0.5 }));
    const sl = label(t('Summe'), 20, C.text);
    sl.anchor.set(0, 0.5);
    sl.position.set(rx + 20, ty);
    const sv = label(`+${fmt(sumAmounts(run.lines as TrophyLine[]))}`, 24, C.money);
    sv.anchor.set(1, 0.5);
    sv.position.set(rx + rw - 20, ty);
    dyn.addChild(sl, sv);
  };

  // ── Detailkarte
  const entryState = (e: EntryRef): EntryRef => {
    if (e.source === 'road') {
      const s = roadStatus(p).find((x) => x.entry.id === e.id);
      return s ? { ...e, state: s.state, have: p.trophies.total } : e;
    }
    const d = deckStatus(p, e.deckId ?? '').find((x) => x.stage.id === e.id);
    return d ? { ...e, state: d.state, have: p.trophies.byDeck[e.deckId ?? ''] ?? 0 } : e;
  };

  function closeDetail() {
    selected = null;
    for (const c of [...detailLayer.children]) c.destroy({ children: true });
  }

  function openDetail(e: EntryRef) {
    sfx.click();
    haptics.tap();
    selected = e;
    renderDetail();
  }

  function refreshSelected() {
    if (!selected) return;
    selected = entryState(selected);
    renderDetail();
  }

  /** Zeichnet die Detailkarte neu und gibt die Mitte der Vorschau und deren Behälter für die Zeremonie zurück */
  function renderDetail(): { card: Container; pv: Container; cx: number; cy: number } | null {
    for (const c of [...detailLayer.children]) c.destroy({ children: true });
    if (!selected) return null;
    const D = L.detail;
    const e = entryState(selected);
    selected = e;
    const cos = getCosmetic(e.reward);
    const rarity = cos ? COSMETIC_RARITY_COLOR[cos.rarity] : C.panelLine;
    const owned = e.reward in p.trophies.owned;
    const cat = cos?.category;
    const isEq = !!cat && equippedId(p, cat) === e.reward;

    const dim = new Graphics().rect(0, 0, W, H).fill({ color: 0x070b11, alpha: 0.72 });
    dim.eventMode = 'static';
    dim.on('pointertap', closeDetail);
    detailLayer.addChild(dim);

    const card = new Container();
    card.addChild(panel(D.w, D.h, C.panelDark, D.radius, rarity));
    card.position.set((W - D.w) / 2, (H - D.h) / 2);
    card.eventMode = 'static';
    detailLayer.addChild(card);

    const nm = label(cosmeticName(cos, e.reward), D.nameSize, C.text);
    nm.position.set(D.w / 2, D.nameY);
    fitWidth(nm, D.w - 80);
    const rr = label(`${cos ? COSMETIC_RARITY_NAME[cos.rarity] : ''}  ·  ${cat ? categoryName(cat) : ''}`, D.raritySize, rarity, { fontWeight: '800' });
    rr.position.set(D.w / 2, D.rarityY);
    card.addChild(nm, rr);

    // Vorschau links in einem Rahmen
    const frame = new Graphics()
      .roundRect(D.previewX, D.previewY, D.previewW, D.previewH, 16).fill(0x101826).stroke({ width: 3, color: rarity, alpha: 0.8 });
    card.addChild(frame);
    const cx = D.previewX + D.previewW / 2;
    const cy = D.previewY + D.previewH / 2;
    const pv = buildPreview(e.reward, D.previewW - 24, D.previewH - 24, true);
    pv.position.set(cx, cy);
    if (e.state === 'locked') pv.alpha = 0.55;
    card.addChild(pv);

    const desc = wrapText(cos?.description ?? '', D.textW, D.descSize, C.text, 'left');
    desc.position.set(D.textX, D.descY);
    card.addChild(desc);

    // Zustand
    let stateText = '';
    let stateColor: number = C.textDim;
    if (e.state === 'locked') {
      const missing = Math.max(0, e.threshold - e.have);
      const hint = unlockHint(e.reward);
      stateText = e.source === 'deck'
        ? t('Gesperrt. Ab {n} Pokalen mit dem Deck {deck}, es fehlen noch {m}.', { n: fmt(e.threshold), deck: hint?.label ?? deckName(e.deckId ?? ''), m: fmt(missing) })
        : t('Gesperrt. Ab {n} Pokalen ({league}), es fehlen noch {m}.', { n: fmt(e.threshold), league: hint?.label ?? '', m: fmt(missing) });
    } else if (e.state === 'ready') {
      stateText = t('Bereit zum Abholen');
      stateColor = TROPHY_STATE_COLOR.readyGlow;
    } else {
      const at = p.trophies.claimed[e.id];
      stateText = (at ? t('Abgeholt am {date}', { date: dateText(at) }) : t('Abgeholt')) + (isEq ? '. ' + t('Ausgerüstet') : '');
      stateColor = isEq ? TROPHY_STATE_COLOR.equipped : C.green;
    }
    const st = wrapText(stateText, D.textW, D.stateSize, stateColor, 'left');
    st.position.set(D.textX, D.stateY);
    card.addChild(st);

    // Knöpfe
    const mainX = D.textX + D.btnW / 2;
    let main: Button;
    if (e.state === 'ready') {
      main = new Button(t('Abholen'), D.btnW, D.btnH, C.money, () => {
        const got = claimEntry(p, e.id);
        if (!got) return;
        saveProfile();
        sfx.achievement();
        haptics.achievement();
        render();
        const r = renderDetail();
        if (r) ceremony(r.card, r.pv, r.cx, r.cy, rarity);
      }, D.btnSize);
    } else if (e.state === 'claimed' && owned && cat) {
      const id = e.reward;
      main = new Button(isEq ? t('Ablegen') : t('Ausrüsten'), D.btnW, D.btnH, isEq ? 0x4a5a70 : C.chips, () => doEquip(cat, isEq ? '' : id), D.btnSize);
    } else {
      main = new Button(t('Gesperrt'), D.btnW, D.btnH, 0x3b5068, () => undefined, D.btnSize);
      main.enabled = false;
    }
    main.position.set(mainX, D.btnY);
    const closeB = new Button(t('Schließen'), D.closeW, D.closeH, 0x3b5068, closeDetail, 22);
    closeB.position.set(D.textX + D.btnW + 20 + D.closeW / 2, D.btnY);
    card.addChild(main, closeB);
    return { card, pv, cx, cy };
  }

  /** Zeremonie nach dem Abholen: Glanz hinter der Vorschau, die Vorschau springt auf */
  function ceremony(card: Container, pv: Container, cx: number, cy: number, color: number) {
    const D = L.detail;
    const glow = new Graphics().circle(0, 0, D.previewW / 2).fill({ color: TROPHY_STATE_COLOR.readyGlow, alpha: 0.85 })
      .circle(0, 0, D.previewW / 3).fill({ color: 0xffffff, alpha: 0.7 });
    glow.position.set(cx, cy);
    glow.scale.set(0.2);
    card.addChildAt(glow, 1);
    void tween(glow, { 'scale.x': 1.5, 'scale.y': 1.5, alpha: 0 }, D.glowMs).then(() => { if (!glow.destroyed) glow.destroy(); });
    const ring = new Graphics().circle(0, 0, D.previewW / 2).stroke({ width: 6, color });
    ring.position.set(cx, cy);
    ring.scale.set(0.4);
    card.addChild(ring);
    void tween(ring, { 'scale.x': 1.3, 'scale.y': 1.3, alpha: 0 }, D.glowMs, easeOutCubic).then(() => { if (!ring.destroyed) ring.destroy(); });
    pv.scale.set(D.popScale);
    void tween(pv, { 'scale.x': 1, 'scale.y': 1 }, D.glowMs, easeOutBack);
  }

  function doEquip(cat: CosmeticCategory, id: string) {
    if (!equip(p, cat, id)) return;
    // Paletten: eine Wahrheit sind die Einstellungen (die Optionen kennen die Auswahl schon)
    if (cat === 'palette') updateSettings({ cardPalette: (id ? paletteOfCosmetic(id) : null) ?? DEFAULT_CARD_PALETTE });
    saveProfile();
    sfx.pick();
    haptics.pick();
    render();
    refreshSelected();
  }

  // ── Gesamtaufbau
  function render() {
    for (const c of [...dyn.children]) c.destroy({ children: true });
    renderHeader();
    const tabs: { id: Tab; name: string }[] = [
      { id: 'road', name: t('Pfad') },
      { id: 'decks', name: t('Decks') },
      { id: 'history', name: t('Verlauf') },
    ];
    const tb = tabBar(tabs, W - 2 * L.pad, tab, (id) => { tab = id; closeDetail(); render(); }, L.tabSize);
    tb.position.set(L.pad, L.tabsY);
    dyn.addChild(tb);
    if (tab === 'road') renderRoad();
    else if (tab === 'decks') renderDecks();
    else renderHistory();
  }
  render();

  const closeBtn = new Button(t('Schließen'), L.close.w, L.close.h, 0xf2711c, close, L.close.size);
  closeBtn.position.set(W - 150, L.footerY);
  box.addChild(closeBtn);
}

// ───────────────────────────────────────────── Block der Rückschau

/**
 * Block mit der Abrechnung eines Runs für Game Over und Run gewonnen: Pokale des Runs, Gesamt, Liga, Titel,
 * Zeilen (zusammengefasst, höchstens `block.maxRows`), Liga Aufstieg, abholbereite Einträge und Knopf "Pokalpfad".
 * `null`, wenn es zu diesem Run keine Abrechnung gibt. Ursprung links oben, Breite `w`.
 */
export function buildRunTrophyBlock(w: number, runId: string, openRoad: () => void): { view: Container; h: number } | null {
  const p = getProfile();
  const ts = p.trophies;
  const run = ts.run;
  if (!run || run.runId !== runId || !run.lines.length) return null;
  const B = L.block;
  const view = new Container();
  const rows = summarizeLines(run.lines, B.maxRows);
  const lp = leagueProgress(ts.total);
  const from = leagueIndexOf(Math.max(0, ts.total - run.gained));
  const ready = claimableCount(p);
  const extra = (from < lp.index ? 1 : 0) + (ready > 0 ? 1 : 0);
  const h = B.headH + rows.length * B.rowH + extra * B.lineH + 18;

  view.addChild(new Graphics().roundRect(0, 0, w, h, 12).fill(0x172130).stroke({ width: 2, color: lp.def.color, alpha: 0.8 }));
  const a = label(t('Pokale: +{n}  (gesamt {total})', { n: fmt(run.gained), total: fmt(ts.total) }), B.headSize, C.money);
  a.anchor.set(0, 0.5);
  a.position.set(B.padX + 8, 24);
  fitWidth(a, w - B.btn.w - 60);
  const ttl = activeTitle(p);
  const b = label(lp.def.name + (ttl ? `  ·  ${ttl}` : ''), B.subSize, lp.def.color);
  b.anchor.set(0, 0.5);
  b.position.set(B.padX + 8, 48);
  fitWidth(b, w - B.btn.w - 60);
  view.addChild(a, b);
  const btn = new Button(t('Pokalpfad'), B.btn.w, B.btn.h, 0x4a3f6b, openRoad, B.btn.size);
  btn.position.set(w - B.padX - B.btn.w / 2 - 6, 32);
  view.addChild(btn);

  let y = B.headH + B.rowH / 2;
  for (const r of rows) {
    const tx = label(r.text, B.rowSize, C.text, { fontWeight: '700' });
    tx.anchor.set(0, 0.5);
    tx.position.set(B.padX + 8, y);
    fitWidth(tx, w - 140);
    const am = label(`${r.amount > 0 ? '+' : ''}${fmt(r.amount)}`, B.rowSize + 2, C.money);
    am.anchor.set(1, 0.5);
    am.position.set(w - B.padX - 8, y);
    view.addChild(tx, am);
    y += B.rowH;
  }
  y += B.lineH / 2 - B.rowH / 2;
  if (from < lp.index) {
    const lu = label(t('Liga Aufstieg: {from} zu {to}', { from: LEAGUES[from].name, to: lp.def.name }), B.rowSize, lp.def.color);
    lu.position.set(w / 2, y);
    fitWidth(lu, w - 30);
    view.addChild(lu);
    y += B.lineH;
  }
  if (ready > 0) {
    const rl = label(t('{n} Belohnung wartet auf dich|{n} Belohnungen warten auf dich', { n: ready }), B.rowSize, TROPHY_STATE_COLOR.readyGlow);
    rl.position.set(w / 2, y);
    fitWidth(rl, w - 30);
    view.addChild(rl);
  }
  return { view, h };
}
