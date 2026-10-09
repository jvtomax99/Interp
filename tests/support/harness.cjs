/* The one setup every suite boots the app with, so numbers are comparable.

   The app is served from this checkout at https://interp.test/ inside a
   headless Chromium. Nothing reaches the real Hub: Firebase is replaced by
   support/firebase-stub.js (an in-memory Firestore seeded with
   support/seed.json, the built-in glossary), the AI endpoints answer with
   the realistic stand-ins below, the service worker is off, and Google Fonts
   come from support/fonts so text measures the same every run. Anything
   else external is recorded on page.__external and answered empty.

   ROOT   the app folder to test (default: the repo this file is in)
   INDEX  a different index.html to serve, for before/after comparisons */
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const { chromium, devices } = pw;
const fs = require('fs');
const SUP = __dirname + '/';
const R = process.env.ROOT ? path.resolve(process.env.ROOT) + '/' : path.resolve(__dirname, '..', '..') + '/';
const STUB = fs.readFileSync(SUP + 'firebase-stub.js', 'utf8');
const SEED = JSON.parse(fs.readFileSync(SUP + 'seed.json', 'utf8')).categories;
const FONTS = SUP + 'fonts/';
const OUT = path.resolve(__dirname, '..', 'out') + '/';
const SHOTS = OUT + 'shots/';

// Realistic stand-ins for the AI endpoints, in the shapes the client reads.
const API_OK = {
  translate: { primary: 'insuficiencia cardíaca', plain: 'cuando el corazón no bombea suficiente sangre',
               register: 'Formal / clinical', regional: '', caution: 'Avoid "fallo cardíaco" with patients.',
               notes: 'Standard term across Latin America and Spain.' },
  'doctor-research': { found: true, specialty: 'Cardiology', note: '',
    tiers: [{ key: 'core', label: 'Core terms', terms: [
      { en: 'ejection fraction', es: 'fracción de eyección', def: 'Share of blood pumped out with each beat.' },
      { en: 'atrial fibrillation', es: 'fibrilación auricular', def: 'Irregular, often rapid heart rhythm.' } ] },
      { key: 'procedures', label: 'Procedures & tests', terms: [
      { en: 'echocardiogram', es: 'ecocardiograma', def: 'Ultrasound of the heart.' } ] }],
    terms: [] },
  'term-lookup': { note: '', sources: [
    { url: 'https://medlineplus.gov/heartfailure.html', site: 'MedlinePlus', language: 'en', title: 'Heart Failure',
      snippet: 'Heart failure means the heart is not pumping as well as it should.' },
    { url: 'https://medlineplus.gov/spanish/heartfailure.html', site: 'MedlinePlus', language: 'es', title: 'Insuficiencia cardíaca',
      snippet: 'La insuficiencia cardíaca significa que el corazón no bombea bien.' } ] },
  'term-check': { verdict: 'ok', findings: [] },
};
API_OK['doctor-research'].terms = API_OK['doctor-research'].tiers.flatMap(t => t.terms);

