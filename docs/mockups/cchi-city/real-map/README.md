# Campus on the real map (preview, 2026-10-27)

Jose's ask: make the campus match the real HUMC campus, front and back. The
**front** stays the hand-built diorama (`../diorama.html`: Prospect Ave, the
drive, Jurist, Link Pavilion, Medical Plaza, the lot, the café). **Behind and
beside it**, every building, street, lot and garage comes from his
OpenStreetMap export (`map.osm.xml`), at the front's own scale. Not in the app
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
- `build.py`: drops the diorama's guessed back buildings (brick tower, long
  buildings, blue glass, Theurer at the back right), adds `back.js`, and
  changes the runtime for a board twice as wide and deep (shadows over the
  whole board, two-finger pan with the target kept on the board, outline
  halos on the real footprints, badges kept on screen, the garden moved).

## The fit (`scene_export.py`)

Map turned 112 deg so Prospect runs across the front, 9 m to a unit, then
scaled 2.1 and moved so the drive's mouth, Jurist and Medical Plaza land on
the diorama's (about 4.3 m to a diorama unit; it was 9 m in the first
real-layout try, which made the front look small). `FRONT` is what the
diorama builds by hand: map buildings and streets inside it are clipped.
Floors are not in the map; they are read off Jose's Google 3D flyover.

## Decisions (Jose, 2026-10-27/28)

- Front as it is + the real back, at true scale on a bigger board (his pick
  over squeezing the back or rebuilding the front on the map).
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
- The pavilion's floors are 1.3x a normal floor so it towers over Imus as
  in his window photo.

## Open

- His frame-rate reading on the iPhone (about 480k triangles; the live page
  is 440k). The back's windows have no frames and its trees are lighter to
  keep it close.
- Skybridges in his photos: which buildings they join is unknown; ask.
- The ambulance still drives to the bay on Link Pavilion's side, not the
  real ED (Creamer) on Atlantic Street.
- Domain weights on the cards are 9/25/9/45/12; the CoreCHI blueprint is
  22/22/22/15/19 (Ethics, Encounter, Terminology, US Systems, Culture). Ask.
- Into the app: `campus3d/` (`gen.py --app`) and the card's pictures
  (`builddiorama.cjs`, `city/`) still show the old campus. Wiring this in is
  its own pull request once Jose OKs the look.
- Map data © OpenStreetMap contributors (ODbL): the credit is on the page.
