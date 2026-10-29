# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-10-29,
the campus chat (Blender card, real campus in 3D, Helena Theurer's height, the audit).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next 2, the campus, "make the campus act like real life"),
> `docs/handoff.md` and `docs/mockups/cchi-city/real-map/README.md` ("The card's pictures", "The audit"). Work on
> branch `claude/campus-traffic`. Tell me what's being worked on now and what was worked on before, in a few short
> lines, then start prompt 2 (traffic). Plain words, say "working on it" and "done".

## Now: prompt 4 of 4, the buildings

Jose's prompts, in order (2026-10-29), each its own change:
1. Audit every moving thing. **Done, live** (#173).
2. Traffic. **Done, live** (#174, b1029.1847): `real-map/traffic.js`, README "Traffic".
3. People. **Done, live** (#175, b1029.2338): `real-map/people.js`, README "People".
4. **Buildings (next):** every building checked against the real campus: height, floors, doors, garage entrances,
   bridges, with sources (primary ones: HMH pages, permits, news of openings; Wikipedia alone is not enough). Report
   what changes and what can't be proven.

Open from 2 and 3: the stop signs on Atlantic at Prospect and at the drive's exit are assumed (the map has none; the one
at Atlantic and 2nd is from Jose's photos); the walk from Jurist's walk across the drive-through's mouth to Link has no
crosswalk in the scene (Jose to say if there is a real one); a paved apron overlaps 2nd Street at x -31.5; the card
(`city/`) still plays fixed paths (re-render only if Jose asks).

Where things are:
- The live scene's motion: `life(t)` in the built page; its movers and paths are set in
  `docs/mockups/cchi-city/real-map/build.py` (block "the audit's fixes" and the rounds after it; `along()` gives
  position and heading on a polyline). The street cars: `STREET` (Prospect), `BACKCARS` (2nd St, Atlantic B, Essex;
  paths from `scene.json` `paths`, made by `scene_export.py` from the OSM export, which has the one-way tags).
- Checkers: `node traffic_check.cjs campus.html 300` (cars and people, all zero on 2026-10-29); `node audit.cjs campus.html out.json` (`MAP=map.png` for the picture). What it still flags: a car and a
  person meeting at a crosswalk or corner (cars must give way: that is prompt 2), two walkers passing at a corner.
- In 3D (`campus3d/`, `python3 build.py --app`) things move live, so giving way, stopping and queueing are possible
  there. The card (`city/`, Blender, `card_capture.cjs` + `card_render.py` + `card_build.py --install`, ~40 min)
  only plays fixed paths: a car's sprite has one heading per leg, so turns are cut between legs.
- Blender here: `pip download bpy==5.0.1 --no-deps --python-version 3.11 --only-binary=:all:`, a 3.11 venv
  (`uv venv --python /usr/bin/python3.11`) with that wheel, numpy and Pillow. three.js: `npm install --no-save
  three@0.160.0` in `docs/mockups/cchi-city/`.
- Gotchas found: Cycles draws coplanar ground layers black (`flat_ground_apart` in `toy_look.py`); a camera
  projection of points goes wrong in the preview (nav.js), so the audit map draws rings in the scene instead;
  `pgrep -f` in a wait loop matches itself.

## Before (this chat, all live)

- #168 the CoreCHI Practice card's pictures rendered in Blender from the real-map campus, every mover re-made.
- #169 the 3D button opens the real campus too (`build.py --app`).
- #170 Helena Theurer Pavilion 9 floors at 1.3x (it was 13 at 1.65x; Jose's pick).
- #173 the audit and its fixes (269 problem spots down to crosswalk meetings).
- Run one headless browser at a time here: two at once got the session killed for memory (2026-10-29).
