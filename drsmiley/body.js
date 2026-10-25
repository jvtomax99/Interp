/* ---------- Dr. Smiley, full body (cutout rig) ----------
   His whole body as layers cut from Jose's standing picture
   (docs/art/dr-smiley-body/, 2026-10-23): the app's own head (drsmiley/body/head.webp,
   base.webp above the chin on the same 480 x 600 grid, so the face strip, the brows
   and the rank hats fit it unchanged), the torso and legs with no arms, each arm as
   an upper arm and a forearm, and each leg, all in the picture's own pixels
   (1070 x 1470; the pivots in drsmiley/body/rig.json, copied into DR_BODY below).

   He moves the way his face does: a performance is a list of beats, each a pose
   reached after so many ms with an easing, built fresh each play (a little
   different every time, like DR_PERF), Lively full size, Focused smaller and
   calmer, Still one held pose. Only transforms move (rotate about a pivot,
   translate, scale), nothing lays out. Breathing at rest is a CSS animation on
   the compositor; the engine's frame loop runs only while a performance plays.
   Reduced motion means Still. Nothing in the app shows him full-length yet
   (Jose, 2026-10-23: animate him fully first, decide where later); the viewer
   is drsmiley/body.html. Rules: docs/features/dr-smiley.md, "Full body". */
'use strict';

const DR_BODY = {
  w: 1070, h: 1470, feetY: 1427,
  head: { at: [307, 74.2], scale: 1.0881, grid: [480, 600] },
  neck: [547, 585],
  shoulder: { l: [353, 630], r: [759, 630] },
  elbow: { l: [340, 792], r: [743, 792] },
  hip: { l: [458, 1040], r: [627, 1040] },
  // Each layer's place in the picture: [x, y, width, height].
  box: {
    body: [353, 578, 411, 488],
    'arm-upper-l': [284, 602, 132, 247], 'arm-fore-l': [233, 736, 164, 327],
    'arm-upper-r': [685, 611, 113, 235], 'arm-fore-r': [690, 739, 151, 326],
    'leg-l': [288, 990, 247, 426], 'leg-r': [554, 990, 240, 426],
  },
  // How far each joint may go, in degrees (a cutout arm past these shows its cut).
  limit: { arm: [-20, 175], fore: [-10, 135], leg: [-35, 35], head: [-9, 9] },
  // The drawn poses (docs/art/dr-smiley-body/prompts.md, cut by cutframes.py
  // into drsmiley/body/pose-*.webp): his arms as Jose's pictures drew them, a
  // real open hand, fist, finger, palms and clipboard. Since 2026-10-24 (a
  // frame-by-frame review: the flat cutout arm swung to big angles read as
  // paper "airplane" arms) a drawn pose carries the motion itself: the cutout
  // arms stay small, the frame appears and moves into place. Three joints
  // move a shown frame: `fsw` swings it about its shoulder (`anchor`; a
  // single arm: from hanging, negative, up to its drawn place, 0), `fy`
  // lifts it (a folded arm or the clipboard rising into his hands), `fsx`
  // opens it outward about his middle (the shrug). `arms` are the cutout
  // arms it stands in for; `layer` back is behind the coat (the arm comes
  // out from under the shoulder), front is over it (the folded arm, the
  // finger on the chin); `pivot` is where it turns for a wag (`frot`). Every
  // one also exists mirrored about his middle (`mirrorX`), for the other side.
  mirrorX: 556,
  pose: {
    wave:        { box: [134, 360, 340, 394], arms: ['L'], layer: 'back', anchor: [353, 630], pivot: [190, 600] },
    // The wave's breakdowns (prompts-animation.md, 2026-10-24): on the way up the
    // elbow leads and the hand trails below it; at the top the hand tips in
    // toward his head and out away from it, the wag's two extremes, with `wave`
    // as the drawing between them.
    'wave-rise': { box: [127, 528, 347, 286], arms: ['L'], layer: 'back', anchor: [353, 630], pivot: [353, 630] },
    'wave-in':   { box: [142, 273, 332, 443], arms: ['L'], layer: 'back', anchor: [353, 630], pivot: [190, 600] },
    'wave-out':  { box: [46, 280, 428, 444], arms: ['L'], layer: 'back', anchor: [353, 630], pivot: [190, 600] },
    'fist-pump': { box: [121, 364, 330, 381], arms: ['L'], layer: 'back', anchor: [353, 630], pivot: [353, 630] },
    think:       { box: [352, 497, 275, 446], arms: ['L', 'R'], layer: 'front', pivot: [353, 630] },
    shrug:       { box: [97, 585, 889, 247], arms: ['L', 'R'], layer: 'back', pivot: [556, 630] },
    // The cheer's drawings (prompts-animation.md, 2026-10-24): both arms, behind the coat.
    // The load (fists pulled low by his hips, about to throw them up), the rise (fists
    // at shoulder height, elbows out) and the V (both fists above his head).
    'cheer-load': { box: [243, 587, 590, 352], arms: ['L', 'R'], layer: 'back', pivot: [556, 630] },
    'cheer-mid':  { box: [195, 481, 711, 275], arms: ['L', 'R'], layer: 'back', pivot: [556, 630] },
    'cheer-up':   { box: [73, 190, 937, 521], arms: ['L', 'R'], layer: 'back', pivot: [556, 630] },
    // Cut as a feathered band of the picture (its sleeve lies over the coat), so it is drawn in front.
    'thumbs-up': { box: [247, 512, 189, 354], arms: ['L'], layer: 'front', pivot: [353, 630] },
    // Both hands on a clipboard at his chest (a feathered band from the collar to below the hands, both sleeves in it): stands in for both arms; `frot` tilts it.
    clipboard:   { box: [281, 567, 511, 354], arms: ['L', 'R'], layer: 'front', pivot: [556, 760] },
    // The pointing arm: straight out at shoulder height, the index finger out ("look here"); since the
    // point's drawings it is the in-between on the way down. `frot` bobs it about the shoulder.
    point:       { box: [24, 559, 427, 153], arms: ['L'], layer: 'back', anchor: [353, 630], pivot: [353, 630] },
    // The point's drawings (prompts-animation.md, 2026-10-25): the load, the arm bent and pulled
    // back with the hand by his shoulder, finger already out; the reach, the arm stretched out
    // a little above the shoulder (20 degrees higher than `point`), the strong moment.
    'point-load':  { box: [98, 420, 376, 294], arms: ['L'], layer: 'back', anchor: [353, 630], pivot: [353, 630] },
    'point-reach': { box: [10, 418, 464, 255], arms: ['L'], layer: 'back', anchor: [353, 630], pivot: [353, 630] },
    // The leg plates: both legs whole, in place of the two cutout legs (no mirror; `frameLegs` names one).
    crouch:      { box: [292, 990, 506, 425], legs: true, layer: 'legs', pivot: [556, 1040] },
    jump:        { box: [315, 990, 463, 328], legs: true, layer: 'legs', pivot: [556, 1040] },
  },
};
// Drawn poses swap at once, the way a drawn animation swaps drawings and his
// face swaps frames (2026-10-24, the wave review): the 70 ms fade they had
// showed a half-transparent hand in the air for four frames on the way in and
// out, and between two drawings (the wave's in and out) two hands at half.
// The piece a frame stands in for is cut in the same paint, so nothing is
// ever see-through. Kept as a number for the checks (tests/suites/body-rig.cjs).
const DR_BODY_FADE = 0;
/* The face frames, in the order of drsmiley/face.webp (the same list as
   DR_FACE_FRAMES in index.html; kept here so the rig can stand alone). */
const DR_BODY_FACES = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh', 'laughB', 'lookL', 'lookR', 'love', 'sleep',
  'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR', 'surprised', 'sad', 'worried', 'doubt'];
const DR_BODY_FACE_W = 151, DR_BODY_FACE_H = 111;
/* Brow poses: [lift (px of the base grid, up is negative), turn (deg)] for
   [left brow, right brow] (his left is the viewer's right), from DR_BROWS'
   idea: a lift and a turn about each brow's middle, never a stretch. */
