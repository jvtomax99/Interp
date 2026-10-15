/* Home's decor: what loops and what settles (S1 in docs/PLAN.md, then
   Jose's call: the petals and the heartline are part of the look and keep
   looping). The petals fall forever, drawn on one canvas per place (S1b),
   not one animated element each. The heartline replays every few seconds. What settles:
   the Ask badge's breeze (its loop ends once it hangs still), one halo glow,
   the rank card ring glows on arrival only. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

// Counts animation frames asked for, so a JS loop that never ends shows up.
// The petals' own loop (petalFrame) is counted apart: it is meant to run.
const COUNT_RAF = () => {
  window.__raf = 0; window.__petalRaf = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => { if (cb && cb.name === 'petalFrame') window.__petalRaf++; else window.__raf++; return raf(cb); };
};
// What the petal canvases show: a cheap fingerprint of their pixels.
const PETAL_PIXELS = () => [...document.querySelectorAll('.home-petals-canvas')].map(c => {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, sum = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i]) { n++; sum = (sum + d[i] * (i % 9973)) % 1e9; }
  return n + ':' + sum;
}).join('|');
const state = page => page.evaluate(() => {
  const hero = document.querySelector('.home-petals');
  const hl = document.querySelector('#content .home-heartline');
  return {
    petals: hero ? +hero.dataset.petals : 0,
    canvases: document.querySelectorAll('.home-petals-canvas').length,
    elements: document.querySelectorAll('.home-petal').length,
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
  ok(s1.petals >= 20, 'the banner draws its 20+ petals', s1);
  ok(s1.canvases === 2 && s1.elements === 0, 'one canvas each for the banner and the rank card, no element per petal', s1);
  const px1 = await page.evaluate(PETAL_PIXELS); await page.waitForTimeout(600);
  const px2 = await page.evaluate(PETAL_PIXELS);
  ok(/^[1-9]/.test(px1) && px1 !== px2, 'the petals keep falling long after arrival (the canvas changes)', [px1, px2]);
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

  // Battery: scrolled away from both places, the petal loop stops.
  await page.evaluate(() => { const r = document.querySelector('.sm-widgets').getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.bottom + 40); });
  await page.waitForTimeout(800);
  const off = await page.evaluate(() => { const n = window.__petalRaf; return new Promise(r => setTimeout(() => r(window.__petalRaf - n), 1000)); });
  ok(off === 0, 'scrolled past the banner and the card, the petals stop drawing (' + off + ' frames in 1 s)');

  // A repaint of Home redraws the rank card: its ring doesn't glow again.
  await page.evaluate(() => { goHome(); window.scrollTo(0, 0); });
  await page.waitForTimeout(2500);
  ok((await state(page)).ringGlow === 0, 'a repaint of Home does not replay the card ring glow');
  ok(!page.__errors.length, 'no page errors', page.__errors);

  console.log('== phone, reduced motion');
  const { page: rp } = await L.boot(b, { device: 'iphone', settle: 3000, reducedMotion: true, init: COUNT_RAF });
  const r1 = await rp.evaluate(PETAL_PIXELS); await rp.waitForTimeout(800);
  const r2 = await rp.evaluate(PETAL_PIXELS);
  const rf = await rp.evaluate(() => { const n = window.__petalRaf; return new Promise(r => setTimeout(() => r(window.__petalRaf - n), 1000)); });
  ok(/^[1-9]/.test(r1) && r1 === r2 && rf === 0, 'reduced motion: the petals rest in place, nothing falls, no frame loop', [r1, r2, rf]);
  await b.close();
})();
