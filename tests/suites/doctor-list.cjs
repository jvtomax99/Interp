/* The doctor list's arrangement (docs/features/doctor-page.md, "The list"):
   Recent, Sort by Place / Specialty / A-Z (kept per phone), the letter strip,
   group headings as labels, the specialty never broken inside a word, and
   the short region question. Phone first, then computer. */
const { chromium, boot, go } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(condition, message, detail) {
  if (condition) { passed++; console.log('  PASS', message); }
  else { failed++; process.exitCode = 1; console.log('  FAIL', message, detail === undefined ? '' : JSON.stringify(detail).slice(0, 700)); }
}
const pause = (page, ms = 300) => page.waitForTimeout(ms);

const SPECS = ['Cardiology', 'Hematology/Oncology', 'Pediatric Neurology', 'Orthopedic Surgery', 'Gastroenterology', 'OB/GYN', 'Psychiatry', 'Interventional Radiology', 'Basket weaving', ''];
const PLACES = ['Hackensack University Medical Center', 'John Theurer Cancer Center', 'Jersey Shore University Medical Center', ''];
const FIRST = ['Ana', 'Luis', 'Maria', 'David', 'Priya', 'Kevin', 'Rosa', 'James', 'Mei', 'Omar', 'Sofia', 'Daniel', 'Grace', 'Victor', 'Elena', 'Raj', 'Nina', 'Paul', 'Hana', 'Carlos', 'Leah', 'Tom', 'Ivy', 'Ben'];
const LAST = ['Ruiz', 'Patel', 'Kim', 'Garcia', 'Cohen', 'Nguyen', 'Shah', 'Lopez', 'Brown', 'Singh', 'Rossi', 'Chen', 'Diaz', 'Levy', 'Park', 'Morales', 'Khan', 'Reyes', 'Ali', 'Stone', 'Vega', 'Wu', 'Adams', 'Fox'];
const DOCTORS = FIRST.map((f, i) => ({ id: 'dl' + i, name: `Dr. ${f} ${i === 0 ? 'A. ' : ''}${LAST[i]}${i === 0 ? ', MD' : ''}`, specialty: SPECS[i % SPECS.length],
  hospitalLocation: PLACES[i % PLACES.length], locationDetails: '', customTerms: [], source: 'manual' }));
// Two Garcias, so Recent has to tell them apart.
DOCTORS.push({ id: 'dl-twin', name: 'Dr. Zoe Garcia', specialty: 'Cardiology', hospitalLocation: PLACES[0], locationDetails: '', customTerms: [] });

