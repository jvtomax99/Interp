/* Style frames for the look (Prompt 2): styles.html at 1080x1920, one per chapter per direction.
   Run from the repo root:  node promo/claude-guide/tools/styles.cjs  -> promo/claude-guide/out/ */
const path = require('path'), fs = require('fs'), { chromium } = require('playwright');
const DIR = path.resolve(__dirname, '..'), OUT = path.join(DIR, 'out');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (const d of ['A', 'B']) for (const f of [1, 2, 3, 4]) {
    await p.goto('file://' + path.join(DIR, 'styles.html') + `?dir=${d}&f=${f}`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, `style-${d}${f}.png`) });
  }
  console.log(errs.length ? errs : 'ok'); await b.close();
})();
