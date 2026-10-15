/* Home rests after arrival (S1 in docs/PLAN.md). The decorative motion
   plays when you arrive on Home and then stops: the petal shower falls once
   (12 petals on a phone, no inner flutter, no will-change), the Ask badge's
   breeze dies down and its loop ends, the halo glows once, the heartline
   draws once and stays drawn. A repaint of Home must not start the shower
   again; coming back to Home from another screen does. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

// Counts animation frames asked for, so a loop that never ends shows up.
const COUNT_RAF = () => {
  window.__raf = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = cb => { window.__raf++; return raf(cb); };
};
const state = page => page.evaluate(() => {
  const petals = [...document.querySelectorAll('.home-petal')];
  const anims = document.getAnimations().filter(a => a.playState === 'running');
  const hl = document.querySelector('#content .home-heartline');
  return {
    petals: petals.length,
    endless: anims.filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.home-petals, .smw-petals') && a.effect.getComputedTiming().iterations === Infinity).length,
    willChange: petals.filter(p => getComputedStyle(p).willChange !== 'auto').length,
    flutter: petals.filter(p => getComputedStyle(p.querySelector('svg')).animationName !== 'none').length,
    heartDrawn: !!(hl && hl.classList.contains('is-drawn')) && getComputedStyle(hl.querySelector('.hl-core')).strokeDashoffset === '0px',
    heartOpacity: hl ? +getComputedStyle(hl.querySelector('.hl-core')).opacity : -1,
    // What still runs: only the slow compositor loops may (his breathing and
    // drift, the halo's turn, a streak flame), which cost the phone nothing.
    other: [...new Set(anims.map(a => a.animationName || a.transitionProperty || 'script'))].filter(n => !['dsBreathe', 'dsDrift', 'homeAskTurn', 'smwFlick'].includes(n)),
  };
});
const rafIn = async (page, ms) => { await page.evaluate(() => { window.__raf = 0; }); await page.waitForTimeout(ms); return page.evaluate(() => window.__raf); };

(async () => {
  const b = await L.chromium.launch();
  console.log('== phone');
  const { page } = await L.boot(b, { device: 'iphone', settle: 1500, init: COUNT_RAF });
  const s0 = await state(page);
  ok(s0.petals > 0 && s0.petals <= 12, 'a shower on arrival, 12 petals at most', s0);
  ok(!s0.endless && !s0.willChange && !s0.flutter, 'each petal falls once: no endless loop, no will-change, no inner flutter', s0);
  // A repaint mid-shower rebuilds what's left from the clock: same petals, same places.
  const lefts = () => page.evaluate(() => [...document.querySelectorAll('.home-petals .home-petal')].map(p => p.style.left));
  const before = await lefts();
  await page.evaluate(() => goHome());
  await page.waitForTimeout(300);
  const after = await lefts();
  ok(after.length > 0 && after.every(l => before.includes(l)), 'a repaint mid-shower keeps each petal where it was', { before, after });

  await page.waitForTimeout(15000);
  const s1 = await state(page);
  ok(s1.petals === 0, 'the shower is over and its layers are gone', s1);
  ok(s1.heartDrawn && s1.heartOpacity > .9, 'the heartline drew once and stays drawn', s1);
  const raf = await rafIn(page, 2000);
  ok(raf < 15, 'Home at rest asks for (almost) no animation frames: ' + raf + ' in 2 s');

  // A repaint of Home (data arriving) puts the kept greeting back: no new shower.
  await page.evaluate(() => { goHome(); window.scrollTo(0, 0); });
  await page.waitForTimeout(600);
  const s3 = await state(page);
  ok(s3.petals === 0, 'a repaint of Home does not start the shower again');
  await page.waitForTimeout(1800);
  const s4 = await state(page);
  ok(!s4.other.length && s4.heartDrawn, 'after a repaint Home is still at rest: the heartline stays drawn, the card ring does not glow again', s4);

  // Coming back from another screen is an arrival: it plays again, then rests.
  await L.go(page, 'all', 900);
  await page.evaluate(() => { goHome(); window.scrollTo(0, 0); });
  await page.waitForTimeout(700);
  const s2 = await state(page);
  ok(s2.petals > 0 && s2.petals <= 12, 'back on Home: the shower plays again', s2);
  await page.waitForTimeout(12000);
  ok((await state(page)).petals === 0, '...and ends');
  ok(!page.__errors.length, 'no page errors', page.__errors);

  console.log('== phone, reduced motion');
  const { page: rp } = await L.boot(b, { device: 'iphone', settle: 3000, reducedMotion: true, init: COUNT_RAF });
  const r = await rp.evaluate(() => [...document.querySelectorAll('.home-petal')].map(p => getComputedStyle(p).animationName));
  ok(r.length > 0 && r.every(n => n === 'none'), 'reduced motion: the petals rest in place, nothing falls', r);
  await rp.waitForTimeout(9000);
  ok(await rp.evaluate(() => document.querySelectorAll('.home-petal').length) === r.length, 'reduced motion: the resting petals stay');
  await b.close();
})();
