# Dr. Smiley: how he moves

Moved out of `CLAUDE.md` so sessions read it only when they touch this.
Code is in `index.html` unless a file is named. Keep this in step with the code.

The art (`drsmiley/*.webp`) is described in `CLAUDE.md`'s file map. Rules:

- **Dr. Smiley moves only through his controller.** One `DrAnim` per
  character (`drAnim(svg, {head})`) owns his face frame, gaze, lean and
  effects, with priorities (`DR_P`: IDLE < GAZE < REACT < DIRECT). Ask it to
  `play()` / `talk()`; don't set frames or animate his pin yourself (the Home
  greeting only places him while he grows in, then plays `greet` on the
  engine). Interruptions walk through in-between frames (`DR_FACE_BACK`);
  a sequence whose consecutive frames aren't neighbours gets them filled in.
  Reduced motion, a hidden page and a detached svg are handled there.
- **Don't move him with a paused animation you seek by hand.** The Home
  greeting used to grow him in with a paused Web Animation whose
  `currentTime` was set every frame, while his breathing (a CSS animation on
  the same element) ran beside it. On an iPhone he could stay drawn at its
  first frame, 8% of his size, for the rest of the hello (never seen in
  Chromium). The entrance is now written straight onto him each frame
  (`placeFace` in `home-polish.js`) and breathing waits until he has landed
  (`.home-wave-entering`).
