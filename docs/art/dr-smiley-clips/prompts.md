# Dr. Smiley: video clips from his picture (the test, 2026-10-26)

Jose: "I want it fluid and natural." The cutout rig swaps drawings; it cannot
be fluid, however many drawings it gets. The test: one short clip of him
made by an image-to-video tool from `../dr-smiley-body/body-master.png`,
to be cut into see-through frames and played in the app for his big moves
(wave, cheer, think, wince, thumbs-up), the rig keeping the small life
(breathing, blinks, glances, the nod). If the clip is him and fluid, the
other moves are made the same way; if not, the fallback is the flipbook of
drawings (`../dr-smiley-body/prompts-animation.md`) or the 3D model
(`../dr-smiley-3d/notes.md`).

## How to run the test

1. Sora (inside ChatGPT), or Kling, Runway or Veo. Upload `body-master.png`
   as the starting image. Portrait, 4 to 5 seconds, the highest quality.
2. Paste the prompt below as the text. Run it two or three times if the
   first is off; send every result, even the bad ones, with which tool made
   it. Nothing is judged here from one try.
3. Send the clip itself (mp4), not a screen recording of it.

## The prompt: wave hello

```
Animate this exact picture. The first frame is this picture, unchanged. The camera is locked: no zoom, no pan, no drift, no cut. The background stays one flat, even light grey the whole time, no shadows on it, nothing else appears. His body stays in the same place and the same size.

He stands still for half a second, then lifts his right hand (on the viewer's left) with a relaxed bend of the elbow, waves it side to side twice in a friendly way while his smile widens and his head tilts slightly toward the hand, then lowers the arm back to his side and returns to exactly the starting pose, standing still for the last half second. The motion is smooth and natural with real weight: the shoulder lifts a little with the arm, the coat moves with the shoulder, and he settles gently. His face, hair, coat, scrubs and shoes stay exactly as drawn. 3D cartoon style, same lighting throughout. No text, no captions.
```

## What is checked when a clip comes back

- Likeness on the first and last frame against the master (the first should
  be pixel-close; the last is where tools drift).
