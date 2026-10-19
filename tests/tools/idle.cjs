/* Home sitting still: what runs during its long frames. For the stall
   Jose's iPhone shows while Home is left alone (S7 in docs/PLAN.md).
   iPhone size, CPU slowed 4x (RATE=n), the app opened fresh, the meter
   started START s after load (3, about when a person reaches it), then
   Home left alone for IDLE s (27). A Chrome trace names what ran in every
   main-thread task over LONG ms (50): its timers, frame callbacks, events,
   script (by function and line), style, layout and paint.

     cd tests
     node tools/idle.cjs                    one run
     SCROLL=1 node tools/idle.cjs           scroll Home first (drags), then still
     RUNS=3 node tools/idle.cjs             three
     INDEX=/path/old.html node tools/idle.cjs   another index.html
     START=14 node tools/idle.cjs           start after the hello is over
     UA=iphone node tools/idle.cjs          the iPhone paths (CSS petals:
                                            Chromium runs them on its main
                                            thread, so busy % means little)

   Reports the meter's numbers for the still part and every long task with
   its time since load. Chromium stands in for Safari: it says what ran,
   not what the phone pays for it. */
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), RUNS = +(process.env.RUNS || 1);
const SCROLL = +(process.env.SCROLL || 0), START = +(process.env.START || 3), IDLE = +(process.env.IDLE || 27), LONG = +(process.env.LONG || 50);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';

