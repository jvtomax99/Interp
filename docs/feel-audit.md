# Feel audit: the Hub as a premium app

Jose, 2026-11-04: "When the app is opened, the app glitches. Dr. Smiley
sometimes stutters, and moving the app sometimes seems off. Assess the app
so it feels like a professionally made, premium app."

This is the plan. Each phase is one pull request. Numbers before
anything is called fixed; the look never changes without Jose seeing it
first (the standing rule: speed never costs the look).

## What "premium" means here, in numbers

Taken from the two sources the app already measures by, plus Google's
page-feel limits. Chromium in the lab is a stand-in; Jose's iPhone and its
smoothness meter (More, bottom) are the judge.

| Feel | Measure | Target | Source |
|---|---|---|---|
| Nothing jumps or restarts on open | The app paints once and stays; no reload, no second hello; layout shift (CLS) under 0.1 | 0 reloads, CLS < 0.1 | web.dev/cls |
| Smooth at rest and while he moves | Hitch time (ms of late frames per second) on Home at rest and during a performance | under 5 (good); 5-10 noticed; 10+ distracting | Apple WWDC20 10077, `docs/features/frame-meter.md` |
| His face keeps time | Each face frame lands within one screen frame of its schedule | 95% within 17 ms, none over 50 ms late | this audit's probe |
| A tap answers at once | Finger lifts to the first visible change (INP) | under 100 ms felt; 200 ms is Google's limit | web.dev/inp |
| Scrolling stays smooth | Hitch time while scrolling Home and a 150-term domain | under 10 | same as above |
| Nothing arrives late and swaps | Elements that change after the first paint on open | named, each one agreed or removed | this audit |

## What the code already says (leads, strongest first)

Read on 2026-11-04 before any measurement. Leads, not findings, until
phase 0 measures them.

1. **The app reloads itself on the first open after every deploy.**
   `index.html` registers `sw.js` on `load` and calls `reg.update()`; the
   version line changes on every deploy, so a new worker installs,
   takes over at once (`skipWaiting` + `clients.claim`) and the page
   answers `controllerchange` with `location.reload()`. Home paints, the
   hello starts, then seconds later the page reloads and the hello
   starts again. There is no memory of the hello across the reload. Jose
   deploys several times a day, so most "first opens" are this. This is
   deterministic from the code; the reload was written for a page served
   from the cache, but the page and its code are network-first, so on a
   normal open the page already runs the new code and the reload is
   wasted.
2. **The first ten seconds do everything at once.** On open, all of
   these run together: the hello (a page frame loop for 9.4 s that draws
   the sparkle canvas and seeks several Web Animations by hand every
   frame), the name pen (two rect reads per frame), the glossary's first
   snapshot (about 1,700 documents parsed, then a Home repaint that swaps
   his outfit and the activity feed after the first paint), the pin
   observer re-applying pins after every insert (the greeting word swap
   every 2.8 s included), and, after a deploy, the new worker precaching
   96 files (3.3 MB) over hospital Wi-Fi. Facts in `docs/PLAN.md`: a page
   frame loop makes Chrome produce a whole Home frame every vsync.
3. **Dr. Smiley's face frames are timer chains, not clock-driven.**
   `DrAnim.play` steps frames with `setTimeout` at 38 ms
   (`DR_STEP`); a late timer delays the frame and every frame after it,
   nothing catches up. Any stall in lead 2 lands on his face. The head
   (Web Animations) and brows (CSS transitions) are clock-driven and
   should stay smooth through the same stall; if Jose sees the face
   stutter while the head glides, this is why.
4. **Scrolling and screen changes carry a lot of glass.** `app.css` has
   34 `backdrop-filter`s, 76 `filter`s, 100 keyframe sets;
   `home-polish.css` 8, 31 and 21 more. The bold look (Nov 3-4: colour
   washed cards, big tilted pins, a glass search, a colour hero) landed
   in the last two days and has not been measured for scroll cost.
   Scrolling Home read 64 ms/s on the meter on 2026-10-26 (Jose then:
   "feels fine"); a new complaint after new paint is a regression until
   measured otherwise.
5. **Known, left to Jose:** his rank outfit and the feed arrive after the
   first paint on every open (`docs/PLAN.md`, Facts, "Startup repaints").
   A premium open shows the right thing the first time; caching both is
   the fix, and it changes the first frame, so it is his call.

Where Jose's framing may be wrong: "the animation stutters" reads like an
animation bug, but leads 1-3 say the animation is the victim of what
runs around it. Fixing frames (lead 3) without the reload (lead 1) and the
crowd (lead 2) would move the stutter, not remove it.

