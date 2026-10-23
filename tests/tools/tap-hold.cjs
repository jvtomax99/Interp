/* A real tap on Home, timed from the lift (Home taps). Playwright's tap()
   presses and lifts at once, so tap-trace counts the touchstart work a real
   thumb hides while it is still down. Here the finger is held HOLD ms (90,
   a quick tap) with CDP touch events, and each tap is timed from touchend:
   lift -> click handler starts, the handler, lift -> next paint (Event
   Timing). iPhone size, CPU 4x (RATE=n), Home settled first, back to Home
   between taps.

     cd tests
     node tools/tap-hold.cjs                  every target, RUNS=3
     T=tile RUNS=5 node tools/tap-hold.cjs    one target
     UA=chromium ...                          Chromium's own paths
     PRE='js' ...                             run js in the page first (an experiment)
     TRACE=1 ...                              + every task from the lift to the click, by piece */
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), RUNS = +(process.env.RUNS || 3), HOLD = +(process.env.HOLD || 90);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const TARGETS = { tile: '#content .home-tile, #content .domain-family', qa: '#content .qa-tile', viewall: '#content .home-rail-more, #content .home-sec-more, #content [class*="view-all"]', chat: '.tabbar-btn[aria-label="Chat"]' };
const pick = process.env.T ? { [process.env.T]: TARGETS[process.env.T] } : TARGETS;

async function once(browser, sel) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...(process.env.UA === 'chromium' ? {} : { userAgent: UA }), serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await route(page, {});
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    window.__T = { lift: 0, ev: null };
    window.addEventListener('touchend', e => { window.__T.lift = e.timeStamp; }, { capture: true, passive: true });
    try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.name === 'click') window.__T.ev = { start: e.startTime, ps: e.processingStart, pe: e.processingEnd, end: e.startTime + e.duration }; })).observe({ type: 'event', buffered: true, durationThreshold: 16 }); } catch (e) {} }, { seed: SEED });
  await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(14000);
  if (process.env.PRE) await page.evaluate(process.env.PRE);
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(1500);
  const box = await el.boundingBox();
  if (!box) { await ctx.close(); return null; }
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const events = []; let done = null;
  if (process.env.TRACE) {
    cdp.on('Tracing.dataCollected', d => events.push(...d.value));
    done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack'] } });
  }
  await page.evaluate(() => { window.__T.lift = 0; window.__T.ev = null; });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await page.waitForTimeout(HOLD);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(1500);
  const t = await page.evaluate(() => window.__T);
  let gap = null;
  if (done) { await cdp.send('Tracing.end'); await done; gap = gapTasks(events); }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await ctx.close();
  if (!t.ev || !t.lift) return { errors, missed: true };
  return { wait: Math.round(t.ev.ps - t.lift), run: Math.round(t.ev.pe - t.ev.ps), paint: Math.round(t.ev.end - t.lift), errors, gap };
}

const short = u => (u || '').replace(/^https?:\/\/[^/]+\//, '') || '(page)';
// Every main-thread task from the touchend to the click, with its biggest pieces.
function gapTasks(events) {
  const by = new Map();
  for (const e of events) if (e.name === 'RunTask' && e.dur) by.set(e.tid, (by.get(e.tid) || 0) + e.dur);
  const tid = [...by.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const main = events.filter(e => e.tid === tid && e.ph === 'X' && e.dur);
  const disp = type => main.find(e => e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === type);
  const lift = disp('touchend') || disp('pointerup'), click = disp('click');
  if (!lift || !click) return ['(no touchend/click in the trace)'];
  const label = e => { const d = (e.args && e.args.data) || {};
    if (e.name === 'FunctionCall') return `${d.functionName || '(anon)'} ${short(d.url)}:${(d.lineNumber || 0) + 1}`;
    if (e.name === 'EventDispatch') return 'event ' + d.type;
    if (e.name === 'TimerFire') return 'timer'; if (e.name === 'FireAnimationFrame') return 'rAF'; return e.name; };
  const out = [`touchend handled -> click handler starts: ${((click.ts - lift.ts) / 1000).toFixed(1)} ms (trace)`];
  for (const t of main.filter(e => e.name === 'RunTask' && e.ts + e.dur >= lift.ts && e.ts <= click.ts)) {
    const kids = main.filter(e => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur);
    const top = kids.filter(e => ['FunctionCall', 'EventDispatch', 'Layout', 'UpdateLayoutTree', 'Paint', 'PrePaint', 'Layerize', 'TimerFire', 'FireAnimationFrame', 'HitTest', 'ParseHTML', 'Commit'].includes(e.name))
      .sort((a, b) => b.dur - a.dur).slice(0, 6).map(e => `${label(e)} ${(e.dur / 1000).toFixed(1)}`);
    const forced = kids.filter(e => (e.name === 'Layout' || e.name === 'UpdateLayoutTree') && e.dur > 1500).map(e => {
      const st = (e.args && ((e.args.beginData && e.args.beginData.stackTrace) || (e.args.data && e.args.data.stackTrace))) || [];
      return st.length ? `F ${(e.dur / 1000).toFixed(1)} ${e.name} by ${st.slice(0, 3).map(f => `${f.functionName || '(anon)'} ${short(f.url)}:${f.lineNumber + 1}`).join(' < ')}` : null; }).filter(Boolean);
    if (kids.includes(click)) { const pre = kids.filter(e => e.ts < click.ts && e.ts + e.dur <= click.ts && ['FunctionCall', 'EventDispatch', 'Layout', 'UpdateLayoutTree', 'HitTest', 'TimerFire'].includes(e.name)).sort((a, b) => b.dur - a.dur).slice(0, 10);
      const agg = {}; kids.filter(e => e.ts + e.dur <= click.ts && e.dur > 300).forEach(e => { const k = label(e); agg[k] = (agg[k] || 0) + e.dur / 1000; });
      out.push('  all pieces before the click (nested counted twice): ' + Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(' | '));
      out.push(`  before the click inside its task: ${((click.ts - t.ts) / 1000).toFixed(1)} ms: ` + pre.map(e => `${label(e)} ${(e.dur / 1000).toFixed(1)}`).join(' | ')); }
    out.push(`@${Math.round((t.ts - lift.ts) / 1000)} ${(t.dur / 1000).toFixed(1)} ms${kids.includes(click) ? ' (click)' : ''}: ${top.join(' | ')}`, ...forced.map(f => '      ' + f));
  }
  return out;
}

(async () => {
  const browser = await chromium.launch();
  console.log(`Taps held ${HOLD} ms at ${RATE}x, ${process.env.UA === 'chromium' ? 'Chromium' : 'iPhone'} UA, ${RUNS} run(s) each; ms from the lift`);
  for (const [name, sel] of Object.entries(pick)) {
    const rs = []; for (let i = 0; i < RUNS; i++) rs.push(await once(browser, sel));
    const ok = rs.filter(r => r && !r.missed);
    const med = k => { const v = ok.map(r => r[k]).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
    console.log(`  ${name.padEnd(8)} wait ${med('wait')}  handler ${med('run')}  lift->paint ${med('paint')}   [${ok.map(r => r.wait + '/' + r.run + '/' + r.paint).join('  ')}]${ok.length < RUNS ? '  missed ' + (RUNS - ok.length) : ''}`);
    const last = ok[ok.length - 1]; if (last && last.gap) last.gap.forEach(l => console.log('    ' + l));
    const errs = rs.flatMap(r => (r && r.errors) || []); if (errs.length) console.log('    page errors:', errs.slice(0, 2));
  }
  await browser.close();
})();
