/* Minimal Firestore compat stub: enough of the API that index.html actually
   boots, seeded with a realistic accented glossary. */
(function(){
  const DB = {};                      // collection -> { id -> data }
  const listeners = [];               // {coll, cb, limitToLast}
  const docListeners = [];            // {coll, id, emit}
  let seq = 0;
  const genId = () => 'id' + (++seq).toString(36) + Math.random().toString(36).slice(2,7);

  const ES = ['biopsia','hemorragia','anticoagulante','insuficiencia cardíaca','quimioterapia',
    'radioterapia','trasplante de médula ósea','ecografía','resonancia magnética','tomografía',
    'analgésico','antiinflamatorio','glucemia','hipertensión','arritmia','embolía pulmonar',
    'colonoscopía','endoscopía','mastectomía','linfoma no Hodgkin'];
  const EN = ['biopsy','hemorrhage','anticoagulant','heart failure','chemotherapy','radiation therapy',
    'bone marrow transplant','ultrasound','MRI','CT scan','painkiller','anti-inflammatory',
    'blood sugar','high blood pressure','arrhythmia','pulmonary embolism','colonoscopy',
    'endoscopy','mastectomy','non-Hodgkin lymphoma'];
  const CATS = ['Oncology','Cardiology','Radiology','Neurology','Emergency','Surgery','Pharmacy',
    'Obstetrics','Pediatrics','Nephrology','Pulmonology','Endocrinology','Gastroenterology',
    'Orthopedics','Dermatology','Hematology','Urology','Rheumatology','Anesthesia','Pathology'];
  const COLORS = ['#B2456E','#2E8BD0','#0F5FA6','#7C6A9C','#C24E3A','#2F5D62','#6F97AC','#8B6D3F',
    '#4A7C59','#A0522D','#556B8D','#9C5D8A','#3F7D6E','#8A6F3F','#5D6B9C','#AA4465','#417B5A',
    '#6B4E71','#2D6A8F','#7A5D28'];
  const ICONS = ['sparkle','hospital','clipboard','heart','brain','pill','bone','lungs'];

  // A few domains get subgroups, because the real glossary has them and the
  // Home cards render subgroups very differently from a domain with none.
  // Without these the disclosure on a domain card is never exercised at all.
  const SUBS = {
    'oncology':  ['Breast', 'Radiation', 'Hematologic'],
    'cardiology':['Electrophysiology', 'Interventional'],
    'radiology': ['Mammography'],
  };
  const CAT_DEFS = CATS.map((n,i)=>({
    id: n.toLowerCase(), name: n, color: COLORS[i % COLORS.length], icon: ICONS[i % ICONS.length]
  }));
  Object.entries(SUBS).forEach(([parentId, kids]) => {
    const parent = CAT_DEFS.find(c => c.id === parentId);
    if(!parent) throw new Error('stub: no such parent domain ' + parentId);
    kids.forEach(k => CAT_DEFS.push({
      id: parentId + '-' + k.toLowerCase(), name: k,
      color: parent.color, icon: parent.icon, parentId,
    }));
  });

  const SEED = window.__SEED_CATS || [];
  DB['terminology-meta'] = { categories: { categories: SEED.map(c=>({id:c.id,name:c.name,color:c.color,icon:c.icon,parentId:c.parentId||null})), updatedAt: Date.now() },
                             migrations: { oncologySplit:true, slangGlossary:true },
                             smiley: { points: 320, names:{}, weeks:{} } };
  DB['terms'] = {};
  let made = 0;
  SEED.forEach(c => (c.terms||[]).forEach(t => { const id = t.id || ('s'+(made)); DB['terms'][id] = Object.assign({}, t, {id, categoryId:c.id}); made++; }));
  window.__SEEDED_TERMS = made;

  // Populate the OTHER collections too. Leaving these empty made startup look
  // far quieter than it really is: Home shows chat/provider/doctor counts and
  // the four most recent activity entries, so each of these landing changes
  // Home's markup and forces a real rebuild.
  DB['team-chat'] = {};
  // A realistic (synthetic) conversation for the chat redesign screenshots.
  const T0 = Date.now() - 28 * 3600e3;
  const CONVO = [
    ['Maria', 'Morning all. 4 West is asking for Spanish at 9:30, bed 12.', 0],
    ['Luis', 'I can take it after my 9:00 in the ED.', 3],
    ['Maria', 'Perfect, thanks Luis 🙏', 4],
    ['Ana', 'Anyone have a good way to say "ejection fraction" for a patient? The literal one never lands.', 60],
    ['Jose', 'I use "la fuerza con que bombea el corazón" and then give the number.', 63],
    ['Ana', 'Love that. Adding it to the glossary.', 64],
    ['Luis', 'Reminder: the CCHI webinar on oncology terms is Thursday at noon.', 300],
    ['Maria', 'Is the infusion center sign-in still on the 2nd floor?', 1500],
    ['Jose', 'Yes, past the pharmacy window.', 1504],
    ['Jose', 'Here is the new wayfinding sign they put up', 1505, 'photo'],
    ['Ana', 'Super helpful, thank you!', 1510],
    ['Luis', 'Heading to L&D now. If anyone is free at 2, Peds clinic needs a second interpreter.', 1540],
    ['Maria', '@Jose can you cover Peds at 2? I am stuck in a family meeting.', 1545],
    ['Jose', 'On it 👍', 1546],
    ['Ana', 'Portrait shot of the new pediatric entrance', 1600, 'portrait'],
    ['Luis', 'Three angles of the parking map, so nobody gets lost tomorrow:', 1603, 'multi'],
    ['Maria', 'Long one, sorry: the CCHI renewal asks for 32 hours over four years, at least 16 of them performance-based. The full list of approved providers is here https://cchicertification.org/renewal-requirements/ and the webinar recordings count. Please double-check your hours before December so nobody gets caught out like last cycle.', 1608],
    ['Ana', '😂', 1609],
    ['Jose', 'Landscape view from the 4th floor bridge', 1612, 'landscape'],
  ];
  CONVO.forEach(([author, text, min, kind], i) => {
    DB['team-chat']['c' + i] = { text, author, timestamp: T0 + min * 60000, replyTo: null,
      attachment: kind === 'photo' ? { filename: 'wayfinding.jpg', mimeType: 'image/jpeg', dataUrl: 'hero.jpg', storagePath: 'attachments/x-wayfinding.jpg', width: 1091, height: 1125 }
                : kind === 'portrait' ? { filename: 'entrance.jpg', mimeType: 'image/jpeg', dataUrl: 'portrait.jpg', storagePath: 'attachments/x-p.jpg', width: 1200, height: 1600 }
                : kind === 'landscape' ? { filename: 'bridge.jpg', mimeType: 'image/jpeg', dataUrl: 'landscape.jpg', storagePath: 'attachments/x-l.jpg' }
                : kind === 'multi' ? { filename: 'map1.jpg', mimeType: 'image/jpeg', dataUrl: 'square.jpg', storagePath: 'attachments/x-m1.jpg', width: 1200, height: 1200 } : null,
      attachments: kind === 'multi' ? [
        { filename: 'map1.jpg', mimeType: 'image/jpeg', dataUrl: 'square.jpg', storagePath: 'attachments/x-m1.jpg', width: 1200, height: 1200 },
        { filename: 'map2.jpg', mimeType: 'image/jpeg', dataUrl: 'landscape.jpg', storagePath: 'attachments/x-m2.jpg', width: 1600, height: 1000 },
        { filename: 'map3.jpg', mimeType: 'image/jpeg', dataUrl: 'tall.jpg', storagePath: 'attachments/x-m3.jpg', width: 900, height: 1950 } ] : undefined,
      reactions: i === 4 ? { '❤️': ['Ana', 'Maria'] } : i === 13 ? { '🙏': ['Maria'] } : undefined };
    if (DB['team-chat']['c' + i].reactions === undefined) delete DB['team-chat']['c' + i].reactions;
    if (DB['team-chat']['c' + i].attachments === undefined) delete DB['team-chat']['c' + i].attachments;
  });
  DB['team-chat'].c5.replyTo = { id: 'c4', author: 'Jose', text: 'I use "la fuerza con que bombea el corazón" and then give the number.' };
  DB['team-chat'].c10.replyTo = { id: 'c9', author: 'Jose', text: 'Here is the new wayfinding sign they put up', photo: 'hero.jpg' };
  DB['activity-log'] = {};
  for (let i = 0; i < 90; i++) DB['activity-log']['a'+i] = {
    author: ['Jose','Maria','Luis'][i%3], summary: 'updated a term in Oncology',
    timestamp: Date.now() - (90 - i) * 120000 };
  DB['healthcare-providers'] = {};
  for (let i = 0; i < 38; i++) DB['healthcare-providers']['p'+i] = {
    name: 'Provider ' + i, role: 'Attending', facility: 'HUMC', photo: null, notes: '' };
  DB['doctor-directory'] = {};
  for (let i = 0; i < 64; i++) DB['doctor-directory']['d'+i] = {
    name: 'Dr. Example ' + i, specialty: 'Oncology', hospitalLocation: 'Hackensack',
    locationDetails: 'JTCC', notes: '', customTerms: [] };
  DB['practice-questions'] = {};
  for (let i = 0; i < 45; i++) DB['practice-questions']['q'+i] = {
    d:'oncology', q:'Question '+i, o:['a','b','c','d'], a:1, e:'Because.', addedBy:'Jose' };
  DB['announcements'] = {
    n0: { text: 'New CE requirement: 4 hours of oncology terminology by December.', author: 'Jose', createdAt: Date.now() - 2*86400e3 },
    n1: { text: 'Infusion center moved to the 2nd floor, past the pharmacy window.', author: 'Maria', createdAt: Date.now() - 5*86400e3 } };
  DB['ce-events'] = {};
  for (let i = 0; i < 7; i++) DB['ce-events']['e'+i] = {
    title:'CE event '+i, source:'IMIA', summary:'s', timestamp: Date.now() - i*86400000 };
  DB['term-attachments'] = {};
  for (let i = 0; i < 120; i++) DB['term-attachments']['at'+i] = {
    termId: 't0-'+i, filename:'scan.jpg', mimeType:'image/jpeg',
    dataUrl:'data:image/gif;base64,R0lGODlhAQABAAAAACw=', storagePath:'x' };
  DB['quiz-history'] = {};
  for (let i = 0; i < 60; i++) DB['quiz-history']['h'+i] = {
    who:'Jose', total:10, correct:8, domainBreakdown:{}, missedQuestions:[], timestamp: Date.now()-i*3600000 };
  DB['term-reviews'] = {};
  for (let i = 0; i < 200; i++) DB['term-reviews']['r'+i] = {
    termId:'t0-'+i, box:2, nextReviewAt: Date.now()+86400000, reviewCount:1 };
  DB['chat-typing'] = {}; DB['deleted-items'] = {}; DB['terminology-hub'] = {};
  DB['team-members'] = {}; DB['hub-lessons'] = {}; DB['term-link-cache'] = {}; DB['doctor-research-cache'] = {};
  const A = window.__ACCESS || { mode: 'none' };   // none | practice | locked
  DB['hub-access'] = {}; DB['hub-invites'] = {}; DB['hub-members'] = {};
  if (A.mode !== 'none') {
    DB['hub-access'].owner = { uid: 'owner-uid', name: 'Jose', at: 1 };
    DB['hub-access'].settings = { practice: A.mode === 'practice' };
    DB['hub-invites'].TEAMCODE = { name: 'Team code', role: 'member', kind: 'team', createdAt: 1 };
    DB['hub-invites'].OWNERCDE = { name: 'Jose', role: 'owner', kind: 'owner', createdAt: 1 };
    DB['hub-members']['owner-uid'] = { invite: 'OWNERCDE', name: 'Jose', role: 'owner', joinedAt: 1, lastSeen: 1 };
    if (A.member) DB['hub-members'][A.uid || 'u1'] = { invite: 'TEAMCODE', name: 'Team code', role: 'member', joinedAt: 1, lastSeen: 1 };
  }
  window.__DB = DB;
  // ---- outbox test layer: a "server" that survives reloads, logs writes, and can fail ----
  const KEEP = ['terms','team-chat','team-members','deleted-items'];
  try{ const saved = JSON.parse(sessionStorage.getItem('__srv') || 'null'); if(saved) KEEP.forEach(c => { if(saved[c]) DB[c] = saved[c]; }); }catch(e){}
  const persistSrv = () => { try{ const o = {}; KEEP.forEach(c => o[c] = DB[c]); sessionStorage.setItem('__srv', JSON.stringify(o)); }catch(e){ console.warn('srv persist', e); } };
  persistSrv();
  window.__FAULT = () => { try{ return JSON.parse(sessionStorage.getItem('__fault') || '{}'); }catch(e){ return {}; } };
  window.__srvLog = (entry) => { try{ const l = JSON.parse(sessionStorage.getItem('__srvlog') || '[]'); l.push(entry); sessionStorage.setItem('__srvlog', JSON.stringify(l)); }catch(e){} };
  window.__gate = (coll, id, op) => {
    const f = window.__FAULT();
    if(!KEEP.includes(coll) || coll === 'deleted-items') return Promise.resolve();
    if(f.unavailable){ const e = new Error('Failed to get document because the client is offline.'); e.code = 'unavailable'; return Promise.reject(e); }
    if(f.rejectIds && f.rejectIds.includes(id)){ const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; return Promise.reject(e); }
    return new Promise(r => setTimeout(r, (f.hangIds && f.hangIds.includes(id)) ? (f.hangMs || 3000) : 0));
  };
  window.__persistSrv = persistSrv;
  setTimeout(()=>{ window.__notify = notify; }, 0);

  // Staggered latency, so collections land at different times the way they do
  // over a real connection instead of all resolving in the same microtask.
  const LATENCY = { 'terms': 420, 'terminology-meta': 120, 'team-chat': 260,
    'activity-log': 340, 'healthcare-providers': 200, 'doctor-directory': 480,
    'practice-questions': 560, 'announcements': 300, 'ce-events': 640,
    'term-attachments': 720, 'quiz-history': 520, 'term-reviews': 380,
    'deleted-items': 240, 'chat-typing': 100, 'terminology-hub': 100 };
  const delay = (coll) => new Promise(r => setTimeout(r, LATENCY[coll] || 200));
  window.__delay = delay;

  window.__READ_LOG = [];             // every document read, for counting
  const logRead = (coll, n, op) => window.__READ_LOG.push({ coll, n, op: op || 'get', t: Date.now() });

  function snapOf(coll, opts){
    const map = DB[coll] || {};
    let entries = Object.keys(map).map(id => ({ id, data: () => JSON.parse(JSON.stringify(map[id])), metadata: { hasPendingWrites: !!(window.__PENDING && window.__PENDING.has(id)) } }));
    if (opts && opts.orderBy) {
      const f = opts.orderBy;
      entries.sort((a,b)=>{
        const av = map[a.id][f], bv = map[b.id][f];
        return (av > bv) - (av < bv);
      });
      if (opts.dir === 'desc') entries.reverse();
    }
    if (opts && opts.wheres) {
      opts.wheres.forEach(w => {
        entries = entries.filter(e => {
          const v = map[e.id][w.field];
          if (w.op === '==') return v === w.value;
          if (w.op === '!=') return v !== w.value;
          if (w.op === 'in') return Array.isArray(w.value) && w.value.indexOf(v) !== -1;
          return true;
        });
      });
    }
    if (opts && opts.limitToLast) entries = entries.slice(-opts.limitToLast);
    logRead(coll, entries.length, (opts && opts.__op) || 'get');
    return {
      docs: entries,
      size: entries.length,
      empty: entries.length === 0,
      forEach: fn => entries.forEach(fn),
      docChanges: () => entries.map(d => ({ type: 'added', doc: d })),
    };
  }

  function docRef(coll, id){
    return {
      id,
      get: () => window.__delay(coll).then(()=>{
        const map = DB[coll] || {};
        logRead(coll, id in map ? 1 : 0, 'get');
        return { exists: id in map, id, data: () => JSON.parse(JSON.stringify(map[id] || {})) };
      }),
      set: (data, opts) => window.__gate(coll, id, 'set').then(()=>{
        window.__srvLog({ coll, id, op: 'set' });
        const map = (DB[coll] = DB[coll] || {});
        const next = JSON.parse(JSON.stringify(data));
        // Real Firestore REPLACES the document unless {merge:true} is passed.
        // The stub always replaced, which hid the very hazard the oncology
        // migration keeps its flag in a separate document to avoid.
        map[id] = (opts && opts.merge) ? Object.assign({}, map[id] || {}, next) : next;
        notify(coll);
      }),
      update: (data) => window.__gate(coll, id, 'update').then(()=>{
        window.__srvLog({ coll, id, op: 'update' });
        const map = (DB[coll] = DB[coll] || {});
        map[id] = Object.assign({}, map[id] || {}, JSON.parse(JSON.stringify(data)));
        notify(coll);
      }),
      delete: () => window.__gate(coll, id, 'delete').then(()=>{
        window.__srvLog({ coll, id, op: 'delete' });
        if (DB[coll]) delete DB[coll][id];
        notify(coll);
      }),
      onSnapshot: (cb, errcb) => {
        const emit = () => {
          const map = DB[coll] || {};
          logRead(coll, id in map ? 1 : 0, 'listen');
          cb({ exists: id in map, id, data: () => JSON.parse(JSON.stringify(map[id] || {})) });
        };
        docListeners.push({ coll, id, emit });
        window.__delay(coll).then(emit);
        return ()=>{};
      },
    };
  }

  function notify(coll){
    if (window.__persistSrv) window.__persistSrv();
    listeners.filter(l => l.coll === coll).forEach(l => {
      try { l.cb(snapOf(coll, l.opts)); } catch(e){ console.error('listener threw', e); }
    });
    docListeners.filter(l => l.coll === coll).forEach(l => {
      try { l.emit(); } catch(e){ console.error('doc listener threw', e); }
    });
  }

  function query(coll, opts){
    return {
      where: (field, op, value) => query(coll, Object.assign({}, opts,
        { wheres: (opts.wheres || []).concat([{ field, op, value }]) })),
      orderBy: (f, dir) => query(coll, Object.assign({}, opts, { orderBy: f, dir })),
      limitToLast: (n) => query(coll, Object.assign({}, opts, { limitToLast: n })),
      limit: (n) => query(coll, Object.assign({}, opts, { limitToLast: n })),
      get: () => window.__delay(coll).then(()=> snapOf(coll, Object.assign({}, opts, {__op:'get'}))),
      onSnapshot: (a1, a2, a3) => {
        // Real Firestore also takes (options, onNext, onError).
        const cb = typeof a1 === 'function' ? a1 : a2;
        const lopts = Object.assign({}, opts, {__op:'listen'});
        listeners.push({ coll, cb, opts: lopts });
        window.__delay(coll).then(()=> cb(snapOf(coll, lopts)));
        return ()=>{};
      },
      doc: (id) => docRef(coll, id || genId()),
      add: (data) => Promise.resolve().then(()=>{
        const id = genId();
        (DB[coll] = DB[coll] || {})[id] = JSON.parse(JSON.stringify(data));
        notify(coll);
        return { id };
      }),
    };
  }

  window.firebase = {
    initializeApp(){ return {}; },
    firestore(){
      const api = (name) => query(name, {});
      return {
        collection: api,
        batch: () => { const ops = []; return {
          set: (ref, data, o) => ops.push(()=> ref.set(data, o)),
          update: (ref, data) => ops.push(()=> ref.update(data)),
          delete: (ref) => ops.push(()=> ref.delete()),
          commit: () => Promise.all(ops.map(f=>f())),
        };},
      };
    },
    auth(){
      const A = window.__ACCESS || {};
      const st = window.__AUTH = window.__AUTH || { user: A.signedIn ? { uid: A.uid || 'u1', getIdToken: () => Promise.resolve('tok') } : null, cbs: [] };
      return {
        get currentUser(){ return st.user; },
        onAuthStateChanged(cb){ st.cbs.push(cb); setTimeout(() => cb(st.user), 60); return () => {}; },
        signInAnonymously(){ st.user = { uid: A.uid || 'u1', getIdToken: () => Promise.resolve('tok') }; st.cbs.forEach(f => f(st.user)); return Promise.resolve({ user: st.user }); },
        signOut(){ st.user = null; st.cbs.forEach(f => f(null)); return Promise.resolve(); },
      };
    },
    storage(){
      window.__UPLOADS = window.__UPLOADS || { puts: [], deletes: [], ms: 1200, fail: false };
      const U = window.__UPLOADS;
      const child = (path) => ({
        put(blob, meta){
          U.puts.push({ path, size: blob.size, type: meta && meta.contentType });
          const subs = []; let cancelled = false, done = false, result, error;
          const snapshot = { bytesTransferred: 0, totalBytes: blob.size, ref: { getDownloadURL: () => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); }) } };
          const p = new Promise((resolve, reject) => {
            const steps = 6; let k = 0;
            const tick = () => {
              if (cancelled) { const e = new Error('cancelled'); e.code = 'storage/canceled'; subs.forEach(s => s.error && s.error(e)); return reject(e); }
              if (U.fail) { const e = new Error('upload failed'); e.code = 'storage/unknown'; subs.forEach(s => s.error && s.error(e)); return reject(e); }
              k++; snapshot.bytesTransferred = Math.round(blob.size * k / steps);
              subs.forEach(s => s.next && s.next(snapshot));
              if (k < steps) setTimeout(tick, U.ms / steps); else { subs.forEach(s => s.complete && s.complete()); resolve(snapshot); }
            };
            setTimeout(tick, U.ms / steps);
          });
          return { then: (a, b) => p.then(a, b), catch: f => p.catch(f), snapshot,
            on(evt, next, err, complete){ subs.push({ next, error: err, complete }); return () => {}; },
            cancel(){ cancelled = true; return true; } };
        },
        delete(){ U.deletes.push(path); return Promise.resolve(); },
        child: (p2) => child(path + '/' + p2),
      });
      return { ref: () => ({ child }) };
    },
  };
  window.firebase.firestore.FieldValue = { serverTimestamp: () => Date.now(), increment: n => n };
})();
