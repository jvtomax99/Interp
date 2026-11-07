/* ---------- Your account: what follows you (email sign-in, phase E2) ----------
   Signed in with your email (features/account.js), your progress and settings
   are kept on the account too, and every phone signed in as you shares them.
   Spec: docs/features/email-sign-in.md, "What syncs (phase E2)".

   Where: one document, account-sync/{account id}, one field per key below,
   each the key's localStorage text as it is (null = not set). Only that
   account reads or writes it (firestore.rules).

   When: when the app opens, right after you sign in, when you leave the app
   (the page is hidden), and every 2 minutes while something changed. No live
   link between two phones open at once (spec, Not in this version).

   The merge, per key, never counting anything twice:
     this phone keeps a fingerprint of each key as of the last sync
     (ih_syncBase, for this account only). Only one side changed since then:
     that side wins. Both changed (or the first sync on a phone): the two are
     joined by the key's own rule (ACCT_SYNC_MERGE). Settings take the
     account's. Every rule is idempotent: joining twice gives the same answer.

   Not synced on purpose: what Dr. Smiley remembers about you
   (ih_smileyMemory, and ih_smileyMode, the older "how he moves"): AGENTS.md
   keeps it on the phone, never in Firestore (Jose kept that rule,
   2026-11-06). ih_memFlags (unsent "flag this line" reports; two
   phones would send them twice), caches, drafts, collapsed sections, the
   outbox, the smoothness meter. Term Review and Team Chat titles: phase E3.
   Loaded before index.html's script; it only declares, and reads index.html's
   names (db, hubAuthReady, loadPractice, ...) when called. */

const SYNC_DOC = 'account-sync', SYNC_BASE_KEY = 'ih_syncBase', SYNC_EVERY_MS = 2 * 60 * 1000;
const SYNC_SETTINGS = ['ih_theme', 'ih_region', 'ih_opening', 'ih_openingSound', 'ih_badgeTitle', 'ih_badgePhoto'];
const SYNC_PROGRESS = ['ih_practice_v1', 'ih_practice_streak_v1', 'ih_practice_badges_v1', 'ih_memory', 'ih_warmup',
  'ih_campusLv', 'ih_campusDone', 'ih_campusSky', 'ih_knowledgeLog'];
const SYNC_KEYS = SYNC_PROGRESS.concat(SYNC_SETTINGS);
// Firestore field names can't hold every character; ours are plain, but keep them safe.
const syncField = k => k.replace(/[^A-Za-z0-9_]/g, '_');
const SYNC = { busy: null, again: false, timer: 0, lastLocal: '', last: 0, took: 0 };

function syncHash(s){
  if(s == null) return 'n';
  let h = 5381;
  for(let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36) + '.' + s.length.toString(36);
}
function syncParse(s, fallback){ try{ const v = JSON.parse(s); return v && typeof v === 'object' ? v : fallback; }catch(e){ return fallback; } }
// 'YYYY-M-D' (the Hub's day stamps, unpadded) as a number to compare.
function syncDay(s){ const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(s || '')); return m ? (+m[1]) * 10000 + (+m[2]) * 100 + (+m[3]) : 0; }
const syncObj = v => v && typeof v === 'object' && !Array.isArray(v);
const syncMaxNum = (a, b) => Math.max(+a || 0, +b || 0);

