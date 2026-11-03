/* The bold glossary (2026-11-03): each domain opens on a colour hero with
   its pin big, the search floating on its bottom edge as glass and sticking
   under the top bar, ••• reachable; a long name steps down in size so no
   word ever breaks; term cards carry the domain's colour. Phone first. */
const { chromium, boot, go } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(c, m, d) { if (c) { passed++; console.log('  PASS', m); } else { failed++; process.exitCode = 1; console.log('  FAIL', m, d === undefined ? '' : JSON.stringify(d).slice(0, 600)); } }
(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'narrow', 'desktop']) {
      console.log('== ' + device);
      const { ctx, page } = await boot(browser, { device });
      try {
        for (const id of ['genetics', 'gi', 'ent', 'cardiac', 'id', 'all']) {
          await go(page, id, 900);
          const s = await page.evaluate(() => {
            const n = document.querySelector('.domain-banner-name');
            // Each word on one line: a word broken across lines has two line tops.
            const broken = [];
            const text = n.firstChild && n.firstChild.nodeType === 3 ? n.firstChild : null;
            if (text) { let i = 0; for (const w of text.data.split(' ')) { const r = document.createRange(); r.setStart(text, i); r.setEnd(text, i + w.length);
              if (new Set([...r.getClientRects()].map(x => Math.round(x.top))).size > 1) broken.push(w); i += w.length + 1; } }
            const bn = document.querySelector('.domain-banner').getBoundingClientRect(), nr = n.getBoundingClientRect();
            const pin = document.querySelector('.domain-banner-pin').getBoundingClientRect();
            const more = document.querySelector('.domain-banner-more'), mr = more.getBoundingClientRect();
            const hit = document.elementFromPoint(mr.left + mr.width / 2, mr.top + mr.height / 2);
            return { name: n.textContent, broken, overPin: nr.right > pin.left + 4 && nr.top < pin.bottom && nr.bottom > pin.top,
              pinW: Math.round(pin.width), moreHit: !!hit && more.contains(hit), hs: document.documentElement.scrollWidth - innerWidth, inside: nr.right <= bn.right };
          });
          ok(!s.broken.length && !s.overPin && s.inside && s.hs <= 0, `${id}: "${s.name}" fits, no word broken, clear of the pin`, s);
          ok(s.moreHit, `${id}: ••• is on top and tappable`);
        }
        // All domains at rest: one colour tile per top-level domain, no word
        // broken; a tap opens it, Back returns; a search lists terms instead.
        await go(page, 'all', 900);
        const t = await page.evaluate(() => {
          const tiles = [...document.querySelectorAll('#content .dt-tile')];
          const broken = [];
          tiles.forEach(x => { const n = x.querySelector('.dt-tile-name'), txt = n.firstChild; let i = 0;
            for (const w of txt.data.split(' ')) { const r = document.createRange(); r.setStart(txt, i); r.setEnd(txt, i + w.length);
              if (new Set([...r.getClientRects()].map(q => Math.round(q.top))).size > 1) broken.push(w); i += w.length + 1; } });
          const first = tiles[0].getBoundingClientRect(), hit = document.elementFromPoint(first.left + first.width / 2, first.top + first.height / 2);
          return { n: tiles.length, tops: DATA.categories.filter(c => !c.parentId).length, broken, folds: document.querySelectorAll('#content .sec-fold').length,
            hit: !!hit && tiles[0].contains(hit), h: Math.round(first.height) };
        });
        ok(t.n === t.tops && !t.folds && t.h >= 44, 'All domains: one tile per top-level domain', t);
        ok(!t.broken.length, 'All domains: no tile name broken inside a word', t.broken);
        ok(t.hit, 'All domains: the first tile takes its own tap');
        const id = await page.evaluate(() => document.querySelectorAll('#content .dt-tile')[2].id.replace('domain-', ''));
        await page.click('#content .dt-tile >> nth=2'); await page.waitForTimeout(700);
        const opened = await page.evaluate(() => activeCategory);
        await page.evaluate(() => goBack()); await page.waitForTimeout(700);
        const back = await page.evaluate(() => ({ cat: activeCategory, tiles: document.querySelectorAll('#content .dt-tile').length }));
        ok(opened === id && back.cat === 'all' && back.tiles === t.n, 'a tile opens its domain; Back returns to the tiles', { id, opened, back });
        await page.evaluate(() => { searchQuery = 'heart'; renderContent(); }); await page.waitForTimeout(400);
        const sr = await page.evaluate(() => ({ tiles: document.querySelectorAll('#content .dt-tile').length, cards: document.querySelectorAll('#content .card').length }));
        ok(!sr.tiles && sr.cards > 0, 'a search on All domains lists matching terms, not tiles', sr);
        await page.evaluate(() => { searchQuery = ''; renderContent(); });

        await go(page, 'genetics', 900);
        const c = await page.evaluate(() => {
          const card = document.querySelector('#content .card[data-term-id]'), cs = getComputedStyle(card);
          const add = getComputedStyle(document.querySelector('.domain-add'));
          return { bg: cs.backgroundImage, radius: cs.borderTopLeftRadius, addBg: add.backgroundColor, addColor: add.color };
        });
        ok(/radial-gradient/.test(c.bg) && c.radius === '20px', 'term cards carry the domain colour wash', c);
        ok(c.addBg !== 'rgb(255, 255, 255)' && c.addColor === 'rgb(255, 255, 255)', '+ Add is the domain colour, white text', c);
        await page.evaluate(() => scrollTo(0, 700)); await page.waitForTimeout(400);
        const st = await page.evaluate(() => { const d = document.getElementById('domainDock'); const bar = document.querySelector('.topbar-global');
          return { stuck: d.classList.contains('is-stuck'), top: Math.round(d.getBoundingClientRect().top), bar: Math.round(bar.getBoundingClientRect().bottom) }; });
        ok(st.stuck && st.top >= st.bar - 1, 'scrolled: the search sticks just under the top bar', st);
        ok(!page.__errors.length, 'no page errors', page.__errors);
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
