# FACTS — so nobody re-checks

What past chats measured, tried or settled. Moved out of `docs/PLAN.md` on
2026-11-10 so a chat no longer loads it at the start. Don't read it whole:
search it for the screen, file or word you are about to touch
(`grep -n -i "tab bar" docs/FACTS.md`), before measuring or retrying
anything. Add what you learn here, newest near the top, with the date.

**The notes trim (2026-11-10).** `docs/PLAN.md` was split into the working
list, `docs/PLAN-done.md` and this file; `CLAUDE.md` lost its repeats and
its copy of the design values (now only in `DESIGN.md`). Decided the same
day and still standing: `CLAUDE.md` does not hand its shared rules over to
`AGENTS.md` (a mistake there changes how ChatGPT behaves, for a small
saving); every rule for working with Jose stays written in `CLAUDE.md`,
and only the per-feature function names are left to `AGENTS.md`'s table.
Notes opened only when needed (`docs/assets.md`, `docs/design-rules.md`,
`docs/features/*`) were not trimmed.

**Old rules settled (Jose, 2026-11-10)**, when his general rules were added to CLAUDE.md:

- New session: the token triggers ("New session triggers" in CLAUDE.md); a chat
  runs phases in a row until one hits.
- Handoff: root `HANDOFF.md`, deleted once its work is done.
- Spec: `SPEC.md` for what, `docs/PLAN.md` for order, this file for facts,
  `docs/features/` for each feature's detail.
- Reports: status updates short, explanations in full plain sentences.
- Installs: normal project packages without asking (mention them);
  programs, plugins, connectors and anything paid still ask first.
- Settings to paste: one box per field, YOUR_VALUE_HERE where a secret goes.
- `builder` (Sonnet): text edits only; code changes stay on the main model.
- Kept as is: a phone notification after every finished job and when
  something goes live; "Push" as a button that merges with the head SHA
  pinned; one clarifying question for an ambiguous request.

- **Type (measured 2026-11-03).** Body text is weight 500 (`body` in
  `app.css`), about 2,000 visible pieces; moving it is not a tidy. Google
  Fonts serves Inter 100-700 only (no opsz axis asked), so 750/800 render
  as 700. The browser's `b` is "bolder": 700 under 500, 900 under 650.
  Inter's dynamic-metrics page moved: rsms.me/inter/dynmetrics is gone,
  the v3 formula is in the repo at tag v3.19 (`docs/dynmetrics/index.html`):
  tracking = -0.0223 + 0.185·e^(-0.1745·px) em. The Hub sets ~.01em
  tighter than it at every size. Dark theme `--sh-*` are black, `rgba(0,0,0,x)`,
  unlike the navy rule; why is not written down anywhere.

- **Kept from the old Next list when it was tidied (2026-10-23).**
  Knowledge brain data (K1, 2026-10-21): the only per-term, per-person
  record is `term-reviews/{who__termId}` (box 0-5, reviewCount, misses,
  lastResult, lastAt, nextReviewAt; latest state only, no history), fed by
  Term Review, Daily Drill round 2 and Doctor Prep flashcards
  (`prepMark`). Quiz practice (`ih_practice_v1`) is per question by
  CoreCHI exam domain, not glossary domain; `quiz-history`, `ih_warmup`,
  `ih_memory` hold nothing per term. S4: if glossary taps need more,
  draw fewer than 120 cards up front, a visible change, so ask Jose
  first. Home styles in layers: the greeting name, quote, name row, text
  block and banner are each one block; left as they are on purpose: the
  photo drift and scrim (one rule per mode), section heads, tile names
  and card titles (one per breakpoint); fold those when someone touches
  them. Method: list every rule for the element with its media context
  (comments stripped), work out the winner per breakpoint, write one
  block, delete the rest, then prove computed styles and boxes identical
  at 11 widths x short/long name x light/dark x penning (`Math.random`
  pinned) and the pixels at phone and computer size; Jose signs off.
