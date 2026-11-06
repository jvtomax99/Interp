/* ---------- Your account (email sign-in) ----------
   One account on every phone: type your email in More, get a 6-digit code
   in your inbox, type it here, and this phone becomes your account. Do the
   same on another phone and both are the same person. Phase E1: the sign-in
   itself, your place in the team carried over, and your name (your photo
   follows the name). Spec: docs/features/email-sign-in.md; the server is
   api/sign-in.js. Styles: app.css, "Your account".

   A code, not a link: on iPhone a Home Screen app keeps its own storage, so
   a link would open Safari and sign Safari in, not the Hub.

   Keys on this phone:
     ih_account         { uid, email } once signed in
     ih_accountPending  { email, at } while a code is on its way, so going to
                        the Mail app and back (iOS may restart the Hub) lands
                        on the code box, not the start
     ih_accountNameAt   when this phone last took or gave the account's name
   Loaded before index.html's script; it only declares, and reads
   index.html's names (hubAuth, db, readAccessMe, ...) when called. */

const ACCT_KEY = 'ih_account', ACCT_PENDING_KEY = 'ih_accountPending', ACCT_NAME_AT_KEY = 'ih_accountNameAt';
const ACCT_PENDING_MS = 10 * 60 * 1000;
const ACCT = { step: '', busy: false, msg: '', msgKind: '', confirmOut: false };

