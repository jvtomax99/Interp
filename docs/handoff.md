# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-05,
the campus chat after the feel audit (the building check redone, the celebration).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next, items 0-2) and `docs/handoff.md`. Tell me what was worked
> on before and what is next, in a few short lines. If I have pasted my phone's meter numbers or the five phone
> screenshots the feel audit asks for (`docs/feel-audit.md`), read them against it and say what they change;
> otherwise ask for them once and move on to the next campus piece: ask me which (tap a person for a term, or
> friendly weather for a streak), write its spec note and wait for my go. Plain words, say "working on it" and
> "done". "Push" is always a button.

## Now: nothing in flight; the next campus piece is Jose's pick

Goal of the campus work (`docs/PLAN.md`, item 2): your HUMC campus on the CoreCHI Practice card, alive and
interactive. Done so far in 2c: the celebration (#213). Left in 2c, one PR each, Jose picks the order:

- **4, tap a person:** a passer-by tapped gives a glossary term to render, counted as practice; the tap area bigger
  than the figure. Spec note first (his rule), with "not in this version".
- **6, friendly weather:** sun and a rainbow for a study streak; never snow for a missed day. Spec note first.
- Not next: 2b (the card drawn live in three.js) is argued against in this chat: the 3D button already does it.

Still owed by Jose (asked once per chat, then move on): the five phone screenshots (Ask the Hub and Team access
with the keyboard up; a doctor's page; the doctor list's A-Z strip; a toast), the meter's Copy numbers (More,
bottom) for four runs (open right after a deploy, open with nothing new, Home left alone 30 s, one slow scroll of
Home), and which iPhone and iOS. Also his call on the hello's canvas drawing (options under Phase 2 in
`docs/feel-audit.md`; leaving it is a fair answer).

## Where things stand

- **#210, live b1104.2338:** the campus buildings checked against sources (#176 redone on today's main: Medical
  Plaza 12 floors to 9, Jurist 6 to 5, Child Care 2 to 4, the utility plant 5 to 4; garage gates where the map's
  driveways meet the walls), the card's pictures rendered again with today's pipeline, `campus3d/` rebuilt. #176
  closed as replaced. Sources and the unproven list: `docs/mockups/cchi-city/real-map/README.md`, "The buildings,
  against sources".
- **#213, live b1105.0959:** the campus celebration. A building at 100% (every question known) gets three fireworks
  around its badge after the paint's last climb, a gold Finished ribbon for that visit, its badge gold with a star for
  good; once per phone (`ih_campusDone`), the gold off and forgotten under 100%, a first visit only draws the gold.
  Spec and as-built: `docs/features/campus-celebration.md`. Checks in `campus-alive.cjs`. The guide's practice answer
  has the sentence; New lately: the celebration, Places (#212, another tool), the memory trainer.
- Open changes: none. Check-ins: none. Nothing waits on Jose except the items above.

## Learned this chat (not in the docs elsewhere)

- **Blender in a cloud session:** `pip install bpy` on Python 3.13 gives Blender 5.2 and the card pipeline runs on
  it unchanged (the README still says 3.11 and bpy 5.0.1; both work). The capture takes about 6 min in software GL
  (`--use-angle=swiftshader`), the render 12.5 min on 4 CPUs at 96 samples, the build 1.5 min. The pipeline's
  outputs (`campus.html`, `cap/`, `renders/`, `out/`) are ignored by `real-map/.gitignore` now; `three@0.160.0`
  goes in `docs/mockups/cchi-city/` with `npm install --no-save`.
- **A stale picture PR can't be rebased:** `city/` is rewritten whole by every render, so a PR that re-rendered it
  clashes with any later render on main (all 130 files). Redo the scene change on main and render again, as #210
  did; don't try to merge pictures.
- **The force push is refused here** (the auto mode's rule), so a redone branch gets a new name and a new PR; the
  old PR is closed on Jose's push.
- **`frame-meter.cjs` can go red on a busy runner:** it injects a 400 ms busy loop and expects a frame of 300 ms or
  more; GitHub's shared machine once split it (283 ms). The same commit passed in its parallel run; one re-run of
  the failed job was green. Not the change's; if it recurs, make the check read the busy loop's own length.
- **The tests' Playwright in a cloud session:** `tests/npm install` once, then every run with
  `NODE_OPTIONS="-r <preload>"` where the preload patches `chromium.launch` with
  `executablePath: '/opt/pw-browsers/chromium'` (the preload used here: a `Module.prototype.require` wrapper on
  `playwright`). A background `cd tests && node run.cjs` sometimes starts in the repo root instead; use
  `(cd tests && node run.cjs ...)`.
- **A suite that boots with seeds and reads after `L.go`** can see a second drawing of the Practice screen (it
  settles in more than one render): seed again and call `renderContent()` once before reading, as the campus-alive
  cases do.
- **Container query units for sprite throws:** `.cp-fire` is `container-type:size` so its sparks fly `cqw` units,
  the same share of the card at every size. iOS 16+.
- Blocked hosts met this chat: `blog.duolingo.com`, `support.apple.com` (for the celebration's research). To let
  a chat read them: Network access, Allowed domains, one per line.
