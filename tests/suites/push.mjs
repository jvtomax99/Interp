// Notifications that reach a closed phone (api/push.js, api/_webpush.js,
// api/_push-team.js), with Firestore and the push services faked: no network.
// The phone's side of the encryption is written here from RFC 8291 on its
// own, so a message the server seals has to open the way a real phone opens it.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const W = await import(ROOT + '/api/_webpush.js');
const T = await import(ROOT + '/api/_push-team.js');
const { default: push } = await import(ROOT + '/api/push.js');
let fails = 0; const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (!c && d !== undefined ? ' ' + JSON.stringify(d).slice(0, 400) : '')); if (!c) fails++; };
const warn0 = console.warn, err0 = console.error; const warns = []; console.warn = (...a) => warns.push(a.join(' ')); console.error = (...a) => warns.push(a.join(' '));

// A phone: its own key pair and secret, and the way it opens a push.
function phone(host = 'web.push.apple.com') {
  const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  return {
    ecdh, auth,
    sub: { endpoint: `https://${host}/${crypto.randomBytes(8).toString('hex')}`, keys: { p256dh: ecdh.getPublicKey('base64url'), auth: auth.toString('base64url') } },
    open(body) {
      const salt = body.subarray(0, 16), rs = body.readUInt32BE(16), idlen = body[20];
      const asPublic = body.subarray(21, 21 + idlen), sealed = body.subarray(21 + idlen);
      const shared = ecdh.computeSecret(asPublic);
      const info = Buffer.concat([Buffer.from('WebPush: info\0'), ecdh.getPublicKey(), asPublic]);
      const prk = crypto.createHmac('sha256', auth).update(shared).digest();
      const ikm = crypto.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest();
      const prk2 = crypto.createHmac('sha256', salt).update(ikm).digest();
      const cek = crypto.createHmac('sha256', prk2).update(Buffer.from('Content-Encoding: aes128gcm\0\x01')).digest().subarray(0, 16);
      const nonce = crypto.createHmac('sha256', prk2).update(Buffer.from('Content-Encoding: nonce\0\x01')).digest().subarray(0, 12);
      const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce);
      d.setAuthTag(sealed.subarray(sealed.length - 16));
      const plain = Buffer.concat([d.update(sealed.subarray(0, sealed.length - 16)), d.final()]);
      let end = plain.length - 1; while (end >= 0 && plain[end] === 0) end--;
      return { rs, idlen, delimiter: plain[end], text: plain.subarray(0, end).toString('utf8') };
    }
  };
}
const KEYS = { ...W.newVapidKeys(), subject: 'mailto:test@example.com' };
process.env.VAPID_PUBLIC_KEY = KEYS.publicKey; process.env.VAPID_PRIVATE_KEY = KEYS.privateKey; process.env.VAPID_SUBJECT = KEYS.subject;
delete process.env.FIREBASE_SERVICE_ACCOUNT;

console.log('== The sealed message opens on the phone (RFC 8291)');
{
  const p = phone();
  const msg = JSON.stringify({ title: 'Ana Torres', body: 'Room 4B · paciente llegó ñ' });
  const o = p.open(W.encryptPayload(p.sub, msg));
  ok(o.text === msg, 'the phone reads exactly what was sent, accents and all', o.text);
  ok(o.rs === 4096 && o.idlen === 65 && o.delimiter === 2, 'one record: size 4096, the server key inline, the last-record mark', o);
  const o2 = p.open(W.encryptPayload(p.sub, 'x'.repeat(3000)));
  ok(o2.text.length === 3000, 'a long message fits in one push');
  let threw = false; try { W.encryptPayload({ endpoint: p.sub.endpoint, keys: { p256dh: 'short', auth: 'x' } }, 'hi'); } catch (e) { threw = true; }
  ok(threw, 'a subscription with broken keys is refused');
  const other = phone(); let opened = true; try { other.open(W.encryptPayload(p.sub, msg)); } catch (e) { opened = false; }
  ok(!opened, 'another phone cannot open it');
}

