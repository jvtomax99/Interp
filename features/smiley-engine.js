/* Dr. Smiley's engine: his art (drSmileyArt, DR_FACE_SEQ), the animation
   engine (DrAnim, drAnim, drFacePlay, drFaceIdle, drFaceTalk), how lively
   he is (drMode, drStill, setSmileyMode) and what he's doing (drTask,
   drMind, drPerform). Moved verbatim out of index.html on 2026-10-25
   (docs/split-index.md, phase 3; docs/features/dr-smiley.md), but for the
   comment over the DR_PERF line, rewritten because that line moved too.
   Loaded by a plain <script src> after features/smiley-performances.js
   (DR_PERF, read below as this file loads) and before index.html's own
   script. What runs at load reads only this file's names and DR_PERF
   (checked in a bare sandbox): DR_FACE_SEQ's performances, the
   visibilitychange listener, the ds-still class. Three listeners stay in
   index.html where this group began, since what they call reaches
   index.html (smileyModeSync, apptActive): drReduce's change, offline and
   online. Keep it that way: a top-level line here that calls into
   index.html would run before index.html has. */

/* ---------- Dr. Smiley's art ---------- */
/* Dr. Smiley: the cartoon doctor from Jose's character sheet, head and
   shoulders, cut out from Jose's drawn calm face. Every Dr. Smiley in the app -- the greeting, the dock, Ask the
   Hub, the lock screen, the top bar -- is drSmileyArt() in the old smiley's
   box (viewBox 4 4 112 112), so the sizes and places around him didn't
   change. He hangs below the box like the old coat did, so each copy keeps
   overflow:visible. His neck sits on the box's centre line (x 60), under the
   Home "Ask" tag; on Home his lanyard is live cords drawn by home-polish.js.

   His face moves frame by frame. drsmiley/base.webp is his calm picture;
   drsmiley/face.webp is a strip of 30 frames of the part that moves (eyes and
   mouth), every frame built on that same calm face, so his hair, outline,
   nose and shoulders never shift: only lids come down, eyes look and lips
   part. Most frames are cut from Jose's drawn expression sheets and fitted
   onto this face (one fit per eye and one for the mouth, the same for every
   frame). The frame shows through a small window (.ds-face) over the base; a
   frame change moves the strip, outright, never a fade between two faces.
   Frames: rest; blink1/blink2 (upper lids at about a third and two thirds),
   shut; wink1/wink2/wink (his left eye); smile1/smile2 (lips parting, cheeks
   lifting), smile; laugh1/laugh2 (eyes squeezing, mouth widening),
   laugh/laughB (the laugh mouth open and a little less open, for "ha-ha");
   lookL/lookR (eyes to the viewer's left/right); love (heart eyes); sleep;
   then eight gazes made from rest by moving the irises inside the drawn
   eye openings (whites taken from the drawn glances): halfL/halfR (a little
   to the side), lookU/lookD, and the diagonals lookUL/lookUR/lookDL/lookDR;
   then four drawn by Jose in 2026-10 from this same face (source and how
   they were cut: docs/art/dr-smiley-faces/): surprised (eyes wide, an "O"
   mouth), sad (heavy lids, corners down), worried (eyes aside, a tight
   wavy mouth) and doubt (his left eye squinted, a side smirk).
   In picture units (240 x 300 base) the window is x 40, y 106, 151 x 111; the
   strip is see-through except where frames change, so the picture's own
   edge shows wherever the window crosses his outline.

   His brows are their own pictures (drsmiley/brow-l.webp, brow-r.webp), cut
   out of that same calm face and drawn over the window; the forehead behind
   them in base.webp, and the few frames that reached up to them, were
   repainted as skin. They move smoothly (a lift and a tilt, never a stretch)
   while the eyes and mouth step through frames: see DR_BROWS. */
const DR_FACE_FRAMES = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh', 'laughB', 'lookL', 'lookR', 'love', 'sleep',
  'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR', 'surprised', 'sad', 'worried', 'doubt'];
const DR_FACE_W = 151, DR_FACE_H = 111;
function drSmileyArt(cls){
  return `<svg class="ds-art${cls ? ' ' + cls : ''}" viewBox="4 4 112 112" aria-hidden="true" focusable="false">`
    + '<image class="ds-base" href="./drsmiley/base.webp" x="14" y=".8" width="106" height="132.5" preserveAspectRatio="none"/>'
    + `<svg class="ds-face" x="31.667" y="47.617" width="66.692" height="49.025" viewBox="0 0 ${DR_FACE_W} ${DR_FACE_H}" preserveAspectRatio="none">`
    +   `<image class="ds-sheet" href="./drsmiley/face.webp" x="0" y="0" width="${DR_FACE_W * DR_FACE_FRAMES.length}" height="${DR_FACE_H}" preserveAspectRatio="none"/></svg>`
    + '<image class="ds-brow ds-brow-l" href="./drsmiley/brow-l.webp" x="33.875" y="39.446" width="28.708" height="14.354" preserveAspectRatio="none"/>'
    + '<image class="ds-brow ds-brow-r" href="./drsmiley/brow-r.webp" x="73.625" y="42.758" width="27.604" height="19.875" preserveAspectRatio="none"/>'
    + '</svg>';
}
const ICON_WAVE = drSmileyArt('home-wave-art home-face');
/* His expressions, each with a lead-in, a short peak and a slower way back.
   f: [frame, ms]. head (optional): [ms from the start, tilt in degrees,
   lift in % of his height] for the part that holds him (his pin on Home, his
   circle in the dock): a lean of a degree or two, never a bounce or a scale. */
