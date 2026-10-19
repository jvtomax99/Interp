/* Startup, task by task (S3): which work makes each long task while the app
   opens. Headless Chromium at iPhone size, CPU 4x (RATE=n), Firebase and the
   AI endpoints stood in for, as in the suites.

     cd tests
     node tools/startup.cjs              iPhone user agent (CSS petals path)
     UA=chromium node tools/startup.cjs  Chromium's own paths (worker petals)
     RUNS=3 RETURNING=1 ...              runs; a second load after a first
     JSON=out/startup.json ...           also save the raw numbers

   Per run: first paint, long tasks (> 50 ms) in the first 12 s with the
   biggest pieces of each (script function and file:line, layout, style),
   and the functions with the most time in that window (CPU profile, total
   time incl. what they call). Compare medians across runs; startup varies. */
const fs = require('fs');
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), RUNS = +(process.env.RUNS || 1), WINDOW = 12000;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';

const short = u => (u || '').replace(/^https?:\/\/[^/]+\//, '') || '(page)';

async function once(browser) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...(process.env.UA === 'chromium' ? {} : { userAgent: UA }), serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await route(page, {});
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    window.__fcp = 0; try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.name === 'first-contentful-paint') window.__fcp = Math.round(e.startTime); })).observe({ type: 'paint', buffered: true }); } catch (e) {} }, { seed: SEED });
  if (process.env.RETURNING) { await page.goto('https://interp.test/', { waitUntil: 'load' }); await page.waitForTimeout(8000); }

  const events = [];
  cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack', transferMode: 'ReportEvents' });
  await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(WINDOW);
  const fcp = await page.evaluate(() => window.__fcp);
  await cdp.send('Tracing.end'); await done;
  const { profile } = await cdp.send('Profiler.stop');
  await ctx.close();

  // Main renderer thread: the one with the most RunTask time.
  const by = new Map();
  for (const e of events) if (e.name === 'RunTask' && e.dur) by.set(e.tid, (by.get(e.tid) || 0) + e.dur);
  const tid = [...by.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const main = events.filter(e => e.tid === tid && e.ph === 'X' && e.dur);
  const nav = events.find(e => e.name === 'navigationStart' || e.name === 'NavigationStart' || e.name === 'markDOMContent');
  const t0 = Math.min(...main.map(e => e.ts));
  const tasks = main.filter(e => e.name === 'RunTask' && e.dur > 50000 * 1).map(t => {
    const kids = main.filter(e => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur);
    const label = e => {
      const d = (e.args && e.args.data) || {};
      if (e.name === 'FunctionCall') return `${d.functionName || '(anon)'} ${short(d.url)}:${(d.lineNumber || 0) + 1}`;
      if (e.name === 'EvaluateScript') return `script ${short(d.url)}`;
      if (e.name === 'TimerFire') return 'timer';
      if (e.name === 'FireAnimationFrame') return 'rAF';
      if (e.name === 'EventDispatch') return 'event ' + d.type;
      return e.name;
    };
    const top = kids.filter(e => ['FunctionCall', 'EvaluateScript', 'Layout', 'UpdateLayoutTree', 'ParseHTML', 'ParseAuthorStyleSheet', 'Paint', 'v8.compile', 'v8.compileModule'].includes(e.name))
      .map(e => ({ what: label(e), ms: +(e.dur / 1000).toFixed(1) })).sort((a, b) => b.ms - a.ms).slice(0, 5);
    // Every kind of work in a task over 200 ms, by name and by script call
    // (nested pieces overlap, so these don't add up to the task).
    const names = {};
    if (t.dur > 200000) for (const e of kids) { const k = e.name === 'FunctionCall' || e.name === 'TimerFire' || e.name === 'FireAnimationFrame' || e.name === 'EvaluateScript' || e.name === 'EventDispatch' ? label(e) : e.name; names[k] = +((names[k] || 0) + e.dur / 1000).toFixed(1); }
    // Layout and style forced from script (a read right after a write), with
    // the script line that forced it.
    const forced = t.dur > 200000 ? kids.filter(e => (e.name === 'Layout' || e.name === 'UpdateLayoutTree') && e.dur > 3000).map(e => {
      const st = (e.args && ((e.args.beginData && e.args.beginData.stackTrace) || (e.args.data && e.args.data.stackTrace))) || [];
      return st.length ? `${(e.dur / 1000).toFixed(1)} ${e.name} by ${st.slice(0, 3).map(f => `${f.functionName || '(anon)'} ${short(f.url)}:${f.lineNumber + 1}`).join(' < ')}` : null;
    }).filter(Boolean) : [];
    return { at: Math.round((t.ts - t0) / 1000), ms: Math.round(t.dur / 1000), top, names, forced };
  });

  // CPU profile: total time per function (self + callees), counted once per sample.
  const nodes = new Map(profile.nodes.map(n => [n.id, n]));
  const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const self = new Map(), total = new Map();
  const key = n => `${n.callFrame.functionName || '(anon)'} ${short(n.callFrame.url)}:${n.callFrame.lineNumber + 1}`;
  const dts = profile.timeDeltas;
  profile.samples.forEach((id, i) => {
    const dt = (dts[i + 1] || 0) / 1000; const n = nodes.get(id); if (!n) return;
    if (['(idle)', '(program)', '(garbage collector)', '(root)'].includes(n.callFrame.functionName)) return;
    self.set(key(n), (self.get(key(n)) || 0) + dt);
    const seen = new Set(); let c = id;
    while (c != null) { const m = nodes.get(c); const k = key(m); if (m.callFrame.functionName !== '(root)' && !seen.has(k)) { seen.add(k); total.set(k, (total.get(k) || 0) + dt); } c = parent.get(c); }
  });
  // Samples inside each task over 200 ms: what the script was doing (total
  // per function, callees included). Profiler and trace share one clock.
  let ts = profile.startTime; const stamp = profile.timeDeltas.map(d => (ts += d));
  for (const t of tasks.filter(t => t.ms > 200)) {
    const from = t0 + t.at * 1000, to = from + t.ms * 1000, inT = new Map();
    profile.samples.forEach((id, i) => {
      if (stamp[i] < from || stamp[i] > to) return;
      const dt = (dts[i + 1] || 0) / 1000, seen = new Set(); let c = id;
      while (c != null) { const m = nodes.get(c); const k = key(m); if (!['(root)', '(program)', '(idle)'].includes(m.callFrame.functionName) && !seen.has(k)) { seen.add(k); inT.set(k, (inT.get(k) || 0) + dt); } c = parent.get(c); }
    });
    t.js = [...inT.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => `${Math.round(v)} ${k}`);
  }
  const rank = m => [...m.entries()].filter(([k]) => !/^\(anon\) \(page\):1$/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => ({ fn: k, ms: Math.round(v) }));
  return { fcp, longTasks: tasks.length, longMs: tasks.reduce((s, t) => s + t.ms, 0), worst: Math.max(0, ...tasks.map(t => t.ms)), over200: tasks.filter(t => t.ms > 200).length, tasks, totalTop: rank(total), selfTop: rank(self).slice(0, 15) };
}

