/* Email sign-in: a 6-digit code by email, one account on every phone.
 * Spec: docs/features/email-sign-in.md (phase E1).
 *
 *   POST { action: 'send',  email }        emails a code to that address
 *   POST { action: 'check', email, code }  returns a Firebase sign-in ticket
 *
 * Both need the phone's own sign-in (Authorization: Bearer ...). A phone
 * that joined with the team code (hub-members/{uid}; Firestore itself checks
 * the token when we read that document with it, the same trick as
 * _hub-access.js) may ask for any address. A phone that hasn't joined (the
 * team-code screen's "Sign in with email") may ask only for an address whose
 * account is already in the team; its token is checked with Firebase's own
 * accounts:lookup. A first-timer still joins with the team code.
 *
 * Codes live in sign-in-codes/, which phones can't read or write (no rule
 * matches it); only this endpoint touches it, with the service account. A
 * code is kept as a salted hash, lasts 10 minutes, works only on the phone
 * that asked for it, and allows 5 tries. Limits: 3 codes per address per
 * hour, 10 per phone per day.
 *
 * On a right code the account id is made from the address (the same on every
 * phone), and the phone's place in the team moves to it: hub-members (team
 * or owner, whichever is higher), and hub-access/owner.uid when this phone
 * was the owner's, so signing in never locks the owner out.
 */

import crypto from 'node:crypto';
import { readToken, claimsOf } from './_hub-access.js';
import { serviceToken, serviceAccount, customToken } from './_service-login.js';
import { FS, plain, typed } from './_push-team.js';

const FIREBASE_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAvCLXI4RT8Ma_SpGzBIbx-U4zCTm12mKg';
const LOOKUP = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_KEY}`;
import { mailConfig, sendMail } from './_mail.js';

const CODE_LIFE_MS = 10 * 60 * 1000;
const MAX_TRIES = 5;
const PER_EMAIL_HOUR = 3;
const PER_PHONE_DAY = 10;

export function tidyEmail(v) {
  const e = String(v || '').trim().toLowerCase();
  return e.length <= 254 && /^[^\s@<>()",;:\\]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e) ? e : '';
}
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const accountIdFor = (email) => 'acct_' + sha('humc-hub-account:' + email).slice(0, 28);
const emailDoc = (email) => 'e_' + sha('humc-hub-code:' + email).slice(0, 40);
const codeHash = (salt, code) => sha(salt + ':' + code);

export function emailText(code) {
  return [
    `Your HUMC Interpreter Hub sign-in code is:`,
    ``,
    `    ${code}`,
    ``,
    `Type it into the Hub on the phone where you asked for it. It works for 10 minutes.`,
    ``,
    `Didn't ask for this? You can ignore this email. Nobody can sign in without the code.`
  ].join('\n');
}

