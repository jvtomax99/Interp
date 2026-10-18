/* A card's pin burst (S7c in docs/PLAN.md; pin-icons.js). It starts on
   touch-down, since a tap opens the next screen at once and the burst is
   only seen while the finger is down. A scroll that starts on a card stops
   it as soon as the browser takes the touch for the scroll (pointercancel).
   Taps are unchanged. Chromium only (touch drags through CDP). */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

// A domain card whose pin has a [data-pin] holder (the burst's rings ride on
// it; 16 of Home's 20 domain cards), centred, where a tap lands on it.
const pick = page => page.evaluate(async () => {
  for (const el of document.querySelectorAll('.domain-family')) {
    { const p = el.querySelector('.medical-pin, .pin-sprite'); if (!p || !p.closest('[data-pin]')) continue; }
    el.scrollIntoView({ block: 'center', inline: 'center' });
    await new Promise(r => setTimeout(r, 250));
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    if (hit && el.contains(hit) && y < innerHeight - 110) {
      window.__pin = el.querySelector('.medical-pin, .pin-sprite');
      window.__holder = window.__pin.closest('[data-pin]');
      return { x, y };
    }
  }
  return null;
});
// holder: the [data-pin] element the burst rings ride on (null where a card has none)
const state = page => page.evaluate(() => ({ pin: window.__pin.classList.contains('is-tapped'), holder: window.__holder ? window.__holder.classList.contains('is-tapped') : null }));

(async () => {
  const b = await L.chromium.launch();

  console.log('== phone');
  const { page, ctx } = await L.boot(b, { device: 'iphone', settle: 5000 });
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [p] : [] });

  // A tap: the burst plays while the finger is down, then the screen changes.
  await L.go(page, 'home', 900);
  let box = await pick(page);
  ok(!!box, 'a domain card with a pin and a burst holder is on Home');
  await touch('touchStart', box); await page.waitForTimeout(120);
  const held = await state(page);
  ok(held.pin && held.holder, 'tap: the burst plays while the finger is down (pin and its holder)', held);
  await touch('touchEnd'); await page.waitForTimeout(700);
  ok(await page.evaluate(() => activeCategory !== 'home'), 'tap: the card still opens its screen');

  // A scroll that starts on a card: the burst stops at pointercancel.
  await L.go(page, 'home', 900);
  box = await pick(page);
  await page.evaluate(() => { const T = window.__bt = { cancel: null, off: null }; const t0 = performance.now();
    document.addEventListener('pointercancel', () => { if (T.cancel === null) T.cancel = performance.now() - t0; }, { capture: true });
    const tick = () => { const t = performance.now() - t0; if (T.cancel !== null && T.off === null && !window.__pin.classList.contains('is-tapped')) T.off = t; if (t < 1500) requestAnimationFrame(tick); };
    requestAnimationFrame(tick); });
  const y0 = await page.evaluate(() => scrollY);
  await touch('touchStart', box);
  for (let y = box.y; y >= box.y - 300; y -= 18) { await touch('touchMove', { x: box.x, y }); await page.waitForTimeout(16); }
  await touch('touchEnd'); await page.waitForTimeout(900);
  const T = await page.evaluate(() => window.__bt), after = await state(page), y1 = await page.evaluate(() => scrollY);
  ok(y1 - y0 > 100 && await page.evaluate(() => activeCategory === 'home'), 'scroll from a card: the page scrolls and nothing opens', { moved: y1 - y0 });
  ok(T.cancel !== null, 'scroll from a card: the browser cancels the touch (pointercancel)', T);
  ok(T.off !== null && T.off - T.cancel < 40 && !after.pin && !after.holder, 'scroll from a card: the burst stops within two frames of the cancel', { ...T, after });
  ok(!page.__errors.length, 'no page errors', page.__errors);
  await ctx.close();

  console.log('== phone, reduced motion');
  const { page: rp, ctx: rctx } = await L.boot(b, { device: 'iphone', settle: 4000, reducedMotion: true });
  const rcdp = await rctx.newCDPSession(rp);
  await L.go(rp, 'home', 900);
  const rbox = await pick(rp);
  await rcdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [rbox] }); await rp.waitForTimeout(120);
  const r = await state(rp);
  await rcdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  ok(!r.pin && !r.holder, 'reduced motion: no burst', r);
  await b.close();
})();
