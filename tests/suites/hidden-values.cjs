/* Hidden values from the database can't run as code (security pass,
   2026-11-15; the helpers after escapeAttr in index.html).

   Any phone with the team code can write a chat message, a term, a domain's
   colour, an attachment. The words people read were always escaped; the
   values nobody reads (a document's id, a colour, a size, an address) were
   not, so a doctored one ran on every phone that drew it. This writes one
   of each kind into the fake database, opens the screens that draw them and
   taps what can be tapped. Any payload that runs adds 1 to window.__pwned. */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

(async () => {
  const b = await L.chromium.launch();
  const { page } = await L.boot(b, { device: 'iphone', name: 'Ana Torres', settle: 5000 });

  console.log('== the helpers');
  const unit = await page.evaluate(() => {
    if (typeof safeId !== 'function') return null;
    const out = {};
    out.ids = [safeId('mb3k2a9x1z'), safeId('heart-failure_2'), safeId('Ana Torres__t1'), safeId('a"b'), safeId("a'b"), safeId('a<b'), safeId('a&b'), safeId('a\\b'), safeId('a`b'), safeId(''), safeId(7)];
    out.urls = [externalUrl('javascript:alert(1)'), externalUrl('JaVaScRiPt:alert(1)'), externalUrl('data:text/html,<script>1</script>'), externalUrl('vbscript:x'),
                externalUrl('https://medlineplus.gov/a'), externalUrl('medlineplus.gov/a'), externalUrl('mailto:a@b.org'), externalUrl('tel:5519962000'), externalUrl('intranet.hmh.org:8443/x')];
    out.src = [safeSrc('x" onerror="1'), safeSrc('javascript:1'), safeSrc('data:text/html,x'), !!safeSrc('https://firebasestorage.googleapis.com/a.jpg'), !!safeSrc('data:image/jpeg;base64,AAAA'), !!safeSrc('data:application/pdf;base64,AAAA'), !!safeSrc('blob:https://interp.test/1')];
    out.color = [safeColor('#1A2b3C'), safeColor('#000"><img>'), safeColor('red'), safeColor(undefined)];
    out.size = [sizeAttr(640), sizeAttr('480'), sizeAttr('1" onload="x'), sizeAttr(-3)];
    // jsArg: the handler must receive exactly the text, whatever the text is.
    const texts = ['plain', "O'Brien", 'say "ah"', '&quot;);window.__pwned=(window.__pwned||0)+1;(&quot;', "');window.__pwned=(window.__pwned||0)+1;('", '</button><img src=x onerror="window.__pwned=(window.__pwned||0)+1">', 'a\\b`c${d}', 'línea nueva'];
    window.__got = []; window.__take = v => window.__got.push(v);
    const host = document.createElement('div'); document.body.appendChild(host);
    host.innerHTML = texts.map(t => `<button onclick="__take(${jsArg(t)})">x</button>`).join('');
    host.querySelectorAll('button').forEach(x => x.click());
    out.round = texts.every((t, i) => window.__got[i] === t) && host.children.length === texts.length;
    host.remove();
    return out;
  });
  if (!unit) ok(false, 'the helpers exist (safeId, hubRows, jsArg, safeColor, safeSrc, sizeAttr)');
  else {
  ok(unit.ids.slice(0, 3).every(Boolean) && unit.ids.slice(3).every(v => !v), 'safeId: the app\'s own ids pass; a quote, bracket, ampersand, backslash, backtick, empty or non-text id does not', unit.ids);
  ok(unit.urls.slice(0, 4).every(v => v === '') && unit.urls[4] === 'https://medlineplus.gov/a' && unit.urls[5] === 'https://medlineplus.gov/a' && unit.urls[6] === 'mailto:a@b.org' && unit.urls[7] === 'tel:5519962000' && unit.urls[8] === 'https://intranet.hmh.org:8443/x',
    'externalUrl: javascript:, data: and vbscript: addresses come back empty; https, bare, mailto, tel and host:port still work', unit.urls);
  ok(unit.src.slice(0, 3).every(v => v === '') && unit.src.slice(3).every(Boolean), 'safeSrc: https, blob: and the app\'s own picture and PDF data only', unit.src);
  ok(unit.color[0] === '#1A2b3C' && unit.color.slice(1).every(v => v === ''), 'safeColor: #rrggbb only', unit.color);
  ok(unit.size[0] === 640 && unit.size[1] === 480 && unit.size[2] === 0 && unit.size[3] === 0, 'sizeAttr: a whole number of pixels or nothing', unit.size);
  ok(unit.round, 'jsArg: a handler receives the exact text, for 8 awkward texts');
  }

  console.log('== doctored rows, drawn and tapped');
  const cat = await page.evaluate(async () => {
    // Where a payload ran, for the report when one does.
    window.__where = [];
    Object.defineProperty(window, '__pwned', { get(){ return window.__where.length; }, set(){ const t = window.event && window.event.target; window.__where.push(activeCategory + ': ' + String((t && t.parentElement && t.parentElement.outerHTML) || (t && t.outerHTML) || '?').slice(0, 420)); } });
    const hit = 'window.__pwned=(window.__pwned||0)+1';
    const TAG = `"><img src=x onerror="${hit}">`;         // breaks out of an attribute
    const ATTR = `1" onload="${hit}" onerror="${hit}`;     // adds a handler to the same tag
    const JS1 = `');${hit};('`;                            // breaks out of a '...' handler argument
    const JS2 = `&quot;);${hit};(&quot;`;                  // the old JSON.stringify().replace() hole
    const now = Date.now();
    const catId = DATA.categories[0].id;
    const chat = (id, extra) => db.collection('team-chat').doc(id).set(Object.assign({ text: 'Hello', author: 'Liz Lind', timestamp: now - 60000, replyTo: null, attachment: null }, extra || {}));
    await chat('ok1');
    await chat('x' + TAG);                                                        // the document's id itself
    await chat('ok2', { id: 'y' + TAG });                                         // a field called id
    await chat('ok3', { id: JS1 });
    await chat('ok4', { replyTo: { id: JS1, author: 'Liz Lind', text: 'earlier' } });
    await chat('ok5', { text: '', attachments: [{ id: 'a1', mimeType: 'image/jpeg', dataUrl: 'https://interp.test/missing.jpg', width: ATTR, height: ATTR, filename: 'p.jpg' }] });
    await chat('ok6', { text: '', attachments: [{ id: 'a2', mimeType: 'application/pdf', dataUrl: 'javascript:' + hit, filename: 'f.pdf' }] });
    await chat('ok7', { reactions: { [JS2]: ['Liz Lind'], ['👍']: ['Liz Lind'] } });
    await db.collection('activity-log').doc('act1').set({ author: 'Liz', summary: 'added a term', timestamp: now, id: JS1 });
    await db.collection('activity-log').doc('act2').set({ author: 'Liz', summary: 'added a term', timestamp: TAG });
    await db.collection('ce-events').doc('ev1').set({ title: 'Webinar', source: 'CHIA', timestamp: TAG, link: 'javascript:' + hit, id: JS1 });
    await db.collection('announcements').doc('an1').set({ text: 'Hello team', author: 'Liz', createdAt: now, pinned: true, id: JS1 });
    await db.collection('deleted-items').doc('tr1').set({ type: '<img src=x onerror="' + hit + '">', label: 'A term', payload: {}, extra: {}, deletedBy: 'Liz', deletedAt: now, id: JS1 });
    await db.collection('term-attachments').doc('ta1').set({ termId: 'pz1', dataUrl: 'x" onerror="' + hit, filename: 'scan.jpg', mimeType: 'image/jpeg' });
    await db.collection('term-attachments').doc('ta2').set({ termId: 'pz1', dataUrl: 'javascript:' + hit, filename: 'scan.pdf', mimeType: 'application/pdf' });
    await db.collection('terms').doc('pz1').set({ id: 'pz1', categoryId: catId, en: '<img src=x onerror="' + hit + '">', es: 'prueba', def: 'd', url: 'javascript:' + hit });
    await db.collection('terms').doc('pz2').set({ id: 'pz2', categoryId: catId, en: JS2, es: JS2, def: 'd', url: 'https://example.org/' });
    await db.collection('terms').doc('pz' + TAG).set({ categoryId: catId, en: 'bad id', es: 'mal id', def: 'd' });
    const meta = (await db.collection('terminology-meta').doc('categories').get()).data().categories.map(c => ({ ...c }));
    meta[0].color = '#000' + TAG;
    meta.push({ id: 'evil' + TAG, name: 'Evil', color: '#112233', icon: 'heart', parentId: null });
    meta.push({ id: JS1, name: 'Evil two', color: '#112233', icon: 'heart', parentId: null });
    await db.collection('terminology-meta').doc('categories').set({ categories: meta, updatedAt: now });
    await loadTrash(); await loadAttachments();
    return catId;
  });
  await page.waitForTimeout(1500);
  const tapAll = sel => page.evaluate(s => { document.querySelectorAll(s).forEach(el => { try { el.click(); } catch (e) {} }); }, sel);
  for (const screen of ['home', 'all', cat, 'chat', 'updates', 'events', 'trash', 'directory']) {
    await L.go(page, screen, 1100);
    if (screen === cat) { await tapAll('.copy-btn, .say-pill, .attach-chip'); await page.keyboard.press('Escape'); }
    if (screen === 'chat') await tapAll('.chat-quote, .chat-reaction');
    await page.waitForTimeout(500);
  }
  const res = await page.evaluate(() => ({
    pwned: window.__pwned || 0, where: window.__where,
    chat: CHAT_MESSAGES.map(m => m.id),
    cats: DATA.categories.map(c => c.id).filter(id => /evil|window/.test(id)),
    color0: DATA.categories[0].color,
    badTerm: [...TERMS_BY_ID.keys()].filter(k => /onerror/.test(k)).length,
    // javascript: must not sit in any link on the page
    jsLinks: [...document.querySelectorAll('a[href]')].filter(a => /^\s*javascript:/i.test(a.getAttribute('href'))).length
  }));
  ok(res.pwned === 0, 'none of the doctored values ran (chat, updates, events, trash, attachments, terms, domains, Link Directory)', res.where);
  ok(res.chat.every(id => /^(ok|c)\d+$/.test(id)) && res.chat.filter(id => /^ok\d$/.test(id)).length === 7, 'chat rows keep their document\'s id; the row whose id is doctored is left out', res.chat);
  ok(res.cats.length === 0 && res.color0 === undefined && res.badTerm === 0, 'a domain or term with a doctored id is dropped; a doctored colour is left off', res);
  ok(res.jsLinks === 0, 'no javascript: address in any link');
  ok(page.__errors.length === 0, 'no page errors', page.__errors.slice(0, 3));
  await b.close();
})();
