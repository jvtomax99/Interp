const L = require('/home/user/Interp/tests/support/harness.cjs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const O = process.argv[2];
(async () => {
  const b = await pw.chromium.launch();
  const { ctx, page } = await L.boot(b, { device: 'iphone', name: 'Jose', settle: 6500 });
  await page.screenshot({ path: O + '/home.png' });
  await page.evaluate(() => typeof CATEGORIES !== 'undefined' ? 0 : 0);
  const cats = await page.evaluate(() => Object.keys(window.categories || window.CATS || {}).slice(0, 40));
  console.log('cats', JSON.stringify(cats));
  await L.go(page, 'cardiology', 1500);
  await page.screenshot({ path: O + '/domain.png' });
  await page.screenshot({ path: O + '/domain-full.png', fullPage: true });
  await L.go(page, 'translate', 1500);
  await page.screenshot({ path: O + '/translate.png' });
  await ctx.close(); await b.close();
})();
