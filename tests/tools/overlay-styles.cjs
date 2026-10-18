/* The overlay rules' proof (S7a in docs/PLAN.md): every computed style of
   the elements those rules touch (body, the tab bar, the dock, the appt
   pill, the rider, and everything inside them), with no overlay open and
   with each kind open (a sheet, global search, the domain menu, a Home
   section), on a phone and a computer, and on Home and a domain with the
   tab bar tucked (S7b: its name span's class). Writes one JSON file; run it on the
   old code and the new and compare the two files.

     cd tests
     OUT=/tmp/before.json INDEX=/path/old.html node tools/overlay-styles.cjs
     OUT=/tmp/after.json node tools/overlay-styles.cjs
     node tools/overlay-styles.cjs /tmp/before.json /tmp/after.json   compare */
const fs = require('fs');
if (process.argv[3]) {
  const [a, b] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
  let diffs = 0, n = 0;
  for (const k of Object.keys(a)) {
    if (!b[k]) { console.log('missing in second: ' + k); diffs++; continue; }
    for (const el of Object.keys(a[k])) for (const p of Object.keys(a[k][el])) {
      n++;
      if (!b[k][el] || b[k][el][p] !== a[k][el][p]) { if (diffs++ < 30) console.log(k + ' ' + el + ' ' + p + ': ' + a[k][el][p] + ' -> ' + (b[k][el] || {})[p]); }
    }
  }
  console.log((diffs ? 'DIFFERENT: ' + diffs : 'IDENTICAL') + ' (' + n + ' values, ' + Object.keys(a).length + ' states)');
  process.exit(diffs ? 1 : 0);
}
const { chromium, boot, go, SEED } = require('../support/harness.cjs');
const dump = page => page.evaluate(() => {
  const out = {}, els = [document.body];
  for (const s of ['.tabbar', '.dock-smiley', '.appt-pill', '.smiley-rider'])
    document.querySelectorAll(s).forEach(e => els.push(e, ...e.querySelectorAll('*')));
  const path = e => { let p = ''; for (let n = e; n && n !== document.documentElement; n = n.parentElement) p = n.tagName.toLowerCase() + (typeof n.className === 'string' ? n.className.trim().split(/\s+/).filter(c => c && !/^(is-pressed|ov-open|gs-open|dm-open|tabbar-name)$/.test(c)).map(c => '.' + c).join('') : '') + ':' + [...(n.parentElement ? n.parentElement.children : [])].indexOf(n) + '>' + p; return p; };
  for (const e of els) { const cs = getComputedStyle(e), o = {}; for (const p of cs) o[p] = cs.getPropertyValue(p); out[path(e)] = o; }
  out.__open = { which: [...document.querySelectorAll('.overlay.show, .gs-overlay.show, .dm-overlay.show')].map(e => e.id || e.className).join(',') };
  return out;
});
(async () => {
  const browser = await chromium.launch(), res = {};
  const domain = SEED[0].id;
  for (const device of ['phone', 'desktop']) {
    const { ctx, page } = await boot(browser, { device: device === 'desktop' ? 'desktop' : 'iphone', reducedMotion: true });
    const states = [
      ['home', async () => {}],
      ['more', async () => { await page.evaluate(() => openMoreSheet()); }],
      ['search', async () => { await page.evaluate(() => openGlobalSearch()); }],
      ['section', async () => { await page.evaluate(() => { const k = document.querySelector('[data-section-key]'); openHomeSection(k ? k.dataset.sectionKey : 'tools'); }); }],
      ['domain', async () => { await go(page, domain); }],
      ['domain-menu', async () => { await go(page, domain); await page.evaluate(() => openDomainMenu()); }],
    ];
    for (const [name, open] of states) {
      await go(page, 'home', 600);
      await open(); await page.waitForTimeout(700);
      res[device + ' ' + name + ' open'] = await dump(page);
      await page.evaluate(() => { try { closeDomainMenu(true); } catch (e) {} try { closeGlobalSearch(); } catch (e) {} closeAllOverlays(); });
      await page.waitForTimeout(700);
      res[device + ' ' + name + ' closed'] = await dump(page);
      if (name === 'home' || name === 'domain') {
        if (name === 'domain') await go(page, domain);
        await page.evaluate(() => { dockIdleRestart(); dockTuck(); }); await page.waitForTimeout(700);
        res[device + ' ' + name + ' tucked'] = await dump(page);
        await page.evaluate(() => { dockOpen(); dockIdleRestart(); }); await page.waitForTimeout(400);
      }
    }
    if (page.__errors.length) console.log(device + ' page errors: ' + page.__errors.join(' | '));
    await ctx.close();
  }
  await browser.close();
  const file = process.env.OUT || 'overlay-styles.json';
  fs.writeFileSync(file, JSON.stringify(res));
  console.log('wrote ' + file + ': ' + Object.keys(res).length + ' states');
})();
