/* Step 2 of BRIEF.md: the real app's screens, cut into layers for the reel.

   Boots this checkout with the tests' stand-ins (tests/support/harness.cjs:
   Firebase in memory, the AI endpoints answered), at 390x844 and 3x, and
   recreates the nine states v11 shows. For each state it saves:
     full.png   the screen as a phone shows it
     bg.png     the same screen with every layer below removed
     <key>.png  one region alone, on a transparent background (a layer
                inside another, like the drill's verdict in its sheet, is
                cut out of the outer one)
     (each also as .webp, which is what git keeps and the reel loads)
     layers.json  each layer's box in CSS px (x 3 for the PNG), its depth
                order and which one is the "proof" item the caption points at
   and finally sheet.jpg, every state and its layers, labelled.

   Run from the repo root:  node promo/hub-blend/tools/capture-layers.cjs [only]
   Reduced motion is on, so every layer is caught at rest. */
const path = require('path');
const fs = require('fs');
const L = require('../../../tests/support/harness.cjs');

const OUT = path.resolve(__dirname, '..', 'assets', 'layers');
const W = 390, H = 844, DPR = 3;
const ONLY = process.argv[2];

// Dr. Smiley's answer to "I'm covering oncology. Prep me.", in the shape
// api/ask.js returns (the real handler runs; only the model is stood in).
function fakeModel(user) {
  const ctx = JSON.parse((user.match(/CONTEXT:\n(.*)\n\n/) || [])[1] || '{}');
  const spec = (ctx.specialties || []).find(s => /oncology/i.test(s.name)) || { id: 'onc', name: 'Oncology' };
  return { fromHub: true, headline: `Tu repaso de ${spec.name} está listo.`, sayLabel: '', say: '',
    details: 'Tiene las palabras que aún aprendes. También las trampas comunes: constipado, intoxicado, embarazada. Y el reloj de la cita.',
    sourceIds: [], lessonIds: [], actions: [{ type: 'open_prep', target: spec.id }], suggestTerm: { en: '', es: '', def: '' } };
}
let askMod;
async function askServe(body, headers) {
  askMod = askMod || await import(require('url').pathToFileURL(L.ROOT + 'api/ask.js').href);
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('firestore.googleapis.com')) return new Response(JSON.stringify({ fields: { practice: { booleanValue: true } } }), { status: 200 });
    if (String(url).includes('api.anthropic.com')) { const r = JSON.parse(init.body); return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(fakeModel(r.messages[0].content)) }], stop_reason: 'end_turn' }), { status: 200 }); }
    return real(url, init);
  };
  let status = 200, json = null;
  const res = { status(c) { status = c; return res; }, json(j) { json = j; return res; }, setHeader() {} };
  try { await askMod.default({ method: 'POST', headers, body }, res); } finally { globalThis.fetch = real; }
  return { status, json };
}

const ELENA = { name: 'Dr. Elena Marin', specialty: 'Hematology/Oncology', hospitalLocation: 'John Theurer Cancer Center',
  locationDetails: '4th fl · Suite 401', notes: 'Explains staging with a drawing.', source: 'manual', updatedBy: 'Jose', customTerms: [],
  researchResult: { found: true, specialty: 'Hematology/Oncology', note: '', tiers: [
    { key: 'core', label: 'Core terms', terms: [
      { en: 'staging', es: 'estadificación', def: 'How far the cancer has spread, stages I to IV.' },
      { en: 'remission', es: 'remisión', def: 'Signs of cancer have gone down or gone.' },
      { en: 'white blood cell count', es: 'conteo de glóbulos blancos', def: 'Cells that fight infection.' }] },
    { key: 'procedures', label: 'Procedures & tests', terms: [
      { en: 'bone marrow biopsy', es: 'biopsia de médula ósea', def: 'A sample of marrow from the hip bone.' },
      { en: 'port placement', es: 'colocación del puerto', def: 'A small device under the skin for infusions.' }] },
    { key: 'drugs', label: 'Drugs', terms: [
      { en: 'chemotherapy', es: 'quimioterapia', def: 'Medicine that kills cancer cells.' },
      { en: 'anticoagulant', es: 'anticoagulante', def: 'Blood thinner.' }] },
    { key: 'anatomy', label: 'Anatomy', terms: [
      { en: 'lymph node', es: 'ganglio linfático', def: 'Small glands that filter lymph.' }] },
    { key: 'falsefriends', label: 'False friends', terms: [
      { en: 'constipated', es: 'estreñido', def: 'Not "constipado", which means a cold.' }] }] } };

