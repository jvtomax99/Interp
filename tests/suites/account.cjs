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

const openMore = async page => { await page.evaluate(() => { openMoreSheet(); }); await wait(400);
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

  console.log('== second phone: the account\'s name wins');
  {
    const { page } = await L.boot(b, { device: 'iphone', name: 'Maria L', settle: 4500, access: { mode: 'locked', member: true, signedIn: true, uid: 'u1' },
      init: `try{ localStorage.setItem('ih_access_me_v1', ${JSON.stringify(ME)}); }catch(e){}` });
    await fakeServer(page, { accountName: 'Maria Lopez' });
    await serverWrites(page, 'Maria Lopez');
    await openMore(page);
    await page.fill('#acctEmail', 'maria@gmail.com'); await page.click('#acctSendBtn'); await wait(500);
    await page.fill('#acctCode', '482913'); await page.click('#acctCheckBtn'); await wait(900);
    const s = await page.evaluate(() => ({ who: whoAmI(), stored: localStorage.getItem('ih_myName') }));
    ok(s.who === 'Maria Lopez' && s.stored === 'Maria Lopez', 'this phone takes the account\'s name (and the photo filed under it)', s);
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
