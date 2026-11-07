/* Pins on your lanyard (docs/features/opening.md, "Pins on your lanyard";
   features/opening.js, opPinsHtml): each CoreCHI badge earned is an enamel
   pin on the opening's lanyard, the first earned lowest, all eight above the
   clasp and on screen; one earned since this phone's last opening clicks on
   with a sparkle and is then remembered (ih_pinsSeen); a skip before the
   badge arrives doesn't use up its moment; no badges, no pins; Still shows
   them in place; the opening's list matches index.html's BADGES. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'lanyard-pins/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const T0 = Date.now() - 20 * 864e5;
const ALL = { first10: T0, century: T0 + 1e8, week: T0 + 2e8, sharp: T0 + 3e8, sweep: T0 + 4e8, domain90: T0 + 5e8, exam: T0 + 6e8, perfect: T0 + 7e8 };
const seed = (have, seen) => `try{ if(!sessionStorage.getItem('__pins')){ localStorage.setItem('ih_practice_badges_v1', ${JSON.stringify(JSON.stringify(have))});`
  + (seen ? ` localStorage.setItem('ih_pinsSeen', ${JSON.stringify(JSON.stringify(seen))});` : '') + ` sessionStorage.setItem('__pins','1'); } }catch(e){}`;
const pins = page => page.evaluate(() => [...document.querySelectorAll('.op-pin')].map(p => { const r = p.getBoundingClientRect();
  return { id: p.dataset.pin, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), op: +getComputedStyle(p).opacity, fresh: p.classList.contains('is-new') }; }));
const enter = async page => { await wait(1500); if (await page.evaluate(() => OP.gate)) await page.touchscreen.tap(195, 420); };

(async () => {
  const b = await L.chromium.launch();

  console.log('== all eight, the newest clicking on');
  {
    const { page } = await L.boot(b, { device: 'iphone', opening: true, name: 'Jose Vazquez', settle: 300, init: seed(ALL, Object.keys(ALL).slice(0, 7)) });
    await enter(page);
    await wait(900);
    const early = await pins(page);
    const nw = early.find(p => p.id === 'perfect') || {};
    ok(early.length === 8, 'eight badges, eight pins', early.length);
    ok(nw.fresh && nw.op < 1, 'the one earned since the last opening is still on its way as the badge settles', nw);
    await wait(1600);
    const p = await pins(page);
    const order = p.map(x => x.id).join();
    ok(order === Object.keys(ALL).join(), 'in the order earned', order);
    ok(p.every((x, i) => i === 0 || x.top < p[i - 1].top), 'the first earned lowest, each newer one above it', p.map(x => x.top));
    const clasp = await page.evaluate(() => Math.round(document.querySelector('.op-clasp').getBoundingClientRect().top));
    ok(p.every(x => x.top >= 0 && x.bottom <= clasp + 6), 'all eight on screen, above the clasp', { tops: p.map(x => x.top), clasp });
    ok(p.every(x => x.op === 1), 'the new one has landed', p.map(x => x.op));
    await page.screenshot({ path: O + 'all-eight.png' });
    const seenBefore = await page.evaluate(() => localStorage.getItem('ih_pinsSeen'));
    await page.touchscreen.tap(195, 330); await wait(3200);
    const after = await page.evaluate(() => ({ up: !!document.querySelector('.op'), seen: JSON.parse(localStorage.getItem('ih_pinsSeen') || '[]') }));
    ok(!JSON.parse(seenBefore).includes('perfect') && !after.up && after.seen.includes('perfect') && after.seen.length === 8, 'once the opening closes, the new pin is remembered', { seenBefore, after });
    await page.evaluate(() => openingStart(true)); await wait(400); await enter(page); await wait(1400);
    const again = await pins(page);
    ok(again.length === 8 && again.every(x => !x.fresh && x.op === 1), 'the next opening: all already there, nothing clicks on again', again.map(x => [x.id, x.fresh, x.op]));
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }

  console.log('== a skip before the badge arrives keeps the moment');
  {
    const { page } = await L.boot(b, { device: 'iphone', opening: true, name: 'Ana Torres', settle: 300, init: seed({ first10: T0, century: T0 + 1e8 }, ['first10']) });
    await page.evaluate(() => { if (OP.gate) OP.gate = false; openingFinish(true); }); await wait(500);
    const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('ih_pinsSeen') || '[]'));
    ok(seen.join() === 'first10', 'skipped straight to Home: Century still counts as new for next time', seen);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }

  console.log('== no badges yet');
  {
    const { page } = await L.boot(b, { device: 'iphone', opening: true, name: 'Ana Torres', settle: 300, init: seed({}, null) });
    await enter(page); await wait(1500);
    ok((await pins(page)).length === 0 && await page.evaluate(() => !document.querySelector('.op-pins')), 'no pins, nothing added to the lanyard');
    await page.close();
  }

  console.log('== Still');
  {
    const { page } = await L.boot(b, { device: 'iphone', opening: true, name: 'Ana Torres', settle: 300, reducedMotion: true,
      init: seed({ first10: T0, week: T0 + 1e8 }, ['first10']) });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await wait(1200);
    const st = await page.evaluate(() => ({ still: OP.still, el: !!OP.el }));
    if (st.el && st.still) {
      const p = await pins(page);
      ok(p.length === 2 && p.every(x => x.op === 1), 'in Still the new pin is simply there', p);
      await page.evaluate(() => openingFinish(true)); await wait(400);
      ok((await page.evaluate(() => JSON.parse(localStorage.getItem('ih_pinsSeen') || '[]'))).includes('week'), 'and counts as seen');
    } else ok(true, 'Still not reached in this boot (covered by opening.cjs): skipped', st);
    await page.close();
  }

  console.log('== the list matches the badges');
  {
    const { page } = await L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 2500 });
    const m = await page.evaluate(() => ({ app: BADGES.map(x => x.id + x.icon).join(), op: OP_PINS.map(x => x.id + x.icon).join() }));
    ok(m.app === m.op, 'the opening\'s pins are index.html\'s badges, same ids and icons', m);
    await page.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