/* A region: css selector, optionally the one whose text includes `text`,
   `nth` among matches, `all` (up to n matches, keys key1..keyN), or
   `point` (the element there, widened while its parent stays under maxH). */
/* The 3D Body is a separate viewer (atlas/) in a sandboxed frame: serve its
   files, open it, and for "heart" search the heart, isolate it and keep its
   card (Heart / Corazón), which becomes the proof layer. */
const ATLAS_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
async function openAtlas(page, heart) {
  await page.context().route('**/atlas/**', r => {
    const f = path.join(L.ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, contentType: ATLAS_TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await page.evaluate(() => setCategory('anatomy'));
  await page.waitForTimeout(20000);
  if (!heart) return;
  const fr = page.frameLocator('#anatLayer iframe');
  const tap = async (loc) => { const bb = await loc.boundingBox(); if (bb) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); };
  await page.mouse.click(358, 83); await page.waitForTimeout(800);
  await fr.locator('input[type=search], input[type=text], input:not([type])').first().fill('heart'); await page.waitForTimeout(1200);
  await tap(fr.getByText('83 pieces').first()); await page.waitForTimeout(5000);
  await tap(fr.getByText('Isolate').first()); await page.waitForTimeout(6000);
  // the card: the smallest box holding both names and its buttons
  const frame = page.frames().find(f => /atlas/.test(f.url()));
  const box = await frame.evaluate(() => {
    // from the "Heart" title up to the first box that also holds the card's buttons
    let e = [...document.querySelectorAll('*')].find(x => x.children.length === 0 && x.textContent.trim() === 'Heart');
    while (e && !e.textContent.includes('Show all')) e = e.parentElement;
    e.setAttribute('data-layer-frame', 'proof');
    const r = e.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, radius: parseFloat(getComputedStyle(e).borderTopLeftRadius) || 24 };
  });
  const off = await page.locator('#anatLayer iframe').boundingBox();
  page.__rects = [{ key: 'proof', proof: true, x: box.x + off.x, y: box.y + off.y, w: box.w, h: box.h, radius: box.radius }];
}

const STATES = [
  { name: 'body', caption: 'Explore The 3D Body.', prep: async p => openAtlas(p, false), regions: [['topbar', '.topbar-global']] },
  { name: 'heart', caption: 'Names In English And Spanish.', prep: async p => openAtlas(p, true), regions: [['topbar', '.topbar-global']] },
  { name: 'home', caption: 'Built by our own interpreters.', prep: async () => {},
    regions: [['banner', '.home-greeting'], ['search', 'button.home-search'], ['tiles', '.qa-grid', { proof: 1 }],
      ['drill', '#warmup'], ['tabbar', 'nav.tabbar']] },
  { name: 'glossary', caption: 'One glossary. Every specialty.', prep: async p => { await L.go(p, 'er', 1400); },
    regions: [['topbar', '.topbar-global'], ['head', '*', { point: [195, 105], maxH: 220 }], ['proof', '.card[data-term-id="x80_2"]', { proof: 1 }],
      ['row', '#content .card[data-term-id]:not([data-term-id="x80_2"])', { all: 4 }], ['tabbar', 'nav.tabbar']] },
  { name: 'translate', caption: 'Glossary first. AI second.', prep: async p => {
      await L.go(p, 'translate', 900);
      await p.fill('#trInput', 'heart failure'); await p.click('button.tr-go');
      await p.waitForSelector('.tr-result.ai', { timeout: 15000 }); await p.waitForTimeout(700);
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
    },
    regions: [['topbar', '.topbar-global'], ['input', '#trInput', { up: 'form, .tr-box, .tr-input-wrap, .tr-search' }],
      ['proof', '.tr-result.ai', { proof: 1 }], ['result', '#trResults .tr-result:not(.ai)', { all: 2 }], ['tabbar', 'nav.tabbar']] },
  { name: 'physician', caption: 'Ready for every physician.', prep: async p => {
      await L.go(p, 'doctor-directory', 900);
      await p.evaluate(d => { window.__DB['doctor-directory'] = window.__DB['doctor-directory'] || {}; window.__DB['doctor-directory'].elena = d;
        DOCTOR_DIRECTORY.push(Object.assign({ id: 'elena' }, d)); openDoctorDirDetail('elena'); }, ELENA);
      await p.waitForSelector('#doctorDirDetailOverlay.show'); await p.waitForTimeout(900);
    },
    regions: [['hero', '.dp-hero'], ['bento', '.dp-bento', { proof: 1 }], ['tabs', '.dp-tabs'], ['row', '.dp-row', { all: 3 }], ['bar', '.dp-bar']] },
  { name: 'falsefriends', caption: '101 false friends. Flagged.', prep: async p => { await L.go(p, 'falsefriends', 1200);
      await p.evaluate(() => { const c = [...document.querySelectorAll('.ff-card')].find(c => c.querySelector('.ff-es').textContent === 'constipado'); window.scrollBy(0, c.getBoundingClientRect().top - 300); }); await p.waitForTimeout(400);
      await p.mouse.wheel(0, -40); await p.waitForTimeout(700); },
    regions: [['topbar', '.topbar-global'], ['search', '#ffSearch', { up: '.ff-search, .search-wrap, label' }],
      ['proof', '.ff-card', { text: 'constipado', proof: 1 }], ['card', '.ff-card', { all: 2, skipText: 'constipado' }], ['tabbar', 'nav.tabbar']] },
  { name: 'drills', caption: 'Daily drills. Sharp skills.', prep: async p => {
      await p.waitForSelector('#warmup', { timeout: 20000 }); await p.waitForTimeout(800);
      await p.evaluate(() => { const st = drillToday(); st.drill.rounds[0] = { k: 'trap', es: 'ingreso' }; drillSave(st); DD.st = null; });
      await p.evaluate(() => document.getElementById('warmup').scrollIntoView({ block: 'center' }));
      await p.click('#warmup'); await p.waitForSelector('#warmupSheet.show .sm-sheet'); await p.waitForTimeout(700);
      await p.fill('#ddAnswer', 'It was an emergency admission.');
      await p.getByRole('button', { name: 'Check' }).click(); await p.waitForTimeout(700);
      const same = p.getByRole('button', { name: /Same meaning/ }); if (await same.count()) { await same.first().click(); await p.waitForTimeout(700); }
    },
    regions: [['sheet', '#warmupSheet .sm-sheet'], ['title', '#smWarmTitle'], ['heard', '#warmupSheet *', { text: 'Fue un ingreso', up: '.dd-heard, .dd-line, div' }], ['proof', '#warmupSheet *', { text: ['Counted', 'You said'], proof: 1 }]] },
  { name: 'cert', caption: 'National certification. Prep built in.', prep: async p => { await L.go(p, 'practice', 1600); },
    regions: [['topbar', '.topbar-global'], ['proof', '#content .section-head', { proof: 1 }], ['card', '.cp-card'], ['hud', '.cp-hud'],
      ['world', '.cp-world'], ['foot', '.cp-foot'], ['tabbar', 'nav.tabbar']] },
  { name: 'team', caption: 'One team. One channel.', prep: async p => {
      await L.go(p, 'chat', 600);
      await p.evaluate(async () => {
        for (const k of Object.keys(window.__DB['team-chat'] || {})) delete window.__DB['team-chat'][k];  // only our three
        const now = Date.now(), put = (id, o) => db.collection('team-chat').doc(id).set(Object.assign({ replyTo: null, attachment: null }, o));
        await put('m1', { text: 'Lavado del port. Added it to the glossary.', author: 'Maria Ruiz', timestamp: now - 9 * 60000 });
        await put('m2', { text: 'ED is busy, two Spanish requests waiting. Who is free?', author: 'Liz Lind', timestamp: now - 4 * 60000 });
        await put('m3', { text: 'On my way.', author: 'Jose', timestamp: now - 2 * 60000,
          replyTo: { id: 'm2', author: 'Liz Lind', text: 'ED is busy, two Spanish requests waiting. Who is free?' } });
      });
      await L.go(p, 'chat', 1500);
      await p.evaluate(() => { const m = document.getElementById('chatMessages'); if (m) m.scrollTop = m.scrollHeight; }); await p.waitForTimeout(500);
    },
    regions: [['topbar', '*', { point: [200, 22], maxH: 90 }], ['channels', '#tcChannels'], ['proof', '.chat-bubble-row', { text: 'Lavado del port', proof: 1 }],
      ['msg', '.chat-bubble-row', { all: 3, skipText: 'Lavado del port' }], ['input', '#chatInput', { up: '.chat-input-row, .chat-compose, form' }], ['tabbar', 'nav.tabbar']] },
  { name: 'ask', caption: 'Stuck? Ask Dr. Smiley.', prep: async p => {
      await p.route('**/api/ask', async r => {
        const o = await askServe(JSON.parse(r.request().postData() || '{}'), r.request().headers());
        try { await r.fulfill({ status: o.status, contentType: 'application/json', body: JSON.stringify(o.json) }); } catch (e) {}
      });
      await p.evaluate(() => openAskHub()); await p.waitForTimeout(900);
      await p.evaluate(q => { const i = document.getElementById('askInput'); i.value = q; ASK.draft = q; submitAsk(q); }, "I'm covering oncology. Prep me.");
      await p.waitForSelector('.ask-card .ask-do-btn', { timeout: 15000 }); await p.waitForTimeout(900);
    },
    regions: [['topbar', '.topbar-global'], ['proof', '.ask-card', { nth: -1, proof: 1 }],
      ['input', '#askInput', { up: '.ask-compose, .ask-input-row, form' }], ['tabbar', 'nav.tabbar']] },
];

async function markRegions(page, regions) {
  return page.evaluate(regions => {
    document.querySelectorAll('[data-layer]').forEach(e => e.removeAttribute('data-layer'));
    const inView = r => r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    const found = [], missing = [];
    for (const [key, sel, o = {}] of regions) {
      let els = o.point ? (() => { let e = document.elementFromPoint(o.point[0], o.point[1]);
        while (e && e.parentElement && e.parentElement.getBoundingClientRect().height <= o.maxH) e = e.parentElement; return e ? [e] : []; })()
        : [...document.querySelectorAll(sel)].filter(e => inView(e.getBoundingClientRect()) && e.checkVisibility({ checkOpacity: true }));
      if (o.up) els = els.map(e => e.closest(o.up) || e.parentElement || e);
      if (o.text) els = els.filter(e => [].concat(o.text).every(t => e.textContent.includes(t)));
      if (o.skipText) els = els.filter(e => !e.textContent.includes(o.skipText));
      els = els.filter(e => !e.hasAttribute('data-layer'));
      // a text match picks the smallest element holding it
      if (o.text) els.sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height);
      const pick = o.all ? els.slice(0, o.all) : els.length ? [o.nth === -1 ? els[els.length - 1] : els[o.nth || 0]] : [];
      if (!pick.length) { missing.push(key); continue; }
      pick.forEach((e, i) => {
        const k = o.all ? key + (i + 1) : key;
        e.setAttribute('data-layer', k);
        const r = e.getBoundingClientRect();
        found.push({ key: k, proof: !!o.proof, x: Math.max(0, r.left), y: Math.max(0, r.top),
          w: Math.min(innerWidth, r.right) - Math.max(0, r.left), h: Math.min(innerHeight, r.bottom) - Math.max(0, r.top) });
      });
    }
    return { found, missing };
  }, regions);
}

