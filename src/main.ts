import './core/index';
import { Application, Ticker } from 'pixi.js';
import { registerSW } from 'virtual:pwa-register';
import { Background } from './ui/Background';
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

  const resize = () => {
    const w = app.screen.width;
    const h = app.screen.height;
    bg.resize(w, h);
    const s = Math.min(w / VIEW_W, h / VIEW_H);
    game.root.scale.set(s);
    game.root.position.set((w - VIEW_W * s) / 2, (h - VIEW_H * s) / 2);
  };
  app.renderer.on('resize', resize);
  resize();

  Ticker.shared.add((t) => bg.update(t.deltaMS));
}

registerSW({ immediate: true });
main();
