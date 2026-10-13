/* Repeated tool labels must open the same real screen, and Back must follow
   the route actually taken. The shared fixture keeps Firebase/AI local. */
const fs = require('fs');
const { chromium, boot, go, OUT } = require('../support/harness.cjs');
const O = OUT + 'destination-labels/';
fs.mkdirSync(O, { recursive: true });
let passed = 0, failed = 0;
function ok(condition, message, detail) {
  if (condition) { passed++; console.log('  PASS', message); }
  else { failed++; process.exitCode = 1; console.log('  FAIL', message, detail === undefined ? '' : JSON.stringify(detail).slice(0, 700)); }
}
const pause = (page, ms = 350) => page.waitForTimeout(ms);
const card = (page, name, scope = '#content') => page.locator(`${scope} .qa-card`).filter({ has: page.locator('.qa-title').filter({ hasText: new RegExp('^' + name + '$') }) }).first();
const quick = (page, name) => page.locator('#content .qa-tile').filter({ has: page.locator('.qa-tile-label').filter({ hasText: new RegExp('^' + name + '$') }) }).first();
const navRow = (page, name, desktop) => page.locator(desktop ? '.side-row' : '#moreSheetBody .domain-chip')
  .filter({ has: page.locator(desktop ? '.side-row-name' : '.domain-chip-name').filter({ hasText: new RegExp('^' + name + '$') }) }).first();
