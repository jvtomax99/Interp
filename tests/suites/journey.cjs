/* One complete journey, end to end, with synthetic data:
   Spanish + brief preferences -> oncology prep -> follow-up -> term
   practice -> answer a card -> navigate away -> return; plus the ways it can
   go wrong (cancelled / older requests, navigation churn, offline, storage
   refused). The real api/ask.js handler runs here; only Anthropic's reply
   is stood in (fakeModel), following CONTEXT the way the prompt asks.
   Firestore's offline write behaviour (a set() that stays pending until the
   connection returns, since this app runs without offline persistence) is
   emulated on the stub for term-reviews. Each check names the defect it
   guards (D1...) where it was written to catch one. */
const L = require('../support/harness.cjs');
const fs = require('fs');
const RESULTS = [];
const ok = (c, m) => { RESULTS.push([!!c, m]); console.log((c ? '  PASS ' : '  FAIL ') + m); if (!c) process.exitCode = 1; };
const SENT = [];
const CFG = { delay: 600, slowNext: 0 };
const shots = require('../support/harness.cjs').OUT + 'journey/';
fs.mkdirSync(shots, { recursive: true });

function fakeModel(user) {
  const ctx = JSON.parse((user.match(/CONTEXT:\n(.*)\n\n/) || [])[1] || '{}');
  const q = (user.match(/QUESTION:\n([\s\S]*)$/) || [])[1] || '';
  const hist = (user.match(/EARLIER IN THIS CONVERSATION \(oldest first\):\n(.*)\n\n/) || [])[1] || '';
  const es = ctx.prefs && ctx.prefs.lang === 'es';
  const ans = { fromHub: false, headline: '', sayLabel: '', say: '', details: '', sourceIds: [], lessonIds: [], actions: [], suggestTerm: { en: '', es: '', def: '' } };
  if (/prep/i.test(q)) {
    const spec = (ctx.specialties || []).find(s => q.toLowerCase().includes(s.name.toLowerCase()) || (ctx.screen && ctx.screen.name && ctx.screen.name.includes(s.name)));
    ans.headline = spec ? (es ? `Tu repaso de ${spec.name} está listo.` : `Your ${spec.name} briefing is ready.`) : (es ? '¿Qué especialidad?' : 'Which specialty?');
    ans.details = es ? 'Tiene las palabras que aún aprendes. También las trampas comunes. Y el reloj de la cita.' : 'Words you are learning. Common traps. The appointment timer.';
    ans.actions = spec ? [{ type: 'open_prep', target: spec.id }] : [{ type: 'choose_prep', target: 'prep' }];
  } else if (/trap|trampa/i.test(q)) {
    // A follow-up: which specialty does "there" mean? From the screen, else the conversation.
    const where = (ctx.screen && /Oncology/.test(ctx.screen.name || '')) ? 'screen' : /Oncology/.test(hist) ? 'history' : '';
    ans.headline = where ? (es ? 'En Oncología, cuidado con "constipado".' : 'In Oncology, watch "constipado".') : (es ? '¿En qué especialidad?' : 'Which specialty?');
    ans.details = es ? `Significa congestionado, no estreñido. Diga "estreñido". Revise también "embarazada".` : 'It means congested. Say "estreñido". Also watch "embarazada".';
    ans.say = 'estreñido'; ans.sayLabel = 'Say';
    ans._where = where;
  } else if (/practice|practicar/i.test(q)) {
    const lr = ctx.learning || {};
    ans.headline = es ? 'Listo para practicar.' : 'Ready to practice.';
    if (lr.count) ans.actions = [{ type: 'practice_learning', target: 'learning' }];
  } else {
    ans.headline = es ? 'Respuesta: ' + q.slice(0, 40) : 'Answer: ' + q.slice(0, 40);
    ans.details = es ? 'Primera frase. Segunda frase.' : 'First sentence. Second sentence.';
  }
  return ans;
}
let mod;
async function serve(body, headers) {
  mod = mod || await import(require('url').pathToFileURL(require('../support/harness.cjs').ROOT + 'api/ask.js').href);
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('firestore.googleapis.com')) return new Response(JSON.stringify({ fields: { practice: { booleanValue: true } } }), { status: 200 });
    if (String(url).includes('api.anthropic.com')) { const r = JSON.parse(init.body); return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(fakeModel(r.messages[0].content)) }], stop_reason: 'end_turn' }), { status: 200 }); }
    return real(url, init);
  };
  let status = 200, json = null;
  const res = { status(c) { status = c; return res; }, json(j) { json = j; return res; }, setHeader() {} };
  try { await mod.default({ method: 'POST', headers, body }, res); } finally { globalThis.fetch = real; }
  return { status, json };
}
async function wire(P) {
  await P.route('**/api/ask', async r => {
    const body = JSON.parse(r.request().postData() || '{}'); SENT.push(body);
    const d = CFG.slowNext || CFG.delay; CFG.slowNext = 0;
    await new Promise(res => setTimeout(res, d));
    const o = await serve(body, r.request().headers());
    try { await r.fulfill({ status: o.status, contentType: 'application/json', body: JSON.stringify(o.json) }); } catch (e) {}
  });
}
// Frame changes on every Dr. Smiley, with the run that made them.
const REC = `(()=>{if(window.__fr)return;window.__fr=[];new MutationObserver(ms=>{for(const m of ms){const svg=m.target.closest('svg.ds-art');const a=svg&&drAnimOf.get(svg);
  const f=DR_FACE_FRAMES[Math.round(-(+m.target.getAttribute('x')||0)/DR_FACE_W)];const last=__fr[__fr.length-1];
  if(!last||last.f!==f||last.run!==(a&&a.run?a.run.name:''))__fr.push({t:performance.now(),f,place:a?a.place:'?',run:a&&a.run?a.run.name:''});}})
  .observe(document.body,{subtree:true,attributes:true,attributeFilter:['x']});})()`;
