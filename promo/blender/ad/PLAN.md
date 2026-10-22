# Interpreter Hub ad: the plan (waiting for Jose's OK)

A 30-second promo for the Hub's three 3D features, made the way the guide
"Claude + Blender: Make 3D Motion Graphics From Code" says, with the same
pipeline as the first film (`../README.md`). Storyboard with rough preview
frames: `build/board/storyboard.png` (made by `storyboard.py`; not
committed, rebuilt from code).

## What's real

Only real assets, per the guide. Each is read from the app itself:

| Feature | The real thing | How it gets into Blender |
|---|---|---|
| 3D Body | BodyParts3D 4.0 meshes in `atlas/models/` (2,234 pieces, 15 systems), the app's bilingual cards in `atlas/hub-catalogue.json` | `assets.body()` reads the binary chunks directly; `assets.catalogue()` the cards |
| HUMC Brain | `brain/index.html`'s own layout: 119 nuclei, 1,115 tracts, 24,812 surface points, group names and colours | `tools/brain_dump.cjs` reads them out of the page → `build/brain_scene.json`; `assets.brain()` |
| CoreCHI City | The three.js campus the app's pictures were rendered from (`docs/mockups/cchi-city/entrance.html`) | `tools/campus_export.cjs` exports it as glTF → `build/campus.glb`; `assets.campus()` |
| Dr. Smiley | `drsmiley/` via the first film's `smiley.py` | the same sticker cutout |

Found while planning, and planned around: the anatomy data's lung is only
its airway tree and its liver mostly bile ducts (the app shows the same),
so the organ shot uses heart, stomach, pancreas, kidneys. The campus's
sky dome doesn't carry over to glTF (hidden; Blender's sky instead). The
explode follows the app's Explode slider: systems slide apart side by side.

## Beats (30 s, 120 BPM, one beat = 15 frames)

| Seconds | Scene | What happens |
|---|---|---|
| 0-3 | Open | Dr. Smiley peels off a glass screen; "Interpreter Hub", "See medicine in 3D" |
| 3-7 | 3D Body | The real body turns on a dark stage, rim-lit blue and violet |
| 7-10 | Broken down | The drop: systems slide apart, one per beat (skeleton, muscles, heart and vessels, brain and nerves, organs) |
| 10-13 | Organs | Heart, stomach, pancreas, kidneys lift out whole, each with its app card (EN / ES) |
| 13-15 | Into the brain | Up to the real brain (Brain · Encéfalo); it turns to glass, the HUMC Brain lights inside it |
| 15-21 | HUMC Brain | Regions light one per beat, signals race along tracts, region names |
| 21-27 | CoreCHI City | A nucleus flares to white; the campus at golden hour; buildings build up floor by floor on the beat, one per CoreCHI area; Dr. Smiley on the main hospital |
| 27-30 | End | Up into the sky; Dr. Smiley laughs; name, the three features, the BodyParts3D credit (CC BY 4.0 requires it) |

## Steps (the guide's, in order)

1. **Brief** (`BRIEF.md`): this plan in the six blocks. Only after the OK.
2. **Build**: `timeline.py` (every time and place for 900 frames), the
   cards and titles as HTML photographed by Playwright (like the first
   film's card), `scene.py` per scene, all keyed from the timeline.
3. **Stills**: 24 half-size stills as one grid, sent to Jose before any
   long render. Check: words readable on a phone, colours true (measure a
   pixel), no white blowouts, every beat lands, last frame a poster.
4. **Fixes**: exact changes, rounds until the grid is right.
5. **Render** in chunks of at most 2 hours (resumable), then the
   broken-frame scan. Estimate on this machine (4 cores, no graphics
   card): 15-35 s a frame, about 4-6 hours for 900 frames.
6. **Sound**: synthesized, 120 BPM, the drop on the explode; loudness every
   half second and a -1 dB true-peak ceiling.
7. **MP4**, sent to Jose.

## Open questions for Jose

- Length: 30 s as planned, or a 20 s cut (about 2 hours less render).
- The campus model carries real logos (the HMH mark on the main tower, the
  hospital's name sign). The guide says leave real logos out of a promo.
- 16:9 only, or also a vertical 9:16 for phones (a separate composition,
  bigger type, never a crop).
