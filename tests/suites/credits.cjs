/* Idea credits (docs/features/credits.md): a credited screen shows a small tag
   under its title (on that screen only, not its drills); a tap on the tag or a
   double-tap on the title opens the card (name, their words, who credited);
   a single tap does nothing; a member double-tapping a title with no credit
   gets nothing; an owner gets the Give credit sheet, and a save shows the tag
   at once and writes hub-credits/{key}; Edit and Remove; a refused write is
   taken back; the inputs never zoom an iPhone; Escape closes; dark mode and a
   mouse's double-click. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'credits/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const SYLVIA = { 'sound-alikes': { section: 'Sound-Alikes', name: 'Sylvia', role: 'idea',
  words: 'We kept mixing up ileum and ilium on the phone.', by: 'Jose', at: Date.UTC(2026, 10, 5, 15) } };

const go = (page, cat) => page.evaluate(async (cat) => { setCategory(cat); window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 500)); }, cat);
const titleAt = page => page.evaluate(() => { const r = document.querySelector('.credit-title').getBoundingClientRect(); return { x: r.left + Math.min(40, r.width / 2), y: r.top + r.height / 2 }; });
const doubleTap = async (page) => { const p = await titleAt(page); await page.touchscreen.tap(p.x, p.y); await wait(120); await page.touchscreen.tap(p.x, p.y); await wait(350); };
// The team's credits, as the database sends them.
const seed = page => page.evaluate(async (m) => { __DB['hub-credits'] = m; __notify('hub-credits'); await new Promise(r => setTimeout(r, 200)); }, SYLVIA);
const open = page => page.evaluate(() => { const ov = document.getElementById('creditOverlay'); return !!(ov && ov.classList.contains('show')); });

(async () => {
  const b = await L.chromium.launch();

  // ---- A teammate's phone, the credit already saved on it ----
  for (const [device, dark] of [['iphone', false], ['iphone', true], ['narrow', false]]) {
    const tag = device + (dark ? '-dark' : '');
    console.log('== ' + tag);
    const { page } = await L.boot(b, { device, dark });
    await seed(page);
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await go(page, 'soundalikes');

    const t = await page.evaluate(() => {
      const tag = document.querySelector('#content .credit-tag'), head = document.querySelector('#content > .section-head');
      if (!tag) return { none: true };
      const r = tag.getBoundingClientRect(), h = head.getBoundingClientRect();
      const next = tag.nextElementSibling.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + 10, r.top - 4), bot = document.elementFromPoint(r.left + 10, r.bottom + 4);
      return { text: tag.textContent.trim(), afterHead: tag.previousElementSibling === head, below: r.top >= h.bottom - 1, clearsNext: r.bottom <= next.top,
        hit44: (top === tag || tag.contains(top)) && (bot === tag || tag.contains(bot)) && r.height + 12 >= 44, h: r.height,
        color: getComputedStyle(tag).color, bg: getComputedStyle(tag).backgroundColor };
    });
    ok(t.text === "Sylvia's idea", 'tag reads "Sylvia\'s idea"', t);
    ok(t.afterHead && t.below && t.clearsNext, 'tag sits under the title, above the card, overlapping neither', t);
    ok(t.hit44, 'tag takes taps over a 44px height', t);
    await page.screenshot({ path: O + tag + '-tag.png' });

    // A tap on the tag opens the card.
    await page.tap('#content .credit-tag'); await wait(350);
    const card = await page.evaluate(() => {
      const c = document.querySelector('#creditOverlay .credit-card');
      return c && { kicker: c.querySelector('.credit-kicker').textContent, name: c.querySelector('.credit-name').textContent,
        line: c.querySelector('.credit-line').textContent, words: (c.querySelector('.credit-words') || {}).textContent || '',
        meta: (c.querySelector('.credit-meta') || {}).textContent || '', edit: !!c.querySelector('.credit-btn-soft'),
        focus: document.activeElement && document.activeElement.className };
    });
    ok(card && card.kicker === 'The idea behind Sound-Alikes' && card.name === 'Sylvia' && card.line === 'came up with this idea', 'card: kicker, name, line', card);
    ok(card && card.words.includes('ileum and ilium') && /Credited by Jose · Nov 5, 2026/.test(card.meta), 'card: her words, who credited and when', card);
    ok(card && !card.edit, 'a member sees no Edit', card);
    ok(card && /credit-btn-main/.test(card.focus), 'Close has the focus', card);
    await page.screenshot({ path: O + tag + '-card.png' });
    await page.click('#creditOverlay .credit-btn-main'); await wait(250);
    ok(!(await open(page)), 'Close closes it');

    // A double-tap on the title opens it; a single tap doesn't; Escape closes.
    const p = await titleAt(page);
    await page.touchscreen.tap(p.x, p.y); await wait(500);
    ok(!(await open(page)), 'a single tap on the title does nothing');
    await doubleTap(page);
    ok(await open(page), 'a double-tap on the title opens the card');
    await page.keyboard.press('Escape'); await wait(200);
    ok(!(await open(page)), 'Escape closes it');

    // Not on a group's drill (its own title), and nothing on an uncredited screen.
    await page.evaluate(async () => { saStartDrill('same'); await new Promise(r => setTimeout(r, 400)); });
    ok(await page.evaluate(() => !document.querySelector('#content .credit-tag') && /Sound the same/.test(document.querySelector('#content h2').textContent)), 'no tag on a group\'s drill');
    await go(page, 'falsefriends');
    ok(await page.evaluate(() => !document.querySelector('#content .credit-tag')), 'no tag on False Friends');
    await doubleTap(page);
    ok(!(await open(page)), 'a member double-tapping an uncredited title gets nothing');

    // A credit arriving from the team shows at once.
    await page.evaluate(() => { __DB['hub-credits'] = Object.assign({}, __DB['hub-credits'] || {}, { 'false-friends': { section: 'False Friends', name: 'Ana', role: 'content', by: 'Jose', at: 1 } }); __notify('hub-credits'); });
    await wait(300);
    ok(await page.evaluate(() => (document.querySelector('#content .credit-tag') || {}).textContent === 'Written by Ana'), 'a credit from the team appears live');
    ok((page.__errors || []).length === 0, 'no page errors', page.__errors);
    await page.context().close();
  }

  // ---- The owner's phone ----
  console.log('== owner (iphone)');
  {
    const { page } = await L.boot(b, { device: 'iphone', name: 'Jose' });
    await page.evaluate(() => { window.isHubOwner = () => true; });
    await go(page, 'falsefriends');
    await doubleTap(page);
    const sheet = await page.evaluate(() => {
      const s = document.querySelector('#creditOverlay .credit-sheet');
      return s && { h: s.querySelector('h3').textContent, lede: s.querySelector('.credit-lede').textContent, remove: !!s.querySelector('.credit-btn-danger'),
        focus: document.activeElement && document.activeElement.id,
        fonts: [...s.querySelectorAll('input[type=text], textarea')].map(e => parseFloat(getComputedStyle(e).fontSize)) };
    });
    ok(sheet && sheet.h === 'Give credit' && /False Friends/.test(sheet.lede) && !sheet.remove, 'an owner double-tapping an uncredited title gets Give credit', sheet);
    ok(sheet && sheet.fonts.every(f => f >= 16), 'its inputs are 16px or more (no iPhone zoom)', sheet);
    await page.screenshot({ path: O + 'owner-give.png' });
    // An empty name is refused.
    await page.click('#creditOverlay .credit-btn-main'); await wait(200);
    ok(await open(page), 'Save with no name keeps the sheet open');
    await page.fill('#creditName', '  Ana   María ');
    await page.fill('#creditWords', 'Half our near misses are false friends.');
    await page.click('#creditOverlay .credit-chip:nth-child(3) input');
    await page.click('#creditOverlay .credit-btn-main'); await wait(400);
    const saved = await page.evaluate(() => ({ tag: (document.querySelector('#content .credit-tag') || {}).textContent, doc: (__DB['hub-credits'] || {})['false-friends'],
      kept: JSON.parse(localStorage.getItem('ih_credits') || '{}')['false-friends'] }));
    ok(saved.tag === 'Spanish checked by Ana María', 'the tag shows at once', saved);
    ok(saved.doc && saved.doc.name === 'Ana María' && saved.doc.role === 'spanish' && saved.doc.section === 'False Friends' && saved.doc.by === 'Jose' && saved.doc.words && typeof saved.doc.at === 'number', 'written to hub-credits/false-friends', saved);
    ok(saved.doc && Object.keys(saved.doc).every(k => ['section', 'name', 'role', 'words', 'by', 'at'].includes(k)), 'only the fields the rules allow', saved.doc);
    ok(saved.kept && saved.kept.name === 'Ana María', 'kept on the phone for the next open', saved.kept);

    // The card has Edit; Edit has the values and Remove.
    await page.tap('#content .credit-tag'); await wait(300);
    ok(await page.evaluate(() => !!document.querySelector('#creditOverlay .credit-card .credit-btn-soft')), 'the owner sees Edit on the card');
    await page.click('#creditOverlay .credit-btn-soft'); await wait(300);
    const ed = await page.evaluate(() => ({ h: document.querySelector('#creditOverlay h3').textContent, name: document.getElementById('creditName').value,
      role: (document.querySelector('#creditOverlay input[name=creditRole]:checked') || {}).value }));
    ok(ed.h === 'Edit credit' && ed.name === 'Ana María' && ed.role === 'spanish', 'Edit opens with what was saved', ed);
    await page.screenshot({ path: O + 'owner-edit.png' });
    await page.click('#creditOverlay .credit-btn-danger'); await wait(400);
    const gone = await page.evaluate(() => ({ tag: !!document.querySelector('#content .credit-tag'), doc: (__DB['hub-credits'] || {})['false-friends'] }));
    ok(!gone.tag && !gone.doc, 'Remove takes the tag and the document away', gone);

    // A glossary domain: double-tap its name on the banner; the credit is the
    // domain's (its id), with the wording for a list of terms, beside "N terms".
    await go(page, 'onco-hematology');
    await doubleTap(page);
    const dsheet = await page.evaluate(() => { const s = document.querySelector('#creditOverlay .credit-sheet');
      return s && { key: s.dataset.key, lede: s.querySelector('.credit-lede').textContent, chips: [...s.querySelectorAll('.credit-chip span')].map(x => x.textContent) }; });
    ok(dsheet && dsheet.key === 'domain-onco-hematology' && /Hematology/.test(dsheet.lede) && /banner/.test(dsheet.lede), 'a domain: double-tap its name for Give credit, keyed by its id', dsheet);
    ok(dsheet && dsheet.chips.join('|') === 'The idea|Added the terms|Checked the Spanish|Reviewed the terms', 'a domain\'s choices read as a list of terms', dsheet);
    await page.fill('#creditName', 'Sylvia');
    await page.click('#creditOverlay .credit-chip:nth-child(2) input');
    await page.click('#creditOverlay .credit-btn-main'); await wait(400);
    const dtag = await page.evaluate(() => { const t = document.querySelector('.domain-banner .credit-tag'), m = document.querySelector('.domain-banner-meta'), ban = document.querySelector('.domain-banner');
      if (!t) return null; const r = t.getBoundingClientRect(), mr = m.getBoundingClientRect(), br = ban.getBoundingClientRect();
      return { text: t.textContent, below: r.top >= mr.bottom - 1, left: Math.abs(r.left - mr.left) < 2, inside: r.right <= br.right && r.bottom <= br.bottom,
        doc: (__DB['hub-credits'] || {})['domain-onco-hematology'] }; });
    ok(dtag && dtag.text === 'Terms by Sylvia' && dtag.doc && dtag.doc.role === 'content' && dtag.doc.section === 'Hematology', 'the tag "Terms by Sylvia" on the banner, saved for the domain', dtag);
    ok(dtag && dtag.below && dtag.left && dtag.inside, 'the tag sits under "N terms", lined up, inside the banner', dtag);
    await page.screenshot({ path: O + 'domain-tag.png' });
    await page.tap('.domain-banner .credit-tag'); await wait(300);
    const dcard = await page.evaluate(() => { const c = document.querySelector('#creditOverlay .credit-card'); return c && [c.querySelector('.credit-kicker').textContent, c.querySelector('.credit-line').textContent]; });
    ok(dcard && dcard[0] === 'Behind Hematology' && dcard[1] === 'put these terms together', 'the domain\'s card', dcard);
    await page.keyboard.press('Escape'); await wait(200);
    await go(page, 'onco');
    ok(await page.evaluate(() => !document.querySelector('.credit-tag')), 'not on the parent domain');
    await go(page, 'soundalikes');
    ok(await page.evaluate(() => !document.querySelector('.credit-tag')), 'not on a tool screen');
    await go(page, 'onco-hematology');
    ok(await page.evaluate(() => (document.querySelector('.domain-banner .credit-tag') || {}).textContent === 'Terms by Sylvia'), 'back on the domain, the tag is there');
    await page.evaluate(() => { const c = DATA.categories.find(x => x.id === 'onco-hematology'); c.name = 'Blood'; render(); });
    await wait(300);
    ok(await page.evaluate(() => (document.querySelector('.domain-banner .credit-tag') || {}).textContent === 'Terms by Sylvia'), 'a renamed domain keeps its credit');

    // A refused write is taken back.
    await go(page, 'falsefriends');
    await page.evaluate(() => { const real = db.collection.bind(db);
      db.collection = c => c === 'hub-credits' ? { doc: () => ({ set: () => Promise.reject(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' })) }), onSnapshot: () => () => {} } : real(c); });
    await doubleTap(page);
    await page.fill('#creditName', 'Luis'); await page.click('#creditOverlay .credit-btn-main'); await wait(500);
    const back = await page.evaluate(() => ({ tag: !!document.querySelector('#content .credit-tag'), toast: (document.querySelector('.toast') || {}).textContent || '' }));
    ok(!back.tag && /not saved/.test(back.toast), 'a refused save is taken back, with a toast', back);
    ok((page.__errors || []).length === 0, 'no page errors', page.__errors);
    await page.context().close();
  }

  // ---- A computer: the mouse's double-click ----
  console.log('== desktop');
  {
    const { page } = await L.boot(b, { device: 'desktop' });
    await seed(page);
    await go(page, 'soundalikes');
    await page.dblclick('#content .credit-title'); await wait(300);
    ok(await open(page), 'a double-click on the title opens the card');
    await page.screenshot({ path: O + 'desktop-card.png' });
    await page.mouse.click(5, 450); await wait(250);
    ok(!(await open(page)), 'a click outside closes it');
    ok((page.__errors || []).length === 0, 'no page errors', page.__errors);
    await page.context().close();
  }
  await b.close();
})();
