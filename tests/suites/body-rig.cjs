// Dr. Smiley's full body (drsmiley/body.js, the viewer drsmiley/body.html):
// at rest the rig composes back into Jose's standing picture; every
// performance stays inside the joints' limits, moves only transforms, and
// ends at rest; Focused is smaller than Lively; Still and reduced motion hold
// one pose and nothing moves; the walk carries him sideways; the viewer's
// controls fit a phone and are tappable. Nothing in the app links to it.
const fs = require('fs');
const L = require('../support/harness.cjs');
const ok = (c, m) => { console.log((c ? '  PASS ' : '  FAIL ') + m); if(!c) process.exitCode = 1; };
const R = L.ROOT;

async function open(b, opts = {}){
  const ctxOpts = opts.desktop ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } : { viewport: { width: 393, height: 759 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  if(opts.reduced) ctxOpts.reducedMotion = 'reduce';
  const ctx = await b.newContext(ctxOpts), page = await ctx.newPage();
  page.__errors = []; page.on('pageerror', e => page.__errors.push(e.message));
  page.__failed = []; page.on('response', r => { if(r.status() >= 400) page.__failed.push(r.status() + ' ' + r.url().slice(0, 90)); });
  await L.route(page, {});
  await page.route('**/drsmiley/body.html', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(R + 'drsmiley/body.html', 'utf8') }));
  await page.route('**/drsmiley/body.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(R + 'drsmiley/body.js', 'utf8') }));
  await page.goto('https://interp.test/drsmiley/body.html', { waitUntil: 'load' });
  await page.waitForTimeout(opts.settle || 2600);   // past the hello
  return { ctx, page };
}
// In the page: play a performance with a fixed seed and sample the pose every frame.
const SAMPLE = () => {
  window.__play = (name, o = {}) => new Promise(res => {
    const b = window.body; b.stop(); b.rest();
    drBodySeed(o.seed || 5);
    const box0 = b.el.root.ownerSVGElement.getBoundingClientRect();
    const max = {}, t0 = performance.now(); let frames = 0, layoutMoved = false, played;
    const keys = ['x', 'y', 'lean', 'sx', 'sy', 'head', 'lift', 'aL', 'aR', 'fL', 'fR', 'lL', 'lR', 'upL', 'upR'];
    for(const k of keys) max[k] = 0;
    // What is actually drawn: the angle in each joint's rotate(), after the engine's limits.
    const drawn = { arm: 0, fore: 0, head: 0, leg: 0 }, deg = el => { const m = /rotate\((-?[\d.]+)/.exec(el.getAttribute('transform') || ''); return m ? Math.abs(+m[1]) : 0; };
    const frames_seen = new Set(); let armHiddenWhileFrame = true, frameEverShown = false;
    let done = false;
    played = name === 'walk' ? b.play(DR_BODY_PERF.walk(b.mode(), { dir: o.dir || 1, steps: 4 }).beats, { name, done: () => done = true }) : b.perform(name, { done: () => done = true });
    drBodySeed(null);
    const tick = () => {
      frames++;
      const p = b.pose;
      for(const k of keys) max[k] = Math.max(max[k], Math.abs(p[k] - (k === 'sx' || k === 'sy' ? 1 : 0)));
      drawn.arm = Math.max(drawn.arm, deg(b.el.armL), deg(b.el.armR)); drawn.fore = Math.max(drawn.fore, deg(b.el.foreL), deg(b.el.foreR));
      drawn.head = Math.max(drawn.head, deg(b.el.head)); drawn.leg = Math.max(drawn.leg, deg(b.el.legL), deg(b.el.legR));
      for(const g of b.el.poses) if(g.style.opacity === '1'){ frameEverShown = true; frames_seen.add(g.dataset.pose + '-' + g.dataset.side);
        const P = DR_BODY.pose[g.dataset.pose];
        if(P.legs){ if(b.el.legL.style.opacity !== '0' || b.el.legR.style.opacity !== '0') armHiddenWhileFrame = false; continue; }
        for(const a of P.arms){ const side = g.dataset.side === 'l' ? a : (a === 'L' ? 'R' : 'L'); if(b.el['arm' + side].style.opacity !== '0') armHiddenWhileFrame = false; } }
      const bx = b.el.root.ownerSVGElement.getBoundingClientRect();
      if(Math.abs(bx.x - box0.x) > .5 || Math.abs(bx.width - box0.width) > .5) layoutMoved = true;
      if(!done && performance.now() - t0 < 8000) requestAnimationFrame(tick);
      else {
        const end = Object.assign({}, b.pose);
        const atRest = keys.every(k => Math.abs(end[k] - (k === 'sx' || k === 'sy' ? 1 : 0)) < 1e-6) && end.face === 'rest' && end.brow === 'rest';
        const framesClear = b.el.poses.every(g => g.style.opacity === '0') && b.el.armL.style.opacity === '1' && b.el.armR.style.opacity === '1' && b.el.legL.style.opacity === '1' && b.el.legR.style.opacity === '1';
        res({ played, ms: Math.round(performance.now() - t0), frames, max, drawn, atRest, layoutMoved, done, end, framesSeen: [...frames_seen], armHiddenWhileFrame, frameEverShown, framesClear });
      }
    };
    requestAnimationFrame(tick);
  });
  // The rig drawn at rest against Jose's picture, pixel by pixel, in the browser.
  window.__compare = async (shotDataUrl) => {
    const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const W = DR_BODY.w, H = DR_BODY.h;
    const [shot, master] = await Promise.all([load(shotDataUrl), load('../docs/art/dr-smiley-body/body-master.png')]);
    const draw = img => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0, W, H); return g.getImageData(0, 0, W, H).data; };
    const a = draw(shot), m = draw(master);
    // The head is the app's own (calm, turned a little), not the picture's open
    // smile, so it is measured apart from the body; the body must match.
    const head = { n: 0, sum: 0, far: 0 }, body = { n: 0, sum: 0, far: 0 };
    for(let i = 0; i < m.length; i += 4){
      const d = Math.abs(m[i] - 210) + Math.abs(m[i + 1] - 209) + Math.abs(m[i + 2] - 211);
      const y = (i / 4 / W) | 0;
      if(d <= 30 || y > 1300 && Math.max(m[i], m[i + 1], m[i + 2]) - Math.min(m[i], m[i + 1], m[i + 2]) < 12 && (m[i] + m[i + 1] + m[i + 2]) / 3 > 170) continue;   // background and the floor shadow
      const dd = (Math.abs(a[i] - m[i]) + Math.abs(a[i + 1] - m[i + 1]) + Math.abs(a[i + 2] - m[i + 2])) / 3;
      const part = y < 578 ? head : body;
      part.n++; part.sum += dd; if(dd > 120) part.far++;
    }
    const out = p => ({ px: p.n, meanDiff: +(p.sum / p.n).toFixed(2), farShare: +(p.far / p.n).toFixed(4) });
    return { head: out(head), body: out(body) };
  };
};
(async () => {
  const b = await L.chromium.launch();
  // Phone first.
  const { ctx, page: P } = await open(b);
  ok(P.__errors.length === 0, 'the viewer opens without errors ' + JSON.stringify(P.__errors));
  ok(P.__failed.length === 0, 'every layer and script arrives ' + JSON.stringify(P.__failed));
  await P.evaluate(SAMPLE);
  const layers = await P.evaluate(() => [...document.querySelectorAll('svg.db image')].map(i => i.getAttribute('href').split('/').pop()));
  const poseFiles = ['pose-wave.webp', 'pose-fist-pump.webp', 'pose-think.webp', 'pose-shrug.webp'];
  ok(layers.length === 21 && ['head.webp', 'face.webp', 'brow-l.webp', 'brow-r.webp', 'body.webp', 'leg-l.webp', 'leg-r.webp', 'arm-upper-l.webp', 'arm-fore-l.webp', 'arm-upper-r.webp', 'arm-fore-r.webp'].every(f => layers.includes(f))
     && poseFiles.every(f => layers.filter(x => x === f).length === 2) && ['pose-crouch.webp', 'pose-jump.webp'].every(f => layers.filter(x => x === f).length === 1),
     'twenty-one layers: the app\'s head, face strip and brows, the body, two legs, four arm pieces, the four drawn arm poses twice each (as drawn and mirrored), the two leg plates once ' + layers.join(' '));
  const order = await P.evaluate(() => [...document.querySelectorAll('svg.db .db-root > *, svg.db .db-breath > *')].map(e => e.getAttribute('class')));
  ok(order.indexOf('db-body') > order.indexOf('db-arm db-arm-l') && order.indexOf('db-body') > order.indexOf('db-head') && order.indexOf('db-breath') > order.indexOf('db-leg db-leg-r')
     && order.indexOf('db-poses-back') > order.indexOf('db-arm db-arm-r') && order.indexOf('db-poses-back') < order.indexOf('db-head') && order.indexOf('db-poses-front') > order.indexOf('db-body')
     && order.indexOf('db-poses-legs') > order.indexOf('db-leg db-leg-r') && order.indexOf('db-poses-legs') < order.indexOf('db-breath'),
     'drawn back to front: legs and the leg plates, then arms, the drawn poses that come from under the coat, the head, the body, then the poses over the coat ' + order.join(' | '));
  const hidden = await P.evaluate(() => [...document.querySelectorAll('svg.db .db-pose')].every(g => getComputedStyle(g).opacity === '0') && getComputedStyle(body.el.armL).opacity === '1');
  ok(hidden, 'at rest every drawn pose is hidden and the cutout arms show');
  await P.waitForTimeout(400);
  fs.mkdirSync(L.SHOTS, { recursive: true });
  await P.screenshot({ path: L.SHOTS + 'body-rig-phone.png' });

  // At rest, the pieces compose back into the picture.
  await P.evaluate(() => { stopIdle(); body.stop(); body.rest(); document.body.classList.add('is-still'); document.getElementById('who').style.setProperty('--size', '100%'); });
  await P.waitForTimeout(300);
  const svgBox = await P.evaluate(() => { const r = document.querySelector('svg.db').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const shot = await P.screenshot({ clip: { x: svgBox.x, y: svgBox.y, width: svgBox.w, height: svgBox.h }, omitBackground: true });
  const cmp = await P.evaluate(u => window.__compare(u), 'data:image/png;base64,' + shot.toString('base64'));
  ok(cmp.body.px > 250000 && cmp.body.meanDiff < 12 && cmp.body.farShare < .01, 'at rest his body is Jose\'s picture again (mean difference per channel below the chin, share of pixels far off) ' + JSON.stringify(cmp.body));
  ok(cmp.head.px > 150000 && cmp.head.farShare < .4, 'his head covers the picture\'s, the app\'s own calm face on it (so the face differs by design) ' + JSON.stringify(cmp.head));
  await P.evaluate(() => { document.body.classList.remove('is-still'); document.getElementById('who').style.removeProperty('--size'); });

  // Every performance: within limits, transforms only, back to rest.
  const perfs = ['greet', 'ack', 'think', 'cheer', 'wink', 'shrug', 'bounce', 'wince', 'walk'];
  const lively = {};
  for(const n of perfs){
    const r = await P.evaluate(n => window.__play(n), n);
    lively[n] = r;
    ok(r.played && r.done && r.ms > 700 && r.ms < 5200, `${n}: plays and ends on its own (${r.ms} ms, ${r.frames} frames)`);
    ok(r.atRest, `${n}: back to rest at the end ` + (r.atRest ? '' : JSON.stringify(r.end)));
    ok(r.drawn.arm <= 175 && r.drawn.fore <= 135 && r.drawn.head <= 9 && r.drawn.leg <= 35, `${n}: every joint drawn inside its limit ` + JSON.stringify(r.drawn));
    ok(!r.layoutMoved, `${n}: his box never changes (transforms only)`);
    ok(r.max.sy <= .041 && r.max.sx <= .021, `${n}: squash and stretch at most 4% ` + JSON.stringify([r.max.sx, r.max.sy]));
    ok(r.armHiddenWhileFrame && r.framesClear, `${n}: while a drawn pose shows, the cutout arm or legs it replaces are hidden; at the end every drawn pose is hidden again`);
  }
  const seen = n => lively[n].framesSeen.join(' ');
  ok(/wave-[lr]/.test(seen('greet')), 'greet: the drawn wave takes over at the top ' + seen('greet'));
  ok(lively.cheer.framesSeen.includes('fist-pump-l') && lively.cheer.framesSeen.includes('fist-pump-r'), 'cheer: two drawn fists, one mirrored ' + seen('cheer'));
  ok(/think-[lr]/.test(seen('think')), 'think: the drawn finger on the chin ' + seen('think'));
  ok(/shrug-[lr]/.test(seen('shrug')), 'shrug: the drawn palms ' + seen('shrug'));
  ok(lively.cheer.framesSeen.includes('crouch-l') && lively.cheer.framesSeen.includes('jump-l') && lively.bounce.framesSeen.includes('crouch-l') && lively.bounce.framesSeen.includes('jump-l'), 'cheer and bounce: the drawn crouch, then the drawn jump with the feet tucked ' + seen('bounce'));
  ok(!lively.ack.frameEverShown && !lively.walk.frameEverShown && !lively.bounce.framesSeen.some(f => !/^(crouch|jump)-/.test(f)), 'ack and the walk use the cutout pieces only; bounce swaps only its legs');
  ok(lively.greet.max.aL >= 95 || lively.greet.max.aR >= 95, 'greet: an arm comes up to where the drawn wave is');
  ok(lively.cheer.max.aL >= 105 && lively.cheer.max.aR >= 105 && lively.cheer.max.y > 40, 'cheer: both arms up to the drawn fists and a jump');
  ok(lively.think.max.fL > 100 || lively.think.max.fR > 100, 'think: a hand comes to the chin');
  ok(lively.walk.max.x > 150 && lively.walk.max.upL > 10 && lively.walk.max.upR > 10, 'walk: he moves sideways, each leg lifting');
  const faces = await P.evaluate(async () => {
    const seen = {};
    for(const n of ['greet', 'cheer', 'think', 'wince', 'shrug', 'wink']){
      const s = new Set(); const orig = body.setFace; body.setFace = f => { s.add(f); orig(f); };
      const el = body.el.sheet; const obs = new MutationObserver(() => s.add(DR_BODY_FACES[-el.getAttribute('x') / DR_BODY_FACE_W])); obs.observe(el, { attributes: true });
      await window.__play(n); obs.disconnect(); body.setFace = orig; seen[n] = [...s];
    }
    return seen;
  });
  ok(faces.greet.includes('smile') && faces.cheer.includes('laugh') && faces.think.some(f => /^lookU/.test(f)) && faces.wince.includes('worried') && faces.shrug.includes('doubt') && faces.wink.includes('wink'),
     'his face acts with his body (smile, laugh, a look up, worried, doubt, wink) ' + JSON.stringify(faces));

  // Focused: the same acting, smaller. Still: one pose, nothing moves.
  await P.click('[data-mode="focused"]');
  const fc = await P.evaluate(() => window.__play('cheer'));
  ok(fc.atRest && fc.max.sy < lively.cheer.max.sy * .7 && fc.max.y === 0 && fc.framesSeen.includes('fist-pump-l') && fc.framesSeen.includes('crouch-l') && !fc.framesSeen.includes('jump-l'), 'Focused cheer: smaller squash, no jump (the crouch plate, never the tucked feet), the drawn fists still, back to rest ' + JSON.stringify([fc.max.sy, lively.cheer.max.sy, fc.max.y, fc.framesSeen]));
  await P.click('[data-mode="still"]');
  const st = await P.evaluate(async () => {
    const b = window.body; b.rest();
    const before = b.el.armL.getAttribute('transform');
    let frames = 0, changes = 0, lastT = before;
    const t0 = performance.now();
    const p = b.perform('cheer');
    await new Promise(res => { const tick = () => { frames++; const t = b.el.armL.getAttribute('transform'); if(t !== lastT){ changes++; lastT = t; } if(performance.now() - t0 < 1500) requestAnimationFrame(tick); else res(); }; tick(); });
    return { played: p, frames, changes, held: changes >= 1, end: b.el.armL.getAttribute('transform') === before, breath: getComputedStyle(b.el.breath).animationName };
  });
  ok(st.played && st.changes <= 2 && st.end && st.breath === 'none', 'Still cheer: one held pose, then rest, no breathing, nothing in between ' + JSON.stringify(st));

  // The viewer on a phone: no sideways scroll, every button tappable.
  const fit = await P.evaluate(() => {
    const bs = [...document.querySelectorAll('.act, .seg button')].map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), h: r.height, w: r.width, hit: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === b }; });
    return { scrollW: document.documentElement.scrollWidth, innerW: innerWidth, small: bs.filter(b => b.h < 38 || !b.hit).map(b => b.t), acts: bs.filter(b => b.h < 44 && document.querySelector('.act') && [...document.querySelectorAll('.act')].some(a => a.textContent.trim() === b.t)).map(b => b.t) };
  });
  ok(fit.scrollW <= fit.innerW, 'no sideways scroll on a phone ' + JSON.stringify([fit.scrollW, fit.innerW]));
  ok(fit.small.length === 0 && fit.acts.length === 0, 'every control at least 38px, the performance buttons 44px, and the tap lands on it ' + JSON.stringify(fit));
  await ctx.close();

  // Reduced motion: Still, whatever the mode says.
  const { ctx: c2, page: P2 } = await open(b, { reduced: true, settle: 1600 });
  const rm = await P2.evaluate(() => ({ mode: body.mode(), still: document.body.classList.contains('is-still'), breath: getComputedStyle(body.el.breath).animationName, arm: body.el.armL.getAttribute('transform') }));
  ok(rm.mode === 'still' && rm.still && rm.breath === 'none' && /rotate\(0\.000/.test(rm.arm), 'reduced motion: Still, no breathing, the hello held still ' + JSON.stringify(rm));
  await c2.close();

  // The desktop view, and nothing in the app points here.
  const { ctx: c3, page: P3 } = await open(b, { desktop: true, settle: 1200 });
  await P3.screenshot({ path: L.SHOTS + 'body-rig-desktop.png' });
  ok(P3.__errors.length === 0, 'the desktop view opens without errors');
  await c3.close();
  const idx = fs.readFileSync(R + 'index.html', 'utf8'), hp = fs.readFileSync(R + 'home-polish.js', 'utf8');
  ok(!/body\.html|drsmiley\/body\.js|drBodyArt/.test(idx + hp), 'the app does not show him full-length yet (nothing links the viewer or the rig)');
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e.stack || e)); process.exitCode = 1; });
