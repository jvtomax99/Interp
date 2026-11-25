# HANDOFF, 2026-11-25 (third of the day)

## Paste this into a new chat

Read HANDOFF.md, then carry on the consistency pass (item 2 under Next in docs/PLAN.md): heading levels. Show me before and after at phone size before applying.

## The goal and the exact next step

The consistency pass is the list of small things that make the Hub look
thrown together. Corners, the top bar's buttons and the search hints are
live. One part is left, and it is the biggest:

1. **Next: heading levels** (`h1` / `h2` / none, per screen). A screen's
   title is an `h1` on six screens (the tool banners), an `h2` on about
   twelve (`.section-head h2`), missing on five (All domains, the
   briefing, Appointment, Doctor Directory, Link Directory); Home goes
   from `h1` to `h3`. Touches `.section-head`, `home-polish.css` and the
   suites that find titles by tag. Start by listing every screen's title
   and tag (a scout job), then bring Jose the rule to pick (one `h1` per
   screen is the usual one) with before and after phone screens: the look
   should not change, so the "after" is mostly proof that nothing moved.
2. Then the "while there" stress checks in the plan (a 60-character doctor
   name, a very long term, a long chat message with no spaces; each
   failure forced and its message read).

After the pass: item 3 under Next, **Check link**, whose plan Jose has
OK'd (`docs/features/link-check.md`); then item 4, the plan for smaller
files (no code first).

## What is merged, what is open

- Live: #287, the top bar's round buttons take a 44px tap and still look
  36px, build b1125.1430. Undo: revert #287.
- Live: #288, shorter search hints on every search box and Home's search
  pill, build b1125.1811. Undo: revert #288.
- Open: only the pull request that carries this file and the Check link
  notes (notes only, nothing goes live).

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
