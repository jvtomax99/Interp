/* Dr. Smiley's performances (DR_PERF: greet, ack, think, cheer, wink, built
   fresh each play; drSquashKeys, his mood, the effects off his head: the
   section below): moved verbatim out of index.html on 2026-10-24
   (docs/split-index.md, phase 3). Loaded by a plain <script src> just
   before index.html's own script. Nothing here runs into index.html as
   the page loads: the only top-level lines that run fill DR_PERF itself.
   One line stayed in index.html, where it was: the one that puts each
   performance into DR_FACE_SEQ (Dr. Smiley's art), a table this file
   loads before. The names used from index.html (drMode, drStill,
   drAnim...) are read when a function runs. Keep it that way. */

/* ---------- Dr. Smiley: performances ----------
   Five gestures, each built fresh every time it plays (drPerfBuild), so no
   two are quite the same: the side he leans to, how far, how long he holds
   it and how many beats a laugh has all vary a little. Each has a small
   anticipation (the opposite way first), one clear main gesture, and an
   unhurried recovery that overshoots a touch before settling. Eyes, face
   frame and lean are timed together so they read as one action.
     greet   delighted hello: a dip and a blink as he sees you, up into an
             open smile with a bright squint, a smaller counter-sway, settle
     ack     attentive "got it": a lift, one decisive nod with a closed
             smile (now and then a second, smaller "mm-hm")
     think   thoughtful: a slow blink leaning back, eyes up to one side with
             the head tilted the same way, eyes level, then a small smile
             and nod as the thought lands
     cheer   joyful: a crouch, a spring up into laughter that sways unevenly
             and dies away, a landing dip, a lingering smile
     wink    playful: a look away, back, a quick wink with the head tipped
             toward the winking eye, the grin staying a moment after
   Lively: as above. Focused: the same gestures, smaller and calmer, no
   laughter and no effects. Still: the engine shows one still frame (still)
   as it always has. Only the artwork's own frames are used, and the only
   movement is the lean and lift of what holds him (never a sideways slide),
   plus, for the cheer's and the greet's spring in Lively only, a small
   squash and stretch of his picture (drSquashKeys). The art has one wink
   (his left eye), so a wink always tips that way. Effects are short and land on the moment: a quick burst
   at the top of the cheer's spring, a glint as the wink closes, a "?" as
   the thought starts. */
