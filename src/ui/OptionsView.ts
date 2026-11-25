import { Container, Graphics } from 'pixi.js';
import { CARD_PALETTES } from '../data/cardArt/cardPalettes';
import { effectiveCardPalette, ownedPalettes } from './cosmeticFx';
import { QUALITY_IDS, QUALITY_NAMES, SPEED_STEPS, VOLUME_STEP } from '../data/juice';
import { MUSIC_MIX, MUSIC_MIX_INFO, MUSIC_MIX_NAME, MUSIC_OFF, TRACK_IDS, getTrack } from '../data/music';
import { OPTIONS_LAYOUT, OPTIONS_TABS, type OptionsTab } from '../data/optionsLayout';
import { LANGS, LANG_NAMES, getLang, t } from '../i18n';
import { clampVolume, getSettings, updateSettings } from '../settings';
import { sfx } from './audio';
import { haptics } from './haptics';
import { languageRowTexts, switchLanguage } from './langSwitch';
import { slider, segmented, switchToggle } from './optionWidgets';
import { syncManager } from './syncManager';
import { C, STYLE, VIEW_BLEED, VIEW_H, VIEW_W } from './theme';
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

/** Astrolabium: zwei gegenläufig drehende Ringe mit Strichmarken, Sternwarten Zierde */
function buildAstrolabe(): Container {
  const { cx, cy, r, spinMs } = L.astrolabe;
  const root = new Container();
  root.position.set(cx, cy);
  root.eventMode = 'none';
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
  const outer = ring(r, 24, 12, 0.4);
  const inner = ring(r * 0.62, 12, 8, 0.3);
  const core = new Graphics().poly([0, -12, 4, 0, 0, 12, -4, 0]).fill({ color: C.money, alpha: 0.85 })
    .poly([-12, 0, 0, -4, 12, 0, 0, 4]).fill({ color: C.money, alpha: 0.85 });
  const dot = new Graphics().circle(r, 0, 5).fill({ color: C.money, alpha: 0.9 });
  outer.addChild(dot);
  root.addChild(outer, inner, core);
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
  const sidePanel = new Graphics()
    .roundRect(0, STYLE.shadowY, L.side.w, L.side.h, 16).fill(STYLE.shadowColor)
    .roundRect(0, 0, L.side.w, L.side.h, 16).fill({ color: C.panelDark, alpha: 0.94 }).stroke({ width: STYLE.outline, color: C.panelLine })
    .roundRect(5, 5, L.side.w - 10, L.side.h - 10, 12).stroke({ width: 1.5, color: C.holo, alpha: 0.3 });
  side.addChild(sidePanel);
  const astro = buildAstrolabe();
  astro.position.set(L.astrolabe.cx - L.side.x, L.astrolabe.cy - L.side.y);
  side.addChild(astro);
  const title = label(t('Optionen'), 52, C.text);
  title.position.set(L.side.w / 2, 72);
  const motto = label(t('Sternwarte der Alchemisten'), 18, C.money, { fontWeight: '600' });
  motto.position.set(L.side.w / 2, 120);
  if (motto.width > L.side.w - 40) motto.scale.set((L.side.w - 40) / motto.width);
  side.addChild(title, motto);

  // Inhaltsfläche
  const main = new Container();
  main.position.set(L.main.x, L.main.y);
  const mainPanel = new Graphics()
    .roundRect(0, STYLE.shadowY, L.main.w, L.main.h, 16).fill(STYLE.shadowColor)
    .roundRect(0, 0, L.main.w, L.main.h, 16).fill({ color: C.panelDark, alpha: 0.9 }).stroke({ width: STYLE.outline, color: C.panelLine })
    .roundRect(5, 5, L.main.w - 10, L.main.h - 10, 12).stroke({ width: 1.5, color: C.holo, alpha: 0.3 });
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
    const bg = new Graphics();
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
    const draw = () => {
      const active = lastTab === id;
      bg.clear();
      bg.roundRect(0, 0, L.tab.w, L.tab.h, STYLE.radius).fill(active ? 0x2c4a6e : 0x24354a).stroke({ width: STYLE.outline, color: C.panelLine });
      if (active) bg.rect(0, 10, 8, L.tab.h - 20).fill(C.accent);
      icon?.destroy();
      icon = tabIcon(id, active ? C.accent : C.textDim);
      icon.position.set(58, L.tab.h / 2);
      b.addChild(icon);
    };
    b.addChild(bg, name, sub);
    draw();
    tabButtons.set(id, draw);
    b.eventMode = 'static';
    b.cursor = 'pointer';
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
    const bg = new Graphics()
      .roundRect(0, 0, rowW, h, STYLE.radius).fill({ color: C.panel, alpha: 0.5 }).stroke({ width: STYLE.outline, color: C.panelLine })
      .rect(0, 8, 5, h - 16).fill({ color: C.holo, alpha: 0.45 });
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
    const line = new Graphics().rect(L.row.pad, 160, rowW, 3).fill({ color: C.holo, alpha: 0.25 });
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
      {
        // Standard und Hoher Kontrast immer, weitere Paletten nur, wenn sie als Kosmetik besessen werden
        const pals = ownedPalettes().map((id) => ({ id: id as string, name: CARD_PALETTES[id].name }));
        const cur = effectiveCardPalette();
        const pick = (id: string) => { const p = ownedPalettes().find((x) => x === id); if (p) set({ cardPalette: p }); renderTab(); };
        if (pals.length <= 2) choiceRow(t('Kartenfarben'), CARD_PALETTES[cur].description, pals, cur, 380, pick);
        else {
          const { card, h } = row(t('Kartenfarben'), CARD_PALETTES[cur].description, true);
          const seg = segmented(pals, cur, rowW - L.row.inner * 2, pick);
          seg.position.set(L.row.inner, h - L.control.h - 22);
          card.addChild(seg);
        }
      }
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
