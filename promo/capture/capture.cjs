/* Real app screens for the promo, at phone size, with made-up data only.
   Uses the test harness (tests/support): Firebase and the AI endpoints are
   stood in, nothing touches the live database. The extra records here
   (the Heart failure term, Dr. Elena Marin, Dr. Smiley's answer) exist
   only inside this capture.

     node promo/capture/capture.cjs            every screen
     node promo/capture/capture.cjs ask brain  just those

   Writes promo/public/screens/<name>.png (390x844 at 3x). */
const fs = require('fs');
const path = require('path');
const L = require('../../tests/support/harness.cjs');

const OUT = path.join(__dirname, '..', 'public', 'screens');
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { html: 'text/html', js: 'text/javascript', json: 'application/json', css: 'text/css', gz: 'application/gzip',
  bin: 'application/octet-stream', webp: 'image/webp', png: 'image/png', svg: 'image/svg+xml', glb: 'model/gltf-binary' };

// Made-up records (Jose, 2026-10-21: Dr. Elena Marin is not a real person).
const HEART_FAILURE = { id: 'promo-hf', en: 'Heart failure', es: 'Insuficiencia cardíaca',
  def: 'The heart cannot pump enough blood for the body’s needs. It does not mean the heart has stopped.', source: 'NCI' };
const T = (en, es, def) => ({ en, es, def });
const MARIN = { id: 'promo-marin', name: 'Dr. Elena Marin', specialty: 'Hematology/Oncology',
  hospitalLocation: 'John Theurer Cancer Center', locationDetails: '4th fl', notes: 'Likes the family to sit on her left.',
  updatedBy: 'Maria', source: 'research', customTerms: [{ id: 'm1', en: 'port flush', es: 'lavado del port', def: 'Keeps the port open.', addedBy: 'Luis' }],
  researchResult: { found: true, specialty: 'Hematology/Oncology', note: '', tiers: [
    { key: 'core', terms: [T('staging', 'estadificación', 'How far the cancer has spread, stages I to IV.'), T('remission', 'remisión', 'No signs of disease; not the same as cured.')] },
    { key: 'procedures', terms: [T('bone marrow biopsy', 'biopsia de médula ósea', 'Sample taken from the hip bone.'), T('PET scan', 'tomografía PET', 'Imaging that shows active cancer.')] },
    { key: 'drugs', terms: [T('rituximab', 'rituximab', 'Antibody given by infusion.')] },
    { key: 'falsefriends', terms: [T('constipated', 'estreñido', 'Not "constipado", which means a cold.')] } ] } };
const ANSWER = { fromHub: true, headline: 'Heart failure is “insuficiencia cardíaca”.', sayLabel: 'Say', say: 'insuficiencia cardíaca',
  details: 'The heart can’t pump enough blood. It hasn’t stopped, so avoid “paro”. “Fallo cardíaco” is understood, but it isn’t the standard term.',
  sourceIds: ['promo-hf'], lessonIds: [], actions: [], suggestTerm: { en: '', es: '', def: '' } };

async function askHandler(body, headers) {
  const mod = await import(require('url').pathToFileURL(L.ROOT + 'api/ask.js').href);
  process.env.ANTHROPIC_API_KEY = 'test-key';
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('firestore.googleapis.com')) return new Response(JSON.stringify({ fields: { practice: { booleanValue: true } } }), { status: 200 });
    if (String(url).includes('api.anthropic.com')) return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(ANSWER) }], stop_reason: 'end_turn' }), { status: 200 });
    return real(url, init);
  };
  let status = 200, json = null;
  const res = { status(c) { status = c; return res; }, json(j) { json = j; return res; }, setHeader() {} };
  try { await mod.default({ method: 'POST', headers, body }, res); } finally { globalThis.fetch = real; }
  return { status, json };
}

function serveDir(page, glob) {
  return page.route(glob, r => {
    const f = L.ROOT + decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//, '');
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, contentType: TYPES[f.split('.').pop()] || 'application/octet-stream', body: fs.readFileSync(f),
      headers: { 'Access-Control-Allow-Origin': '*' } });
  });
}

