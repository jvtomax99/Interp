/* Your account, email sign-in on the phone (features/account.js,
   docs/features/email-sign-in.md, phase E1), with /api/sign-in stood in for:
   More's card asks for an email, then the code; a wrong code says so; the
   code box survives the app restarting (going to Mail and back); the right
   code signs the phone in as the account, the account takes this phone's
   name (or gives its own); signing out puts the phone back in the team with
   its code; a phone that never joined is sent to the team code; inputs never
   zoom an iPhone, buttons take their own taps, dark mode reads. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'account/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const ACCT = 'acct_0123456789abcdef0123456789ab';
const ME = JSON.stringify({ member: true, uid: 'u1', code: 'TEAMCODE', role: 'member', kind: 'team', joinedAt: 1 });

// The server's side, as the phone sees it.
async function fakeServer(page, { accountName = '' } = {}) {
  const log = [];
  await page.route('**/api/sign-in', async r => {
    const b = JSON.parse(r.request().postData() || '{}'); log.push(b);
    const auth = r.request().headers()['authorization'] || '';
    const j = (s, o) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(o) });
    if (!auth) return j(401, { error: 'join_first' });
    if (b.action === 'send') return /@/.test(b.email) ? j(200, { ok: true, expiresIn: 600 }) : j(400, { error: 'bad_email' });
    if (b.code !== '482913') return j(400, { error: 'wrong_code', left: 4 });
    return j(200, { ok: true, token: 'ticket:' + ACCT, uid: ACCT, role: 'member', name: accountName, email: b.email });
  });
  return log;
}
// What the server writes when the code is right: the account in the team, its record.
const serverWrites = (page, accountName) => page.evaluate(({ ACCT, accountName }) => {
  __DB['hub-members'][ACCT] = { invite: 'TEAMCODE', name: 'Team code', role: 'member', joinedAt: 1, lastSeen: 1 };
  __DB.accounts = __DB.accounts || {};
  __DB.accounts[ACCT] = Object.assign({ email: 'maria@gmail.com', createdAt: 1, lastSignIn: 1 }, accountName ? { name: accountName, nameAt: Date.now() + 1000 } : {});
}, { ACCT, accountName });

const openMore = async page => { await page.evaluate(() => { openMoreSheet(); moreSubOpen('account'); }); await wait(400);
  await page.evaluate(() => document.getElementById('acctMore').scrollIntoView({ block: 'center' })); await wait(250); };
const card = page => page.evaluate(() => {
  const c = document.getElementById('acctCard'); if (!c) return null;
  const vis = el => el && el.getBoundingClientRect().height > 0;
  const msg = document.getElementById('acctMsg');
  return { text: c.innerText.replace(/\s+/g, ' ').trim(), email: vis(document.getElementById('acctEmail')), code: vis(document.getElementById('acctCode')),
    msg: msg ? msg.textContent : '', bad: !!(msg && msg.classList.contains('is-bad')) };
});
// A button takes its own tap, at its centre.
const tapsItself = (page, sel) => page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return 'missing';
  const r = el.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return (at === el || el.contains(at)) && r.height >= 40 ? true : { h: r.height, at: at && at.className }; }, sel);

