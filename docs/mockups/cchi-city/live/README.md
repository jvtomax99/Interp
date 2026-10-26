# Campus, live 3D (the iPhone test)

Step a. of the campus plan (`docs/PLAN.md`): the diorama drawn live with
three.js, to decide whether the app's campus moves from pre-rendered
pictures to live 3D. Published as a private Artifact for Jose to open on his
iPhone: https://claude.ai/artifact/NeozEx9yxi91dfJQscPDxX

- `gen.py <out.html>`: takes `../diorama.html` up to its capture pipeline,
  points three.js at jsDelivr (three@0.160.0), drops the post-processing,
  shadow map 2048, and appends `runtime.js` inside `shell.html`.
- `runtime.js`: merges the scene into one mesh per building and material
  look (about 120 draws, from thousands of meshes), a clip height per
  building (floors rise; scaffolding and a crane at the top of what's
  built), the time of day (blended keys: night, morning, noon, golden hour,
  dusk; windows lit at night), movers, drag to spin and pinch
  (OrbitControls), tap a building to lift it, badges that move apart, a
  frame meter.
- `livecheck.cjs`: loads the page at iPhone size in headless Chromium with
  three.js from `../node_modules` (run from the scratch folder holding
  `live/campus-live.html`); SwiftShader has no GPU, so its fps means
  nothing, the phone's does.
