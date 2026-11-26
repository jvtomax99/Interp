// Check link's server half (api/link-check.js; docs/features/link-check.md).
// No real internet: the name look-up and the visit are swapped for tables,
// and the one real visit goes to a server started here on this machine.
import { generateKeyPairSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import zlib from 'node:zlib';
import path from 'node:path';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { checkLink, isPublicAddress, webAddress, pageTitle, fetchOnce, MAX_REDIRECTS, MAX_BYTES, MAX_TITLE, default: handler } = await import(ROOT + '/api/link-check.js');
const { DAILY_LIMIT } = await import(ROOT + '/api/_hub-access.js');
let fails = 0; const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (!c && d !== undefined ? ' ' + JSON.stringify(d) : '')); if (!c) fails++; };

/* A pretend internet. NAMES: what each site's name points to. PAGES: what
   each address answers. `visits` records every visit that was really made. */
const PUB = '93.184.216.34', PUB2 = '151.101.1.69';
const NAMES = {
  'good.example': [PUB], 'moved.example': [PUB], 'new.example': [PUB2], 'gone.example': [PUB], 'login.example': [PUB],
  'slow.example': [PUB], 'loop.example': [PUB], 'inside.example': ['10.0.0.5'], 'mixed.example': [PUB, '127.0.0.1'],
  'trick.example': [PUB], 'meta.example': ['169.254.169.254'], 'six.example': ['fd00::1'], 'temp.example': [PUB],
  'down.example': [PUB], 'pdf.example': [PUB], 'broken.example': [PUB], 'www.good.example': [PUB], 'ftp.example': [PUB],
};
const html = t => Buffer.from(`<!doctype html><html><head><meta charset="utf-8"><title>${t}</title></head><body>hi</body></html>`);
const H = { 'content-type': 'text/html; charset=utf-8' };
const PAGES = {
  'https://good.example/a': { status: 200, headers: H, body: html('Hypertension &amp; you') },
  'http://good.example/a': { status: 301, headers: { location: 'https://www.good.example/a/' } },
  'https://www.good.example/a/': { status: 200, headers: H, body: html('Hypertension') },
  'https://moved.example/old': { status: 301, headers: { location: 'https://new.example/new?x=1' } },
  'https://new.example/new?x=1': { status: 200, headers: H, body: html('The new home') },
  'https://temp.example/p': { status: 302, headers: { location: 'https://new.example/new?x=1' } },
  'https://gone.example/x': { status: 404, headers: H, body: html('Not here') },
  'https://gone.example/y': { status: 410, headers: H, body: html('Gone') },
  'https://login.example/': { status: 403, headers: H, body: html('Forbidden') },
  'https://down.example/': { status: 503, headers: H, body: html('Down') },
  'https://trick.example/': { status: 302, headers: { location: 'http://inside.example/admin' } },
  'https://trick.example/meta': { status: 301, headers: { location: 'http://169.254.169.254/latest/meta-data/' } },
  'https://trick.example/file': { status: 301, headers: { location: 'file:///etc/passwd' } },
  'https://trick.example/port': { status: 301, headers: { location: 'https://good.example:8443/a' } },
  'https://pdf.example/a.pdf': { status: 200, headers: { 'content-type': 'application/pdf' }, body: Buffer.from('%PDF-1.7 <title>not a title</title>') },
};
for (let i = 0; i < 10; i++) PAGES[`https://loop.example/${i}`] = { status: 302, headers: { location: `/${i + 1}` } };
let visits = [];
const resolve = async host => { if (!NAMES[host]) throw Object.assign(new Error('nope'), { code: 'ENOTFOUND' }); return NAMES[host].map(a => ({ address: a, family: a.includes(':') ? 6 : 4 })); };
const visit = async (url, address) => {
  visits.push({ url: url.href, address });
  if (url.hostname === 'slow.example') throw Object.assign(new Error('slow'), { code: 'TOO_SLOW' });
  if (url.hostname === 'broken.example') throw Object.assign(new Error('reset'), { code: 'ECONNRESET' });
  return PAGES[url.href] || { status: 404, headers: {}, body: Buffer.alloc(0) };
};
const check = async raw => { visits = []; return checkLink(raw, { resolve, visit }); };

