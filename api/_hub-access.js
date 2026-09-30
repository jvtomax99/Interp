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
    else if (r.status === 403) practice = true;      // access rules not published yet
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

function readToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : '';
}

function claimsOf(token) {
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
export async function allowTeam(req, res) {
  if (await isPractice()) return true;
  const token = readToken(req);
  if (token && await isMemberToken(token)) return true;
  res.status(401).json({
    error: 'members_only',
    message: 'This tool is for the interpreter team. Open the Hub and enter the team code.'
  });
  return false;
}
