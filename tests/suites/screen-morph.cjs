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
     swipe    the phone's own back (popstate) does not morph
     quiet    Reduce Motion: the tap navigates at once, with no transition */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const named = page => page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).viewTransitionName !== 'none').map(e => getComputedStyle(e).viewTransitionName + '=' + String(e.className).split(' ')[0]));
const state = page => page.evaluate(() => ({ cat: activeCategory, stack: navStack.length, y: Math.round(scrollY), cls: document.documentElement.classList.contains('morphing'), live: morphLive, waiting: !!morphWaiting }));
const done = page => page.waitForFunction(() => !morphLive && !document.documentElement.classList.contains('morphing'), null, { timeout: 5000 });

(async () => {
  const b = await L.chromium.launch();
  const { page } = await L.boot(b, { device: 'iphone' });
  await L.go(page, 'all');
  const has = await page.evaluate(() => typeof document.startViewTransition === 'function');
  ok(has, 'this browser has View Transitions (the suite is meaningless without)');
  const tileId = await page.evaluate(() => document.querySelector('.dt-tile').id.replace('domain-', ''));
  const before = await state(page);

  await page.tap('#domain-' + tileId);
  await page.waitForFunction(id => activeCategory === id, tileId, { timeout: 5000 });
  const mid = await named(page);
  ok(mid.length === 2 && mid.includes('hub-pin=domain-banner-pin') && mid.includes('hub-name=domain-banner-name'), 'pair: mid-trip only the banner\'s pin and name are named', mid);
  await done(page);
  const after = await state(page);
  ok(after.cat === tileId && after.stack === before.stack + 1 && after.y === 0, 'same: the tap opened the domain, one step deeper, at the top', { before, after });
  ok((await named(page)).length === 0 && !after.cls && !after.live && !after.waiting, 'clean: nothing left behind after the trip', [await named(page), after]);

  await page.tap('#tgBack');
  await page.waitForFunction(() => activeCategory === 'all', null, { timeout: 5000 });
  const midBack = await named(page);
  ok(midBack.length === 2 && midBack.includes('hub-pin=dt-tile-pin') && midBack.includes('hub-name=dt-tile-name'), 'pair: on Back the tile\'s pin and name are the pair', midBack);
  await done(page);
  const home = await state(page);
  ok(home.cat === 'all' && home.stack === before.stack && (await named(page)).length === 0, 'clean: Back returned to the tiles with the stack as it was', home);

  const order = await page.evaluate(id => { morphOpenDomain(id); const a = activeCategory; goBack(); return { a, b: activeCategory, stack: navStack.length }; }, tileId);
  ok(order.a === 'all' && order.b === 'all' && order.stack === before.stack, 'order: tap then Back in one instant ends on the tiles, the stack as it was', order);
  await done(page);
  const jump = await page.evaluate(id => { morphOpenDomain(id); setCategory('chat'); return { cat: activeCategory, top: navStack[navStack.length - 1].id }; }, tileId);
  ok(jump.cat === 'chat' && jump.top === tileId, 'order: another navigation right after a tile tap runs second, not first', jump);
  await done(page);

  await L.go(page, 'all'); await L.go(page, tileId);
  const swipe = await page.evaluate(() => { const n = navigateBack(); return { n, cat: activeCategory, cls: document.documentElement.classList.contains('morphing'), live: morphLive }; });
  ok(swipe.n === true && swipe.cat === 'all' && !swipe.cls && !swipe.live, 'swipe: the phone\'s own back navigates at once with no morph', swipe);

  const { page: rm } = await L.boot(b, { device: 'iphone', reducedMotion: true });
  await L.go(rm, 'all');
  const quiet = await rm.evaluate(id => { morphOpenDomain(id); return { cat: activeCategory, cls: document.documentElement.classList.contains('morphing'), live: morphLive }; }, tileId);
  ok(quiet.cat === tileId && !quiet.cls && !quiet.live, 'quiet: with Reduce Motion the tap navigates at once, no transition', quiet);

  ok(page.__errors.length === 0 && rm.__errors.length === 0, 'no page errors', [page.__errors, rm.__errors]);
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + e.message); process.exit(1); });
