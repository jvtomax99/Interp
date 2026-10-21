/* Every element's look, as a fingerprint: for each screen and sheet, phone
   and computer, light and dark, every element's computed style (and its
   ::before and ::after) hashed, with its box. Run on two checkouts and
   compare: a CSS change that should change nothing must come out IDENTICAL.
   Made for phase 1 of docs/split-index.md (the stylesheet moved to app.css);
   Math.random is pinned, so the session's quote and tip match.

     cd tests
     OUT=/tmp/a.json ROOT=/path/before node tools/style-proof.cjs
     OUT=/tmp/b.json ROOT=/path/after  node tools/style-proof.cjs
     node tools/style-proof.cjs /tmp/a.json /tmp/b.json      compare */
const fs = require('fs');
if (process.argv[3]) {
  const [a, b] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  let diffs = 0, n = 0;
  for (const k of Object.keys(a)) {
    if (!b[k]) { console.log('missing in second: ' + k); diffs++; continue; }
    const ka = Object.keys(a[k]), kb = Object.keys(b[k]);
    if (ka.length !== kb.length) { diffs++; console.log(k + ': ' + ka.length + ' elements -> ' + kb.length); }
    for (const el of ka) { n++; if (b[k][el] !== a[k][el] && diffs++ < 40) console.log(k + ' ' + el.slice(-90) + ': ' + a[k][el] + ' -> ' + b[k][el]); }
  }
  console.log((diffs ? 'DIFFERENT: ' + diffs : 'IDENTICAL') + ' (' + n + ' elements, ' + Object.keys(a).length + ' states)');
  process.exit(diffs ? 1 : 0);
}
const { chromium, boot, go } = require('../support/harness.cjs');
const SCREENS = ['home', 'all', 'chat', 'practice', 'review', 'userguide', 'translate', 'doctor-directory', 'doctor-research', 'providers',
  'events', 'updates', 'falsefriends', 'memory', 'ask', 'resources', 'ethics', 'trash', 'team-access', 'appt', 'anatomy'];
const SHEETS = ['openMoreSheet', 'openNameModal', 'openAddDomainModal', 'openAddEventModal', 'openAddProviderModal', 'openAddDoctorDirModal', 'openOutboxSheet', 'openWarmupSheet', 'openRankSheet'];
const dump = page => page.evaluate(() => {
  const h = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
  // sorted: custom properties are listed in the order the sheets declared them
  const st = (e, p) => { const cs = getComputedStyle(e, p), k = []; for (let i = 0; i < cs.length; i++) k.push(cs[i]); return h(k.sort().map(n => n + ':' + cs.getPropertyValue(n)).join(';')); };
  const out = {}, seen = {};
  for (const e of document.querySelectorAll('*')) {
    if (e.closest('head')) continue;
    let p = ''; for (let n = e; n && n !== document.documentElement; n = n.parentElement) p = n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + '>' + p;
    seen[p] = (seen[p] || 0) + 1;
    const r = e.getBoundingClientRect();
    out[p + '~' + seen[p]] = st(e) + ' ' + st(e, '::before') + ' ' + st(e, '::after') + ' ' + [r.x, r.y, r.width, r.height].map(v => v.toFixed(2)).join(',');
  }
  return out;
});
const pin = () => { let s = 42; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; };
(async () => {
  const browser = await chromium.launch(), res = {};
  for (const device of ['iphone', 'desktop']) for (const dark of [false, true]) {
    const { ctx, page } = await boot(browser, { device, dark, reducedMotion: true, init: pin });
    const tag = device + (dark ? ' dark' : ' light');
    for (const s of SCREENS) {
      await go(page, s, 1200).catch(() => {});
      res[tag + ' ' + s] = await dump(page);
    }
    await go(page, 'home', 1200);
    for (const f of SHEETS) {
      const ok = await page.evaluate(f => { try { window[f](); return true; } catch (e) { return false; } }, f);
      await page.waitForTimeout(800);
      if (ok) res[tag + ' ' + f] = await dump(page);
      await page.evaluate(() => { try { closeAllOverlays(); } catch (e) {} });
      await page.waitForTimeout(500);
    }
    process.stderr.write(tag + ': ' + (page.__errors.length ? page.__errors.slice(0, 3).join(' | ') : 'no errors') + '\n');
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(process.env.OUT || 'style-proof.json', JSON.stringify(res));
  console.log(Object.keys(res).length + ' states written to ' + (process.env.OUT || 'style-proof.json'));
})();
