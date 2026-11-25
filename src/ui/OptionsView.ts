import { Container, Graphics, Rectangle } from 'pixi.js';
import { CARD_PALETTES } from '../data/cardArt/cardPalettes';
import { QUALITY_IDS, QUALITY_NAMES, SPEED_STEPS, VOLUME_STEP } from '../data/juice';
import { MUSIC_MIX, MUSIC_MIX_INFO, MUSIC_MIX_NAME, MUSIC_OFF, TRACK_IDS, getTrack } from '../data/music';
import { OPTIONS_LAYOUT, OPTIONS_TABS, type OptionsTab } from '../data/optionsLayout';
import { LANGS, LANG_NAMES, getLang, t } from '../i18n';
import { clampVolume, getSettings, updateSettings } from '../settings';
import { BEVEL, SHADOW } from '../data/depth';
import { sfx } from './audio';
import { drawPlate, dropShadow, raised, sunken } from './depth';
import { lighten } from './depthMath';
import { haptics } from './haptics';
import { languageRowTexts, switchLanguage } from './langSwitch';
import { slider, segmented, switchToggle } from './optionWidgets';
import { syncManager } from './syncManager';
import { C, STYLE, VIEW_BLEED, VIEW_H, VIEW_W, shade } from './theme';
import { easeOutCubic, linear, tween } from './tween';
import { Button, label, wrapText } from './widgets';

const L = OPTIONS_LAYOUT;

export interface OptionsDeps {
  version: string;
  onBack: () => void;
  onBackup: () => void;
  onSync: () => void;
  /** Kurzer Probe Shake beim Einschalten von Screen Shake */
  shakePreview: () => void;
}

/** Zuletzt geöffneter Bereich (bleibt beim Zurückkehren aus Sichern oder Koppeln erhalten) */
let lastTab: OptionsTab = 'anzeige';

/** Kleine Symbole der Bereiche, in einer 40 mal 40 Fläche um den Nullpunkt gezeichnet */
function tabIcon(kind: OptionsTab, color: number): Graphics {
  const g = new Graphics();
  if (kind === 'anzeige') {
    g.roundRect(-17, -14, 34, 24, 3).stroke({ width: 3, color }).rect(-12, -9, 24, 14).fill({ color, alpha: 0.3 })
      .rect(-4, 10, 8, 5).fill(color).rect(-10, 15, 20, 3).fill(color);
  } else if (kind === 'ton') {
    g.poly([-17, -7, -9, -7, 1, -16, 1, 16, -9, 7, -17, 7]).fill(color)
      .arc(3, 0, 10, -0.9, 0.9).stroke({ width: 3, color })
      .arc(3, 0, 18, -0.9, 0.9).stroke({ width: 3, color });
  } else if (kind === 'spiel') {
    g.roundRect(-12, -17, 24, 34, 3).stroke({ width: 3, color }).poly([0, -8, 5, 0, 0, 8, -5, 0]).fill(color);
  } else {
    g.roundRect(-15, -16, 30, 9, 2).fill(color).roundRect(-15, -4, 30, 9, 2).fill({ color, alpha: 0.7 })
      .roundRect(-15, 8, 30, 9, 2).fill({ color, alpha: 0.45 });
  }
  return g;
}

