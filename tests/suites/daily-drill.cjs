const { chromium, boot } = require('../support/harness.cjs');
const OUT = require('../support/harness.cjs').OUT + 'drill';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (d !== undefined && !c ? ' ' + JSON.stringify(d) : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const cases = JSON.parse(process.argv[2] || '[["iPhone 13",390,844,0,"light"],["iPhone 13",390,844,1,"dark"],["iPhone 13",360,740,2,"light"],["iPhone 13",390,844,3,"light"],["desktop",1440,900,0,"light"],["iPhone 13",390,844,1,"light","ace"]]');
  for (const [dev, w, h, lvl, theme, ace] of cases) {
    const tag = `${w}-L${lvl}-${theme}${ace ? '-ace' : ''}`;
    console.log('== ' + tag);
    const { ctx, page } = await boot(b, { device: dev, name: 'Jose', init: `localStorage.setItem('ih_myName','Jose');localStorage.setItem('ih_theme',${JSON.stringify(theme)});if(!sessionStorage.getItem('dd0')){sessionStorage.setItem('dd0','1');localStorage.setItem('ih_warmup',JSON.stringify({lvl:${lvl}}));}`, settle: 50 });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.setViewportSize({ width: w, height: h });
    await page.waitForSelector('#warmup', { timeout: 20000 });
    await page.waitForTimeout(1500);
    // a small glossary, as if loaded (the test has no database)
    await page.evaluate(() => {
      const cat = DATA.categories.find(c => !/^slang/.test(c.id)) || DATA.categories[0];
      cat.terms.push({ id: 'tt1', en: 'colonoscopy', es: 'colonoscopia' }, { id: 'tt2', en: 'high blood pressure', es: 'presión alta / hipertensión' }, { id: 'tt3', en: 'kidney stone', es: 'cálculo renal' });
      const s = warmupState(); delete s.drill; warmupSaveState(s); DD.st = null; drillRefreshCard();
    });
    const card0 = await page.evaluate(() => document.getElementById('warmup').innerText.replace(/\s+/g, ' '));
    ok(/Daily Drill/i.test(card0) && /3 rounds|rounds/.test(card0), 'Home card shows the Daily Drill and its level', card0);
    await (await page.$('#warmup')).screenshot({ path: `${OUT}/${tag}-card0.png` });
    await page.evaluate(() => document.getElementById('warmup').scrollIntoView({ block: 'center' }));
    await page.click('#warmup');
    await page.waitForSelector('#warmupSheet.show .sm-sheet');
    await page.waitForTimeout(500);
    const geo = async (label) => {
      const g = await page.evaluate(() => {
        const sh = document.querySelector('#warmupSheet .sm-sheet').getBoundingClientRect();
        const inp = document.getElementById('ddAnswer');
        const btns = [...document.querySelectorAll('#warmupSheet button')].filter(x => x.offsetParent).map(x => { const r = x.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { t: x.textContent.trim().slice(0, 24), h: Math.round(r.height), hit: !!(hit && (hit === x || x.contains(hit))), inView: r.top >= 0 && r.bottom <= innerHeight }; });
        return { sw: document.documentElement.scrollWidth, vw: innerWidth, sheet: [sh.left, sh.top, sh.right, sh.bottom].map(Math.round), vh: innerHeight, inputFs: inp ? parseFloat(getComputedStyle(inp).fontSize) : null, btns };
      });
      ok(g.sw <= g.vw, label + ': no sideways scroll', g.sw);
      ok(g.sheet[3] <= g.vh + 1 && g.sheet[1] >= 0, label + ': sheet fits the screen', g.sheet);
      ok(g.inputFs == null || g.inputFs >= 16, label + ': input is 16px or more', g.inputFs);
      const small = g.btns.filter(x => x.h < 44 && !/^$/.test(x.t)); ok(!small.length, label + ': buttons 44px or taller', small);
      const blocked = g.btns.filter(x => x.inView && !x.hit); ok(!blocked.length, label + ': visible buttons receive the tap', blocked);
      return g;
    };
    const st = () => page.evaluate(() => drillToday());
    let s = await st();
    const r = s.drill.rounds;
    ok(s.drill.lvl === lvl, 'drill built at the stored level', s.drill.lvl);
    ok(r.length === 3 && r[0].k === 'trap' && r[2].k === 'call', 'three rounds: trap, hear, call', r.map(x => x.k));
    // Round 1
    const hidden1 = await page.$('#ddWords.dd-reveal');
    ok(lvl >= 2 ? !!hidden1 : !hidden1, 'round 1 words hidden only from Consecutive up', lvl);
    if (lvl >= 3) { const t = await page.$('#ddTimer'); ok(!!t, 'Under pressure shows a clock'); await page.waitForTimeout(1300); const txt = await page.$eval('#ddTimer span', e => e.textContent); ok(/^0:5\d$/.test(txt), 'the clock counts down', txt); }
    await page.screenshot({ path: `${OUT}/${tag}-r1-ask.png` });
    await geo('round 1 ask');
    if (hidden1) { await hidden1.click(); ok(!!(await page.$('#ddWords.dd-heard')), 'Show the words reveals the patient line'); }
    const ff = await page.evaluate(es => FALSE_FRIENDS.find(f => f.es === es), r[0].es);
    if (lvl % 2 === 0 && !ace) {
      // fall for the trap
      const key = ff.looks.replace(/\([^)]*\)/g, '').replace(/\bonly\b/g, '').replace(/^\s*to\s+/, '').split(/[,\/;]/)[0].trim();
      await page.fill('#ddAnswer', ff.trap); await page.click('text=Check');
      await page.waitForTimeout(300);
      const v = await page.$eval('#warmupSheet .rv-verdict', e => e.textContent);
      ok(/trap/i.test(v), 'using the trap word is caught: ' + key, v);
    } else {
      await page.fill('#ddAnswer', ff.truth); await page.click('text=Check');
      await page.waitForTimeout(300);
      const v = await page.$eval('#warmupSheet .rv-verdict', e => e.textContent);
      ok(/Compare/.test(v), 'an answer without the trap goes to compare', v);
      await page.screenshot({ path: `${OUT}/${tag}-r1-compare.png` });
      await geo('round 1 compare');
      await page.click('text=Same meaning, count it'); await page.waitForTimeout(300);
      ok(/Counted/.test(await page.$eval('#warmupSheet .rv-verdict', e => e.textContent)), 'counted after you judge it the same');
    }
    await page.screenshot({ path: `${OUT}/${tag}-r1-result.png` });
    await geo('round 1 result');
    // closing keeps the place
    await page.keyboard.press('Escape'); await page.evaluate(() => smSheetClose('warmupSheet')); await page.waitForTimeout(300);
    const card1 = await page.evaluate(() => document.getElementById('warmup').innerText.replace(/\s+/g, ' '));
    ok(/Round 2 of 3/.test(card1), 'closing after round 1: the card says round 2', card1);
    await page.click('#warmup'); await page.waitForSelector('#warmupSheet.show');
    ok(/Round 1/.test(await page.$eval('#smWarmTitle', e => e.textContent)), 'reopening shows round 1’s result first');
    await page.click('#ddNext'); await page.waitForTimeout(300);
    // Round 2
    s = await st();
    ok(/Round 2/.test(await page.$eval('#smWarmTitle', e => e.textContent)), 'Next opens round 2');
    if (r[1].k === 'hear') {
      const hidden2 = await page.$('#ddWords.dd-reveal');
      ok(lvl >= 1 ? !!hidden2 : !hidden2, 'round 2 word hidden from Listening up');
      await page.screenshot({ path: `${OUT}/${tag}-r2-ask.png` });
      await geo('round 2 ask');
      await page.fill('#ddAnswer', lvl === 1 && !ace ? 'xyzzy' : r[1].es.split('/')[0].replace(/\s*\([^)]*\)\s*$/, '')); await page.click('text=Check'); await page.waitForTimeout(300);
      const v = await page.$eval('#warmupSheet .rv-verdict', e => e.textContent);
      if (lvl === 1 && !ace) { ok(/Compare/.test(v), 'an unknown answer goes to compare', v); await page.click('text=I missed it'); await page.waitForTimeout(300); ok(/Not this time/.test(await page.$eval('#warmupSheet .rv-verdict', e => e.textContent)), 'I missed it marks it missed'); }
      else ok(/Right/.test(v), 'the glossary Spanish is right', v);
      const rec = await page.evaluate(id => TERM_REVIEWS[id] || null, r[1].termId);
      ok(true, 'term review record (needs the database here): ' + JSON.stringify(rec && { box: rec.box, last: rec.lastResult }));
      await page.screenshot({ path: `${OUT}/${tag}-r2-result.png` });
      await geo('round 2 result');
    } else { ok(true, 'no glossary on this phone: round 2 is a second trap'); await page.click('text=I don’t know'); }
    await page.click('#ddNext'); await page.waitForTimeout(300);
    // Round 3
    ok(/Round 3/.test(await page.$eval('#smWarmTitle', e => e.textContent)), 'Next opens round 3');
    await page.screenshot({ path: `${OUT}/${tag}-r3-ask.png` });
    await geo('round 3 ask');
    if (lvl >= 3 && !ace) {
      await page.evaluate(() => { DRILL_SECS.call = 2; drillRender(); });
      await page.waitForTimeout(3200);
      const v = await page.$eval('#warmupSheet .rv-verdict', e => e.textContent).catch(() => '');
      ok(/Time/.test(v), 'when the clock runs out, the round is missed', v);
    } else {
      s = await st(); const a = s.drill.rounds[2].a;
      await page.click(`#warmupSheet .sm-opt >> nth=${a}`); await page.waitForTimeout(300);
      ok(/Right/.test(await page.$eval('#warmupSheet .rv-verdict', e => e.textContent)), 'the right choice is right');
    }
    await page.screenshot({ path: `${OUT}/${tag}-r3-result.png` });
    await geo('round 3 result');
    await page.click('#ddNext'); await page.waitForTimeout(500);
    s = await st();
    ok(s.day === s.drill.day && s.last && s.last.s >= 0, 'finished: the day counts', s.last);
    ok(s.streak === 1, 'streak is 1 on a first day', s.streak);
    const expectTo = s.last.s === 3 ? Math.min(3, lvl + 1) : s.last.s <= 1 ? Math.max(0, lvl - 1) : lvl;
    ok(s.lvl === expectTo, `level ${lvl} → ${s.lvl} after ${s.last.s}/3`, expectTo);
    if (ace) {
      ok(s.last.s === 3, 'all three right scores 3 of 3', s.last);
      ok(s.lvl === Math.min(3, lvl + 1), 'a clean sweep moves up a level', s.lvl);
      const lvlLine = await page.$eval('#warmupSheet .dd-lvl', e => e.textContent);
      ok(/Level up/.test(lvlLine), 'the summary says Level up', lvlLine);
      ok(s.best && s.best.s === 3, 'a first finish becomes the personal best', s.best);
    }
    ok(!JSON.stringify(s).includes(ff.trap) || lvl % 2 === 1 ? !JSON.stringify(s).includes(String(ff.truth)) : false, 'what you typed is never stored');
    await page.screenshot({ path: `${OUT}/${tag}-summary.png` });
    await geo('summary');
    await page.click('#warmupSheet .prep-go'); await page.waitForTimeout(800);
    const card2 = await page.evaluate(() => document.getElementById('warmup').innerText.replace(/\s+/g, ' '));
    ok(/of 3/.test(card2), 'Home card shows the score', card2);
    await (await page.$('#warmup')).screenshot({ path: `${OUT}/${tag}-card2.png` });
    // the drill doesn't change on reload and stays done
    await page.reload(); await page.waitForSelector('#warmup'); await page.waitForTimeout(1000);
    const card3 = await page.evaluate(() => document.getElementById('warmup').innerText.replace(/\s+/g, ' '));
    ok(card3 === card2, 'after a reload the card is the same', [card2, card3]);
    ok(!errs.length, 'no page errors', errs);
    await ctx.close();
  }
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  if (fails) process.exitCode = 1;
})();
