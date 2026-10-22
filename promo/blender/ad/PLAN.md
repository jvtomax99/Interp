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

## Beats (storyboard 4, vertical 9:16, about 56 s, 120 BPM)

Jose 2026-10-22: take inspiration from the original promo
(`media/hub-promo.mp4`, 720 x 1280, 45 s) and his remake draft (540 x 960,
43 s). Taken from them: vertical; the "heart failure" opening (the doctor's
word, the wrong word struck out, the right word); his own two-line
captions and ending; Dr. Smiley reacting in a corner; a glossy floor. Not
taken: the draft's long static desk shot, its dark laptop screen, and the
"0.33 s" / "0.13 s" to-find-the-word number (unmeasured; it goes in only if
measured in the app). Storyboards 1-3 and their code are kept.

| Seconds | Scene | What happens |
|---|---|---|
| 0-5 | The opening (storyboard 5) | Jose's photo of Helena Theurer Pavilion in depth layers (sky cut away and filled in behind): "Heart failure" in the sky behind the tower; "¿Fallo cardíaco?" struck, in front of the building; the camera arrives at a phone with the real Translate answer and its real caution ("Avoid 'fallo cardíaco' with patients"). `openings.py` p1, p1b, p2 |
| 5-6.5 | Interpreter Hub | Dr. Smiley peels off the glass; "Built by our own interpreters." |
| 6.5-12.5 | Finding a word | One glass phone per beat: Glossary, Translate, Ask the Hub, False Friends, with the promo's captions |
| 12.5-15 | 3D Body | The real body, tall, on the mirror floor; "Explore the 3D Body. English and Spanish." |
| 15-18.5 | Broken down | The drop at 15 s: systems step out into a line going back |
| 18.5-22 | Every piece | The Explode slider at 100% |
| 22-28 | Before an appointment | "Ready for every physician." Doctor Directory, a doctor's page, Doctor Prep; Team Chat "One team. One channel." (sample doctors, labelled) |
| 28-29.5 | The double-tap | Home; a double-tap on Dr. Smiley's head |
| 29.5-38 | HUMC Brain | "The HUMC Brain. The app, mapped." Regions light per beat |
| 38-42.5 | Keep learning | "Daily drills. Sharp skills." Daily Drill, Term Review, Memory trainer |
| 42.5-44 | Into the campus | The CoreCHI Practice screen; the dive into its campus card |
| 44-52 | CoreCHI City | "National certification. Prep built in." Buildings build up per beat |
| 52-56 | End | Interpreter Hub. "Built here, for our patients." interp-six.vercel.app, live today, on any phone. "Better words. Safer care." BodyParts3D credit |

Frames: `storyboard3.py` (v01-v15), captions `src/captions.html` via
`tools/captions.cjs`.

The organ shot (storyboard 1-2) is out of the film but its code stays
(`storyboard.py` p4). The doctor screens use made-up sample doctors
(`tools/screens.cjs`, `SAMPLE_DOCTORS`), never real names: the app's
tests use a real doctor's name with invented notes, which an ad must not.

The app screens are real: `tools/screens.cjs` photographs this checkout's
app through the test harness (stand-in data, no live Hub). Ask the Hub runs
the real `api/ask.js` with a fixed, correct reply; Translate is asked
"heart failure", the stand-in's answer; the harness's missing files
(memory lines, chat photos) are served from the repo. Left out because the stand-in data reads as fake: events ("CE event 0").

On-screen words: every word starts with a capital (Jose, 2026-10-22),
Spanish lines included ("¿Fallo Cardíaco?", "Insuficiencia Cardíaca"). Not
changed: the web address (interp-six.vercel.app), the app's own screens,
labels already in capitals.

## Steps (the guide's, in order)

1. **Brief** (`BRIEF.md`): this plan in the six blocks. Only after the OK.
2. **Build**: `timeline.py` (every time and place for 1,680 frames), the
   cards and titles as HTML photographed by Playwright (like the first
   film's card), `scene.py` per scene, all keyed from the timeline.
3. **Stills**: 24 half-size stills as one grid, sent to Jose before any
   long render. Check: words readable on a phone, colours true (measure a
   pixel), no white blowouts, every beat lands, last frame a poster.
4. **Fixes**: exact changes, rounds until the grid is right.
5. **Render** in chunks of at most 2 hours (resumable), then the
   broken-frame scan. Estimate on this machine (4 cores, no graphics
   card): about 9 hours for 1,680 frames (3D scenes 15-35 s a frame, the
   phone bursts about 10 s).
6. **Sound**: synthesized, 120 BPM, the drop on the explode; loudness every
   half second and a -1 dB true-peak ceiling.
7. **MP4**, sent to Jose.

## Open questions for Jose

- The opening photo (Helena Theurer Pavilion, uploaded by Jose 2026-10-22)
  looks like a professional architecture photo: may it be used, and may it
  be committed? Until then it lives only in `build/photo/` (not in git).
  It shows the hospital's name across the tower.

- Length: about 56 s, or a 45 s cut like the original (about 2 hours less render).
- The campus model carries real logos (the HMH mark on the main tower, the
  hospital's name sign). The guide says leave real logos out of a promo.
- Vertical 9:16 (like both of Jose's videos and the app's promo), or a wide
  16:9 too (a separate composition, never a crop).