const DR_FACE_SEQ = {
  blink: { f: [['blink1', 45], ['blink2', 40], ['shut', 75], ['blink2', 45], ['blink1', 60]] },
  smile: { f: [['rest', 110], ['smile1', 70], ['smile2', 70], ['smile', 1150], ['smile2', 90], ['smile1', 120], ['rest', 380]],
           head: [[0, 0, 0], [110, 0, .5], [250, .8, -.8], [1400, .6, -.6], [1610, 0, 0], [1990, 0, 0]] },
  laugh: { f: [['rest', 90], ['smile1', 60], ['smile2', 60], ['smile', 120], ['laugh1', 55], ['laugh2', 55], ['laugh', 130], ['laughB', 110],
               ['laugh', 120], ['laughB', 110], ['laugh', 170], ['laugh2', 80], ['laugh1', 90], ['smile', 320], ['smile2', 90], ['smile1', 110], ['rest', 420]],
           head: [[0, 0, 0], [90, -.8, .6], [385, -1.4, .9], [515, 1.6, -.6], [625, -1.2, -.4], [745, 1.3, -.6], [855, -.8, -.4], [1025, .6, -.3],
                  [1195, 0, -.2], [1515, 0, -.1], [1715, 0, 0], [2135, 0, 0]] },
  // A look to one side (eyes first, the head follows a degree), then a blink on the way back.
  glanceL: { f: [['rest', 120], ['lookL', 950], ['rest', 110], ['blink1', 45], ['blink2', 40], ['shut', 55], ['blink2', 45], ['blink1', 50], ['rest', 300]],
             head: [[0, 0, 0], [180, -1.2, 0], [1070, -1.2, 0], [1400, 0, 0], [1715, 0, 0]] },
  glanceR: { f: [['rest', 120], ['lookR', 950], ['rest', 110], ['blink1', 45], ['blink2', 40], ['shut', 55], ['blink2', 45], ['blink1', 50], ['rest', 300]],
             head: [[0, 0, 0], [180, 1.2, 0], [1070, 1.2, 0], [1400, 0, 0], [1715, 0, 0]] },
  love:  { f: [['rest', 100], ['smile1', 70], ['smile2', 80], ['love', 1300], ['smile2', 100], ['smile1', 110], ['rest', 380]],
           head: [[0, 0, 0], [100, 0, .5], [250, -.8, -.8], [1550, -.6, -.6], [1760, 0, 0], [2140, 0, 0]], fx: 'hearts', fxAt: 250 },
  doze:  { f: [['blink1', 160], ['blink2', 240], ['shut', 400], ['sleep', 2300], ['shut', 220], ['blink2', 160], ['blink1', 140], ['rest', 300]],
           head: [[0, 0, 0], [800, 4, .6], [3100, 4.5, .8], [3920, 0, 0]] },
  /* Built from the same frames, with the lean doing more of the talking and,
     for some, a small effect floating off his head (fx, drFaceFx). */
  // "Yes": two small dips of the head with a smile.
  nod:   { f: [['smile1', 80], ['smile2', 80], ['smile', 900], ['smile2', 90], ['smile1', 100], ['rest', 300]],
           head: [[0, 0, 0], [160, 0, 1.1], [330, 0, -.2], [520, 0, 1.1], [700, 0, -.1], [900, 0, 0], [1550, 0, 0]] },
  // A quick, short laugh with little shakes.
  giggle: { f: [['rest', 60], ['smile1', 60], ['smile2', 60], ['laughB', 110], ['laugh', 110], ['laughB', 110], ['laugh', 110], ['laughB', 110], ['smile', 340], ['smile2', 90], ['smile1', 100], ['rest', 340]],
            head: [[0, 0, 0], [90, 0, .45], [180, -1.1, .3], [290, 1.1, .3], [400, -1.1, .3], [510, 1.1, .3], [620, -.8, .2], [730, .6, .1], [1080, 0, 0], [1600, 0, 0]] },
  // Pleased with himself: a big smile, chin up.
  proud: { f: [['rest', 70], ['smile1', 80], ['smile2', 80], ['smile', 1400], ['smile2', 90], ['smile1', 110], ['rest', 340]],
           head: [[0, 0, 0], [90, -.3, .4], [260, 1, -.9], [1630, 1, -.9], [1880, 0, 0], [2170, 0, 0]], fx: 'sparkle', fxAt: 270 },
  // Humming: lips moving to a beat, swaying.
  sing:  { f: [['smile1', 160], ['smile2', 230], ['smile1', 190], ['smile2', 230], ['smile1', 190], ['smile2', 230], ['smile1', 170], ['rest', 320]],
           head: [[0, 0, 0], [390, -2, 0], [810, 2, 0], [1230, -2, 0], [1600, 1, 0], [1720, 0, 0], [1720, 0, 0]], fx: 'notes', fxAt: 150 },
  // A wink and a heart floating off.
  kiss:  { f: [['rest', 160], ['wink1', 50], ['wink2', 45], ['wink', 520], ['wink2', 55], ['wink1', 75], ['smile1', 90], ['smile', 420], ['smile1', 100], ['rest', 340]],
           head: [[0, 0, 0], [160, -1.6, 0], [260, -2.4, -.4], [780, -2.2, -.4], [920, .4, 0], [1855, 0, 0]], fx: 'heart', fxAt: 300 },
  // Looking around: one side, the other, back.
  around: { f: [['rest', 120], ['lookL', 760], ['rest', 140], ['lookR', 760], ['rest', 120], ['blink1', 45], ['blink2', 40], ['shut', 55], ['blink2', 45], ['blink1', 50], ['rest', 300]],
            head: [[0, 0, 0], [200, -1.5, 0], [880, -1.5, 0], [1100, 1.5, 0], [1780, 1.5, 0], [2000, 0, 0], [2435, 0, 0]] },
  // He notices something you did: his eyes go to that side for a moment.
  peekL: { f: [['lookL', 650], ['rest', 200]], head: [[0, 0, 0], [120, -1.2, 0], [650, -1.2, 0], [850, 0, 0]] },
  peekR: { f: [['lookR', 650], ['rest', 200]], head: [[0, 0, 0], [120, 1.2, 0], [650, 1.2, 0], [850, 0, 0]] },
  // A new chat message: a look to it, then a smile.
  notice: { f: [['rest', 60], ['blink1', 50], ['rest', 40], ['lookR', 560], ['rest', 90], ['smile1', 70], ['smile2', 70], ['smile', 800], ['smile2', 90], ['smile1', 110], ['rest', 340]],
            head: [[0, 0, 0], [90, -.4, .3], [260, 1.4, 0], [710, 1.4, 0], [870, 0, -.6], [1670, 0, -.5], [1930, 0, 0], [2280, 0, 0]] },
  // Pressed and held: a giggle and hearts.
  // A startled take first (a blink, eyes and brows up, the head pulled
  // back), then the giggle: the beat that makes a cartoon reaction read.
  pet:   { f: [['blink1', 40], ['surprised', 600], ['rest', 50], ['smile1', 60], ['smile2', 60], ['laughB', 110], ['laugh', 110], ['laughB', 110], ['laugh', 110], ['laughB', 110], ['laugh', 160], ['smile', 440], ['smile2', 90], ['smile1', 100], ['rest', 340]],
           brow: [[40, 'up'], [670, null]],
           head: [[0, 0, 0], [40, 0, .4], [150, 0, -1.5], [640, 0, -1.2], [730, 0, .45], [820, -1.4, .3], [930, 1.4, .3], [1040, -1.4, .3], [1150, 1.4, .3], [1260, -1, .2], [1370, .8, .1], [1800, 0, -.4], [2260, 0, 0], [2520, 0, 0]], fx: 'hearts', fxAt: 820 },
  // Surprised: a blink, eyes wide, an "O" mouth and brows up with the head
  // pulled back, a beat held, then it softens into a smile.
  surprise: { f: [['blink1', 40], ['blink2', 35], ['blink1', 35], ['surprised', 1000], ['rest', 160], ['smile1', 380], ['rest', 300]],
              brow: [[110, 'up'], [1250, 'glad'], [1650, null]],
              head: [[0, 0, 0], [110, 0, .5], [240, 0, -1.6], [1210, -.6, -1.2], [1450, 0, -.3], [1850, 0, 0]] },
  // Worried: eyes away, a tight wavy mouth and the brows turned up in the
  // middle, a tilt; then he looks back to you with a small reassuring smile.
  worry: { f: [['rest', 60], ['blink1', 50], ['blink2', 45], ['blink1', 50], ['worried', 1100], ['halfL', 400], ['rest', 200], ['smile1', 500], ['rest', 300]],
           brow: [[100, 'worried'], [1750, 'caring'], [2500, null]],
           head: [[0, 0, 0], [200, -2, .4], [1700, -2.2, .5], [2000, -.8, .1], [2800, 0, 0]] },
  /* For his task states (drTask). Each has a small wind-up, a peak you can
     read and an unhurried way back. */
  // Attentive: you tapped into Ask's box. A quick blink, a look down to it
  // and a small lean in.
  listen: { f: [['rest', 40], ['blink1', 45], ['blink2', 40], ['blink1', 45], ['rest', 60], ['lookD', 720], ['rest', 260]],
            head: [[0, 0, 0], [110, 0, -.35], [300, 0, .7], [1010, 0, .6], [1300, 0, 0]] },
  // Still attentive: typing again after a pause. Just the eyes, briefly.
  peekDown: { f: [['lookD', 480], ['rest', 160]], head: [[0, 0, 0], [130, 0, .4], [480, 0, .4], [640, 0, 0]] },
  // Processing starts: a slight lean the other way, a blink, then eyes up
  // and to the side, where the thinking hold carries on.
  ponder: { f: [['rest', 60], ['blink1', 45], ['blink2', 40], ['blink1', 45], ['rest', 50], ['lookUL', 900]],
            head: [[0, 0, 0], [120, .6, .2], [360, -1.5, -.3], [1240, -1.5, -.3]] },
  // An answer from the Hub: got it -- a lift, a smile and a nod -- then he reads it with you.
  answer: { f: [['rest', 50], ['blink1', 45], ['rest', 40], ['smile1', 80], ['smile2', 80], ['smile', 760], ['smile2', 90], ['smile1', 110], ['rest', 220]],
            head: [[0, 0, 0], [100, 0, -.45], [330, 0, .9], [520, 0, -.1], [700, 0, .7], [900, 0, 0], [1525, 0, 0]] },
  // An answer from general knowledge: received, considered -- a doubtful
  // squint and one brow up (check it), no smile.
  answerGeneral: { f: [['rest', 50], ['blink1', 45], ['blink2', 40], ['blink1', 45], ['rest', 80], ['doubt', 1000], ['rest', 240]],
                   brow: [[260, 'doubt'], [1340, null]],
                   head: [[0, 0, 0], [100, .4, 0], [320, -1.1, .2], [1340, -1.1, .2], [1600, 0, 0]] },
  // Uncertain or failed: composed. A slow blink, a moment of sad (the one
  // place the sad face is used, so it stays rare), a look to the side with
  // a sympathetic tilt, then a small reassuring smile.
  composed: { f: [['rest', 60], ['blink1', 60], ['blink2', 60], ['shut', 140], ['blink2', 60], ['blink1', 70], ['rest', 180], ['sad', 1000], ['halfL', 90], ['rest', 220], ['smile1', 520], ['rest', 320]],
              brow: [[480, 'worried'], [1650, 'caring'], [2400, null]],
              head: [[0, 0, 0], [90, .4, 0], [420, -1.8, .3], [1650, -1.8, .3], [2050, -.6, 0], [2650, 0, 0], [2970, 0, 0]] },
  // A missed answer or a low score: a blink, a small smile, two small nods. Keep going.
  encourage: { f: [['rest', 60], ['blink1', 45], ['blink2', 40], ['blink1', 45], ['rest', 110], ['smile1', 90], ['smile2', 640], ['smile1', 120], ['rest', 300]],
               brow: [[220, 'caring'], [1120, null]],
               head: [[0, 0, 0], [140, 0, -.3], [360, 0, .9], [560, 0, 0], [760, 0, .8], [960, 0, 0], [1450, 0, 0]] },
  // You stopped a question: okay -- a blink and one nod.
  okay: { still: 'rest', f: [['rest', 40], ['blink1', 45], ['blink2', 40], ['blink1', 45], ['rest', 320]],
          head: [[0, 0, 0], [100, 0, -.3], [300, 0, .8], [560, 0, 0], [720, 0, 0]] },
};
/* Dr. Smiley's performances (DR_PERF, drPerfBuild, his mood, the effects)
   are in features/smiley-performances.js, which loads just before this
   file, so DR_PERF is there when the next line runs. */