/** Astrolabium: Messingschale mit zwei gegenläufig drehenden Ringen und leuchtendem Kern, Sternwarten Zierde */
function buildAstrolabe(): Container {
  const { cx, cy, r, spinMs } = L.astrolabe;
  const A = L.astrolabe;
  const root = new Container();
  root.position.set(cx, cy);
  root.eventMode = 'none';
  // Schale: helle Lippe unten, dunkle Kontur, vertiefter Grund mit Schatten am oberen Rand
  const well = new Graphics();
  const wr = r + A.wellPad;
  well.circle(0, 2, wr + 3).fill({ color: 0xffffff, alpha: 0.14 });
  well.circle(0, 0, wr + 3).fill(C.panelLine);
  well.circle(0, 0, wr).fill(A.wellColor);
  well.arc(0, 0, wr - 2, Math.PI * 1.08, Math.PI * 1.92).stroke({ width: 5, color: 0x000000, alpha: 0.38 });
  // Schein hinter dem Kern
  const core = new Graphics();
  core.circle(0, 0, A.glowR).fill({ color: C.money, alpha: A.glowAlpha });
  core.poly([0, -12, 4, 0, 0, 12, -4, 0]).fill({ color: C.money, alpha: 0.95 })
    .poly([-12, 0, 0, -4, 12, 0, 0, 4]).fill({ color: C.money, alpha: 0.95 })
    .poly([0, -12, 4, 0, 0, 0, -4, 0]).fill({ color: 0xffe9a6, alpha: 0.7 });
  const ring = (radius: number, ticks: number, long: number, alpha: number) => {
    const c = new Container();
    const g = new Graphics().circle(0, 0, radius).stroke({ width: 2, color: C.holo, alpha });
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2;
      const len = i % 3 === 0 ? long : long / 2;
      g.moveTo(Math.cos(a) * (radius - len), Math.sin(a) * (radius - len)).lineTo(Math.cos(a) * radius, Math.sin(a) * radius)
        .stroke({ width: 2, color: C.holo, alpha });
    }
    c.addChild(g);
    return c;
  };
  const outer = ring(r, 24, 12, 0.55);
  const inner = ring(r * 0.62, 12, 8, 0.4);
  const dot = new Graphics().circle(r, 0, 6).fill({ color: C.money, alpha: 0.95 }).circle(r - 1.5, -1.5, 2.2).fill({ color: 0xffffff, alpha: 0.7 });
  outer.addChild(dot);
  root.addChild(well, inner, outer, core);
  const spin = (c: Container, dir: number, ms: number) => {
    if (c.destroyed) return;
    c.rotation = 0;
    void tween(c, { rotation: dir * Math.PI * 2 }, ms, linear, true).then(() => spin(c, dir, ms));
  };
  spin(outer, 1, spinMs);
  spin(inner, -1, spinMs * 0.7);
  return root;
}

/**
 * Optionen als eigener Bildschirm: links Seitenleiste mit vier Bereichen, rechts die Einstellungen als Karten
 * mit Schaltern, Schiebereglern und Auswahlleisten. Alles wird sofort gespeichert und angewendet.
 */
