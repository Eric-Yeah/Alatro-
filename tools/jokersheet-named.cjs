// Beschriftetes Blatt aus preview/jokers.json und preview/jokers.png (nur Vorschau, per Playwright).
// Aufruf: npx vite-node tools/jokersheet.ts --per 100 --cols 10 --scale 4, dann preview/jokers-1.png in jokers.png umbenennen,
// danach node tools/jokersheet-named.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'preview');
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'jokers.json'), 'utf8'));
const png = 'data:image/png;base64,' + fs.readFileSync(path.join(dir, 'jokers.png')).toString('base64');
const s = meta.scale, tw = meta.tileW * s, th = meta.tileH * s;
const cell = (n) => `<div class="c"><div class="t" style="width:${tw}px;height:${th}px;background:url(${png}) -${n.x * s}px -${n.y * s}px;"></div><div class="n">${n.name}</div></div>`;
const html = `<html><body style="margin:0;background:#14121f;color:#fff3d1;font:600 15px system-ui"><style>.g{display:grid;grid-template-columns:repeat(8,${tw}px);gap:14px 14px;padding:16px}.c{text-align:center}.t{image-rendering:pixelated}.n{margin-top:4px;height:20px}</style><div class="g">${meta.names.map(cell).join('')}</div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 8 * (tw + 14) + 34, height: 800 } });
  await p.setContent(html);
  await p.screenshot({ path: path.join(dir, 'jokers-named.png'), fullPage: true });
  await b.close();
})();
