# PLAN — what's next

The working list. At the start a session reads `AGENTS.md` (Claude: `CLAUDE.md` too),
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
4. Do it. Check it: `node --check`, the four checks in `AGENTS.md` for
   `index.html`, `cd tests && node run.cjs`.
5. In the same branch: take the phase out of **Next** and put it at the top
   of `docs/PLAN-done.md` (one line, PR link); add what
   you learned to `docs/FACTS.md`; add new work you found under **Next**,
   **Waiting on Jose** or **Later**. A bug you found and did not fix goes
   under **Later**, never only inside a finished phase's entry.
6. Cleanup check: read "Last audit" at the top of `docs/CLEANUP.md`. If 3
   phases have been finished since then, or it's been over 30 days, or the
   file is missing, offer `docs/cleanup-audit.md` with buttons: "Run it
   now" (the pick), "Next session", "Skip this time". If
   `cleanup-audit.md` is missing, ask Jose for the prompt and save it
   there.
7. Push the branch, open a pull request, report to Jose in 2-4 lines.
   He says "push" (or "merge") when a green PR should go live: that means
   merge it into `main`, which deploys. Nothing merges without him. Never
   delete anything he hasn't approved.
8. Next phase: in the same chat until a new-session trigger hits.

**A chat hands over with `HANDOFF.md` at the repo root** (Jose, 2026-11-10;
the first rule, 2026-10-20: "Whenever a chat gets extremely heavy and
expensive, hand me a handoff.md to start in a new chat. It's to be able to
use you for long period of time"). This is the only copy of the handoff rules; `AGENTS.md` and `CLAUDE.md`
point here.

**New-session triggers** (tokens or share of context, whichever comes
first; a new session costs 20k to 40k to catch up; a tool without a token
count uses its best estimate):

- Under 150k or 50%: keep going.
- 150k to 300k, or 50% to 75%: finish the step, then hand off.
- Over 300k or 75%: hand off now, even mid-task.
- Over 100k and the next task is unrelated: hand off.
- Over 100k and Jose says he's been away over an hour: hand off.

A finished job alone is no reason.

When a trigger hits:

1. Write everything worth keeping into the notes, as in step 5.
2. Overwrite `HANDOFF.md` (short, pointing to what exists): at the top the
   exact message to paste into a new chat; the goal and the exact next
   step, with the pick; what is merged, which PRs are open and what each
   waits on, pending check-ins; open questions for Jose; this chat's
   decisions (also added to `SPEC.md`) and what it learned that isn't in
   the notes yet; the files to look at first.
   Commit and push it, and send it to Jose with `SendUserFile`.
3. Ask once with `AskUserQuestion` (buttons, never only text to paste;
   Jose, 2026-10-23 and 2026-10-25): **"Start a new session"** first as
   the pick, **"Keep going"** second, the question carrying a short
   summary (what is being worked on now and its goal). A new chat is made
   only when he picks it. On "Keep going", don't ask again until the next
   trigger; past 75%, warn him once and write `HANDOFF.md` anyway
   (auto-compact is off, so a full session just stops). Where
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
`docs/handoff.md` is older notes (last written 2026-11-07), left as it is.

**When a chat is done, say "Archive this chat"** (Jose, 2026-10-18: he
wants to stay organized). A chat is done when nothing in it is still
waiting: its PRs are merged or closed, no question to Jose is open, no
check-in is pending, and everything worth keeping is in the notes. Say it
once, at the end of that reply, with a one-line reason ("PR #52 merged,
nothing open"). A chat left for a new one is done too: say both. Not when
a phase finishes but the next phase continues here.

## Next (in order)

1. **Database rules, change 2 of 2: written and tested, waiting for Jose to
   paste them** (2026-11-18; `docs/features/deleted-items.md`, "The rules").
   Once its pull request is merged, Jose copies the rules live in the Firebase
   console into a note (the undo), then pastes `firestore.rules` and
   `storage.rules`. After that: a teammate's phone tries the everyday actions
   (send, edit and delete its own message, react, add, delete and restore a
   term), and this item moves to `docs/PLAN-done.md`.

2. **Consistency pass** (Jose, 2026-11-25: "All", after the 2026-11-24
   audit). The visible tells left. Corners and the button shadow are done
   (the corner-scale pull request, 2026-11-25: five `--r-*` sizes, Jose
   OK'd them from three before and after screens; `corner-scale.cjs`
   holds them). The top bar's round buttons are done too (2026-11-25:
   still drawn 36px, tapped across 44, Jose's pick from before and after
   screens; `topbar-name.cjs` holds it). So are the search hints
   (2026-11-25: shorter "two things" wording that fits a 360-wide phone,
   the same on a computer, his picks; `search-hints.cjs`). So are the
   heading levels (2026-11-25: one title per screen, his pick; every
   screen's title is its `h1`, no level skipped, nothing moved on 39
   phone screens; `heading-levels.cjs`, the rule is in `DESIGN.md`).
   The small things found on the way are picked, done and live (Jose,
   2026-11-25; #294, build b1126.0026, undo: revert #294; `small-picks.cjs` and `topbar-name.cjs` hold them): at 360
   wide, inside a screen with a badge that stays (offline, unsent
   changes), the logo steps aside so "Interpreter Hub" is whole (the
   badge was already only a dot, so it could not shrink; not during the
   few seconds of "Syncing", where the title would jump on every save);
   False Friends and Recent Updates lost the glossary search bar that
   searched nothing there; while a doctor's page is open the screen
   behind it is `inert`, so a screen reader finds one title. A Term
   Review session stays without a banner (his pick: the card is the
   screen). Asked the same day: buy a name to replace
   `interp-six.vercel.app`? "Not now" (41 phones would re-install).
   The stress checks:
   - While there, on every screen: a 60-character doctor name, a very long
     term, a long chat message with no spaces; each failure forced (offline,
     AI down, storage refused) and its message read.
     Found 2026-11-25 (`tests/tools/stress.cjs` and `stress-fail.cjs`, phone
     393 and 360 wide; Jose has the screenshots, nothing fixed yet).
     Long text, a 45-letter word with no space: it runs off the card on
     Home's Recent Team Activity and on Recent Updates, runs under the
     "..." button and off the screen on a term card, and is cut with no
     "..." in the search panel; a 60-character name runs under the edit
     and delete buttons on a Provider Pictures card. Fine: chat, Ask the
     Hub, a doctor's card and page, the briefing, Recently deleted, the
     edit sheets. Failures: Save doctor offline does nothing and says
     nothing (a bare write, `persistDoctorDirectoryEntry`; providers,
     chat delete and term attachments are written the same way, the
     provider case read in the code only); Doctor Prep shows the raw
     words "daily_limit" and "members_only"; a refused term or doctor
     save shows the developer's sentence about Firestore rules and
     "[permission-denied]"; a refused chat message says "Check your
     connection"; a failed photo upload shows the raw error text (term
     attachment, provider photo); Term lookup calls the daily limit
     "usually temporary"; deleting a chat message offline says nothing.
     Good as they are: chat and terms offline (saved on the phone, the
     badge counts them), phone storage full, Ask the Hub's five messages,
     Translate, sign-in. Not tested: "my photo" when the upload fails.
     Fixed and live the same day (#292, build b1125.2244; `stress.cjs`
     holds all twelve; undo: revert #292): the five cards wrap the long text; the seven
     failures say what happened in plain words. Left for later, Jose's
     call: doctors, providers and chat deletes still need a connection
     (they now say so, as do a doctor's tip and team term, an event, a
     file on a term and removing an update); putting them in the outbox
     like terms is a data change with its own plan. Until then, on
     Wi-Fi that is connected but dead (the phone still says it is
     online) those saves still wait with no message: they have no
     timeout, and one can't be added safely to a write that may still
     go through later (found by the cold review, not fixed).
     Jose, 2026-11-25: write that plan (no code) once Check link is
     live; he decides then.
3. **Check link: live and confirmed by Jose** (#295, build b1126.0110;
   2026-11-26: "Both answers were right" on a working link and a dead
   one). Left: he shows the team the working button. If the short
   address beside Check on a phone's row bothers them, Check moves to its
   own line (rows about 50px taller).
4. **Kept-on-the-phone saves: the plan is OK'd, four steps, one change
   each** (`docs/features/kept-on-phone-saves.md`; Jose, 2026-11-26:
   "All four steps"). Step 1, team terms added and removed one at a
   time (a live bug: an old copy erased a teammate's term), is live
   (#297, build b1126.1318; undo: revert #297). Step 2 is built (a
   doctor, a tip and a doctor's team term are kept with no signal;
   `docs/PLAN-done.md`). Next: step 3,
   providers, events and chat delete (the wording for a delete that
   teammates still see until the phone reconnects is in the plan, risk
   2; worth asking the team). Measured in step 2: providers and events
   are not kept on the phone, so they don't show on a cold open with no
   signal; step 3 helps them when the signal drops mid-visit or the
   Wi-Fi is dead. `filesAfter` is ready for the chat delete. Then step
   4, an upload that stalls says so. Files themselves stay "needs a
   connection".
5. **Smaller files: a plan for Jose to OK, no code first** (same ask).
   `index.html` is 1.0 MB and `app.css` 556 KB, sent as written, comments
   and all. Shrinking them needs a build step, which this project has
   avoided on purpose (`AGENTS.md`, Deploying: "There is no build step"),
   and touches the version bump, the offline worker's file list and the
   tests' harness. Write what would be built and how, the numbers before
   (transfer size, time to Home on slow Wi-Fi from `slow-open.cjs`), the
   assumptions, and what can go wrong; he decides.

Waiting on Jose's pick: the repo scan's other picks (`docs/FACTS.md`).

Nothing else is queued. The cleanup audit ran on 2026-11-11: its list is
`docs/CLEANUP.md` (20 items; the low-risk ones, 1 to 3, 18 and 19, were cleaned the same
day, the rest wait for Jose's pick).

The feel audit, the `index.html` split, the campus
(2a to 2c), email sign-in (E1 to E3) and regions (R4) are finished
(`docs/PLAN-done.md`; their old entries from this list are kept there under
"Moved out of Next, 2026-11-10"). Ask Jose what's next,
with buttons.

## Waiting on Jose (nothing to build until he does)

- **Security audit, 2026-11-15: the rest of what it found** (the two serious
  holes were fixed, `docs/PLAN-done.md`). Each needs Jose's pick; the first
  two need a plan he OKs, because tightening them can lock teammates out.
  1. *(Planned and OK'd, 2026-11-15: change 1 shipped as the app side, change
     2 is Next item 1.)* *The database trusts every member completely.* `firestore.rules` lets
     any joined phone delete or rewrite every term, doctor, provider and
     the deleted-items bin, edit or delete anyone's chat message, and post
     under any author name (omit `uid`). The app hides those buttons; the
     rules don't refuse them. `storage.rules` accepts any file type and size
     under `attachments/`.
  2. *No per-person cap on the AI endpoints* (`api/_hub-access.js` only
     checks membership): one leaked team code is an open Anthropic bill.
     Also set a monthly spend limit in the Anthropic console.
  3. *Smaller:* no security headers on the main app (`vercel.json` sets them
     only for `atlas/`); sign-in says whether an email is on the team
     (404 `no_account`); restrict the public Firebase web key to the Hub's
     address in Google Cloud; the Firebase SDK loads without an integrity
     hash; `hub-invites` codes can be guessed with no throttle (32^8).
  Not checked from the cloud: the rules actually published in the Firebase
  console (the repo file is a copy).
  Also from the reviewer, not fixed: photo addresses (providers, doctors,
  chat) can point at any https site, so every phone that shows one loads
  it and that site sees the phone's IP address; the per-phone code limit is
  per sign-in, and fresh anonymous sign-ins get round it (the 3 codes an
  hour per address still holds, so at most 15 guesses an hour per account).

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

- **Left by the 2026-11-24 audit, for Jose** (the rest moved to Next).
  1. *The address is Vercel's free one* (`interp-six.vercel.app`). A name of
     his own costs about $12 to $20 a year and is his to buy. The address
     is then changed in five places: `index.html`'s head (canonical,
     `og:url`, both image tags), `robots.txt` and `sitemap.xml`
     (`site-front.cjs` checks they agree). Not checked yet: whether the
     email sign-in (Firebase's allowed domains) and the notification
     links also name the old address.
  2. *The repository is public and says an AI wrote the code*
     (`CLAUDE.md`, `AGENTS.md`, the commit trailers). Making it private
     is a setting only he can change; he was given the steps on
     2026-11-25.
  3. *Long dashes still shown, on purpose:* terms the team typed into the
     glossary, and `HMH_NETWORK_LABEL`, which saved doctor records may hold
     word for word. The AI's answers are asked not to use them
     (`PLAIN_PUNCTUATION` in `api/_routine.js`); that lowers how often,
     it can't promise none.

- **Merging duplicate doctors bins the duplicate from this phone's copy**
  (found by the cold review, 2026-11-26; older than the team-terms fix).
  A tip or team term a teammate added to the duplicate after this phone
  opened is in neither the doctor kept nor the bin copy. Also: the merge
  drops same-English team terms against this phone's copy only, so
  "bolus" added to the kept doctor by a teammate meanwhile and "Bolus"
  on the duplicate both stay. Fix: read both doctors fresh from the
  database before a merge. Trigger: step 2 of kept-on-the-phone saves
  touches the merge, or Jose asks.

- **`campus-3d.cjs` fails by season, on main too** (found 2026-11-18). "8:00
  am: the sun is left of the middle" reads the real date; by mid-November
  the 8 am sun sits at x -19 against a limit of -20, so every pull request
  goes red on that one check until spring. Pinning the date failed both
  ways tried: `page.clock.setFixedTime` mid-run freezes the sun's own
  animation, and `page.clock.install` before boot stops the app's timers.
  The fix belongs in the campus code: let the slider take a date, or compare
  against the sun's real azimuth for the date instead of a pixel limit.
  Trigger: next change to the campus, or Jose asks.

- **The domain list can be swapped for a same-length one** (found by the
  rules review, 2026-11-18). Rules can't compare two lists item by item; a
  member could replace every domain at once. Options for Jose: Google's
  daily backups (needs the paid plan), or a write-once history of the list
  that each save must add to. Trigger: Jose picks one, or it happens.

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
