/* Dr. Smiley's five performances, measured in the real app at phone size. */
const { chromium, boot, go } = require('../support/harness.cjs');
const fs = require('fs');
const OUT = require('../support/harness.cjs').OUT + 'gestures/'; fs.mkdirSync(OUT + 'shots', { recursive: true });
const results = []; const ok = (c, m) => { results.push([!!c, m]); console.log((c ? 'PASS ' : 'FAIL ') + m); };
const NAMES = ['greet', 'ack', 'think', 'cheer', 'wink'];
// In the page: log every frame each controller sets, and sample the head every animation frame.
const INSTR = () => {
  window.__log = [];
  const set = DrAnim.prototype.set;
  DrAnim.prototype.set = function(n){ window.__log.push({ t: performance.now(), place: this.place, f: n, from: this.frame() }); return set.call(this, n); };
  window.__rec = (el, ms) => new Promise(res => {
    const out = [], t0 = performance.now();
    const tick = () => {
      const m = getComputedStyle(el).transform;
      let rot = 0, sx = 1, sy = 1, tx = 0, ty = 0;
      if(m && m !== 'none'){ const v = m.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number); rot = Math.atan2(v[1], v[0]) * 180 / Math.PI; sx = Math.hypot(v[0], v[1]); sy = Math.hypot(v[2], v[3]); tx = v[4]; ty = v[5]; }
      out.push({ t: performance.now() - t0, rot, sx, sy, tx, ty, fx: document.querySelectorAll('.ds-fx').length });
      if(performance.now() - t0 < ms) requestAnimationFrame(tick); else res(out);
    };
    tick();
  });
};
const near = (a, b) => a === b || (DRN[a] || []).includes(b);
let DRN = {};
async function playAndMeasure(page, name, o = {}){
  return page.evaluate(async ([name, o]) => {
    const st = drStage(); if(!st || st.home) return { err: 'no stage' };
    const head = st.head; const a = drAnim(st.svg, { head });
    // His own idle waits while we measure (it would play after the performance ends).
    const io = a.idle && a.idle.opts, had = io && io.canPlay;
    if(io) io.canPlay = () => false;
    a.stopRun(false); a.set('rest'); if(a.headAnim){ a.headAnim.cancel(); a.headAnim = null; }
    await new Promise(r => setTimeout(r, 250));
    drPerfSeed(o.seed || 11);
    window.__log = [];
    const rec = window.__rec(head, o.ms || 3600);
    const played = a.play(name, { priority: DR_P.REACT });
    drPerfSeed(null);
    const s = await rec;
    if(io) io.canPlay = had;
    const frames = window.__log.filter(x => x.place === a.place);
    return { played, frames: frames.map(x => [Math.round(x.t), x.from, x.f]), s, end: a.frame(), run: a.run ? a.run.name : '' };
  }, [name, o]);
}
(async () => {
  const b = await chromium.launch();
  const { page } = await boot(b, { device: 'iphone' });
  await page.evaluate(INSTR);
  DRN = await page.evaluate(() => Object.fromEntries(Object.entries(DR_FACE_NEAR).map(([k, v]) => [k, [...v]])));
  ok(await page.evaluate(() => DR_REACTS.hello.seq === 'greet' && DR_REACTS.cheer.seq === 'cheer' && DR_TONE.appointment.cheer === 'ack'), 'hello → greet, team rank → cheer, appointment tones them down to ack');

  // ---- Home greeting: the hello is the engine's greet, no stretch, no slide ----
  {
    const { page: hp, ctx } = await boot(b, { device: 'iphone', settle: 50 });
    await hp.waitForFunction(() => { try{ return typeof DrAnim !== 'undefined'; }catch(e){ return false; } }, null, { timeout: 8000, polling: 20 });
    await hp.evaluate(INSTR);
    const samples = await hp.evaluate(() => new Promise(res => {
      const out = [], t0 = performance.now();
      const tick = () => {
        const pin = document.querySelector('#content.is-home .home-wave-pin');
        if(pin){ const m = getComputedStyle(pin).transform; let sx = 1, sy = 1, tx = 0;
          if(m && m !== 'none'){ const v = m.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number); sx = Math.hypot(v[0], v[1]); sy = Math.hypot(v[2], v[3]); tx = v[4]; }
          out.push({ t: performance.now() - t0, sx, sy, tx, entering: !!pin.closest('.home-wave-entering') }); }
        if(performance.now() - t0 < 12000) requestAnimationFrame(tick); else res(out);
      };
      tick();
    }));
    const flog = await hp.evaluate(() => window.__log.filter(x => x.place === 'home').map(x => x.f));
    const stretch = samples.filter(s => Math.abs(s.sx - s.sy) > .002);
    const landedScale = samples.filter(s => !s.entering && (Math.abs(s.sx - 1) > .002));
    const slide = samples.filter(s => Math.abs(s.tx) > .01);
    ok(samples.length > 100, `Home greeting sampled (${samples.length} frames)`);
    ok(!stretch.length, `Home greeting: never stretched (scaleX = scaleY on every frame; ${stretch.length} bad)`);
    ok(!landedScale.length, `Home greeting: full size once he has landed (${landedScale.length} frames scaled)`);
    ok(!slide.length, `Home greeting: never slid sideways (${slide.length} frames with translateX)`);
    ok(flog.includes('smile') && flog.includes('laugh1') && flog.includes('blink2'), 'Home greeting: the engine played greet (blink, open smile, bright squint): ' + [...new Set(flog)].join(' '));
    await hp.screenshot({ path: OUT + 'shots/home-greet.png' });
    await ctx.close();
  }

  // ---- Dock: each performance, Lively ----
  await go(page, 'glossary', 1200);
  ok(await page.evaluate(() => { const s = drStage(); return !!(s && !s.home && s.svg.closest('.dock-smiley')); }), 'dock Dr. Smiley is the stage on the glossary');
  const summary = {};
  for(const mode of ['lively', 'focused']){
    await page.evaluate(m => setSmileyMode(m), mode);
    for(const n of NAMES){
      const r = await playAndMeasure(page, n);
      if(r.err){ ok(false, n + ' ' + r.err); continue; }
      const fr = r.frames.map(x => x[2]);
      const jumps = r.frames.filter(([, from, to]) => !near(from, to));
      const maxRot = Math.max(...r.s.map(x => Math.abs(x.rot)));
      let maxStep = 0; for(let i = 1; i < r.s.length; i++) maxStep = Math.max(maxStep, Math.abs(r.s[i].rot - r.s[i - 1].rot));
      const bad = r.s.filter(x => Math.abs(x.sx - 1) > .002 || Math.abs(x.sy - 1) > .002 || Math.abs(x.tx) > .01);
      const fxMax = Math.max(...r.s.map(x => x.fx)), fxEnd = r.s[r.s.length - 1].fx;
      const fxOn = r.s.filter(x => x.fx).length ? (r.s.filter(x => x.fx).slice(-1)[0].t - r.s.find(x => x.fx).t) : 0;
      summary[mode + ':' + n] = { frames: [...new Set(fr)].join(' '), maxRot: +maxRot.toFixed(2), fxMs: Math.round(fxOn) };
      ok(r.played, `${mode} ${n}: played on the dock`);
      ok(!jumps.length, `${mode} ${n}: every frame change goes to a neighbouring frame (${jumps.length} jumps${jumps.length ? ': ' + jumps.slice(0, 3).map(j => j[1] + '→' + j[2]).join(', ') : ''})`);
      ok(!bad.length, `${mode} ${n}: only tilt and lift -- no stretch, no scale, no sideways slide`);
      ok(maxStep < 1.0, `${mode} ${n}: lean moves smoothly (largest change between two screen frames ${maxStep.toFixed(2)}°)`);
      ok(r.end === 'rest' && Math.abs(r.s[r.s.length - 1].rot) < .05, `${mode} ${n}: back to rest and upright`);
      ok(fxEnd === 0, `${mode} ${n}: effects gone at the end`);
      if(mode === 'focused'){
        ok(fxMax === 0, `focused ${n}: no effects`);
        ok(!fr.some(f => /^laugh/.test(f) && f !== 'laugh1') , `focused ${n}: no laughter frames`);
        ok(maxRot <= summary['lively:' + n].maxRot + .01, `focused ${n}: leans no more than Lively (${maxRot.toFixed(2)}° vs ${summary['lively:' + n].maxRot}°)`);
      } else {
        const want = { greet: ['smile', 'laugh1'], ack: ['smile1'], think: ['lookUL', 'lookUR'], cheer: ['laugh', 'laughB'], wink: ['wink'] }[n];
        ok(n === 'think' ? want.some(w => fr.includes(w)) : want.every(w => fr.includes(w)), `lively ${n}: main gesture frames present (${want.join('/')})`);
        if(['cheer', 'wink', 'think'].includes(n)) ok(fxMax > 0 && fxOn < 1800, `lively ${n}: one brief effect (${Math.round(fxOn)} ms)`);
        else ok(fxMax === 0, `lively ${n}: no effect`);
      }
    }
  }
  // Variety: the same performance twice with different seeds differs.
  const v = await page.evaluate(() => { setSmileyMode('lively'); const o = []; for(const s of [1, 2, 3, 4]){ drPerfSeed(s); o.push(JSON.stringify(DR_FACE_SEQ.cheer.head)); } drPerfSeed(null); return new Set(o).size; });
  ok(v === 4, `cheer varies from one time to the next (${v} different leans out of 4)`);
  const sides = await page.evaluate(() => { const o = new Set(); for(let s = 1; s < 30; s++){ drPerfSeed(s); o.add(Math.sign(DR_FACE_SEQ.greet.head[3][1])); } drPerfSeed(null); return [...o]; });
  ok(sides.length === 2, 'greet leans to either side');
  const winkSide = await page.evaluate(() => { const o = new Set(); for(let s = 1; s < 30; s++){ drPerfSeed(s); const h = DR_FACE_SEQ.wink.head; o.add(Math.sign(Math.max(...h.map(k => k[1])))); } drPerfSeed(null); return [...o]; });
  ok(winkSide.length === 1 && winkSide[0] === 1, 'wink always tips toward the winking eye (his left, your right)');

  // ---- Still ----
  await page.evaluate(() => setSmileyMode('still'));
  for(const n of NAMES){
    const r = await playAndMeasure(page, n, { ms: 1800 });
    const fr = r.frames.map(x => x[2]);
    const still = { greet: 'smile', ack: 'smile1', think: /^lookU[LR]$/, cheer: 'smile', wink: 'wink' }[n];
    ok(r.played && (still instanceof RegExp ? still.test(fr[0]) : fr[0] === still) && fr.length <= 2 && fr[fr.length - 1] === 'rest', `still ${n}: one still frame (${fr.join(' → ')}), then rest`);
    ok(r.s.every(x => Math.abs(x.rot) < .01 && Math.abs(x.ty) < .01) && r.s.every(x => !x.fx), `still ${n}: no lean, no effect`);
  }
  await page.evaluate(() => setSmileyMode('lively'));

  // ---- Interruptions ----
  const I = await page.evaluate(async () => {
    const st = drStage(), a = drAnim(st.svg, { head: st.head }), out = {};
    const wait = ms => new Promise(r => setTimeout(r, ms));
    if(a.idle) a.idle.opts.canPlay = () => false;
    const reset = async () => { a.stopRun(false); a.set('rest'); if(a.headAnim){ a.headAnim.cancel(); a.headAnim = null; } await wait(200); window.__log = []; };
    const jumpsOf = () => window.__log.filter(x => x.place === a.place).filter(x => !(x.from === x.f || (DR_FACE_NEAR[x.from] && DR_FACE_NEAR[x.from].has(x.f)))).map(x => x.from + '→' + x.f);
    // 1. A celebration (task) can't be cut short by a reaction; petting can.
    await reset();
    out.celebrate = drCelebrate('cheer');
    await wait(600); out.reactRefused = a.play('ack', { priority: DR_P.REACT }) === false;
    await wait(250); out.petTook = a.play('pet', { priority: DR_P.DIRECT }) && a.run.name === 'pet';
    await wait(260); out.fx1 = document.querySelectorAll('.ds-fx-burst:not(.is-leaving)').length;
    await wait(2400); out.j1 = jumpsOf();
    // 2. Same priority: a wink takes over a thought mid-way.
    await reset();
    a.play('think', { priority: DR_P.REACT }); await wait(900);
    out.winkTook = a.play('wink', { priority: DR_P.REACT });
    await wait(2200); out.j2 = jumpsOf(); out.end2 = a.frame();
    // 3. Idle can't interrupt a greeting.
    await reset();
    a.play('greet', { priority: DR_P.REACT }); await wait(300);
    out.idleRefused = a.play('blink', { priority: DR_P.IDLE }) === false;
    await wait(2400);
    // 4. Rapid taps: all five within a second.
    await reset();
    for(const n of ['greet', 'ack', 'think', 'cheer', 'wink']){ a.play(n, { priority: DR_P.REACT }); await wait(200); }
    await wait(3200); out.j4 = jumpsOf(); out.end4 = a.frame(); out.fx4 = a.fx.size; out.run4 = a.run ? a.run.name : '';
    // 5. Switched to Still mid-cheer: stops at once, no effects left, rest.
    await reset();
    a.play('cheer', { priority: DR_P.REACT }); await wait(500);
    setSmileyMode('still'); await wait(80);
    out.still5 = { frame: a.frame(), fx: document.querySelectorAll('.ds-fx').length, anim: st.head.getAnimations().length };
    setSmileyMode('lively');
    // 6. Page hidden mid-wink: everything stops; shown again, nothing replays.
    await reset();
    a.play('wink', { priority: DR_P.REACT }); await wait(400);
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    out.hidden6 = { frame: a.frame(), fx: document.querySelectorAll('.ds-fx').length, run: a.run ? a.run.name : '', timers: a.timers.size };
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    return out;
  });
  ok(I.celebrate && I.reactRefused, 'a celebration (task) is not cut short by a smaller reaction');
  ok(I.petTook, 'petting him (direct) takes over mid-celebration');
  ok(!I.j1.length && I.fx1 === 0, `…and the face walks over through in-between frames, effects faded (${I.j1.join(', ') || 'no jumps'})`);
  ok(I.winkTook && !I.j2.length && I.end2 === 'rest', `a wink takes over a thought at the same priority, no jumps (${I.j2.join(', ') || 'none'})`);
  ok(I.idleRefused, 'his idle cannot interrupt a greeting');
  ok(!I.j4.length && I.end4 === 'rest' && I.fx4 === 0, `five taps in a second: no jumps, ends at rest, no effects left (${I.j4.join(', ') || 'none'}; run ${I.run4 || 'idle'})`);
  ok(I.still5.frame === 'rest' && I.still5.fx === 0 && I.still5.anim === 0, `Still mid-cheer: stops at once (${JSON.stringify(I.still5)})`);
  ok(I.hidden6.frame === 'rest' && !I.hidden6.run && I.hidden6.fx === 0 && I.hidden6.timers === 0, `page hidden mid-wink: stopped, nothing left running (${JSON.stringify(I.hidden6)})`);
  ok(!page.__errors.length, 'no page errors ' + page.__errors.join(' | '));
  fs.writeFileSync(OUT + 'summary.json', JSON.stringify(summary, null, 1));
  fs.writeFileSync(OUT + 'results.json', JSON.stringify(results));
  console.log(JSON.stringify(summary, null, 1));
  console.log(results.filter(r => r[0]).length + '/' + results.length);
  await b.close();
})();
