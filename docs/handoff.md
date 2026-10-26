# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-26, the campus diorama chat.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md`, `docs/handoff.md` and
> `docs/features/practice-dashboard.md` (its top section, the floating
> diorama). Then tell me what's being worked on now and the goal, and what
> was worked on before, in a few short lines each, say in 2-3 lines what
> you'll do next, and wait for my go. Plain words, say "working on it" and
> "done".

## Now

**The campus from real building outlines.** Jose allowed
`overpass-api.de` (OpenStreetMap) in the environment's network settings on
2026-10-26; it did not reach the chat that was already open, so check it
first: `curl -sS -o /dev/null -w "%{http_code}" https://overpass-api.de/api/status`
should print 200. Goal: lay the campus out from OpenStreetMap's building
outlines (and heights where tagged) around Hackensack University Medical
Center's main entrance, 30 Prospect Ave, Hackensack NJ, the drive off the
street with the keyhole fountain median, keeping the diorama style (floating
board, corner camera, golden-hour colours). OpenStreetMap is ODbL: credit
it ("© OpenStreetMap contributors") in the scene's notes and the User Guide
answer. Google Maps can't be used (its terms; the container can't reach it);
Jose's Google Maps screenshots (in the old chat) are reference only.
From his screenshots, still to do: the dark stepped building right of the
drive has a big dark block with a white rooftop section on top of its
tiers; behind, a long blue glass building, the old brick building with rows
of windows, a white tower. Ask him before moving any building's role
(which exam area it is).

How the scene is built: `docs/mockups/cchi-city/diorama.html` (three.js) +
`builddiorama.cjs` (`npm install --no-save three@0.160.0` in that folder,
`tests/node_modules` for Playwright; on this container the test Playwright
needed linking to the global one: `ln -s /opt/node22/lib/node_modules/playwright tests/node_modules/playwright`).
`node builddiorama.cjs <outdir>` takes ~10 min; copy `<outdir>/*.webp` to
`city/` and paste `<outdir>/entrance.json` over the `CAMPUS_MAP` line in
`features/campus.js`. Badge points are hand-set per camera (`LABEL_2D`).
Checks: `cd tests && node run.cjs campus guide`.

## Before (the last chat's changes and where each stands)

- **#157, the campus as a floating diorama** (old campus colours at
  golden hour, progress as paint, corner view): GitHub's checks passed;
  **waiting for Jose's "push"**.
- **Branch `claude/campus-alive`**, built on #157, no change opened yet:
  lights back, flickering lit windows on painted floors, cranes until a
  building is done, people about, the paint rising after practice (new
  suite `campus-alive.cjs`), plus the screenshot fixes (red-brick HMH tower,
  the dark stepped building as Culture). All campus suites and the guide
  pass. **Next step:** once #157 is merged, merge `main` into it and open
  its change for Jose.
- Not measured: smoothness on an iPhone with this much moving (the
  smoothness meter at the bottom of More).