(async () => {
  const b = await L.chromium.launch();

  for (const [device, dark] of [['iphone', false], ['iphone', true], ['desktop', false]]) {
    const tag = device + (dark ? '-dark' : '');
    console.log('== ' + tag + ': sign in, the account takes this phone\'s name');
    const { page } = await L.boot(b, { device, dark, name: 'Ana Torres', settle: 4500, access: { mode: 'locked', member: true, signedIn: true, uid: 'u1' },
      init: `try{ if(!sessionStorage.getItem('__acctInit')){ localStorage.setItem('ih_access_me_v1', ${JSON.stringify(ME)}); sessionStorage.setItem('__acctInit','1'); } }catch(e){}` });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const log = await fakeServer(page);
    await openMore(page);
    let c = await card(page);
    ok(c && c.email && /Use one email on every phone/.test(c.text) && /Send me a code/.test(c.text), 'More shows "Your account": the email box and Send me a code', c);
    const fs = await page.evaluate(() => ['acctEmail'].map(id => parseFloat(getComputedStyle(document.getElementById(id)).fontSize)));
    ok(fs[0] >= 16, 'the email box is 16px or more (no iPhone zoom)', fs);
    ok(await tapsItself(page, '#acctSendBtn') === true, 'Send me a code takes its own tap');
    if (device === 'iphone' && !dark) await page.screenshot({ path: O + tag + '-1-email.png' });

    await page.fill('#acctEmail', 'nope'); await page.click('#acctSendBtn'); await wait(250);
    c = await card(page);
    ok(c.bad && /doesn't look right/.test(c.msg) && log.length === 0, 'a broken address is caught on the phone, nothing sent', c);
    ok(await page.evaluate(() => document.getElementById('acctEmail').value) === 'nope', 'and what you typed stays in the box to fix');

    await page.fill('#acctEmail', 'Maria@Gmail.com'); await page.click('#acctSendBtn'); await wait(500);
    c = await card(page);
    ok(log.length === 1 && log[0].action === 'send' && log[0].email === 'maria@gmail.com', 'the server is asked once, the address tidied', log);
    ok(c.code && /We sent a code to maria@gmail.com/.test(c.text) && /Spam or Junk/.test(c.text), 'the code box, the address, where else to look', c);
    const fc = await page.evaluate(() => { const i = document.getElementById('acctCode'); return { fs: parseFloat(getComputedStyle(i).fontSize), mode: i.inputMode, ac: i.autocomplete, focused: document.activeElement === i }; });
    ok(fc.fs >= 16 && fc.mode === 'numeric' && fc.ac === 'one-time-code', 'the code box: big digits, the number pad, the phone may offer the code from Mail', fc);
    ok(await tapsItself(page, '#acctCheckBtn') === true, 'Sign in takes its own tap');

    // Off to Mail and back: iOS may restart the app.
    if (device === 'iphone' && !dark) {
      await page.reload({ waitUntil: 'domcontentloaded' }); await wait(4500);
      await fakeServer(page);
      await openMore(page);
      c = await card(page);
      ok(c.code && /maria@gmail.com/.test(c.text), 'after the app restarts the code box is still there', c);
    }

    await page.fill('#acctCode', '111111'); await page.click('#acctCheckBtn'); await wait(400);
    c = await card(page);
    ok(c.bad && /isn't right. 4 tries left/.test(c.msg) && c.code, 'a wrong code: says so, how many tries are left, the box stays', c);
    if (device === 'iphone') await page.screenshot({ path: O + tag + '-2-code.png' });

    await serverWrites(page, '');
    await page.fill('#acctCode', '482913'); await page.click('#acctCheckBtn'); await wait(900);
    c = await card(page);
    const st = await page.evaluate(() => ({ uid: hubAuth.currentUser && hubAuth.currentUser.uid, me: readAccessMe(), acct: JSON.parse(localStorage.getItem('ih_account') || 'null'),
      name: (__DB.accounts[Object.keys(__DB.accounts)[0]] || {}).name, who: whoAmI() }));
    ok(/Signed in as maria@gmail.com/.test(c.text) && /Sign out of this phone/.test(c.text), 'the card: Signed in as, Sign out', c);
    ok(st.uid === ACCT && st.me.uid === ACCT && st.me.member && st.acct.uid === ACCT, 'this phone is the account now, still in the team', st);
    ok(st.name === 'Ana Torres' && st.who === 'Ana Torres', 'the account had no name: it takes this phone\'s', st);
    if (device === 'iphone') await page.screenshot({ path: O + tag + '-3-signed-in.png' });
    const dk = await page.evaluate(() => { const e = document.querySelector('#acctCard .acct-email'), card = document.getElementById('acctCard');
      return { ink: getComputedStyle(e).color, bg: getComputedStyle(card).backgroundColor }; });
    if (dark) ok(dk.bg !== 'rgb(255, 255, 255)' && dk.ink !== 'rgb(21, 28, 44)', 'dark mode: a dark card, light text', dk);

    // A name changed here goes to the account.
    await page.evaluate(() => accountSaveName('Ana T. Torres')); await wait(200);
    ok(await page.evaluate(() => __DB.accounts[Object.keys(__DB.accounts)[0]].name) === 'Ana T. Torres', 'a new name on this phone is saved to the account');

    // Sign out.
    await page.click('#acctOut'); await wait(200);
    c = await card(page);
    ok(/Sign out of this phone\?/.test(c.text) && /stays in the team/.test(c.text), 'sign out asks first, says the phone stays in the team', c);
    await page.click('#acctOutYes'); await wait(800);
    c = await card(page);
    const after = await page.evaluate(() => ({ uid: hubAuth.currentUser && hubAuth.currentUser.uid, me: readAccessMe(), acct: localStorage.getItem('ih_account'), who: whoAmI() }));
    ok(c.email && after.uid === 'u1' && after.me.member && after.me.uid === 'u1' && !after.acct, 'signed out: a plain phone again, in the team with its code', after);
    ok(after.who === 'Ana Torres', 'the name stays on this phone');
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }

  // A second phone under another name: it asks which one is you (accountPickSelf).
  for (const keep of ['account', 'phone']) {
    console.log('== second phone, another name: keep ' + (keep === 'phone' ? 'this phone\'s' : 'the account\'s'));
    const { page } = await L.boot(b, { device: 'iphone', name: 'Maria L', settle: 4500, access: { mode: 'locked', member: true, signedIn: true, uid: 'u1' },
      init: `try{ localStorage.setItem('ih_access_me_v1', ${JSON.stringify(ME)}); localStorage.setItem('ih_region', 'south'); }catch(e){}` });
    await fakeServer(page, { accountName: 'Maria Lopez' });
    await serverWrites(page, 'Maria Lopez');
    await page.evaluate(async ACCT => {
      await db.collection('team-members').doc('maria l').set({ name: 'Maria L', photo: 'drsmiley/base.webp', photoPath: null });
      __DB['account-sync'] = __DB['account-sync'] || {};
      __DB['account-sync'][ACCT] = { ih_region: 'north', at: 1 };
    }, ACCT);
    await openMore(page);
    await page.fill('#acctEmail', 'maria@gmail.com'); await page.click('#acctSendBtn'); await wait(500);
    await page.fill('#acctCode', '482913'); await page.click('#acctCheckBtn'); await wait(700);
    const sheet = await page.evaluate(() => {
      const ov = document.querySelector('.acct-pick'); if (!ov) return null;
      const o = [...ov.querySelectorAll('.acct-pick-opt')];
      return { text: ov.innerText.replace(/\s+/g, ' '), opts: o.map(x => x.dataset.keep), photo: o.map(x => x.querySelector('.acct-pick-av').classList.contains('has-photo')),
        z: +getComputedStyle(ov).zIndex, fs: o.map(x => parseFloat(getComputedStyle(x.querySelector('b')).fontSize)), h: o.map(x => x.getBoundingClientRect().height), focus: document.activeElement === o[0] };
    });
    ok(sheet && /Which one is you\?/.test(sheet.text) && /Maria L\b/.test(sheet.text) && /Maria Lopez/.test(sheet.text) && /practice from both is kept/.test(sheet.text),
      'signing in under another name asks which one is you, both names, practice kept', sheet);
    ok(sheet && sheet.opts.join() === 'phone,account' && sheet.photo[0] === true && sheet.photo[1] === false, 'this phone first, each with the photo filed under its name', sheet);
    ok(sheet && sheet.z > 2000 && sheet.h.every(h => h >= 44) && sheet.focus, 'above the team-code screen, big buttons, the first one focused', sheet);
    ok(await tapsItself(page, `.acct-pick-opt[data-keep="${keep}"]`) === true, 'the button takes its own tap');
    if (keep === 'phone') await page.screenshot({ path: O + 'iphone-4-which-one.png' });
    await page.click(`.acct-pick-opt[data-keep="${keep}"]`); await wait(1200);
    const s = await page.evaluate(ACCT => ({ who: whoAmI(), stored: localStorage.getItem('ih_myName'), acctName: __DB.accounts[ACCT].name, gone: !document.querySelector('.acct-pick'),
      region: localStorage.getItem('ih_region'), acctRegion: (__DB['account-sync'][ACCT] || {}).ih_region, flag: localStorage.getItem('ih_syncKeepMine'),
      signed: /Signed in as/.test((document.getElementById('acctCard') || {}).innerText || '') }), ACCT);
    if (keep === 'account') {
      ok(s.gone && s.who === 'Maria Lopez' && s.stored === 'Maria Lopez' && s.acctName === 'Maria Lopez', 'keep the account\'s: this phone takes its name (and the photo filed under it)', s);
      ok(s.region === 'north' && s.acctRegion === 'north', 'and the account\'s settings', s);
    } else {
      ok(s.gone && s.who === 'Maria L' && s.acctName === 'Maria L', 'keep this phone\'s: the account takes its name, so every phone does', s);
      ok(s.region === 'south' && s.acctRegion === 'south' && !s.flag, 'and its settings, sent to the account, once', s);
    }
    ok(s.signed, 'signed in either way', s);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }

  console.log('== second phone, the same name in other capitals: no question');
  {
    const { page } = await L.boot(b, { device: 'iphone', name: 'maria lopez', settle: 4500, access: { mode: 'locked', member: true, signedIn: true, uid: 'u1' },
      init: `try{ localStorage.setItem('ih_access_me_v1', ${JSON.stringify(ME)}); }catch(e){}` });
    await fakeServer(page, { accountName: 'Maria Lopez' });
    await serverWrites(page, 'Maria Lopez');
    await openMore(page);
    await page.fill('#acctEmail', 'maria@gmail.com'); await page.click('#acctSendBtn'); await wait(500);
    await page.fill('#acctCode', '482913'); await page.click('#acctCheckBtn'); await wait(900);
    const s = await page.evaluate(() => ({ who: whoAmI(), sheet: !!document.querySelector('.acct-pick') }));
    ok(!s.sheet && s.who === 'Maria Lopez', 'no sheet, the account\'s spelling', s);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }

  console.log('== the team-code screen: sign in with email');
  for (const dark of [false, true]) {
    const { page } = await L.boot(b, { device: 'iphone', dark, fresh: false, name: '', settle: 4500, access: { mode: 'practice' } });
    const log = [];
    await page.route('**/api/sign-in', async r => {
      const bd = JSON.parse(r.request().postData() || '{}'); log.push(bd);
      const j = (s, o) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(o) });
      if (bd.email !== 'maria@gmail.com') return j(404, { error: 'no_account' });
      if (bd.action === 'send') return j(200, { ok: true });
      if (bd.code !== '482913') return j(400, { error: 'wrong_code', left: 4 });
      return j(200, { ok: true, token: 'ticket:' + ACCT, uid: ACCT, role: 'member', name: 'Maria Lopez', email: bd.email });
    });
    await page.evaluate(() => { showAccessLock('join'); }); await wait(600);
    const link = await page.evaluate(() => { const b = document.getElementById('accessUseEmail'); const r = b.getBoundingClientRect();
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { text: b.textContent, own: at === b, h: r.height }; });
    ok(link.text === 'Have an account? Sign in with email' && link.own && link.h >= 44, 'the team-code screen offers "Have an account? Sign in with email", a full-size tap', link);
    await page.tap('#accessUseEmail'); await wait(300);
    let s = await page.evaluate(() => ({ team: document.getElementById('accessForm').getBoundingClientRect().height > 0 || document.getElementById('accessCode').getBoundingClientRect().height > 0,
      box: document.getElementById('accessEmail').getBoundingClientRect().height > 0,
      sub: document.getElementById('accessSub').textContent, fs: parseFloat(getComputedStyle(document.getElementById('acctLockEmail')).fontSize) }));
    ok(!s.team && s.box && /email you use on your other phone/.test(s.sub) && s.fs >= 16, 'it swaps to an email box (16px, no zoom), the line above says what to do', s);
    if (!dark) await page.screenshot({ path: O + 'lock-1-email.png' });
    await page.click('#accessEmail .access-skip'); await wait(250);
    s = await page.evaluate(() => ({ code: document.getElementById('accessCode').getBoundingClientRect().height > 0, box: document.getElementById('accessEmail').getBoundingClientRect().height > 0,
      sub: document.getElementById('accessSub').textContent }));
    ok(s.code && !s.box && /Type the team code/.test(s.sub), '"Use the team code instead" brings the team-code box back, and its line', s);
    await page.tap('#accessUseEmail'); await wait(300);
    await page.fill('#acctLockEmail', 'new@person.com'); await page.tap('#acctLockSendBtn'); await wait(500);
    s = await page.evaluate(() => ({ msg: document.getElementById('acctLockMsg').textContent, val: document.getElementById('acctLockEmail').value }));
    ok(/No account with that email yet/.test(s.msg) && /team code/.test(s.msg) && s.val === 'new@person.com', 'an email with no account: says to use the team code the first time, the email stays', s);
    await page.fill('#acctLockEmail', 'maria@gmail.com'); await page.tap('#acctLockSendBtn'); await wait(500);
    s = await page.evaluate(() => ({ note: (document.querySelector('.access-email-note') || {}).textContent || '', code: !!document.getElementById('acctLockCode'), auth: !!(hubAuth && hubAuth.currentUser) }));
    ok(/We sent a code to maria@gmail.com/.test(s.note) && s.code && s.auth, 'the code box; the phone signed in to Firebase first so the server can see it', s);
    if (!dark) await page.screenshot({ path: O + 'lock-2-code.png' }); else await page.screenshot({ path: O + 'lock-2-code-dark.png' });
    await page.fill('#acctLockCode', '000000'); await page.tap('#acctLockCheckBtn'); await wait(400);
    ok(/4 tries left/.test(await page.evaluate(() => document.getElementById('acctLockMsg').textContent)), 'a wrong code says so');
    await page.evaluate(ACCT => { __DB['hub-members'][ACCT] = { invite: 'TEAMCODE', name: 'Team code', role: 'member', joinedAt: 1, lastSeen: 1 }; __DB.accounts = { [ACCT]: { email: 'maria@gmail.com', name: 'Maria Lopez', nameAt: Date.now() + 1000 } }; }, ACCT);
    await page.fill('#acctLockCode', '482913'); await page.tap('#acctLockCheckBtn'); await wait(700);
    // This phone already goes by "Jose" (the harness's name): it asks which one is you, over the team-code screen.
    const pick = await page.evaluate(() => { const o = document.querySelector('.acct-pick .acct-pick-opt[data-keep="account"]'); if (!o) return null;
      const r = o.getBoundingClientRect(), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { onTop: o === at || o.contains(at) }; });
    ok(pick && pick.onTop, 'another name on this phone: "Which one is you?" shows above the team-code screen and takes its taps', pick);
    if (pick) { await page.tap('.acct-pick-opt[data-keep="account"]'); await wait(900); }
    s = await page.evaluate(() => ({ title: document.getElementById('accessTitle').textContent, happy: document.getElementById('accessLock').classList.contains('is-happy'),
      uid: hubAuth.currentUser.uid, me: readAccessMe(), who: whoAmI() }));
    ok(s.happy && /You're in, Maria!/.test(s.title) && s.uid === ACCT && s.me.member && s.me.uid === ACCT && s.who === 'Maria Lopez', 'the right code: "You\'re in, Maria!", this phone is her account, in the team, her name', s);
    await wait(2200);
    ok(await page.evaluate(() => document.getElementById('accessLock').hidden), 'and the Hub opens');
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }

  console.log('== a phone that never joined');
  {
    const { page } = await L.boot(b, { device: 'iphone', settle: 4500, access: { mode: 'practice' } });
    await page.evaluate(() => { try{ hideAccessLock(true); }catch(e){} });
    await openMore(page);
    const c = await card(page);
    ok(c && !c.email && /join the team with the team code/.test(c.text) && /Enter the team code/.test(c.text), 'no email box: first, the team code', c);
    ok(!page.__errors.length, 'no page errors', page.__errors);
    await page.close();
  }
  await b.close();
})();
