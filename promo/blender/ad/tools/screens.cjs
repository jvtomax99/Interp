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
  ask:       async p => { await askRoute(p); await H.go(p, 'ask', 1200);
    await p.evaluate(q => { const i = document.getElementById('askInput'); i.value = q; ASK.draft = q; submitAsk(); }, 'Does "constipado" mean constipated?');
    await p.waitForTimeout(4000); },
  prep:      async p => { await H.go(p, 'doctor-research', 1200);
    await p.getByPlaceholder(/Doctor.s name/i).first().fill('Dr. Andre Goy');
    await p.getByRole('button', { name: /^Research$/ }).first().click(); await p.waitForTimeout(5000); },
  doctors:   p => H.go(p, 'doctor-directory', 1500),
  chat:      p => H.go(p, 'chat', 1500),
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
