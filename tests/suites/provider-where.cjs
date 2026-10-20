/* Provider Pictures on the Where picker (R5, docs/features/places.md): the
   provider sheet picks a place from the shared list, "Department or unit"
   is its own line, the saved record and the card follow the doctors' rules,
   and the doctor sheet's picker is untouched. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'provider-where/'; require('fs').mkdirSync(O, { recursive: true });
let passed = 0, failed = 0;
const ok = (c, m, d) => { if (c) { passed++; console.log('  PASS ' + m); } else { failed++; process.exitCode = 1; console.log('  FAIL ' + m + (d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    console.log('== ' + device);
    const { ctx, page } = await L.boot(b, { device });
    try {
      await L.go(page, 'providers', 1200);
      // The sheet: a Where button where the facility box was, a unit box.
      await page.evaluate(() => _openAddProviderModal()); await wait(300);
      const sheet = await page.evaluate(() => {
        const w = document.getElementById('fPPlace'), u = document.getElementById('fPUnit');
        const r = w.getBoundingClientRect();
        return { where: !!w, text: w.textContent.replace(/\s+/g, ' ').trim(), h: Math.round(r.height), facilityBox: !!document.getElementById('fPFacility'),
          unit: !!u, unitFont: getComputedStyle(u).fontSize, own: (() => { const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === w || w.contains(h)); })() };
      });
      ok(sheet.where && !sheet.facilityBox && /Choose a place/.test(sheet.text), 'the provider sheet has Where instead of a facility box', sheet);
      ok(sheet.h >= 44 && sheet.own && sheet.unit, 'Where is 44px and takes the tap; the unit box is there', sheet);
      if (device === 'iphone') ok(parseFloat(sheet.unitFont) >= 16, 'on a phone the unit box is 16px (no iOS zoom)', sheet.unitFont);
      await page.screenshot({ path: O + device + '-sheet.png' });

      // The picker opens for the provider, counts doctors and providers, and picks.
      await page.click('#fPPlace'); await wait(400);
      const picker = await page.evaluate(() => {
        const rows = [...document.querySelectorAll('#placeList .place-row')];
        const counted = rows.map(r => (r.querySelector('small') || {}).textContent || '').filter(t => /doctor|provider/.test(t));
        return { open: document.getElementById('placeOverlay').classList.contains('show'), target: placePickFor, n: rows.length, counted };
      });
      ok(picker.open && picker.target === 'pp' && picker.n > 3, 'Where opens the shared picker for the provider', picker);
      ok(picker.counted.some(t => /doctor/.test(t)) && picker.counted.some(t => /provider/.test(t)), 'place rows count the doctors and providers there', picker.counted);
      await page.screenshot({ path: O + device + '-picker.png' });
      await page.evaluate(() => pickPlace(encGroup('John Theurer Cancer Center'))); await wait(200);
      const picked = await page.evaluate(() => ({ pp: ppPlace, dd: ddPlace, closed: !document.getElementById('placeOverlay').classList.contains('show'),
        text: document.getElementById('fPPlace').textContent.replace(/\s+/g, ' ').trim() }));
      ok(picked.pp === 'John Theurer Cancer Center' && picked.dd === '' && picked.closed && /John Theurer/.test(picked.text), 'the pick lands on the provider field, not the doctor\'s', picked);

      // Save: locationGroup, facility = the place, the unit; the card under that heading.
      await page.fill('#fPName', 'Nurse Pat Rivera'); await page.fill('#fPRole', 'Infusion nurse'); await page.fill('#fPUnit', 'Infusion, 2nd floor');
      await page.evaluate(() => saveProvider()); await wait(700);
      const saved = await page.evaluate(() => {
        const p = PROVIDERS.find(x => x.name === 'Nurse Pat Rivera');
        const doc = p && __DB['healthcare-providers'][p.id];
        const card = [...document.querySelectorAll('#content .card')].find(c => /Nurse Pat Rivera/.test(c.textContent));
        let heading = null; if (card) { let el = card.closest('.grid'); while (el && !heading) { el = el.previousElementSibling; if (el && el.classList.contains('group-head')) heading = el.querySelector('.group-head-name').textContent; } }
        return { doc: doc && { facility: doc.facility, locationGroup: doc.locationGroup, unit: doc.unit }, heading, line: card && (card.querySelector('.provider-facility') || {}).textContent, sheetOpen: document.getElementById('providerOverlay').classList.contains('show') };
      });
      ok(saved.doc && saved.doc.locationGroup === 'John Theurer Cancer Center' && saved.doc.facility === 'John Theurer Cancer Center' && saved.doc.unit === 'Infusion, 2nd floor' && !saved.sheetOpen, 'saved: the place as locationGroup and facility, the unit', saved);
      ok(saved.heading === 'John Theurer Cancer Center' && /Infusion, 2nd floor/.test(saved.line || ''), 'the card sits under the place\'s heading and shows the unit', saved);
      if (device === 'iphone') await page.screenshot({ path: O + device + '-card.png' });

      // Edit an old provider (facility text only): the sheet shows its place; saving with the
      // place unchanged keeps the old wording; moving it rewrites the wording to the place.
      const old = await page.evaluate(() => {
        const id = 'old1'; const rec = { name: 'Dr. Old Entry', role: 'Oncology', facility: 'JTCC 3rd floor', phone: '', notes: '', addedBy: 'Maria', updatedAt: 1 };
        __DB['healthcare-providers'][id] = rec; PROVIDERS.push({ id, ...rec }); renderContent();
        _openEditProviderModal(id);
        return { pp: ppPlace, unit: document.getElementById('fPUnit').value };
      }); await wait(200);
      ok(old.pp === 'John Theurer Cancer Center' && old.unit === '', 'an old provider opens with its facility read as a place', old);
      await page.evaluate(() => saveProvider()); await wait(500);
      const kept = await page.evaluate(() => __DB['healthcare-providers']['old1'].facility);
      ok(kept === 'JTCC 3rd floor', 'saved with the place unchanged, the old wording stays', kept);
      await page.evaluate(() => { _openEditProviderModal('old1'); placePickFor = 'pp'; pickPlace(encGroup('Hackensack University Medical Center')); }); await wait(200);
      await page.evaluate(() => saveProvider()); await wait(500);
      const moved = await page.evaluate(() => { const d = __DB['healthcare-providers']['old1']; return { facility: d.facility, group: d.locationGroup }; });
      ok(moved.group === 'Hackensack University Medical Center' && moved.facility === 'Hackensack University Medical Center', 'moved to another place, the wording becomes the place', moved);

      // Search finds the unit; the doctor sheet's picker still writes ddPlace.
      const search = await page.evaluate(() => { const q = foldText('infusion'); return PROVIDERS.filter(p => foldText(p.unit).includes(q)).map(p => p.name); });
      ok(search.includes('Nurse Pat Rivera'), 'the unit is searchable', search);
      await L.go(page, 'doctor-directory', 800);
      await page.evaluate(() => _openAddDoctorDirModal()); await wait(200);
      await page.click('#fDDPlace'); await wait(300);
      await page.evaluate(() => pickPlace(encGroup('John Theurer Cancer Center'))); await wait(200);
      const dd = await page.evaluate(() => ({ dd: ddPlace, pp: ppPlace, target: placePickFor, text: document.getElementById('fDDPlace').textContent }));
      ok(dd.target === 'dd' && dd.dd === 'John Theurer Cancer Center' && /John Theurer/.test(dd.text), 'the doctor sheet\'s Where still works on its own', dd);
      await page.evaluate(() => closeDoctorDirModal());
      ok(!page.__errors || !page.__errors.length, 'no page errors', page.__errors);
    } finally { await ctx.close(); }
  }
  await b.close();
  console.log(`\n${passed} passed, ${failed} failed`);
})();
