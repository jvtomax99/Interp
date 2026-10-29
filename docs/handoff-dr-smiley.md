# Handoff: Dr. Smiley full body (started 2026-10-23, from the chat that built PR #135)

Lives on branch `claude/dr-smiley-body-home` (storage only: `claude/`
branches never deploy, no PR open). It was `docs/handoff.md` until
2026-10-25, when `main`'s handoff (the split of `index.html`) met it in a
merge; the two lines of work keep separate files. Jose's goal, his words:
fully perfect the animation before we replace Dr. Smiley. Don't ask him to
push or OK anything; keep improving until it is good to go.

A new chat reads this and the docs it names, not the old chat. Open by
telling Jose, in plain words, what is being worked on and the goal, then
wait for his direction (two paths below).

## What is being worked on, and the goal

Jose wants Dr. Smiley fully animated as a whole body, in the style his
head already acts in the app (beats with anticipation and follow-through,
Lively / Focused / Still). **His call, 2026-10-23: animate him fully first;
where he stands full-length in the app is decided later.** So nothing in
the app shows him full-length yet, and a check keeps it that way
(`tests/suites/body-rig.cjs`, last check).

## State

- **PR #135** (branch `claude/dr-smiley-body-prompts`, a change waiting
  for Jose's OK): the cutout rig, his acting, and a viewer page. Read
  `docs/features/dr-smiley.md`, section "Full body: the cutout rig", for
  every rule and the known limits. Files: `drsmiley/body/` (the layers and
  `rig.json`), `drsmiley/body.js` (the rig as SVG, the joint engine
  `drBody`, `DR_BODY_PERF`: greet, ack, think, cheer, wink, shrug, bounce,
  wince, walk; `drBodyIdle`), `drsmiley/body.html` (the viewer, not linked
  from the app; once live: `/drsmiley/body.html`).
- **How the art was made:** Jose sent his standing picture
  (`docs/art/dr-smiley-body/body-master.png`). No image generator runs in a
  cloud session, so it was cut into layers by code
  (`docs/art/dr-smiley-body/layers/export.py` makes `drsmiley/body/`;
  `seams.py` found the sleeve seams first). The head is the app's own
  (`base.webp` above the chin, on the same grid), so all 30 faces, the
  brows and the rank hats fit it unchanged.
- **Known limits of the cutouts:** the hands are open palms whatever the
  pose (the fist pump and the chin rest read as "hey" and "hmm"); arms
  turn only in the picture's plane; each leg is one piece (the walk is a
  stylised bounce-walk from the front).
- **The prompts** for drawn poses (`docs/art/dr-smiley-body/prompts.md`,
  Step 2 and 3): a torso without arms, a T-pose, arms up, a fist pump, a
  wave, thumbs up, pockets, think, shrug, crossed, point, clipboard,
  crouch, jump; two faces (happy eyes-closed, wince). Jose runs them in
  ChatGPT on his phone (upload `body-master.png`, paste the opening, add
  one pose line). Not run yet.

## Where it stands (2026-10-29, eighth chat): read this first

