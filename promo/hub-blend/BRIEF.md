# Brief: the 3D remake of the promo

Jose's ask (2026-10-20): something like `media/hub-promo.mp4` (v11), which
explains the app feature by feature, but with the 3D look of four reference
reels he sent. This file is the plan; a fresh chat can work from it alone.

## What stays from v11

v11 works because of one move, repeated: a two-line caption (white line,
then a cyan box wiping in behind the payoff), the real app screen flying in
and filling the frame, and a cyan outline ringing **the one item on screen
that proves the caption**. Keep the order, the copy word for word, the
palette (navy, cyan `#3fc6ee`, red strike `#f0436a`) and that rule.

What v11 gets wrong, and this remake fixes: every feature uses the same flat
move, the camera never moves, and the 8 s end card drags the length to 45 s.

**The change:** the cyan outline is replaced by a 3D move. The proof item
lifts off the screen toward the camera, lit, casting a shadow, and Dr.
Smiley interacts with it where the table says so. The camera is always
moving, low and close to the surface, with the background out of focus.

## The four references (what each one teaches)

- **Slate (phone):** real UI on a real phone, camera skimming the glass at a
  grazing angle, UI layers peeling off at different heights, the app icon
  rising into glowing rings. Its lyric section: thick 3D words under one
  spotlight, cut on every syllable.
- **motionloved (laptop):** the screen is the only light; its colour reaches
  the keys, the table and the reflection. That is what makes it look real.
- **andremass (studies):** one hero object per shot with a convincing
  material (clay, chrome); a field of hundreds of copies rippling.
- **After Effects mascot:** a flat UI turned into a landscape, a character
  crossing it with intent, low camera, warm light, real shadows. Ours is
  Dr. Smiley.

## Copy (from v11, unchanged)

Hook: "The doctor says:" / "Heart failure" / "TO FIND THE WORD" 0.33s /
"¿Fallo cardíaco?" struck, pill "Not for patients." / "Insuficiencia
cardíaca". Logo: "Interpreter Hub", "for the HUMC interpreter team".
End: "Interpreter Hub" / "Built here, for our patients." /
"interp-six.vercel.app" / "Live today, on any phone." / "Better words."
"Safer care." (cyan box).

## Shot table

About 32 s (36 s as built: 9 features at 2.5 s), 1080x1920, 30 fps, v11's music re-cut to length, cuts on the
beat. Features 2.5 s each (never under 2.3 s).

| # | Shot | Caption | Reference | What happens (proof item in bold) |
|---|---|---|---|---|
| 0 | Hook, ~6 s | v11 hook | Slate lyric section | Thick 3D words under one spotlight; the camera moves through them; timer, red strike, then the right word |
| 1 | Logo, ~1.5 s | Interpreter Hub | Slate icon | The **app icon** rises from a lit phone screen into glowing rings that light the glass |
| 2 | Home | Built by our / own interpreters. | Slate phone | Camera skims the Home screen; its layers lift off the glass, nearer ones more; **the quick tiles** come forward |
| 3 | Glossary | One glossary. / Every specialty. | andremass clones | A field of the 41 specialty pins (`pins/*.webp`) ripples like a wave, then folds into the Emergency list with **Avascular necrosis** |
| 4 | Translate | Glossary first. / AI second. | AE mascot | Dr. Smiley types "heart failure" in Search; the glossary card rises first and tall, the AI card **insuficiencia cardíaca** second and lower |
| 5 | Doctor Prep | Ready for / every physician. | andremass chrome | **Dr. Elena Marin's card** turns like a solid object; her 10 prep terms fan out |
| 6 | False Friends | 101 false friends. / Flagged. | AE mascot | Dr. Smiley steps on **constipado**; it flips over red: "≠ constipated, a cold" |
| 7 | Daily Drill | Daily drills. / Sharp skills. | Slate lyric section | **"Fue un ingreso de urgencia"** drops in word by word; the trap word cracks |
| 8 | CoreCHI | National certification. / Prep built in. | motionloved dashboard + AE | The bars grow, **145** counts up, Dr. Smiley climbs the bars like stairs |
| 9 | Team Chat | One team. / One channel. | Slate layers | Chat bubbles stack in depth; **"Lavado del port. Added it to the glossary."** comes forward |
| 10 | Ask | Stuck? / Ask Dr. Smiley. | AE mascot | Dr. Smiley steps out of the screen; **his oncology briefing card** rises behind him |
| 11 | End, ~4 s | v11 end copy | motionloved laptop | Laptop and phone on a glossy table, the screen the main light, its colour on the table and reflection; end lines on the laptop screen |

