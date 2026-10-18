// v4: Team Chat with a few made-up messages (no patient details), region already picked
const L = require('/home/user/Interp/tests/support/harness.cjs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const O = process.argv[2];
(async () => {
  const b = await pw.chromium.launch();
  const { ctx, page } = await L.boot(b, { device: 'iphone', name: 'Jose', settle: 6000 });
  await page.evaluate(() => { try { setMyRegion('north'); } catch (e) {} });
  await L.go(page, 'chat', 1500);
  await page.evaluate(() => {
    const d0 = new Date(); d0.setHours(10, 15, 0, 0); const now = d0.getTime();
    const ts = m => now - m * 60000;
    CHAT_MESSAGES = [
      { id: 'p1', author: 'Ana', text: 'Port flush in Spanish, anyone?', timestamp: ts(14) },
      { id: 'p2', author: 'Luis', text: 'Lavado del port. Added it to the glossary.', timestamp: ts(13) },
      { id: 'p4', author: 'Maria', text: 'ED is busy, two Spanish requests waiting. Who is free?', timestamp: ts(3) },
      { id: 'p5', author: 'Jose', text: 'On my way.', timestamp: ts(2) },
    ];
    renderChatMessages();
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: O + '/chat.png' });
  await ctx.close(); await b.close();
})();
