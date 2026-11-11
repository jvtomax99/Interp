# PLAN — what's next

The working list. At the start a session reads `CLAUDE.md`, `AGENTS.md`,
`HANDOFF.md` (if there is one), the short map at the top of
`docs/ARCHITECTURE.md` and this file, and nothing else. Two files
hold the rest, for looking things up, never for reading whole:

- `docs/PLAN-done.md`: every finished phase, newest first. "Checked off"
  means a phase is there.
- `docs/FACTS.md`: what past chats measured or settled, so nobody
  re-checks. Search it (`grep -n -i "tab bar" docs/FACTS.md`) for the
  screen or file you are about to touch, before measuring or retrying
  anything.

Don't reread old chats: anything worth keeping is written in these three.
Code comments and older notes that cite a finished phase "in
`docs/PLAN.md`" (S1 to S9, F1, F2, M0, K1, item 2c, "Facts") mean
`docs/PLAN-done.md` and `docs/FACTS.md`.

## How a session runs

1. Fetch `main`. Read the files above, then only the code the phase
   touches (banner comments in `index.html` to navigate), its note in
   `docs/features/` if it has one, and what `docs/FACTS.md` says about it.
2. Take the top phase under **Next**. One phase, or one group of related
   changes. Nothing else.
3. Plan it in a few lines; if it needs Jose (a decision, a console check),
   ask first and stop.
4. Do it. Check it: `node --check`, the four checks in `CLAUDE.md` for
   `index.html`, `cd tests && node run.cjs`.
5. In the same branch: take the phase out of **Next** and put it at the top
   of `docs/PLAN-done.md` (one line, PR link); add what
   you learned to `docs/FACTS.md`; add new work you found under **Next**,
   **Waiting on Jose** or **Later**. A bug you found and did not fix goes
   under **Later**, never only inside a finished phase's entry.
6. Push the branch, open a pull request, report to Jose in 2-4 lines.
   He says "push" (or "merge") when a green PR should go live: that means
   merge it into `main`, which deploys. Nothing merges without him. Never
   delete anything he hasn't approved.
7. Next phase: in the same chat until a new-session trigger hits.

