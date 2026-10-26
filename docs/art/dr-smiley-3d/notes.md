# Dr. Smiley in 3D: the Blender test (2026-10-25)

Question: can his full body be a real 3D model, rigged and animated, instead of
the cutout rig (`docs/art/dr-smiley-body/prompts-fix.md`, "the four ways
forward")? This is a test only. Nothing in the app changed.

Jose's verdict on the still: "Looks like him: go on".

## What was made

| File | What |
|---|---|
| `likeness.webp` | The master picture (left, its grey wall keyed out) beside the 3D render (right), both on navy, same framing |
| `face-frames-on-3d.webp` | The master's face, then the 3D head wearing three of the app's face frames: rest, smile, eyes shut |
| `face-decals.webp` | All 30 face frames (`drsmiley/face.webp`, same order) fitted onto the 3D face's skin, one strip; what the 3D head wears |
| `greet/greet_0001-0046.webp` | The 3D "greet", 46 frames, 24 fps (1.92 s), 320 x 440, see-through. Frames 1 and 46 are the rest pose |
| `greet-strip.webp` | Every 4th frame of it, on navy |
| `greet-side-by-side.mp4` / `-half-speed.mp4` | The current cutout greet (left, `BG=is-navy node tools/body-clip.cjs`, seed 7) beside the 3D one (right) |
| `greet-alpha.webm` | The same move as a see-through WebM (VP9 with alpha), 118 KB |

Big files stay on Jose's PC, not in git, in `C:\Users\Inter\Documents\DrSmiley3D\`:
`dr-smiley-3d.blend` (the Blender file with the rig, the move and the face plate,
25 MB with the cloth cache; it reads its pictures from that folder, so keep them together), `meshy-in\dr-smiley-hands-down.glb` (the Meshy model as it came,
32 MB), `dr-smiley-greet.glb` (the rigged model exported, 1.1 MB), the PNG
renders and the cutout clip's frames.

## How it was done

1. **The model.** Hyper3D Rodin's free trial in the Blender add-on was out of
   money ("API_INSUFFICIENT_FUNDS"); Hunyuan3D needs Tencent keys or a local
   server; Meshy and Tripo need a key or Premium. Jose's own Meshy model of him
   (`Dr.Smiley (hands down).glb`, made 2026-10-21 from his picture) was used:
   0.9 M faces, three 2048 px textures (colour, metal/rough, normal).
2. **The still.** Camera fitted to the master by outline: the 3D outline covers
   the master's at 90% (overlap / union of the two shapes), same height, top
   and bottom (y 28 to 1414 against 29 to 1415 on the 1070 x 1470 canvas). An
   85 mm lens, a soft key from the upper left, a fill, a rim. Colours: Blender's
   "Standard" view (the "AgX" default washed him out), skin and hair a little
   warmer (saturation 1.1, hue toward red).
3. **The rig.** The mesh cut to 116 k faces (13%). Rigify's basic human,
   bones placed from the model's cross-sections and the cutout rig's pivots
   (`drsmiley/body/rig.json`), generated. Blender's automatic weights failed on
   the Meshy mesh (it is many loose, overlapping pieces); they worked on a sealed
   copy (voxel remesh at 12 mm) and were copied over. **The big head:**
   everything above the chin (z 1.17 m and up) is moved by the head bone only,
   blended over 7 cm into the neck, so his head never bends or squashes.
4. **The move (greet).** Keyed by hand, pose to pose, at 24 fps:
   - frames 1-4 rest; 4-8 **anticipation**: a dip (the whole body down 14 mm),
     the arm pulls in and down, the shoulder drops, the head tips away;
   - 8-16 the rise on an **arc**: the upper arm swings out and up (to 72 degrees, settling at 66) with the
     elbow leading, the forearm still nearly straight and the hand hanging
     (**drag**), then the forearm whips up and the hand flicks in past its
     place (**follow-through**), settling by 20;
   - 20-35 two wags of the forearm from the elbow (about 3 a second), the hand
     a beat behind each one, a small sway in the chest and head with them;
   - 35-46 down: the upper arm falls first, the forearm stays bent and trails,
     the hand trails last; the arm overshoots past hanging (frame 43) and settles.
   - **The body joins the arm**: the shoulder lifts 10 degrees on the raise,
     the chest leans 3.5 degrees toward the wave with the hips countering, the
     head tilts toward the hand, the body rises 10 mm at the top. The legs stay
     planted (Rigify's foot IK).
   - Face, the same order as the cutout greet in `drsmiley/body.js`: rest,
     blink1 (frame 6), smile1 (9), smile (13), smile2 (35), smile1 (39), rest (43).
5. **The face.** The app's 30 frames don't fit the 3D head as they are: the
   Meshy face follows the master, whose eyes are bigger and wider apart than
   the app's `base.webp` face, and its eyes and mouth are carved and layered
   (eyeballs, teeth, inside of the mouth) under the skin. What worked:
   - each eye and the mouth of every frame placed on its own (eyes 1.4 x,
     mouth 1.15 x, all turned 7 degrees level), the frame's skin colour matched
     to the 3D skin, the Meshy brows kept on top;
   - the old eyes and mouth (all their layers) cut out of the mesh;
   - a smooth "face plate" (from the sealed copy, smoothed, pushed just above
     the skin) laid over the hole, wearing the 30 frames, moved by the head
     bone. One number picks the frame, as in the app.
   Tried first and dropped: painting the frames straight onto the Meshy face
   (its own eyes showed around them, double lids, pink whites); smoothing or
   shrink-wrapping the carved face (the hidden teeth and eyeballs came through
   as shards and streaks).

## What worked, what didn't

Worked:
- **The likeness** of the body: coat, scrubs, shoes, hair, proportions.
- **Real bending**: the arm bends at the elbow, the sleeve goes with it, there
  is no picture swap anywhere, so none of the cutout's jumps (problems 1, 2
  and 4 in `prompts-fix.md`) can happen. The body takes part in every beat.
- **His app expressions on the 3D face**, all 30, switched like the app does.

Not good enough yet:
- **The hand (fixed in the second version).** Meshy made each hand one
  cupped, mitten-like lump with no fingers to move. Jose's look at the first
  version ("doesn't look right": the hand, then "still not right": the hand)
  was right: it read as a fist and the arm hugged his head. Bending the lump
  open (one bone through it) only made a paddle. What works: **the waving
  hand is new**, built in Blender (`HandR` in the .blend): a chubby cartoon
  palm, four fingers and a thumb, fused into one smooth shape, his skin
  colour, 18% bigger than Meshy's; Meshy's right hand is cut off inside the
  cuff. One finger bone at the knuckles (`DEF-fingers.R`) keeps it relaxed
  at rest and opens it flat a beat after the arm arrives; the wrist stands
  it up beside his head, palm out; it grows a little (up to 1.16 x, the
  cartoon way) while it waves. The arm is lower and wider (elbow 66 instead
  of 95 degrees out) and the wag swings away from his face, like the drawn
  wave. Still: the fingers move together (one bone, no spread or ripple),
  and the left hand is still Meshy's lump (it only hangs). Note: the "v2"
  video first sent to Jose was the old frames by mistake (a render went to
  the wrong folder); the committed files are the real second version.
- **The face up close.** Eyes, smile and blinks read at 440 px; at full size
  the mouth plate shows a faint light patch, and the brows can't move (the app's
  separate brows, `DR_BROWS`, were not done). From the side the face plate
  would show: the frames are front pictures.
