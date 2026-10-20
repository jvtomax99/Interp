# PLAN — what's done, what's next

The working list for every session. Read this, `AGENTS.md` and `CLAUDE.md`,
then do the next phase, one per pull request. Don't reread old chats: anything worth keeping is
written here.

## How a session runs

1. Fetch `main`. Read `AGENTS.md`, `CLAUDE.md`, this file. Read only the
   code the phase touches (banner comments in `index.html` to navigate)
   and its note in `docs/features/`, if it has one.
2. Take the top phase under **Next**. One phase, or one group of related
   changes. Nothing else.
3. Plan it in a few lines; if it needs Jose (a decision, a console check),
   ask first and stop.
4. Do it. Check it: `node --check`, the four checks in `CLAUDE.md` for
   `index.html`, `cd tests && node run.cjs`.
5. In the same branch, update this file: move the phase to **Done** (one
   line, PR link), add what you learned under **Facts**, add new work you
   found under **Next** or **Later**.
6. Push a branch, open a pull request, report to Jose in 2-4 lines.
   He says "push" (or "merge") when a green PR should go live: that means
   merge it into `main`, which deploys. Nothing merges without him. Never delete anything he
   hasn't approved.
7. Next phase: in the same chat while it's still light (see below).

**One chat, no handoffs** (Jose, 2026-10-20: "no new chat anymore"; and
earlier the same day: he doesn't archive chats). Finish a phase, carry on
with the next one in the same chat. Never say "Start a new chat" or
"Archive this chat", and don't open a new session to hand work over. The
docs still carry everything worth keeping (a long chat gets compacted, and
other tools read them).

## Next (in order)

**Dr. Smiley acting, E3 (Jose, 2026-10-19: "expressive like Disney
characters"; E1 and E2 done: E2 is the four drawn faces, surprised, sad,
worried, doubt, in `docs/features/dr-smiley.md`).** E3 needs his yes: squash and stretch on the head as he springs and
lands (he had the Home greeting's squish removed; show him first).

**Feature-film look (Jose's brief, 2026-10-19; his picks after the trade-offs).**
One PR each, after M2 (#73):
F1. **Dr. Smiley reacts in quizzes** with current art: a bounce on a right
   answer, a small wince (E2 worried face) on a wrong one (`DR_REACTS.think`
   exists but nothing calls it), a cheer at streak milestones. Upgrade when
   Jose sends: head and shoulders as separate layers (base.webp canvas, neck
   pivot), two arm poses (both up; one fist pump), two face frames (happy
   eyes-closed, wince). Layers, not Rive.
F2. **Squash and stretch: Practice buttons and the streak flame only**
   (spring press, overshoot and settle on pills and cards). Dr. Smiley's
   own squash is E3 (#74, 4%, Jose's pick there), not this. Headings stay
   Inter (rounded face declined).
F3. **Campus regrade + tilt:** keep the pre-render (real-time three.js and
   r3f declined: no build step, weight, unproven 60 fps). Re-render golden
   hour, peach to lavender sky, warm rim light, more haze toward the
   horizon, nothing pure black or gray; tilt parallax from layers
   (device tilt, reduced-motion off). Full re-render (~25 min, lit set too).

**Memory trainer (Jose approved 2026-10-19).** Consecutive interpreting
practice: the phone reads a line, you render it, you tap the meaning chunks
you missed, the line length follows your span, your span is charted over
weeks on your phone. Design and decisions: `docs/features/memory-trainer.md`.
Jose's choices: Claude drafts the lines, he checks every Spanish line; M0
first; notes toggle, memory-only default. One PR each:

M0. **Voice and mic check** (#60, merged). Installed-app results in the
   note: recording works in both, voice quieter after the mic (app),
   speech to text works in a Safari tab (English) but gave no words yet in
   the installed app. **Needs Jose:** installed app, speech to text in
   English and Spanish, waiting for "done" before Copy.
M1. **Lines** (#69, merged): `memory/lines.json`, 60 lines approved by Jose
   without a line-by-line read (see the note); the trainer flags mistakes.
M2. **The trainer** (this PR; built as in the note's M2 section; flags go
   to `terminology-meta/memory-flags`, Jose's pick). Screen under Practice, playback with the text
   hidden and a ring, your turn, the chunks to tap, longer/shorter steps,
   Dr. Smiley's listening/thinking states, progress in `localStorage`
   only, notes toggle, a **Flag this line** button (saves line id + what's
   wrong, read back before editing lines). Voices by name: Paulina (es-MX),
   Samantha (en-US). User Guide, a suite.
M3. **Record yourself, play it back beside the model** (built, PR on top of M2; Record me off by default; see the note's M3 section. **Needs Jose:** Voice check, step 3, Try the volume fix, say if it's as loud). Record and play
   back work in the installed app (M0). The voice is quieter after the
   mic: first test `navigator.audioSession.type = 'playback'` after each
   recording (a button in the check); if it fails, play every line before
   opening the mic and tell people to use earbuds.
M4. **Span chart** (weeks) and the span number on the Practice tile (built, PR on top of M3; chart on the trainer's start card under Start, the tile's span is M2's; see the note).
M5. **Auto-marking** from speech to text. Only if M0 shows it works in
   the installed app. Matching on the phone; Haiku (`_routine.js`) only
   for the chunks that look like paraphrases; text only, never audio.

**Smoothness: feel like iOS on an iPhone (Jose approved 2026-10-15).**
Measured first (`tests/tools/perf.cjs`, iPhone size, CPU 4x, Chromium as a
stand-in for Safari; compare the median of 3 runs, startup varies 2x between
runs). One PR per step, re-measure after each, User Guide only where something
visible changes. Order approved; S1 approved ("Home rests after arrival").
**Rule (Jose, after S1): visuals never suffer.** Every S-step keeps the
look and motion identical; anything that would change what he sees (S5's
new springs included) is shown to him first.
Baseline 2026-10-15: idle Home 95% busy (reduced motion: 6%); taps on Home wait
109-251 ms before their handler runs (View all 312-440 ms to paint, name sheet
392-456, More 360-408, a domain 288-368); startup worst task 395-676 ms,
40-73 long tasks; 30 animations not transform/opacity.

S1b. **Home taps, still slow (found in S1).** With Home at rest (#37), taps still
   wait 59-90 ms (median, 4x) against the < 20 ms target. They are timed
   ~2 s after an arrival on Home, so arrival work (render, the shower's
   start, `ih:home-paint`'s forced layout) and the tap's own pointer/touch
   handlers (`drInputEvent` and two `pointerdown` listeners: ~38 ms from
   pointerdown to click on a fully rested Home) are what's left. Goes with
   S3 and S4; re-check the target after them.
   Petals done (S1b PR): one canvas per place, painted from a worker, same
   look (frame-by-frame comparison in the PR). Medians of 6 interleaved
   perf.cjs runs, before -> after: idle Home settled 75% -> 24%, first
   window 95% -> 53%; tap waits View all 185 -> 84 ms, domain 165 -> 84,
   name sheet 143 -> 82, More 140 -> 81 (More was missed in 2 of 6
   before runs, 0 after); startup long tasks 76 -> 39 (first visit), worst
   task 497 -> 438 ms. Still open here: taps wait ~80 ms against < 20 ms;
   left for S3/S4 (arrival work, `ih:home-paint`'s forced layout, the
   pointer handlers), then re-check.
   **#40 (merged 2026-10-15): WebKit keeps the old petals.** The worker
   painter (OffscreenCanvas) crashed the WebKit page in CI (1 cold load in
   6; the old CSS petals 0 in 6). Jose's call: iPhones and Safari keep the
   old CSS petals, Chromium (Android, computers) gets the worker painter.
   `PETALS_AS_DOM` in `home-polish.js` picks by engine (`AppleWebKit` and
   not `Chrome/`, `Chromium`, `Edg/`; every iOS browser is WebKit); the
   DOM path writes the same seeded petals with the old inline styles and the
   old `.home-petal` CSS. Same look: styles identical to b970868, reduced
   motion pixel-identical, moving frames within run-to-run noise. home-rest
   checks both (an iPhone Safari user agent in Chromium takes the old path).
   So the S1b numbers above are Chromium's; iPhones are as before S1b.
Later, not Home (from S7): Team Chat's thread tuck reads `scrollTop` in
   the scroll event (index.html ~20912); cheap while layout is clean,
   measure in Team Chat before touching.
S4. **Glossary taps.** 2026-10-19 (Facts, "S4 first look"): removing the
   handler's forced layouts only moves the cost to the next reader or the
   frame; tap-to-paint unchanged. Not worth doing as planned; what's left
   is the new screen's own render work. Original note: a domain tap's handler is 117-207 ms, ~144 ms of it
   forced layout (`getClientRects`, `getBoundingClientRect` right after
   `innerHTML`); `ih:home-paint` forces 70-84 ms on each Home repaint. Read
   before write. Target: handler < 50 ms, tap to paint < 150 ms.
S5. **Springs (`linear()`).** Apple's model: WWDC23 "Animate with springs"
   (stiffness = (2π/duration)², damping ratio = 1 - bounce); WWDC18
   "Designing Fluid Interfaces" (start at 100% damping; 80% only when a gesture
   carries momentum). Every bounce-0 spring has one shape:
   `linear(0, 0.094, 0.274, 0.456, 0.609, 0.727, 0.813, 0.874, 0.916, 0.945,
   0.964, 0.977, 0.985, 0.99, 0.994, 0.996, 0.998, 0.998, 1)`; CSS duration =
   1.47 x Apple duration. Press 0.25 s (368 ms CSS), screen 0.4 s (588 ms),
   sheet 0.45 s (662 ms); swipe-dismiss bounce 0.2 (607 ms, overshoot 1.5%).
   The 10 overshooting cubic-beziers on plain taps go to bounce 0. Fallback
   `--ease` where `linear()` is unsupported (iOS < 17.2; Safari 17.2 notes).
   Later, sheets only: a JS spring that keeps the finger's speed (CSS can't).
**Doctors redesign (Jose approved 2026-10-14).** Mockups:
`docs/mockups/doctors/list.png` and `page.png` (HTML beside them). Rule from
Jose: it must look like the rest of the app (light background and mesh,
white cards with the standard finish, navy, glass bars, `ds-mode-seg` tabs,
Inter at the `--fs-*` scale), never a different app; and terms must be easy
to read. Nothing in a doctor's research is lost: all five tiers (core,
procedures, drugs, anatomy, falsefriends), hand-added `customTerms` and
photos stay. One PR per step; User Guide in each.

D1b. **Needs Jose** (`docs/mockups/doctors/d1-review.md`): layout A (as
   built) or B (terms first, `d1-layouts.png`); the "From Doctor Prep, not
   checked by the team" line; the real-data replay (he sends `doctors.json`,
   steps in the review); the 5-minute interpreter test on iPhones.
D2. **Team tips.** `tips: [{id, text, by, at}]` on the doctor-directory
   document; add, edit and delete your own; activity log. The old single
   `notes` shows as the first tip (by `updatedBy`) until someone edits it,
   then it is written into `tips`; no migration on startup.
D3. **Doctor list.** Two-column cards (mockup `list.png`): pin tile or
   photo with initials badge, name, specialty dot, floor, labels for
   terms / traps (false friends count, red) / tips, "+ Prep terms" when no
   research. North / South / All as `ds-mode-seg`; navy "+ Add"; the
   duplicate and old-terminology banners become one "N things to tidy"
   button opening a sheet. Place headings with pins stay. Specialty to pin:
   a `SPECIALTY_PINS` map (cancer, children, heart...), fallback the
   place's pin.

R5. **Provider Pictures on the Where picker.** Providers share the places
   and icons but still type a facility. Same sheet, if Jose wants it.
R4. **Regions, later, if Jose asks:** region tags on announcements and on
   Training & Events. The top bar still says "Hackensack University Medical
   Center" under the title for South users too (Jose's call whether to change).
   Doctor Prep's default location is "Hackensack Meridian Health" for both.

Watch after South joins: Firestore reads (Usage page) a week later. More
people = more reads at every launch; the 50K/day trigger under Later may
come from this alone.

1. **AI models.** `claude-sonnet-5` (translate backup) →
   `claude-sonnet-5-5`; `claude-opus-5` (term-check backup) →
   `claude-opus-5-5`. Same recipe as doctor-research (see Facts). Read the
   claude-api skill first. Next: translate backup.
2. **One Claude helper in `api/`.** `_routine.js`, `ask.js`,
   `doctor-research.js`, `term-lookup.js` each build their own request and
   retry rule; `clip()` is defined 3 times. Grow `_routine.js` into the one
   helper; move one endpoint per PR.
3. **Home styles in layers.** In `home-polish.css` the greeting name is
   restyled by 13 rules, the quote by 12. Merge each element's rules into
   one, one element per PR, pixel-compared. Jose signs off on the look.
4. **Stale numbers in `CLAUDE.md` / `AGENTS.md`.** File map line counts are
   old (`index.html` is 28,056 lines, 1.6 MB, not 28,341; AGENTS says
   ~21,000 lines, 1.1 MB; CLAUDE.md's Open items says 1.1 MB). The "Known
   gap" paragraph says there are no spacing or font-size variables, but the
   Type paragraph says `--fs-*` / `--sp-*` exist. Check the code, fix the
   text, both files.
5. **Dead CSS in `home-polish.css`.** Phase "Dead CSS" covered only
   `index.html`. `home-polish.css` still styles classes nothing makes
   (e.g. `.domain-family-kid`). Same method; Jose's other tools edit that
   file, so fetch `main` right before.

**Flaky test: dock-tuck in WebKit.** "Dr. Smiley shrinks with the bar"
failed once on PR #60 (run 39281179430) and passed on the same commit's
other run and on its re-run: his size was read while `dsBreathe` was
scaling him (54/58 expected, 0.954 measured). Measure him with the breathe
paused or read his layout box, not his painted box. Not this PR's code.

## Later (only when the trigger happens)

- **Startup, draw less at first (from S3b).** Trigger: Jose finds opening
  the app slow on his phone. Home's first draw is the worst startup task
  (~720-890 ms at 4x on the S3b machine): script ~half, style + layout of
  the new Home ~half, both over 200 ms. Draw what's on the first screen
  first, the rails more than 1.5 screens down (284 of Home's 669 elements)
  a frame later; projected ~1/3 off, not under 200 ms. Don't retry moving
  the layout reads to the frame (Facts, "S3b measurements"). Other leads,
  unmeasured as fixes: `watchDomainDock` writes `--dock-top` on `<html>`
  every render (a new value restyles the page); the name pen's `tick`
  reads two rects per frame (20-45 ms frames at 4x during the opening).

- **Glossary changes-only sync.** Each cold start reads every term (~1,700
  reads; persistence is off on purpose, iPhone crashes). Do it only if
  Firestore reads near 50K/day (Usage page). Was 23K on 2026-10-13.
- **Split `index.html`** (1.6 MB) into CSS + JS by feature. Big; plan it as
  its own multi-phase effort, coordinated with ChatGPT's edits.
- **Reduced motion, softer.** With Reduce Motion / Still, the name has no
  pen. Option: a short fade instead. Jose's call.
- **Dr. Smiley's three frames with a white edge** (lookU, halfL, lookUR;
  see Facts). Trim the eye patch's edge in `face.webp`. When Jose wants it.
- **Training & Events listener has no limit.** Fine while small; a cap
  breaks the unread badge (it counts events), so it needs a new badge rule.

## Done

- 2026-10-19 Watch bubble always on Home (Jose couldn't find it: he had
  watched the video, and the once-only rule had hidden it). After watching,
  the ring stops turning (`.is-seen`). Guide: `promo` answer reworded.
  Same PR: the video has its own controls and full screen with an X that
  never hides (Jose: full screen had no X; that was the iPhone's own player,
  which hides it while playing). Closing the sheet now pauses the video (Back
  used to leave it playing behind Home).

- 2026-10-19 Campus: each building's badge names its exam area; first tap
  picks it (windows lit, scene dimmed, a card with the area's name,
  questions, share of the exam, Practise), second tap starts (Jose: "we are
  clicking on the building without knowing which content"). Suite
  `campus-pick.cjs`; note `docs/features/practice-dashboard.md`.
- 2026-10-19 Your HUMC campus on CoreCHI Practice (Jose: a game look,
  then "make it look like Hackensack", from his photos and Google 3D
  screenshots, then "alive"). The main entrance at dusk, pre-rendered 3D
  (`city/`); each exam area is a building whose windows light up with
  mastery; the glossy readiness donut in the card; cars, an ambulance, a
  helicopter, flags, the fountain, people walking and street traffic, all
  paused off screen; Dr. Smiley pinned by the area to focus on; Your domains
  rows right under. Note: `docs/features/practice-dashboard.md`; pipeline
  `docs/mockups/cchi-city/` (`buildentr.cjs`, `NOLIT` to keep the lit layers).
- 2026-10-19 Watch button became a story bubble (Jose's pick of three):
  the video's still in a turning ring of the promo's colours, a play badge,
  "Watch" on a dark chip. Same corner, same rules; 3 KB thumbnail.

- 2026-10-19 Dr. Smiley acting, E1 (Jose: "expressive like Disney
  characters"; plan below under Next). Code only, his own art: brows that
  never mirror, anticipate big raises and overshoot as they settle; an
  eyebrow-flash hello, knit-then-aha thinking, a startled take before the
  giggle when held, worried-then-reassuring when the connection drops, a
  raised brow on general-knowledge answers, a new `surprise`. Guide:
  `askmoves` answer and its news card.

- 2026-10-19 The 45-second video in the app (Jose's ask): User Guide answer
  `promo` (video in the answer, "New lately" card, oldest card dropped) and a
  "Watch 0:45" button bottom-right of Home's hello banner, beside the sign,
  until watched once on the phone (`ih_promoSeen`: the end or past 15 s). Web
  copy `media/hub-promo.mp4` (720p, 8 MB, tap to play); `sw.js` leaves
  `media/` alone. Not on the members-only screen yet: Jose to decide after
  the CEO pitch (anyone with the link sees that screen).

- 2026-10-19 Dr. Smiley's brows, bigger (Jose on his phone: "the brows
  don't move much"). Every `DR_BROWS` pose about 2x (looking up 2 to 4.2
  drawing units, caring 6 to 11 degrees); his pick of 1.5x / 2x / 3x was 2x.
  Raised brows still clear the cap brim, mirror band and grad cap.

- 2026-10-19 CoreCHI Pixar finish (stacked on the dashboard PR): clay tiles,
  glossy donut, candy buttons, glossy beads, lean-toward-finger, squash
  landings. CSS + one small pointer handler; nothing runs at rest.

- 2026-10-19 CoreCHI dashboard + motion (Jose's ask, options picked:
  regroup + trend, native animation). Score-trend tile (last 12 sessions,
  tap a point), Focus next tile, "My progress" card folded into the trend
  tile and the domain rows, staggered arrival, count-ups, self-drawing
  line, resumable motion. Note: `docs/features/practice-dashboard.md`.

- 2026-10-19 Dr. Smiley's brows move (Jose's pick of four ideas for more
  expression; the others were an Expression Studio page, new drawn frames
  and 3D with face shapes). Brows cut out of his own art into
  `drsmiley/brow-l.webp`/`brow-r.webp`, forehead repainted, a pose per
  face frame plus caring holds on `composed`/`encourage`
  (`docs/features/dr-smiley.md`). Art total 334 KB to 324 KB. Guide:
  `askmoves` answer and a news card.

- 2026-10-19 S3b startup, what's left (invisible). The first idle tuck set
  `--mini-w` on `<body>` (911 of 1,420 elements restyled, a 290-550 ms task
  ~7 s after opening at 4x in 5/5 runs); now on the tab bar, kept in its
  markup: 0/5. Bar sizes identical (Home, Chat, redraw while tucked).
  Lens glide as a Web Animation and moving Home's layout reads to the frame
  were measured (no gain; worse) and dropped; "draw less at first" moved
  to Later. Facts: "S3b measurements". Rules added: always say the
  recommendation; a chat's title says what it works on.

- 2026-10-19 S7 Home scroll part 2 closed (Jose). S7a-S7d below. On his
  iPhone (393x852), scrolling Home went from 85 ms/s, 10.5% late (before
  part 1) to 62-78 ms/s, 7.9-8.9% (3 runs on b1019.1228); still Apple's
  "distracting" (10+). The still-Home stall (120-141 ms, ~26-29 ms/s) did
  not come back in those 3 runs (~3-8 ms/s, nothing over 51 ms); cause
  never found. The meter lists any stall with what ran, if it returns.

- 2026-10-19 S7d, the meter names its stalls (diagnostic; visible only in
  the meter's results). Every frame over 50 ms is kept with its time into
  the run, time since the last scroll, screen, time since opening and the
  app jobs that ran in it (`fmNote(tag)`: render, greeting word, heartline,
  pins, tab bar tuck/open, Dr. Smiley's performances, time labels, time of
  day, glossary saved, the six data listeners, the meter itself, More
  closing). The six longest show under the table and in Copy numbers.
  Names are matched by time over the stall and the frame before it (a held
  frame carries its due time, so the stall lands one frame late; the first
  version missed every name). New lab tool `tests/tools/idle.cjs` (Home
  left still, optional scroll first, trace of every task over 50 ms with
  what ran). frame-meter suite checks the list, the sheet and the copy
  text. User Guide: the smoothness answer explains the list.
  jvtomax99/Interp#54.

- 2026-10-18 S3 startup (invisible). Measured with the new
  `tests/tools/startup.cjs` (each long task's pieces, the lines that forced
  layout, CPU profile). The plan's "top CPU" list was mostly forced layout
  billed to whoever measured first. Changes: the name pen's path is traced
  in a worker (`penTrace`, plain worker, no OffscreenCanvas; same path to
  the byte for Jose, Moisés, Elizabeth Lind-Smith; WebKit needs the blob
  URL kept, CI caught it); the categories listener's first snapshot (the
  document `loadData` just read) no longer repaints Home; the petals (hero
  and rank card), the heartline's placing, `fonts.ready`/`fonts.load` and
  `applyHeroDrift` run in the next frame, before it paints (`beforePaint`
  in `home-polish.js`); `dockAfterRender` settles the lens with a style
  read, not a layout. Kept immediate on purpose: anything that changes
  Home's height (rail dots, the name fit `fitWave`), since Back restores
  the scroll right after the render (destination-labels caught a 7 px miss),
  and Dr. Smiley's dock check (WebKit's dock-tuck). 4x, iPhone UA, 3+3
  interleaved: `render()` CPU first visit 909-1152 -> 568-627 ms,
  returning 841-1102 -> 599-765 (every after below every before); tasks
  over 200 ms first visit 4-6 -> 1-3; worst task 441-610 -> 418-462 and
  238-388 -> 238-290 (overlapping, so not proven). Total long-task time
  unchanged. Target (no task over 200 ms) not reached: S3b. New suite
  `startup-work.cjs` (also in the WebKit CI job). No User Guide change.
  jvtomax99/Interp#52.

- 2026-10-18 S7c, pin burst stops when a scroll takes the touch (visible,
  Jose's pick). Jose first picked option 1 (burst on lift); measured first:
  a tap navigates at once (card gone 22-56 ms after the click), so every
  burst frame seen today plays while the finger is down (117-234 ms for a
  110-200 ms tap, 0-1 frames after lift); on lift would have removed it
  from taps. Asked again: option 2. The burst still starts on
  `pointerdown`; on `pointercancel` for that touch it stops (`pin-icons.js`).
  Taps: same burst frames before/after (9/9/9 at 110 ms, 13-14 at 200 ms).
  Drag from a card: burst on screen 650-735 ms -> 46 ms (3 frames, the
  cancel comes ~50 ms in). Trace at 4x on a card with burst rings, 3
  drags x 3 runs each side: layout 31-41 -> 9-17 ms per drag (every after
  below every before), raster tasks 275-294 -> 128-144 (time overlaps),
  paint time unchanged. New suite `pin-burst.cjs` (old code fails it). No
  User Guide entry mentions the burst, so none changed. Jose's phone
  decides. jvtomax99/Interp#51.
- 2026-10-18 S7b, tuck restyle (invisible). Cause, from a Chrome trace
  with invalidation tracking (`tests/tools/tuck-trace.cjs`): the two
  `body.dock-mini` rules for the tab's name ended on a bare `span`, so
  each tuck/open restyled every span on the page (471-510 of 1,420
  elements, 269 spans). The name span now has class `tabbar-name`; rules
  read `span.tabbar-name:not(.tabbar-icon)`, same weight (0,2,1).
  Restyled per tuck/open 93-120; style work at 4x median 54 -> 19 ms,
  worst 105 -> 28 ms (5 tucks + 5 opens each). Computed styles identical,
  656,806 values incl. ::before/::after, 13 states (`tests/tools/tuck-styles.cjs`);
  screenshots 0 px different (Home and a domain, open and tucked).
  `scroll.cjs` UA=chromium 8+8 interleaved: no difference measurable (all
  16 runs in the bad band; ~280 ms saved per run is under the spread).
  dock-tuck: new guard, rules on body state classes must not end on a
  bare tag (fails on the old code). Harness `POLISH_DIR` for before/after
  of the Home files. Jose's phone decides. jvtomax99/Interp#50.
- 2026-10-18 S7a, overlay rules (invisible). The 6 `body:has(.overlay.show)`
  / `.gs-overlay` / `.dm-overlay` rules now read `body.ov-open.ov-open`,
  `.gs-open`, `.dm-open` (same weight), kept by one MutationObserver
  (`overlayFlags`, `index.html`, by `closeAllOverlays`), so new overlays
  need nothing. Computed styles old vs new identical: 398,040 values, 24
  states (phone + computer, each kind open and closed;
  `tests/tools/overlay-styles.cjs`). dock-tuck checks the classes follow
  each kind before the next frame. `scroll.cjs` UA=chromium 4x, 8+8
  interleaved: style time 5232 -> 3728 ms median (every after run below
  every before run), late while scrolling 26.7 -> 23.8% (runs overlap),
  script +160 ms (the observer: at most ~90 ms a run, counted). Rule added
  to `AGENTS.md`: no `:has()` for state on big containers. Merged
  2026-10-18. jvtomax99/Interp#49.
- 2026-10-17 Home scroll, part 1 (Jose: before S3). Tab bar's 5
  `:not(:has(.tabbar-btn.is-active))` rules replaced by `.tabbar.no-current`
  set at draw (doubled class, same weight; all 69 tab bar elements'
  computed styles identical, 12 states). `scroll.cjs` UA=chromium 4x,
  8+8 interleaved, bad runs left out: late frames while scrolling 9.1% ->
  6.7% median (every after run below every before run), style time 10.6 ->
  9.2 s. Jose's phone decides. Tried and reverted: reading the scroll position once per frame
  for the photo drift, tuck and sway (no gain measured on its own; in CI's
  WebKit the tuck then landed after the dock-tuck test moved on).
  jvtomax99/Interp#47.
- 2026-10-17 S6 smoothness meter (Jose asked; before S3): bottom of More
  (the app has no Settings screen), above the build. Timer pill, results
  in Apple's hitch ms/s, per screen and while scrolling, runs kept with
  their build (`ih_frameMeter`). `docs/features/frame-meter.md`, suite
  `frame-meter.cjs`. jvtomax99/Interp#46.
- 2026-10-17 S2 tab bar tuck, transform only (`dockMorph`, `.dk-skin`
  pieces): at rest pixel-identical, layout per move 19 -> 6-8 ms; top bar's
  6 px shift left on Jose's call. Gain on Safari unproven in Chromium; S6
  measures it on the phone. jvtomax99/Interp#45.
- 2026-10-15 Team Chat titles (Jose asked): "Admin" under the names of
  owner-code phones (`hub-admins/{uid}`; messages now carry the sending
  phone, held to it by the rules) and a "Supervisor of Language Services"
  ribbon for Liz Lind (by name; Elizabeth Lind, Liz Lind-Smith too).
  Rules tested in the emulator; Jose pastes `firestore.rules` into the
  console. `docs/features/team-access.md`, suite `chat-titles.cjs`.
- 2026-10-10 CCC watcher source: moved, then switched off (site answers
  403 to the watcher). jvtomax99/Interp#22, #23.
- 2026-10-13 Phase 1 cleanup: 16 dead functions, 6 unused files, internal
  files no longer served. #24.
- 2026-10-14 Startup: 2 finished migrations + old blob code removed. #25.
- 2026-10-14 `CLAUDE.md` slimmed 584 → 350 lines: 11 feature write-ups
  moved verbatim to `docs/features/`, one pointer line each. #27.
- 2026-10-14 Dead CSS: 163 rules (24 KB) removed from `index.html`;
  computed styles identical before/after on 40 screens and sheets x phone,
  computer, light, dark; all suites pass. #29.
- 2026-10-14 Doctor Prep on Sonnet 5.5: effort `medium` set explicitly,
  max_tokens 8000 → 16000, refusals answered plainly, JSON read from the
  last text block. Smoke-tested with a mocked API. #30.
- 2026-10-14 Places: one "Where" picker on the doctor sheet (search,
  by region, add a place), shared place icons from the pin artwork in
  `terminology-meta/places`. `docs/features/places.md`. #32.
- 2026-10-14 Regions R1-R3 (South joins): North/South picker, Team Chat
  channels (Everyone, North, South), Doctor Directory by region, namesake
  fix. No rules change, no migration. `docs/features/regions.md`. #31.
- 2026-10-15 S1b petals: banner and rank-card petals drawn on one canvas
  per place from a Web Worker (OffscreenCanvas; same painter on the page
  where unsupported). Same seeded values, artwork and keyframe math: every
  petal's box matches the old computed transform to 0.01 px. Idle settled
  75% -> 24%, tap waits ~160 -> ~82 ms (medians of 6). Taps stay in S1b.
- 2026-10-15 S1 Home rests after arrival: #37 stopped the petals (one
  shower), the heartline (draw once), the badge breeze, halo glow and card
  ring after arrival. Idle settled 94% -> 4%. Jose then asked for the
  petals and the heartline looping again (part of the look): restored as
  before but with no per-petal `will-change`; badge, halo and ring stay
  settled. Numbers for this in the PR.
- 2026-10-15 Smoothness measured (no app change): baseline, causes and the
  S1-S6 plan above; `tests/tools/perf.cjs`.
- 2026-10-14 Doctors D1, the doctor's page: header with specialty pin,
  bento (count, Where, tip), tier tabs, terms read aloud, glass bar (Start
  appointment, Flashcards, Add tip). `docs/features/doctor-page.md`. #35.
- 2026-10-14 Term lookup on Sonnet 5.5: effort stays `medium`, refusals
  logged and answered as "nothing found", JSON read from the last text
  block. Same mocked-API check. #30 (Jose asked for it in the same PR).

## Facts (so nobody re-checks)

- OpenStreetMap (Overpass) and most websites are blocked from cloud sessions
  (DNS fails in WebFetch, proxy refuses curl); only WebSearch works. The HUMC
  buildings were modelled from Jose's photos plus WebSearch facts.
- The tests' Chromium has no H.264 (`canPlayType` is empty), so no suite can
  play `media/hub-promo.mp4`; only an iPhone or desktop Chrome/Safari proves
  playback. The suites check the button, the sheet and the "watched" rule.
- `sw.js` must never cache video: `caches.match` ignores Range headers, and
  iPhones play `<video>` only through Range (206) responses. `media/` is
  passed straight to the network, like `atlas/`.

- The practice screen re-renders on any data arrival (`ensureLoaded` ->
  `scheduleRender`), so entrance motion there must survive a re-render:
  `data-motion`/`data-sig` + `playPracticeMotion` resume it.
- `dock-tuck` measured Dr. Smiley while `dsBreathe`/`dsDrift` (infinite, on
  `.dock-smiley-bob` around him) ran, so WebKit failed his scale check by
  ~0.003 depending on the breath's phase (#57-#60, 2026-10-19). `rects()`
  now holds those loops at 0 for the read, and `settle()` waits for his
  scale to reach rest (WebKit read him mid-grow after a tuck). Measure him that way elsewhere.
- Dr. Smiley's frames lookU, halfL and lookUR show a thin hard white edge
  around one eye patch (seen over the original base too, so it predates
  the brows). A clean-up of those three frames is open (Later).
- Meshy AI (3D) was looked at for Dr. Smiley on 2026-10-19: its auto-rig is
  a body skeleton for full-body, two-legged textured models; no face rig
  was found in its docs, and api.meshy.ai is blocked from cloud sessions
  unless added to the environment's allowed domains.

- **S4 first look (2026-10-19, `tests/tools/tap-trace.cjs`, domain tile on
  Home, iPhone UA, 4x, bar tucked after 9 s on Home).** Handler 330-520 ms,
  tap to paint 770-1,130 ms on this session's slow machine. Forced layout
  inside the click, in order: `watchDomainDock` (topbar height, every
  render), `smileyElsewhere` in `smileyRider` `topBar` (`getClientRects`
  on the lock screen's face, hidden under `#accessLock[hidden]`; ~170 ms),
  `void b.offsetWidth` restarting `#tgSmiley`'s pop, then `dockMorph`'s
  FLIP reads when the tucked bar opens. Skipping `[hidden]` faces and
  restarting the pop by alternating two keyframe names removed the first
  two; `dockMorph` then paid the same layout. 5+5 alternated: tap to paint
  median 848 ms before, 928 after (noise). Reverted. Like S3b (3): the
  whole new screen's layout is paid once by whoever reads first; only less
  work per screen shortens a tap. The click's "wait" (200-420 ms) is mostly
  how headless Chromium stamps a tap; viewport and `touch-action` are fine.

- **S3b measurements (2026-10-19, `tests/tools/startup.cjs`, iPhone UA,
  4x, interleaved 5+5).** This session's machine is ~2x slower than S3's:
  the S3 merge (22a28b8) itself scored worst task ~1,000-1,240 ms here, so
  compare only runs from the same session. (1) The first idle tuck set
  `--mini-w` on `<body>`: 911 of 1,420 elements restyled (`tuck-trace.cjs`
  MODE=var), a 290-550 ms task ~7 s after opening in 5/5 runs; on the bar
  instead, 0/5 (commit eaf3395). (2) `dockAfterRender`'s style read costs
  nothing in Home's render: `fitWave0`'s range rect (home-polish.js) forces
  the whole style + layout first, so the lens-glide-as-Web-Animation idea
  saves nothing at startup. (3) Forced reads in Home's render, in order:
  `watchDomainDock` (topbar height), `fitWave0`, `heartline.place`, the
  rail dots' `refresh`, `smileyInView`; all are synchronous on purpose
  (Back's scroll restore needs the final height). Moving them all to the
  frame (a `layoutSoon` queue, `navigateBack` flushing it before
  `scrollTo`) cut the render task to 290-450 ms but made the next frame
  1,040-1,340 ms (it already carries paint, `heroPetals`, pins; plus a
  second full restyle from `--dock-top`'s first write on `<html>`), worse
  than the 720-890 ms before. Dropped. (4) Home at rest: 1,586 elements on
  the page, 669 in Home's content, 284 of those more than 1.5 screens down.

- Back to Home restores the scroll right after the render, so anything
  that changes Home's height must happen in the render, not in a later
  frame: the rail dots row is 7 px (`destination-labels` fails 1130 vs
  1137 when they come late). The same check missed once on main in this
  container, so a single miss alone isn't proof; twice on CI was.
- WebKit (CI and so iPhones): a Worker made from a blob URL needs that URL
  until it has loaded; revoking it right after `new Worker()` lost the
  worker silently. Its computed style also reports a running transform
  transition's end value, so test a glide with `getAnimations()`, not by
  sampling positions.
- A CPU profile bills a forced layout to the script line that read first,
  so "self time" of `place`, `addCardPetals`, `applyHeroDrift` and the like
  is really the whole new screen's style + layout (~150-250 ms at 4x after
  a Home render). Moving one read only moves the bill to the next reader;
  use `tests/tools/startup.cjs`, which names the line behind each forced
  layout. In Chromium `window.scrollY`, `document.fonts.ready` and
  `document.fonts.load` all force layout.
- Startup repaints of Home (returning visit, stand-ins): the cache paint,
  loadData's (identical, skipped by `lastHomeHtml`), then real changes:
  Dr. Smiley's rank (`data-lv`, team points aren't cached) and the
  activity feed ("No team activity yet" until it loads). So on every open
  his outfit and the feed swap in after the first paint. Caching both
  would remove a full repaint and the swap; it changes what the first
  frame shows (better, but visible): Jose's call.

- Home's tap cards open their screen at once on the click (22-56 ms to
  the next screen), so anything a tap shows on the card itself is only
  seen while the finger is down. Start such feedback on `pointerdown`,
  never on lift or click. A scroll that starts on a card sends
  `pointercancel` ~50 ms in (Chromium, 18 px steps).
- The burst rings ride on the pin's `[data-pin]` holder; not every card
  has one (Home: 16 of 20 domain cards, 14 of 15 quick cards, 3 of 4
  tiles). Pick a card with a holder when measuring the burst: on one
  without, the burst costs nothing measurable.

- Chrome keys a class change's restyle on the last part of each rule that
  uses the class: a class or id there limits it to those elements, a bare
  tag (`> span:not(.x)`, the `:not` doesn't count) means every element of
  that tag on the page. Rules on body classes that change while you use
  the app (`dock-mini`, `ov-open`, `gs-open`, `dm-open`) must end on a
  class; dock-tuck checks it. Safari's engine may not pay this the same
  way (unproven); the trace is Chromium's.
- To see what a class change restyles: `tests/tools/tuck-trace.cjs` (trace
  categories `devtools.timeline` and
  `disabled-by-default-devtools.timeline.invalidationTracking`; events
  `UpdateLayoutTree` elementCount, `StyleInvalidatorInvalidationTracking`
  with the selectors). Adapt it for any other toggle.

- 2026-10-18 `scroll.cjs` came out in a third band: ~20-30% late while
  scrolling for all 16 runs, between the good (~7-9%) and bad (35-45%)
  bands seen 2026-10-17. Interleaving still makes before/after fair;
  compare only within one session's runs.
- An observer of class and child changes on `body` sees ~240 callbacks in
  a scroll run (frame meter text, tuck, pin taps); with 3 querySelectors
  each, ~90 ms at 4x per ~35 s run. Cheap enough for state flags.

- Jose's iPhone (iOS 18.7, installed, 60 Hz), build b1017.1752: scrolling
  Home 12 s: 10.5% late frames, 85 ms/s, worst 57 ms, none over 100 ms.
  Home still 17 s: 1%, 7.4 ms/s. So Home's cost is scrolling, not rest.
- Same phone after part 1 (#47), build b1017.2034, one 31 s run (13 s
  scrolling): scrolling 8.6% late, 66.9 ms/s, worst 49 ms, none over
  100 ms (was 10.5%, 85, 57: about a fifth less, same direction as the lab's
  9.1 -> 6.7%). The still part, worked out from the totals (18 s): ~1.2%,
  ~7.4 ms/s, unchanged. One run each side, so the size is rough. On
  Apple's scale (frame-meter.md) 67 ms/s while scrolling is still far into
  "distracting" (10+).
- Same phone after S7a (#49), build b1018.0223, one 29 s run on Home (13 s
  scrolling): scrolling 9.5% late, 76.7 ms/s, worst 61 ms (part 1's run:
  8.6%, 66.9, 49; before part 1: 10.5%, 85, 57). So no gain from S7a seen
  on the phone; one run each side, run-to-run spread unknown. The still
  part, from the totals (16 s): ~3% late, ~29 ms/s, and the run's worst
  frame (124 ms, the first over 100 ms on this phone) was in it; earlier
  runs ~1%, 7.4 ms/s. Cause unknown; S7a adds little at rest (the
  observer). Needs a repeat before reading anything into it. Lab gains in
  Chromium's style engine have twice not shown clearly on the iPhone, so
  only the phone decides an S-step.
- Same phone after S7b + S7c (#50, #51), build b1018.1746, one 28 s run
  on Home (12 s scrolling): scrolling 8.2% late, 53.5 ms/s, worst 47 ms.
  Best of the four builds on all three (before part 1: 10.5%, 85, 57;
  part 1: 8.6%, 66.9, 49; S7a: 9.5%, 76.7, 61). From before part 1 to
  now: hitches while scrolling down by about 37%. Still far into Apple's
  "distracting" (10+ ms/s). The still part, from the totals (16 s): ~2.7%
  late, ~27 ms/s, and again the run's worst frame (120 ms) was in it.
  Second build in a row with that (S7a: ~3%, ~29 ms/s, 124 ms), so it is
  likely real and not from S7b/S7c; before S7a still was ~1%, 7.4 ms/s.
  Cause unknown (a timer, the greeting or the meter's own start are
  candidates; untested). One run each build, so the spread is still
  unknown: Jose asked for 2-3 runs per build.
- Build b1018.2012 (after S3), one 30 s run on Home, on a **different
  iPhone** (402x874; Jose's usual one reads 393x852): scrolling 11.3%
  late, 86.9 ms/s, worst 53 ms; still part (from the totals, 18 s) ~26
  ms/s, worst 141 ms. Not comparable with the runs on his phone.
- Jose's iPhone (393x852), build b1019.1228 (S7d), 3 runs of ~31-37 s on
  Home (14-22 s scrolling), not reopened between them (run 3 began 138 s
  after opening): scrolling 69.7 / 62.2 / 78.3 ms/s, 8.1 / 7.9 / 8.9%
  late, worst 50 / 40 / 51 ms; still part (from the totals) ~7.3 / ~3.3 /
  ~7.5 ms/s, nothing over 51 ms. So one build's scrolling spreads ~62-78
  ms/s: single runs per build (S7a 76.7, S7b+c 53.5) were within or near
  that noise. The still-Home stall seen on b1018.0223 and b1018.1746 (one
  run each, 120-124 ms) didn't recur. Untested guess: it comes with a run
  started soon after a fresh open (data arriving, the opening's tail).
- 2026-10-19, Home left still (`tests/tools/idle.cjs`, UA=chromium, 4x,
  SCROLL=1): after the opening (~5.5 s from load) and after a scroll, no
  main-thread task over 50 ms in 27 s except one minor GC; the idle tab bar
  tuck (4 s after the last touch, `dockIdleRestart`) ran with no long task.
  So the phone's still-part stall (~27 ms/s, 120 ms) doesn't show in
  Chromium. With a fresh start the opening is busy until ~5.5 s at 4x (name
  pen, greeting sequence, badge pendulum, a 105 ms idle tuck at 5.3 s
  whose time is mostly forced style), so a run started within a few
  seconds of opening carries the opening's tail.
- The phone's "still" number is total minus scrolling, so it holds the
  meter's start (More closing), frames over 200 ms after a scroll and the
  idle tuck. The only app change between the ~7 ms/s build (b1017.2034)
  and the ~29 ms/s one (b1018.0223) was S7a (the `overlayFlags` observer,
  plus part 1's per-frame scroll read taken back out). Unproven as cause.
- Home's jobs at rest (2026-10-19): greeting word (`innerHTML`, every
  2.8 s), heartline (every 5.2-6.5 s: forced layout, then a 4.2 s
  `stroke-dashoffset` draw, not a compositor property), Dr. Smiley's idle
  (every 1.2-3 s, steps every 38 ms, a `getComputedStyle`), time labels
  (30 s), time of day (60 s), the idle tab bar tuck (once, 4 s after the
  last touch). Two body observers react to inserts anywhere: `overlayFlags`
  (3 querySelectors) and `pin-icons.js`'s, which re-runs `applyExactPins`
  in the next frame; the meter's own pill text (2 a second) sets off both.
- `tests/tools/scroll.cjs` with UA=chromium reproduces the phone's scroll
  number (~10% late at 4x). With the iPhone user agent it does not: Home at
  rest is ~96% busy there (Chromium runs the iPhone's CSS petals on its main
  thread), the phone 1%. CDP `synthesizeScrollGesture` doesn't scroll Home;
  touch drags (`Input.dispatchTouchEvent`) do.
- In this app a style pass costs ~1.2 ms at 4x even for under 10 elements;
  `:has()` rules were ~45% of style time while scrolling (all removed:
  11 -> 6 s). The first scroll position read in a frame pays the frame's
  style work; later reads are cheap unless something was written between.
- `scroll.cjs` sometimes goes bad from load (~35% late overall, ~45% while
  scrolling, main thread less busy): seen on the old code and the new, in
  streaks (3 runs in a row once). The machine or headless Chromium, not the
  app change; leave such runs out and say so.
- The hitch thresholds (under 5 ms/s good, 5-10 noticed, 10+ distracting)
  are from WWDC20 "Eliminate animation hitches with XCTest" (transcript).

- The smoothness meter (S6) times page frames with requestAnimationFrame;
  Safari's Core Animation work isn't in it. Its numbers compare runs on one
  phone; they are not comparable to perf.cjs (Chromium, 4x CPU).

- Headless Chromium (our Safari stand-in) does not show compositor gains:
  any running animation, composited or not, gets main-thread frames (one
  WAAPI `translate` on a div: ~30 ms of main thread at 4x over 420 ms;
  `transform` 70-90 ms). Compare layout and paint counts, not total
  task time, for transform-only work. Per-frame style recalc in this app
  costs ~150 us per animated element at 4x (the big stylesheet), so the
  number of animated elements matters. To see what fails to composite:
  trace with `blink.animations` and read `compositeFailed` on "Animation"
  events (8192 unsupported property, 131072 no visible change).
- WebKit (CI): don't start a Web Animation part-way by setting
  `currentTime` before it has started; on a turn-around the tab bar's
  pieces were never cleaned up (its `finished` never settled). Put the
  start state in the first keyframe instead, and keep a timer fallback for
  cleanup. Headless WebKit on CI also renders rarely: read animated
  positions inside `requestAnimationFrame`, and time steps in the page,
  not with Playwright waits (its round trips are slow).
- `smileySway()` sets Dr. Smiley's dock button `transform-origin: 50% 92%`
  inline; any scale on him has to account for that pivot.

- `perf.cjs` used to measure itself: its animation collector (every 60 ms)
  cost ~10% of an idle Home at 4x. It now holds during the idle windows; the
  2026-10-15 baseline idle numbers include that overhead. Its first "idle
  Home" window (load + 9.5 s) still catches the hello's thought cloud at 4x,
  so "settled" (load + 22.5 s) is the rest number.
- A kept greeting put back on a repaint of Home restarts every CSS animation
  inside it. Anything one-shot in the greeting must end in a static class or
  be rebuilt from a clock.
- Jose (2026-10-15): the endless petals and the looping heartline are part of
  Home's look. Don't stop them for speed; make them cheaper instead. The
  endless petals run mostly on the compositor (trace: main thread ~14% at
  rest with them, ~0.5% without).
- A frame loop on the page (requestAnimationFrame drawing a canvas) costs
  far more than its own work: Chrome then produces a whole Home frame
  (style, paint, commit) every vsync. The petals' drawing is 0.14 ms a
  frame, yet a page loop took idle Home to 99% busy at 4x. A worker on an
  OffscreenCanvas hands frames to the compositor with no page frame: 24%.
- Comparing two versions frame by frame: freeze both at the same moment
  (CSS: pause each animation and set currentTime; the painter:
  `__homePetals.freeze`) and diff the pixels. A paused CSS animation with
  a negative delay shows nothing while currentTime < 0, so pick moments
  every petal has already reached. Run perf.cjs before/after interleaved
  (before, after, before, ...), not in blocks: the machine's load drifts.
- Breathing, drift, the halo's turn and the streak flame are compositor-only:
  Home at rest with them running is ~0.5% main-thread busy (trace).

- Doctor page, D1: "Add tip" edits the doctor's single `notes` until D2
  builds `tips`; D2 should point that button and the tip tile at the new
  sheet. `SPECIALTY_PINS` already exists for D3's list.
- Add to glossary's domain matcher (`findBestDomainMatch`) misses
  Cardiology, Psychiatry, OB/GYN, ENT and more (word overlap only). The
  doctor page uses `doctorDomainFor` (hints first). Moving Add to glossary
  onto it is a small follow-up; it changes where new terms are filed.
- This container has no WebKit (and must not run `playwright install`); the
  `webkit` CI job runs the doctor page suite in it. `BROWSER=webkit` in
  `tests/support/harness.cjs`.
- Test fixtures: doctors pushed straight into `DOCTOR_DIRECTORY` vanish when
  the directory listener reloads; also write them to `window.__DB`
  (`seed()` in `tests/suites/doctor-page.cjs`).

- Firebase plan: Blaze. Reads ~23K/day, cost ~$0.17/month (2026-10-13).
- `terminology-meta/migrations`: `oncologySplit`, `slangGlossary` done.
- CCC (`cultureandlanguage.net`) blocks the watcher: HTTP 403 from Vercel.
- Moisés's frozen Dr. Smiley / no pen = Still mode or iPhone Reduce
  Motion, by design. Not a bug.
- This cloud container can't reach the live site, Firebase or third-party
  sites, and the Vercel connector can't read team logs. Ask Jose for
  screenshots.
- Vercel Deployment Storage (free tier 10 GB) hit 75% on 2026-10-14: each
  deployment is ~38 MB (34 MB is `atlas/`) and every push to any branch
  made one. Fixed: retention policy (Settings, Build and Deployment) set to
  1 day for canceled, errored and pre-production, 1 week for production;
  `vercel.json` no longer deploys `claude/` branches, so a PR has no
  preview link. If it nears 100% again, check Usage before anything else.
- Dead CSS method (2026-10-14): a class counts as used if its name appears
  anywhere outside the stylesheet (`index.html` markup and scripts,
  `home-polish.js`, `pin-icons.js`). Names built in code (`em-${role}`,
  `dm-${tone}`, `'ds-fx-' + kind`, `is-${why.k}`, `is-b${n}`, `n${n}`,
  `sev-${sev}`) look dead to a plain search and are live: check prefixes.
  `id="domain-${cat.id}"` is an id, not a class. Proof = every element's
  computed style (and ::before/::after) identical before/after on every
  screen and sheet, phone and computer, light and dark.
- Feature write-ups: `docs/features/*.md`. Moving them was checked line by
  line (every non-blank line of the old `CLAUDE.md` is in the new one or a
  feature file).
- Sonnet 5.5 recipe (from the claude-api skill's migration guide): same
  price as Sonnet 5; effort levels recalibrated, so set `output_config.effort`
  explicitly (`medium` for search-then-write, `low` for chat/extraction);
  thinking counts toward `max_tokens`; `thinking: {type:"disabled"}` and
  forced `tool_choice` are 400s; a decline is `stop_reason: "refusal"` (HTTP
  200, empty content). Server-side fallback only retries cyber/frontier_llm
  declines, useless for medical text, so it's not used. Opus 5.5: effort
  default is `medium` (not `high`), thinking can't be turned off.
- This container has no Anthropic key for the app, so before/after answers
  are compared by Jose on the live app after merge. Doctor Prep caches
  answers in `doctor-research-cache`: test with a doctor not looked up before.
  Term lookup caches per term for 90 days (`term-link-cache`): test with a
  term nobody has opened reading for.
- Regions decided by Jose (2026-10-14): North + South; a view, not a
  wall (all chats open to all); each phone picks (`ih_region`); Jose stays
  the only owner. South sites: the Shore hospitals, Raritan Bay, Carrier;
  JFK is North. Details: `docs/features/regions.md`.
- Weekly code report: Routine "Weekly code cleanup report", Mondays 11:51
  New York, report-only, phone notification.
