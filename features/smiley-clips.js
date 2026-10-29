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

// The rig's head centre at rest on the clips' 320 x 440 grid, measured the way headtrack.py
// measures (the blob of skin and hair), and the clips' head centre at rest (their first frame).
// A clip's head at frame i moves the rig's head by (head[i] - DR_CLIP_HEAD0), in grid px.
const DR_CLIP_HEAD0 = [168.6, 93.4];
// Before a clip the rig's small life (the breath, the arms' swing, the head's drift, the sway) eases to its
// neutral pose over this long, and after the clip it starts again from neutral (2026-10-29, Jose: the pop at
// a move's end; measured: the clip's rest and the rig's rest match in size and place, the jump at the swap was
// the rig caught mid-breath, arms 1.6 degrees out, the chest 1.2% taller, a sway).
const DR_CLIP_SETTLE = 150;
// A clip ends near the master's pose, not on it (the film drifts a little: hands, sleeves): its last frame blends
// into its own first frame over this long on the canvas, both the film's drawing, before the swap back to the rig.
const DR_CLIP_BLEND = 200;
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
  const entry = { imgs, head: null, pose: null, ok: false };
  const track = fetch(C.dir + 'head.json').then(r => r.ok ? r.json() : null).then(h => { entry.head = h; }).catch(() => {});
  const poseT = fetch(C.dir + 'head-pose.json').then(r => r.ok ? r.json() : null).then(h => { entry.pose = h; }).catch(() => {});
  entry.ready = Promise.all([...loads, track, poseT]).then(r => { entry.ok = r.slice(0, C.n).every(Boolean); return entry.ok; });
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
  const headEl = m.svg.querySelector('.db-idle-head'), k2 = 1070 / 320, topRows = C.top ? Math.round(C.top * 320 / 1070) : 0;
  // the head rides the clip's head and does what it did: its place (head.json), its tilt and its size (head-pose.json,
  // from the hair against the head's centre in the clip, before beheading; 2026-10-29: a head carried flat and level
  // over a body that tilts its head 16 degrees in the wave read as a photo stuck on). Turned and sized about the neck.
  const headAt = i => { const h = F.head && F.head[i]; if(!h || !headEl) return;
    const dx = (h[0] - DR_CLIP_HEAD0[0]) * k2, dy = (h[1] - topRows - DR_CLIP_HEAD0[1]) * k2;
    const p = (F.pose && F.pose[i]) || [0, 1], tilt = p[0], sc = p[1];
    headEl.style.transformOrigin = '547px 585px';   // the neck, in the rig's units
    headEl.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg) scale(${sc.toFixed(3)})`; };
  // his face along the clip: the next beat whose time has come (the rig walks the in-betweens itself)
  const faces = DR_CLIP_FACES[name] || []; let fi = 0;
  const faceAt = ms => { while(fi < faces.length && faces[fi][0] <= ms){ m.body.set({ face: faces[fi][1], brow: faces[fi][2] }); fi++; } };
  const draw = i => { ctx.clearRect(0, 0, C.w, C.h); ctx.drawImage(F.imgs[i], 0, 0, C.w, C.h); headAt(i); faceAt(i * 1000 / C.fps); };
  const ahead = i => { for(let k = i + 1; k < Math.min(C.n, i + 6); k++){ const im = F.imgs[k]; if(im.decode && !im.__dec){ im.__dec = true; im.decode().catch(() => {}); } } };
  ahead(0);
  const clip = { name, canvas: cv, raf: 0, timer: 0, stopped: false };
  m.clip = clip;
  // the rig's small life (app.css: the breath group's scale, the idle wrappers' turns) eases to neutral before the
  // swap and starts again from neutral after it: the clip's first and last frames are the master's pose, so the swap
  // then changes only the drawing's own shading, not his pose (DR_CLIP_SETTLE). The head's and the sway's cycles
  // start at an extreme in the stylesheet; a negative delay starts them where they cross neutral.
  const life = [...m.svg.querySelectorAll('.db-idle, .db-breath')];
  const settle = () => { for(const el of life){ const t = getComputedStyle(el).transform; el.style.animation = 'none'; el.style.transform = t === 'none' ? '' : t; }
    void m.svg.getBoundingClientRect(); for(const el of life){ el.style.transition = `transform ${DR_CLIP_SETTLE}ms ease-out`; el.style.transform = ''; } };
  const wake = () => { for(const el of life){ el.style.transition = ''; el.style.transform = ''; el.style.animation = '';
    if(el.classList.contains('db-idle-head')) el.style.animationDelay = '-1.85s'; else if(el.classList.contains('db-idle-sway')) el.style.animationDelay = '-2.825s'; } };
  // the hand-off, as a cut (2026-10-29: a cross-fade of the rig's body and the clip's, both at rest but not the
  // same drawing, showed for a frame as a ghost): the clip's first frame and the rig's body swap in the same paint
  // (is-clip: the canvas shown, the rig's pieces hidden; his head stays over both), and swap back at the end.
  const step = 1000 / C.fps; let t0 = 0, shown = 0;
  const end = () => {
    if(clip.stopped) return;
    clip.stopped = true;
    if(headEl) headEl.style.transform = ''; m.body.set({ face: 'rest', brow: 'rest' });
    host.classList.remove('is-clip'); cv.remove(); wake();                         // the rig's body back, at neutral, and the canvas gone in one paint
    if(m.clip === clip) m.clip = null; if(done) done();
  };
  // the last frame blending into the first (DR_CLIP_BLEND): the head's track walks back to its first values too
  const blend = k => { const a = F.imgs[C.n - 1], b = F.imgs[0]; ctx.clearRect(0, 0, C.w, C.h); ctx.globalAlpha = 1; ctx.drawImage(a, 0, 0, C.w, C.h); ctx.globalAlpha = k; ctx.drawImage(b, 0, 0, C.w, C.h); ctx.globalAlpha = 1;
    if(F.head && headEl){ const h0 = F.head[0], h1 = F.head[C.n - 1], p0 = (F.pose && F.pose[0]) || [0, 1], p1 = (F.pose && F.pose[C.n - 1]) || [0, 1];
      const mix = (u, v) => v + (u - v) * k, h = [mix(h0[0], h1[0]), mix(h0[1], h1[1])], p = [mix(p0[0], p1[0]), mix(p0[1], p1[1])];
      const dx = (h[0] - DR_CLIP_HEAD0[0]) * k2, dy = (h[1] - topRows - DR_CLIP_HEAD0[1]) * k2;
      headEl.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${p[0].toFixed(2)}deg) scale(${p[1].toFixed(3)})`; } };
  const tick = now => {
    if(clip.stopped) return;
    const i = Math.min(C.n - 1, Math.max(0, Math.floor((now - t0) / step)));
    if(i !== shown){ shown = i; draw(i); ahead(i); }
    if(i >= C.n - 1){ const k = (now - t0 - (C.n - 1) * step) / DR_CLIP_BLEND; if(k >= 1) end(); else { blend(Math.max(0, k)); clip.raf = requestAnimationFrame(tick); } }
    else clip.raf = requestAnimationFrame(tick);
  };
  const start = () => { if(clip.stopped) return; draw(0); host.appendChild(cv); host.classList.add('is-clip'); t0 = performance.now(); clip.raf = requestAnimationFrame(tick); };
  settle(); clip.timer = setTimeout(start, DR_CLIP_SETTLE);
  clip.stop = () => { if(clip.stopped) return; clearTimeout(clip.timer); cancelAnimationFrame(clip.raf); clip.stopped = true; host.classList.remove('is-clip'); cv.remove(); if(headEl) headEl.style.transform = ''; wake(); if(m.clip === clip) m.clip = null; };
  return true;
}
function drClipStop(m){ if(m && m.clip) m.clip.stop(); }
