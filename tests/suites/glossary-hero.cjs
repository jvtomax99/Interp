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
