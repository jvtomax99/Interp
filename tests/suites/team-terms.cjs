/* A doctor's team terms are added and taken out one at a time, by the
   database (doctorTermWrite; docs/features/kept-on-phone-saves.md). The
   doctor list is read once when the Hub opens, so a phone holding an old
   copy must never send the list whole: a doctor save, a new term, a removed
   term and a merge each leave a teammate's later term in place. */
const { chromium, boot } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(condition, message, detail) {
  if (condition) { passed++; console.log('  PASS', message); }
  else { failed++; process.exitCode = 1; console.log('  FAIL', message, detail === undefined ? '' : JSON.stringify(detail).slice(0, 700)); }
}
const names = list => (list || []).map(t => t.en).join(',');

(async () => {
  const browser = await chromium.launch();
  try {
    const { ctx, page } = await boot(browser, { device: 'iphone' });
    try {
      // What this phone loaded in the morning: one team term.
      await page.evaluate(() => {
        const mine = { name: 'Dr. Ana Stale', specialty: 'Oncology', hospitalLocation: '', locationDetails: '', source: 'manual',
          customTerms: [{ id: 'c1', en: 'port flush', es: 'lavado del port', def: '', addedBy: 'Luis', addedAt: 1 }] };
        window.__DB['doctor-directory']['tt-a'] = JSON.parse(JSON.stringify(mine));
        DOCTOR_DIRECTORY.push({ id: 'tt-a', ...JSON.parse(JSON.stringify(mine)) });
        // At noon a teammate adds one; this phone's copy never hears of it.
        window.__DB['doctor-directory']['tt-a'].customTerms.push({ id: 'c2', en: 'nadir', es: 'nadir', def: '', addedBy: 'Marta', addedAt: 2 });
        window.confirm = () => true;
        if (!whoAmI()) localStorage.setItem('ih_myName', 'Tester');
      });
      const stored = () => page.evaluate(() => window.__DB['doctor-directory']['tt-a'].customTerms);

      // 1. Saving the doctor (the same write the sheet makes) from the old copy.
      await page.evaluate(async () => {
        const d = DOCTOR_DIRECTORY.find(x => x.id === 'tt-a');
        const { id, ...record } = d;
        await persistDoctorDirectoryEntry(id, { ...record, specialty: 'Hematology', updatedAt: Date.now() });
      });
      ok(names(await stored()) === 'port flush,nadir', 'a doctor save from an old copy leaves the teammate\'s term', await stored());
      ok(await page.evaluate(() => window.__DB['doctor-directory']['tt-a'].specialty) === 'Hematology', 'and still saves the sheet\'s own fields');

      // 2. Adding a term from the old copy.
      await page.evaluate(async () => {
        doctorTermTargetId = 'tt-a';
        document.getElementById('fDTEn').value = 'tumor board';
        document.getElementById('fDTEs').value = 'comité de tumores';
        document.getElementById('fDTDef').value = '';
        await saveDoctorTerm();
      });
      ok(names(await stored()) === 'port flush,nadir,tumor board', 'a new team term is added to the list in the database, not sent over it', await stored());
      ok(await page.evaluate(() => DOCTOR_DIRECTORY.find(x => x.id === 'tt-a').customTerms.some(t => t.en === 'tumor board')), 'this phone shows the new term');

      // 3. Removing one from the old copy.
      await page.evaluate(() => deleteDoctorTerm('tt-a', 'c1'));
      ok(names(await stored()) === 'nadir,tumor board', 'removing a term takes out that one only', await stored());

      // 4. A merge moves the other doctor's team terms onto the one kept.
      const merged = await page.evaluate(() => {
        const a = { id: 'm1', name: 'Dr. Kim Twin', customTerms: [{ id: 'k1', en: 'bolus', es: 'bolo' }] };
        const b = { id: 'm2', name: 'Dr. Kim Twin MD', customTerms: [{ id: 'k2', en: 'Bolus', es: 'bolo' }, { id: 'k3', en: 'titrate', es: 'ajustar la dosis' }] };
        return mergeDoctorRecords([a, b], 'm1').customTerms.map(t => t.id);
      });
      ok(JSON.stringify(merged) === '["k1","k3"]', 'a merge keeps every team term once, the kept doctor\'s wording first', merged);

      // 5. The real merge, from an old copy of the doctor kept.
      const real = await page.evaluate(async () => {
        const put = (id, d) => { window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(d)); DOCTOR_DIRECTORY.push({ id, ...JSON.parse(JSON.stringify(d)) }); };
        put('tt-k1', { name: 'Dr. Omar Twinley', specialty: 'Renal', source: 'manual', customTerms: [{ id: 'k1', en: 'bolus', es: 'bolo' }] });
        put('tt-k2', { name: 'Dr. Omar Twinley', specialty: 'Renal', source: 'manual', customTerms: [{ id: 'k3', en: 'titrate', es: 'ajustar la dosis' }] });
        window.__DB['doctor-directory']['tt-k1'].customTerms.push({ id: 'k9', en: 'dry weight', es: 'peso seco' });   // a teammate, later
        const grouped = duplicateDoctorGroups().some(g => g.some(d => d.id === 'tt-k1') && g.some(d => d.id === 'tt-k2'));
        await mergeDuplicateDoctors('tt-k1');
        const kept = window.__DB['doctor-directory']['tt-k1'];
        return { grouped, terms: kept && (kept.customTerms || []).map(t => t.id), otherGone: !window.__DB['doctor-directory']['tt-k2'] };
      });
      ok(real.grouped && JSON.stringify(real.terms) === '["k1","k9","k3"]' && real.otherGone, 'merging duplicates moves the other doctor\'s team term and leaves the teammate\'s later one', real);

      // 6. A doctor removed on another phone: the message says so, not "try again".
      const gone = await page.evaluate(async () => {
        DOCTOR_DIRECTORY.push({ id: 'tt-gone', name: 'Dr. Left Already', customTerms: [] });
        doctorTermTargetId = 'tt-gone';
        document.getElementById('fDTEn').value = 'ghost';
        await saveDoctorTerm();
        return { toast: document.getElementById('toast').textContent, made: !!window.__DB['doctor-directory']['tt-gone'] };
      });
      ok(/no longer in the directory/.test(gone.toast) && !gone.made, 'a term for a doctor deleted elsewhere says the doctor is gone and creates nothing', gone);
    } finally { await ctx.close(); }
  } finally {
    await browser.close();
    console.log(`\n${passed} passed, ${failed} failed`);
  }
})();
