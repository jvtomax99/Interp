/* Doctors, tips and team terms saved with no signal are kept on the phone
   and sent later (the outbox; docs/features/kept-on-phone-saves.md, step 2).
   The outbox holds plain text, so "only these fields", "add to a list",
   "take out of a list" and "delete this file after" are words in the entry
   that become the database's own markers when it is sent. Checked here: what
   is kept, how big it is, what the team's copy holds afterwards next to a
   teammate's later changes, and what the person is told. */
const { chromium, boot } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(condition, message, detail) {
  if (condition) { passed++; console.log('  PASS', message); }
  else { failed++; process.exitCode = 1; console.log('  FAIL', message, detail === undefined ? '' : JSON.stringify(detail).slice(0, 900)); }
}
// The database answers again before the phone hears "online", as it would.
const signal = async (page, ctx, on) => {
  const gate = () => page.evaluate(on => { window.__gate0 = window.__gate0 || window.__gate; window.__gate = on ? window.__gate0 : () => new Promise(() => {}); }, on);
  if (on) { await gate(); await ctx.setOffline(false); } else { await ctx.setOffline(true); await gate(); }
};
const toast = page => page.evaluate(() => document.getElementById('toast').textContent.replace(/\s+/g, ' ').trim());
const stored = (page, id) => page.evaluate(id => JSON.parse(JSON.stringify(window.__DB['doctor-directory'][id] || null)), id);

