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

**The floating diorama (2026-10-26; the board, camera and paint replace the scene below; the colours
and golden-hour light below still hold).**
Jose sent a video of soft pastel low-poly dioramas on rounded bases ("can we
make the cchi sim city in this style") and picked, from a test render: this
style but busier, progress as paint, the corner view. Source:
`docs/mockups/cchi-city/diorama.html` (built from `entrance.html`, which
stays as the dusk version's history) + `builddiorama.cjs` (`node
builddiorama.cjs <out>`, ~7 min on SwiftShader; then paste
`<out>/entrance.json` over the `CAMPUS_MAP` line). Same campus and movers;
first in daylight pastels, then back in its own colours (below); a layered board (grass and three soils), the
camera at the front-left corner (`cam`, fov 18.77, 960x840 with 80 px of
open sky on top for the badges; the board's side corners run off the
frame). Busier: people standing about baked into the board (`stand`, `sit`,
pulled out of `LIVE`), a café with umbrellas on the right lawn, a garden
with a pond at the back left, cherry trees, a hedge along the back.
Then (same day, Jose: "looks flat... more alive and with vibrant colors"
like the video): candy colours per building (each glass tower its own hue,
roofs tinted with their building: from above the roofs are most of what
shows), a warmer, stronger sun with less flat fill, and `grade()` now adds
saturation (x1.28) and a little contrast instead of a haze lift.
Then (Jose, same day: "I like the original colors more"; his pick: the
old campus's colours on the new board): the live campus's materials,
golden-hour light (`SUN_DIR`, the lavender fill, the pink rim) and grade
(`grade()` calls `gradeDusk`, the F3 grade) are back, the backdrop is the
card's dusk (violet above, peach below) and the card, HUD and chips are
the evening ones again. Terminology is the white tower and Culture the
dark tower again: the faded state pales the dark windows, so even the
white tower shows its progress.
Then (Jose: "how can we make it more alive"; he picked all four): the
lights are back (lamp glows and pools, headlights, bloom, the context
towers' lit windows); `city/<key>-glow<1..10>.webp`, about half of a
building's windows lit where the paint has reached (the same ones at every
tenth), screen-blended and flickering (`.cp-glow`); (cranes on unfinished roofs
were here too, removed the same day: Jose wants no sign of construction on
the campus; `crane(key)` still renders `cranes.webp`, which nothing shows); the
people standing and sitting about are no longer in the board but sprites
(`IDLE`), two frames each (a turn and a step, or a head turn) flipped by
CSS (`.cp-idle`, `cpTurn` on a 5-9 s clock); the people come
from one picture (`idlers.webp`, packed by `atlasOf`; the
manifest gives each item its box and frame cells, drawn by background
position). Paint rising: `ih_campusLv` keeps the levels this phone last
drew; a building now higher climbs from the old tenth, one `.cp-rise`
layer per tenth 0.32 s apart after 1 s, then `.cp-spark` flashes at its
badge point and its lit windows come on; the first visit and every later
drawing just draw. Reduced motion: no swing, flip, climb, flash or
flicker. Suite: `campus-alive.cjs`.
Then (Jose sent Google Maps screenshots; his pick: fix the campus from
them, no Google data in the app): Terminology's tower is red-brown brick
("the brick tower"), and the right side of the drive is one big dark
building stepping back in three tiers (Culture, "the dark building on the
right"; `tower(..., base)` stacks the tiers, `BOX.c.crane` puts its crane
on the top tier), where a parking deck and a dark tower had been guessed.
Google's 3D map can't be used directly (their terms; and this container
can't reach it).
Then (2026-10-26, third chat) the five buildings' sizes, heights and places
come from OpenStreetMap (ODbL, "© OpenStreetMap contributors", credited in
the User Guide answer): `api.openstreetmap.org/api/0.6/map?bbox=-74.062,40.880,-74.050,40.890`
(overpass-api.de resets from the container). OSM has the outlines and names
but no heights; floors are read from Jose's Google screenshots. The drive's
axis (Prospect Ave mouth, heading 23° south of east, ~100 m to the end loop)
becomes the scene's -z at 0.2 units a metre; the drive itself stays wider than
real, and the back row is pulled forward onto the board. Ethics = George Link
Jr. Pavilion (Jose), ~6 floors, 12x7; Culture = Medical Plaza (Google labels
it), wider than deep (12.4x11, the three tiers); US Systems = Jurist Research
Center (guess), 6 floors, 6.5x9; Encounter = John Theurer Cancer Center (Jose
picked it from his screenshots: orange brick, white window bands, a round
glass corner, ~5 floors; `JT`), back right, pulled forward into the open space
behind Medical Plaza so it shows (really it is across 2nd Street); Terminology =
the rust tower, 12 floors (guess: part of the Helena Theurer Pavilion); the blue
glass building with the lettering is now context back left (`x1`, a guess at
Theurer), the old brick building with rows of windows context behind JTCC (`x2`). Left out on purpose: Women's and Children's, Imaging and the parking
decks (they would hide the exam buildings from the corner camera, and the
garden and café would go). Badge rows changed (`LABEL_2D`): row 1 the brick tower and JTCC.
Then (Jose, 2026-10-26, two AI reference images: "a beautifully crafted
miniature world", soft daylight) the scene got a kit in `diorama.html`:
`tree()` (curved trunk, branches, clustered crown, cherry `blossom`, clipped
`cone`), `bed(points)` (curved stone-edged beds of small flowers, lavender
and shrubs), `shrub`, `bench`, `bollard`, `entrance(key, x, frontZ)` (canopy,
columns, glass doors into a warm lobby, planters; at Ethics inline, US
Systems, JTCC), cute `person()`/`sitter()` characters (vertex-coloured,
faces, hair styles, props, a wheelchair being pushed), paving (`pave`), a
pond with stone rim, ripples and fountain, windows with a lintel shadow, sky
reflections and a few warm rooms, roof parapets. Daylight is the default
(`?dusk` for the golden hour); the card's colours in `app.css` and
`sky.webp` (`window.__sky`) match it. `LITE` (the live 3D test) uses plainer
stones and simpler spheres: ~440k triangles instead of ~940k.
**The campus in 3D** (Jose, 2026-10-26: "rotate, pinch to zoom, and a button to
preview how the buildings would look once they are completed"; his pick: a 3D
button opening it full screen, the card stays the fast picture). `.cp-3d` on
the picture (bottom left, 44 px, hidden while a building is picked) calls
`openCampus3d()` (`features/campus.js`): an `.overlay.c3d-ov` frame with
`campus3d/index.html`, dropped 300 ms after it closes (like the brains).
Messages, same origin only: the page sends `campus3d-want`, the app answers
`campus3d-data` {levels: each building's coverage, the card's paint share;
names: short, place, weight}; `campus3d-practice` {key} closes it and runs
`campusGo`; `campus3d-close` (its × and Escape). The page is
`docs/mockups/cchi-city/live/gen.py --app`: the diorama up to its capture
pipeline in `LITE` (~440k triangles), merged per building and material,
`runtime.js` in `APP` mode inside `app-shell.html`; three.js 0.160 vendored in
`campus3d/three/` (copied by the same script). In 3D progress is height, not
paint: a building stands at its finished floors with its roof on (no
construction); "See it finished" (`#finished`, `FINISHED`) shows them all done,
the badges lose their %. **The time of day** (Jose, 2026-10-27: "move the time of day, and the sun in
the right place"): the sun is the real one over HUMC (`sunSky` in `runtime.js`: the usual low-precision
solar formulas, within about a degree; checked against 2026-10-27's 7:25 sunrise, 5:56 sunset, 36° at noon,
and June's 72.6°) for today's date at the chosen hour, on Hackensack's clock (New York time, whatever the phone's zone). A compass bearing turns into the scene by
`bearing - DRIVE` (113°, the drive's heading), so north is (-0.92, 0, 0.39): from the front view you look
south-east, the sun rises ahead left behind the campus, stands south (right) at noon and sets behind you.
The light comes from it (never lower than 6°, or the shadows run off the board; after dusk it turns to the
old moonlight from the front); the looks (night, dawn or dusk, morning or golden hour, noon) follow its
height, not the clock, so sunset is golden at six in October and half past eight in June. Before this the
light came from fixed angles (the golden hour from the north, where the sun never is here) at summer hours.
The face in the sky goes where the sun is across your view (the sky behind the board is painted; the
camera's horizon is above the screen): in the middle when straight ahead, at the edge at 75° to the side,
out of sight behind you. The moon isn't worked out (it sits a little left, up). The bottom panel's first
row: the clock, a slider whose track is today's sky hour by hour (`dayTrack`), and **Now** (gold while it
follows the phone's clock; sliding lets go of it). The card sits above the panel (136 px). The card picture
(`city/`) keeps its own fixed daylight from the north-west; changing it means re-rendering the pictures.
Drag turns (OrbitControls, no pan,
polar 0.3-1.32, distance 45-190), pinch zooms, the round arrow puts the front
view back, a tap on a building lifts it with its card. Shadows redraw only on
change; sharpness starts at 1.5x and steps down to 1x while under 42 fps; a
hidden page draws nothing. No WebGL: the page says 3D isn't available. Offline
before a first visit: sw.js answers with a short note, as for the brain.
Suite: `campus-3d.cjs` (SwiftShader). Not measured yet: frame rate on Jose's iPhone.
Progress is paint, not lit windows: the board (`near.webp`) has every
building faded (its own colour, a third greyed and nearly half toward
white; first white clay, too flat at 0%); `city/<key>-paint<1..10>.webp` is that building
in full colour from the ground to its share (`fillSetup`/`fillAt`: a world-height
cut in each of its meshes' shaders; every mesh standing in its footprint
counts, banners and podium too), kept only where it shows and where it
changed a pixel. Drawn plainly over the board (`.cp-paint`, no blend, no
flicker). Depth layers keep their names: `sky.webp` is the backdrop wash
with the board's soft shadow (painted in 2D, exact colours), `far.webp` the
clouds behind the board, `near.webp` the board; each drawn alone on black
with its own silhouette as alpha (`aloneOnBlack`). Front clouds are the
drifting `clouds.webp`. Badges: placed by hand per camera
(`LABEL_2D`, three rows; the projected roof tops crowd at phone size), Dr.
Smiley steps to the right of his badge when the left would cover another,
and the tap areas go back to front (lowest box last) so the building in
front takes the tap. (For a few hours the card was a light pastel wash
with ink text; it is the evening card again, see above.) Phone loads ~360 KB for the whole set (was ~1.4 MB in `city/`).

**Your HUMC campus** (`renderCampus`, `CAMPUS`, `CAMPUS_MAP`, the pick: in
`features/campus.js` since 2026-10-24; `campusLife` and `campusDepth` are
in `index.html`, "Practice dashboard motion"; Jose,
2026-10-19: "look like a game", then "like Hackensack University Medical
Center"; after a generic city, a satellite-traced campus and a box model he
said "still not it", he sent photos of the main entrance, day and night).
Replaced the readiness card. The scene is the main entrance at golden hour (dusk until F3), laid
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
manifest into `CAMPUS_MAP`. Phone loads the three depth pictures + 5 lit layers (~300 KB). On the scene: a small % badge
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
the 50 lit layers (the live things take ~3 min, the lit set ~25). There is
no old `entrance.json` in the repo: write one from `CAMPUS_MAP` first
(`JSON.parse` of the line in `index.html`).

**Golden hour and depth (F3, 2026-10-20; Jose's film brief: keep the
pre-render, regrade, add parallax from scroll and drag, not device tilt).**
The light in `entrance.html`: a low warm sun from the left (`SUN_DIR`, long
shadows to the right), lavender fill in the shade, a pink backlight for the
rims; the sky dome runs peach at the horizon to lavender overhead with the
sun's glow just off frame left (`GLOW_DIR`), no stars; the haze
(`scene.fog`, peach) thickens toward the horizon; the far town is green
ground with trees, a few warm roofs and a pastel skyline with almost no lit
windows. The bloom threshold rose to 1.6: at 0.9 the bright sky bloomed into
a veil over the whole picture. Every capture except the lit windows goes
through `grade()`: only near-black and near-gray pixels move (shadows toward
lavender, light toward peach), so nothing ends pure black or gray (a
stronger grade washed the whole picture out; `?nograde` turns it off for
comparison). The scene is three full-frame pictures (`capLayers`):
`city/sky.webp` (the dome alone), `city/far.webp` (town and skyline over
transparent sky) and `city/near.webp` (the campus over transparent
background). Each layer's edge pixels are un-mixed from what was behind them
(`unmix`), so no sky colour rims the buildings when the layers slide apart.
`city/entrance.webp` is still written, now the whole graded picture: the app
draws it only for a map without `layers` (an old `CAMPUS_MAP`).
`CAMPUS_MAP.layers` holds their boxes. The lit windows did not need
re-rendering (same camera and geometry; `NOLIT`), so the full run is under a
minute.

In the app the sky (`.cp-d-sky`, with the clouds) and the town
(`.cp-d-far`, with the flock) slide behind the still campus by
`--dpx`/`--dpy` (css px, at most 10; the town and flock 0.6 of it, the clouds
0.9), set on `.cp-world` by `campusDepth(root)` (called with `campusLife`):
by where the card sits on screen as the page scrolls, and by a sideways
drag across the scene (finger or mouse), which springs back on release (a
small spring, the finger leading with no lag while it drags). The campus
never moves, so badges, tap areas, movers and lit windows stay put. Each
back layer is scaled up (1.08, 1.045) just enough to cover its widest slide.
`.cp-world` has `touch-action:pan-y`, so up-and-down still scrolls the page.
A drag never picks a building: the click that follows is swallowed. Nothing
runs at rest (the loop stops once settled) or while the card is away
(`is-away`); reduced motion draws the layers and never slides them. Suite:
`campus-depth.cjs`.

The card around the scene follows (2026-10-20): its sky runs to a deep
violet (`#33295f`) instead of night navy, the stars are gone, and a soft
warm glow sits at its top left where the scene's sun is off frame
(`.cp-card::before`). The lower colours are unchanged, so the chips and
Exam sim read as before; the HUD's white text keeps 9.7:1 on the new
violet.
**Round 2** (Jose's picks, 2026-10-19): an ambulance bay on the banner
building's right flank (`BAY`, brick, a warm-lit opening; its two sliding
doors captured apart as `bay0..2.webp`, closed/half/open, `.cp-bay`), which
`campusLife` opens on the ambulance's own 34 s clock as it arrives and
closes after it fades; the car that backs out of the surface lot
(`LOT_A`/`LOT_B`: the same car parked in the empty spot with its reverse
lights, then nosed east; `lot0/1.webp`, `.cp-lot` with `data-pts2`; it
reverses into the lane, drives the lane to the drive and out to the
street, fades, and is back in its spot); people on the benches (`sitter`,
`sit<i>-<f>.webp`, `.cp-sit`: an elder and a kid on the left bench, a
visitor on the right; the second frame turns the head for 1.5 s every 7 s,
staggered by `--i`; they stay under reduced motion, first frame); a flock
of birds (`flock`, five Vs with two wing frames, `birds0/1.webp`,
`.cp-birds`) crossing the sky above the towers once every 64 s. Round 1's
street cars drove nose-backwards (a vehicle's front is its local +z, so
`rotation.y = +pi/2` faces +x); fixed in the same render. Suite
`campus-life.cjs`.

**Springy press (F2, 2026-10-20; Jose's film brief).** Block "Springy
press" at the end of `index.html`'s main styles (late on purpose: it wins
over each button's own transition at the same specificity). Pressing a
study-mode card, a quiz option, a confidence button, a candy Practise or
Play button squashes it (wider and shorter, 80 ms); releasing springs it
back past its shape and settles (`--spring-settle`, a damped-spring
`linear()`, about 23% over then a smaller swing, 0.6 s; browsers without
`linear()` keep `--spring`). `.study-mode`, `.quiz-option` and `.conf-btn`
joined `LIFTS` so a touch marks them pressed. The streak chip's flame icon
flickers from its base (`flameFlicker`: tall and narrow, then wide and
short), exempt from `.is-still`; the quiz's hot-streak 🔥 does the same,
faster. Reduced motion: no squash, no flicker. Suite: `spring-press.cjs`.