- **The coat (fixed in the third version).** Jose: "the coat doesn't move
  right". In the Meshy model the arms hang against the coat, so sleeve and
  coat side are one fused surface, in 600+ loose pieces; raising the arm
  dragged the coat's side up into a web from elbow to chest. Splitting them
  by hand on that mesh tore it, and softening the weights spread into the
  coat front (both undone). What works: a clean **driver** mesh (`Driver`
  in the .blend, hidden): the Meshy mesh split into the two arms and the
  body, each sealed on its own (solidify, then a 6 mm voxel remesh), rigged
  with Blender's automatic weights; on the body piece the arm bones are
  allowed only near the shoulder seam. Its weights are copied onto the
  Meshy mesh (the head's kept as they were). The coat's side now stays
  straight under the raised arm, no tears. **Secondary motion:** two coat
  bones (`DEF-coat.L`/`.R`) carry the coat's lower panels (the white of the
  texture below the waist, sleeves left out), keyed a beat behind the body:
  the hem flares on the dip, settles on the rise, the right panel lifts with
  the wave and drops when the arm comes down. Still no real cloth: the coat
  doesn't hang or fold on its own, and a new Meshy model in A-pose (arms
  away from the body) would give clean sleeves from the start.
- **The Blender skills' checks (fourth version).** With the
  `blender-agent-skills` plugin (Jose: "use any blender skill"): its model
  check (`blender-asset-qa`, `qa_check.py`) found 8,736 duplicate points
  (the Meshy mesh split along its texture seams, so it was 629 loose
  pieces), points pulled by more than 4 bones, and a stray bit. Fixed:
  seams welded (13,236 points merged; 629 pieces became 49), at most 4 bones
  per point. Its rig stress poses (`blender-character-rigging`,
  `stress_poses.py`, arms raised, elbows bent, crouch, twist) showed the
  weld had glued the left hand to the hip (122 points on the chest bone)
  and arm to coat at a few touching spots: the hand's points were moved to
  the arm, and those false joins cut (edges only). Tried and undone:
  deleting the faces glued between sleeve and coat (it left a hole at rest)
  and hiding back faces (the opening turned see-through). The rig check
  script (`rig_check.py`) fails on Blender 5.2 (it slices a collection with
  a step, which 5.2 refuses) and wasn't used. Still open: with an arm held
  straight out (not in the greet) the sleeve's underside still stretches.
