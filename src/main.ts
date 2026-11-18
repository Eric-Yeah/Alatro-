import './core/index';
import { Application, Ticker } from 'pixi.js';
import { registerSW } from 'virtual:pwa-register';
import { Background } from './ui/Background';
import { createCrt, updateCrt } from './ui/Crt';
import { screenFx } from './ui/screenFx';
import { getSettings, onSettings } from './settings';
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
  const game = new Game();
  app.stage.addChild(bg, game.root);

  game.onMood = (key) => bg.setMood(key);

  // CRT Effekt über die ganze Szene, abschaltbar in den Einstellungen
  const crt = createCrt(app.renderer.resolution);
  const applyCrt = () => {
    app.stage.filters = getSettings().crt ? [crt] : [];
    app.stage.filterArea = app.screen;
  };
  onSettings(applyCrt);
  let baseX = 0;
  let baseY = 0;

  const resize = () => {
    const w = app.screen.width;
    const h = app.screen.height;
    bg.resize(w, h);
    const s = Math.min(w / VIEW_W, h / VIEW_H);
    game.root.scale.set(s);
    baseX = (w - VIEW_W * s) / 2;
    baseY = (h - VIEW_H * s) / 2;
    game.root.position.set(baseX, baseY);
    applyCrt();
  };
  app.renderer.on('resize', resize);
  resize();

  let clock = 0;
  Ticker.shared.add((t) => {
    bg.update(t.deltaMS);
    clock += t.deltaMS / 1000;
    updateCrt(crt, clock);
    screenFx.update(t.deltaMS);
    const s = game.root.scale.x;
    game.root.position.set(baseX + screenFx.offsetX * s, baseY + screenFx.offsetY * s);
  });
}

registerSW({ immediate: true });
main();
