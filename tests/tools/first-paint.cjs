/* First paint over a real (slowed) network: phase 1 of docs/split-index.md
   asks whether moving the stylesheet out of index.html makes a visit paint
   later. The suites serve the page from memory in one piece, which hides
   exactly that; here each folder is served by a small HTTP server the way
   Vercel does (brotli, ETag, revalidated every visit) and Chromium's own
   network throttling adds the round trips and the bandwidth. iPhone size,
   CPU 4x (RATE=n), service worker off, Firebase and the AI stood in for.

     cd tests
     ROOTS=/path/before,/path/after RUNS=5 node tools/first-paint.cjs

   Per network (NETS=slow,4g) and visit (a first visit: empty cache; a
   return: the same browser again, every file revalidated), the median of
   the runs, which alternate between the folders: first contentful paint,
   Home's first paint (the first ih:home-paint), DOMContentLoaded, load. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const crypto = require('crypto');
const { chromium, route, SEED } = require('../support/harness.cjs');

const ROOTS = (process.env.ROOTS || path.resolve(__dirname, '..', '..')).split(',').map(r => path.resolve(r));
const RUNS = +(process.env.RUNS || 3), RATE = +(process.env.RATE || 4);
const NETS = {
  slow: { latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8 },   // weak hospital Wi-Fi
  '4g': { latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 },
};
const nets = (process.env.NETS || 'slow,4g').split(',');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const TYPES = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'application/javascript; charset=utf-8', json: 'application/json',
  webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webmanifest: 'application/manifest+json', mp4: 'video/mp4' };

function serve(root) {
  const memo = new Map();
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/index.html';
    if (p === '/sw.js' || p.startsWith('/api/')) { res.writeHead(404); return res.end(); }
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    let m = memo.get(f);
    if (!m) {
      const raw = fs.readFileSync(f), ext = f.split('.').pop().toLowerCase(), type = TYPES[ext] || 'application/octet-stream';
      const text = /^(text|application\/(javascript|json|manifest))|svg/.test(type);
      m = { type, body: text ? zlib.brotliCompressSync(raw) : raw, br: text, etag: '"' + crypto.createHash('md5').update(raw).digest('hex') + '"' };
      memo.set(f, m);
    }
    const head = { 'content-type': m.type, etag: m.etag, 'cache-control': 'public, max-age=0, must-revalidate' };
    if (req.headers['if-none-match'] === m.etag) { res.writeHead(304, head); return res.end(); }
    if (m.br) head['content-encoding'] = 'br';
    res.writeHead(200, { ...head, 'content-length': m.body.length });
    res.end(m.body);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, url: 'http://127.0.0.1:' + server.address().port + '/' })));
}

async function visit(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__home, null, { timeout: 30000 }).catch(() => {});
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return { fcp: fcp ? Math.round(fcp.startTime) : null, home: window.__home ? Math.round(window.__home) : null,
      dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), bytes: nav.encodedBodySize };
  });
}

async function once(browser, site, net) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  // The harness's stand-ins, minus its catch-all (which would answer this server too).
  const real = page.route.bind(page);
  page.route = (pat, fn) => (String(pat).includes('(?!interp') ? Promise.resolve() : real(pat, fn));
  await route(page, {});
  await page.unroute(/\.(jpe?g|png|PNG|webp|svg|gif|ico|webmanifest)(\?.*)?$/);   // images come from the server, throttled
  for (const f of ['app.css', 'guide/topics.js', 'practice/questions.js', 'falsefriends/list.js', 'home-polish.css', 'home-polish.js', 'pin-icons.js']) await page.unroute('**/' + f);
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    document.addEventListener('ih:home-paint', () => { if (!window.__home) window.__home = performance.now(); }); }, { seed: SEED });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NETS[net] });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const first = await visit(page, site.url);
  await page.goto('about:blank');
  const back = await visit(page, site.url);
  await ctx.close();
  return { first, back };
}

const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
(async () => {
  const sites = [];
  for (const r of ROOTS) sites.push({ root: r, ...(await serve(r)) });
  const browser = await chromium.launch();
  const res = {};
  for (const net of nets) for (let i = 0; i < RUNS; i++) for (const s of (i % 2 ? [...sites].reverse() : sites)) {
    const r = await once(browser, s, net);
    const k = net + ' ' + s.root;
    (res[k] = res[k] || []).push(r);
    process.stderr.write('.');
  }
  process.stderr.write('\n');
  await browser.close();
  for (const net of nets) {
    console.log(`\n${net}: RTT ${NETS[net].latency} ms, ${(NETS[net].downloadThroughput * 8 / 1e6).toFixed(1)} Mbps down, CPU ${RATE}x, median of ${RUNS}`);
    console.log('  folder'.padEnd(46) + 'visit    first paint   Home painted   DOM ready   load');
    for (const s of sites) for (const v of ['first', 'back']) {
      const rs = res[net + ' ' + s.root].map(r => r[v]);
      const m = k => String(med(rs.map(r => r[k]))).padStart(6) + ' ms';
      console.log('  ' + s.root.slice(-42).padEnd(44) + (v === 'first' ? 'first ' : 'return') + '  ' + m('fcp') + '     ' + m('home') + '   ' + m('dcl') + '   ' + m('load'));
    }
  }
  for (const s of sites) s.server.close();
})();
