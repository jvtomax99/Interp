/* Glossary taps (S4): a domain opens laying out only the cards near the screen
   (content-visibility on .card[data-term-id]); every other card keeps a guessed
   height until it is drawn. The checks, on 150-term domains (real sizes):
   opening fresh skips the far cards; the screen looks the same pixel for pixel
   as with every card laid out, all the way down; where a guess could move what
   you read (#content.cv-all) it never does: Back lands on the same card, a jump
   to one term centres it, a redraw while scrolled down leaves the card under
   your thumb where it was. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'glossary-cv/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// every domain padded to 150 terms, as on the real glossary
L.SEED.forEach(c => { const t = c.terms || []; if (!t.length) return; const n = t.length;
  for (let i = n; i < 150; i++) { const x = t[i % n]; t.push({ ...x, id: x.id + '-cv' + i, en: x.en + ' ' + i }); } });

(async () => {
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    console.log('== ' + device);
    const { ctx, page } = await L.boot(b, { device });
    await page.waitForTimeout(2500);
    const dom = await page.evaluate(() => { const c = DATA.categories.find(c => !c.parentId && (c.terms || []).length >= 150 && !DATA.categories.some(k => k.parentId === c.id)); return c && c.id; });
    // a real tap on Home's first domain tile, then the 150-term domain
    const tile = page.locator('#content .home-tile, #content .domain-family').first(); await (device === 'desktop' ? tile.click() : tile.tap()); await wait(900);
    await page.evaluate(id => setCategory(id), dom); await wait(1200);
    const fresh = await page.evaluate(() => { const c = document.getElementById('content'), cards = [...c.querySelectorAll('.card[data-term-id]')];
      const skipped = cards.filter(k => ![...k.children].some(ch => ch.checkVisibility({ contentVisibilityAuto: true })));
      return { cards: cards.length, skipped: skipped.length, cvAll: c.classList.contains('cv-all'), cv: getComputedStyle(cards[0]).contentVisibility, y: scrollY,
        firstSkippedTop: skipped[0] ? Math.round(skipped[0].getBoundingClientRect().top) : null, vh: innerHeight };
    });
    ok(fresh.cards === 120 && !fresh.cvAll && fresh.cv === 'auto' && fresh.y === 0, 'a fresh domain draws its first 120 cards with off-screen layout skipped', fresh);
    ok(fresh.skipped > 90 && fresh.firstSkippedTop > fresh.vh, 'the cards far below the screen are skipped, none on it', fresh);

    // pixel for pixel the same as with every card laid out, screen after screen
    // the same screen, element for element: every box on it at the same place and size (to 0.05 px) with
    // off-screen layout skipped as with every card laid out. (Pixels differ only by one device pixel of
    // text snapping on some lines: paint containment rounds a card's paint offset.)
    const scrollDown = y => page.evaluate(async y => { while (scrollY < y - 1) { const before = scrollY; window.scrollTo(0, Math.min(y, scrollY + innerHeight / 2)); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); if (scrollY === before) break; } }, y);
    // boxes wholly on screen (the list's own box runs on below, over cards still at their guessed height)
    const boxes = () => page.evaluate(() => { const out = [];
      document.querySelectorAll('#content *').forEach(el => { const r = el.getBoundingClientRect(); if (!r.width || r.top < 0 || r.bottom > innerHeight) return; out.push([r.left, r.top, r.width, r.height]); });
      return { y: scrollY, out }; });
    const off = '#content .card[data-term-id]{ content-visibility:visible !important }';
    const moved = [];
    for (const y of [0, 1500, 4000, 9000]) {
      await scrollDown(y); await wait(400);
      const a = await boxes(); const h = await page.addStyleTag({ content: off }); await wait(200); const c = await boxes(); await h.evaluate(el => el.remove()); await wait(150);
      let worst = a.out.length === c.out.length ? 0 : 999;
      if (!worst) a.out.forEach((r, i) => r.forEach((v, k) => { worst = Math.max(worst, Math.abs(v - c.out[i][k])); }));
      moved.push([y, Math.round(a.y), a.out.length, +worst.toFixed(3)]);
    }
    ok(moved.every(([, , n, w]) => n > 20 && w <= 0.05), 'scrolled down the whole list, every box on screen sits where it would with every card laid out (to 0.05 px)', moved);
    if (device === 'iphone') await page.screenshot({ path: O + 'phone-4000.png' });

    // in place: a redraw while scrolled down keeps the card under your thumb where it was
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(200); await scrollDown(5200); await wait(500);
    // the first card whose bottom is past 320 px: the one you are reading
    const probe = () => page.evaluate(() => { const k = [...document.querySelectorAll('#content .card[data-term-id]')].find(k => k.getBoundingClientRect().bottom > 320);
      return k ? { id: k.dataset.termId, top: Math.round(k.getBoundingClientRect().top), y: Math.round(scrollY) } : null; });
    const before = await probe();
    await page.evaluate(() => renderContent()); await wait(400);
    const after = await probe();
    ok(before && after && before.id === after.id && Math.abs(before.top - after.top) <= 1 && after.y === before.y, 'a redraw while scrolled down moves nothing', { before, after });

    // Back lands on the same card
    await scrollDown(6100); await wait(500);
    const left = await probe();
    await page.evaluate(() => setCategory('home')); await wait(900);
    await page.evaluate(() => navigateBack()); await wait(900);
    const back = await probe();
    ok(left && back && left.id === back.id && Math.abs(left.top - back.top) <= 1, 'Back returns to the same card at the same height', { left, back });

    // a jump to one far term centres it
    const far = await page.evaluate(id => { const ids = domainRenderOrder(id); return ids[100]; }, dom);
    await page.evaluate(() => setCategory('home')); await wait(900);
    await page.evaluate(([c, t]) => revealTerm(c, t), [dom, far]); await wait(2200);
    const jump = await page.evaluate(t => { const k = document.querySelector(`#content .card[data-term-id="${CSS.escape(t)}"]`), r = k.getBoundingClientRect();
      const top = document.querySelector('.topbar, #topbar, header'); return { mid: Math.round(r.top + r.height / 2), vmid: Math.round(innerHeight / 2), h: Math.round(r.height) }; }, far);
    ok(Math.abs(jump.mid - jump.vmid) <= 30, 'a jump to the 100th term lands it in the middle of the screen', jump);
    await ctx.close();
  }
  await b.close();
})();
