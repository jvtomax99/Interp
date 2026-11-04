/* What each screen carries while it is shown (feel audit, phase 4). Boots
   the app at iPhone size on the iPhone paths and, screen by screen (Home,
   a 150-term domain, the doctor list, a doctor's page, More), counts what
   costs a frame: elements with a backdrop-filter, a filter, will-change or
   mix-blend-mode (on screen against off screen), the animations running
   (document.getAnimations(): how many, and how many animate something other
   than transform and opacity, which the main thread must restyle), the
   compositor's layers (CDP LayerTree) and the app's own meter left alone on
   the screen for a few seconds (hitch ms/s, dropped %). Counts, not costs:
   the scroll and screen tools say what they cost.

     cd tests
     node tools/glass-count.cjs             each screen, 6 s at rest, 4x CPU
     REST=10 RATE=1 node tools/glass-count.cjs
     UA=chromium node tools/glass-count.cjs  Chromium's own paths */
const { chromium, route, SEED } = require('../support/harness.cjs');
const RATE = +(process.env.RATE || 4), REST = +(process.env.REST || 6);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';

// The biggest seeded domain grown to 150 terms (copies), so the list is a
// real one.
function bigSeed() {
  const seed = JSON.parse(JSON.stringify(SEED));
  const cat = seed.slice().sort((a, b) => (b.terms || []).length - (a.terms || []).length)[0];
  const base = cat.terms.slice();
  let i = 0;
  while (cat.terms.length < 150) { const t = Object.assign({}, base[i % base.length]); delete t.id; t.en = t.en + ' ' + (i + 2); cat.terms.push(t); i++; }
  return { seed, id: cat.id };
}

const COUNT = () => {
  const vw = innerWidth, vh = innerHeight;
  const out = { backdrop: [0, 0], filter: [0, 0], willChange: [0, 0], blend: [0, 0], elements: 0 };
  const on = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw; };
  const seen = { backdrop: {}, filter: {} };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    out.elements++;
    const k = on(el) ? 0 : 1;
    const name = el.tagName.toLowerCase() + (el.id ? '#' + el.id : el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
    if (cs.backdropFilter && cs.backdropFilter !== 'none') { out.backdrop[k]++; if (!k) seen.backdrop[name] = (seen.backdrop[name] || 0) + 1; }
    if (cs.filter && cs.filter !== 'none') { out.filter[k]++; if (!k) seen.filter[name] = (seen.filter[name] || 0) + 1; }
    if (cs.willChange && cs.willChange !== 'auto') out.willChange[k]++;
    if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') out.blend[k]++;
  }
  const anims = document.getAnimations();
  const props = a => {
    const e = a.effect; if (!e) return [];
    if (e.getKeyframes) { try { return [...new Set(e.getKeyframes().flatMap(f => Object.keys(f).filter(p => !['offset', 'easing', 'composite', 'computedOffset'].includes(p))))]; } catch (x) { return ['?']; } }
    return [];
  };
  const cheap = p => ['transform', 'opacity', 'translate', 'rotate', 'scale'].includes(p);
  let main = 0, offscreen = 0; const mainProps = {};
  for (const a of anims) {
    if (a.playState !== 'running') continue;
    const t = a.effect && a.effect.target;
    if (t && !on(t)) offscreen++;
    const ps = props(a);
    if (ps.some(p => !cheap(p))) { main++; ps.filter(p => !cheap(p)).forEach(p => { mainProps[p] = (mainProps[p] || 0) + 1; }); }
  }
  out.animations = anims.filter(a => a.playState === 'running').length;
  out.animOffscreen = offscreen; out.animMainThread = main; out.animMainProps = mainProps;
  out.topBackdrop = Object.entries(seen.backdrop).sort((a, b) => b[1] - a[1]).slice(0, 6);
  out.topFilter = Object.entries(seen.filter).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return out;
};

(async () => {
  const { seed, id: big } = bigSeed();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, ...(process.env.UA === 'chromium' ? {} : { userAgent: UA }), serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await route(page, {});
  await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
    try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {} }, { seed });
  await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(14000);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  let layers = null; cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) layers = e.layers.length; });
  await cdp.send('LayerTree.enable');
  const SCREENS = [
    ['Home', () => { setCategory('home'); }],
    ['domain ' + big + ' (150 terms)', () => { setCategory(big); }],
    ['doctor list', () => { setCategory('doctor-directory'); }],
    ['doctor page', () => { openDoctorDirDetail('d3'); }],
    ['More (sheet over Home)', () => { closeDoctorDirDetail(); setCategory('home'); openMoreSheet(); }]
  ];
  console.log(`rate ${RATE}x, ${REST} s at rest per screen, ${process.env.UA === 'chromium' ? 'Chromium' : 'iPhone'} paths`);
  console.log('screen'.padEnd(28), 'elems', 'backdrop on/off', 'filter on/off', 'will-change', 'blend', 'anims (off, main)', 'layers', 'hitch ms/s', 'dropped %', 'worst');
  for (const [name, open] of SCREENS) {
    await page.evaluate(open);
    await page.waitForTimeout(2500);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(600);
    const c = await page.evaluate(COUNT);
    layers = null; await cdp.send('LayerTree.disable'); await cdp.send('LayerTree.enable'); await page.waitForTimeout(400);
    await page.evaluate(() => { FM.on = false; frameMeterStart(); });
    await page.waitForTimeout(REST * 1000);
    const run = await page.evaluate(() => { const r = frameMeterStop(); frameMeterClose(); return r; });
    console.log(name.padEnd(28), String(c.elements).padStart(5), `${c.backdrop[0]}/${c.backdrop[1]}`.padStart(15), `${c.filter[0]}/${c.filter[1]}`.padStart(13), `${c.willChange[0]}/${c.willChange[1]}`.padStart(11), `${c.blend[0]}/${c.blend[1]}`.padStart(5), `${c.animations} (${c.animOffscreen}, ${c.animMainThread})`.padStart(18), String(layers).padStart(6), String(run ? run.ratio : '-').padStart(10), String(run ? run.pct : '-').padStart(9), String(run ? run.worst : '-').padStart(5));
    if (Object.keys(c.animMainProps).length) console.log('    main-thread animated props:', JSON.stringify(c.animMainProps));
    if (c.topBackdrop.length) console.log('    backdrop on screen:', c.topBackdrop.map(([k, n]) => `${k}×${n}`).join(', '));
    if (c.topFilter.length) console.log('    filter on screen:', c.topFilter.map(([k, n]) => `${k}×${n}`).join(', '));
  }
  if (errors.length) console.log('page errors:', errors.slice(0, 3));
  await browser.close();
})();
