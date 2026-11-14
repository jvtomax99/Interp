/* Screen morph (docs/features/screen-morph.md): a domain tile's pin and name
   travel into the banner of the page that opens, and the Back button sends
   them home. What this holds:

     pair     during the trip exactly the banner's pin and name carry a
              name, and nothing made of glass does (the tab bar, the search
              row: a named element is photographed without its backdrop)
     clean    afterwards no name, no class and no flag is left behind
     same     the tap lands where a plain setCategory lands: the domain, one
              more step on the Back stack, the top of the page
     order    a tile tap and Back in the same instant still happen in the
              order they were made (the browser runs the tap a frame late)
     lands    the flying pin ends centred on the real pin (the page under
              it is still rising 6px as it fades in: the pair must follow)
     tap      a tap made during the trip is not lost: Back mid-flight goes
              back at once (the browser hands such a tap to <html>)
     scroll   Back from a scrolled domain still restores the tiles' scroll,
              and a banner scrolled off screen sends no pin
     swipe    the phone's own back (a real popstate) does not morph
     quiet    Reduce Motion: the tap navigates at once, with no transition
   Doctor cards (step 2): the card's photo and name travel into the top card
   of the doctor's page (an overlay, not a screen), and home again:
     doc pair     open: the page's photo and name are the pair; close: the card's
     doc lands    each end lands on the real boxes
     doc enter    the page's own slide-up does not play inside the trip, nor
                  replay after it; a plain open still has it
     doc back     the top bar's Back (navigateBack(true)) also flies home
     doc tap      the page's back arrow tapped mid-flight closes it
     doc order    open then close in one instant ends closed and clean
     doc away     a card scrolled off screen: the page closes at once, no trip
     doc swipe    the phone's own back closes the page with no trip
     desk         on a computer, a redraw held back for the search box (which
                  has the cursor) runs when a doctor's page opens: the list
                  keeps its scroll, the cursor is not pulled back, and the back
                  arrow from a scrolled list flies home (desk doc pair) */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const named = page => page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).viewTransitionName !== 'none').map(e => getComputedStyle(e).viewTransitionName + '=' + String(e.className).split(' ')[0]));
const state = page => page.evaluate(() => ({ cat: activeCategory, stack: navStack.length, y: Math.round(scrollY), cls: document.documentElement.classList.contains('morphing'), live: morphLive, waiting: !!morphWaiting }));
// Tap, then read the names in the page itself, frames later: no round trip
// to race the trip's end.
const trip = (page, js, until) => page.evaluate(async ({ js, until }) => {
  const raf = () => new Promise(r => requestAnimationFrame(r));
  (0, eval)(js);
  for (let i = 0; i < 120 && !(0, eval)(until); i++) await raf();
  if (morphVt) await morphVt.ready.catch(() => {});
  const names = [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).viewTransitionName !== 'none').map(e => getComputedStyle(e).viewTransitionName + '=' + String(e.className).split(' ')[0]);
  const dp = document.getElementById('doctorDirDetailModal'), enter = dp ? getComputedStyle(dp).animationName + '/' + getComputedStyle(dp.parentElement).animationName : '';
  // The end of the trip, held: where is the flying pin against the real one?
  document.getAnimations().forEach(a => { const pe = a.effect && a.effect.pseudoElement; if (pe && pe.startsWith('::view-transition')) { a.pause(); a.currentTime = a.effect.getComputedTiming().duration; } });
  await raf(); await raf();
  const g = getComputedStyle(document.documentElement, '::view-transition-group(hub-pin)');
  const m = new DOMMatrixReadOnly(g.transform === 'none' ? '' : g.transform), el = document.querySelector('[style*="hub-pin"]');
  let off = null;
  if (el) { const r = el.getBoundingClientRect(); off = [m.e + parseFloat(g.width) / 2 - (r.left + r.width / 2), m.f + parseFloat(g.height) / 2 - (r.top + r.height / 2)].map(v => +v.toFixed(1)); }
  document.getAnimations().forEach(a => { const pe = a.effect && a.effect.pseudoElement; if (pe && pe.startsWith('::view-transition')) a.finish(); });
  return { names, off, live: morphLive, enter };
}, { js, until });
const at = id => `activeCategory === '${id}'`;
// One doctor at the top of the directory, in the Firebase stand-in too so a
// listener reload keeps it.
const DOC = { id: 'sm-doc', name: 'Dr. Ana Ruiz', specialty: 'Cardiology', hospitalLocation: '', locationDetails: '2nd fl', notes: '', customTerms: [] };
async function seedDoctors(page) {
  await L.go(page, 'doctor-directory');
  await page.evaluate(d => { const { id, ...rest } = d; if (window.__DB) window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(rest)); if (!DOCTOR_DIRECTORY.some(x => x.id === id)) DOCTOR_DIRECTORY.unshift(JSON.parse(JSON.stringify(d))); renderContent(); }, DOC);
  await page.waitForTimeout(600);
  await page.evaluate(id => { const c = document.querySelector(`.dl-card[data-doc="${id}"]`); window.scrollTo(0, Math.max(0, c.getBoundingClientRect().top + scrollY - 200)); }, DOC.id);
  await page.waitForTimeout(250);
}
const done = page => page.waitForFunction(() => !morphLive && !document.documentElement.classList.contains('morphing'), null, { timeout: 5000 });

