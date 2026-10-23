# Dr. Smiley redrawn in 2D: the plan and the prompts

Jose, 2026-10-23: "It doesn't have to be 3D. I just want it to look natural
and like a professional work." His pick, with the cost stated (the 30 faces,
the brows and the rank hats all redone): **redraw him whole in 2D, head
included**, then rig that. One Dr. Smiley everywhere, never a 2D body under
the 3D head; until the 2D set is complete the app keeps the 3D head as it is.

Why 2D animates better than the cut 3D render: a flat drawing cut into
pieces is how professional cutout animation is made (Rive, Toon Boom); the
shading is flat, so a limb can turn without its light freezing, joints hide
under clean lines, and a hand is a shape that can be swapped. The cut 3D
render could only ever be a paper puppet.

Same workflow as `../dr-smiley-faces/`: ChatGPT image editing on the phone,
one change per request, every result sent here (even a bad one), measured,
the ones to redo named. Save each with the name given.

## Step 0. The style (first, one picture, Jose picks)

Upload `../dr-smiley-body/body-master.png`. Ask for **A** first; it matches
the app's icons (flat colour with a dark outline). Ask for **B** only if A
looks wrong to you.

| File | Prompt |
|---|---|
| `style-a.png` | Redraw this exact character as a flat 2D vector illustration: clean dark navy outlines of one even thickness, flat colours, one slightly darker flat tone for shadow on each colour, no gradients, no texture, no 3D shading. Keep his design identical: the same face, hair, skin tone, white coat, royal blue scrubs, blue shoes, the same proportions (about two and a half heads tall) and the same friendly expression. Standing straight on, full body, feet flat. Plain white background. Portrait, 2:3. |
| `style-b.png` | Same as above, but with no outlines at all: shapes meet edge to edge, shading as one darker flat tone, like a modern app illustration. |

Send the one you like. Everything after this is an edit of that picture, so
the style never has to be described again.

