/* Why does WebKit's page die about 32 s into the Home greeting? (docs/FACTS.md,
   "startup-work's rare red"; twice in GitHub's webkit job, never elsewhere.)
   Opens Home the way startup-work.cjs's first part does, RUNS times, and
   prints for each: did the page crash and when, and once a second until
   then how the page was doing (frames drawn, elements, animations, whether
   the pen was still up) and how much memory the browser's processes held.

     BROWSER=webkit RUNS=20 VARIANT=base node tools/webkit-crash.cjs

   VARIANT turns one thing off, to see what the freeze follows (all at 1x,
   where it froze most often, 3 runs in 20 on 2026-11-11):
     base       as the suite runs it, at 1x
     dsf3       at 3x, as a phone draws it
     reduce     the phone's Reduce Motion on (no pen, no loops)
     still      Dr. Smiley set to Still (ih_smileyMode)
     nooff      no OffscreenCanvas: the petals fall back to animated elements
     noworker   no Worker at all: the pen's path is traced on the page
   A run that stops answering for 3 samples in a row is counted as frozen and
   ended there (WebKit kills such a page about 27 s later). The page also
   reports its rare, heavy calls as they happen (a worker made, a message to
   one, a canvas handed over, getImageData, a font asked for), so a frozen
   run prints what it was doing last.
   Not a suite: nothing here passes or fails. Read the last lines. */
