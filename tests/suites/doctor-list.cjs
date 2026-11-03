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
          on: document.querySelector('#content .dl-sortmenu select')?.value + ':' + document.querySelector('#content .dl-sortmenu b')?.textContent,
          tabs: [...document.querySelectorAll('#content .rg-filter button')].map(b => b.textContent.trim()),
          sub: document.querySelector('#content .dl-head .sub')?.textContent,
          foldInRow: !!document.querySelector('#content .dl-tools .dl-fold'),
          recent: !!document.querySelector('#content .dl-recent'),
          heads: [...document.querySelectorAll('#content .dl-list .group-head-name')].map(e => e.textContent),
          headBg: getComputedStyle(document.querySelector('#content .dl-list .group-head')).backgroundColor,
          headShadow: getComputedStyle(document.querySelector('#content .dl-list .group-head')).boxShadow,
          fold: document.querySelector('#content .dl-fold')?.textContent,
          oldFold: !!document.querySelector('#content .group-controls'),
          mine: [...document.querySelectorAll('#content .dl-mine button')].map(b => b.textContent),
          bigAsk: !!document.querySelector('#content .rg-ask'),
        }));
        ok(s.on === 'place:Place', 'opens sorted by Place, said in the Sort menu', s.on);
        ok(s.tabs.join() === 'North,South,All' && s.sub === '25 doctors', 'region tabs carry no numbers; the title has the one that is listed', s);
        ok(!s.recent, 'no Recent before any doctor is opened');
        ok(s.heads[0] === 'Hackensack University Medical Center' && s.heads.at(-1) === 'No location listed', 'Place groups as before, no place last', s.heads);
        ok(/rgba\(0, 0, 0, 0\)|transparent/.test(s.headBg) && s.headShadow === 'none', 'place headings are labels, not cards', [s.headBg, s.headShadow]);
        ok(s.fold === 'Collapse all' && s.foldInRow && !s.oldFold, 'Collapse all sits on the one tools row', s);
        ok(s.mine.join() === 'North,South' && !s.bigAsk, 'region asked in one short line', s);

        // Every new control: 44px to hit, and nothing else on top of it.
        const bad = await page.evaluate(() => [...document.querySelectorAll('#content .dl-sortmenu, #content .dl-fold, #content .dl-mine button')].filter(el => {
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
        await page.selectOption('#content .dl-sortmenu select', 'specialty'); await pause(page);
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
        ok(!s.groups['Mental Health'] && s.groups['Other specialties']?.includes('Dr. Rosa Shah') && s.groups['Other specialties']?.includes('Dr. James Lopez'),
          'specialties with 1-2 doctors join Other specialties', s.groups);
        ok(s.names.at(-2) === 'Other specialties' && s.names.at(-1) === 'No specialty listed', 'unknown and blank specialties last', s.names);
        await page.evaluate(() => toggleGroup('doctors-spec', encGroup('Cardiology'))); await pause(page);
        ok(await page.evaluate(() => { const h = [...document.querySelectorAll('#content .dl-spec-head')].find(x => x.textContent.includes('Cardiology')); return h.classList.contains('is-collapsed') && !h.nextElementSibling.classList.contains('dl-grid'); }), 'a specialty folds away');
        await page.evaluate(() => toggleGroup('doctors-spec', encGroup('Cardiology')));

        // A-Z by last name, with the letter strip.
        await page.selectOption('#content .dl-sortmenu select', 'az'); await pause(page);
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
          sub: document.querySelector('#content .dl-head .sub')?.textContent,
          noteLines: (() => { const n = document.querySelector('#content .dl-need-note'); return n ? Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight)) : 0; })(),
          pressed: document.querySelector('#content .dl-need')?.getAttribute('aria-pressed') }));
        ok(s.cards === s.miss && s.cards > 0 && /^Missing: /.test(s.first), 'filter on: only those doctors, each says what is missing', s);
        ok(!s.recent && s.note && s.btn === `Needs info · ${s.cards}` && s.pressed === 'true', 'filter on: a chip with the count and a close mark, a note, no Recent', s);
        ok(s.sub === `${s.cards} need info`, 'filter on: the title says how many need info', s.sub);
        if (device === 'iphone') ok(s.noteLines === 1, 'the note is one line on a phone', s.noteLines);
        const needHit = await page.evaluate(() => { const el = document.querySelector('#content .dl-need'), r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const own = y => { const h = document.elementFromPoint(cx, y); return h && (h === el || el.contains(h)); };
          return own(cy) && own(cy - 21) && own(cy + 21) && getComputedStyle(el).backgroundColor !== 'rgb(37, 46, 109)'; });
        ok(needHit, 'the chip is 44px to hit, nothing covers it, and it is not navy');
        await page.click('#content .dl-need'); await pause(page);
        ok(await page.evaluate(() => document.querySelectorAll('#content .dl-card').length === DOCTOR_DIRECTORY.length && !doctorNeedsOnly), 'Show all doctors brings everyone back');

        // Small places: one "Other places" group, each card naming its place;
        // a lone small group stays open with nothing to fold. All on one row.
        const SMALL = ['Hackensack University Medical Center', 'Hackensack University Medical Center', 'Hackensack University Medical Center',
          '155 Polifly Road', '20 Prospect Ave', '20 Prospect Ave', 'Teaneck office', ''].map((p, i) => ({ id: 'sm' + i, name: 'Dr. Small ' + 'ABCDEFGH'[i],
          specialty: 'Cardiology', hospitalLocation: p, locationDetails: '', region: 'north', customTerms: [] }));
        await load(page, 'place', []);
        await page.evaluate(ds => { DOCTOR_DIRECTORY.length = 0; ds.forEach(d => DOCTOR_DIRECTORY.push(d)); renderContent(); }, SMALL);
        await pause(page);
        s = await page.evaluate(() => {
          const heads = [...document.querySelectorAll('#content .dl-list .group-head')];
          const other = heads.find(h => h.textContent.includes('Other places'));
          const grid = other && other.nextElementSibling;
          const noLoc = heads.find(h => h.textContent.includes('No location listed'));
          const row = document.querySelector('#content .dl-tools'), first = row && [...row.children];
          return { names: heads.map(h => h.querySelector('.group-head-name').textContent),
            places: grid ? [...grid.querySelectorAll('.dl-place')].map(e => e.textContent) : [],
            noLocToggle: noLoc && !!noLoc.querySelector('button.group-toggle'), noLocCards: noLoc && noLoc.nextElementSibling?.classList.contains('dl-grid'),
            oneRow: first && new Set(first.map(c => Math.round(c.getBoundingClientRect().top + c.getBoundingClientRect().height / 2))).size === 1 };
        });
        ok(s.names.join('|') === 'Hackensack University Medical Center|Other places|No location listed', 'places with 1-2 doctors share Other places, before No location listed', s.names);
        ok(s.places.join('|') === '155 Polifly Road|20 Prospect Ave|20 Prospect Ave|Teaneck office', 'each card in Other places names its place', s.places);
        ok(s.noLocToggle === false && s.noLocCards, 'a group of one is open, with nothing to fold', s);
        ok(s.oneRow, 'Needs info and Sort share one row', s);

        // Dark mode keeps the chips readable.
        await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark')); await pause(page, 400);
        const dark = await page.evaluate(() => { const b = document.querySelector('#content .dl-need'); const cs = getComputedStyle(b); return [cs.color, cs.backgroundColor]; });
        ok(dark[0] !== dark[1] && dark[1] !== 'rgb(255, 255, 255)', 'dark mode: the Needs info chip is light on dark', dark);
        await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

        ok(!errors.length, 'no page errors', errors);
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
