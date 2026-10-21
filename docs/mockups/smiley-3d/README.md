# Dr. Smiley in 3D (R1: the figure and his skeleton)

A 3D toy Dr. Smiley built entirely in code with Blender (`bpy`, Blender 5.2
as a Python module) and rendered with Cycles on the CPU. Nothing here is
deployed; it is for videos first (the reel, R3). Whether he ever replaces
the drawn one in the app is Jose's call, later.

## What is his and what is invented

- **His face is his drawing.** `prep.py` takes the skin inside his hairline
  from `drsmiley/base.webp`, paints the hair and background out as skin
  (OpenCV inpaint), lays one of the 30 eye/mouth frames from `face.webp`
  and both brows (`brow-l`/`brow-r`, lifted and turned by the `DR_BROWS`
  numbers) exactly where `drSmileyArt()` puts them, and fades the edge.
  `build.py` projects that picture straight onto the front of a round head
  (1 pixel of `base.webp` = 1 mm of head), so from the front he is the
  drawing, and as he turns his face foreshortens like a real one. It fades
  out as the head turns away. Under the drawing the head has real relief
  (`RELIEF`, `face_relief()`): his drawn nose sits on a 3D nose, the
  blush on round cheeks, the mouth on a soft muzzle, so in profile he has
  a nose and cheeks instead of a flat sticker (Jose's pick, 2026-10-21).
  The eyes stay drawn: there is no full profile face.
- **Invented** (Jose: "let's invent them"): the head's sides and back, the
  hair as 3D locks, the ears, the whole body (white coat with lapels,
  collar, buttons, pockets and a pen; navy scrubs; cartoon hands with a
  thumb and three fingers; white sneakers with blue soles), the lanyard and
  badge (a plain card, no text), and a navy stethoscope draped round his
  neck, chest piece on his left, ear tubes on his right (Jose's pick).
  Colours sampled from `base.webp`; the lanyard and pen are the app's
  accent blue.

## How it is built

- **Head:** a sphere reshaped by `head_point()` (rounder cranium, fuller
  cheeks, a narrower chin), its UVs the front projection of the drawing.
- **Hair:** a cap over the scalp above `hairline()`, and 46 locks that all
  start round the crown (`WHORL`) and follow `flow()` (away from the crown,
  swept to his left over the top) down to the hairline; extra lift where
  the drawing has volume (`QUIFF` at the front, `PUFF` over his left ear),
  and lock tips at the fringe and over that ear flick up off the head.
  Strand grooves are a wave texture along each lock; colour runs dark at
  the root to warm at the tip.
- **Body:** lofted rings (`COAT_RINGS`) with the coat open in a V above
  `V_BOTTOM`; tubes for sleeves and trouser legs; superellipsoids for
  hands, shoes, pockets.
- **Skeleton (`BONES`):** root, hips, spine, chest, neck, head; per side
  shoulder, upper arm, forearm, hand, thigh, shin, foot, plus two bones
  each for the thumb and three fingers (`tha`/`thb`, `f0a`..`f2b`): 36
  bones. Hands are `HS` (1.45) times life size for him, so they read in a
  full shot. The
  head, hands and shoes ride their bone rigidly; sleeves, legs, coat and
  neck are weighted by distance to their bones (`skin()`), and the coat's
  front skirt follows a raised knee (`coat_thigh`).
- **Face rig (for now):** a face is a texture swap (`set_face`), the brows
  baked in per pose. R2 will drive frames and brows from the timing file.
- **Posing:** `pose(arm, {bone: (x, y, z) degrees}, face)`, angles about
  his own axes relative to the parent bone; `lift`/`drop` move him up or
  down, `grip.L`/`grip.R` pick a hand shape from `GRIPS` (relaxed, open,
  fist, point, wave), curling each finger about its own knuckle axis.

## Run it

```
pip install bpy opencv-python-headless pillow   # bpy is ~400 MB
python3 prep.py               # tex/face_*.png
python3 headviews.py 64       # out/head-views.png  (front, 3/4, side, 3/4 back, back)
python3 bodyviews.py 32       # out/body-views.png
python3 poses.py 48           # out/poses.png, six poses, 1080 x 2280
python3 turntable.py 24 96    # out/turntable.mp4, 96 frames, plays the turn twice
```

Speed here (4 CPU cores, no graphics card): about 10 s a frame at
540 x 760 and 12 samples, about 20 s at 540 x 960 and 24 samples, with
the denoiser on. `smiley.blend` is written by `bodyviews.py` for opening
in Blender; it and `tex/` and the frame folders are not committed (made
by the scripts).
