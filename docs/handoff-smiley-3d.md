# Handoff: 3D Dr. Smiley

Its own file (the general `docs/handoff.md` belongs to the other chats on
`main`; two chats overwriting one file conflicted). Written 2026-10-23 by the
chat that built his face rig, eyes and teeth (PR #114, branch
`claude/3d-dr-smiley-r1-avn9y1`, docs only, nothing deployed).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and
> `docs/handoff-smiley-3d.md`. Then continue the 3D Dr. Smiley on branch
> `claude/3d-dr-smiley-r1-avn9y1`: I'll attach the zip of my Tripo model;
> rebuild it (build order in the handoff), send me the seven reactions as
> a picture so I can see it matches, then go on from "Next". Plain words,
> say "working on it" and "done".

Jose attaches `Dr.Smiley ( hands down ) .zip` (32 MB GLB inside); the
model files are not in git. The 2026-10-23 continuation ran on Claude
Fable 5.1 (it caught the dark sheet in front of the band from a red-band
diagnostic render; whether that beats Opus 5.5 is still Jose's call).

## Now (2026-10-23, later chat)

Everything Jose has OK'd, newest last: matte model, hair, swoop; skeleton
(36 bones); brows A (his sculpted brows move the skin); mouth route 1 (his
own lips reshape) and the closed-mouth test; muscle-based mouths "pushed
further"; eyes: glass cornea + real shine, iris detail, no lower lids,
one tapered lash line on the lid edge, resting lid on the iris top (B),
happy shut eyes for the laugh; laugh and surprised redone; teeth: one
smooth white band (A). Rebuilt from his zip in this chat: the reactions
sheet came out the same to the pixel.

**Waiting on Jose: the surprised "oh", second build** (`tripo_oh.py`,
his pick of the leftovers): `out/plan-oh.png` (drawing | before | after),
`out/plan/mouths.png` (all seven with it). Corners in 26 mm, the lips meet
just past the opening, a flat upper lip with a thin sliver of the tooth
band under it (`TOP_LIFT` -4 mm), a U below (44 x 36 mm), the inside moved
as one piece (the tongue keeps its shape), the chin drops; the band's ends
follow the corners (key `O2` on Teeth, set by `set_face` with `Mouth.O2`).
Two bugs found on the way: `teeth_vertices` (tripo_mouthtest.py) read the
live texture, where tripo_teeth.py had painted the sheet dark, so it found
no sheet at all and the sheet stayed dark in front of the band (the old
"teeth hidden in the oh"); it now reads `in/hair_tex.png`. And sliding
moved skin along his surface (fitted curve, grid, ray casts) all failed on
the lip rims; dropped, the band following the corners made it unneeded.
Known, small: a nick at each corner where the lips meet.

Also made, not yet shown as a page: `tripo_sheet.py` renders the seven
faces in a row (`out/plan/expressions.png`), six poses with a face each
(`out/plan/poses6.png`: Hello, Wave, Get ready, Jump, Point, Thinking; the
crouch and the thinking hand are rough first guesses) and a 24-frame turn
(`out/plan/turn-strip.png`, `out/tripo-face-turn.mp4`).

## Jose's new brief (2026-10-23, after the "oh")

Two reference sheets (AI-made, Pixar-style; in the chat, not in git): "A
smile becomes a laugh" (8 moments) and "Corrected expression targets"
(neutral, warm smile, joyful laugh, surprised, empathetic sadness, worried,
skeptical, relaxed blink). His brief: expressions through the whole face;
eyelids wrap the balls with thickness and close without cutting, blinks
never shrink the eyes; a smile lifts the cheeks and the lower lids, a laugh
pushes the eyes into upward crescents, a blink closes without laughing
cheeks; the mouth opens by the jaw with a recessed inside, curved upper
teeth and a tongue; brows independent (sad: inner ends up; worried: more
tension, lips pressed; skeptical: one brow up, one eye narrower, both open);
transitions with anticipation, hold, settle, staggered; head still.
Neutral, warm smile and joyful laugh first, front and three-quarter, with a
slow there-and-back clip; check floating, clipping, sliding colours and
identity before the rest. Plan page: `out/plan-match.png` (his parts
coloured: `out/plan/parts.png`; him beside the targets:
`out/plan/targets-now.png`). **His picks:** the new sheets rule over the
30 drawings where they disagree (the drawings stay for the 2D app);
**step A go**: the eyes rebuilt as his own skin, lower lids back as part
of it (not the separate pieces he rejected on 10-22).

## Step A built (2026-10-23, later): the eyelids as his skin, waiting on Jose

`tripo_lids.py`, called from `tripo_face.py` right after the weld (before any
shape key): the skin inside an oval round each eye (S_X 1.3, S_Z 1.2 ball
units) is cut out; two strips (upper lid, lower lid; 160 upright columns,
22 rows + 2 rim rows) are built from the lid edges on the ball out to just
inside the cut, bridged to the cut (`bridge_loops`; the cut's zigzag relaxed
once). Each point: over the ball it keeps the lid's thickness (plus the
cornea's dome); outward it becomes his own skin, read by ray casts onto a
kept copy of the skin, with the ball-hugging weight dying out by the cut.
Colour: one flat skin tone (his texture at the nose bridge), mixed into
Material_0 by the 'flat' attribute (1 on the ring, feathered .3 ball units
into his skin), the bump and roughness maps faded out there too (the bump
read as a streak), the lash line by the 'lash' attribute (the upper rim and
the first tenth of the lid, tapered toward the nose). Keys: Lid.W (wide),
Lid.U1..U6 (upper lid down), Lid.D1..D4 (lower lid up, with a puff); the
laugh = upper down to meet the lower raised in an arc (`set_lids` keeps the
upper edge above the lower); `set_face` maps the old shell scale (lid .32 =
rest). The old Lid, Glint and Liner objects are removed; `tripo_eyes2.py`
skips its lid parts when they are gone. `EYE_SINK` (tripo_eyes.py): the
balls now sit 10 mm behind the painted skin (was 6.2): at 6.2 they stood
6 mm proud and the lids climbed back to the face in a trench (goggles).
Checks: `tripo_lidtest.py` (rest, smile, laugh, blink, wide; front,
three-quarter, one eye), `tripo_gateA.py` (beside the reference tiles and
the old lids), page `out/plan-lids.png`.
Learned the hard way (20 rebuilds): the dark arc over each lid was the old
Liner tube object, not the lash; the streak down a shut lid was Tripo's
bump map through borrowed UVs; the ring round the eye was (a) the lids
standing proud (sink the balls), (b) a crease where the lid met the skin
(read the skin exactly, fade the ball-hug to zero by the cut), (c) slivers
in the bridge (end the ring 5% inside the cut, faces as fine as his mesh).
Snapping or inserting the cut's points onto the ring never lined up (the
cut zigzags). Jose then: "fix the eyes more first". Done: the cut's points and the ring's
last two rows relaxed three times against each other (the shift kept in
`R.delta` and added to every key, or the join popped); the ring ends 7%
inside the cut; the lash line wider (`LASH_FULL`/`LASH_END`, thicker at
the outer corner, darker); the fold above the open eye (`FOLD_AT/W/DEPTH`:
a 1.1 mm groove at .42 of the lid, flattening as it shuts). The seam is
gone from the face views; a faint mark stays at the outer corners in
close-ups. Waiting on Jose: `out/plan-lids.png`.