console.log('== The signed note (VAPID, RFC 8292)');
{
  const a = W.vapidAuthorization('https://web.push.apple.com/abc/def', KEYS, 1000);
  const [, t, k] = /^vapid t=([^,]+), k=(.+)$/.exec(a) || [];
  const [h, b, s] = (t || '').split('.');
  const claims = JSON.parse(Buffer.from(b, 'base64url'));
  const pub = Buffer.from(KEYS.publicKey, 'base64url');
  const key = crypto.createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') }, format: 'jwk' });
  ok(crypto.verify('SHA256', Buffer.from(h + '.' + b), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url')), 'the signature checks out with our public key');
  ok(claims.aud === 'https://web.push.apple.com' && claims.exp === 1000 + 43200 && claims.sub === KEYS.subject, 'for that push service only, 12 hours, with our contact', claims);
  ok(k === KEYS.publicKey && JSON.parse(Buffer.from(h, 'base64url')).alg === 'ES256', 'carries the public key, ES256');
  let threw = false; try { W.vapidKeys({ VAPID_PUBLIC_KEY: 'abc', VAPID_PRIVATE_KEY: 'def' }); } catch (e) { threw = true; }
  ok(threw && W.vapidKeys({}) === null, 'keys that are not a P-256 pair are refused; none set means not set up');
  ok(W.isPushEndpoint('https://fcm.googleapis.com/fcm/send/x') && W.isPushEndpoint('https://web.push.apple.com/x') && !W.isPushEndpoint('https://evil.example.com/x') && !W.isPushEndpoint('http://web.push.apple.com/x'),
    'only real push services, over https');
}

// ---- The fake world: Firestore's REST API and the push services ----
let DB = {}; const pushes = []; let pushStatus = () => 201;
const J = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
const FS = 'https://firestore.googleapis.com/v1/projects/language-specialist/databases/(default)/documents/';
const PHONES = {};
// Firestore's typed values, lists and maps included (the app's photos list).
const deep = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? { arrayValue: { values: v.map(x => ({ mapValue: { fields: deep(x) } })) } } : T.typed({ v }).v]));
globalThis.fetch = async (url, opts = {}) => {
  url = String(url);
  if (url.startsWith(FS)) {
    const u = new URL(url); const p = decodeURIComponent(u.pathname.split('/documents/')[1]);
    const auth = (opts.headers || {}).Authorization || '';
    const method = opts.method || 'GET';
    if (p.startsWith('hub-members/')) {
      // Firestore checks the token itself: only the phone's own token reads its line.
      const uid = p.split('/')[1];
      if (auth !== `Bearer ${tokenFor(uid)}`) return J(403, {});
      return DB[p] ? J(200, { fields: deep(DB[p]) }) : J(404, {});
    }
    if (method === 'GET' && !p.includes('/')) {
      const docs = Object.keys(DB).filter(k => k.startsWith(p + '/')).map(k => ({ name: FS + k, fields: deep(DB[k]) }));
      return J(200, { documents: docs });
    }
    if (method === 'GET') return DB[p] ? J(200, { fields: deep(DB[p]) }) : J(404, {});
    if (method === 'POST') {
      const id = u.searchParams.get('documentId') || crypto.randomBytes(6).toString('hex');
      if (DB[p + '/' + id]) return J(409, { error: { status: 'ALREADY_EXISTS' } });
      DB[p + '/' + id] = T.plain(JSON.parse(opts.body).fields); return J(200, {});
    }
    if (method === 'DELETE') { delete DB[p]; return J(200, {}); }
  }
  const ph = Object.values(PHONES).find(x => x.sub.endpoint === url);
  if (ph) {
    const st = pushStatus(ph);
    pushes.push({ to: ph.name, headers: opts.headers, msg: st < 300 ? JSON.parse(ph.open(opts.body).text) : null });
    return new Response('', { status: st });
  }
  throw new Error('unexpected fetch ' + url);
};
const tokenFor = uid => ['e30', Buffer.from(JSON.stringify({ user_id: uid, exp: 9e9 })).toString('base64url'), 'sig'].join('.');
const call = async (method, body, uid) => {
  const out = {};
  const res = { status(c) { out.code = c; return this; }, json(o) { out.body = o; return this; }, setHeader() {} };
  await push({ method, body, headers: uid ? { authorization: 'Bearer ' + tokenFor(uid) } : {} }, res);
  return out;
};
const addPhone = async (name, data, host) => {
  const p = phone(host); p.name = name; PHONES[name] = p;
  const id = crypto.createHash('sha256').update(p.sub.endpoint).digest('hex').slice(0, 40);
  DB['push-subs/' + id] = { endpoint: p.sub.endpoint, p256dh: p.sub.keys.p256dh, auth: p.sub.keys.auth, uid: '', name, region: '', chat: true, ce: true, device: 'iPhone', at: 1, ...data };
  return id;
};
const reset = () => { DB = {}; pushes.length = 0; for (const k in PHONES) delete PHONES[k]; pushStatus = () => 201; warns.length = 0; };

