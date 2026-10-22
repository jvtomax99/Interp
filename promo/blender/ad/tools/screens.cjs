// Real screens of the app for the ad's feature montage: the test harness
// opens this checkout's app with stand-in data (no live Hub) at iPhone size
// and photographs each feature -> build/screens/<name>.png (1179 x 2277).
//   node tools/screens.cjs [name ...]
const path = require('path'), fs = require('fs');
const H = require('../../../../tests/support/harness.cjs');
const OUT = path.resolve(__dirname, '../build/screens');
// Ask the Hub: the app's real api/ask.js runs (as in tests/suites/journey.cjs);
// only the model's reply is fixed, to an answer that is correct.
const ASK_REPLY = { fromHub: false, headline: 'Watch "constipado".', sayLabel: 'Say', say: 'estreñido',
  details: 'It means congested, not constipated. For constipated, say "estreñido".',
  sourceIds: [], lessonIds: [], actions: [], suggestTerm: { en: '', es: '', def: '' } };
// The doctor databases: made-up sample doctors (never real people's names;
// the ad labels these screens "sample data"). Their terms are the app's
// own test content, which is correct.
const T = (en, es, def) => ({ en, es, def });
const SAMPLE_DOCTORS = [
  { id: 's1', name: 'Dr. Samuel Okafor', specialty: 'Hematology/Oncology', hospitalLocation: 'John Theurer Cancer Center', locationDetails: '4th fl', region: 'north',
    notes: 'Likes the family in the room for big news.', updatedBy: 'Maria', source: 'research', customTerms: [],
    researchResult: { found: true, specialty: 'Hematology/Oncology', note: '', tiers: [
      { key: 'core', terms: [T('staging', 'estadificación', 'How far the lymphoma has spread, stages I to IV.'), T('remission', 'remisión', 'No signs of disease; not the same as cured.')] },
      { key: 'procedures', terms: [T('bone marrow biopsy', 'biopsia de médula ósea', 'Sample taken from the hip bone.'), T('PET scan', 'tomografía PET', 'Imaging that shows active cancer.')] },
      { key: 'drugs', terms: [T('rituximab', 'rituximab', 'Antibody given by infusion.')] },
      { key: 'anatomy', terms: [T('lymph node', 'ganglio linfático', 'Small gland of the immune system.')] },
      { key: 'falsefriends', terms: [T('constipated', 'estreñido', 'Not "constipado", which means a cold.')] } ] } },
  { id: 's2', name: 'Dr. Elena Marquez', specialty: 'Cardiology', hospitalLocation: 'Heart & Vascular Hospital', locationDetails: '', region: 'north', notes: '', customTerms: [] },
  { id: 's3', name: 'Dr. Priya Raman', specialty: 'Pulmonology', hospitalLocation: 'Hackensack', locationDetails: '', region: 'north', notes: '', customTerms: [] },
  { id: 's4', name: 'Dr. Daniel Cho', specialty: 'Gastroenterology', hospitalLocation: 'Hackensack', locationDetails: '', region: 'north', notes: '', customTerms: [] },
  { id: 's5', name: 'Dr. Rosa Delgado', specialty: 'Pediatrics', hospitalLocation: "Children's Hospital", locationDetails: '', region: 'north', notes: '', customTerms: [] },
  { id: 's6', name: 'Dr. Hannah Weiss', specialty: 'Neurology', hospitalLocation: 'Hackensack', locationDetails: '', region: 'south', notes: '', customTerms: [] },
  { id: 's7', name: 'Dr. Marcus Bell', specialty: 'Nephrology', hospitalLocation: 'Hackensack', locationDetails: '', region: 'south', notes: '', customTerms: [] },
  { id: 's8', name: 'Dr. Luis Ortega', specialty: 'Orthopedics', hospitalLocation: 'Hackensack', locationDetails: '', region: 'south', notes: '', customTerms: [] },
];
async function sampleDoctors(page) {
  await page.evaluate(ds => {
    if (window.__DB) { window.__DB['doctor-directory'] = {}; ds.forEach(({ id, ...rest }) => { window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(rest)); }); }
    DOCTOR_DIRECTORY.length = 0; ds.forEach(d => DOCTOR_DIRECTORY.push(JSON.parse(JSON.stringify(d))));
  }, SAMPLE_DOCTORS);
}
let askMod;
async function askRoute(page) {
  await page.route('**/api/ask', async r => {
    askMod = askMod || await import(require('url').pathToFileURL(H.ROOT + 'api/ask.js').href);
    process.env.ANTHROPIC_API_KEY = 'stand-in';
    const real = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).includes('firestore.googleapis.com')) return new Response(JSON.stringify({ fields: { practice: { booleanValue: true } } }), { status: 200 });
      if (String(url).includes('api.anthropic.com')) return new Response(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(ASK_REPLY) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }), { status: 200 });
      return real(url, init);
    };
    let status = 200, json = null;
    const res = { status(c) { status = c; return res; }, json(j) { json = j; return res; }, setHeader() {} };
    try { await askMod.default({ method: 'POST', headers: r.request().headers(), body: JSON.parse(r.request().postData() || '{}') }, res); } finally { globalThis.fetch = real; }
    await r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
  });
}
const SHOTS = {
  home:      p => H.go(p, 'home', 1500),
  glossary:  p => H.go(p, 'all', 1500),
  translate: async p => { await H.go(p, 'translate', 1200);
    await p.getByPlaceholder(/word or phrase/i).first().fill('heart failure');   // the stand-in's answer
    await p.getByRole('button', { name: /^Translate$/ }).first().click(); await p.waitForTimeout(2500); },
  translate2: async p => { await SHOTS.translate(p);      // scrolled: the answer and its caution in full
    const r = await p.evaluate(() => {
      const el = [...document.querySelectorAll('body *')].reverse().find(e => /fallo card/i.test(e.textContent) && e.offsetParent);
      if (!el) return 'not found';
      let sc = el.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
      const target = sc || document.scrollingElement;
      const box = el.getBoundingClientRect();
      target.scrollTop += box.top - innerHeight * 0.42;
      return (sc ? sc.id || sc.className : 'page') + ' ' + Math.round(box.top);
    });
    console.log('translate2 scroll:', r); await p.waitForTimeout(900); },
  ask:       async p => { await askRoute(p); await H.go(p, 'ask', 1200);
    await p.evaluate(q => { const i = document.getElementById('askInput'); i.value = q; ASK.draft = q; submitAsk(); }, 'Does "constipado" mean constipated?');
    await p.waitForTimeout(4000); },
  prep:      async p => { await H.go(p, 'doctor-research', 1200);
    await p.getByPlaceholder(/Doctor.s name/i).first().fill('Dr. Andre Goy');
    await p.getByRole('button', { name: /^Research$/ }).first().click(); await p.waitForTimeout(5000); },
  doctors:   p => H.go(p, 'doctor-directory', 1500),
  chat:      p => H.go(p, 'chat', 1500),
  directory: async p => { await sampleDoctors(p); await H.go(p, 'doctor-directory', 1500); },
  doctorpage: async p => { await sampleDoctors(p); await H.go(p, 'doctor-directory', 800); await p.evaluate(() => openDoctorDirDetail('s1')); await p.waitForTimeout(1500); },
  review:    p => H.go(p, 'review', 1500),
  drill:     async p => { await H.go(p, 'home', 1200); await p.evaluate(() => openWarmupSheet()); await p.waitForTimeout(1200); },
  memory:    p => H.go(p, 'memory', 1500),
  falsefriends: p => H.go(p, 'falsefriends', 1200),
  events:    p => H.go(p, 'events', 1200),
  practice:  p => H.go(p, 'practice', 2500),
};
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
  const browser = await H.chromium.launch();
  for (const name of want) {
    const { ctx, page } = await H.boot(browser, { device: 'iphone', init: () => {} });
    // Files the harness doesn't serve: the memory trainer's lines, and the
    // stand-in chat's photos (given the Hub's own banner photo).
    await page.route('**/memory/lines.json', r => r.fulfill({ path: path.join(H.ROOT, 'memory/lines.json'), contentType: 'application/json' }));
    await page.route(/\/(square|landscape|tall)\.jpg$/, r => r.fulfill({ path: path.join(H.ROOT, 'hero.jpg'), contentType: 'image/jpeg' }));
    try { await SHOTS[name](page); await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('shot', name, page.__errors.length ? 'errors: ' + page.__errors.join(' | ').slice(0, 160) : ''); }
    catch (e) { console.log('FAILED', name, e.message.slice(0, 160)); }
    await ctx.close();
  }
  await browser.close();
})();