console.log('== the four answers');
let r = await check('https://good.example/a');
ok(r.result === 'opens' && r.title === 'Hypertension & you' && r.newUrl === '', 'a page that loads: "opens", with its title as plain text', r);
r = await check('good.example/a');
ok(r.result === 'opens', 'an address typed with no https:// is checked as https, like the Hub opens it', r);
r = await check('http://good.example/a');
ok(r.result === 'opens' && r.newUrl === '', 'http to https, www added, a closing slash: still "opens", not "moved"', r);
r = await check('https://moved.example/old');
ok(r.result === 'moved' && r.newUrl === 'https://new.example/new?x=1' && r.title === 'The new home', 'a permanent move to another address: "moved", with the new address', r);
r = await check('https://temp.example/p');
ok(r.result === 'opens' && r.newUrl === '', 'a temporary redirect is never offered as the new address', r);
r = await check('https://gone.example/x');
ok(r.result === 'not_found' && r.title === '', 'a 404: "not found", and the error page\'s title is not passed on', r);
r = await check('https://gone.example/y');
ok(r.result === 'not_found', 'a 410: "not found"', r);
r = await check('https://no-such-site.example/');
ok(r.result === 'not_found' && r.reason === 'no_site' && visits.length === 0, 'a site that does not exist: "not found", nothing visited', r);
r = await check('https://login.example/');
ok(r.result === 'unknown' && r.reason === 'refused', 'a site that refuses the Hub: "couldn\'t tell"', r);
r = await check('https://down.example/');
ok(r.result === 'unknown', 'a site error (503): "couldn\'t tell", not "not found"', r);
r = await check('https://slow.example/');
ok(r.result === 'unknown' && r.reason === 'too_slow', 'too slow: "couldn\'t tell"', r);
r = await check('https://broken.example/');
ok(r.result === 'unknown' && r.reason === 'no_answer', 'a dropped connection: "couldn\'t tell"', r);
r = await check('https://loop.example/0');
ok(r.result === 'unknown' && r.reason === 'too_many_redirects' && visits.length === MAX_REDIRECTS + 1, `more than ${MAX_REDIRECTS} redirects: "couldn't tell" after ${MAX_REDIRECTS + 1} visits`, { r, n: visits.length });
r = await check('https://pdf.example/a.pdf');
ok(r.result === 'opens' && r.title === '' && r.kind === 'pdf', 'a PDF: "opens", no title read out of it', r);

console.log('== places it must not reach');
for (const [raw, why] of [
  ['http://inside.example/', 'a name that points to a private address'],
  ['https://mixed.example/', 'a name with one public and one local address'],
  ['http://meta.example/latest/', 'a name that points to the cloud\'s own settings address'],
  ['http://six.example/', 'a name that points to a private IPv6 address'],
  ['http://127.0.0.1/', 'this machine, by number'],
  ['http://10.1.2.3/', 'a private address, by number'],
  ['http://169.254.169.254/latest/meta-data/', 'the cloud\'s own settings address'],
  ['http://[::1]/', 'this machine, IPv6'],
  ['http://[::ffff:10.0.0.1]/', 'a private address written the IPv6 way'],
  ['http://2130706433/', 'this machine written as one number'],
  ['http://0x7f.0.0.1/', 'this machine written in hex'],
  ['http://0.0.0.0/', 'the "any" address'],
]) {
  r = await check(raw);
  ok((r.result === 'unknown' && r.reason === 'not_allowed' || r.result === 'invalid') && visits.length === 0, `${why}: refused, nothing visited`, { raw, r, visits });
}
r = await check('https://trick.example/');
ok(r.result === 'unknown' && r.reason === 'not_allowed' && visits.length === 1 && visits[0].url === 'https://trick.example/', 'a public site that redirects to a private one: refused at the redirect, the private one never visited', { r, visits });
r = await check('https://trick.example/meta');
ok(r.result === 'unknown' && visits.length === 1, 'a redirect to the cloud\'s settings address: refused, never visited', { r, visits });
r = await check('https://trick.example/file');
ok(r.result === 'unknown' && r.reason === 'bad_redirect' && visits.length === 1, 'a redirect to a file: refused', r);
r = await check('https://trick.example/port');
ok(r.result === 'unknown' && r.reason === 'bad_redirect' && visits.length === 1, 'a redirect to an unusual port: refused', r);
ok(visits.every(v => v.address === PUB), 'every visit went to the address that was checked', visits);