(async () => {
  const b = await L.chromium.launch();
  const { page } = await L.boot(b, { device: 'iphone' });
  await L.go(page, 'all');
  const has = await page.evaluate(() => typeof document.startViewTransition === 'function');
  ok(has, 'this browser has View Transitions (the suite is meaningless without)');
  const tileId = await page.evaluate(() => document.querySelector('.dt-tile').id.replace('domain-', ''));
  const before = await state(page);

  const fwd = await trip(page, `document.getElementById('domain-${tileId}').click()`, at(tileId));
  const mid = fwd.names;
  ok(fwd.live && mid.length === 2 && mid.includes('hub-pin=domain-banner-pin') && mid.includes('hub-name=domain-banner-name'), 'pair: mid-trip only the banner\'s pin and name are named', fwd);
  ok(fwd.off && Math.abs(fwd.off[0]) <= 1.5 && Math.abs(fwd.off[1]) <= 1.5, 'lands: the flying pin ends centred on the banner\'s pin', fwd.off);
  await done(page);
  const after = await state(page);
  ok(after.cat === tileId && after.stack === before.stack + 1 && after.y === 0, 'same: the tap opened the domain, one step deeper, at the top', { before, after });
  ok((await named(page)).length === 0 && !after.cls && !after.live && !after.waiting, 'clean: nothing left behind after the trip', [await named(page), after]);

  const bk = await trip(page, `document.getElementById('tgBack').click()`, at('all'));
  const midBack = bk.names;
  ok(bk.live && midBack.length === 2 && midBack.includes('hub-pin=dt-tile-pin') && midBack.includes('hub-name=dt-tile-name'), 'pair: on Back the tile\'s pin and name are the pair', bk);
  ok(bk.off && Math.abs(bk.off[0]) <= 1.5 && Math.abs(bk.off[1]) <= 1.5, 'lands: on Back the flying pin ends centred on the tile\'s pin', bk.off);
  await done(page);
  const home = await state(page);
  ok(home.cat === 'all' && home.stack === before.stack && (await named(page)).length === 0, 'clean: Back returned to the tiles with the stack as it was', home);

  const order = await page.evaluate(id => { morphOpenDomain(id); goBack(); return { b: activeCategory, stack: navStack.length }; }, tileId);
  ok(order.b === 'all' && order.stack === before.stack, 'order: tap then Back in one instant ends on the tiles, the stack as it was', order);
  await done(page);
  const jump = await page.evaluate(id => { morphOpenDomain(id); setCategory('chat'); return { cat: activeCategory, top: navStack[navStack.length - 1].id }; }, tileId);
  ok(jump.cat === 'chat' && jump.top === tileId, 'order: another navigation right after a tile tap runs second, not first', jump);
  await done(page);

  // A real finger on Back while the pin is still flying.
  await L.go(page, 'all');
  const backBox = await page.locator('#tgBack').boundingBox();
  const stack0 = (await state(page)).stack;
  await page.tap('#domain-' + tileId);
  await page.waitForFunction(id => activeCategory === id && morphLive, tileId, { timeout: 5000 });
  const t0 = Date.now();
  await page.touchscreen.tap(backBox.x + backBox.width / 2, backBox.y + backBox.height / 2);
  const went = await page.waitForFunction(() => activeCategory === 'all', null, { timeout: 2000 }).then(() => true, () => false);
  ok(went, 'tap: Back tapped mid-flight goes back (not swallowed by the trip)', { ms: Date.now() - t0, s: await state(page) });
  await done(page);
  ok((await state(page)).stack === stack0 && (await named(page)).length === 0, 'tap: and leaves the stack and the names clean', await state(page));

  // Scroll: the tiles' place comes back, and an off-screen banner sends no pin.
  await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(200);
  const y0 = await page.evaluate(() => Math.round(scrollY));
  await page.evaluate(id => setCategory(id), tileId); await page.waitForTimeout(600);   // not L.go: it scrolls to the top first
  await page.evaluate(() => window.scrollTo(0, 900)); await page.waitForTimeout(200);
  const far = await trip(page, `document.getElementById('tgBack').click()`, at('all'));
  await done(page);
  const y1 = await page.evaluate(() => Math.round(scrollY));
  ok(y0 > 0 && Math.abs(y1 - y0) <= 2, 'scroll: Back restores where the tiles were scrolled to', { y0, y1 });
  ok(!far.names.some(n => /banner/.test(n)), 'scroll: a banner scrolled off screen is not named', far.names);

  await page.evaluate(() => window.scrollTo(0, 0)); await L.go(page, tileId);
  const swipe = await page.evaluate(async () => { history.back(); for (let i = 0; i < 60 && activeCategory !== 'all'; i++) await new Promise(r => requestAnimationFrame(r)); return { cat: activeCategory, cls: document.documentElement.classList.contains('morphing'), live: morphLive }; });
  ok(swipe.cat === 'all' && !swipe.cls && !swipe.live, 'swipe: the phone\'s own back (popstate) navigates with no morph', swipe);

  // ---- Doctor cards ----
  await seedDoctors(page);
  const card = `document.querySelector('.dl-card[data-doc="${DOC.id}"]')`;
  const shown = 'document.getElementById(\'doctorDirDetailOverlay\').classList.contains(\'show\')';
  const ds = () => page.evaluate(() => ({ open: document.getElementById('doctorDirDetailOverlay').classList.contains('show'), cls: document.documentElement.classList.contains('morphing'), live: morphLive, waiting: !!morphWaiting, enter: getComputedStyle(document.getElementById('doctorDirDetailModal')).animationName, named: [...document.querySelectorAll('[style*="view-transition"]')].length }));
  const dOpen = await trip(page, `${card}.click()`, shown);
  ok(dOpen.live && dOpen.names.length === 2 && dOpen.names.includes('hub-pin=dp-ph') && dOpen.names.includes('hub-name=dp-name'), 'doc pair: mid-trip only the page\'s photo and name are named', dOpen);
  ok(dOpen.off && Math.abs(dOpen.off[0]) <= 1.5 && Math.abs(dOpen.off[1]) <= 1.5, 'doc lands: the flying photo ends on the page\'s photo', dOpen.off);
  ok(dOpen.enter === 'none/none', 'doc enter: neither the page\'s slide-up nor its backdrop fade plays inside the trip', dOpen.enter);
  await done(page);
  const dAfter = await ds();
  ok(dAfter.open && dAfter.enter === 'none' && !dAfter.named && !dAfter.cls && !dAfter.waiting, 'doc enter: after the trip the page is open, clean, its slide-up not replayed', dAfter);
  const dClose = await trip(page, `document.querySelector('#doctorDirDetailModal .dp-ib').click()`, '!' + shown);
  ok(dClose.live && dClose.names.length === 2 && dClose.names.includes('hub-pin=dl-ph') && dClose.names.includes('hub-name=dl-name'), 'doc pair: on the back arrow the card\'s photo and name are the pair', dClose);
  ok(dClose.off && Math.abs(dClose.off[0]) <= 1.5 && Math.abs(dClose.off[1]) <= 1.5, 'doc lands: the photo ends on the card\'s photo', dClose.off);
  await done(page);
  const plain = await page.evaluate(id => { openDoctorDirDetail(id); return getComputedStyle(document.getElementById('doctorDirDetailModal')).animationName; }, DOC.id);
  ok(plain === 'modalIn', 'doc enter: a plain open still has the page\'s slide-up', plain);
  const dBack = await trip(page, 'goBack()', '!' + shown);
  ok(dBack.live && dBack.names.includes('hub-pin=dl-ph'), 'doc back: the top bar\'s Back from a doctor\'s page flies home too', dBack);
  await done(page);
  ok(!(await ds()).open && (await state(page)).cat === 'doctor-directory', 'doc back: the page closed, still on the directory', [await ds(), await state(page)]);

  // A real finger on the page's back arrow while the photo is still flying in.
  await page.evaluate(id => openDoctorDirDetail(id), DOC.id); await page.waitForTimeout(400);
  const arrow = await page.locator('#doctorDirDetailModal .dp-ib').first().boundingBox();
  await page.evaluate(() => closeDoctorDirDetail()); await page.waitForTimeout(200);
  const nameBox = await page.locator(`.dl-card[data-doc="${DOC.id}"] .dl-name`).boundingBox();   // not a corner: "+ Prep terms" sits there
  await page.touchscreen.tap(nameBox.x + nameBox.width / 2, nameBox.y + nameBox.height / 2);
  await page.waitForFunction(() => morphLive && document.getElementById('doctorDirDetailOverlay').classList.contains('show'), null, { timeout: 5000 });
  await page.touchscreen.tap(arrow.x + arrow.width / 2, arrow.y + arrow.height / 2);
  const closed = await page.waitForFunction(() => !document.getElementById('doctorDirDetailOverlay').classList.contains('show'), null, { timeout: 2000 }).then(() => true, () => false);
  ok(closed, 'doc tap: the back arrow tapped mid-flight closes the page', await ds());
  await done(page);

  const dOrder = await page.evaluate(id => { morphOpenDoctor(id); morphCloseDoctor(); return document.getElementById('doctorDirDetailOverlay').classList.contains('show'); }, DOC.id);
  await done(page);
  const dOrd2 = await ds();
  ok(!dOrder && !dOrd2.open && !dOrd2.named && !dOrd2.waiting, 'doc order: open then close in one instant ends closed and clean', dOrd2);

  // Scrolled first: on a phone the page behind an open sheet does not scroll.
  // (Room to scroll it away: the test directory is only a few cards long.)
  await page.evaluate(sel => { document.getElementById('content').style.paddingBottom = '3000px'; const c = (0, eval)(sel); window.scrollTo(0, c.getBoundingClientRect().bottom + scrollY + 50); }, card);
  await page.waitForTimeout(200);
  const gone = await page.evaluate(sel => (0, eval)(sel).getBoundingClientRect().bottom <= 0, card);
  await page.evaluate(id => openDoctorDirDetail(id), DOC.id); await page.waitForTimeout(300);
  const away = await page.evaluate(() => { document.querySelector('#doctorDirDetailModal .dp-ib').click(); return { open: document.getElementById('doctorDirDetailOverlay').classList.contains('show'), cls: document.documentElement.classList.contains('morphing'), live: morphLive }; });
  ok(gone && !away.open && !away.cls && !away.live, 'doc away: card scrolled off screen, the page closes at once with no trip', { gone, away });
  await page.evaluate(() => { document.getElementById('content').style.paddingBottom = ''; window.scrollTo(0, 0); });

  await page.evaluate(id => openDoctorDirDetail(id), DOC.id); await page.waitForTimeout(300);
  const dSwipe = await page.evaluate(async () => { history.back(); for (let i = 0; i < 60 && document.getElementById('doctorDirDetailOverlay').classList.contains('show'); i++) await new Promise(r => requestAnimationFrame(r)); return { open: document.getElementById('doctorDirDetailOverlay').classList.contains('show'), cls: document.documentElement.classList.contains('morphing'), live: morphLive }; });
  ok(!dSwipe.open && !dSwipe.cls && !dSwipe.live, 'doc swipe: the phone\'s own back closes the page with no trip', dSwipe);

  // ---- On a computer: a held-back redraw does not throw the list to the top ----
  // The search box has the cursor there (autofocus), so a redraw waits for it to
  // let go; opening a doctor's page lets go. That redraw used to rebuild the
  // screen at the top, so the card was off screen and the page closed plainly.
  const { page: dk } = await L.boot(b, { device: 'desktop' });
  await seedDoctors(dk);
  await dk.evaluate(d => {   // a long directory, the doctor in its middle
    for (let i = 0; i < 40; i++) {
      const f = { id: 'sm-fill-' + i, name: (i < 20 ? 'Dr. Aaron Fill ' : 'Dr. Zed Fill ') + String(i).padStart(2, '0'), specialty: 'Cardiology', hospitalLocation: '', locationDetails: '', notes: '', customTerms: [] };
      const { id, ...rest } = f;
      if (window.__DB) window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(rest));
      if (!DOCTOR_DIRECTORY.some(x => x.id === id)) DOCTOR_DIRECTORY.push(f);
    }
    render();
  }, DOC);
  await dk.waitForTimeout(600);
  await dk.evaluate(sel => { const c = (0, eval)(sel); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 300); }, card);
  await dk.waitForTimeout(250);
  const held = await dk.evaluate(() => { const s = document.getElementById('searchInput'); if (document.activeElement !== s) s.focus({ preventScroll: true }); scheduleRender(); return new Promise(r => setTimeout(() => r({ y: Math.round(scrollY), focus: document.activeElement === s, held: renderDeferredByTyping }), 400)); });
  ok(held.y > 300 && held.focus && held.held, 'desk: precondition, the list is scrolled and a redraw is held for the search box', held);
  const nb = await dk.locator(`.dl-card[data-doc="${DOC.id}"] .dl-name`).boundingBox();
  await dk.mouse.click(nb.x + nb.width / 2, nb.y + nb.height / 2);   // a real click: the search box lets go
  await done(dk);
  await dk.waitForTimeout(700);   // the held redraw runs (250 ms settle) behind the page
  const kept = await dk.evaluate(sel => { const r = (0, eval)(sel).getBoundingClientRect(); return { y: Math.round(scrollY), open: document.getElementById('doctorDirDetailOverlay').classList.contains('show'), onScreen: r.bottom > 0 && r.top < innerHeight, held: renderDeferredByTyping, focusSearch: document.activeElement && document.activeElement.id === 'searchInput' }; }, card);
  ok(kept.open && !kept.held && Math.abs(kept.y - held.y) <= 2 && kept.onScreen, 'desk: the held redraw ran and the list stayed where it was, the card on screen', { held, kept });
  ok(!kept.focusSearch, 'desk: the redraw did not pull the cursor back into the search box behind the page', kept);
  const dkClose = await trip(dk, `document.querySelector('#doctorDirDetailModal .dp-ib').click()`, '!' + shown);
  ok(dkClose.live && dkClose.names.length === 2 && dkClose.names.includes('hub-pin=dl-ph') && dkClose.names.includes('hub-name=dl-name'), 'desk doc pair: from a scrolled list the back arrow flies the photo and name home', dkClose);
  await done(dk);
  ok(Math.abs((await dk.evaluate(() => Math.round(scrollY))) - held.y) <= 2, 'desk: after the flight the list is still where it was');
  // A background redraw (data arriving) on a scrolled screen keeps its place too.
  await dk.evaluate(() => document.activeElement && document.activeElement.blur());
  const bg = await dk.evaluate(() => { const y0 = Math.round(scrollY); scheduleRender(); return new Promise(r => setTimeout(() => r({ y0, y1: Math.round(scrollY) }), 500)); });
  ok(bg.y0 > 300 && Math.abs(bg.y1 - bg.y0) <= 2, 'desk: a background redraw keeps the scroll', bg);
  ok(dk.__errors.length === 0, 'desk: no page errors', dk.__errors);

  const { page: rm } = await L.boot(b, { device: 'iphone', reducedMotion: true });
  await L.go(rm, 'all');
  const quiet = await rm.evaluate(id => { morphOpenDomain(id); return { cat: activeCategory, cls: document.documentElement.classList.contains('morphing'), live: morphLive }; }, tileId);
  ok(quiet.cat === tileId && !quiet.cls && !quiet.live, 'quiet: with Reduce Motion the tap navigates at once, no transition', quiet);
  await seedDoctors(rm);
  const dQuiet = await rm.evaluate(id => { morphOpenDoctor(id); const ov = document.getElementById('doctorDirDetailOverlay'); return { open: ov.classList.contains('show'), flown: ov.classList.contains('dp-flown'), cls: document.documentElement.classList.contains('morphing'), live: morphLive, backdrop: getComputedStyle(ov).animationName }; }, DOC.id);
  ok(dQuiet.open && !dQuiet.cls && !dQuiet.live, 'quiet: with Reduce Motion a doctor card opens its page at once, no transition', dQuiet);
  ok(!dQuiet.flown && dQuiet.backdrop === 'overlayIn', 'quiet: with no flight the page keeps its own entrance (backdrop fade)', dQuiet);
  // No View Transitions at all (iPhones before iOS 18): the card still opens the page with its slide-up.
  await rm.evaluate(() => closeDoctorDirDetail());
  const old = await page.evaluate(id => { const keep = document.startViewTransition; document.startViewTransition = undefined; morphOpenDoctor(id); document.startViewTransition = keep; const ov = document.getElementById('doctorDirDetailOverlay'); return { open: ov.classList.contains('show'), flown: ov.classList.contains('dp-flown'), enter: getComputedStyle(document.getElementById('doctorDirDetailModal')).animationName }; }, DOC.id);
  ok(old.open && !old.flown && old.enter === 'modalIn', 'doc old: with no View Transitions the card opens the page with its slide-up', old);
  // A browser that never takes its snapshot (WebKit on a phone held it 3 s):
  // the page still opens within MORPH_WAIT, with its own slide-up, and the
  // browser running the update late changes nothing.
  await page.evaluate(() => closeDoctorDirDetail()); await page.waitForTimeout(300);
  const stall = await page.evaluate(async id => {
    const keep = document.startViewTransition; let late = null;
    document.startViewTransition = cb => { late = cb; let done; const finished = new Promise(r => done = r); return { ready: Promise.reject(new Error('skipped')), finished, updateCallbackDone: finished, skipTransition(){ done(); } }; };
    const t0 = performance.now(); morphOpenDoctor(id); document.startViewTransition = keep;
    const ov = document.getElementById('doctorDirDetailOverlay');
    const atOnce = ov.classList.contains('show');
    while (!ov.classList.contains('show') && performance.now() - t0 < 2000) await new Promise(r => setTimeout(r, 10));
    const ms = Math.round(performance.now() - t0);
    const r = { atOnce, open: ov.classList.contains('show'), ms, flown: ov.classList.contains('dp-flown'), enter: getComputedStyle(document.getElementById('doctorDirDetailModal')).animationName };
    await new Promise(r => setTimeout(r, 50)); late && late();
    r.after = { open: ov.classList.contains('show'), cls: document.documentElement.classList.contains('morphing'), live: morphLive, waiting: morphWaiting };
    return r;
  }, DOC.id);
  ok(!stall.atOnce && stall.open && stall.ms < 500 && !stall.flown && stall.enter === 'modalIn', 'doc stall: a browser that never starts the flight still opens the page within 0.3 s, with its slide-up', stall);
  ok(stall.after.open && !stall.after.cls && !stall.after.live && stall.after.waiting === null, 'doc stall: the browser running the update late changes nothing, and the trip is over', stall.after);

  ok(page.__errors.length === 0 && rm.__errors.length === 0, 'no page errors', [page.__errors, rm.__errors]);
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + e.message); process.exit(1); });