const wait = (p, ms) => p.waitForTimeout(ms);
const SHOTS = {
  async home(p) { await p.evaluate(() => setCategory('home')); await wait(p, 6500); },
  async domains(p) { await L.go(p, 'all', 1500); },
  async search(p) {
    await L.go(p, 'cardiac', 800);
    await p.fill('#searchInput', 'heart failure'); await wait(p, 1500);
  },
  async doctor(p) {
    await p.evaluate(d => { const { id, ...rest } = d;
      if (window.__DB) window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(rest));
      if (!DOCTOR_DIRECTORY.some(x => x.id === id)) DOCTOR_DIRECTORY.push(JSON.parse(JSON.stringify(d)));
      openDoctorDirDetail(id); }, MARIN);
    await wait(p, 1500);
  },
  async falsefriends(p) {
    await L.go(p, 'falsefriends', 1200);
    await p.evaluate(() => { const el = [...document.querySelectorAll('#content *')].find(e => e.children.length === 0 && /^constipado$/i.test(e.textContent.trim()));
      if (el) { const r = el.getBoundingClientRect(); window.scrollBy(0, r.top - 180); } });
    await wait(p, 900);
  },
  async drill(p) { await p.evaluate(() => { setCategory('home'); }); await wait(p, 1500); await p.evaluate(() => openWarmupSheet()); await wait(p, 1500); },
  async review(p) { await L.go(p, 'review', 1800); },
  async memory(p) { await p.evaluate(() => openMemoryTrainer()); await wait(p, 1800); },
  async practice(p) { await L.go(p, 'practice', 4000); },
  async chat(p) { await L.go(p, 'chat', 2000); },
  async ask(p) {
    await p.evaluate(() => openAskHub()); await wait(p, 1200);
    await p.evaluate(() => { const i = document.querySelector('#askInput'); i.value = 'How do I say heart failure?'; ASK.draft = i.value; submitAsk(); });
    await wait(p, 4500);
  },
  async brain(p) {
    // A made-up review record so the brain has something lit: every third term
    // known, some learning, the rest not practised.
    await p.evaluate(async () => {
      const now = Date.now();
      allTermsFlat().forEach((t, i) => { if (i % 5 > 2) return;
        window.__DB['term-reviews']['jose__' + t.id] = { who: 'jose', termId: t.id, box: i % 5 === 0 ? 1 : 4, nextReviewAt: now + 864e5, reviewCount: 3 }; });
      await loadTermReviews();
    });
    await p.evaluate(() => openHumcBrain('you')); await wait(p, 7000);
  },
  async anatomy(p) { await L.go(p, 'anatomy', 12000); },
};

(async () => {
  const want = process.argv.slice(2);
  const names = want.length ? want : Object.keys(SHOTS);
  const b = await L.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const name of names) {
    const { ctx, page } = await L.boot(b, { device: 'iphone', name: 'Jose', settle: 3500,
      init: `(${(hf) => { const c = (window.__SEED_CATS || []).find(x => x.id === 'cardiac');
        try { localStorage.setItem('ih_region', 'north'); } catch (e) {}
        if (c && !c.terms.some(t => t.id === hf.id)) c.terms.unshift(hf); }})(${JSON.stringify(HEART_FAILURE)})` });
    await page.setViewportSize({ width: 390, height: 844 });
    await serveDir(page, '**/brain/**'); await serveDir(page, '**/atlas/**'); await serveDir(page, '**/memory/**');
    // The stub chat's photos that aren't in the repo get the campus photo.
    await page.route(/\/(portrait|landscape|square|tall)\.jpg$/, r => r.fulfill({ status: 200, contentType: 'image/jpeg', body: fs.readFileSync(L.ROOT + 'hero.jpg') }));
    await page.route('**/api/ask', async r => {
      const o = await askHandler(JSON.parse(r.request().postData() || '{}'), r.request().headers());
      r.fulfill({ status: o.status, contentType: 'application/json', body: JSON.stringify(o.json) });
    });
    try {
      await SHOTS[name](page);
      await page.screenshot({ path: path.join(OUT, name + '.png') });
      console.log('ok   ' + name + (page.__errors.length ? '  (page errors: ' + page.__errors.slice(0, 2).join(' | ') + ')' : ''));
    } catch (e) { console.log('FAIL ' + name + ': ' + e.message.split('\n')[0]); }
    await ctx.close();
  }
  await b.close();
})();
