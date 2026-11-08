/* The first open after a deploy (feel audit, phase 0, lead 1). The offline
   worker (sw.js) is allowed, served from this checkout with a version line
   this script controls. Three opens in one browser profile, like a phone:

     1. a first open (worker version A installs and takes control)
     2. an open after a "deploy" (version B, the page's own build): does the
        page reload itself, when, and what does the new worker fetch?
     3. an open with nothing deployed (B again): the control.
     4. a page served from the saved copy: the worker's build (C) is not the
        page's, so it reloads once and only once, and only once the app is
        in the background (the page is made hidden halfway through).

   For each open: load, first paint, Home's paints, the hello's starts,
   the worker taking control (controllerchange), the page leaving
   (pagehide), navigations, and the worker's own requests (count, span).
   iPhone size, CPU slowed 4x (RATE=n), Firebase and the AI endpoints stood
   in for, as in the suites. The checkout itself is served by a small local
   server (the worker's own script and its fetches never pass through
   Playwright's routes, so the suites' interp.test can't be used here).
   Chromium stands in for Safari.

     cd tests
     node tools/deploy-open.cjs
     WAIT=30 node tools/deploy-open.cjs   seconds to watch each open (25) */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium, route, SEED, ROOT } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), WAIT = +(process.env.WAIT || 25) * 1000;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const SW_SRC = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const BUILD = (/const BUILD_ID = '([^']*)'/.exec(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')) || [])[1] || 'b0000.0000';
const mime = f => ({ css: 'text/css', js: 'application/javascript', json: 'application/json', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', webmanifest: 'application/manifest+json', html: 'text/html; charset=utf-8', mp4: 'video/mp4' })[f.split('.').pop().toLowerCase()] || 'application/octet-stream';

async function measure(say = console.log) {
  let version = 'interpreter-hub-vA-' + BUILD;
  const results = [];
  let served = [];
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    served.push({ at: Date.now(), f: u.pathname.slice(1) });
    const f = u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname.slice(1));
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) { res.writeHead(404); return res.end(); }
    res.setHeader('cache-control', 'no-cache');
    if (f === 'sw.js') { res.setHeader('content-type', 'application/javascript'); return res.end(SW_SRC.replace(/const CACHE_VERSION = '[^']*'/, `const CACHE_VERSION = '${version}'`)); }
    res.setHeader('content-type', mime(f)); res.end(fs.readFileSync(p));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const ORIGIN = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, serviceWorkers: 'allow' });
  // The suites' stand-ins for everything off this origin (Firebase, fonts, the AI endpoints).
  await route(ctx, {});
  // The suites answer every other origin with nothing; this one is the app itself.
  await ctx.route(ORIGIN + '/**', r => r.continue());
  // Events are kept in sessionStorage (it survives the reload this looks
  // for; a message sent while the page reloads itself can be lost).
  await ctx.addInitScript(o => {
    window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_opening', 'off'); localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    const log = (k, v) => { try { const a = JSON.parse(sessionStorage.getItem('__openEvents') || '[]'); a.push({ k, at: Date.now(), v }); sessionStorage.setItem('__openEvents', JSON.stringify(a)); } catch (e) {} };
    const nav = performance.getEntriesByType('navigation')[0];
    log('document', (nav ? nav.type : '?') + (navigator.serviceWorker && navigator.serviceWorker.controller ? ', controlled by the worker' : ', no worker in control'));
    document.addEventListener('ih:home-paint', () => log('home-paint'));
    const seen = {};
    setInterval(() => { for (const [k, sel] of [['hello-start', '.home-wave-entering'], ['pen-start', '.home-name-pen']]) if (!seen[k] && document.querySelector(sel)) { seen[k] = 1; log(k); } }, 50);
    addEventListener('load', () => log('load'));
    addEventListener('pagehide', () => log('pagehide'));
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.name === 'first-contentful-paint') log('first paint'); })).observe({ type: 'paint', buffered: true }); } catch (e) {}
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('controllerchange', () => log('controllerchange'));
  }, { seed: SEED });

  let events = [], sw = [];
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  page.on('framenavigated', f => { if (f === page.mainFrame()) events.push({ k: 'navigated', at: Date.now() }); });
  ctx.on('serviceworker', w => events.push({ k: 'worker created', at: Date.now() }));

  // The app going into the background, as an iPhone reports it (the tab
  // stays in front in a headless browser, so the page is told directly).
  const hide = () => page.evaluate(() => {
    try { const a = JSON.parse(sessionStorage.getItem('__openEvents') || '[]'); a.push({ k: 'hidden', at: Date.now() }); sessionStorage.setItem('__openEvents', JSON.stringify(a)); } catch (e) {}
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const open = async (label, hideAt = 0) => {
    events = []; sw = []; served = [];
    const t0 = Date.now();
    await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.log('  goto: ' + e.message.split('\n')[0]));
    if (hideAt) { await page.waitForTimeout(hideAt); await hide(); await page.waitForTimeout(Math.max(0, WAIT - hideAt)); }
    else await page.waitForTimeout(WAIT);
    events.push(...await page.evaluate(() => { const a = JSON.parse(sessionStorage.getItem('__openEvents') || '[]'); sessionStorage.removeItem('__openEvents'); return a; }));
    const rel = e => ((e.at - t0) / 1000).toFixed(2) + ' s';
    const seq = events.filter(e => e.at >= t0).sort((a, b) => a.at - b.at);
    say(`\n== ${label} (worker version ${version}) ==`);
    const count = k => seq.filter(e => e.k === k).length;
    const hid = seq.find(e => e.k === 'hidden');
    results.push({ label, documents: count('document'), helloStarts: count('hello-start'), reloads: seq.filter(e => e.k === 'document' && /reload/.test(e.v)).length,
      documentsBeforeHidden: hid ? seq.filter(e => e.k === 'document' && e.at < hid.at).length : null });
    say(`documents ${count('document')}, Home paints ${count('home-paint')}, hello starts ${count('hello-start')}, pen starts ${count('pen-start')}, controllerchange ${count('controllerchange')}, pagehide ${count('pagehide')}`);
    for (const e of seq) if (e.k !== 'navigated') say(`  ${rel(e).padStart(8)}  ${e.k}${e.v !== undefined ? ' (' + e.v + ')' : ''}`);
    const pre = served.filter(r => r.f.startsWith('city/'));
    say(`  files served: ${served.length}; the worker's precache (campus pictures as the marker): ${pre.length}${pre.length ? ', from ' + rel(pre[0]) + ' to ' + rel(pre[pre.length - 1]) : ''}`);
  };

  await open('open 1, first visit');
  version = 'interpreter-hub-vB-' + BUILD;
  await open('open 2, after a deploy');
  await open('open 3, nothing deployed');
  version = 'interpreter-hub-vC-b0000.0001';
  await open('open 4, a page from the saved copy (older than the worker)', Math.round(WAIT / 2));
  await ctx.close(); await browser.close(); server.close();
  return results;
}
module.exports = { measure };
if (require.main === module) measure().catch(e => { console.error(e); process.exit(1); });
