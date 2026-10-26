/* Campus depth (F3, docs/features/practice-dashboard.md "Golden hour and depth"): the scene is three
   pictures, sky, far town and campus. The sky and the town slide by --dpx/--dpy behind the still
   campus as the card scrolls and while a finger or mouse drags across it, then spring back. Checks:
   the three layers load in order under everything else; at the widest slide both back layers still
   cover the whole scene (no hole); scrolling moves them; a drag moves them, a release brings them
   home, and the drag never picks a building; taps still reach the buildings; under reduced motion
   nothing slides. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'campus-depth/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const vars = page => page.evaluate(() => { const w = document.querySelector('#content .cp-world'); return { x: +(w.style.getPropertyValue('--dpx') || 0), y: +(w.style.getPropertyValue('--dpy') || 0) }; });

(async () => {
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    console.log('== ' + device);
    const { ctx, page } = await L.boot(b, { device });
    await L.go(page, 'practice', 1800);
    await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'center' })); await wait(1200);

    const layers = await page.evaluate(() => {
      const w = document.querySelector('#content .cp-world'), kids = [...w.children];
      const sky = w.querySelector('.cp-d-sky'), far = w.querySelector('.cp-d-far'), near = w.querySelector('.cp-ground');
      const ix = el => kids.indexOf(el), firstLit = kids.findIndex(el => el.classList.contains('cp-paintw'));
      return { srcs: [sky, far, near].map(i => i && i.getAttribute('src')), loaded: [sky, far, near].every(i => i && i.complete && i.naturalWidth === 960),
        order: [ix(sky), ix(far), ix(near)], before: firstLit < 0 || ix(near) < firstLit, pe: [sky, far, near].map(i => getComputedStyle(i).pointerEvents),
        touch: getComputedStyle(w).touchAction };
    });
    ok(layers.srcs.join() === './city/sky.webp,./city/far.webp,./city/near.webp' && layers.loaded, 'the scene is three pictures: sky, far town, campus (all loaded)', layers);
    ok(layers.order[0] < layers.order[1] && layers.order[1] < layers.order[2] && layers.before && layers.pe.every(v => v === 'none'), 'back to front: sky, town, campus, then the lit windows; none takes a tap', layers);
    ok(layers.touch === 'pan-y', 'the scene lets the page scroll up and down but keeps sideways drags', layers.touch);

    // the widest slide in each direction: both back layers still cover the whole scene
    const cover = await page.evaluate(() => {
      const w = document.querySelector('#content .cp-world'), R = w.getBoundingClientRect(), out = [];
      for (const [x, y] of [[10, 10], [-10, -10], [10, -10], [-10, 10]]) {
        w.style.setProperty('--dpx', x); w.style.setProperty('--dpy', y);
        for (const s of ['.cp-d-sky', '.cp-d-far']) { const r = w.querySelector(s).getBoundingClientRect();
          out.push({ s, x, y, gap: Math.max(r.left - R.left, R.right - r.right, r.top - R.top, R.bottom - r.bottom) }); } }
      w.style.setProperty('--dpx', 0); w.style.setProperty('--dpy', 0); return out;
    });
    ok(cover.every(c => c.gap <= 0.5), 'at the widest slide (10 px each way) the sky and the town still cover the scene', cover.filter(c => c.gap > 0.5));

    // scrolling: the card goes up the screen, the back layers lag behind it (--dpy grows)
    const s0 = await vars(page);
    await page.evaluate(() => { const sc = document.scrollingElement; sc.scrollBy(0, 160); document.querySelectorAll('*').forEach(el => { if (el.scrollHeight > el.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(el).overflowY)) el.scrollBy(0, 160); }); });
    await wait(1400);
    const s1 = await vars(page);
    ok(s1.y > s0.y + 0.5 && Math.abs(s1.y) <= 10, 'scrolling the card up slides the back layers down within 10 px', { s0, s1 });
    await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'center' })); await wait(1400);

    // a drag to the right moves the back layers left; let go and they spring home; the drag picks nothing
    const box = await page.evaluate(() => { const r = document.querySelector('#content .cp-bld[data-k="e"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const rest = await vars(page);
    let mid;
    if (device === 'desktop') {
      await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 60, box.y, { steps: 6 }); await page.mouse.move(box.x + 120, box.y, { steps: 6 });
      await wait(120); mid = await vars(page);
      await page.mouse.up(); await wait(80);
    } else {
      mid = await page.evaluate(async ({ x, y }) => {
        const w = document.querySelector('#content .cp-world'), at = document.elementFromPoint(x, y);
        const ev = (t, cx) => new PointerEvent(t, { bubbles: true, cancelable: true, isPrimary: true, pointerType: 'touch', pointerId: 7, clientX: cx, clientY: y, button: 0 });
        at.dispatchEvent(ev('pointerdown', x)); for (let i = 1; i <= 12; i++) { window.dispatchEvent(ev('pointermove', x + i * 10)); await new Promise(r => requestAnimationFrame(r)); }
        const v = { x: +w.style.getPropertyValue('--dpx'), y: +w.style.getPropertyValue('--dpy') };
        window.dispatchEvent(ev('pointerup', x + 120)); at.click(); return v;   // a tap's click follows the release
      }, box);
    }
    const picked = await page.evaluate(() => CAMPUS_PICK.key);
    ok(mid.x < -3 && mid.x >= -10, 'dragging right slides the back layers left (up to 10 px)', { rest, mid });
    ok(!picked, 'the drag did not pick the building it started on', { picked });
    await wait(1600);
    const home = await vars(page);
    ok(Math.abs(home.x) < 0.05 && Math.abs(home.y - rest.y) < 0.3, 'let go: they spring back home', { rest, home });

    // a plain tap still picks; the tap lands on the building, not on a layer
    const hit = await page.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y); return el && (el.closest('.cp-bld, .cp-tag') || el).className; }, box);
    await page.waitForTimeout(400); await page.mouse.click(box.x, box.y); await wait(500);
    const picked2 = await page.evaluate(() => CAMPUS_PICK.key);
    ok(/cp-bld|cp-tag/.test(hit) && !!picked2, 'a tap still reaches the building and picks it', { hit, picked2 });
    await page.screenshot({ path: O + device + '.png' });
    await ctx.close();
  }

  console.log('== reduced motion');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', reducedMotion: true });
    await L.go(page, 'practice', 1800);
    await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'center' })); await wait(600);
    await page.evaluate(() => window.scrollBy(0, 120)); await wait(600);
    const r = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), sky = w.querySelector('.cp-d-sky');
      return { dpx: w.style.getPropertyValue('--dpx'), dpy: w.style.getPropertyValue('--dpy'), loaded: sky.complete && sky.naturalWidth > 0 }; });
    ok(r.dpx === '' && r.dpy === '' && r.loaded, 'reduced motion: the layers are drawn but never slide', r);
    await ctx.close();
  }
  await b.close();
})();
