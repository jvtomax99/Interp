# CoreCHI Practice dashboard

`renderPractice()` in `index.html`. Top to bottom: readiness card (ring,
streak, today's goal, due), the dashboard row, the ways in, This week,
Badges, Your domains, Custom session.

**Dashboard row** (`.dash-row`, two columns from 600 px):
- `renderScoreTrend()`: your last 12 finished sessions from `quiz-history`
  (`myQuizHistory()`, matched by name), oldest left. Big number = last
  session, chip = difference from the average of the earlier ones, foot =
  sessions / all-time / best (what the old "My progress" card showed). SVG
  300x96, labels in their own right gutter (`TREND_GUT`). Tap a point
  (`trendPick`, 30 px hit circles) to read it; tap again for the latest.
- `renderFocusTile(examReadiness().worst)`: the domain whose gap costs the
  most exam weight, with Practise it -> `startStudy('domain', id)`.

The old "My progress" card is gone: its numbers are in the trend tile, its
per-domain accuracy is now "N% right in sessions" on each Your domains row
(`domainAccuracy()`).

**Motion** (`playPracticeMotion`, called from `renderContent`): blocks
arrive staggered (`.dash-in`, `--i`), numbers count up (`.js-count`,
`data-to`; the markup holds the final value), bars grow (`animateBars`,
Web Animations), the score line draws itself and its points pop as the
line reaches them, one ripple off the newest point. Each moving block has
`data-motion` + `data-sig`. The screen re-renders for unrelated reasons
(quiz history arriving, chat), so a block whose sig is unchanged resumes
its motion (`--motion-skip`, `MOTION_BORN`) instead of restarting, and is
`.is-still` once 1.5 s old. Reduced motion: everything final, no animation.

**The Pixar finish** (block "Practice: the Pixar finish" in `index.html`,
Jose 2026-10-19: "3D world, inspired by Disney and Pixar"; he picked light
and material over real 3D). Clay tiles (`--clay-*` tokens, own dark
values): warm key light top-left, sheen, a lip above and a shade below,
contact + far shadow; this screen deliberately steps past the app-wide
finish shadow. Readiness ring is a glossy donut (`.ready-ring::before`,
masked to the band; radii assume 104 px ring / 70 px hole, change them
together). Candy buttons (`.mastery-go`, in `LIFTS`) squash on press.
Score dots are glossy beads (`#trendBall`). Arrivals land with a squash
(`dashIn`). The lean: an IIFE after `animateCounts` sets `--rx/--ry/--mx/--my`
on the pressed tile (touch) or hovered tile (mouse), only on the practice
screen; release springs back via `--spring`. Nothing runs at rest; reduced
motion turns the lean and squashes off.

**Your HUMC campus** (`renderCampus`, `CAMPUS`, `CAMPUS_MAP`; Jose,
2026-10-19: "look like a game", then "like Hackensack University Medical
Center"; after a generic city, a satellite-traced campus and a box model he
said "still not it", he sent photos of the main entrance, day and night).
Replaced the readiness card. The scene is the main entrance at dusk, laid
out from his Google 3D screenshots: the drive off the street (crosswalk,
turn-arrow lanes, a pill median with the flower bed and evergreen, the
keyhole median with the fountain), the brown-brick building with the two
banners at its end, the white tower with the HMH mark behind, the brick
building with cream bands and glass lower floors on the left, the parking
deck and dark tower on the right, the Helena Theurer Pavilion back right
with its lettering. Each domain is one building (Ethics the banner
building, Terminology the white tower, US Systems the left building,
Encounter Helena Theurer, Culture the dark tower); its windows
light up in tenths of coverage (`campusLevel`). Art: `city/entrance.webp` (the whole picture, sky included: a gradient dome
with stars, cloud puffs, a far skyline and the town's ground, fog; rendered
through an EffectComposer with ambient occlusion, bloom, SMAA at 2x) plus
`city/<key>-lit<1..10>.webp` (only that building's lit windows with their
own bloom, on black turned to alpha; drawn with `mix-blend-mode:screen` so
the glow adds light), made by `docs/mockups/cchi-city/entrance.html` +
`buildentr.cjs` (~25 min headless on SwiftShader); paste the printed
manifest into `CAMPUS_MAP`. Phone loads the picture + 5 layers (~300 KB). On the scene: a small % badge
per roof (`.cp-tag`, nudged apart), tap areas (`.cp-bld`), headlights on the
drive and the fountain sparkle (only while on screen: `watchCampus`). Under
it a legend of names (`.cp-key`), streak/goal/due chips, Play and Exam sim.
The legend chips are gone: the live screen's Your domains rows
(`.mastery-row`, candy Practise buttons) sit right under the card, each
naming its building (`CAMPUS[].place`). The HUD keeps the live screen's glossy readiness donut (`.ready-ring`,
`animateReadyRing`; Jose, 2026-10-19: "a combination" of the two looks).
Dr. Smiley in the card is an `ask-face`, so the dock's Dr. Smiley steps aside.

