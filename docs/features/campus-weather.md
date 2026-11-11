# Campus: friendly weather for a study streak

Jose picked this on 2026-11-05 as the last campus piece (item 2c in `docs/PLAN.md`: "weather, the friendly half only:
sun and a rainbow for a streak, never snow for a missed day"). This is the spec, written before any code (his rule,
`AGENTS.md`, "How work is run"). His go the same day: "Go, as written".

## As built (2026-11-05, branch `claude/campus-weather`)

- `features/campus.js`: `CAMPUS_SKY = { sun: 3, bow: 7, at: [125, 100] }` (the streak days, and the sun's place in render
  px: left of the sky, under the ring, above the US Systems badge). `renderCampus` reads `st.days` (already in the
  card's `data-sig`, so a new day redraws), writes `.cp-sky-fx.cp-sun` (with an `<i>` for the rays) and
  `.cp-sky-fx.cp-bow` between the sky picture (`.cp-d-sky`) and the town (`.cp-d-far`), so the board and every badge
  draw over them; `is-new` on each the first time this phone qualifies (`ih_campusSky`, `{ sun, bow }`, rewritten on
  every drawing and removed when neither holds, so a streak that ends forgets them).
- `app.css` beside `.cp-d-far`: `.cp-sky-fx` slides with the sky (`translate` from `--dpx`/`--dpy`, the sky's own
  share). The sun is a 9.4 cqw disc (radial gradient, a soft glow) with a wide halo (`::before`) and twelve soft rays
  (`i`: a repeating conic gradient under a radial mask, `cpRays`, one turn in 60 s). The rainbow is a 93 cqw circle
  centred at 50% / 62% of the picture, its upper half kept (`clip-path`), six bands as radial-gradient stops at 34%
  opacity. First time: `cpSkyIn` 1.5 s (sun), `cpBowIn` 2.5 s (rainbow). Reduced motion: no animation on either;
  `is-away` pauses the rays; Still stops them through the page's rule.
- Checks: `tests/suites/campus-alive.cjs`, "weather" (the list under Checks below, all in; contrast within 0.5 not
  measured separately: the badges draw over the rainbow, its opacity is 34% and the suite's existing badge checks
  pass). Guide: a paragraph in the practice answer and its keywords (`guide/topics.js`); the first New lately card
  names the sky and the people together (`GUIDE_NEWS`, `index.html`; the three cards must be three answers).
- Not done from the spec: nothing. Beyond it: nothing.

## What it does

The sky over your HUMC campus on the CoreCHI Practice card answers your study streak (the days chip under the picture:
`readStreak().days`, a day counted once a question is answered, broken by a day with none). Two things can appear, both
earned, neither ever taken away as a punishment:

1. **The sun, from 3 days.** A soft warm disc with long faint rays at the left of the sky, under the readiness ring
   and above the Encounter badge, on the side the scene's light already comes from (the card's own top-left glow,
   `.cp-card::before`; the Blender sun is off frame there, so the shadows on the board agree with it). Its rays turn
   very slowly (one turn a minute). Three days is the first milestone the app already celebrates (`STREAK_DAYS`).
2. **A rainbow, from 7 days.** A faint arc over the whole board, behind the buildings, its top in the sky between the
   ring and Dr. Smiley's speech bubble, six soft bands at about a third of full strength so every badge stays readable.
   Seven days is the streak the app already rewards with the Week strong badge (`grant('week')`); the rainbow is the
   same milestone seen on the campus.

Both slide with the sky when the card scrolls or is dragged (the depth slide, `--dpx`/`--dpy`: they are far things, so
they move with `.cp-d-sky`, the farthest layer). Both are drawn in CSS (gradients, one transform animation), no new
pictures.

**When they appear.** The first drawing on this phone that qualifies fades the sun in over about 1.5 s (the rainbow
over 2.5 s); `ih_campusSky` remembers `{ sun, bow }`, so later drawings simply draw them, like the paint levels
(`ih_campusLv`) and the celebration (`ih_campusDone`). A streak that ends takes them off at the next drawing with no
animation and forgets them, so the next qualifying streak fades them in again.

**What never happens.** No rain, snow, clouds or night for a missed day or a short streak: a streak of 0, 1 or 2 days
is the plain daylight the card has today. Nothing is said about a lost streak. Dr. Smiley's line does not change.

Reduced motion: the sun and rainbow are simply there, no fade, no turning rays. Still: the rays stop (the page's
`.is-still` rule). Off screen (`is-away`): the rays pause with the rest of the card.

## Who it is for

Interpreters who keep a daily habit: a glance at the card shows the habit holding, in the scene, without a number.
The chips under the picture keep the exact count.

## Not in this version

- No weather for the real day (the real sky over Hackensack). The 3D view puts the sun where the real one is for the
  hour; the card does not, and this sun is the streak's, at a fixed place.
- No time of day on the card (the sky stays daylight), no sunset for an evening streak.
- No unfriendly weather, ever: no rain, snow, grey, wind, night or wilting for a missed day. (`AGENTS.md`'s rule for
  this piece.)
- No third stage (14, 30 days): sun and rainbow only. A longer streak keeps both.
- No change to the 3D view, the days chip, the Week strong badge or Dr. Smiley.
- No celebration moment when the sun or rainbow first appears (no fireworks, no line from Dr. Smiley): a fade, and it
  is there.
- No new pictures from Blender: CSS only, so a phone draws it for nothing.

## How others do it, and where this can be better

None of the pages could be read from this session (their hosts are outside the allowed network; to let a chat read
them, Network access, Allowed domains, one per line):

```
blog.duolingo.com
forestapp.cc
www.nintendo.com
```

So these are from memory, marked:

- **Duolingo, the streak.** A flame and a number; a missed day ends the streak and the app sells "streak freezes"
  against the loss. The design blog has written about the streak's milestones being the celebration. Lesson taken:
  milestones (3, 7) are the moments, and they are the app's existing ones. Where ours differs on purpose: no loss
  shown, nothing to buy.
- **Forest.** A tree grows while you focus and withers if you leave; the forest is the record. Lesson: the scene is
  the record, not a counter. Where ours differs: nothing withers (Jose's rule).
- **Animal Crossing.** The weather is the real world's; a rainbow after rain is rare and unearned, and players post
  about seeing one. Lesson: a rainbow is a treat because it is rare. Where ours is better: it is earned, and it says
  exactly what it means (a week).

## Checks (to add to `tests/suites/campus-alive.cjs`)

- A streak of 0 and of 2 days: no sun, no rainbow, `ih_campusSky` empty.
- 3 days: the sun, inside the sky (above the board's top edge), not under the ring or the speech bubble, left of the
  centre; no rainbow. Its rays animate (a turn, 60 s); the first drawing fades it in, the next does not.
- 7 days: the sun and the rainbow; the rainbow's six bands, its top in the sky, its element before `.cp-d-far` in
  the markup (behind the town and the board); badges' text contrast unchanged within 0.5.
- A drag moves them with the sky (same `--dpx` share as `.cp-d-sky`).
- Streak back to 0: both gone, `ih_campusSky` forgotten.
- Reduced motion: no animation on either; Still stops the rays.

## Guide

The practice answer (`guide/topics.js`, `practice`) gets a sentence: study three days in a row and the sun comes out
over the campus, seven and a rainbow; nothing bad ever happens to the sky. A New lately card takes a slot (the three
cards must be three answers; this one would share the practice answer with tap a person, so tap a person's card
gives way, both being in the same answer).
