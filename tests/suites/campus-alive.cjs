/* Campus, alive (docs/features/practice-dashboard.md, 2026-10-26): the people
   standing and sitting about (two frames each from one picture, the second
   showing now and then), no cranes or other sign of construction (Jose,
   2026-10-26), warm lit windows on the painted floors, and the paint rising: a building
   whose level went up since the phone last drew the campus climbs a tenth at
   a time, then flashes at its top; the next drawing does not replay it. Under
   reduced motion nothing flips and there is no flash. A building finished (100%,
   docs/features/campus-celebration.md) celebrates once per phone: three fireworks after the climb, a ribbon for the
   visit, its badge gold with a star for good; a first visit only draws the gold. */
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
      const idle = q('.cp-idle'), cranes = q('.cp-crane');   // none: no sign of construction
      return { idle: idle.length, want: CAMPUS_MAP.live.idlers.items.length, twoEach: idle.every(e => e.children.length === 2), idleIn: idle.every(inside),
        idleBg: getComputedStyle(idle[0].firstElementChild).backgroundImage, cranes: cranes.length,
        atlases: [await load('./city/idlers.webp')], glow: q('.cp-glow').length, saved: localStorage.getItem('ih_campusLv') };
    });
    ok(rest.idle === rest.want && rest.want >= 12 && rest.twoEach && rest.idleIn && /idlers\.webp/.test(rest.idleBg), 'the people about: one sprite each, two frames from idlers.webp, inside the picture', rest);
    ok(rest.cranes === 0, 'nothing painted yet, and still no crane anywhere: no sign of construction', rest);
    ok(rest.atlases.every(w => w > 0), 'the picture behind them loads', rest.atlases);
    ok(rest.glow === 0 && rest.saved === JSON.stringify({ e:0, t:0, s:0, n:0, c:0 }), 'no lit windows at 0, and the levels drawn are kept', rest);

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
    ok(rise.cranes === 0 && rise.saved.e === 7 && rise.saved.t === 10, 'no cranes after the climb either; the new levels are kept', rise);
    const fin = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), q = s => [...w.querySelectorAll(s)];
      const d = el => parseFloat(getComputedStyle(el).animationDelay), tag = k => w.querySelector(`.cp-tag[data-k="${k}"]`);
      const fires = q('.cp-fire'), spark = q('.cp-spark').filter(x => x.style.getPropertyValue('--s') === '1').map(d);   // Terminology's own flash (it climbed one tenth)
      return { fires: fires.length, sparksEach: fires.map(f => f.children.length), bursts: fires.map(f => d(f.firstElementChild)), lastSpark: Math.max(...spark),
        inside: fires.every(f => { const r = f.getBoundingClientRect(), R = w.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2; return cx >= R.left && cx <= R.right && cy >= R.top && cy <= R.bottom; }),
        ribbon: q('.cp-ribbon').map(r => [r.textContent, d(r)]), tDone: tag('t').classList.contains('is-done'), tStar: tag('t').querySelector('i').textContent, tLabel: tag('t').getAttribute('aria-label'),
        eDone: tag('e').classList.contains('is-done'), eText: tag('e').querySelector('i').textContent, tFocus: tag('t').classList.contains('is-focus'),
        done: JSON.parse(localStorage.getItem('ih_campusDone')) }; });
    ok(fin.fires === 3 && fin.sparksEach.every(n => n === 12) && fin.inside, 'Terminology finished: three fireworks over its roof, twelve sparks each, their hearts inside the picture', fin);
    ok(fin.bursts.every((v, i) => v > fin.lastSpark && (i === 0 || v > fin.bursts[i - 1])), 'the bursts start after its own climb and flash, one after another', fin);
    ok(fin.ribbon.length === 1 && fin.ribbon[0][0] === 'Finished' && fin.ribbon[0][1] > fin.bursts[0], 'a Finished ribbon under its badge, after the first burst', fin.ribbon);
    ok(fin.tDone && fin.tStar === '\u2605' && /finished$/.test(fin.tLabel) && !fin.tFocus && !fin.eDone && fin.eText === '70%', 'its badge is gold with a star (and never the focus badge); Ethics keeps its number', fin);
    ok(JSON.stringify(fin.done) === '{"t":true}', 'the celebration is remembered on this phone', fin.done);
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
    const keep = await page.evaluate(() => ({ fires: document.querySelectorAll('#content .cp-fire').length, ribbon: document.querySelectorAll('#content .cp-ribbon').length,
      tDone: document.querySelector('#content .cp-tag[data-k="t"]').classList.contains('is-done') }));
    ok(keep.fires === 0 && keep.ribbon === 0 && keep.tDone, 'drawn again: no fireworks, no ribbon, the badge still gold', keep);
    // Back under 100% (a question shaky again): the gold comes off and the memory clears; finished again, it celebrates again.
    await page.evaluate(() => { const m = window.domainMastery; window.domainMastery = () => { const o = m(); o.terminology = { known:9, shaky:1, unseen:0, total:10 }; return o; }; });
    await redraw(page); await wait(200);
    const off = await page.evaluate(() => ({ tDone: document.querySelector('#content .cp-tag[data-k="t"]').classList.contains('is-done'), done: localStorage.getItem('ih_campusDone') }));
    await page.evaluate(m => new Function(m)(), `(${MASTERY})()`); await redraw(page); await wait(200);
    const back = await page.evaluate(() => ({ fires: document.querySelectorAll('#content .cp-fire').length, done: localStorage.getItem('ih_campusDone') }));
    ok(!off.tDone && off.done === '{}' && back.fires === 3 && back.done === '{"t":true}', 'under 100% the gold comes off and is forgotten; finished again, it celebrates again', { off, back });
    if (page.__errors.length) ok(false, 'no page errors', page.__errors);
    await page.context().close();
  }

  // Reduced motion: the people hold their first frame, no flash; the paint is simply there.
  console.log('== reduced motion');
  const { page } = await L.boot(b, { device: 'iphone', reducedMotion: true });
  await page.evaluate(m => { new Function(m)(); localStorage.setItem('ih_campusLv', JSON.stringify({ e:3, t:9, s:0, n:0, c:0 })); localStorage.removeItem('ih_campusDone'); }, `(${MASTERY})()`);
  await L.go(page, 'practice', 1800);
  // the screen may draw more than once while it settles: seed again and draw once, as above
  await page.evaluate(() => { localStorage.setItem('ih_campusLv', JSON.stringify({ e:3, t:9, s:0, n:0, c:0 })); localStorage.removeItem('ih_campusDone'); });
  await redraw(page); await wait(400);
  const r = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), q = s => [...w.querySelectorAll(s)];
    return { idleLast: getComputedStyle(q('.cp-idle i:last-child')[0]).opacity, idleAnim: getComputedStyle(q('.cp-idle i:last-child')[0]).animationName,
      anims: campusAnims.length,
      spark: q('.cp-spark').map(s => getComputedStyle(s).display), rise: q('.cp-rise').map(el => getComputedStyle(el).animationName), glowAnim: q('.cp-glow').map(i => getComputedStyle(i).animationName) }; });
  ok(r.idleLast === '0' && r.idleAnim === 'none' && r.anims === 0, 'the people hold still', r);
  ok(r.spark.every(d => d === 'none') && r.rise.every(n => n === 'none') && r.glowAnim.every(n => n === 'none'), 'no flash, no climb, no flicker: the paint and windows are simply there', r);
  const rm = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'), q = s => [...w.querySelectorAll(s)];
    return { fire: q('.cp-fire').map(f => getComputedStyle(f).display), ribbon: q('.cp-ribbon').map(x => [getComputedStyle(x).animationName, getComputedStyle(x).opacity]),
      tDone: w.querySelector('.cp-tag[data-k="t"]').classList.contains('is-done') }; });
  ok(rm.fire.length === 3 && rm.fire.every(d => d === 'none') && rm.ribbon.length === 1 && rm.ribbon[0][0] === 'none' && rm.ribbon[0][1] === '1' && rm.tDone, 'reduced motion: no fireworks, the ribbon and the gold badge simply there', rm);
  await page.context().close();

  // A first visit (no levels drawn on this phone yet) with an area already finished: the gold, no fireworks.
  console.log('== first visit');
  const p2 = (await L.boot(b, { device: 'iphone' })).page;
  await p2.evaluate(m => { new Function(m)(); localStorage.removeItem('ih_campusLv'); localStorage.removeItem('ih_campusDone'); }, `(${MASTERY})()`);
  await L.go(p2, 'practice', 1800); await wait(300);
  const first = await p2.evaluate(() => ({ fires: document.querySelectorAll('#content .cp-fire').length, ribbon: document.querySelectorAll('#content .cp-ribbon').length,
    tDone: document.querySelector('#content .cp-tag[data-k="t"]').classList.contains('is-done'), done: localStorage.getItem('ih_campusDone') }));
  ok(first.fires === 0 && first.ribbon === 0 && first.tDone && first.done === '{"t":true}', 'a first visit draws a finished building gold, with no fireworks, and remembers it', first);
  if (p2.__errors.length) ok(false, 'no page errors', p2.__errors);

  // Tap a person for a word (docs/features/campus-tap-person.md): one 44 px spot per group of people, under the buildings' tap
  // boxes; one group holds the word (three dots); the card asks the English, Show gives the Spanish, Got it writes a Term
  // Review record and the next word waits with another group. The streak is never touched.
  console.log('== tap a person');
  const p3 = (await L.boot(b, { device: 'iphone' })).page;
  await L.go(p3, 'practice', 1800);
  await p3.evaluate(() => { localStorage.removeItem('ih_campusWord'); localStorage.removeItem('ih_campusTalked'); renderContent(); document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' }); }); await wait(500);
  const spots = await p3.evaluate(() => {
    const w = document.querySelector('#content .cp-world'), R = w.getBoundingClientRect(), P = campusPos(+w.dataset.top || 0), G = campusFolkGroups();
    const list = [...w.querySelectorAll('.cp-folk')].map(b => { const r = b.getBoundingClientRect(), g = G[+b.dataset.g], [px, py] = P.pt(g.x, g.y);
      const cx = R.left + parseFloat(px)/100*R.width, cy = R.top + parseFloat(py)/100*R.height, hit = (dx, dy) => { const h = document.elementFromPoint(cx + dx, cy + dy); return h ? h.className.split(' ')[0] + (h.dataset.k ? ':' + h.dataset.k : '') : null; };
      return { g: +b.dataset.g, where: g.where, w: r.width, h: r.height, off: Math.hypot(r.left + r.width/2 - cx, r.top + r.height/2 - cy), centre: hit(0, 0), below: hit(0, 14), above: hit(0, -18), word: b.classList.contains('is-word') }; });
    return { list, dots: w.querySelectorAll('.cp-folk.is-word').length, anim: getComputedStyle(w.querySelector('.cp-folk.is-word .cp-folk-say i')).animationName, say: document.querySelector('#content .cp-say p').textContent, groups: G.length };
  });
  ok(spots.groups === 5 && spots.list.length === 5 && spots.list.every(s => s.w >= 44 && s.h >= 44 && s.off < 1), 'five groups of people, a spot of at least 44 px centred on each', spots);
  const bench = spots.list.find(s => s.where === 'at the bench'), plaza = spots.list.find(s => s.where === 'on the plaza');
  ok(bench && bench.centre === 'cp-folk' && bench.below === 'cp-folk' && bench.above === 'cp-bld:s', 'the bench: the ground around the people is theirs, the wall above is still Oncology', bench);
  ok(plaza && plaza.centre === 'cp-folk' && plaza.above === 'cp-bld:c', 'the plaza: the same with Encounter', plaza);
  ok(spots.dots === 1 && spots.anim === 'cpDots' && /have a word for you\. Tap them\./.test(spots.say), 'one group holds the word, three moving dots over it, and Dr. Smiley points it out', spots);
  const wordG = spots.list.find(s => s.word).g;
  await p3.evaluate(i => campusFolkTap(i), wordG); await wait(400);
  const ask = await p3.evaluate(() => ({ card: document.querySelector('#content .cp-pick').innerText, sel: document.querySelectorAll('#content .cp-folk.is-sel').length, foot: document.querySelector('#content .cp-foot').classList.contains('has-sel'),
    es: !!document.querySelector('#content .cp-word-es'), word: JSON.parse(localStorage.getItem('ih_campusWord')), en: document.querySelector('#content .cp-word').textContent }));
  ok(/asks?:/.test(ask.card) && /Show/.test(ask.card) && /New to you|Due|Missed|Quick check/.test(ask.card) && !ask.es && ask.sel === 1 && ask.foot && ask.word.id, 'the tap asks the English with its reason, the Spanish hidden, the group ringed', ask);
  const en = await p3.evaluate(id => { const t = allTermsFlat().find(t => t.id === id); return t && t.en; }, ask.word.id);
  ok(en === ask.en, 'the word asked is the one held in ih_campusWord', { en, asked: ask.en });
  await p3.evaluate(() => campusFolkShow()); await wait(200);
  const shown = await p3.evaluate(() => ({ es: document.querySelector('#content .cp-word-es') && document.querySelector('#content .cp-word-es').textContent, card: document.querySelector('#content .cp-pick').innerText }));
  ok(shown.es && /Got it/.test(shown.card) && /Missed it/.test(shown.card), 'Show gives the Spanish and the two answers', shown);
  const before = await p3.evaluate(() => localStorage.getItem('ih_practice_streak_v1'));
  await p3.evaluate(() => campusFolkAnswer(true)); await wait(600);
  const saved = await p3.evaluate(id => { const d = window.__DB['term-reviews']['jose__' + id]; const w = JSON.parse(localStorage.getItem('ih_campusWord'));
    return { rec: d, card: document.querySelector('#content .cp-pick').innerText, talked: localStorage.getItem('ih_campusTalked'), w, dots: [...document.querySelectorAll('#content .cp-folk.is-word')].map(b => +b.dataset.g), streak: localStorage.getItem('ih_practice_streak_v1'), mem: TERM_REVIEWS[id] && TERM_REVIEWS[id].lastResult }; }, ask.word.id);
  ok(saved.rec && saved.rec.lastResult === 'ok' && saved.rec.box === 1 && saved.mem === 'ok' && /Saved to your Term Review record/.test(saved.card), 'Got it writes the Term Review record (box 1, ok) and says so', saved);
  ok(saved.w.last === ask.word.id && !saved.w.id && saved.dots.length === 1 && saved.dots[0] !== wordG && saved.w.g === saved.dots[0] && saved.talked === '1', 'the next word waits with another group, the dots moved there, Dr. Smiley need not point again', saved);
  ok(saved.streak === before, 'the CoreCHI streak and today\'s count are untouched', { before, after: saved.streak });
  await wait(1500);
  const closed = await p3.evaluate(() => ({ card: document.querySelector('#content .cp-pick').innerText, foot: document.querySelector('#content .cp-foot').classList.contains('has-sel'), sel: document.querySelectorAll('#content .cp-folk.is-sel').length }));
  ok(!closed.card && !closed.foot && !closed.sel, 'the card closes itself after a saved answer', closed);
  // Missed it: box 0, a miss; a tap on a building while the card is open hands the card to the building
  await p3.evaluate(() => campusFolkTap(0)); await wait(300); await p3.evaluate(() => campusFolkShow()); await wait(100);
  const id2 = await p3.evaluate(() => JSON.parse(localStorage.getItem('ih_campusWord')).id);
  await p3.evaluate(() => campusFolkAnswer(false)); await wait(600);
  const missed = await p3.evaluate(id => ({ rec: window.__DB['term-reviews']['jose__' + id], card: document.querySelector('#content .cp-pick').innerText }), id2);
  ok(missed.rec && missed.rec.lastResult === 'miss' && missed.rec.box === 0 && /Missed it, noted/.test(missed.card), 'Missed it writes a miss (box 0)', missed);
  ok(id2 !== ask.word.id, 'never the same word twice in a row', { id2, first: ask.word.id });
  await wait(1500);
  await p3.evaluate(() => campusFolkTap(1)); await wait(300);
  await p3.evaluate(() => campusPick('t')); await wait(300);
  const handed = await p3.evaluate(() => ({ folk: CAMPUS_PICK.folk, key: CAMPUS_PICK.key, card: document.querySelector('#content .cp-pick').innerText, sel: document.querySelectorAll('#content .cp-folk.is-sel').length }));
  ok(!handed.folk && handed.key === 't' && /Terminology/.test(handed.card) && !handed.sel, 'a building tapped while a word is open takes the card over', handed);
  await p3.evaluate(() => campusPick(null));
  if (p3.__errors.length) ok(false, 'no page errors', p3.__errors);

  // No name set: the tap asks for the name first and saves nothing. Reduced motion: the dots stand still.
  const p4 = (await L.boot(b, { device: 'iphone', fresh: true, reducedMotion: true })).page;
  await p4.evaluate(() => { localStorage.setItem('ih_onboarded', '1'); });
  await L.go(p4, 'practice', 1800);
  const noName = await p4.evaluate(() => { const n = document.querySelectorAll('#content .cp-folk').length; campusFolkTap(0);
    return { n, name: whoAmI(), modal: !!document.querySelector('.modal.show, .modal-backdrop.show, [class*=modal].show, #nameModal.show, .name-modal.show') || document.body.innerText.includes('name'), folk: CAMPUS_PICK.folk, card: document.querySelector('#content .cp-pick').innerText,
      anim: getComputedStyle(document.querySelector('#content .cp-folk.is-word .cp-folk-say i')).animationName }; });
  ok(noName.n === 5 && !noName.name && !noName.folk && !noName.card, 'no name yet: the tap opens nothing until a name is set', noName);
  ok(noName.anim === 'none', 'reduced motion: the dots stand still', noName);
  if (p4.__errors.length) ok(false, 'no page errors', p4.__errors);

  // Friendly weather (docs/features/campus-weather.md): the sun from 3 days at the left of the sky, a rainbow from 7 over the
  // board behind the town, both sliding with the sky; the first drawing fades them in, later ones just draw; a streak that
  // ends takes them off and forgets them; never anything for a missed day.
  console.log('== weather');
  const p5 = (await L.boot(b, { device: 'iphone' })).page;
  await L.go(p5, 'practice', 1800);
  const sky = (page, days) => page.evaluate(d => { localStorage.setItem('ih_practice_streak_v1', JSON.stringify({ days: d, last: '', answered: 0, on: '' })); renderContent();
    const w = document.querySelector('#content .cp-world'), R = w.getBoundingClientRect(), kids = [...w.children], box = s => { const e = w.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left - R.left, t: r.top - R.top, w: r.width, h: r.height, b: r.bottom - R.top }; };
    const sun = box('.cp-sun'), bow = box('.cp-bow'), n = box('.cp-tag[data-k="n"]'), ring = document.querySelector('#content .ready-ring').getBoundingClientRect();
    const towerTop = CAMPUS_MAP.b.t.box[1] / CAMPUS_MAP.h * R.height;   // the highest building's top, where the sky ends
    const idx = s => kids.findIndex(k => k.matches(s));
    return { days: d, sun, bow, n, towerTop, ringBottom: ring.bottom - R.top, order: { sky: idx('.cp-d-sky'), sun: idx('.cp-sun'), bow: idx('.cp-bow'), far: idx('.cp-d-far') },
      sunNew: !!w.querySelector('.cp-sun.is-new'), bowNew: !!w.querySelector('.cp-bow.is-new'), rays: sun ? getComputedStyle(w.querySelector('.cp-sun i')).animationName : null,
      fade: sun ? getComputedStyle(w.querySelector('.cp-sun')).animationName : null, bowFade: bow ? getComputedStyle(w.querySelector('.cp-bow')).animationName : null,
      slide: sun ? getComputedStyle(w.querySelector('.cp-sun')).translate : null, skySlide: getComputedStyle(w.querySelector('.cp-d-sky')).translate, saved: localStorage.getItem('ih_campusSky'), W: R.width }; }, days);
  const d0 = await sky(p5, 0), d2 = await sky(p5, 2);
  ok(!d0.sun && !d0.bow && !d0.saved && !d2.sun && !d2.bow && !d2.saved, 'no streak, or two days: plain daylight, nothing remembered', { d0, d2 });
  const d3 = await sky(p5, 3);
  ok(d3.sun && !d3.bow && d3.sun.t >= 0 && d3.sun.b <= d3.towerTop + 2 && d3.sun.l + d3.sun.w / 2 < d3.W * 0.3 && d3.sun.b <= d3.n.t, '3 days: the sun, in the sky at the left, above the buildings and the US Systems badge, no rainbow', d3);
  ok(d3.order.sky < d3.order.sun && d3.order.sun < d3.order.far && d3.rays === 'cpRays' && d3.sunNew && d3.fade === 'cpSkyIn' && d3.saved === '{"sun":true,"bow":false}', 'behind the town, its rays turning, faded in the first time and remembered', d3);
  const d3b = await sky(p5, 3);
  ok(d3b.sun && !d3b.sunNew && d3b.fade === 'none', 'drawn again: the sun is simply there', d3b);
  const d7 = await sky(p5, 7);
  ok(d7.sun && d7.bow && d7.bow.t < d7.towerTop && d7.bow.t >= -2 && d7.bow.w > d7.W * 0.85 && d7.order.sky < d7.order.bow && d7.order.bow < d7.order.far && d7.bowNew && d7.bowFade === 'cpBowIn' && !d7.sunNew && d7.saved === '{"sun":true,"bow":true}', '7 days: the rainbow over the board, behind the town, its top in the sky, faded in; the sun stays', d7);
  ok(d7.slide === d7.skySlide, 'the sun slides with the sky', { slide: d7.slide, sky: d7.skySlide });
  const bands = await p5.evaluate(() => (getComputedStyle(document.querySelector('#content .cp-bow')).backgroundImage.match(/rgb\(/g) || []).length);
  ok(bands >= 6, 'six bands', bands);
  const d0b = await sky(p5, 0);
  ok(!d0b.sun && !d0b.bow && !d0b.saved, 'the streak over: both gone, forgotten', d0b);
  if (p5.__errors.length) ok(false, 'no page errors', p5.__errors);
  const p6 = (await L.boot(b, { device: 'iphone', reducedMotion: true })).page;
  await L.go(p6, 'practice', 1800);
  const rmw = await sky(p6, 7);
  ok(rmw.sun && rmw.bow && rmw.rays === 'none' && rmw.fade === 'none' && rmw.bowFade === 'none', 'reduced motion: the sun and rainbow simply there, no rays turning, no fade', rmw);
  if (p6.__errors.length) ok(false, 'no page errors', p6.__errors);
  await b.close();
})();
