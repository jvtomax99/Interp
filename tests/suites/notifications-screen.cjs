/* More → Notifications (docs/features/notifications.md): what it says on an
   iPhone in Safari (install first), off and on; the switches; owners' Send
   to the team and the request it sends; members never see it; From the team.
   The push itself is tested without a browser (push.mjs). */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';

async function open(b, { device = 'narrow', perm = 'default', ios = false, owner = false } = {}) {
  const { page } = await L.boot(b, { device, name: 'Jose Vazquez',
    init: ios ? `Object.defineProperty(navigator,'userAgent',{get:()=>'${IOS}'})` : `Object.defineProperty(Notification,'permission',{get:()=>'${perm}'})` });
  const posts = [];
  await page.route('**/api/push', r => {
    if (r.request().method() === 'POST') posts.push(JSON.parse(r.request().postData() || '{}'));
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(r.request().method() === 'GET' ? { publicKey: 'BAAA' } : { ok: true, sent: 3, phones: 4 }) });
  });
  await page.evaluate(async (owner) => {
    if (owner) window.isHubOwner = () => true;
    await db.collection('push-log').doc('a').set({ title: 'Staff meeting moved', body: 'Now Thursday at 2 pm.', from: 'Jose V', at: Date.now() - 3600e3 });
  }, owner);
  await L.go(page, 'notifications', 1500);
  return { page, posts };
}
const read = page => page.evaluate(() => ({
  state: pushState(), status: (document.querySelector('.nt-status h3') || {}).textContent || '',
  turnOn: !!document.querySelector('.nt-status .btn-primary'), send: !!document.querySelector('.nt-send'),
  switches: [...document.querySelectorAll('.nt-kinds .ta-switch')].map(s => s.getAttribute('aria-checked')),
  log: [...document.querySelectorAll('.nt-item b')].map(x => x.textContent),
  fonts: [...document.querySelectorAll('.nt-send .ta-field')].map(f => parseFloat(getComputedStyle(f).fontSize)),
  wide: document.documentElement.scrollWidth > innerWidth,
  tile: getToolTiles().some(t => t.id === 'notifications')
}));

(async () => {
  const b = await L.chromium.launch();

  console.log('== iPhone in Safari');
  { const { page } = await open(b, { device: 'iphone', ios: true }); const r = await read(page);
    ok(r.state === 'install' && /Home Screen/.test(r.status) && !r.turnOn, 'says to add the Hub to the Home Screen first, no button that can\'t work', r);
    ok(r.tile && r.log[0] === 'Staff meeting moved' && !r.send, 'everyone has the screen and sees From the team; a member has no Send', r);
    ok(!page.__errors.length, 'no page errors', page.__errors); await page.context().close(); }

  console.log('== Off, an owner');
  { const { page, posts } = await open(b, { owner: true }); const r = await read(page);
    ok(r.state === 'off' && r.turnOn && r.switches.length === 3, 'off: Turn on notifications, three switches', r);
    ok(r.send && r.fonts.length === 2 && r.fonts.every(f => f >= 16) && !r.wide, 'Send to the team, inputs at 16px (no iPhone zoom), nothing wider than the screen', r);
    const hit = await page.evaluate(() => { const b = document.querySelector('.nt-send .btn-primary'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { mine: b === e || b.contains(e), h: r.height }; });
    ok(hit.mine && hit.h >= 44, 'Send notification takes its own tap, 44px tall', hit);
    await page.evaluate(() => { Notification.requestPermission = async () => 'granted'; Object.defineProperty(Notification, 'permission', { get: () => 'granted', configurable: true }); document.querySelectorAll('.nt-kinds .ta-switch')[1].click(); });
    await page.waitForTimeout(300);
    ok((await read(page)).switches[1] === 'true' && await page.evaluate(() => notifyCeEnabled), 'a switch turns its kind on');
    page.on('dialog', d => d.accept());
    await page.fill('#ntTitle', 'Meeting'); await page.fill('#ntBody', 'Room B at 2');
    await page.click('.nt-send .btn-primary'); await page.waitForTimeout(900);
    const sent = posts.find(p => p.kind === 'team');
    ok(sent && sent.title === 'Meeting' && sent.body === 'Room B at 2' && sent.from === 'Jose Vazquez', 'sends title, message and name to the server', posts);
    const note = await page.evaluate(() => ({ note: (document.querySelector('.nt-sent') || {}).textContent, title: document.getElementById('ntTitle').value }));
    ok(note.note === 'Sent to 3 of 4 phones.' && note.title === '', 'says how many phones it reached and clears the form', note);
    ok(!page.__errors.length, 'no page errors', page.__errors); await page.context().close(); }

  console.log('== Blocked, and on');
  { const { page } = await open(b, { perm: 'denied' }); const r = await read(page);
    ok(r.state === 'blocked' && /Blocked/.test(r.status) && !r.turnOn, 'blocked: says where to allow them', r); await page.context().close(); }
  { const { page } = await open(b, { perm: 'granted' });
    await page.evaluate(() => { PUSH.ready = true; PUSH.docId = 'a'.repeat(40); window.pushSync = async () => {}; renderContent(); });
    const r = await page.evaluate(() => ({ status: document.querySelector('.nt-status h3').textContent, btns: [...document.querySelectorAll('.nt-status .btn')].map(b => b.textContent) }));
    ok(r.status === 'On for this phone' && r.btns.join('|') === 'Send me a test|Turn off', 'on: Send me a test, Turn off', r); await page.context().close(); }

  console.log('== Opened from a notification');
  { const { page } = await L.boot(b, { device: 'narrow', query: '?open=chat' });
    const r = await page.evaluate(() => ({ cat: activeCategory, url: location.search }));
    ok(r.cat === 'chat' && r.url === '', '?open=chat opens Team Chat and tidies the address', r); await page.context().close(); }

  await b.close();
})();
