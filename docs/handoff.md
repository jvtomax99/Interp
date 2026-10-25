# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-25, from the chat that ran #146 to #152.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md`. Then
> tell me what's being worked on now and the goal, and what was worked on
> before, in a few short lines each, say in 2-3 lines what you'll do next,
> and wait for my go. Plain words, say "working on it" and "done".

## Now

The split of `index.html` (`docs/split-index.md`), phase 3. All the small
pieces are out (the last, the backfill, live b1025.1713); `index.html` is
1.15 MB. What's left are the two groups the census names: Ask the Hub
with Dr. Smiley's conversation, context and memory (7 sections, about
125 KB) and Dr. Smiley's art, engine, performances' wiring, "how lively"
and task states (5 sections, about 78 KB; 12 sections call his task
states). Each would be one bigger change, or they stay inline.

**Open question for Jose (ask with buttons):** move the groups, or stop
the split here. Pick: plan the Ask the Hub group first (a written plan,
no code: which sections, what runs at load, which suites cover it), then
decide. Rerun `node tools/census.cjs --write` before choosing.

## Before (this chat, all live)

- #146 docs: #145 marked live; rule: offer the new chat as buttons.
- #147 the doctor sheets (the place picker, the add and edit sheet) ->
  `features/doctor-sheets.js` (b1025.1140). Two side-by-side sections,
  one feature.
- #148 CSV export / import -> `features/csv.js` (b1025.1453). No suite
  covers it; a probe exported, edited and imported a file on both.
- #150 duplicate doctors -> `features/duplicate-doctors.js` (b1025.1607).
- #152 the terminology backfill -> `features/backfill.js` (b1025.1713).
  No suite covers it; the probe ran it failing and working on both.

Open, not this chat's (opened from Jose's account in other chats):
#149 (rule: offer a new chat as buttons after every finished job; docs
only, touches `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md`) and #151 (promo
video sound effects). This handoff's change also touches
`docs/PLAN.md`; whichever merges second may need its lines merged.

No check-ins armed.

## The method (worked twelve times)

1. List the section's top-level statements with acorn (`tests/node_modules`
   has acorn only; if missing, `cd tests && npm ci`, then delete
   `node_modules/playwright*` or the preinstalled browser is not found).
   Check the section really is one feature: a census section can hold two
   (#141), and two neighbouring sections can be one (#147). Anything that
   runs at load must not read `index.html`'s names until it has run
   (load-order.cjs).
2. Cut banner to last line into `features/<name>.js` under the header
   comment the others use; pointer comment in its place; script tag after
   the last `features/` line; `sw.js` precache.
3. `node tools/brain-data.cjs` (drop the section from GROUPS if listed),
   `node tools/census.cjs --write`.
4. Proof: rebuild the old `index.html` byte for byte; a browser probe in
   both checkouts (`ROOT=` a worktree of `main`) of the feature's output
   and `Object.keys(window)` (seed timestamps, random ids and animation
   frames differ; strip them); the suites that cover it on both; all
   suites; `first-paint.cjs` (`ROOTS=before,after RUNS=5`). Where no
   suite covers a feature, the probe must drive its real paths (success
   and failure); a probe that only hits the error path proves little
   (#152: seeded doctors need ids from `doctorDirIdFor`).
5. Docs: `AGENTS.md` and `CLAUDE.md` tables and file map, the feature
   note, `docs/split-index.md`, `docs/PLAN.md`.
6. PR, wait for GitHub's checks, phone notification, merge on "push",
   confirm the bump commit and Vercel "Deployment has completed".

## Not proven / open

- humc-brain's double-tap checks fail now and then under load (seen on
  `main` too, 2026-10-24); not investigated. Did not show up this chat.
- Each moved file: first paint within noise so far; real HTTP/2 on Vercel
  unmeasured. Twelve files now load before `index.html`'s script.
