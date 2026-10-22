# Handoff: the Interpreter Hub ad (2026-10-22)

For the next chat. Read this, then `PLAN.md`, then `../README.md` (the
first film's pipeline, which this one reuses). Branch:
`claude/guide-walkthrough-wntrl2`.

## Latest (end of the first chat, 2026-10-22)

- Current plan: storyboard 7 (PLAN.md "Beats (storyboard 6...)" table,
  with the new ending); playable page
  https://claude.ai/artifact/G9Q35eXGbDwFrMK6QDLgRa.
- Section 1, the hook, is built as a rough moving test: `brainhook.py`
  (frames 1-150) + `brainhook_sound.py` + `logo.py` (the logo after Jose's
  reference picture, Poppins ExtraBold from Google Fonts into
  build/fonts/). Jose's rules there: no words over the brain; the logo
  sits above the phone, never covering the app. Open ideas he hasn't
  answered: logo bigger with a soft glow behind it.
- The ending: `src/endcard.html` + `tools/endcard.cjs` (end card on his
  cherry-tree photo), `logo.py clear` (logo without background),
  `storyboard3.py v16` (rise over the campus).
- Photos NOT in git (rights unconfirmed), re-upload to build/photo/:
  helena.jpg (Helena Theurer Pavilion, used by the older openings) and
  cherry.png (the cherry tree, the ending).
- Prompts: `REVIEW_PROMPT.md` (critique each section), `IDEA_PROMPTS.md`.
- Fonts in build/fonts are downloaded from Google Fonts (Poppins,
  Unbounded...); IBM Plex Mono .ttf converted from tests/support/fonts.

## Where it stood earlier

- Storyboard 4 (vertical, about 56 s) is waiting for Jose's OK and his four
  choices (length, logos, shape; my picks: approve, 56 s, logos off the
  campus with app screens as they are, vertical). The playable storyboard
  page: https://claude.ai/artifact/G9Q35eXGbDwFrMK6QDLgRa (source kept
  outside the repo; its frames are `build/board/v01-v15.png`).
- Nothing of the film itself is rendered. Next is the guide's Step 1-2:
  write `BRIEF.md` in the six blocks from PLAN.md's beats, then build.
- Jose's rules for this film: every feature, each brief; the 3D Body, HUMC
  Brain and CoreCHI City the long scenes; no organs scene (its code stays);
  the doctor databases in; never lower the quality; never erase earlier
  work (storyboards 1-3, `storyboard.py`, `storyboard2.py` stay).
- Inspiration (Jose): `media/hub-promo.mp4` (the original, vertical, his
  captions) and his remake draft (vertical, 3D neon, desk). PLAN.md says
  what was taken and what wasn't.

## The opening (storyboard 5)

Jose disliked the neon-on-black opening; of three tries (`openings.py` a, b,
c) he replaced the night campus with his own photo of Helena Theurer
Pavilion (683 x 1024; a second, dusk photo was only 447 px wide). The photo
is NOT in git (rights unconfirmed): re-upload it to `build/photo/helena.jpg`,
then `python tools/sky_mask.py` and `openings.py p1 p1b p2`.

## Rebuilding everything from a fresh session

```
S=<scratchpad>; uv venv -p 3.13 $S/venv && VIRTUAL_ENV=$S/venv uv pip install bpy==5.2.3 numpy scipy pedalboard pyloudnorm pillow
cd promo/blender && npm install                     # Playwright for the pictures
cd ../../tests && npm install && cd ../promo/blender # the harness for app screens
python timeline.py && python smiley.py              # Dr. Smiley's faces (first film's build/)
cd ad
node tools/brain_dump.cjs                           # build/brain_scene.json
node tools/campus_export.cjs                        # build/campus.glb (installs three@0.160.0 in build/)
node tools/screens.cjs                              # build/screens/*.png, then round them:
python3 -c "..."                                    # r_<name>.png: see storyboard2's notes; rounded corners radius 11% of width
node tools/captions.cjs                             # build/captions/*.png
BOARD_SCALE=2 python storyboard3.py                 # the 15 vertical frames
```

(The rounding one-liner: open each `build/screens/<name>.png`, put an alpha
mask of a rounded rectangle with radius `0.11 * width`, save as
`r_<name>.png`. Worth turning into `tools/round.py` in the build.)

## What was learned (don't relearn)

- BodyParts3D chunks: float32 positions, int16 normals, **uint32** indices;
  Y-up, 1.73 m. Lung = airway tree only, liver mostly bile ducts.
- The campus glTF's 640 m sky dome has no material: hidden in `assets.campus()`.
- The brain's layout lives in a closure: `tools/brain_dump.cjs` swaps the
  page's one `window.BRAIN = {...}` line on the fly.
- The harness's Translate stand-in always answers "insuficiencia cardíaca"
  (ask it "heart failure"); Ask the Hub needs the real `api/ask.js` with a
  fixed reply (`tools/screens.cjs`); memory lines and chat photos must be
  served by the script; doctors must be the made-up `SAMPLE_DOCTORS` (the
  tests use a real-looking doctor name with invented notes).
- Blender: read `matrix_world` only after `view_layer.update()`; parenting
  with a parent inverse breaks child scale (place directly or parent before
  sizing); Standard view, not AgX, for app screens and Dr. Smiley.
- This machine: 4 cores, no GPU; background commands stop at 2 hours, so
  render in resumable chunks (`../render.py` skips finished frames).
