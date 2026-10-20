// Dr. Smiley's squash and stretch (E3, drSquashKeys in index.html): only the
// cheer's and the greet's spring, Lively only, on his picture (never on what
// holds him), at most 4% of his height, his area kept, back to his drawn
// shape at the end or when interrupted. Width is 1/sqrt(height) (volume kept).
const L = require('../support/harness.cjs');
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if(!c) process.exitCode = 1; };
// In the page: play a sequence on an svg and sample its scale (and its
// holder's) every frame. Returns { sy: [min, max], area: worst |sx*sqrt(sy)-1|, end, headUneven }.
const SAMPLE = () => {
  const scaleOf = el => { const m = getComputedStyle(el).transform; if(!m || m === 'none') return [1, 1];
    const v = new DOMMatrix(m); return [Math.hypot(v.a, v.b), Math.hypot(v.c, v.d)]; };
  window.__squash = (svg, head, name, o = {}) => new Promise(res => {
    const a = drAnim(svg, { head });
    if(a.idle && a.idle.opts) a.idle.opts.canPlay = () => false;
    a.stopRun(false); a.set('rest');
    drPerfSeed(7);
    const played = a.play(name, { priority: DR_P.DIRECT });
    drPerfSeed(null);
    const t0 = performance.now(); let lo = 1, hi = 1, area = 0, uneven = 0, cut = false;
    const tick = () => {
      const t = performance.now() - t0, [sx, sy] = scaleOf(svg), [hx, hy] = scaleOf(head);
      lo = Math.min(lo, sy); hi = Math.max(hi, sy); area = Math.max(area, Math.abs(sx * Math.sqrt(sy) - 1));
      uneven = Math.max(uneven, Math.abs(hx - hy));
      if(o.cutAt && !cut && t > o.cutAt){ cut = true; a.play('okay', { priority: DR_P.DIRECT + 1 }); }
      if(t < (o.ms || 3200)) requestAnimationFrame(tick);
      else res({ played, sy: [+lo.toFixed(4), +hi.toFixed(4)], area: +area.toFixed(4), headUneven: +uneven.toFixed(4), end: getComputedStyle(svg).transform });
    };
    tick();
  });
};
(async () => {
  const b = await L.chromium.launch();
  const { ctx, page: P } = await L.boot(b, { device: 'iphone', settle: 6000 });
  await P.evaluate(SAMPLE);
  // The pure rule first.
  const keys = await P.evaluate(() => {
    const k = drSquashKeys([[0, 0, 0], [190, 0, 1.1], [340, 0, -1.8], [600, 0, -1.6], [760, 0, .45], [1100, 0, 0]], DR_SQUASH);
    const sy = k.map(f => +f.transform.match(/,([\d.]+)\)/)[1]);
    return { n: k.length, first: k[0].transform, last: k[k.length - 1].transform, min: Math.min(...sy), max: Math.max(...sy),
             none: drSquashKeys([[0, 0, 0], [300, 1.5, 0], [600, 0, 0]], DR_SQUASH), off: drSquashKeys([[0, 0, 0], [190, 0, 1.1], [340, 0, -1.8]], 0) };
  });
  ok(keys.first === 'scale(1.0000,1.0000)' && keys.last === 'scale(1.0000,1.0000)', 'the shape starts and ends as drawn ' + JSON.stringify([keys.first, keys.last]));
  ok(keys.min < .99 && keys.min >= .96 - 1e-9 && keys.max > 1.01 && keys.max <= 1.04 + 1e-9, 'a crouch squashes and a spring stretches, at most 4% ' + JSON.stringify([keys.min, keys.max]));
  ok(keys.none === null && keys.off === null, 'a lean with no spring, or a strength of 0, adds nothing');
  ok(await P.evaluate(() => DR_FACE_SEQ.cheer.squash === DR_SQUASH && DR_FACE_SEQ.greet.squash === DR_SQUASH && DR_FACE_SEQ.wow.squash === DR_SQUASH && !DR_FACE_SEQ.ack.squash && !DR_FACE_SEQ.think.squash && !DR_FACE_SEQ.wink.squash && !DR_FACE_SEQ.nod.squash),
     'only the cheer (and the wow that leads into it) and the greet ask for it');

  // In the dock (Translate screen).
  await P.evaluate(() => setCategory('translate')); await P.waitForTimeout(2500);
  const run = (n, o) => P.evaluate(([n, o]) => { const s = document.querySelector('.dock-smiley svg.ds-art'), h = document.querySelector('.dock-smiley-bob'); return window.__squash(s, h, n, o); }, [n, o || {}]);
  const cheer = await run('cheer');
  ok(cheer.played && cheer.sy[0] < .99 && cheer.sy[1] > 1.01, 'dock, cheer: he squashes in the crouch and stretches on the spring ' + JSON.stringify(cheer.sy));
  ok(cheer.sy[0] >= .959 && cheer.sy[1] <= 1.041, 'dock, cheer: never more than 4% ' + JSON.stringify(cheer.sy));
  ok(cheer.area < .003, 'his volume stays the same (width 1/sqrt(height)): ' + cheer.area);
  ok(cheer.headUneven < .001, 'what holds him is never stretched: ' + cheer.headUneven);
  ok(cheer.end === 'none', 'back to his drawn shape at the end: ' + cheer.end);
  const greet = await run('greet');
  ok(greet.sy[0] < .995 && greet.sy[1] > 1.005 && greet.end === 'none', 'dock, greet: the dip and the spring up ' + JSON.stringify(greet));
  const ack = await run('ack');
  ok(ack.sy[0] === 1 && ack.sy[1] === 1, 'a nod (ack) never changes his shape ' + JSON.stringify(ack.sy));
  const cut = await run('cheer', { cutAt: 230, ms: 900 });
  ok(cut.end === 'none', 'interrupted mid-spring, he eases back to his drawn shape: ' + cut.end);
  await P.evaluate(() => setSmileyMode('focused'));
  const foc = await run('cheer');
  ok(foc.sy[0] === 1 && foc.sy[1] === 1, 'Focused: no squash ' + JSON.stringify(foc.sy));
  await P.evaluate(() => setSmileyMode('still'));
  const st = await run('cheer');
  ok(st.sy[0] === 1 && st.sy[1] === 1, 'Still: no squash ' + JSON.stringify(st.sy));
  await P.evaluate(() => setSmileyMode('lively'));

  // Home: on his picture, not his pin.
  await P.evaluate(() => setCategory('home')); await P.waitForTimeout(2500);
  const home = await P.evaluate(() => { const b = document.querySelector('#content.is-home .home-wave-icon');
    return window.__squash(b.querySelector('.home-face'), b.querySelector('.home-wave-pin'), 'cheer'); });
  ok(home.sy[0] < .99 && home.sy[1] > 1.01 && home.sy[1] <= 1.041 && home.end === 'none', 'Home, cheer: the same squash on his picture ' + JSON.stringify(home.sy));
  ok(home.headUneven < .001, 'Home: his pin is never stretched ' + home.headUneven);

  // Where his picture is also what leans (Ask's face), none at all.
  const self = await P.evaluate(() => { const box = document.createElement('div'); box.innerHTML = drSmileyArt('sq-test'); document.body.appendChild(box);
    const svg = box.firstChild; return window.__squash(svg, svg, 'cheer', { ms: 1200 }).then(r => { box.remove(); return r; }); });
  ok(self.sy[0] === 1 && self.sy[1] === 1, 'where the picture itself leans (Ask), no squash ' + JSON.stringify(self.sy));
  ok(P.__errors.length === 0, 'page errors: ' + JSON.stringify(P.__errors.slice(0, 3)));
  await ctx.close(); await b.close();
})();