// Firestore without offline persistence: a write stays pending while offline.
const FS_OFFLINE = `(()=>{const orig=db.collection.bind(db);db.collection=n=>{const c=orig(n);if(n!=='term-reviews')return c;const od=c.doc.bind(c);
  c.doc=id=>{const d=od(id);const os=d.set.bind(d);d.set=(data,o)=>new Promise((res,rej)=>{const go=()=>navigator.onLine?os(data,o).then(res,rej):setTimeout(go,150);go();});return d;};return c;};})()`;
const runsSince = (P, t, place) => P.evaluate(([t, place]) => __fr.filter(r => r.t >= t && (!place || r.place === place)).map(r => r.run).filter((x, i, a) => x && a.indexOf(x) === i), [t, place]);
const mark = P => P.evaluate(() => performance.now());
const lastCard = P => P.evaluate(() => { const c = [...document.querySelectorAll('.ask-card')].pop(); return c ? { text: c.innerText.replace(/\s+/g, ' ').trim(), btns: [...c.querySelectorAll('.ask-do-btn')].map(b => b.textContent.trim()) } : null; });
const ask = async (P, q, ms) => { await P.evaluate(q => { const i = document.getElementById('askInput'); i.value = q; ASK.draft = q; submitAsk(); }, q); await P.waitForTimeout(ms == null ? CFG.delay + 900 : ms); };
const tap = async (P, label) => P.evaluate(l => { const b = [...[...document.querySelectorAll('.ask-card')].pop().querySelectorAll('.ask-do-btn')].find(x => x.textContent.includes(l)); if (!b) return false; b.click(); return true; }, label);
async function listeners(P) {
  const cdp = await P.context().newCDPSession(P);
  const count = async expr => { const { result } = await cdp.send('Runtime.evaluate', { expression: expr }); const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId }); return listeners.length; };
  const out = { window: await count('window'), document: await count('document'), body: await count('document.body') };
  await cdp.detach();
  return Object.assign(out, await P.evaluate(() => ({ controllers: drAnims.size, timers: drAnimDebug().timers, docks: document.querySelectorAll('.dock-smiley').length, overlays: document.querySelectorAll('.overlay').length, sways: drSways.size })));
}

