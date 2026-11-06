/* Faces by account in Team Chat (docs/features/team-access.md, Jose,
   2026-11-06: "Jose V" is the same person as Jose Vazquez). A message from
   an email account shows the photo of the name that account goes by, under
   any name it was sent with. A plain team phone, or no phone on the
   message, keeps the exact-name match, so a typed name never borrows a face. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

(async () => {
  const b = await L.chromium.launch();
  console.log('== phone');
  const { page } = await L.boot(b, { device: 'iphone', name: 'Maria Ruiz', settle: 5000 });
  await page.evaluate(async () => {
    const now = Date.now();
    await db.collection('team-members').doc('jose vazquez').set({ name: 'Jose Vazquez', photo: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', photoPath: null });
    await db.collection('team-members').doc('ana rivera').set({ name: 'Ana Rivera', photo: 'data:image/gif;base64,R0lGODlhAQABAIAAAP8AAAAAACw=', photoPath: null });
    await db.collection('hub-admins').doc('acct_ana').set({ name: 'Ana Rivera', at: now });
    const add = (id, author, min, uid) => db.collection('team-chat').doc(id).set(Object.assign({ text: 'Hello ' + id, author, timestamp: now - min * 60000, replyTo: null, attachment: null }, uid ? { uid } : {}));
    // A teammate between each, so every message starts its own run (its own avatar).
    const rows = [
      ['f1', 'Jose Vazquez', 'acct_jose'],
      ['f2', 'Jose V', 'acct_jose'],
      ['f3', 'Jose V', 'team-phone'],
      ['f4', 'Jose V', null],
      ['f5', 'Ana R', 'acct_ana'],
      ['f6', 'Luis Mora', 'acct_luis'],
    ];
    let min = 30;
    for (const [id, author, uid] of rows) { await add(id, author, min, uid); await add(id + 'x', 'Teammate Pat', min - 1); min -= 2; }
  });
  await page.evaluate(() => setCategory('chat')); await page.waitForTimeout(1500);
  const got = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('.chat-bubble-row.them').forEach(r => {
      const text = (r.textContent || '').match(/Hello (f\d)\b/);
      const av = r.querySelector('.chat-avatar');
      if (!text || !av || text[1] in out) return;
      const st = getComputedStyle(av);
      out[text[1]] = { photo: st.backgroundImage.includes('data:image'), cls: av.classList.contains('has-photo'), color: av.style.backgroundColor || av.style.background };
    });
    out.joseColor = nameToColor('Jose Vazquez');
    out.joseVColor = nameToColor('Jose V');
    return out;
  });
  ok(got.f1 && got.f1.photo, 'Jose Vazquez, his own name: his photo', got.f1);
  ok(got.f2 && got.f2.photo && got.f2.cls, '"Jose V" from his account: his photo', got.f2);
  ok(got.f3 && !got.f3.photo, '"Jose V" from a plain team phone: no photo borrowed', got.f3);
  ok(got.f4 && !got.f4.photo, '"Jose V" with no phone on it: no photo borrowed', got.f4);
  ok(got.f5 && got.f5.photo, '"Ana R" from an account whose owner line says Ana Rivera: her photo', got.f5);
  ok(got.f6 && !got.f6.photo, 'an account with no photo anywhere: initials', got.f6);
  const hex = h => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255})`; };
  ok(got.f2 && got.joseColor !== got.joseVColor ? String(got.f2.color).includes(hex(got.joseColor)) : true, '"Jose V" from his account: his colour behind the photo', { f2: got.f2, want: got.joseColor });
  ok(!page.__errors.length, 'no page errors', page.__errors);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
