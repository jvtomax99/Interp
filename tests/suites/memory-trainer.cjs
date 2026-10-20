/* The memory trainer (docs/features/memory-trainer.md, step M2): the way in
   from Practice, the home card, a round (listen with the words hidden, your
   turn, the chunks to tap), Dr. Smiley's listening and thinking states, the
   longer/shorter steps, progress kept on the phone, Flag this line saved to
   terminology-meta/memory-flags, and the voice stopping when you leave. The
   phone's voices are stood in for (Paulina, Samantha and a novelty voice), and
   a line "ends" after 200 ms, so this checks the trainer, not Chromium's audio. */
const L = require('../support/harness.cjs');
const fs = require('fs');
const O = L.OUT + 'memory-trainer/'; fs.mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const LINES = fs.readFileSync(L.ROOT + 'memory/lines.json', 'utf8');

function standIns(){
  window.__mt = { spoken: [], cancels: 0 };
  const voices = [{ name: 'Bubbles', lang: 'en-US', localService: true, default: true }, { name: 'Samantha', lang: 'en-US', localService: true },
    { name: 'Mónica', lang: 'es-ES', localService: true }, { name: 'Paulina', lang: 'es-MX', localService: true }];
  const synth = { _l: [], getVoices(){ return voices; }, cancel(){ window.__mt.cancels++; const u = this._u; this._u = null; if(u){ clearTimeout(u._t); u.onerror && u.onerror({ error: 'canceled' }); } },
    addEventListener(t, f){ this._l.push(f); }, removeEventListener(t, f){ this._l = this._l.filter(x => x !== f); },
    speak(u){ this._u = u; window.__mt.spoken.push({ text: u.text, voice: u.voice && u.voice.name, lang: u.lang, rate: u.rate });
      u._t = setTimeout(() => { if(this._u === u){ this._u = null; u.onend && u.onend(); } }, window.__mtHold ? 1e9 : 200); } };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  // A mic whose tracks count their stops, a recorder that makes 4 KB, an
  // audio session that remembers its type, playback that records its source.
  Object.assign(window.__mt, { gum: 0, stopped: 0, played: [], revoked: 0 });
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => { window.__mt.gum++;
    if (window.__mtDeny) throw Object.assign(new Error('no'), { name: 'NotAllowedError' });
    return { getTracks: () => [{ stop(){ window.__mt.stopped++; } }] }; } }, configurable: true });
  window.MediaRecorder = class { constructor(s, o){ this.mimeType = (o && o.mimeType) || ''; this.state = 'inactive'; }
    static isTypeSupported(t){ return t === 'audio/mp4'; }
    start(){ this.state = 'recording'; }
    stop(){ this.state = 'inactive'; setTimeout(() => { this.ondataavailable({ data: new Blob([new Uint8Array(4096)], { type: 'audio/mp4' }) }); this.onstop(); }, 30); } };
  window.Audio = class { constructor(u){ this.src = u; window.__mt.played.push(u); } play(){ return Promise.resolve(); } pause(){} };
  Object.defineProperty(navigator, 'audioSession', { value: { type: 'auto' }, configurable: true });
  const rv = URL.revokeObjectURL.bind(URL); URL.revokeObjectURL = u => { window.__mt.revoked++; rv(u); };
  window.SpeechSynthesisUtterance = class { constructor(t){ this.text = t; this.voice = null; this.lang = ''; this.rate = 1; } };
}

