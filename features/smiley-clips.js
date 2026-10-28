/* ---------- Dr. Smiley, full body: his clips ----------
   His big moves as filmed clips (2026-10-27, Jose: "I want it fluid and
   natural"): an image-to-video tool animates his master picture, the clip
   is cut into see-through frames (docs/art/dr-smiley-clips/, keyclip.py:
   drsmiley/clips/<move>/0000.webp ...) and played here over his rig, which
   keeps the small life (breathing, blinks, glances, the nod) and every move
   that has no clip. The rig swaps drawings; a clip bends, so the two never
   mix mid-move: the clip fades in over the rig at rest and fades out to it.

   His head stays his own (2026-10-28, Jose: a clip starting read as a
   face switch; the video tool draws his face rounder, with bigger eyes):
   the rig's head, with his 30 expressions, is drawn above the canvas and
   rides the clip's body, moved each frame to where the clip's head is
   (head.json beside the frames, from layers/headtrack.py), the clip's own
   head hidden under it. Only the rig's body fades out under the clip.

   drClipPlay(mount, name, done): plays DR_CLIPS[name] on a mount of
   features/smiley-body.js (a canvas over the SVG), or returns false (no
   such clip, Still, reduced motion, frames not loaded yet, a clip already
   playing) so the caller falls back to the rig. drClipPreload(name) fetches
   a clip's frames; drClipPreloadSeq(names, delay) fetches clips one after
   another (a mount asks for the ones it needs first, the rest later); the
   service worker keeps them as assets (stale-while-revalidate), nothing
   precached: the first launch after a deploy may wave on the rig.
   Rules: docs/features/dr-smiley.md, "Clips". Loaded after smiley-body.js. */
'use strict';

const DR_CLIPS = {
  // 30 fps, 320 x 440 (the master's grid scaled), from Jose's Sora clips (2026-10-27), each
  // starting and ending in the master's pose; keyed by keyclip.py, every frame checked by checkclip.py
  greet: { dir: './drsmiley/clips/wave/', n: 150, fps: 30, w: 320, h: 440 },     // the wave, 5 s
  // the jump with both fists up, 7 s, on a green wall (on grey the raised sleeves keyed out torn); its frames
  // keep 200 rows of the grid above the master's top, so the jump stays in the picture: `top` (2026-10-28)
  cheer: { dir: './drsmiley/clips/cheer/', n: 210, fps: 30, w: 320, h: 500, top: 200 },
  think: { dir: './drsmiley/clips/think/', n: 210, fps: 30, w: 320, h: 440 },    // the finger on the chin, the aha, 7 s
  wince: { dir: './drsmiley/clips/wince/', n: 180, fps: 30, w: 320, h: 440 },    // the flinch and the caring smile, 6 s
  bounce: { dir: './drsmiley/clips/thumbs/', n: 180, fps: 30, w: 320, h: 440 },  // the hop with the thumbs-up (a right answer), 6 s
};
const DR_CLIP_FADE = 150;   // ms: the clip's first frame over the rig's rest, and back (their small likeness difference hidden)

