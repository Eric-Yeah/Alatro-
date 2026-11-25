// Erzeugt die Vorschau preview/cosmetics.png: alle 17 Kartenrücken (beschriftet) und die Kartenpaletten.
// Aufruf: node tools/cosmeticPreview.cjs   (benötigt Playwright, Pixel Schrift aus src/assets)
const { execSync } = require('node:child_process');
const { mkdtempSync, readFileSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'alatro-cosmetics-'));
execSync(`npx vite-node tools/cosmeticSheet.ts ${tmp} 1`, { cwd: root, stdio: 'inherit' });
mkdirSync(path.join(root, 'preview'), { recursive: true });
const font = readFileSync(path.join(root, 'src/assets/alatro-pixel.ttf')).toString('base64');
const img = (name) => `data:image/png;base64,${readFileSync(path.join(tmp, name)).toString('base64')}`;

const backs = [
  ['back_sternenstaub', 'Sternenstaub'], ['back_kupferraute', 'Kupferraute'], ['back_mondphasen', 'Mondphasen'], ['back_retorte', 'Retortenglas'],
  ['back_astrolabium', 'Astrolabium'], ['back_tierkreis', 'Tierkreis'], ['back_nebelwirbel', 'Nebelwirbel'], ['back_goldadern', 'Goldadern'],
  ['back_sonnenfinsternis', 'Sonnenfinsternis'], ['back_kometenbahn', 'Kometenbahn'], ['back_deck_nachthimmel', 'Siegel des Nachthimmels'],
  ['back_deck_glut', 'Siegel der Glut'], ['back_deck_tiefsee', 'Siegel der Tiefsee'], ['back_deck_waage', 'Siegel der Waage'],
  ['back_deck_alchemist', 'Siegel des Alchemisten'], ['back_deck_sternenkind', 'Siegel des Sternenkinds'], ['back_deck_halbmond', 'Siegel des Halbmonds'],
];
const pals = [
  ['standard', 'Standard'], ['kontrast', 'Hoher Kontrast'], ['bernstein', 'Bernstein'], ['tintenmeer', 'Tintenmeer'], ['mondsilber', 'Mondsilber'], ['glutkern', 'Glutkern'],
];

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1700, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>@font-face{font-family:P;src:url(data:font/ttf;base64,${font})}
    body{margin:0;background:#14275a;color:#fff;font-family:P,monospace;padding:24px;width:1700px;box-sizing:border-box}
    h1{font-size:30px;margin:0 0 6px}h2{font-size:22px;margin:22px 0 10px;color:#cfe0ff}p{margin:0 0 12px;color:#9fb4cc;font-size:16px}
    .grid{display:flex;flex-wrap:wrap;gap:14px}.c{width:200px;text-align:center;font-size:15px}
    img{image-rendering:pixelated;display:block;margin:0 auto 6px}.back img{zoom:2}.pal img{zoom:1.1}.pal{width:auto}</style>
    <h1>Alatro Kosmetik: Kartenrücken und Paletten</h1><p>17 Rücken aus Code (10 Muster, 7 Deck Siegel) und die sechs Kartenpaletten (Beispiele: Ass, Dame, Sieben je Farbe).</p>
    <h2>Kartenrücken</h2><div class=grid>${backs.map(([id, n]) => `<div class="c back"><img src="${img(`back-${id}.png`)}">${n}</div>`).join('')}</div>
    <h2>Kartenpaletten</h2><div class=grid>${pals.map(([id, n]) => `<div class="c pal"><img src="${img(`pal-${id}.png`)}">${n}</div>`).join('')}</div>`);
  await page.waitForTimeout(300);
  await page.locator('body').screenshot({ path: path.join(root, 'preview', 'cosmetics.png') });
  await b.close();
})();