(async () => {
  const browser = await chromium.launch();
  try {
    const { ctx, page } = await boot(browser, { device: 'iphone' });
    page.on('dialog', d => d.accept().catch(() => {}));
    try {
      await page.evaluate(() => {
        if (!whoAmI()) localStorage.setItem('ih_myName', 'Tester');
        window.confirm = () => true;
        // A doctor with real weight: 50 KB of research, a photo, a tip, a term.
        const doc = { name: 'Dr. Ana Queue', specialty: 'Oncology', hospitalLocation: 'Hackensack', locationDetails: '2nd floor', source: 'manual',
          photo: 'https://files.example/old.jpg', photoPath: 'doctor-photos/old.jpg',
          researchResult: { summary: 'x'.repeat(50000) },
          tips: [{ id: 'tp1', text: 'Speaks fast', by: 'Luis', at: 1 }],
          customTerms: [{ id: 'c1', en: 'port flush', es: 'lavado del port', def: '', addedBy: 'Luis', addedAt: 1 }] };
        window.__DB['doctor-directory']['ob-a'] = JSON.parse(JSON.stringify(doc));
        DOCTOR_DIRECTORY.push({ id: 'ob-a', ...JSON.parse(JSON.stringify(doc)) });
      });

      console.log('== no signal: each save is kept, shown and counted');
      await signal(page, ctx, false);
      const edit = await page.evaluate(async () => {
        _openEditDoctorDirModal('ob-a');
        document.getElementById('fDDSpecialty').value = 'Hematology';
        await saveDoctorDirEntry();
        const e = OUTBOX[OUTBOX.length - 1];
        return { n: OUTBOX.length, op: e.op, keys: Object.keys(e.data).sort(), bytes: JSON.stringify(e).length,
          shown: DOCTOR_DIRECTORY.find(d => d.id === 'ob-a').specialty,
          cached: (JSON.parse(localStorage.getItem('ih_doctorDirectory')).find(d => d.id === 'ob-a') || {}).specialty,
          open: document.getElementById('doctorDirOverlay') ? document.getElementById('doctorDirOverlay').classList.contains('show') : null };
      });
      ok(/Doctor saved on this device/.test(await toast(page)), 'a doctor edit with no signal says it is saved on this device', await toast(page));
      ok(edit.n === 1 && edit.op === 'update' && edit.keys.includes('specialty') && !edit.keys.some(k => ['researchResult', 'tips', 'notes', 'customTerms', 'name', 'photo'].includes(k)),
        'the kept edit holds only the fields this save changed', edit);
      ok(edit.bytes < 1000, `the kept edit is small next to the doctor's 50 KB of research (${edit.bytes} bytes)`, edit.bytes);
      ok(edit.shown === 'Hematology' && edit.cached === 'Hematology', 'this phone shows the edit, and still will after the Hub is reopened with no signal', edit);
      ok((await stored(page, 'ob-a')).specialty === 'Oncology', 'nothing reached the database yet');

      const tip = await page.evaluate(async () => {
        DT.id = 'ob-a'; DT.editing = null;
        document.getElementById('fDTip').value = 'Draws on the whiteboard';
        await saveDoctorTip();
        const said = document.getElementById('toast').textContent;
        const mine = DOCTOR_DIRECTORY.find(d => d.id === 'ob-a').tips.find(t => t.text === 'Draws on the whiteboard');
        DT.editing = mine.id;
        document.getElementById('fDTip').value = 'Draws everything on the whiteboard';
        await saveDoctorTip();
        return { said, n: OUTBOX.length, tips: DOCTOR_DIRECTORY.find(d => d.id === 'ob-a').tips.map(t => t.text) };
      });
      ok(/Tip added on this device/.test(tip.said) && tip.n === 3, 'a tip, then an edit of it, are kept with no signal', tip);
      ok(JSON.stringify(tip.tips) === '["Speaks fast","Draws everything on the whiteboard"]', 'this phone shows the tip as edited, once', tip.tips);

      const term = await page.evaluate(async () => {
        doctorTermTargetId = 'ob-a';
        document.getElementById('fDTEn').value = 'tumor board';
        document.getElementById('fDTEs').value = 'comité de tumores';
        document.getElementById('fDTDef').value = '';
        await saveDoctorTerm();
        return { said: document.getElementById('toast').textContent, n: OUTBOX.length };
      });
      ok(/Term added on this device/.test(term.said) && term.n === 4, 'a team term is kept with no signal', term);

      const fresh = await page.evaluate(async () => {
        openAddDoctorDirModal();
        await new Promise(r => setTimeout(r, 300));
        document.getElementById('fDDName').value = 'Dr. Lori Basement';
        await saveDoctorDirEntry();
        const e = OUTBOX[OUTBOX.length - 1];
        return { n: OUTBOX.length, op: e.op, id: e.docId, merge: e.mergeFields, listed: DOCTOR_DIRECTORY.some(d => d.name === 'Dr. Lori Basement') };
      });
      ok(fresh.n === 5 && fresh.op === 'set' && Array.isArray(fresh.merge) && !fresh.merge.some(f => ['tips', 'notes', 'customTerms'].includes(f)) && fresh.listed,
        'a new doctor is kept as a save of the sheet\'s fields only, and is listed on this phone', fresh);

      const titles = await page.evaluate(() => OUTBOX.map(e => describeOutboxEntry(e)));
      ok(titles.every(t => !/Change to|doctor-directory/.test(t.title)) && /Doctor edit: Dr. Ana Queue/.test(titles[0].title) && /specialty/.test(titles[0].detail)
        && /^Tip for Dr. Ana Queue/.test(titles[1].title) && /^Tip edit for Dr. Ana Queue/.test(titles[2].title)
        && /^Team term for Dr. Ana Queue: tumor board/.test(titles[3].title) && /^Doctor: Dr. Lori Basement/.test(titles[4].title),
        'the Unsent changes sheet names each one in plain words', titles);
      const badge = await page.evaluate(() => { const b = document.getElementById('tgSync'); return ((b && (b.getAttribute('aria-label') || b.title || b.textContent)) || ''); });
      ok(/\b5 changes\b/.test(badge), 'the unsent badge counts all five', badge);

      console.log('== signal back: sent, next to what a teammate changed meanwhile');
      await page.evaluate(() => {
        const d = window.__DB['doctor-directory']['ob-a'];
        d.locationDetails = 'Moved to the 4th floor';
        d.tips.push({ id: 'tp9', text: 'Prefers consecutive', by: 'Marta', at: 5 });
        d.customTerms.push({ id: 'c9', en: 'nadir', es: 'nadir', def: '', addedBy: 'Marta', addedAt: 5 });
      });
      await signal(page, ctx, true);
      await page.evaluate(() => flushOutbox());
      await page.waitForFunction(() => !OUTBOX.length && !outboxFlushing, null, { timeout: 15000 });
      await page.waitForTimeout(600);
      const after = await stored(page, 'ob-a');
      ok(after.specialty === 'Hematology' && after.locationDetails === 'Moved to the 4th floor' && after.researchResult.summary.length === 50000,
        'the late edit lands on its own field and leaves the teammate\'s later change and the research alone', { s: after.specialty, l: after.locationDetails });
      ok(JSON.stringify(after.tips.map(t => t.text)) === '["Speaks fast","Prefers consecutive","Draws everything on the whiteboard"]', 'tips: the teammate\'s is kept, mine arrives once, as edited', after.tips);
      ok(JSON.stringify(after.customTerms.map(t => t.en)) === '["port flush","nadir","tumor board"]', 'team terms: the teammate\'s is kept beside mine', after.customTerms);
      const made = await stored(page, fresh.id);
      ok(made && made.name === 'Dr. Lori Basement', 'the new doctor reached the database', made);
      const seen = await page.evaluate(() => { const d = DOCTOR_DIRECTORY.find(x => x.id === 'ob-a'); return { held: OUTBOX_HELD.length, tips: (d.tips || []).length, loc: d.locationDetails }; });
      ok(seen.held === 0 && seen.tips === 3 && seen.loc === 'Moved to the 4th floor', 'afterwards this phone reads the list again and shows the teammate\'s changes too', seen);

      console.log('== sending the same change twice changes nothing more');
      const twice = await page.evaluate(async () => {
        const e = { collection: 'doctor-directory', docId: 'ob-a', op: 'update', listRemove: { tips: [{ id: 'tp1', text: 'Speaks fast', by: 'Luis', at: 1 }] },
          listAdd: { tips: [{ id: 'tp1', text: 'Speaks very fast', by: 'Luis', at: 1, editedAt: 9 }] } };
        await applyQueuedWrite(e); await applyQueuedWrite(e);
        return window.__DB['doctor-directory']['ob-a'].tips.map(t => t.text);
      });
      ok(twice.length === 3 && twice.filter(t => t === 'Speaks very fast').length === 1 && !twice.includes('Speaks fast'), 'a tip edit replayed leaves one copy of the new wording', twice);

      console.log('== reopening the Hub while a save still waits');
      const reopened = await page.evaluate(async () => {
        enqueueWrite({ collection: 'doctor-directory', docId: 'ob-a', op: 'update', listAdd: { tips: [{ id: 'tpw', text: 'Still waiting', by: 'Tester', at: 7 }] } });
        enqueueWrite({ collection: 'doctor-directory', docId: 'ob-new', op: 'set', data: { name: 'Dr. Not Sent Yet', specialty: '' }, mergeFields: ['name', 'specialty'] });
        DOCTOR_DIR_STATE = 'idle';
        const hold = outboxFlushing; outboxFlushing = true;   // nothing sends during the read
        await loadDoctorDirectory();
        outboxFlushing = hold;
        const out = { tip: DOCTOR_DIRECTORY.find(d => d.id === 'ob-a').tips.some(t => t.id === 'tpw'), added: DOCTOR_DIRECTORY.some(d => d.id === 'ob-new'),
          inDb: window.__DB['doctor-directory']['ob-a'].tips.some(t => t.id === 'tpw') };
        OUTBOX = []; saveOutbox();
        return out;
      });
      ok(reopened.tip && reopened.added && !reopened.inDb, 'the list read from the database still shows the waiting tip and the waiting new doctor', reopened);

      console.log('== the old photo goes only after the save is in');
      await signal(page, ctx, false);
      const photo = await page.evaluate(async () => {
        window.__UPLOADS = window.__UPLOADS || { puts: [], deletes: [], ms: 600, fail: false };
        _openEditDoctorDirModal('ob-a');
        pendingDDPhotoDataUrl = 'https://files.example/new.jpg'; pendingDDPhotoPath = 'doctor-photos/new.jpg';
        await saveDoctorDirEntry();
        return { files: OUTBOX[OUTBOX.length - 1].filesAfter, deleted: window.__UPLOADS.deletes.slice() };
      });
      ok(JSON.stringify(photo.files) === '["doctor-photos/old.jpg"]' && !photo.deleted.length, 'with no signal the old photo is not deleted yet', photo);
      await signal(page, ctx, true);
      await page.evaluate(() => flushOutbox());
      await page.waitForFunction(() => !OUTBOX.length && !outboxFlushing, null, { timeout: 15000 });
      const gone = await page.evaluate(() => ({ deleted: window.__UPLOADS.deletes.slice(), path: window.__DB['doctor-directory']['ob-a'].photoPath }));
      ok(gone.deleted.includes('doctor-photos/old.jpg') && gone.path === 'doctor-photos/new.jpg', 'once sent, the record points at the new photo and the old file is deleted', gone);

      console.log('== a doctor removed on another phone meanwhile');
      await page.waitForTimeout(600);
      await signal(page, ctx, false);
      await page.evaluate(async () => {
        DT.id = 'ob-a'; DT.editing = null;
        document.getElementById('fDTip').value = 'Too late';
        await saveDoctorTip();
        _openEditDoctorDirModal('ob-a');
        document.getElementById('fDDSpecialty').value = 'Lymphoma';
        await saveDoctorDirEntry();
        delete window.__DB['doctor-directory']['ob-a'];   // deleted by a teammate
      });
      await signal(page, ctx, true);
      await page.evaluate(() => flushOutbox());
      await page.waitForFunction(() => !OUTBOX.length && !outboxFlushing, null, { timeout: 15000 });
      await page.waitForTimeout(600);
      const refused = await page.evaluate(() => ({ back: !!window.__DB['doctor-directory']['ob-a'], held: OUTBOX_HELD.map(e => describeOutboxEntry(e).title),
        why: OUTBOX_HELD.map(e => outboxReasonText(e.reason)), listed: DOCTOR_DIRECTORY.some(d => d.id === 'ob-a'), said: document.getElementById('toast').textContent,
        copy: outboxEntryText(OUTBOX_HELD[0]) }));
      ok(!refused.back && refused.held.length === 2, 'the late tip and the late edit do not bring the doctor back; both are held, not lost', refused);
      ok(refused.why.every(w => /no longer exists/.test(w)) && /couldn.t sync/.test(refused.said) && /Too late/.test(refused.copy) && /listAdd/.test(refused.copy),
        'the phone says they could not sync and why, and Copy keeps the tip\'s words', refused);
      ok(!refused.listed, 'the doctor leaves this phone\'s list instead of showing as saved', refused.listed);
      await page.evaluate(() => { OUTBOX_HELD = []; saveOutboxHeld(); });

      console.log('== refused while the list is being read; a name added again; no photo field');
      const race = await page.evaluate(async () => {
        const doc = { name: 'Dr. Race Read', specialty: 'Renal', source: 'ai', tips: [] };   // made by Doctor Prep: no photo field
        window.__DB['doctor-directory']['ob-r'] = JSON.parse(JSON.stringify(doc));
        DOCTOR_DIRECTORY.push({ id: 'ob-r', ...doc });
        enqueueWrite({ collection: 'doctor-directory', docId: 'ob-r', op: 'update', listAdd: { tips: [{ id: 'tpr', text: 'Refused tip', by: 'Tester', at: 3 }] } });
        const real = window.__gate;
        window.__gate = (c, id, op) => op === 'update' ? Promise.reject(Object.assign(new Error('Quota exceeded.'), { code: 'resource-exhausted' })) : real(c, id, op);
        DOCTOR_DIR_STATE = 'idle';
        const reading = loadDoctorDirectory();   // the read starts with the tip waiting...
        await flushOutbox();                     // ...and the refusal comes back first
        await reading;
        await new Promise(r => setTimeout(r, 1500));
        window.__gate = real;
        const d = DOCTOR_DIRECTORY.find(x => x.id === 'ob-r');
        const out = { held: OUTBOX_HELD.length, shown: (d.tips || []).some(t => t.id === 'tpr'), state: DOCTOR_DIR_STATE };
        OUTBOX_HELD = []; saveOutboxHeld();
        // An edit of this doctor: nothing about the photo changed.
        const e = doctorSheetEntry('ob-r', { ...d, specialty: 'Nephrology', photo: null, photoPath: null, region: null, updatedAt: 5 }, d, null, true);
        // Adding the same name again after a teammate deleted the doctor.
        delete window.__DB['doctor-directory']['ob-r'];
        const again = doctorSheetEntry('ob-r', { ...d, researchResult: d.researchResult, specialty: 'Renal', updatedAt: 6 }, { ...d, researchResult: { summary: 'big' } }, null, false);
        await applyQueuedWrite(again);
        return { ...out, editKeys: Object.keys(e.data).sort(), title: describeOutboxEntry(e).detail, addOp: again.op, addKeys: again.mergeFields, made: (window.__DB['doctor-directory']['ob-r'] || {}).name };
      });
      ok(race.held === 1 && !race.shown && race.state === 'ok', 'a tip refused while the list was being read is held and does not show as saved', race);
      ok(JSON.stringify(race.editKeys) === '["specialty","updatedAt"]' && !/photo/.test(race.title), 'an edit of a doctor with no photo on file does not claim the photo changed', race);
      ok(race.addOp === 'set' && race.addKeys.includes('name') && !race.addKeys.includes('researchResult') && race.made === 'Dr. Race Read', 'adding a name this phone still lists, deleted elsewhere, makes the doctor again', race);

      console.log('== Wi-Fi that is connected but dead');
      await page.evaluate(() => {
        const doc = { name: 'Dr. Dead Wifi', specialty: 'Renal', source: 'manual', tips: [], customTerms: [] };
        window.__DB['doctor-directory']['ob-w'] = JSON.parse(JSON.stringify(doc));
        DOCTOR_DIRECTORY.push({ id: 'ob-w', ...doc });
        window.__gate = () => new Promise(() => {});   // online, but nothing answers
        DT.id = 'ob-w'; DT.editing = null;
        document.getElementById('fDTip').value = 'Asks for teach-back';
        window.__t0 = Date.now(); window.__took = null;
        saveDoctorTip().then(() => { window.__took = Date.now() - window.__t0; });
      });
      await page.waitForFunction(() => window.__took !== null, null, { timeout: 16000 });
      const dead = await page.evaluate(() => ({ took: window.__took, said: document.getElementById('toast').textContent, n: OUTBOX.length, again: !!outboxRetryTimer }));
      ok(dead.took <= 12600 && /Tip added on this device/.test(dead.said) && dead.n === 1, `it answers within 12 seconds and keeps the tip (${dead.took} ms)`, dead);
      ok(dead.again, 'and the phone will try again by itself (dead Wi-Fi coming back sends no "online" signal)', dead);
      await page.evaluate(() => { window.__gate = window.__gate0; return flushOutbox(); });
      await page.waitForFunction(() => !OUTBOX.length && !outboxFlushing, null, { timeout: 15000 });
      ok((await stored(page, 'ob-w')).tips.length === 1, 'and it is sent once the database answers again');

      console.log('== never kept for later: joining duplicate doctors');
      await signal(page, ctx, false);
      const merge = await page.evaluate(async () => {
        const put = (id, d) => { window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(d)); DOCTOR_DIRECTORY.push({ id, ...JSON.parse(JSON.stringify(d)) }); };
        put('ob-k1', { name: 'Dr. Omar Twinley', specialty: 'Renal', source: 'manual' });
        put('ob-k2', { name: 'Dr. Omar Twinley', specialty: 'Renal', source: 'manual' });
        await mergeDuplicateDoctors('ob-k1');
        return { said: document.getElementById('toast').textContent, n: OUTBOX.length, both: DOCTOR_DIRECTORY.filter(d => /^ob-k/.test(d.id)).length };
      });
      ok(/offline/i.test(merge.said) && /needs a connection/.test(merge.said) && merge.n === 0 && merge.both === 2, 'a merge with no signal says it needs a connection and queues nothing', merge);
      ok(!page.__errors.length, 'no page errors', page.__errors);
    } finally { await ctx.close(); }
  } finally {
    await browser.close();
    console.log(`\n${passed} passed, ${failed} failed`);
  }
})();
