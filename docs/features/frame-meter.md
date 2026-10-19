# Smoothness meter (frame-drop meter)

A phone-side check of how smooth the app runs, so a speed change (the S
steps in `docs/PLAN.md`) can be compared before/after on a real iPhone
without a Mac. The app has no Settings screen; it lives at the bottom of
**More**, just above the build number, where the other diagnostics are.

Code: block "Smoothness meter" in `index.html` (after `screenReport`), CSS
block of the same name next to the More sheet styles, overlay
`#frameMeterOverlay`. Suite: `tests/suites/frame-meter.cjs`.

## How it works

- **Measure smoothness** closes More and starts a `requestAnimationFrame`
  loop. A solid pill under the top bar shows the time and a live drop
  count; tapping it stops the run (`frameMeterStop`) and opens the results.
  Runs stop by themselves after 5 minutes.
- Every frame's gap is stored with the screen (`activeCategory`, read 4x a
  second) and whether a scroll happened in the last 200 ms.
- The refresh rate is the run's middle gap, snapped to 120/90/60/30 Hz
  (30 = Low Power Mode; the results say so). A gap rounding to n intervals
  is n - 1 dropped frames; anything past one interval in such a gap is
  hitch time.
- The headline is Apple's hitch-time ratio (WWDC20, "Eliminate animation
  hitches with XCTest", https://developer.apple.com/videos/play/wwdc2020/10077/,
  checked against the transcript 2026-10-17): ms of hitches per second, under
  5 good, 5-10 users notice, 10 or more distracting. Apple times frames late
  on screen; the meter times the page's own frames, so its number is for
  comparing runs, not a reading of Apple's. Below it: dropped %, worst stall,
  stalls over 100 ms, then the same per screen and "While scrolling".
- **Longest stalls** (S7, 2026-10-19): every frame over 50 ms
  (`FM_STALL_MS`) is kept with its time into the run, time since the last
  scroll, screen, time since the app opened, and what ran in it. The six
  longest go in the results and in Copy numbers, in the order they came.
  "What ran": Safari has no long-task timing, so the app's jobs that can run
  while a screen is left alone say their name with `fmNote(tag)` (a no-op
  while the meter is off): `render`, `greeting word`, `heartline`
  (`home-polish.js`), `pins` (`applyExactPins`, `pin-icons.js`, runs after
  any insert on the page, the meter's own pill text included), `tab bar
  tuck` / `open`, `Dr. Smiley <performance>`, `time labels`, `time of day`,
  `glossary saved`, `data: terms` / `domains` / `team points` / `chat` /
  `activity` / `team`, `meter` (its own pill update), `More closing` (the
  start). A stall lists the names said in it or in the frame just before
  (a frame held up by a block still carries the time it was due, so the
  stall shows one frame late). "Nothing named": the browser's own work
  (style, layout, paint, memory) or a job without a name yet; add an
  `fmNote` where a new suspect runs.
- Time with the app hidden is left out (visibilitychange). Runs under 30
  frames are not saved.
- Runs are kept on the phone only, `ih_frameMeter` (last 8, each with
  `BUILD_ID`, device, Hz, Reduce Motion / Still). More lists the last 4;
  tapping one reopens it. **Copy numbers** copies a plain-text report to
  paste into a chat.

## What it can and can't see

It times the page's own frames, so it sees what the main thread delays:
handlers, style, layout, paint, long tasks. An animation Safari runs on
Core Animation (transform/opacity) can stay smooth through a stall it
reports. Read a drop in hitches after a transform-only change as the main
thread being freed, not as the animation itself getting smoother.

The loop itself makes the page produce a frame every vsync (see PLAN
Facts), so a measured run costs a little more than an unmeasured one. Same
cost every run, so before/after comparisons hold. For a fair comparison:
same steps, same phone, Low Power Mode off, app opened fresh.