// In the table like any other sequence, built each time it's asked for.
Object.keys(DR_PERF).forEach(k => Object.defineProperty(DR_FACE_SEQ, k, { get: () => drPerfBuild(k), enumerable: true, configurable: true }));
/* ---------- Dr. Smiley: animation engine ----------
   One controller (DrAnim) per Dr. Smiley on screen -- Home's greeting, the
   dock, Ask's faces, the lock screen -- made on first use for his
   svg.ds-art and found again by drAnim(svg). It owns everything that moves
   him, so nothing competes:
     face    the strip frame (expressions and gaze share it)
     head    the lean, a Web Animation on the element that holds him (his pin
             on Home, his circle in the dock; Ask passes the svg itself)
     effects hearts, notes, sparkles, "?" floating off his head
   Every request has a priority (DR_P):
     IDLE 1   his own blinks, eye darts and idle expressions
     GAZE 2   his eyes following your finger
     REACT 3  reactions to the app: a message, a term added, back online...
     TASK 4   what he's doing for you (task states, below): thinking while
              Ask works, reading an answer with you, celebrating a quiz
     DIRECT 5 something you did to him: petting him
   A request at or above the priority of what's playing takes over; a lower
   one is turned away (play() returns false). Taking over never snaps to his
   resting face: the face walks through the in-between frames (DR_FACE_BACK,
   drFacePath) into the new expression, the head eases on from where it is,
   and effects fade instead of vanishing. Sequences are walked the same way,
   so two frames that aren't neighbours always get their in-betweens.
   Still (the phone's reduced motion, or "Still" in his settings, drStill):
   no idle, no gaze, no lean, no effects, no sway; a reaction shows its peak
   frame, still, then his resting face, and a task state its one still frame.
   Hidden page: everything pauses (timers cleared) and resumes on return. A
   controller whose svg leaves the page destroys itself (timers, lean,
   effects, listeners), checked on every timer and by a sweep every 4 s.
   Window listeners are shared (one set for all controllers), added while
   any controller follows the finger and removed when none does. */
const DR_P = { IDLE: 1, GAZE: 2, REACT: 3, TASK: 4, DIRECT: 5 };
const DR_STEP = 38;   // ms per in-between frame
// The way back to rest from every frame, one in-between at a time.
const DR_FACE_BACK = {
  blink1: 'rest', blink2: 'blink1', shut: 'blink2', sleep: 'shut',
  wink1: 'rest', wink2: 'wink1', wink: 'wink2',
  smile1: 'rest', smile2: 'smile1', smile: 'smile2',
  laugh1: 'smile2', laugh2: 'laugh1', laugh: 'laugh2', laughB: 'laugh',
  love: 'smile2',
  halfL: 'rest', halfR: 'rest', lookL: 'halfL', lookR: 'halfR', lookU: 'rest', lookD: 'rest',
  lookUL: 'halfL', lookUR: 'halfR', lookDL: 'halfL', lookDR: 'halfR',
  surprised: 'rest', sad: 'blink1', worried: 'halfL', doubt: 'wink1',
};
/* His brows. Each pose: [left lift, left turn, right lift, right turn] for
   the brow on your left and the one on your right; lift in his drawing's
   units (minus is up), turn in degrees (plus is clockwise). The inner end of
   a brow is the end by his nose, so a worried look turns the left brow
   anticlockwise and the right one clockwise. By default the brows follow
   the face frame (DR_BROW_OF); a sequence can hold a pose instead (brow:
   [[ms, pose or null], ...], null handing back to the frames), for meanings
   the frames alone can't carry (caring when he's unsure or encouraging you).
   Focused moves them a little less; Still shows the pose without gliding. */
const DR_BROWS = {
  rest:   [0, 0, 0, 0],
  relax:  [.8, 0, .8, 0],          // eyes closed, asleep
  lift:   [-1.2, 0, -1.2, 0],      // a small smile
  glad:   [-2, 0, -2, 0],          // a smile
  laugh:  [-2.8, 0, -2.8, 0],
  up:     [-4.2, 0, -4.2, 0],      // looking up, surprised
  quizL:  [.4, -7, -3.6, -5],      // eyes up to your left: the other brow goes up
  quizR:  [-3.6, 5, .4, 7],
  down:   [.8, 0, .8, 0],          // looking down, reading
  love:   [-2, -6, -2, 6],
  wink:   [-1, 0, 1.2, -4],        // his left eye (your right)
  caring: [-1, -11, -1, 11],       // inner ends up: sympathy, encouragement
  worried:[-1.4, -15, -1.4, 15],
  focused:[1.2, 10, 1.2, -10],
  doubt:  [-3, -4, 1, 2],          // one up over the open eye, the squinting side down
};
const DR_BROW_OF = {
  shut: 'relax', sleep: 'relax', smile1: 'lift', smile2: 'glad', smile: 'glad',
  laugh1: 'laugh', laugh2: 'laugh', laugh: 'laugh', laughB: 'laugh',
  lookU: 'up', lookUL: 'quizL', lookUR: 'quizR', lookD: 'down', lookDL: 'down', lookDR: 'down',
  love: 'love', wink1: 'wink', wink2: 'wink', wink: 'wink',
  surprised: 'up', sad: 'caring', worried: 'worried', doubt: 'doubt',
};
/* How he acts with them, after the Disney principles (The Illusion of
   Life): no twins -- his left brow (yours on the right, the side he winks)
   is his expressive one and goes a fifth further, the other a little less,
   so a pose is never a mirror image; anticipation -- a big raise from
   nearly level dips first for a moment; follow-through -- the glide (CSS,
   .ds-brow) starts a beat after the eyes and overshoots before it settles. */
