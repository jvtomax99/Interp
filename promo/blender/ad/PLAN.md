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

## Beats (storyboard 3, about 55 s, 120 BPM; Jose 2026-10-22: every
feature, brief, the three 3D ones longer; no organs; the doctor databases in)

| Seconds | Scene | What happens |
|---|---|---|
| 0-2.5 | Open | Dr. Smiley peels off a glass screen; "Interpreter Hub" |
| 2.5-8.5 | Finding a word | Real screens on glass phones, one per beat: Glossary, Translate, Ask the Hub, False Friends |
| 8.5-12 | 3D Body | The real body turns on a dark stage |
| 12-15.5 | Broken down | The drop at 12 s: systems slide apart, one per beat |
| 15.5-19 | Every piece | The Explode slider at 100%: each piece pulls apart within its system |
| 19-25 | Before an appointment | Doctor Directory, a doctor's page, Doctor Prep, Team Chat (sample doctors, labelled) |
| 25-26.5 | The double-tap | Home; a double-tap on Dr. Smiley's head (how the brain really opens) |
| 26.5-35.5 | HUMC Brain | Regions light one per beat, signals race along tracts |
| 35.5-40 | Keep learning | Term Review (its knowledge brain), Daily Drill, Memory trainer |
| 40-41.5 | Into the campus | The CoreCHI Practice screen; the camera dives into its campus card |
| 41.5-51 | CoreCHI City | The campus at golden hour, buildings build up per CoreCHI area |
| 51-55 | End | Interpreter Hub, built for HUMC medical interpreters; the BodyParts3D credit |

The organ shot (storyboard 1-2) is out of the film but its code stays
(`storyboard.py` p4). The doctor screens use made-up sample doctors
(`tools/screens.cjs`, `SAMPLE_DOCTORS`), never real names: the app's
tests use a real doctor's name with invented notes, which an ad must not.

The app screens are real: `tools/screens.cjs` photographs this checkout's
app through the test harness (stand-in data, no live Hub). Ask the Hub runs
the real `api/ask.js` with a fixed, correct reply; Translate is asked
"heart failure", the stand-in's answer; the harness's missing files
(memory lines, chat photos) are served from the repo. Left out because the stand-in data reads as fake: events ("CE event 0").

## Steps (the guide's, in order)

1. **Brief** (`BRIEF.md`): this plan in the six blocks. Only after the OK.
2. **Build**: `timeline.py` (every time and place for 1,650 frames), the
   cards and titles as HTML photographed by Playwright (like the first
   film's card), `scene.py` per scene, all keyed from the timeline.
3. **Stills**: 24 half-size stills as one grid, sent to Jose before any
   long render. Check: words readable on a phone, colours true (measure a
   pixel), no white blowouts, every beat lands, last frame a poster.
4. **Fixes**: exact changes, rounds until the grid is right.
5. **Render** in chunks of at most 2 hours (resumable), then the
   broken-frame scan. Estimate on this machine (4 cores, no graphics
   card): about 9 hours for 1,650 frames (3D scenes 15-35 s a frame, the
   phone bursts about 10 s).
6. **Sound**: synthesized, 120 BPM, the drop on the explode; loudness every
   half second and a -1 dB true-peak ceiling.
7. **MP4**, sent to Jose.

## Open questions for Jose

- Length: about 55 s, or a 40 s cut (about 3 hours less render).
- The campus model carries real logos (the HMH mark on the main tower, the
  hospital's name sign). The guide says leave real logos out of a promo.
- 16:9 only, or also a vertical 9:16 for phones (a separate composition,
  bigger type, never a crop).
