# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-21, from the chat that built the 3D Dr.
Smiley (updated 2026-10-22 with the face plan) on Jose's Tripo model (PR #114, branch `claude/3d-dr-smiley-r1-avn9y1`).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> continue the 3D Dr. Smiley on branch `claude/3d-dr-smiley-r1-avn9y1`: I'll
> attach the zip of my Tripo model; rebuild it, then show me the visual plan
> for his brows, cheeks and mouth. Plain words, say "working on it" and "done".

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
- **Face plan (2026-10-22), shown, waiting on Jose's picks:** `out/plan-face.png`
  (`tripo_faceplan.py` renders the mock-ups into `in/faceplan/`,
  `tripo_faceboard.py` lays them out). Brows A (his sculpted brows move the
  skin, my pick) or B (new pieces); cheeks rise on smile/laugh; mouth route
  1 (reshape his own lips, my pick), 2 (new 3D mouth) or 3 (painted, not
  recommended); then a closed-mouth test before anything else.
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

## What's next (Jose's approved plan, `out/plan-rig.png`, steps 3-6)

3. **Brows and cheeks**: small face bones (brow lift/frown per side, cheek
   raise). His brows are painted on the model's texture; options to show
   him first: (a) bones under the painted brows, (b) 3D brow pieces over
   them, like the eyeliner. Show both as pictures, recommend one.
4. **Mouth**: shapes per expression (smile, laugh, surprised, sad,
   worried, doubt), from his 30 drawn expressions (`drsmiley/face.webp`,
   `DR_FACE_FRAMES`). The model's mouth is painted (open smile); the
   approach needs a plan with mock-ups first.
5. Expression sheet, six poses, 360-degree turn: stop for his OK.
6. Then the animation (R2), again as a visual plan first.

Plan pictures: `storyboard.py` (`board()`), `tripo_planviz.py`.

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
