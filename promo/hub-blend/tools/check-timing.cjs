/* The script stays on v11's clock: every caption change lands on v11's time (one feature every
   3 s from 10 s, the end card at 37 s), within a frame. Reads the caption on screen one frame
   before and one frame after each change.
   node promo/hub-blend/tools/check-timing.cjs */
const path = require('path'), fs = require('fs'), http = require('http');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const PROJ = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
// v11's caption changes (its own frames): Home 10, then every 3 s; the captions go at the end card, 37
const V11 = [10, 13, 16, 19, 22, 25, 28, 31, 34, 37];
(async () => {
  const server = http.createServer((q, r) => {
    const f = path.join(PROJ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(PROJ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  await page.goto(`http://localhost:${server.address().port}/remake.html`);
  await page.waitForFunction(() => typeof window.__renderAt === 'function', null, { timeout: 120000 });
  const capAt = (t) => page.evaluate((t) => { window.__renderAt(t); const c = document.getElementById('caps'); return c && c.style.opacity !== '0' ? c.querySelector('.l1').textContent : '(none)'; }, t);
  let fails = 0;
  for (const t of V11) {
    const before = await capAt(t - 1 / 30 - 0.001), after = await capAt(t + 1 / 30 + 0.001);
    const ok = before !== after;
    if (!ok) fails++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${t.toFixed(2)} s: "${before}" -> "${after}"`);
  }
  console.log(`caption changes on v11's clock: ${V11.length - fails}/${V11.length}`);
  await browser.close(); server.close();
})();
