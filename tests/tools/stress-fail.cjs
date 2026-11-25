/* Stress check, part 2: each failure forced, and its message read
   (docs/PLAN.md, the consistency pass). Three kinds of failure:

     offline   the phone has no connection (navigator.onLine false, requests
               fail, and a database write never answers, which is what the
               real Firestore does with no offline cache)
     ai down   our AI endpoints answer 503, 500 or 429, or don't answer
     refused   the database refuses the write (permission-denied), a photo
               upload fails, or the phone's own storage is full

   A finding tool, not a suite: for every action it prints each message the
   app showed (toasts are recorded as they appear, so a 2-second one is not
   missed) and saves a phone screenshot to tests/out/stress/fail/.
   ONLY=text runs the scenarios whose name includes it. */
const fs = require('fs');
const { chromium, boot, go, OUT } = require('../support/harness.cjs');
const DIR = OUT + 'stress/fail/';
fs.mkdirSync(DIR, { recursive: true });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFklEQVR4nGP8z8DAwMDAxAADNGEMdkUAHDABD0Gc3lQAAAAASUVORK5CYII=', 'base64');

/* Faults */
const offline = async (page, ctx) => { await ctx.setOffline(true);
  // a stand-in answer must not get through while the phone is offline
  await page.route('**/api/**', r => r.abort('internetdisconnected')); await page.route('**://api.mymemory.translated.net/**', r => r.abort('internetdisconnected')); await page.evaluate(() => { window.__gate = () => new Promise(() => {}); }); };
const deny = page => page.evaluate(() => { window.__gate = () => Promise.reject(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' })); });
const uploadFails = page => page.evaluate(() => { window.__UPLOADS = window.__UPLOADS || { puts: [], deletes: [], ms: 600, fail: false }; window.__UPLOADS.fail = true; });
const storageFull = page => page.evaluate(() => { Storage.prototype.setItem = function () { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); }; });
const api = (status, body) => page => page.route('**/api/**', r => status === 'abort' ? r.abort('failed') : r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body || { error: 'server_error' }) }));
const LIMIT = { error: 'daily_limit', message: 'This phone has reached today’s limit for the AI tools. They work again tomorrow.' };

/* Actions. Fired without waiting: a write that never answers must not hang the tool. */
const ev = (p, code) => p.evaluate(`(() => { try { Promise.resolve((() => { ${code} })()).catch(() => {}); } catch (e) { window.__actErr = String(e); } })()`);

