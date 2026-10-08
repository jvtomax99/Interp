# 3D Body (Human Atlas)

The **3D Body** tool in the Hub (Tools & Reference) is this folder: a built
copy of **Human Atlas**, an interactive 3D anatomy viewer by ashemag.

- Source: https://github.com/ashemag/human-atlas, commit `1c38bf3` (2026-09-06)
- Their live demo: https://human-atlas-seven.vercel.app
- App code: MIT licence, `LICENSE` in this folder (keep it).
- Anatomy data: BodyParts3D 4.0, © The Database Center for Life Science,
  **CC BY 4.0**. The credit must stay visible: it is in the viewer's
  "Source & credits" panel and in `ATTRIBUTION.md`.

## The bilingual card (Interpreter Hub)

Tapping a structure opens a card: English name, Spanish name under it, a
speaker for each, one or two sentences on what it is, then **Open
glossary**, **Practice this term** and **Ask Dr. Smiley**, and the sources.

- **`hub-catalogue.json`** (this folder) is the card text: 30 structures, each
  with its FMA concept id (the ids BodyParts3D uses), English and Spanish
  names, an explanation, optional `enAlt` everyday names and `esNote`, and
  the sources that support each part (`supports`: `en`, `es`, `about`).
  Spanish names and explanations were checked against the Clínica
  Universidad de Navarra medical dictionary; English against the National
  Cancer Institute (SEER Training Modules, Dictionary of Cancer Terms) and
  MedlinePlus. That is separate from the geometry credit (BodyParts3D).
  `glossaryTermId` stays `null` unless a teammate confirms the exact
  glossary entry; the Hub otherwise matches by exact name.
- **Edit the file to change a card; no rebuild.** The viewer and the Hub
  both read it when the 3D Body opens. Don't add a structure without a
  source for its Spanish name: a structure that isn't listed shows
  "Spanish name not added yet" and its system text labelled "About this
  body system", never a borrowed description.
- Which card a tap opens: the piece's own concept (or one side of a pair:
  right/left kidney), else, for structures marked `members` (heart, liver,
  lungs...), a piece of exactly one of them. A piece in two of them (the
  ileocecal junction) opens no card rather than a guess.
- The viewer and the Hub talk only through `postMessage`
  (`app/hub.ts`; `atlasOnMessage()` in the Hub's `index.html`). The viewer
  can say "ready", which card is showing, and which card button was tapped.
  The Hub accepts a message only from the frame on screen, with the opaque
  origin a sandboxed frame has, of the agreed shape, with an allowed action
  and a structure in its own copy of the catalogue. It never uses text,
  addresses or commands from the frame. It answers with whether its
  glossary has the structure, and, when you come back from a Hub tool,
  your place (structure, camera, layers, card size), kept in memory only.

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
- `app/hub.ts`, `app/hub-card.tsx` (new), `app/page.tsx`, `app/scene.tsx`,
  `app/anatomy.ts`, `app/globals.css`: the bilingual card above, in place
  of the old detail panel (which showed the system's description as if it
  explained the structure). `scene.tsx` can report and restore the camera,
  and frames Isolate around the card.
- Only the gzip models are shipped (33 MB); the raw `.bin` copies (another
  58 MB) are only used by browsers without `DecompressionStream`
  (iOS before 16.4), which then show "An anatomy file could not be loaded."

## Rebuilding (only to take a newer version)

Needs Node 22.13+.

```sh
git clone https://github.com/ashemag/human-atlas && cd human-atlas
git checkout 1c38bf3
git apply ../Interp/atlas/hub-changes.patch   # every source change below
# (models/atlas.json also needs its chunk paths made relative), then:
npm ci && npm run build
```

Copy `dist/index.html`, `dist/assets/`, `dist/favicon.svg`,
`dist/ATTRIBUTION.md`, `dist/models/atlas.json` and `dist/models/*.bin.gz`
here, with `LICENSE`. `hub-catalogue.json` is not part of the build: it
lives only here, so keep it when replacing the rest. Because `models/` is
cached for a year, **put changed models under a new folder name** (and
point `atlas.json` at it) or returning phones keep the old ones.
