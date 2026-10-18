const L = require('/home/user/Interp/tests/support/harness.cjs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const O = process.argv[2];
(async () => {
  const b = await pw.chromium.launch();
  const { ctx, page } = await L.boot(b, { device: 'iphone', name: 'Jose', settle: 6000 });
  await L.go(page, 'er', 1800);
  await page.screenshot({ path: O + '/domain.png' });
  await L.go(page, 'translate', 1500);
  const inp = page.locator('#content input[type=text], #content textarea').first();
  await inp.fill('heart failure');
  await page.locator('#content button:has-text("Translate")').first().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: O + '/translate.png' });
  await ctx.close(); await b.close();
})();
