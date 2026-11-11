/* The feel guard (docs/feel-audit.md, phase 5, step 3): fails when a feel
   target the audit reached slips back. One browser, iPhone size, no CPU
   throttling (GitHub's runners vary too much for timed limits at 4x), the
   suites' stand-ins. What it holds:

     scroll   a scroll of a 150-term domain searches nothing and reads no
              layout on every frame (phase 4): querySelectorAll and
              getBoundingClientRect counted over a 6 s scroll
     shift    layout shift under 0.1 on Home, a domain, the doctor list, a
              doctor's page and Team Chat through their data arrival
     flash    no "No ... yet" line shown before the data on those screens
     press    the small controls answer a press (phase 5, step 2): the
              top bar's buttons, a card's pill, a filter pill, a .btn, a
              tile and a card change their look under :active
     contrast no text under 4.5:1 on Updates, Term Review and the Add term
              sheet (the faint ink token's screens)
     face     a cheer at rest ends where its clock says (phase 3): every
              face frame within 100 ms of its due time at 1x
     rest     Home left alone: the meter's hitch under a generous limit

   The first open after a deploy (phase 1) has its own guard, deploy-open.cjs. */
const { chromium, route, SEED } = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

function bigSeed() {
  const seed = JSON.parse(JSON.stringify(SEED));
  const cat = seed.slice().sort((a, b) => (b.terms || []).length - (a.terms || []).length)[0];
  const base = cat.terms.slice(); let i = 0;
  while (cat.terms.length < 150) { const t = Object.assign({}, base[i % base.length]); delete t.id; t.en = t.en + ' ' + (i + 2); cat.terms.push(t); i++; }
  return { seed, id: cat.id };
}
const LOOK = el => { const c = getComputedStyle(el); return [c.transform, c.translate, c.scale, c.opacity, c.backgroundColor, c.boxShadow, c.filter, c.color].join('|'); };
const TEXT = () => (document.querySelector('.modal.show, .overlay.show, .gs-overlay.show') || document.getElementById('content')).innerText.split('\n').map(s => s.trim()).filter(Boolean);

