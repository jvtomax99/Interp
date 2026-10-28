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
- The pavilion's floors are 1.65x a normal floor, 4 of terracotta platform
  and 9 of glass (scene.json floors 13), so its glass rises over the bridge
  as in his window photo, measured against Imus and the bridge in the same
  frame (2026-10-28; it was 1.3x and 9 in all, about half as tall).
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
  its mouth open to Atlantic; an island under
  the walkway (big evergreen, lamp, hydrant, fence; at its corner by Atlantic, a pink cherry in full bloom (`cherry`: built by
  hand, limbs spreading wide, fine puffs from deep pink to near white, petals on the mulch and drifting), round
  bushes and the white wayfinding sign, his photo), bollards, an orange barrier. The Atlantic Street
  garage: brick spandrels and precast bands. The Mark Messier Skyway for Tomorrow's Children sign: a tan panel at
  the walkway's hospital end, beside the curved glass, facing the court. Placed by eye from the photos: the glass wall's width, the canopy, the
  atrium.

## Open

- Other skybridges: the map has two more footway bridges, from the Atlantic Street garage south over 2nd Street
  (way 8921) and one at x 15.7 between the pavilion and the Visitors garage (way 8911). Not built yet; ask.
- Whether the red sign on Imaging's canopy really reads EMERGENCY (too blurry in his shot).
- The ambulance still drives to the bay on Link Pavilion's side, not the
  real ED (Creamer) on Atlantic Street.
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
- Into the app: `campus3d/` (`gen.py --app`) and the card's pictures
  (`builddiorama.cjs`, `city/`) still show the old campus. Wiring this in is
  its own pull request once Jose OKs the look.
- Map data © OpenStreetMap contributors (ODbL): the credit is on the page.
