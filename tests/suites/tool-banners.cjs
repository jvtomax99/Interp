/* Tool banners (docs/features/tool-banners.md): Translate, Term Review's
   start, Ask the Hub and Doctor Directory open under a colour banner with
   their pin. Each is drawn, its title on one line, nothing spilling sideways,
   at most ~120px on a phone; Doctor Directory's banner sits above its search,
   its count follows a search without the banner being redrawn, and + Add
   (44px, its own tap) opens the sheet; Ask's links live on the banner, his
   face takes the pin's place once a conversation starts; Term Review keeps
   its small title in a session; a credit's tag shows on the banner; the pin
   tapped on Home flies into the banner and leaves nothing behind; no fly
   under reduced motion or from anywhere but Home; Back is unchanged. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'tool-banners/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const SCREENS = { translate: 'Translate', review: 'Term Review', ask: 'Ask the Hub', 'doctor-directory': 'Doctor Directory' };

const banner = page => page.evaluate(() => {
  const t = document.querySelector('.tool-banner');
  if (!t) return null;
  const n = t.querySelector('.tool-banner-name'), r = t.getBoundingClientRect(), nr = n.getBoundingClientRect();
  const pin = t.querySelector('.tool-banner-pin img');
  return { name: n.textContent, tool: t.dataset.tool, h: Math.round(r.height), lines: Math.round(nr.height / parseFloat(getComputedStyle(n).lineHeight)),
    nameRight: Math.round(nr.right), pinLeft: Math.round(t.querySelector('.tool-banner-pin').getBoundingClientRect().left),
    meta: t.querySelector('.tool-banner-meta').textContent, inContent: !!t.closest('#content'),
    pinOk: !!pin && pin.complete && pin.naturalWidth > 0, over: document.documentElement.scrollWidth > innerWidth + 1,
    color: getComputedStyle(n).color, smallTitle: !!document.querySelector('#content > .section-head h2') };
});
const owns = (page, sel) => page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { h: Math.round(r.height), own: !!h && (h === el || el.contains(h)) }; }, sel);

(async () => {
  const b = await L.chromium.launch();

  for (const [device, dark] of [['iphone', false], ['narrow', false], ['iphone', true], ['desktop', false]]) {
    const tag = device + (dark ? '-dark' : '');
    console.log('== ' + tag);
    const { ctx, page } = await L.boot(b, { device, dark });
    if (dark) await page.evaluate(() => { if (document.documentElement.getAttribute('data-theme') !== 'dark') toggleTheme(); });
    for (const [cat, name] of Object.entries(SCREENS)) {
      await L.go(page, cat, 1100);
      const s = await banner(page);
      ok(s && s.name === name && s.tool === cat, `${tag} ${cat}: the banner, titled "${name}"`, s);
      if (!s) continue;
      ok(s.lines === 1 && s.nameRight <= s.pinLeft + 1, `${tag} ${cat}: the title on one line, clear of the pin`, s);
      ok(!s.over, `${tag} ${cat}: nothing wider than the screen`, s);
      ok(s.pinOk, `${tag} ${cat}: its pin loaded`, s);
      ok(s.color === 'rgb(255, 255, 255)', `${tag} ${cat}: white title`, s.color);
      ok(!s.smallTitle, `${tag} ${cat}: the old small title gone`, s);
      if (device !== 'desktop') ok(s.h <= 120, `${tag} ${cat}: at most 120px tall (${s.h})`, s);
      if (cat === 'review') ok(s.meta === (await page.evaluate(() => `${dueReviewCount()} due`)), `${tag} review: "N due" on the banner`, s.meta);
      if (cat === 'translate') ok(s.meta === 'Glossary first, then the AI', `${tag} translate: its line`, s.meta);
      if (cat === 'doctor-directory') {
        const n = await page.evaluate(() => DOCTOR_DIRECTORY.length);
        ok(s.meta === `${n} doctors` && !s.inContent, `${tag} doctors: the count on a banner above the search, outside #content`, s);
        const above = await page.evaluate(() => document.querySelector('.tool-banner').getBoundingClientRect().bottom <= document.getElementById('searchInput').getBoundingClientRect().top);
        ok(above, `${tag} doctors: the banner above the search`);
        const add = await owns(page, '.tool-banner .dl-add');
        ok(add && add.h >= 44 && add.own, `${tag} doctors: + Add on the banner, 44px, its own tap`, add);
      }
      if (cat === 'ask') {
        const a = await page.evaluate(() => { const t = document.querySelector('.tool-banner'); return { links: t.querySelectorAll('.ask-mem-link:not([hidden])').length, face: getComputedStyle(t.querySelector('.ask-face')).display, pin: getComputedStyle(t.querySelector('.tool-banner-pin')).display }; });
        ok(a.links === 1 && a.face === 'none' && a.pin !== 'none', `${tag} ask: What I remember on the banner, the pin showing, his face waiting`, a);
        const m = await owns(page, '.tool-banner .ask-mem-link');
        ok(m && m.h >= 44 && m.own, `${tag} ask: What I remember 44px, its own tap`, m);
      }
      if (device === 'iphone') await page.screenshot({ path: `${O}${tag}-${cat}.png` });
    }
    ok(page.__errors.length === 0, `${tag}: no page errors`, page.__errors);
    await ctx.close();
  }

  // ---- Doctor Directory: a search changes the count, not the banner ----
  {
    console.log('== doctors search');
    const { ctx, page } = await L.boot(b, { device: 'iphone' });
    await L.go(page, 'doctor-directory', 1100);
    await page.evaluate(() => { window.__tb = document.querySelector('.tool-banner'); });
    await page.locator('#searchInput').fill('Example 1');
    await wait(600);
    const r = await page.evaluate(() => ({ same: document.querySelector('.tool-banner') === window.__tb, meta: document.getElementById('toolBannerMeta').textContent,
      shown: document.querySelectorAll('#content .dl-card').length, focus: document.activeElement && document.activeElement.id }));
    ok(r.same && r.meta === `${r.shown} doctor${r.shown === 1 ? '' : 's'}` && r.focus === 'searchInput', 'the count follows the search; the banner and the box stay', r);
    await page.locator('.tool-banner .dl-add').click();
    await wait(500);
    ok(await page.evaluate(() => document.getElementById('doctorDirOverlay').classList.contains('show')), '+ Add opens the add sheet');
    await ctx.close();
  }

  // ---- Ask: his face takes the pin's place in a conversation ----
  {
    console.log('== ask conversation');
    const { ctx, page } = await L.boot(b, { device: 'iphone' });
    await L.go(page, 'ask', 1100);
    const h0 = (await banner(page)).h;
    await page.locator('#askInput, .chat-input-row textarea, .chat-input-row input').first().fill('What is ejection fraction?');
    await page.keyboard.press('Enter');
    await wait(2200);
    const a = await page.evaluate(() => { const t = document.querySelector('.tool-banner'); return { h: Math.round(t.getBoundingClientRect().height), face: getComputedStyle(t.querySelector('.ask-face')).display, pin: getComputedStyle(t.querySelector('.tool-banner-pin')).display, newShown: !document.getElementById('askNew').hidden }; });
    ok(a.face !== 'none' && a.pin === 'none' && a.newShown, 'in a conversation: his face in the pin\'s place, New on the banner', a);
    ok(a.h === h0, 'the banner keeps its height when New appears', { before: h0, after: a.h });
    await page.screenshot({ path: `${O}ask-conversation.png` });
    await ctx.close();
  }

  // ---- Term Review keeps its small title in a session ----
  {
    console.log('== review session');
    const { ctx, page } = await L.boot(b, { device: 'iphone' });
    await L.go(page, 'review', 1300);
    await page.evaluate(() => { const btn = [...document.querySelectorAll('#content button')].find(x => /^Start/.test(x.textContent.trim())); btn && btn.click(); });
    await wait(900);
    const r = await page.evaluate(() => ({ active: reviewActive, banner: !!document.querySelector('.tool-banner'), head: document.querySelector('#content > .section-head h2')?.textContent }));
    ok(r.active && !r.banner && r.head === 'Term Review', 'a session: no banner, the small "Term Review" title', r);
    await ctx.close();
  }

  // ---- A credit's tag on the banner ----
  {
    console.log('== credit');
    const { ctx, page } = await L.boot(b, { device: 'iphone' });
    await page.evaluate(async () => { __DB['hub-credits'] = { translate: { section: 'Translate', name: 'Ana', role: 'idea', by: 'Jose', at: Date.UTC(2026, 10, 6) } }; __notify('hub-credits'); await new Promise(r => setTimeout(r, 200)); });
    await L.go(page, 'translate', 1100);
    const c = await page.evaluate(() => { const t = document.querySelector('.tool-banner .credit-tag.on-banner'); return { tag: t && t.textContent.trim(), title: document.querySelector('.tool-banner-name').classList.contains('credit-title') }; });
    ok(c.tag === "Ana's idea" && c.title, 'Translate\'s credit tag on its banner, the title the double-tap target', c);
    await ctx.close();
  }

  // ---- The fly ----
  for (const [label, sel, cat, reduced] of [
    ['quick tile Translate', '#content.is-home .qa-tile[onclick*="translate"]', 'translate', false],
    ['rail card Doctor Directory', '#content.is-home .qa-card[onclick*="doctor-directory"]', 'doctor-directory', false],
    ['reduced motion', '#content.is-home .qa-tile[onclick*="translate"]', 'translate', true],
  ]) {
    console.log('== fly: ' + label);
    const { ctx, page } = await L.boot(b, { device: 'iphone', reducedMotion: reduced });
    await page.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
    await wait(400);
    const box = await page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
    // Sample every frame from the tap: is a copy flying, where is it.
    await page.evaluate(() => { window.__fly = []; const t0 = performance.now(); const tick = () => { const f = document.querySelector('.tb-fly'); window.__fly.push({ t: Math.round(performance.now() - t0), f: !!f, tr: f ? getComputedStyle(f).transform : null, cls: document.documentElement.classList.contains('tb-flying') }); if (performance.now() - t0 < 1500) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    await page.touchscreen.tap(box.x, box.y);
    await wait(1700);
    const f = await page.evaluate(() => { const s = window.__fly; const pin = document.querySelector('.tool-banner .tool-banner-pin img'); return { flying: s.filter(x => x.f).length, moved: new Set(s.filter(x => x.f).map(x => x.tr)).size, first: (s.find(x => x.f) || {}).t, last: (s.filter(x => x.f).pop() || {}).t, after: s.length ? s[s.length - 1] : null, left: document.querySelectorAll('.tb-fly').length, pinOpacity: pin && getComputedStyle(pin).opacity, cat: activeCategory }; });
    ok(f.cat === cat, `${label}: opened ${cat}`, f);
    if (reduced) ok(f.flying === 0 && f.pinOpacity === '1', `${label}: no fly, the pin simply there`, f);
    else {
      ok(f.flying >= 10 && f.moved >= 8 && f.first <= 200 && f.last <= 900, `${label}: the pin flies from Home into the banner (frames ${f.flying}, from ${f.first} to ${f.last} ms)`, f);
      ok(f.left === 0 && !f.after.cls && f.pinOpacity === '1', `${label}: nothing left behind, the banner's own pin showing`, f);
    }
    // Back retraces to Home as before.
    await page.locator('#tgBack').click();
    await wait(800);
    ok(await page.evaluate(() => activeCategory === 'home'), `${label}: Back goes Home`);
    ok(page.__errors.length === 0, `${label}: no page errors`, page.__errors);
    await ctx.close();
  }

  // ---- No fly from anywhere but Home (the tab bar) ----
  {
    console.log('== fly: tab bar');
    const { ctx, page } = await L.boot(b, { device: 'iphone' });
    await page.evaluate(() => { window.__seen = false; new MutationObserver(() => { if (document.querySelector('.tb-fly')) window.__seen = true; }).observe(document.body, { childList: true }); });
    // Tucked on Home, so clicked in place: the fly only ever starts from Home's own tiles and cards.
    await page.evaluate(() => document.querySelector('.tabbar-btn[aria-label="Translate"]').click());
    await wait(1200);
    ok(await page.evaluate(() => activeCategory === 'translate' && !window.__seen && !!document.querySelector('.tool-banner')), 'the tab bar opens Translate under its banner, with no fly');
    await ctx.close();
  }

  await b.close();
})();
