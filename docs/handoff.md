# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-03,
<<<<<<< HEAD
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
=======
the campus upgrade chat (sharper card, Kenney cars in 3D, free people and trees tested).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md`, `docs/handoff.md` and `docs/mockups/cchi-city/real-map/README.md`
> ("Cars: Kenney's Car Kit", "Free people and trees, tested and dropped", "People"). Work on branch
> `claude/smoother-walk`. Tell me what's being worked on now and what was worked on before, in a few short lines,
> then write the plan for a smoother walk for the campus people and wait for my go. Plain words, say "working on it"
> and "done". "Push" is always a button.

## Now: a smoother walk for our campus people (3D view)

Jose's pick (2026-11-03), after free people packs lost to ours. Goal: keep our people's look (round, soft, hospital
roles), make the walk read as walking instead of a two-pose flicker.

Where it is:
- `stride(g, f)` in `docs/mockups/cchi-city/diorama.html` (~line 569): two poses only, legs at +-0.45 rad or straight.
- `people.js` line ~138 picks the pose: `f = p.v > 0.05 ? Math.floor(p.step/0.22) % 2 : 0`; pairs get `1 - f`.
- `person()` (~line 546): body, head, two legs as meshes, coloured per vertex; the arms are merged into the body, so
  an arm swing needs the arms as their own meshes (more draws: measure).
- The card's walkers are 2-frame sprites (`card_build.py`); leave the card alone in this change.

Ideas to plan from (not decided): a continuous phase (sine) for the legs instead of 0/1, speed-matched so feet don't
slide; a small bob and sway of the body; arms as two meshes swinging opposite the legs; reduced motion keeps today's.
Spec first with "not in this version" (`AGENTS.md`), measure draws and triangles before and after (`count.cjs` way in
README), `traffic_check.cjs` must stay all zero, campus-3d suite, before/after screenshots at phone size.

## Where things stand

- Live: sharper CoreCHI card (#177, b1103.1246); Kenney cars in 3D (#184, b1103.1529); notes "push is a button" (#181).
- Open changes: none. Check-ins: none.
- New rules this chat (in `AGENTS.md`/`CLAUDE.md`): "push" is always a clickable button, and Claude merges on Push;
  a phone notification when something goes live (from main, #180).
- Learned: the card capture pins the clock to noon NY (`card_page.cjs`), else windows render lit. Blender here: `pip
  install bpy==5.0.1` in a Python 3.11 venv. The tests' pinned Playwright needs `executablePath:
  '/opt/pw-browsers/chromium'` in cloud sessions (a `-r` preload that patches `chromium.launch`).
>>>>>>> origin/main