r = await check('http://[::127.0.0.1]/');
ok(r.result !== 'opens' && visits.length === 0, 'this machine written as an IPv4 address inside an IPv6 one: refused, nothing visited', { r, visits });
NAMES['both.example'] = ['2606:4700::1111', PUB]; PAGES['https://both.example/'] = { status: 200, headers: H, body: html('Both') };
r = await check('https://both.example/');
ok(r.result === 'opens' && visits[0].address === PUB, 'a site with both kinds of address is visited at its IPv4 one', visits);

console.log('== the time limit');
let t1 = Date.now();
r = await checkLink('https://good.example/a', { resolve: () => new Promise(d => setTimeout(() => d([{ address: PUB, family: 4 }]), 3000)), visit, limitMs: 400 });
ok(r.result === 'unknown' && r.reason === 'too_slow' && Date.now() - t1 < 1500, `a slow name look-up counts against the limit (gave up after ${Date.now() - t1} ms of a 400 ms limit)`, r);
const lefts = [];
r = await checkLink('https://loop.example/0', { resolve, visit: async (u, a, o) => { lefts.push(o.timeoutMs); await new Promise(d => setTimeout(d, 60)); return PAGES[u.href]; }, limitMs: 5000 });
ok(lefts.length > 2 && lefts.every((v, i) => !i || v < lefts[i - 1]) && lefts[lefts.length - 1] <= 5000 - 60 * (lefts.length - 1) + 20, 'each redirect gets only the time that is left', lefts);
r = await checkLink('https://loop.example/0', { resolve, visit: async (u) => { await new Promise(d => setTimeout(d, 200)); return PAGES[u.href]; }, limitMs: 500 });
ok(r.result === 'unknown' && r.reason === 'too_slow', 'redirects that together run past the limit: "couldn\'t tell"', r);

console.log('== nothing about the address is logged');
const logged = []; const real = { log: console.log, error: console.error, warn: console.warn, info: console.info };
console.error = console.warn = console.info = (...a) => logged.push(a.join(' '));
console.log = (...a) => logged.push(a.join(' '));
for (const raw of ['https://secret-path.example/patient?id=123', 'https://good.example/a?token=abc', 'https://broken.example/x?y=secret', 'https://trick.example/', 'ftp://secret.example/']) await checkLink(raw, { resolve, visit });
Object.assign(console, real);
ok(logged.length === 0, 'the check itself writes nothing to the log', logged);

console.log('== not a web address');
for (const raw of ['', '   ', 'ftp://ftp.example/a', 'javascript:alert(1)', 'mailto:a@good.example', 'file:///etc/passwd', 'data:text/html,hi', 'https://user:pw@good.example/', 'https://good.example:22/', 'http://localhost/', 'https://' + 'a'.repeat(2100) + '.example/']) {
  r = await check(raw);
  ok(r.result === 'invalid' && visits.length === 0, `"${raw.slice(0, 34)}": not checked`, r);
}
ok(webAddress('https://good.example/a#part').href === 'https://good.example/a', 'the part after # is dropped');

