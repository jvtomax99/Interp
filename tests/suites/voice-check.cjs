/* The Voice and mic check at the bottom of More (docs/features/memory-trainer.md,
   step M0): it opens from More, finds the voices, plays a line, records 5 s
   and plays it back on a tap, turns speech into text, copies a report, and
   lets go of the mic on close. The phone's voices, mic and speech-to-text
   are stood in for, so this checks the sheet, not Chromium's own audio. A
   second run takes them away: each step must say "not available". */
const L = require('../support/harness.cjs');
const O = L.OUT + 'voice-check/'; require('fs').mkdirSync(O, { recursive: true });
const ok = (c, m, d) => { console.log((c ? '  PASS ' : '  FAIL ') + m + (c || d === undefined ? '' : ' ' + JSON.stringify(d).slice(0, 600))); if (!c) process.exitCode = 1; };
const wait = ms => new Promise(r => setTimeout(r, ms));

// Stand-ins: two Spanish voices and one English, a mic whose tracks count
// their stops, a recorder that makes 4 KB of audio/mp4, playback that ends,
// and a recognizer that hears one phrase.
function standIns(){
  window.__vc = { stopped: 0, spoken: [], heard: [] };
  const voices = [{ name: 'Paulina', lang: 'es-MX', localService: true }, { name: 'Mónica', lang: 'es_ES', localService: true }, { name: 'Samantha', lang: 'en-US', localService: true }];
  const synth = { _v: [], _l: [], getVoices(){ return this._v; }, cancel(){},
    addEventListener(t, f){ this._l.push(f); }, removeEventListener(t, f){ this._l = this._l.filter(x => x !== f); },
    speak(u){ window.__vc.spoken.push(u.lang); setTimeout(() => u.onstart && u.onstart(), 50); setTimeout(() => u.onend && u.onend(), 300); } };
  setTimeout(() => { synth._v = voices; synth._l.slice().forEach(f => f()); }, 200);
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => ({ getTracks: () => [{ stop(){ window.__vc.stopped++; } }] }) }, configurable: true });
  window.MediaRecorder = class { constructor(s, o){ this.mimeType = (o && o.mimeType) || ''; this.state = 'inactive'; }
    static isTypeSupported(t){ return t === 'audio/mp4'; }
    start(){ this.state = 'recording'; }
    stop(){ this.state = 'inactive'; this.ondataavailable({ data: new Blob([new Uint8Array(4096)], { type: 'audio/mp4' }) }); this.onstop(); } };
  window.Audio = class { constructor(u){ this.src = u; } play(){ setTimeout(() => this.onended && this.onended(), 100); return Promise.resolve(); } pause(){} };
  delete window.SpeechRecognition; // Safari has only the prefixed one; Chromium 141 has its own
  window.webkitSpeechRecognition = class { start(){ window.__vc.heard.push(this.lang); setTimeout(() => this.onstart && this.onstart(), 50);
      setTimeout(() => { const r = [{ transcript: this.lang === 'es-US' ? 'me duele el pecho' : 'my chest hurts' }]; r.isFinal = true; this.onresult({ results: [r] }); }, 150);
      setTimeout(() => this.onend && this.onend(), 250); }
    stop(){} abort(){} };
}
function noApis(){
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
  delete window.webkitSpeechRecognition; delete window.SpeechRecognition;
}

