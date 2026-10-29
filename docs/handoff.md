# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-10-29,
the campus chat (Blender card, real campus in 3D, Helena Theurer's height, the audit).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next 2, the campus, "make the campus act like real life"),
> `docs/handoff.md` and `docs/mockups/cchi-city/real-map/README.md` ("The card's pictures", "The audit"). Work on
> branch `claude/campus-traffic`. Tell me what's being worked on now and what was worked on before, in a few short
> lines, then start prompt 2 (traffic). Plain words, say "working on it" and "done".

## Now: prompt 2 of 4, traffic

Jose's prompts, in order (2026-10-29), each its own change:
1. Audit every moving thing. **Done, live** (#173, b1029.1532).
2. **Traffic: done in 3D** (2026-10-29, `claude/campus-traffic`, waiting for Jose's push; `real-map/traffic.js`, README "Traffic"). Was: "Make the cars drive like real traffic: stay in the right-hand lane, follow the real direction of
   each street, slow down and stop at stop signs and crosswalks, turn on curves instead of sliding sideways, and never
   overlap each other. Use the map data for which streets are one-way."
3. **People: done in 3D** (2026-10-29, `real-map/people.js`, README "People"). Was: sidewalks, crosswalks, real doors, waiting at the ER and main entrance, pairs, wheelchairs, standing and
   talking; never through walls, cars, trees or each other.
4. **Buildings (next):** checked against the real campus (height, floors, doors, garage entrances, bridges), with sources.

Where things are:
- The live scene's motion: `life(t)` in the built page; its movers and paths are set in
  `docs/mockups/cchi-city/real-map/build.py` (block "the audit's fixes" and the rounds after it; `along()` gives
  position and heading on a polyline). The street cars: `STREET` (Prospect), `BACKCARS` (2nd St, Atlantic B, Essex;
  paths from `scene.json` `paths`, made by `scene_export.py` from the OSM export, which has the one-way tags).
- Checker: `node audit.cjs campus.html out.json` (`MAP=map.png` for the picture). What it still flags: a car and a
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