let drPerfRand = Math.random;
// For the preview and tests: the same variant every time from a seed (null: random again).
function drPerfSeed(n){
  if(n == null){ drPerfRand = Math.random; return; }
  let a = n >>> 0;
  drPerfRand = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// A sequence from beats: each beat is [frames, ms it lasts, head key at its
// end ([tilt, lift]) or null, and optionally a brow pose held from its start
// (null: the brows follow the frames again)]. The head keys land where the
// beats do, so a change of frame and the lean it goes with arrive together.
function drPerfMake(beats, extra){
  const f = [], head = [[0, 0, 0]], brow = [];
  let t = 0;
  beats.forEach(([frames, ms, key, bp]) => {
    if(bp !== undefined) brow.push([Math.round(t), bp]);
    const per = frames.length ? frames : [];
    if(per.length){
      const each = per.map(x => Array.isArray(x) ? x : [x, 0]);
      const fixed = each.reduce((s, x) => s + x[1], 0), free = each.filter(x => !x[1]).length;
      each.forEach(([fr, d]) => f.push([fr, Math.round(d || Math.max(30, (ms - fixed) / Math.max(1, free)))]));
    }
    t += ms;
    if(key) head.push([Math.round(t), +key[0].toFixed(2), +key[1].toFixed(2)]);
  });
  const last = head[head.length - 1];
  if(last[1] || last[2]) head.push([Math.round(t) + 260, 0, 0]);
  return Object.assign({ f, head }, brow.length ? { brow } : {}, extra || {});
}
/* Squash and stretch, worked out from a sequence's head keys (lift: + is
   down). A spring up stretches him on the way (tall and narrow), the top is
   his drawn shape, a crouch or a landing squashes him (short and wide). His
   volume stays the same, as for a round body (width 1/sqrt(height), the
   usual rule), and he scales from his shoulders. k is the most it changes
   his height: DR_SQUASH, Jose's pick of 0 / 4% / 9% from a preview (E3, 2026-10-19). */
const DR_SQUASH = .04, DR_SQUASH_AT = '50% 90%';
function drSquashKeys(keys, k){
  const T = keys[keys.length - 1][0];
  if(!k || !(T > 0)) return null;
  const c = x => Math.max(0, Math.min(1, x));
  const at = (offset, sy, easing) => Object.assign({ offset, transform: `scale(${(1 / Math.sqrt(sy)).toFixed(4)},${sy.toFixed(4)})`, transformOrigin: DR_SQUASH_AT }, easing ? { easing } : {});
  const kf = [at(0, 1, 'cubic-bezier(.3,0,.3,1)')];
  let moved = false;
  for(let i = 1; i < keys.length; i++){
    const [t0, , y0] = keys[i - 1], [t1, , y1] = keys[i], yn = i + 1 < keys.length ? keys[i + 1][2] : y1;
    const rise = y0 - y1;
    if(rise > .9){ kf.push(at((t0 + (t1 - t0) * .45) / T, 1 + k * c(rise / 2.6), 'cubic-bezier(.3,0,.4,1)')); moved = true; }
    const depth = y1 - Math.min(y0, yn), low = y1 > .3 && y1 >= y0 && y1 >= yn && depth > .7;
    if(low) moved = true;
    kf.push(at(t1 / T, low ? 1 - k * c(depth / 2.2) : 1, 'cubic-bezier(.3,0,.3,1)'));
  }
  kf[kf.length - 1] = at(1, 1);
  return moved ? kf : null;
}
const DR_PERF = {
  greet(){
    const R = drPerfRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), side = R() < .5 ? -1 : 1;
    if(drMode() === 'focused') return drPerfMake([
      [['blink1', 'blink2', 'blink1'], j(150), [-side * .2, .35]],
      [['smile1'], j(170), [side * .5, -.5]],
      [['smile2'], j(950), [side * .6, -.55]],
      [['smile1'], j(240), [0, .1]],
      [['rest'], j(360), [0, 0]],
    ], { still: 'smile', stillMs: 1000 });
    const tilt = side * (1.9 + R() * .9), up = -(1.3 + R() * .5);
    return drPerfMake([
      // Anticipation: a dip and a blink -- he's just seen you.
      [['blink1', 'blink2', 'blink1'], j(170, .2), [-side * .5, .75]],
      // Up into the smile, leaning to one side, with an eyebrow flash:
      // the quick up-and-down people give someone they're glad to see.
      [['smile1', 'smile2'], j(150), [tilt * .7, up * .7], 'up'],
      [['smile'], j(160), [tilt, up]],
      // The delight: a bright squint for a moment, then the smile again,
      // with a smaller sway back (follow-through, not a repeat).
      [['laugh1'], j(190, .25), [-tilt * .35, up * .8], null],
      [['smile'], j(560, .2), [tilt * .3, up * .6]],
      // Recovery: the smile lingers as he comes down, a small settle past upright.
      [['smile2'], j(110), [0, .3]],
      [['smile1'], j(240), [-side * .25, .1]],
      [['rest'], j(380), [0, 0]],
    ], { still: 'smile', stillMs: 1000, squash: DR_SQUASH });
  },
  ack(){
    const R = drPerfRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), side = R() < .5 ? -1 : 1;
    const k = drMode() === 'focused' ? .6 : 1, again = drMode() !== 'focused' && R() < .35;
    return drPerfMake([
      // Anticipation: a small lift, eyes on you.
      [['rest'], j(110), [side * .2 * k, -.45 * k]],
      // The nod: down with a smile, eyes lowering at the bottom. Lively
      // opens it a little (smile2) so it reads at dock size; Focused keeps
      // it closed.
      [['smile1'], j(170), [side * .7 * k, 1.3 * k]],
      [['blink1', [drMode() === 'focused' ? 'smile1' : 'smile2', 0]], j(240), [side * .4 * k, .2 * k]],
      ...(again ? [[['smile1'], j(150), [side * .3, .55]], [['smile1'], j(170), [0, -.15]]] : []),
      // Recovery: back up a hair past upright, the smile fading.
      [['smile1'], j(260), [0, -.2 * k]],
      [['rest'], j(320), [0, 0]],
    ], { still: 'smile1', stillMs: 700 });
  },
  think(){
    const R = drPerfRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), side = R() < .5 ? -1 : 1;
    const calm = drMode() === 'focused', k = calm ? .6 : 1, L = side < 0 ? 'L' : 'R';
    return drPerfMake([
      // Anticipation: leaning back a little, the other way, with a slow
      // blink and the brows drawn together.
      [[['blink1', 60], ['blink2', 60], ['shut', 90], ['blink2', 55], ['blink1', 55]], 320, [-side * .5 * k, -.35 * k], 'focused'],
      // The thought: eyes up to one side, head tilted the same way (the
      // frame raises the far brow: quizzical).
      [['look' + 'U' + L], j(calm ? 700 : 950, .2), [side * 2.3 * k, -.3 * k], null],
      [['look' + 'U' + L], j(320), [side * 2.6 * k, -.2 * k]],
      // Eyes come level, still to that side: getting there.
      [['half' + L], j(360), [side * 1.2 * k, 0]],
      // It lands: eyes back to you with an "aha" lift of the brows, a small
      // smile and a small nod.
      [['rest'], 70, null, 'up'],
      [['smile1'], j(260), [-side * .3 * k, .6 * k], null],
      [['smile1'], j(260), [0, 0]],
      [['rest'], j(320), [0, 0]],
    ], { fx: calm ? null : 'question', fxAt: 420, still: 'look' + 'U' + L, stillMs: 1200 });
  },
  cheer(){
    const R = drPerfRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), side = R() < .5 ? -1 : 1;
    if(drMode() === 'focused') return drPerfMake([
      [['smile1'], j(160), [-side * .2, .4]],
      [['smile2'], j(150), [side * .5, -.6]],
      [['smile'], j(900), [side * .6, -.8]],
      [['smile2'], j(120), [0, -.2]],
      [['smile1'], j(200), [0, 0]],
      [['rest'], j(340), [0, 0]],
    ], { still: 'smile', stillMs: 1000 });
    const up = -(1.8 + R() * .5), a = side * (1.4 + R() * .6);
    // Laughter: two or three uneven "ha"s, each sway smaller than the last.
    const has = 2 + (R() < .5 ? 1 : 0), ha = [];
    for(let i = 0; i < has; i++){
      const d = 1 - i / (has + .5), s = i % 2 ? 1 : -1;
      ha.push([['laughB'], j(105, .3), [-a * s * .75 * d, up * (.85 - i * .08)]]);
      ha.push([['laugh'], j(130 + i * 35, .3), [a * s * .45 * d, up * (.8 - i * .1)]]);
    }
    return drPerfMake([
      // Anticipation: a crouch, the smile starting, leaning away.
      [['smile1', 'smile2'], j(190), [-side * .5, 1.1]],
      // The spring: up into the laugh.
      [['smile', 'laugh1'], j(150), [a * .8, up]],
      [['laugh'], j(170), [a, up]],
      ...ha,
      // Recovery: a landing dip as it subsides, a smile that lingers.
      [['laugh2', 'laugh1'], j(160), [0, .45]],
      [['smile'], j(360, .2), [side * .2, -.15]],
      [['smile2', 'smile1'], j(230), [0, 0]],
      [['rest'], j(360), [0, 0]],
    ], { fx: 'burst', fxAt: 360, still: 'smile', stillMs: 1000, squash: DR_SQUASH });
  },
  wink(){
    const R = drPerfRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14)));
    const calm = drMode() === 'focused', k = calm ? .5 : 1, look = !calm && R() < .6;
    return drPerfMake([
      // Anticipation: a sideways look away (or a small smile), leaning away.
      look ? [['halfL'], j(260, .25), [-.8, 0]] : [['smile1'], j(200), [-.6 * k, .2 * k]],
      [['rest'], 60, null],
      // The wink: quick to close, the head tipping toward the winking eye
      // (his left, your right), a small lift.
      [[['wink1', 35], ['wink2', 35], ['wink', 0]], j(calm ? 320 : 430, .2), [(2.2 + R() * .8) * k, -.6 * k]],
      // Recovery: opens slower than it closed, the grin stays a moment,
      // a small swing back past upright.
      [[['wink2', 60], ['wink1', 70], ['smile1', 0]], j(380), [-.45 * k, 0]],
      [['rest'], j(340), [0, 0]],
    ], { fx: calm ? null : 'glint', fxAt: (look ? 330 : 270), still: 'wink', stillMs: 800 });
  },
};
/* Quiz answers (F1, Jose's film brief, 2026-10-19): a happy bounce on a
   right one, a small wince on a wrong one. Short (under a second and a
   half) because they play on every answer; the 3/5/10 streaks and the
   session's end keep their bigger reactions (smileyStudy). */
