const { chromium, boot, go } = require('../support/harness.cjs');
const O = require('../support/harness.cjs').OUT + 'guide/'; require('fs').mkdirSync(O, { recursive: true });
let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) { pass++; console.log('  PASS', m); } else { fail++; process.exitCode = 1; console.log('  FAIL', m, x !== undefined ? JSON.stringify(x).slice(0, 500) : ''); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const coachState = p => p.evaluate(() => { const c = document.querySelector('.gd-coach'); if (!c) return null;
  const s = c.querySelector('.gd-spot'); const r = s.getBoundingClientRect(); return { free: c.classList.contains('is-free'), spot: s.hidden ? null : [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], text: c.querySelector('p').textContent, faces: c.querySelectorAll('.ask-face').length }; });

(async () => {
  const b = await chromium.launch();
  console.log('== phone');
  const { ctx, page } = await boot(b, { device: 'iphone' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://interp.test' });
  await go(page, 'userguide', 1200);
  ok(page.__errors.length === 0, 'guide renders with no errors', page.__errors);

  const data = await page.evaluate(() => ({
    n: GUIDE_TOPICS.length,
    showMissing: Object.entries(GUIDE_SHOW).filter(([t, k]) => !GUIDE_COACH[k] || !GUIDE_TOPICS.some(x => x.id === t)).map(x => x[0]),
    stepsMissing: Object.keys(GUIDE_STEPS).filter(id => !GUIDE_TOPICS.some(t => t.id === id)),
    newsMissing: GUIDE_NEWS.filter(n => !GUIDE_TOPICS.some(t => t.id === n.id)).map(n => n.id),
    pins: Object.values(GUIDE_SECTION_PINS),
  }));
  ok(data.n === 55 && !data.showMissing.length && !data.stepsMissing.length && !data.newsMissing.length, 'every Show me, step list and news card points at a real answer', data);
  const broken = await page.evaluate(async pins => { const bad = []; for (const p of pins) { const i = new Image(); i.src = p; try { await i.decode(); } catch (e) { bad.push(p); } } return bad; }, data.pins);
  ok(!broken.length, 'all tile pictures load', broken);

  // front page structure
  const front = await page.evaluate(() => ({
    first: document.querySelector('#guideList').firstElementChild.textContent.trim(),
    searchTop: Math.round(document.getElementById('guideSearchInput').getBoundingClientRect().top),
    tiles: document.querySelectorAll('.gd-tile').length, news: document.querySelectorAll('.gd-news-card').length,
    week: !!document.querySelector('.gd-week'), install: !!document.querySelector('.gd-install') }));
  ok(front.searchTop < 300 && front.tiles === 10 && front.news === 3 && front.week && front.install, 'search sits near the top; 10 tiles, 3 new cards, first week, one-line install', front);

  // targets and taps on the front page
  const taps = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('#userGuideRoot button')) {
      const r = el.getBoundingClientRect(); if (!r.width) continue;
      if (r.height < 40 || r.width < 40) bad.push(el.className + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    return bad;
  });
  ok(!taps.length, 'every button on the guide is at least 40px (most 44+)', taps);
  const hs = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  ok(hs <= 0, 'no sideways scroll', hs);

  // one Dr. Smiley at a time
  const one = await page.evaluate(() => ({ dock: document.body.classList.contains('dock-has-smiley'), face: getComputedStyle(document.querySelector('.gd-face')).visibility }));
  ok(!one.dock && one.face === 'visible', 'on the guide, Dr. Smiley is in the search box and the dock steps away', one);

  // tiles open in place, All topics returns
  for (const sid of ['ask', 'trouble']) {
    await page.evaluate(id => openGuideSection(id), sid); await wait(250);
    const s = await page.evaluate(() => ({ title: document.querySelector('.gd-sec-title h3')?.textContent, rows: document.querySelectorAll('.gd-row').length, cat: activeCategory, stack: navStack.length }));
    const want = await page.evaluate(id => GUIDE_TOPICS.filter(t => t.section === id).length, sid);
    ok(s.rows === want && s.cat === 'userguide', `tile "${s.title}" lists its ${want} answers in place`, s);
  }
  await page.click('.gd-all'); await wait(250);
  ok(await page.evaluate(() => document.querySelectorAll('.gd-tile').length === 10), '"All topics" goes back to the tiles');

  // every answer opens in the sheet; Back closes it
  const sheetProbs = [];
  for (const id of await page.evaluate(() => GUIDE_TOPICS.map(t => t.id))) {
    await page.evaluate(id => openGuideTopic(id), id); await wait(60);
    const m = await page.evaluate(id => {
      const ov = document.getElementById('guideSheet'), sh = ov && ov.querySelector('.gd-sheet');
      if (!ov || !ov.classList.contains('show') || !sh) return { id, err: 'no sheet' };
      const body = sh.querySelector('.gd-body'), r = sh.getBoundingClientRect();
      const btns = [...sh.querySelectorAll('button')].filter(x => x.getBoundingClientRect().width).map(x => Math.round(x.getBoundingClientRect().height));
      return { id, title: sh.querySelector('h2').textContent.length, text: body.innerText.trim().length, show: !!sh.querySelector('.gd-show') === !!GUIDE_SHOW[id],
        fits: r.bottom <= innerHeight + 1 && r.top >= 0, small: btns.filter(h => h < 40), hs: body.scrollWidth - body.clientWidth };
    }, id);
    if (m.err || !m.title || m.text < 20 || !m.show || !m.fits || m.small.length || m.hs > 0) sheetProbs.push(m);
    await page.evaluate(() => navigateBack(false)); await wait(30);
    if (await page.evaluate(() => document.getElementById('guideSheet').classList.contains('show') || activeCategory !== 'userguide')) sheetProbs.push({ id, err: 'Back did not just close the sheet' });
  }
  ok(!sheetProbs.length, 'all 53 answers open in a sheet that fits, has text, the right Show me, 40px+ buttons; Back closes it and stays on the guide', sheetProbs);

  // visual steps show the real controls
  await page.evaluate(() => openGuideTopic('edit')); await wait(300);
  const st = await page.evaluate(() => ({ steps: document.querySelectorAll('#guideSheet .gd-steps li').length, dots: !!document.querySelector('#guideSheet .gd-ui-dots'), menu: document.querySelector('#guideSheet .gd-ui-menu')?.textContent }));
  ok(st.steps === 3 && st.dots && st.menu === 'Edit term', 'Fixing a word: 3 steps with copies of ⋯ and "Edit term"', st);
  await page.screenshot({ path: O + 't-sheet-edit.png' });

  // copy link
  await page.click('#guideSheet .gd-link'); await wait(300);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(e => 'ERR ' + e.message));
  ok(clip === 'https://interp.test/?guide=edit', 'Copy link puts a link to this answer on the clipboard', clip);
  await page.evaluate(() => smSheetClose('guideSheet')); await wait(200);

  // search
  const search = async q => { await page.fill('#guideSearchInput', q); await wait(320); return page.evaluate(() => [...document.querySelectorAll('#guideList .gd-row')].map(x => x.id.replace('guide-topic-', ''))); };
  const cases = { 'name': 'name', 'remember': 'askremember', 'blurred': 'slang', 'didnt sync': 'unsent', 'calm': 'askmoves', 'covering oncology': 'briefing', 'embarazada': 'falsefriends', 'medula': 'accents', 'pin important': 'pin' };
  const miss = [];
  for (const [q, id] of Object.entries(cases)) { const r = await search(q); if (!r.includes(id)) miss.push(q + '→' + id + ' got ' + r.join(',')); }
  ok(!miss.length, 'search finds answers by everyday words, all words required', miss);
  const firstForName = (await search('name'))[0];
  ok(firstForName === 'name', 'a word in the question ranks it first ("name" → How do I put my name…)', firstForName);
  const askRow = await page.evaluate(() => document.querySelector('.gd-ask em')?.textContent);
  ok(askRow === '“name”', 'the last row asks Dr. Smiley the same words', askRow);
  const marked = await page.evaluate(() => document.querySelector('#guide-topic-name mark')?.textContent);
  ok(marked === 'name', 'the typed word is marked in the question', marked);
  await page.screenshot({ path: O + 't-search.png' });

  // Enter: best answer opens
  await page.fill('#guideSearchInput', 'offline'); await page.press('#guideSearchInput', 'Enter'); await wait(400);
  const ent = await page.evaluate(() => document.querySelector('#guideSheet.show h2')?.textContent);
  ok(/Offline|signal/.test(ent || ''), 'Enter opens the best answer', ent);
  await page.evaluate(() => smSheetClose('guideSheet'));

  // Ask row: real question goes to Ask; patient details stop for the warning
  await page.fill('#guideSearchInput', 'how do I explain triage'); await wait(300);
  await page.click('.gd-ask'); await wait(700);
  const asked = await page.evaluate(() => ({ cat: activeCategory, q: ASK.turns.length ? ASK.turns[ASK.turns.length - 1].q || ASK.turns[ASK.turns.length - 1].question : null, n: ASK.turns.length }));
  ok(asked.cat === 'ask' && asked.n >= 1, 'Ask Dr. Smiley row opens Ask with the question sent', asked);
  await page.evaluate(() => navigateBack(false)); await wait(500);
  ok(await page.evaluate(() => activeCategory) === 'userguide', 'Back from Ask returns to the guide');
  await page.fill('#guideSearchInput', 'patient John Smith DOB 3/4/1950 needs'); await wait(300);
  const before = await page.evaluate(() => ASK.turns.length);
  await page.click('.gd-ask'); await wait(500);
  const phi = await page.evaluate(() => ({ phi: ASK.phi, n: ASK.turns.length }));
  ok(phi.phi && phi.n === before, 'patient details from the guide box stop at the warning; nothing sent', phi);
  await page.evaluate(() => { ASK.phi = null; }); await go(page, 'userguide', 800);

  // Show me on every target (phone)
  const coachProbs = [];
  for (const key of ['name', 'bell', 'tabs', 'search', 'chat', 'dock', 'brief', 'dots']) {
    await go(page, 'userguide', 600);
    await page.evaluate(k => guideShowMe(k), key); await wait(key === 'dots' ? 1500 : 1500);
    const c = await coachState(page);
    const extra = await page.evaluate(() => ({ dock: document.body.classList.contains('dock-has-smiley'), face: document.querySelector('.gd-face') ? getComputedStyle(document.querySelector('.gd-face')).visibility : 'none' }));
    if (!c || c.free || !c.spot || c.spot[2] < 20) coachProbs.push({ key, c });
    if ((key === 'dock' || key === 'brief') && (!extra.dock || c.faces !== 0)) coachProbs.push({ key, extra, faces: c && c.faces, why: 'dock must be shown and the tip faceless' });
    if (key === 'name' || key === 'dots') await page.screenshot({ path: O + `t-show-${key}.png` });
    await page.keyboard.press('Escape'); await wait(150);
    if (await page.evaluate(() => !!document.querySelector('.gd-coach') || document.body.classList.contains('gd-coaching'))) coachProbs.push({ key, err: 'Escape did not close' });
  }
  ok(!coachProbs.length, 'Show me lights the real control for all 8 targets on a phone; for the dock he steps in and the tip has no second face; Escape closes', coachProbs);
  ok(await page.evaluate(() => activeCategory !== 'userguide'), 'Show me on ⋯ opened a real domain');
  await page.evaluate(() => navigateBack(false)); await wait(600);
  ok(await page.evaluate(() => activeCategory) === 'userguide', 'Back from that domain returns to the guide');

  // Try it does the real thing; Back closes the coach first
  await page.evaluate(() => guideShowMe('name')); await wait(800);
  await page.click('.gd-tip-do'); await wait(500);
  ok(await page.evaluate(() => document.getElementById('nameOverlay').classList.contains('show') && !document.querySelector('.gd-coach')), 'Try it opens the real name screen');
  await page.evaluate(() => closeNameModal()); await wait(200);
  await page.evaluate(() => guideShowMe('bell')); await wait(800);
  const backed = await page.evaluate(() => { const r = navigateBack(false); return { r, coach: !!document.querySelector('.gd-coach'), cat: activeCategory }; });
  ok(backed.r && !backed.coach && backed.cat === 'userguide', 'Back closes Show me and stays put', backed);
  await wait(300);
  ok(await page.evaluate(() => !document.body.classList.contains('dock-has-smiley')), 'after Show me, the dock steps away again (one Dr. Smiley)');

  // first week: global search marks it
  await page.evaluate(() => { openGlobalSearch(); }); await page.fill('#gsInput', 'hemo'); await wait(500);
  await page.evaluate(() => closeGlobalSearch()); await go(page, 'userguide', 600);
  const wk = await page.evaluate(() => [...document.querySelectorAll('.gd-wk')].map(x => x.classList.contains('is-done')));
  ok(wk[2] === true, 'a search elsewhere ticks "Look up a word"', wk);
  await page.reload({ waitUntil: 'domcontentloaded' }); await wait(4200); await go(page, 'userguide', 800);
  const wk2 = await page.evaluate(() => [...document.querySelectorAll('.gd-wk')].map(x => x.classList.contains('is-done')));
  ok(wk2[2] === true && wk2[3] === true, 'ticks survive a reload (search, and the question asked earlier)', wk2);
  await page.click('.gd-week-hide'); await wait(300);
  ok(await page.evaluate(() => !document.querySelector('.gd-week')), 'the ✕ hides the first-week list');
  await page.reload({ waitUntil: 'domcontentloaded' }); await wait(4200); await go(page, 'userguide', 800);
  ok(await page.evaluate(() => !document.querySelector('.gd-week')), 'and it stays hidden');

  // New badge goes once opened

  ok(page.__errors.length === 0, 'no page errors through the phone run', page.__errors);
  await ctx.close();

  console.log('== new badges');
  { const { ctx: c1, page: p1 } = await boot(b, { device: 'iphone' });
    await go(p1, 'userguide', 900);
    ok(await p1.evaluate(() => document.querySelectorAll('.gd-new').length === 3), 'three "New" badges on a fresh phone');
    await p1.evaluate(() => openGuideTopic(GUIDE_NEWS[0].id)); await wait(200); await p1.evaluate(() => { smSheetClose('guideSheet'); refreshGuideList(); }); await wait(200);
    ok(await p1.evaluate(() => document.querySelectorAll('.gd-new').length === 2), 'opening one removes its badge');
    await c1.close(); }

  console.log('== deep link');
  { const { ctx: c2, page: p2 } = await boot(b, { device: 'iphone', query: '?guide=offline' });
    const dl = await p2.evaluate(() => ({ cat: activeCategory, open: document.querySelector('#guideSheet.show h2')?.textContent, url: location.search }));
    ok(dl.cat === 'userguide' && /signal/.test(dl.open || '') && dl.url === '', 'a ?guide= link opens that answer and cleans the address', dl);
    ok(p2.__errors.length === 0, 'no errors', p2.__errors); await c2.close(); }
  { const { ctx: c3, page: p3 } = await boot(b, { device: 'iphone', query: '?guide=nope' });
    ok(await p3.evaluate(() => activeCategory === 'home' && location.search === ''), 'an unknown ?guide= is ignored'); await c3.close(); }

  console.log('== dark');
  { const { ctx: c4, page: p4 } = await boot(b, { device: 'iphone' });
    await p4.evaluate(() => { if (document.documentElement.getAttribute('data-theme') !== 'dark') toggleTheme(); }); await go(p4, 'userguide', 900);
    const con = await p4.evaluate(() => {
      const lum = c => { let m = c.match(/[\d.]+/g).map(Number); if (/^color\(srgb/.test(c)) m = m.map(x => x * 255); const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
      const cr = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2); };
      const bg = getComputedStyle(document.querySelector('.gd-rows')).backgroundColor;
      const tiles = [...document.querySelectorAll('.gd-tile small')].map(s => cr(getComputedStyle(s).color, getComputedStyle(document.body).backgroundColor === 'rgba(0, 0, 0, 0)' ? bg : bg));
      const row = cr(getComputedStyle(document.querySelector('.gd-row')).color, bg);
      return { tiles: Math.min(...tiles), row };
    });
    await p4.screenshot({ path: O + 't-dark-home.png' });
    await p4.evaluate(() => openGuideTopic('askwhat')); await wait(400);
    const sh = await p4.evaluate(() => { const s = document.querySelector('#guideSheet .gd-sheet'); return { bg: getComputedStyle(s).backgroundColor, h2: getComputedStyle(s.querySelector('h2')).color, sec: getComputedStyle(s.querySelector('.gd-sec')).color }; });
    await p4.screenshot({ path: O + 't-dark-sheet.png' });
    ok(con.tiles >= 4.5 && con.row >= 7, 'dark: tile counts ≥4.5:1, questions readable', con);
    ok(p4.__errors.length === 0, 'dark: no errors', { e: p4.__errors, sh });
    await c4.close(); }

  console.log('== desktop');
  { const { ctx: c5, page: p5 } = await boot(b, { device: 'desktop' });
    await go(p5, 'userguide', 1000);
    await p5.screenshot({ path: O + 't-desktop.png' });
    const probs = [];
    for (const key of ['name', 'bell', 'tabs', 'dock', 'dots', 'search']) {
      await go(p5, 'userguide', 500);
      await p5.evaluate(k => guideShowMe(k), key); await wait(1500);
      const c = await coachState(p5);
      if (!c) probs.push({ key, err: 'no coach' }); else if (c.free) probs.push({ key, c });
      if (key === 'dock') await p5.screenshot({ path: O + 't-desktop-dock.png' });
      await p5.keyboard.press('Escape'); await wait(150);
    }
    ok(!probs.length, 'desktop: Show me finds the name, bell, Home link, search button, top-bar Dr. Smiley and a card', probs);
    const hs2 = await p5.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(hs2 <= 0 && p5.__errors.length === 0, 'desktop: no sideways scroll, no errors', { hs2, e: p5.__errors });
    await c5.close(); }

  console.log('== narrow + reduced motion');
  { const { ctx: c6, page: p6 } = await boot(b, { device: 'narrow', reducedMotion: true });
    await go(p6, 'userguide', 900);
    await p6.evaluate(() => guideShowMe('dock')); await wait(1400);
    const c = await coachState(p6);
    const anim = await p6.evaluate(() => getComputedStyle(document.querySelector('.gd-spot'), '::after').animationName);
    ok(c && !c.free && anim === 'none', '360px phone, reduced motion: Show me works and the ring holds still', { c, anim });
    const hs3 = await p6.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(hs3 <= 0 && p6.__errors.length === 0, '360px: no sideways scroll, no errors', { hs3, e: p6.__errors });
    await c6.close(); }

  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close();
})();