## Step A, review 3 (2026-10-23, later): after Jose's detailed notes

Jose (not approved): neutral too covered (tired), smile slits under heavy
lids, laugh "protruding caps with a thin line", blink "a thick dark crescent
under the lids"; fix in order neutral, blink (side profile too), smile and
laugh from those, the in-betweens; show large front and three-quarter, one
eye, a wireframe; no approval requests for minor steps. Done: `H_TOP` .72
(the lid on the iris top), `H_BOT` -.76, `H_SHUT` = H_BOT + .015 (the
closure on the lower lid: the .06 gap was the dark crescent); the shut lid
settles onto the dome (`ball_y(shut)`), its rim thinner; the lash line on
rows with a FIXED .5 mm spacing (`NFIX`, `FIX_STEP`, `LASH_ROWS`): by row
with the rest spacing, a shut lid's lash zone grew into half the eye (the
"dark half" that survived every lighting test); `THICK` .8 mm and the
dome's clearance only over the iris (a < .6); the smile recipe lower .45,
lid .22 (bright eyes); `cheeks()` reaches the lower socket (.728). Tried
and reverted: a flatter ball (depth 8: thick plates), an under-brow pad
(any local lift read as a raised disc), SINK 12 (deep-set, a V-crease),
the lower lid "forward only" rule (a shelf). Kept: depth 12, SINK 9.
Review: `tripo_gateA.py` (gateA.png, gateA-side.png, gateA-moves.png,
gateA-wire.png), page `out/plan-lids.png`. Remaining, said plainly on the
page: the shut eye's mound and its depth under the brow (his sculpt's eye
dish is 9 mm behind the egg's front), the lower lid's small ledge, a faint
outer-corner seam, the lash thinner than the art's.

