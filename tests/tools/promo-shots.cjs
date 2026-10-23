/* Phone screenshots of the promo video's places in the app: Home's Watch bubble (its
   thumbnail) and the User Guide answer (its still), for the review after a new video.
   node tests/tools/promo-shots.cjs  ->  tests/out/promo/ */
const { chromium, boot } = require('../support/harness.cjs');
const O = require('../support/harness.cjs').OUT + 'promo/'; require('fs').mkdirSync(O, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const { page } = await boot(b, { device: 'iphone', name: 'Jose', settle: 3500 });
  await page.screenshot({ path: O + 'home.png' });
  await page.click('.home-promo-btn'); await wait(1200);
  await page.evaluate(() => { const v = document.querySelector('.gd-video video'); if (v) v.pause(); });
  await page.screenshot({ path: O + 'guide-answer.png' });
  console.log(O, page.__errors.length ? page.__errors : 'no errors');
  await b.close();
})();