**Jose is not yet satisfied; nothing below is judged right until he says
so.** Asked what reads wrong, he picked "head looks stuck on" (buttons:
head stuck on / moves stiff / flashes / inconsistent). Measured on his
phone's size, frame by frame, the fault was the head tracker: it took the
blob of skin and hair for the head, so a hand at his face joined it. Two
effects: his own head lurched (the wave: the centre slid 12 px, the tilt
5 to 16 degrees, the size 4%, over six frames and back, twice, as the
hand passed), and `behead.py`, cutting the frame's own blob, cut the hand
off with the head: the thinking hand at his chin was gone for a second
(black blotches on his chest where it was), the thumb beside his face in
the thumbs-up, a fist passing his head in the cheer, the waving hand
twice. That is the "glitch". Fixed this chat: `headtrack.py` follows the
hair alone (centroid, principal axis, area; bad frames bridged), and
`behead.py SRC DST` cuts one shape (the first frame's head) carried by
that track, so hands stay (a hand over the head's shape reads as behind
it). All five clips re-cut from the keyed frames (git 93c1d5f). Wave:
biggest head step 1.7 px a frame (was 12). Then a second fault the flat
banner showed: a wedge of background beside his chin at the scrubs' V
when the clip's head dips (its bigger jaw had covered the collar);
`behead.py` now carries the collar up behind the head (`FILL`, `SPAN`).
Then Jose's pick among the open items: the pop at a move's end. Measured:
the film's rest and the rig's rest match in size and place; the jump was
the rig caught mid-breath (arms 1.6 degrees out, chest 1.2% taller, a
sway). `drClipPlay` now settles the rig to neutral over 150 ms before the
swap and wakes it from neutral after (`DR_CLIP_SETTLE`), and blends the
film's last frame into its first over 200 ms before the swap
(`DR_CLIP_BLEND`, the film drifts a little), and the swap is a 100 ms
fade of the rig's pieces by a CSS filter over the solid canvas
(`DR_CLIP_FADE`, `is-clip-fade` in `app.css`; never fade the canvas with
them, the body goes see-through). The end cut's jump went 4.6 to 3.6 to
2.1 over three frames, the start 3.0 to 1.8; both now below the film's
own motion (fastest frame 4.3). The remaining difference is the film's
coat and hands drawn a hair off the rig's pieces; the two bigger ways
out (the rig's pieces from the film's first frame; the film's rest frame
as his rest body) are no longer worth their cost unless Jose still sees
the swap. Filming on Home: `tests/tools/home-film.cjs` (30 fps, one PNG a frame,
`BG='#ff00ff'` for a flat banner to count holes). `smiley-body-app.cjs` checks
every track (a step budget per clip; the hop and jump move the head fast). Videos sent: the wave and the think, before/after.
Details: `docs/features/dr-smiley.md`, "Clips", the paragraph "followed
by his hair alone". Then his head at the films' size (Jose's pick among three, 2026-10-29):
the fingers touching his chin in the think had been cut away with the
film's head (the stump plus the collar fill read as a blob under his
chin), because his head was 10% smaller than the film's; `DR_BODY.head`
and `rig.json` now scale it 1.10 about the chin (scale 1.1969, at 280.9,
23.8; the picture's numbers kept beside). Then the notch under the jaw's sides when the head tilts: an oval in the
jaw's shadow colour behind the head image (`.db-neck`), measured closed.
Still open (not measured as
faults): the cheer's rest head is 3.7 px right of the rig's (`FIT`), a
small shift at its cut; the clip's head turns a little (yaw) and his
cannot. To redo a clip:
`headtrack.py` on the keyed frames, then `behead.py <keyed> drsmiley/clips/<move>`.

## Where it stood (2026-10-29, seventh chat)

**Jose is not satisfied. His words, on the last video: "He glitches. His
movements aren't natural and it's inconsistent." Then: "This needs a lot
more work." Treat every fix below as unproven until he says otherwise; do
not tell him it is fixed, show him and ask.**

The build: his big moves are filmed clips (Sora, from his master picture;
`docs/art/dr-smiley-clips/prompts.md`), keyed to see-through frames
(`layers/keyclip.py`, checked frame by frame by `layers/checkclip.py`),
played over the rig by `features/smiley-clips.js` (`DR_CLIPS`: greet,
cheer, think, wince, bounce). The video tool draws his face differently
(rounder, bigger eyes), so his own rig head rides the clip's body: the
clip's head is cut off every frame (`layers/behead.py`), his head is moved
to the clip head's place (`head.json`, `layers/headtrack.py`) and turned
and sized by the clip head's tilt and size (`head-pose.json`, from the
hair's place, measured before beheading), about the neck; his face acts
along (`DR_CLIP_FACES`). The hand-off is a cut in one paint (`is-clip`);
cross-fades showed a ghost frame. The rig keeps the small life (breathing,
blinks, glances, nod, shrug, clipboard) and the held states.

What Jose saw and what was done, in order: a face switch at a clip's start
(own head over the clip); the clip's head peeking out around his (beheaded);
a ghost frame at each quiz move's start and a head carried level over a
tilting body (the cut; the head follows the clip head's tilt and size). The
last video was measured frame by frame (every frame, a change-per-frame
scan and zooms) and showed no ghost; **Jose has not yet said whether it is
right.** Tools for the next look: extract the video at 30 fps, scan the
change per frame in his box, zoom on the flagged frames (the scratchpad
scripts are gone with the chat; write them again, it is ten lines).

What remains uncertain and worth checking first with him on the phone:
whether the own-head approach can ever look like one drawing (the body is
painted, the head is the flat rig; lighting and line differ), whether the
clips' motion itself is natural enough (they are the video tool's, not
drawn), and whether the 150 ms swaps at a clip's ends read as cuts. The
alternatives already costed: accept the clip's own face everywhere and
redo his head from it (big), a 3D him in Blender (`docs/art/dr-smiley-3d/`,
proven to look like him, Jose set it aside), one long film (not reactive,
too heavy). Keep sending phone videos after each step; he judges on his
phone. Nothing is live; the branch never deploys.

## Where it stood (2026-10-27, sixth chat): read this first

Jose: "I want it fluid and natural." The rig swaps drawings and cannot
be; filmed clips can. Sora animates his master picture from a prompt
(`docs/art/dr-smiley-clips/prompts.md`); `layers/keyclip.py` cuts each
frame out of the grey wall at full size; `layers/checkclip.py` checks
every frame (strays, holes, cuts, rims, jumps); `features/smiley-clips.js`
plays a clip over the rig (`DR_CLIPS`; a canvas, a 150 ms fade each end).
In the app on this branch, all five: the wave (Home's hello), think,
wince, the thumbs-up (the quiz's right answer) and the cheer, every frame
checked clean. The cheer took four runs: on grey the raised sleeves keyed
out torn (a green wall, keyed by chroma, fixed that); the jump left the
picture at the top until the framing was said in words (him small, in the
lower two thirds; a padded start picture was ignored), keyed with
`FIT`/`TOP=200` and drawn taller above the host (`DR_CLIPS.cheer.top`).
The rig keeps the small life and every move without a clip. 22 MB of
frames, fetched one clip at a time (the wave first on Home), not
precached. Next is Jose's call: going live (merge main, run every suite,
a pull request waiting for his push).
Jose watches everything on his phone; send a video after each step.

## Where it stood (2026-10-26, fifth chat)

Jose watched a preview and found the moves awkward. This chat reworked them
frame by frame on navy (`tests/tools/body-clip.cjs`, `BG=is-navy`); every
change is on this branch, nothing is live, all 33 suites pass.

- Swaps: a drawing is swung (`fsw`) or slid and narrowed (`fy`, `fsx`) to
  meet the one before it, so no hand jumps a third of his height in a frame
  (greet, cheer's V). Eyes open at the start of moves (no held half-blink).
- New drawings from Jose: `think-start`, `wince-start` (round two in
  `prompts-animation.md`), cut in `cutframes.py`, used in think, thinking,
  wince.
- Nod (`ack`) is the head only; wink comes with the drawn thumbs-up; bounce's
  thumb rise now shows (two zero beats had skipped it).
- Held states: listening hands at his sides, uncertain holds `shrug-half`,
  celebrating eyes open.
- At rest: CSS `.db-idle` wrappers (arms with the breath, head drift, sway
  from the feet), no frame loop on Home.
- Not touched: walk and point (the app never plays them); the clipboard's
  board still appears in his hands (a prop pop, kept).
- `docs/art/dr-smiley-body/prompts-fix.md`: prompts for an outside review.
  A Blender test (a 3D him, another chat) is in `docs/art/dr-smiley-3d/`;
  Jose chose to continue without Blender.

Next is Jose's call: more polish, a preview in the app, or going live (a
pull request to main, waiting for his push; merge main in first).

## Where it stood (2026-10-25, fourth chat)

**His full-body animation is complete as far as the drawings go.** Every
drawing in `prompts-animation.md` is in except `legs-toes`, which Jose
dropped. Every performance (greet, ack, think, cheer, wink, shrug, read,
point, bounce, wince, walk, doze) and held state (listening, thinking,
answering, celebrating, uncertain) was filmed on navy with two seeds and
reviewed frame by frame; nothing open is known. Done in this chat (each in
`docs/features/dr-smiley.md`, from "The standing cut's edges"): the leg
and hand edges, the shrug's way in, the thumb's way up, the wince's arms,
the landing legs and their shoes, the shoulder stub (`body-trim`), the
armpit gussets, the armpit's step drawn and mirrored, and a state
replacing another going out through its exit. body-rig 159,
smiley-body-app 18.

**What's next is Jose's call:** when he replaces Dr. Smiley's head in the
app with the full body (his words, 2026-10-23: "animate him fully first;
where he stands full-length is decided later"). He already stands on
Home's banner and in the quiz card on this branch. The branch is storage
only (`claude/` never deploys); getting him live means a pull request from
it to `main`, which waits for Jose's OK. `main` was merged in on
2026-10-25 (commit 36d8995) and the whole test set passed (33 suites);
merge it again first, since it keeps moving.

## Where it stood (2026-10-25, third chat)

The point is drawn: Jose's `point-load` and `point-reach`, cut and built
into `point` (dr-smiley.md, "The point, drawn"). And the mirrored side's
seam is closed for every one-arm frame (same doc, "The mirrored side's
seam"): a mirrored wave or point no longer shows a navy line along his
coat. `cutframes.py` now takes names to recut only those
(`python3 -I cutframes.py point-load point-reach`). body-rig 158,
smiley-body-app 18. `main` merged in on 2026-10-25.

Then the thinking (same chat): `think-rise` and `think-tap` in, and all
three thinking drawings recut whole (the old one was sleeveless on navy);
they play as drawn only (dr-smiley.md, "The thinking, drawn").

Then the clipboard, recut whole the same way (dr-smiley.md, "The
clipboard, cut whole"); it pops in at the bottom of a dip until Jose's
`clipboard-low` drawing comes (prompt given to him on 2026-10-25).

Then `clipboard-low` (two heights, low and mid) built in as the way up and
down (dr-smiley.md, "The clipboard's way up").

Then (fourth chat, 2026-10-25) the standing cut's edges: hem strip,
trouser and hand fringe gone on navy (`layers/trimedges.py`; dr-smiley.md,
"The standing cut's edges"). The openings in `prompts-animation.md` gained
a line each from what the clipboard cut showed.

Then Jose's run of those prompts: `shrug-half`, `thumbs-rise`, `wince-arms`
and `legs-land` cut and built into `shrug`, `bounce`, `wince` and the
cheer's and hop's landing (dr-smiley.md, "The shrug's way in, the thumb's
way up, the wince's arms, the landing").

Then `legs-toes` was dropped (Jose's call: two runs came back with the
heels down). The shoulder
stub past the front drawings is fixed (`body-trim.webp`, dr-smiley.md,
"The shoulder stub"). Jose's first legs-toes run drifted (heels down, made
from the wince picture) and was not used. The walk's armpit slit is filled (gussets, dr-smiley.md "The armpits").
The landing's shoes match his now.
The armpit's step on both sides (drawn and mirrored) is closed (dr-smiley.md,
"The armpit's step"). Then a full review of every move and held state on navy, two seeds: one
fault, a state replacing another kept the old one's drawn arm up; fixed
(dr-smiley.md, "One state replacing another"). Nothing open.

## Where it stands (2026-10-24, evening, second chat)

The wave drawings are in and `greet` is rebuilt around them; the cutter is
fixed for every arm pose. Full story: `docs/features/dr-smiley.md`, "The
wave's breakdowns, and a cleaner cut". In short: drawn poses swap with no
fade (`DR_BODY_FADE` 0); a single arm frame is cut as everything the body
and head pieces don't cover (`arm: True` in `cutframes.py`), which fixed
holes and torn sleeves that showed only on dark backgrounds;
`layers/trimpieces.py` trimmed the head's ragged shoulders and moved the
body's loose cuff bits into the right forearm. body-rig 158 checks
(one drawing per side at a time; greet plays all three wave drawings),
smiley-body-app 18. **Always review on navy** (`BG=is-navy`): white hides
cut edges. Clips: `cd tests && BG=is-navy node tools/body-clip.cjs OUT greet`
(`ROOT=<a worktree>` films a before; frames land in `OUT/greet-frames/`).

**Then the cheer** (same evening): `cheer-load`/`-mid`/`-up` cut and built
into `cheer` and `celebrating` (dr-smiley.md, "The cheer, drawn").

**Next (then):** the remaining drawings in `prompts-animation.md` (think, point,
shrug, read, thumbs, wince, the two leg drawings), each added to
`POSES` in `cutframes.py` (single back-layer arms get `arm=True` through
the loop under `ARM=`), its box copied from `poses.json` into
`DR_BODY.pose`, built into its performance as breakdowns, reviewed on
navy frame by frame. Same branch, same storage-only rule.

## Where it stands (2026-10-24, end of the first chat)

**Goal (Jose's words):** fully perfect his animation before he replaces Dr.
Smiley's head in the app. Do not ask Jose to push or OK it; keep improving
until it's good to go. Use simple sentences and clickable options
(AskUserQuestion), recommendation first.

**Branches.** `claude/dr-smiley-body-prompts` is PR #135 (the rig, all
acting, the solid cut, no seams). `claude/dr-smiley-body-home` (this one,
on top of #135) holds everything since: him wired into Home's banner
(bottom right, 216 px) and the quiz card's corner (`features/smiley-body.js`,
the Home block in `home-polish.js`/`.css`, the quiz corner in `app.css`,
suite `smiley-body-app.cjs`, guide answer `smileybody`), the fix for the
head and body showing together (the `has-body` marker is on the greeting),
and the animation rework below. It is pushed only for storage: a
`claude/` branch never deploys (`vercel.json`), and no PR is open for it.
PR #136 (the name pen's wall clock) waits separately.

**The animation rework (commit "the drawn poses carry the motion").** A
frame-by-frame review found see-through swaps (ghost legs at jumps, faded
sleeves) and flat cutout arms swung wide ("paper arms"). Now the cutout
arms stay small (body-rig checks at most 25 degrees out, 60 at the elbow),
and a drawn pose moves itself into place with three joints: `fsw` (swings
a single arm about its shoulder, `anchor`), `fy` (lifts a folded arm or the
clipboard), `fsx` (opens the shrug). Arm poses fade in over the piece they
replace (`DR_BODY_FADE`, 70 ms), which is cut only once covered; leg plates
swap at once. body-rig checks "never see-through". 145 checks pass;
smiley-body-app 18, smiley-quiz 19, smiley-squash 18, smiley-gestures 114,
home-rest 23.

**Next.** Jose runs the drawings in
`docs/art/dr-smiley-body/prompts-animation.md` in ChatGPT, starting with
the hello wave: `wave-rise`, `wave-in`, `wave-out`. Measure each against
`body-master.png`, cut with `layers/cutframes.py` (add each to `POSES`),
add to `DR_BODY.pose`, and build them into `greet` as breakdowns (the arm
on its way up, the wag's two extremes). Then cheer, think, point, shrug,
read, thumbs, wince, the two leg drawings. Review every change frame by
frame before showing Jose; send before/after clips side by side.

**How the previews are made.** Record the viewer (`drsmiley/body.html`)
or the app with Playwright video, cut frames with Playwright's own ffmpeg
(`/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux`, `-r 12`; its filters don't
work, crop in Pillow), write GIFs with Pillow, label with Inter
(`/usr/share/fonts/opentype/inter/Inter-SemiBold.otf`). For an app clip,
put a tiny red marker in the page's corner when the action starts and cut
from that frame. Contact sheets (every 2nd frame, times printed) are how
the review is done.

**The limit to tell Jose plainly:** these drawings keep his torso and head
still, so his whole body can't bend into one line of action. Beyond that
means full-body drawings or a 3D model of him.

## Where it stands (2026-10-23, late): the first four drawn poses are in

Jose ran wave, fist pump, think and shrug in ChatGPT; they lined up with
the master (0 to 4 px, colours close). `docs/art/dr-smiley-body/layers/cutframes.py`
cut them into `drsmiley/body/pose-*.webp` (content changes only; coat over
coat left to `body.webp`), `drsmiley/body.js` shows each as drawn and
mirrored (`DR_BODY.pose`, `frameL`/`frameR`/`frot` in the pose, `setFrames`),
greet/cheer/think/shrug swap them in at the top of the gesture;
`tests/suites/body-rig.cjs` checks it. Then `crouch.png` and `jump.png`
came and are in as leg plates (`legs: true` in `DR_BODY.pose`, `frameLegs`
in the pose, both cutout legs hidden meanwhile; the scrub blue shifted to
the master's in `cutframes.py`) for `cheer` and `bounce`. The acting sheet:
`layers/sheet.cjs` run from `tests/` (frames to a folder), tiled into
`preview-acting.png`. Sent to Jose. The thumbs-up came last (cut as a
feathered band, `band: True`, since its sleeve lies over the coat; drawn
in front; the top of `bounce`). Every drawing the acting needs is in;
point and clipboard wait for a use. Asked where he stands full-length
(Home greeting and the quiz recommended, never the dock), Jose said "not
yet" (2026-10-23, late): he OKs PR #135 as it is, looks at him in the
viewer at `/drsmiley/body.html` once it is live, and decides later. So the
next chat waits for that pick; when it comes, path 2 below. The app still
shows nothing full-length.

## 2026-10-23, late evening: the held states are in

Jose saw previews of all nine performances (GIFs recorded from the viewer)
and picked "held states, full body" as the next step toward "animated like
he animates in the app": `body.state(name)` with listening, thinking,
answering, celebrating, uncertain (`DR_BODY_STATES` in `drsmiley/body.js`;
the viewer's second row; the feature doc's "Held states" bullet). Also
fixed: a gesture cut short by another left its drawn hand up. Then Jose ran the clipboard prompt: cut as a band
(`pose-clipboard.webp`), the `read` performance and the `answering` hold
use it. Then the point (`pose-point.webp`, the `point` performance with a `side`: "look here"), the doze and rest-life levels (`drBodyIdle`: full, calm, blinks, none; `stop.doze()`). His body now covers everything his head does in the app: gestures, held states, the phone's states. Then Jose picked where he stands from mockups (Home's banner bottom right at 216 px; the quiz card's top-right corner) and the wiring was built on a branch off #135 (`claude/dr-smiley-body-home`; `features/smiley-body.js`, the Home block in `home-polish.js`/`.css`, the quiz corner in `app.css`, suite `smiley-body-app.cjs`, the guide answer `smileybody`). Jose's rule: nothing pushed for the app until he has seen previews. Where he
stands in the app is still his open pick (Home greeting and the quiz
recommended). Previews are made by recording the viewer with Playwright
video, frames out with Playwright's bundled ffmpeg (`-r 12`, no filters in
that build), cropped and written as GIFs with Pillow.

## Decided 2026-10-23 (the chat after the one above): path 1, drawn poses

Jose first said "nowhere for now, I want to hit finished first" and "it
doesn't have to be 3D"; a 2D redraw was tried (two pictures) and dropped
for likeness (`docs/art/dr-smiley-2d/prompts.md` has the numbers). His
words then: "I just want to be animated like he animates in the app.
Only that it's his face the only thing that animates but this time I want
the body too." So the 3D him stays and path 1 below is the plan: drawn
poses of the same him (`docs/art/dr-smiley-body/prompts.md`, Step 2; wave,
fist pump, think, shrug first, then crouch and jump), measured against the
master, cut as frames the rig swaps. What the next chat waits on: those
pictures. PR #135 stays the base (engine, viewer, checks).

## The two paths as they stood (path 1 is the one)

1. **Jose sends drawn poses.** Measure each against the master as the
   four faces were (`docs/art/dr-smiley-faces/README.md`: scale, offset,
   colour), cut the arms (or the whole part that changed) and add them as
   new pieces or frames in `drsmiley/body/` and `DR_BODY.box`; a real fist
   replaces the open palm in `cheer`'s fist beat and `bounce`, a finger to
   the chin in `think`, the clipboard for a reading pose. Keep the rest
   pose composing back into the picture (the suite checks mean difference
   under 12 below the chin). Redo the frames sheet
   (`docs/art/dr-smiley-body/preview-acting.png`) and send it to Jose.
2. **Jose picks where he stands full-length** (his pick is still open;
   the recommendation was Home greeting and the quiz, never the dock: at
   58 px his face would be a dot). Then wire `drBodyArt`/`drBody` into
   `index.html` (load `drsmiley/body.js` like `features/*.js`, before
   `index.html`'s script), drive the face from `DrAnim` (the head group
   carries the same `.ds-face`/`.ds-sheet`/`.ds-brow` classes), add the
   layers to `sw.js`'s precache, keep `.db-breath` breathing as CSS in
   `app.css`, honour `setSmileyMode` and `drTask`, and update the User
   Guide (a new answer, `GUIDE_NEWS` card) in the same commit. Phone
   screenshots first, then numbers.

## How to verify

- `cd tests && node run.cjs body-rig` (about 2 minutes; 121 checks). The
  full run: `node run.cjs`, about 8 minutes. If Playwright says the
  browser is missing (it expects `chromium_headless_shell-1194`, the
  container has 1243), make the two folders point at the installed ones:
  `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
  as a symlink to `.../chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`,
  and `chromium-1194/chrome-linux/chrome` to `chromium-1243/chrome-linux64/chrome`,
  with an `INSTALLATION_COMPLETE` file in each.
- Frames mid-performance: the script that made the sheet is in the old
  chat only; `body-rig.cjs` saves `tests/out/shots/body-rig-phone.png` and
  `-desktop.png`. For frames, open the viewer in Playwright, call
  `drBodySeed(3); body.perform('cheer')` and screenshot the stage at a few
  times.

## Rules that bit this chat

- Fetch `main` before writing and before pushing; it moved twice during
  this work (#131, #134) and `docs/PLAN.md` conflicted (resolve hunk by
  hunk, keep both; never `--ours`).
- A commit message with `"` inside `-m "..."` breaks the commit; write
  the message to a file and use `-F`.
- Reporting to Jose: extremely concise, plain words, "working on it" while
  running, "done" when finished; options as buttons (`AskUserQuestion`),
  the recommendation first; every finished job a picture
  (`SendUserFile`, phone first) then a `PushNotification`.
