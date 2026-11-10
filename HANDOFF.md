# Handoff (2026-11-10): the cleanup audit

**Goal:** run the cleanup audit. `docs/CLEANUP.md` does not exist, so no
audit is on record; Jose picked "Next session" when it was offered.

**Exact next step:** read `docs/cleanup-audit.md` and run it as written. It
produces `docs/CLEANUP.md` (with "Last audit" at the top). Confirm with Jose
before starting.

**Done in the last chat (all merged, tooling and notes only, app still on
build b1110.1829):**
- #262 (ac3671d): the app checks run as six shares side by side, 41 min
  58 s down to 8 min 43 s on `main`. A change to nothing but `docs/`,
  `.claude/` and `*.md` skips the suites; "App checks result" is the one
  line that says how a run went. Details: `docs/PLAN.md` (Done, first
  entry), `tests/README.md`.
- The pull request carrying this file: one clause in `AGENTS.md` about the
  notes-only skip, and the first real use of that skip on GitHub.

**Still unproven:** why `startup-work` failed once in CI's WebKit on
a0d66e0 ("the name itself is shown", ended at 32 s of a 40 s wait). It has
passed twice since on the same app code. The check now prints why its wait
ended; if it fails again, read that line first.

**Left open, Jose's call later:** branch protection on `main` (name the job
"App checks result"; needs an exception for the bump-version Action);
removing from the rules block what his claude.ai preferences already say;
moving the design history from CLAUDE.md to DESIGN.md; the TO FILL lines in
SPEC.md.

**Files to look at first:** `docs/cleanup-audit.md`, `docs/ARCHITECTURE.md`
(the short map), `docs/PLAN.md` (Next).