(async () => {
  const { seed, id: big } = bigSeed();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 120)));
  await route(page, {});
  await page.addInitScript(o => {
    window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' }; window.__drProbe = true;
    try { localStorage.setItem('ih_opening', 'off'); localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Jose'); localStorage.setItem('ih_region', 'north'); } catch (e) {}
    window.__ls = [];
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__ls.push(+e.value.toFixed(4)); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    // Counts of the two reads a scroll frame must not make (phase 4).
    window.__reads = { qsa: 0, rect: 0 };
    const qsa = Document.prototype.querySelectorAll, rect = Element.prototype.getBoundingClientRect;
    Document.prototype.querySelectorAll = function () { window.__reads.qsa++; return qsa.apply(this, arguments); };
    window.__readers = {};
    Element.prototype.getBoundingClientRect = function () { window.__reads.rect++; if (window.__reads.trace) { const who = (new Error().stack.split('\n')[2] || '').trim().replace(/^at /, '').replace(/https?:\/\/[^/]+\//, '').slice(0, 70); window.__readers[who] = (window.__readers[who] || 0) + 1; } return rect.apply(this, arguments); };
  }, { seed });
  await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12000);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); await cdp.send('DOM.getDocument', { depth: 0 });

  // ---- shift and flash, screen by screen ----
  const SCREENS = [['Home', 'home'], ['a 150-term domain', big], ['the doctor list', 'doctor-directory'], ['Team Chat', 'chat'], ['Updates', 'updates']];
  for (const [name, cat] of SCREENS) {
    await page.evaluate(() => { if (typeof closeAllOverlays === 'function') closeAllOverlays(); scrollTo(0, 0); });
    await page.waitForTimeout(300);
    await page.evaluate(c => { window.__ls = []; setCategory(c); }, cat);
    const early = []; for (const at of [0, 120, 500]) { await page.waitForTimeout(at === 0 ? 0 : at === 120 ? 120 : 380); early.push(...await page.evaluate(TEXT)); }
    await page.waitForTimeout(2000);
    const last = new Set(await page.evaluate(TEXT));
    const flash = [...new Set(early)].filter(l => /^No .{2,40} yet\b/i.test(l) && !last.has(l));
    const shift = await page.evaluate(() => +window.__ls.reduce((a, v) => a + v, 0).toFixed(3));
    ok(flash.length === 0, `${name}: nothing says "nothing yet" before the data arrives`, flash);
    ok(shift < 0.1, `${name}: layout shift ${shift} through the data arrival (under 0.1)`);
  }
  await page.evaluate(() => { setCategory('doctor-directory'); openDoctorDirDetail('d3'); });
  await page.evaluate(() => { window.__ls = []; }); await page.waitForTimeout(2500);
  const dpShift = await page.evaluate(() => +window.__ls.reduce((a, v) => a + v, 0).toFixed(3));
  ok(dpShift < 0.1, `a doctor's page: layout shift ${dpShift} (under 0.1)`);
  await page.evaluate(() => closeDoctorDirDetail());

  // ---- press: forced :active changes the look ----
  const press = async (screen, sel, what) => {
    if (screen) { await page.evaluate(c => { if (typeof closeAllOverlays === 'function') closeAllOverlays(); scrollTo(0, 0); setCategory(c); }, screen); await page.waitForTimeout(1500); }
    const before = await page.evaluate(([s, look]) => { const el = document.querySelector(s); if (!el) return null; el.scrollIntoView({ block: 'center' }); const L = eval(look); const inner = el.querySelector('span, svg, i'); return L(el) + (inner ? L(inner) : ''); }, [sel, LOOK.toString()]);
    if (before === null) { ok(false, `${what} (${sel}) is on ${screen || 'this screen'}`); return; }
    const { result } = await cdp.send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(sel)})` });
    const { nodeId } = await cdp.send('DOM.requestNode', { objectId: result.objectId });
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
    await page.waitForTimeout(60);
    const during = await page.evaluate(([s, look]) => { const el = document.querySelector(s); const L = eval(look); const inner = el.querySelector('span, svg, i'); return L(el) + (inner ? L(inner) : ''); }, [sel, LOOK.toString()]);
    await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
    // A touch adds .is-pressed (LIFTS in index.html); a tile's lift lives there.
    const pressed = await page.evaluate(([s, look]) => { const el = document.querySelector(s); el.classList.add('is-pressed'); const L = eval(look); const inner = el.querySelector('span, svg, i'); const v = L(el) + (inner ? L(inner) : ''); el.classList.remove('is-pressed'); return v; }, [sel, LOOK.toString()]);
    ok(during !== before || pressed !== before, `${what} answers a press (${during !== before ? ':active' : ''}${pressed !== before ? ' .is-pressed' : ''})`);
  };
  await press('home', '.tg-icon-btn', 'the top bar\'s dark-mode button');
  await press(null, '.domain-family', 'a domain card on Home (the family carries the glow, not the tile inside)');
  await press(null, '.qa-tile', 'a quick tile');
  await press('updates', '.tg-back', 'the top bar\'s Back');
  await press(null, '.btn.btn-primary', 'a primary button');
  await press(null, '.activity-delete', 'a list action (the ✕)');
  await press(big, '.link-pill', 'a card\'s Hear pill');
  await press(null, '.card', 'a term card');
  await press('falsefriends', '.ff-chip', 'a filter pill');
  await press('doctor-directory', '.dl-card', 'a doctor card');

  // ---- contrast, light theme ----
  const CONTRAST = () => {
    const lum = (r, g, b) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const rgb = s => { const m = s && s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
    const bgOf = el => { let n = el; while (n && n !== document.documentElement) { const c = getComputedStyle(n); if (c.backgroundImage !== 'none') return null; const b = rgb(c.backgroundColor); if (b && b[3] > .9) return b; n = n.parentElement; } return rgb(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1]; };
    const top = document.querySelector('.modal.show, .overlay.show, .gs-overlay.show') || document.getElementById('content');
    const low = [];
    for (const el of top.querySelectorAll('*')) {
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
      const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) continue;
      const c = getComputedStyle(el); if (c.visibility === 'hidden' || +c.opacity < .5) continue;
      const fg = rgb(c.color), b = bgOf(el); if (!fg || !b) continue;
      const L1 = lum(fg[0], fg[1], fg[2]), L2 = lum(b[0], b[1], b[2]);
      const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
      const size = parseFloat(c.fontSize), need = size >= 24 || (size >= 18.66 && +c.fontWeight >= 700) ? 3 : 4.5;
      if (ratio < need) low.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' "' + el.textContent.trim().slice(0, 20) + '" ' + ratio.toFixed(2));
    }
    return [...new Set(low)].slice(0, 8);
  };
  for (const [name, open] of [['Updates', () => setCategory('updates')], ['Term Review', () => setCategory('review')], ['the Add term sheet', () => { setCategory('all'); openAddModal(); }]]) {
    await page.evaluate(() => { if (typeof closeAllOverlays === 'function') closeAllOverlays(); scrollTo(0, 0); });
    await page.evaluate(open); await page.waitForTimeout(2000);
    const low = await page.evaluate(CONTRAST);
    ok(low.length === 0, `${name}: no text under 4.5:1 (light theme)`, low);
  }

  // ---- scroll: the 150-term domain, reads per scroll frame ----
  await page.evaluate(c => { if (typeof closeAllOverlays === 'function') closeAllOverlays(); scrollTo(0, 0); setCategory(c); }, big);
  await page.waitForTimeout(2500);
  await page.evaluate(() => { window.__reads.qsa = 0; window.__reads.rect = 0; window.__reads.trace = true; window.__readers = {}; });
  let scrollEvents = 0;
  await page.evaluate(() => { window.__se = 0; addEventListener('scroll', () => window.__se++, { capture: true, passive: true }); });
  const drag = async (from, to) => { const step = from > to ? -18 : 18; for (let y = from; step < 0 ? y >= to : y <= to; y += step) await cdp.send('Input.dispatchTouchEvent', { type: y === from ? 'touchStart' : 'touchMove', touchPoints: [{ x: 196, y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(500); };
  for (let k = 0; k < 3; k++) await drag(620, 170);
  for (let k = 0; k < 3; k++) await drag(170, 620);
  const reads = await page.evaluate(() => { window.__reads.trace = false; return Object.assign({}, window.__reads, { events: window.__se, who: Object.entries(window.__readers).sort((a, b) => b[1] - a[1]).slice(0, 5) }); });
  scrollEvents = reads.events;
  ok(scrollEvents > 30, `the domain scrolled (${scrollEvents} scroll events)`);
  ok(reads.qsa < scrollEvents / 2, `scrolling searches the page far less than once a frame (${reads.qsa} querySelectorAll in ${scrollEvents} scroll events)`);
  // The rects still read in a scroll frame are the few cached faces (read in
  // the event, while layout is clean) and the gaze following the finger: a
  // handful per event. A search over the page per frame, or a read per card,
  // would blow past this.
  ok(reads.rect < scrollEvents * 4, `scrolling reads only a few rects a frame (${reads.rect} getBoundingClientRect in ${scrollEvents} scroll events)`, reads.who);

  // ---- face: a cheer at rest keeps its clock ----
  await page.evaluate(() => { if (typeof closeAllOverlays === 'function') closeAllOverlays(); scrollTo(0, 0); setCategory('home'); });
  await page.waitForTimeout(3000);
  const face = await page.evaluate(async () => {
    const b = document.querySelector('#content.is-home .home-wave-icon'); const svg = b && b.querySelector('svg.ds-art');
    if (!svg || typeof drFacePlay !== 'function') return null;
    svg.__drLog = [];
    drFacePlay(svg, 'cheer', b.querySelector('.home-wave-pin'), null, 5);
    await new Promise(r => setTimeout(r, 2600));
    const log = svg.__drLog.filter(e => e.run === 'cheer');
    const late = log.map(e => e.at - e.due);
    return { frames: log.length, worst: Math.max(...late), median: late.sort((a, b) => a - b)[Math.floor(late.length / 2)] };
  });
  ok(face && face.frames > 5, `the cheer played (${face && face.frames} frames)`, face);
  ok(face && face.worst < 100, `every face frame within 100 ms of its due time (worst ${face && face.worst} ms, median ${face && face.median})`);

  // ---- rest: Home left alone ----
  await page.evaluate(() => { FM.on = false; frameMeterStart(); });
  await page.waitForTimeout(6000);
  const rest = await page.evaluate(() => { const r = frameMeterStop(); frameMeterClose(); return r; });
  // This machine reads 0-56 at 1x from run to run; GitHub's runners are
  // slower and noisier. 120 catches a runaway loop (hundreds), not noise.
  ok(rest && rest.ratio < 120, `Home at rest: hitch ${rest && rest.ratio} ms/s at 1x (under 120; the phone's bar is 10)`);

  ok(!errors.length, 'no page errors', errors);
  await browser.close();
})().catch(e => { console.log('  FAIL ' + e.message); process.exit(1); });
