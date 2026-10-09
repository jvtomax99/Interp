/* The events watcher's own way into Firestore (api/check-events.js).
 * The leading underscore keeps Vercel from serving this file as an endpoint.
 *
 * Phones get in with the team code; the watcher runs on Vercel with nobody
 * signed in, so once the owner locks the Hub, firestore.rules refuses it. It
 * gets its own login instead: a Google service account, whose key lives only
 * in Vercel's settings, never in this repo or in the database.
 *
 *   FIREBASE_SERVICE_ACCOUNT  the whole JSON key file, pasted as the value
 *
 * With the key, each run trades a short signed note (a JWT, signed here with
 * the key) for a one-hour access token from Google, and sends that token with
 * every Firestore call. Requests made with a service account's token are
 * checked by Google Cloud permissions, not by firestore.rules, so the lock
 * doesn't stop them. Without the key, nothing changes: the watcher goes in
 * unsigned, which works only while practice mode is on.
 *
 * No Admin SDK and no new dependency: Node's own crypto signs the note.
 */

import { createSign } from 'node:crypto';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/datastore';

let cached = null;   // { token, until } -- a warm instance reuses it

// The key from Vercel's settings, or null when there isn't one (or it isn't
// a service account key). Never logged.
export function serviceAccount(env = process.env) {
  const raw = env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw || !String(raw).trim()) return null;
  let sa;
  try { sa = JSON.parse(raw); } catch (e) { throw new Error('FIREBASE_SERVICE_ACCOUNT is set but is not the JSON key file'); }
  if (!sa || sa.type !== 'service_account' || !sa.client_email || !sa.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is set but is not a service account key');
  }
  // Pasted keys sometimes arrive with their line breaks written as "\n".
  return { email: sa.client_email, key: String(sa.private_key).replace(/\\n/g, '\n'), project: sa.project_id || '' };
}

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

// The signed note Google trades for an access token.
export function signedAssertion(sa, nowSec = Math.floor(Date.now() / 1000)) {
  const head = b64url({ alg: 'RS256', typ: 'JWT' });
  const body = b64url({ iss: sa.email, scope: SCOPE, aud: TOKEN_URL, iat: nowSec, exp: nowSec + 3600 });
  const signer = createSign('RSA-SHA256');
  signer.update(`${head}.${body}`);
  return `${head}.${body}.${signer.sign(sa.key).toString('base64url')}`;
}

// An access token for Firestore, or null when no key is set. A key that is
// set but refused throws, so the run reports it instead of quietly writing
// unsigned (which the lock would refuse anyway).
export async function serviceToken(env = process.env, fetchImpl = fetch) {
  const sa = serviceAccount(env);
  if (!sa) return null;
  if (cached && cached.until > Date.now()) return cached.token;
  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signedAssertion(sa) }).toString()
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* not JSON */ }
  if (!res.ok || !data.access_token) {
    throw new Error(`Google refused the service account key (${res.status}${data.error ? ': ' + data.error : ''})`);
  }
  const life = Math.max(60, Number(data.expires_in) || 3600);
  cached = { token: data.access_token, until: Date.now() + (life - 60) * 1000 };
  return cached.token;
}

export function forgetServiceToken() { cached = null; }
