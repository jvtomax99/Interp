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

Only what it takes to run from `/atlas/` instead of a site root:

- `app/page.tsx`: `fetch('/models/atlas.json')` → `fetch('models/atlas.json')`
- `vite.config.ts`: `base:'./'`
- `web/index.html`: relative favicon; title "3D Body · Human Atlas"
- `models/atlas.json`: chunk paths made relative (`models/body-N.bin.gz`)
- Only the gzip models are shipped (33 MB); the raw `.bin` copies (another
  58 MB) are only used by browsers without `DecompressionStream`
  (iOS before 16.4), which then show "An anatomy file could not be loaded."

## Rebuilding (only to take a newer version)

Needs Node 22.13+.

```sh
git clone https://github.com/ashemag/human-atlas && cd human-atlas
# re-apply the changes listed above, then:
npm ci && npm run build
```

Copy `dist/index.html`, `dist/assets/`, `dist/favicon.svg`,
`dist/ATTRIBUTION.md`, `dist/models/atlas.json` and `dist/models/*.bin.gz`
here, with `LICENSE`. Because `models/` is cached for a year, **put changed
models under a new folder name** (and point `atlas.json` at it) or returning
phones keep the old ones.
