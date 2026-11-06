// Email sign-in's server (api/sign-in.js, api/_mail.js, customToken in
// api/_service-login.js), with Firestore, Google's token service and Gmail
// faked: no network. docs/features/email-sign-in.md.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const S = await import(ROOT + '/api/sign-in.js');
const M = await import(ROOT + '/api/_mail.js');
const L = await import(ROOT + '/api/_service-login.js');
let fails = 0; const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (!c && d !== undefined ? ' ' + JSON.stringify(d).slice(0, 400) : '')); if (!c) fails++; };
const err0 = console.error; const logged = []; console.error = (...a) => logged.push(a.join(' '));

// A service account key made here, and the env the server reads.
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = { type: 'service_account', client_email: 'hub@language-specialist.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }), project_id: 'language-specialist' };
const ENV = { FIREBASE_SERVICE_ACCOUNT: JSON.stringify(SA), GMAIL_USER: 'humc.interp.hub@gmail.com', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' };

// Fake Firestore (REST): documents as plain objects; a phone token 'tok-<uid>'
// may read only its own hub-members document; the service token reads all.
function world() {
  const docs = new Map();
  const typedToPlain = (f) => { const o = {}; for (const [k, v] of Object.entries(f || {})) o[k] = 'integerValue' in v ? Number(v.integerValue) : 'booleanValue' in v ? v.booleanValue : v.stringValue; return o; };
  const plainToTyped = (o) => { const f = {}; for (const [k, v] of Object.entries(o)) f[k] = typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) }; return f; };
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    const method = opts.method || 'GET';
    const auth = (opts.headers || {}).Authorization || '';
    if (url.startsWith('https://oauth2.googleapis.com/token')) return new Response(JSON.stringify({ access_token: 'svc', expires_in: 3600 }), { status: 200 });
    const u = new URL(url);
    const p = decodeURIComponent(u.pathname.split('/documents/')[1] || '');
    calls.push({ method, p, auth });
    const isSvc = auth === 'Bearer svc';
    if (!isSvc) {
      const uid = auth.replace('Bearer tok-', '');
      if (!(method === 'GET' && p === `hub-members/${uid}`)) return new Response('{}', { status: 403 });
    }
    if (method === 'GET') return docs.has(p) ? new Response(JSON.stringify({ fields: plainToTyped(docs.get(p)) }), { status: 200 }) : new Response('{}', { status: 404 });
    if (method === 'DELETE') { docs.delete(p); return new Response('{}', { status: 200 }); }
    if (method === 'PATCH') {
      const body = typedToPlain(JSON.parse(opts.body).fields);
      const mask = u.searchParams.getAll('updateMask.fieldPaths');
      docs.set(p, mask.length ? { ...(docs.get(p) || {}), ...Object.fromEntries(mask.map(k => [k, body[k]])) } : body);
      return new Response('{}', { status: 200 });
    }
    return new Response('{}', { status: 400 });
  };
  return { docs, fetchImpl, calls };
}