function acctRead(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
function acctWrite(k, v){ try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function acctEsc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// Signed in only when this phone's Firebase sign-in is the account itself.
function accountNow(){
  const a = acctRead(ACCT_KEY);
  const u = (typeof hubAuth !== 'undefined' && hubAuth) ? hubAuth.currentUser : null;
  if(!a || !a.uid) return null;
  if(u && u.uid !== a.uid) return null;
  return a;
}
function acctPending(){
  const p = acctRead(ACCT_PENDING_KEY);
  return p && p.email && Date.now() - (p.at || 0) < ACCT_PENDING_MS ? p : null;
}

function acctOwnerFirst(){ try{ return accessOwnerFirst() || ''; }catch(e){ return ''; } }
function acctError(code, data){
  const who = acctOwnerFirst() || 'the owner';
  switch(code){
    case 'join_first':  return 'Join the team with the team code first.';
    case 'bad_email':   return "That email doesn't look right. Check it and try again.";
    case 'too_many':    return data && data.wait ? `Too many codes for that email. Try again in ${data.wait} minute${data.wait === 1 ? '' : 's'}.` : 'Too many codes from this phone today. Try again tomorrow.';
    case 'not_set_up':  return `Email sign-in isn't switched on yet. Let ${who} know.`;
    case 'mail_failed': return "The email didn't go out. Try again in a moment.";
    case 'wrong_code':  return data && data.left ? `That code isn't right. ${data.left} ${data.left === 1 ? 'try' : 'tries'} left.` : "That code isn't right. It's the 6 numbers in the email.";
    case 'expired':     return data && data.tooMany ? 'Too many wrong tries. Ask for a new code.' : 'That code has run out. Ask for a new one.';
    case 'other_phone': return 'That code was asked for on another phone. Ask for a new one here.';
    case 'signin_failed': return `Signing in didn't finish. Try again, or let ${who} know.`;
    default:            return (typeof navigator !== 'undefined' && navigator.onLine === false) ? "You're offline. Connect and try again." : "Couldn't reach the Hub. Try again in a moment.";
  }
}

async function acctCall(body){
  const headers = Object.assign({ 'Content-Type': 'application/json' }, await hubAuthHeaders());
  let r, data = {};
  try{ r = await fetch('/api/sign-in', { method: 'POST', headers, body: JSON.stringify(body) }); }
  catch(e){ return { ok: false, error: 'network' }; }
  try{ data = await r.json(); }catch(e){ data = {}; }
  return r.ok ? Object.assign({ ok: true }, data) : Object.assign({ ok: false, error: data.error || 'network' }, data);
}

function accountMoreHtml(){
  return `<div class="acct-more" id="acctMore">
    <div class="home-sec-head"><h3>Your account</h3></div>
    <div class="acct-card" id="acctCard">${accountCardInner()}</div>
  </div>`;
}

function accountCardInner(){
  const a = accountNow();
  const msg = ACCT.msg ? `<p class="acct-msg${ACCT.msgKind === 'bad' ? ' is-bad' : ''}" id="acctMsg" role="status">${acctEsc(ACCT.msg)}</p>` : `<p class="acct-msg" id="acctMsg" role="status"></p>`;
  const busy = ACCT.busy ? ' disabled aria-busy="true"' : '';
  if(a){
    if(ACCT.confirmOut) return `
      <p class="acct-lede"><b>Sign out of this phone?</b><br>It stays in the team. Your account keeps your name; this phone keeps a copy.</p>
      <div class="acct-row">
        <button class="btn btn-primary" type="button" id="acctOutYes" onclick="accountSignOut()"${busy}>Sign out</button>
        <button class="btn btn-ghost" type="button" onclick="accountConfirmOut(false)">Stay signed in</button>
      </div>${msg}`;
    return `
      <p class="acct-lede">Signed in as<br><b class="acct-email">${acctEsc(a.email)}</b></p>
      <p class="acct-sub">Sign in with the same email on your other phones and your name and photo follow you.</p>
      <button class="btn btn-ghost" type="button" id="acctOut" onclick="accountConfirmOut(true)">Sign out of this phone</button>${msg}`;
  }
  if(typeof isHubMember === 'function' && !isHubMember()) return `
      <p class="acct-lede">Use one email on every phone, and your name and photo follow you.</p>
      <p class="acct-sub">First, join the team with the team code.</p>
      <button class="btn btn-ghost" type="button" onclick="try{closeMoreSheet()}catch(e){}; showAccessLock('join')">Enter the team code</button>`;
  const p = acctPending();
  if(p && ACCT.step !== 'email') return `
      <p class="acct-lede">We sent a code to<br><b class="acct-email">${acctEsc(p.email)}</b></p>
      <form class="acct-form" novalidate onsubmit="accountCheck(event)">
        <label class="acct-label" for="acctCode">The 6 numbers in the email</label>
        <input class="acct-input acct-code" id="acctCode" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" placeholder="000000" oninput="this.value=this.value.replace(/\\D/g,'').slice(0,6)">
        <button class="btn btn-primary" type="submit" id="acctCheckBtn"${busy}>${ACCT.busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      ${msg}
      <p class="acct-sub">Not there? Look in Spam or Junk. It can take a minute.</p>
      <div class="acct-row">
        <button class="acct-link" type="button" onclick="accountResend()"${busy}>Send a new code</button>
        <button class="acct-link" type="button" onclick="accountOtherEmail()">Use a different email</button>
      </div>`;
  return `
      <p class="acct-lede">Use one email on every phone, and your name and photo follow you.</p>
      <form class="acct-form" novalidate onsubmit="accountSend(event)">
        <label class="acct-label" for="acctEmail">Your email</label>
        <input class="acct-input" id="acctEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="name@example.com" value="${acctEsc((acctRead(ACCT_PENDING_KEY) || {}).email || '')}">
        <button class="btn btn-primary" type="submit" id="acctSendBtn"${busy}>${ACCT.busy ? 'Sending…' : 'Send me a code'}</button>
      </form>
      ${msg}
      <p class="acct-sub">We email you 6 numbers to type here. No password.</p>`;
}

function accountRedraw(focusId){
  const c = document.getElementById('acctCard');
  if(!c) return;
  c.innerHTML = accountCardInner();
  if(focusId){ const f = document.getElementById(focusId); if(f) try{ f.focus({ preventScroll: true }); }catch(e){} }
}
function acctSay(text, kind){ ACCT.msg = text || ''; ACCT.msgKind = kind || ''; }

async function accountSend(e, email){
  if(e) e.preventDefault();
  if(ACCT.busy) return;
  const input = document.getElementById('acctEmail');
  email = String(email || (input && input.value) || '').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ acctSay(acctError('bad_email'), 'bad'); accountRedraw('acctEmail'); return; }
  ACCT.busy = true; acctSay(''); accountRedraw();
  const r = await acctCall({ action: 'send', email });
  ACCT.busy = false;
  if(r.ok){
    acctWrite(ACCT_PENDING_KEY, { email, at: Date.now() });
    ACCT.step = 'code'; acctSay('');
    accountRedraw('acctCode');
  }else{
    acctSay(acctError(r.error, r), 'bad');
    accountRedraw('acctEmail');
  }
}
function accountResend(){ const p = acctRead(ACCT_PENDING_KEY); if(p && p.email) accountSend(null, p.email); }
function accountOtherEmail(){ ACCT.step = 'email'; acctSay(''); accountRedraw('acctEmail'); }

async function accountCheck(e){
  if(e) e.preventDefault();
  if(ACCT.busy) return;
  const p = acctPending();
  const input = document.getElementById('acctCode');
  const code = String((input && input.value) || '').replace(/\D/g, '');
  if(!p){ ACCT.step = 'email'; acctSay(acctError('expired'), 'bad'); accountRedraw('acctEmail'); return; }
  if(code.length !== 6){ acctSay(acctError('wrong_code'), 'bad'); accountRedraw('acctCode'); return; }
  ACCT.busy = true; acctSay(''); accountRedraw();
  const r = await acctCall({ action: 'check', email: p.email, code });
  if(!r.ok){
    ACCT.busy = false;
    if(r.error === 'expired' || r.error === 'other_phone'){ /* keep the box; "Send a new code" is right there */ }
    acctSay(acctError(r.error, r), 'bad'); accountRedraw('acctCode');
    return;
  }
  try{
    await hubAuth.signInWithCustomToken(r.token);
  }catch(err){
    ACCT.busy = false; acctSay(acctError('signin_failed'), 'bad'); accountRedraw('acctCode');
    return;
  }
  await accountAdopt(r);
  ACCT.busy = false; ACCT.step = ''; acctSay('');
  accountRedraw();
  try{ showToast('Signed in. This phone is your account now.'); }catch(e){}
}

/* After the ticket: this phone is the account. Its place in the team is
   already on the account (the server copied it); tell the rest of the app. */
async function accountAdopt(r){
  acctWrite(ACCT_KEY, { uid: r.uid, email: r.email });
  acctWrite(ACCT_PENDING_KEY, null);
  const me = readAccessMe() || {};
  writeAccessMe(Object.assign({}, me, { member: true, uid: r.uid, role: r.role || me.role }));
  try{ localStorage.removeItem('ih_adminName'); }catch(e){}   // so the owner's Admin line is rewritten under the account
  // The name: the account's wins if it has one; else this phone gives it its own.
  const mine = (whoAmI() || '').trim();
  if(r.name && r.name !== mine) accountApplyName(r.name);
  else if(!r.name && mine) accountSaveName(mine);
  acctWrite(ACCT_NAME_AT_KEY, Date.now());
  try{ checkMyMembership(); }catch(e){}
  try{ loadAccessState(); }catch(e){}
}

function accountApplyName(name){
  window.__lastWho = name;
  persistMyName(name);
  const whoEl = document.getElementById('whoInput');
  if(whoEl) whoEl.value = name;
  try{ syncAccessWho(); }catch(e){}
  try{ updateTopbarAvatar(); }catch(e){}
  try{ document.dispatchEvent(new Event('ih:titles')); }catch(e){}
}

// Called by saveMyName (index.html) and on sign-in: the account keeps the name.
function accountSaveName(name){
  const a = accountNow();
  if(!a || !db) return;
  const at = Date.now();
  acctWrite(ACCT_NAME_AT_KEY, at);
  db.collection('accounts').doc(a.uid).update({ name: String(name || '').trim().slice(0, 60), nameAt: at }).catch(() => {});
}

// On launch: a name changed on another phone arrives here.
async function accountBoot(){
  try{ await hubAuthReady; }catch(e){}
  const a = accountNow();
  if(!a || !db || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
  try{
    const snap = await db.collection('accounts').doc(a.uid).get();
    if(!snap.exists) return;
    const d = snap.data() || {};
    const seen = Number(acctRead(ACCT_NAME_AT_KEY)) || 0;
    if(d.name && d.name !== (whoAmI() || '').trim() && (Number(d.nameAt) || 0) > seen){
      accountApplyName(d.name);
      acctWrite(ACCT_NAME_AT_KEY, Number(d.nameAt) || Date.now());
    }
  }catch(e){ /* offline, or the accounts rule isn't published yet */ }
}

function accountConfirmOut(v){ ACCT.confirmOut = !!v; acctSay(''); accountRedraw(v ? 'acctOutYes' : 'acctOut'); }

/* Signing out: back to a plain phone in the team, with the code it joined
   with (no code to type again). Keeps the name and photo on this phone. */
async function accountSignOut(){
  if(ACCT.busy) return;
  ACCT.busy = true; accountRedraw();
  const me = readAccessMe() || {};
  try{ await hubAuth.signOut(); }catch(e){}
  acctWrite(ACCT_KEY, null);
  acctWrite(ACCT_NAME_AT_KEY, null);
  try{ localStorage.removeItem('ih_adminName'); }catch(e){}
  let ok = true;
  if(me.code){ try{ await joinHub(me.code); }catch(err){ ok = false; } }
  else ok = false;
  ACCT.busy = false; ACCT.confirmOut = false; ACCT.step = '';
  if(!ok){ try{ onRemovedFromHub(); }catch(e){} }
  accountRedraw();
  try{ showToast(ok ? 'Signed out. This phone is on its own again.' : 'Signed out. Enter the team code to keep using the Hub.'); }catch(e){}
}
