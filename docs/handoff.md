# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-25, from the chat that ran #151 (promo sound
effects and the What's new video).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md`, `docs/handoff.md` and
> `promo/hub-blend/BRIEF-60s.md`. Then tell me what's being worked on now and
> the goal, and what was worked on before, in a few short lines each, say in
> 2-3 lines what you'll do next, and wait for my go. Plain words, say
> "working on it" and "done".

## Now

**The 1-minute promo** (Jose, 2026-10-25). Plan and every decision:
`promo/hub-blend/BRIEF-60s.md`. In short: same 3D look, 60 s, a new AI narrator
(Kokoro, Michael; Spanish words in Dora), v11's music with its old narrator taken
out by Demucs, kept as a separate file (the app keeps its 45 s video). Next:
step 1, the music sample, then the script for Jose to approve.

## Open

- **#151** (branch `claude/new-session-rpv122`): the promo's sound effects
  (`media/hub-promo.mp4` remixed, picture untouched) and the 15 s What's new
  video (`promo/whats-new/`). Merged with `main` (only this file
  clashed); waiting for Jose's "push". After it merges, start the next change
  from `main`.
- The split of `index.html` (`docs/split-index.md`) is paused, not finished:
  duplicate doctors went live in #150, the backfill in #152 (b1025.1713).
  Next there: Ask the Hub's group and Dr. Smiley's engine, as groups, or
  they stay.

## Before (this chat)

- #151 above: the kit's 9 sound effects in `promo/hub-blend/assets/sfx/`,
  cue list `tools/sfx.cjs`; the What's new video, rendered three times after
  `hyperframes lint` caught silent sounds and wrong film frames.
- Jose's Motion Graphics starter kit (Damiano Caudullo): only its sounds and
  its Liquid Glass look were used. Its fonts, practice clip and fake
  screenshots were left out on purpose.

## Learned here, not in the docs before

- The test harness (`tests/support/harness.cjs`) serves the app but not
  `brain/`: a capture of `brain/you.html` routes it itself
  (`promo/whats-new/tools/capture.cjs`).
- The Notifications screen in a headless browser says "not available";
  stand in `pushState = () => 'on'` to show it switched on.
- Playwright's Chromium here can't decode H.264, so a page preview of an MP4
  shows the wrong frame. HyperFrames' render is right (it takes frames with
  ffmpeg).

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
