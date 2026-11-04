/* The first open after a deploy (feel audit, phase 0, lead 1). The offline
   worker (sw.js) is allowed, served from this checkout with a version line
   this script controls. Three opens in one browser profile, like a phone:

     1. a first open (worker version A installs and takes control)
     2. an open after a "deploy" (version B): does the page reload itself,
        when, and what does the new worker fetch meanwhile?
     3. an open with nothing deployed (B again): the control.

   For each open: load, first paint, Home's paints, the hello's starts,
   the worker taking control (controllerchange), the page leaving
   (pagehide), navigations, and the worker's own requests (count, span).
   iPhone size, CPU slowed 4x (RATE=n), Firebase and the AI endpoints stood
   in for, as in the suites. Chromium stands in for Safari.

     cd tests
     node tools/deploy-open.cjs
     WAIT=30 node tools/deploy-open.cjs   seconds to watch each open (25) */
const fs = require('fs');
const path = require('path');
const { chromium, route, SEED, ROOT } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), WAIT = +(process.env.WAIT || 25) * 1000;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const SW_SRC = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const mime = f => ({ css: 'text/css', js: 'application/javascript', json: 'application/json', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', webmanifest: 'application/manifest+json', html: 'text/html; charset=utf-8', mp4: 'video/mp4' })[f.split('.').pop().toLowerCase()] || 'application/octet-stream';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, serviceWorkers: 'allow' });
  let version = 'A';
  // The suites' stand-ins, registered on the context so the worker's own
  // requests (Chromium routes them through the context) get the same answers.
  await route(ctx, {});
  // Everything under interp.test the suites don't name (pins, the campus,
  // memory/lines.json, ...): the worker precaches 96 such files.
  await ctx.route(/^https:\/\/interp\.test\/.+/, r => {
    const f = decodeURIComponent(new URL(r.request().url()).pathname.slice(1));
    const p = path.join(ROOT, f);
    if (f !== 'sw.js' && fs.existsSync(p) && fs.statSync(p).isFile()) return r.fulfill({ status: 200, contentType: mime(f), body: fs.readFileSync(p) });
    return r.fallback();
  });
  await ctx.route('**/sw.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'cache-control': 'no-cache' },
    body: SW_SRC.replace(/const CACHE_VERSION = '[^']*'/, `const CACHE_VERSION = 'interpreter-hub-test-${version}'`) }));
  await ctx.addInitScript(o => {
    window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    const log = (k, v) => console.log('[open] ' + JSON.stringify({ k, at: Date.now(), t: Math.round(performance.now()), v }));
    log('start');
    document.addEventListener('ih:home-paint', () => log('home-paint'));
    new MutationObserver(ms => { for (const m of ms) { const el = m.target; if (el.classList && el.classList.contains('home-wave-entering') && !el.__helloSeen) { el.__helloSeen = 1; log('hello-start'); } } })
      .observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['class'] });
    addEventListener('load', () => log('load'));
    addEventListener('pagehide', () => log('pagehide'));
    try { new PerformanceObserver(l => l.getEntries().forEach(e => log('paint', e.name))).observe({ type: 'paint', buffered: true }); } catch (e) {}
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => log('controllerchange'));
      navigator.serviceWorker.ready.then(() => log('sw-ready', !!navigator.serviceWorker.controller));
    }
  }, { seed: SEED });

  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  let events = [], sw = [];
  page.on('console', m => { const s = m.text(); if (s.startsWith('[open] ')) events.push(JSON.parse(s.slice(7))); });
  page.on('framenavigated', f => { if (f === page.mainFrame()) events.push({ k: 'navigated', at: Date.now() }); });
  ctx.on('request', r => { if (r.serviceWorker()) sw.push({ at: Date.now(), url: r.url().replace('https://interp.test/', '') }); });
  ctx.on('serviceworker', w => events.push({ k: 'worker-created', at: Date.now(), v: w.url().slice(-30) }));

  const open = async (label) => {
    events = []; sw = [];
    const t0 = Date.now();
    await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(WAIT);
    const rel = e => ((e.at - t0) / 1000).toFixed(2) + ' s';
    const seq = events.filter(e => e.at >= t0).sort((a, b) => a.at - b.at);
    console.log(`\n== ${label} (worker version ${version}) ==`);
    const count = k => seq.filter(e => e.k === k).length;
    console.log(`navigations ${count('navigated')}, loads ${count('load')}, Home paints ${count('home-paint')}, hello starts ${count('hello-start')}, controllerchange ${count('controllerchange')}, pagehide ${count('pagehide')}`);
    for (const e of seq) if (['navigated', 'load', 'home-paint', 'hello-start', 'controllerchange', 'pagehide', 'worker-created', 'sw-ready'].includes(e.k) || (e.k === 'paint' && e.v === 'first-contentful-paint'))
      console.log(`  ${rel(e).padStart(8)}  ${e.k}${e.v !== undefined ? ' ' + e.v : ''}`);
    if (sw.length) console.log(`  worker requests: ${sw.length}, from ${rel(sw[0])} to ${rel(sw[sw.length - 1])}`);
    else console.log('  worker requests: none seen');
  };

  await open('open 1, first visit');
  version = 'B';
  await open('open 2, after a deploy');
  await open('open 3, nothing deployed');
  await ctx.close(); await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
