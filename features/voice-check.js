/* The Voice and mic check (voiceCheckOpen, its voices, recording and
   speech-to-text tests, audioMode: the section below): moved verbatim out
   of index.html on 2026-10-23 (docs/split-index.md, phase 3). Loaded by a
   plain <script src> just before index.html's own script. Nothing here
   runs as the page loads (only declarations); the names it uses from
   index.html (showToast, escapeHtml, closeMoreSheet...) are read when a
   function runs. Keep it that way: a top-level line here that calls into
   index.html would run before index.html has. */

/* ---------- Voice and mic check ----------
   Step M0 of the memory trainer (docs/PLAN.md). Before building on the
   phone's voices, microphone and speech-to-text, find out which of them
   work on an iPhone, in the installed app and in a Safari tab: Apple said
   in 2021 that speech-to-text is off in Home Screen apps, and nobody has
   checked since. Nothing is saved or sent by the Hub; the recording stays
   in memory and is dropped on close. Copy results gives a report to paste
   into a chat. Note: docs/features/memory-trainer.md. */
const VC = { voices: null, play: {}, rec: null, sr: {} };
let vcStream = null, vcRecog = null, vcUrl = null, vcAudio = null, vcTick = 0;
const VC_LINES = {
  es: 'Tome una tableta dos veces al día, con comida, durante diez días.',
  en: 'Take one tablet twice a day, with food, for ten days.',
};

function vcMode(){
  const sa = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  return sa ? 'installed app' : 'browser tab';
}
function vcSR(){ return window.SpeechRecognition || window.webkitSpeechRecognition || null; }
function vcLang(v){ return String(v.lang || '').replace('_', '-'); }

function vcLoadVoices(){
  return new Promise(res => {
    if(!('speechSynthesis' in window)) return res([]);
    const now = speechSynthesis.getVoices();
    if(now.length) return res(now);
    let done = false;
    const finish = () => { if(done) return; done = true; speechSynthesis.removeEventListener('voiceschanged', finish); res(speechSynthesis.getVoices()); };
    speechSynthesis.addEventListener('voiceschanged', finish);
    setTimeout(finish, 2000);
  });
}

function vcVoicesText(){
  if(!('speechSynthesis' in window)) return 'No speech on this browser.';
  if(!VC.voices) return 'Looking for voices…';
  const of = p => VC.voices.filter(v => vcLang(v).toLowerCase().startsWith(p));
  return `${of('es').length} Spanish and ${of('en').length} English voices on this phone.`;
}

function vcSet(id, text){
  const el = document.getElementById(id);
  if(el) el.innerHTML = text;
}
function vcPaint(){
  vcSet('vcVoices', escapeHtml(vcVoicesText()));
  vcSet('vcPlay', ['es', 'en'].filter(l => VC.play[l]).map(l => `${l === 'es' ? 'Spanish' : 'English'}: ${escapeHtml(VC.play[l])}`).join('<br>'));
  const R = VC.rec;
  vcSet('vcRec', R ? escapeHtml(R.state) : '');
  const pb = document.getElementById('vcPlayBack');
  if(pb) pb.hidden = !vcUrl;
  const rb = document.getElementById('vcRecBtn');
  if(rb) rb.disabled = !!(R && R.busy);
  vcSet('vcSr', ['en', 'es'].filter(l => VC.sr[l]).map(l => { const S = VC.sr[l];
    return `${l === 'es' ? 'Spanish' : 'English'}: ${escapeHtml(S.state)}${S.text ? ` · <q>${escapeHtml(S.text)}</q>` : ''}`; }).join('<br>'));
}

