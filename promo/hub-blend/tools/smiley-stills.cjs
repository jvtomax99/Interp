/* Step 3: six stills of the Dr. Smiley puppet at 540x960, one per move, on
   the real app screens from step 2. Serves the repo root so the page can
   load drsmiley/ and the reel's vendor/ and src/.
   Run from the repo root:  node promo/hub-blend/tools/smiley-stills.cjs */
const path = require('path');
const fs = require('fs');
const http = require('http');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }

const ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT = path.resolve(__dirname, '..', 'out', 'smiley');
const SHOTS = [['hop', 0.5, 'home'], ['land', 0.08, 'home'], ['type', 0.25, 'translate'], ['point', 0.8, 'glossary'], ['stepOut', 0.45, 'ask'], ['wave', 0.12, 'home']];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = http.createServer((q, r) => {
    const f = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const port = server.address().port;
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  for (const [move, u, screen] of SHOTS) {
    await page.goto(`http://localhost:${port}/promo/hub-blend/tools/smiley-stills.html?move=${move}&u=${u}&screen=${screen}`);
    await page.waitForFunction(() => document.title === 'ready', null, { timeout: 60000 });
    await page.locator('#c').screenshot({ path: path.join(OUT, `${move}.png`) });
    console.log(`${move}: ok`);
  }
  if (errs.length) console.log('errors:', errs.slice(0, 5));
  await browser.close(); server.close();
})();
