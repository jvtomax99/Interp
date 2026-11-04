/* The first open after a deploy (docs/feel-audit.md, phase 1): the app never
   reloads itself on a normal open, with or without a new deploy, and still
   reloads once when the page itself came from the saved copy and is older
   than the worker that just took control. Runs tools/deploy-open.cjs (the
   offline worker allowed, the checkout served by a small local server). */
const { measure } = require('../tools/deploy-open.cjs');
(async () => {
  const quiet = [];
  const r = await measure(s => quiet.push(s));
  const by = l => r.find(x => x.label.startsWith(l));
  let failed = false;
  const check = (ok, what) => { if (!ok) failed = true; console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`); };
  const deploy = by('open 2'), same = by('open 3'), stale = by('open 4'), first = by('open 1');
  check(first && first.documents === 1, `first visit: one document, no reload (${first && first.documents})`);
  check(deploy && deploy.documents === 1 && deploy.reloads === 0, `after a deploy: no reload (${deploy && deploy.documents} documents)`);
  check(deploy && deploy.helloStarts === 1, `after a deploy: the hello plays once (${deploy && deploy.helloStarts})`);
  check(same && same.documents === 1, `nothing deployed: no reload (${same && same.documents})`);
  check(stale && stale.documents === 2 && stale.reloads === 1, `a page older than the worker: reloads once (${stale && stale.documents} documents, ${stale && stale.reloads} reload)`);
  // The stale page may have started its hello before the reload (the reload
  // comes when the worker takes control, 2-3 s in); that is the price of the
  // one reload that must still happen, so its hello count is not checked.
  if (failed || process.env.VERBOSE) console.log(quiet.join('\n'));
})().catch(e => { console.log('FAIL ' + e.message); process.exit(1); });
