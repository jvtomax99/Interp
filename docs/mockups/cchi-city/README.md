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
