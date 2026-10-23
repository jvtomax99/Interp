# Dr. Smiley: prompts for his full body

Same workflow as `docs/art/dr-smiley-faces/prompts.md`: an image tool that
edits a picture you upload (ChatGPT image editing or similar), one change
per request. His head is never remade: whatever head comes back, the real
one (`drsmiley/base.webp`, the 30 face frames, the brows, the rank hats)
is fitted onto the body afterwards. So the body only has to match his
collar, his angle and his lighting, not his face pixel for pixel.

What the app needs (layers, not Rive, as `docs/PLAN.md` F1 says): one
master standing pose, a torso plate with no arms (so arm poses can be laid
over it), a T-pose (cut into upper arm and forearm pieces for smooth waves
and points), then arm poses as frames, two leg plates for the quiz bounce,
and two face frames. Every pose is generated from the master, with nothing
else moved, so the pieces line up the way the face frames do.

Send every result, even an imperfect one; alignment is measured here and
the ones to redo are named. Save each with the name given.

## Step 1. The master (upload `docs/art/dr-smiley-faces/reference.png`)

```
Edit this image. This is Dr. Smiley, a 3D cartoon doctor in the style of a
Pixar or Disney feature film: soft matte skin with rosy cheeks, glossy
sculpted chestnut-brown hair swept up and back, big round brown eyes with
two catchlights, a small button nose, a calm closed-mouth smile, a white
doctor's coat with lapels over a navy blue V-neck scrub top. Keep him
exactly this character: same head, same face, same hair, same colours,
same soft studio lighting from the upper left, same render quality.

Show his whole body, standing, from the top of his hair to the soles of
his shoes, nothing cropped, with a little empty space above the hair and
below the feet. He is a stylised cartoon figure about two and a half heads
tall: a big head, a small rounded body, short arms and legs, small
rounded hands. His head keeps the exact size, angle and expression of the
uploaded image (turned slightly toward the picture's left), and his body
is turned the same way. Arms hang relaxed at his sides, a little away from
the body, so the outline of the coat is clear. Outfit: the white coat
open and falling to just above his knees, over the navy V-neck scrub top,
navy scrub pants, white sneakers. No lanyard, no badge, no stethoscope,
nothing in the pockets. He stands centred, both feet on the same level.
Plain pure white background, no floor, no shadow on the ground, no props,
no text. Portrait, 2:3 (1024 x 1536).
```

Save as `body-master.png`. Keep it only if the head looks like him, the
coat reads as his, and the whole figure is in the frame. Ask again
otherwise; everything else is built on this one.

## Step 2. Poses (upload `body-master.png` for each)

Paste this opening before every pose prompt:

```
Edit this image. Keep everything identical: the same character, size,
position, camera, head, face, hair, coat, pants, shoes, lighting and the
plain white background. Do not move, zoom, crop, tilt or redraw anything
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
| `clipboard.png` | Both hands holding a plain white clipboard with a silver clip at chest height, slightly tilted toward him, as if reading it. Nothing written on it. |

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
   or moved result is redone.
2. The real head (`base.webp`) is cut at the collar and fitted on the
   body, with the neck as the pivot, so the head keeps every face frame,
   brow pose and rank hat.
3. The arms are cut from each pose and laid over `body-noarms.png`; the
   T-pose is cut into upper arm and forearm pieces for continuous motion.
4. New layers go into `drSmileyArt()` and `DrAnim`; `dr-smiley.md`
   and the User Guide are updated with the places he shows full-length.