const L = require('../support/harness.cjs');
const { execSync } = require('child_process');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const RUNS = +process.env.RUNS || 60, VARIANT = process.env.VARIANT || 'base', WATCH = (+process.env.WATCH || 16) * 1000;

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
const init = v => {
  window.__f = 0; const tick = () => { window.__f++; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  if (v === 'nooff') { try { delete window.OffscreenCanvas; window.OffscreenCanvas = undefined; HTMLCanvasElement.prototype.transferControlToOffscreen = undefined; } catch (e) {} }
  if (v === 'noworker') { try { window.Worker = undefined; } catch (e) {} }
  // The trace: one console line per rare, heavy call, as it starts and as it returns.
  const say = m => console.log('TRACE ' + Math.round(performance.now()) + ' ' + m);
  const wrap = (o, k, label, quiet) => { const f = o && o[k]; if (typeof f !== 'function') return; let n = 0;
    o[k] = function () { n++; if (!quiet || n <= 3) say(label + ' #' + n + ' >'); const r = f.apply(this, arguments); if (!quiet || n <= 3) say(label + ' #' + n + ' <'); return r; }; };
  if (window.Worker) { const W = window.Worker; let n = 0;
    window.Worker = function (u, o) { const id = ++n; say('new Worker ' + id + ' >'); const w = new W(u, o); say('new Worker ' + id + ' <');
      const pm = w.postMessage.bind(w); let k = 0; w.postMessage = function () { k++; if (k <= 4) say('postMessage to worker ' + id + ' #' + k + ' >'); const r = pm.apply(null, arguments); if (k <= 4) say('postMessage to worker ' + id + ' #' + k + ' <'); return r; };
      let got = 0; w.addEventListener('message', () => { got++; if (got <= 4) say('message from worker ' + id + ' #' + got); }); w.addEventListener('error', e => say('error from worker ' + id + ' ' + (e.message || '')));
      const tm = w.terminate.bind(w); w.terminate = function () { say('terminate worker ' + id); return tm(); };
      return w; };
    window.Worker.prototype = W.prototype; }
  wrap(HTMLCanvasElement.prototype, 'transferControlToOffscreen', 'transferControlToOffscreen');
  wrap(HTMLCanvasElement.prototype, 'getContext', 'canvas.getContext', true);
  wrap(CanvasRenderingContext2D.prototype, 'getImageData', 'getImageData');
  wrap(window, 'createImageBitmap', 'createImageBitmap');
  if (document.fonts) wrap(document.fonts, 'load', 'fonts.load');
  wrap(URL, 'createObjectURL', 'createObjectURL');
  wrap(HTMLImageElement.prototype, 'decode', 'img.decode', true);
  addEventListener('DOMContentLoaded', () => say('DOMContentLoaded')); addEventListener('load', () => say('load'));
};

(async () => {
  const b = await L.chromium.launch();
  const out = [];
  for (let i = 1; i <= RUNS; i++) {
    const ctx = await b.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: VARIANT === 'dsf3' ? 3 : 1, isMobile: true, hasTouch: true, userAgent: UA, serviceWorkers: 'block',
      ...(VARIANT === 'reduce' ? { reducedMotion: 'reduce' } : {}) });
    const open = async () => {
      const page = await ctx.newPage();
      await L.route(page, {});
      await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
        try { localStorage.setItem('ih_opening', 'off'); localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Moisés');
          if (o.v === 'still') localStorage.setItem('ih_smileyMode', 'still'); } catch (e) {} }, { seed: L.SEED, v: VARIANT });
      await page.addInitScript(init, VARIANT);
      return page;
    };
    let page = await open();
    let crashedAt = 0; const t0 = Date.now(); page.on('crash', () => { crashedAt = Date.now() - t0; });
    const trace = []; page.on('console', m => { const t = m.text(); if (t.startsWith('TRACE ')) trace.push((Date.now() - t0) + 'ms ' + t.slice(6)); });
    const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
    await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' }).catch(e => errors.push('goto: ' + e.message.split('\n')[0]));
    const rows = []; let silent = 0, lastF = 0, inRow = 0, frozenAt = 0;
    while (Date.now() - t0 < WATCH && !crashedAt && !frozenAt) {
      const at = Date.now() - t0;
      const s = await Promise.race([
        new Promise(r => setTimeout(() => r(null), 3000)),
        page.evaluate(() => { const n = document.querySelector('.home-greeting-name');
          return { f: window.__f, els: document.getElementsByTagName('*').length, an: document.getAnimations ? document.getAnimations().length : -1,
            pen: !!document.querySelector('.home-name-pen'), penning: !!(n && n.classList.contains('is-penning')), cv: document.querySelectorAll('canvas').length }; }).catch(e => ({ err: e.message.split('\n')[0].slice(0, 80) }))
      ]);
      if (!s) { silent++; if (++inRow >= 3) frozenAt = (rows.filter(r => !r.silent).pop() || { at: 0 }).at; } else inRow = 0;
      rows.push({ at, ...(s || { silent: true }), fps: s && s.f != null ? s.f - lastF : undefined, mem: mem() });
      if (s && s.f != null) lastF = s.f;
      await new Promise(r => setTimeout(r, Math.max(0, 1000 - (Date.now() - t0 - at))));
    }
    const last = rows[rows.length - 1] || {};
    const peak = {}; for (const r of rows) for (const k in r.mem) if (k !== 'freeMB') peak[k] = Math.max(peak[k] || 0, r.mem[k]);
    const penGone = rows.find(r => r.pen === false && rows.some(q => q.pen && q.at < r.at));
    const res = { run: i, frozen: !!frozenAt, lastAnswerS: frozenAt ? +(frozenAt / 1000).toFixed(1) : null, crashed: !!crashedAt, crashedAtS: crashedAt ? +(crashedAt / 1000).toFixed(1) : null, silentSamples: silent, penGoneAtS: penGone ? +(penGone.at / 1000).toFixed(1) : null, peakMemMB: peak, errors };
    out.push(res);
    console.log('RUN ' + JSON.stringify(res));
    // The second-by-second record: every run that crashed or went silent, and the first run as the normal case.
    if (crashedAt || silent || i === 1) { for (const r of rows) console.log('  ' + JSON.stringify(r)); console.log('  TRACE (' + trace.length + ' lines, the last 40): ' + JSON.stringify(trace.slice(-40))); }
    if (frozenAt) await page.close({ runBeforeUnload: false }).catch(() => {});
    await ctx.close().catch(() => {});
  }
  await b.close().catch(() => {});
  const c = out.filter(r => r.crashed);
  console.log('SUMMARY ' + JSON.stringify({ variant: VARIANT, browser: process.env.BROWSER || 'chromium', runs: out.length, frozen: out.filter(r => r.frozen).length, lastAnswerS: out.filter(r => r.frozen).map(r => r.lastAnswerS), crashed: c.length, crashedAtS: c.map(r => r.crashedAtS), silentRuns: out.filter(r => r.silentSamples).length }));
})();
