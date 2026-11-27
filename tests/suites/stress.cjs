/* The stress checks' fixes (the consistency pass, 2026-11-25). Long text
   stays inside its card: a 45-letter word with no space on a term card,
   on Home's Recent Team Activity, on Recent Updates and in the search
   panel, and a 60-character name on a Provider Pictures card. And a
   failure says something an interpreter can act on: saving a doctor or a
   provider, or deleting a chat message, while offline (those writes are
   not in the outbox and never answered); Doctor Prep and Term lookup at
   the daily limit; a save or a chat message the database refuses; a photo
   that doesn't upload. The finding tools are tests/tools/stress.cjs and
   stress-fail.cjs. */
const { chromium, boot, go } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(c, m, d) { if (c) { passed++; console.log('  PASS', m); } else { failed++; process.exitCode = 1; console.log('  FAIL', m, d === undefined ? '' : JSON.stringify(d).slice(0, 400)); } }
const WORD = 'Pneumonoultramicroscopicsilicovolcanoconiosis';
const NAME = 'Dr. Maximiliano Alejandro Fernández-Montenegro de la Vega MD';
const inject = `(() => { let real; Object.defineProperty(window, '__DB', { configurable: true, get: () => real, set(DB) { real = DB;
  DB.terms.stressWord = { id: 'stressWord', categoryId: 'onco', en: ${JSON.stringify(WORD)}, es: 'Neumonoultramicroscopicosilicovolcanoconiosis', def: 'A lung disease.', source: '' };
  DB['healthcare-providers'].p0.name = ${JSON.stringify(NAME)};
  DB['activity-log'].aStress = { author: 'Maria', summary: 'added "${WORD}" to Oncology', timestamp: Date.now() - 1000 }; } }); })()`;
/* Every piece of text holding `mark` is inside the box `sel` it sits in, and the screen. */
const inside = (page, mark, sel) => page.evaluate(([mark, sel]) => {
  const c = document.getElementById('content'); if (c) c.classList.add('cv-all');
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), out = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (!n.nodeValue.includes(mark)) continue;
    const box = n.parentElement.closest(sel); if (!box || !box.checkVisibility()) continue;
    // where the text ends: its own box, cut by an ancestor inside the card that hides overflow.
    // Never by the card itself: a card that hides its overflow would pass with the word cut off.
    const r = document.createRange(); r.selectNodeContents(n); let right = r.getBoundingClientRect().right;
    for (let a = n.parentElement; a && a !== box; a = a.parentElement) { const s = getComputedStyle(a); if (s.display !== 'inline' && /hidden|clip/.test(s.overflowX)) right = Math.min(right, a.getBoundingClientRect().right); }
    out.push({ over: Math.round(right - box.getBoundingClientRect().right), offScreen: Math.round(right - innerWidth) });
  }
  return out;
}, [mark, sel]);
const toasts = page => page.evaluate(() => { window.__toasts = []; const t = document.getElementById('toast');
  new MutationObserver(() => { const x = t.textContent.trim(); if (x && t.classList.contains('show')) window.__toasts.push(x); }).observe(t, { childList: true, characterData: true, subtree: true, attributes: true }); });
const said = page => page.evaluate(() => window.__toasts.join(' | '));
const fire = (page, code) => page.evaluate(`(() => { try { Promise.resolve((() => { ${code} })()).catch(() => {}); } catch (e) {} })()`);

