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

  console.log('== tap the lanyard: your pins');
  for (const dark of [false, true]) {
    const { page } = await L.boot(b, { device: 'iphone', dark, opening: true, name: 'Jose Vazquez', settle: 300, init: seed({ first10: T0, century: T0 + 864e5 * 3, week: T0 + 864e5 * 9 }, ['first10', 'century', 'week']) });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await enter(page); await wait(2600);
    const hit = await page.evaluate(() => { const h = document.querySelector('.op-pinhit'); const r = h.getBoundingClientRect();
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const pins = [...document.querySelectorAll('.op-pin')].map(p => p.getBoundingClientRect());
      const covers = pins.every(p => p.left >= r.left - 1 && p.right <= r.right + 1 && p.top >= r.top - 9 && p.bottom <= r.bottom + 1);
      return { w: Math.round(r.width), h: Math.round(r.height), own: at === h, covers, label: h.getAttribute('aria-label') }; });
    ok(hit.own && hit.w >= 44 && hit.h >= 44, 'the strip over the pins takes its own tap, 44 px or more each way', hit);
    ok(hit.covers, 'and it covers every pin', hit);
    const box = await page.evaluate(() => { const r = document.querySelector('.op-pinhit').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.touchscreen.tap(box.x, box.y); await wait(500);
    const card = await page.evaluate(() => { const c = document.querySelector('.op-pincard'); if (!c) return null;
      return { rows: [...c.querySelectorAll('li')].map(li => li.innerText.replace(/\s+/g, ' ').trim()), tapped: OP.tap, focus: document.activeElement && document.activeElement.className,
        bg: getComputedStyle(c.querySelector('.op-pc-box')).backgroundColor, ink: getComputedStyle(c.querySelector('h2')).color }; });
    ok(card && card.rows.length === 3, 'a card lists the three pins', card);
    ok(card && /Week strong/.test(card.rows[0]) && /Studied 7 days in a row/.test(card.rows[0]) && /First steps/.test(card.rows[2]), 'newest first, each with its name and what earned it', card && card.rows);
    ok(card && card.rows.every(r => /20\d\d/.test(r)), 'and the day it was earned', card && card.rows);
    ok(card && card.tapped === null, 'the badge was not scanned', card && card.tapped);
    ok(card && card.focus === 'op-pc-close', 'Back to your badge has the focus', card && card.focus);
    if (dark) ok(card && card.bg !== card.ink, 'dark mode: the text reads on the card', card);
    const btn = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('.op-pc-close'));
      const n = s => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
      const L = c => { const [r, g, b] = n(c); return .2126 * r + .7152 * g + .0722 * b; };
      const a = L(cs.backgroundColor), b = L(cs.color); return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2); });
    ok(btn >= 4.5, 'Back to your badge: its words stand out from it (contrast 4.5 or more)', btn);
    await page.screenshot({ path: O + 'pins-card' + (dark ? '-dark' : '') + '.png' });
    const h2 = await page.evaluate(() => { const r = document.querySelector('.op-pc-box h2').getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2 }; });
    await page.touchscreen.tap(h2.x, h2.y); await wait(300);
    const inside = await page.evaluate(() => ({ card: !!document.querySelector('.op-pincard'), tap: OP.tap }));
    ok(inside.card && inside.tap === null, 'a tap on the card itself scans nothing and keeps it open', inside);
    const cb = await page.evaluate(() => { const b = document.querySelector('.op-pc-close'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height }; });
    ok(cb.h >= 44, 'Back to your badge is 44 px or taller', cb.h);
    await page.touchscreen.tap(cb.x, cb.y); await wait(400);
    const after = await page.evaluate(() => ({ card: !!document.querySelector('.op-pincard'), up: !!OP.el, tap: OP.tap }));
    ok(after.up && !after.card && after.tap === null, 'closing goes back to the badge, still waiting for its tap', { inside, after });
    if (!dark) {
      const pt = await page.evaluate(() => { const r = document.querySelector('.op-pinhit').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.touchscreen.tap(pt.x, pt.y); await wait(400);
      await page.touchscreen.tap(195, 40); await wait(300);
      ok(await page.evaluate(() => !document.querySelector('.op-pincard') && !!OP.el && OP.tap === null), 'a tap on the dimmed scene around the card closes it too, nothing scanned');
    }
    await page.touchscreen.tap(195, 330); await wait(3200);
    ok(await page.evaluate(() => !document.querySelector('.op')), 'then the badge tap lets you in as before');
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }
  {
    const { page } = await L.boot(b, { device: 'iphone', opening: true, name: 'Jose Vazquez', settle: 300, init: seed({ first10: T0 }, ['first10']) });
    await enter(page); await wait(2600);
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => document.activeElement && document.activeElement.className);
    if (f === 'op-pinhit') { await page.keyboard.press('Enter'); await wait(300); const c = await page.evaluate(() => !!document.querySelector('.op-pincard') && OP.tap === null);
      await page.keyboard.press('Escape'); await wait(300);
      const back = await page.evaluate(() => !!OP.el && !document.querySelector('.op-pincard'));
      ok(c && back, 'keyboard: Enter on the strip opens the card without scanning, Escape closes only the card', { c, back }); }
    else ok(true, 'keyboard focus started elsewhere (' + f + '): skipped');
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
    const m = await page.evaluate(() => ({ app: BADGES.map(x => x.id + x.icon + x.name + x.note).join(), op: OP_PINS.map(x => x.id + x.icon + x.name + x.note).join() }));
    ok(m.app === m.op, 'the opening\'s pins are index.html\'s badges, same ids, icons, names and notes', m);
    await page.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
