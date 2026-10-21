/* Two separate brains. A double-tap on Dr. Smiley's head in the hello opens
   his, the app's code (brain/index.html), and nothing else; a single tap
   still opens Ask the Hub; Back, the X and leaving close it and drop its
   frame. The CoreCHI Practice tile opens your knowledge brain
   (brain/you.html, lit by your own Term Review record): a domain's Practise
   starts Term Review on it, a term's Open the card shows it. Neither links to
   the other. docs/features/humc-brain.md, knowledge-brain.md. */
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

  // A record to light it: one known, one learning, one missed and overdue (yesterday's lastAt).
  const rec = await P.evaluate(async () => {
    await ensureLoaded('termReviews', loadTermReviews);
    const ts = allTermsFlat().filter(t => t.en && t.es), day = 86400000, now = Date.now();
    const [a, b, c] = [ts[0], ts[1], ts[2]];
    TERM_REVIEWS[a.id] = { box: 4, reviewCount: 4, lastResult: 'ok', misses: 0, lastAt: now - day, nextReviewAt: now + 9 * day };
    TERM_REVIEWS[b.id] = { box: 1, reviewCount: 1, lastResult: 'ok', misses: 0, lastAt: now - day, nextReviewAt: now + day };
    TERM_REVIEWS[c.id] = { box: 0, reviewCount: 2, lastResult: 'miss', misses: 2, lastAt: now - 2 * day, nextReviewAt: now - day };
    return { total: ts.length, known: a.id, learning: b.id, missed: c.id, missedDom: c.categoryId, top: askTopOf(c.categoryId) };
  });

  // K2: the record's rule checks this phone's name in hub-members. A refused
  // read syncs that name, waited for, and asks once more.
  const k2 = await P.evaluate(async () => {
    const realColl = db.collection.bind(db), savedAuth = hubAuth, before = { ...TERM_REVIEWS };
    let asked = 0, synced = null;
    hubAuth = { currentUser: { uid: 'phone1' } };
    db.collection = name => {
      if(name === 'hub-members') return { doc: id => ({ update: d => { synced = { id, who: d.who }; return Promise.resolve(); } }) };
      const c = realColl(name);
      if(name !== 'term-reviews') return c;
      return { ...c, where: (...a) => { const q = c.where(...a); return { ...q, get: () => asked++ ? q.get() : Promise.reject(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' })) }; } };
    };
    try{ await loadTermReviews(); return { loaded: termReviewsLoaded, asked, synced, me: whoAmI() }; }
    finally{ db.collection = realColl; hubAuth = savedAuth; TERM_REVIEWS = before; termReviewsLoaded = true; }
  });
  ok(k2.loaded && k2.asked === 2 && k2.synced && k2.synced.id === 'phone1' && k2.synced.who === k2.me, 'a refused record read syncs this phone\'s name, then loads ' + JSON.stringify(k2));

  // Your knowledge brain (the Practice tile's way in; the tile itself is tapped further down).
  await P.evaluate(() => openHumcBrain('you')); await P.waitForTimeout(3000);
  let s = await state();
  let fr = brainFrame();
  const you = fr && await fr.evaluate(() => {
    const K = window.KNOW, lv = id => (K.terms.find(t => t.id === id) || {}).lv;
    return { url: location.pathname, n: K && K.terms.length, all: K && K.ALL.lv, tops: K && K.tops.length, loaded: K && K.K && K.K.loaded,
      chips: document.querySelectorAll('#legend .chip').length, rows: document.querySelectorAll('#cover .row').length, next: document.querySelectorAll('#next .row').length,
      note: document.getElementById('note').hidden ? '' : document.getElementById('note').textContent, w: innerWidth, sw: document.documentElement.scrollWidth,
      tabs: document.querySelectorAll('.tabs, a[href]').length };
  });
  const lvs = fr && await fr.evaluate(ids => ids.map(id => (window.KNOW.terms.find(t => t.id === id) || {}).lv), [rec.known, rec.learning, rec.missed]);
  ok(s.open && you && you.url.endsWith('/brain/you.html') && you.tabs === 0, 'the knowledge brain opens on its own, with no link to his ' + JSON.stringify(you && { url: you.url, links: you.tabs }));
  ok(you && you.n === rec.total && you.loaded && you.chips === you.tops && you.rows === you.tops, 'every term with English and Spanish is a dot, one chip and one coverage row per domain ' + JSON.stringify(you && { n: you.n, total: rec.total, tops: you.tops, chips: you.chips, rows: you.rows }));
  ok(JSON.stringify(lvs) === '[3,2,1]' && you.all[3] === 1 && you.all[2] === 1 && you.all[1] === 1 && you.next === 1, 'the record lights it: known, learning, missed; the missed one is next up ' + JSON.stringify({ lvs, all: you && you.all, next: you && you.next }));
  ok(you && you.sw <= you.w && !you.note, 'nothing runs off the side, no warning note ' + JSON.stringify(you && { w: you.w, sw: you.sw, note: you.note }));
  const logged = await P.evaluate(() => { try{ const l = JSON.parse(localStorage.getItem('ih_knowledgeLog')); return l[whoAmI().trim().toLowerCase()][kbToday()]; }catch(e){ return null; } });
  ok(Array.isArray(logged) && logged[1] === 1 && logged[0] === 3 && logged[2] === rec.total, 'today\'s count is kept on the phone for the progress figure ' + JSON.stringify(logged));
  await P.screenshot({ path: OUT + 'phone-you.png' });

  // A domain's chip: its sheet; Practise starts Term Review on that domain and closes the brain.
  await fr.evaluate(top => { const K = window.KNOW, g = K.K.domains.findIndex(d => d.id === top); document.querySelector(`#legend .chip[data-g="${g}"]`).click(); }, rec.top);
  await P.waitForTimeout(400);
  const sh = await fr.evaluate(() => ({ open: !document.getElementById('sheet').hidden, h2: document.querySelector('#sheet h2')?.textContent, act: document.querySelector('#sheet [data-act="practise"]')?.textContent, weak: document.querySelectorAll('#sheet .list li').length }));
  ok(sh.open && sh.act && sh.weak > 0, 'a domain chip opens its sheet with what to practise first ' + JSON.stringify(sh));
  await P.screenshot({ path: OUT + 'phone-you-domain.png' });
  await fr.click('#sheet [data-act="practise"]'); await P.waitForTimeout(1500);
  s = await state();
  const rv = await P.evaluate(top => ({ active: reviewActive, n: reviewQueue.length, inTop: reviewQueue.every(t => askTopOf(t.categoryId) === top), card: !!document.querySelector('#content .review-card') }), rec.top);
  ok(!s.open && s.cat === 'review' && rv.active && rv.n > 0 && rv.inTop && rv.card, 'Practise closes the brain and starts Term Review on that domain ' + JSON.stringify({ ...s, ...rv }));
  await P.evaluate(() => { reviewActive = false; reviewQueue = []; try{ localStorage.removeItem('ih_reviewSession'); }catch(e){} setCategory('home'); }); await P.waitForTimeout(2000);

  // A term's sheet: Open the card shows it in the glossary.
  await P.evaluate(() => openHumcBrain('you')); await P.waitForTimeout(3000);
  fr = brainFrame();
  await fr.evaluate(id => { const t = window.KNOW.terms.find(x => x.id === id); document.querySelector(`#next .row[data-i="${t.i}"]`).click(); }, rec.missed);
  await P.waitForTimeout(400);
  const ts = await fr.evaluate(() => ({ h2: document.querySelector('#sheet h2')?.textContent, card: !!document.querySelector('#sheet [data-act="card"]') }));
  ok(ts.card, 'a term in Next up opens its sheet ' + JSON.stringify(ts));
  await fr.click('#sheet [data-act="card"]'); await P.waitForTimeout(1500);
  s = await state();
  const shown = await P.evaluate(id => !!document.querySelector(`#content .card[data-term-id="${CSS.escape(id)}"]`), rec.missed);
  ok(!s.open && s.cat === rec.missedDom && shown, 'Open the card closes the brain and shows the term in its domain ' + JSON.stringify({ ...s, shown, want: rec.missedDom }));
  await P.evaluate(() => setCategory('home')); await P.waitForTimeout(2000);

  // Double-tap his head: his brain, the app's code, not Ask and not the knowledge brain.
  await doubleTap(head); await P.waitForTimeout(2500);
  s = await state();
  ok(s.open && s.frame && s.ov && s.cat === 'home', 'double-tap on his head opens his brain over Home, Ask stays shut ' + JSON.stringify(s));
  ok(brainFrame() && brainFrame().url().endsWith('/brain/index.html'), 'his head opens his brain, not the knowledge brain ' + (brainFrame() && brainFrame().url()));
  const inside = (fr = brainFrame()) && await fr.evaluate(() => ({ n: window.BRAIN && BRAIN.nodes.length, e: window.BRAIN && BRAIN.edges.length,
    mx: document.getElementById('mx').height, tree: document.getElementById('tree').height, rows: document.querySelectorAll('.rank tbody tr').length,
    close: !document.getElementById('closeBrain').hidden, w: innerWidth, sw: document.documentElement.scrollWidth }));
  ok(s.open && inside && inside.n === DATA.nodes.length && inside.e === DATA.edges.length, 'his brain loads every section and link from brain/data.json ' + JSON.stringify(inside));
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

  // The CoreCHI Practice dashboard's tile opens it too, on the knowledge tab.
  await P.evaluate(() => setCategory('practice')); await P.waitForTimeout(2000);
  const tile = await P.evaluate(() => { const b = document.querySelector('#content .kb-entry .kb-go'); if(!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, pct: document.querySelector('#content .kb-entry .kb-entry-span b').textContent }; });
  ok(tile && tile.h >= 30, 'the Practice dashboard has the knowledge brain tile ' + JSON.stringify(tile));
  await P.screenshot({ path: OUT + 'phone-practice-tile.png' });
  if (tile) { await P.touchscreen.tap(tile.x, tile.y); await P.waitForTimeout(2500); }
  s = await state();
  ok(s.open && brainFrame() && brainFrame().url().endsWith('/brain/you.html'), 'its Open button opens the knowledge brain ' + JSON.stringify(s));
  await P.evaluate(() => navigateBack()); await P.waitForTimeout(700);

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