const A = {
  chatSend: async p => { await go(p, 'chat', 1200); await p.fill('#chatInput', 'Can someone cover 4 West at 3?'); await ev(p, `sendChatMessage()`); },
  chatReact: async p => { await go(p, 'chat', 1200); await ev(p, `toggleChatReaction('c3', '👍')`); },
  chatDelete: async p => { await go(p, 'chat', 1200); await ev(p, `deleteChatMessage('c8')`); },
  chatPhoto: async p => { await go(p, 'chat', 1200); await p.setInputFiles('#chatFileInput', { name: 'sign.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(1500); await p.fill('#chatInput', 'The new sign'); await ev(p, `sendChatMessage()`); },
  termAdd: async p => { await go(p, 'onco'); await ev(p, `openAddModal()`); await p.fill('#fEn', 'Port-a-cath'); await p.fill('#fEs', 'Catéter con reservorio'); await ev(p, `saveTerm()`); },
  termDelete: async p => { await go(p, 'onco'); await ev(p, `(() => { const t = Object.values(__DB.terms).find(t => t.categoryId === 'onco'); deleteTerm('onco', t.id); })()`); },
  doctorAdd: async p => { await go(p, 'doctor-directory'); await ev(p, `openAddDoctorDirModal()`); await p.fill('#fDDName', 'Dr. Lori Leslie'); await ev(p, `saveDoctorDirEntry()`); },
  providerAdd: async p => { await go(p, 'providers'); await ev(p, `openAddProviderModal()`); await p.fill('#fPName', 'Dr. Angela Waintrub'); await ev(p, `saveProvider()`); },
  providerPhoto: async p => { await go(p, 'providers'); await ev(p, `openAddProviderModal()`); await p.fill('#fPName', 'Dr. Angela Waintrub'); await p.setInputFiles('#fPPhoto', { name: 'face.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(1200); await ev(p, `saveProvider()`); },
  myPhoto: async p => { await ev(p, `openNameModal()`); await p.waitForTimeout(500); await p.setInputFiles('#myPhotoInput', { name: 'me.png', mimeType: 'image/png', buffer: PNG }); await p.waitForTimeout(1500);
    await ev(p, `(() => { const b = [...document.querySelectorAll('button')].find(b => b.checkVisibility() && /^(use|save|done)/i.test(b.textContent.trim())); b && b.click(); })()`); },
  termPhoto: async p => { await go(p, 'onco'); await ev(p, `(() => { const t = Object.values(__DB.terms).find(t => t.categoryId === 'onco'); if (typeof pendingAttachTermId !== 'undefined') pendingAttachTermId = t.id; if (typeof attachTargetTermId !== 'undefined') attachTargetTermId = t.id; })()`);
    await p.setInputFiles('#termAttachInput', { name: 'scan.png', mimeType: 'image/png', buffer: PNG }); },
  translate: async p => { await go(p, 'translate'); await p.fill('#trInput', 'heart failure'); await ev(p, `runTranslate()`); },
  lookup: async p => { await go(p, 'onco'); await ev(p, `(() => { const t = Object.values(__DB.terms).find(t => t.categoryId === 'onco'); openTermLookup('onco', t.id); })()`); },
  doctorPrep: async p => { await go(p, 'doctor-research'); await p.fill('#doctorResearchInput', 'Dr. Andre Goy'); await ev(p, `runDoctorResearch()`); },
  ask: async p => { await go(p, 'ask'); await p.fill('#askInput', 'What is an ejection fraction?'); await ev(p, `submitAsk()`); },
  signIn: async p => { await ev(p, `typeof openMoreSheet === 'function' && openMoreSheet()`); await p.waitForTimeout(500); await ev(p, `accountSend(null, 'ana@example.org')`); },
  nothing: async p => { await go(p, 'home'); },
  reload: async p => { await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {}); },
};

const S = [];
const add = (kind, name, faults, act, wait) => S.push({ kind, name, faults, act, wait: wait || 3500 });
for (const k of ['chatSend', 'chatReact', 'chatDelete', 'chatPhoto', 'termAdd', 'termDelete', 'doctorAdd', 'providerAdd', 'translate', 'lookup', 'doctorPrep', 'ask', 'signIn', 'nothing'])
  add('offline', k, [offline], A[k], k === 'doctorAdd' || k === 'providerAdd' || k === 'chatDelete' ? 9000 : 3500);
for (const [label, f] of [['503', api(503, { error: 'not_configured' })], ['500', api(500)], ['429 daily limit', api(429, LIMIT)], ['401 members only', api(401, { error: 'members_only' })], ['no answer', api('abort')]])
  for (const k of ['translate', 'lookup', 'doctorPrep', 'ask', 'termAdd', 'signIn']) add('ai down ' + label, k, [f], A[k]);
for (const k of ['chatSend', 'chatReact', 'chatDelete', 'termAdd', 'termDelete', 'doctorAdd', 'providerAdd']) add('database refuses', k, [deny], A[k]);
for (const k of ['chatPhoto', 'providerPhoto', 'myPhoto', 'termPhoto']) add('upload fails', k, [uploadFails], A[k], 5000);
for (const k of ['chatSend', 'termAdd', 'nothing']) add('phone storage full', k, [storageFull], A[k]);
for (const k of ['chatSend', 'termAdd']) add('phone storage full, offline', k, [storageFull, offline], A[k]);

(async () => {
  const browser = await chromium.launch();
  const report = [];
  try {
    for (const s of S) {
      const id = s.kind + ' / ' + s.name;
      if (process.env.ONLY && !id.includes(process.env.ONLY)) continue;
      const { ctx, page } = await boot(browser, { device: 'iphone', settle: 3600 });
      page.on('dialog', d => d.accept().catch(() => {}));
      let err = null, seen = {};
      try {
        await page.evaluate(() => { window.__toasts = [];
          const t = document.getElementById('toast');
          new MutationObserver(() => { const x = t.textContent.replace(/\s+/g, ' ').trim(); if (x && t.classList.contains('show') && window.__toasts[window.__toasts.length - 1] !== x) window.__toasts.push(x); })
            .observe(t, { childList: true, characterData: true, subtree: true, attributes: true }); });
        for (const f of s.faults) await f(page, ctx);
        await page.waitForTimeout(400);
        await s.act(page);
        await page.waitForTimeout(1300);
        await page.screenshot({ path: DIR + id.replace(/[^a-z0-9]+/gi, '-') + '.png' });
        await page.waitForTimeout(s.wait - 1300);
        seen = await page.evaluate(() => {
          const txt = sel => [...document.querySelectorAll(sel)].filter(e => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getClientRects().length).map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).map(x => x.slice(0, 260));
          const sync = document.getElementById('tgSync');
          return { toasts: window.__toasts, note: txt('#tcNote'), badge: sync && sync.checkVisibility() ? ((sync.textContent || '').trim() + ' | ' + (sync.getAttribute('aria-label') || sync.title || '')) : '',
            inline: txt('.doc-research-error, .tr-note, .lookup-empty, #acctMsg, .acct-msg, #accessMsg, .ask-card.is-error, .ask-error, .ask-wait, .ask-status, .tc-attach-err, .chat-attach-error, .modal-error, .field-error'),
            sheetOpen: txt('.overlay.show h2, .overlay.show h3, .modal-bg.open h2').slice(0, 3),
            busy: txt('button[disabled]').slice(0, 4),
            trays: [...document.querySelectorAll('#chatAttachPreview [title]')].map(e => e.getAttribute('title')).filter(Boolean),
            ask: [...new Set(txt('[class*="ask-"][class*="err"], [class*="ask-"][class*="fail"], [class*="ask-wait"], [class*="ask-"][role="alert"], .ask-state'))].slice(0, 3),
            askAll: (typeof activeCategory !== 'undefined' && activeCategory === 'ask') ? document.getElementById('content').innerText.replace(/\s+/g, ' ').split('What is an ejection fraction?').pop().trim().slice(0, 220) : '',
            acct: (typeof ACCT !== 'undefined' && ACCT.msg) || '' };
        });
      } catch (e) { err = String(e.message).split('\n')[0]; }
      const row = Object.assign({ id, err, errors: page.__errors.slice(0, 4) }, seen);
      report.push(row);
      console.log('== ' + id + (err ? '   [step failed: ' + err + ']' : ''));
      for (const k of ['toasts', 'note', 'badge', 'inline', 'trays', 'ask', 'askAll', 'acct', 'sheetOpen', 'busy', 'errors']) { const v = row[k]; if (v && v.length) console.log('     ' + k + ': ' + (Array.isArray(v) ? v.map(x => JSON.stringify(x)).join('  ') : v)); }
      if (!err && !['toasts', 'note', 'inline', 'trays', 'ask', 'askAll', 'acct'].some(k => row[k] && row[k].length)) console.log('     NOTHING SAID');
      fs.writeFileSync(OUT + 'stress/fail' + (process.env.ONLY ? '-' + process.env.ONLY.replace(/[^a-z0-9]+/gi, '-') : '') + '.json', JSON.stringify(report, null, 1));
      await ctx.close();
    }
  } finally { await browser.close(); }
})();
