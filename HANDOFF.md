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

- Live: #292, the stress-check fixes, build b1125.2244. Undo: revert #292.
- Open: only the pull request that carries this file (notes only).

## Open questions for Jose

- **Make the repository private?** Asked 2026-11-25: "Not yet".
- **Read the reworded False Friends and Code of Ethics lines?** Asked
  2026-11-25: "Not yet".
- Found on the way, not asked yet (each in `docs/PLAN.md` under the
  consistency pass):
  - At 360 wide, Back plus a sync badge cuts "Interpreter Hub".
  - False Friends and Recent Updates show a second search box that
    searches nothing there.
  - A Term Review session has no banner; a doctor's page leaves two
    titles for a screen reader.
  - **New from the stress checks:** saving a doctor, a provider, a
    doctor's tip or team term, an event or a file on a term, and deleting
    a chat message, still need a connection (they now say so). Should
    they be kept on the phone and sent later, like terms? A data change
    that needs its own plan. Until then, on Wi-Fi that is connected but
    dead, those saves wait with no message.
  - Check link: show the plan to two or three interpreters first?
- Buy a name to replace `interp-six.vercel.app`? Not asked.

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