const DR_BROW_SIDE = [.9, 1.2];     // [your left, your right]
const DR_BROW_DIP = 70;             // ms of the dip before a big raise
function drBrowApply(l, r, v, k){
  const [a, b] = DR_BROW_SIDE;
  l.style.transform = v ? `translate(0px,${(v[0] * k * a).toFixed(2)}px) rotate(${(v[1] * k * a).toFixed(2)}deg)` : '';
  r.style.transform = v ? `translate(0px,${(v[2] * k * b).toFixed(2)}px) rotate(${(v[3] * k * b).toFixed(2)}deg)` : '';
}
function drBrowSet(svg, pose){
  if(!svg || !svg.querySelector) return;
  pose = DR_BROWS[pose] ? pose : 'rest';
  const key = pose + (drMode() === 'focused' ? ':f' : '');
  if(svg._brow === key) return;
  const l = svg.querySelector('.ds-brow-l'), r = svg.querySelector('.ds-brow-r');
  if(!l || !r) return;
  svg._brow = key;
  clearTimeout(svg._browT);
  const v = DR_BROWS[pose], k = drMode() === 'focused' ? .6 : 1, still = drStill();
  const lift = (v[0] + v[2]) / 2 * k, was = svg._browLift || 0;
  svg._browLift = lift;
  l.style.transition = r.style.transition = still ? 'none' : '';
  const set = () => drBrowApply(l, r, pose === 'rest' ? null : v, k);
  if(!still && drMode() === 'lively' && lift <= -2 && was > -.6){
    drBrowApply(l, r, [.6, 0, .6, 0], 1);
    svg._browT = setTimeout(set, DR_BROW_DIP);
  } else set();
}
// The pose for this svg now: the sequence's hold if it has one, else the frame's.
function drBrowSync(svg, frame){ drBrowSet(svg, svg._browHold || DR_BROW_OF[frame] || 'rest'); }
// Neighbours: each frame and its way back, plus the steps the drawn
// sequences take on purpose (a smile breaking into a laugh, a laugh's
// "ha-ha" mouth, squinting straight into laughter).
const DR_FACE_NEAR = (() => {
  const n = {};
  const link = (a, b) => { (n[a] = n[a] || new Set()).add(b); (n[b] = n[b] || new Set()).add(a); };
  Object.entries(DR_FACE_BACK).forEach(([a, b]) => link(a, b));
  link('smile', 'laugh1'); link('laugh1', 'laughB');
  return n;
})();
const drPathCache = new Map();
// The frames between a and b (both ends excluded): shortest walk over neighbours.
function drFacePath(a, b){
  if(a === b || !a || !b) return [];
  const key = a + '>' + b;
  if(drPathCache.has(key)) return drPathCache.get(key);
  const prev = { [a]: null }, q = [a];
  while(q.length){
    const x = q.shift();
    if(x === b) break;
    (DR_FACE_NEAR[x] || []).forEach(y => { if(!(y in prev)){ prev[y] = x; q.push(y); } });
  }
  const out = [];
  if(b in prev) for(let x = prev[b]; x && x !== a; x = prev[x]) out.unshift(x);
  drPathCache.set(key, out);
  return out;
}
// A sequence with its in-betweens filled in, its length and its peak (the
// frame it holds longest, for reduced motion). Cached per sequence object.
const drSeqCache = new WeakMap();
function drSeq(name){
  const raw = typeof name === 'object' ? name : DR_FACE_SEQ[name];
  if(!raw) return null;
  if(drSeqCache.has(raw)) return drSeqCache.get(raw);
  const f = [];
  raw.f.forEach(([fr, ms], i) => {
    const prev = i ? raw.f[i - 1][0] : null;
    let take = 0;
    if(prev) drFacePath(prev, fr).forEach(m => { f.push([m, DR_STEP]); take += DR_STEP; });
    f.push([fr, Math.max(DR_STEP, ms - Math.min(take, ms / 2))]);
  });
  const total = f.reduce((t, s) => t + s[1], 0);
  const peak = raw.still ? [raw.still, raw.stillMs || 600] : raw.f.filter(s => s[0] !== 'rest').reduce((a, s) => (!a || s[1] > a[1]) ? s : a, null);
  const peakAt = peak ? f.findIndex(s => s[0] === peak[0]) : 0;
  const brow = raw.brow || null, browPeak = brow ? (brow.find(b => b[1]) || [0, null])[1] : null;
  const seq = { f, head: raw.head || null, fx: raw.fx || null, fxAt: raw.fxAt || 0, total, peak: peak ? peak[0] : 'rest', peakMs: peak ? peak[1] : 0, peakAt: Math.max(0, peakAt), brow, browPeak, squash: raw.squash || 0 };
  drSeqCache.set(raw, seq);
  return seq;
}
const drReduce = matchMedia('(prefers-reduced-motion: reduce)');
const drAnims = new Set(), drAnimOf = new WeakMap();
let drSweepTimer = 0;
function drSweep(){
  drAnims.forEach(a => { if(!a.svg.isConnected) a.destroy(); });
  if(!drAnims.size){ clearInterval(drSweepTimer); drSweepTimer = 0; }
}
function drAnim(svg, o){
  if(!svg || !svg.querySelector) return null;
  let a = drAnimOf.get(svg);
  if(a && a.dead) a = null;
  if(!a){ a = new DrAnim(svg, o || {}); }
  else if(o && o.head && o.head !== a.head) a.head = o.head;
  return a;
}
class DrAnim{
  constructor(svg, o){
    this.svg = svg; this.sheet = svg.querySelector('.ds-sheet');
    this.head = o.head || null;
    this.timers = new Set(); this.fx = new Set();
    this.run = null; this.headAnim = null; this.sq = null; this.idle = null; this.g = null; this.dead = false;
    drAnims.add(this); drAnimOf.set(svg, this);
    if(!drSweepTimer) drSweepTimer = setInterval(drSweep, 4000);
  }
  // ---- housekeeping ----
  later(fn, ms){
    const t = setTimeout(() => { this.timers.delete(t); if(this.alive()) fn(); }, ms);
    this.timers.add(t);
    return t;
  }
  clear(t){ if(t){ clearTimeout(t); this.timers.delete(t); } }
  alive(){
    if(this.dead) return false;
    if(!this.svg.isConnected){ this.destroy(); return false; }
    return true;
  }
  destroy(){
    if(this.dead) return;
    this.dead = true;
    this.timers.forEach(t => clearTimeout(t)); this.timers.clear();
    if(this.headAnim){ this.headAnim.cancel(); this.headAnim = null; }
    if(this.sq){ this.sq.cancel(); this.sq = null; }
    this.fx.forEach(el => el.remove()); this.fx.clear();
    this.run = null; this.idle = null; this.g = null;
    drAnims.delete(this); drInputSync();
    if(drAnimOf.get(this.svg) === this) drAnimOf.delete(this.svg);
  }
  frame(){
    const x = -(+(this.sheet && this.sheet.getAttribute('x')) || 0);
    return DR_FACE_FRAMES[Math.round(x / DR_FACE_W)] || 'rest';
  }
  set(name){ drFaceSet(this.svg, name); }
  // Hold the brows in a pose (null: back to following the face frames).
  browHold(pose){ this.svg._browHold = pose || null; drBrowSync(this.svg, this.frame()); }
  get busy(){ return !!this.run; }
  get priority(){ return this.run ? this.run.p : 0; }
  // ---- the head ----
  headNow(){ return this.head ? getComputedStyle(this.head).transform : 'none'; }
  headSwap(anim){
    const old = this.headAnim;
    this.headAnim = anim;
    if(old && old !== anim) old.cancel();
  }
  // The sequence's lean, starting from wherever the head is now. skip: ms of
  // the sequence already passed over; lead: ms of in-betweens before it.
  // The head never jumps: it eases from where it is onto the sequence's path,
  // meeting it DR_HEAD_BLEND ms in (or after the in-betweens, if longer).
  headPlay(keys, skip, lead, keep){
    if(!this.head || !this.head.animate || drStill()) return;
    // Played to the end (not kept), a lean that doesn't end upright eases
    // back upright instead of snapping there when the animation ends.
    const lk = keys && keys[keys.length - 1];
    if(lk && !keep && (lk[1] || lk[2])) keys = keys.concat([[lk[0] + 320, 0, 0]]);
    const from = this.headNow();
    const total = (keys ? keys[keys.length - 1][0] : 0);
    const B = Math.max(0, DR_HEAD_BLEND - lead), meet = skip + B;
    const dur = Math.max(DR_HEAD_BLEND + 20, lead + Math.max(B, total - skip));
    const ease = 'cubic-bezier(.45,0,.35,1)';
    const kf = [{ offset: 0, transform: from, easing: 'cubic-bezier(.3,0,.25,1)' }];
    const at = t => {   // the sequence's lean at time t, interpolated
      if(!keys || !keys.length) return [0, 0];
      if(t <= keys[0][0]) return [keys[0][1], keys[0][2]];
      for(let i = 1; i < keys.length; i++){
        const [t1, r1, y1] = keys[i], [t0, r0, y0] = keys[i - 1];
        if(t <= t1){ const k = t1 > t0 ? (t - t0) / (t1 - t0) : 1; return [r0 + (r1 - r0) * k, y0 + (y1 - y0) * k]; }
      }
      const l = keys[keys.length - 1]; return [l[1], l[2]];
    };
    const [mr, my] = at(meet);
    kf.push({ offset: Math.min(1, (lead + B) / dur), transform: `translateY(${my.toFixed(3)}%) rotate(${mr.toFixed(3)}deg)`, easing: ease });
    if(keys) keys.forEach(([t, r, y]) => {
      if(t <= meet) return;
      kf.push({ offset: Math.min(1, (lead + t - skip) / dur), transform: `translateY(${y}%) rotate(${r}deg)`, easing: ease });
    });
    if(kf[kf.length - 1].offset < 1 && !keep) kf.push({ offset: 1, transform: 'translateY(0%) rotate(0deg)' });
    kf[kf.length - 1].offset = 1;
    for(let i = 1; i < kf.length; i++) if(kf[i].offset < kf[i - 1].offset) kf[i].offset = kf[i - 1].offset;
    try{ this.headSwap(this.head.animate(kf, { duration: dur, fill: keep ? 'forwards' : 'none' })); }catch(e){}
  }
  // Ease the head to a lean and hold it (gaze), or back to upright (and let go,
  // so CSS like Home's press shrink applies again).
  headTo(r, y, ms){
    if(!this.head || !this.head.animate || drStill()) return;
    const upright = !r && !y;
    try{
      const a = this.head.animate([{ transform: this.headNow() }, { transform: `translateY(${y}%) rotate(${r}deg)` }],
        { duration: ms, easing: 'cubic-bezier(.3,0,.2,1)', fill: upright ? 'none' : 'forwards' });
      this.headSwap(a);
    }catch(e){}
  }
  /* Squash and stretch (E3, Jose's pick B, 2026-10-19): on his own picture,
     not what holds him, so the lean and lift stay as they are. Only for a
     sequence that asks (squash: cheer and greet, Lively), only from its
     start, and never where the picture is also what leans (Ask's face). */
  squashPlay(keys, k, lead){
    if(!keys || !this.head || this.head === this.svg || !this.svg.animate || drStill() || drMode() !== 'lively') return;
    const kf = drSquashKeys(keys, k);
    if(!kf) return;
    this.squashStop(true);
    try{ this.sq = this.svg.animate(kf, { duration: keys[keys.length - 1][0], delay: lead }); }catch(e){ this.sq = null; }
  }
  // Interrupted: ease back to his drawn shape rather than snap (quick: at once).
  squashStop(quick){
    const a = this.sq;
    if(!a) return;
    this.sq = null;
    if(quick || a.playState === 'finished'){ a.cancel(); return; }
    const now = getComputedStyle(this.svg).transform;
    a.cancel();
    if(now && now !== 'none') try{ this.svg.animate([{ transform: now, transformOrigin: DR_SQUASH_AT }, { transform: 'none', transformOrigin: DR_SQUASH_AT }], { duration: 140, easing: 'ease-out' }); }catch(e){}
  }
  // ---- effects ----
  effect(kind){
    const el = drFaceFx(this.head, kind);
    if(!el) return;
    this.fx.add(el);
    this.later(() => this.fx.delete(el), (DR_FX_LIFE[kind] || 2800) + 100);
  }
  fadeEffects(){
    this.fx.forEach(el => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 220); });
    this.fx.clear();
  }
  // ---- expressions ----
  // Play a sequence (a DR_FACE_SEQ name or a {f, head} object). Returns false
  // if something more important is playing. done(): only when it completes.
  // keep: end on its last frame and lean instead of walking back to rest
  // (an entry that a task state's hold carries on from).
  play(name, o){
    o = o || {};
    const p = o.priority || DR_P.REACT;
    if(!this.alive() || document.hidden) return false;
    fmNote('Dr. Smiley ' + name);
    if(name === 'glance') name = Math.random() < .5 ? 'glanceL' : 'glanceR';
    const seq = drSeq(name);
    if(!seq) return false;
    if(this.run && this.run.p > p) return false;
    if(drStill() && p < DR_P.REACT) return false;
    this.stopRun(false);
    if(drStill()){
      return this.still(seq.peak, Math.min(1400, Math.max(600, seq.peakMs)), p, o.done, seq.browPeak);
    }
    const run = { p, name: typeof name === 'string' ? name : 'custom', timers: [] };
    this.run = run;
    // Join the sequence where the face already is if that frame is part of
    // its build-up (before its peak; never a rest frame), else walk in from
    // the current frame.
    const cur = this.frame();
    let start = 0;
    const build = seq.f.slice(0, seq.peakAt).map(s => s[0]);
    const at = cur === 'rest' ? -1 : build.indexOf(cur);
    if(at > 0) start = at;
    const bridge = at > -1 ? [] : drFacePath(cur, seq.f[0][0]);
    const skip = seq.f.slice(0, start).reduce((t, s) => t + s[1], 0);
    const lead = bridge.length * DR_STEP;
    const frames = bridge.map(f => [f, DR_STEP]).concat(seq.f.slice(start));
    // Every sequence ends on his resting face (a blink ends on blink1),
    // unless a hold carries on from it.
    const last = frames.length ? frames[frames.length - 1][0] : this.frame();
    if(last !== 'rest' && !o.keep) drFacePath(last, 'rest').concat(['rest']).forEach(f => frames.push([f, DR_STEP]));
    this.headPlay(seq.head, skip, lead, o.keep);
    if(seq.squash && !skip) this.squashPlay(seq.head, seq.squash, lead);
    if(seq.brow){
      // Keys already passed (joining part-way) leave the latest one in force.
      let now;
      seq.brow.forEach(([t, pose]) => {
        const at = t - skip + lead;
        if(at <= 0) now = pose;
        else run.timers.push(this.later(() => { if(this.run === run) this.browHold(pose); }, at));
      });
      if(now !== undefined) this.browHold(now);
    }
    if(seq.fx && this.head && drFxOk()){
      run.timers.push(this.later(() => { if(this.run === run) this.effect(seq.fx); }, Math.max(0, seq.fxAt - skip) + lead));
    }
    let i = 0;
    const step = () => {
      if(this.run !== run) return;
      if(i >= frames.length){ this.finish(run, o.done); return; }
      const [f, ms] = frames[i++];
      this.set(f);
      run.timers.push(this.later(step, ms));
    };
    step();
    return true;
  }
  // Reduced motion: the expression's peak, still, then rest. No lean, no effects.
  still(frame, ms, p, done, brow){
    const run = { p, name: 'still', timers: [] };
    this.run = run;
    if(brow) this.svg._browHold = brow;
    this.set(frame);
    run.timers.push(this.later(() => { if(this.run !== run) return; this.set('rest'); this.finish(run, done); }, ms));
    return true;
  }
  finish(run, done){
    if(this.run !== run) return;
    this.run = null;
    if(this.svg._browHold) this.browHold(null);
    if(done) done();
    this.next();
  }
  // Stop what's playing. settle: walk the face back to rest and ease the head
  // upright (nothing new follows); otherwise the next request takes over from
  // the current frame and lean.
  stopRun(settle){
    const run = this.run;
    if(!run) return;
    run.timers.forEach(t => this.clear(t));
    if(run.gazeTimer) this.clear(run.gazeTimer);
    this.run = null;
    this.svg._browHold = null;
    this.squashStop();
    this.fadeEffects();
    if(settle) this.settle();
  }
  // Back to rest through the in-betweens (and upright), interruptible by anything.
  settle(then){
    const path = drFacePath(this.frame(), 'rest').concat(this.frame() === 'rest' ? [] : ['rest']);
    this.headTo(0, 0, Math.max(220, path.length * DR_STEP + 120));
    if(!path.length){ if(then) then(); this.next(); return; }
    const run = { p: .5, name: 'settle', timers: [] };
    this.run = run;
    let i = 0;
    const step = () => {
      if(this.run !== run) return;
      if(i >= path.length){ this.finish(run, then); return; }
      this.set(path[i++]);
      run.timers.push(this.later(step, DR_STEP));
    };
    step();
  }
  // Talking: the mouth through the smile frames in an uneven rhythm, with
  // small nods. Kept for real audio only (a voice, if one is added): a silent
  // text answer gets a purposeful expression instead (task states), never a
  // mouth moving to no sound. Nothing calls it today.
  talk(ms, o){
    o = o || {};
    const p = o.priority || DR_P.DIRECT;
    if(drStill()){
      if(!this.alive() || document.hidden || (this.run && this.run.p > p)) return false;
      this.stopRun(false);
      return this.still('smile1', Math.min(1200, ms), p, o.done);
    }
    const mouths = ['smile1', 'smile2', 'smile', 'smile2', 'smile1', 'rest'];
    const f = [['smile1', 70]], h = [[0, 0, 0], [90, 0, .4]];
    let t = 70, prev = 'smile1';
    while(t < ms){
      let m = mouths[Math.floor(Math.random() * mouths.length)];
      if(m === prev) m = m === 'rest' ? 'smile2' : 'rest';
      const d = 80 + Math.round(Math.random() * 90);
      f.push([m, d]); t += d; prev = m;
      if(Math.random() < .12){ f.push(['rest', 160]); t += 160; }
    }
    f.push(['smile1', 90], ['rest', 260]); t += 350;
    for(let k = 420; k < t - 400; k += 520 + Math.round(Math.random() * 300)) h.push([k, (Math.random() - .5) * 1.6, .5], [k + 180, 0, 0]);
    h.push([t, 0, 0]);
    return this.play({ f, head: h }, { priority: p, done: o.done });
  }
  // ---- gaze: the eyes follow a finger ----
  // Hysteresis: his eyes stay in a direction until the finger is clearly in
  // the next one (DR_GAZE_HYST degrees past the line), the near/far step has
  // a dead band, the "looking at you" circle is entered closer than it's left,
  // and a new direction must hold DR_GAZE_DWELL ms before he moves his eyes.
  gazeCan(){
    return !!(this.idle && this.idle.opts.expressions !== false) && this.policy().gaze && !document.hidden && this.alive()
      && (this.idle.opts.visible ? this.idle.opts.visible() : (!this.idle.opts.canPlay || this.idle.opts.canPlay()));
  }
  gazeStart(x, y, target){
    if(!this.gazeCan()) return false;
    if(this.head && this.head.parentElement && target && this.head.parentElement.contains(target)) return false;
    if(!this.svg.getBoundingClientRect().width) return false;
    if(this.run && this.run.p >= DR_P.GAZE && !this.run.gaze) return false;
    if(this.run && this.run.gaze){ this.clear(this.run.endTimer); this.gazeMove(x, y); return true; }
    this.stopRun(false);
    this.run = { p: DR_P.GAZE, name: 'gaze', gaze: true, timers: [] };
    this.g = { center: true, sector: null, far: false, shown: this.frame(), want: null, wantAt: 0, x, y, tilt: null, first: true };
    this.gazeMove(x, y);
    return true;
  }
  gazeAim(x, y){
    const g = this.g, r = this.svg.getBoundingClientRect();
    const dx = x - (r.left + r.width * .5), dy = y - (r.top + r.height * .45), d = Math.hypot(dx, dy);
    const rin = Math.max(24, r.width * .42), rout = rin + 18;
    if(g.center ? d < rout : d < rin){ g.center = true; g.sector = null; return 'rest'; }
    const a = Math.atan2(dy, dx) * 180 / Math.PI;      // 0 right, 90 down
    const dist = s => { const v = Math.abs(((a - s * 45) % 360 + 540) % 360 - 180); return v; };
    let s = ((Math.round(a / 45) % 8) + 8) % 8;
    if(!g.center && g.sector !== null && dist(g.sector) <= 22.5 + DR_GAZE_HYST) s = g.sector;
    g.center = false; g.sector = s;
    g.far = g.far ? d > 125 : d > 185;   // a wide dead band: near/far is a small change
    return ['halfR', 'lookDR', 'lookD', 'lookDL', 'halfL', 'lookUL', 'lookU', 'lookUR'][s]
      .replace('halfR', g.far ? 'lookR' : 'halfR').replace('halfL', g.far ? 'lookL' : 'halfL');
  }
  gazeMove(x, y){
    const run = this.run;
    if(!run || !run.gaze || !this.alive()) return;
    const g = this.g; g.x = x; g.y = y;
    const want = this.gazeAim(x, y);
    const now = performance.now();
    if(want === g.shown){ g.want = null; return; }
    if(want !== g.want){ g.want = want; g.wantAt = now; }
    const wait = g.first ? 0 : DR_GAZE_DWELL - (now - g.wantAt);
    g.first = false;
    if(wait > 0){
      if(!run.gazeTimer) run.gazeTimer = this.later(() => { run.gazeTimer = 0; if(this.run === run) this.gazeMove(g.x, g.y); }, wait);
      return;
    }
    this.gazeShow(want);
  }
  gazeShow(to){
    const run = this.run, g = this.g;
    g.shown = to; g.want = null;
    run.timers.forEach(t => this.clear(t)); run.timers = [];
    const path = drFacePath(this.frame(), to).concat([to]);
    let i = 0;
    const step = () => { if(this.run !== run) return; this.set(path[i++]); if(i < path.length) run.timers.push(this.later(step, 30)); };
    step();
    // The head follows the eyes a little.
    const [tilt, lift] = DR_GAZE_LEAN[to] || [0, 0];
    if(g.tilt !== tilt + ',' + lift){ g.tilt = tilt + ',' + lift; this.headTo(tilt, lift, 200); }
  }
  gazeEnd(){
    const run = this.run;
    if(!run || !run.gaze) return;
    this.clear(run.endTimer);
    run.endTimer = this.later(() => {
      if(this.run !== run) return;
      this.stopRun(false);
      // Back to you: through the in-betweens, upright, then a blink.
      this.settle(() => this.play('blink', { priority: DR_P.IDLE }));
    }, 450);
  }
  // ---- where he is, and what the task state allows here ----
  get place(){
    const s = this.svg;
    return s.closest('.dock-smiley') ? 'dock' : s.closest('#tgSmiley') ? 'top' : s.closest('.access-face') ? 'lock'
      : s.closest('.home-wave-icon') ? 'home' : s.closest('.ask-face') ? 'ask' : 'other';
  }
  // What he may do here now: idle level (0 none, 1 blinks, 2 calm: blinks,
  // eye darts, glances and a doze, 3 full), gaze, effects. The task state
  // and the mode (Lively, Focused, Still) both cap it. A task that belongs
  // to one place (reading an answer, on Ask) leaves the others as they were.
  policy(){
    let name = drState();
    if(this.place === 'lock') name = 'available';
    else if(DR_STATES[name].where && this.place !== DR_STATES[name].where) name = drMindBase();
    const st = DR_STATES[name], mode = drMode();
    const level = Math.min(DR_IDLE_LEVEL[st.idle], DR_MODE_CAP[mode]);
    return { state: name, level, slow: !!st.slow, gaze: mode === 'lively' && level >= 2, doze: level >= 2 && !st.slow };
  }
  visibleNow(){
    const o = this.idle ? this.idle.opts : {};
    return o.visible ? o.visible() : (!o.canPlay || o.canPlay());
  }
  // The hold this controller runs for the current task state, if any.
  holdName(){
    if(!this.idle || this.place === 'lock') return null;
    const st = DR_STATES[drState()];
    if(!st.hold || (st.where && this.place !== st.where)) return null;
    return st.hold;
  }
  // After anything ends: the task state's hold if there is one, else idle.
  next(){
    if(this.run || this.dead) return;
    const h = this.holdName();
    if(h){ this.holdStart(h); return; }
    if(this.idle) this.idleArm();
  }
  // The task state changed (drMindChanged): end a hold that no longer
  // applies (back to rest through the in-betweens), start one that does
  // (taking over from his idle or gaze, never from a reaction or something
  // you did), and re-time the idle for the new state.
  taskSync(){
    if(!this.alive() || !this.idle) return;
    const h = this.holdName(), run = this.run;
    if(run && run.hold){
      if(run.hold === h) return;
      this.stopRun(false);
      this.settle();
      return;
    }
    if(run && h && run.p < DR_P.TASK) this.stopRun(false);
    if(!this.run){ if(h) this.holdStart(h); else this.idleArm(); }
  }
  // ---- holds: a task state kept up for as long as it lasts ----
  // At TASK priority, so his idle, his eyes following a finger and the app's
  // small reactions can't interrupt it; petting him can, and it picks up
  // again after. Still: the state's one frame, no timers.
  holdStart(name){
    if(this.run || !this.alive()) return;
    const run = { p: DR_P.TASK, name: 'hold:' + name, hold: name, timers: [], beat: 0, since: performance.now() };
    this.run = run;
    if(this.idle) this.clear(this.idle.timer);
    if(drStill()){ const f = DR_HOLD_STILL[name]; if(f) this.set(f); return; }
    if(document.hidden) return;
    this.holdBeat(run);
  }
  holdBeat(run){
    if(this.run !== run || document.hidden) return;
    if(!this.visibleNow()){ run.timers.push(this.later(() => this.holdBeat(run), 1500)); return; }
    const beat = DR_HOLDS[run.hold](run);
    run.beat++;
    const [tilt, lift] = beat.lean || [0, 0];
    if(run.lean !== tilt + ',' + lift){ run.lean = tilt + ',' + lift; this.headTo(tilt, lift, beat.leanMs || 480); }
    // Each beat's frames, with the in-betweens from wherever the face is.
    const frames = [];
    let cur = this.frame();
    beat.f.forEach(([f, ms]) => {
      drFacePath(cur, f).forEach(m => frames.push([m, beat.step || 46]));
      frames.push([f, ms]); cur = f;
    });
    let i = 0;
    const step = () => {
      if(this.run !== run) return;
      if(i >= frames.length){ this.holdBeat(run); return; }
      const [f, ms] = frames[i++];
      this.set(f);
      run.timers.push(this.later(step, ms));
    };
    step();
  }
  // ---- idle: his own rhythm ----
  // Left alone: a blink every 2-6 s at irregular moments (now and then a
  // double blink or a longer pause), eye darts, and every 5-8 s one of his
  // expressions -- none of his last three again, at most one wink or kiss a
  // minute; more smiles and hums in the morning, a doze now and then late at
  // night, tilted by his mood (drMoodNow). How much of that he does is
  // policy()'s idle level: the task state and the mode cap it. After 45 s
  // without a touch he dozes once (resting); after two quiet minutes he
  // settles until the next touch. opts: canPlay(), visible(), quietMs,
  // dozeMs (null: never), onAct(kind), expressions (false: blinks only),
  // first (ms before the first).
  startIdle(opts){
    opts = opts || {};
    if(this.idle){ this.idle.opts = opts; return this; }
    this.idle = { opts, timer: 0, settled: false, recent: [], lastExpr: -1e9, lastWink: -1e9, last: '' };
    drInputSync();
    // A task state already under way (Ask still thinking when you come back
    // to it) is joined as it is, without its entry again.
    if(this.holdName() && !this.run) this.holdStart(this.holdName());
    else this.idleArm(opts.first == null ? 900 + Math.random() * 700 : opts.first);
    return this;
  }
  stopIdle(){
    if(!this.idle) return;
    this.clear(this.idle.timer);
    this.idle = null;
    if(this.run && (this.run.gaze || this.run.hold || this.run.p <= DR_P.GAZE)) this.stopRun(false);
    this.set('rest');
    if(this.headAnim){ this.headAnim.cancel(); this.headAnim = null; }
    drInputSync();
  }
  idleArm(ms){
    const I = this.idle;
    if(!I || this.dead) return;
    this.clear(I.timer); I.timer = 0;
    if(drStill() || document.hidden) return;
    const P = this.policy();
    if(!P.level) return;   // nothing of his own in this state; taskSync() re-arms when it changes
    let gap = Math.random() < .08 ? 4000 + Math.random() * 1500 : 1200 + Math.random() * 1800;
    if(P.level === 1) gap += 1200;
    if(P.slow) gap *= 2;
    I.timer = this.later(() => { I.timer = 0; this.idleTick(); }, ms == null ? gap : ms);
  }
  idleNext(){ this.next(); }
  idleTick(){
    const I = this.idle;
    if(!I || !this.alive()) return;
    const o = I.opts;
    if(document.hidden || (o.canPlay && !o.canPlay())){ this.idleArm(1500); return; }
    if(this.run) return;   // next() re-arms when it ends
    const P = this.policy();
    if(!P.level) return;
    const now = performance.now(), quiet = now - drInput.last;
    const quietMs = o.quietMs === undefined ? 120000 : o.quietMs, dozeMs = o.dozeMs === undefined ? 45000 : o.dozeMs;
    if(quietMs && quiet > quietMs){ I.settled = true; return; }
    const rnd = (a, b) => a + Math.random() * (b - a);
    const lively = o.expressions !== false && P.level >= 3, calm = o.expressions !== false && P.level >= 2;
    let kind = 'blink';
    if(P.doze && dozeMs && quiet > dozeMs && I.dozeFor !== drInput.last){ kind = 'doze'; I.dozeFor = drInput.last; }   // once per quiet spell
    else if(lively && now - I.lastExpr > 2500 && Math.random() < .8){
      const hour = new Date().getHours(), morning = hour >= 5 && hour < 11, late = hour >= 21 || hour < 5;
      const mood = drMoodNow(), happy = mood === 'happy' ? 1.8 : 1, thoughtful = mood === 'thoughtful';
      const pool = [['smile', (morning ? .22 : .16) * happy], ['laugh', (thoughtful ? .03 : .1) * happy], ['giggle', (thoughtful ? .03 : .1) * happy], ['nod', .1], ['think', thoughtful ? .25 : .1],
        ['love', .09 * happy], ['proud', .08 * happy], ['sing', (morning ? .16 : .08) * happy], ['around', thoughtful ? .14 : .07], ['wink', .07], ['kiss', .05], ...(late ? [['doze', .1]] : [])]
        .filter(([k]) => !I.recent.includes(k) && !((k === 'wink' || k === 'kiss') && now - I.lastWink < 60000));
      let r = Math.random() * pool.reduce((t, p) => t + p[1], 0);
      for(const [k, w] of pool){ if((r -= w) <= 0){ kind = k; break; } }
      if(kind === 'blink' && pool.length) kind = pool[0][0];
    }
    if(kind === 'blink' && calm && I.last !== 'glance' && Math.random() < .16) kind = 'glance';
    if(kind === 'blink' && calm && Math.random() < .22){
      const darts = ['halfL', 'halfR', 'lookU', 'lookUL', 'lookUR', 'lookDL', 'lookDR', 'lookD'];
      this.play({ f: [[darts[Math.floor(Math.random() * darts.length)], Math.round(rnd(450, 1000))], ['rest', 60]] }, { priority: DR_P.IDLE });
      return;
    }
    if(kind === 'blink' && Math.random() < .18){ this.play(DR_DOUBLE_BLINK, { priority: DR_P.IDLE }); return; }
    const expr = kind !== 'blink' && kind !== 'glance' && kind !== 'doze';
    if(kind !== 'blink'){ I.last = kind; if(kind === 'wink' || kind === 'kiss') I.lastWink = now; }
    if(expr){ I.recent.push(kind); if(I.recent.length > 3) I.recent.shift(); }
    if(o.onAct) o.onAct(kind);
    this.play(kind, { priority: DR_P.IDLE, done: () => { if(expr && this.idle) this.idle.lastExpr = performance.now(); } });
  }
  wake(){
    const I = this.idle;
    if(I && I.settled){ I.settled = false; if(!this.run) this.idleArm(1200); }
  }
  // ---- page hidden / shown ----
  pause(){
    this.timers.forEach(t => clearTimeout(t)); this.timers.clear();
    if(this.idle) this.idle.timer = 0;
    this.run = null; this.g = null;
    if(this.headAnim){ this.headAnim.cancel(); this.headAnim = null; }
    if(this.sq){ this.sq.cancel(); this.sq = null; }
    this.fx.forEach(el => el.remove()); this.fx.clear();
    this.set('rest');
  }
  // Back: the task state's hold straight away, else his idle after a moment.
  resume(){
    if(!this.idle || this.dead || this.run) return;
    const h = this.holdName();
    if(h) this.holdStart(h); else this.idleArm(900 + Math.random() * 700);
  }
}
const DR_GAZE_HYST = 10, DR_GAZE_DWELL = 90, DR_HEAD_BLEND = 140;
// How far the head leans with each gaze: [tilt deg, lift %].
const DR_GAZE_LEAN = { rest: [0, 0], halfL: [-.6, 0], halfR: [.6, 0], lookL: [-1.2, 0], lookR: [1.2, 0], lookU: [0, -.35], lookD: [0, .35],
  lookUL: [-1, -.35], lookUR: [1, -.35], lookDL: [-1, .35], lookDR: [1, .35] };
