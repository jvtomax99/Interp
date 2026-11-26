# HANDOFF, 2026-11-26 (after the sixth chat of 2026-11-25)

## Paste this into a new chat

Read HANDOFF.md, ask me what Check link answered on my two taps (one working link, one dead one), then start item 4 under Next in docs/PLAN.md: the plan, no code, for kept-on-the-phone saves.

## The goal and the exact next step

1. **Jose's two taps on Check link** (live, never tried on a real site).
   If an answer is wrong, ask him for the exact address and fix that
   first.
2. Then item 4, the plan (no code) for kept-on-the-phone saves.
3. Then item 5, the plan for smaller files.

## What is merged, what is open

- Live: #294, the small picks, build b1126.0026 (undo: revert #294).
- Live: #295, Check link, build b1126.0110 (undo: revert #295). Not yet
  tried on a real site: Jose taps Check on one working link and one dead
  one in the Link Directory and says what each answered.
- Open: only the pull request that carries these notes.
- Next (item 4 in `docs/PLAN.md`): the plan, no code, for
  kept-on-the-phone saves of doctors, providers, tips, events, files and
  chat deletes.

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

- Check link: on a phone's Link Directory row the Check button leaves
  little of the address showing; Jose saw the pictures and pushed as is.
- "Moved" is offered only after permanent redirects; a temporary one is
  "Opens". http to https, `www.` and a closing slash are not "Moved".
- The logo steps aside only for a badge that stays (offline, unsent),
  not during "Syncing".

## Learned

All in `docs/FACTS.md`, "Check link" and the note under "Search hints".

## Files to look at first

`docs/PLAN.md` (Next, items 3 and 4), `docs/features/link-check.md`,
`api/link-check.js`, and for item 4 `queuedWrite()` and the outbox in
`index.html` with `tests/tools/stress-fail.cjs`.