- **Real cloth on the coat (fifth version, `blender-simulation`).** Jose:
  "continue with coat". The Meshy coat can't be simulated itself (fused,
  uneven triangles), so, as the skill advises, an even cloth mesh is built
  for it: `CoatCloth` in the .blend, 1,161 points, about 2.5 cm squares,
  rays cast from his middle onto the outside of the coat from the waist
  (z 0.84 m) to the hem, the front opening and the back vent left out (its
  points are only coat, never sleeves). It is skinned from the body (coat
  bones included, no arm bones) and simulated with Blender's cloth: pinned
  fully at the waist, easing to 30% at the hem, mass 0.2, bending 2, quality
  10, colliding with a copy of his trousers (`LegCollider`, 8 mm), 12
  frames of lead-in before frame 1 so it starts settled. The real coat's
  3,947 points from the waist down follow it (Surface Deform, fading in
  from the waist). Measured: the hem trails the body by 1 to 3 cm during
  the wave (2.9 cm at most, at the top flick) and is back within 0.2 mm of
  rest at frame 46. At 440 px that's a few pixels of sway. Gotcha found:
  the helper meshes must stay "in render" (made invisible with a
  transparent material and no camera/shadow rays); set to not render, the
  final render skipped the cloth and the coat panel tore. `coat-cloth-before-after.webp`:
  frame 23 before, frame 17 with the cloth.
- **The look** is close, not the same: his hair is darker brown and the coat
  flatter than the master's.

## Cost per move

Measured on this PC (Blender 5.2, EEVEE):
- **Money:** none per move. One Meshy generation for the model (Jose's Meshy
  account). Blender, Rigify and ffmpeg are free.
- **Rendering:** 35 to 39 s for the 46 frames of greet at 320 x 440, 64 samples.
- **Making it:** the one-time work (model, rig, weights, face plate) was most
  of this session. A new move on the same rig is keying 8 to 15 poses: one
  focused chat step, plus a look and a fix or two; no new drawings ever.
- **Weight in the app per move** (greet, 1.9 s): 736 KB as 46 WebP frames,
  118 KB as a see-through WebM. Twelve moves would be about 9 MB as frames, or
  about 1.4 MB as WebM plus the iPhone copy.

## Three ways into the app

**1. WebP frames per move, like `city/`.** Each move rendered as frames
(`greet/` here), played by swapping pictures, the way the drawn poses and his
face already swap.
- Works on every phone; the exact Blender look; no new library; Still and
  reduced motion are just one frame.
- Can't: blend from one move into another or change mid-move (a tap during a
  wave waits or cuts); his expression is baked into the frames, so the app's
  face engine (`DrAnim`) can't act over the body unless the body is rendered
  without a face and the app lays `face.webp` on top (that needs the head's
  place per frame exported too); the largest of the three per move.

**2. See-through video per move.** WebM with alpha for Chrome and Android
(tested: `greet-alpha.webm`, 118 KB) and HEVC with alpha for iPhone Safari.
- The smallest files; smooth playback.
- Can't: be made fully on this PC: this ffmpeg's HEVC encoder (x265) refused
  an alpha layer, so the iPhone copy needs a Mac (Apple's encoder); two files
  for every move; same limits as frames for blending and the face; precise
  timing (holding a pose, starting from a frame) is harder with video than
  with pictures; iPhone Low Power Mode may stop videos from playing by
  themselves (a known iPhone behaviour, not tested here).

**3. A GLB model through the Three.js in `brain/`.** The rigged model and its
moves in one file (`dr-smiley-greet.glb` on the PC: 1.1 MB with Draco
compression, 112 k triangles, one animation), drawn live in the page.
- The only way that reacts: blend moves, turn to a tap, hold any pose, any
  size; the face frame is one number (a texture offset).
- Can't: be dropped in as is. `brain/three.min.js` (603 KB) has no GLB loader;
  the loader and Draco's decoder would have to be added. The export lost the
  normal map and the colour warm-up (glTF only takes plain materials), and
  Three.js won't light him like Blender did, so the look has to be rebuilt and
  will differ. 112 k triangles is heavy for a phone kept on screen; it would
  need cutting to about 20 to 30 k. It costs the most battery of the three,
  every frame, and the moves would be animated in Blender anyway.

## My read

3D fixes what the cutout can't (no swaps, real bends, the body in every move)
and it still looks like him. Two things stop it from replacing the cutout
today: the mitten hands and the face plate up close. If Jose wants to go on,
the next test is a model with real fingers, then one more move (cheer) to
check the cost per move holds. The way in I'd pick is WebP frames per move
(the first way): it's what the app already does with his drawn poses and
the campus, and it works on every phone.
