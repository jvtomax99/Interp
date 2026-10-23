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

## Decided 2026-10-23 (the chat after the one above): redraw him in 2D

Jose, asked which path: first "nowhere for now, I want to hit finished
first", then "it doesn't have to be 3D, I just want it to look natural and
like a professional work", and his pick with the cost stated: **redraw him
whole in 2D, head included, then rig that** (one Dr. Smiley everywhere; the
3D head stays in the app until the 2D set is complete). Plan, prompts and
the pipeline: `docs/art/dr-smiley-2d/prompts.md`. What the next chat waits
on: Jose's style picture (Step 0), then the master (Step 1). The engine in
`drsmiley/body.js`, the viewer and `tests/suites/body-rig.cjs` are the
keepers; the 3D pieces in `drsmiley/body/` are the placeholder until then.
The two older paths below are kept for the record; neither is next.

## The two older paths (superseded above)

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

- `cd tests && node run.cjs body-rig` (about 1 minute; 63 checks). The
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
