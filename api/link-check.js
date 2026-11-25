/* Vercel serverless function: does this address still open?
 *
 * WHY THIS EXISTS
 * A glossary term can carry a Source link. Nobody finds out a source has
 * died until an interpreter taps it between assignments and gets an error
 * page. A phone's browser may not open another site's page itself, so the
 * Hub's server does, and says one of four things: opens, moved, not found,
 * couldn't tell. (docs/features/link-check.md)
 *
 * IT ONLY SAYS WHETHER THE PAGE OPENS. Never that it is safe or correct.
 * No AI, nothing stored, and the address is never written to a log.
 *
 * THE RISKY PART
 * A server that opens any address a person types can be pointed at places
 * it should not reach. So, at the first address and again at every
 * redirect:
 *   - only http and https, only the usual ports, no name and password
 *     inside the address;
 *   - the site's name is looked up first and every address it answers
 *     with must be a public one (no private, local or reserved ranges);
 *   - the visit then goes to exactly the address that was checked (the
 *     look-up is pinned), so a site can't answer "public" to the check
 *     and "internal" to the visit;
 *   - at most 5 redirects, 8 seconds in all (Vercel stops at 10), the
 *     first 64 KB only, no cookies or sign-in sent;
 *   - the only text returned from the page is its title, as plain text
 *     cut to 120 characters.
 */

import dns from 'node:dns';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import { allowTeam } from './_hub-access.js';

export const MAX_REDIRECTS = 5;
export const TIME_LIMIT_MS = 8000;
export const MAX_BYTES = 64 * 1024;
export const MAX_TITLE = 120;
const MAX_URL = 2000;
const PORTS = new Set(['', '80', '443']);

// Every range that is not the public internet.
const NOT_PUBLIC = new net.BlockList();
[
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].forEach(([a, n]) => NOT_PUBLIC.addSubnet(a, n, 'ipv4'));
[
  ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['64:ff9b:1::', 48], ['100::', 64],
  ['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
].forEach(([a, n]) => NOT_PUBLIC.addSubnet(a, n, 'ipv6'));

export function isPublicAddress(address) {
  const kind = net.isIP(address);
  if (!kind) return false;
  if (kind === 4) return !NOT_PUBLIC.check(address, 'ipv4');
  // An IPv4 address written the IPv6 way (::ffff:10.0.0.1) is judged as IPv4.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return !NOT_PUBLIC.check(mapped[1], 'ipv4');
  if (/^::ffff:/i.test(address)) return false;
  return !NOT_PUBLIC.check(address, 'ipv6');
}

/* The address as the Hub would open it (the same rule as externalUrl() in
 * index.html: no scheme means https), or null when it is not a web address
 * this may visit. */
export function webAddress(raw) {
  let text = String(raw == null ? '' : raw).trim();
  if (!text || text.length > MAX_URL) return null;
  const scheme = text.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (scheme && !scheme[1].includes('.')) {
    if (!/^https?$/i.test(scheme[1])) return null;
  } else {
    text = 'https://' + text.replace(/^\/+/, '');
  }
  let url;
  try { url = new URL(text); } catch { return null; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;
  if (!PORTS.has(url.port)) return null;
  if (!url.hostname || !url.hostname.includes('.') && !url.hostname.includes(':')) return null;
  url.hash = '';
  return url;
}

const bareHost = url => url.hostname.replace(/^\[|\]$/g, '');

// Every address the name answers with; all of them must be public.
async function resolveHost(hostname) {
  const all = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  return all.map(a => ({ address: a.address, family: a.family }));
}

/* One visit, no redirects followed, to exactly `address`. Resolves with the
 * status, the headers and at most `maxBytes` of the page. */
export function fetchOnce(url, address, { timeoutMs = TIME_LIMIT_MS, maxBytes = MAX_BYTES, port } = {}) {
  return new Promise((resolve, reject) => {
    const family = net.isIP(address);
    const mod = url.protocol === 'https:' ? https : http;
    let done = false;
    const finish = (fn, v) => { if (done) return; done = true; clearTimeout(timer); fn(v); };
    const req = mod.request({
      protocol: url.protocol,
      hostname: bareHost(url),
      port: port || url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      agent: false,
      // Pinned: whatever asks, the answer is the address that was checked.
      lookup: (_host, opts, cb) => (opts && opts.all) ? cb(null, [{ address, family }]) : cb(null, address, family),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkCheck/1.0)',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    }, res => {
      const chunks = []; let size = 0;
      const end = () => finish(resolve, { status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).subarray(0, maxBytes) });
      // A redirect's own page is never read.
      if (res.statusCode >= 300 && res.statusCode < 400) { end(); req.destroy(); return; }
      res.on('data', c => { chunks.push(c); size += c.length; if (size >= maxBytes) { end(); req.destroy(); } });
      res.on('end', end);
      res.on('error', () => end());
    });
    const timer = setTimeout(() => { finish(reject, Object.assign(new Error('too slow'), { code: 'TOO_SLOW' })); req.destroy(); }, timeoutMs);
    req.on('error', err => finish(reject, err));
    req.end();
  });
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', reg: '®', copy: '©' };

/* The page's own name as plain text, or ''. Only an HTML page is read. */
export function pageTitle(headers, body) {
  const type = String(headers['content-type'] || '').toLowerCase();
  if (type && !/html|xml/.test(type)) return '';
  let bytes = body;
  const enc = String(headers['content-encoding'] || '').toLowerCase();
  try {
    // The page was cut at 64 KB, so the unpacking must accept a cut stream.
    if (enc.includes('br')) bytes = zlib.brotliDecompressSync(body, { finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH });
    else if (enc.includes('gzip')) bytes = zlib.gunzipSync(body, { finishFlush: zlib.constants.Z_SYNC_FLUSH });
    else if (enc.includes('deflate')) bytes = zlib.inflateSync(body, { finishFlush: zlib.constants.Z_SYNC_FLUSH });
  } catch { return ''; }
  const latin = /charset=["']?(iso-8859-1|windows-1252|latin1)/.test(type);
  const html = bytes.subarray(0, MAX_BYTES).toString(latin ? 'latin1' : 'utf8');
  const m = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);
  if (!m) return '';
  const text = m[1]
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d{1,7});/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (all, name) => ENTITIES[name.toLowerCase()] ?? all)
    // No control or invisible direction characters: this is shown as text.
    .replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿�]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return [...text].slice(0, MAX_TITLE).join('');
}
function safeChar(code) {
  try { return code > 31 && code <= 0x10ffff ? String.fromCodePoint(code) : ' '; } catch { return ' '; }
}

