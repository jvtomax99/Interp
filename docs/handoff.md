# Handoff: Dr. Smiley full body (written 2026-10-23, from the chat that built PR #135)

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
use it. Then the point (`pose-point.webp`, the `point` performance with a `side`: "look here"), the doze and rest-life levels (`drBodyIdle`: full, calm, blinks, none; `stop.doze()`). His body now covers everything his head does in the app: gestures, held states, the phone's states. Where he
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