DR_PERF.bounce = function(){
  const R = drPerfRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), side = R() < .5 ? -1 : 1;
  const k = drMode() === 'focused' ? .5 : 1, up = -(2.3 + R() * .5) * k;
  return drPerfMake([
    // Anticipation: a quick crouch as the smile starts.
    [['smile1'], j(120), [-side * .2 * k, 1.2 * k]],
    // The bounce: up, a little lean, a bright smile and a brow flash.
    [['smile2'], j(130), [side * .6 * k, up], k < 1 ? null : 'up'],
    [['smile'], j(200), [side * .8 * k, up * .9], null],
    // A smaller second hop: follow-through, not a repeat.
    [['smile'], j(120), [side * .2 * k, .35 * k]],
    [['smile'], j(130), [-side * .2 * k, up * .4]],
    // Landing: a small settle past upright, the smile lingering.
    [['smile2', 'smile1'], j(200), [0, .2 * k]],
    [['rest'], j(300), [0, 0]],
  ], { still: 'smile', stillMs: 700 });
};
DR_PERF.wince = function(){
  const R = drPerfRand, j = (ms, k) => Math.round(ms * (1 + (R() * 2 - 1) * (k || .14))), side = R() < .5 ? -1 : 1;
  const k = drMode() === 'focused' ? .5 : 1;
  return drPerfMake([
    // The flinch: a fast blink, drawn back and a little down, turned away.
    [['blink1', 'blink2'], 90, [-side * .9 * k, .9 * k]],
    [['worried'], j(650), [-side * 1.4 * k, 1.2 * k], 'worried'],
    // Then back to you, caring: it's fine, keep going.
    [['halfL'], j(200), [-side * .4 * k, .3 * k], 'caring'],
    [['smile1'], j(380), [side * .2 * k, 0]],
    [['rest'], j(300), [0, 0], null],
  ], { still: 'worried', stillMs: 600 });
};
/* A streak-day milestone (E4, 2026-10-20): a take first (a blink, eyes
   wide on the drawn surprised face, brows up, pulled back), held a second
   so it reads, then the cheer. Focused: just its calmer cheer. */