function voiceCheckOpen(){
  try{ closeMoreSheet(); }catch(e){}
  const sr = vcSR();
  document.getElementById('voiceCheckBody').innerHTML = `
    <div class="fm-head">Voice and mic check</div>
    <p class="fm-sub">What this phone can do for the memory trainer. Do the four steps, then tap <b>Copy results</b> and paste them into a chat. Running as: <b id="vcMode">${vcMode()}</b>.</p>
    <div class="vc-step"><h4>1. Hear the voices</h4>
      <p id="vcVoices"></p>
      <div class="fm-btns"><button class="btn btn-ghost" onclick="vcPlay('es')">Play Spanish</button><button class="btn btn-ghost" onclick="vcPlay('en')">Play English</button></div>
      <div class="vc-state" id="vcPlay" aria-live="polite"></div></div>
    <div class="vc-step"><h4>2. Record yourself</h4>
      <p>Records 5 seconds. Then tap Play back.</p>
      <div class="fm-btns"><button class="btn btn-ghost" id="vcRecBtn" onclick="vcRecord()">Record 5 seconds</button><button class="btn btn-ghost" id="vcPlayBack" hidden onclick="vcPlayBack()">Play back</button></div>
      <div class="vc-state" id="vcRec" aria-live="polite"></div></div>
    <div class="vc-step"><h4>3. Voices after the mic</h4>
      <p>Tap Play Spanish again. Is it as loud as before? If not, tap <b>Try the volume fix</b>. Add yes or no for each when you paste.</p>
      <div class="fm-btns"><button class="btn btn-ghost" onclick="vcLoudFix()">Try the volume fix</button></div>
      <div class="vc-state" id="vcFix" aria-live="polite"></div></div>
    <div class="vc-step"><h4>4. Speech to text</h4>
      <p>${sr ? 'Tap one and say a sentence. It may send what you say to Apple to turn it into text, so do this away from patients.' : 'Not available here.'}</p>
      ${sr ? `<div class="fm-btns"><button class="btn btn-ghost" onclick="vcListen('en')">Listen in English</button><button class="btn btn-ghost" onclick="vcListen('es')">Escuchar en español</button></div>` : ''}
      <div class="vc-state" id="vcSr" aria-live="polite"></div></div>
    <div class="fm-meta">Build ${escapeHtml(BUILD_ID)} · ${escapeHtml(navigator.userAgent)}</div>
    <div class="fm-btns">
      <button class="btn btn-ghost" onclick="voiceCheckClose()">Close</button>
      <button class="btn btn-primary" onclick="vcCopy()">Copy results</button>
    </div>`;
  document.getElementById('voiceCheckOverlay').classList.add('show');
  vcPaint();
  if(!VC.voices) vcLoadVoices().then(v => { VC.voices = v; vcPaint(); });
}

// Lets go of everything the check holds: speech, the mic, the recording.
function voiceCheckClose(){
  document.getElementById('voiceCheckOverlay').classList.remove('show');
  try{ if('speechSynthesis' in window) speechSynthesis.cancel(); }catch(e){}
  if(vcRecog){ try{ vcRecog.abort(); }catch(e){} vcRecog = null; }
  clearInterval(vcTick);
  if(vcStream){ vcStream.getTracks().forEach(t => t.stop()); vcStream = null; }
  if(vcAudio){ try{ vcAudio.pause(); }catch(e){} vcAudio = null; }
  if(vcUrl){ URL.revokeObjectURL(vcUrl); vcUrl = null; }
  if(VC.rec && VC.rec.busy){ VC.rec.busy = false; VC.rec.state = 'stopped (closed)'; }
}

/* After the mic, iPhones can keep sound on the quiet earpiece route. Setting
   the page's audio session back to playback is the fix being tried (M3);
   navigator.audioSession is Safari 16.4+, absent elsewhere. */
function audioMode(type){
  try{ if(navigator.audioSession){ navigator.audioSession.type = type; return navigator.audioSession.type === type; } }catch(e){}
  return false;
}
function vcLoudFix(){
  VC.fix = !navigator.audioSession ? 'not on this phone (no audioSession)' : audioMode('playback') ? 'audio session set to playback' : 'could not set the audio session';
  vcSet('vcFix', escapeHtml(VC.fix));
  vcPlay('es');
}

function vcPlay(lang){
  if(!('speechSynthesis' in window)){ VC.play[lang] = 'no speech on this browser'; return vcPaint(); }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(VC_LINES[lang]);
  u.lang = lang === 'es' ? 'es-US' : 'en-US';
  u.rate = 0.92;
  const t0 = performance.now();
  VC.play[lang] = 'starting…'; vcPaint();
  u.onstart = () => { VC.play[lang] = 'playing…'; vcPaint(); };
  u.onend = () => { VC.play[lang] = `played, ${((performance.now() - t0) / 1000).toFixed(1)} s`; vcPaint(); };
  u.onerror = e => { VC.play[lang] = 'error: ' + (e.error || 'unknown'); vcPaint(); };
  speechSynthesis.speak(u);
}

async function vcRecord(){
  if(VC.rec && VC.rec.busy) return;
  if(vcUrl){ URL.revokeObjectURL(vcUrl); vcUrl = null; }
  const R = VC.rec = { busy: true, state: 'asking for the microphone…' };
  vcPaint();
  const gum = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if(!gum || !window.MediaRecorder){
    Object.assign(R, { busy: false, state: `not available here (microphone ${gum ? 'yes' : 'no'}, recorder ${window.MediaRecorder ? 'yes' : 'no'})` });
    return vcPaint();
  }
  try{ vcStream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch(e){ Object.assign(R, { busy: false, state: 'microphone refused: ' + (e.name || e.message) }); return vcPaint(); }
  const stream = vcStream;
  const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  let rec;
  try{ rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined); }
  catch(e){ stream.getTracks().forEach(t => t.stop()); vcStream = null; Object.assign(R, { busy: false, state: 'recorder failed: ' + (e.name || e.message) }); return vcPaint(); }
  const chunks = [];
  rec.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    stream.getTracks().forEach(t => t.stop());
    if(vcStream === stream) vcStream = null;
    if(!R.busy) return; // closed while recording
    const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/mp4' });
    R.busy = false;
    R.type = blob.type; R.kb = Math.round(blob.size / 1024);
    if(!blob.size){ R.state = 'recorded nothing'; return vcPaint(); }
    vcUrl = URL.createObjectURL(blob);
    R.state = `recorded 5 s (${R.type}, ${R.kb} KB). Tap Play back.`;
    vcPaint();
  };
  rec.start();
  let n = 5;
  R.state = `recording, say something… ${n}`; vcPaint();
  clearInterval(vcTick);
  vcTick = setInterval(() => {
    n--;
    if(n > 0){ R.state = `recording, say something… ${n}`; vcPaint(); return; }
    clearInterval(vcTick);
    if(rec.state !== 'inactive') rec.stop();
  }, 1000);
}

