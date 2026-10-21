# Dr. Smiley reel (mockup, 2026-10-21)

Jose's ask: make a short video like an Instagram reel he saw (a mascot
hopping across a 3D After Effects screen, made entirely as code: the
scene in Blender, the music in Python, stitched by ffmpeg), with Dr.
Smiley. Picked: a clip that shows off the Hub, Dr. Smiley as a flat
cutout of his own art (not a 3D model rebuilt from shapes, which would not
look like Jose's drawing).

Blender needs a graphics card for a fast render; this container has none.
So the same idea runs on what the campus used (`../cchi-city/`): three.js
in headless Chromium, frame by frame.

- `timeline.json`: every moment, in seconds (the drop, the hops, the
  camera, his 30 faces, the title). The scene and the sound both read it;
  change a number here and re-render.
- `scene.html`: the scene. Home laid flat as a slab (its name and Search
  drawn on it), its four quick tiles (Translate, Doctor Prep, Team Chat,
  Add Term, with their colours and pins), Dr. Smiley as a cutout painted
  every frame from `drsmiley/` exactly as `drSmileyArt()` lays him out (base,
  the face strip, the brows with `DR_BROWS`), depth of field, shadows. It
  never reads the clock: `draw(n)` always gives the same frame n.
- `sound.py`: the sound, from numpy alone. A lo-fi beat at the timeline's
  120 BPM; a whoosh and thump for the drop, a boing for each take-off, a
  knock and a bell on each tile (each tile its own note), a rising
  arpeggio for the title, a sparkle for the wink.
- `render.cjs`: serves the repo, draws all 360 frames, runs `sound.py`,
  joins it all with ffmpeg.
- `reel.mp4`: the result, 12 s, 1080 x 1920, 30 fps.

```
npm install three@0.160.0 playwright@1.56.1   # here; not committed
node render.cjs              # reel.mp4, about 7 min
node render.cjs preview      # preview.mp4 at half size, about 2 min
node render.cjs still 2.5 8  # still_2.5.jpg, still_8.jpg
```

Not in the app. If Jose wants it there, it goes in `media/` and the User
Guide like `hub-promo.mp4` (see `docs/features/user-guide.md`).
