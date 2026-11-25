import { Container, Graphics, Sprite, Ticker } from 'pixi.js';
import { ACHIEVEMENTS } from '../data/achievements';
import { CARD_PALETTES, DEFAULT_CARD_PALETTE } from '../data/cardArt/cardPalettes';
import { getCosmetic } from '../data/cosmetics';
import type { BgMood } from '../data/juice';
import type { CosmeticCategory } from '../data/trophyTypes';
import { RARITY_FRAME, RARITY_LABEL, SKY_PREVIEW_MOODS, WARDROBE_LAYOUT, WARDROBE_TABS } from '../data/wardrobeLayout';
import { t } from '../i18n';
import { rankOf, unlockedCount } from '../achievements';
import { getProfile, saveProfile } from '../profile';
import { updateSettings } from '../settings';
import { equip, equippedId, isOwned } from '../trophies';
import { sfx } from './audio';
import { CARD_H, CARD_W, cardBack } from './CardView';
import { dotTexture, sparkTexture } from './artFx';
import { effectiveCardPalette, palettePreviewTextures, skyMoodSwatches, skySwatches, sparkPreviewColors } from './cosmeticFx';
import { haptics } from './haptics';
import { C, fmt } from './theme';
import { loop } from './tween';
import {
  categoryCounts, categoryName, cellPos, isEquipped, itemState, lockInfo, makeRand, pageCount, pageOfIndex, pageSlice, perPage,
  sortItems, sparkAlpha, totalCounts, wandPos, wardrobeItems, type ItemState, type WardrobeItem,
} from './wardrobeMath';
import { Button, label, panel, tabBar, wrapText } from './widgets';

const L = WARDROBE_LAYOUT;

export const WARDROBE_W = L.w;
export const WARDROBE_H = L.h;

/** Zuletzt gewählter Reiter (bleibt beim erneuten Öffnen erhalten) */
let lastTab: CosmeticCategory = 'back';

/** Beschriftung der Stimmungen in der Himmel Vorschau */
function moodLabel(m: BgMood): string {
  return m === 'menu' ? t('Menü') : m === 'small' ? 'Small' : m === 'big' ? 'Big' : m === 'boss' ? 'Boss' : 'Shop';
}

// ───────────────────────────────────────────── Zeichenhilfen (Grafikprimitive, die Schrift hat keine Symbole)

function lockIcon(size: number, color: number): Graphics {
  const bw = size * 0.78, bh = size * 0.56, r = size * 0.25;
  const g = new Graphics();
  g.moveTo(-r, -size * 0.02).lineTo(-r, -size * 0.14).arc(0, -size * 0.14, r, Math.PI, Math.PI * 2).lineTo(r, -size * 0.02)
    .stroke({ width: Math.max(2, size * 0.12), color });
  g.roundRect(-bw / 2, -size * 0.04, bw, bh, 3).fill(color);
  g.circle(0, size * 0.2, size * 0.07).fill(0x0b1018);
  return g;
}

function checkBadge(size: number, color: number): Graphics {
  const r = size / 2;
  return new Graphics().circle(0, 0, r).fill(color).stroke({ width: 2, color: 0x0b1018 })
    .moveTo(-r * 0.45, 0).lineTo(-r * 0.1, r * 0.38).lineTo(r * 0.5, -r * 0.34)
    .stroke({ width: Math.max(2, size * 0.1), color: 0xffffff, cap: 'round', join: 'round' });
}

function bar(x: number, y: number, w: number, frac: number, color: number): Graphics {
  const h = L.detail.barH;
  const g = new Graphics().roundRect(x, y, w, h, h / 2).fill(0x0f1622).stroke({ width: 2, color: C.panelLine });
  if (frac > 0) g.roundRect(x + 2, y + 2, Math.max(h - 4, (w - 4) * Math.min(1, frac)), h - 4, (h - 4) / 2).fill(color);
  return g;
}

// ───────────────────────────────────────────── Vorschau einzelner Stücke

