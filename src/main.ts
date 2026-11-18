import './core/index';
import { Application, Ticker } from 'pixi.js';
import { getSettings, onSettings } from './settings';
import { registerSW } from 'virtual:pwa-register';
import { Background } from './ui/Background';
import { sfx } from './ui/audio';
import { CrtFilter } from './ui/crt';
import { Game } from './ui/Game';
import { VIEW_H, VIEW_W } from './ui/theme';

async function main() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: 0x1b1530,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  });
  document.body.appendChild(app.canvas);

  const bg = new Background();
  const game = new Game({ setMood: (mood, bossColor) => bg.setMood(mood, bossColor) });
  app.stage.addChild(bg, game.root);

  // CRT Filter über der ganzen Szene, abschaltbar in den Optionen
  const crt = new CrtFilter();
  app.stage.filterArea = app.screen;
  const applyCrt = () => { app.stage.filters = getSettings().crt ? [crt.filter] : []; };
  applyCrt();
  onSettings(applyCrt);

  // Audio startet erst nach einer Berührung (iPad)
  for (const type of ['pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(type, () => sfx.unlock(), { capture: true });

  const resize = () => {
    const w = app.screen.width;
    const h = app.screen.height;
    bg.resize(w, h);
    crt.resize(app.renderer.width, app.renderer.height, app.renderer.resolution);
    const s = Math.min(w / VIEW_W, h / VIEW_H);
    game.root.scale.set(s);
    game.root.position.set((w - VIEW_W * s) / 2, (h - VIEW_H * s) / 2);
  };
  app.renderer.on('resize', resize);
  resize();

  Ticker.shared.add((t) => {
    bg.update(t.deltaMS);
    crt.update(t.deltaMS);
  });
}

registerSW({ immediate: true });
main();
