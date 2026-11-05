# Handoff

Overwritten by each chat that hands over (rule: `docs/PLAN.md`, "A heavy chat hands over"). This one: 2026-11-05,
the second campus chat (tap a person, friendly weather; the campus list 2c is done).

## Paste this into the new chat

> Read `AGENTS.md`, `CLAUDE.md`, `docs/PLAN.md` (Next, items 0-4 and "Doctor list, next ideas") and
> `docs/handoff.md`. Tell me what was worked on before and what is next, in a few short lines. If I have pasted my
> phone's meter numbers or the five phone screenshots the feel audit asks for (`docs/feel-audit.md`), read them
> against it and say what they change; otherwise ask for them once and move on: ask me which doctor-list idea
> (search that also finds a doctor's terms and short forms, or compact rows with a mock-up first), write its spec
> note and wait for my go. Plain words, say "working on it" and "done". "Push" is always a button.

## Now: nothing in flight; the campus list is done

The campus work (`docs/PLAN.md`, item 2) is finished: the real map, the 3D view, the celebration (#213), tap a
person (#214) and the friendly weather (#217). Nothing is open. Next is Jose's pick from the plan:

- **Doctor list search that also finds a doctor's terms and short forms** (GI, cardio, peds): small, no mock-up.
  Spec note first (his rule), with "not in this version".
- **Compact doctor rows** instead of the two-column cards: a mock-up first (it reverses D3's cards).
- Also waiting on him only: publish `firestore.rules` in the Firebase console (K2, Term Review privacy); one
  memory-trainer round with Auto-mark on (M5).

Still owed by Jose (asked once per chat, then move on): the five phone screenshots (Ask the Hub and Team access with
the keyboard up; a doctor's page; the doctor list's A-Z strip; a toast), the meter's Copy numbers (More, bottom) for
four runs (open right after a deploy, open with nothing new, Home left alone 30 s, one slow scroll of Home), and
which iPhone and iOS. He picked "Later, move on" this chat. Also his call on the hello's canvas drawing (options
under Phase 2 in `docs/feel-audit.md`; leaving it is a fair answer).

## Where things stand

- **#214, live b1105.1156: tap a person for a word.** The people on the campus card in groups (five: the bench, the
  plaza, the path, the east door, Ethics' door), one 44 px spot each under the buildings' tap boxes (a wall still
  picks the building); three dots over the group holding the word; the card under the picture asks the English,
  Show gives the Spanish, Got it / Missed it saved as a Term Review answer (`saveTermReview`, confirm); the next word
  waits with another group; the CoreCHI streak untouched (Jose: "Term Review only"). Spec and as-built:
  `docs/features/campus-tap-person.md`. Checks: `campus-alive.cjs`, "tap a person" (16 cases).
- **#217, live b1105.1421: friendly weather.** The sun from a 3-day streak at the left of the sky (the side the
  scene's light comes from), a rainbow from 7 over the board behind the town; CSS only, sliding with the sky; the
  first drawing fades them in (`ih_campusSky`); a streak that ends takes them off and forgets them; nothing ever for
  a missed day. Spec and as-built: `docs/features/campus-weather.md`. Checks: `campus-alive.cjs`, "weather" (9).
  Main moved under it (#215 idea credits, #216 the chat keyboard, from another tool); merged in by hand, the New
  lately cards kept to three answers (credits, practice, places).
- Open changes: none. Check-ins: none. Nothing waits on Jose except the items above.

## Learned this chat (not in the docs elsewhere)

- **Two New lately cards must never share an answer:** a card's New badge is its answer's (`ih_guideSeen`), so two
  cards on the practice answer cleared together and `guide.cjs` ("opening one removes its badge") went red. Three
  cards, three answers; a second feature on the same screen shares the card's title.
- **The campus people are 2-5 css px tall on a phone** (0.37 css px per render px): a figure is never a tap target;
  the group is, and every group stands within 22 css px of a building's tap box, so the buildings must win where
  they overlap (spots before `.cp-bld` in the markup). Measured in `campus-alive.cjs` with `elementFromPoint`.
- **The scene's light is from the top left** (`.cp-card::before`'s warm glow, the Blender sun off frame there); a sun
  drawn on the card has to sit on that side, not where the sky is empty.
- **The worker can restart between a `PushNotification` and the `AskUserQuestion` that follows it;** after a restart
  nothing resends the button, so a check-in (`send_later`) that re-asks is worth keeping until Jose answers.
- **A merge of main into a branch:** resolve hunk by hunk, then grep `./app.css`, `./home-polish.css`,
  `./home-polish.js`, `./pin-icons.js` (with the `./`) to confirm the four files are still loaded, then run the
  suites the merge touched before pushing.
- Blocked hosts met this chat: `ac-pocketcamp.com`, `niantic.helpshift.com`, `nimblebit.com`, `developer.apple.com`
  (answers an empty page to a plain fetch), `blog.duolingo.com`, `forestapp.cc`, `www.nintendo.com`. To let a chat
  read them: Network access, Allowed domains, one per line.
- The tests' Playwright in a cloud session, Blender as `bpy`, the force push being refused, `frame-meter.cjs` on a
  busy runner, and a suite that reads right after `L.go`: see the previous handoff's notes, now in `docs/PLAN.md`'s
  Facts if they were moved there; otherwise the git history of this file (commit 9c45ff8).