/** Farbleiste eines Himmels: drei Bänder (tief, Mitte, Akzent) mit ein paar Sternen, links oben bei (0, 0) */
function drawSky(g: Graphics, sw: readonly [number, number, number], w: number, h: number) {
  g.clear();
  let y = 0;
  L.sky.bands.forEach((frac, i) => {
    const bh = i === 2 ? h - y : Math.round(h * frac);
    g.rect(0, y, w, bh).fill(sw[i]);
    y += bh;
  });
  for (const [sx, sy] of L.sky.stars) g.rect(Math.round(sx * w), Math.round(sy * h), 2, 2).fill({ color: 0xffffff, alpha: 0.85 });
  g.rect(0, 0, w, h).stroke({ width: 2, color: C.panelLine });
}

/** Kleine Vorschau für Kachel und Leiste: Mitte bei (0, 0), passt in w mal h. Titel haben keine. */
function miniArt(item: WardrobeItem, w: number, h: number, compact: boolean): Container {
  const root = new Container();
  switch (item.cat) {
    case 'back': {
      const card = cardBack(C.cardBack, { backId: item.cosmeticId || undefined, ignoreEquipped: true });
      card.scale.set(Math.min(w / CARD_W, h / CARD_H));
      root.addChild(card);
      break;
    }
    case 'palette': {
      const tex = palettePreviewTextures(item.palette ?? DEFAULT_CARD_PALETTE);
      const n = compact ? 1 : tex.length;
      const tw = tex[0].width, th = tex[0].height;
      const sc = Math.min(h / th, w / tw);
      const cw = tw * sc;
      const step = n > 1 ? Math.min(cw * L.palette.tileStep, (w - cw) / (n - 1)) : 0;
      for (let i = 0; i < n; i++) {
        const s = new Sprite(tex[i]);
        s.anchor.set(0.5);
        s.scale.set(sc);
        s.x = (i - (n - 1) / 2) * step;
        root.addChild(s);
      }
      break;
    }
    case 'sky': {
      const g = new Graphics();
      drawSky(g, skySwatches(item.cosmeticId, 0), w, h);
      g.position.set(-w / 2, -h / 2);
      root.addChild(g);
      break;
    }
    case 'spark': {
      const cols = sparkPreviewColors(item.cosmeticId);
      const M = L.mini, k = compact ? 0 : 1;
      const n = M.stars[k];
      for (let i = 0; i < n; i++) {
        const r = M.starR[k] * (1 - Math.abs(i - (n - 1) / 2) * M.starTaper);
        const s = new Sprite(sparkTexture());
        s.anchor.set(0.5);
        s.tint = cols[i % cols.length];
        s.scale.set((r * 2) / 7);
        s.x = (i - (n - 1) / 2) * Math.min(w / n, M.starDx[k]);
        s.y = ((i % 2) - 0.5) * M.starDy[k];
        root.addChild(s);
      }
      break;
    }
    default:
      break;
  }
  return root;
}

// ───────────────────────────────────────────── Animierte große Vorschauen

/** Funken Vorschau: ein Zeiger zieht eine Bahn und hinterlässt Funken in den Farben des Stücks. Eigene kleine Partikel. */
class SparkPreview extends Container {
  private readonly layer = new Container();
  private readonly swatches = new Graphics();
  private readonly pool: { s: Sprite; x: number; y: number; vx: number; vy: number; age: number; life: number; ci: number; size: number; active: boolean }[] = [];
  private readonly wand = new Sprite(sparkTexture());
  private readonly rand = makeRand(L.spark.seed);
  private clock = 0;
  private carry = 0;

  constructor(private readonly sparkId: string, private readonly w: number, private readonly h: number) {
    super();
    const S = L.spark;
    const bg = new Graphics().roundRect(0, 0, w, h, 12).fill(S.areaFill);
    const mask = new Graphics().roundRect(0, 0, w, h, 12).fill(0xffffff);
    this.layer.mask = mask;
    this.addChild(bg, mask, this.layer, this.swatches);
    for (let i = 0; i < S.max; i++) {
      const s = new Sprite(i % 4 === 3 ? dotTexture() : sparkTexture());
      s.anchor.set(0.5);
      s.blendMode = 'add';
      s.visible = false;
      this.layer.addChild(s);
      this.pool.push({ s, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, ci: 0, size: 1, active: false });
    }
    this.wand.anchor.set(0.5);
    this.wand.blendMode = 'add';
    this.wand.tint = 0xffffff;
    this.wand.scale.set((S.wandSize * S.pixelGrow) / this.wand.texture.width);
    this.layer.addChild(this.wand);
    // vorwärmen, damit die Vorschau nicht leer beginnt
    const now = Date.now();
    for (let i = 0; i < 24; i++) this.update(50, now);
  }

