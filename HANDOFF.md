# Handoff (2026-11-10): the cleanup audit

**Goal:** run the cleanup audit. `docs/CLEANUP.md` does not exist, so no
audit is on record; Jose picked "Next session" when it was offered.

**Exact next step:** read `docs/cleanup-audit.md` and run it as written. It
produces `docs/CLEANUP.md` (with "Last audit" at the top). Confirm with Jose
before starting.

**After the audit (Jose's pick, 2026-11-10): trim the notes files** so a
chat loads less. Ask him with buttons before each part.
1. Split `docs/PLAN.md` (about 1,690 lines): keep "How a session runs" and
   "Next" in it, move "Done" and the older "Facts" to an archive file opened
   only when needed. First check whether chats really read the whole file at
   the start; if they read only the top, the gain is smaller.
2. In `CLAUDE.md`: fold the "Working agreement" bullets that repeat the
   general rules block (buttons, notifications, installs, paste boxes) into
   one place, and move the design history into `DESIGN.md`.
Not doing: `CLAUDE.md` pointing into `AGENTS.md` for shared rules (a mistake
there changes how ChatGPT behaves, for a small saving). Notes opened only
when needed (`docs/assets.md`, `design-rules.md`, `docs/features/*`) need
no trimming.

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
