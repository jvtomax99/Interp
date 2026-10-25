/* The knowledge brain's real points for the 1-minute cut's brain shot (SHOTS-60s.md): brain/you.html,
   given knowledgeBrainData() from this checkout with the made-up record (about half the terms
   known), records every THREE.Points it builds as it builds them. Writes assets/kbrain.json:
     cortex  the brain's shape, every 3rd point: [x, y, z, r, g, b] flattened, 3 decimals
     terms   one point per glossary term: [x, y, z, r, g, b] (its core colour after paint)
   Run from the repo root:  node promo/hub-blend/tools/capture-kbrain.cjs */
const path = require('path'), fs = require('fs');
const L = require('../../../tests/support/harness.cjs');
const OUT = path.resolve(__dirname, '..', 'assets', 'kbrain.json');

const DEMO_RECORD = `(() => {
  const now = Date.now(), day = 864e5; let i = 0;
  DATA.categories.forEach(c => c.terms.forEach(t => {
    if (!t.en || !t.es) return; const k = (i++ * 37) % 100;
    if (k < 52) TERM_REVIEWS[t.id] = { box: 3 + (k % 3), reviewCount: 4, lastResult: 'right', nextReviewAt: now + 9 * day };
    else if (k < 66) TERM_REVIEWS[t.id] = { box: 1 + (k % 2), reviewCount: 2, lastResult: 'right', nextReviewAt: now + day };
    else if (k < 72) TERM_REVIEWS[t.id] = { box: 0, reviewCount: 2, lastResult: 'miss', misses: 1, nextReviewAt: now };
  }));
})()`;

(async () => {
  const browser = await L.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const init = `localStorage.setItem('ih_promoSeen','1');localStorage.setItem('ih_region','north');`;
  const { ctx, page } = await L.boot(browser, { device: 'pwa', settle: 3500, init });
  await L.go(page, 'review', 2500);
  await page.evaluate(DEMO_RECORD + ';termReviewsLoaded = true;');
  const data = await page.evaluate(() => knowledgeBrainData());
  const brain = await ctx.newPage(); brain.__errors = []; brain.on('pageerror', e => brain.__errors.push(e.message));
  await L.route(brain, {});
  const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json' };
  await brain.route(/^https:\/\/interp\.test\/brain\//, r => { const f = L.ROOT + new URL(r.request().url()).pathname.slice(1);
    return r.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); }); // the harness serves the app, not brain/
  await brain.addInitScript(() => { window.parent = { postMessage: () => {} }; });
  await brain.goto(page.url().replace(/[^/]*$/, '') + 'brain/you.html');
  await brain.waitForTimeout(800);
  await brain.evaluate(() => { // record each point cloud as the page makes it
    const P = THREE.Points; window.__pts = [];
    THREE.Points = class extends P { constructor(g, m) { super(g, m); window.__pts.push(this); } };
  });
  await brain.evaluate(d => window.postMessage({ ih: 'brain-data', data: d }, location.origin), data);
  await brain.waitForTimeout(4000);
  const out = await brain.evaluate(() => {
    const r3 = (v) => Math.round(v * 1000) / 1000;
    const flat = (pts, every) => { const p = pts.geometry.attributes.position.array, c = pts.geometry.attributes.color.array, o = [];
      for (let i = 0; i < p.length / 3; i += every) o.push(r3(p[i * 3]), r3(p[i * 3 + 1]), r3(p[i * 3 + 2]), r3(c[i * 3]), r3(c[i * 3 + 1]), r3(c[i * 3 + 2]));
      return o; };
    const pts = window.__pts, sizes = pts.map(p => p.material.size);
    const cortex = pts[0], core = pts.find(p => p.material.size === 0.06);
    return { sizes, cortex: flat(cortex, 3), terms: flat(core, 1) };
  });
  console.log('point clouds (sizes):', out.sizes.join(', '), '| cortex', out.cortex.length / 6, '| terms', out.terms.length / 6,
    brain.__errors.length ? '| ERR ' + brain.__errors[0] : '');
  delete out.sizes;
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(OUT, Math.round(fs.statSync(OUT).size / 1024) + ' KB');
  await browser.close();
})();
