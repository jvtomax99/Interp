# Handoff (2026-11-10): the cleanup audit

**Paste this into the new chat:**

> Read `HANDOFF.md` first, then `AGENTS.md`, `docs/PLAN.md` and the short
> map in `docs/ARCHITECTURE.md`. Tell me in a few short lines what is being
> worked on now and what was worked on before, then confirm the next step
> with me before starting. Plain words, say "working on it" and "done".
> "Push" is always a button.

**Goal:** run the cleanup audit. `docs/CLEANUP.md` does not exist, so no
audit is on record; Jose picked "Next session" when it was offered.

**Exact next step:** read `docs/cleanup-audit.md` and run it as written. It
produces `docs/CLEANUP.md` (with "Last audit" at the top). Confirm with Jose
before starting.

**Done in the last chat (notes only, app still on build b1110.1829):** the
notes were trimmed so a chat loads less (Jose's ask).
- `docs/PLAN.md` went from 116 KB to about 13 KB. Its "Done" list is now
  `docs/PLAN-done.md` and its "Facts" are `docs/FACTS.md`, both word for
  word, both for searching, never for reading whole. The old "Next" list
  (every item finished, parked or waiting on Jose) is kept at the end of
  `PLAN-done.md`; what was really open is under "Waiting on Jose" and
  "Later" in `PLAN.md`.
- `CLAUDE.md` went from 42 KB to 34 KB: repeats folded, the design values
  and their history moved to `DESIGN.md` (its copy of `--ink-faint` was a
  week stale), the per-feature table cut to a list.
- `AGENTS.md`: four stale lines corrected with Jose's OK (2026-11-11).
  What the sweep of every other note found is in `docs/PLAN.md`, Later,
  "Notes that have drifted from the code".

**Open questions for Jose:**
- K2 (publish `firestore.rules` for Term Review privacy): done on
  2026-11-07 with the rest? `docs/PLAN.md` still lists it.
- Left open from before: branch protection on `main`; removing from the
  rules block what his claude.ai preferences already say; the TO FILL
  lines in `SPEC.md`.

**Still unproven:** why `startup-work` failed once in CI's WebKit on
a0d66e0 ("the name itself is shown", ended at 32 s of a 40 s wait). It has
passed twice since on the same app code. The check now prints why its wait
ended; if it fails again, read that line first.

**Files to look at first:** `docs/cleanup-audit.md`, `docs/ARCHITECTURE.md`
(the short map), `docs/PLAN.md`.
