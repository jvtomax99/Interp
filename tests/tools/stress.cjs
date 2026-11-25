/* Stress check, part 1: long text on every screen (docs/PLAN.md, the
   consistency pass). A 60-character doctor name, a very long term (one
   45-letter word, and a long phrase) and chat messages with no spaces are
   put into the stand-in database, then every screen is opened at phone
   size and measured: does the page scroll sideways, does the text leave
   the screen or its own box, is it cut with no "..." to say so, and did a
   button shrink or get covered that was fine without the long text.

   A finding tool, not a suite: it prints what it finds and saves a
   screenshot of each screen with a finding to tests/out/stress/.
   DEVICE=narrow (360 wide) or iphone (393, default). ONLY=name to run one. */
const fs = require('fs');
const { chromium, boot, go, sweep, OUT } = require('../support/harness.cjs');
const DEVICE = process.env.DEVICE || 'iphone';
const DIR = OUT + 'stress/' + DEVICE + '/';
fs.mkdirSync(DIR, { recursive: true });
const REPORT = OUT + 'stress/long-text-' + DEVICE + '.json';

const DOCTOR = 'Dr. Maximiliano Alejandro Fernández-Montenegro de la Vega MD';
if (DOCTOR.length !== 60) throw new Error('doctor name is ' + DOCTOR.length);
const WORD_EN = 'Pneumonoultramicroscopicsilicovolcanoconiosis';
const WORD_ES = 'Neumonoultramicroscopicosilicovolcanoconiosis';
const PHRASE_EN = 'Hematopoietic stem cell transplantation-associated thrombotic microangiopathy with multiorgan dysfunction syndrome';
const PHRASE_ES = 'Microangiopatía trombótica asociada al trasplante de células madre hematopoyéticas con síndrome de disfunción multiorgánica';
const NOSPACE = 'W'.repeat(240);
const LONGURL = 'https://example.org/' + 'interpretacion'.repeat(16);
const MARKS = ['Montenegro', 'silicovolcano', 'microangiopat', 'Microangiopat', 'WWWWWW', 'interpretacioninterp'];

const inject = (o) => {
  let real;
  Object.defineProperty(window, '__DB', { configurable: true, get: () => real, set(DB) {
    real = DB;
    if (!o.on) return;
    DB.terms.stressWord = { id: 'stressWord', categoryId: 'onco', en: o.WORD_EN, es: o.WORD_ES, def: 'A lung disease caused by breathing in very fine silica dust.', source: '' };
    DB.terms.stressPhrase = { id: 'stressPhrase', categoryId: 'onco', en: o.PHRASE_EN, es: o.PHRASE_ES, def: 'Small-vessel clotting after a transplant.', source: '' };
    Object.assign(DB['doctor-directory'].d0, { name: o.DOCTOR, customTerms: [{ en: o.WORD_EN, es: o.WORD_ES }] });
    DB['healthcare-providers'].p0.name = o.DOCTOR;
    DB['activity-log'].aStress = { author: 'Maria', summary: 'added "' + o.WORD_EN + '" to Oncology', timestamp: Date.now() - 1000 };
    const t = Date.now() - 60000;
    DB['team-chat'].zs1 = { text: o.NOSPACE, author: 'Maria', timestamp: t, replyTo: null };
    DB['team-chat'].zs2 = { text: o.LONGURL, author: 'Jose', timestamp: t + 1000, replyTo: null };
    DB['team-chat'].zs3 = { text: 'Is that the one for ' + o.DOCTOR + '?', author: 'Ana', timestamp: t + 2000, replyTo: { id: 'zs1', author: 'Maria', text: o.NOSPACE } };
  } });
};

