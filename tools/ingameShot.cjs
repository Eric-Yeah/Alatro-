// Screenshot aus dem echten Spiel: lädt einen Spielstand (tools/ingameSave.ts) und klickt auf Fortsetzen.
// Aufruf: node tools/ingameShot.cjs <spielstand.json> <ausgabe.png> [url] [wartezeit_ms] [hover x,y] [klick x,y]
// Der Dev Server muss laufen (npm run dev, Standard Port 5173). Benötigt Playwright.
const fs = require('node:fs');
const { chromium } = require('playwright');

const [save, out, url = 'http://localhost:5173/Alatro-/', wait = '900', hover = '', click = ''] = process.argv.slice(2);
const parse = (s) => (s ? s.split(',').map(Number) : null);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const run = fs.readFileSync(save, 'utf8');
  await page.addInitScript((r) => {
    try {
      localStorage.setItem('alatro.run.v1', r);
      localStorage.setItem('alatro.patchSeen.v1', '0.6.2');
      localStorage.setItem('alatro.hints.v1', JSON.stringify({ play: true, discard: true, sort: true, select: true }));
    } catch (e) { /* ignorieren */ }
  }, run);
  await page.goto(url);
  await page.waitForTimeout(2500);
  await page.mouse.click(720, 468);
  await page.waitForTimeout(Number(wait));
  const h = parse(hover);
  if (h) { await page.mouse.move(h[0], h[1]); await page.waitForTimeout(300); }
  const c = parse(click);
  if (c) { await page.mouse.click(c[0], c[1]); await page.waitForTimeout(Number(wait)); }
  await page.screenshot({ path: out });
  await b.close();
})();
