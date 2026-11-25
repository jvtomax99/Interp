/* Three small picks from the consistency pass (Jose, 2026-11-25).
   1. False Friends and Recent Updates no longer show the glossary's search
      bar ("Search terms or Spanish", "+ Add term", "+ New domain"): it
      searched nothing there. The screens that do search keep it.
   2. While a doctor's page is open, the screen behind it (Doctor
      Directory's title, its cards, the tab bar) is taken from the screen
      reader and the Tab key (`inert` on #app): one title, focus inside the
      page; closing gives the screen back and returns focus to the card.
      Other pop-ups leave the screen as it was. */
const { chromium, boot, go } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(c, m, d) { if (c) { passed++; console.log('  PASS', m); } else { failed++; process.exitCode = 1; console.log('  FAIL', m, d === undefined ? '' : JSON.stringify(d).slice(0, 500)); } }
const DOC = { id: 'sp1', name: 'Dr. Ana Ruiz', specialty: 'Cardiology', hospitalLocation: '', locationDetails: '', notes: '', customTerms: [], source: 'manual' };
// Titles a screen reader would still find: visible and not inside an inert part.
const titles = page => page.evaluate(() => [...document.querySelectorAll('h1')]
  .filter(e => e.getClientRects().length && e.checkVisibility({ checkVisibilityCSS: true }) && !e.closest('[inert]'))
  .map(e => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)));
(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'desktop']) {
      console.log('== ' + device);
      const { ctx, page } = await boot(browser, { device });
      try {
        for (const cat of ['falsefriends', 'updates']) {
          await go(page, cat, 700);
          const s = await page.evaluate(() => ({ box: !!document.getElementById('searchInput'), bar: !!document.querySelector('.main > .topbar'),
            add: [...document.querySelectorAll('.main button')].some(b => /\+ (Add term|New domain)/.test(b.textContent)) }));
          ok(!s.box && !s.bar && !s.add, `${cat}: no glossary search bar, no "+ Add term"`, s);
        }
        const ff = await page.evaluate(() => { setCategory('falsefriends'); return [...document.querySelectorAll('#content input')].filter(i => i.getClientRects().length).length; });
        ok(ff >= 1, 'False Friends keeps its own search box', ff);
        for (const cat of ['all', 'directory', 'providers', 'doctor-directory', 'ethics']) {
          await go(page, cat, 700);
          ok(await page.evaluate(() => !!document.getElementById('searchInput')), `${cat}: still has its search box`);
        }

        // The doctor's page.
        await go(page, 'doctor-directory', 700);
        await page.evaluate(d => { const { id, ...rest } = d; if (window.__DB) window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(rest));
          if (!DOCTOR_DIRECTORY.some(x => x.id === id)) DOCTOR_DIRECTORY.push(JSON.parse(JSON.stringify(d))); renderContent(); }, DOC);
        await page.waitForTimeout(400);
        const before = await titles(page);
        ok(before.length === 1 && before[0] === 'Doctor Directory', 'the list alone: one title, Doctor Directory', before);
        const opener = await page.evaluate(() => {
          const card = document.querySelector('.dl-card[data-doc="sp1"]');
          const f = card && (card.matches('button,a,[tabindex]') ? card : card.querySelector('button,a,[tabindex]'));
          if (f) f.focus();
          const had = !!f && document.activeElement === f;
          if (f) f.setAttribute('data-sp-opener', '1');
          openDoctorDirDetail('sp1');
          return had;
        });
        ok(opener, 'a control on the doctor\'s card took focus before the page opened');
        await page.waitForTimeout(500);
        const open = await page.evaluate(() => ({ inert: document.getElementById('app').inert,
          inPage: !!document.activeElement.closest('#doctorDirDetailModal'), barInert: !!document.querySelector('.topbar-global').closest('[inert]') }));
        const during = await titles(page);
        ok(open.inert && open.inPage, 'page open: the screen behind is inert and focus is inside the page', open);
        ok(!open.barInert, 'page open: the top bar (Back) is still in reach', open);
        ok(during.length === 1 && /Ruiz/.test(during[0]), `page open: one title, the doctor's ("${during[0]}")`, during);
        // Tab twelve times: focus never leaves the page.
        let escaped = 0;
        for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); if (!await page.evaluate(() => !!document.activeElement.closest('#doctorDirDetailModal'))) escaped++; }
        ok(escaped === 0, 'page open: twelve Tab presses stay inside the page', escaped);
        await page.evaluate(() => closeDoctorDirDetail());
        await page.waitForTimeout(400);
        const shut = await page.evaluate(() => ({ inert: document.getElementById('app').inert, back: !!document.activeElement.closest('[data-sp-opener]') || document.activeElement.hasAttribute('data-sp-opener'),
          openerHere: !!document.querySelector('[data-sp-opener]'), active: document.activeElement.tagName + '.' + document.activeElement.className }));
        ok(!shut.inert, 'page closed: the screen behind is back', shut);
        ok(shut.back || !shut.openerHere, 'page closed: focus is back on the card that opened it', shut);
        const after = await titles(page);
        ok(after.length === 1 && after[0] === 'Doctor Directory', 'page closed: one title again, Doctor Directory', after);
        // Back (the app's own) closes it the same way.
        await page.evaluate(() => openDoctorDirDetail('sp1')); await page.waitForTimeout(400);
        await page.evaluate(() => document.getElementById('doctorDirDetailOverlay').classList.remove('show')); await page.waitForTimeout(300);
        ok(await page.evaluate(() => !document.getElementById('app').inert), 'closed by losing .show (Back, Escape): the screen behind is back');
        // Another pop-up does not touch it.
        await page.evaluate(() => openOutboxSheet()); await page.waitForTimeout(300);
        ok(await page.evaluate(() => !document.getElementById('app').inert), 'another pop-up (unsent changes) leaves the screen as it was');
        await page.evaluate(() => closeOutboxSheet());
        ok(!page.__errors.length, 'no page errors', page.__errors);
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