/* The joins. Each gets the two texts (neither null) and returns one text. */
const ACCT_SYNC_MERGE = {
  // CoreCHI practice, one record per question: the newer answer's place on the
  // ladder (step, due, streak), and its counts never lower than either phone's.
  ih_practice_v1(a, b){
    const A = syncParse(a, {}), B = syncParse(b, {}), out = {};
    new Set(Object.keys(A).concat(Object.keys(B))).forEach(id => {
      const x = A[id], y = B[id];
      if(!syncObj(x) || !syncObj(y)){ out[id] = syncObj(x) ? x : y; return; }
      const n = (+y.last || 0) > (+x.last || 0) ? y : x;
      out[id] = Object.assign({}, n, { seen: syncMaxNum(x.seen, y.seen), right: syncMaxNum(x.right, y.right), wrong: syncMaxNum(x.wrong, y.wrong) });
    });
    return JSON.stringify(out);
  },
  // The streak: the later study day; the same day, the longer run.
  ih_practice_streak_v1(a, b){
    const A = syncParse(a, {}), B = syncParse(b, {});
    const la = syncDay(A.last), lb = syncDay(B.last);
    const n = Object.assign({}, lb > la ? B : A);
    if(la === lb) n.days = syncMaxNum(A.days, B.days);
    if(A.on && A.on === B.on) n.answered = syncMaxNum(A.answered, B.answered);
    return JSON.stringify(n);
  },
  // Badges: every one either phone earned, dated the first time.
  ih_practice_badges_v1(a, b){
    const A = syncParse(a, {}), B = syncParse(b, {}), out = Object.assign({}, A);
    Object.keys(B).forEach(k => { out[k] = out[k] ? Math.min(+out[k] || B[k], +B[k] || out[k]) : B[k]; });
    return JSON.stringify(out);
  },
  // The memory trainer: the phone that practised last sets the level; the
  // lines done are joined (each once), the best spans and line counts kept high.
  ih_memory(a, b){
    const A = syncParse(a, {}), B = syncParse(b, {});
    const lastAt = p => Array.isArray(p.log) && p.log.length ? (+p.log[p.log.length - 1].at || 0) : 0;
    const out = Object.assign({}, lastAt(B) > lastAt(A) ? B : A);
    const seen = Object.assign({}, syncObj(A.seen) ? A.seen : {});
    if(syncObj(B.seen)) Object.keys(B.seen).forEach(k => { seen[k] = syncMaxNum(seen[k], B.seen[k]); });
    const best = Object.assign({}, syncObj(A.best) ? A.best : {});
    if(syncObj(B.best)) Object.keys(B.best).forEach(k => { best[k] = syncMaxNum(best[k], B.best[k]); });
    const log = [], had = new Set();
    (Array.isArray(A.log) ? A.log : []).concat(Array.isArray(B.log) ? B.log : []).forEach(e => {
      const k = e && (e.at + '|' + e.id);
      if(k && !had.has(k)){ had.add(k); log.push(e); }
    });
    log.sort((x, y) => (+x.at || 0) - (+y.at || 0));
    return JSON.stringify(Object.assign(out, { seen, best, log: log.slice(-600) }));
  },
  // The Daily Drill: the later day's state; the same day, the longer streak.
  // The things already asked are joined so neither phone repeats them.
  ih_warmup(a, b){
    const A = syncParse(a, {}), B = syncParse(b, {});
    const da = syncDay(A.day), db = syncDay(B.day);
    const out = Object.assign({}, db > da || (db === da && (+B.streak || 0) > (+A.streak || 0)) ? B : A);
    const join = (k, n) => { const v = [...new Set([].concat(A[k] || [], B[k] || []))]; if(v.length) out[k] = v.slice(-n); };
    join('seenFF', 40); join('seenQ', 60);
    return JSON.stringify(out);
  },
  // The campus: the levels already drawn kept high, so nothing climbs or
  // celebrates twice; a building celebrated on either phone stays celebrated.
  ih_campusLv(a, b){
    const A = syncParse(a, {}), B = syncParse(b, {}), out = Object.assign({}, A);
    Object.keys(B).forEach(k => { out[k] = typeof B[k] === 'number' && typeof out[k] === 'number' ? Math.max(out[k], B[k]) : (k in out ? out[k] : B[k]); });
    return JSON.stringify(out);
  },
  ih_campusDone(a, b){ return JSON.stringify(Object.assign({}, syncParse(a, {}), syncParse(b, {}))); },
  // The knowledge brain's daily count, per name and day: the higher numbers.
  ih_knowledgeLog(a, b){
    const A = syncParse(a, {}), B = syncParse(b, {}), out = {};
    new Set(Object.keys(A).concat(Object.keys(B))).forEach(name => {
      const x = syncObj(A[name]) ? A[name] : {}, y = syncObj(B[name]) ? B[name] : {}, days = Object.assign({}, x);
      Object.keys(y).forEach(d => {
        const p = x[d], q = y[d];
        days[d] = Array.isArray(p) && Array.isArray(q) ? p.map((v, i) => syncMaxNum(v, q[i])) : (p || q);
      });
      const keys = Object.keys(days).sort();
      keys.slice(0, Math.max(0, keys.length - 400)).forEach(k => delete days[k]);
      out[name] = days;
    });
    return JSON.stringify(out);
  },
};