**Picking a building** (Jose, 2026-10-19: "we are clicking on the building
without knowing which content is being clicked"; he picked names on the
badges plus tap to pick). Each badge reads `<short> <pct>%`; the label
placement estimates each chip's width from its name (`tagsAt[key][2]`) and
Dr. Smiley's pin stands left of that width. The first tap on a building
(`.cp-bld`) or badge calls `campusPick(key)`: `.has-sel` on `.cp-world`, the
badge `.is-sel` (grows, white), the others step back; `.cp-shade` dims the
scene with a radial hole over the building (`campusShadeAt`); its `lit10`
layer goes on top and breathes (`.cp-litsel`); `campusPickCard` fills
`.cp-pick`, which sits over the chips and Play row (`.cp-foot.has-sel` hides
them, same box, nothing moves): full area name, questions, share of the exam,
Practise and a corner ×. A second tap on the same one, or Practise, calls
`campusGo` (startStudy). The empty scene, × and Escape put it back.
`CAMPUS_PICK.key` survives the screen's re-renders and is dropped on a fresh
arrival. Suite: `campus-pick.cjs`.

**Alive** (Jose, 2026-10-19: "beautiful and alive"; he picked the living
scene). The render also captures, each on its own and hidden from the base:
clouds (screen-blended, drifting), three flag frames and four fountain-spray
frames (cycled with CSS steps), and four vehicles (a car in, a car out, an
ambulance with two light-bar frames, a helicopter with two rotor frames),
each rendered once at a reference point with its path as screen points +
scale per point (`CAMPUS_MAP.live`). `campusLife(root)` moves them with the
Web Animations API (`campusAnims`): cars loop the lanes, the ambulance pulls
in and holds flashing, the helicopter lands on the white tower's helipad
(added to the scene) and later lifts off; `watchCampus` pauses them off
screen. Lit windows flicker (`.cp-lit`, inside a `.cp-litw` that carries the
entrance fade). Dr. Smiley's pin (`.cp-dr`, an `ask-face`) stands beside the
badge of the building to light next; the HUD bubble is text only. Reduced
motion: vehicles hidden, first frame of flags and spray, no flicker.
People and traffic (Jose: "patients walking around and cars moving"):
`person(kind)` builds small rounded figures (patient, visitor, nurse, doctor,
kid, elder, a wheelchair with its pusher) at 1.75x toy scale with two walk
frames; `WALKS` holds their paths (street sidewalks both ways, the crosswalk,
parking lot to the entrance, entrance to the far lawn, a pacer at the doors);
`STREET` four vehicles on the front street both ways incl. a shuttle bus; a
third car on the drive. All are `.cp-mv` movers (`data-dur`, `data-delay`)
run by `campusLife`; walkers blink two frames (`.cp-walk`).
Re-render with `NOLIT=<old entrance.json> node buildentr.cjs out` to keep
the 50 lit layers (the live things take ~3 min, the lit set ~25).