async function menu(page, name, desktop) {
  if (!desktop) await openPhoneMenu(page);
  await navRow(page, name, desktop).click();
  await pause(page);
}
async function openPhoneMenu(page) {
  // A preceding card click may have scrolled Home and queued dockTuck.
  // Let that scroll event and the dock's .42s transition finish before
  // deciding whether the visible capsule needs to be expanded.
  await pause(page, 450);
  // The existing dock tucks when scrolling. Tap its capsule to expand it,
  // exactly as a person does, before selecting a nonactive tab.
  if (await page.evaluate(() => document.body.classList.contains('dock-mini'))) {
    await page.locator('.tabbar-btn.is-active, .tabbar:not(:has(.tabbar-btn.is-active)) .tabbar-btn:last-child').click();
    await pause(page, 450);
  }
  // The More fallback may already have opened the sheet if the capsule
  // finished expanding before the click. Its open sheet hides the dock.
  if (!await page.locator('#moreSheetOverlay').evaluate(el => el.classList.contains('show'))) {
    await page.locator('.tabbar-btn[aria-label="More"]').click();
  }
}
async function home(page) {
  await page.evaluate(() => goHome());
  await page.waitForFunction(() => activeCategory === 'home');
  await pause(page, 650);
}
const state = page => page.evaluate(() => ({
  cat: activeCategory, scroll: window.scrollY, query: searchQuery,
  limit: termRenderLimit, input: document.getElementById('searchInput')?.value,
  cards: document.querySelectorAll('#content .card[data-term-id]').length
}));
async function checkResearch(page, label) {
  const actual = await page.evaluate(() => ({ cat: activeCategory, title: document.querySelector('#content h2')?.textContent, input: !!document.getElementById('doctorResearchInput') }));
  ok(actual.cat === 'doctor-research' && actual.title === 'Doctor Prep' && actual.input, label + ' opens the Doctor Prep research form', actual);
}
async function backTo(page, expected, label, native = false) {
  if (native) await page.evaluate(() => history.back());
  else await page.locator('#tgBack').click();
  await pause(page, 850);
  const actual = await state(page);
  ok(actual.cat === expected.cat && Math.abs(actual.scroll - expected.scroll) <= 2,
    label + ' retraces the actual route and restores scroll', { expected, actual });
  return actual;
}
async function clickFrom(page, locator) {
  // Playwright may scroll again between a trial and the real click while
  // Home's existing entry animation settles. Capture the viewport actually
  // left, before the control's onclick runs, independently of navStack.
  await locator.click({ trial: true });
  await page.evaluate(() => {
    window.__destinationOrigin = null;
    const capture = event => {
      if (!event.isTrusted || !event.target.closest('.qa-card, .qa-tile, .gd-show, .gd-tip-do')) return;
      window.__destinationOrigin = {
        cat: activeCategory, scroll: window.scrollY, query: searchQuery,
        limit: termRenderLimit, input: document.getElementById('searchInput')?.value,
        cards: document.querySelectorAll('#content .card[data-term-id]').length
      };
      window.removeEventListener('click', capture, true);
    };
    window.addEventListener('click', capture, true);
  });
  await locator.click();
  return page.evaluate(() => {
    const origin = window.__destinationOrigin;
    delete window.__destinationOrigin;
    if (!origin) throw new Error('The actual entrance click was not captured');
    return origin;
  });
}
async function entrance(page, locator, label) {
  const origin = await clickFrom(page, locator);
  await pause(page);
  await checkResearch(page, label);
  await backTo(page, origin, label + ' Back');
}
async function search(page, query) {
  await page.evaluate(() => openGlobalSearch());
  await page.fill('#gsInput', query);
  await pause(page, 250);
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'desktop']) {
      console.log('== ' + device);
      const desktop = device === 'desktop';
      const { ctx, page } = await boot(browser, { device });
      page.setDefaultTimeout(7000);
      try {
        await home(page);
        await entrance(page, quick(page, 'Doctor Prep'), 'Home quick action');
        await entrance(page, card(page, 'Doctor Prep'), 'Home Doctor Prep card');

        // View all clones the real Home cards, so its copy is an entrance too.
        await page.locator('[data-home-section="doctors"] .home-sec-more').click();
        await entrance(page, card(page, 'Doctor Prep', '#homeSectionGrid'), 'Home Doctors View all card');

        await menu(page, 'Doctor Prep', desktop);
        await checkResearch(page, desktop ? 'Desktop sidebar Doctor Prep' : 'Phone More Doctor Prep');
        await home(page);
        await menu(page, 'Doctors', desktop);
        ok(await page.locator('#content h1').textContent() === 'Doctors', 'Doctors navigation opens the broader Doctors hub');
        await entrance(page, card(page, 'Doctor Prep'), 'Doctors hub Doctor Prep card');

        await home(page);
        const providerHome = card(page, 'Provider Pictures');
        ok(await providerHome.count() === 1, 'Home uses the short Provider Pictures label');
        if (!desktop) await openPhoneMenu(page);
        ok(await navRow(page, 'Provider Pictures', desktop).count() === 1, 'navigation uses Provider Pictures');
        if (!desktop) await page.locator('#moreSheetOverlay .dd-detail-close').click();
        await providerHome.click();
        ok(await page.locator('#content h2').first().textContent() === 'Provider Pictures', 'Provider Pictures page keeps the same label');

        await search(page, 'Provider 0');
        ok((await page.locator('#gsResults .gs-group').allTextContents()).includes('Provider Pictures'), 'provider search result group uses Provider Pictures');
        await page.locator('#gsResults .gs-item').filter({ has: page.locator('.gs-title').filter({ hasText: /^Provider 0$/ }) }).click();
        ok(await page.evaluate(() => activeCategory === 'providers'), 'provider search result opens Provider Pictures');
        const corpus = await page.evaluate(() => askCorpus().filter(d => d.go?.cat === 'providers').map(d => d.label));
        ok(corpus.length > 0 && corpus.every(label => label.startsWith('Provider Pictures · ')), 'Ask source labels identify the same Provider Pictures tool', corpus.slice(0, 3));
        const guide = await page.evaluate(() => ({
          providers: GUIDE_TOPICS.find(t => t.id === 'providers'),
          doctors: GUIDE_TOPICS.find(t => t.id === 'doctors'),
          prep: GUIDE_TOPICS.find(t => t.id === 'docprep'),
          bad: GUIDE_TOPICS.filter(t => /Pictures of Healthcare Providers|Provider Photos/.test(t.q + t.a))
        }));
        ok(guide.providers?.q === 'What is Provider Pictures?' && !guide.bad.length, 'User Guide uses Provider Pictures consistently');
        ok(/broader hub|brings the two doctor tools/.test(guide.doctors?.a || '') && /research screen directly/.test(guide.prep?.a || ''), 'guide distinguishes Doctors from Doctor Prep research');

        // Other confirmed repeated-label mismatch: Home and menu must share
        // the same Find a Doctor destination. Capture navigation, not network.
        await page.evaluate(() => { window.__openedUrls = []; window.open = url => { window.__openedUrls.push(url); return null; }; });
        await home(page);
        await card(page, 'Find a Doctor').click();
        await menu(page, 'Find a Doctor', desktop);
        const opened = await page.evaluate(() => window.__openedUrls);
        ok(opened.length === 2 && opened.every(url => url === 'https://doctors.hackensackmeridianhealth.org/'), 'Find a Doctor has one consistent Home/navigation destination', opened);

        // Focused desktop tools hide the sidebar. Use the real search and
        // Guide controls to revisit Home and research, rather than clicking
        // a menu that does not exist on those screens.
        for (const native of [false, true]) {
          await home(page);
          const homeOrigin = await clickFrom(page, card(page, 'Doctor Prep')); await pause(page);
          const firstResearch = await state(page);
          await search(page, 'Doctor Prep');
          await page.locator('#gsResults .gs-item').filter({
            has: page.locator('.gs-title').filter({ hasText: /^I have an appointment with a doctor/ })
          }).click();
          await pause(page);
          const guideOrigin = await clickFrom(page, page.locator('#guideSheet .gd-show'));
          await pause(page, 1100);
          const homeCue = await clickFrom(page, page.locator('.gd-tip-do')); await pause(page);
          ok(homeCue.cat === 'home', 'Doctor Prep Show me revisits Home through the real Guide control');
          await checkResearch(page, 'Guide Try it after revisiting Home');
          const how = native ? 'Browser Back' : 'In-app Back';
          await backTo(page, homeCue, how + ' after revisiting Doctor Prep', native);
          await backTo(page, guideOrigin, how + ' after revisiting Home', native);
          await backTo(page, firstResearch, how + ' returns to the original research visit', native);
          await backTo(page, homeOrigin, how + ' returns to the Home card', native);
        }

        // User-controlled list state must be restored along with its scroll.
        await home(page);
        // Exercise real pagination with distinct in-memory fixture entries;
        // the bundled glossary alone has fewer than 120 terms.
        await page.evaluate(() => {
          const category = DATA.categories.find(c => c.id === 'genetics');
          category.terms.push(...Array.from({ length: 200 }, (_, i) => ({
            id: 'destination-fixture-' + i, en: 'Example glossary entry ' + String(i).padStart(3, '0'),
            es: 'Ejemplo de glosario ' + i, def: 'In-memory pagination fixture.'
          })));
        });
        await go(page, 'genetics');
        const more = page.getByRole('button', { name: /^Show \d+ more/ });
        ok(await more.count() > 0, 'distinct fixture glossary entries render across multiple pages');
        await more.click(); await pause(page);
        await page.fill('#searchInput', 'e'); await pause(page, 250);
        // Leave the text field before using navigation; the phone hides its
        // dock while the keyboard is open.
        await page.keyboard.press('Tab'); await pause(page, 250);
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
        const filtered = await state(page);
        ok(filtered.limit > 120 && filtered.cards > 120, 'the working view retains an expanded filtered glossary');
        if (desktop) {
          // A focused desktop glossary has no sidebar. Leave through its
          // real global search, then close the answer sheet before Back.
          await search(page, 'Doctor Prep');
          await page.locator('#gsResults .gs-item').filter({
            has: page.locator('.gs-title').filter({ hasText: /^I have an appointment with a doctor/ })
          }).click();
          await pause(page);
          await page.locator('#guideSheet .gd-x').click();
          ok(await page.evaluate(() => activeCategory === 'userguide'), 'global search opens the Doctor Prep guide from a filtered glossary');
        } else {
          await menu(page, 'Doctor Prep', false);
          await checkResearch(page, 'Doctor Prep from a filtered glossary');
        }
        const restored = await backTo(page, filtered, 'Back to filtered glossary');
        ok(restored.query === filtered.query && restored.input === filtered.input && restored.limit === filtered.limit && restored.cards === filtered.cards,
          'Back restores the actual glossary filter, rendered limit and visible cards', { filtered, restored });

        // Appointment briefing remains a specialty choice, not doctor research.
        await go(page, 'ask');
        await page.getByRole('button', { name: 'Prep me for an appointment', exact: true }).click();
        ok(await page.locator('#prepOverlay.show #prepTitle').textContent() === 'Where are you heading?', 'appointment briefing keeps its separate specialty picker');
        await page.locator('#prepOverlay .prep-dom[data-id="onco"]').click();
        await page.locator('#prepGo').click(); await pause(page);
        ok(await page.evaluate(() => activeCategory === 'prep' && PREP.domainId === 'onco') && await page.locator('#doctorResearchInput').count() === 0,
          'specialty selection opens the Oncology briefing instead of Doctor Prep');

        // Guide Show me must point to a visible real control, and Try it must
        // perform exactly the action described by that control.
        for (const [topic, destination] of [['docprep', 'doctor-research'], ['directory', 'doctor-directory'], ['providers', 'providers'], ['doctors', 'doctors']]) {
          await go(page, 'userguide');
          await page.evaluate(id => openGuideTopic(id), topic);
          const steps = await page.locator('#guideSheet .gd-steps li').count();
          ok(steps >= 2, topic + ' has illustrated steps for its actual controls');
          await page.locator('#guideSheet .gd-show').click(); await pause(page, 1100);
          const spot = await page.evaluate(key => {
            const coach = document.querySelector('.gd-coach'), s = coach?.querySelector('.gd-spot');
            if (!s || s.hidden) return null;
            const r = s.getBoundingClientRect(), target = guideCoachTarget(GUIDE_COACH[key])?.el;
            const tr = target?.getBoundingClientRect();
            return { free: coach.classList.contains('is-free'), top: r.top, bottom: r.bottom, width: r.width, height: r.height, viewport: innerHeight,
              targetVisible: !!tr && tr.top >= 0 && tr.bottom <= innerHeight && tr.left >= 0 && tr.right <= innerWidth };
          }, topic);
          ok(spot && !spot.free && spot.targetVisible && spot.width > 20 && spot.height > 20 && spot.top >= -6 && spot.bottom <= spot.viewport + 6,
            topic + ' Show me highlights an on-screen control', spot);
          await page.locator('.gd-tip-do').click(); await pause(page);
          if (topic === 'doctors' && !desktop) {
            ok(await page.locator('#moreSheetOverlay').evaluate(el => el.classList.contains('show')), 'phone Doctors Try it opens More as its tip describes');
            await navRow(page, 'Doctors', false).click(); await pause(page);
          }
          ok(await page.evaluate(() => activeCategory) === destination, topic + ' Try it reaches the described destination');
        }
        const toolHits = await page.evaluate(() => collectSearchMatches('Doctor Prep').filter(m => m.title === 'Doctor Prep'));
        if (toolHits.length) ok(toolHits.every(m => m.target === 'doctor-research'), 'any exact Doctor Prep tool search result opens research', toolHits);
        else console.log('  INFO Global search has no exact Doctor Prep tool result; guide answers retain their guide destination.');
        await page.screenshot({ path: O + device + '-final.png' });
        ok(page.__errors.length === 0, device + ' has no page errors through the destination journeys', page.__errors);
      } catch (error) {
        const context = await page.evaluate(() => ({ category: activeCategory,
          body: document.body.className, focus: document.activeElement?.id || document.activeElement?.tagName,
          moreOpen: document.getElementById('moreSheetOverlay')?.classList.contains('show') }));
        ok(false, device + ' journey completed', { context, message: error.message });
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})().catch(error => { console.error('FAIL destination-labels suite', error.stack); process.exitCode = 1; });
