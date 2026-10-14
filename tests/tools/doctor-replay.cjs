/* Nothing lost: replays real doctor-directory documents through the doctor
   page and checks every term, tip, photo and place in the data is on screen.
   With OLD set, also renders each document with an older index.html and
   checks every term the old view showed is still shown.

     cd tests
     node tools/doctor-replay.cjs doctors.json
     OLD=/path/to/old-index.html node tools/doctor-replay.cjs doctors.json

   doctors.json: an array of doctor documents with their ids (copy of the
   live app's DOCTOR_DIRECTORY; see docs/features/doctor-page.md). It holds
   the team's data: keep it out of git. */
const fs = require('fs');
const path = require('path');
const { chromium, boot, go } = require('../support/harness.cjs');

const file = process.argv[2];
if (!file) { console.error('usage: node tools/doctor-replay.cjs doctors.json'); process.exit(2); }
const DOCS = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
// Tiers when there are any, else the old flat list; then the team's terms.
function rawTerms(d) {
  const r = d.researchResult || {};
  const tiers = Array.isArray(r.tiers) ? r.tiers.filter(t => t && Array.isArray(t.terms) && t.terms.length) : [];
  const research = tiers.length ? tiers.flatMap(t => t.terms) : (Array.isArray(r.terms) ? r.terms : []);
  return research.concat(Array.isArray(d.customTerms) ? d.customTerms : []).filter(t => t && (t.en || t.es)).map(t => [t.en || '', t.es || '']);
}
const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();

async function load(page) {
  await page.evaluate(ds => {
    window.__DB['doctor-directory'] = {};
    ds.forEach(d => { const { id, ...r } = d; window.__DB['doctor-directory'][id] = r; });
    DOCTOR_DIRECTORY.length = 0; ds.forEach(d => DOCTOR_DIRECTORY.push(d));
  }, DOCS);
}

// Every (tab, en, es) on the new page, every tab clicked through.
function newPage(page, id) {
  return page.evaluate(id => {
    openDoctorDirDetail(id);
    const P = document.getElementById('doctorDirDetailModal');
    const keys = [...P.querySelectorAll('.dp-tabs button')].map(b => b.getAttribute('onclick').match(/'([^']+)'/)[1]);
    const rows = [];
    for (const k of keys) {
      doctorPageTab(k);
      P.querySelectorAll('.dp-row').forEach(r => rows.push([k, r.querySelector('.dp-en')?.textContent || '', r.querySelector('.dp-es')?.textContent || '', r.querySelector('.dp-def')?.textContent || '']));
    }
    const text = P.innerText;
    const img = P.querySelector('.dp-ph.is-photo img');
    closeDoctorDirDetail();
    return { rows, text, photo: img ? img.getAttribute('src') : null };
  }, id);
}

// The old modal: one tier panel at a time, team terms in their own section.
function oldPage(page, id) {
  return page.evaluate(id => {
    openDoctorDirDetail(id);
    const M = document.getElementById('doctorDirDetailModal');
    const rows = [];
    const keys = [...M.querySelectorAll('.tier-pill')].map(b => b.getAttribute('onclick').match(/'detail',\s*'([^']+)'/)[1]);
    const grab = k => M.querySelectorAll('.tier-panel .doc-research-term-card').forEach(c =>
      rows.push([k, c.querySelector('.doc-research-term-en')?.textContent || '', c.querySelector('.doc-research-term-es')?.textContent || '']));
    if (keys.length) for (const k of keys) { setResearchTier('detail', k); grab(k); }
    M.querySelectorAll('.doc-research-terms').forEach(list => { if (!list.closest('.tier-panel'))
      list.querySelectorAll('.doc-research-term-card').forEach(c => rows.push(['team', c.querySelector('.doc-research-term-en')?.textContent || '', c.querySelector('.doc-research-term-es')?.textContent || ''])); });
    closeDoctorDirDetail();
    return { rows };
  }, id);
}

(async () => {
  const browser = await chromium.launch();
  const problems = [];
  let terms = 0;
  const { ctx, page } = await boot(browser, { device: 'iphone' });
  await go(page, 'doctor-directory');
  await load(page);
  const shown = {};
  for (const d of DOCS) {
    let got;
    try { got = await newPage(page, d.id); }
    catch (e) { problems.push(`${d.name}: page failed: ${e.message.split('\n')[0]}`); shown[d.id] = { rows: [] }; await page.evaluate(() => closeDoctorDirDetail()).catch(() => {}); continue; }
    shown[d.id] = got;
    const have = new Set(got.rows.map(r => norm(r[1]) + '|' + norm(r[2])));
    // From the raw data, not the app's own helpers (a bug there would hide
    // itself): every research term and every team term.
    const expected = rawTerms(d);
    terms += expected.length;
    for (const [en, es] of expected) if (!have.has(norm(en) + '|' + norm(es))) problems.push(`${d.name}: term missing: ${en} / ${es}`);
    if (got.rows.length !== expected.length) problems.push(`${d.name}: ${got.rows.length} rows shown, ${expected.length} in the data`);
    const txt = norm(got.text);
    if ((d.notes || '').trim() && !txt.includes(norm(d.notes).slice(0, 60))) problems.push(`${d.name}: tip (notes) not shown`);
    if (d.photo && got.photo !== d.photo) problems.push(`${d.name}: photo not shown`);
    if ((d.locationDetails || '').trim() && !txt.includes(norm(d.locationDetails))) problems.push(`${d.name}: floor/suite not shown`);
    if ((d.specialty || '').trim() && !txt.includes(norm(d.specialty))) problems.push(`${d.name}: specialty not shown`);
    if (d.researchResult && d.researchResult.note && !txt.includes(norm(d.researchResult.note).slice(0, 60))) problems.push(`${d.name}: Doctor Prep note not shown`);
  }
  if (page.__errors.length) problems.push('page errors (new): ' + page.__errors.slice(0, 5).join(' | '));
  await ctx.close();

  if (process.env.OLD) {
    process.env.INDEX = path.resolve(process.env.OLD);
    const { ctx: c2, page: p2 } = await boot(browser, { device: 'iphone' });
    await go(p2, 'doctor-directory');
    await load(p2);
    for (const d of DOCS) {
      let old;
      try { old = await oldPage(p2, d.id); } catch (e) { problems.push(`${d.name}: old view failed: ${e.message.split('\n')[0]}`); continue; }
      const now = new Set(shown[d.id].rows.map(r => norm(r[1]) + '|' + norm(r[2])));
      for (const [k, en, es] of old.rows) if (!now.has(norm(en) + '|' + norm(es))) problems.push(`${d.name}: old view showed "${en} / ${es}" (${k}), new page does not`);
    }
    if (p2.__errors.length) problems.push('page errors (old): ' + p2.__errors.slice(0, 5).join(' | '));
    await c2.close();
  }
  await browser.close();
  console.log(`${DOCS.length} doctors, ${terms} terms in the data${process.env.OLD ? ', compared with the old view' : ''}.`);
  if (problems.length) { console.log(problems.length + ' problems:'); problems.forEach(p => console.log('  ' + p)); process.exitCode = 1; }
  else console.log('Nothing lost.');
})();
