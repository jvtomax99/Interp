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

**Done 2026-10-26 (third campus chat): the campus laid out from OpenStreetMap.**
`api.openstreetmap.org` answers (Jose allowed it). The five buildings take their
sizes, heights and places from the map outlines; Encounter is now John Theurer
Cancer Center (Jose's pick); details in `docs/features/practice-dashboard.md`.
Pictures rebuilt, campus suites + guide pass, all on `claude/campus-alive`
(commit 45c64c2). Guesses Jose couldn't confirm: Jurist = the building on the
left, the rust tower and the blue glass building = Helena Theurer Pavilion.

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