// Both sides changed: the key's join; a setting (or anything else) takes the account's.
function syncJoin(k, local, remote){
  if(local == null) return remote;
  if(remote == null) return local;
  const f = ACCT_SYNC_MERGE[k];
  if(!f) return remote;
  try{ return f(local, remote); }catch(e){ return remote; }
}

/* One key, three ways: what this phone has, what the account has, and the
   fingerprint of both at the last sync. Returns the value both should hold. */
function syncDecide(k, local, remote, base){
  const hl = syncHash(local), hr = syncHash(remote);
  if(hl === hr) return local;
  if(base && hl === base) return remote;      // only the account changed
  if(base && hr === base) return local;       // only this phone changed
  return syncJoin(k, local, remote);
}

function syncReadBase(uid){
  const b = acctRead(SYNC_BASE_KEY);
  return b && b.uid === uid && syncObj(b.h) ? b.h : {};
}
function syncLocalGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function syncLocalSet(k, v){ try{ if(v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
function syncLocalPrint(){ return SYNC_KEYS.map(k => syncHash(syncLocalGet(k))).join(','); }

/* The sync itself. Reads the account's copy first, then writes back only the
   keys that differ, so a phone never overwrites what another phone added. */
// At launch the phone may take a few seconds to remember it's the account
// (hubAuthReady gives up after 2.5 s): a read sent before then goes as nobody
// and is refused. Wait for it, up to 8 s.
function syncAuthWait(uid){
  const u = () => (typeof hubAuth !== 'undefined' && hubAuth) ? hubAuth.currentUser : null;
  if(u() && u().uid === uid) return Promise.resolve(true);
  return new Promise(res => {
    let off = null, done = false;
    const end = v => { if(done) return; done = true; try{ off && off(); }catch(e){} res(v); };
    try{ off = hubAuth.onAuthStateChanged(x => { if(x && x.uid === uid) end(true); }); }catch(e){}
    setTimeout(() => end(!!(u() && u().uid === uid)), 8000);
  });
}

async function accountSync(why){
  if(SYNC.busy){ SYNC.again = true; return SYNC.busy; }
  const saved0 = typeof acctRead === 'function' ? acctRead(ACCT_KEY) : null;
  if(saved0 && saved0.uid && typeof hubAuth !== 'undefined' && hubAuth && !hubAuth.currentUser) await syncAuthWait(saved0.uid);
  if(SYNC.busy){ SYNC.again = true; return SYNC.busy; }
  const a = typeof accountNow === 'function' ? accountNow() : null;
  // Signed in on this phone, but not as the account just now: say so on More's card.
  if(!a){
    const saved = acctRead(ACCT_KEY), u = (typeof hubAuth !== 'undefined' && hubAuth) ? hubAuth.currentUser : null;
    if(saved && saved.uid) syncNote({ ok: false, error: 'other_user', code: u ? 'uid ' + String(u.uid).slice(0, 6) : 'no user' });
    return null;
  }
  const cu = (typeof hubAuth !== 'undefined' && hubAuth) ? hubAuth.currentUser : null;
  if(!cu){ syncNote({ ok: false, error: 'other_user', code: 'no user' }); return null; }
  if(!db){ syncNote({ ok: false, error: 'not_ready' }); return null; }
  if(typeof navigator !== 'undefined' && navigator.onLine === false){ syncNote({ ok: false, error: 'offline' }); return null; }
  SYNC.busy = (async () => {
    const ref = db.collection(SYNC_DOC).doc(a.uid);
    let remote = {};
    try{ const snap = await ref.get(); remote = snap.exists ? (snap.data() || {}) : {}; }
    catch(e){ return syncNote({ ok: false, why, error: 'read', code: (e && e.code) || String(e && e.message || e).slice(0, 60) }); }   // offline, or the rule isn't published yet
    const base = syncReadBase(a.uid), nextBase = {}, push = {}, took = [];
    const keepMine = acctRead('ih_syncKeepMine') === a.uid;
    SYNC_KEYS.forEach(k => {
      const f = syncField(k), local = syncLocalGet(k);
      const rv = remote[f];
      const r = typeof rv === 'string' ? rv : null;
      let v = syncDecide(k, local, r, base[k]);
      // You kept this phone's name at sign-in: its settings win this once (features/account.js, accountPickSelf).
      if(keepMine && local != null && SYNC_SETTINGS.includes(k)) v = local;
      if(v !== local){ syncLocalSet(k, v); took.push(k); }
      if(v !== r) push[f] = v;
      nextBase[k] = syncHash(v);
    });
    if(Object.keys(push).length){
      push.at = Date.now();
      try{ await ref.set(push, { merge: true }); }
      catch(e){
        // The account didn't take it: keep the old fingerprints for what wasn't sent, so the next sync tries again.
        Object.keys(push).forEach(f => { const k = SYNC_KEYS.find(x => syncField(x) === f); if(k) nextBase[k] = base[k]; });
        acctWrite(SYNC_BASE_KEY, { uid: a.uid, h: nextBase });
        if(took.length) syncRefresh(took);
        return syncNote({ ok: false, why, error: 'write', took, code: (e && e.code) || String(e && e.message || e).slice(0, 60) });
      }
    }
    acctWrite(SYNC_BASE_KEY, { uid: a.uid, h: nextBase });
    if(keepMine) acctWrite('ih_syncKeepMine', null);
    SYNC.lastLocal = syncLocalPrint(); SYNC.last = Date.now(); SYNC.took += took.length;
    if(took.length) syncRefresh(took);
    return syncNote({ ok: true, why, took, sent: Object.keys(push).filter(f => f !== 'at') });
  })();
  try{ return await SYNC.busy; }
  finally{
    SYNC.busy = null;
    if(SYNC.again){ SYNC.again = false; setTimeout(() => accountSync('again'), 0); }
  }
}

/* What came from the account, put where the app reads it. Each step is
   guarded: a screen that isn't loaded yet simply reads the new value later. */
function syncRefresh(keys){
  const has = k => keys.includes(k);
  try{ if(has('ih_practice_v1') && typeof loadPractice === 'function') loadPractice(); }catch(e){}
  try{ if(has('ih_memory') && typeof MEM !== 'undefined') MEM.p = null; }catch(e){}
  try{ if(has('ih_warmup') && typeof DD !== 'undefined') DD.st = null; }catch(e){}
  try{
    if(has('ih_theme')){
      if(syncLocalGet('ih_theme') === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    }
  }catch(e){}
  try{
    if(has('ih_region')){
      if(typeof doctorRegionPick !== 'undefined') doctorRegionPick = null;
      if(typeof syncRegionControls === 'function') syncRegionControls();
      if(typeof pushSync === 'function') pushSync();
    }
  }catch(e){}
  // Redraw only a screen that shows what changed; never mid-typing.
  try{
    const typing = document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    if(!typing && typeof render === 'function' && (has('ih_theme') || has('ih_region') || keys.some(k => SYNC_PROGRESS.includes(k)))) render();
  }catch(e){}
  try{ document.dispatchEvent(new CustomEvent('ih:synced', { detail: { keys } })); }catch(e){}
}

/* What happened last, for More's account card (accountSyncLine): kept in
   ih_syncLast so it survives the Hub restarting. code is the database's own
   reason (permission-denied, unavailable...), shown small so Jose can send it. */
const SYNC_LAST_KEY = 'ih_syncLast';
function syncNote(r){
  const prev = acctRead(SYNC_LAST_KEY) || {};
  const rec = { at: Date.now(), ok: !!r.ok, error: r.error || '', code: r.code || '',
    took: (r.took || []).length, sent: (r.sent || []).length, okAt: r.ok ? Date.now() : (prev.okAt || 0) };
  acctWrite(SYNC_LAST_KEY, rec);
  try{ if(document.getElementById('acctSync') && typeof ACCT !== 'undefined' && !ACCT.busy) document.getElementById('acctSync').outerHTML = accountSyncLine(); }catch(e){}
  return r;
}
function syncClock(t){ try{ return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }catch(e){ return ''; } }
function accountSyncLine(){
  const L = acctRead(SYNC_LAST_KEY);
  const esc = typeof acctEsc === 'function' ? acctEsc : String;
  let text, bad = false;
  if(SYNC.busy) text = 'Syncing your progress…';
  else if(!L) text = "Your progress hasn't synced on this phone yet.";
  else if(L.ok) text = `Progress synced at ${syncClock(L.at)}.` + (L.took ? ` ${L.took} ${L.took === 1 ? 'thing' : 'things'} came from your other phone.` : '');
  else {
    bad = true;
    const why = { other_user: "this phone isn't signed in as your account right now. Sign out, then sign in again.",
      offline: "you're offline.", not_ready: "the Hub was still starting. Tap Sync now.",
      read: L.code === 'permission-denied' ? 'the database refused it. Check that the account-sync rule is published.' : "the Hub couldn't reach the database.",
      write: L.code === 'permission-denied' ? 'the database refused to save it. Check the account-sync rule.' : "the Hub couldn't save it." }[L.error] || "something went wrong.";
    text = `Progress didn't sync at ${syncClock(L.at)}: ${why}` + (L.okAt ? ` Last good sync ${syncClock(L.okAt)}.` : '');
  }
  const code = bad && L && L.code ? ` <span class="acct-sync-code">(${esc(L.code)})</span>` : '';
  return `<div class="acct-sync${bad ? ' is-bad' : ''}" id="acctSync"><p role="status">${esc(text)}${code}</p>`
    + `<button class="acct-link" type="button" onclick="accountSyncNow()"${SYNC.busy ? ' disabled' : ''}>Sync now</button></div>`;
}
async function accountSyncNow(){
  const el = document.getElementById('acctSync');
  const p = accountSync('now');
  if(el) el.outerHTML = accountSyncLine();
  const r = await p;
  const box = document.getElementById('acctSync'); if(box) box.outerHTML = accountSyncLine();
  try{ showToast(r && r.ok ? 'Your progress is synced.' : "Progress didn't sync. The reason is on the card."); }catch(e){}
}

// When you leave the app, and every 2 minutes while something changed.
function accountSyncStart(){
  if(SYNC.timer) return;
  document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'hidden') accountSync('hidden'); else accountSync('back'); });
  SYNC.timer = setInterval(() => {
    if(document.visibilityState !== 'visible' || !accountNow()) return;
    if(syncLocalPrint() !== SYNC.lastLocal) accountSync('changed');
  }, SYNC_EVERY_MS);
}

// Signing out or into another account: the fingerprints belonged to that account.
function accountSyncForget(){ acctWrite(SYNC_BASE_KEY, null); SYNC.lastLocal = ''; }