If it must be shorter, cut 5 (Doctor Prep) or 9 (Team Chat): the least
distinct on screen.

## Rules every shot is checked against

- Captions at least 64 px tall, v11's two-line style.
- The proof item readable with the frame shrunk to 360 px wide.
- Dr. Smiley never covers the proof item.
- No dark or empty phone screen in any frame.
- Screens are real app captures in layers (step 2), not crops of v11.

## Steps (one at a time; Jose reviews each before the next)

1. This brief, and the project committed here. **Done.**
2. Real screens in layers: Playwright on this checkout (Firebase and AI
   stood in for, as in `tests/support/`) at 390x844, 3x density, the exact
   states in the table; each region a transparent PNG plus a JSON of
   positions; one labelled sheet for Jose. The old `assets/screens/*.png`
   (cut from v11, soft) stay until these replace them, so the current
   reel still renders. **Done** (2026-10-20): `tools/capture-layers.cjs`
   writes `assets/layers/<state>/` (full, bg with the layers cut out, one
   WebP per layer, `layers.json`: box in CSS px, depth, which is the proof)
   and `assets/layers/sheet.jpg`. About 3 minutes; rerun after app changes.
   Known: the tab bar is glass, so it carries a little of what was behind
   it; on Home and CoreCHI it is the app's compact pill, as the app shows
   it there. The chat question bubble on Ask scrolls above the answer, so
   only the answer card is a layer.
3. Dr. Smiley puppet: a flat cutout in Three.js from `drsmiley/` (base,
   face strip, brows), card thickness, contact shadow, screen light on him,
   squash and stretch. Moves: hop, land, type, point, step out, wave. Six
   stills at 540x960. **Done** (2026-10-20): `src/smiley.js`
   (`createSmiley`, `MOVES`: each move a pose over phase 0-1; poses take
   any of the 30 face frames and DR_BROWS). He is a token on a glass disc
   with a cyan rim, since his art ends at the shoulders. Stills:
   `tools/smiley-stills.cjs` (page `tools/smiley-stills.html`) to
   `out/smiley/`, sheet `assets/smiley-stills.jpg`. His art has no arms, so
   type, point and wave are body language plus light (key rings, a cyan arc,
   a rock and wink); real hands need two arm drawings from Jose (the same
   ones PLAN F1 asks for).
4. Hook and logo. Draft at 540x960, contact sheet at 2 fps. **Done**
   (2026-10-20): `remake.html` + `src/remake/main.js` (render with
   `-c remake.html`; draft size in the four 540/960 numbers there). Thick
   words are real extruded type (Inter Tight 900 turned into a Three.js
   typeface, `fonts/inter-tight-900.typeface.json`), one spotlight that
   moves with the shot, a fly-through on every cut, bloom on the red and
   cyan words. Cuts on the music's beats (`beats/`, 120 BPM). The logo is
   the app icon's 16 tiles (`assets/icon-tiles.json`, found in
   `icon-512.png`) rising out of a phone and assembling inside three rings.
   9.5 s; a 540x960 draft renders in about 40 s. Quick looks without a
   render: `tools/stills.cjs remake.html out/x <times>`.
5. Shots 2-6. Draft, contact sheet. **Done** (2026-10-20):
   `src/remake/features.js` (each screen from step 2 on a phone body, its
   layers lifting off the glass with soft shadows; per shot a function of
   seconds-into-shot, plus a moving camera). Captions are DOM over the
   canvas, v11's style and progress dashes, font 4.4% of the height (84 px
   at 1920, line box 94 px). Depth of field (BokehPass) follows each
   shot's focus point. Screens are drawn just under white (`SCREEN`) so
   bloom leaves them crisp. 22 s draft renders in about 3 minutes;
   `assets/remake-draft-sheet.jpg`. Known: the screens fill the lower 60%
   while the caption sits top-left, leaving a dark band; the AI card on
   Translate still crops at the left as it lifts; Dr. Smiley is small
   next to the screens.