const phoneToken = (uid) => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b({ alg: 'RS256' })}.${b({ user_id: uid, sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
};
async function call(h, uid, body) {
  const out = { status: 0, body: null };
  const res = { status(s) { out.status = s; return this; }, json(b) { out.body = b; return this; } };
  const tok = phoneToken(uid);
  // The fake reads the Authorization header as 'Bearer tok-<uid>' for a phone, so translate.
  await h({ method: 'POST', headers: { authorization: `Bearer ${tok}` }, body }, res);
  return out;
}
// The handler sends the phone's real JWT on; the fake Firestore wants 'tok-<uid>'.
function wrap(w) {
  return async (url, opts = {}) => {
    const a = (opts.headers || {}).Authorization || '';
    const m = /^Bearer (.+\..+\..+)$/.exec(a);
    if (m) { const c = JSON.parse(Buffer.from(m[1].split('.')[1], 'base64url')); opts = { ...opts, headers: { ...opts.headers, Authorization: 'Bearer tok-' + c.user_id } }; }
    return w.fetchImpl(url, opts);
  };
}

function setup({ env = ENV, codes = [111111, 222222, 333333, 444444, 555555] } = {}) {
  const w = world();
  const sent = [];
  let clock = Date.parse('2026-11-06T15:00:00Z');
  const queue = [...codes];
  L.forgetServiceToken();
  const h = S.makeHandler({ fetchImpl: wrap(w), env, now: () => clock, random: () => queue.shift() ?? 999999,
    mail: async (cfg, m) => { sent.push({ cfg, ...m }); } });
  w.docs.set('hub-members/anonA', { invite: 'TEAMCODE', name: 'Team', role: 'member', joinedAt: 1, lastSeen: 1, device: 'iPhone', who: 'Maria Lopez' });
  w.docs.set('hub-members/anonB', { invite: 'TEAMCODE', name: 'Team', role: 'member', joinedAt: 2, lastSeen: 2, device: 'Android phone', who: 'Maria L' });
  w.docs.set('hub-members/ownerPhone', { invite: 'OWNERCOD', name: 'Owner', role: 'owner', joinedAt: 3, lastSeen: 3, device: 'iPhone', who: 'Jose Vazquez' });
  w.docs.set('hub-access/owner', { uid: 'ownerPhone', at: 3, name: 'Jose Vazquez' });
  return { w, h, sent, tick: (ms) => { clock += ms; } };
}

console.log('== Who may ask');
{
  const { h, sent } = setup();
  const r1 = await call(h, 'stranger', { action: 'send', email: 'maria@gmail.com' });
  ok(r1.status === 401 && r1.body.error === 'join_first' && sent.length === 0, 'a phone that never joined gets nothing sent', r1);
  const r2 = await call(h, 'anonA', { action: 'send', email: 'not an email' });
  ok(r2.status === 400 && r2.body.error === 'bad_email', 'a broken address is refused', r2);
  const r3 = await call(h, 'anonA', { action: 'nope' });
  ok(r3.status === 400, 'an unknown action is refused');
  const { h: h2 } = setup({ env: { FIREBASE_SERVICE_ACCOUNT: ENV.FIREBASE_SERVICE_ACCOUNT } });
  const r4 = await call(h2, 'anonA', { action: 'send', email: 'maria@gmail.com' });
  ok(r4.status === 503 && r4.body.error === 'not_set_up', 'no Gmail settings: "not switched on yet", not a crash', r4);
  const { h: h3 } = setup({ env: { GMAIL_USER: 'x@gmail.com', GMAIL_APP_PASSWORD: 'y' } });
  const r5 = await call(h3, 'anonA', { action: 'send', email: 'maria@gmail.com' });
  ok(r5.status === 503 && r5.body.error === 'not_set_up', 'no service account key: the same', r5);
}

console.log('== A code, the email, the right code');
{
  const { w, h, sent } = setup();
  const r = await call(h, 'anonA', { action: 'send', email: '  Maria@Gmail.com ' });
  ok(r.status === 200 && r.body.ok, 'the code is sent', r);
  ok(sent.length === 1 && sent[0].to === 'maria@gmail.com' && sent[0].subject === 'Your Hub code: 111111' && sent[0].text.includes('111111'), 'one email, to the tidied address, the code in the subject and the text', sent[0]);
  ok(sent[0].cfg.user === 'humc.interp.hub@gmail.com' && sent[0].cfg.pass === 'abcdefghijklmnop', 'from the Hub\'s Gmail, the app password with its spaces taken out');
  const saved = [...w.docs.entries()].find(([k]) => k.startsWith('sign-in-codes/e_'));
  ok(saved && !JSON.stringify(saved).includes('111111') && !JSON.stringify(saved).includes('maria'), 'the database holds neither the code nor the address, only hashes', saved);
  const wrong = await call(h, 'anonA', { action: 'check', email: 'maria@gmail.com', code: '000000' });
  ok(wrong.status === 400 && wrong.body.error === 'wrong_code' && wrong.body.left === 4, 'a wrong code: 4 tries left', wrong);
  const other = await call(h, 'anonB', { action: 'check', email: 'maria@gmail.com', code: '111111' });
  ok(other.status === 400 && other.body.error === 'other_phone', 'the right code from a different phone is refused', other);
  const right = await call(h, 'anonA', { action: 'check', email: 'maria@gmail.com', code: '111111' });
  ok(right.status === 200 && right.body.uid === S.accountIdFor('maria@gmail.com') && /^acct_[0-9a-f]{28}$/.test(right.body.uid), 'the right code: signed in as the account', right.body);
  ok(right.body.role === 'member' && right.body.email === 'maria@gmail.com', 'as a member, the address echoed back for "Signed in as"');
  const m = w.docs.get('hub-members/' + right.body.uid);
  ok(m && m.role === 'member' && m.invite === 'TEAMCODE' && m.who === 'Maria Lopez', 'the account is in the team, from this phone\'s place', m);
  const acct = w.docs.get('accounts/' + right.body.uid);
  ok(acct && acct.email === 'maria@gmail.com' && acct.createdAt, 'accounts/{id} made, with the address');
  const again = await call(h, 'anonA', { action: 'check', email: 'maria@gmail.com', code: '111111' });
  ok(again.status === 400 && again.body.error === 'expired', 'a code works once');

  // The ticket: a Firebase custom token, signed with the key.
  const [hd, bd, sg] = right.body.token.split('.');
  const head = JSON.parse(Buffer.from(hd, 'base64url')), claims = JSON.parse(Buffer.from(bd, 'base64url'));
  const v = crypto.createVerify('RSA-SHA256'); v.update(hd + '.' + bd);
  ok(v.verify(publicKey, Buffer.from(sg, 'base64url')), 'the ticket is signed by the service account key');
  ok(head.alg === 'RS256' && claims.iss === SA.client_email && claims.sub === SA.client_email && claims.uid === right.body.uid
    && claims.aud === 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit' && claims.exp - claims.iat === 3600,
    'its claims are Firebase\'s custom-token shape (RS256, iss = sub = the account, the Identity Toolkit audience, one hour)', claims);
}

console.log('== The second phone is the same person');
{
  const { w, h } = setup();
  await call(h, 'anonA', { action: 'send', email: 'maria@gmail.com' });
  const a = await call(h, 'anonA', { action: 'check', email: 'maria@gmail.com', code: '111111' });
  w.docs.set('accounts/' + a.body.uid, { ...w.docs.get('accounts/' + a.body.uid), name: 'Maria Lopez', nameAt: 5 });
  await call(h, 'anonB', { action: 'send', email: 'MARIA@gmail.com' });
  const b = await call(h, 'anonB', { action: 'check', email: 'maria@gmail.com', code: '222222' });
  ok(b.status === 200 && b.body.uid === a.body.uid, 'same email, other phone: the same account', b.body);
  ok(b.body.name === 'Maria Lopez', 'and it hands back the account\'s name, for that phone to take');
}

console.log('== The owner keeps the Hub');
{
  const { w, h } = setup();
  await call(h, 'ownerPhone', { action: 'send', email: 'jvtomax99@gmail.com' });
  const r = await call(h, 'ownerPhone', { action: 'check', email: 'jvtomax99@gmail.com', code: '111111' });
  ok(r.status === 200 && r.body.role === 'owner', 'signed in as owner', r.body);
  ok(w.docs.get('hub-members/' + r.body.uid).role === 'owner' && w.docs.get('hub-members/' + r.body.uid).invite === 'OWNERCOD', 'the account is in the team as owner');
  ok(w.docs.get('hub-access/owner').uid === r.body.uid && w.docs.get('hub-access/owner').name === 'Jose Vazquez', 'hub-access/owner points at the account now, the name untouched');
  // Then a team-code phone of his signs in: he stays owner.
  w.docs.set('hub-members/joseOldPhone', { invite: 'TEAMCODE', name: 'Team', role: 'member', joinedAt: 9, lastSeen: 9, device: 'iPad', who: 'Jose Vazquez' });
  await call(h, 'joseOldPhone', { action: 'send', email: 'jvtomax99@gmail.com' });
  const r2 = await call(h, 'joseOldPhone', { action: 'check', email: 'jvtomax99@gmail.com', code: '222222' });
  ok(r2.body.role === 'owner' && w.docs.get('hub-members/' + r2.body.uid).role === 'owner', 'a member phone signing in to the owner\'s account does not demote it', r2.body);
  ok(w.docs.get('hub-access/owner').uid === r.body.uid, 'and does not move hub-access/owner');
  // A member signing in never touches the owner's line.
  await call(h, 'anonA', { action: 'send', email: 'maria@gmail.com' });
  await call(h, 'anonA', { action: 'check', email: 'maria@gmail.com', code: '333333' });
  ok(w.docs.get('hub-access/owner').uid === r.body.uid, 'a teammate signing in leaves the owner alone');
}

console.log('== Limits');
{
  const { h, sent, tick } = setup();
  for (let i = 0; i < 3; i++) await call(h, 'anonA', { action: 'send', email: 'maria@gmail.com' });
  const r = await call(h, 'anonA', { action: 'send', email: 'maria@gmail.com' });
  ok(sent.length === 3 && r.status === 429 && r.body.error === 'too_many' && r.body.wait === 60, '3 codes an hour per address, then "try again in 60 minutes"', r.body);
  tick(61 * 60 * 1000);
  const r2 = await call(h, 'anonA', { action: 'send', email: 'maria@gmail.com' });
  ok(r2.status === 200, 'an hour later it works again');
  const last = await call(h, 'anonA', { action: 'check', email: 'maria@gmail.com', code: '111111' });
  ok(last.body.error === 'wrong_code', 'only the newest code counts (the older ones are replaced)');
  const { h: h2 } = setup();
  await call(h2, 'anonA', { action: 'send', email: 'x@y.com' });
  let fifth;
  for (let i = 0; i < 5; i++) fifth = await call(h2, 'anonA', { action: 'check', email: 'x@y.com', code: '000000' });
  ok(fifth.status === 400 && fifth.body.error === 'expired' && fifth.body.tooMany, 'the 5th wrong try spends the code', fifth.body);
  const sixth = await call(h2, 'anonA', { action: 'check', email: 'x@y.com', code: '111111' });
  ok(sixth.body.error === 'expired', 'then even the right code is refused: ask for a new one', sixth.body);
  const { h: h5 } = setup();
  await call(h5, 'anonA', { action: 'send', email: 'x@y.com' });
  for (let i = 0; i < 4; i++) await call(h5, 'anonA', { action: 'check', email: 'x@y.com', code: '000000' });
  const ok5 = await call(h5, 'anonA', { action: 'check', email: 'x@y.com', code: '111111' });
  ok(ok5.status === 200, '4 wrong, then right on the 5th: signed in', ok5.body.error);
  const { h: h3, tick: t3 } = setup();
  await call(h3, 'anonA', { action: 'send', email: 'late@y.com' });
  t3(11 * 60 * 1000);
  const late = await call(h3, 'anonA', { action: 'check', email: 'late@y.com', code: '111111' });
  ok(late.body.error === 'expired', 'after 10 minutes the code has run out', late.body);
  const { h: h4 } = setup();
  let r4;
  for (let i = 0; i < 11; i++) r4 = await call(h4, 'anonA', { action: 'send', email: `p${i}@y.com` });
  ok(r4.status === 429 && r4.body.wait === 0, '10 codes a day per phone', r4.body);
}

console.log('== Gmail\'s side (a fake mail server)');
{
  const got = [];
  const server = net.createServer(sock => {
    sock.setEncoding('utf8'); let buf = '', data = false, msg = '';
    sock.write('220 smtp.test ESMTP ready\r\n');
    sock.on('data', d => {
      buf += d; let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 2);
        if (data) { if (line === '.') { data = false; got.push({ msg }); sock.write('250 2.0.0 OK queued\r\n'); } else msg += line + '\n'; continue; }
        got.push(line);
        if (/^EHLO/.test(line)) sock.write('250-smtp.test\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        else if (/^AUTH PLAIN /.test(line)) sock.write(Buffer.from(line.slice(11), 'base64').toString() === '\0hub@gmail.com\0secretpass' ? '235 2.7.0 Accepted\r\n' : '535 5.7.8 Bad credentials\r\n');
        else if (/^MAIL FROM/.test(line) || /^RCPT TO/.test(line)) sock.write('250 OK\r\n');
        else if (line === 'DATA') { data = true; sock.write('354 Go ahead\r\n'); }
        else if (line === 'QUIT') { sock.write('221 bye\r\n'); sock.end(); }
      }
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const connect = () => net.connect({ host: '127.0.0.1', port });
  const cfg = { ...M.mailConfig({ GMAIL_USER: 'hub@gmail.com', GMAIL_APP_PASSWORD: 'secr etpa ss' }), host: '127.0.0.1', port };
  await M.sendMail(cfg, { to: 'maria@gmail.com', subject: 'Your Hub code: 482913', text: S.emailText('482913') + '\n.leading dot line' }, { connect });
  ok(got.includes('EHLO interp-hub') && got.includes('MAIL FROM:<hub@gmail.com>') && got.includes('RCPT TO:<maria@gmail.com>'), 'the conversation: EHLO, sign-in, from, to', got.filter(x => typeof x === 'string'));
  const m = got.find(x => x.msg).msg;
  ok(/Subject: Your Hub code: 482913/.test(m) && /From: "HUMC Interpreter Hub" <hub@gmail.com>/.test(m) && /To: <maria@gmail.com>/.test(m), 'the headers: who it\'s from, to, the subject', m.slice(0, 300));
  const b64 = m.split('\n\n').slice(1).join('').replace(/\n/g, '').replace(/^\.\./gm, '.');
  const text = Buffer.from(b64, 'base64').toString('utf8');
  ok(text.includes('482913') && text.includes('10 minutes'), 'the body reads right once decoded', text);
  let refused = null;
  try { await M.sendMail({ ...cfg, pass: 'wrong' }, { to: 'maria@gmail.com', subject: 's', text: 't' }, { connect }); } catch (e) { refused = e.message; }
  ok(refused && /refused at auth/.test(refused) && !/wrong/.test(refused), 'a wrong app password: the step and Gmail\'s words, never the password', refused);
  let bad = null; try { await M.sendMail(cfg, { to: 'x\r\nRCPT TO:<evil@x.com>', subject: 's', text: 't' }, { connect }); } catch (e) { bad = e.message; }
  ok(bad === 'bad recipient', 'an address with a line break in it is never sent (no injected commands)');
  ok(M.mailConfig({}) === null, 'no settings: no mail config');
  server.close();
}

console.error = err0;
if (logged.length) console.log('  (logged: ' + logged.length + ' line(s))');
console.log(fails ? `\n${fails} check(s) failed.` : '\nAll checks passed.');
process.exit(fails ? 1 : 0);
