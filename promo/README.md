# promo: the Hub's videos, written in code

[Remotion](https://www.remotion.dev) 4 project. Not part of the app: the
deploy skips this folder (`.vercelignore`), and nothing in `index.html`
loads it. Finished videos go to `media/` by hand.

```
cd promo
npm install
npm run studio      # preview in the browser, scrub the timeline
npm run render      # writes out/hub-title.mp4
```

In a cloud session, point it at the preinstalled Chromium instead of
letting it download one:

```
REMOTION_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell npm run render
```

`src/Root.tsx` lists the videos (compositions); `src/HubTitle.tsx` is a
3-second starter title card in the app's colours, 1280 x 720 at 30 fps
like `media/hub-promo.mp4`.

Licence (`node_modules/remotion/LICENSE.md`): free for individuals,
non-profits and companies of up to three people; other for-profit
companies need a paid company licence.

## The promo remake (`HubPromo`, 1080 x 1920)

A vertical remake of Jose's 43 s draft (made in HyperFrames, 540 x 960):
same script and order, new pictures. Phase 1 (2026-10-22): storyboard
and rough cut. Phase 2 (2026-10-22): the three hero shots for real.

| Piece | Where |
|---|---|
| Every time and every claim's words | `src/hub-promo/timing.ts` (`BEATS`, 15 frames = one beat at 120 BPM) |
| Phone, headline, dashes, Dr. Smiley, ball of light | `src/hub-promo/kit.tsx` |
| Campus opener, wrong-word hook, logo | `src/hub-promo/intro.tsx` |
| The ten claims | `src/hub-promo/beats.tsx` |
| Close and music | `src/hub-promo/HubPromo.tsx` |
| Campus window positions | `src/hub-promo/campus.json` (copied from `CAMPUS_MAP` in `index.html`) |

To render it, these must exist first; none are committed (screens 20 MB,
renders ~300 MB):

```
node capture/capture.cjs        # real app screens -> public/screens/ (~1 min)
node capture/brain.cjs          # the knowledge brain, live, frame by frame (~3 min)
(cd ../docs/mockups/cchi-city && npm i --no-save three@0.160.0)
node capture/campus.cjs         # the 3D campus flight, 120 frames (~6 min)
apt-get install -y blender      # 4.0.2 from Ubuntu; blender.org is blocked here
blender -b --factory-startup -P blender/body.py -- --frames 0-149 \
  --out public/renders/body/seq --w 1080 --h 1920 --samples 36   # ~42 s a frame, ~1 h 45 min
npm run render:promo -- --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

`npm run assets` (run by the render scripts) copies the app's own art
(`drsmiley/`, `pins/`, `city/`, `hero.jpg`, `icon-512.png`) into
`public/`; Remotion doesn't follow symlinks. Music: any file in
`public/music/` plays (not committed). Phase 1 used the draft's own
track, extracted, until Jose sends the real file.

**Screens are made-up data only.** `capture/capture.cjs` runs the app
on the test stand-ins (`tests/support`), never the live database, and
adds three records inside the capture only: a "Heart failure /
Insuficiencia cardíaca" glossary term, Dr. Elena Marin (not a real
person, Jose 2026-10-21) and Dr. Smiley's answer about heart failure.

### The three hero shots

**3D Body** (`blender/body.py`, Cycles): the app's own BodyParts3D meshes
(`atlas/models`: float32 positions, int16 normals, uint32 indices per
part, offsets in `atlas.json`) in six groups: skin, muscle, vessels,
organs, skeleton and the heart (concept `FMA7088`, 83 parts). The
reproductive system and pubic hair are left out, and the skin is a cyan
see-through "hologram" whose faces turned to the camera go clear, so the
shot stays modest. The body turns, the five layers fan out sideways and
back like cards while the camera pulls back, then the heart flies to just
in front of the lens and the focus follows it. Remotion then lifts the
app's real Heart / Corazón card (`screens/heart.png`, the 3D Body opened
on the heart through the app's own restore message) under it, its ES
speaker pulsing. This Blender build has no denoiser: more samples, not
`use_denoising`.

**Campus** (`capture/campus.cjs`): not the app's flat 960 x 760 layers
but the 3D scene they were rendered from
(`docs/mockups/cchi-city/entrance.html`, its `?promo` mode), flown
through at 1080 x 1920 while each building's windows light up,
Terminology first. Same composer and colour grade as the app's pictures.

**Knowledge brain** (`capture/brain.cjs`): the real `brain/you.html`
inside the app, on a fake clock (requestAnimationFrame and
performance.now replaced in `/brain/` pages only) stepped 1/30 s a frame,
so the motion is smooth. Its text panels are hidden for the shot. Two
passes: calm, then reopened with the cardiac terms as a Term Review
session ("See it in your brain"), with "Heart failure" labelled at its
dot through the session list's own tap-a-name.

### Numbers on screen, checked

| Claim | Status |
|---|---|
| "101 False Friends" | True: 101 entries in `FALSE_FRIENDS` (`index.html`) |
| "41 Specialties" (draft) | Cut: 41 is the count of pin images; 24 of them are specialties, the rest tools |
| "0.31s" to find the word (draft) | Cut: nothing measures it |
| "131 Questions" (draft) | Cut: not found; the stand-in Practice screen says 145, the live count is unknown |
| Campus "86% ready" | A made-up learner's score, shown as a demo, not a claim |

### Still open

- Opener: the draft's entrance photo (ask Jose), cut into depth layers.
  It uses `hero.jpg` until then.
- Music: the draft's own track stands in (`public/music/`, not
  committed). Jose to send the real file and confirm it can be used.
- Phase 3: the final cut timed to the music, then a 16:9 version.
