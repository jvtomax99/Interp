/* The top bar's hospital name (Jose's pick D, 2026-11-03): full on a
   computer, "Hackensack UMC" on a phone, one line, never cut off with
   "...", so the bar is the buttons' height (45px) on Home and inside a
   screen with Back, at 393 and 360 wide. */
const { chromium, boot, go } = require('../support/harness.cjs');
let passed = 0, failed = 0;
function ok(c, m, d) { if (c) { passed++; console.log('  PASS', m); } else { failed++; process.exitCode = 1; console.log('  FAIL', m, d === undefined ? '' : JSON.stringify(d).slice(0, 500)); } }
const read = page => page.evaluate(() => {
  const bar = document.querySelector('.topbar-global').getBoundingClientRect();
  const sub = document.querySelector('.tg-brand-sub'), cs = getComputedStyle(sub);
  return { bar: Math.round(bar.height), text: sub.innerText.trim(), lines: Math.round(sub.getBoundingClientRect().height / parseFloat(cs.lineHeight)),
    cut: sub.scrollWidth > sub.clientWidth + 1 };
});
(async () => {
  const browser = await chromium.launch();
  try {
    for (const device of ['iphone', 'narrow', 'desktop']) {
      console.log('== ' + device);
      const { ctx, page } = await boot(browser, { device });
      try {
        for (const screen of ['home', 'doctor-directory']) {
          if (screen !== 'home') await go(page, screen);
          const s = await read(page);
          if (device === 'desktop') ok(s.text === 'Hackensack University Medical Center' && !s.cut, `${screen}: a computer shows the full name`, s);
          else ok(s.text === 'Hackensack UMC' && s.lines === 1 && !s.cut && s.bar <= 46, `${screen}: "Hackensack UMC" on one line, the bar ${s.bar}px`, s);
        }
        ok(!page.__errors.length, 'no page errors', page.__errors);
      } finally { await ctx.close(); }
    }
  } finally { await browser.close(); }
  console.log(`\n${passed} passed, ${failed} failed`);
})();
