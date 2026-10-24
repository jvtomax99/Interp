/* Your knowledge brain, the Hub's side (knowledgeBrainData, your record
   and the daily count in ih_knowledgeLog, the small live brain atop Term
   Review: kbMiniHtml, kbMiniStart; the brain itself is brain/you.html):
   moved verbatim out of index.html on 2026-10-24 (docs/split-index.md,
   phase 3). Loaded by a plain <script src> just before index.html's own
   script. Nothing here runs as the page loads (only declarations); the
   names it uses from index.html (terms, escapeHtml, openHumcBrain...) are
   read when a function runs. Keep it that way: a top-level line here that
   calls into index.html would run before index.html has. */

/* ---------- Your knowledge brain: your own Term Review record, drawn as a brain ----------
   brain/you.html (openHumcBrain('you') in home-polish.js) asks for this
   by message. Only this person's own record goes in (TERM_REVIEWS, loaded by
   their name), never anyone else's. Terms Term Review can ask (English and
   Spanish both written). A term's level: 0 never practised, 1 missed last
   time, 2 learning (right once or twice in a row), 3 known (right 3+ times in
   a row); overdue ones are marked so the brain dims them. The record keeps
   only its latest state, so one count a day (ih_knowledgeLog, this phone
   only, per name) feeds the progress figure from 2026-10-21 on.
   docs/features/knowledge-brain.md. */
