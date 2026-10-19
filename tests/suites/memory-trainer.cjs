/* The memory trainer (docs/features/memory-trainer.md, step M2): its entrance
   on the Practice dashboard, a line played with the words hidden through the
   phone's voice picked by name, Dr. Smiley listening and then thinking, the
   model rendering in chunks to tap, the record on the phone (three clean up,
   two with misses down, the span), Flag this line to the team and the phone,
   and leaving the screen stopping the voice. The phone's voices are stood in
   for, so this checks the trainer, not Chromium's own speech. A second boot
   has no voice at all; a third has no lines file. */
const L = require('../support/harness.cjs');
const O = L.OUT + 'memory-trainer/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 700))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const LINES = JSON.parse(require('fs').readFileSync(L.ROOT + 'memory/lines.json', 'utf8')).lines;

// Stand-in voices: a decoy Spanish voice first, then the two the trainer wants
// by name, then a novelty English voice; each utterance is logged with the
// voice it was given, and ends 350 ms after it starts.
function standIns(){
  window.__mt = { spoken: [], cancels: 0 };
  const voices = [{ name: 'Mónica', lang: 'es-ES', localService: true }, { name: 'Paulina', lang: 'es-MX', localService: true },
    { name: 'Bubbles', lang: 'en-US', localService: true }, { name: 'Samantha', lang: 'en-US', localService: true }];
  const synth = { _l: [], getVoices(){ return voices; }, cancel(){ window.__mt.cancels++; },
    addEventListener(t, f){ this._l.push(f); }, removeEventListener(t, f){ this._l = this._l.filter(x => x !== f); },
    speak(u){ window.__mt.spoken.push({ text: u.text, lang: u.lang, voice: u.voice && u.voice.name, rate: u.rate }); setTimeout(() => u.onstart && u.onstart(), 30); setTimeout(() => u.onend && u.onend(), 350); } };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  // The real utterance refuses a plain object as its voice; the stand-in takes anything.
  window.SpeechSynthesisUtterance = class { constructor(t){ this.text = t; this.lang = ''; this.rate = 1; this.voice = null; } };
}
function noVoice(){ Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); }