console.log('== public or not');
ok(['8.8.8.8', '93.184.216.34', '2606:4700::1111', '172.32.0.1', '100.128.0.1'].every(isPublicAddress), 'public addresses pass');
const priv = ['::7f00:1', '::a00:1', '::127.0.0.1', '::ffff:a00:1', 'fec0::1', '3fff::1', '5f00::1', '10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.1.1', '127.0.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255', '198.18.0.1',
  '::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '64:ff9b::a00:1', '2001:db8::1', 'not-an-address', ''];
ok(priv.every(a => !isPublicAddress(a)), 'private, local and reserved addresses do not', priv.filter(isPublicAddress));

console.log('== the title');
const T = (t, headers = H) => pageTitle(headers, Buffer.from(`<html><head><title>${t}</title></head>`));
ok(T('  Heart \n  failure  ') === 'Heart failure', 'spaces and line breaks are tidied');
ok(T('A <b>bold</b> &lt;script&gt;alert(1)&lt;/script&gt; &#233; &#x1F600;') === 'A bold <script>alert(1)</script> é \u{1F600}', 'tags are dropped and codes become plain characters (the Hub escapes it again on screen)', T('A <b>bold</b> &lt;script&gt;alert(1)&lt;/script&gt; &#233; &#x1F600;'));
ok([...T('x'.repeat(500))].length === MAX_TITLE, `cut to ${MAX_TITLE} characters`);
ok(!/[‮​\u0000]/.test(T('safe‮ gnp.exe​\u0000')), 'invisible and direction-flipping characters are removed');
ok(pageTitle({ 'content-type': 'application/json' }, Buffer.from('<title>x</title>')) === '', 'nothing is read from a page that is not HTML');
const big = html('Compressed title ' + 'z'.repeat(50));
ok(pageTitle({ ...H, 'content-encoding': 'gzip' }, zlib.gzipSync(Buffer.concat([big, Buffer.alloc(200000, 97)])).subarray(0, 400)) .startsWith('Compressed title'), 'a compressed page cut short still gives its title');
ok(pageTitle({ ...H, 'content-encoding': 'br' }, zlib.brotliCompressSync(big)).startsWith('Compressed title'), 'a brotli page gives its title');
{ // A page made to unpack to something enormous costs little and gives no title.
  const bomb = zlib.brotliCompressSync(Buffer.alloc(256 * 1024 * 1024, 97));
  const gz = zlib.gzipSync(Buffer.alloc(64 * 1024 * 1024, 97));
  const m0 = process.memoryUsage().rss, t = Date.now();
  const b1 = pageTitle({ ...H, 'content-encoding': 'br' }, bomb), b2 = pageTitle({ ...H, 'content-encoding': 'gzip' }, gz);
  const grew = (process.memoryUsage().rss - m0) / 1048576, took = Date.now() - t;
  ok(b1 === '' && b2 === '' && took < 500 && grew < 40, `a ${bomb.length}-byte page that unpacks to 256 MB is not unpacked (${took} ms, ${Math.round(grew)} MB)`, { b1, b2, took, grew });
  const t2 = Date.now(); const slowTitle = pageTitle(H, Buffer.from('<title '.repeat(9300)));
  ok(slowTitle === '' && Date.now() - t2 < 150, `a page written to make the title search slow is not slow (${Date.now() - t2} ms)`);
}
ok(pageTitle({ ...H, 'content-encoding': 'gzip' }, Buffer.from('not gzip at all')) === '', 'a page that cannot be unpacked gives no title, no error');
ok(pageTitle({ 'content-type': 'text/html; charset=iso-8859-1' }, Buffer.from('<title>Espa\xf1ol</title>', 'latin1')) === 'Español', 'an older Spanish page (latin-1) reads correctly');

console.log('== one real visit, to a server on this machine');
let sawHeaders = null, sent = 0;
const server = http.createServer((q, s) => {
  sawHeaders = q.headers;
  if (q.url === '/big') { s.writeHead(200, H); const chunk = Buffer.alloc(16384, 97); const t = setInterval(() => { sent += chunk.length; if (!s.write(chunk) || sent > 4e6) { clearInterval(t); s.end(); } }, 1); s.on('close', () => clearInterval(t)); return; }
  if (q.url === '/hang') return;                       // never answers
  if (q.url === '/redir') { s.writeHead(302, { location: '/x' }); return s.end('<title>redirect body</title>'); }
  s.writeHead(200, H); s.end(html('Local page'));
});
await new Promise(d => server.listen(0, '127.0.0.1', d));
const port = server.address().port;
const U = p => new URL('http://pinned.example' + p);
let page = await fetchOnce(U('/ok'), '127.0.0.1', { port });
ok(page.status === 200 && pageTitle(page.headers, page.body) === 'Local page', 'the visit goes to the address it was given, whatever the name says (pinned)', { status: page.status });
ok(sawHeaders['accept-encoding'] === 'identity', 'the page is asked for unpacked');
ok(sawHeaders.host.startsWith('pinned.example') && !sawHeaders.cookie && !sawHeaders.authorization && !sawHeaders.referer, 'the site is sent its own name, and no cookie, sign-in or referrer', sawHeaders);
ok(!/interp|hackensack|humc|vercel/i.test(JSON.stringify(sawHeaders)), 'nothing in the request names the Hub or the hospital', sawHeaders);
page = await fetchOnce(U('/big'), '127.0.0.1', { port });
ok(page.body.length <= MAX_BYTES && page.body.length > 0, `a huge page is cut at ${MAX_BYTES / 1024} KB (${page.body.length} bytes kept)`);
page = await fetchOnce(U('/redir'), '127.0.0.1', { port });
ok(page.status === 302 && page.body.length === 0 && page.headers.location === '/x', 'a redirect is reported, not followed, and its body is not read');
let t0 = Date.now(), slow = null;
try { await fetchOnce(U('/hang'), '127.0.0.1', { port, timeoutMs: 300 }); } catch (e) { slow = e.code; }
ok(slow === 'TOO_SLOW' && Date.now() - t0 < 1500, 'a site that never answers is given up on at the time limit');
let refusedErr = null;
try { await fetchOnce(new URL('http://pinned.example:1/'), '127.0.0.1', { port: 1, timeoutMs: 1000 }); } catch (e) { refusedErr = e.code || 'err'; }
ok(!!refusedErr, 'a closed door is an error the check turns into "couldn\'t tell"', refusedErr);
server.close(); server.closeAllConnections?.();

console.log('== who may ask (the endpoint)');
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ type: 'service_account', project_id: 'language-specialist', client_email: 'x@language-specialist.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) });
const J = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
let count = 1, outside = [];
globalThis.fetch = async (url) => {
  url = String(url);
  if (url.includes('/hub-access/settings')) return J(200, { fields: { practice: { booleanValue: false } } });   // the Hub is locked
  if (url.includes('/hub-members/member1')) return J(200, {});
  if (url.includes('/hub-members/')) return J(403, {});
  if (url === 'https://oauth2.googleapis.com/token') return J(200, { access_token: 'svc', expires_in: 3600 });
  if (url.endsWith('/documents:commit')) return J(200, { writeResults: [{ transformResults: [{ integerValue: String(count) }] }] });
  outside.push(url); return J(404, {});
};
const tokenFor = uid => 'x.' + Buffer.from(JSON.stringify({ user_id: uid, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') + '.y';
const call = async (method, headers, body) => { const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } }; await handler({ method, headers, body }, res); return res; };
let res = await call('GET', {}, {});
ok(res.code === 405, 'only POST is answered');
res = await call('POST', {}, { url: 'ftp://x.example/' });
ok(res.code === 401 && res.body.error === 'members_only', 'with no team sign-in: refused before anything is looked at', res);
res = await call('POST', { authorization: 'Bearer ' + tokenFor('stranger') }, { url: 'ftp://x.example/' });
ok(res.code === 401, 'someone who is not in the team: refused', res);
res = await call('POST', { authorization: 'Bearer ' + tokenFor('member1') }, { url: 'ftp://x.example/' });
ok(res.code === 400 && res.body.error === 'not_web', 'a team member is let in (and told a non-web address is not one)', res);
res = await call('POST', { authorization: 'Bearer ' + tokenFor('member1') }, { url: 'http://127.0.0.1/' });
ok(res.code === 200 && res.body.result === 'unknown' && res.body.reason === 'not_allowed', 'a member asking for this machine gets "couldn\'t tell", nothing visited', res);
res = await call('POST', { authorization: 'Bearer ' + tokenFor('member1') }, {});
ok(res.code === 400, 'no address at all: a plain refusal, no crash', res);
count = DAILY_LIMIT + 1;
res = await call('POST', { authorization: 'Bearer ' + tokenFor('member1') }, { url: 'http://127.0.0.1/' });
ok(res.code === 429 && res.body.error === 'daily_limit', `past ${DAILY_LIMIT} requests in a day: refused, counted with the AI tools`, res);
ok(outside.length === 0, 'no request left for anywhere else', outside);
process.exit(fails ? 1 : 0);