/* What the long text did to the screen that is showing. */
const measure = (page, marks) => page.evaluate((marks) => {
  const c = document.getElementById('content'); if (c) c.classList.add('cv-all');
  const vw = innerWidth, out = [];
  const scrollerX = el => { for (let a = el; a && a !== document.documentElement; a = a.parentElement) { const s = getComputedStyle(a);
    if (/auto|scroll/.test(s.overflowX) && a.scrollWidth > a.clientWidth + 1) return a; } return null; };
  const name = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const mark = marks.find(m => n.nodeValue.includes(m)); if (!mark) continue;
    const el = n.parentElement; if (!el || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    if (el.closest('script,style,datalist,option,[aria-hidden="true"]')) continue;
    const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (!b.width) continue;
    const add = (kind, extra) => { const k = kind + name(el); if (seen.has(k)) return; seen.add(k); out.push(Object.assign({ kind, mark, el: name(el) }, extra)); };
    const sx = scrollerX(el);
    // clipped by an ancestor?
    let clip = null;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a); if (s.display === 'inline') continue;
      const ar = a.getBoundingClientRect();
      const hidesX = /hidden|clip/.test(s.overflowX), hidesY = /hidden|clip/.test(s.overflowY);
      if (hidesX && (b.right > ar.right + 1 || a.scrollWidth > a.clientWidth + 1)) {
        clip = { by: name(a), dots: s.textOverflow === 'ellipsis', lost: Math.round(Math.max(b.right - ar.right, a.scrollWidth - a.clientWidth)) }; break; }
      if (hidesY && a.scrollHeight > a.clientHeight + 1 && b.bottom > ar.bottom + 1) {
        clip = { by: name(a), dots: (s.webkitLineClamp && s.webkitLineClamp !== 'none'), lost: Math.round(b.bottom - ar.bottom), vertical: true }; break; }
      if (!hidesX && !sx && b.right > ar.right + 1.5 && ar.width > 0) { add('spills out of its box', { box: name(a), by: Math.round(b.right - ar.right) }); break; }
    }
    if (clip) add(clip.dots ? 'shortened with ...' : 'cut with no ...', clip);
    if (!sx && !clip && (b.right > vw + 1 || b.left < -1)) add('runs off the screen', { right: Math.round(b.right), vw });
    if (sx) add('scrolls sideways inside', { box: name(sx) });
  }
  // anything else pushed past the right edge
  const pushed = [];
  for (const el of document.querySelectorAll('body *')) {
    if (pushed.length >= 6) break;
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || el.closest('svg')) continue;
    if (r.right > vw + 1 && r.left < vw && !scrollerX(el) && getComputedStyle(el).position !== 'fixed') {
      let cl = false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { if (/hidden|clip/.test(getComputedStyle(a).overflowX)) { cl = true; break; } }
      if (!cl && !pushed.some(p => p.includes(name(el)))) pushed.push(name(el) + ' right=' + Math.round(r.right));
    }
  }
  return { hScroll: document.documentElement.scrollWidth - innerWidth, marks: out, pushed };
}, marks);