/* The endpoint, with its outside world passed in so the test can fake it. */
export function makeHandler({ fetchImpl = fetch, mail = sendMail, env = process.env, now = () => Date.now(), random = () => crypto.randomInt(0, 1000000) } = {}) {
  const doc = (token) => {
    const H = (extra) => ({ ...(extra || {}), Authorization: `Bearer ${token}` });
    return {
      get: async (path) => {
        const r = await fetchImpl(`${FS}/${path}`, { headers: H() });
        if (r.status === 404) return null;
        if (!r.ok) throw Object.assign(new Error(`read ${path.split('/')[0]} ${r.status}`), { status: r.status });
        const d = await r.json();
        return plain(d.fields);
      },
      set: async (path, obj, mask) => {
        const q = mask ? '?' + mask.map(f => 'updateMask.fieldPaths=' + encodeURIComponent(f)).join('&') : '';
        const r = await fetchImpl(`${FS}/${path}${q}`, { method: 'PATCH', headers: H({ 'Content-Type': 'application/json' }), body: JSON.stringify({ fields: typed(obj) }) });
        if (!r.ok) throw new Error(`write ${path.split('/')[0]} ${r.status}`);
      },
      remove: async (path) => { await fetchImpl(`${FS}/${path}`, { method: 'DELETE', headers: H() }); }
    };
  };

  return async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    const body = (req.body && typeof req.body === 'object') ? req.body : (() => { try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } })();
    const action = body.action;
    if (action !== 'send' && action !== 'check') return res.status(400).json({ error: 'action' });

    // Who is asking: a phone that joined the team.
    const callerToken = readToken(req);
    const claims = claimsOf(callerToken) || {};
    const callerUid = claims.user_id || claims.sub || '';
    if (!callerToken || !/^[A-Za-z0-9_-]{1,128}$/.test(callerUid)) return res.status(401).json({ error: 'join_first' });
    let member;
    try { member = await doc(callerToken).get(`hub-members/${callerUid}`); } catch (e) { member = null; }
    if (!member) {
      // Not in the team (yet): the token must still be a real sign-in of this project.
      let real = false;
      try {
        const r = await fetchImpl(LOOKUP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: callerToken }) });
        const d = r.ok ? await r.json() : null;
        real = !!(d && Array.isArray(d.users) && d.users.some(u => u.localId === callerUid));
      } catch (e) { real = false; }
      if (!real) return res.status(401).json({ error: 'join_first' });
    }

    const email = tidyEmail(body.email);
    if (!email) return res.status(400).json({ error: 'bad_email' });

    let token;
    try { token = await serviceToken(env, fetchImpl); } catch (e) { console.error('sign-in: service login refused:', e.message); token = null; }
    if (!token) return res.status(503).json({ error: 'not_set_up' });
    const db = doc(token);
    const t = now();
    const codePath = `sign-in-codes/${emailDoc(email)}`;

    // A phone outside the team signs in only to an account already in it.
    const uid = accountIdFor(email);
    if (!member) {
      const inTeam = await db.get(`accounts/${uid}`).catch(() => null) && await db.get(`hub-members/${uid}`).catch(() => null);
      if (!inTeam) return res.status(404).json({ error: 'no_account' });
    }

    if (action === 'send') {
      const cfg = mailConfig(env);
      if (!cfg) return res.status(503).json({ error: 'not_set_up' });
      const old = await db.get(codePath).catch(() => null);
      const sends = String(old?.sends || '').split(',').map(Number).filter(x => x && t - x < 3600 * 1000);
      if (sends.length >= PER_EMAIL_HOUR) return res.status(429).json({ error: 'too_many', wait: Math.ceil((sends[0] + 3600 * 1000 - t) / 60000) });
      const phonePath = `sign-in-codes/p_${callerUid}`;
      const day = new Date(t).toISOString().slice(0, 10);
      const ph = await db.get(phonePath).catch(() => null);
      const count = ph && ph.day === day ? Number(ph.count) || 0 : 0;
      if (count >= PER_PHONE_DAY) return res.status(429).json({ error: 'too_many', wait: 0 });

      const code = String(random()).padStart(6, '0');
      const salt = crypto.randomBytes(16).toString('hex');
      await db.set(codePath, { hash: codeHash(salt, code), salt, exp: t + CODE_LIFE_MS, tries: 0, uid: callerUid, sends: [...sends, t].join(',') });
      await db.set(phonePath, { day, count: count + 1 });
      try {
        await mail(cfg, { to: email, subject: `Your Hub code: ${code}`, text: emailText(code) });
      } catch (e) {
        console.error('sign-in: mail failed:', e.message);
        return res.status(502).json({ error: 'mail_failed' });
      }
      return res.status(200).json({ ok: true, expiresIn: CODE_LIFE_MS / 1000 });
    }

    // action === 'check'
    const code = String(body.code || '').replace(/\D/g, '');
    if (code.length !== 6) return res.status(400).json({ error: 'wrong_code', left: null });
    const saved = await db.get(codePath).catch(() => null);
    if (!saved || !saved.hash || Number(saved.exp) < t) return res.status(400).json({ error: 'expired' });
    if (saved.uid !== callerUid) return res.status(400).json({ error: 'other_phone' });
    const tries = Number(saved.tries) || 0;
    const right = crypto.timingSafeEqual(Buffer.from(codeHash(saved.salt, code)), Buffer.from(String(saved.hash).padEnd(64, '0').slice(0, 64)));
    if (!right) {
      if (tries + 1 >= MAX_TRIES) { await db.remove(codePath); return res.status(400).json({ error: 'expired', tooMany: true }); }
      await db.set(codePath, { tries: tries + 1 }, ['tries']);
      return res.status(400).json({ error: 'wrong_code', left: MAX_TRIES - tries - 1 });
    }
    // Spent: a right code works once. The send history goes with it, which is fine.
    await db.remove(codePath);

    // The phone's place in the team, carried to the account.
    const existing = uid === callerUid ? member : await db.get(`hub-members/${uid}`).catch(() => null);
    let role;
    if (!member) {
      // From the team-code screen: the account's own place, as it is.
      if (!existing) return res.status(404).json({ error: 'no_account' });
      role = existing.role || 'member';
      await db.set(`hub-members/${uid}`, { lastSeen: t }, ['lastSeen']);
    } else {
      const pick = existing && existing.role === 'owner' ? existing : member;
      role = pick.role === 'owner' || member.role === 'owner' ? 'owner' : (pick.role || 'member');
      const from = member.role === 'owner' ? member : pick;
      await db.set(`hub-members/${uid}`, {
        invite: from.invite || '', name: from.name || '', role,
        joinedAt: Number((existing || member).joinedAt) || t, lastSeen: t,
        device: member.device || '', who: member.who || ''
      });
      try {
        const owner = await db.get('hub-access/owner');
        if (owner && owner.uid === callerUid && uid !== callerUid) await db.set('hub-access/owner', { uid }, ['uid']);
      } catch (e) { console.error('sign-in: owner move failed:', e.message); }
    }

    const acct = await db.get(`accounts/${uid}`).catch(() => null);
    if (acct) await db.set(`accounts/${uid}`, { lastSignIn: t }, ['lastSignIn']);
    else await db.set(`accounts/${uid}`, { email, createdAt: t, lastSignIn: t });

    let ticket;
    try { ticket = customToken(serviceAccount(env), uid); } catch (e) { console.error('sign-in: ticket failed:', e.message); return res.status(503).json({ error: 'not_set_up' }); }
    return res.status(200).json({ ok: true, token: ticket, uid, role, name: (acct && acct.name) || '', email });
  };
}

export default makeHandler();