const DR_DOUBLE_BLINK = { f: [['blink1', 45], ['blink2', 40], ['shut', 75], ['blink2', 45], ['blink1', 60], ['rest', 140], ['blink1', 45], ['blink2', 40], ['shut', 70], ['blink2', 45], ['blink1', 60]] };
/* Shared input: one set of window listeners for every controller, there
   only while at least one follows the finger. Touch events (not pointer
   events), so the eyes keep following through a scroll. */
const drInput = { last: performance.now(), on: false };
function drInputEvent(e){
  const touch = e.touches ? (e.touches[0] || e.changedTouches[0]) : e;
  const type = e.type;
  if(type === 'touchstart' || type === 'mousedown' || type === 'keydown' || type === 'scroll' || type === 'wheel' || type === 'pointerdown'){
    drInput.last = performance.now();
    drAnims.forEach(a => a.wake());
  }
  if(type === 'keydown' || type === 'scroll' || type === 'wheel' || type === 'pointerdown') return;
  if(type === 'mousemove' && !(e.buttons & 1)) return;
  const end = type === 'touchend' || type === 'touchcancel' || type === 'mouseup';
  if(end && e.touches && e.touches.length) return;
  drAnims.forEach(a => {
    if(!a.idle) return;
    if(type === 'touchstart' || type === 'mousedown'){ if(touch) a.gazeStart(touch.clientX, touch.clientY, e.target); }
    else if(end) a.gazeEnd();
    else if(touch) a.gazeMove(touch.clientX, touch.clientY);
  });
}
const DR_INPUT = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'mousedown', 'mousemove', 'mouseup', 'pointerdown', 'keydown', 'scroll', 'wheel'];
function drInputSync(){
  const want = !drStill() && [...drAnims].some(a => a.idle);
  if(want === drInput.on) return;
  drInput.on = want;
  DR_INPUT.forEach(t => want ? window.addEventListener(t, drInputEvent, { passive: true, capture: true })
                             : window.removeEventListener(t, drInputEvent, { capture: true }));
}
document.addEventListener('visibilitychange', () => {
  drAnims.forEach(a => document.hidden ? a.pause() : a.resume());
});