const STYLE_ID = '__layerStyle';
const setStyle = (page, css) => page.evaluate(([id, css]) => {
  let s = document.getElementById(id); if (!s) { s = document.createElement('style'); s.id = id; document.head.appendChild(s); }
  s.textContent = css;
}, [STYLE_ID, css]);

async function capture(page, st) {
  const dir = path.join(OUT, st.name); fs.mkdirSync(dir, { recursive: true });
  const { found, missing } = await markRegions(page, st.regions);
  await setStyle(page, '');
  // regions inside the 3D Body's frame, found by the state's prep (page.__rects); cut from the screen like the tab bar
  for (const r of page.__rects || []) found.push({ ...r, crop: true });
  const frameHide = (on) => Promise.all(page.frames().map(f => f.evaluate(on => document.querySelectorAll('[data-layer-frame]').forEach(e => { e.style.visibility = on ? 'hidden' : ''; }), on).catch(() => {})));
  await page.screenshot({ path: path.join(dir, 'full.png') });
  await setStyle(page, '[data-layer]{visibility:hidden!important}');
  await frameHide(true);
  await page.screenshot({ path: path.join(dir, 'bg.png') });
  await frameHide(false);
  await setStyle(page, '');
  for (const l of found.filter(l => l.key === 'tabbar' || l.crop)) {
    const pad = 12, x = Math.max(0, l.x - pad), y = Math.max(0, l.y - pad);
    const clip = { x, y, width: Math.min(W, l.x + l.w + pad) - x, height: Math.min(H, l.y + l.h + pad) - y };
    const shot = await page.screenshot({ clip });
    const png = await page.evaluate(async ([b64, l, clip, dpr]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d');
      const rad = l.radius ?? (parseFloat(getComputedStyle(document.querySelector('[data-layer="tabbar"]')).borderTopLeftRadius) || 0);
      g.beginPath(); g.roundRect((l.x - clip.x) * dpr, (l.y - clip.y) * dpr, l.w * dpr, l.h * dpr, rad * dpr); g.clip(); g.drawImage(img, 0, 0);
      return c.toDataURL('image/png').split(',')[1];
    }, [shot.toString('base64'), l, clip, DPR]);
    fs.writeFileSync(path.join(dir, l.key + '.png'), Buffer.from(png, 'base64'));
    Object.assign(l, { file: l.key + '.png', clip, note: 'cut from the screen, corners masked' });
  }
  for (const l of found.filter(l => l.key !== 'tabbar' && !l.crop)) {
    await setStyle(page, `html,body{background:transparent!important}
      body *{visibility:hidden!important}
      [data-layer="${l.key}"],[data-layer="${l.key}"] *{visibility:visible!important}
      [data-layer="${l.key}"] [data-layer],[data-layer="${l.key}"] [data-layer] *{visibility:hidden!important}`);
    const pad = 12, x = Math.max(0, l.x - pad), y = Math.max(0, l.y - pad);
    const clip = { x, y, width: Math.min(W, l.x + l.w + pad) - x, height: Math.min(H, l.y + l.h + pad) - y };
    await page.screenshot({ path: path.join(dir, l.key + '.png'), clip, omitBackground: true });
    Object.assign(l, { file: l.key + '.png', clip });
  }
  await setStyle(page, '');
  // git keeps WebP copies (a tenth the size, alpha kept); the PNGs stay local
  for (const f of ['full.png', 'bg.png', ...found.map(l => l.file)]) {
    const webp = await page.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.92).split(',')[1];
    }, fs.readFileSync(path.join(dir, f)).toString('base64'));
    fs.writeFileSync(path.join(dir, f.replace(/\.png$/, '.webp')), Buffer.from(webp, 'base64'));
  }
  // depth order: proof nearest the camera, bars next, cards, then the rest
  const rank = l => l.proof ? 3 : /tabbar|topbar|bar$|input|channels/.test(l.key) ? 2 : /row|card|msg|tile|result/.test(l.key) ? 1 : 0;
  found.forEach(l => { l.depth = rank(l); });
  fs.writeFileSync(path.join(dir, 'layers.json'), JSON.stringify({ state: st.name, caption: st.caption,
    viewport: { w: W, h: H, dpr: DPR }, full: 'full.webp', bg: 'bg.webp',
    layers: found.map(l => Object.assign({}, l, { file: l.file.replace(/\.png$/, '.webp') })), missing }, null, 2));
  return { found, missing };
}