- **Flaky WebKit tests, fixed.** dock-tuck's "Dr. Smiley shrinks with the
  bar" read his size mid-breath (fixed 2026-10-19: the loops are held at their
  start while he is measured, and the read waits for his scale to rest).
  startup-work's "afterwards the name itself is shown" failed twice on
  2026-10-20 (runs 39394492541, 39397824186) on PRs that don't touch Home:
  the pen moves 64 ms a frame at most, so a CI browser drawing ~3 frames a
  second stretched a 4 s pen past the test's 20 s. Fixed the same day: the
  pen has a wall clock (`cap` in home-polish.js, max(12 s, 4 x its length))
  that shows the name whatever the frames do, and the test waits up to 40 s
  and prints how long it took. 2026-11-08 (#253's red run, 36.7 s): each hand-over
  (`adopt`, Home building a new greeting mid-writing) started that wall clock afresh;
  one deadline now carries over (`end` in `write`), checked with Home rebuilt every 3 s
  at 2 fps (34.3 s before, 12.1 s after). A WebKit red on an unrelated PR: re-run once,
  then read the log; it names the suite and the check. A WebKit job
  "cancelled" at its 20-minute limit while installing the browser (#129,
  and #131 twice, 2026-10-23) was still in `playwright install --with-deps
  webkit` (its log ends with that process killed at cleanup). Cause found
  2026-10-26 (#158, #160 both runs): apt pulling ~117 MB (181 packages,
  fonts and media codecs) from azure.archive.ubuntu.com at ~40 KB/s. Since
  then the job runs inside Playwright's image
  (`mcr.microsoft.com/playwright:v1.56.1-noble`), which has WebKit and its
  packages; **bump that tag with `playwright` in `tests/package.json`**.

- **Proving a CSS move with computed styles: sort the properties.**
  `getComputedStyle` lists custom properties in the order the sheets
  declared them, so moving a sheet (inline to a file) reorders the list
  and every element's fingerprint changes with no value changed
  (2026-10-21). And compare against a second run of the old version: chat
  timestamps, the tab bar's lens and Home text under a sheet differ
  between two runs of the same code.
- **The suites can't see network cost**: the harness answers every file
  from memory at once. `tests/tools/first-paint.cjs` serves real files
  over Chromium's throttled network (2026-10-21).
- **`brain/data.json` is a snapshot** of the census, not live: refresh it
  with `cd tests && node tools/brain-data.cjs` (`--check` tells). A section
  the tool doesn't list goes to the cortex; a renamed one is reported.
- **The test harness serves only `/`** for the app's own origin; a suite
  that opens another page of ours (`brain/`) routes it itself
  (`humc-brain.cjs`).
- **The census (`tests/tools/census.cjs`)** counts a use only by name: a
  `window[name]` lookup or a name built in a string is invisible to it,
  and it says nothing about run order. A banner put inside a function is
  not a section; the census prints "Banner inside code" for one at the
  left edge. Proving a comments-only change to `index.html`: tokenize the
  inline scripts with acorn (comments are skipped) and compare old and
  new, plus the markup with the scripts cut out (2026-10-21: 226,941
  tokens each, identical).
- Recording a smooth, sharp clip of an animation from the tests' Chromium:
  `recordVideo` and the CDP screencast give CSS-pixel frames (blurry), and
  screenshots in a loop run at about 4 fps. What works: CSS `zoom: 3` on
  the element (re-rendered sharp), then slow time: `page.clock.install()`,
  CDP `Animation.setPlaybackRate` 0, and for each frame a cropped
  screenshot, every animation's `currentTime` moved on 1/60 s and
  `page.clock.runFor(17)` (the engine's timers). Every beat is caught.
  Pinch zoom is refused by the app's viewport.
- **Then two chats did M2 at once, the same evening (2026-10-19).** #73 and
  `claude/m2-memory-trainer-alt` (dropped, Jose's call; the branch stays
  on the remote, unmerged). Both chats checked the remote branches before
  starting and found nothing: the check only catches a chat that has
  already pushed. **So: push the phase's branch (an empty commit is fine)
  the moment you take the phase**, before reading code, and look at
  `git ls-remote --heads origin 'claude/*'` right before that push.
- **Two chats did M1 at once (2026-10-19).** #69 (`memory/lines.json`,
  approved) and #70 (closed, a second set with its own review page) were
  built in parallel from the same PLAN. Before taking a phase: fetch
  `main`, then look at the open PRs and the remote `claude/*` branches
  (`git ls-remote --heads origin 'claude/*'`); a branch named for the phase
  means another chat has it. Remote `claude/*` branches can't be deleted
  from a cloud session (the proxy drops delete pushes); Jose deletes them
  on GitHub or they stay.
- **The live site can't be fetched from a cloud session** (2026-10-19): the
  proxy answers 403 for interp-six.vercel.app and Vercel's file API refuses.
  What works: `list_deployments` (Vercel tools) gives the production
  deployment's commit and state; that commit's `BUILD_ID` is the live one.
  On 2026-10-20 `list_deployments` refused too (403, team scope
  "language-services"). What still worked then: GitHub's status API through
  curl (`https://api.github.com/repos/jvtomax99/Interp/commits/<sha>/status`),
  where the context "Vercel" with "Deployment has completed" means that
  commit is live. For a real page check, Jose adds the host under the
  environment's Allowed domains.

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
  His scroll sway too (2026-11-07, #248's red run): `smileySway` leans
  `.dock-smiley` with an inline `rotate` written each frame, and on CI's
  WebKit it outlasted `settle()`'s 3 s cap; a 0.17 degree lean read him
  70.29 px for 70.08, so the scale ratio missed by 0.0024 (allowed 0.002).
  `rects()` now takes the inline rotate off for the read and puts it back in
  the same task; `settle()` logs "still moving after 3 s" when it gives up.
  #245's red run was the page (or browser) dying while it loaded ("has
  been closed" on the first evaluate, nothing checked yet): the harness logs
  a page crash, and dock-tuck opens the page again once, a second death
  still fails.
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

- Add to glossary's domain matcher (`findBestDomainMatch`) misses
  Cardiology, Psychiatry, OB/GYN, ENT and more (word overlap only). The
  doctor page uses `doctorDomainFor` (hints first). Moving Add to glossary
  onto it is a small follow-up; it changes where new terms are filed.
- This container has no WebKit (and must not run `playwright install`); the
  `webkit` CI job runs the doctor page, dock-tuck and startup-work suites
  in it, inside Playwright's image (its tag follows `tests/package.json`). `BROWSER=webkit` in
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
  It hit 100% on 2026-11-04: each deployment ~54 MB (36 MB `atlas/`, 11 MB
  `media/`), about 10 deployments a day, and 208 still listed back to
  10-17, so the 1-week production setting above was not holding (not
  explained: the setting isn't readable from the Vercel connector). Of
  the last 100 only 44 were bumps; the rest repeated the same app or
  changed only docs. Fixed: `ignoreCommand` in `vercel.json`, only "Bump
  version" commits deploy. Not done: moving `atlas/` and `media/` out of
  the deployment (would take each one from 54 MB to about 10 MB).
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
- Springs (S5, 2026-10-20): Apple's model, WWDC23 "Animate with springs"
  (stiffness = (2π/duration)², damping ratio = 1 - bounce) and WWDC18
  "Designing Fluid Interfaces" (100% damping on a tap; 80% only when a
  gesture carries momentum). Bounce 0 as CSS: `linear(0, 0.094, 0.274,
  0.456, 0.609, 0.727, 0.813, 0.874, 0.916, 0.945, 0.964, 0.977, 0.985,
  0.99, 0.994, 0.996, 0.998, 0.998, 1)`, CSS duration = 1.47 x Apple's
  (press .25 s -> .368s, screen .4 -> .588s, sheet .45 -> .662s); a
  swipe-dismiss would be bounce 0.2 (.607s, 1.5% past). Chromium
  serializes it as `linear(0 0%, 0.094 5.56%, ...)`. Later, sheets only: a
  JS spring that keeps the finger's speed (CSS can't).
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
- Cleanup audit, 2026-11-11 (`docs/CLEANUP.md`). `npx knip` and `npx
  depcheck` are no use on the app: with no import lines they call nearly
  every file unused (81 in `tests/`, 57 in `promo/`); their one real
  finding was a package `tests/tools/rules-e3.mjs` needs. What works: count
  every function, constant and class name across the repo by script, then
  check by hand for names inside `onclick="..."` and names built from
  pieces (`'is-' + state`, `'ds-fx-' + kind`, `'op-' + look`,
  `city/${key}-paint${n}.webp`). Checked clean then: every picture, clip
  and sound is used; all 110 paths in `sw.js`'s list exist; every suite is
  in `run.cjs`; `home-polish.css` has no unused class.
- `startup-work`'s rare red in GitHub's WebKit job is the page crashing,
  not a wrong result (2026-11-11, #266's first run): "Target page, context
  or browser has been closed [the page crashed]", 32.9 s after the pen
  appeared, the same 32 s as on `main` (a0d66e0) the day before. The six
  Chromium jobs passed and the one re-run of `webkit` passed with no
  change. Not known: why WebKit's page dies about 32 s into the hello.
- The WebKit "crash" on Home is a freeze, then WebKit's kill (2026-11-11,
  `tests/tools/webkit-crash.cjs`, runs 42940783637 and 42943466243 of the
  "WebKit crash probe" job). The page stops answering 1 to 6 s after it
  opens, memory flat (about 600 MB at 1x), and is killed 18 to 28 s later.
  In round two 27 of 300 opens froze with animations on; with Reduce
  Motion 0 of 80 over rounds one and two.
  Not the cause: the pen's worker, any worker, OffscreenCanvas, the pen
  (Dr. Smiley Still froze 8 of 60 with no pen), memory, or a stuck call
  (every traced call had returned). In that browser the page draws about
  5 frames a second at 3x and holds about 1.3 GB.
  Third round (run 42995104071): it follows the hello's canvas
  (`.home-wave-canvas`, `home-polish.js`). With every canvas hidden 0 of
  60 froze, though the script still drew into it; petals hidden 8 of 60,
  all CSS animations off 8, no filters or blur 10, Dr. Smiley's CSS
  animations off 1, unchanged 4 (each of 60). All three rounds, 880
  opens: 0 of 200 froze with no canvas on screen (Reduce Motion 140,
  canvases hidden 60), 62 of 680 with it (4 of 80, 27 of 300, 31 of 300). So the drawing code
  does not hang; this WebKit build (Linux, WPE) freezes putting a canvas
  that changes every frame on screen. That part of WebKit is different
  code on an iPhone, and Jose's phone test says iPhones don't do it: 0
  freezes in 30 full closes and opens (2026-11-11, Reduce Motion off). So
  the hello was left as it is, and `startup-work.cjs`'s first open now
  says when the browser froze and opens once more, in the WebKit job only
  (two freezes in a row
  still fail; a page that answers and shows the wrong thing still fails).
  Its later opens have no such retry: neither red run was there. To
  measure again: Actions, "WebKit crash probe", Run workflow.
