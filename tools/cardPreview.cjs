// Erzeugt die Vorschau Bilder preview/cards-standard.png und preview/cards-contrast.png.
// Aufruf: node tools/cardPreview.cjs   (benötigt Playwright, Pixel Schrift aus src/assets)
const { execSync } = require('node:child_process');
const { mkdtempSync, readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const tmp = mkdtempSync(path.join(tmpdir(), 'alatro-cards-'));
execSync(`npx vite-node tools/cardSheet.ts ${tmp} 1`, { cwd: root, stdio: 'inherit' });
mkdirSync(path.join(root, 'preview'), { recursive: true });
const font = readFileSync(path.join(root, 'src/assets/alatro-pixel.ttf')).toString('base64');
const sheets = [
  { id: 'standard', file: 'cards-standard.png', title: 'Alatro Spielkarten: Standard', sub: 'Gedämpfte, dunkle Töne. Pik dunkelblau, Herz pink, Kreuz dunkelgrün, Karo orange.' },
  { id: 'kontrast', file: 'cards-contrast.png', title: 'Alatro Spielkarten: Hoher Kontrast', sub: 'Kräftige Farben. Pik dunkel, Herz rot, Kreuz blau, Karo gold.' },
];
(async () => {
  const b = await chromium.launch();
  // vergrößerte Bildkarten und Asse (nur J, Q, K, A), beide Paletten nebeneinander
  {
    const imgs = sheets.map((s) => readFileSync(path.join(tmp, `faces-${s.id}.png`)).toString('base64'));
    const page = await b.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 2 });
    await page.setContent(`<style>@font-face{font-family:P;src:url(data:font/ttf;base64,${font})}
      body{margin:0;background:#14275a;color:#fff;font-family:P,monospace;padding:24px;width:max-content}
      h1{font-size:34px;margin:0 0 6px}p{margin:0 0 18px;color:#9fb4cc;font-size:18px}
      .row{display:flex;gap:40px}h2{font-size:24px;margin:0 0 10px}
      img{image-rendering:pixelated;display:block;zoom:5}</style>
      <h1>Alatro: Ass, Bube, Dame, König</h1><p>Links Standard, rechts Hoher Kontrast. Spalten: Ass, Bube, Dame, König. Zeilen: Pik, Herz, Kreuz, Karo.</p>
      <div class=row><div><h2>Standard</h2><img id=i src="data:image/png;base64,${imgs[0]}"></div><div><h2>Hoher Kontrast</h2><img src="data:image/png;base64,${imgs[1]}"></div></div>`);
    await page.waitForSelector('#i');
    await page.locator('body').screenshot({ path: path.join(root, 'preview', 'cards-faces-zoom.png') });
    await page.close();
  }
  for (const s of sheets) {
    const img = readFileSync(path.join(tmp, `cards-${s.id}.png`)).toString('base64');
    const page = await b.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 2 });
    await page.setContent(`<style>@font-face{font-family:P;src:url(data:font/ttf;base64,${font})}
      body{margin:0;background:#14275a;color:#fff;font-family:P,monospace;padding:24px;width:max-content}
      h1{font-size:34px;margin:0 0 6px}p{margin:0 0 18px;color:#9fb4cc;font-size:18px}
      img{image-rendering:pixelated;display:block;zoom:3}</style>
      <h1>${s.title}</h1><p>${s.sub} Letzte Spalte: Kartenrücken.</p><img id=i src="data:image/png;base64,${img}">`);
    await page.waitForSelector('#i');
    await page.locator('body').screenshot({ path: path.join(root, 'preview', s.file) });
    await page.close();
  }
  await b.close();
})();
