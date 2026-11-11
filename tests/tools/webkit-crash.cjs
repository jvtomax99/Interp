/* Why does WebKit's page die about 32 s into the Home greeting? (docs/FACTS.md,
   "startup-work's rare red"; twice in GitHub's webkit job, never elsewhere.)
   Opens Home the way startup-work.cjs's first part does, RUNS times, and
   prints for each: did the page crash and when, and once a second until
   then how the page was doing (frames drawn, elements, animations, whether
   the pen was still up) and how much memory the browser's processes held.

     BROWSER=webkit RUNS=20 VARIANT=base node tools/webkit-crash.cjs

   VARIANT turns one thing off, to see what the crash follows:
     base     as the suite runs it (iPhone size at 3x, pen on)
     dsf1     the same at 1x (a ninth of the pixels)
     reduce   the phone's Reduce Motion on (no pen, no loops)
     still    Dr. Smiley set to Still (ih_smileyMode)
     penned   the pen's path already saved: a second open in the same context
   Not a suite: nothing here passes or fails. Read the last lines. */
const L = require('../support/harness.cjs');
const { execSync } = require('child_process');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const RUNS = +process.env.RUNS || 20, VARIANT = process.env.VARIANT || 'base', WATCH = (+process.env.WATCH || 45) * 1000;

// Memory held by the browser's processes, in MB, by process name (Linux only).
function mem() {
  try {
    const by = {};
    for (const l of execSync('ps -eo rss=,comm=', { encoding: 'utf8' }).trim().split('\n')) {
      const m = l.trim().match(/^(\d+)\s+(.*)$/); if (!m || !/webkit|WPE|MiniBrowser|headless|chrom/i.test(m[2])) continue;
      by[m[2]] = (by[m[2]] || 0) + Math.round(+m[1] / 1024);
    }
    try { by.freeMB = Math.round(+require('fs').readFileSync('/proc/meminfo', 'utf8').match(/MemAvailable:\s+(\d+)/)[1] / 1024); } catch (e) {}
    return by;
  } catch (e) { return {}; }
}
const init = () => { window.__f = 0; const tick = () => { window.__f++; requestAnimationFrame(tick); }; requestAnimationFrame(tick); };

(async () => {
  const b = await L.chromium.launch();
  const out = [];
  for (let i = 1; i <= RUNS; i++) {
    const ctx = await b.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: VARIANT === 'dsf1' ? 1 : 3, isMobile: true, hasTouch: true, userAgent: UA, serviceWorkers: 'block',
      ...(VARIANT === 'reduce' ? { reducedMotion: 'reduce' } : {}) });
    const open = async () => {
      const page = await ctx.newPage();
      await L.route(page, {});
      await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
        try { localStorage.setItem('ih_opening', 'off'); localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Moisés');
          if (o.v === 'still') localStorage.setItem('ih_smileyMode', 'still'); } catch (e) {} }, { seed: L.SEED, v: VARIANT });
      await page.addInitScript(init);
      return page;
    };
    let page = await open();
    if (VARIANT === 'penned') { await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(9000); await page.close(); page = await open(); }
    let crashedAt = 0; const t0 = Date.now(); page.on('crash', () => { crashedAt = Date.now() - t0; });
    const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
    await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' }).catch(e => errors.push('goto: ' + e.message.split('\n')[0]));
    const rows = []; let silent = 0, lastF = 0;
    while (Date.now() - t0 < WATCH && !crashedAt) {
      const at = Date.now() - t0;
      const s = await Promise.race([
        new Promise(r => setTimeout(() => r(null), 3000)),
        page.evaluate(() => { const n = document.querySelector('.home-greeting-name');
          return { f: window.__f, els: document.getElementsByTagName('*').length, an: document.getAnimations ? document.getAnimations().length : -1,
            pen: !!document.querySelector('.home-name-pen'), penning: !!(n && n.classList.contains('is-penning')), cv: document.querySelectorAll('canvas').length }; }).catch(e => ({ err: e.message.split('\n')[0].slice(0, 80) }))
      ]);
      if (!s) silent++;
      rows.push({ at, ...(s || { silent: true }), fps: s && s.f != null ? s.f - lastF : undefined, mem: mem() });
      if (s && s.f != null) lastF = s.f;
      await new Promise(r => setTimeout(r, Math.max(0, 1000 - (Date.now() - t0 - at))));
    }
    const last = rows[rows.length - 1] || {};
    const peak = {}; for (const r of rows) for (const k in r.mem) if (k !== 'freeMB') peak[k] = Math.max(peak[k] || 0, r.mem[k]);
    const penGone = rows.find(r => r.pen === false && rows.some(q => q.pen && q.at < r.at));
    const res = { run: i, crashed: !!crashedAt, crashedAtS: crashedAt ? +(crashedAt / 1000).toFixed(1) : null, silentSamples: silent, penGoneAtS: penGone ? +(penGone.at / 1000).toFixed(1) : null, peakMemMB: peak, errors };
    out.push(res);
    console.log('RUN ' + JSON.stringify(res));
    // The second-by-second record: every run that crashed or went silent, and the first run as the normal case.
    if (crashedAt || silent || i === 1) for (const r of rows) console.log('  ' + JSON.stringify(r));
    await ctx.close().catch(() => {});
  }
  await b.close().catch(() => {});
  const c = out.filter(r => r.crashed);
  console.log('SUMMARY ' + JSON.stringify({ variant: VARIANT, browser: process.env.BROWSER || 'chromium', runs: out.length, crashed: c.length, crashedAtS: c.map(r => r.crashedAtS), silentRuns: out.filter(r => r.silentSamples).length }));
})();
