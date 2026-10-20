/* F3 (docs/PLAN.md): the campus has depth. The back layer (sky, town,
   skyline; city/sky.webp) and the clouds slide against the campus as the
   card scrolls through the screen and when you drag across the picture,
   springing back on release. The front layer (city/entrance.webp) has its
   sky cut out, so the back layer shows through; no edge ever shows; the
   picture keeps its old frame; reduced motion keeps it all still. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'campus-depth/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const tr = (page, sel) => page.evaluate(sel => { const e = document.querySelector('#content ' + sel); return e ? getComputedStyle(e).translate : null; }, sel);

let b;
(async () => {
  b = await L.chromium.launch();
  { const { page } = await L.boot(b, { device: 'iphone' });
    await L.go(page, 'practice', 1800);
    const lay = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), sky = w.querySelector('.cp-sky'), g = w.querySelector('.cp-ground');
      const rw = w.getBoundingClientRect(), rs = sky.getBoundingClientRect();
      return { order: [...w.children].indexOf(sky) < [...w.children].indexOf(g), skyFull: rs.left <= rw.left + .5 && rs.right >= rw.right - .5 && rs.top <= rw.top + .5 && rs.bottom >= rw.bottom - .5,
        ratio: rw.width / rw.height, map: [CAMPUS_MAP.sky, CAMPUS_MAP.g], src: [sky.getAttribute('src'), g.getAttribute('src')] }; });
    ok(lay.order && lay.skyFull && lay.src[0] === './city/sky.webp', 'the back layer is under the campus and covers the whole picture', lay);
    ok(Math.abs(lay.ratio - 960 / 760) < .01, 'the picture keeps its whole frame (960 x 760)', lay.ratio);

    // Scroll: the back layer drifts the other way as the card moves through the screen.
    const at = async y => { await page.evaluate(y => window.scrollTo(0, y), y); await wait(900); return tr(page, '.cp-sky'); };
    const top = await page.evaluate(() => document.querySelector('#content .cp-world').getBoundingClientRect().top + scrollY);
    const a = await at(Math.max(0, top - 600)), c = await at(top + 100);
    const ya = parseFloat(String(a).split(' ')[1] || 0), yc = parseFloat(String(c).split(' ')[1] || 0);
    ok(a && c && ya > yc && ya - yc > 4, 'scrolling slides the back layer (lower on screen: lower)', { a, c });
    const cl = await tr(page, '.cp-clouds');
    ok(cl && cl !== 'none', 'the clouds slide too (their own drift keeps running)', cl);

    // Drag: pans sideways, at most so far, springs back on release; the back layer never shows an edge.
    await page.evaluate(() => document.querySelector('#content .cp-world').scrollIntoView({ block: 'center' })); await wait(700);
    const box = await page.evaluate(() => { const r = document.querySelector('#content .cp-world').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .85 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 120, box.y, { steps: 6 }); await wait(250);
    const mid = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), s = w.querySelector('.cp-sky'), rw = w.getBoundingClientRect(), rs = s.getBoundingClientRect();
      return { t: getComputedStyle(s).translate, panning: w.classList.contains('is-panning'), covers: rs.left <= rw.left + .5 && rs.right >= rw.right - .5 && rs.top <= rw.top + .5 && rs.bottom >= rw.bottom - .5 }; });
    const dx = parseFloat(String(mid.t).split(' ')[0]);
    ok(mid.panning && dx < -5 && dx >= -12, 'dragging right pans the back layer left, a little', mid);
    ok(mid.covers, 'mid-drag the back layer still covers the picture (no edge)', mid);
    await page.screenshot({ path: O + 'drag.png' });
    await page.mouse.up(); await wait(900);
    const back = await tr(page, '.cp-sky');
    ok(Math.abs(parseFloat(String(back).split(' ')[0])) < .5, 'letting go springs it back', back);
    ok(await page.evaluate(() => !document.querySelector('#content .cp-world').classList.contains('is-panning')), 'no longer panning');
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
  }
  console.log('== reduced motion');
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); page.__errors = []; page.on('pageerror', e => page.__errors.push(String(e)));
    await L.route(page); await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' }); await wait(3000);
    await page.evaluate(() => setCategory('practice')); await wait(1200);
    await page.evaluate(() => window.scrollTo(0, 300)); await wait(400);
    const t = await tr(page, '.cp-sky');
    ok(t === 'none', 'reduced motion: the back layer stays put', t);
    await ctx.close(); }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; if (b) b.close(); });