(async () => {
  const b = await L.chromium.launch();
  const { ctx, page: P } = await L.boot(b, { device: 'iphone', settle: 5000 });
  await wire(P); await P.evaluate(REC); await P.evaluate(FS_OFFLINE);
  // Synthetic record: 7 terms still learning (3 Oncology), none of it real
  // data. The stub's database starts over on every reload, so it's re-seeded.
  const seed = () => P.evaluate(async () => {
    const all = allTermsFlat(), pick = all.filter(t => askTopOf(t.categoryId) === 'onco').slice(0, 3).concat(all.filter(t => askTopOf(t.categoryId) === 'gi').slice(0, 4)), now = Date.now();
    pick.forEach((t, i) => { window.__DB['term-reviews']['jose__' + t.id] = { who: 'jose', termId: t.id, box: i % 2, nextReviewAt: now - (i + 1) * 3600e3, reviewCount: 1 }; });
    await loadTermReviews(); return askLearningTerms().map(t => t.id);
  });
  const seeded = await seed();

  console.log('== 1. preferences: Spanish, brief; survive reload');
  await L.go(P, 'ask', 1000);
  await ask(P, 'Remember to explain things in Spanish.', 300);
  await ask(P, 'Remember I prefer brief answers.', 300);
  let c = await lastCard(P);
  ok(/Saved on this device/.test(c.text), 'confirmed only after saving');
  await P.reload({ waitUntil: 'domcontentloaded' }); await P.waitForTimeout(4500);
  await wire(P); await P.evaluate(REC); await P.evaluate(FS_OFFLINE); await seed();
  const prefs = await P.evaluate(() => drMemGet());
  ok(prefs.lang === 'es' && prefs.length === 'brief', 'both preferences survive a reload ' + JSON.stringify(prefs));

  console.log('== 2. "I\'m covering oncology. Prep me."');
  await L.go(P, 'ask', 1000);
  let t0 = await mark(P);
  await ask(P, "I'm covering oncology. Prep me.");
  c = await lastCard(P);
  let sent = SENT[SENT.length - 1];
  ok(sent.context.prefs.lang === 'es' && sent.context.prefs.length === 'brief', 'the preferences go with the question');
  ok(/Tu repaso de Oncology está listo\./.test(c.text) && /Tiene las palabras que aún aprendes\./.test(c.text) && !/También las trampas/.test(c.text), 'answer in Spanish and brief (one sentence of details)');
  ok(c.btns[0] === 'Open the Oncology briefing', 'the action names the right briefing');
  await P.waitForTimeout(400);
  let runs = await runsSince(P, t0, 'ask');
  ok(runs.includes('answer') && !runs.includes('composed') && !runs.includes('answerGeneral'), 'D1 a briefing handed over is a success: "got it", not the composed face of an uncertain answer ' + JSON.stringify(runs));
  await P.screenshot({ path: shots + '2-prep.png' });
  await tap(P, 'Oncology briefing'); await P.waitForTimeout(700);
  ok(await P.evaluate(() => activeCategory === 'prep' && document.querySelector('.prep-hero h1').textContent === 'Oncology'), 'it opens the existing Oncology briefing');

  console.log('== 3. a follow-up, asked from the briefing');
  await P.evaluate(() => openAskHub()); await P.waitForTimeout(900);
  await ask(P, 'What traps should I watch for there?');
  sent = SENT[SENT.length - 1];
  c = await lastCard(P);
  ok(/Oncology/.test(sent.context.screen.name || ''), 'D8 the context says which briefing he was asked from ' + JSON.stringify(sent.context.screen));
  ok(sent.history.some(h => /Oncology/.test(h.q + h.a)), 'the conversation so far goes with it');
  ok(/En Oncología, cuidado con "constipado"\./.test(c.text), 'the follow-up answer is about Oncology');
  await ask(P, 'Prep me.');
  c = await lastCard(P);
  ok(c.btns.includes('Open the Oncology briefing'), 'D8 "Prep me." from the Oncology briefing offers Oncology ' + JSON.stringify(c.btns));
  await ask(P, "I'm covering astrology. Prep me.");
  c = await lastCard(P);
  ok(c.btns.length === 1 && c.btns[0] === 'Choose a specialty', 'D8b a specialty named that isn’t in the Hub isn’t swapped for the briefing you came from, even when the reply suggests it ' + JSON.stringify(c.btns));
  await P.screenshot({ path: shots + '3-followup.png' });

  console.log('== 4. cancelled and older requests');
  CFG.slowNext = 3000;
  await ask(P, 'What is the Spanish for biopsy?', 400);
  await P.evaluate(() => askCancel()); await P.waitForTimeout(150);
  t0 = await mark(P);
  await ask(P, 'What is the Spanish for staging?');
  await P.waitForTimeout(3000);
  const turns = await P.evaluate(() => ASK.turns.slice(-2).map(t => ({ q: t.q, status: t.status, h: t.answer ? t.answer.headline : '' })));
  ok(turns[0].status === 'cancelled' && turns[1].status === 'done' && /staging/.test(turns[1].h) && !/biopsy/.test(turns[1].h), 'the stopped question stays stopped; the newer answer is the one shown ' + JSON.stringify(turns));
  runs = await runsSince(P, t0, 'ask');
  ok(!runs.includes('okay') || runs.indexOf('okay') < runs.indexOf('answerGeneral'), 'no late reaction to the stopped one after the new answer ' + JSON.stringify(runs));
  // An older action finishing after you've moved on must not drag you back.
  await ask(P, "Help me practice five terms I'm still learning.");
  await P.evaluate(() => { termReviewsLoaded = false; lazyLoads.delete('termReviews'); const d = window.__delay; window.__delay = c => c === 'term-reviews' ? new Promise(r => setTimeout(r, 1500)) : d(c); });
  const toasts = [];
  await P.exposeFunction('__toastJ', m => toasts.push(m)).catch(() => {});
  await P.evaluate(() => { const o = window.showToast; window.showToast = m => { window.__toastJ && window.__toastJ(m); return o(m); }; });
  ok(await tap(P, 'Practice 5'), 'the Practice button is there to tap');
  await P.waitForTimeout(150);
  await L.go(P, 'translate', 2200);
  const where = await P.evaluate(() => activeCategory);
  ok(where === 'translate' && !toasts.some(m => /Practicing/.test(m)), 'D2 a slow action finishing after you navigated away doesn’t pull you back (' + where + ', ' + JSON.stringify(toasts) + ')');
  await P.evaluate(() => { termReviewsLoaded = false; lazyLoads.delete('termReviews'); });
  await P.evaluate(async () => { await loadTermReviews(); });

  console.log('== 5. term practice: answer one, leave, come back');
  await L.go(P, 'ask', 900);
  await ask(P, "Help me practice five terms I'm still learning.");
  await tap(P, 'Practice 5'); await P.waitForTimeout(2200);
  const started = await P.evaluate(() => ({ cat: activeCategory, ids: reviewQueue.map(t => t.id), i: reviewIndex }));
  ok(started.cat === 'review' && started.i === 0 && started.ids.length === 5 && started.ids.every(id => seeded.includes(id)), 'Term Review on 5 of your still-learning terms');
  await P.evaluate(() => revealReviewAnswer()); await P.waitForTimeout(200);
  await P.screenshot({ path: shots + '5-review.png' });
  await P.evaluate(() => [...document.querySelectorAll('.review-card .btn-primary, .quiz-actions .btn-primary')].find(b => /Got it/.test(b.textContent)).click());
  await P.waitForTimeout(600);
  const one = await P.evaluate(id => ({ i: reviewIndex, box: TERM_REVIEWS[id].box, n: TERM_REVIEWS[id].reviewCount }), started.ids[0]);
  ok(one.i === 1 && one.n === 2, 'one card done; the record moved on ' + JSON.stringify(one));
  const L0 = await listeners(P);
  for (let k = 0; k < 4; k++) for (const cat of ['home', 'translate', 'ask', 'onco', 'prep', 'review']) await L.go(P, cat, 250);
  await P.waitForTimeout(5000);   // the detached-controller sweep runs every 4 s
  const L1 = await listeners(P);
  ok(await P.evaluate(() => activeCategory === 'review' && reviewActive && reviewIndex === 1 && /2 of 5/.test(document.querySelector('.section-head .sub').textContent)), 'back on Term Review: card 2 of 5, where you left it');
  ok(L1.window === L0.window && L1.document === L0.document && L1.body === L0.body && L1.docks === 1 && L1.sways <= L0.sways + 1 && L1.controllers <= 2,
    'navigation churn (24 screens) adds no listeners, docks or controllers ' + JSON.stringify({ L0, L1 }));
  await P.screenshot({ path: shots + '5-returned.png' });

  console.log('== 6. offline: work you can get back');
  await ctx.setOffline(true); await P.waitForTimeout(300);
  await P.evaluate(() => revealReviewAnswer()); await P.waitForTimeout(150);
  await P.evaluate(() => [...document.querySelectorAll('.quiz-actions .btn-primary')].find(b => /Got it/.test(b.textContent)).click());
  await P.waitForTimeout(900);
  const off = await P.evaluate(id => ({ i: reviewIndex, outbox: (JSON.parse(localStorage.getItem('ih_outbox_v1') || '[]')).filter(e => e.collection === 'term-reviews').length }), started.ids[1]);
  ok(off.i === 2, 'D5 offline, answering a card still moves on (it used to wait for the server) ' + JSON.stringify(off));
  ok(off.outbox >= 1, 'D5 and the answer is kept on the phone until it can be sent ' + JSON.stringify(off));
  // A question that has to wait for a connection survives closing the app.
  await L.go(P, 'ask', 800);
  await ask(P, 'Is "metástasis" the same in both languages?', 600);
  ok(await P.evaluate(() => ASK.turns[ASK.turns.length - 1].status === 'waiting'), 'offline: the question waits');
  // A newer pick must not be replaced by an older queued question's.
  const AB = await P.evaluate(() => { const c = DATA.categories.find(x => x.id === 'onco'); return [c.terms[0].id, c.terms[1].id]; });
  await P.evaluate(([a, b]) => { askAbout('onco', a); }, AB); await P.waitForTimeout(500);
  await ask(P, 'Explain this term.', 500);
  await tap(P, 'back online'); await P.waitForTimeout(300);
  await P.evaluate(([a, b]) => { ASK.selected = { cat: 'onco', term: b }; }, AB);
  await ctx.setOffline(false); await P.waitForTimeout(4500);
  ok(await P.evaluate(b => ASK.selected && ASK.selected.term === b, AB[1]), 'D3 retrying an older queued question doesn’t replace the term you picked since');
  const retried = SENT.filter(x => /Explain this term/.test(x.question)).pop();
  ok(retried && retried.context.selected && retried.context.selected.id === 't:' + AB[0], 'D3 ...and the retried question is still about the term it was asked about');
  ok(await P.evaluate(id => { const d = window.__DB['term-reviews']['jose__' + id]; return !!d && d.reviewCount === 2; }, started.ids[1]), 'D5 the offline answer reached the database once back online');
  ok(await P.evaluate(() => { const st = JSON.parse(localStorage.getItem('ih_outbox_v1') || '[]'); return !st.some(e => e.collection === 'term-reviews'); }), 'back online: the offline answer was sent');
  await ctx.setOffline(true); await P.waitForTimeout(200);
  await ask(P, 'Is "quimioterapia" written with an accent?', 400);
  await ctx.setOffline(false);
  await P.reload({ waitUntil: 'domcontentloaded' }); await P.waitForTimeout(5000);
  await wire(P); await P.evaluate(REC); await P.evaluate(FS_OFFLINE);
  await L.go(P, 'ask', 3000);
  const back = await P.evaluate(() => ASK.turns.filter(t => /quimioterapia/.test(t.q)).map(t => t.status));
  ok(back.length === 1 && back[0] === 'done' && SENT.some(x => /quimioterapia/.test(x.question)), 'D7 a question waiting for a connection survives a reload, and is sent once online ' + JSON.stringify(back));

  console.log('== 7. storage refused');
  await P.evaluate(() => { window.__realSet = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v){ if(k === 'ih_prepDeck') throw new DOMException('QuotaExceededError'); return window.__realSet.call(this, k, v); }; });
  await L.go(P, 'prep', 900);
  const d0 = await P.evaluate(() => prepDeck(DATA.categories.find(c => c.id === PREP.domainId)).i);
  await P.evaluate(() => prepFlip()); await P.waitForTimeout(600);
  await P.evaluate(() => prepMark('ok')); await P.waitForTimeout(800);
  const d1 = await P.evaluate(() => ({ i: prepDeck(DATA.categories.find(c => c.id === PREP.domainId)).i, n: document.querySelector('.prep-n')?.textContent }));
  ok(d1.i === d0 + 1, 'D6 with storage refused, the briefing deck still moves on (your place is kept until the app closes) ' + JSON.stringify({ d0, d1 }));
  await P.evaluate(() => { Storage.prototype.setItem = window.__realSet; });
  // The once-a-day next step isn't spent if you never saw it.
  await P.evaluate(() => { drMemSet('practice', 'on'); const m = JSON.parse(localStorage.getItem('ih_smileyMemory')); m.people.jose.shown = {}; localStorage.setItem('ih_smileyMemory', JSON.stringify(m)); ASK.turns = []; askNextOffer = null; termReviewsLoaded = false; lazyLoads.delete('termReviews'); const d = window.__delay; window.__delay = c => c === 'term-reviews' ? new Promise(r => setTimeout(r, 1200)) : d(c); });
  await L.go(P, 'ask', 150); await L.go(P, 'home', 2000);
  await L.go(P, 'ask', 2500);
  ok(await P.evaluate(() => !!document.querySelector('#askNext:not([hidden])')), 'D4 leaving Ask before the next step appeared doesn’t use up today’s offer');

  ok(!P.__errors.length, 'page errors: ' + JSON.stringify(P.__errors));
  fs.writeFileSync(shots + 'results.json', JSON.stringify(RESULTS));
  await b.close();
})();