const q = s => JSON.stringify(s);
const SCREENS = [
  ['home', p => go(p, 'home')],
  ['all domains', p => go(p, 'all')],
  ['oncology', p => go(p, 'onco')],
  ['search long word', p => p.evaluate(`setCategory('all'); searchQuery = 'silicovolcano'; renderContent();`)],
  ['search long phrase', p => p.evaluate(`setCategory('all'); searchQuery = 'microangiopathy'; renderContent();`)],
  ['global search doctor', p => p.evaluate(`searchQuery=''; setCategory('home'); openGlobalSearch(); const i = document.getElementById('gsInput'); i.value = 'Montenegro'; i.dispatchEvent(new Event('input', { bubbles: true }));`)],
  ['global search term', p => p.evaluate(`setCategory('home'); openGlobalSearch(); const i = document.getElementById('gsInput'); i.value = 'silicovolcano'; i.dispatchEvent(new Event('input', { bubbles: true }));`)],
  ['edit term sheet', p => p.evaluate(`setCategory('onco'); openEditModal('onco', 'stressWord');`)],
  ['term history sheet', p => p.evaluate(`setCategory('onco'); openHistoryModal('onco', 'stressWord');`)],
  ['doctors', async p => { await p.evaluate(`if (typeof closeModal === 'function') closeModal();`); await go(p, 'doctors'); }],
  ['doctor directory', p => go(p, 'doctor-directory')],
  ['doctor page', p => p.evaluate(`setCategory('doctor-directory'); openDoctorDirDetail('d0')`)],
  ['doctor page, terms tab', p => p.evaluate(`setCategory('doctor-directory'); openDoctorDirDetail('d0', 'terms')`)],
  ['edit doctor sheet', p => p.evaluate(`setCategory('doctor-directory'); _openEditDoctorDirModal('d0')`)],
  ['providers', async p => { await p.evaluate(`if (typeof closeDoctorDirDetail === 'function') closeDoctorDirDetail(); if (typeof closeModal === 'function') closeModal();`); await go(p, 'providers'); }],
  ['edit provider sheet', p => p.evaluate(`setCategory('providers'); openEditProviderModal('p0')`)],
  ['doctor prep, name typed', async p => { await p.evaluate(`if (typeof closeModal === 'function') closeModal();`); await go(p, 'doctor-research'); await p.fill('#doctorResearchInput', DOCTOR); }],
  ['doctor prep, result', async p => { await go(p, 'doctor-research'); await p.fill('#doctorResearchInput', DOCTOR); await p.evaluate(`typeof runDoctorResearch === 'function' && runDoctorResearch()`); await p.waitForTimeout(1500); }],
  ['briefing for the doctor', p => p.evaluate(`PREP.domainId = 'onco'; PREP.doctor = ${q(DOCTOR)}; setCategory('prep');`)],
  ['appointment for the doctor', p => p.evaluate(`startAppt()`)],
  ['chat', async p => { await p.evaluate(`APPT = null;`); await go(p, 'chat', 1500); }],
  ['chat, replying to the long one', async p => { await go(p, 'chat', 1500); await p.evaluate(`startChatReply('zs1')`); }],
  ['chat, message menu', async p => { await go(p, 'chat', 1500); await p.evaluate(`const m = document.querySelector('[data-mid="zs1"], #msg-zs1'); typeof cancelChatReply === 'function' && cancelChatReply(); openChatMenuFor({ preventDefault(){}, stopPropagation(){}, clientX: 100, clientY: 300 }, 'zs1', m);`); }],
  ['updates', async p => { await p.evaluate(`document.querySelectorAll('.chat-menu, .msg-menu').forEach(e => e.remove()); document.body.click();`); await go(p, 'updates'); }],
  ['term review session', p => p.evaluate(`(async () => { setCategory('review'); await startReview(); })()`)],
  ['memory trainer', p => go(p, 'memory')],
  ['translate, long input', async p => { await go(p, 'translate'); await p.fill('#trInput', PHRASE_EN + ' ' + WORD_EN); await p.evaluate(`typeof runTranslate === 'function' && runTranslate()`); await p.waitForTimeout(1200); }],
  ['ask the hub, long question', async p => { await go(p, 'ask'); await p.fill('#askInput', NOSPACE); await p.evaluate(`submitAsk()`); await p.waitForTimeout(1500); }],
  ['notifications', p => go(p, 'notifications')],
  ['trash, long term deleted', async p => { await p.evaluate(`(async () => { const c = window.confirm; window.confirm = () => true; try { await deleteTerm('onco', 'stressPhrase'); } finally { window.confirm = c; } })()`); await p.waitForTimeout(600);
    await p.evaluate(`document.querySelectorAll('.modal-bg.open').forEach(m => { const b = m.querySelector('.btn-danger, .btn-primary'); b && b.click(); });`); await p.waitForTimeout(800); await go(p, 'trash'); }],
];

