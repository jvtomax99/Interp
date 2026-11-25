/* Check link in the app (features/link-check.js; docs/features/link-check.md):
   the button under "Source link" in Add / Edit term and on each Link
   Directory row, the four answers, offline, the daily limit, the tap
   target, and "Use the new address" (fills the box, saves nothing). The
   server is faked here; its own rules are in link-check.mjs. Phone 393
   and 360 wide, and a computer. */
const { chromium, boot, go } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(c, m, d) { if (c) { passed++; console.log('  PASS', m); } else { failed++; process.exitCode = 1; console.log('  FAIL', m, d === undefined ? '' : JSON.stringify(d).slice(0, 600)); } }
const NOTE = 'This only checks that the page opens, not that it is safe or correct.';
const ANSWERS = {
  'https://opens.example/a': { result: 'opens', reason: '', title: 'Heart Failure <b>&amp;</b> you', newUrl: '' },
  'https://moved.example/old': { result: 'moved', reason: '', title: 'New home', newUrl: 'https://new.example/a/very/long/address/that/has/to/wrap/on/a/small/phone/screen/without/running/off/the/side?x=1' },
  'https://gone.example/x': { result: 'not_found', reason: 'no_page', title: '', newUrl: '' },
  'https://nosite.example/': { result: 'not_found', reason: 'no_site', title: '', newUrl: '' },
  'https://shy.example/': { result: 'unknown', reason: 'refused', title: '', newUrl: '' },
  'https://evil.example/': { result: 'moved', reason: '', title: 'x', newUrl: 'javascript:alert(1)' },
  'https://odd.example/': { result: 'surprise', title: '<img src=x onerror=alert(1)>' },
};
const SHOTS = process.env.LC_SHOTS || '';
(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'narrow', 'desktop']) {
      console.log('== ' + device);
      const { ctx, page } = await boot(browser, { device });
      const calls = []; let mode = 'ok';
      await page.route('**/api/link-check', async r => {
        const body = JSON.parse(r.request().postData() || '{}'); calls.push({ url: body.url, auth: !!r.request().headers().authorization, method: r.request().method() });
        if (mode === '429') return r.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"daily_limit"}' });
        if (mode === '401') return r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"members_only"}' });
        if (mode === '500') return r.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
        if (mode === 'slow') await new Promise(d => setTimeout(d, 700));
        const a = ANSWERS[body.url];
        return a ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(a) }) : r.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"not_web"}' });
      });
      try {
        const phone = device !== 'desktop';
        const out = sel => page.evaluate(s => { const o = document.querySelector(s); if (!o) return null; const b = o.getBoundingClientRect();
          return { hidden: o.hidden, kind: (o.querySelector('.lc-ans') || {}).className || '', text: o.innerText.replace(/\s+/g, ' ').trim(), html: o.innerHTML,
            right: Math.round(b.right), wide: innerWidth, overflow: [...o.querySelectorAll('*')].some(e => e.getBoundingClientRect().right > innerWidth + 0.5), role: o.getAttribute('role') }; }, sel);
        const shot = async name => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/lc-${device}-${name}.png` }); };

        // ---- Add / Edit term ----
        await go(page, 'all', 700);
        await page.evaluate(() => openAddModal());
        await page.waitForTimeout(500);
        const btn = await page.evaluate(() => { const b = document.getElementById('lcFieldBtn'), r = b.getBoundingClientRect(), cs = getComputedStyle(b), box = document.getElementById('fSourceUrl').getBoundingClientRect();
          b.scrollIntoView({ block: 'center' }); const r2 = b.getBoundingClientRect(); const cx = r2.left + r2.width / 2, cy = r2.top + r2.height / 2;
          const hit = [[0, 0], [0, -21], [0, 21], [-21, 0], [21, 0]].map(([dx, dy]) => { const h = document.elementFromPoint(cx + dx, cy + dy); return !!h && (h === b || b.contains(h)); });
          return { text: b.textContent.trim(), h: Math.round(r.height), w: Math.round(r.width), fs: parseFloat(cs.fontSize), below: r.top >= box.bottom, hit, input: parseFloat(getComputedStyle(document.getElementById('fSourceUrl')).fontSize) }; });
        ok(btn.text === 'Check link' && btn.below, 'Add term: a "Check link" button under the Source link box', btn);
        ok(btn.h >= 44 && btn.w >= 44 && btn.fs >= 16 && btn.hit.every(Boolean), `the button is ${btn.w}x${btn.h}, ${btn.fs}px type, and takes a tap across 44px`, btn);
        ok((await out('#lcFieldOut')).hidden, 'no answer shows before a check');

        const check = async (url, wait = 500) => { await page.fill('#fSourceUrl', url); await page.click('#lcFieldBtn'); await page.waitForTimeout(wait); return out('#lcFieldOut'); };
        let o = await check('');
        ok(/no link to check/i.test(o.text) && calls.length === 0, 'an empty box: says so, asks the server nothing', o.text);
        o = await check('mailto:someone@example.org');
        ok(/not a web address/i.test(o.text) && calls.length === 0, 'an email address: says it is not a web address, asks the server nothing', o.text);

        mode = 'slow'; await page.fill('#fSourceUrl', 'https://opens.example/a'); await page.click('#lcFieldBtn'); await page.waitForTimeout(150);
        const busy = await page.evaluate(() => ({ dis: document.getElementById('lcFieldBtn').disabled, text: document.getElementById('lcFieldOut').innerText.trim() }));
        ok(busy.dis && /Checking/.test(busy.text), 'while it runs: "Checking..." and the button waits', busy);
        await page.waitForTimeout(1100); mode = 'ok';
        o = await out('#lcFieldOut');
        ok(/lc-opens/.test(o.kind) && o.text.startsWith('Opens') && o.text.includes(NOTE), 'a page that loads: "Opens", with the standing line', o.text);
        ok(o.text.includes('Heart Failure <b>&amp;</b> you') && !/<b>/.test(o.html.replace(/<b class="lc-head">/, '')), 'the page\'s title is shown as plain text, never as markup', o.html.slice(0, 400));
        ok(calls[0] && calls[0].method === 'POST' && calls[0].url === 'https://opens.example/a', 'the server is asked once, by POST, for that address', calls);
        ok(!(await page.evaluate(() => document.getElementById('lcFieldBtn').disabled)), 'the button is ready again');
        ok(o.role === 'status' && !o.overflow, 'the answer is announced (role=status) and stays inside the screen', o);
        await page.evaluate(() => document.getElementById('lcFieldOut').scrollIntoView({ block: 'center' })); await shot('opens');

        // typing a different address takes the answer away
        await page.type('#fSourceUrl', 'x'); await page.waitForTimeout(100);
        ok((await out('#lcFieldOut')).hidden, 'typing a different address removes the old answer');

        o = await check('opens.example/a');
        ok(/lc-opens/.test(o.kind) && calls[calls.length - 1].url === 'https://opens.example/a', 'an address typed without https:// is checked the way the Hub opens it');

        o = await check('https://moved.example/old');
        ok(/lc-moved/.test(o.kind) && o.text.startsWith('Moved') && o.text.includes('https://new.example/a/very/long') && o.text.includes(NOTE) && !o.overflow, '"Moved": shows the new address, wrapped inside the screen', o);
        const use = await page.evaluate(() => { const b = document.querySelector('#lcFieldOut .lc-use'); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), h: Math.round(r.height), fs: parseFloat(getComputedStyle(b).fontSize) }; });
        ok(use && use.text === 'Use the new address' && use.h >= 44, '"Use the new address" is offered, 44px tall', use);
        await shot('moved');
        const termsBefore = await page.evaluate(() => JSON.stringify(DATA.categories.map(c => c.terms.length)) + '|' + (typeof OUTBOX !== 'undefined' ? OUTBOX.length : 0));
        await page.click('#lcFieldOut .lc-use'); await page.waitForTimeout(200);
        const used = await page.evaluate(() => ({ box: document.getElementById('fSourceUrl').value, modal: document.getElementById('modalOverlay') ? document.getElementById('modalOverlay').classList.contains('show') : !!document.getElementById('fSourceUrl').offsetParent,
          text: document.getElementById('lcFieldOut').innerText.trim(), state: JSON.stringify(DATA.categories.map(c => c.terms.length)) + '|' + (typeof OUTBOX !== 'undefined' ? OUTBOX.length : 0) }));
        ok(used.box.startsWith('https://new.example/a/very/long') && /Press Save term/.test(used.text), 'it fills the box and says to press Save term', used);
        ok(used.modal && used.state === termsBefore, 'it saves nothing: the form is still open, no term changed, nothing queued', used);

        o = await check('https://gone.example/x');
        ok(/lc-not_found/.test(o.kind) && o.text.startsWith('Not found') && /page is gone/.test(o.text) && o.text.includes(NOTE), '"Not found" for a page that is gone', o.text);
        await shot('notfound');
        o = await check('https://nosite.example/');
        ok(/lc-not_found/.test(o.kind) && /no site at this address/.test(o.text), '"Not found" for a site that does not exist', o.text);
        o = await check('https://shy.example/');
        ok(/lc-unknown/.test(o.kind) && o.text.startsWith('Couldn’t tell') && /Open it yourself to be sure/.test(o.text) && o.text.includes(NOTE), '"Couldn\'t tell" says to open it yourself', o.text);
        await shot('unknown');
        ok(!/\bsafe\b/i.test((await out('#lcFieldOut')).text.replace(NOTE, '')), 'the word "safe" appears only in the standing line');
        o = await check('https://evil.example/');
        ok(/lc-moved/.test(o.kind) && !o.html.includes('javascript:') && !(await page.$('#lcFieldOut .lc-use')), 'a "new address" that is not a web address is neither shown nor offered', o.html.slice(0, 300));
        o = await check('https://odd.example/');
        ok(/lc-unknown/.test(o.kind) && !/<img/.test(o.html), 'an answer the Hub does not know is "Couldn\'t tell", and nothing from it is drawn', o.html.slice(0, 300));
        o = await check('https://unlisted.example/');
        ok(/not a web address the Hub can check/.test(o.text), 'the server refusing an address is said plainly', o.text);
        mode = '429'; o = await check('https://opens.example/a');
        ok(/today.s limit/i.test(o.text) && /tomorrow/.test(o.text), 'the daily limit is said in plain words', o.text);
        mode = '401'; o = await check('https://opens.example/a');
        ok(/for the team/.test(o.text), 'a phone outside the team is told so', o.text);
        mode = '500'; o = await check('https://opens.example/a');
        ok(/lc-unknown/.test(o.kind), 'a server fault is "Couldn\'t tell", never "Not found"', o.text);
        mode = 'ok';
        const n = calls.length;
        await page.evaluate(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false }));
        o = await check('https://opens.example/a');
        ok(o.text === 'You are offline: checking a link needs a connection.' && calls.length === n, 'offline: says so, asks nothing', o.text);
        await shot('offline');
        await page.evaluate(() => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true }));

        // a late answer for an address that was replaced is dropped
        mode = 'slow'; await page.fill('#fSourceUrl', 'https://gone.example/x'); await page.click('#lcFieldBtn'); await page.waitForTimeout(100);
        await page.fill('#fSourceUrl', 'https://something-else.example/'); await page.waitForTimeout(1200); mode = 'ok';
        o = await out('#lcFieldOut');
        ok(o.hidden && !(await page.evaluate(() => document.getElementById('lcFieldBtn').disabled)), 'an answer that arrives after the address changed is dropped, and the button is ready', o);

        // closing and reopening the form starts clean
        await check('https://opens.example/a');
        await page.evaluate(() => { closeModal(); openAddModal(); }); await page.waitForTimeout(400);
        ok((await out('#lcFieldOut')).hidden, 'opening the form again starts with no answer');
        // press feedback
        const press = await page.evaluate(() => { const b = document.getElementById('lcFieldBtn'); const a = getComputedStyle(b).transform; b.classList.add('is-pressed'); const z = getComputedStyle(b).transform; b.classList.remove('is-pressed'); return { a, z, lifts: /\.lc-btn/.test(document.documentElement.innerHTML.match(/const LIFTS = '[^']*/)?.[0] || '') }; });
        ok(press.a !== press.z, 'the button answers a press (.is-pressed)', press);
        await page.evaluate(() => closeModal());

        // ---- Link Directory ----
        await page.evaluate(() => { const c = DATA.categories[0]; c.terms[0].url = 'https://opens.example/a'; c.terms[1].url = 'https://gone.example/x'; setCategory('directory'); });
        await page.waitForTimeout(700);
        const rows = await page.evaluate(() => { const rs = [...document.querySelectorAll('.dir-row')];
          return { rows: rs.length, btns: rs.filter(r => r.querySelector('.lc-row-btn')).length, outs: rs.filter(r => r.nextElementSibling && r.nextElementSibling.classList.contains('lc-row-out') && r.nextElementSibling.hidden).length,
            side: document.documentElement.scrollWidth > innerWidth + 1 }; });
        ok(rows.rows >= 2 && rows.btns === rows.rows && rows.outs === rows.rows && !rows.side, `Link Directory: every row (${rows.rows}) has a Check button, no answer yet, no sideways scroll`, rows);
        const rb = await page.evaluate(() => { const row = [...document.querySelectorAll('.dir-row')].find(r => r.querySelector('.lc-row-btn').dataset.url === 'https://opens.example/a'); row.setAttribute('data-lc-row', 'a');
          const b = row.querySelector('.lc-row-btn'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const others = [...row.querySelectorAll('a, button')].filter(e => e !== b);
          const hit = [[0, 0], [0, -21], [0, 21], [-21, 0], [21, 0]].map(([dx, dy]) => { const h = document.elementFromPoint(cx + dx, cy + dy); return !!h && (h === b || b.contains(h)); });
          const stolen = others.filter(e => { const q = e.getBoundingClientRect(); if (!q.width) return false; const h = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return !(h && (h === e || e.contains(h))); }).map(e => e.className);
          return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), fs: parseFloat(getComputedStyle(b).fontSize), hit, stolen }; });
        if (phone) ok(rb.text === 'Check' && rb.h >= 44 && rb.w >= 44 && rb.fs >= 16 && rb.hit.every(Boolean), `a row's Check is ${rb.w}x${rb.h}, ${rb.fs}px type, and takes a tap across 44px`, rb);
        else ok(rb.text === 'Check' && rb.h >= 30 && rb.hit[0], `a row's Check on a computer is ${rb.w}x${rb.h}`, rb);
        ok(rb.stolen.length === 0, 'the row\'s other controls (the link, the pencil, open) still take their own taps', rb.stolen);
        await page.click('[data-lc-row="a"] .lc-row-btn'); await page.waitForTimeout(500);
        o = await out('[data-lc-row="a"] + .lc-row-out');
        ok(o && /lc-opens/.test(o.kind) && o.text.includes(NOTE) && !o.overflow, 'a row\'s answer shows under that row', o);
        ok(!(await page.$('.lc-row-out .lc-use')), 'no "Use the new address" in the directory: it never changes a link');
        const quiet = await page.evaluate(() => [...document.querySelectorAll('.lc-row-out')].filter(x => !x.hidden).length);
        ok(quiet === 1, 'only that row shows an answer', quiet);
        await page.evaluate(() => { const row = [...document.querySelectorAll('.dir-row')].find(r => r.querySelector('.lc-row-btn').dataset.url === 'https://gone.example/x'); row.setAttribute('data-lc-row', 'b'); row.querySelector('.lc-row-btn').click(); });
        await page.waitForTimeout(500);
        o = await out('[data-lc-row="b"] + .lc-row-out');
        ok(o && /lc-not_found/.test(o.kind), 'a dead link in the directory: "Not found"', o && o.text);
        await page.evaluate(() => document.querySelector('[data-lc-row="a"]').scrollIntoView({ block: 'start' })); await page.evaluate(() => scrollBy(0, -120)); await shot('directory');
        ok(calls.every(c => c.method === 'POST'), 'every request was a POST');
        ok(!page.__errors.length, 'no page errors', page.__errors);

        if (device === 'iphone') {   // dark
          await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); setCategory('all'); openAddModal(); });
          await page.waitForTimeout(400);
          await check('https://moved.example/old');
          const dark = await page.evaluate(() => { const a = document.querySelector('#lcFieldOut .lc-ans'), h = a.querySelector('.lc-head'); return { bg: getComputedStyle(a).backgroundColor, head: getComputedStyle(h).color }; });
          ok(dark.bg === 'rgb(58, 47, 23)' && dark.head === 'rgb(227, 188, 106)', 'dark mode: "Moved" has its own dark amber', dark);
          await page.evaluate(() => document.getElementById('lcFieldOut').scrollIntoView({ block: 'center' })); await shot('moved-dark');
          await page.evaluate(() => { closeModal(); document.documentElement.setAttribute('data-theme', 'light'); });
        }
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
