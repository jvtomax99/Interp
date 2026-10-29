/* The joined video's title cards (cards.html, n = 0 opening, 1-4 chapters) as stills, out/card<n>.png.
   node promo/claude-guide/tools/cards.cjs */
const path = require('path'), { chromium } = require('playwright');
const PROJ = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const n of [0, 1, 2, 3, 4]) {
    await p.goto('file://' + path.join(PROJ, 'cards.html') + '?n=' + n, { waitUntil: 'domcontentloaded' });
    await p.evaluate(() => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 4000))])); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(PROJ, 'out', `card${n}.png`) });
  }
  await b.close(); console.log('cards ok');
})();
