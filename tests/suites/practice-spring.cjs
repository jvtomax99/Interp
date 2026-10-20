/* F2 (docs/features/practice-dashboard.md, "The Pixar finish"): on CoreCHI
   Practice a candy button squashes flat while the finger is down, then
   springs back past its rest (a stretch, about 8%) and settles; the tiles'
   lean springs back the same way; the streak flame squashes and stretches
   from its base, lands with a squash, and the number pops once. Reduced
   motion: no squash, no spring, no breathing. Measured from computed
   transforms frame by frame. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'practice-spring/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// scale x/y of an element's own transform, from the computed matrix
const SCALE = `const scaleOf = el => { const m = getComputedStyle(el).transform; if(!m || m === 'none') return [1, 1]; const v = new DOMMatrix(m); return [Math.hypot(v.a, v.b), Math.hypot(v.c, v.d)]; };`;

(async () => {
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    console.log('== ' + device);
    const { ctx, page } = await L.boot(b, { device });
    await L.go(page, 'practice', 2500);
    await page.evaluate(() => document.querySelector('#content .mastery-go').scrollIntoView({ block: 'center' })); await wait(300);

    const curve = await page.evaluate(() => ({ spring: getComputedStyle(document.documentElement).getPropertyValue('--spring').trim(), linear: CSS.supports('animation-timing-function', 'linear(0, 1)') }));
    ok(curve.linear ? /^linear\(0, 0\.077,.*1\.083,.*1\)$/.test(curve.spring) : /cubic-bezier/.test(curve.spring), 'the release curve is a spring (linear() with an 8% overshoot where the browser has it, the bezier where not)', curve);

    // A candy button: squashed flat while the finger is down; as it leaves, a drawn spring: a stretch past its rest, a dip, a settle.
    const press = await page.evaluate(() => { const btn = document.querySelector('#content .mastery-go'); btn.classList.add('is-pressed'); return new Promise(r => setTimeout(() => {
      const m = getComputedStyle(btn).transform, v = new DOMMatrix(m); btn.classList.remove('is-pressed'); r({ sx: +v.a.toFixed(3), sy: +v.d.toFixed(3), dy: +v.f.toFixed(1), m }); }, 200)); });
    ok(press.sx > 1.02 && press.sy < 0.97 && press.dy >= 1.5, 'pressed: squashed flat (wider, shorter, pushed down)', press);
    await wait(800);
    // A real tap (the button's own action is stubbed so the screen stays): squashed while down, then the drawn spring.
    const [tx, ty] = await page.evaluate(() => { window.startStudy = () => {}; const r = document.querySelector('#content .mastery-go').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    const tapped = page.evaluate('(() => {' + SCALE + `
      const btn = document.querySelector('#content .mastery-go');
      return new Promise(res => { const sy = [], sx = [], t0 = performance.now(); let seen = false, pressedY = 1;
        const tick = () => { const [x, y] = scaleOf(btn); sx.push(+x.toFixed(4)); sy.push(+y.toFixed(4)); if(btn.classList.contains('is-pressed')) pressedY = Math.min(pressedY, y); if(btn.classList.contains('is-released')) seen = true;
          if(performance.now() - t0 < 1500) requestAnimationFrame(tick); else res({ pressedY, maxY: Math.max(...sy), minX: Math.min(...sx), end: [sx[sx.length-1], sy[sy.length-1]], released: seen, n: sy.length }); };
        requestAnimationFrame(tick); }); })()`);
    await wait(50);
    // On a phone a real tap; on a computer (no touch) the classes the press helper would set, in its order.
    if (device === 'iphone') await page.touchscreen.tap(tx, ty);
    else await page.evaluate(() => { const btn = document.querySelector('#content .mastery-go'); btn.classList.add('is-pressed'); setTimeout(() => { btn.classList.remove('is-pressed'); btn.classList.add('is-released'); setTimeout(() => btn.classList.remove('is-released'), 700); }, 260); });
    const tap = await tapped;
    ok(tap.pressedY < 0.97 && tap.released, 'a real tap: squashed while down, then the release runs', tap);
    ok(tap.maxY > 1.03 && tap.minX < 0.975, 'released: it stretches well past its rest (taller, narrower) on the way back', tap);
    ok(Math.abs(tap.end[0] - 1) < 0.002 && Math.abs(tap.end[1] - 1) < 0.002, 'and settles back to its drawn shape', tap.end);

    // The streak flame: squash and stretch from its base; its area stays about the same; the number pops only as it lands.
    const flame = await page.evaluate('(() => {' + SCALE + `
      const i = document.querySelector('#content .study-streak i'), n = document.querySelector('#content .study-streak .study-flame');
      const cs = getComputedStyle(i);
      return new Promise(res => { const t0 = performance.now(); const samples = [];
        const tick = () => { const [x, y] = scaleOf(i); samples.push([x, y]); if(performance.now() - t0 < 2800) requestAnimationFrame(tick); else {
          const wide = samples.filter(([x, y]) => x > 1.02 && y < 0.98).length, tall = samples.filter(([x, y]) => x < 0.98 && y > 1.02).length;
          const area = Math.max(...samples.map(([x, y]) => Math.abs(x * y - 1)));
          res({ anims: cs.animationName, base: Math.abs(parseFloat(cs.transformOrigin.split(' ')[1]) - i.offsetHeight) < 1, wide, tall, area: +area.toFixed(3), n: samples.length, numAnim: getComputedStyle(n).animationName, numEnd: scaleOf(n).map(v => +v.toFixed(3)) }); } };
        requestAnimationFrame(tick); }); })()`);
    ok(/flameLand, flameBreathe/.test(flame.anims) && flame.base, 'the flame lands then breathes, pivoting on its base', flame);
    ok(flame.wide > 5 && flame.tall > 5 && flame.area < 0.06, 'it is wide and low, then tall and narrow, its area within 6%', flame);
    ok(flame.numAnim === 'countLand' && flame.numEnd[0] === 1 && flame.numEnd[1] === 1, 'the number popped once as it landed and now holds still', flame);
    if (device === 'iphone') await page.screenshot({ path: O + 'practice.png' });

    // A tile's lean springs back with the same curve.
    const lean = await page.evaluate(() => { const t = document.querySelector('#content .mastery-row'); return getComputedStyle(t).transitionTimingFunction.slice(0, 12); });
    ok(curve.linear ? /^linear\(0 0%/.test(lean) : /^cubic-bezier/.test(lean), 'the tiles spring back from their lean on the same curve', lean);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== reduced motion');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', reducedMotion: true });
    await L.go(page, 'practice', 1500);
    const r = await page.evaluate(() => { const btn = document.querySelector('#content .mastery-go'); btn.classList.add('is-pressed');
      return new Promise(res => setTimeout(() => res({ press: getComputedStyle(btn).transform, trans: getComputedStyle(btn).transitionDuration, flame: getComputedStyle(document.querySelector('#content .study-streak i')).animationName, num: getComputedStyle(document.querySelector('#content .study-streak .study-flame')).animationName }), 150)); });
    ok((r.press === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(r.press)) && /^0s/.test(r.trans) && r.flame === 'none' && r.num === 'none', 'reduced motion: no squash, no spring, no breathing, no pop', r);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; });