**A chat hands over with `HANDOFF.md` at the repo root** (Jose, 2026-11-10;
the first rule, 2026-10-20: "Whenever a chat gets extremely heavy and
expensive, hand me a handoff.md to start in a new chat. It's to be able to
use you for long period of time"). The triggers are in `CLAUDE.md`, "New
session triggers": about 150k tokens or half the context, finish the step,
then hand off; over 300k or 75%, hand off now; over 100k with an unrelated
next task, or with Jose back after an hour away, hand off too. A finished
job alone is no reason.

When a trigger hits:

1. Write everything worth keeping into the notes, as in step 5.
2. Overwrite `HANDOFF.md` (short, pointing to what exists): at the top the
   exact message to paste into a new chat; the goal and the exact next
   step, with the pick; what is merged, which PRs are open and what each
   waits on, pending check-ins; open questions for Jose; what this chat
   learned that isn't in the notes yet; the files to look at first.
   Commit and push it, and send it to Jose with `SendUserFile`.
3. Ask once with `AskUserQuestion` (buttons, never only text to paste;
   Jose, 2026-10-23 and 2026-10-25): **"Start a new session"** first as
   the pick, **"Keep going"** second, the question carrying a short
   summary (what is being worked on now and its goal). On "Keep going",
   don't ask again until the next trigger; past 75%, warn him once. Where
   the buttons are missing, one plain line instead. On "Start a new
   session", start it yourself (`create_session`, same repository, titled
   with its focus in plain words, "Campus code to its own file"; Jose,
   2026-10-24): its first message is the whole of `HANDOFF.md` plus a
   short summary of this chat, and Jose gets its link. Where
   `create_session` is missing, give him the exact message to paste.
   (These two buttons, Jose's of 2026-11-10, replace the older pair "I
   start it for you" / "I'll paste it myself": one question, not two.)
4. The same reply gives Jose a fresh summary in two parts, a few plain
   lines each, never a big block of text (Jose, 2026-10-24): what is being
   worked on now and its goal, and what was worked on before (this chat's
   changes and where each stands).
5. Leave nothing half-done: an open PR is fine (the handoff names it), an
   uncommitted change is not. Cancel this chat's check-ins; the new chat
   re-arms what it needs. Then say "Archive this chat".

The new chat reads `HANDOFF.md` first, opens with the same two-part
summary, says in 2-3 lines what it will do, confirms the next step with
Jose and waits for his go. `HANDOFF.md` is deleted once its work is done
(the phase in `docs/PLAN-done.md`, or its pull request opened).

**When a chat is done, say "Archive this chat"** (Jose, 2026-10-18: he
wants to stay organized). A chat is done when nothing in it is still
waiting: its PRs are merged or closed, no question to Jose is open, no
check-in is pending, and everything worth keeping is in the notes. Say it
once, at the end of that reply, with a one-line reason ("PR #52 merged,
nothing open"). A chat left for a new one is done too: say both. Not when
a phase finishes but the next phase continues here.

## Next (in order)

Nothing is queued. The cleanup audit ran on 2026-11-11: its list is
`docs/CLEANUP.md` (20 items; the low-risk ones, 1 to 3, 18 and 19, were cleaned the same
day, the rest wait for Jose's pick).

The feel audit, the `index.html` split, the campus
(2a to 2c), email sign-in (E1 to E3) and regions (R4) are finished
(`docs/PLAN-done.md`; their old entries from this list are kept there under
"Moved out of Next, 2026-11-10"). Ask Jose what's next,
with buttons.

## Waiting on Jose (nothing to build until he does)

- **Feel audit:** five phone screenshots (Ask and Team access with the
  keyboard up; a doctor's page, the doctor list's A-Z strip, a toast) and
  his frame-meter numbers.
- **The hello's canvas draw** is the opening's floor now: his call (the
  options are in `docs/feel-audit.md`).
- **The opening, Badge in:** his OK (live since b1105.2126). Ideas offered
  2026-11-05, not picked: a quick second open later the same day; drag the
  badge onto the reader with better sounds. Later, if he asks: tilting the
  phone to swing the badge, playing on a computer. Not checked: how
  smoothly Dr. Smiley's full-body clip plays on a real phone.
  `docs/features/opening.md`.
- **Tool banners:** his OK. The later ideas (thinking trace, card stack,
  practice certificate, Meshy equipment drill, spinning pins) are listed in
  `docs/features/tool-banners.md`.
- **Practice scenes** (the doctor, nurse and visitor as the memory
  trainer's speakers): built on `claude/practice-scenes` (#197).
  `docs/features/practice-scenes.md`.
- **M5, auto-marking (#91):** one memory-trainer round with Auto-mark on,
  and one with Record me on too.
- **D1c, the doctors redesign** (`docs/mockups/doctors/d1-review.md`): the
  real-data replay (he sends `doctors.json`, steps in the review); the
  5-minute interpreter test on iPhones (Spanish voice on ES included).
- **K2, Term Review privacy (#117):** publish `firestore.rules` in the
  Firebase console. Probably done: every rule was published on 2026-11-07
  when the Hub locked. Nobody has ticked this line off; ask him once.
- **Sound-Alikes:** check the Spanish (`esChecked`).
  `docs/features/sound-alikes.md`.
- **OB/GYN shows the cardiology heart** as its pin: asked whether that's
  meant, no answer on record.
- **Liz's title:** give it on Team access once she signs in by email.
- **`SPEC.md`:** the lines marked TO FILL.
- **The rules block in `CLAUDE.md`:** whether to remove from it what his
  claude.ai preferences already say (his call, left open 2026-11-10).
- **Branch protection on `main`** (his call): the job to name is "App
  checks result"; it needs an exception for the bump-version Action.
- **Doctor list, next ideas** (the 2026-11-03 review; he picks): compact
  rows instead of two-column cards (mock up first: it reverses D3's
  cards), and search that also finds a doctor's terms and short forms (GI,
  cardio, peds).
- **`CRON_SECRET` in Vercel** (asked 2026-11-11, no answer yet): the
  events watcher checks its caller's secret only when that setting exists
  (`api/check-events.js`, `if (secret && ...)`), so without it anyone can
  start a run. Look under Settings, Environment Variables; if it is
  missing, add it.
- **The tests' browser on the cloud machine** (2026-11-11): the machine's
  Chromium moved ahead of the Playwright the tests pin, so each chat has
  to point the tests at it by hand (`docs/FACTS.md`). His pick: a line in
  the environment's setup script, or moving `tests/` and the WebKit
  image to the Playwright that matches.
- **After South joins:** look at Firestore reads (Usage page) a week
  later. More people means more reads at every launch; the 50K/day trigger
  under Later may come from this alone.

**Smoothness is parked** (Jose, 2026-10-26: scrolling Home feels fine).
No more scroll work unless he notices a hitch; then ask what moves badly:
the page, or something on top of it like Dr. Smiley's lean or the tab bar.
The S-steps and their numbers are in `docs/PLAN-done.md`.

## Later (only when the trigger happens)

- **Found in Jose's slow Wi-Fi recording (2026-11-08), not fixed.**
  Trigger: he sees one again, or asks. An apparent restart on CoreCHI
  Practice while the campus loads (likely memory); the tab bar over the
  opening for about 1 s; Team Chat's messages vanishing about 1.2 s when
  the box is tapped.
- **Not measured on his iPhone yet:** the slow Wi-Fi fix (its numbers are
  from the cloud machine), the campus's new trees and leaves in the
  3D view (2026-11-07 and 11-08).
- **Team Chat's thread tuck reads `scrollTop` in the scroll event** (from
  S7). Cheap while layout is clean; measure in Team Chat before touching.
- **Back to a scrolled Home opens the tab bar, then tucks it again** (two
  morphs, about 20 ms at 4x, never seen). Skipping the open was tried and
  dropped (`docs/PLAN-done.md`, "Smoothness: parked"); fixing it changes
  whether the bar ends open, so it needs Jose.

- **Notes that have drifted from the code** (found 2026-11-10 by a sweep
  of every note; a helper's report, the lines marked "checked" re-run by
  hand). Trigger: the next time a chat touches that note, or Jose asks for
  the notes pass.
  - `AGENTS.md` (needs Jose's OK to edit): "Features are moving out of
    `index.html`" still reads as under way; the split finished 2026-10-25.
    (Its four other stale lines were fixed on 2026-11-11 with his OK.)
  - `docs/ARCHITECTURE.md`, Full file map: 11 line counts off by more than
    10% (checked three: `features/opening.js` 291 there, 655 now; `sw.js`
    220, 409; `features/campus.js` 157, 359); `pins/` given as 41 files
    (57), `city/` as about 130 (150). Either re-measure by script or drop
    the counts.
  - `tests/README.md`: 24 of the 55 suites in `run.cjs` have no row in its
    table (the account, campus, opening, feel and tool-banner suites among
    them); "about 8 minutes" and "about 40 minutes" both appear.
  - `docs/features/`: names no longer in the code (checked:
    `DOCTOR_ADD_BTN` in `doctor-page.md`, `IDLE_TUCK` in `tab-bar.md`,
    `.cp-litsel` in `practice-dashboard.md`, now `.cp-paintsel`; reported:
    `.cp-lit`, `.cp-litw`, `.cp-bay` there, `.is-tool` in
    `tool-banners.md`, `http_ece` in `notifications.md`, `pavilion-2` and
    `music-2` in `opening.md`); status lines that say a shipped feature is
    still waiting (`campus-celebration.md` line 5, "Waiting for his go";
    `opening.md`, "How it will be built"; `tool-banners.md`, "as planned").
  - `docs/split-index.md` opens with "1.86 MB, 31,738 lines" and reads as
    if phase 3 were under way; `docs/feel-audit.md` still says "Next,
    Jose's call" for the hello's canvas with no decision recorded.
  - `promo/hub-blend/SHOTS-60s.md` says the music is not done;
    `BRIEF-60s.md`, later, says it is.
- **Leftovers from the type work (2026-11-03).** Trigger: the next look
  pass. 8 inline `font-size` px in script (`index.html`, `features/csv.js`,
  `features/translate.js`); the serif-era headings at 400 (`DESIGN.md`,
  Known gaps, Jose's call).

- **Startup, draw less at first (from S3b).** Trigger: Jose finds opening
  the app slow on his phone. Home's first draw is the worst startup task
  (~720-890 ms at 4x on the S3b machine): script ~half, style + layout of
  the new Home ~half, both over 200 ms. Draw what's on the first screen
  first, the rails more than 1.5 screens down (284 of Home's 669 elements)
  a frame later; projected ~1/3 off, not under 200 ms. Don't retry moving
  the layout reads to the frame (`docs/FACTS.md`, "S3b measurements"). Other leads,
  unmeasured as fixes: `watchDomainDock` writes `--dock-top` on `<html>`
  every render (a new value restyles the page); the name pen's `tick`
  reads two rects per frame (20-45 ms frames at 4x during the opening).

- **Glossary changes-only sync.** Each cold start reads every term (~1,700
  reads; persistence is off on purpose, iPhone crashes). Do it only if
  Firestore reads near 50K/day (Usage page). Was 23K on 2026-10-13.
- **Reduced motion, softer.** With Reduce Motion / Still, the name has no
  pen. Option: a short fade instead. Jose's call.
- **Dr. Smiley's three frames with a white edge** (lookU, halfL, lookUR;
  see `docs/FACTS.md`). Trim the eye patch's edge in `face.webp`. When Jose wants it.
- **Training & Events listener has no limit.** Fine while small; a cap
  breaks the unread badge (it counts events), so it needs a new badge rule.