**Done 2026-10-23.** Jose sent two results of prompt A, the same drawing
to the pixel (1024 x 1536, figure in the same place within 1 px):
`style-a1.png` (every line navy) and `style-a2.png` (blush on the cheeks,
the coat's inner lines in light blue-grey). **His pick: `style-a2.png`.**
That is the picture every Step 1 prompt edits.

## Step 1. The master (the picture every piece is cut from)

Upload the chosen style picture. This opening goes before every prompt from
here on:

```
Edit this image. Keep everything identical: the same character, the same
flat 2D style, line thickness, colours, size, position, camera, head, face,
hair, coat, pants, shoes and the plain white background. Do not move, zoom,
crop, tilt or redraw anything except what is described below. Same size and
aspect ratio (2:3). Change ONLY the following.
```

| File | Prompt (after the opening) |
|---|---|
| `master.png` | Pose him for animation: arms held a little away from his body, about thirty degrees out, elbows slightly bent, hands open with the palms toward the viewer and the fingers together; feet a shoulder's width apart, flat on the floor; a calm neutral face, mouth closed in a small smile, eyes open looking at the viewer. No props, no stethoscope, no badge. |
| `master-noarms.png` | Both arms and hands removed completely, so only his head, coat, pants and shoes show. The coat's front, lapels and sides stay exactly as they are, and where each sleeve was, the coat's side is drawn complete. |

The rig is cut from these two: the head above the collar, the torso and
legs from `master-noarms.png`, each arm as an upper arm and a forearm from
`master.png`. Flat colour and a white background key cleanly, so no seam
work.

## Step 2. The head and his faces

After `master.png` arrives, the head is cropped here and sent back to Jose
upscaled as `head-reference.png` (as `../dr-smiley-faces/reference.png`
was). Upload that for every face. The opening:

```
Edit this image. Keep everything identical: the same flat 2D style, line
thickness, colours, head position, head size, angle, framing, hair, ears,
nose, cheeks, skin, coat collar and the plain white background. Do not
move, zoom, crop, tilt or redraw the head. Change ONLY the eyes (lids,
pupils), the eyebrows and the mouth as described. Same size and aspect
ratio (4:5).
```

One face per request. The app's frames (`DR_FACE_FRAMES`), the ones it
needs drawn; the in-between frames (`blink1`, `smile1`, `wink1`, `laugh1`,
`halfL`...) are made here from the drawn ones where a flat style allows it
(a half-closed lid is the open eye with the lid lowered), and asked for only
if that fails.

| File | Prompt (after the opening) |
|---|---|
| `rest.png` | No change at all (this is the check that the reference comes back exact). |
| `shut.png` | Both eyes closed, two calm downward curved lines. Mouth as it is. |
| `wink.png` | His left eye (on the right of the picture) closed in a wink, the other open. A small smile. |
| `smile.png` | A warm closed-mouth smile, cheeks lifted, eyes slightly narrowed and happy. |
| `laugh.png` | Eyes closed into two happy upward arcs. Mouth wide open in a laugh, top teeth showing. |
| `laugh-b.png` | Same laugh, mouth open a little less, eyes still closed. |
| `look-l.png` | Eyes open, pupils moved to the picture's left. Mouth as it is. |
| `look-r.png` | Eyes open, pupils moved to the picture's right. |
| `look-u.png` | Eyes open, pupils up, both brows raised a little. |
| `look-d.png` | Eyes open, pupils down, lids slightly lowered, as if reading. |
| `look-ul.png` | Pupils up and to the picture's left, the brow on that side raised. |
| `look-ur.png` | Pupils up and to the picture's right, the brow on that side raised. |
| `look-dl.png` | Pupils down and to the picture's left, lids slightly lowered. |
| `look-dr.png` | Pupils down and to the picture's right, lids slightly lowered. |
| `love.png` | Eyes as two small hearts. A big closed-mouth smile. |
| `sleep.png` | Eyes closed, relaxed; mouth slightly open, a small "z" floating beside his head. |
| `surprised.png` | Eyes wide open, round, pupils small; brows high. Mouth a small round open "O". |
| `sad.png` | Upper lids heavy over the eyes, looking a little down; inner brow ends up. Mouth closed, corners down. |
| `worried.png` | Eyes looking to the picture's right, lower lids tense; brows pinched up in the middle. Mouth a tight wavy line, one corner down. |
| `doubt.png` | His left eye (on the right of the picture) squinted half closed, the other open. Mouth closed, pulled to one side in a skeptical smirk. |
| `wince.png` | Both eyes squeezed shut tight. Mouth a tight grimace pulled to one side, clenched teeth showing. |
| `talk-a.png` | Eyes as the reference. Mouth open wide and round, tongue visible. |
| `talk-e.png` | Eyes as the reference. Mouth open wide and flat, teeth showing, corners stretched. |
| `talk-o.png` | Eyes as the reference. Mouth small and round, lips pushed forward. |
| `talk-m.png` | Eyes as the reference. Lips pressed closed, slightly pursed. |

The brows come back drawn in each face; here they are cut out as their own
two pieces (`brow-l`, `brow-r`, the skin behind them repainted, as before)
so `DR_BROWS` keeps moving them on its own.

## Step 3. His hands (one picture)

Upload `master.png`.

| File | Prompt (after the opening) |
|---|---|
| `hands.png` | Remove everything except his left hand (on the picture's right), and draw that same hand six times in a row across the picture, each the same size as in the original, same style, on the white background, with a small gap between them: 1. open, palm to the viewer, fingers together; 2. relaxed, fingers slightly curled; 3. a closed fist, knuckles to the viewer; 4. index finger pointing up, the other fingers closed; 5. a thumbs up; 6. gripping, as if holding the edge of a clipboard. |

Each hand is cut here, scaled to the master's wrist and mirrored for the
other side (flat drawings mirror cleanly; the thumb side is checked).

## Step 4. Two leg plates and the hats

Upload `master-noarms.png` for the legs.

| File | Prompt (after the opening) |
|---|---|
| `crouch.png` | His knees bend into a small crouch, feet flat and in the same place, his whole body a little lower. |
| `jump.png` | He is in the air at the top of a small hop: feet off the ground, knees bent and tucked a little, toes pointing down. |

Upload `head-reference.png` for the hats (the rank outfits: `hat-cap`,
`hat-mirror`, `hat-grad` today).

| File | Prompt (after the opening) |
|---|---|
| `hat-cap.png` | Add a blue surgical cap on his head, covering the top of his hair. Nothing else changes. |
| `hat-mirror.png` | Add a doctor's head mirror on a band around his forehead. Nothing else changes. |
| `hat-grad.png` | Add a black graduation cap with a gold tassel on his head. Nothing else changes. |

## What happens here with each batch

1. Each picture is laid over its source and measured (scale, offset, colour
   difference outside the changed area), as the four faces were. Drift of a
   few pixels is corrected; a zoomed, moved or restyled result is named to
   redo.
2. The white background is keyed; flat colour makes that exact.
3. The head above the collar goes on the base grid (480 x 600) as the new
   `drsmiley/base.webp`; the faces are cut inside the face window into a
   new `face.webp` strip with the same frame names, so `DrAnim`, `DR_BROWS`
   and `DR_BROW_OF` need no change; the hats likewise.
4. The body pieces replace `drsmiley/body/` (the same `rig.json` fields,
   new numbers), the hands join as swappable pieces, and `drsmiley/body.js`
   gets a `hand` joint (which hand shows, its angle) so `cheer` makes a
   real fist and `think` a finger on the chin.
5. One pull request per step: the head set first (the app changes
   everywhere he shows, so the User Guide gets a "New lately" card), then
   the body, then where he stands full-length (still Jose's call).

## Where the 3D set stays

`drsmiley/base.webp`, `face.webp`, the brows and hats, and the cutout rig
in `drsmiley/body/`, stay in git history and in `docs/art/` (the masters
and the scripts). `media/hub-promo.mp4` and the HUMC Brain's head still show
the 3D him; whether to remake them is a later question.
