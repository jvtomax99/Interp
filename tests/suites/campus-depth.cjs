/* F3 (docs/features/practice-dashboard.md): the campus at golden hour in two
   pictures, the far world (sky, the town) under the campus, which is cut
   from the sky; the far world slides a little with the page's scroll and
   with a drag across the scene, and springs back after the drag; the
   campus, its lit windows and badges stay put; nothing moves under reduced
   motion. The sky's colours are read from the far picture itself. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'campus-depth/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    console.log('== ' + device);
    const { ctx, page } = await L.boot(b, { device });
    await L.go(page, 'practice', 1800);
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(300);

    const layers = await page.evaluate(() => {
      const w = document.querySelector('#content .cp-world'), far = w.querySelector('.cp-far'), near = w.querySelector('.cp-ground');
      const order = far.compareDocumentPosition(near) === Node.DOCUMENT_POSITION_FOLLOWING;
      const R = w.getBoundingClientRect(), f = far.getBoundingClientRect(), n = near.getBoundingClientRect();
      return { far: far.getAttribute('src'), near: near.getAttribute('src'), order, loaded: far.complete && far.naturalWidth > 0 && near.complete && near.naturalWidth > 0,
        farCovers: f.left <= R.left + 1 && f.right >= R.right - 1 && f.top <= R.top + 1 && f.bottom >= R.bottom - 1, nearBottom: Math.abs(n.bottom - R.bottom) < 2, nearW: Math.abs(n.width - R.width) < 2, fy: w.style.getPropertyValue('--fy') };
    });
    ok(layers.far === './city/far.webp' && layers.near === './city/near.webp' && layers.order && layers.loaded, 'the far world and the campus are two pictures, the far one under', layers);
    ok(layers.farCovers && layers.nearBottom && layers.nearW, 'the far world covers the whole scene (7% larger); the campus sits on its bottom edge, full width', layers);

    // The pictures themselves: the campus picture is transparent in the sky; the far picture is lavender overhead and peach at the horizon.
    const px = await page.evaluate(async () => {
      const read = async (src, pts) => { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
        return pts.map(([x, y]) => [...g.getImageData(Math.round(x * im.naturalWidth), Math.round(y * im.naturalHeight), 1, 1).data]); };
      const near = await read('./city/near.webp', [[0.03, 0.02], [0.5, 0.85]]);
      const far = await read('./city/far.webp', [[0.5, 0.03], [0.5, 0.14], [0.5, 0.6]]);
      return { nearSkyAlpha: near[0][3], nearCampusAlpha: near[1][3], top: far[0], horizon: far[1], low: far[2] };
    });
    ok(px.nearSkyAlpha === 0 && px.nearCampusAlpha === 255, 'the campus picture is cut from the sky (transparent above, solid on the campus)', px);
    // the camera looks down, so the frame's top is the sky's warm band; the lavender is the haze over the town below it
    const warmTop = px.top[0] > px.top[2] && px.top[0] > 200, lavenderLow = px.low[2] > px.low[0] && px.low[2] > px.low[1];
    const noGray = [px.top, px.horizon, px.low].every(c => Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) > 20);
    ok(warmTop && lavenderLow && noGray, 'golden hour: a warm peach-rose sky, lavender haze over the town, nothing gray', px);

    // Scroll: the far world slides the other way from the scroll; the campus, its windows and badges stay put.
    const before = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'); const tag = w.querySelector('.cp-tag'), lit = w.querySelector('.cp-litw') || w.querySelector('.cp-ground');
      return { fy: parseFloat(w.style.getPropertyValue('--fy')) || 0, tagX: tag.getBoundingClientRect().left - w.getBoundingClientRect().left, litX: lit.getBoundingClientRect().left - w.getBoundingClientRect().left, farY: w.querySelector('.cp-far').getBoundingClientRect().top - w.getBoundingClientRect().top }; });
    await page.evaluate(() => window.scrollBy(0, 260)); await wait(250);
    const after = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'); const tag = w.querySelector('.cp-tag'), lit = w.querySelector('.cp-litw') || w.querySelector('.cp-ground');
      return { fy: parseFloat(w.style.getPropertyValue('--fy')) || 0, tagX: tag.getBoundingClientRect().left - w.getBoundingClientRect().left, litX: lit.getBoundingClientRect().left - w.getBoundingClientRect().left, farY: w.querySelector('.cp-far').getBoundingClientRect().top - w.getBoundingClientRect().top, unit: w.style.getPropertyValue('--fy') }; });
    ok(after.fy > before.fy && after.fy - before.fy > 0.2 && /cqw$/.test(after.unit) && Math.abs(after.fy) <= 1.6, 'scrolling down slides the far world down a little (in the scene\'s own width units, at most 1.6%)', { before, after });
    ok(after.farY > before.farY + 0.5 && Math.abs(after.tagX - before.tagX) < 0.5 && Math.abs(after.litX - before.litX) < 0.5, 'the far picture moved on screen; the badges and the campus did not shift', { before, after });
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(250);

    // Drag: a finger across the scene shifts the far world sideways (at most 2.5%), then it springs back; a short press is still a tap.
    const box = await page.evaluate(() => { const r = document.querySelector('#content .cp-world').getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.8, w: r.width }; });   // on the drive, under the badges
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + box.w * 0.3, box.y, { steps: 6 }); await wait(60);
    const mid = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'); return { fx: parseFloat(w.style.getPropertyValue('--fx')) || 0, dragging: w.classList.contains('is-dragging') }; });
    ok(mid.dragging && mid.fx > 0.5 && mid.fx <= 2.5, 'mid-drag: the far world has slid with the finger, capped at 2.5%', mid);
    await page.mouse.up(); await wait(100);
    const settling = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), far = w.querySelector('.cp-far'); return { fx: w.style.getPropertyValue('--fx'), settling: far.classList.contains('is-settling'), dragging: w.classList.contains('is-dragging'), tt: getComputedStyle(far).transitionDuration }; });
    ok(!settling.dragging && settling.settling && settling.fx === '0px' && /0\.6s/.test(settling.tt), 'release: it springs back to centre (.6 s)', settling);
    await wait(800);
    ok(await page.evaluate(() => !document.querySelector('#content .cp-far').classList.contains('is-settling')), 'and the spring is let go afterwards');
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 3, box.y); await page.mouse.up(); await wait(100);
    ok(await page.evaluate(() => !document.querySelector('#content .cp-world').classList.contains('is-dragging') && (parseFloat(document.querySelector('#content .cp-world').style.getPropertyValue('--fx')) || 0) === 0), 'a 3 px press is not a drag', null);
    if (device === 'iphone') await page.screenshot({ path: O + 'golden-hour.png' });
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== reduced motion');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', reducedMotion: true });
    await L.go(page, 'practice', 1500);
    await page.evaluate(() => window.scrollBy(0, 200)); await wait(250);
    const r = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), far = w.querySelector('.cp-far'); const m = new DOMMatrix(getComputedStyle(far).transform);
      return { fy: w.style.getPropertyValue('--fy'), tx: +m.e.toFixed(1), ty: +m.f.toFixed(1), sc: +m.a.toFixed(2), on: !!campusDepthOn }; });
    ok(r.fy === '' && r.tx === 0 && r.ty === 0 && r.sc === 1.07 && !r.on, 'reduced motion: the far world stays put (just its 7% size), no listener', r);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; });
