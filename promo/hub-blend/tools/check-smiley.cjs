/* Checks Dr. Smiley in the remake, frame by frame (Jose's rules, 2026-10-20):
   about 25% of the frame tall, always fully in frame, never over the shot's proof
   item (nor the next shot's during a hop). Reads window.__smileyCheck, which the
   director fills every frame. Prints every failing frame and a summary.
   node promo/hub-blend/tools/check-smiley.cjs [fps=10] */
const path = require('path'), fs = require('fs'), http = require('http');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const PROJ = path.resolve(__dirname, '..');
const FPS = +(process.argv[2] || 10);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
(async () => {
  const server = http.createServer((q, r) => {
    const f = path.join(PROJ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(PROJ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const html = fs.readFileSync(path.join(PROJ, 'remake.html'), 'utf8');
  const W = +html.match(/data-width="(\d+)"/)[1], H = +html.match(/data-height="(\d+)"/)[1], D = +html.match(/data-duration="([\d.]+)"/)[1];
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const warns = []; page.on('console', m => { if (m.type() === 'warning') warns.push(m.text()); });
  await page.goto(`http://localhost:${server.address().port}/remake.html`);
  await page.waitForFunction(() => typeof window.__renderAt === 'function', null, { timeout: 120000 });
  console.log('spots', JSON.stringify(await page.evaluate(() => window.__smileySpots)));
  const hit = (a, b) => a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  let frames = 0, shown = 0, fails = 0, hMin = Infinity, hMax = 0;
  for (let i = 0; i <= D * FPS; i++) {
    const t = Math.min(D - 0.01, i / FPS);
    const c = await page.evaluate(t => { window.__renderAt(t); return window.__smileyCheck; }, t);
    frames++;
    if (!c || !c.smiley) continue;
    shown++;
    const s = c.smiley, bad = [];
    if (s.x < -0.5 || s.y < -0.5 || s.x + s.w > W + 0.5 || s.y + s.h > H + 0.5) bad.push('out of frame');
    if (hit(s, c.proof)) bad.push('over proof');
    if (hit(s, c.nextProof)) bad.push('over next proof');
    if (c.shot !== 'opener') { hMin = Math.min(hMin, s.h / H); hMax = Math.max(hMax, s.h / H); }
    if (bad.length) { fails++; console.log(`FAIL ${t.toFixed(2)}s ${c.shot}: ${bad.join(', ')} smiley=${JSON.stringify(roundBox(s))} proof=${JSON.stringify(roundBox(c.proof))}`); }
  }
  function roundBox(b) { return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) }; }
  console.log(`frames ${frames}, with him ${shown}, failing ${fails}; his height ${(hMin * 100).toFixed(1)}-${(hMax * 100).toFixed(1)}% of the frame (squash/stretch and rising out of a screen included)`);
  if (warns.length) console.log('warnings:', warns.join(' | '));
  await browser.close(); server.close();
  process.exitCode = fails ? 1 : 0;
})();