// The meter's own wording for a stall (fmStallText in index.html).
function fmStallText(x) {
  const t = Math.floor(x.at / 1000), sc = x.scroll < 200 ? 'while scrolling' : x.scroll > 3e5 ? 'no scroll yet' : `${(x.scroll / 1000).toFixed(1)} s after a scroll`;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} · ${x.ms} ms · ${x.screen} · ${sc} · ${Math.round(x.up / 1000)} s after opening · ${x.what || 'nothing named'}`;
}

// What a task did, from its trace children: the biggest pieces first.
function pieces(task, evs) {
  const end = task.ts + task.dur, out = {};
  for (const e of evs) {
    if (e.tid !== task.tid || e.pid !== task.pid || e.ts < task.ts || e.ts >= end || e === task || !e.dur) continue;
    let k = null;
    const d = (e.args && e.args.data) || {};
    if (e.name === 'FunctionCall') k = 'js ' + (d.functionName || '(anon)') + ' ' + String(d.url || '').split('/').pop() + ':' + d.lineNumber;
    else if (e.name === 'TimerFire') k = 'timer ' + d.timerId;
    else if (e.name === 'FireAnimationFrame') k = 'frame callback';
    else if (e.name === 'EventDispatch') k = 'event ' + d.type;
    else if (['UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'Commit', 'ParseHTML', 'EvaluateScript', 'v8.compile', 'MajorGC', 'MinorGC', 'V8.GC_MC_BACKGROUND_MARKING', 'FireIdleCallback', 'XHRReadyStateChange', 'ResourceReceivedData', 'Decode Image', 'ImageDecodeTask'].includes(e.name)) k = e.name + (e.name === 'UpdateLayoutTree' && e.args && e.args.elementCount ? '' : '');
    if (!k) continue;
    out[k] = (out[k] || 0) + e.dur / 1000;
  }
  return Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, ms]) => `${k} ${ms.toFixed(0)}`).join(' · ');
}

async function once(browser, i) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...(process.env.UA === 'iphone' ? { userAgent: UA } : {}), serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await route(page, {});
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {} }, { seed: SEED });
  // Body class changes with their time (the tab bar's tuck is dock-mini).
  await page.addInitScript(() => { window.__bodyLog = []; document.addEventListener('DOMContentLoaded', () => {
    let was = new Set(document.body.classList);
    new MutationObserver(() => { const now = new Set(document.body.classList);
      const d = [...now].filter(c => !was.has(c)).map(c => '+' + c).concat([...was].filter(c => !now.has(c)).map(c => '-' + c));
      if (d.length) window.__bodyLog.push((performance.now() / 1000).toFixed(1) + ' ' + d.join(' ')); was = now;
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] }); }); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  const evs = [];
  cdp.on('Tracing.dataCollected', d => evs.push(...d.value));
  await cdp.send('Tracing.start', { categories: 'toplevel,devtools.timeline,disabled-by-default-devtools.timeline,blink.user_timing,v8,disabled-by-default-v8.gc', transferMode: 'ReportEvents' });
  await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof frameMeterStart === 'function');
  await page.waitForTimeout(START * 1000);
  const startAt = await page.evaluate(() => { FM.on = false; frameMeterStart(); performance.mark('idle-start'); return performance.now(); });
  // SCROLL=n: n rounds of finger drags first (3 flicks down, 3 back up, as
  // scroll.cjs), so the still part follows a scroll as on Jose's phone.
  let touchAt = null;
  if (SCROLL) {
    const drag = async (from, to) => {
      const step = from > to ? -18 : 18;
      for (let y = from; step < 0 ? y >= to : y <= to; y += step) await cdp.send('Input.dispatchTouchEvent', { type: y === from ? 'touchStart' : 'touchMove', touchPoints: [{ x: 196, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(700);
    };
    for (let i = 0; i < SCROLL; i++) { for (let k = 0; k < 3; k++) await drag(620, 170); for (let k = 0; k < 3; k++) await drag(170, 620); }
    touchAt = await page.evaluate(() => performance.now() - 700);
  }
  await page.waitForTimeout(IDLE * 1000);
  const run = await page.evaluate(() => { const g = FM.gaps.map(x => [Math.round(x[0])]); const r = frameMeterStop(); frameMeterClose(); return { r, long: g }; });
  const bodyLog = await page.evaluate(() => window.__bodyLog);
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.end'); await done;
  await ctx.close();
  // Trace times are microseconds on their own clock: line them up on the
  // mark made as the meter started (startAt ms after load).
  const mark = evs.find(e => e.name === 'idle-start');
  const main = (evs.find(e => e.name === 'thread_name' && e.args.name === 'CrRendererMain' && e.pid === mark.pid) || mark).tid;
  const at = ts => startAt + (ts - mark.ts) / 1000;
  const tasks = evs.filter(e => e.name === 'RunTask' && e.pid === mark.pid && e.tid === main && e.dur >= LONG * 1000 && e.ts >= mark.ts);
  return { r: run.r, startAt, touchAt, bodyLog, tasks: tasks.map(t => ({ at: (at(t.ts) / 1000).toFixed(1), ms: Math.round(t.dur / 1000), what: pieces(t, evs) })), errors };
}

(async () => {
  const browser = await chromium.launch();
  for (let i = 0; i < RUNS; i++) {
    const x = await once(browser, i);
    const r = x.r;
    console.log(`run ${i + 1}: rate ${RATE}x, meter from ${(x.startAt / 1000).toFixed(1)} s after load` + (x.touchAt ? `, ${SCROLL} scroll round(s), last touch ${(x.touchAt / 1000).toFixed(1)} s` : '') + `, then ${IDLE} s still`);
    if (r) console.log(`  meter: ${r.ratio} ms/s, ${r.pct}% dropped, worst ${r.worst} ms, ${r.stalls} over 100 ms, ${Math.round(r.ms / 1000)} s`);
    if (r && r.stallList) { console.log('  the meter\'s longest stalls:'); r.stallList.forEach(t => console.log('   ' + fmStallText(t))); }
    console.log(`  tasks over ${LONG} ms: ${x.tasks.length}`);
    x.tasks.forEach(t => console.log(`   ${t.at.padStart(5)} s ${String(t.ms).padStart(4)} ms  ${t.what}`));
    console.log('  body classes: ' + x.bodyLog.filter(l => +l.split(' ')[0] >= x.startAt / 1000).join(' | '));
    if (x.errors.length) console.log('  page errors:', x.errors.slice(0, 3));
  }
  await browser.close();
})();