const DR_BODY_BROWS = {
  rest: [[0, 0], [0, 0]], up: [[-7, 0], [-8, 0]], down: [[3, 0], [3, 0]],
  caring: [[-2, 6], [-2, -6]], focused: [[2, -5], [2, 5]], one: [[0, 0], [-8, 0]], doubt: [[2, 4], [-4, 0]],
};

/* The rig's markup. `root` is the folder the art is in (relative to the page). */
function drBodyArt(cls, root){
  root = root == null ? './drsmiley/' : root;
  const B = DR_BODY, img = (k, c) => { const [x, y, w, h] = B.box[k]; return `<image class="${c}" href="${root}body/${k}.webp" x="${x}" y="${y}" width="${w}" height="${h}"/>`; };
  const [hx, hy] = B.head.at, s = B.head.scale, [gw, gh] = B.head.grid;
  const head = `<g class="db-head"><g transform="translate(${hx},${hy}) scale(${s})">`
    + `<image class="db-skull" href="${root}body/head.webp" x="0" y="0" width="${gw}" height="${gh}"/>`
    + `<svg class="ds-face" x="80" y="212" width="302" height="222" viewBox="0 0 ${DR_BODY_FACE_W} ${DR_BODY_FACE_H}" preserveAspectRatio="none">`
    + `<image class="ds-sheet" href="${root}face.webp" x="0" y="0" width="${DR_BODY_FACE_W * DR_BODY_FACES.length}" height="${DR_BODY_FACE_H}" preserveAspectRatio="none"/></svg>`
    + `<image class="ds-brow ds-brow-l" href="${root}brow-l.webp" x="90" y="175" width="130" height="65"/>`
    + `<image class="ds-brow ds-brow-r" href="${root}brow-r.webp" x="270" y="190" width="125" height="90"/>`
    + '</g></g>';
  // The drawn poses, each as drawn (-l) and mirrored (-r), hidden until a gesture swaps one in.
  const poses = layer => Object.keys(B.pose).filter(k => B.pose[k].layer === layer).map(k => {
    const [x, y, w, h] = B.pose[k].box, im = `<image href="${root}body/pose-${k}.webp" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
    return `<g class="db-pose db-pose-${k}-l" data-pose="${k}" data-side="l" style="opacity:0">${im}</g>`
         + (B.pose[k].legs ? '' : `<g class="db-pose db-pose-${k}-r" data-pose="${k}" data-side="r" style="opacity:0">${im}</g>`);
  }).join('');
  return `<svg class="db${cls ? ' ' + cls : ''}" viewBox="0 0 ${B.w} ${B.h}" aria-hidden="true" focusable="false" style="overflow:visible">`
    + '<g class="db-root">'
    +   `<g class="db-leg db-leg-l">${img('leg-l', 'db-leg-art')}</g><g class="db-leg db-leg-r">${img('leg-r', 'db-leg-art')}</g>`
    +   `<g class="db-poses-legs">${poses('legs')}</g>`
    +   '<g class="db-breath">'
    +     `<g class="db-arm db-arm-l">${img('arm-upper-l', 'db-upper')}<g class="db-fore db-fore-l">${img('arm-fore-l', 'db-fore-art')}</g></g>`
    +     `<g class="db-arm db-arm-r">${img('arm-upper-r', 'db-upper')}<g class="db-fore db-fore-r">${img('arm-fore-r', 'db-fore-art')}</g></g>`
    +     `<g class="db-poses-back">${poses('back')}</g>`
    +     head
    +     img('body', 'db-body')
    +     `<g class="db-poses-front">${poses('front')}</g>`
    +   '</g>'
    + '</g></svg>';
}

/* A pose: every joint at a number. Degrees for turns (an arm's "raise" is
   out and up on either side, a leg's "swing" out), picture pixels for moves,
   1 for a plain scale. `face` and `brow` are names; so are `frameL` and
   `frameR`, the drawn pose shown as drawn (L, on the picture's left, his
   right) or mirrored (R); names swap at a beat's start, like a face. `frot`
   turns a shown frame about its pivot (a wag). `frameLegs` names a leg
   plate (crouch, jump) shown in place of both cutout legs. */
const DR_BODY_REST = { x: 0, y: 0, lean: 0, sx: 1, sy: 1, head: 0, lift: 0, aL: 0, aR: 0, fL: 0, fR: 0, lL: 0, lR: 0, upL: 0, upR: 0, chest: 1, face: 'rest', brow: 'rest', frameL: '', frameR: '', frot: 0, frameLegs: '', fsw: 0, fy: 0, fsx: 1 };
const DR_BODY_EASE = {
  linear: t => t,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // A settle past the mark and back (Disney's follow-through), about 8% over.
  spring: t => 1 - Math.exp(-6.2 * t) * (Math.cos(7.5 * t) + (6.2 / 7.5) * Math.sin(7.5 * t)),
  // A snap: fast out of the gate (an anticipation's release).
  snap: t => 1 - Math.pow(1 - t, 5),
};

let drBodyRand = Math.random;
function drBodySeed(n){
  if(n == null){ drBodyRand = Math.random; return; }
  let a = n >>> 0;
  drBodyRand = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* The engine: one per rig. drBody(svg, { mode, reduced }) */
function drBody(svg, opts){
  opts = opts || {};
  const q = s => svg.querySelector(s);
  const el = { root: q('.db-root'), breath: q('.db-breath'), head: q('.db-head'), armL: q('.db-arm-l'), armR: q('.db-arm-r'), foreL: q('.db-fore-l'), foreR: q('.db-fore-r'),
               legL: q('.db-leg-l'), legR: q('.db-leg-r'), sheet: q('.ds-sheet'), browL: q('.ds-brow-l'), browR: q('.ds-brow-r'), poses: [...svg.querySelectorAll('.db-pose')] };
  const B = DR_BODY, mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduced = () => opts.reduced != null ? !!opts.reduced : !!(mq && mq.matches);
  const mode = () => reduced() ? 'still' : (opts.mode || 'lively');
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pose = Object.assign({}, DR_BODY_REST);
  let run = null, raf = 0, last = 'rest', cur = null, hctx = null;   // cur: the held state he is in (DR_BODY_STATES)

  function draw(p){
    const L = B.limit, r = (deg, at) => `rotate(${deg.toFixed(3)} ${at[0]} ${at[1]})`;
    const fx = B.w / 2, fy = B.feetY;
    el.root.setAttribute('transform', `translate(${p.x.toFixed(2)},${p.y.toFixed(2)}) translate(${fx},${fy}) rotate(${p.lean.toFixed(3)}) scale(${p.sx.toFixed(4)},${p.sy.toFixed(4)}) translate(${-fx},${-fy})`);
    el.head.setAttribute('transform', `translate(0,${p.lift.toFixed(2)}) ${r(clamp(p.head, L.head[0], L.head[1]), B.neck)}`);
    el.armL.setAttribute('transform', r(clamp(p.aL, L.arm[0], L.arm[1]), B.shoulder.l));
    el.armR.setAttribute('transform', r(-clamp(p.aR, L.arm[0], L.arm[1]), B.shoulder.r));
    el.foreL.setAttribute('transform', r(clamp(p.fL, L.fore[0], L.fore[1]), B.elbow.l));
    el.foreR.setAttribute('transform', r(-clamp(p.fR, L.fore[0], L.fore[1]), B.elbow.r));
    el.legL.setAttribute('transform', `translate(0,${(-p.upL).toFixed(2)}) ${r(clamp(p.lL, L.leg[0], L.leg[1]), B.hip.l)}`);
    el.legR.setAttribute('transform', `translate(0,${(-p.upR).toFixed(2)}) ${r(-clamp(p.lR, L.leg[0], L.leg[1]), B.hip.r)}`);
    if(p.face !== last){ setFace(p.face); last = p.face; }
    setBrow(p.brow);
    setFrames(p);
  }
  /* The drawn poses: show the one named on each side (the mirrored copy for
     R), placed by fsw/fy/fsx and turned by `frot` about its pivot, and hide
     the cutout arms or legs it stands in for. The swap never shows through
     him: a frame and the piece it replaces trade places in the same paint
     (DR_BODY_FADE is 0: drawings swap, they never fade), and a frame
     swapped for another on the same side does the same. */
  let shown = '', coverT = 0;
  const onAt = new Map();
  const FADE = () => mode() === 'still' ? 0 : DR_BODY_FADE;
  function cover(){
    clearTimeout(coverT); coverT = 0;
    const now = performance.now(), hide = { L: false, R: false }; let legs = false, wait = 0;
    for(const g of el.poses){
      if(!onAt.has(g) || B.pose[g.dataset.pose].legs) continue;
      const left = onAt.get(g) + FADE() - now;
      if(left > 0){ wait = Math.max(wait, left); continue; }
      const P = B.pose[g.dataset.pose];
      for(const a of P.arms) hide[g.dataset.side === 'l' ? a : (a === 'L' ? 'R' : 'L')] = true;
    }
    for(const g of onAt.keys()) if(B.pose[g.dataset.pose].legs) legs = true;   // the plates: at once
    el.armL.style.opacity = hide.L ? '0' : '1';
    el.armR.style.opacity = hide.R ? '0' : '1';
    el.legL.style.opacity = legs ? '0' : '1';
    el.legR.style.opacity = legs ? '0' : '1';
    if(wait) coverT = setTimeout(cover, wait + 4);
  }
  function setFrames(p){
    const moving = p.frameL || p.frameR ? [p.frot, p.fsw, p.fy, p.fsx].map(v => v.toFixed(2)).join(',') : '';
    const key = p.frameL + '|' + p.frameR + '|' + p.frameLegs + '|' + moving;
    if(key === shown) return;
    shown = key;
    const now = performance.now();
    for(const g of el.poses){
      const name = g.dataset.pose, side = g.dataset.side, P = B.pose[name];
      const want = P.legs ? p.frameLegs === name : (side === 'l' ? p.frameL === name : p.frameR === name);
      if(want && !onAt.has(g)){ onAt.set(g, now); g.style.opacity = '1'; }
      else if(!want && onAt.has(g)){ onAt.delete(g); g.style.opacity = '0'; }
      if(!want || P.legs) continue;
      const [px, py] = P.pivot, an = P.anchor, m = B.mirrorX;
      let t = side === 'r' ? `translate(${2 * m},0) scale(-1,1) ` : '';
      if(p.fy) t += `translate(0,${p.fy.toFixed(2)}) `;
      if(an && p.fsw) t += `rotate(${p.fsw.toFixed(3)} ${an[0]} ${an[1]}) `;
      if(p.fsx !== 1) t += `translate(${m},${py}) scale(${p.fsx.toFixed(4)},1) translate(${-m},${-py}) `;
      g.setAttribute('transform', t + `rotate(${p.frot.toFixed(3)} ${px} ${py})`);
    }
    cover();
  }
  function setFace(name){
    const i = Math.max(0, DR_BODY_FACES.indexOf(name));
    el.sheet.setAttribute('x', String(-i * DR_BODY_FACE_W));
  }
  function setBrow(name){
    const b = DR_BODY_BROWS[name] || DR_BODY_BROWS.rest, k = mode() === 'focused' ? .6 : 1;
    const at = (img, [lift, turn]) => {
      const x = +img.getAttribute('x') + img.getAttribute('width') / 2, y = +img.getAttribute('y') + img.getAttribute('height') / 2;
      img.setAttribute('transform', `translate(0,${(lift * k).toFixed(2)}) rotate(${(turn * k).toFixed(2)} ${x} ${y})`);
    };
    at(el.browR, b[0]); at(el.browL, b[1]);   // b[0] is his left brow: the viewer's right
  }
  function set(patch){ Object.assign(pose, patch); draw(pose); }

  /* beats: [[ms, patch, ease], ...]; each beat eases from the pose reached by
     the one before (the live pose for the first, so an interruption blends).
     o.keep: a piece of a held state (its entry, one group of its hold): it
     starts from the live pose as it is, drawn frames included, and ends where
     its last beat left him, not at rest. Without it the play is a gesture:
     it ends at rest, and if a held state is on, the hold carries on. */
  function play(beats, o){
    o = o || {};
    stop();
    const keep = !!o.keep;
    if(mode() === 'still'){
      if(o.still){ set(Object.assign({}, DR_BODY_REST, o.still)); run = { still: true, timer: setTimeout(() => { run = null; stillRest(); if(o.done) o.done(); }, o.stillMs || 900) }; }
      else if(o.done) o.done();
      return true;
    }
    // From the live joints, so an interruption blends, never snaps; but a
    // drawn pose the interrupted gesture was showing hands back now (the
    // cutout arm or legs stand where it was), or it would stay up through
    // the whole new gesture: two waving hands, seen 2026-10-23.
    const start = keep ? Object.assign({}, pose) : Object.assign({}, pose, { frameL: '', frameR: '', frameLegs: '', frot: 0, fsw: 0, fy: 0, fsx: 1 });
    Object.assign(pose, start);
    const keys = []; let t = 0, from = start;
    for(const [ms, patch, ease] of beats){
      const to = Object.assign({}, from, patch || {});
      keys.push({ t0: t, t1: t + ms, from, to, ease: DR_BODY_EASE[ease || 'out'] || DR_BODY_EASE.out });
      t += ms; from = to;
    }
    const T = t, t0 = performance.now();
    svg.classList.add('db-acting');
    run = { T, done: o.done, name: o.name };
    const tick = now => {
      if(!run || run.t0 !== t0) return;
      const u = now - t0;
      let k = keys[0]; for(const x of keys){ if(u >= x.t0) k = x; }
      const f = k.t1 > k.t0 ? k.ease(clamp((u - k.t0) / (k.t1 - k.t0), 0, 1)) : 1;
      const p = {};
      for(const j in DR_BODY_REST){
        const a = k.from[j], b = k.to[j];
        p[j] = typeof a === 'number' ? a + (b - a) * f : (f >= (typeof b === 'string' && b !== a ? 0 : 1) ? b : a);
      }
      Object.assign(pose, p); draw(pose);
      if(u < T) raf = requestAnimationFrame(tick);
      else { const d = run.done; run = null; raf = 0; svg.classList.remove('db-acting'); if(!keep) set(DR_BODY_REST); if(d) d(); if(!keep && !o.exit && cur) holdLoop(); }
    };
    run.t0 = t0; raf = requestAnimationFrame(tick);
    return true;
  }
  function stop(){
    if(run && run.timer) clearTimeout(run.timer);
    if(raf) cancelAnimationFrame(raf);
    raf = 0; run = null; svg.classList.remove('db-acting');
  }
  function perform(name, o){
    const make = DR_BODY_PERF[name];
    if(!make) return false;
    const p = make(mode());
    return play(p.beats, Object.assign({ name, still: p.still, stillMs: p.stillMs }, o || {}));
  }
  /* Held states (DR_BODY_STATES): what he does while something goes on, for
     as long as it goes on, the way his head holds a task state in the app
     (drTask): listening, thinking, answering, celebrating, uncertain. An
     entry, then the hold, built one group of beats at a time (a little
     different each) until state(null) plays the exit, or another state
     replaces it. A gesture (perform) cuts in and the hold carries on after.
     Still: the one pose in `still`, held; a gesture's one frame, then back. */
  function ctxFor(name){
    const m = mode(), R = drBodyRand, side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1;
    return { name, mode: m, k: m === 'focused' ? .6 : 1, beat: -1, since: performance.now(), R, side, s, A: 'a' + side, F: 'f' + side, O: side === 'L' ? 'R' : 'L', FR: 'frame' + side,
             j: (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))) };
  }
  function stillRest(){ if(cur && hctx) set(Object.assign({}, DR_BODY_REST, DR_BODY_STATES[cur].still(hctx))); else set(DR_BODY_REST); }
  function state(name, o){
    o = o || {};
    if(name && !DR_BODY_STATES[name]) return false;
    name = name || null;
    if(name === cur && !o.restart) return true;
    const prev = cur, pctx = hctx; stop(); cur = name;
    if(!cur){
      hctx = null;
      if(prev && pctx && mode() !== 'still'){ const S = DR_BODY_STATES[prev]; play((S.exit || DR_BODY_HOLD_EXIT)(pctx), { name: 'exit:' + prev, exit: true }); }
      else set(DR_BODY_REST);
      return true;
    }
    hctx = ctxFor(cur);
    if(mode() === 'still'){ stillRest(); return true; }
    play(DR_BODY_STATES[cur].enter(hctx), { keep: true, name: 'enter:' + cur, done: holdLoop });
    return true;
  }
  function holdLoop(){
    if(!cur || mode() === 'still') return;
    if(!hctx) hctx = ctxFor(cur);
    hctx.beat++;
    play(DR_BODY_STATES[cur].hold(hctx), { keep: true, name: 'hold:' + cur, done: holdLoop });
  }
  draw(pose);
  return { el, pose, set, play, perform, stop, setFace, setBrow, setFrames, mode, state, stateName: () => cur, busy: () => !!run, rest: () => set(DR_BODY_REST) };
}

/* The performances. Each is built fresh, with the side, the sizes and the
   timing a little different every time (drBodyRand), after the same shape
   as his face's acting: anticipation, the gesture, follow-through, recovery.
   mode 'focused' plays the same beats smaller and calmer; 'still' is the
   one pose in `still`. Angles: an arm's raise is 0 hanging, 90 straight
   out, 170 straight up; a forearm's bend opens the elbow outward. */
const DR_BODY_PERF = {
  // Hello, drawn the way a hand animator would (2026-10-24, the wave
  // drawings): a dip and the arm drawing back (anticipation); the cutout arm
  // flicks up a few frames into the drawn rise, elbow leading and the hand
  // trailing (drag); the hand flung up and out at the top (the overshoot
  // drawn), settling; then the wag as drawings, out, between, in, between,
  // on twos, with a little sway between them; and down through the rise
  // drawing, the hand dropping first, into the cutout arm. Drawings swap,
  // they never fade (DR_BODY_FADE).
  greet(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .55 : 1;
    const side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1, A = 'a' + side, F = 'f' + side, FR = 'frame' + side;
    const wags = mode === 'focused' ? 2 : 3;
    const beats = [
      [j(160, .2), { sy: 1 - .025 * k, sx: 1 + .012 * k, face: 'blink1', head: -s * 1.5 * k, [A]: -6, [F]: 12, fsw: -12 }, 'in'],   // a dip: he's seen you
      [j(50), { [A]: 20, [F]: 8 }, 'in'],                                                                                         // the arm flicks up
      [0, { [FR]: 'wave-rise', [A]: 0, [F]: 0 }],                                                                                 // the drawn rise: elbow leads
      [j(70), { fsw: 0, sy: 1 + .012 * k, sx: 1 - .006 * k, y: -8 * k, face: 'smile1' }, 'out'],
      [0, { [FR]: 'wave-out', fsw: -7, frot: -1.5 }],                                                                             // the top: the hand flung out
      [j(260), { fsw: 0, frot: 0, sy: 1 + .02 * k, sx: 1 - .01 * k, y: -14 * k, face: 'smile', brow: 'up', head: s * 4 * k, lean: s * 1.2 * k }, 'spring'],
      [j(120), { sy: 1, sx: 1, y: 0, brow: 'rest' }, 'out'],
    ];
    for(let i = 0; i < wags; i++){
      const h = (4.6 - i * .4) * k;
      beats.push([j(70, .15), { [FR]: 'wave', frot: .8 * k, head: s * (h - .5) }, 'inOut']);
      beats.push([j(90, .15), { [FR]: 'wave-in', frot: 1.4 * k, head: s * (h - 1) }, 'out']);
      beats.push([j(70, .15), { [FR]: 'wave', frot: -.4 * k, head: s * (h - .5) }, 'inOut']);
      beats.push([j(90, .15), { [FR]: 'wave-out', frot: -1.4 * k, head: s * h }, 'out']);
    }
    beats.push([j(80), { [FR]: 'wave', frot: 0, face: 'smile2' }, 'out']);
    beats.push([j(160), {}, 'out']);                                                                                              // a beat on the hello
    beats.push([0, { [FR]: 'wave-rise', fsw: 4 }]);                                                                               // down: the hand drops first
    beats.push([j(100), { fsw: -12, head: -s * .6 * k, lean: 0, face: 'smile1' }, 'in']);
    beats.push([0, { [FR]: '', fsw: 0, [A]: 20, [F]: 6 }]);                                                                       // into the cutout arm
    beats.push([j(70), { [A]: -5, [F]: 4 }, 'in']);
    beats.push([j(300), { [A]: 0, [F]: 0, head: 0, face: 'rest' }, 'spring']);
    return { beats, still: { [FR]: 'wave', head: s * 4, face: 'smile' }, stillMs: 1000 };
  },
  // "Yes": a nod and a small open hand, like "got it" (the cutout arm, kept small).
  ack(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1, A = 'a' + side, F = 'f' + side;
    return { beats: [
      [j(120), { lift: -6 * k, head: s * .5 * k, face: 'smile1' }, 'out'],
      [j(200), { lift: 10 * k, head: s * 1.6 * k, [A]: 16 * k, [F]: 34 * k, face: 'smile2', brow: 'caring' }, 'inOut'],
      [j(220), { lift: 2 * k, head: s * .8 * k, [F]: 40 * k }, 'spring'],
      [j(380), { lift: 0, head: 0, [A]: 0, [F]: 0, face: 'smile1', brow: 'rest' }, 'spring'],
      [j(260), { face: 'rest' }, 'out'],
    ], still: { lift: 8, head: 1.5, face: 'smile2' }, stillMs: 700 };
  },
  // Thinking: the drawn folded arm and finger rise to his chin (the cutout
  // arms stay down), eyes up and away from the hand, then the "aha".
  think(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1, O = side === 'L' ? 'R' : 'L', FR = 'frame' + side;
    const look = 'lookU' + O;
    return { beats: [
      [j(260), { lean: -s * 1.2 * k, head: -s * 2 * k, face: 'blink2', brow: 'focused' }, 'out'],
      [60, { [FR]: 'think', fy: 46, frot: 0 }, 'linear'],
      [j(360), { fy: 0, head: s * 5 * k, lean: s * .8 * k, face: look }, 'spring'],
      [j(mode === 'focused' ? 700 : 950, .2), { head: s * 6 * k, lift: 2 * k }, 'inOut'],
      [j(360), { face: 'half' + O, head: s * 3 * k }, 'out'],
      [j(90), { face: 'rest', brow: 'up', lift: -8 * k }, 'snap'],                        // aha
      [j(180), { fy: 40, head: -s * .5 * k, lift: 4 * k, face: 'smile1', brow: 'rest' }, 'in'],
      [60, { [FR]: '', fy: 0 }, 'linear'],
      [j(320), { head: 0, lift: 0, lean: 0, face: 'rest' }, 'out'],
    ], still: { [FR]: 'think', head: s * 5, face: look, brow: 'focused' }, stillMs: 1200 };
  },
  // A cheer, drawn (2026-10-24, the cheer drawings): he crouches and pulls both
  // fists back by his hips (the load), they rise past his shoulders as he
  // springs (the rise), and at the top of the jump both arms are up in a V. The
  // landing squash drops the fists back to the rise (follow-through) and they
  // fly up again, one more pump, a laugh; down through the rise and the load
  // into the cutout arms. As drawn or mirrored, a little different each time.
  // Focused: no jump, the fists only to the rise. `land` is where the landing
  // ends (the celebrating state holds on from there).
  cheer(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .5 : 1;
    const s = R() < .5 ? -1 : 1, jump = mode === 'focused' ? 0 : 1, CH = R() < .5 ? 'frameL' : 'frameR', top = jump ? 'cheer-up' : 'cheer-mid';
    const beats = [
      [j(200), { frameLegs: 'crouch', [CH]: 'cheer-load', sy: 1 - .04 * k, sx: 1 + .02 * k, head: s * 1 * k, lift: 6 * k, face: 'smile1' }, 'in'],   // the load: crouched, fists pulled back
      [0, { [CH]: 'cheer-mid' }],                                                                                                                       // the rise: fists past the shoulders
      [j(110), { frameLegs: jump ? 'jump' : 'crouch', sy: 1 + .03 * k, sx: 1 - .015 * k, y: -28 * jump, head: -s * 2 * k, lift: -4 * k, face: 'laugh', brow: 'up' }, 'snap'],
      [0, { [CH]: top }],                                                                                                                               // the top: the V
      [j(190), { y: -50 * jump, sy: 1 + .04 * k, sx: 1 - .02 * k, head: -s * 3 * k, lift: -6 * k }, 'out'],
      [j(150), { y: -42 * jump, sy: 1.01, sx: .995, face: 'laughB' }, 'in'],
      [j(150), { frameLegs: 'crouch', y: 0, sy: 1 - .04 * k, sx: 1 + .02 * k, head: s * 2 * k, lift: 8 * k, face: 'laugh' }, 'in'],      // the landing squash
      [0, { [CH]: 'cheer-mid' }],                                                                                                                       // the fists drop with it
      [j(90), { lift: 6 * k }, 'out'],
      [0, { [CH]: top }],                                                                                                                               // and fly up again
      [j(260), { frameLegs: '', sy: 1, sx: 1, lift: 0, head: -s * 1.5 * k, face: 'laughB' }, 'spring'],
    ];
    const land = beats.length;
    beats.push(
      [j(130), { [CH]: 'cheer-mid', head: s * 1.2 * k, lift: 3 * k, face: 'laugh' }, 'in'],                                                          // one more pump
      [0, { [CH]: top }],
      [j(240), { lift: 0, head: -s * .6 * k }, 'spring'],
      [j(200), { face: 'smile' }, 'out'],
      [0, { [CH]: 'cheer-mid', brow: 'rest' }],                                                                                                         // down: the rise
      [j(100), { head: 0 }, 'in'],
      [0, { [CH]: 'cheer-load' }],                                                                                                                      // the load
      [j(100), {}, 'in'],
      [0, { [CH]: '', aL: 4, aR: 4, fL: 6, fR: 6 }],                                                                                                    // into the cutout arms
      [j(300), { aL: 0, aR: 0, fL: 0, fR: 0 }, 'spring'],
      [j(360), { face: 'smile1' }, 'out'],
      [j(240), { face: 'rest' }, 'out'],
    );
    return { beats, land, still: { [CH]: top, face: 'laugh', brow: 'up' }, stillMs: 1000 };
  },
  // A wink with a little "hey you" of the hand (the cutout arm, kept small).
  wink(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    // His left eye winks (the viewer's right), so the right arm and a tip that way.
    return { beats: [
      [j(140), { head: -1 * k, face: 'smile1', aR: -4 * k }, 'out'],
      [j(220), { head: 3.5 * k, lean: .8 * k, aR: 22 * k, fR: 46 * k, face: 'wink1' }, 'snap'],
      [j(60), { face: 'wink' }, 'linear'],
      [j(520, .2), { fR: 54 * k, head: 4 * k }, 'inOut'],
      [j(60), { face: 'wink1' }, 'linear'],
      [j(380), { aR: 0, fR: 0, head: -.4 * k, lean: 0, face: 'smile' }, 'spring'],
      [j(300), { head: 0, face: 'rest' }, 'out'],
    ], still: { head: 3.5, aR: 22, fR: 50, face: 'wink' }, stillMs: 900 };
  },
  // Not sure: the drawn palms open outward from his sides, shoulders up, a doubtful face.
  shrug(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const s = R() < .5 ? -1 : 1, FR = s < 0 ? 'frameL' : 'frameR';
    return { beats: [
      [j(180), { lift: 4 * k, head: -s * 1 * k, face: 'blink1' }, 'in'],
      [60, { [FR]: 'shrug', fsx: .5, fy: 14 }, 'linear'],
      [j(280), { fsx: 1, fy: 0, lift: -10 * k, head: s * 4 * k, face: 'doubt', brow: 'doubt', sy: 1 + .015 * k }, 'spring'],
      [j(700, .2), { head: s * 4.5 * k }, 'inOut'],
      [j(200), { fsx: .52, fy: 14, lift: 0, sy: 1, face: 'smile1', brow: 'rest' }, 'in'],
      [60, { [FR]: '', fsx: 1, fy: 0 }, 'linear'],
      [j(320), { head: 0, face: 'rest' }, 'out'],
    ], still: { lift: -10, head: s * 4, [FR]: 'shrug', face: 'doubt', brow: 'doubt' }, stillMs: 1000 };
  },
  // Reading: the drawn clipboard rises into his hands, his eyes go down it
  // along a line and back, a nod ("got it"), and it goes back down.
  read(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const s = R() < .5 ? -1 : 1, FR = s < 0 ? 'frameL' : 'frameR', L = s < 0 ? 'L' : 'R', O = s < 0 ? 'R' : 'L';
    return { beats: [
      [j(180), { lift: 2 * k, face: 'blink1' }, 'out'],
      [60, { [FR]: 'clipboard', fy: 64, frot: 0 }, 'linear'],
      [j(380), { fy: 0, lift: 4 * k, head: s * 2 * k, face: 'lookD', brow: 'focused' }, 'spring'],
      [j(700, .2), { face: 'lookD' + L, head: s * 3 * k, frot: -s * 1.8 * k }, 'inOut'],
      [j(700, .2), { face: 'lookD' + O, head: -s * 1 * k, frot: s * 1.8 * k }, 'inOut'],
      [j(220), { face: 'lookD', frot: 0 }, 'out'],
      [j(160), { lift: 8 * k, face: 'smile1', brow: 'up' }, 'inOut'],                     // got it
      [j(260), { lift: 3 * k }, 'spring'],
      [j(220), { fy: 56, lift: 0, head: 0, face: 'smile', brow: 'rest' }, 'in'],
      [60, { [FR]: '', fy: 0 }, 'linear'],
      [j(260), { face: 'rest' }, 'out'],
    ], still: { [FR]: 'clipboard', face: 'lookD', brow: 'focused' }, stillMs: 1100 };
  },
  // "Look here", drawn (2026-10-25, the point's drawings): a glance that way
  // and the arm drawn back a touch; the load, the arm cocked by his shoulder
  // as he leans away from where he will point (anticipation); a beat; then
  // the reach, the arm snapping out a little above the shoulder and past it
  // (frot), settling with a spring; the finger bobs twice, he holds on it;
  // and down by drawings, as the hello comes down: the arm at shoulder height
  // (`point`), then the wave's rise, the hand dropped below the elbow and the
  // finger let go, into the cutout arm, which swings past hanging and back
  // (`point` swung further lifted its cut shoulder as a flap). Drawings
  // swap, they never fade. o.side: 'L' (the picture's left) or 'R'
  // (mirrored), else picked. Up for this arm's frot is -s.
  point(mode, o){
    o = o || {}; const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const side = o.side || (R() < .5 ? 'L' : 'R'), s = side === 'L' ? -1 : 1, A = 'a' + side, F = 'f' + side, FR = 'frame' + side;
    return { beats: [
      [j(160), { face: 'half' + side, head: -s * 1 * k, [A]: -6, [F]: 10 }, 'in'],                                     // a glance that way, the arm drawn back a touch
      [j(50), { [A]: 24, [F]: 30 }, 'in'],                                                                               // the arm comes up
      [0, { [FR]: 'point-load', fsw: -14, frot: 0, [A]: 0, [F]: 0 }],                                                    // the load drawn: cocked by his shoulder
      [j(110), { fsw: 0, sy: 1 - .015 * k, sx: 1 + .008 * k, head: -s * 2 * k, lean: -s * .8 * k, face: 'look' + side, brow: 'up' }, 'out'],
      [j(90, .2), { frot: s * 1.5 }, 'inOut'],                                                                            // a beat, cocked a hair further
      [0, { [FR]: 'point-reach', frot: -s * 4 * k }],                                                                    // the reach drawn, past its place
      [j(80), { sy: 1 + .012 * k, sx: 1 - .006 * k, y: -6 * k, head: s * 5.5 * k, lean: s * 1.8 * k }, 'out'],
      [j(260), { frot: 0, sy: 1, sx: 1, y: 0, head: s * 5 * k, lean: s * 1.5 * k }, 'spring'],                          // settles
      [j(180), { frot: -s * 3 * k, lift: 2 * k }, 'inOut'],                                                              // the point: two bobs
      [j(180), { frot: s * 1.5 * k, lift: 0 }, 'inOut'],
      [j(180), { frot: -s * 2 * k, face: 'smile1' }, 'inOut'],
      [j(460, .2), { frot: 0, head: s * 4 * k, face: 'look' + side }, 'inOut'],                                          // holds on it
      [0, { [FR]: 'point', frot: -s * 8 }],                                                                              // down: the arm at shoulder height
      [j(70), { fsw: -14, frot: 0, head: -s * .5 * k, lean: 0, face: 'smile', brow: 'rest' }, 'in'],
      [0, { [FR]: 'wave-rise', fsw: 4 }],                                                                                // the hand drops first, the finger lets go
      [j(100), { fsw: -12, face: 'smile1' }, 'in'],
      [0, { [FR]: '', fsw: 0, [A]: 20, [F]: 6 }],                                                                        // into the cutout arm
      [j(80), { [A]: -6, [F]: 4 }, 'in'],                                                                                // past hanging
      [j(300), { [A]: 0, [F]: 0, head: 0, face: 'rest' }, 'spring'],
    ], still: { [FR]: 'point-reach', head: s * 5, lean: s * 1.5, face: 'look' + side, brow: 'up' }, stillMs: 1100 };
  },
  // A right answer: a happy hop on the drawn crouch and jump, the drawn
  // thumbs-up rising into place as he springs up (the cutout arm stays down),
  // pushed up a little on a smaller second hop, then back down.
  bounce(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .5 : 1, jump = mode === 'focused' ? 0 : 1;
    const side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1, O = side === 'L' ? 'R' : 'L', FR = 'frame' + side;
    return { beats: [
      [j(150), { frameLegs: 'crouch', sy: 1 - .035 * k, sx: 1 + .017 * k, lift: 5 * k, head: -s * 1 * k, face: 'smile1' }, 'in'],                              // the drawn crouch
      [60, { [FR]: 'thumbs-up', fy: 44, frot: 0 }, 'linear'],
      [j(230), { frameLegs: jump ? 'jump' : 'crouch', fy: 0, sy: 1 + .035 * k, sx: 1 - .017 * k, y: -34 * jump, ['a' + O]: 6 * k, ['f' + O]: 10 * k, head: s * 2.5 * k, lift: -4 * k, face: 'smile', brow: 'up' }, 'snap'],   // up: the jump, the thumb rises; the other arm stays close (out stiff it read as a board)
      [j(170), { frameLegs: 'crouch', y: 0, sy: 1 - .03 * k, sx: 1 + .015 * k, lift: 6 * k }, 'in'],
      [j(200), { sy: 1 + .015 * k, sx: 1 - .007 * k, y: -22 * jump, lift: -2 * k, frot: -s * 5 * k, head: s * 3 * k, face: 'laughB' }, 'snap'],         // a smaller second hop, the thumb pushed up
      [j(160), { y: 0, sy: 1 - .015 * k, sx: 1 + .007 * k, lift: 3 * k, frot: 0 }, 'in'],
      [j(200), { frameLegs: '', fy: 40, sy: 1, sx: 1, lift: 0, head: 0, ['a' + O]: 0, ['f' + O]: 0, face: 'smile', brow: 'rest' }, 'in'],
      [60, { [FR]: '', fy: 0 }, 'linear'],
      [j(280), { face: 'rest' }, 'out'],
    ], still: { [FR]: 'thumbs-up', frameLegs: 'crouch', head: s * 2.5, face: 'smile', brow: 'up' }, stillMs: 800 };
  },
  // A wrong answer: a wince, drawn in and down, then a caring smile.
  wince(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const s = R() < .5 ? -1 : 1;
    return { beats: [
      [j(80), { face: 'blink2' }, 'linear'],
      [j(200), { sy: 1 - .03 * k, sx: 1 + .015 * k, lift: 9 * k, head: s * 5 * k, lean: -s * 1 * k, aL: -6 * k, aR: -6 * k, fL: 16 * k, fR: 16 * k, face: 'worried', brow: 'caring' }, 'snap'],
      [j(650, .2), { head: s * 5.5 * k }, 'inOut'],
      [j(420), { sy: 1, sx: 1, lift: 0, head: -s * .5 * k, lean: 0, aL: 0, aR: 0, fL: 0, fR: 0, face: 'smile1' }, 'spring'],
      [j(320), { head: 0, face: 'rest', brow: 'rest' }, 'out'],
    ], still: { lift: 9, head: s * 5, face: 'worried', brow: 'caring' }, stillMs: 900 };
  },
  // A walk: `steps` paces to `dir` (1 right, -1 left), legs alternating,
  // arms swinging against them, a bob on each step. Still: nothing.
  walk(mode, o){
    o = o || {}; const R = drBodyRand, k = mode === 'focused' ? .6 : 1, n = o.steps || 6, dir = o.dir || 1, stride = o.stride || 62, ms = o.ms || 300;
    const beats = []; let x = 0;
    beats.push([Math.round(ms * .6), { lean: dir * 1.5 * k, face: 'smile1' }, 'out']);
    for(let i = 0; i < n; i++){
      const L = i % 2 === 0;   // which leg steps
      x += stride * dir;
      beats.push([Math.round(ms * .5), { x, y: -8 * k, upL: L ? 26 * k : 0, upR: L ? 0 : 26 * k, lL: L ? 18 * k : -6 * k, lR: L ? -6 * k : 18 * k,
                                         aL: L ? -14 * k : 20 * k, aR: L ? 20 * k : -14 * k, fL: L ? 8 * k : 22 * k, fR: L ? 22 * k : 8 * k, head: (L ? 1 : -1) * 1.2 * k }, 'out']);
      beats.push([Math.round(ms * .5), { y: 0, upL: 0, upR: 0, lL: L ? 8 * k : -8 * k, lR: L ? -8 * k : 8 * k }, 'in']);
    }
    beats.push([Math.round(ms * .9), { lL: 0, lR: 0, aL: 0, aR: 0, fL: 0, fR: 0, head: 0, lean: 0, face: 'rest' }, 'spring']);
    return { beats, still: null, stillMs: 0, dx: x };
  },
  // A doze (the phone's resting state, nobody has touched it for a while): his
  // eyes close slowly, his head and shoulders sink, one slow breath asleep, a
  // small jolt awake, a look around, back. Still: nothing.
  doze(mode){
    const R = drBodyRand, k = mode === 'focused' ? .6 : 1, s = R() < .5 ? -1 : 1, L = s < 0 ? 'L' : 'R';
    return { beats: [
      [500, { face: 'blink1', lift: 2 * k }, 'inOut'],
      [400, { face: 'blink2', lift: 5 * k, head: s * 2 * k }, 'inOut'],
      [600, { face: 'shut', lift: 9 * k, head: s * 4 * k, lean: s * .6 * k, sy: 1 - .008 * k, aL: 2 * k, aR: 2 * k, brow: 'down' }, 'inOut'],   // slumps
      [800, { face: 'sleep', lift: 12 * k, head: s * 6 * k }, 'inOut'],
      [1200, { lift: 14 * k, head: s * 7 * k, sy: 1 - .012 * k }, 'inOut'],                                                                 // one slow breath asleep
      [120, { lift: -4 * k, head: -s * 1 * k, lean: 0, sy: 1, face: 'blink2', brow: 'up' }, 'snap'],                                        // a jolt awake
      [240, { face: 'rest', lift: 2 * k }, 'spring'],
      [300, { face: 'look' + L, head: s * 1.5 * k }, 'out'],
      [400, { lift: 0, head: 0, aL: 0, aR: 0, brow: 'rest', face: 'rest' }, 'spring'],
    ], still: null, stillMs: 0 };
  },
  // Rest beats, picked now and then while idle (drBodyIdle): a shift of weight, a look around.
  shift(mode){
    const R = drBodyRand, k = mode === 'focused' ? .6 : 1, s = R() < .5 ? -1 : 1;
    return { beats: [
      [600, { lean: s * 1.1 * k, lL: s < 0 ? 4 * k : -2 * k, lR: s < 0 ? -2 * k : 4 * k, head: -s * 1.2 * k, aL: s * 3 * k, aR: -s * 3 * k }, 'inOut'],
      [2600 + R() * 1800, {}, 'linear'],
      [700, { lean: 0, lL: 0, lR: 0, head: 0, aL: 0, aR: 0 }, 'inOut'],
    ], still: null, stillMs: 0 };
  },
  glance(mode){
    const R = drBodyRand, k = mode === 'focused' ? .6 : 1, s = R() < .5 ? -1 : 1, L = s < 0 ? 'L' : 'R';
    return { beats: [
      [200, { face: 'half' + L }, 'linear'],
      [260, { head: s * 2.2 * k, face: 'look' + L }, 'out'],
      [900 + R() * 700, {}, 'linear'],
      [120, { face: 'half' + L }, 'linear'],
      [360, { head: 0, face: 'rest' }, 'out'],
    ], still: null, stillMs: 0 };
  },
};

/* The held states (body.state(name)). Each: enter(c) and hold(c), beats built
   from the context c (side, k for Focused, beat count, since, the seeded
   random and j for timing jitter), still(c) for Still, exit(c) or the common
   exit. A hold group names its base pose again in its first beat, so a hold
   resumed after a gesture (which ends at rest) folds back into it. */
const DR_BODY_BLINK = face => [[45, { face: 'blink1' }, 'linear'], [40, { face: 'blink2' }, 'linear'], [75, { face: 'shut' }, 'linear'], [45, { face: 'blink2' }, 'linear'], [55, { face: 'blink1' }, 'linear'], [60, { face }, 'linear']];
const DR_BODY_HOLD_EXIT = c => [
  [c.j(400), { x: 0, y: 0, lean: 0, sx: 1, sy: 1, head: 0, lift: 0, aL: 0, aR: 0, fL: 0, fR: 0, lL: 0, lR: 0, upL: 0, upR: 0, frameL: '', frameR: '', frameLegs: '', frot: 0, fsw: 0, fy: 0, fsx: 1, face: 'smile1', brow: 'rest' }, 'spring'],
  [c.j(260), { face: 'rest' }, 'out'],
];
const DR_BODY_STATES = {
  // Listening (the app's attentive): leaned in a touch, head tipped, one open
  // hand a little forward ("go on"; the cutout arm, kept small); slow tilts,
  // a small nod now and then.
  listening: {
    still: c => ({ lean: c.s * .6, head: c.s * 3, lift: -2, [c.A]: 12, [c.F]: 30, brow: 'up' }),
    enter: c => { const { k, s, j, A, F } = c; return [
      [j(220), { lift: -3 * k, head: -s * 1 * k, face: 'blink1' }, 'out'],
      [j(360), { lift: -2 * k, head: s * 3 * k, lean: s * .6 * k, [A]: 12 * k, [F]: 30 * k, brow: 'up', face: 'rest' }, 'spring'],
    ]; },
    hold: c => { const { k, s, j, A, F, beat } = c, tilt = (beat % 2 ? -.8 : 1) * s * 3 * k, b = [];
      b.push([j(1400, .25), { lean: s * .6 * k, [A]: 12 * k, [F]: (30 + (beat % 2) * 6) * k, head: tilt, lift: (-2 + (beat % 2)) * k, brow: 'up' }, 'inOut']);
      if(beat % 3 === 2) b.push([j(160), { lift: 5 * k, face: 'smile1' }, 'inOut'], [j(280), { lift: -2 * k }, 'spring'], [j(260), { face: 'rest' }, 'linear']);   // a nod: "I see"
      if(beat % 2 === 1) b.push(...DR_BODY_BLINK('rest'));
      b.push([j(500, .3), {}, 'linear']);
      return b; },
  },
  // Thinking (processing): the drawn folded arm and finger rise to his chin,
  // eyes up and away from the hand, wandering; a slow blink every other beat,
  // a tap of the finger now and then; slower once it has taken a while. The
  // exit is the "aha", and the arm goes back down.
  thinking: {
    still: c => ({ [c.FR]: 'think', head: c.s * 5, face: 'lookU' + c.O, brow: 'focused' }),
    enter: c => { const { k, s, j, O, FR } = c; return [
      [j(260), { lean: -s * 1.2 * k, head: -s * 2 * k, face: 'blink2', brow: 'focused' }, 'out'],
      [60, { [FR]: 'think', fy: 46, frot: 0 }, 'linear'],
      [j(360), { fy: 0, head: s * 5 * k, lean: s * .8 * k, lift: 2 * k, face: 'lookU' + O }, 'spring'],
    ]; },
    hold: c => { const { k, s, j, O, FR, beat, since } = c;
      const faces = ['lookU' + O, 'lookU', 'lookU' + O, 'lookU'], face = faces[beat % 4], turn = [6, 4.5, 6.5, 4][beat % 4];
      const slow = performance.now() - since > 9000 ? 1.5 : 1, b = [];
      b.push([Math.round(j(1100, .3) * slow), { [FR]: 'think', fy: 0, lean: s * .8 * k, head: s * turn * k, lift: (2 + (beat % 2)) * k, face, brow: 'focused' }, 'inOut']);
      if(beat % 4 === 3) b.push([j(170), { frot: 2.4 * k }, 'inOut'], [j(170), { frot: 0 }, 'inOut']);   // the finger taps
      if(beat % 2 === 1) b.push(...DR_BODY_BLINK(face));
      b.push([Math.round(j(400, .3) * slow), {}, 'linear']);
      return b; },
    exit: c => { const { k, s, j, FR } = c; return [
      [j(90), { face: 'rest', brow: 'up', lift: -8 * k }, 'snap'],                        // aha
      [j(180), { fy: 40, frot: 0, head: -s * .5 * k, lift: 4 * k, face: 'smile1', brow: 'rest' }, 'in'],
      [60, { [FR]: '', fy: 0 }, 'linear'],
      [j(320), { head: 0, lift: 0, lean: 0, face: 'rest' }, 'out'],
    ]; },
  },
  // Answering (reading the answer with you): the drawn clipboard rises into
  // his hands at his chest, eyes down on it along a line and back, the board
  // tilting a little with them, a nod now and then; a blink every third beat.
  answering: {
    still: c => ({ [c.FR]: 'clipboard', lift: 3, face: 'lookD', brow: 'focused' }),
    enter: c => { const { k, s, j, FR } = c; return [
      [j(200), { lift: 2 * k, face: 'blink2' }, 'out'],
      [60, { [FR]: 'clipboard', fy: 64, frot: 0 }, 'linear'],
      [j(380), { fy: 0, lift: 3 * k, head: s * 1.5 * k, face: 'lookD', brow: 'focused' }, 'spring'],
    ]; },
    hold: c => { const { k, s, j, FR, beat } = c, L = s < 0 ? 'L' : 'R', O = s < 0 ? 'R' : 'L';
      const faces = ['lookD' + L, 'lookD', 'lookD' + O, 'lookD'], face = faces[beat % 4], tilt = [-1.6, 0, 1.6, 0][beat % 4], b = [];
      b.push([j(900, .3), { [FR]: 'clipboard', fy: 0, frot: s * tilt * k, lift: (3 + (beat % 4 === 1 ? 2 : 0)) * k, head: s * (1.5 + (beat % 2) * 1) * k, face, brow: 'focused' }, 'inOut']);
      if(beat % 5 === 4) b.push([j(160), { lift: 8 * k, face: 'smile1' }, 'inOut'], [j(260), { lift: 3 * k, face }, 'spring']);   // a nod: "I see"
      if(beat % 3 === 2) b.push(...DR_BODY_BLINK(face));
      b.push([j(300, .3), {}, 'linear']);
      return b; },
    exit: c => { const { j, FR } = c; return [
      [j(220), { fy: 56, frot: 0, lift: 0, head: 0, face: 'smile1', brow: 'rest' }, 'in'],
      [60, { [FR]: '', fy: 0 }, 'linear'],
      [j(280), { face: 'rest' }, 'out'],
    ]; },
  },
  // Celebrating: the cheer up to its landing, then a happy bob with one drawn
  // fist pumping (as drawn or mirrored), the other hand down, a laugh; the
  // exit swings the fist back down.
  celebrating: {
    still: c => ({ frameL: 'fist-pump', frameR: 'fist-pump', frameLegs: 'crouch', face: 'laugh', brow: 'up' }),
    enter: c => { const p = DR_BODY_PERF.cheer(c.mode); return p.beats.slice(0, p.land); },
    hold: c => { const { k, s, j, O, FR, beat } = c, b = [];
      // from the cheer's V (both arms up) through its rise drawing, so the arm that
      // goes down comes down in two steps, never from overhead to his side at once
      if(!beat) b.push([0, { frameL: 'cheer-mid', frameR: '' }], [j(110), { lift: 3 * k }, 'in']);
      b.push([j(beat ? 260 : 300), { [FR]: 'fist-pump', ['frame' + O]: '', fsw: 0, ['a' + O]: 4 * k, ['f' + O]: 10 * k, lean: -s * 1.2 * k, sy: 1 - .012 * k, sx: 1 + .006 * k, lift: 4 * k, head: s * 2 * k, face: beat % 2 ? 'laughB' : 'laugh', brow: 'up' }, beat ? 'in' : 'spring']);
      b.push([j(120), { frot: -4 * k }, 'linear']);
      b.push([j(320), { sy: 1 + .008 * k, sx: 1 - .004 * k, lift: -2 * k, frot: 5 * k, head: -s * 1 * k, face: 'laugh' }, 'spring']);
      b.push([j(380), { sy: 1, sx: 1, lift: 0, frot: 0, head: 0 }, 'out']);
      if(beat % 3 === 2) b.push(...DR_BODY_BLINK('laugh'));
      return b; },
    exit: c => { const { j } = c; return [
      [j(220), { frot: 0, fsw: -50, lean: 0, sy: 1, sx: 1, lift: 0, head: 0, face: 'smile', brow: 'rest' }, 'in'],
      [60, { frameL: '', frameR: '', frameLegs: '', fsw: 0, aL: 4, aR: 4, fL: 6, fR: 6 }, 'linear'],
      [j(300), { aL: 0, aR: 0, fL: 0, fR: 0, face: 'smile1' }, 'spring'], [j(240), { face: 'rest' }, 'out'],
    ]; },
  },
  // Uncertain: shoulders a little up, both open hands a little out from his
  // sides (the cutout arms, kept small), a doubtful face and never a cheerful
  // one; the head tips slowly side to side, a small re-shrug now and then.
  uncertain: {
    still: c => ({ lift: -6, head: c.s * 3, aL: 8, aR: 8, fL: 34, fR: 34, face: 'doubt', brow: 'doubt' }),
    enter: c => { const { k, s, j } = c; return [
      [j(160), { face: 'blink1' }, 'in'],
      [j(320), { lift: -6 * k, head: s * 3 * k, aL: 8 * k, aR: 8 * k, fL: 34 * k, fR: 34 * k, face: 'doubt', brow: 'doubt' }, 'spring'],
    ]; },
    hold: c => { const { k, s, j, O, beat } = c, faces = ['doubt', 'rest', 'lookU' + O, 'doubt'], face = faces[beat % 4], b = [];
      b.push([j(1500, .25), { lift: -6 * k, aL: 8 * k, aR: 8 * k, fL: 34 * k, fR: 34 * k, head: (beat % 2 ? -.8 : 1) * s * 3 * k, face, brow: 'doubt' }, 'inOut']);
      if(beat % 3 === 2) b.push([j(240), { lift: -11 * k, fL: 42 * k, fR: 42 * k }, 'out'], [j(380), { lift: -6 * k, fL: 34 * k, fR: 34 * k }, 'spring']);   // a small shrug again
      if(beat % 2 === 1) b.push(...DR_BODY_BLINK(face));
      b.push([j(400, .3), {}, 'linear']);
      return b; },
    exit: c => [[c.j(400), { lift: 0, head: 0, aL: 0, aR: 0, fL: 0, fR: 0, face: 'rest', brow: 'rest' }, 'spring'], [c.j(200), {}, 'linear']],
  },
};

/* Idle life: blinks every few seconds, and now and then a shift of weight or
   a glance, only while the page is seen and nothing else plays. Lively and
   Focused; Still and reduced motion get nothing. Levels, as the app's idle
   levels for his head (DR_IDLE_LEVEL): 'full' (blinks, shifts, glances),
   'calm' (blinks and a glance now and then: offline, resting), 'blinks'
   (blinks only: attentive, uncertain, an appointment), 'none'. Returns
   stop(), with stop.setLevel(level) and stop.doze() (the resting state's
   one doze, when the phone has been quiet a while) on it. */
function drBodyIdle(body, o){
  o = o || {};
  let t1 = 0, t2 = 0, t3 = 0, on = true, level = o.level || 'full';
  const R = drBodyRand;
  const seen = () => on && (!o.canPlay || o.canPlay()) && document.visibilityState === 'visible' && body.mode() !== 'still';
  // Face frames stepped by timers, not the frame loop: a blink, a glance of
  // the eyes, a smile cost the page no frames (Home's rule: what settles
  // stays settled; only a performance runs the loop). Back to the face he had.
  const steps = list => { let i = 0; const face0 = body.pose.face; const go = () => { if(!seen() || body.busy()) return; if(i >= list.length){ body.set({ face: face0 }); return; } const [f, ms] = list[i++]; body.set({ face: f }); t3 = setTimeout(go, ms); }; clearTimeout(t3); go(); };
  const BLINK = [['blink1', 45], ['blink2', 40], ['shut', 75], ['blink2', 45], ['blink1', 55]];
  const blink = () => {
    t1 = setTimeout(() => {
      if(level !== 'none' && seen() && !body.busy()) steps(BLINK);
      blink();
    }, 2600 + R() * 3200);
  };
  // Rest beats: a shift of weight or a glance with the head (the rig, a short
  // frame loop), or, with o.quiet (Home), face-only beats on timers: the eyes
  // glance aside, or a smile.
  const faceBeat = () => { const S = R() < .5 ? 'L' : 'R'; steps(R() < .5 ? [['half' + S, 200], ['look' + S, 900 + R() * 700], ['half' + S, 120]] : [['smile1', 260], ['smile', 900 + R() * 600], ['smile1', 260]]); };
  const beat = () => {
    t2 = setTimeout(() => {
      if(seen() && !body.busy()){
        if(o.quiet){ if(level === 'full' || (level === 'calm' && R() < .5)) faceBeat(); }
        else if(level === 'full') body.perform(R() < .6 ? 'shift' : 'glance');
        else if(level === 'calm' && R() < .5) body.perform('glance');
      }
      beat();
    }, (o.every || 7000) + R() * 5000 + (level === 'calm' ? 6000 : 0));
  };
  blink(); beat();
  const stop = () => { on = false; clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  stop.setLevel = l => { level = l; };
  stop.level = () => level;
  stop.doze = () => { if(level !== 'none' && seen() && !body.busy()) return body.perform('doze'); return false; };
  return stop;
}
