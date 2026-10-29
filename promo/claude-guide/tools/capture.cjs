/* The Hub's screens for the Claude video guide: this checkout, booted with the tests' stand-ins
   (tests/support/harness.cjs: Firebase in memory, no real names), at 390x780 and 3x like a phone.
   Never the live site. Run from the repo root:  node promo/claude-guide/tools/capture.cjs */
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const L = require('../../../tests/support/harness.cjs');
const OUT = path.resolve(__dirname, '..', 'assets', 'screens');

async function shot(page, name) {
  const png = path.join(OUT, name + '.png');
  await page.screenshot({ path: png });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '90', path.join(OUT, name + '.webp')]);
  fs.unlinkSync(png); console.log(name, page.__errors.length ? 'ERR ' + page.__errors[0] : 'ok');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await L.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const init = `localStorage.setItem('ih_promoSeen','1');localStorage.setItem('ih_region','north');localStorage.setItem('ih_warmup',JSON.stringify({lvl:0}));localStorage.setItem('ih_myName','Jose');`;
  for (const [name, cat, wait] of [['home', 'home', 2500], ['glossary', 'all', 1500], ['practice', 'practice', 3500]]) {
    const { ctx, page } = await L.boot(browser, { device: 'pwa', settle: 3500, init });
    await L.go(page, cat, wait);
    await shot(page, name); await ctx.close();
  }
  await browser.close();
})();
