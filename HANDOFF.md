# HANDOFF, 2026-11-25 (fourth of the day)

## Paste this into a new chat

Read HANDOFF.md, then carry on the consistency pass (item 2 under Next in docs/PLAN.md): the "while there" stress checks. Show me each failure as a phone screenshot before fixing anything.

## The goal and the exact next step

The consistency pass is the list of small things that make the Hub look
thrown together. Corners, the top bar's buttons and the search hints are
live. One part is left, and it is the biggest:

1. Done and live: heading levels (#290, build b1125.2025). One title
   per screen; the rule is in `DESIGN.md`, `heading-levels.cjs` holds it.
2. **Next: the "while there" stress checks** in the plan (a 60-character
   doctor name, a very long term, a long chat message with no spaces;
   each failure forced, offline, AI down, storage refused, and its
   message read). Find first, show Jose phone screenshots, fix after.

After the pass: item 3 under Next, **Check link**, whose plan Jose has
OK'd (`docs/features/link-check.md`); then item 4, the plan for smaller
files (no code first).

## What is merged, what is open

- Live: #287, the top bar's round buttons take a 44px tap and still look
  36px, build b1125.1430. Undo: revert #287.
- Live: #288, shorter search hints on every search box and Home's search
  pill, build b1125.1811. Undo: revert #288.
- Live: #290, heading levels, build b1125.2025. Undo: revert #290.
- Open: only the pull request that carries this file (notes only).

## Open questions for Jose

- **Make the repository private?** Asked 2026-11-25: "Not yet".
- **Read the reworded False Friends and Code of Ethics lines?** Asked
  2026-11-25: "Not yet".
- Three things found on the way, not asked yet, each in `docs/PLAN.md`
  under the consistency pass:
  - At 360 wide, Back plus a sync badge cuts "Interpreter Hub" in the top
    bar (numbers in `docs/FACTS.md`).
  - False Friends and Recent Updates show a second search box at the top
    that searches nothing there (found by reading the code, not yet seen
    on a phone).
  - Check link: show the plan to two or three interpreters before
    building?
  - A Term Review session has no banner, and a doctor's page leaves two
    titles for a screen reader (it sits over the list).
- Buy a name to replace `interp-six.vercel.app`? Not asked this chat.

## Decisions from this chat

- Top bar buttons: drawn 36px, tapped across a 44 x 44 square (`::before`
  in `home-polish.css`), 8px apart. Jose picked this over drawing them at
  44, which made the bar 53px and cut the title at 360 wide.
- Search hints: the "two things" style, the same wording on a computer.
  About 24 characters is the most a phone's box holds; beside "+ Add"
  only "Search" fits. `search-hints.cjs` measures every one.
- Check link: "does it still open", never "is it safe"; results are not
  saved; build after the consistency pass.

## Learned, not in the notes yet

- A before and after with nothing to see: keep the live version in a
  second folder (`git worktree add <folder> origin/main`), run the same
  capture with `ROOT=<folder>`, and compare each heading's box and
  computed style as numbers. Screenshots differ between two runs of the
  same code on Home (random quote) and CoreCHI Practice, so bytes alone
  prove nothing there.
- The machine restarted twice mid-task. Commit early, and have a helper
  write its results to a file under `tests/out/` as it goes.

- The full local run (`node run.cjs`) took over 25 minutes on this
  machine and was stopped at the limit; it is 8 minutes on GitHub. Run
  the few suites the change touches here, one at a time, and let the pull
  request's own run cover the rest.
- A cloud chat can be restarted mid-task. A helper's report is lost from
  the chat when that happens but is still on disk under
  `/root/.claude/projects/.../subagents/`.
- A cold reviewer found a real miss again (Home's search pill still had
  the old wording). Keep doing it before every pull request.
- A plan-mode OK or a button question can close unanswered if a message
  arrives while it is open: ask again, it was not a "no".

## Files to look at first

`docs/PLAN.md` (Next, items 2 and 3), `docs/features/link-check.md`,
`DESIGN.md` (type scale, for the headings), `tests/suites/tool-banners.cjs`
and `glossary-hero.cjs` (they find titles by tag),
`tests/suites/search-hints.cjs` as the newest model for a check.