  private spawn(x: number, y: number) {
    const S = L.spark;
    const p = this.pool.find((q) => !q.active);
    if (!p) return;
    const a = this.rand() * Math.PI * 2;
    const sp = S.speed[0] + this.rand() * (S.speed[1] - S.speed[0]);
    p.x = x; p.y = y;
    p.vx = Math.cos(a) * sp;
    p.vy = Math.sin(a) * sp - S.rise;
    p.age = 0;
    p.life = S.lifeMs[0] + this.rand() * (S.lifeMs[1] - S.lifeMs[0]);
    p.ci = Math.floor(this.rand() * 64);
    p.size = S.size[0] + this.rand() * (S.size[1] - S.size[0]);
    p.active = true;
    p.s.visible = true;
  }

  update(dtMs: number, nowMs: number) {
    const S = L.spark;
    const dt = Math.min(dtMs, 60);
    this.clock += dt / 1000;
    // Farben pro Bild neu abfragen (beim Spektrum wandern sie)
    const cols = sparkPreviewColors(this.sparkId, nowMs);
    this.carry += (S.perSecond * dt) / 1000;
    while (this.carry >= 1) {
      this.carry -= 1;
      const pos = wandPos(this.clock - this.rand() * (dt / 1000), this.w, this.h, S.path);
      this.spawn(pos.x, pos.y);
    }
    for (const p of this.pool) {
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.life) { p.active = false; p.s.visible = false; continue; }
      const k = p.age / p.life;
      p.x += (p.vx * dt) / 1000;
      p.y += (p.vy * dt) / 1000;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.s.position.set(p.x, p.y);
      p.s.tint = cols[p.ci % cols.length];
      p.s.alpha = sparkAlpha(k);
      p.s.scale.set((p.size * (1 - 0.4 * k) * L.spark.pixelGrow) / p.s.texture.width);
    }
    const wp = wandPos(this.clock, this.w, this.h, S.path);
    this.wand.position.set(wp.x, wp.y);
    // Farbmuster oben links
    this.swatches.clear();
    cols.slice(0, 6).forEach((c, i) => this.swatches.circle(18 + i * 18, 18, 6).fill(c).stroke({ width: 1.5, color: C.panelLine }));
  }
}

/** Himmel Vorschau: eine Kachel je Stimmung (Menü, Small, Big, Boss, Shop), bei wandernden Himmeln im Zeitraffer */
class SkyPreview extends Container {
  private readonly tiles: Graphics[] = [];
  private readonly tileW: number;
  private readonly tileH: number;

  constructor(private readonly skyId: string, w: number, h: number) {
    super();
    const gap = L.sky.gap;
    this.tileW = Math.floor((w - gap * (SKY_PREVIEW_MOODS.length - 1)) / SKY_PREVIEW_MOODS.length);
    this.tileH = h - L.mini.skyLabelH;
    SKY_PREVIEW_MOODS.forEach((m, i) => {
      const g = new Graphics();
      g.position.set(i * (this.tileW + gap), 0);
      this.tiles.push(g);
      const lb = label(moodLabel(m), L.sky.labelSize, C.textDim);
      lb.position.set(i * (this.tileW + gap) + this.tileW / 2, this.tileH + L.mini.skyLabelH * 0.6);
      this.addChild(g, lb);
    });
    this.draw(0);
  }

  get drifts(): boolean {
    const c = getCosmetic(this.skyId);
    return !!c && c.category === 'sky' && !!c.params.hueDrift;
  }