DR_PERF.wow = function(){
  const c = DR_PERF.cheer();
  if(drMode() === 'focused') return c;
  const T = 1100;
  return Object.assign({}, c, {
    f: [['blink1', 40], ['surprised', 900], ['rest', 160]].concat(c.f),
    head: [[0, 0, 0], [40, 0, .4], [160, 0, -1.4], [940, -.4, -1.1], [T, 0, 0]].concat(c.head.slice(1).map(([t, r, y]) => [t + T, r, y])),
    brow: [[40, 'up'], [T, null]].concat((c.brow || []).map(([t, p]) => [t + T, p])),
    fxAt: (c.fxAt || 0) + T,
  });
};
DR_PERF.celebrate = DR_PERF.cheer;   // the older name, used for study results and the team's rank
function drPerfBuild(name){ return DR_PERF[name] ? DR_PERF[name]() : null; }
/* His mood carries over for a few minutes: good moments (hearts, a new
   term, a level, a pet) make him happier -- more smiles, laughs, hums, heart
   eyes -- and a wrong answer makes him thoughtful for a minute. */
const drMood = { kind: '', until: 0 };
function drSetMood(kind, ms){ drMood.kind = kind; drMood.until = performance.now() + ms; }
function drMoodNow(){ return performance.now() < drMood.until ? drMood.kind : ''; }
/* Small effects that float off his head for a moment: hearts, a heart, music
   notes, sparkles, a question mark. They go in the element that holds his
   lean (his pin on Home, the dock button), so they sit beside him without
   tilting with him, and remove themselves. Nothing with reduced motion. */