(async () => {
  const b = await L.chromium.launch();
  for (const [device, dark] of [['iphone', false], ['iphone', true], ['narrow', false], ['desktop', false]]) {
    const tag = device + (dark ? '-dark' : '');
    console.log('== ' + tag);
    const { ctx, page } = await L.boot(b, { device, dark, settle: 4000, init: standIns });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    // The entrance, on Practice, after the four ways in and before the week's board.
    await L.go(page, 'practice', 1200);
    const entry = await page.evaluate(() => {
      const e = document.querySelector('#content .mt-entry'), modes = document.querySelector('#content .study-modes'), board = document.querySelector('#content .board, #content .progress-card');
      if (!e) return { e: false };
      e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { e: true, text: e.innerText.replace(/\s+/g, ' ').trim(), h: Math.round(r.height), hit: !!hit && e.contains(hit),
        afterModes: !!modes && modes.compareDocumentPosition(e) === Node.DOCUMENT_POSITION_FOLLOWING, beforeBoard: !!board && e.compareDocumentPosition(board) === Node.DOCUMENT_POSITION_FOLLOWING };
    });
    ok(entry.e && /Hear a line, say it in the other language/.test(entry.text) && entry.afterModes && entry.beforeBoard, 'Practice: the Memory trainer card sits after the four ways in, before the week', entry);
    ok(entry.h >= 44 && entry.hit, 'Practice: the card takes the tap', entry);
    if (device === 'iphone' && !dark) await (await page.$('#content .mt-entry')).screenshot({ path: O + 'practice-entry.png' });

    await page.evaluate(() => document.querySelector('#content .mt-entry').click()); await wait(900);
    const open = await page.evaluate(() => ({ cat: activeCategory, h2: document.querySelector('#content h2') && document.querySelector('#content h2').textContent, stats: [...document.querySelectorAll('#content .mt-stat b')].map(x => x.textContent), line: MT.line && MT.line.id, lines: MT.lines && MT.lines.length, topbar: !!document.querySelector('.topbar:not([hidden])') }));
    ok(open.cat === 'memory-trainer' && open.h2 === 'Memory trainer' && open.lines === 60 && !!open.line, 'opens the trainer with the 60 lines loaded and a first line picked', open);
    ok(open.stats.join('|') === '—|—|0', 'a fresh phone: no span yet, no lines so far', open.stats);

    // A known line: discharge, English to Spanish, three chunks.
    await page.evaluate(() => mtNext('dc01')); await wait(300);
    const ready = await page.evaluate(() => {
      const eb = document.querySelector('#content .mt-eyebrow'), dir = document.querySelector('#content .mt-dir'), play = document.getElementById('mtPlay'), r = play.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { eb: eb && eb.textContent, dir: dir && dir.textContent, lead: document.querySelector('#content .mt-lead').innerText.replace(/\s+/g, ' '), w: Math.round(r.width), hit: !!hit && play.contains(hit),
        hidden: !document.querySelector('#content').innerText.includes('Keep the dressing dry'), notesOn: [...document.querySelectorAll('#content .mt-notes button')].map(x => x.getAttribute('aria-checked')) };
    });
    ok(ready.eb === 'Line 1 · Discharge · 11 words' && ready.dir === 'English → Spanish', 'ready: names the setting, the length and the direction', ready);
    ok(/The provider speaks in English\. Listen once, then say it in Spanish\./.test(ready.lead) && ready.hidden, 'ready: says who speaks; the words are not on screen', ready);
    ok(ready.w >= 44 && ready.hit && ready.notesOn.join(',') === 'true,false', 'ready: Play takes the tap; Memory only is the default', ready);
    if (device === 'iphone' || device === 'desktop') await page.screenshot({ path: O + tag + '-ready.png' });

    // Play: Samantha by name (not Bubbles, the first en-US voice), the words hidden, Dr. Smiley listening, the ring filling.
    await page.evaluate(() => document.getElementById('mtPlay').click()); await wait(150);
    const playing = await page.evaluate(() => ({ spoken: __mt.spoken, state: drState(), phase: MT.phase, dis: document.getElementById('mtPlay').disabled, ring: document.getElementById('mtPlay').classList.contains('is-playing'),
      dur: document.getElementById('mtPlay').style.getPropertyValue('--mt-dur'), hidden: !document.querySelector('#content').innerText.includes('Keep the dressing dry'), lead: document.querySelector('#content .mt-lead').innerText.replace(/\s+/g, ' ') }));
    ok(playing.spoken.length === 1 && playing.spoken[0].voice === 'Samantha' && playing.spoken[0].lang === 'en-US' && playing.spoken[0].rate === 0.92
      && playing.spoken[0].text === 'Keep the dressing dry for forty-eight hours, then you can shower.', 'play: the whole line, Samantha by name, en-US, rate 0.92', playing.spoken);
    ok(playing.phase === 'playing' && playing.state === 'attentive' && playing.dis && playing.ring && /^\d+ms$/.test(playing.dur) && playing.hidden && /Listening/.test(playing.lead), 'play: words hidden, Dr. Smiley listening, the ring runs on the line\'s length', playing);
    await wait(500);
    const turn = await page.evaluate(() => ({ phase: MT.phase, state: drState(), btns: [...document.querySelectorAll('#content .mt-acts .btn')].map(x => x.textContent.trim()), full: document.getElementById('mtPlay').classList.contains('is-full'),
      offset: getComputedStyle(document.querySelector('#content .mt-ring-fg')).strokeDashoffset, hidden: !document.querySelector('#content').innerText.includes('Keep the dressing dry') }));
    ok(turn.phase === 'turn' && turn.state === 'attentive' && turn.btns.join('|') === 'Play again|Done, show me' && turn.full && parseFloat(turn.offset) === 0 && turn.hidden, 'after the line: your turn, still listening, ring full, words still hidden', turn);

    // Play again counts a replay and speaks the same line; Done: he thinks, then the chunks.
    await page.evaluate(() => document.querySelector('#content .mt-acts .btn-ghost').click()); await wait(500);
    const again = await page.evaluate(() => ({ n: __mt.spoken.length, re: MT.replays, phase: MT.phase }));
    ok(again.n === 2 && again.re === 1 && again.phase === 'turn', 'Play again: a replay, counted', again);
    await page.evaluate(() => document.querySelector('#content .mt-acts .btn-primary').click()); await wait(150);
    const think = await page.evaluate(() => ({ phase: MT.phase, state: drState(), lead: document.querySelector('#content .mt-lead').innerText }));
    ok(think.phase === 'thinking' && think.state === 'processing' && /One moment/.test(think.lead), 'Done: Dr. Smiley thinks', think);
    await wait(800);
    const mark = await page.evaluate(() => {
      const chunks = [...document.querySelectorAll('#content button.mt-chunk')];
      const geo = chunks.map(c => { const r = c.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { h: Math.round(r.height), hit: !!hit && c.contains(hit), fs: parseFloat(getComputedStyle(c).fontSize) }; });
      return { phase: MT.phase, state: drState(), chunks: chunks.map(c => c.textContent), lang: document.querySelector('#content .mt-chunks').getAttribute('lang'), geo,
        save: document.getElementById('mtSave').textContent, said: document.querySelector('#content .mt-said p').textContent, saidOpen: document.querySelector('#content .mt-said').open,
        flag: !!document.querySelector('#content .mt-link'), fs16: [...document.querySelectorAll('#content input')].every(i => parseFloat(getComputedStyle(i).fontSize) >= 16) };
    });
    ok(mark.phase === 'mark' && mark.state !== 'processing' && mark.chunks.join('|') === 'Mantenga el vendaje seco|durante cuarenta y ocho horas,|y después se puede bañar.' && mark.lang === 'es', 'mark: the three Spanish chunks, Dr. Smiley done thinking', mark);
    ok(mark.geo.every(g => g.h >= 44 && g.hit && g.fs >= 17) && mark.save === 'All clean' && !mark.saidOpen && /Keep the dressing dry/.test(mark.said), 'mark: chunks 44px+ and tappable, 17px, "All clean", the source folded away', mark);
    await page.evaluate(() => document.querySelectorAll('#content button.mt-chunk')[1].click()); await wait(100);
    const tapped = await page.evaluate(() => ({ pressed: [...document.querySelectorAll('#content button.mt-chunk')].map(c => c.getAttribute('aria-pressed')), save: document.getElementById('mtSave').textContent, misses: MT.misses.slice(),
      struck: getComputedStyle(document.querySelectorAll('#content button.mt-chunk')[1]).textDecorationLine }));
    ok(tapped.pressed.join(',') === 'false,true,false' && tapped.save === 'Save: 1 missed' && tapped.misses.join() === '1' && /line-through/.test(tapped.struck), 'a tapped chunk is struck through and counted', tapped);
    if (device === 'iphone' || device === 'desktop') await page.screenshot({ path: O + tag + '-mark.png' });
    await page.evaluate(() => document.querySelector('#content .mt-hear').click()); await wait(100);
    const hear = await page.evaluate(() => __mt.spoken[__mt.spoken.length - 1]);
    ok(hear && hear.voice === 'Paulina' && hear.lang === 'es-MX' && hear.text === 'Mantenga el vendaje seco durante cuarenta y ocho horas, y después se puede bañar.', 'Hear the model: the Spanish, Paulina by name (not Mónica)', hear);

    await page.evaluate(() => document.getElementById('mtSave').click()); await wait(300);
    const done1 = await page.evaluate(() => { const st = JSON.parse(localStorage.getItem('ih_memTrainer')); return { phase: MT.phase, verdict: document.querySelector('#content .mt-verdict').textContent, note: document.querySelector('#content .mt-note').textContent,
      len: st.len, clean: st.clean, missed: st.missed, hist: st.hist, best: st.best, stillChunks: [...document.querySelectorAll('#content .mt-chunk')].map(c => c.tagName + ':' + c.getAttribute('aria-pressed')), stats: [...document.querySelectorAll('#content .mt-stat b')].map(x => x.textContent) }; });
    ok(done1.phase === 'done' && done1.verdict === '1 of 3 missed.' && /Another line with misses and the next one gets shorter/.test(done1.note), 'saved: "1 of 3 missed", warns the next miss shortens', done1);
    ok(done1.len === 8 && done1.clean === 0 && done1.missed === 1 && done1.hist.length === 1 && done1.hist[0].id === 'dc01' && done1.hist[0].miss === 1 && done1.hist[0].re === 1 && done1.hist[0].notes === false && done1.best.mem === 0, 'the record: one line, one miss, one replay, memory only, no span yet', done1);
    ok(done1.stillChunks.join(',') === 'SPAN:false,SPAN:true,SPAN:false' && done1.stats.join('|') === '—|—|1', 'done: the chunks shown still, the miss marked; one line so far', done1);
    if (device === 'iphone' || device === 'desktop') await page.screenshot({ path: O + tag + '-done.png' });

    // Three clean in a row on the Spanish starters: Paulina speaks, the length steps up, the span is set.
    const clean = async id => { await page.evaluate(id => mtNext(id), id); await wait(100); await page.evaluate(() => document.getElementById('mtPlay').click()); await wait(600);
      await page.evaluate(() => document.querySelector('#content .mt-acts .btn-primary').click()); await wait(900); await page.evaluate(() => document.getElementById('mtSave').click()); await wait(200);
      return page.evaluate(() => { const st = JSON.parse(localStorage.getItem('ih_memTrainer')); return { len: st.len, clean: st.clean, missed: st.missed, best: st.best, n: st.hist.length, lastDir: st.lastDir, verdict: document.querySelector('#content .mt-verdict').textContent, note: document.querySelector('#content .mt-note').textContent, spoken: __mt.spoken[__mt.spoken.length - 1] }; }); };
    const c1 = await clean('ff:constipado');
    ok(c1.spoken.voice === 'Paulina' && c1.spoken.lang === 'es-MX' && c1.spoken.text === 'Llevo tres días constipado.' && c1.verdict === 'Clean.' && /New span: 4 words, memory only/.test(c1.note) && c1.best.mem === 4 && c1.lastDir === 'es-en', 'a patient line: Paulina, clean, span 4', c1);
    const c2 = await clean('ff:embarazada');
    ok(c2.clean === 2 && c2.len === 8 && c2.best.mem === 4, 'two clean: not longer yet, span stays at the longest clean line', c2);
    const c3 = await clean('dc01');
    ok(c3.len === 11 && c3.clean === 0 && c3.best.mem === 11 && /Three clean in a row: the next line is longer, about 11 words/.test(c3.note) && c3.n === 4, 'three clean: 8 -> 11 words, span 11, says so', c3);
    const picked = await page.evaluate(() => { const ws = []; for (let i = 0; i < 12; i++){ mtPickNew(); ws.push(MT.line.words); } return ws; });
    ok(picked.every(w => Math.abs(w - 11) <= 4), 'the next lines are picked near the new length', picked);

    // Two with misses in a row: shorter. With notes: that span is kept apart.
    await page.evaluate(() => mtNotes(true)); await wait(100);
    const lost = async id => { await page.evaluate(id => mtNext(id), id); await wait(100); await page.evaluate(() => document.getElementById('mtPlay').click()); await wait(600);
      await page.evaluate(() => document.querySelector('#content .mt-acts .btn-primary').click()); await wait(900); await page.evaluate(() => document.querySelector('#content .mt-acts .btn-ghost').click()); await wait(200);
      return page.evaluate(() => { const st = JSON.parse(localStorage.getItem('ih_memTrainer')); return { len: st.len, missed: st.missed, best: st.best, notes: st.notes, last: st.hist[st.hist.length - 1], verdict: document.querySelector('#content .mt-verdict').textContent, note: document.querySelector('#content .mt-note').textContent }; }); };
    const m1 = await lost('dc02');
    ok(m1.notes === true && m1.last.notes === true && m1.last.miss === 3 && m1.last.n === 3 && m1.verdict === '3 of 3 missed.' && m1.len === 11, 'I lost it: every chunk missed, with notes, not shorter yet', m1);
    const m2 = await lost('dc02');
    ok(m2.len === 8 && m2.missed === 0 && /Two in a row with misses: the next line is shorter, about 8 words/.test(m2.note) && m2.best.mem === 11 && m2.best.notes === 0, 'two with misses: 11 -> 8 words; the memory-only span untouched', m2);
    const c4 = await clean('ff:constipado');
    ok(c4.best.notes === 4 && c4.best.mem === 11 && /New span: 4 words, with notes/.test(c4.note), 'a clean line with notes sets the with-notes span, apart', c4);
    const notesLocked = await page.evaluate(async () => { mtNext('dc01'); await new Promise(r => setTimeout(r, 50)); document.getElementById('mtPlay').click(); await new Promise(r => setTimeout(r, 100)); return [...document.querySelectorAll('#content .mt-notes button')].map(b => b.disabled); });
    ok(notesLocked.every(Boolean), 'the notes toggle is locked while a line is in play', notesLocked);
    await wait(600);

    // Flag this line: what's wrong plus a note, to memory-flags and kept on the phone.
    await page.evaluate(() => document.querySelector('#content .mt-acts .btn-primary').click()); await wait(900);
    await page.evaluate(() => document.querySelector('#content .mt-link').click()); await wait(200);
    const form = await page.evaluate(() => ({ opts: [...document.querySelectorAll('#mtFlag .mt-flag-opt')].map(x => x.textContent), send: document.getElementById('mtFlagSend').disabled,
      geo: [...document.querySelectorAll('#mtFlag button, #mtFlag input')].map(x => Math.round(x.getBoundingClientRect().height)), fs: parseFloat(getComputedStyle(document.getElementById('mtFlagNote')).fontSize) }));
    ok(form.opts.length === 4 && form.send && form.geo.every(h => h >= 44) && form.fs >= 16, 'Flag this line: four reasons, Send waits for one, 44px, 16px input', form);
    await page.evaluate(() => mtFlagKind('spanish')); await page.fill('#mtFlagNote', 'bañar sounds like bathing, ducharse?');
    if (device === 'iphone' && !dark) await page.screenshot({ path: O + 'flag.png' });
    await page.evaluate(() => document.getElementById('mtFlagSend').click()); await wait(600);
    const flagged = await page.evaluate(() => { const coll = __DB['memory-flags'] || {}; const ids = Object.keys(coll); const local = JSON.parse(localStorage.getItem('ih_memFlags') || '[]');
      return { ids, doc: ids.length ? coll[ids[0]] : null, local, link: document.querySelector('#content .mt-link').textContent, dis: document.querySelector('#content .mt-link').disabled }; });
    ok(flagged.ids.length === 1 && /^dc01__/.test(flagged.ids[0]) && flagged.doc.lineId === 'dc01' && flagged.doc.kind === 'spanish' && flagged.doc.note === 'bañar sounds like bathing, ducharse?' && flagged.doc.by === 'Jose' && flagged.doc.dir === 'en-es' && /Keep the dressing/.test(flagged.doc.src) && /Mantenga/.test(flagged.doc.tgt),
      'the flag reaches memory-flags: line, reason, note, who, both texts', flagged);
    ok(flagged.local.length === 1 && flagged.local[0].lineId === 'dc01' && flagged.link === 'Flagged ✓' && flagged.dis, 'the flag is kept on the phone too; the button says Flagged', flagged);

    // Leaving mid-line: the voice is cut, Dr. Smiley let go, the line waits in Ready.
    await page.evaluate(() => { mtNext('dc02'); }); await wait(100);
    const cancelsBefore = await page.evaluate(() => __mt.cancels);
    await page.evaluate(() => document.getElementById('mtPlay').click()); await wait(100);
    await L.go(page, 'practice', 500);
    const left = await page.evaluate(() => ({ cancels: __mt.cancels, state: drState(), phase: MT.phase, cat: activeCategory }));
    ok(left.cancels > cancelsBefore && left.state !== 'attentive' && left.phase === 'ready' && left.cat === 'practice', 'leaving while it plays: speech cancelled, Dr. Smiley free, the line back to Ready', left);
    const entry2 = await page.evaluate(() => document.querySelector('#content .mt-entry').innerText.replace(/\s+/g, ' '));
    ok(/Your span: 11 words, memory only/.test(entry2) && /11 WORDS|11 words/.test(entry2), 'Practice card now shows the span', entry2);
    await wait(500);
    // Every control on the trainer screen, scrolled into view: 44px tall and the tap reaches it (the global top bar is not this screen's).
    await L.go(page, 'memory-trainer', 600);
    const geo = await page.evaluate(() => [...document.querySelectorAll('#content button, #content summary, #content input')].filter(x => x.offsetParent).map(x => {
      x.scrollIntoView({ block: 'center' }); const r = x.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { t: x.textContent.trim().slice(0, 24), h: Math.round(r.height), hit: !!hit && (hit === x || x.contains(hit)) }; }).concat([{ t: 'sideways', h: 44, hit: document.documentElement.scrollWidth <= innerWidth }]));
    ok(geo.length >= 6 && geo.every(g => g.h >= 44 && g.hit), 'trainer screen: every control 44px+ and taking its tap, no sideways scroll', geo.filter(g => g.h < 44 || !g.hit));
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== guide');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', settle: 3000, init: standIns });
    const g = await page.evaluate(() => ({ topic: GUIDE_TOPICS.find(t => t.id === 'memtrainer'), news: GUIDE_NEWS[0].id, steps: !!GUIDE_STEPS.memtrainer, coach: GUIDE_COACH[GUIDE_SHOW.memtrainer], vc: GUIDE_TOPICS.find(t => t.id === 'voicecheck').a }));
    ok(g.topic && g.topic.section === 'study' && /Flag this line/.test(g.topic.a) && /Memory only/.test(g.topic.a), 'the guide answers "What is the Memory trainer?"', g.topic && g.topic.q);
    ok(g.news === 'memtrainer' && g.steps && g.coach && g.coach.page === 'practice' && g.coach.sel[0] === '.mt-entry', 'New lately leads with it; drawn steps and Show me point at the Practice card', g);
    ok(/Memory trainer/.test(g.vc) && !/getting things ready/.test(g.vc), 'the Voice and mic check answer now points at the trainer', g.vc);
    await page.evaluate(() => guideShowMe(GUIDE_SHOW.memtrainer)); await wait(1500);
    const shown = await page.evaluate(() => ({ cat: activeCategory, coaching: document.body.classList.contains('gd-coaching'), entry: !!document.querySelector('#content .mt-entry') }));
    ok(shown.cat === 'practice' && shown.entry && shown.coaching, 'Show me opens Practice with the card there, coaching', shown);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }

  console.log('== no voice');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', settle: 3000, init: noVoice });
    await L.go(page, 'memory-trainer', 900);
    await page.evaluate(() => mtNext('dc01')); await wait(200);
    await page.evaluate(() => document.getElementById('mtPlay').click()); await wait(150);
    const shown = await page.evaluate(() => ({ phase: MT.phase, text: document.querySelector('#content .mt-shown') && document.querySelector('#content .mt-shown').textContent, lead: document.querySelector('#content .mt-lead').innerText.replace(/\s+/g, ' ') }));
    ok(shown.phase === 'playing' && /Keep the dressing dry/.test(shown.text) && /Read it, then look away/.test(shown.lead), 'no voice: the line is shown to read for as long as it would take to say', shown);
    await wait(7000);
    const after = await page.evaluate(() => ({ phase: MT.phase, text: !!document.querySelector('#content .mt-shown'), hidden: !document.querySelector('#content').innerText.includes('Keep the dressing dry') }));
    ok(after.phase === 'turn' && !after.text && after.hidden, 'then it is hidden again and it is your turn', after);
    await page.evaluate(() => document.querySelector('#content .mt-acts .btn-primary').click()); await wait(900);
    await page.evaluate(() => document.querySelector('#content .mt-hear').click()); await wait(200);
    const toast = await page.evaluate(() => document.body.innerText.includes('This phone can’t read aloud.'));
    ok(toast, 'Hear the model without a voice says so', toast);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }

  console.log('== no lines file');
  { process.env.LINES = 'missing';
    const { ctx, page } = await L.boot(b, { device: 'iphone', settle: 3000, init: standIns });
    await L.go(page, 'memory-trainer', 1200);
    const s = await page.evaluate(() => ({ lines: MT.lines, err: MT.loadErr, line: MT.line && MT.line.id, notice: document.querySelector('#content .mt-notice') && document.querySelector('#content .mt-notice').textContent, pool: mtPool().length }));
    ok(s.lines === null && s.err && /^ff:/.test(s.line) && /short starters/.test(s.notice) && s.pool === 101, 'without the file: the starters play, a notice says the longer lines are missing', s);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); delete process.env.LINES; }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; });
