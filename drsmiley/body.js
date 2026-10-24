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
  // real open hand, fist, finger and palms. Each is swapped in at the top of a
  // gesture the way a face frame is, once the cutout arm has swung to `at`
  // (its raise and bend, so the swap is a change of hand, not a jump); `arms`
  // are the cutout arms it stands in for; `layer` back is behind the coat
  // (the arm comes out from under the shoulder), front is over it (the folded
  // arm, the finger on the chin); `pivot` is where it turns for a wag (`frot`).
  // Every one also exists mirrored about his middle (`mirrorX`), for the other side.
  mirrorX: 556,
  pose: {
    wave:        { box: [134, 360, 263, 367], arms: ['L'], layer: 'back', at: { a: 100, f: 80 }, pivot: [190, 600] },
    'fist-pump': { box: [123, 364, 274, 343], arms: ['L'], layer: 'back', at: { a: 110, f: 100 }, pivot: [353, 630] },
    think:       { box: [352, 497, 275, 446], arms: ['L', 'R'], layer: 'front', at: { a: 18, f: 128, a2: 10, f2: 60 }, pivot: [353, 630] },
    shrug:       { box: [97, 559, 889, 407], arms: ['L', 'R'], layer: 'back', at: { a: 28, f: 95, a2: 28, f2: 95 }, pivot: [556, 630] },
    // Cut as a feathered band of the picture (its sleeve lies over the coat), so it is drawn in front.
    'thumbs-up': { box: [247, 512, 189, 304], arms: ['L'], layer: 'front', at: { a: 20, f: 120 }, pivot: [353, 630] },
    // Both hands on a clipboard at his chest (a feathered band from the collar to below the hands, both sleeves in it): stands in for both arms; `frot` tilts it.
    clipboard:   { box: [281, 567, 511, 354], arms: ['L', 'R'], layer: 'front', at: { a: 20, f: 115, a2: 20, f2: 115 }, pivot: [556, 760] },
    // The pointing arm: straight out at shoulder height, the index finger out ("look here"); `frot` bobs it about the shoulder.
    point:       { box: [24, 559, 386, 136], arms: ['L'], layer: 'back', at: { a: 95, f: 0 }, pivot: [353, 630] },
    // The leg plates: both legs whole, in place of the two cutout legs (no mirror; `frameLegs` names one).
    crouch:      { box: [292, 990, 506, 425], legs: true, layer: 'legs', pivot: [556, 1040] },
    jump:        { box: [315, 990, 463, 328], legs: true, layer: 'legs', pivot: [556, 1040] },
  },
};
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
const DR_BODY_REST = { x: 0, y: 0, lean: 0, sx: 1, sy: 1, head: 0, lift: 0, aL: 0, aR: 0, fL: 0, fR: 0, lL: 0, lR: 0, upL: 0, upR: 0, chest: 1, face: 'rest', brow: 'rest', frameL: '', frameR: '', frot: 0, frameLegs: '' };
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
     R), turned by `frot` about its pivot, and hide the cutout arms it stands
     in for. Opacity, so the page can cross-fade the swap. */
  let shown = '';
  function setFrames(p){
    const key = p.frameL + '|' + p.frameR + '|' + p.frameLegs + '|' + (p.frameL || p.frameR ? p.frot.toFixed(2) : '');
    if(key === shown) return;
    shown = key;
    const hide = { L: false, R: false }; let legs = false;
    for(const g of el.poses){
      const name = g.dataset.pose, side = g.dataset.side, P = B.pose[name];
      const want = P.legs ? p.frameLegs === name : (side === 'l' ? p.frameL === name : p.frameR === name);
      g.style.opacity = want ? '1' : '0';
      if(!want) continue;
      if(P.legs){ legs = true; continue; }
      const [px, py] = P.pivot;
      g.setAttribute('transform', (side === 'r' ? `translate(${2 * B.mirrorX},0) scale(-1,1) ` : '') + `rotate(${p.frot.toFixed(3)} ${px} ${py})`);
      for(const a of P.arms) hide[side === 'l' ? a : (a === 'L' ? 'R' : 'L')] = true;
    }
    el.armL.style.opacity = hide.L ? '0' : '1';
    el.armR.style.opacity = hide.R ? '0' : '1';
    el.legL.style.opacity = legs ? '0' : '1';
    el.legR.style.opacity = legs ? '0' : '1';
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
    const start = keep ? Object.assign({}, pose) : Object.assign({}, pose, { frameL: '', frameR: '', frameLegs: '', frot: 0 });
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
  // Hello: a wave with the near arm, the head tipped toward it, brows flashed.
  greet(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .55 : 1;
    const side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1, A = 'a' + side, F = 'f' + side, FR = 'frame' + side;
    // The cutout arm swings up to where the drawn wave is, the drawn hand takes
    // over there (the swap of a frame), wags, and hands back for the way down.
    const { a: up, f: bend } = DR_BODY.pose.wave.at, wags = mode === 'focused' ? 2 : 3, wag = 7 + R() * 2;
    const beats = [
      [j(160, .2), { sy: 1 - .025 * k, sx: 1 + .012 * k, face: 'blink1', head: -s * 1.5 * k }, 'in'],                       // a dip: he's seen you
      [j(260), { sy: 1 + .02 * k, sx: 1 - .01 * k, y: -14 * k, [A]: up, [F]: bend, face: 'smile', brow: 'up', head: s * 4 * k, lean: s * 1.2 * k }, 'snap'],
      [j(170), { sy: 1, sx: 1, y: 0, brow: 'rest', [FR]: 'wave', frot: 0 }, 'spring'],
    ];
    for(let i = 0; i < wags; i++){
      beats.push([j(150, .2), { frot: wag * k, head: s * (4.6 - i * .4) * k }, 'inOut']);
      beats.push([j(150, .2), { frot: -wag * k, head: s * (3.6 - i * .4) * k }, 'inOut']);
    }
    beats.push([j(240), { frot: 0, face: 'smile2' }, 'out']);
    beats.push([j(420), { [FR]: '', [A]: 0, [F]: 0, head: -s * .6 * k, lean: 0, face: 'smile1' }, 'spring']);
    beats.push([j(300), { head: 0, face: 'rest' }, 'out']);
    return { beats, still: { [A]: up, [F]: bend, [FR]: 'wave', head: s * 4, face: 'smile' }, stillMs: 1000 };
  },
  // "Yes": a nod and a small open hand, like "got it".
  ack(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1, A = 'a' + side, F = 'f' + side;
    return { beats: [
      [j(120), { lift: -6 * k, head: s * .5 * k, face: 'smile1' }, 'out'],
      [j(200), { lift: 10 * k, head: s * 1.6 * k, [A]: 28 * k, [F]: 55 * k, face: 'smile2', brow: 'caring' }, 'inOut'],
      [j(220), { lift: 2 * k, head: s * .8 * k, [F]: 65 * k }, 'spring'],
      [j(380), { lift: 0, head: 0, [A]: 0, [F]: 0, face: 'smile1', brow: 'rest' }, 'spring'],
      [j(260), { face: 'rest' }, 'out'],
    ], still: { lift: 8, head: 1.5, face: 'smile2' }, stillMs: 700 };
  },
  // Thinking: a hand to the chin, eyes up to the side, then the "aha".
  think(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1, A = 'a' + side, F = 'f' + side, O = side === 'L' ? 'R' : 'L', FR = 'frame' + side;
    const look = 'lookU' + O, T = DR_BODY.pose.think.at;   // eyes away from the hand
    // The cutout arms fold to where the drawn pose has them, then the drawn
    // finger on the chin takes over and holds; the "aha" hands back.
    return { beats: [
      [j(300), { lean: -s * 1.2 * k, head: -s * 2 * k, face: 'blink2', brow: 'focused' }, 'out'],
      [j(380), { [A]: T.a, [F]: T.f, ['a' + O]: T.a2, ['f' + O]: T.f2, head: s * 5 * k, lean: s * .8 * k, face: look }, 'spring'],
      [j(mode === 'focused' ? 700 : 950, .2), { [FR]: 'think', head: s * 6 * k, lift: 2 * k }, 'inOut'],
      [j(360), { face: 'half' + O, head: s * 3 * k }, 'out'],
      [j(90), { face: 'rest', brow: 'up', lift: -8 * k }, 'snap'],                        // aha
      [j(300), { [FR]: '', [A]: 0, [F]: 0, ['a' + O]: 0, ['f' + O]: 0, head: -s * .5 * k, lift: 4 * k, face: 'smile1', brow: 'rest' }, 'spring'],
      [j(320), { head: 0, lift: 0, lean: 0, face: 'rest' }, 'out'],
    ], still: { [A]: T.a, [F]: T.f, ['a' + O]: T.a2, ['f' + O]: T.f2, [FR]: 'think', head: s * 5, face: look, brow: 'focused' }, stillMs: 1200 };
  },
  // A cheer: crouch, spring up with both arms, land with a squash, a laugh.
  cheer(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .5 : 1;
    const s = R() < .5 ? -1 : 1, jump = mode === 'focused' ? 0 : 1, P = DR_BODY.pose['fist-pump'].at;
    // Both cutout arms snap up to where the drawn fist pump is; at the top of
    // the jump the two drawn fists take over (one as drawn, one mirrored) and
    // pump with the laugh; they hand back before the arms come down.
    return { beats: [
      [j(200), { frameLegs: 'crouch', sy: 1 - .04 * k, sx: 1 + .02 * k, aL: -12 * k, aR: -12 * k, fL: 20 * k, fR: 20 * k, head: s * 1 * k, lift: 6 * k, face: 'smile1' }, 'in'],         // the drawn crouch, knees bent
      [j(260), { frameLegs: jump ? 'jump' : 'crouch', sy: 1 + .04 * k, sx: 1 - .02 * k, y: -50 * jump, aL: P.a, aR: P.a, fL: P.f, fR: P.f, head: -s * 3 * k, lift: -6 * k, face: 'laugh', brow: 'up' }, 'snap'],   // the drawn jump, feet tucked
      [j(180), { frameL: 'fist-pump', frameR: 'fist-pump', frot: 0, y: -30 * jump, sy: 1.01, sx: .995, face: 'laughB' }, 'in'],
      [j(170), { frameLegs: 'crouch', y: 0, sy: 1 - .04 * k, sx: 1 + .02 * k, frot: 6 * k, head: s * 2 * k, lift: 8 * k, face: 'laugh' }, 'in'],      // the landing squash, into the crouch
      [j(260), { frameLegs: '', sy: 1, sx: 1, lift: 0, frot: -5 * k, head: -s * 1.5 * k, face: 'laughB' }, 'spring'],
      [j(260), { frot: 4 * k, head: s * 1.2 * k, face: 'laugh' }, 'inOut'],
      [j(380), { frameL: '', frameR: '', frot: 0, aL: 0, aR: 0, fL: 0, fR: 0, head: 0, face: 'smile', brow: 'rest' }, 'spring'],
      [j(360), { face: 'smile1' }, 'out'],
      [j(240), { face: 'rest' }, 'out'],
    ], still: { aL: P.a, aR: P.a, fL: P.f, fR: P.f, frameL: 'fist-pump', frameR: 'fist-pump', frameLegs: 'crouch', face: 'laugh', brow: 'up' }, stillMs: 1000 };
  },
  // A wink with a little "hey you" of the hand.
  wink(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    // His left eye winks (the viewer's right), so the right arm and a tip that way.
    return { beats: [
      [j(140), { head: -1 * k, face: 'smile1' }, 'out'],
      [j(220), { head: 3.5 * k, lean: .8 * k, aR: 55 * k, fR: 75 * k, face: 'wink1' }, 'snap'],
      [j(60), { face: 'wink' }, 'linear'],
      [j(520, .2), { fR: 85 * k, head: 4 * k }, 'inOut'],
      [j(60), { face: 'wink1' }, 'linear'],
      [j(380), { aR: 0, fR: 0, head: -.4 * k, lean: 0, face: 'smile' }, 'spring'],
      [j(300), { head: 0, face: 'rest' }, 'out'],
    ], still: { head: 3.5, aR: 55, fR: 80, face: 'wink' }, stillMs: 900 };
  },
  // Not sure: a shrug, palms up, a doubtful face.
  shrug(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const s = R() < .5 ? -1 : 1, P = DR_BODY.pose.shrug.at, FR = s < 0 ? 'frameL' : 'frameR';
    // The cutout arms open to where the drawn shrug has them; the drawn palms
    // (as drawn or mirrored) take over for the hold and hand back on the way down.
    return { beats: [
      [j(180), { lift: 4 * k, head: -s * 1 * k, face: 'blink1' }, 'in'],
      [j(260), { lift: -10 * k, head: s * 4 * k, aL: P.a, aR: P.a2, fL: P.f, fR: P.f2, face: 'doubt', brow: 'doubt', sy: 1 + .015 * k }, 'spring'],
      [j(700, .2), { [FR]: 'shrug', head: s * 4.5 * k }, 'inOut'],
      [j(420), { [FR]: '', lift: 0, head: 0, aL: 0, aR: 0, fL: 0, fR: 0, sy: 1, face: 'smile1', brow: 'rest' }, 'spring'],
      [j(260), { face: 'rest' }, 'out'],
    ], still: { lift: -10, head: s * 4, aL: P.a, aR: P.a2, fL: P.f, fR: P.f2, [FR]: 'shrug', face: 'doubt', brow: 'doubt' }, stillMs: 1000 };
  },
  // Reading: both hands bring the drawn clipboard up to his chest, his eyes go
  // down it along a line and back, a nod ("got it"), and the hands come down.
  read(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const s = R() < .5 ? -1 : 1, C = DR_BODY.pose.clipboard.at, FR = s < 0 ? 'frameL' : 'frameR', L = s < 0 ? 'L' : 'R', O = s < 0 ? 'R' : 'L';
    return { beats: [
      [j(180), { lift: 2 * k, face: 'blink1' }, 'out'],
      [j(360), { aL: C.a, aR: C.a2, fL: C.f, fR: C.f2, lift: 4 * k, head: s * 2 * k, face: 'lookD', brow: 'focused' }, 'spring'],
      [j(120), { [FR]: 'clipboard', frot: 0 }, 'linear'],
      [j(700, .2), { face: 'lookD' + L, head: s * 3 * k, frot: -s * 1.8 * k }, 'inOut'],
      [j(700, .2), { face: 'lookD' + O, head: -s * 1 * k, frot: s * 1.8 * k }, 'inOut'],
      [j(220), { face: 'lookD', frot: 0 }, 'out'],
      [j(160), { lift: 8 * k, face: 'smile1', brow: 'up' }, 'inOut'],                     // got it
      [j(260), { lift: 3 * k }, 'spring'],
      [j(380), { [FR]: '', aL: 0, aR: 0, fL: 0, fR: 0, lift: 0, head: 0, face: 'smile', brow: 'rest' }, 'spring'],
      [j(260), { face: 'rest' }, 'out'],
    ], still: { aL: C.a, aR: C.a2, fL: C.f, fR: C.f2, [FR]: 'clipboard', face: 'lookD', brow: 'focused' }, stillMs: 1100 };
  },
  // "Look here": a glance that way, the arm swings straight out to where the
  // drawn pointing hand is, the finger takes over and bobs twice (the point
  // itself), eyes and head toward it; then back. o.side: 'L' (the picture's
  // left) or 'R' (mirrored), else picked.
  point(mode, o){
    o = o || {}; const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const side = o.side || (R() < .5 ? 'L' : 'R'), s = side === 'L' ? -1 : 1, A = 'a' + side, F = 'f' + side, FR = 'frame' + side, P = DR_BODY.pose.point.at;
    return { beats: [
      [j(160), { face: 'half' + side, head: -s * 1 * k, [A]: -6 * k, [F]: 10 * k }, 'in'],                                   // a glance that way, the arm drawn back a touch
      [j(260), { [A]: P.a, [F]: P.f, head: s * 5 * k, lean: s * 1.5 * k, face: 'look' + side, brow: 'up' }, 'snap'],         // out
      [j(120), { [FR]: 'point', frot: 0 }, 'linear'],                                                                        // the drawn finger takes over
      [j(180), { frot: -s * 3 * k, lift: 2 * k }, 'inOut'],                                                                  // the point: two bobs
      [j(180), { frot: s * 1.5 * k, lift: 0 }, 'inOut'],
      [j(180), { frot: -s * 2.5 * k, face: 'smile1' }, 'inOut'],
      [j(500, .2), { frot: 0, head: s * 4 * k, face: 'look' + side }, 'inOut'],                                              // holds on it
      [j(400), { [FR]: '', [A]: 0, [F]: 0, head: -s * .5 * k, lean: 0, face: 'smile', brow: 'rest' }, 'spring'],
      [j(260), { head: 0, face: 'rest' }, 'out'],
    ], still: { [A]: P.a, [F]: P.f, [FR]: 'point', head: s * 5, lean: s * 1.5, face: 'look' + side, brow: 'up' }, stillMs: 1100 };
  },
  // A right answer: a happy hop on the drawn crouch and jump, the drawn
  // thumbs-up (one side, as drawn or mirrored) from the top of the hop through
  // a smaller second hop. The other cutout arm rises only a little (past about
  // 25 degrees the shoulder cap comes out from under the coat).
  bounce(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .5 : 1, jump = mode === 'focused' ? 0 : 1;
    const side = R() < .5 ? 'L' : 'R', s = side === 'L' ? -1 : 1, A = 'a' + side, F = 'f' + side, O = side === 'L' ? 'R' : 'L', FR = 'frame' + side, T = DR_BODY.pose['thumbs-up'].at;
    return { beats: [
      [j(150), { frameLegs: 'crouch', sy: 1 - .035 * k, sx: 1 + .017 * k, lift: 5 * k, head: -s * 1 * k, face: 'smile1' }, 'in'],                              // the drawn crouch
      [j(230), { frameLegs: jump ? 'jump' : 'crouch', sy: 1 + .035 * k, sx: 1 - .017 * k, y: -34 * jump, [A]: T.a, [F]: T.f, ['a' + O]: 18 * k, ['f' + O]: 24 * k, head: s * 2.5 * k, lift: -4 * k, face: 'smile', brow: 'up' }, 'snap'],   // the drawn jump, the arm folding up
      [j(170), { [FR]: 'thumbs-up', frot: 0, frameLegs: 'crouch', y: 0, sy: 1 - .03 * k, sx: 1 + .015 * k, lift: 6 * k, ['a' + O]: 12 * k }, 'in'],            // the drawn thumbs-up takes over at the top
      [j(200), { sy: 1 + .015 * k, sx: 1 - .007 * k, y: -22 * jump, lift: -2 * k, frot: -s * 5 * k, head: s * 3 * k, face: 'laughB' }, 'snap'],         // a smaller second hop, knees still bent, the thumb pushed up
      [j(160), { y: 0, sy: 1 - .015 * k, sx: 1 + .007 * k, lift: 3 * k, frot: 0 }, 'in'],
      [j(340), { [FR]: '', frameLegs: '', sy: 1, sx: 1, lift: 0, head: 0, aL: 0, aR: 0, fL: 0, fR: 0, face: 'smile', brow: 'rest' }, 'spring'],
      [j(280), { face: 'rest' }, 'out'],
    ], still: { [A]: T.a, [F]: T.f, [FR]: 'thumbs-up', ['a' + O]: 12, frameLegs: 'crouch', head: s * 2.5, face: 'smile', brow: 'up' }, stillMs: 800 };
  },
  // A wrong answer: a wince, drawn in and down, then a caring smile.
  wince(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .6 : 1;
    const s = R() < .5 ? -1 : 1;
    return { beats: [
      [j(80), { face: 'blink2' }, 'linear'],
      [j(200), { sy: 1 - .03 * k, sx: 1 + .015 * k, lift: 9 * k, head: s * 5 * k, lean: -s * 1 * k, aL: -8 * k, aR: -8 * k, fL: 25 * k, fR: 25 * k, face: 'worried', brow: 'caring' }, 'snap'],
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
  [c.j(400), { x: 0, y: 0, lean: 0, sx: 1, sy: 1, head: 0, lift: 0, aL: 0, aR: 0, fL: 0, fR: 0, lL: 0, lR: 0, upL: 0, upR: 0, frameL: '', frameR: '', frameLegs: '', frot: 0, face: 'smile1', brow: 'rest' }, 'spring'],
  [c.j(260), { face: 'rest' }, 'out'],
];
const DR_BODY_STATES = {
  // Listening (the app's attentive): leaned in a touch, head tipped, one open
  // hand a little forward ("go on"); slow tilts, a small nod now and then.
  listening: {
    still: c => ({ lean: c.s * .6, head: c.s * 3, lift: -2, [c.A]: 14, [c.F]: 34, brow: 'up' }),
    enter: c => { const { k, s, j, A, F } = c; return [
      [j(220), { lift: -3 * k, head: -s * 1 * k, face: 'blink1' }, 'out'],
      [j(360), { lift: -2 * k, head: s * 3 * k, lean: s * .6 * k, [A]: 14 * k, [F]: 34 * k, brow: 'up', face: 'rest' }, 'spring'],
    ]; },
    hold: c => { const { k, s, j, A, F, beat } = c, tilt = (beat % 2 ? -.8 : 1) * s * 3 * k, b = [];
      b.push([j(1400, .25), { lean: s * .6 * k, [A]: 14 * k, [F]: (34 + (beat % 2) * 6) * k, head: tilt, lift: (-2 + (beat % 2)) * k, brow: 'up' }, 'inOut']);
      if(beat % 3 === 2) b.push([j(160), { lift: 5 * k, face: 'smile1' }, 'inOut'], [j(280), { lift: -2 * k }, 'spring'], [j(260), { face: 'rest' }, 'linear']);   // a nod: "I see"
      if(beat % 2 === 1) b.push(...DR_BODY_BLINK('rest'));
      b.push([j(500, .3), {}, 'linear']);
      return b; },
  },
  // Thinking (processing): the drawn finger on the chin, eyes up and away
  // from the hand, wandering; a slow blink every other beat, a tap of the
  // finger now and then; slower once it has taken a while. The exit is the "aha".
  thinking: {
    still: c => { const T = DR_BODY.pose.think.at; return { [c.A]: T.a, [c.F]: T.f, ['a' + c.O]: T.a2, ['f' + c.O]: T.f2, [c.FR]: 'think', head: c.s * 5, face: 'lookU' + c.O, brow: 'focused' }; },
    enter: c => { const { k, s, j, A, F, O, FR } = c, T = DR_BODY.pose.think.at; return [
      [j(300), { lean: -s * 1.2 * k, head: -s * 2 * k, face: 'blink2', brow: 'focused' }, 'out'],
      [j(380), { [A]: T.a, [F]: T.f, ['a' + O]: T.a2, ['f' + O]: T.f2, head: s * 5 * k, lean: s * .8 * k, face: 'lookU' + O }, 'spring'],
      [j(140), { [FR]: 'think', frot: 0, lift: 2 * k }, 'linear'],
    ]; },
    hold: c => { const { k, s, j, A, F, O, FR, beat, since } = c, T = DR_BODY.pose.think.at;
      const faces = ['lookU' + O, 'lookU', 'lookU' + O, 'lookU'], face = faces[beat % 4], turn = [6, 4.5, 6.5, 4][beat % 4];
      const slow = performance.now() - since > 9000 ? 1.5 : 1, b = [];
      b.push([Math.round(j(1100, .3) * slow), { [A]: T.a, [F]: T.f, ['a' + O]: T.a2, ['f' + O]: T.f2, [FR]: 'think', lean: s * .8 * k, head: s * turn * k, lift: (2 + (beat % 2)) * k, face, brow: 'focused' }, 'inOut']);
      if(beat % 4 === 3) b.push([j(170), { frot: 2.4 * k }, 'inOut'], [j(170), { frot: 0 }, 'inOut']);   // the finger taps
      if(beat % 2 === 1) b.push(...DR_BODY_BLINK(face));
      b.push([Math.round(j(400, .3) * slow), {}, 'linear']);
      return b; },
    exit: c => { const { k, s, j, A, F, O, FR } = c; return [
      [j(90), { face: 'rest', brow: 'up', lift: -8 * k }, 'snap'],                        // aha
      [j(300), { [FR]: '', frot: 0, [A]: 0, [F]: 0, ['a' + O]: 0, ['f' + O]: 0, head: -s * .5 * k, lift: 4 * k, face: 'smile1', brow: 'rest' }, 'spring'],
      [j(320), { head: 0, lift: 0, lean: 0, face: 'rest' }, 'out'],
    ]; },
  },
  // Answering (reading the answer with you): the drawn clipboard in both hands
  // at his chest, eyes down on it along a line and back, the board tilting a
  // little with them, a nod now and then; a blink every third beat.
  answering: {
    still: c => { const C = DR_BODY.pose.clipboard.at; return { aL: C.a, aR: C.a2, fL: C.f, fR: C.f2, [c.FR]: 'clipboard', lift: 3, face: 'lookD', brow: 'focused' }; },
    enter: c => { const { k, s, j, FR } = c, C = DR_BODY.pose.clipboard.at; return [
      [j(200), { lift: 2 * k, face: 'blink2' }, 'out'],
      [j(380), { aL: C.a, aR: C.a2, fL: C.f, fR: C.f2, lift: 3 * k, head: s * 1.5 * k, face: 'lookD', brow: 'focused' }, 'spring'],
      [j(120), { [FR]: 'clipboard', frot: 0 }, 'linear'],
    ]; },
    hold: c => { const { k, s, j, FR, beat } = c, C = DR_BODY.pose.clipboard.at, L = s < 0 ? 'L' : 'R', O = s < 0 ? 'R' : 'L';
      const faces = ['lookD' + L, 'lookD', 'lookD' + O, 'lookD'], face = faces[beat % 4], tilt = [-1.6, 0, 1.6, 0][beat % 4], b = [];
      b.push([j(900, .3), { aL: C.a, aR: C.a2, fL: C.f, fR: C.f2, [FR]: 'clipboard', frot: s * tilt * k, lift: (3 + (beat % 4 === 1 ? 2 : 0)) * k, head: s * (1.5 + (beat % 2) * 1) * k, face, brow: 'focused' }, 'inOut']);
      if(beat % 5 === 4) b.push([j(160), { lift: 8 * k, face: 'smile1' }, 'inOut'], [j(260), { lift: 3 * k, face }, 'spring']);   // a nod: "I see"
      if(beat % 3 === 2) b.push(...DR_BODY_BLINK(face));
      b.push([j(300, .3), {}, 'linear']);
      return b; },
  },
  // Celebrating: the cheer, then a happy bob with one drawn fist pumping
  // (as drawn or mirrored), the other hand up a little, a laugh.
  celebrating: {
    still: c => { const P = DR_BODY.pose['fist-pump'].at; return { aL: P.a, aR: P.a, fL: P.f, fR: P.f, frameL: 'fist-pump', frameR: 'fist-pump', frameLegs: 'crouch', face: 'laugh', brow: 'up' }; },
    enter: c => DR_BODY_PERF.cheer(c.mode).beats.slice(0, -2),
    hold: c => { const { k, s, j, A, F, O, FR, beat } = c, P = DR_BODY.pose['fist-pump'].at, b = [];
      b.push([j(beat ? 260 : 320), { [A]: P.a, [F]: P.f, ['a' + O]: 18 * k, ['f' + O]: 28 * k, lean: -s * 1.2 * k, sy: 1 - .012 * k, sx: 1 + .006 * k, lift: 4 * k, head: s * 2 * k, face: beat % 2 ? 'laughB' : 'laugh', brow: 'up' }, beat ? 'in' : 'spring']);
      b.push([j(120), { [FR]: 'fist-pump', frot: -4 * k }, 'linear']);
      b.push([j(320), { sy: 1 + .008 * k, sx: 1 - .004 * k, lift: -2 * k, frot: 5 * k, head: -s * 1 * k, face: 'laugh' }, 'spring']);
      b.push([j(380), { sy: 1, sx: 1, lift: 0, frot: 0, head: 0 }, 'out']);
      if(beat % 3 === 2) b.push(...DR_BODY_BLINK('laugh'));
      return b; },
    exit: c => { const { j } = c; return [
      [j(380), { frameL: '', frameR: '', frameLegs: '', frot: 0, aL: 0, aR: 0, fL: 0, fR: 0, lean: 0, sy: 1, sx: 1, lift: 0, head: 0, face: 'smile', brow: 'rest' }, 'spring'],
      [j(300), { face: 'smile1' }, 'out'], [j(240), { face: 'rest' }, 'out'],
    ]; },
  },
  // Uncertain: shoulders a little up, both open hands half out, a doubtful
  // face and never a cheerful one; the head tips slowly side to side, a small
  // re-shrug now and then.
  uncertain: {
    still: c => ({ lift: -6, head: c.s * 3, aL: 15, aR: 15, fL: 60, fR: 60, face: 'doubt', brow: 'doubt' }),
    enter: c => { const { k, s, j } = c; return [
      [j(160), { face: 'blink1' }, 'in'],
      [j(320), { lift: -6 * k, head: s * 3 * k, aL: 15 * k, aR: 15 * k, fL: 60 * k, fR: 60 * k, face: 'doubt', brow: 'doubt' }, 'spring'],
    ]; },
    hold: c => { const { k, s, j, O, beat } = c, faces = ['doubt', 'rest', 'lookU' + O, 'doubt'], face = faces[beat % 4], b = [];
      b.push([j(1500, .25), { lift: -6 * k, aL: 15 * k, aR: 15 * k, fL: 60 * k, fR: 60 * k, head: (beat % 2 ? -.8 : 1) * s * 3 * k, face, brow: 'doubt' }, 'inOut']);
      if(beat % 3 === 2) b.push([j(240), { lift: -11 * k, fL: 70 * k, fR: 70 * k }, 'out'], [j(380), { lift: -6 * k, fL: 60 * k, fR: 60 * k }, 'spring']);   // a small shrug again
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
  let t1 = 0, t2 = 0, on = true, level = o.level || 'full';
  const R = drBodyRand;
  const seen = () => on && document.visibilityState === 'visible' && body.mode() !== 'still';
  const blink = () => {
    t1 = setTimeout(() => {
      if(level !== 'none' && seen() && !body.busy()) body.play([[45, { face: 'blink1' }, 'linear'], [40, { face: 'blink2' }, 'linear'], [75, { face: 'shut' }, 'linear'], [45, { face: 'blink2' }, 'linear'], [55, { face: 'blink1' }, 'linear'], [60, { face: 'rest' }, 'linear']], { name: 'blink' });
      blink();
    }, 2600 + R() * 3200);
  };
  const beat = () => {
    t2 = setTimeout(() => {
      if(level === 'full' && seen() && !body.busy()) body.perform(R() < .6 ? 'shift' : 'glance');
      else if(level === 'calm' && seen() && !body.busy() && R() < .5) body.perform('glance');
      beat();
    }, (o.every || 7000) + R() * 5000 + (level === 'calm' ? 6000 : 0));
  };
  blink(); beat();
  const stop = () => { on = false; clearTimeout(t1); clearTimeout(t2); };
  stop.setLevel = l => { level = l; };
  stop.level = () => level;
  stop.doze = () => { if(level !== 'none' && seen() && !body.busy()) return body.perform('doze'); return false; };
  return stop;
}
