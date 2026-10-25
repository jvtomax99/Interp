/* Stills of the video at given times, for a look before rendering (the page's GSAP timeline
   seeked; the film clip seeked by hand). Half size, one contact sheet.
   node promo/whats-new/tools/stills.cjs out/stills.jpg 1.5 4.9 8.6 11.2 14.5 */
const path = require('path'), fs = require('fs'), http = require('http'), { execFileSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const PROJ = path.resolve(__dirname, '..');
const [outRel, ...times] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.wav': 'audio/wav' };
(async () => {
  const server = http.createServer((q, r) => {
    const f = path.join(PROJ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(PROJ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 0.5 });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.evaluate(() => document.fonts.ready);
  const out = path.resolve(PROJ, outRel), dir = out + '.d'; fs.mkdirSync(dir, { recursive: true });
  const files = [];
  for (const t of times) {
    await page.evaluate(async (t) => {
      document.querySelectorAll('.clip').forEach(c => { const s = +c.dataset.start, d = +c.dataset.duration; c.style.visibility = t >= s && t < s + d ? 'visible' : 'hidden'; });
      const v = document.getElementById('film'), s = +v.dataset.start;
      if (t >= s) await new Promise(res => { v.onseeked = res; v.currentTime = Math.min(t - s, 3.35); });
      window.__timelines.main.seek(t);
    }, +t);
    const f = path.join(dir, `${t}.png`); await page.screenshot({ path: f }); files.push(f);
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}]`).join('')}hstack=${files.length}`, out]);
  if (errs.length) console.log('errors:', errs.join('\n'));
  console.log(out); await browser.close(); server.close();
})();
