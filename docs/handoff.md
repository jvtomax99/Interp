# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-03,
the type chat (type tidy, font sizes onto the scale, then the Doctor Directory review).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `docs/PLAN.md`, `docs/handoff.md` and `docs/features/doctor-page.md`
> ("Arrangement", "Needs info"). Work on branch `claude/doctor-dir-cleanup`. Tell me what's being worked on now and
> what was worked on before, in a few short lines. Then check no other chat is still changing the doctor list, and
> make the before/after mockup of fixes 1-4 below for my OK before any code. Plain words, say "working on it" and "done".

## Now: Doctor Directory cleanup, mockup first

Jose sent a phone screenshot of the Doctor Directory (North, Needs info on, Sort by Place, 2026-11-03) and asked for
its visuals analysed. He picked "Mock up fixes 1-4": a before/after picture, his OK, then code (own PR).

1. **Counts contradict.** Title "17 doctors" is the Needs info list (`list.length`, index.html, `dl-head`), not said
   anywhere; tabs say North 25, South 5, All 27 because a doctor with no region (no place) counts in both North and
   South (`doctorRegionChipsHtml`: `!x || x === r`). Idea: title "17 need info" while the filter is on; doctors with
   no place shown as their own count, not added to both regions.
2. **Three navy pills, three meanings.** "+ Add" (action), "Show all doctors" (`.dl-need.is-on`, turns the filter
   off), "Place" (selected sort). Idea: the filter as a small chip, "Needs info · 17 ✕"; navy only for Add and selected.
3. **Doctors start below half the screen.** Search, title + Add, region tabs, filter button, a two-line note
   (`.dl-need-note`), sort row, then the first group at ~58% of the screen height. Idea: one compact row for sort and
   filter (or a "Sort: Place ▾" menu), the note to one short line. Apple Contacts: list right under search, sorting in
   a menu.
4. **Groups of one.** Every place group in the shot has 1 doctor; the heading is a tap to reveal one name. Idea: groups
   of 1-2 open on their own.

Not in this change (from the same review, say so if asked): 5, the top bar is three lines on phones ("Hackensack
University Medical Center" wraps since the font sizes moved to 15/13; idea: "Interpreter Hub" alone or "HUMC" under it,
touches every screen, `home-polish.css`); 6, small things: the search box's icon is a text glyph, a lighter panel with a
hard top edge sits behind the search box (cause not checked), data typos "155 Polify Road" (likely Polifly Road) and
"Don IMUS", a teddy bear as a street address's icon.

**Watch out:** another chat changed this screen twice today (#183 D4 arrangement, #186 D5 Needs info). Check `main` and
open PRs for doctor-list work before starting; don't build on top of a change that is still moving.

## Before: what this chat did (all live)

- **Type tidy, #179, live b1103.1432.** Letter spacing from `--tr-*` tokens by size, Inter weights 400/500/550/650,
  `b`/`strong`/bare headings 650, `DESIGN.md` at the root (the design page every tool reads), guard
  `tests/suites/type-tokens.cjs`.
- **Font sizes onto the scale, #185, live b1103.1648.** Every stylesheet size is one of ten `--fs-*` steps (Apple's:
  11 12 13 15 16 17 20 22 28 34); Jose's picks 14 to 15 and nothing under 11. Doctor page tier tabs on a computer
  overflow their row more (662px in 608).
- Left for later (`docs/PLAN.md`, Later): 8 inline font sizes in script; the serif-era headings at weight 400 (Jose's call).

## Learned, not elsewhere yet

- `main` moves fast (other chats merge doctor-list and campus work): each catch-up restarts GitHub's ~28 min check, so
  merge `main` in right before the checks you want to count, and check again before asking Jose to push.
- `tests/support/harness.cjs` takes `POLISH_DIR` to swap `app.css`/`home-polish.css` for a variant: the cheap way to
  screenshot a before/after or an A/B without touching the checkout.
