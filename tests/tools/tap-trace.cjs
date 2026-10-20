/* One tap, task by task (S4): what the tap's handler and the frames after it
   spend, with the script line behind each forced layout or style. Headless
   Chromium at iPhone size, CPU 4x (RATE=n), Firebase and the AI endpoints
   stood in for. Home is left to settle first, then the tap is traced.

     cd tests
     node tools/tap-trace.cjs                      a domain tile on Home
     SEL='.tabbar-btn[aria-label="Chat"]' node tools/tap-trace.cjs
     RUNS=3 ...                                    runs (medians printed)
     UA=chromium ...                               Chromium's own paths
     PROFILE=1 ...                                 + the click's script time by function
     CSS='...' ...                                 extra CSS in the page (an experiment, A/B)

   Per run: the click's wait and handler time (Event Timing), tap to next
   paint, and every task over 16 ms in the 1.5 s after the tap with its
   biggest pieces and forced layout/style (ms, by function file:line). */
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), RUNS = +(process.env.RUNS || 1);
const SEL = process.env.SEL || '#content .home-tile, #content .domain-family';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const short = u => (u || '').replace(/^https?:\/\/[^/]+\//, '') || '(page)';

async function once(browser) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...(process.env.UA === 'chromium' ? {} : { userAgent: UA }), serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await route(page, {});
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    window.__ev = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.name === 'click') window.__ev.push({ d: Math.round(e.duration), wait: Math.round(e.processingStart - e.startTime), run: Math.round(e.processingEnd - e.processingStart) }); })).observe({ type: 'event', buffered: true, durationThreshold: 16 }); } catch (e) {} }, { seed: SEED });
  await page.goto('https://interp.test/', { waitUntil: 'load' });
  if (process.env.CSS) await page.addStyleTag({ content: process.env.CSS });
  await page.waitForTimeout(9000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await page.waitForTimeout(1000);
  const events = [];
  cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack', transferMode: 'ReportEvents' });
  await page.waitForTimeout(300);
  if (process.env.PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); await cdp.send('Profiler.start'); }
  await page.locator(SEL).first().tap({ timeout: 8000 });
  await page.waitForTimeout(1500);
  const prof = process.env.PROFILE ? (await cdp.send('Profiler.stop')).profile : null;
  await cdp.send('Tracing.end'); await done;
  const ev = await page.evaluate(() => window.__ev.slice(-1)[0] || null);
  const errors = await page.evaluate(() => (window.__errs || []).length);
  await ctx.close();

  const by = new Map();
  for (const e of events) if (e.name === 'RunTask' && e.dur) by.set(e.tid, (by.get(e.tid) || 0) + e.dur);
  const tid = [...by.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const main = events.filter(e => e.tid === tid && e.ph === 'X' && e.dur);
  const click = main.find(e => e.name === 'EventDispatch' && e.args && e.args.data && e.args.data.type === 'click');
  const from = click ? click.ts - 200000 : Math.min(...main.map(e => e.ts));
  const label = e => { const d = (e.args && e.args.data) || {};
    if (e.name === 'FunctionCall') return `${d.functionName || '(anon)'} ${short(d.url)}:${(d.lineNumber || 0) + 1}`;
    if (e.name === 'EventDispatch') return 'event ' + d.type;
    if (e.name === 'TimerFire') return 'timer'; if (e.name === 'FireAnimationFrame') return 'rAF'; return e.name; };
  const tasks = main.filter(e => e.name === 'RunTask' && e.dur > 16000 && e.ts >= from).map(t => {
    const kids = main.filter(e => e !== t && e.ts >= t.ts && e.ts + e.dur <= t.ts + t.dur);
    const top = kids.filter(e => ['FunctionCall', 'EventDispatch', 'Layout', 'UpdateLayoutTree', 'Paint', 'TimerFire', 'FireAnimationFrame', 'ParseHTML'].includes(e.name))
      .sort((a, b) => b.dur - a.dur).slice(0, 5).map(e => `${label(e)} ${(e.dur / 1000).toFixed(1)}`);
    const forced = kids.filter(e => (e.name === 'Layout' || e.name === 'UpdateLayoutTree') && e.dur > 2000).map(e => {
      const st = (e.args && ((e.args.beginData && e.args.beginData.stackTrace) || (e.args.data && e.args.data.stackTrace))) || [];
      return st.length ? `${(e.dur / 1000).toFixed(1)} ${e.name} by ${st.slice(0, 3).map(f => `${f.functionName || '(anon)'} ${short(f.url)}:${f.lineNumber + 1}`).join(' < ')}` : null;
    }).filter(Boolean);
    return { at: Math.round((t.ts - (click ? click.ts : from)) / 1000), ms: Math.round(t.dur / 1000), top, forced, hasClick: kids.includes(click) };
  });
  // PROFILE: samples inside the click, self and total time per function (a function's total counts once per sample)
  let fns = null;
  if (prof && click) {
    const node = new Map(prof.nodes.map(n => [n.id, n])), parent = new Map();
    prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
    const name = n => `${n.callFrame.functionName || '(anon)'} ${short(n.callFrame.url)}:${n.callFrame.lineNumber + 1}`;
    const self = new Map(), total = new Map(); let t = prof.startTime;
    prof.samples.forEach((id, i) => { t += prof.timeDeltas[i]; const dt = (prof.timeDeltas[i + 1] || 100) / 1000;
      if (t < click.ts || t > click.ts + click.dur) return;
      const n = node.get(id); self.set(name(n), (self.get(name(n)) || 0) + dt);
      const seen = new Set(); for (let k = id; k != null; k = parent.get(k)) { const nm = name(node.get(k)); if (seen.has(nm)) continue; seen.add(nm); total.set(nm, (total.get(nm) || 0) + dt); } });
    const top = m => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, v]) => `${v.toFixed(1)} ${k}`);
    fns = { self: top(self), total: top(total) };
  }
  return { ev, tasks, fns };
}

(async () => {
  const browser = await chromium.launch();
  const runs = []; for (let i = 0; i < RUNS; i++) runs.push(await once(browser));
  await browser.close();
  const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  console.log(`Tap "${SEL}" at ${RATE}x, ${process.env.UA === 'chromium' ? 'Chromium' : 'iPhone'} UA, ${RUNS} run(s)`);
  runs.forEach((r, i) => { const h = r.tasks.find(t => t.hasClick);
    console.log(`  run ${i + 1}: click ${r.ev ? `wait ${r.ev.wait} ms, handler ${r.ev.run} ms, to paint ${r.ev.d} ms` : '(no event entry)'}; handler task ${h ? h.ms : '?'} ms`); });
  console.log(`  median: handler ${med(runs.map(r => r.ev && r.ev.run))} ms, to paint ${med(runs.map(r => r.ev && r.ev.d))} ms`);
  const r = runs[runs.length - 1];
  console.log('  tasks of the last run (ms after the click, duration, pieces, forced):');
  r.tasks.forEach(t => { console.log(`    @${t.at} ${t.ms} ms${t.hasClick ? ' (click)' : ''}: ${t.top.join(' | ')}`); t.forced.forEach(f => console.log(`        F ${f}`)); });
  if (r.fns) { console.log('  click, self ms by function:'); r.fns.self.forEach(l => console.log('    ' + l));
    console.log('  click, total ms by function:'); r.fns.total.forEach(l => console.log('    ' + l)); }
})();
