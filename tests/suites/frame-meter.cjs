/* The smoothness meter at the bottom of More (docs/features/frame-meter.md):
   it starts from More, shows a timer that stops it, counts a long stall as
   dropped frames and hitch time, splits the run by screen and scrolling,
   keeps the run with its build, and lists it back in More. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'frame-meter/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await L.chromium.launch();
  for (const [device, dark] of [['iphone', false], ['iphone', true], ['desktop', false]]) {
    const tag = device + (dark ? '-dark' : '');
    console.log('== ' + tag);
    const { ctx, page } = await L.boot(b, { device, dark, settle: 4000 });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://interp.test' });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    const build = await page.evaluate(() => BUILD_ID);
    await page.evaluate(() => openMoreSheet()); await wait(500);
    const more = await page.evaluate(() => { const btn = [...document.querySelectorAll('#moreSheetBody .fm-more .btn')][0];
      return { label: btn && btn.textContent.trim(), runs: document.querySelectorAll('#moreSheetBody .fm-run').length,
        aboveBuild: !!btn && btn.compareDocumentPosition([...document.querySelectorAll('#moreSheetBody div')].find(d => /Build b/.test(d.textContent) && !d.querySelector('div'))) === Node.DOCUMENT_POSITION_FOLLOWING }; });
    ok(more.label === 'Measure smoothness' && more.runs === 0 && more.aboveBuild, 'More: "Measure smoothness" just above the build, no runs yet', more);

    await page.evaluate(() => document.querySelector('#moreSheetBody .fm-more .btn').click()); await wait(400);
    const pill = await page.evaluate(() => { const p = document.querySelector('.fm-pill'); if (!p) return null; const r = p.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), centred: Math.abs(r.left + r.width / 2 - innerWidth / 2) < 2,
        hit: !!hit && p.contains(hit), clearOfBar: [...document.querySelectorAll('.topbar-global')].filter(e => getComputedStyle(e).position !== 'static' && e.getBoundingClientRect().height).every(e => e.getBoundingClientRect().bottom <= r.top + 1), sheetShut: !document.getElementById('moreSheetOverlay').classList.contains('show'), text: p.textContent }; });
    ok(pill && pill.sheetShut && pill.hit && pill.centred && pill.h >= 36 && pill.w < 260 && pill.top < 110 && pill.clearOfBar, 'Start: More closes, a small timer under the top bar takes its own taps', pill);

    // Steady frames on Home, then one 400 ms stall, a scroll, and another screen.
    await wait(1500);
    await page.evaluate(() => { const t = performance.now(); while (performance.now() - t < 400) {} });
    await wait(600);
    await page.evaluate(async () => { for (let i = 0; i < 20; i++) { window.scrollBy(0, 30); document.dispatchEvent(new Event('scroll')); await new Promise(r => requestAnimationFrame(r)); } });
    await page.evaluate(() => setCategory('translate')); await wait(1500);
    const live = await page.evaluate(() => document.querySelector('.fm-pill .fm-live').textContent);
    ok(/^\d+ dropped$/.test(live) && parseInt(live) >= 20, 'the timer counts the stall as dropped frames', live);
    await page.screenshot({ path: O + tag + '-pill.png' });

    await page.evaluate(() => document.querySelector('.fm-pill').click()); await wait(500);
    const res = await page.evaluate(() => { const runs = JSON.parse(localStorage.getItem('ih_frameMeter') || '[]');
      return { shown: document.getElementById('frameMeterOverlay').classList.contains('show'), pill: !!document.querySelector('.fm-pill'),
        on: FM.on, head: (document.querySelector('#frameMeterBody .fm-head') || {}).textContent, big: (document.querySelector('#frameMeterBody .fm-big') || {}).textContent,
        rows: [...document.querySelectorAll('#frameMeterBody .fm-table tr')].slice(1).map(r => r.firstChild.textContent), run: runs[0], n: runs.length }; });
    const r = res.run || {};
    ok(res.shown && !res.pill && !res.on, 'Stop: the timer goes, the results open, nothing left running', res);
    ok(r.build === build && [60, 30].includes(r.hz) && r.worst >= 380 && r.dropped >= 20 && r.stalls >= 1 && r.ratio > 0, 'the run: this build, a real refresh rate, the stall as the worst frame and as dropped frames', r);
    ok(res.rows.includes('Home') && res.rows.includes('Translate') && res.rows.includes('While scrolling') && r.scroll && r.scroll.ms > 0, 'split by screen (Home, Translate) and while scrolling', res.rows);
    ok(/ms of hitches per second/.test(res.big) && /Smooth|Some hitches|Choppy/.test(res.head), 'the headline: a grade and the hitch number', { h: res.head, b: res.big });
    await page.screenshot({ path: O + tag + '-results.png' });

    const results = await page.evaluate(() => { const s = document.querySelector('#frameMeterOverlay .more-sheet'), r = s.getBoundingClientRect();
      const bad = [...s.querySelectorAll('button')].filter(x => { const q = x.getBoundingClientRect(); if (!q.width) return false;
        const h = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return !(h && x.contains(h)); }).map(x => x.textContent.trim());
      return { fits: r.left >= 0 && r.right <= innerWidth + 1, sideways: document.documentElement.scrollWidth - innerWidth, bad }; });
    ok(results.fits && results.sideways <= 0 && !results.bad.length, 'results sheet fits the screen, every button takes its own tap', results);

    await page.evaluate(() => [...document.querySelectorAll('#frameMeterBody .btn')].find(x => /Copy/.test(x.textContent)).click()); await wait(300);
    const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(e => 'error ' + e.message);
    ok(/^Smoothness b\d{4}\.\d{4}/.test(copied) && /Hitches .* ms\/s/.test(copied) && /Home:/.test(copied), 'Copy numbers: plain text with the build, hitches and screens', copied.slice(0, 200));

    await page.evaluate(() => frameMeterClose()); await page.evaluate(() => openMoreSheet()); await wait(400);
    const listed = await page.evaluate(() => [...document.querySelectorAll('#moreSheetBody .fm-run')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    ok(listed.length === 1 && listed[0].includes(build), 'More lists the run with its build', listed);
    await page.screenshot({ path: O + tag + '-more.png' });
    await page.evaluate(() => document.querySelector('#moreSheetBody .fm-run').click()); await wait(400);
    ok(await page.evaluate(() => document.getElementById('frameMeterOverlay').classList.contains('show') && !document.getElementById('moreSheetOverlay').classList.contains('show')), 'tapping a listed run opens its results');
    await page.evaluate(() => frameMeterClose());

    // Too short to judge: no run saved. Hidden time is not counted as stalls.
    await page.evaluate(() => { frameMeterStart(); }); await wait(100);
    const short = await page.evaluate(() => { const r = frameMeterStop(); return { r, n: JSON.parse(localStorage.getItem('ih_frameMeter')).length }; });
    ok(short.r === null && short.n === 1, 'a run of a moment is not saved', short);
    const hid = await page.evaluate(async () => {
      frameMeterStart(); await new Promise(r => setTimeout(r, 800));
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
      await new Promise(r => setTimeout(r, 600));
      delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'));
      await new Promise(r => setTimeout(r, 800));
      const run = frameMeterStop(); frameMeterClose(); return run && run.worst; });
    ok(hid !== null && hid < 550, 'time the app spends hidden (600 ms) is not a stall', hid);

    ok(!page.__errors.length, 'no page errors', page.__errors);
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.log('  FAIL crashed ' + e.stack); process.exitCode = 1; });

