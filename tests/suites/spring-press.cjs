/* F2 (docs/PLAN.md): Practice buttons squash on press and spring back past
   their shape, then settle; the streak flame flickers, stretching and
   squashing from its base. Measured on the computed transform, at phone
   size, light and dark; reduced motion keeps everything still. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'spring-press/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// Press (the .is-pressed class the touch handler adds), hold, release, and
// sample the transform through the release.
const pressRelease = (page, sel) => page.evaluate(async sel => {
  const el = [...document.querySelectorAll(sel)].find(e => !e.disabled && e.getClientRects().length);
  if (!el) return { err: 'none: ' + sel };
  el.scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 900));   // entrance animations done
  el.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} });
  // DOMMatrix reads both matrix() and matrix3d() (a spring mid-flight can report either).
  const m = () => { const t = getComputedStyle(el).transform; if (!t || t === 'none') return { sx: 1, sy: 1, ty: 0 };
    const d = new DOMMatrix(t); return { sx: Math.hypot(d.a, d.b), sy: Math.hypot(d.c, d.d), ty: d.f }; };
  el.classList.add('is-pressed');
  await new Promise(r => setTimeout(r, 160));
  const held = m();
  el.classList.remove('is-pressed');
  const out = [], t0 = performance.now();
  await new Promise(res => { const tick = () => { out.push(m()); if (performance.now() - t0 < 750) requestAnimationFrame(tick); else res(); }; tick(); });
  return { held, maxSy: Math.max(...out.map(x => x.sy)), minTy: Math.min(...out.map(x => x.ty)), end: out[out.length - 1], ease: getComputedStyle(el).transitionTimingFunction.slice(0, 20) };
}, sel);

let b;
(async () => {
  b = await L.chromium.launch();
  for (const dark of [false, true]) {
    const tag = dark ? 'dark' : 'light';
    console.log('== iphone ' + tag);
    const { page } = await L.boot(b, { device: 'iphone', dark });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await L.go(page, 'practice', 1500);
    const spring = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--spring-settle').trim());
    ok(/^linear\(0, 0\.055/.test(spring), 'the settling spring is a linear() curve here', spring.slice(0, 40));

    for (const [sel, name] of [['#content .study-mode', 'study mode card'], ['#content .mastery-go', 'Practise button'], ['#content .cp-play', 'Play button']]) {
      const r = await pressRelease(page, sel);
      ok(!r.err && r.held.sx > 1.005 && r.held.sy < .985 && r.held.sx * r.held.sy > .93, `${name}: squashes on press (wider, shorter)`, r);
      ok(!r.err && r.maxSy > 1.002 && /^linear/.test(r.ease), `${name}: springs past its shape on release`, r);
      ok(!r.err && Math.abs(r.end.sx - 1) < .003 && Math.abs(r.end.sy - 1) < .003, `${name}: settles back to its shape`, r.end);
    }
    // Every Practice button still takes its own tap.
    const hits = await page.evaluate(() => [...document.querySelectorAll('#content .study-mode:not(:disabled), #content .mastery-go')].map(e => { e.scrollIntoView({ block: 'center' });
      const r = e.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && e.contains(h); }));
    ok(hits.length >= 6 && hits.every(Boolean), 'each card and Practise button takes its own tap', hits);

    // The flame flickers from its base, and keeps going after the screen settles.
    await wait(1500);
    const fl = await page.evaluate(async () => { const i = document.querySelector('#content .study-streak i'); if (!i) return { err: 'no flame' };
      const cs = getComputedStyle(i), out = [], t0 = performance.now();
      await new Promise(res => { const tick = () => { const t = getComputedStyle(i).transform; if (t !== 'none'){ const d = new DOMMatrix(t); out.push([Math.hypot(d.a, d.b), Math.hypot(d.c, d.d)]); }
        if (performance.now() - t0 < 1800) requestAnimationFrame(tick); else res(); }; tick(); });
      return { name: cs.animationName, origin: cs.transformOrigin, still: !!i.closest('.is-still'), maxSy: Math.max(...out.map(x => x[1])), minSy: Math.min(...out.map(x => x[1])), narrowWhenTall: (out.reduce((a, x) => x[1] > a[1] ? x : a, [1, 0])[0]) < 1, maxSx: Math.max(...out.map(x => x[0])) }; });
    ok(!fl.err && fl.name === 'flameFlicker' && /\d+(\.\d+)?px \d+(\.\d+)?px/.test(fl.origin), 'streak flame: flickers', fl);
    ok(!fl.err && fl.maxSy > 1.08 && fl.minSy < .96 && fl.narrowWhenTall && fl.maxSx > 1.03, 'streak flame: stretches tall and narrow, squashes wide', fl);
    await page.evaluate(() => document.querySelector('#content .study-streak').scrollIntoView({ block: 'center' }));
    if (!dark) await page.screenshot({ path: O + 'practice.png' });

    // In a quiz: the answer options and the confidence buttons.
    await page.evaluate(() => startStudy('new')); await wait(700);
    const qo = await pressRelease(page, '#content .quiz-option');
    ok(!qo.err && qo.held.sy < .97 && qo.maxSy > 1.002 && Math.abs(qo.end.sy - 1) < .003, 'answer option: squash, spring past, settle', qo);
    await page.evaluate(() => answerQuiz(quizQuestions[quizIndex].a)); await wait(500);
    const cb = await pressRelease(page, '#content .conf-btn');
    ok(!cb.err && cb.held.sy < .95 && cb.maxSy > 1.002 && Math.abs(cb.end.sy - 1) < .003, 'confidence button: squash, spring past, settle', cb);
    const lifts = await page.evaluate(() => { const o = document.querySelector('#content .quiz-option'); const r = o.getBoundingClientRect();
      o.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', clientX: r.left + 5, clientY: r.top + 5 })); return o.classList.contains('is-pressed'); });
    ok(lifts, 'a touch on an option marks it pressed (LIFTS)', lifts);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
  }

  console.log('== reduced motion');
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); page.__errors = []; page.on('pageerror', e => page.__errors.push(String(e)));
    await L.route(page); await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' }); await wait(3000);
    await page.evaluate(() => setCategory('practice')); await wait(1200);
    const r = await page.evaluate(() => { const e = document.querySelector('#content .study-mode:not(:disabled)'); e.classList.add('is-pressed');
      const i = document.querySelector('#content .study-streak i');
      return { t: getComputedStyle(e).transform, flame: i ? getComputedStyle(i).animationName : 'none' }; });
    ok((r.t === 'none' || r.t === 'matrix(1, 0, 0, 1, 0, 0)') && r.flame === 'none', 'reduced motion: no squash, no flicker', r);
    await ctx.close(); }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; if (b) b.close(); });