// The rig's head centre at rest on the clips' 320 x 440 grid, measured the way headtrack.py
// measures (the blob of skin and hair), and the clips' head centre at rest (their first frame).
// A clip's head at frame i moves the rig's head by (head[i] - DR_CLIP_HEAD0), in grid px.
const DR_CLIP_HEAD0 = [168.6, 93.4];
// His face acts along with each clip, on his own head (the clip's face is under it): beats of
// [at (ms from the clip's start), face, brow]. The times follow the clips' own acting.
const DR_CLIP_FACES = {
  greet:  [[0, 'rest', 'rest'], [500, 'smile1', 'up'], [900, 'smile', 'up'], [3400, 'smile2', 'rest'], [4300, 'smile1', 'rest'], [4700, 'rest', 'rest']],
  cheer:  [[0, 'rest', 'rest'], [600, 'smile1', 'up'], [1300, 'smile', 'up'], [1800, 'laugh1', 'up'], [2200, 'laugh', 'up'], [2600, 'laugh1', 'up'], [3300, 'smile', 'up'], [3700, 'laugh1', 'up'], [4400, 'smile', 'up'], [5600, 'smile1', 'rest'], [6400, 'rest', 'rest']],
  think:  [[0, 'rest', 'rest'], [600, 'blink1', 'focused'], [1200, 'lookUR', 'focused'], [3200, 'lookU', 'focused'], [4400, 'lookUR', 'focused'], [5300, 'rest', 'up'], [5700, 'smile', 'rest'], [6500, 'rest', 'rest']],
  wince:  [[0, 'rest', 'rest'], [500, 'blink2', 'caring'], [900, 'worried', 'caring'], [2600, 'sad', 'caring'], [3600, 'smile1', 'rest'], [4400, 'smile', 'rest'], [5500, 'rest', 'rest']],
  bounce: [[0, 'rest', 'rest'], [500, 'smile1', 'up'], [1100, 'smile', 'up'], [1900, 'laugh1', 'up'], [3200, 'smile', 'up'], [4800, 'smile1', 'rest'], [5500, 'rest', 'rest']],
};
const drClipFrames = new Map();   // name -> { imgs, head, ready: Promise, ok }
function drClipPreload(name){
  const C = DR_CLIPS[name];
  if(!C) return null;
  if(drClipFrames.has(name)) return drClipFrames.get(name);
  const imgs = [];
  const loads = [];
  for(let i = 0; i < C.n; i++){
    const im = new Image();
    im.decoding = 'async'; im.fetchPriority = 'low';   // behind the page's own files
    loads.push(new Promise(res => { im.onload = () => res(true); im.onerror = () => res(false); }));
    im.src = C.dir + String(i).padStart(4, '0') + '.webp';
    imgs.push(im);
  }
  const entry = { imgs, head: null, ok: false };
  const track = fetch(C.dir + 'head.json').then(r => r.ok ? r.json() : null).then(h => { entry.head = h; }).catch(() => {});
  entry.ready = Promise.all([...loads, track]).then(r => { entry.ok = r.slice(0, C.n).every(Boolean); return entry.ok; });
  drClipFrames.set(name, entry);
  return entry;
}
/* Clips one after another, each once the one before has arrived, starting after a
   delay (2026-10-27: every mount fetching all five at once, 930 frames, starved Home's
   hello of frames in the test harness and would weigh on a phone's launch). Home asks
   for the wave first and the rest after the hello; a quiz card for its own two first. */