/* ---------- Dr. Smiley: how lively (Lively, Focused, Still) ----------
   Set in the profile sheet under "Dr. Smiley follows me" (ih_smileyMode).
     Lively   everything: his idle expressions, eyes that follow your finger,
              little effects, reactions to the team's activity
     Focused  only what he's doing for you (task states, study results);
              blinks and small eye movements otherwise, no effects
     Still    no movement at all; his face changes only to show a state
   The phone's reduced-motion setting always means Still, whatever is chosen. */
const DR_MODES = ['lively', 'focused', 'still'];
const DR_MODE_CAP = { lively: 3, focused: 2, still: 0 };
// Remembered for the name on this phone (What Dr. Smiley remembers); an
// older choice from before that, if there's none.
let drModePref = (() => { try{
  const who = (localStorage.getItem('ih_myName') || '').trim().toLowerCase() || '_';
  const mem = JSON.parse(localStorage.getItem('ih_smileyMemory') || 'null');
  const p = mem && mem.people && mem.people[who] && mem.people[who].prefs;
  const m = (p && p.mode) || localStorage.getItem('ih_smileyMode');
  return DR_MODES.includes(m) ? m : 'lively';
}catch(e){ return 'lively'; } })();
function drMode(){ return drReduce.matches ? 'still' : drModePref; }
function drStill(){ return drMode() === 'still'; }
function setSmileyMode(m){
  if(!DR_MODES.includes(m)) return;
  drModePref = m;
  drMemSet('mode', m);          // remembered for the name on this phone
  drModeChanged();
}
function drModeChanged(){
  const still = drStill();
  document.documentElement.classList.toggle('ds-still', still);
  drAnims.forEach(a => { a.pause(); a.resume(); });
  drInputSync();
  if(typeof smileyModeSync === 'function') smileyModeSync();
  window.dispatchEvent(new Event('drmodechange'));
}
document.documentElement.classList.toggle('ds-still', drStill());

