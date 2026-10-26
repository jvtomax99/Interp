/* Your HUMC campus on CoreCHI Practice (docs/features/practice-dashboard.md):
   each badge names its exam area; the first tap on a building or badge picks
   it (it shows in full colour, the scene dims, a card names the area) without
   starting anything; a second tap or Practise starts; the empty scene,
   close and Escape put it back; a re-render keeps the pick, a new visit
   doesn't. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'campus-pick/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const state = page => page.evaluate(() => {
  const w = document.querySelector('#content .cp-world'), card = document.querySelector('#content .cp-pick-in');
  const sel = [...document.querySelectorAll('#content .cp-tag.is-sel')].map(t => t.dataset.k);
  const lit = document.querySelector('#content .cp-paintsel img');
  return { onPractice: activeCategory === 'practice' && !!w, has: !!w && w.classList.contains('has-sel'), sel, card: card ? card.innerText.replace(/\s+/g, ' ').trim() : null,
    lit: lit ? lit.getAttribute('src') : null, shade: w ? +getComputedStyle(w.querySelector('.cp-shade')).opacity : null };
});
// The centre of a building's tap area that is really that building (not a badge or Dr. Smiley over it).
const bldPoint = (page, k) => page.evaluate(k => {
  const b = document.querySelector(`#content .cp-bld[data-k="${k}"]`), r = b.getBoundingClientRect();
  for (const [fx, fy] of [[.5, .6], [.5, .75], [.3, .7], [.7, .7], [.5, .45]]) {
    const x = r.left + r.width * fx, y = r.top + r.height * fy;
    if (document.elementFromPoint(x, y) === b) return { x, y };
  }
  return null;
}, k);

// Tap a badge where it is (the focus badge bobs, so no waiting for it to be still).
const tap = async (page, sel) => { const r = await page.evaluate(sel => { const e = document.querySelector(sel), r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); await page.mouse.click(r.x, r.y); };

(async () => {
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    console.log('== ' + device);
    const { page } = await L.boot(b, { device });
    await L.go(page, 'practice', 1800);
    await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' })); await wait(400);

    const tags = await page.evaluate(() => {
      const ts = [...document.querySelectorAll('#content .cp-tag')], wr = document.querySelector('#content .cp-world').getBoundingClientRect();
      const rs = ts.map(t => t.getBoundingClientRect());
      const overlaps = [];
      rs.forEach((a, i) => rs.forEach((c, j) => { if (j > i && a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) overlaps.push(ts[i].dataset.k + '/' + ts[j].dataset.k); }));
      const dr = document.querySelector('#content .cp-dr'), d = dr && dr.getBoundingClientRect();
      const drOn = d ? ts.filter((t, i) => { const a = rs[i]; return a.left < d.right - 2 && d.left + 2 < a.right && a.top < d.bottom - 2 && d.top + 2 < a.bottom; }).map(t => t.dataset.k) : [];
      if (drOn.length) overlaps.push('Dr. Smiley on ' + drOn.join());
      return { names: ts.map(t => t.querySelector('b') && t.querySelector('b').textContent), want: CAMPUS.map(c => c.short),
        overlaps, inside: rs.every(r => r.left >= wr.left - 1 && r.right <= wr.right + 1 && r.top >= wr.top - 1),
        hit: ts.every((t, i) => { const r = rs[i], h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return h && t.contains(h); }) };
    });
    ok(JSON.stringify(tags.names) === JSON.stringify(tags.want), 'each badge names its exam area', tags.names);
    ok(!tags.overlaps.length && tags.inside && tags.hit, 'badges apart (Dr. Smiley too), inside the picture, each takes its own tap', tags);
    await page.screenshot({ path: O + device + '-rest.png' });

    // first tap on a building: picks it, starts nothing
    const pe = await bldPoint(page, 'e');
    ok(!!pe, 'the banner building has a spot that is really the building');
    if (pe) await page.mouse.click(pe.x, pe.y); await wait(500);
    let s = await state(page);
    ok(s.onPractice && s.has && s.sel.join() === 'e' && /Professional Responsibility & Ethics/.test(s.card) && /% of exam/.test(s.card) && /questions?/.test(s.card),
      'tap the building: picked, card names Ethics, still on Practice', s);
    ok(s.lit === './city/e-paint10.webp' && s.shade > 0.9, 'it shows in full colour, the scene dims', s);
    const go = await page.evaluate(() => { const g = document.querySelector('#content .cp-pick .cp-play'), x = document.querySelector('#content .cp-pick-x');
      const hit = el => { const r = el.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { w: Math.round(r.width), h: Math.round(r.height), mine: !!h && el.contains(h) }; };
      return { go: hit(g), x: hit(x), label: g.getAttribute('aria-label'), text: g.textContent.trim() }; });
    const cover = await page.evaluate(() => { const c = document.querySelector('#content .cp-pick-in').getBoundingClientRect(), w = document.querySelector('#content .cp-world').getBoundingClientRect(),
      f = document.querySelector('#content .cp-foot').getBoundingClientRect(),
      hid = ['.cp-chips', '.cp-go'].map(q => getComputedStyle(document.querySelector('#content ' + q)).visibility);
      return { below: c.top >= w.bottom - 1, fits: c.bottom <= f.bottom + 1, hid }; });
    ok(cover.below && cover.fits && cover.hid.join() === 'hidden,hidden', 'the card sits under the scene, in place of the chips and Play row', cover);
    ok(go.go.mine && go.go.h >= 44 && go.x.mine && go.x.w >= 28 && /^Practise Ethics, \d+% painted$/.test(go.label) && go.text === 'Practise', 'card: Practise (named for Ethics, 44 px) and close, each takes its tap', go);
    await page.screenshot({ path: O + device + '-picked.png' });

    // another badge switches the pick
    await tap(page, '#content .cp-tag[data-k="t"]'); await wait(400);
    s = await state(page);
    ok(s.sel.join() === 't' && /Healthcare Terminology/.test(s.card) && s.lit === './city/t-paint10.webp' && s.onPractice, 'tap another badge: the pick moves to Terminology', s);

    // a re-render keeps it
    await page.evaluate(() => renderContent()); await wait(400);
    s = await state(page);
    ok(s.has && s.sel.join() === 't' && /Healthcare Terminology/.test(s.card), 'the screen re-rendering keeps the pick', s);

    // empty scene, close, Escape
    const empty = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), r = w.getBoundingClientRect();
      for (let y = r.top + r.height * .9; y > r.top + 10; y -= 6) for (let x = r.left + 10; x < r.right - 10; x += 12) { const h = document.elementFromPoint(x, y); if (h && w.contains(h) && !h.closest('.cp-bld, .cp-tag')) return { x, y }; }
      return null; });
    if (empty) await page.mouse.click(empty.x, empty.y); await wait(400);
    s = await state(page);
    ok(!!empty && !s.has && !s.sel.length && !s.card, 'tap the empty scene: put back', s);
    await tap(page, '#content .cp-tag[data-k="c"]'); await wait(300);
    await tap(page, '#content .cp-pick-x'); await wait(300);
    const afterX = await state(page);
    await tap(page, '#content .cp-tag[data-k="c"]'); await wait(300);
    await page.keyboard.press('Escape'); await wait(300);
    s = await state(page);
    ok(!afterX.has && !afterX.card && !s.has && !s.card, 'close and Escape put it back', { afterX, s });

    // a new visit starts with nothing picked
    await tap(page, '#content .cp-tag[data-k="s"]'); await wait(300);
    await L.go(page, 'home', 600); await L.go(page, 'practice', 1200);
    s = await state(page);
    ok(s.onPractice && !s.has && !s.card, 'leave and come back: nothing picked', s);

    // second tap starts that area's practice
    await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' })); await wait(300);
    await tap(page, '#content .cp-tag[data-k="n"]'); await wait(300);
    await tap(page, '#content .cp-tag[data-k="n"]'); await wait(900);
    const started = await page.evaluate(() => ({ onPractice: !!document.querySelector('#content .cp-world'), text: document.getElementById('content').innerText.slice(0, 160) }));
    ok(!started.onPractice, 'second tap on the same badge starts practice', started);
    await page.screenshot({ path: O + device + '-started.png' });
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.context().close();
  }
  await b.close();
})();
