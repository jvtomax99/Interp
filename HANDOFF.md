# Handoff (2026-11-11): why WebKit's page crashes on the Home greeting

**Paste this into the new chat:**

> Read `HANDOFF.md` first (on the branch `claude/webkit-page-crash`), then
> `AGENTS.md`, `docs/PLAN.md` and the short map in `docs/ARCHITECTURE.md`.
> Tell me in a few short lines what is being worked on now and what was
> worked on before, then confirm the next step with me before starting.
> Plain words, say "working on it" and "done". "Push" is always a button.

**Goal (Jose's pick, 2026-11-11):** find out why the Safari-engine (WebKit)
page dies about 32 s into the Home greeting in GitHub's `webkit` job, and
whether a real iPhone can do the same. Most of the team is on iPhones, so if
it is real there it is the app restarting on Home.

**What is known** (`docs/FACTS.md`, last entry; `docs/PLAN.md`, Later):
- `tests/suites/startup-work.cjs`, the check "afterwards the name itself is
  shown", failed twice: on `main` at a0d66e0 (2026-11-10) and on #266's
  first run (2026-11-11). Both ended at about 32 s. The second time the log
  said why: "Target page, context or browser has been closed [the page
  crashed]". Each time a re-run passed with no change.
- Only seen in GitHub's `webkit` job (`.github/workflows/tests.yml`; it runs
  doctor-page, dock-tuck and startup-work). The six Chromium jobs pass.
- Not known: memory, a WebKit bug, or the machine. Nothing measured yet.

**Found so far (2026-11-11, run 42940783637 of "WebKit crash probe", 20
opens per variation in GitHub's WebKit):**
- It is a freeze, then a kill; memory is not the cause. In 4 of 100 opens the page
  stopped answering 1.3 to 3.4 s after it opened; its memory stayed flat
  (about 600 MB at 1x, 900 MB at 3x, 13.6 GB free); WebKit killed it 18 to
  28 s later. That is the suite's "32 s".
- By variation: at 1x 3 of 20 froze; Dr. Smiley Still (3x) 1 of 20; as the
  suite runs it (3x) 0 of 20; Reduce Motion 0 of 20; pen path already saved
  0 of 20. Twenty opens each is too few to say which piece it follows.
- In GitHub's WebKit the page draws about 5 frames a second at 3x and holds
  about 1.3 GB.

**Second round (run 42943466243, 60 opens per variation, all at 1x but
dsf3; a freeze = 3 silent seconds in a row):** 27 of 360 froze, none
crashed (the probe ends a frozen run itself).

| variation | froze of 60 |
|---|---|
| as the suite runs it, 1x | 5 |
| 3x | 2 |
| Dr. Smiley Still (no pen) | 8 |
| no OffscreenCanvas | 5 |
| no Worker | 7 |
| Reduce Motion | 0 (and 0 of 20 in round one) |

- Ruled out: the pen's worker, any worker, OffscreenCanvas, the pen itself
  (Still has no pen and froze most), memory.
- The trace shows no call left open in any frozen run: every heavy call
  had returned, the last one (`fonts.load`) 0.3 to 4.5 s before the page
  went silent. So no single call of ours is stuck; the page stops while
  the hello's animations run (64 to 91 animations alive, 15 to 30 frames a
  second at 1x).
- What it follows: animation. 0 of 80 with Reduce Motion against 27 of 300
  without (about 9%).
- Not known: which animation, and whether this is GitHub's Linux build of
  WebKit alone. No teammate has reported the app freezing on open, which
  at 9% they would see daily; that is a reason to doubt it happens on
  iPhones, not proof.

**Third round (run 42995104071, 60 opens per variation at 1x, one thing
turned off by an added style):**

| variation | froze of 60 |
|---|---|
| as the suite runs it | 4 |
| Reduce Motion | 0 |
| every CSS animation off | 8 |
| petals hidden | 8 |
| Dr. Smiley's CSS animations off | 1 |
| no filter, no backdrop blur | 10 |
| **every canvas hidden** | **0** |

- It follows the one canvas Home shows while it opens:
  `.home-wave-canvas`, the hello's drawing (`home-polish.js`, about lines
  350 to 565: the squares, the glows drawn with `lighter`, one draw per
  frame). Reduce Motion never makes that canvas, which is why it never
  froze. All rounds together: 0 of 200 with no canvas on screen (Reduce
  Motion or hidden), 58 of 600 with it (about 10%).
- The petals and CSS animations are not it (the first guess was wrong):
  hiding or stopping them changed nothing.
- With the canvas hidden the script still draws into it every frame and
  the page never froze, so the drawing code itself does not hang. The
  freeze is in how this WebKit build puts a canvas that changes every
  frame on screen.
- Not known: whether iPhones do it. GitHub's browser is WebKit's Linux
  build (WPE); the part that puts a canvas on screen is different code on
  an iPhone. No teammate has reported the app freezing on open.

**Exact next step (ask Jose first, with buttons):**
1. A real-phone test settles the open question cheaply: Jose (or two
   teammates) fully closes and opens the Hub 30 times on an iPhone and
   counts opens where Home stops responding during the hello. At 10% a
   freeze shows in 30 opens 96 times in 100.
2. If iPhones never freeze: change `startup-work.cjs` so a frozen or
   crashed page in WebKit is reported as that and opened once more, the
   check itself unchanged (Jose's OK needed: it loosens a check), and
   record in `docs/feel-audit.md` that the hello's canvas is the cost.
3. If an iPhone does freeze: this joins "the hello's canvas draw" under
   Waiting on Jose in `docs/PLAN.md` (his call, options in
   `docs/feel-audit.md`); measure candidates with the probe first (a
   smaller canvas, no `lighter`, drawing every other frame) and show him
   before changing what he sees.
The probe and its job are on this branch only (`tests/tools/webkit-crash.cjs`,
`.github/workflows/webkit-crash.yml`); open a pull request for them and
these notes when Jose says so. This cloud machine has no WebKit and must
not run `playwright install`.

**Done in the last chat (all merged):**
- #266, live as build b1111.0136: the first cleanup audit
  (`docs/CLEANUP.md`, 20 items) and its low-risk items removed (unused
  script, two unused settings, 214 lines of unused styles, ten unused
  `export`s). Every screen measured the same before and after.
- #267, notes only: the crash finding written into `docs/FACTS.md` and
  `docs/PLAN.md`.

**Left on the cleanup list for Jose to pick** (`docs/CLEANUP.md`): the
doubled photo-picker code (item 5), saving a setting written out about 40
times (6), the 520-line `renderContent` (13), leftover files (15 to 17).

**This chat learned, not in the notes yet:**
- This cloud machine's Chromium is build 1243; `tests/` pins Playwright
  1.56.1, which looks for build 1194, so every browser suite fails to start
  ("Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1194/...").
  What worked, for one chat only:
  `mkdir -p /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux && ln -sf /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
  The full suite then passed. A lasting fix (the setup script, or moving
  the tests to the Playwright that matches) is Jose's call: ask with buttons.
- `api/check-events.js:217` checks the caller's secret only if `CRON_SECRET`
  is set in Vercel. Jose was told to look (Settings, Environment
  Variables); no answer yet.

**Open questions for Jose, from before:** K2's rule publish (probably done
2026-11-07); branch protection on `main`; his claude.ai preferences against
the rules block; the TO FILL lines in `SPEC.md`.

**Files to look at first:** `tests/suites/startup-work.cjs` (lines 50 to
65), `.github/workflows/tests.yml` (the `webkit` job), `home-polish.js`
(`namePen`, `cap`), `docs/FACTS.md` (search "startup-work" and "WebKit").
