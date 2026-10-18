/* The tuck rules' proof (S7b in docs/PLAN.md): every computed style of
   body, the tab bar and the dock (and everything inside them), with the bar
   open and tucked, on Home, Translate, a domain (no current tab, so the
   last tab is the capsule) and Home with a chat badge, on a phone; Home on
   a computer. Writes one JSON file; run it on the old code and the new and
   compare the two files. The name span's class `tabbar-name` (added in
   S7b) is left out of the element keys so old and new line up.

     cd tests
     OUT=/tmp/before.json INDEX=/old/index.html POLISH_DIR=/old node tools/tuck-styles.cjs
     OUT=/tmp/after.json node tools/tuck-styles.cjs
     node tools/tuck-styles.cjs /tmp/before.json /tmp/after.json   compare */
const fs = require('fs');
if (process.argv[3]) {
  const [a, b] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  let diffs = 0, n = 0, els = 0;
  for (const k of Object.keys(a)) {
    if (!b[k]) { console.log('missing in second: ' + k); diffs++; continue; }
    for (const el of Object.keys(b[k])) if (!a[k][el]) { console.log(k + ' new element ' + el); diffs++; }
    for (const el of Object.keys(a[k])) { els++; for (const p of Object.keys(a[k][el])) {
      n++;
      if (!b[k][el] || b[k][el][p] !== a[k][el][p]) { if (diffs++ < 30) console.log(k + ' ' + el + ' ' + p + ': ' + a[k][el][p] + ' -> ' + (b[k][el] || {})[p]); }
    } }
  }
  console.log((diffs ? 'DIFFERENT: ' + diffs : 'IDENTICAL') + ' (' + n + ' values, ' + els + ' elements, ' + Object.keys(a).length + ' states)');
  process.exit(diffs ? 1 : 0);
}
const { chromium, boot, go, SEED } = require('../support/harness.cjs');
const dump = page => page.evaluate(() => {
  const out = {}, els = [document.body];
  for (const s of ['.tabbar', '.dock-smiley'])
    document.querySelectorAll(s).forEach(e => els.push(e, ...e.querySelectorAll('*')));
  const path = e => { let p = ''; for (let n = e; n && n !== document.documentElement; n = n.parentElement) p = n.tagName.toLowerCase() + (typeof n.className === 'string' ? n.className.trim().split(/\s+/).filter(c => c && !/^(is-pressed|tabbar-name)$/.test(c)).map(c => '.' + c).join('') : '') + ':' + [...(n.parentElement ? n.parentElement.children : [])].indexOf(n) + '>' + p; return p; };
  const take = (e, pseudo, key) => { const cs = getComputedStyle(e, pseudo), o = {}; for (const p of cs) o[p] = cs.getPropertyValue(p); out[key] = o; };
  for (const e of els) { const k = path(e); take(e, null, k); take(e, '::before', k + '::before'); take(e, '::after', k + '::after'); }
  out.__state = { mini: document.body.classList.contains('dock-mini'), noCurrent: !!document.querySelector('.tabbar.no-current') };
  return out;
});
(async () => {
  const browser = await chromium.launch(), res = {};
  const domain = SEED[0].id;
  for (const device of ['phone', 'desktop']) {
    const { ctx, page } = await boot(browser, { device: device === 'desktop' ? 'desktop' : 'iphone', reducedMotion: true });
    const screens = device === 'desktop' ? [['home', 'home', false]]
      : [['home', 'home', false], ['translate', 'translate', false], ['domain', domain, false], ['home-badge', 'home', true]];
    for (const [name, cat, badge] of screens) {
      await page.evaluate(b => { window.__realUnread = window.__realUnread || unreadChatCount; window.unreadChatCount = b ? () => 3 : window.__realUnread; }, badge);
      await go(page, cat === 'home' ? domain : 'home', 300);        // a real screen change, so the bar starts open
      await go(page, cat, 700);
      res[device + ' ' + name + ' open'] = await dump(page);
      if (device === 'desktop') continue;
      await page.evaluate(() => dockTuck()); await page.waitForTimeout(600);
      res[device + ' ' + name + ' tucked'] = await dump(page);
      await page.evaluate(() => dockOpen()); await page.waitForTimeout(600);
      res[device + ' ' + name + ' reopened'] = await dump(page);
    }
    if (page.__errors.length) console.log(device + ' page errors: ' + page.__errors.join(' | '));
    await ctx.close();
  }
  await browser.close();
  const file = process.env.OUT || 'tuck-styles.json';
  fs.writeFileSync(file, JSON.stringify(res));
  console.log('wrote ' + file + ': ' + Object.keys(res).length + ' states; mini per state: ' + Object.entries(res).map(([k, v]) => k + '=' + v.__state.mini + (v.__state.noCurrent ? '/nc' : '')).join(', '));
})();
