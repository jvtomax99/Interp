# Dr. Smiley: prompts for his full body

**These are the prompts to run** (2026-10-23, after a 2D redraw was tried
and dropped for likeness: `../dr-smiley-2d/prompts.md`). Jose: the body
animated the way his face is, drawn pictures of the same him in each pose.
**Done 2026-10-23:** `wave.png`, `fist-pump.png`, `think.png`, `shrug.png`
came back (same size, 0 to 4 px off, colours within a few points) and are
cut into the rig (`layers/cutframes.py`, `drsmiley/body/pose-*.webp`;
`preview-frames.png` shows them on the body, `preview-acting.png` mid
performance). `crouch.png` and `jump.png` came next (made from the shrug
picture, so their arms are out; only the legs are cut) and are in as the
leg plates of the cheer and the quiz bounce. `thumbs-up.png` came too (from the jump picture; only the arm is cut, as a
feathered band) and is at the top of the quiz bounce. **Left in the table,
not needed yet:** `point.png`, `clipboard.png`, `body-noarms.png`.

Same workflow as `docs/art/dr-smiley-faces/prompts.md`: an image tool that
edits a picture you upload (ChatGPT image editing or similar), one change
per request. His head is never remade: whatever head comes back, the real
one (`drsmiley/base.webp`, the 30 face frames, the brows, the rank hats)
is fitted onto the body afterwards. So the body only has to match his
collar, his angle and his lighting, not his face pixel for pixel.

What the app needs (layers, not Rive, as `docs/PLAN.md` F1 says): the
master standing pose (done), a torso plate with no arms (so arm poses can be laid
over it), a T-pose (cut into upper arm and forearm pieces for smooth waves
and points), then arm poses as frames, two leg plates for the quiz bounce,
and two face frames. Every pose is generated from the master, with nothing
else moved, so the pieces line up the way the face frames do.

Send every result, even an imperfect one; alignment is measured here and
the ones to redo are named. Save each with the name given.

## Step 1. The master: done

Jose sent his full body on 2026-10-23: `body-master.png` (standing, arms at
his sides, straight on, on a light grey background, 1070 x 1470) and
`body-wave-props.png` (waving, with a stethoscope, the HMH logo on the
scrubs, a "Dr. Smiley" badge and a clipboard; a reference for props, not
a layer source). Proportions: about two and a half heads tall, royal blue
scrubs and blue shoes. The master's scrub blue is lighter than the app
head's (mean RGB 31,74,145 against 20,52,114 in `base.webp`) and his
head faces straight on where the app's is turned a little; the head is
cut at the chin and fitted on the body's own collar, so neither matters.

## Step 2. Poses (upload `body-master.png` for each)

Paste this opening before every pose prompt:

```
Edit this image. Keep everything identical: the same character, size,
position, camera, head, face, hair, coat, pants, shoes, lighting and the
plain light grey background. Do not move, zoom, crop, tilt or redraw anything
except what is described below. His feet stay exactly where they are, his
head does not move. Same 3D cartoon style, same render quality, same size
and aspect ratio (2:3). Change ONLY the following.
```

| File | Prompt (after the opening) |
|---|---|
| `body-noarms.png` | Both arms go behind his back, hands clasped behind him, so no arm, hand, sleeve or elbow is visible in front of or beside his body. The coat's front, lapels and sides stay exactly as they are. |
| `body-tpose.png` | Both arms held straight out to the sides, level with his shoulders, palms facing the viewer, fingers relaxed and slightly apart, the coat sleeves following the arms. |
| `arms-up.png` | Both arms straight up over his head, hands open, fingers spread, like a cheer. The coat sleeves slip a little toward the elbows. Face unchanged. |
| `fist-pump.png` | His right arm (on the picture's left) bent and raised in a fist pump, the fist beside his ear, elbow out. His left arm stays at his side as it is. |
| `wave.png` | His right hand (on the picture's left) raised beside his head, palm open toward the viewer, fingers together, in a friendly wave. The other arm stays at his side. |
| `thumbs-up.png` | His right arm bent at the elbow in front of his chest, hand in a thumbs-up toward the viewer. The other arm stays at his side. |
| `pockets.png` | Both hands in the coat's side pockets, elbows slightly out. |
| `think.png` | His right hand raised to his chin, index finger resting on the chin; his left arm folded across his stomach, its hand under the right elbow. |
| `shrug.png` | Both arms bent at the elbows, forearms out to the sides, palms up and open, shoulders raised a little. |
| `crossed.png` | Arms folded across his chest, each hand tucked under the other arm. |
| `point.png` | His right arm extended straight out toward the picture's left, index finger pointing. The other arm stays at his side. |
| `clipboard.png` (done 2026-10-23) | Both hands holding a plain white clipboard with a silver clip at chest height, slightly tilted toward him, as if reading it. Nothing written on it. |

Two leg plates (the quiz bounce; here the feet may move):

| File | Prompt (after the opening) |
|---|---|
| `crouch.png` | His knees bend into a small crouch, feet flat and in the same place, his whole body a little lower, arms as they are. |
| `jump.png` | He is in the air at the top of a small hop: feet off the ground, knees bent and tucked a little, toes pointing down, arms as they are. |

## Step 3. Two faces (upload `docs/art/dr-smiley-faces/reference.png`, use the opening from `../dr-smiley-faces/prompts.md`)

| File | Prompt |
|---|---|
| `happy.png` | Eyes closed into two happy upward arcs, cheeks lifted high. Mouth a wide open happy smile, the top teeth showing. |
| `wince.png` | Both eyes squeezed shut tight, lids wrinkled. Mouth a tight grimace pulled to one side, clenched teeth showing, one corner down. |

The four talking mouths in that file are still optional.

## What happens next

1. Each pose is laid over the master and measured (scale, offset, colour),
   as the four faces were. Drift under a few pixels is corrected; a zoomed
   or moved result is redone. The grey background is cut away (it is
   flat, so a plain colour key does it).
2. The real head (`base.webp`) is cut at the collar and fitted on the
   body, with the neck as the pivot, so the head keeps every face frame,
   brow pose and rank hat.
3. The arms are cut from each pose and laid over `body-noarms.png`; the
   T-pose is cut into upper arm and forearm pieces for continuous motion.
4. New layers go into `drSmileyArt()` and `DrAnim`; `dr-smiley.md`
   and the User Guide are updated with the places he shows full-length.

## Done without the generator (2026-10-23)

No image generator runs in a cloud session, so the master was cut into a
cutout rig by code instead (`layers/`: `seams.py` tracks the sleeve
seams, `build.py` does the rest; `rig.json` has the pivots in master
pixels). `head.webp` is the app's own head (`base.webp` above its chin,
scaled 1.088, its sliver of coat removed) with a skin neck tube behind;
`head-master.webp` is the master's own head for comparison. `body.webp`
is the torso and legs with no arms (the floor shadow keyed out, the coat
edge under each sleeve relit from the coat beside it); the arms are four
pieces, upper arm and forearm each side, with round caps at the shoulder
and elbow, drawn behind the body so the shoulder cap covers the joint.
`preview-rig.png`: rest, wave, cheer, fist pump, think, shrug, all from
these pieces. The deployed set is `drsmiley/body/` (with the legs split
and the head on the base grid, by `layers/export.py`), driven by
`drsmiley/body.js` and shown in `drsmiley/body.html`. Wave, cheer and shrug read well; the fist pump and think
poses still need drawn hands (a cutout hand stays an open palm), which
is what the pose prompts above are for. Not wired into the app yet.
