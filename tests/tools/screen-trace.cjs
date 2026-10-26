/* Where a screen change's time goes (S9 Home taps, part 2). The phone's meter
   names "render, pins" in nearly every stall after a tap; this splits one tap
   from the lift to the frame after the new screen is drawn, by piece: the
   app's own functions (render, applyExactPins and the like, by file:line) and
   the browser's style, layout and paint. iPhone size, CPU 4x, Home settled
   first. Two taps: Home -> a domain tile, then that domain's Back.

     cd tests
     node tools/screen-trace.cjs          RUNS=3, RATE=4
     PRE='js' ...                         run js in the page first (an experiment)
     CHROME=/path/to/chrome ...           another browser binary (here: /opt/pw-browsers/chromium) */
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), RUNS = +(process.env.RUNS || 3);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const STEPS = [
  ['domain', '#content .home-tile, #content .domain-family'],
  ['back', '.tc-back:visible, #tgBack:visible']
];
const short = u => (u || '').replace(/^https?:\/\/[^/]+\//, '') || '(page)';

async function tap(ctx, page, sel) {
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(1200);
  const box = await el.boundingBox();
  if (!box) return null;
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const events = [];
  cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] } });
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await page.waitForTimeout(90);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(1500);
  await cdp.send('Tracing.end'); await done;
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await cdp.detach();
  return split(events);
}

// Main-thread pieces from the lift until 700 ms after it, summed by name.
function split(events) {
  const by = new Map();
  for (const e of events) if (e.name === 'RunTask' && e.dur) by.set(e.tid, (by.get(e.tid) || 0) + e.dur);
  const tid = [...by.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const main = events.filter(e => e.tid === tid && e.ph === 'X' && e.dur);
  const lift = main.find(e => e.name === 'EventDispatch' && e.args?.data?.type === 'touchend');
  if (!lift) return null;
  const end = lift.ts + 700000;
  const win = main.filter(e => e.ts >= lift.ts && e.ts < end);
  const tasks = win.filter(e => e.name === 'RunTask');
  const sum = {};
  const add = (k, d) => { sum[k] = (sum[k] || 0) + d / 1000; };
  // Only outermost FunctionCalls, so nested calls are not counted twice.
  const fcs = win.filter(e => e.name === 'FunctionCall');
  const outer = fcs.filter(f => !fcs.some(g => g !== f && g.ts <= f.ts && g.ts + g.dur >= f.ts + f.dur && g.dur > f.dur));
  for (const f of outer) { const d = f.args?.data || {}; add(`js ${d.functionName || '(anon)'} ${short(d.url)}:${(d.lineNumber || 0) + 1}`, f.dur); }
  for (const e of win) if (['UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'ParseHTML'].includes(e.name)) add(e.name, e.dur);
  const busy = tasks.reduce((s, t) => s + t.dur, 0) / 1000;
  const long = tasks.filter(t => t.dur > 50000).map(t => `@${Math.round((t.ts - lift.ts) / 1000)} ${(t.dur / 1000).toFixed(0)}`);
  return { busy, long, sum };
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const all = {};
  for (let i = 0; i < RUNS; i++) {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await route(page, {});
    await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
      try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {} }, { seed: SEED });
    await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(14000);
    if (process.env.PRE) await page.evaluate(process.env.PRE);
    for (const [name, sel] of STEPS) {
      const r = await tap(ctx, page, sel);
      (all[name] = all[name] || []).push(r);
      await page.waitForTimeout(1500);
    }
    await ctx.close();
  }
  await browser.close();
  console.log(`Main-thread time in the 700 ms after the lift, ${RATE}x CPU, ${RUNS} runs (ms, median)`);
  for (const [name, rs] of Object.entries(all)) {
    const ok = rs.filter(Boolean);
    const med = v => { v = v.slice().sort((a, b) => a - b); return v[Math.floor(v.length / 2)] || 0; };
    console.log(`\n${name}: busy ${ok.map(r => r.busy.toFixed(0)).join(' / ')}   long tasks ${ok.map(r => r.long.join(',') || '-').join('  ')}`);
    const keys = new Set(ok.flatMap(r => Object.keys(r.sum)));
    [...keys].map(k => [k, med(ok.map(r => r.sum[k] || 0))]).filter(([, v]) => v >= 2).sort((a, b) => b[1] - a[1]).slice(0, 18)
      .forEach(([k, v]) => console.log(`  ${v.toFixed(1).padStart(7)}  ${k}`));
  }
})();
