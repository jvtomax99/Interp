// The acting sheet (docs/art/dr-smiley-body/preview-acting.png): run from tests/ as
// node ../docs/art/dr-smiley-body/layers/sheet.cjs <out dir>, then tile the PNGs (see the handoff).
// Frames mid-performance from the viewer: greet, cheer, think, shrug, a few moments each.
const fs = require('fs'), path = require('path');
const L = require('/home/user/Interp/tests/support/harness.cjs');
const R = L.ROOT, OUT = process.argv[2];
(async () => {
  const b = await L.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await L.route(page, {});
  await page.route('**/drsmiley/body.html', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(R + 'drsmiley/body.html', 'utf8') }));
  await page.route('**/drsmiley/body.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(R + 'drsmiley/body.js', 'utf8') }));
  await page.goto('https://interp.test/drsmiley/body.html', { waitUntil: 'load' });
  await page.waitForTimeout(2800);
  await page.evaluate(() => { stopIdle(); body.stop(); body.rest(); document.body.classList.add('is-still'); document.getElementById('who').style.setProperty('--size', '100%'); });
  await page.waitForTimeout(300);
  const box = await page.evaluate(() => { const r = document.querySelector('svg.db').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  const shots = [];
  // [name, seed, times in ms after the start]
  for(const [name, seed, times] of [['greet', 3, [0, 420, 700, 1000, 1500]], ['cheer', 3, [200, 480, 700, 1000, 1700]], ['think', 2, [300, 700, 1400, 2100, 2500]], ['shrug', 3, [180, 450, 900, 1300, 1700]], ['bounce', 3, [120, 300, 450, 700, 1100]]]){
    for(const t of times){
      await page.evaluate(([n, s]) => { body.stop(); body.rest(); drBodySeed(s); body.perform(n); drBodySeed(null); window.__t0 = performance.now(); }, [name, seed]);
      await page.waitForTimeout(t);
      const file = `${OUT}/${name}-${t}.png`;
      await page.screenshot({ path: file, clip: box, omitBackground: true });
      shots.push({ name, t, file });
      await page.evaluate(() => { body.stop(); body.rest(); });
      await page.waitForTimeout(150);
    }
  }
  fs.writeFileSync(OUT + '/shots.json', JSON.stringify(shots));
  await b.close();
})().catch(e => { console.log('crashed ' + (e.stack || e)); process.exit(1); });
