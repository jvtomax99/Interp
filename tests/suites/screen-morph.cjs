/* Screen morph (docs/features/screen-morph.md): a domain tile's pin and name
   travel into the banner of the page that opens, and the Back button sends
   them home. What this holds:

     pair     during the trip exactly the banner's pin and name carry a
              name, and nothing made of glass does (the tab bar, the search
              row: a named element is photographed without its backdrop)
     clean    afterwards no name, no class and no flag is left behind
     same     the tap lands where a plain setCategory lands: the domain, one
              more step on the Back stack, the top of the page
     order    a tile tap and Back in the same instant still happen in the
              order they were made (the browser runs the tap a frame late)
     lands    the flying pin ends centred on the real pin (the page under
              it is still rising 6px as it fades in: the pair must follow)
     tap      a tap made during the trip is not lost: Back mid-flight goes
              back at once (the browser hands such a tap to <html>)
     scroll   Back from a scrolled domain still restores the tiles' scroll,
              and a banner scrolled off screen sends no pin
     swipe    the phone's own back (a real popstate) does not morph
     quiet    Reduce Motion: the tap navigates at once, with no transition */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const named = page => page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).viewTransitionName !== 'none').map(e => getComputedStyle(e).viewTransitionName + '=' + String(e.className).split(' ')[0]));
const state = page => page.evaluate(() => ({ cat: activeCategory, stack: navStack.length, y: Math.round(scrollY), cls: document.documentElement.classList.contains('morphing'), live: morphLive, waiting: !!morphWaiting }));
// Tap, then read the names in the page itself, frames later: no round trip
// to race the trip's end.
const trip = (page, js, want) => page.evaluate(async ({ js, want }) => {
  const raf = () => new Promise(r => requestAnimationFrame(r));
  (0, eval)(js);
  for (let i = 0; i < 120 && activeCategory !== want; i++) await raf();
  if (morphVt) await morphVt.ready.catch(() => {});
  const names = [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).viewTransitionName !== 'none').map(e => getComputedStyle(e).viewTransitionName + '=' + String(e.className).split(' ')[0]);
  // The end of the trip, held: where is the flying pin against the real one?
  document.getAnimations().forEach(a => { const pe = a.effect && a.effect.pseudoElement; if (pe && pe.startsWith('::view-transition')) { a.pause(); a.currentTime = a.effect.getComputedTiming().duration; } });
  await raf(); await raf();
  const g = getComputedStyle(document.documentElement, '::view-transition-group(hub-pin)');
  const m = new DOMMatrixReadOnly(g.transform === 'none' ? '' : g.transform), el = document.querySelector('[style*="hub-pin"]');
  let off = null;
  if (el) { const r = el.getBoundingClientRect(); off = [m.e + parseFloat(g.width) / 2 - (r.left + r.width / 2), m.f + parseFloat(g.height) / 2 - (r.top + r.height / 2)].map(v => +v.toFixed(1)); }
  document.getAnimations().forEach(a => { const pe = a.effect && a.effect.pseudoElement; if (pe && pe.startsWith('::view-transition')) a.finish(); });
  return { names, off, live: morphLive };
}, { js, want });
const done = page => page.waitForFunction(() => !morphLive && !document.documentElement.classList.contains('morphing'), null, { timeout: 5000 });

