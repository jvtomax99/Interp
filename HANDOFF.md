# HANDOFF, 2026-11-25 (second of the day)

## Paste this into a new chat

Read HANDOFF.md, then carry on the consistency pass (item 2 under Next in docs/PLAN.md): the top bar's round buttons from 36px to 44px. Show me before and after at phone size before applying.

## The goal and the exact next step

The consistency pass is the list of small things that make the Hub look
thrown together. Part 1, the corners, is live. Three parts are left, each
one visible, so each gets before and after screenshots (phone first) and
Jose's OK before it is applied:

1. **Next, the pick: the top bar's four round buttons** (`tgBack`,
   `tgTheme`, `tgBell`, `tgAvatar`) measure 36 x 36 on a phone; the rule
   is 44. They live in `home-polish.css` (the `max-width:900px` block).
   Smallest of the three and a real fix for thumbs. Watch the bar's
   height and the title's room at 360 wide.
2. **Search hints**: every search box on a phone cuts its hint, not two
   (numbers in `docs/FACTS.md`, "Search hints"). Needs shorter phone
   wording, about 24 characters, and about 10 beside "+ Add" on a
   domain. The wording is Jose's call: offer options with buttons. Check
   the User Guide for the old wording.
3. **Heading levels** (`h1` / `h2` / none, per screen): the biggest;
   touches `.section-head`, `home-polish.css` and suites that find
   titles by tag. Then the "while there" stress checks in the plan.

After the pass: item 3 under Next, a plan for smaller files, for his OK,
no code first.

## What is merged, what is open

- Merged and live: #285, every rounded corner on five sizes, build
  b1125.1318 (Vercel: deploy completed). Undo: revert #285.
- Open: only the pull request that carries this file (notes only).

## Open questions for Jose

- **Make the repository private?** Asked 2026-11-25: "Not yet".
- **Read the reworded False Friends and Code of Ethics lines?** Asked
  2026-11-25: "Not yet".
- Buy a name to replace `interp-six.vercel.app`? Not asked this chat.
- Not confirmed from a cloud session: a made-up address on the live site
  shows `404.html`.

## Decisions from this chat

- Corners: five sizes only, `--r-xs` 6, `--r-sm` 10, `--r-md` 14,
  `--r-lg` 20, `--r-xl` 26 (Jose picked "Apply it" over keeping a 12px
  size). A pill is written `999px`. `pin-icons.js` is outside the scale.
  All in `DESIGN.md`, "Border radius"; held by `corner-scale.cjs`.

## Learned, not in the notes yet

- The audit's "green shadow under the blue button" never showed: another
  rule covers `.btn-primary`'s shadow on every button measured. It is
  blue in the code now; nothing visible changed.
- `feel.cjs`'s Home timing fails when other browsers run at the same
  time (133.7 against 120; alone 61.2 and 25.1). Run it alone.
- A before and after without touching the branch: write changed copies of
  the stylesheets to a folder and run with `POLISH_DIR=<folder>`; compare
  against a `git worktree` of `main` with `ROOT=<worktree>`.
- A cold reviewer helper caught five real mistakes in the corner sweep.
  Keep doing that before every pull request.

## Files to look at first

`docs/PLAN.md` (Next, item 2), `docs/FACTS.md` ("Search hints", the top
bar line under it), `DESIGN.md` (Tap targets), `home-polish.css` (the
`max-width:900px` block), `tests/suites/corner-scale.cjs` as the newest
model for a check.