console.log('== GET: the key a phone signs up with');
{
  reset();
  const r = await call('GET');
  ok(r.code === 200 && r.body.publicKey === KEYS.publicKey, 'answers our public key', r);
  const saved = process.env.VAPID_PRIVATE_KEY; delete process.env.VAPID_PRIVATE_KEY;
  const r2 = await call('GET'); const r3 = await call('POST', { kind: 'chat', id: 'm1' });
  ok(r2.body.publicKey === null && r3.code === 503 && r3.body.error === 'not_set_up', 'without the keys in Vercel: no key, and sends say not set up', [r2, r3]);
  process.env.VAPID_PRIVATE_KEY = saved;
}

console.log('== Team Chat: who hears about a message');
{
  reset();
  await addPhone('Ana', { uid: 'ana-phone', name: 'Ana Torres', region: 'north' });
  await addPhone('Beto', { uid: 'beto-phone', name: 'Beto Ruiz', region: 'north' }, 'fcm.googleapis.com');
  await addPhone('Caro', { uid: 'caro-phone', name: 'Caro Diaz', region: 'south' });
  await addPhone('Dana', { uid: 'dana-phone', name: 'Dana Gil', region: 'south' });
  await addPhone('Eva', { uid: 'eva-phone', name: 'Eva Paz', region: '', chat: false });
  await addPhone('Fede', { uid: '', name: 'Fede Luna', region: '' });
  DB['team-chat/m1'] = { text: 'Need help in 4B, @Dana Gil', author: 'Ana Torres', uid: 'ana-phone', channel: 'north', timestamp: Date.now() - 5000 };
  const r = await call('POST', { kind: 'chat', id: 'm1' }, 'ana-phone');
  const to = pushes.map(p => p.to).sort();
  ok(r.code === 200 && JSON.stringify(to) === JSON.stringify(['Beto', 'Dana', 'Fede']), 'North message: North (Beto), no region (Fede), the @mentioned South phone (Dana); not the sender, not South, not chat off', { to, r });
  const dana = pushes.find(p => p.to === 'Dana'), beto = pushes.find(p => p.to === 'Beto');
  ok(dana && dana.msg.title === 'Ana Torres mentioned you' && beto.msg.title === 'Ana Torres', 'a mention says so; the others see the sender', [dana && dana.msg, beto && beto.msg]);
  ok(beto.msg.body === 'Need help in 4B, @Dana Gil' && beto.msg.section === 'chat' && beto.msg.where === 'Team Chat · North', 'the text comes from the database, opens Team Chat', beto.msg);
  ok(beto.headers.Urgency === 'high' && beto.headers['Content-Encoding'] === 'aes128gcm' && /^vapid t=.+, k=/.test(beto.headers.Authorization) && beto.headers.TTL === '86400', 'sent urgent, sealed, signed, kept a day', beto.headers);
  pushes.length = 0;
  const again = await call('POST', { kind: 'chat', id: 'm1' }, 'beto-phone');
  ok(again.body.skipped === 'already_sent' && !pushes.length, 'asked twice (two phones, a retry): goes out once', again);
  DB['team-chat/m2'] = { text: 'old news', author: 'Ana Torres', timestamp: Date.now() - 3600 * 1000 };
  const old = await call('POST', { kind: 'chat', id: 'm2' }, 'ana-phone');
  ok(old.body.skipped === 'old' && !pushes.length, 'a message over 15 minutes old is not news', old);
  const missing = await call('POST', { kind: 'chat', id: 'nope' }, 'ana-phone');
  const bad = await call('POST', { kind: 'chat', id: '../hub-members/x' }, 'ana-phone');
  ok(missing.code === 404 && bad.code === 400, 'an unknown message, or an id that is a path: refused', [missing, bad]);
  DB['team-chat/m3'] = { text: '', author: 'Fede Luna', channel: '', timestamp: Date.now(), attachments: [{ mimeType: 'image/jpeg' }, { mimeType: 'image/png' }] };
  await call('POST', { kind: 'chat', id: 'm3' });
  const fromFede = pushes.map(p => p.to).sort();
  ok(!fromFede.includes('Fede') && fromFede.length === 4 && pushes[0].msg.body === 'Sent 2 photos', 'Everyone channel, photos only: all but the sender (matched by name, no phone id), "Sent 2 photos"', { fromFede, msg: pushes[0] && pushes[0].msg });
}