Jose then: "keep tuning the eyes" (review 4): `LASH_ROWS` 3 mm full,
darker; the lower lid its own thickness and roll (`LOW_THICK`, `LOW_RIM`)
and a faint line; past the corners the rim rows are the edge itself (a
spike at the corners); `set_face(gaze=(gx, gz))` turns the eyes (iris and
dome) and the lids follow (up .09, lower .06 per unit). `tripo_lidtest.py`
adds look up / down / left. Page `out/plan-lids.png` (review 4).

## Rebuild (about 15 minutes)

```
pip install bpy opencv-python-headless pillow scipy
cd docs/mockups/smiley-3d && mkdir -p in
unzip -j <the zip> -d /tmp/z && cp "/tmp/z/Dr.Smiley ( hands down ) .glb" in/tripo-hands-down.glb
python3 tripo_fix.py && EYE_STYLE=matched python3 tripo_eyes.py && python3 tripo_rig.py
python3 tripo_face.py && python3 tripo_mouths.py && python3 tripo_muscles.py
python3 tripo_eyes2.py && python3 tripo_teeth.py          # TEETH=band is the default
python3 tripo_mouths.py && python3 tripo_muscles.py       # again: the pucker and the second "oh" need the teeth
```

`tripo_muscles.py` ends by rendering `out/plan/mouths.png`: compare it with
the committed one (git) to confirm the rebuild matches (2026-10-23: it did,
mean difference 0.01 of 255; only render grain). `pip install bpy` took
~4 minutes; the whole chain ~7 minutes on the cloud machine. Rendering the
reactions sheet alone: open `in/tripo-face.blend`, `render_sheet(ob, CX)`
from `tripo_mouths.py` (2.5 min).

## Next

1. Jose's verdict on the "oh" (`out/plan-oh.png`). Then the other
   leftovers in his order: the faint rim round a shut eye; the laugh's
   shut-eye arc ends dip; the corner nicks of the new "oh".