- Whether he ends at rest, and how long the settle takes (the app
  cross-fades the last frames into the rig's still).
- The background: one flat grey, keyed the way the drawings are
  (`layers/cutframes.py`'s `matte`), frame by frame.
- Size: a 4 s clip at 24 fps is about 100 frames; at 320 x 440 webp about
  1 to 1.5 MB a move. Alternatives if that is too heavy: 12 fps on twos,
  or a see-through video (VP9 alpha for Chrome, HEVC alpha for Safari).

## The wave test came back (2026-10-26, Jose's first clip, Sora)

1228 x 1686, 30 fps, 5 s (150 frames), 7.9 MB. Measured against the master
(`layers/keyclip.py`, `wave-test-strip.png`):

- **It's him and it's fluid.** Face, hair, coat, scrubs, shoes all his; the
  arm bends at the elbow, the shoulder and coat move with it, the head
  tilts, the smile widens. Nothing swaps.
- **Likeness drift, small:** the first frame already differs from the master
  (mean difference 10.8 of 255; a copy would be 0 to 3): he is drawn a
  touch rounder, the mouth open in a wider smile from frame 1, the eyes a
  little bigger. The last frame is the same drawing (12.1), so start and
  end match each other, which is what the hand-off needs.
- **His hands end in front of his coat, not at his sides.** He starts (frame
  1) and ends with both hands curled at his stomach, not the master's
  arms-down pose. The rig's rest pose has them down, so a cut straight from
  one to the other would show. Either the prompt insists on the arms-down
  start ("both arms hanging straight at his sides, hands open beside his
  thighs"), or a short in-between is drawn.
- **The camera held.** His feet stay on the same line all 150 frames (y 1425
  to 1427), his width and head top within 25 px; no zoom, no drift.
- **The wall keys.** One flat grey (205, 205, 208; the master's is 211,
  211, 214), spread 1.5. The clip paints a floor shadow and a shadow on the
  wall behind his calves; `keyclip.py` drops everything below the coat's hem
  that is not blue. It also paints a light rim along the top of his hair; the
  key tightens the hair's outline by 2 px, and what is left is in his own
  pixels (one px at phone size).
- **Size:** 151 see-through frames at 320 x 440 are 3.6 MB at 30 fps, 1.8 MB
  on twos. One move at 1.8 MB is heavier than all his drawn poses together
  (about 1.3 MB); five moves would be 9 MB, precached. A see-through video
  (VP9 alpha, HEVC alpha for Safari) would be about 150 KB a move; the trade
  is two files per move and no frame-exact control.

Verdict: the route works; the pose at the ends is the thing to fix in the
prompt before making the other moves.

## The second wave (2026-10-27): in

Run with the ends fixed in the prompt (arms hanging at his sides, a closed
smile at the start and the end): first and last frames 4.9 and 5.0 from
the master (the first clip was 10.8 and 12.1), arms down at both ends, the
feet on one line throughout. Keyed to `drsmiley/clips/wave/` (150 frames,
3.8 MB) and wired in as `greet` (`features/smiley-clips.js`).

## The prompts for the other big moves

Same tool, same settings (portrait, 5 s, highest quality), `body-master.png`
as the start image. Each starts and ends in the master's pose; the opening
is the same for all four, then the move. Send every result with its tool.

Opening (paste first, then the move's paragraph):

```
Animate this exact picture. The first frame is this picture, unchanged: both arms hanging straight down at his sides, hands open and relaxed beside his thighs, a closed gentle smile. The camera is locked: no zoom, no pan, no drift, no cut. The background stays one flat, even light grey the whole time, no shadows on the floor or wall, nothing else appears. His body stays in the same place and the same size. His face, hair, coat, scrubs and shoes stay exactly as drawn. 3D cartoon style, same lighting throughout. No text, no captions. At the end he returns to exactly the starting pose, arms hanging at his sides, the closed gentle smile, and stands still for the last half second.
```

| Move | File | The move (after the opening) |
|---|---|---|
| Cheer (a streak, a rank) | `cheer.mp4` | He stands still for half a second, then crouches slightly, pulling both fists back by his hips, and springs up into a small jump with both fists punched up above his head in a V, his mouth opening in a big happy laugh and his eyes bright. He lands softly with a little bounce, fists still up, pumps them once more, then lowers both arms back to his sides as his laugh settles into the smile. Real weight: the coat lifts with the jump and settles after the landing. |
| Think (while Ask the Hub works) | `think.mp4` | He stands still for half a second, then raises his right hand (on the viewer's left) to his chin, the index finger resting on it, the other arm folding across his stomach under the elbow, his eyes looking up and away to one side, his head tilting a little. He holds the thought, taps his chin twice with the finger, then his eyes come back to the camera with a small "aha" lift of the brows and a smile, and both arms return to his sides. |
| Wince (a wrong answer) | `wince.mp4` | He stands still for half a second, then flinches: both shoulders rise, both arms pull in with the hands curling together in front of his stomach, his head ducks a little to one side and his face squeezes into a sympathetic wince with the eyes shut and the mouth pulled to the side. He holds it for a moment, then relaxes: the shoulders drop, the face softens into a warm, caring smile, and both arms return to his sides. |
| Thumbs-up (a right answer) | `thumbs.mp4` | He stands still for half a second, then does a small happy hop, both feet leaving the floor together and landing softly, as his right hand (on the viewer's left) comes up to chest height in a fist with the thumb up, pushed toward the camera, his smile widening with a proud little nod. He holds the thumbs-up for a moment with a second tiny bounce, then the arm lowers back to his side. |

## The four came back (2026-10-27, Sora): all in

Cheer and think 7 s (210 frames), wince and thumbs-up 6 s (180), every one
starting and ending within 5 of the master, arms at his sides. Keyed at
full size with the corrected cutter and checked frame by frame
(`layers/checkclip.py`): think, wince and thumbs-up clean; the cheer's
frames 97 to 101 flag a "hole" that is the real gap between his raised
fists and his head. Think, wince and thumbs-up are in the app (`think`, `wince`, `bounce`
in `features/smiley-clips.js`). **The cheer is not:** with both arms up
against the wall, the raised sleeves' shadowed sides are the wall's exact
grey (3 to 4 of 255 apart, the wall's own spread is 1.4), and no cutter
can tell them apart by colour: the sleeves came out torn. The fix is the
film trade's: a wall of a colour he has none of. The cheer is re-run on
a plain bright green wall (below); if that keys clean, every other move
is re-run the same way when it is next touched, so the five match.

## The cheer, on a green wall

Same tool and settings, `body-master.png` as the start image:

```
Animate this exact picture of the character, but place him in front of a plain, flat, bright green screen background (chroma key green, #00FF00) instead of the grey one: the whole background is one even bright green, with no shadows, no gradient and nothing else in it, and the green never touches or tints him. The first frame shows him exactly as in this picture: both arms hanging straight down at his sides, hands open and relaxed beside his thighs, a closed gentle smile. The camera is locked: no zoom, no pan, no drift, no cut. His body stays in the same place and the same size. His face, hair, coat, scrubs and shoes stay exactly as drawn. 3D cartoon style, same lighting throughout. No text, no captions.

He stands still for half a second, then crouches slightly, pulling both fists back by his hips, and springs up into a small jump with both fists punched up above his head in a V, his mouth opening in a big happy laugh and his eyes bright. He lands softly with a little bounce, fists still up, pumps them once more, then lowers both arms back to his sides as his laugh settles into the smile. At the end he returns to exactly the starting pose, arms hanging at his sides, the closed gentle smile, and stands still for the last half second.
```

`keyclip.py` takes the wall's colour from the frame's corner, so a green
wall keys with no change; its "wall-coloured pool" rules then simply
never fire on him.

## The cheer on green came back (2026-10-27): in

Made from the green still (not the grey master), so his arms at the ends
hang a few pixels closer to his body than the rig's rest; measured against
the rig itself (the grey master's floor shadow had made the difference
look bigger), the fade covers it. The green wall keys clean with the
chroma key: the raised sleeves are whole. One flaw: his fists touch the
top of the picture for 14 frames at the top of the jump and are cut flat
there. If Jose runs it once more, the prompt above with "a small, low hop,
his fists never higher than the top of his head" in place of the jump
sentence, from the grey master; until then this one is in.
