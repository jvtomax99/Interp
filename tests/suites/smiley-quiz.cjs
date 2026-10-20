/* Dr. Smiley in a quiz (F1, docs/PLAN.md): a bounce on a right answer, a
   small wince on a wrong one, the 3/5/10 streaks keep their bigger
   reactions, nothing in an exam, a cheer on the first answer of a 3/7/14...
   day streak. Then the two moves themselves, measured on the dock: short,
   the right faces, up for the bounce, back and down for the wince, never a
   sideways slide or a stretch; smaller in Focused, one frame in Still. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'smiley-quiz/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// Record what he is asked to do, by name.
const SPY = () => { window.__acts = []; const p = window.drPerform, c = window.drCelebrate;
  window.drPerform = (s, o) => { window.__acts.push('perform:' + s); return p(s, o); };
  window.drCelebrate = s => { window.__acts.push('celebrate:' + s); return c(s); }; };
const answer = (page, right) => page.evaluate(r => { const q = quizQuestions[quizIndex]; __acts = []; answerQuiz(r ? q.a : (q.a + 1) % q.o.length); return __acts.slice(); }, right);
const next = page => page.evaluate(() => { rateConfidence('sure'); nextQuestion(); });

(async () => {
  const b = await L.chromium.launch();
  { const { page } = await L.boot(b, { device: 'iphone' });
    await L.go(page, 'practice', 1200);
    await page.evaluate(SPY);
    await page.evaluate(() => startStudy('new')); await wait(500);
    const opt = await page.evaluate(() => Array.isArray(quizQuestions[0].o));
    ok(opt, 'a quiz is running', opt);
    const dock = await page.evaluate(() => { const st = drStage(); const btn = document.querySelector('.dock-smiley, .smiley-rider'); const r = btn && btn.getBoundingClientRect();
      return { stage: !!st && !st.home, cls: document.body.classList.contains('dock-has-smiley'), inView: !!r && r.width > 20 && r.bottom <= innerHeight + 1 }; });
    ok(dock.stage && dock.cls && dock.inView, 'in a quiz he is in the dock (the campus and its Dr. Smiley are gone)', dock);
    const r1 = await answer(page, true);
    ok(r1.join() === 'perform:bounce', 'right answer: bounce', r1);
    await next(page);
    const w1 = await answer(page, false);
    ok(w1.join() === 'perform:wince', 'wrong answer: wince', w1);
    await next(page);
    const seq = [];
    for (let i = 0; i < 3; i++) { seq.push((await answer(page, true)).join()); await next(page); }
    ok(seq[0] === 'perform:bounce' && seq[1] === 'perform:bounce' && /celebrate:giggle/.test(seq[2]) && !/bounce/.test(seq[2]), 'three right in a row: the streak giggle instead of a bounce', seq);
    await page.screenshot({ path: O + 'quiz.png' });

    await page.evaluate(() => { quizActive = false; quizQuestions = []; quizAnswers = []; quizIndex = 0; startStudy('exam'); }); await wait(400);
    const ex = await answer(page, true);
    ok(ex.length === 0, 'exam mode: no reaction (no feedback there)', ex);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
  }

  { // Day streak: yesterday was day 6, so today's first answer makes it 7.
    const { page } = await L.boot(b, { device: 'iphone', init: () => {
      const d = new Date(Date.now() - 86400000), y = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      localStorage.setItem('ih_practice_streak_v1', JSON.stringify({ days: 6, last: y, answered: 4, on: y })); } });
    await L.go(page, 'practice', 1200);
    await page.evaluate(SPY);
    await page.evaluate(() => startStudy('new')); await wait(500);
    await answer(page, true);
    const acts = await page.evaluate(() => { __acts = []; rateConfidence('sure'); return { acts: __acts.slice(), st: readStreak() }; });
    ok(acts.st.days === 7 && acts.acts.includes('celebrate:cheer'), '7 days in a row: a cheer on the first answer of the day', acts);
    const again = await page.evaluate(() => { nextQuestion(); const q = quizQuestions[quizIndex]; answerQuiz(q.a); __acts = []; rateConfidence('sure'); return __acts.slice(); });
    ok(!again.includes('celebrate:cheer'), 'only once that day', again);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
  }

  { // The moves themselves, on the dock.
    const { page } = await L.boot(b, { device: 'iphone' });
    await L.go(page, 'practice', 1200);
    await page.evaluate(() => startStudy('new')); await wait(600);
    const measure = (name, mode) => page.evaluate(async ([name, mode]) => {
      setSmileyMode(mode); await new Promise(r => setTimeout(r, 200));
      const st = drStage(); if (!st || st.home) return { err: 'no stage' };
      const a = drAnim(st.svg, { head: st.head });
      const io = a.idle && a.idle.opts; if (io) io.canPlay = () => false;
      a.stopRun(false); a.set('rest'); if (a.headAnim){ a.headAnim.cancel(); a.headAnim = null; }
      await new Promise(r => setTimeout(r, 250));
      const frames = [], set = a.set.bind(a); a.set = n => { frames.push(n); return set(n); };
      drPerfSeed(7); const total = drSeqMs(name); a.play(name, { priority: DR_P.REACT }); drPerfSeed(null);
      const out = [], t0 = performance.now();
      await new Promise(res => { const tick = () => { const m = getComputedStyle(st.head).transform;
        if (m && m !== 'none'){ const v = m.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number); out.push({ rot: Math.atan2(v[1], v[0]) * 180 / Math.PI, sx: Math.hypot(v[0], v[1]), sy: Math.hypot(v[2], v[3]), tx: v[4], ty: v[5] }); }
        if (performance.now() - t0 < total + 500) requestAnimationFrame(tick); else res(); }; tick(); });
      a.set = set;
      const pick = f => out.length ? f(...out) : 0;
      return { total, frames: [...new Set(frames)], up: Math.min(0, ...out.map(x => x.ty)), down: Math.max(0, ...out.map(x => x.ty)), rot: Math.max(0, ...out.map(x => Math.abs(x.rot))),
        slide: Math.max(0, ...out.map(x => Math.abs(x.tx))), stretch: Math.max(0, ...out.map(x => Math.max(Math.abs(x.sx - x.sy), 0))), end: a.frame() };
    }, [name, mode]);
    const bl = await measure('bounce', 'lively'), wl = await measure('wince', 'lively');
    const bf = await measure('bounce', 'focused'), wf = await measure('wince', 'focused');
    ok(!bl.err && bl.total > 600 && bl.total < 1500 && bl.frames.includes('smile') && bl.end === 'rest', 'bounce: under 1.5 s, smiles, ends at rest', bl);
    ok(bl.up < -1.3 && bl.down > .15, 'bounce: a crouch, then up', bl);
    ok(!wl.err && wl.total > 600 && wl.total < 1600 && wl.frames.includes('worried') && wl.frames.includes('smile1') && wl.end === 'rest', 'wince: under 1.6 s, the worried face then a small smile, ends at rest', wl);
    ok(wl.down > .6 && wl.rot > .8, 'wince: drawn back and down, turned away', wl);
    ok([bl, wl].every(x => x.slide < 1.5 && x.stretch < .002), 'no sideways slide, no stretch', [bl.slide, wl.slide, bl.stretch, wl.stretch]);
    ok(bf.up > bl.up && wf.rot < wl.rot, 'Focused: smaller', { bf: bf.up, bl: bl.up, wf: wf.rot, wl: wl.rot });
    const tone = await page.evaluate(() => ({ b: drTone('bounce'), w: drTone('wince') }));
    ok(tone.b === 'bounce' && tone.w === 'wince', 'Lively: plays as written', tone);
    ok(await page.evaluate(() => DR_TONE.appointment.bounce === 'ack' && DR_TONE.appointment.wince === null), 'in an appointment: a nod for right, nothing for wrong');
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
  }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; });
