/* One title per screen (Jose's pick, 2026-11-25). Every screen has exactly
   one top-level heading (h1), it comes first, and no level is skipped
   under it (h1, then h2, then h3): what a screen reader's heading list
   reads, and the rule the next screen follows. Before this a title was an
   h1 on about 13 screens, an h2 on about 15 and missing on two, and Home
   went from h1 to h3. Pop-up sheets keep their own titles and are not
   opened here. The look did not change: the styles select both tags. */
const { chromium, boot, go } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(c, m, d) { if (c) { passed++; console.log('  PASS', m); } else { failed++; process.exitCode = 1; console.log('  FAIL', m, d === undefined ? '' : JSON.stringify(d).slice(0, 500)); } }
const outline = page => page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
  .filter(e => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getClientRects().length)
  .map(e => ({ level: +e.tagName[1], text: e.textContent.replace(/\s+/g, ' ').trim().slice(0, 30) })));
const SCREENS = ['home', 'all', 'genetics', 'translate', 'falsefriends', 'soundalikes', 'review', 'practice', 'memory',
  'doctor-research', 'doctors', 'doctor-directory', 'directory', 'chat', 'updates', 'events', 'notifications',
  'team-access', 'userguide', 'ask', 'ethics', 'providers', 'trash', 'resources', 'anatomy'];
const STATES = [
  ['a Sound-Alikes group', p => p.evaluate(() => { setCategory('soundalikes'); saOpenList('all'); })],
  ['a quiz', p => p.evaluate(() => { setCategory('practice'); startQuiz(); })],
  ['quiz results', p => p.evaluate(() => { quizAnswers = quizQuestions.map(q => q.a); quizIndex = quizQuestions.length; finishQuiz(); })],
  ['the briefing', p => p.evaluate(() => { PREP.domainId = 'onco'; PREP.doctor = ''; setCategory('prep'); })],
  ['an appointment', p => p.evaluate(() => startAppt())],
];
(async () => {
  const browser = await chromium.launch();
  try {
    const { ctx, page } = await boot(browser, { device: 'iphone' });
    try {
      const check = async name => {
        const o = await outline(page), h1 = o.filter(h => h.level === 1);
        const skip = o.find((h, i) => i && h.level > o[i - 1].level + 1);
        ok(h1.length === 1 && o[0].level === 1 && h1[0].text.length > 0 && !skip,
          `${name}: one title ("${h1[0] && h1[0].text}"), first, no level skipped (${o.map(h => h.level).join('').slice(0, 24)})`, { h1, skip, first: o[0] });
      };
      for (const cat of SCREENS) { await go(page, cat, 700); await check(cat); }
      for (const [name, fn] of STATES) { await fn(page); await page.waitForTimeout(900); await check(name); }
      ok(!page.__errors.length, 'no page errors', page.__errors);
    } finally { await ctx.close(); }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
