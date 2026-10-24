/* Titles under names in Team Chat (docs/features/team-access.md): Admin
   follows the phone that joined with the owner code (hub-admins/{uid} and
   the message's uid); Supervisor of Language Services is given by name, any
   of its spellings. A typed name never borrows an Admin title. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

(async () => {
  const b = await L.chromium.launch();
  console.log('== phone');
  const { page } = await L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 5000 });
  await page.evaluate(async () => {
    const now = Date.now();
    await db.collection('hub-admins').doc('owner-uid').set({ name: 'Ana Ortiz', at: now });
    const add = (id, author, min, uid) => db.collection('team-chat').doc(id).set(Object.assign({ text: 'Hello ' + id, author, timestamp: now - min * 60000, replyTo: null, attachment: null }, uid ? { uid } : {}));
    await add('t1', 'Liz Lind', 12);
    await add('t2', 'Ana Ortiz', 10, 'owner-uid');
    await add('t3', 'Maria Ruiz', 8);
    await add('t4', 'Ana Ortiz', 6, 'someone-else');
    await add('t5', 'elizabeth  LIND', 4);
    await add('t6', 'Liz Lind-Smith', 3);
    await add('t7', 'Ana Ortiz', 2);
    await add('t8', 'Fabiola', 1.5);
    await add('t9', 'fabiola  Grijalva', 1, 'her-phone');
    await add('t10', 'Fabiolas Bistro', 0.5);
    await add('t11', 'José Vázquez', 0.4, 'jose-phone');
    await add('t12', 'Jose V', 0.3);
    await add('t13', 'Jose', 0.2);
    await add('t14', 'Mr. Owner', 0.1, 'hub-owner-phone');
    ACCESS.ownerUid = 'hub-owner-phone';
  });
  await page.evaluate(() => setCategory('chat')); await page.waitForTimeout(1200);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.chat-author')].slice(-14).map(a => ({
    name: a.firstChild.textContent, title: (a.querySelector('.chat-title') || {}).textContent || '',
    kind: (a.querySelector('.chat-title') || { className: '' }).className })));
  const by = i => rows[i] || {};
  ok(by(0).title === 'Supervisor of Language Services' && /is-supervisor/.test(by(0).kind), 'Liz Lind: Supervisor of Language Services ribbon', by(0));
  ok(by(1).title === 'Administrator', 'the owner phone\'s message: Administrator', by(1));
  ok(by(2).title === '', 'a teammate: no title', by(2));
  ok(by(3).title === '', 'the same name from another phone: no Administrator title', by(3));
  ok(by(4).title === 'Supervisor of Language Services', 'Elizabeth Lind, any capitals and spaces: Supervisor', by(4));
  ok(by(5).title === 'Supervisor of Language Services', 'Liz Lind-Smith: Supervisor', by(5));
  ok(by(6).title === 'Administrator', 'an older message with no phone on it: Administrator by name', by(6));
  ok(by(7).title === 'Administrator', 'Fabiola, first name only: Administrator', by(7));
  ok(by(8).title === 'Administrator', 'Fabiola Grijalva, any capitals, any phone: Administrator', by(8));
  ok(by(9).title === '', 'a name that only starts with the letters: no title', by(9));
  ok(by(10).title === 'Developer', 'José Vázquez, accents and any phone: Developer', by(10));
  ok(by(11).title === 'Developer', 'Jose V: Developer', by(11));
  ok(by(12).title === '', 'plain "Jose" with no last name: no title', by(12));
  ok(by(13).title === 'Developer', 'the Hub owner\'s phone, whatever its name: Developer', by(13));
  const sent = await page.evaluate(async () => {
    const input = document.getElementById('chatInput') || document.querySelector('#tcPanel textarea, #tcPanel input[type=text]');
    if (!input) return 'no input';
    input.value = 'From this phone'; input.dispatchEvent(new Event('input', { bubbles: true }));
    await sendChatMessage(); await new Promise(r => setTimeout(r, 600));
    const m = Object.values(window.__DB['team-chat']).find(x => x.text === 'From this phone');
    return m ? { uid: m.uid || null, signedIn: !!(hubAuth && hubAuth.currentUser) } : 'not saved';
  }).catch(e => 'error ' + e.message);
  ok(sent && typeof sent === 'object' && (sent.signedIn ? !!sent.uid : sent.uid === null), 'a new message carries this phone (when signed in)', sent);
  ok(!page.__errors.length, 'no page errors', page.__errors);

  console.log('== the hello on Home');
  const hello = async (name, device) => {
    const { page: hp } = await L.boot(b, { device: device || 'iphone', name, settle: 9000, reducedMotion: true });
    const r = await hp.evaluate(() => { const box = s => { const e = document.querySelector('#content ' + s); return e && e.getBoundingClientRect(); };
      const t = box('.home-hello-title'), h = box('.home-heartline'), p = box('.home-body'), q = box('.home-greeting-quote'), g = box('.home-greeting');
      // clear of him: the title's box and his (full-length at the bottom right since 2026-10-24) do not overlap
      const apart = (a, b) => a.right <= b.left + 1 || a.left >= b.right - 1 || a.bottom <= b.top + 1 || a.top >= b.bottom - 1;
      return { text: (document.querySelector('#content .home-hello-title') || {}).textContent || '',
        clear: !t || (apart(t, p) && t.bottom <= q.top - 4 && t.left >= g.left + 8 && t.top >= h.bottom - 2),
        under: !t || (t.left <= (h.left + h.right) / 2 && t.right >= (h.left + h.right) / 2) }; });
    await hp.context().close(); return r;
  };
  const f = await hello('Fabiola Grijalva');
  ok(f.text === 'Administrator' && f.clear && f.under, 'Fabiola: Administrator under the heart line, clear of Dr. Smiley and the quote', f);
  const lz = await hello('Liz Lind', 'narrow');
  ok(lz.text === 'Supervisor of Language Services' && lz.clear && lz.under, 'Liz on a small phone: one line now that the name row is hers (he stands at the bottom right since 2026-10-24), clear of Dr. Smiley and the quote', lz);
  const ld = await hello('Liz Lind', 'desktop');
  ok(ld.text === 'Supervisor of Language Services' && ld.clear && ld.under, 'Liz on a computer: one line, clear', ld);
  const jv = await hello('Jose Vazquez');
  ok(jv.text === 'Developer' && jv.clear && jv.under, 'Jose Vazquez: Developer under the heart line', jv);
  const mr = await hello('Maria Ruiz');
  ok(mr.text === '', 'no title: nothing under the heart line', mr);

  console.log('== phone, joined with the team code');
  const { page: jp } = await L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 5000, access: { mode: 'locked', member: true, signedIn: true, uid: 'u1' } });
  const j = await jp.evaluate(async () => {
    try { localStorage.setItem('ih_access_me_v1', JSON.stringify({ member: true, uid: 'u1', code: 'TEAMCODE', role: 'member', kind: 'team', joinedAt: 1 })); } catch (e) {}
    setCategory('chat'); await new Promise(r => setTimeout(r, 1000));
    const input = document.getElementById('chatInput');
    if (!input) return 'no input';
    input.value = 'Signed in hello'; input.dispatchEvent(new Event('input', { bubbles: true }));
    await sendChatMessage(); await new Promise(r => setTimeout(r, 600));
    const m = Object.values(window.__DB['team-chat']).find(x => x.text === 'Signed in hello');
    return m ? { uid: m.uid || null, user: hubAuth && hubAuth.currentUser && hubAuth.currentUser.uid } : 'not saved';
  }).catch(e => 'error ' + e.message);
  ok(j && j.uid === 'u1', 'a signed-in phone\'s message carries its uid', j);
  ok(!jp.__errors.length, 'no page errors', jp.__errors);
  await b.close();
})();
