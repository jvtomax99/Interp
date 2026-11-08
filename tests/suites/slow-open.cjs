/* Opening the app on slow Wi-Fi (2026-11-08): past a second (sw.js
   PAGE_WAIT) the saved copy opens, with its own code from the cache (none
   from the server), so the screen isn't white for seconds; a newer version
   never reloads the app in use, only once it is in the background; on a
   fast network the fresh page still wins. Runs tools/slow-open.cjs. */
const { measure } = require('../tools/slow-open.cjs');
(async () => {
  const quiet = [];
  const r = await measure(s => quiet.push(s));
  const by = n => r.find(x => x.label.startsWith(n + '.'));
  let failed = false;
  const check = (ok, what) => { if (!ok) failed = true; console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`); };
  const [first, fast, slow, slowDeploy, back, fastDeploy] = [1, 2, 3, 4, 5, 6].map(by);
  check(first && first.documents === 1 && first.builds[0] === 'bTEST.0001', 'first visit: the page from the network, one document');
  check(fast && fast.code > 0 && fast.builds[0] === 'bTEST.0001', `fast, nothing deployed: the page and its code from the network (${fast && fast.code} code files)`);
  // Before this change Home showed at about 4.2 s here (CPU 4x, 0.8 s + 1.5 Mbps); with it about 1.5 s.
  check(slow && slow.home !== null && slow.home < 3.2, `slow, nothing deployed: Home shows within 3.2 s (${slow && slow.home} s)`);
  check(slow && slow.code === 0, `slow: the saved page runs its saved code, none from the server (${slow && slow.code})`);
  check(slowDeploy && slowDeploy.builds.join() === 'bTEST.0001' && slowDeploy.documents === 1, `slow, after a deploy: the saved version opens, no reload (${slowDeploy && slowDeploy.builds.join()})`);
  check(slowDeploy && slowDeploy.home !== null && slowDeploy.home < 3.2, `slow, after a deploy: Home within 3.2 s (${slowDeploy && slowDeploy.home} s)`);
  check(back && back.documentsBeforeHidden === 0, `the new worker in: no reload while in use (${back && back.documentsBeforeHidden} documents before the background)`);
  check(back && back.reloads === 1 && back.builds.join() === 'bTEST.0002', `then in the background: one reload, and the new version (${back && back.builds.join()})`);
  check(fastDeploy && fastDeploy.builds.join() === 'bTEST.0003' && fastDeploy.documents === 1, `fast, after a deploy: the fresh page wins (${fastDeploy && fastDeploy.builds.join()})`);
  if (failed || process.env.VERBOSE) console.log(quiet.join('\n'));
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
