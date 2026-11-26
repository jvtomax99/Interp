# HANDOFF, 2026-11-25 (fifth of the day)

## Paste this into a new chat

Read HANDOFF.md, then ask me the open questions under "Open questions for Jose" one at a time with buttons, and after that start item 3 under Next in docs/PLAN.md (Check link; its plan is OK'd).

## The goal and the exact next step

The consistency pass (item 2 under Next in `docs/PLAN.md`) has no work
left that doesn't need Jose's pick. Its last part, the stress checks, is
live: twelve breaks found, shown to him as phone screenshots, all twelve
fixed (#292, build b1125.2244).

1. **Next: Jose's picks on what was found on the way** (below). Each is
   small; ask, then do the ones he picks in one pull request.
2. Then item 3, **Check link** (`docs/features/link-check.md`, plan OK'd).
   Before editing `AGENTS.md`'s feature list for it, confirm with him.
3. Then item 4, the plan for smaller files (no code first).

## What is merged, what is open

- Live: #294, the small picks (the cut title, the dead search bar, a
  doctor's page for a screen reader), build b1126.0026. Undo: revert #294.
- Open: Check link's pull request (branch `link-check`), built and
  reviewed, waiting for Jose's "push". After it is live he taps Check on
  one working link and one dead one; then the entry moves to
  `docs/PLAN-done.md`, and the plan for kept-on-the-phone saves is next.

## Open questions for Jose

- **Make the repository private?** Asked 2026-11-25: "Not yet".
- **Read the reworded False Friends and Code of Ethics lines?** Asked
  2026-11-25: "Not yet".
- Answered 2026-11-25 (sixth chat): the cut title (the logo steps aside
  at 360 wide), the dead search box (removed), the doctor's page's two
  titles (fixed), a Term Review banner (no), all in the small-picks pull
  request; Check link (build now, show the team the working button;
  yes to its one `AGENTS.md` line); a name of his own (not now).
- **Kept-on-the-phone saves for doctors, providers, tips, events, files
  and chat deletes:** he wants the plan (no code) written once Check
  link is live, then decides.

## Decisions from this chat

- Stress checks: "All 12" fixed. Long text wraps (no "..."), so text that
  fits sits exactly where it did; a long line makes its row taller.
- A refused save now says "This phone may need to rejoin the team on
  Team access" instead of the developer's sentence about Firestore
  rules. If a new collection's rule was never pasted, that message is
  what Jose will see too.

## Learned, not in the notes yet

Everything from this chat is in `docs/FACTS.md`, "Stress checks".
- "My photo" with a failed upload is still untested (the adjust sheet
  needs a real tap sequence).

## Files to look at first

`docs/PLAN.md` (Next, items 2 and 3), `docs/features/link-check.md`,
`tests/suites/stress.cjs`, `tests/tools/stress.cjs` and
`stress-fail.cjs` (the finding tools, reusable for any new screen).
