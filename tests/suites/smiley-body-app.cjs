/* Dr. Smiley full-length in the app (features/smiley-body.js; Jose's picks,
   2026-10-24): on Home he stands at the banner's bottom right, arrives with
   the hello and greets on the rig; a tap opens Ask the Hub; the small dock
   head stays away while he is on screen and comes back when he scrolls off;
   the app's task state is his held state; Still holds one pose. In a quiz he
   stands in the card's top-right corner, the question starts below his feet,
   a right answer bounces and a wrong one winces, the dock steps aside, and
   the next question keeps the same body (no cut mid-gesture). */
const L = require('../support/harness.cjs');
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d))); if (!c) process.exitCode = 1; };

(async () => {
  const b = await L.chromium.launch();
  console.log('== Home, phone');
  const { page: P, ctx } = await L.boot(b, { device: 'iphone', settle: 50 });
  await P.waitForSelector('#content.is-home .home-body', { timeout: 15000 });
  await P.waitForFunction(() => window.homeBody && window.homeBody.host.isConnected && document.querySelector('#content.is-home .home-body.is-in'), null, { timeout: 15000 }).catch(() => {});
  await P.waitForTimeout(9000);   // the hello plays out
  const home = await P.evaluate(() => {
    const h = document.querySelector('#content.is-home .home-body'), r = h.getBoundingClientRect(), g = document.querySelector('#content .home-greeting').getBoundingClientRect();
    const q = document.querySelector('#content .home-greeting-quote').getBoundingClientRect(), w = document.querySelector('#content .home-promo-btn'), wr = w && w.getBoundingClientRect();
    const search = document.querySelector('#content input[type="search"], #content input[placeholder^="Search"]'), sr = search && search.getBoundingClientRect();
    const at = document.elementFromPoint(r.x + r.width / 2, r.y + r.height * .6);
    const apart = (a, c) => a.right <= c.left + 1 || a.left >= c.right - 1 || a.bottom <= c.top + 1 || a.top >= c.bottom - 1;
    return { isIn: h.classList.contains('is-in'), h: Math.round(r.height), ratio: +(r.width / r.height).toFixed(3), inBanner: r.right <= g.right + 1 && r.bottom <= g.bottom + 1 && r.top >= g.top,
      quoteClear: q.right <= r.left + 1 || apart(q, r), watchClear: !wr || apart(wr, r), aboveSearch: !sr || r.bottom <= sr.top + 1,
      tapLands: !!(at && at.closest('.home-body')), waveHidden: getComputedStyle(document.querySelector('#content .home-wave-icon')).visibility === 'hidden',
      nameFull: getComputedStyle(document.querySelector('#content .home-greeting-name-row')).gridTemplateColumns.split(' ').pop(),
      stageBody: !!(drStage() && drStage().body), dock: document.body.classList.contains('dock-has-smiley'), breath: getComputedStyle(h.querySelector('.db-breath')).animationName, images: h.querySelectorAll('image').length, errors: 0 };
  });
  ok(home.isIn && home.h > 200 && Math.abs(home.ratio - 1070 / 1470) < .01 && home.inBanner, 'he stands full-length in the banner (over 200px, his own shape)', home);
  ok(home.quoteClear && home.watchClear && home.aboveSearch, 'the quote, Watch and Search are clear of him', home);
  ok(home.tapLands && home.waveHidden && home.nameFull === '0px', 'the tap lands on him, the old head is hidden and the name has the row to itself', home);
  // Start-up repaints (data arriving) keep the greeting and reset #content's classes: the head must stay hidden through them.
  const repaint = await P.evaluate(() => { const c = document.getElementById('content'); c.className = 'content-fade is-home'; lastHomeHtml = ''; renderContent();
    return { heads: [...document.querySelectorAll('.home-wave-icon, .home-wave-pin, .home-ask-tag')].filter(e => getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length).length, bodies: document.querySelectorAll('.home-body svg.db').length }; });
  ok(repaint.heads === 0 && repaint.bodies === 1, 'after a repaint that resets the page\'s classes: still one Dr. Smiley, the head hidden', repaint);
  ok(home.stageBody && !home.dock && home.breath === 'dbBreath' && home.images === 51, 'he is the stage for performances, the dock head stays away, he breathes', home);
  ok(!P.__errors.length, 'no page errors', P.__errors);

  // The hello's greet played on the rig (the drawn wave is one of its frames); a reaction reaches him through drPerform.
  const perf = await P.evaluate(() => new Promise(res => { const bd = window.homeBody.body; bd.stop(); bd.rest(); const seen = new Set();
    const played = drPerform('cheer', { priority: DR_P.REACT }); const t0 = performance.now();
    const tick = () => { for(const f of [bd.pose.frameL, bd.pose.frameR]) if(f) seen.add(f); if(bd.busy() && performance.now() - t0 < 5000) requestAnimationFrame(tick); else res({ played, seen: [...seen], busyAfter: bd.busy() }); }; requestAnimationFrame(tick); }));
  ok(perf.played && perf.seen.includes('cheer-up') && !perf.busyAfter, 'drPerform(cheer) plays on his body: the drawn fists up, then rest', perf);

  // A task state is his held state; its end lets him go.
  const task = await P.evaluate(() => new Promise(res => { drTask('processing', { key: 't' }); setTimeout(() => { const a = window.homeBody.body.stateName(), frames = [window.homeBody.body.pose.frameL, window.homeBody.body.pose.frameR];
    drTaskEnd('t'); setTimeout(() => res({ a, frames, b: window.homeBody.body.stateName(), level: window.homeBody.idle.level() }), 300); }, 1400); }));
  ok(task.a === 'thinking' && (task.frames[0] + task.frames[1]) === 'think' && task.b === null && task.level === 'full', 'Ask working: he thinks, the drawn finger on his chin; done: he lets go', task);

  // Scrolled off: the dock head comes back and his breathing pauses; back at the top it runs again.
  await P.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight)); await P.waitForTimeout(1200);
  const away = await P.evaluate(() => ({ dock: document.body.classList.contains('dock-has-smiley'), off: document.querySelector('.home-body').classList.contains('is-offscreen'), breath: [...document.querySelector('.home-body .db-breath').getAnimations()].map(a => a.playState), stage: !!(drStage() && drStage().body) }));
  ok(away.dock && away.off && away.breath.every(x => x === 'paused') && !away.stage, 'scrolled away: the dock head is back, his breathing pauses, the dock is the stage', away);
  await P.evaluate(() => window.scrollTo(0, 0)); await P.waitForTimeout(1200);
  const back = await P.evaluate(() => ({ dock: document.body.classList.contains('dock-has-smiley'), breath: [...document.querySelector('.home-body .db-breath').getAnimations()].map(a => a.playState) }));
  ok(!back.dock && back.breath.every(x => x === 'running'), 'back at the top: he breathes again and the dock head goes', back);

  // Still: one held pose, no breathing; a performance is its one frame.
  await P.evaluate(() => setSmileyMode('still')); await P.waitForTimeout(300);
  const still = await P.evaluate(() => new Promise(res => { const bd = window.homeBody.body; drPerform('cheer'); const a = JSON.stringify(bd.pose); setTimeout(() => res({ same: JSON.stringify(bd.pose) === a, frame: bd.pose.frameL || bd.pose.frameR, breath: getComputedStyle(document.querySelector('.home-body .db-breath')).animationName, mode: bd.mode() }), 500); }));
  ok(still.mode === 'still' && still.same && still.frame === 'cheer-up' && still.breath === 'none', 'Still: his cheer is one held frame, no breathing', still);
  await P.evaluate(() => setSmileyMode('lively')); await P.waitForTimeout(1300);

  // A tap on him opens Ask the Hub.
  const r = await P.evaluate(() => { const b = document.querySelector('.home-body').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height * .7]; });
  await P.mouse.click(r[0], r[1]); await P.waitForTimeout(700);
  ok(await P.evaluate(() => activeCategory === 'ask'), 'a tap on him opens Ask the Hub');
  await P.screenshot({ path: L.SHOTS + 'smiley-body-ask.png' });

  console.log('== a quiz, phone');
  await P.evaluate(() => setCategory('practice')); await P.waitForTimeout(800);
  await P.evaluate(() => startQuiz()); await P.waitForTimeout(1200);
  const quiz = await P.evaluate(() => { const h = document.querySelector('.quiz-dr'), r = h.getBoundingClientRect(), c = document.querySelector('.quiz-card').getBoundingClientRect(), q = document.querySelector('.quiz-question').getBoundingClientRect(), m = document.querySelector('.quiz-meta').getBoundingClientRect();
    return { mounted: h.dataset.dbMounted === '1', h: Math.round(r.height), inCard: r.right <= c.right + 1 && r.top >= c.top, questionBelow: q.top >= r.bottom - 1, metaBeside: m.right <= r.left + 1, dock: document.body.classList.contains('dock-has-smiley'), stage: !!(drStage() && drStage().body) }; });
  ok(quiz.mounted && quiz.h >= 100 && quiz.inCard && quiz.questionBelow && quiz.metaBeside && !quiz.dock && quiz.stage, 'in a quiz he stands in the card\'s corner, the question below his feet, the label beside him, the dock head away', quiz);
  await P.screenshot({ path: L.SHOTS + 'smiley-body-quiz.png' });
  const right = await P.evaluate(() => new Promise(res => { const svg0 = document.querySelector('.quiz-dr svg'); const seen = new Set(); answerQuiz(quizQuestions[quizIndex].a);
    const t0 = performance.now(); const tick = () => { const bd = drQuizMount && drQuizMount.body; if(bd){ if(bd.pose.frameLegs) seen.add(bd.pose.frameLegs); if(bd.pose.frameL || bd.pose.frameR) seen.add(bd.pose.frameL || bd.pose.frameR); }
      if(performance.now() - t0 < 2200) requestAnimationFrame(tick); else res({ seen: [...seen], sameSvg: document.querySelector('.quiz-dr svg') === svg0 || !!document.querySelector('.quiz-dr svg'), svgCount: document.querySelectorAll('svg.db').length }); }; requestAnimationFrame(tick); }));
  ok(right.seen.includes('crouch') && right.seen.includes('thumbs-up') && right.svgCount === 1, 'a right answer: the bounce on the drawn crouch with the thumbs-up, one body only', right);
  await P.waitForTimeout(2500);
  await P.evaluate(() => { rateConfidence('sure'); nextQuestion(); }); await P.waitForTimeout(900);
  const wrong = await P.evaluate(() => new Promise(res => { const q = quizQuestions[quizIndex]; const i = (q.a + 1) % q.o.length; const faces = new Set(); answerQuiz(i);
    const t0 = performance.now(); const tick = () => { if(drQuizMount) faces.add(drQuizMount.body.pose.face); if(performance.now() - t0 < 1500) requestAnimationFrame(tick); else res([...faces]); }; requestAnimationFrame(tick); }));
  ok(wrong.includes('worried'), 'a wrong answer: the wince (the worried face)', wrong);
  await P.waitForTimeout(2200);
  await P.evaluate(() => exitQuiz()); await P.waitForTimeout(800);
  const gone = await P.evaluate(() => ({ hosts: document.querySelectorAll('.quiz-dr').length, mount: !!drQuizMount, dock: document.body.classList.contains('dock-has-smiley') }));
  ok(gone.hosts === 0 && !gone.mount, 'leaving the quiz takes his body down with it', gone);
  ok(!P.__errors.length, 'no page errors', P.__errors);
  await ctx.close();

  console.log('== Home, computer');
  const { page: D, ctx: dctx } = await L.boot(b, { device: 'desktop', settle: 50 });
  await D.waitForSelector('#content.is-home .home-body', { timeout: 15000 }); await D.waitForTimeout(9000);
  const desk = await D.evaluate(() => { const h = document.querySelector('#content.is-home .home-body'), r = h.getBoundingClientRect(), g = document.querySelector('#content .home-greeting').getBoundingClientRect(), q = document.querySelector('#content .home-greeting-quote').getBoundingClientRect();
    return { isIn: h.classList.contains('is-in'), h: Math.round(r.height), inBanner: r.right <= g.right + 1 && r.bottom <= g.bottom + 1, quoteClear: q.right <= r.left + 1 }; });
  ok(desk.isIn && desk.h >= 220 && desk.inBanner && desk.quoteClear, 'on a computer he stands at the banner\'s right, clear of the quote', desk);
  await D.screenshot({ path: L.SHOTS + 'smiley-body-desktop.png' });
  await dctx.close();
  await b.close();
})();