export function buildOptions(deps: OptionsDeps): Container {
  const root = new Container();
  const dim = new Graphics().rect(-VIEW_BLEED, -VIEW_BLEED, VIEW_W + 2 * VIEW_BLEED, VIEW_H + 2 * VIEW_BLEED).fill({ color: 0x070b11, alpha: 0.55 });
  dim.eventMode = 'static';
  root.addChild(dim);

  // Seitenleiste
  const side = new Container();
  side.position.set(L.side.x, L.side.y);
  const sidePanel = raised(L.side.w, L.side.h, C.panelDark, { radius: 16, alpha: 1, rim: true, shadow: SHADOW.plate });
  side.addChild(sidePanel);
  const astro = buildAstrolabe();
  astro.position.set(L.astrolabe.cx - L.side.x, L.astrolabe.cy - L.side.y);
  side.addChild(astro);
  const title = label(t('Optionen'), 52, C.text);
  title.position.set(L.side.w / 2, 72);
  const motto = label(t('Sternwarte der Alchemisten'), 18, C.money, { fontWeight: '600' });
  motto.position.set(L.side.w / 2, 120);
  if (motto.width > L.side.w - 40) motto.scale.set((L.side.w - 40) / motto.width);
  const sideGroove = sunken(L.side.w - 2 * L.side.groovePad, L.side.grooveH, L.astrolabe.grooveColor, { radius: L.side.grooveH / 2, outline: 1, line: L.astrolabe.grooveLine });
  sideGroove.position.set(L.side.groovePad, L.side.grooveY);
  side.addChild(title, motto, sideGroove);

  // Inhaltsfläche
  const main = new Container();
  main.position.set(L.main.x, L.main.y);
  const mainPanel = raised(L.main.w, L.main.h, C.panelDark, { radius: 16, alpha: 1, rim: true, shadow: SHADOW.plate });
  main.addChild(mainPanel);
  const content = new Container();
  main.addChild(content);

  const TAB_INFO: Record<OptionsTab, { name: () => string; short: () => string; sub: () => string }> = {
    anzeige: { name: () => t('Anzeige'), short: () => t('Effekte, Karten'), sub: () => t('Wie das Spiel aussieht') },
    ton: { name: () => t('Ton'), short: () => t('Lautstärke, Musik'), sub: () => t('Lautstärke und Hintergrundmusik') },
    spiel: { name: () => t('Spiel'), short: () => t('Tempo, Sprache'), sub: () => t('Tempo, Vibration und Sprache') },
    daten: { name: () => t('Daten'), short: () => t('Sichern, Koppeln'), sub: () => t('Spielstand und andere Geräte') },
  };

  const tabButtons = new Map<OptionsTab, () => void>();
  OPTIONS_TABS.forEach((id, i) => {
    const b = new Container();
    b.position.set((L.side.w - L.tab.w) / 2, L.tab.y0 - L.side.y + i * (L.tab.h + L.tab.gap));
    const edge = BEVEL.panelEdge + 2;
    const shadow = dropShadow(L.tab.w, L.tab.h + edge, SHADOW.button, { radius: STYLE.radius });
    // Unterrand bleibt stehen, die Fläche mit Inhalt läuft beim Drücken hinein (wie bei Button)
    const base = new Graphics();
    const face = new Container();
    const faceG = new Graphics();
    const info = TAB_INFO[id];
    const name = label(info.name(), 30, C.text);
    name.anchor.set(0, 0.5);
    name.position.set(104, L.tab.h / 2 - 15);
    const sub = label(info.short(), 16, C.textDim, { fontWeight: '600' });
    sub.anchor.set(0, 0.5);
    sub.position.set(104, L.tab.h / 2 + 18);
    const maxW = L.tab.w - 104 - 16;
    if (sub.width > maxW) sub.scale.set(maxW / sub.width);
    let icon: Graphics | null = null;
    face.addChild(faceG, name, sub);
    const draw = () => {
      const active = lastTab === id;
      const color = active ? L.tab.activeColor : L.tab.color;
      base.clear()
        .roundRect(-STYLE.outline, -STYLE.outline, L.tab.w + 2 * STYLE.outline, L.tab.h + edge + 2 * STYLE.outline, STYLE.radius + STYLE.outline).fill(C.panelLine)
        .roundRect(0, 0, L.tab.w, L.tab.h + edge, STYLE.radius).fill(shade(color, BEVEL.edgeShade));
      faceG.clear();
      drawPlate(faceG, 0, 0, L.tab.w, L.tab.h, color, { edge: 0, outline: 0, sheen: active ? BEVEL.sheenH : 0.3 });
      if (active) {
        // leuchtender Akzentstreifen links und feiner Akzentrand: der gewählte Bereich ist eingedrückt und leuchtet
        faceG.roundRect(10, 14, 6, L.tab.h - 28, 3).fill(C.accent);
        faceG.roundRect(1, 1, L.tab.w - 2, L.tab.h - 2, STYLE.radius).stroke({ width: 2, color: C.accent, alpha: 0.55 });
      }
      icon?.destroy();
      icon = tabIcon(id, active ? C.accent : lighten(C.textDim, 0.1));
      icon.position.set(58, L.tab.h / 2);
      face.addChild(icon);
      name.style.fill = active ? 0xffffff : 0xdbe6f3;
      face.y = active ? BEVEL.press - 1 : 0;
      shadow.alpha = active ? SHADOW.button.alpha * 0.6 : SHADOW.button.alpha;
    };
    b.addChild(shadow, base, face);
    b.boundsArea = new Rectangle(-STYLE.outline, -STYLE.outline, L.tab.w + 2 * STYLE.outline, L.tab.h + edge + 2 * STYLE.outline);
    draw();
    tabButtons.set(id, draw);
    b.eventMode = 'static';
    b.cursor = 'pointer';
    b.hitArea = new Rectangle(0, 0, L.tab.w, L.tab.h + edge);
    b.on('pointerdown', () => { if (lastTab !== id) face.y = BEVEL.press; });
    b.on('pointerupoutside', () => { if (lastTab !== id) face.y = 0; });
    b.on('pointertap', () => {
      if (lastTab === id) return;
      sfx.click();
      haptics.tap();
      lastTab = id;
      for (const d of tabButtons.values()) d();
      renderTab();
    });
    side.addChild(b);
  });

  const back = new Button(t('Zurück'), 300, 64, C.chips, deps.onBack, 28);
  back.position.set(L.side.w / 2, L.side.h - 112);
  const ver = label(t('Version {version}', { version: deps.version }), 16, C.textDim, { fontWeight: '600' });
  ver.position.set(L.side.w / 2, L.side.h - 36);
  side.addChild(back, ver);

  // Zeilen
  let y = 0;
  const startRows = () => { y = L.row.y0 - L.main.y; };
  const rowW = L.main.w - L.row.pad * 2;

  /** Karte einer Einstellung. Mit `wide` liegt die Bedienung unter dem Text über die volle Breite. */
  const row = (name: string, desc: string, wide = false): { card: Container; h: number } => {
    const h = wide ? L.row.hWide : L.row.h;
    const card = new Container();
    card.position.set(L.row.pad, y);
    const bg = raised(rowW, h, L.row.color, { radius: STYLE.radius + 2, alpha: 1, sheen: L.row.sheen, edge: L.row.edge, shadow: L.row.shadow });
    // schmale leuchtende Markierung links
    bg.addChild(new Graphics().roundRect(L.row.markX, 14, 4, h - 28, 2).fill({ color: C.holo, alpha: 0.5 }));
    const n = label(name, 28, C.text);
    n.anchor.set(0, 0.5);
    n.position.set(L.row.inner, wide ? 34 : 36);
    const textW = wide ? rowW - L.row.inner * 2 : rowW - L.row.inner * 2 - 420;
    const d = wrapText(desc, textW, 17, C.textDim, 'left');
    d.position.set(L.row.inner, wide ? 60 : 62);
    card.addChild(bg, n, d);
    content.addChild(card);
    y += h + L.row.gap;
    return { card, h };
  };
  /** Bedienelement rechts, senkrecht in der Mitte der Karte (rechtsbündig) */
  const placeRight = (card: Container, h: number, ctl: Container, width: number) => {
    ctl.position.set(rowW - L.row.inner - width, (h - L.control.h) / 2);
    card.addChild(ctl);
  };
  /** Knopf rechts in der Karte (Button dreht um seine Mitte, darum Mittelpunkt setzen) */
  const buttonRight = (card: Container, h: number, text: string, color: number, tap: () => void, width = 250) => {
    const b = new Button(text, width, L.control.h, color, tap, 24);
    b.position.set(rowW - L.row.inner - width / 2, h / 2);
    card.addChild(b);
  };
  const toggleRow = (name: string, desc: string, on: boolean, change: (v: boolean) => void) => {
    const { card, h } = row(name, desc);
    placeRight(card, h, switchToggle(on, change), L.control.switchW);
  };
  const sliderRow = (name: string, desc: string, value: number, change: (v: number) => void) => {
    const { card, h } = row(name, desc);
    const total = L.control.sliderW + 30 + L.control.sliderValueW;
    const s = slider(value, VOLUME_STEP, change, () => sfx.chips(2));
    s.position.set(rowW - L.row.inner - total, h / 2);
    card.addChild(s);
  };
  const choiceRow = (name: string, desc: string, items: { id: string; name: string }[], current: string, width: number, pick: (id: string) => void, size = 22) => {
    const { card, h } = row(name, desc);
    placeRight(card, h, segmented(items, current, width, pick, size), width);
  };

  const renderTab = () => {
    for (const c of [...content.children]) c.destroy({ children: true });
    const info = TAB_INFO[lastTab];
    const head = label(info.name(), 44, C.text);
    head.anchor.set(0, 0.5);
    head.position.set(L.row.pad, 78);
    const sub = label(info.sub(), 20, C.textDim, { fontWeight: '600' });
    sub.anchor.set(0, 0.5);
    sub.position.set(L.row.pad, 126);
    const line = sunken(rowW, L.row.grooveH, L.astrolabe.grooveColor, { radius: L.row.grooveH / 2, outline: 1, line: L.astrolabe.grooveLine });
    line.position.set(L.row.pad, L.row.grooveY);
    content.addChild(head, sub, line);
    startRows();
    const st = getSettings();
    const set = (patch: Parameters<typeof updateSettings>[0]) => { updateSettings(patch); };

    if (lastTab === 'anzeige') {
      toggleRow(t('CRT Effekt'), t('Feine Scanlines und wandernder Hologramm Glanz'), st.crt, (v) => set({ crt: v }));
      toggleRow(t('Screen Shake'), t('Wackeln und Aufblitzen bei hohen Punkten'), st.shake, (v) => { set({ shake: v }); if (v) deps.shakePreview(); });
      choiceRow(
        t('Grafik'), st.quality === 'sparsam' ? t('30 FPS, ohne CRT und Edition Glanz') : st.quality === 'supernova' ? t('Funken, Orbs und Sternenstaub') : t('Volle Effekte'),
        QUALITY_IDS.map((id) => ({ id, name: QUALITY_NAMES[id] })), st.quality, 470,
        (id) => { const q = QUALITY_IDS.find((x) => x === id); if (q) set({ quality: q }); renderTab(); },
      );
      choiceRow(
        t('Kartenfarben'), CARD_PALETTES[st.cardPalette].description,
        Object.values(CARD_PALETTES).map((p) => ({ id: p.id, name: p.name })), st.cardPalette, 380,
        (id) => { const p = CARD_PALETTES[id as keyof typeof CARD_PALETTES]; if (p) set({ cardPalette: p.id }); renderTab(); },
      );
      toggleRow(t('FPS Anzeige'), t('Bildrate oben rechts, zum Prüfen der Leistung'), st.fps, (v) => set({ fps: v }));
    } else if (lastTab === 'ton') {
      sliderRow(t('Lautstärke'), t('Karten, Chips, Münzen und alle Effekte'), st.volume, (v) => set({ volume: clampVolume(v) }));
      sliderRow(t('Musiklautstärke'), t('Hintergrundmusik, relativ zur Lautstärke'), st.musicVolume, (v) => set({ musicVolume: clampVolume(v) }));
      const mt = getTrack(st.music);
      const musicDesc = st.music === MUSIC_MIX ? MUSIC_MIX_INFO : mt ? mt.info : t('Ruhige Hintergrundmusik, aus');
      const items = [
        { id: MUSIC_MIX, name: MUSIC_MIX_NAME },
        ...TRACK_IDS.map((id) => ({ id, name: getTrack(id)?.name ?? id })),
        { id: MUSIC_OFF, name: t('Aus') },
      ];
      const { card, h } = row(t('Musik'), musicDesc, true);
      const w = rowW - L.row.inner * 2;
      const seg = segmented(items, st.music, w, (id) => { set({ music: id }); renderTab(); });
      seg.position.set(L.row.inner, h - L.control.h - 22);
      card.addChild(seg);
    } else if (lastTab === 'spiel') {
      choiceRow(
        t('Animationstempo'), t('Zählen, Karten und Übergänge'),
        SPEED_STEPS.map((s) => ({ id: s.id, name: s.name })), st.speed, 400,
        (id) => { set({ speed: id }); renderTab(); }, 20,
      );
      toggleRow(
        t('Vibration'), haptics.supported ? t('Rückmeldung bei Berührung und Punkten') : t('Auf diesem Gerät nicht verfügbar (z. B. iPad)'), st.haptics,
        (v) => { set({ haptics: v }); if (v) haptics.victory(); else haptics.stop(); },
      );
      const lr = languageRowTexts();
      choiceRow(lr.name, lr.desc, LANGS.map((l) => ({ id: l, name: LANG_NAMES[l] })), getLang(), 380, (id) => switchLanguage(id as typeof LANGS[number]));
    } else {
      const coupled = syncManager.isCoupled();
      const r1 = row(t('Spielstand'), t('Sichern, übertragen und zurückladen'));
      buttonRight(r1.card, r1.h, t('Sichern'), C.chips, deps.onBackup);
      const r2 = row(t('Geräte koppeln'), coupled ? t('Gekoppelt, der Stand wird abgeglichen') : t('Einen Spielstand auf mehreren Geräten nutzen'));
      buttonRight(r2.card, r2.h, coupled ? t('Gekoppelt') : t('Koppeln'), coupled ? C.green : C.chips, deps.onSync);
      const r3 = row(t('Über Alatro'), t('Sternwarte der Alchemisten, ein privates Roguelike Poker Deckbuilder Spiel.'));
      const v = label(t('Version {version}', { version: deps.version }), 26, C.textDim);
      v.anchor.set(1, 0.5);
      v.position.set(rowW - L.row.inner, r3.h / 2);
      r3.card.addChild(v);
    }
    content.alpha = 0;
    void tween(content, { alpha: 1 }, 160, easeOutCubic);
  };

  root.addChild(side, main);
  renderTab();
  root.alpha = 0;
  void tween(root, { alpha: 1 }, 200, easeOutCubic);
  return root;
}
