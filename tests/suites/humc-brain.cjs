/* HUMC Brain: a double-tap on Dr. Smiley's head in the hello opens the brain
   full screen; a single tap still opens Ask the Hub; Back, the X and leaving
   close it and drop its frame. docs/features/humc-brain.md. */
const { chromium, boot, ROOT } = require('../support/harness.cjs');
const fs = require('fs');
const OUT = require('../support/harness.cjs').OUT + 'brain/'; fs.mkdirSync(OUT, { recursive: true });
const results = []; const ok = (c, m) => { results.push([!!c, m]); console.log((c ? 'PASS ' : 'FAIL ') + m); };
const TYPES = { html: 'text/html; charset=utf-8', js: 'application/javascript', json: 'application/json' };
const DATA = JSON.parse(fs.readFileSync(ROOT + 'brain/data.json', 'utf8'));

(async () => {
  const b = await chromium.launch();
  const { ctx, page: P } = await boot(b, { device: 'iphone' });
  await P.route('**/brain/**', r => {
    const f = ROOT + new URL(r.request().url()).pathname.replace(/^\//, '');
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, contentType: TYPES[f.split('.').pop()] || 'text/plain', body: fs.readFileSync(f) });
  });
  await P.evaluate(() => setCategory('home')); await P.waitForTimeout(2500);

  const spot = async (share) => P.evaluate(s => {
    const r = document.querySelector('#content.is-home .home-wave-icon .home-wave-pin').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * s };
  }, share);
  const head = await spot(.3), below = await spot(.9);
  const hit = await P.evaluate(([h, l]) => [h, l].map(p => !!document.elementFromPoint(p.x, p.y)?.closest('.home-wave-icon')), [head, below]);
  ok(hit[0] && hit[1], 'his head and the spot below it both land on Dr. Smiley ' + JSON.stringify(hit));

  const state = () => P.evaluate(() => ({ cat: activeCategory, open: !!document.querySelector('.brain-ov.show'), frame: !!document.querySelector('.brain-ov iframe'), ov: document.body.classList.contains('ov-open') }));
  const brainFrame = () => P.frames().find(f => f.url().includes('/brain/'));
  const doubleTap = async p => { await P.touchscreen.tap(p.x, p.y); await P.waitForTimeout(120); await P.touchscreen.tap(p.x, p.y); };

  // Double-tap his head: the brain, not Ask.
  await doubleTap(head); await P.waitForTimeout(2500);
  let s = await state();
  ok(s.open && s.frame && s.ov && s.cat === 'home', 'double-tap on his head opens the brain over Home, Ask stays shut ' + JSON.stringify(s));
  const fr = brainFrame();
  const inside = fr && await fr.evaluate(() => ({ n: window.BRAIN && BRAIN.nodes.length, e: window.BRAIN && BRAIN.edges.length,
    mx: document.getElementById('mx').height, tree: document.getElementById('tree').height, rows: document.querySelectorAll('.rank tbody tr').length,
    close: !document.getElementById('closeBrain').hidden, w: innerWidth, sw: document.documentElement.scrollWidth }));
  ok(inside && inside.n === DATA.nodes.length && inside.e === DATA.edges.length, 'the brain loads every section and link from brain/data.json ' + JSON.stringify(inside));
  ok(inside && inside.mx > 100 && inside.tree > 100 && inside.rows === 15, 'its figures are drawn (matrix, volumes, top 15 table)');
  ok(inside && inside.close && inside.sw <= inside.w, 'its X shows in the app, and nothing runs off the side');
  await P.screenshot({ path: OUT + 'phone-brain.png' });

  // Back closes it and its frame goes.
  await P.evaluate(() => navigateBack()); await P.waitForTimeout(700);
  s = await state();
  ok(!s.open && !s.frame && !s.ov && s.cat === 'home', 'Back closes it, drops the frame, stays on Home ' + JSON.stringify(s));

  // Again, then its own X.
  await doubleTap(head); await P.waitForTimeout(2500);
  const fr2 = brainFrame();
  ok(!!fr2 && (await state()).open, 'it opens again after closing');
  if (fr2) { await fr2.click('#closeBrain'); await P.waitForTimeout(700); }
  s = await state();
  ok(!s.open && !s.frame, 'its X closes it ' + JSON.stringify(s));

  // One tap on his head: Ask, a moment later than before.
  await P.touchscreen.tap(head.x, head.y); await P.waitForTimeout(150);
  const early = (await state()).cat;
  await P.waitForTimeout(900);
  s = await state();
  ok(early === 'home' && s.cat === 'ask' && !s.open, 'a single tap on his head still opens Ask the Hub ' + JSON.stringify({ early, ...s }));

  // Below his head: Ask as before.
  await P.evaluate(() => setCategory('home')); await P.waitForTimeout(2000);
  await P.touchscreen.tap(below.x, below.y); await P.waitForTimeout(600);
  s = await state();
  ok(s.cat === 'ask' && !s.open, 'a tap below his head opens Ask the Hub as before ' + JSON.stringify(s));

  // Leaving Home with it open closes it.
  await P.evaluate(() => setCategory('home')); await P.waitForTimeout(2000);
  await P.evaluate(() => openHumcBrain()); await P.waitForTimeout(800);
  await P.evaluate(() => setCategory('more')); await P.waitForTimeout(800);
  s = await state();
  ok(!s.open && !s.frame, 'going to another screen closes it ' + JSON.stringify(s));

  ok(P.__errors.length === 0, 'no page errors ' + JSON.stringify(P.__errors.slice(0, 3)));
  await ctx.close(); await b.close();
  process.exit(results.every(r => r[0]) ? 0 : 1);
})();
