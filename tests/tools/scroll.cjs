/* Scrolling Home: what the main thread does per scroll, the number the
   "Home scroll" phase in docs/PLAN.md is judged by. iPhone size, an iPhone
   Safari user agent (so Home takes the iPhone paths, the CSS petals among
   them), CPU slowed 4x (RATE=n), finger drags down and up
   Home N times (N=4), timed by the app's own smoothness meter.

     cd tests
     node tools/scroll.cjs                 one run
     RUNS=3 node tools/scroll.cjs          median of 3
     INDEX=/path/old.html node tools/scroll.cjs   another index.html
     IDLE=20 N=0 node tools/scroll.cjs     Home untouched for 20 s instead
     UA=chromium node tools/scroll.cjs     Chromium's own paths (worker petals)
     PRE='js' node tools/scroll.cjs        run js in the page first (an experiment)

   With the iPhone user agent, Chromium runs the iPhone's CSS petals on its
   main thread every frame (Home at rest ~96% busy at 4x), which an iPhone
   hands to Core Animation (Jose's phone at rest: 1% late frames). For the
   cost of scrolling itself, UA=chromium is the closer stand-in: Home at
   rest is nearly idle there, as on the phone.

   Reports the meter's dropped % and worst frame, and over the scrolling
   only: layouts and style recalcs (count and ms), script ms, and the time
   each scroll listener took (wrapped at addEventListener, by the first
   line of its source). Chromium stands in for Safari: compare runs. */
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), N = +(process.env.N || 4), RUNS = +(process.env.RUNS || 1);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';

const WRAP = () => {
  const T = window.__scrollT = {};
  const orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    if ((type === 'scroll' || type === 'touchmove' || type === 'wheel') && typeof fn === 'function') {
      const name = type + ' ' + (this === window ? 'window' : this === document ? 'document' : (this.id ? '#' + this.id : this.className ? '.' + String(this.className).split(' ')[0] : this.nodeName)) + ' ' + String(fn).split('\n')[0].slice(0, 70);
      const w = function (e) { const t = performance.now(); try { return fn.call(this, e); } finally { const r = T[name] || (T[name] = { n: 0, ms: 0 }); r.n++; r.ms += performance.now() - t; } };
      fn.__w = w; return orig.call(this, type, w, opts);
    }
    return orig.call(this, type, fn, opts);
  };
  const rem = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function (type, fn, opts) { return rem.call(this, type, (fn && fn.__w) || fn, opts); };
};

async function once(browser) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...(process.env.UA === 'chromium' ? {} : { userAgent: UA }), serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await route(page, {});
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {} }, { seed: SEED });
  await page.addInitScript(WRAP);
  await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(14000); // the hello and its thought cloud are over
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await cdp.send('Performance.enable');
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  if (process.env.PRE) await page.evaluate(process.env.PRE); // an experiment, e.g. drop some CSS first
  await page.evaluate(() => { for (const k in window.__scrollT) delete window.__scrollT[k]; FM.on = false; frameMeterStart(); });
  await page.waitForTimeout(300);
  const a = await m();
  // Finger drags (synthesizeScrollGesture doesn't move Home in headless
  // Chromium): 3 flicks down, 3 back up, each then left to coast 700 ms.
  const drag = async (from, to) => {
    const step = from > to ? -18 : 18;
    for (let y = from; step < 0 ? y >= to : y <= to; y += step) await cdp.send('Input.dispatchTouchEvent', { type: y === from ? 'touchStart' : 'touchMove', touchPoints: [{ x: 196, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(700);
  };
  if (process.env.IDLE) await page.waitForTimeout(+process.env.IDLE * 1000); // Home untouched, for comparison
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 3; k++) await drag(620, 170);
    for (let k = 0; k < 3; k++) await drag(170, 620);
  }
  const z = await m();
  const run = await page.evaluate(() => { const r = frameMeterStop(); frameMeterClose(); return r; });
  const secs = z.Timestamp - a.Timestamp;
  const handlers = await page.evaluate(() => window.__scrollT);
  const extra = await page.evaluate(() => window.__extra || null); // filled by a PRE experiment
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await ctx.close();
  const d = k => z[k] - a[k];
  return { dropped: run ? run.scroll.pct : null, ratio: run ? run.scroll.ratio : null, worst: run ? run.scroll.worst : null, secs: run ? Math.round(run.scroll.ms / 100) / 10 : null,
    layouts: d('LayoutCount'), layoutMs: Math.round(d('LayoutDuration') * 1000), styles: d('RecalcStyleCount'), styleMs: Math.round(d('RecalcStyleDuration') * 1000),
    scriptMs: Math.round(d('ScriptDuration') * 1000), taskMs: Math.round(d('TaskDuration') * 1000),
    stylePerS: Math.round(d('RecalcStyleCount') / secs), busy: Math.round(d('TaskDuration') / secs * 100), allDropped: run ? run.pct : null, handlers, extra, errors };
}

(async () => {
  const browser = await chromium.launch();
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await once(browser));
  await browser.close();
  const med = k => { const v = runs.map(r => r[k]).filter(x => x !== null).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
  console.log(`rate ${RATE}x, ${N} down+up gestures, ${RUNS} run(s), medians:`);
  for (const k of ['busy', 'stylePerS', 'allDropped', 'dropped', 'ratio', 'worst', 'secs', 'layouts', 'layoutMs', 'styles', 'styleMs', 'scriptMs', 'taskMs']) console.log('  ' + k.padEnd(9), med(k), RUNS > 1 ? '  [' + runs.map(r => r[k]).join(', ') + ']' : '');
  const h = {}; runs.forEach(r => Object.entries(r.handlers).forEach(([k, v]) => { (h[k] = h[k] || []).push(v); }));
  console.log('  scroll listeners (calls, ms, run 1):');
  Object.entries(h).sort((x, y) => y[1][0].ms - x[1][0].ms).forEach(([k, v]) => console.log(`    ${String(v[0].n).padStart(5)} ${v[0].ms.toFixed(1).padStart(8)} ms  ${k}`));
  runs.forEach((r, i) => { if (r.extra) console.log('  extra run ' + (i + 1) + ':', JSON.stringify(r.extra)); });
  const errs = runs.flatMap(r => r.errors); if (errs.length) console.log('  page errors:', errs.slice(0, 3));
})();