/* ---------- Dr. Smiley: what he's doing (task states) ----------
   His personality -- cheerful, curious, attentive, capable -- comes from
   what is actually happening in the app, the same on Home, Ask, study and
   the dock. One state at a time, for the whole app:
     available    nothing going on: his own idle (the mode decides how much)
     attentive    you're typing in Ask: a quick look to the box, then quiet
     processing   Ask is working on your question: eyes up, thinking, slow
                  blinks; restrained, no effects, nothing else interrupts
     answering    an answer arrived: an acknowledgment, then he reads it
                  with you (eyes on the answer) for as long as it takes to read
     celebrating  a good study result: a short performance, then back
     uncertain    not from the Hub, declined, failed: a composed face, never
                  a cheerful one, while the card shows what to do next
     offline      calm: blinks and small eye movements
     appointment  you're in an appointment: focused, blinks only, no effects
     resting      nobody has touched the phone for a while: he dozes once
   The first five are tasks (drTask); the last three follow the phone
   (drMindBase). A task's entry plays on whichever Dr. Smiley you can see
   (drPerform); its hold, if any, runs on every one it applies to, so a
   Dr. Smiley that appears mid-task (you went back to Ask while it was still
   thinking) joins it as it is. The controller times every frame. */
const DR_STATES = {
  available:   { idle: 'full' },
  attentive:   { idle: 'blinks' },
  processing:  { idle: 'none', hold: 'processing' },
  answering:   { idle: 'none', hold: 'reading', where: 'ask' },
  celebrating: { idle: 'none' },
  uncertain:   { idle: 'blinks' },
  offline:     { idle: 'calm' },
  appointment: { idle: 'blinks', slow: true, fx: false },
  resting:     { idle: 'calm' },
};
const DR_IDLE_LEVEL = { none: 0, blinks: 1, calm: 2, full: 3 };
// Still: the one frame a hold shows.
const DR_HOLD_STILL = { processing: 'lookUL' };
const DR_BLINK = [['blink1', 45], ['blink2', 40], ['shut', 80], ['blink2', 45], ['blink1', 55], ['rest', 90]];
// One beat of a hold at a time: frames (in-betweens are added), and the lean.
const DR_HOLDS = {
  // Thinking: up and to one side, up, the other side, a slow blink every
  // other beat. Slower once it's taken a while.
  processing(run){
    const poses = ['lookUL', 'lookU', 'lookUR', 'lookU'], pose = poses[run.beat % 4];
    const slow = performance.now() - run.since > 9000 ? 1.5 : 1;
    const ms = Math.round((1000 + Math.random() * 800) * slow);
    const lean = { lookUL: [-1.5, -.3], lookU: [-.2, -.45], lookUR: [1.2, -.3] }[pose];
    return { f: run.beat % 2 ? [[pose, ms]].concat(DR_BLINK) : [[pose, ms]], lean, leanMs: 620, step: 52 };
  },
  // Reading the answer with you: eyes down on it, along a line and back,
  // a blink every third beat.
  reading(run){
    const poses = ['lookD', 'lookDL', 'lookD', 'lookDR'], pose = poses[run.beat % 4];
    const ms = Math.round(700 + Math.random() * 600);
    const lean = { lookD: [0, .45], lookDL: [-.7, .45], lookDR: [.7, .45] }[pose];
    return { f: run.beat % 3 === 2 ? [[pose, ms]].concat(DR_BLINK) : [[pose, ms]], lean, leanMs: 520, step: 46 };
  },
};
const drMind = { task: null, timer: 0, offline: typeof navigator !== 'undefined' && navigator.onLine === false };
// The state the phone puts him in when no task is running.
function drMindBase(){
  if(drMind.offline) return 'offline';
  if(typeof apptActive === 'function' && apptActive()) return 'appointment';
  if(performance.now() - drInput.last > 45000) return 'resting';
  return 'available';
}
function drState(){ return drMind.task ? drMind.task.kind : drMindBase(); }
function drFxOk(){ return drMode() === 'lively' && DR_STATES[drState()].fx !== false; }
function drMindChanged(){
  document.documentElement.dataset.drState = drState();
  drAnims.forEach(a => a.taskSync());
}
/* Start a task state. o: key (who owns it, so only they end it), ms (how
   long it lasts on its own), perform (a sequence to open with on the
   Dr. Smiley you can see, at TASK priority; keep: a hold carries on from its
   last frame), then (what follows when it runs out by itself: another
   drTask's arguments, or { perform }). A new task replaces the one before. */
