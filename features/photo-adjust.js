/* ---------- Adjust your photo ----------
   docs/features/photo-adjust.md. After you pick a photo of yourself (the name
   sheet, your initial at the top right), this opens over it: drag to move,
   pinch or the slider to zoom, Save or Cancel. The square inside the frame is
   what is saved; two live previews show it the way the Hub shows it, round in
   Team Chat and tall on the opening's badge (which trims the square's sides).
   It used to save the middle square of the photo without asking, which cut a
   tall selfie's head or chin (Jose, 2026-11-06).

   photoAdjust(file) -> Promise of a JPEG Blob (PA_OUT square), or null when
   cancelled. Declarations only (AGENTS.md, the features/ rule). */

const PA_OUT = 320;          // saved side: the badge's 86px-tall slot at 3x, with room
const PA_ZOOM_MAX = 4;
// The badge shows the square in a 66 x 86 slot (object-fit: cover), so its middle 66/86 of the width.
const PA_BADGE = { w: 66, h: 86 };
const PA = { el: null, img: null, done: null, S: 0, s: 0, base: 1, z: 1, x: 0, y: 0, pts: new Map(), pinch: null, prevFocus: null };

function photoAdjust(file){
  return new Promise(resolve => {
    if(!file || !/^image\//.test(file.type || '')){ resolve(null); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); if(typeof showToast === 'function') showToast('Could not read that image.'); resolve(null); };
    img.onload = () => {
      if(!img.naturalWidth || !img.naturalHeight){ img.onerror(); return; }
      paOpen(img, url, resolve);
    };
    img.src = url;
  });
}

function paOpen(img, url, resolve){
  paClose(null);
  PA.prevFocus = document.activeElement;
  const el = document.createElement('div');
  el.className = 'pa';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'paTitle');
  el.tabIndex = -1;
  el.innerHTML = `<div class="pa-sheet">
      <h3 id="paTitle">Adjust your photo</h3>
      <p class="pa-sub">Drag to move. Pinch or use the slider to zoom.</p>
      <div class="pa-stage" tabindex="0" aria-label="Your photo. Arrow keys move it, plus and minus zoom.">
        <img class="pa-img" alt="" draggable="false">
        <div class="pa-ring" aria-hidden="true"></div>
      </div>
      <label class="pa-zoom"><span aria-hidden="true">−</span>
        <input type="range" min="1" max="${PA_ZOOM_MAX}" step="0.01" value="1" aria-label="Zoom">
        <span aria-hidden="true">+</span></label>
      <div class="pa-previews" aria-hidden="true">
        <figure><div class="pa-pv pa-pv-chat"><img alt=""></div><figcaption>Team Chat</figcaption></figure>
        <figure><div class="pa-pv pa-pv-badge"><img alt=""></div><figcaption>Your badge</figcaption></figure>
      </div>
      <div class="pa-actions">
        <button type="button" class="btn btn-ghost pa-cancel">Cancel</button>
        <button type="button" class="btn btn-primary pa-save">Save</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  PA.el = el; PA.img = img; PA.url = url; PA.done = resolve; PA.pts.clear(); PA.pinch = null;
  el.querySelectorAll('img').forEach(i => { i.src = url; });
  paLayout(true);

  const stage = el.querySelector('.pa-stage'), range = el.querySelector('.pa-zoom input');
  stage.addEventListener('pointerdown', paDown);
  stage.addEventListener('pointermove', paMove);
  stage.addEventListener('pointerup', paUp);
  stage.addEventListener('pointercancel', paUp);
  stage.addEventListener('wheel', e => { e.preventDefault(); paZoomTo(PA.z * Math.exp(-e.deltaY / 400), paLocal(e)); }, { passive: false });
  stage.addEventListener('keydown', e => {
    const step = e.shiftKey ? 30 : 8, k = e.key;
    if(k === 'ArrowLeft') PA.x += step; else if(k === 'ArrowRight') PA.x -= step;
    else if(k === 'ArrowUp') PA.y += step; else if(k === 'ArrowDown') PA.y -= step;
    else if(k === '+' || k === '=') { paZoomTo(PA.z * 1.1); e.preventDefault(); return; }
    else if(k === '-') { paZoomTo(PA.z / 1.1); e.preventDefault(); return; }
    else return;
    e.preventDefault(); paClamp(); paDraw();
  });
  range.addEventListener('input', () => paZoomTo(+range.value));
  el.querySelector('.pa-cancel').addEventListener('click', () => paClose(null));
  el.querySelector('.pa-save').addEventListener('click', paSave);
  el.addEventListener('keydown', e => { if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); paClose(null); } });
  PA.onResize = () => paLayout(false);
  window.addEventListener('resize', PA.onResize);
  // Focus on the sheet (Escape works, the keys reach the stage after a Tab), not a ring on the photo from the start.
  try{ el.focus({ preventScroll: true }); }catch(e){}
}

// Fit the stage to the screen; first time, the photo covers it, a tall photo set a little above its middle (where faces are).
function paLayout(first){
  // Its layout width, not its box on screen: the sheet opens with a small scale-in that would shrink a measured box.
  const stage = PA.el.querySelector('.pa-stage'), S = stage.clientWidth;
  const { naturalWidth: w, naturalHeight: h } = PA.img;
  if(!S) return;
  const old = PA.S;
  PA.S = S; PA.base = S / Math.min(w, h);
  if(first){
    PA.z = 1; PA.s = PA.base;
    PA.x = (S - w * PA.s) / 2;
    PA.y = (S - h * PA.s) * (h > w ? .3 : .5);
  } else if(old){
    const k = S / old; PA.x *= k; PA.y *= k; PA.s = PA.base * PA.z;
  }
  paClamp(); paDraw();
}

// The photo always covers the square: no empty edge can be saved.
function paClamp(){
  const { naturalWidth: w, naturalHeight: h } = PA.img, S = PA.S, s = PA.s;
  PA.x = Math.min(0, Math.max(S - w * s, PA.x));
  PA.y = Math.min(0, Math.max(S - h * s, PA.y));
}

// Zoom keeping the point under f (stage pixels; the middle by default) where it is.
function paZoomTo(z, f){
  z = Math.max(1, Math.min(PA_ZOOM_MAX, z));
  if(!f) f = { x: PA.S / 2, y: PA.S / 2 };
  const s2 = PA.base * z, k = s2 / PA.s;
  PA.x = f.x - (f.x - PA.x) * k; PA.y = f.y - (f.y - PA.y) * k;
  PA.z = z; PA.s = s2;
  paClamp(); paDraw();
}

function paDraw(){
  const el = PA.el; if(!el) return;
  const { naturalWidth: w, naturalHeight: h } = PA.img;
  const put = (img, k, dx) => { img.style.width = (w * PA.s * k).toFixed(2) + 'px'; img.style.height = (h * PA.s * k).toFixed(2) + 'px';
    img.style.transform = `translate3d(${(PA.x * k + dx).toFixed(2)}px,${(PA.y * k).toFixed(2)}px,0)`; };
  put(el.querySelector('.pa-img'), 1, 0);
  const chat = el.querySelector('.pa-pv-chat'), cw = chat.clientWidth || 56;
  put(chat.querySelector('img'), cw / PA.S, 0);
  // The badge: the square at its slot's height, centred, so its sides are trimmed.
  const kb = PA_BADGE.h / PA.S;
  put(el.querySelector('.pa-pv-badge img'), kb, (PA_BADGE.w - PA_BADGE.h) / 2);
  const r = el.querySelector('.pa-zoom input'); if(r && +r.value !== PA.z) r.value = PA.z.toFixed(2);
}

// A finger's place in the stage's own pixels (its box on screen, scaled back if the sheet is mid scale-in).
function paLocal(e){ const st = PA.el.querySelector('.pa-stage'), r = st.getBoundingClientRect(), k = st.clientWidth / (r.width || 1);
  return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }; }
function paDown(e){
  e.preventDefault();
  try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){}
  PA.pts.set(e.pointerId, paLocal(e));
  PA.pinch = null;
}
function paMove(e){
  if(!PA.pts.has(e.pointerId)) return;
  const prev = PA.pts.get(e.pointerId), now = paLocal(e);
  PA.pts.set(e.pointerId, now);
  if(PA.pts.size === 1){
    PA.x += now.x - prev.x; PA.y += now.y - prev.y; paClamp(); paDraw();
  } else if(PA.pts.size === 2){
    const [a, b] = [...PA.pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if(PA.pinch && PA.pinch.d > 0){
      PA.x += mid.x - PA.pinch.mid.x; PA.y += mid.y - PA.pinch.mid.y;
      paZoomTo(PA.z * d / PA.pinch.d, mid);
    }
    PA.pinch = { d, mid };
  }
}
function paUp(e){ PA.pts.delete(e.pointerId); PA.pinch = null; }

function paSave(){
  const { img } = PA, s = PA.s, side = PA.S / s;
  const c = document.createElement('canvas'); c.width = c.height = PA_OUT;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, -PA.x / s, -PA.y / s, side, side, 0, 0, PA_OUT, PA_OUT);
  const btn = PA.el.querySelector('.pa-save'); btn.disabled = true;
  c.toBlob(blob => {
    if(!blob){ btn.disabled = false; if(typeof showToast === 'function') showToast('Could not process that image.'); return; }
    paClose(blob);
  }, 'image/jpeg', .86);
}

function paClose(result){
  const el = PA.el; if(!el) return;
  const done = PA.done;
  PA.el = null; PA.done = null;
  window.removeEventListener('resize', PA.onResize);
  el.remove();
  if(PA.url){ URL.revokeObjectURL(PA.url); PA.url = null; }
  try{ if(PA.prevFocus && PA.prevFocus.focus) PA.prevFocus.focus({ preventScroll: true }); }catch(e){}
  if(done) done(result);
}
