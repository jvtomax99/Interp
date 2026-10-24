/* The features/*.js files load before index.html's own script, so anything
   they hook up at load (a resize, a key, a message) can fire before the names
   it reads from index.html exist. The gap is held open here: the last
   features file is answered 1.5 s late, and the window is resized, a key is
   pressed and a message is posted while the page waits. No page error, and
   the app comes up as usual afterwards (docs/split-index.md, phase 3). */
const L = require('../support/harness.cjs');
const fs = require('fs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const html = fs.readFileSync(L.ROOT + 'index.html', 'utf8');
  const feats = [...html.matchAll(/<script src="\.\/(features\/[\w-]+\.js)"><\/script>/g)].map(m => m[1]);
  ok(feats.length > 0, 'index.html loads features files', feats);
  const last = feats[feats.length - 1];
  const b = await L.chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 860 }]) {
    const ctx = await b.newContext({ viewport: vp });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await L.route(page);
    let held = false;
    await page.route(new RegExp(last.replace(/[./]/g, '\\$&') + '(\\?.*)?$'), async r => {
      held = true; await wait(1500);
      r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(L.ROOT + last) });
    });
    const nav = page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
    await wait(700);
    const early = await page.evaluate(() => typeof activeCategory).catch(() => 'n/a');
    await page.setViewportSize({ width: vp.width + 1, height: vp.height - 40 });
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => window.postMessage({ type: 'probe' }, '*')).catch(() => {});
    await nav; await wait(1500);
    const up = await page.evaluate(() => typeof activeCategory !== 'undefined' && !!document.querySelector('#content'));
    const tag = vp.width < 900 ? 'phone' : 'computer';
    ok(held && early === 'undefined', `${tag}: the gap was held open (${last} late, index.html's script not run yet)`, { held, early });
    ok(!errs.length, `${tag}: a resize, a key and a message in the gap raise no page error`, errs);
    ok(up, `${tag}: the app comes up afterwards`);
    await ctx.close();
  }
  await b.close();
})();