async function sheet(browser, report) {
  const cells = report.map(r => {
    const d = `file://${OUT}/${r.name}/`;
    const layers = r.found.map(l => `<figure${l.proof ? ' class=p' : ''}><div class=ck><img src="${d}${l.file}"></div><figcaption>${l.key}${l.proof ? ' · proof' : ''} · ${Math.round(l.w)}×${Math.round(l.h)}</figcaption></figure>`).join('');
    return `<section><h2>${r.name}<small>${r.caption}</small></h2><div class=row><figure><img class=full src="${d}full.png"><figcaption>full</figcaption></figure>
      <figure><img class=full src="${d}bg.png"><figcaption>bg (layers removed)</figcaption></figure><div class=ls>${layers}</div></div>
      ${r.missing.length ? `<p class=miss>not found: ${r.missing.join(', ')}</p>` : ''}</section>`;
  }).join('');
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;padding:24px;background:#0b1640;color:#fff;font:14px Inter,system-ui,sans-serif;width:1500px}
    section{margin-bottom:28px} h2{margin:0 0 10px;font-size:22px} h2 small{margin-left:12px;font-weight:400;color:#3fc6ee}
    .row{display:flex;gap:14px;align-items:flex-start} .full{width:195px;border-radius:14px;display:block}
    figure{margin:0} figcaption{font-size:12px;color:#c9d6f5;margin-top:4px}
    .ls{display:flex;flex-wrap:wrap;gap:10px;align-content:flex-start;flex:1}
    .ck{background:repeating-conic-gradient(#d9dee8 0 25%,#fff 0 50%) 0 0/16px 16px;border-radius:8px;padding:4px}
    .ck img{display:block;max-width:260px;max-height:200px} .p .ck{outline:3px solid #3fc6ee} .p figcaption{color:#3fc6ee;font-weight:600}
    .miss{color:#f0436a}</style>${cells}`;
  const f = path.join(OUT, 'sheet.html'); fs.writeFileSync(f, html);
  const ctx = await browser.newContext({ viewport: { width: 1548, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); await p.goto('file://' + f); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(OUT, 'sheet.jpg'), fullPage: true, type: 'jpeg', quality: 85 });
  await ctx.close(); fs.unlinkSync(f);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await L.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); // WebGL for the 3D Body
  const report = [];
  for (const st of STATES) {
    if (ONLY && st.name !== ONLY) continue;
    const { ctx, page } = await L.boot(browser, { device: 'pwa', reducedMotion: true, settle: 3500,
      init: `localStorage.setItem('ih_promoSeen','1');localStorage.setItem('ih_region','north');localStorage.setItem('ih_warmup',JSON.stringify({lvl:0}));` });
    await page.setViewportSize({ width: W, height: H });
    try { await st.prep(page); } catch (e) { console.log(`  ${st.name}: prep failed: ${e.message.split('\n')[0]}`); }
    const r = await capture(page, st);
    console.log(`${st.name}: ${r.found.map(l => l.key + (l.proof ? '*' : '')).join(' ')}${r.missing.length ? '  MISSING ' + r.missing.join(',') : ''}${page.__errors.length ? '  ERR ' + page.__errors[0] : ''}`);
    report.push({ name: st.name, caption: st.caption, ...r });
    await ctx.close();
  }
  if (!ONLY) await sheet(browser, report);
  await browser.close();
})();
