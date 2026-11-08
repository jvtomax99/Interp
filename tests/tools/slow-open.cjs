/* Opening the app on slow Wi-Fi (2026-11-08, Jose's screen recording: 3 s
   of white on every open). The offline worker (sw.js) is allowed and the
   checkout is served by a small local server that is itself slowed when
   asked (every request waits DELAY ms for its first byte, then streams at
   KBPS kilobits a second; text brotli'd, as Vercel does), so the worker's
   own fetches are slowed too, which the browser's network throttling would
   not do. Each "deploy" changes both the worker's version line and the
   page's BUILD_ID, as the bump does.

   Opens, in one browser profile like a phone:
     1. first visit, fast (worker A installs)
     2. fast, nothing deployed
     3. slow, nothing deployed
     4. slow, after a deploy (B): the saved page (A) opens, no reload in use
     5. the network back to fast, B's worker takes over, then the app goes
        to the background: one reload, and B is there
     6. fast, after a deploy (C): the fresh page (C)

   Per open: when the opening and Home first showed, documents (a reload
   makes 2), the page's build, the app's code files the server sent.

     cd tests
     node tools/slow-open.cjs
     DELAY=800 KBPS=1500 RATE=4 SW=/other/sw.js ROOT=/other/checkout ... */
const fs = require('fs'), path = require('path'), http = require('http'), zlib = require('zlib');
const { chromium, route, SEED, ROOT: HROOT } = require('../support/harness.cjs');
const ROOT = path.resolve(process.env.ROOT || HROOT);
const SW_SRC = fs.readFileSync(process.env.SW || path.join(ROOT, 'sw.js'), 'utf8');
const DELAY = +(process.env.DELAY || 800), KBPS = +(process.env.KBPS || 1500), RATE = +(process.env.RATE || 4);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const mime = f => ({ css: 'text/css', js: 'application/javascript', json: 'application/json', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', webmanifest: 'application/manifest+json', html: 'text/html; charset=utf-8', mp4: 'video/mp4', webm: 'video/webm', m4a: 'audio/mp4' })[f.split('.').pop().toLowerCase()] || 'application/octet-stream';
const CODE = /^(?:app\.css|guide\/topics\.js|practice\/questions\.js|falsefriends\/list\.js|soundalikes\/list\.js|features\/[\w-]+\.js|home-polish\.(?:js|css)|pin-icons\.js)$/;
const wait = ms => new Promise(r => setTimeout(r, ms));

async function measure(say = console.log) {
  let slow = false, build = 'bTEST.0001', letter = 'A';
  let served = [];
  const memo = new Map();
  const body = f => {
    const k = f + '|' + build; if (memo.has(k)) return memo.get(k);
    let raw = fs.readFileSync(path.join(ROOT, f));
    if (f === 'index.html') raw = Buffer.from(raw.toString('utf8').replace(/const BUILD_ID = '[^']*'/, `const BUILD_ID = '${build}'`));
    const text = /^(text|application\/(javascript|json|manifest))/.test(mime(f));
    // Quality 5: the default (11) took 1.9 s on the 1.3 MB page, which read as a slow network.
    const v = { br: text, data: text ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }) : raw }; memo.set(k, v); return v;
  };
  const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const f = u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname.slice(1));
    if (f !== 'sw.js' && (!fs.existsSync(path.join(ROOT, f)) || !fs.statSync(path.join(ROOT, f)).isFile())) { res.writeHead(404); return res.end(); }
    served.push(f);
    const slowNow = slow;
    if (slowNow) await wait(DELAY);
    res.setHeader('cache-control', 'no-cache');
    if (f === 'sw.js') { res.setHeader('content-type', 'application/javascript'); return res.end(SW_SRC.replace(/const CACHE_VERSION = '[^']*'/, `const CACHE_VERSION = 'interpreter-hub-v${letter}-${build}'`)); }
    const b = body(f);
    res.setHeader('content-type', mime(f)); if (b.br) res.setHeader('content-encoding', 'br');
    if (!slowNow) return res.end(b.data);
    const per = Math.max(1, Math.round(KBPS * 1000 / 8 / 10));   // 100 ms slices
    for (let i = 0; i < b.data.length; i += per) {
      if (res.destroyed) return;
      if (!res.write(b.data.subarray(i, i + per))) await new Promise(r => res.once('drain', r));
      await wait(100);
    }
    res.end();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const ORIGIN = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: UA, serviceWorkers: 'allow' });
  await route(ctx, {});
  await ctx.route(ORIGIN + '/**', r => r.continue());
  // Events are kept in sessionStorage, which survives the one reload looked for.
  await ctx.addInitScript(o => {
    window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_opening', 'on'); localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    const log = (k, v) => { try { const a = JSON.parse(sessionStorage.getItem('__slowEv') || '[]'); a.push({ k, at: Date.now(), v }); sessionStorage.setItem('__slowEv', JSON.stringify(a)); } catch (e) {} };
    const nav = performance.getEntriesByType('navigation')[0];
    log('document', nav ? nav.type : '?');
    document.addEventListener('ih:home-paint', () => log('home'));
    const iv = setInterval(() => { if (document.querySelector('.op')) { log('opening'); clearInterval(iv); } }, 30);
    addEventListener('DOMContentLoaded', () => log('build', typeof BUILD_ID !== 'undefined' ? BUILD_ID : '?'));
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('controllerchange', () => log('controllerchange'));
  }, { seed: SEED });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const results = [];
  const read = () => page.evaluate(() => { const a = JSON.parse(sessionStorage.getItem('__slowEv') || '[]'); sessionStorage.removeItem('__slowEv'); return a; }).catch(() => []);
  const report = (label, t0, ev) => {
    const at = k => { const e = ev.find(x => x.k === k && x.at >= t0); return e ? +((e.at - t0) / 1000).toFixed(2) : null; };
    const builds = ev.filter(e => e.k === 'build').map(e => e.v);
    const r = { label, opening: at('opening'), home: at('home'), documents: ev.filter(e => e.k === 'document').length,
      reloads: ev.filter(e => e.k === 'document' && e.v === 'reload').length, builds, code: served.filter(f => CODE.test(f)).length };
    results.push(r);
    say(`${label.padEnd(44)} opening ${r.opening ?? '-'} s, Home ${r.home ?? '-'} s, documents ${r.documents}, build ${builds.join(' then ')}, code files from the server ${r.code}`);
    return r;
  };
  const open = async (label, ms) => {
    served = [];
    const t0 = Date.now();
    await page.goto(ORIGIN + '/', { waitUntil: 'commit', timeout: 60000 }).catch(e => say('  goto: ' + e.message.split('\n')[0]));
    await wait(ms);
    return report(label, t0, await read());
  };
  const deploy = (l, n) => { letter = l; build = 'bTEST.000' + n; };

  await open('1. first visit, fast', 9000);
  await open('2. fast, nothing deployed', 6000);
  slow = true;
  await open('3. slow, nothing deployed', 9000);
  deploy('B', 2);
  await open('4. slow, after a deploy', 9000);
  // 5. The network comes back; B's worker installs and takes over; then the
  // app goes into the background (told directly: a headless tab stays in front).
  slow = false; served = [];
  const t5 = Date.now();
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r && r.update())).catch(() => {});
  await page.waitForFunction(() => (JSON.parse(sessionStorage.getItem('__slowEv') || '[]')).some(e => e.k === 'controllerchange'), null, { timeout: 30000 }).catch(() => say('  (no take-over by the new worker)'));
  await wait(1500);
  const beforeHidden = (await page.evaluate(() => JSON.parse(sessionStorage.getItem('__slowEv') || '[]'))).filter(e => e.k === 'document').length;
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await wait(6000);
  const r5 = report('5. new worker in, then the background', t5, await read());
  r5.documentsBeforeHidden = beforeHidden;
  deploy('C', 3);
  await open('6. fast, after a deploy', 6000);
  await ctx.close(); await browser.close(); server.close();
  return results;
}
module.exports = { measure };
if (require.main === module) measure().catch(e => { console.error(e); process.exit(1); });