(async () => {
  const b = await L.chromium.launch();
  const { page } = await L.boot(b, { device: 'iphone' });
  await L.go(page, 'all');
  const has = await page.evaluate(() => typeof document.startViewTransition === 'function');
  ok(has, 'this browser has View Transitions (the suite is meaningless without)');
  const tileId = await page.evaluate(() => document.querySelector('.dt-tile').id.replace('domain-', ''));
  const before = await state(page);

  const fwd = await trip(page, `document.getElementById('domain-${tileId}').click()`, tileId);
  const mid = fwd.names;
  ok(fwd.live && mid.length === 2 && mid.includes('hub-pin=domain-banner-pin') && mid.includes('hub-name=domain-banner-name'), 'pair: mid-trip only the banner\'s pin and name are named', fwd);
  ok(fwd.off && Math.abs(fwd.off[0]) <= 1.5 && Math.abs(fwd.off[1]) <= 1.5, 'lands: the flying pin ends centred on the banner\'s pin', fwd.off);
  await done(page);
  const after = await state(page);
  ok(after.cat === tileId && after.stack === before.stack + 1 && after.y === 0, 'same: the tap opened the domain, one step deeper, at the top', { before, after });
  ok((await named(page)).length === 0 && !after.cls && !after.live && !after.waiting, 'clean: nothing left behind after the trip', [await named(page), after]);

  const bk = await trip(page, `document.getElementById('tgBack').click()`, 'all');
  const midBack = bk.names;
  ok(bk.live && midBack.length === 2 && midBack.includes('hub-pin=dt-tile-pin') && midBack.includes('hub-name=dt-tile-name'), 'pair: on Back the tile\'s pin and name are the pair', bk);
  ok(bk.off && Math.abs(bk.off[0]) <= 1.5 && Math.abs(bk.off[1]) <= 1.5, 'lands: on Back the flying pin ends centred on the tile\'s pin', bk.off);
  await done(page);
  const home = await state(page);
  ok(home.cat === 'all' && home.stack === before.stack && (await named(page)).length === 0, 'clean: Back returned to the tiles with the stack as it was', home);

  const order = await page.evaluate(id => { morphOpenDomain(id); goBack(); return { b: activeCategory, stack: navStack.length }; }, tileId);
  ok(order.b === 'all' && order.stack === before.stack, 'order: tap then Back in one instant ends on the tiles, the stack as it was', order);
  await done(page);
  const jump = await page.evaluate(id => { morphOpenDomain(id); setCategory('chat'); return { cat: activeCategory, top: navStack[navStack.length - 1].id }; }, tileId);
  ok(jump.cat === 'chat' && jump.top === tileId, 'order: another navigation right after a tile tap runs second, not first', jump);
  await done(page);

  // A real finger on Back while the pin is still flying.
  await L.go(page, 'all');
  const backBox = await page.locator('#tgBack').boundingBox();
  const stack0 = (await state(page)).stack;
  await page.tap('#domain-' + tileId);
  await page.waitForFunction(id => activeCategory === id && morphLive, tileId, { timeout: 5000 });
  const t0 = Date.now();
  await page.touchscreen.tap(backBox.x + backBox.width / 2, backBox.y + backBox.height / 2);
  const went = await page.waitForFunction(() => activeCategory === 'all', null, { timeout: 2000 }).then(() => true, () => false);
  ok(went, 'tap: Back tapped mid-flight goes back (not swallowed by the trip)', { ms: Date.now() - t0, s: await state(page) });
  await done(page);
  ok((await state(page)).stack === stack0 && (await named(page)).length === 0, 'tap: and leaves the stack and the names clean', await state(page));

  // Scroll: the tiles' place comes back, and an off-screen banner sends no pin.
  await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(200);
  const y0 = await page.evaluate(() => Math.round(scrollY));
  await page.evaluate(id => setCategory(id), tileId); await page.waitForTimeout(600);   // not L.go: it scrolls to the top first
  await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(200);
  const far = await trip(page, `document.getElementById('tgBack').click()`, 'all');
  await done(page);
  const y1 = await page.evaluate(() => Math.round(scrollY));
  ok(y0 > 0 && Math.abs(y1 - y0) <= 2, 'scroll: Back restores where the tiles were scrolled to', { y0, y1 });
  ok(!far.names.some(n => /banner/.test(n)), 'scroll: a banner scrolled off screen is not named', far.names);

  await page.evaluate(() => window.scrollTo(0, 0)); await L.go(page, tileId);
  const swipe = await page.evaluate(async () => { history.back(); for (let i = 0; i < 60 && activeCategory !== 'all'; i++) await new Promise(r => requestAnimationFrame(r)); return { cat: activeCategory, cls: document.documentElement.classList.contains('morphing'), live: morphLive }; });
  ok(swipe.cat === 'all' && !swipe.cls && !swipe.live, 'swipe: the phone\'s own back (popstate) navigates with no morph', swipe);

  const { page: rm } = await L.boot(b, { device: 'iphone', reducedMotion: true });
  await L.go(rm, 'all');
  const quiet = await rm.evaluate(id => { morphOpenDomain(id); return { cat: activeCategory, cls: document.documentElement.classList.contains('morphing'), live: morphLive }; }, tileId);
  ok(quiet.cat === tileId && !quiet.cls && !quiet.live, 'quiet: with Reduce Motion the tap navigates at once, no transition', quiet);

  ok(page.__errors.length === 0 && rm.__errors.length === 0, 'no page errors', [page.__errors, rm.__errors]);
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + e.message); process.exit(1); });
