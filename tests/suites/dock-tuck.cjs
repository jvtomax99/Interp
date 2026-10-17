/* The tab bar's tuck and open (S2 in docs/PLAN.md): it moves with transform
   and opacity only (dockMorph in index.html; its pieces in home-polish.css).
   The bar takes its new layout at once, the outline and the tab glide on
   the compositor, and at rest the bar is the same as before. Runs in WebKit
   too (CI's webkit job): Safari is where the team uses it. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

const rects = page => page.evaluate(() => {
  const q = s => { const r = document.querySelector(s).getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  return { bar: q('.tabbar'), dr: q('.dock-smiley'), tag: q('.dock-smiley-tag') };
});
// Every running animation on the dock, and what it animates.
const dockAnims = page => page.evaluate(() => document.getAnimations().filter(a => {
  const n = a.effect && a.effect.target;
  return n && n.closest && (n.closest('.tabbar') || n.closest('.dock-smiley')) && a.playState === 'running';
}).map(a => {
  const n = a.effect.target;
  let props = a.transitionProperty ? [a.transitionProperty] : [];
  if (!props.length) props = [...new Set(a.effect.getKeyframes().flatMap(k => Object.keys(k)))].filter(p => !['offset', 'easing', 'composite', 'computedOffset'].includes(p));
  return { el: n.className && String(n.className.baseVal === undefined ? n.className : n.className.baseVal).split(' ')[0], props };
}));
const LAYOUT_FREE = ['transform', 'opacity', 'translate', 'scale', 'rotate'];
// Waits (in the page) until nothing on the dock is moving any more, his
// endless breathing aside: WebKit's round trips are slow, so a fixed wait
// can land mid-transition. His scroll sway counts as moving: it is an inline
// rotate written each frame, not an animation, and a 1-2 degree lean makes
// his box 2-3% bigger (CI's WebKit, rendering slowly, was still swaying from
// the scroll at the start, so the size checks failed now and then).
const settle = page => page.evaluate(() => new Promise(r => {
  const t0 = performance.now();
  const swaying = () => [...document.querySelectorAll('.dock-smiley')].some(e => e.style.rotate);
  const moving = () => swaying() || document.getAnimations().some(a => { const n = a.effect && a.effect.target; return n && n.closest && (n.closest('.tabbar') || n.closest('.dock-smiley')) && a.playState === 'running' && a.effect.getComputedTiming().iterations !== Infinity; });
  const check = () => (!moving() || performance.now() - t0 > 3000) ? r() : setTimeout(check, 50);
  check();
}));

(async () => {
  const b = await L.chromium.launch();
  console.log('== phone, a glossary screen');
  const { page } = await L.boot(b, { device: 'iphone', settle: 5000 });
  // Scrolled down first (the scroll itself tucks the bar), then opened;
  // the 4 s idle tuck is restarted before each step so it never fires mid-check.
  await page.evaluate(() => { setCategory('all'); window.scrollTo(0, 300); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { dockOpen(); dockIdleRestart(); });
  await page.waitForTimeout(300); await settle(page);
  const open = await rects(page);
  // The page's animation clock against the wall clock (WebKit on CI has run
  // it at a different pace), and anything still moving on Dr. Smiley.
  const clock = await page.evaluate(() => new Promise(r => { const t0 = document.timeline.currentTime, w0 = performance.now(); setTimeout(() => r({ timeline: Math.round(document.timeline.currentTime - t0), wall: Math.round(performance.now() - w0) }), 500); }));
  const drMoving = await page.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.dock-smiley')).map(a => (a.transitionProperty || a.animationName || 'waapi') + ' ' + a.playState + ' ' + Math.round(a.currentTime)));
  console.log('  info: animation clock ' + clock.timeline + ' ms in ' + clock.wall + ' ms of wall time; on Dr. Smiley: ' + (drMoving.join(', ') || 'nothing'));

  // Mid-tuck: the bar already has its tucked layout; only transform and
  // opacity move (the tab's colour fade aside).
  await page.evaluate(() => { dockIdleRestart(); dockTuck(); });
  await page.waitForTimeout(120);
  const mid = await dockAnims(page);
  const midBar = await rects(page);
  const bad = mid.filter(a => a.props.some(p => !LAYOUT_FREE.includes(p) && !(p === 'color' && /tabbar-btn/.test(a.el))));
  ok(mid.length > 5 && !bad.length, 'mid-tuck, ' + mid.length + ' animations, all transform or opacity', bad);
  ok(await page.evaluate(() => !!document.querySelector('.tabbar.is-morph .dk-skin')), 'the outline is drawn by the moving pieces while it tucks');
  await page.waitForTimeout(100);
  const midBar2 = await rects(page);
  ok(Math.abs(midBar.bar.w - midBar2.bar.w) < .01, 'the bar\'s own size does not animate (no layout per frame)', [midBar.bar.w, midBar2.bar.w]);

  // At rest, tucked: same sizes as the old CSS gave.
  await page.waitForTimeout(300); await settle(page);
  const mini = await rects(page);
  // The pieces go when the move's promise settles (WebKit: at its next
  // rendering update) or, at the latest, 250 ms later by a timer; until then
  // they hold the last frame, which is the bar itself.
  const goneIn = () => page.evaluate(() => new Promise(r => { const t0 = performance.now(); const c = () => !document.querySelector('.dk-skin') ? r(Math.round(performance.now() - t0)) : performance.now() - t0 > 1500 ? r(-1) : setTimeout(c, 25); c(); }));
  await goneIn();
  const left = await page.evaluate(() => ({ skins: document.querySelectorAll('.dk-skin').length, morph: !!document.querySelector('.is-morph, .dk-lead'), running: document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.tabbar') && a.playState === 'running').length }));
  ok(!left.skins && !left.morph && !left.running, 'after the move nothing is left behind', left);
  ok(Math.abs(mini.bar.h - 54) < .5 && Math.abs(mini.bar.l - open.bar.l) < .5 && Math.abs(mini.bar.b - open.bar.b) < .5, 'tucked: a 54px capsule on the same corner', mini.bar);
  // Dr. Smiley: scaled 54/58, his disc's right edge and bottom where they were.
  const k = d => d.w / 58;                     // his scale, from his button's width
  const disc = d => ({ right: d.r - 5 * k(d), bottom: d.b });
  ok(Math.abs(mini.dr.w / open.dr.w - 54 / 58) < .002 && Math.abs(disc(mini.dr).right - disc(open.dr).right) < .1 && Math.abs(disc(mini.dr).bottom - disc(open.dr).bottom) < .1,
    'Dr. Smiley shrinks with the bar, his disc\'s right edge and bottom kept', { open: open.dr, mini: mini.dr, clock, drMoving });
  ok(Math.abs(mini.tag.h - open.tag.h) < .1 && Math.abs(mini.tag.b - open.tag.b) < .1, 'his "Ask" tag keeps its size and hangs where it did', { open: open.tag, mini: mini.tag });

  // Reversed halfway (scroll down, then straight back up): no jump.
  const jumps = [];
  for (const gap of [40, 120]) {
    await page.evaluate(() => { dockIdleRestart(); dockOpen(); }); await page.waitForTimeout(300); await settle(page);
    // Timed in the page, so the browser's round trips don't move the moment.
    jumps.push(await page.evaluate(gap => new Promise(r => {
      dockTuck();
      // Read inside an animation frame: WebKit only brings animated styles
      // up to date at a rendering update.
      setTimeout(() => requestAnimationFrame(() => {
        const piece = () => document.querySelector('.dk-skin .dk-pc.dk-r');
        // WebKit on CI can deliver the frame after the move has ended:
        // nothing to turn around then, so it is skipped (the bar is still
        // opened, for the checks after).
        if (!piece()) { dockOpen(); return r('skipped'); }
        const run = dockRun, t = run.anims[0].currentTime, p = run.progress();
        const a = piece().getBoundingClientRect().right; dockOpen(); const b = piece().getBoundingClientRect().right;
        r(+(b - a).toFixed(2) + ' (at ' + Math.round(t) + ' ms, ' + Math.round(p * 100) + '% tucked)');
      }), gap);
    }), gap));
  }
  const measured = jumps.filter(j => j !== 'skipped');
  ok(measured.length > 0 && measured.every(j => Math.abs(parseFloat(j)) < 1), 'turned around mid-move, the outline carries on from where it was (jumps ' + jumps.join('; ') + ' px)');
  await page.waitForTimeout(300); await settle(page);
  const back = await rects(page);
  const gone = await goneIn();
  ok(Math.abs(back.bar.w - open.bar.w) < .5 && gone >= 0, 'and lands open, as before, the pieces gone (' + gone + ' ms after it settled)', back.bar);
  ok(!page.__errors.length, 'no page errors', page.__errors);

  console.log('== phone, reduced motion');
  const { page: rp } = await L.boot(b, { device: 'iphone', settle: 3000, reducedMotion: true });
  await rp.evaluate(() => { setCategory('all'); window.scrollTo(0, 300); }); await rp.waitForTimeout(500);
  await rp.evaluate(() => { dockOpen(); dockIdleRestart(); }); await rp.waitForTimeout(300);
  const r = await rp.evaluate(() => { dockTuck(); return { skin: !!document.querySelector('.dk-skin'), mini: document.body.classList.contains('dock-mini') }; });
  ok(!r.skin && r.mini, 'reduced motion: it tucks at once, nothing moves', r);
  ok(!rp.__errors.length, 'no page errors', rp.__errors);
  await b.close();
})();