(async () => {
  const b = await L.chromium.launch();
  for (const [device, dark] of [['iphone', false], ['iphone', true], ['desktop', false]]) {
    const tag = device + (dark ? '-dark' : '');
    console.log('== ' + tag);
    const { ctx, page } = await L.boot(b, { device, dark, settle: 4000, init: standIns });
    await page.route('**/memory/lines.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: LINES }));
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    // The way in, on Practice.
    await L.go(page, 'practice', 1500);
    const entry = await page.evaluate(() => { const t = document.querySelector('.mem-entry'), go = t && t.querySelector('.mem-go');
      go && go.scrollIntoView({ block: 'center' }); const r = go && go.getBoundingClientRect(); const hit = go && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const modes = document.querySelector('.study-modes');
      return { has: !!t, label: go && go.textContent.trim(), h: r && Math.round(r.height), hit: !!hit && go.contains(hit),
        afterModes: !!t && !!modes && modes.compareDocumentPosition(t) === Node.DOCUMENT_POSITION_FOLLOWING, sideways: document.documentElement.scrollWidth - innerWidth }; });
    ok(entry.has && entry.label === 'Start' && entry.afterModes, 'Practice: the Memory trainer tile sits after the ways in', entry);
    ok(entry.h >= 44 && entry.hit && entry.sideways <= 0, 'Practice: its Start is 44px+ and takes the tap, no sideways scroll', entry);
    if (!dark && device === 'iphone') await page.screenshot({ path: O + 'practice-entry.png' });

    await page.evaluate(() => document.querySelector('.mem-entry .mem-go').click()); await wait(900);
    const home = await page.evaluate(() => { const s = document.querySelector('.mem-start');
      const btns = [...document.querySelectorAll('#content .mem-card button, #content .mem-notes')].map(x => { x.scrollIntoView({ block: 'center' }); const q = x.getBoundingClientRect();
        const hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { t: x.textContent.trim().slice(0, 30), h: Math.round(q.height), hit: !!hit && x.contains(hit) }; });
      return { cat: activeCategory, lines: MEM.lines && MEM.lines.length, start: s && s.textContent.trim(), dis: s && s.disabled,
        seg: [...document.querySelectorAll('.mem-seg button')].map(x => x.getAttribute('aria-checked')), notes: document.querySelector('.mem-notes input').checked,
        sideways: document.documentElement.scrollWidth - innerWidth, btns }; });
    ok(home.cat === 'memory' && home.lines === 60 && home.start === 'Start' && !home.dis, 'opens its own screen with the 60 lines loaded, Start ready', home);
    ok(home.seg.join() === 'true,false,false' && !home.notes, 'defaults: both ways, notes off (memory only)', home);
    ok(home.btns.every(x => x.h >= 40 && x.hit) && home.sideways <= 0, 'every control 40px+ and takes its own tap, no sideways scroll', home.btns);
    if (device === 'iphone') { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: O + tag + '-home.png' }); }

    // A round, towards Spanish: Samantha reads it (not the novelty default).
    await page.evaluate(() => { window.__mtHold = true; document.querySelectorAll('.mem-seg button')[1].click(); }); await wait(200);
    await page.evaluate(() => document.querySelector('.mem-start').click()); await wait(300);
    const listen = await page.evaluate(() => { const L = MEM.line, t = document.getElementById('content').textContent;
      return { stage: MEM.stage, dir: L.dir, spoken: __mt.spoken.slice(-1)[0], src: L.u.map(c => c[0]).join(' '), hidden: !L.u.some(c => t.includes(c[0]) || t.includes(c[1])),
        ring: !!document.querySelector('.mem-ring-arc'), off: getComputedStyle(document.querySelector('.mem-ring-arc')).strokeDashoffset, dr: document.documentElement.dataset.drState }; });
    ok(listen.stage === 'listen' && listen.dir === 'en-es' && listen.spoken.voice === 'Samantha' && listen.spoken.text === listen.src && listen.spoken.rate === 0.92,
      'Start reads an English line with Samantha at 0.92', listen);
    ok(listen.hidden && listen.ring, 'while it plays, neither the line nor the rendering is on screen; the ring is', listen);
    ok(listen.dr === 'attentive', 'Dr. Smiley listens while the line plays', listen.dr);
    if (device === 'iphone' && !dark) await page.screenshot({ path: O + 'listen.png' });
    // A repaint for another reason (chat arriving) keeps the ring where it is.
    await page.evaluate(() => { window.__arc = document.querySelector('.mem-ring-arc'); renderContent(); });
    ok(await page.evaluate(() => window.__arc === document.querySelector('.mem-ring-arc')), 'a repaint that draws the same thing leaves the ring alone');

    await page.evaluate(() => { const u = speechSynthesis._u; speechSynthesis._u = null; u.onend(); }); await wait(200);
    const turn = await page.evaluate(() => ({ stage: MEM.stage, txt: document.querySelector('.mem-ring-in').textContent.trim(), dr: document.documentElement.dataset.drState }));
    ok(turn.stage === 'turn' && /Your turn\s*Say it in Spanish/.test(turn.txt) && turn.dr === 'processing', 'when it ends: "Your turn, say it in Spanish", Dr. Smiley thinks', turn);
    if (device === 'iphone') await page.screenshot({ path: O + tag + '-turn.png' });

    await page.evaluate(() => [...document.querySelectorAll('.mem-go')].find(x => /Show the rendering/.test(x.textContent)).click()); await wait(300);
    const check = await page.evaluate(() => { const L = MEM.line, ch = [...document.querySelectorAll('.mem-chunk')];
      return { stage: MEM.stage, n: ch.length, want: L.u.length, model: ch.map(x => x.querySelector('.mem-model').textContent).join('|') === L.u.map(c => c[1]).join('|'),
        next: document.getElementById('memNext').textContent, dr: document.documentElement.dataset.drState || '', sideways: document.documentElement.scrollWidth - innerWidth }; });
    ok(check.stage === 'check' && check.n === check.want && check.model && check.next === 'All clean · next line', 'Show the rendering: one button per meaning chunk, model text, "All clean"', check);
    ok(check.sideways <= 0, 'chunks fit the width', check);
    await page.evaluate(() => document.querySelector('.mem-chunk').click()); await wait(100);
    const tapped = await page.evaluate(() => ({ p: document.querySelector('.mem-chunk').getAttribute('aria-pressed'), next: document.getElementById('memNext').textContent,
      bg: getComputedStyle(document.querySelector('.mem-chunk')).backgroundColor }));
    ok(tapped.p === 'true' && tapped.next === 'Next line · 1 missed', 'tapping a chunk marks it missed', tapped);
    if (device === 'iphone') { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: O + tag + '-check.png' }); }

    // Flag this line: a reason, a note, sent to the shared doc.
    await page.evaluate(() => [...document.querySelectorAll('.mem-foot .link-btn')].find(x => /Flag this line/.test(x.textContent)).click()); await wait(300);
    const ta = await page.evaluate(() => { const t = document.getElementById('memFlagText'); return t && getComputedStyle(t).fontSize; });
    ok(ta === '16px', 'the flag box is 16px (no iPhone zoom)', ta);
    await page.evaluate(() => document.querySelector('.mem-flag-chip').click());
    await page.fill('#memFlagText', 'Should be "vendaje"');
    await page.evaluate(() => renderContent()); // a repaint mid-typing keeps the text
    ok(await page.evaluate(() => document.getElementById('memFlagText').value) === 'Should be "vendaje"', 'a repaint while typing keeps what you typed');
    if (device === 'iphone' && !dark) { await page.evaluate(() => document.querySelector('.mem-flag').scrollIntoView({ block: 'center' })); await page.screenshot({ path: O + 'flag.png' }); }
    await page.evaluate(() => [...document.querySelectorAll('.mem-flag .btn-primary')][0].click()); await wait(1500);
    const flag = await page.evaluate(() => { const line = MEM.line.id, d = (__DB['terminology-meta'] || {})['memory-flags'] || {}, f = Object.values(d.flags || {});
      return { line, f, local: JSON.parse(localStorage.getItem('ih_memFlags') || '[]'), btn: document.querySelector('.mem-flag-btn').textContent }; });
    ok(flag.f.length === 1 && flag.f[0].line === flag.line && flag.f[0].reasons[0] === 'The Spanish is wrong' && flag.f[0].what === 'Should be "vendaje"' && flag.f[0].src && flag.f[0].model,
      'Send flag saves line id, reason and note to terminology-meta/memory-flags', flag.f);
    ok(flag.local.length === 1 && flag.local[0].sent === true && flag.btn === 'Flagged, thanks', 'kept on the phone, marked sent; the button says it was flagged', { local: flag.local, btn: flag.btn });

    // Next: scored as a miss, the next line plays straight from the tap.
    await page.evaluate(() => { window.__mtHold = false; document.getElementById('memNext').click(); }); await wait(100);
    const next = await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('ih_memory')); return { stage: MEM.stage, log: p.log.length, miss: p.miss, last: p.log[0], spoken: __mt.spoken.length }; });
    ok(next.stage === 'listen' && next.log === 1 && next.miss === 1 && next.last.miss === 1 && next.last.notes === false && next.spoken >= 2, 'Next line: the miss is saved on the phone, the next line starts', next);

    // The ladder: three clean in a row, longer; two misses in a row, shorter.
    const ladder = await page.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms)), out = [];
      const round = async miss => { await w(300); memReveal(); if (miss) memToggleChunk(0); memNext(); };
      const lv0 = MEM.p.level;
      for (let i = 0; i < 3; i++) await round(false);
      out.push({ level: MEM.p.level, msg: MEM.msg, clean: MEM.p.clean });
      await round(true); await round(true);
      out.push({ level: MEM.p.level, msg: MEM.msg });
      return { lv0, out, best: MEM.p.best, words: MEM.p.log.slice(1, 4).map(x => x.w) };
    });
    ok(ladder.out[0].level === Math.max(ladder.lv0, ladder.words[2]) + 3 && /Three clean in a row/.test(ladder.out[0].msg) && ladder.out[0].clean === 0, 'three clean in a row: the level goes up 3 words', ladder);
    ok(ladder.out[1].level < ladder.out[0].level && /Two misses in a row/.test(ladder.out[1].msg), 'two misses in a row: shorter', ladder);
    ok(ladder.best.mem === Math.max(...ladder.words) && !ladder.best.notes, 'your span: the longest clean line, memory only', ladder.best);

    // Notes on, Spanish to English: Paulina, and the span is kept apart.
    await page.evaluate(() => { memStop(); }); await wait(200);
    await page.evaluate(() => { document.querySelector('.mem-notes input').click(); }); await wait(200);
    await page.evaluate(() => { document.querySelectorAll('.mem-seg button')[2].click(); }); await wait(200);
    await page.evaluate(() => document.querySelector('.mem-start').click()); await wait(50);
    const es = await page.evaluate(() => ({ dir: MEM.line.dir, voice: __mt.spoken.slice(-1)[0].voice, notes: MEM.p.notes, hint: document.querySelector('.mem-hint').textContent }));
    ok(es.dir === 'es-en' && es.voice === 'Paulina' && es.notes && es.hint === 'Take your notes.', 'notes on, to English: Paulina reads, "Take your notes"', es);
    await wait(300); await page.evaluate(() => { memReveal(); memNext(); }); await wait(50);
    const nb = await page.evaluate(() => ({ best: MEM.p.best, last: MEM.p.log.slice(-1)[0] }));
    ok(nb.last.notes === true && nb.best.notes === nb.last.w, 'a clean line with notes counts toward the notes span', nb);

    // Leaving stops the voice, ends Dr. Smiley's task, keeps progress.
    await page.evaluate(() => { window.__mtHold = true; memStop(); memStart(); }); await wait(100);
    const c0 = await page.evaluate(() => __mt.cancels);
    await page.evaluate(() => goBack()); await wait(600);
    const left = await page.evaluate(() => ({ cat: activeCategory, cancels: __mt.cancels, stage: MEM.stage, utter: memUtter, dr: document.documentElement.dataset.drState || '' }));
    ok(left.cat !== 'memory' && left.cancels > c0 && left.stage === 'home' && left.utter === null && !/attentive|processing/.test(left.dr), 'Back stops the voice and Dr. Smiley stops listening', left);
    await page.reload(); await wait(3500);
    const kept = await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('ih_memory')); return { log: p.log.length, notes: p.notes, dir: p.dir }; });
    ok(kept.log === 7 && kept.notes === true && kept.dir === 'es-en', 'progress and settings survive a reload', kept);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== Record me (M3)');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', settle: 4000, init: standIns });
    await page.route('**/memory/lines.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: LINES }));
    await page.evaluate(() => openMemoryTrainer()); await wait(800);
    const off = await page.evaluate(() => { const i = document.querySelectorAll('.mem-notes input'); return { n: i.length, rec: i[1] && i[1].checked }; });
    ok(off.n === 2 && off.rec === false, 'Record me is there and off by default', off);
    await page.evaluate(() => { window.__mtHold = true; document.querySelectorAll('.mem-seg button')[1].click(); }); await wait(150);
    await page.evaluate(() => document.querySelectorAll('.mem-notes input')[1].click()); await wait(150);
    await page.evaluate(() => document.querySelector('.mem-start').click()); await wait(200);
    const during = await page.evaluate(() => ({ gum: __mt.gum, stage: MEM.stage }));
    ok(during.gum === 0 && during.stage === 'listen', 'the mic stays shut while the line plays', during);
    await page.evaluate(() => { const u = speechSynthesis._u; speechSynthesis._u = null; u.onend(); }); await wait(1300);
    const turn = await page.evaluate(() => ({ gum: __mt.gum, rec: (document.querySelector('.mem-rec') || {}).textContent, type: navigator.audioSession.type, state: MEMREC.state }));
    ok(turn.gum === 1 && /^Recording 0:0[1-2]$/.test(turn.rec) && turn.type === 'play-and-record', 'your turn: the mic opens, "Recording" with the seconds', turn);
    await page.screenshot({ path: O + 'rec-turn.png' });
    await page.evaluate(() => [...document.querySelectorAll('.mem-go')].find(x => /Show the rendering/.test(x.textContent)).click()); await wait(300);
    const chk = await page.evaluate(() => { const back = document.querySelector('.mem-back');
      const btns = back ? [...back.querySelectorAll('button')].map(x => { const r = x.getBoundingClientRect(), h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { t: x.textContent, h: Math.round(r.height), hit: !!h && x.contains(h) }; }) : [];
      return { stopped: __mt.stopped, type: navigator.audioSession.type, url: !!MEMREC.url, btns, sideways: document.documentElement.scrollWidth - innerWidth }; });
    ok(chk.stopped === 1 && chk.type === 'playback' && chk.url, 'Show the rendering: the mic is let go, the audio session back to playback, the take kept', chk);
    ok(chk.btns.map(x => x.t).join() === 'Mine,Model' && chk.btns.every(x => x.h >= 44 && x.hit) && chk.sideways <= 0, 'Listen back: Mine and Model, 44px, each takes its tap', chk.btns);
    await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: O + 'rec-check.png' });
    await page.evaluate(() => document.querySelector('.mem-back .btn').click()); await wait(100);
    const mine = await page.evaluate(() => ({ played: __mt.played.slice(-1)[0], url: MEMREC.url }));
    ok(mine.played === mine.url, 'Mine plays your take', mine);
    await page.evaluate(() => document.querySelectorAll('.mem-back .btn')[1].click()); await wait(100);
    const model = await page.evaluate(() => ({ s: __mt.spoken.slice(-1)[0], want: MEM.line.u.map(c => c[1]).join(' ') }));
    ok(model.s.text === model.want && model.s.voice === 'Paulina', 'Model reads the rendering in Spanish with Paulina', model);
    await page.evaluate(() => document.getElementById('memNext').click()); await wait(100);
    const next = await page.evaluate(() => ({ url: MEMREC.url, revoked: __mt.revoked, gum: __mt.gum, stage: MEM.stage }));
    ok(next.url === '' && next.revoked === 1 && next.gum === 1 && next.stage === 'listen', 'Next line drops the take; the mic stays shut while the next one plays', next);
    // Leaving mid-turn lets go of the mic.
    await page.evaluate(() => { const u = speechSynthesis._u; speechSynthesis._u = null; u.onend(); }); await wait(500);
    await page.evaluate(() => goBack()); await wait(400);
    const left = await page.evaluate(() => ({ stopped: __mt.stopped, stream: MEMREC.stream, rec: MEMREC.rec, type: navigator.audioSession.type }));
    ok(left.stopped === 2 && left.stream === null && left.rec === null && left.type === 'playback', 'Back during your turn releases the mic', left);
    // Mic refused: says so, the round goes on.
    await page.evaluate(() => { window.__mtDeny = true; openMemoryTrainer(); }); await wait(600);
    await page.evaluate(() => document.querySelector('.mem-start').click()); await wait(100);
    await page.evaluate(() => { const u = speechSynthesis._u; speechSynthesis._u = null; u.onend(); }); await wait(300);
    const den = await page.evaluate(() => ({ t: (document.querySelector('.mem-rec') || {}).textContent, show: !!document.querySelector('.mem-go'), type: navigator.audioSession.type }));
    ok(/mic was refused/.test(den.t) && den.show && den.type === 'playback', 'mic refused: says so, Show the rendering still there', den);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }

  console.log('== no speech on this browser');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', settle: 4000, init: () => { delete window.speechSynthesis; delete Window.prototype.speechSynthesis; } });
    await page.route('**/memory/lines.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: LINES }));
    await page.evaluate(() => openMemoryTrainer()); await wait(800);
    await page.evaluate(() => document.querySelector('.mem-start').click()); await wait(200);
    const r = await page.evaluate(() => ({ stage: MEM.stage, read: (document.querySelector('.mem-read') || {}).textContent, src: MEM.line.u.map(c => c[0]).join(' ') }));
    ok(r.stage === 'read' && r.read === r.src, 'without speech, the line is shown to read once, then hidden', r);
    await page.evaluate(() => document.querySelector('.mem-go').click()); await wait(100);
    ok(await page.evaluate(() => MEM.stage === 'turn' && !document.querySelector('.mem-read')), 'Hide, my turn hides it');
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }

  console.log('== lines fail to load');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', settle: 4000, init: standIns });
    let n = 0;
    await page.route('**/memory/lines.json', r => (++n === 1 ? r.fulfill({ status: 503, body: '' }) : r.fulfill({ status: 200, contentType: 'application/json', body: LINES })));
    await page.evaluate(() => openMemoryTrainer()); await wait(800);
    const e = await page.evaluate(() => ({ btn: document.querySelector('.mem-start').textContent.trim(), msg: !!document.querySelector('.mem-small') }));
    ok(e.btn === 'Try again' && e.msg, 'a failed load says so and offers Try again', e);
    await page.evaluate(() => document.querySelector('.mem-start').click()); await wait(800);
    ok(await page.evaluate(() => document.querySelector('.mem-start').textContent.trim() === 'Start' && MEM.lines.length === 60), 'Try again loads them');
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exit(1); });
