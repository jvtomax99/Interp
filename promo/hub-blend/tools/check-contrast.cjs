/* How readable the captions are: for each feature, a frame mid-shot with the captions
   hidden, the pixels behind the first (white) caption line measured, and the WCAG
   contrast of white text against them (the brightest 5% of pixels, the worst case,
   and the median). The second line sits on its own cyan box, so it is not affected.
   Compares the reel with the hospital backdrops and without them.
   node promo/hub-blend/tools/check-contrast.cjs */
const path = require('path'), fs = require('fs'), http = require('http');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const PROJ = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.m4a': 'audio/mp4' };
(async () => {
  const server = http.createServer((q, r) => {
    const f = path.join(PROJ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
    if (!f.startsWith(PROJ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
  }).listen(0);
  const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const results = {};
  for (const mode of ['nobackdrop', 'backdrop']) {
    const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
    await page.goto(`http://localhost:${server.address().port}/remake.html${mode === 'nobackdrop' ? '?nobackdrop' : ''}`);
    await page.waitForFunction(() => typeof window.__renderAt === 'function', null, { timeout: 120000 });
    const shots = await page.evaluate(() => [...document.querySelectorAll('#caps .l1')].length);
    // feature start times are where the caption text changes: find them by sampling
    for (let t = 9.6; t < 36; t += 0.25) {
      const r = await page.evaluate(t => {
        window.__renderAt(t);
        const caps = document.getElementById('caps'), l1 = caps.querySelector('.l1');
        if (caps.style.opacity === '0' || !l1.textContent) return null;
        const b = l1.getBoundingClientRect();
        return { text: l1.textContent, x: b.left, y: b.top, w: Math.min(b.width, l1.scrollWidth), h: b.height };
      }, t);
      if (!r || results[mode + r.text]) continue;
      // measure a little later, once the caption has settled (1.2 s into the shot)
      await page.evaluate(t => { window.__renderAt(t); document.getElementById('caps').style.visibility = 'hidden'; }, t + 1.2);
      const png = await page.screenshot({ clip: { x: Math.max(0, r.x), y: r.y, width: Math.min(540 - r.x, r.w), height: r.h } });
      await page.evaluate(() => { document.getElementById('caps').style.visibility = ''; });
      const stats = await page.evaluate(async b64 => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data, L = [];
        const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        for (let i = 0; i < d.length; i += 4) L.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
        L.sort((a, b) => a - b);
        const at = q => L[Math.min(L.length - 1, Math.floor(q * L.length))];
        const cr = l => 1.05 / (l + 0.05);
        return { worst: cr(at(0.95)), median: cr(at(0.5)) };
      }, png.toString('base64'));
      results[mode + r.text] = { mode, caption: r.text, t: +(t + 1.2).toFixed(2), ...stats };
    }
    await page.close();
  }
  const rows = Object.values(results);
  const caps = [...new Set(rows.map(r => r.caption))];
  console.log('caption                      before (no photos)   now (photos)    [white text contrast: brightest 5% / median; AA needs 4.5, AAA 7]');
  for (const c of caps) {
    const a = rows.find(r => r.caption === c && r.mode === 'nobackdrop'), b = rows.find(r => r.caption === c && r.mode === 'backdrop');
    const f = r => r ? `${r.worst.toFixed(1)} / ${r.median.toFixed(1)}` : '-';
    console.log(`${c.padEnd(28)} ${f(a).padEnd(20)} ${f(b)}`);
  }
  await browser.close(); server.close();
})();
