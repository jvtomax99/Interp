# promo/blender: 3D films made from code

The method from the guide "Claude + Blender: Make 3D Motion Graphics From
Code" (AI Automation Society; prompt shape by rari, @0xwhrrari), built here
for a 12 s film of Dr. Smiley building a glossary card (`BRIEF.md`). Not
part of the app: `promo/` is never deployed (`.vercelignore`).

**How it works.** A video is 30 pictures a second. The code answers one
question, "what does frame N look like?", and Blender takes each picture.
Every time and every place lives in one file, `timeline.py`; the screen,
the card, the 3D and the sound all read it, so a landing, its key glow, its
card change and its click happen on the same frame. A fix is a number
changed there and only the frames it touches rendered again.

**A new film:** copy `BRIEF-TEMPLATE.md`, fill in BRAND, give it to Claude
with "build this the way promo/blender/README.md does".

## The pieces

| File | Makes |
|---|---|
| `timeline.py` | Every time and position. `python timeline.py` writes `build/timeline.json` for the JavaScript side |
| `smiley.py` | Dr. Smiley's picture per frame from `drsmiley/` (face frames, brows, a white sticker rim) |
| `src/ui.html`, `src/card.html`, `render_ui.cjs` | The fake app (one 2560 x 1440 image) and the card (one image per frame), photographed by Playwright. Checks the page's panels and keys still match the timeline |
| `scene.py` | The 3D world, every object keyed on all 360 frames: `build/scene.blend` |
| `device.py`, `render.py` | Graphics card if there is one, else the processor; renders any frames, skips finished ones |
| `contact.py` | Grids of frames, to check many at once |
| `check.py` | After a render: blank or glitched frames, and the command to redo just those |
| `sound.py` | The soundtrack, all synthesized; prints loudness every half second and the true peak |
| `encode.py` | Pictures and sound into `build/film.mp4` |

Everything they make goes in `build/` and `renders/`, which git ignores.

## Commands, in order

Once per machine (Python 3.13, Node 22, ffmpeg with the vignette filter):

```
cd promo/blender
uv venv -p 3.13 .venv && VIRTUAL_ENV=.venv uv pip install bpy==5.2.3 numpy scipy pedalboard pyloudnorm pillow
npm install
```

`bpy` is Blender itself as a Python module, so no Blender window, and no
`blender -b`: `python render.py` is the same thing. (In a cloud session the
Blender download site is blocked; PyPI is not.)

Then, with `.venv/bin/python` as `python`:

```
python timeline.py && python smiley.py && node render_ui.cjs   # the 2D parts
python contact.py card                                          # check 1: the card, 21 moments
python scene.py                                                 # the 3D world
python render.py -- --frames 1,30,50,58,66,76,106,121,136,166,196,226,245,258,272,287,315,360 \
                 --out renders/stills --pct 50 --samples 16 --redo
python contact.py renders/stills                                # check 2: 18 stills as a grid
python render.py -- --frames 1-360 --out renders/full           # the film (resumable)
python check.py renders/full                                    # broken frames? redo only those
python sound.py && python encode.py                             # sound, then build/film.mp4
```

## Times measured here (4-core cloud machine, no graphics card)

Stills at half size, 16 samples: 2-4 s each, the grid in under a minute.
Full size, 24 samples: 9-21 s a frame, about 90 minutes for the film. 64
samples looked the same after the denoiser and took 2.3 times longer. On
an NVIDIA card expect a few seconds a frame.

## What the rounds caught (first film, 2026-10-22)

| Round | Seen | Fix |
|---|---|---|
| Face check | Faces scrambled | `face.webp` stores frames at 302 px, twice their 151-unit size; cut by the file's width |
| Card sheet | Pin's light ring a hairline; chips tiny | Ring 34 px; chip and label type up |
| First still | All panels piled at the centre | `view_layer.update()` before reading positions (the guide's "objects land in the wrong place") |
| First stills | Wide shot small; floor glow had a hard edge; keys cut off | Camera in; glow fades to see-through; camera up |
| Second stills | Card unreadable at phone size; weak last frame; first hop leaves the picture | Camera to 1.95 m in the hops, end shot closer; first hop a small drop |
| Third stills | Keys and card couldn't share one close shot | Screens 15 cm lower; 32 mm lens in the hops (the per-shot lens wasn't wired in) |
| Pixel check | His skin 5% dark (199/141/116 vs 210/147/120) | His glow 0.82 to 0.9 |
| Sound | Intro as loud as the drop; ending loud | Intro parts and pre-drop clicks down; gentler compressor; level set on the drop |
