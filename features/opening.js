/* ---------- The opening (Badge in) ----------
   docs/features/opening.md. Every real start of the app on a phone: the
   pavilion behind (a pre-rendered loop, opening/pavilion-1.*), music after the tap (opening/music-1.m4a), the staff badge
   drops in on its lanyard, you tap it, it scans green, Dr. Smiley winks,
   "Welcome in", and a green ring opens from the reader onto the live Home.
   Whether it plays is decided before the first paint, in index.html's
   first script ("The opening, before the first paint"), which also covers
   the page with the opening's still until this mounts. index.html's script
   calls openingStart() first thing; More's Opening card calls the rest.
   Declarations only (AGENTS.md, the features/ rule).

   Everything moves from one clock, opFrame(t), written each frame (the
   mockup's timeline, docs/mockups/opening/src/src7.html): transforms and
   opacity, plus the green glow and the ring's mask for under a second.
   Home's hello waits for it (window.hubOpeningUp, 'hub-opening-done';
   home-polish.js). */

const OP_KEY = 'ih_opening', OP_SOUND_KEY = 'ih_openingSound', OP_TITLE_KEY = 'ih_badgeTitle';
const OP_TITLE_DEFAULT = 'Staff Interpreter', OP_TITLE_MAX = 28;
// The badge has arrived (dropped and settled) at this many seconds; a tap before it skips to Home.
const OP_BADGE_AT = 2.05;
const OP = { el: null, raf: 0, t0: 0, tap: null, cues: {}, still: false, leaving: false, ac: null, musicData: null, musicBuf: null, mus: null };
// The music: an original loop (harp, piano, violin; made by docs/mockups/opening/music/compose.py).
// It is started the moment the opening mounts (Jose, 2026-11-06: "music from the moment the app is
// opened"). A phone that allows sound before a touch plays it then; one that doesn't (iPhone) keeps
// the audio paused until the tap on the badge wakes it, and it starts from the top there.
// Replay is itself a tap. After the opening it fades out over Home.
const OP_MUSIC_URL = './opening/music-1.m4a', OP_MUSIC_VOL = .4, OP_MUSIC_FADE = 4;

function opGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function opSet(k, v){ try{ if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} }
function openingOn(){ return opGet(OP_KEY) !== 'off'; }
function openingSoundOn(){ return opGet(OP_SOUND_KEY) !== 'off'; }
function openingTitle(){ const t = (opGet(OP_TITLE_KEY) || '').replace(/\s+/g, ' ').trim().slice(0, OP_TITLE_MAX); return t || OP_TITLE_DEFAULT; }
// "Jose Vazquez" -> the card says "Jose V.", the welcome "Jose". No name: "Interpreter" and "Welcome in".
function openingNames(){
  const parts = (opGet('ih_myName') || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if(!parts.length) return { card: 'Interpreter', first: '' };
  const first = parts[0].slice(0, 16), last = parts.length > 1 ? parts[parts.length - 1] : '';
  return { card: last ? `${first} ${last[0].toUpperCase()}.` : first, first };
}
// The pavilion's light follows the phone's clock: morning 5-11, midday 11-4 pm,
// evening and night from 4 pm to 5 am. Each look is its own loop in opening/;
// index.html's first script makes the same choice for the cover (data-op-look).
const OP_CLIPS = { morning: 'pavilion-morning-1', midday: 'pavilion-1', evening: 'pavilion-evening-1' };
function openingLook(h){
  if(h === undefined) h = new Date().getHours();
  return h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 16 ? 'midday' : 'evening';
}
// Up and not yet gone: Home's hello waits while this is true (home-polish.js).
function hubOpeningUp(){ return !!OP.el; }

const opClamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const opSpan = (t, a, b) => opClamp((t - a) / (b - a));
const opSine = x => .5 - .5 * Math.cos(Math.PI * opClamp(x));
const opOut = x => 1 - Math.pow(1 - opClamp(x), 3);

function openingHtml(look){
  const clip = './opening/' + OP_CLIPS[look] + '.', n = openingNames(), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<div class="op-scene">
      <video class="op-bg" muted playsinline loop preload="auto" disablepictureinpicture aria-hidden="true" poster="${clip}webp">
        <source src="${clip}mp4" type="video/mp4"><source src="${clip}webm" type="video/webm"></video>
      <div class="op-stage">
        <div class="op-ttl"><span class="op-logo"></span><span class="op-wm"><b><em>Interpreter</em> <strong>Hub</strong></b><small>HUMC LANGUAGE SERVICES</small></span></div>
        <div class="op-reader"><span class="op-lr"></span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8.5 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M14.5 3.5a12 12 0 0 1 0 17"/><circle cx="5.5" cy="12" r="1.3" fill="#fff"/></svg></div>
        <div class="op-ring"></div>
        <div class="op-rig">
          <div class="op-lan"><span>INTERPRETER · INTERPRETER · INTERPRETER</span><i class="op-acc"></i></div>
          <svg class="op-clasp" viewBox="0 0 32 44" aria-hidden="true"><defs><linearGradient id="opSv" x1="0" x2="1"><stop offset="0" stop-color="#8d96a8"/><stop offset=".45" stop-color="#f4f6fa"/><stop offset=".6" stop-color="#c2c9d6"/><stop offset="1" stop-color="#7d8699"/></linearGradient></defs>
            <rect x="9" y="0" width="14" height="9" rx="2" fill="url(#opSv)"/><circle cx="16" cy="13" r="4" fill="none" stroke="url(#opSv)" stroke-width="2.5"/><path d="M16 17c-6 0-8 5-8 10 0 6 4 10 8 10s8-4 8-10c0-3-1-5-3-7" fill="none" stroke="url(#opSv)" stroke-width="3" stroke-linecap="round"/><rect x="13" y="35" width="6" height="9" rx="2" fill="url(#opSv)"/></svg>
          <div class="op-conn"></div><div class="op-strap"><i></i></div>
          <div class="op-purp"><b>INTERPRETER</b></div>
          <div class="op-holder"><div class="op-slot"></div>
            <div class="op-card">
              <div class="op-pic">${typeof drSmileyArt === 'function' ? drSmileyArt('op-face') : ''}</div>
              <div class="op-nm">${esc(n.card)}</div>
              <div class="op-rl">${esc(openingTitle())}</div>
              <div class="op-org"><img src="./hmh-mark.png" alt=""><div>Hackensack<br>Meridian <i>Health</i><br>Hackensack University<br>Medical Center</div></div>
              <div class="op-dept">Language Services</div>
            </div>
            <div class="op-glint"></div><div class="op-scan"></div>
          </div>
        </div>
        <div class="op-cta">Tap your badge to begin</div>
        <div class="op-wel">${n.first ? 'Welcome in, ' + esc(n.first) : 'Welcome in'}</div>
      </div>
    </div>
    <div class="op-ring2"></div>`;
}

/* Start it. From index.html's first lines (a real start, already decided)
   or More's Replay (replay = true). */
function openingStart(replay){
  const root = document.documentElement;
  if(OP.el){ root.classList.remove('op-cover'); return; }
  root.classList.add('op-on');   // the top bar takes the scene's color (syncTheme in index.html, app.css --op-top) until the ring opens
  try{
    // The cover's look (index.html) on a real start; the clock's on a Replay.
    const look = OP_CLIPS[root.getAttribute('data-op-look')] && !replay ? root.getAttribute('data-op-look') : openingLook();
    root.setAttribute('data-op-look', look);
    const el = document.createElement('div');
    el.className = 'op op-' + look;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Opening. Tap your badge to begin');
    el.tabIndex = -1;
    el.innerHTML = openingHtml(look);
    document.body.appendChild(el);
    OP.el = el; OP.tap = null; OP.cues = {}; OP.leaving = false;
    OP.still = (typeof drStill === 'function' && drStill()) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    el.classList.toggle('is-still', OP.still);
    opMusicLoad();
    opMusicAtOpen();
    if(!OP.visBound){ OP.visBound = true; document.addEventListener('visibilitychange', () => { if(document.hidden) opMusicStop(.2); }); }
    opFit();
    window.addEventListener('resize', opFit);
    el.addEventListener('click', openingTap);
    el.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openingTap(); }
      else if(e.key === 'Escape'){ e.preventDefault(); openingFinish(true); }
    });
    // Its own Dr. Smiley rests on his smile frame, not on the engine's clock.
    opFace('smile');
    const v = el.querySelector('.op-bg');
    if(v && !OP.still){ v.addEventListener('playing', () => v.classList.add('is-on'), { once: true }); const p = v.play(); if(p && p.catch) p.catch(() => {}); }
    root.classList.remove('op-cover');
    window.__opMounted = true;
    try{ el.focus({ preventScroll: true }); }catch(e){}
    OP.t0 = performance.now();
    const loop = () => { if(!OP.el) return; opFrame((performance.now() - OP.t0) / 1000); OP.raf = requestAnimationFrame(loop); };
    loop();
  }catch(e){
    root.classList.remove('op-cover', 'op-on');
    if(OP.el){ OP.el.remove(); OP.el = null; }
  }
}

// The badge is drawn for a 390 x 844 screen and scaled to fit this one; the pavilion fills it all.
function opFit(){
  if(!OP.el) return;
  const k = Math.min(innerWidth / 390, innerHeight / 844);
  OP.el.style.setProperty('--op-k', k.toFixed(4));
}

function opFace(name){
  if(!OP.el || typeof DR_FACE_FRAMES === 'undefined') return;
  const s = OP.el.querySelector('.op-face .ds-sheet'), i = DR_FACE_FRAMES.indexOf(name);
  if(s && i >= 0) s.setAttribute('x', String(-DR_FACE_W * i));
}

function openingTap(){
  if(!OP.el || OP.leaving) return;
  const t = (performance.now() - OP.t0) / 1000;
  if(OP.tap !== null) return;
  // Before the badge has arrived: straight to Home.
  if(!OP.still && t < OP_BADGE_AT){ openingFinish(true); return; }
  OP.tap = t;
  opAudio(); opMusicPlay();
  if(OP.still){
    // Still: straight to green, then Home fades in.
    OP.el.classList.add('is-green');
    opSound('chime');
    setTimeout(() => openingFinish(true), 700);
  }
}

// An AudioContext made and woken inside a tap (phones allow sound only after one). Null with Sound off.
function opAudio(){
  if(!openingSoundOn()) return null;
  try{ OP.ac = OP.ac || new (window.AudioContext || window.webkitAudioContext)(); if(OP.ac.state !== 'running') OP.ac.resume(); }catch(e){ OP.ac = null; }
  return OP.ac;
}
// Try the music at once: made outside a tap, the AudioContext starts paused ('suspended') unless the
// phone allows sound before a touch; resume() then wakes it there, or waits for the tap (opAudio).
function opMusicAtOpen(){
  if(!openingSoundOn()) return;
  try{ OP.ac = OP.ac || new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ OP.ac = null; return; }
  opMusicPlay();
  if(OP.ac.state !== 'running'){ try{ const p = OP.ac.resume(); if(p && p.catch) p.catch(() => {}); }catch(e){} }
}
// The music file is fetched when the opening mounts (the saved copy, sw.js), decoded on the first play.
function opMusicLoad(){
  if(!openingSoundOn() || OP.musicData) return;
  OP.musicData = fetch(OP_MUSIC_URL).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
}
function opMusicPlay(){
  const AC = OP.ac;
  if(!AC || OP.mus || !OP.musicData || !openingSoundOn()) return;
  const m = OP.mus = { src: null, g: null, gone: false };
  // Older Safari has only the callback form; newer browsers also return a promise, caught here too.
  const decode = data => new Promise((ok, no) => { const p = AC.decodeAudioData(data.slice(0), ok, no); if(p && p.catch) p.catch(no); });
  OP.musicData.then(data => OP.musicBuf || (data && !m.gone ? decode(data) : null))
    .then(buf => {
      if(!buf) return;
      OP.musicBuf = buf;
      if(m.gone) return;
      const src = AC.createBufferSource(), g = AC.createGain(), t = AC.currentTime;
      src.buffer = buf; src.loop = true;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(OP_MUSIC_VOL, t + .6);
      src.connect(g); g.connect(AC.destination); src.start(t);
      m.src = src; m.g = g;
    }).catch(() => { OP.musicErr = true; OP.musicData = Promise.resolve(null); }); // a browser that can't decode it: no music, no error
}
// Fade it out over sec seconds (Home after the opening, a skip, the phone going to another app).
function opMusicStop(sec){
  const m = OP.mus; if(!m) return;
  OP.mus = null; m.gone = true;
  if(!m.src) return;
  try{
    const t = OP.ac.currentTime, p = m.g.gain;
    if(p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); }
    p.linearRampToValueAtTime(0, t + sec); m.src.stop(t + sec + .05);
  }catch(e){ try{ m.src.stop(); }catch(_){} }
}

// A little synthesized sound, only after the tap, quiet: the reader's beep, a chime, a soft swell.
function opSound(kind){
  const AC = OP.ac;
  if(!AC || !openingSoundOn()) return;
  try{
    const t = AC.currentTime, out = AC.createGain(); out.gain.value = .3; out.connect(AC.destination);
    const tone = (f, at, dur, vol, type = 'sine') => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + at); g.gain.linearRampToValueAtTime(vol, t + at + .01); g.gain.exponentialRampToValueAtTime(.0001, t + at + dur);
      o.connect(g); g.connect(out); o.start(t + at); o.stop(t + at + dur + .05); };
    if(kind === 'beep') tone(1760, 0, .09, .25, 'triangle');
    if(kind === 'chime'){ tone(1318.5, 0, 1.2, .3); tone(1975.5, .09, 1.4, .25); tone(2637, .18, 1.1, .12); }
    if(kind === 'whoosh'){
      const n = Math.floor(AC.sampleRate * 1.4), buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0);
      for(let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
      const src = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain(); src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 1.1);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + .7); g.gain.exponentialRampToValueAtTime(.001, t + 1.35);
      src.connect(bp); bp.connect(g); g.connect(out); src.start(t);
    }
  }catch(e){}
}

/* One frame of the opening at t seconds. */
function opFrame(t){
  const el = OP.el; if(!el || OP.leaving) return;
  const $ = s => el.querySelector(s), o = (n, v) => { n.style.opacity = opClamp(v).toFixed(3); };
  const tap = OP.tap, a = tap === null ? -1 : t - tap, still = OP.still;
  if(still){
    // Everything already in place; the tap's green is a class (openingTap).
    $('.op-ttl b').style.setProperty('--r', '100%');
    o($('.op-ttl small'), 1); o($('.op-rig'), 1); o($('.op-reader'), 1); o($('.op-cta'), tap === null ? 1 : 0); o($('.op-wel'), tap === null ? 0 : 1);
    $('.op-lr').style.setProperty('--lc', tap === null ? '#ff8fa3' : '#5de3a0');
    if(tap !== null) opFace('wink');
    cancelAnimationFrame(OP.raf);
    return;
  }
  const gone = tap === null ? 0 : opSpan(a, 1.7, 2.0);
  // The lockup: the mark appears, the name is revealed left to right while its spacing settles, one slow sheen.
  const w = opSine(opSpan(t, .55, 1.95)), tb = $('.op-ttl b'), lg = $('.op-logo');
  o(lg, opSpan(t, .2, .6)); lg.style.transform = `scale(${(.86 + .14 * opOut(opSpan(t, .2, .8))).toFixed(3)})`;
  tb.style.setProperty('--r', `${(w * 116 - 16).toFixed(1)}%`);
  tb.style.setProperty('--ls', `${((1 - opOut(opSpan(t, .55, 2.1))) * .08).toFixed(3)}em`);
  tb.style.setProperty('--sh', `${(100 - 100 * opSine(opSpan(t, 2.0, 3.4))).toFixed(1)}%`);
  o($('.op-ttl small'), opSpan(t, 1.3, 1.9)); o($('.op-ttl'), 1 - gone);
  // The badge drops in, swings, catches the light; the tap lowers it onto the reader for a scan.
  const d = t - 1.3, drop = opOut(opSpan(d, 0, .75));
  const sw = d > .5 ? Math.exp(-(d - .5) * 1.6) * Math.sin((d - .5) * 5.4) : 0;
  const lower = tap === null ? 0 : opSine(opSpan(a, 0, .5));
  const idle = tap === null ? opSpan(d, 2, 3) : 0;
  const ang = sw * 7 * (1 - lower) + Math.sin(t * .9) * .8 * idle, tw = sw * 16 * (1 - lower) + Math.sin(t * 1.1) * 2 * idle;
  $('.op-rig').style.transform = `translate3d(0,${(-640 * (1 - drop) + lower * 216).toFixed(1)}px,0) rotate(${ang.toFixed(2)}deg)`;
  $('.op-holder').style.transform = `rotateY(${tw.toFixed(2)}deg) rotateX(${(sw * 4).toFixed(2)}deg)`;
  $('.op-glint').style.transform = `translate3d(${(-150 + 300 * opSine(opSpan(t, 2.3, 3.1)) + tw * 3).toFixed(1)}px,0,0)`;
  o($('.op-glint'), .3 + Math.abs(tw) / 36 + .45 * Math.sin(Math.PI * opSpan(t, 2.3, 3.1)));
  const scan = tap === null ? -1 : opSpan(a, .5, .95);
  $('.op-scan').style.transform = `translate3d(0,${(scan * 148).toFixed(1)}px,0)`; o($('.op-scan'), scan > 0 && scan < 1 ? 1 : 0);
  const green = tap !== null && a >= .95;
  // Dr. Smiley winks as it turns green.
  if(tap !== null){
    const f = a < .95 ? 'smile' : a < 1.0 ? 'wink1' : a < 1.05 ? 'wink2' : a < 1.5 ? 'wink' : a < 1.56 ? 'wink2' : a < 1.62 ? 'wink1' : 'smile';
    if(f !== OP.face){ OP.face = f; opFace(f); }
  }
  o($('.op-rig'), d > 0 ? 1 - opSpan(a, 1.75, 2.05) : 0);
  const gw = green ? Math.sin(Math.PI * opSpan(a, .95, 1.4) * .5 + (a > 1.2 ? Math.PI * .5 * opSpan(a, 1.2, 1.8) : 0)) : 0;
  $('.op-rig').style.filter = gw > .01 ? `drop-shadow(0 0 ${(gw * 10).toFixed(1)}px rgba(93,227,160,.95)) drop-shadow(0 0 ${(gw * 24).toFixed(1)}px rgba(93,227,160,.7))` : '';
  // Access granted: a pulse of green light runs up the lanyard.
  const up = opSpan(a, .95, 1.55);
  $('.op-acc').style.transform = `translate3d(0,${(452 - up * 600).toFixed(1)}px,0)`; o($('.op-acc'), green && up < 1 ? 1 : 0);
  $('.op-lan').style.boxShadow = gw > .01 ? `inset 2px 0 0 rgba(255,255,255,.12),inset -2px 0 0 rgba(0,0,0,.25),0 0 ${(gw * 14).toFixed(1)}px rgba(93,227,160,${(gw * .9).toFixed(2)})` : '';
  o($('.op-reader'), opSpan(d, .5, 1.1) * (1 - gone));
  $('.op-reader').style.transform = `translate3d(0,${((1 - opOut(opSpan(d, .5, 1.2))) * 18).toFixed(1)}px,0)`;
  $('.op-lr').style.setProperty('--lc', green ? '#5de3a0' : scan > 0 ? '#9ff6ff' : `rgba(255,143,163,${(.55 + .35 * Math.sin(t * 4)).toFixed(2)})`);
  const r = opSpan(a, .95, 1.65);
  o($('.op-ring'), green ? .9 * (1 - r) : 0); $('.op-ring').style.transform = `scale(${(1 + r * 1.9).toFixed(3)},${(1 + r * 3.2).toFixed(3)})`;
  o($('.op-cta'), opSpan(d, 1.6, 2) * (tap === null ? .65 + .35 * Math.cos((t - 3.3) * 2.6) : 1 - opSpan(a, 0, .2)));
  o($('.op-wel'), tap === null ? 0 : opSpan(a, 1.05, 1.3) * (1 - opSpan(a, 1.75, 2.05)));
  $('.op-wel').style.transform = `translate3d(0,${(tap === null ? 10 : (1 - opOut(opSpan(a, 1.05, 1.5))) * 10).toFixed(1)}px,0)`;
  if(tap === null) return;
  // The sounds, each once.
  if(a > .5 && !OP.cues.b){ OP.cues.b = 1; opSound('beep'); }
  if(a > .95 && !OP.cues.c){ OP.cues.c = 1; opSound('chime'); }
  if(a > 1.75 && !OP.cues.w){ OP.cues.w = 1; opSound('whoosh'); }
  // Into the app: the green ring grows from the reader and the real Home shows inside it.
  if(a >= 1.7){
    if(!OP.ring){
      const rr = $('.op-reader').getBoundingClientRect(), cx = rr.left + rr.width / 2, cy = rr.top + rr.height / 2;
      OP.ring = { cx, cy, max: Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 30 };
      el.classList.add('is-opening');
      document.documentElement.classList.remove('op-on');   // Home shows through the ring: its own top bar and background come back
    }
    const R = Math.pow(opSpan(a, 1.7, 2.5), 1.7) * OP.ring.max, { cx, cy } = OP.ring, scene = $('.op-scene'), rg = $('.op-ring2');
    const m = `radial-gradient(circle ${R.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, transparent calc(100% - 1px), #000 100%)`;
    scene.style.webkitMaskImage = m; scene.style.maskImage = m;
    rg.style.transform = `translate3d(${(cx - R).toFixed(1)}px,${(cy - R).toFixed(1)}px,0)`;
    rg.style.width = rg.style.height = (2 * R).toFixed(1) + 'px';
    o(rg, 1 - opSpan(a, 2.15, 2.5));
  }
  if(a >= 2.5) openingFinish(false);
}

/* Take it down and hand over to Home. fade: a 260 ms fade (a skip, Escape, Still). */
function openingFinish(fade){
  const el = OP.el; if(!el || OP.leaving) return;
  OP.leaving = true;
  cancelAnimationFrame(OP.raf);
  window.removeEventListener('resize', opFit);
  opMusicStop(OP.tap === null ? .4 : OP_MUSIC_FADE);
  const end = () => {
    el.remove();
    document.documentElement.classList.remove('op-on');
    if(OP.el === el){ OP.el = null; OP.ring = null; OP.face = null; OP.leaving = false; }
    try{ window.dispatchEvent(new Event('hub-opening-done')); }catch(e){}
  };
  if(fade){ el.classList.add('is-leaving'); setTimeout(end, 270); }
  else end();
}

/* ---------- More's Opening card: on / off, Sound, the badge title, Replay ---------- */
function openingMoreHtml(){
  const on = openingOn(), snd = openingSoundOn(), t = opGet(OP_TITLE_KEY) || '';
  const sw = (id, val, label, sub, fn) => `
      <div class="ta-switchrow"><span><b>${label}</b><br><small>${sub}</small></span>
        <button class="ta-switch is-calm" id="${id}" type="button" role="switch" aria-checked="${val ? 'true' : 'false'}" aria-label="${label}" onclick="${fn}(this.getAttribute('aria-checked') !== 'true')"></button></div>`;
  return `<div class="op-more">
    <div class="home-sec-head"><h3>Opening</h3></div>
    <div class="op-more-card">
      ${sw('opOnSwitch', on, 'Badge opening', 'Your badge, every time the Hub starts', 'openingSetOn')}
      ${sw('opSoundSwitch', snd, 'Sound', 'Soft music, a beep and a chime', 'openingSetSound')}
      <label class="op-more-title"><b>Badge title</b>
        <input id="opTitleInput" type="text" maxlength="${OP_TITLE_MAX}" placeholder="${OP_TITLE_DEFAULT}" value="${t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}" autocomplete="off" onchange="openingSetTitle(this.value)"></label>
      <button class="btn btn-ghost" type="button" onclick="openingReplay()">Replay the opening</button>
    </div>
  </div>`;
}
function opSwitch(id, v){ const b = document.getElementById(id); if(b) b.setAttribute('aria-checked', v ? 'true' : 'false'); }
function openingSetOn(v){ opSet(OP_KEY, v ? null : 'off'); opSwitch('opOnSwitch', v); }
function openingSetSound(v){ opSet(OP_SOUND_KEY, v ? null : 'off'); opSwitch('opSoundSwitch', v); }
function openingSetTitle(v, quiet){
  const t = String(v || '').replace(/\s+/g, ' ').trim().slice(0, OP_TITLE_MAX);
  opSet(OP_TITLE_KEY, t && t !== OP_TITLE_DEFAULT ? t : null);
  if(!quiet && typeof showToast === 'function') showToast(`Your badge says “${openingTitle()}”.`);
}
function openingReplay(){
  if(typeof examTimer !== 'undefined' && examTimer){ if(typeof showToast === 'function') showToast('Not during a timed exam.'); return; }
  const i = document.getElementById('opTitleInput'); if(i) openingSetTitle(i.value, true);
  opAudio(); // inside this tap, so the music can play while the badge waits
  try{ closeMoreSheet(); }catch(e){}
  try{ if(typeof goHome === 'function') goHome(); }catch(e){}
  setTimeout(() => openingStart(true), 60);
}
