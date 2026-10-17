/* The doctor's page (openDoctorDirDetail; docs/features/doctor-page.md):
   header, bento, tier tabs, term rows read aloud, the glass bar and where
   each of its buttons goes. Measured at phone and computer size. */
const fs = require('fs');
const { chromium, boot, go, OUT } = require('../support/harness.cjs');
const O = OUT + 'doctor-page/';
fs.mkdirSync(O, { recursive: true });
let passed = 0, failed = 0;
function ok(condition, message, detail) {
  if (condition) { passed++; console.log('  PASS', message); }
  else { failed++; process.exitCode = 1; console.log('  FAIL', message, detail === undefined ? '' : JSON.stringify(detail).slice(0, 700)); }
}
const pause = (page, ms = 350) => page.waitForTimeout(ms);

const T = (en, es, def) => ({ en, es, def });
const DOCTORS = [
  { id: 'dp-tiered', name: 'Dr. Lori A. Leslie', specialty: 'Lymphoma · Hematology/Oncology',
    hospitalLocation: 'John Theurer Cancer Center', locationDetails: '4th fl · Suite 401',
    notes: 'Explains staging with a drawing.', updatedBy: 'Maria', source: 'research',
    customTerms: [{ id: 'c1', en: 'port flush', es: 'lavado del port', def: 'Keeps the port open.', addedBy: 'Luis' },
                  { id: 'c2', en: 'scan day', es: 'día de estudios', def: '' }],
    researchResult: { found: true, specialty: 'Hematology/Oncology', note: '', tiers: [
      { key: 'core', terms: [T('staging', 'estadificación', 'How far the lymphoma has spread, stages I to IV.'), T('remission', 'remisión', 'No signs of disease; not the same as cured.'), T('R-CHOP', 'R-CHOP', 'Standard chemo regimen. Said as letters.')] },
      { key: 'procedures', terms: [T('bone marrow biopsy', 'biopsia de médula ósea', 'Sample taken from the hip bone.'), T('PET scan', 'tomografía PET', 'Imaging that shows active cancer.')] },
      { key: 'drugs', terms: [T('rituximab', 'rituximab', 'Antibody given by infusion.')] },
      { key: 'anatomy', terms: [T('lymph node', 'ganglio linfático', 'Small gland of the immune system.')] },
      { key: 'falsefriends', terms: [T('constipated', 'estreñido', 'Not "constipado", which means a cold.')] } ] } },
  { id: 'dp-flat', name: 'Dr. Ana Ruiz', specialty: 'Cardiology', hospitalLocation: '', locationDetails: '', notes: '',
    customTerms: [], researchResult: { found: true, specialty: 'Cardiology', terms: [T('ejection fraction', 'fracción de eyección', 'Share of blood pumped out.'), T('stent', 'stent', 'Small tube that holds an artery open.')] } },
  { id: 'dp-none', name: 'Dr. Barry Love', specialty: 'Gastroenterology', hospitalLocation: '', locationDetails: '', notes: '', customTerms: [], source: 'manual' },
];

// Into the Firebase stand-in too, so a listener reload keeps them.
async function seed(page) {
  await page.evaluate(ds => ds.forEach(d => {
    const { id, ...rest } = d;
    if (window.__DB) window.__DB['doctor-directory'][id] = JSON.parse(JSON.stringify(rest));
    if (!DOCTOR_DIRECTORY.some(x => x.id === id)) DOCTOR_DIRECTORY.push(JSON.parse(JSON.stringify(d)));
  }), DOCTORS);
}
async function openDoctor(page, id) {
  await seed(page);
  await page.evaluate(i => openDoctorDirDetail(i), id);
  await pause(page, 400);
}

