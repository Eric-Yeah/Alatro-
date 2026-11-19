// Bildschirmfoto der Hand im laufenden Spiel (Dev Server wird gestartet), deviceScaleFactor 2.
// Aufruf: node tools/cardIngame.cjs [palette] [ausgabe.png]
const { spawn } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const pal = process.argv[2] || 'standard';
const out = process.argv[3] || path.join(root, 'preview', 'cards-ingame-hand.png');
const port = 5197;

(async () => {
  const vite = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 5000));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  p.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await p.goto(`http://localhost:${port}/`);
  await p.waitForTimeout(2000);
  const ver = await p.evaluate(async (pal) => {
    const g = await import('/src/core/game.ts');
    const s = await import('/src/save.ts');
    const pn = await import('/src/data/patchnotes.ts');
    await import('/src/core/index.ts');
    const run = g.createRun({ seed: 'KARTEN1' });
    g.enterAnte(run); g.selectBlind(run);
    s.saveRun(run);
    localStorage.setItem('alatro.settings.v2', JSON.stringify({ cardPalette: pal, crt: false }));
    localStorage.setItem('alatro.patchSeen.v1', pn.APP_VERSION);
    return pn.APP_VERSION;
  }, pal);
  void ver;
  await p.reload();
  await p.waitForTimeout(2500);
  await p.evaluate(() => {
    let hit = null;
    const walk = (o) => { if (o.eventMode === 'static') { const c = o.children?.find?.((c) => c.text); if (c && /^Fortsetzen/.test(c.text) && !hit) hit = o; } o.children?.forEach(walk); };
    walk(globalThis.__PIXI_APP__.stage);
    hit && hit.emit('pointertap', { global: { x: 0, y: 0 }, stopPropagation() {}, pointerType: 'mouse' });
  });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: out, clip: { x: 360, y: 600, width: 1080, height: 400 } });
  await b.close();
  vite.kill();
})();
