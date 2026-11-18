/* Shared door check for the AI endpoints (translate, doctor-research,
 * term-lookup, term-check). The leading underscore keeps Vercel from serving
 * this file as an endpoint of its own.
 *
 * Every call to Claude costs money, so once the owner locks the Hub these
 * endpoints answer only phones that joined with the team code -- the same
 * people firestore.rules lets in.
 *
 *   Practice mode on (or nobody has claimed the Hub yet): anyone, as before.
 *   Locked: the request must carry the phone's Firebase sign-in token
 *           (Authorization: Bearer ...), and hub-members/{uid} must exist.
 *
 * No service account or Admin SDK is needed. Firestore itself checks the
 * token when we read hub-members/{uid} with it: a forged, expired or foreign
 * token is refused there, and firestore.rules only lets a phone read its own
 * member document.
 */

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'language-specialist';
const FIREBASE_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAvCLXI4RT8Ma_SpGzBIbx-U4zCTm12mKg';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

import { serviceToken } from './_service-login.js';

/* A ceiling on what one phone can spend in a day. Far above real use (a busy
 * interpreter makes a few dozen requests), so nobody meets it by working; it
 * is there so a lost phone or a runaway loop can't run up the bill. Counted
 * in ai-usage/{uid}_{day}, which phones can't read or write (no rule matches
 * it): only the server touches it, with its service account. If the count
 * can't be kept (no service account, Firestore trouble) the request goes
 * ahead: the limit must never be what breaks the tools. */
export const DAILY_LIMIT = 400;

export async function underDailyLimit(uid, { env = process.env, fetchImpl = fetch, now = Date.now() } = {}) {
  try {
    const token = await serviceToken(env, fetchImpl);
    if (!token) return true;
    const day = new Date(now).toISOString().slice(0, 10);
    const name = `projects/${PROJECT_ID}/databases/(default)/documents/ai-usage/${uid}_${day}`;
    const r = await fetchImpl(`${FS}:commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      // An update with an empty mask makes the document if it isn't there
      // yet (a phone's first request of the day) and changes nothing else.
      body: JSON.stringify({ writes: [{ update: { name, fields: {} }, updateMask: { fieldPaths: [] },
        updateTransforms: [{ fieldPath: 'n', increment: { integerValue: '1' } }] }] })
    });
    if (!r.ok) return true;
    const d = await r.json();
    const n = Number(d?.writeResults?.[0]?.transformResults?.[0]?.integerValue);
    return !(n > DAILY_LIMIT);
  } catch (e) { return true; }
}

const SETTINGS_TTL = 60 * 1000;
const MAX_REMEMBERED_TOKENS = 200;

// A warm function instance keeps these between requests, which saves a
// Firestore read per call; a cold one simply checks again.
let settings = null;                 // { practice, at }
const goodTokens = new Map();        // token -> time it stops being trusted

async function isPractice() {
  if (settings && Date.now() - settings.at < SETTINGS_TTL) return settings.practice;
  let practice;
  try {
    const r = await fetch(`${FS}/hub-access/settings?key=${FIREBASE_KEY}`);
    if (r.status === 404) practice = true;           // nobody has claimed the Hub yet
    else if (r.ok) {
      const doc = await r.json();
      practice = doc?.fields?.practice?.booleanValue !== false;
    }
  } catch (e) { /* network trouble: fall through */ }
  if (practice === undefined) {
    // Could not tell. Keep the last answer if there is one; otherwise ask
    // for a member token, which a teammate's phone always has.
    return settings ? settings.practice : false;
  }
  settings = { practice, at: Date.now() };
  return practice;
}

export function readToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : '';
}

export function claimsOf(token) {
  try {
    const part = token.split('.')[1];
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  } catch (e) { return null; }
}

async function isMemberToken(token) {
  const now = Date.now();
  const until = goodTokens.get(token);
  if (until && until > now) return true;

  const claims = claimsOf(token);
  const uid = claims && (claims.user_id || claims.sub);
  if (!uid || typeof uid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return false;

  let r;
  try {
    r = await fetch(`${FS}/hub-members/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch (e) { return false; }
  if (!r.ok) return false;

  // Trust it until the token itself expires (they last an hour), or ten
  // minutes, whichever is sooner -- so a removed teammate is cut off quickly.
  const exp = (claims.exp || 0) * 1000;
  if (goodTokens.size >= MAX_REMEMBERED_TOKENS) goodTokens.clear();
  goodTokens.set(token, Math.min(exp || now, now + 10 * 60 * 1000));
  return true;
}

/* Returns true when the request may go ahead. Otherwise it has already sent a
 * 401 the app knows how to explain, and the caller should just return. */
export async function allowTeam(req, res, { free = false, limitWith } = {}) {
  if (await isPractice()) return true;
  const token = readToken(req);
  if (token && await isMemberToken(token)) {
    if (free) return true;                 // costs nothing (notifications)
    const claims = claimsOf(token) || {};
    if (await underDailyLimit(claims.user_id || claims.sub, limitWith)) return true;
    res.status(429).json({
      error: 'daily_limit',
      message: 'This phone has reached today\u2019s limit for the AI tools. They work again tomorrow.'
    });
    return false;
  }
  res.status(401).json({
    error: 'members_only',
    message: 'This tool is for the interpreter team. Open the Hub and enter the team code.'
  });
  return false;
}
