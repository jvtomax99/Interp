// The daily ceiling on one phone's AI requests (api/_hub-access.js,
// underDailyLimit), with Google and Firestore faked: no network, no real key.
import { generateKeyPairSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { underDailyLimit, DAILY_LIMIT } = await import(ROOT + '/api/_hub-access.js');
const { forgetServiceToken } = await import(ROOT + '/api/_service-login.js');
let fails = 0; const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (!c && d !== undefined ? ' ' + JSON.stringify(d) : '')); if (!c) fails++; };
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const SA = JSON.stringify({ type: 'service_account', project_id: 'language-specialist', client_email: 'x@language-specialist.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
const J = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
const counts = {}; const seen = []; let mode = 'ok';
const fetchImpl = async (url, opts = {}) => {
  url = String(url);
  if (url === 'https://oauth2.googleapis.com/token') return J(200, { access_token: 'svc', expires_in: 3600 });
  if (url.endsWith('/documents:commit')) {
    if (mode === 'down') return J(500, {});
    if (mode === 'throw') throw new Error('network');
    const w = JSON.parse(opts.body).writes[0].transform;
    seen.push({ doc: w.document, auth: opts.headers.Authorization });
    counts[w.document] = (counts[w.document] || 0) + 1;
    return J(200, { writeResults: [{ transformResults: [{ integerValue: String(counts[w.document]) }] }] });
  }
  return J(404, {});
};
const env = { FIREBASE_SERVICE_ACCOUNT: SA };
const day1 = Date.UTC(2026, 10, 18, 12), day2 = Date.UTC(2026, 10, 19, 0, 5);

forgetServiceToken();
let all = true;
for (let i = 0; i < DAILY_LIMIT; i++) all = (await underDailyLimit('phoneA', { env, fetchImpl, now: day1 })) && all;
ok(all, `the first ${DAILY_LIMIT} requests of a day go ahead`);
ok(await underDailyLimit('phoneA', { env, fetchImpl, now: day1 }) === false, 'the next one is refused');
ok(await underDailyLimit('phoneB', { env, fetchImpl, now: day1 }) === true, 'another phone is not affected');
ok(await underDailyLimit('phoneA', { env, fetchImpl, now: day2 }) === true, 'the count starts again the next day');
ok(seen[0].doc.endsWith('/documents/ai-usage/phoneA_2026-11-18') && seen[0].auth === 'Bearer svc', 'counted in ai-usage/{phone}_{day} with the server\'s own login', seen[0]);
mode = 'down';  ok(await underDailyLimit('phoneA', { env, fetchImpl, now: day1 }) === true, 'Firestore refusing the count never blocks the tools');
mode = 'throw'; ok(await underDailyLimit('phoneA', { env, fetchImpl, now: day1 }) === true, 'a network failure never blocks the tools');
mode = 'ok'; forgetServiceToken();
const before = seen.length;
ok(await underDailyLimit('phoneA', { env: {}, fetchImpl, now: day1 }) === true && seen.length === before, 'with no service account nothing is counted and the request goes ahead');
process.exit(fails ? 1 : 0);
