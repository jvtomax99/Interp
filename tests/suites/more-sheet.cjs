/* More, grouped (docs/features/more-sheet.md): Ask the Hub, then Study,
   Doctors, Reference and You; no tab-bar tools and no domain list; every
   tool in getToolTiles() has one place (a new tool in none of them fails
   here); numbers only when they need you; ↗ on websites; the settings
   rows' own sheet with ‹ More; every row takes its own tap. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const O = L.SHOTS + 'more-sheet-';

const read = page => page.evaluate(() => {
  const s = document.querySelector('#moreSheetOverlay .more-sheet');
  const groups = [...s.querySelectorAll('.more-group')].map(g => ({ key: g.dataset.group, head: (g.querySelector('.more-head h4') || {}).textContent || '',
    rows: [...g.querySelectorAll('.more-row')].map(r => r.querySelector('.domain-chip-name').firstChild.textContent.trim()) }));
  const rows = [...s.querySelectorAll('.more-row')];
  const taps = rows.map(r => { r.scrollIntoView({ block: 'center' }); const b = r.getBoundingClientRect();
    const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { n: r.textContent.trim().slice(0, 24), h: Math.round(b.height), mine: !!e && r.contains(e) }; });
  s.scrollTop = 0;
  const pills = Object.fromEntries(rows.filter(r => r.querySelector('.more-pill')).map(r => [r.querySelector('.domain-chip-name').firstChild.textContent.trim(), r.querySelector('.more-pill').textContent]));
  const ext = rows.filter(r => r.querySelector('.more-ext')).map(r => r.getAttribute('aria-label'));
  return { groups, taps, pills, ext, chips: s.querySelectorAll('.domain-chip').length, scrollH: s.scrollHeight, vh: innerHeight,
    wide: document.documentElement.scrollWidth > innerWidth };
});

(async () => {
  const b = await L.chromium.launch();

  for (const [device, dark] of [['iphone', false], ['narrow', true]]) {
    console.log(`== ${device}${dark ? ', dark' : ''}, the owner`);
    const { ctx, page } = await L.boot(b, { device, name: 'Jose Vazquez' });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.evaluate(() => { window.isHubOwner = () => true; window.__opened = []; window.open = u => { window.__opened.push(u); return null; }; openMoreSheet(); });
    await wait(600);
    const r = await read(page);
    ok(JSON.stringify(r.groups.map(g => g.key)) === '["ask","study","doctors","reference","you"]' && JSON.stringify(r.groups.slice(1).map(g => g.head)) === '["Study","Doctors","Reference","You"]',
      'groups in order: Ask the Hub, Study, Doctors, Reference, You', r.groups.map(g => [g.key, g.head]));
    const all = r.groups.flatMap(g => g.rows);
    ok(!all.includes('Translate') && !all.includes('Team Chat') && !all.includes('Doctors'), 'no Translate or Team Chat (tabs) and no Doctors row (the heading\'s Open)', all);
    ok(r.chips === all.length && all.length <= 26 && all.includes('Terminology domains'), 'no domain list: one Terminology domains row', { rows: all.length, chips: r.chips });
    ok(r.groups[4].rows.join() === 'Your account,Notifications,Opening,Voice and mic check,Smoothness meter,Recently deleted,Team access', 'You: the settings, Recently deleted and Team access', r.groups[4].rows);
    ok(r.taps.every(t => t.h >= 44 && t.mine), 'every row 44px or more and takes its own tap', r.taps.filter(t => t.h < 44 || !t.mine));
    ok(!r.wide && r.scrollH < r.vh * 2.4, 'nothing wider than the screen; under two and a half screens long', { scrollH: r.scrollH, vh: r.vh });
    ok(Object.keys(r.pills).length === 0, 'a fresh phone: no numbers (nothing reviewed yet, no events since the first look)', r.pills);
    ok(r.ext.length === 2 && r.ext.every(l => /opens a website$/.test(l)), 'Find a Doctor and MediFind marked ↗, said as opening a website', r.ext);

    // Every tool has a place: a group's row, a tab, or the Doctors heading.
    const drift = await page.evaluate(() => { const placed = new Set([...MORE_GROUPS.flatMap(g => g.ids), ...MORE_ELSEWHERE]);
      return getToolTiles().map(t => t.id).filter(id => !placed.has(id)); });
    ok(drift.length === 0, 'every tool in getToolTiles() is in a More group, a tab or the Doctors heading', drift);
    if (device === 'iphone') await page.screenshot({ path: O + 'top.png' });

    // The numbers, when they need you.
    await page.evaluate(() => { closeMoreSheet(); const ids = allTermsFlat().slice(0, 3).map(t => t.id);
      TERM_REVIEWS[ids[0]] = { box: 1, nextReviewAt: Date.now() - 60e3, reviewCount: 2 };
      TERM_REVIEWS[ids[1]] = { box: 2, nextReviewAt: Date.now() + 864e5, reviewCount: 1 };
      localStorage.setItem('ih_eventsSeenAt', String(Date.now() - 1000));
      CE_EVENTS.push({ id: 'x-new', title: 'New webinar', timestamp: Date.now() }, { id: 'x-old', title: 'Old', timestamp: Date.now() - 864e5 });
      openMoreSheet(); });
    await wait(300);
    const p = (await read(page)).pills;
    ok(p['Term Review'] === '1 due' && p['Training & Events'] === '1 new', 'Term Review counts only reviewed terms due again; Training and Events counts what is new', p);
    await page.evaluate(() => setCategory('events')); await wait(300);
    await page.evaluate(() => openMoreSheet()); await wait(300);
    ok(!(await read(page)).pills['Training & Events'], 'opening Training and Events clears its "new"');

    // Rows go where they say.
    const goes = await page.evaluate(async () => {
      const tap = name => [...document.querySelectorAll('#moreSheetBody .more-row')].find(x => x.querySelector('.domain-chip-name').firstChild.textContent.trim() === name).click();
      const out = {};
      tap('Terminology domains'); out.domains = activeCategory; openMoreSheet();
      tap('Find a Doctor'); out.ext = window.__opened.slice(-1)[0]; out.extShut = !document.getElementById('moreSheetOverlay').classList.contains('show'); openMoreSheet();
      document.querySelector('.more-group[data-group="doctors"] .home-sec-more').click(); out.doctors = activeCategory; openMoreSheet();
      tap('Recently deleted'); out.trash = activeCategory; openMoreSheet();
      tap('Team access'); out.team = activeCategory;
      return out; });
    ok(goes.domains === 'all' && goes.doctors === 'doctors' && goes.trash === 'trash' && goes.team === 'team-access', 'Terminology domains, Doctors\' Open, Recently deleted and Team access go to their screens', goes);
    ok(/hackensackmeridianhealth/.test(goes.ext || '') && goes.extShut, 'Find a Doctor opens the website and closes More', goes);

    // A settings row's own sheet.
    await page.evaluate(() => { goHome(); openMoreSheet(); }); await wait(300);
    await page.evaluate(() => [...document.querySelectorAll('#moreSheetBody .more-row')].find(x => /^Your account/.test(x.textContent.trim())).click()); await wait(500);
    const sub = await page.evaluate(() => { const back = document.querySelector('#moreSubOverlay .more-sub-back'), br = back.getBoundingClientRect();
      const e = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
      return { shown: document.getElementById('moreSubOverlay').classList.contains('show'), card: !!document.querySelector('#moreSubBody #acctCard'),
        backTap: !!e && back.contains(e), backH: Math.round(br.height), moreUnder: document.getElementById('moreSheetOverlay').classList.contains('show') }; });
    ok(sub.shown && sub.card && sub.moreUnder, 'Your account opens its sheet over More, with the account card', sub);
    ok(sub.backTap && sub.backH >= 44, '‹ More takes its own tap, 44px tall', sub);
    if (device === 'iphone') await page.screenshot({ path: O + 'account.png' });
    await page.click('#moreSubOverlay .more-sub-back'); await wait(300);
    const back = await page.evaluate(() => ({ sub: document.getElementById('moreSubOverlay').classList.contains('show'), more: document.getElementById('moreSheetOverlay').classList.contains('show') }));
    ok(!back.sub && back.more, '‹ More goes back to More', back);
    await page.evaluate(() => { moreSubOpen('opening'); }); await wait(300);
    await page.click('#moreSubOverlay .dd-detail-close'); await wait(300);
    const shut = await page.evaluate(() => ({ sub: document.getElementById('moreSubOverlay').classList.contains('show'), more: document.getElementById('moreSheetOverlay').classList.contains('show') }));
    ok(!shut.sub && !shut.more, 'the sheet\'s ✕ closes More too', shut);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== a member: no Team access');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', name: 'Ana Ruiz' });
    await page.evaluate(() => { window.isHubOwner = () => false; openMoreSheet(); }); await wait(400);
    const you = (await read(page)).groups.find(g => g.key === 'you').rows;
    ok(!you.includes('Team access') && you.includes('Recently deleted'), 'Team access only on the owner\'s phone', you);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await ctx.close(); }

  await b.close();
})();
