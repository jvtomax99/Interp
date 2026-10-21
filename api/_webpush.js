/* Web Push: how the server wakes a closed phone (api/push.js, and the events
 * watcher in api/check-events.js). The leading underscore keeps Vercel from
 * serving this file as an endpoint.
 *
 * A phone that turns notifications on hands the app a subscription: an
 * address at Apple's, Google's or Mozilla's push service, plus two keys of
 * its own. To send, we
 *   1. encrypt the message to the phone's keys (RFC 8291, "aes128gcm"), so
 *      the push service carries it without being able to read it, and
 *   2. sign a short note with our own key pair (VAPID, RFC 8292), so the push
 *      service knows the message comes from the server the phone signed up
 *      with. Apple refuses anything unsigned.
 *
 *   VAPID_PUBLIC_KEY   the public half, base64url (65 bytes); phones need it
 *   VAPID_PRIVATE_KEY  the private half, base64url (32 bytes); never leaves Vercel
 *   VAPID_SUBJECT      a contact the push services can write to (mailto: or https:)
 *
 * No web-push package and no new dependency: Node's own crypto does all of
 * it, the same way api/_service-login.js signs its note.
 */

import { createECDH, createCipheriv, createPrivateKey, createSign, hkdfSync, randomBytes } from 'node:crypto';

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const unb64u = (s) => Buffer.from(String(s || ''), 'base64url');

// Our key pair from Vercel's settings, or null when it isn't set up yet.
export function vapidKeys(env = process.env) {
  const pub = String(env.VAPID_PUBLIC_KEY || '').trim();
  const priv = String(env.VAPID_PRIVATE_KEY || '').trim();
  if (!pub || !priv) return null;
  const p = unb64u(pub), d = unb64u(priv);
  if (p.length !== 65 || p[0] !== 4 || d.length !== 32) {
    throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are set but are not a P-256 key pair in base64url');
  }
  const subject = String(env.VAPID_SUBJECT || '').trim() || 'mailto:interpreter-hub@example.invalid';
  return { publicKey: pub, privateKey: priv, subject };
}

// A fresh pair, for setting up (node -e "import('./api/_webpush.js').then(m=>console.log(m.newVapidKeys()))").
export function newVapidKeys() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return { publicKey: b64u(ecdh.getPublicKey()), privateKey: b64u(ecdh.getPrivateKey()) };
}

function signingKey(keys) {
  const p = unb64u(keys.publicKey);
  return createPrivateKey({
    key: { kty: 'EC', crv: 'P-256', d: keys.privateKey, x: b64u(p.subarray(1, 33)), y: b64u(p.subarray(33, 65)) },
    format: 'jwk'
  });
}

// The signed note for one push service (RFC 8292). Good for 12 hours.
export function vapidAuthorization(endpoint, keys, nowSec = Math.floor(Date.now() / 1000)) {
  const aud = new URL(endpoint).origin;
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud, exp: nowSec + 12 * 3600, sub: keys.subject }));
  const signer = createSign('SHA256');
  signer.update(`${head}.${body}`);
  const sig = signer.sign({ key: signingKey(keys), dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${keys.publicKey}`;
}

// The message sealed for one phone (RFC 8291 over RFC 8188, one record).
// `salt` and `serverKeys` are only passed by the tests.
export function encryptPayload(sub, plaintext, { salt = randomBytes(16), serverKeys = null } = {}) {
  const uaPublic = unb64u(sub.keys && sub.keys.p256dh);
  const authSecret = unb64u(sub.keys && sub.keys.auth);
  if (uaPublic.length !== 65 || authSecret.length < 16) throw new Error('subscription keys are malformed');

  const ecdh = createECDH('prime256v1');
  if (serverKeys) ecdh.setPrivateKey(serverKeys);
  else ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(uaPublic);

  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]);
  const ikm = Buffer.from(hkdfSync('sha256', shared, authSecret, keyInfo, 32));
  const cek = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16));
  const nonce = Buffer.from(hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12));

  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  // 0x02 marks the last (and only) record.
  const sealed = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(plaintext), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);

  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, sealed]);
}

/* Send one message to one phone. Resolves to
 *   { ok: true }                      delivered to the push service
 *   { ok: false, gone: true }         the phone unsubscribed or the app was removed: forget it
 *   { ok: false, status, error }      anything else; keep the subscription
 * Never throws for a refused push, so one bad phone can't stop the rest. */
export async function sendPush(sub, payload, keys, { ttl = 24 * 3600, urgency = 'high', topic = '', fetchImpl = fetch } = {}) {
  let body;
  try {
    body = encryptPayload(sub, typeof payload === 'string' ? payload : JSON.stringify(payload));
  } catch (e) { return { ok: false, gone: true, error: e.message }; }
  const headers = {
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: String(ttl),
    Urgency: urgency,
    Authorization: vapidAuthorization(sub.endpoint, keys)
  };
  // A topic replaces a not-yet-delivered push with the same one (max 32 base64url chars).
  if (topic) headers.Topic = String(topic).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
  let res;
  try {
    res = await fetchImpl(sub.endpoint, { method: 'POST', headers, body });
  } catch (e) { return { ok: false, status: 0, error: e.message || 'network' }; }
  if (res.status >= 200 && res.status < 300) return { ok: true };
  if (res.status === 404 || res.status === 410) return { ok: false, gone: true, status: res.status };
  let error = '';
  try { error = (await res.text()).slice(0, 200); } catch (e) {}
  return { ok: false, status: res.status, error };
}

// Push service addresses we'll send to. Anything else in the list (a typo, a
// planted address) is never fetched by the server.
const PUSH_HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/,
  /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];
export function isPushEndpoint(endpoint) {
  try {
    const u = new URL(endpoint);
    return u.protocol === 'https:' && PUSH_HOSTS.some(re => re.test(u.hostname));
  } catch (e) { return false; }
}
