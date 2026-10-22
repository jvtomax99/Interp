# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-22, from the chat that made the face plan
and the mouth test for the 3D Dr. Smiley on Jose's Tripo model (PR #114, branch `claude/3d-dr-smiley-r1-avn9y1`).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> continue the 3D Dr. Smiley on branch `claude/3d-dr-smiley-r1-avn9y1`: I'll
> attach the zip of my Tripo model; rebuild it (with the face rig), then
> show me the expression sheet (brows, eyes, mouth, cheeks together). Plain words, say "working on
> it" and "done".

## Jose's standing rule for this work (in `AGENTS.md`)

**A visual step-by-step plan with screenshots before anything is built**, then
wait for his go. Every step that changes the look stops for his OK with
pictures. Questions with options go as buttons, recommended first.

## Where things stand

- **PR #114 (`claude/3d-dr-smiley-r1-avn9y1`), open, docs only** (nothing
  deployed). Folder `docs/mockups/smiley-3d/`. Merged with `main` 2026-10-21.
- The look Jose kept: **his own Tripo model** (he made it on tripo3d.ai from
  a Pixar-style picture of Dr. Smiley, arms down), then changed by
  `tripo_fix.py`: **matte** (no gloss: roughness >= .62, specular .1, no
  coat), **hair recoloured** to the drawing's chestnut, **a swoop** at the
  front. Approved: `out/tripo-before-after.png`.
- **Skeleton:** `tripo_rig.py`, 36 bones (fingers too). Pose test approved:
  `out/plan/rig-test.png` (rest, wave, jump, point).
- **Eyes:** `tripo_eyes.py`, `EYE_STYLE=matched` (Jose's pick "B" over
  `out/plan-eyes-options.png`): 3D eyes at his painted eyes' size, top
  eyeliner, dark brown iris, big pupil, one shine; blink and look around.
  Approved: `out/tripo-eyes.mp4`.
- **Face plan (2026-10-22), Jose picked brows A and mouth route 1:** `out/plan-face.png`
  (`tripo_faceplan.py` renders the mock-ups into `in/faceplan/`,
  `tripo_faceboard.py` lays them out). Brows A (his sculpted brows move the
  skin, my pick) or B (new pieces); cheeks rise on smile/laugh; mouth route
  1 (reshape his own lips, my pick), 2 (new 3D mouth) or 3 (painted, not
  recommended); then a closed-mouth test before anything else.
- **Mouth test (2026-10-22), approved by Jose:**
  `out/plan-mouth-test.png` (`tripo_mouthtest.py`, `close_mouth()`): his own
  open smile closed by moving his surface only. Lessons in its comments:
  measure the opening on a flat picture with exposure 0 and Standard colour;
  lips move straight up/down (sliding them on a fitted surface pushed the
  lower lip back and tore the chin); the inside is squeezed evenly across the
  opening and tucks only late in the closing (else it folds and streaks);
  the upper teeth go up and back, and the lower lip tucks 4 mm behind the
  upper one (its top curls inward).
- Earlier tries, rejected (kept in git as a record): shapes built in code
  (`build.py` styles v1, figure, film: "still not him", "glossy", "the
  hair"). Don't go back there.

## The model files are NOT in git (too big)

`docs/mockups/smiley-3d/in/` is git-ignored. **A new chat needs Jose's zip
again** (`Dr.Smiley ( hands down ) .zip`, a 32 MB GLB inside; he attaches it
in the chat; iCloud links are blocked in the cloud session). Rebuild, about
2 minutes, in this order:

```
pip install bpy opencv-python-headless pillow scipy
cd docs/mockups/smiley-3d && mkdir -p in
unzip -j <the zip> -d /tmp/z && cp "/tmp/z/Dr.Smiley ( hands down ) .glb" in/tripo-hands-down.glb
python3 tripo_fix.py                      # in/tripo-fixed.blend (matte, hair, swoop)
EYE_STYLE=matched python3 tripo_eyes.py   # in/tripo-eyes.blend
python3 tripo_rig.py                      # in/tripo-rig.blend (36 bones)
python3 tripo_posetest.py                 # check: out/plan/rig-test.png
```

## What's next

Done 2026-10-22 (this chat): `tripo_face.py` builds `in/tripo-face.blend`:
his surface welded along the texture seams (476,822 -> 447,667 points,
fixed normals dropped; rest renders identical to the approved model), shape
keys for brows A (`BrowUp/Down/InUp/InDown.L/R`, no folds: checked by
counting flipped triangles), cheeks (`CheekUp.L/R`), the closed mouth
sampled (`Mouth.Close0.25..1`), and `set_face()` (the lid comes down with a
lowered brow). `tripo_mouths.py` adds mouth building blocks (`JawOpen`,
`CornerUp/Down.L/R`, `Narrow`, `Frown`, `O`) and `MOUTHS`, the seven drawn
expressions as mixes. Shown: `out/plan-mouths.png`. Good: rest, smile,
laugh, doubt. Not yet: surprised (leans, creases above the lip), sad and
worried (flat, not a frown).

1. **Done, waiting on Jose's OK:** surprised, sad and worried traced from
   his drawings (Jose's pick): `tripo_trace.py` levels the drawn face (11
   degree tilt), maps the drawn rest mouth onto the 3D one, and
   `fit_line()` / `fit_open()` in `tripo_mouths.py` fit his lips to each
   outline (keys `Mouth.Sad`, `Mouth.Worried`, `Mouth.Surprised`). Shown:
   `out/plan-mouths.png`. Known: the O has soft folds by the nose and is a
   little uneven inside (teeth one side).
2. Then the expression sheet (brows + eyes + mouth + cheeks), six poses,
   a 360-degree turn: stop for his OK.
3. Then the animation (R2), as a visual plan first.

Plan pictures: `storyboard.py` (`board()`, import it), `tripo_faceboard.py`,
`tripo_mouthboard.py`. Build order after a fresh rebuild: `tripo_fix.py`,
`tripo_eyes.py`, `tripo_rig.py`, `tripo_face.py`, `tripo_mouths.py`.

## Learned (also in the code comments)

- The Tripo GLB is one fused surface split along its texture seams (no
  shared corners across seams): weld positions before any "touching"
  logic or bone heat, or bone heat finds no solution.
- An edited embedded GLB image keeps its old copy: load the edited PNG
  as a new image and swap it into the material.
- Saved `.blend` files may default to Eevee (needs a GPU): set Cycles CPU.
- A new shape key comes in at full strength: set it to 0.
- Iris shading must use the `rest_position` attribute, or a skeleton
  moving the ball drags the iris off it.
- Bone parenting via `matrix_world` right after setting `parent_bone`
  reads a stale matrix: use an armature modifier with one vertex group.
- Lids that blink with one shape key cut through the eyeball (the lash
  line vanishes): 8 keys, each a step round the ball.
- His brows are a raised ridge (~6 mm) painted brown; his mouth is a real
  cavity (~3 cm deep) with upper teeth and a tongue, sculpted in one smile.
- Moving his skin: recompute the shading normals across the welded seams
  (`set_co` in `tripo_faceplan.py`); the GLB's fixed normals don't follow
  and every seam shows as a fold.
- A lowering brow has only 6-10 mm of skin above the eye: the lid has to
  come down with it, or the skin bunches.
- Renders here: about 7-12 s a frame at 540 px, 12-24 samples, CPU.
