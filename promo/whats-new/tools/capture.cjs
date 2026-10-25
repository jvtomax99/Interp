/* The real app's screens for the What's new video (Jose, 2026-10-25): this checkout, booted with the
   tests' stand-ins (tests/support/harness.cjs: Firebase in memory), at 390x780 and 3x like a phone.
     notifications.webp  More > Notifications, switched on (pushState stood in as 'on': a headless
                         browser has no push service)
     review.webp         Term Review's start screen, the small live brain at its top
     brain.webp          your knowledge brain full screen (brain/you.html, given knowledgeBrainData())
   The record that lights the brain is a made-up one for "Jose" (about half the terms known, a few
   learning or missed), set before the screens draw: the stand-in database has none.
   Run from the repo root:  node promo/whats-new/tools/capture.cjs */
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const L = require('../../../tests/support/harness.cjs');
const OUT = path.resolve(__dirname, '..', 'assets');

const DEMO_RECORD = `(() => {
  const now = Date.now(), day = 864e5; let i = 0;
  DATA.categories.forEach(c => c.terms.forEach(t => {
    if (!t.en || !t.es) return; const k = (i++ * 37) % 100;
    if (k < 52) TERM_REVIEWS[t.id] = { box: 3 + (k % 3), reviewCount: 4, lastResult: 'right', nextReviewAt: now + 9 * day };
    else if (k < 66) TERM_REVIEWS[t.id] = { box: 1 + (k % 2), reviewCount: 2, lastResult: 'right', nextReviewAt: now + day };
    else if (k < 72) TERM_REVIEWS[t.id] = { box: 0, reviewCount: 2, lastResult: 'miss', misses: 1, nextReviewAt: now };
  }));
})()`;

async function shot(page, name) {
  const png = path.join(OUT, name + '.png');
  await page.screenshot({ path: png });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '90', path.join(OUT, name + '.webp')]);
  fs.unlinkSync(png); console.log(name, page.__errors.length ? 'ERR ' + page.__errors[0] : 'ok');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await L.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); // WebGL for the brain
  const init = `localStorage.setItem('ih_promoSeen','1');localStorage.setItem('ih_region','north');localStorage.setItem('ih_warmup',JSON.stringify({lvl:0}));`;

  { const { ctx, page } = await L.boot(browser, { device: 'pwa', reducedMotion: true, settle: 3500, init });
    await page.evaluate(() => { window.pushState = () => 'on'; PUSH.ready = true; notifyEnabled = true; notifyCeEnabled = true; });
    await L.go(page, 'notifications', 1500);
    await shot(page, 'notifications'); await ctx.close(); }

  { const { ctx, page } = await L.boot(browser, { device: 'pwa', settle: 3500, init });
    await L.go(page, 'review', 2500); // loads (and so clears) the record first
    await page.evaluate(DEMO_RECORD + ';termReviewsLoaded = true; renderContent();');
    await page.waitForTimeout(2500);
    await shot(page, 'review');
    const data = await page.evaluate(() => knowledgeBrainData());
    // the brain page on its own, answered as the app answers it (the app's frame, in this harness,
    // can't reach its storage): window.parent stood in so the page asks, then the data posted back
    const brain = await ctx.newPage(); brain.__errors = []; brain.on('pageerror', e => brain.__errors.push(e.message));
    await L.route(brain, {});
    const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json' };
    await brain.route(/^https:\/\/interp\.test\/brain\//, r => { const f = L.ROOT + new URL(r.request().url()).pathname.slice(1);
      return r.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); }); // the harness serves the app, not brain/
    await brain.addInitScript(() => { window.parent = { postMessage: () => {} }; });
    await brain.goto(page.url().replace(/[^/]*$/, '') + 'brain/you.html');
    await brain.waitForTimeout(800);
    await brain.evaluate(d => window.postMessage({ ih: 'brain-data', data: d }, location.origin), data);
    await brain.waitForTimeout(7000);
    await shot(brain, 'brain'); await ctx.close(); }

  await browser.close();
})();
