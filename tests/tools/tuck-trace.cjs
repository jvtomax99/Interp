/* What a tab bar tuck restyles (S7b). Loads Home at iPhone size like
   scroll.cjs (Chromium's own paths), waits for it to settle, then tucks and
   opens the bar K times under a Chrome trace with style invalidation
   tracking. For each step it reports how many elements the style pass that
   follows touched (UpdateLayoutTree elementCount) and what invalidated
   them (StyleInvalidatorInvalidationTracking / StyleRecalcInvalidationTracking:
   reason, and the selector or invalidation set behind it), grouped.

     cd tests
     node tools/tuck-trace.cjs              real tuck/open (dockTuck, dockOpen)
     K=5 node tools/tuck-trace.cjs          5 tucks and opens (default 3)
     MODE=class node tools/tuck-trace.cjs   only the body class, no morph
     MODE=var node tools/tuck-trace.cjs     only --mini-w on body, changed each step
     RATE=4 node tools/tuck-trace.cjs       CPU slowed 4x (default 1)
     INDEX=/path/old.html node tools/tuck-trace.cjs   another index.html

   Each step is: force a clean style, run the step, force style again, so
   the second pass is the step's own cost. */
const { chromium, route, SEED } = require('../support/harness.cjs');
const K = +(process.env.K || 3), MODE = process.env.MODE || 'real', RATE = +(process.env.RATE || 1);

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
  // One tuck and open first, untraced: the first traced step used to read 0.
  if (MODE === 'real') { await page.evaluate(() => dockTuck()); await page.waitForTimeout(700); await page.evaluate(() => dockOpen()); await page.waitForTimeout(700); }
  const total = await page.evaluate(() => document.querySelectorAll('*').length);
  const cdp = await ctx.newCDPSession(page);
  if (RATE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });

  const events = [];
  cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: [
    'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking', 'blink.user_timing'] } });

  for (let i = 0; i < K; i++) {
    for (const tuck of [true, false]) {
      const label = (tuck ? 'tuck' : 'open') + ' ' + (i + 1);
      await page.evaluate(([tuck, label, mode, i]) => {
        getComputedStyle(document.body).color; document.body.offsetWidth;   // clean
        performance.mark('s:' + label);
        if (mode === 'class') document.body.classList.toggle('dock-mini', tuck);
        else if (mode === 'var') document.body.style.setProperty('--mini-w', (120 + i * 2 + (tuck ? 1 : 0)) + 'px');
        else (tuck ? dockTuck : dockOpen)();
        document.body.offsetWidth;                                           // the step's style + layout
        performance.mark('e:' + label);
      }, [tuck, label, MODE, i]);
      await page.waitForTimeout(700);                                         // morph over
    }
  }
  await cdp.send('Tracing.end');
  await done;

  // Windows between the marks; take the style passes inside each.
  const marks = {};
  for (const e of events) if (e.cat && e.cat.includes('blink.user_timing') && /^[se]:/.test(e.name)) marks[e.name] = e.ts;
  const rows = [];
  for (const k of Object.keys(marks).filter(n => n.startsWith('s:'))) {
    const label = k.slice(2), t0 = marks[k], t1 = marks['e:' + label];
    const inWin = e => e.ts >= t0 && e.ts <= t1;
    const ult = events.filter(e => e.name === 'UpdateLayoutTree' && e.ph === 'X' && inWin(e));
    const count = ult.reduce((s, e) => s + ((e.args && e.args.elementCount) || 0), 0);
    const ms = ult.reduce((s, e) => s + (e.dur || 0), 0) / 1000;
    const why = {};
    for (const e of events) {
      if (!inWin(e)) continue;
      if (e.name !== 'StyleInvalidatorInvalidationTracking' && e.name !== 'StyleRecalcInvalidationTracking' && e.name !== 'ScheduleStyleInvalidationTracking') continue;
      const d = (e.args && e.args.data) || {};
      const sets = (d.invalidationList || []).map(s => JSON.stringify(s).slice(0, 160)).join(' | ');
      const key = e.name.replace('InvalidationTracking', '') + ' :: ' + (d.reason || '') + ' :: ' + (d.changedClass || d.changedId || d.changedAttribute || d.changedPseudo || '') + ' :: ' + (d.selectors ? JSON.stringify(d.selectors).slice(0, 200) : sets);
      why[key] = (why[key] || 0) + 1;
    }
    rows.push({ label, count, ms: +ms.toFixed(2), why: Object.entries(why).sort((a, b) => b[1] - a[1]).slice(0, 12) });
  }
  console.log(JSON.stringify({ mode: MODE, rate: RATE, elementsOnPage: total, errors, steps: rows }, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
