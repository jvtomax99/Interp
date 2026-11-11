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

**Exact next step:** read the second run of the probe (pushed with this
file: 60 opens per variation at 1x, a freeze counted after 3 silent
seconds, and a trace of the page's heavy calls so a frozen run prints what
it was doing last). `tests/tools/webkit-crash.cjs` says what each variation
turns off. If the freeze follows one call (a worker starting, a canvas
handed to a worker, getImageData), look at that code in `home-polish.js`.
If it follows nothing, say so: it may be GitHub's WebKit build alone, and
then the suite's check should say "the page froze" and retry, with Jose's
OK. This cloud machine has no WebKit and must not run `playwright
install`; all measuring is on GitHub (a push to this branch that touches
the tool or the workflow starts it).

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