async function route(page, opts = {}) {
  const apiMode = opts.api || 'ok';              // 'ok' | 'down' | 'slow'
  await page.route('**://www.gstatic.com/firebasejs/**', r => r.fulfill({ status: 200, contentType: 'application/javascript',
    body: r.request().url().includes('firebase-app-compat') ? STUB : '' }));
  await page.route('**/api/**', async r => {
    const name = new URL(r.request().url()).pathname.split('/').pop();
    if (apiMode === 'down') return r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"not_configured"}' });
    if (apiMode === 'slow') await new Promise(res => setTimeout(res, 2500));
    const body = API_OK[name];
    return body ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
                : r.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not_found"}' });
  });
  await page.route('**://api.mymemory.translated.net/**', r => r.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ responseData: { translatedText: apiMode === 'down' ? 'insuficiencia cardíaca' : 'insuficiencia cardíaca' } }) }));
  await page.route('**/sw.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync(FONTS + 'g.css', 'utf8') }));
  await page.route('https://fonts.gstatic.com/**', r => { const f = FONTS + r.request().url().replace('https://fonts.gstatic.com/s/', '').replace(/\//g, '_'); return fs.existsSync(f) ? r.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(f) }) : r.abort(); });
  await page.route(/\.(jpe?g|png|PNG|webp|svg|gif|ico|webmanifest)(\?.*)?$/, r => {
    const f = decodeURIComponent(new URL(r.request().url()).pathname.replace(/^\//,''));
    let p = R + f; if (!fs.existsSync(p)) p = __dirname + '/' + f; if (!fs.existsSync(p) || /^missing/.test(f)) return r.fulfill({ status: 404, body: '' });
    const ext = f.toLowerCase().split('.').pop();
    r.fulfill({ status: 200, contentType: { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml',
      gif: 'image/gif', ico: 'image/x-icon', webmanifest: 'application/manifest+json' }[ext], body: fs.readFileSync(p) });
  });
  for (const f of ['home-polish.css', 'home-polish.js', 'pin-icons.js'])
    await page.route('**/' + f, r => r.fulfill({ status: 200, contentType: f.endsWith('.css') ? 'text/css' : 'application/javascript', body: fs.readFileSync(R + f) }));
  // Anything else external is recorded, not silently dropped.
  page.__external = [];
  await page.route(/^https?:\/\/(?!interp\.test)/, r => {
    const u = r.request().url();
    if (/gstatic|googleapis|mymemory/.test(u)) return r.fallback();
    page.__external.push(u); r.fulfill({ status: 204, body: '' });
  });
  await page.route(/^https:\/\/interp\.test\/(\?.*)?$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(process.env.INDEX || (R + 'index.html'), 'utf8') }));
}

async function boot(browser, opts = {}) {
  const ctxOpts = opts.device === 'desktop' ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
                : opts.device === 'tablet' ? { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
                : opts.device === 'tabletland' ? { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
                : opts.device === 'landscape' ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
                : opts.device === 'iphone' ? { viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
                : opts.device === 'pwa' ? { viewport: { width: 390, height: 780 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
                : opts.device === 'narrow' ? { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
                : { ...devices['iPhone 13'] };
  if (opts.reducedMotion) ctxOpts.reducedMotion = 'reduce';
  if (opts.dark) ctxOpts.colorScheme = 'dark';
  if (opts.video) ctxOpts.recordVideo = { dir: opts.video, size: { width: ctxOpts.viewport ? ctxOpts.viewport.width : 390, height: ctxOpts.viewport ? ctxOpts.viewport.height : 844 } };
  ctxOpts.serviceWorkers = opts.sw ? 'allow' : 'block';
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  page.__errors = []; page.__console = [];
  page.on('pageerror', e => page.__errors.push(e.message));
  page.__failed = []; page.on('response', r => { if (r.status() >= 400) page.__failed.push(r.status() + ' ' + r.url().slice(0, 90)); }); page.on('requestfailed', q => page.__failed.push('FAIL ' + q.url().slice(0, 90)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') page.__console.push(m.type() + ': ' + m.text()); });
  await route(page, opts);
  await page.addInitScript((o) => {
    window.__SEED_CATS = o.seed; window.__ACCESS = o.access;
    try {
      if (!o.fresh) { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', o.name || 'Jose'); }
    } catch (e) {}
  }, { fresh: !!opts.fresh, name: opts.name, seed: SEED, access: opts.access || { mode: 'none' } });
  if (opts.init) await page.addInitScript(opts.init);
  const t0 = Date.now();
  await page.goto('https://interp.test/' + (opts.query || ''), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(opts.settle || 4200);
  page.__bootMs = Date.now() - t0;
  return { ctx, page };
}

async function go(page, cat, wait = 900) {
  await page.evaluate(c => { window.scrollTo(0, 0); setCategory(c); }, cat);
  await page.waitForTimeout(wait);
}

/* Everything measurable about the screen currently shown. */
function sweep(page) {
  return page.evaluate(() => {
    const vis = el => { if (!el.isConnected) return false; const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); };
    const label = el => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('placeholder') || el.value || '').replace(/\s+/g, ' ').trim();
    const inter = [...document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, summary, [onclick], [role=button], [role=tab], [role=radio], label[for]')]
      .filter(vis).filter(el => !el.closest('[aria-hidden="true"]'));
    // de-dupe nested clickables: keep the outermost
    const outer = inter.filter(el => !inter.some(o => o !== el && o.contains(el) && o.matches('button, a[href]')));
    const small = [], covered = [], unlabeled = [];
    const vw = innerWidth, vh = innerHeight;
    for (const el of outer) {
      const r = el.getBoundingClientRect();
      const name = label(el).slice(0, 38) || '<' + el.tagName.toLowerCase() + ' class="' + (el.className && el.className.baseVal === undefined ? el.className : '') + '">';
      const inlineLink = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li, .guide-body, .gd-body');
      if ((r.width < 44 || r.height < 44) && !inlineLink && el.tagName !== 'LABEL')
        small.push({ name, w: Math.round(r.width), h: Math.round(r.height), cls: String(el.className && el.className.baseVal === undefined ? el.className : '').slice(0, 40) });
      if (!label(el) && !el.querySelector('img[alt]:not([alt=""])')) unlabeled.push('<' + el.tagName.toLowerCase() + ' class="' + String(el.className && el.className.baseVal === undefined ? el.className : '').slice(0, 40) + '">');
      // hit-test only what is on screen
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx > 0 && cy > 0 && cx < vw && cy < vh) {
        const hit = document.elementFromPoint(cx, cy);
        if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) {
          const by = hit.closest('button, a, [onclick], nav, .tabbar, [class]');
          covered.push({ name, by: (by && (by.className && by.className.baseVal === undefined ? by.className : by.tagName)).toString().slice(0, 40) });
        }
      }
    }
    const zoomInputs = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]), textarea, select')]
      .filter(vis).filter(el => parseFloat(getComputedStyle(el).fontSize) < 16)
      .map(el => (el.id || el.name || el.placeholder || el.className).toString().slice(0, 30) + ' @' + getComputedStyle(el).fontSize);
    const brokenImgs = [...document.images].filter(i => vis(i) && i.complete && i.naturalWidth === 0).map(i => (i.getAttribute('src') || '').slice(0, 50));
    const hScroll = document.documentElement.scrollWidth - innerWidth;
    const content = document.getElementById('content');
    const text = content ? content.innerText.replace(/\s+/g, ' ').trim() : '';
    return { interactive: outer.length, small, covered, unlabeled, zoomInputs, brokenImgs,
             hScroll, contentChars: text.length, contentHead: text.slice(0, 110), pageH: document.documentElement.scrollHeight };
  });
}

module.exports = { chromium, devices, boot, go, sweep, route, OUT, SHOTS, API_OK, SEED, ROOT: R };