// A tap, not automatic: iPhones only let sound start from a tap, and the
// trainer will play your take back the same way.
function vcPlayBack(){
  if(!vcUrl || !VC.rec) return;
  const R = VC.rec;
  if(vcAudio){ try{ vcAudio.pause(); }catch(e){} }
  const a = vcAudio = new Audio(vcUrl);
  R.state = 'playing back…'; vcPaint();
  a.onended = () => { R.state = `played back (${R.type}, ${R.kb} KB)`; vcPaint(); };
  a.onerror = () => { R.state = 'recorded, but it would not play back'; vcPaint(); };
  a.play().catch(e => { R.state = 'recorded, playback refused: ' + (e.name || e.message); vcPaint(); });
}

function vcListen(lang){
  const SR = vcSR();
  if(!SR){ VC.sr[lang] = { state: 'not available here' }; return vcPaint(); }
  if(vcRecog){ try{ vcRecog.abort(); }catch(e){} }
  const r = vcRecog = new SR();
  r.lang = lang === 'es' ? 'es-US' : 'en-US';
  r.interimResults = true;
  r.continuous = false;
  const S = VC.sr[lang] = { state: 'starting…', text: '', t0: performance.now() };
  vcPaint();
  r.onstart = () => { S.state = 'listening, speak now'; vcPaint(); };
  r.onresult = e => {
    S.text = [...e.results].map(x => x[0].transcript).join('');
    if(!S.first) S.first = Math.round(performance.now() - S.t0);
    S.state = 'hearing…'; vcPaint();
  };
  r.onerror = e => { S.err = e.error || 'unknown'; S.state = 'error: ' + S.err; vcPaint(); };
  r.onend = () => {
    if(!S.err) S.state = S.text ? `done, first words after ${(S.first / 1000).toFixed(1)} s` : 'heard nothing';
    if(vcRecog === r) vcRecog = null;
    vcPaint();
  };
  try{ r.start(); }
  catch(e){ S.err = e.name || e.message; S.state = 'could not start: ' + S.err; vcPaint(); }
  setTimeout(() => { if(vcRecog === r){ try{ r.stop(); }catch(e){} } }, 10000);
}

function vcText(){
  const sr = vcSR();
  const names = p => (VC.voices || []).filter(v => vcLang(v).toLowerCase().startsWith(p)).map(v => `${v.name} (${vcLang(v)}${v.localService === false ? ', online' : ''})`).join('; ') || 'none';
  const R = VC.rec;
  return [
    `Voice and mic check · build ${BUILD_ID} · ${new Date().toLocaleString()}`,
    `Running as: ${vcMode()}`,
    navigator.userAgent,
    `Voices: ${vcVoicesText()}`,
    `  Spanish: ${names('es')}`,
    `  English: ${names('en')}`,
    `Play Spanish: ${VC.play.es || 'not tried'} · Play English: ${VC.play.en || 'not tried'}`,
    `Record: ${R ? R.state : 'not tried'}`,
    `Speech to text: ${sr ? (window.SpeechRecognition ? 'yes' : 'yes (webkit)') + (sr.prototype && 'processLocally' in sr.prototype ? ', on-device option' : '') : 'not available'}`,
    ...['en', 'es'].map(l => `  ${l === 'es' ? 'Spanish' : 'English'}: ${VC.sr[l] ? VC.sr[l].state + (VC.sr[l].text ? ` · "${VC.sr[l].text}"` : '') : 'not tried'}`),
    'Voice as loud after the mic? (yes/no): ',
    `Volume fix: ${VC.fix || 'not tried'}`,
    'Voice as loud after the fix? (yes/no): ',
  ].join('\n');
}

function vcCopy(){
  const done = () => showToast('Copied. Paste it into a chat or a note.');
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(vcText()).then(done, () => showToast('Could not copy on this phone.'));
  else showToast('Could not copy on this phone.');
}

function voiceCheckMoreHtml(){
  return `<div class="vc-more"><button class="btn btn-ghost" onclick="voiceCheckOpen()">Voice and mic check</button></div>`;
}
