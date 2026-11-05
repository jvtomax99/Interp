/* The opening, Badge in (docs/features/opening.md, features/opening.js).
   It plays on a fresh start on a phone and covers Home until it mounts; Home
   draws underneath meanwhile (no added wait) and its hello waits for the
   opening to end; a tap before the badge arrives skips straight to Home; a
   tap on the badge scans, turns green, says "Welcome in, <first name>" and
   opens into Home; afterwards nothing is left over Home (elementFromPoint
   reaches Home's search). Not with ?open= (a notification), not when it is
   switched off, not on the reload after an update, not on a computer, not
   when the app comes back from the background. Still takes the short path.
   More's Opening card: the switches, the badge title, Replay. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'opening/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
// Watch for the opening's end and the hello's first frame, from the very start.
const WATCH = () => { window.__opLog = []; addEventListener('hub-opening-done', () => window.__opLog.push(['done', performance.now()]));
  const iv = setInterval(() => { if (document.querySelector('.home-wave-canvas')) { window.__opLog.push(['hello', performance.now()]); clearInterval(iv); } }, 40); };
const state = page => page.evaluate(() => ({ up: !!document.querySelector('.op'), cover: document.documentElement.classList.contains('op-cover'),
  log: (window.__opLog || []).map(e => e[0]) }));
const homeReached = page => page.evaluate(() => { const s = document.querySelector('#content.is-home .home-search, #content.is-home input, #content.is-home [class*="search"]');
  if (!s) return { found: false }; const r = s.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return { found: true, hit: !!el && (s === el || s.contains(el) || el.contains(s)), under: el && (el.className || el.tagName) + '' }; });

(async () => {
  const b = await L.chromium.launch();

  console.log('== a fresh start on a phone');
  {
    const { ctx, page } = await L.boot(b, { device: 'iphone', opening: true, name: 'Jose Vazquez', settle: 700, init: WATCH });
    const s = await state(page);
    ok(s.up && !s.cover, 'the opening is up and its cover gone once it mounted', s);
    const home = await page.evaluate(() => { const c = document.querySelector('#content'); return !!c && c.classList.contains('is-home') && c.children.length > 0; });
    ok(home, 'Home is drawn underneath meanwhile (the opening adds no wait to it)');
    ok(await page.evaluate(() => hubOpeningUp()), 'hubOpeningUp() says so, for the hello');
    const card = await page.evaluate(() => ({ nm: document.querySelector('.op-nm').textContent, rl: document.querySelector('.op-rl').textContent,
      wel: document.querySelector('.op-wel').textContent, face: !!document.querySelector('.op-pic svg.ds-art .ds-sheet'),
      noId: !document.querySelector('.op img[src*="photo"], .op [class*="barcode"]') }));
    ok(card.nm === 'Jose V.' && card.rl === 'Staff Interpreter' && card.wel === 'Welcome in, Jose', 'the card: "Jose V.", Staff Interpreter; "Welcome in, Jose"', card);
    ok(card.face, 'Dr. Smiley where the photo goes');
    await page.screenshot({ path: O + 'arriving.png' });
    await wait(2300);
    await page.screenshot({ path: O + 'badge.png' });
    ok((await state(page)).log.indexOf('hello') < 0, 'the hello has not started under the opening', await state(page));
    const box = await page.evaluate(() => { const r = document.querySelector('.op-holder').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.touchscreen.tap(box.x, box.y);
    await wait(1250);
    const g = await page.evaluate(() => ({ wel: +getComputedStyle(document.querySelector('.op-wel')).opacity, lc: getComputedStyle(document.querySelector('.op-lr')).getPropertyValue('--lc').trim() }));
    ok(g.wel > .5 && g.lc === '#5de3a0', 'the tap: green, and the welcome shows', g);
    await page.screenshot({ path: O + 'green.png' });
    await wait(1700);
    const after = await state(page);
    ok(!after.up && after.log[0] === 'done', 'it ends by itself and says so (hub-opening-done)', after);
    const reach = await homeReached(page);
    ok(reach.found && reach.hit, 'nothing is left over Home: a tap on its search reaches it', reach);
    await wait(3500);
    const log = await page.evaluate(() => window.__opLog);
    const d = log.find(e => e[0] === 'done'), h = log.find(e => e[0] === 'hello');
    ok(d && h && h[1] > d[1], 'Home\'s hello plays after the opening, not under it', log);
    // Coming back from the background is not a start.
    await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    await wait(400);
    ok(!(await state(page)).up, 'coming back to the app does not play it again');
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== a tap before the badge arrives');
  {
    const { ctx, page } = await L.boot(b, { device: 'iphone', opening: true, settle: 500, init: WATCH });
    await page.touchscreen.tap(195, 300);
    await wait(450);
    const s = await state(page);
    ok(!s.up && s.log[0] === 'done', 'straight to Home', s);
    const reach = await homeReached(page);
    ok(reach.found && reach.hit, 'and Home takes taps', reach);
    await ctx.close();
  }

  console.log('== when it does not play');
  for (const [label, opts] of [
    ['a notification started the app (?open=chat)', { query: '?open=chat' }],
    ['switched off in More', { opening: false }],
    ['the reload after an update', { init: () => sessionStorage.setItem('ih_opReload', '1') }],
    ['a computer', { device: 'desktop' }],
  ]) {
    const { ctx, page } = await L.boot(b, { device: 'iphone', opening: true, settle: 600, ...opts });
    const s = await state(page);
    ok(!s.up && !s.cover, 'not on ' + label, s);
    if (label.startsWith('the reload')) ok(await page.evaluate(() => sessionStorage.getItem('ih_opReload') === null), 'the reload flag is used once');
    await ctx.close();
  }

  console.log('== Still (reduced motion)');
  {
    const { ctx, page } = await L.boot(b, { device: 'iphone', opening: true, reducedMotion: true, settle: 500, init: WATCH });
    const s = await page.evaluate(() => ({ still: document.querySelector('.op').classList.contains('is-still'), video: getComputedStyle(document.querySelector('.op-bg')).display,
      rig: +getComputedStyle(document.querySelector('.op-rig')).opacity, tr: document.querySelector('.op-rig').style.transform }));
    ok(s.still && s.video === 'none' && s.rig === 1 && !s.tr, 'no drift, the badge already hanging, no swing', s);
    await page.screenshot({ path: O + 'still.png' });
    await page.touchscreen.tap(195, 300);
    await wait(150);
    ok(await page.evaluate(() => document.querySelector('.op').classList.contains('is-green')), 'the tap goes straight to green');
    await wait(1000);
    ok(!(await state(page)).up, 'then Home fades in (gone within a second)');
    await ctx.close();
  }

  console.log('== More\'s Opening card');
  {
    const { ctx, page } = await L.boot(b, { device: 'iphone', opening: false, settle: 4200 });
    await page.evaluate(() => { localStorage.removeItem('ih_opening'); openMoreSheet(); });
    await wait(400);
    const c = await page.evaluate(() => { const i = document.getElementById('opTitleInput'); return { on: document.getElementById('opOnSwitch').getAttribute('aria-checked'),
      snd: document.getElementById('opSoundSwitch').getAttribute('aria-checked'), font: parseFloat(getComputedStyle(i).fontSize), ph: i.placeholder }; });
    ok(c.on === 'true' && c.snd === 'true' && c.ph === 'Staff Interpreter', 'on and Sound on by default; the title field shows Staff Interpreter', c);
    ok(c.font >= 16, 'the title field never zooms an iPhone (16px or more)', c.font);
    await page.evaluate(() => document.querySelector('.op-more').scrollIntoView({ block: 'center' }));
    await wait(300);
    await page.screenshot({ path: O + 'more-card.png' });
    await page.click('#opOnSwitch'); await page.click('#opSoundSwitch');
    const off = await page.evaluate(() => ({ on: localStorage.getItem('ih_opening'), snd: localStorage.getItem('ih_openingSound'), a: document.getElementById('opOnSwitch').getAttribute('aria-checked') }));
    ok(off.on === 'off' && off.snd === 'off' && off.a === 'false', 'the switches turn it and its sound off, on this phone', off);
    await page.click('#opOnSwitch');
    ok(await page.evaluate(() => localStorage.getItem('ih_opening') === null), 'and back on');
    await page.fill('#opTitleInput', 'Per Diem <b>Interpreter</b>');
    await page.click('text=Replay the opening');
    await wait(600);
    const r = await page.evaluate(() => ({ up: !!document.querySelector('.op'), rl: document.querySelector('.op-rl') && document.querySelector('.op-rl').innerHTML, saved: localStorage.getItem('ih_badgeTitle') }));
    ok(r.up && r.rl === 'Per Diem &lt;b&gt;Interpreter&lt;/b&gt;' && r.saved === 'Per Diem <b>Interpreter</b>', 'Replay plays it with the new title, as plain text', r);
    await page.keyboard.press('Escape');
    await wait(400);
    ok(!(await state(page)).up, 'Escape skips it');
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await ctx.close();
  }
  await b.close();
})();