(async () => {
  const browser = await chromium.launch();
  const report = {};
  try {
    const runs = {};
    for (const on of [false, true]) {
      const { ctx, page } = await boot(browser, { device: DEVICE, init: `(${inject.toString()})(${JSON.stringify({ on, DOCTOR, WORD_EN, WORD_ES, PHRASE_EN, PHRASE_ES, NOSPACE, LONGURL })})` });
      runs[on] = {};
      for (const [name, fn] of SCREENS) {
        if (process.env.ONLY && !name.includes(process.env.ONLY)) continue;
        let err = null;
        await page.evaluate(() => { for (const f of ['closeChatMenu','cancelChatReply','closeGlobalSearch','closeModal','closeHistoryModal','closeDoctorDirModal','closeProviderModal','closeDoctorDirDetail','closeTermLookup','closeAllOverlays'])
          try { if (!(f === 'closeGlobalSearch' && window.__keepSearch) && typeof window[f] === 'function') window[f](f === 'closeChatMenu' ? true : undefined); } catch (e) {}
          window.__keepSearch = false; if (typeof searchQuery !== 'undefined') searchQuery = ''; });
        await page.waitForTimeout(250);
        try { await fn(page); } catch (e) { err = String(e.message).split('\n')[0]; }
        await page.waitForTimeout(900);
        const sw = await sweep(page);
        const m = await measure(page, MARKS);
        runs[on][name] = { sw, m, err };
        if (on) {
          const base = runs[false][name] || { sw: { small: [], covered: [] }, m: { pushed: [], hScroll: 0 } };
          m.pushed = m.pushed.filter(x => !base.m.pushed.includes(x)); if (base.m.hScroll >= m.hScroll) m.hScroll = 0;
          const key = s => s.name + ' ' + s.w + 'x' + s.h;
          const newSmall = sw.small.filter(s => !base.sw.small.some(b => b.name === s.name && b.w <= s.w + 1 && b.h <= s.h + 1)).filter(s => !MARKS.some(k => s.name.includes(k)) || true).map(key);
          const newCovered = sw.covered.filter(s => !base.sw.covered.some(b => b.name === s.name)).map(s => s.name + ' under ' + s.by);
          const bad = m.marks.filter(x => x.kind !== 'shortened with ...' && x.kind !== 'scrolls sideways inside');
          const found = m.marks.length;
          const fail = bad.length || m.hScroll > 0 || m.pushed.length || err;
          report[name] = { found, err, hScroll: m.hScroll, marks: m.marks, pushed: m.pushed, newSmall, newCovered, pageErrors: page.__errors.slice() };
          const file = name.replace(/[^a-z0-9]+/gi, '-');
          // put the worst finding on screen, then take the picture
          await page.evaluate((marks) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let n = w.nextNode(); n; n = w.nextNode()) if (marks.some(k => n.nodeValue.includes(k)) && n.parentElement.checkVisibility() && !n.parentElement.closest('[aria-hidden="true"],datalist')) { n.parentElement.scrollIntoView({ block: 'center' }); break; } }, MARKS).catch(() => {});
          await page.waitForTimeout(350);
          await page.screenshot({ path: DIR + file + '.png' });
          console.log((fail ? 'LOOK ' : found ? 'ok   ' : 'none ') + name + (err ? '  [step failed: ' + err + ']' : '') + (m.hScroll > 0 ? '  page scrolls sideways ' + m.hScroll + 'px' : ''));
          for (const x of m.marks) console.log('       ' + x.kind + ': ' + x.mark + ' in ' + x.el + ' ' + JSON.stringify(Object.assign({}, x, { kind: undefined, mark: undefined, el: undefined })));
          if (m.pushed.length) console.log('       pushed off: ' + m.pushed.join('; '));
          if (newSmall.length) console.log('       smaller taps than without: ' + newSmall.slice(0, 6).join('; '));
          if (newCovered.length) console.log('       newly covered: ' + newCovered.slice(0, 6).join('; '));
          fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));
        }
      }
      if (page.__errors.length) console.log('page errors (' + (on ? 'long text' : 'plain') + '):', [...new Set(page.__errors)].slice(0, 8));
      await ctx.close();
    }
  } finally { await browser.close(); }
})();
