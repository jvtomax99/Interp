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

**When to move to a new chat** (Jose's rule: save tokens, but don't make
him start chats often). Finishing a phase is not a reason; carry on with
the next one in the same chat. Say "Start a new chat" once, with the exact
message to paste, only when the chat is heavy: it has been compacted
(older parts summarized), or it holds several big file reads, long test
output or many fix rounds, and the next phase would add a lot more.
Before saying it, make sure everything worth keeping is in this file.
Don't repeat it in every reply.

## Next (in order)

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
S2. **Tab bar, pill, top bar: transform only.** The tuck on scroll animates
   flex-grow/right/width/height/top/left (300-420 ms, layout every frame);
   the pill animates width; the top bar is 12 px taller on some screens, so
   every Home <-> screen change shifts the app 6 px. Target: layout shift 0,
   no layout during scroll.
S3. **Startup.** Top CPU: `drawOpening` 420 ms, name pen (`tick` 291 +
   `penPathOf` 109), `addCardPetals` 243, `place` 238 (all `home-polish.js`).
   Defer decorative work past first paint (requestIdleCallback + timeout),
   split the worst task. Target: no task > 200 ms.
S4. **Glossary taps.** A domain tap's handler is 117-207 ms, ~144 ms of it
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
S6. **Real-iPhone check.** A small frame-drop meter under Settings -> Updates
   (no Mac needed), so Jose can compare before/after on his phone.

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

## Later (only when the trigger happens)

- **Glossary changes-only sync.** Each cold start reads every term (~1,700
  reads; persistence is off on purpose, iPhone crashes). Do it only if
  Firestore reads near 50K/day (Usage page). Was 23K on 2026-10-13.
- **Split `index.html`** (1.6 MB) into CSS + JS by feature. Big; plan it as
  its own multi-phase effort, coordinated with ChatGPT's edits.
- **Reduced motion, softer.** With Reduce Motion / Still, the name has no
  pen. Option: a short fade instead. Jose's call.
- **Training & Events listener has no limit.** Fine while small; a cap
  breaks the unread badge (it counts events), so it needs a new badge rule.

## Done

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
