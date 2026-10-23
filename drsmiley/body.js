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
    body: [353, 578, 378, 489],
    'arm-upper-l': [284, 602, 133, 248], 'arm-fore-l': [233, 736, 165, 328],
    'arm-upper-r': [685, 611, 114, 236], 'arm-fore-r': [691, 739, 151, 327],
    'leg-l': [288, 990, 248, 427], 'leg-r': [554, 990, 241, 427],
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
    wave:        { box: [133, 357, 264, 370], arms: ['L'], layer: 'back', at: { a: 100, f: 80 }, pivot: [190, 600] },
    'fist-pump': { box: [121, 361, 276, 348], arms: ['L'], layer: 'back', at: { a: 110, f: 100 }, pivot: [353, 630] },
    think:       { box: [352, 497, 274, 445], arms: ['L', 'R'], layer: 'front', at: { a: 18, f: 128, a2: 10, f2: 60 }, pivot: [353, 630] },
    shrug:       { box: [95, 568, 892, 398], arms: ['L', 'R'], layer: 'back', at: { a: 28, f: 95, a2: 28, f2: 95 }, pivot: [556, 630] },
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
  let run = null, raf = 0, last = 'rest';

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
     the one before (the live pose for the first, so an interruption blends). */
  function play(beats, o){
    o = o || {};
    stop();
    if(mode() === 'still'){
      if(o.still){ set(Object.assign({}, DR_BODY_REST, o.still)); run = { still: true, timer: setTimeout(() => { run = null; set(DR_BODY_REST); if(o.done) o.done(); }, o.stillMs || 900) }; }
      else if(o.done) o.done();
      return true;
    }
    const start = Object.assign({}, pose);
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
      else { const d = run.done; run = null; raf = 0; svg.classList.remove('db-acting'); set(DR_BODY_REST); if(d) d(); }
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
  draw(pose);
  return { el, pose, set, play, perform, stop, setFace, setBrow, setFrames, mode, busy: () => !!run, rest: () => set(DR_BODY_REST) };
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
  // A right answer: a happy hop, arms up a little, a smaller second hop.
  bounce(mode){
    const R = drBodyRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), k = mode === 'focused' ? .5 : 1, jump = mode === 'focused' ? 0 : 1;
    return { beats: [
      [j(150), { frameLegs: 'crouch', sy: 1 - .035 * k, sx: 1 + .017 * k, lift: 5 * k, face: 'smile1' }, 'in'],                              // the drawn crouch
      [j(230), { frameLegs: jump ? 'jump' : 'crouch', sy: 1 + .035 * k, sx: 1 - .017 * k, y: -34 * jump, aL: 50 * k, aR: 50 * k, fL: 30 * k, fR: 30 * k, lift: -4 * k, face: 'smile', brow: 'up' }, 'snap'],   // the drawn jump
      [j(170), { frameLegs: 'crouch', y: 0, sy: 1 - .03 * k, sx: 1 + .015 * k, lift: 6 * k, aL: 35 * k, aR: 35 * k }, 'in'],
      [j(200), { sy: 1 + .015 * k, sx: 1 - .007 * k, y: -22 * jump, lift: -2 * k, aL: 42 * k, aR: 42 * k, face: 'laughB' }, 'snap'],         // a smaller second hop, knees still bent
      [j(160), { y: 0, sy: 1 - .015 * k, sx: 1 + .007 * k, lift: 3 * k }, 'in'],
      [j(340), { frameLegs: '', sy: 1, sx: 1, lift: 0, aL: 0, aR: 0, fL: 0, fR: 0, face: 'smile', brow: 'rest' }, 'spring'],
      [j(280), { face: 'rest' }, 'out'],
    ], still: { aL: 50, aR: 50, fL: 30, fR: 30, frameLegs: 'crouch', face: 'smile', brow: 'up' }, stillMs: 800 };
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

/* Idle life: blinks every few seconds, and now and then a shift of weight or
   a glance, only while the page is seen and nothing else plays. Lively and
   Focused; Still and reduced motion get nothing. Returns stop(). */
function drBodyIdle(body, o){
  o = o || {};
  let t1 = 0, t2 = 0, on = true;
  const R = drBodyRand;
  const seen = () => on && document.visibilityState === 'visible' && body.mode() !== 'still';
  const blink = () => {
    t1 = setTimeout(() => {
      if(seen() && !body.busy()) body.play([[45, { face: 'blink1' }, 'linear'], [40, { face: 'blink2' }, 'linear'], [75, { face: 'shut' }, 'linear'], [45, { face: 'blink2' }, 'linear'], [55, { face: 'blink1' }, 'linear'], [60, { face: 'rest' }, 'linear']], { name: 'blink' });
      blink();
    }, 2600 + R() * 3200);
  };
  const beat = () => {
    t2 = setTimeout(() => {
      if(seen() && !body.busy()) body.perform(R() < .6 ? 'shift' : 'glance');
      beat();
    }, (o.every || 7000) + R() * 5000);
  };
  blink(); beat();
  return () => { on = false; clearTimeout(t1); clearTimeout(t2); };
}
