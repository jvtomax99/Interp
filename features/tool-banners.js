/* ---------- Tool banners ----------
   Translate, Term Review's start, Ask the Hub and Doctor Directory open under
   the same colour banner the glossary domains have: the title, the screen's
   own pin, one line of facts (Jose, 2026-11-06, from the phone mockups). When
   the way in was a pin on Home (a quick tile, a rail card), that pin flies
   into the banner while the screen draws. docs/features/tool-banners.md.

   Loaded before index.html's own script: bannerTone, escapeHtml, escapeAttr
   and drStill are read only when a function here runs. */

const TOOL_BANNERS = {
  translate:          { name: 'Translate',        pin: 'translate',        color: '#0E7490' },
  review:             { name: 'Term Review',      pin: 'review',           color: '#5B4DB3' },
  ask:                { name: 'Ask the Hub',      pin: 'wave',             color: '#252E6D' },
  'doctor-directory': { name: 'Doctor Directory', pin: 'doctor-directory', color: '#0F766E' },
};

// The banner. `meta` is plain text (escaped here); `action` (Doctor
// Directory's + Add, Ask's two links) and `figure` (Ask's Dr. Smiley, beside
// the pin) are trusted markup from the app.
function toolBannerHtml(key, meta, action, figure) {
  const b = TOOL_BANNERS[key];
  if (!b) return '';
  const tone = typeof bannerTone === 'function' ? bannerTone(b.color) : b.color;
  tbQueueFly(b.pin);
  return `<section class="tool-banner${b.name.length > 12 ? ' is-long' : ''}" data-tool="${key}" style="--dom:${tone};" aria-label="${escapeAttr(b.name)}">
      <div class="tool-banner-text">
        <h1 class="tool-banner-name">${escapeHtml(b.name)}</h1>
        <div class="tool-banner-line"><span class="tool-banner-meta" id="toolBannerMeta">${escapeHtml(meta || '')}</span>${action || ''}</div>
      </div>
      ${figure || ''}<span class="tool-banner-pin" aria-hidden="true"><img src="./pins/${b.pin}.webp" alt="" width="68" height="68" decoding="async"></span>
    </section>`;
}

// Doctor Directory's banner sits above its search, outside #content, so a
// search redraws the list and only the count changes here.
function toolBannerMeta(text) {
  const m = document.getElementById('toolBannerMeta');
  if (m && m.textContent !== text) m.textContent = text;
}

/* The fly. A tap on a Home pin is noted (capture phase, before the tile's own
   onclick navigates); the banner that draws next with the same pin takes it. */
const TB = { from: null, pending: null, live: null };
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('#content.is-home .qa-tile, #content.is-home .qa-card');
  const img = el && el.querySelector('img');
  const m = img && /pins\/([\w-]+)\.webp/.exec(img.getAttribute('src') || '');
  if (!m) return;
  const r = img.getBoundingClientRect();
  if (r.width) TB.from = { pin: m[1], rect: r, src: img.currentSrc || img.src, t: performance.now() };
}, true);

function tbStill() {
  return (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
    || (typeof drStill === 'function' && drStill()) || document.hidden;
}

function tbQueueFly(pin) {
  const f = TB.from;
  if (!f || f.pin !== pin || performance.now() - f.t > 800) return;
  TB.from = null;
  if (tbStill()) return;
  TB.pending = f;
  document.documentElement.classList.add('tb-flying');
  requestAnimationFrame(tbFly);
}

function tbDone() {
  document.documentElement.classList.remove('tb-flying');
  if (TB.live) { TB.live.remove(); TB.live = null; }
}

function tbFly() {
  const f = TB.pending;
  TB.pending = null;
  const target = document.querySelector('.tool-banner .tool-banner-pin img');
  if (!f || !target || tbStill()) return tbDone();
  // Where the pin rests: the screen is still sliding in (#content's
  // entrance), so that slide is taken off.
  const z = target.getBoundingClientRect();
  let ox = 0, oy = 0;
  const c = document.getElementById('content');
  if (c && c.contains(target)) {
    const t = getComputedStyle(c).transform;
    if (t && t !== 'none') { try { const m = new DOMMatrixReadOnly(t); ox = m.m41; oy = m.m42; } catch (e) {} }
  }
  const a = f.rect;
  const dx = (z.left + z.width / 2 - ox) - (a.left + a.width / 2);
  const dy = (z.top + z.height / 2 - oy) - (a.top + a.height / 2);
  const k = (target.offsetWidth || 68) / a.width;
  const fly = new Image();
  fly.src = f.src;
  fly.alt = '';
  fly.className = 'tb-fly';
  fly.style.cssText = `left:${a.left}px; top:${a.top}px; width:${a.width}px; height:${a.height}px;`;
  if (TB.live) TB.live.remove();
  TB.live = fly;
  document.body.appendChild(fly);
  const spring = getComputedStyle(document.documentElement).getPropertyValue('--spring0').trim();
  const easing = /^linear\(/.test(spring) && CSS.supports('animation-timing-function', spring) ? spring : 'cubic-bezier(.2,.8,.2,1)';
  let anim;
  try {
    anim = fly.animate([
      { transform: 'none' },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 28}px) scale(${1 + (k - 1) * 0.6}) rotate(-14deg)`, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${k}) rotate(-8deg)` },
    ], { duration: 588, easing, fill: 'forwards' });
  } catch (e) { return tbDone(); }
  const safety = setTimeout(tbDone, 1400);
  anim.finished.then(() => {
    clearTimeout(safety);
    tbDone();
    const pin = document.querySelector('.tool-banner .tool-banner-pin img');
    if (pin && pin.animate) pin.animate([{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 368, easing });
  }).catch(() => { clearTimeout(safety); tbDone(); });
}
