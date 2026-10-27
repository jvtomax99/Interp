/* ---------- Dr. Smiley, full body: the Hub side ----------
   drsmiley/body.js is the rig (the layers, the joint engine, his acting:
   DR_BODY_PERF, DR_BODY_STATES, drBodyIdle). This file is where he stands
   in the app and how the app's one Dr. Smiley logic reaches him: drPerform's
   stage (drBodyStage), the names it asks for (drBodyAct, DR_BODY_ACT), the
   task state on <html> (data-dr-state, from drTask) as his held state and
   idle level (drBodyStateSync), and his mode (drmodechange).

   Hosts: an element of class db-host. Home: .home-body in the greeting
   (renderHome draws it, home-polish.js places and wires it: tap, pet,
   double-tap, the hello). A quiz: .quiz-dr in the quiz card (renderQuiz).
   drBodyMount(host) fills a host with the rig and returns the mount;
   drBodyMountAll() mounts the quiz host renderContent has just painted
   (it calls this after the practice screen), carrying a quiz body from the
   old card to the new one, so the bounce for an answer is not cut by the
   next question.
   Rules: docs/features/dr-smiley.md, "Full body". Loaded right after
   drsmiley/body.js, before index.html's own script. */
'use strict';

const DR_BODY_ROOT = './drsmiley/';
const drBodyMounts = new Set();
// The head's sequence names (DR_FACE_SEQ, DR_PERF, DR_REACTS, Home's old
// names) as his body's performances. '' means nothing to do; a name not
// listed gets a nod.
const DR_BODY_ACT = {
  greet: 'greet', hello: 'greet', ack: 'ack', okay: 'ack', nod: 'ack', smile: 'ack', encourage: 'ack', listen: 'ack',
  notice: 'glance', glance: 'glance', glanceL: 'glance', glanceR: 'glance', around: 'glance', peekL: 'glance', peekR: 'glance', peekDown: 'glance',
  think: 'think', ponder: 'think', gleam: 'think',
  cheer: 'cheer', celebrate: 'cheer', party: 'cheer', wow: 'cheer', laugh: 'cheer', pet: 'cheer',
  wink: 'wink', love: 'wink', hearts: 'wink', kiss: 'wink', sing: 'wink', hum: 'wink',
  bounce: 'bounce', proud: 'bounce', giggle: 'bounce', bouncy: 'bounce',
  wince: 'wince', worry: 'wince', composed: 'shrug', surprise: 'shrug',
  answer: 'read', answerGeneral: 'read', doze: 'doze', blink: '',
};
// The app's task states (DR_STATES) that his body holds (DR_BODY_STATES).
const DR_BODY_STATE = { attentive: 'listening', processing: 'thinking', answering: 'answering', celebrating: 'celebrating', uncertain: 'uncertain' };