(async () => {
  const browser = await chromium.launch();
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await once(browser));
  await browser.close();
  const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  console.log(`Startup at ${RATE}x, ${process.env.UA === 'chromium' ? 'Chromium' : 'iPhone'} UA, ${process.env.RETURNING ? 'returning' : 'first visit'}, ${RUNS} run(s)`);
  runs.forEach((r, i) => console.log(`  run ${i + 1}: first paint ${r.fcp} ms, ${r.longTasks} long tasks (${r.longMs} ms), worst ${r.worst} ms, ${r.over200} over 200 ms`));
  console.log(`  median: worst ${med(runs.map(r => r.worst))} ms, long tasks ${med(runs.map(r => r.longTasks))}, over 200 ms ${med(runs.map(r => r.over200))}`);
  if (!process.env.QUIET) {
    const r = runs[runs.length - 1];
    console.log('  long tasks of the last run (at ms, duration, biggest pieces):');
    r.tasks.filter(t => t.ms > 100).forEach(t => console.log(`    @${t.at} ${t.ms} ms: ${t.top.map(x => `${x.what} ${x.ms}`).join(' | ')}`));
    console.log('  most total time, last run:'); r.totalTop.forEach(x => console.log(`    ${String(x.ms).padStart(5)} ms  ${x.fn}`));
    console.log('  most self time, last run:'); r.selfTop.forEach(x => console.log(`    ${String(x.ms).padStart(5)} ms  ${x.fn}`));
  }
  if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(runs, null, 1));
})();