(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'narrow']) {
      console.log('== long text, ' + device);
      const { ctx, page } = await boot(browser, { device, init: inject });
      try {
        const check = async (name, mark, sel) => { const r = await inside(page, mark, sel);
          ok(r.length && r.every(x => x.over <= 1 && x.offScreen <= 0), `${name}: the long text stays inside its card`, r);
          ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: the page does not scroll sideways`); };
        await go(page, 'home'); await check('Home, Recent Team Activity', 'silicovolcano', '.home-feed-row');
        await page.evaluate(`setCategory('all'); searchQuery = 'silicovolcano'; renderContent();`); await page.waitForTimeout(900);
        await check('a term card', 'silicovolcano', '.card');
        const more = await page.evaluate(() => { const card = document.querySelector('.card[data-term-id="stressWord"]'); if (!card) return null;
          const span = card.querySelector('.term-en > span'), btn = [...card.querySelectorAll('button')].find(b => /more|menu|options/i.test(b.getAttribute('aria-label') || b.title || '') || b.textContent.trim() === '⋯');
          if (!span || !btn) return { span: !!span, btn: !!btn }; const a = span.getBoundingClientRect(), b = btn.getBoundingClientRect();
          return { overlap: a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1 && a.left < b.right }; });
        ok(more && more.overlap === false, 'a term card: the word does not run under the ⋯ button', more);
        await page.evaluate(`searchQuery = '';`); await go(page, 'updates'); await check('Recent Updates', 'silicovolcano', '.activity-row');
        await go(page, 'home'); await page.evaluate(`openGlobalSearch(); const i = document.getElementById('gsInput'); i.value = 'silicovolcano'; i.dispatchEvent(new Event('input', { bubbles: true }));`); await page.waitForTimeout(900);
        // the word's tail: the typed part is highlighted, which splits the word into pieces
        await check('the search panel', 'coniosis', '.gs-item');
        ok(await page.evaluate(() => { const g = document.getElementById('gsResults'); return g.scrollWidth <= g.clientWidth + 1; }), 'the search panel: its results do not scroll sideways');
        await page.evaluate(`closeGlobalSearch()`); await go(page, 'providers'); await check('a provider card', 'Montenegro', '.card');
        const prov = await page.evaluate(() => { const n = [...document.querySelectorAll('.provider-name')].find(e => e.textContent.includes('Montenegro')); const b = n.closest('.card').querySelector('.actions');
          return Math.round(n.getBoundingClientRect().right - b.getBoundingClientRect().left); });
        ok(prov <= 0, 'a provider card: the name stops before the edit and delete buttons', prov);
        ok(!page.__errors.length, 'no page errors', page.__errors);
      } finally { await ctx.close(); }
    }

    console.log('== failures say something useful');
    const run = async (name, faults, act, read, test) => {
      const { ctx, page } = await boot(browser, { device: 'iphone', settle: 3600 });
      try { await toasts(page); await faults(page, ctx); await act(page); await page.waitForTimeout(2500);
        const text = await (read || said)(page); ok(test(text), name + ': "' + String(text).slice(0, 110) + '"', text);
      } finally { await ctx.close(); }
    };
    const off = async (page, ctx) => { await ctx.setOffline(true); await page.evaluate(() => { window.__gate = () => new Promise(() => {}); }); };
    const deny = page => page.evaluate(() => { window.__gate = () => Promise.reject(Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' })); });
    const api = (status, body) => page => page.route('**/api/**', r => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }));
    const plain = t => t && !/firestore|rule\b|\[|permission-denied|_/i.test(t);
    await run('saving a doctor offline', off, async p => { await go(p, 'doctor-directory'); await fire(p, `openAddDoctorDirModal()`); await p.fill('#fDDName', 'Dr. Lori Leslie'); await fire(p, `saveDoctorDirEntry()`); }, null, t => /Doctor saved on this device/.test(t) && /back online/.test(t));
    await run('saving a provider offline', off, async p => { await go(p, 'providers'); await fire(p, `openAddProviderModal()`); await p.fill('#fPName', 'Dr. Angela Waintrub'); await fire(p, `saveProvider()`); }, null, t => /offline/i.test(t) && !/saved\./i.test(t));
    await run('deleting a chat message offline', off, async p => { p.on('dialog', d => d.accept().catch(() => {})); await go(p, 'chat', 1200); await fire(p, `deleteChatMessage('c8')`); }, null, t => /offline/i.test(t));
    await run('a term the database refuses', deny, async p => { await go(p, 'onco'); await fire(p, `openAddModal()`); await p.fill('#fEn', 'Port-a-cath'); await fire(p, `saveTerm()`); }, null, t => plain(t) && /Team access/.test(t));
    await run('a chat message the database refuses', deny, async p => { await go(p, 'chat', 1200); await p.fill('#chatInput', 'Can someone cover 4 West?'); await fire(p, `sendChatMessage()`); }, null, t => /refused/.test(t) && !/connection/.test(t));
    const prepErr = p => p.evaluate(() => (document.querySelector('.doc-research-error') || {}).textContent || '');
    const prep = async p => { await go(p, 'doctor-research'); await p.fill('#doctorResearchInput', 'Dr. Andre Goy'); await fire(p, `runDoctorResearch()`); };
    await run('Doctor Prep at the daily limit', api(429, { error: 'daily_limit', message: 'This phone has reached today’s limit for the AI tools. They work again tomorrow.' }), prep, prepErr, t => /tomorrow/.test(t) && plain(t));
    await run('Doctor Prep for a phone outside the team', api(401, { error: 'members_only' }), prep, prepErr, t => /team code/.test(t) && plain(t));
    await run('Doctor Prep, a server sentence is kept', api(502, { error: 'Research service is temporarily unavailable. Please try again.' }), prep, prepErr, t => /temporarily unavailable/.test(t));
    const lookErr = p => p.evaluate(() => (document.querySelector('.lookup-empty') || {}).textContent || '');
    const look = p => fire(p, `const t = Object.values(__DB.terms).find(t => t.categoryId === 'onco'); setCategory('onco'); openTermLookup('onco', t.id);`);
    await run('Term lookup at the daily limit', api(429, { error: 'daily_limit' }), look, lookErr, t => /tomorrow/.test(t) && !/temporary/.test(t));
    await run('Term lookup for a phone outside the team', api(401, { error: 'members_only' }), look, lookErr, t => /team code/.test(t) && !/temporary/.test(t));
    await run('adding a tip for a doctor offline', off, p => fire(p, `DT.id = 'd0'; document.getElementById('fDTip').value = 'Speaks fast'; saveDoctorTip()`), null, t => /Tip added on this device/.test(t) && /back online/.test(t));
    await run('joining duplicate doctors offline', off, p => fire(p, `['x1', 'x2'].forEach(id => DOCTOR_DIRECTORY.push({ id, name: 'Dr. Twin Offline', specialty: 'Renal' })); mergeDuplicateDoctors('x1')`), null, t => /offline/i.test(t) && /needs a connection/.test(t));
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFklEQVR4nGP8z8DAwMDAxAADNGEMdkUAHDABD0Gc3lQAAAAASUVORK5CYII=', 'base64');
    await run('a provider photo that fails to upload', p => p.evaluate(() => { window.__UPLOADS = window.__UPLOADS || { puts: [], deletes: [], ms: 600, fail: false }; window.__UPLOADS.fail = true; }),
      async p => { await go(p, 'providers'); await fire(p, `openAddProviderModal()`); await p.setInputFiles('#fPPhoto', { name: 'face.png', mimeType: 'image/png', buffer: PNG }); }, null, t => /didn.t upload/.test(t) && !/upload failed/.test(t));
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
