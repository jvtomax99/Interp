# 3D Body (Human Atlas)

The **3D Body** tool in the Hub (Tools & Reference) is this folder: a built
copy of **Human Atlas**, an interactive 3D anatomy viewer by ashemag.

- Source: https://github.com/ashemag/human-atlas, commit `1c38bf3` (2026-09-06)
- Their live demo: https://human-atlas-seven.vercel.app
- App code: MIT licence, `LICENSE` in this folder (keep it).
- Anatomy data: BodyParts3D 4.0, © The Database Center for Life Science,
  **CC BY 4.0**. The credit must stay visible: it is in the viewer's
  "Source & credits" panel and in `ATTRIBUTION.md`.

## It is walled off from the Hub

The code was written outside the team, so it runs with no access to the Hub:

- `index.html` (`anatomySync()`) opens it in an `<iframe>` with
  `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`.
  **Never add `allow-same-origin`** — with it the viewer could read the Hub's
  sign-in, saved data and page.
- `vercel.json` sends the same sandbox as a `Content-Security-Policy` header
  on everything under `/atlas/`, so it is walled off even when opened on its
  own. It also sends `Access-Control-Allow-Origin: *` (a sandboxed frame has
  no origin of its own, so it needs this to load its files) and a one-year
  `immutable` cache for `assets/` and `models/`.
- `sw.js` does not touch `/atlas/` (a sandboxed frame cannot use the service
  worker anyway). The browser's own cache holds the models after the first
  visit.

## What changed from the original

Small changes, to run from `/atlas/` instead of a site root and to make the
body easier to see:

- `app/page.tsx`: `fetch('/models/atlas.json')` → `fetch('models/atlas.json')`
- `vite.config.ts`: `base:'./'`
- `web/index.html`: relative favicon; title "3D Body · Human Atlas"
- `models/atlas.json`: chunk paths made relative (`models/body-N.bin.gz`)
- `app/scene.tsx`, for easier viewing (Jose): transparent canvas
  (`alpha:true`, clear colour alpha 0) so a dark stage shows through; the
  floor, platform and two rings are no longer added to the scene; and
  `controls.maxPolarAngle=Math.PI`, so the camera can look straight up at
  the soles of the feet.
- `app/globals.css`: blocks appended at the end — the dark navy stage, light
  text for what sits straight on it, solid white panels, a visible track on
  the explode slider (it drew 0px tall), and a phone layout (under 768px):
  no big title, one row of controls at the top, a slim dock, a short card
  where the dock was when a part is tapped, one Reset and one About, and
  `touch-action` so a pinch on the controls can't zoom the whole Hub.
- `app/orbit-controls.js`: three.js r159's OrbitControls (MIT), copied so a
  pinch zooms toward the point between the fingers (marked "Interpreter
  Hub"); `scene.tsx` imports it and turns on `zoomToCursor`, which also makes
  the mouse wheel zoom toward the pointer. `app/orbit-controls.d.ts` borrows
  three's types for it.
- `app/scene.tsx`, phones: the camera leaves room for the new top row and
  dock (170px instead of 350px), so the body fills about 60% of the screen
  instead of 40%; Isolate frames the part below the top row.
- `app/page.tsx`: `has-detail` on `<main>` while a part's card is open.
- Only the gzip models are shipped (33 MB); the raw `.bin` copies (another
  58 MB) are only used by browsers without `DecompressionStream`
  (iOS before 16.4), which then show "An anatomy file could not be loaded."

## Rebuilding (only to take a newer version)

Needs Node 22.13+.

```sh
git clone https://github.com/ashemag/human-atlas && cd human-atlas
git apply ../Interp/atlas/hub-changes.patch   # every source change below
# (models/atlas.json also needs its chunk paths made relative), then:
npm ci && npm run build
```

Copy `dist/index.html`, `dist/assets/`, `dist/favicon.svg`,
`dist/ATTRIBUTION.md`, `dist/models/atlas.json` and `dist/models/*.bin.gz`
here, with `LICENSE`. Because `models/` is cached for a year, **put changed
models under a new folder name** (and point `atlas.json` at it) or returning
phones keep the old ones.
