/* Smoothness measurement: the numbers the S-phases in docs/PLAN.md are judged
   by. Headless Chromium at iPhone size (393x759), CPU slowed 4x (RATE=n to
   change), Firebase and the AI endpoints stood in for, as in the suites.

     cd tests
     node tools/perf.cjs            print the table
     JSON=out/perf.json node tools/perf.cjs   also save the raw numbers

   What it reports (baseline 2026-10-15 in docs/PLAN.md):
   - idle Home busy %: main thread busy while Home sits untouched, 5 s
   - taps: tap-to-paint and the wait before the handler ran (Event Timing)
   - startup: first paint, largest paint, long tasks, worst task
   - layout shift per screen change, and animations that are not
     transform/opacity (each one makes the browser redo layout or repaint)
   Chromium is a stand-in for Safari: compare runs with each other, and
   trust the ratios more than the milliseconds. */
const fs = require('fs');
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4);

const COLLECT = () => {
  const P = window.__P = { long: [], ls: [], ev: [], anims: new Map(), marks: {} };
  const ph = () => window.__phase || 'boot';
  const sel = n => { if (!n || !n.tagName) return String(n && n.nodeName); let s = n.tagName.toLowerCase(); if (n.id) s += '#' + n.id; const c = (n.className && n.className.baseVal === undefined ? String(n.className) : '').trim().split(/\s+/).filter(Boolean).slice(0, 2); if (c.length) s += '.' + c.join('.'); return s; };
  const obs = (type, fn, extra) => { try { new PerformanceObserver(l => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...(extra || {}) }); } catch (e) {} };
  obs('longtask', e => P.long.push({ d: Math.round(e.duration), phase: ph() }));
  obs('layout-shift', e => { if (!e.hadRecentInput) P.ls.push({ v: e.value, phase: ph(), src: (e.sources || []).slice(0, 2).map(s => sel(s.node)) }); });
  obs('event', e => { if (e.name === 'click') P.ev.push({ d: Math.round(e.duration), wait: Math.round(e.processingStart - e.startTime), run: Math.round(e.processingEnd - e.processingStart), phase: ph() }); }, { durationThreshold: 16 });
  obs('paint', e => { P.marks[e.name] = Math.round(e.startTime); });
  obs('largest-contentful-paint', e => { P.marks.lcp = Math.round(e.startTime); });
  const ok = p => ['transform', 'opacity', 'translate', 'scale', 'rotate'].includes(p);
  const tick = () => {
    try {
      for (const a of document.getAnimations()) {
        const t = a.effect && a.effect.target; if (!t) continue;
        let props = a.transitionProperty ? [a.transitionProperty] : [];
        if (!props.length) try { props = [...new Set(a.effect.getKeyframes().flatMap(k => Object.keys(k).filter(x => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))].map(p => p.replace(/[A-Z]/g, m => '-' + m.toLowerCase())); } catch (e) {}
        const bad = props.filter(p => !ok(p)); if (!bad.length) continue;
        const key = sel(t) + ' ' + (a.animationName || a.transitionProperty || 'script');
        P.anims.set(key, bad.join(','));
      }
    } catch (e) {}
    setTimeout(tick, 60);
  };
  tick();
};

async function phone(browser) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await cdp.send('Performance.enable');
  await route(page, {});
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {} }, { seed: SEED });
  await page.addInitScript(COLLECT);
  return { ctx, page, cdp };
}
const phase = (page, p) => page.evaluate(p => { window.__phase = p; }, p);
async function busy(page, cdp, ms = 5000) {
  const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const a = await m(); await page.waitForTimeout(ms); const z = await m();
  return Math.round((z.TaskDuration - a.TaskDuration) / (z.Timestamp - a.Timestamp) * 100);
}

