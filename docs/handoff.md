# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-28, the real-map campus chat (claude.ai,
moved into this repo as `claude/campus-real-map`), updated by the chat that
rebuilt the front on the map.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next 2, the campus),
> `docs/handoff.md` and `docs/mockups/cchi-city/real-map/README.md`. Then
> tell me what's being worked on now and the goal, and what was worked on
> before, in a few short lines each, say in 2-3 lines what you'll do next,
> and wait for my go. Plain words, say "working on it" and "done".

## Now

**The CoreCHI Practice card's pictures, made in Blender from the real-map campus.** Branch
`claude/campus-card-blender` (off `claude/campus-real-map`, PR #167, the preview source). Plan:
`docs/PLAN.md`, Next 2, "the card's pictures from Blender" (steps 1-4 and Jose's picks). Jose
OK'd the look from two mock-ups (whole board from the card's angle, finished and in progress).

What exists: `docs/mockups/cchi-city/real-map/toy_render.py` (Blender: toy plastic, rounded edges,
soft sun, AgX, depth of field; `VIEWS=card`, `CARD_DIST=235`, `PROGRESS="e:0.8,..."`),
`export_glb.cjs` (the built preview's scene to GLB in headless Chromium). Blender in this
container: `pip download bpy` (5.0.1, cp311 wheel), `uv venv --python /usr/bin/python3.11`,
`uv pip install` the wheel; renders ~100 s per 1 MP at 96 samples on 4 CPUs.

How the card works now: `features/campus.js` (`CAMPUS_MAP` manifest, `renderCampus`), the
motion `campusLife`/`campusDepth` in `index.html` ("Practice dashboard motion"), pictures in
`city/` (1.8 MB, ~150 files) made by `docs/mockups/cchi-city/builddiorama.cjs` from
`diorama.html`'s capture pipeline (`window.__run`: `alone()` renders one object with the rest as
depth, `path()` projects a 3D path, `pack()` crops). That pipeline is cut out of the live page
(`live/gen.py`), so the preview page has the moving objects (CAR_IN, CAR_OUT, CAR_IN2, AMB,
HELI, STREET, WALKS, SITTERS, BIRDS, IDLE, FLAGS, CLOUDS, spray) but not the capture code.
Suites: `tests/suites/campus-{pick,alive,life,depth,3d}.cjs` (life expects bay and lot).

Idea for the build: Blender for near/paint/glow (passes: painted, clay, object-id, height,
lit windows; each building's paint = id mask x height cut, cropped), three.js on the preview
page for the moving sprites with the identical camera (fov 18.77 vertical, 960 x 840 at 2x, no
view offset; Blender sensor fit vertical; three.js (x,y,z) = Blender (x,-z,y)).

## Before

- **#157** the campus as a floating diorama; **#164** the real HUMC layout
  around the entrance; **#165** the campus in 3D, full screen; the time of
  day with the real sun over HUMC (`claude/campus-time`). All live.
- **This chat (claude.ai):** the real-map preview above, built step by step
  with Jose from his map export, his Google 3D flyover and his photos (Street
  View at 77 2nd St, his window at Theurer); moved into the repo here.
