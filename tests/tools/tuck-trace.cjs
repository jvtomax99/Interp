/* What one tuck and one open of the tab bar restyle (S7b in docs/PLAN.md):
   a Chrome trace with style invalidation tracking around dockTuck() and
   dockOpen() on Home, iPhone size, CPU 4x. Prints each style recalc (elements,
   ms) and which rules or changes pulled elements in.

     cd tests && node tools/tuck-trace.cjs
     INDEX=/path/old.html node tools/tuck-trace.cjs   another index.html */
const L = require('../support/harness.cjs');
(async () => {
  const b = await L.chromium.launch();
  const { page, ctx } = await L.boot(b, { device: 'iphone', settle: 14000 });
  const cdp = await page.context().newCDPSession(page);
  await page.evaluate(() => { dockOpen(); dockIdleRestart(); });
  await page.waitForTimeout(800);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.RATE || 4) });
  const events = [];
  cdp.on('Tracing.dataCollected', d => events.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.invalidationTracking', 'blink.user_timing'] } });
  for (const step of ['tuck', 'open']) {
    await page.evaluate(s => { dockIdleRestart(); performance.mark('step-' + s); s === 'tuck' ? dockTuck() : dockOpen(); }, step);
    await page.waitForTimeout(1200);
  }
  await cdp.send('Tracing.end'); await done;
  const marks = events.filter(e => /^step-/.test(e.name)).map(e => ({ name: e.name.slice(5), ts: e.ts })).sort((a, b) => a.ts - b.ts);
  const stepOf = ts => { let s = '-'; for (const m of marks) if (ts >= m.ts) s = m.name; return s; };
  const out = {};
  for (const e of events) {
    if (!marks.length || e.ts < marks[0].ts) continue;
    const s = stepOf(e.ts), o = out[s] || (out[s] = { recalcs: [], why: {}, sel: {} });
    if (e.name === 'UpdateLayoutTree' && e.ph === 'X') o.recalcs.push([e.args && e.args.elementCount, +(e.dur / 1000).toFixed(1)]);
    if (e.name === 'StyleRecalcInvalidationTracking') { const k = (e.args.data.reason || '?') + ' ' + (e.args.data.extraData || ''); o.why[k] = (o.why[k] || 0) + 1; }
    if (e.name === 'StyleInvalidatorInvalidationTracking') {
      const d = e.args.data; const k = d.reason + ' ' + (d.invalidationList || []).map(l => JSON.stringify(l.classes || l.tagNames || l.ids || l.attributes || l)).join(';') + (d.selectors ? ' sel=' + d.selectors.map(x => x.selector).join(' | ') : '');
      o.sel[k.slice(0, 220)] = (o.sel[k.slice(0, 220)] || 0) + 1;
    }
  }
  for (const [s, o] of Object.entries(out)) {
    const big = o.recalcs.filter(r => r[0] > 20);
    console.log('== ' + s + ': ' + o.recalcs.length + ' style recalcs, ' + o.recalcs.reduce((a, r) => a + (r[0] || 0), 0) + ' elements, ' + o.recalcs.reduce((a, r) => a + r[1], 0).toFixed(1) + ' ms; over 20 elements: ' + JSON.stringify(big));
    console.log('  recalc reasons: ' + JSON.stringify(Object.entries(o.why).sort((a, b) => b[1] - a[1]).slice(0, 12)));
    console.log('  invalidations: '); Object.entries(o.sel).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, n]) => console.log('    ' + n + ' x ' + k));
  }
  await b.close();
})();