## Phases

### Phase 0: reproduce and measure (no app code changes)

Output: a findings table in this file, numbers per lead, and a decision
with Jose on the order of the fixes. Nothing is "found" without a number.

Lab (`tests/`, headless Chromium, iPhone size, CPU slowed 4x, interleaved
runs, medians; the pre-bold-look commit fetched as the before copy):

- **The deploy open**, new script `tests/tools/deploy-open.cjs`: serve the
  checkout with the worker allowed, open once, change the worker's
  version line, open again, and record every navigation, the hello's
  start times and when the precache runs. Proves or disproves lead 1 and
  measures what the precache costs the open.
- **The opening, task by task**: `tools/startup.cjs` (first visit and
  returning) for each long task's pieces; `tools/perf.cjs` for idle busy,
  first paint, layout shift and animations that are not transform or
  opacity.
- **His face on a clock**, new probe `tests/tools/face-timing.cjs`: wrap
  `DrAnim.set` with timestamps while `greet`, `think`, `cheer`, `bounce`
  and his idle run on Home during the opening and again at rest; report
  the lateness of every frame (median, 95th, worst), with and without the
  opening's crowd. Proves or disproves lead 3 and sizes it.
- **Scrolling and screen changes**: `tools/scroll.cjs` and
  `tools/screen-trace.cjs` on Home, a 150-term domain, the doctor list
  and the doctor page, before and after the bold look; count composited
  layers and `backdrop-filter` elements on screen per screen.
- **Taps**: `tools/tap-hold.cjs` on the Home cards, a domain tile, the tab
  bar, Dr. Smiley's dock button.

Jose's phone (the judge; Low Power Mode off, Reduce Motion off, Lively):
the meter's **Copy numbers** pasted into the chat for four runs: open
right after a deploy, open with nothing deployed, Home left alone 30 s,
one slow scroll down Home and back. Plus which iPhone and iOS version.

### Phase 1: no reload on open

Reload only when the page itself came from the cache or carries another
build than the worker's (compare `BUILD_ID` with the worker's version), never after a
network-first open. Check: `deploy-open.cjs` shows one navigation; the
hello plays once; the `load-order` and `startup-work` suites stay green;
Jose confirms on his phone after a deploy.

### Phase 2: a quieter opening, same look

Only what phase 0 shows to matter, in this order of likely gain: the
precache waits until the hello has ended; the pin observer ignores the
greeting word's swap; the name pen's rect reads once per frame or cached;
the glossary's first repaint waits for a quiet frame. The hello, the pen
and the petals look pixel-identical (frame-by-frame comparison, the way
the petals were compared). Measured again with the same tools.

### Phase 3: his face on a clock, same look

Frames scheduled from timestamps (`requestAnimationFrame` with the
sequence's own clock, late frames skipped so the beat holds; or the strip
as a stepped Web Animation), so a stall never pushes the whole
performance. `smiley-gestures`, `smiley-brows`, `smiley-squash` and the
face-timing probe decide; frame by frame the sequences read the same.

### Phase 4: scrolling and screens, same look

Where phase 0 finds a cost: fewer glass layers on screen at once (a
blur that is never seen through costs the same as one that is), `filter`
replaced by a baked shadow where the pixels match, animations off screen
paused. Each change shown to Jose before and after; pixel comparisons
where the look must not move.

### Phase 5: the finishing checklist and the guard

A pass over every screen for what premium apps get right and this one
may not: press feedback on every tappable thing, loading states that
never flash empty, nothing that jumps when data arrives, safe areas,
dark mode, the keyboard. Then a suite, `tests/suites/feel.cjs`, that
fails when any target above regresses (no reload on open, hitch time at
rest, face lateness, layout shift), so the next bold look can't quietly
undo this.

## Not in this version

- No visual change without Jose seeing it first. Same look, cheaper.
- The campus in 3D and the two brains: their own pages, measured
  separately (`docs/mockups/cchi-city/real-map/README.md`).
- The AI endpoints' answer time (network, not feel).
- Replacing Home's decor or the hello: they are the look (Jose, 2026-10-15).
- A rewrite of `index.html`'s startup chain.

## Where this plan is weak

- Chromium is not Safari. The lab says what runs, the phone says what it
  costs. Every phase ends on his phone's numbers.
- The reload (lead 1) only hits the first open after a deploy. If Jose
  sees the glitch on every open, lead 2 is the one, and phase 2 moves up.
- "Stutter" may be two things: the face (lead 3) and the whole page
  (lead 2). The probe separates them; until it runs, both are open.

## Findings (filled in by phase 0)

(none yet)
