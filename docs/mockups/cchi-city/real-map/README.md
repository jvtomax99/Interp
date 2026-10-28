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
- The glass tower is big (Jose, 2026-10-28, "pay attention to the upper glass
  portion, it's big"): about 16 x 17 units, its long curved face toward the
  corner, from beside the bridge to behind Imus (`htpCurve`).
- The slim glass tower with the HMH mark is on Imus's side of the street
  (Jose, 2026-10-28), so it stands against the curved tower's east side, on
  terracotta, the mark facing 2nd Street.

## Open

- Other skybridges in his photos: which buildings they join is unknown.
- The ambulance still drives to the bay on Link Pavilion's side, not the
  real ED (Creamer) on Atlantic Street.
- The front's ground is still the diorama's drawing: the drive's medians,
  fountain and sign are from his photos, but where the map's two lanes and
  the small loop at Medical Plaza run exactly is approximated (the map's
  service roads inside the drive are clipped). Ask whether it matches.
- Medical Plaza's door wall (the street side) and the café either side of
  it are placed, not known.
- Domain weights on the cards are 9/25/9/45/12; the CoreCHI blueprint is
  22/22/22/15/19 (Ethics, Encounter, Terminology, US Systems, Culture). Ask.
- Into the app: `campus3d/` (`gen.py --app`) and the card's pictures
  (`builddiorama.cjs`, `city/`) still show the old campus. Wiring this in is
  its own pull request once Jose OKs the look.
- Map data © OpenStreetMap contributors (ODbL): the credit is on the page.