function drTask(kind, o){
  o = o || {};
  if(!DR_STATES[kind]) return null;
  clearTimeout(drMind.timer); drMind.timer = 0;
  const t = { kind, key: o.key || kind, since: performance.now(), then: o.then || null };
  drMind.task = t;
  if(o.ms) drMind.timer = setTimeout(() => drTaskEnd(t.key, true), o.ms);
  document.documentElement.dataset.drState = kind;
  if(o.perform) drPerform(o.perform, { priority: o.priority || DR_P.TASK, keep: !!o.keep });
  drAnims.forEach(a => a.taskSync());
  return t;
}
// End the task (only if key still owns it). ranOut: it timed out by itself,
// so its "then" follows.
function drTaskEnd(key, ranOut){
  const t = drMind.task;
  if(!t || (key && t.key !== key)) return false;
  drMind.task = null; clearTimeout(drMind.timer); drMind.timer = 0;
  const then = ranOut ? t.then : null;
  // where: its performance only on that page (an answer's closing smile
  // belongs on Ask, not in the dock somewhere else).
  const there = then && (!then.where || (typeof activeCategory !== 'undefined' && activeCategory === then.where));
  if(then && then.kind){ drTask(then.kind, there ? then : { ...then, perform: null }); return true; }
  drMindChanged();
  if(then && then.perform && there) drPerform(then.perform, { priority: then.priority || DR_P.TASK });
  return true;
}
// Keep a task going a little longer (typing keeps him attentive).
function drTaskExtend(key, ms){
  const t = drMind.task;
  if(!t || t.key !== key) return false;
  clearTimeout(drMind.timer);
  drMind.timer = setTimeout(() => drTaskEnd(t.key, true), ms);
  return true;
}
/* The Dr. Smiley you can see right now, and what holds him: Ask's face on
   Ask; otherwise the dock (or the top bar on a computer) when he's showing
   there; otherwise the Home greeting on Home. */
function drStage(o){
  if(document.hidden) return null;
  if(typeof activeCategory !== 'undefined' && activeCategory === 'ask'){
    const svg = document.querySelector('#content .ask-hello .ask-face svg') || document.querySelector('#askFace svg');
    return svg ? { svg, head: svg } : null;
  }
  const dock = typeof smileyRider !== 'undefined' && smileyRider.stage();
  if(dock) return dock;
  if(typeof activeCategory !== 'undefined' && activeCategory === 'home' && !(o && o.noHome) && window.homeSmileyAct) return { home: true };
  return null;
}
// Calmer versions when he should be calmer: Focused, and in an appointment.
// null: nothing at all.
const DR_TONE = {
  // The five performances (DR_PERF) build their own calmer Focused versions.
  focused:     { love: 'smile', giggle: 'smile', laugh: 'smile', kiss: 'smile', sing: 'smile' },
  appointment: { celebrate: 'ack', cheer: 'ack', greet: 'ack', proud: 'ack', love: 'ack', giggle: 'ack', laugh: 'ack', kiss: null, wink: null, sing: null, notice: null, encourage: 'ack', bounce: 'ack', wince: null, wow: 'ack' },
};
function drTone(seq){
  let s = seq;
  if(drMindBase() === 'appointment' && s in DR_TONE.appointment) s = DR_TONE.appointment[s];
  if(s && drMode() === 'focused' && s in DR_TONE.focused) s = DR_TONE.focused[s];
  return s;
}
// Play a sequence on the Dr. Smiley you can see. o: priority (REACT),
// keep, done, noHome. False when none is showing or something more
// important is playing.
function drPerform(seq, o){
  o = o || {};
  const s = drTone(seq);
  if(!s) return false;
  const st = drStage(o);
  if(!st) return false;
  const p = o.priority || DR_P.REACT;
  if(st.home){ window.homeSmileyAct(s, p); return true; }
  const a = drAnim(st.svg, { head: st.head });
  return a ? a.play(s, { priority: p, keep: o.keep, done: o.done }) : false;
}
function drSeqMs(name){ const q = drSeq(name); return q ? q.total : 0; }
// For tests and the preview.
function drAnimDebug(){
  let timers = 0, fx = 0;
  const runs = [];
  drAnims.forEach(a => { timers += a.timers.size; fx += a.fx.size; runs.push({ place: a.place, run: a.run ? a.run.name : '', p: a.run ? a.run.p : 0, frame: a.frame() }); });
  return { controllers: drAnims.size, timers, fx, listening: drInput.on, sweeping: !!drSweepTimer, state: drState(), mode: drMode(), task: drMind.task ? drMind.task.key : '', runs };
}

/* ---- The names the rest of the app calls (kept, now on the engine) ---- */
function drFaceSet(svg, name){
  const sheet = svg && svg.querySelector && svg.querySelector('.ds-sheet');
  if(!sheet) return;
  const x = String(-DR_FACE_W * Math.max(0, DR_FACE_FRAMES.indexOf(name)));
  if(sheet.getAttribute('x') !== x) sheet.setAttribute('x', x);
  drBrowSync(svg, name);
}
function drFaceBusy(svg){ const a = svg && drAnimOf.get(svg); return !!(a && a.busy); }
// An expression as a reaction (REACT unless given), e.g. the lock screen's smile.
function drFacePlay(svg, name, head, done, priority){
  const a = drAnim(svg, { head: head || null });
  if(!a){ if(done) done(); return false; }
  return a.play(name, { priority: priority || DR_P.REACT, done });
}
// His own rhythm on this face. Returns { act(kind), stop(), running }.
function drFaceIdle(svg, head, opts){
  const a = drAnim(svg, { head: head || null });
  if(!a) return { act(){}, stop(){}, running: false };
  a.startIdle(opts || {});
  return {
    // A reaction now: petting is DIRECT, everything else REACT unless given.
    act(kind, priority){ return a.play(kind, { priority: priority || (kind === 'pet' ? DR_P.DIRECT : DR_P.REACT) }); },
    stop(){ a.stopIdle(); },
    get running(){ return !!a.idle && !a.dead; },
  };
}
