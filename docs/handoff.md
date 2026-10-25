# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat
hands over"). This one: 2026-10-25, joining two chats' handoffs: the split
chat (#146 to #154) and the promo chat (#151). Two threads are open; a new
chat picks the one Jose names.

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` and `docs/handoff.md` (and
> `promo/hub-blend/BRIEF-60s.md` if the work is the promo). Then tell me
> what's being worked on now and the goal, and what was worked on before,
> in a few short lines each, say in 2-3 lines what you'll do next, and
> wait for my go. Plain words, say "working on it" and "done".

## Now

**Thread 1: the split of `index.html`** (`docs/split-index.md`, phase 3).
All the small pieces are out. The Ask the Hub group (7 sections, 125 KB)
is in **#154**, `features/ask-hub.js`, waiting for GitHub's checks and
Jose's "push"; `index.html` goes 1.15 MB to 1.02 MB. Left after it: Dr.
Smiley's engine group (art, engine, "how lively", task states; 5
sections, about 78 KB; 12 sections call his task states): plan it, move
it, or stop. `docs/PLAN.md` still needs #154's line once it is live.

**Thread 2: the 1-minute promo** (Jose, 2026-10-25). Plan and every
decision: `promo/hub-blend/BRIEF-60s.md`. In short: same 3D look, 60 s, a
new AI narrator (Kokoro, Michael; Spanish words in Dora), v11's music
with its old narrator taken out by Demucs, kept as a separate file (the
app keeps its 45 s video). Next: step 1, the music sample, then the
script for Jose to approve.

## Before (all live unless named)

- Split: #147 doctor sheets (b1025.1140), #148 CSV (b1025.1453), #150
  duplicate doctors (b1025.1607), #152 backfill (b1025.1713).
- #149 (new-chat buttons after every finished job) merged.
- #151 promo sound effects (`media/hub-promo.mp4` remixed, picture
  untouched) and the 15 s What's new video (`promo/whats-new/`), live
  b1025.1910. The kit's 9 sound effects in `promo/hub-blend/assets/sfx/`,
  cue list `tools/sfx.cjs`. Jose's Motion Graphics starter kit (Damiano
  Caudullo): only its sounds and Liquid Glass look were used; its fonts,
  practice clip and fake screenshots left out on purpose.
- #154 (open, above): the Ask group; HUMC Brain's `claim()` fixed for an
  emptied region (its page stopped drawing).

## Learned, not in the docs before

- The test harness (`tests/support/harness.cjs`) serves the app but not
  `brain/`: a capture of `brain/you.html` routes it itself
  (`promo/whats-new/tools/capture.cjs`).
- The Notifications screen in a headless browser says "not available";
  stand in `pushState = () => 'on'` to show it switched on.
- Playwright's Chromium here can't decode H.264, so a page preview of an
  MP4 shows the wrong frame. HyperFrames' render is right (ffmpeg frames).
- A static scan of what runs at load misses arrows run at once
  (`.map(w => foldText(w))` in `ASK_STOP`). Run the moved file in a bare
  `vm` sandbox: any "X is not defined" is a load-time read (#154).

## The method for a move (worked thirteen times)

1. List the section's top-level statements with acorn (`tests/node_modules`
   has acorn only; if missing, `cd tests && npm ci`, then delete
   `node_modules/playwright*` or the preinstalled browser is not found).
   Check the section really is one feature (#141, #147). Anything that
   runs at load must not read `index.html`'s names until it has run
   (load-order.cjs); prove it with the sandbox above. Lines that must run
   at load stay in `index.html` where the section began.
2. Cut banner to last line into `features/<name>.js` under the header
   comment the others use; pointer comment in its place; script tag after
   the last `features/` line; `sw.js` precache.
3. `node tools/brain-data.cjs` (drop the section from GROUPS if listed),
   `node tools/census.cjs --write`.
4. Proof: rebuild the old `index.html` byte for byte; a browser probe in
   both checkouts (`ROOT=` a worktree of `main`) driving the feature's
   real paths, success and failure, plus `Object.keys(window)`; all
   suites; `first-paint.cjs` (`ROOTS=before,after RUNS=5`).
5. Docs: `AGENTS.md` and `CLAUDE.md` tables and file map, the feature
   note, `docs/split-index.md`, `docs/PLAN.md`.
6. PR, wait for GitHub's checks, phone notification, merge on "push",
   confirm the bump commit and Vercel "Deployment has completed".

## Not proven / open

- humc-brain's double-tap checks fail now and then under load (seen on
  `main` too, 2026-10-24); not investigated.
- Each moved file: first paint within noise so far; real HTTP/2 on Vercel
  unmeasured. Fourteen files load before `index.html`'s script.
