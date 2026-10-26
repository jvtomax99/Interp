/* Campus, alive (docs/features/practice-dashboard.md, 2026-10-26): the people
   standing and sitting about (two frames each from one picture, the second
   showing now and then), a crane swinging on every building that is not yet
   fully painted (eight frames, there and back) and gone from one that is,
   warm lit windows on the painted floors, and the paint rising: a building
   whose level went up since the phone last drew the campus climbs a tenth at
   a time, then flashes at its top; the next drawing does not replay it. Under
   reduced motion nothing swings or flips and there is no flash. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'campus-alive/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// Ethics at 7 tenths and Terminology fully learned; everything else untouched.
const MASTERY = () => { window.domainMastery = () => { const out = {};
  CCHI_DOMAINS.forEach(d => out[d.id] = { known:0, shaky:0, unseen:10, total:10 });
  out.ethics = { known:7, shaky:0, unseen:3, total:10 }; out.terminology = { known:10, shaky:0, unseen:0, total:10 }; return out; }; };
const redraw = page => page.evaluate(() => { renderContent(); document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' }); });

(async () => {
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    console.log('== ' + device);
    const { page } = await L.boot(b, { device });
    await L.go(page, 'practice', 1800);
    await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' })); await wait(600);

    const rest = await page.evaluate(async () => {
      const w = document.querySelector('#content .cp-world'), R = w.getBoundingClientRect(), q = s => [...w.querySelectorAll(s)];
      const inside = el => { const r = el.getBoundingClientRect(); return r.left >= R.left - 1 && r.right <= R.right + 1 && r.top >= R.top - 1 && r.bottom <= R.bottom + 1 && r.width > 0; };
      const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth); i.onerror = () => r(0); i.src = src; });
      const idle = q('.cp-idle'), cranes = q('.cp-crane');
      return { idle: idle.length, want: CAMPUS_MAP.live.idlers.items.length, twoEach: idle.every(e => e.children.length === 2), idleIn: idle.every(inside),
        idleBg: getComputedStyle(idle[0].firstElementChild).backgroundImage, cranes: cranes.length, eightEach: cranes.every(e => e.children.length === 8),
        craneAnims: campusAnims.filter(a => a.effect && a.effect.target && a.effect.target.parentElement && a.effect.target.parentElement.classList.contains('cp-crane')).length,
        atlases: [await load('./city/idlers.webp'), await load('./city/cranes.webp')], glow: q('.cp-glow').length, saved: localStorage.getItem('ih_campusLv') };
    });
    ok(rest.idle === rest.want && rest.want >= 20 && rest.twoEach && rest.idleIn && /idlers\.webp/.test(rest.idleBg), 'the people about: one sprite each, two frames from idlers.webp, inside the picture', rest);
    ok(rest.cranes === 5 && rest.eightEach && rest.craneAnims === 40, 'nothing painted yet: a crane on all five buildings, eight frames each, every frame on the clock', rest);
    ok(rest.atlases.every(w => w > 0), 'the two pictures behind them load', rest.atlases);
    ok(rest.glow === 0 && rest.saved === JSON.stringify({ e:0, t:0, s:0, n:0, c:0 }), 'no lit windows at 0, and the levels drawn are kept', rest);

    // One crane through its swing: exactly one frame shows at a time, and over the swing every frame shows.
    const swing = await page.evaluate(() => { const fr = [...document.querySelector('#content .cp-crane').children];
      const an = fr.map(f => campusAnims.find(a => a.effect && a.effect.target === f)), T = an[0].effect.getTiming().duration, seen = new Set(), counts = [];
      for (let s = 0; s < 14; s++){ an.forEach(a => { a.pause(); a.currentTime = T * (s + 0.5) / 14; });
        const on = fr.map(f => +getComputedStyle(f).opacity).map((o, k) => o > 0.5 ? k : -1).filter(k => k >= 0); counts.push(on.length); on.forEach(k => seen.add(k)); }
      an.forEach(a => a.play()); return { T, counts, seen: seen.size }; });
    ok(swing.T === 14 * 450 && swing.counts.every(c => c === 1) && swing.seen === 8, 'a crane swings there and back: one frame at a time, all eight in 6.3 s', swing);

    // The people: the second frame shows now and then on its own clock, staggered.
    const flip = await page.evaluate(() => { const i = document.querySelector('#content .cp-idle i:last-child'), cs = getComputedStyle(i);
      return { name: cs.animationName, dur: cs.animationDuration, timing: cs.animationTimingFunction }; });
    ok(flip.name === 'cpTurn' && /^[5-9]s$/.test(flip.dur), 'the people turn or step now and then (their own 5-9 s clock)', flip);

    // Practice moved Ethics from 3 to 7 tenths and finished Terminology since the last drawing: the paint climbs.
    await page.evaluate(m => { new Function(m)(); localStorage.setItem('ih_campusLv', JSON.stringify({ e:3, t:9, s:0, n:0, c:0 })); }, `(${MASTERY})()`);
    await redraw(page); await wait(200);
    const rise = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), q = s => [...w.querySelectorAll(s)];
      const src = el => el.querySelector('img').getAttribute('src');
      const e = q('.cp-paintw').filter(el => /\/e-paint\d+/.test(src(el))), t = q('.cp-paintw').filter(el => /\/t-paint\d+/.test(src(el)));
      return { e: e.map(el => [src(el).match(/paint(\d+)/)[1], el.classList.contains('cp-rise'), el.style.getPropertyValue('--s')]),
        t: t.map(el => [src(el).match(/paint(\d+)/)[1], el.classList.contains('cp-rise')]), sparks: q('.cp-spark').length,
        glow: q('.cp-glow').map(i => i.getAttribute('src')), glowRise: q('.cp-glw').map(el => el.classList.contains('cp-rise')),
        cranes: q('.cp-crane').length, saved: JSON.parse(localStorage.getItem('ih_campusLv')) }; });
    ok(JSON.stringify(rise.e) === JSON.stringify([['3', false, ''], ['4', true, '0'], ['5', true, '1'], ['6', true, '2'], ['7', true, '3']]),
      'Ethics: its old 3 tenths stay, then 4, 5, 6, 7 come in one after another', rise.e);
    ok(JSON.stringify(rise.t) === JSON.stringify([['9', false], ['10', true]]) && rise.sparks === 2, 'Terminology climbs its last tenth; a flash for each building that rose', rise);
    ok(rise.glow.join() === './city/e-glow7.webp,./city/t-glow10.webp' && rise.glowRise.every(Boolean), 'lit windows on the painted floors, coming on after the climb', rise);
    ok(rise.cranes === 4 && rise.saved.e === 7 && rise.saved.t === 10, 'Terminology finished: its crane is gone; the new levels are kept', rise);
    await wait(3200); await page.screenshot({ path: O + device + '-risen.png' });

    // Timing: the steps follow each other, the flash comes after the last.
    const t = await page.evaluate(() => { const w = document.querySelector('#content .cp-world');
      const d = el => parseFloat(getComputedStyle(el).animationDelay);
      return { steps: [...w.querySelectorAll('.cp-rise')].filter(el => /\/e-paint/.test(el.querySelector('img').getAttribute('src'))).map(d), spark: [...w.querySelectorAll('.cp-spark')].map(d) }; });
    ok(t.steps.every((v, i) => i === 0 || v > t.steps[i - 1]) && t.spark.some(v => v > t.steps[t.steps.length - 1]), 'each tenth after the one before, the flash after the last', t);

    // Drawn again with nothing new: no climb, no flash.
    await redraw(page); await wait(200);
    const again = await page.evaluate(() => ({ rise: document.querySelectorAll('#content .cp-world .cp-rise').length, sparks: document.querySelectorAll('#content .cp-spark').length,
      e: [...document.querySelectorAll('#content .cp-paintw img.cp-paint')].map(i => i.getAttribute('src')).filter(s => /\/e-/.test(s)) }));
    ok(again.rise === 0 && again.sparks === 0 && again.e.join() === './city/e-paint7.webp', 'drawn again: the paint simply stands at 7, nothing replays', again);
    if (page.__errors.length) ok(false, 'no page errors', page.__errors);
    await page.context().close();
  }

  // Reduced motion: the people hold their first frame, cranes stand still, no flash; the paint is simply there.
  console.log('== reduced motion');
  const { page } = await L.boot(b, { device: 'iphone', reducedMotion: true });
  await page.evaluate(m => { new Function(m)(); localStorage.setItem('ih_campusLv', JSON.stringify({ e:3, t:9, s:0, n:0, c:0 })); }, `(${MASTERY})()`);
  await L.go(page, 'practice', 1800); await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' })); await wait(400);
  const r = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), q = s => [...w.querySelectorAll(s)];
    return { idleLast: getComputedStyle(q('.cp-idle i:last-child')[0]).opacity, idleAnim: getComputedStyle(q('.cp-idle i:last-child')[0]).animationName,
      craneShown: q('.cp-crane').map(c => [...c.children].map(f => +getComputedStyle(f).opacity).join('')), anims: campusAnims.length,
      spark: q('.cp-spark').map(s => getComputedStyle(s).display), rise: q('.cp-rise').map(el => getComputedStyle(el).animationName), glowAnim: q('.cp-glow').map(i => getComputedStyle(i).animationName) }; });
  ok(r.idleLast === '0' && r.idleAnim === 'none' && r.anims === 0 && r.craneShown.every(s => s === '10000000'), 'the people hold still, each crane shows its first frame', r);
  ok(r.spark.every(d => d === 'none') && r.rise.every(n => n === 'none') && r.glowAnim.every(n => n === 'none'), 'no flash, no climb, no flicker: the paint and windows are simply there', r);
  await b.close();
})();
