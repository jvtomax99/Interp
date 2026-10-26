# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-26, the third campus chat (#157, #164, #165).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next 2, the campus),
> `docs/handoff.md` and `docs/features/practice-dashboard.md` (the diorama,
> the miniature-world kit, the campus in 3D). Then tell me what's being
> worked on now and the goal, and what was worked on before, in a few short
> lines each, say in 2-3 lines what you'll do next, and wait for my go.
> Plain words, say "working on it" and "done".

## Now

**Campus 3D: Jose's feedback from his phone.** Nothing is open. The campus
in 3D is live (#165, b1026.2227): the **3D** button on the CoreCHI Practice
card opens `campus3d/index.html` full screen (drag to turn, pinch to zoom,
tap a building, "See it finished"). Ask Jose how it feels on his iPhone
(smooth or choppy) and what he wants changed. If it's choppy, the levers are
in `docs/mockups/cchi-city/live/runtime.js` (sharpness steps down under 42
fps; shadows only on change) and `LITE` in `diorama.html` (simpler shapes);
measure the triangles first (about 440k now). After that, `docs/PLAN.md`
Next 2 lists what's left of his seven "alive and interactive" ideas: tap a
person for a term (4), fireworks when a building is finished (5), friendly
weather from the streak (6), and the campus drawn live in the card itself
(step b), which waits on the phone result.

How to change the campus: the scene is `docs/mockups/cchi-city/diorama.html`.
Pictures for the card: `node builddiorama.cjs <outdir>` (~10 min; copy the
`.webp` files to `city/`, paste `entrance.json` over `CAMPUS_MAP` in
`features/campus.js`; `sky.webp` alone: `window.__sky`). The 3D page:
`python3 docs/mockups/cchi-city/live/gen.py --app` (writes `campus3d/`;
needs `npm install --no-save three@0.160.0` in `docs/mockups/cchi-city`).
The iPhone test page (Artifact https://claude.ai/artifact/NeozEx9yxi91dfJQscPDxX):
`gen.py <out.html>`. Playwright in this container: link
`tests/node_modules/playwright` to `/opt/node22/lib/node_modules/playwright`.
Checks: `cd tests && node run.cjs campus-3d campus-pick campus-alive campus-life campus-depth guide`.

## Before (this chat's changes, all live)

- **#157** the campus as a floating diorama (b1026.2005).
- **#164** the real HUMC layout from OpenStreetMap, JTCC as Encounter, the
  entrance sign in the median, the tall brick building behind Ethics,
  Medical Plaza in brick, the miniature world (trees, flower beds, cute
  people, entrances, pond fountain), soft daylight, no cranes (b1026.2044).
- **#165** the campus in 3D, full screen (b1026.2227).
- Lessons: GitHub's journey step "Term Review on 5" and a WebKit browser
  crash in `dock-tuck` each failed once on a PR while passing on the same
  code elsewhere; one re-run cleared them (PR comments say so).