// Every control on the page can be hit across 44px: probe its centre and
// 22px above and below it (touch targets may reach past the drawn pill).
async function targets(page) {
  return page.evaluate(() => {
    const page = document.getElementById('doctorDirDetailModal');
    const bad = [];
    for (const el of page.querySelectorAll('button')) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.top < 0 || r.bottom > innerHeight) continue;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (el.closest('.dp-tabs') && (r.left < 0 || r.right > innerWidth)) continue;
      const own = y => { const h = document.elementFromPoint(cx, y); return h && (h === el || el.contains(h)); };
      // A control under the glass bar is covered on purpose until it scrolls out.
      const bar = page.querySelector('.dp-bar').getBoundingClientRect();
      if (!el.closest('.dp-bar') && cy + 22 > bar.top) continue;
      if (r.width < 44 && !el.matches('.dp-link')) bad.push({ t: el.textContent.trim().slice(0, 30), w: r.width });
      const by = y => { const h = document.elementFromPoint(cx, y); return h ? (h === el || el.contains(h) ? 'self' : String(h.className || h.tagName).slice(0, 30) + ':' + h.textContent.trim().slice(0, 12)) : null; };
      if (!own(cy - 21.5) || !own(cy + 21.5) || !own(cy)) bad.push({ t: el.textContent.trim().slice(0, 30) || el.getAttribute('aria-label'), h: r.height, top: Math.round(r.top), up: by(cy - 21.5), mid: by(cy), down: by(cy + 21.5) });
    }
    return bad;
  });
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'desktop']) {
      console.log('== ' + device);
      const desktop = device === 'desktop';
      const { ctx, page } = await boot(browser, { device });
      page.setDefaultTimeout(7000);
      try {
        await go(page, 'doctor-directory');
        // The list's own cards still open the page.
        await page.locator('#content .doc-card').first().click();
        await pause(page, 400);
        ok(await page.locator('#doctorDirDetailOverlay.show .dp-hero').count() === 1, 'a doctor card opens the doctor page');

        await page.evaluate(() => { window.__spoken = []; window.speakText = (b, t, l) => window.__spoken.push([t, l]); });
        await openDoctor(page, 'dp-tiered');
        await page.screenshot({ path: O + device + '-top.png' });
        // Let the page's entrance finish before measuring it: CI's WebKit
        // renders slowly and twice measured the sheet mid-way (385 x 734 at
        // x 3.9 on a 393 x 759 phone). Endless loops don't count; 3 s at most.
        await page.evaluate(() => new Promise(r => {
          const t0 = performance.now(), ov = document.getElementById('doctorDirDetailOverlay');
          const moving = () => ov.getAnimations({ subtree: true }).some(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity);
          const check = () => (!moving() || performance.now() - t0 > 3000) ? r() : setTimeout(check, 50);
          check();
        }));

        const head = await page.evaluate(() => {
          const q = s => document.querySelector('#doctorDirDetailModal ' + s);
          const cs = (el, pseudo) => getComputedStyle(el, pseudo);
          const ov = document.getElementById('doctorDirDetailModal').getBoundingClientRect();
          return { name: q('.dp-name').textContent, nameSize: cs(q('.dp-name')).fontSize, nameWeight: cs(q('.dp-name')).fontWeight,
            ini: q('.dp-ini').textContent, pin: q('.dp-ph img').getAttribute('src'), spec: q('.dp-spec').textContent,
            dot: cs(q('.dp-spec'), '::before').backgroundColor, want: specialtyColor('Lymphoma · Hematology/Oncology'),
            total: q('.dp-navy-n').textContent, bars: [...document.querySelectorAll('#doctorDirDetailModal .dp-bars li')].map(l => l.className + ':' + l.textContent.trim()),
            where: q('.dp-where').textContent.replace(/\s+/g, ' ').trim(), wherePin: q('.dp-where img').getAttribute('src'),
            tip: q('.dp-tip').textContent.replace(/\s+/g, ' ').trim(),
            full: { w: ov.width, h: ov.height, x: ov.left, vw: innerWidth, vh: innerHeight },
            hScroll: document.getElementById('doctorDirDetailModal').scrollWidth - document.getElementById('doctorDirDetailModal').clientWidth };
        });
        ok(head.name === 'Dr. Lori A. Leslie' && head.nameSize === '22px' && head.nameWeight === '650', 'name 22/650', head);
        ok(head.ini === 'LL' && /pins\/leukemia\.webp$/.test(head.pin), 'specialty pin in its tile, with the initials', head);
        const hex = h => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
        ok(head.dot === hex(head.want), 'specialty dot in specialtyColor()', head);
        ok(head.total === '10', 'navy tile counts every term (8 researched + 2 team)', head.total);
        ok(head.bars.length === 6 && head.bars[4] === 'is-ff:False friends 1' && head.bars[5] === 'is-team:Team terms 2', 'one bar per tier, false friends marked', head.bars);
        ok(/John Theurer Cancer Center/.test(head.where) && /4th fl · Suite 401/.test(head.where), 'Where tile: place and floor', head.where);
        ok(/Explains staging with a drawing/.test(head.tip) && /Maria/.test(head.tip) && /· 1/.test(head.tip), 'Team tip tile: the tip, who, the count', head.tip);
        ok(head.hScroll <= 0, 'nothing runs off sideways', head.hScroll);
        if (!desktop) ok(head.full.w === head.full.vw && Math.abs(head.full.h - head.full.vh) <= 1 && head.full.x === 0, 'full screen on a phone', head.full);
        else ok(head.full.w <= 640 && head.full.w >= 600, 'a wide sheet on a computer', head.full);

        const tabs = () => page.evaluate(() => [...document.querySelectorAll('#doctorDirDetailModal .dp-tabs button')].map(b => (b.getAttribute('aria-checked') === 'true' ? '*' : '') + b.textContent.trim().replace(/\s+/g, ' ')));
        ok(JSON.stringify(await tabs()) === JSON.stringify(['*Core 3', 'Procedures 2', 'Drugs 1', 'Anatomy 1', 'False friends 1', 'Team terms 2']), 'tier tabs with counts, team terms last', await tabs());
        const row = await page.evaluate(() => {
          const r = document.querySelector('#doctorDirDetailModal .dp-row'), cs = s => getComputedStyle(r.querySelector(s));
          return { en: r.querySelector('.dp-en').textContent, enF: cs('.dp-en').fontSize + '/' + cs('.dp-en').fontWeight,
            es: r.querySelector('.dp-es').textContent, esF: cs('.dp-es').fontSize + '/' + cs('.dp-es').fontWeight, esC: cs('.dp-es').color,
            navy: getComputedStyle(document.documentElement).getPropertyValue('--navy').trim(),
            defF: cs('.dp-def').fontSize, defC: cs('.dp-def').color, soft: getComputedStyle(document.documentElement).getPropertyValue('--ink-soft').trim() };
        });
        ok(row.en === 'staging' && row.enF === '17px/650', 'English 17/650', row);
        ok(row.es === 'estadificación' && row.esF === '17px/550' && row.esC === hex(row.navy), 'Spanish 17/550 navy', row);
        ok(row.defF === '14px' && row.defC === hex(row.soft), 'definition 14 ink-soft', row);

        await page.locator('#doctorDirDetailModal .dp-row').first().locator('.dp-say').nth(1).click();
        await page.locator('#doctorDirDetailModal .dp-row').first().locator('.dp-say').nth(0).click();
        ok(JSON.stringify(await page.evaluate(() => window.__spoken)) === JSON.stringify([['estadificación', 'es-US'], ['staging', 'en-US']]), 'ES and EN read the row aloud', await page.evaluate(() => window.__spoken));

        const bad = await targets(page);
        ok(!bad.length, 'every control is a 44px target that receives its own tap', bad);

        await page.locator('#doctorDirDetailModal .dp-tabs button', { hasText: 'False friends' }).click();
        await pause(page);
        const ff = await page.evaluate(() => ({ on: document.querySelector('#doctorDirDetailModal .dp-tabs [aria-checked="true"]').textContent.trim(),
          rows: [...document.querySelectorAll('#doctorDirDetailModal .dp-row')].map(r => r.className + ':' + r.querySelector('.dp-en').textContent) }));
        ok(/^False friends/.test(ff.on) && ff.rows.length === 1 && /is-ff:constipated/.test(ff.rows[0]), 'False friends tab shows its terms, marked', ff);
        await page.locator('#doctorDirDetailModal .dp-tabs button', { hasText: 'Team terms' }).click();
        await pause(page);
        const team = await page.evaluate(() => ({ rows: document.querySelectorAll('#doctorDirDetailModal .dp-row').length,
          remove: document.querySelectorAll('#doctorDirDetailModal .dp-row .dp-link.is-quiet').length,
          add: !!document.querySelector('#doctorDirDetailModal .dp-wide[onclick^="openDoctorTermModal"]'),
          by: document.querySelector('#doctorDirDetailModal .dp-row-foot').textContent }));
        ok(team.rows === 2 && team.remove === 2 && team.add && /Added by Luis/.test(team.by), 'Team terms tab: hand-added terms, Remove, Add a term', team);
        await page.evaluate(() => { const p = document.getElementById('doctorDirDetailModal'); p.scrollTop = 1e6; document.getElementById('doctorDirDetailOverlay').scrollTop = 1e6; });
        await pause(page);
        await page.screenshot({ path: O + device + '-bottom.png' });
        const end = await page.evaluate(() => {
          const last = [...document.querySelectorAll('#doctorDirDetailModal .dp-say, #doctorDirDetailModal .dp-wide')].pop();
          const r = last.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          const bar = document.querySelector('#doctorDirDetailModal .dp-bar').getBoundingClientRect();
          return { last: last.textContent.trim().slice(0, 30), free: h === last || last.contains(h), barBottom: Math.round(bar.bottom), vh: innerHeight, gap: Math.round(bar.top - r.bottom) };
        });
        ok(end.free && end.gap >= 0, 'scrolled to the end, the last control clears the glass bar', end);
        ok(end.barBottom <= end.vh, 'the glass bar stays on screen', end);

        // Old flat research: one list and the prompt to research again.
        await openDoctor(page, 'dp-flat');
        const flat = await page.evaluate(() => ({ tabs: [...document.querySelectorAll('#doctorDirDetailModal .dp-tabs button')].map(b => b.textContent.trim().replace(/\s+/g, ' ')),
          old: !!document.querySelector('#doctorDirDetailModal .dp-old'), again: [...document.querySelectorAll('#doctorDirDetailModal .dp-wide')].some(b => b.textContent.trim() === 'Research again'),
          pin: document.querySelector('#doctorDirDetailModal .dp-ph img').getAttribute('src') }));
        ok(JSON.stringify(flat.tabs) === JSON.stringify(['Terms 2', 'Team terms 0']) && flat.old && flat.again, 'older flat research: one list, the re-research prompt', flat);
        ok(/cardiology/.test(flat.pin), 'Cardiology gets the heart pin', flat.pin);

        // No research yet.
        await openDoctor(page, 'dp-none');
        const none = await page.evaluate(() => ({ btn: document.querySelector('#doctorDirDetailModal .dp-navy-btn')?.textContent,
          on: document.querySelector('#doctorDirDetailModal .dp-tabs [aria-checked="true"]').textContent.trim(),
          tip: document.querySelector('#doctorDirDetailModal .dp-tip').textContent.replace(/\s+/g, ' ').trim(),
          where: document.querySelector('#doctorDirDetailModal .dp-where b').textContent }));
        ok(none.btn === 'Research this doctor' && /^Team terms/.test(none.on), 'no research: the navy tile offers it; team terms open', none);
        ok(/None yet/.test(none.tip) && none.where === 'No specific site', 'empty tip and place read plainly', none);

        // Flashcards: the briefing for this doctor's specialty.
        await openDoctor(page, 'dp-tiered');
        await page.locator('#doctorDirDetailModal .dp-rb', { hasText: 'Flashcards' }).click();
        await pause(page, 700);
        const fc = await page.evaluate(() => ({ cat: activeCategory, doctor: PREP.doctor, dom: PREP.domainId, open: document.getElementById('doctorDirDetailOverlay').classList.contains('show') }));
        ok(fc.cat === 'prep' && fc.doctor === 'Dr. Lori A. Leslie' && fc.dom && !fc.open, 'Flashcards opens the briefing for this doctor', fc);

        // Start appointment with this doctor.
        await go(page, 'doctor-directory');
        await openDoctor(page, 'dp-tiered');
        await page.locator('#doctorDirDetailModal .dp-go').click();
        await pause(page, 700);
        const ap = await page.evaluate(() => ({ cat: activeCategory, doctor: APPT && APPT.doctor, dom: APPT && APPT.domainId }));
        ok(ap.cat === 'appt' && ap.doctor === 'Dr. Lori A. Leslie' && ap.dom, 'Start appointment starts one with this doctor', ap);
        await page.evaluate(() => { APPT = null; try { localStorage.removeItem('ih_appt'); } catch (e) {} });

        // Specialty to glossary domain, for Flashcards and the appointment.
        const doms = await page.evaluate(() => Object.fromEntries(['Cardiology', 'Psychiatry', 'Obstetrics and Gynecology', 'Neonatology', 'Hepatology', 'Lymphoma · Hematology/Oncology', 'Allergy and Immunology']
          .map(sp => [sp, (doctorDomainFor(sp) || {}).name || null])));
        ok(doms['Cardiology'] === 'Heart Failure & Cardiac' && doms['Psychiatry'] === 'Mental Health' && doms['Obstetrics and Gynecology'] === 'OB/GYN'
          && doms['Neonatology'] === 'Pediatrics' && doms['Hepatology'] === 'Gastroenterology' && doms['Lymphoma · Hematology/Oncology'] === 'Oncology'
          && doms['Allergy and Immunology'] === null, 'specialties reach the right glossary domain (none rather than a wrong one)', doms);
        await page.evaluate(() => { const d = DOCTOR_DIRECTORY.find(x => x.id === 'dp-none'); window.__spec = d.specialty; d.specialty = 'Allergy and Immunology'; });
        await openDoctor(page, 'dp-none');
        await page.locator('#doctorDirDetailModal .dp-go').click();
        await pause(page, 600);
        const plain = await page.evaluate(() => ({ cat: activeCategory, doctor: APPT && APPT.doctor, dom: APPT && APPT.domainId, text: document.getElementById('content').innerText.slice(0, 80) }));
        ok(plain.cat === 'appt' && plain.doctor === 'Dr. Barry Love' && !plain.dom, 'a specialty with no domain still starts the appointment', plain);
        await page.evaluate(() => { APPT = null; try { localStorage.removeItem('ih_appt'); } catch (e) {} DOCTOR_DIRECTORY.find(x => x.id === 'dp-none').specialty = window.__spec; });

        // Already in an appointment with this doctor: Start goes back to it, no question.
        let asked = 0; const onDialog = d => { asked++; d.dismiss(); }; page.on('dialog', onDialog);
        await page.evaluate(() => { APPT = { start: Date.now() - 60000, domainId: PREP.domainId, doctor: 'Dr. Lori A. Leslie' }; });
        await go(page, 'doctor-directory');
        await openDoctor(page, 'dp-tiered');
        await page.locator('#doctorDirDetailModal .dp-go').click();
        await pause(page, 600);
        const same = await page.evaluate(() => ({ cat: activeCategory, age: Date.now() - APPT.start }));
        ok(same.cat === 'appt' && same.age >= 60000 && asked === 0, 'Start appointment with the same doctor reopens the running one', { ...same, asked });
        page.off('dialog', onDialog);
        await page.evaluate(() => { APPT = null; try { localStorage.removeItem('ih_appt'); } catch (e) {} });

        // The saved copy of the directory has no research: the page fetches it
        // instead of offering a paid re-research; offline it says so.
        await go(page, 'doctor-directory');
        await seed(page);
        const recovered = await page.evaluate(async () => {
          const i = DOCTOR_DIRECTORY.findIndex(x => x.id === 'dp-tiered');
          const { researchResult, ...rest } = DOCTOR_DIRECTORY[i]; DOCTOR_DIRECTORY[i] = rest;
          DOCTOR_DIR_STATE = 'idle';
          openDoctorDirDetail('dp-tiered');
          await new Promise(r => setTimeout(r, 1000));   // the stand-in answers this collection in 480 ms
          const total = document.querySelector('#doctorDirDetailModal .dp-navy-n').textContent;
          const { researchResult: rr, ...bare } = DOCTOR_DIRECTORY[i]; DOCTOR_DIRECTORY[i] = bare;
          const fetchFn = doctorPageFetch; doctorPageFetch = () => {};
          DOCTOR_DIR_STATE = 'failed';
          openDoctorDirDetail('dp-tiered');
          const offline = { text: document.querySelector('#doctorDirDetailModal .dp-navy p')?.textContent || '', button: !!document.querySelector('#doctorDirDetailModal .dp-navy-btn') };
          doctorPageFetch = fetchFn; DOCTOR_DIR_STATE = 'ok'; DOCTOR_DIRECTORY[i] = { ...bare, researchResult: rr };
          closeDoctorDirDetail();
          return { total, offline };
        });
        ok(recovered.total === '10', 'opened from the saved copy, the page fetches the research', recovered);
        ok(/need a connection/.test(recovered.offline.text) && !recovered.offline.button, 'offline, no "Research this doctor" for a doctor already researched', recovered.offline);

        // Add tip: the doctor's sheet at the notes, and back to the page after.
        await go(page, 'doctor-directory');
        await openDoctor(page, 'dp-tiered');
        await page.locator('#doctorDirDetailModal .dp-rb', { hasText: 'Add tip' }).click();
        await pause(page);
        const tipSheet = await page.evaluate(() => ({ sheet: document.getElementById('doctorDirOverlay').classList.contains('show'),
          focus: document.activeElement && document.activeElement.id, notesFont: getComputedStyle(document.getElementById('fDDNotes')).fontSize }));
        ok(tipSheet.sheet && tipSheet.focus === 'fDDNotes', 'Add tip opens the doctor sheet at the notes', tipSheet);
        if (!desktop) ok(parseFloat(tipSheet.notesFont) >= 16, 'the notes box is 16px or more (no iOS zoom)', tipSheet.notesFont);
        await page.evaluate(() => closeDoctorDirModal());
        await pause(page);
        ok(await page.evaluate(() => document.getElementById('doctorDirDetailOverlay').classList.contains('show') && currentDoctorDetailId === 'dp-tiered'), 'closing the sheet comes back to the doctor page');

        // Back closes the page, and the list is still there.
        await page.evaluate(() => navigateBack());
        await pause(page);
        ok(await page.evaluate(() => !document.getElementById('doctorDirDetailOverlay').classList.contains('show') && activeCategory === 'doctor-directory'), 'Back closes the page onto the list');

        ok(!page.__errors.length, 'no page errors', page.__errors);
      } finally { await ctx.close(); }
    }

    // Dark mode, phone: readable, no white flash cards.
    const { ctx, page } = await boot(browser, { device: 'iphone', init: () => { try { localStorage.setItem('ih_theme', 'dark'); } catch (e) {} } });
    try {
      await go(page, 'doctor-directory');
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await openDoctor(page, 'dp-tiered');
      await page.screenshot({ path: O + 'iphone-dark.png' });
      const dk = await page.evaluate(() => {
        const q = s => getComputedStyle(document.querySelector('#doctorDirDetailModal ' + s));
        return { card: q('.dp-hero').backgroundColor, en: q('.dp-en').color, tip: q('.dp-tip').backgroundColor };
      });
      ok(dk.card !== 'rgb(255, 255, 255)' && dk.en !== 'rgb(21, 28, 44)' && dk.tip !== 'rgb(255, 247, 230)', 'dark mode: cards, text and tip follow the theme', dk);
    } finally { await ctx.close(); }
  } finally {
    await browser.close();
    console.log(`\n${passed} passed, ${failed} failed`);
  }
})();
