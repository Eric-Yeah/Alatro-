import './core/index';
import { Application, Ticker } from 'pixi.js';
import { registerSW } from 'virtual:pwa-register';
import { Background } from './ui/Background';
import { Game } from './ui/Game';
import { computeView, isPhone } from './ui/viewport';

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
    // Handy im Hochformat: Spielfeld wird gedreht, damit es im Querformat erscheint.
    const t = computeView(w, h, isPhone(window.screen.width, window.screen.height));
    game.root.rotation = t.rotation;
    game.root.scale.set(t.scale);
    game.root.position.set(t.x, t.y);
  };
  app.renderer.on('resize', resize);
  resize();

  // Android (installiert als PWA): Querformat fest anfordern, wo es erlaubt ist. iOS ignoriert das.
  const lockLandscape = () => {
    try { (screen.orientation as any)?.lock?.('landscape')?.catch(() => {}); } catch { /* nicht unterstützt */ }
  };
  window.addEventListener('pointerdown', lockLandscape, { once: true });

  Ticker.shared.add((t) => bg.update(t.deltaMS));
}

registerSW({ immediate: true });
main();
