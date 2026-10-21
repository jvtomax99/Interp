# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-21, from the chat that made the Dr. Smiley
reel (v1 on Home's tiles, v2 at HUMC; PR #110).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> start the 3D Dr. Smiley (phase R1 in the handoff): say in 2-3 lines what
> you'll build first and wait for my go. Plain words, say "working on it"
> and "done".

## Where things stand

- **PR #110 (`claude/smiley-reel`), open, waiting for Jose's OK.** Docs
  only (`docs/mockups/smiley-reel/`, nothing deployed): v1 reel (12 s, Dr.
  Smiley as a flat cutout hopping Home's four quick tiles, `reel.mp4`
  committed) and v2 (20 s at HUMC from Jose's four photos; video not
  committed, 29 MB, re-render with `node render.cjs v2`). Folder README
  says how each is made. No check-ins pending.
- **Jose's verdict on both (2026-10-21):** "Dr. Smiley doesn't look like
  the reference video and animation." **Scratch the HUMC pictures**
  (v2 stays in the PR as a record; not the direction). Focus on Dr. Smiley
  and his animation.
- The reference: an Instagram reel where a 3D toy mascot hops across a 3D
  After Effects screen; everything (scene, music, render) made as code.
  That mascot is Claude's own character (Clawd): match the *style of
  animation* (solid 3D toy, real hops, tumbles, squash, landings on the
  beat, close camera, depth of field), never its design.

## What's next: a 3D Dr. Smiley with a skeleton (Jose's picks)

Jose's picks: **a 3D toy figure of Dr. Smiley built in code, with his
drawn face and expressions on the head**; invent the sides, back and body
he has never drawn ("let's invent them"); **a skeleton for movement and for
facial expression.** What it takes:

1. **The figure (mesh).** Chibi toy proportions: big head (about 45% of
   his height), his brown hair as 3D clumps that read from the side and
   back, ears, neck, white doctor's coat over navy scrubs, short arms with
   mitten hands, short legs, shoes, the lanyard and badge. Colours sampled
   from `drsmiley/base.webp`. Soft vinyl-toy finish (rounded, slight
   clearcoat), like v1's tiles.
2. **The skeleton (rig).** Bones: root, hips, spine, chest, neck, head;
   per side shoulder, upper arm, forearm, hand; thigh, shin, foot. Toy
   parts hang rigidly on bones (no weight painting); the coat's hem can
   be a few skinned bones or springs.
3. **The face rig.** His drawn face stays his: the face skin cut from
   `base.webp` (inside the hairline, without the hair and outline), wrapped
   onto the head's curved front, with the 30 eye/mouth frames
   (`face.webp`, `DR_FACE_FRAMES`) switched on it and the brows as their
   own decals moved by `DR_BROWS`, exactly as `drSmileyArt()` lays them
   out (numbers in `scene.html`, `ART`). A head-turn then foreshortens his
   face like a real one. Limit: no full profile face (it turns away).
4. **Motion.** Keyed poses on a timing file (like `timeline.json`):
   idle breathing, anticipation crouch, jump (legs tuck, arms up), a spin
   or flip in the air, land with squash, wave, look at something, point,
   happy bounce. Secondary motion on springs: hair, coat hem, lanyard.
   Disney principles as in `docs/features/dr-smiley.md`.
5. **Approval gates for Jose, in order:**
   - R1: the figure and skeleton. A turntable (he turns 360 degrees) and a
     sheet of six poses, phone size, sent as files. Jose approves the
     invented sides, back and body before any animation.
   - R2: the motions, as short clips on v1's Home tabletop.
   - R3: v1's reel rebuilt with the 3D figure in place of the cutout.
   Each a commit on its own branch and PR (PR #110 can merge first).

Tools: three.js 0.160 and Playwright are already installed in
`docs/mockups/smiley-reel/` (`node_modules`, not committed; `npm install
three@0.160.0 playwright@1.56.1` in a fresh container). The render and
sound pipeline in that folder works (`render.cjs`, `sound.py`). Option to
weigh in R1: `pip install bpy` (Blender 5.2 as a Python module) works here
and could build smoother organic shapes (hair, coat) and export a GLB with
the skeleton for three.js to render; Blender's own renderer is too slow
here (no graphics card).

## Open questions for Jose

- Merge PR #110 as a record, or close it?
- Later: should the 3D Dr. Smiley replace the drawn one in the app, or
  stay for videos? (In the app it would be pre-rendered frames, not live 3D.)

## Learned in this chat (also in `docs/PLAN.md` Facts)

- three.js in headless Chromium (SwiftShader) renders 1080 x 1920 with
  depth of field and soft shadows at about 1.1-1.5 s a frame.
- `ShaderPass` clones its uniforms, textures too: set a live texture on
  the pass after creating it, or its updates never show.
- Film grain makes video huge (110 MB for 20 s at crf 18): x264 crf 27
  with `-tune grain` gives 29 MB with no visible loss.
- No speech-to-text here (Hugging Face blocked); captions can be read off
  frames. PyTorch's site blocked; OpenCV EDSR upscaling works.
