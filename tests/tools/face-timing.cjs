/* Dr. Smiley's face on a clock (feel audit, phase 0, lead 3). His face
   frames are stepped by timers (DrAnim.later, DR_STEP ms each); this
   measures how late each timer fires against what it asked for, in three
   windows: the opening (the hello's greet and his first idle, 0-14 s),
   Home at rest (14-34 s, idle only), then each performance played on the
   Home face while Home is at rest. A frame later than 17 ms is one screen
   frame late at 60 Hz; over 50 ms is a visible hitch.
   iPhone size, CPU slowed 4x (RATE=n), Firebase and the AI endpoints stood
   in for, as in the suites. Chromium stands in for Safari.

     cd tests
     node tools/face-timing.cjs
     UA=chromium node tools/face-timing.cjs   Chromium's own paths (worker petals)
     RUNS=3 ...                               repeat (medians are printed per run) */
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), RUNS = +(process.env.RUNS || 1);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';
const PERFS = ['greet', 'think', 'cheer', 'bounce', 'wince', 'ack', 'wink'];

const stats = xs => {
  if (!xs.length) return 'none';
  const s = [...xs].sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const over = n => Math.round(100 * s.filter(x => x > n).length / s.length);
  return `n ${s.length}  median ${q(.5).toFixed(0)}  p95 ${q(.95).toFixed(0)}  worst ${s[s.length - 1].toFixed(0)} ms  late >17: ${over(17)}%  >50: ${over(50)}%`;
};

async function once(browser) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...(process.env.UA === 'chromium' ? {} : { userAgent: UA }), serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await route(page, {});
  await page.addInitScript(o => {
    window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    const L = window.__face = { timers: [], long: [], tag: 'opening' };
    try { new PerformanceObserver(l => l.getEntries().forEach(e => L.long.push({ t: Math.round(e.startTime), ms: Math.round(e.duration), tag: L.tag }))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    const iv = setInterval(() => {
      let ok = false; try { ok = typeof DrAnim === 'function'; } catch (e) {}
      if (!ok) return;
      clearInterval(iv);
      const P = DrAnim.prototype, later = P.later;
      P.later = function (fn, ms) {
        const at = performance.now(), run = (this.run && this.run.name) || (this.idle ? 'idle' : '');
        return later.call(this, () => { L.timers.push({ run, ms, late: +(performance.now() - at - ms).toFixed(1), t: Math.round(performance.now()), tag: L.tag }); fn(); }, ms);
      };
    }, 2);
  }, { seed: SEED });
  await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(14000);
  await page.evaluate(() => { window.__face.tag = 'rest'; });
  await page.waitForTimeout(20000);
  for (const name of PERFS) {
    await page.evaluate(n => { window.__face.tag = 'perf:' + n; const b = document.querySelector('#content.is-home .home-wave-icon'); const svg = b && b.querySelector('.home-face');
      if (svg && typeof drFacePlay === 'function') drFacePlay(svg, n, b.querySelector('.home-wave-pin'), null, 5); else window.__face.timers.push({ run: 'MISSING ' + n, ms: 0, late: 0, t: 0, tag: 'perf:' + n }); }, name);
    await page.waitForTimeout(2600);
  }
  const L = await page.evaluate(() => window.__face);
  await ctx.close();
  return L;
}

(async () => {
  const browser = await chromium.launch();
  for (let i = 0; i < RUNS; i++) {
    const L = await once(browser);
    console.log(`\n== run ${i + 1} (${process.env.UA === 'chromium' ? 'Chromium paths' : 'iPhone paths'}, CPU ${RATE}x) ==`);
    const by = {};
    for (const t of L.timers) (by[t.tag] = by[t.tag] || []).push(t.late);
    for (const tag of ['opening', 'rest', ...PERFS.map(p => 'perf:' + p)]) if (by[tag]) console.log(`${tag.padEnd(12)} ${stats(by[tag])}`);
    const missing = L.timers.filter(t => t.run.startsWith('MISSING')).map(t => t.run); if (missing.length) console.log('not played: ' + missing.join(', '));
    const runs = {}; for (const t of L.timers) (runs[t.run || '(none)'] = runs[t.run || '(none)'] || []).push(t.late);
    console.log('by sequence: ' + Object.entries(runs).map(([k, v]) => `${k} ${v.length}/${v.filter(x => x > 17).length} late`).join(', '));
    const long = L.long.filter(l => l.ms >= 50);
    console.log(`long tasks: ${long.length}; worst ${long.length ? Math.max(...long.map(l => l.ms)) : 0} ms; in the opening ${long.filter(l => l.tag === 'opening').length}, at rest ${long.filter(l => l.tag === 'rest').length}`);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
