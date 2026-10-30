# Campus on the real map (preview, 2026-10-27)

Jose's ask: make the campus match the real HUMC campus, front and back.
**Every building** comes from his OpenStreetMap export (`map.osm.xml`), the
front's three included (Link Pavilion, Jurist, Medical Plaza; 2026-10-28), as do
the streets, lots and garages beyond the front. **The ground at the front** is
still the hand-built diorama's (`../diorama.html`: Prospect Ave, the drive with
its medians, the fountain and the sign, the canopy and the drop-off), refitted
around the real buildings. Not in the app
yet: a preview page only (Artifact
https://claude.ai/artifact/7uyf7q3572hqDM9wFo7NAM, private).

## Build

```
pip install shapely matplotlib     # only for steps 1-2
python3 osm_to_json.py             # 1. map.osm.xml -> osm.json (outlines in meters), osm-check.png
python3 scene_export.py            # 2. osm.json -> scene.json (the back, in diorama units), scene-check.png
python3 aerial_roofs.py            # (optional) the state's 2020 aerial -> roofs.json (roof colours, rooftop machines)
python3 build.py <out.html>        # 3. ../live/gen.py's page + back.js + scene.json -> the preview
python3 build.py --app             #    or the app's 3D campus, campus3d/index.html
```

`scene.json` is committed, so step 3 alone rebuilds the page. Step 3 runs
`../live/gen.py`, so it always starts from the current diorama and
`runtime.js` (real sun, the app's message bridge). Check it like the live
page: `../live/livecheck.cjs`, or Playwright at iPhone size (393 x 852).

- `back.js`: the back of the campus. Map buildings extruded from their
  outlines (`realBuilding`), streets, sidewalks, lots, aprons, parked cars,
  lighter back trees, entrances, lettering along walls (`letterAlong`), and
  the corner of Atlantic and 2nd Street built from Jose's photos.
- `build.py`: drops every hand-built building (the guessed back ones, and
  since 2026-10-28 the front's three and the surface lot on the left, where
  the map has houses), adds `back.js`, refits the front's ground (the drive
  narrowed to run between Jurist and Medical Plaza, the canopy moved onto
  Link's real front wall, the café, the walkers, cars and ambulance kept out
  of the buildings), and
  changes the runtime for a board twice as wide and deep (shadows over the
  whole board, two-finger pan with the target kept on the board, outline
  halos on the real footprints, badges kept on screen, the garden moved).

## The card's pictures (2026-10-28)

The CoreCHI Practice card's pictures (`city/`, `CAMPUS_MAP` in `features/campus.js`), rendered in Blender
from this scene, from the card's camera (Jose's picks: Blender, the card, the moving things with it).

```
python3 build.py campus.html                                   # the preview page
npm install --no-save three@0.160.0                            # in ../ (three.js for the page and the exporter)
node card_capture.cjs campus.html cap                          # 1. scene, movers and paths (~2 min)
python3.11 card_render.py cap renders 96                       # 2. Blender renders (~25 min on 4 CPUs)
python3.11 card_build.py cap renders out --install             # 3. city/*.webp and CAMPUS_MAP (~2 min)
```

