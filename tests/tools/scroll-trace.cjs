/* What scrolling Home restyles (Home scroll, round 3). Loads Home like
   scroll.cjs (UA=chromium paths), then drags Home down and up N times under
   a Chrome trace with style invalidation tracking. Reports the style passes
   in the drags (count, elements, ms) and what invalidated them, grouped by
   reason, changed class/attribute/property and element, plus the JS frame
   that scheduled it when the trace has one.

     cd tests
     node tools/scroll-trace.cjs            N=2 down+up gestures, 1x CPU
     RATE=4 N=1 node tools/scroll-trace.cjs */
const { chromium, route, SEED } = require('../support/harness.cjs');
const N = +(process.env.N || 2), RATE = +(process.env.RATE || 1);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await route(page, {});
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {} }, { seed: SEED });
  await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(14000);
  const total = await page.evaluate(() => document.querySelectorAll('*').length);
  const cdp = await ctx.newCDPSession(page);
  if (RATE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const events = [];
  cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: [
    'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking', 'blink.user_timing'] } });
  await page.evaluate(() => performance.mark('s:scroll'));
  const drag = async (from, to) => {
    const step = from > to ? -18 : 18;
    for (let y = from; step < 0 ? y >= to : y <= to; y += step) await cdp.send('Input.dispatchTouchEvent', { type: y === from ? 'touchStart' : 'touchMove', touchPoints: [{ x: 196, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(700);
  };
  for (let i = 0; i < N; i++) { for (let k = 0; k < 3; k++) await drag(620, 170); for (let k = 0; k < 3; k++) await drag(170, 620); }
  await page.evaluate(() => performance.mark('e:scroll'));
  await cdp.send('Tracing.end'); await done;
  let t0 = 0, t1 = Infinity;
  for (const e of events) if (e.cat && e.cat.includes('blink.user_timing')) { if (e.name === 's:scroll') t0 = e.ts; if (e.name === 'e:scroll') t1 = e.ts; }
  const win = events.filter(e => e.ts >= t0 && e.ts <= t1);
  const ult = win.filter(e => e.name === 'UpdateLayoutTree' && e.ph === 'X');
  const big = ult.filter(e => ((e.args && e.args.elementCount) || 0) > 0);
  const why = {}, who = {};
  for (const e of win) {
    if (!/InvalidationTracking$/.test(e.name) || !/Style/.test(e.name)) continue;
    const d = (e.args && e.args.data) || {};
    const node = (d.nodeName || '').slice(0, 60);
    const key = e.name.replace('InvalidationTracking', '') + ' :: ' + (d.reason || '') + ' :: ' + (d.changedClass || d.changedId || d.changedAttribute || d.changedPseudo || d.extraData || '') + ' :: ' + node;
    why[key] = (why[key] || 0) + 1;
    const st = (d.stackTrace || [])[0];
    if (st) { const k2 = (st.functionName || '(anon)') + ' ' + (st.url || '').split('/').pop() + ':' + st.lineNumber; who[k2] = (who[k2] || 0) + 1; }
  }
  const sum = (a, f) => a.reduce((s, e) => s + f(e), 0);
  const counts = big.map(e => e.args.elementCount).sort((a, b) => b - a);
  console.log(JSON.stringify({ rate: RATE, N, elementsOnPage: total, secs: +((t1 - t0) / 1e6).toFixed(1), errors,
    stylePasses: ult.length, nonEmpty: big.length, elements: sum(big, e => e.args.elementCount), styleMs: +(sum(ult, e => e.dur || 0) / 1000).toFixed(1),
    biggestPasses: counts.slice(0, 15), medianElements: counts[Math.floor(counts.length / 2)],
    why: Object.entries(why).sort((a, b) => b[1] - a[1]).slice(0, 30), scheduledBy: Object.entries(who).sort((a, b) => b[1] - a[1]).slice(0, 20) }, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
