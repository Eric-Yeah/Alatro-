// Beschriftete Vorschaublätter aus preview/<kind>.png und preview/<kind>.json (siehe tools/artsheet.ts).
// Aufruf: npx vite-node tools/artsheet.ts --kind consumables --scale 4 --cols 8 --out /tmp/roh
//         node tools/artsheet-named.cjs consumables /tmp/roh   (benötigt Playwright, zweites Argument: Ordner mit Rohblatt)
// Schreibt preview/consumables-named.png bzw. preview/packs.png
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const kind = process.argv[2] || 'consumables';
const dir = path.join(__dirname, '..', 'preview');
const raw = process.argv[3] || dir;
const meta = JSON.parse(fs.readFileSync(path.join(raw, `${kind}.json`), 'utf8'));
const png = 'data:image/png;base64,' + fs.readFileSync(path.join(raw, `${kind}.png`)).toString('base64');
const font = fs.readFileSync(path.join(__dirname, '..', 'src/assets/alatro-pixel.ttf')).toString('base64');
const s = meta.scale;
const GROUPS = {
  sternbild: 'Sternbilder (Mitternachtsblau mit Gold)',
  elixier: 'Elixiere (Smaragd mit Gold)',
  omen: 'Omen (Violett mit Silber)',
  joker: 'Joker Packs (Karminrot, Gold)',
  karten: 'Karten Packs (Königsblau, Creme)',
};
const cell = (n) => `<div class="c"><div class="t" style="width:${n.w * s}px;height:${n.h * s}px;background:url(${png}) -${n.x * s}px -${n.y * s}px;background-size:${(meta.cols * (meta.cw + meta.gap) + meta.gap) * s}px auto"></div><div class="n">${n.name}</div></div>`;
let body = '';
if (kind === 'packs') {
  // Zeilen je Art, Spalten Normal, Jumbo, Mega
  const order = ['joker', 'karten', 'sternbild', 'elixier', 'omen'];
  for (const g of order) {
    const items = meta.names.filter((n) => n.group === g);
    body += `<h2>${{ ...GROUPS, sternbild: 'Sternbild Packs (Mitternachtsblau, Gold)', elixier: 'Elixier Packs (Smaragd, rotes Siegel)', omen: 'Omen Packs (Violett, Silber)' }[g]}</h2><div class="g p">${items.map(cell).join('')}</div>`;
  }
} else {
  for (const g of ['sternbild', 'elixier', 'omen']) {
    const items = meta.names.filter((n) => n.group === g);
    body += `<h2>${GROUPS[g]}, ${items.length} Karten</h2><div class="g">${items.map(cell).join('')}</div>`;
  }
}
const cw = meta.cw * s;
const html = `<html><style>@font-face{font-family:P;src:url(data:font/ttf;base64,${font})}
body{margin:0;background:#14121f;color:#fff3d1;font:700 15px system-ui;padding:20px;width:max-content}
h1{font:34px P;margin:0 0 4px}h2{font:24px P;margin:22px 0 10px;color:#f2b92c}
.g{display:grid;grid-template-columns:repeat(${kind === 'packs' ? 3 : 8},${cw}px);gap:14px 18px;align-items:end}
.p{gap:14px 40px}.c{text-align:center}.t{image-rendering:pixelated;margin:0 auto}.n{margin-top:5px;height:20px}</style>
<h1>${kind === 'packs' ? 'Alatro Booster Packs' : 'Alatro Consumables'}</h1><div style="color:#9fb4cc;margin-bottom:6px">${kind === 'packs' ? '5 Arten in 3 Größen: Normal, Jumbo, Mega' : '42 Karten: 12 Sternbilder, 21 Elixiere, 9 Omen'}</div>${body}</html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 2 });
  await p.setContent(html);
  await p.waitForTimeout(300);
  await p.locator('body').screenshot({ path: path.join(dir, kind === 'packs' ? 'packs.png' : 'consumables-named.png') });
  await b.close();
})();
