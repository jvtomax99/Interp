/* Team Chat with the on-screen keyboard (Jose's report, 2026-11-05: on his
   iPhone the box you type in ended up behind the keyboard). Chromium has no
   on-screen keyboard, so the keyboard is played by a stand-in for
   window.visualViewport: the part of the screen it leaves (top, height),
   the way an iPhone reports it, and the phone's own scroll of the page.
   While the box has focus the chat screen must fill exactly that part, the
   box at its foot and the header at its top, whatever the page's scroll. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

(async () => {
  const b = await L.chromium.launch();
  const { page } = await L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 5000 });
  await page.evaluate(async () => {
    const now = Date.now();
    for (let i = 0; i < 30; i++) await db.collection('team-chat').doc('k' + i).set({ text: 'Message number ' + i + ' with a few words so the thread is long enough to scroll.', author: i % 3 ? 'Liz Lind' : 'Ana Torres', timestamp: now - (40 - i) * 60000, replyTo: null, attachment: null });
  });
  await page.evaluate(() => setCategory('chat')); await page.waitForTimeout(1200);

  // The stand-in keyboard. Listeners were wired to the real one at load, so
  // each change is followed by what those listeners do (fitChatPanel).
  await page.evaluate(() => {
    window.__vv = { offsetTop: 0, height: innerHeight, width: innerWidth, addEventListener(){}, removeEventListener(){} };
    Object.defineProperty(window, 'visualViewport', { get: () => window.__vv, configurable: true });
    window.__kb = (top, h) => { window.__vv.offsetTop = top; window.__vv.height = h; fitChatPanel(); };
  });
  const measure = () => page.evaluate(() => {
    const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
    const vv = window.__vv, visTop = vv.offsetTop, visBottom = Math.min(vv.offsetTop + vv.height, innerHeight);
    const comp = r('#tcComposer'), input = r('#chatInput'), head = r('.tc-head'), box = document.getElementById('chatMessages');
    return { typing: document.body.classList.contains('tc-typing'), visTop, visBottom,
      compBottom: Math.round(comp.bottom), compTop: Math.round(comp.top), inputTop: Math.round(input.top), inputBottom: Math.round(input.bottom),
      headTop: Math.round(head.top), headBottom: Math.round(head.bottom),
      atBottom: box.scrollHeight - box.scrollTop - box.clientHeight <= 40, threadH: box.clientHeight, scrollY: window.scrollY };
  });
  const onKeyboard = (m, what) => {
    ok(m.typing, what + ': the chat is pinned while typing', m);
    ok(m.compBottom <= m.visBottom + 1 && m.compBottom >= m.visBottom - 12, what + ': the box sits right on the keyboard', m);
    ok(m.inputTop >= m.visTop && m.inputBottom <= m.visBottom, what + ': what you type is in view', m);
    ok(m.headTop >= m.visTop - 1 && m.headBottom <= m.compTop, what + ': the header stays at the top, above the box', m);
    ok(m.threadH >= 120, what + ': the thread still shows messages', m);
  };

  const rest = await measure();
  await page.focus('#chatInput'); await page.waitForTimeout(100);
  // The keyboard arrives (339px) and the phone pans up to show the box.
  await page.evaluate(() => window.__kb(339, 420)); await page.waitForTimeout(80);
  const panned = await measure();
  onKeyboard(panned, 'phone pans to show the box');
  ok(panned.atBottom, 'the newest message stays in view', panned);

  // The phone scrolls the page as well, after the keyboard settled: the
  // box must not move (it used to follow the page's scroll).
  await page.evaluate(() => { document.documentElement.style.minHeight = '2000px'; window.scrollTo(0, 260); }); await page.waitForTimeout(80);
  onKeyboard(await measure(), 'the page scrolled underneath');
  await page.evaluate(() => { window.scrollTo(0, 0); document.documentElement.style.minHeight = ''; });

  // The keyboard reported late: the pan is there, the height not yet.
  await page.evaluate(() => window.__kb(339, innerHeight)); await page.waitForTimeout(80);
  onKeyboard(await measure(), 'keyboard height reported late');

  // No pan at all, just a shorter visible part (Android, or a phone with room).
  await page.evaluate(() => window.__kb(0, 420)); await page.waitForTimeout(80);
  onKeyboard(await measure(), 'no pan, shorter screen');
  await page.screenshot({ path: L.SHOTS + '/chat-keyboard-typing.png' });

  // Done typing: back in the page as before.
  await page.evaluate(() => { window.__kb(0, innerHeight); document.getElementById('chatInput').blur(); });
  await page.waitForTimeout(200);
  const after = await measure();
  ok(!after.typing, 'off the box: the chat is back in the page', after);
  ok(Math.abs(after.compBottom - rest.compBottom) <= 2 && Math.abs(after.headTop - rest.headTop) <= 2, 'and laid out as before typing', { rest, after });
  ok(after.scrollY === 0, 'the page is at its top', after);

  // Leaving Team Chat while typing leaves nothing pinned behind.
  await page.focus('#chatInput'); await page.waitForTimeout(80);
  await page.evaluate(() => setCategory('home')); await page.waitForTimeout(300);
  ok(await page.evaluate(() => !document.body.classList.contains('tc-typing')), 'leaving Team Chat drops the pin');
  ok(!page.__errors.length, 'no page errors', page.__errors);

  // A computer has no on-screen keyboard: nothing changes there.
  const { page: dp } = await L.boot(b, { device: 'desktop', name: 'Ana Torres', settle: 4000 });
  await dp.evaluate(() => setCategory('chat')); await dp.waitForTimeout(800);
  await dp.focus('#chatInput'); await dp.waitForTimeout(100);
  ok(await dp.evaluate(() => !document.body.classList.contains('tc-typing') && getComputedStyle(document.querySelector('.tc')).position !== 'fixed'), 'computer: the chat stays in the page while typing');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
