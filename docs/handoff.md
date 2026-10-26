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

**The campus, alive and interactive (`docs/PLAN.md`, Next 2).** Jose picked all
seven ideas (2026-10-26). Step a. is under way: a live 3D test page on his
iPhone, https://claude.ai/artifact/NeozEx9yxi91dfJQscPDxX (source and how to
rebuild it: `docs/mockups/cchi-city/live/README.md`; publish the output of
`gen.py` with the Artifact tool to the same URL). Version 3 has: spin and pinch,
tap a building to lift it, time of day on his clock (windows lit at night),
floors rising with scaffolding and cranes, a smiling sun that becomes a sleepy
moon at night (tap it: it giggles), cherry blossoms with falling petals.
His first run (version 1, screen recording) held a steady 29-30 fps: "choppy".
Versions 2-3 draw shadows only on change and start at 1.5x sharpness. **Waiting
on his fps reading of version 3.** If it's smooth: step b (live 3D in the app,
pictures as the fallback). If not: make it lighter, or the picture route.
He also asked (done in `diorama.html`, not yet in `city/`): cherry trees off
the street, blossoms in the garden and along the front. Rebuild the pictures
(`builddiorama.cjs`) before opening the campus-alive change.

## Before (the last chat's changes and where each stands)

- **#157, the campus as a floating diorama** (old campus colours at
  golden hour, progress as paint, corner view): GitHub's checks passed;
  **waiting for Jose's "push"**.
- **The campus from OpenStreetMap** (third chat, 2026-10-26): five buildings
  sized and placed from the map, JTCC is Encounter; pictures rebuilt, campus
  suites and guide pass; on `claude/campus-alive`.
- **Branch `claude/campus-alive`**, built on #157, no change opened yet:
  lights back, flickering lit windows on painted floors, cranes until a
  building is done, people about, the paint rising after practice (new
  suite `campus-alive.cjs`), plus the screenshot fixes (red-brick HMH tower,
  the dark stepped building as Culture). All campus suites and the guide
  pass. **Next step:** once #157 is merged, merge `main` into it and open
  its change for Jose.
- Not measured: smoothness on an iPhone with this much moving (the
  smoothness meter at the bottom of More).