function drBodyMountOf(host){ for(const m of drBodyMounts) if(m.host === host) return m; return null; }
function drBodyMount(host, o){
  o = o || {};
  if(!host) return null;
  if(host.dataset.dbMounted) return drBodyMountOf(host);
  host.dataset.dbMounted = '1';
  host.classList.add('db-host');
  host.innerHTML = drBodyArt('db-app', DR_BODY_ROOT);
  const svg = host.querySelector('svg.db');
  // His mode is the app's (Lively / Focused / Still, setSmileyMode); the rig reads it each time.
  const body = drBody(svg, { get mode(){ return typeof drMode === 'function' ? drMode() : 'lively'; } });
  const m = { host, svg, body, seen: true, dozed: null };
  // o.quiet (Home): rest beats are face-only, on timers, so nothing runs on the page's frames at rest.
  m.idle = drBodyIdle(body, { canPlay: () => m.seen && m.host.isConnected && !m.clip && (!o.canPlay || o.canPlay()), quiet: !!o.quiet });
  // Off screen: no rest beats, and the breathing pauses (nothing runs where nobody can see it).
  m.watch = () => { if(m.io) m.io.disconnect(); m.io = new IntersectionObserver(en => { m.seen = en[en.length - 1].isIntersecting; m.host.classList.toggle('is-offscreen', !m.seen); }); m.io.observe(m.host); };
  m.watch();
  // A move with a filmed clip (features/smiley-clips.js, DR_CLIPS) plays the clip; the rig
  // plays everything else, and the clip's move when the clip can't (Still, not loaded yet).
  // While a clip plays, nothing else is asked of him (the rig would show through).
  m.clip = null;
  m.act = seq => {
    const n = DR_BODY_ACT[seq] === undefined ? 'ack' : DR_BODY_ACT[seq];
    if(!n) return false;
    if(m.clip) return false;
    if(n === 'glance') return body.busy() ? false : body.perform('glance');
    if(typeof drClipPlay === 'function' && DR_CLIPS[n] && drClipPlay(m, n)) return true;
    return body.perform(n);
  };
  m.destroy = () => { m.idle(); if(m.io) m.io.disconnect(); if(typeof drClipStop === 'function') drClipStop(m); body.stop(); drBodyMounts.delete(m); delete m.host.dataset.dbMounted; };
  if(typeof drClipPreload === 'function') for(const k in DR_CLIPS) drClipPreload(k);
  drBodyMounts.add(m);
  drBodyStateSync(m);
  return m;
}
// The one you can see, if any: the stage drPerform plays on (drStage).
function drBodyStage(){
  for(const m of [...drBodyMounts]){
    if(!m.host.isConnected){ m.destroy(); continue; }
    const r = m.host.getBoundingClientRect();
    if(!r.width || r.bottom <= 0 || r.top >= innerHeight) continue;
    if(getComputedStyle(m.host).visibility === 'hidden') continue;
    return m;
  }
  return null;
}
function drBodyAct(seq){ const m = drBodyStage(); return m ? m.act(seq) : false; }
/* The app's state (drTask: data-dr-state on <html>) on his body: the held
   state, the idle level (DR_STATES[state].idle), and the resting state's
   one doze. */
function drBodyStateSync(one){
  const st = document.documentElement.dataset.drState || 'available';
  const S = (typeof DR_STATES !== 'undefined' && DR_STATES[st]) || { idle: 'full' };
  const held = DR_BODY_STATE[st] || null;
  for(const m of (one ? [one] : drBodyMounts)){
    if(!m.host.isConnected) continue;
    m.body.state(held);
    m.idle.setLevel(S.idle || 'full');
    if(st === 'resting' && m.dozed !== st){ m.dozed = st; setTimeout(() => { if(document.documentElement.dataset.drState === 'resting') m.idle.doze(); }, 1200); }
    if(st !== 'resting') m.dozed = null;
  }
}
new MutationObserver(() => drBodyStateSync()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-dr-state'] });
// Lively / Focused / Still changed: his held state starts over in the new mode.
window.addEventListener('drmodechange', () => {
  for(const m of drBodyMounts){ const s = m.body.stateName(); if(typeof drClipStop === 'function') drClipStop(m); m.body.stop(); m.body.rest(); if(s) m.body.state(s, { restart: true }); }
});
// The quiz host renderContent has just painted (it calls this after the
// practice screen): mount it, or carry the quiz body over from the old card.
let drQuizMount = null;
function drBodyMountAll(root){
  root = root || document.getElementById('content') || document;
  for(const host of root.querySelectorAll('.quiz-dr')){
    if(host.dataset.dbMounted) continue;
    if(drQuizMount && !drQuizMount.host.isConnected){
      const q = drQuizMount;
      host.appendChild(q.svg); host.dataset.dbMounted = '1'; host.classList.add('db-host'); q.host = host; q.watch();
      continue;
    }
    drQuizMount = drBodyMount(host);
  }
  if(drQuizMount && !drQuizMount.host.isConnected && !root.querySelector('.quiz-dr')){ drQuizMount.destroy(); drQuizMount = null; }
}