- **His size is one number per place** (`home-polish.css`): `--ds-k` for
  the dock button (Jose picked 58/48: his disc is the tab bar's height,
  centred on its middle line, 14px from the edge) and `--hw-size` for the
  Home greeting (1.5: a 90px face, centred on the name). Inside him
  everything is still drawn at the old size and scaled. His sway pins the
  pivot (`smileySway`: 50% 92% dock, 50% 85% Home; only the one on screen
  is pushed, and the unseen one's breathing pauses), so a scale must be
  moved back (dock: the bob's left/top; Home: `translate`), or he drifts
  up. When the tab bar tucks (54px) he shrinks by `scale: 54/58` and a
  `translate` worked out for that 50% 92% pivot, not by a new `--ds-s`
  (S2: nothing on the dock changes layout while it moves); his "Ask" tag is
  scaled back so it keeps its size. `tests/suites/dock-tuck.cjs` checks his
  disc's right edge and bottom stay put. In the greeting he has one fixed place whatever the name (block
  "Dr. Smiley's own place", end of `home-polish.css`; Jose's call): on a
  phone the name has the line under "Good morning" to itself (`--hw-line`,
  so a long name's smaller face sits on the same baseline) and he stands
  under it near the right edge (`--hw-left`: 48px in, Jose's pick B, clear
  of the lamp post), his thought cloud opening to his left
  (`createThought`, `is-left`); on a computer he is 48px in from the right end of the
  name's line, the cloud to his right. He is never resized for a name:
  `fitWave` shrinks a name too wide for its line instead.
- **His brows are separate pictures and glide** (`DR_BROWS`, Jose's pick
  2026-10-19, "movable brows"). `brow-l.webp`/`brow-r.webp` were cut out of
  his calm face; the forehead in `base.webp` and the bits of brow baked into
  the top of some face frames were repainted as skin. They sit over the face
  window (drawn after `.ds-face`), so a lowered brow covers the lid instead
  of hiding under the eye patch. By default each face frame picks a pose
  (`DR_BROW_OF`: up for lookU and laughs, one raised for lookUL/lookUR, a
  little down for reading and closed eyes); a sequence can hold one instead
  with `brow: [[ms, pose or null], ...]` (`composed` and `encourage` hold
  `caring`, inner ends up). The hold ends when the run finishes or is
  interrupted. A pose is a lift and a turn about each brow's middle, never a
  stretch, eased by a CSS transition (.17 s). Sizes were doubled after Jose
  saw the first ones on his phone ("they don't move much"; looking up is now
  4.2 drawing units, about 3.4 px on Home, and still clears every rank hat); Focused moves them 60%, Still
  and reduced motion change them without gliding. At rest there is no
  transform, so he looks exactly as drawn. `tests/suites/smiley-brows.cjs`.
  How the cut was made (re-run it if the base art changes): a dark-brown
  mask per brow, a smooth fill of the skin under it, the brow's own colour
  and edge recovered by unmixing against that fill.
- **He acts after the Disney principles** (Jose, 2026-10-19: "expressive
  like Disney characters"; *The Illusion of Life*). No twins: his left brow
  (your right, the winking side) goes a fifth further than the other
  (`DR_BROW_SIDE`), so no pose is a mirror image. Anticipation: a big raise
  from nearly level dips first for 70 ms (`DR_BROW_DIP`, Lively only).
  Follow-through: the brow glide starts .03 s after the eyes and overshoots
  before it settles (`cubic-bezier(.34,1.45,.64,1)`, .3 s). Acting beats:
  `greet` flashes the brows as he sees you; `think` knits them, the frames
  give the quizzical look, an "aha" lift as it lands (`drPerfMake` beats
  take a 4th item, a brow pose from that beat); `pet` opens with a
  startled take before the giggle; `worry` (the connection drops) and
  `surprise` are new; `composed` goes worried, then caring;
  `answerGeneral` raises one brow.
- **Squash and stretch (E3, 2026-10-19)**: Jose picked B (4%) from a
  preview of 0 / 4% / 9% (his Home greeting's old squish had been removed
  before, so it was shown first). Only `cheer` and `greet` ask for it
  (`squash: DR_SQUASH` in their Lively builds); `drSquashKeys` works it out
  from their head keys: a spring up (a rise of more than .9%) stretches him
  on the way, the top is his drawn shape, a low point (crouch, landing)
  squashes him. Width is 1/sqrt(height), so his volume stays the same, about
  his shoulders (`50% 90%`). It is a Web Animation on his picture
  (`svg.ds-art`), not on what holds him, so it never fights the lean; none
  where the picture is itself what leans (Ask's face), none joining part
  way, none in Focused or Still. Interrupted, he eases back in 140 ms
  (`squashStop`). His spring is only 1-2% of his height, so even 4% of
  squash is the larger movement: keep it at 4%. `tests/suites/smiley-squash.cjs`.
- **Four drawn faces (E2, 2026-10-19)**: `surprised` (eyes wide, an "O"
  mouth), `sad` (heavy lids, corners down), `worried` (eyes aside, a tight
  wavy mouth), `doubt` (his left eye squinted, a side smirk). Jose made them
  in ChatGPT from his calm face; source, prompts and how they were cut are
  in `docs/art/dr-smiley-faces/`. Used by `surprise` and `pet`'s startled
  take (surprised), `worry` (worried), `answerGeneral` (doubt, with the
  `doubt` brow pose) and `composed` (sad: the only sequence that uses it,
  so it stays rare; `smiley-brows.cjs` checks that). Each brings its brow
  pose in `DR_BROW_OF` and has a neighbour in `DR_FACE_BACK` (rest, blink1,
  halfL, wink1), so an interruption walks back through a real frame.
  **Held long enough to see (E4, 2026-10-20).** Jose couldn't find them:
  each showed for 0.26-0.7 s, at 48-90 px, at rare moments. Now each holds
  about a second (`surprise` 1.0, `worry` 1.1, `answerGeneral` 1.0,
  `composed` 1.0 s; the head and brow keys after it moved along with it).
  Two stay quicker on purpose: `pet`'s startled take 0.6 s (a take longer
  than that kills the giggle's timing) and the quiz `wince` about 0.65 s
  (it plays on every wrong answer). And `wow`: a study-streak milestone
  opens with the surprised face held 0.9 s, then the cheer (Focused: just
  the calmer cheer; an appointment: `ack`). The `surprise` sequence itself
  is still played by nothing. `smiley-brows.cjs` checks the holds.
- **Five performances, built fresh each play.** `DR_PERF` (greet, ack,
  think, cheer -- also called celebrate -- and wink; its code, with
  `drSquashKeys`, his mood and `drFaceFx`, is `features/smiley-performances.js`
  since 2026-10-24) sits in `DR_FACE_SEQ` as getters (that one line stays in
  `index.html`, after the table), so every play varies a little (side, amplitude, beats) with an
  anticipation, one main gesture and a recovery. Each builds its own Focused
  version (smaller, no laughter, no effects); Still uses its `still` frame.
  `drPerfSeed(n)` makes the variant repeatable for tests. Movement is only a
  tilt and a lift of what holds him: never a sideways slide; the only squash
  and stretch is E3's, on his picture (above). The Home greeting's old squish
  stays removed: he grows in whole and greets with `greet` on the engine. The one wink is his left eye, so a
  wink always tips toward it. Effects are short and land on the moment
  (`DR_FX_LIFE`: burst, glint, question).
- **His personality comes from task states, not timers.** `drTask(kind)`
  (available, attentive, processing, answering, celebrating, uncertain;
  offline, appointment and resting follow the phone) is one state for the
  whole app; each controller runs that state's hold (thinking while Ask works,
  reading an answer with you) at `DR_P.TASK`, so idle can't interrupt it.
  React by meaning: `smileyReact(kind)` for team news, `smileyStudy()` for a
  study result, `askReact()` for an Ask outcome (`askOutcome`: verified only
  when a source checks out locally, never `fromHub` alone; the card's
  provenance label is untouched). No mouth movement for silent text: `talk()`
  is for real audio only. Lively / Focused / Still is `setSmileyMode`
  (`ih_smileyMode`); the phone's reduced motion always means Still.
- **Home's decor: what loops, what settles** (S1 in `docs/PLAN.md`, then
  Jose's call, 2026-10-15). The petals and the heartline are part of the
  look and loop forever; everything else settles. Petals on iPhones and
  Safari (WebKit): the old animated elements, one per petal, no
  `will-change` (`PETALS_AS_DOM`: the worker painter crashed WebKit in CI).
  Elsewhere: one canvas per place (banner, rank card), painted from a Web Worker on an
  OffscreenCanvas (`petalPainter`, home-polish.js, S1b; the same painter
  runs on the page where a phone lacks OffscreenCanvas), drawn from the old
  keyframes' math with the same seeded values and artwork. The page only
  tells it sizes and whether each place is seen (`syncPetals`); it stops
  while hidden, scrolled away, and rests under reduced motion. They used to
  be one animated element each (Chrome re-layered Home every frame); a
  frame loop on the page was worse still (a full Home frame 60 times a
  second), hence the worker. Settles: the Ask badge's breeze
  (`BREEZE_S`, then `askBadge`'s loop ends once it hangs still; a pet or a
  new hello swings it again), one halo glow per arrival (`askHalo`), the
  rank card ring glows on arrival only. Breathing, drift and the halo's turn
  are compositor-only. Don't add an endless JS loop on the page (the petals'
  runs in their worker, only while they are seen) or per-item `will-change` on Home;
  `tests/suites/home-rest.cjs` checks it.

## In a quiz (F1, 2026-10-20)

Jose's film brief: a happy bounce on correct answers, a small wince on wrong
ones, a celebration at streak milestones. `answerQuiz` calls
`smileyAnswer(right)`: `bounce` (a crouch, a hop up with a brow flash, a
smaller second hop, a settle; about 1.2 s) or `wince` (a fast blink, drawn
back, down and turned away on the E2 `worried` face, then `caring` brows
and a small smile; about 1.35 s). Both are `DR_PERF` entries, built fresh,
half size in Focused, one frame in Still; in an appointment `bounce` becomes
`ack` and `wince` nothing (`DR_TONE`). A 3/5/10 run of right answers keeps
its bigger `smileyStudy('streak')` instead of a bounce; exam mode has no
feedback, so no reaction. The first answer of a day that makes the study
streak 3, 7, 14, 30, 60 or 100 days plays `wow`, a surprised take and then the cheer (E4; `STREAK_DAYS`,
`bumpStreak`, `smileyStudy('days')`).

**He was never on screen in a quiz before this.** The dock steps aside on
Practice for the campus's own Dr. Smiley, and starting a quiz redraws
`#content` in place, which the dock's observer doesn't see, so he stayed
away. `renderContent` now queues one `smileyRider.sync()` per frame.
Suite: `tests/suites/smiley-quiz.cjs`. Upgrades wait on Jose's art: head
and shoulders as separate layers, two arm poses, happy eyes-closed and
wince faces.

## Full body: the cutout rig (2026-10-23)

**In the app (2026-10-24, Jose's picks from mockups on his phone's
screen).** He stands full-length in two places; everywhere else he is still
the head (the dock, Ask, the lock screen). **Home:** at the banner's bottom
right, on the grass by the lamp post, 216 px tall (size A; his face about
the size the head alone was), the quote wrapping to 56% beside him and
Watch moved to the middle (`home-polish.css`, block "Hello: Dr. Smiley
full-length"). `renderHome` draws the host (`.home-body`, in
`.home-greeting`); `initHomeGreeting` (`home-polish.js`) mounts the rig in
it, hides the head (`.home-greeting.has-body .home-wave-icon`; the marker sits on the greeting, which a start-up repaint keeps, because `#content`'s classes are reset and once showed head and body together; the head stays in the
markup as the hello's anchor for the name pen and `fitWave`, its grid
column closed so the name has the row) and wires him: a tap opens Ask the
Hub, a double-tap on his head (the top 44%) the HUMC Brain, press and hold
a pet; Enter or Space on him as a button. He arrives with the hello
(`is-in`, set in `placeFace` when the head used to grow in: a fade and a
scale over .46 s) and greets on the rig at `GREET_AT`; `actNow` (every
sequence Home asked of the head: reactions, the pet, the scroll-back nod)
goes to his body (`DR_BODY_ACT`); his thought cloud anchors to his head;
`smileySway` leans him on scroll. **A quiz:** `renderQuiz` puts the host
(`.quiz-dr`) in the card, a float at the top right, 110 px tall, so the
section label and the counter sit beside him and the question starts below
his feet (`app.css`); `renderContent` mounts it after the practice screen
paints (`drBodyMountAll`), carrying the one body from the old card to the
new so a bounce is not cut by the next question, and takes it down with
the quiz. **How the app reaches him** (`features/smiley-body.js`):
`drStage` returns the body you can see before the dock (`drBodyStage`:
mounted, on screen, not hidden), and `drPerform` plays the asked sequence
as his body's performance (`DR_BODY_ACT`: greet, ack and its kin, think,
cheer and its kin, wink, bounce, wince, shrug for composed and surprise,
read for the answer, doze; an unknown name is a nod); so `smileyAnswer`,
`smileyStudy`, `smileyReact`, `drCelebrate` and a task's `perform` reach
him unchanged, and `DR_TONE` (Focused, an appointment) still applies first.
The task state on `<html>` (`data-dr-state`) is his held state
(`drBodyStateSync`: attentive listening, processing thinking, answering
answering, celebrating celebrating, uncertain uncertain) and his idle level
(`DR_STATES[state].idle`), with the resting state's one doze. His mode is
the app's (`drMode()`, read each frame; `drmodechange` restarts a held
state in the new mode); reduced motion is Still. The dock steps aside
while a body is in view (`smileyInView`/`smileyElsewhere` count `.db-app`)
and comes back when it scrolls off; his breathing pauses off screen
(`is-offscreen`). Shared styles (`.db-host`: breathing, drawn poses that
swap with no fade, Still, reduced motion) are in `app.css`. `sw.js`
precaches the rig, its Hub side and its layers; the rig is network-first with the app code.
`tests/suites/smiley-body-app.cjs`. User Guide: `smileybody` (and the
first "New lately" card). The viewer (`drsmiley/body.html`) stays unlinked.

**The drawn poses are in (2026-10-23, the same evening; a 2D redraw was
tried first and dropped for likeness, `docs/art/dr-smiley-2d/prompts.md`).**
Jose: the body animated the way his face is, drawn pictures of the same
3D him in each pose, swapped, with this rig moving the arms between. He
ran four prompts in ChatGPT (`docs/art/dr-smiley-body/prompts.md`): wave,
fist pump, think, shrug; all four came back at the master's size, 0 to 4 px
off, colours within a few points. `layers/cutframes.py` cuts each into a
frame on the master grid (`drsmiley/body/pose-*.webp`, boxes in
`poses.json` and `DR_BODY.pose`): only content changes, coat over coat is
left to `body.webp`. In the rig each frame exists twice, as drawn (`-l`,
his right arm on the picture's left) and mirrored about his middle
(`DR_BODY.mirrorX`, `-r`), so either side can use it; `wave`, `fist-pump`
and `shrug` sit behind the coat (the arm comes from under the shoulder),
`think` in front (the folded arm, the finger on the chin). The pose joints
`frameL`/`frameR` name the frame shown on each side (swapped at a beat's
start, like a face frame) and `frot` wags it about its pivot; while one
shows, the cutout arms it stands in for are hidden, with a 120 ms
cross-fade (CSS on `.db-pose`/`.db-arm`; the viewer has it, the app's
copy goes in `app.css` when he is wired in). How a gesture uses one: the
cutout arm swings to the frame's `at` (its raise and bend), the frame
takes over there, holds or wags, hands back before the arm comes down.
`greet` waves with the drawn hand (3 wags of `frot`), `cheer` pumps two
drawn fists (one mirrored) from the top of the jump, `think` holds the
drawn finger on the chin, `shrug` the drawn palms; `ack`, `wink`, `bounce`,
`wince` and the walk stay on the cutout arms (an open hand is right for
them). **The clipboard** (2026-10-23, late evening; Jose ran the prompt):
both hands on a plain clipboard at his chest, over the coat, so
`cutframes.py` takes it as a feathered band of the figure from the collar
to below the hands (`band: True`, both sleeves in it); it stands in for
both cutout arms (`arms: ['L', 'R']`, drawn in front) and `frot` tilts it
about the chest. `read` (a new performance) brings it up, runs his eyes
down it along a line and back, nods and brings it down; the held state
`answering` reads the answer on it. **The point** (2026-10-24): the arm
straight out at shoulder height, the index finger out, cut like the wave
(a back-layer arm, as drawn and mirrored); `point` (a performance, with
`side` for which way: "look here") glances that way, swings the cutout
arm out, swaps the finger in, bobs it twice, holds on it, and comes back. Still shows the drawn pose held. **The leg plates** (the same
evening): `crouch.png` (knees bent, feet in place) and `jump.png` (in the
air, feet tucked) came back on the same grid (4 px off); `cutframes.py`
cuts both legs whole below the hip line (the floor shadow out, the top
rows repeated up under the coat, the scrub blue shifted to the master's,
which ChatGPT had rendered brighter) as `pose-crouch` and `pose-jump`,
one copy each (`legs: true`, no mirror), drawn right after the cutout legs.
`frameLegs` names the one shown; both cutout legs hide meanwhile. `cheer`
and `bounce` go crouch, then jump at the top of the hop (Focused keeps
the crouch, never tucked feet on the ground), crouch again at the landing
squash, then back. **The thumbs-up** (the same evening, Jose's pick for the
top of the quiz bounce): its sleeve lies over the coat, where colour cannot
tell sleeve from coat, so `cutframes.py` cuts it as a feathered band of the
picture (`band: True`, a 6 px feather melting into the coat beneath) and
the rig draws it in front; `bounce` folds one cutout arm up during the hop
and swaps the drawn thumbs-up in at the top (as drawn or mirrored), pushes
it up a little on the second hop, and hands back at the settle. Not run
yet: `body-noarms`, `pockets`, `crossed`, `arms-up`; nothing needs them.

**The wave's breakdowns, and a cleaner cut (2026-10-24, a new chat).** Jose
ran the first three animation prompts
(`docs/art/dr-smiley-body/prompts-animation.md`): `wave-rise` (the arm on
its way up, elbow leading, the hand trailing below it), `wave-in` and
`wave-out` (the hand by his head tipped in toward it and out away from it,
the wag's two extremes). All three came back within a pixel of the master,
colours a few points off. `greet` is now drawn the way a hand animator
times it: the dip, the cutout arm flicking up a few frames into the drawn
rise, a swap to the hand flung out (the overshoot drawn) that settles on a
spring, the wag as drawings on twos (out, `wave` between, in, `wave`
between, about 3 a second, a degree or so of `frot` sway between them),
and down through the rise drawing, the hand dropping first, into the
cutout arm. **Drawings swap, they never fade** (`DR_BODY_FADE` is 0, no
transition on `.db-pose`): the 70 ms fade showed a half-transparent hand in
the air for four frames at each end, and between two drawings it would
have shown two hands at half; the piece a frame stands in for is cut in
the same paint, and `body-rig.cjs` checks one drawing per side at a time.
**The cut, redone after a look on navy.** On white every arm frame looked
fine; on the viewer's navy (as on Home's photo) the single arms had holes,
torn edges and a notch at the shoulder, the shrug's forearms were missing
(floating hands), the thumbs-up sleeve was blotchy and the clipboard had a
hole showing his scrubs. The cause was the rule "keep only what differs
from the master": the master's hanging sleeve is coat-white, the raised
sleeve over the same spot is coat-white too, so it was dropped, and that
hanging sleeve is hidden while the frame shows. Now (`arm: True` in
`cutframes.py`) a back-layer arm frame takes everything of the figure on
its side that the body and head pieces do not cover, solid (holes up to
1500 px filled; a bigger enclosed pool is wall, as between wave-in's arm
and his head; a crack the key opens in a sleeve's shaded underside is
bridged, away from the hand); thin slivers past the body's edge and hair
or ear past the head piece are dropped (they would stay put or swing
loose); the two frames swung far by `fsw` (fist pump about 50 degrees,
point about 78) also leave out the shoulder's cap above the body's
shoulder line and the coat beside his neck, which swung up as a white
flap, while the wave's frames (12 at most) keep the drawing's shoulder; the sleeve's grey underside
stays (it is the sleeve's own shading, not a shadow on the wall; an
attempt to strip it as one made the thumbs-up streaky and was undone). The
band cuts (clipboard, thumbs-up, think) fill enclosed holes, and outside
the body piece take the figure solid; the thumbs-up picture's sleeve is
shaded nearly the wall's grey, so it is keyed tighter (`near=12`, keeping
only the one big shape). `layers/trimpieces.py` fixed two pieces: the head
carried both coat shoulders and grey shaded coat beside the neck under the
chin, ragged and full of holes (frayed white bits above his shoulders even
at rest on a dark background, a torn strip once an arm went up, flecks
swinging out when his head turned), and now keeps only skin there (his jaw
and neck; the body piece draws all the coat); and the body carried a few islands of the right
cuff that floated by the hem whenever that arm was hidden, now moved into
`arm-fore-r.webp`. Review clips: `tests/tools/body-clip.cjs` films the
viewer frame by frame (`BG=is-navy`, `ROOT=` for a before).

**The cheer, drawn (2026-10-24, the same chat).** Jose ran `cheer-load`
(fists pulled low by his hips), `cheer-mid` (fists rising at shoulder
height) and `cheer-up` (both arms up in a V), 1 to 2 px off the master.
They are two-arm frames (`arms: ['L', 'R']`, back layer, cut like the
shrug); `cheer-up` reaches above his head, so its region starts higher, and
there the wall each fist shades reads 30 levels darker than the rest, too
far for any key, so above y 400 only skin and hair are kept (`skinabove`).
Arm cuts now keep only pieces joined to the body piece (patches of the
darker wall at the cheer pictures' edges floated beside him). `cheer` is
drawn throughout: crouch and load, the rise as he springs, the V at the
top, the landing drops the fists to the rise and they fly up again, one more
pump, down through the rise and the load into the cutout arms; as drawn or
mirrored at random; Focused has no jump and the fists stop at the rise.
`cheer` returns `land` (where the landing ends), and `celebrating` enters
with the cheer up to there, then steps through the rise drawing into its
one-fist pump (the arm that goes down never jumps from overhead to his
side). The clip tool films held states too (`state:celebrating`).

**The point, drawn (2026-10-25, a new chat).** Jose ran `point-load` (the
arm bent and pulled back, the hand by his shoulder, finger already out) and
`point-reach` (the arm stretched out a little above the shoulder), both 4 px
right and 1 down of the master. One-arm frames on the back layer, cut like
the wave's, but with the tighter key (`near` 12): the sleeve's shaded
underside is nearly the wall's grey and the usual key tore it. The reach
also drops anything pale and colourless left of x 120 (`wallleft`; the wall
darkens toward the picture's edge, behind the fingertip) and its coat flank
below y 668 (`below`; uncovered by the raised arm, shaded too near the wall
to cut clean, and the body piece draws that side anyway). `point` is now
drawn throughout: a glance and the cutout arm drawn back; the load, cocked
while he leans away (about 200 ms with a beat, the anticipation); the reach
snapped in 4 degrees past its place (frot, about 17 px high at the
fingertip) and sprung back; two bobs and the hold; then down the way the
hello comes down: the old one-drawing `point` (straight out at shoulder
height, 20 degrees under the reach) for a few frames, the wave's rise (the
hand dropped below the elbow, the finger let go), the cutout arm past
hanging and back. The old `point` swung by `fsw` far enough to reach the
cutout lifted its cut shoulder as a square flap, and a cutout arm shown
half raised reads stiff with its open palm; neither happens now. The
still pose is the reach. `cutframes.py` takes names (`python3 -I
cutframes.py point-load point-reach`) and recuts only those, keeping the
rest of `poses.json`.

**The mirrored side's seam (same day).** The body piece is not symmetric:
his left shoulder edge (the picture's right) sits 7 to 23 px further in than
the mirror of his right. A one-arm frame cut to fit the picture's left left
that sliver open when shown mirrored: a navy line along the coat from collar
to armpit, on every mirrored wave and point (half of them, at random). The
one-arm frames (`single` in `cutframes.py`: the wave's four, the fist pump,
both points and the old point) now run on 26 px under the body's outer edge
between y 540 and 700, hidden by the body on their own side and filling the
gap on the other. Their boxes in `DR_BODY.pose` grew to match.

**The thinking, drawn (2026-10-25, the same chat).** Jose ran `think-rise`
(his right hand on its way up at chest height, the finger starting to
point, the other arm starting to fold) and `think-tap` (the finger lifted
off the chin), 5 and 6 px right and 1 down of the master. On navy the old
`think` turned out sleeveless: it was cut as what changed against the
master, and a sleeve lying on the coat is white on white, so both sleeves
were dropped where they lay on him and the cutout arms are hidden; its cuff
was torn too. All three are now cut whole (`torso` in `cutframes.py`): his
torso from the shoulders to y 960, solid, in front of the body, faded into
its coat over the last 40 px; over the head piece only the hand (skin that
differs), never the grey the drawing's own head leaves; above the coat's
shoulder line (`TOP`, the body piece's top per column, only above y 600)
only skin, since the wall between hand and face is the coat's grey; the
sleeve's shaded edge closed (binary closing 8); coat and scrubs moved to
the master's colour (the drawings' scrubs ran 36 to 57 levels darker); the
rise drops a loose patch of wall past its elbow (`drop`). These drawings
carry his coat, so they never slide (`fy`) or turn (`frot`), and they play
only as drawn: his coat is not symmetric and a mirrored torso landed its
pockets and front edge beside the body's own (`asDrawn` on a held state;
`think` takes side L). `think` is drawn throughout: a breath in (no cutout
arm: it can only swing out sideways), the rise, the finger to the chin
settling on a spring, the hold, two taps (the tap drawing and back), the
aha, down through the rise into the cutout arms hanging with a small bend.
`thinking` enters and leaves the same way and taps with the drawing. The
clipboard (`read`, `answering`) is cut as an older feathered band and shows
similar seams on navy (sleeve ends, the band's bottom); next.

**The clipboard, cut whole (same chat).** `clipboard` is recut the `torso`
way (to y 950), with every enclosed hole filled (`fillall`: the board's grey
face reads as wall) and the head rule only above the chin (`faceto` 600:
the board stands in front of his neck, which the head piece covers down to
about y 720). The shoulder-line rule now holds beside the neck only (x
under 470 or over 650: at the neck the body's top is the scrubs' V). Like
the thinking drawings it never slides or tilts and plays as drawn only
(`answering` has `asDrawn`; `read` takes side L). Until Jose's
`clipboard-low` drawing (the board at waist height on its way up) gives it
a way up, the board comes up at the bottom of a small dip with a blink,
and goes at the bottom of another; reading along a line leans his body a
little instead of tilting the board.

**The clipboard's way up (same chat).** Jose's run of `clipboard-low`
came back at two heights, both kept: `clipboard-low` (the board at his
hips) and `clipboard-mid` (a little higher), 6 and 5 px right, 2 down.
`read` and `answering` now bring the board up by drawings (low, mid, chest)
and take it down the same way. Their wall is blotchy, so they use a local
key (`localkey` 80: the wall's own shade estimated at every point from the
wall well away from him, a wider estimate where the near one has no data;
the first try left grey wings where the master's arms hang) and stay
inside the master's outline (`within` 12). Their coat is drawn shorter and
narrower than the master's and doubled the hem, so they fade out above it
(to y 1040) and only the board goes on down whole (`keep`). Colour is now
matched over the whole torso from y 600 (near the bottom alone the board
covered the scrubs, which stayed 50 levels dark). Seen in this review and
still open: the standing cut itself shows a light strip under the coat's
hem and a white fringe down the trouser edges on navy (the leg pieces),
at rest.

**The standing cut's edges (2026-10-25, a new chat).** On navy, at rest,
the legs showed a light strip under the coat's hem and a white fringe down
the trousers and shoes. The strip: `export.py` cuts the body at y 1066, but
the coat runs on to about y 1080, so its last rows were in the leg pieces,
and each leg's top (repeated upward behind the coat from y 1076) was coat
white too, showing whenever a leg swung. The fringe: the key's soft edge
keeps the wall's pale grey mixed into the outer few pixels. `layers/trimedges.py`
(run after `export.py` and `trimpieces.py`) moves the hem's coat pixels
into the body piece, brings back the coat's two lower corners from the
picture (the cut had squared them off), makes each leg's top its trousers'
blue from the first trouser row up, drops the shaded wall between the legs
under the coat (a grey violet that read pale) and the floor's shadow beside
the right shoe, and gives every edge pixel of the legs, and of the hands
below the cuffs, the colour of the nearest pixel 4 px inside. The right
forearm also lost a sliver of shaded wall beside the coat. Boxes in
`DR_BODY.box` follow (body 376 x 504, legs re-cropped). body-rig 158,
smiley-body-app 18.

Jose's standing picture (`docs/art/dr-smiley-body/body-master.png`) cut
into layers by code (`docs/art/dr-smiley-body/layers/build.py`), since a
cloud session has no image generator; the drawn poses from
`docs/art/dr-smiley-body/prompts.md` (a real fist, a finger to the chin, a
clipboard) come later, when Jose runs them. **Nothing in the app shows him
full-length yet** (Jose, 2026-10-23: "fully animated first, decide where
later", then placed on 2026-10-24: above); the viewer is `drsmiley/body.html`, not linked from anywhere, and
`tests/suites/body-rig.cjs` checks that stays so until the decision.

- **The pieces** (`drsmiley/body/`, in the picture's own pixels, 1070 x 1470;
  the pivots in `rig.json` and `DR_BODY` in `drsmiley/body.js`): his head
  is the app's own (`head.webp`: `base.webp` above the chin, its sliver of
  coat removed, a skin neck tube behind, on the same 480 x 600 grid, so the
  face strip, the brows and the rank hats fit it unchanged; placed at scale
  1.0881); the torso and legs with no arms (`body.webp`, the floor shadow
  keyed out, the coat's edge under each sleeve relit from the coat beside
  it); each arm as an upper arm and a forearm with round caps at the
  shoulder and elbow; each leg, its top repeated up under the coat. Drawn
  back to front: legs, arms, head, body, so the coat covers every joint and
  the collar covers the neck. At rest they compose back into the picture
  (mean difference under the chin 7.6 of 255; the suite checks under 12).
- **How he moves** (`drBody(svg)`): the same shape as his face's acting. A
  performance is a list of beats `[ms, pose patch, ease]`, each eased from
  the pose the one before reached (from the live pose for the first, so an
  interruption blends, never snaps; a drawn pose the interrupted gesture
  was showing hands back at once, or it stayed up through the whole new
  gesture: two waving hands, fixed 2026-10-23), built fresh each play with the side,
  sizes and timing varied (`drBodyRand`, `drBodySeed(n)` for the checks).
  Joints: the root (a lift `y`, a `lean` and the squash `sx`/`sy`, all about
  his feet), the head (a turn about the neck, a `lift`), each arm's raise
  (`aL`/`aR`: 0 hanging, 90 out, 170 up) and elbow bend (`fL`/`fR`), each
  leg's swing and lift, the face frame and the brow pose. Limits
  (`DR_BODY.limit`) clamp what is drawn, so a spring past the mark never
  shows a cut edge. Easings: `out`, `in`, `inOut`, `linear`, `snap` (an
  anticipation's release) and `spring` (about 7% past, then settled:
  follow-through). Only transforms move; his box never changes.
- **Performances** (`DR_BODY_PERF`): greet (a dip, the drawn rise with the
  elbow leading, the hand flung out at the top, brows flashed, three wags
  as drawings tipped in and out, down through the rise drawing), ack (a nod with an
  open hand), think (a hand to the chin, eyes up away from it, the "aha"),
  cheer (drawn: a crouch with the fists loaded low, the rise, the V at the top of the jump, the fists pumping on the landing),
  wink (his left eye, a "hey you" of the right hand), shrug (palms up,
  doubtful), read (the drawn clipboard up, eyes down it, a nod, down), point (a
  glance that way, the drawn finger straight out, two bobs, a hold),
  bounce and wince (the quiz pair), doze (eyes closing slowly, head and
  shoulders sinking, one slow breath asleep on the `sleep` frame, a jolt
  awake, a look around; the phone's resting state, 2026-10-24), walk (`steps` paces, legs
  alternating, arms against them; returns `dx`, how far he went). Focused
  plays the same beats smaller (about 0.55) with no jump; Still holds the
  one pose in `still` for `stillMs`; reduced motion is Still.
- **Held states** (`body.state(name)`, `DR_BODY_STATES`; 2026-10-23, Jose's
  pick after the previews): what he does while something goes on, for as
  long as it goes on, the way his head holds a task state in the app
  (`drTask`): `listening` (leaned in a touch, head tipped, one open hand a
  little forward, slow tilts, a nod now and then), `thinking` (the drawn
  finger on the chin, eyes up and away from the hand wandering, a slow blink
  every other beat, a tap of the finger; slower after 9 s; the exit is the
  "aha"), `answering` (the drawn clipboard in both hands at his chest, eyes down
  on it along a line and back, the board tilting a little with them, a nod
  now and then), `celebrating` (the cheer, then a happy bob with one drawn fist
  pumping), `uncertain` (shoulders up, both open hands half out, a doubtful
  face and never a cheerful one, a small re-shrug now and then). Each is an
  entry, then a hold built one group of beats at a time (`play` with
  `keep`: from the live pose as it is, drawn frames included, ending where
  its last beat left him), until `state(null)` plays the exit or another
  state replaces it. A gesture (`perform`) cuts in; it ends at rest and the
  hold carries on (each group names its base pose again in its first beat).
  Focused: the same, smaller (k .6). Still: the one pose in `still`, held;
  a gesture's one frame, then back to it. The viewer's second row of
  buttons; `tests/suites/body-rig.cjs` checks each holds 4.5 s without a
  gap inside the limits, Off returns to rest with every drawn pose hidden,
  a nod during thinking resumes it, Focused smaller, Still one pose.
- **Rest life** (`drBodyIdle`): breathing is a CSS animation on
  `.db-breath` (the compositor; `transform-box: fill-box`, about the hips;
  none in Still), blinks every few seconds (face frames stepped by timers,
  no frame loop), now and then a shift of weight or a glance with the head
  (a short run of the rig's loop), only while seen and nothing else plays.
  With `quiet` (Home, where what settles stays settled: `home-rest.cjs`
  counts the page's frames at rest) the rest beats are face-only on
  timers: the eyes glance aside, or a smile. Levels, as the app's idle levels for his head (`DR_IDLE_LEVEL`;
  `stop.setLevel`): `full`, `calm` (blinks and a glance now and then:
  offline, resting), `blinks` (attentive, uncertain, an appointment),
  `none`; `stop.doze()` plays the doze (the resting state's one doze when
  the phone has been quiet a while). The viewer's "Rest" switch.
- **Squash and stretch**: the cheer and the bounce, 4% and 3.5% of his
  height, width 1/sqrt(height) as E3; never more (the suite checks).
- **Known limits of the cut**: the cutout hands are open palms, so the
  gestures with a fist, a finger or upturned palms use the drawn frames
  above and the cutout arms only for the way there and back; the arms turn
  only in the picture's plane; the legs are one piece each, so a walk is a
  stylised bounce-walk from the front; the quiz bounce and the cheer use
  the drawn `crouch` and `jump` plates for real knees.
