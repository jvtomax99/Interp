# Handoff (2026-11-10): faster Interp tests

**Goal:** cut the wait for "App checks" on every change. Today the `checks`
job takes about 40 minutes (20:42 to 21:24 UTC on #261), even for a
docs-only change.

**Exact next step:** first read why the `webkit` job failed on `main` at
a0d66e0 (job 130139987772, run 42904831628; its screenshots are the
artifact `test-output-webkit`). It passed on the same code in #261
(c9f1480), so it is probably a flaky suite, not proven. The `checks` job
on that commit was still running when this was written: read its result
too. Tell Jose what you find before starting the speed work.

**Then, the plan Jose picked ("Faster Interp tests"), one pull request:**
1. Skip the full run when a change touches only docs (`docs/`, `*.md`,
   `.claude/`): a paths filter in `.github/workflows/tests.yml`. Keep
   the run for anything else, and for `tests/` and `.github/` changes.
2. Split the 54 suites in `tests/suites/` across several machines at
   once (a matrix; `tests/run.cjs` already takes suite names as
   arguments, line 69). Aim: 10 to 15 minutes. That number is a guess
   until measured. The repo is public, so the extra machines cost nothing.
3. Proof for Jose: the before and after run times from GitHub, and all
   suites still run (count them across the shards).

**Done today (all merged; the rule decisions are in docs/PLAN.md, Facts):**
- General rules in every CLAUDE.md, SPEC.md and docs/ARCHITECTURE.md
  drafts, rule docs in docs/, the taste skill (#257 to #260).
- #261: checks pinned to Ubuntu 24.04 (Playwright 1.56.1 can't install
  on ubuntu-latest, 26.04; they had failed since 2026-11-09), one run
  per change, shorter rules block.

**Decisions not in SPEC.md:** none; they are in docs/PLAN.md Facts and
CLAUDE.md.

**Left open, Jose's call later:** branch protection on main (needs an
exception for the bump-version Action); removing from the rules block
what his claude.ai preferences already say; moving the design history
from CLAUDE.md to DESIGN.md; the TO FILL lines in SPEC.md.

**Files to look at first:** `.github/workflows/tests.yml`,
`tests/run.cjs`, `tests/README.md`.