// The same page for a person: http or https, with or without www, with or
// without a closing slash. Anything else is a different address.
function sameForAPerson(a, b) {
  const host = u => u.hostname.toLowerCase().replace(/^www\./, '');
  const path = u => u.pathname.replace(/\/+$/, '');
  return host(a) === host(b) && path(a) === path(b) && a.search === b.search;
}

const couldntTell = reason => ({ result: 'unknown', reason, title: '', newUrl: '' });

/* The whole check. `resolve` and `visit` can be swapped in the tests so no
 * real site is touched; the rules between them are what is being tested. */
export async function checkLink(raw, { resolve = resolveHost, visit = fetchOnce, now = Date.now, limitMs = TIME_LIMIT_MS } = {}) {
  const first = webAddress(raw);
  if (!first) return { result: 'invalid', reason: 'not_web', title: '', newUrl: '' };
  const deadline = now() + limitMs;
  let url = first, allPermanent = true;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    // 1. Where does the name point, and is every answer public?
    const host = bareHost(url);
    let addresses;
    if (net.isIP(host)) addresses = [{ address: host, family: net.isIP(host) }];
    else {
      try { addresses = await resolve(host); }
      catch (err) {
        // The name is not registered anywhere: the site does not exist.
        if (err && (err.code === 'ENOTFOUND' || err.code === 'ENODATA')) return { result: 'not_found', reason: 'no_site', title: '', newUrl: '' };
        return couldntTell('lookup_failed');
      }
    }
    if (!addresses || !addresses.length) return { result: 'not_found', reason: 'no_site', title: '', newUrl: '' };
    if (!addresses.every(a => isPublicAddress(a.address))) return couldntTell('not_allowed');

    // 2. Visit exactly that address.
    const left = deadline - now();
    if (left <= 0) return couldntTell('too_slow');
    let page;
    try { page = await visit(url, addresses[0].address, { timeoutMs: left, maxBytes: MAX_BYTES }); }
    catch (err) { return couldntTell(err && err.code === 'TOO_SLOW' ? 'too_slow' : 'no_answer'); }

    // 3. A redirect: judge the next address from the start.
    const s = page.status;
    if ([301, 302, 303, 307, 308].includes(s)) {
      const to = page.headers && page.headers.location;
      let next = null;
      try { next = to ? new URL(String(to), url) : null; } catch { next = null; }
      next = next && webAddress(next.href);
      if (!next) return couldntTell('bad_redirect');
      // Only a permanent move is ever offered as "the new address": a
      // temporary one is often a sign-in or a cookie page.
      if (s !== 301 && s !== 308) allPermanent = false;
      url = next;
      continue;
    }

    if (s >= 200 && s < 300) {
      const title = pageTitle(page.headers || {}, page.body || Buffer.alloc(0));
      const type = String((page.headers || {})['content-type'] || '').toLowerCase();
      const kind = type.includes('pdf') ? 'pdf' : '';
      if (hop > 0 && allPermanent && !sameForAPerson(first, url)) return { result: 'moved', reason: '', title, newUrl: url.href, kind };
      return { result: 'opens', reason: '', title, newUrl: '', kind };
    }
    if (s === 404 || s === 410) return { result: 'not_found', reason: 'no_page', title: '', newUrl: '' };
    if (s === 401 || s === 403 || s === 407) return couldntTell('refused');
    return couldntTell('site_error');
  }
  return couldntTell('too_many_redirects');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Team members only, counted in the same daily ceiling as the AI tools.
  if (!(await allowTeam(req, res))) return;
  try {
    const out = await checkLink(req.body && req.body.url);
    if (out.result === 'invalid') return res.status(400).json({ error: 'not_web' });
    return res.status(200).json(out);
  } catch (err) {
    // The address is deliberately left out of the log.
    console.error('link-check failed:', err && err.code ? err.code : 'error');
    return res.status(200).json(couldntTell('no_answer'));
  }
}
