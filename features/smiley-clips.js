/* ---------- Dr. Smiley, full body: his clips ----------
   His big moves as filmed clips (2026-10-27, Jose: "I want it fluid and
   natural"): an image-to-video tool animates his master picture, the clip
   is cut into see-through frames (docs/art/dr-smiley-clips/, keyclip.py:
   drsmiley/clips/<move>/0000.webp ...) and played here over his rig, which
   keeps the small life (breathing, blinks, glances, the nod) and every move
   that has no clip. The rig swaps drawings; a clip bends, so the two never
   mix mid-move: the clip fades in over the rig at rest and fades out to it.

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

const drClipFrames = new Map();   // name -> { imgs, ready: Promise, ok }
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
  const entry = { imgs, ok: false };
  entry.ready = Promise.all(loads).then(r => { entry.ok = r.every(Boolean); return entry.ok; });
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
  const draw = i => { ctx.clearRect(0, 0, C.w, C.h); ctx.drawImage(F.imgs[i], 0, 0, C.w, C.h); };
  const ahead = i => { for(let k = i + 1; k < Math.min(C.n, i + 6); k++){ const im = F.imgs[k]; if(im.decode && !im.__dec){ im.__dec = true; im.decode().catch(() => {}); } } };
  draw(0); ahead(0);
  host.appendChild(cv);
  const clip = { name, canvas: cv, raf: 0, timer: 0, stopped: false };
  m.clip = clip;
  // next frame: the class on the next paint so the fade runs
  requestAnimationFrame(() => { if(!clip.stopped) host.classList.add('is-clip'); });
  const step = 1000 / C.fps, t0 = performance.now() + DR_CLIP_FADE;
  let shown = 0;
  const end = () => {
    if(clip.stopped) return;
    clip.stopped = true;
    draw(C.n - 1);
    host.classList.remove('is-clip');
    clip.timer = setTimeout(() => { cv.remove(); if(m.clip === clip) m.clip = null; if(done) done(); }, DR_CLIP_FADE + 20);
  };
  const tick = now => {
    if(clip.stopped) return;
    const i = Math.min(C.n - 1, Math.max(0, Math.floor((now - t0) / step)));
    if(i !== shown){ shown = i; draw(i); ahead(i); }
    if(i >= C.n - 1) end(); else clip.raf = requestAnimationFrame(tick);
  };
  clip.raf = requestAnimationFrame(tick);
  clip.stop = () => { if(clip.stopped) return; cancelAnimationFrame(clip.raf); clip.stopped = true; clearTimeout(clip.timer); host.classList.remove('is-clip'); cv.remove(); if(m.clip === clip) m.clip = null; };
  return true;
}
function drClipStop(m){ if(m && m.clip) m.clip.stop(); }