(async () => {
  const browser = await chromium.launch();
  const out = { rate: RATE, at: new Date().toISOString() };
  const runs = {};
  for (const run of ['first visit', 'returning']) {
    const { ctx, page, cdp } = await phone(browser);
    if (run === 'returning') { await page.goto('https://interp.test/', { waitUntil: 'load' }); await page.waitForTimeout(6000); }
    await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#content .qa-tile'), null, { timeout: 60000 });
    await page.waitForTimeout(8000);
    const P = await page.evaluate(() => ({ marks: window.__P.marks, long: window.__P.long.filter(x => x.phase === 'boot').map(x => x.d) }));
    runs[run] = { fcp: P.marks['first-contentful-paint'], lcp: P.marks.lcp, longTasks: P.long.length, longMs: P.long.reduce((s, d) => s + d, 0), worst: Math.max(0, ...P.long) };
    if (run === 'first visit') {
      await page.evaluate(() => { goHome(); window.scrollTo(0, 0); }); await page.waitForTimeout(1500);
      out.idleHomeBusy = await busy(page, cdp);
      await page.evaluate(() => setCategory('all')); await page.waitForTimeout(1500);
      out.idleGlossaryBusy = await busy(page, cdp);
      const taps = {};
      const tap = async (label, locate, after) => {
        await phase(page, label);
        await page.evaluate(() => { goHome(); window.scrollTo(0, 0); }); await page.waitForTimeout(1500);
        const el = locate();
        try {
          if (label === 'More') {   // the tab bar tucks itself: open it the way a person does
            if (await page.evaluate(() => document.body.classList.contains('dock-mini'))) { await page.locator('.tabbar-btn.is-active').first().tap(); await page.waitForTimeout(700); }
          } else { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(700); }
          await el.tap({ timeout: 8000 }); await page.waitForTimeout(1500);
        } catch (e) { taps[label] = null; return; }
        const e = await page.evaluate(l => window.__P.ev.filter(x => x.phase === l).sort((a, b) => b.d - a.d)[0], label);
        taps[label] = e || null;
        if (after) await page.evaluate(after);
      };
      await tap('View all (section overlay)', () => page.locator('[data-home-section] .home-sec-more').first(), () => { try { navigateBack(); } catch (e) {} });
      await tap('Domain tile', () => page.locator('#content .home-tile, #content .domain-family').first());
      await tap('Name sheet (your initial)', () => page.locator('#tgAvatar'), () => closeNameModal());
      await tap('More', () => page.locator('.tabbar-btn[aria-label="More"]'), () => { try { closeMoreSheet(); } catch (e) {} });
      out.taps = taps;
      // Layout shift on screen changes: Home -> glossary -> Ask -> Home.
      await phase(page, 'nav');
      for (const c of ['all', 'ask', 'home', 'all', 'home']) { await page.evaluate(c => setCategory(c), c); await page.waitForTimeout(900); }
      const ls = await page.evaluate(() => window.__P.ls.filter(x => x.phase === 'nav'));
      out.shiftPerScreenChange = +(ls.reduce((s, x) => s + x.v, 0) / 5).toFixed(3);
      out.shiftSources = [...new Set(ls.flatMap(x => x.src))].slice(0, 6);
      // Scroll the glossary to catch the tab bar's tuck.
      await page.evaluate(() => { setCategory('all'); window.scrollTo(0, 0); }); await page.waitForTimeout(1000);
      for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(150); }
      for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -600); await page.waitForTimeout(150); }
      await page.waitForTimeout(800);
      out.nonCompositedAnimations = await page.evaluate(() => [...window.__P.anims.entries()].map(([k, v]) => k + ': ' + v));
    }
    await ctx.close();
  }
  out.startup = runs;
  await browser.close();

  const t = out.taps || {};
  console.log(`Smoothness at ${RATE}x CPU, 393x759 (lower is better)`);
  console.log(`  idle Home busy            ${out.idleHomeBusy}%   (glossary ${out.idleGlossaryBusy}%)`);
  for (const [k, v] of Object.entries(t)) console.log(`  tap: ${k.padEnd(26)} ${v ? `${v.d} ms to paint, waited ${v.wait} ms, handler ${v.run} ms` : 'no event recorded'}`);
  for (const [k, v] of Object.entries(runs)) console.log(`  startup, ${k.padEnd(12)} first paint ${v.fcp} ms, largest paint ${v.lcp} ms, ${v.longTasks} long tasks (${v.longMs} ms), worst ${v.worst} ms`);
  console.log(`  layout shift per screen change ${out.shiftPerScreenChange}  ${out.shiftSources.join(', ')}`);
  console.log(`  animations not transform/opacity: ${out.nonCompositedAnimations.length}`);
  out.nonCompositedAnimations.forEach(a => console.log('    ' + a));
  if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(out, null, 1));
})();
