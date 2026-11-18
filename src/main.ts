import './core/index';
import { Application, Text, Ticker } from 'pixi.js';
import { QUALITY_PROFILE, FPS_WINDOW_MS } from './data/juice';
import { getSettings, onSettings } from './settings';
import { registerSW } from 'virtual:pwa-register';
import { Background } from './ui/Background';
import { sfx } from './ui/audio';
import { CrtFilter } from './ui/crt';
import { Game } from './ui/Game';
import { FpsMeter } from './ui/perf';
import { setTextResolution } from './ui/textRes';
import { FONT } from './ui/theme';
import { computeView, isPhone } from './ui/viewport';

async function main() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: 0x14275a,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, QUALITY_PROFILE[getSettings().quality].maxResolution),
    autoDensity: true,
    preference: 'webgl',
  });
  document.body.appendChild(app.canvas);

  const bg = new Background();
  const game = new Game({ setMood: (mood, bossColor) => bg.setMood(mood, bossColor) });
  app.stage.addChild(bg, game.root);

  // CRT Filter über der ganzen Szene, abschaltbar in den Optionen und in der Grafikstufe Sparsam
  const crt = new CrtFilter();
  app.stage.filterArea = app.screen;
  const applyCrt = () => {
    const st = getSettings();
    app.stage.filters = st.crt && QUALITY_PROFILE[st.quality].crt ? [crt.filter] : [];
  };
  applyCrt();

  // Grafikstufe: Bildrate und Auflösung deckeln (sparsam), Änderungen gelten sofort
  const applyQuality = () => {
    const prof = QUALITY_PROFILE[getSettings().quality];
    Ticker.shared.maxFPS = prof.maxFps;
    const res = Math.min(window.devicePixelRatio || 1, prof.maxResolution);
    if (app.renderer.resolution !== res) app.renderer.resolution = res;
  };
  applyQuality();

  // Kleine FPS Anzeige oben rechts (Option), für die Prüfung auf dem iPad
  const fpsText = new Text({ text: '', style: { fontFamily: FONT, fontSize: 14, fontWeight: '700', fill: 0xffffff, stroke: { color: 0x000000, width: 3 } } });
  fpsText.anchor.set(1, 0);
  fpsText.eventMode = 'none';
  app.stage.addChild(fpsText);
  const meter = new FpsMeter(FPS_WINDOW_MS);
  const applyFps = () => { fpsText.visible = getSettings().fps; };
  applyFps();
  onSettings(() => { applyCrt(); applyQuality(); applyFps(); });

  // Audio startet erst nach einer Berührung (iPad)
  for (const type of ['pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(type, () => sfx.unlock(), { capture: true });

  const resize = () => {
    const w = app.screen.width;
    const h = app.screen.height;
    bg.resize(w, h);
    crt.resize(app.renderer.width, app.renderer.height, app.renderer.resolution);
    // Handy im Hochformat: Spielfeld wird gedreht, damit es im Querformat erscheint.
    const t = computeView(w, h, isPhone(window.screen.width, window.screen.height));
    game.root.rotation = t.rotation;
    game.root.scale.set(t.scale);
    game.root.position.set(t.x, t.y);
    setTextResolution(app.renderer.resolution * t.scale, app.stage);
    fpsText.position.set(w - 8, 6);
  };
  app.renderer.on('resize', resize);
  resize();

  // Android (installiert als PWA): Querformat fest anfordern, wo es erlaubt ist. iOS ignoriert das.
  const lockLandscape = () => {
    try { (screen.orientation as any)?.lock?.('landscape')?.catch(() => {}); } catch { /* nicht unterstützt */ }
  };
  window.addEventListener('pointerdown', lockLandscape, { once: true });

  Ticker.shared.add((t) => {
    bg.update(t.deltaMS);
    crt.update(t.deltaMS);
    if (fpsText.visible && meter.tick(t.deltaMS)) fpsText.text = meter.text();
  });
}

registerSW({ immediate: true });
main();
