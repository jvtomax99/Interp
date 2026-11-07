# The More sheet, grouped (2026-11-06)

Status: **live** since b1106.2156 (2026-11-06, PR #236).
Code: `MORE_GROUPS`, `moreRowsFor`, `openMoreSheet`, `moreSubOpen` in
`index.html` (section "Tab bar and the More sheet"); styles in `app.css`
("More, grouped"); checks in `tests/suites/more-sheet.cjs`.

## The problem

More is one flat column: 22 tools (23 for the owner) in the order they were
added to `getToolTiles()`, then every terminology domain and subgroup, then
the settings cards (account, Opening, smoothness meter, voice check) at the
very bottom. In the test copy that is 54 rows and 3,837 px, about five
screens of scrolling; the live glossary has more domains, so it is longer.

Three hand-kept lists have drifted: `getToolTiles()` (More and the desktop
sidebar), Home's sections (`doctorCards`, `studyCards`, `utilityCards`) and
the sidebar's own rows. Professional Resources is on Home but not in More;
Notifications is in More but not on Home. "Doctors" and "Doctor Directory"
both sit in More with the same icon; Notifications and Recent Updates share
the bell. Counts mix totals (77 answers, 101 traps) with to-dos, and Term
Review's 1837 "due" is every never-reviewed term.

## What it does (version 1)

Who: interpreters on a phone, one hand, between assignments.

1. One place per tool. `MORE_GROUPS` lists each group's rows in order;
   `MORE_ELSEWHERE` the tools that are tabs (Translate, Team Chat) or the
   Doctors heading's Open. `more-sheet.cjs` fails when a tool in
   `getToolTiles()` is in none of them, so a new tool can't go missing
   from More again. (Home's sections and the sidebar still keep their own
   lists; making them read `MORE_GROUPS` too is the next step if they
   drift again.)
2. More, top to bottom: Ask the Hub alone; **Study** (CoreCHI Practice,
   Term Review, False Friends, Sound-Alikes, Code of Ethics, Training and
   Events); **Doctors** (Doctor Prep, Doctor Directory, Provider Pictures,
   Find a Doctor, MediFind); **Reference** (Terminology domains, 3D Body,
   Link Directory, User Guide, Recent Updates); **You** (Your account,
   Notifications, Opening, Voice and mic check, Smoothness meter, Recently
   deleted, Team access for the owner).
3. The domains leave More: one row, "Terminology domains, N domains", opens
   the all-domains tile grid (`setCategory('all')`, so Back retraces it).
4. Translate and Team Chat leave More (they are tabs). The "Doctors" row
   goes; its page is **Open →** beside the Doctors heading, so the guide's
   "More, then Doctors" still holds.
5. Numbers only when they need you: Term Review's due count counts only
   terms you have reviewed before that are due again (`reviewedDueCount`);
   Training and Events shows items added since you last opened it
   (`eventsNewCount`, `ih_eventsSeenAt`, set by `setCategory('events')`;
   the first look counts everything as seen). Every other count goes.
   The desktop sidebar keeps its counts as before.
6. Find a Doctor and MediFind get a ↗ and sit last in Doctors.
7. Rows 48 px (tap target 44 px or more), group headings as small capitals.
8. Notifications gets its own icon so the bell is Recent Updates' alone.
9. The You rows are drawn squares (not pins), iOS Settings style, so
   settings read apart from places. Your account, Opening and Smoothness
   meter open their card in a small sheet over More (`#moreSubOverlay`,
   `moreSubOpen`): **‹ More** goes back (and redraws the row's line),
   ✕ closes both. Voice and mic check opens its own sheet as before;
   Notifications, Recently deleted and Team access open their screens.
10. Professional Resources (a domain that was only on Home) gets a row in
   Reference.

Measured (test copy, iPhone): 54 rows and 3,837 px before; 25 rows and
1,615 px after.

## Not in version 1

- No reordering by use and no favourites or pinning: fixed places beat
  clever ones one-handed.
- No search box in the sheet: Search is a tab.
- No change to the tab bar's five tabs.
- Home's look stays as it is; only where its sections get their lists.
- No new settings: the You rows open what exists today.

## How others do it

iOS Settings and Instagram's menu: short labelled groups, settings apart
from places, a chevron for "opens more", an arrow for "leaves the app".
The iPhone App Library: everything on one screen in a grid, at the cost of
small wrapped names; rejected here for that reason. Where the Hub can do
better: groups that match Home exactly, so More is never a second map to
learn, and counts that only mean "needs you".

## Decided (Jose, 2026-11-06)

- The You rows are rows: each opens its card (account, Opening, voice
  check, smoothness meter) in its own small sheet.
- The group names are the short ones: Study / Doctors / Reference / You.
  Home's sections are renamed to match (Study and Development becomes
  Study, Tools and Reference becomes Reference).

## When built

- User Guide: rewrite the answer about More, check `GUIDE_STEPS` and
  `GUIDE_COACH` that point into the sheet, a New lately card.
- Tests: a `more-sheet.cjs` suite (the groups, no tab duplicates, every
  tool reachable from More or a tab, 44 px targets, external rows marked);
  the six suites that open More today (account, destination-labels,
  dock-tuck, frame-meter, opening, voice-check) checked against the new
  layout.