6. Shots 7-11. Draft, contact sheet. **Done** (2026-10-20): the last
   four features in `features.js` (the drill line as thick words, "ingreso"
   cracking as two pieces "ingr" + "eso"; five glowing bars, 145 counting
   up in fives, Dr. Smiley hopping up the bars; chat bubbles stacking in
   depth; Dr. Smiley rising out of the Ask screen through a ring of light,
   his briefing behind him) and `src/remake/end.js` (laptop and phone on a
   mirror table under a lacquer sheet, the laptop screen a canvas and a
   RectAreaLight of its own colour; a cyan flash on the first beat sweeps
   the table, then the end lines arrive). 36 s: 9 features x 2.5 s.
   Music: `assets/music-remake.m4a`, v11's track 0-32.6 s crossfaded into
   its 40.9-45 s ending (36.1 s). The 36 s draft renders in about 5 min.
   Jose's notes on this draft (2026-10-20): the hospital was missing, and
   the end card's Dr. Smiley had no brows. Fixed: behind the table is a
   window onto HUMC's skybridge at sunset (`assets/humc/skybridge-sunset.jpg`,
   the sign kept whole and readable, less blur in that shot, a little warm
   light through it); his picture on the screen is now composed whole
   (`composeSmiley` in `src/smiley.js`: base, face frame, both brows).
   He chose the window only (not an opener, word walls or an aerial shot).
   Jose's second round (2026-10-20): feature the CoreCHI campus and the 3D
   Body, pull the cameras back (things were cut off), all the hospital
   photos, every word capitalised. Done: a 2 s HUMC opener (entrance, tower,
   pavilion at dusk, aerial as glass panels the camera flies past, "Hackensack
   University Medical Center"; the skybridge stays in the end card window);
   a 3D Body shot after the glossary ("Explore The 3D Body. / English And
   Spanish.": the body on the phone, a tap on the chest, the dive to the
   isolated heart, its Heart / Corazon card lifting; captured by
   `capture-layers.cjs body|heart`, which serves `atlas/` to the frame); the
   CoreCHI shot is now the app's own campus render (`city/` sky, far, near)
   standing up out of the phone like a pop-up book, 145 counting beside it;
   every camera pulled back (`ZOOM` 1.28 in features.js, 1.12 on the word
   shots, the end card wider); Title Case on everything drawn (captions, hook,
   pill, drill words, the card back, the end lines). 40.5 s now (10 features);
   music re-cut to match (v11 0-37 s into its ending).
   Third round (2026-10-20): Jose found the opener too fast and wanted
   Dr. Smiley in it, in 3D, and the 3D Body coming apart like his
   screenshot. Seven opener ideas were previewed (`tools/opener-lab.html`,
   `tools/clip.cjs`); he picked "carousel": 5 s, Dr. Smiley centre stage,
   the five photos circling behind him one at a time. Dr. Smiley is now a
   rounded 3D figure everywhere (`createSmiley({ round: true })`, his outline
   inflated into a smooth body). The 3D Body shot (3.5 s) plays 14 frames of
   the real viewer coming apart (Explode 0-65%, `tools/capture-explode.cjs`)
   before the dive to the heart. After the After Effects reference he chose
   "Smiley links the shots": between features he hops phone to phone, the
   camera riding with him, with motion blur (7 moments in a 0.35-frame
   shutter, only on hops and fly-throughs). 44.5 s; music is v11's whole
   track. A full draft renders in about 13 min.
   Fourth round (2026-10-20), Dr. Smiley fixed (Jose: teal face, warped
   rounded body, sinking into screens, covering proof items, small, blurry
   hops). He is no longer in the 3D scene: `src/remake/overlay.js` draws his
   flat art (composeSmiley) on a canvas over the render, unlit and crisp,
   25% of the frame tall. The shots' choreography still poses his hidden 3D
   body; the overlay reads `lastPose` (face, brows, squash, lean, lift).
   The proof cards are as wide as the frame, so he stands in a bottom band,
   alternating corners, and each phone shot gets a lens shift
   (`setViewOffset`, measured at build) so its proof ends above his head and
   hop. Hops are 0.4 s, 5% of the frame high, his face sharp, with a light
   trail; the picture dips through navy and cuts at the darkest moment (a
   camera fly swept the proof cards through his path). `tools/check-smiley.cjs`
   checks every frame: in frame, not over the proof (nor the next one in a
   hop); 0 failures at 10 fps.
   Known for step 7: the end card's lines are small at phone size (the
   laptop screen is landscape inside a portrait frame); the phone in the end
   card is mostly off frame; the Team shot's lift is subtle.
7. Check against the rules above, side by side with v11 per feature; fix;
   full render; send with the side-by-side.

## Practical

- No GPU here: Three.js renders in software. The first hub-blend (31 s) took
  48 min on 2 cores, 15 min on this 4-core cloud box (3 workers, software GPU). Work on stills and 540x960 drafts; one full render at
  the end. Real motion blur multiplies render time; use it only where it
  shows.
- Render command and still tool: `NOTES.md`.
- The HMH logo appears (app icon, photos): needs HMH marketing sign-off
  before public posting (from `NOTES.md`).
