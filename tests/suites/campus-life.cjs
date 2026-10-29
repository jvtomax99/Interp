/* Campus life, round 2 (docs/features/practice-dashboard.md): the ambulance
   drives up Atlantic Street to the ER's court and its back doors open on its
   own clock once it has pulled up, and shut before it goes; the lot car on the
   Visitors Parking garage's top deck sits parked, backs out, swaps to its
   second look and heads down the aisle; three people sit on the benches and
   turn their heads now and then; a flock crosses the sky once a minute. Off
   screen everything pauses; under reduced motion the sitters stay (first
   frame), the car, the ambulance (doors and all) and the flock are not drawn. Every moving thing is a Web Animation or a CSS frame flip, so this
   drives the clocks by hand and measures where things are. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'campus-life/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await L.chromium.launch();
  for (const device of ['iphone', 'desktop']) {
    console.log('== ' + device);
    const { ctx, page } = await L.boot(b, { device });
    await L.go(page, 'practice', 1800);
    await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' })); await wait(600);

    const have = await page.evaluate(() => {
      const w = document.querySelector('#content .cp-world'), R = w.getBoundingClientRect();
      const inside = el => { const r = el.getBoundingClientRect(); return r.left >= R.left - 1 && r.right <= R.right + 1 && r.top >= R.top - 1 && r.bottom <= R.bottom + 1 && r.width > 0 && r.height > 0; };
      const q = s => [...w.querySelectorAll(s)];
      return { doors: q('.cp-ambd img').length, doorsIn: q('.cp-ambd').every(inside), lot: q('.cp-lot img').length, lotIn: q('.cp-lot').every(inside),
        sit: q('.cp-sit').length, sitImgs: q('.cp-sit img').length, sitIn: q('.cp-sit').every(inside), sitSeen: q('.cp-sit').every(el => +getComputedStyle(el).opacity === 1),
        birds: q('.cp-birds img').length, birdsIn: q('.cp-birds').every(inside), anims: campusAnims.length,
        srcs: q('.cp-ambd img, .cp-lot img, .cp-sit img, .cp-birds img').map(i => i.getAttribute('src')), loaded: q('.cp-ambd img, .cp-lot img, .cp-sit img, .cp-birds img').every(i => i.complete && i.naturalWidth > 0) };
    });
    ok(have.doors === 2 && have.doorsIn && have.lot === 2 && have.lotIn && have.sit === 3 && have.sitImgs === 6 && have.sitIn && have.birds === 2 && have.birdsIn, 'the ambulance's doors (2 frames), the lot car (2 looks), three sitters (2 frames each) and the flock are in the scene', have);
    ok(have.loaded && have.srcs.every(s => /^\.\/city\/(ambd[01]|lot[01]|sit[0-2]-[01]|birds[01])\.webp$/.test(s)), 'their pictures load from city/', have.srcs);
    ok(have.sitSeen, 'the sitters are drawn at rest (not faded like the movers)', have);

    // The clocks: the doors run on the ambulance's 34 s with its -6 s start; the lot car 46 s; the flock 64 s.
    const clocks = await page.evaluate(() => {
      const of = el => campusAnims.filter(a => a.effect && a.effect.target === el).map(a => { const t = a.effect.getTiming(); return [t.duration, t.delay]; });
      const w = document.querySelector('#content .cp-world');
      return { amb: of(w.querySelector('.cp-amb')), doors: [...w.querySelectorAll('.cp-ambd img')].flatMap(of), lot: of(w.querySelector('.cp-lot')), lotImgs: [...w.querySelectorAll('.cp-lot img')].flatMap(of), birds: of(w.querySelector('.cp-birds')) };
    });
    ok(clocks.amb.length === 1 && clocks.doors.length === 2 && clocks.doors.every(([d, de]) => d === 34000 && de === -6000) && clocks.amb[0][0] === 34000, 'the doors share the ambulance\'s clock (34 s, same start)', clocks);
    ok(clocks.lot.length === 1 && clocks.lot[0][0] === 46000 && clocks.lotImgs.length === 2 && clocks.lotImgs.every(([d]) => d === 46000) && clocks.birds.length === 1 && clocks.birds[0][0] === 64000, 'the lot car runs 46 s with its two looks on the same clock; the flock 64 s', clocks);

    // Drive the clocks to an offset of one run (the clocks start part-way, so the moment is offset * duration + that start):
    // which door frame shows, where the ambulance is, which look the car wears, whether the flock is in the sky.
    const at = (dur, delay, offset) => page.evaluate(([ms]) => {
      campusAnims.forEach(a => { a.pause(); a.currentTime = ms; });
      const w = document.querySelector('#content .cp-world');
      const op = el => +getComputedStyle(el).opacity;
      const doors = [...w.querySelectorAll('.cp-ambd img')].map(op), lot = [...w.querySelectorAll('.cp-lot img')].map(op);
      const amb = w.querySelector('.cp-amb'), lotEl = w.querySelector('.cp-lot'), birds = w.querySelector('.cp-birds');
      const box = el => { const r = el.getBoundingClientRect(), R = w.getBoundingClientRect(); return [+((r.left + r.width / 2 - R.left) / R.width).toFixed(3), +((r.top + r.height / 2 - R.top) / R.height).toFixed(3)]; };
      return { doors, ambOp: op(amb), ambAt: box(amb), lot, lotOp: op(lotEl), lotAt: box(lotEl), birdsOp: op(birds), birdsAt: box(birds) };
    }, [offset * dur + delay]);
    const AMB = [34000, -6000], LOT = [46000, -9000], BIRDS = [64000, -14000];
    const closed = await at(...AMB, 0.18);      // ambulance on its way, doors shut
    ok(closed.doors[0] === 0 && closed.doors[1] === 0 && closed.ambOp === 1, 'ambulance on its way: doors shut', closed);
    const opening = await at(...AMB, 0.375);   // half
    ok(opening.doors[0] === 1 && opening.doors[1] === 0, 'pulled up: the doors half open', opening);
    const open = await at(...AMB, 0.5);
    ok(open.doors[0] === 0 && open.doors[1] === 1 && open.ambOp === 1, 'ambulance holding at the ER: doors open', open);
    const near = Math.hypot(open.ambAt[0] - closed.ambAt[0], open.ambAt[1] - closed.ambAt[1]);
    ok(open.ambAt[1] < closed.ambAt[1] && near > 0.05, 'the ambulance has moved up Atlantic Street between the two moments', { closed: closed.ambAt, open: open.ambAt });
    const gone = await at(...AMB, 0.9);
    ok(gone.doors[0] === 0 && gone.doors[1] === 0 && gone.ambOp === 0, 'after it has gone: no ambulance, no doors', gone);
    await page.evaluate(() => campusAnims.forEach(a => { a.currentTime = 34000 * 0.5 - 6000; }));
    if (device === 'iphone') await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' }));
    await wait(300); await page.screenshot({ path: O + device + '-doors-open.png' });

    const parked = await at(...LOT, 0.2);
    ok(parked.lotOp === 1 && parked.lot[0] === 1 && parked.lot[1] === 0, 'the lot car waits in its spot, parked look', parked);
    const backing = await at(...LOT, 0.40);
    const moved = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    ok(backing.lot[0] === 1 && backing.lot[1] === 0 && moved(backing.lotAt, parked.lotAt) > 0.004, 'it backs out: same look, out of its spot', { parked: parked.lotAt, backing: backing.lotAt });
    const driving = await at(...LOT, 0.58);
    ok(driving.lot[0] === 0 && driving.lot[1] === 1 && driving.lotAt[1] < backing.lotAt[1], 'then its second look, heading down the aisle toward the back of the deck', { backing: backing.lotAt, driving: driving.lotAt });
    const out = await at(...LOT, 0.69);
    ok(out.lotOp === 1 && out.lotAt[1] < driving.lotAt[1], 'and further down the aisle', { driving: driving.lotAt, out: out.lotAt });
    const away = await at(...LOT, 0.85);
    ok(away.lotOp === 0, 'gone for a while before it is back in its spot', away);
    await page.evaluate(() => campusAnims.forEach(a => { a.currentTime = 46000 * 0.40 - 9000; })); await wait(200); await page.screenshot({ path: O + device + '-lot-backing.png' });

    const flock = await at(...BIRDS, 0.22), noFlock = await at(...BIRDS, 0.7);
    ok(flock.birdsOp === 1 && flock.birdsAt[1] < 0.45 && noFlock.birdsOp === 0, 'the flock crosses high in the sky, then the sky is empty for a while', { flock, noFlock });
    const left = await at(...BIRDS, 0.05), right = await at(...BIRDS, 0.4);
    ok(left.birdsAt[0] < right.birdsAt[0] - 0.3, 'it flies left to right', { left: left.birdsAt, right: right.birdsAt });

    // The sitters: the head-turn frame shows briefly on its own clock (a CSS animation), staggered per sitter.
    const turns = await page.evaluate(() => [...document.querySelectorAll('#content .cp-sit')].map(el => { const img = el.querySelector('img:last-child'), cs = getComputedStyle(img); return { name: cs.animationName, dur: cs.animationDuration, delay: cs.animationDelay }; }));
    ok(turns.length === 3 && turns.every(t => t.name === 'cpTurn' && t.dur === '7s') && new Set(turns.map(t => t.delay)).size === 3, 'each sitter turns their head on a 7 s loop, staggered', turns);

    // Off screen: the clocks pause.
    await page.evaluate(() => campusAnims.forEach(a => a.play()));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await wait(700);
    const paused = await page.evaluate(() => ({ away: document.querySelector('#content .cp-card').classList.contains('is-away'), states: [...new Set(campusAnims.map(a => a.playState))], sitPaused: getComputedStyle(document.querySelector('#content .cp-sit img:last-child')).animationPlayState, doorsPaused: [...document.querySelectorAll('#content .cp-ambd img')].map(i => getComputedStyle(i).animationPlayState) }));
    ok(paused.away && paused.states.length === 1 && paused.states[0] === 'paused' && paused.sitPaused === 'paused', 'scrolled away: every clock and the head turns pause', paused);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== reduced motion');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', reducedMotion: true });
    await L.go(page, 'practice', 1500);
    const r = await page.evaluate(() => { const w = document.querySelector('#content .cp-world'); const disp = s => getComputedStyle(w.querySelector(s)).display; const op = s => +getComputedStyle(w.querySelector(s)).opacity;
      return { anims: campusAnims.length, sit: disp('.cp-sit'), sitOp: op('.cp-sit'), sitFrame: [op('.cp-sit img:first-child'), op('.cp-sit img:last-child')], lot: disp('.cp-lot'), birds: disp('.cp-birds'), amb: disp('.cp-amb'), doors: [...w.querySelectorAll('.cp-ambd img')].map(i => +getComputedStyle(i).opacity),
        sitAnim: getComputedStyle(w.querySelector('.cp-sit img:last-child')).animationName }; });
    ok(r.anims === 0 && r.lot === 'none' && r.birds === 'none' && r.amb === 'none', 'reduced motion: no clocks; the lot car, the flock and the ambulance are not drawn', r);
    ok(r.sit === 'block' && r.sitOp === 1 && r.sitFrame[0] === 1 && r.sitFrame[1] === 0 && r.sitAnim === 'none', 'the sitters stay, first frame, no head turns', r);
    ok(r.doors.length === 2 && r.doors.every(o => o === 0), 'the ambulance\'s doors are not drawn either', r);
    await page.evaluate(() => document.querySelector('#content .cp-card').scrollIntoView({ block: 'start' })); await wait(300);
    await page.screenshot({ path: O + 'reduced.png' });
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; });
