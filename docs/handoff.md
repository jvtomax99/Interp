# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-24, from the chat that ran #139 to #143.
Dr. Smiley's full-body animation runs alongside on branch
`claude/dr-smiley-body-home`, with its own handoff there:
`docs/handoff-dr-smiley.md`.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> tell me what's being worked on now and the goal, and what was worked on
> before, in a few short lines each, say in 2-3 lines what you'll do next,
> and wait for my go. Plain words, say "working on it" and "done".

## Now

The split of `index.html` (`docs/split-index.md`), phase 3, small pieces
first (Jose's pick, 2026-10-24), one change at a time, each merged on his
"push". Next: the guide's front page ("The guide: installing, the front
page", 11 KB), then the doctor sheets, CSV, duplicate doctors, the
backfill. After those: Ask the Hub's group and Dr. Smiley's engine, as
groups, or they stay.

## Before (this chat, all live)

- #138 the last handoff, merged.
- #139 the campus -> `features/campus.js` (b1024.1553). Its Escape listener
  moved with it: no earlier keydown listener stops the event or touches
  the campus.
- #140 3D Body's resize listener read `activeCategory` before it existed
  (a resize during load): guarded with `typeof`; new suite
  `load-order.cjs` holds that gap open (b1024.1804).
- #141 False Friends' screen -> `features/false-friends.js` (b1024.1920).
  Its census section also held the Practice screen; that half stayed
  inline under a new banner.
- #142 rule: always a phone notification when a change is ready for
  Jose's push (docs).
- #143 your knowledge brain's Hub side -> `features/knowledge-brain.js`
  (b1024.2150).

Open: only this handoff's change (docs only). No check-ins armed.

## The method (worked eight times)

1. List the section's top-level statements with acorn (`tests/node_modules`
   has acorn only; if missing, `cd tests && npm ci`, then delete
   `node_modules/playwright*` or the preinstalled browser is not found).
   Check the section really is one feature: a census section can hold two
   (#141). Anything that runs at load must not read `index.html`'s names
   until it has run (load-order.cjs).
2. Cut banner to last line into `features/<name>.js` under the header
   comment the others use; pointer comment in its place; script tag after
   the last `features/` line; `sw.js` precache.
3. `node tools/brain-data.cjs` (drop the section from GROUPS if listed),
   `node tools/census.cjs --write`.
4. Proof: rebuild the old `index.html` byte for byte; a browser probe in
   both checkouts (`ROOT=` a worktree of `main`) of the feature's output
   and `Object.keys(window)` (seed timestamps and animation frames
   differ; strip them); the suites that cover it on both; all suites;
   `first-paint.cjs` (`ROOTS=before,after RUNS=5`).
5. Docs: `AGENTS.md` and `CLAUDE.md` tables and file map, the feature
   note, `docs/split-index.md`, `docs/PLAN.md`.
6. PR, wait for GitHub's checks, phone notification, merge on "push",
   confirm the bump commit and Vercel "Deployment has completed".

## Not proven / open

- humc-brain's double-tap checks fail now and then under load (seen on
  `main` too, 2026-10-24); not investigated.
- Each moved file: first paint within noise so far; real HTTP/2 on Vercel
  unmeasured.
