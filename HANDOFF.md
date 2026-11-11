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

**Exact next step:** this cloud machine has no WebKit and must not run
`playwright install` (`docs/FACTS.md`), so the measuring happens on GitHub.
On this branch, add a manual-only workflow (or a manual input on the tests
workflow) that runs `startup-work.cjs` in the WebKit container 20 times and
prints, per run: pass or crash, seconds to the crash, and the page's memory
if WebKit gives it. Read the crash rate first. Then narrow: the same loop
with the name pen off (`home-polish.js`, `namePen`), with the petals off,
with Dr. Smiley still, to see which one the crash follows. Confirm the plan
with Jose before starting. A workflow file is tooling: no bump, no deploy.

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