(async () => {
  const b = await L.chromium.launch();
  for (const [device, dark] of [['iphone', false], ['iphone', true], ['narrow', false], ['desktop', false]]) {
    const tag = device + (dark ? '-dark' : '');
    console.log('== ' + tag);
    const { ctx, page } = await L.boot(b, { device, dark, settle: 4000, init: standIns });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'https://interp.test' });
    if (dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

    await page.evaluate(() => openMoreSheet()); await wait(500);
    const more = await page.evaluate(() => { const vc = document.querySelector('#moreSheetBody .vc-more .btn'), fm = document.querySelector('#moreSheetBody .fm-more');
      const build = [...document.querySelectorAll('#moreSheetBody div')].find(d => /Build b/.test(d.textContent) && !d.querySelector('div'));
      vc && vc.scrollIntoView({ block: 'center' }); const r = vc && vc.getBoundingClientRect(); const hit = vc && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { label: vc && vc.textContent.trim(), afterMeter: !!vc && fm.compareDocumentPosition(vc) === Node.DOCUMENT_POSITION_FOLLOWING,
        aboveBuild: !!vc && vc.compareDocumentPosition(build) === Node.DOCUMENT_POSITION_FOLLOWING, h: r && Math.round(r.height), hit: !!hit && vc.contains(hit) }; });
    ok(more.label === 'Voice and mic check' && more.afterMeter && more.aboveBuild, 'More: "Voice and mic check" under the smoothness meter, above the build', more);
    ok(more.h >= 40 && more.hit, 'More: the button takes the tap', more);
    if (device === 'iphone' && !dark) await page.screenshot({ path: O + 'more-bottom.png' });

    await page.evaluate(() => document.querySelector('#moreSheetBody .vc-more .btn').click()); await wait(600);
    const open = await page.evaluate(() => { const s = document.querySelector('#voiceCheckOverlay .more-sheet'), r = s.getBoundingClientRect();
      const btns = [...document.querySelectorAll('#voiceCheckBody button:not([hidden])')].map(x => { x.scrollIntoView({ block: 'center' }); const q = x.getBoundingClientRect();
        const hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return { t: x.textContent.trim(), h: Math.round(q.height), hit: !!hit && x.contains(hit) }; });
      s.scrollTop = 0;
      return { shown: document.getElementById('voiceCheckOverlay').classList.contains('show'), moreShut: !document.getElementById('moreSheetOverlay').classList.contains('show'),
        mode: document.getElementById('vcMode').textContent, voices: document.getElementById('vcVoices').textContent,
        inView: r.left >= 0 && r.right <= innerWidth + 1, sideways: s.scrollWidth - s.clientWidth, btns }; });
    ok(open.shown && open.moreShut && open.mode === 'browser tab', 'opens over a closed More, says how the page runs', open);
    ok(open.voices === '2 Spanish and 1 English voices on this phone.', 'counts the voices once they arrive (es_ES counted as Spanish)', open.voices);
    ok(open.inView && open.sideways <= 0, 'sheet fits the width, no sideways scroll', open);
    ok(open.btns.length === 8 && open.btns.every(x => x.h >= 40 && x.hit), 'eight buttons, each 40px+ and taking its own tap', open.btns);

    await page.evaluate(() => vcPlay('es')); await wait(450);
    const play = await page.evaluate(() => ({ s: document.getElementById('vcPlay').textContent, spoken: __vc.spoken }));
    ok(/^Spanish: played, \d\.\d s$/.test(play.s) && play.spoken[0] === 'es-US', 'Play Spanish speaks es-US and reports it played', play);

    await page.evaluate(() => document.getElementById('vcRecBtn').click()); await wait(1300);
    const mid = await page.evaluate(() => ({ s: document.getElementById('vcRec').textContent, dis: document.getElementById('vcRecBtn').disabled, pb: document.getElementById('vcPlayBack').hidden }));
    ok(/^recording, say something… [1-4]$/.test(mid.s) && mid.dis && mid.pb, 'records with a countdown, Record disabled, no Play back yet', mid);
    await wait(4500);
    const rec = await page.evaluate(() => ({ s: document.getElementById('vcRec').textContent, pb: document.getElementById('vcPlayBack').hidden, dis: document.getElementById('vcRecBtn').disabled, stopped: __vc.stopped }));
    ok(rec.s === 'recorded 5 s (audio/mp4, 4 KB). Tap Play back.' && !rec.pb && !rec.dis && rec.stopped === 1, 'after 5 s: recorded as audio/mp4, mic released, Play back shown', rec);
    await page.evaluate(() => document.getElementById('vcPlayBack').click()); await wait(300);
    ok(await page.evaluate(() => document.getElementById('vcRec').textContent) === 'played back (audio/mp4, 4 KB)', 'Play back plays the take');

    await page.evaluate(() => { Object.defineProperty(navigator, 'audioSession', { value: { type: 'auto' }, configurable: true }); vcLoudFix(); }); await wait(450);
    const fix = await page.evaluate(() => ({ s: document.getElementById('vcFix').textContent, type: navigator.audioSession.type, play: document.getElementById('vcPlay').textContent }));
    ok(fix.s === 'audio session set to playback' && fix.type === 'playback' && /Spanish: played/.test(fix.play), 'Try the volume fix: sets the audio session to playback, plays Spanish', fix);
    await page.evaluate(() => vcListen('es')); await wait(400);
    const sr = await page.evaluate(() => ({ s: document.getElementById('vcSr').textContent, heard: __vc.heard }));
    ok(/^Spanish: done, first words after 0\.\d s · me duele el pecho$/.test(sr.s) && sr.heard[0] === 'es-US', 'Escuchar en español: es-US, shows the words', sr);
    if (device === 'iphone' || device === 'desktop') { await page.evaluate(() => document.querySelector('#voiceCheckOverlay .more-sheet').scrollTop = 0); await page.screenshot({ path: O + tag + '-sheet.png' }); }

    await page.evaluate(() => [...document.querySelectorAll('#voiceCheckBody .btn')].find(x => /Copy/.test(x.textContent)).click()); await wait(300);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    ok(/Running as: browser tab/.test(clip) && /Spanish: Paulina \(es-MX\); Mónica \(es-ES\)/.test(clip) && /Record: played back \(audio\/mp4, 4 KB\)$/m.test(clip)
      && /Speech to text: yes \(webkit\)/.test(clip) && /Spanish: done.*"me duele el pecho"/.test(clip) && /English: not tried/.test(clip) && /as loud after the mic/.test(clip) && /Volume fix: audio session set to playback/.test(clip), 'Copy results: mode, voices, each step', clip);

    // Close mid-recording: the mic is let go and nothing is left running.
    await page.evaluate(() => document.getElementById('vcRecBtn').click()); await wait(600);
    await page.evaluate(() => voiceCheckClose()); await wait(5200);
    const shut = await page.evaluate(() => ({ shown: document.getElementById('voiceCheckOverlay').classList.contains('show'), stopped: __vc.stopped, s: VC.rec.state, url: vcUrl, stream: vcStream }));
    ok(!shut.shown && shut.stopped === 2 && shut.s === 'stopped (closed)' && shut.url === null && shut.stream === null, 'closing mid-recording releases the mic and keeps nothing', shut);
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close();
  }

  console.log('== no mic, no speech to text');
  { const { ctx, page } = await L.boot(b, { device: 'iphone', settle: 4000, init: noApis });
    await page.evaluate(() => voiceCheckOpen()); await wait(400);
    const s4 = await page.evaluate(() => ({ p: document.querySelectorAll('#voiceCheckBody .vc-step')[3].querySelector('p').textContent, btns: document.querySelectorAll('#voiceCheckBody .vc-step')[3].querySelectorAll('button').length }));
    ok(s4.p === 'Not available here.' && s4.btns === 0, 'step 4 says "Not available here." with no buttons', s4);
    await page.evaluate(() => vcRecord()); await wait(300);
    const r = await page.evaluate(() => document.getElementById('vcRec').textContent);
    ok(/^not available here \(microphone no, recorder (yes|no)\)$/.test(r), 'Record says the mic is not available', r);
    ok(/Speech to text: not available/.test(await page.evaluate(() => vcText())), 'report says speech to text is not available');
    ok(page.__errors.length === 0, 'no page errors', page.__errors);
    await ctx.close(); }
  await b.close();
})().catch(e => { console.log('  FAIL crashed: ' + (e && e.stack || e)); process.exitCode = 1; });
