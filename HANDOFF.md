# HANDOFF, 2026-11-26 (after the first chat of the day)

## Paste this into a new chat

Read HANDOFF.md, ask me what Check link answered on my two taps (one working link, one dead one), then build step 2 of kept-on-the-phone saves (docs/features/kept-on-phone-saves.md) on the branch outbox-doctors-tips.

## The goal and the exact next step

1. **Jose's two taps on Check link** (asked 2026-11-26: "Haven't tapped
   yet"). If an answer is wrong, ask for the exact address and fix that
   first.
2. **Step 2 of kept-on-the-phone saves** (`docs/PLAN.md`, Next, item 4;
   Jose OK'd all four steps). Measure first: how big a doctor record is
   as an outbox entry (the outbox is `localStorage`, 200 entries), and
   whether providers and events show on a cold open with no signal.
   Then the outbox learns three things, each as plain text that is
   turned into the database's own marker only when sent
   (`applyQueuedWrite`, `index.html`, "Offline outbox"): "write only
   these fields" (what `persistDoctorDirectoryEntry` does with
   `mergeFields`), "add to or take out of a list" (`doctorTipWrite`,
   `doctorTermWrite`; a tip edit is a remove and an add in one batch),
   and "delete these files after" (for step 3's chat delete). Then
   doctors, tips and team terms go through `queuedWrite`, the
   `offlineBlocked` guards on them come out, and
   `describeOutboxEntry` gets a readable title for each new kind.
3. Step 3 (providers, events, chat delete), step 4 (an upload that
   stalls says so), then `docs/PLAN.md` item 5, the plan for smaller
   files.

## What is merged, what is open

- Live: #297, the plan and step 1 (team terms one at a time), build
  b1126.1318 (undo: revert #297).
- Open: nothing. Branch `outbox-doctors-tips` holds only the notes for
  #297 and this file; step 2's code goes on it.
- No check-ins pending.

## Open questions for Jose

- **Ask the team before step 3:** a chat message deleted with no signal
  is hidden on that phone but teammates still see it until the phone
  reconnects (the plan, risk 2). Acceptable with a plain message?
- **Make the repository private?** "Not yet" (2026-11-25).
- **Read the reworded False Friends and Code of Ethics lines?** "Not
  yet" (2026-11-25).

## Decisions from this chat

- All four steps of the plan, one change each. Files stay "needs a
  connection".
- Never queue the domain list, doctor merges, CSV imports or Team
  access.

## Learned

In `docs/FACTS.md`, "Kept-on-the-phone saves". Also: `journey.cjs`'s
Term Review step can fail once on a busy GitHub machine (it passed on
the one re-run and on five runs here; `docs/PLAN-done.md`, #297). The
tests' stand-in database (`tests/support/firebase-stub.js`) already
understands list adds, list removes and field-only saves.

## Files to look at first

`docs/features/kept-on-phone-saves.md`, the "Offline outbox" block in
`index.html` (`queuedWrite`, `applyQueuedWrite`, `flushOutbox`,
`describeOutboxEntry`), `persistDoctorDirectoryEntry`, `doctorTipWrite`,
`doctorTermWrite`, `tests/suites/team-terms.cjs`,
`tests/tools/stress-fail.cjs`.