console.log('== Owner notifications');
{
  reset();
  await addPhone('Ana', { uid: 'ana-phone', name: 'Ana Torres' });
  await addPhone('Eva', { uid: 'eva-phone', name: 'Eva Paz', chat: false, ce: false });
  DB['hub-members/owner-phone'] = { role: 'owner', name: 'Jose V' };
  DB['hub-members/ana-phone'] = { role: 'member', name: 'Ana Torres' };
  const notOwner = await call('POST', { kind: 'team', title: 'Hi', body: 'x' }, 'ana-phone');
  const noLogin = await call('POST', { kind: 'team', title: 'Hi', body: 'x' });
  const forged = await (async () => { const out = {}; const res = { status(c) { out.code = c; return this; }, json(o) { out.body = o; return this; }, setHeader() {} };
    await push({ method: 'POST', body: { kind: 'team', title: 'x' }, headers: { authorization: 'Bearer ' + ['e30', Buffer.from(JSON.stringify({ user_id: 'owner-phone' })).toString('base64url'), 'forged'].join('.') } }, res); return out; })();
  ok(notOwner.code === 403 && noLogin.code === 403 && forged.code === 403 && !pushes.length, 'a member, no sign-in, or a forged owner token: refused, nothing sent', [notOwner.code, noLogin.code, forged.code]);
  const empty = await call('POST', { kind: 'team', title: ' ', body: '' }, 'owner-phone');
  ok(empty.code === 400, 'nothing written: refused');
  const r = await call('POST', { kind: 'team', title: 'Staff meeting moved', body: 'Now Thursday 2 pm, room B.', from: 'Jose V' }, 'owner-phone');
  ok(r.code === 200 && r.body.sent === 2 && r.body.phones === 2 && pushes.length === 2, 'the owner phone reaches every phone, chat switch or not', r);
  ok(pushes[0].msg.title === 'Staff meeting moved' && pushes[0].msg.body === 'Now Thursday 2 pm, room B.' && pushes[0].msg.section === 'notifications', 'title and message as written; opens Notifications', pushes[0].msg);
  const log = Object.entries(DB).filter(([k]) => k.startsWith('push-log/')).map(([, v]) => v);
  ok(log.length === 1 && log[0].title === 'Staff meeting moved' && log[0].uid === 'owner-phone' && log[0].sent === 2 && r.body.logged, 'kept in push-log for the screen', log);
  pushes.length = 0;
  await call('POST', { kind: 'team', title: 'T'.repeat(200), body: 'B'.repeat(2000) }, 'owner-phone');
  ok(pushes[0].msg.title.length === 80 && pushes[0].msg.body.length === 600, 'long text clipped to fit in a push (80 / 600)');
}

console.log('== Phones that are gone, and failures');
{
  reset();
  const gone = await addPhone('Gone', { uid: 'g' });
  await addPhone('Busy', { uid: 'b' });
  await addPhone('Fine', { uid: 'f' });
  DB['push-subs/planted'] = { endpoint: 'https://evil.example.com/collect', p256dh: 'x', auth: 'y', chat: true, ce: true };
  pushStatus = p => p.name === 'Gone' ? 410 : p.name === 'Busy' ? 500 : 201;
  DB['hub-members/owner-phone'] = { role: 'owner' };
  const r = await call('POST', { kind: 'team', title: 'Hi' }, 'owner-phone');
  ok(r.body.sent === 1 && r.body.failed === 2 && r.body.removed === 1, 'one gone, one failing, one fine: counted', r.body);
  ok(!DB['push-subs/' + gone] && Object.keys(DB).filter(k => k.startsWith('push-subs/')).length === 3, 'the gone phone is forgotten; the failing one kept');
  ok(!pushes.some(p => /evil/.test(p.to)) && r.body.phones === 3, 'an address that is not a push service is never fetched');
}

console.log('== A test to one phone, and new training');
{
  reset();
  const id = await addPhone('Ana', { uid: 'ana-phone' });
  await addPhone('Beto', { uid: 'beto-phone', ce: false });
  const t = await call('POST', { kind: 'test', id }, 'ana-phone');
  ok(t.code === 200 && pushes.length === 1 && pushes[0].to === 'Ana', 'the test goes to that phone only', t);
  const none = await call('POST', { kind: 'test', id: 'a'.repeat(40) }, 'ana-phone');
  ok(none.code === 404, 'a phone not signed up: told so');
  pushes.length = 0;
  const out = await T.pushToTeam(T.firestore(null), s => !!s.ce, { kind: 'ce', title: 'New from CHIA', body: 'Webinar', section: 'events' }, { topic: 'events', urgency: 'normal' });
  ok(out.sent === 1 && pushes[0].to === 'Ana' && pushes[0].headers.Topic === 'events' && pushes[0].headers.Urgency === 'normal', 'training: only phones that asked, replaceable, not urgent', { out, h: pushes[0] && pushes[0].headers });
}

console.warn = warn0; console.error = err0;
console.log(fails ? `\n${fails} failed` : '\nall passed');
process.exitCode = fails ? 1 : 0;