const KB_LOG_KEY = 'ih_knowledgeLog';
function kbLevel(r){
  if(!r || !r.reviewCount) return 0;
  if(reviewMissedRec(r)) return 1;
  return r.box >= 3 ? 3 : 2;
}
function kbToday(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
// Today's count, written whenever the record loads or an answer is saved. Returns your days.
function kbLogNote(){
  const me = whoAmI().trim().toLowerCase();
  if(!me || !termReviewsLoaded) return null;
  let practised = 0, known = 0, total = 0;
  DATA.categories.forEach(c => c.terms.forEach(t => {
    if(!t.en || !t.es) return;
    total++;
    const l = kbLevel(TERM_REVIEWS[t.id]);
    if(l) practised++;
    if(l === 3) known++;
  }));
  let log = null;
  try{ log = JSON.parse(localStorage.getItem(KB_LOG_KEY) || 'null'); }catch(e){}
  if(!log || typeof log !== 'object') log = {};
  const days = log[me] && typeof log[me] === 'object' ? log[me] : {};
  days[kbToday()] = [practised, known, total];
  const keys = Object.keys(days).sort();
  keys.slice(0, Math.max(0, keys.length - 400)).forEach(k => delete days[k]);
  log[me] = days;
  try{ localStorage.setItem(KB_LOG_KEY, JSON.stringify(log)); }catch(e){}
  return days;
}
async function knowledgeBrainData(){
  try{ await ensureLoaded('termReviews', loadTermReviews); }catch(e){}
  const now = Date.now(), cats = DATA.categories.slice().sort((a, b) => collateTerms(a.name, b.name));
  const at = new Map(cats.map((c, i) => [c.id, i]));
  const terms = [];
  let noSpanish = 0;
  cats.forEach((c, i) => c.terms.forEach(t => {
    if(!t.en || !t.es){ noSpanish++; return; }
    const r = TERM_REVIEWS[t.id], seen = !!(r && r.reviewCount);
    // [id, English, Spanish, domain, level, misses, last practised, overdue, right in a row]
    terms.push([t.id, t.en, t.es, i, kbLevel(r), seen ? (r.misses || 0) : 0, seen ? (r.lastAt || 0) : 0, seen && r.nextReviewAt <= now ? 1 : 0, seen ? (r.box || 0) : 0]);
  }));
  return { v: 1, me: whoAmI(), loaded: !!termReviewsLoaded, at: now, noSpanish,
    domains: cats.map(c => ({ id: c.id, name: c.name, color: c.color || '#7D89B0', parent: c.parentId && at.has(c.parentId) ? at.get(c.parentId) : -1 })),
    terms, days: kbLogNote() || {} };
}
// "Practise these" on a region: ten of its terms, missed and due first, as Term Review picks them.
function knowledgePractise(domainId){
  const c = DATA.categories.find(x => x.id === domainId);
  if(!c) return;
  requireName(async () => {
    await ensureLoaded('termReviews', loadTermReviews);
    setCategory('review');
    if(!c.parentId){ await startReview({ spec: c.id, n: 10 }); return; }
    const s = reviewBuild(c.parentId, 9999), terms = s.terms.filter(t => t.categoryId === c.id).slice(0, 10);
    if(!terms.length){ showToast('No terms with Spanish in ' + c.name + ' yet.'); return; }
    reviewBegin(terms, s.why, { label: c.name });
    renderContent();
  });
}
function knowledgeOpenTerm(termId){
  const c = DATA.categories.find(x => x.terms.some(t => t.id === termId));
  if(c) revealTerm(c.id, termId); else showToast('That term is no longer in the glossary.');
}
// Its one way in: the tile on the CoreCHI Practice dashboard (Dr. Smiley's head opens his own, separate brain);
// styled with the memory trainer's tile (app.css, .kb-entry beside .mem-entry).
function knowledgeEntryHtml(){
  if(!termReviewsLoaded && whoAmI()) ensureLoaded('termReviews', loadTermReviews);
  let total = 0, known = 0;
  DATA.categories.forEach(c => c.terms.forEach(t => { if(t.en && t.es){ total++; if(kbLevel(TERM_REVIEWS[t.id]) === 3) known++; } }));
  const lit = termReviewsLoaded && total ? Math.round(100 * known / total) : null;
  return `<div class="section-head"><h2>Your knowledge brain</h2><span class="sub">glossary terms you know</span></div>
    <div class="dash-tile kb-entry dash-in" style="--dom:#4F9DFF; --i:0">
      <span class="kb-entry-icon">${DOMAIN_ICONS.brain}</span>
      <span class="kb-entry-text"><b>Your terms as a brain</b><span>Every term is a dot that lights up as you learn it. Tap a dark area to practise it.</span></span>
      <span class="kb-entry-span"><b>${lit == null ? 'New' : lit + '%'}</b><small>${lit == null ? '' : 'known'}</small></span>
      <button type="button" class="mastery-go kb-go" onclick="window.openHumcBrain && openHumcBrain('you')">Open</button>
    </div>`;
}

/* The small live brain at the top of Term Review (Jose, 2026-10-21): your
   terms as dots on a turning brain, lit by the same levels as brain/you.html,
   drawn on a 2D canvas here so the screen loads no 3D. A preview, not the
   same layout: domains are bands of the cortex. Tapping it opens the full
   brain. Draws only while on screen and the page is visible; still under
   reduced motion. */
function kbMiniHtml(opts){
  opts = opts || {};
  let total = 0, known = 0;
  DATA.categories.forEach(c => c.terms.forEach(t => { if(t.en && t.es){ total++; if(kbLevel(TERM_REVIEWS[t.id]) === 3) known++; } }));
  const sess = opts.session && (opts.session.right.length || opts.session.missed.length) ? opts.session : null;
  KBM.next = sess;
  requestAnimationFrame(kbMiniStart);
  if(sess){
    // The session summary: what just lit up, and a way into the full brain turned to those terms.
    const r = sess.right.length, m = sess.missed.length, line = `${r} lit up${m ? ` · ${m} to practise` : ''}`;
    return `<button type="button" class="kb-mini is-session dash-in" style="--i:0" data-focus="${escapeAttr(JSON.stringify(sess))}" onclick="kbMiniOpen(this)" aria-label="This session in your brain: ${escapeAttr(line)}. See it in your brain">
      <canvas class="kb-mini-scan" id="kbMini" aria-hidden="true"></canvas>
      <span class="kb-mini-text"><b>This session in your brain</b><span>${escapeHtml(line)}</span><span class="kb-mini-cta">See it in your brain</span></span>
      <svg class="kb-mini-go" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>`;
  }
  const line = !termReviewsLoaded ? 'Loading your record…' : `${known} of ${total} known${total ? ' · ' + Math.round(100 * known / total) + '%' : ''}`;
  return `<button type="button" class="kb-mini dash-in" style="--i:0" onclick="window.openHumcBrain && openHumcBrain('you')" aria-label="Your knowledge brain: ${escapeAttr(line)}. Open it">
    <canvas class="kb-mini-scan" id="kbMini" aria-hidden="true"></canvas>
    <span class="kb-mini-text"><b>Your knowledge brain</b><span>${escapeHtml(line)}</span></span>
    <svg class="kb-mini-go" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`;
}
function kbMiniOpen(el){
  let focus = null;
  try{ focus = JSON.parse(el.dataset.focus || 'null'); }catch(e){}
  if(window.openHumcBrain) openHumcBrain('you', { focus });
}
// next/sess: a session's terms to light up ({ right, missed } ids); played: sessions already shown, so a redraw doesn't replay it.
const KBM = { el: null, raf: 0, pts: null, on: true, io: null, next: null, sess: null, t0: 0, played: new Set() };
function kbMiniStart(){
  const c = document.getElementById('kbMini');
  if(!c || c === KBM.el) return;
  cancelAnimationFrame(KBM.raf);
  KBM.el = c; KBM.pts = kbMiniPoints(); KBM.on = true;
  KBM.sess = null;
  if(KBM.next){
    const key = KBM.next.right.join() + '|' + KBM.next.missed.join(), map = {};
    KBM.next.right.forEach((id, k) => map[id] = { ok: true, at: 500 + k * 260 });
    KBM.next.missed.forEach((id, k) => map[id] = { ok: false, at: 700 + KBM.next.right.length * 260 + k * 320 });
    KBM.sess = { map, end: 1700 + KBM.next.right.length * 260 + KBM.next.missed.length * 320 };
    KBM.t0 = KBM.played.has(key) || reducedMotion() ? -1e9 : performance.now();
    KBM.played.add(key);
  }
  if(KBM.io) KBM.io.disconnect();
  KBM.io = new IntersectionObserver(es => { KBM.on = es[0].isIntersecting; if(KBM.on && !KBM.raf) KBM.raf = requestAnimationFrame(kbMiniFrame); });
  KBM.io.observe(c);
  KBM.raf = requestAnimationFrame(kbMiniFrame);
}
// The brain's shape (the cortex of brain/you.html) and the terms on it.
function kbMiniPoints(){
  const H = { cx:.31, rx:.80, ry:.92, rz:1.40, cy:.14 };
  const fib = n => { const o = [], g = Math.PI * (3 - Math.sqrt(5)); for(let i = 0; i < n; i++){ const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), t = g * i; o.push([Math.cos(t) * r, y, Math.sin(t) * r]); } return o; };
  const cortex = (d, side) => {
    let x = d[0] * H.rx, y = d[1] * H.ry, z = d[2] * H.rz;
    if(side * d[0] <= 0) x *= .26;
    if(d[1] < -.2) y = -.2 * H.ry + (y + .2 * H.ry) * .62;
    if(d[2] > .55) y *= 1 - (d[2] - .55) * .35;
    return [side * H.cx + x, H.cy + y, z];
  };
  const shell = [];
  [-1, 1].forEach(side => fib(700).forEach(d => { if(side * d[0] > -.9) shell.push(cortex(d, side)); }));
  const terms = [];
  const cats = DATA.categories.slice().sort((a, b) => collateTerms(a.name, b.name)), now = Date.now();
  const top = c => c.parentId || c.id;
  cats.slice().sort((a, b) => collateTerms(top(a), top(b))).forEach(c => c.terms.forEach(t => {
    if(!t.en || !t.es) return;
    const r = TERM_REVIEWS[t.id], lv = kbLevel(r);
    terms.push({ id: t.id, color: lv === 1 ? '#FF8A8A' : c.color || '#7D89B0', lv, over: !!(r && r.reviewCount && r.nextReviewAt <= now), box: r ? r.box || 0 : 0 });
  }));
  // Domains as bands: outer-cortex spots in order around each hemisphere.
  const spots = [];
  [-1, 1].forEach(side => fib(Math.max(400, Math.ceil(terms.length * 1.6))).forEach(d => { if(side * d[0] > .05 && d[1] > -.7) spots.push({ d, side, k: side * 10 + Math.atan2(d[1], d[2]) }); }));
  spots.sort((a, b) => a.k - b.k);
  const step = spots.length / Math.max(1, terms.length);
  terms.forEach((t, i) => { const s = spots[Math.floor(i * step)] || spots[0]; t.p = s ? cortex(s.d, s.side) : [0, 0, 0]; });
  return { shell, terms };
}
function kbMiniFrame(now){
  KBM.raf = 0;
  const c = KBM.el;
  if(!c || !c.isConnected){ if(KBM.io) KBM.io.disconnect(); KBM.el = null; return; }
  if(!KBM.on || document.hidden) return;
  const w = c.clientWidth, h = c.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if(c.width !== Math.round(w * dpr)){ c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
  const still = reducedMotion(), a = still ? -.95 : -.95 + now * .00025, ca = Math.cos(a), sa = Math.sin(a), tilt = .32, ct = Math.cos(tilt), st = Math.sin(tilt);
  const sc = Math.min(w / 2.8, h / 2.4), cx = w / 2 + 6, cy = h / 2 + sc * .1;
  const proj = p => { const X = p[0] * ca + p[2] * sa, Z0 = -p[0] * sa + p[2] * ca, Y = p[1] * ct - Z0 * st, Z = p[1] * st + Z0 * ct, f = 1 / (1 + Z * -.12); return [cx + X * sc * f, cy - Y * sc * f, Z]; };
  x.globalCompositeOperation = 'lighter';
  x.fillStyle = 'rgba(110,145,230,.22)';
  KBM.pts.shell.forEach(p => { const q = proj(p); x.fillRect(q[0], q[1], 1.1, 1.1); });
  const S = KBM.sess, el = now - KBM.t0;
  KBM.pts.terms.forEach(t => {
    const q = proj(t.p), m = S && S.map[t.id];
    let front = q[2] > -.2 ? 1 : .55;
    if(m){
      // This session's terms: dark until their turn, then the right ones glow on and the missed ones pulse red.
      const e = (el - m.at) / (m.ok ? 700 : 1000);
      if(e < 0){ x.fillStyle = 'rgba(143,163,214,.35)'; x.fillRect(q[0] - .9, q[1] - .9, 1.8, 1.8); return; }
      if(e < 1){
        const k = m.ok ? 1 - e : Math.abs(Math.sin(e * Math.PI * 2)), col = m.ok ? t.color : '#FF6B6B';
        x.globalAlpha = .35 + .5 * k; x.fillStyle = col; x.beginPath(); x.arc(q[0], q[1], 3 + 6 * k, 0, 7); x.fill();
        x.globalAlpha = 1; x.fillStyle = m.ok ? '#FFFFFF' : '#FFB3B3'; x.beginPath(); x.arc(q[0], q[1], 1.4 + .8 * k, 0, 7); x.fill();
        return;
      }
      front = 1;
    }
    if(t.lv === 0){ x.fillStyle = `rgba(143,163,214,${.28 * front})`; x.fillRect(q[0] - .8, q[1] - .8, 1.6, 1.6); return; }
    const b = (t.lv === 1 ? .55 : t.lv === 2 ? .7 : 1) * (t.over ? .6 : 1) * front;
    x.globalAlpha = b * .26; x.fillStyle = t.color; x.beginPath(); x.arc(q[0], q[1], t.lv === 3 ? 3.2 : 2.6, 0, 7); x.fill();
    x.globalAlpha = b; x.fillStyle = t.lv === 3 ? '#F2FBFF' : t.color; x.beginPath(); x.arc(q[0], q[1], t.lv === 3 ? 1.35 : 1.1, 0, 7); x.fill();
    x.globalAlpha = 1;
  });
  x.globalCompositeOperation = 'source-over';
  if(!still) KBM.raf = requestAnimationFrame(t => setTimeout(() => kbMiniFrame(performance.now()), 16));
}
