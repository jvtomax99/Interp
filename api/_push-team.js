/* Sending one notification to the team's phones (api/push.js for Team Chat
 * and owner notifications, api/check-events.js for new training). The leading
 * underscore keeps Vercel from serving this file as an endpoint.
 *
 * Each phone that turned notifications on keeps one document in push-subs/
 * (written by the app, pushSubscribe in index.html):
 *   endpoint, p256dh, auth   where and how to reach it (api/_webpush.js)
 *   uid, name, region        whose phone it is, so a sender isn't told about
 *                            their own message and regions stay quiet
 *   chat, ce                 what it asked for: Team Chat, new training.
 *                            Owner notifications reach every phone.
 * A phone the push service says is gone (uninstalled, notifications revoked)
 * has its document removed here.
 *
 * Firestore is read with the best login on hand: the service account
 * (api/_service-login.js), else the asking phone's own sign-in, else unsigned
 * (practice mode only).
 */

import { vapidKeys, sendPush, isPushEndpoint } from './_webpush.js';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'language-specialist';
const FIREBASE_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAvCLXI4RT8Ma_SpGzBIbx-U4zCTm12mKg';
export const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Firestore REST with a given token (or none: unsigned, with the app's key).
export function firestore(token, fetchImpl = fetch) {
  const url = (path, q = '') => token ? `${FS}/${path}${q ? '?' + q : ''}` : `${FS}/${path}?key=${FIREBASE_KEY}${q ? '&' + q : ''}`;
  const headers = (extra) => ({ ...(extra || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  return {
    get: (path) => fetchImpl(url(path), { headers: headers() }),
    list: (path, q) => fetchImpl(url(path, q), { headers: headers() }),
    create: (collection, id, fields) => fetchImpl(url(collection, id ? `documentId=${encodeURIComponent(id)}` : ''), {
      method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify({ fields })
    }),
    remove: (path) => fetchImpl(url(path), { method: 'DELETE', headers: headers() })
  };
}

// Firestore's typed values, both ways (only the kinds these documents use).
export function plain(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if ('stringValue' in v) out[k] = v.stringValue;
    else if ('integerValue' in v) out[k] = Number(v.integerValue);
    else if ('doubleValue' in v) out[k] = v.doubleValue;
    else if ('booleanValue' in v) out[k] = v.booleanValue;
    else if ('nullValue' in v) out[k] = null;
    else if ('arrayValue' in v) out[k] = (v.arrayValue.values || []).map(x => plain({ x }).x);
    else if ('mapValue' in v) out[k] = plain(v.mapValue.fields);
  }
  return out;
}
export function typed(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'boolean') out[k] = { booleanValue: v };
    else if (typeof v === 'number') out[k] = { integerValue: String(Math.round(v)) };
    else out[k] = { stringValue: String(v == null ? '' : v) };
  }
  return out;
}

// Every phone signed up, as plain objects with their document id.
export async function listSubscriptions(db) {
  const subs = [];
  let pageToken = '';
  for (let page = 0; page < 20; page++) {
    const res = await db.list('push-subs', `pageSize=300${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`);
    if (!res.ok) throw new Error(`push-subs read failed: ${res.status}`);
    const data = await res.json();
    for (const d of data.documents || []) {
      subs.push({ id: d.name.split('/').pop(), ...plain(d.fields) });
    }
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return subs;
}

const key = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

// Does this text @mention this name? (The app's messageMentions, for one name.)
export function mentions(text, name) {
  const n = String(name || '').trim();
  if (!n || !text) return false;
  return new RegExp('@' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text);
}

// Whether a phone should hear about this chat message.
export function wantsChat(sub, msg) {
  if (!sub.chat) return false;
  if (msg.uid && sub.uid && msg.uid === sub.uid) return false;        // their own phone
  if (key(msg.author) && key(msg.author) === key(sub.name)) return false;
  const ch = msg.channel === 'north' || msg.channel === 'south' ? msg.channel : 'all';
  return ch === 'all' || !sub.region || sub.region === ch || mentions(msg.text, sub.name);
}

/* Send `payload` (or payloadFor(sub)) to every phone `pick` keeps. Returns
 * { phones, sent, failed, removed }. Gone phones are deleted when `db` may. */
export async function pushToTeam(db, pick, payload, { fetchImpl = fetch, topic = '', urgency = 'high', env = process.env } = {}) {
  const keys = vapidKeys(env);
  if (!keys) return { phones: 0, sent: 0, failed: 0, removed: 0, notSetUp: true };
  const subs = (await listSubscriptions(db)).filter(s => isPushEndpoint(s.endpoint) && s.p256dh && s.auth && pick(s));
  let sent = 0, failed = 0, removed = 0;
  // Several at a time: a team is tens of phones, and each send is one request.
  const queue = subs.slice();
  const worker = async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const body = typeof payload === 'function' ? payload(s) : payload;
      const r = await sendPush({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, keys, { fetchImpl, topic, urgency });
      if (r.ok) { sent++; continue; }
      failed++;
      if (r.gone) {
        try { const d = await db.remove(`push-subs/${s.id}`); if (d.ok) removed++; } catch (e) {}
      } else {
        console.warn(`push failed (${new URL(s.endpoint).hostname}): ${r.status} ${r.error || ''}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(8, queue.length) }, worker));
  return { phones: subs.length, sent, failed, removed };
}

// One line a phone can show: clipped to fit inside one push (4 KB, encrypted).
export function clipText(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
}