function drClipPreloadSeq(names, delayMs){
  setTimeout(() => {
    let p = Promise.resolve();
    for(const n of names) p = p.then(() => { const e = drClipPreload(n); return e ? e.ready : null; });
  }, delayMs || 0);
}
function drClipCan(){
  if(typeof drMode === 'function' && drMode() === 'still') return false;
  if(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}
/* Play a clip on a mount. The canvas sits over the SVG (app.css, .db-clip);
   the host's is-clip class fades the SVG out and the canvas in. Frames are
   drawn by wall clock (a dropped frame skips, never slows), the decode of
   each kept a few frames ahead. The rig is stopped and put at rest first,
   so the hand-off at both ends is rest to rest. */
function drClipPlay(m, name, done){
  const C = DR_CLIPS[name], F = drClipPreload(name);
  if(!C || !F || !F.ok || !drClipCan() || m.clip) return false;
  const host = m.host;
  m.body.stop(); m.body.rest();
  const cv = document.createElement('canvas');
  cv.className = 'db-clip'; cv.width = C.w; cv.height = C.h; cv.setAttribute('aria-hidden', 'true');
  if(C.top){ cv.style.height = (100 * (1470 + C.top) / 1470).toFixed(3) + '%'; cv.style.top = (-100 * C.top / 1470).toFixed(3) + '%'; }   // the rows above the master's top: above the host
  const ctx = cv.getContext('2d');
  // his own head rides the clip: the SVG's head group, moved to the clip's head each frame (SVG
  // units: the grid is 320 x 440 for 1070 x 1470, so 1 grid px is 1070/320 units); a clip with
  // headroom (C.top) has its frames 60 rows taller, head.json in those pixels
  // the offset goes on the head's idle wrapper (.db-idle-head), not .db-head itself: a CSS transform there would override
  // the rig's own transform attribute on .db-head (the lift and tilt of a performance)
  const headEl = m.svg.querySelector('.db-idle-head'), k = 1070 / 320, topRows = C.top ? Math.round(C.top * 320 / 1070) : 0;
  // the head rides the clip's head, and acts with it (a head carried flat over a jumping body read as hovering): it leans
  // into sideways motion (a degree per grid px of travel over 6 frames, at most 7) and squashes a little on a fast rise or
  // drop (up to 4%), both from the track itself, about the neck
  const headAt = i => { const h = F.head && F.head[i]; if(!h || !headEl) return;
    const dx = (h[0] - DR_CLIP_HEAD0[0]) * k, dy = (h[1] - topRows - DR_CLIP_HEAD0[1]) * k;
    const b = F.head[Math.max(0, i - 6)], vx = h[0] - b[0], vy = h[1] - b[1];
    const lean = Math.max(-7, Math.min(7, vx * 1.0)), sq = 1 + Math.max(-.04, Math.min(.04, -vy * .002));
    headEl.style.transformOrigin = '547px 585px';   // the neck, in the rig's units
    headEl.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${lean.toFixed(2)}deg) scale(${(2 - sq).toFixed(3)}, ${sq.toFixed(3)})`; };
  // his face along the clip: the next beat whose time has come (the rig walks the in-betweens itself)
  const faces = DR_CLIP_FACES[name] || []; let fi = 0;
  const faceAt = ms => { while(fi < faces.length && faces[fi][0] <= ms){ m.body.set({ face: faces[fi][1], brow: faces[fi][2] }); fi++; } };
  const draw = i => { ctx.clearRect(0, 0, C.w, C.h); ctx.drawImage(F.imgs[i], 0, 0, C.w, C.h); headAt(i); faceAt(i * 1000 / C.fps); };
  const ahead = i => { for(let k = i + 1; k < Math.min(C.n, i + 6); k++){ const im = F.imgs[k]; if(im.decode && !im.__dec){ im.__dec = true; im.decode().catch(() => {}); } } };
  draw(0); ahead(0);
  host.appendChild(cv);
  const clip = { name, canvas: cv, raf: 0, timer: 0, stopped: false };
  m.clip = clip;
  // the canvas fades in over the rig at rest (is-fading); once it is opaque the rig's pieces go (is-clip; visibility,
  // no fade of its own: hiding them while the canvas was still see-through showed the background through him)
  requestAnimationFrame(() => { if(!clip.stopped) host.classList.add('is-fading'); });
  clip.inT = setTimeout(() => { if(!clip.stopped) host.classList.add('is-clip'); }, DR_CLIP_FADE + 30);
  const step = 1000 / C.fps, t0 = performance.now() + DR_CLIP_FADE;
  let shown = 0;
  const end = () => {
    if(clip.stopped) return;
    clip.stopped = true;
    draw(C.n - 1);
    clearTimeout(clip.inT);
    host.classList.remove('is-clip');                                              // the rig back under the still-opaque canvas
    if(headEl) headEl.style.transform = ''; m.body.set({ face: 'rest', brow: 'rest' });
    requestAnimationFrame(() => host.classList.remove('is-fading'));               // then the canvas fades out
    clip.timer = setTimeout(() => { cv.remove(); if(m.clip === clip) m.clip = null; if(done) done(); }, DR_CLIP_FADE + 40);
  };
  const tick = now => {
    if(clip.stopped) return;
    const i = Math.min(C.n - 1, Math.max(0, Math.floor((now - t0) / step)));
    if(i !== shown){ shown = i; draw(i); ahead(i); }
    if(i >= C.n - 1) end(); else clip.raf = requestAnimationFrame(tick);
  };
  clip.raf = requestAnimationFrame(tick);
  clip.stop = () => { if(clip.stopped) return; cancelAnimationFrame(clip.raf); clip.stopped = true; clearTimeout(clip.timer); clearTimeout(clip.inT); host.classList.remove('is-clip', 'is-fading'); cv.remove(); if(headEl) headEl.style.transform = ''; if(m.clip === clip) m.clip = null; };
  return true;
}
function drClipStop(m){ if(m && m.clip) m.clip.stop(); }
