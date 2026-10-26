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
