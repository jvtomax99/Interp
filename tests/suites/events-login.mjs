import { generateKeyPairSync, createVerify } from 'node:crypto';
// The events watcher's own login (api/_service-login.js), with a throwaway
// key made here and Google and Firestore faked: no network, no real key.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { default: handler } = await import(ROOT + '/api/check-events.js');
const { forgetServiceToken, serviceAccount } = await import(ROOT + '/api/_service-login.js');
let fails = 0; const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (!c && d !== undefined ? ' ' + JSON.stringify(d) : '')); if (!c) fails++; };
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const SA = { type: 'service_account', project_id: 'language-specialist', client_email: 'ce-watcher@language-specialist.iam.gserviceaccount.com', private_key: pem };
const calls = [];
let tokenStatus = 200;
globalThis.fetch = async (url, opts = {}) => {
  url = String(url); calls.push({ url, opts });
  const J = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  if (url === 'https://oauth2.googleapis.com/token') {
    const p = new URLSearchParams(opts.body); const jwt = p.get('assertion'); const [h, b, sig] = jwt.split('.');
    const v = createVerify('RSA-SHA256'); v.update(h + '.' + b);
    const claims = JSON.parse(Buffer.from(b, 'base64url').toString());
    calls[calls.length - 1].jwt = { grant: p.get('grant_type'), valid: v.verify(publicKey, Buffer.from(sig, 'base64url')), claims, head: JSON.parse(Buffer.from(h, 'base64url').toString()) };
    return tokenStatus === 200 ? J(200, { access_token: 'ya29.test-token', expires_in: 3599, token_type: 'Bearer' }) : J(tokenStatus, { error: 'invalid_grant' });
  }
  if (url.startsWith('https://firestore.googleapis.com/')) {
    if ((opts.method || 'GET') === 'GET') return J(404, { error: { code: 404 } });
    return J(200, { name: 'x' });
  }
  if (url.includes('RSS')) return new Response('<rss><channel><item><title>Webinar A</title><link>https://x/a</link><guid>a</guid></item></channel></rss>', { status: 200 });
  return new Response('<html><body>Upcoming events list</body></html>', { status: 200 });
};
const run = async () => { let out = {}; const res = { status(c) { out.code = c; return this; }, json(o) { out.body = o; return this; } }; await handler({ headers: {} }, res); return out; };
const fsCalls = () => calls.filter(c => c.url.startsWith('https://firestore'));

console.log('== no key set (as today)');
delete process.env.FIREBASE_SERVICE_ACCOUNT; delete process.env.CRON_SECRET; calls.length = 0; forgetServiceToken();
let o = await run();
ok(o.code === 200 && /none/.test(o.body.login), 'runs unsigned and says so', o.body && o.body.login);
ok(fsCalls().length > 0 && fsCalls().every(c => /\?key=/.test(c.url) && !(c.opts.headers || {}).Authorization), 'every database call uses the public key, no token');
ok(!calls.some(c => c.url.includes('oauth2')), 'no Google login attempted');

console.log('== key set');
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(SA); calls.length = 0; forgetServiceToken();
o = await run();
const tok = calls.find(c => c.jwt);
ok(o.code === 200 && o.body.login === 'service account', 'runs with its own login', o.body);
ok(tok && tok.jwt.valid, 'the note is signed with the key (signature checks out with the public key)');
ok(tok && tok.jwt.grant === 'urn:ietf:params:oauth:grant-type:jwt-bearer' && tok.jwt.head.alg === 'RS256', 'standard JWT-bearer request, RS256');
ok(tok && tok.jwt.claims.iss === SA.client_email && tok.jwt.claims.aud === 'https://oauth2.googleapis.com/token' && tok.jwt.claims.scope === 'https://www.googleapis.com/auth/datastore' && tok.jwt.claims.exp - tok.jwt.claims.iat === 3600, 'claims: issuer, audience, Firestore scope, one hour', tok && tok.jwt.claims);
ok(fsCalls().length > 0 && fsCalls().every(c => !/\?key=/.test(c.url) && (c.opts.headers || {}).Authorization === 'Bearer ya29.test-token'), 'every database call carries the token, no public key', fsCalls().map(c => c.url).slice(0, 3));
ok(calls.filter(c => c.url.includes('oauth2')).length === 1, 'one login per run');
ok(!JSON.stringify(o.body).includes('PRIVATE KEY') && !JSON.stringify(o.body).includes('ya29'), 'the report never shows the key or the token');
calls.length = 0; o = await run();
ok(!calls.some(c => c.url.includes('oauth2')), 'a second run on a warm instance reuses the token');

console.log('== key with \\n written out (pasted)');
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ ...SA, private_key: pem.replace(/\n/g, '\\n') }); forgetServiceToken(); calls.length = 0;
o = await run(); ok(o.code === 200 && o.body.login === 'service account' && calls.find(c => c.jwt).jwt.valid, 'still signs correctly');

console.log('== key refused by Google');
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(SA); forgetServiceToken(); tokenStatus = 400; calls.length = 0;
o = await run();
ok(o.code === 500 && /refused/.test(o.body.login) && /invalid_grant/.test(o.body.error), 'stops with the reason', o.body);
ok(!fsCalls().length, 'writes nothing unsigned when the key is refused');
tokenStatus = 200;

console.log('== not a key');
process.env.FIREBASE_SERVICE_ACCOUNT = '{"hello":1}'; forgetServiceToken();
o = await run(); ok(o.code === 500 && /not a service account key/.test(o.body.error), 'a wrong value is reported', o.body);
process.env.FIREBASE_SERVICE_ACCOUNT = 'not json'; forgetServiceToken();
o = await run(); ok(o.code === 500 && /not the JSON key file/.test(o.body.error) && !o.body.error.includes('not json'), 'a non-JSON value is reported without echoing it', o.body);

console.log('== cron secret still required');
process.env.CRON_SECRET = 's3cret'; o = await run(); ok(o.code === 401, 'no secret, no run'); delete process.env.CRON_SECRET;
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
if (fails) process.exitCode = 1;