2. The expression sheet, six poses and the turn as a plan page for his OK
   (`tripo_sheet.py` already renders them; tune the crouch and the
   thinking pose first: the crouch's legs splay, the hand misses the chin).
3. The animation (R2), a visual plan first (blinks: 2-3 frames down, 1
   hold, 3-4 up, motivated by a thought or a look change; lids follow eye
   darts; Animation Mentor / Bloop Animation, noted 2026-10-22).
4. Raised and parked: Blender MCP adds no accuracy (same bpy); the real
   ceiling is the fused Tripo mesh; a freelance artist for a clean face and
   sculpted expressions is the step up if Jose wants it.

## Previews

Jose: "Always show me a preview" (in `AGENTS.md`): every reply that reports
work carries its picture. Pages are made with `storyboard.board()`; the eye,
teeth and mouth pages are appended to `tripo_eyesboard.py`.

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

1. **Done, waiting on Jose's OK:** after the traced mouths Jose asked
   for mouths that move "how a normal person makes mouth reactions".
   `tripo_muscles.py` adds muscle blocks after FACS action units (keys
   `AU.*`: SmileOff/SmileOffOpen, Relax (closed lips, via `fit_line`),
   CornerDepress, LipStretch, Dimple, ChinRaise; recipes from Matsumoto &
   Ekman 2008 as quoted by secondary sources: the primary PDFs are blocked
   from the cloud session), `MOUTHS` in `tripo_mouths.py` mixes them, and
   `render_sheet()` + `diagram()` draw `out/plan/mouths.png` and
   `out/plan/muscles.png`; page `out/plan-mouths.png`. Lessons: a corner
   move must carry the cheek (~4-5 cm); fade by distance to the side, not
   by depth (the mouth is deep at its corners); move closed lips sideways
   only through their meeting line (`fit_line`), never by pulling corners.
   Then Jose: "push them further". Recipes in `MOUTHS` go past 1 (sliders
   to 2), `set_face(lid=...)` sets lids per expression (sad heavy, doubt one
   half shut), `JawOpen` moves only the lower jaw (`close_mouth(upper=0)`),
   the top teeth stay still when it opens (teeth = white or light grey, plus
   one ring). Limits: harder corner pulls crease toward the nose; the drawn
   laugh's shut happy-arc eyes need a lower lid (not built).
1b. **Then Jose: "look alive and human like; the teeth and eyes need work".**
   Plan shown: `out/plan-alive.png` (`tripo_alivepan.py`, close-ups
   `out/plan/cu-*.png`). Teeth: real 3D upper row on the skull, lower row,
   gums and tongue on the jaw, his painted band tucked away. Eyes: (a) a
   clear cornea dome (shine from the light), (b) iris fibres, dark rim,
   depth, (c) lids with thickness and a rounded edge, lashes on the lid
   (the separate liner floats off the eye from the side), (d) shaded whites,
   pink inner corners, (e) a lower lid (squint, laugh arcs). Waiting on his
   OK and which first. Jose: eyes first. Step 1 done (`tripo_eyes2.py`,
   on `in/tripo-face.blend`, always rebuilt from
   `in/tripo-face-before-eyes2.blend`): a clear cornea dome per eye that
   follows the gaze (its `set_gaze`), iris fibres/collarette/dark rim in the
   eye shader, and `eye_lights()` (called from `build.studio()` when a
   cornea exists): one round catchlight seen only in reflections, up and
   right; studio lights, floor and world hidden from reflections (they made
   rectangles and haze). Shown: `out/plan-eyes2.png`; Jose OK'd it.
   Step 2 (`rebuild_lid`, `glue_liner` in `tripo_eyes2.py`): the lid mesh
   replaced (same object, rig, blink keys B1..B8): an edge that arches over
   the eye (it was a flat cut: a card), a rolled rim, a dark lash line on
   the rim's front, lashes that grow in as it lowers and flick at the outer
   corner; the liner kept but pressed onto his skin by ray casts (it
   floated from the side) and bolder. Shown: `out/plan-eyes3.png`, waiting.
   Known: a shut eye is a plain dome (lower lid, step 4).
   Jose: "work more on it to make it more human". Step 3: lower lid
   (`build_lower_lid`, `LidLow.L/R`, keys U1..U6, `set_lower`,
   `set_face(lower=...)`; hugging the ball, LOW_R 1.03: at 1.2 it stood out
   over the cheek), pink inner corners (`caruncle`). Shown
   `out/plan-eyes4.png`: upper lid at rest A (now) / B (on the iris, my
   pick) / C (over it), waiting on his pick. Not done: the raised lower lid
   still reads as a separate skin patch (needs to blend into the cheek).
   Jose picked B: `REST_LID = .26` in `tripo_face.py` (surprised opens to
   0; sad .44, doubt .56). Lower lid: `LOW_HIGH -24`, the cheek's own
   colour (`cheek_colour`). Squint works (`lower=.5`); shut laugh eyes do
   not: lid shells over a ball standing 6 mm out read as goggles, lash
   lines cross. Proposed (`out/plan-eyes5.png`, waiting on Jose): wrap the
   lids into his skin, blending from the ball near the edge to his face
   surface further out (ray casts, like `glue_liner`).
   Jose OK'd; done: `face_grid` + `wrap` in `tripo_eyes2.py` (inside the
   eye's outline on the ball, outside .6 mm under his skin, never into the
   ball or dome; rim and lashes move with their column's edge; the upper lid
   .8 mm further out so it closes over the lower). Laugh: `lid .64, lower 1`
   (both edges arch up and meet); smile `lower .3`. Shown
   `out/plan-eyes6.png`, waiting. Next: the teeth (plan in plan-alive).
   Jose then: no lower lids, the lashes "awkward and unnatural", "study
   animators". Now (`tripo_eyes2.py`): no lower lid (`build_lower_lid` not
   called), the painted eyeliner in his texture painted out
   (`paint_out_liner`, `in/tex-noliner.png`: it stayed behind like glasses
   as the lid lowered), the Liner objects removed, the lid a skin shell
   ending at its edge plus one tapered lash-line tube riding it
   (`line_verts`, part of every blink key), lid in his skin colour
   (`lid_skin_colour_above`), happy shut eyes = shape key `Happy`
   (`set_face(happy=1)`): lid shut, line an upward arc across it. `wrap`
   uses a soft minimum near the ball (a hard min drew a grid cross).
   Shown `out/plan-eyes7.png`, waiting. Known: shut eyes bulge a little,
   arc ends dip.
   Jose: "see how the eyelashes are moving?". Cause: `wrap` also pulled the
   lid ring's hidden back half forward; it showed as a second lower lid edge
   under the lash line. Fixed (only y<0 wraps); `REST_LID` .32 (on the iris
   top), sad .5, doubt .32/.62. Shown `out/plan-eyes8.png`, waiting.
   Diagnostic trick: colour Lid red and Lash blue (`/tmp` script pattern).
   Jose: surprised and laugh "don't look right". Laugh: `HAPPY_EYE_DEPTH`
   .4 (`set_face(happy=1)` scales Eye/Cornea depth; the Happy lid is built
   for the shallower ball), line across the eye's middle (-40, 28).
   Surprised: `oval()` a=.02 b=.012 with a gradual squeeze (`UP_FADE`
   .035) and a nose guard (`NOSE_Z`), recipe `O 1 + JawOpen 1.1` (`Narrow`
   folds, don't use). Shown `out/plan-laugh-surprised.png`, waiting.
   Left: teeth streak (real teeth next), faint shut-eye rim, soft folds by
   the nose in the "oh".
   Teeth (2026-10-23, Jose "let's continue"): `tripo_teeth.py` finds the
   painted band in his original colours (`in/hair_tex.png`), paints it into
   the mouth's dark red (`in/tex-noteeth.png`), builds 10 rounded teeth +
   gum on the head bone, saves the arc (`in/teeth-arc.npz`) for `oval()`,
   which keeps puckered lips 3.5 mm in front of the teeth and tucks the old
   sheet back. `tripo_eyes2.py` now edits in place (it used to restart
   from `tripo-face-before-eyes2.blend`, which undid newer mouth keys).
   Build order: tripo_face, tripo_mouths, tripo_muscles, tripo_eyes2,
   tripo_teeth, then tripo_mouths + tripo_muscles again (the pucker needs
   the arc). Shown `out/plan-teeth.png`, waiting.
   Jose: "teeth doesn't look right". `TEETH` style in `tripo_teeth.py`:
   `band` (default, one smooth white band as drawn: `build_band`),
   `grooves` (faint dividers: read as a saw), `teeth` (separate: read as
   dentures). Shown `out/plan-teeth2.png`; Jose picked A, the band.
2. Then the expression sheet (brows + eyes + mouth + cheeks), six poses,
   a 360-degree turn: stop for his OK.
3. Then the animation (R2), as a visual plan first.

Plan pictures: `storyboard.py` (`board()`, import it), `tripo_faceboard.py`,
`tripo_mouthboard.py`. Build order after a fresh rebuild: `tripo_fix.py`,
`tripo_eyes.py` (EYE_STYLE=matched), `tripo_rig.py`, `tripo_face.py`, `tripo_mouths.py`,
`tripo_muscles.py`, `tripo_eyes2.py`.

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
