# CCHI City (mockup, 2026-10-19)

Jose's ask: make CoreCHI Practice "look like a game", inspired by an
isometric "Note Maker City" picture. Picked: CCHI City, at the top of
CoreCHI (replacing the navy readiness card as the hero), pre-rendered 3D
(real 3D models drawn ahead of time into images; no live 3D engine on the
phone). Then: "make it look like Hackensack University Medical Center" —
he will send 3-6 photos of campus buildings to model from.

- `city.html`: the three.js scene (own low-poly models: towers, roads,
  trees, cars, slab). Needs `npm install three@0.160.0` beside it (not
  committed). URL params: `zoom`, mastery per district `e n t s c` (0-1).
- `shoot.cjs`: renders it headless (`node shoot.cjs "zoom=12.9" out.png`),
  prints district label positions.
- `mock.html` / `mock.png`: the phone mockup (labels, Dr. Smiley bubble,
  Play / Exam sim buttons). `city2.png`: the raw render.

Design: districts = the 5 CCHI domains; building height = mastery; trees =
streak; cars = questions due; Dr. Smiley stands at the weakest district;
tap a district to practise it. Next: model HUMC buildings from Jose's
photos, then build it in (sprites per district per height, composited in
CSS), User Guide, tests.

## HUMC version (2026-10-19, from Jose's 4 campus photos)

`humc.html` (render with `node shoot2.cjs "e=.64&n=.54&t=.24&s=.64&c=.63" out.png`;
`=1` everywhere for the finished campus). Domain → building:
Ethics → main hospital, 30 Prospect Ave (brick, cream bands, glass crown with
the HMH mark); Encounter → Helena Theurer Pavilion (9 stories: 3-storey base +
white/glass tower; ENR/Becker's); Terminology → John Theurer Cancer Center,
92 Second St (5 stories, glass rotunda in a white frame, brick wing with sun
shades, flags, skybridge; Tradeline 2010); US Systems → the patient pavilion on
the circle (porte-cochère); Culture → Children's (white panels, teal glass,
running kids, cherry trees). Circle drive with fountain, parking deck.
Mastery = floors built; the rest is orange scaffolding with a crane.
Footprints are from the photos, not survey data: OpenStreetMap (Overpass) and
most sites are blocked from this container.

## Warm twilight + depth (F3, 2026-10-20)

`entrance.html` tags the sky, the town and the skyline `FAR`; `buildentr.cjs`
writes them as `sky.webp` (the back layer) and cuts them out of
`entrance.webp`. Lighting: dusk with a warm horizon, a warm ground bounce
and a warm rim (`rim`). Needs `npm install --no-save three@0.160.0` here.
Fast re-render reusing the lit windows: `NOLIT=<old manifest json> node
buildentr.cjs <out>` (~1 min), then copy the files into `city/` and paste
`entrance.json` as `CAMPUS_MAP` in `index.html`.
