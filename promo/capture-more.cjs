// v4 extra screens: Team Chat, 3D Body, Term Review, appointment, practice, false friends
const L = require('/home/user/Interp/tests/support/harness.cjs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const O = process.argv[2];
const which = (process.argv[3] || 'chat,anatomy,review,appt,practice,falsefriends').split(',');
(async () => {
  const b = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const { ctx, page } = await L.boot(b, { device: 'iphone', name: 'Jose', settle: 6000 });
  for (const c of which) {
    await L.go(page, c, c === 'anatomy' ? 9000 : 2000);
    await page.screenshot({ path: `${O}/${c}.png` });
  }
  await ctx.close(); await b.close();
})();
