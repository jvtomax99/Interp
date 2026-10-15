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
    await db.collection('hub-admins').doc('owner-uid').set({ name: 'Jose Vazquez', at: now });
    const add = (id, author, min, uid) => db.collection('team-chat').doc(id).set(Object.assign({ text: 'Hello ' + id, author, timestamp: now - min * 60000, replyTo: null, attachment: null }, uid ? { uid } : {}));
    await add('t1', 'Liz Lind', 12);
    await add('t2', 'Jose Vazquez', 10, 'owner-uid');
    await add('t3', 'Maria Ruiz', 8);
    await add('t4', 'Jose Vazquez', 6, 'someone-else');
    await add('t5', 'elizabeth  LIND', 4);
    await add('t6', 'Liz Lind-Smith', 3);
    await add('t7', 'Jose Vazquez', 2);
  });
  await page.evaluate(() => setCategory('chat')); await page.waitForTimeout(1200);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.chat-author')].slice(-7).map(a => ({
    name: a.firstChild.textContent, title: (a.querySelector('.chat-title') || {}).textContent || '',
    kind: (a.querySelector('.chat-title') || { className: '' }).className })));
  const by = i => rows[i] || {};
  ok(by(0).title === 'Supervisor of Language Services' && /is-supervisor/.test(by(0).kind), 'Liz Lind: Supervisor of Language Services ribbon', by(0));
  ok(by(1).title === 'Admin', 'the owner phone\'s message: Admin', by(1));
  ok(by(2).title === '', 'a teammate: no title', by(2));
  ok(by(3).title === '', 'the same name from another phone: no Admin title', by(3));
  ok(by(4).title === 'Supervisor of Language Services', 'Elizabeth Lind, any capitals and spaces: Supervisor', by(4));
  ok(by(5).title === 'Supervisor of Language Services', 'Liz Lind-Smith: Supervisor', by(5));
  ok(by(6).title === 'Admin', 'an older message with no phone on it: Admin by name', by(6));
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
