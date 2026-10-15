/* Home's decor: what loops and what settles (S1 in docs/PLAN.md, then
   Jose's call: the petals and the heartline are part of the look and keep
   looping). The petals fall forever, but with no will-change, so they don't
   hold a layer each. The heartline replays every few seconds. What settles:
   the Ask badge's breeze (its loop ends once it hangs still), one halo glow,
   the rank card ring glows on arrival only. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

// Counts animation frames asked for, so a JS loop that never ends shows up.
const COUNT_RAF = () => {
  window.__raf = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => { window.__raf++; return raf(cb); };
};
const state = page => page.evaluate(() => {
  const petals = [...document.querySelectorAll('.home-petals .home-petal')];
  const hl = document.querySelector('#content .home-heartline');
  return {
    petals: petals.length,
    falling: petals.filter(p => p.getAnimations().some(a => a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity)).length,
    willChange: petals.filter(p => getComputedStyle(p).willChange !== 'auto').length,
    heartDraws: !!(hl && hl.classList.contains('is-draw')),
    ringGlow: document.getAnimations().filter(a => a.animationName === 'smwGlow' && a.playState === 'running').length,
  };
});
const rafIn = async (page, ms) => { await page.evaluate(() => { window.__raf = 0; }); await page.waitForTimeout(ms); return page.evaluate(() => window.__raf); };

(async () => {
  const b = await L.chromium.launch();
  console.log('== phone');
  const { page } = await L.boot(b, { device: 'iphone', settle: 16000, init: COUNT_RAF });
  const s1 = await state(page);
  ok(s1.petals >= 20 && s1.falling === s1.petals, 'the petals keep falling, all of them, long after arrival', s1);
  ok(!s1.willChange, 'no petal holds a layer of its own (no will-change)', s1);
  // The heartline replays: watch it come back at least once in ~8 s.
  const seen = await page.evaluate(() => new Promise(r => {
    const hl = document.querySelector('#content .home-heartline'); let n = 0;
    const mo = new MutationObserver(() => { if (hl.classList.contains('is-draw')) n++; });
    mo.observe(hl, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { mo.disconnect(); r(n); }, 8000);
  }));
  ok(seen >= 1, 'the heartline keeps replaying (' + seen + ' draws in 8 s)');
  const raf = await rafIn(page, 2000);
  ok(raf < 15, 'the Ask badge has settled: no animation-frame loop left (' + raf + ' in 2 s)');

  // A repaint of Home redraws the rank card: its ring doesn't glow again.
  await page.evaluate(() => { goHome(); window.scrollTo(0, 0); });
  await page.waitForTimeout(2500);
  ok((await state(page)).ringGlow === 0, 'a repaint of Home does not replay the card ring glow');
  ok(!page.__errors.length, 'no page errors', page.__errors);

  console.log('== phone, reduced motion');
  const { page: rp } = await L.boot(b, { device: 'iphone', settle: 3000, reducedMotion: true });
  const r = await rp.evaluate(() => [...document.querySelectorAll('.home-petal')].map(p => getComputedStyle(p).animationName));
  ok(r.length > 0 && r.every(n => n === 'none'), 'reduced motion: the petals rest in place, nothing falls', r);
  await b.close();
})();
