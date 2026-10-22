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
same script and order, new pictures. Phase 1 (2026-10-22) is a rough
cut; the three hero shots are placeholders, marked "ROUGH CUT" on screen.

| Piece | Where |
|---|---|
| Every time and every claim's words | `src/hub-promo/timing.ts` (`BEATS`, 15 frames = one beat at 120 BPM) |
| Phone, headline, dashes, Dr. Smiley, ball of light | `src/hub-promo/kit.tsx` |
| Campus opener, wrong-word hook, logo | `src/hub-promo/intro.tsx` |
| The ten claims | `src/hub-promo/beats.tsx` |
| Close and music | `src/hub-promo/HubPromo.tsx` |
| Campus window positions | `src/hub-promo/campus.json` (copied from `CAMPUS_MAP` in `index.html`) |

To render it, three things must exist first; none are committed:

```
node capture/capture.cjs        # real app screens -> public/screens/ (~1 min)
apt-get install -y blender      # 4.0.2 from Ubuntu; blender.org is blocked here
for t in 0 0.5 1; do blender -b --factory-startup -P blender/body.py -- \
  --t $t --out public/renders/body/still_t$t.png --w 540 --h 960 --samples 48; done
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

**The 3D Body** (`blender/body.py`) builds the app's own BodyParts3D
meshes (`atlas/models`: float32 positions, int16 normals, uint32
indices per part, offsets in `atlas.json`) into six groups: skin,
muscle, vessels, organs, skeleton and the heart (concept `FMA7088`,
83 parts). `--t` spreads them apart in depth for a still; `--frames`
renders the animation. This Blender build has no denoiser, so use
more samples rather than `use_denoising`.

### Numbers on screen, checked

| Claim | Status |
|---|---|
| "101 False Friends" | True: 101 entries in `FALSE_FRIENDS` (`index.html`) |
| "41 Specialties" (draft) | Cut: 41 is the count of pin images; 24 of them are specialties, the rest tools |
| "0.31s" to find the word (draft) | Cut: nothing measures it |
| "131 Questions" (draft) | Cut: not found; the stand-in Practice screen says 145, the live count is unknown |
| Campus "86% ready" | A made-up learner's score, shown as a demo, not a claim |

### Left for phase 2

- 3D Body: the real animation, the heart coming forward, the app's
  Heart / Corazón card, the skin grain (more samples) and framing that
  keeps the skin layer modest (it's a complete male model).
- Campus: the `city/` layers are 960 x 760, soft at full frame;
  re-render them bigger from `docs/mockups/cchi-city/entrance.html`.
- Knowledge brain: live with `@remotion/three` instead of its screenshot.
- Opener: the draft's entrance photo (ask Jose) cut into depth layers.
- Dr. Smiley's answer says "Not from the Hub": `api/ask.js` only marks
  an answer as the Hub's when the app sent that entry; capture it from
  a search that does.
- The close's credits overlap the phone.
