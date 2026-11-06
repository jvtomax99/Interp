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

// The music (opening/music-1.m4a): asked for when the opening mounts, played only after a tap.
// A browser that can't decode AAC (the open-source Chromium on GitHub) says so in OP.musicErr and plays nothing, silently.
const music = page => page.evaluate(() => ({ asked: !!OP.musicData, on: !!OP.mus, playing: !!(OP.mus && OP.mus.src), ac: OP.ac ? OP.ac.state : null,
  noAac: !!OP.musicErr }));

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
    const bar = () => page.evaluate(() => ({ meta: document.querySelector('meta[name="theme-color"]').content, html: getComputedStyle(document.documentElement).backgroundColor }));
    const barUp = await bar();
    barUp.body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(/^#[0-9a-f]{6}$/.test(barUp.meta) && barUp.meta !== '#f3f6fc' && barUp.html === barUp.body && barUp.body !== 'rgb(244, 246, 250)',
      'the phone\'s top bar (theme-color and the page\'s background) takes the scene\'s color while it is up, not white', barUp);
    const card = await page.evaluate(() => ({ nm: document.querySelector('.op-nm').textContent, rl: document.querySelector('.op-rl').textContent,
      wel: document.querySelector('.op-wel').textContent, face: !!document.querySelector('.op-pic svg.ds-art .ds-sheet'),
      noId: !document.querySelector('.op img[src*="photo"], .op [class*="barcode"]') }));
    ok(card.nm === 'Jose V.' && card.rl === 'Staff Interpreter' && card.wel === 'Welcome in, Jose', 'the card: "Jose V.", Staff Interpreter; "Welcome in, Jose"', card);
    ok(card.face, 'Dr. Smiley where the photo goes');
    await page.screenshot({ path: O + 'arriving.png' });
    await wait(2300);
    await page.screenshot({ path: O + 'badge.png' });
    const m0 = await music(page);
    ok(m0.asked && m0.on && m0.ac === 'suspended', 'the music is started at open, held paused by a browser that wants a touch first (as an iPhone does)', m0);
    ok((await state(page)).log.indexOf('hello') < 0, 'the hello has not started under the opening', await state(page));
    const box = await page.evaluate(() => { const r = document.querySelector('.op-holder').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.touchscreen.tap(box.x, box.y);
    // Green from 0.95 s after the tap, the welcome from 1.05 s; on a busy machine frames come late, so wait for it (2.5 s at most).
    await page.waitForFunction(() => +getComputedStyle(document.querySelector('.op-wel')).opacity > .5, null, { timeout: 2500 }).catch(() => {});
    const g = await page.evaluate(() => ({ wel: +getComputedStyle(document.querySelector('.op-wel')).opacity, lc: getComputedStyle(document.querySelector('.op-lr')).getPropertyValue('--lc').trim() }));
    ok(g.wel > .5 && g.lc === '#5de3a0', 'the tap: green, and the welcome shows', g);
    const m1 = await music(page);
    ok(m1.ac === 'running' && (m1.on && m1.playing || m1.noAac), 'the tap starts the music' + (m1.noAac ? ' (this browser cannot decode AAC: none, and no error)' : ''), m1);
    await page.screenshot({ path: O + 'green.png' });
    await page.waitForFunction(() => !document.querySelector('.op'), null, { timeout: 4000 }).catch(() => {});
    const after = await state(page);
    ok(!after.up && after.log[0] === 'done', 'it ends by itself and says so (hub-opening-done)', after);
    ok(!(await music(page)).on, 'the music is fading out over Home (let go when the opening ends)');
    const reach = await homeReached(page);
    ok(reach.found && reach.hit, 'nothing is left over Home: a tap on its search reaches it', reach);
    const barAfter = await bar();
    barAfter.body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(barAfter.meta === '#f3f6fc' && barAfter.body === 'rgb(244, 246, 250)' && !(await page.evaluate(() => document.documentElement.classList.contains('op-on'))), 'the top bar is Home\'s again after the hand-over', barAfter);
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

  console.log('== the light follows the clock');
  {
    const table = await (async () => { const { ctx, page } = await L.boot(b, { device: 'iphone', opening: false, settle: 300 });
      const t = await page.evaluate(() => [0, 4, 5, 10, 11, 15, 16, 23].map(h => h + ':' + openingLook(h)).join(' ')); await ctx.close(); return t; })();
    ok(table === '0:evening 4:evening 5:morning 10:morning 11:midday 15:midday 16:evening 23:evening', 'morning 5-11, midday 11-4, evening and night 4 pm-5 am', table);
    for (const [at, look, clip] of [['2026-11-06T08:00:00', 'morning', 'pavilion-morning-1'], ['2026-11-06T13:00:00', 'midday', 'pavilion-1'], ['2026-11-06T21:00:00', 'evening', 'pavilion-evening-1']]) {
      const { ctx, page } = await L.boot(b, { device: 'iphone', opening: true, settle: 500, clock: at });
      const s = await page.evaluate(() => { const v = document.querySelector('.op-bg'), op = document.querySelector('.op');
        return { attr: document.documentElement.getAttribute('data-op-look'), cls: op && op.className, src: v && [...v.querySelectorAll('source')].map(x => x.getAttribute('src')).join(' '),
          poster: v && v.getAttribute('poster'), bg: op && getComputedStyle(op).backgroundImage }; });
      ok(s.attr === look && s.cls.includes('op-' + look) && s.src.includes(clip + '.mp4') && s.src.includes(clip + '.webm') && s.poster.includes(clip + '.webp') && s.bg.includes(clip + '.webp'),
        at.slice(11, 16) + ': the ' + look + ' look (its loop, its still behind it)', s);
      const top = await page.evaluate(() => ({ meta: document.querySelector('meta[name="theme-color"]').content, body: getComputedStyle(document.body).backgroundColor }));
      const want = { morning: ['#5c5459', 'rgb(92, 84, 89)'], midday: ['#52515a', 'rgb(82, 81, 90)'], evening: ['#1a1923', 'rgb(26, 25, 35)'] }[look];
      ok(top.meta === want[0] && top.body === want[1], at.slice(11, 16) + ': the top bar takes this light\'s top edge', top);
      // While the ring opens, Home shows inside it: nothing behind the scene but Home.
      const ring = await page.evaluate(() => { cancelAnimationFrame(OP.raf); OP.t0 = 1e12; OP.tap = 3; OP.cues = { b: 1, c: 1, w: 1 }; opFrame(5.2);
        const op = document.querySelector('.op'), r = document.querySelector('.op-reader').getBoundingClientRect();
        const el = document.elementsFromPoint(r.left + r.width / 2, r.top - 60);
        return { bg: getComputedStyle(op).backgroundImage, opening: op.classList.contains('is-opening'), mask: document.querySelector('.op-scene').style.maskImage || document.querySelector('.op-scene').style.webkitMaskImage }; });
      ok(ring.opening && ring.bg === 'none' && /radial-gradient/.test(ring.mask), at.slice(11, 16) + ': inside the opening ring is Home, not the still', ring);
      ok(await page.evaluate(() => !document.documentElement.classList.contains('op-on') && document.querySelector('meta[name="theme-color"]').content === '#f3f6fc'),
        at.slice(11, 16) + ': once the ring opens, the top bar is Home\'s again');
      await page.evaluate(() => { OP.tap = null; OP.ring = null; document.querySelector('.op').classList.remove('is-opening'); const sc = document.querySelector('.op-scene'); sc.style.maskImage = sc.style.webkitMaskImage = ''; OP.t0 = performance.now() - 2000; });
      if (look === 'evening') {
        const w = await page.evaluate(() => getComputedStyle(document.querySelector('.op-holder'), '::after').backgroundColor);
        ok(/rgba\(56, 78, 170/.test(w), 'the evening badge takes the cool light', w);
      }
      await page.waitForTimeout(1900);
      await page.screenshot({ path: O + 'look-' + look + '.png' });
      ok(!page.__errors.length, 'no page errors', page.__errors);
      await ctx.close();
    }
  }

  console.log('== a phone that allows sound before a touch');
  {
    const b2 = await L.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
    const { page } = await L.boot(b2, { device: 'iphone', opening: true, settle: 900 });
    await wait(600);
    const m = await music(page);
    ok(m.ac === 'running' && (m.playing || m.noAac), 'the music plays from the moment the opening is up, before any tap', m);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await b2.close();
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
    ok(await page.evaluate(() => { const t = openingMoreHtml(); return /Soft music/.test(t); }), 'the Sound switch says it covers the music');
    await page.click('#opSoundSwitch');
    await page.fill('#opTitleInput', 'Per Diem <b>Interpreter</b>');
    await page.click('text=Replay the opening');
    await wait(600);
    const r = await page.evaluate(() => ({ up: !!document.querySelector('.op'), rl: document.querySelector('.op-rl') && document.querySelector('.op-rl').innerHTML, saved: localStorage.getItem('ih_badgeTitle') }));
    ok(r.up && r.rl === 'Per Diem &lt;b&gt;Interpreter&lt;/b&gt;' && r.saved === 'Per Diem <b>Interpreter</b>', 'Replay plays it with the new title, as plain text', r);
    const m2 = await music(page);
    ok(m2.ac === 'running' && (m2.on || m2.noAac), 'Replay is a tap, so the music plays while the badge waits', m2);
    await page.keyboard.press('Escape');
    await wait(400);
    ok(!(await state(page)).up, 'Escape skips it');
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await ctx.close();
  }
  await b.close();
})();
