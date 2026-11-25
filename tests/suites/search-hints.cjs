/* Search hints fit their box on a phone (Jose's pick, 2026-11-25: short
   "two things" wording, the same on a computer). At 393 and 360 wide
   every search box's hint is narrower than the room it has, and a hint
   that ever runs out ends in "..." (text-overflow:ellipsis), never a cut
   letter. Before this, every one of them was cut. */
const { chromium, boot, go } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(c, m, d) { if (c) { passed++; console.log('  PASS', m); } else { failed++; process.exitCode = 1; console.log('  FAIL', m, d === undefined ? '' : JSON.stringify(d).slice(0, 500)); } }
const read = (page, id) => page.evaluate(id => {
  const e = document.getElementById(id); if (!e || !e.offsetWidth) return null;
  const cs = getComputedStyle(e), c = document.createElement('canvas').getContext('2d');
  c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return { hint: e.placeholder, label: e.getAttribute('aria-label'), size: parseFloat(cs.fontSize),
    room: Math.floor(e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)),
    need: Math.ceil(c.measureText(e.placeholder).width), end: cs.textOverflow };
}, id);
const SCREENS = [
  ['all', 'searchInput', 'Search'],
  ['providers', 'searchInput', 'Search providers or places'],
  ['doctor-directory', 'searchInput', 'Search a name or specialty'],
  ['ethics', 'searchInput', 'Search principles'],
  ['directory', 'searchInput', 'Search links…'],
  ['falsefriends', 'ffSearch', 'Search a word or meaning'],
  ['soundalikes', 'saSearch', 'Search a word or meaning'],
  ['userguide', 'guideSearchInput', 'Search or ask Dr. Smiley'],
];
(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'narrow']) {
      console.log('== ' + device);
      const { ctx, page } = await boot(browser, { device });
      try {
        const check = (name, s, want) => ok(s && s.hint === want && s.need <= s.room && s.end === 'ellipsis' && s.size >= 16,
          `${name}: "${s && s.hint}" fits (${s && s.need} of ${s && s.room}px), 16px, would end in "..."`, s);
        for (const [cat, id, want] of SCREENS) {
          await go(page, cat);
          // Sound-Alikes opens on its groups; the search box is on the list.
          if (cat === 'soundalikes') { await page.evaluate(() => saOpenList('all')); await page.waitForTimeout(400); }
          check(cat, await read(page, id), want);
        }
        // A domain: beside "+ Add" only the one word fits; its name is in the label.
        await go(page, 'genetics');
        const d = await read(page, 'searchInput');
        check('a domain', d, 'Search');
        ok(d && /^Search .+/.test(d.label || ''), `a domain: a screen reader still hears the domain's name ("${d && d.label}")`, d);
        const all = (await go(page, 'all'), await read(page, 'searchInput'));
        ok(all && /^Search .+/.test(all.label || ''), `All domains: the label still says what is searched ("${all && all.label}")`, all);
        await go(page, 'home');
        // Home's search pill is a button that opens "search everything": same words, whole.
        const pill = await page.evaluate(() => { const e = document.querySelector('.home-search span'); return e && { text: e.textContent, cut: e.scrollWidth > e.clientWidth + 1 }; });
        ok(pill && pill.text === 'Search terms, people, guides' && !pill.cut, `Home's search pill: "${pill && pill.text}", not cut`, pill);
        await page.evaluate(() => openGlobalSearch()); await page.waitForTimeout(600);
        check('search everything', await read(page, 'gsInput'), 'Search terms, people, guides');
        ok(!page.__errors.length, 'no page errors', page.__errors);
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
