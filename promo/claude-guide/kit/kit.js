/* What every chapter shares: Dr. Smiley (built as the app builds him, drSmileyArt in
   features/smiley-engine.js), his mouth following the voice, sentence captions on the voice's
   own pauses (voice/ch<N>.beats.js), sticker pops, and the sound cues (window.SFX, mixed by
   tools/mix.cjs). Everything is a set or a tween on one paused GSAP timeline, so any frame can be
   seeked: that is how HyperFrames renders. */
(function () {
  const FRAMES = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh', 'laughB', 'lookL', 'lookR', 'love', 'sleep',
    'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR', 'surprised', 'sad', 'worried', 'doubt'];
  const FW = 151, FH = 111, B = window.BEATS, FPS = B.fps;
  const tl = gsap.timeline({ paused: true });
  const SFX = window.SFX = [];
  const $ = (s) => document.querySelector(s);

  function smiley(id, hat) {
    return `<div class="a smiley" id="${id}"><svg viewBox="4 4 112 112">
      <image href="assets/drsmiley/base.webp" x="14" y=".8" width="106" height="132.5" preserveAspectRatio="none"/>
      <svg x="31.667" y="47.617" width="66.692" height="49.025" viewBox="0 0 ${FW} ${FH}" preserveAspectRatio="none">
        <image id="${id}-face" href="assets/drsmiley/face.webp" x="0" y="0" width="${FW * FRAMES.length}" height="${FH}" preserveAspectRatio="none"/></svg>
      <image id="${id}-browl" href="assets/drsmiley/brow-l.webp" x="33.875" y="39.446" width="28.708" height="14.354" preserveAspectRatio="none"/>
      <image id="${id}-browr" href="assets/drsmiley/brow-r.webp" x="73.625" y="42.758" width="27.604" height="19.875" preserveAspectRatio="none"/>
      ${hat ? `<image id="${id}-hat" href="assets/drsmiley/hat-${hat}.webp" x="6" y="-50" width="124" height="163" preserveAspectRatio="none" opacity="0"/>` : ''}
    </svg></div>`;
  }
  const face = (id, f, at) => tl.set(`#${id}-face`, { attr: { x: -FRAMES.indexOf(f) * FW } }, at);

  /* His mouth from the voice's loudness, frame by frame, between `from` and `to`. `acts` are
     expressions that hold the face instead: [{ at, to, f }] (f a frame name). He blinks every
     3-4.5 s when not acting. A change needs 2 frames' hold, so the mouth never flickers. */
  function mouth(id, from, to, acts = []) {
    const BL = [['blink1', 2], ['blink2', 1], ['shut', 2], ['blink2', 1], ['blink1', 2]];
    let shown = null, held = 0, seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const blinks = []; for (let b = from + 1.4; b < to; b += 3 + rnd() * 1.5) blinks.push(Math.round(b * FPS));
    for (let k = Math.round(from * FPS); k < Math.round(to * FPS); k++) {
      const t = k / FPS, act = acts.find((a) => t >= a.at && t < a.to), b = blinks.find((b) => k >= b && k < b + 8);
      let want;
      if (act) want = act.f;
      else if (b !== undefined) {
        let c = k - b; want = BL.find(([, n]) => (c -= n) < 0)[0];
      } else {
        const e = B.env[k] || 0;
        want = e < 0.07 ? 'rest' : e < 0.3 ? 'smile1' : e < 0.62 ? 'smile2' : 'smile';
      }
      held++;
      if (want !== shown && (held >= 2 || act || b !== undefined || !shown)) { face(id, want, t); shown = want; held = 0; }
    }
    face(id, 'rest', to);
  }

  /* timing helpers: line n's start, sentence j's start, a word's moment (by letters inside its sentence) */
  const L = (n) => B.lines.find((l) => l.n === n);
  const S = (n, j = 0) => L(n).sentences[j].start;
  function W(n, word, nth = 0) {
    for (const s of L(n).sentences) {
      let i = -1; for (let c = 0; c <= nth; c++) { i = s.text.indexOf(word, i + 1); if (i < 0) break; }
      if (i >= 0) return s.start + (s.end - s.start) * (i / s.text.length);
    }
    throw new Error('no word ' + word + ' in line ' + n);
  }

  /* captions: each sentence (short ones joined to the next, long ones cut at a comma or colon
     into pieces of at most 9 words), on the voice's own timing; HL words get the highlighter */
  function captions(HL = [], skip = []) {
    const pieces = [];
    for (const l of B.lines) {
      if (skip.includes(l.n)) continue;
      let carry = null;
      l.sentences.forEach((s, j) => {
        let start = carry ? carry.start : s.start, text = carry ? carry.text + ' ' + s.text : s.text;
        if (s.end - start < 0.9 && j < l.sentences.length - 1) { carry = { start, text }; return; }
        carry = null;
        const words = text.split(' ');
        if (words.length <= 10) { pieces.push({ text, start, end: s.end }); return; }
        const parts = []; let cur = [];
        words.forEach((w, i) => { cur.push(w); const left = words.length - i - 1;
          if ((/[,:]$/.test(w) && cur.length >= 4 && left >= 3) || cur.length >= 9 && left >= 3) { parts.push(cur.join(' ')); cur = []; } });
        if (cur.length) parts.push(cur.join(' '));
        let t = start; const total = text.length;
        parts.forEach((p) => { const d = (s.end - start) * (p.length + 1) / total; pieces.push({ text: p, start: t, end: t + d }); t += d; });
      });
    }
    const root = $('#caps');
    pieces.forEach((p, i) => {
      let h = p.text; HL.forEach((w) => { h = h.replace(new RegExp(`\\b(${w})\\b`), '<em>$1</em>'); });
      const el = document.createElement('div'); el.className = 'a cap'; el.innerHTML = h; el.style.opacity = 0; root.appendChild(el);
      const next = pieces[i + 1], gone = next && next.start - p.end < 1.2 ? next.start - 0.05 : p.end + 0.5; // gone as the next one comes in
      tl.fromTo(el, { opacity: 0, scale: 0.92, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: 'back.out(2)' }, p.start - 0.05);
      tl.set(el, { opacity: 0 }, gone);
    });
    return pieces;
  }

  function sfx(name, at, vol = 0.4) { SFX.push({ name, at: +at.toFixed(3), vol }); }
  function pop(sel, at, o = {}) {
    tl.fromTo(sel, { opacity: 0, scale: 0, rotation: o.r ?? -10 }, { opacity: 1, scale: 1, rotation: o.to ?? 0, duration: o.d || 0.55, ease: o.ease || 'back.out(2.2)', stagger: o.stagger || 0 }, at);
    if (o.sound !== false) {
      const n = o.stagger ? document.querySelectorAll(sel).length : 1;
      for (let i = 0; i < n; i++) sfx(o.sound || 'pop', at + (o.stagger || 0) * i, o.vol ?? 0.35);
    }
  }
  const out = (sel, at, d = 0.32) => tl.to(sel, { opacity: 0, scale: 0.5, duration: d, ease: 'back.in(1.7)' }, at);
  // a gentle bob for `dur` seconds (a finite repeat, so it seeks)
  function bob(sel, at, dur, o = {}) {
    const p = o.period || 1.6, n = Math.max(1, Math.floor(dur / p) * 2 - 1);
    tl.to(sel, { y: o.y ?? -12, rotation: o.r ?? 0, duration: p / 2, ease: 'sine.inOut', yoyo: true, repeat: n }, at);
  }
  // a quick stamp: drops from big and lands with a snap
  function stamp(sel, at, rot = -12) {
    tl.fromTo(sel, { opacity: 0, scale: 2.4, rotation: rot - 10 }, { opacity: 1, scale: 1, rotation: rot, duration: 0.28, ease: 'power3.in' }, at);
    tl.fromTo(sel, { x: 0 }, { x: 6, duration: 0.05, yoyo: true, repeat: 3 }, at + 0.28);
    sfx('snap', at + 0.26, 0.55);
  }
  function done() {
    tl.set({}, {}, B.duration);
    window.__timelines = window.__timelines || {};
    window.__timelines.main = tl;
  }
  // the junior developer (chapter 1's robot), at his desk; ids prefixed so two can share a page
  const robot = (p = 'r', size = 480) => `<svg viewBox="0 0 420 420" width="${size}" height="${size}">
    <ellipse cx="210" cy="400" rx="170" ry="16" fill="#E9D6BE"/>
    <line x1="210" y1="40" x2="210" y2="80" stroke="#2B2A4C" stroke-width="8" stroke-linecap="round"/><circle cx="210" cy="32" r="16" fill="#FF6B8B"/>
    <rect x="110" y="78" width="200" height="150" rx="56" fill="#8FD3FF" stroke="#2B2A4C" stroke-width="8"/>
    <rect x="140" y="112" width="140" height="78" rx="36" fill="#2B2A4C"/>
    <ellipse cx="182" cy="150" rx="13" ry="17" fill="#7CF5FF"/><ellipse cx="238" cy="150" rx="13" ry="17" fill="#7CF5FF"/>
    <path d="M190 176 q20 12 40 0" stroke="#7CF5FF" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="132" cy="190" r="11" fill="#FFB3C7"/><circle cx="288" cy="190" r="11" fill="#FFB3C7"/>
    <rect x="140" y="232" width="140" height="70" rx="26" fill="#8FD3FF" stroke="#2B2A4C" stroke-width="8"/>
    <path d="M60 310 h300 l-24 90 h-252z" fill="#FFC94D" stroke="#2B2A4C" stroke-width="8" stroke-linejoin="round"/>
    <rect x="120" y="262" width="180" height="58" rx="10" fill="#2B2A4C" transform="skewX(-12) translate(56 0)"/>
    <path id="${p}-armL" d="M130 270 q-30 -8 -20 -40" stroke="#2B2A4C" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path id="${p}-armR" d="M290 270 q30 -8 20 -40" stroke="#2B2A4C" stroke-width="16" fill="none" stroke-linecap="round"/></svg>`;
  const HLS = 'font-style:normal;background:linear-gradient(transparent 52%,#FFB3C7 52%,#FFB3C7 92%,transparent 92%)';
  window.KIT = { tl, smiley, robot, HLS, face, mouth, L, S, W, captions, sfx, pop, out, bob, stamp, done, $, B };
})();
