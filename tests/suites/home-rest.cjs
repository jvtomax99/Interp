/* Home's decor: what loops and what settles (S1 in docs/PLAN.md, then
   Jose's call: the petals and the heartline are part of the look and keep
   looping). The petals fall forever: in Chromium drawn on one canvas per
   place from a worker (S1b); on iPhones and Safari (WebKit) one animated
   element each, as before, since the worker crashed WebKit. The heartline replays every few seconds. What settles:
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
// What the petal painter reports: frames drawn per place (it may run in a
// worker, whose canvas the page can't read back).
const PROBE = page => page.evaluate(() => window.__homePetals.probe());
const frames = p => Object.values(p).reduce((n, f) => n + f.frames, 0);

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
  const p1 = await PROBE(page); await page.waitForTimeout(600);
  const p2 = await PROBE(page);
  ok(p1.hero && p1.card && frames(p2) > frames(p1) + 10 && p2.hero.drawn && p2.card.drawn, 'the petals keep falling long after arrival (frames drawn: ' + (frames(p2) - frames(p1)) + ' in 0.6 s)', p2);
  ok(await page.evaluate(() => window.__homePetals.worker()), 'they are painted from a worker, not on the page');
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
  const o1 = await PROBE(page); await page.waitForTimeout(1000);
  const off = frames(await PROBE(page)) - frames(o1);
  ok(off === 0, 'scrolled past the banner and the card, the petals stop drawing (' + off + ' frames in 1 s)');
  // Home scroll (2026-10-23): what nobody can see rests. Greeting off screen:
  // the badge's breathing and the Ask ring pause, the heartline stops replaying.
  const away = await page.evaluate(() => new Promise(r => {
    const st = s => [...document.querySelectorAll(s)].flatMap(e => e.getAnimations()).map(a => a.playState);
    const hl = document.querySelector('#content .home-heartline'); let n = 0;
    const mo = new MutationObserver(() => { if (hl.classList.contains('is-draw')) n++; });
    mo.observe(hl, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { mo.disconnect(); r({ pin: st('#content .home-wave-pin'), ring: st('#content .home-ask-ring'), draws: n, dockShown: document.body.classList.contains('dock-has-smiley'), dock: st('.dock-smiley-bob') }); }, 7000);
  }));
  ok(away.pin.length && away.ring.length && away.pin.concat(away.ring).every(x => x === 'paused') && away.draws === 0, 'greeting scrolled off: his breathing and the Ask ring pause, no heartline draws', away);
  ok(away.dockShown && away.dock.length && away.dock.every(x => x === 'running'), 'the dock Dr. Smiley, now shown, breathes', away);

  // A repaint of Home redraws the rank card: its ring doesn't glow again.
  await page.evaluate(() => { goHome(); window.scrollTo(0, 0); });
  await page.waitForTimeout(2500);
  ok((await state(page)).ringGlow === 0, 'a repaint of Home does not replay the card ring glow');
  const back = await page.evaluate(() => { const st = s => [...document.querySelectorAll(s)].flatMap(e => e.getAnimations()).map(a => a.playState);
    return { pin: st('#content .home-wave-pin'), ring: st('#content .home-ask-ring'), dockShown: document.body.classList.contains('dock-has-smiley'), dock: st('.dock-smiley-bob') }; });
  ok(back.pin.concat(back.ring).every(x => x === 'running') && back.pin.length && !back.dockShown && back.dock.every(x => x === 'paused'), 'back at the top: the badge and the ring run again, the faded-out dock one rests', back);
  ok(!page.__errors.length, 'no page errors', page.__errors);

  console.log('== phone, reduced motion');
  const { page: rp } = await L.boot(b, { device: 'iphone', settle: 3000, reducedMotion: true, init: COUNT_RAF });
  const r1 = await PROBE(rp); await rp.waitForTimeout(800);
  const r2 = await PROBE(rp);
  ok(r2.hero && r2.hero.state === 'still' && r2.hero.drawn && r2.card && r2.card.drawn && frames(r2) === frames(r1) && frames(r2) === 0, 'reduced motion: the petals rest in place, nothing falls, no frame loop', [r1, r2]);

  // An iPhone's Safari user agent (CI's WebKit job runs only the doctor
  // page, so the WebKit path is checked here, picked by the same test).
  console.log('== iPhone Safari: the old petals');
  const { page: ip } = await L.boot(b, { settle: 6000, init: COUNT_RAF });
  const dom = () => [...document.querySelectorAll('.home-petal')].map(p => ({
    hero: !!p.closest('.home-petals'), card: !!p.closest('.smw-petals'),
    falling: p.getAnimations().some(a => a.animationName === 'homePetalFall' && a.playState === 'running' && a.effect.getComputedTiming().iterations === Infinity),
    flutter: p.querySelector('svg').getAnimations().some(a => a.animationName === 'homePetalFlutter' && a.playState === 'running'),
    willChange: getComputedStyle(p).willChange !== 'auto', w: p.getBoundingClientRect().width,
    anim: getComputedStyle(p).animationName,
  }));
  const d1 = await ip.evaluate(dom);
  const hero = d1.filter(p => p.hero), card = d1.filter(p => p.card);
  ok(await ip.evaluate(() => window.__homePetals.dom() && !window.__homePetals.worker() && !document.querySelector('.home-petals-canvas')), 'Safari gets the old petals: no canvas, no worker');
  ok(hero.length >= 20 && card.length === 8, 'one element per petal: ' + hero.length + ' on the banner, ' + card.length + ' on the rank card');
  ok(hero.every(p => p.falling && p.flutter && p.w > 0), 'every banner petal falls and flutters, forever', hero.filter(p => !p.falling || !p.flutter));
  await ip.evaluate(() => document.querySelector('.sm-widgets').scrollIntoView({ block: 'center' }));
  await ip.waitForTimeout(800);
  const d2 = (await ip.evaluate(dom)).filter(p => p.card);
  ok(d2.length === 8 && d2.every(p => p.falling && p.flutter && p.w > 0), 'the rank card\'s petals fall and flutter once it is on screen', d2.filter(p => !p.falling || !p.flutter));
  ok(!d1.some(p => p.willChange), 'no petal holds a layer of its own (no will-change)');
  ok(await ip.evaluate(() => !!document.querySelector('#homePetalDefs #hpSakura')), 'the petal artwork is defined once');
  ok(await ip.evaluate(() => window.__petalRaf) === 0, 'no petal frame loop on the page');
  await ip.evaluate(() => { const r = document.querySelector('.sm-widgets').getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.bottom + 40); });
  await ip.waitForTimeout(800);
  ok(await ip.evaluate(() => [...document.querySelectorAll('.home-petal')].every(p => p.getAnimations().every(a => a.playState === 'paused'))), 'scrolled past the banner and the card, the petals pause');
  ok(!ip.__errors.length, 'no page errors', ip.__errors);

  console.log('== iPhone Safari, reduced motion');
  const { page: irp } = await L.boot(b, { settle: 3000, reducedMotion: true });
  const ir = await irp.evaluate(dom);
  ok(ir.length > 0 && ir.every(p => p.anim === 'none'), 'reduced motion: the petals rest in place, nothing falls', ir.map(p => p.anim));
  await b.close();
})();
