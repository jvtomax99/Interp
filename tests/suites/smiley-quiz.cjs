/* Dr. Smiley in a quiz (F1, docs/PLAN.md): a bounce on a right answer, a
   small wince on a wrong one, the 3/5/10 streaks keep their bigger
   reactions, nothing in an exam, a cheer on the first answer of a 3/7/14...
   day streak. Then the two moves themselves, measured on his body in the
   card (full-length since 2026-10-24): short, the right faces and drawn
   frames, up for the bounce, down and away for the wince, never a sideways
   slide, the squash within 4%; smaller in Focused. */
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
    // Since 2026-10-24 he stands full-length in the quiz card (features/smiley-body.js); the dock head steps aside.
    const dock = await page.evaluate(() => { const st = drStage(); const h = document.querySelector('.quiz-card .quiz-dr');
      return { stage: !!st && !!st.body, mounted: !!h && h.dataset.dbMounted === '1', cls: document.body.classList.contains('dock-has-smiley'), campus: !!document.querySelector('.cp-dr') }; });
    ok(dock.stage && dock.mounted && !dock.cls && !dock.campus, 'in a quiz he stands in the card, full-length (the campus and its Dr. Smiley are gone, the dock head aside)', dock);
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
    ok(acts.st.days === 7 && acts.acts.includes('celebrate:wow'), '7 days in a row: a surprised take, then a cheer, on the first answer of the day', acts);
    const again = await page.evaluate(() => { nextQuestion(); const q = quizQuestions[quizIndex]; answerQuiz(q.a); __acts = []; rateConfidence('sure'); return __acts.slice(); });
    ok(!again.includes('celebrate:wow'), 'only once that day', again);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
  }

  { // The moves themselves, on his body in the card (the rig: drsmiley/body.js).
    const { page } = await L.boot(b, { device: 'iphone' });
    await L.go(page, 'practice', 1200);
    await page.evaluate(() => startStudy('new')); await wait(600);
    const measure = (name, mode) => page.evaluate(async ([name, mode]) => {
      setSmileyMode(mode); await new Promise(r => setTimeout(r, 200));
      const st = drStage(); if (!st || !st.body) return { err: 'no body stage' };
      const bd = st.body.body; st.body.idle.setLevel('none'); bd.stop(); bd.rest();
      await new Promise(r => setTimeout(r, 250));
      drBodySeed(7); const p = DR_BODY_PERF[name](bd.mode()); const total = p.beats.reduce((s, x) => s + x[0], 0); bd.play(p.beats, { name }); drBodySeed(null);
      const faces = new Set(), frames = new Set(); let up = 0, down = 0, rot = 0, slide = 0, sq = 0; const t0 = performance.now();
      await new Promise(res => { const tick = () => { const q = bd.pose; faces.add(q.face); if (q.frameLegs) frames.add(q.frameLegs); if (q.frameL || q.frameR) frames.add(q.frameL || q.frameR);
        up = Math.min(up, q.y); down = Math.max(down, q.lift); rot = Math.max(rot, Math.abs(q.head)); slide = Math.max(slide, Math.abs(q.x)); sq = Math.max(sq, Math.abs(q.sy - 1));
        if (bd.busy() && performance.now() - t0 < total + 800) requestAnimationFrame(tick); else res(); }; tick(); });
      st.body.idle.setLevel('full');
      const q = bd.pose, rest = ['x', 'y', 'lean', 'head', 'lift', 'aL', 'aR', 'fL', 'fR'].every(k => Math.abs(q[k]) < .01) && q.sy === 1 && q.face === 'rest' && !q.frameL && !q.frameR && !q.frameLegs;
      return { total, faces: [...faces], frames: [...frames], up, down, rot, slide, sq, end: rest ? 'rest' : JSON.stringify(q) };
    }, [name, mode]);
    const bl = await measure('bounce', 'lively'), wl = await measure('wince', 'lively');
    const bf = await measure('bounce', 'focused'), wf = await measure('wince', 'focused');
    ok(!bl.err && bl.total > 600 && bl.total < 1800 && bl.faces.includes('smile') && bl.end === 'rest', 'bounce: under 1.8 s, smiles, ends at rest', bl);
    ok(bl.frames.includes('crouch') && bl.frames.includes('jump') && bl.frames.includes('thumbs-up') && bl.up < -20, 'bounce: the drawn crouch, the jump with the feet tucked, the thumbs-up at the top', bl);
    ok(!wl.err && wl.total > 600 && wl.total < 1900 && wl.faces.includes('worried') && wl.faces.includes('smile1') && wl.end === 'rest', 'wince: under 1.9 s, the worried face then a small smile, ends at rest', wl);
    ok(wl.down > 5 && wl.rot > 3, 'wince: drawn down and turned away', wl);
    ok([bl, wl].every(x => x.slide === 0 && x.sq <= .041), 'no sideways slide; squash within 4%', [bl.slide, wl.slide, bl.sq, wl.sq]);
    ok(bf.up > bl.up && wf.rot < wl.rot && !bf.frames.includes('jump'), 'Focused: smaller, no jump', { bf: bf.up, bl: bl.up, wf: wf.rot, wl: wl.rot });
    const tone = await page.evaluate(() => ({ b: drTone('bounce'), w: drTone('wince') }));
    ok(tone.b === 'bounce' && tone.w === 'wince', 'Lively: plays as written', tone);
    ok(await page.evaluate(() => DR_TONE.appointment.bounce === 'ack' && DR_TONE.appointment.wince === null), 'in an appointment: a nod for right, nothing for wrong');
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
  }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; });