Python 3.11 with Blender's module: `pip download bpy==5.0.1 --no-deps --python-version 3.11
--only-binary=:all:`, then a 3.11 venv with that wheel, numpy and Pillow.

- `card_page.cjs`: loads the built page in headless Chromium with its moving things exposed (`window.__L`)
  and frozen, and one roof spot of the Visitors Parking garage left empty (the lot car's).
- `card_capture.cjs`: `base.glb` (the board, nothing that moves; the lamps' faint pools of light left out:
  Blender draws them black), `m/*.glb` (each mover per frame, posed), `card.json` (camera, boxes, every
  path with, per point, whether a ray from the camera reaches it), `spray*.png` (the fountain, three.js).
- `card_render.py` (`toy_look.py` shared with `toy_render.py`): painted, clay, `mask-<k>.exr`,
  `height.exr`, `glow.exr`, then every mover frame cropped with the board as holdout; `proj.json` (paths
  and points as Blender's camera sees them). The ground's flat layers overlap in one plane, which Cycles
  shades black; `flat_ground_apart` lifts each of their vertices by up to 0.004.
- `card_build.py`: halves everything to 960 x 840, cuts each building's paint and lit windows in tenths
  (its mask, below n/10 of its height, where the paint changes a pixel), shares one box between a mover's
  frames, packs the people about into one atlas, and writes `entrance.json`; `--install` replaces `city/`
  and the `CAMPUS_MAP` line.

## The audit (2026-10-29)

`node audit.cjs campus.html out.json` (`MAP=map.png` for a picture from above with each spot ringed): steps the live
campus's clock over two minutes and flags every car and person that runs into something (a ray at body height along
each step), stands inside a building's outline, drives off the road or walks along it away from a crosswalk (more than
3 units: a driveway's mouth is fine), or comes too close to another mover; also the card's own two paths. Jose's ask:
"some people walk into walls and some cars do the same". 269 spots before; the fixes are the block "the audit's fixes"
in `build.py` (the drive's lanes and its turn round at the drop-off, the ambulance to the ER's court in 3D too, the
parked ambulance off 2nd Street, Prospect's cars on the board and in step per lane, sidewalks cut where streets cross
with crosswalks, walkers on sidewalks clear of buildings, benches, trees and columns). What it still finds: a car and a
person meeting at a crosswalk or a corner, and two walkers passing at a corner. Cars giving way to people is the next
step (Jose's traffic prompt).

## Traffic (2026-10-29)

Jose's prompt 2: "Make the cars drive like real traffic: stay in the right-hand lane, follow the real direction of each
street, slow down and stop at stop signs and crosswalks, turn on curves instead of sliding sideways, and never overlap
each other. Use the map data for which streets are one-way." `traffic.js` (put in by the block "traffic" at the end of
`build.py`) drives every car on the board in 3D; `life(t)` calls `traffic(t)` after the people have moved.

- Routes: the map's lanes (`scene.json` paths, 0.65 right of each street's centre), cut and joined into whole trips,
  corners rounded into arcs, heading along the curve. 13 routes: Prospect both ways, 2nd Street both ways, Atlantic
  south (stop at 2nd, stop at Prospect, right onto Prospect), Atlantic north (a left or a right off Prospect, stop at
  2nd), Essex south to the light and right onto Prospect, Prospect to the light and right onto Essex, the drive in (a
  right off Prospect or a left across it), its drop-off, the turn round behind the fountain and out with a left, the
  drive-through out with a right, the ambulance (in from Prospect, up Atlantic, round the ER's court, 12 s at the doors,
  out down Atlantic). 16 vehicles take turns on them, with pauses off the board.
- Speed: the Intelligent Driver Model (Treiber, Hennecke, Helbing 2000): speed up to the street's speed, slow for a bend,
  keep a safe gap, and a line it must stop at counts as a car standing there.
- Stops: stop signs (a full stop, then on); the light at Prospect and Essex, the map's one signal (node 103159193), a 31 s
  cycle, a right on red after a stop for Essex; people where a walker's path crosses the route (a car waits for anyone on
  it or about to step on); where two routes cross or merge, a car takes the crossing only when it is free, and from a stop
  sign or across traffic only with a gap of 2.6 s in the other stream.
- One-way, from the map (`osm_to_json.py` now keeps the tag): every public street on the board is two-way; the drive is
  one-way (in on the east lane, out on the west) and so is the ER's court loop. **Assumed, not in the map:** the stop
  signs (Atlantic at 2nd Street and at Prospect, the drive's exit). The map tags none here; check them on Street View.
- `node traffic_check.cjs campus.html [seconds]` measures it: cars' outlines touching, a car over a person, a car moving
  more than 12 deg off its heading, a stop sign passed without a stop, the light passed on red, a car stuck over 40 s.
  2026-10-29, 300 s: all zero, every route finishing trips. `audit.cjs` takes the new cars too and skips cars off the
  board; it still finds walkers passing close (prompt 3) and a paved apron that overlaps 2nd Street at x -31.5 (the old,
  faster cars stepped over it).
- How others do it: SUMO (the research simulator) uses car-following models like this one and right-of-way per junction;
  Cities: Skylines reserves junction space and uses signs and lights; Mini Motorways only queues at junctions. Here it is
  the real map's lanes and signal, and every crossing gives way to people, which the games mostly skip.
- Not in this version: the card (`city/`): its cars still play fixed paths and were not re-rendered (a sprite has one
  heading, so stopping or turning there needs new renders); the people do not wait for cars yet (prompt 3); lane changes,
  overtaking, parking manoeuvres.

## People (2026-10-29)

Jose's prompt 3: "sidewalks, crosswalks, real doors, waiting at the ER and main entrance, pairs, wheelchairs, standing
and talking; never through walls, cars, trees or each other." `people.js` (put in before `traffic.js`, which calls
`makePeople()` and steps the people before the cars in each 1/30 s) walks everyone; `life(t)` no longer moves `WALKS` or
`BACKWALKS` (their figures and paths stay, the card's capture reads them).

- Routes on the sidewalks, door to edge or edge to door: Link Pavilion's revolving door in the drive-through (bollards,
  its crosswalk, round the brick pier), Jurist's door on Prospect and its side door, Medical Plaza's, the Cancer
  Center's on 2nd Street. Prospect's north sidewalk is two-way: east-bound at z 13.06, west-bound at 12.75 (each keeps
  right, clear of the benches and the people standing at 12.25-12.4); the side streets' sidewalks are walked one way.
- Nobody through anybody: a person slows behind someone in their path, two who would wait for each other take turns,
  and on a shared line (the path to Link's door) people coming the other way each step 0.2 to the right.
- Crossings: where a walk crosses a car's route, grouped by street (a median is a place to wait); a person waits at
  the curb until no car is on the crossing or coming within 3.4 s (a car that has stopped counts as clear), then goes
  without stopping. The cars give way to anyone on or stepping onto their path (traffic.js), so neither waits forever.
- A couple side by side on the far sidewalk, falling into single file to pass its trees; a child a step behind a parent
  (out of the door after them, in after them); a wheelchair at 0.55 with the one pushing it, taking room for both.
- Standing and talking: `IDLE`; the main entrance's group moved off the drive-through's road onto its sidewalks, and four
  people wait outside the ER's doors in the court.
- Measured (`traffic_check.cjs`, 300 s): crowding (people closer than 0.25, or within 0.3 of someone standing), someone
  stopped out on a street, someone waiting over 30 s, all zero, every walk finishing trips; the cars' counts still zero.
  `audit.cjs` (walls, trees, poles, buildings, roads): one known spot, the walk from Jurist's walk across the
  drive-through's mouth to Link's outer sidewalk, about 3.5 units of driveway with no crosswalk in the scene.
- Not in this version: the card's walkers (fixed paths, not re-rendered); people going into buildings past the door.

## The fit (`scene_export.py`)

Map turned 112 deg so Prospect runs across the front, 9 m to a unit, then
scaled 2.1 and moved so the drive's mouth, Jurist and Medical Plaza land on
the diorama's (about 4.3 m to a diorama unit; it was 9 m in the first
real-layout try, which made the front look small). `FRONT` is the ground the
diorama still builds by hand (the street, the drive, the drop-off): map
streets inside it are clipped, buildings are not. `OLD_FRONT` (the hand-built
front as it was) keeps the map's paving and trees off the front lawns.
Link Pavilion's outline loses the stub over its doors (`LINK_CUT`: the
map's canopy; the diorama's canopy stands there instead), so its front wall
runs straight at z -8.1. Medical Plaza's set-back tiers (3 floors of brick,
2 of dark glass) are its outline inset (`tiers`); `DOOR_AT` picks each front
building's door wall. Floors are not in the map; they are read off Jose's
Google 3D flyover (Link 6, Jurist 6, Medical Plaza 4 + 3 + 2, as the
hand-built ones had).

Before the 2026-10-28 rebuild, the hand-built front was off the real map:
Link Pavilion a third of its real footprint (94 against 258 square units, 30%
overlap), Jurist 15 m off, Medical Plaza 7 m off and small, a parking lot
where the map has houses.

## Decisions (Jose, 2026-10-27/28)

- The real back at true scale on a bigger board (his pick over squeezing the
  back). First with the hand-built front kept as it was; then, 2026-10-28,
  "still not accurate to the actual location": the front's buildings rebuilt
  on the map too (his pick over fixing Link alone).
- Link Pavilion's helipad is where the map has the Emil Buehler Helipad, on
  its east wing; its two banners hang on that wing's face, beside the
  ambulance bay.
- Domains: Ethics = Link Pavilion (its roof has the real helipad, the Emil
  Buehler Helipad in the map); Terminology = the map's "Patient Pavilion",
  which is the **Helena Theurer Pavilion** (photos: terracotta platform with
  slit windows, curved glass tower with HACKENSACK UNIVERSITY MEDICAL CENTER,
  a slim glass tower with the HMH mark, the platform bridging 2nd Street into
  the Employee Parking Garage; ENR: "spans a public roadway and connects to
  an existing parking garage"); Encounter = the real John Theurer Cancer
  Center across 2nd Street; US Systems = Jurist; Culture = Medical Plaza.
- Don Imus - WFAN Pediatric Center: tan brick, ribbon windows, its name in
  three lines on the curved corner at Atlantic and 2nd. The ED next to it:
  red brick, white bands, five floors.
- Corner of Atlantic and 2nd (his window at Theurer): crosswalks on four
  sides, pink corner paving, stop sign, poles and wires, the flagpole over
  the round red-and-yellow mum bed, the Emergency sign, a parked ambulance.
- The pond garden sits on the lawn by 2nd Street, past the pavilion's
  bridge, where the red and green trees were (his circle), at 60% size to
  stay off the drop-off drive (`GS.position` in `build.py`).
- The pavilion: 9 floors at 1.3x a normal floor, 4 of terracotta platform and 5 of glass (scene.json floors 9), as the
  real nine-story pavilion (2026-10-29, Jose: "the glass upper tower is too tall", his pick from three test views; on
  2026-10-28 it had been raised to 13 floors at 1.65x from his window photo).
- Corner of Atlantic and 2nd, rechecked 2026-10-28 against his window photo,
  Street View at 84 2nd St and two Google 3D views, each rendered from the
  same spot: the curved glass tower moved up to the street (it stood about
  45 m back and barely showed over the bridge), its west face bowed toward
  the corner, its south end reaching out over the parking beside the bridge
  on three columns; the bridge's terracotta in two staggered rows of long
  slits; the building across 2nd Street from Theurer (map 7562) is a
  five-floor silver building with a row of big round roof fans, not a
  house; Imus's ground floor is pale block; the Atlantic Street garage has
  a beige stair tower on its corner; a glass skybridge crosses Atlantic from
  the garage to the ED, north of Imus (where it lands is a guess).
- His iPhone runs the preview at 60 fps (2026-10-28).
- The Visitor Parking court (his 8 photos, 2026-10-28): Medical Plaza is a
  tall maroon granite tower with light granite bands (9 floors over a
  3-floor wing, 12 in all) on square piers with light caps, its ground floor
  open all round, the lobby set back; it was a stepped pile with dark glass
  on top. The tower stands against the garage at the court's corner. The
  Visitor Parking garage is 5 decks of brown-grey concrete (8 was a misread
  of the tower in the aerial). The court between Link's east wing, the
  garage and the tower: asphalt, the gates with "Enter | Visitor Parking |
  Enter", arms and a booth, a pointed island of white stones in a yellow
  curb, cars along the tower behind a wooden guardrail on stones, a lawn
  with a hydrant, the crosswalk from the walk by Link to the tower's corner
  with the stop-for-pedestrians sign, steps and a ramp with black railings,
  the walk's dark brick border and yellow curb, a black fence and a lamp.
- Moving round (Jose, 2026-10-28: "wonky and hard"): `nav.js` replaces
  OrbitControls' one-finger spin and its hard clamp at the edges (it snapped
  the view back every frame) with the Maps way: one finger drags the ground
  (the spot under it stays under it, a flick glides 16 units at most), pinch
  zooms toward the fingers, twist turns, two fingers up or down tilt, a tap
  on a building flies to it, Reset view goes home, the board's edges stop it
  softly; a mouse drags, right-drags to turn and tilt, wheels to zoom. Checked
  with simulated touches at iPhone size (drag error 0, pinch 2x about the
  fingers, twist, tilt, edges, flight, reset). Wiring into the app takes
  `nav.js` along (the app's round Reset button is used when present).
- The front, from his 8 Google 3D shots (2026-10-28): Link Pavilion's two
  banners are on its front at the end of the drive (white HMH left, blue
  right), and a curved planted island with evergreens hugs that face, the
  drop-off road looping round it; the white canopy and lobby are gone.
  The white precast building with ribbon windows and a big glass grid in
  his shots is the Women's and Children's Pavilion, left of the main
  campus (Jose; 6 floors). The Visitors Parking garage beside the drive has
  8 decks.
- Helena Theurer Pavilion and the little park beside it (his 12 Street View
  and Google 3D shots, 2026-10-28): the bridge sits low over the road with a
  tall terracotta block on a deep grey band (two dark panels either side of
  its name, the name on both faces); the overhang stands on slim grey piers
  over a raised brick planter along the sidewalk; the older hospital tower
  at the platform's east end (orange brick, white bands, beige base, ten
  floors) rises behind the park; the park is a round plaza in rings of pink
  and terracotta paving round a planted centre, red-leaf trees along the
  street, a brick utility house, white tanks and a tent behind (it replaces
  the diorama's pond garden); Audrey Hepburn Children's House has two grey
  pitched roofs with dormers over four floors; the silver building with the
  roof fans carries the HMH mark on its corner.
- The glass tower is big (Jose, 2026-10-28, "pay attention to the upper glass
  portion, it's big"): about 16 x 17 units, its long curved face toward the
  corner, from beside the bridge to behind Imus (`htpCurve`).
- The slim glass tower with the HMH mark is on Imus's side of the street
  (Jose, 2026-10-28), so it stands against the curved tower's east side, on
  terracotta, the mark facing 2nd Street.

- The drive in from Atlantic Street, along Women's and Children's (his 4 Street View shots, 2026-10-28; he
  called it the Creamer trauma center): the map's service road along the pavilion's front, with a drop-off lane
  under a long flat grey canopy on tan columns, split off by a planted island (yellow curb, flowers, a wayfinding
  sign, hydrant and two yellow bollards); the pavilion's wall is light tan precast with brick spandrels and teal
  ribbon windows (his aerials read it as white); at its east end a drive-through tunnel between brick piers (the
  map's covered service road, way 4473), crosswalks at its mouth; across the side drive, Creamer Imaging in plain
  red brick, its front under a grey canopy wrapping the corner, a red EMERGENCY sign, a louvred penthouse and a
  white HMH banner. The skybridge over Atlantic moved to where the map draws it (footway bridge, way 8918: the
  garage to the ED's corner by Imus); it had been over the ED's turnaround, a guess. Fixed: Imaging and the
  Hillcrest Building had lost their colours to a misplaced comment in `STYLE`.

- Roofs from the state's aerial (Jose's pick, 2026-10-28, over Google, whose terms forbid building models from its
  content): `aerial_roofs.py` reads New Jersey's Natural 2020 orthophoto (NJOGIS, img.nj.gov, 1 ft pixels, access
  constraints "none"), warps it onto the board with the same fit, and for each hospital building takes the roof's
  colour and boxes where machines stand (patches that differ from the roof and are not shadow), into `roofs.json`.
  Left out: the Helena Theurer Pavilion (built after the photo) and Medical Plaza (its tiers), and both helipads on
  Link (the live one, and the old one the map calls disused, still painted in 2020). The photo's blue-green cast is
  scaled out; the machines' colours are mostly greyed and grouped into a few shades (one mesh each).

- Link Pavilion's front and Medical Plaza's drop-off, from Jose's 13 photos on the ground (2026-10-28): the front
  entrance is a drive-through under Link Pavilion (the map's tunnel road, way 8933), so the floors above reach out
  over the drive again (the map's stub, cut until now) on brick piers, the banners on their face; under it a grey
  concrete soffit, the lobby's dark-framed glass, two round white columns either side of a revolving door, steel
  bollards, a yellow curb and a crosswalk. From its east end a long dark barrel canopy on black posts runs over a
  herringbone brick walk with lantern bollards and a red call box (where it ends is not in the photos). Medical
  Plaza's west wing stands over the map's covered loop (ways 2222-2224) and is rosy-brown panels with cream bands.
  The curved planted island at Link's front is gone (the drive runs there). Buildings take an `under` (a drive
  under them): `ground` outline, `open` soffit, `floors` high. Open: the canopy's far end, the parking garage's
  entrance in the photos ("Visitor Parking, Enter"), and whether Medical Plaza's loop has its own doors.

- Link Pavilion's front at the head of the drive (his photos, 2026-10-28): the two U.S. News banners (white under a
  navy band, their words), the arched window over a tall dark glass strip between them, three flagpoles, evergreens,
  a black fence over pink flowers, the wayfinding sign. A brick bridge over the drive to Medical Plaza was tried
  and removed (Jose: "get rid of ... a floating building"). The John Apovian, M.D.
  Cardiac Surgery and Structural Heart Center is part of Link (Jose): on its wall along the canopy walk, a lower grey
  barrel canopy, glass door and windows, white lettering. The canopy walk runs in front of it (Jose); the diorama's old
  ambulance bay box, which stood on the walk there, is gone (its doors moved inside Link, out of sight).

- The court off Atlantic Street (Jose's 11 photos, 2026-10-28, "Don Imus area"): an open drop-off court between
  Women's and Children's (north), the curved building the map calls the ED (east) and Imus (south). The curved
  building is silver panels with ribbon windows (it was red brick), two floors of curved glass over the court, its
  ground floor set back under them (`under`) on a round tan column. Women's and Children's south face on the court:
  tan stucco, the Joseph M. Sanzari Children's Hospital entrance under a grey canopy, a green glass wall with pink,
  green, blue and peach diamonds, a round column. Imus' face on the court: grey panels with a glass band, a tall glass
  atrium with a white overhanging roof on a white column, its name low in front. The walkway over Atlantic is the
  Joseph M. Sanzari Family Walkway: grey panels with children's silhouettes and its name, glass on diagonal steel, the
  Hackensack Meridian Health sign band, an X-braced pier at the hospital end. The court: a round turnaround (Jose: "the center is circular"), asphalt in a low curb, pale concrete round it,
  its mouth open to Atlantic; the court's paving, turnaround and island start at Atlantic's east sidewalk
  (they ran over the road until Jose's 2026-10-28 screenshot); an island under
  the walkway, cut back off Atlantic (Jose; no evergreen: lamp, hydrant, fence; at its corner by Atlantic, a pink cherry in full bloom (`cherry`: built by
  hand, limbs spreading wide, fine puffs from deep pink to near white, petals on the mulch and drifting), round
  bushes and the white wayfinding sign beside it, his photo), bollards, an orange barrier. The Atlantic Street
  garage: brick spandrels and precast bands. The Mark Messier Skyway for Tomorrow's Children sign: a tan panel at
  the walkway's hospital end, beside the curved glass, facing the court. Placed by eye from the photos: the glass wall's width, the canopy, the
  atrium.

- Toy look (Jose's train-diorama video, 2026-10-28, his pick "test one area live"): `toy.js`, a "Toy look" pill on
  the preview (left, above the sheet; `?toy=1`, kept in localStorage). Satin plastic (rougher-capped, no metal), richer
  colours at the same brightness, a touch more fill light, no fog, a dark studio backdrop, and the miniature blur at
  the top and bottom of the screen as a CSS backdrop blur under a gradient mask (no extra WebGL pass). Not done: baked
  corner shading (ambient occlusion), puffy roof steam. Waiting on his look and frame-rate reading both ways.

- Toy look in Blender (his pick "Blender test render", 2026-10-28; the live Toy look "doesn't look like the video"):
  `export_glb.cjs` loads the built page in headless Chromium and exports every visible mesh to GLB (no glows, no
  shader materials); `toy_render.py` (Blender's Python module, `pip install bpy` 5.0.1 on Python 3.11) gives it satin
  toy plastic with rounded edges (Bevel node), a warm soft sun, a sky for the bounce light, AgX, depth of field, drops
  the page's clouds, and renders front / whole / court with Cycles on the CPU (about 100 s each at 900 x 1200, 96
  samples), on a transparent film for a dark studio backdrop. Pictures only: the app can't render like this live.
  Jose's pick for them (2026-10-28): the CoreCHI Practice card. `VIEWS=card` is the card's camera direction pulled
  back to the whole board (`CARD_DIST`, 235); `PROGRESS="e:0.8,t:0.55,..."` paints each domain building up to that
  share of its height, white clay above (a Z test in each copied material), as the card shows progress. Mock-ups so
  far; the card's real pictures (near/far/sky, each building's paint in tenths, glows, the moving sprites) are
  builddiorama.cjs's ~150 files, to be rendered from Blender in their own change.

## The buildings, against sources (2026-10-30)

Jose's prompt 4: every building checked for floors, doors, garage entrances and bridges, with sources. OpenStreetMap has
names and outlines but no heights or levels for any of them. Pages read in full unless marked.

| Building | Was | Now | Source |
|---|---|---|---|
| Helena Theurer Pavilion | 9 | 9 (kept) | HMH, its page: "a nine-story, 530,000-square-foot surgical and intensive care tower". ENR (2023 Best Projects): "The five-story patient tower, which sits atop the three-story surgical platform", "spans a public roadway and connects to an existing parking garage and four of the hospital's floors". The model's 4 platform floors read as ground + 3. Stantec says eight, Page ten, Introba eleven (snippets, not read) |
| Medical Plaza (20 Prospect) | 12 (9-floor tower stacked on a 3-floor wing) | 9 (tower 6 over the wing's 3) | HMH: "20 Prospect Avenue – Room 400, Fourth Floor"; the highest suite listed anywhere is 907, "take the elevator to the 9th floor" (NJ Brain and Spine, snippet). None above the 9th. Jose's "9 floors over a 3-floor wing" (2026-10-28) is read as a 9-floor tower beside the wing |
| Jurist Research Center | 6 | 5 | Tomorrows Children's Fund (tcfkid.org/OurFacilities/DavidJurist): "Rising five stories high, the center encompasses 55,000 square feet". The page is gone now (404); seen in the search index only |
| Gabrellian Child Care and Learning Center | 2 | 4 | HMH, pediatric residency, Resident Life: "The four-story, 30,000-square foot facility" |
| Central utility plant (map 7562, the silver one with roof fans) | 5 | 4 | ENR, same article: "a new four-story central utility plant across from the hospital". That map 7562 is the plant: HMH puts it "at Second and Atlantic streets" (snippet; the release is a 404 now) |
| Women's and Children's Pavilion | 6 | 6 (kept) | Severud (structural engineer): "the upper six floors ... over three below-grade parking levels" |
| Atlantic Street garage | 6 | 6 (kept) | Desman (its designer): "6-story precast", "going from a 3-story structure on the west end to a 6-story structure on the east end" with the grade. The board is flat and the roof deck level, so it stays 6 |

Garage entrances (`garageMouth` in `back.js`): the Employee Parking Garage's two on 2nd Street where the map's driveways
meet its wall, one right under the pavilion's bridge (ENR: "two entrances directly underneath the work zone"); the
Visitors garage's second, on its west wall where the map's driveway from the south ends (map only; not in any source).

Not proven (no source found; left as they were): Link Pavilion 6, John Theurer Cancer Center 5 (trade press for its 2010
opening says "five-story", snippet only), Imus 6, the ED 5, Imaging 3, Johnson Hall 3, Hillcrest 4, Audrey Hepburn
Children's House 4, the Visitors garage 5, the Employee garage 6 (HMH: pay kiosks "on the 1st and 5th floor", so 5 at
least; snippet), the older tower behind the park 10, the Atlantic garage's entrance (the map has none), the two other
footway bridges (ways 8911, 8921), the Sanzari Family Walkway's landing. Blocked sites that might settle some: langan.com,
goldmancopeland.com, audreymatlock.com, tradelineinc.com, web.archive.org. Heights are floors x the toy's floor (0.62
units, about 2.7 m at 4.3 m to a unit), lower than a real hospital floor (about 4.5 m); the footprints are true size.

The card's pictures (`city/`) were rendered again in Blender with these heights (2026-10-30).

## Open

- Other skybridges: the map has two more footway bridges, from the Atlantic Street garage south over 2nd Street
  (way 8921) and one at x 15.7 between the pavilion and the Visitors garage (way 8911). Not built yet; ask.
- Whether the red sign on Imaging's canopy really reads EMERGENCY (too blurry in his shot).
- The ambulance still drives to the bay on Link Pavilion's side here (the card's pictures have it on Atlantic
  Street: card_capture.cjs).
- The front's ground, from the state's 2020 aerial (2026-10-28, Jose's pick "match it to real life"): the back
  island with the fountain at its head now runs z -0.2 to 4.8 on x 0.64 (it was a unit west, the fountain three
  units north), the front island is narrower and shorter (z 6.2 to 11.5), the entrance sign scaled to fit its mouth;
  asphalt from x -2.9 to Medical Plaza, a lane of parked cars on the left, two lanes out (arrows) and one in.
  Still open: the aerial puts the drive's east curb under Medical Plaza's covered drop-off (the map's covered loop,
  ways 2222-2224, under the building's west part), which the preview builds as solid wall; and the curved
  planting at the drive's head on the left. Ask for street photos of the front.
- Medical Plaza's door wall (the street side) and the café either side of
  it are placed, not known.
- Domain weights on the cards are 9/25/9/45/12; the CoreCHI blueprint is
  22/22/22/15/19 (Ethics, Encounter, Terminology, US Systems, Culture). Ask.
- Into the app: done. The card's pictures (above), and `campus3d/` (`python3 build.py --app`, 2026-10-29: the same
  page in the app's shell, without the preview's title, hints and Toy look switch; its title pill names the gestures
  and credits the map).
- Map data © OpenStreetMap contributors (ODbL): the credit is on the page.