const DR_FX_GLYPH = {
  heart: '<svg viewBox="0 0 24 22"><path d="M12 21C6 16.6 1.5 12.8 1.5 7.6A5.6 5.6 0 0 1 12 4.6a5.6 5.6 0 0 1 10.5 3c0 5.2-4.5 9-10.5 13.4Z" fill="#E5484D"/><path d="M6.4 5.2c1.3-.4 2.6.1 3.3 1" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.6" stroke-linecap="round"/></svg>',
  note:  '<svg viewBox="0 0 20 24"><path d="M8 18.5V4l9-2.5v13" fill="none" stroke="#252E6D" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="5.2" cy="18.8" rx="3.8" ry="3" fill="#252E6D"/><ellipse cx="14.2" cy="15.6" rx="3.8" ry="3" fill="#252E6D"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 1.5c.7 4.9 2.6 8.8 10.5 10.5-7.9 1.7-9.8 5.6-10.5 10.5-.7-4.9-2.6-8.8-10.5-10.5C9.4 10.3 11.3 6.4 12 1.5Z" fill="#F5B83D"/></svg>',
  q:     '<svg viewBox="0 0 26 26"><circle cx="13" cy="13" r="12" fill="#fff"/><circle cx="13" cy="13" r="11.2" fill="none" stroke="#252E6D" stroke-opacity=".18" stroke-width="1.2"/><path d="M9.6 9.8a3.6 3.6 0 1 1 5.2 3.2c-1.1.6-1.8 1.3-1.8 2.6" fill="none" stroke="#252E6D" stroke-width="2.4" stroke-linecap="round"/><circle cx="13" cy="19.4" r="1.5" fill="#252E6D"/></svg>',
};
const DR_FX = { hearts: ['heart', 'heart', 'heart'], heart: ['heart'], notes: ['note', 'note', 'note'], sparkle: ['spark', 'spark', 'spark'], question: ['q'],
  burst: ['spark', 'spark', 'spark'], glint: ['spark'] };
// How long each stays (the CSS animation's length, and a little more).
const DR_FX_LIFE = { burst: 1100, glint: 750, question: 1700 };
function drFaceFx(head, kind){
  const host = head && head.parentElement, glyphs = DR_FX[kind];
  if(!host || !glyphs || drStill()) return null;
  const fx = document.createElement('span');
  fx.className = 'ds-fx ds-fx-' + kind;
  fx.setAttribute('aria-hidden', 'true');
  fx.innerHTML = glyphs.map((g, i) => `<span class="ds-fx-g" style="--i:${i}">${DR_FX_GLYPH[g]}</span>`).join('');
  host.appendChild(fx);
  setTimeout(() => fx.remove(), DR_FX_LIFE[kind] || 2800);
  return fx;
}
