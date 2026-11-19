// Screenshot des Sternenatlas aus dem echten Spiel (Dev Server auf Port 5173, Playwright).
// Aufruf: node tools/atlasShot.cjs <schluessel.json> <ausgabe.png> [reiter 0..8] [seite 0..] [url]
// Mit HOME_SHOT=<datei> wird nur der Home Bildschirm aufgenommen (zum Finden der Knopfposition).
const fs = require('node:fs');
const { chromium } = require('playwright');

const [keys, out, tab = '0', pageNo = '0', url = 'http://127.0.0.1:5173/'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const k = fs.readFileSync(keys, 'utf8');
  await page.addInitScript((r) => {
    try {
      localStorage.setItem('alatro.collection.v1', r);
      localStorage.setItem('alatro.collection.seen.v1', r);
      localStorage.setItem('alatro.patchSeen.v1', '0.6.2');
      localStorage.setItem('alatro.profile.v1', JSON.stringify({ tutorialOffered: true }));
    } catch (e) { /* ignorieren */ }
  }, k);
  await page.goto(url);
  await page.waitForTimeout(2500);
  if (process.env.HOME_SHOT) {
    await page.screenshot({ path: process.env.HOME_SHOT });
    await b.close();
    return;
  }
  await page.mouse.click(Number(process.env.ATLAS_X || 328), Number(process.env.ATLAS_Y || 700));
  await page.waitForTimeout(900);
  const w = (1200 - 8 * 8) / 9;
  await page.mouse.click(80 + 40 + w / 2 + Number(tab) * (w + 8), 181);
  await page.waitForTimeout(700);
  for (let i = 0; i < Number(pageNo); i++) {
    await page.mouse.click(720 + 150, 70 + 860 - 50);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: out });
  await b.close();
})();