async function load(page, sort, extra) {
  await page.evaluate(([ds, sort, extra]) => {
    DOCTOR_DIRECTORY.length = 0; ds.forEach(d => DOCTOR_DIRECTORY.push(JSON.parse(JSON.stringify(d))));
    DOCTOR_DIR_STATE = 'ok';
    localStorage.removeItem('ih_region');
    if (sort) localStorage.setItem('ih_doctorSort', sort); else localStorage.removeItem('ih_doctorSort');
    localStorage.setItem('ih_recentDoctors', JSON.stringify(extra || []));
    setDoctorRegionView('all');
  }, [DOCTORS, sort, extra]);
  await pause(page, 400);
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'desktop']) {
      console.log('== ' + device);
      const { ctx, page } = await boot(browser, { device });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      page.setDefaultTimeout(7000);
      try {
        await go(page, 'doctor-directory');

        // Default: Place, no Recent until a doctor is opened.
        await load(page, null, []);
        let s = await page.evaluate(() => ({
          on: [...document.querySelectorAll('#content .dl-sort-btn')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed')),
          recent: !!document.querySelector('#content .dl-recent'),
          heads: [...document.querySelectorAll('#content .dl-list .group-head-name')].map(e => e.textContent),
          headBg: getComputedStyle(document.querySelector('#content .dl-list .group-head')).backgroundColor,
          headShadow: getComputedStyle(document.querySelector('#content .dl-list .group-head')).boxShadow,
          fold: document.querySelector('#content .dl-fold')?.textContent,
          oldFold: !!document.querySelector('#content .group-controls'),
          mine: [...document.querySelectorAll('#content .dl-mine button')].map(b => b.textContent),
          bigAsk: !!document.querySelector('#content .rg-ask'),
        }));
        ok(s.on.join() === 'Place:true,Specialty:false,A–Z:false', 'opens sorted by Place', s.on);
        ok(!s.recent, 'no Recent before any doctor is opened');
        ok(s.heads[0] === 'Hackensack University Medical Center' && s.heads.at(-1) === 'No location listed', 'Place groups as before, no place last', s.heads);
        ok(/rgba\(0, 0, 0, 0\)|transparent/.test(s.headBg) && s.headShadow === 'none', 'place headings are labels, not cards', [s.headBg, s.headShadow]);
        ok(s.fold === 'Collapse all' && !s.oldFold, 'Collapse all sits on the Sort row', s);
        ok(s.mine.join() === 'North,South' && !s.bigAsk, 'region asked in one short line', s);

        // Every new control: 44px to hit, and nothing else on top of it.
        const bad = await page.evaluate(() => [...document.querySelectorAll('#content .dl-sort-btn, #content .dl-fold, #content .dl-mine button')].filter(el => {
          const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const own = y => { const h = document.elementFromPoint(cx, y); return h && (h === el || el.contains(h)); };
          return r.height < 30 || !own(cy) || !own(cy - 19) || !own(cy + 19);
        }).map(el => el.textContent));
        ok(!bad.length, 'Sort, Collapse all and the region line are easy to hit', bad);

        // Opening doctors fills Recent, newest first, namesakes told apart.
        await page.evaluate(() => { ['dl3', 'dl-twin', 'dl1'].forEach(id => { openDoctorDirDetail(id); closeDoctorDirDetail(); }); renderContent(); });
        await pause(page);
        const rec = await page.evaluate(() => [...document.querySelectorAll('#content .dl-recent-btn')].map(b => b.textContent.trim()));
        ok(rec.join('|') === 'Dr. Patel|Dr. Z. Garcia|Dr. D. Garcia', 'Recent: newest first, two Garcias told apart', rec);
        await page.click('#content .dl-recent-btn >> nth=1'); await pause(page);
        ok(await page.evaluate(() => document.getElementById('doctorDirDetailOverlay').classList.contains('show') && currentDoctorDetailId === 'dl-twin'), 'a Recent doctor opens their page');
        await page.evaluate(() => closeDoctorDirDetail());

        // Specialty.
        await page.click('#content .dl-sort-btn:has-text("Specialty")'); await pause(page);
        s = await page.evaluate(() => {
          const groups = {};
          document.querySelectorAll('#content .dl-list .group-head').forEach(h => {
            const grid = h.nextElementSibling;
            groups[h.querySelector('.group-head-name').textContent] = grid ? [...grid.querySelectorAll('.dl-name')].map(n => n.textContent) : [];
          });
          return { kept: localStorage.getItem('ih_doctorSort'), groups, names: Object.keys(groups) };
        });
        ok(s.kept === 'specialty', 'the choice is kept on the phone');
        ok(s.groups['Neurology']?.includes('Dr. Maria Kim'), 'Pediatric Neurology files under Neurology', s.groups['Neurology']);
        ok(s.groups['Oncology & Hematology']?.includes('Dr. Luis Patel'), 'Hematology/Oncology files under Oncology & Hematology', s.groups);
        ok(s.groups['Orthopedics & Rehab']?.includes('Dr. David Garcia'), 'Orthopedic Surgery under Orthopedics, not Surgery', s.groups['Orthopedics & Rehab']);
        ok(s.groups['Mental Health'] && s.groups['Radiology'], 'Psychiatry and Radiology get their own groups', s.names);
        ok(s.names.at(-2) === 'Other specialties' && s.names.at(-1) === 'No specialty listed', 'unknown and blank specialties last', s.names);
        await page.evaluate(() => toggleGroup('doctors-spec', encGroup('Cardiology'))); await pause(page);
        ok(await page.evaluate(() => { const h = [...document.querySelectorAll('#content .dl-spec-head')].find(x => x.textContent.includes('Cardiology')); return h.classList.contains('is-collapsed') && !h.nextElementSibling.classList.contains('dl-grid'); }), 'a specialty folds away');
        await page.evaluate(() => toggleGroup('doctors-spec', encGroup('Cardiology')));

        // A-Z by last name, with the letter strip.
        await page.click('#content .dl-sort-btn:has-text("A–Z")'); await pause(page);
        s = await page.evaluate(() => ({
          letters: [...document.querySelectorAll('#content .dl-letter-head')].map(e => e.textContent),
          first: [...document.querySelectorAll('#content .dl-name')].slice(0, 3).map(e => e.textContent),
          strip: [...document.querySelectorAll('.dl-letters button')].map(b => b.textContent).join(''),
          noFold: !document.querySelector('#content .dl-fold'),
        }));
        ok(s.first.join('|') === 'Dr. Ivy Adams|Dr. Hana Ali|Dr. Mei Brown', 'A–Z sorts by last name', s.first);
        ok(s.letters[0] === 'A' && s.strip === s.letters.join(''), 'one heading per letter, the strip matches', s);
        ok(s.noFold, 'no Collapse all in A–Z');
        // Ruiz: "Dr. Ana A. Ruiz, MD" sorts as Ruiz.
        ok(await page.evaluate(() => doctorLastName('Dr. Ana A. Ruiz, MD') === 'Ruiz'), 'title, middle initial and MD ignored');
        await page.click('.dl-letters button[data-l="R"]'); await pause(page);
        const jump = await page.evaluate(() => {
          const h = document.getElementById('dl-letter-R').getBoundingClientRect();
          const bar = document.querySelector('.topbar');
          return { top: Math.round(h.top), bar: bar ? Math.round(bar.getBoundingClientRect().bottom) : 0, scrolled: scrollY > 0 };
        });
        ok(jump.scrolled && jump.top >= jump.bar && jump.top < jump.bar + 80, 'a letter jumps to its heading, just under the top bar', jump);
        await page.evaluate(() => window.scrollTo(0, 0));

        // Searching: no Recent, no strip.
        await page.evaluate(() => { searchQuery = 'garcia'; renderContent(); });
        await pause(page, 500);
        s = await page.evaluate(() => ({ recent: !!document.querySelector('#content .dl-recent'), strip: !!document.querySelector('.dl-letters'), n: document.querySelectorAll('#content .dl-card').length }));
        ok(s.n === 2 && !s.recent && !s.strip, 'a search hides Recent and the letters', s);
        await page.evaluate(() => { searchQuery = ''; renderContent(); });
        await pause(page, 400);

        // The specialty breaks at its slash, never inside a word.
        await page.evaluate(() => { localStorage.setItem('ih_doctorSort', 'place'); renderContent(); }); await pause(page);
        const words = await page.evaluate(() => {
          const el = [...document.querySelectorAll('#content .dl-spec span')].find(e => e.textContent === 'Hematology/Oncology');
          const r = document.createRange(), out = [];
          const nodes = [...el.childNodes].filter(n => n.nodeType === 3);
          nodes.forEach(n => { for (let i = 0; i < n.length; i++) { r.setStart(n, i); r.setEnd(n, i + 1); const b = r.getBoundingClientRect(); out.push([n.data[i], Math.round(b.top)]); } });
          const ycOnc = out.slice(out.findIndex(([c]) => c === 'O')).map(x => x[1]);
          return { split: new Set(ycOnc).size, lines: new Set(out.map(x => x[1])).size };
        });
        ok(words.split === 1, '"Oncology" stays on one line', words);

        // Needs info: no "No floor yet" on cards; a count; the filter.
        await page.evaluate(() => { localStorage.setItem('ih_doctorSort', 'place'); doctorNeedsOnly = false;
          const d = DOCTOR_DIRECTORY.find(x => x.id === 'dl1'); d.locationDetails = '4th fl'; d._n = { terms: 5, traps: 0 };
          renderContent(); });
        await pause(page);
        s = await page.evaluate(() => {
          const want = DOCTOR_DIRECTORY.filter(d => doctorMissing(d).length).length;
          const btn = document.querySelector('#content .dl-need');
          return { noFloorText: document.querySelector('#content').textContent.includes('No floor yet'), btn: btn && btn.textContent, want,
            missPatel: doctorMissing(DOCTOR_DIRECTORY.find(x => x.id === 'dl1')), missBlank: doctorMissing(DOCTOR_DIRECTORY.find(x => x.id === 'dl3')) };
        });
        ok(!s.noFloorText, 'cards no longer say "No floor yet"');
        ok(s.btn === `${s.want} need info` && s.want > 0 && s.want < 25, 'the button counts the doctors missing something', s);
        ok(s.missPatel.length === 0, 'a doctor with a place, floor and terms needs nothing', s.missPatel);
        ok(s.missBlank.join() === 'place,floor,research', 'no place, no floor, no terms: all three listed', s.missBlank);
        await page.click('#content .dl-need'); await pause(page);
        s = await page.evaluate(() => ({ cards: document.querySelectorAll('#content .dl-card').length, miss: document.querySelectorAll('#content .dl-miss').length,
          first: document.querySelector('#content .dl-miss')?.textContent, recent: !!document.querySelector('#content .dl-recent'),
          note: !!document.querySelector('#content .dl-need-note'), btn: document.querySelector('#content .dl-need')?.textContent,
          pressed: document.querySelector('#content .dl-need')?.getAttribute('aria-pressed') }));
        ok(s.cards === s.miss && s.cards > 0 && /^Missing: /.test(s.first), 'filter on: only those doctors, each says what is missing', s);
        ok(!s.recent && s.note && s.btn === 'Show all doctors' && s.pressed === 'true', 'filter on: note, way back, no Recent', s);
        const needHit = await page.evaluate(() => { const el = document.querySelector('#content .dl-need'), r = el.getBoundingClientRect();
          return r.height >= 44 && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el; });
        ok(needHit, 'the button is 44px and nothing covers it');
        await page.click('#content .dl-need'); await pause(page);
        ok(await page.evaluate(() => document.querySelectorAll('#content .dl-card').length === DOCTOR_DIRECTORY.length && !doctorNeedsOnly), 'Show all doctors brings everyone back');

        // Dark mode keeps the chips readable.
        await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark')); await pause(page, 400);
        const dark = await page.evaluate(() => { const b = document.querySelector('#content .dl-sort-btn.is-on'); const cs = getComputedStyle(b); return [cs.color, cs.backgroundColor]; });
        ok(dark[0] !== dark[1] && dark[1] !== 'rgb(37, 46, 109)', 'dark mode: the picked sort is light on dark page', dark);
        await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

        ok(!errors.length, 'no page errors', errors);
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
