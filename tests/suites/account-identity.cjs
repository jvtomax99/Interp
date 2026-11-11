/* Your account, phase E3 (docs/features/email-sign-in.md, "As built (E3)"):
   Term Review's record follows the email account, not the typed name (the
   name's record joins the account's once, the later answer winning; signing
   out goes back to the name's), and titles given to an account on Team
   access show only on that account's messages. Fabiola, Liz and Jose keep
   their named titles always, over any given title (Jose, 2026-11-11).
   The owner's Title picker on Team access: it saves,
   takes its own taps, reads in dark mode. The database rules behind both are
   checked against Firebase's own emulator by tests/tools/rules-e3.mjs. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'account-identity/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const ACCT = 'acct_0123456789abcdef0123456789ab';
const LIZ = 'acct_11112222333344445555666677';

(async () => {
  const b = await L.chromium.launch();

  console.log('== Term Review follows the account');
  {
    const { page } = await L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 4500, access: { mode: 'locked', member: true, signedIn: true, uid: 'u1' } });
    const r = await page.evaluate(async ({ ACCT }) => {
      const now = Date.now();
      __DB['term-reviews'] = __DB['term-reviews'] || {};
      // Under the typed name: t1 answered last week, t2 yesterday.
      __DB['term-reviews']['ana-torres__t1'] = { who: 'ana torres', termId: 't1', box: 1, reviewCount: 2, lastResult: 'ok', misses: 0, lastAt: now - 7 * 864e5, nextReviewAt: now };
      __DB['term-reviews']['ana-torres__t2'] = { who: 'ana torres', termId: 't2', box: 3, reviewCount: 5, lastResult: 'ok', misses: 1, lastAt: now - 864e5, nextReviewAt: now };
      // Already under the account (another phone): t1 answered today, t2 last month.
      __DB['term-reviews'][ACCT + '__t1'] = { who: ACCT, name: 'Ana Torres', termId: 't1', box: 0, reviewCount: 3, lastResult: 'miss', misses: 1, lastAt: now - 3600e3, nextReviewAt: now };
      __DB['term-reviews'][ACCT + '__t2'] = { who: ACCT, name: 'Ana Torres', termId: 't2', box: 1, reviewCount: 2, lastResult: 'ok', misses: 0, lastAt: now - 30 * 864e5, nextReviewAt: now };
      // Someone who typed the account id as their name gets nothing of it.
      const setName = n => { window.__lastWho = n; localStorage.setItem('ih_myName', n); const el = document.getElementById('whoInput'); if (el) el.value = n; };
      setName(ACCT); const before = reviewWho();
      setName('Ana Torres');
      const plain = reviewWho();
      await loadTermReviews();
      const asName = Object.keys(TERM_REVIEWS).sort();
      // Signed in.
      localStorage.setItem('ih_account', JSON.stringify({ uid: ACCT, email: 'ana@gmail.com' }));
      await hubAuth.signInWithCustomToken('ticket:' + ACCT);
      await loadTermReviews();
      const signed = { who: reviewWho(), t1: TERM_REVIEWS.t1, t2: TERM_REVIEWS.t2, db2: __DB['term-reviews'][ACCT + '__t2'], moved: localStorage.getItem('ih_reviewsMoved') };
      // An answer now lands under the account, with the name beside it.
      await saveTermReview('t3', 2, 1, { result: 'ok' });
      const t3 = __DB['term-reviews'][ACCT + '__t3'] || null, t3name = __DB['term-reviews']['ana-torres__t3'] || null;
      // Loading again doesn't move twice: a changed name record stays put.
      __DB['term-reviews']['ana-torres__t2'].lastAt = now; __DB['term-reviews']['ana-torres__t2'].box = 4;
      await loadTermReviews();
      const again = TERM_REVIEWS.t2.box;
      return { before, plain, asName, signed, t3, t3name, again };
    }, { ACCT });
    ok(r.before === '' && r.plain === 'ana torres', 'a typed name that looks like an account id owns no record; a plain name does', r);
    ok(r.asName.join() === 't1,t2', 'not signed in: the record under the name, as before', r.asName);
    ok(r.signed.who === ACCT, 'signed in: the record is the account\'s', r.signed.who);
    ok(r.signed.t1 && r.signed.t1.box === 0 && r.signed.t1.reviewCount === 3, 't1: the account\'s answer from today wins over the name\'s from last week', r.signed.t1);
    ok(r.signed.t2 && r.signed.t2.box === 3 && r.signed.t2.reviewCount === 5 && r.signed.t2.misses === 1, 't2: the name\'s answer from yesterday wins, counts kept high', r.signed.t2);
    ok(r.signed.db2 && r.signed.db2.box === 3 && r.signed.db2.who === ACCT && r.signed.db2.name === 'Ana Torres', 'and it was saved to the account\'s record in the database', r.signed.db2);
    ok(/acct_0123/.test(r.signed.moved || ''), 'the move is marked done for this account on this phone', r.signed.moved);
    ok(r.t3 && r.t3.who === ACCT && r.t3.name === 'Ana Torres' && !r.t3name, 'a new answer is saved under the account, not the name', { t3: r.t3, t3name: r.t3name });
    ok(r.again === 3, 'loading again doesn\'t move the name\'s record a second time', r.again);
    const out = await page.evaluate(async () => {
      await accountSignOut(); await new Promise(r => setTimeout(r, 600));
      return { who: reviewWho(), keys: Object.keys(TERM_REVIEWS).sort().join() };
    });
    ok(out.who === 'ana torres', 'signed out: back to the name\'s record', out);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }

  console.log('== Titles given to an account');
  {
    const { page } = await L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 5000 });
    await page.evaluate(async ({ LIZ }) => {
      const now = Date.now();
      const add = (id, author, min, uid) => db.collection('team-chat').doc(id).set(Object.assign({ text: 'Hello ' + id, author, timestamp: now - min * 60000, replyTo: null, attachment: null }, uid ? { uid } : {}));
      await add('a1', 'Liz Lind', 9, 'phone-x');         // the name, before it's given
      await add('a2', 'Fabiola', 8);
      await db.collection('hub-titles').doc(LIZ).set({ title: 'Supervisor of Language Services', kind: 'supervisor', rule: 'liz', name: 'Liz Lind', at: now });
      await db.collection('hub-titles').doc('acct_maria000000000000000000000').set({ title: 'Administrator', kind: 'admin', rule: '', name: 'Maria Ruiz', at: now });
      await add('a3', 'Liz Lind', 6, LIZ);               // her account
      await add('a4', 'Liz Lind', 5, 'phone-x');         // anyone else typing her name
      await add('a5', 'Elizabeth Lind', 4);              // no phone on it
      await add('a6', 'Maria Ruiz', 3, 'acct_maria000000000000000000000');
      await add('a7', 'Fabiola', 2);                     // by name, as always
      await db.collection('hub-titles').doc('acct_fab00000000000000000000000').set({ title: 'Supervisor of Language Services', kind: 'supervisor', rule: 'liz', name: 'Fabiola Grijalva', at: now });
      await db.collection('hub-titles').doc('acct_jose0000000000000000000000').set({ title: 'Administrator', kind: 'admin', rule: '', name: 'Jose Vazquez', at: now });
      await db.collection('hub-titles').doc('acct_rosa0000000000000000000000').set({ title: 'Developer', kind: 'admin', rule: 'jose', name: 'Rosa Diaz', at: now });
      await add('a8', 'Fabiola Grijalva', 1.5, 'acct_fab00000000000000000000000'); // another title given to her account
      await add('a9', 'Jose V', 1, 'acct_jose0000000000000000000000');             // another title given to his account
      await add('a10', 'Rosa Diaz', 0.5, 'acct_rosa0000000000000000000000');      // Developer, given to someone else
    }, { LIZ });
    await page.evaluate(() => setCategory('chat')); await wait(1200);
    const rows = await page.evaluate(() => [...document.querySelectorAll('.chat-author')].slice(-10).map(a => ({
      name: a.firstChild.textContent, title: (a.querySelector('.chat-title') || {}).textContent || '' })));
    const t = i => (rows[i] || {}).title;
    const SUP = 'Supervisor of Language Services';
    ok(t(0) === SUP && t(2) === SUP, 'Liz is always Supervisor: from another phone and from her account', rows);
    ok(t(3) === SUP && t(4) === SUP, '"Liz Lind" and "Elizabeth Lind" still read Supervisor after her title was given', [t(3), t(4)]);
    ok(t(5) === 'Administrator', 'a title given to any account shows on its messages', t(5));
    ok(t(1) === 'Administrator' && t(6) === 'Administrator', 'Fabiola by name: Administrator', [t(1), t(6)]);
    ok(t(7) === 'Administrator', 'Fabiola stays Administrator even with another title given to her account', t(7));
    ok(t(8) === 'Developer', 'Jose V stays Developer, even with another title given to his account', t(8));
    ok(t(9) === 'Developer', 'Developer given to another account shows on its messages', t(9));
    const mine = await page.evaluate(async LIZ => {
      const a = myHubTitle();
      await hubAuth.signInWithCustomToken('ticket:' + LIZ);
      const b = myHubTitle();
      return { a: a && a.title, b: b && b.title };
    }, LIZ);
    ok(!mine.a && mine.b === 'Supervisor of Language Services', 'your own title (Home\'s hello) follows the account too', mine);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }

  for (const dark of [false, true]) {
    console.log('== Team access: the owner gives a title' + (dark ? ' (dark)' : ''));
    const { page } = await L.boot(b, { device: 'iphone', dark, name: 'Jose Vazquez', settle: 4500, access: { mode: 'practice', signedIn: true, uid: 'owner-uid' },
      init: `try{ localStorage.setItem('ih_access_me_v1', ${JSON.stringify(JSON.stringify({ member: true, uid: 'owner-uid', code: 'OWNERCDE', role: 'owner', kind: 'owner', joinedAt: 1 }))}); }catch(e){}` });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.evaluate(({ LIZ }) => {
      __DB['hub-members'] = __DB['hub-members'] || {};
      __DB['hub-members'][LIZ] = { role: 'member', who: 'Liz Lind', lastSeen: Date.now(), device: 'iPhone' };
      __DB['hub-members']['plain-phone'] = { role: 'member', who: 'Carlos Diaz', lastSeen: Date.now(), device: 'iPhone' };
    }, { LIZ });
    const owner = await page.evaluate(() => isHubOwner());
    if (!owner) { ok(false, 'this phone is the owner (harness)', owner); await page.close(); continue; }
    await page.evaluate(() => { TEAM_ACCESS.loaded = false; setCategory('team-access'); }); await wait(900);
    const rows = await page.evaluate(() => [...document.querySelectorAll('.ta-person')].map(p => ({ who: p.querySelector('.ta-who b').textContent, btn: !!p.querySelector('.ta-title-btn') })));
    const liz = rows.find(r => r.who === 'Liz Lind'), carlos = rows.find(r => r.who === 'Carlos Diaz');
    ok(liz && liz.btn && carlos && !carlos.btn, 'a Title button on an email account\'s row only', rows);
    await page.evaluate(() => [...document.querySelectorAll('.ta-person')].find(p => /Liz Lind/.test(p.textContent)).querySelector('.ta-title-btn').scrollIntoView({ block: 'center' }));
    await page.evaluate(() => [...document.querySelectorAll('.ta-person')].find(p => /Liz Lind/.test(p.textContent)).querySelector('.ta-title-btn').click()); await wait(300);
    const pick = await page.evaluate(() => {
      const box = document.querySelector('.ta-titles'); if (!box) return null;
      box.scrollIntoView({ block: 'center' });
      const btns = [...box.querySelectorAll('button')];
      return { labels: btns.map(x => x.textContent.trim()), taps: btns.map(x => { const r = x.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return (at === x || x.contains(at)) && r.height >= 44; }) };
    });
    ok(pick && pick.labels.join('|') === 'Supervisor of Language Services|Administrator|Developer', 'the picker: the three titles', pick);
    ok(pick && pick.taps.every(Boolean), 'each takes its own tap, 44 px or taller', pick);
    if (!dark) await page.screenshot({ path: O + 'team-access-picker.png' });
    await page.evaluate(() => [...document.querySelectorAll('.ta-titles button')].find(x => /Supervisor/.test(x.textContent)).click()); await wait(700);
    const saved = await page.evaluate(LIZ => ({ doc: (__DB['hub-titles'] || {})[LIZ] || null, tag: ([...document.querySelectorAll('.ta-person')].find(p => /Liz Lind/.test(p.textContent)) || { querySelector: () => null }).querySelector('.ta-given') }), LIZ)
      .then(async s => ({ doc: s.doc, tag: await page.evaluate(() => { const g = document.querySelector('.ta-given'); if (!g) return null; const cs = getComputedStyle(g); return { text: g.textContent, color: cs.color }; }) }));
    ok(saved.doc && saved.doc.title === 'Supervisor of Language Services' && saved.doc.rule === 'liz' && saved.doc.kind === 'supervisor', 'saved to her account, claiming the name rule', saved.doc);
    ok(saved.tag && saved.tag.text === 'Supervisor of Language Services', 'her row shows the title', saved.tag);
    if (dark) ok(saved.tag && saved.tag.color !== 'rgb(37, 46, 109)', 'dark mode: the tag is light, not navy on navy', saved.tag);
    if (!dark) await page.screenshot({ path: O + 'team-access-given.png' });
    await page.evaluate(() => [...document.querySelectorAll('.ta-person')].find(p => /Liz Lind/.test(p.textContent)).querySelector('.ta-title-btn').click()); await wait(300);
    await page.evaluate(() => [...document.querySelectorAll('.ta-titles button')].find(x => /No title/.test(x.textContent)).click()); await wait(700);
    ok(await page.evaluate(LIZ => !(__DB['hub-titles'] || {})[LIZ], LIZ), 'No title takes it back');
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
