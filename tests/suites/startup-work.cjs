/* Startup work (S3 in docs/PLAN.md). Three things moved off the tasks that
   open the app, none of them visible:
   - the name pen's path is traced in a worker (home-polish.js, penTrace);
     the pen still writes the name and the name ends up shown;
   - the categories listener's first snapshot (the document loadData just
     read) no longer repaints everything; a real change still does;
   - Home's measuring (petals, the heartline, rail dots, the hero photo) runs
     in the next frame, before it paints: done by the first painted frame. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1';

// Before the app: note blob workers made from penTrace, and count
// applyCategoriesMeta calls once the app has defined it.
const init = () => {
  window.__pen = { workers: 0 };
  const B = window.Blob;
  window.Blob = function (parts, o) { const b = new B(parts, o); try { if (parts && String(parts[0]).includes('penTrace')) b.__pen = 1; } catch (e) {} return b; };
  window.Blob.prototype = B.prototype;
  const U = URL.createObjectURL; const pens = new Set();
  URL.createObjectURL = function (b) { const u = U.call(URL, b); if (b && b.__pen) pens.add(u); return u; };
  const W = window.Worker;
  window.__pen.log = [];
  window.Worker = function (u, o) { const w = new W(u, o); if (pens.has(String(u))) { window.__pen.workers++;
    w.addEventListener('message', e => window.__pen.log.push('message ' + (e.data ? e.data.length + ' strokes' : 'null')));
    w.addEventListener('error', e => window.__pen.log.push('error ' + (e.message || 'load'))); } return w; };
  window.Worker.prototype = W.prototype;
  window.__meta = 0;
  const hook = () => { if (typeof applyCategoriesMeta !== 'function') return setTimeout(hook, 5);
    const o = applyCategoriesMeta; window.applyCategoriesMeta = applyCategoriesMeta = function () { window.__meta++; return o.apply(this, arguments); }; };
  hook();
};

(async () => {
  const b = await L.chromium.launch();

  console.log('== the name pen, first open (iPhone user agent)');
  {
    const ctx = await b.newContext({ viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await L.route(page, {});
    await page.addInitScript(o => { window.__SEED_CATS = o.seed; window.__ACCESS = { mode: 'none' };
      try { localStorage.setItem('ih_onboarded', '1'); localStorage.setItem('ih_myName', 'Moisés'); localStorage.removeItem('ih_penPath'); } catch (e) {} }, { seed: L.SEED });
    await page.addInitScript(init);
    await page.goto('https://interp.test/', { waitUntil: 'domcontentloaded' });
    const wrote = await page.waitForFunction(() => document.querySelector('.home-name-pen'), null, { timeout: 20000 }).then(() => true, () => false);
    ok(wrote, 'the pen writes the name');
    const st = await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('ih_penPath') || '{}'); const v = c['Moisés']; return { workers: window.__pen.workers, strokes: v && v.s && v.s.length }; });
    ok(st.workers === 1, 'its path is traced in a worker', st);
    ok(st.strokes > 2, 'the path is kept on the phone (ih_penPath)', st);
    if (!wrote) console.log('  info: ' + JSON.stringify(await page.evaluate(() => ({ log: window.__pen.log, fonts: document.fonts && document.fonts.check('400 56px Parisienne', 'Moisés'), still: document.documentElement.className }))));
    const shown = await page.waitForFunction(() => { const n = document.querySelector('.home-greeting-name'); return n && !n.classList.contains('is-penning') && !document.querySelector('.home-name-pen'); }, null, { timeout: 20000 }).then(() => true, () => false);
    ok(shown, 'afterwards the name itself is shown');
    ok(!errors.length, 'no page errors', errors);
    await ctx.close();
  }

  console.log('== categories listener');
  {
    const { page, ctx } = await L.boot(b, { device: 'iphone', settle: 5000, init });
    ok(await page.evaluate(() => window.__meta) === 1, 'startup applies the categories once (its first snapshot is the same document)', await page.evaluate(() => window.__meta));
    const name = await page.evaluate(async () => {
      const cats = JSON.parse(JSON.stringify(window.__DB['terminology-meta'].categories.categories));
      const c = cats.find(x => x.id === DATA.categories[0].id); c.name = c.name + ' Renamed';
      await db.collection('terminology-meta').doc('categories').set({ categories: cats });
      return c.name;
    });
    await page.waitForTimeout(800);
    const seen = await page.evaluate(n => ({ meta: window.__meta, data: DATA.categories.some(c => c.name === n), page: document.body.textContent.includes(n) }), name);
    ok(seen.meta === 2 && seen.data && seen.page, 'a real change still arrives and repaints', seen);
    await ctx.close();
  }

  console.log('== Home measures before its first paint');
  // WebKit only takes the iPhone path: the worker painter (OffscreenCanvas)
  // crashes WebKit's page now and then, which is why the app never picks it
  // there (PETALS_AS_DOM; PLAN Facts, #40). Forcing it in WebKit tested a
  // path no iPhone runs and once took the page down.
  for (const ua of process.env.BROWSER === 'webkit' ? ['iPhone petals'] : ['iPhone petals', 'worker petals']) {
    const { page, ctx } = await L.boot(b, { device: 'iphone', settle: 5000, init: ua === 'iPhone petals' ? 'window.__petalsDom = true;' : 'window.__petalsDom = false;' });
    await L.go(page, 'all', 600);
    const r = await page.evaluate(() => new Promise(res => {
      window.scrollTo(0, 0);
      setCategory('home');
      // Registered after the app's own: runs after them, in the same frame, before it paints.
      requestAnimationFrame(() => {
        const c = document.getElementById('content'), hl = c.querySelector('.home-heartline'), dots = [...c.querySelectorAll('.home-rail-dots')];
        res({ petals: !!c.querySelector('.home-greeting .home-petals'), heartline: !!(hl && hl.style.left && hl.style.width),
          dots: dots.length && dots.every(d => d.children.length === 0 || d.querySelector('.is-current')), card: !document.querySelector('#smileyCareer.smw-dark') || !!document.querySelector('#smileyCareer .smw-petals') });
      });
    }));
    ok(r.petals && r.heartline && r.dots && r.card, `${ua}: petals, heartline, rail dots and the rank card's petals are in place by the first frame`, r);
    ok(!page.__errors.length, `${ua}: no page errors`, page.__errors);
    await ctx.close();
  }
  console.log('== the tab bar lens still glides');
  {
    // dockAfterRender settles the lens's old spot with a style read (no
    // layout now); without it the lens would jump instead of gliding.
    const { page, ctx } = await L.boot(b, { device: 'iphone', settle: 4500 });
    await L.go(page, 'home', 600);
    // the bar tucks itself after 4 s idle; a tap on the capsule then only opens it
    await page.evaluate(() => { if (document.body.classList.contains('dock-mini')) dockOpen(); }); await page.waitForTimeout(700);
    const r = await page.evaluate(() => new Promise(res => {
      const tab = [...document.querySelectorAll('.tabbar-btn')].find(t => /translate/i.test(t.getAttribute('aria-label') || t.textContent));
      tab.click();
      // Right after the click the lens has a running transform transition
      // (without the settle a fresh lens would just sit at the new spot), and
      // it ends there. Not sampled position by position: WebKit's computed
      // style reports a running transform transition's end value (main too).
      const l0 = document.querySelector('.tabbar-lens');
      const started = !!l0 && l0.getAnimations().some(a => a.transitionProperty === 'transform' && a.playState === 'running');
      setTimeout(() => { const l = document.querySelector('.tabbar-lens'), x = l ? Math.round(new DOMMatrix(getComputedStyle(l).transform).m41) : 0;
        res({ lens: !!l, gliding: started && x > 0, cat: activeCategory, end: x }); }, 900);
    }));
    ok(r.cat === 'translate' && r.lens && r.gliding, 'changing tab: the lens starts its transition and ends on the new tab', r);
    await ctx.close();
  }
  await b.close();
})();
