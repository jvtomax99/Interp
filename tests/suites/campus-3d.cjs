/* Your campus in 3D (docs/features/practice-dashboard.md, 2026-10-26): the 3D button on the CoreCHI Practice card
   opens campus3d/index.html full screen in a frame; it gets your own progress by message (each building as tall as
   its share learned, the badges say how much), "See it finished" shows every building done, a building's Practise
   closes it and starts that exam area, the X closes it and the frame is dropped. The 3D itself draws with
   SwiftShader here (no GPU), so only what it shows is checked, not how fast. */
const L = require('../support/harness.cjs');
const fs = require('fs');
const O = L.OUT + 'campus-3d/'; fs.mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const TYPES = { html: 'text/html; charset=utf-8', js: 'application/javascript' };
const MASTERY = () => { window.domainMastery = () => { const out = {};
  CCHI_DOMAINS.forEach(d => out[d.id] = { known:0, shaky:0, unseen:10, total:10 });
  out.ethics = { known:7, shaky:0, unseen:3, total:10 }; out.terminology = { known:10, shaky:0, unseen:0, total:10 }; return out; }; };

(async () => {
  const b = await L.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const { page } = await L.boot(b, { device: 'iphone' });
  await page.route('**/campus3d/**', r => {
    const f = L.ROOT + new URL(r.request().url()).pathname.replace(/^\//, '');
    if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, contentType: TYPES[f.split('.').pop()] || 'text/plain', body: fs.readFileSync(f) });
  });
  await page.evaluate(m => new Function(m)(), `(${MASTERY})()`);
  await L.go(page, 'practice', 1800);
  await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' })); await wait(500);

  // The button: on the picture, a real tap target, the top layer where it sits.
  const btn = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), e = w.querySelector('.cp-3d'), r = e.getBoundingClientRect(), R = w.getBoundingClientRect();
    return { h: r.height, inside: r.left >= R.left && r.right <= R.right && r.top >= R.top && r.bottom <= R.bottom, mine: document.elementFromPoint(r.left + r.width/2, r.top + r.height/2)?.closest('.cp-3d') === e,
      label: e.getAttribute('aria-label'), x: r.left + r.width/2, y: r.top + r.height/2 }; });
  ok(btn.h >= 44 && btn.inside && btn.mine && /3D/.test(btn.label), 'the 3D button sits on the campus picture, 44 px, takes its tap', btn);
  await page.screenshot({ path: O + 'card.png' });

  await page.mouse.click(btn.x, btn.y); await wait(400);
  const open = await page.evaluate(() => { const ov = document.querySelector('.overlay.c3d-ov'), f = ov && ov.querySelector('iframe');
    return { shown: !!ov && ov.classList.contains('show'), src: f && f.getAttribute('src'), cover: ov && (() => { const r = ov.getBoundingClientRect(); return r.width >= innerWidth - 1 && r.height >= innerHeight - 1; })() }; });
  ok(open.shown && open.src === './campus3d/index.html' && open.cover, 'it opens the campus in 3D full screen', open);

  // The frame builds the campus and asks for your progress.
  const frame = () => page.frames().find(f => /campus3d\/index\.html/.test(f.url()));
  let fr = null; for (let i = 0; i < 120 && !(fr = frame()); i++) await wait(250);
  let ready = false; if (fr) ready = await fr.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 150000 }).then(() => true).catch(() => false);
  const err = fr ? await fr.evaluate(() => document.body.classList.contains('ready') ? '' : document.getElementById('loading').textContent) : 'no frame';
  ok(ready, 'the campus is drawn in 3D', err);
  if (!ready){ await b.close(); return; }
  await wait(1500);
  const badges = await fr.evaluate(() => [...document.querySelectorAll('.badge')].map(e => ({ k: e.dataset.k, t: e.textContent.trim(), done: e.classList.contains('done') })));
  const by = k => badges.find(x => x.k === k) || {};
  ok(badges.length === 5 && /^Ethics 70%$/.test(by('e').t) && by('t').done && /★/.test(by('t').t) && /^US Systems 0%$/.test(by('s').t),
    'your own progress arrives: Ethics 70%, Terminology done, US Systems 0%', badges);
  await page.screenshot({ path: O + 'iphone-3d.png' });

  // See it finished: every building done; again: back to your progress.
  await fr.click('#finished'); await wait(800);
  const fin = await fr.evaluate(() => ({ pressed: document.getElementById('finished').getAttribute('aria-pressed'), done: [...document.querySelectorAll('.badge')].every(e => e.classList.contains('done')), body: document.body.classList.contains('is-finished') }));
  ok(fin.pressed === 'true' && fin.done && fin.body, 'See it finished: every building done', fin);
  await page.screenshot({ path: O + 'iphone-finished.png' });
  await fr.click('#finished'); await wait(500);
  const back = await fr.evaluate(() => ({ pressed: document.getElementById('finished').getAttribute('aria-pressed'), e: document.querySelector('.badge[data-k="e"]').textContent.trim() }));
  ok(back.pressed === 'false' && back.e === 'Ethics 70%', 'and again: back to your own progress', back);

  // A building's card and its Practise: the 3D closes, that exam area starts.
  await fr.click('.badge[data-k="e"]'); await wait(700);
  const card = await fr.evaluate(() => ({ shown: !document.getElementById('card').hidden, k: document.getElementById('cardK').textContent, f: document.getElementById('cardF').textContent }));
  ok(card.shown && card.k === 'Ethics' && /70% built/.test(card.f), 'tap Ethics: its card, 70% built', card);
  await fr.click('#cardGo'); await wait(900);
  const went = await page.evaluate(() => ({ shown: document.querySelector('.overlay.c3d-ov').classList.contains('show'), cat: activeCategory, practiceCard: !!document.querySelector('#content .cp-world') }));
  ok(!went.shown && !went.practiceCard, 'Practise closes it and starts Ethics', went);
  await wait(400);
  ok(!(await page.evaluate(() => !!document.querySelector('.overlay.c3d-ov iframe'))), 'closed, its frame is dropped (the 3D stops)');

  // The X closes it too.
  await L.go(page, 'practice', 1500);
  await page.evaluate(() => openCampus3d()); await wait(300);
  for (let i = 0; i < 120 && !(fr = frame()); i++) await wait(250);
  await fr.waitForFunction(() => document.body.classList.contains('ready'), null, { timeout: 150000 }).catch(() => {});
  await fr.click('#close'); await wait(500);
  ok(!(await page.evaluate(() => document.querySelector('.overlay.c3d-ov').classList.contains('show'))), 'its X closes it');
  if (page.__errors && page.__errors.length) ok(false, 'no page errors', page.__errors);
  await b.close();
})();