  draw(phaseS: number) {
    const sw = skyMoodSwatches(this.skyId, phaseS);
    SKY_PREVIEW_MOODS.forEach((m, i) => drawSky(this.tiles[i], sw[m], this.tileW, this.tileH));
  }
}

// ───────────────────────────────────────────── Fenster

/** Wunderkammer: Kosmetik ausrüsten (Kartenrücken, Kartenfarben, Himmel, Funken, Titel). */
export function buildWardrobe(box: Container, close: () => void, opts?: { tab?: CosmeticCategory }) {
  const W = L.w;
  let tab: CosmeticCategory = opts?.tab && WARDROBE_TABS.includes(opts.tab) ? opts.tab : lastTab;
  lastTab = tab;
  let page = 0;
  let selKey = '';

  const head = label(t('Wunderkammer'), 38);
  head.position.set(W / 2, L.head.y);
  box.addChild(head);
  const dyn = new Container();
  box.addChild(dyn);

  // Takt nur, solange eine laufende Vorschau (Funken, wandernder Himmel) sichtbar ist
  let anim: ((dtMs: number, nowMs: number) => void) | null = null;
  const tick = (tk: Ticker) => {
    if (box.destroyed || dyn.destroyed) { Ticker.shared.remove(tick); return; }
    anim?.(tk.deltaMS, Date.now());
  };
  const setAnim = (fn: typeof anim) => {
    anim = fn;
    Ticker.shared.remove(tick);
    if (fn) Ticker.shared.add(tick);
  };
  box.on('destroyed', () => { anim = null; Ticker.shared.remove(tick); });

  const owned = (it: WardrobeItem) => it.isDefault || isOwned(getProfile(), it.cosmeticId);
  const currentEquippedId = (cat: CosmeticCategory): string => {
    const p = getProfile();
    const id = equippedId(p, cat);
    return id && isOwned(p, id) ? id : '';
  };
  const itemEquipped = (it: WardrobeItem) => isEquipped(it, currentEquippedId(it.cat), effectiveCardPalette());
  const sortedItems = (cat: CosmeticCategory) => sortItems(wardrobeItems(cat), owned);

  /** Reiter öffnen: das ausgerüstete Stück ist gewählt, die Seite zeigt es */
  const enterTab = (cat: CosmeticCategory) => {
    tab = cat;
    lastTab = cat;
    const items = sortedItems(cat);
    const i = items.findIndex(itemEquipped);
    selKey = (items[i] ?? items[0]).key;
    page = pageOfIndex(i, perPage(cat));
  };
  enterTab(tab);

  const doEquip = (it: WardrobeItem) => {
    const p = getProfile();
    if (!owned(it)) return;
    if (it.cat === 'palette' && it.palette) updateSettings({ cardPalette: it.palette });
    if (equip(p, it.cat, it.cosmeticId)) {
      saveProfile();
      sfx.select(true);
      haptics.select(true);
    }
    render();
  };

  // ── Kopf: Zähler, Pokale und Leiste der aktuellen Wahl
  const renderHead = () => {
    const p = getProfile();
    const all = totalCounts((id) => isOwned(p, id));
    const cnt = label(t('{a} von {b} Stücken', { a: all.have, b: all.total }), 20, C.textDim);
    cnt.anchor.set(0, 0.5);
    cnt.position.set(L.pad, L.head.y);
    const cup = label(t('{n} Pokale', { n: fmt(p.trophies.total) }), 20, C.money);
    cup.anchor.set(1, 0.5);
    cup.position.set(W - L.pad, L.head.y);
    dyn.addChild(cnt, cup);

    const S = L.strip;
    WARDROBE_TABS.forEach((cat, i) => {
      const x = L.pad + i * (S.chipW + S.gap);
      const item = wardrobeItems(cat).find(itemEquipped) ?? wardrobeItems(cat)[0];
      const chip = new Container();
      chip.position.set(x, S.y);
      const active = cat === tab;
      chip.addChild(new Graphics()
        .roundRect(0, 3, S.chipW, S.h, 12).fill({ color: 0, alpha: 0.35 })
        .roundRect(0, 0, S.chipW, S.h, 12).fill(0x172130).stroke({ width: active ? 3 : 2, color: active ? C.accent : C.panelLine }));
      let tx = 16;
      if (cat !== 'title') {
        const art = miniArt(item, S.thumbW, S.thumbH, true);
        art.position.set(S.thumbX + S.thumbW / 2 + 2, S.h / 2);
        chip.addChild(art);
        tx = S.thumbX + S.thumbW + 14;
      }
      const maxW = S.chipW - tx - 10;
      const cl = label(categoryName(cat), 13, C.textDim);
      cl.anchor.set(0, 0.5);
      cl.position.set(tx, 16);
      const nl = label(item.name, 17, item.isDefault ? C.textDim : C.text);
      nl.anchor.set(0, 0.5);
      nl.position.set(tx, 38);
      for (const l2 of [cl, nl]) if (l2.width > maxW) l2.scale.set(maxW / l2.width);
      chip.addChild(cl, nl);
      chip.eventMode = 'static';
      chip.cursor = 'pointer';
      chip.on('pointertap', () => { if (cat !== tab) { sfx.click(); haptics.tap(); enterTab(cat); render(); } });
      dyn.addChild(chip);
    });
  };

  // ── Kachel und Listenzeile
  const addTile = (it: WardrobeItem, x: number, y: number, state: ItemState, selected: boolean) => {
    const T = L.tile;
    const fr = RARITY_FRAME[it.rarity ?? 'common'];
    const locked = state === 'locked';
    const c = new Container();
    c.position.set(x, y);
    c.addChild(new Graphics()
      .roundRect(0, 4, T.w, T.h, L.frame.radius).fill({ color: 0, alpha: 0.35 })
      .roundRect(0, 0, T.w, T.h, L.frame.radius).fill(locked ? L.frame.locked : L.frame.owned)
      .stroke({ width: fr.width, color: fr.color, alpha: locked ? 0.55 : 1 }));
    if (selected) c.addChild(new Graphics().roundRect(-3, -3, T.w + 6, T.h + 6, L.frame.radius + 3).stroke({ width: 3, color: L.frame.selected }));
    const art = miniArt(it, T.w - 28, T.previewH, false);
    art.position.set(T.w / 2, T.previewY + T.previewH / 2);
    c.addChild(art);
    if (locked) {
      art.alpha = 0.4;
      c.addChild(new Graphics().roundRect(6, T.previewY, T.w - 12, T.previewH, 8).fill({ color: 0x0a0f18, alpha: 0.5 }));
      const lk = lockIcon(L.badge.size + 6, 0xc5d3e6);
      lk.position.set(T.w / 2, T.previewY + T.previewH / 2);
      c.addChild(lk);
    }
    const name = wrapText(it.name, T.w - 16, T.nameSize, locked ? C.textDim : C.text);
    name.position.set(T.w / 2, T.nameY);
    if (name.height > T.nameSize * 2.7) name.scale.set((T.nameSize * 2.7) / name.height);
    c.addChild(name);
    let cap: string, capColor: number;
    if (state === 'equipped') { cap = t('Ausgerüstet'); capColor = C.green; }
    else if (state === 'owned') { cap = it.rarity ? RARITY_LABEL[it.rarity] : t('Standard'); capColor = it.rarity ? fr.color : C.textDim; }
    else {
      const li = lockInfo(getProfile().trophies, it.cosmeticId);
      cap = li.source === 'none' ? t('Gesperrt') : li.reached ? t('Bereit im Pokalpfad') : t('ab {n} Pokale', { n: fmt(li.max) });
      capColor = li.reached ? C.green : C.textDim;
    }
    const cl = label(cap, T.captionSize, capColor, { fontWeight: '600' });
    cl.position.set(T.w / 2, T.h - 17);
    if (cl.width > T.w - 14) cl.scale.set((T.w - 14) / cl.width);
    c.addChild(cl);
    if (state === 'equipped') {
      const b = checkBadge(L.badge.size, L.frame.equipped);
      b.position.set(T.w - 18, 18);
      c.addChild(b);
    }
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => { sfx.select(true); haptics.select(true); selKey = it.key; render(); });
    dyn.addChild(c);
  };

  const addRow = (it: WardrobeItem, x: number, y: number, state: ItemState, selected: boolean) => {
    const R = L.list;
    const fr = RARITY_FRAME[it.rarity ?? 'common'];
    const locked = state === 'locked';
    const c = new Container();
    c.position.set(x, y);
    c.addChild(new Graphics()
      .roundRect(0, 4, R.w, R.h, 12).fill({ color: 0, alpha: 0.35 })
      .roundRect(0, 0, R.w, R.h, 12).fill(locked ? L.frame.locked : L.frame.owned)
      .stroke({ width: fr.width, color: fr.color, alpha: locked ? 0.55 : 1 }));
    if (selected) c.addChild(new Graphics().roundRect(-3, -3, R.w + 6, R.h + 6, 15).stroke({ width: 3, color: L.frame.selected }));
    const iconW = 44;
    const rar = it.rarity ? RARITY_LABEL[it.rarity] : t('Standard');
    const rl = label(rar, 14, locked ? C.textDim : it.rarity ? fr.color : C.textDim, { fontWeight: '600' });
    rl.anchor.set(1, 0.5);
    rl.position.set(R.w - iconW - 8, R.h / 2);
    const nl = label(it.name, 20, locked ? C.textDim : C.text);
    nl.anchor.set(0, 0.5);
    nl.position.set(18, R.h / 2);
    const maxW = R.w - iconW - 18 - rl.width - 24;
    if (nl.width > maxW) nl.scale.set(maxW / nl.width);
    c.addChild(nl, rl);
    if (state === 'equipped') {
      const b = checkBadge(L.badge.size, L.frame.equipped);
      b.position.set(R.w - 28, R.h / 2);
      c.addChild(b);
    } else if (locked) {
      const lk = lockIcon(L.badge.size, 0xc5d3e6);
      lk.position.set(R.w - 28, R.h / 2);
      c.addChild(lk);
    }
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => { sfx.select(true); haptics.select(true); selKey = it.key; render(); });
    dyn.addChild(c);
  };

  // ── Große Vorschau rechts
  const renderDetail = (it: WardrobeItem, state: ItemState) => {
    const P = L.preview, D = L.detail;
    const fr = RARITY_FRAME[it.rarity ?? 'common'];
    const root = new Container();
    root.position.set(P.x, P.y);
    root.addChild(panel(P.w, P.h, 0x172130, 16));
    root.addChild(new Graphics().roundRect(2, 2, P.w - 4, P.h - 4, 15).stroke({ width: fr.width, color: fr.color, alpha: 0.9 }));
    dyn.addChild(root);

    const aw = P.w - D.padX * 2;
    const area = new Container();
    area.position.set(D.padX, D.areaY);
    root.addChild(area);
    const mid = { x: aw / 2, y: D.areaH / 2 };
    const backdrop = () => new Graphics().roundRect(0, 0, aw, D.areaH, 12).fill(0x0c1220).stroke({ width: 2, color: C.panelLine });
    setAnim(null);

    if (it.cat === 'back') {
      area.addChild(backdrop());
      const card = cardBack(C.cardBack, { backId: it.cosmeticId || undefined, ignoreEquipped: true });
      card.scale.set(L.back.scale);
      card.position.set(mid.x, mid.y);
      card.rotation = L.back.tilt;
      area.addChild(card);
      loop(card, 'rotation', L.back.tilt - L.back.swing, L.back.tilt + L.back.swing, L.back.swingMs);
    } else if (it.cat === 'palette') {
      area.addChild(backdrop());
      const tex = palettePreviewTextures(it.palette ?? DEFAULT_CARD_PALETTE);
      const cw = tex[0].width * L.palette.bigScale;
      const step = cw * L.palette.bigStep;
      tex.forEach((tx, i) => {
        const s = new Sprite(tx);
        s.anchor.set(0.5);
        s.scale.set(L.palette.bigScale);
        s.position.set(mid.x + (i - (tex.length - 1) / 2) * step, mid.y - 8);
        s.rotation = (i - (tex.length - 1) / 2) * L.palette.fan;
        area.addChild(s);
      });
      const pn = label(CARD_PALETTES[it.palette ?? DEFAULT_CARD_PALETTE].name, 16, C.textDim);
      pn.position.set(mid.x, D.areaH - 22);
      area.addChild(pn);
    } else if (it.cat === 'sky') {
      area.addChild(backdrop());
      const pad = L.mini.skyPad;
      const sky = new SkyPreview(it.cosmeticId, aw - pad * 2, D.areaH - pad * 2);
      sky.position.set(pad, pad);
      area.addChild(sky);
      if (sky.drifts) {
        const t0 = Date.now();
        setAnim((_dt, now) => sky.draw(((now - t0) / 1000) * L.sky.driftSpeed));
      }
    } else if (it.cat === 'spark') {
      const sp = new SparkPreview(it.cosmeticId, aw, D.areaH);
      area.addChild(sp);
      const note = label(t('Wirkt in der Grafikstufe Supernova'), 15, C.textDim, { fontWeight: '600' });
      note.position.set(mid.x, D.areaH - 20);
      if (note.width > aw - 24) note.scale.set((aw - 24) / note.width);
      area.addChild(note);
      setAnim((dt, now) => sp.update(dt, now));
    } else {
      area.addChild(backdrop());
      const p = getProfile();
      const rank = rankOf(p);
      const rl = label(t('{name}  ·  {unlocked} von {total} Erfolgen', { name: rank.name, unlocked: unlockedCount(p), total: ACHIEVEMENTS.length }), 22, rank.color);
      rl.position.set(mid.x, mid.y - 24);
      if (rl.width > aw - 24) rl.scale.set((aw - 24) / rl.width);
      const tl = label(it.isDefault ? t('Kein Titel') : it.name, 30, it.isDefault ? C.textDim : fr.color);
      tl.position.set(mid.x, mid.y + 22);
      if (tl.width > aw - 24) tl.scale.set((aw - 24) / tl.width);
      const cap = label(t('So steht es auf dem Home Bildschirm'), 14, C.textDim, { fontWeight: '600' });
      cap.position.set(mid.x, D.areaH - 22);
      area.addChild(rl, tl, cap);
    }

    const textW = P.w - D.padX * 2;
    const nm = label(it.name, 28);
    nm.position.set(P.w / 2, D.nameY);
    if (nm.width > textW) nm.scale.set(textW / nm.width);
    const metaText = `${it.rarity ? RARITY_LABEL[it.rarity] : t('Standard')} · ${categoryName(it.cat)}`;
    const meta = label(metaText, 18, it.rarity ? fr.color : C.textDim);
    meta.position.set(P.w / 2, D.metaY);
    const desc = wrapText(it.description, textW, D.descSize, C.text);
    desc.position.set(P.w / 2, D.descY);
    root.addChild(nm, meta, desc);

    // Aktion: ausgerüstet, ausrüsten oder Hinweis auf die Quelle
    if (state === 'equipped') {
      const pill = new Container();
      pill.position.set(P.w / 2, D.actionY + D.btnH / 2);
      pill.addChild(new Graphics().roundRect(-D.btnW / 2, -D.btnH / 2, D.btnW, D.btnH, 12).fill(0x1c4a36).stroke({ width: 3, color: L.frame.equipped }));
      const b = checkBadge(L.badge.size, L.frame.equipped);
      b.position.set(-D.btnW / 2 + 36, 0);
      const tx = label(t('Ausgerüstet'), 24, C.text);
      tx.position.set(14, 0);
      pill.addChild(b, tx);
      root.addChild(pill);
    } else if (state === 'owned') {
      const btn = new Button(t('Ausrüsten'), D.btnW, D.btnH, 0x2f9f7a, () => doEquip(it), 26);
      btn.position.set(P.w / 2, D.actionY + D.btnH / 2);
      root.addChild(btn);
    } else {
      const li = lockInfo(getProfile().trophies, it.cosmeticId);
      const lk = lockIcon(26, 0xc5d3e6);
      lk.position.set(D.padX + 14, D.actionY + 14);
      const l1 = wrapText(li.title, textW - 40, 18, C.text, 'left');
      l1.position.set(D.padX + 40, D.actionY);
      root.addChild(lk, l1);
      let y = D.actionY + l1.height + 6;
      if (li.reached || li.detail) {
        const l2 = wrapText(li.reached ? t('Erreicht, im Pokalpfad abholen') : li.detail, textW - 40, 17, li.reached ? C.green : C.textDim, 'left');
        l2.position.set(D.padX + 40, y);
        root.addChild(l2);
        y += l2.height + 14;
      }
      if (li.max > 0) {
        const bw = textW - 130;
        root.addChild(bar(D.padX, y + 4, bw, li.frac, li.reached ? C.green : C.chips));
        const pt = label(`${fmt(li.cur)} / ${fmt(li.max)}`, 16, C.textDim);
        pt.anchor.set(1, 0.5);
        pt.position.set(P.w - D.padX, y + 4 + D.barH / 2);
        root.addChild(pt);
      }
    }
  };

  // ── Alles neu aufbauen
  const render = () => {
    for (const c of [...dyn.children]) c.destroy({ children: true });
    setAnim(null);
    const p = getProfile();
    renderHead();

    const tabs = WARDROBE_TABS.map((cat) => {
      const n = categoryCounts(cat, (id) => isOwned(p, id));
      return { id: cat, name: t('{name} {a}/{b}', { name: categoryName(cat), a: n.have, b: n.total }) };
    });
    const tb = tabBar(tabs, W - L.pad * 2, tab, (id) => { sfx.click(); haptics.tap(); enterTab(id); render(); }, L.tabs.size);
    tb.position.set(L.pad, L.tabs.y);
    dyn.addChild(tb);

    const items = sortedItems(tab);
    const per = perPage(tab);
    const pages = pageCount(items.length, per);
    page = Math.min(page, pages - 1);
    const sel = items.find((x) => x.key === selKey) ?? items[0];
    selKey = sel.key;

    const isList = tab === 'title';
    pageSlice(items, page, per).forEach((it, i) => {
      const st = itemState(owned(it), itemEquipped(it));
      const sizeW = isList ? L.list.w : L.tile.w, sizeH = isList ? L.list.h : L.tile.h;
      const gx = isList ? L.list.gapX : L.tile.gapX, gy = isList ? L.list.gapY : L.tile.gapY;
      const cols = isList ? L.list.cols : L.tile.cols;
      const pos = cellPos(i, cols, sizeW, sizeH, gx, gy);
      if (isList) addRow(it, L.pad + pos.x, L.gridY + pos.y, st, it.key === selKey);
      else addTile(it, L.pad + pos.x, L.gridY + pos.y, st, it.key === selKey);
    });

    renderDetail(sel, itemState(owned(sel), itemEquipped(sel)));

    const n = categoryCounts(tab, (id) => isOwned(p, id));
    const info = label(t('{name}: {a} von {b}', { name: categoryName(tab), a: n.have, b: n.total }), 20, C.textDim);
    info.anchor.set(0, 0.5);
    info.position.set(L.pad, L.foot.y);
    dyn.addChild(info);
    if (pages > 1) {
      const prev = new Button('‹', 70, 56, 0x3b5068, () => { page = (page + pages - 1) % pages; render(); }, 30);
      prev.position.set(L.foot.pagerX[0], L.foot.y);
      const next = new Button('›', 70, 56, 0x3b5068, () => { page = (page + 1) % pages; render(); }, 30);
      next.position.set(L.foot.pagerX[2], L.foot.y);
      const pl = label(t('Seite {a} von {b}', { a: page + 1, b: pages }), 16, C.textDim);
      pl.position.set(L.foot.pagerX[1], L.foot.y);
      dyn.addChild(prev, next, pl);
    }
  };
  render();

  const closeBtn = new Button(t('Schließen'), 220, 60, 0xf2711c, close, 24);
  closeBtn.position.set(W - 150, L.foot.y + 2);
  box.addChild(closeBtn);
}
